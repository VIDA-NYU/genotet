
// Menu Renderer

"use strict";

var extObject = {
  render: function() {
    var jqnode = this.view.getJqCanvas();
    jqnode.children().remove();
    var datamenu = $("<div name='ui'></div>").appendTo($(jqnode));

    datamenu.append("" +
    "<h3 title = 'Shortcut panel for view editing'>View Panel</h3>" +
    "<div>" +
    "<div><input type='button' id='create' value='Create View' title='Create a view'></div>" +
    /*
    "<div><input type='button' id='link' value='Link Views' title='Link two views'></div>" +
    "<div><input type='button' id='unlink' value='Unlink Views' title='Unlink two views'></div>" +
    "<div><input type='button' id='group' value='Group Views' title='Group two views'></div>" +
    */
    "<div><input type='button' id='close' value='Close All Views' title='Close all views'></div>" +
    "</div>" +
    "<h3 title = 'Load preset layout configuration'>Preset Layout</h3>" +
    "<div>" +
    "<div><input type='button' id='preset_test' value='Test Preset'></div>" +
    /*
    "<div><input type='button' id='preset_default' value='Default Preset' title='Default layout that has everything'></div>" +
    "<div><input type='button' id='preset_binding_3' value='3-Track Binding' title='Preset layout for 3-track genome browser'></div>" +
    "<div><input type='button' id='preset_binding_4' value='4-Track Binding' title='Preset layout for 4-track genome browser'></div>" +
    "<div><input type='button' id='preset_binding_6' value='6-Track Binding' title='Preset layout for 6-track genome browser'></div>" +
    "<div><input type='button' id='preset_expmat' value='Expmat Preset' title='Preset layout for expression matrix visualization'></div>" +
    "<div><input type='button' id='preset_network' value='Network Preset' title='Preset layout for network comparison'></div>" +
    */
    "</div>" +
    "<h3 title = 'Application-wide options'>System Option</h3>" +
    "<div>" +
    "<div><input type='button' id='document' value='Read Document'></div>" +
    /*
    "<div><input type='checkbox' id='silent' title='Turn on/off all alerts'> Silence Mode</div>" +
    "<div><input type='checkbox' id='hint' title='Turn on/off all hints'> Show Hints</div>" +
    */
    "</div>"
    );

    var layout = this;
    $(jqnode).find("input[type='button']").button().css({"width": "130px"});
    $(jqnode).find("#hint").attr("checked", options.hint)
      .change(function(){ return layout.toggleHint(); });
    $(jqnode).find("#silent").attr("checked", options.silent)
      .change(function(){ return layout.toggleSilent(); });

    datamenu.accordion({
      collapsible: false,
      heightStyle: "content",
      animate: true
    });
    datamenu.find("h3").css( "text-align", "left" );
    datamenu.css({'font-size':'12px'});
    /*
    $(jqnode).find("th").addClass("ui-state-default");
    $(jqnode).find("td").addClass("ui-widget-content");
    $(jqnode).find("tr")
      .css("min-height", 0)
      .hover( function(){ $(this).children("td").addClass("table_hover"); },
          function(){ $(this).children("td").removeClass("table_hover"); } )
      .click( function(){
        $(this).children("td").toggleClass("table_hover");
        $(this).children("td").toggleClass("table_highlight");
      });
  */

    $(jqnode).find("#create").click( function(){ return dialog.dialogCreate(); });
    /*
    $(jqnode).find("#link").click( function(){ return dialog.dialogLink(); });
    $(jqnode).find("#unlink").click( function(){ return dialog.dialogUnlink(); });
    $(jqnode).find("#group").click( function(){ return dialog.dialogGroup(); });
    */
    $(jqnode).find("#close").click( function(){ closeAllViews(); });

    $(jqnode).find("#preset_test").click( function() {
      viewManager.closeAllViews();
      viewManager.loadPreset("test");
    });
    /*
    $(jqnode).find("#preset_binding_3").click( function(){ viewManager.loadPreset("binding_3"); });
    $(jqnode).find("#preset_binding_4").click( function(){ viewManager.loadPreset("binding_4"); });
    $(jqnode).find("#preset_binding_6").click( function(){ viewManager.loadPreset("binding_6"); });
    $(jqnode).find("#preset_expmat").click( function(){ viewManager.loadPreset("expmat"); });
    $(jqnode).find("#preset_network").click( function(){ viewManager.loadPreset("network"); });
    */
    $(jqnode).find("#document").click( function(){
      window.open('document.html');
    });
  },
  toggleSilent: function(){
    user.silent = !user.silent;
    //$("#"+this.htmlid+" #silent").attr("checked", user.silent);
  },
  toggleHint: function(){
    user.hint = !user.hint;
    //$("#"+this.htmlid+" #hint").attr("checked", user.hint);
    if(!user.hint) $( document ).tooltip("disable");
    else $(document).tooltip("enable");
  },
  resizeLayout: function(newsize){
    //$("#"+this.htmlid+" .ui-accordion-content").css("width", newsize[0]);
    this.removeLayout();
    this.renderUI();
  },
  removeLayout: function(){
    $("#"+this.htmlid+" div[name='ui']").remove();
  },
  setCompact: function(compact){
    this.compactLayout = compact;
    this.removeLayout();

    if(this.compactLayout==false){
      this.renderUI();
    }
  }
};

var MenuRenderer = Renderer.extend(extObject);
