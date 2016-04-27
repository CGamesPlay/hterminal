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
      var escapeStart = buffer.indexOf(TerminalDecoder.ESC);
      if (escapeStart == -1) {
        // No escape in this chunk, emit the entire thing
        cb('output', buffer);
        break;

      } else {
        if (escapeStart > 0) {
          // Emit characters in chunk before start of escape sequence
          cb('output', buffer.slice(0, escapeStart));
          buffer = buffer.slice(escapeStart);
        }

        var escapeLength = this.readEscape(buffer, cb);
        if (escapeLength == -1) {
          // Incomplete escape sequence
          this.pending = buffer;
          break;
        } else if (escapeLength == 0) {
          // No escape sequence, emit the raw character
          cb('output', buffer.slice(0, 1));
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
      return [ [ 'output', this.pending ] ];
    } else {
      return [];
    }
  },

  // Process the escape sequence at the start of buffer and return the number of
  // characters processed. If the buffer does not contain a complete escape
  // sequence, return -1. If the buffer does not contain a valid escape
  // sequence, return 0.
  readEscape: function(buffer, cb) {
    if (buffer.length == 1) {
      return -1;
    } else if (buffer[1] == 'c') {
      cb('reset');
      return 2;
    } else if (buffer[1] == '[') {
      var ret = this.readCSI(buffer.slice(2), cb);
      return ret <= 0 ? ret : ret + 2;
    } else if (buffer[1] == ']') {
      var ret = this.readOSC(buffer.slice(2), cb);
      return ret <= 0 ? ret : ret + 2;
    } else if (buffer[1] == '>' || buffer[1] == '=') {
      // Application keypad mode, ignored
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
  },

  readCSI: function(buffer, cb) {
    var m;
    if (/^([?>]?)(\d|;)*$/.test(buffer)) {
      // This is a valid prefix with no terminator
      return -1;
    } else if (m = /^([?>]?)((\d+;?)*)([A-Za-z])/.exec(buffer)) {
      var codes = [];
      if (m[2]) {
        codes = m[2].split(';').map(function(x) { return parseInt(x, 10); });
      }
      if (m[1] == "" && m[4] == "m") {
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
      } else if (m[1] == "" && m[4] == "n" && codes[0] == 5) {
        // Device status report
        cb('report-status');
      } else {
        cb('csi', m[1], codes, m[4]);
      }
      return m[0].length;
    } else {
      // Invalid CSI
      return 0;
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
      } else if (code == 1866) {
        this.handleHTMLCommand(m[2], cb);
      } else {
        cb('osc', code, m[2]);
      }
      return m[0].length;
    } else {
      // Invalid OSC
      console.error("Invalid OSC:", buffer);
      return 0;
    }
  },

  handleHTMLCommand: function(command, cb) {
    var dataStart = command.indexOf(';') + 1;
    var opcode = command.slice(0, dataStart - 1);
    if (opcode == '0') {
      cb('insert-html', command.slice(dataStart));
    } else {
      cb('osc', 1866, command);
    }
  },
};

TerminalDecoder.ESC = String.fromCharCode(0x1b);
TerminalDecoder.CSI = TerminalDecoder.ESC + "[";
TerminalDecoder.OSC = TerminalDecoder.ESC + "]";
TerminalDecoder.NON_PRINTABLE =
  "\x00\x01\x02\x03\x04\x05\x06\x07\x08\x09\x0b\x0c\x0e\x0e\x0f" + "\x10\x11\x12\x13\x14\x15\x16\x17\x18\x19\x1a\x1b\x1c\x1d\x1e\x1f\x7f"

module.exports = TerminalDecoder;