var EventEmitter = require('events').EventEmitter;
var child_pty = require('child_pty');
var termios = require('termios');
var StringDecoder = require('string_decoder').StringDecoder;

function Terminal(command, args, options) {
  if (!(this instanceof Terminal)) {
    return new Terminal(command, args, options);
  }
  EventEmitter.call(this);

  this.term = child_pty.spawn(command, args, options);
  this.term.on('exit', this.emit.bind(this, 'exit'));
  this.term.pty.on('data', this.handleData.bind(this));

  this.decoder = new StringDecoder('utf8');

  termios.setattr(this.term.pty.master_fd, { lflag: { ECHO: false } })

  return this;
};


Terminal.prototype = {
  __proto__: EventEmitter.prototype,

  write: function(data) {
    return this.term.pty.write(data);
  },

  end: function() {
    return this.term.end();
  },

  destroy: function() {
    return this.term.destroy();
  },

  handleData: function(raw_buffer) {
    var buffer = this.decoder.write(raw_buffer);
    while (buffer.length > 0) {
      var escapeStart = buffer.indexOf(Terminal.ESC)
      if (escapeStart == -1) {
        this.emitText(buffer);
        break;

      } else {
        this.emitText(buffer.slice(0, escapeStart));
        var escapeLength = this.handleEscape(buffer.slice(escapeStart));
        if (escapeLength == -1) {
          // Incomplete
          this.pendingData = buffer;
        } else {
          buffer = buffer.slice(escapeStart + escapeLength);
        }
      }
    }
  },

  handleEscape: function(buffer) {
    this.emitText('^[');
    return 1;
  },

  emitText: function(text) {
    this.emit('data', { text: text.toString('utf8') });
  },
};

Terminal.ESC = String.fromCharCode(0x1b);

module.exports = Terminal;
