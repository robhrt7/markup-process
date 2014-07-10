var gulp = require('gulp');
var plugins = require('gulp-load-plugins')();
var ngrok = require('ngrok');

module.exports = function(grunt) {
    // Shows time spent on tasks
//    require('time-grunt')(grunt);

    // Loading all grunt modules base on package.json
    require('load-grunt-tasks')(grunt);

    // Tasks
    grunt.initConfig({
        assets: 'build/assets',

        clean: {
            build: ["build"]
        },

        less: {
            main: {
                files: {
                    "build/assets/css/main.css": "build/assets/css/main.less"
                }
            }
        },

        copy: {
            // making working assets copy
            main: {
                files: [
                    {
                        expand: true,
                        src: [
                            'assets/**/*.*'
                        ],
                        dest: 'build/'
                    }
                ]
            },

            // copying sprited images bask to source — css-sprited.css -> css.css
            sprited: {
                files: [
                    {
                        expand: true,
                        cwd: 'build/assets/css',
                        src: [
                            '**/*-sprited.css'
                        ],
                        dest: 'build/assets/css/',
                        rename: function(destBase, destPath){
                            // renaming copied files
                            return destBase + '/' + destPath.replace('-sprited.css', '.css');
                        }
                    }
                ]
            }
        },

        connect: {
            main: {
                options: {
                    port: 8000,
                    hostname: '*',
                    open: true
                }
            },
            test: {
                options: {
                    port: 8001,
                    hostname: '*'
                }
            }
        },

        smartsprites: {
            main: {
                documentRootDirPath: './',
                rootDirPath: 'build',
                outputDirPath: 'build',
                cssFileSuffix: '-sprited',
                stderr: true
            }
        },

        cwebp: {
            main: {
                options: {
                    ext: '.webp'
                },
                files: [
                    {
                        expand: true,
                        cwd: 'build/assets',
                        src: ['**/*.{png,jpg,gif}'],
                        dest: 'build/assets'
                    }
                ]
            }
        },

        htmlmin: {
            main: {
                options: {
                    removeComments: true,
                    collapseWhitespace: true
                },
                files: {
                    'index.html': 'index.src.html'
                }
            }
        },

        cssmin: {
            main: {
                expand: true,
                cwd: 'build/assets/css',
                src: [
                    '**/*.css',
                    '!**/*-sprited.css'
                ],
                dest: 'build/assets/css'
            }
        },

        webpcss: {
            main: {
                options: {
                    baseClass: '.webp',
                    replace_from: /\.(png|jpg|jpeg)/,
                    replace_to: '.webp'
                },
                files: {
                    'build/assets/css/main.css': ['build/assets/css/main.css']
                }
            }
        },

        watch: {
            css: {
                files: 'assets/css/**/*.less',
                tasks: ['newer:copy:main','less:main'],
                options: {
                    nospawn: true
                }
            }
        },

        concurrent: {
            target1: ['cssmin:main', 'newer:cwebp:main','newer:htmlmin:main']
        },

        // Not used, just for tests
        gulp: {
            css: {
                options: {
                    tasks: function (stream) {
                        return stream.pipe(plugins.less()).pipe(plugins.cssmin());
                    }
                },
                src: ['./assets/css/main.less'],
                dest: './gulp/output.css'
            },
            cssNative: function () {
                return gulp.src(['./assets/css/main.less'])
                        .pipe(plugins.less())
                        .pipe(plugins.cssmin())
                        .pipe(plugins.duration('building css'))
                        .pipe(gulp.dest('./gulp'));
            }
        },

        pagespeed: {
            options: {
                nokey: true,
                url: ''
            },
            desktop: {
                options: {
                    paths: ["/"],
                    locale: "ru_RU",
                    strategy: "desktop",
                    threshold: 80
                }
            },
            mobile: {
                options: {
                    paths: ["/"],
                    locale: "ru_RU",
                    strategy: "mobile",
                    threshold: 80
                }
            }
        }
    });

    // Dev tasks
    grunt.registerTask('default', ['clean-build','newer:copy:main', 'less:main']);
    grunt.registerTask('watch-css', ['default', 'watch:css']);

    grunt.registerTask('serve', 'running a dev server', function(){
        grunt.task.run('connect:main:keepalive');
    });

    grunt.registerTask('serve-web', 'Run ngork proxy', function () {
        var port = grunt.config.get('connect.test.options.port');

        grunt.task.run('connect:test:keepalive');

        ngrok.connect(port, function (err, url) {
            if (err !== null) {
                grunt.fail.fatal(err);
            }

            console.log('Public url: ' + url);
        });
    });

    // Production build
    grunt.registerTask('build', ['newer:copy:main', 'less:main', 'sprite', 'cssmin:main', 'newer:cwebp:main', 'newer:htmlmin:main', 'webpcss:main']);
        grunt.registerTask('build-conc', ['newer:copy:main', 'less:main', 'sprite', 'concurrent:target1', 'webpcss:main']);

    // Misc
    grunt.registerTask('sprite', ['smartsprites:main', 'copy:sprited']);
    grunt.registerTask('clean-build', ['clean:build']);

    // Performance tests
    grunt.registerTask('page-speed', 'Run pagespeed with ngrok', function () {
        var url = grunt.option('url');

        if (url) {
            grunt.config.set('pagespeed.options.url', url);
            grunt.task.run('pagespeed');
        } else {
            var done = this.async();
            var port = grunt.config.get('connect.test.options.port');

            grunt.task.run('connect:test');

            ngrok.connect(port, function (err, url) {
                if (err !== null) {
                    grunt.fail.fatal(err);
                    return done();
                }
                grunt.config.set('pagespeed.options.url', url);
                grunt.task.run('pagespeed');
                done();
            });
        }
    });
};