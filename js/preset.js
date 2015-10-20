/**
 * @fileoverview Preset defines a set of preset view layouts.
 */

var Preset = {
  /**
   * Loads a preset with the given name.
   * @param {string} preset
   */
  loadPreset: function(preset) {
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
      Core.error('unknown preset:', preset);
      return;
    }
  }
};