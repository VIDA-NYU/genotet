/**
 * @fileoverview System options variables.
 */

'use strict';

var Options = {
  allowMessage: true,

  /**
   * Initializes the system options.
   */
  init: function() {
  },

  toggleAllowMessage: function() {
    this.allowMessage = !this.allowMessage;
  }
};
