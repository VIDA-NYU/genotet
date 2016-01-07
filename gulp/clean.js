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
  'dist/data/network',
  'dist/data/wiggle',
  'dist/data/expression',
  'dist/data/bed',
  'dist/data/upload'
];

gulp.task('clean', function() {
  return del([
    paths.dist + '**/*'
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
