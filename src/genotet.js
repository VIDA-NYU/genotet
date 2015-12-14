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
 * Initializes the system components.
 * Run tests in the development environment.
 */
genotet.init = function() {
  //Welcome.init();
  genotet.data.init();
  genotet.panelManager.init();
  genotet.viewManager.init();
  genotet.menu.init();
  genotet.options.init();
  genotet.tooltip.init();

  genotet.test.run();
};

/**
 * Displays a user visible warning message at the top of the screen.
 */
genotet.warning = function() {
  var msg = Array.prototype.slice.call(arguments).join(' ');
  console.warn(msg);
  if (genotet.options.allowMessage) {
    $('#warning').text(msg).parent().slideDown();
  }
};

/**
 * Displays a user visible error message at the top of the screen.
 */
genotet.error = function() {
  var msg = Array.prototype.slice.call(arguments).join(' ');
  console.error(msg);
  if (genotet.options.allowMessage) {
    $('#error').text(msg).parent().slideDown();
  }
};

/**
 * Displays a user visible success message at the top of the screen.
 */
genotet.success = function() {
  var msg = Array.prototype.slice.call(arguments).join(' ');
  console.info(msg);
  if (genotet.options.allowMessage) {
    $('#success').text(msg).parent().slideDown();
  }
};
