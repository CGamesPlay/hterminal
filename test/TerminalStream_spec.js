var TerminalStream = require('../TerminalStream');
var TerminalDecoder = require('../TerminalDecoder');
var expect = require('chai').expect;

describe('TerminalStream', function() {
  function streamChunks(chunks, done) {
    var s = new TerminalStream();
    var output = [];
    s.on('data', function(command) { output.push(command); });
    s.on('end', function() { done(output); });
    chunks.forEach(function(c) { s.write(new Buffer(c)); });
    s.end();
  }

  it('works', function(done) {
    var chunks = [ "abc", TerminalDecoder.ESC, "c", "def" ];
    streamChunks(chunks, function(output) {
      expect(output).to.deep.equal([
        [ 'output', 'abc' ],
        [ 'reset' ],
        [ 'output', 'def' ],
      ]);
      done();
    });
  });

  it('processes utf8 characters between chunks', function(done) {
    var chunks = [ [0xc2], [0xa2] ];
    streamChunks(chunks, function(output) {
      expect(output).to.deep.equal([ [ 'output', '\u00a2' ] ]);
      done();
    });
  });

  it('returns unfinished utf8 chatacters at end', function(done) {
    var chunks = [ [0xc2] ];
    streamChunks(chunks, function(output) {
      expect(output).to.deep.equal([ [ 'output', '\ufffd' ] ]);
      done();
    });
  });

  it('returns both unfinished bytes and escape sequences at end', function(done) {
    var chunks = [ TerminalDecoder.ESC, [0xc2] ];
    streamChunks(chunks, function(output) {
      expect(output).to.deep.equal([
        [ 'output', '\x1b' ],
        [ 'output', '\ufffd' ],
      ]);
      done();
    });
  });
});
