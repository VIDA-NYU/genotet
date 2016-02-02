/**
 * @fileoverview Contains the NetworkView component definition.
 */

'use strict';


/**
 * @typedef {{
 *   id: string,
 *   label: string,
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
 *   id: string,
 *   source: !genotet.NetworkNode,
 *   target: !genotet.NetworkNode,
 *   weight: number
 * }}
 */
genotet.RenderEdge;

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
 * @typedef {{
 *   fileName: string,
 *   inputGenes: string,
 *   isRegex: boolean
 * }}
 */
genotet.NetworkViewParams;

/**
 * @typedef {{
 *   id: string,
 *   source: string,
 *   target: string,
 *   added: boolean,
 *   weight: number,
 *   originalWeight: !Array<number>
 * }}
 */
genotet.EdgeForTable;

/**
 * NetworkView extends the base View class, and renders the regulatory network
 * topology.
 * @param {string} viewName Name of the view.
 * @param {genotet.NetworkViewParams} params
 * @extends {genotet.View}
 * @constructor
 */
genotet.NetworkView = function(viewName, params) {
  genotet.NetworkView.base.constructor.call(this, viewName);

  /**
   * @protected {{
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
        this.loader.updateGenes(data.method, data.inputGenes, data.isRegex);
        this.renderer.dataLoaded();
        break;
      case 'delete-edges':
        this.loader.deleteEdges(data);
        this.renderer.dataLoaded();
        break;
      default:
        genotet.error('unknown update type', data.type);
    }
  }.bind(this));

  // Gene removal update.
  $(this.loader)
    .on('genotet.infoLoaded', function() {
      this.loader.load(params.fileName, params.inputGenes, params.isRegex);
    }.bind(this))
    .on('genotet.incidentEdges', function() {
      this.table.create(this.panel.edgeListContainer(),
          this.data.incidentEdges);
    }.bind(this))
    .on('genotet.hideNodeInfo', function(event, genes) {
      this.panel.hideNodeInfo(genes);
    }.bind(this));

  // Node and edge hover in network.
  $(this.renderer)
    .on('genotet.nodeClick', function(event, node) {
      this.panel.displayNodeInfo(node);
      this.loader.incidentEdges(node);
      this.signal('link', {
        action: 'nodeClick',
        data: node
      });
    }.bind(this))
    .on('genotet.nodeHover', function(event, node) {
      this.panel.tooltipNode(node);
    }.bind(this))
    .on('genotet.nodeUnhover', function(event, node) {
      genotet.tooltip.hideAll();
    }.bind(this))
    .on('genotet.edgeClick', function(event, edge) {
      this.panel.displayEdgeInfo(edge);
      this.signal('link', {
        action: 'edgeClick',
        data: edge
      });
    }.bind(this))
    .on('genotet.edgeHover', function(event, edge) {
      this.panel.tooltipEdge(edge);
    }.bind(this))
    .on('genotet.edgeUnhover', function(event, edge) {
      genotet.tooltip.hideAll();
    }.bind(this));

  // Table
  $(this.table)
    .on('genotet.addEdges', function(event, edges) {
      this.loader.addEdges(edges);
      this.renderer.dataLoaded();
    }.bind(this))
    .on('genotet.removeEdges', function(event, edges) {
      this.loader.deleteEdges(edges);
      this.renderer.dataLoaded();
    }.bind(this))
    .on('genotet.highlightEdges', function(event, edgeIds) {
      this.renderer.findSelectEdges(edgeIds);
    }.bind(this))
    .on('genotet.hideEdgeInfo', function(event, data) {
      this.panel.hideEdgeInfo(data.edges, data.force);
    }.bind(this))
    .on('genotet.multiEdgeInfo', function() {
      this.panel.displayMultiEdgeInfo();
    }.bind(this))
    .on('genotet.showEdgeInfo', function(event, edge) {
      this.panel.displayEdgeInfo(edge);
    }.bind(this));
};

genotet.utils.inherit(genotet.NetworkView, genotet.View);
