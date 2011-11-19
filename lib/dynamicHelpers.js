var url = require('url'),
    _ = require('underscore');


exports.query = function(req){
  return req.query;
};


//Adds parameters to the url
exports.url_with = function(req, res) {
  return function(pathname, params) {
    //Parse the current url, inserting updated query paramaters and specified options
    var parsedUrl = url.parse(req.originalUrl, true);
    // parsedUrl.query = _(req.query).clone();
    if (pathname) parsedUrl.pathname = pathname;
    if (params) _.extend(parsedUrl.query, params);

    //Remove the xhr param (this is used as a work around for cache issues)
    if (parsedUrl.query.xhr) delete parsedUrl.query.xhr;

    //Remove search query string, forcing query object to be used
    delete parsedUrl.search;

    //Return the formatted url
    return url.format(parsedUrl);
  };
};


/*
 A more basic url that completly replaces the path or params if supplies
 url([path], [params])
 params can be:
  object - the params you want to set
  {} - remove all params
*/
exports.url = function(req, res){
  
  return function(pathname, query){
    
    if(!_.isString(pathname)){
      query = pathname;
      pathname = null;
    }
    
    var u = url.parse(req.originalUrl, true);
    delete u.search; // force url format to use the query param
    
    if(query !== undefined){
      u.query = query;
    }
    
    if(pathname){
      u.pathname = pathname;
    }
    
    return url.format(u);
    
  };
  
};