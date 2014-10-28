
// Chart Controller

"use strict";

var extObject = {
  display: function() {
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
