/**
 * @fileoverview Node.js HTTPS externs.
 */

/** @const */
var https = {};

/**
 * @constructor
 */
https.Server = function() {};

/**
 * @typedef {{
 *   host: (string|undefined),
 *   hostname: (string|undefined),
 *   port: (number|undefined),
 *   method: (string|undefined),
 *   path: (string|undefined),
 *   headers: (Object|undefined),
 *   auth: (string|undefined),
 *   agent: (https.Agent|boolean|undefined),
 *   pfx: (string|Buffer|undefined),
 *   key: (string|Buffer|undefined),
 *   passphrase: (string|undefined),
 *   cert: (string|Buffer|undefined),
 *   ca: (Array<string>|undefined),
 *   ciphers: (string|undefined),
 *   rejectUnauthorized: (boolean|undefined)
 * }}
 */
https.ConnectOptions;

/**
 * @param {https.ConnectOptions} options
 * @param {*=} requestListener
 * @return {!https.Server}
 */
https.createServer = function(options, requestListener) {};

/**
 * @param {...*} var_args
 */
https.Server.prototype.listen = function(var_args) {};

/**
 * @param {number} time
 */
https.Server.prototype.setTimeout = function(time) {};

/**
 * @constructor
 */
https.Agent = function() {};
