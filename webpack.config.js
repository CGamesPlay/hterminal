var path = require('path');
var webpack = require('webpack');
var HtmlWebpackPlugin = require('html-webpack-plugin');
var ExtractTextPlugin = require('extract-text-webpack-plugin');

module.exports = {
  devtool: 'eval-source-map',
  entry: [
    path.join(__dirname, 'public/main.js'),
    'webpack-hot-middleware/client?reload=true',
  ],
  output: {
    path: path.join(__dirname, '/dist/'),
    filename: '[name].js'
  },
  devtool: 'eval-source-map',
  plugins: [
    new webpack.optimize.OccurrenceOrderPlugin(),
    new webpack.HotModuleReplacementPlugin(),
    new webpack.NoErrorsPlugin(),
    new HtmlWebpackPlugin(),
    //new ExtractTextPlugin('styles.css'),
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify('development')
    })
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
      //loader: ExtractTextPlugin.extract('style-loader', 'css-loader?modules'),
      loaders: [ 'style-loader', 'css-loader?modules' ],
    }]
  }
};
