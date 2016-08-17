require('../models/user');

Array.prototype.diff = function(a) {
    return this.filter(function(i) {
        return a.indexOf(i) < 0;
    });
};

var mongoose = require('mongoose'),
    User = mongoose.model('User'),
    config = require(process.cwd() + '/config') || {};

var self = {


    user: function(req, res, next) {
        if (!req.query.user) {
            return next();
        }
        User.findOne({
            id: req.query.user
        }).exec(function(err, user) {
            req.user = user;
            next();
        });
    },
    checkUser: function(id, callback) {
        User.findOne({
            id: id
        }).exec(function(err, user) {
            if (err || !user) return callback(true);
            callback(null, user._id);
        });
    },
    checkCreator: function(req, res, next) {

        self.checkUser(req.body.creator, function(error, creator) {
            if (error) {
                return res.status(500).json({
                    error: config.errors.invalidCreator + req.body.creator
                });
            }
            req.body.creator = creator;
            next();
        });
    },
    checkUsers: function(req, res, next) {
        if (!req.body.users) req.body.users = [];
        if (req.body.users.length > config.settings.maxUsers || req.body.managers.length > config.settings.maxUsers) return res.status(500).json({
            error: config.errors.maxUsers + config.settings.maxUsers
        });

        self.getUsers(req.body.users, function(err, users) {
            if (err) return res.status(500).json({
                error: config.errors.invalidUsers
            });
            var existUsers = users.map(function(user) {
                return user.id;
            });
            var missingsU = req.body.users.diff(existUsers);
            self.getUsers(req.body.managers, function(err, managers) {
                if (err) return res.status(500).json({
                    error: config.errors.invalidUsers
                });
                var existManagers = managers.map(function(manager) {
                    return manager.id;
                });
                var missingsM = req.body.managers.diff(existManagers);
                if (missingsU.length || missingsM.length) {
                    return res.status(500).json({
                        error: config.errors.invalidUsers,
                        message: {
                            users: missingsU,
                            managers: missingsM
                        }
                    });
                }
                req.body.users = managers.map(function(manager) {
                    return {
                        user: manager,
                        role: 'manager'
                    }
                });
                var missingCreator = managers.every(function(manager) {
                    return manager._id.toString() !== req.body.creator.toString();
                });
                if (missingCreator) {
                    req.body.users.unshift({
                        user: req.body.creator,
                        role: 'manager'
                    });
                }
                for (var i = 0; i < users.length; i++) {
                    if ((users[i]._id.toString() !== req.body.creator.toString()) && ((req.body.managers.indexOf(users[i].id.toString()) === -1))) {
                        req.body.users.push({
                            user: users[i],
                            role: 'user'
                        });
                    }
                }
                if (req.body.users.length > config.settings.maxUsers) return res.status(500).json({
                    error: config.errors.maxUsers + config.settings.maxUsers
                });
                next();
            });
        });
    },
    getUsers: function(ids, callback) {
        User.find({
            id: {
                $in: ids
            }
        }).exec(function(err, users) {
            callback(err, users);
        });
    },
    addCircleToUsers: function(req, res, next) {
        var users = req.body.users ? req.body.users : [{
            user: req.body.user
        }];
        var u = users.map(function(user) {
            return user.user;
        });
        User.update({
            _id: {
                $in: u
            }
        }, {
            $addToSet: {
                'circles.personal': req.circle._id
            }
        }, {
            multi: true
        }).exec(function(err, numberAffected, raw) {
            console.log(err, numberAffected, raw)
        });
        res.json(req.circle);
    },
    removeCircleFromUsers: function(req, res, next) {
        var users = req.body.users ? req.body.users : [req.body.user];
        User.update({
            _id: {
                $in: users
            }
        }, {
            $pull: {
                'circles.personal': req.circle._id
            }
        }, {
            multi: true
        }).exec(function(err, numberAffected, raw) {
            console.log(err, numberAffected, raw);
        });
        res.json(req.circle);
    },
    upsert: function(req, res, next) {
        User.findOne({
            id: req.params.userId
        }, function(err, user) {
            if (err) {
                return res.status(500).json({
                    error: err
                });
            }
            if (user) {
                return next();
            } else {
                getRandomCircles(function(circles) {
                    var user = new User({
                        id: req.params.userId,
                        circles: circles
                    });
                    user.save(function(err, user) {
                        if (err) {
                            return res.status(500).json({
                                error: err
                            });
                        }
                        if (user) {
                            return next();
                        }
                    });
                });
            }
        });
    },
    setCorporateGroupsForUser: function(req, res) {
        User.findOneAndUpdate({
            id: req.params.userId
        }, {
            'circles.corporate': req.groups
        }, {
            new: true
        }, function(err, user) {
            console.log(err, user)
            res.json(user);
        })
    }
    // ,
    // renameCircleOfUsers: function(req, res, next) {
    //     var users = req.circle.users.map(function(user) {
    //         return user._id;
    //     });
    //     User.update({
    //         _id: {
    //             $in: users
    //         },
    //         'circles.personal': req.params.name
    //     }, {
    //         $set: {
    //             'circles.personal.$': req.body.name
    //         }
    //     }, {
    //         multi: true
    //     }).exec(function(err, numberAffected, raw) {
    //         console.log(err, numberAffected, raw);
    //     });
    //     res.json(req.circle);
    // }
}
var Circle = mongoose.model('Circle');
var getRandomCircles = function(callback) {
    Circle.find().exec(function(err, circles) {
        var obj = {};
        for (var i = 0; i < circles.length; i++) {
            if (!obj[circles[i].circleType]) {
                obj[circles[i].circleType] = [];
            }
            obj[circles[i].circleType].push(circles[i]._id);
        }
        var myCircles = {};
        for (var type in config.settings.circleTypes) {
            if (type !== 'personal') {
                myCircles[type] = [obj[type][Math.floor(Math.random() * obj[type].length)]];
            }
        }
        callback(myCircles);
    });
}

module.exports = self;