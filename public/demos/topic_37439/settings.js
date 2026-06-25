document.addEventListener('DOMContentLoaded', function () {
  const el = {
    btnBack: document.getElementById('btnBack'),
    durationValue: document.getElementById('durationValue'),
    durationSlider: document.getElementById('durationSlider'),
    restValue: document.getElementById('restValue'),
    restSlider: document.getElementById('restSlider'),
    idleValue: document.getElementById('idleValue'),
    idleSlider: document.getElementById('idleSlider'),
    lockValue: document.getElementById('lockValue'),
    lockSlider: document.getElementById('lockSlider'),
    toggleFullscreen: document.getElementById('toggleFullscreen'),
    toggleNotification: document.getElementById('toggleNotification'),
    btnSave: document.getElementById('btnSave'),
    toast: document.getElementById('toast'),
  }

  const DEFAULT_MINUTES = 45
  const DEFAULT_REST_MINUTES = 3
  const DEFAULT_IDLE_MINUTES = 5
  const DEFAULT_LOCK_SECONDS = 30
  let savedMinutes = DEFAULT_MINUTES
  let currentMinutes = DEFAULT_MINUTES
  let savedRestMinutes = DEFAULT_REST_MINUTES
  let currentRestMinutes = DEFAULT_REST_MINUTES
  let savedIdleMinutes = DEFAULT_IDLE_MINUTES
  let currentIdleMinutes = DEFAULT_IDLE_MINUTES
  let savedLockSeconds = DEFAULT_LOCK_SECONDS
  let currentLockSeconds = DEFAULT_LOCK_SECONDS
  let savedFullscreen = true
  let savedNotification = true
  let hasUserChanged = false

  // 直接从 chrome.storage.local 读取，避免依赖 Service Worker 消息响应
  function getStorageState() {
    return new Promise(function (resolve) {
      chrome.storage.local.get(
        {
          workDuration: DEFAULT_MINUTES * 60 * 1000,
          restDuration: DEFAULT_REST_MINUTES * 60 * 1000,
          idleRecoveryThreshold: DEFAULT_IDLE_MINUTES * 60 * 1000,
          lockRecoveryThreshold: DEFAULT_LOCK_SECONDS * 1000,
          enableFullscreen: true,
          enableNotification: true,
        },
        function (data) {
          resolve(data)
        },
      )
    })
  }

  function send(type, data) {
    return new Promise(function (resolve, reject) {
      chrome.runtime.sendMessage({ type: type, ...data }, function (response) {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message))
          return
        }
        resolve(response)
      })
    })
  }

  // ---------- 工作时长 ----------
  function syncPresetButtons(minutes) {
    document.querySelectorAll('.preset-btn').forEach(function (btn) {
      btn.classList.toggle('active', Number(btn.dataset.val) === minutes)
    })
  }

  function setSlider(minutes) {
    currentMinutes = Number(minutes)
    el.durationValue.textContent = String(currentMinutes)
    el.durationSlider.value = String(currentMinutes)
    syncPresetButtons(currentMinutes)
    updateSaveButton()
  }

  function onSliderInput(value) {
    hasUserChanged = true
    currentMinutes = Number(value)
    el.durationValue.textContent = String(currentMinutes)
    syncPresetButtons(currentMinutes)
    updateSaveButton()
  }

  // ---------- 休息时长 ----------
  function syncRestPresetButtons(minutes) {
    document.querySelectorAll('.rest-preset-btn').forEach(function (btn) {
      btn.classList.toggle('active', Number(btn.dataset.val) === minutes)
    })
  }

  function setRestSlider(minutes) {
    currentRestMinutes = Number(minutes)
    el.restValue.textContent = String(currentRestMinutes)
    el.restSlider.value = String(currentRestMinutes)
    syncRestPresetButtons(currentRestMinutes)
    updateSaveButton()
  }

  function onRestSliderInput(value) {
    hasUserChanged = true
    currentRestMinutes = Number(value)
    el.restValue.textContent = String(currentRestMinutes)
    syncRestPresetButtons(currentRestMinutes)
    updateSaveButton()
  }

  // ---------- 空闲阈值 ----------
  function syncIdlePresetButtons(minutes) {
    document.querySelectorAll('.idle-preset-btn').forEach(function (btn) {
      btn.classList.toggle('active', Number(btn.dataset.val) === minutes)
    })
  }

  function setIdleSlider(minutes) {
    currentIdleMinutes = Number(minutes)
    el.idleValue.textContent = String(currentIdleMinutes)
    el.idleSlider.value = String(currentIdleMinutes)
    syncIdlePresetButtons(currentIdleMinutes)
    updateSaveButton()
  }

  function onIdleSliderInput(value) {
    hasUserChanged = true
    currentIdleMinutes = Number(value)
    el.idleValue.textContent = String(currentIdleMinutes)
    syncIdlePresetButtons(currentIdleMinutes)
    updateSaveButton()
  }

  // ---------- 锁屏阈值 ----------
  function syncLockPresetButtons(seconds) {
    document.querySelectorAll('.lock-preset-btn').forEach(function (btn) {
      btn.classList.toggle('active', Number(btn.dataset.val) === seconds)
    })
  }

  function setLockSlider(seconds) {
    currentLockSeconds = Number(seconds)
    el.lockValue.textContent = String(currentLockSeconds)
    el.lockSlider.value = String(currentLockSeconds)
    syncLockPresetButtons(currentLockSeconds)
    updateSaveButton()
  }

  function onLockSliderInput(value) {
    hasUserChanged = true
    currentLockSeconds = Number(value)
    el.lockValue.textContent = String(currentLockSeconds)
    syncLockPresetButtons(currentLockSeconds)
    updateSaveButton()
  }

  // ---------- 保存按钮状态 ----------
  function updateSaveButton() {
    const changed =
      currentMinutes !== savedMinutes ||
      currentRestMinutes !== savedRestMinutes ||
      currentIdleMinutes !== savedIdleMinutes ||
      currentLockSeconds !== savedLockSeconds ||
      el.toggleFullscreen.checked !== savedFullscreen ||
      el.toggleNotification.checked !== savedNotification
    if (changed) {
      el.btnSave.textContent = '保存设置'
    }
  }

  function showToast(text) {
    el.toast.textContent = text
    el.toast.classList.add('show')
    setTimeout(function () {
      el.toast.classList.remove('show')
    }, 1800)
  }

  function closeTab() {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      if (tabs[0]) chrome.tabs.remove(tabs[0].id)
    })
  }

  // ---------- 工作时长滑块事件 ----------
  el.durationSlider.addEventListener('input', function (e) {
    onSliderInput(e.target.value)
  })

  // ---------- 休息时长滑块事件 ----------
  el.restSlider.addEventListener('input', function (e) {
    onRestSliderInput(e.target.value)
  })

  // ---------- 空闲阈值滑块事件 ----------
  el.idleSlider.addEventListener('input', function (e) {
    onIdleSliderInput(e.target.value)
  })

  // ---------- 锁屏阈值滑块事件 ----------
  el.lockSlider.addEventListener('input', function (e) {
    onLockSliderInput(e.target.value)
  })

  // ---------- 预设按钮 ----------
  document.querySelectorAll('.preset-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      hasUserChanged = true
      setSlider(Number(btn.dataset.val))
    })
  })

  document.querySelectorAll('.rest-preset-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      hasUserChanged = true
      setRestSlider(Number(btn.dataset.val))
    })
  })

  document.querySelectorAll('.idle-preset-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      hasUserChanged = true
      setIdleSlider(Number(btn.dataset.val))
    })
  })

  document.querySelectorAll('.lock-preset-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      hasUserChanged = true
      setLockSlider(Number(btn.dataset.val))
    })
  })

  // ---------- 提醒方式开关事件 ----------
  el.toggleFullscreen.addEventListener('change', function () {
    hasUserChanged = true
    updateSaveButton()
  })
  el.toggleNotification.addEventListener('change', function () {
    hasUserChanged = true
    updateSaveButton()
  })

  // ---------- 保存 ----------
  el.btnSave.addEventListener('click', async function () {
    const minutes = currentMinutes
    const restMinutes = currentRestMinutes
    const idleMinutes = currentIdleMinutes
    const lockSeconds = currentLockSeconds
    const fullscreenVal = el.toggleFullscreen.checked
    const notificationVal = el.toggleNotification.checked
    const workChanged = minutes !== savedMinutes
    const restChanged = restMinutes !== savedRestMinutes
    const idleChanged = idleMinutes !== savedIdleMinutes
    const lockChanged = lockSeconds !== savedLockSeconds
    const modeChanged = fullscreenVal !== savedFullscreen || notificationVal !== savedNotification

    if (!workChanged && !restChanged && !idleChanged && !lockChanged && !modeChanged) {
      showToast('当前值与已保存值相同')
      return
    }

    el.btnSave.textContent = '保存中…'
    try {
      // 直接写入 chrome.storage.local，确保数据持久化
      // 不依赖 Service Worker 是否存活（MV3 中 Service Worker 可能休眠导致 sendMessage 失败）
      const patch = {}
      if (workChanged) patch.workDuration = minutes * 60 * 1000
      if (restChanged) patch.restDuration = restMinutes * 60 * 1000
      if (idleChanged) patch.idleRecoveryThreshold = idleMinutes * 60 * 1000
      if (lockChanged) patch.lockRecoveryThreshold = lockSeconds * 1000
      if (modeChanged) {
        patch.enableFullscreen = fullscreenVal
        patch.enableNotification = notificationVal
      }
      await new Promise(function (resolve, reject) {
        chrome.storage.local.set(patch, function () {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message))
            return
          }
          resolve()
        })
      })

      // 更新已保存值
      if (workChanged) savedMinutes = minutes
      if (restChanged) savedRestMinutes = restMinutes
      if (idleChanged) savedIdleMinutes = idleMinutes
      if (lockChanged) savedLockSeconds = lockSeconds
      if (modeChanged) {
        savedFullscreen = fullscreenVal
        savedNotification = notificationVal
      }

      // 通知 background 应用变更（重置计时器等），失败不影响保存结果
      // 设置已持久化到 storage，background 下次读取时自动生效
      const notifications = []
      if (workChanged) notifications.push(send('UPDATE_WORK_DURATION', { minutes: minutes }))
      if (restChanged) notifications.push(send('UPDATE_REST_DURATION', { minutes: restMinutes }))
      if (idleChanged) notifications.push(send('UPDATE_IDLE_THRESHOLD', { minutes: idleMinutes }))
      if (lockChanged) notifications.push(send('UPDATE_LOCK_THRESHOLD', { seconds: lockSeconds }))
      if (modeChanged) {
        notifications.push(
          send('UPDATE_REMINDER_MODE', {
            enableFullscreen: fullscreenVal,
            enableNotification: notificationVal,
          }),
        )
      }
      await Promise.all(
        notifications.map(function (p) {
          return p.catch(function () {})
        }),
      )

      el.btnSave.textContent = '保存设置'
      updateSaveButton()
      showToast('已保存')
    } catch (e) {
      el.btnSave.textContent = '保存设置'
      updateSaveButton()
      showToast('保存失败，请重试')
    }
  })

  // 返回按钮 —— 仅用户手动点击才关闭
  el.btnBack.addEventListener('click', closeTab)

  // ---------- 初始化 ----------
  function initialize() {
    getStorageState()
      .then(function (s) {
        const minutes = Math.round((s && s.workDuration ? s.workDuration : DEFAULT_MINUTES * 60 * 1000) / 60000)
        const restMinutes = Math.round(
          (s && s.restDuration ? s.restDuration : DEFAULT_REST_MINUTES * 60 * 1000) / 60000,
        )
        const idleMinutes = Math.round(
          (s && s.idleRecoveryThreshold ? s.idleRecoveryThreshold : DEFAULT_IDLE_MINUTES * 60 * 1000) / 60000,
        )
        const lockSeconds = Math.round(
          (s && s.lockRecoveryThreshold ? s.lockRecoveryThreshold : DEFAULT_LOCK_SECONDS * 1000) / 1000,
        )
        savedMinutes = minutes
        savedRestMinutes = restMinutes
        savedIdleMinutes = idleMinutes
        savedLockSeconds = lockSeconds
        savedFullscreen = s.enableFullscreen !== false
        savedNotification = s.enableNotification !== false
        if (!hasUserChanged) {
          setSlider(minutes)
          setRestSlider(restMinutes)
          setIdleSlider(idleMinutes)
          setLockSlider(lockSeconds)
          el.toggleFullscreen.checked = savedFullscreen
          el.toggleNotification.checked = savedNotification
        }
      })
      .catch(function () {
        savedMinutes = DEFAULT_MINUTES
        savedRestMinutes = DEFAULT_REST_MINUTES
        savedIdleMinutes = DEFAULT_IDLE_MINUTES
        savedLockSeconds = DEFAULT_LOCK_SECONDS
        savedFullscreen = true
        savedNotification = true
        if (!hasUserChanged) {
          setSlider(DEFAULT_MINUTES)
          setRestSlider(DEFAULT_REST_MINUTES)
          setIdleSlider(DEFAULT_IDLE_MINUTES)
          setLockSlider(DEFAULT_LOCK_SECONDS)
          el.toggleFullscreen.checked = true
          el.toggleNotification.checked = true
        }
      })
  }

  initialize()
})
