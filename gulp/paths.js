// Source, data, path specification.

/** @const */
module.exports = {
  dist: 'dist/',
  src: [
    'src/genotet.js',
    'src/request.js',
    'src/url.js',
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
    '!test/qunit/externs/*.js',
    'test/qunit/user.js',
    'test/qunit/panel.js'
  ],
  jasmineNodeTests: [
    '!test/jasmine-node/externs/*.js',
    'test/jasmine-node/**/*.js'
  ],
  testData: [
    'test/data/**/*'
  ],
  externs: [
    'src/externs/**/*.js',
    'test/qunit/externs/*.js'
  ],
  serverExterns: [
    'server/externs/*.js'
  ],
  jasmineNodeExterns: [
    'test/jasmine-node/externs/*.js'
  ],
  server: [
    'server/*.js'
  ],
  scss: [
    '!src/css/doc.scss',
    'src/**/*.scss'
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
