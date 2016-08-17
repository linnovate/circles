var Circle = require('./models/circle');
var User = require('./models/user');
var Source = require('./models/source');

var getData = require('npm-getdata-pkg'),
	config = require(process.cwd() + '/config') || {};
module.exports = function(app) {

    var circles = require('./controllers/circles')({}, app);
    getC19n();

    getC19nGroups();
    
    getUsers();
    
    require('./helpers')(config.activeProvider, app).getCorporateGroups();

    function getC19nGroups() {
       
        getData.getC19nGroups(function(c19nGroups){
        for (var i = 0; i < c19nGroups.length; i++) {
            circles.registerCircles({
                id: c19nGroups[i].Id,
                type: c19nGroups[i].Type,
                name: c19nGroups[i].Name,
                isActive: c19nGroups[i].IsActive
            });		
            }
        });
    };


    function getC19n() {
        getData.getSources(function(sources){

            var circlesObj = {};

            Circle.find({
                circleType: 'c19n'
            }).exec(function(err, c) {
                var circles = {};
                for (var i = 0; i < c.length; i++) {
                    circles[c[i].circleId] = c[i];
                }
                for (var i = 0; i < sources.length; i++) {
                    var circle = circles['' +sources[i].Clearance + sources[i].LinkedTriangleId] ? circles[ '' + sources[i].Clearance + sources[i].LinkedTriangleId]._id : null;
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
                    }).exec(function(err, source) {
                    });

                    if (!circlesObj[sources[i].LinkedTriangleId]) circlesObj[sources[i].LinkedTriangleId] = [];
                    if (circlesObj[sources[i].LinkedTriangleId].indexOf(sources[i].Clearance.toString()) < 0)
                        circlesObj[sources[i].LinkedTriangleId].push(sources[i].Clearance.toString())
                }
                for (var triangleId in circlesObj) {
                    var clearances = circlesObj[triangleId].sort().reverse();
                    saveCircle(0, triangleId, clearances, null);
                }
            });
        });

    }

    function saveCircle(i, triangleId, clearances, parents) {
        if (clearances[i]) {
            circles.registerCircles({
                id: '' + clearances[i] + triangleId,
                type: 'c19n',
                parents: parents,
                isActive: true
            }, function(err, circle) {
                if (err) return;
                saveCircle(i + 1, triangleId, clearances, [circle._id]);
            });
        }
    }

    function getCircle(circleType, circleId, callback){
        Circle.findOne({
            circleId: circleId,
            circleType: circleType
        },function(err, circle){
            callback(circle);
        });
    }

    function initUser(user){
        var userToAdd = {};
                userToAdd.id = user.uniqueId;
                userToAdd.displayName = user.displayName;
                userToAdd.fullName = user.fullName;
                userToAdd.circles = {};
                userToAdd.circles.c19n = [];
                userToAdd.circles.c19nGroups1 = [];
                userToAdd.circles.c19nGroups2 = [];			
                getData.getUserPermission(function(user){
                    var c = 0;
                    for(var j=0; j < user.TrianglesAllow.length; j++){
                        getCircle('c19n', user.TrianglesAllow[j].TriangleClearance + "" + user.TrianglesAllow[j].TriangleId, function(circle){
                            if(circle){
                                userToAdd.circles.c19n.push(circle._id);
                                c++;
                            }
                        });
                    }
                    
                    for(var j=0; j < user.PublishProcedureAllow.length; j++){
                        getCircle(user.PublishProcedureAllow[j].PublishProcedureType, user.PublishProcedureAllow[j].PublishProcedureId, function(circle){
                            if(circle){
                                userToAdd.circles[circle.circleType].push(circle._id);
                                c++;
                            }
                            if (c == user.PublishProcedureAllow.length + user.TrianglesAllow.length){
                                User.findOneAndUpdate({id: user.uniqueId}, userToAdd, {upsert:true}, function(){})
                            }
                        });															
                    }
                })
    }
    function getUsers(){
        getData.getUsers(function(users){
            for (var i = 0; i < users.length; i++) {
                initUser(users[i]);
            }		
        });
    }
}