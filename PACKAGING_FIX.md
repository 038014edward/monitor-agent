# 打包應用程式配置檔案路徑修復說明

## 問題描述

在打包後的 Electron 應用程式中，程式嘗試將配置檔案 `config.ini` 寫入 `app.asar` 目錄，但該目錄是只讀的，導致以下錯誤：

```
[ERROR] 無法讀取配置文件 詳細錯誤: 找不到配置檔案且自動複製失敗: 
ENOENT: no such file or directory, copyfile 
'C:\Users\pacsuser\AppData\Local\Temp\4d06231e-14b3-4cd3-9ea2-1aa825fa9718.tmp.ini' 
-> 'C:\Users\pacsuser\AppData\Local\Programs\service-monitor-agent\resources\app.asar\config.ini'
```

## 解決方案

### 1. 修改配置檔案存放位置

**檔案：`electron/main.js`**

- 修改前：使用 `app.getAppPath()` 獲取應用程式目錄（指向 `app.asar`，只讀）
- 修改後：
  - 在開發環境：使用 `app.getAppPath()`
  - 在打包後環境：使用 `app.getPath('userData')`（可寫入的用戶資料目錄）

```javascript
// 修改後的代碼
const userDataPath = app.getPath('userData');
const appDir = app.isPackaged ? userDataPath : app.getAppPath();
```

### 2. 添加配置目錄檢查

**檔案：`electron/monitor-core.js`**

在建構函數中添加 `ensureConfigDir()` 方法，確保配置目錄存在：

```javascript
ensureConfigDir() {
  try {
    if (!fs.existsSync(this.APP_DIR)) {
      fs.mkdirSync(this.APP_DIR, { recursive: true });
    }
  } catch (error) {
    console.error('無法建立配置目錄:', error.message);
  }
}
```

### 3. 改進配置載入邏輯

移除嘗試從 `app.asar` 複製範例配置檔的邏輯（因為打包後無法訪問），改為：

- 如果配置檔不存在，返回 `null`
- 讓用戶透過 UI 介面進行初始設定
- 發生錯誤時返回 `null` 而不是拋出異常

### 4. 配置檔案位置

打包後的應用程式，配置檔案和日誌將存放在：

**Windows:**

```
C:\Users\<username>\AppData\Roaming\service-monitor-agent\
├── config.ini
└── logs\
    └── monitor-YYYY-MM-DD.log
```

## 測試步驟

1. 執行 `npm run build:electron` 建置應用程式
2. 安裝打包後的應用程式
3. 啟動應用程式
4. 首次啟動時，透過 UI 介面選擇要監控的程式並設定檢查間隔
5. 點擊「保存設定並啟動監控」
6. 配置檔案將自動保存到 userData 目錄
7. 關閉並重新啟動應用程式，配置應該會被正確載入

## 優點

1. ✅ 支援打包後的應用程式正常讀寫配置
2. ✅ 符合 Electron 最佳實踐（使用 userData 目錄）
3. ✅ 開發和生產環境均能正常運作
4. ✅ 用戶資料與應用程式程式碼分離
5. ✅ 不會因為配置檔案問題導致應用程式崩潰
