// 取得頁面元素
const exePathInput = document.getElementById('exePath')
const browseBtn = document.getElementById('browseBtn')

// 處理瀏覽按鈕點擊事件
browseBtn.addEventListener('click', async () => {
  const filePath = await window.electronAPI.openFile()
  if (filePath) {
    exePathInput.value = filePath
    console.log('選擇的檔案:', filePath)
  }
})