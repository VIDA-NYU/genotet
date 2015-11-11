/**
 * @fileoverview Core of Genotet that contains the main entry of the system.
 */

'use strict';


var Core = {
  /**
   * Initializes the system components.
   * Run tests in the development environment.
   */
  init: function() {
    //Welcome.init();
    Data.init();
    PanelManager.init();
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

  /**
   * Displays a user visible warning message at the top of the screen.
   */
  warning: function() {
    var msg = Array.prototype.slice.call(arguments).join(' ');
    console.warn(msg);
    if (Options.allowAlert) {
      $('#warning').text(msg);
      $('#warning').parent().slideDown();
    }
  },

  /**
   * Displays a user visible error message at the top of the screen.
   */
  error: function() {
    var msg = Array.prototype.slice.call(arguments).join(' ');
    console.error(msg);
    if (Options.allowAlert) {
      $('#error').text(msg);
      $('#error').parent().slideDown();
    }
  }
};
