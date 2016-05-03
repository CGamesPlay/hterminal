var app = require('electron').app;
var BrowserWindow = require('electron').BrowserWindow;
var Menu = require('electron').Menu;
var electronBridge = require('./electronBridge');

var mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({ width: 800, height: 600 });
  mainWindow.loadURL("file://" + __dirname + "/../client/index.html");
  //mainWindow.openDevTools();
  mainWindow.on('closed', function() {
    mainWindow = null;
  });
  mainWindow.webContents.on('did-finish-load', function() {
    electronBridge.connect(mainWindow.webContents);
  });


  // Create the Application's main menu
  var template = [
    {
      label: "Application",
      submenu: [
        { label: "About HTerminal", selector: "orderFrontStandardAboutPanel:" },
        { type: "separator" },
        { label: "Quit", accelerator: "Command+Q", click: function() { app.quit(); }}
      ]
    }, {
      label: "Edit",
      submenu: [
        { label: "Undo", accelerator: "CmdOrCtrl+Z", selector: "undo:" },
        { label: "Redo", accelerator: "Shift+CmdOrCtrl+Z", selector: "redo:" },
        { type: "separator" },
        { label: "Cut", accelerator: "CmdOrCtrl+X", selector: "cut:" },
        { label: "Copy", accelerator: "CmdOrCtrl+C", selector: "copy:" },
        { label: "Paste", accelerator: "CmdOrCtrl+V", selector: "paste:" },
        { label: "Select All", accelerator: "CmdOrCtrl+A", selector: "selectAll:" }
      ]
    }
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

app.on('ready', createWindow);
app.on('window-all-closed', function() {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
app.on('activate', function() {
  if (mainWindow === null) {
    createWindow();
  }
});
