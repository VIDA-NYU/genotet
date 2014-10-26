
// Network Renderer

"use strict";

var extObject = {
  initialize: function(htmlid, width, height) {
    this.htmlid = htmlid;
    this.width = $("#" + this.htmlid).width();
    this.height = $("#" + this.htmlid).height();

    this.rawheight = this.height;
    this.uiHeight = 26;

    console.log(this.width, this.height);

    this.compactLayout = false;

    this.showTF2TFEdge = true;
    this.showTF2nTFEdge = true;
    this.showLabel = true;
    this.edgeListing = true;

    this.filterEdgeMin = -2.0;
    this.filterEdgeMax = 2.0;
    this.weightIndex = 0;
    this.labelGap = 10.0;

    this.trans = [0, 0];
    this.scale = 1.0;
    this.dragging = false;
    this.zooming = false;

    this.blockclick = false;

    this.highlightedElement = {};
    this.selectedElement = {};

    this.zoom = d3.behavior.zoom();

    //this.svg = d3.select("#"+this.htmlid).append("svg").attr("height", this.rawheight);
  },
  reloadData: function(removeOnly){
    this.data = this.parentView.viewdata;
    this.removeLayout();
    this.initLayout(removeOnly);
  },
  initLayout: function(removeOnly){
    var layout = this;

    // render ui to obtain ui height
    //if(this.compactLayout==false) this.renderUI();
    this.graphHeight = this.rawheight - (this.compactLayout?0:this.uiHeight);
    //console.log(this.uiHeight);

    //console.log(this.data, this.data.wmax, this.data.wmin);
      var rt = [];
      for(var i=0; i<=2; i++) rt.push(this.data.wmin+(this.data.wmax-this.data.wmin)*i/2);
    this.colorEdge = d3.scale.linear()
          .domain(rt)
          .range(["#ab1e1e", "gray", "#1e6eab"]); //"#d15454", "gray", "#6bafe0",

    this.nodes = this.data.nodes;
    this.links = this.data.links;
    // replace node id by reference
    for(var i=0; i<this.nodes.length; i++){
      if(this.nodes[i].x==null) this.nodes[i].x = Math.floor(Math.random()*this.width);
      if(this.nodes[i].y==null) this.nodes[i].y = Math.floor(Math.random()*this.graphHeight);
    }
    for(var i=0; i<this.links.length; i++){
      this.links[i].source = this.nodes[this.links[i].source];
      this.links[i].target = this.nodes[this.links[i].target];
    }

    this.force = d3.layout.force()
      .charge(-20000)
      .gravity(1.0)
      .linkDistance(20)
      .friction(0.6)
      .size([this.width, this.graphHeight])
      .on("tick", function(){ layout.updateLayout(); } )
      .on("end", function(){ layout.endForce(); } );
    this.forcing = true;
    $("#"+this.htmlid+" #force").attr("checked", true);

      //var color = d3.scale.category20();
    // compute an initial layout
    this.renderLayout();
    this.computeForce();
    if(removeOnly==true)  this.force.stop();
  },
  computeForce: function(){
    this.force.nodes(this.nodes).links(this.links).size([this.width, this.graphHeight]);
    this.force.start(); // even if force is not needed, you need to start force because it replaces node index of links by node references
    //for(var i=0; i<300; i++) this.force.tick();
    //this.force.stop();
  },
  renderLayout: function(){
    this.renderGraph();
  },
  removeLayout: function(){
     $("#"+this.htmlid+" div[name='ui']").remove();
     $("#"+this.htmlid+" #layoutwrapper").remove();
     $("#"+this.htmlid+" #hint").remove();
     $("#"+this.htmlid+" svg").remove();
  },
  uiUpdate: function(type){
    var loader = this.parentView.loader;
      if(type=="gene"){
          var srch = $("#"+this.htmlid+" #gene").val();
          var cmd = srch.split(" ");
          if(cmd.length==1 || (cmd.length==2 && cmd[0]=="sel")){
        var exp = cmd.length==1?cmd[0]:cmd[1];
        this.showMsg("Loading...");
        loader.loadNetwork(loader.lastIdentifier.net, exp);
          }else if(cmd.length==2 && (cmd[0]=="add" || cmd[0]=="rm")){
        if(cmd[0]=="add"){
          loader.addNodes(cmd[1]);
              }else if(cmd[0]=="rm"){
          loader.removeNodes(cmd[1]);
              }
          }else{
              user.alert("invalid syntax, usage: add/rm/sel regexp | regexp");
              return;
          }
      }else if (type=="comb") {
      var exp = $("#"+this.htmlid+" #comb").val();
      if (exp=="") return;
      loader.loadComb(loader.lastIdentifier.net, exp);
    }
  },
  renderGraph: function(){
    var nodes = this.nodes,
    links = this.links;

    //var embWidth = manager.embedSize(this.width),
     //   embHeight = manager.embedSize(this.graphHeight);

    var embWidth = "100%", embHeight = "100%";

      var layout = this;
    // make svg
    $("#"+this.htmlid).append("<div id='layoutwrapper'></div>");
    $("#"+this.htmlid+" #layoutwrapper")
      .addClass("renderdiv")
      .css("width", embWidth)
      .css("height", embHeight);

      this.svg = d3.select("#"+this.htmlid+" #layoutwrapper").append("svg");
      this.svg
        .style("width", embWidth)
        .style("height", embHeight);


      var background = this.svg.selectAll("#background").data([{'zone':"background"}]).enter().append("rect")
      .attr("class", "iobj")
      .attr("id", "background")
      .attr("x", 0)
      .attr("y", 0)
      //.attr("width", layout.width)
      //.attr("height", layout.graphHeight)
      .call(this.zoom
        .on("zoomstart", function(d) { return layout.graphZoomstart(d); })
        .on("zoom", function(d){ return layout.graphZoom(d); })
        .on("zoomend", function(d){ return layout.graphZoomend(d); })
      );

      // draw links (before nodes)
      var link = this.svg.selectAll(".link").data(links).enter().append("line")
          .attr("class", "link")
      .attr("id", function(d) { return "e"+d.id; } )
      .attr("visibility", function(d) { return layout.checkVisible(d); })
          .style("stroke", function(d) { return layout.colorEdge(d.weight[layout.weightIndex]); } )
      .attr("x1", function(d) { return layout.edgeCoordinate(d, "x1") * layout.scale + layout.trans[0]; })
          .attr("y1", function(d) { return layout.edgeCoordinate(d, "y1") * layout.scale + layout.trans[1]; })
          .attr("x2", function(d) { return layout.edgeCoordinate(d, "x2") * layout.scale + layout.trans[0]; })
          .attr("y2", function(d) { return layout.edgeCoordinate(d, "y2") * layout.scale + layout.trans[1]; });
      var linkdir = this.svg.selectAll(".linkdir").data(links).enter().append("polygon")
          .attr("class", "linkdir")
      .attr("id", function(d) { return "ed"+d.id; })
      .attr("visibility", function(d) { return layout.checkVisible(d); })
          .style("stroke", function(d) { return layout.colorEdge(d.weight[layout.weightIndex]); })
      .attr("points", function(d) { return layout.edgeArrow(d); });

    // highlight and select links
    var link_highlight = this.svg.selectAll("#link_highlight").data([{}]).enter().append("line")
        .attr("id", "link_highlight")
        .attr("class", "link_highlight")
        .attr("visibility", "hidden");
    var linkdir_highlight = this.svg.selectAll("#linkdir_highlight").data([{}]).enter().append("polygon")
        .attr("id", "linkdir_highlight")
        .attr("class", "linkdir_highlight")
        .attr("visibility", "hidden");
    var link_select = this.svg.selectAll("#link_select").data([{}]).enter().append("line")
        .attr("id", "link_select")
        .attr("class", "link_select")
        .attr("visibility", "hidden");
    var linkdir_select = this.svg.selectAll("#linkdir_select").data([{}]).enter().append("polygon")
        .attr("id", "linkdir_select")
        .attr("class", "linkdir_select")
        .attr("visibility", "hidden");

    // draw nodes
    var node = this.svg.selectAll(".node").data(nodes).enter().append("circle")
          .attr("class", "node")
      .attr("id", function(d) {return "v"+d.id; })
          .attr("r", function(d) { return d.focus?6:5; })
          .style("fill", function(d) { return d.selected?"orange":(d.isTF?"white":"#C0C0C0"); })
      .attr("cx", function(d) { return d.x * layout.scale + layout.trans[0]; })
          .attr("cy", function(d) { return d.y * layout.scale + layout.trans[1]; });

    // highlight and select nodes
    var node_highlight = this.svg.selectAll("#node_highlight").data([{}]).enter().append("circle")
        .attr("id", "node_highlight")
        .attr("class", "node_highlight")
        .attr("visibility", "hidden");
    var node_select = this.svg.selectAll("#node_select").data([{}]).enter().append("circle")
        .attr("id", "node_select")
        .attr("class", "node_select")
        .attr("visibility", "hidden");

    // label shall be between rendered objects and iobjs
    var label = this.svg.selectAll(".label").data(nodes) .enter().append("text")
      .text( function(d) { return d.name; })
      .attr("class", "label")
      .attr("id", function(d) { return "lbl_v"+d.id; } )
      .attr("font-size", function(d){ return d.focus?"15px":"10px"; } )
      .attr("fill", function(d){ return d.focus?"#ec2828":"black"; } )
      .attr("x", function(d) { return layout.nodes[d.index].x * layout.scale + layout.trans[0]; })
      .attr("y", function(d) { return layout.nodes[d.index].y * layout.scale -layout.labelGap + layout.trans[1]; })
      .attr("visibility", function(d){ return layout.showLabel?"visible":"hidden"; });

    // interactive objects
    var linkiobj = this.svg.selectAll(".linkiobj").data(links).enter().append("line")
          .attr("class", "linkiobj")
      .attr("id", function(d) { return "iobj_e"+d.id; } )
      .attr("visibility", function(d) { return layout.checkVisible(d); })
      .attr("x1", function(d) { return layout.edgeCoordinate(d, "x1") * layout.scale + layout.trans[0]; })
          .attr("y1", function(d) { return layout.edgeCoordinate(d, "y1") * layout.scale + layout.trans[1]; })
          .attr("x2", function(d) { return layout.edgeCoordinate(d, "x2") * layout.scale + layout.trans[0]; })
          .attr("y2", function(d) { return layout.edgeCoordinate(d, "y2") * layout.scale + layout.trans[1]; })
      .on("click", function(d) { return layout.selectLink(d); })
      .on("mousedown", function(d) { return layout.mouseDownLink(d); })
      .on("mouseenter", function(d) { return layout.highlightLink(d); })
      .on("mouseleave", function(d) { return layout.unhighlightLink(d); })
      .call(this.zoom
        .on("zoomstart", function(d) { return layout.graphZoomstart(d); })
        .on("zoom", function(d){ return layout.graphZoom(d); })
        .on("zoomend", function(d){ return layout.graphZoomend(d); })
      );
      var nodeiobj = this.svg.selectAll(".nodeiobj").data(nodes).enter().append("circle")
          .attr("class", "nodeiobj")
      .attr("id", function(d) { return "iobj_v"+d.id; } )
      .attr("r", 10.0)
      .attr("cx", function(d) { return d.x * layout.scale + layout.trans[0]; })
          .attr("cy", function(d) { return d.y * layout.scale + layout.trans[1]; })
      //.on("click", function(d) { return layout.selectNode(d); })
      .on("mousedown", function(d) { return layout.mouseDownNode(d); })
      .on("mouseenter", function(d) { return layout.highlightNode(d); })
      .on("mouseleave", function(d) { return layout.unhighlightNode(d); })
      .call(d3.behavior.drag()
        .origin( function(d) { return {'x':d.x*layout.scale+layout.trans[0], 'y':d.y*layout.scale+layout.trans[1]}; } )
        .on("dragstart", function(d) { return layout.nodeDragStart(d); } )
        .on("drag", function(d) { return layout.nodeDrag(d); } )
        .on("dragend", function(d) { return layout.nodeDragEnd(d); })
        )
      .call(this.zoom
        .on("zoomstart", function(d) { return layout.graphZoomstart(d); })
        .on("zoom", function(d){ return layout.graphZoom(d); })
        .on("zoomend", function(d){ return layout.graphZoomend(d); })
      );

      node.append("title")
          .text(function(d) { return d.name; });

    // edge node hint
    var info = this.svg.selectAll("#graphinfo").data([{}]).enter().append("text")
      .attr("id", "graphinfo")
      .attr("class", "graphinfo")
      .attr("x", 5)
      .attr("y", this.graphHeight - 10)
      .text("");
  },
  updateLayout: function(){

    // similar with renderLayout, except no clearing svg and no function attr
    /*
    var embWidth = manager.embedSize(this.width),
        embHeight = manager.embedSize(this.graphHeight);
    this.svg
      .style("width", embWidth)
      .style("height", embHeight);
      */

    var nodes = this.nodes,
      links = this.links,
      layout = this;

    var link = this.svg.selectAll(".link").data(links)
      .style("stroke", function(d) { return layout.colorEdge(d.weight[layout.weightIndex]); } )
      .attr("x1", function(d) { return layout.edgeCoordinate(d, "x1") * layout.scale + layout.trans[0]; })
      .attr("y1", function(d) { return layout.edgeCoordinate(d, "y1") * layout.scale + layout.trans[1]; })
      .attr("x2", function(d) { return layout.edgeCoordinate(d, "x2") * layout.scale + layout.trans[0]; })
      .attr("y2", function(d) { return layout.edgeCoordinate(d, "y2") * layout.scale + layout.trans[1]; });

    var linkdir = this.svg.selectAll(".linkdir").data(links)
      .style("stroke", function(d) { return layout.colorEdge(d.weight[layout.weightIndex]); })
      .attr("points", function(d) { return layout.edgeArrow(d); });

    var linkiobj = this.svg.selectAll(".linkiobj").data(links)
      .attr("x1", function(d) { return layout.edgeCoordinate(d, "x1") * layout.scale + layout.trans[0]; })
      .attr("y1", function(d) { return layout.edgeCoordinate(d, "y1") * layout.scale + layout.trans[1]; })
      .attr("x2", function(d) { return layout.edgeCoordinate(d, "x2") * layout.scale + layout.trans[0]; })
      .attr("y2", function(d) { return layout.edgeCoordinate(d, "y2") * layout.scale + layout.trans[1]; });


    var node = this.svg.selectAll(".node").data(nodes)
      .attr("r", function(d) { return d.focus?6:5; })
        //.style("fill", function(d) { return d.selected?"orange":(d.focus?"red":"white"); })
      .attr("cx", function(d) { return d.x * layout.scale + layout.trans[0]; })
      .attr("cy", function(d) { return d.y * layout.scale + layout.trans[1]; });

    var nodeiobj = this.svg.selectAll(".nodeiobj").data(nodes)
      .attr("r", 10.0)
      .attr("cx", function(d) { return d.x * layout.scale + layout.trans[0]; })
      .attr("cy", function(d) { return d.y * layout.scale + layout.trans[1]; });

    var label = this.svg.selectAll(".label").data(nodes)
      .attr("x", function(d) { return layout.nodes[d.index].x * layout.scale + layout.trans[0]; })
      .attr("y", function(d) { return layout.nodes[d.index].y * layout.scale -layout.labelGap + layout.trans[1]; });


    if(this.selectedElement.content!=null){
      if(this.selectedElement.type=="node"){
        var node_ = this.svg.selectAll("#node_select").data([this.selectedElement.content])
          .attr("cx", function(d) { return d.x * layout.scale + layout.trans[0]; })
          .attr("cy", function(d) { return d.y * layout.scale + layout.trans[1]; });
      }else if(this.selectedElement.type=="link"){
        var link_ = this.svg.selectAll("#link_select").data([this.selectedElement.content])
          .attr("x1", function(d) { return layout.edgeCoordinate(d, "x1") * layout.scale + layout.trans[0]; })
          .attr("y1", function(d) { return layout.edgeCoordinate(d, "y1") * layout.scale + layout.trans[1]; })
          .attr("x2", function(d) { return layout.edgeCoordinate(d, "x2") * layout.scale + layout.trans[0]; })
          .attr("y2", function(d) { return layout.edgeCoordinate(d, "y2") * layout.scale + layout.trans[1]; });
        var linkdir_ = this.svg.selectAll("#linkdir_select").data([this.selectedElement.content])
          .attr("points", function(d) { return layout.edgeArrow(d); });
      }
    }
    if(this.highlightedElement.content!=null){
      if(this.highlightedElement.type=="node"){
        var node_ = this.svg.selectAll("#node_highlight").data([this.highlightedElement.content])
          .attr("cx", function(d) { return d.x * layout.scale + layout.trans[0]; })
          .attr("cy", function(d) { return d.y * layout.scale + layout.trans[1]; });
      }else if(this.highlightedElement.type=="link"){
        var link_ = this.svg.selectAll("#link_highlight").data([this.highlightedElement.content])
          .attr("x1", function(d) { return layout.edgeCoordinate(d, "x1") * layout.scale + layout.trans[0]; })
          .attr("y1", function(d) { return layout.edgeCoordinate(d, "y1") * layout.scale + layout.trans[1]; })
          .attr("x2", function(d) { return layout.edgeCoordinate(d, "x2") * layout.scale + layout.trans[0]; })
          .attr("y2", function(d) { return layout.edgeCoordinate(d, "y2") * layout.scale + layout.trans[1]; });
        var linkdir_ = this.svg.selectAll("#linkdir_highlight").data([this.highlightedElement.content])
          .attr("points", function(d) { return layout.edgeArrow(d); });
      }
    }
  },
  visualizeElement: function(element, type){
    var elementProcessed;
    if(type=="highlight"){
      elementProcessed = this.highlightedElement;
    }else if(type=="select"){
      elementProcessed = this.selectedElement;
    }

    if(elementProcessed.content!=null){
      // clear selected
      if(elementProcessed.type=="node"){
        this.svg.selectAll("#node_"+type)
          .attr("visibility", "hidden");
      }else if(elementProcessed.type=="link"){
        this.svg.selectAll("#link_"+type)
          .attr("visibility", "hidden");
        this.svg.selectAll("#linkdir_"+type)
          .attr("visibility", "hidden");
      }
    }

    if(element==null){
      elementProcessed = {};
      return;
    }else{
      elementProcessed.content = element.content;
      elementProcessed.type = element.type;
    }
    var d = element.content;
    var layout = this;

    if(elementProcessed.type == "node"){
      var node_ = this.svg.selectAll("#node_"+type).data([d])
        .attr("cx", function(d) { return d.x * layout.scale + layout.trans[0]; })
        .attr("cy", function(d) { return d.y * layout.scale + layout.trans[1]; })
        .attr("r", function(d) { return d.focus?6:5; })
        .attr("visibility", "visible");
    }else if(elementProcessed.type == "link"){
      var link_ = this.svg.selectAll("#link_"+type).data([d])
        .attr("x1", function(d) { return layout.edgeCoordinate(d, "x1") * layout.scale + layout.trans[0]; })
        .attr("y1", function(d) { return layout.edgeCoordinate(d, "y1") * layout.scale + layout.trans[1]; })
        .attr("x2", function(d) { return layout.edgeCoordinate(d, "x2") * layout.scale + layout.trans[0]; })
        .attr("y2", function(d) { return layout.edgeCoordinate(d, "y2") * layout.scale + layout.trans[1]; })
        .attr("visibility", "visible");
      var linkdir_ = this.svg.selectAll("#linkdir_"+type).data([d])
        .attr("points", function(d) { return layout.edgeArrow(d); })
        .attr("visibility", "visible");
    }

    // send selection to children view
    var msg = {'action': type, 'type': elementProcessed.type};
    if(elementProcessed.type == "node"){
      msg.para = [d.name, this.parentView.loader.lastIdentifier.net];
      if(type=="select" && this.edgeListing) this.parentView.loader.showEdges(this.parentView.loader.lastIdentifier.net, d.name);
    }else if(elementProcessed.type == "link"){
      msg.para = [d.source.name, d.target.name];
    }
    this.parentView.postViewMessage(msg);
  },
  edgeCoordinate: function(d, which){
    var layout = this;
    if(this.data.bidir[d.source.index+"*"+d.target.index] == true && this.data.bidir[d.target.index+"*"+d.source.index] == true){ // bidirectional edges
      var dy = d.target.y-d.source.y, dx = d.target.x-d.source.x;
      var dl = Math.sqrt(dx*dx+dy*dy), th = -Math.acos(0.0);
      dx /= dl; dy /= dl;
      var ddx = Math.cos(th)*dx - Math.sin(th)*dy,
        ddy = Math.sin(th)*dx + Math.cos(th)*dy;
      switch(which){
        case "x1": return d.source.x + ddx * 2 /layout.scale;
        case "y1": return d.source.y + ddy * 2 /layout.scale;
        case "x2": return d.target.x + ddx * 2 /layout.scale;
        case "y2": return d.target.y + ddy * 2 /layout.scale;
        default: console.error("edgeCoordinate: unidentified which bidir", which);
      }
    }else{
      switch(which){
        case "x1": return d.source.x;
        case "y1": return d.source.y;
        case "x2": return d.target.x;
        case "y2": return d.target.y;
        default: console.error("edgeCoordinate: unidentified which", which);
      }
    }
  },
  edgeArrow: function(d){
    var layout = this;
    var g=5.0, h=g+10.0, w=5.0;
    var dy = d.target.y-d.source.y, dx = d.target.x-d.source.x;
    var theta = Math.atan2(dy, dx),
    theta2 = Math.atan2(-dx, dy);
    var sint = Math.sin(theta), cost = Math.cos(theta),
    sint2 = Math.sin(theta2), cost2 = Math.cos(theta2);
    var x2 = this.edgeCoordinate(d, "x2"), y2 = this.edgeCoordinate(d, "y2");
    var arrowx = x2 * layout.scale - cost*h + layout.trans[0],
    arrowy = y2 * layout.scale - sint*h + layout.trans[1];
    return ""+(x2 * layout.scale - g*cost + layout.trans[0])+","+(y2 * layout.scale - g*sint + layout.trans[1])+" "
          +(arrowx+w*cost2)+","+(arrowy+w*sint2)+" "
          +(arrowx-w*cost2)+","+(arrowy-w*sint2);
  },
  graphZoomstart: function(d){
    if(this.dragging) return;
    //if(d.zone == "foreground") this.zoom.center([this.width/2, this.height/2]);
    //else if(d.zone == "background") this.zoom.center(null);
    this.zooming = true;
    this.svg.selectAll(".node_highlight").attr("visibility", "hidden");
    this.svg.selectAll(".link_highlight").attr("visibility", "hidden");
    this.svg.selectAll(".linkdir_highlight").attr("visibility", "hidden");
  },
  graphZoom: function(d){
    if(this.dragging) return;
    //if(manager.ctrlDown) return;
    var trans = d3.event.translate;
    var scale = d3.event.scale;
    this.trans = [trans[0], trans[1]];
    this.scale = scale;
    this.updateLayout();
  },
  graphZoomend: function(d){
    if(this.dragging) return;
    this.zooming = false;
  },
  nodeDragStart: function(d){
    //if(manager.ctrlDown) return;
    this.dragstartX = d3.event.sourceEvent.offsetX;
    this.dragstartY = d3.event.sourceEvent.offsetY;

    this.oldtrans = this.trans;
    //this.unhighlightNode(d);
    this.dragging = true;
  },
  nodeDrag: function(d){
    var layout = this;

    d.x = (d3.event.x - this.trans[0]) / this.scale;
    d.y = (d3.event.y - this.trans[1]) / this.scale;

    var x = d.x,
      y = d.y,
      nx = x * layout.scale + layout.trans[0],
      ny = y * layout.scale + layout.trans[1];


    for(var i=0; i<this.links.length; i++){
      if(this.links[i].source.id == d.id){
        this.links[i].source.x = x;
        this.links[i].source.y = y;

        this.svg.select("#e"+this.links[i].id)
          .attr("x1", layout.edgeCoordinate(this.links[i], "x1") * layout.scale + layout.trans[0])
          .attr("y1", layout.edgeCoordinate(this.links[i], "y1") * layout.scale + layout.trans[1])
          .attr("x2", layout.edgeCoordinate(this.links[i], "x2") * layout.scale + layout.trans[0])
          .attr("y2", layout.edgeCoordinate(this.links[i], "y2") * layout.scale + layout.trans[1]);
        this.svg.select("#iobj_e"+this.links[i].id)
          .attr("x1", layout.edgeCoordinate(this.links[i], "x1") * layout.scale + layout.trans[0])
          .attr("y1", layout.edgeCoordinate(this.links[i], "y1") * layout.scale + layout.trans[1])
          .attr("x2", layout.edgeCoordinate(this.links[i], "x2") * layout.scale + layout.trans[0])
          .attr("y2", layout.edgeCoordinate(this.links[i], "y2") * layout.scale + layout.trans[1]);
        this.svg.select("#ed"+this.links[i].id).attr("points", function(d) { return layout.edgeArrow(d); });
      }else if(this.links[i].target.id == d.id){
        this.links[i].target.x = x;
        this.links[i].target.y = y;

        this.svg.select("#e"+this.links[i].id)
          .attr("x1", layout.edgeCoordinate(this.links[i], "x1") * layout.scale + layout.trans[0])
          .attr("y1", layout.edgeCoordinate(this.links[i], "y1") * layout.scale + layout.trans[1])
          .attr("x2", layout.edgeCoordinate(this.links[i], "x2") * layout.scale + layout.trans[0])
          .attr("y2", layout.edgeCoordinate(this.links[i], "y2") * layout.scale + layout.trans[1]);
        this.svg.select("#iobj_e"+this.links[i].id)
          .attr("x1", layout.edgeCoordinate(this.links[i], "x1") * layout.scale + layout.trans[0])
          .attr("y1", layout.edgeCoordinate(this.links[i], "y1") * layout.scale + layout.trans[1])
          .attr("x2", layout.edgeCoordinate(this.links[i], "x2") * layout.scale + layout.trans[0])
          .attr("y2", layout.edgeCoordinate(this.links[i], "y2") * layout.scale + layout.trans[1]);
        this.svg.select("#ed"+this.links[i].id).attr("points", function(d) { return layout.edgeArrow(d); });
      }
    }

    // update node(iobj) and label
    this.svg.select("#v"+d.id).attr("cx", nx).attr("cy", ny);
    this.svg.select("#iobj_v"+d.id).attr("cx", nx).attr("cy", ny);
    this.svg.select("#lbl_v"+d.id).attr("x", nx).attr("y", ny-layout.labelGap);

    // update highlighted node
    this.svg.select("#node_highlight").attr("cx", nx).attr("cy", ny);

    if(this.selectedElement.content!=null){
      var sd = this.selectedElement.content;
      if(this.selectedElement.type=="node" && d.id==sd.id){
        this.svg.select("#node_select").attr("cx", nx).attr("cy", ny);
      }else if(this.selectedElement.type=="link"){
        if(d.id == sd.source.id){
          this.svg.select("#link_select").attr("x1", nx).attr("y1", ny);
          this.svg.select("#linkdir_select").attr("points", function(d) { return layout.edgeArrow(d); });
        }else if(d.id == sd.target.id){
          this.svg.select("#link_select").attr("x2", nx).attr("y2", ny);
          this.svg.select("#linkdir_select").attr("points", function(d) { return layout.edgeArrow(d); });
        }
      }
    }
  },
  nodeDragEnd: function(d){
    this.dragendX = d3.event.sourceEvent.offsetX;
    this.dragendY = d3.event.sourceEvent.offsetY;

    var dx = this.dragendX - this.dragstartX,
      dy = this.dragendY - this.dragstartY;
    var move = Math.sqrt(dx*dx+dy*dy);

    this.zoom.translate(this.oldtrans); // cancel the translation from the drag

    this.dragging = false;
    if(move <= 5.0){
      // no move, treated as click
      this.visualizeElement({'content':d, 'type':"node"}, "select");
    }else{
      this.blockclick = true;
    }
  },
  mouseDownNode: function(d){
    if(d3.event.button == 2) // right click
    {
      delete this.data.visibleNodes[d.id];  // hide the node
      for(var i=0; i<this.data.links.length; i++){
        if(this.data.links[i].source.id==d.id || this.data.links[i].target.id==d.id){ // hide incident edges
          delete this.data.visibleLinks[this.data.links[i].id];
        }
      }
      if(getView(this.parentView.viewname+"-list")!=null) closeView(this.parentView.viewname+"-list");
      this.parentView.loader.reparseData(true); // remove only
    }
  },
  mouseDownLink: function(d){
    if(d3.event.button == 2) // right click
    {
      delete this.data.visibleLinks[d.id];  // hide the edge
      if(getView(this.parentView.viewname+"-list")!=null) closeView(this.parentView.viewname+"-list");
      this.parentView.loader.reparseData(true); // remove only
    }
  },
  highlightLink: function(d){
    if(this.dragging || this.zooming) return;

    this.visualizeElement({'content':d, 'type':"link"}, "highlight");

    var info = "source: " + d.source.name +
      "       target: " + d.target.name +
      "       weight: " + d.weight +
      "       id: " + d.id;
    this.svg.select("#graphinfo").text(info);
  },
  unhighlightLink: function(d){
    var layout = this;
    this.visualizeElement(null, "highlight");
  },
  highlightNode: function(d){
    if(this.dragging || this.zooming) return;

    this.visualizeElement({'content':d, 'type':"node"}, "highlight");
    this.svg.select("#lbl_v"+d.id).attr("visibility", "visible");
    var info = "name: " + d.name +
    "       isTF: " + d.isTF +
    "       id: " + d.id;
    this.svg.select("#graphinfo").text(info);
    //this.svg.select("#v"+d.id).attr("class", "node_hl");
  },
  unhighlightNode: function(d){
    if(this.dragging) return;
    this.visualizeElement(null, "highlight");
    this.svg.select("#lbl_v"+d.id).attr("visibility", this.showLabel?"visible":"hidden");
    //this.svg.select("#v"+d.id).attr("class", "node");
  },
  selectNode: function(d){
    if(this.dragging || this.zooming) return;
    if(this.blockclick){ this.blockclick = false; return; }

    this.visualizeElement({'content':d, 'type':"node"}, "select");
  },
  selectLink: function(d){
    if(this.dragging || this.zooming) return;
    if(this.blockclick){ this.blockclick = false; return; }

    this.visualizeElement({'content':d, 'type':"link"}, "select");
  },
  toggleLabel: function(){
      this.showLabel = !this.showLabel;
    var label = this.svg.selectAll(".label").data(this.nodes)
      .attr("visibility", this.showLabel?"visible":"hidden");
  },
  toggleTF2TFEdge: function(){
    var layout = this;
      this.showTF2TFEdge = !this.showTF2TFEdge;
    this.toggleEdge();
  },
  toggleTF2nTFEdge: function(){
      var layout = this;
      this.showTF2nTFEdge = !this.showTF2nTFEdge;
    this.toggleEdge();
  },
  toggleEdge: function(){
    var layout = this;
    d3.selectAll(".link").data(this.data.links)
      .attr("visibility", function(d){ return layout.checkVisible(d); });
    d3.selectAll(".linkiobj").data(this.data.links)
      .attr("visibility", function(d){ return layout.checkVisible(d); });
    d3.selectAll(".linkdir").data(this.data.links)
      .attr("visibility", function(d){ return layout.checkVisible(d); });
  },
  checkVisible: function(d){
    var layout = this;
    if(d.source.isTF && d.target.isTF) return layout.showTF2TFEdge?"visible":"hidden";
    else if(utils.xor(d.source.isTF, d.target.isTF)) return layout.showTF2nTFEdge?"visible":"hidden";
    else return "visible";
  },
  toggleEdgeListing: function(){
    this.edgeListing = !this.edgeListing;
    $("#"+this.htmlid+" #edgelist").attr("checked", this.edgeListing);
  },
  toggleForce: function(){
    if(this.forcing) this.force.stop();
    else this.force.resume();
    this.forcing = !this.forcing;
  },
  endForce: function(){
    this.forcing = false;
    $("#"+this.htmlid+" #force").attr("checked", false);
  },
  showMsg: function(msg, ui){
    this.removeLayout();
    if (ui==null) ui = false;
    $("#"+this.htmlid).append("<div id='hint' class='hint'></div>");
    $("#"+this.htmlid+" #hint").text(msg).css({"width": this.width, "height":this.rawheight-(ui && !this.compactLayou?this.uiHeight:0) });
  },
  showError: function(){
    this.showMsg("Oops..this guy is dead. x_X", false);
    //this.renderUI();
  },
  updateGraphSize: function(newsize){
    var oldwidth = this.width, oldheight = this.graphHeight;
    this.graphHeight = newsize[1] - (this.compactLayout?0:this.uiHeight);
    var xratio = newsize[0] / oldwidth, yratio = this.graphHeight / oldheight;
    var dx = (newsize[0] - oldwidth)/2, dy = (this.graphHeight - oldheight)/2;
    if (xratio >= 1.0 && yratio >= 1.0) {
      var ratio = Math.max(xratio, yratio);
    }else if (xratio < 1.0 && yratio < 1.0) {
      var ratio = Math.min(xratio, yratio);
    }else{
      var ratio = 1.0;
    }
    for(var i=0; i<this.nodes.length; i++){
      this.nodes[i].x += dx;
      this.nodes[i].y += dy;
      //this.nodes[i].x += dx;
      //this.nodes[i].y += dy;
      }
    this.force.size([newsize[0], this.graphHeight]);
  },
  resizeLayout: function(newsize){
    if (this.parentView.showHeader==false) newsize[1] += manager.headerHeight;

    this.updateGraphSize(newsize);
    this.width = newsize[0];
      this.rawheight = newsize[1];
    this.removeLayout();
    //if(!this.compactLayout) this.renderUI();
    this.renderLayout();
  },
  setCompact: function(compact){
    this.compactLayout = compact;
    this.updateGraphSize([this.width, this.rawheight]);
    this.removeLayout();
    //if(!this.compactLayout) this.renderUI();
    this.renderLayout();
  }
};
var NetworkRenderer = GraphRenderer.extend(extObject);


