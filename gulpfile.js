var gulp = require("gulp");
var electronServer = require("electron-connect").server;

gulp.task("develop", function() {
  var server = electronServer.create({
    spawnOpt: {
      env: Object.assign({ NODE_ENV: "development" }, process.env),
      stdio: "inherit"
    }
  });
  server.start();
  gulp.watch(["./server/*.js"], server.restart);
});
