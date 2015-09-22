'use strict';

var Menu = {

  init: function() {
    $('#view-create').click(function() {
      Dialog.create('');
    });
    $('#view-link').click(function() {
      return;
    });
    $('#view-unlink').click(function() {
      return;
    });
    $('#view-group').click(function() {
      return;
    });
    $('#view-close').click(function() {
      closeAllViews();
    });

    $('#preset-default').click(function() {
      ViewManager.loadPreset('default');
    });
    $('#preset-network').click(function() {
      ViewManager.loadPreset('network');
    });
    $('#preset-expression').click(function() {
      ViewManager.loadPreset('expmat');
    });
    $('#preset-binding').click(function() {
      ViewManager.loadPreset('binding_3');
    });

    $('#help').click(function() {
      Options.toggleAllowAlert();
    });
  }
};
