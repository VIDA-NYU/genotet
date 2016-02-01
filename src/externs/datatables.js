/**
 * @fileoverview DataTables externs.
 */

/**
 * @constructor
 * @return {!DataTables}
 */
function DataTables() {}

/**
 * @constructor
 * @return {!DataTables.Api}
 */
DataTables.Api = function() {};

/**
 * @param {Object=} opt_params
 */
jQuery.prototype.DataTable = function(opt_params) {};

/**
 * @param {Object=} opt_params
 * @return {DataTables.Api}
 */
DataTables.prototype.rows = function(opt_params) {};

/**
 * @param {Object=} opt_params
 * @return {DataTables.Api}
 */
DataTables.prototype.invalidate = function(opt_params) {};
