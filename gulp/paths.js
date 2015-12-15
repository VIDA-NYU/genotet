// Source, data, path specification.

/** @const */
module.exports = {
  dist: 'dist/',
  src: [
    'src/genotet.js',
    'src/utils.js',
    'src/components/base/*.js',
    'src/components/**/*.js',
    'src/*.js'
  ],
  qunitTests: [
    'test/qunit/**/*.js'
  ],
  jasmineNodeTests: [
    'test/jasmine-node/**/*.js'
  ],
  testData: [
    'test/data/**/*'
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
    '!src/index.html',
    'src/**/*.html',
    'templates/*.html'
  ],
  index: ['src/index.html'],
  gulpTasks: ['gulp/**/*.js']
};
