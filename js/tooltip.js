/**
 * @fileoverview Genotet tooltip.
 */

'use strict';

var Tooltip = {

  /**
   * Tooltip container
   * @private {jQuery}
   */
  container_: null,

  /** @private {number} */
  mouseX_: 0,
  /** @private {number} */
  mouseY_: 0,

  /**
   * Default offset of the tooltip away from the cursor.
   * @const @private {number}
   */
  DEFAULT_OFFSET_: 5,

  /**
   * Initializes the tooltip. Gets the tooltip container.
   */
  init: function() {
    this.container_ = $('#tooltip').hide();

    // Set up mouse tracker.
    $(window).mousemove(function(event) {
      this.mouseX_ = event.pageX;
      this.mouseY_ = event.pageY;
    }.bind(this));
  },

  /**
   * Requests a new tooltip container at the given coordinates.
   * Currently only max 1 tooltip will be shown so we return the global
   * tooltip container.
   * @param {number=} opt_x X coordinate of the tooltip.
   * @param {number=} opt_y Y coordinate of the tooltip.
   * @return {!jQuery} Tooltip container.
   */
  new: function(opt_x, opt_y) {
    var x = opt_x == null ? this.mouseX_ : opt_x;
    var y = opt_y == null ? this.mouseY_ : opt_y;
    x += this.DEFAULT_OFFSET_;
    y += this.DEFAULT_OFFSET_;
    // Clear previous content.
    this.hideAll();

    this.container_.css({
      left: x,
      top: y
    });
    return this.container_.show();
  },

  /**
   * Hides all tooltips.
   */
  hideAll: function() {
    this.container_.children('*').remove();
    this.container_.hide();
  }
};