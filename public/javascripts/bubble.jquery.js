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

  //Finds a circluar sector from the center point of an area
  var sectorIndex = function(position, area, sectors) {
    var delta = { x: area.x / 2 - position.x, y: area.y / 2 - position.y };
    return parseInt(sectors * (Math.atan2(delta.x, delta.y) / Math.PI + 1)/2, 10) % sectors;
  };
  
  //Adds redraw event to a bubble container
  $.fn.activityList = function() {
    return this.bind('redraw', function() {
      var activityContainer = $(this);
      var activities = activityContainer.children(".activity");
      var content = activities.find(".content");
      var activityWrapper = activityContainer.parent();
      var angleOffset = parseInt(Math.random() * palette.length, 10);
      var frameHeight = Math.max(window.innerHeight, $("#content").height());
      var desiredArea = {x: activityWrapper.width(), y: activityWrapper.height()};
      var area = { x: 600, y: 600 };
      
      activities.scaleValues({min: 100, max: 250});

      var data = activities.map(function() {
        var activity = $(this);
        return {
          id: activity.attr("id"),
          name: activity.data("name"),
          value: activity.data("scaled-value")
        };
      }).toArray();

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
      area = { x: edges.right - edges.left, y: edges.bottom - edges.top };

      //Position and scale data values
      var scale = Math.min(desiredArea.x / area.x, desiredArea.y / area.y);
      area = {x: area.x * scale, y: area.y * scale};
      $.each(positions, function(id, position) {
        position.x = (desiredArea.x - area.x)/2 + scale * (position.x - edges.left);
        position.y = (desiredArea.y - area.y)/2 + scale * (position.y - edges.top);
        position.radius = scale * position.radius;
      });
      area = desiredArea;

      activityContainer.css({width: desiredArea.x, height: desiredArea.y});
      activities.each(function() {
        var activity = $(this);
        var position = positions[activity.attr("id")];
        var centre = {x: area.x - position.radius, y: area.y - position.radius};
        var colourIndex = sectorIndex(position, centre, palette.length);
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
      });
      activities.removeClass("hidden");
      content.fitText('circular', {fontMin: 13, fontMax: 25, delay: 0});
    });
  };

})(jQuery);