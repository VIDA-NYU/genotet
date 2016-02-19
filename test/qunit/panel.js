QUnit.module('panel');

QUnit.test('tabs', function(assert) {
  genotet.qunit.init();
  assert.expect(3);
  var sideways = $('#side-panel .sideways');
  genotet.qunit.chain(assert, [
    {
      action: function() {
        genotet.viewManager.createView('network', 'Network 1', {
          fileName: 'network-1.tsv',
          inputGenes: '.*',
          isRegex: true
        });
      },
      check: function() {
        var numTabs = sideways.children('li')
          .not('#panel-tab-init').length;
        assert.equal(numTabs, 1, 'show 1 tab');
      }
    },
    {
      action: function() {
        genotet.viewManager.createView('network', 'Network 2', {
          fileName: 'network-1.tsv',
          inputGenes: '.*',
          isRegex: true
        });
      },
      check: function() {
        var numTabs = sideways.children('li')
          .not('#panel-tab-init').length;
        assert.equal(numTabs, 2, 'show 2 tabs');
      }
    },
    {
      action: function() {
        genotet.viewManager.closeView(genotet.viewManager.views['Network 1']);
      },
      check: function() {
        var numTabs = sideways.children('li')
          .not('#panel-tab-init').length;
        assert.equal(numTabs, 1, 'show 1 tab after closing 1');
      }
    }
  ]);
});

QUnit.test('visibility', function(assert) {
  genotet.qunit.init();
  assert.expect(3);
  var sidePanel = $('#side-panel');
  assert.ok(sidePanel.is(':hidden'), 'hidden when no view is created');
  genotet.qunit.chain(assert, [
    {
      action: function() {
        genotet.viewManager.createView('network', 'Network 1', {
          fileName: 'network-1.tsv',
          inputGenes: '.*',
          isRegex: true
        });
      },
      check: function() {
        assert.notOk(sidePanel.is(':hidden'), 'shown when view is created');
      }
    },
    {
      action: function() {
        genotet.viewManager.closeView(genotet.viewManager.views['Network 1']);
      },
      check: function() {
        assert.ok(sidePanel.is(':hidden'), 'hidden when all views are closed');
      }
    }
  ]);
});
