// @ts-check
const { test, expect, _electron: electron } = require('@playwright/test')

test('click 新增監控 button', async () => {

  const electronApp = await electron.launch({ args: ['main.js'] })
  const window = await electronApp.firstWindow()
  console.log('取得主視窗')

  // 檢查按鈕是否存在
  const addButton = window.getByRole('button', { name: /新增監控/ })
  await expect(addButton).toBeVisible()
  console.log('按鈕存在')

  // 點擊「新增監控」按鈕
  await window.getByRole('button', { name: /新增監控/ }).click()
  console.log('按下新增監控按鈕')

  // 新增監控對話框是否出現（用 id 選取）
  await expect(window.locator('#addDialog')).toBeVisible()
  console.log('新增監控對話框已顯示')

  // 點擊對話框的取消按鈕關閉對話框
  await window.getByRole('button', { name: /取消/ }).click()
  console.log('按下取消按鈕關閉對話框')


  // 觸發功能列「結束 → 結束程式」
  // await electronApp.evaluate(async () => {
  //   const { Menu } = require('electron');
  //   const menu = Menu.getApplicationMenu();
  //   if (!menu) return;
  //   // 找到「結束」選單
  //   const fileMenu = menu.items.find(item => item.label === '結束');
  //   if (fileMenu && fileMenu.submenu) {
  //     // 找到「結束程式」子選單
  //     const exitItem = fileMenu.submenu.items.find(item => item.label === '結束程式');
  //     if (exitItem && exitItem.click) {
  //       exitItem.click();
  //     }
  //   }
  // });
})

