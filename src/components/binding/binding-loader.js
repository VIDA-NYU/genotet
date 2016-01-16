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
 * @param {string} gene Name of the gene.
 * @param {string} bedName Bed name of the bed binding track.
 * @param {string} chr ID of the chromosome.
 * @param {number=} opt_track Track # into which the data is loaded.
 * @override
 */
genotet.BindingLoader.prototype.load = function(gene, bedName, chr, opt_track) {
  var trackIndex = opt_track ? opt_track : this.data.tracks.length;
  this.data.chr = chr;
  this.loadFullTrack(trackIndex, gene, bedName, chr);
  this.loadExons_(chr);
};

/**
 * loads the full binding data for all tracks. This usually happens
 * when chromosome is changed.
 */
genotet.BindingLoader.prototype.loadFullTracks = function() {
  this.data.tracks.forEach(function(track) {
    // First send query for the overview (without detail range).
    var params = {
      type: 'binding',
      gene: track.gene,
      chr: this.data.chr
    };
    this.get(genotet.data.serverURL, params, function(data) {
      track.overview = data;
      this.updateRanges_();
    }.bind(this), 'cannot load binding overview');

    // Send query for the details.
    _.extend(params, {
      xl: this.data.detailXMin,
      xr: this.data.detailXMax
    });
    this.get(genotet.data.serverURL, params, function(data) {
      track.detail = data;
      this.updateRanges_();
    }.bind(this), 'cannot load binding detail');
  }, this);
};

/**
 * Loads the data of a single binding track.
 * @param {number} trackIndex Track index.
 * @param {string} gene Gene name.
 * @param {string} bedName Bed name of the bed binding track.
 * @param {string} chr Chromosome.
 */
genotet.BindingLoader.prototype.loadFullTrack = function(trackIndex, gene,
                                                         bedName, chr) {
  var params = {
    type: 'binding',
    gene: gene,
    chr: chr
  };
  this.get(genotet.data.serverURL, params, function(data) {
    var track = {
      gene: gene,
      overview: data,
      detail: data
    };
    var addTrack = trackIndex == this.data.tracks.length;
    this.data.tracks[trackIndex] = track;
    this.updateRanges_();
    this.loadBed(bedName, chr, this.data.detailXMin, this.data.detailXMax);
    if (addTrack) {
      // Add one more track.
      this.loadBindingList();
    }
  }.bind(this), 'cannot load binding overview');

  if (this.data.detailXMin) {
    // If we have a previously defined detail range, then keep the range.
    _.extend(params, {
      xl: this.data.detailXMin,
      xr: this.data.detailXMax
    });
    this.get(genotet.data.serverURL, params, function(data) {
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
 * @param {string} bedName Bed name of the bed binding track.
 * @param {string} chr Chromosome.
 * @param {number|undefined} xl Left coordinate of the query range.
 *   If null, use the leftmost coordinate of the track.
 * @param {number|undefined} xr Right coordinate of the query range.
 *   If null, use the rightmost coordinate of the track.
 */
genotet.BindingLoader.prototype.loadBed = function(bedName, chr, xl, xr) {
  var params = {
    type: 'bed',
    bedName: bedName,
    chr: chr,
    xl: xl,
    xr: xr
  };
  this.get(genotet.data.serverURL, params, function(data) {
    this.data.bed = data;
    this.data.bedName = bedName;
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
      type: 'binding',
      gene: track.gene,
      chr: this.data.chr,
      xl: xl,
      xr: xr
    };
    this.get(genotet.data.serverURL, params, function(data) {
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
    type: 'exons',
    chr: chr
  };
  this.get(genotet.data.serverURL, params, function(data) {
    this.data.exons = data;
  }.bind(this), 'cannot load binding data');
};


/**
 * Queries the locus of a given gene.
 * @param {string} gene Gene name to be searched for.
 */
genotet.BindingLoader.prototype.findLocus = function(gene) {
  var params = {
    type: 'locus',
    gene: gene
  };
  this.get(genotet.data.serverURL, params, function(res) {
    if (!res.success) {
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
  this.data.overviewRangeChanged = overviewXMin != this.data.overviewXMin ||
    overviewXMax != this.data.overviewXMax;

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
 * Loads binding data list into genotet.data.bindingGenes.
 */
genotet.BindingLoader.prototype.loadBindingList = function() {
  var params = {
    type: 'list-binding'
  };
  this.get(genotet.data.serverURL, params, function(data) {
    genotet.data.bindingGenes = [];
    data.forEach(function(bindingGene) {
      genotet.data.bindingGenes.push(bindingGene.gene);
    });
    this.signal('track');
  }.bind(this), 'cannot load binding list');
};
