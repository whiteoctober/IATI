(function() {
  // Assigns a scaled data-size value based on the data-value parameter of each element
  $.fn.assignSizes = function(tmin, tmax) {
    
    var values = $.makeArray(this.map(function() {
      return $(this).data('value');
    }));
    
    var max = Math.max.apply(Math, values);
    var min = Math.min.apply(Math, values);
    var scale = (tmax - tmin) / (max == min ? 1 : max - min);
    
    return this.each(function() {
      var $this = $(this);
      var size = ($this.data('value') * scale) + tmin;
      $this.data('size', size);
    });  
  };

  //Fits text to a container of any shape
  $.fn.fitText = function(edges, options) {
    var items = this.toArray();
    var standardFontSize = 14;
    var fontTolerance = 0.05;
    var predefinedEdges = {
      circular: function(height) { return 1 - Math.cos(Math.asin((height - 0.5) * 2)); },
      none: function() { return 0; }
    };
  
    //Finds predefined edge functions, or set defaults
    if ($.isFunction(edges) || edges.substr) { edges = {left: edges, right: edges}; }
    edges.left = $.isFunction(edges.left) ? edges.left : (predefinedEdges[edges.left] || predefinedEdges.none);
    edges.right = $.isFunction(edges.right) ? edges.right : (predefinedEdges[edges.right] || predefinedEdges.none);
    
    //Calculates the widths of each character in the text
    chars = {};
    var sampler = $("<div><span></span></div>").addClass("sampler").appendTo($("body"));
    var sampleText = sampler.children();
    sampler.css({
      position: "absolute", visibility: 'hidden', 
      width: standardFontSize * 10, 'font-size': standardFontSize
    });
    var allText = $.map(items, function(item) { return $(item).text(); }).join();
    $.map(allText, function(c) {
      c.match(/\s/) ? sampleText.html("&nbsp;") : sampleText.text(c);
      chars[c] = sampleText.width();
    });
    sampler.remove();
    
    //Fits text to each element
    return $.map(items, function(elem) {
      var item = $(elem);
      var originalText = item.text().replace(/\s+/, " ");
      item.empty();
      var total = {width: item.width(), height: item.height()};
      var text = "", lineDetails, remainingText;
      
      for (var fontSize = options.fontMax; fontSize > options.fontMin; fontSize--) {
        item.css({"font-size": fontSize});
        text = originalText;
        var sampler = $("<div>test</div>").appendTo(item)
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
            if (!text[j-1] || text[j-1].match(" ")) lineEnd = j;
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
     
      //Inserts ellipsis if text is concatenated
      if (remainingText.length > 0) {
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
      }

     
      //Inserts lines
      $.map(lineDetails, function(line) {
        $("<span>").text(line.text).css({
          display: 'block', 'text-align': 'center', 'height': line.height,
          'margin-left': line.margins.left, 'margin-right': line.margins.right,
          'margin-top': line.margins.top
        }).appendTo(item);
      });
     
      return remainingText;
    });
  };
})();