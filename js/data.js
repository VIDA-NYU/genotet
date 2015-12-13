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
genotet.data.serverURL = 'http://localhost:3000/genotet';

/**
 * Data are uploaded to this URL by posting multipart form data.
 * @type {string}
 */
genotet.data.uploadURL = 'http://localhost:3000/genotet/upload';

/**
 * Genes with binding data available in the Genotet system.
 * TODO(bowen): Create the array upon organism selection,
 *     retrieve gene list from server.
 * @type {!Array<string>}
 */
genotet.data.bindingGenes = [];

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
 * @type {!d3.scale}
 */
genotet.data.redBlueScale = ['#ab1e1e', 'gray', '#1e6eab'];

/**
 * Color scale from black to red to yellow.
 * @type {!d3.scale}
 */
genotet.data.redYellowScale = ["black", "red", "yellow"];

/**
 * Initializes Data properties.
 */
genotet.data.init = function() {
  for (var i = 0; i < 19; i++) {
    this.bindingChrs.push((i + 1).toString());
  }
  this.bindingChrs = this.bindingChrs.concat(['M', 'X', 'Y']);
};
