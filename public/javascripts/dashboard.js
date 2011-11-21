var IATI = IATI || {};

(function(IATI, $, _){
  var storage = window.localStorage,
      data = [];
  
  /* Data Format
  [{
    href:'/some/content/endpoint',
    key:'activities',
    subkey:'My USA AID Activities'
  },{
    href:'/some/content/endpoint.df',
    key:'datafile'
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
      this.aadd({
        href:url,
        key:key
      });
    },
    aadd:function(obj){
      data.push(obj);
      persist();
    },
    subkeysFor:function(key){
      return _(data).chain().filter(function(d){
        return d.key == key;
      }).pluck('subkey').uniq().value();
    },
    get:function(key){
      return _.filter(data,function(d){
        return d.key == key;
      });
    },
    contains:contains
  };
  
  
  var subSectionTmpl = '<li class="sub"><h2></h2><ol class="content"></ol></li>';
  
  // jQuery helper to put the content in the dashboard page
  $.fn.dashboardContent = function(){
    var $this = this;
    
    _.each(data, function(d){
      var target = $('[data-dashkey='+d.key+']',$this);
      
      if(d.subkey !== undefined){
        
        var newTarget = $('.sub', target).filter(function(){
          return $(this).data('subkey') == d.subkey;
        });
        
        if(!newTarget.size()){
          // create a new sub section
          newTarget = $(subSectionTmpl)
            .data('subkey', d.subkey)
            .find('h2').text(d.subkey).end()
            .prependTo(target);
        }
        
        target = newTarget;
        
      }
      
      var section = target.find('.content');
      
      if(d.type == 'embed'){
        $('<li class="embeded">').appendTo(section).load(d.href,runInlines);
        
      } else {
        //presume iframe
        var widget = $('<li class="widget">');
        widget.appendTo(section);
        $('<iframe>', {
          src: d.href,  frameborder: 0, scrolling: "no",
          css: {width: widget.width(), height: widget.height()}
        }).appendTo(widget);
      }
      
    });
  };
  
  //update the class based on if this is on the dashboard
  $.fn.favourite = function(){
    return this.each(function(){
      var $this = $(this);
      var href = $this.data('dash') ? 
        $this.data('dash').href :
        $this.attr('href');
      
      $this.toggleClass('added', contains(href));
    });
  };
  
  
  var subkeyChoiceTmpl = '<ol><li><form><input type="text" name="groupname"/><input type="submit" value="create"/></form></li></ol>';
  
  $('[data-dash]').live('click', function(e){
    e.preventDefault();
    
    var _data = _.clone($(this).data('dash'));
    
    if(_data.subkey === false){
      //subkey required, display dialog
      
      var content = $(subkeyChoiceTmpl);
      
      
      // add in the sub keys
      //find the sub keys
      _.each(IATI.dashboard.subkeysFor(_data.key), function(subkey){
        var k = $('<li>').text(subkey);
        k.click(function(){
          _data.subkey = subkey;
          IATI.dashboard.aadd(_data);
          
          $.iatiDialog('added');
        });
        content.prepend(k);
      });
      
      
      content.find('form').submit(function(e){
        e.preventDefault();
        
        // get the input text, and create a subkey
        var subkey = content.find('input').val();
        if(subkey === '') return;
        
        _data.subkey = subkey;
        
        IATI.dashboard.aadd(_data);
        
        $.iatiDialog('added');
        
      });
      
      $.iatiDialog("Add to group",content);
      
      
    } else {
      // add to the dashboard
      $.iatiDialog("Add to dashboard","added to dashboard");
      
      IATI.dashboard.aadd(_data);
      
    }
    
  });
  
  
})(IATI, jQuery, _);

