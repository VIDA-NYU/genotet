/**
 * @fileoverview Externs for form-data.
 *
 * Declarations here are slightly different from externs.zip/browser/w3c_xml.js,
 * which is named under FormData.
 * Thie file contains externs for custom name formData.
 */

/**
 * @constructor
 */
function formData() {}

/**
 * @param {string} arg1
 * @param {*} arg2
 * @param {Object=} options
 */
formData.prototype.append = function(arg1, arg2, options) {};

/**
 * @return {string}
 */
formData.prototype.getBoundary = function() {};

/**
 * @return {number}
 */
formData.prototype.getLengthSync = function() {};
