/**
 * @fileoverview Panel of the expression matrix component.
 */

'use strict';

/**
 * ExpressionPanel manages the UI control panel of the expression matrix.
 * @param {!Object} data Data object of the view.
 * @constructor
 */
function ExpressionPanel(data) {
  ExpressionPanel.base.constructor.call(this, data);
}

ExpressionPanel.prototype = Object.create(ViewPanel.prototype);
ExpressionPanel.prototype.constructor = ExpressionPanel;
ExpressionPanel.base = ViewPanel.prototype;

/** @inheritDoc */
ExpressionPanel.prototype.template = 'components/expression/expression-panel.html';

/** @inheritDoc */
ExpressionPanel.prototype.panel = function(container) {
  ExpressionPanel.base.panel.call(this, container);
};

/** @inheritDoc */
ExpressionPanel.prototype.initPanel = function() {
/*
$('#'+ this.htmlid + ' #labelrow').attr('checked', this.labelrows).change(function() { return layout.toggleLabelrows(); });
$('#'+ this.htmlid + ' #labelcol').attr('checked', this.labelcols).change(function() { return layout.toggleLablecols(); });
$('#'+ this.htmlid + ' #showplot').attr('checked', this.showPlot).change(function() { return layout.toggleShowPlot(); });
$('#'+ this.htmlid + ' #showtfa').attr('checked', this.showTFA).change(function() { return layout.toggleShowTFA(); });
$('#'+ this.htmlid + ' #showgrad').attr('checked', this.showGradient).change(function() { return layout.toggleShowGradient(); });
$('#'+ this.htmlid + ' #autoscale').attr('checked', this.autoScale).change(function() { return layout.toggleAutoScale(); });
$('#'+ this.htmlid + ' #addline').keydown(function(e) { if (e.which == 13) layout.uiUpdate('addline');});
$('#'+ this.htmlid + ' #exprow').keydown(function(e) { if (e.which == 13) layout.uiUpdate('exprow');});
$('#'+ this.htmlid + ' #expcol').keydown(function(e) { if (e.which == 13) layout.uiUpdate('expcol');});
$('#'+ this.htmlid + " #data option[value='" + this.parentView.loader.lastIdentifier.mat + "']").attr('selected', true);
$('#'+ this.htmlid + ' #data').change(function(e) { return layout.uiUpdate('data');});
*/
}