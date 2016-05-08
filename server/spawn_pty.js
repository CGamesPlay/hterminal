var child_pty = require('child_pty');
var path = require('path');

function ctrlKey(c) {
  return c.charCodeAt(0) - 64;
}

module.exports = function() {
  var shell = child_pty.spawn('login', [ '-p', '-f', process.env["USER"] ], {
    cwd: process.env.HOME,
    env: Object.assign({}, process.env, {
      TERM: "xterm-256color",
      TERM_PROGRAM: "HTerminal",
      HTERMINAL_ROOT: path.resolve(__dirname + "/.."),
    }),
    iflag: {
      ICRNL: true,
      IXON: true,
      IXANY: true,
      IMAXBEL: true,
      BRKINT: true,
      IUTF8: true,
    },
    oflag: {
      OPOST: true,
      ONLCR: true,
    },
    cflag: {
      CREAD: true,
      CS8: true,
      HUPCL: true,
    },
    lflag: {
      ICANON: true,
      ISIG: true,
      IEXTEN: true,
      ECHO: true,
      ECHOE: true,
      ECHOK: true,
      ECHOKE: true,
      ECHOCTL: true,
    },
    cc: {
      VEOF: ctrlKey('D'),
      VEOL: -1,
      VEOL2: -1,
      VERASE: 0x7f, // DEL
      VWERASE: ctrlKey('W'),
      VKILL: ctrlKey('U'),
      VREPRINT: ctrlKey('R'),
      VINTR: ctrlKey('C'),
      VQUIT: 0x1c, // Control+backslash
      VSUSP: ctrlKey('Z'),
      VDSUSP: ctrlKey('Y'),
      VSTART: ctrlKey('Q'),
      VSTOP: ctrlKey('S'),
      VLNEXT: ctrlKey('V'),
      VDISCARD: ctrlKey('O'),
      VMIN: 1,
      VTIME: 0,
      VSTATUS: ctrlKey('T'),
    },
  });
  return shell;
};
