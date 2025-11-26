// 使用中文註解
const { app, BrowserWindow, ipcMain, dialog } = require('electron/main')
const Store = require('electron-store')
const path = require('node:path')
const fs = require('node:fs')

// 初始化 electron-store
const store = new Store()

const createWindow = () => {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js') // 預載入腳本的路徑
    }
  })

  win.loadFile('index.html')
}

// 當 Electron 完成初始化並準備建立視窗時呼叫此方法
app.whenReady().then(() => {

  // 處理檔案選擇對話框
  ipcMain.handle('dialog:openFile', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [
        { name: '執行檔', extensions: ['exe'] },
        { name: '所有檔案', extensions: ['*'] }
      ]
    })

    if (!result.canceled && result.filePaths.length > 0) {
      return result.filePaths[0]
    }
    return null
  })

  // 處理設定保存
  ipcMain.handle('store:saveConfig', async (event, config) => {
    try {
      store.set('exePath', config.exePath)
      return { success: true, message: '設定已保存成功！' }
    } catch (error) {
      return { success: false, message: '保存設定失敗：' + error.message }
    }
  })

  // 處理讀取設定
  ipcMain.handle('store:getConfig', async () => {
    try {
      return {
        exePath: store.get('exePath', '')
      }
    } catch (error) {
      return { exePath: '' }
    }
  })

  // 處理檔案存在性驗證
  ipcMain.handle('file:checkExists', async (event, filePath) => {
    try {
      return fs.existsSync(filePath)
    } catch (error) {
      return false
    }
  })

  createWindow()

  // 在 macOS 上，當點擊停駐列圖示並且沒有其他視窗開啟時，重新建立一個視窗
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// 當所有視窗關閉時退出應用程式
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})