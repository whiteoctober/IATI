// TODO - this should be dynamic, or augmented with eXist

// our underscore
var _ = require('./lib/underscore_mixins.js').init(require('underscore'));

// Following a similiar structure that the serialised
// json would have.

var codelists = {};


// http://iatistandard.org/codelists/policy_marker
codelists.policyMarker = [{
		code:1,
		name:"Gender Equality"
	},{
		code:2,
		name:"Aid to Environment"
	},{
		code:3,
		name:"Participatory Development/Good Governance"
	},{
		code:4,
		name:"Trade Development"
	},{
		code:5,
		name:"Aid Targeting the Objectives of the Convention on Biological Diversity"
	},{
		code:6,
		name:"Aid Targeting the Objectives of the Framework Convention on Climate Change - Mitigation"
	},{
		code:7,
		name:"Aid Targeting the Objectives of the Framework Convention on Climate Change - Adaptation"
	},{
		code:8,
		name:"Aid Targeting the Objectives of the Convention to Combat Desertification"
	}];


// http://iatistandard.org/codelists/policy_significance
codelists.policy_significance = [{
		code:0,
		name:"not targeted",
		description:"The score \"not targeted\" means that the activity was examined but found not to target the policy objective."
	},{
		code:1,
		name:"significant objective",
		description:"Significant (secondary) policy objectives are those which, although important, were not the prime motivation for undertaking the activity."
	},{
		code:2,
		name:"principal objective",
		description:"Principal (primary) policy objectives are those which can be identified as being fundamental in the design and impact of the activity and which are an explicit objective of the activity. They may be selected by answering the question \"Would the activity have been undertaken without this objective?\""
	},{
		code:3,
		name:"principal objective AND in support of an action programme",
		description:"For desertification-related aid only"
	}];


// returns a function that will populate an
// object from the codelists
var populator = function(opts){
	return function(object){
		_.each(opts, function(listname, code){

			var object_value = object[code];

			// find the matching code
			var value = _.find(codelists[listname], function(item){
				return item.code == object_value;
			});

			// if it was @code, store the value under .code
			if(code.charAt(0) == '@')
				code = code.slice(1);

			// update the object with it
			object[code] = value || {};
			

		});
		return object;
	};
};

module.exports = {
	populator:populator,
	lists: codelists
};

