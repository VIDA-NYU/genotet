/**
 * @fileoverview Preset defines a set of preset view layouts.
 */

'use strict';

/** @const */
genotet.preset = {};

/**
 * Loads a preset with the given name.
 * @param {string} preset
 */
genotet.preset.loadPreset = function(preset) {
  if (!preset) {
    preset = 'default';
  }

  switch (preset) {
    case 'default':
      break;
    case 'network':
      break;
    case 'expression':
      break;
    case 'binding':
      break;
    default:
      genotet.error('unknown preset:', preset);
      return;
  }
};
