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

    ViewManager.createView('expression', 'My Expression Matrix', {
      matrixName: 'rna-seq',
      geneRegex: 'BATF|RORC|STAT3|IRF4|MAF',
      condRegex: '.*'
    });
    ViewManager.createView('binding', 'My Genome Browser', {
      gene: 'BATF',
      chr: '1'
    });
    ViewManager.createView('network', 'My Network', {
      networkName: 'th17',
      geneRegex: 'BATF|RORC|STAT3|IRF4|MAF'
    });
  }
};
