// Build the doc.
var gulp = require('gulp');
var sass = require('gulp-sass');

var paths = require('./paths.js');

gulp.task('doc', function(cb) {
  return gulp.src(paths.docScss)
    .pipe(sass({
      outputStyle: 'compressed'
    }).on('error', sass.logError))
    .pipe(gulp.dest(paths.dist))
    .on('error', function(err) {
      cb(err);
    });
});
