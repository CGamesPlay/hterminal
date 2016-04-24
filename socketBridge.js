var pty = require('pty.js');

module.exports = function middleware(socket, next) {
  var term = pty.spawn('sh', [], {
    cwd: process.env.HOME,
    env: process.env,
  });
  var encoding = 'utf8';

  term.on('data', function(data) {
    socket.send({ output: data.toString(encoding) });
  });

  term.on('close', function(code, signal) {
    socket.send({ terminate: code, signal: signal });
  });

  socket.on('message', function(message) {
    term.write(message + "\n", encoding);
  });

  socket.on('disconnect', function() {
    term.destroy();
  });

  next();
}
