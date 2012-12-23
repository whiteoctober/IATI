exports.init = function(_) {
  _.mixin({

    // Returns an array by wrapping non-arrays in an array, used for xml serialised
    // as json where there is only one of a list of elements
    as_array: function(something) {
      return something === undefined ? [] : (_.isArray(something) ? something : [something]);
    },

    // removes serialised xml attributes (properties that start with '@'')
    without_xml_attrs: function(item){
      var next = {};
      _.each(item, function(v,k){
        if(k.charAt(0) != '@'){
          next[k] = v;
        }
      });
      return next;
    },
    
    //Sums an array of values
    sum: function(array) {
      return _(array).reduce(function(a, b) { return a + parseFloat(b); }, 0);
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
    },
    
    //Clones an object with the keys reordered alphabetically, or sorted by a custom function
    sorted_clone: function(obj, sortBy) {
      sortBy = sortBy || function(attr) { return attr[0]; };
      var attrs = [];
      _(obj).each(function(value, key) { attrs.push([key, value]); });
      var sorted = {};
      _(attrs).chain().sortBy(sortBy).each(function(attr) { sorted[attr[0]] = attr[1]; });
      return sorted;
    }
  });
  
  return _;
};