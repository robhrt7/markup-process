module.exports = function(grunt) {

    // Tasks
    grunt.initConfig({

        less: {
            main: {
                files: {
                    "html/css/main.css": "html/css/less/main.less"
                }
            }
        },

        watch: {
            main: {
                files: 'html/css/less/**/*.less',
                tasks: ['less'],
                options: {
                    nospawn: true
                }
            }
        }

    });

    // Load plugins installed via npm install;
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-less');

    // Default update tasl
    grunt.registerTask('default', ['less']);
};