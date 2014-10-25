
// Graph Controller

"use strict";

var extObject = {
  render: function(layout) {
    layoutManager.controlNode.append("<div name='ui'><div>" +
    "<span style='margin-left: 5px; font-weight:900'>NETWORK</span>" +
    "<select id='netname' title='Choose the network data'>" +
      "<option value='th17'>TH17</option>" +
      "<option value='confidence'>Confidence</option>" +
      "<option value='prediction'>Prediction</option>" +
      "<option value='strength'>Strength</option>" +
      "</select>" +
      "<span style='margin-left: 5px; font-weight:900'>GENE</span>" +
    "<input type='text' id='gene' size='10' title='Add/remove/select genes in the network. " +
    " Usage: [add/rm/sel] regexp | regexp. If no action is specified, default behavior is sel.'>" +
    "<span style='margin-left: 5px;'>COMBREG</span>" +
    "<input type='text' id='comb' size='10' title='Add nodes into the graph that are regulated by selected genes. Usage: regexp'>" +
    "</div>" +
    "<input type='checkbox' id='label' title='Show/hide node labels'> Label " +
    "<input type='checkbox' id='tf2tf' title='Show/hide edges between 2 TFs'> TF-TF " +
    "<input type='checkbox' id='tf2ntf' title='Show/hide edges bettwen a TF and a non-TF'> TF-nonTF " +
    "<input type='checkbox' id='force' title='Turn on/off force of the graph layout'> Force " +
    "<input type='checkbox' id='edgelist' title='Auto pop incident edge list when a node is clicked'> EdgeList " +
    "</div>");

    $("#"+this.htmlid+" #netname option[value='"+this.parentView.loader.lastIdentifier.net+"']")
      .attr("selected", true);
    $("#"+this.htmlid+" #netname").change( function(){
      var net = $(this).select("option:selected").val();
      console.log(net);
      if(net!=layout.parentView.loader.lastIdentifier.net)
        layout.parentView.loader.loadData({"net": net, "exp": "a^"});
    });
    $("#"+this.htmlid+" #gene").keydown( function(e){ if(e.which==13) return layout.uiUpdate("gene"); } );
    $("#"+this.htmlid+" #comb").keydown( function(e){ if(e.which==13) return layout.uiUpdate("comb"); } );
    $("#"+this.htmlid+" #label").attr("checked", this.showLabel)
      .change(function(){ return layout.toggleLabel(); });
    $("#"+this.htmlid+" #tf2tf").attr("checked", this.showTF2TFEdge)
      .change(function(){ return layout.toggleTF2TFEdge(); });
    $("#"+this.htmlid+" #tf2ntf").attr("checked", this.showTF2nTFEdge)
      .change(function(){ return layout.toggleTF2nTFEdge(); });
    $("#"+this.htmlid+" #force").attr("checked", this.forcing)
      .change(function(){ return layout.toggleForce(); });
    $("#"+this.htmlid+" #edgelist").attr("checked", this.edgeListing)
      .change(function(){ return layout.toggleEdgeListing(); });
    this.uiHeight = $("#"+this.htmlid+" div[name='ui']").height();
  }
};

var GraphController = Controller.extend(extObject);

