// request json data file via http & jsonp
var addr = "jsonp.php";

var utils = new Utils();
// view manager
var manager = new ViewManager();

// timer
var layoutTimer, timerLayout, viewTimer, timerView;

// user interface
var options = new Options();
// pop up dialog
var dialog = new Dialog();

createMenu();

var welcome = new Welcome();

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

$( document ).tooltip({
	disabled : false,
	show: { delay: 3000 },
	hide: 1000
});

