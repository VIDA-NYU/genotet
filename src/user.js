/**
 * @fileoverview Genotet user.
 */

'use strict';

/** @const */
genotet.user = {};

/**
 * User information are saved to this URL via http and received via jsonp.
 * @type {!Object<{
 *   username: string,
 *   sessionId: string,
 *   expiration: number
 * }>}
 */
genotet.user.info;

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
    type: 'sign-in',
    username: Cookies.get('username'),
    password: Cookies.get('password')
  };

  $.post(genotet.data.userUrl, userInfo, 'json')
    .done(function(data) {
      genotet.menu.displaySignedUser(userInfo.username);
      genotet.user.info = {
        username: data.cookie.username,
        sessionId: data.cookie.sessionId,
        expiration: data.cookie.expiration
      };
      genotet.user.updateCookieToBrowser(data.cookie);
      genotet.success('signed in');
    });
};

/**
 * Updates the cookie to browser.
 * @param {!genotet.Cookie} cookie New cookie.
 */
genotet.user.updateCookieToBrowser = function(cookie) {
  for (var key in cookie) {
    var value = cookie[key];
    Cookies.set(key, value, {path: '/genotet'});
  }
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
