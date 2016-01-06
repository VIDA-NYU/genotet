/**
 * @fileoverview Provides frisby calls chaining.
 */

var frisby = require('frisby');

/** @const */
module.exports = {
  /**
   * Runs the frisby requests one by one and performs the tests.
   * @param {!Array<!{
   *   name: string,
   *   action: function(!Frisby),
   *   check: Function
   * }>} tests
   */
  test: function(tests) {
    var run = function(index) {
      if (index == tests.length) {
        return;
      }
      var test = tests[index];
      var request = frisby.create(test.name);
      test.action(request);
      request
        .after(function(err, res, body) {
          test.check(body);
          run(index + 1);
        })
        .toss();
    };
    run(0);
  }
};
