/**
 * @fileoverview Genotet tooltip.
 */

'use strict';

/** @const */
genotet.tooltip = {};

/**
 * Tooltip container
 * @private {jQuery}
 */
genotet.tooltip.container_ = null;

/** @private {number} */
genotet.tooltip.mouseX_ = 0;
/** @private {number} */
genotet.tooltip.mouseY_ = 0;

/**
 * Default offset of the tooltip away from the cursor.
 * @const @private {number}
 */
genotet.tooltip.DEFAULT_OFFSET_ = 5;

/**
 * Initializes the tooltip. Gets the tooltip container.
 */
genotet.tooltip.init = function() {
  genotet.tooltip.container_ = $('#tooltip').hide();

  // Set up mouse tracker.
  $(window).mousemove(function(event) {
    genotet.tooltip.mouseX_ = event.pageX;
    genotet.tooltip.mouseY_ = event.pageY;
  });
};

/**
 * Requests a new tooltip container at the given coordinates.
 * Currently only max 1 tooltip will be shown so we return the global
 * tooltip container.
 * @param {number=} opt_x X coordinate of the tooltip.
 * @param {number=} opt_y Y coordinate of the tooltip.
 * @return {!jQuery} Tooltip container.
 */
genotet.tooltip.create = function(opt_x, opt_y) {
  var x = opt_x == null ? genotet.tooltip.mouseX_ : opt_x;
  var y = opt_y == null ? genotet.tooltip.mouseY_ : opt_y;
  x += genotet.tooltip.DEFAULT_OFFSET_;
  y += genotet.tooltip.DEFAULT_OFFSET_;
  // Clear previous content.
  genotet.tooltip.hideAll();

  genotet.tooltip.container_.css({
    left: x,
    top: y
  });
  return genotet.tooltip.container_.show();
};

/**
 * Hides all tooltips.
 */
genotet.tooltip.hideAll = function() {
  genotet.tooltip.container_.children('*').remove();
  genotet.tooltip.container_.hide();
};
