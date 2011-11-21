var express = require('express'),
    connect = require('connect'),
    api = require('./lib/api.js'),
    filterTitles = require('./lib/filterTitles.js'),
    and = require('./lib/womitter.js').and,
    app = module.exports = express.createServer(),
    _ = require('underscore'),
    assetManager = require('connect-assetmanager'),
    assetHandler = require('connect-assetmanager-handlers'),
    helpers = require('./lib/helpers.js'),
    dynamicHelpers = require('./lib/dynamicHelpers.js');

//All the script files that should be served to the client
var clientScripts = [
  'lib/jquery.js', 
  'lib/jquery.history.js',
  'lib/seedrandom.js',
  'lib/underscore.js',
  'dashboard.js',
  'packLayout.js',
  'bubble.jquery.js', 
  'zoomer.js', 
  'scroller.js',
  'plugins.js', 
  'script.js'
];

//Set the cache to the time at which the app was started.
//Ideally this would be a hash of the script files or 
//the most recent modification date
var cacheKey = (new Date()).getTime();
var clientScripts_combined = ['../static/js/' + cacheKey + '/client.js'];


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
  
  //Custom app settings
  app.set('pageSize', 20);
});


app.configure('development', function() {
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
  
  app.set('view options', {
    title: '[DEV] Aid View',
    clientScripts: clientScripts
  });
});


app.configure('production', function() { 
  //Combination and minification of static files
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
  
  app.use(express.errorHandler()); 
  
  app.set('view options', {
    title: 'Aid View',
    clientScripts: clientScripts_combined
  });
});


_.mixin({
  //Returns an array by wrapping non-arrays in an array
  as_array: function(something) {
    return something === undefined ? [] : (_.isArray(something) ? something : [something]);
  },
  
  //Sums an array of values
  sum: function(array) {
    return _(array).reduce(function(a, b) { return a + b; }, 0);
  },
  
  //Returns an object (shallow clone) with only the specified keys
  only: function(obj, keptKeys){
    var next = {};
    _.each(obj, function(value, key){
      if(_.include(keptKeys, key)){
        next[key] = value;
      }
    });
    return next;
  }
});


// add helpers from the lib directory
app.dynamicHelpers(dynamicHelpers);
app.helpers(helpers);


var beforeFilter = function(req, res, next) {
  //Get query, filtering unwanted values
  var keep = 'Region Country Sector SectorCategory Funder orderby ID'.split(' ');
  req.filter_query = _.only(req.query, keep);
  
  req.queryString = req.originalUrl.split('?')[1] || '';
  req.isXHR = req.headers['x-requested-with'] == 'XMLHttpRequest';
  
  //Sums all transactions for one or more activities with a particular code
  req.transactionsTotal = function(activities, code) {
    return _(activities).chain().as_array()
      .map(function(a) { 
        return _(a.transaction || []).chain()
          .filter(function(t) {
            return (t['transaction-type'] || {})['@code'] == code;
          })
          .map(function(t) { 
            return parseFloat(t.value["@iati-ad:USD-value"] || 0); 
          })
          .sum().value();
      })
      .sum().value();
  };
      
  //Sorts projects by start date
  req.newProjects = function(activities, limit) {
    return _(activities).chain()
      .sortBy(function(a) {
        var date = _(a['activity-date'] || []).find(function(t) {
          return (t["@type"]) == "start-actual";
        });
        return date ? Date.parse(date["#text"]) : 0;
      })
      .map(function(a) {
        return {
          description: a.title || "No description available",
          commitments: req.transactionsTotal(a, 'C')
        };
      })
      .value().slice(0, limit);
  };
  
  next();
};

//Routes

app.get('/', beforeFilter, function(req, res) {
  res.render('index', {
    filter_paths: req.filter_paths,
    layout: !req.isXHR
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
    var total = data['@activity-count'] || 0;
    var pagination = (total <= app.settings.pageSize) ? false : {
      current: parseInt(req.query.p || 1, 10),
      total: Math.ceil(total / app.settings.pageSize)
    };
    
    var view = req.query.view == 'list' ? 'activities-list' : 'activities';
    
    delete req.query.view;
    res.render(view, {
      title: 'Activities',
      page: 'activities',
      filter_paths: req.filter_paths,
      query: req.query,
      activities: activities,
      activity_count: total,
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
  if (req.query.view != 'embed') return next();
  
  var filters = _.only(req.query, 'Region Country Sector SectorCategory Funder'.split(' '));
  
  new filterTitles.Request(filters).on('success', function(expanded){
    
    // just the values of the filters
    var keys = _(expanded).chain().values().flatten().value();
    
    res.render('data-file-embed',{
      keys:keys,
      layout:false
    });
    
  }).on('error', function(e){
    next(e);
    
  }).end();
});


app.get('/data-file', beforeFilter, function(req, res, next) {
  var params = { result: 'full' };
  
  _.extend(params, req.filter_query);
  
  var filters = _.only(req.query, 'Region Country Sector SectorCategory Funder'.split(' '));
  
  // the requests that have to be made for this page
  var requestDatafile = api.Request(params);
  var requestFilters  = filterTitles.Request(filters);
  
  new and('success', requestDatafile, requestFilters)
  .on('success', function(data, filters) {
    var keys = _(filters).chain().values().flatten().value();
    
    var activities = _.as_array(data['iati-activity']);
    
    res.render('data-file', {
      title: 'Data File',
      page: 'data-file',
      keys: keys,
      filter_paths: req.filter_paths,
      query: req.query,
      activities: activities,
      total_budget: req.transactionsTotal(activities, 'C'),
      total_spend: req.transactionsTotal(activities, 'D') + req.transactionsTotal(activities, 'E'),
      activity_count: data['@activity-count'] || 0,
      current_page: req.query.p || 1,
      layout: !req.isXHR
    });
  })
  .on('error', function(e) {
    next(e);
  });
  
  requestDatafile.end();
  requestFilters.end();
});


app.get('/activity/:id', beforeFilter, function(req, res, next) {
  if(req.query.view != 'embed') return next();
  
  api.Request({ID:req.params.id, result:'full'})
    .on('success', function(data) {
      res.render('activity-embed', {
        activity: data['iati-activity'],
        layout: false
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
  var params = {result: 'values', groupby: filter_key};
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


var widgets = require('./widgets.js');
widgets.init(app, beforeFilter, api, _);


//Only listen on $ node app.js
if (!module.parent) {
  app.listen(process.env.PORT || 3000);
  console.log("Express server listening on port %d", app.address().port);
}