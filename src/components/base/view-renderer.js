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
genotet.ViewRenderer = function(container, data) {
  if (!container) {
    genotet.error('null container passed to ViewRenderer');
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
   * @protected {d3}
   */
  this.canvas;

  // Size of the canvas, automatically updated by the resize handler.
  /** @protected {number} */
  this.canvasWidth;
  /** @protected {number} */
  this.canvasHeight;

  /**
   * View data object is shared between the view, loader and renderer.
   * @protected {!Object}
   */
  this.data = data;
};


/**
 * Initializes the view renderer properties, e.g. the view canvas.
 */
genotet.ViewRenderer.prototype.init = function() {
  this.canvas = d3.selectAll(/** @type {!Array<Element>} */
    (this.container.find('.canvas-svg').toArray()));
  this.initLayout();
  this.resize();
};

/**
 * Creates rendering layout (e.g. SVG groups).
 */
genotet.ViewRenderer.prototype.initLayout = function() {};

/**
 * Sets the layout for the next iteration of rendering.s
 */
genotet.ViewRenderer.prototype.layout = function() {};

/**
 * Renders the view graphics.
 */
genotet.ViewRenderer.prototype.render = function() {};

/**
 * Handles data loadSuccess event, e.g. processing the data.
 * Typically, the scene is rendered after loadSuccess event is fired.
 */
genotet.ViewRenderer.prototype.dataLoaded = function() {};

/**
 * Checks if the data has been loaded.
 * @return {boolean} If the data is ready to be plotted.
 */
genotet.ViewRenderer.prototype.dataReady = function() {
  return false;
};

/**
 * Handles the resize update of the view.
 */
genotet.ViewRenderer.prototype.resize = function() {
  this.canvasWidth = /** @type {number} */(this.container.width());
  this.canvasHeight = this.container.height() -
    this.container.find('.view-header').outerHeight();
  this.canvas
    .attr('width', this.canvasWidth)
    .attr('height', this.canvasHeight);
};

/**
 * Shows loading message on the view.
 */
genotet.ViewRenderer.prototype.showLoading = function() {
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
genotet.ViewRenderer.prototype.hideLoading = function() {
  this.container.find('.popup .loading').hide();
};

/**
 * Shows data load failure message.
 */
genotet.ViewRenderer.prototype.showFailure = function() {
  this.container.find('.popup .failure').show();
};

/**
 * Hides data load failure message.
 */
genotet.ViewRenderer.prototype.hideFailure = function() {
  this.container.find('.popup .failure').hide();
};

/**
 * Triggers a jQuery event on the renderer.
 * @param {string} eventType Type of event.
 * @param {Object=} opt_data Data to be sent via the event.
 */
genotet.ViewRenderer.prototype.signal = function(eventType, opt_data) {
  $(this).trigger('genotet.' + eventType, [opt_data]);
};

/**
 * Sets the size of canvas.
 * @param {number} canvasWidth Width of canvas.
 * @param {number} canvasHeight Height of canvas.
 */
genotet.ViewRenderer.prototype.updateCanvasSize = function(canvasWidth,
                                                           canvasHeight) {
  this.canvas.attr('height', canvasHeight);
};
