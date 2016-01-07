/**
 * @fileoverview Provides testing data.
 */

var fs = require('fs');
var path = require('path');

/** @type {data} */
module.exports = data;

/** @type {string} */
var dataPath = path.resolve(__dirname, '../data');

/**
 * @constructor
 */
function data() {}

/**
 * Gets a given data file.
 * @param {string} type Type of the data file.
 * @param {string} name Name of the data file.
 * @return {{
 *   stream: fs.ReadStream,
 *   size: number
 * }}
 */
data.getFile = function(type, name) {
  var filePath = dataPath + '/' + type + '/' + name;
  return {
    stream: fs.createReadStream(filePath),
    size: fs.statSync(filePath).size
  };
};
