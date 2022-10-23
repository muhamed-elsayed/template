var gulp = require("gulp"),
    sass = require(`gulp-sass`)(require(`sass`)),
    sync = require("browser-sync"),
    concat = require("gulp-concat"),
    del = require("del"),
    imagemin = require("gulp-imagemin"),
    pngquant = require("imagemin-pngquant"),
    cache = require("gulp-cache"),
    autoprefixer = require("autoprefixer"),
    postcss = require("gulp-postcss"),
    csso = require("gulp-csso"),
    jsmin,
    ghPages,
    include,
    pug;
(pug = require("gulp-pug")),
    (jsmin = require("gulp-jsmin")),
    (ghPages = require("gulp-gh-pages")),
    (include = require("gulp-include"));
const gutil = require(`gulp-util`);

// HTML
gulp.task("html", function () {
    return gulp
        .src(["src/templates/pages/**/*.pug"])
        .pipe(
            pug({
                pretty: gutil.env.dist ? true : false,
                basedir: "src/templates",
            })
        )
        .pipe(gulp.dest("dest"))
        .pipe(sync.stream());
});

// Styles
gulp.task("styles", function () {
    // FIXME
    const out = gulp
        .src(["src/styles/**/*.scss", "!src/styles/**/_*.scss"])
        .pipe(sass())
        .pipe(concat("style.css"))
        .pipe(postcss([autoprefixer({ browsers: "last 2 versions" })]));

    return gutil.env.dist
        ? out.pipe(gulp.dest("dest/styles")).pipe(
              sync.stream({
                  once: true,
              })
          )
        : out
              .pipe(csso())
              .pipe(gulp.dest("dest/styles"))
              .pipe(
                  sync.stream({
                      once: true,
                  })
              );
});

// Scripts
gulp.task("scripts", function () {
    // FIXME
    const out = gulp.src("src/scripts/*.js").pipe(
        include({
            extensions: "js",
            hardFail: true,
            // eslint-disable-next-line no-undef
            includePaths: [__dirname + "/node_modules", __dirname + "/src/js"],
        })
    );
    return gutil.env.dist
        ? out.pipe(gulp.dest("dest/scripts")).pipe(
              sync.stream({
                  once: true,
              })
          )
        : out
              .pipe(jsmin())
              .pipe(gulp.dest("dest/scripts"))
              .pipe(
                  sync.stream({
                      once: true,
                  })
              );
});

// Images
gulp.task("images", function () {
    return gulp
        .src("src/images/**/*")
        .pipe(
            cache(
                imagemin({
                    interlaced: true,
                    progressive: true,
                    svgoPlugins: [{ removeViewBox: false }],
                    use: [pngquant()],
                })
            )
        )
        .pipe(gulp.dest("dest/images"));
});

// Copy
gulp.task("copy", function () {
    return gulp
        .src(["src/*", "src/fonts/*", "src/images/**/*", "!src/styles/*", "!src/scripts/*"], {
            base: "src",
        })
        .pipe(gulp.dest("dest"))
        .pipe(
            sync.stream({
                once: true,
            })
        );
});

// Server
gulp.task("server", function () {
    sync.init({
        notify: true,
        reloadDelay: 50,
        browser: "google-chrome-stable",
        //ui: false,
        //tunnel: true,
        server: {
            baseDir: "dest",
        },
    });
});

// Clean
gulp.task("clean", function () {
    return del.sync("dest");
});

// Clear
gulp.task("clear", function () {
    return cache.clearAll();
});

// Watch
gulp.task("watch:html", function () {
    return gulp.watch("src/templates/**/*.pug", gulp.series("html"));
});

gulp.task("watch:styles", function () {
    return gulp.watch("src/styles/**/*.scss", gulp.series("styles"));
});

gulp.task("watch:scripts", function () {
    return gulp.watch("src/scripts/*.js", gulp.series("scripts"));
});

gulp.task("watch:copy", function () {
    return gulp.watch(
        ["src/*", "src/fonts/*", "!src/images/*", "!src/styles/*", "!src/scripts/*"],
        gulp.series("copy")
    );
});

gulp.task("watch", gulp.parallel("watch:html", "watch:styles", "watch:scripts", "watch:copy"));

// Build
gulp.task("build", gulp.parallel("html", "styles", "scripts", "copy"));

// Deploy
gulp.task("deploy", function () {
    return gulp.src("./dest/**/*").pipe(ghPages());
});

// Default
gulp.task("default", gulp.series("build", gulp.parallel("watch", "server")));
