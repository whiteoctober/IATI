var gently = global.GENTLY = new (require('gently'))(),
    api = require('../lib/api.js'),
    url = require('url'),
    http = require('http'),
    log4js = require('log4js');


log4js.getLogger('api.js').setLevel('FATAL');

describe("request", function() {
  
  
  it("has a method for requesting to the api", function() {
    expect(api.Request).toBeDefined();
  });
  
  
  it("can be invoked without 'new'", function() {
    var re = api.Request({});
    
    expect(re instanceof api.Request).toBeTruthy();
  });
  
  
  it("should make a get from the api when called", function(){
    
    gently.expect(gently.hijacked.request, 'get', 1, function(params, callback) {
       callback(null, { statusCode: 200 },  '{}');
    });
    
    new api.Request({}).end();
    
  });
  
  
  it("should make the request on .end()", function(){
    
    var req = new api.Request({});
    
    gently.expect(gently.hijacked.request, 'get', 1, function(params, callback) {
       callback(null, { statusCode: 200 },  '{}');
    });
    
    req.end();
    
  });
  
  it('should pass params to the request', function(){
    
    var req = new api.Request({myParam:'1', another:'2'});
    
    gently.expect(gently.hijacked.request, 'get', 1, function(params, callback) {
      var query = url.parse(params.uri, true).query;
      
      expect(query.myParam).toBe('1');
      expect(query.another).toBe('2');
      expect(query.notanother).toBeUndefined();
      
      callback(null, { statusCode: 200 },  '{}');
    });
    
    req.end();
  });
  
  
});


describe("errors", function(){
  
  it('emits errors on non-json data', function(){
    
    gently.expect(gently.hijacked.request, 'get', function(params, callback) {
       callback(null, { statusCode: 200 },  'not-json');
    });
    
    var re = api.Request({});
    
    gently.expect(re, 'emit', function(event) {
      expect(event).toBe('error');
    });
    
    re.end();
    
  });
  
  it('emits error on timeout', function(){
    
    gently.expect(gently.hijacked.request, 'get', function(params, callback) {
       callback({message:'ETIMEDOUT', code:'ETIMEDOUT'});
    });

    var re = api.Request({});
    gently.expect(re, 'emit', function(event) {
      expect(event).toBe('error');
    });
    
    re.end();
    
  });
  
});