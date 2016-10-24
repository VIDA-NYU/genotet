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

/**
 * Initializes the system components.
 * Run tests in the development environment.
 */
genotet.init = function() {
  genotet.url.init();
  genotet.data.init();
  genotet.panelManager.init();
  genotet.viewManager.init();
  genotet.linkManager.init();
  genotet.menu.init();
  genotet.options.init();
  genotet.tooltip.init();
  genotet.user.init();
  genotet.logger.init();
  genotet.dialog.init();

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
  genotet.logger.log(genotet.logger.Type.WARNING, msg);
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
  genotet.logger.log(genotet.logger.Type.ERROR, msg);
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
  genotet.logger.log(genotet.logger.Type.SUCCESS, msg);
  if (genotet.options.allowMessage) {
    $('.sys-success').text(msg).parent().slideDown();
  }
};
