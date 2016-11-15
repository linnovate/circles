'use strict';

var mongoose = require('mongoose'),
  Schema = mongoose.Schema;

var UserSchema = new Schema({
  id: String,
  circles: {},
  displayName: String,
  fullName: String,
  classification: Number,
  lastModified: {}
}, {
  timestamps: true
});

module.exports = mongoose.model('User', UserSchema);