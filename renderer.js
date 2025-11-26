// 取得頁面元素
const exePathInput = document.getElementById('exePath')
const browseBtn = document.getElementById('browseBtn')
const saveBtn = document.getElementById('saveBtn')
const statusMessage = document.getElementById('statusMessage')

// 顯示狀態訊息
function showStatus(message, isSuccess = true) {
  statusMessage.textContent = message
  statusMessage.className = 'status-message ' + (isSuccess ? 'success' : 'error')
  statusMessage.style.display = 'block'

  setTimeout(() => {
    statusMessage.style.display = 'none'
  }, 3000)
}

// 載入已保存的設定
async function loadConfig() {
  try {
    const config = await window.electronAPI.getConfig()
    if (config.exePath) {
      exePathInput.value = config.exePath
      console.log('已載入設定:', config)
    }
  } catch (error) {
    console.error('載入設定失敗:', error)
  }
}

// 驗證檔案路徑
async function validateFilePath(filePath) {
  if (!filePath || filePath.trim() === '') {
    return false
  }

  const exists = await window.electronAPI.checkFileExists(filePath)
  return exists
}

// 處理輸入框失去焦點事件（驗證檔案）
exePathInput.addEventListener('blur', async () => {
  const filePath = exePathInput.value.trim()

  if (!filePath) {
    return // 空白時不處理
  }

  const isValid = await validateFilePath(filePath)

  if (!isValid) {
    showStatus('❌ 找不到指定的執行檔！', false)
    exePathInput.value = '' // 清空輸入框
    console.log('檔案不存在，已清空輸入框')
  } else {
    console.log('檔案驗證成功:', filePath)
  }
})

// 處理瀏覽按鈕點擊事件
browseBtn.addEventListener('click', async () => {
  const filePath = await window.electronAPI.openFile()
  if (filePath) {
    exePathInput.value = filePath
    console.log('選擇的檔案:', filePath)
  }
})

// 處理保存按鈕點擊事件
saveBtn.addEventListener('click', async () => {
  const exePath = exePathInput.value.trim()

  if (!exePath) {
    showStatus('❌ 請先選擇要監控的程式！', false)
    return
  }

  // 保存前先驗證檔案是否存在
  const isValid = await validateFilePath(exePath)
  if (!isValid) {
    showStatus('❌ 找不到指定的執行檔！', false)
    exePathInput.value = '' // 清空輸入框
    return
  }

  try {
    const result = await window.electronAPI.saveConfig({
      exePath: exePath
    })

    if (result.success) {
      showStatus('✓ ' + result.message, true)
      console.log('設定已保存:', exePath)
    } else {
      showStatus('✗ ' + result.message, false)
    }
  } catch (error) {
    showStatus('✗ 保存失敗：' + error.message, false)
    console.error('保存設定錯誤:', error)
  }
})

// 頁面載入時讀取設定
loadConfig()