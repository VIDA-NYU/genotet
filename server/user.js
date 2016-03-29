/**
 * @fileoverview user function handler
 */
var fs = require('fs');
var CryptoJS = require('crypto-js');

var log = require('./log.js');
var utils = require('./utils.js');
var database = require('./database.js');

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

/**
 * Database name of user information.
 * @const {string}
 */
user.userInfoDbName = 'userInfo';

/**
 * Database name of session.
 * @const {string}
 */
user.sessionDbName = 'session';

/**
 * Expire time of cookie.
 * @const {number}
 */
user.cookieExpireTime = 24 * 60 * 60 * 1000;

/** @const {RegExp} */
user.VALID_EMAIL_REGEX =
  /^([a-zA-Z0-9_\.\-])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/;

/** @const {RegExp} */
user.VALID_USERNAME_REGEX = /^\w{6,}$/;

/** @const {RegExp} */
user.VALID_PASSWORD_REGEX = /^\w{8,}$/;

/**
 * @typedef {{
 *   email: (string|undefined),
 *   username: string,
 *   password: string,
 *   confirmed: (boolean|undefined),
 *   autoSignIn: (boolean|undefined)
 * }}
 */
user.Info;

/**
 * @typedef {{
 *   username: (string|undefined),
 *   sessionId: (string|undefined),
 *   expiration: (number|undefined)
 * }}
 */
user.Cookie;

/**
 * @typedef {{
 *   error: string
 * }}
 */
user.Error;

/** @const */
user.query = {};

// Start public APIs
/**
 * @param {*|!user.Info} query
 * @param {!mongodb.Db} db User information database.
 * @param {function(user.Error=)} callback Callback function.
 */
user.query.signIn = function(query, db, callback) {
  var data;
  if (!query.autoSignIn) {
    var userInfo = {
      username: query.username,
      password: CryptoJS.SHA256(query.password).toString()
    };
    if (!user.validateUserInfo(userInfo.username, userInfo.password)) {
      return;
    }
    user.signIn(db, userInfo, function(result) {
      data = result;
      callback(data);
    });
  } else {
    callback(data);
  }
};

/**
 * @param {*|!user.Info} query
 * @param {!mongodb.Db} db User information database.
 * @param {function(user.Error=)} callback Callback function.
 */
user.query.signUp = function(query, db, callback) {
  var data;
  var userInfo = {
    email: query.email,
    username: query.username,
    password: CryptoJS.SHA256(query.password).toString(),
    confirmed: query.confirmed
  };
  if (!user.validateUserInfo(userInfo.username, userInfo.password,
      userInfo.email)) {
    return;
  }
  user.signUp(db, userInfo, function(result) {
    data = result;
    callback(data);
  });
};

/**
 * Checks the user information for signing in.
 * @param {!mongodb.Db} db User information database.
 * @param {!user.Info} userInfo User Information.
 * @param {function(user.Error=)} callback Callback function.
 */
user.signUp = function(db, userInfo, callback) {
  var cursor = db.collection(user.userInfoDbName).find({
    $or: [{username: userInfo.username}, {email: userInfo.email}]
  });
  var data = [];
  cursor.each(function(err, doc) {
    if (err) {
      log.serverLog(err.message);
      return;
    }
    if (doc != null) {
      delete doc['_id'];
      data.push(doc);
    } else {
      var result = user.signUpUser_(db, data, userInfo);
      callback(result);
    }
  });
};

/**
 * Checks the user information for signing in.
 * @param {!mongodb.Db} db User information database.
 * @param {!user.Info} userInfo User Information.
 * @param {function(user.Error=)} callback Callback function.
 */
user.signIn = function(db, userInfo, callback) {
  var query = {$and: [{username: userInfo.username},
    {password: userInfo.password}]};
  database.getOne(db.collection(user.userInfoDbName), query, [],
    function(result) {
      var data;
      if (!result) {
        data = {
          error: 'incorrect username or password'
        };
      }
      callback(data);
    });
};

/**
 * Gets session ID from database. Regenerate if it is expired.
 * @param {!mongodb.Db} db Session database.
 * @param {string} username Username of the POST query.
 * @param {function(user.Cookie)} callback Callback function.
 */
user.authenticate = function(db, username, callback) {
  var query = {$and: [{username: username},
    {expiration: {$gt: new Date().getTime()}}]};
  database.getOne(db.collection(user.sessionDbName), query, [],
    function(result) {
      var data = user.authenticationResult(db, username,
        /** @type {!user.Cookie} */(result));
      callback(data);
    });
};

/**
 * Authenticates the signed up user.
 * @param {!mongodb.Db} db Session database.
 * @param {string} username Username of the POST query.
 * @param {user.Cookie} cookie Username.
 * @return {!user.Cookie}
 */
user.authenticationResult = function(db, username, cookie) {
  if (!cookie) {
    // Don't have username or have username but don't have valid session
    cookie = {
      username: username,
      sessionId: utils.randomString(),
      expiration: new Date().getTime() + user.cookieExpireTime
    };
    db.collection(user.sessionDbName).insertOne(cookie);
  } else {
    // Have session and update expire date
    var newExpiration = new Date().getTime() + user.cookieExpireTime;
    db.collection(user.sessionDbName).update(cookie,
      {$set: {expiration: newExpiration}}, {upsert: false});
    cookie.expiration = newExpiration;
  }
  return cookie;
};

/**
 * Validates email address.
 * @param {string} email
 * @return {boolean}
 * @private
 */
user.validateEmail_ = function(email) {
  return utils.validateRegex(email, user.VALID_EMAIL_REGEX);
};

/**
 * Validates username, allows letters, numbers, and underscores, and no less
 * than 6 characters.
 * @param {string} username
 * @return {boolean}
 * @private
 */
user.validateUsername_ = function(username) {
  return utils.validateRegex(username, user.VALID_USERNAME_REGEX);
};

/**
 * Validates password, allows letters, numbers, and underscores, and no less
 * than 8 characters.
 * @param {string} password
 * @return {boolean}
 * @private
 */
user.validatePassword_ = function(password) {
  return utils.validateRegex(password, user.VALID_PASSWORD_REGEX);
};

/**
 * Authenticates the signed up user.
 * @param {!mongodb.Db} db User information database.
 * @param {Array<!user.Info>} data
 * @param {!user.Info} userInfo User Information.
 * @return {user.Error|undefined}
 * @private
 */
user.signUpUser_ = function(db, data, userInfo) {
  var duplicates = [];
  data.forEach(function(item) {
    if (item.email == userInfo.email) {
      duplicates.push('email: ' + userInfo.email);
    }
    if (item.username == userInfo.username) {
      duplicates.push('username: ' + userInfo.username);
    }
  });
  if (duplicates.length) {
    var errorMessage = duplicates.join(' and ') + ' exist(s)';
    return {
      error: errorMessage
    };
  } else {
    db.collection(user.userInfoDbName).insertOne(userInfo);
    log.serverLog('user information saved');
  }
};

/**
 * Authenticates the signed up user.
 * @param {string} username Username.
 * @param {string} password Password.
 * @param {string=} email Email.
 * @return {boolean}
 */
user.validateUserInfo = function(username, password, email) {
  var invalidItem = [];
  if (!user.validateUsername_(username)) {
    invalidItem.push(username);
  }
  if (!user.validatePassword_(password)) {
    invalidItem.push(password);
  }
  if (email && !user.validateEmail_(email)) {
    invalidItem.push(email);
  }
  if (invalidItem.length) {
    var errorMessage = invalidItem.join(' and ') + ' is(are) invalid';
    log.serverLog(errorMessage);
    return false;
  } else {
    return true;
  }
};
