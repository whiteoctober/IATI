var gently = global.GENTLY = new (require('gently'))();
var api = require('../lib/api.js');

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
  
  
});
