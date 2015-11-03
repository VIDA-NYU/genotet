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
function ExpressionView(viewName, params) {
  ExpressionView.base.constructor.call(this, viewName);

  this.container.addClass('expression');

  /** @protected {ExpressionLoader} */
  this.loader = new ExpressionLoader(this.data);

  /** @protected {ExpressionPanel} */
  this.panel = new ExpressionPanel(this.data);

  /** @protected {ExpressionRenderer} */
  this.renderer = new ExpressionRenderer(this.container, this.data);

  // Set up data loading callbacks.
  $(this.loader).on('genotet.loadComplete', function() {
    this.renderer.render();
  }.bind(this));
  $(this.container).on('genotet.ready', function() {
    this.loader.load(params.matrixName, params.geneRegex, params.condRegex);
  }.bind(this));
}

ExpressionView.prototype = Object.create(View.prototype);
ExpressionView.prototype.constructor = ExpressionView;
ExpressionView.base = View.prototype;
