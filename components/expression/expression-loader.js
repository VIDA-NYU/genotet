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
    type: 'expression',
    mat: matrixName,
    exprows: geneRegex,
    expcols: conditionRegex
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
    //case 'removeCondition':
    //  // Remove the regex.
    //  var index = this.data.conditions.indexOf(conditionRegex);
    //  if (index == -1) {
    //    genotet.error('invalid condition regex', conditionRegex);
    //    return;
    //  };
    //  this.data.conditions.splice(index, 1);
    //  regex = '';
    //  this.data.conditions.forEach(function(conditionRegexs, i) {
    //    regex += conditionRegexs + (i == this.data.conditions.length - 1 ? '' : '|');
    //  }, this);
    //  break;
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
    //case 'removeGene':
    //  // Remove the regex.
    //  var index = this.data.genes.indexOf(geneRegex);
    //  if (index == -1) {
    //    genotet.error('invalid gene regex', geneRegex);
    //    return;
    //  };
    //  this.data.genes.splice(index, 1);
    //  regex = this.data.genes.join('|');
    //  break;
  }
  this.load(matrixName, geneRegex, conditionRegex);
};
