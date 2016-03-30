/**
 * @fileoverview User info handler.
 */

/** @type {user} */
module.exports = user;

/**
 * @constructor
 */
function user() {}

/**
 * Gets current username.
 * @return {string} The username.
 */
user.getUsername = function() {
  return user.USERNAME_;
};

// End Public APIs

/**
 * @private @type {string}
 */
user.USERNAME_ = 'anonymous';
