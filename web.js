var express = require('express'),
    connect = require('connect'),
    api = require('./lib/api.js'),
    filterTitles = require('./lib/filterTitles.js'),
    and = require('./lib/womitter.js').and,
    app = module.exports = express.createServer(),
    _ = require('./lib/underscore_mixins.js').init(require('underscore')),
    accessors = require('./lib/accessors.js'),
    assetManager = require('connect-assetmanager'),
    assetHandler = require('connect-assetmanager-handlers'),
    helpers = require('./lib/helpers.js'),
    dynamicHelpers = require('./lib/dynamicHelpers.js'),
    __logger = require('log4js').getLogger('web.js');

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
  'arcnav.js',
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
  
  app.set('cacheHeader', 'public, max-age=3600'); // 1 hour
});


// add helpers from the lib directory
app.dynamicHelpers(dynamicHelpers);
app.helpers(helpers);


var beforeFilter = function(req, res, next) {
  __logger.info(req.method + ' ' + req.originalUrl);
  //Get query, filtering unwanted values
  var keep = 'Region Country Sector SectorCategory Funder orderby ID'.split(' ');
  req.filter_query = _.only(req.query, keep);
  
  // xhr is only used to allow ajax caching to not clash
  // with page caching
  delete req.query.xhr
  
  req.queryString = req.originalUrl.split('?')[1] || '';
  req.isXHR = req.headers['x-requested-with'] == 'XMLHttpRequest';
  
  res.header('Cache-Control',app.settings.cacheHeader || 'no-cache');
  
  next();
};

//Routes

app.get('/', beforeFilter, function(req, res, next) {
  var params = {
    result: 'values',
    groupby: 'Funder'
  };
  
  new api.Request(params)
    .on('success', function(data) {
      res.render('index', {
        filter_paths: req.filter_paths,
        funders: _(data.Funder).as_array().length,
        layout: !req.isXHR
      });
    })
    .on('error', function(e) {
      next(e);
    })
    .end();
});

app.get('/arcnav', beforeFilter, function(req, res, next) { 
  var filters = _.only(req.query, 'Region Country Sector SectorCategory Funder'.split(' '));
  
  new filterTitles.Request(filters)
    .on('success', function(expanded){
      res.send(expanded);
    })
    .on('error', function(e){
      next(e);
    })
    .end();
});


app.get('/activities', beforeFilter, function(req, res, next) {
  var list = req.query.view == 'list';
  var page = parseInt(req.query.p || 1, 10);
  var params = {
    result: list ? 'list' : 'values',
    pagesize: app.settings.pageSize, 
    start: ((page - 1) * app.settings.pageSize) + 1
  };

  _.extend(params, req.filter_query);
  new api.Request(params)
    .on('success', function(data) {
      var dataFile = accessors.dataFile(data);
      var total = dataFile.totalActivities();
      var pagination = (total <= app.settings.pageSize) ? false : {
        current: parseInt(req.query.p || 1, 10),
        total: Math.ceil(total / app.settings.pageSize)
      };
      
      delete req.query.view;
      res.render('activities' + (list ? '-list' : ''), {
        title: 'Activities',
        page: 'activities',
        filter_paths: req.filter_paths,
        query: req.query,
        activities: dataFile.activities(),
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
  
  new filterTitles.Request(filters)
    .on('success', function(expanded){
      // get the names of the filters
      // {Sector:{ID:'NAME1'}, Funder:{ID:'Other Name'}} => ['NAME1', 'Other Name']
      var keys = _.flatten(_.map(expanded, function(sectors,_k){
        return _.values(sectors);
      }));
      
      res.render('data-file-embed',{
        keys:keys,
        layout:false
      });
    })
    .on('error', function(e){
      next(e);
    })
    .end();
});


app.get('/data-file', beforeFilter, function(req, res, next) {
  var params = { result: 'summary', groupby: 'All' };
  
  _.extend(params, req.filter_query);
  
  var filters = _.only(req.query, 'Region Country Sector SectorCategory Funder'.split(' '));
  
  // the requests that have to be made for this page
  var requestDatafile = api.Request(params);
  var requestFilters  = filterTitles.Request(filters);
  
  new and('success', requestDatafile, requestFilters)
    .on('success', function(data, filters) {
      
      // get the names of the filters
      // {Sector:{ID:'NAME1'}, Funder:{ID:'Other Name'}} => ['NAME1', 'Other Name']
      var keys = _.flatten(_.map(filters, function(sectors,_k){
        return _.values(sectors);
      }));
      
      var dataFile = accessors.dataFile(data);
      var summaries = dataFile.transactionSummaries();

      res.render('data-file', {
        title: 'Data File',
        page: 'data-file',
        keys: keys,
        filter_paths: req.filter_paths,
        query: req.query,
        total_budget: summaries['C'],
        total_spend: summaries['D'] + summaries['E'] + summaries['R'],
        total_activities: dataFile.totalActivities(),
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
  if (req.query.view != 'embed') return next();
  
  api.Request({ID: req.params.id , result: 'list'})
    .on('success', function(data) {
      var activity = accessors.activity(data);
      res.render('activity-embed', {
        activity: activity,
        layout: false
      });
    })
    .on('error', function(e) {
      next(e);
    })
    .end();
});


app.get('/activity/:id', beforeFilter, function(req, res, next) {
  api.Request({ID: req.params.id, result: 'details'})
    .on('success', function(data) {
      var activity = accessors.activity(data);
      var summaries = activity.transactionSummaries();
      
      res.render('activity', {
        activity: activity,
        budget: summaries['TB'],
        commitments: summaries['C'],
        spend: summaries['D'] + summaries['E'] + summaries['R'],
        repayments: summaries['LR'] + summaries['IR'],
        layout: !req.isXHR
      });
    })
    .on('error', function(e) {
      next(e);
    })
    .end();
});


app.get('/filter/:filter_key', beforeFilter, function(req, res, next) {
  var filterKey = req.params.filter_key; // eg SectorCategory (to use in requests)
  var filterName = filterKey // eg Sector Catgory (to use in titles)
    .replace(/[a-z][A-Z]/g, function(match) {return match[0] + " " + match[1]; });
  var filterTypes = {
    "Sector Category": "sector",
    "Sector": "sector",
    "Funder": "funder",
    "Country": "country",
    "Region": "region"
  };
  
  var params = {result: 'values', groupby: filterKey};
  _.extend(params, req.filter_query);
  delete params[filterKey];
  
  new api.Request(params)
    .on('success', function(data) {
      res.render('filter', {
        choices: accessors.filter(data, filterKey),
        key: filterKey,
        name: filterName,
        type: filterTypes[filterName],
        title: 'Filter by ' + filterName,
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


app.get('/search', beforeFilter, function(req, res, next) {
  api.Request({search: req.query.q, result: 'values'})
  .on('success', function(data) {
    res.render('search', {
      activities:_.as_array(data['iati-activity']),
      count:data['@activity-count'],
      layout: !req.isXHR
    });
  })
  .on('error', function(e) {
    next(e);
  })
  .end();
  
});


var widgets = require('./widgets.js');
widgets.init(app, beforeFilter, api, _, accessors);


//Only listen on $ node app.js
if (!module.parent) {
  app.listen(process.env.PORT || 3000);
  console.log("Express server listening on port %d", app.address().port);
}