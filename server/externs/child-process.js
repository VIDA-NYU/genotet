/**
 * @fileoverview Node.js child-process extern.
 */

/** @typedef {child_process.ChildProcess} */
var childProcess;

/**
 * @param {string} cmd
 */
child_process.ChildProcess.prototype.execSync = function(cmd) {};
