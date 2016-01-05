/**
 * @fileoverview Panel of the network component.
 */

'use strict';

/**
 * NetworkPanel manages the UI control panel of the network.
 * @param {!Object} data Data object of the view.
 * @extends {genotet.ViewPanel}
 * @constructor
 */
genotet.NetworkPanel = function(data) {
  genotet.NetworkPanel.base.constructor.call(this, data);
};

genotet.utils.inherit(genotet.NetworkPanel, genotet.ViewPanel);

/** @inheritDoc */
genotet.NetworkPanel.prototype.template = 'dist/html/network-panel.html';

/** @const {string} */
genotet.NetworkPanel.prototype.SUBTIWIKI_URL =
  'http://subtiwiki.uni-goettingen.de/bank/index.php?gene=';

/** @inheritDoc */
genotet.NetworkPanel.prototype.initPanel = function() {
  // Initialize switches
  this.container.find('.switches input').bootstrapSwitch({
    size: 'mini'
  });

  // Switch actions
  [
    {selector: '#gene-labels', type: 'label', attribute: 'showLabels'},
    {selector: '#tf-tf', type: 'visibility', attribute: 'showTFToTF'},
    {selector: '#tf-nontf', type: 'visibility', attribute: 'showTFToNonTF'}
  ].forEach(function(bSwitch) {
      this.container.find(bSwitch.selector).on('switchChange.bootstrapSwitch',
        function(event, state) {
          this.data.options[bSwitch.attribute] = state;
          this.signal('update', {
            type: bSwitch.type
          });
        }.bind(this));
  }, this);

  // Gene update
  ['set', 'add', 'remove'].forEach(function(method) {
    this.container.find('#genes #' + method).click(function() {
      var input = this.container.find('#genes input');
      var geneRegex = input.val();
      if (geneRegex == '') {
        genotet.warning('missing input gene selection');
        return;
      }
      input.val('');
      this.signal('update', {
        type: 'gene',
        regex: geneRegex,
        method: method
      });
    }.bind(this));
  }, this);
};

/** @inheritDoc */
genotet.NetworkPanel.prototype.dataLoaded = function() {
  this.container.find('#network input').val(this.data.networkName);
};

/**
 * Gets a container to render the incident edge table.
 * @return {!jQuery} The edge list container.
 */
genotet.NetworkPanel.prototype.edgeListContainer = function() {
  var edgeList = this.container.find('#edge-list');
  edgeList.html(
    /** @type {string} */(this.container.find('#edge-list-template').html()));
  return edgeList.children('table');
};

/**
 * Hides node info.
 * @private
 */
genotet.NetworkPanel.prototype.hideNodeInfo_ = function() {
  this.container.find('#node-info').slideUp();
};

/**
 * Hides edge info.
 * @private
 */
genotet.NetworkPanel.prototype.hideEdgeInfo_ = function() {
  this.container.find('#edge-info').slideUp();
};

/**
 * Hides all info boxes.
 * @private
 */
genotet.NetworkPanel.prototype.hideInfo_ = function() {
  this.hideNodeInfo_();
  this.hideEdgeInfo_();
};

/**
 * Adds the node info into a given container.
 * @param {!Object} node Info of which info is to be displayed.
 * @param {!jQuery} container Info container.
 * @private
 */
genotet.NetworkPanel.prototype.setNodeInfo_ = function(node, container) {
  container.html(
    /** @type {string} */(this.container.find('#node-info-template').html()));
  container.children('#name').children('span')
    .text(node.label);
  container.children('#is-tf')
    .css('display', node.isTF ? '' : 'none');
  container.children('#subtiwiki').children('a')
    .attr('href', this.SUBTIWIKI_URL + node.id);
};

/**
 * Adds the edge info into a given container.
 * @param {!Object} edge Edge of which info is to be displayed.
 * @param {!jQuery} container Info container.
 * @private
 */
genotet.NetworkPanel.prototype.setEdgeInfo_ = function(edge, container) {
  container.html(
    /** @type {string} */(this.container.find('#edge-info-template').html()));
  container.children('#source').children('span')
    .text(edge.source.label);
  container.children('#target').children('span')
    .text(edge.target.label);
  container.children('#weight').children('span')
    .text(edge.weight);
};

/**
 * Displays the info box for network node.
 * @param {!Object} node Node of which the info is to be displayed.
 */
genotet.NetworkPanel.prototype.displayNodeInfo = function(node) {
  var info = this.container.find('#node-info').hide().slideDown();
  this.setNodeInfo_(node, info);
  info.find('.close').click(function() {
    this.hideNodeInfo_();
  }.bind(this));
};

/**
 * Displays the info box for network edge.
 * @param {!Object} edge Edge of which the info is to be displayed.
 */
genotet.NetworkPanel.prototype.displayEdgeInfo = function(edge) {
  var info = this.container.find('#edge-info').hide().slideDown();
  this.setEdgeInfo_(edge, info);
  info.find('.close').click(function() {
    this.hideEdgeInfo_();
  }.bind(this));
};

/**
 * Displays a tooltip around cursor about a hovered node.
 * @param {!Object} node Node being hovered.
 */
genotet.NetworkPanel.prototype.tooltipNode = function(node) {
  var tooltip = genotet.tooltip.create();
  this.setNodeInfo_(node, tooltip);
  // Tooltip cannot be interacted with, thus link is not shown.
  tooltip.find('#subtiwiki, .close').remove();
};

/**
 * Displays a tooltip around cursor about a hovered edge.
 * @param {!Object} edge Edge being hovered.
 */
genotet.NetworkPanel.prototype.tooltipEdge = function(edge) {
  var tooltip = genotet.tooltip.create();
  this.setEdgeInfo_(edge, tooltip);
  tooltip.find('.close').remove();
};
