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

  if (!Cookies.get('expiration') ||
    new Date().getTime() >= Cookies.get('expiration')) {
    genotet.menu.displaySignInterface();
    return;
  }

  var userInfo = {
    type: 'auto-sign-in',
    username: Cookies.get('username'),
    sessionId: Cookies.get('sessionId'),
    expiration: Cookies.get('expiration')
  };

  request.post({
    url: genotet.data.userUrl,
    params: userInfo,
    done: function(data) {
      genotet.menu.displaySignedUser(userInfo.username);
      genotet.user.info = {
        username: data.username,
        sessionId: data.sessionId,
        expiration: data.expiration
      };
      genotet.success('signed in');
    },
    fail: function() {
      genotet.menu.displaySignInterface();
    }
  });
};

/**
 * Log out for signed user.
 */
genotet.user.logOut = function() {
  genotet.user.info = {
    username: 'anonymous',
    sessionId: '',
    expiration: ''
  };
  genotet.menu.displaySignInterface();
  genotet.success('logged out');
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
