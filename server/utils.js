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

/** @const {number} */
utils.RANDOM_STRING_RADIX = 36;

/** @const {number} */
utils.RANDOM_STRING_START_INDEX = 2;

/** @const {number} */
utils.RANDOM_STRING_LENGTH = 16;

/**
 * @typedef {{
 *   error: string
 * }}
 */
utils.Error;

/**
 * @typedef {{
 *   error: string
 * }|string}
 */
utils.ErrorCaptureCallback;

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
 * Replaces special character values in URL by their original characters,
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

/**
 * Generates session ID.
 * @return {string} Session ID.
 */
utils.randomString = function() {
  return Math.random().toString(utils.RANDOM_STRING_RADIX)
    .substr(utils.RANDOM_STRING_START_INDEX, utils.RANDOM_STRING_LENGTH);
};

/**
 * Validates a string with a regex.
 * @param {string} str
 * @param {RegExp} regex
 * @return {boolean}
 */
utils.validateRegex = function(str, regex) {
  return regex.test(str);
};

/**
 * Checks if a file belongs to the shared user.
 * @param {{
 *   dataPath: string,
 *   typePrefix: string,
 *   fileName: string,
 *   username: string,
 *   shared: string
 * }} options
 * @return {{path: string, exists: boolean}}
 */
utils.getFilePath = function(options) {
  var path = options.dataPath + options.username + '/' +
    options.typePrefix + options.fileName;
  if (!fs.existsSync(path)) {
    var pathShared = options.dataPath + options.shared + '/' +
      options.typePrefix + options.fileName;
    if (!fs.existsSync(pathShared)) {
      // file does not exist under username/ or shared/.
      return {
        path: path,
        exists: false
      };
    } else {
      // file does not exist under username/ but exists under shared/.
      return {
        path: pathShared,
        exists: true
      };
    }
  }
  return {
    path: path,
    exists: true
  };
};

