/**
 * @fileoverview user function handler
 */
var fs = require('fs');
var assert = require('assert');

var log = require('./log.js');
var utils = require('./utils.js');

/** @type {user} */
module.exports = user;

/**
 * @constructor
 */
function user() {}

/** @enum {string} */
user.QueryType = {
  SIGNUP: 'sign-up',
  SIGNIN: 'sign-in'
};

/** @const {RegExp} */
user.VALID_EMAIL_REGEX =
  /^([a-zA-Z0-9_\.\-])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/;

/** @const {RegExp} */
user.VALID_USERNAME_REGEX = /^\w{6,}$/;

/** @const {RegExp} */
user.VALID_PASSWORD_REGEX = /^\w{8,}$/;

/**
 * Expire time of cookie.
 * @const {number}
 */
user.cookieExpireTime = 24 * 60 * 60 * 1000;

/**
 * @typedef {{
 *   email: (string|undefined),
 *   username: string,
 *   password: string,
 *   confirmed: (boolean|undefined)
 * }}
 */
user.Info;

/**
 * @typedef {{
 *   error: string
 * }}
 */
user.Error;

/**
 * Checks the user information for signing in.
 * @param {!mongodb.Db} db Session database.
 * @param {string} logPath Directory of user log file.
 * @param {!user.Info} userInfo User Information
 * @param {function(!Object)} callback Callback function.
 */
user.signUp = function(db, logPath, userInfo, callback) {
  var cursor = db.collection('userInfo').find({
    $or: [{username: userInfo.username}, {email: userInfo.email}]});
  var data = [];
  cursor.each(function(err, doc) {
    assert.equal(err, null, err);
    if (doc != null) {
      data.push(doc);
    } else {
      var result = authenticateCallback(data);
      callback(result);
    }
  });
  var authenticateCallback = function(data) {
    var duplicates = [];
    data.forEach(function(item) {
      data.forEach(function(item) {
        if (item.email == userInfo.email) {
          duplicates.push('email: ' + userInfo.email);
        }
        if (item.username == userInfo.username) {
          duplicates.push('username: ' + userInfo.username);
        }
      });
    });
    if (duplicates.length) {
      var errorMessage = duplicates.join(' and ') + ' exist(s)';
      return {
        error: errorMessage
      };
    } else {
      db.collection('userInfo').insertOne(userInfo);
      log.serverLog('user information saved');
      var folder = logPath + userInfo.username + '/';
      if (!fs.existsSync(folder)) {
        fs.mkdirSync(folder);
      }
      return true;
    }
  };
};

/**
 * Checks the user information for signing in.
 * @param {!mongodb.Db} db Session database.
 * @param {!user.Info} userInfo User Information
 * @param {function(!Object)} callback Callback function.
 */
user.signIn = function(db, userInfo, callback) {
  var cursor = db.collection('userInfo').find({
    $and: [{username: userInfo.username}, {password: userInfo.password}]});
  var data;
  cursor.each(function(err, doc) {
    assert.equal(err, null, err);
    if (doc != null) {
      data = doc;
    } else {
      var result = authenticateCallback(data);
      callback(result);
    }
  });
  var authenticateCallback = function(data) {
    if (data) {
      return true;
    } else {
      return {
        error: 'incorrect username or password'
      };
    }
  };
};

/**
 * Gets session ID from database. Regenerate if it is expired.
 * @param {!mongodb.Db} db Session database.
 * @param {string} username Username of the POST query.
 * @param {function(!Object)} callback Callback function.
 */
user.authenticate = function(db, username, callback) {
  var cursor = db.collection('session').find({username: username});
  var result = [];
  cursor.each(function(err, doc) {
    assert.equal(err, null, err);
    if (doc != null) {
      result.push(doc);
    } else {
      var data = authenticateCallback();
      callback(data);
    }
  });
  var authenticateCallback = function() {
    var hasValidSession = false;
    var sessionIndex = -1;
    if (result.length) {
      for (var i = 0; i < result.length; i++) {
        if (new Date().getTime() < result[i].expiration) {
          sessionIndex = i;
          hasValidSession = true;
          break;
        }
      }
    }
    if (!result.length || !hasValidSession) {
      // Don't have username or have username but don't have valid session
      var cookie = {
        username: username,
        sessionId: utils.randomString(),
        expiration: new Date().getTime() + user.cookieExpireTime
      };
      db.collection('session').insertOne(cookie);
    } else {
      // Have session and update expire date
      var cookie = result[sessionIndex];
      var newExpiration = new Date().getTime() + user.cookieExpireTime;
      db.collection('session').update(cookie,
        {$set: {expiration: newExpiration}}, {upsert: false});
      cookie.expiration = newExpiration;
    }
    return {
      cookie: cookie
    };
  };
};

/**
 * Validates email address.
 * @param {string} email
 * @return {boolean}
 */
user.validateEmail = function(email) {
  return utils.validateRegex(email, user.VALID_EMAIL_REGEX);
};

/**
 * Validates username, allows letters, numbers, and underscores, and no less
 * than 6 characters.
 * @param {string} username
 * @return {boolean}
 */
user.validateUsername = function(username) {
  return utils.validateRegex(username, user.VALID_USERNAME_REGEX);
};

/**
 * Validates password, allows letters, numbers, and underscores, and no less
 * than 8 characters.
 * @param {string} password
 * @return {boolean}
 */
user.validatePassword = function(password) {
  return utils.validateRegex(password, user.VALID_PASSWORD_REGEX);
};
