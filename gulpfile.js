var gulp = require('gulp');
var $ = require('gulp-load-plugins')();

// Plugin to include HTML files
var include = require('gulp-html-tag-include');

// PostCSS Plugins
var cssnext = require('postcss-cssnext');
var precss = require('precss');
var assets  = require('postcss-assets');
var cssnano = require('cssnano')({autoprefixer: false, zindex: false});
var browserReporter = require('postcss-browser-reporter');
var reporter = require('postcss-reporter');

// JS Plugins
var browserify = require('browserify');
var babelify = require('babelify');
var buffer = require('vinyl-buffer');
var source = require('vinyl-source-stream');

// Plugin to clean public folder
var del = require('del');

// Plugin to chain Gulp tasks
var runSequence = require('run-sequence');

// Plugin to deploy on Github Pages
var ghPages = require('gulp-gh-pages');

// Plugin to create a static server
var browserSync = require('browser-sync').create();

gulp.task('default', ['watch']);

// Load your CSS node_modules here
gulp.task('modules-css', function(){
  return gulp.src([])
  .pipe(gulp.dest('./public/assets/stylesheets'));
});

// Load your JS node_modules here
gulp.task('modules-js', function(){
  return gulp.src([])
  .pipe(gulp.dest("./public/assets/js"));
});

gulp.task('modules', function(callback) {
  runSequence('modules-js', 'modules-css', callback);
});

// CSS tasks
gulp.task('css', function() {
  var processors = [precss, cssnext, assets({
    basePath: 'public/',
    loadPaths: ['assets/images/**']
  }), cssnano, browserReporter, reporter];
  return gulp.src('./source/css/style.css')
  .pipe($.sourcemaps.init())
  .pipe($.postcss(processors))
  .pipe($.sourcemaps.write('.'))
  .pipe(gulp.dest('./public/assets/stylesheets'))
  .pipe(browserSync.stream());
});

gulp.task('css:deploy', function() {
  var processors = [precss, cssnext, assets({
    basePath: 'public/',
    baseUrl: '', // Write your Github URL here
    loadPaths: ['assets/images/**']
  }), cssnano, browserReporter, reporter];
  return gulp.src('./source/css/style.css')
  .pipe($.sourcemaps.init())
  .pipe($.postcss(processors))
  .pipe($.sourcemaps.write('.'))
  .pipe(gulp.dest('./public/assets/stylesheets'));
});

// JS tasks
gulp.task('js', function() {
  var bundler = browserify({
    entries: 'source/js/app.js',
    debug: true
  });
  bundler
  .transform(babelify, {presets: ['es2015']})
  .bundle()
  .on('error', function(err) {
    console.error(err);
  })
  .pipe(source('app.js'))
  .pipe(buffer())
  .pipe($.sourcemaps.init({loadMaps: true}))
  .pipe($.uglify())
  .pipe($.sourcemaps.write('.'))
  .pipe(gulp.dest('./public/assets/js'))
  .pipe(browserSync.stream());
});

gulp.task('js:deploy', function() {
  var bundler = browserify({
    entries: 'source/js/app.js',
    debug: true
  });
  bundler
  .transform(babelify, {presets: ['es2015']})
  .bundle()
  .on('error', function(err) {
    console.error(err);
  })
  .pipe(source('app.js'))
  .pipe(buffer())
  .pipe($.sourcemaps.init({loadMaps: true}))
  .pipe($.uglify())
  .pipe($.sourcemaps.write('.'))
  .pipe(gulp.dest('./public/assets/js'));
});

// Fonts task
gulp.task('fonts', function(){
  return gulp.src(['source/fonts/**/*.+(eot|svg|ttf|woff|woff2)'])
  .pipe(gulp.dest('./public/assets/fonts'))
});

// Images task
gulp.task('images', function(){
  return gulp.src('source/images/**/*.+(png|jpg|gif|svg)')
  .pipe($.cache($.imagemin({
    interlaced: true
  })))
  .pipe(gulp.dest('./public/assets/images'))
});

// Favicon task
gulp.task('favicon', function(){
  return gulp.src('source/favicon/**')
  .pipe(gulp.dest('./public/assets/favicon'))
});

// HTML tasks
gulp.task('html', function(){
  return gulp.src('./source/*.html')
  .pipe(include())
  .pipe(gulp.dest('./public'))
  .pipe(browserSync.stream());
});

gulp.task('html:deploy', function(){
  return gulp.src('./source/*.html')
  .pipe(include())
  .pipe($.replace('href="/', 'href="/name-of-your-repository/')) // Write your Github repository name here
  .pipe(gulp.dest('./public'))
});

// Watch task
gulp.task('watch', function() {
  gulp.watch('source/css/**/*.css', ['css']);
  gulp.watch('source/js/**/*.js', ['js']);
  gulp.watch('source/images/**/*.+(png|jpg|gif|svg)', ['images']);
  gulp.watch('source/fonts/**/*.+(eot|svg|ttf|woff|woff2)', ['fonts']);
  gulp.watch('source/**/*.html', ['html']);
});

// Static server
gulp.task('serve', ['watch'], function() {
  browserSync.init({
    server: {
      baseDir: "./public"
    }
  });
});

// Clean task
gulp.task('clean:public', function() {
  return del.sync('./public');
});

// Build tasks
gulp.task('build', function(callback) {
  runSequence('clean:public', 'modules', 'images', 'favicon', 'fonts', 'js', 'css', 'html', callback);
});

gulp.task('build:deploy', function(callback) {
  runSequence('clean:public', 'modules', 'images', 'favicon', 'fonts', 'js:deploy', 'css:deploy', 'html:deploy', callback);
});

// Deploy task
gulp.task('deploy', ['build:deploy'], function() {
  return gulp.src('./public/**/*')
  .pipe(ghPages());
});
