module.exports = function(grunt) {

  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks("grunt-image-embed");
  grunt.loadNpmTasks('grunt-contrib-cssmin');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-yuidoc');
  grunt.loadNpmTasks('grunt-contrib-commands');

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    yuidoc: {
      compile: {
        name: '<%= pkg.name %>',
        description: '<%= pkg.description %>',
        version: '<%= pkg.version %>',
        url: '<%= pkg.homepage %>',
        options: {
          paths: 'src',
          outdir: 'dist/<%= pkg.version %>/docs/'
        }
      }
    },
    concat: {
      options: {
        separator: ''
      },
      dist: {
        src: [
        'src/BlingPoint.Loader.js',
        'src/BlingPoint.Log.js',
        'src/BlingPoint.Global.js',
        'src/BlingPoint.Framework.js',
        'src/BlingPoint.Security.js',
        'src/BlingPoint.Ui.js',
        'src/BlingPoint.PlugIns.js',
        'src/BlingPoint.Parameters.js',
        'src/BlingPoint.schema.js'
        ],
        dest: 'dist/<%= pkg.version %>/<%= pkg.name %>.js'
      }
    },
    copy: {
      main: {
        files: [
           {expand: true, cwd: 'src/BlackbirdJs/', src: ['**'], dest: 'dist/<%= pkg.version %>/BlackbirdJs'} // makes all src relative to cwd
          ]
      }
    },
    uglify: {
      options: {
        banner: '/*! <%= pkg.name %> <%= grunt.template.today("dd-mm-yyyy") %> */\n'
      },
      dist: {
        files: {
          'dist/<%= pkg.version %>/<%= pkg.name %>.min.js': ['<%= concat.dist.dest %>']
        }
      }
    },
    imageEmbed: {
      dist: {
        src: [ "src/BlackbirdJs/blackbird.css" ],
        dest: "dist/<%= pkg.version %>/BlackbirdJs/blackbird.css",
        options: {
          deleteAfterEncoding : false
        }
      }
    },
    cssmin: {
      add_banner: {
        options: {
          banner: '/* Minified css file */'
        },
        files: {
          'src/BlackbirdJs/blackbird.min.css': ['src/BlackbirdJs/blackbird.css']
        }
      }
    },
    jshint: {
      files: ['gruntfile.js',
        'src/BlingPoint.Loader.js',
        'src/BlingPoint.Global.js',
        'src/BlingPoint.Framework.js',
        'src/BlingPoint.Security.js',
        'src/BlingPoint.Ui.js',
        'src/BlingPoint.PlugIns.js',
        'src/BlingPoint.Parameters.js',
        'src/BlingPoint.schema.js'
        ],
      options: {
        // options here to override JSHint defaults
        globals: {
          jQuery: true,
          console: true,
          module: true,
          document: true
        }
      }
    },
    command: {
        bat_1: {
            type: 'bat',
            cmd: 'FtpUpload.bat',
            arg: []
        }
    },
    watch: {
      files: ['<%= jshint.files %>'],
      tasks: ['jshint', 'concat', 'uglify', 'cssmin', 'copy']
    }
  });

  grunt.registerTask('test', ['jshint']);
  grunt.registerTask('build', ['jshint', 'concat', 'uglify', 'cssmin', 'copy', 'yuidoc']);
  grunt.registerTask('dev', ['watch']);
  grunt.registerTask('default', ['jshint', 'concat', 'uglify', 'imageEmbed', 'cssmin']);

};