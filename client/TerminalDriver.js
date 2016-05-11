var EventEmitter  = require('events');
var util = require('util');
var TerminalDecoder  = require('./TerminalDecoder');
import VT100Section from './VT100Section';

export default class TerminalDriver extends EventEmitter {
  constructor(width, height) {
    super();

    this.fixedSections = {};
    this.groups = [];
    this.nextUniqueId = 1;
    this.decoder = new TerminalDecoder();
    this.width = width;
    this.height = height;
    this.keypadMode = false;

    this.createPendingGroup() ;
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
    this.groups = this.groups.slice(-1);
    this.groups[0].clear();
    this.emit('update');
  }

  resize(columns, rows) {
    this.width = columns;
    this.height = rows;
    this.groups.forEach((r) => {
      r.resize(columns, rows);
    });
  }

  handleExit(code, signal) {
    this.decoder.end().forEach(this.handleCommand.bind(this));
    this.emit('exit', code, signal);
  }

  handleCommand(command) {
    var group = this.getGroup();
    if (command == 'repl-prompt') {
      if (group.hasOutput()) {
        group = this.createPendingGroup();
      }
      group.markPrompt();
    } else if (command == 'repl-output') {
      group.markOutput();
    } else if (command == 'repl-end') {
      if (group.hasOutput()) {
        group.markFinished(arguments[1]);
        group = this.createPendingGroup();
      }
    } else if (command == 'replace-fixed-html') {
      this.htmlReplaceFixedSection(arguments[1], arguments[2]);
      return true;
    } else if (command == 'set-keypad-mode') {
      this.keypadMode = arguments[1];
    } else if (group.handleCommand.apply(group, arguments)) {
      // If this was a pending Group, make sure to make it a real one now.
      this.applyPendingGroup(group);
    } else if (TerminalDriver.passAlongCommands.indexOf(command) != -1) {
      this.emit.apply(this, arguments);
    }
  }

  htmlReplaceFixedSection(id, html) {
    if (this.fixedSections[id]) {
      this.fixedSections[id] = { type: "html", id: id, content: html };
    }
    this.emit('update');
  }

  createPendingGroup() {
    if (!this.pendingGroup) {
      this.pendingGroup = new Group(this, this.nextUniqueId);
      this.nextUniqueId += 1;
    }
    return this.pendingGroup;
  }

  getGroup() {
    if (this.pendingGroup) {
      return this.pendingGroup;
    } else if (!this.groups[this.groups.length - 1].isFinished()) {
      return this.groups[this.groups.length - 1];
    } else {
      return this.createPendingGroup();
    }
  }

  applyPendingGroup(group) {
    if (this.pendingGroup) {
      this.pendingGroup.on('update', this.emit.bind(this, 'update'));
      this.groups.push(this.pendingGroup);
      this.emit('update');
      this.pendingGroup = null;
    }
  }
}

TerminalDriver.passAlongCommands = [
  'set-title',
  'send-report',
];

export class Group extends EventEmitter {
  constructor(driver, uniqueId) {
    super();

    if (!uniqueId) {
      throw new Error("Internal error - Group created without unique ID");
    }

    this.driver = driver;
    this.uniqueId = uniqueId;
    this.sections = [];
    this.state = null;
  }

  hasOutput() {
    return this.state == "running";
  }

  isFinished() {
    return this.state == "finished";
  }

  markPrompt() {
    this.state = "prompt";
  }

  markOutput() {
    this.state = "running";
    this.forceNewTextCell = true;
  }

  markFinished(status) {
    this.state = "finished";
    this.cleanupTextSection();
  }

  // User initiated screen clear
  clear() {
    this.deactivateAlternateScreen();
    this.sections = this.sections.slice(-1);
    if (this.sections[0] instanceof VT100Section) {
      this.sections[0].userInitiatedClear();
    }
    this.emit('update');
  }

  resize(columns, rows) {
    this.sections.forEach((s) => {
      if (s instanceof VT100Section) {
        s.resize(columns, rows);
      }
    });
  }

  handleCommand(command) {
    if (VT100Section.handledCommands[command]) {
      var section = this.getOrCreateVT100Section();
      var funcName = VT100Section.handledCommands[command];
      if (typeof funcName !== "string" || typeof section[funcName] !== 'function') {
        throw new Error("Internal error: invalid VT100Section.handledCommands value: " + command);
      }
      section[funcName].apply(section, Array.prototype.slice.call(arguments, 1));
      this.emit('update');
      return true;
    } else if (command == 'use-alternate-screen') {
      if (arguments[1]) {
        this.activateAlternateScreen();
      } else {
        this.deactivateAlternateScreen();
      }
      return true;
    } else if (command == 'insert-html') {
      this.htmlInsertNewSection(arguments[1]);
      return true;
    } else if (command == 'replace-html') {
      this.htmlReplaceSection(arguments[1]);
      return true;
    } else {
      return false;
    }
  }

  getOrCreateVT100Section() {
    var current_section = this.sections[this.sections.length - 1];
    if (!this.forceNewTextCell && current_section && current_section instanceof VT100Section) {
      return current_section;
    } else {
      this.forceNewTextCell = false;
      this.cleanupTextSection();
      var new_section = new VT100Section(this.driver.width, this.driver.height);
      new_section.className = this.sectionClassName();
      this.sections.push(new_section);
      return new_section;
    }
  }

  createHTMLSection(content) {
    return { type: "html", content: content, className: this.sectionClassName() };
  }

  sectionClassName() {
    if (this.state == "prompt") {
      return "repl-prompt";
    } else if (this.state == "running") {
      return "repl-output";
    }
  }

  activateAlternateScreen() {
    if (!this.usingAlternateScreen) {
      this.usingAlternateScreen = true;
      var new_section = new VT100Section(this.driver.width, this.driver.height);
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
    this.cleanupTextSection();
    this.sections.push(this.createHTMLSection(html));
    this.emit('update');
  }

  htmlReplaceSection(html) {
    this.cleanupTextSection();
    if (this.sections[this.sections.length - 1].type === "html") {
      // Replace the bottom section
      if (html.length > 0) {
        this.sections[this.sections.length - 1] = this.createHTMLSection(html);
      } else {
        this.sections.pop();
      }
    } else {
      // Insert a new unnamed HTML section
      if (html.length > 0) {
        this.htmlInsertNewSection(null, html);
      }
    }
    this.emit('update');
  }

  // Clean up extra blank lines at the end of the previous text section. If the
  // result is an empty text section, delete it.
  cleanupTextSection() {
    this.deactivateAlternateScreen();
    var current_section = this.sections[this.sections.length - 1];
    if (current_section instanceof VT100Section) {
      current_section.trimLines();
      if (current_section.isBlank()) {
        this.sections.pop();
      }
    }
  }
}
