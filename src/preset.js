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
  tfaFileName: 'tfa.matrix2.bin',
  isGeneRegex: true,
  isConditionRegex: true,
  geneInput: 'sig.*',
  conditionInput: 'si.*'
};
/**
 * Parameters for preset network view.
 * @private @const {!genotet.NetworkViewParams}
 */
genotet.preset.NETWORK_PARAMS_ = {
  fileName: 'th17.tsv',
  geneRegex: 'BATF|RORC|STAT3|IRF4|MAF'
};
/**
 * Parameters for preset binding view.
 * @private @const {!genotet.BindingViewParams}
 */
genotet.preset.BINDING_PARAMS_ = {
  fileNames: ['SL971_SL970'],
  bedName: 'bed_data.bed',
  chr: '1',
  multipleTracks: true
};
/**
 * Parameters for preset 3-track binding view.
 * @private @const {!genotet.BindingViewParams}
 */
genotet.preset.THREE_TRACK_BINDING_PARAMS_ = {
  fileNames: ['SL971_SL970', 'SL1851', 'SL10572_SL10566'],
  bedName: 'bed_data.bed',
  chr: '1',
  multipleTracks: true
};

/**
 * Name for preset expression view.
 * @private @const {string}
 */
genotet.preset.EXPRESSION_NAME_ = 'My Expression Matrix';
/**
 * Name for preset network view.
 * @private @const {string}
 */
genotet.preset.NETWORK_NAME_ = 'My Network';
/**
 * Name for preset binding view.
 * @private @const {string}
 */
genotet.preset.BINDING_NAME_ = 'My Genome Browser';
/**
 * Name for preset 3-track binding view.
 * @private @const {string}
 */
genotet.preset.THREE_TRACK_BINDING_NAME_ = 'My 3-Track Genome Browser';

/**
 * Loads a preset with the given name.
 * @param {string} preset
 */
genotet.preset.loadPreset = function(preset) {
  genotet.viewManager.closeAllViews();
  var expressionType = 'expression';
  var networkType = 'network';
  var bindingType = 'binding';

  if (!preset) {
    preset = 'default';
  }
  switch (preset) {
    case 'default':
      genotet.preset.createView_(expressionType,
        genotet.preset.EXPRESSION_NAME_, genotet.preset.EXPRESSION_PARAMS_);
      genotet.preset.createView_(networkType,
        genotet.preset.NETWORK_NAME_, genotet.preset.NETWORK_PARAMS_);
      genotet.preset.createView_(bindingType,
        genotet.preset.BINDING_NAME_, genotet.preset.BINDING_PARAMS_);
      break;
    case 'network':
      genotet.preset.createView_(networkType,
        genotet.preset.NETWORK_NAME_, genotet.preset.NETWORK_PARAMS_);
      genotet.preset.createView_(bindingType,
        genotet.preset.BINDING_NAME_, genotet.preset.BINDING_PARAMS_);
      break;
    case 'expression':
      genotet.preset.createView_(expressionType,
        genotet.preset.EXPRESSION_NAME_, genotet.preset.EXPRESSION_PARAMS_);
      genotet.preset.createView_(networkType,
        genotet.preset.NETWORK_NAME_, genotet.preset.NETWORK_PARAMS_);
      break;
    case 'binding':
      genotet.preset.createView_(expressionType,
        genotet.preset.EXPRESSION_NAME_, genotet.preset.EXPRESSION_PARAMS_);
      genotet.preset.createView_(networkType,
        genotet.preset.NETWORK_NAME_, genotet.preset.NETWORK_PARAMS_);
      genotet.preset.createView_(bindingType,
        genotet.preset.THREE_TRACK_BINDING_NAME_,
        genotet.preset.THREE_TRACK_BINDING_PARAMS_);
      break;
    default:
      genotet.error('unknown preset:', preset);
      return;
  }
};

/**
 * Creates a preset view.
 * @param {string} type Type for preset view.
 * @param {string} viewName Name for preset view.
 * @param {!genotet.ExpressionViewParams|!genotet.NetworkViewParams|
 *   !genotet.BindingViewParams} params
 * @private
 */
genotet.preset.createView_ = function(type, viewName, params) {
  genotet.viewManager.createView(type, viewName, params);
  genotet.linkManager.presetStatus.push(viewName);
};
