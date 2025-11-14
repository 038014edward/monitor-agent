const fs = require('fs');
const path = require('path');

console.log('\n📦 正在整理部署檔案...\n');

const buildDir = path.join(__dirname, 'build');
const version = require('./package.json').version;

// 讀取 config.json 並建立範本
const configTemplate = {
  processName: "YourProcess.exe",
  exePath: "C:\\Path\\To\\Your\\Process.exe",
  workingDirectory: "C:\\Path\\To\\Your\\Process",
  checkInterval: 10000,
  description: "請修改此配置檔以監控您的程式"
};

// 建立 config-template.json（範本）
const templatePath = path.join(buildDir, 'config-template.json');
fs.writeFileSync(templatePath, JSON.stringify(configTemplate, null, 2), 'utf8');
console.log('✅ 已建立配置範本: config-template.json');

// 複製實際的 config.json（如果需要的話）
const configPath = path.join(__dirname, 'config.json');
const destConfigPath = path.join(buildDir, 'config.json');
if (fs.existsSync(configPath)) {
  fs.copyFileSync(configPath, destConfigPath);
  console.log('✅ 已複製配置檔: config.json');
}

// 建立 README.txt 部署說明
const readmeContent = `========================================
  Service Monitor Agent v${version}
  服務監控代理程式
========================================

📦 部署步驟：

1. 將此整個資料夾複製到目標電腦

2. 修改 config.json：
   - 打開 config.json
   - 修改 exePath 為要監控的程式完整路徑
   - 修改 workingDirectory 為程式的工作目錄
   - 調整 checkInterval（檢查間隔，單位：毫秒）

3. 雙擊 service-monitor-agent-v${version}.exe 啟動監控

4. (選用) 開機自動執行：
   - 按 Win + R
   - 輸入 shell:startup
   - 將 exe 檔的捷徑放進去

📁 檔案說明：

- service-monitor-agent-v${version}.exe  主程式
- config.json                            配置檔（必須修改）
- config-template.json                   配置範本（參考用）
- README.txt                             本說明檔
- logs/                                  日誌目錄（自動產生）

⚠️ 注意事項：

1. config.json 必須與 exe 在同一目錄
2. 確保路徑使用雙反斜線 \\\\ 或單斜線 /
3. 日誌檔案位於 logs 目錄，每天一個檔案
4. 停止監控：關閉視窗或工作管理員結束程序

📝 config.json 範例：

{
  "processName": "MyApp.exe",
  "exePath": "D:\\\\Programs\\\\MyApp\\\\MyApp.exe",
  "workingDirectory": "D:\\\\Programs\\\\MyApp",
  "checkInterval": 10000,
  "description": "我的應用程式監控"
}

🔧 檢查間隔建議：
- 一般程式：10000-30000 (10-30秒)
- 關鍵服務：5000-10000 (5-10秒)
- 不要設定太短，以免影響系統效能

📞 技術支援：
如有問題，請查看 logs 目錄中的日誌檔案
`;

const readmePath = path.join(buildDir, 'README.txt');
fs.writeFileSync(readmePath, readmeContent, 'utf8');
console.log('✅ 已建立部署說明: README.txt');

console.log('\n✨ 部署資料夾準備完成！');
console.log(`📂 位置: ${buildDir}`);
console.log('\n📋 資料夾內容：');
console.log('   ├── service-monitor-agent-v' + version + '.exe');
console.log('   ├── config.json');
console.log('   ├── config-template.json');
console.log('   └── README.txt');
console.log('\n💡 直接將 build 資料夾複製到遠端電腦即可使用！\n');
