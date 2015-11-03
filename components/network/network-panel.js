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

  this.template = 'components/network/network-panel.html';

  // Set the view options.
  _(this.data.options).extend({
    showLabels: true
  });
}

NetworkPanel.prototype = Object.create(ViewPanel.prototype);
NetworkPanel.prototype.constructor = NetworkPanel;
NetworkPanel.base = ViewPanel.prototype;


/** @inheritDoc */
NetworkPanel.prototype.panel = function() {
  NetworkPanel.base.panel.call(this);
  /*
  // Init
  $('#'+ this.htmlid + " #netname option[value='" + this.parentView.loader.lastIdentifier.net + "']")
    .attr('selected', true);
  $('#'+ this.htmlid + ' #netname')
    .change(function() {
      var net = $(this).select('option:selected').val();
      console.log(net);
      if (net != layout.parentView.loader.lastIdentifier.net) {
        layout.parentView.loader.loadData({'net': net, 'exp': 'a^'});
      }
    });
  $('#'+ this.htmlid + ' #gene').keydown(function(e) {
    if (e.which == 13) {
      return layout.uiUpdate('gene');
    }
  });
  $('#'+ this.htmlid + ' #comb').keydown(function(e) {
    if (e.which == 13) {
      return layout.uiUpdate('comb');
    }
  });
  $('#'+ this.htmlid + ' #label')
    .attr('checked', this.showLabel)
    .change(function() {
      return layout.toggleLabel();
    });
  $('#'+ this.htmlid + ' #tf2tf')
    .attr('checked', this.showTF2TFEdge)
    .change(function() {
      return layout.toggleTF2TFEdge();
    });
  $('#'+ this.htmlid + ' #tf2ntf')
    .attr('checked', this.showTF2nTFEdge)
    .change(function() {
      return layout.toggleTF2nTFEdge();
    });
  $('#'+ this.htmlid + ' #force')
    .attr('checked', this.forcing)
    .change(function() {
      return layout.toggleForce();
    });
  $('#'+ this.htmlid + ' #edgelist')
    .attr('checked', this.edgeListing)
    .change(function() {
      return layout.toggleEdgeListing();
    });
  this.uiHeight = $('#'+ this.htmlid + " div[name='ui']").height();

  // UI Update
  var loader = this.parentView.loader;
  if (type == 'gene') {
    var srch = $('#'+ this.htmlid + ' #gene').val();
    var cmd = srch.split(' ');
    if (cmd.length == 1 || (cmd.length == 2 && cmd[0] == 'sel')) {
      var exp = cmd.length == 1 ? cmd[0] : cmd[1];
      this.showMsg('Loading...');
      loader.loadNetwork(loader.lastIdentifier.net, exp);
    }else if (cmd.length == 2 && (cmd[0] == 'add' || cmd[0] == 'rm')) {
      if (cmd[0] == 'add') {
        loader.addNodes(cmd[1]);
      }else if (cmd[0] == 'rm') {
        loader.removeNodes(cmd[1]);
      }
    }else {
      options.alert('invalid syntax, usage: add/rm/sel regexp | regexp');
      return;
    }
  } else if (type == 'comb') {
    var exp = $('#'+ this.htmlid + ' #comb').val();
    if (exp == '') return;
    loader.loadComb(loader.lastIdentifier.net, exp);
  }
  */
};
