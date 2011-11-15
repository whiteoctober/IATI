/*
    A pan/zoom plugin for iOS devices
*/

(function(window){
  
  
  var Zoomer = function(element, elements) {
    this.elements = elements;
    this.element = element;
    this.oScale = this.scale = 1;
    this.x = 0;
    this.y = 0;
    this.touches = 0;
    
    element.addEventListener('gesturestart', this, false);
    element.addEventListener('gesturechange', this, false);
    element.addEventListener('gestureend', this, false);
    element.addEventListener('touchstart', this, false);
    element.addEventListener('touchmove', this, false);
    element.addEventListener('touchend', this, false);
    
    this.render(true);
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
        this.onTouchStart(e);
        break;
      case 'touchmove':
        this.onTouchMove(e);
        break;
      case 'touchend':
        this.onTouchEnd(e);
        break;
    }
  };
  
  
  Zoomer.prototype.onGestureStart = function(e) {
    // TODO - offset this appropriately
    this.gesturing = true;
  };
  
  
  Zoomer.prototype.onGestureChange = function(e) {
    this.scale = this.oScale * e.scale;
  };
  
  
  Zoomer.prototype.onGestureEnd = function(e) {
    this.oScale = this.scale;
    this.gesturing = false;
  };
  
  
  Zoomer.prototype.onTouchStart = function(e) {
    // TODO : refire event on tap
    e.preventDefault();
    
    if(!this.touches) this.go3d(true);
    
    this.touches++;
    
    this.startX = (e.touches[0].pageX + this.x);
    this.startY = (e.touches[0].pageY + this.y);
    
  };
  
  
  Zoomer.prototype.onTouchMove = function(e) {
    //TODO : multiple touches, snaps between them as fingers lift
    this.x = this.startX - e.touches[0].pageX;
    this.y = this.startY - e.touches[0].pageY;
    this.render(true);
  };
  
  
  Zoomer.prototype.onTouchEnd = function(e) {
    this.touches--;
    
    this.render();
    
    if(!this.touches) this.go3d(false);
    
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
  
  
  window.Zoomer = Zoomer;
  
}(window));