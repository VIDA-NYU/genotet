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
  dev: [
    'dev/**/*.js'
  ],
  qunitTests: [
    'test/qunit/index.js',
    'test/qunit/**/*.js'
  ],
  jasmineNodeTests: [
    'test/jasmine-node/**/*.js'
  ],
  testData: [
    'test/data/**/*'
  ],
  externs: [
    'src/externs/**/*.js',
    'test/externs/**/*.js'
  ],
  server: [
    'server/*.js'
  ],
  scss: [
    'src/**/*.scss',
    '!src/css/doc.scss'
  ],
  docScss: [
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
