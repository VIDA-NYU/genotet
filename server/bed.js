/**
 * @fileoverview Bed data processing script.
 */

'use strict';

var fs = require('fs');

/** @const */
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
      if (xl > xRight || xr < xLeft) {
        return;
      }
      data.push({
        chrStart: xLeft,
        chrEnd: xRight,
        label: parts[2]
      });
    });
    return data;
  },

  /**
   * Get list of bed data
   * @param {string} bedPath Path to the bed data
   * @return {Array} Contains the name and description of bed data
   */
  listBed: function(bedPath) {
    var folder = bedPath;
    var ret = [];
    var files = fs.readdirSync(folder);
    files.forEach(function(file) {
      if (file.indexOf('.txt') != -1) {
        var fname = file.substr(0, file.length - 4);
        var content = fs.readFileSync(folder + file, 'utf8')
          .toString().split('\n');
        var bedName = content[0];
        var description = '';
        for (var i = 1; i < content.length; i++) {
          description += content[i];
          if (i != content.length - 1) {
            description += '\n';
          }
        }
        ret.push({
          bedName: bedName,
          fileName: fname,
          description: description
        });
      }
    });
    return ret;
  }
};
