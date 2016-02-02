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

/** @const {string} */
genotet.linkManager.DEFAULT_MAPPING_FILENAME = 'namecode';

/**
 * Initializes the link manager.
 */
genotet.linkManager.init = function() {
  genotet.linkManager.links = {};
  genotet.data.geneBindingMappingFile =
    genotet.linkManager.DEFAULT_MAPPING_FILENAME;
};


/**
 * Set up the link manager.
 */
genotet.linkManager.link = function() {
  for (var linkViewName in genotet.linkManager.links) {
    var linkView = genotet.viewManager.views[linkViewName];
    $(linkView)
      .on('genotet.link', function(event, linkData) {
        switch (linkData.action) {
          case 'nodeClick':
            var node = linkData.data;
            var genes = [node.id];
            break;
          case 'edgeClick':
            var edge = linkData.data;
            var genes = edge.id.split(',');
            break;
        }
        genotet.linkManager.links[linkViewName]
          .filter(function(object) {
            return object.action == linkData.action;
          })
          .forEach(function(object) {
            var targetView = object.target;
            switch (object.response) {
              case 'addGeneProfile':
                genes.forEach(function(gene) {
                  targetView.signal('link', {
                    response: object.response,
                    data: gene
                  });
                });
                break;
              case 'updateTrack':
                var sourceGene = genes[0];

                var params = {
                  type: 'mapping',
                  fileName: genotet.data.geneBindingMappingFile
                };
                $.get(genotet.data.serverURL, params, function(data) {
                  // TODO(Jiaming): Replace this fake data after finishing
                  // mapping query. The return data is empty now.
                  // ======================
                  var mappingName = {
                    'maf': 'SL971_SL970',
                    'mafg': 'SL1851',
                    'stat3': 'SL10572_SL10566'
                  };
                  // var mappingName = data;
                  // ======================
                  var fileName = mappingName[sourceGene];
                  if (fileName) {
                    targetView.signal('link', {
                      response: object.response,
                      data: {
                        trackIndex: 0,
                        fileName: fileName
                      }
                    });
                    targetView.signal('link', {
                      response: 'updatePanelTracks'
                    });
                  }
                }.bind(this), 'jsonp')
                  .fail(function() {
                    genotet.error('failed to get gene-binding mapping file');
                  });
                break;
              case 'locus':
                var targetGene = genes[1];
                if (targetGene) {
                  targetView.signal('link', {
                    response: 'locus',
                    data: targetGene
                  });
                }
                break;
            }
          });
      });
  }
};

/**
 * Register link action and response for views.
 * @param {genotet.View} sender
 * @param {string=} actionType
 * @param {genotet.View=} receiver
 * @param {string=} responseType
 */
genotet.linkManager.register = function(sender, actionType, receiver,
                                        responseType) {
  if (receiver) {
    genotet.linkManager.links[sender.name()].push({
      target: receiver,
      action: actionType,
      response: responseType
    });
  } else {
    genotet.linkManager.links[sender.name()] = [];
  }
};

/**
 * Remove links of the removed view.
 * @param {string} viewName Name of the removed view.
 */
genotet.linkManager.removeLink = function(viewName) {
  for (var linkViewName in genotet.linkManager.links) {
    if (linkViewName == viewName) {
      delete genotet.linkManager.links[linkViewName];
    } else {
      genotet.linkManager.links[linkViewName] =
        genotet.linkManager.links[linkViewName].filter(function(object) {
          return object.target.name() != viewName;
        });
    }
  }
};
