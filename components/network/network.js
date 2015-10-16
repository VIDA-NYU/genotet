/**
 * @fileoverview Contains the NetworkView component definition.
 */

'use strict';

/**
 * NetworkView extends the base View class, and renders the regulatory network
 * topology.
 * @constructor
 */
function NetworkView(viewName) {
  NetworkView.base.constructor.call(this, viewName);

  /** @type {NetworkLoader} */
  this.loader = new NetworkLoader();
}

NetworkView.prototype = Object.create(View.prototype);
NetworkView.prototype.constructor = NetworkView;
NetworkView.base = View.prototype;

