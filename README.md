# Monitor Agent (Legacy - Windows 7+ 支援版本)

一個基於 Electron 開發的 Windows 服務監控代理程式，用於監控和自動重啟指定的應用程式。

> ⚠️ **版本說明**  
> 這是 **Legacy 版本**，使用 Electron 22，支援 Windows 7/8/8.1 和 Windows Server 2008+  
> 如果您使用 Windows 10 或更新版本，建議使用 [main 分支](../../tree/main) 以獲得最新功能。

## 系統需求

- **Windows 7 或更新版本** ✅
- **Windows Server 2008 或更新版本** ✅
- Node.js 16 或更新版本（開發環境）

## 版本對照

| 分支 | Electron 版本 | 支援系統 | 適用場景 |
|------|--------------|---------|---------|
| **legacy** (本分支) | 22.3.27 | Win7/8/Server 2008+ | 舊系統相容性需求 |
| **main** | 39.2.2 | Win10+ 僅 | 現代系統，最新功能 |

## 功能特色

- 🔍 **多程式監控**：同時監控多個應用程式
- 🔄 **自動重啟**：當程式意外關閉時自動重啟
- ⏱️ **自訂監控間隔**：可為每個程式設定不同的檢查間隔（10-300 秒）
- 📊 **即時狀態顯示**：顯示每個監控項目的執行狀態
- 📝 **日誌記錄**：自動記錄程式啟動、停止等事件
- 💾 **配置持久化**：監控設定自動保存，重啟後恢復
- 🎨 **系統托盤**：最小化至系統托盤，不占用工作列空間
- 🔒 **單一實例**：確保同一時間只運行一個監控代理

## 安裝

### 開發環境

1. 克隆專案：

   ```bash
   git clone https://github.com/038014edward/service-monitor-agent.git
   cd monitor-agent
   ```

2. 安裝依賴：

   ```bash
   npm install
   ```

3. 啟動應用：

   ```bash
   npm start
   ```

### 打包發布

#### 快速打包

```bash
npm run package
```

#### 完整打包（含清理）

```bash
npm run make
```

#### 完全重新打包（清理所有快取）

```bash
npm run make:full
```

打包後的檔案將位於 `out/` 目錄。

## 使用說明

### 新增監控項目

1. 點擊工具列的「➕ 新增監控」按鈕
2. 選擇要監控的 `.exe` 執行檔
3. 設定監控間隔（10-300 秒，預設 30 秒）
4. 點擊「確定」完成新增

### 管理監控項目

- **開始監控**：點擊項目的「▶️ 開始」按鈕
- **停止監控**：點擊項目的「⏹️ 停止」按鈕
- **刪除項目**：點擊項目的「🗑️ 刪除」按鈕
- **批次操作**：使用工具列的「全部開始」或「全部停止」

### 狀態說明

- **執行中** 🟢：監控正在運行，程式正常
- **已停止** 🔴：監控已暫停
- **未執行** ⚪：程式未在運行中

### 系統托盤

- 點擊托盤圖示可以：
  - 顯示/隱藏主視窗
  - 查看應用程式版本
  - 退出應用程式

### 日誌功能

應用程式會自動記錄監控事件，日誌檔案位於：

```text
%APPDATA%\monitor-agent\logs\
```

日誌檔案命名規則：

- 系統日誌：`system_YYYY-MM-DD.log`
- 程式日誌：`程式名稱_YYYY-MM-DD.log`

記錄內容包括：

- 應用程式啟動/關閉
- 監控項目的啟動/停止
- 程式啟動成功/失敗
- 程式重啟事件

## 專案結構

```text
monitor-agent/
├── main.js              # Electron 主程序
├── renderer.js          # 渲染程序邏輯
├── preload.js          # 預載腳本（IPC 橋接）
├── menu.js             # 應用程式選單
├── index.html          # 主視窗 HTML
├── styles.css          # 樣式表
├── package.json        # 專案設定
├── forge.config.js     # Electron Forge 設定
└── assets/             # 資源檔案
    └── icon.ico        # 應用程式圖示
```

## 技術棧

- **Electron** ^22.3.27 - 跨平台桌面應用框架（支援 Windows 7+）
- **Electron Forge** ^6.4.2 - Electron 應用打包工具
- **Electron Store** ^8.2.0 - 資料持久化
- **Node.js** - 核心運行環境

## 開發

### 可用指令

- `npm start` - 啟動開發模式
- `npm run package` - 打包應用程式
- `npm run make` - 製作安裝包
- `npm run clean` - 清理建置快取
- `npm run clean:full` - 完全清理（包含 Electron 快取）

### IPC 通訊

主程序與渲染程序之間透過以下 IPC 通道通訊：

#### 渲染程序 → 主程序

- `add-monitor` - 新增監控項目
- `start-monitor` - 啟動監控
- `stop-monitor` - 停止監控
- `start-all-monitors` - 啟動所有監控
- `stop-all-monitors` - 停止所有監控
- `delete-monitor` - 刪除監控項目
- `get-monitors` - 取得所有監控項目
- `open-logs-folder` - 開啟日誌資料夾

#### 主程序 → 渲染程序

- `monitors-updated` - 監控列表已更新
- `monitor-status-changed` - 監控狀態已改變

## 許可證

ISC

## 作者

CMUBH

## 貢獻

歡迎提交 Issue 和 Pull Request！

## 版本歷史

### v2.0.0-legacy

- Legacy 版本（支援 Windows 7/8/Server 2008）
- 使用 Electron 22.3.27
- 支援多程式監控
- 自動重啟功能
- 日誌記錄
- 系統托盤整合

### v1.0.0

- 初始版本
- 支援多程式監控
- 自動重啟功能
- 日誌記錄
- 系統托盤整合
