var _ = require('./underscore_mixins.js').init(require('underscore'));
var replacements = require('../config/replacements.js').replacements;

//Extracts text from a node which may be text or an object containing text
var textVal = function(node) {
  return ((node && node['#text']) ? node['#text'] : (node && node.substr ? node : "") ) || "";
};

//Replaces all text matches in a string
var replaceText = function(text, match, replacement) {
  do { text = text.replace(match, replacement);} while(text.indexOf(match) != -1);
  return text;
};

//Joins an array with english list grammar
var englishList = function(array, conjunction) {
  var last = array.length - 1;
  return array.slice(0, last).join(", ")+(last > 0 ? (conjunction || " and ") : "")+(array[last] || "");
};

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

    activityStatus: function(){
      return textVal(this.data['activity-status']);
    },

    contactInfo: function(){
      return this.data['contact-info'] || {};
    },

    reportingOrg: function(){
      return textVal(this.data['reporting-org']);
    },

    //Returns a list of names of participating organisations
    participators: function() {
      return _(this.data['participating-org']).chain()
        .as_array()
        .map(function(o) { return {name: o["#text"], id: o['@ref'], role: o['@role'], funder: !!o["@iati-ad:funder"]}; })
        .value();
    },
   
    //Returns a list of funders
    funders: function() {
      return _(this.participators()).filter(function(p) { return p.funder; });
    },
   
    //Returns funder ids suitable for URL embedding
    funderIds: function() { return _(this.funders()).pluck("id").join(","); },
   
    //Returns a formatted string mentioning each funder
    funderName: function() { return englishList(_(this.funders()).pluck("name")); },
    
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
        .filter(function(sec) {
          if (sec['@vocabulary'] == 'DAC') {
            return sec;
          }
        })
        .map(function(s) {
          var value = parseFloat(s['@iati-ad:project-value']) || 0;
          return {name: s['#text'] || "Unknown", value: value > 0 ? value : 1};
        })
        .sortBy(function(f) { return -f.value; })
        .value();
    },


    otherIdentifiers: function() {
      return _(this.data['other-identifier']).chain()
        .as_array()
        .map(function(ident){
          return {
            ownerRef: ident['@owner-ref'] || '',
            ownerName: ident['@owner-name'] || '',
            id: textVal(ident)
          };
        })
        .value();

    },
    
    //Returns a list of related documents with titles and links
    documents: function() {
      return _(this.data['document-link']).chain()
        .as_array()
        .map(function(d) {
          return {title: d.title.replace(/\..+$/g, " ") || "Unnamed", url: d['@url']};
        })
        .value();
    },
    
    //Returns an object with each type of date
    dates: function() {
      var dateList = _(this.data['activity-date']).as_array();
      var dates = {start: {}, end: {}};
      _(dateList).each(function(d) {
        var type = d['@type'].split("-");
        var dateText = d['#text'] || d['@iso-date'];
        dates[type[0]][type[1]] = dateText ? new Date(Date.parse(dateText)) : false;
      });
      return dates;
    },
    
    classifications: function() {
      var types = {
        'collaboration-type': 'Collaboration type',
        'default-aid-type': 'Default aid type',
        'default-flow-type': 'Default flow type',
        'default-tied-status': 'Default tied status'
      };
      var classifications = [];
      var data = this.data;
      _(types).chain().keys().map(function(type) {
        if (data[type]) classifications.push({name: types[type], value: textVal(data[type])});
      });
      return classifications;
    },
    
    //Returns a list of related activities
    relatedActivities: function() {
      return _(this.data['related-activity']).chain()
        .as_array()
        .map(function(a) { return {id: a['@ref'], title: a['#text']}; })
        .value();
    },
    
    recipients: function(){
      var data = this.data;
      
      return  _(['country', 'region']).chain()
        .map(function(type){
          var rcpt = data['recipient-' + type];
          return rcpt ? {
            type:type,
            name:rcpt['#text'] || rcpt['@code']
          } : false;
        })
        .compact()
        .value();
    }
  };
};

//Wraps a list of activities in an object with useful accessors
exports.dataFile = function(data, groupBy) {
  return {
    //Raw data
    data: data,
    groupBy: groupBy,
    
    //Simple accessors
    totalActivities: function() {
      if (this.groupBy) return _(this.data[this.groupBy]).chain().as_array().pluck("count").sum().value();
      else return this.data['@activity-count'] || 0;
    },
    
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