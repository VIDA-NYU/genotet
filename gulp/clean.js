// Clean dist repository.

var gulp = require('gulp');
var del = require('del');
var paths = require('./paths.js');

gulp.task('clean', function() {
  return del([
    paths.dist + 'data/network/*',
    paths.dist + 'data/expression/*',
    paths.dist + 'data/wiggle/*',
    paths.dist + 'data/bed/*',
    paths.dist + 'data/upload/*',
    paths.dist + 'html/*',
    paths.dist + '*.css',
    paths.dist + '*.js'
  ]);
});
