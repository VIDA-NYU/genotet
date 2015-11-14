/**
 * @fileoverview Panel of the network component.
 */

'use strict';

/**
 * NetworkPanel manages the UI control panel of the network.
 * @param {!Object} data Data object of the view.
 * @constructor
 */
function NetworkPanel(data) {
  NetworkPanel.base.constructor.call(this, data);

  // Set the view options.
  _(this.data.options).extend({
    showLabels: true,
    showTFToTF: true,
    showTFToNonTF: true
  });
}

NetworkPanel.prototype = Object.create(ViewPanel.prototype);
NetworkPanel.prototype.constructor = NetworkPanel;
NetworkPanel.base = ViewPanel.prototype;

/** @inheritDoc */
NetworkPanel.prototype.template = 'components/network/network-panel.html';

/** @const {string} */
NetworkPanel.prototype.SUBTIWIKI_URL =
  'http://subtiwiki.uni-goettingen.de/bank/index.php?gene=';

/** @inheritDoc */
NetworkPanel.prototype.panel = function(container) {
  NetworkPanel.base.panel.call(this, container);
};

/** @inheritDoc */
NetworkPanel.prototype.initPanel = function() {
  // Initialize switches
  this.container_.find('.switches input').bootstrapSwitch({
    size: 'mini'
  });

  // Switch actions
  [
    {selector: '#gene-labels', type: 'label', attribute: 'showLabels'},
    {selector: '#tf-tf', type: 'visibility', attribute: 'showTFToTF'},
    {selector: '#tf-nontf', type: 'visibility', attribute: 'showTFToNonTF'}
  ].forEach(function(bSwitch) {
      this.container_.find(bSwitch.selector).on('switchChange.bootstrapSwitch',
        function(event, state) {
          this.data.options[bSwitch.attribute] = state;
          this.signal('update', {
            type: bSwitch.type
          });
        }.bind(this));
  }, this);

  // Gene update
  ['set', 'add', 'remove'].forEach(function(method) {
    this.container_.find('#genes #' + method).click(function() {
      var input = this.container_.find('#genes input');
      var geneRegex = input.val();
      if (geneRegex == '') {
        Core.warning('missing input gene selection')
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

  this.hideInfo_();
};

/** @inheritDoc */
NetworkPanel.prototype.dataLoaded = function() {
  this.container_.find('#network input').val(this.data.networkName);
};

/**
 * Hides all info boxes.
 * @private
 */
NetworkPanel.prototype.hideInfo_ = function() {
  this.container_.find('#node-info, #edge-info').hide();
};

/**
 * Adds the node info into a given container.
 * @param {!Object} node Info of which info is to be displayed.
 * @param {!jQuery} container Info container.
 * @private
 */
NetworkPanel.prototype.setNodeInfo_ = function(node, container) {
  container.html(this.container_.find('#node-info-template').html());
  container.children('#name').children('span')
    .text(node.name);
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
NetworkPanel.prototype.setEdgeInfo_ = function(edge, container) {
  container.html(this.container_.find('#edge-info-template').html());
  container.children('#source').children('span')
    .text(edge.source.name);
  container.children('#target').children('span')
    .text(edge.target.name);
  container.children('#weight').children('span')
    .text(edge.weight);
};

/**
 * Displays the info box for network node.
 * @param {!Object} node Node of which the info is to be displayed.
 */
NetworkPanel.prototype.displayNodeInfo = function(node) {
  var info = this.container_.find('#node-info').show();
  this.setNodeInfo_(node, info);
};

/**
 * Displays the info box for network edge.
 * @param {!Object} edge Edge of which the info is to be displayed.
 */
NetworkPanel.prototype.displayEdgeInfo = function(edge) {
  var info = this.container_.find('#edge-info').show();
  this.setEdgeInfo_(edge, info);
};

/**
 * Displays a tooltip around cursor about a hovered node.
 * @param {!Object} node Node being hovered.
 */
NetworkPanel.prototype.tooltipNode = function(node) {
  var tooltip = Tooltip.new();
  this.setNodeInfo_(node, tooltip);
  // Tooltip cannot be interacted with, thus link is not shown.
  tooltip.find('#subtiwiki').remove();
};

/**
 * Displays a tooltip around cursor about a hovered edge.
 * @param {!Object} edge Edge being hovered.
 */
NetworkPanel.prototype.tooltipEdge = function(edge) {
  var tooltip = Tooltip.new();
  this.setEdgeInfo_(edge, tooltip);
};