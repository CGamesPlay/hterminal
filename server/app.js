var path = require('path');
var app = require('electron').app;
var BrowserWindow = require('electron').BrowserWindow;
var dialog = require('electron').dialog;
var Menu = require('electron').Menu;
var ElectronWindow = require('./ElectronWindow');
var OfflineSession = require('./OfflineSession');

var __root;
function getRoot(cb) {
  var isDevelopment = process.env.NODE_ENV == "development";
  if (__root) {
    cb(__root);
    return;
  }
  if (isDevelopment) {
    require('./app.debug')(function(root) {
      __root = root;
      cb(__root);
    });
  } else {
    __root = "file://" + path.resolve(__dirname, "../client") + "/";
    cb(__root);
  }
}

function createWindow() {
  getRoot(function(root) {
    var prefs = {
      nodeIntegration: false,
      preload: path.resolve(__dirname, "preload.js"),
      session: OfflineSession([ root ])
    };
    var window = new BrowserWindow({ width: 800, height: 600, webPreferences: prefs });
    window.loadURL(root + "index.html");
    window.webContents.once('did-finish-load', function() {
      new ElectronWindow(window.webContents);
    });
  });
}

function handleQuit(itom, focusedWindow) {
  if (BrowserWindow.getAllWindows().length > 0) {
    var result = dialog.showMessageBox({
      type: "question",
      buttons: [ 'OK', 'Cancel' ],
      defaultId: 0,
      message: "Quit HTerminal?",
      detail: "All sessions will be closed.",
      cancelId: 1,
    });
    if (result == 0) {
      app.quit();
    }
  } else {
    app.quit();
  }
}

function handleClear(item, focusedWindow) {
  var window = ElectronWindow.fromWebContents(focusedWindow.webContents);
  if (window) {
    window.clear();
  }
}

app.on('ready', function() {
  // Create the Application's main menu
  var template = [
    {
      label: app.getName(),
      submenu: [
        { label: "About " + app.getName(), selector: "orderFrontStandardAboutPanel:" },
        { type: "separator" },
        { label: 'Services', role: 'services', submenu: [] },
        { type: 'separator' },
        { label: 'Hide ' + app.getName(), accelerator: 'Command+H', role: 'hide' },
        { label: 'Hide Others', accelerator: 'Command+Alt+H', role: 'hideothers' },
        { label: 'Show All', role: 'unhide' },
        { type: 'separator' },
        { label: "Quit", accelerator: "Command+Q", click: handleQuit },
      ]
    }, {
      label: "Shell",
      submenu: [
        { label: "New", accelerator: "CmdOrCtrl+N", click: createWindow },
        { type: "separator" },
        { label: "Close", accelerator: "CmdOrCtrl+W", role: "close" },
      ]
    }, {
      label: "Edit",
      submenu: [
        { label: "Undo", accelerator: "CmdOrCtrl+Z", role: "undo" },
        { label: "Redo", accelerator: "Shift+CmdOrCtrl+Z", role: "redo" },
        { type: "separator" },
        { label: "Cut", accelerator: "CmdOrCtrl+X", role: "cut" },
        { label: "Copy", accelerator: "CmdOrCtrl+C", role: "copy" },
        { label: "Paste", accelerator: "CmdOrCtrl+V", role: "paste" },
        { label: "Select All", accelerator: "CmdOrCtrl+A", role: "selectall" },
        { type: "separator" },
        { label: "Clear", accelerator: "CmdOrCtrl+K", click: handleClear },
      ]
    }, {
      label: 'View',
      submenu: [
        {
          label: 'Toggle Full Screen',
          accelerator: (function() {
            if (process.platform == 'darwin')
            return 'Ctrl+Command+F';
            else
            return 'F11';
          })(),
          click: function(item, focusedWindow) {
            if (focusedWindow)
              focusedWindow.setFullScreen(!focusedWindow.isFullScreen());
          }
        },
        {
          label: 'Toggle Developer Tools',
          accelerator: (process.platform == 'darwin' ? 'Alt+Command+I' : 'Ctrl+Shift+I'),
          click: function(item, focusedWindow) {
            if (focusedWindow)
              focusedWindow.webContents.toggleDevTools();
          }
        },
      ]
    }, {
      label: 'Window',
      role: 'window',
      submenu: [
        { label: 'Minimize', accelerator: 'CmdOrCtrl+M', role: 'minimize' },
        { label: 'Close', accelerator: 'CmdOrCtrl+W', role: 'close' },
      ]
    }, {
      label: "Help",
      role: "help",
      submenu: [
      ]
    }
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));

  createWindow();
});

app.on('window-all-closed', function() {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', function() {
  if (BrowserWindow.getAllWindows().length == 0) {
    createWindow();
  }
});
