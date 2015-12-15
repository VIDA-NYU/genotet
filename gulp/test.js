// Testing tasks
var gulp = require('gulp');
var concat = require('gulp-concat');
var qunit = require('gulp-qunit');
var jasmineNode = require('gulp-jasmine-node');

var paths = require('./paths.js');

// Concat the tests.
gulp.task('concat-qunit-tests', function(cb) {
  return gulp.src(paths.qunitTests)
    .pipe(concat('genotet-test.js'))
    .pipe(gulp.dest(paths.dist));
});

gulp.task('copy-testdata', function() {
  return gulp.src(paths.testData)
    .pipe(gulp.dest(paths.dist + 'data'));
});

gulp.task('jasmine-node-test', function(cb) {
  return gulp.src(paths.jasmineNodeTests)
    .pipe(jasmineNode());
});

gulp.task('qunit-test', [
  'concat-qunit-tests',
  'copy-testdata'
], function(cb) {
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
gulp.task('run-test', ['jasmine-node-test', 'qunit-test']);
