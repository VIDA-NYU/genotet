/**
 * @fileoverview Contains the BindingView component definition.
 */

'use strict';

/**
 * BindingView extends the base View class, and renders the binding data
 * associated with the regulatory Binding.
 * @extends {View}
 * @constructor
 */
function BindingView(viewName) {
  BindingView.base.constructor.call(this, viewName);

  /** @type {BindingLoader} */
  this.loader = new BindingLoader();

  /** @type {BindingRenderer} */
  this.renderer = new BindingRenderer();
}

BindingView.prototype = Object.create(View.prototype);
BindingView.prototype.constructor = BindingView;
BindingView.base = View.prototype;

