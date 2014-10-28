
// Genotet Core

/*
 * The core object prepares all the objects necessary for the system.
 */

"use strict";

/************************ WARNING *************************
 *                    MESSY CODE ZONE!                    *
 **********************************************************/

// request json data file via http & jsonp
var addr = "jsonp.php";

// utils functions
var utils;
// view manager
var viewManager;
// layout manager
var layoutManager;
// timer
var layoutTimer, timerLayout, viewTimer, timerView;
// user interface
var options;
// pop up dialog
var dialog;
// welcome window
var welcome;
// system core
var core;

function Core(){
  this.init();
}

Core.prototype.initViews = function() {
  // create the default views

  // currently we load the test preset
  viewManager.loadPreset("test");
};

Core.prototype.init = function() {
  utils = new Utils();
  viewManager = new ViewManager();
  options = new Options();
  dialog = new Dialog();
  layoutManager = new LayoutManager();

  createMenu();

  //welcome = new Welcome();

  $( document ).tooltip({
    disabled : true,
    show: { delay: 3000 },
    hide: 1000
  });

  this.initViews();
};

// examples
/*
createView("Network", "graph").loadData("th17", "^BATF$|^RORC$|^STAT3$|^FOSL2$|^MAF$|^IRF4$");
createView("Heatmap", "heatmap").loadData("sigA");
createView("Binding", "histogram").loadData("BATF");
createView("Binding2", "histogram").loadData("IRF4");
linkView("Network", "Heatmap");
linkView("Network", "Binding");
groupView("Binding", "Binding2");
*/



