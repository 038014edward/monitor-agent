// ==================== 應用程式選單設定 ====================
const { app, Menu } = require('electron')

function createApplicationMenu() {
  const template = [
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
