var gulp = require("gulp");
var pug = require("gulp-pug");
var stylus = require("gulp-stylus");
var postcss = require("gulp-postcss");
var autoprefixer = require("autoprefixer");
var cssnano = require("cssnano");
var babel = require("gulp-babel");
var plumber = require("gulp-plumber");
var minify = require("gulp-minify");
var browserSync = require("browser-sync").create();

gulp.task("build", ["stylus", "scripts", "pug-build"]);

gulp.task("dev", ["stylus", "scripts", "pug"], function () {
  browserSync.init({
    server: {
      baseDir: "./dist",
      serveStaticOptions: {
        extensions: ["html"]
      }
    }
  });
  gulp.watch("src/css/**/*.styl", ["stylus"]);
  gulp.watch("src/js/**/*.js", ["scripts"]);
  gulp.watch("src/pug/**/*.pug", ["pug"]);
  gulp.watch("dist/**/*.html").on("change", browserSync.reload);
  gulp.watch("dist/**/*.js", ["pug"]);
});

gulp.task("pug", function () {
  return gulp
    .src(["src/pug/**/*.pug", "!src/pug/_partials/**/*.pug"])
    .pipe(plumber())
    .pipe(pug())
    .pipe(gulp.dest("dist"));
});

gulp.task("pug-build", function () {
  return gulp
    .src("src/pug/*.pug")
    .pipe(plumber())
    .pipe(pug())
    .pipe(gulp.dest("dist"));
});

gulp.task("compile-scripts", function () {
  return gulp
    .src("src/js/**/*.js")
    .pipe(plumber())
    .pipe(
      babel({
        presets: ["env"]
      })
    )
    .pipe(
      minify({
        noSource: true,
        ext: {
          min: ".min.js"
        }
      })
    )
    .pipe(gulp.dest("dist/js"));
});

gulp.task("scripts", ["compile-scripts"], function () {
  browserSync.reload({ stream: true });
});

gulp.task("stylus", function () {
  var plugins = [
    autoprefixer({ browsers: ["last 3 versions"] }),
    cssnano({ discardUnused: false })
  ];
  return gulp
    .src("src/css/style.styl")
    .pipe(plumber())
    .pipe(stylus())
    .pipe(postcss(plugins))
    .pipe(gulp.dest("dist/css"))
    .pipe(browserSync.reload({ stream: true }));
});

gulp.task("default", ["dev"]);
