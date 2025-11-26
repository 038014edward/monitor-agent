const { contextBridge, ipcRenderer } = require('electron')

// 暴露檔案選擇功能給 renderer
contextBridge.exposeInMainWorld('electronAPI', {
  openFile: () => ipcRenderer.invoke('dialog:openFile')
})