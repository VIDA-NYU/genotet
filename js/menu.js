'use strict';

var Menu = {

  init: function() {
    $('#view-create').click(function() {
      return;
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
      createMenu();
    });

    $('#preset-default').click(function() {
      manager.loadPreset('default');
    });
    $('#preset-network').click(function() {
      manager.loadPreset('network');
    });
    $('#preset-expression').click(function() {
      manager.loadPreset('expmat');
    });
    $('#preset-binding').click(function() {
      manager.loadPreset('binding_3');
    });

    $('#help').click(function() {
      Options.toggleAllowAlert();
    });
  }
};
