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
  
  var bubbleRadiusRange = {min: 50, max: 180};
  var content = $("#content");
  var popup = $("#popup");
  var dimmer = $("#dimmer");
  var embed = $("#embed");
  var dimmed = false;
  query = window.location.search.replace(/^\?/, "");
  var activeChange = false;
  var cacheBugFix = function(xhr, settings) { settings.url = settings.url.replace("?&", "?"); };
  
  //Dim the page when requested
  dimmer.click(function() {
    if (dimmed) {
      embed.addClass("hidden")
      dimmer.fadeOut(180);
      dimmed = false;
    }
  });
  
  $(".widget").each(function() {
    var widget = $(this);
    widget.find(".save").click(function() {
      dimmer.fadeIn(180, function() { 
        embed.removeClass("hidden");
        embed.children(".widget").empty().append(widget.children(".content").clone());
        dimmed = true; 
      });
    });
  });
  
  //Monitor state changes for Back request
  window.History.Adapter.bind(window,'statechange',function(){
    if (!activeChange) {
      var State = window.History.getState();
      query = State.url.split("?")[1] || "";
      $.ajax({url: State.url, cache: false, beforeSend: cacheBugFix,  success: filterSubmitted});
    }
    activeChange = false;
  });
  
  //Callback for when a filter has been submitted
  var filterSubmitted = function(html) {
    $("#content_inner").html(html);
    popup.addClass("hidden");
    $("a.filter").each(function() {
      $(this).attr("href", $(this).attr("href").split("?")[0] + "?" + query);
    });
    $('.activities li').assignSizes(100,250);
    $(".activities").each(redrawActivities);
  };

  //Updates the page state
  var changeState = function(query) {
    activeChange = true;
    window.History.pushState({query: query}, "", "/activities" + (query ? "?" + query : ""));
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
        changeState(query);
      },
      cache: false, 
      beforeSend: cacheBugFix,
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
  
  //Assign the sizes of the activities
  $('.activities li').assignSizes(100,250);
  
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
        value: activity.data("size")
      };
    });
    
    var positions = {};
    var bubble = d3.layout.pack().size([area.x, area.y]);
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
        color: colours.text
      });
      var text = activity.find(".text");
      text.css({ 
        margin: parseInt(position.radius * 0.6 / 2)
      });
      activities.children().removeClass("hidden");
      
    });
   activities.find(".content").fitText('circular', {fontMin: 12, fontMax: 25});
    
    var content = activities.children().find(".content");
  };
  var activities = $(".activities");
  var activitiesContent = activities.find(".content");
  activities.each(redrawActivities);
  
  $('a[data-load]').live('click', function(e){
    e.preventDefault();
    var $a = $(this);
    $($a.data('load')).load($a.attr('href'), function(){
      // update any activities that have been loaded in
      $('.activities li').assignSizes(100,250);
      $(".activities").each(redrawActivities);
    });
    activeChange = true;
    window.History.pushState({}, "", $a.attr('href'));
  });
})();