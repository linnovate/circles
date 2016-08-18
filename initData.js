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
            for (var i = 0; i < sources.length; i++) {
    
                if (!circlesObj[sources[i].LinkedTriangleId]) circlesObj[sources[i].LinkedTriangleId] = {clearances: [], sources:{}};
                if (circlesObj[sources[i].LinkedTriangleId].clearances.indexOf(sources[i].Clearance.toString()) < 0)
                    circlesObj[sources[i].LinkedTriangleId].clearances.push(sources[i].Clearance.toString())
                
                if (!circlesObj[sources[i].LinkedTriangleId].sources[sources[i].Clearance.toString()])
                    circlesObj[sources[i].LinkedTriangleId].sources[sources[i].Clearance.toString()] = [];
                circlesObj[sources[i].LinkedTriangleId].sources[sources[i].Clearance.toString()].push(sources[i]);
            }
            for (var triangleId in circlesObj) {
                var clearances = circlesObj[triangleId].clearances.sort().reverse();
                saveCircle(0, triangleId, clearances, circlesObj[triangleId].sources, null);
            }
           
        });

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
            }).exec(function(err, source) {
            });
        }
    }

    function saveCircle(i, triangleId, clearances, sources, parents) {
        if (clearances[i]) {
            circles.registerCircles({
                id: '' + clearances[i] + triangleId,
                type: 'c19n',
                parents: parents,
                isActive: true
            }, function(err, circle) {
                if (err) return;
                saveSources(circle, sources[clearances[i]])
                saveCircle(i + 1, triangleId, clearances, sources, [circle._id]);
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
                            if (c == user.PublishProcedureAllow.length + user.TrianglesAllow.length){
                                User.findOneAndUpdate({id: userToAdd.id}, userToAdd, {upsert:true}, function(){})
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
                                User.findOneAndUpdate({id: userToAdd.id}, userToAdd, {upsert:true}, function(a,b){
                                })
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