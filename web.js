var express = require('express'),
    connect = require('connect'),
    api = require('./lib/api.js'),
    app = module.exports = express.createServer(),
    querystring = require('querystring'),
    url = require('url'),
    _ = require('underscore');

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  
  app.use(connect.compiler({ 
    src: __dirname + '/public', 
    enable: ['less'] })
  );
  
  app.use(express.static(__dirname + '/public'));
  
  //custom app settings
  app.set('pageSize', 20);
  
  app.set('view options', {
    title: 'IATI data browser'
  });
  
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
});

app.configure('production', function(){
  app.use(express.errorHandler()); 
});


app.dynamicHelpers({
  // adds parameters to the url
  url_with:function(req,res){
    return function(pathname, params){
      
      // parse the current url along with the query string
      var parsedUrl = url.parse(req.originalUrl,true);
      
      if(pathname){
        parsedUrl.pathname = pathname;
      }
      
      if(params){
        // default to empty query object and remove search query 
        // so it's not used to generate the url
        parsedUrl.query = parsedUrl.query || {};
        delete parsedUrl.search;
        
        // assign the new parameters
        _.extend(parsedUrl.query, params);
      }
      
      //remove the xhr param (this is used as a work around for cache issues)
      if(parsedUrl.query && parsedUrl.query.xhr){
        delete parsedUrl.query.xhr;
        delete parsedUrl.search; //force the query to be used
      }
      
      // return the formatted url
      return url.format(parsedUrl);
    };
  }
});

// Routes

var beforeFilter = function(req, res, next){
  
  //assign the filter query
  
  var keep = 'Region Country Sector SectorCategory Funder'.split(' ');
  
  req.filter_query = _.reduce(req.query, function(memo, value, key){
    if(_.include(keep, key)) memo[key] = value;
    
    return memo;
  },{});
  
  
  req.queryString = req.originalUrl.split('?')[1] || '';
  
  
  //assign xhr
  req.isXHR = req.headers['x-requested-with'] == 'XMLHttpRequest';
  
  next();
};

app.get('/', beforeFilter, function(req, res){
  res.render('index', {
    title: 'Home',
    page: 'home',
    filter_paths: req.filter_paths,
    layout:!req.isXHR
  });
});

app.get('/activities', beforeFilter, function(req, res){
  
  var start = ((req.query.p || 0) * app.settings.pageSize) + 1;
  
  var params = {result:'values', pagesize:app.settings.pageSize, start:start};
  
  _.extend(params, req.filter_query);
  
  new api.apiCall(params)
  .on('success', function(data){
    
    var total = data['@activity-count'];
    var pagination = (total <= app.settings.pageSize) ? false : {
      current: parseInt((req.query.p||1), 10),
      total: Math.ceil(total / app.settings.pageSize)
    };
    
    var view = req.query.view;
    delete req.query.view;
    res.render(view == 'data' ? 'data-file' : 'activities', {
      title: 'Activities',
      page: 'activities',
      filter_paths: req.filter_paths,
      query: req.query,
      activities: data['iati-activity'] || [],
      actitity_count: total,
      current_page: req.query.p || 1,
      pagination: pagination,
      layout: !req.isXHR
    });
  })
  .on('error', function(e){
    res.end('api error');
  });



});


app.get('/filter/:filter_key', beforeFilter, function(req, res){
  var filter_key = req.params.filter_key;
  
  new api.apiCall({result:'values', groupby:filter_key})
    .on('success', function(data){
      res.render('filter', {
        values: data[filter_key],
        key: filter_key,
        title: 'Filter by ' + filter_key,
        page: 'filter',
        layout: !req.isXHR
      });
      
    });
});

app.get('/list', beforeFilter, function(req, res){
  res.render('activities-list', {
    layout:!req.isXHR
  });
});


// Only listen on $ node app.js

if (!module.parent) {
  app.listen(process.env.PORT || 3000);
  console.log("Express server listening on port %d", app.address().port);
}
