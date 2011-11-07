var gently = global.GENTLY = new (require('gently'))();
var api = require('../lib/api.js');

describe("request", function() {
  it("has a method for requesting to the api", function() {
    expect(api.apiCall).toBeDefined();
  });
  
  it("should make a get from the api when called", function(){
    
    gently.expect(gently.hijacked.request, 'get', 1, function(params, callback) {
       callback(null, { statusCode: 200 },  'node({})');
    });
    
    new api.apiCall({});
    
  });
});
