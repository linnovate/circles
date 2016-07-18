'use strict';

var express = require('express'),
	app = express(),
	circles = require('../controllers/circles')({}, app),
	users = require('../controllers/users');

console.log(users)

app.use(users.user);

app.use(circles.loadCircles);
app.use(circles.userAcl);
app.use(circles.aclBlocker);

app.get('/circles/visualize', circles.visualize);
app.get('/circles/tree', circles.tree);
app.get('/circles/mine', circles.mine); //user
app.get('/circles/sources', circles.sources); //user //type
app.get('/circles/all', circles.all); //type

app.route('/circles/personal')
	.post(users.checkCreator, users.checkUsers, circles.create, users.addCircleToUsers);

app.route('/circles/personal/:id')
	.put(circles.update)
	.get(circles.show)
	.delete(circles.delete);

app.route('/circles/personal/:id/addUser') //user
.put(circles.addUser, users.addCircleToUsers);
app.route('/circles/personal/:id/removeUser') //user
.put(circles.removeUser, users.removeCircleFromUsers);
app.route('/circles/personal/:id/changeName') //user
.put(circles.changeName);

app.param('id', circles.circle);

module.exports = app;



// getGoogleGroups();

getC19n();

getC19nGroups();



function getGoogleGroups() {
	var GoogleService = require('serviceproviders')('google');
	var service = new GoogleService(config.google.clientSecret, config.google.clientID, config.google.callbackURL);

	var getMembers = function(group, rv, cb) {
		service.sdkManager('members', 'list', {
			groupKey: group.email
		}, function(err, list) {
			if (!list || !list.members) {
				return (cb());

			}
			var filter = list.members.filter(function(member) {
				return member.type === 'GROUP'
			});
			for (var i = 0; i < filter.length; i++) {
				circles.registerCircles(group.name, 'groups', [rv[filter[i].id].name]);
			}
			cb();
		})
	};

	service.sdkManager('groups', 'list', {
		domain: 'linnovate.net',
	}, function(err, list) {
		console.log(err)
		if (!err && list.groups) {
			var obj = list.groups.reduce(function(o, v) {
				o[v.id] = v;
				return o;
			}, {});
			var counter = list.groups.length;
			for (var i = 0; i < list.groups.length; i++) {
				getMembers(list.groups[i], obj, function() {
					counter--;
					if (counter === 0) {
						for (var i = 0; i < list.groups.length; i++) {
							circles.registerCircles(list.groups[i].name, 'groups');
						}
					}
				})

			}
		}
	})
};

function getC19nGroups() {
	var groups = [{
		id: '91234',
		name: 'g1',
		type: 'c19nGroups1',
		isActive: true
	}, {
		id: '91244',
		name: 'g2',
		type: 'c19nGroups1',
		isActive: true
	}, {
		id: '91254',
		name: 'g3',
		type: 'c19nGroups1',
		isActive: false
	}, {
		id: '91264',
		name: 'g4',
		type: 'c19nGroups1',
		isActive: true
	}, {
		id: '91274',
		name: 'g5',
		type: 'c19nGroups2',
		isActive: false
	}, {
		id: '91284',
		name: 'g6',
		type: 'c19nGroups2',
		isActive: false
	}, {
		id: '91294',
		name: 'g7',
		type: 'c19nGroups2',
		isActive: true
	}];

	for (var i = 0; i < groups.length; i++) {
		circles.registerCircles(groups[i]);
	}
};

function getC19n() {
	var sources = [{
		id: '9123',
		name: 'a1',
		linkedTriangleId: '123',
		clearance: '0',
		classification: 1
	}, {
		id: '9124',
		name: 'a2',
		linkedTriangleId: '123',
		clearance: '0',
		classification: 1
	}, {
		id: '9125',
		name: 'a3',
		linkedTriangleId: '123',
		clearance: '0',
		classification: 1
	}, {
		id: '9126',
		name: 'b1',
		linkedTriangleId: '123',
		clearance: '1',
		classification: 1
	}, {
		id: '9127',
		name: 'b2',
		linkedTriangleId: '123',
		clearance: '1',
		classification: 1
	}, {
		id: '9128',
		name: 'b3',
		linkedTriangleId: '123',
		clearance: '1',
		classification: 1
	}, {
		id: '9129',
		name: 'c1',
		linkedTriangleId: '123',
		clearance: '2',
		classification: 1
	}, {
		id: '9130',
		name: 'c2',
		linkedTriangleId: '123',
		clearance: '2',
		classification: 1
	}, {
		id: '9131',
		name: 'c3',
		linkedTriangleId: '123',
		clearance: '2',
		classification: 1
	}, {
		id: '8123',
		name: 'd1',
		linkedTriangleId: '456',
		clearance: '0',
		classification: 1
	}, {
		id: '8124',
		name: 'd2',
		linkedTriangleId: '456',
		clearance: '0',
		classification: 1
	}, {
		id: '8125',
		name: 'd3',
		linkedTriangleId: '456',
		clearance: '0',
		classification: 1
	}, {
		id: '8126',
		name: 'e1',
		linkedTriangleId: '456',
		clearance: '1',
		classification: 1
	}, {
		id: '8127',
		name: 'e2',
		linkedTriangleId: '456',
		clearance: '1',
		classification: 1
	}, {
		id: '8128',
		name: 'e3',
		linkedTriangleId: '456',
		clearance: '1',
		classification: 1
	}, {
		id: '8129',
		name: 'f1',
		linkedTriangleId: '456',
		clearance: '2',
		classification: 1
	}, {
		id: '8130',
		name: 'f2',
		linkedTriangleId: '456',
		clearance: '2',
		classification: 1
	}, {
		id: '8131',
		name: 'f3',
		linkedTriangleId: '456',
		clearance: '2',
		classification: 1
	}, {
		id: '8132',
		name: 'f4',
		linkedTriangleId: '456',
		clearance: '2',
		classification: 1
	}];

	var Source = require('../models/source');
	var Circle = require('../models/circle');

	var circlesObj = {};

	Circle.find({
		circleType: 'c19n'
	}).exec(function(err, c) {
		var circles = {};
		for (var i = 0; i < c.length; i++) {
			circles[c[i].name] = c[i];
		}
		console.log(circles)
		for (var i = 0; i < sources.length; i++) {
			console.log(sources[i].clearance + sources[i].linkedTriangleId)
			console.log(circles[sources[i].clearance + sources[i].linkedTriangleId])

			var circle = circles[sources[i].clearance + sources[i].linkedTriangleId] ? circles[sources[i].clearance + sources[i].linkedTriangleId]._id : null;

			Source.findOneAndUpdate({
				sourceId: sources[i].id
			}, {
				sourceId: sources[i].id,
				name: sources[i].name,
				circleName: sources[i].clearance + sources[i].linkedTriangleId,
				circleType: 'c19n',
				circle: circle,
				classification: sources[i].classification
			}, {
				upsert: true
			}).exec(function(err, source) {
				console.log(err, source)
			});

			if (!circlesObj[sources[i].linkedTriangleId]) circlesObj[sources[i].linkedTriangleId] = [];
			if (circlesObj[sources[i].linkedTriangleId].indexOf(sources[i].clearance) < 0)
				circlesObj[sources[i].linkedTriangleId].push(sources[i].clearance)
		}
		for (var triangleId in circlesObj) {
			var clearances = circlesObj[triangleId].sort().reverse();
			saveCircle(0, triangleId, clearances, null);
		}
	});

}

function saveCircle(i, triangleId, clearances, parents) {
	if (clearances[i]) {
		circles.registerCircles({id:clearances[i] + triangleId, type:'c19n', parents:parents, isActive:true}, function(err, circle) {
			if (err) return;
			saveCircle(i + 1, triangleId, clearances, [circle._id]);
		});
	}
}