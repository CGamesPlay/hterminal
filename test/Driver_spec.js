var Driver = require('../terminal/Driver');
var TerminalDecoder = require('../terminal/TerminalDecoder');
var expect = require('chai').expect;

var CSI = TerminalDecoder.CSI;

describe.only('Driver', function() {
  function testTextCell(width, height, lines) {
    var driver = new Driver(width, height);
    if (typeof lines == "string") {
      driver.write(lines);
    } else {
      lines.forEach((l) => {
        driver.write(l + "\r\n");
      });
    }
    return driver.getOrCreateTextSection().toString();
  }

  it('handles tab');

  it('handles line feed', function() {
    var result = testTextCell(80, 24, "abc\fdef");
    expect(result).to.equal("abc\n   def");
  });

  it('handles carriage return', function() {
    var result = testTextCell(80, 24, "abc\rdef");
    expect(result).to.equal("def");
  });

  it('handles new line', function() {
    var result = testTextCell(80, 24, "abc\ndef");
    expect(result).to.equal("abc\ndef");
  });

  it('handles backspace', function() {
    var result = testTextCell(5, 4, "ab\b\bcd");
    expect(result).to.equal("cd");
  });

  it('handles backspace on second line', function() {
    var result = testTextCell(5, 4, "abcdef\bg");
    expect(result).to.equal("abcde\ng");
  });

  it('handles backspace with wrapping', function() {
    var result = testTextCell(5, 4, "abcdef\b\bg");
    expect(result).to.equal("abcdg\nf");
  });

  it('handles backspace on first line, no wrapping', function() {
    var result = testTextCell(5, 4, "a\b\bb");
    expect(result).to.equal("b");
  });

  it('handles backspace with scrollback', function() {
    var result = testTextCell(1, 4, "abcde\b\b\b\b\bf");
    expect(result).to.equal("a\nf\nc\nd\ne");
  });

  it('handles erase line before', function() {
    var result = testTextCell(5, 4, "abcd\b\b" + CSI + "K");
    expect(result).to.equal("ab");
  });

  it('handles erase line after', function() {
    var result = testTextCell(5, 4, "abcd\b\b" + CSI + "1Ke");
    expect(result).to.equal("  ed");
  });

  it('handles erase line both', function() {
    var result = testTextCell(5, 4, "abcd\b\b" + CSI + "2Ke");
    expect(result).to.equal("  e");
  });

  it('handles erase in display above', function() {
    var result = testTextCell(5, 4, "ab\ncd\nef" + CSI + "Ag\b\b" + CSI + "1Jh");
    expect(result).to.equal("\n hg\nef");
  });

  it('handles erase in display below', function() {
    var result = testTextCell(5, 4, "ab\ncd\nef" + CSI + "Ag\b\b" + CSI + "Jh");
    expect(result).to.equal("ab\nch\n");
  });

  it('handles erase in display both', function() {
    var result = testTextCell(5, 4, "abcdefghi" + CSI + "2Jj");
    expect(result).to.equal("abcde\nfghi\n\n    j\n\n");
  });

  it('handles cursor left', function() {
    var result = testTextCell(5, 4, "abcd" + CSI + "3De");
    expect(result).to.equal("aecd");
    var result = testTextCell(5, 4, "\nabcd" + CSI + "5De");
    expect(result).to.equal("\nebcd");
  });

  it('handles cursor right', function() {
    var result = testTextCell(5, 4, "ab" + CSI + "2Ccd");
    expect(result).to.equal("ab  c\nd");
    var result = testTextCell(5, 4, "ab" + CSI + "5Ccd");
    expect(result).to.equal("ab\ncd");
  });

  it('handles cursor up', function() {
    var result = testTextCell(5, 4, "ab\ncd" + CSI + "Aef");
    expect(result).to.equal("abef\ncd");
  });

  it('handles cursor down', function() {
    var result = testTextCell(5, 4, "ab\ncd" + CSI + "Bef");
    expect(result).to.equal("ab\ncd\n  ef");
  });

  it('handles reverse index', function() {
    var result = testTextCell(5, 4, "ab\x1bMcd");
    expect(result).to.equal("  cd\nab");
  });

  it('handles line wrapping', function() {
    var result = testTextCell(5, 4, ["abcdefgh", "ijkl", "mnopqrst"]);
    expect(result).to.equal("abcde\nfgh\nijkl\nmnopq\nrst\n");
  });

  it('does not wrap before output', function() {
    var result = testTextCell(5, 4, "abcde\rf");
    expect(result).to.equal("fbcde");
  });

  it('handles delete lines', function() {
    var result = testTextCell(5, 4, "ab\ncd\nef" + CSI + "2Ag" + CSI + "Mh");
    expect(result).to.equal("cd h\nef");
    var result = testTextCell(5, 4, "ab\ncd\nef" + CSI + "2Ag" + CSI + "10Mh");
    expect(result).to.equal("   h");
  });

  it('handles tabs', function() {
    var result = testTextCell(10, 4, "a\tb\b\b\bc\t");
    expect(result).to.equal("a     c b");
    var result = testTextCell(10, 4, "a\t\tb");
    expect(result).to.equal("a        b");
  });
});
