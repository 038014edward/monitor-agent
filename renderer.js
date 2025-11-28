// 取得頁面元素
const exePathInput = document.getElementById('exePath')
const intervalInput = document.getElementById('intervalInput')
const browseBtn = document.getElementById('browseBtn')
const saveBtn = document.getElementById('saveBtn')
const toggleMonitorBtn = document.getElementById('toggleMonitorBtn')
const statusMessage = document.getElementById('statusMessage')
const monitorStatus = document.getElementById('monitorStatus')
const processStatus = document.getElementById('processStatus')
const lastCheck = document.getElementById('lastCheck')

// 監控狀態
let isMonitoring = false

// 顯示狀態訊息
function showStatus(message, isSuccess = true) {
  statusMessage.textContent = message
  statusMessage.className = 'status-message ' + (isSuccess ? 'success' : 'error')
  statusMessage.style.display = 'block'

  setTimeout(() => {
    statusMessage.style.display = 'none'
  }, 3000)
}

// 載入預設或已保存的設定
async function loadConfig() {
  try {
    const config = await window.electronAPI.getConfig()
    if (config.exePath) {
      exePathInput.value = config.exePath
      toggleMonitorBtn.disabled = false
      console.log('已載入設定:', config)
    }
    if (config.interval) {
      intervalInput.value = config.interval
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
  const interval = parseInt(intervalInput.value) || 5

  if (!exePath) {
    showStatus('❌ 請先選擇要監控的程式！', false)
    return
  }

  if (interval < 1 || interval > 3600) {
    showStatus('❌ 監控間隔必須在 1-3600 秒之間！', false)
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
      exePath: exePath,
      interval: interval
    })

    if (result.success) {
      showStatus('✓ ' + result.message, true)
      toggleMonitorBtn.disabled = false
      console.log('設定已保存:', { exePath, interval })
    } else {
      showStatus('✗ ' + result.message, false)
    }
  } catch (error) {
    showStatus('✗ 保存失敗：' + error.message, false)
    console.error('保存設定錯誤:', error)
  }
})

// UI 更新函式
const updateMonitoringUI = (monitoring) => {
  isMonitoring = monitoring
  toggleMonitorBtn.textContent = monitoring ? '⏹️ 停止監控' : '▶️ 開始監控'
  toggleMonitorBtn.classList.toggle('monitoring', monitoring)
  exePathInput.disabled = monitoring
  intervalInput.disabled = monitoring
  monitorStatus.textContent = monitoring ? '監控中' : '未啟動'
  monitorStatus.className = monitoring ? 'status-value monitoring' : 'status-value'

  if (!monitoring) {
    processStatus.textContent = '-'
    processStatus.className = 'status-value'
    lastCheck.textContent = '-'
  }
}

// 驗證監控參數
const validateMonitorParams = (exePath, interval) => {
  if (!exePath) {
    return { valid: false, message: '❌ 請先選擇要監控的程式！' }
  }
  if (interval < 1 || interval > 3600) {
    return { valid: false, message: '❌ 監控間隔必須在 1-3600 秒之間！' }
  }
  return { valid: true }
}

// 處理監控結果
const handleMonitorResult = (result, isStart) => {
  if (result.success) {
    updateMonitoringUI(isStart)
    showStatus('✓ ' + result.message, true)
  } else {
    showStatus('✗ ' + result.message, false)
  }
}

// 開始監控
const startMonitoring = async (exePath, interval) => {
  const validation = validateMonitorParams(exePath, interval)
  if (!validation.valid) {
    showStatus(validation.message, false)
    return
  }

  try {
    const result = await window.electronAPI.startMonitoring({ exePath, interval })
    handleMonitorResult(result, true)
  } catch (error) {
    showStatus('✗ 啟動失敗：' + error.message, false)
  }
}

// 停止監控
const stopMonitoring = async () => {
  try {
    const result = await window.electronAPI.stopMonitoring()
    handleMonitorResult(result, false)
  } catch (error) {
    showStatus('✗ 停止失敗：' + error.message, false)
  }
}

// 處理切換監控按鈕
toggleMonitorBtn.addEventListener('click', async () => {
  if (isMonitoring) {
    await stopMonitoring()
  } else {
    const exePath = exePathInput.value.trim()
    const interval = parseInt(intervalInput.value) || 5
    await startMonitoring(exePath, interval)
  }
})

// 監聽監控狀態更新
window.electronAPI.onMonitorStatus((data) => {
  if (data.stopped) {
    return
  }

  lastCheck.textContent = data.lastCheck

  if (data.isRunning) {
    processStatus.textContent = '✓ 執行中'
    processStatus.className = 'status-value running'
  } else {
    processStatus.textContent = '✗ 未執行'
    processStatus.className = 'status-value stopped'
  }
})

// 頁面載入時讀取設定
loadConfig()