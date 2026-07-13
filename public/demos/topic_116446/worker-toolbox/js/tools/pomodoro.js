/**
 * 打工人的工具箱 - 番茄钟工具
 * 支持工作/休息计时、统计功能
 * 时间参数可在设置中配置
 */

(function() {
  'use strict';

  // 计时器状态
  let timerInterval = null;
  let remainingSeconds = 0;
  let isRunning = false;
  let isWorkMode = true; // true: 工作模式, false: 休息模式
  let completedPomodoros = 0; // 当前轮次完成的番茄数
  
  // 状态变化回调函数列表
  const stateChangeListeners = [];

  /**
   * 初始化
   */
  function init() {
    bindEvents();
    loadStats();
    resetTimer();
    
    // 监听页面进入事件
    document.addEventListener('pageEnter', (e) => {
      if (e.detail.pageId === 'pomodoroPage') {
        loadStats();
      }
    });
    
    // 监听设置变化（可以通过 storage 事件）
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area === 'sync' && changes.settings && !isRunning) {
        resetTimer();
      }
    });
    
    // 监听数据重置事件
    document.addEventListener('dataReset', () => {
      resetTimer();
      loadStats();
    });
    document.addEventListener('dataImported', () => {
      resetTimer();
      loadStats();
    });
  }

  /**
   * 绑定事件
   */
  function bindEvents() {
    // 开始按钮
    document.getElementById('startTimerBtn').addEventListener('click', startTimer);
    
    // 暂停按钮
    document.getElementById('pauseTimerBtn').addEventListener('click', pauseTimer);
    
    // 重置按钮
    document.getElementById('resetTimerBtn').addEventListener('click', resetTimer);
  }

  /**
   * 获取设置
   */
  async function getPomodoroSettings() {
    const settings = await Storage.getSettings();
    return {
      workTime: settings.pomodoroWorkTime || 25,
      breakTime: settings.pomodoroBreakTime || 5,
      longBreakTime: settings.pomodoroLongBreakTime || 15,
      longBreakInterval: settings.pomodoroLongBreakInterval || 4
    };
  }

  /**
   * 开始计时
   */
  async function startTimer() {
    if (isRunning) return;
    
    isRunning = true;
    updateButtons();
    
    timerInterval = setInterval(() => {
      remainingSeconds--;
      updateDisplay();
      
      if (remainingSeconds <= 0) {
        completeInterval();
      }
    }, 1000);
  }

  /**
   * 暂停计时
   */
  function pauseTimer() {
    if (!isRunning) return;
    
    isRunning = false;
    clearInterval(timerInterval);
    timerInterval = null;
    updateButtons();
  }

  /**
   * 重置计时器
   */
  async function resetTimer() {
    pauseTimer();
    
    const settings = await getPomodoroSettings();
    const minutes = isWorkMode ? settings.workTime : settings.breakTime;
    remainingSeconds = minutes * 60;
    
    updateDisplay();
    updateStatus();
    updateButtons();
  }

  /**
   * 完成一个时间段
   */
  async function completeInterval() {
    pauseTimer();
    
    // 播放提示音（使用系统通知或简单的音频）
    playNotification();
    
    if (isWorkMode) {
      // 工作结束，记录番茄
      const settings = await getPomodoroSettings();
      completedPomodoros++;
      
      // 保存统计
      await Storage.incrementPomodoro(settings.workTime);
      await loadStats();
      
      // 判断是短休息还是长休息
      if (completedPomodoros % settings.longBreakInterval === 0) {
        // 长休息
        isWorkMode = false;
        remainingSeconds = settings.longBreakTime * 60;
        App.showToast('🍅 完成一轮！来个长休息吧~', 'success', 3000);
      } else {
        // 短休息
        isWorkMode = false;
        remainingSeconds = settings.breakTime * 60;
        App.showToast('🍅 工作结束，休息一下~', 'success', 3000);
      }
    } else {
      // 休息结束
      isWorkMode = true;
      const settings = await getPomodoroSettings();
      remainingSeconds = settings.workTime * 60;
      App.showToast('⏰ 休息结束，继续加油！', 'success', 3000);
    }
    
    updateDisplay();
    updateStatus();
    updateButtons();
    
    // 自动开始下一个阶段
    // startTimer(); // 可选：是否自动开始
  }

  /**
   * 更新显示
   */
  function updateDisplay() {
    const minutes = Math.floor(remainingSeconds / 60);
    const seconds = remainingSeconds % 60;
    const timeStr = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    
    document.getElementById('timerDisplay').textContent = timeStr;
    
    // 更新标题
    document.title = `${timeStr} - ${isWorkMode ? '工作中' : '休息中'} | 打工人工具箱`;
    
    // 触发状态变化事件
    notifyStateChange();
  }
  
  /**
   * 通知所有监听器状态变化
   */
  function notifyStateChange() {
    const minutes = Math.floor(remainingSeconds / 60);
    const seconds = remainingSeconds % 60;
    const timeStr = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    
    stateChangeListeners.forEach(listener => {
      listener({
        isRunning,
        isWorkMode,
        remainingSeconds,
        timeStr
      });
    });
  }
  
  /**
   * 添加状态变化监听器
   */
  function addStateChangeListener(callback) {
    if (typeof callback === 'function') {
      stateChangeListeners.push(callback);
    }
  }
  
  /**
   * 获取当前状态
   */
  function getCurrentState() {
    const minutes = Math.floor(remainingSeconds / 60);
    const seconds = remainingSeconds % 60;
    const timeStr = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    
    return {
      isRunning,
      isWorkMode,
      remainingSeconds,
      timeStr
    };
  }

  /**
   * 更新状态文字
   */
  function updateStatus() {
    const statusEl = document.getElementById('pomodoroStatus');
    
    if (isWorkMode) {
      statusEl.textContent = '🎯 专注工作';
      statusEl.style.color = 'var(--pixel-accent-green)';
    } else {
      statusEl.textContent = '☕ 休息时间';
      statusEl.style.color = 'var(--pixel-accent-blue)';
    }
  }

  /**
   * 更新按钮状态
   */
  function updateButtons() {
    const startBtn = document.getElementById('startTimerBtn');
    const pauseBtn = document.getElementById('pauseTimerBtn');
    
    if (isRunning) {
      startBtn.style.display = 'none';
      pauseBtn.style.display = 'inline-flex';
    } else {
      startBtn.style.display = 'inline-flex';
      pauseBtn.style.display = 'none';
    }
  }

  /**
   * 加载统计数据
   */
  async function loadStats() {
    const stats = await Storage.getPomodoroStats();
    
    // 检查是否是今天的数据
    const today = new Date().toDateString();
    const todayCount = stats.lastDate === today ? stats.todayCount : 0;
    
    document.getElementById('pomodoroCount').textContent = todayCount;
    document.getElementById('workMinutes').textContent = stats.totalMinutes;
  }

  /**
   * 播放提示音
   */
  function playNotification() {
    // 使用简单的 Web Audio API 生成提示音
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 800;
      oscillator.type = 'square';
      gainNode.gain.value = 0.1;
      
      oscillator.start();
      
      // 播放0.3秒后停止
      setTimeout(() => {
        oscillator.stop();
        audioContext.close();
      }, 300);
    } catch (e) {
      // 忽略音频错误
      console.log('提示音播放失败:', e);
    }
    
    // 尝试发送浏览器通知
    if (Notification && Notification.permission === 'granted') {
      new Notification('🍅 番茄钟', {
        body: isWorkMode ? '工作结束，休息一下吧！' : '休息结束，继续加油！',
        icon: ''
      });
    }
  }

  // 初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
  
  // 导出到全局
  window.Pomodoro = {
    addStateChangeListener,
    getCurrentState
  };
})();
