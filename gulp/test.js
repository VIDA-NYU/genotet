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

gulp.task('qunit-test', ['copy-testdata'], function(cb) {
  return gulp.src('index.html')
    .pipe(qunit({
      // phantomjs2 is required as 1.x does not have Function.prototype.bind
      binPath: require('phantomjs2').path
    })
    .on('error', function(err) {
      cb(err);
    }));
});

// Run the tests.
gulp.task('run-test', ['qunit-test']);

// Test task for dev build, without compiler optimization.
gulp.task('test-dev', function(cb) {
  runSequence(
    'clean',
    ['copy', 'index-test', 'sass-dev', 'concat-src-test'],
    'run-test',
    cb);
});

// Test task for production build, with compiler optimization/
gulp.task('test-production', function(cb) {
  runSequence(
    'clean',
    ['copy', 'index-test', 'sass', 'compile-test'],
    'run-test',
    cb);
});
