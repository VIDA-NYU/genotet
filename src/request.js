/**
 * @fileoverview Common utils for sending requests.
 */

/** @const */
var request = {};

/**
 * Sends a get request to the url with given params and callback.
 * @param {{
 *   url: string,
 *   params: !Object,
 *   done: (Function|undefined),
 *   fail: (function(string)|undefined)
 * }} options
 *   url: URL to which the get request is sent.
 *   params: Query parameters of the get request.
 *   done: Done premise.
 *   fail: Fail premise.
 */
request.get = function(options) {
  var params = {data: JSON.stringify(options.params)};

  $.get(options.url, params, function() {}, 'jsonp')
    .done(function(data, status, xhr) {
      if (data.error && options.fail) {
        options.fail(data.error);
        return;
      }
      if (options.done) {
        options.done(data, status, xhr);
      }
    })
    .fail(function() {
      // JSONP does not support failure response details.
      // No meaningful XHR will be passed on.
      if (options.fail) {
        options.fail('server connection error');
      }
    });
};
