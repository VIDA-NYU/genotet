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
    matrixGeneNameDict: null,
    matrixConditionNameDict: null,
    tfaGeneNameDict: null,
    profiles: [],
    tfaProfiles: [],
    zoomStack: []
  });
};

genotet.utils.inherit(genotet.ExpressionLoader, genotet.ViewLoader);

/**
 * Loads the expression matrix data, with given gene and condition selectors.
 * @param {string} fileName Name of the expression matrix.
 * @param {!Array<string>} geneNames Names for gene selection.
 * @param {!Array<string>} conditionNames Names for experiment condition
 *      selection.
 * @override
 */
genotet.ExpressionLoader.prototype.load = function(fileName, geneNames,
                                                   conditionNames) {
  this.loadExpressionMatrix_(fileName, geneNames, conditionNames);
};

/**
 * Implements the expression matrix loading ajax call. Since the matrix may
 * contain a large number of entries, we use GET request.
 * @param {string} fileName Name of the expression matrix.
 */
genotet.ExpressionLoader.prototype.loadExpressionMatrixInfo = function(
    fileName) {
  var params = {
    type: 'expression-info',
    fileName: fileName
  };

  this.get(genotet.data.serverURL, params, function(data) {
    // Store the last applied data selectors.
    _.extend(data, {
      fileName: fileName
    });

    if (Object.keys(data.allGeneNames).length == 0) {
      genotet.warning('input gene not found');
      return;
    }
    if (Object.keys(data.allConditionNames).length == 0) {
      genotet.warning('input condition not found');
      return;
    }

    this.data.matrixInfo = data;
    this.signal('matrixInfoLoaded');
  }.bind(this), 'cannot load expression matrix');
};

/**
 * Loads the expression matrix.
 * @param {string} fileName Name of the expression matrix.
 * @param {!Array<string>} geneNames Names for gene selection.
 * @param {!Array<string>} conditionNames Names for experiment condition
 *      selection.
 * @private
 */
genotet.ExpressionLoader.prototype.loadExpressionMatrix_ = function(fileName,
    geneNames, conditionNames) {
  var params = {
    type: 'expression',
    fileName: fileName,
    geneNames: geneNames,
    conditionNames: conditionNames
  };

  this.get(genotet.data.serverURL, params, function(data) {
    // Store the last applied data selectors.
    _.extend(data, {
      fileName: fileName
    });

    if (data.geneNames.length == 0) {
      genotet.warning('input gene not found');
      return;
    }
    if (data.conditionNames.length == 0) {
      genotet.warning('input condition not found');
      return;
    }

    this.data.matrix = data;
    var matrixGeneNameDict = {};
    data.geneNames.forEach(function(geneName, i) {
      matrixGeneNameDict[geneName] = i;
    }.bind(this));
    var matrixConditionNameDict = {};
    data.conditionNames.forEach(function(conditionName, i) {
      matrixConditionNameDict[conditionName] = i;
    }.bind(this));
    this.data.matrixGeneNameDict = matrixGeneNameDict;
    this.data.matrixConditionNameDict = matrixConditionNameDict;

    this.loadTfaProfile_(fileName, geneNames, conditionNames);
  }.bind(this), 'cannot load expression matrix');
};

/**
 * Loads the TFA for selected genes.
 * @param {string} fileName Name of the expression matrix.
 * @param {!Array<string>} geneNames Names for gene selection.
 * @param {!Array<string>} conditionNames Names for experiment condition
 *      selection.
 * @private
 */
genotet.ExpressionLoader.prototype.loadTfaProfile_ = function(fileName,
    geneNames, conditionNames) {
  var tfaParams = {
    type: 'tfa-profile',
    fileName: 'tfa.matrix2.bin',
    geneNames: geneNames,
    conditionNames: conditionNames
  };
  this.get(genotet.data.serverURL, tfaParams, function(data) {
    // Store the last applied data selectors.
    if (data.geneNames.length == 0 || data.conditionNames.length == 0) {
      return;
    }
    var tfaGeneNameDict = {};
    data.geneNames.forEach(function(geneName, i) {
      tfaGeneNameDict[geneName] = i;
    }.bind(this));
    this.data.tfaGeneNameDict = tfaGeneNameDict;
    this.data.tfaData = data;
  }.bind(this), 'cannot load expression TFA profiles');
};

/**
 * Updates the genes in the current expression.
 * @param {string} method Update method, either 'set' or 'add'.
 * @param {string} fileName Matrix name of the expression.
 * @param {!Array<string>} names Names that selects the genes or conditions
 *      to be updated.
 */
genotet.ExpressionLoader.prototype.update = function(method, fileName,
                                                     names) {
  var heatmapData = this.data.matrix;
  var currentStatus = new genotet.ExpressionRenderer.ZoomStatus({
    fileName: heatmapData.fileName,
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
  }, this);
  var zoomStatus = this.data.zoomStack.pop();
  this.load(zoomStatus.fileName, zoomStatus.geneNames,
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
  var namesDict = {};
  originalNames.forEach(function(name, i) {
    namesDict[name] = i;
  });
  removeNames.forEach(function(name) {
    var geneIndex = namesDict[name];
    if (name in namesDict) {
      originalNames.splice(geneIndex, 1);
    }
  });
};
