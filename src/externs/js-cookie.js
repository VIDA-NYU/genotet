/**
 * @fileoverview js-cookie library extern.
 */

/**
 * @constructor
 * @return {!Cookies}
 */
var Cookies;

/**
 * @param {string=} name
 *  * @param {{
 *   path: (string|undefined)
 * }=} opt_params
 */
Cookies.get = function(name, opt_params) {};

/**
 * @param {string} name
 * @param {string} value
 * @param {{
 *   path: (string|undefined)
 * }=} opt_params
 */
Cookies.set = function(name, value, opt_params) {};

/**
 * @param {string} name
 * @param {{
 *   path: (string|undefined)
 * }=} opt_params
 */
Cookies.remove = function(name, opt_params) {};
