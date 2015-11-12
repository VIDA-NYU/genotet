'use strict';

var Menu = {
  /**
   * Initializes the system menu.
   */
  init: function() {
    // View section.
    $('#view-create').click(function() {
      Dialog.create('create-view');
    });
    $('#view-closeall').click(function() {
      ViewManager.closeAllViews();
    });

    // Preset section.
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

    // Options section.
    // TODO(bowen): Add system options.
    $('#option-alert').click(function() {
      Options.toggleAllowAlert();
    });

    // Help document.
    $('#help').click(function() {
      window.open('help.html');
    });

    // Organism selection.
    $('#organism').click(function() {
      Dialog.create('organism');
    });

    // Upload data.
    $('#upload').click(function() {
      Dialog.create('upload');
    });

    /*
    // TODO(bowen): View linking and grouping are obsolete.
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
  }
};
