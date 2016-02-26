/**
 * @fileoverview Genotet menu (navbar).
 */

'use strict';

/** @const */
genotet.menu = {};

/**
 * Initializes the system menu.
 */
genotet.menu.init = function() {
  // View section.
  $('#view-create').click(function() {
    genotet.dialog.create('create-view');
  });
  $('#view-closeall').click(function() {
    genotet.viewManager.closeAllViews();
  });

  // Preset section.
  $('#preset-default').click(function() {
    genotet.preset.loadPreset(genotet.preset.PresetType.DEFAULT);
  });
  $('#preset-network').click(function() {
    genotet.preset.loadPreset(genotet.preset.PresetType.NETWORK);
  });
  $('#preset-expression').click(function() {
    genotet.preset.loadPreset(genotet.preset.PresetType.EXPRESSION);
  });
  $('#preset-binding').click(function() {
    genotet.preset.loadPreset(genotet.preset.PresetType.BINDING);
  });

  // Options section.
  // TODO(bowen): Add system options.
  $('#mapping').click(function() {
    genotet.dialog.create('mapping');
  });

  // Help document.
  $('#about').click(function() {
    genotet.dialog.create('about');
  });

  // Organism selection.
  $('#organism').click(function() {
    genotet.dialog.create('organism');
  });

  // Upload data.
  $('#upload').click(function() {
    genotet.dialog.create('upload');
  });
};
