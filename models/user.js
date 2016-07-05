'use strict';

var mongoose = require('mongoose'),
  Schema = mongoose.Schema;

var UserSchema = new Schema({
  id: String,
  created: Date,
  updated: Date,
  circles: {},
  displayName: String,
  classification: Number
});

module.exports = mongoose.model('User', UserSchema);