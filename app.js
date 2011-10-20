/**
 * Module dependencies.
 */

var express = require('express'),
	api = require('./lib/api-dev.js');

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

app.get('/', function(req, res){
  res.render('index', {
    title: 'Express'
  });
});


app.get('/activities', function(req, res){
	
	var qs = req.originalUrl.split('?')[1] || '';
	
	res.render('activities', {
		title: 'Activities',
		q: req.query,
		qs: qs,
		activities : api.activities(req.query)
	});
});

app.get('/filter/:filter', function(req, res){
	
	var qs = req.originalUrl.split('?')[1] || '';
	
	var f = req.params.filter;
	res.render('Filter', {
		title: 'Filter:' + f,
		currentFilter: f,
		q: req.query,
		filters: api.filterValues(f,req.query)
	});
});

// Only listen on $ node app.js

if (!module.parent) {
  app.listen(3000);
  console.log("Express server listening on port %d", app.address().port);
}
