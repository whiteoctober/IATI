var gently = global.GENTLY = new (require('gently'))(),
    helpers = require('../lib/helpers.js');

describe('currency helper', function(){
  
  it('formats currency', function(){
    expect(helpers.to_currency('1')).toBe('$1');
    expect(helpers.to_currency('1234')).toBe('$1,234');
    expect(helpers.to_currency('1E3')).toBe('$1,000');
    expect(helpers.to_currency('1.234567E3')).toBe('$1,234');
    expect(helpers.to_currency('1000000000')).toBe('$1,000,000,000');
    expect(helpers.to_currency('123', "$")).toBe('$123');
    expect(helpers.to_currency('123', "")).toBe('123');
    expect(helpers.to_currency('123', "£")).toBe('£123');
  });
  
});


describe('format value', function(){

    it('formats float style numbers', function(){
        
        var formatted = helpers.format_value('9.9282424175E8');

        expect(formatted.value).toBe(992);
        expect(formatted.unit).toBe('million');

    });
});