const {
	src, dest, watch, series, parallel
} = require('gulp');
const browserSync = require('browser-sync').create();
const fileinclude = require('gulp-file-include');
const htmlmin = require('gulp-htmlmin');
const htmlbeautify = require('gulp-html-beautify');
const sass = require('gulp-sass');
const gcmq = require('gulp-group-css-media-queries');
const autoprefixer = require('gulp-autoprefixer');
const cleanCSS = require('gulp-clean-css');
const sourcemaps = require('gulp-sourcemaps');
const imagemin = require('gulp-imagemin');
const newer = require('gulp-newer');
const svgSprite = require('gulp-svg-sprite');
const rename = require('gulp-rename');
const webpackStream = require('webpack-stream');
const uglify = require('gulp-uglify-es').default;
const ttf2woff2 = require('gulp-ttf2woff2');
const del = require('del');

const sourceFolder = 'src/';
const buildFolder = 'docs/';

const path = {
	src: {
		html: [sourceFolder + '*.html', '!' + sourceFolder + '_*.html'],
		css: sourceFolder + 'styles/main.scss',
		js: sourceFolder + 'scripts/index.js',
		images: sourceFolder + 'images/**/*.{jpg,jpeg,png,gif}',
		favicon: sourceFolder + 'images/favicon.ico',
		svg: sourceFolder + 'images/**/*.svg',
		fonts: sourceFolder + 'fonts/*.ttf'
	},
	build: {
		css: buildFolder + 'css',
		js: buildFolder + 'js',
		images: buildFolder + 'images',
		fonts: buildFolder + 'fonts'
	},
	watch: {
		html: sourceFolder + '**/*.html',
		css: sourceFolder + 'styles/**/*.scss',
		js: sourceFolder + 'scripts/**/*.js',
		images: sourceFolder + 'images/**/*.{jpg,jpeg,png,gif,ico}'
	},
	clean: buildFolder,
	cleanMap: buildFolder + '**/*.map'
};

const html = () => {
	return src(path.src.html)
		.pipe(fileinclude())
		.pipe(htmlbeautify())
		.pipe(dest(buildFolder))
		.pipe(browserSync.stream());
};

const minifyHtml = () => {
	return src(path.src.html)
		.pipe(fileinclude())
		.pipe(htmlmin({
			collapseWhitespace: true,
			removeComments: true
		}))
		.pipe(dest(buildFolder));
};

const styles = () => {
	return src(path.src.css)
		.pipe(sourcemaps.init())
		.pipe(sass()).on('error', sass.logError)
		.pipe(gcmq())
		.pipe(autoprefixer({
			overrideBrowserslist: ['last 2 versions']
		}))
		.pipe(cleanCSS())
		.pipe(rename('style.min.css'))
		.pipe(sourcemaps.write('.'))
		.pipe(dest(path.build.css))
		.pipe(browserSync.stream());
};

const scripts = () => {
	return src(path.src.js)
		.pipe(webpackStream({
			mode: 'development',
			devtool: 'inline-source-map',
			optimization: {
				minimize: false
			},
			output: {
				filename: 'bundle.min.js'
			},
			module: {
				rules: [
					{
						test: /\.m?js$/,
						exclude: /(node_modules|bower_components)/,
						use: {
							loader: 'babel-loader',
							options: {
								presets: ['@babel/preset-env']
							}
						}
					}
				]
			}
		}))
		.pipe(sourcemaps.init({ loadMaps: true }))
		.pipe(uglify({
			mangle: false,
			output: {
				beautify: true,
				comments: false
			}
		}))
		.pipe(sourcemaps.write('.'))
		.pipe(dest(path.build.js))
		.pipe(browserSync.stream());
};

const images = () => {
	return src(path.src.images)
		.pipe(newer(path.build.images))
		.pipe(imagemin({
			interlaced: true,
			progressive: true,
			optimizationLevel: 3,
			svgoPlugins: [{ removeViewBox: false }]
		}))
		.pipe(dest(path.build.images));
};

const favicon = () => {
	return src(path.src.favicon)
		.pipe(rename('favicon.ico'))
		.pipe(dest(path.build.images));
};

const svgToSprite = () => {
	return src(path.src.svg)
		.pipe(svgSprite({
			mode: {
				stack: {
					sprite: '../sprite.svg'
				}
			}
		}))
		.pipe(dest(path.build.images));
};

const fonts = () => {
	return src(path.src.fonts)
		.pipe(ttf2woff2())
		.pipe(dest(path.build.fonts))
		.pipe(browserSync.stream());
};

const watchFiles = () => {
	browserSync.init({
		server: {
			baseDir: buildFolder
		},
		notify: false,
		port: 3000
	});

	watch([path.watch.html], html);
	watch([path.watch.css], styles);
	watch([path.watch.js], scripts);
};

const clean = () => {
	return del(path.clean);
};

const cleanMap = () => {
	return del(path.cleanMap);
};

const build = series(clean, parallel(minifyHtml,
	styles, scripts, favicon, images, svgToSprite, fonts), cleanMap);

const dev = series(clean, parallel(html,
	styles, scripts, favicon, images, svgToSprite, fonts, watchFiles));

exports.html = html;
exports.minifyHtml = minifyHtml;
exports.styles = styles;
exports.scripts = scripts;
exports.images = images;
exports.favicon = favicon;
exports.svgToSprite = svgToSprite;
exports.fonts = fonts;
exports.watchFiles = watchFiles;
exports.clean = clean;
exports.cleanMap = cleanMap;
exports.build = build;
exports.default = dev;
