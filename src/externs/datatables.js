/**
 * @fileoverview DataTables externs.
 */

/**
 * @constructor
 * @return {!DataTables}
 */
function DataTables() {}

/**
 * @typedef {!Array<!Object>}
 */
DataTables.Api;

/**
 * @param {Object=} opt_params
 * @return {!DataTables}
 */
jQuery.prototype.DataTable = function(opt_params) {};

/**
 * @param {Object=} opt_params
 * @return {!DataTables.Api}
 */
DataTables.prototype.rows = function(opt_params) {};

/**
 * @param {number} params
 * @return {!DataTables.Api}
 */
DataTables.prototype.button = function(params) {};

/**
 * @param {Object=} opt_params
 */
DataTables.Api.prototype.invalidate = function(opt_params) {};

/**
 * @param {Object=} opt_params
 * @return {!DataTables.Api}
 */
DataTables.Api.prototype.data = function(opt_params) {};

/**
 * @param {boolean=} opt_params
 */
DataTables.Api.prototype.enable = function(opt_params) {};

/**
 * @param {boolean=} opt_params
 */
DataTables.Api.prototype.disable = function(opt_params) {};
