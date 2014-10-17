// request json data file via http & jsonp
var addr = "jsonp.php";

// utils functions
var utils;
// view manager
var manager;
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

Core.prototype.init = function() {
  utils = new Utils();
  manager = new ViewManager();
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

  createView("Network", "graph").loadData("th17", "BATF");
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



