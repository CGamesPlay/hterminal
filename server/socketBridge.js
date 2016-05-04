var spawn_pty = require('./spawn_pty');

module.exports = function middleware(socket, next) {
  var shell = spawn_pty();

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

  socket.on('resize', function(columns, rows) {
    if (shell) {
      shell.pty.resize({ columns: columns, rows: rows });
    }
  });

  socket.on('disconnect', function() {
    if (shell) {
      shell.kill('SIGHUP');
    }
  });

  next();
}
