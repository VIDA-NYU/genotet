
// Dialog View

/*
 * Pop-up view that shows options for other views.
 * Copied from old Genotet. Need to rewrite.
 */

"use strict";

/************************ WARNING *************************
 *                    MESSY CODE ZONE!                    *
 **********************************************************/

function Dialog(){
}

Dialog.prototype.dialogLayout = function(type){
  switch(type){
  case "create_network":
    $("#dialog #datadiv").append("" +
      "Network" +
      "<select id='data'>" +
      "<option value='th17'>TH17</option>" +
      "<option value='confidence'>Confidence</option>" +
      "<option value='prediction'>Prediction</option>" +
      "<option value='strength'>Strength</option>" +
      "</select></div>" +
      "<div>Genes" +
      "<input type='text' size='20' id='exp' title='Regexp for genes to be shown in the network'>" +
      "</div>");
    break;
  case "create_binding":
    $("#dialog #datadiv").append("" +
      "View data <input id='data' size='8' title='Select binding data'>" +
      "Chr <select id='chr' title='Chromosome to be loaded'><select>" +
      "</div>");
    var chrs = viewManager.bindingChrs;
    for(var i=0;i<chrs.length;i++) $("#dialog #chr").append("<option value="+chrs[i]+">"+chrs[i]+"</option>");
    $("#dialog #data").autocomplete({
      source: viewManager.bindingNames,
      appendTo: "body"
    });
    break;
  case "create_expression":
    $("#dialog #datadiv").append("<div id='data'>" +
      "<div> Matrix" +
      "<select id='data'>" +
      "<option value='B-Subtilis'>B-Subtilis</option>" +
      "<option value='RNA-Seq'>RNA-Seq</option>" +
      "</select> </div>" +
      "<div>Profile <input id='plot' size='15' title='Name of gene to be plotted as polyline'></div>" +
      "<div>Genes <input id='gene' size='8' title='Regexp for genes to be shown in the heatmap'>" +
      "Conditions <input id='cond' size='8' title='Regexp for conditions to be shown in the heatmap'></div>" +
      "</div>");
    break;
  case "link_change":
    var names = viewManager.getViewNames();
    var name = $("#dialog #source").val();
    var children = viewManager.getViewChildren(name);
    $("#dialog").append("<div id='targetdiv'>Target view <select id='target' title='View as a listener'></select></div>");
    for(var i=0; i<names.length; i++){
      if(children.indexOf(names[i])!=-1 || names[i]==name) continue;
      $("#dialog #target").append("<option value='"+names[i]+"'>"+names[i]+"</option>");
    }
    break;
  case "unlink_change":
    var names = viewManager.getViewNames();
    var name = $("#dialog #source").val();
    var children = viewManager.getViewChildren(name);
    $("#dialog").append("<div id='targetdiv'>Target view <select id='target' title='View as a listener'></select></div>");
    for(var i=0; i<children.length; i++){
      $("#dialog #target").append("<option value='"+children[i]+"'>"+children[i]+"</option>");
    }
    break;
  case "group":
    var name = $("#dialog #source").val();
    var names = viewManager.getViewNames("togroup", name);
    $("#dialog").append("<div id='targetdiv'>Target view<select id='target' title='View that is in the group to be joined'></select></div>");
    for(var i=0; i<names.length; i++){
      $("#dialog #target").append("<option value='"+names[i]+"'>"+names[i]+"</option>");
    }
    break;
  default:
    options.alert("undefined behavior for dialog layout "+type);
  }

};

Dialog.prototype.dialogCreate = function(){
  var layout = this;
  $("#dialog").remove();
  $("body").append("<div id='dialog' title='Create View'>" +
  "<div>View name <input type='text' size='15' id='viewname'></div>" +
  "<div>View type <select id='type'>" +
  "<option value='network'>Network</option>" +
  "<option value='binding'>Genome Browser</option>" +
  "<option value='expression'>Expression</option>" +
  "<option value='graph'>Graph</option>" +
  "</select></div>" +
  "<div id='datadiv'></div>" +
  "</div>");
  $("#dialog #viewname").val("View" + viewManager.availViewID());
  $("#dialog").addClass("viewshadow");
  this.dialogLayout("create_network");

  $("#dialog #type").change(function(){
    var type = $("#dialog #type option:selected").val();
    $("#dialog #datadiv").remove();
    $("#dialog").append("<div id='datadiv'></div>");
    layout.dialogLayout("create_"+type);
  });
  $("#dialog").dialog({
    buttons: {
      "OK": function() {
        var name = $("#dialog #viewname").val();
        var type = $("#dialog #type option:selected").val();
        if(type==="network"){
          var data = $("#dialog #data").val();
          var exp = $("#dialog #datadiv #exp").val();
          if(exp=="") exp="a^";
          var view = createView(name, type, "user");
          if(view) view.load({
            url: httpAddr,
            args: "type=regnet&net=th17",
            selection: "BATF|RORC|MAF|IRF4|STAT3"
          });
        }else if(type==="binding"){
          var data = $("#dialog #data").val();
          /*
          if (viewManager.supportBinding(data)==false){
            options.alert("Please type in a supported binding track");
            return;
          }
          */
          var chr = $("#dialog #datadiv #chr").val();
          if(chr=="") chr = "1";
          var view = createView(name, type, "user");
          //if(view) view.loadData(data, chr);
        }else if(type==="expression"){
          var mat = $("#dialog #data option:selected").val();
          var plot = $("#dialog #datadiv #plot").val();
          var exprows = $("#dialog #datadiv #gene").val();
          var expcols = $("#dialog #datadiv #cond").val();
          if(exprows=="") exprows=".*";
          if(expcols=="") expcols=".*";
          var view = createView(name, type, "user");
          //if(view) view.loadData(mat, plot, exprows, expcols);
        }
        if(view) {
          $("#dialog").remove();
        }
      },
      "Cancel": function(){ $("#dialog").remove(); }
    }
  });
};

Dialog.prototype.dialogLink = function(src){
  var layout = this;
  $("#dialog").remove();
  $("body").append("<div id='dialog' title='Link Views'>" +
  "<div>Source view <select id='source' title='View to be listened to'></select></div>" +
  "</div>");
  var names = viewManager.getViewNames();
  for(var i=0; i<names.length; i++){
    $("#dialog #source").append("<option value='"+names[i]+"'>"+names[i]+"</option>");
  }
  if(src!=null) $("#dialog #source option[value='"+src+"']").attr("selected", true);

  this.dialogLayout("link_change");
  $("#dialog #source").change(function(){
    $("#dialog #targetdiv").remove();
    return layout.dialogLayout("link_change");
  });
  $("#dialog").dialog({
    buttons: {
    "OK": function(){
      var source = $("#dialog #source").val(),
        target = $("#dialog #target").val();
      if(target==null || target==""){
        console.error("Cannot link an empty view");
        options.alert("Cannot link an empty view");
        return;
      }
      var success =linkView(source, target);
      if(success) $("#dialog").remove();
    },
    "Cancel": function(){ $("#dialog").remove(); }
  }});
};

Dialog.prototype.dialogUnlink = function(src){
  var layout = this;
  $("#dialog").remove();
  $("body").append("<div id='dialog' title='Unlink Views'>" +
  "<div>Source view <select id='source' title='View to be listened to'></select></div>" +
  "</div>");
  var names = viewManager.getViewNames();
  for(var i=0; i<names.length; i++){
    $("#dialog #source").append("<option value='"+names[i]+"'>"+names[i]+"</option>");
  }
  if(src!=null) $("#dialog #source option[value='"+src+"']").attr("selected", true);
  this.dialogLayout("unlink_change");
  $("#dialog #source").change(function(){
    $("#dialog #targetdiv").remove();
    return layout.dialogLayout("unlink_change");
  });
  $("#dialog").dialog({
    buttons: {
    "OK": function(){
      var source = $("#dialog #source").val(),
        target = $("#dialog #target").val();
      if(target==null || target==""){
        console.error("Cannot unlink an empty view");
        options.alert("Cannot unlink an empty view");
        return;
      }
      var success = unlinkView(source, target);
      if(success) $("#dialog").remove();
    },
    "Cancel": function(){ $("#dialog").remove(); }
  }});
};

Dialog.prototype.dialogGroup = function(src){
  var layout = this;
  $("#dialog").remove();
  $("body").append("<div id='dialog' title='Group Views'>" +
  "<div>Source view <select id='source' title='View to join the group'></select></div>" +
  "</div>");
  var names = viewManager.getViewNames();
  for(var i=0; i<names.length; i++){
    $("#dialog #source").append("<option value='"+names[i]+"'>"+names[i]+"</option>");
  }
  if(src!=null) $("#dialog #source option[value='"+src+"']").attr("selected", true);
  this.dialogLayout("group");
  $("#dialog #source").change(function(){
    $("#dialog #targetdiv").remove();
    return layout.dialogLayout("group");
  });
  $("#dialog").dialog({
    buttons: {
    "OK": function(){
      var source = $("#dialog #source").val(),
        target = $("#dialog #target").val();
      if(target==null || target==""){
        console.error("Cannot group an empty view");
        options.alert("Cannot group an empty view");
        return;
      }
      var success = groupView(source, target);
      if(success) $("#dialog").remove();
    },
    "Cancel": function(){ $("#dialog").remove(); }
  }});
};

