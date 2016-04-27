/**
 * @fileoverview Provides frisby calls chaining.
 */

var frisby = require('frisby');
var server = require('./server.js');

frisby.globalSetup({
  timeout: 1000,
  request: {
    rejectUnauthorized: false
  }
});

/** @type {chain} */
module.exports = chain;

/**
 * @constructor
 */
function chain() {}

/**
 * Runs the frisby requests one by one and performs the tests.
 * @param {!Array<{
 *   name: string,
 *   action: function(!frisby),
 *   check: Function
 * }>} tests
 */
chain.test = function(tests) {
  var run = function(index) {
    if (index == tests.length) {
      return;
    }
    var test = tests[index];
    var request = frisby.create(test.name);
    test.action(request);
    request
      .after(function(err, res, body) {
        server.cookie = res.headers['set-cookie'];
        describe(test.name, function() {
          if (test.check !== undefined) {
            test.check(JSON.parse(body));
          }
        });
        run(index + 1);
      })
      .toss();
  };
  run(0);
};
