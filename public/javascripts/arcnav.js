(function($,_){
  
  // Pulls the names of the current filters via xhr - then 
  // puts them into the layout
  
  $.setArcNav = function(params, path){
    
    path = path || '/activities';
    
    if(!params) return $('.arcnav').empty();

    //change into a format that jQ likes to serialise
    var query = _.flatten(_.map(params, function(ids, filterkey){
      return _.map(_.flatten([ids]), function(id){
        return {
          name:filterkey,
          value:id
        };
      });
    }));

    $.getJSON('/arcnav', params).done(function(expanded){
      
       $('.arcnav').empty();

      // use the returned expanded titles to populate the links
      _.each(params, function(ids, filterkey){
        
        // key was found
        if(!expanded[filterkey]) return;

        var nav = $('.arcnav.' + filterkey.toLowerCase());

        _.each(_.flatten([ids]), function(id){
          
          // value was found
          if(!expanded[filterkey][id]) return;

          $('<li><a href="#"></a></li>')

            .find('a').text(expanded[filterkey][id]).click(function(e){
              e.preventDefault();
              // the query without this one
              var link = _.filter(query, function(obj){
                return ! (obj.name == filterkey && obj.value == id);
              });

              window.History.pushState("", "", path + '?' + $.param(link));
              $(this).css('opacity', 0.3);

            }).end()

            .appendTo(nav);
        });
      });
    });
  };
  
  
})(jQuery,_);