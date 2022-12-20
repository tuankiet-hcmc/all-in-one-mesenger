// Modules to control application life and create native browser window
const { app, BrowserWindow, ipcMain, BrowserView } = require('electron');
const path = require('path');
const notifier = require('node-notifier');
const shell = require('electron').shell;
const open = require('open');
const Store = require('electron-store');

const store = new Store();

function createWindow() {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 1200,
    titleBarStyle: 'hiddenInset',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, 'preload.js'),
      webviewTag: true
    }
  });

  // and load the index.html of the app.
  mainWindow.loadFile('index.html');

  // Open the DevTools.
  // mainWindow.webContents.openDevTools();
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Listen for web contents being created
let inputKey = {
  key: "",
  type: ""
};
app.on('web-contents-created', (eventWebContentsCreated, contents) => {
  // Check for a webview
  contents.on('will-navigate', function (eventWillNavigate, reqUrl) {
    console.log(inputKey.key, inputKey.type, reqUrl)
    if (inputKey.key === 'Meta' && inputKey.type === 'keyDown') {
      inputKey.type = "keyUp"
      eventWillNavigate.preventDefault();
      open(reqUrl, {
        app: { name: 'google chrome' }
      });
    }
  });

  contents.on('before-input-event', function (eventInputEvent, inputEvent) {
    inputKey = inputEvent;
  });

  if (contents.getType() == 'webview') {
    // Listen for any new window events
    contents.setWindowOpenHandler((data) => {
      if (inputKey.key === "Meta" && inputKey.type === "keyDown" && !data.url.includes("about:blank#blocked")) {
        inputKey.type = "keyUp"
        open(data.url, {
          app: { name: 'google chrome' }
        });
        return {
          action: 'deny'
        };
      }
      return {
        action: 'allow',
        overrideBrowserWindowOptions: { show: false }
      };
    });
  }
});

ipcMain.on('domContentLoaded', (event, data) => {
  const tabs = store.get('tabs') || {};
  event.reply('domContentLoaded', Object.values(tabs));
});

ipcMain.handle('showNoti', (event, data) => {
  notifier.notify({
    title: 'Zalo',
    message: data
  });
});

ipcMain.on('addNewTab', (event, title, url, partition) => {
  const id = `${Math.random().toString(16).slice(2)}${new Date().getTime()}`;
  store.set(`tabs.${id}`, { id, title, url, partition });
  event.reply('addNewTab', { id, title, url, partition });
});

ipcMain.on('deleteTab', (event, id) => {
  store.delete(`tabs.${id}`);
});
