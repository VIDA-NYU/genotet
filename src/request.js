/**
 * @fileoverview Common utils for sending requests.
 */

/** @const */
var request = {};

/** @private @enum {number} */
request.Type_ = {
  GET: 0,
  POST: 1
};

/**
 * Sends a GET request to the url with given params and callback.
 * Request is performed with JSONP.
 * @param {{
 *   url: string,
 *   params: !Object,
 *   done: (Function|undefined),
 *   fail: (function(string)|undefined)
 * }} options Please refer to the definition in ajax_().
 */
request.get = function(options) {
  request.ajax_(_.extend(options, {type: request.Type_.GET}));
};

/**
 * Sends a POST request to the url with given params and callback, via JSON.
 * Request is performed with JSON. POST does not support JSONP!
 * @param {{
 *   url: string,
 *   params: !Object,
 *   done: (Function|undefined),
 *   fail: (Function|undefined)
 * }} options Please refer to the definition in ajax_().
 */
request.post = function(options) {
  request.ajax_(_.extend(options, {type: request.Type_.POST}));
};

/**
 * Performs an AJAX request to the server.
 * @param {{
 *   type: request.Type_,
 *   url: string,
 *   params: !Object,
 *   done: (Function|undefined),
 *   fail: (Function|undefined)
 * }} options
 *   type: HTTP request type.
 *   url: URL to which the get request is sent.
 *   params: Query parameters of the get request.
 *   done: Done premise.
 *   fail: Fail premise.
 * @private
 */
request.ajax_ = function(options) {
  var params = {data: JSON.stringify(options.params)};
  var isJsonp = options.type == request.Type_.GET;
  var func = isJsonp ? $.get : $.post;
  var jsonType = isJsonp ? 'jsonp' : 'json';
  func(options.url, params, function() {}, jsonType)
    .done(function(data, status, xhr) {
      if (isJsonp && data.error && options.fail) {
        options.fail(data.error);
        return;
      }
      if (options.done) {
        options.done(data, status, xhr);
      }
    })
    .fail(function(res) {
      if (isJsonp && options.fail) {
        // JSONP does not support failure response details.
        // No meaningful XHR will be passed on.
        options.fail('server connection error');
        return;
      } else if (options.fail) {
        options.fail(res);
      }
    });
};
