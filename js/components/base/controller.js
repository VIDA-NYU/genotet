
// Controller

/*
 * Controller display proper UI control (e.g. checkbox, input box) at the top-right of the system.
 * Each view shall have its own controller rendered as soon as the view is active (clicked by user).
 * The controller has its elements linked to proper functions to modify/update data model.
 */

"use strict";

var extObject = {
  display: function() {
    // the display function of controller is called once the view is activated (by user clicking)
  }
};

var Controller = Base.extend(extObject);
