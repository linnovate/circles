'use strict';

exports.load = function(swagger) {

    var searchParms = {};

    var getCircles = {
        'spec': {
            description: 'Get all Circles',
            path: '/circles/all',
            method: 'Get',
            summary: 'get circles',
            notes: '',
            nickname: 'getCircles',
            produces: ['application/json'],
            parameters: [swagger.queryParam('type', 'type of circle', 'string')]
        }
    };

    var getSources = {
        'spec': {
            description: 'Get Sources',
            path: '/circles/sources',
            method: 'Get',
            summary: 'get sources',
            notes: '',
            nickname: 'getSources',
            produces: ['application/json'],
            parameters: [swagger.queryParam('type', 'type of source', 'string'),
                swagger.queryParam('user', 'get sources only for user id', 'string')
            ]
        }
    };

    var getMyCircles = {
        'spec': {
            description: 'Get my Circles',
            path: '/circles/mine',
            method: 'Get',
            summary: 'get my circles',
            notes: '',
            nickname: 'getMyCircles',
            produces: ['application/json'],
            parameters: [swagger.queryParam('type', 'type of source', 'string'),
                swagger.queryParam('user', 'get sources only for user id', 'string')
            ]
        }
    };

    var createCircle = {
        'spec': {
            description: 'Create Circle',
            path: '/circles/personal',
            method: 'Post',
            summary: 'create circle',
            notes: '',
            type: 'Circle',
            nickname: 'createCircle',
            produces: ['application/json'],
            params: searchParms,
            parameters: [{
                name: 'body',
                description: 'circle.',
                required: false,
                type: 'Circle',
                paramType: 'body',
                allowMultiple: false
            }]
        }
    };

    var getCircleById = {
        'spec': {
            description: 'Get Circle by id',
            path: '/circles/personal/{id}',
            method: 'Get',
            summary: 'get circle by id',
            notes: '',
            nickname: 'getCircleById',
            produces: ['application/json'],
            parameters: [swagger.pathParam('id', 'id of circle', 'string')]
        }
    };

    var updateCircle = {
        'spec': {
            description: 'Update Circle',
            path: '/circles/personal/{id}',
            method: 'Put',
            summary: 'update circle',
            notes: '',
            type: 'Circle',
            nickname: 'updateCircle',
            produces: ['application/json'],
            parameters: [swagger.pathParam('id', 'id of circle', 'string'),
                swagger.queryParam('user', 'user id', 'string'),
                swagger.bodyParam('id', 'new id of circle', 'string')
            ]
        }
    };

    var addUserToCircle = {
        'spec': {
            description: 'Add user to Circle',
            path: '/circles/personal/{id}/addUser',
            method: 'Put',
            summary: 'add user to circle',
            notes: '',
            type: 'Circle',
            nickname: 'addUserToCircle',
            produces: ['application/json'],
            parameters: [swagger.pathParam('id', 'id of circle', 'string'),
                swagger.queryParam('user', 'user id', 'string'),
                swagger.bodyParam('user', 'user id to add to circle', 'string')
            ]
        }
    };

    var removeUserFromCircle = {
        'spec': {
            description: 'Remove user from Circle',
            path: '/circles/personal/{id}/removeUser',
            method: 'Put',
            summary: 'add user to circle',
            notes: '',
            type: 'Circle',
            nickname: 'removeUserFromCircle',
            produces: ['application/json'],
            parameters: [swagger.pathParam('id', 'id of circle', 'string'),
                swagger.queryParam('user', 'user id', 'string'),
                swagger.bodyParam('user', 'user id to remove from circle', 'string')
            ]
        }
    };

    var deleteCircle = {
        'spec': {
            description: 'Delete Circle by id',
            path: '/circles/personal/{id}',
            method: 'delete',
            summary: 'delete circle',
            notes: '',
            type: 'Circle',
            nickname: 'deleteCircle',
            produces: ['application/json'],
            parameters: [swagger.pathParam('id', 'id of circle', 'string')]
        }
    };

    swagger
        .addGet(getCircles)
        .addGet(getSources)
        .addGet(getMyCircles)
        .addPost(createCircle)
        .addGet(getCircleById)
        // .addPut(updateCircle)
        .addPut(addUserToCircle)
        .addPut(removeUserFromCircle)
        // .addDelete(deleteCircle);

};
