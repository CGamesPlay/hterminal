var EventEmitter  = require('events');
var util = require('util');
var TerminalDecoder  = require('./TerminalDecoder');

"use strict";

function htmlspecialchars(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
}

function TextSection(width, height) {
  if (!(this instanceof TextSection)) {
    return new TextSection(width, height);
  }
  // Assume a sane default for width and height
  if (!(width >= 1)) {
    width = 80;
  }
  if (!(height >= 1)) {
    height = 24;
  }
  this.type == "text";
  this.lines = [''];
  this.width = width;
  this.height = height;
  this.x = 0;
  this.y = 0;

  this.tabStops = new Array(Math.floor(this.width / 8));
  for (var i = 0; i < this.width / 8; i++) {
    this.tabStops[i] = i * 8;
  }
}

TextSection.prototype.output = function(text) {
  var i = 0;
  while (i < text.length) {
    if (this.x >= this.width) {
      this.y += 1;
      this.x = 0;
      this._allocateLinesForCursor();
    }
    var nextLine = text.slice(i, i + this.width - this.x);
    this._allocateSpaceOnLine();
    // Overwrite characters on the current line up to the length of the line
    this.lines[this.y] =
      this.lines[this.y].substr(0, this.x) + // Before portion
      nextLine + // Overwritten portion
      this.lines[this.y].substr(this.x + nextLine.length); // After portion
    i += nextLine.length;
    this.x += nextLine.length;
  }
  return this;
};

TextSection.prototype.style = function(style) {
  // Not implemented
};

// Move cursor to left margin
TextSection.prototype.carriageReturn = function() {
  this.x = 0;
};

// Move the cursor down, scrolling if necessary.
TextSection.prototype.lineFeed = function() {
  this.y += 1;
  this._allocateLinesForCursor();
};

// Move the cursor back, possibly wrapping around to the previous line.
TextSection.prototype.backspace = function() {
  if (this.x == 0) {
    // Move up if not on the first line
    if (this.y != this._screenTop()) {
      this.y -= 1;
      this.x = this.width - 1;
    }
  } else {
    this.x -= 1;
  }
};

// Move the cursor to the next tab stop
TextSection.prototype.tab = function() {
  var newX = this._tabStopAfter(this.x);
  this.output(" ".repeat(newX - this.x));
};

// Erase all characters before the cursor and/or after the cursor.
TextSection.prototype.eraseLine = function(before, after) {
  if (after) {
    this.lines[this.y] = this.lines[this.y].slice(0, this.x);
  }
  if (before) {
    this.lines[this.y] =
      " ".repeat(this.x + 1) + // Blanks
      this.lines[this.y].substr(this.x + 1); // Remainder
  }
};

// Erase all characters before the cursor and/or after the cursor.
TextSection.prototype.eraseDisplay = function(above, below) {
  if (below && (above || this.x == 0 && this.y == 0)) {
    // Erasing the entire screen, so just allocate enough lines to make a new
    // screenful and adjust Y.
    var screenY = this.y - this._screenTop();
    for (var i = 0; i < this.height; i++) {
      this._allocateLine();
    }
    this.y = this.lines.length - this.height + screenY;
  } else if (above) {
    // Clear all characters from the top of the screen to the cursor.
    for (var y = this._screenTop(); y < this.y; y++) {
      this.lines[y] = "";
    }
    this.eraseLine(true, false);
  } else if (below) {
    // Clear all characters from the cursor to the end of the screen.
    for (var y = this.y + 1; y < this.y + this.height && y < this.lines.length; y++) {
      this.lines[y] = "";
    }
    this.eraseLine(false, true);
  }
};

TextSection.prototype.cursorLeft = function(n) {
  this.x = Math.max(0, this.x - n);
};

TextSection.prototype.cursorRight = function(n) {
  this.x = Math.max(0, this.x + n);
};

TextSection.prototype.cursorUp = function(n) {
  this.y = Math.max(this._screenTop(), this.y - n);
};

TextSection.prototype.cursorDown = function(n) {
  this.y = Math.min(this._screenTop() + this.height, this.y + n);
  while (this.y >= this.lines.length) {
    this._allocateLine();
  }
};

// Move cursor to a 1-based coordinate
TextSection.prototype.moveCursor = function(x, y) {
  x = Math.min(Math.max(1, x), this.width) - 1;
  y = Math.min(Math.max(1, y), this.height) - 1;
  this.x = x;
  this.y = this._screenTop() + y;
  this._allocateLinesForCursor();
};

// Scroll up one line.
TextSection.prototype.reverseIndex = function() {
  if (this.y == this._screenTop()) {
    if (this.y == 0) {
      // If there's no scrollback, insert a new blank line
      this.lines.splice(this._screenTop(), 0, "");
    }
    // Delete the bottom line if it is below the bottom of the screen
    this.lines.splice(this._screenTop() + this.height - 1, 100);
  } else {
    // Otherwise, move the cursor up one line
    this.y -= 1;
  }
};

// Inserts blank lines after the cursor, moving later lines down.
TextSection.prototype.insertLines = function(n) {
    for (var i = 0; i < n; i++) {
      this.lines.splice(this.y + 1, 0, "");
    }
    // Delete any lines below the bottom of the screen.
    this.lines.splice(this._screenTop() + this.height - 1, n);
}

// Deletes lines after the cursor, moving later lines up.
TextSection.prototype.deleteLines = function(n) {
  this.lines.splice(this.y, n);
  this._allocateLinesForCursor();
};

TextSection.prototype.userInitiatedClear = function() {
  // Clear all lines from the display, leaving only the line with the cursor.
  this.lines = this.lines.slice(this.y, this.y + 1);
  this.y = 0;
};

TextSection.prototype._tabStopAfter = function(x) {
  return this.tabStops.find((x) => x > this.x) || this.width - 1;
};

// Find the y offset of the topmost visible screen line
TextSection.prototype._screenTop = function() {
  return Math.max(0, this.lines.length - this.height);
};

TextSection.prototype._allocateLinesForCursor = function() {
  while (this.y >= this.lines.length) {
    this._allocateLine();
  }
};

TextSection.prototype._allocateLine = function() {
  this.lines.push("");
};

// Allocate space on current line for cursor
TextSection.prototype._allocateSpaceOnLine = function() {
  this.lines[this.y] += " ".repeat(Math.max(0, this.x - this.lines[this.y].length));
};

TextSection.prototype.resize = function(width, height) {
  if (this.width < 1 || this.height < 1) {
    throw new RangeError("Invalid size for TextSection");
  }
  // TODO - store these but don't actually *do* the reflow until toString gets
  // called. This will be faster once infinite scrolling is implemented.
  this.width = width;
  this.height = height;
};

TextSection.prototype.toString = function() {
  return this.lines.join("\n");
};

TextSection.prototype.toHTML = function() {
  var html = this.lines.map((raw_line, y) => {
    var encoded = "";
    if (this.y == y && this.x == raw_line.length) {
      raw_line += "\u00a0";
    }
    for (var x = 0; x < raw_line.length; x++) {
      if (this.y == y && this.x == x) {
        encoded += "<span class=\"caret\">";
      }
      encoded += htmlspecialchars(raw_line[x]);
      if (this.y == y && this.x == x) {
        encoded += "</span>";
      }
    }
    return encoded;
  }).join("\n");

  if (html[html.length - 1] == "\n") {
    // If the line ends in a newline, add a space so the line appears in the browser.
    html += "\u00a0"
  }

  return { __html: html };
};

function TerminalDriver(width, height) {
  if (!(this instanceof TerminalDriver)) {
    return new TerminalDriver(width, height);
  }
  EventEmitter.call(this);

  this.sections = [];
  this.decoder = new TerminalDecoder();
  this.width = width;
  this.height = height;
  this.keypadMode = false;
}
util.inherits(TerminalDriver, EventEmitter);

TerminalDriver.prototype.write = function(output) {
  this.decoder.write(output, this.handleCommand.bind(this));
};

// User initiated screen clear
TerminalDriver.prototype.clear = function() {
  this.sections = this.sections.slice(-1);
  if (this.sections[0] instanceof TextSection) {
    this.sections[0].userInitiatedClear();
  }
  this.emit('output', this.sections);
};

TerminalDriver.prototype.resize = function(columns, rows) {
  this.width = columns;
  this.height = rows;
  this.sections.forEach((s) => {
    if (s instanceof TextSection) {
      s.resize(columns, rows);
    }
  });
};

TerminalDriver.prototype.handleExit = function(code, signal) {
  this.decoder.end().forEach(this.handleCommand.bind(this));
  this.emit('exit', code, signal);
};

TerminalDriver.prototype.textSectionCommands = {
  "output": "output",
  "style": "style",
  "backspace": "backspace",
  "tab": "tab",
  "line-feed": "lineFeed",
  "carriage-return": "carriageReturn",
  "erase-line": "eraseLine",
  "erase-display": "eraseDisplay",
  "cursor-left": "cursorLeft",
  "cursor-right": "cursorRight",
  "cursor-up": "cursorUp",
  "cursor-down": "cursorDown",
  "move-cursor": "moveCursor",
  "reverse-index": "reverseIndex",
  "insert-lines": "insertLines",
  "delete-lines": "deleteLines",
};

TerminalDriver.prototype.passAlongCommands = [
  'set-title',
  'send-report',
];

TerminalDriver.prototype.handleCommand = function(command) {
  if (this.textSectionCommands[command]) {
    var section = this.getOrCreateTextSection();
    var funcName = this.textSectionCommands[command];
    if (typeof funcName !== "string" || typeof section[funcName] !== 'function') {
      throw new Error("Invalid textSectionCommand: " + command);
    }
    section[funcName].apply(section, Array.prototype.slice.call(arguments, 1));
    this.emit('output', this.sections);
  } else if (command == 'insert-html') {
    this.htmlInsertNewSection(arguments[1]);
  } else if (command == 'set-keypad-mode') {
    this.keypadMode = arguments[1];
  } else if (this.passAlongCommands.indexOf(command) != -1) {
    this.emit.apply(this, arguments);
  }
};

TerminalDriver.prototype.getOrCreateTextSection = function() {
  var current_section = this.sections[this.sections.length - 1];
  if (current_section && current_section instanceof TextSection) {
    return current_section;
  } else {
    var new_section = new TextSection(this.width, this.height);
    this.sections.push(new_section);
    return new_section;
  }
}

TerminalDriver.prototype.htmlInsertNewSection = function(html) {
  this.sections.push({ type: "html", content: html });
  this.emit('output', this.sections);
};

module.exports = TerminalDriver;
