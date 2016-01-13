/**
 * @fileoverview Bed data processing script.
 */

var fs = require('fs');

/** @type {bed} */
module.exports = bed;

/**
 * @constructor
 */
function bed() {}

/**
 * @typedef {{
 *   chrStart: number,
 *   chrEnd: number,
 *   label: string
 * }}
 */
bed.Motif;

/** @const */
bed.query = {};

/**
 * @typedef {{
 *   bedName: string,
 *   chr: string,
 *   xl: (number|undefined),
 *   xr: (number|undefined)
 * }}
 */
bed.query.Motifs;

// Start public APIs
/**
 * @param {!bed.query.Motifs} query
 * @param {string} bedPath
 * @return {!Array<!bed.Motif>}
 */
bed.query.motifs = function(query, bedPath) {
  var bedName = query.bedName;
  var chr = query.chr;
  var dir = bedPath + bedName + '_chr/' + bedName + '_chr' + chr;
  return bed.readBed_(dir, query.xl, query.xr);
};

/**
 * @param {string} bedPath
 * @return {!Array<{
 *   bedName: string,
 *   description: string
 * }>}
 */
bed.query.list = function(bedPath) {
  return bed.listBed_(bedPath);
};
// End public APIs

/**
 * Reads a separated bed file for one chromosome.
 * @param {string} bedFile Path to the bed file.
 * @param {number|undefined} xl Left coordinate of the query range.
 * @param {number|undefined} xr Right coordinate of the query range.
 * @return {!Array<!bed.Motif>} Contains the intervals of bed data.
 * @private
 */
bed.readBed_ = function(bedFile, xl, xr) {
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
};

/**
 * @param {string} bedPath
 * @return {!Array<{
 *   bedName: string,
 *   description: string
 * }>}
 * @private
 */
bed.listBed_ = function(bedPath) {
  // TODO(jiaming)
  return [];
};
