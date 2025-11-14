# Service Monitor Agent

服務監控代理程式 - 自動監控並重啟指定的應用程式

## 功能特色

- 🔍 定期檢查指定程式是否正在執行
- 🔄 當程式未執行時自動重啟
- 📝 詳細的運行日誌記錄（控制台 + 檔案）
- 📁 自動建立每日日誌檔案 (logs 目錄)
- ⚙️ 靈活的 JSON 配置檔案
- 🎯 目前監控: Fresenius4008_Socket.exe (洗腎室程式)
- 🔍 多層次日誌等級 (SYSTEM, INFO, CHECK, WARN, ERROR, SUCCESS, DEBUG)

## 安裝

```bash
npm install
```

## 配置

編輯 `config.json` 檔案以設定要監控的程式:

```json
{
  "processName": "Fresenius4008_Socket.exe",
  "exePath": "c:\\workspace\\_delphi\\Fresenius4008_Socket_Indy_new(洗腎室程式)\\Fresenius4008_Socket.exe",
  "workingDirectory": "c:\\workspace\\_delphi\\Fresenius4008_Socket_Indy_new(洗腎室程式)",
  "checkInterval": 10000,
  "description": "Fresenius4008 洗腎室程式監控配置"
}
```

### 配置參數說明

- `processName`: 要監控的程式名稱 (包含 .exe)
- `exePath`: 程式的完整路徑
- `workingDirectory`: 程式的工作目錄
- `checkInterval`: 檢查間隔時間 (毫秒)，建議 10000-60000 (10-60秒)
- `description`: 配置說明 (選填)

## 使用方法

### 方式 1：開發環境執行

適合本機測試和開發：

```bash
npm start
```

或

```bash
node index.js
```

### 方式 2：打包成 EXE（推薦用於遠端電腦）

#### 建立 EXE 執行檔

執行以下命令來建立 EXE 執行檔：

```bash
npm run build
```

執行檔會產生在：`build/service-monitor-agent-v1.0.0.exe`

#### 部署到遠端電腦

**1. 準備檔案**

將以下檔案複製到遠端電腦的同一個資料夾：

- `service-monitor-agent-v1.0.0.exe`
- `config.json`

**2. 設定 config.json**

編輯 `config.json`，設定要監控的程式路徑（確認路徑在遠端電腦上是正確的）

**3. 執行監控**

直接雙擊 `service-monitor-agent-v1.0.0.exe` 即可啟動監控服務。

**4. 開機自動執行（選用）**

如需開機自動執行：

1. 按 `Win + R`
2. 輸入 `shell:startup`
3. 將 exe 檔的捷徑放入該資料夾

**5. 背景執行（選用）**

如需隱藏視窗在背景執行，建立批次檔 `start-hidden.bat`：

```batch
@echo off
start /min "" "service-monitor-agent-v1.0.0.exe"
```

然後雙擊 `start-hidden.bat` 來啟動。

#### EXE 部署注意事項

1. **config.json 必須與 exe 在同一目錄**
2. **logs 目錄會自動建立**在 exe 所在位置
3. **停止監控**：關閉命令提示字元視窗或在工作管理員中結束程序
4. **需要管理員權限**：如果要監控的程式需要管理員權限才能啟動
5. **不需要安裝 Node.js**：EXE 檔已包含所有執行環境

#### 部署後的檔案結構

```
遠端電腦資料夾/
├── service-monitor-agent-v1.0.0.exe    (主程式)
├── config.json                         (配置檔，需手動放置)
└── logs/                               (自動建立)
    └── monitor-2025-11-14.log
```

## 運行示例

```log
========================================
   服務監控代理程式 v1.0
========================================

[2025/11/14 下午3:30:00] 開始監控: Fresenius4008_Socket.exe
檢查間隔: 10 秒
程式路徑: c:\workspace\_delphi\Fresenius4008_Socket_Indy_new(洗腎室程式)\Fresenius4008_Socket.exe
工作目錄: c:\workspace\_delphi\Fresenius4008_Socket_Indy_new(洗腎室程式)
------------------------------------------------------------
[2025/11/14 下午3:30:00] ✓ Fresenius4008_Socket.exe 正在執行中
[2025/11/14 下午3:30:10] ✗ Fresenius4008_Socket.exe 未執行，準備啟動...
[2025/11/14 下午3:30:11] ✓ Fresenius4008_Socket.exe 已成功啟動
```

## 日誌功能

- 所有日誌會同時輸出到控制台和日誌檔案
- 日誌檔案位置: `logs/monitor-YYYY-MM-DD.log`
- 每天自動建立新的日誌檔案
- 日誌包含詳細的時間戳記和操作類型

### 日誌等級

- `SYSTEM`: 系統級訊息（啟動、停止）
- `INFO`: 一般資訊
- `CHECK`: 檢查狀態
- `WARN`: 警告訊息
- `ERROR`: 錯誤訊息
- `SUCCESS`: 成功訊息
- `DEBUG`: 除錯訊息

## 疑難排解

### 找不到 config.json

- 確認 `config.json` 與 exe 在同一目錄（EXE 模式）
- 確認在專案根目錄執行（開發模式）

### 無法啟動程式

- 檢查 config.json 中的路徑是否正確
- 確認有足夠權限執行目標程式
- 查看 logs 目錄中的日誌檔案了解詳細錯誤

### 關閉遠端桌面後停止（EXE 模式）

- 使用「最小化」視窗而不是關閉
- 或使用工作排程器設定為背景任務
- 或將捷徑放到啟動資料夾讓系統自動執行

### 程式路徑有中文或括號出現亂碼

- 已修正：程式使用 cmd 的 start 命令，可正確處理中文路徑

## 注意事項

1. **權限要求**: 需要有足夠的權限來執行目標程式
2. **路徑設定**: 確保 `exePath` 和 `workingDirectory` 路徑正確
3. **檢查間隔**: 不建議設定過短的檢查間隔，以免影響系統性能
4. **程式依賴**: 確保目標程式的所有依賴檔案都在 `workingDirectory` 中
5. **日誌檔案**: 日誌檔案會持續累積，建議定期清理舊日誌

## 停止監控

- **開發模式**: 按下 `Ctrl+C` 可以停止監控服務
- **EXE 模式**: 關閉命令提示字元視窗或在工作管理員中結束程序

## 系統需求

- Node.js 12.x 或更高版本
- Windows 作業系統
- PowerShell

## 版本歷史

- v1.0.0 (2025/11/14)
  - 初始版本
  - 支援 Fresenius4008_Socket.exe 監控
  - 基本的程式檢測與重啟功能

## 授權

ISC License
