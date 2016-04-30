import React from 'react';
import ReactDOM from 'react-dom';
import io from 'socket.io-client';
import Terminal from './Terminal';
import Driver from '../terminal/Driver';

var socket = io();
function connectDriver(driver) {
  socket.on('connect', driver.handleConnect.bind(driver));
  socket.on('output', driver.write.bind(driver));
  socket.on('exit', driver.handleExit.bind(driver));

  driver.on('set-title', (t) => document.title = t);
  driver.on('send-report', (r) => handleInput(r));
}

function handleInput(data) {
  socket.emit('data', data);
}

var driver = new Driver(known_columns, known_rows);
connectDriver(driver);

var known_columns = 80, known_rows = 24;
function handleResize(columns, rows) {
  if (columns >= 1 && rows >= 1) {
    known_columns = columns;
    known_rows = rows;
    socket.emit('resize', columns, rows);
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
  module.hot.accept("../terminal/Driver", function() {
    var NewDriver = require('../terminal/Driver');

    driver.removeAllListeners('set-title');
    driver.removeAllListeners('send-report');

    driver = new NewDriver(known_columns, known_rows);
    connectDriver(driver);
    render();
  });
}
