/**
 * @fileoverview User log collection.
 */

'use strict';

/**
 * @typedef {{
 *   timestamp: number,
 *   type: string,
 *   action: string
 * }}
 */
genotet.genotetLog;

/** @const */
genotet.logger = {};

/**
 * The max size of the log list, return when reaching it.
 * @private @const {number}
 */
genotet.logger.MAX_SIZE_ = 20;

/**
 * Maintains a list of logs, returns as a bunch.
 * @type {Array<!genotet.genotetLog>}
 */
genotet.logger.logList = [];

/**
 * Adds log to the log list, returns if collecting enough messages.
 * @param {...*} var_args
 */
genotet.logger.log = function(var_args) {
  if (!arguments.length || arguments.length < 2) {
    return;
  }
  var type = arguments[0];
  var action = arguments[1];
  for (var i = 2; i < arguments.length; i++) {
    action += ' ' + arguments[i];
  }
  var date = new Date();
  genotet.logger.logList.push({
    timestamp: date.getTime(),
    type: type,
    action: action
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
    var params = {
      logs: genotet.logger.logList,
      username: 'anonymous', // will call api of user system
      type: 'user-log'
    };
    $.post(genotet.data.logURL, params, 'json');
    genotet.logger.logList = [];
};
