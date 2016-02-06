/**
 * @fileoverview Preset defines a set of preset view layouts.
 */

'use strict';

/** @const */
genotet.preset = {};

/**
 * Parameters for preset network view.
 * @private @const {!genotet.NetworkViewParams}
 */
genotet.preset.NETWORK_PARAMS_ = {
  fileName: 'th17.tsv',
  inputGenes: 'BATF|RORC|STAT3|IRF4|MAF',
  isRegex: true
};
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
 * Name for preset network view.
 * @private @const {string}
 */
genotet.preset.NETWORK_NAME_ = 'My Network';
/**
 * Name for preset expression view.
 * @private @const {string}
 */
genotet.preset.EXPRESSION_NAME_ = 'My Expression Matrix';
/**
 * Name for preset binding view.
 * @private @const {string}
 */
genotet.preset.BINDING_NAME_ = 'My Genome Browser';
/**
 * Name for preset 3-track binding view.
 * @private @const {string}
 */
genotet.preset.THREE_TRACK_BINDING_NAME_ = 'My 3 Tracks Genome Browser';

/**
 * Settings for link preset views.
 * This part will be extended to user self-defined in next version.
 * @const {!Object<!Array<!genotet.LinkSetting>>}
 * */
genotet.preset.LINK_SETTINGS = {
  'default': [
    {
      source: 'My Network',
      action: 'nodeClick',
      target: 'My Expression Matrix',
      response: 'addProfile'
    },
    {
      source: 'My Network',
      action: 'edgeClick',
      target: 'My Expression Matrix',
      response: 'addProfile'
    },
    {
      source: 'My Network',
      action: 'nodeClick',
      target: 'My Genome Browser',
      response: 'updateTrack'
    },
    {
      source: 'My Network',
      action: 'nodeClick',
      target: 'My Genome Browser',
      response: 'locus'
    },
    {
      source: 'My Network',
      action: 'edgeClick',
      target: 'My Genome Browser',
      response: 'updateTrack'
    },
    {
      source: 'My Network',
      action: 'edgeClick',
      target: 'My Genome Browser',
      response: 'locus'
    }
  ],
  network: [
    {
      source: 'My Network',
      action: 'nodeClick',
      target: 'My Genome Browser',
      response: 'updateTrack'
    },
    {
      source: 'My Network',
      action: 'nodeClick',
      target: 'My Genome Browser',
      response: 'locus'
    },
    {
      source: 'My Network',
      action: 'edgeClick',
      target: 'My Genome Browser',
      response: 'updateTrack'
    },
    {
      source: 'My Network',
      action: 'edgeClick',
      target: 'My Genome Browser',
      response: 'locus'
    }
  ],
  expression: [
    {
      source: 'My Network',
      action: 'nodeClick',
      target: 'My Expression Matrix',
      response: 'addProfile'
    },
    {
      source: 'My Network',
      action: 'edgeClick',
      target: 'My Expression Matrix',
      response: 'addProfile'
    }
  ],
  binding: [
    {
      source: 'My Network',
      action: 'nodeClick',
      target: 'My Expression Matrix',
      response: 'addProfile'
    },
    {
      source: 'My Network',
      action: 'edgeClick',
      target: 'My Expression Matrix',
      response: 'addProfile'
    },
    {
      source: 'My Network',
      action: 'nodeClick',
      target: 'My 3 Tracks Genome Browser',
      response: 'updateTrack'
    },
    {
      source: 'My Network',
      action: 'nodeClick',
      target: 'My 3 Tracks Genome Browser',
      response: 'locus'
    },
    {
      source: 'My Network',
      action: 'edgeClick',
      target: 'My 3 Tracks Genome Browser',
      response: 'updateTrack'
    },
    {
      source: 'My Network',
      action: 'edgeClick',
      target: 'My 3 Tracks Genome Browser',
      response: 'locus'
    }
  ]
};

/**
 * Loads a preset with the given name.
 * @param {string} preset
 */
genotet.preset.loadPreset = function(preset) {
  genotet.viewManager.closeAllViews();
  var expressionType = genotet.data.VIEW_TYPES.expressionType;
  var networkType = genotet.data.VIEW_TYPES.networkType;
  var bindingType = genotet.data.VIEW_TYPES.bindingType;

  if (!preset) {
    preset = 'default';
  }
  switch (preset) {
    case 'default':
      genotet.preset.createView_(networkType,
        genotet.preset.NETWORK_NAME_, genotet.preset.NETWORK_PARAMS_);
      genotet.preset.createView_(expressionType,
        genotet.preset.EXPRESSION_NAME_, genotet.preset.EXPRESSION_PARAMS_);
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
      genotet.preset.createView_(networkType,
        genotet.preset.NETWORK_NAME_, genotet.preset.NETWORK_PARAMS_);
      genotet.preset.createView_(expressionType,
        genotet.preset.EXPRESSION_NAME_, genotet.preset.EXPRESSION_PARAMS_);
      break;
    case 'binding':
      genotet.preset.createView_(networkType,
        genotet.preset.NETWORK_NAME_, genotet.preset.NETWORK_PARAMS_);
      genotet.preset.createView_(expressionType,
        genotet.preset.EXPRESSION_NAME_, genotet.preset.EXPRESSION_PARAMS_);
      genotet.preset.createView_(bindingType,
        genotet.preset.THREE_TRACK_BINDING_NAME_,
        genotet.preset.THREE_TRACK_BINDING_PARAMS_);
      break;
    default:
      genotet.error('unknown preset:', preset);
      return;
  }
  genotet.linkManager.registerAllViews(
    genotet.preset.LINK_SETTINGS[preset]);
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
};
