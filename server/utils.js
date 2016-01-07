/**
 * @fileoverview Server utility functions.
 */

var fs = require('fs');
var buffer = require('buffer');

/** @type {utils} */
module.exports = utils;

/**
 * @constructor
 */
function utils() {}

/** @const {number} */
utils.RANGE_TOLERANCE = .001;

/**
 * Checks whether two ranges intersect.
 * @param {!Array<number>} range1 The first range.
 * @param {!Array<number>} range2 The second range.
 * @return {boolean}
 */
utils.rangeIntersect = function(range1, range2) {
  return range1[0] < range2[1] - utils.RANGE_TOLERANCE &&
    range1[1] > range2[0] + utils.RANGE_TOLERANCE;
};

/**
 * Binary searches on the segs array for the position of value x.
 * @param {Array<Object>} segs Array of elements.
 *     Each element shall have an attribute named x.
 * @param {number} x Value to be searched for.
 * @return {number} Index of the array corresponding to x's position.
 */
utils.binarySearch = function(segs, x) {
  var ll = 0, rr = segs.length - 1;
  while (ll <= rr) {
    var m = (ll + rr) >> 1;
    if (segs[m].x > x)
      rr = m - 1;
    else
      ll = m + 1;
  }
  if (rr == segs.length) {
    return -1; // not found
  }
  return rr;
};

/**
 * Reads the file into a file buffer.
 * @param {string} file Name of the file.
 * @return {Buffer} Node.js file buffer.
 */
utils.readFileToBuf = function(file) {
  if (fs.existsSync(file) == false) {
    return null;
  }
  var stats = fs.statSync(file);
  var numBytes = stats.size;
  var buf = new buffer.Buffer(numBytes);
  var fd = fs.openSync(file, 'r');
  fs.readSync(fd, buf, 0, numBytes, 0);
  return buf;
};

/**
 * Replace special character values in URL by their original characters,
 * '+' and '?'.
 * @param {string} url The URL string to be decoded.
 * @return {string} The new URL with all special values replaced by the
 *     original characters.
 */
utils.decodeSpecialChar = function(url) {
  url = url.replace(/%2B/g, '+');
  url = url.replace(/%3F/g, '?');
  return url;
};
