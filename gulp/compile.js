// Compile the sources using closure-compiler.
var gulp = require('gulp');
var del = require('del');
var runSequence = require('run-sequence');
var closureCompiler = require('gulp-closure-compiler');
var replace = require('gulp-replace-task');
var concat = require('gulp-concat');

var paths = require('./paths.js');

var jscompErrors = [
  'checkVars',
  'duplicate',
  'undefinedVars'
];

var jscompWarnings = [
  'checkTypes',
  'globalThis',
  'missingProperties',
  'undefinedNames'
];

var compilerPath = 'node_modules/google-closure-compiler/compiler.jar';
var closureContrib = 'node_modules/google-closure-compiler/contrib/';
var closureExterns = closureContrib + 'externs/';

var externs = [
  closureExterns + 'jquery-1.9.js',
  closureExterns + 'underscore-1.5.2.js'
].concat(paths.externs);

var serverExterns = [
  '!' + closureContrib + 'nodejs/globals.js',
  '!' + closureContrib + 'nodejs/url.js',
  '!' + closureContrib + 'nodejs/fs.js',
  '!' + closureContrib + 'nodejs/readline.js',
  closureContrib + 'nodejs/*.js'
].concat(paths.serverExterns);

var jasmineNodeExterns = [
  closureExterns + 'jasmine.js',
  closureContrib + 'nodejs/querystring.js',
  closureContrib + 'nodejs/path.js',
  closureContrib + 'nodejs/stream.js',
  closureContrib + 'nodejs/events.js',
  // Borrow some externs from server
  'server/externs/fs.js',
  'server/externs/buffer.js'
].concat(paths.jasmineNodeExterns);

var compile = function(cb, src) {
  return gulp.src(src)
    .pipe(closureCompiler({
      compilerPath: compilerPath,
      fileName: 'genotet.js',
      compilerFlags: {
        jscomp_error: jscompErrors,
        jscomp_warning: jscompWarnings,
        compilation_level: 'SIMPLE_OPTIMIZATIONS',
        externs: externs,
        output_wrapper: '(function(){%output%}).call(window);'
      }
    }).on('error', function(err) {
      del([
        'genotet.js'
      ]);
      cb(err);
    }));
};

gulp.task('compile', function(cb) {
  return compile(cb, paths.src)
    .pipe(gulp.dest(paths.dist));
});

gulp.task('compile-qunit', function(cb) {
  return compile(cb, paths.src.concat(paths.qunitTests))
    .pipe(gulp.dest(paths.dist));
});

gulp.task('compile-dev', function(cb) {
  return compile(cb, paths.src);
});

// Concats the nodejs code with require and module.exports and removes those
// as they do not work with closure compiler.
var externRequires = function(src, outputFile) {
  return gulp.src(src)
    .pipe(replace({
      patterns: [
        {match: /var\s[_a-zA-Z]+\s=\srequire\('.*'\).*;/g, replacement: ''},
        {match: /module\.exports\s=.*;/g, replacement: ''}
      ]
    }))
    .pipe(concat(outputFile))
    .pipe(gulp.dest(paths.dist));
};

gulp.task('precompile-server-src', function() {
  return externRequires(paths.server, 'genotet-server.js');
});

gulp.task('precompile-server-externs', function() {
  return externRequires(serverExterns, 'genotet-server-externs.js');
});

gulp.task('precompile-server', [
  'precompile-server-src',
  'precompile-server-externs'
]);

gulp.task('compile-server', ['precompile-server'], function(cb) {
  return gulp.src(paths.dist + 'genotet-server.js')
    .pipe(closureCompiler({
      compilerPath: compilerPath,
      fileName: 'genotet-server.js',
      compilerFlags: {
        jscomp_error: jscompErrors,
        jscomp_warning: jscompWarnings,
        externs: paths.dist + 'genotet-server-externs.js'
      }
    }).on('error', function(err) {
       del([
         'genotet-server.js'
       ]);
      cb(err);
    }));
});

gulp.task('precompile-jasmine-node-src', function() {
  return externRequires(paths.jasmineNodeTests,
    'genotet-jasmine-node.js');
});

gulp.task('precompile-jasmine-node-externs', function() {
  return externRequires(jasmineNodeExterns,
    'genotet-jasmine-node-externs.js');
});

gulp.task('precompile-jasmine-node', [
  'precompile-jasmine-node-src',
  'precompile-jasmine-node-externs'
]);

gulp.task('compile-jasmine-node', ['precompile-jasmine-node'], function(cb) {
  return gulp.src(paths.dist + 'genotet-jasmine-node.js')
    .pipe(closureCompiler({
      compilerPath: compilerPath,
      fileName: 'genotet-jasmine-node.js',
      compilerFlags: {
        jscomp_error: jscompErrors,
        jscomp_warning: jscompWarnings,
        externs: paths.dist + 'genotet-jasmine-node-externs.js'
      }
    }).on('error', function(err) {
      del([
        'genotet-jasmine-node.js'
      ]);
      cb(err);
    }));
});

gulp.task('compile-all', function(cb) {
  runSequence('compile-qunit', 'compile-jasmine-node', 'compile-server', cb);
});
