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
genotet.data.serverURL = window.location.protocol +
  window.location.hostname + ':3000/genotet';

/**
 * Data are uploaded to this URL by posting multipart form data.
 * @type {string}
 */
genotet.data.uploadURL = window.location.protocol +
  window.location.hostname + ':3000/genotet/upload';

/**
 * Genes with binding data available in the Genotet system.
 * TODO(bowen): Create the array upon organism selection,
 *     retrieve gene list from server.
 * @type {!Array<string>}
 */
genotet.data.bindingGenes = [
  'BATF', 'IRF4', 'MAF', 'RORC', 'STAT3', 'Hif1a', 'Etv6', 'Jmjd3',
  'BATF-Th0', 'BATF-Th17', 'cMaf-Th0', 'cMaf-Th17', 'Fosl2-Th0', 'Fosl2-Th17',
  'IRF4-Th0', 'IRF4-Th17', 'p300-Th0', 'p300-Th17', 'RORg-Th0', 'RORg-Th17',
  'STAT3-Th0', 'STAT3-Th17', 'RNA-Seq-1h', 'RNA-Seq-3h', 'RNA-Seq-6h',
  'RNA-Seq-9h', 'RNA-Seq-16h', 'RNA-Seq-24h', 'RNA-Seq-48h',
  'FAIRE-Seq-IRF4+', 'FAIRE-Seq-IRF4-', 'FAIRE-Seq-Batf+', 'FAIRE-Seq-Batf-'
];

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
genotet.data.redYellowScale = ['black', 'red', 'yellow'];

/**
 * Initializes Data properties.
 */
genotet.data.init = function() {
  for (var i = 0; i < 19; i++) {
    genotet.data.bindingChrs.push((i + 1).toString());
  }
  genotet.data.bindingChrs = genotet.data.bindingChrs.concat(['M', 'X', 'Y']);
};
