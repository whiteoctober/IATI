(function(exports){
    var _ = require('./underscore_mixins.js').init(require('underscore'));
  
    //Formats a number as currency with commas separators
    exports.to_currency = function(n, unit) {
      if (unit === undefined) unit = "$";
      return unit + ("" + Math.floor(parseFloat(n))).replace(/(\d)(?=(?:\d{3})+$)/g, "$1,");
    };
    
    //Formats a number to the nearest thousand
    exports.format_value = function(n, shortened) {
      var multiplers = shortened ? ["", "k", "m", "b"] : ["", "thousand", "million", "billion"];
      var e = 0;
      while (n >= 1000) { n = n / 1000; e++; }
      return {
        value: Math.abs(parseInt(n,10)), 
        unit: multiplers[e] || "", 
        sign: parseInt(n, 10) >= 0 ? "" : "-"
      };
    };
    
    //Months for date formatting
    var months = "Jan, Feb, March, April, May, June, July, August, Sept, Oct, Nov, Dec".split(", ");
    
    //Formats a date with month and year
    exports.format_date = function(date) {
      return months[date.getMonth()] + " " + date.getFullYear();
    };
    
    //Formats activity dates
    exports.format_activity_dates = function(dates) {
      if (dates.actual) return {date: exports.format_date(dates.actual), type: 'actual'};
      if (dates.planned) return {date: exports.format_date(dates.planned), type: 'planned'};
      return {date: "Unknown"};
    };
    
    exports._ = _;
    
})(exports);