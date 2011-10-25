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
  var fontRange = {min: 11, max: 30};
  var popup = $("#popup");
  var content = $("#content");
  var query = window.location.search;

  var filterUpdated = function(html) { 
    $("#content_inner").html(html);
    popup.addClass("hidden");
    $("a.filter").each(function() {
      $(this).attr("href", $(this).attr("href").split("?")[0] + "?" + query);
    });
    $(".activities").each(redrawActivities);
  };

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
      success: filterUpdated
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
  var sliceIndex = function(position, area, slices) {
    var delta = {
      x: area.x / 2 - position.x,
      y: area.y / 2 - position.y
    };
    return parseInt(slices * (Math.atan2(delta.x, delta.y) / Math.PI + 1)/2) % slices;
  };
  
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
    var activities = $(this);
    var frameHeight = Math.max(window.innerHeight, $("#content").height());
    var area = {
      x: $("#content").width(),
      y: 600 //frameHeight - $("#header").height() - $("#footer").height()
    };
    
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
    $.map(bubble.nodes({children: data}).filter(isLeafNode), function(position) {
      positions[position.id] = position;
      position.x = parseInt(position.x);
      position.y = parseInt(position.y);
      position.radius = parseInt(position.r);
    });
    
    activities.css({width: area.x, height: area.y});
    activities.children().each(function() {
      var activity = $(this);
      var position = positions[activity.attr("id")];
      
      var colourIndex = sliceIndex(position, {x: area.x - position.radius, y: area.y - position.radius}, palette.length);
      var colours = palette[colourIndex || 0];
      activity.css({
        position: 'absolute',
        top: position.y - position.radius, 
        left: position.x - position.radius,
        width: position.radius * 2,
        height: position.radius * 2
      });
      activity.children().css({
        background: colours.colour,
      });
      var text = activity.find(".text");
      text.css({ 
        color: colours.text, 
        margin: parseInt(position.radius * 0.57 / 2)
      });
      activities.children().removeClass("hidden");
      scaleText(text, position.name);
    });
  };
  $(".activities").each(redrawActivities);
})();