var Terminal = require('../Terminal');
var expect = require('chai').expect;

describe('Terminal', function() {
  function cat(data, next) {
    var term = new Terminal("head", [ "-n", "1" ], {});
    var output = [];
    term.write(data + "\n");

    term.on('data', function(data) {
      if (data.text) {
        output.push(data.text);
      }
    });

    term.on('exit', function(code, status) {
      expect(code).to.equal(0);
      next(output.join("").trim());
    });
  }

  it('processes simple strings', function(done) {
    cat("testing", function(output) {
      expect(output).to.equal("testing");
      done();
    });
  });

  it('processes escape sequences', function(done) {
    cat("abc" + Terminal.ESC + "def", function(output) {
      expect(output).to.equal("abc^[def");
      done();
    });
  });
});
