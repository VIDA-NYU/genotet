// Build tasks
var gulp = require('gulp');
var runSequence = require('run-sequence');

// Build with code minification.
gulp.task('build', function(cb) {
  runSequence(
    'dist',
    ['copy', 'index', 'sass', 'compile'],
    cb);
});

// Build without code minification.
gulp.task('build-dev', function(cb) {
  runSequence(
    'dist',
    [
      'copy',
      'index',
      'sass-dev',
      'concat-src-dev'
    ],
    cb);
});
