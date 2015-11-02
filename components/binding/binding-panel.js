/**
 * @fileoverview Panel of the genome browser component.
 */

'use strict';

/**
 * BindingPanel manages the UI control panel of the genome browser.
 * @param {!Object} data Data object of the view.
 * @constructor
 */
function BindingPanel(data) {
  BindingPanel.base.constructor.call(this, data);

  this.template = 'components/binding/binding-panel.html';
}

BindingPanel.prototype = Object.create(ViewPanel.prototype);
BindingPanel.prototype.constructor = BindingPanel;
BindingPanel.base = ViewPanel.prototype;

/** @inheritDoc */
BindingPanel.prototype.panel = function(container) {
  BindingPanel.base.panel.call(this, container);
};
