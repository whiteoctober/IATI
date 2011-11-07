if (global.GENTLY) require = GENTLY.hijack(require);

var querystring = require('querystring'),
    eventEmitter = require('events').EventEmitter,
    request = require('request'),
    url = require('url');

// TODO: this should be dynamic
var endpoint = 'http://109.104.101.243:8080/exist/rest/db/apps/iati-api/xquery/woapi.xq';

// new endpoint isn't working at the moment
// var endpoint = 'http://webapps.kitwallace.me/exist/rest/db/apps/iati/xquery/woapi.xq';

/*
  This wraps querying the api and parsing the json as an emitter which gives 'success' &
  'error' events.

  var r = new apiCall({result:'values', pagesize:10});

  r.on('success', function(data){
    console.log(data);
  }).on('error', function(){
    console.log('error');
  });

  an optional 'convert' function may be passed which will be called with the returned
  json before the 'complete' event is called, eg.


  var r = new apiCall({result:'values', pagesize:10}, function(data){
    return data['iati-activity']
  });


  */
function apiCall (params, convert){

  var self = this;

  //default to non-conversion
  convert = convert || function(r){return r;};

  // when no callback is provided, the response is 
  // wrapped in parenthises, so as a 'fix' we always
  // provide a callback and then strip it out when 
  // the response comes back
  params.callback = 'node';
  params.format = 'json';

  var api_url = endpoint + '?' + querystring.stringify(params);

  request.get({uri:api_url}, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      try{
        
        //hack out the 'node(' + ')' callback (will be gone in the new api)
        var data = body.substr(5,body.length - 6);
        
        var json = JSON.parse(data.replace("\t"," "));
        
        self.emit('success', convert(json));
        
      } catch (err){
        
        self.emit('error', err);
        
      }
    } else {
      
      self.emit('error', 'Request error');
      
    }
  });

  return this;
}


apiCall.prototype = new process.EventEmitter();


exports.apiCall = apiCall;
