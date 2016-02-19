/**
 * @fileoverview Specifications of the constant data values used by Genotet.
 */

'use strict';

/**
 * @typedef {{
 *   expressionFiles: genotet.ListedExpression,
 *   networkFiles: genotet.ListedNetwork,
 *   bindingFiles: genotet.ListedBinding,
 *   bedFiles: genotet.ListedBed,
 *   mappingFiles: !Array<string>
 * }}
 */
genotet.Files;

/** @const */
genotet.data = {};

/**
 * Data queries are sent to this address via http and received via jsonp.
 * @type {string}
 */
genotet.data.serverURL;

/**
 * Data are uploaded to this URL by posting multipart form data.
 * @type {string}
 */
genotet.data.uploadURL;

/**
 * Genes with expression data available in the Genotet system.
 * @type {!genotet.Files}
 */
genotet.data.files = {
  expressionFiles: [],
  networkFiles: [],
  bindingFiles: [],
  bedFiles: [],
  mappingFiles: []
};

/**
 * Binding data chromosomes. The array is created upon Data initialization.
 */
genotet.data.bindingChrs = [];

/**
 * Current organism.
 * @type {string}
 */
genotet.data.organism = 'th17';

/**
 * Current bed.
 * @type {string}
 */
genotet.data.bedName = 'bed_data.bed';

/**
 * Current TFA.
 * @type {string}
 */
genotet.data.tfaFileName = 'tfa.mat.tsv';

/**
 * Color scale from red to blue.
 * @type {!Array<string>}
 */
genotet.data.redBlueScale = ['#ab1e1e', 'gray', '#1e6eab'];

/**
 * Color scale from black to red to yellow.
 * @type {!Array<string>}
 */
genotet.data.redYellowScale = ['black', 'red', 'yellow'];

/**
 * Initializes Data properties.
 */
genotet.data.init = function() {
  if (window.location.protocol == 'file:') {
    // Testing environment
    genotet.data.serverURL = 'http://localhost:3000/genotet';
  } else {
    genotet.data.serverURL = window.location.protocol + '//' +
      window.location.hostname + ':3000/genotet';
  }
  genotet.data.uploadURL = genotet.data.serverURL + '/upload';

  for (var i = 0; i < 19; i++) {
    genotet.data.bindingChrs.push((i + 1).toString());
  }
  genotet.data.bindingChrs = genotet.data.bindingChrs.concat(['M', 'X', 'Y']);
};

/**
 * Loads file lists into genotet.data.
 * @param {genotet.View} view
 * @param {genotet.FileType} fileType
 * @this {genotet.Files}
 */
genotet.data.loadList = function(view, fileType) {
  switch (fileType) {
    case genotet.FileType.NETWORK:
      var params = {
        type: genotet.QueryType.LIST_NETWORK
      };
      $.get(genotet.data.serverURL, params, function(data) {
          genotet.data.files.networkFiles = [];
          data.forEach(function(dataInfo) {
            genotet.data.files.networkFiles.push(dataInfo);
          });
          view.signal('updateFileListAfterLoading');
      }.bind(this), 'jsonp')
        .fail(function() {
          genotet.error('failed to get network list');
        });
      break;
    case genotet.FileType.EXPRESSION:
      var params = {
        type: genotet.QueryType.LIST_EXPRESSION
      };
      $.get(genotet.data.serverURL, params, function(data) {
          genotet.data.files.expressionFiles = [];
          data.forEach(function(dataInfo) {
            genotet.data.files.expressionFiles.push(dataInfo);
          });
          view.signal('updateFileListAfterLoading');
        }.bind(this), 'jsonp')
        .fail(function() {
          genotet.error('failed to get expression list');
        });
      break;
    case genotet.FileType.BINDING:
      var params = {
        type: genotet.QueryType.LIST_BINDING
      };
      $.get(genotet.data.serverURL, params, function(data) {
          genotet.data.files.bindingFiles = [];
          data.forEach(function(dataInfo) {
            genotet.data.files.bindingFiles.push(dataInfo);
          });
          view.signal('updateTracksAfterLoading');
        }.bind(this), 'jsonp')
        .fail(function() {
          genotet.error('failed to get binding list');
        });
      break;
    case genotet.FileType.BED:
      break;
    case genotet.FileType.MAPPING:
      break;
  }
};
