require('../models/circle');
require('../models/source');

var mongoose = require('mongoose'),
	Circle = mongoose.model('Circle'),
	Source = mongoose.model('Source'),
	config = require(process.cwd() + '/config') || {},
	usersCtrl = require('./users'),
	populate = {
		path: 'manager users',
		fields: 'id displayName'
	};

module.exports = function(Circles, app) {
	return {

		visualize: function(req, res) {
			app.render('circles', {}, function(err, html) {
				res.send(html);
			});
		},

		tree: function(req, res) {
			var data = app.get('circles');
			res.json(data.tree);
		},

		create: function(req, res, next) {
			req.checkBody('name', 'You must enter a name').notEmpty();
			var errors = req.validationErrors();
			if (errors) {
				return res.status(500).json({
					error: errors
				});
			}
			delete req.body.circles;
			// var data = app.get('circles');
			// var circles = Object.keys(data.circles.personal);
			// if (!validParents(req.body.circles, circles)) return res.status(500).json({
			// 	error: 'Cannot reference parent in child relationship'
			// });
			//console.log(req.body)
			var circle = new Circle(req.body);
			//console.log(circle)
			circle.circleType = 'personal';

			circle.save(function(err) {
				if (err) {
					return res.status(500).json({
						error: config.errors.cantSave,
						message: err
					});
				}
				circle.deepPopulate('users.user').then(function(circles) {
					circle.populate('creator', 'id displayName').execPopulate().then(function(circless) {
						req.circle = circle;
						next();
					}, function(circless) {
						req.circle = circle;
						next();
					})

					Circle.buildPermissions(function(data) {
						app.set('circles', data);
					});
				});

			});
		},
		addUser: function(req, res, next) {
			delete req.body.users;
			if (!req.user) return res.json(500, {
				error: config.errors.permissionsDenied
			});
			var user = req.circle.users.find(function(user) {
				return user.user.id === req.user.id;
			});
			if (!user || user.role !== 'manager') return res.json(500, {
				error: config.errors.permissionsDenied
			});
			if (!req.body.user) return res.status(500).json({
				error: config.errors.anyUserToAdd
			});
			if (req.circle.users.length === config.settings.maxUsers) return res.status(500).json({
				error: config.errors.maxUsers + config.settings.maxUsers
			});

			var user = req.circle.users.find(function(user) {
				return user.user.id === req.body.user;
			});
			if (user) return res.json(500, {
				error: config.errors.userAlreadyExist
			});
			usersCtrl.checkUser(req.body.user, function(error, user) {
				if (error) {
					return res.status(500).json({
						error: config.errors.invalidUser + req.body.user
					});
				}
				req.body.user = user;
				Circle.findOneAndUpdate({
					_id: req.circle._id
				}, {
					$addToSet: {
						users: {
							user: req.body.user,
							role: req.body.role
						}
					}
				}, {
					new: true
				}).populate('creator', 'id displayName').deepPopulate('users.user').exec(function(err, circle) {
					if (err) {
						return res.json(500, err.message);
					}
					req.circle = circle;
					Circle.buildPermissions(function(data) {
						app.set('circles', data);
					});

					next();
				});
			});


		},
		removeUser: function(req, res, next) {
			delete req.body.users;
			if (!req.user) return res.json(500, {
				error: config.errors.permissionsDenied
			});
			if (req.user.id === req.body.user) return res.json(500, {
				error: config.errors.cantRemoveYourself
			});
			var user = req.circle.users.find(function(user) {
				return user.user.id === req.user.id;
			});

			if (!user || user.role !== 'manager') return res.json(500, {
				error: config.errors.permissionsDenied
			});
			if (!req.body.user) return res.status(500).json({
				error: config.errors.anyUserToRemove
			});

			var user = req.circle.users.find(function(user) {
				return user.user.id === req.body.user;
			});
			if (!user) return res.json(500, {
				error: config.errors.userNotAvailableToRemove
			});

			usersCtrl.checkUser(req.body.user, function(error, user) {
				if (error) {
					return res.status(500).json({
						error: config.errors.invalidUser + req.body.user
					});
				}
				req.body.user = user;

				// if (!req.user || (req.circle.manager._id.toString() !== req.user._id.toString()) &&
				// 	(req.body.user.toString() !== req.user._id.toString())) return res.json(500, {
				// 	error: config.errors.permissionsDenied
				// });

				// TODO: manager remove himself
				// TODO: check if the group is empty (the last user remove)
				req.circle.depopulate('users')

				var check = req.circle.users.filter(function(obj) {
					return obj.user._id.toString() === req.body.user.toString();
				});

				if (!check.length) return res.status(500).json({
					error: config.errors.userNotAvailableToRemove
				});

				Circle.findOneAndUpdate({
					_id: req.circle._id
				}, {
					$pull: {
						'users': {
							'user': req.body.user
						}
					}
				}, {
					new: true
				}).populate('creator', 'id displayName').deepPopulate('users.user').exec(function(err, circle) {

					if (err) {
						return res.json(500, err.message);
					}
					req.circle = circle;

					Circle.buildPermissions(function(data) {
						app.set('circles', data);
					});
					res.json(req.circle)
					next();
				});
			});

		},
		changeName: function(req, res, next) {
			if (!req.user) return res.json(500, {
				error: config.errors.permissionsDenied
			});
			var user = req.circle.users.find(function(user) {
				return user.user.id === req.user.id;
			});
			if (!user || user.role !== 'manager') return res.json(500, {
				error: config.errors.permissionsDenied
			});
			req.checkBody('name', 'You must enter a name').notEmpty();
			var errors = req.validationErrors();
			if (errors) {
				return res.status(500).json({
					error: errors
				});
			}
			Circle.findOneAndUpdate({
				_id: req.circle._id
			}, {
				$set: {
					name: req.body.name
				}
			}, {
				new: true
			}).populate('creator', 'id displayName').deepPopulate('users.user').exec(function(err, circle) {
				if (err) {
					return res.json(500, err.message);
				}
				req.circle = circle;
				Circle.buildPermissions(function(data) {
					app.set('circles', data);
				});
				res.json(req.circle);
			});
		},
		update: function(req, res, next) {
			delete req.body.circles
			delete req.body.users
			delete req.body.manager
			// validateCircles(req.params.name, req.body.circles, function(err, status) {

			// if (err) return res.json(400, status);
			Circle.findOneAndUpdate({
				_id: req.circle._id
			}, {
				$set: req.body
			}, {
				multi: false,
				upsert: false
			}, function(err, circle) {
				if (err) {
					return res.status(500).json({
						error: config.errors.cantSave,
						message: err
					});
				}

				Circle.buildPermissions(function(data) {
					app.set('circles', data);
				});

				next();
			});

			// });
		},
		delete: function(req, res) {
			req.circle.isActive = false;
			req.circle.save(function(err) {
				if (err) {
					return res.status(500).json({
						error: config.errors.cantSave,
						message: err
					});
				}

				Circle.buildPermissions(function(data) {
					app.set('circles', data);
				});

				res.json({
					message: 'deleted'
				})
			});
		},
		mine: function(req, res) {
			if (!req.user) return res.json(500, {
				error: config.errors.permissionsDenied
			});
			var descendants = {};
			for (var type in req.acl.user.circles) {
				descendants[type] = {};
				for (var index in req.acl.user.circles[type]) {
					descendants[type][index] = req.acl.user.circles[type][index].decendants;
				}
			}
			getSources(req, function(sources) {
				return res.json({
					allowed: req.acl.user.allowed,
					descendants: descendants,
					sources: sources
				});
			});
		},
		all: function(req, res) {
			var tree, circles;
			if (req.query.type) {
				tree = req.acl.tree.children.find(function(type) {
					return (type.name === req.query.type);
				});
				circles = req.acl.circles[req.query.type];
			} else {
				tree = req.acl.tree;
				circles = req.acl.circles;
			}
			return res.json({
				tree: tree,
				circles: circles
			});
		},
		circle: function(req, res, next) {
			Circle.findOne({
				_id: req.params.id,
				circleType: 'personal',
				isActive: true
			}).populate('creator', 'id displayName').deepPopulate('users.user').exec(function(err, circle) {
				if (err || !circle) return res.json(500, {
					error: config.errors.circleNotExists
				});
				req.circle = circle;
				return next();
			});
		},
		show: function(req, res) {
			return res.json(req.circle);
		},
		loadCircles: function(req, res, next) {
			var data = app.get('circles');


			if (!req.acl) req.acl = {};

			if (!data) {
				Circle.buildPermissions(function(data) {
					app.set('circles', data);
					req.acl.tree = data.tree;
					req.acl.circles = data.circles;

					next();
				});
			} else {
				req.acl.tree = data.tree;
				req.acl.circles = data.circles;
				next();
			}
		},
		userAcl: function(req, res, next) {
			var circleTypes = {};
			if (req.user && req.user.circles) {
				for (var type in config.settings.circleTypes) {
					circleTypes[type] = req.user.circles[type] ? req.user.circles[type] : []
				};
			}

			var userRoles = {};
			var list = {};

			for (var type in circleTypes) {
				userRoles[type] = {};
				list[type] = [];
				circleTypes[type].forEach(function(circle) {
					if (req.acl.circles[type][circle] && req.acl.circles[type][circle].isActive) {

						if (list[type].indexOf(circle) === -1) list[type].push(circle);
						req.acl.circles[type][circle].decendants.forEach(function(descendent) {

							if (list[type].indexOf(descendent) === -1) {
								list[type].push(descendent);
							}

						});
						userRoles[type][circle] = req.acl.circles[type][circle];
					}
				});
			};

			var tree = Circle.buildTrees(userRoles);

			for (var index in tree) {
				tree[index].children = req.acl.tree[index].children;
			}

			for (var type in list) {
				for (var i = 0; i < list[type].length; i++) {
					list[type][i] = req.acl.circles[type][list[type][i]];
				}
			}

			req.acl.user = {
				tree: tree,
				circles: userRoles,
				allowed: list,
			};

			return next();
		},
		aclBlocker: function(req, res, next) {
			req.acl.query = function(model) {

				if (!Circles.models[model]) {
					Circles.models[model] = mongoose.model(model);
				}
				var conditions = {
					$and: []
				};

				for (var type in config.settings.circleTypes) {
					var obj1 = {},
						obj2 = {},
						obj3 = {};
					obj1['circles.' + type] = {
						$in: req.acl.user.allowed[type]
					};
					obj2['circles.' + type] = {
						$size: 0
					};
					obj3['circles.' + type] = {
						$exists: false
					};
					conditions.$and.push({
						'$or': [obj1, obj2, obj3]
					});
				}
				return Circles.models[model].where(conditions);
			};

			next();
		},
		hasCircle: function(circle, type) {
			return function(req, res, next) {
				if (!req.user || req.acl.user.allowed[type].indexOf(circle) === -1) {
					return res.status(403).send('User is not authorized for this action');
				}
				next();
			};
		},
		registerCircles: function(circle, circleType, parents, isActive, callback) {
			if (typeof(isActive) !== 'boolean') isActive = true;
			var query = {
				name: circle,
				circleType: circleType,
				isActive: isActive
			};

			var set = {};
			if (parents) {
				set.$addToSet = {
					circles: {
						$each: parents
					}
				};
			}

			Circle.findOneAndUpdate(query, set, {
				upsert: true,
				new: true
			}, function(err, circle) {
				if (err) console.log(err);
				if (callback) {
					callback(err, circle);
				}
			});

		},
		sources: function(req, res) {
			getSources(req, function(sources) {
				res.json(sources);
			});
		}
	}

};



function validateCircles(name, circles, callback) {

	Circle.buildPermissions(function(data) {
		if (!data.circles.personal[name]) return callback(true, config.errors.circleNotExists);
		circles = [].concat(circles);

		circles.forEach(function(parent, index) {
			if (data.circles.personal[name].decendants.indexOf(parent) !== -1) {
				return callback(true, 'Cannot reference parent in child relationship')
			}
			if (index === circles.length - 1) {
				return callback(null, 'valid');
			}
		});
	});
};

function validParents(parents, circles) {
	if (!parents) return true;
	var s = parents.every(function(val) {
		return (circles.indexOf(val) !== -1)
	});
	return s;
};


function getSources(req, callback) {
	var conditions = {};
	if (!req.query.type) req.query.type = 'c19n';
	conditions.circleType = req.query.type;
	if (req.query.user)
		conditions.circleName = {
			$in: req.acl.user.allowed[req.query.type].map(function(circle) {
				return circle.name
			})
		};
	Source.find(conditions).exec(function(err, sources) {
		callback(sources);
	});
};