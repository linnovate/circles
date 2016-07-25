require('../models/user');
var chai = require('chai');
var assert = chai.assert;
var request = require('supertest');
var mongoose = require('mongoose');
var winston = require('winston');
var config = require(process.cwd() + '/config') || {};
console.log(config.db);

mongoose.connect(config.db);
var conn = mongoose.connection;

var drop = function(table, cb) {
    conn.collection(table).drop(function(err, doc) {
        console.log(err, doc)
        if (err) return cb(err)
        cb(null, doc);
    })
}

var create = function(id, cb) {
    console.log('db');
    conn.collection('users').insert({ id: id }, function(err, doc) {
        console.log(err, doc)
        if (err) return cb(err)
        cb(null, doc._id);
    })
}

var findUser = function(id, circleId, cb) {
    console.log('db');
    conn.collection('users').find({ id: id, 'circles.personal': circleId }, { 'circles.personal.$': true }, function(err, doc) {
        console.log(err, doc)
        if (err) return cb(err)
        cb(null, doc._id);
    })
}

var findCircle = function(name, cb) {
    console.log('db');
    conn.collection('circles').find({ name: name }, { 'circles/personal/addUser.$': true }, function(err, doc) {
        console.log(err, doc)
        if (err) return cb(err)
        cb(null, doc._id);
    })
}

describe('Routing', function() {
    var url = 'http://localhost:3006';
    before(function(done) {
        drop('circles', function() {
            drop('users', function() {
                create('a', function() {});
                create('test', function() {});
                create('f', function() {});
                done();
            });
        });
    });

    describe('Personal', function() {
        it('should return error if no name', function(done) {
            var circle = {
                creator: 'test',
                users: [],
                managers: []
            };

            request(url)
                .post('/api/v1/circles/personal')
                .send(circle)
                .end(function(err, res) {
                    console.log(res.error);
                    if (err) {
                        throw err;
                    }
                    assert.equal(res.status, 500)
                    done();
                });
        });

        it('should return error if the manager is not existing in users', function(done) {
            var circle = {
                creator: 'test',
                name: 'test',
                users: ['a', 'f'],
                managers: ['f', 'j']
            };
            request(url)
                .post('/api/v1/circles/personal')
                .send(circle)
                .end(function(err, res) {
                    console.log(res.body.users, res.error);
                    if (err) {
                        throw err;
                    }
                    assert.equal(res.status, 500)
                    done();
                });
        });

        it('should save all users if they are existing', function(done) {
            var circle = {
                creator: 'test',
                name: 'test',
                users: ['a', 'f'],
                managers: ['f']
            };
            request(url)
                .post('/api/v1/circles/personal')
                .send(circle)
                .end(function(err, res) {
                    console.log(res.body.users, res.error);
                    if (err) {
                        throw err;
                    }
                    assert.equal(res.status, 200)
                    assert.equal(res.body.creator.id, 'test');
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
                name: 'test',
                users: [],
                managers: []
            };
            request(url)
                .post('/api/v1/circles/personal')
                .send(circle)
                .end(function(err, res) {
                    console.log(res.error);
                    if (err) {
                        throw err;
                    }
                    assert.equal(res.status, 500)
                    done();
                });
        });

        it('should add the circle to the user', function(done) {
            var circle = {
                creator: 'test',
                name: 'test',
                users: [],
                managers: []
            };
            request(url)
                .post('/api/v1/circles/personal')
                .send(circle)
                .end(function(err, res) {
                    console.log(res.body.users);
                    if (err) {
                        throw err;
                    }
                    assert.equal(res.status, 200)
                    for (var i = res.body.users.length - 1; i >= 0; i--) {
                        findUser(res.body.users[i].user.id, res.body._id, function(error, id) {
                            assert.isNotNull(id);
                        });
                    }

                    done();
                });
        });


        it('should add the circle to the user after added user', function(done) {
            var circle = {
                creator: 'test',
                name: 'test',
                users: [],
                managers: []
            };
            request(url)
                .post('/api/v1/circles/personal/:id/addUser')
                .send(circle)
                .end(function(err, res) {
                    console.log(res.body.users);
                    if (err) {
                        throw err;
                    }
                    assert.equal(res.status, 200)
                    for (var i = res.body.users.length - 1; i >= 0; i--) {
                        findCircle(res.body.users[i].user.id, res.body._id, function(error, id) {
                            assert.isNotNull(id);
                        });
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

        it('should return the circle after remove user', function(done) {
            var circle = {
                creator: 'test',
                name: 'test',
                users: [],
                managers: []
            };
            request(url)
                .post('/api/v1/circles/personal/:id/removeUser')
                .send(circle)
                .end(function(err, res) {
                    console.log(res.body.users);
                    if (err) {
                        throw err;
                    }
                    assert.equal(res.status, 200)
                    for (var i = res.body.users.length - 1; i >= 0; i--) {
                        findCircle(res.body.users[i].user.id, res.body._id, function(error, id) {
                            assert.isNotNull(id);
                        });
                    }
                    done();
                });
        });
    });
});
