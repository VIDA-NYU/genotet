/**
 * @fileoverview Node.js express externs.
 */

/**
 * @constructor
 * @param {Object=} params
 * @return {!express}
 */
function express(params) {}

/**
 * @constructor
 * @return {!express.Request}
 */
express.Request = function() {};

/** @type {?} */
express.Request.prototype.query;

/** @type {?} */
express.Request.prototype.body;

/** @type {?} */
express.Request.prototype.file;

/**
 * @constructor
 * @return {!express.Response}
 */
express.Response = function() {};

/**
 * @param {string} prop
 * @param {string} val
 */
express.Response.prototype.header = function(prop, val) {};

/**
 * @param {*} data
 */
express.Response.prototype.json = function(data) {};

/**
 * @param {number} data
 */
express.Response.prototype.status = function(data) {};

/**
 * @param {Object|string} msg
 * @param {number=} code
 */
express.Response.prototype.send = function(msg, code) {};

/**
 * @param {number} port
 */
express.prototype.listen = function(port) {};

/**
 * @param {string} url
 * @param {function(!express.Request, !express.Response)} callback
 */
express.prototype.get = function(url, callback) {};

/**
 * @param {string} url
 * @param {*} data
 * @param {function(!express.Request, !express.Response)} callback
 */
express.prototype.post = function(url, data, callback) {};
