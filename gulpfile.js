var gulp = require("gulp");
var server = require("gulp-develop-server");

gulp.task("develop", function() {
    server.listen({
      path: "./server/web.js",
      env: { NODE_ENV: "development" },
    });
    gulp.watch([ "./*.js" ], server.restart);
    // TODO - integrate gulp-develop-server and gulp-livereload
});
