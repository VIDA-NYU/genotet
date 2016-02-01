/**
 * @fileoverview Link manager for controlling the link query.
 */

/** @const */
genotet.linkManager = {};

/**
 * Object that stores the link views by their type.
 */
/** @type {!Object<!Array<{
 *    target: genotet.View,
 *    action: string,
 *    response: string
 *  }>>}
 */
genotet.linkManager.links = {};

/** @const {!Array<string>} */
genotet.linkManager.EXPRESSION_ACTIONS = ['addGeneProfile'];

/** @const {!Array<string>} */
genotet.linkManager.NETWORK_ACTIONS = ['nodeClick', 'edgeClick'];

/** @const {!Array<string>} */
genotet.linkManager.BINDING_ACTIONS = ['updateTrack', 'locus'];

/**
 * Initializes the link manager.
 */
genotet.linkManager.init = function() {
  genotet.linkManager.links = {};
};


/**
 * Set up the link manager.
 */
genotet.linkManager.link = function() {
  console.log(genotet.linkManager.links);
  for (var linkViewName in genotet.linkManager.links) {
    var linkView = genotet.viewManager.views[linkViewName];
    genotet.linkManager.links[linkViewName].forEach(function(object) {
      $(linkView.renderer)
        .on('genotet.' + object.action, function(event, component) {
          switch (object.action) {
            case 'nodeClick':
              var node = component;
              var genes = [node.id];
              break;
            case 'edgeClick':
              var edge = component;
              var genes = edge.id.split(',');
              break;
          }
          switch (object.response) {
            case 'addGeneProfile':
              var matrixGeneNames = object.target.data.matrix.geneNames;
              genes.forEach(function(gene) {
                var geneIndex = matrixGeneNames.indexOf(gene);
                if (geneIndex != -1) {
                  object.target.panel.signal(object.response, geneIndex);
                }
              });
              break;
            case 'updateTrack':
              var sourceGene = genes[0];
              // TODO(Jiaming): Replace this fake data after finishing
              // mapping query.
              // ======================
              var mappingName = {
                'Maf': 'SL971_SL970',
                'Mafg': 'SL1851',
                'Stat3': 'SL10572_SL10566'
              };
              // ======================
              var fileName = mappingName[sourceGene];
              if (fileName) {
                object.target.panel.signal(object.response, {
                  trackIndex: 0,
                  fileName: fileName
                });
                object.target.loader.signal('updatePanelTracks');
              }
              break;
            case 'locus':
              var targetGene = genes[1];
              object.target.panel.signal('locus', targetGene);
              break;
          }
        });
    });
  }
};

/**
 * @param {genotet.View} sender
 * @param {string} actionType
 * @param {genotet.View} receiver
 * @param {string} responseType
 */
genotet.linkManager.register = function(sender, actionType, receiver,
                                        responseType) {

};
