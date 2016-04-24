import React from 'react';
import ReactDOM from 'react-dom';
import Terminal from './Terminal';

document.addEventListener('DOMContentLoaded', function() {
  var terminal = <Terminal />;
  var container = document.createElement("DIV");
  document.body.appendChild(container);
  ReactDOM.render(terminal, container);
});
