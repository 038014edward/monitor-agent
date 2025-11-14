const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const version = require('./package.json').version;

// 取得執行檔所在目錄（pkg 打包後使用 process.execPath）
const APP_DIR = process.pkg ? path.dirname(process.execPath) : __dirname;

// 配置檔案路徑
const CONFIG_FILE = path.join(APP_DIR, 'config.json');
const LOG_DIR = path.join(APP_DIR, 'logs');
const LOG_FILE = path.join(LOG_DIR, `monitor-${new Date().toISOString().split('T')[0]}.log`);

// 確保 logs 目錄存在（延遲建立，避免 pkg 打包問題）
function ensureLogDir() {
  try {
    if (!fs.existsSync(LOG_DIR)) {
      fs.mkdirSync(LOG_DIR, { recursive: true });
    }
  } catch (error) {
    console.error('無法建立 logs 目錄:', error.message);
  }
}

// 日誌函數
function log(message, type = 'INFO') {
  const timestamp = new Date().toLocaleString('zh-TW', { hour12: false });
  const logMessage = `[${timestamp}] [${type}] ${message}`;

  // 輸出到控制台
  console.log(logMessage);

  // 寫入日誌檔案
  try {
    ensureLogDir();
    fs.appendFileSync(LOG_FILE, logMessage + '\n', 'utf8');
  } catch (error) {
    // 如果無法寫入檔案，至少在控制台顯示
    console.error('無法寫入日誌檔案:', error.message);
  }
}

// 錯誤日誌函數
function logError(message, error) {
  const timestamp = new Date().toLocaleString('zh-TW', { hour12: false });
  const logMessage = `[${timestamp}] [ERROR] ${message}\n${error ? '詳細錯誤: ' + error.message : ''}`;

  // 輸出到控制台
  console.error(logMessage);

  // 寫入日誌檔案
  try {
    ensureLogDir();
    fs.appendFileSync(LOG_FILE, logMessage + '\n', 'utf8');
  } catch (err) {
    // 如果無法寫入檔案，至少在控制台顯示
    console.error('無法寫入日誌檔案:', err.message);
  }
}

// 載入配置
function loadConfig() {
  try {
    log('正在載入配置檔案...');
    log(`配置檔案路徑: ${CONFIG_FILE}`, 'DEBUG');

    if (!fs.existsSync(CONFIG_FILE)) {
      throw new Error(`找不到配置檔案: ${CONFIG_FILE}\n請確認 config.json 與程式在同一目錄`);
    }

    const configData = fs.readFileSync(CONFIG_FILE, 'utf8');
    const config = JSON.parse(configData);
    log('配置檔案載入成功');
    return config;
  } catch (error) {
    logError('無法讀取配置文件', error);
    console.error('\n按任意鍵退出...');
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.once('data', () => {
      process.exit(1);
    });
    // 如果 30 秒內沒有按鍵，自動退出
    setTimeout(() => {
      process.exit(1);
    }, 30000);
  }
}

// 檢查程式是否正在執行
function checkProcess(processName) {
  return new Promise((resolve, reject) => {
    const command = `tasklist /FI "IMAGENAME eq ${processName}" /FO CSV /NH`;

    exec(command, (error, stdout, stderr) => {
      if (error) {
        logError('執行 tasklist 命令失敗', error);
        reject(error);
        return;
      }

      // 如果輸出包含程式名稱，表示程式正在執行
      const isRunning = stdout.includes(processName);
      resolve(isRunning);
    });
  });
}

// 啟動程式
function startProcess(exePath, workingDirectory) {
  return new Promise((resolve, reject) => {
    log(`正在啟動程式: ${exePath}`);
    log(`工作目錄: ${workingDirectory}`);

    // 使用 cmd 的 start 命令，避免 PowerShell 編碼問題
    const command = `cd /d "${workingDirectory}" && start "" "${exePath}"`;
    log(`執行命令: ${command}`, 'DEBUG');

    exec(command, { encoding: 'utf8' }, (error, stdout, stderr) => {
      if (error) {
        logError('啟動程式失敗', error);
        reject(error);
        return;
      }
      log('啟動命令已執行');
      resolve();
    });
  });
}

// 主要監控邏輯
async function monitorService(config) {
  const { processName, exePath, workingDirectory, checkInterval } = config;

  log(`開始監控: ${processName}`);
  log(`檢查間隔: ${checkInterval / 1000} 秒`);
  log(`程式路徑: ${exePath}`);
  log(`工作目錄: ${workingDirectory}`);
  log(`日誌檔案: ${LOG_FILE}`);
  console.log('---'.repeat(20));

  setInterval(async () => {
    try {
      const isRunning = await checkProcess(processName);

      if (isRunning) {
        log(`✓ ${processName} 正在執行中`, 'CHECK');
      } else {
        log(`✗ ${processName} 未執行，準備啟動...`, 'WARN');

        await startProcess(exePath, workingDirectory);

        // 等待 5 秒後確認是否啟動成功
        setTimeout(async () => {
          try {
            const isNowRunning = await checkProcess(processName);
            if (isNowRunning) {
              log(`✓ ${processName} 已成功啟動`, 'SUCCESS');
            } else {
              log(`✗ ${processName} 啟動失敗，請檢查程式路徑`, 'ERROR');
            }
          } catch (error) {
            logError('確認程式啟動狀態時發生錯誤', error);
          }
        }, 5000);
      }
    } catch (error) {
      logError('監控過程中發生錯誤', error);
    }
  }, checkInterval);
}

// 程式入口
function main() {

  console.log('========================================');
  console.log(`   服務監控代理程式 v${version}`);
  console.log('========================================');
  console.log('');

  log('========== 程式啟動 ==========', 'SYSTEM');

  const config = loadConfig();

  // 驗證配置
  if (!config.processName || !config.exePath) {
    logError('配置文件中缺少必要參數 (processName, exePath)');
    console.error('\n按任意鍵退出...');
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.once('data', () => {
      process.exit(1);
    });
    setTimeout(() => {
      process.exit(1);
    }, 30000);
    return;
  }

  log(`驗證配置: processName=${config.processName}`, 'SYSTEM');
  log(`驗證配置: exePath=${config.exePath}`, 'SYSTEM');

  // 檢查執行檔是否存在
  if (!fs.existsSync(config.exePath)) {
    logError(`找不到執行檔: ${config.exePath}`);
    console.error('\n請檢查 config.json 中的路徑設定是否正確');
    console.error('按任意鍵退出...');
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.once('data', () => {
      process.exit(1);
    });
    setTimeout(() => {
      process.exit(1);
    }, 30000);
    return;
  }

  log('執行檔路徑驗證成功', 'SYSTEM');

  monitorService(config);
}

// 處理程式終止
process.on('SIGINT', () => {
  console.log('\n');
  log('收到終止信號 (SIGINT)，正在停止監控服務...', 'SYSTEM');
  log('========== 程式結束 ==========', 'SYSTEM');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n');
  log('收到終止信號 (SIGTERM)，正在停止監控服務...', 'SYSTEM');
  log('========== 程式結束 ==========', 'SYSTEM');
  process.exit(0);
});

// 全域錯誤處理
process.on('uncaughtException', (error) => {
  console.error('\n========================================');
  console.error('發生未預期的錯誤:');
  console.error('========================================');
  console.error(error);
  console.error('\n請查看 logs 目錄中的日誌檔案了解詳細資訊');
  console.error('按任意鍵退出...');

  logError('未預期的錯誤', error);

  process.stdin.setRawMode(true);
  process.stdin.resume();
  process.stdin.once('data', () => {
    process.exit(1);
  });
  setTimeout(() => {
    process.exit(1);
  }, 30000);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('\n========================================');
  console.error('發生未處理的 Promise 拒絕:');
  console.error('========================================');
  console.error(reason);
  console.error('\n請查看 logs 目錄中的日誌檔案了解詳細資訊');
  console.error('按任意鍵退出...');

  logError('未處理的 Promise 拒絕', reason instanceof Error ? reason : new Error(String(reason)));

  process.stdin.setRawMode(true);
  process.stdin.resume();
  process.stdin.once('data', () => {
    process.exit(1);
  });
  setTimeout(() => {
    process.exit(1);
  }, 30000);
});

// 啟動程式
main();
