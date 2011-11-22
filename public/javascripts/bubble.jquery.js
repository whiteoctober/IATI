// bubbleLayout Plugin
// Renders a list of text as coloured bubbles with a custom layout

(function($){
  // Assigns a linearly scaled value based on an initial value
  $.fn.scaleValues = function(bounds) {
    var values = $.map(this, function(i) { return $(i).data("value") || 1; });
    var max = Math.max.apply(Math, values);
    var min = Math.min.apply(Math, values);
    var scale = (bounds.max - bounds.min) / (max == min ? 1 : max - min);
    return this.each(function(i) { $(this).data("scaled-value", parseInt(values[i] * scale + bounds.min)); });
  };
  
  var layouts = {
    // Pack layout: packs bubbles tightly together
    pack: function(items, container, options) {
      var randomly = function(a,b) { return Math.random() * 2 - 1; };
      var isLeafNode = function(d) { return !d.children; };
      var area = {x: container.parent().width(), y: container.parent().height() - 150};
      
      // Calculates the angle of a point from the center of the available area
      var rotation = function(position) {
        var delta = { x: area.x / 2 - position.x, y: area.y / 2 - position.y };
        return (Math.atan2(delta.x, delta.y) / (Math.PI * 2)) + 0.5;
      };
      
      // Converts jquery object to a randomly sorted array of DOM elements
      items = items.map(function() { return $(this); }).toArray().sort(randomly);
      
      // Generates data for packing algoritm
      var data = $.map(items, function(item) {
        return { id: item.attr("id"), name: item.data("name"), value: item.data("scaled-value") };
      })

      // Gets bubble positions using the pack layout algorithm and computes the padding around them
      var positions = [];
      var padding = {left: area.x, top: area.y, right: 0, bottom: 0};
      var aspectRatio = Math.pow(container.parent().width() / container.parent().height(), 2);
      $.map(packLayout($.map(data, function(i) { return i.value; }), aspectRatio), function(position) {
        position.x = parseInt(position.x, 10);
        position.y = parseInt(position.y, 10);
        position.radius = parseInt(position.r, 10);
        positions.push(position);
        padding.left = Math.min(padding.left, position.x - position.radius);
        padding.top = Math.min(padding.top, position.y - position.radius);
        padding.right = Math.max(padding.right, position.x + position.radius);
        padding.bottom = Math.max(padding.bottom, position.y + position.radius);
      });
      var actualArea = { x: padding.right - padding.left, y: padding.bottom - padding.top };

      // Scales values according to the desired area
      var scale = Math.min(area.x / actualArea.x, area.y / actualArea.y);
      $.map(positions, function(position) {
        position.x = (area.x - actualArea.x * scale) / 2 + scale * (position.x - padding.left);
        position.y = (area.y - actualArea.y * scale) / 2 + scale * (position.y - padding.top);
        position.radius = scale * position.radius;
      });
      
      // Set positions
      $.map(items, function(item, i) {
        var position = positions[i] || {radius: 10, x: 0, y: 0};
        item.css({
          position: 'absolute',
          left: position.x - position.radius,
          top: position.y - position.radius, 
          width: position.radius * 2,
          height: position.radius * 2
        });
      });
      
      // Sets colour classes
      var offset = Math.random();
      if (options.bubbleClasses) {
        $.map(items, function(item, i) {
          var angle = (rotation(positions[i]) + offset) % 1;
          var idx = parseInt(angle * options.bubbleClasses.length,10);
          var classname = options.bubbleClasses[idx];
          item.addClass(classname);
        });
      }
      
      // Sets colour based on palette
      if (options.palette) {
        $.map(items, function(item, i){
          var angle = (rotation(positions[i]) + offset) % 1;
          var idx = parseInt(angle * options.palette.length,10);
          var colours = options.palette[idx];
          item.children().css({
            background: colours.colour,
            color: colours.text
          });
        });
      }
      
      container.height(area.y).width(area.x);
    },
    
    // List layout: lays out bubbles on vertically centered rows
    list: function(items, container, options) {
      // Set positions
      var max = Math.max.apply(Math, items.map(function() { return $(this).data("scaled-value"); }).toArray());
      items.each(function() {
        var item = $(this);
        item.css({
          width: item.data("scaled-value"),
          height: item.data("scaled-value")
        });
        var margin = parseInt((max - item.data("scaled-value"))/ 2);
        $(this).css({'margin-top': margin + item.data("scaled-value") % 2, 'margin-bottom': margin });
      });
      
      
      // Set colours/classes
      if(options.bubbleClasses){
        var random = Math.floor(Math.random() * options.bubbleClasses.length);
        items.each(function(i){
          var idx = (random + i++) % options.bubbleClasses.length;
          var classname = options.bubbleClasses[idx];
          $(this).addClass(classname);
        });
      }
      
      // 
      if(options.palette){
        var random = Math.floor(Math.random() * options.palette.length);
        items.each(function(i){
          var item = $(this);
          var colours = options.palette[(random + i++) % options.palette.length];
          item.children().css({ 
            background: item.data("colour") || colours.colour,
            color: item.data("text-colour") || colours.text
          });
        });
      }
    }
  };
  
  // Renders bubbles with text inside using the chosen layout
  $.fn.bubbleLayout = function(options) {
    var defaults = {
      diameter: {min: 100, max: 200},
      layout: 'pack'
    };
    options = $.extend(defaults, options);
    options.layout = layouts[options.layout] ? options.layout : 'pack';
    
    var container = $(this);
    var items = container.children(".bubble");
    
    items.scaleValues(options.diameter);
    layouts[options.layout](items, container, options);
    
    items.removeClass("hidden");
    items.find(".content").fitText('circular', {font: options.font, delay: 0, afterEach: options.afterFit});
  };
})(jQuery);