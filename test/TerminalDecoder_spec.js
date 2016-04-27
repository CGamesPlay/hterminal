var TerminalDecoder = require('../terminal/TerminalDecoder');
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

  it('processes character attributes', function() {
    var result = process(TerminalDecoder.CSI + "0m");
    expect(result).to.deep.equal([ [ 'style', { } ] ]);
    result = process(TerminalDecoder.CSI + "1;32m");
    expect(result).to.deep.equal([ [ 'style', { bold: true, foreground: 'green' } ] ]);
  });
});
