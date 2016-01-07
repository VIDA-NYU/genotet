/**
 * @fileoverview Server handler for binding data.
 */

var fs = require('fs');

var utils = require('./utils');
var segtree = require('./segtree');

/** @type {binding} */
module.exports = binding;

/**
 * @constructor
 */
function binding() {}

/**
 * @typedef {{
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

/**
 * @typedef {{
 *   gene: string,
 *   chr: string,
 *   xl: (number|undefined),
 *   xr: (number|undefined)
 * }}
 */
binding.query.Histogram;

/**
 * @typedef {Object}
 */
binding.query.Exons;

/**
 * @typedef {{
 *   gene: string
 * }}
 */
binding.query.Locus;

// Start public APIs
/**
 * @param {!binding.query.Histogram} query
 * @param {string} wigglePath
 * @return {?binding.Histogram}
 */
binding.query.histogram = function(query, wigglePath) {
  var gene = utils.decodeSpecialChar(query.gene);
  var chr = query.chr;
  var file = wigglePath + gene + '_chr/' + gene + '_chr' + chr + '.bcwig';
  var data = binding.getBinding_(file, query.xl, query.xr);
  data.gene = gene;
  data.chr = chr;
  return data;
};

/**
 * @param {!binding.query.Exons} query
 * @param {string} exonFile
 * @return {!Array<!binding.Exon>}
 */
binding.query.exons = function(query, exonFile) {
  var chr = query.chr;
  return binding.getExons_(exonFile, chr);
};

/**
 * @param {!binding.query.Locus} query
 * @param {string} exonFile
 * @return {?{
 *   chr: (string|undefined),
 *   txStart: (number|undefined),
 *   txEnd: (number|undefined),
 *   error: (!genotet.Error|undefined)
 * }}
 */
binding.query.locus = function(query, exonFile) {
  var gene = query.gene.toLowerCase();
  return binding.searchExon_(exonFile, gene);
};

/**
 * @param {string} wigglePath
 * @return {!Array<{
 *   geneName: string,
 *   description: string
 * }>}
 */
binding.query.list = function(wigglePath) {
  return binding.listBindingGenes_(wigglePath);
};
// End public APIs

/**
 * Number of samples created for each query.
 * @const {number}
 */
// TODO(jiaming): User number of pixels on the screen.
binding.NUM_SAMPLES = 1000;

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
 * @type {!{
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
    console.error('cannot read file', file);
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
 * @return {?binding.Histogram} Binding data as histogram.
 * @private
 */
binding.getBinding_ = function(file, x1, x2) {
  console.log(file, x1, x2);
  var cache = binding.loadHistogram_(file);
  if (cache == null) {
    console.error('cache load error');
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

  var n = binding.NUM_SAMPLES;
  var span = xr - xl;
  // Used '>>' to avoid floating point result.
  var segslen = (cache.nodes.length + 1) >> 1;
  var hist = {
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
    var l = xl + i / n * span;
    var r = xl + (i + 1) / n * span - 0.1;
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
  console.log('returning', n, 'samples of', xl, xr);
  return hist;
};

/**
 * Searches for an exon and returns its coordinates.
 * @param {string} file File name of binding data to be searched within.
 * @param {string} name Name of the exon.
 * @return {?{
 *   chr: (string|undefined),
 *   txStart: (number|undefined),
 *   txEnd: (number|undefined),
 *   error: (!genotet.Error|undefined)
 * }}
 * @private
 */
binding.searchExon_ = function(file, name) {
  var buf = utils.readFileToBuf(file);
  if (buf == null) {
    console.error('cannot read file', file);
    return null;
  }

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
  console.log('check cache', file);

  if (binding.dataCache.cache[file] != null) {
    return binding.dataCache.cache[file];
  }
  console.log('cache miss');

  // read bcwig file
  var buf = utils.readFileToBuf(file);

  if (buf == null) {
    console.error('cannot read file', file);
    return null;
  }

  var n = buf.length / 8;
  var offset = 0;
  var segs = [];

  for (var i = 0; i < n; i++) {
    var x = buf.readInt32LE(offset),
        val = buf.readFloatLE(offset + 4);
    segs.push({
      x: x,
      value: val
    });
    offset += 8;
    // 1 int, 1 float
  }

  console.log('read complete, cache size', binding.dataCache.list.length);

  if (binding.dataCache.list.length == binding.CACHE_SIZE) {
    console.log('cache full, discarded head element');
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
    console.log('SegmentTree constructed');

    buf = new Buffer(4 + nodes.length * 4);
    buf.writeInt32LE(nodes.length, 0);
    offset = 4;
    for (var i = 0; i < nodes.length; i++, offset += 4) {
      buf.writeFloatLE(nodes[i], offset);
    }
    var fd = fs.openSync(segfile, 'w');
    fs.writeSync(fd, buf, 0, offset, 0);
    console.log('SegmentTree written');
  } else {
    var num = buf.readInt32LE(0);
    var nodes = [];
    offset = 4;
    for (var i = 0; i < num; i++, offset += 4) {
      nodes.push(buf.readFloatLE(offset));
    }
    cache.nodes = nodes;
    console.log('SegmentTree read');
  }
  return cache;
};

/**
 * Lists all the wiggle files in the server.
 * @param {string} wiggleAddr Folder of the wiggle file in the server.
 * @return {!Array} Array of object of each wiggle file.
 * @private
 */
binding.listBindingGenes_ = function(wiggleAddr) {
  var folder = wiggleAddr;
  var ret = [];
  var files = fs.readdirSync(folder);
  for (var i = 0; i < files.length; i++) {
    var stat = fs.lstatSync(folder + files[i]);
    if (!stat.isDirectory) {
      if (files[i].indexOf('.txt') != -1) {
        var fname = files[i].substr(0, files[i].length - 4);
        var description = new Buffer();
        var fd = fs.openSync(folder + files[i]);
        fs.readSync(fd, description);
        ret.push({
          bindingName: fname,
          description: description.toString()
        });
      }
    }
  }
  return ret;
};
