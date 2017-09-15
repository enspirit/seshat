'use strict';

const jscs = require('gulp-jscs');
const jshint = require('gulp-jshint');
const istanbul = require('gulp-istanbul');
const server = require('gulp-express');
const mocha = require('gulp-mocha');
const env = require('gulp-env');
const gulp = require('gulp');

let watching = false;
function handleError(err) {
  console.error(err.message);
  if (watching) {
    this.emit('end');
  } else {
    process.exit(1);
  }
}

//
const paths = {
  src: ['app.js', 'middlewares/**/*.js', 'routes/*.js', 'lib/**/*.js', 'routes/**/*.js'],
  tests: ['tests/**/*.js']
};

// JSCS is a code style linter and formatter for your style guide
gulp.task('jscs', () => {
  return gulp.src([...paths.src, ...paths.tests])
    .pipe(jscs())
    .pipe(jscs.reporter())
    .pipe(jscs.reporter('fail'));
});

// JSHint is a tool to detect errors and potential problems in JS code
gulp.task('jshint', () => {
  return gulp.src([...paths.src, ...paths.tests])
    .pipe(jshint())
    .pipe(jshint.reporter())
    .pipe(jshint.reporter('fail'));
});

// We use istanbul to gather coverage information
gulp.task('pre-mocha', () => {
  return gulp.src(paths.src)
    .pipe(istanbul())
    .pipe(istanbul.hookRequire());
});

// Mocha is a test framework, this task will run our unit tests
gulp.task('mocha', ['pre-mocha'], () => {
  // Set ENVIRONMENT variables
  const envs = env.set({
    NODE_ENV: 'test'
  });
  return gulp.src(paths.tests)
    .pipe(envs)
    .pipe(mocha())
    .on('error', handleError)
    .pipe(istanbul.writeReports())
    // Enforce a coverage of at least 90%
    .pipe(istanbul.enforceThresholds({thresholds: {global: 90}}));
});

// Rerun all tasks when code/tests changes
gulp.task('watch', () => {
  watching = true;
  gulp.start('server');
  return gulp.watch([...paths.src, ...paths.tests], ['mocha', server.run]);
});

// Run the express app
gulp.task('server', () => {
  return server.run(['bin/www'], {}, false);
});

// Run all tests
gulp.task('test', ['mocha']);

gulp.task('default', ['jscs', 'jshint', 'test']);
