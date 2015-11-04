module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
  
    pkg: grunt.file.readJSON('package.json'),
    
    uglify: {
      options: {
        banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
      },
      build: {
        src: 'src/<%= pkg.name %>.js',
        dist: 'build/<%= pkg.name %>.min.js'
      }
    },
    
    // https://www.npmjs.com/package/grunt-mocha-test
    mochaTest: {
      test: {
        options: {
          reporter: 'spec',
          captureFile: 'results.txt',
          quiet: false,
          clearRequireCache: false,
        },
        src: ['test/**/*.js']
      }
    },
    
    // https://www.npmjs.com/package/grunt-contrib-uglify
    uglify: {
      options: {
        banner: '/*! <%= pkg.name %> - v<%= pkg.version %> - ' +
          '<%= grunt.template.today("yyyy-mm-dd") %> */',
        sourceMap: true,
      },
      my_target: {
        files: {
          'begin.min.js': ['lib/begin.js'],
          'begin-trace.min.js': ['lib/begin-trace.js']
        },
      }
    },
    
  });

  grunt.loadNpmTasks('grunt-mocha-test');
  grunt.registerTask('default', 'mochaTest');

  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.registerTask('default', ['uglify']);

};

