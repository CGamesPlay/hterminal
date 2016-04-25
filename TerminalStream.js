var util = require('util');
var Transform = require('stream').Transform;
var StringDecoder = require('string_decoder').StringDecoder;
var TerminalDecoder = require('./public/TerminalDecoder');

function TerminalStream() {
  if (!(this instanceof TerminalStream)) {
    return new TerminalStream();
  }

  Transform.call(this, { readableObjectMode: true });
  this._utf8Decoder = new StringDecoder('utf8');
  this._terminalDecoder = new TerminalDecoder();
}
util.inherits(TerminalStream, Transform);
TerminalDecoder.TerminalStream = TerminalStream;

TerminalStream.prototype._transform = function(raw_buffer, encoding, done) {
  var self = this;
  var buffer = this._utf8Decoder.write(raw_buffer);
  this._terminalDecoder.write(buffer, function() {
    self.push(Array.prototype.slice.call(arguments));
  });
  done();
};

TerminalStream.prototype._flush = function(done) {
  var self = this;
  var buffer = this._utf8Decoder.end();
  this._terminalDecoder.write(buffer, function() {
    self.push(Array.prototype.slice.call(arguments));
  });
  this._terminalDecoder.end().forEach(function(command) {
    self.push(command);
  });
  done();
};

module.exports = TerminalStream;
