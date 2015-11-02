/**
 * @fileoverview Panel of the expression matrix component.
 */

'use strict';

/**
 * ExpressionPanel manages the UI control panel of the expression matrix.
 * @param {!Object} data Data object of the view.
 * @constructor
 */
function ExpressionPanel(data) {
  ExpressionPanel.base.constructor.call(this, data);

  this.template = 'components/expression/expression-panel.html';
}

ExpressionPanel.prototype = Object.create(ViewPanel.prototype);
ExpressionPanel.prototype.constructor = ExpressionPanel;
ExpressionPanel.base = ViewPanel.prototype;

/** @inheritDoc */
ExpressionPanel.prototype.panel = function(container) {
  ExpressionPanel.base.panel.call(this, container);
};
