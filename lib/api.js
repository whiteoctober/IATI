var http = require('http'),
  querystring = require('querystring'),
  eventEmitter = require('events').EventEmitter,
  url = require('url');

// TODO: this should be dynamic
var endpoint = 'http://webapps.kitwallace.me/exist/rest/db/apps/iati/xquery/woapi.xq';

/*
	This wraps querying the api and parsing the json as an emitter which gives 'complete' &
	'error' events.
	
	var r = new apiCall({result:'values', pagesize:10});
	
	r.on('complete', function(data){
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
	
	
	var api_url = url.parse(endpoint + '?' + querystring.stringify(params));

	var client = http.createClient(api_url.port || 80, api_url.host);
	var request = client.request("GET", api_url.pathname + api_url.search, {'host' : api_url.host});
	
	request.end();
	
	request.on('response', function(response) {
		var data = "";
		response.setEncoding('utf8');
		
		response
			.on('data', function(chunk) {
				data += chunk;
			})
			.on('end', function(){
				try{
					//hack out the callback
					var jsonstr = data.substr(5,data.length - 6);
					var json = JSON.parse(jsonstr);
					
					self.emit('complete', convert(json));
				} catch (err){
					self.emit('error', err);
				}
			})
			.on('error', function(err){
				self.emit('error', err);
			});
		
	});
	
	return this;
}

apiCall.prototype = new process.EventEmitter();


exports.apiCall = apiCall;
