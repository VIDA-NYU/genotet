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
  fileName: 'th17-link.tsv',
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
  fileNames: 'SL971_SL970',
  bedName: 'bed_data.bed',
  chr: '1',
  multipleTracks: false
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
 * Settings for link preset views.
 * TODO(Liana): This part will be extended to user self-defined in next
 * version.
 * @const {!Object<!Object<{
 *   views: !Array<{
 *     viewName: string,
 *     viewType: string,
 *     params: (genotet.NetworkViewParams|genotet.ExpressionViewParams|
 *     genotet.BindingViewParams)
 *   }>,
 *   links: !Array<!genotet.LinkDef>
 * }>>}
 * */
genotet.preset.PRESETS = {
  'default': {
    views: [
      {
        viewName: 'My Network',
        viewType: 'network',
        params: genotet.preset.NETWORK_PARAMS_
      },
      {
        viewName: 'My Expression Matrix',
        viewType: 'expression',
        params: genotet.preset.EXPRESSION_PARAMS_
      },
      {
        viewName: 'My Genome Browser',
        viewType: 'binding',
        params: genotet.preset.BINDING_PARAMS_
      }
    ],
    links: [
      {
        sourceViewName: 'My Network',
        action: 'nodeClick',
        targetViewName: 'My Expression Matrix',
        response: 'addProfile'
      },
      {
        sourceViewName: 'My Network',
        action: 'edgeClick',
        targetViewName: 'My Expression Matrix',
        response: 'addProfile'
      },
      {
        sourceViewName: 'My Network',
        action: 'nodeClick',
        targetViewName: 'My Genome Browser',
        response: 'updateTrack'
      },
      {
        sourceViewName: 'My Network',
        action: 'nodeClick',
        targetViewName: 'My Genome Browser',
        response: 'locus'
      },
      {
        sourceViewName: 'My Network',
        action: 'edgeClick',
        targetViewName: 'My Genome Browser',
        response: 'updateTrack'
      },
      {
        sourceViewName: 'My Network',
        action: 'edgeClick',
        targetViewName: 'My Genome Browser',
        response: 'locus'
      }
    ]
  },
  network: {
    views: [
      {
        viewName: 'My Network',
        viewType: 'network',
        params: genotet.preset.NETWORK_PARAMS_
      },
      {
        viewName: 'My Genome Browser',
        viewType: 'binding',
        params: genotet.preset.BINDING_PARAMS_
      }
    ],
    links: [
      {
        sourceViewName: 'My Network',
        action: 'nodeClick',
        targetViewName: 'My Genome Browser',
        response: 'updateTrack'
      },
      {
        sourceViewName: 'My Network',
        action: 'nodeClick',
        targetViewName: 'My Genome Browser',
        response: 'locus'
      },
      {
        sourceViewName: 'My Network',
        action: 'edgeClick',
        targetViewName: 'My Genome Browser',
        response: 'updateTrack'
      },
      {
        sourceViewName: 'My Network',
        action: 'edgeClick',
        targetViewName: 'My Genome Browser',
        response: 'locus'
      }
    ]
  },
  expression: {
    views: [
      {
        viewName: 'My Network',
        viewType: 'network',
        params: genotet.preset.NETWORK_PARAMS_
      },
      {
        viewName: 'My Expression Matrix',
        viewType: 'expression',
        params: genotet.preset.EXPRESSION_PARAMS_
      }
    ],
    links: [
      {
        sourceViewName: 'My Network',
        action: 'nodeClick',
        targetViewName: 'My Expression Matrix',
        response: 'addProfile'
      },
      {
        sourceViewName: 'My Network',
        action: 'edgeClick',
        targetViewName: 'My Expression Matrix',
        response: 'addProfile'
      }
    ]
  },
  binding: {
    views: [
      {
        viewName: 'My Network',
        viewType: 'network',
        params: genotet.preset.NETWORK_PARAMS_
      },
      {
        viewName: 'My Expression Matrix',
        viewType: 'expression',
        params: genotet.preset.EXPRESSION_PARAMS_
      },
      {
        viewName: 'My Genome Browser',
        viewType: 'binding',
        params: genotet.preset.THREE_TRACK_BINDING_PARAMS_
      }
    ],
    links: [
      {
        sourceViewName: 'My Network',
        action: 'nodeClick',
        targetViewName: 'My Expression Matrix',
        response: 'addProfile'
      },
      {
        sourceViewName: 'My Network',
        action: 'edgeClick',
        targetViewName: 'My Expression Matrix',
        response: 'addProfile'
      },
      {
        sourceViewName: 'My Network',
        action: 'nodeClick',
        targetViewName: 'My Genome Browser',
        response: 'updateTrack'
      },
      {
        sourceViewName: 'My Network',
        action: 'nodeClick',
        targetViewName: 'My Genome Browser',
        response: 'locus'
      },
      {
        sourceViewName: 'My Network',
        action: 'edgeClick',
        targetViewName: 'My Genome Browser',
        response: 'updateTrack'
      },
      {
        sourceViewName: 'My Network',
        action: 'edgeClick',
        targetViewName: 'My Genome Browser',
        response: 'locus'
      }
    ]
  }
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
  if (!(preset in genotet.preset.PRESETS)) {
    genotet.error('unknown preset:', preset);
    return;
  }

  genotet.preset.PRESETS[preset].views.forEach(function(view) {
    genotet.viewManager.createView(view.viewType, view.viewName, view.params);
  });
  genotet.linkManager.registerAllViews(
    genotet.preset.PRESETS[preset].links);
};
