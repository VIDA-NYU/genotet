// request json data file via http & jsonp
var addr = 'jsonp.php';

var Core = {
  init: function() {
    //Welcome.init();
    Data.init();
    ViewManager.init();
    Menu.init();
    Options.init();

    $('.alert button').click(function() {
      $(this).parent().slideUp();
    });
  },

  warning: function() {
    var msg = Array.prototype.slice.call(arguments).join(' ');
    console.warn(msg);
    $('#warning').text(msg);
    $('#warning').parent().slideDown();
  },

  error: function() {
    var msg = Array.prototype.slice.call(arguments).join(' ');
    console.error(msg);
    $('#error').text(msg);
    $('#error').parent().slideDown();
  }
};


// obsolete examples
/*
createView("Network", "graph").loadData("th17", "^BATF$|^RORC$|^STAT3$|^FOSL2$|^MAF$|^IRF4$");
createView("Heatmap", "heatmap").loadData("sigA");
createView("Binding", "histogram").loadData("BATF");
createView("Binding2", "histogram").loadData("IRF4");
linkView("Network", "Heatmap");
linkView("Network", "Binding");
groupView("Binding", "Binding2");
*/



