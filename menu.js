// ==================== 應用程式選單設定 ====================
const { app, Menu, shell, dialog } = require('electron')
const path = require('path')
const fs = require('fs')

function createApplicationMenu() {
  const logsDir = path.join(app.getPath('userData'), 'logs')

  // 檢查當前是否設定為開機啟動
  const isAutoLaunch = app.getLoginItemSettings().openAtLogin

  const template = [
    // 日誌選單
    {
      label: '日誌',
      submenu: [
        {
          label: '開啟日誌資料夾',
          click: async () => {
            try {
              // 確保 logs 資料夾存在
              if (!fs.existsSync(logsDir)) {
                fs.mkdirSync(logsDir, { recursive: true })
              }
              await shell.openPath(logsDir)
            } catch (error) {
              await dialog.showMessageBox({
                type: 'error',
                title: '錯誤',
                message: '開啟資料夾失敗：' + error.message,
                buttons: ['確定']
              })
            }
          }
        }
      ]
    },

    // 設定選單
    {
      label: '設定',
      submenu: [
        {
          label: '開機時自動啟動',
          type: 'checkbox',
          checked: isAutoLaunch,
          click: (menuItem) => {
            const enabled = menuItem.checked
            app.setLoginItemSettings({
              openAtLogin: enabled,
              openAsHidden: true
            })
          }
        }
      ]
    },

    // 說明選單
    {
      label: '說明',
      submenu: [
        {
          label: '開發者工具',
          accelerator: 'F12',
          click: (menuItem, browserWindow) => {
            if (browserWindow) {
              browserWindow.webContents.toggleDevTools()
            }
          }
        },
        { type: 'separator' },
        {
          label: '關於',
          click: async () => {
            const { dialog } = require('electron')
            await dialog.showMessageBox({
              type: 'info',
              title: '關於 Service Monitor Agent',
              message: 'Service Monitor Agent',
              detail: `版本: ${app.getVersion()}\n\n一個簡單的服務監控代理程式`,
              buttons: ['確定']
            })
          }
        }
      ]
    },

    // 結束選單
    {
      label: '結束',
      click: () => {
        app.isQuitting = true
        app.quit()
      }
    }
  ]

  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
}

module.exports = { createApplicationMenu }
