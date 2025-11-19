const { app, BrowserWindow, Tray, Menu, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

// 匯入監控核心
const MonitorCore = require('./monitor-core');

let mainWindow = null;
let tray = null;
let monitor = null;
let currentStatus = {
  isRunning: false,
  processName: '',
  exePath: '',
  checkInterval: 0
};

// 建立系統匣圖示
function createTray() {
  // 暫時不使用圖示，避免找不到圖示檔案的錯誤
  // 在 Windows 上，null 會使用預設圖示
  const iconPath = path.join(__dirname, '../build/icon.ico');

  // 檢查圖示檔案是否存在
  if (fs.existsSync(iconPath)) {
    tray = new Tray(iconPath.replace(/\\/g, '/'));
  } else {
    // 如果圖示不存在，使用 null（Windows 會使用預設圖示）
    tray = new Tray(require('electron').nativeImage.createEmpty());
  }

  updateTrayMenu();

  // 雙擊系統匣圖示顯示主視窗
  tray.on('double-click', () => {
    if (mainWindow) {
      mainWindow.show();
    }
  });
}

// 建立主視窗
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 700,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  // 關閉視窗時最小化到系統匣，而不是退出
  mainWindow.on('close', (event) => {
    if (!app.isQuitting) {
      event.preventDefault();
      mainWindow.hide();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// 應用程式準備就緒
app.whenReady().then(() => {
  createWindow();
  createTray();

  // 初始化監控核心：使用 userData 目錄（可寫入）而非 app.asar（只讀）
  // 在開發環境中使用 appPath，在打包後使用 userData
  const userDataPath = app.getPath('userData');
  const appDir = app.isPackaged ? userDataPath : app.getAppPath();

  monitor = new MonitorCore(appDir, (logData) => {
    // 傳送日誌到 UI
    if (mainWindow) {
      mainWindow.webContents.send('log-message', logData);
    }
  });

  // 載入配置並啟動監控
  const config = monitor.loadConfig();
  if (config) {
    monitor.monitorService(config, (status) => {
      // 更新狀態
      currentStatus = status;

      // 傳送狀態到 UI
      if (mainWindow) {
        mainWindow.webContents.send('monitor-status', status);
      }

      // 更新系統匣選單
      updateTrayMenu();
    });
  } else {
    // 配置不存在，等待用戶透過 UI 設定
    console.log('等待用戶設定監控配置...');
  }
});

// 更新系統匣選單
function updateTrayMenu() {
  if (tray) {
    const statusText = currentStatus.isRunning ? '✓ 正在執行' : '✗ 未執行';
    const processInfo = currentStatus.processName || '未知程式';

    const contextMenu = Menu.buildFromTemplate([
      {
        label: '顯示主視窗',
        click: () => {
          if (mainWindow) {
            mainWindow.show();
          }
        }
      },
      { type: 'separator' },
      {
        label: `監控: ${processInfo}`,
        enabled: false
      },
      {
        label: `狀態: ${statusText}`,
        enabled: false
      },
      { type: 'separator' },
      {
        label: '退出',
        click: () => {
          app.isQuitting = true;
          app.quit();
        }
      }
    ]);

    tray.setToolTip(`服務監控代理程式\n${processInfo}: ${statusText}`);
    tray.setContextMenu(contextMenu);
  }
}

// macOS 特定處理
app.on('window-all-closed', () => {
  // 在 macOS 上，除非明確退出，否則應用程式會繼續執行
  if (process.platform !== 'darwin') {
    // Windows/Linux: 保持執行（因為有系統匣圖示）
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// 處理退出前的清理
app.on('before-quit', () => {
  app.isQuitting = true;
});

// IPC 處理器：開啟檔案選擇對話框
ipcMain.handle('dialog:openFile', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [
      { name: '執行檔', extensions: ['exe'] },
      { name: '所有檔案', extensions: ['*'] }
    ]
  });

  if (!result.canceled && result.filePaths.length > 0) {
    return result.filePaths[0];
  }
  return null;
});

// IPC 處理器：載入當前配置
ipcMain.handle('config:load', async () => {
  try {
    if (monitor) {
      const config = monitor.loadConfig();
      return {
        success: true,
        config: config
      };
    }
    return { success: false, error: '監控核心未初始化' };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// IPC 處理器：保存配置
ipcMain.handle('config:save', async (event, configData) => {
  try {
    if (monitor) {
      monitor.saveConfig(configData);

      // 停止現有監控
      monitor.stopMonitor();

      // 重新啟動監控
      monitor.monitorService(configData, (status) => {
        currentStatus = status;
        if (mainWindow) {
          mainWindow.webContents.send('monitor-status', status);
        }
        updateTrayMenu();
      });

      return { success: true };
    }
    return { success: false, error: '監控核心未初始化' };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

