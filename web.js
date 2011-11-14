var express = require('express'),
    connect = require('connect'),
    api = require('./lib/api.js'),
    app = module.exports = express.createServer(),
    querystring = require('querystring'),
    url = require('url'),
    _ = require('underscore'),
    assetManager = require('connect-assetmanager'),
    assetHandler = require('connect-assetmanager-handlers'),
    helpers = require('./lib/helpers.js');

//All the script files that should be served to the client
var clientScripts = [
  'lib/jquery.js', 
  'lib/jquery.form.min.js', 
  'lib/d3.min.js', 
  'lib/d3.layout.min.js', 
  'lib/jquery.history.js', //Causes problems when minified
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


// set the cache to the time at which the app was started
// (ideally - this would be a hash of the script files or the
// most recent modification date)
var cacheKey = (new Date()).getTime();


app.configure(function() {
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
  
  
  // combination and minification of static files
  
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
    /* todo, problems:
        - no import inlining
        - fs *.css wont be written to fs until requested
    
    , 'css': {
      'route': /\/static\/css\/[0-9]+\/.*\.css/,
      'path': './public/stylesheets/',
      'dataType': 'css', 
      'files': ['style.css'],
      'preManipulate': {
        '^': [
          assetHandler.yuiCssOptimize,
          assetHandler.replaceImageRefToBase64(root)
        ]
      }
    }*/
  }));


  // set this to false to load the scripts as normal
  var clientScriptsCache = ['../static/js/' + cacheKey + '/client.js'];
  
  app.set('view options', {
    title: 'IATI data browser',
    clientScripts: clientScriptsCache || clientScripts,
  });
});

app.configure('development', function() {
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
});

app.configure('production', function() {
  app.use(express.errorHandler()); 
});

_.mixin({
  //Returns an array by wrapping non-arrays in an array
  as_array: function(something) {
    return something === undefined ? [] : (_.isArray(something) ? something : [something]);
  }
});

app.dynamicHelpers({
  query: function(req){
    return req.query;
  },

  //Adds parameters to the url
  url_with: function(req,res) {
    return function(pathname, params) {
      
      //Parse the current url along with the query string
      var parsedUrl = url.parse(req.originalUrl,true);
      
      if (pathname) {
        parsedUrl.pathname = pathname;
      }
      
      if (params) {
        //Default to empty query object and remove search query 
        //So it's not used to generate the url
        parsedUrl.query = parsedUrl.query || {};
        delete parsedUrl.search;
        
        //Assign the new parameters
        _.extend(parsedUrl.query, params);
      }
      
      //Remove the xhr param (this is used as a work around for cache issues)
      if (parsedUrl.query && parsedUrl.query.xhr) {
        delete parsedUrl.query.xhr;
        delete parsedUrl.search; //Force the query to be used
      }
      
      //Return the formatted url
      return url.format(parsedUrl);
    };
  }
});

app.helpers(helpers);

//Routes

var beforeFilter = function(req, res, next) {
  //Get query, filtering unwanted values
  var keep = 'Region Country Sector SectorCategory Funder orderby'.split(' ');
  req.filter_query = _.reduce(req.query, function(memo, value, key) {
    if (_.include(keep, key)) memo[key] = value;
    return memo;
  },{});
  
  req.queryString = req.originalUrl.split('?')[1] || '';
  req.isXHR = req.headers['x-requested-with'] == 'XMLHttpRequest';
  next();
};

app.get('/', beforeFilter, function(req, res) {
  res.render('index', {
    title: 'Home',
    page: 'home',
    filter_paths: req.filter_paths,
    layout:!req.isXHR
  });
});

app.get('/activities', beforeFilter, function(req, res, next) {
  var page = parseInt(req.query.p || 1, 10);
  var start = ((page - 1) * app.settings.pageSize) + 1;
  var params = {
    result: 'values',
    pagesize: app.settings.pageSize, 
    start: start
  };

  _.extend(params, req.filter_query);
  new api.Request(params)
  .on('success', function(data) {
    var activities = _.as_array(data['iati-activity']);
    var total = data['@activity-count'];
    var pagination = (total <= app.settings.pageSize) ? false : {
      current: parseInt(req.query.p || 1, 10),
      total: Math.ceil(total / app.settings.pageSize)
    };
    
    delete req.query.view;
    
    res.render(template, {
      title: 'Activities',
      page: 'activities',
      filter_paths: req.filter_paths,
      query: req.query,
      activities: activities,
      actitity_count: total,
      current_page: req.query.p || 1,
      pagination: pagination,
      layout: !req.isXHR
    });
  })
  .on('error', function(e) {
    next(e);
  })
  .end();
});

app.get('/data-file', beforeFilter, function(req, res, next) {
  var params = { result: 'full' };

  _.extend(params, req.filter_query);
  new api.Request(params)
  .on('success', function(data) {
    var activities = _.as_array(data['iati-activity']);
    var total = activities['@activity-count'];
    
    res.render('data-file', {
      title: 'Data File',
      page: 'data-file',
      filter_paths: req.filter_paths,
      query: req.query,
      activities: _.as_array(activities['iati-activity']),
      actitity_count: total,
      current_page: req.query.p || 1,
      layout: !req.isXHR
    });
  })
  .on('error', function(e) {
    next(e);
  })
  .end();
});

app.get('/activity/:id', beforeFilter, function(req, res, next) {
  api.Request({ID:req.params.id, result:'full'})
    .on('success', function(data) {
      res.render('activity', {
        activity: data['iati-activity'],
        layout: !req.isXHR
      });
    })
    .on('error', function(e) {
      next(e);
    })
    .end();
});

app.get('/filter/:filter_key', beforeFilter, function(req, res, next) {
  var filter_key = req.params.filter_key;
  var params = {result:'values', groupby:filter_key};
  _.extend(params, req.filter_query);
  
  new api.Request(params)
    .on('success', function(data) {
      res.render('filter', {
        choices: _.as_array(data[filter_key]),
        key: filter_key,
        title: 'Filter by ' + filter_key,
        page: 'filter',
        layout: !req.isXHR
      });
    })
    .on('error', function(e) {
      next(e);
    })
    .end();
});


app.get('/dashboard', beforeFilter, function(req, res, next){
  res.render('dashboard', {
    layout: !req.isXHR
  });
});


app.get('/list', beforeFilter, function(req, res) {
  res.render('activities-list', {
    layout: !req.isXHR
  });
});


app.get('/widgets/donors', beforeFilter, function(req, res) {
  _.extend(params, {groupby: 'Funder', orderby: 'values', result: 'values'});
    new api.Request(params)
      .on('success', function(data) {
        var max = 6;
        _(data.Funder).each(function(f) { 
          f.value = parseFloat(f.value); 
          f.name = f.name === null ? "Unknown" : f.name;
        });

        var funders = _(data.Funder).chain()
          .sortBy(function(f) { return -f.value; })
          .map(function(f) { return [f.name, f.value]; })
        .value();
        
        res.render('widgets/donors', {
          funders: JSON.stringify(funders),
          layout: 'widget'
        });
      })
      .on('error', function(e) {
        next(e);
      })
      .end();
});

//Only listen on $ node app.js
if (!module.parent) {
  app.listen(process.env.PORT || 3000);
  console.log("Express server listening on port %d", app.address().port);
}
