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
genotet.ExpressionLoader = function(data) {
  this.base.constructor.call(this, data);

  _(this.data).extend({
    matrix: null,
    clickedCell: null,
    profiles: []
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
genotet.ExpressionLoader.prototype.load = function(matrixName, geneRegex, conditionRegex) {
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
genotet.ExpressionLoader.prototype.loadExpressionMatrix_ = function(matrixName, geneRegex, conditionRegex) {
  this.signal('loadStart');
  var params = {
    type: 'read-expression',
    matrixName: matrixName,
    geneRegex: geneRegex,
    conditionRegex: conditionRegex
  };

  $.get(genotet.data.serverURL, params, function(data) {
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

/**
 * Updates the genes in the current expression.
 * @param {string} method Update method, either 'set' or 'add'.
 * @param {string} matrixName Matrix name of the expression.
 * @param {string} regex Regex that selects the genes or conditions to be updated.
 */
genotet.ExpressionLoader.prototype.update = function(method, matrixName, regex) {
  var geneRegex = this.data.matrix.geneRegex;
  var conditionRegex = this.data.matrix.conditionRegex;
  regex = regex.toUpperCase();
  switch (method) {
    case 'setGene':
      // Totally replace the regex.
      geneRegex = regex;
      break;
    case 'addGene':
      // Concat the two regex's. We need to include the previously existing
      // genes too so as to find the edges between the new genes and old
      // ones.
      geneRegex += '|' + regex;
      break;
    case 'removeGene':
      // Remove the regex.
      geneRegex = '';
      this.data.matrix.geneNames.forEach(function(geneName) {
        if (!geneName.toUpperCase().match(regex)) {
          geneRegex += geneName + '|';
        }
      });
      geneRegex = geneRegex.slice(0, -1);
      break;
    case 'setCondition':
      // Totally replace the regex.
      conditionRegex = regex;
      break;
    case 'addCondition':
      // Concat the two regex's. We need to include the previously existing
      // genes too so as to find the edges between the new genes and old
      // ones.
      conditionRegex += '|' + regex;
      break;
    case 'removeCondition':
      // Remove the regex.
      conditionRegex = '';
      this.data.matrix.conditionNames.forEach(function(conditionName) {
        if (!conditionName.toUpperCase().match(regex)) {
          conditionRegex += conditionName + '|';
        }
      });
      conditionRegex = conditionRegex.slice(0, -1);
      break;
  }
  this.load(matrixName, geneRegex, conditionRegex);
};
