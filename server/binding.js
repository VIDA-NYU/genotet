
// server handler for binding data

'use strict';

var fs = require('fs');

var utils = require('./utils'),
  segtree = require('./segtree');

// binging data cache, maximum size 4
var numSamples = 1000;
var cacheSize = 4;
var bindingCache = {};
bindingCache.list = new Array();
bindingCache.cache = {};

module.exports = {

  readExons: function(buf) {
    var result = new Array();
    var offset = 0;
    while (true) {
      var lstr = buf.readInt32LE(offset); offset += 4;
      if (lstr == 0) break;
      var str = buf.toString('utf8', offset, offset + lstr).split(' ');
      var name = str[0], name2 = str[1], chr = str[2], strand = str[3];
      offset += lstr;
      var txStart = buf.readInt32LE(offset), txEnd = buf.readInt32LE(offset + 4),
        cdsStart = buf.readInt32LE(offset + 8), cdsEnd = buf.readInt32LE(offset + 12),
        exonCount = buf.readInt32LE(offset + 16);
      offset += 20;
      var exonRanges = new Array();
      for (var i = 0; i < exonCount; i++) {
        var s = buf.readInt32LE(offset), t = buf.readInt32LE(offset + 4);
        offset += 8;
        exonRanges.push({'start': s, 'end': t});
      }
      var exon = {'name': name, 'name2': name2, 'chr': chr, 'strand': strand,
      'txStart': txStart, 'txEnd': txEnd, 'cdsStart': cdsStart, 'cdsEnd': cdsEnd,
      'exonCount': exonCount, 'exonRanges': exonRanges};
      result.push(exon);
    }
    return result;
  },

  getExons: function(file, chr) {
    var buf = utils.readFileToBuf(file);
    if (buf == null)
      return console.error('cannot read file', file), [];
    var result = this.readExons(buf);
    var data = [];
    for (var i = 0; i < result.length; i++) if (result[i].chr == chr) data.push(result[i]);
    return data;
  },

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
    // do sampling here, the sampling takes the range maximum for each bar
    // the sampling binary search the entry point, and then query the rmq table
    var hist = {};
    hist.xMin = xl;
    hist.xMax = xr;
    hist.values = new Array();
    var n = numSamples,
        span = xr - xl,
        segslen = (cache.nodes.length + 1) >> 1;
    for (var i = 0; i < n; i++) {
      var l = xl + i / n * span, r = xl + (i + 1) / n * span - 0.1; // [inclusive, exclusive) range
      var li = utils.binarySearch(cache.segs, l),
        ri = utils.binarySearch(cache.segs, r);
      if (li == -1 && ri != -1)
        li = 0;
      else if (li != -1 && ri == -1)
        ri = cache.segs.length - 1;
      else if (li == -1 && ri == -1) {
        hist.values.push({
          'x' : l,
          'value' : 0
        });
        continue;
      }
      var val = segtree.querySegmentTree(cache.nodes, 0, li, ri, 0, segslen - 1);
      hist.values.push({'x': l, 'value': val});
    }
    console.log('returning', n, 'samples of', xl, xr);
    return hist;
  },

  getBindingSampling: function(file) {
    // currently the auto sampling size based on view width is disabled
    return this.getBinding(file);
  },

  searchExon: function(file, name) {
    var buf = utils.readFileToBuf(file);

    if (buf == null)
      return console.error('cannot read file', file), [];

    var result = this.readExons(buf);

    for (var i = 0; i < result.length; i++) {
      if (result[i].name2.toLowerCase() == name) {
        return {
          'success' : true,
          'chr' : result[i].chr,
          'txStart' : result[i].txStart,
          'txEnd' : result[i].txEnd
        };
      }
    }

    return {
      'success': false
    };
  },

  loadHistogram: function(file) {  // return the cached intervals & rmq
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

    var n = buf.length / 6;
    var offset = 0;
    var segs = new Array();

    for (var i = 0; i < n; i++) {
      var x = buf.readInt32LE(offset),
          val = buf.readInt16LE(offset + 4);
      segs.push({
        'x' : x,
        'value' : val
      });
      offset += 6;
      // 1 int, 1 short
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
    var segfile = file.substr(0, file.length - 4) + '.seg';
    var buf = utils.readFileToBuf(segfile);
    if (buf == null) {  // no segtree file, build the tree
      var nodes = new Array();
      segtree.buildSegmentTree(nodes, segs, buf);
      cache.nodes = nodes;
      console.log('SegmentTree constructed');

      var buf = new Buffer(4 + nodes.length * 2);
      buf.writeInt32LE(nodes.length, 0);
      for (var i = 0, offset = 4; i < nodes.length; i++, offset += 2) buf.writeInt16LE(nodes[i], offset);
      var fd = fs.openSync(segfile, 'w');
      fs.writeSync(fd, buf, 0, offset, 0);
      console.log('SegmentTree written');
    }else {
      var num = buf.readInt32LE(0);
      var nodes = new Array();
      for (var i = 0, offset = 4; i < num; i++, offset += 2) nodes.push(buf.readInt16LE(offset));
      cache.nodes = nodes;
      console.log('SegmentTree read');
    }
    return cache;
  }

};
