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

  var userInfo = {
    type: 'sign-in',
    username: genotet.user.getCookie('username'),
    password: genotet.user.getCookie('password')
  };

  $.ajax({
    url: genotet.data.userURL,
    type: 'POST',
    data: userInfo,
    dataType: 'json'
  }).done(function(data) {
      if (!data.success) {
        genotet.error('failed to signed in', data.message);
      } else if (data.response.success) {
        genotet.menu.displaySignedUser(userInfo.username);
        genotet.data.userInfo = {
          username: data.cookie.username,
          sessionID: data.cookie.sessionID,
          expireDate: data.cookie.expireDate
        };
        genotet.user.updateCookieToBrowser(data.cookie);
        genotet.success('signed in');
      } else {
        genotet.error('wrong username or password');
      }
    })
    .fail(function(res) {
      genotet.error('failed to signed in');
    });
};

/**
 * Update the cookie to browser.
 * @param {Object} cookie New cookie.
 */
genotet.user.updateCookieToBrowser = function(cookie) {
  Object.keys(cookie).forEach(function(item) {
    document.cookie = item + '=' + cookie[item];
  });
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