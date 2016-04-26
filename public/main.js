import React from 'react';
import ReactDOM from 'react-dom';
import Terminal from './Terminal';

document.addEventListener('DOMContentLoaded', function() {
  var terminal = <Terminal />;
  var container = document.createElement("DIV");
  container.id = "react-root"
  document.body.appendChild(container);
  ReactDOM.render(terminal, container);
});
