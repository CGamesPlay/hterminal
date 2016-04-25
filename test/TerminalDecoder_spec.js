var TerminalDecoder = require('../TerminalDecoder');
var expect = require('chai').expect;

describe('TerminalDecoder', function() {
  function processChunks(chunks) {
    var d = new TerminalDecoder();
    var output = [];
    chunks.forEach(function(c) {
      d.write(c, function() {
        output.push(Array.prototype.slice.call(arguments));
      });
    });
    d.end().forEach(function(command) {
      output.push(command);
    });
    return output;
  }
  function process(input) {
    return processChunks([ input ]);
  };

  it('processes simple strings', function() {
    var result = processChunks([ "abc" ]);
    expect(result).to.deep.equal([ [ 'output', 'abc' ] ]);
  });

  it('processes utf8 characters between chunks', function() {
    var result = processChunks([ new Buffer([0xc2]), new Buffer([0xa2]) ]);
    expect(result).to.deep.equal([ [ 'output', '\u00a2' ] ]);
  });

  it('returns unfinished utf8 chatacters at end', function() {
    var result = processChunks([ new Buffer([0xc2]) ]);
    expect(result).to.deep.equal([ [ 'output', '\ufffd' ] ]);
  });

  it('processes simple escape sequences', function() {
    var result = processChunks([ TerminalDecoder.ESC + "c" ]);
    expect(result).to.deep.equal([ [ 'reset' ] ]);
  });

  it('processes escape sequences between chunks', function() {
    var result = processChunks([ TerminalDecoder.ESC, "c" ]);
    expect(result).to.deep.equal([ [ 'reset' ] ]);
  });

  it('returns unfinished escape sequences at end', function() {
    var result = processChunks([ TerminalDecoder.ESC ]);
    expect(result).to.deep.equal([ [ 'output', '\x1b' ] ]);
  });

  it('returns both unfinished bytes and escape sequences at end', function() {
    var result = processChunks([ TerminalDecoder.ESC, new Buffer([0xc2]) ]);
    expect(result).to.deep.equal([ [ 'output', '\x1b\ufffd' ] ]);
  });

  it.only('processes character attributes', function() {
    var result = process(TerminalDecoder.CSI + "0m");
    expect(result).to.deep.equal([ [ 'style', { } ] ]);
    result = process(TerminalDecoder.CSI + "1;32m");
    expect(result).to.deep.equal([ [ 'style', { bold: true, foreground: 'green' } ] ]);
  });

  describe('.Stream', function() {
    it('works', function(done) {
      var s = new TerminalDecoder.Stream();
      var output = [];
      s.on('data', function(command) { output.push(command); });
      s.on('end', function() {
        expect(output).to.deep.equal([
          [ 'output', '\u00a2' ],
          [ 'output', '\x1b' ],
        ]);
        done();
      });
      s.write(new Buffer([0xc2]));
      s.write(new Buffer([0xa2]));
      s.write(new Buffer([0x1b]));
      s.end();
    });
  });
});
