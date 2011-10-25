/**
 * Module dependencies.
 */

var express = require('express');
var api = require('./lib/api-dev.js');
var app = module.exports = express.createServer();

// Configuration

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
});

app.configure('production', function(){
  app.use(express.errorHandler()); 
});

// Routes

var getFilters = function(req, res, next) {
  req.queryString = req.originalUrl.split('?')[1] || '';
  req.filter_paths = {
    area: '/filter/f1?' + req.queryString,
    funder: '/filter/f2?' + req.queryString,
    sector: '/filter/f3?' + req.queryString
  };
  next();
}

app.get('/', getFilters, function(req, res){
  res.render('index', {
    title: 'Home',
    page: 'home',
    filter_paths: req.filter_paths
  });
});

app.get('/activities', getFilters, function(req, res){
  var xhr = req.headers['x-requested-with'] == 'XMLHttpRequest' 
  
	res.render('activities', {
    title: 'Activities',
    page: 'activities',
    filter_paths: req.filter_paths,
		query: req.query,
		activities: api.activities(req.query),
    layout: !xhr
	});
});

app.get('/filter/:filter', getFilters, function(req, res){
  var xhr = req.headers['x-requested-with'] == 'XMLHttpRequest' 
	var filter = req.params.filter;
  
	res.render('Filter', {
    title: 'Filter by ' + filter,
    page: 'filter',
    filter_paths: req.filter_paths,
		currentFilter: filter,
		query: req.query,
		filters: api.filterValues(filter, req.query),
    layout: !xhr
	});
});

// Only listen on $ node app.js

if (!module.parent) {
  app.listen(3000);
  console.log("Express server listening on port %d", app.address().port);
}
