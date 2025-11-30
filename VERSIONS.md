# Monitor Agent 版本管理策略

本專案維護兩個版本分支，以支援不同的 Windows 系統環境。

## 分支說明

### 📌 main 分支（現代版本）

- **Electron 版本**：39.2.2
- **支援系統**：Windows 10 及更新版本
- **特點**：
  - ✅ 最新的 Electron 功能和安全更新
  - ✅ 更好的性能和現代化 API
  - ✅ 持續更新維護
  - ❌ 不支援 Windows 7/8/Server 2008

### 📌 legacy 分支（舊系統支援版本）

- **Electron 版本**：22.3.27
- **支援系統**：Windows 7/8/8.1 和 Windows Server 2008+
- **特點**：
  - ✅ 相容舊版 Windows 系統
  - ✅ 核心功能完整
  - ⚠️ 僅接受關鍵 bug 修復
  - ⚠️ 缺少新版 Electron 的新功能

## 版本號規則

- **main 分支**：使用標準語義化版本號（如 `2.0.0`）
- **legacy 分支**：使用帶 `-legacy` 後綴的版本號（如 `2.0.0-legacy`）

## 發布流程

### 發布 main 版本（Windows 10+）

```bash
git checkout main
npm version [major|minor|patch]  # 自動更新版本號和建立 tag
npm run make:full                 # 打包
git push origin main --tags       # 推送代碼和標籤
```

### 發布 legacy 版本（Windows 7+）

```bash
git checkout legacy
# 手動更新 package.json 中的版本號（保持 -legacy 後綴）
npm run make:full                 # 打包
git add package.json
git commit -m "chore: bump version to x.x.x-legacy"
git tag -a vx.x.x-legacy -m "Release version x.x.x-legacy"
git push origin legacy --tags     # 推送代碼和標籤
```

## 功能同步策略

1. **新功能開發**：優先在 main 分支開發
2. **Bug 修復**：
   - 非關鍵 bug：僅修復 main 分支
   - 關鍵 bug：同時修復兩個分支
3. **功能移植**：必要時從 main cherry-pick 到 legacy

### Cherry-pick 示例

```bash
# 在 main 分支開發並提交功能
git checkout main
git commit -m "feat: add new feature"

# 切換到 legacy 並 cherry-pick
git checkout legacy
git cherry-pick <commit-hash>

# 解決可能的衝突
git add .
git cherry-pick --continue
```

## 打包產物命名

- **main 分支**：`Monitor Agent-win32-x64-2.0.0.zip`
- **legacy 分支**：`Monitor Agent-win32-x64-2.0.0-legacy.zip`

## 使用者選擇指南

### 選擇 main 版本（推薦）

- ✅ 使用 Windows 10 或更新版本
- ✅ 需要最新功能和最佳性能
- ✅ 重視安全更新

### 選擇 legacy 版本

- ✅ 使用 Windows 7/8/8.1
- ✅ 使用 Windows Server 2008/2012
- ✅ 無法升級作業系統
- ⚠️ 接受功能更新較慢

## 技術差異

| 項目 | main | legacy |
|------|------|--------|
| Electron | 39.2.2 | 22.3.27 |
| Chromium | 132.x | 108.x |
| Node.js | 20.x | 16.x |
| Electron Forge | 7.x | 6.x |
| Fuses Plugin | ✅ | ❌ |

## 維護時間線

- **main 分支**：長期維護
- **legacy 分支**：
  - 完整支援至：2026 年底
  - 關鍵修復至：2027 年中
  - 之後僅接受安全修復

## 相關連結

- [Electron 版本支援政策](https://www.electronjs.org/docs/latest/tutorial/electron-timelines)
- [Windows 7 棄用公告](https://www.electronjs.org/blog/windows-7-to-8-1-deprecation-notice)
- [Chromium 平台支援](https://chromium.googlesource.com/chromium/src/+/master/docs/windows_build_instructions.md)
