/**
 * @fileoverview Manual testing sequence.
 */

'use strict';

var Test = {
  /**
   * Runs the test sequence.
   */
  run: function() {
    // Implement test sequences here. This is intended for manual testing,
    // e.g. the following lines create a few views.
    ViewManager.createView('network', 'My Network', {
      networkName: 'th17',
      geneRegex: 'BATF|RORC|STAT3|IRF4|MAF'
    });
    ViewManager.createView('expression', 'My Expression Matrix', {
    });
    ViewManager.createView('binding', 'My Genome Browser', {
    });
  }
};

/*
  // obsolete examples
  createView('Network', 'graph')
    .loadData('th17', '^BATF$|^RORC$|^STAT3$|^FOSL2$|^MAF$|^IRF4$');
  createView('Heatmap', 'heatmap')
    .loadData('sigA');
  createView('Binding', 'histogram')
    .loadData('BATF');
  createView('Binding2', 'histogram')
    .loadData('IRF4');
  linkView('Network', 'Heatmap');
  linkView('Network', 'Binding');
  groupView('Binding', 'Binding2');
*/
