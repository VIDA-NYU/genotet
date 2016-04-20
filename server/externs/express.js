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

/** @type {?} */
express.Request.prototype.session;

/** @type {string} */
express.Request.prototype.url;

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
 * @param {*} data
 */
express.Response.prototype.jsonp = function(data) {};

/**
 * @param {number} data
 */
express.Response.prototype.status = function(data) {};

/**
 * @type {function()}
 */
express.Next = function() {};

/**
 * @constructor
 * @return {!express.Error}
 */
express.Error = function() {};

/** @type{?} */
express.Error.prototype.stack;

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
 * @param {*=} data
 * @param {function(!express.Request, !express.Response)=} callback
 */
express.prototype.post = function(url, data, callback) {};

/**
 * @typedef {function(
 *   !express.Request,
 *   !express.Response,
 *   function()=)}
 */
express.Callback;

/**
 * @typedef {function((
 *   !express.Error,
 *   !express.Request,
 *   !express.Response,
 *   function()))}
 */
express.ErrorCallback;

/**
 * @param {string|!Array<string>|express.ErrorCallback|express.Callback} arg1
 * @param {express.Callback=} arg2
 */
express.prototype.use = function(arg1, arg2) {};
