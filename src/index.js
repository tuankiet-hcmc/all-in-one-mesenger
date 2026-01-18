// Modules to control application life and create native browser window
const { app, BrowserWindow, ipcMain, session, systemPreferences } = require("electron");
const path = require("path");
const notifier = require("node-notifier");
const shell = require("electron").shell;
const open = require("open");
const Store = require("electron-store");

const store = new Store();

function createWindow() {
  // Create the browser window with Chat Tabs Manager UI
  const mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1200,
    minHeight: 700,
    titleBarStyle: "hiddenInset",
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, "preload.js"),
      webviewTag: true
    }
  });

  // Load the Chat Tabs Manager as the main UI
  mainWindow.loadFile(path.join(__dirname, "page/chatTabs/index.html"));

  // Open the DevTools in development
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }
  
  const ses = mainWindow.webContents.session
  ses.setPermissionRequestHandler((webContents, permission, callback) => {
    callback(true)
  })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Listen for web contents being created
let inputKey = {
  key: "",
  type: ""
};
app.on("web-contents-created", (eventWebContentsCreated, contents) => {
  // Check for a webview
  contents.on("will-navigate", function (eventWillNavigate, reqUrl) {
    if (inputKey.key === "Meta" && inputKey.type === "keyDown") {
      inputKey.type = "keyUp";
      eventWillNavigate.preventDefault();
      open(reqUrl, {
        app: { name: "microsoft edge" }
      });
    }
  });

  contents.on("before-input-event", function (eventInputEvent, inputEvent) {
    inputKey = inputEvent;
  });

  if (contents.getType() == "webview") {
    // Listen for any new window events
    contents.setWindowOpenHandler((data) => {
      if (
        inputKey.key === "Meta" &&
        inputKey.type === "keyDown" &&
        !data.url.includes("about:blank#blocked")
      ) {
        inputKey.type = "keyUp";
        open(data.url, {
          app: { name: "microsoft edge" }
        });
        return {
          action: "deny"
        };
      }
      return {
        action: "allow",
        overrideBrowserWindowOptions: { show: false }
      };
    });
  }
});

ipcMain.on("domContentLoaded", (event, data) => {
  const tabs = store.get("tabs") || {};
  event.reply("domContentLoaded", Object.values(tabs));
});

ipcMain.handle("showNoti", (event, data) => {
  notifier.notify({
    title: "Zalo",
    message: data
  });
});

ipcMain.on("addNewTab", (event, title, url, partition) => {
  const id = `${Math.random().toString(16).slice(2)}${new Date().getTime()}`;
  store.set(`tabs.${id}`, { id, title, url, partition });
  event.reply("addNewTab", { id, title, url, partition });

  session
    .fromPartition(partition)
    .setPermissionRequestHandler((webContents, permission, callback) => {
      const parsedUrl = new URL(webContents.getURL());
      const allowPermissions = ['camera', 'microphone'];

      if (allowPermissions.includes(permission)) {
        // Approves the permissions request
        callback(true);
      }

      // Verify URL
      if (parsedUrl.protocol !== "https:") {
        // Denies the permissions request
        return callback(false);
      }
    });

    session
    .fromPartition(partition)
    .setPermissionCheckHandler((webContents, permission, callback) => {
      const parsedUrl = new URL(webContents.getURL());
      const allowPermissions = ['camera', 'microphone'];

      if (allowPermissions.includes(permission)) {
        // Approves the permissions request
        callback(true);
      }

      // Verify URL
      if (parsedUrl.protocol !== "https:") {
        // Denies the permissions request
        return callback(false);
      }
    });
});

ipcMain.on("deleteTab", (event, id) => {
  store.delete(`tabs.${id}`);
});

ipcMain.on("updateTab", (event, data) => {
  const { id, title, url, partition } = data;
  const existingTab = store.get(`tabs.${id}`);
  if (existingTab) {
    store.set(`tabs.${id}`, { ...existingTab, title, url });
  }
});
