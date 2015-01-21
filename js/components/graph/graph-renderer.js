
// Graph Renderer

"use strict";

var extObject = {
  render: function() {

    var view = this.view;

    d3.select("#canvas" + view.viewid + " svg").remove();

    this.svg = d3.select("#canvas" + view.viewid).append("svg");

    this.svg
      .style("width", view.getCanvasWidth())
      .style("height", view.getCanvasHeight())
      .style("background", "white");

    this.svg.selectAll("circle").data(view.renderData.nodes).enter()
      .append("circle")
      .attr("cx", function(d){ return d.x; })
      .attr("cy", function(d){ return d.y; })
      .attr("r", 10) // the circles get different radius when view is resized!
      .attr("fill", "blue");
  },

  update: function() {
    this.render();
  }
};

var GraphRenderer = Renderer.extend(extObject);
