(function() {

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
  //Maximum and minimum font sizes for activity bubbles
  var fontRange = {min: 11, max: 30};
  var bubbleRadiusRange = {min: 50, max: 180};
  var popup = $("#popup");
  var content = $("#content");
  var query = window.location.search;

  //Callback for when a filter has been submitted
  var filterSubmitted = function(html) {
    window.History.pushState({query: query}, "", "?"+query);
    $("#content_inner").html(html);
    popup.addClass("hidden");
    $("a.filter").each(function() {
      $(this).attr("href", $(this).attr("href").split("?")[0] + "?" + query);
    });
    $(".activities").each(redrawActivities);
  };

  //Callback for when a filter is opened
  var filterLoaded = function(html) { 
    popup.html(html);
    popup.removeClass("hidden");
    popup.css("left", content.outerWidth()/2 - popup.outerWidth()/2);
    popup.css("top", content.outerHeight()/2 - popup.outerHeight()/2);
    popup.find("form.filter").ajaxForm({
      beforeSubmit: function() {
        query = popup.find("form.filter").serialize();
      },
      dataType: 'html',
      success: filterSubmitted
    });
  };

  $("a.filter").click(function(e) {
    $.ajax({
      url: $(this).attr("href"),
      type: 'get',
      dataType: 'html', 
      success: filterLoaded
    });
    return false;
  });
  
  var randomly = function(a,b) { return Math.random() * 2 - 1; };
  var isLeafNode = function(d) { return !d.children; };
  
  //Finds a sector index based on angle from the centre
  var sliceIndex = function(position, area, slices) {
    var delta = {
      x: area.x / 2 - position.x,
      y: area.y / 2 - position.y
    };
    return parseInt(slices * (Math.atan2(delta.x, delta.y) / Math.PI + 1)/2) % slices;
  };
  
  //Scales text within an element
  var scaleText = function(element, text) {
    var words = (text || "").split(" ");
    var length = words.length;
    var fontSize, ellipsis;
    element.css("font-size", fontRange.max+"px");
    while (true) {
      fontSize = parseInt(element.css("font-size"));
      if (fontSize > fontRange.min) {
        element.css("font-size", (fontSize - 1)+"px");
      }
      else {
        ellipsis = (length < words.length ? "<br>..." : "")
        element.html(words.slice(0, length).join(" ") + ellipsis);
        length = length - 1;
      }
      if (element.height() <= element.width() || length == 0) { break; }
    }
  };
  
  var redrawActivities = function() {
    var angleOffset = parseInt(Math.random() * palette.length);
    var activities = $(this);
    var frameHeight = Math.max(window.innerHeight, $("#content").height());
    var area = { x: 600, y: 600 };
    
    var data = activities.children().map(function() {
      var activity = $(this);
      return {
        id: activity.attr("id"),
        name: activity.attr("data-name"),
        value: activity.attr("data-size")
      };
    });
    
    var positions = {};
    var bubble = d3.layout.pack().sort(randomly).size([area.x, area.y]);
    var coords = {top: [], bottom: [], left: [], right: []};
    $.map(bubble.nodes({children: data}).filter(isLeafNode), function(position) {
      positions[position.id] = position;
      position.x = parseInt(position.x);
      position.y = parseInt(position.y);
      position.radius = Math.min(parseInt(position.r), bubbleRadiusRange.max);
      coords.left.push(position.x - position.radius);
      coords.top.push(position.y - position.radius);
      coords.right.push(position.x + position.radius);
      coords.bottom.push(position.y + position.radius);
    });
    
    var offset = {
      top: Math.min.apply(this, coords.top),
      left: Math.min.apply(this, coords.left),
      right: Math.max.apply(this, coords.right),
      bottom: Math.max.apply(this, coords.bottom)
    };
    area = {x: offset.right - offset.left, y: offset.bottom - offset.top };
    
    $.each(positions, function(id, position) {
      positions[id].x =  position.x - offset.left;
      positions[id].y =  position.y - offset.top;
    });
    
    activities.css({width: area.x, height: area.y});
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
      });
      var text = activity.find(".text");
      text.css({ 
        color: colours.text, 
        margin: parseInt(position.radius * 0.6 / 2)
      });
      activities.children().removeClass("hidden");
      scaleText(text, position.name);
    });
  };
  $(".activities").each(redrawActivities);
})();