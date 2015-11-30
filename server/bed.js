/**
 * @fileoverview Bed data process
 */

'use strict';

var rl = require('readline');
var fs = require('fs');

module.exports = {

  /**
   * Reads a separated bed file for one chromosome.
   * @param {string} bedFile Path to the bed file.
   * @returns {Array} Contains the intervals of bed data.
   */
  readBed: function(bedFile, xl, xr) {
    rl.createInterface({
      input: fs.createReadStream(bedFile),
      terminal: false
    });
    var data = [];
    rl.on('line', function(line) {
      var parts = line.split('\t');
      var xLeft = parseInt(parts[0]);
      var xRight = parseInt(parts[1]);
      if (xLeft > xr || xRight < xl) {
        return;
      }
      data.push({
        chrStart: xLeft,
        chrEnd: xRight,
        name: parts[2]
      })
    });
    return data;
  }

};
