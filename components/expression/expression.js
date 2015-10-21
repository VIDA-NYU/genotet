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

  /** @type {ExpressionLoader} */
  this.loader = new ExpressionLoader(this.data);

  /** @type {ExpressionRenderer} */
  this.renderer = new ExpressionRenderer(this.container);
}

ExpressionView.prototype = Object.create(View.prototype);
ExpressionView.prototype.constructor = ExpressionView;
ExpressionView.base = View.prototype;