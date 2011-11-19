(function(exports) {
  //Initialises up widget pages and routes
  exports.init = function(app, filters, api, _) {
  
    //Top donors widget
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
            title: "IATI Top Donors Widget",
            funders: JSON.stringify(funders),
            layout: 'widget'
          });
        })
        .on('error', function(e) {
          next(e);
        })
        .end();
    });

    
    //Top sectors widget
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
          _(data.Funder).each(function(f) {
            f.value = parseFloat(f.value); 
            f.name = f.name === null ? "Unknown" : f.name;
          });

          var sectors = _(data.Sector).chain()
            .sortBy(function(f) { return -f.value; })
            .map(function(f) { return [f.name, parseFloat(f.value)]; })
            .value();
          
          res.render('widgets/sectors', {
            title: "IATI Top Sectors Widget",
            sectors: JSON.stringify(sectors),
            layout: 'widget'
          });
        })
        .on('error', function(e) {
          next(e);
        })
        .end();
    });

    
    //New projects widget
    app.get('/widgets/new_projects', filters, function(req, res, next) {
      var newProjects = function(activities, limit) {
        return _(activities).chain()
          .sortBy(function(a) {
            var date = _(a['activity-date'] || []).find(function(t) {
              return (t["@type"]) == "start-actual";
            });
            console.log(date ? Date.parse(date["#text"]) : 0);
            return date ? Date.parse(date["#text"]) : 0;
          })
          .map(function(a) {
            return {
              description: a.title || "No description available",
              commitments: req.transactionsTotal(a, 'C')
            };
          })
          .value().slice(0, limit);
      };
    
      var params = {result: 'full'};

      _.extend(params, req.filter_query);
      new api.Request(params)
        .on('success', function(data) {
          var activities = _.as_array(data['iati-activity']);
          
          res.render('widgets/new_projects', {
            title: "IATI Top Sectors Widget",
            new_projects: newProjects(activities, 5),
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
      console.log(req.query);

      delete req.query.widget;
      res.render('embed_dialog', {
        title: "Big long title of the widget",
        frame_url: "/widgets/" + widget,
        layout: false
      });
    });
  
  };
})(exports);