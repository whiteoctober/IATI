var _ = require('./underscore_mixins.js').init(require('underscore'));
var replacements = require('../config/replacements.json').replacements;

//Extracts text from a node which may be text or an object containing text
var textVal = function(node) { return ((node && node['#text']) ? node['#text'] : node) || ""; };
var replaceText = function(text, match, replacement) {
  do { text = text.replace(match, replacement) } while(text.indexOf(match) != -1);
  return text;
}

//Wraps an activity in an object with useful accessors
exports.activity = function(data) {
  return {
    //Raw activity data
    data: _.as_array(data['iati-activity'])[0],
    
    //Simple accessors
    id: function() { return this.data['iati-identifier'] || this.data['code']; },
    value: function() { return parseFloat(this.data.value) || 0; },
    
    //Finds the activity title with replacements from the replacement config file
    title: function() {
      var title = textVal(this.data.title) || textVal(this.data.name);
      _(replacements).each(function(replacement, match) {
        title = replaceText(title, match, replacement);
      });
      return title;
    },
    
    //Finds the description trimmed mapped to html
    description: function() { 
      return textVal(this.data.description)
        .replace(/^\s+|\s+$/g, "")
        .replace(/\r\n|\r|\n/g, "<br>");
    },
   
    funder: function() {
      //console.log(this.data["participating-org"]);
      return _(this.data["participating-org"]).chain()
        .as_array()
        .filter(function(o) { return o["@iati-ad:funder"]; })
        .pluck("#text")
        .value().join(", ") || "";
    },
    
    //Returns an object with any available transaction summaries by type code
    transactionSummaries: function() {
      var summary = this.data['iati-ad:transaction-summary'];
      var summaryList = _(summary && summary['iati-ad:value-analysis']).as_array();
      var summaries = {};
      _(summaryList).each(function(s) {
        summaries[s['@code']] = parseFloat(s['@USD-value']) || 0;
      });
      return summaries;
    },
    
    //Returns a list of names of participating organisations
    participators: function() {
      return _(this.data['participating-org']).chain().as_array().map(textVal).value();
    },
    
    //Returns a list of locations for an activity
    locations: function() {
      return _(this.data.location).chain()
        .as_array()
        .filter(function(l) { return l.coordinates; })
        .map(function(l) {
          return { 
            name: textVal(l.name),
            lat: parseFloat(l.coordinates['@latitude']) || 0,
            lng: parseFloat(l.coordinates['@longitude']) || 0
          };
        })
        .value();
    },
    
    //Returns a list of sectors for an activity
    sectors: function() {
      return _(this.data.sector).chain()
        .as_array()
        .map(function(s) { 
          var value = parseFloat(s['@iati-ad:project-value']) || 0;
          return {name: s['#text'] || "Unknown", value: value > 0 ? value : 1}; 
        })
        .sortBy(function(f) { return -f.value; })
        .value();
    },
    
    //Returns a sorted list of funders for an activity
    funders: function() {
      return _(this.data.Funder).chain()
        .as_array()
        .map(function(f) { return {name: textVal(f.name) || "Unknown", value: parseFloat(f.value) || 0}; })
        .sortBy(function(f) { return -f.value; })
        .value();
    }
  };
};

//Wraps a list of activities in an object with useful accessors
exports.dataFile = function(data) {
  return {
    //Raw data
    data: data,
    
    //Simple accessors
    totalActivities: function() { return this.data['@activity-count'] || 0 },
    
    //Returns a list of activities
    activities: function() {
      return _(data['iati-activity']).chain()
        .as_array()
        .map(function(a) { return exports.activity({'iati-activity': a}); })
        .value();
    },
    
    //Returns an object with any available transaction summaries by type code
    transactionSummaries: function() {
      var summary = this.data.All && this.data.All['iati-ad:transaction-summary'];
      var summaryList = _(summary && summary['iati-ad:value-analysis']).as_array();
      var summaries = {};
      _(summaryList).each(function(s) {
        summaries[s['@code']] = parseFloat(s['@USD-value']) || 0;
      });
      return summaries;
    },
    
    //Returns a list of sectors for a set of activities
    sectors: function() {
      return _(this.data.Sector).chain()
        .as_array()
        .map(function(f) { return {name: textVal(f.name) || "Unknown", value: parseFloat(f.value) || 0}; })
        .sortBy(function(f) { return -f.value; })
        .value();
    },
    
    funders: function() {
      return _(this.data.Funder).chain()
        .as_array()
        .map(function(f) { return {name: textVal(f.name) || "Unknown", value: parseFloat(f.value) || 0}; })
        .sortBy(function(f) { return -f.value; })
        .value();
    }
  };
};

exports.filter = function(data, name) { return _(data[name]).as_array(); };