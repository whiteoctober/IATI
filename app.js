var express = require('express'),
    api = require('./lib/api.js'),
    apidev = require('./lib/api-dev.js'),
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
  app.use(express.static(__dirname + '/public'));
  
  //custom app settings
  app.set('pageSize', 20);
  
  
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
      
      // return the formatted url
      return url.format(parsedUrl);
    };
  }
});

// Routes

var getFilters = function(req, res, next) {
  
  var keep = 'Region Country Sector SectorCategory Funder'.split(' ');
  
  req.filter_query = _.reduce(req.query, function(memo, value, key){
    if(_.include(keep, key)) memo[key] = value;
    
    return memo;
  },{});
  
  
  req.queryString = req.originalUrl.split('?')[1] || '';

  next();
};

app.get('/', getFilters, function(req, res){
  res.render('index', {
    title: 'Home',
    page: 'home',
    filter_paths: req.filter_paths
  });
});

app.get('/activities', getFilters, function(req, res){
  var xhr = req.headers['x-requested-with'] == 'XMLHttpRequest';
  
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
      layout: !xhr
    });
  })
  .on('error', function(e){
    res.end('api error');
  });



});


app.get('/filter/funder', getFilters, function(req, res){
  
  var xhr = req.headers['x-requested-with'] == 'XMLHttpRequest';
  var filter = 'Funder';
  
  new api.apiCall({result:'values', groupby:'Funder'})
    .on('success', function(data){
      res.render('filter2', {
        values: data.Funder,
        key: 'Funder',
        title: 'Filter by ' + filter,
        page: 'filter',
        currentFilter: filter,
        query: req.query,
        filters: apidev.filterValues(filter, req.query),
        layout: !xhr
      });
      
    });
});


app.get('/filter/:filter', getFilters, function(req, res){
  var xhr = req.headers['x-requested-with'] == 'XMLHttpRequest';
  var filter = req.params.filter;
  
  res.render('Filter', {
    title: 'Filter by ' + filter,
    page: 'filter',
    filter_paths: req.filter_paths,
    currentFilter: filter,
    query: req.query,
    filters: apidev.filterValues(filter, req.query),
    layout: !xhr
  });
});

// Only listen on $ node app.js

if (!module.parent) {
  app.listen(3000);
  console.log("Express server listening on port %d", app.address().port);
}
