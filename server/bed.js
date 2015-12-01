/**
 * @fileoverview Bed data processing script.
 */

'use strict';

var fs = require('fs');

module.exports = {
  /**
   * Reads a separated bed file for one chromosome.
   * @param {string} bedFile Path to the bed file.
   * @param {number} xl Left coordinate of the query range.
   * @param {number} xr Right coordinate of the query range.
   * @return {Array} Contains the intervals of bed data.
   */
  readBed: function(bedFile, xl, xr) {
    var data = [];
    var lines = fs.readFileSync(bedFile).toString().split('\n');
    lines.forEach(function(line) {
      var parts = line.split('\t');
      var xLeft = parseInt(parts[0]);
      var xRight = parseInt(parts[1]);
      if (xLeft > xr || xRight < xl) {
        return;
      }
      data.push({
        chrStart: xLeft,
        chrEnd: xRight,
        label: parts[2]
      })
    });
    return data;
  }
};
