/**
 * @fileoverview Link manager for controlling the link query.
 */

/**
 * @typedef {{
 *   source: string,
 *   action: string,
 *   target: string,
 *   response: string
 * }}
 */
genotet.LinkSetting;

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

/** @const {string} */
genotet.linkManager.DEFAULT_MAPPING = 'Direct Mapping';

/**
 * Initializes the link manager.
 */
genotet.linkManager.init = function() {
  genotet.linkManager.links = {};
  genotet.data.mappingFile['gene-binding'] =
    genotet.linkManager.DEFAULT_MAPPING;
};

/**
 * Registers link action and response for all the views.
 * @param {!Array<genotet.LinkSetting>} linkSetting Link setting for all the
 * views.
 */
genotet.linkManager.registerAllViews = function(linkSetting) {
  linkSetting.forEach(function(object) {
    var sourceView = genotet.viewManager.views[object.source];
    var targetView = genotet.viewManager.views[object.target];
    /*
     * TODO(Liana): Next version plans.
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
};

/**
 * Registers link action and response for views.
 * @param {genotet.View} sender
 * @param {string} actionType
 * @param {genotet.View} receiver
 * @param {string} responseType
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

  // Link the views.
  $(sender).on('genotet.' + actionType, function(event, data) {
    receiver.signal(responseType, data);
  });
};

/**
 * Removes links of the removed view.
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
