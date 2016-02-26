/**
 * @fileoverview Manual testing sequence.
 */

'use strict';

/**
 * Runs the test sequence.
 */
genotet.test = function() {
  // Implement test sequences here. This is intended for manual testing,
  // e.g. the following lines create a few views.

  genotet.viewManager.createView(genotet.ViewType.EXPRESSION, 'My Expression Matrix', {
    fileName: 'expressionMatrix',
    tfaFileName: 'tfa.mat.tsv',
    isGeneRegex: true,
    isConditionRegex: true,
    geneInput: 'sig.*',
    conditionInput: 'si.*'
  });
  genotet.viewManager.createView(genotet.ViewType.BINDING, 'My Genome Browser', {
    fileNames: 'SL2870_SL2871.bw',
    bedName: 'bed_data.bed',
    chr: '1',
    multipleTracks: false
  });
  genotet.viewManager.createView(genotet.ViewType.NETWORK, 'My Network', {
    fileName: 'th17.tsv',
    inputGenes: 'BATF|RORC|STAT3|IRF4|MAF',
    isRegex: true
  });
};
