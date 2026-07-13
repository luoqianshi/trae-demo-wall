function navigateTo(page) {
  window.location.href = page;
}

function loadBabyInfo() {
  const baby = loadData('baby');
  if (baby) {
    document.querySelectorAll('.baby-name').forEach(el => el.textContent = baby.name);
    document.querySelectorAll('.baby-age').forEach(el => el.textContent = baby.age);
  }
}

function loadReminders() {
  const reminders = loadData('reminders') || [];
  const container = document.getElementById('reminder-list');
  if (container) {
    container.innerHTML = reminders.map(reminder => `
      <div class="reminder-item ${reminder.status}">
        <div class="reminder-icon ${reminder.status}">${getReminderIcon(reminder.type)}</div>
        <div class="reminder-content">
          <div class="reminder-message">${reminder.message}</div>
          <div class="reminder-time">${reminder.time}</div>
        </div>
      </div>
    `).join('');
  }
}

function getReminderIcon(type) {
  const icons = {
    feed: 'fa-bottle-water',
    supplement: 'fa-pills',
    vaccine: 'fa-syringe',
    excretion: 'fa-poop',
    childFund: 'fa-coins',
    sleep: 'fa-bed'
  };
  return '<i class="fa-solid fa-' + (icons[type] || 'thumbtack') + '"></i>';
}

function loadRecentActivity() {
  const family = loadData('family');
  const container = document.getElementById('activity-list');
  if (container && family && family.activityLog) {
    container.innerHTML = family.activityLog.slice(0, 5).map(activity => `
      <div class="activity-item">
        <div class="activity-avatar">${getUserAvatar(activity.user)}</div>
        <div class="activity-content">
          <div class="activity-action">${activity.user} ${activity.action}</div>
          <div class="activity-time">${activity.time}</div>
        </div>
      </div>
    `).join('');
  }
}

function getUserAvatar(user) {
  const avatars = {
    '妈妈': 'person',
    '爸爸': 'person',
    '奶奶': 'person',
    '爷爷': 'person',
    '姥姥': 'person',
    '姥爷': 'person'
  };
  return '<i class="fa-solid fa-' + (avatars[user] || 'user') + '"></i>';
}

function initVoiceRecognition() {
  const voiceBtn = document.getElementById('voice-btn');
  const voiceModal = document.getElementById('voice-modal');
  const voiceResult = document.getElementById('voice-result');
  
  if (!voiceBtn) return;

  voiceBtn.addEventListener('click', () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('您的浏览器不支持语音识别功能');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'zh-CN';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    voiceBtn.classList.add('active');
    voiceModal.style.display = 'flex';
    voiceResult.textContent = '正在听...';

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      voiceResult.textContent = `识别结果: ${transcript}`;
      handleVoiceCommand(transcript);
      setTimeout(() => {
        voiceModal.style.display = 'none';
        voiceBtn.classList.remove('active');
      }, 2000);
    };

    recognition.onerror = (event) => {
      voiceResult.textContent = '识别失败，请重试';
      voiceBtn.classList.remove('active');
      setTimeout(() => {
        voiceModal.style.display = 'none';
      }, 2000);
    };

    recognition.start();
  });

  document.getElementById('close-voice-modal')?.addEventListener('click', () => {
    voiceModal.style.display = 'none';
    voiceBtn.classList.remove('active');
  });
}

function handleVoiceCommand(command) {
  console.log('Voice command:', command);
  
  if (command.includes('喂奶') || command.includes('母乳')) {
    if (command.includes('左侧')) {
      addFeedRecord('breast', 'left', 15);
    } else if (command.includes('右侧')) {
      addFeedRecord('breast', 'right', 15);
    } else {
      addFeedRecord('bottle', null, 150);
    }
    showToast('已记录喂奶');
  } else if (command.includes('拉') || command.includes('大便') || command.includes('臭')) {
    addExcretionRecord('poop', 'yellow', 'soft');
    showToast('已记录大便');
  } else if (command.includes('小便')) {
    addExcretionRecord('urine', null, null);
    showToast('已记录小便');
  } else if (command.includes('睡觉') || command.includes('哄睡')) {
    addSleepRecord();
    showToast('已开始记录睡眠');
  } else if (command.includes('体温')) {
    addTemperatureRecord(36.5);
    showToast('已记录体温');
  } else {
    showToast('未识别到指令，请重试');
  }
}

function addFeedRecord(type, side, value) {
  const records = loadData('feedRecords') || [];
  const newRecord = {
    id: `feed_${Date.now()}`,
    type,
    side,
    duration: type === 'breast' ? value : null,
    amount: type === 'bottle' ? value : null,
    time: new Date().toLocaleString('zh-CN'),
    user: '妈妈'
  };
  records.unshift(newRecord);
  saveData('feedRecords', records);
  updateActivityLog('妈妈', `记录喂奶(${type === 'breast' ? '母乳' : '瓶喂'}${side ? side + '侧' : ''}${value}${type === 'breast' ? '分钟' : 'ml'})`);
}

function addExcretionRecord(type, color, consistency) {
  const records = loadData('excretionRecords') || [];
  const newRecord = {
    id: `ex_${Date.now()}`,
    type,
    color,
    consistency,
    urineCount: type === 'urine' ? 1 : 0,
    time: new Date().toLocaleString('zh-CN'),
    user: '妈妈'
  };
  records.unshift(newRecord);
  saveData('excretionRecords', records);
  updateActivityLog('妈妈', `记录${type === 'poop' ? '大便' : '小便'}(${color || ''}${consistency || ''})`);
}

function addSleepRecord() {
  const records = loadData('sleepRecords') || [];
  const newRecord = {
    id: `sleep_${Date.now()}`,
    startTime: new Date().toLocaleString('zh-CN'),
    endTime: null,
    quality: 'good',
    duration: null,
    user: '妈妈'
  };
  records.unshift(newRecord);
  saveData('sleepRecords', records);
  updateActivityLog('妈妈', '开始记录睡眠');
}

function addTemperatureRecord(value) {
  const records = loadData('temperatureRecords') || [];
  const newRecord = {
    id: `temp_${Date.now()}`,
    value,
    time: new Date().toLocaleString('zh-CN')
  };
  records.unshift(newRecord);
  saveData('temperatureRecords', records);
}

function updateActivityLog(user, action) {
  const family = loadData('family') || { members: [], activityLog: [] };
  family.activityLog.unshift({
    user,
    action,
    time: new Date().toLocaleString('zh-CN')
  });
  saveData('family', family);
}

function deleteRecord(recordId, storageKey, reloadCallback) {
  const records = loadData(storageKey) || [];
  const filtered = records.filter(r => r.id !== recordId);
  saveData(storageKey, filtered);
  showToast('已删除');
  if (typeof reloadCallback === 'function') {
    reloadCallback();
  }
}

function showToast(message) {
  const toast = document.createElement('div');
  toast.style.cssText = `
    position: fixed;
    bottom: 100px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(0,0,0,0.7);
    color: white;
    padding: 12px 24px;
    border-radius: 25px;
    font-size: 14px;
    z-index: 2000;
    animation: fadeIn 0.3s ease;
  `;
  toast.textContent = message;
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.style.animation = 'fadeOut 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 2000);
}

function initTabs() {
  document.querySelectorAll('.tab-item').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.tab-item').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
    });
  });
}

function initNavItems() {
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
      const page = item.getAttribute('data-page');
      if (page) {
        navigateTo(page);
      }
    });
  });
}

function loadFeedRecords() {
  const records = loadData('feedRecords') || [];
  const container = document.getElementById('feed-records');
  if (container) {
    container.innerHTML = records.slice(0, 10).map(record => `
      <div class="record-card">
        <div class="record-header">
          <span class="record-type">${record.type === 'breast' ? '<i class="fa-solid fa-bottle-water"></i> 亲喂' : '<i class="fa-solid fa-glass-water"></i> 瓶喂'}</span>
          <span style="display: flex; align-items: center; gap: 10px;">
            <span class="record-time">${record.time}</span>
            <span style="cursor: pointer; color: #ff6b6b; font-size: 16px;" onclick="deleteRecord('${record.id}', 'feedRecords', loadFeedRecords)"><i class="fa-solid fa-trash-can"></i></span>
          </span>
        </div>
        <div class="record-detail">
          ${record.type === 'breast' 
            ? `${record.side === 'left' ? '左侧' : '右侧'} ${record.duration}分钟` 
            : `${record.amount}ml`
          }
        </div>
      </div>
    `).join('');
  }
}

function loadExcretionRecords() {
  const records = loadData('excretionRecords') || [];
  const container = document.getElementById('excretion-records');
  if (container) {
    container.innerHTML = records.slice(0, 10).map(record => `
      <div class="record-card">
        <div class="record-header">
          <span class="record-type">${record.type === 'poop' ? '<i class="fa-solid fa-poop"></i> 大便' : '<i class="fa-solid fa-droplet"></i> 小便'}</span>
          <span style="display: flex; align-items: center; gap: 10px;">
            <span class="record-time">${record.time}</span>
            <span style="cursor: pointer; color: #ff6b6b; font-size: 16px;" onclick="deleteRecord('${record.id}', 'excretionRecords', loadExcretionRecords)"><i class="fa-solid fa-trash-can"></i></span>
          </span>
        </div>
        <div class="record-detail">
          ${record.type === 'poop' 
            ? `颜色: ${record.color} | 性状: ${record.consistency}` 
            : `次数: ${record.urineCount}`
          }
        </div>
      </div>
    `).join('');
  }
}

function loadSleepRecords() {
  const records = loadData('sleepRecords') || [];
  const container = document.getElementById('sleep-records');
  if (container) {
    container.innerHTML = records.slice(0, 10).map(record => `
      <div class="record-card">
        <div class="record-header">
          <span class="record-type"><i class="fa-solid fa-bed"></i> 睡眠</span>
          <span style="display: flex; align-items: center; gap: 10px;">
            <span class="record-time">${record.startTime}</span>
            <span style="cursor: pointer; color: #ff6b6b; font-size: 16px;" onclick="deleteRecord('${record.id}', 'sleepRecords', loadSleepRecords)"><i class="fa-solid fa-trash-can"></i></span>
          </span>
        </div>
        <div class="record-detail">
          时长: ${record.duration ? record.duration + '分钟' : '进行中'} | 质量: ${record.quality === 'good' ? '好' : record.quality === 'normal' ? '一般' : '差'}
        </div>
      </div>
    `).join('');
  }
}

function loadGrowthRecords() {
  const records = loadData('growthRecords') || [];
  const container = document.getElementById('growth-records');
  if (container) {
    container.innerHTML = records.slice(0, 10).map(record => `
      <div class="record-card">
        <div class="record-header">
          <span class="record-type"><i class="fa-solid fa-ruler-vertical"></i> 生长记录</span>
          <span style="display: flex; align-items: center; gap: 10px;">
            <span class="record-time">${record.date}</span>
            <span style="cursor: pointer; color: #ff6b6b; font-size: 16px;" onclick="deleteRecord('${record.id}', 'growthRecords', loadGrowthRecords)"><i class="fa-solid fa-trash-can"></i></span>
          </span>
        </div>
        <div class="record-detail">
          身高: ${record.height}cm | 体重: ${record.weight}kg | 头围: ${record.headCircumference}cm
        </div>
      </div>
    `).join('');
  }
}

function loadCommunityPosts() {
  const posts = loadData('communityPosts') || [];
  const container = document.getElementById('community-posts');
  if (container) {
    const filteredPosts = posts.filter(p => p.type === 'community');
    container.innerHTML = filteredPosts.map(post => `
      <div class="post-card">
        <div class="post-header">
          <div class="post-author">
            <div class="post-avatar"><i class="fa-solid fa-person"></i></div>
            <span class="post-author-name">${post.author}</span>
          </div>
          <span class="post-time">${post.time}</span>
        </div>
        ${post.monthGroup ? `<div class="post-tags">
          <span class="post-tag">${post.monthGroup}</span>
          ${post.tags.map(tag => `<span class="post-tag ${tag === '亲测有效' ? 'valid' : ''}">${tag}</span>`).join('')}
        </div>` : ''}
        <div class="post-content">${post.content}</div>
        <div class="post-actions">
          <span class="post-action"><i class="fa-solid fa-heart"></i> ${post.likes}</span>
          <span class="post-action"><i class="fa-solid fa-comment"></i> ${post.comments}</span>
        </div>
      </div>
    `).join('');
  }
}

function loadTreeholePosts() {
  const posts = loadData('communityPosts') || [];
  const container = document.getElementById('treehole-posts');
  if (container) {
    const filteredPosts = posts.filter(p => p.type === 'treehole');
    container.innerHTML = filteredPosts.map(post => `
      <div class="post-card">
        <div class="post-header">
          <div class="post-author">
            <div class="post-avatar"><i class="fa-solid fa-user-secret"></i></div>
            <span class="post-author-name">${post.author}</span>
          </div>
          <span class="post-time">${post.time}</span>
        </div>
        <div class="post-content">${post.content}</div>
        <div class="post-actions">
          <span class="post-action"><i class="fa-solid fa-heart"></i> ${post.likes}</span>
          <span class="post-action"><i class="fa-solid fa-comment"></i> ${post.comments}</span>
        </div>
      </div>
    `).join('');
  }
}

function loadFamilyMembers() {
  const family = loadData('family');
  const container = document.getElementById('family-members');
  if (container && family) {
    container.innerHTML = family.members.map(member => `
      <div class="family-member">
        <div class="member-avatar"><i class="fa-solid ${member.avatar}"></i></div>
        <div class="member-info">
          <div class="member-name">${member.name}</div>
          <div class="member-role ${member.role === 'admin' ? 'admin' : ''}">${member.role === 'admin' ? '管理员' : '成员'}</div>
        </div>
      </div>
    `).join('');
  }
}

function loadFamilyActivity() {
  const family = loadData('family');
  const container = document.getElementById('family-timeline');
  if (container && family) {
    container.innerHTML = `
      <div class="timeline">
        ${family.activityLog.map(log => `
          <div class="timeline-item">
            <div class="activity-action">${log.user} ${log.action}</div>
            <div class="activity-time">${log.time}</div>
          </div>
        `).join('')}
      </div>
    `;
  }
}

function loadMomMood() {
  const momRecords = loadData('momRecords');
  const container = document.getElementById('mom-mood');
  if (container && momRecords) {
    const moods = [
      { value: 1, emoji: '😭', label: '低落' },
      { value: 2, emoji: '😢', label: '难过' },
      { value: 3, emoji: '😔', label: '一般' },
      { value: 4, emoji: '🙂', label: '还好' },
      { value: 5, emoji: '😊', label: '开心' }
    ];
    container.innerHTML = `
      <div class="mood-grid">
        ${moods.map(mood => `
          <div class="mood-item" onclick="selectMood(${mood.value})">
            <div class="mood-emoji">${mood.emoji}</div>
            <div class="mood-label">${mood.label}</div>
          </div>
        `).join('')}
      </div>
    `;
  }
}

function selectMood(value) {
  const records = loadData('momRecords') || { mood: [] };
  records.mood.unshift({
    id: `mood_${Date.now()}`,
    date: new Date().toISOString().split('T')[0],
    value,
    note: ''
  });
  saveData('momRecords', records);
  showToast('已记录心情');
}

function loadVaccines() {
  const vaccines = loadData('vaccines') || [];
  const container = document.getElementById('vaccine-list');
  if (container) {
    container.innerHTML = vaccines.map(vaccine => `
      <div class="vaccine-card ${vaccine.status}">
        <div class="vaccine-name">${vaccine.name}</div>
        <div class="vaccine-info">
          <span>${vaccine.dose}</span>
          <span>${vaccine.dueDate}</span>
        </div>
        <div class="vaccine-status">
          <span class="status-badge ${vaccine.status}">${vaccine.status === 'completed' ? '已接种' : '待接种'}</span>
          ${vaccine.lotNumber ? `<span class="record-detail">批号: ${vaccine.lotNumber}</span>` : ''}
        </div>
      </div>
    `).join('');
  }
}

function initCharts() {
  if (typeof Chart !== 'undefined') {
    const aiAnalysis = loadData('aiAnalysis');
    if (aiAnalysis) {
      createWeightChart(aiAnalysis.weightTrend);
      createHeightChart(aiAnalysis.heightTrend);
      createSleepChart(aiAnalysis.sleepTrend);
      createFeedChart(aiAnalysis.feedTrend);
    }
  }
}

function createWeightChart(data) {
  const ctx = document.getElementById('weight-chart');
  if (!ctx) return;
  new Chart(ctx, {
    type: 'line',
    data: {
      labels: data.map(d => d.date),
      datasets: [{
        label: '体重 (kg)',
        data: data.map(d => d.value),
        borderColor: '#FFB6C1',
        backgroundColor: 'rgba(255, 182, 193, 0.1)',
        tension: 0.4,
        fill: true
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false }
      },
      scales: {
        y: { beginAtZero: false }
      }
    }
  });
}

function createHeightChart(data) {
  const ctx = document.getElementById('height-chart');
  if (!ctx) return;
  new Chart(ctx, {
    type: 'line',
    data: {
      labels: data.map(d => d.date),
      datasets: [{
        label: '身高 (cm)',
        data: data.map(d => d.value),
        borderColor: '#ADD8E6',
        backgroundColor: 'rgba(173, 216, 230, 0.1)',
        tension: 0.4,
        fill: true
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false }
      },
      scales: {
        y: { beginAtZero: false }
      }
    }
  });
}

function createSleepChart(data) {
  const ctx = document.getElementById('sleep-chart');
  if (!ctx) return;
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: data.map(d => d.date.slice(5)),
      datasets: [{
        label: '睡眠 (分钟)',
        data: data.map(d => d.value),
        backgroundColor: '#9370DB',
        borderRadius: 8
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false }
      }
    }
  });
}

function createFeedChart(data) {
  const ctx = document.getElementById('feed-chart');
  if (!ctx) return;
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: data.map(d => d.date.slice(5)),
      datasets: [{
        label: '奶量 (ml)',
        data: data.map(d => d.value),
        backgroundColor: '#FFA500',
        borderRadius: 8
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false }
      }
    }
  });
}

function loadInsights() {
  const aiAnalysis = loadData('aiAnalysis');
  const container = document.getElementById('insights-list');
  if (container && aiAnalysis) {
    container.innerHTML = aiAnalysis.insights.map(insight => `
      <div class="insight-card ${insight.type}">
        <div class="insight-title">${getInsightIcon(insight.type)} ${insight.title}</div>
        <div class="insight-content">${insight.content}</div>
      </div>
    `).join('');
  }
}

function getInsightIcon(type) {
  const icons = {
    normal: 'fa-check',
    warning: 'fa-triangle-exclamation',
    info: 'fa-lightbulb'
  };
  return '<i class="fa-solid fa-' + (icons[type] || 'thumbtack') + '"></i>';
}

function toggleMoreMenu() {
  const menu = document.getElementById('more-menu');
  if (menu) {
    menu.style.display = menu.style.display === 'flex' ? 'none' : 'flex';
  }
}

function toggleQuickActions() {
  const quickActions = document.getElementById('quick-actions');
  const toggleText = document.getElementById('quick-toggle-text');
  if (quickActions) {
    quickActions.classList.toggle('expanded');
    if (quickActions.classList.contains('expanded')) {
      toggleText.textContent = '收起';
    } else {
      toggleText.textContent = '展开更多';
    }
  }
}

function init() {
  loadBabyInfo();
  loadReminders();
  loadRecentActivity();
  loadFeedRecords();
  loadExcretionRecords();
  loadSleepRecords();
  loadGrowthRecords();
  loadCommunityPosts();
  loadTreeholePosts();
  loadFamilyMembers();
  loadFamilyActivity();
  loadMomMood();
  loadVaccines();
  initTabs();
  initNavItems();
  initVoiceRecognition();
  initCharts();
  loadInsights();
}

document.addEventListener('DOMContentLoaded', init);