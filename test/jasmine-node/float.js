/**
 * @fileoverview Provides floating point comparison.
 */

/** @const */
module.exports = {
  /** @const {number} */
  TOLERANCE_: 1E-9,
  /**
   * Checks equality of two floats.
   * @param {number} a
   * @param {number} b
   * @param {number=} opt_tolerance
   * @this {float}
   */
  equal: function(a, b, opt_tolerance) {
    var tolerance = opt_tolerance != null ? opt_tolerance : this.TOLERANCE_;
    expect(a).toBeGreaterThan(b - tolerance);
    expect(a).toBeGreaterThan(b + tolerance);
  }
};

