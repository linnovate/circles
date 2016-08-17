'use strict';

var mongoose = require('mongoose'),
  Schema = mongoose.Schema;
  
var UsersSchema = new Schema({
  user:{
      type: Schema.ObjectId,
      ref: 'User'
    },
  role: String
},{ _id : false });

var CircleSchema = new Schema({
  description: String,
  name: {
    type: String,
    required: true
  },
  circleId: String,
  circles: [String],
  circleType: String,
  isActive: {
    type: Boolean,
    default: true
  },
  creator: {
    type: Schema.ObjectId,
    ref: 'User'
  },
  users: [UsersSchema]
}, {
  timestamps: true
});

CircleSchema.statics.buildPermissions = function(callback) {

  var data = {};
  console.log('*********buildPermissions********')
  this.find({
    // isActive: true
  }).sort({
    circle: 1
  }).populate('manager', 'id displayName').deepPopulate('users.user').exec(function(err, circles) {

    circles.forEach(function(circle) {
      if (!data[circle.circleType]) data[circle.circleType] = {};
      data[circle.circleType][circle._id] = circle.toObject();
      data[circle.circleType][circle._id].containers = circle.circles;
      data[circle.circleType][circle._id].parents = [];
      data[circle.circleType][circle._id].decendants = [];
      data[circle.circleType][circle._id].children = [];

    });

    var found = true;
    //yes not efficient - getting there..
    var level = 0;
    while (found) {
      found = false;

      circles.forEach(function(circle) {

        var containers = data[circle.circleType][circle._id].containers;

        //going through each of the containers parents
        containers.forEach(function(container) {
          if (data[circle.circleType][container].decendants.indexOf(circle._id.toString()) == -1) {
            data[circle.circleType][container].decendants.push(circle._id.toString());
            if (level === 0) {
              data[circle.circleType][circle._id].parents.push(container.toString());
              data[circle.circleType][container].children.push(circle._id.toString());
            }
          }

          data[circle.circleType][container].circles.forEach(function(circ) {
            if (containers.indexOf(circ) == -1 && circ != circle._id.toString()) {
              data[circle.circleType][circle._id].containers.push(circ.toString());
              found = true;
            }
          });
        });
      });
      level++;
    }

    callback({
      tree: buildTrees(data),
      circles: data
    });
  });

};


var buildTrees = CircleSchema.statics.buildTrees = function(data) {
  var tree = {
    name: 'circles',
    isActive: true,
    children: []
  };

  for (var type in data) {
    var length = tree.children.length;
    tree.children.push({
      name: type,
      isActive: true,
      children: []
    });

    for (var index in data[type]) {
      buildTree(data[type], index, tree.children[length].children);
    }
  }

  return tree;
};

function buildTree(data, id, branch) {

  var length = branch.length;

  branch.push({
    name: data[id].name || data[id].circleId,
    isActive: data[id].isActive
  });

  if (hasChildren(data, id)) {
    branch[length].children = [];
  } else {
    branch[length].size = 1;
  }

  //only goes here if there are children
  data[id].children.forEach(function(child) {

    if (id !== child && data[child]) {
      if (noParents(data, child)) {
        branch[length].children.push({
          name: data[child].name || data[child].circleId,
          size: 1
        });
      } else {
        buildTree(data, child, branch[length].children);
      }
    }
  });
}

function noParents(data, id) {
  return data[id].parents.length === 0
}

function noChildren(data, id) {
  return data[id].children.length === 0
}

function hasChildren(data, id) {
  return !noChildren(data, id);
}

var deepPopulate = require('mongoose-deep-populate')(mongoose);
CircleSchema.plugin(deepPopulate, {populate:{'users.user': {select:'id displayName'} }});
module.exports = mongoose.model('Circle', CircleSchema);