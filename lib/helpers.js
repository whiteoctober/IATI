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
      var positive = parseInt(n, 10) >= 0;
      n = Math.abs(n)
      while (n >= 1000) { n = n / 1000; e++; }
      return {
        value: parseInt(n, 10), 
        unit: multiplers[e] || "", 
        sign: positive ? "" : "-"
      };
    };

    //Format a full number as 123,456,789
    // same signature and return as format_number so can be swapped in
    exports.format_value_long = function(n_str) {
      var n = parseFloat(n_str),
          sign = n < 0 ? '-' : '';

      return {
        value: ("" + Math.floor(n)).replace(/(\d)(?=(?:\d{3})+$)/g, "$1,"),
        unit: '',
        sign: sign
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
    
    //Converts a string to title case
    exports.title_case = function(text) {
      return text.replace(/\w\S*/g, function(word) {
        return word.charAt(0).toUpperCase() + word.substr(1).toLowerCase();
      });
    }
    
    exports._ = _;
    
})(exports);