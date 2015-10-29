/**
 * @fileoverview The base Renderer class definition. Each component shall have
 * a renderer class inheriting this class.
 */

'use strict';

/**
 * ViewRenderer class is the base class for all components' renderers.
 * @param {!jQuery} container Container of the view.
 * @constructor
 */
function ViewRenderer(container) {
  if (!container) {
    Core.error('null container passed to ViewRenderer');
    return;
  }
  /**
   * View container. Note that the container may not have been fully loaded
   * when the renderer is constructed.
   * @protected {!jQuery}
   */
  this.container = container;

  /**
   * Loading screen is only displayed when this value is positive.
   * @private {number}
   */
  this.loadCounter_ = 0;
}

/**
 * Renders the view graphics.
 */
ViewRenderer.prototype.render = function() {

};

/**
 * Shows loading message on the view.
 */
ViewRenderer.prototype.showLoading = function() {
  this.loadCounter_++;
  var popup = this.container.find('.popup');
  popup.show();
  popup.find('.loading').show();
  var height = this.container.height() -
      this.container.find('.view-header').outerHeight();
  popup.css('height', height);
};

/**
 * Hides loading message on the view.
 */
ViewRenderer.prototype.hideLoading = function() {
  this.loadCounter_--;
  if (this.loadCounter_ == 0) {
    this.container.find('.popup .loading').hide();
  }
};

/**
 * Shows data load failure message.
 */
ViewRenderer.prototype.showFailure = function() {
  this.container.find('.popup .failure').show();
};

/**
 * Hides data load failure message.
 */
ViewRenderer.prototype.hideFailure = function() {
  this.container.find('.popup .failure').hide();
};
