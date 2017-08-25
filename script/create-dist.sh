#!/bin/bash

set -e

DISTFILES="package.json webpack.config.js webpack.config.electron.js LICENSE share bin server"

cd $(dirname $0)/..

export NODE_ENV=production

webpack --config webpack.config.electron.js
cp -r $DISTFILES dist/
cd dist/
yarn
rm -rf ../HTerminal-darwin-x64/
../node_modules/.bin/electron-packager ./ HTerminal \
  --platform=darwin --arch=x64 \
  --app-bundle-id=com.cgamesplay.hterminal \
  --app-category-type=app-category-type=public.app-category.developer-tools \
  --version 0.37.9 \
  --overwrite --prune --package-manager=yarn --out=..
