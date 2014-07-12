var gulp = require('gulp');
var plugins = require('gulp-load-plugins')();

var runSequence = require('run-sequence');

var browserSync = require('browser-sync');

require('gulp-grunt')(gulp); // add all the gruntfile tasks to gulp



// Tasks
gulp.task('clean', function () {
    return gulp.src('./build', {read: false})
        .pipe(plugins.clean());
});

gulp.task('copy', function () {
    return gulp.src('./assets/**/*.*')
        .pipe(gulp.dest('./build/assets'));
});

gulp.task('less', function () {
    return gulp.src('./build/assets/css/main.less')
        .pipe(plugins.less())
        .pipe(gulp.dest('./build/assets/css'));
});

gulp.task('cssmin', function () {
    gulp.src(['./build/assets/css/**/*.css','!./build/assets/css**/*-sprited.css'])
        .pipe(plugins.cssmin())
        .pipe(gulp.dest('./build/assets/css'));
});

gulp.task('htmlmin', function () {
    gulp.src(['./index.src.html'])
        .pipe(plugins.htmlmin({
                removeComments: true,
                collapseWhitespace: true
            }))
        .pipe(plugins.rename("index.html"))
        .pipe(gulp.dest('./'))
});



// Dev tasks
gulp.task('watch-task', function () {
    gulp.watch('./assets/css/**/*.less', function (event) {
        runSequence('copy', 'less')
    });

    gulp.watch('./index.src.html', ['htmlmin']);
});

gulp.task('serve', function () {
    browserSync.init(null, {
        server: {
            baseDir: ['./']
        },
        notify: false
    });

    gulp.start(['watch']);
});

gulp.task('abstract', function () {
    gulp.src(['./assets/css/main.less'])
        .pipe(plugins.less())
        .pipe(plugins.cssmin())
        .pipe(plugins.duration('bulding css'))
        .pipe(gulp.dest('./gulp'));
});


// Task groups
gulp.task('default', function () {
    runSequence('clean', 'copy', 'less','htmlmin');
});

gulp.task('watch', ['default','watch-task']);

gulp.task('build', function () {
    runSequence('copy', 'less', 'grunt-sprite', 'cssmin', 'grunt-webpcss:main');

    gulp.start(['grunt-cwebp:main','htmlmin']);
});
