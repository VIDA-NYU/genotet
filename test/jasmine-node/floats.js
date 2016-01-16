/**
 * @fileoverview Provides floating point comparison.
 */

/** @type floats */
module.exports = floats;

/**
 * @constructor
 */
function floats() {}

/**
 * @private @const {number}
 */
floats.TOLERANCE_ = 1E-9;

/**
 * Checks equality of two floats.
 * @param {number} a
 * @param {number} b
 * @param {number=} opt_tolerance
 */
floats.equal = function(a, b, opt_tolerance) {
  var tolerance = opt_tolerance != null ? opt_tolerance : floats.TOLERANCE_;
  expect(a).toBeGreaterThan(b - tolerance);
  expect(a).toBeLessThan(b + tolerance);
};

