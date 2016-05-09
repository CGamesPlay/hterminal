#!/bin/bash

set -e

DISTFILES="package.json webpack.config.js webpack.config.electron.js LICENSE share bin server"

cd $(dirname $0)/..

export NODE_ENV=production

webpack --config webpack.config.electron.js
cp -r $DISTFILES dist/
cd dist/
npm link termios child_pty
npm install
rm -rf ../hterminal-darwin-x64/
../node_modules/.bin/electron-packager ./ HTerminal \
  --platform=darwin --arch=x64 \
  --app-bundle-id=com.cgamesplay.hterminal \
  --app-category-type=app-category-type=public.app-category.developer-tools \
  --overwrite --prune --out=..
