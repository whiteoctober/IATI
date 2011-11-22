// view helpers (can also be used )
(function(exports){
    
    // prints out currencies like $1,120
    exports.to_currency = function(n, unit) {
      if (unit === undefined) unit = "$";
      return unit + ("" + Math.floor(parseFloat(n))).replace(/(\d)(?=(?:\d{3})+$)/g, "$1,");
    };
    
    exports.format_value = function(n) {
      var e = 0;
      while (n >= 1000) { n = n / 1000; e++; }
      return {
        value: Math.abs(parseInt(n)), 
        unit: ["", "thousand", "million", "billion"][e] || "", 
        sign: parseInt(n) >= 0 ? "" : "-"
      };
    };
    
// can be used as a node module, or will 
// be put globabally in the browser
})(exports || window);