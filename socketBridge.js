var path = require('path');
var child_pty = require('child_pty');
var termios = require('termios');

module.exports = function middleware(socket, next) {
  var shell = child_pty.spawn('login', [ '-p', '-f', process.env["USER"] ], {
    cwd: process.env.HOME,
    env: {
      TERM: "xterm-256color-html",
      TERMINFO: path.join(__dirname, "terminfo"),
    },
  });

  shell.pty.setEncoding('utf8');
  shell.pty.on('data', function(data) {
    socket.emit('output', data);
  });

  shell.on('exit', function(code, signal) {
    socket.emit('exit', code, signal);
    shell = null;
  });

  socket.on('data', function(message) {
    if (shell) {
      shell.pty.write(message);
    }
  });

  socket.on('disconnect', function() {
    if (shell) {
      shell.kill('SIGHUP');
    }
  });

  next();
}
