// ==================== 引入模組 ====================
const { app, BrowserWindow, ipcMain, dialog, Tray, Menu } = require('electron/main')
const Store = require('electron-store')
const path = require('node:path')
const fs = require('node:fs')

// ==================== 全域變數 ====================
const store = new Store()
let mainWindow = null
let tray = null

// ==================== 1. 限制單一實例 ====================
const gotTheLock = app.requestSingleInstanceLock()
if (!gotTheLock) {
  app.quit()
  process.exit(0)
}

// 當使用者嘗試開啟第二個實例時,顯示現有視窗
app.on('second-instance', () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore()
    mainWindow.show()
    mainWindow.focus()
  }
})

// ==================== 2. 建立主視窗 ====================
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    icon: path.join(__dirname, 'assets/icon.ico'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    }
  })

  mainWindow.loadFile('index.html')

  // 關閉視窗時隱藏(不退出程式)
  mainWindow.on('close', (event) => {
    if (!app.isQuitting) {
      event.preventDefault()
      mainWindow.hide()
    }
  })

  createTray()
}

// ==================== 3. 建立系統托盤 ====================
function createTray() {
  tray = new Tray(path.join(__dirname, 'assets/icon-32.png'))
  tray.setToolTip('Service Monitor Agent')

  const contextMenu = Menu.buildFromTemplate([
    {
      label: '開啟程式',
      click: () => mainWindow.show()
    },
    { type: 'separator' },
    {
      label: '結束程式',
      click: () => {
        app.isQuitting = true
        app.quit()
      }
    }
  ])

  tray.setContextMenu(contextMenu)
  tray.on('click', () => mainWindow.show())
}

// ==================== 4. IPC 通訊處理 ====================
function setupIPC() {
  // 開啟檔案選擇對話框
  ipcMain.handle('dialog:openFile', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [
        { name: '執行檔', extensions: ['exe'] },
        { name: '所有檔案', extensions: ['*'] }
      ]
    })
    return result.canceled ? null : result.filePaths[0]
  })

  // 儲存設定
  ipcMain.handle('store:saveConfig', async (event, config) => {
    try {
      store.set('exePath', config.exePath)
      return { success: true, message: '設定已保存成功！' }
    } catch (error) {
      return { success: false, message: '保存設定失敗：' + error.message }
    }
  })

  // 讀取設定
  ipcMain.handle('store:getConfig', async () => {
    try {
      return { exePath: store.get('exePath', '') }
    } catch (error) {
      return { exePath: '' }
    }
  })

  // 檢查檔案是否存在
  ipcMain.handle('file:checkExists', async (event, filePath) => {
    try {
      return fs.existsSync(filePath)
    } catch (error) {
      return false
    }
  })
}

// ==================== 5. 應用程式啟動 ====================
app.whenReady().then(() => {
  setupIPC()
  createWindow()

  // macOS: 點擊 Dock 圖示時重新建立視窗
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

// 關閉所有視窗時不退出(因為有系統托盤)
app.on('window-all-closed', (e) => {
  e.preventDefault()
})