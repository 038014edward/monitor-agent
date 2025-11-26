const { contextBridge, ipcRenderer } = require('electron')

// 暴露檔案選擇功能給 renderer
contextBridge.exposeInMainWorld('electronAPI', {
  openFile: () => ipcRenderer.invoke('dialog:openFile'),
  saveConfig: (config) => ipcRenderer.invoke('store:saveConfig', config),
  getConfig: () => ipcRenderer.invoke('store:getConfig'),
  checkFileExists: (filePath) => ipcRenderer.invoke('file:checkExists', filePath)
})