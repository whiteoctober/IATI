var api = require('../lib/api.js');

describe("request", function() {
  it("has a method for requesting to the api", function() {
    expect(api.apiCall).toBeDefined();
  });
});
