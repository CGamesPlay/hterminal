var path = require('path');
var express = require('express');
var webpack = require('webpack');
var webpackDevMiddleware = require('webpack-dev-middleware');
var webpackHotMiddleware = require("webpack-hot-middleware");
var http = require('http');
var socketIO = require('socket.io');
var config = require('./webpack.config.js');
var socketBridge = require('./socketBridge.js');

var isDevelopment = process.env.NODE_ENV == "development";
var port = isDevelopment ? 3000 : process.env.PORT;
var app = express();
var server = http.Server(app);
var io = socketIO(server);

io.use(socketBridge);

if (isDevelopment) {
  const compiler = webpack(config);
  const middleware = webpackDevMiddleware(compiler, {
    contentBase: 'public',
    stats: {
      colors: true,
      hash: false,
      timings: true,
      chunks: false,
      chunkModules: false,
      modules: false
    }
  });

  app.use(middleware);
  app.use(webpackHotMiddleware(compiler));
  app.get('*', function response(req, res) {
    res.write(middleware.fileSystem.readFileSync(path.join(config.output.path, 'index.html')));
    res.end();
  });
} else {
  app.use(express.static(path.join(__dirname, config.output.path)));
  app.get('*', function response(req, res) {
    res.sendFile(path.join(__dirname, config.output.path, 'index.html'));
  });
}

server.listen(port, '0.0.0.0', function onStart(err) {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log("Server ready at http://0.0.0.0:%d/", port);
});
