/**
 * @fileoverview Preset defines a set of preset view layouts.
 */

'use strict';

/**
 * @typedef {{
 *   fileName: string,
 *   isGeneRegex: boolean,
 *   isConditionRegex: boolean,
 *   geneInput: string,
 *   conditionInput: string
 * }}
 */
genotet.ExpressionParams;

/**
 * @typedef {{
 *   fileName: string,
 *   geneRegex: string
 * }}
 */
genotet.NetworkParams;

/**
 * @typedef {{
 *   fileName: !Array<string>,
 *   bedName: string,
 *   chr: string
 * }}
 */
genotet.BindingParams;

/** @const */
genotet.preset = {};

/**
 * Parameters for preset expression view.
 * @private @const {!genotet.ExpressionParams}
 */
genotet.preset.EXPRESSION_PARAMS_ = {
  fileName: 'expressionMatrix',
  isGeneRegex: true,
  isConditionRegex: true,
  geneInput: 'sig.*',
  conditionInput: 'si.*'
};
/**
 * Parameters for preset network view.
 * @private @const {!genotet.NetworkParams}
 */
genotet.preset.NETWORK_PARAMS_ = {
  fileName: 'meishei.tsv',
  geneRegex: 'BATF|RORC|STAT3|IRF4|MAF'
};
/**
 * Parameters for preset binding view.
 * @private @const {!genotet.BindingParams}
 */
genotet.preset.BINDING_PARAMS_ = {
  fileName: ['b6.bw'],
  bedName: 'bed_data.bed',
  chr: '1'
};
/**
 * Parameters for preset 3-track binding view.
 * @private @const {!genotet.BindingParams}
 */
genotet.preset.THREE_TRACK_BINDING_PARAMS_ = {
  fileName: ['b6.bw', 'b6.bw', 'b6.bw'],
  bedName: 'bed_data.bed',
  chr: '1'
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
 * @param {!genotet.ExpressionParams} params
 * @private
 */
genotet.preset.createExpression_ = function(params) {
  genotet.viewManager.createView('expression', 'My Expression Matrix', {
    fileName: params.fileName,
    isGeneRegex: params.isGeneRegex,
    isConditionRegex: params.isConditionRegex,
    geneInput: params.geneInput,
    conditionInput: params.conditionInput
  });
};

/**
 * Create a preset network view.
 * @param {!genotet.NetworkParams} params
 * @private
 */
genotet.preset.createNetwork_ = function(params) {
  genotet.viewManager.createView('network', 'My Network', {
    fileName: params.fileName,
    geneRegex: params.geneRegex
  });
};

/**
 * Create a preset binding view.
 * @param {!genotet.BindingParams} params
 * @private
 */
genotet.preset.createBinding_ = function(params) {
  genotet.viewManager.createView('binding', 'My Genome Browser', {
    fileName: params.fileName,
    bedName: params.bedName,
    chr: params.chr
  });
};
