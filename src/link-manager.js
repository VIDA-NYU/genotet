/**
 * @fileoverview Link manager for controlling the link query.
 */

/** @const */
genotet.linkManager = {};

/**
 * Object that stores the link views by their type.
 */
/** @type {!Object<!Array<genotet.View>>} */
genotet.linkManager.linkViews = {};

/**
 * Object that stores the link actions and responses type.
 */
/** @type {!Object<string>} */
genotet.linkManager.linkActions = {};

/**
 * Initializes the link manager.
 */
genotet.linkManager.init = function() {
  genotet.data.VIEW_TYPES.forEach(function(type) {
    genotet.linkManager.linkViews[type] = [];
  });
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
