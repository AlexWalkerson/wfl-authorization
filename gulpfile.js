'use strict';

/* Configuration */
const phpEnabled = true;
const appDir = './';
const serverUrl = 'http://my.app';	

const	gulp 					= require('gulp'),
			rename 				= require("gulp-rename"),
			browserSync 	= require('browser-sync').create(),
			autoprefixer 	= require('gulp-autoprefixer'),
			cleanCSS 			= require('gulp-clean-css'),
			imagemin 			= require('gulp-imagemin'),
			svgstore 			= require('gulp-svgstore'),
			cheerio 			= require('gulp-cheerio'),
			sass 					= require('gulp-sass'),
			sourcemaps 		= require('gulp-sourcemaps'),
			rigger 				= require('gulp-rigger'),
			jshint 				= require('gulp-jshint'),
			babel 				= require('gulp-babel'),
			uglify 				= require('gulp-uglify'),
			watch 				= require('gulp-watch'),
			del 					= require('del'),
			bower 				= require('gulp-bower');	

let path = {	
	tpl: {
		src: [appDir+'src/**/*.html', '!'+appDir+'src/static-template/**/*.*'],
		build: appDir+'build/',
		srcDir: 'src/',
		buildDir: 'build/',
		watch: [appDir+'src/**/*.html'],
	},
	js: {
		src: appDir+'src/js/*.js',
		srcApp: appDir+'src/js/app.js',
		build: appDir+'build/js/',
		srcDir: 'src/js/',
		buildDir: 'build/js/',
		watch: [appDir+'src/js/**/*.js', '!'+appDir+'src/js/vendor/**/*.*', '!'+appDir+'src/js/vendor.js'],
		vendor: {
			src: appDir+'src/js/vendor.js',
			build: appDir+'build/js/vendor/',
			srcDir: 'src/js/vendor/',
			buildDir: 'build/js/vendor/',
			watch: [appDir+'src/js/vendor/**/*.*'],
		},
	},
	style: {
		src: appDir+'src/scss/*.scss',
		build: appDir+'build/css/',
		srcDir: 'src/scss/',
		buildDir: 'build/css/',
		watch: [appDir+'src/scss/**/*.scss', '!'+appDir+'src/scss/vendor/**/*.*'],
		vendor: {
			src: appDir+'src/scss/vendor/**/*.*',
			build: appDir+'build/css/vendor/',			
			srcDir: 'src/scss/vendor/',
			buildDir: 'build/css/vendor/',
			watch: [appDir+'src/scss/vendor/**/*.*'],
		},
	},
	fonts: {
		src: appDir+'src/fonts/**/*.*',
		build: appDir+'build/fonts/',
		srcDir: 'src/fonts/',
		buildDir: 'build/fonts/',
		watch: [appDir+'src/fonts/**/*.*'],
	},
	img: {
		src: [appDir+'src/img/**/*.*', '!'+appDir+'src/img/sprite_svg/**/*.*'],
		build: appDir+'build/img/',
		srcDir: 'src/img/',
		buildDir: 'build/img/',
		watch: [appDir+'src/img/**/*.*', '!'+appDir+'src/img/sprite_svg/**/*.*'],
	},
	svg: {
		src: appDir+'src/img/sprite_svg/**/*.*',
		build: appDir+'build/img/sprite_svg/',
		srcDir: 'src/img/sprite_svg/',
		buildDir: 'build/img/sprite_svg/',
		watch: [appDir+'src/img/sprite_svg/**/*.*'],
	},
	clean: appDir+'build',

};

// https://browsersync.io/docs/options
let serverConfig = {
	// tunnel: true,	
	browser: "chrome",
	logPrefix: "zZZz"
};

if(phpEnabled){
	serverConfig.proxy = {
    target: serverUrl,
    ws: true // enables websockets
  }
} else {
	serverConfig.server = {
		baseDir: appDir,
		directory: true
	};
}

//Tasks
gulp.task('bower', function() {
  return bower();
});

gulp.task('tpl', function () {
	return gulp.src(path.tpl.src) 
		.pipe(rigger())
		.pipe(gulp.dest(path.tpl.build))
});
gulp.task('tpl-watch', ['tpl'], function (done) {
    browserSync.reload();
    done();
});

//JS Task
gulp.task('js-vendor', function () {   		
	return gulp.src(path.js.vendor.src) 
		.pipe(rigger())
		.on('error', function (err) {
			console.log(err.message);
			this.emit('end');
		})
		.pipe(gulp.dest(path.js.build));
});
gulp.task('js-app', function () { 
	return gulp.src(path.js.srcApp) 
		.pipe(rigger())
		.pipe(sourcemaps.init()) 
		.pipe(babel({
			"presets": [
				[__dirname+'/node_modules/babel-preset-env', {
					"targets": {
						"browsers": ["last 2 versions"],
						"uglify": true,
					},
				}],
			],
		}))
		.on('error', function (err) {
			console.log(err.message);
			this.emit('end');
		})
		.pipe(sourcemaps.write())
		.pipe(gulp.dest(path.js.build));
});

gulp.task('js', ['js-vendor', 'js-app']);

gulp.task('js-watch', function (done) {
	gulp.src(path.js.watch)
		.pipe(jshint({"esversion": 6, "strict": "global", "browser": true, "devel": true}))
		.pipe(jshint.reporter('default'))
		.pipe(sourcemaps.init()) 
		.pipe(rigger())
		.pipe(babel({
			"presets": [
				[__dirname+'/node_modules/babel-preset-env', {
					"targets": {
						"browsers": ["last 2 versions"],
						"uglify": true,
					},
				}],
			],
		}))
		.on('error', function (err) {
			console.log(err.message);
			this.emit('end');
		})
		.pipe(sourcemaps.write())
		.pipe(gulp.dest(path.js.build));

    browserSync.reload();
    done();
});
gulp.task('js-vendor-watch', ['js-vendor'], function (done) {
	browserSync.reload();
	done();
});

gulp.task('js-min', function () {
	gulp.src([path.js.build+'*.js', '!'+path.js.build+'*.min.js'])   
		.pipe(uglify())
		.pipe(rename({ suffix: '.min' }))
		.pipe(gulp.dest(path.js.build));
});

gulp.task('style', function () {
	return gulp.src(path.style.src)
		.pipe(sourcemaps.init())
		.pipe(sass())
		.on('error', function (err) {
            console.log(err.message);
            this.emit('end');
        })
		.pipe(autoprefixer({browsers: ['last 2 versions']}))
		.pipe(sourcemaps.write())
		.pipe(gulp.dest(path.style.build));
});
gulp.task('style-watch', ['style'], function (done) {
    browserSync.reload();
    done();
});
gulp.task('style-min', function () {
	gulp.src([path.style.build+'*.css', '!'+path.style.build+'*.min.css'])
		.pipe(cleanCSS())
		.pipe(rename({ suffix: '.min' }))
		.pipe(gulp.dest(path.style.build));
});

gulp.task('image', function () {
    return gulp.src( path.img.src )
        .pipe(imagemin([
        	imagemin.gifsicle({interlaced: true}),
        	imagemin.jpegtran({progressive: true}),
        	imagemin.optipng({optimizationLevel: 2}),
        	imagemin.svgo({
        		plugins: [
	        		{cleanupAttrs: true},
	        		{removeDoctype: true},
	        		{removeViewBox: true},
        		]
        	}),
        ]))
        .pipe(gulp.dest(path.img.build))
});
gulp.task('image-watch', ['image'], function (done) {
    browserSync.reload();
    done();
});

gulp.task('svg', function () {
	return gulp.src(path.svg.src)
		.pipe(imagemin([
			imagemin.svgo({
				plugins: [
					{cleanupAttrs: true},
					{removeDoctype: true},
					{removeViewBox: true},
				]
			})
		]))
		.pipe(svgstore({
				includeTitleElement: false,
				cleanup: [
					'fill',
				],
			}))
		.pipe(cheerio({
            run: function ($) {
                $('svg').attr('style',  'display:none');
            },
            parserOptions: { xmlMode: true }
        }))
		.pipe(gulp.dest(path.svg.build))

});
gulp.task('svg-watch', ['svg'], function (done) {
    browserSync.reload();
    done();
});

gulp.task('font', function() {
    return gulp.src(path.fonts.src)
        .pipe(gulp.dest(path.fonts.build))
});

gulp.task('vendor', function() {
    gulp.src(path.js.vendor.srcDir+'**/*.*')
        .pipe(gulp.dest(path.js.vendor.buildDir));    
    gulp.src(path.style.vendor.srcDir+'**/*.*')
        .pipe(gulp.dest(path.style.vendor.buildDir));
});

gulp.task('clean', function(){
	del(path.clean);
});

gulp.task('default', [
    'tpl',
    'js',
    'style',
    'image',
    'svg',
    'font',
    'vendor',
]);

gulp.task('prod', ['default'], function(){
	gulp.start('js-min').start('style-min');
});

//Watcher
let watcherFile = {
	del: (ePath, srcPath, buildPath) => {
		let	index = ePath.lastIndexOf(srcPath);

		if(!~index){
			srcPath = srcPath.replace(/\//g,'\\');
			buildPath = buildPath.replace(/\//g,'\\');
			index = ePath.lastIndexOf(srcPath);		
		}		
		
		if(~index){
			let endPath = ePath.slice(index).replace(srcPath, buildPath);
			del(endPath).then(paths => {
				console.log('Deleted:\n', paths.join('\n'));
			});
			return true;
		}
		return false;
	},
	add: (ePath, srcPath, buildPath) => {
		let index = ePath.lastIndexOf('\/');

		if(!~index){
			srcPath = srcPath.replace(/\//g,'\\');
			buildPath = buildPath.replace(/\//g,'\\');
			index = ePath.lastIndexOf('\\');		
		}	

		if(~index){
			let endPath = ePath.slice(0,++index).replace(srcPath, buildPath);
			gulp.src(ePath).pipe(gulp.dest(endPath));
			console.log( `Added:\n${ePath}` );
			return true;
		}	
		return false;
	},
	combinePath: (base, paths) => {
		return paths.map(item => {
			if(item[0] === '!') return '!'+base+item.substring(1);
			return path.serverDir+path.appDir+item;	
		});		
	},
}

gulp.task('watch', function () {
	let log = console.log.bind(console);

	browserSync.init(serverConfig);

	/* Templates */
	watch(path.tpl.watch, { read: false })
	.on('change', () => gulp.start('tpl-watch') )
	.on('error', error => log(`Watcher tpl error: ${error.message}`));


	/* JS */
	watch(path.js.watch, { read: false })
	.on('change', () => gulp.start('js-watch') )
	.on('error', error => log(`Watcher js error: ${error.message}`));

	watch(path.js.vendor.src, { read: false })
	.on('change', () => gulp.start('js-vendor-watch') )
	.on('error', error => log(`Watcher js error: ${error.message}`));

	let watcherJsVendor = watch(path.js.vendor.watch);
	watcherJsVendor.on('change', function(ePath,event){		
		gulp.src(ePath).pipe(gulp.dest(path.js.vendor.buildDir));
		log( `Сhanged:\n${ePath}` );
	});
	watcherJsVendor.on('add', function(ePath,event){
		watcherFile.add(ePath, path.js.vendor.srcDir, path.js.vendor.buildDir) && browserSync.reload();
	});
	watcherJsVendor.on('unlink', function(ePath){
		watcherFile.del(ePath, path.js.vendor.srcDir, path.js.vendor.buildDir) && browserSync.reload();
	});
	watcherJsVendor.on('error', error => log(`Watcher JsV error: ${error.message}`));


   /* Styles */
	watch(path.style.watch, { read: false })
	.on('change', () => gulp.start('style-watch') )
	.on('error', error => log(`Watcher style error: ${error.message}`));


   /* Images */
	watch( path.img.watch, function(event, cb) {
		gulp.start('image-watch');
	})
	.on('error', error => log(`Watcher image error: ${error.message}`));


  /* SVG */
	watch(path.svg.watch, function(event, cb) {
    gulp.start('svg-watch');
  })
  .on('error', error => log(`Watcher svg error: ${error.message}`));


	/* Fonts */
	let watcherFont = watch(path.fonts.watch);
	watcherFont.on('change', function(ePath,event){		
		gulp.src(ePath).pipe(gulp.dest(path.fonts.buildDir));
		log( `Сhanged:\n${ePath}` );
	});
	watcherFont.on('add', function(ePath,event){
		watcherFile.add(ePath, path.fonts.srcDir, path.fonts.buildDir) && browserSync.reload();				
	});
	watcherFont.on('unlink', function(ePath){
		watcherFile.del(ePath, path.fonts.srcDir, path.fonts.buildDir) && browserSync.reload();
	});
	watcherFont.on('error', error => log(`Watcher Font error: ${error.message}`));


	if(phpEnabled){
		watch('../**/*.php', browserSync.reload);		
	}

});
