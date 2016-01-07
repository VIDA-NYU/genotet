/**
 * @fileoverview Expression matrix data loader.
 */

'use strict';

/**
 * ExpressionLoader loads the expression matrix data for the ExpressionView.
 * @param {!Object} data Data object to be written.
 * @extends {genotet.ViewLoader}
 * @constructor
 */
genotet.ExpressionLoader = function(data) {
  genotet.ExpressionLoader.base.constructor.call(this, data);

  _.extend(this.data, {
    matrix: null,
    tfaData: null,
    profiles: [],
    tfaProfiles: [],
    zoomStack: []
  });
};

genotet.utils.inherit(genotet.ExpressionLoader, genotet.ViewLoader);

/**
 * Loads the expression matrix data, with given gene and condition selectors.
 * @param {string} matrixName Name of the expression matrix.
 * @param {string} geneRegex Regex for gene selection.
 * @param {string} conditionRegex Regex for experiment condition selection.
 * @override
 */
genotet.ExpressionLoader.prototype.load = function(matrixName, geneRegex,
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
genotet.ExpressionLoader.prototype.loadExpressionMatrix_ = function(matrixName,
    geneRegex, conditionRegex) {
  var params = {
    type: 'read-expression',
    matrixName: matrixName,
    geneRegex: geneRegex,
    conditionRegex: conditionRegex
  };

  $.get(genotet.data.serverURL, params, function(data) {
    // Store the last applied data selectors.
    _.extend(data, {
      matrixname: matrixName,
      geneRegex: geneRegex,
      conditionRegex: conditionRegex
    });

    if (data.geneNames.length == 0) {
      genotet.warning('input gene not found');
      return;
    }
    if (data.conditionNames.length == 0) {
      genotet.warning('input condition not found');
      return;
    }

    this.signal('loadStart');
    this.data.matrix = data;
    this.loadTfaData_(matrixName, geneRegex, conditionRegex);
  }.bind(this), 'jsonp')
    .fail(this.fail.bind(this, 'cannot load expression matrix', params));
};

/**
 * Implements the TFA data loading ajax call.
 * Since the matrix may contain a large number of entries, we use GET request.
 * @param {string} matrixName Name of the expression matrix.
 * @param {string} geneRegex Regex for gene selection.
 * @param {string} conditionRegex Regex for experiment condition selection.
 * @private
 */
genotet.ExpressionLoader.prototype.loadTfaData_ =
  function(matrixName, geneRegex, conditionRegex) {
    var tfaParams = {
    type: 'profile',
    matrixName: 'b-subtilis',
    geneRegex: geneRegex,
    conditionRegex: conditionRegex
    };
    $.get(genotet.data.serverURL, tfaParams, function(data) {
        // Store the last applied data selectors.
        this.data.tfaData = data;
        if (data.geneNames.length == 0 || data.conditionNames.length == 0) {
          return;
        }

        this.signal('loadComplete');
      }.bind(this), 'jsonp')
      .fail(this.fail.bind(this, 'cannot load expression TFA profiles',
        tfaParams));
  };

/**
 * Updates the genes in the current expression.
 * @param {string} method Update method, either 'set' or 'add'.
 * @param {string} matrixName Matrix name of the expression.
 * @param {string} regex Regex that selects the genes or conditions to be
 *     updated.
 */
genotet.ExpressionLoader.prototype.update = function(method, matrixName,
                                                     regex) {
  var heatmapData = this.data.matrix;
  var currentRegex = new genotet.ExpressionRenderer.ZoomStatus({
    matrixName: heatmapData.matrixname,
    geneRegex: heatmapData.geneRegex,
    conditionRegex: heatmapData.conditionRegex,
    geneNames: heatmapData.geneNames,
    conditionNames: heatmapData.conditionNames
  });
  this.data.zoomStack.push(currentRegex);
  this.data.zoomStack.forEach(function(zoomRegex) {
    regex = regex.toLowerCase();
    switch (method) {
      case 'setGene':
        // Totally replace the regex.
        zoomRegex.geneRegex = regex;
        break;
      case 'addGene':
        // Concat the two regex's. We need to include the previously existing
        // genes too so as to find the edges between the new genes and old
        // ones.
        zoomRegex.geneRegex += '|' + regex;
        break;
      case 'removeGene':
        // Remove the regex.
        zoomRegex.geneRegex = '';
        zoomRegex.geneNames.forEach(function(geneName) {
          if (!geneName.toLowerCase().match(regex)) {
            zoomRegex.geneRegex += geneName + '|';
          }
        });
        zoomRegex.geneRegex = zoomRegex.geneRegex.slice(0, -1);
        break;
      case 'setCondition':
        // Totally replace the regex.
        zoomRegex.conditionRegex = regex;
        break;
      case 'addCondition':
        // Concat the two regex's. We need to include the previously existing
        // genes too so as to find the edges between the new genes and old
        // ones.
        zoomRegex.conditionRegex += '|' + regex;
        break;
      case 'removeCondition':
        // Remove the regex.
        zoomRegex.conditionRegex = '';
        zoomRegex.conditionNames.forEach(function(conditionName) {
          if (!conditionName.toLowerCase().match(regex)) {
            zoomRegex.conditionRegex += conditionName + '|';
          }
        });
        zoomRegex.conditionRegex = zoomRegex.conditionRegex.slice(0, -1);
        break;
    }
  }.bind(this));
  var zoomRegex = this.data.zoomStack.pop();
  this.load(zoomRegex.matrixName, zoomRegex.geneRegex,
    zoomRegex.conditionRegex);
};
