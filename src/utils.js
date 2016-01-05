/**
 * @fileoverview Utility functions shared within the Genotet.
 */

'use strict';

/** @const */
genotet.utils = {};

/** @enum {number} */
genotet.utils.keyCodes = {
  ENTER: 13
};

/** @const {number} */
genotet.utils.PIXEL_TOLERANCE = .1;

/** @const {number} */
genotet.utils.RANGE_TOLERANCE = .001;

/**
 * Vector type of arbitrary length.
 * @typedef {Array<number>} Vector
 */
genotet.utils.Vector;

/**
 * Vector type of length 2.
 * @typedef {Array<number>} Vector2
 */
genotet.utils.Vector2;

/**
 * Gets the sign of a number.
 * @param {number} x The number to be signed.
 * @return {number} 1 if x is positive, -1 if x is negative,
 *     and 0 if x is zero.
 */
genotet.utils.sign = function(x) {
  if (x == 0) {
    return 0;
  }
  return x > 0 ? 1 : -1;
};

/**
 * Checks whether two ranges intersect.
 * @param {!Array<number>} range1 The first range.
 * @param {!Array<number>} range2 The second range.
 * @return {boolean}
 */
genotet.utils.rangeIntersect = function(range1, range2) {
  return range1[0] < range2[1] - genotet.utils.RANGE_TOLERANCE &&
      range1[1] > range2[0] + genotet.utils.RANGE_TOLERANCE;
};

/**
 * Checks whether two 2D rectangles intersect.
 * @param {{x: number, y: number, w: number, h: number}} rect1
 *     Definition of the first rectangle.
 * @param {{x: number, y: number, w: number, h: number}} rect2
 *     Definition of the second rectangle.
 * @return {boolean} Whether the two rectangles intersect.
 */
genotet.utils.rectIntersect = function(rect1, rect2) {
  var xMin = Math.max(rect1.x, rect2.x);
  var xMax = Math.min(rect1.x + rect1.w, rect2.x + rect2.w);
  var yMin = Math.max(rect1.y, rect2.y);
  var yMax = Math.min(rect1.y + rect1.h, rect2.y + rect2.h);
  return xMin < xMax - genotet.utils.PIXEL_TOLERANCE &&
      yMin < yMax - genotet.utils.PIXEL_TOLERANCE;
};

/**
 * Checks whether a rectangle is inside the screen window.
 * @param {{x: number, y: number, w: number, h: number}} rect
 *     Definition of the rectangle.
 * @return {boolean} Whether the rectangle is inside the screen window.
 */
genotet.utils.rectInsideWindow = function(rect) {
  return rect.x >= -genotet.utils.PIXEL_TOLERANCE &&
      rect.x + rect.w <= $(window).width() + genotet.utils.PIXEL_TOLERANCE &&
      rect.y >= -genotet.utils.PIXEL_TOLERANCE &&
      rect.y + rect.h <= $(window).height() + genotet.utils.PIXEL_TOLERANCE;
};

/**
 * Combines translate and scale into a CSS transform string.
 * @param {genotet.utils.Vector2=} opt_translate Zoom translate.
 * @param {number=} opt_scale Zoom scale.
 * @param {number=} opt_rotate Rotation degree.
 * @return {string} CSS string of the transform.
 */
genotet.utils.getTransform = function(opt_translate, opt_scale, opt_rotate) {
  var result = '';
  if (opt_translate != null) {
    result += 'translate(' + opt_translate + ')';
  }
  if (opt_scale != null) {
    result += 'scale(' + opt_scale + ')';
  }
  if (opt_rotate != null) {
    result += 'rotate(' + opt_rotate + ')';
  }
  return result;
};

/**
 * Gets the middle point of two 2D points.
 * @param {!genotet.utils.Vector2} p1 Point 1.
 * @param {!genotet.utils.Vector2} p2 Point 2.
 * @return {!genotet.utils.Vector2} The middle point.
 */
genotet.utils.middlePoint = function(p1, p2) {
  return [(p1[0] + p2[0]) / 2, (p1[1] + p2[1]) / 2];
};

/**
 * Normalizes a vector.
 * @param {!genotet.utils.Vector2} p
 * @return {!genotet.utils.Vector2}
 */
genotet.utils.normalizeVector = function(p) {
  var len = genotet.utils.vectorLength(p);
  return genotet.utils.multiplyVector(p, 1 / len);
};


/**
 * Gets the mirrored point of p, with respect to the line (lp1, lp2).
 * The distance of the mirrored point will be k times of the distance
 * from p to (lp1, lp2).
 * @param {!genotet.utils.Vector2} p Point to be mirrored.
 * @param {!genotet.utils.Vector2} lp1 Point on the line.
 * @param {!genotet.utils.Vector2} lp2 Another point on the line.
 * @return {!genotet.utils.Vector2} Mirrored point.
 */
genotet.utils.mirrorPoint = function(p, lp1, lp2) {
  var lineVector = genotet.utils.normalizeVector(
    genotet.utils.subtractVector(lp2, lp1));
  var projectedOffset = genotet.utils.dotVector(
    genotet.utils.subtractVector(p, lp1), lineVector);
  var d = genotet.utils.multiplyVector(lineVector, projectedOffset);
  var m = genotet.utils.addVector(lp1, d);
  var offset = genotet.utils.subtractVector(m, p);
  return genotet.utils.addVector(m, offset);
};

/**
 * Gets the dot product of two 2D vectors.
 * @param {!genotet.utils.Vector2} p1 Vector 1.
 * @param {!genotet.utils.Vector2} p2 Vector 2.
 * @return {number} The dot product.
 */
genotet.utils.dotVector = function(p1, p2) {
  return p1[0] * p2[0] + p1[1] * p2[1];
};

/**
 * Rotates a vector by 90 degrees counter-clockwise.
 * @param {!genotet.utils.Vector2} p Input vector.
 * @return {!genotet.utils.Vector2}
 */
genotet.utils.perpendicularVector = function(p) {
  return [p[1], -p[0]];
};

/**
 * Gets the length of a vector.
 * @param {!genotet.utils.Vector2} p Input vector.
 * @return {number}
 */
genotet.utils.vectorLength = function(p) {
  return Math.sqrt(p[0] * p[0] + p[1] * p[1]);
};

/**
 * Compute the distance between two 2D points
 * @param {!genotet.utils.Vector2} p1 Point 1.
 * @param {!genotet.utils.Vector2} p2 Point 2.
 * @return {number}
 */
genotet.utils.vectorDistance = function(p1, p2) {
  return genotet.utils.vectorLength(genotet.utils.subtractVector(p1, p2));
};

/**
 * Adds two 2D vectors.
 * @param {!genotet.utils.Vector2} p1 Vector 1.
 * @param {!genotet.utils.Vector2} p2 Vector 2.
 * @return {!genotet.utils.Vector2}
 */
genotet.utils.addVector = function(p1, p2) {
  return [p1[0] + p2[0], p1[1] + p2[1]];
};

/**
 * Subtracts a 2D vector from another.
 * @param {!genotet.utils.Vector2} p1 Vector 1.
 * @param {!genotet.utils.Vector2} p2 Vector 2.
 * @return {!genotet.utils.Vector2}
 */
genotet.utils.subtractVector = function(p1, p2) {
  return [p1[0] - p2[0], p1[1] - p2[1]];
};

/**
 * Multiply a 2D vector by a constant.
 * @param {!genotet.utils.Vector2} p Input vector.
 * @param {number} k Input constant.
 * @return {!genotet.utils.Vector2}
 */
genotet.utils.multiplyVector = function(p, k) {
  return [p[0] * k, p[1] * k];
};

/**
 * Gets a random color from D3.
 * @return {string} Random color.
 */
genotet.utils.randomColor = function() {
  var colors = /** @type {!Array<string>} */(d3.scale.category20().range());
  var index = Math.floor(Math.random() * colors.length);
  return colors[index];
};

/**
 * Hashes a string.
 * @param {string} s
 * @return {number} Hash value between [0, 1000000007), or -1 on error.
 */
genotet.utils.hashString = function(s) {
  if (typeof s != 'string') {
    genotet.error('x is not a string to hash');
    return -1;
  }
  var a = 3, p = 1000000007;
  var result = 0;
  for (var i = 0; i < s.length; i++) {
    var x = s.charCodeAt(i);
    result = (result * a + x) % p;
  }
  return result;
};

/**
 * Encodes special character by their URL form.
 * @param {string} s
 * @return {string}
 */
genotet.utils.encodeSpecialChar = function(s) {
  s = s.replace(/\+/g, '%2B');
  s = s.replace(/\?/g, '%3F');
  return s;
};

/**
 * Swaps the elements at index i and j of an array.
 * @param {!Array<*>} arr Array.
 * @param {number} i Element index.
 * @param {number} j Element index.
 */
genotet.utils.swap = function(arr, i, j) {
  var tmp = arr[i];
  arr[i] = arr[j];
  arr[j] = tmp;
};

/**
 * Makes 'child' class inherit 'base' class.
 * @param {Function} child
 * @param {Function} base
 */
genotet.utils.inherit = function(child, base) {
  child.prototype = Object.create(base.prototype);
  child.prototype.constructor = child;
  child.base = base.prototype;
};
