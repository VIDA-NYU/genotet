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
    matrixName: 'expressionMatrix',
    geneRegex: 'sig.*',
    condRegex: 'SigH.*'
  });
  genotet.viewManager.createView('binding', 'My Genome Browser', {
    gene: 'SL3037_SL3036',
    chr: '1'
  });
  genotet.viewManager.createView('network', 'My Network', {
    networkName: 'meishei.tsv',
    geneRegex: 'BATF|RORC|STAT3|IRF4|MAF'
  });
};
