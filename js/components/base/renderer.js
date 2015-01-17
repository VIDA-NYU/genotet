
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
  // this function shall be implemented by inheriting classes
  render: function() {
    console.error("render() is not implemented");
  },

  // display a waiting icon
  wait: function() {
    var view = this.view;
    this.jqwaitbg = $("<div></div>")
      .attr("id", "wait")
      .attr("class", "view-wait-background")
      .css("width", view.getCanvasWidth())
      .css("height", view.getCanvasHeight())
      .insertAfter(view.jqheader);
    this.jqwaiticon = $("<div></div>")
      .attr("id", "wait")
      .attr("class", "view-wait-icon")
      .css("width", view.getCanvasWidth())
      .css("height", view.getCanvasHeight())
      .insertAfter(view.jqheader);
  },
  // hide the waiting icon
  unwait: function() {
    $(this.jqwaitbg).remove();
    $(this.jqwaiticon).remove();
  }
};

var Renderer = Base.extend(extObject);
