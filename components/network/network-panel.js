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
};

/** @inheritDoc */
NetworkPanel.prototype.dataLoaded = function() {
  this.container_.find('#network input').val(this.data.networkName);
};
