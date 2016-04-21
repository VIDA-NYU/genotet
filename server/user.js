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
  SIGNIN: 'sign-in',
  AUTOSIGNIN: 'auto-sign-in',
  LOGOUT: 'log-out'
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

// End Public APIs

/**
 * @typedef {{
 *   email: (string|undefined),
 *   username: string,
 *   password: string,
 *   confirmed: (boolean|undefined),
 *   sessionId: string
 * }}
 */
user.Info;

/**
 * @typedef {{
 *   username: (string|undefined)
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
 * @param {function((!user.Error|!user.Cookie))} callback Callback function.
 */
user.query.signIn = function(query, callback) {
  var userInfo = {
    username: query.username,
    password: CryptoJS.SHA256(query.password).toString(),
    sessionId: query.sessionId
  };
  var validateResult = user.validateUserInfo(userInfo.username,
    userInfo.password);
  if (validateResult && validateResult.error) {
    log.serverLog('cannot sign in user', validateResult.error);
    return;
  }
  user.signIn(userInfo, function(data) {
    callback(data);
  });
};

/**
 * @param {*|!user.Info} query
 * @param {function((!user.Error|!user.Cookie))} callback Callback function.
 */
user.query.signUp = function(query, callback) {
  var userInfo = {
    email: query.email,
    username: query.username,
    password: CryptoJS.SHA256(query.password).toString(),
    confirmed: query.confirmed,
    sessionId: query.sessionId
  };
  var validateResult = user.validateUserInfo(userInfo.username,
    userInfo.password, userInfo.email);
  if (validateResult && validateResult.error) {
    log.serverLog('cannot sign up user', validateResult.error);
    return;
  }
  user.signUp(userInfo, function(data) {
    callback(data);
  });
};

/**
 * @param {*|{
 *   sessionId: string
 * }} query
 * @param {function((user.Error|user.Cookie))} callback Callback function.
 */
user.query.autoSignIn = function(query, callback) {
  user.findUsername(query.sessionId, function(data) {
    if (data.error) {
      callback(/** @type {user.Error} */(data));
    } else {
      callback({username: /** @type {string} */(data)});
    }
  });
};

/**
 * @param {*|!user.Cookie} query
 * @param {function((!user.Error|!user.Cookie))} callback Callback function.
 */
user.query.logOut = function(query, callback) {
  var db = database.db;
  db.collection(user.sessionDbName).deleteMany(
    {sessionId: query.sessionId},
    function(err) {
      if (err) {
        callback({error: err.errorMessage});
      }
      callback({});
    }
  );
};

/**
 * Checks the user information for signing in.
 * @param {!user.Info} userInfo User Information.
 * @param {function((!user.Error|!user.Cookie))} callback Callback function.
 */
user.signUp = function(userInfo, callback) {
  var db = database.db;
  var cursor = db.collection(user.userInfoDbName).find({
    $or: [
      {username: userInfo.username},
      {email: userInfo.email}
    ]
  });
  var documents = [];
  cursor.each(function(err, doc) {
    if (err) {
      log.serverLog(err.message);
      return;
    }
    if (doc != null) {
      delete doc['_id'];
      documents.push(doc);
    } else {
      var data = user.signUpUser_(documents, userInfo);
      if (!data) {
        // success and proceed
        user.USERNAME_ = userInfo.username;
        var cookie = {
          username: userInfo.username
        };
        data = user.updateSession(cookie);
      }
      callback(data);
    }
  });
};

/**
 * Checks the user information for signing in.
 * @param {!user.Info} userInfo User Information.
 * @param {function((!user.Error|!user.Cookie))} callback Callback function.
 */
user.signIn = function(userInfo, callback) {
  var db = database.db;
  var query = {
    $and: [
      {username: userInfo.username},
      {password: userInfo.password}
    ]
  };
  database.getOne(db.collection(user.userInfoDbName), query, [],
    function(result) {
      var data;
      if (!result) {
        callback({error: 'incorrect username or password'});
        return;
      }
      // success and proceed
      user.USERNAME_ = userInfo.username;
      var cookie = {
        username: userInfo.username,
        sessionId: userInfo.sessionId
      };
      data = user.updateSession(cookie);
      callback(data);
    });
};

/**
 * Checks the user session information for auto signing in.
 * @param {!user.Cookie} cookie User cookie information.
 * @param {function((!user.Error|!user.Cookie))} callback Callback function.
 */
user.autoSignIn = function(cookie, callback) {
  var db = database.db;
  var query = {
    $and: [
      {sessionId: cookie.sessionId},
      {expiration: {$gt: new Date().getTime()}}
    ]
  };
  database.getOne(db.collection(user.sessionDbName), query, [],
    function(result) {
      var data;
      if (!result) {
        callback({error: 'invalid session information'});
        return;
      }
      data = user.updateSession(cookie);
      callback(data);
    });
};

/**
 * Finds username from database corresponding to sessionId.
 * @param {string} sessionId The seesion ID of the user.
 * @param {function((user.Error|string))} callback Callback function.
 */
user.findUsername = function(sessionId, callback) {
  var db = database.db;
  var query = {
    sessionId: sessionId
  };
  database.getOne(db.collection(user.sessionDbName), query, [],
    function(result) {
      var data;
      if (!result) {
        callback({error: 'no user info find.'});
        return;
      }
      data = result.username;
      callback(data);
    });
};

/**
 * Updates session ID from database. Regenerate if it is expired.
 * @param {!user.Cookie} cookie User cookie information.
 * @return {!user.Cookie} cookie Updated user cookie information.
 */
user.updateSession = function(cookie) {
  var db = database.db;
  cookie.expiration = new Date().getTime() + user.cookieExpireTime;
  db.collection(user.sessionDbName).insertOne(cookie);
  return cookie;
};

/**
 * Authenticates the signed up user.
 * @param {Array<!user.Info>} data
 * @param {!user.Info} userInfo User Information.
 * @return {user.Error|undefined}
 * @private
 */
user.signUpUser_ = function(data, userInfo) {
  var db = database.db;
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
    return {error: errorMessage};
  } else {
    db.collection(user.userInfoDbName).insertOne(userInfo);
    log.serverLog('user information saved');
  }
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
 * @param {string} username Username.
 * @param {string} password Password.
 * @param {string=} email Email.
 * @return {user.Error|undefined}
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
    var errorMessage = 'invalid ' + invalidItem.join(' and ');
    return {error: errorMessage};
  }
};
