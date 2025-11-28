// ==================== DOM 元素 ====================
const newExePathInput = document.getElementById('newExePath')
const newIntervalInput = document.getElementById('newInterval')
const browseBtn = document.getElementById('browseBtn')
const addBtn = document.getElementById('addBtn')
const monitorList = document.getElementById('monitorList')
const startAllBtn = document.getElementById('startAllBtn')
const stopAllBtn = document.getElementById('stopAllBtn')
const statusMessage = document.getElementById('statusMessage')

// ==================== 狀態管理 ====================
let monitors = [] // {id, exePath, interval, isMonitoring, status, lastCheck}

// ==================== UI 輔助函式 ====================
const showStatus = (message, isSuccess = true) => {
  statusMessage.textContent = message
  statusMessage.className = 'status-message ' + (isSuccess ? 'success' : 'error')
  statusMessage.style.display = 'block'
  setTimeout(() => statusMessage.style.display = 'none', 3000)
}

const getExeFileName = (fullPath) => {
  return fullPath.split('\\').pop().split('/').pop()
}

// ==================== 渲染監控列表 ====================
const renderMonitorList = () => {
  if (monitors.length === 0) {
    monitorList.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📋</div>
        <div class="empty-state-text">尚未新增任何監控項目</div>
      </div>
    `
    return
  }

  monitorList.innerHTML = monitors.map(monitor => `
    <div class="monitor-item ${monitor.isMonitoring ? 'monitoring' : ''}" data-id="${monitor.id}">
      <div class="monitor-header">
        <div class="monitor-path" title="${monitor.exePath}">
          ${getExeFileName(monitor.exePath)} <span class="interval-badge">⏱️ ${monitor.interval} 秒</span>
        </div>
        <div class="monitor-controls">
          <button class="item-btn toggle-btn ${monitor.isMonitoring ? 'monitoring' : ''}" data-action="toggle" data-id="${monitor.id}">
            ${monitor.isMonitoring ? '⏹️ 停止' : '▶️ 啟動'}
          </button>
          <button class="item-btn delete-btn" data-action="delete" data-id="${monitor.id}" ${monitor.isMonitoring ? 'disabled' : ''}>🗑️ 刪除</button>
        </div>
      </div>
      <div class="monitor-info">
        <div class="info-item">
          <span class="info-label">狀態:</span>
          <span class="info-value ${monitor.status === '執行中' ? 'running' : 'stopped'}">
            ${monitor.status || '未監控'}
          </span>
        </div>
        <div class="info-item">
          <span class="info-label">最後檢查:</span>
          <span class="info-value">${monitor.lastCheck || '-'}</span>
        </div>
        <div class="info-item">
          <span class="info-label">路徑:</span>
          <span class="info-value" style="font-size: 10px; overflow: hidden; text-overflow: ellipsis;">${monitor.exePath}</span>
        </div>
      </div>
    </div>
  `).join('')
}

// ==================== 監控操作 ====================
const toggleMonitor = async (id) => {
  const monitor = monitors.find(m => m.id === id)
  if (!monitor) return

  if (monitor.isMonitoring) {
    await stopMonitor(id)
  } else {
    await startMonitor(id)
  }
}

const startMonitor = async (id) => {
  const monitor = monitors.find(m => m.id === id)
  if (!monitor) return

  try {
    const result = await window.electronAPI.startMonitoring({
      id: monitor.id,
      exePath: monitor.exePath,
      interval: monitor.interval
    })

    if (result.success) {
      monitor.isMonitoring = true
      renderMonitorList()
      showStatus(`✓ 已開始監控 ${getExeFileName(monitor.exePath)}`, true)
    } else {
      showStatus(`✗ ${result.message}`, false)
    }
  } catch (error) {
    showStatus(`✗ 啟動失敗：${error.message}`, false)
  }
}

const stopMonitor = async (id) => {
  const monitor = monitors.find(m => m.id === id)
  if (!monitor) return

  try {
    const result = await window.electronAPI.stopMonitoring(id)

    if (result.success) {
      monitor.isMonitoring = false
      monitor.status = '未監控'
      monitor.lastCheck = '-'
      renderMonitorList()
      showStatus(`✓ 已停止監控 ${getExeFileName(monitor.exePath)}`, true)
    } else {
      showStatus(`✗ ${result.message}`, false)
    }
  } catch (error) {
    showStatus(`✗ 停止失敗：${error.message}`, false)
  }
}

const deleteMonitor = async (id) => {
  const monitor = monitors.find(m => m.id === id)
  if (!monitor) return

  if (monitor.isMonitoring) {
    showStatus('⚠️ 請先停止監控再刪除', false)
    return
  }

  monitors = monitors.filter(m => m.id !== id)
  await saveMonitors()
  renderMonitorList()
  showStatus(`✓ 已刪除 ${getExeFileName(monitor.exePath)}`, true)
}

// ==================== 資料持久化 ====================
const saveMonitors = async () => {
  try {
    // 只儲存必要的檔案，不包含運行時狀態
    const monitorsToSave = monitors.map(m => ({
      id: m.id,
      exePath: m.exePath,
      interval: m.interval
    }))
    await window.electronAPI.saveMonitors(monitorsToSave)
  } catch (error) {
    console.error('保存失敗:', error)
  }
}

const loadMonitors = async () => {
  try {
    const savedMonitors = await window.electronAPI.getMonitors()
    if (savedMonitors && Array.isArray(savedMonitors)) {
      monitors = savedMonitors.map(m => ({
        ...m,
        isMonitoring: false,
        status: '未監控',
        lastCheck: '-'
      }))
      renderMonitorList()
    }
  } catch (error) {
    console.error('載入失敗:', error)
  }
}

// ==================== 事件處理 ====================
// 使用事件委派處理監控列表中的按鈕點擊
monitorList.addEventListener('click', async (e) => {
  const btn = e.target.closest('button[data-action]')
  if (!btn) return

  const action = btn.dataset.action
  const id = btn.dataset.id

  if (action === 'toggle') {
    await toggleMonitor(id)
  } else if (action === 'delete') {
    await deleteMonitor(id)
  }
})

browseBtn.addEventListener('click', async () => {
  const filePath = await window.electronAPI.openFile()
  if (filePath) {
    newExePathInput.value = filePath
  }
})

addBtn.addEventListener('click', async () => {
  const exePath = newExePathInput.value.trim()
  const interval = parseInt(newIntervalInput.value) || 5

  if (!exePath) {
    showStatus('❌ 請輸入程式路徑', false)
    return
  }

  if (interval < 1 || interval > 3600) {
    showStatus('❌ 監控間隔必須在 1-3600 秒之間', false)
    return
  }

  // 檢查檔案是否存在
  const exists = await window.electronAPI.checkFileExists(exePath)
  if (!exists) {
    showStatus('❌ 找不到指定的執行檔', false)
    return
  }

  // 檢查是否已存在
  if (monitors.some(m => m.exePath === exePath)) {
    showStatus('⚠️ 該程式已在監控列表中', false)
    return
  }

  // 新增監控項目
  const newMonitor = {
    id: Date.now().toString(),
    exePath,
    interval,
    isMonitoring: false,
    status: '未監控',
    lastCheck: '-'
  }

  monitors.push(newMonitor)
  await saveMonitors()
  renderMonitorList()

  // 清空輸入
  newExePathInput.value = ''
  newIntervalInput.value = '5'

  showStatus(`✓ 已新增 ${getExeFileName(exePath)}`, true)
})

startAllBtn.addEventListener('click', async () => {
  const notMonitoring = monitors.filter(m => !m.isMonitoring)
  if (notMonitoring.length === 0) {
    showStatus('⚠️ 沒有可啟動的監控項目', false)
    return
  }

  for (const monitor of notMonitoring) {
    await startMonitor(monitor.id)
  }
})

stopAllBtn.addEventListener('click', async () => {
  const monitoring = monitors.filter(m => m.isMonitoring)
  if (monitoring.length === 0) {
    showStatus('⚠️ 沒有正在監控的項目', false)
    return
  }

  try {
    const result = await window.electronAPI.stopAllMonitoring()
    if (result.success) {
      monitors.forEach(m => {
        m.isMonitoring = false
        m.status = '未監控'
        m.lastCheck = '-'
      })
      renderMonitorList()
      showStatus(`✓ 已停止所有監控 (${monitoring.length} 個)`, true)
    } else {
      showStatus(`✗ ${result.message}`, false)
    }
  } catch (error) {
    showStatus(`✗ 停止失敗：${error.message}`, false)
  }
})

// ==================== 監聽狀態更新 ====================
window.electronAPI.onMonitorStatus((data) => {
  const monitor = monitors.find(m => m.id === data.id)
  if (monitor) {
    if (data.stopped) {
      monitor.isMonitoring = false
      monitor.status = '未監控'
      monitor.lastCheck = '-'
    } else {
      monitor.status = data.status || (data.isRunning ? '執行中' : '未執行')
      monitor.lastCheck = data.lastCheck
    }
    renderMonitorList()
  }
})

// ==================== 初始化 ====================
loadMonitors()
