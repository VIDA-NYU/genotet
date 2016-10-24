// Testing tasks
var gulp = require('gulp');
var concat = require('gulp-concat');
var qunit = require('gulp-qunit');
var runSequence = require('run-sequence');
var paths = require('./paths.js');

gulp.task('copy-testdata', function() {
  return gulp.src(paths.testData)
    .pipe(gulp.dest(paths.dist + 'data'));
});

gulp.task('qunit-test', function(cb) {
  return gulp.src('index.html')
    .pipe(qunit({
      'phantomjs-options': ['--ignore-ssl-errors=true', '--web-security=false'],
      'timeout': 30
    }))
    .on('error', function(err) {
      cb(err);
    });
});

// Run the tests.
gulp.task('run-test', ['qunit-test']);

// Test task for dev build, without compiler optimization.
gulp.task('test-dev', function(cb) {
  runSequence(
    'clean-src',
    ['copy', 'index-test', 'sass-dev', 'concat-src-test'],
    'run-test',
    cb);
});

// Test task for production build, with compiler optimization/
gulp.task('test-production', function(cb) {
  runSequence(
    'clean-src',
    ['copy', 'index-test', 'sass', 'compile-qunit'],
    'run-test',
    cb);
});
