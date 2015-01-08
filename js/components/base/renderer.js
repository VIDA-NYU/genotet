
// Renderer

/*
 * Renderer is responsible to put html tags onto the screen.
 * The html tags include both standard html elements, i.e. div, span, table, etc.
 * and the svg tags, i.e. svg, line, circle, etc.
 * Note the difference between renderer and controller.
 * Controller displays the user interface to change the rendered results.
 * Renderer displays the canvas with proper visualization.
 */

"use strict";

var extObject = {
  render: function() {
    console.error("render() is not implemented");
  }
};

var Renderer = Base.extend(extObject);
