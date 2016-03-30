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

/**
 * @typedef {{
 *   email: string,
 *   username: string,
 *   password: string
 * }}
 */
genotet.UserInfo;

/** @const */
genotet.data = {};

/**
 * Data queries are sent to this address via http and received via jsonp.
 * @type {string}
 */
genotet.data.serverUrl;

/**
 * Data are uploaded to this Url by posting multipart form data.
 * @type {string}
 */
genotet.data.uploadUrl;

/**
 * Log queries are sent to this address.
 * @type {string}
 */
genotet.data.logUrl;

/**
 * User queries are sent to this address.
 * @type {string}
 */
genotet.data.userUrl;

/**
 * Url for queries for monitoring data processing.
 * @type {string}
 */
genotet.data.uploadProgressUrl;

/**
 * @typedef {!Array<{
 *   matrixName: string,
 *   fileName: string,
 *   description: string
 * }>}
 */
genotet.ListedExpression;

/**
 * @typedef {!Array<{
 *   networkName: string,
 *   fileName: string,
 *   description: string
 * }>}
 */
genotet.ListedNetwork;

/**
 * @typedef {!Array<{
 *   fileName: string,
 *   gene: string,
 *   chrs: string,
 *   description: string
 * }>}
 */
genotet.ListedBinding;

/**
 * @typedef {!Array<{
 *   bedName: string,
 *   description: string
 * }>}
 */
genotet.ListedBed;

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

/** @enum {string} */
genotet.data.ListQueryType = {
  NETWORK: 'list-network',
  EXPRESSION: 'list-expression',
  BINDING: 'list-binding',
  BED: 'list-bed',
  MAPPING: 'list-mapping'
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
    genotet.data.serverUrl = 'http://localhost:3000/genotet';
    genotet.data.progressUrl = 'http://localhost/genotet/progress.php';
  } else {
    genotet.data.serverUrl = window.location.protocol + '//' +
      window.location.hostname + ':3000/genotet';
    genotet.data.uploadProgressUrl = window.location.protocol + '//' +
      window.location.hostname + '/genotet/progress.php';
  }
  genotet.data.uploadUrl = genotet.data.serverUrl + '/upload';
  genotet.data.logUrl = genotet.data.serverUrl + '/log';
  genotet.data.userUrl = genotet.data.serverUrl + '/user';

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
  var params = {
    type: 'list-' + fileType
  };
  params = {data: JSON.stringify(params)};
  $.get(genotet.data.serverUrl, params, function(data) {
      genotet.data.files[fileType + 'Files'] = data;
      view.signal('updateFileListAfterLoading');
    }.bind(this))
    .fail(function() {
      genotet.error('failed to get file list', fileType);
    });
};
