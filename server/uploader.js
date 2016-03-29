/**
 * @fileoverview upload function handler
 */
var fs = require('fs');
var childProcess = require('child_process');
var readline = require('readline');
var mkdirp = require('mkdirp');

var segtree = require('./segtree');
var log = require('./log');
var database = require('./database');
var user = require('./user');

/** @type {uploader} */
module.exports = uploader;

/**
 * @constructor
 */
function uploader() {}

/** @enum {string} */
uploader.FileType = {
  NETWORK: 'network',
  EXPRESSION: 'expression',
  BINDING: 'binding',
  BED: 'bed',
  MAPPING: 'mapping'
};

/**
 * Size of a binding entry, one int, one double.
 * @private @const {number}
 */
uploader.ENTRY_SIZE_ = 12;

/**
 * Size of one double, for binding file storage.
 * @private @const {number}
 */
uploader.DOUBLE_SIZE_ = 8;

/**
 * The transfer time from .bw to .wig for binding data.
 * @private @const {number}
 */
uploader.PROGRESS_BINDING_TRANSFER_ = 10;

/**
 * The reading time for binding data.
 * @private @const {number}
 */
uploader.PROGRESS_BINDING_READ_ = 80;

/**
 * The time of writing binding file into binary .bcwig files.
 * @private @const {number}
 */
uploader.PROGRESS_BINDING_WRITE_ = 4;

/**
 * The time of building segment trees and writing down.
 * @private @const {number}
 */
uploader.PROGRESS_BINDING_SEGTREE_ = 4;

/**
 * The time of reading bed data.
 * @private @const {number}
 */
uploader.PROGRESS_BED_READ_ = 50;

/**
 * The time of writing separated bed data.
 * @private @const {number}
 */
uploader.PROGRESS_BED_WRITE_ = 48;

/**
 * @typedef {{
 *   error: string
 * }}
 */
uploader.Error;

/** @const */
uploader.query = {};

/**
 * Uploads a file or a directory to server.
 * @param {{
 *   type: uploader.FileType,
 *   dataName: string,
 *   description: string,
 * }} desc File description.
 * @param {!multer.File} file File object received from multer.
 * @param {string} prefix The destination folder to upload the file to.
 * @param {string} bigWigToWigAddr Directory of script of UCSC bigWigToWig.
 * @param {!mongodb.Db} db The database object.
 * @param {function(*)} callback The callback function.
 */
uploader.uploadFile = function(desc, file, prefix, bigWigToWigAddr, db,
                               callback) {
  var fileName = file.originalname;
  var filePath = prefix + user.getUsername();
  if (!fs.existsSync(filePath)) {
    fs.mkdirSync(filePath);
  }
  filePath += desc.type + '/';
  if (!fs.existsSync(filePath)) {
    fs.mkdirSync(filePath);
  }
  if (fs.existsSync(filePath + fileName)) {
    fs.unlinkSync(filePath + fileName);
  }

  var source = fs.createReadStream(file.path);
  var dest = fs.createWriteStream(filePath + fileName);
  source.pipe(dest);
  source
    .on('end', function() {
      fs.unlinkSync(file.path);
      if (desc.type == uploader.FileType.BINDING) {
        uploader.bigWigToBcwig(filePath, fileName, bigWigToWigAddr, db,
          function(err) {
            if (err.error) {
              callback(err);
            }
          });
      } else if (desc.type == uploader.FileType.BED) {
        uploader.bedSort(filePath, fileName, db, function(err) {
          if (err.error) {
            callback(err);
          }
        });
      }
      database.insertFile(db, filePath, fileName, desc, function(err) {
        if (err.error) {
          callback(err);
        } else {
          callback({});
        }
      });
    })
    .on('err', function(err) {
      callback({error: 'failed to copy file.'});
    });
};

/**
 * Converts bigwig file to bcwig file and construct segment trees.
 * @param {string} prefix Folder that contains the bw file.
 * @param {string} bwFile Name of the bigwig file (without prefix).
 * @param {string} bigWigToWigAddr The convention script path.
 * @param {!mongodb.Db} db The database object.
 * @param {function(*)} callback The callback function.
 */
uploader.bigWigToBcwig = function(prefix, bwFile, bigWigToWigAddr, db,
                                  callback) {
  // convert *.bw into *.wig
  var percentage = 0;

  var wigFileName = bwFile + '.wig';
  log.serverLog('start transfer');
  var cmd = [
    bigWigToWigAddr,
    prefix + bwFile,
    prefix + wigFileName
  ].join(' ');
  // TODO(jiaming): change it to async version.
  childProcess.execSync(cmd);
  log.serverLog(cmd);
  percentage += uploader.PROGRESS_BINDING_TRANSFER_;
  database.updateProgress(db, bwFile, percentage, function(err) {
    if (err.error) {
      callback(err);
    }
  });

  cmd = [
    'wc',
    '-l',
    prefix + wigFileName
  ].join(' ');
  var output = childProcess.execSync(cmd).toString().split(RegExp(/\s+/));
  var totalLine = parseInt(output[1], 10);
  var oneTenthLines = parseInt(totalLine / 10, 10);

  // convert *.wig into *.bcwig
  var seg = {};  // for segment tree

  // solve each line
  var lines = readline.createInterface({
    input: fs.createReadStream(prefix + wigFileName),
    terminal: false
  });
  var lastChrXr = {}, lastValue = {};
  var lineCount = 0;
  lines.on('line', function(line) {
    if (line.indexOf('#') == -1) {
      var linePart = line.split(RegExp(/\s+/));
      var chName = linePart[0];
      var xl = parseInt(linePart[1], 10);
      var xr = parseInt(linePart[2], 10);
      var val = parseFloat(linePart[3]);
      if (!(linePart[0] in seg)) {
        seg[linePart[0]] = [];
      }
      if (xl != lastChrXr[chName] && lastChrXr[chName] > -1) {
        seg[chName].push({
          x: lastChrXr[chName],
          value: 0.0
        });
      }
      seg[chName].push({
        x: xl,
        value: val
      });
      lastChrXr[chName] = xr;
      lastValue[chName] = val;

      ++lineCount;
      if (lineCount % oneTenthLines == 0) {
        // increase 10% for the progress
        percentage += 0.1 * uploader.PROGRESS_BINDING_READ_;
        database.updateProgress(db, bwFile, percentage, function(err) {
          if (err.error) {
            callback(err);
          }
        });
      }
    }
  });

  lines.on('close', function() {
    var chrNum = 0;
    for (var chr in lastChrXr) {
      chrNum++;
      seg[chr].push({
        x: lastChrXr[chr],
        value: lastValue[chr]
      });
    }

    // write to *.bcwig file
    // if the folder already exists, then delete it
    var folder = prefix + bwFile + '_chr';
    if (fs.existsSync(folder)) {
      cmd = [
        'rm',
        '-r',
        folder
      ].join(' ');
      childProcess.execSync(cmd);
    }
    fs.mkdirSync(folder);

    var chrs = [];
    for (var chr in seg) {
      chrs.push(chr);
      var bcwigFile = folder + '/' + bwFile + '_' + chr + '.bcwig';
      var bcwigBuf = new Buffer(uploader.ENTRY_SIZE_ * seg[chr].length);
      for (var i = 0; i < seg[chr].length; i++) {
        bcwigBuf.writeInt32LE(seg[chr][i].x, i * uploader.ENTRY_SIZE_);
        bcwigBuf.writeDoubleLE(seg[chr][i].value, i * uploader.ENTRY_SIZE_ + 4);
      }
      var fd = fs.openSync(bcwigFile, 'w');
      fs.writeSync(fd, bcwigBuf, 0, uploader.ENTRY_SIZE_ * seg[chr].length, 0);
      fs.closeSync(fd);
      percentage += uploader.PROGRESS_BINDING_WRITE_ / chrNum;
      database.updateProgress(db, bwFile, percentage, function(err) {
        if (err.error) {
          log.serverLog(err);
          callback(err);
        }
      });
    }

    // build segment tree and save
    for (var chr in seg) {
      var segFile = folder + '/' + bwFile + '_' + chr + '.seg';
      var nodes = [];
      segtree.buildSegmentTree(nodes, seg[chr]);
      var segBuf = new Buffer(4 + nodes.length * uploader.DOUBLE_SIZE_);
      segBuf.writeInt32LE(nodes.length, 0);
      for (var i = 0, offset = 4; i < nodes.length; i++,
        offset += uploader.DOUBLE_SIZE_) {
        segBuf.writeDoubleLE(nodes[i], offset);
      }
      var fd = fs.openSync(segFile, 'w');
      fs.writeSync(fd, segBuf, 0, offset, 0);
      fs.closeSync(fd);
      percentage += uploader.PROGRESS_BINDING_SEGTREE_ / chrNum;
      database.updateProgress(db, bwFile, percentage, function(err) {
        if (err.error) {
          log.serverLog(err.error);
          callback(err);
        }
      });
    }

    // Update the progress to finish.
    database.updateProgress(db, bwFile, 100, function(err) {
      if (err.error) {
        callback(err);
      }
    });
    database.insertBindingChrs(db, bwFile, chrs, function(err) {
      if (err.error) {
        callback(err);
      }
    });
    log.serverLog('binding data separated.');
  });
};

/**
 * Sorts bed data segments and write it into separate files.
 * @param {string} prefix Folder to the bed files.
 * @param {string} bedFile File name of the bed file.
 * @param {!mongodb.Db} db The database object.
 * @param {function(*)} callback The callback function.
 */
uploader.bedSort = function(prefix, bedFile, db, callback) {
  var lines = readline.createInterface({
    input: fs.createReadStream(prefix + bedFile),
    terminal: false
  });
  log.serverLog('separating bed data...');
  var data = {};
  var percentage = 0;
  var chrNum = 0;
  var lineCount = 0;
  var cmd = [
    'wc',
    '-l',
    prefix + bedFile
  ].join(' ');
  var output = childProcess.execSync(cmd).toString().split(RegExp(/\s+/));
  var totalLine = parseInt(output[1], 10);
  var oneTenthLines = parseInt(totalLine / 10, 10);
  lines.on('line', function(line) {
    var parts = line.split('\t');
    if (parts[0].indexOf('track') != -1) {
      return;
    }
    if (!(parts[0] in data)) {
      data[parts[0]] = [];
      chrNum++;
    }
    data[parts[0]].push({
      chrStart: parseInt(parts[1], 10),
      chrEnd: parseInt(parts[2], 10),
      name: parts[3]
    });
    ++lineCount;
    if (lineCount % oneTenthLines == 0) {
      percentage += 0.1 * uploader.PROGRESS_BED_READ_;
      database.updateProgress(db, bedFile, percentage, function(err) {
        if (err.error) {
          callback(err);
        }
      });
    }
  });

  lines.on('close', function() {
    log.serverLog('writing bed data...');
    var folder = prefix + bedFile + '_chr';
    if (fs.existsSync(folder)) {
      var cmd = [
        'rm',
        '-r',
        folder
      ].join(' ');
      childProcess.execSync(cmd);
    }
    fs.mkdirSync(folder);
    for (var chr in data) {
      data[chr].sort(function(a, b) {
        if (a.chrStart == b.chrStart) {
          return a.chrEnd - b.chrEnd;
        }
        return a.chrStart - b.chrStart;
      });
      var chrFileName = folder + '/' + bedFile + '_' + chr;
      var fd = fs.openSync(chrFileName, 'w');
      for (var i = 0; i < data[chr].length; i++) {
        fs.writeSync(fd, data[chr][i].chrStart + '\t' + data[chr][i].chrEnd +
          '\t' + data[chr][i].name);
        if (i < data[chr].length - 1) {
          fs.writeSync(fd, '\n');
        }
      }
      fs.closeSync(fd);
      percentage += uploader.PROGRESS_BED_WRITE_ / chrNum;
      database.updateProgress(db, bedFile, percentage, function(err) {
        if (err.error) {
          callback(err);
        }
      });
    }

    // Update database to finish
    database.updateProgress(db, bedFile, 100, function(err) {
      if (err.error) {
        callback(err);
      }
    });
    log.serverLog('bed chromosome data finish.');
    callback({});
  });
};
