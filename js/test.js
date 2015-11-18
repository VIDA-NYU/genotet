/**
 * @fileoverview Manual testing sequence.
 */

'use strict';

/** @const */
genotet.test = {};

/**
 * Runs the test sequence.
 */
genotet.test.run = function() {
  // Implement test sequences here. This is intended for manual testing,
  // e.g. the following lines create a few views.

  genotet.viewManager.createView('expression', 'My Expression Matrix', {
    matrixName: 'rna-seq',
    geneRegex: 'BATF|RORC|STAT3|IRF4|MAF',
    condRegex: 'SL134.*'
  });
  genotet.viewManager.createView('binding', 'My Genome Browser', {
    gene: 'BATF',
    chr: '1'
  });
  genotet.viewManager.createView('network', 'My Network', {
    networkName: 'th17',
    geneRegex: 'BATF|RORC|STAT3|IRF4|MAF'
  });
};
