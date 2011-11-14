if (global.GENTLY) require = GENTLY.hijack(require);

var querystring = require('querystring'),
  eventEmitter = require('events').EventEmitter,
  request = require('request'),
  url = require('url'),
  Memcached = require('memcached');
  __logger = require('log4js').getLogger('api.js');

// note - url should end in '?' as appropriate
var endpoint = process.env.ENDPOINT || 'http://109.104.101.243:8080/exist/rest/db/apps/iati-api/xquery/woapi.xq?';

// do some basic checks on the endpoint
if (!url.parse(endpoint).host) {
  console.log("Warning: couldn't find a host form the endpoint url: \n\t" + endpoint);
} else if (endpoint.match(/\?$/) === null) {
  console.log("Warning: the api endpoint should probably end in a '?': \n\t" + endpoint);
}


// memcached things
var cache = false;
if(process.env.MEMCACHE_SERVERS){
  
  // heroku also supplies _USERNAME and _PASSWORD envs, which 
  // the memcached module doesn't seem to support
  var memcached = new Memcached(process.env.MEMCACHE_SERVERS);
  
  
  cache = {
    get:function(opts, callback){
      var cacheKey = opts.uri;
      
      memcached.get(cacheKey, function(err, value){
        if(value){
          //cache hit
          
          callback(false, {statusCode:200}, value);
          
          __logger.info(">>cache hit");
          
        } else {
          //cache miss
          
          request.get(opts, function(error, response, body){
            if(!error && response.statusCode == 200){
              //save in cache
              memcached.set(cacheKey, body, 0);
            }
            callback(error, response, body);
          });
          
          __logger.info(">>cache miss");
          
        }
      });
    }
  };
}

/*
  This wraps querying the api and parsing the json as an emitter which gives 'success' &
  'error' events.

  var r = new apiCall({result:'values', pagesize:10});

  r.on('success', function(data){
    console.log(data);
  }).on('error', function(){
    console.log('error');
  });
  
  r.end();

  an optional 'convert' function may be passed which will be called with the returned
  json before the 'complete' event is called, eg.


  var r = new apiCall({result:'values', pagesize:10}, function(data){
    return data['iati-activity']
  });
  
  r.end();
*/

var Request = function(params, convert){
  // self-invoking constructor
  if (!(this instanceof Request)) {
    return new Request(params, convert);
  }

  this.params = params || {};
  this.convert = convert || function(r) { return r; };
  this.params.format = 'json';
  this.api_url = endpoint + querystring.stringify(params);
}

function makeRequest() {
  var self = this;
  
  // use the cached get if available
  (cache ? 
    cache.get :
    request.get
  )({uri:this.api_url, timeout:5000}, function (error, response, body) {
    
    if (!error && response.statusCode == 200) {
      
      try {
      
        var unescapedQuotes = /([^\s,\:{\[]\s*)(?=")(?!"?\s*[,\:}\]])/g;
        var json = body
          .replace(/(^\()|(\)$)/g, "")
          .replace(/\n/g,'\\n')
          .replace(/\r/g,'\\r')
          .replace(/\t/g," ")
          .replace(unescapedQuotes, function(match, left) { console.log(match); return left + "\\"; });
        self.emit('success', self.convert(JSON.parse(json)));
        __logger.debug("success:", self.api_url);
        
      } catch (err) {
        
        self.emit('error', new Error('API Response - ' + err.message));
        __logger.error("request error:", err.message, self.api_url);
        
      }
    } else {
      
      self.emit('error', new Error('API Request - ' + error.message));
      __logger.error("request error:", error.message, self.api_url);
      
    }
    
  });
}

Request.prototype = new process.EventEmitter();
Request.prototype.end = makeRequest;

exports.Request = Request;
