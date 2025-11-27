// ==================== 引入模組 ====================
const { app, BrowserWindow, ipcMain, dialog, Tray, Menu } = require('electron/main')
const Store = require('electron-store')
const path = require('node:path')
const fs = require('node:fs')
const { exec } = require('node:child_process')
const { createApplicationMenu } = require('./menu')

// ==================== 全域變數 ====================
const store = new Store()
let mainWindow = null
let tray = null
let monitorInterval = null
let monitorConfig = {
  exePath: '',
  interval: 5
}

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
      if (config.interval !== undefined) {
        store.set('interval', config.interval)
      }
      return { success: true, message: '設定已保存成功！' }
    } catch (error) {
      return { success: false, message: '保存設定失敗：' + error.message }
    }
  })

  // 讀取設定
  ipcMain.handle('store:getConfig', async () => {
    try {
      return {
        exePath: store.get('exePath', ''),
        interval: store.get('interval', 5)
      }
    } catch (error) {
      return { exePath: '', interval: 5 }
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

  // 開始監控
  ipcMain.handle('monitor:start', async (event, config) => {
    try {
      monitorConfig = config
      startProcessMonitoring()
      return { success: true, message: '監控已啟動' }
    } catch (error) {
      return { success: false, message: '啟動監控失敗：' + error.message }
    }
  })

  // 停止監控
  ipcMain.handle('monitor:stop', async () => {
    try {
      stopProcessMonitoring()
      return { success: true, message: '監控已停止' }
    } catch (error) {
      return { success: false, message: '停止監控失敗：' + error.message }
    }
  })
}

// ==================== 6. 程式監控功能 ====================
function checkProcessRunning(exePath) {
  return new Promise((resolve) => {
    const exeName = path.basename(exePath)
    const command = `tasklist /FI "IMAGENAME eq ${exeName}" /FO CSV /NH`

    exec(command, (error, stdout) => {
      if (error) {
        resolve(false)
        return
      }

      // CSV 格式輸出,如果找到程式會包含程式名稱
      const isRunning = stdout.toLowerCase().includes(exeName.toLowerCase())
      resolve(isRunning)
    })
  })
}

function startProcessMonitoring() {
  if (monitorInterval) {
    clearInterval(monitorInterval)
  }

  const checkAndNotify = async () => {
    const isRunning = await checkProcessRunning(monitorConfig.exePath)
    const now = new Date().toLocaleTimeString('zh-TW')

    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('monitor:status-update', {
        isRunning,
        lastCheck: now,
        exePath: monitorConfig.exePath
      })
    }
  }

  // 立即執行一次
  checkAndNotify()

  // 設定定時檢查
  monitorInterval = setInterval(checkAndNotify, monitorConfig.interval * 1000)
}

function stopProcessMonitoring() {
  if (monitorInterval) {
    clearInterval(monitorInterval)
    monitorInterval = null
  }

  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('monitor:status-update', {
      isRunning: false,
      lastCheck: '-',
      exePath: '',
      stopped: true
    })
  }
}

// ==================== 5. 應用程式啟動 ====================
app.whenReady().then(() => {
  createApplicationMenu()  // 建立應用程式選單
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