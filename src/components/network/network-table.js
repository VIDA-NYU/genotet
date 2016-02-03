/**
 * @fileoverview Table used for showing incident edges of selected
 * node in the regulatory network.
 */

'use strict';

/**
 * NetworkTable renders given multi-dimensional data as a table.
 * @param {!Object} data Data object of the view.
 * @constructor
 */
genotet.NetworkTable = function(data) {
  this.data = data;

  /**
   * Edges to display in table.
   * @private {!Array<!genotet.EdgeForTable>}
   */
  this.edgesForTable_;

  /**
   * The DataTable object.
   * @private {!DataTables}
   */
  this.dataTable_;
};

/**
 * Triggers a jQuery event on the table.
 * @param {string} eventType Type of event.
 * @param {*=} opt_data Data to be sent via the event.
 */
genotet.NetworkTable.prototype.signal = function(eventType, opt_data) {
  $(this).trigger('genotet.' + eventType, [opt_data]);
};

/**
 * Creates an incident edge table with the given data, inside a given
 * container.
 * @param {!jQuery} table Table element as container.
 * @param {!Array<{
 *   id: string,
 *   source: string,
 *   target: string,
 *   weight: !Array<number>,
 *   added: boolean
 * }>} edges List of edges.
 *   added: Whether the edge has been added to the network.
 */
genotet.NetworkTable.prototype.create = function(table, edges) {
  var edgeIds = {};
  this.data.network.edges.forEach(function(edge) {
    edgeIds[edge.id] = true;
  });
  edges.forEach(function(edge) {
    edge.added = edge.id in edgeIds;
  });
  this.edgesForTable_ = edges.map(function(edge) {
    return {
      id: edge.id,
      source: this.data.networkInfo.nodeLabel[edge.source],
      target: this.data.networkInfo.nodeLabel[edge.target],
      added: edge.added,
      // weight is only weight[0]
      weight: edge.weight[0],
      // originalWeight stores weight array
      originalWeight: edge.weight
    };
  }.bind(this));
  this.dataTable_ = table.DataTable({
    data: this.edgesForTable_,
    columnDefs: [
      {
        render: function(added) {
          return added ? '&#10004;' : '';
        },
        targets: 3
      }
    ],
    columns: [
      {title: 'Source', data: 'source'},
      {title: 'Target', data: 'target'},
      {title: 'Weight', data: 'weight'},
      {title: '', data: 'added'}
    ],
    select: {
      style: 'os',
      info: false
    },
    dom: '<"row"<"#table-btn.col-sm-12"B>>' +
      '<"row"<"col-sm-5"l><"col-sm-7"f>>' +
      '<"row"<"col-sm-12"tr>>' +
      '<"row"<"col-sm-5"i><"col-sm-7"p>>',
    buttons: [
      {
        text: 'Add',
        className: 'btn btn-default',
        action: function(e, dt, node, config) {
          var selectedEdges = /** @type {!Array<genotet.EdgeForTable>} */
            (dt.rows({selected: true}).data());
          var additionEdges = [];
          for (var i = 0; i < selectedEdges.length; i++) {
            additionEdges.push({
              id: selectedEdges[i].id,
              source: selectedEdges[i].source.toLowerCase(),
              target: selectedEdges[i].target.toLowerCase(),
              weight: selectedEdges[i].originalWeight
            });
          }
          var additionEdgeIds = additionEdges.map(function(edge) {
            return edge.id;
          });
          var additionEdgeIdMap = genotet.utils.keySet(additionEdgeIds);
          this.edgesForTable_.forEach(function(edge) {
            if (edge.id in additionEdgeIdMap) {
              edge.added = true;
            }
          });
          this.signal('addEdges', additionEdges);
          this.signal('highlightEdges', additionEdgeIds);

          // refresh the rows
          dt.rows({selected: true}).invalidate();
          // change the button status
          dt.buttons(0).enable(false);  // the addition button
          dt.buttons(1).enable(true);   // the removal button
        }.bind(this),
        enabled: false
      },
      {
        text: 'Remove',
        className: 'btn btn-default',
        action: function(e, dt, node, config) {
          var selectedEdges = /** @type {!Array<genotet.EdgeForTable>} */
            (dt.rows({selected: true}).data());
          var removalEdges = [];
          for (var i = 0; i < selectedEdges.length; i++) {
            removalEdges.push({
              id: selectedEdges[i].id,
              source: selectedEdges[i].source.toLowerCase(),
              target: selectedEdges[i].target.toLowerCase(),
              weight: selectedEdges[i].originalWeight
            });
          }
          var removalEdgeIds = removalEdges.map(function(edge) {
            return edge.id;
          });
          var removalEdgeIdMap = genotet.utils.keySet(removalEdgeIds);
          this.edgesForTable_.forEach(function(edge) {
            if (edge.id in removalEdgeIdMap) {
              edge.added = false;
            }
          });

          // change panel, renderer and network data in memory
          this.signal('highlightEdges', []);
          this.signal('removeEdges', removalEdges);
          this.signal('hideEdgeInfo', {
            edges: removalEdges,
            force: false
          });
          // refresh the row
          dt.rows({selected: true}).invalidate();
          // change the button status
          dt.buttons(0).enable(true);   // the addition button
          dt.buttons(1).enable(false);  // the removal button
        }.bind(this),
        enabled: false
      }
    ],
    lengthMenu: [5, 10, 20, 50],
    pageLength: 5,
    pagingType: 'full'
  });

  table.on('click', function() {
    var data = /** @type {!Array<genotet.EdgeForTable>} */
      (this.dataTable_.rows({selected: true}).data());
    if (data.length > 0) {
      var allSame = true;
      if (data.length > 1) {
        for (var i = 1; i < data.length; i++) {
          if (data[i].added != data[i - 1].added) {
            allSame = false;
            break;
          }
        }
      }
      if (allSame) {
        var firstEdge = data[0];
        // the addition button
        this.dataTable_.button(0).enable(!firstEdge.added);
        // the removal button
        this.dataTable_.button(1).enable(firstEdge.added);
      } else {
        this.dataTable_.button(0).disable();
        this.dataTable_.button(1).disable();
      }
      var edgeIds = [];
      for (var i = 0; i < data.length; i++) {
        if (data[i].added) {
          edgeIds.push(data[i].id);
        }
      }

      if (edgeIds.length == 1) {
        var networkEdge = this.data.network.edgeMap[edgeIds[0]];
        this.signal('showEdgeInfo', networkEdge);
      } else if (edgeIds.length > 1) {
        this.signal('multiEdgeInfo');
      } else {
        this.signal('hideEdgeInfo', {
          edges: [],
          force: true
        });
      }
      this.signal('highlightEdges', edgeIds);
    }
  }.bind(this));

  table.closest('#edge-list').css('width',
    /** @type {number} */(table.width()));
};

/**
 * Change the table for the edge removal.
 * @param {!genotet.NetworkEdge} edge Edge to be removed.
 */
genotet.NetworkTable.prototype.removeEdge = function(edge) {
  if (!this.edgesForTable_ || !this.dataTable_) {
    return;
  }
  this.edgesForTable_.forEach(function(edgeForTable) {
    if (edgeForTable.id == edge.id) {
      edgeForTable.added = false;
    }
  });
  this.dataTable_.rows().invalidate();
};
