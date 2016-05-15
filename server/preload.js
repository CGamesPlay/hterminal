var ipcRenderer = require('electron').ipcRenderer;
var webFrame = require('electron').webFrame;

webFrame.setZoomLevelLimits(1, 1);

function windowMethod(method) {
  return function() {
    if (typeof window[method] === 'function') {
      window[method].apply(window, Array.prototype.slice.call(arguments, 1));
    }
  };
}

ipcRenderer.on('connected', windowMethod('onTerminalConnected'));
ipcRenderer.on('output', windowMethod('onTerminalOutput'));
ipcRenderer.on('clear', windowMethod('onTerminalClear'));
ipcRenderer.on('exit', windowMethod('onTerminalExit'));

window.terminalWrite = function(data) {
  ipcRenderer.send('data', data);
};

window.terminalResize = function(columns, rows) {
  ipcRenderer.send('resize', columns, rows);
}
