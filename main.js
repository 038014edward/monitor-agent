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
// 使用 Map 來管理多個監控項目: id -> {exePath, interval, timer}
const activeMonitors = new Map()
// 日誌目錄路徑
const logsDir = path.join(app.getPath('userData'), 'logs')

// ==================== 日誌功能 ====================
// 確保日誌目錄存在
function ensureLogsDirExists() {
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true })
  }
}

// 取得今天的日期字串 (YYYY-MM-DD)
function getTodayDateString() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// 取得程式名稱（不含副檔名）
function getProgramName(exePath) {
  const fileName = path.basename(exePath)
  return fileName.replace(/\.[^/.]+$/, '') // 移除副檔名
}

// 寫入日誌到特定程式的日誌檔案
function writeLog(exePath, message) {
  ensureLogsDirExists()

  const programName = getProgramName(exePath)
  const dateString = getTodayDateString()
  const logFileName = `${programName}_${dateString}.log`
  const logFilePath = path.join(logsDir, logFileName)

  const timestamp = new Date().toLocaleString('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  })
  const logMessage = `[${timestamp}] ${message}\n`

  try {
    fs.appendFileSync(logFilePath, logMessage, 'utf8')
  } catch (error) {
    console.error('寫入日誌失敗:', error)
  }
}

// 寫入系統日誌（應用程式啟動/關閉等）
function writeSystemLog(message) {
  ensureLogsDirExists()

  const dateString = getTodayDateString()
  const logFileName = `system_${dateString}.log`
  const logFilePath = path.join(logsDir, logFileName)

  const timestamp = new Date().toLocaleString('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  })
  const logMessage = `[${timestamp}] ${message}\n`

  try {
    fs.appendFileSync(logFilePath, logMessage, 'utf8')
  } catch (error) {
    console.error('寫入日誌失敗:', error)
  }
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

  // 儲存所有監控項目設定
  ipcMain.handle('store:saveMonitors', async (event, monitors) => {
    try {
      store.set('monitors', monitors)
      return { success: true, message: '設定已保存成功！' }
    } catch (error) {
      return { success: false, message: '保存設定失敗：' + error.message }
    }
  })

  // 讀取所有監控項目設定
  ipcMain.handle('store:getMonitors', async () => {
    try {
      return store.get('monitors', [])
    } catch (error) {
      return []
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

  // 開始監控特定項目
  ipcMain.handle('monitor:start', async (event, config) => {
    try {
      const { id, exePath, interval } = config
      startProcessMonitoring(id, exePath, interval)
      return { success: true, message: '監控已啟動' }
    } catch (error) {
      return { success: false, message: '啟動監控失敗：' + error.message }
    }
  })

  // 停止監控特定項目
  ipcMain.handle('monitor:stop', async (event, id) => {
    try {
      stopProcessMonitoring(id)
      return { success: true, message: '監控已停止' }
    } catch (error) {
      return { success: false, message: '停止監控失敗：' + error.message }
    }
  })

  // 停止所有監控
  ipcMain.handle('monitor:stopAll', async () => {
    try {
      stopAllMonitoring()
      return { success: true, message: '所有監控已停止' }
    } catch (error) {
      return { success: false, message: '停止所有監控失敗：' + error.message }
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

function startProcessMonitoring(id, exePath, interval) {
  // 如果已經在監控,先停止
  if (activeMonitors.has(id)) {
    stopProcessMonitoring(id)
  }

  const exeName = path.basename(exePath)
  writeLog(exePath, `啟動監控 (間隔: ${interval}秒)`)

  const checkAndNotify = async () => {
    const isRunning = await checkProcessRunning(exePath)
    const now = new Date().toLocaleTimeString('zh-TW')
    const exeName = path.basename(exePath)
    const status = isRunning ? '執行中' : '未執行'

    // 記錄狀態變化
    const monitor = activeMonitors.get(id)
    if (monitor && monitor.lastStatus !== status) {
      writeLog(exePath, `狀態變更: ${status}`)
      monitor.lastStatus = status
    }

    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('monitor:status-update', {
        id,
        isRunning,
        lastCheck: now,
        status: isRunning ? '執行中' : '未執行'
      })
    }
  }

  // 立即執行一次
  checkAndNotify()

  // 設定定時檢查
  const timer = setInterval(checkAndNotify, interval * 1000)

  // 儲存監控資訊（加入 lastStatus 追蹤狀態變化）
  activeMonitors.set(id, { exePath, interval, timer, lastStatus: null })
} function stopProcessMonitoring(id) {
  const monitor = activeMonitors.get(id)
  if (monitor) {
    clearInterval(monitor.timer)
    activeMonitors.delete(id)

    writeLog(monitor.exePath, '停止監控')

    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('monitor:status-update', {
        id,
        stopped: true,
        lastCheck: '-',
        status: '未監控'
      })
    }
  }
}

function stopAllMonitoring() {
  const count = activeMonitors.size
  activeMonitors.forEach((monitor, id) => {
    clearInterval(monitor.timer)
  })
  activeMonitors.clear()

  if (count > 0) {
    writeSystemLog(`停止所有監控 (${count} 個項目)`)
  }
}

// ==================== 5. 應用程式啟動 ====================
app.whenReady().then(() => {
  writeSystemLog('========== 應用程式啟動 ==========')
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

// 應用程式退出時記錄
app.on('before-quit', () => {
  writeSystemLog('========== 應用程式關閉 ==========')
})