/**
 * @fileoverview Contains the NetworkView component definition.
 */

'use strict';

/**
 * NetworkView extends the base View class, and renders the regulatory network
 * topology.
 * @extends {View}
 * @constructor
 */
function NetworkView(viewName) {
  NetworkView.base.constructor.call(this, viewName);

  /** @type {NetworkLoader} */
  this.loader = new NetworkLoader();

  /** @type {NetworkRenderer} */
  this.renderer = new NetworkRenderer();
}

NetworkView.prototype = Object.create(View.prototype);
NetworkView.prototype.constructor = NetworkView;
NetworkView.base = View.prototype;
