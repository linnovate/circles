require('../models/user');
var chai = require('chai');
var assert = chai.assert;
var request = require('supertest');
var mongoose = require('mongoose');
var winston = require('winston');
var config = require(process.cwd() + '/config') || {};

mongoose.connect(config.db);
var conn = mongoose.connection;

var drop = function(table, cb) {
    conn.collection(table).drop(function(err, doc) {
        if (err) return cb(err)
        cb(null, doc);
    })
}

var create = function(id, cb) {
    conn.collection('users').insert({ id: id }, function(err, user) {
        if (err) return cb(err)
        cb(null, user._id);
    })
}

var findUser = function(userId, circleId, cb) {
    conn.collection('users').find({ id: userId, 'circles.personal': circleId }, { 'circles.personal.$': true }, function(err, doc) {
        if (err) return cb(err)
        cb(null, doc._id);
    })
}

describe('Routing', function() {
    var url = 'http://localhost:3006';
    before(function(done) {
        drop('circles', function() {
            drop('users', function() {
                create('userTest', function() {});
                create('user1', function() {});
                create('user2', function() {});
                create('user3', function() {});
                done();
            });
        });
    });

    describe('Personal', function() {
        var circleId;
        it('should return error if no name', function(done) {
            var circle = {
                creator: 'userTest',
                users: [],
                managers: []
            };

            request(url)
                .post('/api/v1/circles/personal')
                .send(circle)
                .end(function(err, res) {
                    if (err) {
                        throw err;
                    }
                    assert.equal(res.status, 500)
                    done();
                });
        });

        it('should return error if the manager is not existing in the system', function(done) {
            var circle = {
                creator: 'userTest',
                name: 'circleTest',
                users: ['user1', 'user2'],
                managers: ['user3', 'no user']
            };
            request(url)
                .post('/api/v1/circles/personal')
                .send(circle)
                .end(function(err, res) {
                    if (err) {
                        throw err;
                    }
                    assert.equal(res.status, 500)
                    done();
                });
        });

        it('should return error if the user is not existing in the system', function(done) {
            var circle = {
                creator: 'userTest',
                name: 'circleTest',
                users: ['user1', 'user2', 'no user'],
                managers: ['user3']
            };
            request(url)
                .post('/api/v1/circles/personal')
                .send(circle)
                .end(function(err, res) {
                    if (err) {
                        throw err;
                    }
                    assert.equal(res.status, 500)
                    done();
                });
        });

        it('should return passed and save all users if they are existing', function(done) {
            var circle = {
                creator: 'userTest',
                name: 'circleTest',
                users: ['user1', 'user2'],
                managers: ['user3']
            };
            request(url)
                .post('/api/v1/circles/personal')
                .send(circle)
                .end(function(err, res) {
                    if (err) {
                        throw err;
                    }
                    assert.equal(res.status, 200)
                    assert.equal(res.body.creator.id, 'userTest');
                    circle.managers.push(circle.creator);
                    for (var i = 0; i < res.body.users.length; i++) {
                        if (res.body.users[i].role == 'manager') {
                            assert.oneOf(res.body.users[i].user.id, circle.managers);
                        } else {
                            if (res.body.users[i].role == 'user') {
                                assert.oneOf(res.body.users[i].user.id, circle.users);
                            }
                        }
                    }
                    done();
                });
        });

        it('should return error if no creator', function(done) {
            var circle = {
                name: 'circleTest',
                users: [],
                managers: []
            };
            request(url)
                .post('/api/v1/circles/personal')
                .send(circle)
                .end(function(err, res) {
                    if (err) {
                        throw err;
                    }
                    assert.equal(res.status, 500)
                    done();
                });
        });

        it('should return passed if added circle to the user', function(done) {
            var circle = {
                creator: 'userTest',
                name: 'circleTest1',
                users: [],
                managers: []
            };
            request(url)
                .post('/api/v1/circles/personal')
                .send(circle)
                .end(function(err, res) {
                    if (err) {
                        throw err;
                    }
                    assert.equal(res.status, 200)
                    circleId = res.body._id;
                    for (var i = res.body.users.length - 1; i >= 0; i--) {
                        findUser(res.body.users[i].user.id, res.body._id, function(error, id) {
                            assert.isNotNull(id);
                        });
                    }
                    done();
                });
        });

        it('should return passed if the circle added to the user after creating a circle', function(done) {
            var user = {
                user: 'user1',
                role: 'manager'
            };
            request(url)
                .put('/api/v1/circles/personal/' + circleId + '/addUser?user=userTest')
                .send(user)
                .end(function(err, res) {
                    if (err) {
                        throw err;
                    }
                    assert.equal(res.status, 200)
                    for (var i = res.body.users.length - 1; i >= 0; i--) {
                        findUser(res.body.users[i].user.id, res.body._id, function(error, id) {
                            assert.isNotNull(id);
                        });
                    }
                    var users = res.body.users.map(function(user) {
                        return (user.user.id);
                    });
                    assert.oneOf(user.user, users);
                    done();
                });
        });

        it('should return error after adding user to circle by user', function(done) {
            var user2 = {
                user: 'user1',
                role: 'user'
            };
            request(url)
                .put('/api/v1/circles/personal/' + circleId + '/addUser?user=user2')
                .send(user2)
                .end(function(err, res) {
                    if (err) {
                        throw err;
                    }
                    assert.equal(res.status, 500)
                    done();
                });
        });

        it('should return error after adding an existing user', function(done) {
            var user3 = {
                user: 'user1',
                role: 'user'
            };
            request(url)
                .put('/api/v1/circles/personal/' + circleId + '/addUser?user=userTest')
                .send(user3)
                .end(function(err, res) {
                    if (err) {
                        throw err;
                    }
                    assert.equal(res.status, 500)
                    done();
                });
        });

        it('should return error after adding to circle user does’t exist in the system', function(done) {
            var user4 = {
                user: 'noUserTest',
                role: 'user'
            };
            request(url)
                .put('/api/v1/circles/personal/' + circleId + '/addUser?user=userTest')
                .send(user4)
                .end(function(err, res) {
                    if (err) {
                        throw err;
                    }
                    assert.equal(res.status, 500)
                    done();
                });
        });

        it('should return error after removing a user from the circle by user', function(done) {
            var user2 = {
                user: 'user1',
                role: 'user'
            };
            request(url)
                .put('/api/v1/circles/personal/' + circleId + '/removeUser?user=user2')
                .send(user2)
                .end(function(err, res) {
                    if (err) {
                        throw err;
                    }
                    assert.equal(res.status, 500)
                    done();
                });
        });

        it('should return passed after removing a user from the circle by manager', function(done) {
            var user = {
                user: 'user1',
                role: 'manager'
            };
            request(url)
                .put('/api/v1/circles/personal/' + circleId + '/removeUser?user=userTest')
                .send(user)
                .end(function(err, res) {
                    if (err) {
                        throw err;
                    }
                    assert.equal(res.status, 200)
                    for (var i = res.body.users.length - 1; i >= 0; i--) {
                        findUser(res.body.users[i].user.id, res.body._id, function(error, id) {
                            assert.isNotNull(id);
                        });
                    }
                    var users = res.body.users.map(function(user) {
                        return (user.user.id);
                    });
                    assert.notInclude(user.user, users);
                    done();
                });
        });

        it('should return error after removing an existing user', function(done) {
            var user3 = {
                user: 'not existing',
                role: 'user'
            };
            request(url)
                .put('/api/v1/circles/personal/' + circleId + '/addUser?user=userTest')
                .send(user3)
                .end(function(err, res) {
                    if (err) {
                        throw err;
                    }
                    assert.equal(res.status, 500)
                    done();
                });
        });

        it('should return error after removing an user by himself', function(done) {
            var user3 = {
                user: 'userTest',
                role: 'manager'
            };
            request(url)
                .put('/api/v1/circles/personal/' + circleId + '/addUser?user=userTest')
                .send(user3)
                .end(function(err, res) {
                    if (err) {
                        throw err;
                    }
                    assert.equal(res.status, 500)
                    done();
                });
        });
    });
});
