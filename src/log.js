/**
 * @fileoverview User log collection.
 */

'use strict';

/**
 * @typedef {{
 *   timestamp: number,
 *   content: string
 * }}
 */
genotet.GenotetLog;

/** @const */
genotet.logger = {};

/** @enum {string} */
genotet.logger.Type = {
  BINDING: 'binding',
  NETWORK: 'network',
  EXPRESSION: 'expression',
  MAPPING: 'mapping',
  VIEW: 'view',
  UPLOAD: 'upload',
  WARNING: 'warning',
  ERROR: 'error',
  SUCCESS: 'success'
};

/**
 * The max size of the log list, return when reaching it.
 * @private @const {number}
 */
genotet.logger.MAX_SIZE_ = 20;

/**
 * Maintains a list of logs, returns as a bunch.
 * @type {Array<!genotet.GenotetLog>}
 */
genotet.logger.logList = [];

/**
 * Initializes logger properties.
 */
genotet.logger.init = function() {
  $(window).on('beforeunload', function() {
    genotet.logger.sendBack();
  });
};

/**
 * Adds log to the log list, returns if collecting enough messages.
 * @param {!genotet.logger.Type} type
 * @param {...*} var_args
 */
genotet.logger.log = function(type, var_args) {
  var logContent = arguments[0];
  for (var i = 1; i < arguments.length; i++) {
    logContent += ' ' + arguments[i];
  }
  var date = new Date();
  genotet.logger.logList.push({
    timestamp: date.getTime(),
    type: type,
    content: logContent
  });
  if (genotet.logger.logList.length &&
    genotet.logger.logList.length % genotet.logger.MAX_SIZE_ == 0) {
    genotet.logger.sendBack();
  }
};

/**
 * Sends the logs back to the server.
 */
genotet.logger.sendBack = function() {
  if (genotet.logger.logList.length) {
    var params = {
      logs: genotet.logger.logList,
      username: genotet.user.info.username
    };
    $.post(genotet.data.logUrl, params, 'json');
    genotet.logger.logList = [];
  }
};
