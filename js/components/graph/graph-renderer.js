
// Graph Renderer

"use strict";

var extObject = {
  render: function() {

    var view = this.view;

    console.log("graph rendered");

    d3.select("#canvas" + view.viewid + " svg").remove();

    this.svg = d3.select("#canvas" + view.viewid).append("svg");

    this.svg
      .style("width", view.getCanvasWidth())
      .style("height", view.getCanvasHeight())
      .style("background", "white");

    var points = [
        {x:10, y:30},
        {x:20, y:60},
        {x:50, y:50},
        {x:70, y:150},
        {x:100, y:20}
      ];
    this.svg.selectAll("circle").data(points).enter()
      .append("circle")
      .attr("cx", function(d){ return d.x; })
      .attr("cy", function(d){ return d.y; })
      .attr("r", view.getViewWidth() / 100) // the circles get different radius when view is resized!
      .attr("fill", "blue");
  }
};

var GraphRenderer = Renderer.extend(extObject);
