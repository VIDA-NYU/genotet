/**
 * @fileoverview Bed data processing script.
 */

var fs = require('fs');

var log = require('./log');
var database = require('./database');
var user = require('./user');

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

// Start public APIs
/**
 * @param {*|{
 *   fileName: string,
 *   chr: string,
 *   xl: (number|undefined),
 *   xr: (number|undefined)
 * }} query
 * @param {string} dataPath
 * @return {bed.MotifsResult|bed.Error}
 */
bed.query.motifs = function(query, dataPath) {
  if (query.fileName === undefined) {
    return {error: 'fileName is undefined'};
  }
  if (query.chr === undefined) {
    return {error: 'chr is undefined'};
  }
  var fileName = query.fileName;
  var bedPath = dataPath + user.getUsername() + '/' + bed.PATH_PREFIX_;
  var chr = query.chr;
  var dir = bedPath + fileName + '_chr/' + fileName + '_chr' + chr;
  if (!fs.existsSync(dir)) {
    var error = 'bed file ' + fileName + ' not found.';
    log.serverLog(error);
    return {error: error};
  }
  return bed.readBed_(dir, query.xl, query.xr);
};

/**
 * @param {!mongodb.Db} db The database object.
 * @param {function(Array<{
 *   fileName: string,
 *   bedName: string,
 *   description: string
 * }>)} callback The callback function.
 */
bed.query.list = function(db, callback) {
  bed.listBed_(db, function(data) {
    callback(data);
  });
};
// End public APIs


/**
 * The path name for bed data after dataPath.
 * @private @const {string}
 */
bed.PATH_PREFIX_ = 'bed/';

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
    log.serverLog(aggregatedData.length, 'aggregated motifs with extend',
      maxExtend);
    return {
      aggregated: true,
      motifs: aggregatedData
    };
  }
  log.serverLog(data.length, 'motifs');
  return {
    aggregated: false,
    motifs: data
  };
};

/**
 * @param {!mongodb.Db} db The database object.
 * @param {function(!Array<{
 *   bedName: string,
 *   description: string
 * }>)} callback The callback function.
 * @private
 */
bed.listBed_ = function(db, callback) {
  database.getList(db, 'bed', function(data) {
    var ret = data.map(function(bedFile) {
      return {
        fileName: bedFile.fileName,
        bedName: bedFile.dataName,
        description: bedFile.description
      };
    });
    callback(ret);
  });
};
