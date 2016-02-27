/**
 * @fileoverview Bed data processing script.
 */

var fs = require('fs');

var log = require('./log');

/** @type {bed} */
module.exports = bed;

/**
 * @constructor
 */
function bed() {}

/** @enum {string} */
bed.QueryType = {
  BED: 'bed',
  LIST_BED: 'list-bed'
};

/**
 * @typedef {{
 *   chrStart: number,
 *   chrEnd: number,
 *   label: (string|undefined)
 * }}
 */
bed.Motif;

/**
 * @typedef {{
 *   error: string
 * }}
 */
bed.Error;

/**
 * @typedef {{
 *   aggregated: boolean,
 *   motifs: !Array<!bed.Motif>
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
 * @return {bed.MotifsResult|bed.Error}
 */
bed.query.motifs = function(query, bedPath) {
  var fileName = query.fileName;
  var chr = query.chr;
  var dir = bedPath + fileName + '_chr/' + fileName + '_chr' + chr;
  if (!fs.existsSync(dir)) {
    var error = 'bed file ' + fileName + ' not found.';
    log.serverLog([error]);
    return {
      error: error
    };
  }
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
    var xLeft = parseInt(parts[0], 10);
    var xRight = parseInt(parts[1], 10);
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
   * @return {number|!Array<bed.Motif>}
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
    var aggregatedData = /** @type {!Array<!bed.Motif>} */
      (aggregatedMotifs(minExtend, true));
    console.log(aggregatedData.length, 'aggregated motifs with extend',
      maxExtend);
    return {
      aggregated: true,
      motifs: aggregatedData
    };
  }
  log.serverLog([data.length, 'motifs']);
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
    if (file.lastIndexOf('.data') > 0 &&
      file.lastIndexOf('.data') == file.length - 5) {
      var fileName = file.replace(/\.data$/, '');
      var bedName = '';
      var description = '';
      var descriptionFile = folder + fileName + '.desc';
      if (fs.existsSync(descriptionFile)) {
        var content = fs.readFileSync(descriptionFile, 'utf8')
          .toString().split('\n');
        bedName = content[0];
        description = content.slice(1).join('');
      }
      ret.push({
        bedName: bedName,
        fileName: fileName,
        description: description
      });
    }
  });
  return ret;
};
