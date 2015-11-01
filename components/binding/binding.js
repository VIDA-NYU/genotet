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

  /** @protected {BindingLoader} */
  this.loader = new BindingLoader(this.data);

  /** @protected {BindingPanel} */
  this.controller = new BindingPanel(this.data);

  /** @protected {BindingRenderer} */
  this.renderer = new BindingRenderer(this.container, this.data);

  this.container.addClass('binding');
}

BindingView.prototype = Object.create(View.prototype);
BindingView.prototype.constructor = BindingView;
BindingView.base = View.prototype;
