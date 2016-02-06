/**
 * @fileoverview Contains the BindingView component definition.
 */

'use strict';

/**
 * @typedef {{
 *   gene: string,
 *   fileName: string,
 *   overview: !Array<{x: number, value: number}>,
 *   detail: !Array<{x: number, value: number}>,
 *   xMin: number,
 *   xMax: number
 * }}
 *   gene: Data name for this file.
 *   fileName: File name for the wiggle file.
 */
genotet.bindingTrack;

/**
 * @typedef {{
 *   aggregated: boolean,
 *   motifs: !Array<{
 *     chrStart: number,
 *     chrEnd: number,
 *     label: (string|undefined)
 *   }>
 * }}
 */
genotet.Bed;

/**
 * @typedef {{
 *   name: string,
 *   name2: string,
 *   txStart: number,
 *   txEnd: number,
 *   strand: string,
 *   txRanges: !Array<{start: number, end: number}>,
 *   exRanges: !Array<{start: number, end: number}>
 * }}
 */
genotet.Exon;

/**
 * @typedef {{
 *   overviewXMin: number,
 *   overviewXMax: number,
 *   tracks: !Array<!genotet.bindingTrack>,
 *   bed: !genotet.Bed,
 *   bedName: string,
 *   exons: !Array<!genotet.Exon>
 * }}
 */
genotet.bindingData;

/**
 * @typedef {{
 *   fileNames: (!Array<string>|string),
 *   bedName: string,
 *   chr: string,
 *   multipleTracks: boolean
 * }}
 */
genotet.BindingViewParams;

/**
 * BindingView extends the base View class, and renders the binding data
 * associated with the regulatory Binding.
 * @param {string} viewName Name of the view.
 * @param {genotet.BindingViewParams} params
 * @extends {genotet.View}
 * @constructor
 */
genotet.BindingView = function(viewName, params) {
  genotet.BindingView.base.constructor.call(this, viewName);

  /**
   * @protected {genotet.bindingData}
   */
  this.data;

  this.container.addClass('binding');

  /** @protected {genotet.BindingLoader} */
  this.loader = new genotet.BindingLoader(this.data);

  /** @protected {genotet.BindingPanel} */
  this.panel = new genotet.BindingPanel(this.data);

  /** @protected {genotet.BindingRenderer} */
  this.renderer = new genotet.BindingRenderer(this.container, this.data);

  // Set up data loading callbacks.
  $(this.container).on('genotet.ready', function() {
    if (params.multipleTracks) {
      this.loader.loadMultipleTracks(
        /** @type {!Array<string>} */(params.fileNames), params.bedName,
        params.chr);
    } else {
      this.loader.load(/** @type {string} */(params.fileNames),
        params.bedName, params.chr);
    }
  }.bind(this));

  $(this.renderer)
    .on('genotet.zoom', function(event, data) {
      this.loader.loadTrackDetail(data.xl, data.xr);
      this.loader.loadBed(data.bedName, data.chr, data.xl, data.xr);
    }.bind(this))
    .on('genotet.coordinates', function(event, data) {
      this.panel.updateCoordinates(data.start, data.end);
    }.bind(this));

  $(this.panel)
    .on('genotet.coordinate', function(event, data) {
      var range = data.type == 'start' ?
        [data.coordinate, this.data.detailXMax] :
        [this.data.detailXMin, data.coordinate];
      if (range[0] > range[1]) {
        genotet.warning('start coordinate must be <= end coordinate:', range);
        return;
      }
      if (range[0] < this.data.overviewXMin ||
        range[1] > this.data.overviewXMax) {
        genotet.warning('coordinate out of range',
            [this.data.overviewXMin, this.data.overviewXMax]);
        return;
      }
      this.loader.loadTrackDetail(range[0], range[1]);
      this.loader.loadBed(data.bedName, data.chr, range[0], range[1]);
      this.renderer.zoomTransform(range);
    }.bind(this))
    .on('genotet.locus', function(event, gene) {
      if (!gene) {
        genotet.warning('please enter gene name');
        return;
      }
      this.loader.findLocus(gene);
    }.bind(this))
    .on('genotet.chr', function(event, chr) {
      this.loader.switchChr(chr);
    }.bind(this))
    .on('genotet.update', function(event, data) {
      // Switch updates
      this.renderer.render();
    }.bind(this))
    .on('genotet.addTrack', function() {
      var track = this.data.tracks.slice(-1).pop();
      this.loader.loadFullTrack(this.data.tracks.length, track.fileName,
        this.data.chr, true);
    }.bind(this))
    .on('genotet.removeTrack', function(event, trackIndex) {
      this.data.tracks.splice(trackIndex, 1);
      this.renderer.render();
      this.panel.updateTracks();
    }.bind(this))
    .on('genotet.updateTrack', function(event, data) {
      this.data.tracks[data.trackIndex].fileName = data.fileName;
      this.loader.loadFullTrack(data.trackIndex, data.fileName,
        this.data.chr, false);
    }.bind(this))
    .on('genotet.loadBindingList', function() {
      this.loader.loadBindingList();
    }.bind(this))
    .on('genotet.loadMapping', function(event, data) {
      this.loader.loadMapping(data.mappingFileName, data.gene);
    }.bind(this));

  $(this.loader)
    .on('genotet.chr', function(event, chr) {
      this.panel.updateChr(chr);
    }.bind(this))
    .on('genotet.addPanelTrack', function() {
      this.panel.updateTracks();
    }.bind(this))
    .on('genotet.updateTrackList', function() {
      this.panel.updateTrackList();
    }.bind(this))
    .on('genotet.updateLinkTrack', function(event, fileName) {
      this.updateLinkTrack_(fileName);
    }.bind(this));

  // Set up link callbacks.
  $(this)
    .on('genotet.updateTrack', function(event, data) {
      var genes = /** @type {!Array<string>} */ (data);

      // Get the gene from the clicked node,
      // or the source gene from the clicked edge.
      var sourceGene = genes[0];
      var mappingFileName = genotet.data.mappingFile['gene-binding'];
      if (mappingFileName == 'Direct Mapping') {
        var fileName = sourceGene + '.bw';
        this.loader.signal('updateLinkTrack', fileName);
      } else {
        this.panel.signal('loadMapping', {
          mappingFileName: mappingFileName,
          gene: sourceGene
        });
      }
    }.bind(this))
    .on('genotet.locus', function(event, data) {
      var genes = /** @type {!Array<string>} */ (data);

      // Get the target gene from the clicked edge.
      var targetGene = genes[1];
      if (targetGene) {
        this.panel.signal('locus', targetGene);
      }
    }.bind(this));
};

genotet.utils.inherit(genotet.BindingView, genotet.View);

/** @override */
genotet.BindingView.prototype.defaultWidth = function() {
  return Math.max(this.MIN_WIDTH,
      $(window).width() - genotet.panelManager.COLLAPSED_WIDTH);
};

/** @override */
genotet.BindingView.prototype.defaultHeight = function() {
  return 200;
};

/**
 * Updates link binding track for panel.
 * @param {string} fileName File name of the updated link track.
 * @private
 * */
genotet.BindingView.prototype.updateLinkTrack_ = function(fileName) {
  if (!fileName) {
    genotet.warning('mapping file not found');
    return;
  }
  this.panel.signal('updateTrack', {
    trackIndex: 0,
    fileName: fileName
  });
  this.loader.signal('addPanelTrack');
};
