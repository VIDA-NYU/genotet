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

  this.container.addClass('network');

  /** @protected {NetworkLoader} */
  this.loader = new NetworkLoader(this.data);

  /** @protected {NetworkPanel} */
  this.panel = new NetworkPanel(this.data);

  /** @protected {NetworkRenderer} */
  this.renderer = new NetworkRenderer(this.container, this.data);

  // Set up data loading callbacks.
  $(this.container).on('genotet.ready', function() {
    this.loader.load(params.networkName, params.geneRegex);
  }.bind(this));

  // Set up rendering update.
  $(this.panel).on('genotet.update', function(event, data) {
    switch(data.type) {
      case 'label':
        this.renderer.update();
        break;
      case 'visibility':
        this.renderer.updateVisibility();
        this.renderer.update();
        break;
      default:
        Core.error('unknown update type', data.type);
    }
  }.bind(this));
}

NetworkView.prototype = Object.create(View.prototype);
NetworkView.prototype.constructor = NetworkView;
NetworkView.base = View.prototype;
