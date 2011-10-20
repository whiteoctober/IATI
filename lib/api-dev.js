// A quick mock up of the api

var data  = [
	{name: "Activity One",   f1:'1', f2:'1', f3: '3'},
	{name: "Activity Two",   f1:'2', f2:'1', f3: '3'},
	{name: "Activity Three", f1:'3', f2:'1', f3: '2'},
	{name: "Activity Four",  f1:'1', f2:'1', f3: '1'},
	{name: "Activity Five",  f1:'2', f2:'2', f3: '4'},
	{name: "Activity Six",   f1:'3', f2:'2', f3: '5'},
	{name: "Activity Seven", f1:'1', f2:'2', f3: '6'}
];



//return a unique array
function uniq(arr){
	var next = [];
	
	for(var i = arr.length -1; i >= 0; i-- ){
		var skip = false;
		
		for(var j = i - 1; j >= 0; j-- ){
			if(arr[i] == arr[j]){
				skip = true;
				break;
			}
		}
		
		if(!skip){
			next.unshift(arr[i]);
		}
	}
	
	return next;
}


/*
	get a list of activities based on a filter
	
	example
	
	activities({f1:[1,2], f2:[2]});
*/
var activities = function (filter){
	var filtered = [];
	
	for (var i = data.length - 1; i >= 0; i--){
		var activity = data[i];
		var keep = true;
		
		for(var f in filter){
			if(filter[f].indexOf(activity[f]) == -1){
				keep = false;
			}
		}
		
		if(keep){
			filtered.unshift(activity);
		}
		
	}
	
	return filtered;
};

// get a filter based on a current filter
var filterValues = function(filter, filters){
	filters = filters === undefined ? {} : filters;
	
	//remove the current filter
	delete filters[filter];
	
	var filtered = activities(filters);
	
	//gather the availible filters
	return uniq(filtered.map(function(act){
		return act[filter];
	}));
};


//export the API calls
exports.activities = activities;
exports.filterValues = filterValues;


exports.setEndpoint = function(value){
	endpoint = value;
};