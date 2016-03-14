/**
 * @fileoverview Genotet user.
 */

'use strict';

/** @const */
genotet.user = {};

/**
 * Initializes the user auth.
 */
genotet.user.init = function() {
  if (!document.cookie ||
    new Date().getTime() >= genotet.user.getCookie('expireDate')) {
    return;
  }
  genotet.user.updateCookieToBrowser({
    username: genotet.user.getCookie('username'),
    sessionID: genotet.user.getCookie('sessionID'),
    expireDate: new Date().getTime() + 24 * 60 * 1000
  });
};

/**
 * Update the cookie to browser.
 * @param {Object} cookie New cookie.
 */
genotet.user.updateCookieToBrowser = function(cookie) {
  var newCookie = '';
  Object.keys(cookie).forEach(function(item) {
    newCookie += item + '=' + cookie[item] + ';';
  });
  document.cookie = newCookie.slice(0, -1);
};

/**
 * Get cookie value by item.
 * @param {string} cname Item of cookie.
 */
genotet.user.getCookie = function(cname) {
  var name = cname + '=';
  var ca = document.cookie.split(';');
  for(var i = 0; i < ca.length; i++) {
    var c = ca[i];
    while (c.charAt(0)==' ') c = c.substring(1);
    if (c.indexOf(name) == 0) return c.substring(name.length, c.length);
  }
  return '';
};