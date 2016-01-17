/**
 * @fileoverview Contains the NetworkView component definition.
 */

'use strict';


/**
 * @typedef {{
 *   id: string,
 *   name: string,
 *   isTF: boolean
 * }}
 */
genotet.NetworkNode;

/**
 * @typedef {{
 *   id: string,
 *   source: string,
 *   target: string,
 *   weight: !Array<number>
 * }}
 */
genotet.NetworkEdge;

/**
 * @typedef {{
 *   nodes: !Array<!genotet.NetworkNode>,
 *   edges: !Array<!genotet.NetworkEdge>,
 *   weightMin: number,
 *   weightMax: number
 * }}
 */
genotet.NetworkData;

/**
 * NetworkView extends the base View class, and renders the regulatory network
 * topology.
 * @param {string} viewName Name of the view.
 * @param {!Object} params Additional parameters.
 * @extends {genotet.View}
 * @constructor
 */
genotet.NetworkView = function(viewName, params) {
  genotet.NetworkView.base.constructor.call(this, viewName);

  /**
   * @protected {!{
   *   showLabels: boolean,
   *   showTFToTF: boolean,
   *   showTFToNonTF: boolean
   * }}
   */
  this.data.options = {
    showLabels: true,
    showTFToTF: true,
    showTFToNonTF: true
  };

  /** @protected {genotet.NetworkData} */
  this.data.network;

  this.container.addClass('network');

  /** @protected {genotet.NetworkLoader} */
  this.loader = new genotet.NetworkLoader(this.data);

  /** @protected {genotet.NetworkPanel} */
  this.panel = new genotet.NetworkPanel(this.data);

  /** @protected {genotet.NetworkTable} */
  this.table = new genotet.NetworkTable(this.data);

  /** @protected {genotet.NetworkRenderer} */
  this.renderer = new genotet.NetworkRenderer(this.container, this.data);

  // Set up data loading callbacks.
  $(this.container).on('genotet.ready', function() {
    this.loader.loadNetworkInfo(params.fileName);
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
        this.loader.updateGenes(data.method, data.inputGene, data.isRegex);
        this.renderer.dataLoaded();
        break;
      case 'add-edge':
        this.loader.addOneEdge(data.source, data.target, data.weight);
        this.renderer.dataLoaded();
        break;
      case 'delete-edge':
        this.loader.deleteOneEdge(data.source, data.target);
        this.renderer.dataLoaded();
        break;
      default:
        genotet.error('unknown update type', data.type);
    }
  }.bind(this));

  // Gene removal update.
  $(this.loader)
    .on('genotet.infoLoaded', function() {
      this.loader.load(params.fileName, params.inputGene, params.isRegex);
    }.bind(this))
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
