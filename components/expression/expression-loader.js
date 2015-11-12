/**
 * @fileoverview Expression matrix data loader.
 */

'use strict';

/**
 * ExpressionLoader loads the expression matrix data for the ExpressionView.
 * @param {!Object} data Data object to be written.
 * @extends {ViewLoader}
 * @constructor
 */
function ExpressionLoader(data) {
  ExpressionLoader.base.constructor.call(this, data);

  _(this.data).extend({
    matrix: null,
    profiles: []
  });
}

ExpressionLoader.prototype = Object.create(ViewLoader.prototype);
ExpressionLoader.prototype.constructor = ExpressionLoader;
ExpressionLoader.base = ViewLoader.prototype;


/**
 * Loads the expression matrix data, with given gene and condition selectors.
 * @param {string} matrixName Name of the expression matrix.
 * @param {string} geneRegex Regex for gene selection.
 * @param {string} conditionRegex Regex for experiment condition selection.
 * @override
 */
ExpressionLoader.prototype.load = function(matrixName, geneRegex,
    conditionRegex) {
  this.loadExpressionMatrix_(matrixName, geneRegex, conditionRegex);
};

/**
 * Implements the expression matrix loading ajax call. Since the matrix may
 * contain a large number of entries, we use POST request.
 * @param {string} matrixName Name of the expression matrix.
 * @param {string} geneRegex Regex for gene selection.
 * @param {string} conditionRegex Regex for experiment condition selection.
 * @private
 */
ExpressionLoader.prototype.loadExpressionMatrix_ = function(matrixName,
    geneRegex, conditionRegex) {
  this.signal('loadStart');
  var params = {
    type: 'expression',
    mat: matrixName,
    exprows: geneRegex,
    expcols: conditionRegex
  };

  $.get(Data.serverURL, params, function(data) {
    // Store the last applied data selectors.
    _(data).extend({
      matrixname: matrixName,
      geneRegex: geneRegex,
      conditionRegex: conditionRegex
    });

    this.data.matrix = data;

    this.signal('loadComplete');
  }.bind(this), 'jsonp')
    .fail(this.fail.bind(this, 'cannot load expression matrix', params));
};


/*
LoaderHeatmap.prototype.updateData = function(identifier) {
  if (identifier.action == 'node') {
    this.loadLine(this.lastIdentifier.mat, identifier.name);
    if (identifier.net != null) {
      this.loadHeatmapTargets(identifier.net, identifier.name);
    }
  }else if (identifier.action == 'link') {
    this.clearLines();
    this.loadLine(this.lastIdentifier.mat, identifier.source);
    this.loadLine(this.lastIdentifier.mat, identifier.target);
  }
};

LoaderHeatmap.prototype.loadData = function(identifier) {
  this.parentView.layout.showMsg('Loading...');
  this.parentView.viewdata = {};
  this.parentView.viewdata.lineData = new Array();
  this.lastIdentifier = identifier;
  if (identifier.name != null && identifier.name != '') {
    this.loadLine(identifier.mat, identifier.name);
  }
  this.loadHeatmap(identifier.mat, identifier.exprows, identifier.expcols);
};

LoaderHeatmap.prototype.loadComplete = function() {
  var data = this.parentView.viewdata;
  if (data.heatmapData == null) return;
  if (this.flagHeatmap) {
    this.flagHeatmap = false;
    this.loadHeatmap();
    return;
  }
  this.parentView.layout.reloadData();
};

LoaderHeatmap.prototype.loadCompleteLine = function() {
  if (this.parentView.viewdata.heatmapData == null) return;  // prevent racing
  if (this.parentView.layout.showPlot == true) {
    this.parentView.layout.prepareLine();
  }else {
    this.parentView.layout.showPlot = true;
    this.parentView.layout.initLayout();
    this.flagHeatmap = true;
  }
  this.parentView.layout.updateLine();
};

LoaderHeatmap.prototype.loadHeatmapTargets = function(net, name) {
  var loader = this;
  $.ajax({
      type: 'GET', url: addr, dataType: 'jsonp',
      data: { 'args': 'type=targets&net='+ net + '&name='+ name },
    error: function(xhr, status, err) { loader.error('cannot load targets for heatmap\n' + status + '\n' + err); },
      success: function(result) {
      var data = JSON.parse(result, Utils.parse);
      if (data == null || data.length == 0) { loader.error('cannot load targets for heatmap\n return is empty'); return; }
      loader.loadHeatmap(loader.lastIdentifier.mat, data.exp);
      }
  });
};

LoaderHeatmap.prototype.clearLines = function() {
  var loader = this;
  loader.parentView.viewdata.lineData = [];
  loader.loadCompleteLine();
};

LoaderHeatmap.prototype.loadLine = function(mat, name) {
  var loader = this;
  if (mat == null) mat = this.lastIdentifier.mat;
  var args = 'type=expmatline&mat='+ mat + '&name='+ name;
  $.ajax({
      type: 'GET', url: addr, dataType: 'jsonp',
      data: { 'args': args },
    error: function() { loader.error('cannot load heatmap line'); },
      success: function(result) {
      var data = JSON.parse(result, Utils.parse);
      if (data == null || data.length == 0) {
        loader.error('cannot load heatmap line\ngene not found in expression matrix', 'line');
        return;
      }

      for (var i = 0; i < loader.parentView.viewdata.lineData.length; i++) {
        if (loader.parentView.viewdata.lineData[i].name == data.name) return;  // ignore loaded lines
      }
      data.visible = true;
      data.color = 'black';
      loader.parentView.viewdata.lineData.push(data);
      //console.log(loader.parentView.viewdata.lineData);
      if (loader.parentView.viewdata.lineData.length > 8) {
        if (!user.silent) alert('exceeding maximum line limit, discarding the first line');
        loader.parentView.viewdata.lineData = loader.parentView.viewdata.lineData.slice(1);
      }
      loader.loadCompleteLine();
      }
  });
};
*/
