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

  /**
   * Flag of matrix file select is open or not.
   * @private {boolean}
   */
  this.fileSelectIsOpen_ = false;
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

  // Input type update
  // TODO(Liana): Get view name by view object directly.
  var viewName = this.container.attr('id').replace('panel-view-', '');
  this.container.find('#gene-input input')
    .attr('name', viewName + '-gene-optradio');
  this.container.find('#input input')
    .attr('name', viewName + '-regulator-optradio');

  // Gene update
  ['set', 'add', 'remove'].forEach(function(method) {
    this.container.find('#genes #' + method).click(function() {
      var isRegex = this.container.find('#gene-input')
        .children('label[name=regex]').children('input').prop('checked');
      var input = this.container.find('#genes input');
      var inputGenes = input.val();
      if (inputGenes == '') {
        genotet.warning('missing input gene selection');
        return;
      }
      input.val('');
      this.signal('update', {
        type: 'gene',
        inputGenes: inputGenes,
        method: method,
        isRegex: isRegex
      });
      this.container.find('#edge-list').slideUp();
    }.bind(this));
  }, this);

  // Combined Regulation
  this.container.find('#combined-regulation #refresh')
    .click(function() {
      var isRegex = this.container.find('#input')
        .children('label[name=regex]').children('input').prop('checked');
      var input = this.container.find('#combined-regulation input');
      var inputGenes = input.val();
      if (inputGenes == '') {
        genotet.warning('missing input gene selection');
        return;
      }
      input.val('');
      this.signal('combined-regulation', {
        inputGenes: inputGenes,
        isRegex: isRegex
      });
    }.bind(this));

  // Load network list
  this.signal('loadNetworkList');
};

/** @inheritDoc */
genotet.NetworkPanel.prototype.dataLoaded = function() {
  this.container.find('#network input').val(this.data.fileName);
};

/**
 * Gets a container to render the incident edge table.
 * @return {!jQuery} The edge list container.
 */
genotet.NetworkPanel.prototype.edgeListContainer = function() {
  var edgeList = this.container.find('#edge-list').hide().slideDown();
  edgeList.html(
    /** @type {string} */(this.container.find('#edge-list-template').html()));
  return edgeList.children('table');
};

/**
 * Updates the network list for panel after loading network list.
 * TODO(Liana): this function is now very similar with
 * expressionPanel.prototype.updateFileListAfterLoading. Consider create a
 * shared UI class "genotet.FileList". Each panel can create instances of this
 * UI class and set the file list by calling the UI class's methods.
 */
genotet.NetworkPanel.prototype.updateFileListAfterLoading = function() {
  if (this.fileSelectIsOpen_) {
    return;
  }
  var fileNames = genotet.data.files.networkFiles.map(function(dataInfo) {
    return {
      id: dataInfo.fileName,
      text: dataInfo.networkName + ' (' + dataInfo.fileName + ')'
    };
  });
  var select = this.container.find('#network select').select2({
    data: fileNames,
    width: '100%'
  });
  select.val(this.data.networkInfo.fileName).trigger('change');

  // Set matrix fileName
  select.on('select2:select', function(event) {
    this.fileSelectIsOpen_ = false;
    var fileName = event.params.data.id;
    this.data.networkInfo.fileName = fileName;
    this.signal('updateNetwork', {
      fileName: fileName
    });
  }.bind(this));

  select.on('select2:open', function() {
    this.fileSelectIsOpen_ = true;
    this.signal('loadNetworkList');
  }.bind(this));
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
  container.children('#node-sub-info').children('#subtiwiki').children('a')
    .attr('href', this.SUBTIWIKI_URL + node.id);
  container.children('#node-sub-info').children('#rm-gene').children('button')
    .click(function() {
    this.signal('update', {
      type: 'gene',
      method: 'remove',
      inputGenes: node.id,
      isRegex: false
    });
    this.container.find('#node-info').slideUp();
    this.container.find('#edge-list').slideUp();
    this.hideEdgeInfoByNode_(node.id);
  }.bind(this));
};

/**
 * Adds the edge info into a given container.
 * @param {!genotet.NetworkEdge} edge Edge of which info is to be displayed.
 * @param {!jQuery} container Info container.
 * @private
 */
genotet.NetworkPanel.prototype.setEdgeInfo_ = function(edge, container) {
  container.html(
    /** @type {string} */(this.container.find('#edge-info-template').html()));
  container.children('#source').children('span')
    .text(this.data.networkInfo.nodeLabel[edge.source]);
  container.children('#target').children('span')
    .text(this.data.networkInfo.nodeLabel[edge.target]);
  container.children('#edge-sub-info').children('#weight').children('span')
    .text(edge.weight[0]);
  container.children('#edge-sub-info').children('#rm-edge').children('button')
    .click(function() {
    this.signal('update', {
      type: 'delete-edge',
      edges: [edge]
    });
    this.container.find('#edge-info').slideUp();
  }.bind(this));
};

/**
 * Displays the info box for network node.
 * @param {!genotet.NetworkNode} node Node of which the info is to be displayed.
 */
genotet.NetworkPanel.prototype.displayNodeInfo = function(node) {
  var info = this.container.find('#node-info').slideDown();
  this.setNodeInfo_(node, info);
  info.find('.close').click(function() {
    this.hideNodeInfo_();
  }.bind(this));
};

/**
 * Displays the info box for network edge.
 * @param {!genotet.NetworkEdge} edge Edge to be displayed.
 */
genotet.NetworkPanel.prototype.displayEdgeInfo = function(edge) {
  var info = this.container.find('#edge-info').slideDown();
  this.setEdgeInfo_(edge, info);
  info.find('.close').click(function() {
    this.hideEdgeInfo_();
  }.bind(this));
};

/**
 * Displays multiple edges selected info.
 */
genotet.NetworkPanel.prototype.displayMultiEdgeInfo = function() {
  var info = this.container.find('#edge-info').slideDown();
  info.html(/** @type {string} */
    (this.container.find('#edge-info-multi-template').html()));
  info.find('.close').click(function() {
    this.hideEdgeInfo_();
  }.bind(this));
};

/**
 * Displays a tooltip around cursor about a hovered node.
 * @param {!genotet.NetworkNode} node Node being hovered.
 */
genotet.NetworkPanel.prototype.tooltipNode = function(node) {
  var tooltip = genotet.tooltip.create();
  this.setNodeInfo_(node, tooltip);
  // Tooltip cannot be interacted with, thus link is not shown.
  tooltip.find('#subtiwiki, #rm-gene, .close').remove();
};

/**
 * Displays a tooltip around cursor about a hovered edge.
 * @param {!genotet.NetworkEdge} edge Edge being hovered.
 */
genotet.NetworkPanel.prototype.tooltipEdge = function(edge) {
  var tooltip = genotet.tooltip.create();
  this.setEdgeInfo_(edge, tooltip);
  tooltip.find('#rm-edge, .close').remove();
};

/**
 * Hides the node-info when removing nodes.
 * @param {!Array<string>} genes Genes to hide.
 */
genotet.NetworkPanel.prototype.hideNodeInfo = function(genes) {
  var info = this.container.find('#node-info');
  var name = info.children('#name').children('span').text();
  if (genes.indexOf(name) != -1) {
    this.hideNodeInfo_();
  }
};

/**
 * Hides the edge-info when removing edges.
 * @param {!Array<!genotet.NetworkEdge>} edges Edges to hide.
 * @param {boolean} force Whether to force to hide.
 */
genotet.NetworkPanel.prototype.hideEdgeInfo = function(edges, force) {
  if (force) {
    this.hideEdgeInfo_();
  } else {
    var info = this.container.find('#edge-info');
    var source = info.children('#source').children('span').text();
    var target = info.children('#target').children('span').text();
    var edgeId = source + ',' + target;
    var exists = false;
    for (var i = 0; i < edges.length; i++) {
      if (edges[i].id == edgeId) {
        exists = true;
        break;
      }
    }
    if (exists) {
      this.hideEdgeInfo_();
    }
  }
};

/**
 * Hides the node-info when the removed node is related to the showing edge.
 * @param {string} nodeId Id of the removed node.
 * @private
 */
genotet.NetworkPanel.prototype.hideEdgeInfoByNode_ = function(nodeId) {
  var info = this.container.find('#edge-info');
  var nodeLabel = this.data.networkInfo.nodeLabel[nodeId];
  var source = info.children('#source').children('span').text();
  var target = info.children('#target').children('span').text();
  if (source == nodeLabel || target == nodeLabel) {
    this.hideEdgeInfo_();
  }
};
