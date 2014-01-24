module.exports = function(grunt) {

    // Tasks
    grunt.initConfig({

        less: {
            main: {
                files: {
                    "css/main.css": "css/less/main.less"
                }
            }
        },

        watch: {
            main: {
                files: 'css/less/**/*.less',
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