
// Menu View

/*
 * Exactly one menu view would exist at any time
 */
"use strict";

var extObject = {
  prepareHeaderButtons: function() {
    // menu view does not have header buttons
    // so we override this function with empty content
  },
  createHandlers: function() {
    this.loader = Loader.new();
    this.controller = Controller.new();
    this.renderer = MenuRenderer.new();
  }
};

var MenuView = View.extend(extObject);
