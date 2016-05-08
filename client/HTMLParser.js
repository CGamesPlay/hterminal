import React from 'react';
import sax from 'sax';
import ComponentLibrary from './ComponentLibrary';

export function parseHTML(data) {
  var parser = sax.parser(true);
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
    let name = ComponentLibrary[node.name] || node.name;
    let component = React.createElement.apply(React, [ name, node.attributes ].concat(node.children));
    if (stack.length > 0) {
      stack[stack.length - 1].children.push(component);
    } else {
      stack.push(component);
    }
  };
  parser.write("<div>" + data + "</div>").close();
  return stack[0];
}
