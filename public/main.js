import React from 'react';
import ReactDOM from 'react-dom';
import io from 'socket.io-client';
import Terminal from './Terminal';
import Driver from './Driver';

var socket = io();
function connectDriver(driver) {
  socket.on('connect', driver.handleConnect.bind(driver));
  socket.on('output', driver.write.bind(driver));
  socket.on('exit', driver.handleExit.bind(driver));
}

function handleInput(data) {
  socket.emit('data', data);
}

var driver = new Driver();
connectDriver(driver);

var container = document.createElement("DIV");
container.id = "react-root"
document.body.appendChild(container);

function render() {
  var terminal = <Terminal driver={driver} onInput={handleInput} />;
  ReactDOM.render(terminal, container);
}

render();
if (module.hot) {
  module.hot.accept("./Driver", function(newDriver) {
    driver = new newDriver();
    connectDriver(driver);
    render();
  });
}
