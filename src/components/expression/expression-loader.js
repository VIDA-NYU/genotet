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
    matrixInfo: null,
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
 * @param {string} dataName Name of the expression matrix data file.
 * @param {!Array<string>} geneNames Names for gene selection.
 * @param {!Array<string>} conditionNames Names for experiment condition
 *      selection.
 * @override
 */
genotet.ExpressionLoader.prototype.load = function(matrixName, dataName,
                                                   geneNames, conditionNames) {
  this.loadExpressionMatrix_(matrixName, dataName, geneNames, conditionNames);
};

/**
 * Implements the expression matrix loading ajax call. Since the matrix may
 * contain a large number of entries, we use GET request.
 * @param {string} matrixName Name of the expression matrix.
 * @param {string} dataName Name of the expression matrix data file.
 */
genotet.ExpressionLoader.prototype.loadExpressionMatrixInfo =
  function(matrixName, dataName) {
    var params = {
      type: 'expression-info',
      matrixName: matrixName
    };

    $.get(genotet.data.serverURL, params, function(data) {
        // Store the last applied data selectors.
        _.extend(data, {
          matrixName: matrixName
        });

        if (data.allGeneNames.length == 0) {
          genotet.warning('input gene not found');
          return;
        }
        if (data.allConditionNames.length == 0) {
          genotet.warning('input condition not found');
          return;
        }

        this.data.matrixInfo = data;
        this.signal('matrixInfoLoaded');
      }.bind(this), 'jsonp')
      .fail(this.fail.bind(this, 'cannot load expression matrix', params));
  };

/**
 * Implements the expression matrix loading ajax call. Since the matrix may
 * contain a large number of entries, we use GET request.
 * @param {string} matrixName Name of the expression matrix.
 * @param {string} dataName Name of the expression matrix data file.
 * @param {!Array<string>} geneNames Names for gene selection.
 * @param {!Array<string>} conditionNames Names for experiment condition
 *      selection.
 * @private
 */
genotet.ExpressionLoader.prototype.loadExpressionMatrix_ =
  function(matrixName, dataName, geneNames, conditionNames) {
    var params = {
      type: 'expression',
      matrixName: matrixName,
      geneNames: geneNames,
      conditionNames: conditionNames
    };

    $.get(genotet.data.serverURL, params, function(data) {
        // Store the last applied data selectors.
        _.extend(data, {
          matrixName: matrixName,
          dataName: 'b-subtilis'
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

        this.loadTfaData_(matrixName, dataName, geneNames, conditionNames);
      }.bind(this), 'jsonp')
      .fail(this.fail.bind(this, 'cannot load expression matrix', params));
  };

/**
 * Implements the TFA data loading ajax call.
 * Since the matrix may contain a large number of entries, we use GET request.
 * @param {string} matrixName Name of the expression matrix.
 * @param {string} dataName Name of the expression matrix data file.
 * @param {!Array<string>} geneNames Names for gene selection.
 * @param {!Array<string>} conditionNames Names for experiment condition
 *      selection.
 * @private
 */
genotet.ExpressionLoader.prototype.loadTfaData_ =
  function(matrixName, dataName, geneNames, conditionNames) {
    var tfaParams = {
      type: 'expression-profile',
      matrixName: 'b-subtilis',
      geneNames: geneNames,
      conditionNames: conditionNames
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
 * @param {!Array<string>} names Names that selects the genes or conditions
 *      to be updated.
 */
genotet.ExpressionLoader.prototype.update = function(method, matrixName,
                                                     names) {
  var heatmapData = this.data.matrix;
  var currentStatus = new genotet.ExpressionRenderer.ZoomStatus({
    matrixName: heatmapData.matrixName,
    dataName: heatmapData.dataName,
    geneNames: heatmapData.geneNames,
    conditionNames: heatmapData.conditionNames
  });
  this.data.zoomStack.push(currentStatus);
  this.data.zoomStack.forEach(function(zoomStatus) {
    switch (method) {
      case 'setGene':
        // Totally replace the names.
        zoomStatus.geneNames = names;
        break;
      case 'addGene':
        // Concat the two names.
        this.removeNames_(zoomStatus.geneNames, names);
        names.forEach(function(name) {
          zoomStatus.geneNames.push(name);
        });
        break;
      case 'removeGene':
        // Remove the names.
        this.removeNames_(zoomStatus.geneNames, names);
        break;
      case 'setCondition':
        // Totally replace the regex.
        zoomStatus.conditionNames = names;
        break;
      case 'addCondition':
        // Concat the two names.
        this.removeNames_(zoomStatus.conditionNames, names);
        names.forEach(function(name) {
          zoomStatus.conditionNames.push(name);
        });
        break;
      case 'removeCondition':
        // Remove the names.
        this.removeNames_(zoomStatus.conditionNames, names);
        break;
    }
  }.bind(this));
  var zoomStatus = this.data.zoomStack.pop();
  this.load(zoomStatus.matrixName, zoomStatus.dataName, zoomStatus.geneNames,
    zoomStatus.conditionNames);
};

/**
 * Remove genes or conditions from previous status in expression.
 * @param {!Array<string>} originalNames Original names from previous zoom
 *      status.
 * @param {!Array<string>} removeNames Names need to be removed.
 * @private
 */
genotet.ExpressionLoader.prototype.removeNames_ = function(originalNames,
                                                           removeNames) {
  removeNames.forEach(function(name) {
    var geneIndex = originalNames.indexOf(name);
    if (geneIndex != -1) {
      originalNames.splice(geneIndex, 1);
    }
  });
};
