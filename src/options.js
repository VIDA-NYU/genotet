/**
 * @fileoverview System options variables.
 */

'use strict';

/** @const */
genotet.options = {};

/**
 * Mapping files.
 * @type {!Object<string>}
 */
genotet.data.mappingFiles = {};

/**
 * Whether to allow the message bar to popup.
 * @type {boolean}
 */
genotet.options.allowMessage = true;

/**
 * Initializes the system options.
 */
genotet.options.init = function() {
};

/**
 * Toggles allow message option.
 */
genotet.options.toggleAllowMessage = function() {
  genotet.options.allowMessage = !genotet.options.allowMessage;
};
