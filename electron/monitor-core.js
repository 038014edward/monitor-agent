const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

// 監控核心模組 - 供 CLI 和 Electron 共用

class MonitorCore {
  constructor(appDir, logCallback) {
    this.APP_DIR = appDir || __dirname;
    this.CONFIG_FILE = path.join(this.APP_DIR, 'config.ini');
    this.LOG_DIR = path.join(this.APP_DIR, 'logs');
    this.LOG_FILE = path.join(this.LOG_DIR, `monitor-${new Date().toISOString().split('T')[0]}.log`);
    this.logCallback = logCallback || null;
    this.monitorInterval = null;

    // 確保配置目錄存在
    this.ensureConfigDir();
  }

  // 確保配置目錄存在
  ensureConfigDir() {
    try {
      if (!fs.existsSync(this.APP_DIR)) {
        fs.mkdirSync(this.APP_DIR, { recursive: true });
      }
    } catch (error) {
      console.error('無法建立配置目錄:', error.message);
    }
  }

  // 確保 logs 目錄存在
  ensureLogDir() {
    try {
      if (!fs.existsSync(this.LOG_DIR)) {
        fs.mkdirSync(this.LOG_DIR, { recursive: true });
      }
    } catch (error) {
      console.error('無法建立 logs 目錄:', error.message);
    }
  }

  // 日誌函數
  log(message, type = 'INFO') {
    const timestamp = new Date().toLocaleString('zh-TW', { hour12: false });
    const logMessage = `[${timestamp}] [${type}] ${message}`;

    // 輸出到控制台
    console.log(logMessage);

    // 寫入日誌檔案
    try {
      this.ensureLogDir();
      fs.appendFileSync(this.LOG_FILE, logMessage + '\n', 'utf8');
    } catch (error) {
      console.error('無法寫入日誌檔案:', error.message);
    }

    // 回調函數（供 Electron UI 更新）
    if (this.logCallback) {
      this.logCallback({
        time: timestamp,
        type,
        message
      });
    }
  }

  // 錯誤日誌函數
  logError(message, error) {
    this.log(`${message}\n${error ? '詳細錯誤: ' + error.message : ''}`, 'ERROR');
  }

  // 解析 INI 格式配置檔
  parseIniConfig(content) {
    const config = {};
    const lines = content.split('\n');
    let currentSection = null;

    for (const line of lines) {
      const trimmedLine = line.trim();

      if (!trimmedLine || trimmedLine.startsWith(';') || trimmedLine.startsWith('#')) {
        continue;
      }

      if (trimmedLine.startsWith('[') && trimmedLine.endsWith(']')) {
        currentSection = trimmedLine.slice(1, -1);
        config[currentSection] = {};
        continue;
      }

      const eqIndex = trimmedLine.indexOf('=');
      if (eqIndex > 0) {
        const key = trimmedLine.substring(0, eqIndex).trim();
        const value = trimmedLine.substring(eqIndex + 1).trim();

        if (currentSection) {
          config[currentSection][key] = value;
        }
      }
    }

    return config;
  }

  // 載入配置
  loadConfig() {
    try {
      this.log('正在載入配置檔案...');
      this.log(`配置檔案路徑: ${this.CONFIG_FILE}`, 'DEBUG');

      if (!fs.existsSync(this.CONFIG_FILE)) {
        // 在打包後的應用程式中，無法從 app.asar 複製檔案
        // 直接返回 null，讓用戶透過 UI 設定
        this.log('找不到配置檔案，請透過 UI 介面進行設定', 'WARN');
        return null;
      }

      const configData = fs.readFileSync(this.CONFIG_FILE, 'utf8');
      const iniConfig = this.parseIniConfig(configData);
      const config = iniConfig.Process || {};

      if (config.checkInterval) {
        config.checkInterval = parseInt(config.checkInterval, 10);
      }

      if (config.exePath) {
        if (!config.processName) {
          config.processName = path.basename(config.exePath);
        }
        if (!config.workingDirectory) {
          config.workingDirectory = path.dirname(config.exePath);
        }
      }

      this.log('配置檔案載入成功');
      return config;
    } catch (error) {
      this.logError('無法讀取配置文件', error);
      return null; // 返回 null 而不是拋出錯誤，讓應用程式繼續運行
    }
  }

  // 保存配置
  saveConfig(config) {
    try {
      this.log('正在保存配置檔案...');

      const iniContent = `# 服務監控代理程式配置檔

[Process]

# 程式執行檔的完整路徑
exePath=${config.exePath}

# 檢查間隔時間（毫秒）
checkInterval=${config.checkInterval}

# 配置說明
description=監控程式
`;

      fs.writeFileSync(this.CONFIG_FILE, iniContent, 'utf8');
      this.log('配置檔案已成功保存');
      return true;
    } catch (error) {
      this.logError('無法保存配置文件', error);
      throw error;
    }
  }

  // 檢查程式是否正在執行
  checkProcess(processName) {
    return new Promise((resolve, reject) => {
      const command = `tasklist /FI "IMAGENAME eq ${processName}" /FO CSV /NH`;

      exec(command, (error, stdout, stderr) => {
        if (error) {
          this.logError('執行 tasklist 命令失敗', error);
          reject(error);
          return;
        }

        const isRunning = stdout.includes(processName);
        resolve(isRunning);
      });
    });
  }

  // 啟動程式
  startProcess(exePath, workingDirectory) {
    return new Promise((resolve, reject) => {
      this.log(`正在啟動程式: ${exePath}`);
      this.log(`工作目錄: ${workingDirectory}`);

      const command = `cd /d "${workingDirectory}" && start "" "${exePath}"`;
      this.log(`執行命令: ${command}`, 'DEBUG');

      exec(command, { encoding: 'utf8' }, (error, stdout, stderr) => {
        if (error) {
          this.logError('啟動程式失敗', error);
          reject(error);
          return;
        }
        this.log('啟動命令已執行');
        resolve();
      });
    });
  }

  // 主要監控邏輯
  async monitorService(config, statusCallback) {
    const { processName, exePath, workingDirectory, checkInterval } = config;

    this.log(`開始監控: ${processName}`);
    this.log(`檢查間隔: ${checkInterval / 1000} 秒`);
    this.log(`程式路徑: ${exePath}`);
    this.log(`工作目錄: ${workingDirectory}`);
    this.log(`日誌檔案: ${this.LOG_FILE}`);

    // 清除舊的監控
    if (this.monitorInterval) {
      clearInterval(this.monitorInterval);
    }

    this.monitorInterval = setInterval(async () => {
      try {
        const isRunning = await this.checkProcess(processName);

        // 回調狀態更新
        if (statusCallback) {
          statusCallback({
            isRunning,
            processName,
            exePath,
            checkInterval
          });
        }

        if (isRunning) {
          this.log(`✓ ${processName} 正在執行中`, 'CHECK');
        } else {
          this.log(`✗ ${processName} 未執行，準備啟動...`, 'WARN');

          await this.startProcess(exePath, workingDirectory);

          setTimeout(async () => {
            try {
              const isNowRunning = await this.checkProcess(processName);
              if (isNowRunning) {
                this.log(`✓ ${processName} 已成功啟動`, 'SUCCESS');
              } else {
                this.log(`✗ ${processName} 啟動失敗，請檢查程式路徑`, 'ERROR');
              }
            } catch (error) {
              this.logError('確認程式啟動狀態時發生錯誤', error);
            }
          }, 5000);
        }
      } catch (error) {
        this.logError('監控過程中發生錯誤', error);
      }
    }, checkInterval);
  }

  // 停止監控
  stopMonitor() {
    if (this.monitorInterval) {
      clearInterval(this.monitorInterval);
      this.monitorInterval = null;
      this.log('監控已停止', 'SYSTEM');
    }
  }
}

module.exports = MonitorCore;
