# Electron UI 版本說明

## 如何執行

### 開發模式

```bash
npm run start:electron
```

### 建置安裝檔

```bash
npm run build:electron
```

建置完成後，安裝檔會在 `dist-electron/` 資料夾中。

## 功能特色

- ✅ 圖形化介面顯示監控狀態
- ✅ 即時日誌顯示
- ✅ 系統匣圖示，關閉視窗不會停止監控
- ✅ 雙擊系統匣圖示可重新打開主視窗
- ✅ 右鍵系統匣圖示查看狀態和退出

## 配置檔案

程式會讀取應用程式根目錄下的 `config.ini`：

開發模式路徑：專案根目錄 (`config.ini` 與 `package.json` 同層)
打包/安裝後路徑：安裝或解壓的程式資料夾

若啟動時沒有找到 `config.ini`：
會自動檢查是否存在 `config.example.ini`，並自動複製生成一份預設的 `config.ini`（日誌會顯示 WARN）。
若兩者皆不存在，將記錄錯誤並停止。

修改配置後重新啟動應用程式即可生效。

## 圖示

需要在 `build/` 資料夾下放置 `icon.ico` 檔案作為應用程式圖示。
可以使用線上工具將 PNG 圖片轉換為 ICO 格式。
