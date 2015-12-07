/**
 * @fileoverview Server handler for binding data.
 */

'use strict';

var fs = require('fs');

var utils = require('./utils');
var segtree = require('./segtree');

/**
 * Number of samples created for each query.
 * @const {number}
 */
// TODO(bowen): User number of pixels on the screen.
var numSamples = 1000;

/**
 * Binging data cache, maximum size 4.
 * @const {number}
 */
var cacheSize = 4;

/**
 * Binding data cache, used to avoid repeated file reading.
 * @type {!Object}
 */
var bindingCache = {
  list: [],
  cache: {}
};

module.exports = {
  /**
   * Reads the exon data from the buffer.
   * @param {Buffer} buf File buffer of the exon data.
   * @return {!Array<Object>} Exons info.
   */
  readExons: function(buf) {
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
  },

  /**
   * Gets the exons from the given file and chromosome.
   * @param {string} file File name of the exon data.
   * @param {string} chr Chromosome.
   * @return {!Array} Exons info.
   */
  getExons: function(file, chr) {
    var buf = utils.readFileToBuf(file);
    if (buf == null) {
      return console.error('cannot read file', file), [];
    }
    var result = this.readExons(buf);
    var data = [];
    for (var i = 0; i < result.length; i++) {
      if (result[i].chr == chr) {
        data.push(result[i]);
      }
    }
    return this.formatExons(data);
  },

  /**
   * Adjusts the exons data so that they adapt to rendering requirements.
   * @param {!Array<Object>} exons Exons data.
   */
  formatExons: function(exons) {
    exons.forEach(function(exon) {
      // Adjust exon0Start to cdsStart, exonNEnd to cdsEnd
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
  },

  /**
   * Gets the binding data between coordinates [x1, x2].
   * @param {string} file File name of the binding data.
   * @param {number} x1 Left coordinate.
   * @param {number} x2 Right coordinate.
   * @return {!Array<{x: number, value: number}>} Binding data as histogram.
   */
  getBinding: function(file, x1, x2) {
    console.log(file, x1, x2);
    var cache = this.loadHistogram(file);
    if (cache == null)
      return console.error('cache load error'), [];

    var xl, xr;
    if (x1 != null && x2 != null) {
      xl = parseInt(x1);
      xr = parseInt(x2);
    } else {
      xl = cache.xmin;
      xr = cache.xmax;
    }

    var n = numSamples;
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
      var l = xl + i / n * span, r = xl + (i + 1) / n * span - 0.1;
      var li = utils.binarySearch(cache.segs, l);
      var ri = utils.binarySearch(cache.segs, r);
      if (li == -1 && ri != -1)
        li = 0;
      else if (li != -1 && ri == -1)
        ri = cache.segs.length - 1;
      else if (li == -1 && ri == -1) {
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
  },

  /**
   * Searches for an exon and returns its coordinates.
   * @param {string} file File name of binding data to be searched within.
   * @param {string} name Name of the exon.
   * @return {!Object} Search result.
   */
  searchExon: function(file, name) {
    var buf = utils.readFileToBuf(file);

    if (buf == null) {
      return console.error('cannot read file', file), [];
    }

    var result = this.readExons(buf);

    for (var i = 0; i < result.length; i++) {
      if (result[i].name2.toLowerCase() == name) {
        return {
          success : true,
          chr : result[i].chr,
          txStart : result[i].txStart,
          txEnd : result[i].txEnd
        };
      }
    }
    return {
      'success': false
    };
  },

  /**
   * Loads the histogram stored in the given file.
   * @param {string} file File name.
   * @return {*}
   */
  loadHistogram: function(file) {
    // Return the cached intervals & RMQ result.
    console.log('check cache', file);

    if (bindingCache.cache[file] != null) {
      return bindingCache.cache[file];
    }
    console.log('cache miss');

    // read bcwig file
    var buf = utils.readFileToBuf(file);

    if (buf == null) {
      return console.error('cannot read file', file), null;
    }

    var n = buf.length / 8;
    var offset = 0;
    var segs = [];

    for (var i = 0; i < n; i++) {
      var x = buf.readInt32LE(offset),
          val = buf.readFloatLE(offset + 4);
      segs.push({
        'x' : x,
        'value' : val
      });
      offset += 8;
      // 1 int, 1 float
    }

    console.log('read complete, cache size', bindingCache.list.length);

    if (bindingCache.list.length == cacheSize) {
      console.log('cache full, discarded head element');
      delete bindingCache.cache[bindingCache.list[0]];
      bindingCache.list[0] = null;
      bindingCache.list = bindingCache.list.slice(1);
      // remove the head element
    }

    var cache = {};
    bindingCache.list.push(file);
    bindingCache.cache[file] = cache;

    cache.segs = segs;
    cache.xmin = segs[0].x;
    cache.xmax = segs[segs.length - 1].x;
    // build segment tree
    var segfile = file.substr(0, file.length - 6) + '.seg';
    var buf = utils.readFileToBuf(segfile);
    if (buf == null) {  // no segtree file, build the tree
      var nodes = [];
      segtree.buildSegmentTree(nodes, segs, buf);
      cache.nodes = nodes;
      console.log('SegmentTree constructed');

      var buf = new Buffer(4 + nodes.length * 4);
      buf.writeInt32LE(nodes.length, 0);
      for (var i = 0, offset = 4; i < nodes.length; i++, offset += 4) {
        buf.writeFloatLE(nodes[i], offset);
      }
      var fd = fs.openSync(segfile, 'w');
      fs.writeSync(fd, buf, 0, offset, 0);
      console.log('SegmentTree written');
    } else {
      var num = buf.readInt32LE(0);
      var nodes = [];
      for (var i = 0, offset = 4; i < num; i++, offset += 4) {
        nodes.push(buf.readFloatLE(offset));
      }
      cache.nodes = nodes;
      console.log('SegmentTree read');
    }
    return cache;
  },

  /**
   * Lists all the wiggle files in the server.
   * @param {string} wiggleAddr Folder of the wiggle file in the server.
   * @return {Array} Array of object of each wiggle file.
   */
  listBindingGenes: function(wiggleAddr) {
    var folder = wiggleAddr;
    var ret = [];
    var files = fs.readdirSync(folder);
    files.forEach(function(file){
      if (file.indexOf('.txt') != -1) {
        var fname = file.substr(0, file.length - 4);
        var fd = fs.openSync(folder + file, 'r');
        var description = fs.readFileSync(fd, 'utf8');
        ret.push({
          bindingName: fname,
          description: description.toString()
        });
      }
    });
    return ret;
  }
};
