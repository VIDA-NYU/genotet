/**
 * @fileoverview Contains the NetworkView component definition.
 */

'use strict';

/**
 * NetworkView extends the base View class, and renders the regulatory network
 * topology.
 * @param {string} viewName Name of the view.
 * @param {!Object} params Additional parameters.
 * @extends {View}
 * @constructor
 */
function NetworkView(viewName, params) {
  NetworkView.base.constructor.call(this, viewName);

  /** @protected {NetworkLoader} */
  this.loader = new NetworkLoader(this.data);

  /** @protected {NetworkPanel} */
  this.panel = new NetworkPanel(this.data);

  /** @protected {NetworkRenderer} */
  this.renderer = new NetworkRenderer(this.container, this.data);

  // Set up data loading callbacks.
  $(this.data).on('genotet.loadComplete', function() {
    this.renderer.render();
  }.bind(this));

  $(this.container).on('genotet.ready', function() {
    this.loader.load(params.networkName, params.geneRegex);
  }.bind(this));

  this.container.addClass('network');
}

NetworkView.prototype = Object.create(View.prototype);
NetworkView.prototype.constructor = NetworkView;
NetworkView.base = View.prototype;
