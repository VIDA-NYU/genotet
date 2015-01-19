
// Graph Loader

"use strict";

var extObject = {

  load: function(para) {
    var loader = this;

    this.view.wait();

    $.ajax({
        type: 'GET',
        url: para.url,
        dataType: 'jsonp',
        data: {
          args: para.args
        },
      error: function(xhr, status, err){
        loader.error("cannot load graph\n" + status + "\n" + err);
      },
      success: function(result){
        var data = JSON.parse(result, utils.parse);
        if (data == null){
          loader.error("selected graph is empty, or graph not found");
          return;
        }
        loader.view.data = data;
        loader.view.initGraph(para.selection);

        loader.view.unwait();
        loader.view.render();
        //if(loader.parentView.viewdata==null) loader.parentView.viewdata = {};
        /*
        loader.parentView.viewdata.nodes = data.nodes;
        loader.parentView.viewdata.links = data.links;
        loader.parentView.viewdata.wmin = data.wmax;
        loader.parentView.viewdata.wmax = data.wmin;
        if(notInit==null) loader.initData(loader.parentView.viewdata);
        else loader.filterData(loader.parentView.viewdata);
        loader.parentView.layout.reloadData();
        */
      }
   });
  }
};

var GraphLoader = Loader.extend(extObject);
