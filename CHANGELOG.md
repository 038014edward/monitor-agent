# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.1] - 2025-11-19

### Changed

- 將建置輸出資料夾從 `build/` 改為 `dist/`
- 優化 PowerShell 壓縮命令，修正模組載入問題

## [1.1.0] - 2025-11-18

### Changed

- 配置檔格式從 JSON 改為 INI 格式，避免編碼問題
- 簡化配置參數，只需填寫 `exePath`，自動提取程式名稱和工作目錄
- 新增 `config.example.ini` 範例檔案

### Added

- build 時自動產生 ZIP 壓縮檔
- build 前自動清空 build 資料夾
- 支援 INI 註解功能（使用 `#` 或 `;`）

### Removed

- 移除 `processName` 和 `workingDirectory` 必填參數（自動從 `exePath` 提取）

## [1.0.0] - 2025-11-17

### Added

- 初始版本發布
- 支援監控指定 Windows 應用程式
- 程式未執行時自動重啟
- 支援中文與特殊字元路徑
- 配置檔（config.json）可自訂監控目標、檢查間隔等
- 執行檔與配置檔可一併部署於同一資料夾
- 自動產生日誌檔案（logs/monitor-YYYY-MM-DD.log）
- 執行視窗不會閃退，錯誤會顯示於畫面與日誌
- 提供完整部署說明與配置範本
