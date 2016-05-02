var path = require('path');
var baseConfig = require('./webpack.config');

baseConfig.entry[0] = path.join(__dirname, 'public/electron.js');
baseConfig.target = "electron-renderer";

module.exports = baseConfig;
