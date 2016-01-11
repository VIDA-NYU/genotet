/**
 * @fileoverview Provides floating point comparison.
 */

/** @type float */
module.exports = float;

/**
 * @constructor
 */
function float() {}

/**
 * @const {number}
 * @private
 */
float.TOLERANCE_ = 1E-9;

/**
 * Checks equality of two floats.
 * @param {number} a
 * @param {number} b
 * @param {number=} opt_tolerance
 * @this {float}
 */
float.equal = function(a, b, opt_tolerance) {
  var tolerance = opt_tolerance != null ? opt_tolerance : float.TOLERANCE_;
  expect(a).toBeGreaterThan(b - tolerance);
  expect(a).toBeLessThan(b + tolerance);
};

