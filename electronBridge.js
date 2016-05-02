var ipcMain = require('electron').ipcMain;
var child_pty = require('child_pty');
var termios = require('termios');

function ctrlKey(c) {
  return c.charCodeAt(0) - 64;
}

exports.connect = function(webContents) {
  var shell = child_pty.spawn('login', [ '-p', '-f', process.env["USER"] ], {
    cwd: process.env.HOME,
    env: {
      TERM: "xterm-256color",
    },
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

  shell.pty.setEncoding('utf8');
  shell.pty.on('data', function(data) {
    if (webContents) {
      webContents.send('output', data);
    }
  });

  shell.on('exit', function(code, signal) {
    if (webContents) {
      webContents.send('exit', code, signal);
    }
    shell = null;
  });

  ipcMain.on('data', function(event, message) {
    if (shell) {
      shell.pty.write(message);
    }
  });

  ipcMain.on('resize', function(event, columns, rows) {
    if (shell) {
      shell.pty.resize({ columns: columns, rows: rows });
    }
  });

  webContents.on('destroyed', function(event) {
    webContents = null;
    if (shell) {
      shell.kill('SIGHUP');
    }
  });

  webContents.send('connected');
}
