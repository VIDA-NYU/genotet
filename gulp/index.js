// Copy index to the dist folder.

var gulp = require('gulp');
var htmlReplace = require('gulp-html-replace');

var paths = require('./paths.js');

var generateIndex = function(testing) {
  var index = gulp.src(paths.index);
  if (!testing) {
    index = index.pipe(htmlReplace({
      test: ''
    }));
  }
  return index.pipe(gulp.dest('.'));
};

gulp.task('index', function() {
  return generateIndex(false);
});

gulp.task('index-test', function() {
  return generateIndex(true);
});
