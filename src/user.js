/**
 * @fileoverview Genotet user.
 */

'use strict';

/** @const */
genotet.user = {};

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
  if (!document.cookie ||
    new Date().getTime() >= Cookies.get('expiration')) {
    return;
  }

  var userInfo = {
    type: 'sign-in',
    username: Cookies.get('username'),
    password: Cookies.get('password')
  };

  $.ajax({
    url: genotet.data.userURL,
    type: 'POST',
    data: userInfo,
    dataType: 'json'
  }).done(function(data) {
    genotet.menu.displaySignedUser(userInfo.username);
    genotet.data.userInfo = {
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
  Object.keys(cookie).forEach(function(item) {
    Cookies.set(item, cookie[item], {path: '/genotet'});
  });
};

/**
 * Log out for signed user.
 */
genotet.user.logOut = function() {
  genotet.data.userInfo = {
    username: 'anonymous',
    sessionId: '',
    expiration: ''
  };
  genotet.menu.displaySignInterface();
  genotet.success('logged out');
};
