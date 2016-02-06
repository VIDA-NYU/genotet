/**
 * @fileoverview Specifications of the constant data values used by Genotet.
 */

'use strict';

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
 * Genes with binding data available in the Genotet system.
 * @type {!Array}
 */
genotet.data.bindingFiles = [];

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
