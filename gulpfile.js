/**
 * Copyright © 2018 Nfourteen. All rights reserved.
 */

const gulp = require('gulp');

const $ = require('gulp-load-plugins')({
    pattern: ['*'],
    scope: ['devDependencies'],
    lazy: true
});

const browserSync = $.browserSync.create();

const onError = (error) => {
    console.log(error);
};

//
// Tasks
//
gulp.task('serve', function () {
    browserSync.init({
        server: {
            baseDir: "./"
        }
    });
});

gulp.task('default', ['serve']);

