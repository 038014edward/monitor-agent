// Monitor Agent - 功能列 & 主畫面
// @ts-check
const { test, expect, _electron: electron } = require('@playwright/test')
const path = require('path')
const Store = require('electron-store')
const os = require('os')

// 在所有測試之前清空 store
test.beforeAll(() => {
  // 指定與測試環境相同的路徑
  const configDir = path.join(os.homedir(), 'AppData', 'Roaming', 'Monitor Agent')
  const store = new Store({
    name: 'config-test',
    cwd: configDir
  })
  store.clear()
  console.log('已清空測試環境的 store:', store.path)
})

// 共用的啟動 App 函式
async function launchApp() {
  const electronApp = await electron.launch({
    args: [path.join(__dirname, '..', 'main.js')],
    env: {
      ...process.env,
      NODE_ENV: 'test'
    }
  })
  const window = await electronApp.firstWindow()
  return { electronApp, window }
}

// 共用的關閉 App 函式，利用設置 isQuitting 標記來關閉 App 
// @ts-ignore - Electron types
async function closeApp(electronApp) {
  // @ts-ignore - Electron types
  await electronApp.evaluate(({ app }) => {
    app.isQuitting = true
  })
}


// test('檢查主畫面元件', async () => {

//   const { electronApp, window } = await launchApp()

//   // 主視窗標題
//   await expect(window).toHaveTitle(/Monitor Agent/i);

//   // 檢查主要按鈕是否存在
//   // await expect(window.getByRole('button', { name: /新增監控/ })).toBeVisible();
//   await expect(window.getByRole('button', { name: /全部開始/ })).toBeVisible();
//   await expect(window.getByRole('button', { name: /全部停止/ })).toBeVisible();

//   // 檢查表頭文字（依實際 DOM 調整）
//   await expect(window.getByText('監控列表')).toBeVisible();
//   await expect(window.getByText('程式名稱')).toBeVisible();
//   await expect(window.getByText('狀態')).toBeVisible();
//   await expect(window.getByText('最後檢查')).toBeVisible();
//   await expect(window.getByText('間隔(秒)')).toBeVisible();
//   await expect(window.getByText('操作')).toBeVisible();
//   await expect(window.getByText('活動日誌')).toBeVisible();

//   // Exit app - 設置 isQuitting 標記以正常關閉
//   await closeApp(electronApp)
// })

// test('確認新增監控視窗', async () => {

//   const { electronApp, window } = await launchApp()

//   // 檢查按鈕是否存在
//   const addButton = window.getByRole('button', { name: /新增監控/ })
//   await expect(addButton).toBeVisible()

//   // 點擊「新增監控」按鈕
//   await window.getByRole('button', { name: /新增監控/ }).click()

//   // 新增監控對話框是否出現（用 id 選取）
//   await expect(window.locator('#addDialog')).toBeVisible()

//   // 點擊對話框的取消按鈕關閉對話框
//   await window.getByRole('button', { name: /取消/ }).click()
//   console.log('按下取消按鈕關閉對話框')

//   await closeApp(electronApp)
// })

test('新增監控項目', async () => {

  const { electronApp, window } = await launchApp()

  // 點擊「新增監控」按鈕
  await window.getByRole('button', { name: /新增監控/ }).click()
  // 在對話框中填寫錯誤的程式路徑
  await window.locator('#newExePath').fill('C:\\Path\\To\\Your\\App.exe')
  // 點擊對話框的確定按鈕
  await window.getByRole('button', { name: /確定/ }).click()
  // 應該會跑出找不到執行檔的錯誤訊息
  await expect(window.getByText('找不到指定的執行檔')).toBeVisible();
  // 填寫 dummy_app1.exe 的正確路徑
  await window.locator('#newExePath').fill(path.join(__dirname, 'dummy_app1.exe'))
  // 點擊對話框的確定按鈕
  await window.getByRole('button', { name: /確定/ }).click()

  // 點擊「新增監控」按鈕
  await window.getByRole('button', { name: /新增監控/ }).click()
  // 填寫 dummy_app2.exe 的正確路徑
  await window.locator('#newExePath').fill(path.join(__dirname, 'dummy_app2.exe'))
  // 間隔秒數改為 10 秒
  await window.locator('#newInterval').fill('10')
  // 點擊對話框的確定按鈕
  await window.getByRole('button', { name: /確定/ }).click()


  // 畫面暫停
  await window.waitForTimeout(15000);


  //TODO 這邊要先新增一筆監控資料，才能測試下面的按鈕是否存在
  //  如果你是 <button> 或 <a>，可以先用 role=button，若抓不到再退而求其次用 getByText
  // await expect(window.getByRole('button', { name: /啟動/ })).toBeVisible();
  // await expect(window.getByRole('button', { name: '刪除' })).toBeVisible();
  // await expect(window.getByRole('button', { name: '複製路徑' })).toBeVisible();
  // await expect(window.getByRole('button', { name: '自動重啟/ })).toBeVisible();

  await closeApp(electronApp)
})


