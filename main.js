// 使用中文註解
const { app, BrowserWindow, ipcMain } = require('electron/main')

const path = require('node:path')

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
  ipcMain.handle('ping', () => 'pong')
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