(function(exports) {  
  // default to site layout when view=full and allow no layout on
  // ajax requests
  var widgetLayout = function(req){
    return req.xhr ? false : (req.query.view == 'full' ? true : 'widget');
  }
  
  
  //Initialises up widget pages and routes
  exports.init = function(app, api, _, accessors) {
  
    //Widget displaying a pie chart of the biggest donors for a group of activities
    app.get('/widgets/donors', function(req, res, next) {
      var params = {
        result: 'values',
        groupby: 'Funder',
        orderby: 'values'
      };

      _.extend(params, req.filter_query);
      new api.Request(params)
        .on('success', function(data) {
          var dataFile = accessors.dataFile(data);
          
          res.render('widgets/donors', {
            title: "Top Donors Widget",
            donors: dataFile.funders(),
            layout: widgetLayout(req)
          });
        })
        .on('error', function(e) {
          next(e);
        })
        .end();
    });

    
    //Widget displaying a bar chart of the 6 most significant sectors for a group of activities
    app.get('/widgets/sectors', function(req, res, next) {
      var params = {
        result: 'values',
        groupby: 'Sector',
        orderby: 'values'
      };

      _.extend(params, req.filter_query);
      new api.Request(params)
        .on('success', function(data) {
          var dataFile = accessors.dataFile(data);

          res.render('widgets/sectors', {
            title: "Top Sectors Widget",
            sectors: dataFile.sectors(),
            layout: widgetLayout(req)
          });
        })
        .on('error', function(e) {
          next(e);
        })
        .end();
    });

    
    //Widget displaying up to 5 of the newest projects for a group of activities
    app.get('/widgets/new_projects', function(req, res, next) {    
      var params = {
        result: 'values',
        orderby: 'start-actual',
        pagesize: 5
      };

      _.extend(params, req.filter_query);
      new api.Request(params)
        .on('success', function(data) {
          var dataFile = accessors.dataFile(data);

          res.render('widgets/new_projects', {
            title: "New Projects Widget",
            activities: dataFile.activities(),
            layout: widgetLayout(req)
          });
        })
        .on('error', function(e) {
          next(e);
        })
        .end();
    });
    
    
    //Widget displaying a map with the location of an activity
    app.get('/widgets/project_map', function(req, res, next) {
      var params = {result: 'full'};
      

      _.extend(params, req.filter_query);
      new api.Request(params)
        .on('success', function(data) {
          var activity = accessors.activity(data);

          var locations = activity.locations();
          if(locations.length){
            res.render('widgets/project_map_geo', {
              title: "Geographical Location Widget",
              locations: locations,
              layout: widgetLayout(req)
            });
          } else {
            var countries = activity.recipientCountries();
            res.render('widgets/project_map_countries', {
              title: "Geographical Location Widget",
              countries: countries,
              layout: widgetLayout(req)
            });
          }


        })
        .on('error', function(e) {
          next(e);
        })
        .end();
    });
    
    
    //Widget displaying a project description for an activity
    app.get('/widgets/project_description', function(req, res, next) {
      var params = {result: 'details'};
      
      _.extend(params, req.filter_query);
      new api.Request(params)
        .on('success', function(data) {
          var activity = accessors.activity(data);

          res.render('widgets/project_description', {
            title: "Project Description Widget",
            activity: activity,
            layout: widgetLayout(req)
          });
        })
        .on('error', function(e) {
          next(e);
        })
        .end();
    });
    
    
    //Widget displaying a list of participating organisations for an activity
    app.get('/widgets/participating_organisations', function(req, res, next) {
      var params = {result: 'details'};

      _.extend(params, req.filter_query);
      new api.Request(params)
        .on('success', function(data) {
          var activity = accessors.activity(data);
          
          res.render('widgets/participating_organisations', {
            title: "Participating Organisations Widget",
            activity: activity,
            layout: widgetLayout(req)
          });
        })
        .on('error', function(e) {
          next(e);
        })
        .end();
    });
    
    
    //Widget displaying a graph of project sectors for an activity
    app.get('/widgets/project_sectors', function(req, res, next) {
      var params = {result: 'details'};

      _.extend(params, req.filter_query);
      new api.Request(params)
        .on('success', function(data) {
          var activity = accessors.activity(data);

          res.render('widgets/project_sectors', {
            title: "Project Sectors Widget",
            activity: activity,
            layout: widgetLayout(req)
          });
        })
        .on('error', function(e) {
          next(e);
        })
        .end();
    });
    
    
    //Widget displaying a bar chart of funding figures for an activity
    app.get('/widgets/funding_breakdown', function(req, res, next) {
      var params = {result: 'details'};

      _.extend(params, req.filter_query);
      new api.Request(params)
        .on('success', function(data) {
          var activity = accessors.activity(data);

          res.render('widgets/funding_breakdown', {
            title: "Funding Breakdown Widget",
            layout: 'widget' // NOTE - this will have to be changed to link in app
          });
        })
        .on('error', function(e) {
          next(e);
        })
        .end();
    });
    
    //Widget displaying contact details for an activity
    app.get('/widgets/contact_details', function(req, res, next) {
      var params = {result: 'details'};

      _.extend(params, req.filter_query);
      new api.Request(params)
        .on('success', function(data) {
          var activity = accessors.activity(data);
          res.render('widgets/contact_details', {
            title: "Contact Details Widget",
            layout: 'widget', // NOTE - this will have to be changed to link in app
            contactInfo:activity.contactInfo()
          });
        })
        .on('error', function(e) {
          next(e);
        })
        .end();
    });
    
    
    //Renders an embed dialog
    app.get('/embed', function(req, res, next) {
      var widget_url = req.query.widget_url;
      var origin_url = req.query.origin_url;

      delete req.query.widget_url;
      delete req.query.origin_url;
      res.render('embed_dialog', {
        title: "Embed Widget",
        widget_url: widget_url,
        origin_url: origin_url,
        layout: false
      });
    });
  
  };
})(exports);