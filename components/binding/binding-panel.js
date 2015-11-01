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
}

BindingPanel.prototype = Object.create(ViewPanel.prototype);
BindingPanel.prototype.constructor = BindingPanel;
BindingPanel.base = ViewPanel.prototype;
