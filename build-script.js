const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('\n📦 正在建置部署檔案...\n');

const distDir = path.join(__dirname, 'dist');

// 清空 dist 資料夾
if (fs.existsSync(distDir)) {
  console.log('🗑️  清空 dist 資料夾...');
  fs.rmSync(distDir, { recursive: true, force: true });
}

// 建立新的 dist 資料夾
fs.mkdirSync(distDir, { recursive: true });

const version = require('./package.json').version;
const releaseDir = path.join(distDir, `service-monitor-agent-v${version}`);
const exeName = `service-monitor-agent-v${version}.exe`;

// 建立發佈資料夾
fs.mkdirSync(releaseDir, { recursive: true });

// 直接讓 pkg 輸出到目標資料夾
console.log('🔨 正在打包 EXE 檔案...');
const exePath = path.join(releaseDir, exeName);
execSync(`pkg . --targets node18-win-x64 --output "${exePath}"`, { stdio: 'inherit' });

// 確認 exe 檔案是否成功產生
if (fs.existsSync(exePath)) {
  console.log(`✅ 已建立執行檔: ${exeName}`);
} else {
  console.error(`❌ 錯誤：無法建立執行檔 ${exeName}`);
  process.exit(1);
}

// 複製 config.example.ini 作為範本
const exampleConfigPath = path.join(__dirname, 'config.example.ini');
const configIniPath = path.join(releaseDir, 'config.ini');

if (fs.existsSync(exampleConfigPath)) {
  fs.copyFileSync(exampleConfigPath, configIniPath);
  console.log('✅ 已複製配置檔範本: config.ini');
} else {
  console.warn('⚠️  找不到 config.example.ini，跳過配置檔複製');
}

// 建立 README.txt 部署說明
const readmeContent = `========================================
  Service Monitor Agent v${version}
  服務監控代理程式
========================================

📦 部署步驟：

1. 將此整個資料夾複製到目標電腦

2. 修改 config.ini：
   - 使用記事本打開 config.ini
   - 修改 exePath 為要監控的程式完整路徑
   - 調整 checkInterval（檢查間隔，單位：毫秒）
   - (選填) 修改 description 說明文字

3. 雙擊 service-monitor-agent-v${version}.exe 啟動監控

4. (選用) 開機自動執行：
   - 按 Win + R
   - 輸入 shell:startup
   - 將 exe 檔的捷徑放進去

📁 檔案說明：

- service-monitor-agent-v${version}.exe  主程式
- config.ini                             配置檔（必須修改）
- README.txt                             本說明檔
- logs/                                  日誌目錄（自動產生）

⚠️ 注意事項：

1. config.ini 必須與 exe 在同一目錄
2. 路徑可使用 \\ 或 / 分隔符（建議用單個 \\）
3. 日誌檔案位於 logs 目錄，每天一個檔案
4. 停止監控：關閉視窗或工作管理員結束程序

📝 config.ini 範例：

[Process]
exePath=D:\\Programs\\MyApp\\MyApp.exe
checkInterval=10000
description=我的應用程式監控

🔧 檢查間隔建議：
- 一般程式：10000-30000 (10-30秒)
- 關鍵服務：5000-10000 (5-10秒)
- 不要設定太短，以免影響系統效能

📞 技術支援：
如有問題，請查看 logs 目錄中的日誌檔案
`;

const readmePath = path.join(releaseDir, 'README.txt');
fs.writeFileSync(readmePath, readmeContent, 'utf8');
console.log('✅ 已建立部署說明: README.txt');

console.log('\n✨ 部署資料夾準備完成！');
console.log(`📂 位置: ${releaseDir}`);
console.log('\n📋 資料夾內容：');
console.log(`   service-monitor-agent-v${version}/`);
console.log('   ├── service-monitor-agent-v' + version + '.exe');
console.log('   ├── config.ini');
console.log('   └── README.txt');

// 建立壓縮檔（使用 PowerShell 的 Compress-Archive）
console.log('\n🗜️  正在建立壓縮檔...');

const zipFileName = `service-monitor-agent-v${version}.zip`;
const zipFilePath = path.join(distDir, zipFileName).replace(/\//g, '\\\\');
const releaseDirPath = releaseDir.replace(/\//g, '\\\\');

try {
  // 使用 PowerShell 建立壓縮檔
  const psCommand = `Import-Module Microsoft.PowerShell.Archive; Compress-Archive -Path '${releaseDirPath}' -DestinationPath '${zipFilePath}' -Force`;
  execSync(`powershell -NoProfile -ExecutionPolicy Bypass -Command "${psCommand}"`, { stdio: 'inherit' });

  const zipFileSize = (fs.statSync(zipFilePath).size / 1024 / 1024).toFixed(2);
  console.log(`\n✅ 已建立壓縮檔: ${zipFileName}`);
  console.log(`📦 檔案大小: ${zipFileSize} MB`);
  console.log(`📂 位置: ${zipFilePath}`);
  console.log('\n💡 可直接將壓縮檔傳送到遠端電腦，解壓後即可使用！\n');
} catch (error) {
  console.error('❌ 建立壓縮檔失敗:', error.message);
  process.exit(1);
}
