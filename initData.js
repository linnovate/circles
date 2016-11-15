var Circle = require('./models/circle');
var User = require('./models/user');
var Source = require('./models/source');

var getData = require('npm-getdata-pkg'),
    config = require(process.cwd() + '/config') || {};
module.exports = function(app) {

    
    // getC19n();

    // getC19nGroups();

    // getUsers();

    require('./helpers')(config.activeProvider, app).getCorporateGroups();

    return {
        getC19nGroups: function() {
            var circles = require('./controllers/circles')({}, app);

            getData.getC19nGroups(function(c19nGroups) {
                for (var i = 0; i < c19nGroups.length; i++) {
                    circles.registerCircles({
                        id: c19nGroups[i].Id,
                        type: c19nGroups[i].Type,
                        name: c19nGroups[i].Name,
                        isActive: c19nGroups[i].IsActive
                    });
                }
            });
        },

        getC19n: function() {
            getData.getTriangles(function(triangles) {
                var trianglesObj = {};
                for (var t = 0; t < triangles.length; t++) {
                    trianglesObj[triangles[t].Id] = triangles[t].Name;
                }
                getData.getSources(function(sources) {
                    var circlesObj = {};
                    for (var i = 0; i < sources.length; i++) {

                        if (!circlesObj[sources[i].LinkedTriangleId]) circlesObj[sources[i].LinkedTriangleId] = {
                            clearances: config.settings.defaultClearances || [],
                            sources: {}
                        };
                        if (circlesObj[sources[i].LinkedTriangleId].clearances.indexOf(sources[i].Clearance.toString()) < 0)
                            circlesObj[sources[i].LinkedTriangleId].clearances.push(sources[i].Clearance.toString())

                        if (!circlesObj[sources[i].LinkedTriangleId].sources[sources[i].Clearance.toString()])
                            circlesObj[sources[i].LinkedTriangleId].sources[sources[i].Clearance.toString()] = [];
                        circlesObj[sources[i].LinkedTriangleId].sources[sources[i].Clearance.toString()].push(sources[i]);
                    }
                    for (var triangleId in circlesObj) {
                        var clearances = circlesObj[triangleId].clearances.sort().reverse();
                        saveCircle(0, triangleId, trianglesObj[triangleId], clearances, circlesObj[triangleId].sources, null);
                    }

                });

            });
        },
        
        // getUsers: function() {
        //     getData.getUsers(function(users) {
        //         for (var i = 0; i < users.length; i++) {
        //             initUser(users[i]);
        //         }
        //     });
        // },
        
        initUser: function(user, callback) {
            var userToAdd = {};
            userToAdd.id = user.uniqueId;
            //userToAdd.displayName = user.displayName;
            //userToAdd.fullName = user.fullName;
            for (var i in config.settings.circleTypes) {
                if (config.settings.circleTypes[i].initFrom === 'initData') {
                    userToAdd['circles.' + i] = [];
                }
            }
            userToAdd.lastModified = {
                'initData': new Date()
            }
            getData.getUserPermission(userToAdd.id, function(user) {
                if (!user) {
                    return callback(null);
                }
                userToAdd.displayName = user.DisplayName;
                var c = 0;
                for (var j = 0; j < user.TrianglesAllow.length; j++) {
                    getCircle('c19n', user.TrianglesAllow[j].TriangleClearance + "" + user.TrianglesAllow[j].TriangleId, function(circle) {
                        if (circle) {
                            userToAdd['circles.c19n'].push(circle._id);
                            c++;
                        }
                        if (c == user.PublishProcedureAllow.length + user.TrianglesAllow.length) {
                            User.findOneAndUpdate({
                                id: userToAdd.id
                            }, userToAdd, {
                                upsert: true,
                                new: true
                            }, function(error, user) {
                                callback(user);
                            })
                        }
                    });
                }

                for (var j = 0; j < user.PublishProcedureAllow.length; j++) {
                    getCircle(user.PublishProcedureAllow[j].PublishProcedureType, user.PublishProcedureAllow[j].PublishProcedureId, function(circle) {
                        if (circle) {
                            if (userToAdd['circles.'+circle.circleType])
                                userToAdd['circles.'+circle.circleType].push(circle._id);
                            c++;
                        }
                        if (c == user.PublishProcedureAllow.length + user.TrianglesAllow.length) {
                            User.findOneAndUpdate({
                                id: userToAdd.id
                            }, userToAdd, {
                                upsert: true,
                                new: true
                            }, function(error, user) {
                                callback(user);
                            })
                        }
                    });
                }
            })
        }
    }
    
    function saveSources(circle, sources) {
        for (var i = 0; i < sources.length; i++) {
            Source.findOneAndUpdate({
                sourceId: sources[i].Id
            }, {
                sourceId: sources[i].Id,
                name: sources[i].Name,
                circleName: '' + sources[i].Clearance + sources[i].LinkedTriangleId,
                circleType: 'c19n',
                circle: circle,
                classification: sources[i].Classification
            }, {
                upsert: true
            }).exec(function(err, source) {});
        }
    }

    function saveCircle(i, triangleId, triangleName, clearances, sources, parents) {
        var circles = require('./controllers/circles')({}, app);
        if (clearances[i]) {
            circles.registerCircles({
                id: '' + clearances[i] + triangleId,
                type: 'c19n',
                parents: parents,
                isActive: true,
                name: clearances[i] + triangleName
            }, function(err, circle) {
                if (err) return;
                if (sources[clearances[i]]) saveSources(circle, sources[clearances[i]])
                saveCircle(i + 1, triangleId, triangleName, clearances, sources, [circle._id]);
            });
        }
    }

    function getCircle(circleType, circleId, callback) {
        Circle.findOne({
            circleId: circleId,
            circleType: circleType
        }, function(err, circle) {
            callback(circle);
        });
    }


}