
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

// Fits text within a specified shape
$.fn.fitText = function(text, leftEdge, rightEdge) {
  rightEdge = rightEdge || leftEdge;
  var remainingText = this.map(function() {
    var container = $(this);
    var words = text.split(/ +/);
    container.empty();
    var containerSize = {width: container.width(), height: container.height()};
    var samplerBox = $("<div><span>a</span></div>").addClass("sampler").appendTo(container);
    samplerBox.css({
      position: "absolute", visibility: 'hidden', width: containerSize.width * 2
    });
    var sampler = samplerBox.children();
    var lineHeight = sampler.height();
    var lines = Math.floor(containerSize.height / lineHeight);
    var fittedWords, leftMargin, rightMargin, width, contentPlaced = false;
    for (var i = 1; i <= lines; i++) {
      leftMargin = parseInt(leftEdge(i/lines) * containerSize.width/2);
      rightMargin = parseInt(rightEdge(i/lines) * containerSize.width/2);
      width = containerSize.width - leftMargin - rightMargin;
      for (var wordsFitting = 0; wordsFitting < words.length; wordsFitting++) {
        sampler.html(words.slice(0, wordsFitting + 1).join(" "));
        if (sampler.width() > width) break;
      }
      if (wordsFitting > 0) {
        $("<span>").html(words.slice(0, wordsFitting).join(" ")).css({
          'margin-left': leftMargin, 'margin-right': rightMargin,  
          'margin-top': contentPlaced ? 0 : (containerSize.height % lineHeight),
          display: 'block', 'text-align': 'center', 
        }).appendTo(container);
        words = words.slice(wordsFitting);
        contentPlaced = true;
      }
      else {
        return words.length; 
      }
      if (words.length == 0) { return ""; }
    }
  });
  this.children(".sampler").remove();
  return remainingText[0] || [];
};