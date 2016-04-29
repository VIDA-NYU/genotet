// Clean and create dist repository.
var gulp = require('gulp');
var del = require('del');
var fs = require('fs');
var paths = require('./paths.js');

// Dist directory structure
var dirs = [
  'dist',
  'dist/html',
  'dist/data',
  'dist/data/upload',
  'dist/data/log'
];

// Clean all files in dist, including data.
gulp.task('clean', function() {
  return del([
    paths.dist + '**/*'
  ]);
});

// Clean only source files in dist, keeping data.
gulp.task('clean-src', function() {
  return del([
    paths.dist + '*.js',
    paths.dist + '*.css',
    paths.dist + 'html/**/*'
  ]);
});

gulp.task('dist', ['clean'], function() {
  dirs.forEach(function(dir) {
    try {
      fs.mkdirSync(dir);
    } catch (err) {
      if (err.code != 'EEXIST') {
        throw err;
      }
    }
  });
});
