'use strict';

var Menu = {

  init: function() {
    $('#view-create').click(function() {
      Dialog.create('create-view');
    });
    /*
    $('#view-link').click(function() {
      return;
    });
    $('#view-unlink').click(function() {
      return;
    });
    $('#view-group').click(function() {
      return;
    });
    */
    $('#view-closeall').click(function() {
      ViewManager.closeAllViews();
    });

    $('#preset-default').click(function() {
      Preset.loadPreset('default');
    });
    $('#preset-network').click(function() {
      Preset.loadPreset('network');
    });
    $('#preset-expression').click(function() {
      Preset.loadPreset('expression');
    });
    $('#preset-binding').click(function() {
      Preset.loadPreset('binding');
    });

    $('#help').click(function() {
      Options.toggleAllowAlert();
    });

    $('#organism').click(function() {
      Dialog.create('organism');
    });
  }
};
