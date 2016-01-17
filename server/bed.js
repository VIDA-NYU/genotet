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
 *   aggregated: boolean,
 *   motifs: !Array<{
 *     chrStart: number,
 *     chrEnd: number,
 *     label: (string|undefined)
 *   }>
 * }}
 */
bed.MotifsResult;

/** @const */
bed.query = {};

/**
 * @typedef {{
 *   fileName: string,
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
 * @return {!bed.MotifsResult}
 */
bed.query.motifs = function(query, bedPath) {
  var fileName = query.fileName;
  var chr = query.chr;
  var dir = bedPath + fileName + '_chr/' + fileName + '_chr' + chr;
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
 * Maximum number of motifs to return. If the number of motifs in the query
 * range exceeds this limit, return aggregated ranges instead.
 * @private @const {number}
 */
bed.MOTIF_THRESHOLD_ = 200;

/**
 * Reads a separated bed file for one chromosome.
 * @param {string} bedFile Path to the bed file.
 * @param {number|undefined} xl Left coordinate of the query range.
 * @param {number|undefined} xr Right coordinate of the query range.
 * @return {!bed.MotifsResult} Contains the intervals of bed data.
 * @private
 */
bed.readBed_ = function(bedFile, xl, xr) {
  var data = [];
  var lines = fs.readFileSync(bedFile).toString().split('\n');
  var numLines = lines.length;
  var xMin = Infinity, xMax = -Infinity;
  for (var i = 0; i < numLines; i++) {
    var line = lines[i];
    var parts = line.split('\t');
    var xLeft = parseInt(parts[0]);
    var xRight = parseInt(parts[1]);
    if (xLeft > xr) {
      break;
    }
    if (xl > xRight || xr < xLeft) {
      continue;
    }
    data.push({
      chrStart: xLeft,
      chrEnd: xRight,
      label: parts[2]
    });
    xMin = Math.min(xMin, xLeft);
    xMax = Math.max(xMax, xRight);
  }

  /**
   * Computes the aggregated motifs, assuming each interval [l, r] is extended
   * to [l, r + extend].
   * @param {number} extend
   * @param {boolean} returnArray Whether to return a result array. If false,
   *     return only the count of the array elements.
   * @return {number|bed.MotifsResult}
   */
  var aggregatedMotifs = function(extend, returnArray) {
    var result = returnArray ? [] : 0;
    var start, end = -Infinity;
    data.forEach(function(motif) {
      if (motif.chrStart > end) {
        if (end != -Infinity) {
          if (returnArray) {
            result.push({
              chrStart: start,
              chrEnd: end
            });
          } else {
            result++;
          }
        }
        start = motif.chrStart;
        end = motif.chrEnd + extend;
      } else {
        end = Math.max(end, motif.chrEnd + extend);
      }
    });
    return result;
  };

  if (data.length > bed.MOTIF_THRESHOLD_) {
    data.push({
      chrStart: Infinity
    });
    var minExtend = 0, maxExtend = xMax - xMin;
    while (minExtend <= maxExtend) {
      var extend = (minExtend + maxExtend) >> 1;
      var result = aggregatedMotifs(extend, false);
      if (result > bed.MOTIF_THRESHOLD_) {
        minExtend = extend + 1;
      } else {
        maxExtend = extend - 1;
      }
    }
    var aggregatedData = aggregatedMotifs(minExtend, true);
    console.log(aggregatedData.length, 'aggregated motifs with extend',
      maxExtend);
    return {
      aggregated: true,
      motifs: aggregatedData
    };
  }
  console.log(data.length, 'motifs');
  return {
    aggregated: false,
    motifs: data
  };
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
  var folder = bedPath;
  var ret = [];
  var files = fs.readdirSync(folder);
  files.forEach(function(file) {
    if (file.indexOf('.txt') != -1) {
      var fname = file.substr(0, file.length - 4);
      var content = fs.readFileSync(folder + file, 'utf8')
        .toString().split('\n');
      var bedName = content[0];
      var description = content.slice(1).join('');
      ret.push({
        bedName: bedName,
        fileName: fname,
        description: description
      });
    }
  });
  return ret;
};
