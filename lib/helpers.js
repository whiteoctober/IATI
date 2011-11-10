// view helpers (can also be used )

(function(exports){
    
    
    // prints out currencies like $1,120
    exports.to_currency = function(n){
      // convert to string
      var value = "" + Math.floor(parseFloat(n));//sometimes in exponential format

      // put in the commas
      var l = value.length;
      while((l = l - 3) > 0){
        value = value.substr(0,l) + ',' + value.substr(l,value.length);
      }
      
      return "$"+value;
    };
    
    
// can be used as a node module, or will 
// be put globabally in the browser
})(exports || window);