/**
 * @fileoverview Contains the ExpressionView component definition.
 */

'use strict';

/**
 * View extends the base View class, and renders the expression matrix
 * associated with the regulatory Expression.
 * @extends {View}
 * @constructor
 */
function ExpressionView(viewName) {
  ExpressionView.base.constructor.call(this, viewName);

  /** @type {ExpressionLoader} */
  this.loader = new ExpressionLoader();

  /** @type {ExpressionRenderer} */
  this.renderer = new ExpressionRenderer();
}

ExpressionView.prototype = Object.create(View.prototype);
ExpressionView.prototype.constructor = ExpressionView;
ExpressionView.base = View.prototype;

