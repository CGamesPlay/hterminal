var ipcMain = require('electron').ipcMain;
var spawn_pty = require('./spawn_pty');

ipcMain.on('data', function(event) {
  event.sender.emit.apply(event.sender, [ "hterminal:data" ].concat(Array.prototype.slice.call(arguments)));
});

ipcMain.on('resize', function(event) {
  event.sender.emit.apply(event.sender, [ "hterminal:resize" ].concat(Array.prototype.slice.call(arguments)));
});

function ElectronWindow(webContents) {
  if (!(this instanceof ElectronWindow)) {
    return new ElectronWindow(webContents);
  }
  this.webContents = webContents;
  webContents.hterminal = this;

  this.shell = spawn_pty();
  this.shell.pty.setEncoding('utf8');
  this.shell.pty.on('data', this.handleOutput.bind(this));
  this.shell.on('exit', this.handleShellExit.bind(this));

  this.webContents.on('hterminal:data', this.handleInput.bind(this));
  this.webContents.on('hterminal:resize', this.handleResize.bind(this));
  this.webContents.on('destroyed', this.handleWindowClosed.bind(this));

  this.webContents.send('connected');
}

ElectronWindow.fromWebContents = function(webContents) {
  return webContents.hterminal;
}

ElectronWindow.prototype = {
  handleOutput: function(data) {
    if (this.webContents) {
      this.webContents.send('output', data);
    }
  },

  handleShellExit: function(code, signal) {
    if (this.webContents) {
      this.webContents.send('exit', code, signal);
    }
    this.shell = null;
  },

  handleInput: function(event, data) {
    if (this.shell) {
      this.shell.pty.write(data);
    }
  },

  handleResize: function(event, columns, rows) {
    if (this.shell) {
      this.shell.pty.resize({ columns: columns, rows: rows });
    }
  },

  handleWindowClosed: function(event) {
    this.webContents = null;
    if (this.shell) {
      this.shell.kill('SIGHUP');
    }
  },

  clear: function() {
    if (this.webContents) {
      this.webContents.send('clear');
    }
  },
};

module.exports = ElectronWindow;
