(function(exports) {
  //Initialises up widget pages and routes
  exports.init = function(app, filters, api, _) {
  
    //Widget displaying a pie chart of the biggest donors
    app.get('/widgets/donors', filters, function(req, res) {
      var params = {
        result: 'values',
        groupby: 'Funder',
        orderby: 'values'
      };

      _.extend(params, req.filter_query);
      new api.Request(params)
        .on('success', function(data) {
          var max = 6;
          _(data.Funder).each(function(f) { 
            f.value = parseFloat(f.value); 
            f.name = f.name === null ? "Unknown" : f.name;
          });
          
          var funders = _(data.Funder).chain()
            .as_array()
            .sortBy(function(f) { return -f.value; })
            .map(function(f) { return [f.name, parseFloat(f.value)]; })
            .value();
          
          res.render('widgets/donors', {
            title: "Top Donors Widget",
            funders: funders,
            layout: 'widget'
          });
        })
        .on('error', function(e) {
          next(e);
        })
        .end();
    });

    
    //Widget displaying a bar chart of the 6 most significant sectors
    app.get('/widgets/sectors', filters, function(req, res, next) {
      var params = {
        result: 'values',
        groupby: 'Sector',
        orderby: 'values'
      };

      _.extend(params, req.filter_query);
      new api.Request(params)
        .on('success', function(data) {
          var max = 6;
          _(data.Sector).each(function(f) {
            f.value = parseFloat(f.value); 
            f.name = f.name === null ? "Unknown" : f.name;
          });

          var sectors = _(data.Sector).chain()
            .sortBy(function(f) { return -f.value; })
            .map(function(f) { return [f.name, parseFloat(f.value)]; })
            .value();
          
          res.render('widgets/sectors', {
            title: "Top Sectors Widget",
            sectors: sectors,
            layout: 'widget'
          });
        })
        .on('error', function(e) {
          next(e);
        })
        .end();
    });

    
    //Widget displaying up to 5 of the newest projects
    app.get('/widgets/new_projects', filters, function(req, res, next) {    
      var params = {result: 'full'};

      _.extend(params, req.filter_query);
      new api.Request(params)
        .on('success', function(data) {
          var activities = _(data['iati-activity']).as_array();
          
          res.render('widgets/new_projects', {
            title: "New Projects Widget",
            new_projects: req.newProjects(activities, 5),
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
          var activity = data['iati-activity'];
          var allLocations = _(activity.location).as_array() || [];
          var mode = 'coordinates';
          var locations = _(allLocations).chain()
            .filter(function(l) { return l.coordinates; })
            .map(function(l) { 
              l.lat = l.coordinates['@latitude'];
              l.lng = l.coordinates['@longitude'];
              return l;
            })
            .value();
          
          if (locations.length == 0) {
            // mode = 'countries';
            // locations = _(allLocations).chain()
            // .filter(function(l) { return l['location-type']; });
            //String replace to get country, geolocate position?
          }
          
          res.render('widgets/project_map', {
            title: "Geographical Location Widget",
            locations: locations,
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
      var params = {result: 'full'};

      _.extend(params, req.filter_query);
      new api.Request(params)
        .on('success', function(data) {
          var activity = data['iati-activity'];
          var description = activity.description && activity.description['#text'];
          
          res.render('widgets/project_description', {
            title: "Project Description Widget",
            description: description || "No description available.",
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
      var params = {result: 'full'};

      _.extend(params, req.filter_query);
      new api.Request(params)
        .on('success', function(data) {
          var activity = data['iati-activity'];
          var orgs = _(activity['participating-org'] || [])
            .chain().as_array().map(function(o) { return o['#text']; }).value();
          
          res.render('widgets/participating_organisations', {
            title: "Participating Organisations Widget",
            participating_organisations: orgs,
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
      var params = {result: 'full'};

      _.extend(params, req.filter_query);
      new api.Request(params)
        .on('success', function(data) {
          var activity = data['iati-activity'];
          var sectors = _(activity.sector).as_array() || [];
          sectors = _(sectors).map(function(s) { 
            var value = parseFloat(s['@iati-ad:project-value'] || 0);
            return [s['#text'] || "Unknown", value > 0 ? value : 1]; 
          });
          
          res.render('widgets/project_sectors', {
            title: "Project Sectors Widget",
            sectors: sectors,
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
      var params = {result: 'full'};

      _.extend(params, req.filter_query);
      new api.Request(params)
        .on('success', function(data) {
          var activity = data['iati-activity'];

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
    app.get('/embed', filters, function(req, res) {
      var widget = req.query.widget;

      delete req.query.widget;
      res.render('embed_dialog', {
        title: "Embed Widget",
        frame_url: "/widgets/" + widget,
        layout: false
      });
    });
  
  };
})(exports);