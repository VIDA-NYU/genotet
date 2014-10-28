
// Chart Renderer

"use strict";

var extObject = {
  render: function() {
    // get the view this renderer belongs to
    var view = this.view;

    // this is to indicate the chart gets rendered once
    // NOTE: during the system startup, this chart will be rendered MULTIPLE times because
    // newly added views ocuppy some space and this chart's space is reduced
    // each time the chart's size gets reduced, onResize() is fired and the chart renders again
    console.log("chart rendered");

    // clear previous drawing
    d3.select("#canvas" + view.viewid + " svg").remove();

    // use d3 to set an svg
    this.svg = d3.select("#canvas" + view.viewid).append("svg");
    //$("#canvas" + view.viewid + " svg")
    //  .css("width", "100%")
    //  .css("height", "100%");
    this.svg
      .style("width", "100%")
      .style("height", "100%");
      //.style("height", "100%");
    // renders the data
    this.svg.selectAll("circle").data(view.data.points).enter()
      .append("circle")
      .attr("cx", function(d){ return d.x; })
      .attr("cy", function(d){ return d.y; })
      .attr("r", view.getViewWidth() / 100) // the circles get different radius when view is resized!
      .attr("fill", view.data.color);
  }
};

var ChartRenderer = Renderer.extend(extObject);
