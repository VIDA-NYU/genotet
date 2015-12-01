/**
 * @fileoverview Bed data process
 */

'use strict';

var fs = require('fs');

module.exports = {

  /**
   * Reads a separated bed file for one chromosome.
   * @param {string} bedFile Path to the bed file.
   * @returns {Array} Contains the intervals of bed data.
   */
  readBed: function(bedFile, xl, xr) {
    var data = [];
    var lines = fs.readFileSync(bedFile).toString().split('\n');
    for (var lineNum in lines) {
      var line = lines[lineNum];
      var parts = line.split('\t');
      var xLeft = parseInt(parts[0]);
      var xRight = parseInt(parts[1]);
      if (xLeft > xr || xRight < xl) {
        continue;
      }
      data.push({
        chrStart: xLeft,
        chrEnd: xRight,
        name: parts[2]
      })
    }
    return data;
  }

};
