'use strict';

var express = require('express'),
	app = express(),
	circles = require('../controllers/circles')({}, app),
	users = require('../controllers/users');

app.post('/users/:userId', users.upsert, circles.getCorporateGroupsForUser, users.setCorporateGroupsForUser);

app.use(users.user);

app.use(circles.loadCircles);
app.use(circles.userAcl);
app.use(circles.aclBlocker);

app.get('/circles/visualize', circles.visualize);
app.get('/circles/tree', circles.tree);
app.get('/circles/mine', circles.mine); //user //type
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