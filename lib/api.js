if (global.GENTLY) require = GENTLY.hijack(require);

var querystring = require('querystring'),
    eventEmitter = require('events').EventEmitter,
    request = require('request'),
    url = require('url');

// note - url should end in '?' as appropriate
var endpoint = process.env.ENDPOINT || 'http://109.104.101.243:8080/exist/rest/db/apps/iati-api/xquery/woapi.xq?';

// do some basic checks on the endpoint
if(!url.parse(endpoint).host){
  console.log("Warning: couldn't find a host form the endpoint url: \n\t" + endpoint);
} else if(endpoint.match(/\?$/) === null){
  console.log("Warning: the api endpoint should probably end in a '?': \n\t" + endpoint);
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
function Request (params, convert){
  
  // self-invoking constructor
  if(!(this instanceof Request)){
    return new Request(params, convert);
  }
  
  // assign parameters or their defaults
  this.params = params || {};
  this.convert = convert || function(r){return r;};
  
  // set the return type
  this.params.format = 'json';
  
  this.api_url = endpoint + querystring.stringify(params);

}


var makeRequest = function() {
  var self = this;
  request.get({uri:this.api_url, timeout:5000}, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      try {
        var unescapedQuotes = /([^\s,\:{\[]\s*)(?=")(?!"?\s*[,\:}\]])/g;
        var json = body.replace("","").replace("\n",'\\n').replace("\r",'\\r').replace("\t"," ").replace(unescapedQuotes, function(match, left) { console.log(match); return left + "\\"; });
        self.emit('success', self.convert(JSON.parse(json)));
      } catch (err){
        self.emit('error', new Error('API Response - ' + err.message));
      }
    } else {
      self.emit('error', new Error('API Request - ' + error.message));
    }
  });
};

Request.prototype = new process.EventEmitter();
Request.prototype.end = makeRequest;

exports.Request = Request;
