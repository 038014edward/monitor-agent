# 修復 Electron 應用程式圖示問題

## 問題

建置時顯示：`default Electron icon is used  reason=application icon is not set`

## 可能原因

1. **圖示格式不正確**
   - Windows `.ico` 檔案必須包含多個尺寸：256x256、128x128、64x64、48x48、32x32、16x16
   - 如果只有單一尺寸，electron-builder 會拒絕使用

2. **electron-builder 快取問題**
   - electron-builder 會快取圖示，更新圖示後可能不會立即生效

## 解決方案

### 方法 1：使用線上工具生成正確的 .ico 檔案

1. 準備一張 PNG 圖片（建議至少 512x512 或 1024x1024）
2. 訪問：<https://www.icoconverter.com/> 或 <https://convertico.com/>
3. 上傳您的圖片
4. 選擇生成包含多個尺寸的 .ico 檔案（16, 32, 48, 64, 128, 256）
5. 下載並替換 `build/icon.ico`

### 方法 2：清除快取後重新建置

```powershell
# 1. 清除 electron-builder 快取
Remove-Item -Recurse -Force "$env:LOCALAPPDATA\electron-builder\Cache" -ErrorAction SilentlyContinue

# 2. 清除建置目錄
Remove-Item -Recurse -Force "dist-electron" -ErrorAction SilentlyContinue

# 3. 重新建置
npm run build:electron
```

### 方法 3：使用 PNG 格式（推薦）

electron-builder 也支援 PNG 格式，而且更簡單：

1. 將您的圖示改為 512x512 或 1024x1024 的 PNG 格式
2. 命名為 `icon.png` 並放在 `build/` 目錄
3. 修改 `package.json`：

```json
"win": {
  "target": "nsis",
  "icon": "build/icon.png"
}
```

4. electron-builder 會自動生成正確的 .ico 檔案

### 方法 4：檢查圖示檔案

執行以下 PowerShell 命令檢查您的圖示：

```powershell
# 檢查檔案大小（正確的多尺寸 .ico 通常大於 100KB）
Get-Item "build\icon.ico" | Select-Object Length

# 如果小於 50KB，可能只包含單一尺寸
```

## 已更新的配置

我已經更新了 `package.json`，添加了：

- `buildResources` 目錄設定
- NSIS 安裝器和卸載器的圖示設定

請按照上述方法之一重新生成圖示檔案，然後清除快取重新建置。
