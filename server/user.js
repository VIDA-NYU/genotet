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
user.USER_INFO_COLLECTION = 'userInfo';

/**
 * Database name of session.
 * @const {string}
 */
user.SESSION_COLLECTION = 'session';

/**
 * Expire time of cookie.
 * @const {number}
 */
user.COOKIE_EXPIRE_TIME = 24 * 60 * 60 * 1000;

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
 *   username: string,
 *   password: string,
 *   email: string,
 *   confirmed: boolean,
 *   sessionId: string
 * }}
 */
user.Info;

/**
 * @typedef {{
 *   username: string,
 *   password: string,
 *   email: string,
 *   sessionId: string
 * }}
 */
user.SignUp;

/**
 * @typedef {{
 *   username: string,
 *   password: string,
 *   sessionId: string
 * }}
 */
user.SignIn;

/**
 * @typedef {{
 *   sessionId: string
 * }}
 */
user.AutoSignIn;

/**
 * @typedef {{
 *   sessionId: string
 * }}
 */
user.LogOut;

/**
 * @typedef {{
 *   username: string,
 *   sessionId: string,
 *   expiration: number
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
 * @param {*|user.SignIn} query
 * @param {function((user.Error|user.Cookie))} callback Callback function.
 */
user.query.signIn = function(query, callback) {
  if (query.username === undefined) {
    callback({error: 'username is undefined'});
    return;
  }
  if (query.password === undefined) {
    callback({error: 'password is undefined'});
    return;
  }
  user.signIn({
    username: query.username,
    password: CryptoJS.SHA256(query.password).toString(),
    sessionId: query.sessionId
  }, function(data) {
    callback(data);
  });
};

/**
 * @param {*|user.SignUp} query
 * @param {function((user.Error|user.Cookie))} callback Callback function.
 */
user.query.signUp = function(query, callback) {
  if (query.username === undefined) {
    callback({error: 'username is undefined'});
    return;
  }
  if (query.email === undefined) {
    callback({error: 'email is undefined'});
    return;
  }
  if (query.password === undefined) {
    callback({error: 'password is undefined'});
    return;
  }
  var validateResult = user.validateUserInfo(query.username,
    query.password, query.email);
  if (validateResult && validateResult.error) {
    log.serverLog('cannot sign up user:', validateResult.error);
    callback({error: validateResult.error});
    return;
  }
  user.signUp({
    username: query.username,
    email: query.email,
    password: CryptoJS.SHA256(query.password).toString(),
    confirmed: query.confirmed,
    sessionId: query.sessionId
  }, function(data) {
    callback(data);
  });
};

/**
 * @param {*|user.AutoSignIn} query
 * @param {function((user.Error|user.Cookie))} callback Callback function.
 */
user.query.autoSignIn = function(query, callback) {
  user.findSession(query.sessionId, function(result) {
    callback(/** @type {user.Error|user.Cookie} */(result));
  });
};

/**
 * @param {*|user.LogOut} query
 * @param {function((user.Error|!Object))} callback Callback function.
 */
user.query.logOut = function(query, callback) {
  var db = database.db;
  db.collection(user.SESSION_COLLECTION).deleteMany(
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
 * @param {user.Info} userInfo User Information.
 * @param {function((user.Error|user.Cookie))} callback Callback function.
 */
user.signUp = function(userInfo, callback) {
  var db = database.db;
  var cursor = db.collection(user.USER_INFO_COLLECTION).find({
    $or: [
      {username: userInfo.username},
      {email: userInfo.email}
    ]
  }).limit(1);
  cursor.toArray(function(err, docs) {
    if (err) {
      log.serverLog(err.message);
      callback({error: err.message});
      return;
    }
    if (docs.length) {
      var doc = docs[0];
      if (doc.username == userInfo.username) {
        callback({error: 'username exists'});
      } else if (doc.email == userInfo.email) {
        callback({error: 'email exists'});
      }
      return;
    }
    db.collection(user.USER_INFO_COLLECTION).insertOne(userInfo);
    log.serverLog('user information saved');
    callback(user.updateSession({
      username: userInfo.username,
      sessionId: userInfo.sessionId,
      expiration: 0
    }));
  });
};

/**
 * Checks the user information for signing in.
 * @param {{
 *   username: string,
 *   password: string,
 *   sessionId: string
 * }} userInfo User Information.
 * @param {function((user.Error|user.Cookie))} callback Callback function.
 */
user.signIn = function(userInfo, callback) {
  var db = database.db;
  var query = {
    $and: [
      {username: userInfo.username},
      {password: userInfo.password}
    ]
  };
  database.getOne(db.collection(user.USER_INFO_COLLECTION), query,
    function(result) {
      if (result && result.error) { // getOne errors
        callback(/** @type {user.Error} */(result));
        return;
      }
      if (result === null) {
        callback({error: 'incorrect username or password'});
        return;
      }
      // success and proceed
      callback(user.updateSession({
        username: userInfo.username,
        sessionId: userInfo.sessionId,
        expiration: 0
      }));
    });
};

/**
 * Checks the user session information for auto signing in.
 * @param {user.Cookie} cookie User cookie information.
 * @param {function((user.Error|user.Cookie))} callback Callback function.
 */
user.autoSignIn = function(cookie, callback) {
  var db = database.db;
  var query = {
    $and: [
      {sessionId: cookie.sessionId},
      {expiration: {$gt: new Date().getTime()}}
    ]
  };
  database.getOne(db.collection(user.SESSION_COLLECTION), query,
    function(result) {
      if (result && result.error) { // getOne errors
        callback(/** @type {user.Error} */(result));
        return;
      }
      if (result === null) {
        callback({error: 'invalid session information'});
        return;
      }
      callback(user.updateSession(cookie));
    });
};

/**
 * Finds user session info from database corresponding to sessionId.
 * @param {string} sessionId The session ID of the user.
 * @param {function((user.Error|user.Cookie))} callback Callback function.
 */
user.findSession = function(sessionId, callback) {
  var db = database.db;
  var query = {
    sessionId: sessionId
  };
  database.getOne(db.collection(user.SESSION_COLLECTION), query,
    function(result) {
      if (result && result.error) {
        callback(/** @type {user.Error} */(result));
        return;
      }
      if (result === null) {
        callback({
          username: 'anonymous',
          sessionId: '',
          expiration: 0
        });
        return;
      }
      callback(/** @type {user.Cookie} */(result));
    });
};

/**
 * Updates session ID from database. Regenerates if it is expired.
 * @param {user.Cookie} cookie User cookie information.
 * @return {user.Cookie} cookie Updated user cookie information.
 */
user.updateSession = function(cookie) {
  var db = database.db;
  cookie.expiration = new Date().getTime() + user.COOKIE_EXPIRE_TIME;
  db.collection(user.SESSION_COLLECTION).updateOne(
    {username: cookie.username},
    cookie,
    {upsert: true}
  );
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
 * @param {string} username Username.
 * @param {string} password Password.
 * @param {string=} email Email.
 * @return {user.Error|undefined}
 */
user.validateUserInfo = function(username, password, email) {
  var invalidItem = [];
  if (!user.validateUsername_(username)) {
    invalidItem.push('username');
  }
  if (!user.validatePassword_(password)) {
    invalidItem.push('password');
  }
  if (email && !user.validateEmail_(email)) {
    invalidItem.push('email');
  }
  if (invalidItem.length) {
    var errorMessage = 'invalid ' + invalidItem.join(', ');
    return {error: errorMessage};
  }
};
