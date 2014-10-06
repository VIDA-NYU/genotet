function LayoutMenu(htmlid, width, height) {

  this.htmlid = htmlid;
  this.width = width;
  this.height = height;

  this.compactLayout = false;

  this.renderUI();
}

LayoutMenu.prototype.renderUI = function(){
	$("#"+this.htmlid).append("<div name='ui'></div>");
	var datamenu = $("#"+this.htmlid+" > div[name='ui']");

	datamenu.append("" +
	"<h3 title = 'Shortcut panel for view editing'>View Panel</h3>" +
	"<div>" +
	"<div><input type='button' id='create' value='Create View' title='Create a view'></div>" +
	"<div><input type='button' id='link' value='Link Views' title='Link two views'></div>" +
	"<div><input type='button' id='unlink' value='Unlink Views' title='Unlink two views'></div>" +
	"<div><input type='button' id='group' value='Group Views' title='Group two views'></div>" +
	"<div><input type='button' id='close' value='Close All Views' title='Close all views'></div>" +
	"</div>" +
	"<h3 title = 'Load preset layout configuration'>Preset Layout</h3>" +
	"<div>" +
	"<div><input type='button' id='preset_default' value='Default Preset' title='Default layout that has everything'></div>" +
	"<div><input type='button' id='preset_binding_3' value='3-Track Binding' title='Preset layout for 3-track genome browser'></div>" +
	"<div><input type='button' id='preset_binding_4' value='4-Track Binding' title='Preset layout for 4-track genome browser'></div>" +
	"<div><input type='button' id='preset_binding_6' value='6-Track Binding' title='Preset layout for 6-track genome browser'></div>" +
	"<div><input type='button' id='preset_expmat' value='Expmat Preset' title='Preset layout for expression matrix visualization'></div>" +
	"<div><input type='button' id='preset_network' value='Network Preset' title='Preset layout for network comparison'></div>" +
	"</div>" +
	"<h3 title = 'Application-wide options'>System Option</h3>" +
	"<div>" +
	"<div><input type='button' id='help' value='Read Document' title='Read the help document of Genotet'></div>" +
	"<div><input type='checkbox' id='silent' title='Turn on/off all alerts'> Silence Mode</div>" +
	"<div><input type='checkbox' id='hint' title='Turn on/off all hints'> Show Hints</div>" +
	"</div>"
	);
	//<table>" +
	//<tr><th>Name</th><th>Author</th><th>Description</th></tr>" +
	//</table>" +

	var layout = this;
	$("#"+this.htmlid+" input[type='button']").button().css({"width": "130px"});
	$("#"+this.htmlid+" #hint").attr("checked", options.hint)
		.change(function(){ return layout.toggleHint(); });
	$("#"+this.htmlid+" #silent").attr("checked", options.silent)
		.change(function(){ return layout.toggleSilent(); });

	datamenu.accordion({
		collapsible: false,
		heightStyle: "content",
		animate: true
	});
	datamenu.find("h3").css( "text-align", "left" );
	//$("#"+this.htmlid+" .ui-accordion-content:first")
		//.css("padding", "0em 0em")
		//.css("width", this.width);
		//.next().next().css("width", this.width+"px")
		//.css("padding", "0em 0em")
		//.css("width", this.width);

	datamenu.css({'font-size':'12px'});
	$("#"+this.htmlid+" th").addClass("ui-state-default");
	$("#"+this.htmlid+" td").addClass("ui-widget-content");
	$("#"+this.htmlid+" tr")
		.css("min-height", 0)
		.hover( function(){ $(this).children("td").addClass("table_hover"); },
				function(){ $(this).children("td").removeClass("table_hover"); } )
		.click( function(){
			$(this).children("td").toggleClass("table_hover");
			$(this).children("td").toggleClass("table_highlight");
		});

	$("#"+this.htmlid+ " #create").click( function(){ return dialog.dialogCreate(); });
	$("#"+this.htmlid+ " #link").click( function(){ return dialog.dialogLink(); });
	$("#"+this.htmlid+ " #unlink").click( function(){ return dialog.dialogUnlink(); });
	$("#"+this.htmlid+ " #group").click( function(){ return dialog.dialogGroup(); });
	$("#"+this.htmlid+ " #close").click( function(){ closeAllViews(); createMenu(); });

	$("#"+this.htmlid+ " #preset_default").click( function(){ manager.loadPreset("default"); });
	$("#"+this.htmlid+ " #preset_binding_3").click( function(){ manager.loadPreset("binding_3"); });
	$("#"+this.htmlid+ " #preset_binding_4").click( function(){ manager.loadPreset("binding_4"); });
	$("#"+this.htmlid+ " #preset_binding_6").click( function(){ manager.loadPreset("binding_6"); });
	$("#"+this.htmlid+ " #preset_expmat").click( function(){ manager.loadPreset("expmat"); });
	$("#"+this.htmlid+ " #preset_network").click( function(){ manager.loadPreset("network"); });

	$("#"+this.htmlid+ " #help").click( function(){ window.open('help.html'); } );
};

LayoutMenu.prototype.toggleSilent = function(){
	user.silent = !user.silent;
	//$("#"+this.htmlid+" #silent").attr("checked", user.silent);
};

LayoutMenu.prototype.toggleHint = function(){
	user.hint = !user.hint;
	//$("#"+this.htmlid+" #hint").attr("checked", user.hint);
	if(!user.hint) $( document ).tooltip("disable");
	else $(document).tooltip("enable");
};

LayoutMenu.prototype.resizeLayout = function(newsize){
	//$("#"+this.htmlid+" .ui-accordion-content").css("width", newsize[0]);
	this.removeLayout();
	this.renderUI();
};

LayoutMenu.prototype.removeLayout = function(){
	$("#"+this.htmlid+" div[name='ui']").remove();
};

LayoutMenu.prototype.setCompact = function(compact){
	this.compactLayout = compact;
	this.removeLayout();

	if(this.compactLayout==false){
		this.renderUI();
	}
};