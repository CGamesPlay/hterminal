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
    let type = ComponentLibrary[node.name] || ComponentLibrary['span'];
    let attributes = Object.keys(node.attributes).reduce((memo, attr) => {
      let propType = type.propTypes && type.propTypes[attr];
      if (propType && propType(node.attributes, attr) === null) {
        memo[attr] = node.attributes[attr];
      }
      return memo;
    }, {});

    if (typeof type === 'object') {
      // Convert from basic tag config object to string tag names.
      type = type.name;
    }

    let component = React.createElement.apply(React, [ type, attributes ].concat(node.children));
    if (stack.length > 0) {
      stack[stack.length - 1].children.push(component);
    } else {
      stack.push(component);
    }
  };
  parser.onerror = function(e) {
    console.error(e);
    parser.error = null;
  };
  parser.write("<div>" + data + "</div>").close();
  return stack[0];
}
