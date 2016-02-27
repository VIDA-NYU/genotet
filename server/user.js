/**
 * @fileoverview user function handler
 */
var fs = require('fs');
var childProcess = require('child_process');
var readline = require('readline');
var mkdirp = require('mkdirp');

var utils = require('./utils.js');

/** @type {user} */
module.exports = user;

/**
 * @constructor
 */
function user() {}
