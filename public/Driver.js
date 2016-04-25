import io from 'socket.io-client';
import EventEmitter from 'events';
import TerminalDecoder from './TerminalDecoder';

export default class Driver extends EventEmitter {
  constructor() {
    super();

    this.socket = io();
    this.cells = [];
    this.decoder = new TerminalDecoder();

    this.socket.on('connect', this.handleConnect.bind(this));
    this.socket.on('output', this.decodeOutput.bind(this));
    this.socket.on('exit', this.handleExit.bind(this));
  }

  send(data) {
    this.socket.emit('data', data);
  }

  handleConnect() {
    this.cells = [];
    this.decoder = new TerminalDecoder();
  }

  decodeOutput(output) {
    this.decoder.write(output, this.handleCommand.bind(this));
  }

  handleExit(code, signal) {
    console.log("exited with", code, signal);
    this.decoder.end().forEach(this.handleCommand.bind(this));
  }

  handleCommand(command) {
    if (command == 'output') {
      this.handleOutput(arguments[1]);
    } else {
      console.log.apply(console, arguments);
    }
  }

  handleOutput(output) {
    let new_cell = (this.cells[this.cells.length - 1] || "") + this.formatString(output);
    this.cells = this.cells.slice(0, -1).concat(new_cell);
    this.emit('output', this.cells);
  }

  formatString(string) {
    // Note:
    //   NL -> cursor to column 0, down one line
    //   CR -> cursor to colum 0
    //   FF -> down one line
    return string
      .replace(/\x0c/g, '\n')
      .replace(/\x07/g, '\uD83D\uDD14')
      .replace(/\x0d/g, '')
      .replace(new RegExp("[" + TerminalDecoder.NON_PRINTABLE + "]", "g"), (m) => {
        return "^" + String.fromCharCode(64 + m.charCodeAt(0));
      });
  }
}

if (module.hot) {
  module.hot.decline();
}
