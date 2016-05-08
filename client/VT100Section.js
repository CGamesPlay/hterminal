import htmlspecialchars from './util/htmlspecialchars';

export default class VT100Section {
  constructor(width, height) {
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
    this.scrollbackLimit = -1;

    this.tabStops = new Array(Math.floor(this.width / 8));
    for (var i = 0; i < this.width / 8; i++) {
      this.tabStops[i] = i * 8;
    }
  }

  output(text) {
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
  }

  style(style) {
    // Not implemented
  }

  // Move cursor to left margin
  carriageReturn() {
    this.x = 0;
  }

  // Move the cursor down, scrolling if necessary.
  lineFeed() {
    this.y += 1;
    this._allocateLinesForCursor();
  }

  // Move the cursor back, possibly wrapping around to the previous line.
  backspace() {
    if (this.x == 0) {
      // Move up if not on the first line
      if (this.y != this._screenTop()) {
        this.y -= 1;
        this.x = this.width - 1;
      }
    } else {
      this.x -= 1;
    }
  }

  // Move the cursor to the next tab stop
  tab() {
    var newX = this._tabStopAfter(this.x);
    this.output(" ".repeat(newX - this.x));
  }

  // Erase all characters before the cursor and/or after the cursor.
  eraseLine(before, after) {
    if (after) {
      this.lines[this.y] = this.lines[this.y].slice(0, this.x);
    }
    if (before) {
      this.lines[this.y] =
        " ".repeat(this.x + 1) + // Blanks
        this.lines[this.y].substr(this.x + 1); // Remainder
    }
  }

  // Erase all characters before the cursor and/or after the cursor.
  eraseDisplay(above, below) {
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
  }

  cursorLeft(n) {
    this.x = Math.max(0, this.x - n);
  }

  cursorRight(n) {
    this.x = Math.max(0, this.x + n);
  }

  cursorUp(n) {
    this.y = Math.max(this._screenTop(), this.y - n);
  }

  cursorDown(n) {
    this.y = Math.min(this._screenTop() + this.height, this.y + n);
    while (this.y >= this.lines.length) {
      this._allocateLine();
    }
  }

  // Move cursor to a 1-based coordinate
  moveCursor(x, y) {
    x = Math.min(Math.max(1, x), this.width) - 1;
    y = Math.min(Math.max(1, y), this.height) - 1;
    this.x = x;
    this.y = this._screenTop() + y;
    this._allocateLinesForCursor();
  }

  // Move cursor to a 1-based coordinate
  setCursorX(x) {
    x = Math.min(Math.max(1, x), this.width) - 1;
    this.x = x;
  }

  // Move cursor to a 1-based coordinate
  setCursorY(y) {
    y = Math.min(Math.max(1, y), this.height) - 1;
    this.y = this._screenTop() + y;
    this._allocateLinesForCursor();
  }

  // Scroll up one line.
  reverseIndex() {
    if (this.y == this._screenTop()) {
      if (this.y == 0) {
        // If there's no scrollback, insert a new blank line
        this.lines.splice(this._screenTop(), 0, "");
      } else {
        // Just erase the bottom line of the display, causing everything to scroll
        // up one line. Need to maintian the same relative position of the cursor.
        this.y -= 1;
      }
      // Delete the bottom line if it is below the bottom of the screen
      this.lines.splice(this._screenTop() + this.height - 1, 1);
    } else {
      // Otherwise, move the cursor up one line
      this.y -= 1;
    }
  }

  // Insert blanks after the cursor, truncating the current line if needed.
  insertCharacters(n) {
    this.lines[this.y] =
      this.lines[this.y].substr(0, this.x) + // Before portion
      " ".repeat(n) + // Inserted portion
      this.lines[this.y].substring(this.x, this.width); // After portion
  }

  // Delete characters after the cursor on the same line
  deleteCharacters(n) {
    this.lines[this.y] =
      this.lines[this.y].slice(0, this.x) +
      this.lines[this.y].slice(this.x + n);
  }

  // Inserts blank lines after the cursor, moving later lines down.
  insertLines(n) {
    for (var i = 0; i < n; i++) {
      this.lines.splice(this.y + 1, 0, "");
    }
    // Delete any lines below the bottom of the screen.
    this.lines.splice(this._screenTop() + this.height - 1, n);
  }

  // Deletes lines after the cursor, moving later lines up.
  deleteLines(n) {
    this.lines.splice(this.y, n);
    this._allocateLinesForCursor();
  }

  userInitiatedClear() {
    // Clear all lines from the display, leaving only the line with the cursor.
    this.lines = this.lines.slice(this.y, this.y + 1);
    this.y = 0;
  }

  _tabStopAfter(x) {
    return this.tabStops.find((x) => x > this.x) || this.width - 1;
  }

  // Find the y offset of the topmost visible screen line
  _screenTop() {
    return Math.max(0, this.lines.length - this.height);
  }

  _allocateLinesForCursor() {
    while (this.y >= this.lines.length) {
      this._allocateLine();
    }
  }

  _allocateLine() {
    this.lines.push("");
    // Enforce scrollback limits
    if (this.scrollbackLimit != -1 && this.lines.length > this.scrollbackLimit + this.height) {
      this.lines = this.lines.slice(1);
      this.y -= 1;
    }
  }

  // Allocate space on current line for cursor
  _allocateSpaceOnLine() {
    this.lines[this.y] += " ".repeat(Math.max(0, this.x - this.lines[this.y].length));
  }

  resize(width, height) {
    if (this.width < 1 || this.height < 1) {
      throw new RangeError("Invalid size for VT100Section");
    }
    // TODO - store these but don't actually *do* the reflow until toString gets
    // called. This will be faster once infinite scrolling is implemented.
    this.width = width;
    this.height = height;
  }

  isBlank() {
    return this.lines.length == 1 && /^\s+$/.test(this.lines[0]);
  }

  toString() {
    return this.lines.join("\n");
  }

  toHTML() {
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
  }
}

// Maps from TerminalDecoder events to metods on VT100Section.
VT100Section.handledCommands = {
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
  "set-cursor-x": "setCursorX",
  "set-cursor-y": "setCursorY",
  "reverse-index": "reverseIndex",
  "insert-characters": "insertCharacters",
  "delete-characters": "deleteCharacters",
  "insert-lines": "insertLines",
  "delete-lines": "deleteLines",
};
