/**
 * @fileoverview Provides testing data.
 */

var fs = require('fs');
var path = require('path');

var dataPath = path.resolve(__dirname, '../data');

/** @const */
module.exports = {
  /**
   * Gets a given data file.
   * @param {string} type Type of the data file.
   * @param {name} name Name of the data file.
   * @return {{
   *   stream: !fs.ReadStream,
   *   size: number
   * }}
   */
  getFile: function(type, name) {
    var filePath = dataPath + '/' + type + '/' + name;
    return {
      stream: fs.createReadStream(filePath),
      size: fs.statSync(filePath).size
    };
  }
};
