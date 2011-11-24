(function(exports) {
  //Initialises up widget pages and routes
  exports.init = function(app, filters, api, _, accessors) {
  
    //Widget displaying a pie chart of the biggest donors for a group of activities
    app.get('/widgets/donors', filters, function(req, res, next) {
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
            layout: 'widget'
          });
        })
        .on('error', function(e) {
          next(e);
        })
        .end();
    });

    
    //Widget displaying a bar chart of the 6 most significant sectors for a group of activities
    app.get('/widgets/sectors', filters, function(req, res, next) {
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
            layout: 'widget'
          });
        })
        .on('error', function(e) {
          next(e);
        })
        .end();
    });

    
    //Widget displaying up to 5 of the newest projects for a group of activities
    app.get('/widgets/new_projects', filters, function(req, res, next) {    
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
            layout: 'widget'
          });
        })
        .on('error', function(e) {
          next(e);
        })
        .end();
    });
    
    
    //Widget displaying a map with the location of an activity
    app.get('/widgets/project_map', filters, function(req, res, next) {
      var params = {result: 'geo'};

      _.extend(params, req.filter_query);
      new api.Request(params)
        .on('success', function(data) {
          var activity = accessors.activity(data);

          res.render('widgets/project_map', {
            title: "Geographical Location Widget",
            locations: activity.locations(),
            layout: 'widget'
          });
        })
        .on('error', function(e) {
          next(e);
        })
        .end();
    });
    
    
    //Widget displaying a project description for an activity
    app.get('/widgets/project_description', filters, function(req, res, next) {
      var params = {result: 'details'};

      _.extend(params, req.filter_query);
      new api.Request(params)
        .on('success', function(data) {
          var activity = accessors.activity(data);

          res.render('widgets/project_description', {
            title: "Project Description Widget",
            activity: activity,
            layout: 'widget'
          });
        })
        .on('error', function(e) {
          next(e);
        })
        .end();
    });
    
    
    //Widget displaying a list of participating organisations for an activity
    app.get('/widgets/participating_organisations', filters, function(req, res, next) {
      var params = {result: 'details'};

      _.extend(params, req.filter_query);
      new api.Request(params)
        .on('success', function(data) {
          var activity = accessors.activity(data);
          
          res.render('widgets/participating_organisations', {
            title: "Participating Organisations Widget",
            activity: activity,
            layout: 'widget'
          });
        })
        .on('error', function(e) {
          next(e);
        })
        .end();
    });
    
    
    //Widget displaying a graph of project sectors for an activity
    app.get('/widgets/project_sectors', filters, function(req, res, next) {
      var params = {result: 'details'};

      _.extend(params, req.filter_query);
      new api.Request(params)
        .on('success', function(data) {
          var activity = accessors.activity(data);

          res.render('widgets/project_sectors', {
            title: "Project Sectors Widget",
            activity: activity,
            layout: 'widget'
          });
        })
        .on('error', function(e) {
          next(e);
        })
        .end();
    });
    
    
    //Widget displaying a bar chart of funding figures for an activity
    app.get('/widgets/funding_breakdown', filters, function(req, res, next) {
      var params = {result: 'details'};

      _.extend(params, req.filter_query);
      new api.Request(params)
        .on('success', function(data) {
          var activity = accessors.activity(data);

          res.render('widgets/funding_breakdown', {
            title: "Funding Breakdown Widget",
            layout: 'widget'
          });
        })
        .on('error', function(e) {
          next(e);
        })
        .end();
    });
    
    
    //Renders an embed dialog
    app.get('/embed', filters, function(req, res, next) {
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