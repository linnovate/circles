'use strict';

module.exports = function(app) {
	var config = require(process.cwd() + '/config') || {},
		circles = require('../controllers/circles')({}, app),
		GoogleProvider = require('serviceproviders')('google'),
		service = new GoogleProvider(config.google.client_secret, config.google.client_id, config.google.redirect_uri);

	var getMembers = function(circle, cb) {
		service.sdkManager('members', 'list', {
			groupKey: circle.circleId
		}, function(err, list) {
			if (!list || !list.members) {
				return (cb());
			}
			var filter = list.members.filter(function(member) {
				return member.type === 'GROUP'
			});
			for (var i = 0; i < filter.length; i++) {
				circles.registerCircles({
					name: filter[i].name,
					id: filter[i].email,
					type: 'corporate',
					parents: [circle._id],
					isActive: true
				});
				cb();
			}
		});
	};
	return {

		getCorporateGroups: function() {
			console.log('getCorporateGroups for google');
			service.sdkManager('groups', 'list', {
				domain: 'linnovate.net',
			}, function(err, list) {
				if (!err && list.groups) {
					for (var i = 0; i < list.groups.length; i++) {
						circles.registerCircles({
							name: list.groups[i].name,
							id: list.groups[i].email,
							type: 'corporate',
							isActive: true
						}, function(err, circle) {
							if (err) return;
							getMembers(circle, function() {})
						});

					}
				}
			})
		},

		getCorporateGroupsForUser: function(userKey, callback) {
			service.sdkManager('groups', 'list', {
				domain: 'linnovate.net',
				userKey: userKey
			}, function(err, list) {
				if (err || !list.groups) return callback(null);
				console.log(list)
				var groups = list.groups.map(function(group) {
					return (group.email);
				});
				return callback(groups);
				// if (!err && list.groups) {
				// 	var obj = list.groups.reduce(function(o, v) {
				// 		o[v.id] = v;
				// 		return o;
				// 	}, {});
				// 	var counter = list.groups.length;
				// 	for (var i = 0; i < list.groups.length; i++) {
				// 		circles.registerCircles({
				// 			name: list.groups[i].name,
				// 			id: list.groups[i].email,
				// 			type: 'corporate',
				// 			isActive: true
				// 		}, function(err, circle) {
				// 			if (err) return;

				// 			getMembers(circle, function() {})
				// 		});

				// 	}
				// }
			})
		}
	};
}