/* ============================================
   萌宠健康管家 - 应用主逻辑
   ============================================ */

const App = (function () {
  const state = {
    currentTab: 'home',
    currentPetId: MockData.currentPetId,
    diagnose: {
      activePart: 'digestive',
      selectedSymptoms: [],
    },
    service: {
      activeCategory: 'all',
      sortBy: 'rating',
    },
  };

  let recordFilter = 'all';

  // ============ 工具方法 ============
  function calcAge(birthday) {
    const birth = new Date(birthday);
    const now = new Date();
    let years = now.getFullYear() - birth.getFullYear();
    let months = now.getMonth() - birth.getMonth();
    if (now.getDate() < birth.getDate()) months--;
    if (months < 0) { years--; months += 12; }
    let text = '';
    if (years > 0) text += `${years}岁`;
    if (months > 0) text += `${months}个月`;
    if (!text) text = '未满月';
    return { years, months, text };
  }

  function daysFromToday(date) {
    const target = new Date(date);
    target.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return Math.round((target - today) / (1000 * 60 * 60 * 24));
  }

  function friendlyDate(date) {
    const days = daysFromToday(date);
    if (days === 0) return '今天';
    if (days === 1) return '明天';
    if (days === -1) return '昨天';
    if (days > 0 && days <= 7) return `${days}天后`;
    if (days < 0 && days >= -7) return `${Math.abs(days)}天前`;
    if (days > 0) {
      const d = new Date(date);
      return `${d.getMonth() + 1}月${d.getDate()}日`;
    }
    return `逾期${Math.abs(days)}天`;
  }

  function formatDate(date, format = 'YYYY-MM-DD') {
    const d = new Date(date);
    const pad = (n) => String(n).padStart(2, '0');
    return format
      .replace('YYYY', d.getFullYear())
      .replace('MM', pad(d.getMonth() + 1))
      .replace('DD', pad(d.getDate()))
      .replace('HH', pad(d.getHours()))
      .replace('mm', pad(d.getMinutes()));
  }

  function weekDay(date) {
    const map = ['日', '一', '二', '三', '四', '五', '六'];
    return `周${map[new Date(date).getDay()]}`;
  }

  function petKindEmoji(kind) {
    return { dog: '🐕', cat: '🐱', other: '🐾' }[kind] || '🐾';
  }

  function petKindText(kind) {
    return { dog: '狗狗', cat: '猫咪', other: '其他' }[kind] || '其他';
  }

  function recordTypeText(type) {
    return {
      feed: '喂食', poop: '便便', pee: '排尿', activity: '活动',
      weight: '体重', symptom: '症状', mood: '情绪'
    }[type] || '记录';
  }

  function recordTypeEmoji(type) {
    return {
      feed: '🍖', poop: '💩', pee: '💧', activity: '🏃',
      weight: '⚖️', symptom: '🩺', mood: '😊'
    }[type] || '📝';
  }

  function recordTypeColor(type) {
    return {
      feed: '#ffaa3d', poop: '#8b6f47', pee: '#4ea1ff', activity: '#34d399',
      weight: '#9b6dff', symptom: '#f56565', mood: '#ff8a3d'
    }[type] || '#a89e96';
  }

  function recordTypeFAIcon(type) {
    return {
      feed: 'fa-bowl-food', poop: 'fa-poo', pee: 'fa-droplet', activity: 'fa-person-running',
      weight: 'fa-weight-scale', symptom: 'fa-stethoscope', mood: 'fa-face-smile'
    }[type] || 'fa-pen';
  }

  function reminderTypeFAIcon(type) {
    return {
      vaccine: 'fa-syringe', deworming: 'fa-bug', bath: 'fa-bath',
      checkup: 'fa-stethoscope', custom: 'fa-calendar'
    }[type] || 'fa-calendar';
  }

  function reminderTypeColor(type) {
    return {
      vaccine: { color: '#4EA1FF', bg: '#EBF4FF' },
      deworming: { color: '#8B5CF6', bg: '#F0E6FF' },
      bath: { color: '#2D9F83', bg: '#E8F8F3' },
      checkup: { color: '#F5A623', bg: '#FFF8EC' },
      custom: { color: '#8E8EA9', bg: '#F0F1F5' },
    }[type] || { color: '#8E8EA9', bg: '#F0F1F5' };
  }

  function categoryFAConfig(key) {
    return {
      feeding: { icon: 'fa-house-chimney', color: '#F57C00', bg: '#FFF0E5' },
      walking: { icon: 'fa-dog', color: '#1976D2', bg: '#E3F2FD' },
      boarding: { icon: 'fa-home', color: '#8E24AA', bg: '#F3E5F5' },
      photo: { icon: 'fa-camera', color: '#E64A19', bg: '#FBE9E7' },
      medical: { icon: 'fa-stethoscope', color: '#2D9F83', bg: '#E8F8F3' },
      bathing: { icon: 'fa-scissors', color: '#E91E63', bg: '#FCE4EC' },
      training: { icon: 'fa-graduation-cap', color: '#1976D2', bg: '#E3F2FD' },
    }[key] || { icon: 'fa-paw', color: '#8E8EA9', bg: '#F0F1F5' };
  }

  function poopStatusText(status) {
    return { normal: '正常', soft: '偏软', hard: '偏硬', diarrhea: '腹泻', blood: '带血' }[status] || '正常';
  }

  function moodText(level) {
    return { happy: '开心', calm: '平静', tired: '疲惫', anxious: '焦虑', sad: '低落' }[level] || '平静';
  }

  function getCurrentPet() {
    return MockData.pets.find(p => p.id === state.currentPetId);
  }

  function getPetById(id) {
    return MockData.pets.find(p => p.id === id);
  }

  // ============ Toast ============
  let toastTimer = null;
  function showToast(message, duration = 1500) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.add('show');
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), duration);
  }

  // ============ Tab 切换 ============
  function switchTab(tabName) {
    state.currentTab = tabName;
    document.querySelectorAll('.page').forEach(p => {
      p.classList.toggle('active', p.dataset.page === tabName);
    });
    document.querySelectorAll('.tab-item').forEach(t => {
      t.classList.toggle('active', t.dataset.tab === tabName);
    });
    const activePage = document.querySelector(`.page[data-page="${tabName}"]`);
    if (activePage) activePage.scrollTop = 0;
  }

  // ============ 首页渲染 ============
  function renderHome() {
    const pet = getCurrentPet();
    if (!pet) return;

    const today = new Date();
    document.getElementById('home-subgreeting').textContent =
      `今天是${weekDay(today.toISOString())}，记得记录哦`;

    const overdueCount = MockData.reminders.filter(
      r => r.petId === pet.id && !r.isDone && daysFromToday(r.dueDate) < 0
    ).length;
    const score = Math.max(60, 100 - overdueCount * 10);
    document.getElementById('health-score').textContent = score;

    const switcherEl = document.getElementById('pet-switcher');
    switcherEl.innerHTML = MockData.pets.map(p => `
      <div class="pet-chip ${p.id === state.currentPetId ? 'active' : ''}" onclick="App.switchPet('${p.id}')">
        <div class="pet-avatar-wrap">
          <img class="pet-avatar" src="${p.avatar}" alt="${p.name}" onerror="this.style.background='#E8F8F3'; this.src='';" />
          <div class="pet-kind-badge">${petKindEmoji(p.kind)}</div>
        </div>
        <div class="pet-name">${p.name}</div>
      </div>
    `).join('') + `
      <div class="add-pet-chip" onclick="App.showToast('添加宠物功能开发中')">+</div>
    `;

    document.getElementById('home-pet-avatar-lg').src = pet.avatar;
    document.getElementById('home-pet-name').textContent = pet.name;
    document.getElementById('home-pet-breed').textContent =
      `${pet.breed} · ${calcAge(pet.birthday).text}`;

    document.getElementById('home-pet-stats').innerHTML = `
      <div class="pet-stat">
        <div class="pet-stat-val">${pet.weight}<small>kg</small></div>
        <div class="pet-stat-label">体重</div>
      </div>
      <div class="pet-stat">
        <div class="pet-stat-val">${calcAge(pet.birthday).text}</div>
        <div class="pet-stat-label">年龄</div>
      </div>
      <div class="pet-stat">
        <div class="pet-stat-val">${pet.neutered ? '✓' : '✗'}</div>
        <div class="pet-stat-label">绝育</div>
      </div>
    `;

    // Health score ring animation
    const circumference = 2 * Math.PI * 40; // r=40
    const offset = circumference - (score / 100) * circumference;
    const scoreRing = document.getElementById('scoreRing');
    scoreRing.style.strokeDashoffset = circumference;
    requestAnimationFrame(() => {
      scoreRing.style.strokeDashoffset = offset;
    });

    // Score details
    const overdueVaccine = pet.vaccines.filter(v => daysFromToday(v.nextDate) < 0).length;
    const overdueDeworming = pet.dewormings.filter(d => daysFromToday(d.nextDate) < 0).length;
    const vaccineTag = overdueVaccine > 0
      ? `<span class="score-detail-tag tag-bad">${overdueVaccine}项逾期</span>`
      : '<span class="score-detail-tag tag-good">正常</span>';
    const dewormingTag = overdueDeworming > 0
      ? `<span class="score-detail-tag tag-bad">${overdueDeworming}项逾期</span>`
      : '<span class="score-detail-tag tag-good">正常</span>';

    let weightTrendTag = '';
    if (pet.weights.length >= 2) {
      const latest = pet.weights[pet.weights.length - 1];
      const prev = pet.weights[pet.weights.length - 2];
      const diff = Number((latest.weight - prev.weight).toFixed(1));
      if (Math.abs(diff) <= 0.3) {
        weightTrendTag = '<span class="score-detail-tag tag-good">稳定</span>';
      } else if (diff > 0) {
        weightTrendTag = '<span class="score-detail-tag tag-warn">↑' + diff + 'kg</span>';
      } else {
        weightTrendTag = '<span class="score-detail-tag tag-warn">↓' + Math.abs(diff) + 'kg</span>';
      }
    } else {
      weightTrendTag = '<span class="score-detail-tag tag-good">正常</span>';
    }

    document.getElementById('score-details').innerHTML = `
      <div class="score-detail-item">
        <div class="score-detail-left"><i class="fas fa-weight-scale" style="color:var(--info);"></i> 体重管理</div>
        ${weightTrendTag}
      </div>
      <div class="score-detail-item">
        <div class="score-detail-left"><i class="fas fa-syringe" style="color:var(--primary);"></i> 疫苗状态</div>
        ${vaccineTag}
      </div>
      <div class="score-detail-item">
        <div class="score-detail-left"><i class="fas fa-bug" style="color:#8B5CF6;"></i> 驱虫状态</div>
        ${dewormingTag}
      </div>
    `;

    const todayStr = formatDate(today);
    const todayRecords = MockData.dailyRecords.filter(r => r.petId === pet.id && r.date === todayStr);
    const upcomingReminders = MockData.reminders
      .filter(r => r.petId === pet.id && !r.isDone)
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

    const reminderListEl = document.getElementById('home-reminder-list');
    const top3Reminders = upcomingReminders.slice(0, 3);
    if (top3Reminders.length === 0) {
      reminderListEl.innerHTML = `
        <div class="card" style="text-align: center; padding: 24px;">
          <div style="font-size: 32px; margin-bottom: 4px;"><i class="fas fa-check-circle" style="color:var(--success);"></i></div>
          <div style="font-size: 13px; color: var(--text-secondary);">暂无待办</div>
          <div style="font-size: 11px; color: var(--text-muted); margin-top: 2px;">所有提醒都已完成</div>
        </div>
      `;
    } else {
      reminderListEl.innerHTML = top3Reminders.map(r => {
        const days = daysFromToday(r.dueDate);
        const isOverdue = days < 0;
        const iconConfig = reminderTypeColor(r.type);
        const faIcon = reminderTypeFAIcon(r.type);
        let badgeStyle, badgeText;
        if (isOverdue) {
          badgeStyle = 'background:var(--danger-bg);color:var(--danger);';
          badgeText = '逾期';
        } else if (days <= 3) {
          badgeStyle = 'background:var(--warning-bg);color:var(--warning);';
          badgeText = '临近';
        } else {
          badgeStyle = 'background:var(--primary-bg);color:var(--primary);';
          badgeText = '待办';
        }
        const dateText = isOverdue ? `已逾期 ${Math.abs(days)} 天` : friendlyDate(r.dueDate);
        return `
          <div class="reminder-card ${isOverdue ? 'overdue' : ''}" onclick="App.showToast('${r.title.replace(/'/g, "\\'")}')">
            <div class="reminder-icon" style="background:${iconConfig.bg};color:${iconConfig.color};"><i class="fas ${faIcon}"></i></div>
            <div class="reminder-info"><h4>${r.title}</h4><p>${dateText} · ${pet.name}</p></div>
            <span class="reminder-badge" style="${badgeStyle}">${badgeText}</span>
          </div>
        `;
      }).join('');
    }

    const todayRecordsEl = document.getElementById('home-today-records');
    if (todayRecords.length === 0) {
      todayRecordsEl.innerHTML = `
        <div style="text-align: center; padding: 16px;">
          <div style="font-size: 32px; margin-bottom: 4px;"><i class="fas fa-inbox" style="color:var(--text-muted);"></i></div>
          <div style="font-size: 13px; color: var(--text-secondary);">今天还没有记录</div>
          <div style="font-size: 11px; color: var(--text-muted); margin-top: 2px;">点击「快速记录」开始记录萌宠的一天</div>
        </div>
      `;
    } else {
      todayRecordsEl.innerHTML = `
        <div class="today-record-list">
          ${todayRecords.map(r => {
            let desc = '';
            if (r.feed) desc = `${r.feed.food} ${r.feed.amount}g`;
            else if (r.poop) desc = r.poop.note || poopStatusText(r.poop.status);
            else if (r.pee) desc = '已记录';
            else if (r.activity) desc = `${r.activity.duration}分钟`;
            else if (r.weight) desc = `${r.weight.value}kg`;
            else if (r.mood) desc = r.mood.note || moodText(r.mood.level);
            else if (r.symptom) desc = r.symptom.description;
            return `
              <div class="today-record-item">
                <div class="record-dot" style="background: ${recordTypeColor(r.type)}1f; color: ${recordTypeColor(r.type)};"><i class="fas ${recordTypeFAIcon(r.type)}"></i></div>
                <div class="record-info">
                  <div class="record-type">${recordTypeText(r.type)}</div>
                  <div class="record-desc">${desc}</div>
                </div>
                <div class="record-time">${r.time}</div>
              </div>
            `;
          }).join('')}
        </div>
      `;
    }
  }

  // ============ 切换宠物 ============
  function switchPet(petId) {
    state.currentPetId = petId;
    renderHome();
    renderRecord();
    renderDiagnose();
  }

  // ============ 记录页 ============
  function renderRecord() {
    const pet = getCurrentPet();
    if (!pet) return;

    document.getElementById('record-pet-switcher').innerHTML = MockData.pets.map(p => `
      <div class="record-pet-item" onclick="App.switchPet('${p.id}')">
        <img class="pet-avatar" src="${p.avatar}" alt="${p.name}" onerror="this.style.background='#E8F8F3'" />
        <div class="info">
          <div class="name">${p.name}</div>
          <div class="meta">${p.breed}</div>
        </div>
      </div>
    `).join('');

    const todayStr = formatDate(new Date());
    const todayRecords = MockData.dailyRecords.filter(r => r.petId === pet.id && r.date === todayStr);
    const feedAmount = todayRecords
      .filter(r => r.type === 'feed' && r.feed)
      .reduce((sum, r) => sum + r.feed.amount, 0);
    const activityDuration = todayRecords
      .filter(r => r.type === 'activity' && r.activity)
      .reduce((sum, r) => sum + r.activity.duration, 0);
    const poop = todayRecords.find(r => r.type === 'poop');

    document.getElementById('record-summary-grid').innerHTML = `
      <div class="summary-card">
        <div class="summary-label">今日喂食</div>
        <div class="summary-value">${feedAmount}<span class="summary-unit">g</span></div>
      </div>
      <div class="summary-card">
        <div class="summary-label">活动时长</div>
        <div class="summary-value">${activityDuration}<span class="summary-unit">min</span></div>
      </div>
      <div class="summary-card">
        <div class="summary-label">便便状态</div>
        <div class="summary-value" style="font-size: 14px;">
          ${poop ? poopStatusText(poop.poop.status) : '—'}
        </div>
      </div>
    `;

    renderWeightChart(pet);

    const filters = [
      { key: 'all', label: '全部' },
      { key: 'feed', label: '喂食' },
      { key: 'poop', label: '便便' },
      { key: 'activity', label: '活动' },
      { key: 'mood', label: '情绪' },
      { key: 'weight', label: '体重' },
    ];
    document.getElementById('record-filter').innerHTML = filters.map(f => `
      <div class="filter-chip ${recordFilter === f.key ? 'active' : ''}" onclick="App.setRecordFilter('${f.key}')">
        <span>${f.label}</span>
      </div>
    `).join('');

    renderRecordList(pet);
  }

  function setRecordFilter(filter) {
    recordFilter = filter;
    renderRecord();
  }

  function renderWeightChart(pet) {
    const weights = pet.weights.slice(-6);
    if (weights.length === 0) return;
    document.getElementById('weight-trend-subtitle').textContent = `最近${weights.length}次记录`;
    const values = weights.map(w => w.weight);
    const max = Math.max(...values, pet.targetWeight || 0);
    const min = Math.min(...values, pet.targetWeight || max);
    const range = max - min || 1;
    const latest = values[values.length - 1];
    const targetBottom = pet.targetWeight ? ((pet.targetWeight - min) / range) * 100 : null;

    document.getElementById('weight-chart').innerHTML = `
      <div class="chart-header">
        <div>
          <div class="latest-label">最新体重</div>
          <div class="latest-value">${latest}kg</div>
        </div>
        ${pet.targetWeight ? `
          <div class="target-wrap">
            <span class="target-label">目标</span>
            <span class="target-value">${pet.targetWeight}kg</span>
          </div>
        ` : ''}
      </div>
      <div class="chart-bars">
        ${targetBottom !== null ? `
          <div class="target-line" style="bottom: ${targetBottom}%;">
            <span class="target-line-label">目标 ${pet.targetWeight}kg</span>
          </div>
        ` : ''}
        ${weights.map((w, i) => {
          const heightPercent = ((w.weight - min) / range) * 100;
          const isLatest = i === weights.length - 1;
          const bg = isLatest
            ? 'linear-gradient(180deg, #2D9F83 0%, #3DC4A1 100%)'
            : 'linear-gradient(180deg, rgba(45,159,131,0.4) 0%, rgba(45,159,131,0.2) 100%)';
          return `
            <div class="chart-bar-col">
              <div class="chart-bar-value">${w.weight}</div>
              <div class="chart-bar" style="height: ${Math.max(20, heightPercent)}%; background: ${bg};"></div>
              <div class="chart-bar-date">${formatDate(w.date, 'MM/DD')}</div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  function renderRecordList(pet) {
    let records = MockData.dailyRecords.filter(r => r.petId === pet.id);
    if (recordFilter !== 'all') {
      records = records.filter(r => r.type === recordFilter);
    }
    records.sort((a, b) => {
      const ta = new Date(`${a.date}T${a.time}`).getTime();
      const tb = new Date(`${b.date}T${b.time}`).getTime();
      return tb - ta;
    });

    const groups = {};
    records.forEach(r => {
      if (!groups[r.date]) groups[r.date] = [];
      groups[r.date].push(r);
    });
    const sortedDates = Object.keys(groups).sort((a, b) => new Date(b) - new Date(a));
    const todayStr = formatDate(new Date());

    const container = document.getElementById('record-list-container');
    if (sortedDates.length === 0) {
      container.innerHTML = `
        <div class="card" style="text-align: center; padding: 32px 16px;">
          <div style="font-size: 40px; margin-bottom: 8px; opacity: 0.6;"><i class="fas fa-pen-to-square" style="color:var(--text-muted);"></i></div>
          <div style="font-size: 14px; color: var(--text-secondary);">暂无记录</div>
          <div style="font-size: 12px; color: var(--text-muted); margin-top: 2px;">点击右下角按钮开始记录</div>
        </div>
      `;
      return;
    }

    container.innerHTML = sortedDates.map(date => {
      const dayRecords = groups[date];
      return `
        <div class="date-group">
          <div class="date-header">
            <span class="date-text">${formatDate(date, 'MM月DD日')}</span>
            <span class="week-text">${weekDay(date)}</span>
            ${date === todayStr ? '<span class="tag tag-primary">今天</span>' : ''}
          </div>
          <div class="card">
            <div class="record-list">
              ${dayRecords.map(r => {
                let desc = '';
                if (r.feed) desc = `${r.feed.food || ''} ${r.feed.amount}g`;
                else if (r.poop) desc = r.poop.note || poopStatusText(r.poop.status);
                else if (r.pee) desc = '已记录';
                else if (r.activity) desc = `${r.activity.duration}分钟 · ${r.activity.note || ''}`;
                else if (r.weight) desc = `${r.weight.value}kg`;
                else if (r.mood) desc = r.mood.note || moodText(r.mood.level);
                else if (r.symptom) desc = r.symptom.description;
                return `
                  <div class="record-item">
                    <div class="record-dot" style="background: ${recordTypeColor(r.type)}1f; color: ${recordTypeColor(r.type)};"><i class="fas ${recordTypeFAIcon(r.type)}"></i></div>
                    <div class="record-info">
                      <div class="record-type">${recordTypeText(r.type)}</div>
                      <div class="record-desc">${desc}</div>
                    </div>
                    <div class="record-time">${r.time}</div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  // ============ AI 分诊页 ============
  function renderDiagnose() {
    const pet = getCurrentPet();
    if (!pet) return;
    document.getElementById('diagnose-pet-avatar').src = pet.avatar;
    document.getElementById('diagnose-pet-name').textContent = pet.name;

    document.getElementById('body-parts-grid').innerHTML = MockData.bodyParts.map(part => `
      <div class="body-part ${state.diagnose.activePart === part.key ? 'active' : ''}" onclick="DiagnosePage.selectPart('${part.key}')">
        <div class="body-part-icon">${part.icon}</div>
        <div class="body-part-label">${part.label}</div>
      </div>
    `).join('');

    const symptoms = MockData.symptomOptions.filter(s => s.bodyPart === state.diagnose.activePart);
    document.getElementById('symptoms-list').innerHTML = symptoms.map(s => {
      const selected = state.diagnose.selectedSymptoms.includes(s.id);
      return `
        <div class="symptom-chip ${selected ? 'active' : ''}" onclick="DiagnosePage.toggleSymptom('${s.id}')">
          <span class="symptom-icon">${s.icon}</span>
          <span>${s.label}</span>
          ${selected ? '<span class="check-icon">✓</span>' : ''}
        </div>
      `;
    }).join('');

    const selectedSection = document.getElementById('selected-section');
    if (state.diagnose.selectedSymptoms.length > 0) {
      selectedSection.style.display = 'block';
      const selectedList = MockData.symptomOptions.filter(s => state.diagnose.selectedSymptoms.includes(s.id));
      document.getElementById('selected-count').textContent = `${selectedList.length} 项`;
      document.getElementById('selected-list').innerHTML = selectedList.map(s => `
        <span class="tag tag-primary tag-md">${s.icon} ${s.label}</span>
      `).join('');
    } else {
      selectedSection.style.display = 'none';
    }
  }

  function diagnoseSelectPart(part) {
    state.diagnose.activePart = part;
    renderDiagnose();
  }

  function diagnoseToggleSymptom(symptomId) {
    const idx = state.diagnose.selectedSymptoms.indexOf(symptomId);
    if (idx >= 0) state.diagnose.selectedSymptoms.splice(idx, 1);
    else state.diagnose.selectedSymptoms.push(symptomId);
    document.getElementById('result-section').style.display = 'none';
    renderDiagnose();
  }

  function diagnoseReset() {
    state.diagnose.selectedSymptoms = [];
    document.getElementById('result-section').style.display = 'none';
    renderDiagnose();
  }

  function diagnoseRun() {
    if (state.diagnose.selectedSymptoms.length === 0) return;
    const btn = document.getElementById('diagnose-btn');
    btn.classList.add('diagnosing');
    btn.innerHTML = '<span class="loader"></span>分诊中...';

    setTimeout(() => {
      const matched = MockData.diagnosisResults.find(r =>
        r.symptomIds.every(id => state.diagnose.selectedSymptoms.includes(id))
      );
      const result = matched || { ...MockData.defaultDiagnosisResult, symptomIds: state.diagnose.selectedSymptoms };
      renderDiagnosisResult(result);
      btn.classList.remove('diagnosing');
      btn.innerHTML = '重新分诊';
    }, 1200);
  }

  function renderDiagnosisResult(result) {
    const urgencyConfig = {
      normal: { label: '观察', color: '#34d399', bg: 'rgba(52, 211, 153, 0.12)', icon: '✅' },
      observe: { label: '需观察', color: '#4ea1ff', bg: 'rgba(78, 161, 255, 0.12)', icon: '👁' },
      urgent: { label: '需就医', color: '#ff7d00', bg: 'rgba(255, 125, 0, 0.12)', icon: '⚠️' },
      emergency: { label: '急诊', color: '#f56565', bg: 'rgba(245, 101, 101, 0.15)', icon: '🚨' },
    };
    const config = urgencyConfig[result.urgency];

    document.getElementById('result-container').innerHTML = `
      <div class="result-card" style="border-color: ${config.color};">
        <div class="result-header" style="background: ${config.bg};">
          <div class="result-icon">${config.icon}</div>
          <div>
            <div class="result-title">${result.title}</div>
            <div class="result-urgency" style="color: ${config.color};">${config.label}</div>
          </div>
        </div>
        <div class="result-body">
          <div class="result-summary">${result.summary}</div>
          <div class="result-section-title">可能原因</div>
          ${result.possibleCauses.map(c => `
            <div class="result-item"><span class="result-bullet">•</span><span class="result-item-text">${c}</span></div>
          `).join('')}
          <div class="result-section-title">居家护理建议</div>
          ${result.homeCare.map(t => `
            <div class="result-item"><span class="result-bullet">✓</span><span class="result-item-text">${t}</span></div>
          `).join('')}
          <div class="result-section-title">需要就医的情况</div>
          ${result.whenToVet.map(w => `
            <div class="result-item"><span class="result-bullet">⚠</span><span class="result-item-text">${w}</span></div>
          `).join('')}
          <div class="recommend-box">
            <div class="recommend-label">综合建议</div>
            <div class="recommend-text">${result.recommendation}</div>
          </div>
        </div>
      </div>
    `;
    document.getElementById('result-section').style.display = 'block';
    setTimeout(() => {
      const resultSection = document.getElementById('result-section');
      resultSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  }

  // ============ 服务页 ============
  function renderService() {
    document.getElementById('service-categories').innerHTML = `
      <div class="category-card ${state.service.activeCategory === 'all' ? 'active' : ''}" onclick="ServicePage.setCategory('all')">
        <div class="category-icon" style="background:var(--primary-bg);color:var(--primary);"><i class="fas fa-th-large"></i></div>
        <div class="category-label">全部</div>
      </div>
      ${MockData.serviceCategories.map(c => {
        const cfg = categoryFAConfig(c.key);
        return `
          <div class="category-card ${state.service.activeCategory === c.key ? 'active' : ''}" onclick="ServicePage.setCategory('${c.key}')">
            <div class="category-icon" style="background:${cfg.bg};color:${cfg.color};"><i class="fas ${cfg.icon}"></i></div>
            <div class="category-label">${c.label}</div>
          </div>
        `;
      }).join('')}
    `;

    const featured = [...MockData.serviceProviders].sort((a, b) => b.rating - a.rating).slice(0, 3);
    document.getElementById('featured-list').innerHTML = featured.map(p => `
      <div class="featured-card" onclick="App.openServiceDetail('${p.id}')">
        <img class="featured-cover" src="${p.cover}" alt="${p.name}" onerror="this.style.background='#E8F8F3'" />
        <div class="featured-info">
          <div class="featured-name">${p.name}</div>
          <div class="featured-meta">
            <span class="featured-rating"><i class="fas fa-star" style="color:var(--accent);font-size:10px;"></i> ${p.rating}</span>
            <span class="featured-distance">${p.distance}km</span>
          </div>
          <div class="featured-price">¥${p.priceFrom}<span class="featured-unit">/${p.priceUnit}</span></div>
        </div>
      </div>
    `).join('');

    document.querySelectorAll('#sort-group .sort-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.sort === state.service.sortBy);
    });

    let providers = MockData.serviceProviders;
    if (state.service.activeCategory !== 'all') {
      providers = providers.filter(p => p.category === state.service.activeCategory);
    }
    providers = [...providers].sort((a, b) => {
      if (state.service.sortBy === 'rating') return b.rating - a.rating;
      if (state.service.sortBy === 'distance') return a.distance - b.distance;
      if (state.service.sortBy === 'price') return a.priceFrom - b.priceFrom;
      return 0;
    });

    const categoryLabel = state.service.activeCategory === 'all'
      ? '全部商家'
      : MockData.serviceCategories.find(c => c.key === state.service.activeCategory)?.label;
    document.getElementById('provider-list-title').textContent = categoryLabel;
    document.getElementById('provider-list-count').textContent = `${providers.length}家`;

    const listEl = document.getElementById('provider-list');
    if (providers.length === 0) {
      listEl.innerHTML = `
        <div class="card" style="text-align: center; padding: 32px 16px;">
          <div style="font-size: 40px; margin-bottom: 8px;"><i class="fas fa-search" style="color:var(--text-muted);"></i></div>
          <div style="font-size: 14px; color: var(--text-secondary);">暂无商家</div>
          <div style="font-size: 12px; color: var(--text-muted); margin-top: 2px;">试试其他分类或筛选条件</div>
        </div>
      `;
    } else {
      listEl.innerHTML = providers.map(p => `
        <div class="provider-card" onclick="App.openServiceDetail('${p.id}')">
          <div class="provider-top">
            <img class="provider-avatar" src="${p.avatar}" alt="${p.name}" onerror="this.style.background='#E8F8F3'" />
            <div class="provider-info">
              <div class="provider-name-row">
                <span class="provider-name">${p.name}</span>
                ${p.verified ? '<span class="tag tag-primary">认证</span>' : ''}
              </div>
              <div class="provider-stats">
                <span class="provider-rating"><i class="fas fa-star" style="color:var(--accent);font-size:10px;"></i> ${p.rating}</span>
                <span class="provider-review">${p.reviewCount}评</span>
                <span class="provider-distance">${p.distance}km</span>
              </div>
              <div class="provider-tags">
                ${p.tags.slice(0, 2).map(t => `<span class="tag">${t}</span>`).join('')}
              </div>
            </div>
          </div>
          <div class="provider-bottom">
            <div class="provider-services">
              ${p.services.slice(0, 3).map(s => `<span class="service-item-tag">${s}</span>`).join('')}
            </div>
            <div class="provider-price-wrap">
              <span class="provider-price-prefix">¥</span>
              <span class="provider-price">${p.priceFrom}</span>
              <span class="provider-price-unit">/${p.priceUnit}起</span>
            </div>
          </div>
        </div>
      `).join('');
    }
  }

  function serviceSetCategory(cat) {
    state.service.activeCategory = cat;
    renderService();
  }

  function serviceSetSort(sort) {
    state.service.sortBy = sort;
    renderService();
  }

  // ============ 我的页 ============
  function renderMine() {
    document.getElementById('user-pet-count').textContent = `${MockData.pets.length} 只萌宠`;
    document.getElementById('mine-pets-scroll').innerHTML = MockData.pets.map(p => `
      <div class="pet-card-small" onclick="App.openPetDetail('${p.id}')">
        <img class="pet-avatar" src="${p.avatar}" alt="${p.name}" onerror="this.style.background='#E8F8F3'" />
        <div class="pet-name">${p.name}</div>
        <div class="pet-meta">${petKindText(p.kind)} · ${calcAge(p.birthday).text}</div>
      </div>
    `).join('') + `
      <div class="add-pet-card-small" onclick="App.showToast('添加宠物功能开发中')">
        <div class="add-pet-icon">+</div>
        <div class="add-pet-text">添加萌宠</div>
      </div>
    `;
  }

  // ============ 宠物档案详情 ============
  function openPetDetail(petId) {
    const id = petId || state.currentPetId;
    const pet = getPetById(id);
    if (!pet) return;
    const genderText = pet.gender === 'male' ? '公' : '母';

    const vaccineHtml = pet.vaccines.length === 0
      ? '<div style="text-align: center; padding: 16px; color: var(--text-muted);">暂无疫苗记录</div>'
      : `<div class="timeline">${pet.vaccines.map(v => {
          const days = daysFromToday(v.nextDate);
          const isOverdue = days < 0;
          const isNear = days >= 0 && days <= 30;
          let tagHtml = '';
          if (isOverdue) tagHtml = '<span class="tag tag-error">已逾期</span>';
          else if (isNear) tagHtml = '<span class="tag tag-warning">临近接种</span>';
          return `
            <div class="timeline-item">
              <div class="timeline-dot"><i class="fas fa-syringe" style="color:var(--primary);"></i></div>
              <div class="timeline-content">
                <div class="timeline-title">${v.name} ${tagHtml}</div>
                <div class="timeline-date">接种：${formatDate(v.date)}</div>
                <div class="timeline-date">下次：${formatDate(v.nextDate)} (${friendlyDate(v.nextDate)})</div>
                ${v.hospital ? `<div class="timeline-date"><i class="fas fa-hospital" style="color:var(--text-muted);margin-right:2px;"></i> ${v.hospital}</div>` : ''}
              </div>
            </div>
          `;
        }).join('')}</div>`;

    const dewormingHtml = pet.dewormings.length === 0
      ? '<div style="text-align: center; padding: 16px; color: var(--text-muted);">暂无驱虫记录</div>'
      : `<div class="timeline">${pet.dewormings.map(d => {
          const days = daysFromToday(d.nextDate);
          const isOverdue = days < 0;
          const isNear = days >= 0 && days <= 7;
          let tagHtml = '';
          if (isOverdue) tagHtml = '<span class="tag tag-error">已逾期</span>';
          else if (isNear) tagHtml = '<span class="tag tag-warning">临近</span>';
          return `
            <div class="timeline-item">
              <div class="timeline-dot"><i class="fas ${d.type === 'internal' ? 'fa-bug' : 'fa-shield-halved'}" style="color:${d.type === 'internal' ? '#8B5CF6' : 'var(--info)'};"></i></div>
              <div class="timeline-content">
                <div class="timeline-title">${d.type === 'internal' ? '内驱虫' : '外驱虫'} ${tagHtml}</div>
                <div class="timeline-date">使用：${formatDate(d.date)}</div>
                <div class="timeline-date">下次：${formatDate(d.nextDate)} (${friendlyDate(d.nextDate)})</div>
                ${d.medicine ? `<div class="timeline-date"><i class="fas fa-pills" style="color:var(--text-muted);margin-right:2px;"></i> ${d.medicine}</div>` : ''}
              </div>
            </div>
          `;
        }).join('')}</div>`;

    const weightListHtml = pet.weights.slice().reverse().map((w, i) => {
      const prev = pet.weights[pet.weights.length - 2 - i];
      const diff = prev ? Number((w.weight - prev.weight).toFixed(1)) : 0;
      return `
        <div class="weight-item">
          <div class="weight-left">
            <span class="weight-date">${formatDate(w.date, 'MM月DD日')}</span>
            <span class="weight-value">${w.weight} kg</span>
          </div>
          ${diff !== 0 ? `<span class="tag ${diff > 0 ? 'tag-success' : 'tag-error'}">${diff > 0 ? '+' : ''}${diff}kg</span>` : ''}
        </div>
      `;
    }).join('');

    const allergyHtml = pet.allergies && pet.allergies.length > 0 ? `
      <div style="margin-top: 12px; padding-top: 12px; border-top: 1px dashed var(--divider);">
        <span style="font-size: 12px; color: var(--text-muted); margin-bottom: 4px; display: block;"><i class="fas fa-triangle-exclamation" style="color:var(--danger);margin-right:4px;"></i>过敏源</span>
        ${pet.allergies.map(a => `<span class="tag tag-error">${a}</span>`).join('')}
      </div>
    ` : '';

    document.getElementById('pet-detail-content').innerHTML = `
      <div style="padding: 8px 16px 32px;">
        <div class="pet-detail-hero">
          <div class="pet-detail-hero-bg"></div>
          <div class="pet-detail-hero-content">
            <img class="pet-avatar" src="${pet.avatar}" alt="${pet.name}" onerror="this.style.background='#E8F8F3'" />
            <div class="hero-info">
              <div class="pet-name">${pet.name}</div>
              <div class="pet-breed">${pet.breed}</div>
              <div class="hero-tags">
                <span class="tag">${petKindText(pet.kind)}</span>
                <span class="tag">${genderText}</span>
                <span class="tag">${calcAge(pet.birthday).text}</span>
                ${pet.neutered ? '<span class="tag">已绝育</span>' : ''}
              </div>
            </div>
          </div>
        </div>

        <div class="section" style="margin-top: 16px;">
          <div class="card">
            <div class="card-header"><span class="card-title">基本信息</span></div>
            <div class="info-grid">
              <div class="info-item"><span class="info-label">生日</span><span class="info-value">${formatDate(pet.birthday)}</span></div>
              <div class="info-item"><span class="info-label">体重</span><span class="info-value">${pet.weight} kg</span></div>
              ${pet.microchip ? `<div class="info-item"><span class="info-label">芯片号</span><span class="info-value">${pet.microchip}</span></div>` : ''}
              ${pet.targetWeight ? `<div class="info-item"><span class="info-label">目标体重</span><span class="info-value">${pet.targetWeight} kg</span></div>` : ''}
            </div>
            ${allergyHtml}
            ${pet.notes ? `
              <div style="margin-top: 12px; padding-top: 12px; border-top: 1px dashed var(--divider);">
                <div style="font-size: 12px; color: var(--text-muted); margin-bottom: 4px;">备注</div>
                <div style="font-size: 12px; color: var(--text); line-height: 1.5;">${pet.notes}</div>
              </div>
            ` : ''}
          </div>
        </div>

        <div class="section">
          <div class="card">
            <div class="card-header">
              <span class="card-title"><i class="fas fa-syringe" style="color:var(--primary);margin-right:6px;"></i>疫苗记录</span>
              <span class="card-subtitle">${pet.vaccines.length} 条</span>
            </div>
            ${vaccineHtml}
          </div>
        </div>

        <div class="section">
          <div class="card">
            <div class="card-header">
              <span class="card-title"><i class="fas fa-bug" style="color:#8B5CF6;margin-right:6px;"></i>驱虫记录</span>
              <span class="card-subtitle">${pet.dewormings.length} 条</span>
            </div>
            ${dewormingHtml}
          </div>
        </div>

        <div class="section">
          <div class="card">
            <div class="card-header">
              <span class="card-title"><i class="fas fa-weight-scale" style="color:var(--info);margin-right:6px;"></i>体重记录</span>
              <span class="card-subtitle">${pet.weights.length} 条</span>
            </div>
            <div class="weight-list">${weightListHtml}</div>
          </div>
        </div>
      </div>
    `;

    document.getElementById('pet-detail-mask').classList.add('show');
    document.getElementById('pet-detail-page').classList.add('show');
    document.getElementById('pet-detail-page').scrollTop = 0;
  }

  function closePetDetail() {
    document.getElementById('pet-detail-mask').classList.remove('show');
    document.getElementById('pet-detail-page').classList.remove('show');
  }

  // ============ 服务详情 ============
  function openServiceDetail(providerId) {
    const p = MockData.serviceProviders.find(x => x.id === providerId);
    if (!p) return;
    const category = MockData.serviceCategories.find(c => c.key === p.category);
    const catCfg = categoryFAConfig(p.category);

    document.getElementById('service-detail-content').innerHTML = `
      <div>
        <div style="position: relative; height: 180px; background: var(--bg-hover);">
          <img src="${p.cover}" alt="${p.name}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.style.background='#E8F8F3'" />
          <div style="position: absolute; inset: 0; background: linear-gradient(180deg, rgba(0,0,0,0) 50%, rgba(0,0,0,0.5) 100%);"></div>
          <div style="position: absolute; left: 16px; bottom: 16px; right: 16px;">
            <div style="font-size: 18px; font-weight: 700; color: #fff; text-shadow: 0 1px 4px rgba(0,0,0,0.3);">${p.name}</div>
            <div style="display: flex; align-items: center; gap: 8px; margin-top: 4px;">
              <span style="font-size: 13px; color: var(--accent); font-weight: 600;"><i class="fas fa-star" style="font-size:11px;"></i> ${p.rating}</span>
              <span style="font-size: 12px; color: rgba(255,255,255,0.9);">${p.reviewCount} 评价</span>
              <span style="font-size: 12px; color: rgba(255,255,255,0.9);"><i class="fas fa-map-marker-alt" style="font-size:10px;"></i> ${p.location}</span>
            </div>
          </div>
        </div>

        <div class="section" style="margin-top: 16px;">
          <div class="card">
            <div class="card-header">
              <span class="card-title">商家信息</span>
              ${p.verified ? '<span class="tag tag-primary"><i class="fas fa-check" style="margin-right:2px;"></i>已认证</span>' : ''}
            </div>
            <div style="font-size: 13px; color: var(--text-secondary); line-height: 1.7;">${p.bio}</div>
            <div style="display: flex; flex-wrap: wrap; gap: 4px; margin-top: 12px;">
              ${p.tags.map(t => `<span class="tag tag-md">${t}</span>`).join('')}
            </div>
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-top: 16px; padding-top: 12px; border-top: 1px dashed var(--divider);">
              <div style="text-align: center;">
                <div style="font-size: 18px; font-weight: 700; color: var(--primary);">${p.completedOrders}</div>
                <div style="font-size: 11px; color: var(--text-muted); margin-top: 2px;">完成订单</div>
              </div>
              <div style="text-align: center;">
                <div style="font-size: 18px; font-weight: 700; color: var(--info);">${p.responseTime}min</div>
                <div style="font-size: 11px; color: var(--text-muted); margin-top: 2px;">平均响应</div>
              </div>
              <div style="text-align: center;">
                <div style="font-size: 18px; font-weight: 700; color: var(--text);">${p.distance}km</div>
                <div style="font-size: 11px; color: var(--text-muted); margin-top: 2px;">距离您</div>
              </div>
            </div>
          </div>
        </div>

        <div class="section">
          <div class="card">
            <div class="card-header">
              <span class="card-title"><i class="fas ${catCfg.icon}" style="color:${catCfg.color};margin-right:6px;"></i>提供服务</span>
            </div>
            <div style="display: flex; flex-direction: column; gap: 8px;">
              ${p.services.map((s, i) => `
                <div style="display: flex; align-items: center; justify-content: space-between; padding: 8px 0; ${i < p.services.length - 1 ? 'border-bottom: 1px solid var(--divider);' : ''}">
                  <span style="font-size: 14px; color: var(--text);">${s}</span>
                  <span style="font-size: 13px; color: var(--danger); font-weight: 600;">¥${p.priceFrom + i * 30}/${p.priceUnit}</span>
                </div>
              `).join('')}
            </div>
          </div>
        </div>

        <div class="section">
          <div class="card">
            <div class="card-header">
              <span class="card-title">用户评价</span>
              <span class="card-subtitle">${p.reviewCount} 条</span>
            </div>
            <div style="display: flex; flex-direction: column; gap: 16px;">
              <div style="padding-bottom: 12px; border-bottom: 1px solid var(--divider);">
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                  <img src="https://picsum.photos/id/64/200/200" style="width: 24px; height: 24px; border-radius: 50%;" />
                  <span style="font-size: 13px; font-weight: 500;">宠物麻麻</span>
                  <span style="font-size: 11px; color: var(--accent);"><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i></span>
                </div>
                <div style="font-size: 12px; color: var(--text-secondary); line-height: 1.6;">服务很专业，上门准时，我家猫平时怕生，但和小王很快熟悉起来了，推荐！</div>
                <div style="font-size: 11px; color: var(--text-muted); margin-top: 4px;">3 天前</div>
              </div>
              <div>
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                  <img src="https://picsum.photos/id/91/200/200" style="width: 24px; height: 24px; border-radius: 50%;" />
                  <span style="font-size: 13px; font-weight: 500;">金毛爸爸</span>
                  <span style="font-size: 11px; color: var(--accent);"><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i></span>
                </div>
                <div style="font-size: 12px; color: var(--text-secondary); line-height: 1.6;">很细心，会拍照反馈每一步操作，价格也合理，已经预约了下次。</div>
                <div style="font-size: 11px; color: var(--text-muted); margin-top: 4px;">1 周前</div>
              </div>
            </div>
          </div>
        </div>

        <div style="height: 100px;"></div>
      </div>

      <div style="position: absolute; bottom: 0; left: 0; right: 0; background: var(--card); border-top: 1px solid var(--border); padding: 12px 16px; display: flex; gap: 12px; align-items: center;">
        <div style="display: flex; flex-direction: column; align-items: center; cursor: pointer;" onclick="App.showToast('收藏成功')">
          <i class="far fa-heart" style="font-size: 20px; color: var(--danger);"></i>
          <span style="font-size: 10px; color: var(--text-muted);">收藏</span>
        </div>
        <div style="display: flex; flex-direction: column; align-items: center; cursor: pointer;" onclick="App.showToast('联系客服')">
          <i class="fas fa-headset" style="font-size: 20px; color: var(--primary);"></i>
          <span style="font-size: 10px; color: var(--text-muted);">客服</span>
        </div>
        <div style="flex: 1; height: 44px; background: linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 100%); border-radius: 24px; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 16px; font-weight: 600; cursor: pointer; box-shadow: 0 2px 8px rgba(45, 159, 131, 0.3);" onclick="App.showToast('预约功能开发中')">
          立即预约 · ¥${p.priceFrom}起
        </div>
      </div>
    `;

    document.getElementById('service-detail-mask').classList.add('show');
    document.getElementById('service-detail-page').classList.add('show');
    document.getElementById('service-detail-page').scrollTop = 0;
  }

  function closeServiceDetail() {
    document.getElementById('service-detail-mask').classList.remove('show');
    document.getElementById('service-detail-page').classList.remove('show');
  }

  // ============ 初始化 ============
  function init() {
    document.querySelectorAll('#sort-group .sort-btn').forEach(btn => {
      btn.addEventListener('click', () => serviceSetSort(btn.dataset.sort));
    });

    renderHome();
    renderRecord();
    renderDiagnose();
    renderService();
    renderMine();
  }

  return {
    init,
    switchTab,
    switchPet,
    showToast,
    setRecordFilter,
    openPetDetail,
    closePetDetail,
    openServiceDetail,
    closeServiceDetail,
    // 暴露 diagnose / service 相关方法供页面 onclick 调用
    diagnoseSelectPart,
    diagnoseToggleSymptom,
    diagnoseReset,
    diagnoseRun,
    serviceSetCategory,
    serviceSetSort,
  };
})();

// DiagnosePage / ServicePage 作为薄包装，转发到 App 内部方法
window.DiagnosePage = {
  selectPart: (part) => App.diagnoseSelectPart(part),
  toggleSymptom: (id) => App.diagnoseToggleSymptom(id),
  reset: () => App.diagnoseReset(),
  diagnose: () => App.diagnoseRun(),
};

window.ServicePage = {
  setCategory: (cat) => App.serviceSetCategory(cat),
  setSort: (sort) => App.serviceSetSort(sort),
};
