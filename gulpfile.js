var gulp = require('gulp');

var merge = require('merge-stream');
var del = require('del');

var sass = require('gulp-sass');
var flatten = require('gulp-flatten');
var gjslint = require('gulp-gjslint');
var csslint = require('gulp-csslint');
var concat = require('gulp-concat');
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
  server: [
    'server/*.js'
  ],
  css: [
    'src/**/*.css',
    'src/**/*.scss',
    '!src/css/doc.scss'
  ],
  docCSS: [
    'src/css/doc.scss'
  ],
  html: [
    'src/**/*.html',
    'templates/*.html'
  ]
};

// Clean dist repository.
gulp.task('clean', function() {
  return del([
    bases.dist + '**/*'
  ]);
});

// Lint js sources.
gulp.task('lint-frontend', ['clean'], function() {
  return gulp.src(paths.src)
    .pipe(gjslint())
    .pipe(gjslint.reporter('console'), {fail: true});
});
gulp.task('lint-server', ['clean'], function() {
  return gulp.src(paths.server)
    .pipe(gjslint())
    .pipe(gjslint.reporter('console'), {fail: true});
});
gulp.task('lint', ['lint-frontend', 'lint-server']);

// Copy resources to the dist folder.
gulp.task('copy', ['clean'], function() {
  gulp.src(paths.html)
    .pipe(flatten())
    .pipe(gulp.dest(bases.dist + 'html'));
});

// Sass build the css.
var runSass = function(compressed) {
  return gulp.src(paths.css)
    .pipe(concat('genotet.scss'))
    .pipe(flatten())
    .pipe(sass({
      outputStyle: compressed ? 'compressed' : ''
    }).on('error', sass.logError))
    .pipe(gulp.dest(bases.dist));
};
gulp.task('sass', function() {
  return runSass(true);
});
gulp.task('sass-dev', function() {
  return runSass(false);
});

// Concat the sources, used in dev environment for easier debugging.
gulp.task('concat', ['lint-frontend'], function() {
  return gulp.src(paths.src)
    .pipe(concat('genotet.js'))
    .pipe(gulp.dest(bases.dist));
});

// Compile the sources using closure-compiler.
gulp.task('compile', ['lint-frontend'], function(cb) {
  return gulp.src(paths.src)
    .pipe(closureCompiler({
      compilerPath: 'node_modules/google-closure-compiler/compiler.jar',
      fileName: 'genotet.js'
    }))
    .pipe(gulp.dest(bases.dist));
});

// Test the system.
gulp.task('test', ['compile'], function(cb) {
  var err = new Error('tests are to be implemented');
  cb(err);
});

// Watch the sources and automatically rebuild when files change.
gulp.task('watch', function() {
  gulp.watch([
    'index.html',
    paths.src,
    paths.server,
    paths.html
  ], ['default']);
});

// Build the doc.
gulp.task('doc', function() {
  gulp.src(paths.docCSS)
    .pipe(sass({
      outputStyle: 'compressed'
    }).on('error', sass.logError))
    .pipe(gulp.dest(bases.dist));
});

// Dev task, without code minification.
gulp.task('dev', ['copy', 'sass-dev', 'concat']);

// Default task, with code minification.
gulp.task('default', ['copy', 'sass', 'compile', 'doc']);
