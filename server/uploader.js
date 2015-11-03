/**
 * @fileoverview upload function handler
 */

'use strict'

var path;
var fs = require('fs');
var multer = require('multer');

var utils = require('./utils');
var binding = require('./binding');

var upload = multer();

module.exports = {

  /**
   * Upload a file or a directory to server.
   * @param req {Object} Including query parameders.
   * @param res (Object} Response.
   * @param wiggleAddr {String} Wiggle data directory to upload to.
   * @param networkAddr {String} Network Data directory to upload to.
   * @param expmatAddr {String} Expression Matrix data directory to upload to.
   * @returns {!Object} Success or not as a JS Object.
   */
  uploadFile: function(req, wiggleAddr, networkAddr, expmatAddr) {

    var fileType = req.type;

    var fullPath;
		if (fileType == 'network') {
			fullPath = networkAddr;
		} else if (fileType == 'wiggle') {
			fullPath = wiggleAddr;
		} else if (fileType == 'expmat') {
			fullPath = expmatAddr;
		}

    var isFinish = true;
    if (req.folder != null) {
      fs.mkdirSync(fullPath + req.folder);
      upload = multer({dest: fullPath + req.folder});
      upload(req);
    } else {
      upload = multer({dest: fullPath});
      upload(req);
    }

    if (!isFinish)
      return {
        success: 'false'
      };
    if (fileType == 'wiggle') {
      var dataPath = fullPath + req.query.filename;
      var files = fs.readdirSync(dataPath);
      for (var i = 0; i < files.length; i++) {
        binding.loadHistogram(dataPath + files[i]);
      }
    } else if (fileType == 'network') {

    } else if (fileType == 'expmat') {

    }
    return {
      success: 'true'
    };
  }
	
};
