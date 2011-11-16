var IATI = IATI || {};

(function(IATI, $, _){
  var storage = window.localStorage,
      data = [];
  
  /* Data Format
  [{
    href:'/some/content/endpoint',
    section:'activities',
    subsection:'My USA AID Activities'
  },{
    href:'/some/content/endpoint.df',
    section:'datafile'
  }]
  */
  
  function persist(){
    storage.setItem('dashboard', JSON.stringify(data));
  }
  
  function fetch(){
    data = JSON.parse(storage.getItem('dashboard')) || [];
  }
  fetch();
  
  // see if a url is in any of the sections of the dashboard
  function contains(url){
    return _.any(data, function(part){
      return part.href == url;
    });
  }
  
  
  //public interface
  IATI.dashboard = {
    data:data,
    clear:function(){
      data = [];
      persist();
    },
    add:function(key, url){
      data.push({
        href:url,
        section:key
      });
      persist();
    },
    get:function(key){
      return _.filter(data,function(d){
        return d.section == key;
      });
    },
    contains:contains
  };
  
  
  // jQuery helper to put the content in the dashboard page
  $.fn.dashboardContent = function(){
    var $this = this;
    _.each(data, function(d){
      var section = $this.find('section.' + d.section + ' .content');
      
      var widget = $('<li class="widget">');
      widget.appendTo(section);
      $('<iframe>', {
        src: d.href,  frameborder: 0, scrolling: "no",
        css: {width: widget.width(), height: widget.height()}
      }).appendTo(widget);
    });
  };
  
  //update the class based on if this is on the dashboard
  $.fn.favourite = function(){
    return this.each(function(){
      var $this = $(this);
      $this.toggleClass('added', contains($this.attr('href')));
    });
  };
  
  
  $('.favourite').live('click', function(e){
    e.preventDefault();
    var $this = $(this);
    
    IATI.dashboard.add($this.data('dashkey'), $this.attr('href'));
    
    $this.addClass('added');
  });
  
})(IATI, jQuery, _);

