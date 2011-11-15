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
    app.get('/widgets/sectors', filters, function(req, res) {
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
  };
})(exports);