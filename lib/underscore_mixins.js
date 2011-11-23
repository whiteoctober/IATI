exports.init = function(_) {
  _.mixin({
    //Returns an array by wrapping non-arrays in an array
    as_array: function(something) {
      return something === undefined ? [] : (_.isArray(something) ? something : [something]);
    },
    
    //Sums an array of values
    sum: function(array) {
      return _(array).reduce(function(a, b) { return a + b; }, 0);
    },
    
    //Returns an object (shallow clone) with only the specified keys
    only: function(obj, keptKeys){
      var next = {};
      _.each(obj, function(value, key){
        if(_.include(keptKeys, key)){
          next[key] = value;
        }
      });
      return next;
    }
  });
  
  return _;
};