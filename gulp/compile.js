// Compile the sources using closure-compiler.
var gulp = require('gulp');
var closureCompiler = require('gulp-closure-compiler');

var paths = require('./paths.js');

gulp.task('compile', function(cb) {
  return gulp.src(paths.src)
    .pipe(closureCompiler({
      compilerPath: 'node_modules/google-closure-compiler/compiler.jar',
      fileName: 'genotet.js'
    }).on('error', function(err) {
      cb(err);
    }))
    .pipe(gulp.dest(paths.dist));
});
