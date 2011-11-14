var IATI = IATI || {};

(function(IATI, $){
  var storage = window.localStorage,
      data = {};
  
  function persist(){
    storage.setItem('dashboard', JSON.stringify(data));
  }
  
  function fetch(){
    data = JSON.parse(storage.getItem('dashboard'));
  }
  fetch();
  
  // see if a url is in any of the sections of the dashboard
  function contains(url){
    for(var key in data){
      if(data.hasOwnProperty(key)){
        var urls = data[key];
        for (var i=0; i < urls.length; i++) {
          if(url == urls[i]){
            return true;
          }
        }
      }
    }
    return false;
  }
  
  
  //public interface
  IATI.dashboard = {
    clear:function(){
      data = {};
      persist();
    },
    add:function(key, url){
      data[key] = data[key] || [];
      data[key].push(url);
      persist();
    },
    get:function(key){
      return data[key] || [];
    },
    contains:contains
  };
  
  
  // jQuery helper to put the content in the dashboard page
  
  $.fn.dashboardContent = function(key){
    var _this = this.empty();
    
    $.each(IATI.dashboard.get(key), function(k,url){
      _this.append($('<li>').text(url));
    });
    
  };
  
  $.fn.favourite = function(){
    return this.each(function(){
      var $this = $(this);
      
      $this.toggleClass('added', contains($this.attr('href')));
      
      $this.click(function(){
        
        // add()
      });
      
    });
  };
  
})(IATI, jQuery);

