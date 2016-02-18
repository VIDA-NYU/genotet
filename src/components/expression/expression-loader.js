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
    matrixInfo: {
      fileName: null
    },
    tfa: {
      fileName: null
    },
    matrixGeneNameDict: null,
    matrixConditionNameDict: null,
    lowerGeneNames: null,
    lowerConditionNames: null,
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
    if ($.isEmptyObject(data.allGeneNames)) {
      genotet.warning('input gene not found');
      return;
    }
    if ($.isEmptyObject(data.allConditionNames)) {
      genotet.warning('input condition not found');
      return;
    }

    // Store the last applied data selectors.
    this.data.matrixInfo = _.extend({}, this.data.matrixInfo, data);

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

    var lowerGeneNames = {};
    Object.keys(this.data.matrixInfo.allGeneNames).forEach(function(name) {
      lowerGeneNames[name.toLowerCase()] = name;
    });
    this.data.lowerGeneNames = lowerGeneNames;
    var lowerConditionNames = {};
    Object.keys(this.data.matrixInfo.allConditionNames).forEach(
      function(name) {
        lowerConditionNames[name.toLowerCase()] = name;
      });
    this.data.lowerConditionNames = lowerConditionNames;

    this.loadTfaProfile_(this.data.tfa.fileName, this.data.matrix.geneNames,
      this.data.matrix.conditionNames);
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
    fileName: 'tfa.mat.tsv',
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
    this.data.tfa = _.extend({}, this.data.tfa, data);
  }.bind(this), 'cannot load expression TFA profiles');
};

/**
 * Loads expression data list into genotet.data.expressionFiles.
 */
genotet.ExpressionLoader.prototype.loadExpressionList = function() {
  var params = {
    type: 'list-expression'
  };
  this.get(genotet.data.serverURL, params, function(data) {
    genotet.data.bindingFiles = [];
    data.forEach(function(dataInfo) {
      genotet.data.expressionFiles.push(dataInfo);
    });
    this.signal('updateFileListAfterLoading');
  }.bind(this), 'cannot load expression list', true);
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
        zoomStatus.geneNames = this.removeNames_(zoomStatus.geneNames, names);
        names.forEach(function(name) {
          zoomStatus.geneNames.push(name);
        });
        break;
      case 'removeGene':
        // Remove the names.
        zoomStatus.geneNames = this.removeNames_(zoomStatus.geneNames, names);
        break;
      case 'setCondition':
        // Totally replace the regex.
        zoomStatus.conditionNames = names;
        break;
      case 'addCondition':
        // Concat the two names.
        zoomStatus.conditionNames = this.removeNames_(zoomStatus.conditionNames,
          names);
        names.forEach(function(name) {
          zoomStatus.conditionNames.push(name);
        });
        break;
      case 'removeCondition':
        // Remove the names.
        zoomStatus.conditionNames = this.removeNames_(zoomStatus.conditionNames,
          names);
        break;
    }
  }, this);
  var zoomStatus = this.data.zoomStack.pop();
  this.load(heatmapData.fileName, zoomStatus.geneNames,
    zoomStatus.conditionNames);
};

/**
 * Remove genes or conditions from previous status in expression.
 * @param {!Array<string>} originalNames Original names from previous zoom
 *      status.
 * @param {!Array<string>} removeNames Names need to be removed.
 * @return {!Array<string>}
 * @private
 */
genotet.ExpressionLoader.prototype.removeNames_ = function(originalNames,
                                                           removeNames) {
  var removeNamesDict = {};
  removeNames.forEach(function(name, i) {
    removeNamesDict[name] = i;
  });
  return originalNames.filter(function(name) {
    return !(name in removeNamesDict);
  });
};
