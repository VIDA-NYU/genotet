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
  var edgesForTable = edges.map(function(edge) {
    return {
      id: edge.id,
      source: edge.source,
      target: edge.target,
      added: edge.added,
      // weight is only weight[0]
      weight: edge.weight[0],
      // originalWeight stores the weight array
      originalWeight: edge.weight
    };
  });
  var dataTable = table.DataTable({
    data: edgesForTable,
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
      '<"row">' +
      '<"row"<"col-sm-5"l><"col-sm-7"f>>' +
      '<"row"<"col-sm-12"tr>>' +
      '<"row"<"col-sm-5"i><"col-sm-7"p>>',
    buttons: [
      {
        text: 'Add',
        className: 'btn btn-default',
        action: function(e, dt, node, config) {
          var selectedEdges = dt.rows({selected: true}).data();
          var additionEdges = [];
          for (var i = 0; i < selectedEdges.length; i++) {
            additionEdges.push({
              id: selectedEdges[i].id,
              source: selectedEdges[i].source,
              target: selectedEdges[i].target,
              weight: selectedEdges[i].originalWeight
            });
          }
          var additionEdgeIds = genotet.utils.keySet(additionEdges
            .map(function(edge) {
              return edge.id;
            }));
          edgesForTable.forEach(function(edge) {
            if (edge.id in additionEdgeIds) {
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
          var selectedEdges = dt.rows({selected: true}).data();
          var removalEdges = [];
          for (var i = 0; i < selectedEdges.length; i++) {
            removalEdges.push({
              id: selectedEdges[i].id,
              source: selectedEdges[i].source,
              target: selectedEdges[i].target,
              weight: selectedEdges[i].originalWeight
            });
          }
          var removalEdgeIds = genotet.utils.keySet(removalEdges
            .map(function(edge) {
              return edge.id;
            }));
          edgesForTable.forEach(function(edge) {
            if (edge.id in removalEdgeIds) {
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
    var data = dataTable.rows({selected: true}).data();
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
        dataTable.button(0).enable(!firstEdge.added); // the addition button
        dataTable.button(1).enable(firstEdge.added);  // the removal button
      } else {
        dataTable.button(0).disable();
        dataTable.button(1).disable();
      }
      var edgeIds = [];
      for (var i = 0; i < data.length; i++) {
        if (data[i].added) {
          edgeIds.push(data[i].id);
        }
      }

      if (edgeIds.length == 1) {
        var selectedEdge = data[0];
        this.signal('showEdgeInfo', selectedEdge);
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
