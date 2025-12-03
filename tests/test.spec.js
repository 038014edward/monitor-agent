// @ts-check
const { test, expect, _electron: electron } = require('@playwright/test')

// test('click 新增監控 button', async () => {

//   const electronApp = await electron.launch({ args: ['main.js'] })
//   const window = await electronApp.firstWindow()
//   console.log('取得主視窗')

//   // 檢查按鈕是否存在
//   const addButton = window.getByRole('button', { name: /新增監控/ })
//   await expect(addButton).toBeVisible()
//   console.log('按鈕存在')

//   // 點擊「新增監控」按鈕
//   await window.getByRole('button', { name: /新增監控/ }).click()
//   console.log('按下新增監控按鈕')

//   // 新增監控對話框是否出現（用 id 選取）
//   await expect(window.locator('#addDialog')).toBeVisible()
//   console.log('新增監控對話框已顯示')

//   // 點擊對話框的取消按鈕關閉對話框
//   await window.getByRole('button', { name: /取消/ }).click()
//   console.log('按下取消按鈕關閉對話框')


//   // 觸發功能列「結束 → 結束程式」
//   await electronApp.evaluate(async () => {
//     const { Menu } = require('electron');
//     const menu = Menu.getApplicationMenu();
//     if (!menu) return;
//     // 找到「結束」選單
//     const fileMenu = menu.items.find(item => item.label === '結束');
//     if (fileMenu && fileMenu.submenu) {
//       // 找到「結束程式」子選單
//       const exitItem = fileMenu.submenu.items.find(item => item.label === '結束程式');
//       if (exitItem && exitItem.click) {
//         exitItem.click();
//       }
//     }
//   });
// })

test('官方範例測試', async () => {
  // Launch Electron app.
  const electronApp = await electron.launch({ args: ['main.js'] })

  //Evaluation expression in the Electron context.
  const appPath = await electronApp.evaluate(async ({ app }) => {
    // This runs in the Electron main process, parameter here is always
    // the result of the require('electron') in the main app script.
    return app.getAppPath()
  })
  console.log('App path: ', appPath)

  // Get the first window that the app opens, wait until ready.
  const window = await electronApp.firstWindow()
  // Print the title.
  console.log('Window title: ', await window.title())
  // Capture a screenshot.
  await window.screenshot({ path: 'test-results/screenshot.png' })
  // Direct Electron console to Node terminal
  // window.on('console', console.log)
  // 定位 新增監控 按鈕是否存在
  const addButton = window.getByRole('button', { name: /新增監控/ })
  await expect(addButton).toBeVisible()

  // 點擊新增監控按鈕
  await window.click('text=新增監控')
  // 確認該元件是否有被點擊
  await expect(window.locator('#addDialog')).toBeVisible()

  // Exit app - 設置 isQuitting 標記以正常關閉
  await electronApp.evaluate(({ app }) => {
    // @ts-ignore - isQuitting 是自定義屬性
    app.isQuitting = true
  })
})