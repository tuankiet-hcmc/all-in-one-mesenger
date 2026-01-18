const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  showNoti: (message) => ipcRenderer.invoke('showNoti', message),
  addNewTab: (title, url, partition, cb) => {
    ipcRenderer.send('addNewTab', title, url, partition)
    ipcRenderer.once('addNewTab', (event, data) => {
      cb(data)
    });
  },
  updateTab: (data) => {
    ipcRenderer.send('updateTab', data)
  },
  deleteTab: (id) => {
    ipcRenderer.send('deleteTab', id)
  },
  domContentLoaded: (message, cb) => {
    ipcRenderer.send('domContentLoaded', message);
    ipcRenderer.once('domContentLoaded', (event, data) => {
      cb(data)
    });
  }
});

// Expose ipcRenderer for the Chat Tabs Manager UI
contextBridge.exposeInMainWorld('electron', {
  ipcRenderer: {
    send: (channel, ...args) => {
      const validChannels = ['domContentLoaded', 'addNewTab', 'updateTab', 'deleteTab'];
      if (validChannels.includes(channel)) {
        ipcRenderer.send(channel, ...args);
      }
    },
    on: (channel, func) => {
      const validChannels = ['domContentLoaded', 'addNewTab'];
      if (validChannels.includes(channel)) {
        ipcRenderer.on(channel, (event, ...args) => func(event, ...args));
      }
    },
    once: (channel, func) => {
      const validChannels = ['domContentLoaded', 'addNewTab'];
      if (validChannels.includes(channel)) {
        ipcRenderer.once(channel, (event, ...args) => func(event, ...args));
      }
    }
  }
});
