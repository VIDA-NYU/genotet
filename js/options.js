/**
 * @fileoverview System options variables.
 */

'use strict';

var Options = {
  allowAlert: true,

  init: function() {

  },

  toggleAllowAlert: function() {
    this.allowAlert = !this.allowAllert;
  },

  alert: function(msg) {
    if (this.allowAlert) {
      alert(msg);
    }
  }
};
