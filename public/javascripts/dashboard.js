var IATI = IATI || {};

(function(IATI){
  
  var data = {};
  
  var storage = window.localStorage;
  
  function persist(){
    storage.setItem('dashboard', JSON.stringify(data))
  }
  
  function fetch(){
    data = JSON.parse(storage.getItem('dashboard'));
  }
  
  fetch();
  
  
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
    }
  };
  
})(IATI);

