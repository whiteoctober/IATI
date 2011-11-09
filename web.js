var express = require('express'),
    connect = require('connect'),
    api = require('./lib/api.js'),
    app = module.exports = express.createServer(),
    querystring = require('querystring'),
    url = require('url'),
    _ = require('underscore'),
    assetManager = require('connect-assetmanager'),
    assetHandler = require('connect-assetmanager-handlers');

// all the script files that should be served to the client
var clientScripts = [
  'lib/jquery.js', 
  'lib/jquery.form.min.js', 
  'lib/d3.min.js', 
  'lib/d3.layout.min.js', 
  'lib/jquery.history.js', //causes problems when minified
  'lib/jquery.transform.min.js', 
  'lib/zynga/Animate.js', 
  'lib/zynga/Scroller.js', 
  'lib/zynga/Engine.js', 
  'lib/zynga/Style.js',
  'lib/seedrandom.js',
  'bubble.jquery.js', 
  'zoom.js', 
  'plugins.js', 
  'script.js'
];

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
    title: 'IATI data browser',
    clientScripts: clientScripts,
  });
  
  /* todo
  app.use(assetManager({
    'js':{
      'route' : /\/static\/js\/[0-9]+\/.*\.js/,
      'path': './public/javascripts/',
      'dataType': 'javascript',
      'files': clientScripts,
      'postManipulate': {
          '^': [assetHandler.uglifyJsOptimize]
      }
    }
  }));
  */
  
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
});

app.configure('production', function(){
  app.use(express.errorHandler()); 
});

_.mixin({
  // to wrap singular responses in array
  as_array:function(obj_or_array){
    return obj_or_array === undefined ? [] : (_.isArray(obj_or_array) ? obj_or_array : [obj_or_array]);
  }
})

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

app.get('/activities', beforeFilter, function(req, res, next){
  
  var start = ((req.query.p || 0) * app.settings.pageSize) + 1;
  
  var params = {result:'values', pagesize:app.settings.pageSize, start:start};
  
  _.extend(params, req.filter_query);
  
  new api.Request(params)
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
      activities: _.as_array(data['iati-activity']),
      actitity_count: total,
      current_page: req.query.p || 1,
      pagination: pagination,
      layout: !req.isXHR
    });
  })
  .on('error', function(e){
    next(e);
  })
  .end();



});

app.get('/activity/:id', beforeFilter, function(req, res, next){
  
  api.Request({ID:req.params.id, result:'full'})
    .on('success', function(data){
      res.render('activity', {
        activity: data['iati-activity'],
        layout: !req.isXHR
      });
    })
    .on('error', function(e){
      next(e);
    })
    .end();
});


app.get('/filter/:filter_key', beforeFilter, function(req, res, next){
  var filter_key = req.params.filter_key;
  
  var params = {result:'values', groupby:filter_key};
  
  _.extend(params, req.filter_query);
  
  new api.Request(params)
    .on('success', function(data){
      res.render('filter', {
        choices: _.as_array(data[filter_key]),
        key: filter_key,
        title: 'Filter by ' + filter_key,
        page: 'filter',
        layout: !req.isXHR
      })
    })
    .on('error', function(e){
      next(e);
    })
    .end();
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
