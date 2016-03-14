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
 * @type {{
 *   email: =string,
 *   username: string,
 *   password: string,
 *   confirmed: =string
 * }}
 */
user.userInfoFile = 'userInfo.txt';

/**
 * @typedef {{
 *   email: =string,
 *   username: string,
 *   password: string,
 *   confirmed: =boolean
 * }}
 */
user.userInfo;

/**
 * @typedef {{
 *   success: boolean,
 *   errorMessage: {=string}
 * }}
 */
user.SignupResponse;

/**
 * Checks the user information for signing in.
 * @param {string} userPath Directory of user indormation file.
 * @param {user.userInfo} userInfo User Information
 * @return {user.SignupResponse}
 */
user.signUp = function(userPath, userInfo) {
  var checkDuplicate = {
    duplicated: false,
    elements: []
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
        checkDuplicate.elements.push('email: ' + userInfo.email);
      }
      if (parts[0] == userInfo.username) {
        checkDuplicate.elements.push('username: ' + userInfo.username);
      }
      break;
    }
  }
  if (checkDuplicate.duplicated) {
    var errorMessage = checkDuplicate.elements.join(' and ') + ' exist';
    errorMessage += checkDuplicate.elements.length == 1 ? 's' : '';
    return {
      success: false,
      errorMessage: errorMessage
    };
  } else {
    var infoLine = userInfo.email + ' ' + userInfo.username + ' ' +
      userInfo.password + ' ' + userInfo.confirmed + '\n';
    fs.appendFile(userPath + user.userInfoFile, infoLine, function(err) {
      if (err) {
        console.log(err);
        return;
      }
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
 * @param {user.userInfo} userInfo User Information
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
      return {
        success: true
      };
    }
  }
  return {
    success: false
  };
};
