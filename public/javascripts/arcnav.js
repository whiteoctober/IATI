(function($,_){
  
  // keys to strip out of the param string
  // (slightly late in the day to do this properly)
  var strip = 'xhr p'.split(' ');
  
  // Pulls the names of the current filters via xhr - then 
  // puts them into the layout
  
  $.setArcNav = function(params, path){
    path = path || document.location.pathname;
    
    _.each(strip, function(s){
      delete params[s];
    });
    
    //change into a format that jQ likes to serialise
    var query = _.flatten(_.map(params, function(ids, filterkey){
      return _.map(_.flatten([ids]), function(id){
        return {
          name:filterkey,
          value:id
        };
      });
    }));
    
    // set the links for the sector filters 
    var qs = $.param(query); 
    _.each(['Sector', 'Country', 'Funder'], function(filterkey){
      var href = '/filter/' + filterkey + (qs ? '?' + qs : '');
      $('.filter.' + filterkey.toLowerCase()).attr('href', href);
    });
    
    
    if(!params) return $('.arcnav').empty();

    $.getJSON('/arcnav', params).done(function(expanded){
      
       $('.arcnav').empty();

      // use the returned expanded titles to populate the links
      _.each(params, function(ids, filterkey){
        
        // key was found
        if(!expanded[filterkey]) return;

        var nav = $('.arcnav.' + filterkey.toLowerCase());

        _.each(_.flatten([ids]), function(id){
          
          $('<li><a href="#"></a></li>')

            .find('a').text(expanded[filterkey][id] || 'unknown').click(function(e){
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