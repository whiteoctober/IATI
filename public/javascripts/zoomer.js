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
    this.xoff = this.oxoff = 0;
    this.yoff = this.oyoff = 0;
    this.touches = 0;
    this.touchRemoved = false;
    this.starts = [];
    
    element.addEventListener('gesturestart', this, false);
    element.addEventListener('gesturechange', this, false);
    element.addEventListener('gestureend', this, false);
    element.addEventListener('touchstart', this, false);
    element.addEventListener('touchmove', this, false);
    element.addEventListener('touchend', this, false);
    
    // if(options.constrainToWindow)
      this.setConstraints();
    
    // switch to 2d
    this.render(true);
    
    //move to top and prevent scroll actions
    document.body.scrollTop = 0; noscroll = true;
    
    // transform from top-left to make constraining easier
    element.style.webkitTransformOrigin = '0 0';
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
    this.oxoff = e.pageX + this.x;
    this.oyoff = e.pageY + this.y;
  };
  
  
  Zoomer.prototype.onGestureChange = function(e) {
    this.scale = this.oScale * e.scale;
    
    this.xoff = ((e.pageX + this.x) * e.scale) - this.oxoff;
    this.yoff = ((e.pageY + this.y) * e.scale) - this.oyoff;
  };
  
  
  Zoomer.prototype.onGestureEnd = function(e) {
    this.oScale = this.scale;
    this.x += this.xoff;
    this.y += this.yoff;
    this.xoff = 0;
    this.yoff = 0;
  };
  
  
  Zoomer.prototype.onTouchStart = function(e) {
    this.touches = e.touches.length;
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
    this.touches = e.touches.length;
    this.touchRemoved = true;
    
    var zoomedIn = this.scale < 1.3;
    
    this.render(zoomedIn);
    
    if(!e.touches.length){
      this.go3d(zoomedIn);
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
    if(this.constrain)
      this.constrain();
    
    var x = (this.x + this.xoff) * -1;
    var y = (this.y + this.yoff) * -1;
    
    var transform = _3d ?
      'translate3d('+x+'px, '+y+'px, 0) scale3d('+this.scale+','+this.scale+', 1)' :
      'translate('+x+'px, '+y+'px) scale('+this.scale+')' ;
    
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
  
  // this sets the .constrain function based on the 
  // element and viewport widths
  Zoomer.prototype.setConstraints = function(){
    var elementWidth = this.element.clientWidth;
    var windowWidth = window.innerWidth;
    
    var elementHeight = this.element.clientHeight;
    var windowHeight = window.innerHeight;
    
    // optimised slightly for changing scale, would like
    // to see this nicer
    var currentScale = 0;
    var maxx = 0;
    var maxy = 0;
    
    this.constrain = function(){
      if(this.scale < 1){
        this.scale = 1;
      }
      if(this.scale != currentScale){
        currentScale = this.scale;
        maxx = (currentScale*elementWidth) - windowWidth;
        maxy = (currentScale*elementHeight) - windowHeight;
      }
      
      if (maxx < 0){ 
        this.x = 0;
      } else if(this.x > maxx - this.xoff){
        this.x = maxx - this.xoff;
      } else if(this.x < -this.xoff){
        this.x = -this.xoff;
      }
      
      if (maxy < 0) { 
        this.y = 0;
      } else if(this.y > maxy - this.yoff){
        this.y = maxy - this.yoff;
      } else if(this.y < - this.yoff){
        this.y =  -this.yoff;
      }
      
    };
  };
  
  
  
  window.Zoomer = Zoomer;
  
}(window));