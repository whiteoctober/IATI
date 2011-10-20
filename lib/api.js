var http = require('http'),
	querystring = require('querystring'),
	eventEmitter = require('events').EventEmitter,
	url = require('url');


// TODO: this should be dynamic
var endpoint = 'http://webapps.kitwallace.me/exist/rest/db/apps/iati/xquery/woapi.xq';


/*
	
	exports.request({groupby:'Funder', result:'values'}, function(data){
		console.log(data);
	});
*/
exports.request = function(params, callback, convert){
	
	//default to non-conversion
	convert = convert || function(r){return r;};
	
	params.callback = 'node';
	params.format = 'json';
	
	
	var api_url = url.parse(endpoint + '?' + querystring.stringify(params));

	var client = http.createClient(api_url.port || 80, api_url.host);
	var request = client.request("GET", api_url.pathname + api_url.search, {'host' : api_url.host});
	request.end();
	
	request.on('response', function(response) {
		var data = "";
		response.setEncoding('utf8');
		console.log('STATUS: ' + response.statusCode);
		response.on('data', function(chunk) {
			data += chunk;
		}).on('end', function(){
			
			//hack out the callback
			var jsonstr = data.substr(5,data.length - 6);
			var json = JSON.parse(jsonstr);
			callback(convert(json));
		});
		
	});
};
