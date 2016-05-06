var path = require('path');
var express = require('express');
var webpack = require('webpack');
var webpackDevMiddleware = require('webpack-dev-middleware');
var webpackHotMiddleware = require("webpack-hot-middleware");
var http = require('http');
var config = require('../webpack.config.electron.js');

module.exports = function(cb) {
  var app = express();
  var server = http.Server(app);

  const compiler = webpack(config);
  const middleware = webpackDevMiddleware(compiler, {
    contentBase: 'client',
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

  server.listen(0, '0.0.0.0', function onStart(err) {
    if (err) {
      throw err;
    }
    var address = server.address();
    __root = "http://" + address.address + ":" + address.port + "/";
    cb(__root);
  });
};
