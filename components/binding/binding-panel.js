/**
 * @fileoverview Panel of the genome browser component.
 */

'use strict';

/**
 * BindingPanel manages the UI control panel of the genome browser.
 * @param {!Object} data Data object of the view.
 * @constructor
 */
function BindingPanel(data) {
  BindingPanel.base.constructor.call(this, data);

  // Set the view options.
  _(this.data.options).extend({
    autoScale: true,
    showOverview: true,
    showBed: true,
    showExons: true
  });
}

BindingPanel.prototype = Object.create(ViewPanel.prototype);
BindingPanel.prototype.constructor = BindingPanel;
BindingPanel.base = ViewPanel.prototype;

/** @inheritDoc */
BindingPanel.prototype.template = 'components/binding/binding-panel.html';

/** @inheritDoc */
BindingPanel.prototype.panel = function(container) {
  BindingPanel.base.panel.call(this, container);
};

/** @inheritDoc */
BindingPanel.prototype.initPanel = function() {
  var chrs = Data.bindingChrs.map(function (chr, index) {
    return {
      id: chr,
      text: chr
    };
  });
  this.container_.find('#chr select').select2({
    data: chrs
  });
  var genes = Data.bindingGenes.map(function (gene, index) {
    return {
      id: gene,
      text: gene
    };
  });
  this.container_.find('#gene select').select2({
    data: genes
  });
  this.container_.find('.select2-container').css({
    width: '100%'
  });

  // Initialize switches.
  this.container_.find('.switches input').bootstrapSwitch({
    size: 'mini'
  });

  // Switch actions
  [
    {selector: '#overview', type: 'overview', attribute: 'showOverview'},
    {selector: '#bed', type: 'bed', attribute: 'showBed'},
    {selector: '#exons', type: 'exons', attribute: 'showExons'}
  ].forEach(function(bSwitch) {
      this.container_.find(bSwitch.selector).on('switchChange.bootstrapSwitch',
        function(event, state) {
          this.data.options[bSwitch.attribute] = state;
          this.signal('update', {
            type: bSwitch.type
          });
        }.bind(this));
    }, this);

  // Coordinates setting
  this.container_.find('#start-coordinate button').click(function() {
  });
};

/**
 * Updates the binding coordinates upon zoom.
 * @param {number} start Start coordinate.
 * @param {number} end End coordinate.
 */
BindingPanel.prototype.updateCoordinates = function(start, end) {
  this.container_.find('#start-coordinate input').val(parseInt(start));
  this.container_.find('#end-coordinate input').val(parseInt(end));
};

  /*
  $('#' + this.htmlid + ' #gene').val(data.name)
    .keydown(function(e) { if (e.which == 13) return layout.uiUpdate('gene');})
    .autocomplete({ source: manager.bindingNames, appendTo: 'body'});

  var chrs = manager.bindingChrs;
  for (var i = 0; i < chrs.length; i++) {
    $('#' + this.htmlid + ' div select').append('<option value=' + chrs[i] + '>' + chrs[i] + '</option>');
    if (chrs[i] == data.chr) $('#' + this.htmlid + " div select option[value='" + chrs[i] + "']").attr('selected', 'selected');
  }
  var htmlid = this.htmlid;
  $('#' + this.htmlid + ' div select').change(function() {
//console.log(data.name, $("#"+htmlid+" div select option:selected").text(), this.loading);
    if (layout.loading == false) {
      var chr = $('#' + htmlid + ' div select option:selected').text();
      layout.parentView.loadData(data.name, chr);
      layout.parentView.postGroupMessage({'action': 'chr', 'chr': chr});
    }
  });
  $('#' + this.htmlid + ' #xl').keydown(function(e) { if (e.which == 13) return layout.uiUpdate('range'); });
  $('#' + this.htmlid + ' #xr').keydown(function(e) { if (e.which == 13) return layout.uiUpdate('range'); });
  $('#' + this.htmlid + ' #search').keydown(function(e) { if (e.which == 13) return layout.uiUpdate('search'); });
  $('#' + this.htmlid + ' #autoscale').attr('checked', this.autoScale)
    .change(function() { return layout.toggleAutoScale(); });
  $('#' + this.htmlid + ' #overview').attr('checked', this.showOverview)
    .change(function() { return layout.toggleOverview(); });
  $('#' + this.htmlid + ' #exons').attr('checked', this.showExons)
    .change(function() { return layout.toggleExons(); });
    */

/*
LayoutHistogram.prototype.uiUpdate = function(type) {
  var layout = this;
  if (layout.loading == true) return;
  if (type == 'range') {
    var xl = parseInt($('#' + layout.htmlid + ' #xl').val()),
      xr = parseInt($('#' + layout.htmlid + ' #xr').val());
    if (isNaN(xl)) xl = this.focusleft;
    if (isNaN(xr)) xr = this.focusright;
    if (xr < xl) {
      options.alert('xl, xr value incorrect');
      return;
    }
    layout.focusleft = xl;
    layout.focusright = xr;
    layout.loadBindingLayout();
  }else if (type == 'search') {
    srch = $('#' + layout.htmlid + ' #search').val();
    if (srch != '') {
      this.removeLayout();
      this.parentView.loader.locateGene(srch);
    }
  }else if (type == 'gene') {
    var name = $('#' + this.htmlid + ' #gene').val();
    if (manager.supportBinding(name) == false) {
      options.alert('Please type in a supported binding track');
      return;
    }
    this.removeLayout();
    this.parentView.loader.loadData({'name': name});
  }
};

LayoutHistogram.prototype.toggleAutoScale = function(){
  this.autoScale = !this.autoScale;
  this.removeLayout();
  this.initLayout();
  this.renderLayout();
};

LayoutHistogram.prototype.toggleOverview = function(){
  this.showOverview = !this.showOverview;
  this.removeLayout();
  this.initLayout();
  this.renderLayout();
};

LayoutHistogram.prototype.toggleExons = function(){
  this.sho  wExons = !this.showExons;
  this.removeLayout();
  this.initLayout();
  this.renderLayout();
};
*/