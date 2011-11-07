/*
  Bubbles.jquery.js
  
  Render a list of elements as bubbles
  
*/
(function($){
    
    //Colour palette for activity bubbles
    var palette = [
      {colour: '#3366FF', text: '#fff'},
      {colour: '#6633FF', text: '#fff'},
      {colour: '#CC33FF', text: '#fff'},
      {colour: '#FF33CC', text: '#fff'},
      {colour: '#33CCFF', text: '#fff'},
      {colour: '#003DF5', text: '#fff'},
      {colour: '#002EB8', text: '#fff'}
    ];
    
    var bubbleRadiusRange = {min: 50, max: 180};

    var randomly = function(a,b) { return Math.random() * 2 - 1; };
    var isLeafNode = function(d) { return !d.children; };

    //Finds a sector index based on angle from the centre
    var sliceIndex = function(position, area, slices) {
      var delta = {
        x: area.x / 2 - position.x,
        y: area.y / 2 - position.y
      };
      return parseInt(slices * (Math.atan2(delta.x, delta.y) / Math.PI + 1)/2, 10) % slices;
    };
    
    
    // Assigns a scaled data-size value based on the data-value parameter of each element
    var assignSizes = function(tmin, tmax) {

      var values = $.makeArray(this.map(function() {
        return $(this).data('value') || 1;
      }));

      var max = Math.max.apply(Math, values);
      var min = Math.min.apply(Math, values);
      var scale = (tmax - tmin) / (max == min ? 1 : max - min);

      return this.each(function() {
        var $this = $(this);
        var v = $this.data('value') || 1;
        var size = (v * scale) + tmin;
        $this.data('size', size);
      });  
    };
    
    
    var redrawActivities = function() {
      var angleOffset = parseInt(Math.random() * palette.length, 10);
      var activities = $(this);
      var activityWrapper = activities.parent(); // << added so this can be standalone
      var frameHeight = Math.max(window.innerHeight, $("#content").height());
      var desiredArea = {x: activityWrapper.width(), y: activityWrapper.height()};
      var area = { x: 600, y: 600 };
      
      // set the 'size' data attribute
      assignSizes.apply(activities.children(), [100,250]);

      var data = activities.children().map(function() {
        var activity = $(this);
        return {
          id: activity.attr("id"),
          name: activity.attr("data-name"),
          value: activity.data("size")
        };
      });

      var positions = {};
      var bubble = d3.layout.pack().size([area.x, area.y]);
      var coords = {top: [], bottom: [], left: [], right: []};
      $.map(bubble.nodes({children: data}).filter(isLeafNode), function(position) {
        positions[position.id] = position;
        position.x = parseInt(position.x, 10);
        position.y = parseInt(position.y, 10);
        position.radius = Math.min(parseInt(position.r, 10), bubbleRadiusRange.max);
        coords.left.push(position.x - position.radius);
        coords.top.push(position.y - position.radius);
        coords.right.push(position.x + position.radius);
        coords.bottom.push(position.y + position.radius);
      });

      //Generate maximum and minimum data values, total area
      var edges = {
        top: Math.min.apply(this, coords.top),
        left: Math.min.apply(this, coords.left),
        right: Math.max.apply(this, coords.right),
        bottom: Math.max.apply(this, coords.bottom)
      };
      area = {x: edges.right - edges.left, y: edges.bottom - edges.top };

      //Position and scale data values
      var scale = Math.min(desiredArea.x / area.x, desiredArea.y / area.y);
      area = {x: area.x * scale, y: area.y * scale};
      $.each(positions, function(id, position) {
        position.x = (desiredArea.x - area.x)/2 + scale * (position.x - edges.left);
        position.y = (desiredArea.y - area.y)/2 + scale * (position.y - edges.top);
        position.radius = scale * position.radius;
      });
      area = desiredArea;

      activities.css({width: desiredArea.x, height: desiredArea.y});
      activities.children().each(function() {
        var activity = $(this);
        var position = positions[activity.attr("id")];
        var centre = {x: area.x - position.radius, y: area.y - position.radius};
        var colourIndex = sliceIndex(position, centre, palette.length);
        var colours = palette[((colourIndex || 0) + angleOffset) % palette.length];
        activity.css({
          position: 'absolute',
          left: position.x - position.radius,
          top: position.y - position.radius, 
          width: position.radius * 2,
          height: position.radius * 2
        });
        activity.children().css({
          background: colours.colour,
          color: colours.text
        });
        var text = activity.find(".text");
        text.css({ 
          margin: parseInt(position.radius * 0.6 / 2, 10)
        });
        activities.children().removeClass("hidden");

      });
      activities.find(".content").fitText('circular', {fontMin: 13, fontMax: 25, delay: 0});
      var content = activities.children().find(".content");
    };
    
    
    
    // a simple jQ plugin that allows activity bubbles to be rendered via jQuery
    $.fn.activityList = function(){
      return this
        .bind('redraw', redrawActivities);
    };
    
    
    
})(jQuery);