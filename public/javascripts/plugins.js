
// this assigns the sizes based on the data-value parameter of the activity.
$.fn.assignSizes = function(tmin, tmax){
  
  var values = $.makeArray(this.map(function(){
    return $(this).data('value');
  }));
  
  var max = Math.max.apply(Math, values);
  var min = Math.min.apply(Math, values);
  
  var scale = (tmax - tmin) / (max - min);
  
  return this.each(function(){
    var $this = $(this);
    var size = ($this.data('value') * scale) + tmin;
    $(this).data('size', size);
  });  
};