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

  genotet.viewManager.createView('expression', 'My Expression Matrix', {
    fileName: 'expressionMatrix',
    tfaFileName: 'tfa.matrix2.bin',
    isGeneRegex: true,
    isConditionRegex: true,
    geneInput: 'sig.*',
    conditionInput: 'si.*'
  });
  genotet.viewManager.createView('binding', 'My Genome Browser', {
    fileNames: 'SL971_SL970',
    bedName: 'bed_data.bed',
    chr: '1',
    multipleTracks: false
  });
  genotet.viewManager.createView('network', 'My Network', {
    fileName: 'th17.tsv',
    geneRegex: 'BATF|RORC|STAT3|IRF4|MAF',
    isRegex: true
  });
};
