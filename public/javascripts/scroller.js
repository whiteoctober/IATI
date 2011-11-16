/*
    A vertical scroll plugin for iOS
    
    TODO:
      - limiting
      - inertia
*/

(function(window){
  
  // Prevent native scrolling if zoomer is used
  var noscroll;
  document.body.addEventListener('touchmove', function(e) {
    if(noscroll) e.preventDefault();
  }, false);
  
  
  var Scroller = function(element, options) {
    options = options || {};
    this.finish = options.finish || false;
    
    this.element = element;
    this.y = 0;
    
    element.addEventListener('touchstart', this, false);
    element.addEventListener('touchmove', this, false);
    element.addEventListener('touchend', this, false);
    
    //move to top and prevent scroll actions
    document.body.scrollTop = 0; noscroll = true;
  };
  
  
  Scroller.prototype.handleEvent = function(e) {
    switch (e.type) {
      case 'touchstart':
        this.onTouchStart(e);
        break;
      case 'touchmove':
        this.onTouchMove(e);
        break;
    }
    
    // debug : display debugging info in the menu bar
    // window.document.title = "touches:" + this.touches + ", preventedEvent:" + (this.preventedEvent ? 'YES' : 'NO');
  };
  
  
  Scroller.prototype.onTouchStart = function(e) {
    this.startX = (e.touches[0].pageX + this.x);
    this.startY = (e.touches[0].pageY + this.y);
  };
  
  
  Scroller.prototype.onTouchMove = function(e) {
    this.x = this.startX - e.touches[0].pageX;
    this.y = this.startY - e.touches[0].pageY;
    this.render();
  };
  
  
  
  Scroller.prototype.render = function() {
    //always 3d because no zooming
    this.element.style.webkitTransform = 'translate3d(0px, '+this.y*-1+'px, 0)';
  };
  
  
  window.Scroller = Scroller;
  
}(window));