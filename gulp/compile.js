// Compile the sources using closure-compiler.
var gulp = require('gulp');
var del = require('del');
var closureCompiler = require('gulp-closure-compiler');
var replace = require('gulp-replace-task');
var concat = require('gulp-concat');

var paths = require('./paths.js');

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
  closureContrib + 'nodejs/*.js',
  'server/externs/*.js'
];

var compile = function(cb, src) {
  return gulp.src(src)
    .pipe(closureCompiler({
      compilerPath: 'node_modules/google-closure-compiler/compiler.jar',
      fileName: 'genotet.js',
      compilerFlags: {
        jscomp_error: [
          'checkVars',
          'duplicate',
          'undefinedVars'
        ],
        jscomp_warning: [
          'checkTypes',
          'globalThis',
          'missingProperties',
          'undefinedNames'
        ],
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

// Below are virtual compilations, without producing output source file.

gulp.task('compile-dev', function(cb) {
  return compile(cb, paths.src);
});

// Concats the server code and removes requires.
gulp.task('precompile-server-src', function() {
  return gulp.src(paths.server)
    .pipe(replace({
      patterns: [
        {match: /var\s[a-zA-Z]+\s=\srequire\('.*'\);/g, replacement: ''},
        {match: /module\.exports\s=.*;/g, replacement: ''}
      ]
    }))
    .pipe(concat('genotet-server.js'))
    .pipe(gulp.dest(paths.dist));
});

// Concats the server externs and removes requires.
gulp.task('precompile-server-externs', function() {
  return gulp.src(serverExterns)
    .pipe(replace({
      patterns: [
        {match: /var\s[_a-zA-Z]+\s=\srequire\('.*'\);/g, replacement: ''},
        {match: /module\.exports\s=.*;/g, replacement: ''}
      ]
    }))
    .pipe(concat('genotet-server-externs.js'))
    .pipe(gulp.dest(paths.dist));
});

gulp.task('precompile-server', [
  'precompile-server-src',
  'precompile-server-externs'
]);

gulp.task('compile-server', ['precompile-server'], function(cb) {
  return gulp.src(paths.dist + 'genotet-server.js')
    .pipe(closureCompiler({
      compilerPath: 'node_modules/google-closure-compiler/compiler.jar',
      fileName: 'genotet-server.js',
      compilerFlags: {
        jscomp_error: [
          'checkVars',
          'duplicate',
          'undefinedVars'
        ],
        jscomp_warning: [
          'checkTypes',
          'globalThis',
          'missingProperties',
          'undefinedNames'
        ],
        externs: 'dist/genotet-server-externs.js',
        output_wrapper: [
          'var fs = require("fs");\n',
          'var buffer = require("buffer");\n',
          'var Buffer = buffer.Buffer;\n',
          'var childProcess = require("child_process");\n',
          'var readline = require("readline");\n',
          'var mkdirp = require("mkdirp");\n',
          'var multer = require("multer");\n',
          '%output%'
        ]
      }
    }).on('error', function(err) {
       del([
         'genotet-server.js'
       ]);
      cb(err);
    }));
});

gulp.task('compile-jasmine-node', function(cb) {
  return compile(cb, paths.jasmineNodeTests);
});
