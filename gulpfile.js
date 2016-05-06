var gulp = require("gulp");
var developServer = require("gulp-develop-server");
var electronServer = require("electron-connect").server;

gulp.task("develop-web", function() {
  developServer.listen({
    path: "./server/web.js",
    env: { NODE_ENV: "development" },
  });
  gulp.watch([ "./server/*.js" ], developServer.restart);
});

gulp.task("develop-app", function() {
  var server = electronServer.create({
    spawnOpt: {
      env: Object.assign({ NODE_ENV: "development" }, process.env),
      stdio: 'inherit',
    },
  });
  server.start();
  gulp.watch([ "./server/*.js" ], server.restart);
});
