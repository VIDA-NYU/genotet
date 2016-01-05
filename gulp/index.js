// Copy index to the dist folder.

var gulp = require('gulp');
var htmlReplace = require('gulp-html-replace');

var paths = require('./paths.js');

var generateIndex = function(params) {
  var index = gulp.src(paths.index);
  index = index.pipe(htmlReplace(params, {
    keepUnassigned: true
  }));
  return index.pipe(gulp.dest('.'));
};

gulp.task('index', function() {
  return generateIndex({
    test: '',
    test_src: ''
  });
});

gulp.task('index-test', function() {
  return generateIndex({});
});
