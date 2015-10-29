/**
 * @fileoverview Contains the BindingView component definition.
 */

'use strict';

/**
 * BindingView extends the base View class, and renders the binding data
 * associated with the regulatory Binding.
 * @param {string} viewName Name of the view.
 * @param {!Object} params Additional parameters.
 * @extends {View}
 * @constructor
 */
function BindingView(viewName, params) {
  BindingView.base.constructor.call(this, viewName);

  /** @type {BindingLoader} */
  this.loader = new BindingLoader(this.data);

  /** @type {BindingRenderer} */
  this.renderer = new BindingRenderer(this.container);
}

BindingView.prototype = Object.create(View.prototype);
BindingView.prototype.constructor = BindingView;
BindingView.base = View.prototype;
