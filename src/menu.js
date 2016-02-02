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
    genotet.preset.loadPreset('default');
  });
  $('#preset-network').click(function() {
    genotet.preset.loadPreset('network');
  });
  $('#preset-expression').click(function() {
    genotet.preset.loadPreset('expression');
  });
  $('#preset-binding').click(function() {
    genotet.preset.loadPreset('binding');
  });

  // Options section.
  // TODO(bowen): Add system options.
  $('#option-mapping').click(function() {
    genotet.dialog.create('choose-mapping');
  });

  // Help document.
  $('#doc').click(function() {
    window.open('doc.html');
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
