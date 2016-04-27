var EventEmitter  = require('events');
var util = require('util');
var TerminalDecoder  = require('./TerminalDecoder');

"use strict";

function Driver() {
  if (!(this instanceof Driver)) {
    return new Driver();
  }
  EventEmitter.call(this);

  this.sections = [];
  this.decoder = new TerminalDecoder();
}
util.inherits(Driver, EventEmitter);

Driver.prototype.handleConnect = function() { };

Driver.prototype.write = function(output) {
  this.decoder.write(output, this.handleCommand.bind(this));
};

Driver.prototype.handleExit = function(code, signal) {
  console.log("exited with", code, signal);
  this.decoder.end().forEach(this.handleCommand.bind(this));
};

Driver.prototype.handleCommand = function(command) {
  if (command == 'output') {
    this.handleOutput(arguments[1]);
  } else if (command == 'insert-html') {
    this.htmlInsertNewSection(arguments[1]);
  } else if (command == 'set-title') {
    document.title = arguments[1];
  } else if (command == 'report-status') {
    // Always reply with CSI 0 n
    this.emit('input', TerminalDecoder.CSI + "0n");
  } else if (command != 'style') {
    console.log.apply(console, arguments);
  }
};

Driver.prototype.handleOutput = function(output) {
  var current_section = this.sections[this.sections.length - 1];
  if (current_section && current_section.type == "text") {
    var new_section = {
      type: "text",
      content: current_section["content"] + this.formatString(output),
    };
    this.sections = this.sections.slice(0, -1).concat(new_section);
  } else {
    var new_section = {
      type: "text",
      content: this.formatString(output),
    };
    this.sections = this.sections.concat(new_section);
  }
  this.emit('output', this.sections);
};

Driver.prototype.htmlInsertNewSection = function(html) {
  this.sections.push({ type: "html", content: html });
  this.emit('output', this.sections);
};

Driver.prototype.formatString = function(string) {
  // Note:
  //   NL -> cursor to column 0, down one line
  //   CR -> cursor to colum 0
  //   FF -> down one line
  return string
    .replace(/\x0c/g, '\n')
    .replace(/\x07/g, '\uD83D\uDD14')
    .replace(/\x0d/g, '')
    .replace(new RegExp("[" + TerminalDecoder.NON_PRINTABLE + "]", "g"), (m) => {
      return "^" + String.fromCharCode(64 + m.charCodeAt(0));
    });
};

if (module.hot) {
  module.hot.decline();
}

module.exports = Driver;
