/*global module:false*/
module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: '<json:package.json>',
    meta: {
		banner: '/*!\n' +
		' * pbMvc JavaScript MVC v<%= pkg.version %>\n' +
		' * https://github.com/Saartje87/pbMvc\n' +
		' *\n' +
		' * Copyright <%= grunt.template.today("yyyy") %> <%= pkg.author.name %>\n' +
        ' * Licensed <%= pkg.license %>\n' +
		' *\n' +
		' * Build date <%= grunt.template.today("yyyy-mm-dd HH:mm") %>\n' +
		' */'
    },
	concat: {
		dist: {
			src: ['<banner>', 'src/intro.js',
				'src/request.js', 'src/route.js', 'src/model.js', 'src/collection.js',
				'src/view.js', 'src/controller.js', 'src/history.js',
				'src/outro.js'],
			dest: 'dist/pbmvc.js'
		}
	},
	min: {
      dist: {	
		src: [ "<banner>", "dist/pbmvc.js" ],
		dest: "dist/pbmvc.min.js"
    //    src: ['<banner:meta.banner>', '<config:concat.dist.dest>'],
     //   dest: 'dist/<%= pkg.name %>.min.js'
      }
    },
    lint: {
		grunt: "grunt.js"

// How does this work >< it does lint before concating the files..
//		dist: "dist/pbjs.js"
//		['src/*.js'],
//		dist: "dist/pbjs.js",
//		grunt: "grunt.js"
//		tests: "test/unit/**/*.js"
	},
    // concat: {
    //   dist: {
    //     src: ['<banner:meta.banner>', '<file_strip_banner:src/<%= pkg.name %>.js>'],
    //     dest: 'dist/<%= pkg.name %>.js'
    //   }
    // },
    watch: {
      files: '<config:lint.files>',
      tasks: 'lint qunit'
    },
    jshint: {
      options: {
        curly: true,
        eqeqeq: true,
        immed: true,
        latedef: true,
        newcap: true,
        noarg: true,
        sub: true,
        undef: true,
        boss: true,
        eqnull: true,
        browser: true
      },
      globals: {}
    },
    uglify: {}
  });

  // Default task.
  grunt.registerTask('default', 'lint concat min');

};
