/**
 * @fileoverview Common utils for sending requests.
 */

/** @const */
var request = {};

/** @private @enum {string} */
request.Type_ = {
  GET: 'GET',
  POST: 'POST'
};

/**
 * Sends a GET request to the url with given params and callback.
 * Request is performed with JSON.
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
 * Request is performed with JSON.
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
  console.log(options.type, options.url);
  $.ajax({
    url: options.url,
    type: options.type,
    xhrFields: {
      withCredentials: true
    },
    data: {
      data: JSON.stringify(options.params)
    }
  }).done(function(data, status, xhr) {
      if (options.done) {
        options.done(data, status, xhr);
      }
    })
    .fail(function(res) {
      if (options.fail) {
        options.fail(res.responseText);
      }
    });
};
