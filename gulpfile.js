'use strict';

var sh           = require('shelljs');
var gulp         = require('gulp');
var debug        = require('gulp-debug');
var gutil        = require('gulp-util');
var bower        = require('bower');
var concat       = require('gulp-concat');
var sass         = require('gulp-sass');
var postcss      = require('gulp-postcss');
var autoprefixer = require('gulp-autoprefixer');
var sourcemaps   = require('gulp-sourcemaps');
var cssnano      = require('gulp-cssnano');
var rename       = require('gulp-rename');
var ngAnnotate   = require('gulp-ng-annotate');
var uglify       = require('gulp-uglify');
var html2js      = require('gulp-html2js');
var domSrc       = require('gulp-dom-src');
var cheerio      = require('gulp-cheerio');
var runSequence  = require('run-sequence').use(gulp);
var flatten      = require('gulp-flatten');
var replace      = require('gulp-replace');
var prettify     = require('gulp-prettify');

var paths = {
    html:  './dev/app/**/*.html',
    sass:  ['./scss/**/*.scss', './dev/app/**/*.scss'],
    js:    './dev/app/**/*.js',
    build: './dev/build'
};

function unexplorer(css) {
    css.walkDecls(function(decl) {
        if (decl.prop.indexOf('-ms-') !== -1) {
            decl.remove();
        }

        if (decl.value.indexOf('-ms-') !== -1) {
            decl.remove();
        }
    });
}

function minifyIfNeeded() {
    return gutil.env.env === 'production' ? uglify() : gutil.noop();
}

gulp.task('default', ['copy-resources', 'css', 'js', 'indexHtml']);

gulp.task('copy-resources', ['fonts', 'images']);

gulp.task('images', function() {
    return gulp.src('./dev/img/**/*.{tif,tiff,gif,jpeg,jpg,png}')
        .pipe(flatten())
        .pipe(gulp.dest('./www/img'));
});

gulp.task('fonts', function() {
    return gulp.src('./dev/lib/**/fonts/**/*.{ttf,woff,woff2,eot,svg}')
        .pipe(flatten())
        .pipe(gulp.dest('./www/fonts'));
});

gulp.task('css', function(done) {
    runSequence('sass', 'full-app-css', done);
});

gulp.task('sass', function(done) {
    gulp.src('./scss/ionic.app.scss')

    //.pipe(sourcemaps.init())
    .pipe(debug({
        title: 'unicorn:',
        minimal: false
    }))
    .pipe(sass().on('error', sass.logError))
    .pipe(autoprefixer({
        browsers: [
            'Android > 1%',
            'ChromeAndroid > 1%',
            'last 2 Chrome versions',
            'iOS 8',
            'last 2 Safari versions',
            'Firefox ESR',
            'ie > 11'
        ],
        cascade: false
    }))
    .pipe(postcss([
        unexplorer
    ]))

    //.pipe(gulp.dest(paths.build))
    //.pipe(cssnano())
    //.pipe(rename({
    //    extname: '.min.css'
    //}))
    //.pipe(sourcemaps.write('.'))

    .pipe(gulp.dest(paths.build))
    .on('end', done);
});

gulp.task('full-app-css', function(done) {
    return domSrc({
        file:      './dev/index.html',
        selector:  'link',
        attribute: 'href'
    })
    /*.pipe(sourcemaps.init({
        loadMaps: true
    }))*/
    .pipe(concat('app.full.min.css'))
    .pipe(replace(/url\((['"]?)([^\'\):]+?)(\/[^\/]+?\.(ttf|woff|woff2|eot|svg))(.*?)\1\)/g, 'url($1../fonts$3$1)'))
    .pipe(replace(/url\((['"]?)([^\'\):]+?)(\/[^\/]+?\.(png|tiff|tif|jpg|jpeg|gif))(.*?)\1\)/g, 'url($1../img$3$1)'))

    //.pipe(cssnano())
    //.pipe(sourcemaps.write('.'))
    .pipe(gulp.dest('./www/css/'));

    //.on('end', done);
});

gulp.task('js', function() {
    runSequence('html2js', 'dev-js', 'full-app-js');
});

//puts html templates in cache
gulp.task('html2js', function(done) {
    gulp.src(paths.html)
        .pipe(html2js({
            base:             'dev',
            outputModuleName: 'served.templates',
            useStrict:        false
        }))
        .pipe(concat('templates.js'))
        .pipe(replace(/img src=\\(['"])([^\'\):]+?)(\/[^\/]+?\.(png|tiff|tif|jpg|jpeg|gif))\\(\1)/g, 'img src=\\$1img$3\\$1'))  //change local urls
        .pipe(gulp.dest(paths.build))
        .on('end', done);
});

//concat and min the dev app
gulp.task('dev-js', function(done) {
    gulp.src([
        './dev/build/templates.js',
        './dev/app/*module*.js',
        './dev/app/**/*.js'
    ])

    //.pipe(sourcemaps.init())
    .pipe(concat('all.min.js'))
    .pipe(ngAnnotate({
        add: true,
        single_quotes: true
    }))

    //.pipe(sourcemaps.write('.'))
    .pipe(gulp.dest('./dev/build/'))
    .on('end', done);
});

//concat and build the app together with only the needed libs
gulp.task('full-app-js', function(done) {
    return domSrc({
        file:'./dev/index.html',
        selector:'script',
        attribute:'src'
    })
    /*.pipe(sourcemaps.init({
        loadMaps: true
    }))*/
    .pipe(concat('app.full.min.js'))

    //.pipe(uglify())
    //.pipe(sourcemaps.write('.'))
    .pipe(gulp.dest('./www/js/'))
    ;
});

//changes the html to fetch only the build full-app
gulp.task('indexHtml', function() {
    return gulp.src('./dev/index.html')
        .pipe(cheerio({
            run: function($, file, done) {
                $('script').remove();
                $('link').remove();

                //remeber to change at some point
                $('head').append('<script src="//maps.googleapis.com/maps/api/js?key=AIzaSyCyx-9mDoE78oFhcBL_caSzyypwi3zww5w&sensor=false"><\/script>');
                $('head').append('<link rel="stylesheet" href="css/app.full.min.css" \/>');

                //manualy add js like cordova before app.full.min.js
                $('body').append('<script src="cordova.js"></script>\n<script src="js/app.full.min.js"></script>');
                done();
            },

            parserOptions: {
                decodeEntities: false
            }
        }))
        .pipe(prettify({
            indent_size: 4
        }))
        .pipe(gulp.dest('./www/'));
});

gulp.task('watch', function() {
    gulp.watch(paths.html, ['js']);
    gulp.watch(paths.sass, ['css']);
    gulp.watch(paths.js, ['js']);
    gulp.watch('./dev/index.html', ['full-app-js', 'indexHtml']); //if smth is not working set to default task
});

gulp.task('install', ['git-check'], function() {
    return bower.commands.install()
        .on('log', function(data) {
        gutil.log('bower', gutil.colors.cyan(data.id), data.message);
    });
});

gulp.task('prerequisites-check', function(done) {
    if (!sh.which('git')) {
        console.log(
            '  ' + gutil.colors.red('Git is not installed.'),
            '\n  Git, the version control system, is required to download Ionic.',
            '\n  Download git here:', gutil.colors.cyan('http://git-scm.com/downloads') + '.',
            '\n  Once git is installed, run \'' + gutil.colors.cyan('gulp install') + '\' again.'
        );
        process.exit(1);
    }

    if (sh.which('java')) {
        console.log(
            '  ' + gutil.colors.red('Java is not installed.'),
            '\n  Download Java here:', gutil.colors.cyan('http://www.oracle.com/technetwork/java/javase/downloads/jdk7-downloads-1880260.html') + '.'
        );
        process.exit(1);
    }

    done();
});
