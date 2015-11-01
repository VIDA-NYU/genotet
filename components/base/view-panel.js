/**
 * @fileoverview The base Panel class definition. Each component shall have
 * a controller class inheriting this class.
 */

'use strict';

/**
 * ViewPanel class is the base class for all components' controllers.
 * @param {!Object} data Data object of the view.
 * @constructor
 */
function ViewPanel(data) {
  /**
   * View data object is shared between the view, loader, renderer and panel.
   * @protected {!Object}
   */
  this.data = data;
}


/**
 * Displays a control panel in the given container.
 * @param {!jQuery} container Panel container.
 */
ViewPanel.prototype.panel = function(container) {
};
