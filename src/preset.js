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
  genotet.viewManager.closeAllViews();

  if (!preset) {
    preset = 'default';
  }
  switch (preset) {
    case 'default':
      genotet.preset.createExpression_();
      genotet.preset.createNetwork_();
      genotet.preset.createBinding_();
      break;
    case 'network':
      genotet.preset.createNetwork_();
      genotet.preset.createBinding_();
      break;
    case 'expression':
      genotet.preset.createExpression_();
      genotet.preset.createNetwork_();
      break;
    case 'binding':
      genotet.preset.createExpression_();
      genotet.preset.createNetwork_();
      genotet.preset.createBinding_();
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
 * @private
 */
genotet.preset.createBinding_ = function() {
  genotet.viewManager.createView('binding', 'My Genome Browser', {
    fileName: 'b6.bw',
    bedName: 'bed_data.bed',
    chr: '1'
  });
};
