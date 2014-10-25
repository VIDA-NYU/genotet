
// Welcome View

/*
 * The welcome window that pops up when system is launched.
 * Copied from old Genotet. Need to rewrite.
 */

"use strict";

function Welcome(){
    var wc = this;
    $("body").append("<div id='block' class='block'></div>");
    $("#block").css({"width":screen.width, "height":screen.height});
    $("body").append("<div id='welcome' title='Welcome to GENOTET'></div>");

    $("#welcome").append("<p>You may read the help document, load the preset layout, or start a new session.</p>");
    $("#welcome").dialog({
        close: function(){
            $("#block").remove();
        },
        buttons: {
            "Help": function(){  wc.close(); window.open("help.html");  },
            "Default": function(){ wc.close(); manager.loadPreset("default"); },
            "New": function(){ wc.close(); dialog.dialogCreate(); }
        }
	});
    $("#welcome").addClass("viewshadow");
}

Welcome.prototype.close = function(){
    $("#welcome").remove();
    $("#block").remove();
};