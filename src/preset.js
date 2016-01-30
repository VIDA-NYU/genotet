/**
 * @fileoverview Preset defines a set of preset view layouts.
 */

'use strict';

/** @const */
genotet.preset = {};

/**
 * Parameters for preset expression view.
 * @private @const {!genotet.ExpressionViewParams}
 */
genotet.preset.EXPRESSION_PARAMS_ = {
  fileName: 'expressionMatrix',
  isGeneRegex: true,
  isConditionRegex: true,
  geneInput: 'sig.*',
  conditionInput: 'si.*',
  isPreset: true
};
/**
 * Parameters for preset network view.
 * @private @const {!genotet.NetworkViewParams}
 */
genotet.preset.NETWORK_PARAMS_ = {
  fileName: 'th17.tsv',
  geneRegex: 'BATF|RORC|STAT3|IRF4|MAF',
  isPreset: true
};
/**
 * Parameters for preset binding view.
 * @private @const {!genotet.BindingViewParams}
 */
genotet.preset.BINDING_PARAMS_ = {
  fileNames: ['b6.bw'],
  bedName: 'bed_data.bed',
  chr: '1',
  isPreset: true
};
/**
 * Parameters for preset 3-track binding view.
 * @private @const {!genotet.BindingViewParams}
 */
genotet.preset.THREE_TRACK_BINDING_PARAMS_ = {
  fileNames: ['SL971_SL970', 'SL1851', 'SL10572_SL10566'],
  bedName: 'bed_data.bed',
  chr: '1',
  isPreset: true
};

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
      genotet.preset.createExpression_(genotet.preset.EXPRESSION_PARAMS_);
      genotet.preset.createNetwork_(genotet.preset.NETWORK_PARAMS_);
      genotet.preset.createBinding_(genotet.preset.BINDING_PARAMS_);
      break;
    case 'network':
      genotet.preset.createNetwork_(genotet.preset.NETWORK_PARAMS_);
      genotet.preset.createBinding_(genotet.preset.BINDING_PARAMS_);
      break;
    case 'expression':
      genotet.preset.createExpression_(genotet.preset.EXPRESSION_PARAMS_);
      genotet.preset.createNetwork_(genotet.preset.NETWORK_PARAMS_);
      break;
    case 'binding':
      genotet.preset.createExpression_(genotet.preset.EXPRESSION_PARAMS_);
      genotet.preset.createNetwork_(genotet.preset.NETWORK_PARAMS_);
      genotet.preset.createBinding_(genotet.preset.THREE_TRACK_BINDING_PARAMS_);
      break;
    default:
      genotet.error('unknown preset:', preset);
      return;
  }
};

/**
 * Create a preset expression view.
 * @param {!genotet.ExpressionViewParams} params
 * @private
 */
genotet.preset.createExpression_ = function(params) {
  genotet.viewManager.createView('expression', 'My Expression Matrix', params);
};

/**
 * Create a preset network view.
 * @param {!genotet.NetworkViewParams} params
 * @private
 */
genotet.preset.createNetwork_ = function(params) {
  genotet.viewManager.createView('network', 'My Network', params);
};

/**
 * Create a preset binding view.
 * @param {!genotet.BindingViewParams} params
 * @private
 */
genotet.preset.createBinding_ = function(params) {
  genotet.viewManager.createView('binding', 'My Genome Browser', params);
};
