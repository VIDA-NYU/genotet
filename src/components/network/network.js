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
genotet.NetworkView = function(viewName, params) {
  this.base.constructor.call(this, viewName);

  this.container.addClass('network');

  /** @protected {NetworkLoader} */
  this.loader = new genotet.NetworkLoader(this.data);

  /** @protected {NetworkPanel} */
  this.panel = new genotet.NetworkPanel(this.data);

  /** @protected {NetworkTable} */
  this.table = new genotet.NetworkTable(this.data);

  /** @protected {NetworkRenderer} */
  this.renderer = new genotet.NetworkRenderer(this.container, this.data);

  // Set up data loading callbacks.
  $(this.container).on('genotet.ready', function() {
    this.loader.load(params.networkName, params.geneRegex);
  }.bind(this));

  // Set up rendering update.
  $(this.panel).on('genotet.update', function(event, data) {
    switch (data.type) {
      case 'label':
        this.renderer.update();
        break;
      case 'visibility':
        this.renderer.updateVisibility();
        this.renderer.update();
        break;
      case 'gene':
        this.loader.updateGenes(data.method, data.regex);
        break;
      default:
        genotet.error('unknown update type', data.type);
    }
  }.bind(this));

  // Gene removal update.
  $(this.loader)
    .on('genotet.geneRemove', function() {
      this.renderer.dataLoaded();
    }.bind(this))
    .on('genotet.incidentEdges', function() {
      this.table.create(this.panel.edgeListContainer(),
          this.data.incidentEdges);
    }.bind(this));

  // Node and edge hover in network.
  $(this.renderer)
    .on('genotet.nodeClick', function(event, node) {
      this.panel.displayNodeInfo(node);
      this.loader.incidentEdges(node);
    }.bind(this))
    .on('genotet.nodeHover', function(event, node) {
      this.panel.tooltipNode(node);
    }.bind(this))
    .on('genotet.nodeUnhover', function(event, node) {
      genotet.tooltip.hideAll();
    }.bind(this))
    .on('genotet.edgeClick', function(event, edge) {
      this.panel.displayEdgeInfo(edge);
    }.bind(this))
    .on('genotet.edgeHover', function(event, edge) {
      this.panel.tooltipEdge(edge);
    }.bind(this))
    .on('genotet.edgeUnhover', function(event, edge) {
      genotet.tooltip.hideAll();
    }.bind(this));
};

genotet.utils.inherit(genotet.NetworkView, genotet.View);
