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

/** @enum {string} */
user.QueryType = {
  SIGHUP: 'sign-up',
  SIGNIN: 'sign-in'
};

/**
 * Name of user information file.
 * @type {string}
 */
user.userInfoFile = 'userInfo.txt';

/**
 * Checks the user information for signing in.
 * @param {string} userPath Directory of user indormation file.
 * @param {!Object} userInfo User Information
 * @return {!Object{
 *   success: boolean,
 *   errorMessage: {=string}
 * }}
 */
user.signUp = function(userPath, userInfo) {
  var checkDuplicate = {
    duplicated: false,
    element: []
  };
  var lines = fs.readFileSync(userPath + user.userInfoFile).toString()
    .split('\n');
  for (var i = 0; i < lines.length; i++) {
    var parts = lines[i].split(/[\t\s]+/);
    if (parts.length == 0) {
      continue;
    }
    if (parts[0] == userInfo.email || parts[1] == userInfo.username) {
      checkDuplicate.duplicated = true;
      if (parts[0] == userInfo.email) {
        checkDuplicate.element.push('email: ' + userInfo.email);
      }
      if (parts[0] == userInfo.username) {
        checkDuplicate.element.push('username: ' + userInfo.username);
      }
      break;
    }
  }
  console.log(checkDuplicate);
  if (checkDuplicate.duplicated) {
    var errorMessage = checkDuplicate.element.join(' and ') + ' exist';
    errorMessage += checkDuplicate.element.length == 1 ? 's' : '';
    return {
      success: false,
      errorMessage: errorMessage
    };
  } else {
    var infoLine = userInfo.email + ' ' + userInfo.username + ' ' +
      userInfo.password + ' ' + userInfo.confirmed + '\n';
    fs.appendFile(userPath + user.userInfoFile, infoLine, function(err) {
      if (err)
        return console.log(err);
      console.log('user information saved');
    });
    return {
      success: true
    };
  }
};

/**
 * Checks the user information for signing in.
 * @param {string} userPath Directory of user indormation file.
 * @param {!Object} userInfo User Information
 * @return {boolean} correct Whether the user information is correct.
 */
user.signIn = function(userPath, userInfo) {
  var lines = fs.readFileSync(userPath + user.userInfoFile).toString()
    .split('\n');
  for (var i = 0; i < lines.length; i++) {
    var parts = lines[i].split(/[\t\s]+/);
    if (parts.length == 0) {
      continue;
    }
    if (parts[1] == userInfo.username && parts[2] == userInfo.password) {
      return true;
    }
  }
  return false;
};
