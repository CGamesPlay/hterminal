import React from 'react';
import ReactDOM from 'react-dom';
import Terminal from './Terminal';
import TerminalDriver from './TerminalDriver';
import debounce from './util/debounce';

var driver = new TerminalDriver(known_columns, known_rows);

// Electron is doing something weird where terminal events are received and
// processed even while the debugger is paused. To cope with this, we buffer
// up data here and flush it as rapidly as possible. The timers won't fire
// while the debugger is paused.
var buffer = "";
var flush = debounce(() => {
  var data = buffer;
  buffer = "";
  ReactDOM.unstable_batchedUpdates(() => {
    driver.write(data);
  });
}, 0);

window.onTerminalConnected = function() {
  // Send initial resize
  window.terminalResize(known_columns, known_rows);
};
window.onTerminalOutput = function(data) { buffer += data; flush(); };
window.onTerminalClear = function() { driver.clear(); };
window.onTerminalExit = function(code, signal) { driver.handleExit(code, signal); };

function connectDriver(driver) {
  driver.on('set-title', (t) => document.title = t);
  driver.on('send-report', (r) => handleInput(r));
}

function handleInput(data) {
  window.terminalWrite(data);
}

connectDriver(driver);

var known_columns = 80, known_rows = 24;
function handleResize(columns, rows) {
  if (columns >= 1 && rows >= 1) {
    known_columns = columns;
    known_rows = rows;
    window.terminalResize(columns, rows);
    driver.resize(columns, rows);
    render();
  }
}

var container = document.createElement("DIV");
container.id = "react-root"
document.body.appendChild(container);

function render() {
  var terminal = <Terminal
    driver={driver}
    onInput={handleInput}
    initialColumns={known_columns}
    initialRows={known_rows}
    onResize={handleResize} />;
  ReactDOM.render(terminal, container);
}

render();
if (module.hot) {
  module.hot.accept("./TerminalDriver", function() {
    var NewDriver = require('./TerminalDriver')["default"];

    driver.removeAllListeners('set-title');
    driver.removeAllListeners('send-report');

    driver = new NewDriver(known_columns, known_rows);
    connectDriver(driver);
    render();
  });
}
