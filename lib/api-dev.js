// A quick mock up of the API

//Sample data
var data = [
  {id: 1, name: "Afganistan Elections Programme 2009-2011", size: 1, filters: {f1:'1', f2:'1', f3: '3'}},
  {id: 2, name: "AF Rural Enterprise Development Program", size: 3, filters: {f1:'2', f2:'1', f3: '3'}},
  {id: 3, name: "ADVISORY AND CAPACITY BUIDLING SUPPORT TO THE IDLG", size: 4, filters: {f1:'3', f2:'1', f3: '2'}},
  {id: 4, name: "Afganistan Financial Sector Strenthening Project", size: 5, filters: {f1:'1', f2:'1', f3: '1'}},
  {id: 5, name: "Accountable Grant CSCF0399: BUILDING A NATIONAL PROTECTIVE ENVIRONMENT FOR CHILDREN VULNERABLE TO CONFLICT WITH THE LAW THROUGH A CO-ORDINATED CIVIL SOCIETY ACTION NETWORK", size: 12, filters: {f1:'2', f2:'2', f3: '4'}},
  {id: 6, name: "Afganistan Pension Aministration and Saftey Net Project", size: 20, filters: {f1:'3', f2:'2', f3: '5'}},
  {id: 7, name: "AF: Emergency Irrigation Rehabilitation Project", size: 32, filters: {f1:'1', f2:'2', f3: '6'}},
  {id: 8, name: "Special Advisory Funding Committee", size: 20, filters: {f1:'3', f2:'2', f3: '5'}}
];

//Returns unique items from an array
function uniq(arr) {
  var next = [];
  for(var i = arr.length -1; i >= 0; i--) {
    var skip = false;
    for(var j = i - 1; j >= 0; j--) {
      if(arr[i] == arr[j]) {
        skip = true;
        break;
      }
    }
    if(!skip) {
      next.unshift(arr[i]);
    }
  }
  return next;
}

//Gets a list of activities based on a filter e.g. activities({f1:[1,2], f2:[2]});
var activities = function(filter) {
  var filtered = [];
  for(var i = data.length - 1; i >= 0; i--) {
    var activity = data[i];
    var keep = true;
    for(var f in filter) {
      if(filter[f].indexOf(activity.filters[f]) == -1) {
        keep = false;
      }
    }
    if(keep) {
      filtered.unshift(activity);
    }
  }
  return filtered;
};

//Gets a filter based on a current filter
var filterValues = function(filter, filters) {
  filters = filters || {};
  
  //Removes the current filter
  delete filters[filter];
  var filtered = activities(filters);
  
  //Gathers the availible filters
  return uniq(filtered.map(function(activity) {
    return activity.filters[filter];
  }));
};

//Sets API calls
exports.activities = activities;
exports.filterValues = filterValues;
exports.setEndpoint = function(value) { endpoint = value; };