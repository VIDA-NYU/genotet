
// Chart Controller

/*
 * The controller of the chart displays necessary controls (checkboxes, input box, etc) to show
 * proper visualization in the chart's main view (canvas)
 */

"use strict";

var extObject = {
  display: function() {
    // display function MUST be implemented in the view's controller
    // this function will be called when the view is activated (by user clicking)

    // get the view this controller belongs to
    var view = this.view;

    // obtain the jquery node for controller (at top-right of the system)
    var jqctrl = view.getJqController();

    // clear the things there
    jqctrl.children().remove();

    // append a new div as wrapper, which would contain a button
    var wrapper = $("<div></div>").appendTo(jqctrl);
    $("<input type='button' value='Chart - Toggle Color'>")
      .button()
      .click( function() {
        view.toggleColor(); // when clicked, this fires the toggleColor function of the chart view
      })
      .appendTo(wrapper);
  }
};

var ChartController = Controller.extend(extObject);
