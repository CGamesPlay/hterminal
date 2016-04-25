var Terminal = require('./Terminal');

module.exports = function middleware(socket, next) {
  var term = new Terminal('sh', [], {
    cwd: process.env.HOME,
    env: process.env,
  });
  var encoding = 'utf8';

  term.on('data', function(data) {
    socket.emit('output', data.toString(encoding));
  });

  term.on('exit', function(code, signal) {
    socket.emit('exit', code, signal);
  });

  socket.on('data', function(message) {
    term.write(message);
  });

  socket.on('disconnect', function() {
    term.destroy();
  });

  next();
}
