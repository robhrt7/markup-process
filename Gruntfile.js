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
                    open: {
                        target: 'http://localhost:8000/index.src.html'
                    }
                }
            },
            test: {
                options: {
                    port: 8001,
                    hostname: '*'
                }
            },
            process: {
                options: {
                    port: 8002,
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
                    'index.html': 'index.html'
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
            target1: ['cssmin:main', 'newer:cwebp:main','newer:replace:critical','newer:htmlmin:main']
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

        penthouse: {
            extract: {
                outfile: 'build/assets/css/critical.css',
                css: 'build/assets/css/main.css',
                url: 'http://localhost:8001',
                width: 1300,
                height: 900
            }
        },

        replace: {
            critical: {
                options: {
                    patterns: [
                        {
                            match: '<!--{critical-css}-->',
                            replacement: '<style><%= grunt.file.read("build/assets/css/critical.css") %></style>'
                        },
                        {
                            match: '<link href="build/assets/css/main.css" rel="stylesheet">',
                            replacement: ''
                        },
                        {
                            match: '<!--{full-css}-->',
                            replacement: '<link href="build/assets/css/main.css" rel="stylesheet">'
                        }
                    ],
                    usePrefix: false
                },
                files: {
                    'index.html': 'index.src.html'
                }
            }
        },

        pagespeed: {
            options: {
                nokey: true,
                url: 'stub' // replaced in runtime
            },
            desktop: {
                options: {
                    paths: ["/"],
                     locale: "en_GB",
                    strategy: "desktop",
                    threshold: 80
                }
            },
            mobile: {
                options: {
                    paths: ["/"],
                 locale: "en_GB",
                    strategy: "mobile",
                    threshold: 80
                }
            }
        },

        devperf: {
            options: {
                urls: ['http://localhost:8001'],
                resultsFolder: './perf-tests/devperf/',
                openResults:true,
                warnings: [
                    {
                        // Changing the limit and the message
                        variable: "DOMelementsCount",
                        limit: 10,
                        message: "DOM elements number is my big issue so i reduced the limit!"
                    }
                ]
            }
        },

        phantomas: {
            main: {
                options: {
                    output: 'json',
                    indexPath: './perf-tests/phantomas/',
                    options: {
                        'timeout': 30
                    },
                    numberOfRuns: 10,
                    url: 'http://localhost:8001',
                    group: {
                        'TIMINGS': [
                            'timeToFirstByte',
                            'timeToLastByte',
                            'timeToFirstCss',
                            'timeToFirstJs',
                            'timeToFirstImage'
                        ]
                    },
                    assertions: {
                        'DOMelementsCount': 10
                    }
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
    grunt.registerTask('build', ['newer:copy:main', 'less:main', 'sprite', 'cssmin:main', 'newer:cwebp:main', 'newer:replace:critical', 'newer:htmlmin:main', 'webpcss:main','critical-css']);
        grunt.registerTask('build-conc', ['newer:copy:main', 'less:main', 'sprite', 'concurrent:target1', 'webpcss:main']);

    // Misc
    grunt.registerTask('sprite', ['smartsprites:main', 'copy:sprited']);
    grunt.registerTask('clean-build', ['clean:build']);

    grunt.registerTask('critical-css', 'Generating critical CSS', function () {
        grunt.task.run('connect:process');
        grunt.task.run('penthouse');
    });

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

            // run with custom url (arg --url=http://devshelf.us), or generated
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

    grunt.registerTask('perf', 'Run perf tests with devperf', function () {
        grunt.task.run('connect:test');
        grunt.task.run('devperf');
    });

    grunt.registerTask('perf-phantomas', 'Run perf tests with devperf', function () {
        grunt.task.run('connect:test');
        grunt.task.run('phantomas');
    });
};