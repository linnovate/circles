'use strict';

var supportedHelpers = ['google'];

module.exports = function(provider, app) {
	if (supportedHelpers.indexOf(provider) > -1)
		return require(__dirname + '/' + provider)(app);
	
	return {
		getCorporateGroups: function() {
			console.log('Active provider was not found')
		}
	}
}