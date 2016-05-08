import React from 'react';
import sax from 'sax';

export function parseHTML(data) {
  var parser = sax.parser(false, { lowercase: true });
  var stack = [];
  parser.onopentag = function(node) {
    stack.push(node);
    node.children = [];
  };
  parser.ontext = function(text) {
    stack[stack.length - 1].children.push(text);
  };
  parser.onclosetag = function() {
    let node = stack.pop();
    let component = React.createElement.apply(React, [ node.name, node.attributes ].concat(node.children));
    if (stack.length > 0) {
      stack[stack.length - 1].children.push(component);
    } else {
      stack.push(component);
    }
  };
  parser.write("<div>" + data + "</div>").close();
  return stack[0];
}
