
// Chart View

/*
 * Chart view renders a standard line chart
 *
 * NOTE: This is currently NOT rendering any line!
 * Right now it is an example of how to write a component for Genotet
 *
 */

"use strict";

var extObject = {
  // createHandlers MUST be implemented, otherwise error will be thrown when the view is created
  createHandlers: function() {
    // Here ChartLoader is a class inheriting the base class Loader
    // Same appiles to controller and renderer
    this.loader = ChartLoader.new();
    this.controller = ChartController.new();
    this.renderer = ChartRenderer.new();

    // If you don't need one of the above, say, you don't need a controller
    // you can use the base class as a placeholder (which does nothing)
    /*
    this.controller = Controller.new();
     */
  },

  toggleColor: function() {
    // This changes the data attribute color
    if (this.data.color === "red")
      this.data.color = "blue";
    else
      this.data.color = "red";
    // When the data gets rendered again, new color will be applied
    this.renderer.render();
  },

  onResize: function(width, height) {
    // once the view is resized, we re-render everything
    // Note that you may want to re-render in a cleverer way without clearing the entire canvas
    // e.g. you can just update the things that get changed
    this.renderer.render();
  }
};

// ChartView inherits base class view, see view.js for details
var ChartView = View.extend(extObject);
