var pkg = require('./package.json'),
	del = require('del'),
	gulp = require('gulp'),
	autoprefixer = require('gulp-autoprefixer'),
	bless = require('gulp-bless'),
	cached = require('gulp-cached'),
	concat = require('gulp-concat'),
	copy = require('gulp-copy'),
	eslint = require('gulp-eslint'),
	notify = require('gulp-notify'),
	plumber = require('gulp-plumber'),
	sass = require('gulp-sass'),
	scssLint = require('gulp-scss-lint'),
	sourcemaps = require('gulp-sourcemaps'),
	uglify = require('gulp-uglify'),
	gUtil = require('gulp-util'),
	es = require('event-stream'),
	jekyll = require('gulp-jekyll');

// helper functions
function onError(err) {
	gUtil.log('\n', gUtil.colors.bold(gUtil.colors.red('Error ocurred: ') + err.message + ' @ ' + err.fileName + ':' + err.lineNumber), '\n');
	gUtil.beep();
	this.emit('end');
}

function getArgument(key) {
	return gUtil.env[key] ? gUtil.env[key] : null;
}

// clean folders
gulp.task('clean', function(cb) {
	del(pkg.clean, {
		'force': true
	}, function(error) {
		cb(error);
	});
});

//  Images
gulp.task('imgbuild', function() {
	return gulp.src(pkg.img.src)
		.pipe(copy(pkg.img.dest, {
			'prefix': 1
		})) // needs to be copy, not just ".dest" as mac often throws errors when the folder doesn't exist
		.pipe(notify({
			'message': 'IMG build complete',
			'onLast': true // otherwise the notify will be fired for each file in the pipe
		}));
});

// CSS
gulp.task('scsslint', function() {
	return gulp.src(pkg.sass.hint.src)
		.pipe(cached('scssLint'))
		.pipe(scssLint());
});

gulp.task('sass', ['scsslint'], function() {
	gulp.start('sassbuild');
});

gulp.task('sassbuild', function() {
	var sassoutputArg = getArgument('sassoutput');

	return es.merge(pkg.sass.files.map(function(o) {
		return gulp.src(o.src)
			.pipe(plumber({
				'errorHandler': onError
			}))

			// .pipe(plugins.sourcemaps.init()) // can't get them to work in conjunction with bless
			.pipe(sass({
				'outputStyle': sassoutputArg === null || ['nested', 'expanded', 'compact', 'compressed'].indexOf(sassoutputArg) < 0 ? 'expanded' : sassoutputArg
			}))
			.pipe(autoprefixer({
				'browsers': pkg.sass.autoprefixer.browsers
			}))

			// .pipe(plugins.sourcemaps.write('maps')) // can't get them to work in conjunction with bless
			.pipe(bless())
			.pipe(gulp.dest(o.dest))
			.pipe(notify({
				'message': 'SASS: ' + o.file + ' build complete',
				'onLast': true // otherwise the notify will be fired for each file in the pipe
			}));
	}));
});

gulp.task('default',['clean'], function() {
  // place code for your default task here
  gulp.start('imgbuild');
  gulp.start('sassbuild');

  // watch
  gulp.watch(pkg.img.watch, ['imgbuild']);
  gulp.watch(pkg.sass.watch, ['sass']);
});
