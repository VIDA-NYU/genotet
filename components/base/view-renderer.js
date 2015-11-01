/**
 * @fileoverview The base Renderer class definition. Each component shall have
 * a renderer class inheriting this class.
 */

'use strict';

/**
 * ViewRenderer class is the base class for all components' renderers.
 * @param {!jQuery} container Container of the view.
 * @param {!Object} data Data object to be written.
 * @constructor
 */
function ViewRenderer(container, data) {
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
  $(this.container).resize(this.resize.bind(this));

  /**
   * D3 selection of the view canvas.
   * @protected {?d3.selection}
   */
  this.canvas;

  // Size of the canvas, automatically updated by the resize handler.
  /** @private {number} */
  this.canvasWidth_;
  /** @private {number} */
  this.canvasHeight_;

  /**
   * View data object is shared between the view, loader and renderer.
   * @protected {!Object}
   */
  this.data = data;

  /**
   * Loading screen is only displayed when this value is positive.
   * @private {number}
   */
  this.loadCounter_ = 0;
}


/**
 * Initializes the view renderer properties, e.g. the view canvas.
 */
ViewRenderer.prototype.init = function() {
  this.canvas = d3.selectAll(this.container.find('.canvas-svg').toArray());
  this.resize();
};


/**
 * Renders the view graphics.
 */
ViewRenderer.prototype.render = function() {
};


/**
 * Handles data loadComplete event, e.g. processing the data.
 * Typically, the scene is rendered after loadComplete event is fired.
 */
ViewRenderer.prototype.dataLoaded = function() {
};


/**
 * Handles the resize update of the view.
 */
ViewRenderer.prototype.resize = function() {
  this.canvasWidth_ = this.container.width();
  this.canvasHeight_ = this.container.height() -
    this.container.find('.view-header').outerHeight();
  this.canvas
    .attr('width', this.canvasWidth_)
    .attr('height', this.canvasHeight_);
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
