/**
 * @fileoverview Link manager for controlling the link query.
 */

/**
 * @typedef {{
 *   sourceViewName: string,
 *   action: string,
 *   targetViewName: string,
 *   response: string
 * }}
 */
genotet.LinkDef;

/**
 * @typedef {{
 *   source: !genotet.View,
 *   action: string,
 *   target: !genotet.View,
 *   response: string
 * }}
 */
genotet.Link;

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
  genotet.data.mappingFiles['gene-binding'] =
    genotet.linkManager.DEFAULT_MAPPING;
};

/**
 * Registers link action and response for all the views.
 * @param {!Array<genotet.LinkDef>} links Link definition for all the views.
 */
genotet.linkManager.registerAllViews = function(links) {
  links.forEach(function(link) {
    var sourceView = genotet.viewManager.views[link.sourceViewName];
    var targetView = genotet.viewManager.views[link.targetViewName];
    /*
     * TODO(Liana): Next version plans.
     * Link settings will be extended to user self-defined in next version.
     * We need check whether the view is existed, because link settings
     * are defined as constant in this version, which cannot be revised
     * corresponding to views.
     */
    genotet.linkManager.register_({
      source: sourceView,
      action: link.action,
      target: targetView,
      response: link.response
    });
  });
};

/**
 * Registers link action and response for views.
 * @param {!genotet.Link} link Link for the views.
 * @private
 */
genotet.linkManager.register_ = function(link) {
  var senderName = link.source.name();
  if (!(senderName in genotet.linkManager.links)) {
    genotet.linkManager.links[senderName] = {};
  }
  if (!(link.action in genotet.linkManager.links[senderName])) {
    genotet.linkManager.links[senderName][link.action] = [];
  }
  genotet.linkManager.links[senderName][link.action].push({
    target: link.target,
    response: link.response
  });

  // Link the views.
  $(link.source).on('genotet.' + link.action, function(event, data) {
    link.target.signal(link.response, data);
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
