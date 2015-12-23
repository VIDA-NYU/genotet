// Lint js sources.
var gulp = require('gulp');
var gjslint = require('gulp-gjslint');

var paths = require('./paths.js');

gulp.task('lint-frontend', function(cb) {
  return gulp.src(paths.src)
    .pipe(gjslint())
    .pipe(gjslint.reporter('console'))
    .pipe(gjslint.reporter('fail'))
    .on('error', function(err) {
      cb(err);
    });
});

gulp.task('lint-server', function(cb) {
  return gulp.src(paths.server)
    .pipe(gjslint())
    .pipe(gjslint.reporter('console'))
    .pipe(gjslint.reporter('fail'))
    .on('error', function(err) {
      cb(err);
    });
});

gulp.task('lint-test', function(cb) {
  return gulp.src(paths.qunitTests.concat(paths.jasmineNodeTests))
    .pipe(gjslint())
    .pipe(gjslint.reporter('console'))
    .pipe(gjslint.reporter('fail'))
    .on('error', function(err) {
      cb(err);
    });
});

gulp.task('lint-gulp', function(cb) {
  return gulp.src(paths.gulpTasks)
    .pipe(gjslint())
    .pipe(gjslint.reporter('console'))
    .pipe(gjslint.reporter('fail'))
    .on('error', function(err) {
      cb(err);
    });
});

gulp.task('lint', ['lint-frontend', 'lint-server', 'lint-test', 'lint-gulp']);
