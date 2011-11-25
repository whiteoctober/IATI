(function() {
  // Scales and zooms an element by 3d/2d
  var supports3d = zynga.common.Style.property("perspective");
  $.fn.transform = function(state, is3d) {
    if (is3d === undefined) is3d = true;
    this.each(function() {
      var coords = (-state.left) + "px, " + (-state.top) + "px";
      var translation = supports3d && is3d ? "translate3d(" + coords + ", 0px)" : "translate(" + coords + ")";
      var zoom = "scale(" + state.zoom + ")";
      zynga.common.Style.set(this, "transform", translation + " " + zoom );
    });
  };

  // Sets up zooming and dragging with automatic performance/quality switching and callbacks
  $.fn.activityZoom = function(options) {
    if (options.transition2d === undefined) options.transition2d = true;
    var container = this;
    var activities = container.children();
    var state = {left: 0, top: 0, zoom: 1};
    var zoom = 1;
    var scrolling = function() { return scroller.__isDragging || scroller.__isDecelerating; };
    var set2D = function() { if (options.transition2d && !scrolling()) { activities.transform(state, false); } };
    var render = function(left, top, zoom) {
      state = {left: left, top: top, zoom: zoom};
      activities.transform(state, options.is3d);
    }; 
    zynga.common.Style.set(activities[0], "transform-origin", "0 0");
    scroller = new Scroller(render, {zooming: true, bouncing: true, minZoom: 1, maxZoom: 2.5});
    scroller.onFinishAnimating = set2D;

    //Adjusts the zoomer when the browser dimensions are changed
    var resize = function() {
      if (options.onResize) { options.onResize(state); }
      scroller.setDimensions(container.width(), container.height(), activities.width(), activities.height());
      set2D();
    };
    $(window).bind("resize", resize);
    resize();

    if ('ontouchstart' in window) {
      container[0].addEventListener("touchstart", function(e) {
        scroller.doTouchStart(e.touches, e.timeStamp);
        e.preventDefault();
      }, false);

      document.addEventListener("touchmove", function(e) {
        scroller.doTouchMove(e.touches, e.timeStamp, e.scale);
        e.preventDefault();
      }, false);

      document.addEventListener("touchend", function(e) {
        scroller.doTouchEnd(e.timeStamp);
        var zoomed = scroller.__zoomLevel - zoom;
        set2D();
        if (options.afterScroll) { options.afterScroll(state); }
        if (zoomed != 0) {
          zoom = scroller.__zoomLevel;
          if (options.afterZoom) { options.afterZoom(zoom, zoomed); }
        }
      }, false);

      document.addEventListener("touchcancel", function(e) {
        scroller.doTouchEnd(e.timeStamp);
      }, false);
    } 
    else {
      var mousedown = false;
      container.bind("mousedown", function(e) {
        scroller.doTouchStart([{
          pageX: e.pageX,
          pageY: e.pageY
        }], e.timeStamp);
        mousedown = true;
      });

      $(document).bind("mousemove", function(e) {
        if (!mousedown) { return; }
        scroller.doTouchMove([{
          pageX: e.pageX,
          pageY: e.pageY
        }], e.timeStamp);
        mousedown = true;
      });

      $(document).bind("mouseup", function(e) {
        if (!mousedown) {
          return;
        }
        scroller.doTouchEnd(e.timeStamp);
        set2D();
        mousedown = false;
        if (options.afterScroll) { options.afterScroll(state); }
      });

      var timer;
      activities.bind("mousewheel", function(e) {
        e.preventDefault();
        scroller.doMouseZoom(-e.wheelDelta * 3, e.timeStamp, e.pageX, e.pageY);
        var zoomed = scroller.__zoomLevel - zoom;
        zoom = scroller.__zoomLevel;
        clearTimeout(timer);
        timer = setTimeout(function() {
          set2D();
          if (zoomed != 0) {
            if (options.afterZoom) { options.afterZoom(zoom, zoomed); }
          }
        }, 350);
      });
    }
  };
})();