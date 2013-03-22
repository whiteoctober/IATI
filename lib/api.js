if (global.GENTLY) require = GENTLY.hijack(require);

var querystring = require('querystring'),
  eventEmitter = require('events').EventEmitter,
  request = require('request'),
  url = require('url'),
  Memcached = require('memcached'),
  _ = require('./underscore_mixins.js').init(require('underscore')),
  __logger = require('log4js').getLogger('api.js');

// note - url should end in '?' as appropriate
var endpoint = process.env.ENDPOINT || 'http://109.104.101.243:8080/exist/rest/db/apps/iati/xquery/woapi.xq?';

// do some basic checks on the endpoint
if (!url.parse(endpoint).host) {
  console.log("Warning: couldn't find a host form the endpoint url: \n\t" + endpoint);
} else if (endpoint.match(/\?$/) === null) {
  console.log("Warning: the api endpoint should probably end in a '?': \n\t" + endpoint);
}

var corpus = process.env.CORPUS;



// caching requests
var memcacheRequest, redisRequest;

if(process.env.MEMCACHE_SERVERS){
  
  // heroku also supplies _USERNAME and _PASSWORD envs, which 
  // the memcached module doesn't seem to support
  var memcached = new Memcached(process.env.MEMCACHE_SERVERS);
  
  
  memcacheRequest = {
    get:function(opts, callback){
      var cacheKey = opts.uri;
      
      memcached.get(cacheKey, function(err, value){
        if(value){
          //cache hit
          
          callback(false, {statusCode:200}, value);
          
          __logger.info(">>[memcached]cache hit");
          
        } else {
          //cache miss
          
          request.get(opts, function(error, response, body){
            if(!error && response.statusCode == 200){
              //save in cache
              memcached.set(cacheKey, body, 0);
            }
            callback(error, response, body);
          });
          
          __logger.info(">>[memcached]cache miss");
          
        }
      });
    }
  };
}

if(process.env.REDISTOGO_URL){
  
  var redis = require('redis-url').createClient(process.env.REDISTOGO_URL);
  
  var redisRequest = {
    get: function(opts, callback){
      
      var cacheKey = opts.uri;
      
      redis.get(cacheKey, function(err, value) {
        if(value){
          
          callback(false, {statusCode:200}, value);
        
          __logger.info(">>[redis]cache hit");
          
        } else {
          //cache miss

          request.get(opts, function(error, response, body){
            if(!error && response.statusCode == 200){
              //save in cache
              redis.set(cacheKey, body);
              redis.expire(cacheKey, 60*60*48); //expire in 2 days
            }
            callback(error, response, body);
          });

          __logger.info(">>[redis]cache miss");

        }
      });
      
    }
  }


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
  this.params.format = params.format || 'json';

  // the api will now select a default corpus
  if(corpus && !params.corpus){
    this.params.corpus = corpus;
  }

  // default to the values result set
  this.result = this.result || 'values';

  this.api_url = endpoint + querystring.stringify(_(params).sorted_clone());

  // should we parse the response as json
  this.parseJSON = this.params.format == 'json';
};

function makeRequest() {
  var self = this;
  
  // use the cached get if available
  var requester = (memcacheRequest || redisRequest || request); // <<<FAO Pete!

  requester.get({uri:self.api_url, timeout:60000}, function (error, response, body) {
    
    if (!error && response.statusCode == 200) {
      
      try {

        if(!self.parseJSON){
          self.emit('success', self.convert(body));
          __logger.debug("success:", self.api_url);
          __logger.debug("Elapsed Seconds: unknown");
          return;
        }
        
        //body = body.replace(/\\(?!\\)/g, "\\\\");
        var json = JSON.parse(body);
        
        self.emit('success', self.convert(json));
        __logger.debug("success:", self.api_url);
        
        // log the elapsed time
        if(json.test && json.test['@elapsed-milliseconds']){
          var seconds = parseInt(json.test['@elapsed-milliseconds'],10) / 1000;
          __logger.debug("Elapsed Seconds: " + seconds + 's');
        }
        
      } catch (err) {
        
        self.emit('error', new Error('API Response - ' + err.message));
        __logger.error("request error:", err.message, self.api_url);
        
      }
    } else {
      var message = (error && error.message) ? error.message : ('http-status:' + response.statusCode);
      
      __logger.error("request error:", message, self.api_url);
      self.emit('error', new Error('API Request - ' + message));
      
    }
    
  });
}

Request.prototype = new process.EventEmitter();
Request.prototype.end = makeRequest;

exports.Request = Request;
