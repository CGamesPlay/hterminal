import io from 'socket.io-client';
import EventEmitter from 'events';

export default class Driver extends EventEmitter {
  constructor() {
    super();

    this.socket = io();
    this.cells = [];

    this.socket.on('output', this.handleOutput.bind(this));
    this.socket.on('exit', this.handleExit.bind(this));
  }

  send(data) {
    this.socket.emit('data', data);
  }

  handleOutput(output) {
    let new_cell = (this.cells[this.cells.length - 1] || "") + output;
    this.cells = this.cells.slice(0, -1).concat(new_cell);
    this.emit('output', this.cells);
  }

  handleExit(code, signal) {
    console.log("exited with", code, signal);
  }
}
