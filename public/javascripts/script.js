// the set of classes to be assigned to bubbles (giving colours)
var bubbleClasses = 'c1 c2 c3 c4 c5 c6 c7 c8 c9 c10 c11 c12 c13'.split(' ');

(function() {
  var query = window.location.search.replace(/^\?/, "");
  var dimmer = $("#dimmer");
  var embed = $("#embed");
  var dimmed = false;

  //Sets a seed for deterministic randomness
  //Math.seedrandom('z6m44E4MB5');

  //Dim the page when requested
  dimmer.click(function() {
    if (dimmed) {
      embed.addClass("hidden");
      dimmer.fadeOut(180);
      dimmed = false;
    }
  });

  var ajaxLoader = $("#ajax-loader");
  $(document)
    .on("ajaxStart", function(){
      ajaxLoader.delay(1000).fadeIn();
      console.log('start');
    })
    .on("ajaxStop", function(){
      ajaxLoader.stop().hide();
      console.log('end');
    });

  ajaxLoader
    .click(function(){
      // we're not actually cancelling the request
      // here,  but just hiding this, so that something
      // else could be clicked. Setting History.back()
      // causes quite a lot of trouble
      ajaxLoader.stop().hide();
    })
    .text('loading');

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
        // console.log(this);
        runInlines.apply(this);
      });
      dimmed = true;
    });
    e.preventDefault();
  });

  $('#dialog').live('touchstart click', function(e) {
    e.preventDefault();
    e.stopPropagation();

    $(this).fadeOut(function() {
      $(this).remove();
    });

    var dialogKey = document.location.href.replace('&p=1','');
    // store that this dialog has been hidden
    (window.hiddenDialogs = window.hiddenDialogs || [])
      .push(dialogKey);

  });

  $('.dashboard #clear').live('click', function(e){
    e.preventDefault();
    if(confirm($(this).data('confirm'))){
      IATI.dashboard.clear();
      window.location.reload();
    }
  });

  // If this is a function that returns a deferred promise, then it will
  // be called before new content is loaded in.
  window.contentExit = null;

  window.currentURL = null;

  //Monitor state changes for Back request
  window.History.Adapter.bind(window,'statechange',function() {
    var State = window.History.getState(),
        url = State.url;

    //Add the xhr param (allows for caching + doesn't clash with 'full' pages)
    var separator = State.url.indexOf('?') == -1 ? '?' : '&';
    url += separator + 'xhr=true';

    //jQuery Cache bug fix
    url = url.replace("?&", "?");

    window.currentURL = url;

    var loadContent = function() {
      $.get(url)
      .pipe(function(response){
        return window.currentURL === url ?
          response :
          $.Deferred().rejectWith(this,['wrong_page']);
      })
      //.pipe(todo)
      .done(function(response){

        var content = $('#content_inner').html(response).get(0);

        if (State.data.enter == 'slideUp') {
          $(content).css('margin-top', 600).animate({'margin-top': 0},runInlines);
        }
        else {
          runInlines.apply(content);
        }

        if(window._gaq) window._gaq.push(['_trackPageview']);

      })
      .fail(function(err){
        if(err != 'wrong_page'){
          if(window.navigator.standalone){
            alert("request error")
          } else {
            // attempt to reload the page, so the
            // real error is shown
            document.location.reload();
          }
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
    if($this.hasClass('no-contentExit')){
      contentExit = false;
    }
    window.History.pushState($this.data('history'), "", $this.attr('href'));
    return false;
  });

  $(runInlines);



  // analytics
  if(window._gaq){
     window._gaq.push(['_trackPageview']);
     var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
     ga.src = ('https:' == document.location.protocol ? 'https://ssl' : 'http://www') + '.google-analytics.com/ga.js';
     var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
  }


})();
