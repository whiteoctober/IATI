/*
    A pan/zoom plugin for iOS devices
    
    TODO:
      - (bug) iOS 4 doesn't update url on emulated mouse click
      - constrain to within window
      - constrain min/max zoom
      - zoom from origin of touch
      - allow allow clicks to give feedback target element
    
*/

(function(window){
  
  // Prevent native scrolling if zoomer is used
  var noscroll;
  document.body.addEventListener('touchmove', function(e) {
    if(noscroll) e.preventDefault();
  }, false);
  
  
  var Zoomer = function(element, elements, options) {
    options = options || {};
    this.finish = options.finish || false;
    
    
    this.elements = elements;
    this.element = element;
    this.oScale = this.scale = 1;
    this.x = 0;
    this.y = 0;
    this.touches = 0;
    this.touchRemoved = false;
    this.starts = [];
    
    element.addEventListener('gesturestart', this, false);
    element.addEventListener('gesturechange', this, false);
    element.addEventListener('gestureend', this, false);
    element.addEventListener('touchstart', this, false);
    element.addEventListener('touchmove', this, false);
    element.addEventListener('touchend', this, false);
    
    // switch to 2d
    this.render(true);
    
    //move to top and prevent scroll actions
    document.body.scrollTop = 0; noscroll = true;
  };
  
  
  Zoomer.prototype.handleEvent = function(e) {
    switch (e.type) {
      case 'gesturestart':
        this.onGestureStart(e);
        break;
      case 'gesturechange':
        this.onGestureChange(e);
        break;
      case 'gestureend':
        this.onGestureEnd(e);
        break;
      case 'touchstart':
        this.preventEvent(e);
        this.onTouchStart(e);
        break;
      case 'touchmove':
        this.onTouchMove(e);
        break;
      case 'touchend':
        this.onTouchEnd(e);
        this.firePreventedEvent(e);
        break;
    }
    
    // debug : display debugging info in the menu bar
    // window.document.title = "touches:" + e.touches.length + ", preventedEvent:" + (this.preventedEvent ? 'YES' : 'NO');
  };
  
  
  
  Zoomer.prototype.onGestureStart = function(e) {
    // TODO - provide offset for 'zooming from a point'
  };
  
  
  Zoomer.prototype.onGestureChange = function(e) {
    this.scale = this.oScale * e.scale;
  };
  
  
  Zoomer.prototype.onGestureEnd = function(e) {
    this.oScale = this.scale;
  };
  
  
  Zoomer.prototype.onTouchStart = function(e) {
    if(e.touches.length == 1) this.go3d(true);
    
    this.start = {
      x: e.touches[0].pageX + this.x, 
      y: e.touches[0].pageY + this.y
    };
  };
  
  
  Zoomer.prototype.onTouchMove = function(e) {
    if (this.touchRemoved) {
      var diff = [
        Math.abs(this.x - (this.start.x - e.touches[0].pageX)),
        Math.abs(this.y - (this.start.y - e.touches[0].pageY))
      ];
      
      if (Math.max.apply(Math, diff) > 50) {
        this.start = {
          x: e.touches[0].pageX + this.x, 
          y: e.touches[0].pageY + this.y
        };
      }
      this.touchRemoved = false;
    }
    
    this.x = this.start.x - e.touches[0].pageX;
    this.y = this.start.y - e.touches[0].pageY;
    this.render(true);
    
    // cancel firing the original event
    this.preventedEvent = null;
  };
  
  Zoomer.prototype.onTouchEnd = function(e) {
    this.touchRemoved = true;
    
    this.render();
    
    if(!e.touches.length){
      this.go3d(false);
      if(this.finish){
        this.finish.apply(this);
      }
    }
  };
  
  
  // switch to or from 3d element by element
  Zoomer.prototype.go3d = function(_3d) {
    var transform = _3d ? 'translate3d(0,0,0)' : '';
    for (var i = this.elements.length - 1; i >= 0; i--){
      this.elements[i].style.webkitTransform = transform;
    }
  };
  
  
  Zoomer.prototype.render = function(_3d) {
    var transform = _3d ?
      'translate3d('+this.x*-1+'px, '+this.y*-1+'px, 0) scale3d('+this.scale+','+this.scale+', 1)' :
      'translate('+this.x*-1+'px, '+this.y*-1+'px) scale('+this.scale+')' ;
    
    this.element.style.webkitTransform = transform;
    
  };
  
  
  Zoomer.prototype.preventEvent = function(e){
    e.preventDefault();
     // store the event on the first touch
    if(!this.touches) {
      this.preventedEvent = e;
    }
  };
  
  
  // fire the prevented event maybe
  Zoomer.prototype.firePreventedEvent = function(){
    if(this.preventedEvent && !this.touches){
      
      //simulate clicking
      var evt = document.createEvent("MouseEvents");
      evt.initMouseEvent("click", true, true, window,
         0, 0, 0, 0, 0, false, false, false, false, 0, null);
      
      this.preventedEvent.target.dispatchEvent(evt);
      
    }
  };
  
  
  window.Zoomer = Zoomer;
  
}(window));