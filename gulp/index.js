// Copy index to the dist folder.

var gulp = require('gulp');
var htmlReplace = require('gulp-html-replace');

var paths = require('./paths.js');

var generateIndex = function(params) {
  return gulp.src(paths.index)
    .pipe(htmlReplace(params, {
      keepUnassigned: true
    }))
    .pipe(gulp.dest('.'));
};

gulp.task('index', ['clean-index'], function() {
  return generateIndex({
      test: '',
      test_src: ''
    });
});

gulp.task('index-test', ['clean-index'], function() {
  return generateIndex({});
});
