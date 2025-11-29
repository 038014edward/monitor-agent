const { contextBridge, ipcRenderer } = require('electron')

// 暴露功能給 renderer
contextBridge.exposeInMainWorld('electronAPI', {
  openFile: () => ipcRenderer.invoke('dialog:openFile'),
  checkFileExists: (filePath) => ipcRenderer.invoke('file:checkExists', filePath),

  // 多程式監控設定
  saveMonitors: (monitors) => ipcRenderer.invoke('store:saveMonitors', monitors),
  getMonitors: () => ipcRenderer.invoke('store:getMonitors'),

  // 監控相關功能
  startMonitoring: (config) => ipcRenderer.invoke('monitor:start', config),
  stopMonitoring: (id) => ipcRenderer.invoke('monitor:stop', id),
  stopAllMonitoring: () => ipcRenderer.invoke('monitor:stopAll'),
  updateAutoRestart: (id, autoRestart) => ipcRenderer.invoke('monitor:updateAutoRestart', id, autoRestart),

  // 啟動程式
  launchProgram: (exePath) => ipcRenderer.invoke('program:launch', exePath),

  // 日誌相關功能
  getMonitorLog: (exePath) => ipcRenderer.invoke('log:getMonitorLog', exePath),

  // 監聽監控狀態更新
  onMonitorStatus: (callback) => {
    ipcRenderer.on('monitor:status-update', (event, data) => callback(data))
  }
})