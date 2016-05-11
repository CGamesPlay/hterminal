var EventEmitter  = require('events');
var util = require('util');
var TerminalDecoder  = require('./TerminalDecoder');
import VT100Section from './VT100Section';

export default class TerminalDriver extends EventEmitter {
  constructor(width, height) {
    super();

    this.fixedSections = {};
    this.sections = [];
    this.decoder = new TerminalDecoder();
    this.width = width;
    this.height = height;
    this.keypadMode = false;
  }

  // Set the list of well-known sections
  setFixedSections(ids) {
    let newSections = {};
    ids.forEach((id) => {
      if (this.fixedSections[id]) {
        newSections[id] = this.fixedSections[id];
      } else {
        newSections[id] = { type: "html", content: "" };
      }
    });
    this.fixedSections = newSections;
  }

  write(output) {
    this.decoder.write(output, this.handleCommand.bind(this));
  }

  // User initiated screen clear
  clear() {
    this.deactivateAlternateScreen();
    this.sections = this.sections.slice(-1);
    if (this.sections[0] instanceof VT100Section) {
      this.sections[0].userInitiatedClear();
    }
    this.emit('output');
  }

  resize(columns, rows) {
    this.width = columns;
    this.height = rows;
    this.sections.forEach((s) => {
      if (s instanceof VT100Section) {
        s.resize(columns, rows);
      }
    });
  }

  handleExit(code, signal) {
    this.decoder.end().forEach(this.handleCommand.bind(this));
    this.emit('exit', code, signal);
  }

  handleCommand(command) {
    if (VT100Section.handledCommands[command]) {
      var section = this.getOrCreateVT100Section();
      var funcName = VT100Section.handledCommands[command];
      if (typeof funcName !== "string" || typeof section[funcName] !== 'function') {
        throw new Error("Internal error: invalid VT100Section.handledCommands value: " + command);
      }
      section[funcName].apply(section, Array.prototype.slice.call(arguments, 1));
      this.emit('output');
    } else if (command == 'use-alternate-screen') {
      if (arguments[1]) {
        this.activateAlternateScreen();
      } else {
        this.deactivateAlternateScreen();
      }
    } else if (command == 'insert-html') {
      this.htmlInsertNewSection(arguments[1]);
    } else if (command == 'replace-html') {
      this.htmlReplaceSection(arguments[1]);
    } else if (command == 'replace-fixed-html') {
      this.htmlReplaceFixedSection(arguments[1], arguments[2]);
    } else if (command == 'set-keypad-mode') {
      this.keypadMode = arguments[1];
    } else if (TerminalDriver.passAlongCommands.indexOf(command) != -1) {
      this.emit.apply(this, arguments);
    }
  }

  getOrCreateVT100Section() {
    var current_section = this.sections[this.sections.length - 1];
    if (current_section && current_section instanceof VT100Section) {
      return current_section;
    } else {
      var new_section = new VT100Section(this.width, this.height);
      this.sections.push(new_section);
      return new_section;
    }
  }

  activateAlternateScreen() {
    if (!this.usingAlternateScreen) {
      this.usingAlternateScreen = true;
      var new_section = new VT100Section(this.width, this.height);
      new_section.scrollbackLimit = 0;
      this.sections.push(new_section);
    }
  }

  deactivateAlternateScreen() {
    if (this.usingAlternateScreen) {
      this.usingAlternateScreen = false;
      if (!(this.sections[this.sections.length - 1] instanceof VT100Section)) {
        throw new Error("Internal error: alternate screen aborted");
      }
      this.sections.pop();
    }
  }

  htmlInsertNewSection(html) {
    this.prepareForHTML();
    this.sections.push({ type: "html", content: html });
    this.emit('output');
  }

  htmlReplaceSection(html) {
    this.prepareForHTML();
    if (this.sections[this.sections.length - 1].type === "html") {
      // Replace the bottom section
      if (html.length > 0) {
        this.sections[this.sections.length - 1] = { type: "html", id: id, content: html };
      } else {
        this.sections.pop();
      }
    } else {
      // Insert a new unnamed HTML section
      if (html.length > 0) {
        this.htmlInsertNewSection(null, html);
      }
    }
    this.emit('output');
  }

  htmlReplaceFixedSection(id, html) {
    if (this.fixedSections[id]) {
      this.fixedSections[id] = { type: "html", id: id, content: html };
    }
    this.emit('output');
  }

  prepareForHTML(html) {
    this.deactivateAlternateScreen();
    // If the latest cell is a single-line blank text cell, delete it.
    var current_section = this.sections[this.sections.length - 1];
    if (current_section instanceof VT100Section && current_section.isBlank()) {
      this.sections.pop();
    }
  }
}

TerminalDriver.passAlongCommands = [
  'set-title',
  'send-report',
];
