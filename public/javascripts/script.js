(function() {
  
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
  
  
  var activityWrapper = $(".activity_wrapper");
  activityWrapper.width($("#content").width()).height($("#content").height() - 230);
  var activities = $(".activity_wrapper").children(".activities");
  var activitiesContent = activities.find(".content");
  
  
  
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