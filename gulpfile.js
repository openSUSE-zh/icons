const gulp = require("gulp");
const svgmerge = require("./gulp-svgmerge");
const svgmin = require("gulp-svgmin");
const path = require("path");

const plasmaThemeIconFiles = ["battery"];

const plasmaTasks = plasmaThemeIconFiles.map(file => {
  const taskName = "plasma-" + file;
  gulp.task(taskName, () => {
    return gulp
      .src("src/plasma/" + file + "/*.svg")
      .pipe(
        svgmin({
          js2svg: {
            pretty: true
          }
        })
      )
      .pipe(svgmerge())
      .pipe(gulp.dest("dist/plasma/"));
  });
  return taskName;
});

gulp.task("plasma", plasmaTasks);

gulp.task("default", ["plasma"]);
