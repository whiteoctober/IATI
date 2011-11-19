var api = require('./api.js'),
    _ = require('underscore'),
    __logger = require('log4js').getLogger('filterTitles.js');

/*

  This is for 'padding out' a filter list
  
  it will convert :
  
    { SectorCategory: '210', Funder: 'GB' }
  
  into something like :
  
    { SectorCategory: [ 'TRANSPORT AND STORAGE' ], Funder: [ 'UNITED KINGDOM' ] }
  
  
  This involves firing off a api request for every key that is present, and the partially
  found data is stored while the rest are coming in (not good),  if there is a better api
  request to use - this should be rewritten
  
  
  usage:
  
  filterTitles.Request({ SectorCategory: '210', Funder: 'GB' })
    .on('success', function(updated_filters){
      
    })
    .end() // to fire the requests
  
  no error events are fired (erroring api requests result in the name being 'unknown')

*/
var Request = function(filters){
  
  // make 'new' optional
  if (!(this instanceof Request)) return new Request(filters);
  
  this.filters = filters;
  
};


Request.prototype = new process.EventEmitter();

Request.prototype.end = function(){
  var _this = this;

  // all the responses
  var data = {};

  var addToCache = function(key, apidata){
    data[key] = {};
    _.each(apidata[key], function(result){
      data[key][result.code] = result.name;
    });
  };
  
  // map the filters to a list of requests that will 
  // update the data when they complete
  var requests = _.map(this.filters, function(value, key){
    return api.Request({groupby:key, result:'values'})
      .on('success', function(data){
        addToCache(key, data);
      });
  });
  
  
  // when all the counts return, then finish
  var count = requests.length;
  var end = function(){
    // only continue when all requests are in
    if(--count) return;
    
    var updated = {};
    _.each(_this.filters, function(value, key){
      var values = _.isArray(value) ? value : [value];
      updated[key] = values.map(function(v){
        return data[key][v] || 'unknown';
      });
    });
    // console.log(_this.filters, '->', updated);
    _this.emit("success", updated);
      
    
  };
  
  
  // add callbacks and fire
  _.each(requests, function(r){
    r
      .on('success', end)
      .on('error', end)
      .end();
  });
  
  
};


exports.Request = Request;