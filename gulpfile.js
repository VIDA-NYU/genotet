var gulp = require('gulp');

var del = require('del');

var flatten = require('gulp-flatten');
var gjslint = require('gulp-gjslint');
var csslint = require('gulp-csslint');
var closureCompiler = require('gulp-closure-compiler');

var bases = {
  src: 'src/',
  dist: 'dist/'
};

var paths = {
  src: [
    'src/genotet.js',
    'src/utils.js',
    'src/components/base/*.js',
    'src/components/**/*.js',
    'src/*.js'
  ],
  css: ['src/**/*.css'],
  html: [
    'src/**/*.html',
    '*.html'
  ]
};

// Clean dist repository.
gulp.task('clean', function() {
  return del([
    bases.dist + '**/*'
  ]);
});

// Lint js sources.
gulp.task('lint', ['clean'], function() {
  gulp.src(paths.src)
    .pipe(gjslint())
    .pipe(gjslint.reporter('console'));

  /*
  // TODO(bowen): Check css lint and style.
  gulp.src(paths.css)
    .pipe(csslint())
    .pipe(csslint.reporter());
  */
});

gulp.task('copy', ['clean'], function() {
  gulp.src(paths.html)
    .pipe(flatten())
    .pipe(gulp.dest(bases.dist + 'html'));

  gulp.src(paths.css)
    .pipe(flatten())
    .pipe(gulp.dest(bases.dist + 'css'));
});

gulp.task('compile', ['lint'], function() {
  return gulp.src(paths.src)
    .pipe(closureCompiler({
      compilerPath: 'node_modules/google-closure-compiler/compiler.jar',
      fileName: 'genotet.js'
    }))
    .pipe(gulp.dest(bases.dist));
});

gulp.task('watch', function() {
  gulp.watch([paths.src, paths.html], ['default']);
});

// Default: lint, copy resources, compile
gulp.task('default', ['lint', 'copy', 'compile']);
