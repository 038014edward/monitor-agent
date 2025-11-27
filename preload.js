const { contextBridge, ipcRenderer } = require('electron')

// 暴露功能給 renderer
contextBridge.exposeInMainWorld('electronAPI', {
  openFile: () => ipcRenderer.invoke('dialog:openFile'),
  saveConfig: (config) => ipcRenderer.invoke('store:saveConfig', config),
  getConfig: () => ipcRenderer.invoke('store:getConfig'),
  checkFileExists: (filePath) => ipcRenderer.invoke('file:checkExists', filePath),

  // 監控相關功能
  startMonitoring: (config) => ipcRenderer.invoke('monitor:start', config),
  stopMonitoring: () => ipcRenderer.invoke('monitor:stop'),

  // 監聽監控狀態更新
  onMonitorStatus: (callback) => {
    ipcRenderer.on('monitor:status-update', (event, data) => callback(data))
  }
})