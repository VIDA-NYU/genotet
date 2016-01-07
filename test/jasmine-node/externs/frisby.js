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
 * @param {number} status
 * @return {!frisby}
 */
frisby.prototype.expectStatus = function(status) {};

frisby.prototype.toss = function() {};
