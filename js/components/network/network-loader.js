"use strict";

var extObject = {
  initialize: function() {
    this.lastIdentifier = null;
  },
  load: function(onComplete, para) {
    //this.lastIdentifier = identifier;
    //console.log(identifier);
    //var selNodes = this.selectNodes(identifier.exp, identifier.range);
    //var data = this.makeData(selNodes);
    console.log("this called");
    //this.parentView.viewdata = {};
    //this.parentView.layout.showMsg("Loading...");
    this.loadNetwork(para.network, para.genesRegex);
    //this.parentView.viewdata = data;
    //this.parentView.layout.setData(data);
  },
  updateData: function(identifier){
    if(identifier.action=="show"){
      this.addEdges(identifier.data);
    }else if(identifier.action=="hide"){
      this.removeEdges(identifier.data);
    }
  },
  addNodes: function(nodes){  // nodes are regexp
    var data = this.parentView.viewdata;
    var exp = "a^";
    for(var i=0; i<data.nodes.length; i++){
      exp += "|^" + data.nodes[i].name + "$";
    }
      exp += "|" + nodes;
    this.loadNetwork(this.lastIdentifier.net, exp);
  },
  removeNodes: function(exp){
    var data = this.parentView.viewdata;
    for(var i=0; i<data.nodes.length; i++){
      if(data.nodes[i].name.match(exp)){
        delete data.visibleNodes[data.nodes[i].id];
      }
    }
    for(var i=0; i<data.links.length; i++){
      if(data.visibleNodes[data.links[i].source.id]==null || data.visibleNodes[data.links[i].target.id]==null){ // hide incident edges
        delete data.visibleLinks[data.links[i].id];
      }
    }
    this.reparseData(true);
  },
  addEdges: function(edges){
    var data = this.parentView.viewdata;
    var nodes = data.nodes, nodeids = {};
    var exp = "";
    for(var i=0; i<nodes.length; i++){
      nodeids[nodes[i].id] = true;
      exp += "^" + nodes[i].name + "$|";
    }
    for(var i=0; i<edges.length; i++){
      data.visibleLinks[edges[i].id] = true;
      if(nodeids[edges[i].sourceId]==null){
        nodeids[edges[i].sourceId] = true;
        data.visibleNodes[edges[i].sourceId] = true;
        exp += "^" + edges[i].source + "$|";
      }
      if(nodeids[edges[i].targetId]==null){
        nodeids[edges[i].targetId] = true;
        data.visibleNodes[edges[i].targetId] = true;
        exp += "^" + edges[i].target + "$|";
      }
    }
    exp += "[]";
    this.updateNetwork(exp);
  },
  removeEdges: function(edges){
    var data = this.parentView.viewdata;
    var links = data.links;
    for(var i=0; i<edges.length; i++){
      if(data.visibleLinks[edges[i].id]==true) delete data.visibleLinks[edges[i].id];
    }
    this.reparseData(true); // removal of edges
  },
  updateNetwork: function(exp){
    //console.log("update", exp);
    var loader = this;
    this.recordPos(loader.parentView.viewdata); // first record all the positions before load new data
    $.ajax({
        type: 'POST', url: addr, dataType: 'jsonp',
        data: {
        args: { "type": "net", "net": loader.lastIdentifier.net, "exp": exp},
        },
      error: function(xhr, status, err){ loader.error("cannot update network\n" + status + "\n" + err); },
        success: function(result){
        var data = JSON.parse(result, utils.parse);
        if(data==null || loader.parentView.viewdata==null){
          loader.error("cannot update network due to an internal error");
          return;
        }
        loader.parentView.viewdata.nodes = data.nodes;
        loader.parentView.viewdata.links = data.links;
        loader.filterData(loader.parentView.viewdata);
        loader.parentView.layout.reloadData();
        }
    });
  },
  loadNetwork: function(net, exp, notInit){
    var loader = this;
    $.ajax({
        type: 'GET', url: addr, dataType: 'jsonp',
        data: {
        args: 'type=net&net='+net+'&exp='+exp
        },
      error: function(xhr, status, err){ loader.error("cannot load network\n" + status + "\n" + err); },
        success: function(result){
        var data = JSON.parse(result, utils.parse);
        if(data==null){
          loader.error("selected network is empty, or network not found");
          return;
        }
        //if(loader.parentView.viewdata==null) loader.parentView.viewdata = {};
        loader.parentView.viewdata.nodes = data.nodes;
        loader.parentView.viewdata.links = data.links;
        loader.parentView.viewdata.wmin = data.wmax;
        loader.parentView.viewdata.wmax = data.wmin;
        if(notInit==null) loader.initData(loader.parentView.viewdata);
        else loader.filterData(loader.parentView.viewdata);
        loader.parentView.layout.reloadData();
        }
    });
  },
  initData: function(data){
    data.lastPos = {};
    this.parseBidir(data);
    data.visibleNodes = {};
    data.visibleLinks = {};
    for(var i=0; i<data.nodes.length; i++) data.visibleNodes[data.nodes[i].id] = true;
    for(var i=0; i<data.links.length; i++) data.visibleLinks[data.links[i].id] = true;  // initially every node & edge is visible
  },
  parseBidir: function(data){
    data.bidir = {};  // save bidirectonal edges
    for(var i=0; i<data.links.length; i++){
      data.bidir[data.links[i].source+"*"+data.links[i].target] = true;
    }
  },
  filterData: function(data){
    var remap = {}; // remapping index of node
    var fnodes = new Array(), flinks = new Array();
    var nodes = data.nodes, links = data.links, lastPos = data.lastPos, visibleNodes = data.visibleNodes, visibleLinks = data.visibleLinks;
    var j = 0;
    for(var i=0; i<nodes.length; i++){
      if(visibleNodes[nodes[i].id]==true){  // show only visible nodes
        fnodes.push({"id": nodes[i].id, "index": j, "name": nodes[i].name, "isTF": nodes[i].isTF});
        remap[nodes[i].id] = j++;
      }
    }
    j = 0;
    for(var i=0; i<links.length; i++){  // show only visible edges
      var sid = links[i].source.id, tid = links[i].target.id;
      if(sid==null) sid = nodes[links[i].source].id; //
      if(tid==null) tid = nodes[links[i].target].id; // from server, the source and target are index instead of id
      if(visibleLinks[links[i].id]==true && visibleNodes[sid]==true && visibleNodes[tid]==true){
        flinks.push({"id": links[i].id, "index": j++, "source": remap[sid], "target": remap[tid], "weight": links[i].weight});
      }
    }
    for(var i=0; i<fnodes.length; i++){ // reset position to memorized locations
      if(lastPos[fnodes[i].id]!=null){
        fnodes[i].x = lastPos[fnodes[i].id].x;
        fnodes[i].y = lastPos[fnodes[i].id].y;
      }
    }
    lastPos = {}; // clear after every usage
    data.links = flinks;
    data.nodes = fnodes;
    data.visibleNodes = visibleNodes;
    data.visibleLinks = visibleLinks;
    this.parseBidir(data);
  },
  recordPos: function(data){
    for(var i=0; i<data.nodes.length; i++){
      data.lastPos[data.nodes[i].id] = {"x": data.nodes[i].x, "y": data.nodes[i].y};
    }
  },
  reparseData: function(removeOnly){  // use for mouse click removal
    this.recordPos(this.parentView.viewdata);
    this.filterData(this.parentView.viewdata);
    this.parentView.layout.reloadData(removeOnly);
  },
  showEdges: function(net, name){
    var viewname = this.parentView.viewname + "-list";
    var view = getView(viewname), launch = true;
    if(view!=null) {
      if(view.viewdata.net==net && view.viewdata.name==name) launch = false; // toggle list
      closeView(viewname);
    }
    if(launch) this.loadEdges(net, name);
  },
  loadComb: function(net, exp){
      var loader = this;
    var oexp = exp;
    exp = utils.encodeSpecialChar(exp);
    $.ajax({
      type: 'GET', url: addr, dataType: 'jsonp',
      data: {
        args: 'type=comb&net='+net+'&exp='+exp
      },
      error: function(xhr, status, err){ loader.error("cannot load combinatorial regulated genes\n" + status + "\n" + err); },
      success: function(result){
        var data = JSON.parse(result, utils.parse);
          if (data.length == 0) {
          user.alert("There is no common targets.");
          return;
        }
        var addexp = "a^";
        for(var i=0; i<data.length; i++) addexp += "|^"+data[i]+"$";
        //console.log(oexp);
        addexp += "|"+oexp;
        loader.addNodes(addexp);
      }
    });
  },
  loadEdges: function(net, name){
    var loader = this;
    $.ajax({
      type: 'GET', url: addr, dataType: 'jsonp',
      data: {
        args: 'type=edges&net='+net+'&name='+name
      },
      error: function(xhr, status, err){ loader.error("cannot load edges\n" + status + "\n" + err); },
      success: function(result){
        var data = JSON.parse(result, utils.parse);

        var viewname = loader.parentView.viewname + "-list";
        var view = $("#view"+loader.parentView.viewid);
        //var left = parseInt(view.css("left"))+parseInt(view.css("width")),
        //  top = parseInt(view.css("top"));
        createView(viewname, "table");//null,loader.parentView.layout.rawheight, left, top

        linkView(loader.parentView.viewname, viewname);
        linkView(viewname, loader.parentView.viewname); // link back
        //groupView(viewname, loader.parentView.viewname);

        var wrapper = {};
        wrapper.net = net;
        wrapper.name = name;
        wrapper.columns = ["Source", "Target", "Weight", "Loaded"];
        wrapper.rows = data;
        var viewdata = loader.parentView.viewdata;
        for(var i=0; i<wrapper.rows.length; i++){
          if(viewdata.visibleLinks[wrapper.rows[i].id]==true) wrapper.rows[i].loaded = "Yes";
          else wrapper.rows[i].loaded = "";
        }
        getView(viewname).viewdata = wrapper;
        getView(viewname).layout.reloadData();
      }
    });
  },
  error: function(msg){
    this.parentView.viewdata = null;
    msg = this.parentView.viewname + ": " + msg;
    console.error(msg);
    user.alert(msg);
    this.parentView.layout.showError();
    //this.parentView.layout.showError();
  }
};

var NetworkLoader = GraphLoader.extend(extObject);

