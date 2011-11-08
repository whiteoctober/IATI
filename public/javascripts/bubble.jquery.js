// bubble.jquery.js
// Renders a list of elements as sized bubbles in various layouts

(function($){

  // Assigns a linearly scaled value based on an initial value
  $.fn.scaleValues = function(bounds) {
    var values = $.map(this, function(i) { return $(i).data("value") || 1; });
    var max = Math.max.apply(Math, values);
    var min = Math.min.apply(Math, values);
    var scale = (bounds.max - bounds.min) / (max == min ? 1 : max - min);
    return this.each(function(i) { $(this).data("scaled-value", parseInt(values[i] * scale + bounds.min)); });
  };

  //Finds a circluar sector from the center point of an area
  var sectorIndex = function(position, area, sectors) {
    var delta = { x: area.x / 2 - position.x, y: area.y / 2 - position.y };
    return parseInt(sectors * (Math.atan2(delta.x, delta.y) / Math.PI + 1)/2, 10) % sectors;
  };
  
  var layouts = {
    //Packs bubbles tightly together
    pack: function(items, container, options) {
      var randomly = function(a,b) { return Math.random() * 2 - 1; };
      var isLeafNode = function(d) { return !d.children; };
      var area = {x: container.parent().width(), y: container.parent().height()};
      var data = items.map(function() {
        var item = $(this);
        return { id: item.attr("id"), name: item.data("name"), value: item.data("scaled-value") };
      }).toArray();

      //Gets bubble positions using the D3 algorithm and computes the padding around them
      var positions = [];
      var padding = {left: area.x, top: area.y, right: 0, bottom: 0};
      var bubble = d3.layout.pack().size([area.x, area.y]);
      $.map(bubble.nodes({children: data}).filter(isLeafNode), function(position) {
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

      //Scales values according to the desired area
      var scale = Math.min(area.x / actualArea.x, area.y / actualArea.y);
      var scaledArea = {x: parseInt(actualArea.x * scale), y: parseInt(actualArea.y * scale)};
      $.map(positions, function(position) {
        position.x = (area.x - scaledArea.x) / 2 + scale * (position.x - padding.left);
        position.y = (area.y - scaledArea.y) / 2 + scale * (position.y - padding.top);
        position.radius = scale * position.radius;
      });

      //Set positions
      items.each(function(i) {
        var position = positions[i];
        $(this).css({
          position: 'absolute',
          left: position.x - position.radius,
          top: position.y - position.radius, 
          width: position.radius * 2,
          height: position.radius * 2
        });
      });
      
      //Set colours
      var angleOffset = parseInt(Math.random() * options.palette.length, 10);
      items.each(function(i) {
        var colourIndex = sectorIndex(positions[i], area, options.palette.length);
        var colours = options.palette[((colourIndex || 0) + angleOffset) % options.palette.length];
        $(this).children().css({
          background: colours.colour,
          color: colours.text
        });
      });
      
      container.css({width: area.x, height: area.y});
    },
    
    //Lays out bubbles on vertically centered rows
    list: function(items, container, options) {
      //Set positions
      var max = Math.max.apply(Math, items.map(function() { return $(this).data("scaled-value"); }).toArray());
      items.each(function() {
        $(this).css({'margin': parseInt((max - $(this).height())/ 2) + 'px 5px' });
      });
      
      //Set colours
      items.each(function() {
        var item = $(this);
        var colours = options.palette[Math.floor(Math.random() * options.palette.length)];
        item.css({
          width: item.data("scaled-value"),
          height: item.data("scaled-value")
        });
        item.children().css({ 
          background: item.data("colour") || colours.colour,
          color: item.data("text-colour") || colours.text
        });
      });
    }
  };
  
  //Adds redraw event to a bubble container
  $.fn.renderBubbles = function(options) {
    var defaults = {
      size: {min: 100, max: 250},
      layout: 'pack',
      palette: [{colour: '#3366FF', text: '#fff'}]
    };
    options = $.extend(defaults, options);
    options.layout = layouts[options.layout] ? options.layout : 'pack';
    
    var container = $(this);
    var items = container.children(".bubble");
    
    items.scaleValues(options.size);
    layouts[options.layout](items, container, options);
    
    items.removeClass("hidden");
    items.find(".content").fitText('circular', {font: options.font, delay: 0, afterEach: options.afterFit});
  };
})(jQuery);