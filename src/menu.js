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

  // Sign in, sign up and log out.
  $('#sign-in').click(function() {
    genotet.dialog.create('sign-in');
  });
  $('#sign-up').click(function() {
    genotet.dialog.create('sign-up');
  });
  $('#log-out').click(function() {
    genotet.dialog.create('log-out');
  });
};

/**
 * Display the username for signed user in the system menu.
 * @param {string} username Username for signed user.
 */
genotet.menu.displaySignedUser = function(username) {
  $('#username').text(username);
  $('#log-out').css('display', 'inline-block');
  $('#sign-in').css('display', 'none');
  $('#sign-up').css('display', 'none');
};

/**
 * Display the sign-in and sign-up interface for unsigned user in the system
 * menu.
 */
genotet.menu.displaySignInterface = function() {
  $('#username').text('');
  $('#log-out').css('display', 'none');
  $('#sign-in').css('display', 'inline-block');
  $('#sign-up').css('display', 'inline-block');
};
