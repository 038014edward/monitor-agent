// 使用中文註解
const { app, BrowserWindow, ipcMain, dialog, Tray, Menu } = require('electron/main')
const Store = require('electron-store')
const path = require('node:path')
const fs = require('node:fs')

// 初始化 electron-store
const store = new Store()

// 只有 tray 需要宣告為全域變數（防止被垃圾回收）
let tray = null

// 建立系統托盤
const createTray = (mainWindow) => {
  const iconPath = path.join(__dirname, 'assets/icon-32.png')
  tray = new Tray(iconPath)

  const contextMenu = Menu.buildFromTemplate([
    {
      label: '開啟程式',
      click: () => {
        mainWindow.show()
      }
    },
    {
      type: 'separator'
    },
    {
      label: '結束 service-monitor-agent',
      click: () => {
        app.isQuitting = true
        app.quit()
      }
    }
  ])

  tray.setToolTip('服務監控代理程式')
  tray.setContextMenu(contextMenu)

  // 點擊托盤圖示時顯示視窗
  tray.on('click', () => {
    mainWindow.show()
  })
}

// 建立主視窗
const createWindow = () => {
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    icon: path.join(__dirname, 'assets/icon.ico'), // 設定視窗圖示
    webPreferences: {
      preload: path.join(__dirname, 'preload.js') // 預載入腳本的路徑
    }
  })

  mainWindow.loadFile('index.html')

  // 視窗關閉時隱藏而不是退出
  mainWindow.on('close', (event) => {
    if (!app.isQuitting) {
      event.preventDefault()
      mainWindow.hide()
    }
  })

  // 建立托盤並傳入 mainWindow
  createTray(mainWindow)
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

// 當所有視窗關閉時不退出應用程式（因為有系統托盤）
app.on('window-all-closed', (e) => {
  e.preventDefault()
})