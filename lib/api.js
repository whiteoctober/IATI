if (global.GENTLY) require = GENTLY.hijack(require);

var querystring = require('querystring'),
    eventEmitter = require('events').EventEmitter,
    request = require('request'),
    url = require('url');

// note - url should end in '?' as appropriate
// TODO: this should be dynamic
// var endpoint = 'http://webapps.kitwallace.me/exist/rest/db/apps/iati/xquery/woapi.xq?'; // original url
var endpoint = 'http://109.104.101.243:8080/exist/rest/db/apps/iati-api/xquery/woapi.xq?';
// var endpoint = "http://apimock.sites.ben.dev/woapi.xq%3f"; // local dev

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

  params.format = 'json';

  var api_url = endpoint + querystring.stringify(params);

  request.get({uri:api_url, timeout:5000}, function (error, response, body) {
      
    if (!error && response.statusCode == 200) {
      try{
        
        var json = JSON.parse(body.replace("\t"," "));
        
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
