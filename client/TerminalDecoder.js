var VERSION = require("../package")["version"];

function TerminalDecoder() {
  this.pending = null;
}

TerminalDecoder.prototype = {
  write: function(buffer, cb) {
    if (this.pending) {
      buffer = this.pending + buffer;
      this.pending = null;
    }

    while (buffer.length > 0) {
      // Find the first instance of an escape sequence (or special character)
      var escape = /\x07|\x08|\x09|\x0d|\x0c|\x0a|\x08|\x0b|\x1b/.exec(buffer);
      if (!escape) {
        // No escape in this chunk, emit the entire thing
        cb('output', this.formatPrintable(buffer));
        break;

      } else {
        if (escape.index > 0) {
          // Emit characters in chunk before start of escape sequence
          cb('output', this.formatPrintable(buffer.slice(0, escape.index)));
          buffer = buffer.slice(escape.index);
        }

        var escapeLength = this.readEscape(buffer, cb);
        if (escapeLength == -1) {
          // Incomplete escape sequence
          this.pending = buffer;
          break;
        } else if (escapeLength == 0) {
          // No escape sequence, emit the raw character
          cb('output', this.formatPrintable(buffer.slice(0, 1)));
          buffer = buffer.slice(1);
        } else {
          // Single escape sequence
          buffer = buffer.slice(escapeLength);
        }
      }
    }
  },

  end: function() {
    if (this.pending) {
      return [ [ 'output', this.formatPrintable(this.pending) ] ];
    } else {
      return [];
    }
  },

  // Process the escape sequence at the start of buffer and return the number of
  // characters processed. If the buffer does not contain a complete escape
  // sequence, return -1. If the buffer does not contain a valid escape
  // sequence, return 0.
  readEscape: function(buffer, cb) {
    if (buffer[0] == '\x07') {
      cb('bell');
      return 1;
    } else if (buffer[0] == '\b') {
      cb('backspace');
      return 1;
    } else if (buffer[0] == '\r') {
      cb('carriage-return');
      return 1;
    } else if (buffer[0] == '\f') {
      cb('line-feed');
      return 1;
    } else if (buffer[0] == '\n') {
      cb('line-feed');
      cb('carriage-return');
      return 1;
    } else if (buffer[0] == '\t') {
      cb('tab');
      return 1;
    } else if (buffer[0] == '\v') {
      cb('line-feed');
      return 1;
    } else if (buffer[0] == '\x1b') {
      if (buffer.length == 1) {
        return -1;
      } else if (buffer[1] == 'H') {
        cb('set-tab-stop');
        return 2;
      } else if (buffer[1] == 'M') {
        cb('reverse-index');
        return 2;
      } else if (buffer[1] == 'c') {
        cb('reset');
        return 2;
      } else if (buffer[1] == '[') {
        var ret = this.readCSI(buffer.slice(2), cb);
        return ret <= 0 ? ret : ret + 2;
      } else if (buffer[1] == ']') {
        var ret = this.readOSC(buffer.slice(2), cb);
        return ret <= 0 ? ret : ret + 2;
      } else if (buffer[1] == '=') {
        cb('set-keypad-mode', true);
        return 2;
      } else if (buffer[1] == '>') {
        cb('set-keypad-mode', false);
        return 2;
      } else if (buffer[1] == '(') {
        if (buffer.length == 2) {
          return -1;
        } else {
          // Set charset, 3 chars long
          return 3;
        }
      } else {
        return 0;
      }
    } else {
      return 0;
    }
  },

  readCSI: function(buffer, cb) {
    var m;
    if (/^([?>]?)(\d|;)*$/.test(buffer)) {
      // This is a valid prefix with no terminator
      return -1;
    } else if (m = /^([?>]?)((\d+;?)*)([@A-Za-z])/.exec(buffer)) {
      var codes = [];
      if (m[2]) {
        codes = m[2].split(';').map(function(x) { return parseInt(x, 10); });
      }
      if (m[1] == "") {
        if (m[4] == "@") {
          cb('insert-characters', codes[0] || 1);
        } else if (m[4] == "A") {
          cb('cursor-up', codes[0] || 1);
        } else if (m[4] == "B") {
          cb('cursor-down', codes[0] || 1);
        } else if (m[4] == "C") {
          cb('cursor-right', codes[0] || 1);
        } else if (m[4] == "D") {
          cb('cursor-left', codes[0] || 1);
        } else if (m[4] == "G") {
          cb('set-cursor-x', codes[0] || 1);
        } else if (m[4] == "H") {
          cb('move-cursor', codes[1] || 1, codes[0] || 1);
        } else if (m[4] == "J") {
          cb('erase-display', codes[0] > 0, codes[0] != 1);
        } else if (m[4] == "K") {
          cb('erase-line', codes[0] > 0, codes[0] != 1);
        } else if (m[4] == "L") {
          cb('insert-lines', codes[0] || 1);
        } else if (m[4] == "M") {
          cb('delete-lines', codes[0] || 1);
        } else if (m[4] == "P") {
          cb('delete-characters', codes[0] || 1);
        } else if (m[4] == "d") {
          cb('set-cursor-y', codes[0] || 1);
        } else if (m[4] == 'g') {
          cb('clear-tab-stop', codes[0] == 3);
        } else if (m[4] == "m") {
          var style = {};
          codes.forEach(function(c) {
            switch (c) {
              case 1: style.bold = true; break;
              case 2: style.faint = true; break;
              case 3: style.italic = true; break;
              case 4: style.underline = true; break;
              case 5: style.bold = true; break; // "blink"
              case 7: style.inverse = true; break;
              case 9: style.strikethrough = true; break;
              case 22: style.bold = style.faint = false; break;
              case 23: style.italic = false; break;
              case 24: style.underline = false; break;
              //case 25: style.bold = false; break; // "not blinking"
              case 27: style.inverse = false; break;
              case 29: style.strikethrough = false; break;
              case 30: style.foreground = 'black'; break;
              case 31: style.foreground = 'red'; break;
              case 32: style.foreground = 'green'; break;
              case 33: style.foreground = 'yellow'; break;
              case 34: style.foreground = 'blue'; break;
              case 35: style.foreground = 'magenta'; break;
              case 36: style.foreground = 'cyan'; break;
              case 37: style.foreground = 'white'; break;
              case 39: style.foreground = false; break;
              case 40: style.background = 'black'; break;
              case 41: style.background = 'red'; break;
              case 42: style.background = 'green'; break;
              case 43: style.background = 'yellow'; break;
              case 44: style.background = 'blue'; break;
              case 45: style.background = 'magenta'; break;
              case 46: style.background = 'cyan'; break;
              case 47: style.background = 'white'; break;
              case 49: style.background = false; break;
              case 90: style.foreground = 'bright-black'; break;
              case 91: style.foreground = 'bright-red'; break;
              case 92: style.foreground = 'bright-green'; break;
              case 93: style.foreground = 'bright-yellow'; break;
              case 94: style.foreground = 'bright-blue'; break;
              case 95: style.foreground = 'bright-magenta'; break;
              case 96: style.foreground = 'bright-cyan'; break;
              case 97: style.foreground = 'bright-white'; break;
              case 100: style.background = 'bright-black'; break;
              case 101: style.background = 'bright-red'; break;
              case 102: style.background = 'bright-green'; break;
              case 103: style.background = 'bright-yellow'; break;
              case 104: style.background = 'bright-blue'; break;
              case 105: style.background = 'bright-magenta'; break;
              case 106: style.background = 'bright-cyan'; break;
              case 107: style.background = 'bright-white'; break;
            }
            /*
            Xterm maintains a color palette whose entries are identified
            by an index beginning with zero.  If 88- or 256-color support
            is compiled, the following apply:
            o All parameters are decimal integers.
            o RGB values range from zero (0) to 255.
            o ISO-8613-3 can be interpreted in more than one way; xterm
              allows the semicolons in this control to be replaced by
              colons (but after the first colon, colons must be used).

            These ISO-8613-3 controls are supported:
              Pm = 3 8 ; 2 ; Pr; Pg; Pb -> Set foreground color to the closest match in xterm's palette for the given RGB Pr/Pg/Pb.
              Pm = 3 8 ; 5 ; Ps -> Set foreground color to Ps.
              Pm = 4 8 ; 2 ; Pr; Pg; Pb -> Set background color to the closest match in xterm's palette for the given RGB Pr/Pg/Pb.
              Pm = 4 8 ; 5 ; Ps -> Set background color to Ps.
              */
          });
          cb('style', style);
        } else if (m[4] == "n" && codes[0] == 5) {
          cb('send-report', TerminalDecoder.CSI + "0n");
        } else if (m[4] == "n" && codes[0] == 1866) {
          cb('send-report', TerminalDecoder.CSI + "HT " + VERSION + "n");
        } else if (m[4] == 'r') {
          cb('set-scroll-region', codes[0], codes[1]);
        } else {
          cb('csi', m[1], codes, m[4]);
        }
      } else if (m[1] == ">") {
        if (m[4] == "c" && !codes[0]) {
          cb('send-report', TerminalDecoder.CSI + ">0;95;0c");
        } else {
          cb('csi', m[1], codes, m[4]);
        }
      } else if (m[1] == "?") {
        this.handleDEC(codes, m[4], cb);
      } else {
        cb('csi', m[1], codes, m[4]);
      }
      return m[0].length;
    } else {
      // Invalid CSI
      return 0;
    }
  },

  handleDEC: function(codes, command, cb) {
    if (command == "h" || command == "l") {
      var set = command == "h";
      codes.forEach((code) => {
        switch (code) {
          case 1: cb('cursor-mode', set); break;
          case 12: cb('cursor-blink', set); break;
          case 25: cb('show-cursor', set); break;
          case 1000: cb('set-mouse-reporting', set ? "normal" : "none"); break;
          case 1049:
            cb('use-alternate-screen', set);
            if (set) { cb('erase-display', true, true); }
            break;
          default: cb('dec-mode', code, set); break;
        }
      });
    } else {
      cb('csi', '?', codes, command);
    }
  },

  readOSC: function(buffer, cb) {
    var m;
    if (buffer.indexOf("\x07") == -1 && buffer.indexOf("\x1b\\") == -1 &&
        new RegExp("^[^" + TerminalDecoder.NON_PRINTABLE + "]*$").test(buffer)) {
      // This is a valid prefix of an OSC, but it doesn't have the terminator.
      return -1;
    } else if (m = new RegExp("^(\\d+);([^" + TerminalDecoder.NON_PRINTABLE + "]*)(\x07|\x1b\\\\)").exec(buffer)) {
      var code = parseInt(m[1], 10);
      if (code == 0) {
        cb('set-title', m[2]);
      } else if (code == 133) {
        if (m[2] == "A") {
          cb('repl-prompt');
        } else if (m[2] == "C;") {
          cb('repl-output');
        } else if (m[2].slice(0, 2) == "D;") {
          cb('repl-end', parseInt(m[2].slice(2), 10));
        } else {
          cb('osc', code, m[2]);
        }
      } else if (code == 1866) {
        this.handleHTMLCommand(m[2], cb);
      } else {
        cb('osc', code, m[2]);
      }
      return m[0].length;
    } else {
      // Invalid OSC
      return 0;
    }
  },

  handleHTMLCommand: function(command, cb) {
    var dataStart = command.indexOf(';') + 1;
    var opcode = command.slice(0, dataStart - 1);
    if (opcode == '0') {
      cb('insert-html', command.slice(dataStart));
    } else if (opcode == '1') {
      cb('replace-html', command.slice(dataStart));
    } else if (opcode == '2') {
      var idSeparator = command.indexOf(';', dataStart);
      if (idSeparator == -1) {
        // Invalid
        cb('osc', 1866, command);
      } else {
        cb('replace-fixed-html', command.slice(dataStart, idSeparator), command.slice(idSeparator + 1));
      }
    } else {
      cb('osc', 1866, command);
    }
  },

  formatPrintable: function(string) {
    return string.replace(
      TerminalDecoder.NON_PRINTABLE_REGEXP,
      (m) => "^" + String.fromCharCode(64 + m.charCodeAt(0))
    );
  },
};

TerminalDecoder.ESC = String.fromCharCode(0x1b);
TerminalDecoder.CSI = TerminalDecoder.ESC + "[";
TerminalDecoder.OSC = TerminalDecoder.ESC + "]";
TerminalDecoder.NON_PRINTABLE =
  "\x00\x01\x02\x03\x04\x05\x06\x07\x08\x09\x0b\x0c\x0e\x0e\x0f" + "\x10\x11\x12\x13\x14\x15\x16\x17\x18\x19\x1a\x1b\x1c\x1d\x1e\x1f\x7f"
TerminalDecoder.NON_PRINTABLE_REGEXP =
  new RegExp("[" + TerminalDecoder.NON_PRINTABLE + "]", "g");

module.exports = TerminalDecoder;
