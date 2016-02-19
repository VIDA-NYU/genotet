/**
 * @fileoverview Genotet core object that contains the main entry of the system.
 */

'use strict';

// System entry.
$(document).ready(function() {
  genotet.init();
});

/** @const */
var genotet = {};

/**
 * Test extern.
 */
genotet.test = function() {};

/** @enum {string} */
genotet.FileType = {
  NETWORK: 'network',
  EXPRESSION: 'expression',
  BINDING: 'binding',
  BED: 'bed',
  MAPPING: 'mapping'
};

/** @enum {string} */
genotet.ViewType = {
  NETWORK: 'network',
  EXPRESSION: 'expression',
  BINDING: 'binding'
};

/** @enum {string} */
genotet.QueryType = {
  NETWORK: 'network',
  NETWORK_INFO: 'network-info',
  INCIDENT_EDGES: 'incident-edges',
  COMBINED_REGULATION: 'combined-regulation',
  INCREMENTAL_EDGES: 'incremental-edges',
  BINDING: 'binding',
  EXONS: 'exons',
  LOCUS: 'locus',
  EXPRESSION: 'expression',
  EXPRESSION_INFO: 'expression-info',
  TFA_PROFILE: 'tfa-profile',
  BED: 'bed',
  MAPPING: 'mapping',
  LIST_NETWORK: 'list-network',
  LIST_BINDING: 'list-binding',
  LIST_EXPRESSION: 'list-expression',
  LIST_BED: 'list-bed',
  LIST_MAPPING: 'list-mapping'
};

/** @enum {string} */
genotet.PresetType = {
  DEFAULT: 'default',
  NETWORK: 'network',
  EXPRESSION: 'expression',
  BINDING: 'binding'
};

/**
 * Initializes the system components.
 * Run tests in the development environment.
 */
genotet.init = function() {
  //Welcome.init();
  genotet.data.init();
  genotet.panelManager.init();
  genotet.viewManager.init();
  genotet.linkManager.init();
  genotet.menu.init();
  genotet.options.init();
  genotet.tooltip.init();

  if (genotet.test) {
    genotet.test();
  }
};

/**
 * Displays a user visible warning message at the top of the screen.
 * @param {...*} var_msgs
 */
genotet.warning = function(var_msgs) {
  var msg = Array.prototype.slice.call(arguments).join(' ');
  console.warn(msg);
  if (genotet.options.allowMessage) {
    $('.sys-warning').text(msg).parent().slideDown();
  }
};

/**
 * Displays a user visible error message at the top of the screen.
 * @param {...*} var_msgs
 */
genotet.error = function(var_msgs) {
  var msg = Array.prototype.slice.call(arguments).join(' ');
  console.error(msg);
  if (genotet.options.allowMessage) {
    $('.sys-error').text(msg).parent().slideDown();
  }
};

/**
 * Displays a user visible success message at the top of the screen.
 * @param {...*} var_msgs
 */
genotet.success = function(var_msgs) {
  var msg = Array.prototype.slice.call(arguments).join(' ');
  console.info(msg);
  if (genotet.options.allowMessage) {
    $('.sys-success').text(msg).parent().slideDown();
  }
};
