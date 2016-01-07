/**
 * @fileoverview QUnit externs.
 */

/**
 * @constructor
 * @return {!QUnit}
 */
function QUnit() {}

/**
 * @param {string} name
 */
QUnit.module = function(name) {};

/**
 * @param {string} name
 * @param {Function} process
 */
QUnit.test = function(name, process) {};

/**
 * @constructor
 * @return {!QUnit.assert}
 */
QUnit.assert = function() {};

QUnit.assert.prototype.async = function() {};

/**
 * @param {number} arg
 */
QUnit.assert.prototype.expect = function(arg) {};

/**
 * @param {T} arg1
 * @param {T} arg2
 * @param {string=} msg
 * @template T
 */
QUnit.assert.prototype.equal = function(arg1, arg2, msg) {};

/**
 * @param {boolean} arg
 * @param {string=} msg
 */
QUnit.assert.prototype.notOk = function(arg, msg) {};
