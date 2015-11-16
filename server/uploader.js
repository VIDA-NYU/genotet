/**
 * @fileoverview upload function handler
 */

'use strict'

var path;
var fs = require('fs');
var child = require('child_process');
var rl = require('readline');
var mkdirp = require('mkdirp');

var utils = require('./utils.js');
var segtree = require('./segtree.js');
var uploader = require('./uploader.js');

module.exports = {

  /**
   * Uploads a file or a directory to server.
   * @param {{
   *   type: string,
   *   name: string,
   *   description: string
   * }} desc File description.
   * @param {Object} file File object received from multer.
   * @param {string} prefix The destination folder to upload the file to.
   * @param {string} bigWigToWigAddr Directory of script of UCSC bigWigToWig.
   * @returns {Object} Success or not as a JS Object.
   */
  uploadFile: function(desc, file, prefix, bigWigToWigAddr) {
    var fileType = desc.type;
    var source = fs.createReadStream(file.path);
    var dest = fs.createWriteStream(prefix + desc.name);
    source.pipe(dest);
    source.on('end', function() {
      fs.unlink(file.path);
      if (desc.type == 'binding') {
        this.bigwigtoBcwig(prefix, desc.name, bigWigToWigAddr);
      }
    }.bind(this));
    source.on('err', function(err){});

    // write down the network name and description
    var fd = fs.openSync(prefix + desc.name + ".txt", 'w');
    fs.writeSync(fd, desc.description);
    fs.closeSync(fd);

    return {
      success: true
    };

  },

  /**
   * Converts bigwig file to bcwig file and construct segment trees.
   * @param {string} prefix Folder that contains the bw file.
   * @param {string} bwFile Name of the bigwig file (without prefix).
   * @param {string} bigwigtoWigAder The convention script path.
   */
  bigwigtoBcwig: function(prefix, bwFile, bigWigWoWigAddr) {
    // convert *.bw into *.wig
    var wigFileName = bwFile + '.wig';
    console.log('start transfer');
    child.execSync(bigWigWoWigAddr + ' ' + prefix + bwFile + ' ' + prefix + wigFileName);
    console.log(bigWigWoWigAddr + ' ' + prefix + bwFile + ' ' + prefix + wigFileName);

    // convert *.wig into *.bcwig
    var seg = {};  // for segment tree, 22 trees for each chromosome, it is a map
    for (var i = 1; i < 20; i++) {
      var chName = 'chr' + i;
      seg[chName] = [];
    }
    seg['chrM'] = [];
    seg['chrX'] = [];
    seg['chrY'] = [];

    // solve each line
    var lines = rl.createInterface({
      input: fs.createReadStream(prefix + wigFileName),
      terminal: false
    });
    var lastxr = -1;
    lines.on('line', function(line) {
      if (line.indexOf('#') == -1) {
        var linePart = line.split(RegExp(/\s+/));
        var chName = linePart[0];
        var xl = parseInt(linePart[1]);
        var xr = parseInt(linePart[2]);
        var val = parseFloat(linePart[3]);
        //console.log(seg);
        if (xl != lastxr && lastxr > -1) {
          seg[chName].push({
            x: lastxr,
            val: 0
          });
        }
        seg[chName].push({
          x: xl,
          val: val
        });
        lastxr = xr;
      }
    });

    lines.on('close', function() {
      // write to *.bcwig file
      console.log('start log it');
      // if the folder already exists, then delete it
      var folder = prefix + bwFile + '_chr';
      var stats = fs.lstatSync(folder);
      if (stats.isDirectory()) {
        fs.rmdirSync(folder);
        console.log('Wiggle file ' + bwFile + ' is replaced.');
      }
      mkdirp(folder);

      for (var chr in seg) {
        var bcwigFile = folder + '/' + bwFile + '_' + chr + '.bcwig';
        var fd = fs.openSync(bcwigFile, 'w');
        for (var i = 0; i < seg[chr].length; i++) {
          var bcwigBuf = new Buffer(8 * seg[chr].length);
          bcwigBuf.writeInt32LE(seg[chr][i].x, i * 4);
          bcwigBuf.writeFloatLE(seg[chr][i].val, i * 4 + 4);
        }
        fs.writeSync(fd, bcwigBuf, 0, 8 * seg[chr].length, 0);
        fs.closeSync(fd);
      }


      // build segment tree and save

      for (var chr in seg) {
        if (seg[chr].length == 0) {
          console.log(chr + " has no binding data.");
          continue;
        }
        var segFile = folder + '/' + bwFile + '_' + chr + '.seg';
        var nodes = [];
        segtree.buildSegmentTree(nodes, seg[chr]);
        var segBuf = new Buffer(4 + 4 * nodes.length);
          segBuf.writeInt32LE(nodes.length, 0);
        for (var i = 0, offset = 4; i < nodes.length; i++, offset += 2) {
          segBuf.writeFloatLE(nodes[i], offset);
        }
        var fd = fs.openSync(segFile, 'w');
        fs.writeSync(fd, segBuf, 0, offset, 0);
        fs.closeSync(fd);
      }

    });

  }

};
