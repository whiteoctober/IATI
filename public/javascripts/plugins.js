(function($) {
  
  // stop all the links from working within a section
  $.fn.disable = function(){
    return $(this).bind('click touch', function(e){
      e.preventDefault();
      e.stopPropagation();
    }).css('cursor', 'default');
  };
  
  // This fires an animation,  but returns a 
  // deferred object rather than the jQuery object
  $.fn.deferredAnimate = function( prop, speed, easing, callback ){
    var dfr = $.Deferred();
    
    // update the appropriate arguments
    if(typeof speed === "object"){
      speed.complete = withResolve(speed.complete);
    } else {
      
      // this part might be nicer to do with the argument
      if(speed === undefined || $.isFunction(speed)){
        speed = withResolve(speed);
        
      } else if(easing === undefined || $.isFunction(easing)){
        easing = withResolve(easing);
        
      } else if(callback === undefined || $.isFunction(callback)){
        callback = withResolve(callback);
      }
      
    }
    
    this.animate(prop, speed, easing, callback);
    
    return dfr.promise();
    
    // calls a function, then resolved the deffered object
    function withResolve(fn){
      return function(){
        if($.isFunction(fn)){
          $.proxy(fn, this)();
        }
        dfr.resolve(); 
      };
    }
  };
  
  
  //Fits text to a container of any shape
  var chars = {};
  $.fn.fitText = function(edges, options) {
    var defaults = {font: {min: 12, max: 25}, delay: 30, truncate: true};
    options = $.extend(defaults, options);
    var items = this.toArray();
    var standardFontSize = 14;
    var fontTolerance = 0.15;
    var predefinedEdges = {
      circular: function(height) { return 1 - Math.cos(Math.asin((height - 0.5) * 2)); },
      none: function() { return 0; }
    };
    
    //Finds predefined edge functions, or set defaults
    if ($.isFunction(edges) || edges.substr) { edges = {left: edges, right: edges}; }
    edges.left = $.isFunction(edges.left) ? edges.left : (predefinedEdges[edges.left] || predefinedEdges.none);
    edges.right = $.isFunction(edges.right) ? edges.right : (predefinedEdges[edges.right] || predefinedEdges.none);
   
    //Calculates the widths of each character in the text
    var allText = $.map(items, function(item) { return $(item).text(); }).join() + ".";
    var allNewText = '';
    $.map(allText, function(c) {
      if (!chars[c]) allNewText = allNewText + c;
    });
    if (allNewText.length > 0) {
      var sampler = $("<div><span></span></div>").addClass("sampler").appendTo($("body"));
      var sampleText = sampler.children();
      sampler.css({
        position: "absolute", visibility: 'hidden', 
        width: standardFontSize * 10, 'font-size': standardFontSize
      });
      $.map(allNewText, function(c) {
        if (chars[c]) return;
        c.match(/\s/) ? sampleText.html("&nbsp;") : sampleText.text(c);
        chars[c] = sampleText.width();
      });
      sampler.remove();
    }
    
    //Fits text to an element
    var fitTextTo = function(items, index) {
      index = index || 0;
      var item = $(items[index]);
      
      if (item.is(":visible")) {
        if (item.data("text")) var originalText = item.data("text"); 
        else {
          var originalText = item.text()
            .replace(/\r\t +/, " ")
            .replace(/ \n/, "\n")
            .replace(/\s*\/\s*/g, " / ")
            .replace(/\s*\\\s*/g, " \\ ")
            .replace(/\.\s*/g, ". ")
            .replace(/,\s*/g, ", ");
        }
        item.data("text", originalText);
        item.empty();
        var total = {width: item.width(), height: item.height()};
        var text = '', lineDetails, remainingText;
        
        for (var fontSize = options.font.max; fontSize > options.font.min; fontSize = fontSize - 1) {
          item.css({"font-size": fontSize});
          text = originalText;
          var sampler = $("<span>test</span>").css({visibility: 'hidden'}).appendTo(item);
          var lineHeight = sampler.height();
          var lines = Math.floor(total.height / lineHeight);
          var centering = (total.height % lineHeight) / 2;
          sampler.remove();
          
          //Fits text within each line in the element
          lineDetails = [];
          for (var i = 0; i < lines; i++) {
            var height = {
              upper: (lineHeight * i + centering) / total.height,
              lower: (lineHeight * (i + 1) + centering) / total.height
            };
            var margins = {
              top: i == 0 ? centering : 0,
              left: Math.max(
                parseInt(edges.left(height.upper) * total.width / 2), 
                parseInt(edges.left(height.lower) * total.width / 2)
              ),
              right: Math.max(
                parseInt(edges.right(height.upper) * total.width / 2), 
                parseInt(edges.right(height.lower) * total.width / 2)
              )
            };
            var width = total.width - margins.left - margins.right;
            
            //Finds how much text will fit in the line
            var lineEnd = length = 0;
            var effectiveWidth = width * (1 - fontTolerance);
            for (var j = 0; length < effectiveWidth && j <= text.length + 1; j++) {
              if (text[j-1] == "\n") { lineEnd = j; break; }
              if (!text[j-1] || text[j-1] == " ") lineEnd = j;
              length = 0;
              $.map(text.slice(0, j), function(c) {
                length += chars[c] * fontSize/standardFontSize;
              });
            }
            
            lineDetails[i] = {
              text: text.slice(0, lineEnd), 
              height: lineHeight, 
              margins: margins
            };
            text = text.slice(lineEnd).replace(/^ /, "");
          }
          remainingText = text;
          if (remainingText.length == 0) break;
        }
       
        //TODO: remove characters/lines until space is found for an ellipsis, add it.
        //Inserts ellipsis if text is truncated
        if (options.truncate && remainingText.length > 0) {
          var lastFound = false;
          var firstFound = false;
          $.map(lineDetails, function(line, i) {
            if (line.text.length > 0) firstFound = true;
            var lastLine = (line.text.length == 0 || i == lineDetails.length - 1);
            if (firstFound && !lastFound && lastLine) {
              line.text = "...";
              line.margins.left = line.margins.right = 0;
              lastFound = true;
            }
          });
          if (!lastFound) {
            lineDetails[0].text = "...";
            lineDetails[0].margins.left = lineDetails[0].margins.right = 0;
          }
          item.addClass("truncated");
        }
        else { item.removeClass("truncated"); }
       
        //Inserts lines
        $.map(lineDetails, function(line) {
          $("<span>").text(line.text).css({
            display: 'block', 'text-align': 'center', 'height': line.height,
            'margin-left': line.margins.left, 'margin-right': line.margins.right,
            'margin-top': line.margins.top
          }).appendTo(item);
        });
      }
      
      if (options.afterEach) item.each(options.afterEach);
      if (items[index + 1]) setTimeout(function() { fitTextTo(items, index + 1); }, options.delay);
    };
    
    //Fits text to elements in a staggered way
    fitTextTo(items);
  };
  
  
  $.iatiDialog = function(title, body, appendTarget){
    $('#modal').remove();
    if(title == 'remove') return;
    
    var modal = $('<div id="modal" style="opacity:0;margin-top:0"><div class="inner"><a class="close">&times;</a><h1></h1><div class="content"></div></div></div>');
    
    modal.find('.close').click(function(){
      modal.css({opacity:0, marginTop:0});
      setTimeout(function(){
        modal.remove();
      },200)
    })
    
    modal.find('h1').text(title).after(body || '');

    $(appendTarget || 'body').prepend(modal);
    
    setTimeout(function(){
      modal.css({opacity:1, marginTop:3});
    },0);
    
    return modal;
  }
  
})(jQuery);