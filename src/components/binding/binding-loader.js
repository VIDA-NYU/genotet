/**
 * @fileoverview Binding data loader.
 */

'use strict';

/**
 * BindingLoader loads the binding data for the BindingView.
 * @param {!Object} data Data object to be written.
 * @extends {genotet.ViewLoader}
 * @constructor
 */
genotet.BindingLoader = function(data) {
  genotet.BindingLoader.base.constructor.call(this, data);

  _.extend(this.data, {
    tracks: [],
    bed: null,
    bedName: null,
    exons: []
  });
};

genotet.utils.inherit(genotet.BindingLoader, genotet.ViewLoader);

/** @const {number} */
genotet.BindingLoader.prototype.LOCUS_MARGIN_RATIO = .1;

/**
 * Loads the binding data for a given gene and chromosome.
 * @param {string} fileName Binding file name.
 * @param {string} bedName Bed name of the bed binding track.
 * @param {string} chr ID of the chromosome.
 * @param {number=} opt_track Track # into which the data is loaded.
 * @override
 */
genotet.BindingLoader.prototype.load = function(fileName, bedName, chr,
                                                opt_track) {
  genotet.logger.log(genotet.logger.Type.BINDING, 'load', fileName, bedName,
    chr);
  var trackIndex = opt_track ? opt_track : this.data.tracks.length;
  var isAddTrack = !opt_track;
  this.data.chr = chr;
  this.loadFullTrack(trackIndex, fileName, chr, isAddTrack);
  this.loadBed(bedName, chr, this.data.detailXMin, this.data.detailXMax);
  this.loadExons_(chr);
};

/**
 * Loads the binding data for multiple genes and chromosome in preset mode,
 * and the genes are added at the end of the tracks list.
 * @param {!Array<string>} fileNames Binding file names.
 * @param {string} bedName Bed name of the bed binding track.
 * @param {string} chr ID of the chromosome.
 */
genotet.BindingLoader.prototype.loadMultipleTracks = function(fileNames,
                                                              bedName, chr) {
  genotet.logger.log(genotet.logger.Type.BINDING, 'loadMultiple',
    fileNames.join('_'), bedName, chr);
  var trackIndex = this.data.tracks.length;
  this.data.chr = chr;
  this.loadBed(bedName, chr, this.data.detailXMin, this.data.detailXMax);
  this.loadExons_(chr);

  fileNames.forEach(function(fileName, i) {
    this.loadFullTrack(trackIndex + i, fileName, chr, true);
  }, this);
};

/**
 * loads the full binding data for all tracks. This usually happens
 * when chromosome is changed.
 */
genotet.BindingLoader.prototype.loadFullTracks = function() {
  this.data.tracks.forEach(function(track) {
    // First send query for the overview (without detail range).
    var params = {
      type: genotet.binding.QueryType.BINDING,
      fileName: track.fileName,
      chr: this.data.chr
    };
    this.get(genotet.data.serverUrl, params, function(data) {
      track.overview = data;
      this.updateRanges_();
    }.bind(this), 'cannot load binding overview');

    // Send query for the details.
    _.extend(params, {
      xl: this.data.detailXMin,
      xr: this.data.detailXMax
    });
    this.get(genotet.data.serverUrl, params, function(data) {
      track.detail = data;
      this.updateRanges_();
    }.bind(this), 'cannot load binding detail');
  }, this);
};

/**
 * Loads the data of a single binding track.
 * @param {number} trackIndex Track index.
 * @param {string} fileName Binding file name.
 * @param {string} chr Chromosome.
 * @param {boolean} isAddTrack Whether it is adding a new track.
 */
genotet.BindingLoader.prototype.loadFullTrack = function(trackIndex, fileName,
                                                         chr, isAddTrack) {
  var params = {
    type: genotet.binding.QueryType.BINDING,
    fileName: fileName,
    chr: chr
  };
  this.get(genotet.data.serverUrl, params, function(data) {
    var track = {
      gene: data.gene,
      fileName: fileName,
      overview: data,
      detail: data
    };
    this.data.tracks[trackIndex] = track;
    this.updateRanges_();
    if (isAddTrack) {
      // Add one more panel track.
      this.signal('addPanelTrack');
    }
  }.bind(this), 'cannot load binding overview');

  if (this.data.detailXMin) {
    // If we have a previously defined detail range, then keep the range.
    _.extend(params, {
      xl: this.data.detailXMin,
      xr: this.data.detailXMax
    });
    this.get(genotet.data.serverUrl, params, function(data) {
      // If a new track is created. This may be received before the track object
      // is created. Therefore create an empty object in that case.
      if (!this.data.tracks[trackIndex]) {
        this.data.tracks[trackIndex] = {};
      }
      this.data.tracks[trackIndex].detail = data;
    }.bind(this), 'cannot load binding detail');
  }
};

/**
 * Loads the bed data of a single binding track.
 * @param {string} fileName File name of the bed binding track.
 * @param {string} chr Chromosome.
 * @param {number|undefined} xl Left coordinate of the query range.
 *   If null, use the leftmost coordinate of the track.
 * @param {number|undefined} xr Right coordinate of the query range.
 *   If null, use the rightmost coordinate of the track.
 */
genotet.BindingLoader.prototype.loadBed = function(fileName, chr, xl, xr) {
  var params = {
    type: genotet.bed.QueryType.BED,
    fileName: fileName,
    chr: chr,
    xl: xl,
    xr: xr
  };
  var isAggregated = !this.data.bed || this.data.bed.aggregated;
  this.get(genotet.data.serverUrl, params, function(data) {
    this.data.bed = data;
    this.data.bedName = fileName;
    this.data.bed.aggregatedChanged = this.data.bed.aggregated != isAggregated;
  }.bind(this), 'cannot load binding data');
};

/**
 * Loads the detail binding data for all tracks in a given range.
 * @param {number} xl Range's left coordinate.
 * @param {number} xr Range's right coordinate.
 */
genotet.BindingLoader.prototype.loadTrackDetail = function(xl, xr) {
  this.data.detailXMin = xl;
  this.data.detailXMax = xr;
  this.data.tracks.forEach(function(track) {
    var params = {
      type: genotet.binding.QueryType.BINDING,
      fileName: track.fileName,
      chr: this.data.chr,
      xl: xl,
      xr: xr
    };
    this.get(genotet.data.serverUrl, params, function(data) {
      track.detail = data;
    }.bind(this), 'cannot load binding detail');
  }, this);
};

/**
 * Loads the exons info.
 * @param {string} chr Chromosome.
 * @private
 */
genotet.BindingLoader.prototype.loadExons_ = function(chr) {
  var params = {
    type: genotet.binding.QueryType.EXONS,
    chr: chr
  };
  this.get(genotet.data.serverUrl, params, function(data) {
    this.data.exons = data;
  }.bind(this), 'cannot load binding data');
};


/**
 * Queries the locus of a given gene.
 * @param {string} gene Gene name to be searched for.
 */
genotet.BindingLoader.prototype.findLocus = function(gene) {
  genotet.logger.log(genotet.logger.Type.BINDING, 'findLocus', gene);
  var params = {
    type: genotet.binding.QueryType.LOCUS,
    gene: gene
  };
  this.get(genotet.data.serverUrl, params, function(res) {
    if (!res) {
      genotet.warning('gene locus not found');
    } else {
      var span = res.txEnd - res.txStart;
      this.data.detailXMin = res.txStart - span * this.LOCUS_MARGIN_RATIO;
      this.data.detailXMax = res.txEnd + span * this.LOCUS_MARGIN_RATIO;
      if (res.chr != this.data.chr) {
        this.data.chr = res.chr;
        this.signal('chr', res.chr);
        this.switchChr(res.chr);
      } else {
        this.loadBed(this.data.bedName, this.data.chr, this.data.detailXMin,
          this.data.detailXMax);
        this.loadTrackDetail(this.data.detailXMin, this.data.detailXMax);
      }
    }
  }.bind(this), 'cannot search for gene locus');
};

/**
 * Changes the chromosome of the genome browser.
 * @param {string} chr Chromosome.
 */
genotet.BindingLoader.prototype.switchChr = function(chr) {
  genotet.logger.log(genotet.logger.Type.BINDING, 'switchChr', chr);
  this.data.chr = chr;
  this.loadExons_(chr);
  this.loadFullTracks();
};

/**
 * Updates the detail and overall ranges for the data.
 * @private
 */
genotet.BindingLoader.prototype.updateRanges_ = function() {
  // Computes the overview range across all tracks.
  var overviewXMin = Infinity, overviewXMax = -Infinity;
  this.data.tracks.forEach(function(track) {
    overviewXMin = Math.min(overviewXMin, track.overview.xMin);
    overviewXMax = Math.max(overviewXMax, track.overview.xMax);
  }, this);

  // Overview range may change, then need to reset zoom state.
  if (overviewXMin != this.data.overviewXMin ||
    overviewXMax != this.data.overviewXMax) {
    this.data.overviewRangeChanged = true;
  }

  _.extend(this.data, {
    overviewXMin: overviewXMin,
    overviewXMax: overviewXMax
  });
  if (!this.data.detailXMin) {
    // If we do not have a detail range yet, then use the overview range.
    _.extend(this.data, {
      detailXMin: overviewXMin,
      detailXMax: overviewXMax
    });
  }
};

/**
 * Loads gene-binding mapping data, and maps the gene to binding track
 * file name.
 * @param {string} mappingFileName File name of mapping file.
 * @param {string} gene Gene name of mapping gene.
 */
genotet.BindingLoader.prototype.loadMapping = function(mappingFileName, gene) {
  genotet.logger.log(genotet.logger.Type.BINDING, 'loadMapping',
    mappingFileName, gene);
  var params = {
    type: genotet.mapping.QueryType.MAPPING,
    fileName: mappingFileName
  };
  this.get(genotet.data.serverUrl, params, function(data) {
    var mappingName = data;
    var fileName = mappingName[gene];
    this.signal('updateTrackWithMapping', fileName);
  }.bind(this), 'cannot load mapping file');
};

