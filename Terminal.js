var EventEmitter = require('events').EventEmitter;
var child_pty = require('child_pty');
var termios = require('termios');
var TerminalDecoder = require('./TerminalDecoder');

function Terminal(command, args, options) {
  if (!(this instanceof Terminal)) {
    return new Terminal(command, args, options);
  }
  EventEmitter.call(this);

  this.term = child_pty.spawn(command, args, options);
  this.term.on('exit', this.handleExit.bind(this));
  this.term.pty.on('data', this.handleData.bind(this));

  this.decoder = new TerminalDecoder();

  termios.setattr(this.term.pty.master_fd, { lflag: { ECHO: false } })

  return this;
};


Terminal.prototype = {
  __proto__: EventEmitter.prototype,

  write: function(data) {
    return this.term.pty.write(data);
  },

  destroy: function() {
    return this.term.kill('SIGHUP');
  },

  handleExit: function(code, signal) {
    this.emit('exit', code, signal);
    this.term = null;
    this.write = function() { };
    this.destroy = function() { };
  },

  handleData: function(raw_buffer) {
    var self = this;
    this.decoder.write(raw_buffer, function(command) {
      if (command == 'output') {
        self.emit('data', arguments[1]);
      }
    });
  },

  emitText: function(text) {
    this.emit('data', { text: text });
  },
};

Terminal.ESC = String.fromCharCode(0x1b);

module.exports = Terminal;
