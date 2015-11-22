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
  readBed: function(bedFile) {
    rl.createInterface({
      input: fs.createReadStream(bedFile),
      terminal: false
    });
    var data = [];
    rl.on('line', function(line) {
      var parts = line.split('\t');
      data.push({
        chrStart: parseInt(parts[0]),
        chrEnd: parseInt(parts[1])
      })
    });
    return data;
  }

};
