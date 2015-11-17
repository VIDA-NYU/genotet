/**
 * @fileoverview Contains the ExpressionView component definition.
 */

'use strict';

/**
 * View extends the base View class, and renders the expression matrix
 * associated with the regulatory Expression.
 * @param {string} viewName Name of the view.
 * @param {!Object} params Additional parameters.
 * @extends {View}
 * @constructor
 */
genotet.ExpressionView = function(viewName, params) {
  this.base.constructor.call(this, viewName);

  this.container.addClass('expression');

  /** @protected {ExpressionLoader} */
  this.loader = new genotet.ExpressionLoader(this.data);

  /** @protected {ExpressionPanel} */
  this.panel = new genotet.ExpressionPanel(this.data);

  /** @protected {ExpressionRenderer} */
  this.renderer = new genotet.ExpressionRenderer(this.container, this.data);

  // Set up data loading callbacks.
  $(this.container).on('genotet.ready', function() {
    this.loader.load(params.matrixName, params.geneRegex, params.condRegex);
  }.bind(this));
};

genotet.utils.inherit(genotet.ExpressionView, genotet.View);
