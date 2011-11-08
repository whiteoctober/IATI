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
  
  var bubbleRadiusRange = {min: 50, max: 180};
  var randomly = function(a,b) { return Math.random() * 2 - 1; };
  var isLeafNode = function(d) { return !d.children; };

  //Finds a circluar sector from the center point of an area
  var sectorIndex = function(position, area, sectors) {
    var delta = { x: area.x / 2 - position.x, y: area.y / 2 - position.y };
    return parseInt(sectors * (Math.atan2(delta.x, delta.y) / Math.PI + 1)/2, 10) % sectors;
  };
  
  var layouts = {
    pack: function(items, area) {
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
        position.radius = Math.min(parseInt(position.r, 10), bubbleRadiusRange.max);
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

      items.each(function(i) {
        $(this).data({position: positions[i]}).css({
          position: 'absolute',
          left: positions[i].x - positions[i].radius,
          top: positions[i].y - positions[i].radius, 
          width: positions[i].radius * 2,
          height: positions[i].radius * 2
        });
      });
      
      return positions;
    },
    list: {
      
    }
  };
  
  //Adds redraw event to a bubble container
  $.fn.renderBubbles = function(options) {
    var defaults = {
      layout: 'pack',
      palette: [{colour: '#3366FF', text: '#fff'}]
    };
    options = $.extend(defaults, options);
    options.layout = layouts[options.layout] ? options.layout : 'pack';
    
    var container = $(this);
    var items = container.children(".bubble");
    var content = items.find(".content");
    var angleOffset = parseInt(Math.random() * options.palette.length, 10);
    var frameHeight = Math.max(window.innerHeight, $("#content").height());
    var area = {x: container.parent().width(), y: container.parent().height()};
    
    items.scaleValues({min: 100, max: 250});
    layouts[options.layout](items, area);

    container.css({width: area.x, height: area.y});
    items.each(function(i) {
      var colourIndex = sectorIndex($(this).data("position"), area, options.palette.length);
      var colours = options.palette[((colourIndex || 0) + angleOffset) % options.palette.length];
      $(this).children().css({
        background: colours.colour,
        color: colours.text
      });
    });
    items.removeClass("hidden");
    content.fitText('circular', {font: options.font, delay: 0});
    
    // -------------- CHOICES -------------
    
    // items.each(function() {
      // var choice = $(this);
      // var colours = options.palette[Math.floor(Math.random() * options.palette.length)];
      // choice.css({
        // width: choice.data("scaled-value"),
        // height: choice.data("scaled-value")
      // });
      // choice.children().css({ 
        // background: choice.data("colour") || colours.colour,
        // color: choice.data("text-colour") || colours.text
      // });
    // });
    
    // items.find(".content").fitText('circular', {
      // font: options.font, delay: 0,
      // afterEach: function() {
        // var textLines = $(this).children().filter(function() { return $(this).text() !== ""; }).toArray();
        // $(textLines.slice(-2)).addClass("small");
      // }
    // });

    // var maxSize = Math.max.apply(Math, items.map(function() { return $(this).data("scaled-value"); }).toArray());
    // items.each(function() {
      // $(this).css({'margin': parseInt((maxSize - $(this).height())/ 2) + 'px 5px' });
    // });
  };

})(jQuery);