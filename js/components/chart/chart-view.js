
// Chart View

/*
 * Renders a standard line chart
 */

"use strict";

var extObject = {
  createHandlers: function() {
    this.loader = ChartLoader.new();
    this.controller = ChartController.new();
    this.renderer = ChartRenderer.new();
  },
  toggleColor: function() {
    if (this.data.color === "red") this.data.color = "blue";
    else this.data.color = "red";
    this.renderer.render();
  },
  onResize: function(width, height) {
    this.renderer.render();
  }
};

var ChartView = View.extend(extObject);
