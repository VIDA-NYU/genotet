// request json data file via http & jsonp
var addr = 'jsonp.php';

var Core = {
  init: function() {
    //Welcome.init();
    Data.init();
    ViewManager.init();
    Menu.init();
    Options.init();

    // Allow turning off an alert.
    $('.alert button').click(function() {
      $(this).parent().slideUp();
    });

    // Blur all the views upon clicking on the background.
    $('html').click(function() {
      ViewManager.blurAllViews();
    });

    Test.run();
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
