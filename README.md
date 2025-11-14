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

### 啟動監控服務

```bash
npm start
```

或

```bash
node index.js
```

## 運行示例

```
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

## 注意事項

1. **權限要求**: 需要有足夠的權限來執行目標程式
2. **路徑設定**: 確保 `exePath` 和 `workingDirectory` 路徑正確
3. **檢查間隔**: 不建議設定過短的檢查間隔，以免影響系統性能
4. **程式依賴**: 確保目標程式的所有依賴檔案都在 `workingDirectory` 中
5. **日誌檔案**: 日誌檔案會持續累積，建議定期清理舊日誌

## 停止監控

按下 `Ctrl+C` 可以停止監控服務

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
