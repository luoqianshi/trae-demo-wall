/**
 * 模块8：家属连接面板
 */

(function() {
  'use strict';

  // DOM 元素
  const els = {
    totalGames: document.getElementById('totalGames'),
    totalTime: document.getElementById('totalTime'),
    moodCount: document.getElementById('moodCount'),
    moodChart: document.getElementById('moodChart'),
    gameRecords: document.getElementById('gameRecords'),
    activityTimeline: document.getElementById('activityTimeline'),
    exportBtn: document.getElementById('exportBtn'),
    importBtn: document.getElementById('importBtn'),
    clearBtn: document.getElementById('clearBtn'),
    dataTextarea: document.getElementById('dataTextarea'),
    importActions: document.getElementById('importActions'),
    confirmImport: document.getElementById('confirmImport'),
    cancelImport: document.getElementById('cancelImport')
  };

  /**
   * 初始化
   */
  function init() {
    renderOverview();
    renderMoodChart();
    renderGameRecords();
    renderActivityTimeline();
    bindEvents();
    subscribeEvents();
  }

  /**
   * 渲染概览数据
   */
  function renderOverview() {
    const gameRecords = Storage.get(StorageKeys.GAME_RECORDS, []);
    const moodRecords = Storage.get(StorageKeys.MOOD_RECORDS, []);

    // 今日数据过滤
    const today = new Date().toDateString();
    const todayGames = gameRecords.filter(r => new Date(r.date).toDateString() === today);
    const todayMoods = moodRecords.filter(r => new Date(r.date).toDateString() === today);

    // 总游戏次数
    if (els.totalGames) {
      els.totalGames.textContent = todayGames.length;
    }

    // 总时长（分钟）
    if (els.totalTime) {
      const totalSeconds = todayGames.reduce((sum, r) => sum + (r.duration || 0), 0);
      els.totalTime.textContent = Math.round(totalSeconds / 60);
    }

    // 情绪记录数
    if (els.moodCount) {
      els.moodCount.textContent = todayMoods.length;
    }
  }

  /**
   * 渲染情绪图表
   */
  function renderMoodChart() {
    if (!els.moodChart) return;

    const moodRecords = Storage.get(StorageKeys.MOOD_RECORDS, []);

    // 按日期分组统计
    const grouped = {};
    moodRecords.forEach(record => {
      const date = new Date(record.date).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
      if (!grouped[date]) {
        grouped[date] = { count: 0, moods: [] };
      }
      grouped[date].count++;
      grouped[date].moods.push(record.mood);
    });

    const dates = Object.keys(grouped).slice(-7); // 最近7天

    if (dates.length === 0) {
      els.moodChart.innerHTML = '<div class="chart-empty">暂无情绪记录</div>';
      return;
    }

    const maxCount = Math.max(...dates.map(d => grouped[d].count));

    els.moodChart.innerHTML = dates.map(date => {
      const height = maxCount > 0 ? (grouped[date].count / maxCount) * 100 : 0;
      const mainMood = getMostFrequent(grouped[date].moods);
      return `
        <div class="chart-bar-wrapper">
          <div class="chart-bar" style="height: ${Math.max(height, 10)}%"></div>
          <div class="chart-label">${date}</div>
          <div class="chart-label">${getMoodEmoji(mainMood)}</div>
        </div>
      `;
    }).join('');
  }

  /**
   * 渲染游戏记录
   */
  function renderGameRecords() {
    if (!els.gameRecords) return;

    const records = Storage.get(StorageKeys.GAME_RECORDS, []);
    const recent = records.slice(-10).reverse();

    if (recent.length === 0) {
      els.gameRecords.innerHTML = '<div class="empty-state-small"><p>暂无游戏记录</p></div>';
      return;
    }

    els.gameRecords.innerHTML = recent.map(record => `
      <div class="game-record-item">
        <div>
          <div class="game-record-name">${getGameName(record.game)}</div>
          <div class="game-record-meta">${formatDate(record.date)}</div>
        </div>
        <div class="game-record-meta">
          ${record.duration ? `用时 ${formatDuration(record.duration)}` : ''}
          ${record.moves ? ` · ${record.moves}步` : ''}
        </div>
      </div>
    `).join('');
  }

  /**
   * 渲染活动时间线
   */
  function renderActivityTimeline() {
    if (!els.activityTimeline) return;

    const activities = collectActivities();
    const recent = activities.slice(-10).reverse();

    if (recent.length === 0) {
      els.activityTimeline.innerHTML = '<div class="empty-state-small"><p>今日暂无活动</p></div>';
      return;
    }

    els.activityTimeline.innerHTML = recent.map(activity => `
      <div class="activity-item">
        <div class="activity-time">${formatTime(activity.date)}</div>
        <div class="activity-text">${activity.text}</div>
      </div>
    `).join('');
  }

  /**
   * 收集所有活动
   */
  function collectActivities() {
    const activities = [];

    // 游戏记录
    const gameRecords = Storage.get(StorageKeys.GAME_RECORDS, []);
    gameRecords.forEach(r => {
      activities.push({
        date: r.date,
        text: `完成了${getGameName(r.game)}训练`
      });
    });

    // 情绪记录
    const moodRecords = Storage.get(StorageKeys.MOOD_RECORDS, []);
    moodRecords.forEach(r => {
      activities.push({
        date: r.date,
        text: `记录了${getMoodText(r.mood)}情绪`
      });
    });

    // 照片上传
    const photos = Storage.get(StorageKeys.PHOTOS, []);
    photos.forEach(p => {
      activities.push({
        date: p.createdAt,
        text: `上传了照片"${p.title || '未命名'}"`
      });
    });

    // 语音故事
    const stories = Storage.get(StorageKeys.VOICE_STORIES, []);
    stories.forEach(s => {
      activities.push({
        date: s.createdAt,
        text: `录制了语音故事"${s.title}"`
      });
    });

    // 按时间排序
    return activities.sort((a, b) => new Date(a.date) - new Date(b.date));
  }

  /**
   * 导出数据
   */
  function exportData() {
    const data = Storage.exportAll();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `memory-lane-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  /**
   * 显示导入界面
   */
  function showImport() {
    if (els.dataTextarea) els.dataTextarea.classList.remove('hidden');
    if (els.importActions) els.importActions.classList.remove('hidden');
    if (els.dataTextarea) els.dataTextarea.value = '';
  }

  /**
   * 确认导入
   */
  function confirmImportData() {
    const data = els.dataTextarea ? els.dataTextarea.value.trim() : '';
    if (!data) {
      alert('请输入数据');
      return;
    }

    if (confirm('导入数据将覆盖现有数据，确定继续吗？')) {
      if (Storage.importAll(data)) {
        alert('数据导入成功');
        hideImport();
        init(); // 重新渲染
      } else {
        alert('数据导入失败，请检查数据格式');
      }
    }
  }

  /**
   * 隐藏导入界面
   */
  function hideImport() {
    if (els.dataTextarea) els.dataTextarea.classList.add('hidden');
    if (els.importActions) els.importActions.classList.add('hidden');
  }

  /**
   * 清空数据
   */
  function clearAllData() {
    if (confirm('确定要清空所有数据吗？此操作不可恢复！')) {
      Storage.clearAll();
      alert('数据已清空');
      init();
    }
  }

  /**
   * 订阅事件
   */
  function subscribeEvents() {
    EventBus.on(EVENTS.GAME_COMPLETED, () => {
      renderOverview();
      renderGameRecords();
      renderActivityTimeline();
    });

    EventBus.on(EVENTS.MOOD_RECORDED, () => {
      renderOverview();
      renderMoodChart();
      renderActivityTimeline();
    });

    EventBus.on(EVENTS.PHOTO_UPLOADED, () => {
      renderActivityTimeline();
    });

    EventBus.on(EVENTS.VOICE_RECORDED, () => {
      renderActivityTimeline();
    });
  }

  /**
   * 获取游戏名称
   */
  function getGameName(game) {
    const names = {
      memory: '配对记忆',
      category: '分类整理',
      sequence: '数字顺序'
    };
    return names[game] || game;
  }

  /**
   * 获取情绪文本
   */
  function getMoodText(mood) {
    const texts = {
      happy: '开心',
      calm: '平静',
      sad: '感伤',
      excited: '激动'
    };
    return texts[mood] || mood;
  }

  /**
   * 获取情绪表情
   */
  function getMoodEmoji(mood) {
    const emojis = {
      happy: '&#128522;',
      calm: '&#128524;',
      sad: '&#128546;',
      excited: '&#128525;'
    };
    return emojis[mood] || '&#128528;';
  }

  /**
   * 获取最频繁项
   */
  function getMostFrequent(arr) {
    const counts = {};
    arr.forEach(item => {
      counts[item] = (counts[item] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || '';
  }

  /**
   * 格式化时长
   */
  function formatDuration(seconds) {
    const m = Math.floor(seconds / 60);
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  /**
   * 格式化日期
   */
  function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return `${date.getMonth() + 1}月${date.getDate()}日`;
  }

  /**
   * 格式化时间
   */
  function formatTime(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  }

  /**
   * 绑定事件
   */
  function bindEvents() {
    if (els.exportBtn) els.exportBtn.addEventListener('click', exportData);
    if (els.importBtn) els.importBtn.addEventListener('click', showImport);
    if (els.confirmImport) els.confirmImport.addEventListener('click', confirmImportData);
    if (els.cancelImport) els.cancelImport.addEventListener('click', hideImport);
    if (els.clearBtn) els.clearBtn.addEventListener('click', clearAllData);
  }

  // 启动
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
