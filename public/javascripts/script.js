//Colour palette for activity bubbles
var palette = [
  {colour: '#96BD50', text: '#fff'},
  {colour: '#EDB24D', text: '#fff'},
  {colour: '#EA6D65', text: '#fff'},
  {colour: '#E85890', text: '#fff'},
  {colour: '#BE547C', text: '#fff'},
  {colour: '#8588BB', text: '#fff'},
  {colour: '#7BBABA', text: '#fff'}
];

(function() {
  Math.seedrandom('z6m44E4MB5');
  var content = $("#content");
  var popup = $("#popup");
  var dimmer = $("#dimmer");
  var embed = $("#embed");
  var dimmed = false;
  var query = window.location.search.replace(/^\?/, "");
  var activeChange = false;
  var cacheBugFix = function(xhr, settings) { settings.url = settings.url.replace("?&", "?"); };
  
  //This calls all of the inline scripts, set on page/dynamic content load
  var runInlines = function() { while(inlines.length) { inlines.pop()(); } }
  
  //Dim the page when requested
  dimmer.click(function() {
    if (dimmed) {
      embed.addClass("hidden");
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
  
  $('#dialog').live('click', function(){
    $(this).fadeOut(function(){
      $(this).remove();
    });
  })
  
  // If this is a function that returns a deferred promise, then it will
  // be called before new content is loaded in.
  window.contentExit = null;
  
  //Monitor state changes for Back request
  window.History.Adapter.bind(window,'statechange',function() {
    var State = window.History.getState(),
        url = State.url;
    
    //Add the xhr param (allows for caching + doesn't clash with 'full' pages)
    var separator = State.url.indexOf('?') == -1 ? '?' : '&';
    url += separator + 'xhr=true';
    
    //jQuery Cache bug fix
    url = url.replace("?&", "?");
        
    var loadContent = function() {
      $('#content_inner').load(url, function(response, status, xhr) {
        if (status == 'error') {
          alert('request error');
          return;
        }
        if (State.data.enter == 'slideUp') {
          $(this).css('margin-top', 600).animate({'margin-top': 0});
        }
        runInlines();
      });
    };
    
    // if there is an exit animation/function - then fire that before loading 
    if (window.contentExit) {
      window.contentExit().then(function() {
        window.contentExit = null;
        loadContent();
      });
    } else {
      loadContent();
    }
  });
  
  $('a.xhr').live('click', function() {
    var $this = $(this);
    window.History.pushState($this.data('history'), "", $this.attr('href'));
    return false;
  });
  
  $(runInlines);

})();