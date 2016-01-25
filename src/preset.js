/**
 * @fileoverview Preset defines a set of preset view layouts.
 */

'use strict';

/** @const */
genotet.preset = {};

/** @private @const {number} */
genotet.preset.DEFAULT_TRACK_NUMBER_ = 1;
/** @private @const {number} */
genotet.preset.BINDING_TRACK_NUMBER_ = 3;

/**
 * Loads a preset with the given name.
 * @param {string} preset
 */
genotet.preset.loadPreset = function(preset) {
  genotet.viewManager.closeAllViews();

  if (!preset) {
    preset = 'default';
  }
  switch (preset) {
    case 'default':
      genotet.preset.createExpression_();
      genotet.preset.createNetwork_();
      genotet.preset.createBinding_(genotet.preset.DEFAULT_TRACK_NUMBER_);
      break;
    case 'network':
      genotet.preset.createNetwork_();
      genotet.preset.createBinding_(genotet.preset.DEFAULT_TRACK_NUMBER_);
      break;
    case 'expression':
      genotet.preset.createExpression_();
      genotet.preset.createNetwork_();
      break;
    case 'binding':
      genotet.preset.createExpression_();
      genotet.preset.createNetwork_();
      genotet.preset.createBinding_(genotet.preset.BINDING_TRACK_NUMBER_);
      break;
    default:
      genotet.error('unknown preset:', preset);
      return;
  }
};

/**
 * Create a preset expression view.
 * @private
 */
genotet.preset.createExpression_ = function() {
  genotet.viewManager.createView('expression', 'My Expression Matrix', {
    fileName: 'expressionMatrix',
    isGeneRegex: true,
    isConditionRegex: true,
    geneInput: 'sig.*',
    conditionInput: 'si.*'
  });
};

/**
 * Create a preset network view.
 * @private
 */
genotet.preset.createNetwork_ = function() {
  genotet.viewManager.createView('network', 'My Network', {
    fileName: 'meishei.tsv',
    geneRegex: 'BATF|RORC|STAT3|IRF4|MAF'
  });
};

/**
 * Create a preset binding view.
 * @param {number} numTracks Number of tracks.
 * @private
 */
genotet.preset.createBinding_ = function(numTracks) {
  genotet.viewManager.createView('binding', 'My Genome Browser', {
    fileName: 'b6.bw',
    bedName: 'bed_data.bed',
    chr: '1',
    numTracks: numTracks
  });
};
