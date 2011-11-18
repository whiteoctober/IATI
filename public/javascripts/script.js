// the set of classes to be assigned to bubbles (giving colours)
var bubbleClasses = 'c1 c2 c3 c4 c5 c6 c7 c8 c9 c10 c11 c12 c13'.split(' ');

(function() {
  var query = window.location.search.replace(/^\?/, "");
  var dimmer = $("#dimmer");
  var embed = $("#embed");
  var dimmed = false;
  
  //Sets a seed for deterministic randomness
  //Math.seedrandom('z6m44E4MB5');
  
  //This calls all of the inline scripts, set on page/dynamic content load
  var runInlines = function() { while(inlines.length) { inlines.pop()(); } };
  
  //Dim the page when requested
  dimmer.click(function() {
    if (dimmed) {
      embed.addClass("hidden");
      dimmer.fadeOut(180);
      dimmed = false;
    }
  });
  
  //Load embed widget dialog when requested
  $(".embed").live('click', function(e) {
    var link = $(this);
    dimmer.fadeIn(180, function() {
      embed.load(link.attr("href"), function(response, status) {
        if (status == 'error') {
          alert('Sorry, an error occured!');
          dimmer.fadeOut(180);
          return;
        }
        embed.removeClass("hidden");
      });
      dimmed = true; 
    });
    e.preventDefault();
  });
  
  $('#dialog').live('click', function() {
    $(this).fadeOut(function() {
      $(this).remove();
    });
  });
  
  $('.dashboard #clear').live('click', function(e){
    e.preventDefault();
    IATI.dashboard.clear();
    window.location.reload();
  });
  
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
      $('#content_inner').load(url, function(response, status) {
        if (status == 'error') return alert('request error');
        
        if (State.data.enter == 'slideUp') {
          $(this).css('margin-top', 600).animate({'margin-top': 0}, function() {
            runInlines();
          });
        }
        else {
          runInlines();
        }
      });
    };
    
    //If there is an exit animation/function then fire that before loading 
    if (window.contentExit) {
      window.contentExit().then(function() {
        window.contentExit = null;
        loadContent();
      });
    } else {
      loadContent();
    }
  });
   
  //Shows widget buttons
  $('.widget nav.linkup').live("click", function(){
    var $this = $(this);
    if(!$this.hasClass('showone')){
      //Remove from all
      $('.showone').removeClass('showone');

      //Then add to current 
      $this.addClass('showone');
      return false;
    }
  });
   
  //Hides widget buttons
  $("body").live('click', function(){
    $('.showone').removeClass('showone');
  }); 
  
  //Connects AJAX links to page state system
  $('a.xhr').live('click', function() {
    var $this = $(this);
    window.History.pushState($this.data('history'), "", $this.attr('href'));
    return false;
  });
  
  $(runInlines);
})();