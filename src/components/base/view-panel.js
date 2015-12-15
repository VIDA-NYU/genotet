/**
 * @fileoverview Base Panel class definition. Each component shall have
 * a controller class inheriting this class.
 */

'use strict';

/**
 * ViewPanel class is the base class for all components' controllers.
 * @param {!Object} data Data object of the view.
 * @constructor
 */
genotet.ViewPanel = function(data) {
  /**
   * View data object is shared between the view, loader, renderer and panel.
   * @protected {!Object}
   */
  this.data = data;

  /**
   * Panel container, assigned when panel() is called.
   * @private {jQuery}
   */
  this.container_;
};

/**
 * Panel template.
 * @protected {string}
 */
genotet.ViewPanel.prototype.template = 'dist/html/view-panel.html';

/**
 * Displays a control panel in the given container.
 * @param {!jQuery} container Panel container.
 */
genotet.ViewPanel.prototype.create = function(container) {
  this.container_ = container;

  this.container_.load(this.template, function() {
      this.initPanel();
      $(this).trigger('genotet.panelReady');
    }.bind(this));
};

/**
 * Initializes the panel, e.g. add event listeners.
 */
genotet.ViewPanel.prototype.initPanel = function() {};

/**
 * Sets panel elements when data is loaded.
 */
genotet.ViewPanel.prototype.dataLoaded = function() {};

/**
 * Triggers a jQuery event on the panel.
 * @param {string} eventType Type of event.
 * @param {Object} data Data object to be sent via the event.
 */
genotet.ViewPanel.prototype.signal = function(eventType, data) {
  $(this).trigger('genotet.' + eventType, [data]);
};
