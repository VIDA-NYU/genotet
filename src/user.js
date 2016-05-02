/**
 * @fileoverview Genotet user.
 */

'use strict';

/** @const */
genotet.user = {};

/**
 * User information are saved to this URL via http and received via jsonp.
 * @type {Object<{
 *   username: string,
 *   sessionId: string,
 *   expiration: number
 * }>}
 */
genotet.user.info = null;

/** @const {RegExp} */
genotet.user.VALID_EMAIL_REGEX =
  /^([a-zA-Z0-9_\.\-])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/;

/** @const {RegExp} */
genotet.user.VALID_USERNAME_REGEX = /^\w{6,}$/;

/** @const {RegExp} */
genotet.user.VALID_PASSWORD_REGEX = /^\w{8,}$/;

/**
 * @typedef {{
 *   username: (string|undefined),
 *   password: string,
 *   sessionId: (string|undefined),
 *   expiration: (string|undefined)
 * }}
 */
genotet.Cookie;

/**
 * Initializes the user auth.
 */
genotet.user.init = function() {
  genotet.user.info = {
    username: 'anonymous',
    sessionId: '',
    expiration: ''
  };

  if (!Cookies.get('genotet-session')) {
    genotet.menu.displaySignInterface();
    return;
  }
  request.post({
    url: genotet.url.user,
    params: {type: 'auto-sign-in'},
    done: function(data) {
      if (data.error || data.username == 'anonymous') {
        genotet.menu.displaySignInterface();
      } else {
        genotet.menu.displaySignedUser(data.username);
        genotet.user.info = {
          username: data.username
        };
      }
    },
    fail: function() {
      genotet.menu.displaySignInterface();
    }
  });
};

/**
 * Signs in the user.
 * @param {string} username
 * @param {string} password
 * @param {Function=} callback Callback when login completes.
 */
genotet.user.login = function(username, password, callback) {
  request.post({
    url: genotet.url.user,
    params: {
      type: 'sign-in',
      username: username,
      password: password
    },
    done: function(data) {
      genotet.menu.displaySignedUser(username);
      genotet.user.info = {
        username: data.username,
        sessionId: data.sessionId,
        expiration: data.expiration
      };
      genotet.success('signed in');
    },
    fail: function(res) {
      genotet.error(res.responseText);
    },
    always: callback ? function() {
      callback();
    } : undefined
  });
};

/**
 * Logs out for signed-in user.
 */
genotet.user.logOut = function() {
  genotet.user.info = {
    username: 'anonymous',
    sessionId: '',
    expiration: ''
  };
  var params = {
    type: 'log-out'
  };
  request.get({
    url: genotet.url.user,
    params: params,
    done: function() {
      genotet.menu.displaySignInterface();
      genotet.success('logged out');
    },
    fail: function(data) {
      genotet.error(data.error);
    }
  });
};

/**
 * Gets username for the system.
 * @return {string} username Current username for the system.
 */
genotet.user.getUsername = function() {
  return genotet.user.info.username;
};

/**
 * Validates email address.
 * @param {string} email
 * @return {boolean}
 */
genotet.user.validateEmail = function(email) {
  return genotet.utils.validateRegex(email, genotet.user.VALID_EMAIL_REGEX);
};

/**
 * Validates username, allows letters, numbers, and underscores, and no less
 * than 6 characters.
 * @param {string} username
 * @return {boolean}
 */
genotet.user.validateUsername = function(username) {
  return genotet.utils.validateRegex(username,
    genotet.user.VALID_USERNAME_REGEX);
};

/**
 * Validates password, allows letters, numbers, and underscores, and no less
 * than 8 characters.
 * @param {string} password
 * @return {boolean}
 */
genotet.user.validatePassword = function(password) {
  return genotet.utils.validateRegex(password,
    genotet.user.VALID_PASSWORD_REGEX);
};
