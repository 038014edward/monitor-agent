// ==================== DOM 元素 ====================
const monitorTableBody = document.getElementById('monitorTableBody')
const logContainer = document.getElementById('logContainer')
const statusMessage = document.getElementById('statusMessage')
const addDialog = document.getElementById('addDialog')
const logSectionTitle = document.getElementById('logSectionTitle')

// 工具列按鈕
const addBtn = document.getElementById('addBtn')
const startAllBtn = document.getElementById('startAllBtn')
const stopAllBtn = document.getElementById('stopAllBtn')

// 對話框元素
const newExePathInput = document.getElementById('newExePath')
const newIntervalInput = document.getElementById('newInterval')
const browseBtn = document.getElementById('browseBtn')
const confirmAddBtn = document.getElementById('confirmAddBtn')
const cancelAddBtn = document.getElementById('cancelAddBtn')

// 編輯間隔對話框元素
const editIntervalDialog = document.getElementById('editIntervalDialog')
const editIntervalInput = document.getElementById('editInterval')
const confirmEditIntervalBtn = document.getElementById('confirmEditIntervalBtn')
const cancelEditIntervalBtn = document.getElementById('cancelEditIntervalBtn')
let currentEditingMonitorId = null

// 分隔條拖曳相關
const resizer = document.querySelector('.resizer')
const monitorSection = document.querySelector('.monitor-section')
const logSection = document.querySelector('.log-section')

// ==================== 狀態管理 ====================
let monitors = []
let selectedMonitorId = null

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

// 安全地建立 HTML 元素的輔助函式
const createElement = (tag, options = {}) => {
  const element = document.createElement(tag)
  if (options.className) element.className = options.className
  if (options.textContent) element.textContent = options.textContent
  if (options.title) element.title = options.title
  if (options.dataset) {
    Object.entries(options.dataset).forEach(([key, value]) => {
      element.dataset[key] = value
    })
  }
  if (options.style) {
    Object.entries(options.style).forEach(([key, value]) => {
      element.style[key] = value
    })
  }
  if (options.disabled !== undefined) element.disabled = options.disabled
  if (options.children) {
    options.children.forEach(child => element.appendChild(child))
  }
  return element
}

// ==================== 渲染監控表格 ====================
const renderMonitorTable = () => {
  monitorTableBody.innerHTML = ''

  if (monitors.length === 0) {
    const row = createElement('tr', {
      children: [
        createElement('td', {
          textContent: '尚未新增任何監控項目',
          style: { textAlign: 'center', padding: '40px', color: '#999' }
        })
      ]
    })
    row.children[0].colSpan = 5
    monitorTableBody.appendChild(row)
    return
  }

  monitors.forEach(monitor => {
    // 狀態標籤
    let statusClass = 'not-monitoring'
    if (monitor.isMonitoring) {
      statusClass = monitor.status === '執行中' ? 'running' : 'stopped'
    }

    // 監測中指示器 (圓點)
    const monitoringIndicator = createElement('span', {
      className: `monitoring-indicator ${monitor.isMonitoring ? 'active' : ''}`,
      title: monitor.isMonitoring ? '監測中' : '未監測'
    })

    const statusBadge = createElement('span', {
      className: `status-badge ${statusClass}`,
      textContent: monitor.status || '未監控'
    })

    // 狀態容器 (指示器 + 標籤)
    const statusContainer = createElement('div', {
      style: { display: 'flex', alignItems: 'center', gap: '8px' }
    })
    statusContainer.appendChild(monitoringIndicator)
    statusContainer.appendChild(statusBadge)

    // 操作按鈕容器
    const actionButtons = createElement('div', { style: { whiteSpace: 'nowrap' } })

    const toggleBtn = createElement('button', {
      className: `action-btn ${monitor.isMonitoring ? 'stop' : 'start'}`,
      textContent: monitor.isMonitoring ? '停止' : '啟動',
      dataset: { action: 'toggle', id: monitor.id }
    })

    const deleteBtn = createElement('button', {
      className: 'action-btn delete',
      textContent: '刪除',
      dataset: { action: 'delete', id: monitor.id },
      disabled: monitor.isMonitoring
    })

    const copyBtn = createElement('button', {
      className: 'action-btn copy',
      textContent: '複製路徑',
      dataset: { action: 'copy', id: monitor.id },
      title: '複製程式路徑'
    })

    const autoRestartBtn = createElement('button', {
      className: `action-btn ${monitor.autoRestart ? 'auto-restart-on' : 'auto-restart-off'}`,
      textContent: '自動重啟',
      dataset: { action: 'toggleAutoRestart', id: monitor.id },
      title: monitor.autoRestart ? '自動重啟:已啟用' : '自動重啟:已停用'
    })

    actionButtons.appendChild(toggleBtn)
    actionButtons.appendChild(deleteBtn)
    actionButtons.appendChild(copyBtn)
    actionButtons.appendChild(autoRestartBtn)

    // 建立表格列
    const row = createElement('tr', {
      dataset: { id: monitor.id }
    })

    if (selectedMonitorId === monitor.id) {
      row.classList.add('selected')
    }

    row.appendChild(createElement('td', {
      textContent: getExeFileName(monitor.exePath),
      title: monitor.exePath
    }))

    const statusCell = createElement('td')
    statusCell.appendChild(statusContainer)
    row.appendChild(statusCell)

    row.appendChild(createElement('td', {
      textContent: monitor.lastCheck || '-'
    }))

    // 間隔欄位 - 可點擊編輯
    const intervalCell = createElement('td', {
      textContent: monitor.interval.toString(),
      style: {
        cursor: monitor.isMonitoring ? 'not-allowed' : 'pointer',
        color: monitor.isMonitoring ? '#999' : '#007E8A',
        textDecoration: monitor.isMonitoring ? 'none' : 'underline'
      },
      title: monitor.isMonitoring ? '監控中無法修改' : '點擊編輯間隔'
    })

    intervalCell.addEventListener('click', (e) => {
      e.stopPropagation()
      if (!monitor.isMonitoring) {
        showEditIntervalDialog(monitor.id, monitor.interval)
      } else {
        showStatus('⚠️ 請先停止監控再修改間隔', false)
      }
    })

    row.appendChild(intervalCell)

    const actionCell = createElement('td')
    actionCell.appendChild(actionButtons)
    row.appendChild(actionCell)

    // 點擊列選擇監控項目
    row.addEventListener('click', (e) => {
      if (!e.target.closest('button')) {
        selectMonitor(monitor.id)
      }
    })

    monitorTableBody.appendChild(row)
  })
}

// ==================== 選擇監控項目 ====================
const selectMonitor = (id) => {
  selectedMonitorId = id

  // 更新日誌標題顯示所選程式名稱
  const monitor = monitors.find(m => m.id === id)
  if (monitor) {
    const programName = monitor.exePath.split(/[/\\]/).pop()
    logSectionTitle.textContent = `活動日誌 - ${programName}`
  }

  renderMonitorTable()
  loadMonitorLog(id)
}

// ==================== 載入日誌 ====================
const loadMonitorLog = async (id) => {
  const monitor = monitors.find(m => m.id === id)
  if (!monitor) {
    logContainer.innerHTML = '<div class="log-empty">選擇一個監控項目以查看其日誌</div>'
    return
  }

  try {
    const logs = await window.electronAPI.getMonitorLog(monitor.exePath)
    if (logs && logs.length > 0) {
      logContainer.innerHTML = ''
      logs.forEach(logLine => {
        const entry = createElement('div', {
          className: 'log-entry',
          textContent: logLine
        })
        logContainer.appendChild(entry)
      })
      // 自動捲動到頂部 (顯示最新記錄)
      logContainer.scrollTop = 0
    } else {
      logContainer.innerHTML = '<div class="log-empty">暫無日誌記錄</div>'
    }
  } catch (error) {
    logContainer.innerHTML = `<div class="log-empty">載入日誌失敗: ${error.message}</div>`
  }
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

  const exists = await window.electronAPI.checkFileExists(monitor.exePath)
  if (!exists) {
    showStatus(`❌ 執行檔不存在：${getExeFileName(monitor.exePath)}`, false)
    return
  }

  try {
    const result = await window.electronAPI.startMonitoring({
      id: monitor.id,
      exePath: monitor.exePath,
      interval: monitor.interval,
      autoRestart: monitor.autoRestart || false
    })

    if (result.success) {
      monitor.isMonitoring = true
      await saveMonitors()
      renderMonitorTable()
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
      await saveMonitors()
      renderMonitorTable()
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

  if (selectedMonitorId === id) {
    selectedMonitorId = null
    logContainer.innerHTML = '<div class="log-empty">選擇一個監控項目以查看其日誌</div>'
  }

  await saveMonitors()
  renderMonitorTable()
  showStatus(`✓ 已刪除 ${getExeFileName(monitor.exePath)}`, true)
}

// ==================== 資料持久化 ====================
const saveMonitors = async () => {
  try {
    const monitorsToSave = monitors.map(m => ({
      id: m.id,
      exePath: m.exePath,
      interval: m.interval,
      autoRestart: m.autoRestart || false,
      isMonitoring: m.isMonitoring || false
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
        lastCheck: '-',
        autoRestart: m.autoRestart || false
      }))
      renderMonitorTable()

      // 自動啟動之前正在監控的項目
      for (const m of savedMonitors) {
        if (m.isMonitoring) {
          await startMonitor(m.id)
        }
      }
    }
  } catch (error) {
    console.error('載入失敗:', error)
  }
}

// ==================== 對話框控制 ====================
const showAddDialog = () => {
  newExePathInput.value = ''
  newIntervalInput.value = '5'
  addDialog.style.display = 'flex'
}

const hideAddDialog = () => {
  addDialog.style.display = 'none'
}

const showEditIntervalDialog = (monitorId, currentInterval) => {
  currentEditingMonitorId = monitorId
  editIntervalInput.value = currentInterval
  editIntervalDialog.style.display = 'flex'
  // 自動選中輸入框內容
  setTimeout(() => editIntervalInput.select(), 100)
}

const hideEditIntervalDialog = () => {
  editIntervalDialog.style.display = 'none'
  currentEditingMonitorId = null
}

// ==================== 事件處理 ====================
// 表格中的按鈕點擊
monitorTableBody.addEventListener('click', async (e) => {
  const btn = e.target.closest('button[data-action]')
  if (!btn) return

  e.stopPropagation()
  const action = btn.dataset.action
  const id = btn.dataset.id

  if (action === 'toggle') {
    await toggleMonitor(id)
  } else if (action === 'delete') {
    await deleteMonitor(id)
  } else if (action === 'copy') {
    await copyMonitorPath(id)
  } else if (action === 'toggleAutoRestart') {
    toggleAutoRestart(id)
  }
})

// 複製監控程式路徑
const copyMonitorPath = async (id) => {
  const monitor = monitors.find(m => m.id === id)
  if (monitor) {
    try {
      await navigator.clipboard.writeText(monitor.exePath)
      showStatus(`✓ 已複製路徑: ${monitor.exePath}`, true)
    } catch (error) {
      showStatus('✗ 複製失敗', false)
      console.error('複製失敗:', error)
    }
  }
}

// 切換自動重啟功能
const toggleAutoRestart = async (id) => {
  const monitor = monitors.find(m => m.id === id)
  if (monitor) {
    monitor.autoRestart = !monitor.autoRestart
    await saveMonitors()
    renderMonitorTable()

    // 如果正在監控,更新後端設定
    if (monitor.isMonitoring) {
      await window.electronAPI.updateAutoRestart(id, monitor.autoRestart)
    }

    const status = monitor.autoRestart ? '開啟' : '關閉'
    showStatus(`✓ 已${status}自動重啟: ${getExeFileName(monitor.exePath)}`, true)
  }
}

// 工具列按鈕
addBtn.addEventListener('click', showAddDialog)

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
      renderMonitorTable()
      showStatus(`✓ 已停止所有監控 (${monitoring.length} 個)`, true)
    } else {
      showStatus(`✗ ${result.message}`, false)
    }
  } catch (error) {
    showStatus(`✗ 停止失敗：${error.message}`, false)
  }
})

// 對話框按鈕
browseBtn.addEventListener('click', async () => {
  const filePath = await window.electronAPI.openFile()
  if (filePath) {
    newExePathInput.value = filePath
  }
})

confirmAddBtn.addEventListener('click', async () => {
  const exePath = newExePathInput.value.trim()
  const interval = parseInt(newIntervalInput.value) || 5

  if (monitors.length >= 5) {
    showStatus('⚠️ 最多只能新增 5 個監控項目', false)
    return
  }

  if (!exePath) {
    showStatus('❌ 請輸入程式路徑', false)
    return
  }

  if (interval < 5 || interval > 3600) {
    showStatus('❌ 監控間隔必須在 5-3600 秒之間', false)
    return
  }

  const exists = await window.electronAPI.checkFileExists(exePath)
  if (!exists) {
    showStatus('❌ 找不到指定的執行檔', false)
    return
  }

  if (monitors.some(m => m.exePath === exePath)) {
    showStatus('⚠️ 該程式已在監控列表中', false)
    return
  }

  const newMonitor = {
    id: Date.now().toString(),
    exePath,
    interval,
    isMonitoring: false,
    status: '未監控',
    lastCheck: '-',
    autoRestart: true
  }

  monitors.push(newMonitor)
  await saveMonitors()
  renderMonitorTable()
  hideAddDialog()
  showStatus(`✓ 已新增 ${getExeFileName(exePath)}`, true)
})

cancelAddBtn.addEventListener('click', hideAddDialog)

// 點擊對話框外部關閉
addDialog.addEventListener('click', (e) => {
  if (e.target === addDialog) {
    hideAddDialog()
  }
})

// 編輯間隔對話框事件
confirmEditIntervalBtn.addEventListener('click', async () => {
  const newInterval = parseInt(editIntervalInput.value)

  if (!newInterval || newInterval < 5 || newInterval > 3600) {
    showStatus('❌ 間隔必須在 5-3600 秒之間', false)
    return
  }

  if (currentEditingMonitorId) {
    const monitor = monitors.find(m => m.id === currentEditingMonitorId)
    if (monitor) {
      monitor.interval = newInterval
      await saveMonitors()
      renderMonitorTable()
      showStatus(`✓ 已更新間隔為 ${newInterval} 秒`, true)
    }
  }

  hideEditIntervalDialog()
})

cancelEditIntervalBtn.addEventListener('click', hideEditIntervalDialog)

editIntervalDialog.addEventListener('click', (e) => {
  if (e.target === editIntervalDialog) {
    hideEditIntervalDialog()
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
    renderMonitorTable()

    // 如果是選中的監控項目,重新載入日誌並更新標題
    if (selectedMonitorId === monitor.id) {
      const programName = monitor.exePath.split(/[/\\]/).pop()
      logSectionTitle.textContent = `活動日誌 - ${programName}`
      loadMonitorLog(monitor.id)
    }
  }
})

// ==================== 初始化 ====================
loadMonitors()

// ==================== 分隔線拖拽功能 ====================
let isResizing = false
let startY = 0
let startHeight = 0

resizer.addEventListener('mousedown', (e) => {
  isResizing = true
  startY = e.clientY
  startHeight = monitorSection.offsetHeight
  document.body.style.cursor = 'row-resize'
  document.body.style.userSelect = 'none'
  e.preventDefault()
})

document.addEventListener('mousemove', (e) => {
  if (!isResizing) return

  const deltaY = e.clientY - startY
  const newHeight = startHeight + deltaY
  const containerHeight = monitorSection.parentElement.offsetHeight

  // 限制最小和最大高度 (20% - 80%)
  const minHeight = containerHeight * 0.2
  const maxHeight = containerHeight * 0.8

  if (newHeight >= minHeight && newHeight <= maxHeight) {
    monitorSection.style.flexBasis = `${newHeight}px`
  }
})

document.addEventListener('mouseup', () => {
  if (isResizing) {
    isResizing = false
    document.body.style.cursor = ''
    document.body.style.userSelect = ''
  }
})
