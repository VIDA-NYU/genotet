/**
 * @fileoverview QUnit test settings, utils and initialization scripts.
 */

/** @const */
genotet.qunit = {};

/**
 * Initializes the testing environment.
 */
genotet.qunit.init = function() {
  genotet.init();
};

/**
 * Chains the qunit async tests.
 * @param {!QUnit.assert} assert
 * @param {!Array<{action: function, check: function}>} tests
 */
genotet.qunit.chain = function(assert, tests) {
  var run = function(index) {
    if (index == tests.length) {
      return;
    }
    var test = tests[index];
    test.action();
    var done = assert.async();
    setTimeout(function() {
      test.check();
      done();
      run(index + 1);
    });
  };
  run(0);
};

// Moves the genotet container to atomic testing environment.
$(document).ready(function() {
  $('#genotet').appendTo('#qunit-fixture');
});
