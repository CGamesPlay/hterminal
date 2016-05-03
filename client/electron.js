import React from 'react';
import ReactDOM from 'react-dom';
import Terminal from './Terminal';
import TerminalDriver from './TerminalDriver';
import { ipcRenderer } from 'electron';

function connectDriver(driver) {
  ipcRenderer.on('connected', (event) => {
    // Send initial resize
    ipcRenderer.send('resize', known_columns, known_rows);
  });
  ipcRenderer.on('output', (event, data) => driver.write(data));
  ipcRenderer.on('exit', (event, code, signal) => driver.handleExit(code, signal));

  driver.on('set-title', (t) => document.title = t);
  driver.on('send-report', (r) => handleInput(r));
}

function handleInput(data) {
  ipcRenderer.send('data', data);
}

var driver = new TerminalDriver(known_columns, known_rows);
connectDriver(driver);

var known_columns = 80, known_rows = 24;
function handleResize(columns, rows) {
  if (columns >= 1 && rows >= 1) {
    known_columns = columns;
    known_rows = rows;
    ipcRenderer.send('resize', columns, rows);
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
    var NewDriver = require('./TerminalDriver');

    ipcRenderer.removeAllListeners('output');
    ipcRenderer.removeAllListeners('exit');
    driver.removeAllListeners('set-title');
    driver.removeAllListeners('send-report');

    driver = new NewDriver(known_columns, known_rows);
    connectDriver(driver);
    render();
  });
}
