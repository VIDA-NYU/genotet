/**
 * @fileoverview Server handler for binding data.
 */

var fs = require('fs');

var utils = require('./utils');
var segtree = require('./segtree');
var log = require('./log');

/** @type {binding} */
module.exports = binding;

/**
 * @constructor
 */
function binding() {}

/** @enum {string} */
binding.QueryType = {
  BINDING: 'binding',
  EXONS: 'exons',
  LOCUS: 'locus',
  LIST_BINDING: 'list-binding'
};

/**
 * @typedef {{
 *   numSamples: number,
 *   gene: (string|undefined),
 *   chr: (string|undefined),
 *   xMin: number,
 *   xMax: number,
 *   values: !Array<number>,
 *   valueMax: number,
 *   allValueMax: number
 * }}
 */
binding.Histogram;

/**
 * @typedef {{
 *   error: string
 * }}
 */
binding.Error;

/**
 * @typedef {{
 *   name: string,
 *   name2: string,
 *   chr: string,
 *   strand: string,
 *   txStart: number,
 *   txEnd: number,
 *   cdsStart: number,
 *   cdsEnd: number,
 *   exonRanges: !Array<{start: number, end: number}>,
 *   txRanges: Array<{start: number, end: number}>,
 *   exRanges: Array<{start: number, end: number}>
 * }}
 */
binding.Exon;

/** @const */
binding.query = {};

// Start public APIs
/**
 * @param {*|{
 *   fileName: string,
 *   chr: string,
 *   xl: (number|undefined),
 *   xr: (number|undefined),
 *   numSamples: (number|undefined)
 * }} query
 * @param {string} bindingPath
 * @return {binding.Histogram|binding.Error}
 */
binding.query.histogram = function(query, bindingPath) {
  if (query.fileName == undefined) {
    return {
      error: 'fileName is undefined'
    };
  }
  if (query.chr == undefined) {
    return {
      error: 'chr is undefined'
    };
  }
  var fileName = query.fileName;
  var chr = query.chr;
  var file = bindingPath + fileName + '_chr/' + fileName + '_chr' + chr +
    '.bcwig';
  var descriptionPath = bindingPath + fileName + '.desc';
  if (!fs.existsSync(file)) {
    var error = 'binding file ' + fileName + ' not found.';
    log.serverLog(error);
    return {
      error: error
    };
  }
  var data = binding.getBinding_(file, query.xl, query.xr, query.numSamples);
  data.gene = binding.getGene_(descriptionPath);
  data.chr = chr;
  return data;
};

/**
 * @param {*|{
 *   chr: string
 * }} query
 * @param {string} exonFile
 * @return {Array<!binding.Exon>|binding.Error}
 */
binding.query.exons = function(query, exonFile) {
  if (query.chr == undefined) {
    return {
      error: 'chr is undefined'
    };
  }
  var chr = query.chr;
  if (!fs.existsSync(exonFile)) {
    var error = 'exonFile not found.';
    log.serverLog(error);
    return {
      error: error
    };
  }
  return binding.getExons_(exonFile, chr);
};

/**
 * @param {*|{
 *   gene: string
 * }} query
 * @param {string} exonFile
 * @return {{
 *   chr: (string|undefined),
 *   txStart: (number|undefined),
 *   txEnd: (number|undefined),
 *   error: (!genotet.Error|undefined)
 * }|binding.Error}
 */
binding.query.locus = function(query, exonFile) {
  if (query.gene == undefined) {
    return /** @type {binding.Error} */({
      error: 'gene is undefined'
    });
  }
  var gene = query.gene.toLowerCase();
  if (!fs.existsSync(exonFile)) {
    var error = 'exonFile not found.';
    log.serverLog(error);
    return /** @type {binding.Error} */ ({
      error: error
    });
  } else {
    return binding.searchExon_(exonFile, gene);
  }
};

/**
 * @param {string} bindingPath
 * @return {!Array<{
 *   fileName: string,
 *   gene: string,
 *   chrs: string,
 *   description: string
 * }>}
 */
binding.query.list = function(bindingPath) {
  return binding.listBindingGenes_(bindingPath);
};
// End public APIs

/**
 * Number of samples created for each query.
 * @private @const {number}
 */
binding.DEFAULT_NUM_SAMPLES_ = 1000;

/**
 * Size of one int, one double, for binding data storage.
 * @private @const {number}
 */
binding.ENTRY_SIZE_ = 12;

/**
 * Size of one double, for binding file storage.
 * @private @const {number}
 */
binding.DOUBLE_SIZE_ = 8;

/**
 * Binging data cache, maximum size 4.
 * @const {number}
 */
binding.CACHE_SIZE = 4;

/**
 * @typedef {{
 *   segs: Array<{x: number, value: number}>,
 *   nodes: Array<number>,
 *   xMin: number,
 *   xMax: number
 * }}
 */
binding.HistogramTree;

/**
 * Binding data cache, used to avoid repeated file reading.
 * @type {{
 *   list: !Array,
 *   cache: !Object
 * }}
 */
binding.dataCache = {
  /**
   * List of file names
   * @type {!Array<?string>}
   */
  list: [],
  /** @type {!Object<binding.HistogramTree>} */
  cache: {}
};

/**
 * Reads the exon data from the buffer.
 * @param {Buffer} buf File buffer of the exon data.
 * @return {!Array<binding.Exon>} Exons info.
 * @private
 */
binding.readExons_ = function(buf) {
  var result = [];
  var offset = 0;
  while (true) {
    var lstr = buf.readInt32LE(offset); offset += 4;
    if (lstr == 0) break;
    var str = buf.toString('utf8', offset, offset + lstr).split(' ');
    var name = str[0], name2 = str[1], chr = str[2], strand = str[3];
    offset += lstr;
    var txStart = buf.readInt32LE(offset),
      txEnd = buf.readInt32LE(offset + 4),
      cdsStart = buf.readInt32LE(offset + 8),
      cdsEnd = buf.readInt32LE(offset + 12),
      exonCount = buf.readInt32LE(offset + 16);
    offset += 20;
    var exonRanges = [];
    for (var i = 0; i < exonCount; i++) {
      var s = buf.readInt32LE(offset), t = buf.readInt32LE(offset + 4);
      offset += 8;
      exonRanges.push({'start': s, 'end': t});
    }
    var exon = {
      name: name,
      name2: name2,
      chr: chr,
      strand: strand,
      txStart: txStart,
      txEnd: txEnd,
      cdsStart: cdsStart,
      cdsEnd: cdsEnd,
      exonRanges: exonRanges
    };
    result.push(exon);
  }
  return result;
};

/**
 * Gets the exons from the given file and chromosome.
 * @param {string} file File name of the exon data.
 * @param {string} chr Chromosome.
 * @return {!Array<binding.Exon>} Exons info.
 * @private
 */
binding.getExons_ = function(file, chr) {
  var buf = utils.readFileToBuf(file);
  if (buf == null) {
    log.serverLog('cannot read file', file);
    return [];
  }
  var result = binding.readExons_(buf);
  var data = [];
  for (var i = 0; i < result.length; i++) {
    if (result[i].chr == chr) {
      data.push(result[i]);
    }
  }
  return binding.formatExons_(data);
};

/**
 * Adjusts the exons data so that they adapt to rendering requirements.
 * @param {!Array<!binding.Exon>} exons Exons data.
 * @return {!Array<!binding.Exon>} Exons with exRanges and txRanges.
 * @private
 */
binding.formatExons_ = function(exons) {
  exons.forEach(function(exon) {
    // Adjust exon_0_Start to cdsStart, exon_n_End to cdsEnd
    var txRanges = [];  // Half height
    var exRanges = [];  // Actual exons to be drawn (full height)
    var cdsStart = exon.cdsStart;
    var cdsEnd = exon.cdsEnd;
    exon.exonRanges.forEach(function(range) {
      var start = range.start;
      var end = range.end;
      if (start < cdsStart) {
        if (end > cdsStart) {
          if (end > cdsEnd) {
            txRanges.push({
              start: start,
              end: cdsStart
            });
            txRanges.push({
              start: cdsEnd,
              end: end
            });
            exRanges.push({
              start: cdsStart,
              end: cdsEnd
            });
          } else if (end <= cdsEnd) {
            txRanges.push({
              start: start,
              end: cdsStart
            });
            exRanges.push({
              start: cdsStart,
              end: end
            });
          }
        } else if (end <= cdsStart) {
          txRanges.push({
            start: start,
            end: end
          });
        }
      } else if (start >= cdsStart && start <= cdsEnd) {
        if (end <= cdsEnd) {
          exRanges.push({
            start: start,
            end: end
          });
        } else if (end > cdsEnd) {
          exRanges.push({
            start: start,
            end: cdsEnd
          });
          txRanges.push({
            start: cdsEnd,
            end: end
          });
        }
      } else if (start > cdsEnd) {
        txRanges.push({
          start: cdsEnd,
          end: end
        });
      }
    });
    exon.txRanges = txRanges;
    exon.exRanges = exRanges;
  });
  return exons;
};

/**
 * Gets the binding data between coordinates [x1, x2].
 * @param {string} file File name of the binding data.
 * @param {number|undefined} x1 Left coordinate.
 * @param {number|undefined} x2 Right coordinate.
 * @param {number|undefined} numSamples Number of return samples.
 * @return {?binding.Histogram} Binding data as histogram.
 * @private
 */
binding.getBinding_ = function(file, x1, x2, numSamples) {
  log.serverLog(file, x1, x2);
  var cache = binding.loadHistogram_(file);
  if (cache == null) {
    log.serverLog('cache load error');
    return null;
  }

  var xl, xr;
  if (x1 != null && x2 != null) {
    xl = parseInt(x1, 10);
    xr = parseInt(x2, 10);
  } else {
    xl = cache.xMin;
    xr = cache.xMax;
  }

  var n;
  if (numSamples == null) {
    n = binding.DEFAULT_NUM_SAMPLES_;
  } else {
    n = numSamples;
  }
  var span = xr - xl;
  // Used '>>' to avoid floating point result.
  var segslen = (cache.nodes.length + 1) >> 1;
  var hist = {
    numSamples: n,
    xMin: xl,
    xMax: xr,
    values: [],
    valueMax: -Infinity,
    allValueMax: segtree.querySegmentTree(cache.nodes, 0, 0, segslen - 1,
      0, segslen - 1)
  };
  // Do sampling here, the sampling takes the range maximum for each bar.
  // The sampling binary searches the entry point, and then queries the
  // segment tree for RMQ.
  for (var i = 0; i < n; i++) {
    // [inclusive, exclusive) range
    var l = xl + i / (n - 1) * span;
    var r = xl + (i + 1) / (n - 1) * span - 0.1;
    var li = utils.binarySearch(cache.segs, l);
    var ri = utils.binarySearch(cache.segs, r);
    if (li == -1 && ri != -1) {
      li = 0;
    } else if (li != -1 && ri == -1) {
      ri = cache.segs.length - 1;
    } else if (li == -1 && ri == -1) {
      hist.values.push({
        'x' : l,
        'value' : 0
      });
      hist.valueMax = Math.max(hist.valueMax, 0);
      continue;
    }
    var val = segtree.querySegmentTree(cache.nodes, 0, li, ri, 0,
        segslen - 1);
    hist.values.push({
      x: l,
      value: val
    });
    hist.valueMax = Math.max(hist.valueMax, val);
  }
  log.serverLog('returning', n, 'samples of', xl, xr);
  return hist;
};

/**
 * Searches for an exon and returns its coordinates.
 * @param {string} file File name of binding data to be searched within.
 * @param {string} name Name of the exon.
 * @return {{
 *   chr: (string|undefined),
 *   txStart: (number|undefined),
 *   txEnd: (number|undefined),
 *   error: (!genotet.Error|undefined)
 * }}
 * @private
 */
binding.searchExon_ = function(file, name) {
  var buf = utils.readFileToBuf(file);

  var result = binding.readExons_(buf);

  for (var i = 0; i < result.length; i++) {
    if (result[i].name2.toLowerCase() == name) {
      return {
        chr: result[i].chr,
        txStart: result[i].txStart,
        txEnd: result[i].txEnd
      };
    }
  }
  log.serverLog('gene not found in exon list');
  return {
    error: {
      type: 'notFound',
      message: 'cannot find gene in exon list'
    }
  };
};

/**
 * Loads the histogram stored in the given file.
 * @param {string} file File name.
 * @return {?binding.HistogramTree}
 * @private
 */
binding.loadHistogram_ = function(file) {
  // Return the cached intervals & RMQ result.
  log.serverLog('check cache', file);

  if (binding.dataCache.cache[file] != null) {
    return binding.dataCache.cache[file];
  }
  log.serverLog('cache miss');

  // read bcwig file
  var buf = utils.readFileToBuf(file);

  if (buf == null) {
    log.serverLog('cannot read file', file);
    return null;
  }

  var n = buf.length / binding.ENTRY_SIZE_;
  var offset = 0;
  var segs = [];

  for (var i = 0; i < n; i++) {
    var x = buf.readInt32LE(offset),
        val = buf.readDoubleLE(offset + 4);
    segs.push({
      x: x,
      value: val
    });
    offset += binding.ENTRY_SIZE_;
    // 1 int, 1 double
  }

  log.serverLog('read complete, cache size', binding.dataCache.list.length);

  if (binding.dataCache.list.length == binding.CACHE_SIZE) {
    log.serverLog('cache full, discarded head element');
    delete binding.dataCache.cache[binding.dataCache.list[0]];
    binding.dataCache.list[0] = null;
    binding.dataCache.list = binding.dataCache.list.slice(1);
    // remove the head element
  }

  var cache = {};
  binding.dataCache.list.push(file);
  binding.dataCache.cache[file] = cache;

  cache.segs = segs;
  cache.xMin = segs[0].x;
  cache.xMax = segs[segs.length - 1].x;
  // build segment tree
  var segfile = file.substr(0, file.length - 6) + '.seg';
  buf = utils.readFileToBuf(segfile);
  if (buf == null) {  // no segtree file, build the tree
    var nodes = [];
    segtree.buildSegmentTree(nodes, segs);
    cache.nodes = nodes;
    log.serverLog('SegmentTree constructed');
    buf = new Buffer(4 + nodes.length * binding.DOUBLE_SIZE_);
    buf.writeInt32LE(nodes.length, 0);
    offset = 4;
    for (var i = 0; i < nodes.length; i++, offset += binding.DOUBLE_SIZE_) {
      buf.writeDoubleLE(nodes[i], offset);
    }
    var fd = fs.openSync(segfile, 'w');
    fs.writeSync(fd, buf, 0, offset, 0);
    log.serverLog('SegmentTree written');
  } else {
    var num = buf.readInt32LE(0);
    var nodes = [];
    offset = 4;
    for (var i = 0; i < num; i++, offset += binding.DOUBLE_SIZE_) {
      nodes.push(buf.readDoubleLE(offset));
    }
    cache.nodes = nodes;
    log.serverLog('SegmentTree read');
  }
  return cache;
};

/**
 * Lists all the wiggle files in the server.
 * @param {string} bindingPath Folder of the wiggle file in the server.
 * @return {!Array} Array of object of each wiggle file.
 * @private
 */
binding.listBindingGenes_ = function(bindingPath) {
  var folder = bindingPath;
  var ret = [];
  var files = fs.readdirSync(folder);
  files.forEach(function(file) {
    // find the files ending with .data
    if (file.lastIndexOf('.data') > 0 &&
      file.lastIndexOf('.data') == file.length - 5) {
      var fileName = file.replace(/\.data$/, '');
      var gene = '';
      var description = '';
      var descriptionFile = folder + fileName + '.desc';
      if (fs.existsSync(descriptionFile)) {
        var content = fs.readFileSync(descriptionFile, 'utf8')
          .toString().split('\n');
        gene = content[0];
        description = content.slice(1).join('');
      }
      var chrFolder = bindingPath + fileName + '_chr/';
      var chrFiles = fs.readdirSync(chrFolder);
      var chrs = [];
      chrFiles.forEach(function(file) {
        if (file.indexOf('bcwig') != -1) {
          var nameParts = file.split('_');
          var lastParts = nameParts[nameParts.length - 1].split('.');
          var chr = lastParts[0];
          chrs.push(chr);
        }
      });
      ret.push({
        fileName: fileName,
        gene: gene,
        chrs: chrs,
        description: description
      });
    }
  });
  return ret;
};

/**
 * Gets gene name for a specific binding file.
 * @param {string} descriptionPath Path to the wiggle folder.
 * @return {string} the gene name.
 * @private
 */
binding.getGene_ = function(descriptionPath) {
  var gene = '';
  if (fs.existsSync(descriptionPath)) {
    var content = fs.readFileSync(descriptionPath, 'utf-8').toString()
      .split('\n');
    gene = content[0];
  }
  return gene;
};

