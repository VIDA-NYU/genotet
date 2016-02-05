/**
 * @fileoverview Link manager for controlling the link query.
 */

/** @const */
genotet.linkManager = {};

/**
 * Object that stores the link views by their type.
 */
/** @type {!Object<!Object<!Array<{
 *    target: genotet.View,
 *    response: string
 *  }>>>}
 */
genotet.linkManager.links = {};

/** @const {!Array<string>} */
genotet.linkManager.EXPRESSION_ACTIONS = ['addProfile'];

/** @const {!Array<string>} */
genotet.linkManager.NETWORK_ACTIONS = ['nodeClick', 'edgeClick'];

/** @const {!Array<string>} */
genotet.linkManager.BINDING_ACTIONS = ['updateTrack', 'locus'];


/**
 * Settings for link views.
 * This part will be extended to user self-defined in next version.
 * @const {!Array<!Object<{
 *    source: string,
 *    action: string,
 *    target: string,
 *    response: string
 *  }>>}
 * */
genotet.linkManager.LINK_SETTINGS = [
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
];

/** @const {string} */
genotet.linkManager.DEFAULT_MAPPING_FILENAME = 'Direct Mapping';

/**
 * Initializes the link manager.
 */
genotet.linkManager.init = function() {
  genotet.linkManager.links = {};
  genotet.data.mappingFile['gene-binding'] =
    genotet.linkManager.DEFAULT_MAPPING_FILENAME;
};

/**
 * Set up the link manager.
 * @private
 */
genotet.linkManager.link_ = function() {
  for (var linkViewName in genotet.linkManager.links) {
    var linkView = genotet.viewManager.views[linkViewName];
    var actions = genotet.linkManager.links[linkViewName];
    $(linkView)
      .on('genotet.nodeClick', function(event, node) {
        actions['nodeClick'].forEach(function(obj) {
          obj.target.signal(obj.response, node);
        });
      })
      .on('genotet.edgeClick', function(event, edge) {
        actions['edgeClick'].forEach(function(obj) {
          obj.target.signal(obj.response, edge);
        });
      });
  }
};

/**
 * Register link action and response for all the views.
 */
genotet.linkManager.registerAllViews = function() {
  genotet.linkManager.LINK_SETTINGS.forEach(function(object) {
    var sourceView = genotet.viewManager.views[object.source];
    var targetView = genotet.viewManager.views[object.target];
    /*
     * Link settings will be extended to user self-defined in next version.
     * We need check whether the view is existed,
     * because link settings are defined as constant in this version,
     * which cannot be revised corresponding to views.
     */
    if (!sourceView || !targetView) {
      return;
    }
    genotet.linkManager.register_(sourceView, object.action, targetView,
      object.response);
  });
  genotet.linkManager.link_();
};

/**
 * Register link action and response for views.
 * @param {genotet.View} sender
 * @param {string=} actionType
 * @param {genotet.View=} receiver
 * @param {string=} responseType
 * @private
 */
genotet.linkManager.register_ = function(sender, actionType, receiver,
                                        responseType) {
  var senderName = sender.name();
  if (!(senderName in genotet.linkManager.links)) {
    genotet.linkManager.links[senderName] = {};
  }
  if (!(actionType in genotet.linkManager.links[senderName])) {
    genotet.linkManager.links[senderName][actionType] = [];
  }
  genotet.linkManager.links[senderName][actionType].push({
    target: receiver,
    response: responseType
  });
};

/**
 * Remove links of the removed view.
 * @param {string} viewName Name of the removed view.
 */
genotet.linkManager.removeLinks = function(viewName) {
  for (var linkViewName in genotet.linkManager.links) {
    if (linkViewName == viewName) {
      delete genotet.linkManager.links[linkViewName];
    } else {
      for (var action in genotet.linkManager.links[linkViewName]) {
        genotet.linkManager.links[linkViewName][action] =
          genotet.linkManager.links[linkViewName][action]
            .filter(function(object) {
              return object.target.name() != viewName;
            });
      }
    }
  }
};
