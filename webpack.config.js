var path = require('path');
var webpack = require('webpack');
var HtmlWebpackPlugin = require('html-webpack-plugin');
var ExtractTextPlugin = require('extract-text-webpack-plugin');

process.env.NODE_ENV = process.env.NODE_ENV || "development";

var baseConfig = {
  devtool: 'eval-source-map',
  entry: [ path.join(__dirname, 'client/socket.js') ],
  output: {
    path: path.join(__dirname, '/dist/client'),
    filename: '[name].js'
  },
  plugins: [
    new webpack.optimize.OccurrenceOrderPlugin(),
    new webpack.NoErrorsPlugin(),
    new HtmlWebpackPlugin({ title: "HTerminal" }),
    new webpack.EnvironmentPlugin([ "NODE_ENV" ]),
  ],
  module: {
    loaders: [{
      test: /\.js$/,
      exclude: /node_modules/,
      loader: 'react-hot!babel?{"presets":["react","es2015"]}',
    }, {
      test: /\.json$/,
      loader: 'json'
    }, {
      test: /\.css$/,
      loaders: [ 'style-loader', 'css-loader?modules' ],
    }]
  }
};

if (process.env.NODE_ENV === "development") {
  baseConfig.entry.push('webpack-hot-middleware/client?reload=true');
  baseConfig.plugins.push(new webpack.HotModuleReplacementPlugin());
} else {
  baseConfig.plugins.push(new ExtractTextPlugin("styles.css"));
  cssLoader = baseConfig.module.loaders.find((c) => "styles.css".match(c.test))
  cssLoader.loader = ExtractTextPlugin.extract.apply(ExtractTextPlugin, cssLoader.loaders);
  cssLoader.loaders = null;
}

module.exports = baseConfig;
