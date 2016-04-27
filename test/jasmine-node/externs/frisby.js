/**
 * @fileoverview Frisby externs.
 */

/**
 * @constructor
 */
function frisby() {}

/**
 * @param {string} name
 * @return {!frisby}
 */
frisby.create = function(name) {};

/**
 * @param {{
 *   timeout: (number|undefined),
 *   request: {
 *     rejectUnauthorized: (boolean|undefined)
 *   }
 * }} arg
 */
frisby.globalSetup = function(arg) {};

/**
 * @param {Function} callback
 * @return {!frisby}
 */
frisby.prototype.after = function(callback) {};

/**
 * @param {string} url
 * @param {*} data
 * @param {Object=} options
 */
frisby.prototype.post = function(url, data, options) {};

/**
 * @param {string} url
 * @param {Object=} options
 */
frisby.prototype.get = function(url, options) {};

/**
 * @param {number} status
 * @return {!frisby}
 */
frisby.prototype.expectStatus = function(status) {};


frisby.prototype.toss = function() {};
