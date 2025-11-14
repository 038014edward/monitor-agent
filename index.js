const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

// 配置檔案路徑
const CONFIG_FILE = path.join(__dirname, 'config.json');

// 載入配置
function loadConfig() {
  try {
    const configData = fs.readFileSync(CONFIG_FILE, 'utf8');
    return JSON.parse(configData);
  } catch (error) {
    console.error('無法讀取配置文件:', error.message);
    process.exit(1);
  }
}

// 檢查程式是否正在執行
function checkProcess(processName) {
  return new Promise((resolve, reject) => {
    const command = `tasklist /FI "IMAGENAME eq ${processName}" /FO CSV /NH`;

    exec(command, (error, stdout, stderr) => {
      if (error) {
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
    // 使用 cmd 的 start 命令，避免 PowerShell 編碼問題
    const command = `cd /d "${workingDirectory}" && start "" "${exePath}"`;

    exec(command, { encoding: 'utf8' }, (error, stdout, stderr) => {
      if (error) {
        reject(error);
        return;
      }
      resolve();
    });
  });
}

// 主要監控邏輯
async function monitorService(config) {
  const { processName, exePath, workingDirectory, checkInterval } = config;

  console.log(`[${new Date().toLocaleString('zh-TW')}] 開始監控: ${processName}`);
  console.log(`檢查間隔: ${checkInterval / 1000} 秒`);
  console.log(`程式路徑: ${exePath}`);
  console.log(`工作目錄: ${workingDirectory}`);
  console.log('---'.repeat(20));

  setInterval(async () => {
    try {
      const isRunning = await checkProcess(processName);
      const timestamp = new Date().toLocaleString('zh-TW');

      if (isRunning) {
        console.log(`[${timestamp}] ✓ ${processName} 正在執行中`);
      } else {
        console.log(`[${timestamp}] ✗ ${processName} 未執行，準備啟動...`);

        await startProcess(exePath, workingDirectory);

        // 等待一秒後確認是否啟動成功
        setTimeout(async () => {
          const isNowRunning = await checkProcess(processName);
          if (isNowRunning) {
            console.log(`[${new Date().toLocaleString('zh-TW')}] ✓ ${processName} 已成功啟動`);
          } else {
            console.log(`[${new Date().toLocaleString('zh-TW')}] ✗ ${processName} 啟動失敗，請檢查程式路徑`);
          }
        }, 1000);
      }
    } catch (error) {
      console.error(`[${new Date().toLocaleString('zh-TW')}] 錯誤:`, error.message);
    }
  }, checkInterval);
}

// 程式入口
function main() {
  console.log('========================================');
  console.log('   服務監控代理程式 v1.0');
  console.log('========================================');
  console.log('');

  const config = loadConfig();

  // 驗證配置
  if (!config.processName || !config.exePath) {
    console.error('錯誤: 配置文件中缺少必要參數 (processName, exePath)');
    process.exit(1);
  }

  // 檢查執行檔是否存在
  if (!fs.existsSync(config.exePath)) {
    console.error(`錯誤: 找不到執行檔 ${config.exePath}`);
    process.exit(1);
  }

  monitorService(config);
}

// 處理程式終止
process.on('SIGINT', () => {
  console.log('\n\n正在停止監控服務...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n\n正在停止監控服務...');
  process.exit(0);
});

// 啟動程式
main();
