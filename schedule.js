var schedule = require('node-schedule');

module.exports = function(app) {
    var initData = require('./initData')(app);

    schedule.scheduleJob('0 56 10 * * *', function(){
        console.log('init C19nGroups data from scheduler');
        initData.getC19nGroups();
    });
    
    schedule.scheduleJob('0 57 10 * * *', function(){
        console.log('init C19n data from scheduler');
        initData.getC19n();
    });
}
