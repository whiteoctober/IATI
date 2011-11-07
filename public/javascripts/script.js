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
      $('#content_inner').load(State.url + '?xhr', function(){
        if(State.data.enter == 'slideUp'){
          $(this).css('margin-top',600).animate({'margin-top':0});
        }
        run_inlines();
      });
    }
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
  
  var activityWrapper = $(".activity_wrapper");
  activityWrapper.width($("#content").width()).height($("#content").height() - 230);
  var activities = $(".activity_wrapper").children(".activities");
  var activitiesContent = activities.find(".content");
  
  var redrawActivities = function() {
    var angleOffset = parseInt(Math.random() * palette.length);
    var activities = $(this);
    var frameHeight = Math.max(window.innerHeight, $("#content").height());
    var desiredArea = {x: activityWrapper.width(), y: activityWrapper.height()};
    var area = { x: 600, y: 600 };
    
    var data = activities.children().assignSizes(100,250).map(function() {
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
        margin: parseInt(position.radius * 0.6 / 2)
      });
      activities.children().removeClass("hidden");
      
    });
    activities.find(".content").fitText('circular', {fontMin: 13, fontMax: 25, delay: 0});
    var content = activities.children().find(".content");
  };
  
  activityWrapper.activityZoom({
    afterZoom: function(zoom, zoomed) {
      var fontMin = Math.round(13 / zoom);
      var filter = zoomed > 0 ? ".truncated" : function() { return parseInt($(this).css("font-size")) < fontMin; };
      activitiesContent.filter(filter).fitText('circular', {fontMin: fontMin, fontMax: 25});
    },
    onResize: function() {
      activityWrapper.width($("#content").width()).height($("#content").height() - 230);
    },
    transition2d: false
  });
  
  // a simple jQ plugin that allows activity bubbles to be rendered via jQuery
  $.fn.activityList = function(){
    return this.bind('redraw', redrawActivities);
  }
  
  
  $('a.xhr').live('click', function(e){
    e.preventDefault();
    var $this = $(this);
    window.History.pushState($this.data('history'), "", $this.attr('href'));
  });
  
  
  // run any inline scripts on DOM Ready
  $(run_inlines);
  
  // this calls all of the inline scripts
  //  (for page load + dynamic content)
  function run_inlines(){
    while(inlines.length){inlines.pop()();}
  }
  
})();