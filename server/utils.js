/**
 * @fileoverview Server utility functions.
 */

'use strict';

var fs = require('fs');

module.exports = {

  binarySearch: function(segs, x) {
    var ll = 0, rr = segs.length - 1;
    while (ll <= rr) {
      var m = (ll + rr) >> 1;
      if (segs[m].x > x)
        rr = m - 1;
      else
        ll = m + 1;
    }
    if (rr == segs.length)
      return -1; // not found
    return rr;
  },

  readFileToBuf: function(file) {
    if (fs.existsSync(file) == false)
      return null;
    var stats = fs.statSync(file);
    var numBytes = stats.size;
    var buf = new Buffer(numBytes);
    var fd = fs.openSync(file, 'r');
    fs.readSync(fd, buf, 0, numBytes, 0);
    return buf;
  },

  decodeSpecialChar: function(url) {
    url = url.replace(/%2B/g, '+');
    url = url.replace(/%3F/g, '?');
    return url;
  }
};
