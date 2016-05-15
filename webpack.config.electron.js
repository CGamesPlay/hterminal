var path = require('path');
var baseConfig = require('./webpack.config');

baseConfig.entry[0] = path.join(__dirname, 'client/electron.js');

module.exports = baseConfig;
