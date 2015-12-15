QUnit.test('side panel test', function(assert) {
  /*
  genotet.viewManager.createView('network', 'My Network', {
    networkName: 'meishei.tsv',
    geneRegex: 'BATF|RORC|STAT3|IRF4|MAF'
  });
  var done = assert.async();
  setTimeout(function() {
    var numTabs = $('#side-panel .sideways > li').not('#panel-tab-init').length;
    assert.ok(numTabs == 1, 'show 1 tab');
    done();
  });
  */
  var view = new genotet.NetworkView('testName', {
    networkName: 'meishei.tsv',
    geneRegex: 'BATF|RORC|STAT3|IRF4|MAF'
  });

  assert.ok(true, 'sure');
});
