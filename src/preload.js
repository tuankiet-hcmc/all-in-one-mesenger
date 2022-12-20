const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  showNoti: (message) => ipcRenderer.invoke('showNoti', message),
  addNewTab: (title, url, partition, cb) => {
    ipcRenderer.send('addNewTab', title, url, partition)
    ipcRenderer.once('addNewTab', (event, data) => {
      cb(data)
    });
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
