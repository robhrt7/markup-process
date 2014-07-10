var gulp = require('gulp');
var plugins = require('gulp-load-plugins')();

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
        }
    });

    // Dev tasks
    grunt.registerTask('default', ['clean-build','newer:copy:main', 'less:main']);
    grunt.registerTask('watch-css', ['default', 'watch:css']);

    grunt.registerTask('serve', 'running a dev server', function(){
        grunt.task.run('connect:main:keepalive');
    });

    // Production build
    grunt.registerTask('build', ['newer:copy:main', 'less:main', 'sprite', 'cssmin:main', 'newer:cwebp:main', 'newer:htmlmin:main', 'webpcss:main']);
        grunt.registerTask('build-conc', ['newer:copy:main', 'less:main', 'sprite', 'concurrent:target1', 'webpcss:main']);

    // Misc
    grunt.registerTask('sprite', ['smartsprites:main', 'copy:sprited']);
    grunt.registerTask('clean-build', ['clean:build']);
};