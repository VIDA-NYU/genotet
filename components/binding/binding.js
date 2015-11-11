/**
 * @fileoverview Contains the BindingView component definition.
 */

'use strict';

/**
 * BindingView extends the base View class, and renders the binding data
 * associated with the regulatory Binding.
 * @param {string} viewName Name of the view.
 * @param {!Object} params Additional parameters.
 * @extends {View}
 * @constructor
 */
function BindingView(viewName, params) {
  BindingView.base.constructor.call(this, viewName);

  this.container.addClass('binding');

  /** @protected {BindingLoader} */
  this.loader = new BindingLoader(this.data);

  /** @protected {BindingPanel} */
  this.panel = new BindingPanel(this.data);

  /** @protected {BindingRenderer} */
  this.renderer = new BindingRenderer(this.container, this.data);

  // Set up data loading callbacks.
  $(this.container).on('genotet.ready', function() {
    this.loader.load(params.gene, params.chr);
  }.bind(this));

  $(this.renderer)
    .on('genotet.zoom', function(event, data) {
      this.loader.loadTrackDetail(data.xl, data.xr);
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
        Core.warning('start coordinate must be <= end coordinate:', range);
        return;
      }
      if (range[0] < this.data.overviewXMin ||
        range[1] > this.data.overviewXMax) {
        Core.warning('coordinate out of range',
            [this.data.overviewXMin, this.data.overviewXMax]);
        return;
      }
      this.loader.loadTrackDetail(range[0], range[1]);
      this.renderer.zoomTransform(range);
    }.bind(this))
    .on('genotet.locus', function(event, gene) {
      this.loader.findLocus(gene);
    }.bind(this))
    .on('genotet.chr', function(event, chr) {
      this.loader.switchChr(chr);
    }.bind(this))
    .on('genotet.update', function(event, data) {
      // Switch updates
      this.renderer.render();
    }.bind(this))
    .on('genotet.add-track', function() {
      var track = this.data.tracks.slice(-1).pop();
      this.loader.loadFullTrack(this.data.tracks.length, track.gene,
          this.data.chr);
    }.bind(this))
    .on('genotet.remove-track', function(event, trackIndex) {
      this.data.tracks.splice(trackIndex, 1);
      this.renderer.render();
      this.panel.updateTracks();
    }.bind(this))
    .on('genotet.gene', function(event, data) {
      this.data.tracks[data.trackIndex].gene = data.gene;
      this.loader.loadFullTrack(data.trackIndex, data.gene, this.data.chr);
    }.bind(this));

  $(this.loader)
    .on('genotet.chr', function(event, chr) {
      this.panel.updateChr(chr);
    }.bind(this))
    .on('genotet.track', function(event) {
      this.panel.updateTracks();
    }.bind(this));
}

BindingView.prototype = Object.create(View.prototype);
BindingView.prototype.constructor = BindingView;
BindingView.base = View.prototype;

/** @override */
BindingView.prototype.defaultWidth = function() {
  return Math.max(this.MIN_WIDTH,
      $(window).width() - PanelManager.COLLAPSED_WIDTH);
};

/** @override */
BindingView.prototype.defaultHeight = function() {
  return 200;
};