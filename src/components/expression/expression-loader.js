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
    profile: {
      values: [],
      geneNames: [],
      conditionNames: [],
      valueMin: Infinity,
      valueMax: -Infinity
    },
    tfa: {
      fileName: null,
      tfaValues: [],
      geneNames: [],
      conditionNames: [],
      valueMin: Infinity,
      valueMax: -Infinity
    },
    matrixGeneNameDict: null,
    matrixConditionNameDict: null,
    profileGeneNameDict: {},
    tfaGeneNameDict: {},
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
    type: genotet.expression.QueryType.EXPRESSION_INFO,
    fileName: fileName
  };

  this.get(genotet.url.server, params, function(data) {
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
    type: genotet.expression.QueryType.EXPRESSION,
    fileName: fileName,
    geneNames: geneNames,
    conditionNames: conditionNames
  };

  this.get(genotet.url.server, params, function(data) {
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
    this.data.profile.conditionNames = data.conditionNames;
    this.data.tfa.conditionNames = data.conditionNames;

    var matrixGeneNameDict = {};
    data.geneNames.forEach(function(geneName, i) {
      matrixGeneNameDict[geneName.toLowerCase()] = {
        index: i,
        rawName: geneName
      };
    }.bind(this));
    var matrixConditionNameDict = {};
    data.conditionNames.forEach(function(conditionName, i) {
      matrixConditionNameDict[conditionName.toLowerCase()] = {
        index: i,
        rawName: conditionName
      };
    }.bind(this));
    this.data.matrixGeneNameDict = matrixGeneNameDict;
    this.data.matrixConditionNameDict = matrixConditionNameDict;

    if (this.data.profile.geneNames.length) {
      this.loadProfile(fileName, this.data.profile.geneNames,
        data.conditionNames, false, true);
    }
    if (this.data.tfa.geneNames.length) {
      this.loadTfaProfile(fileName, this.data.tfa.geneNames,
        data.conditionNames, false);
    }
  }.bind(this), 'cannot load expression matrix');
};

/**
 * Loads the profile for selected genes. Only add the first element in
 * geneNames when add profile.
 * @param {string} fileName Name of the expression matrix.
 * @param {!Array<string>} geneNames Name for gene selection.
 * @param {!Array<string>} conditionNames Names for experiment condition
 *      selection.
 * @param {boolean} isAddProfile Whether it is adding a new profile.
 * @param {boolean} isAddedInPanel Whether it is added to panel.
 */
genotet.ExpressionLoader.prototype.loadProfile =
  function(fileName, geneNames, conditionNames, isAddProfile, isAddedInPanel) {
    var params = {
      type: genotet.expression.QueryType.PROFILE,
      fileName: fileName,
      geneNames: geneNames,
      conditionNames: conditionNames
    };
    this.get(genotet.url.server, params, function(profileData) {
      // Store the last applied data selectors.
      if (!profileData.geneNames.length ||
        !profileData.conditionNames.length) {
        return;
      }
      if (isAddProfile) {
        // Only add the first element in geneNames when add profile.
        var geneName = geneNames[0];
        var geneIndex = this.data.profiles.length;
        this.data.profileGeneNameDict[geneName] = geneIndex;
        this.data.profile.geneNames.push(geneName);
        this.data.profile.values = this.data.profile.values.concat(
          profileData.values);
        this.data.profile.valueMin = Math.min(this.data.profile.valueMin,
          profileData.valueMin);
        this.data.profile.valueMax = Math.max(this.data.profile.valueMax,
          profileData.valueMax);
        this.signal('newProfileLoaded', {
          geneName: geneName,
          geneIndex: geneIndex,
          isAddedInPanel: isAddedInPanel
        });
      } else {
        this.data.profile = profileData;
        this.signal('profileLoaded');
      }
    }.bind(this), 'cannot load expression profiles', true);
  };

/**
 * Loads the TFA for selected genes.
 * @param {string} fileName Name of the TFA file.
 * @param {!Array<string>} geneNames Names for gene selection.
 * @param {!Array<string>} conditionNames Names for TFA experiment condition
 *      selection.
 * @param {boolean} isAddProfile Whether it is adding a new TFA profile.
 */
genotet.ExpressionLoader.prototype.loadTfaProfile =
  function(fileName, geneNames, conditionNames, isAddProfile) {
    var tfaParams = {
      type: genotet.expression.QueryType.TFA_PROFILE,
      fileName: genotet.data.tfaFileName,
      geneNames: geneNames,
      conditionNames: conditionNames
    };
    this.get(genotet.url.server, tfaParams, function(tfaProfileData) {
      // Store the last applied data selectors.
      if (!tfaProfileData.tfaValues.length) {
        genotet.warning('TFA not found for ' + geneNames);
        return;
      }
      if (isAddProfile) {
        // Only add the first element in geneNames when add profile.
        var geneName = geneNames[0];
        var geneIndex = this.data.tfaProfiles.length;
        this.data.tfaGeneNameDict[geneName] = geneIndex;
        this.data.tfa.geneNames.push(geneName);
        this.data.tfa.tfaValues = this.data.tfa.tfaValues.concat(
          tfaProfileData.tfaValues);
        this.data.tfa.valueMin = Math.min(this.data.tfa.valueMin,
          tfaProfileData.valueMin);
        this.data.tfa.valueMax = Math.max(this.data.tfa.valueMax,
          tfaProfileData.valueMax);
        this.signal('newTfaProfileLoaded', {
          geneName: geneName,
          geneIndex: geneIndex
        });
      } else {
        this.data.tfa = _.extend({}, this.data.tfa, tfaProfileData);
        this.signal('tfaProfileLoaded');
      }
    }.bind(this), 'cannot load TFA profiles', true);
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
