// Compile the sources using closure-compiler.
var gulp = require('gulp');
var del = require('del');
var closureCompiler = require('gulp-closure-compiler');

var paths = require('./paths.js');

var gclExterns = 'node_modules/google-closure-compiler/contrib/externs/';

var externs = [
  gclExterns + 'jquery-1.9.js',
  gclExterns + 'underscore-1.5.2.js'
].concat(paths.externs);

var compile = function(cb, src) {
  return gulp.src(src)
    .pipe(closureCompiler({
      compilerPath: 'node_modules/google-closure-compiler/compiler.jar',
      fileName: 'genotet.js',
      compilerFlags: {
        jscomp_error: [
          'checkVars',
          'duplicate',
          'undefinedVars'
        ],
        jscomp_warning: [
          'checkTypes',
          'globalThis',
          'missingProperties',
          'undefinedNames'
        ],
        compilation_level: 'SIMPLE_OPTIMIZATIONS',
        externs: externs,
        output_wrapper: '(function(){%output%}).call(window);'
      }
    }).on('error', function(err) {
      del([
        'genotet.js'
      ]);
      cb(err);
    }));
};

gulp.task('compile', function(cb) {
  return compile(cb, paths.src)
    .pipe(gulp.dest(paths.dist));
});

// Virtual compilation, without any output source file.
gulp.task('compile-dev', function(cb) {
  return compile(cb, paths.src);
});

gulp.task('compile-test', function(cb) {
  return compile(cb, paths.src.concat(paths.qunitTests))
    .pipe(gulp.dest(paths.dist));
});
