/**
 * @fileoverview Server logger.
 */

var dateFormat = require('dateformat');

/** @type {log} */
module.exports = log;

/**
 * @constructor
 */
function log() {}

/**
 * Prints logs with timestamps.
 * @param {!Array<string>} args Content to be logged.
 */
log.serverLog = function(args) {
  if (!args.length) {
    return;
  }
  var date = new Date();
  var timestamp = '[' + dateFormat(date, 'yyyy-mm-dd_HH:MM:ss') + '_' +
    date.getTime() + ']';
  var content = timestamp + ' ' + args.join(' ');
  console.log(content);
};
