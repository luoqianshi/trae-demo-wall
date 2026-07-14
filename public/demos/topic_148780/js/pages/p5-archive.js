// ============================================
// P5 遛娃档案
// ============================================

function renderArchivePage() {
  updateBabyCard();
  renderAIPreferences();
  renderTimeline();
  refreshIcons();
}

function updateBabyCard() {
  const nameEl = document.getElementById('p5-baby-name');
  const ageEl = document.getElementById('p5-baby-age');
  const tripsEl = document.getElementById('p5-baby-trips');
  
  if (nameEl) nameEl.textContent = profile.babyName || '宝宝';
  if (ageEl) {
    const ageText = profile.ageGroup ? profile.ageGroup + '岁' : '';
    ageEl.textContent = ageText ? '· ' + ageText : '';
  }
  if (tripsEl) {
    const total = profile.stats && profile.stats.totalTrips ? profile.stats.totalTrips : records.length;
    tripsEl.textContent = `已记录 ${total} 次出行`;
  }
}

function calculateProfileStats() {
  const stats = {
    totalTrips: records.length,
    outdoorRatio: 0,
    likedTypes: [],
    dislikedTypes: [],
    avgDuration: 'half',
    timePreference: 'morning'
  };

  if (records.length === 0) {
    return stats;
  }

  let outdoorCount = 0;
  const typeCount = {};
  const durationCount = { half: 0, full: 0 };

  records.forEach(record => {
    const place = places.find(p => p.name === record.placeName);
    if (place && !place.indoors) {
      outdoorCount++;
    }

    if (place && place.types) {
      place.types.forEach(type => {
        typeCount[type] = typeCount[type] || { love: 0, ok: 0, dislike: 0 };
        typeCount[type][record.feeling] = (typeCount[type][record.feeling] || 0) + 1;
      });
    }

    if (record.duration) {
      durationCount[record.duration]++;
    }
  });

  stats.outdoorRatio = Math.round((outdoorCount / records.length) * 100);

  for (const [type, counts] of Object.entries(typeCount)) {
    const total = counts.love + counts.ok + counts.dislike;
    const loveRatio = counts.love / total;
    const dislikeRatio = counts.dislike / total;
    
    if (loveRatio > 0.5) {
      if (!stats.likedTypes.includes(type)) stats.likedTypes.push(type);
    }
    if (dislikeRatio > 0.5) {
      if (!stats.dislikedTypes.includes(type)) stats.dislikedTypes.push(type);
    }
  }

  stats.avgDuration = durationCount.half > durationCount.full ? 'half' : 'full';

  return stats;
}

function renderAIPreferences() {
  const stats = calculateProfileStats();
  profile.stats = stats;
  
  const introEl = document.getElementById('p5-ai-intro');
  const listEl = document.getElementById('p5-ai-list');
  
  if (!introEl || !listEl) return;

  const babyName = profile.babyName || '宝宝';
  
  if (stats.totalTrips === 0) {
    introEl.textContent = '还没有出行记录哦~';
    listEl.innerHTML = `
      <div class="p5-ai-empty">
        <i data-lucide="sparkles" class="h-8 w-8"></i>
        <p>添加一些出行记录，搭子就能发现你的偏好啦</p>
      </div>
    `;
    refreshIcons();
    return;
  }

  introEl.textContent = `看了你和${babyName}的 ${stats.totalTrips} 次出行~`;

  const preferences = [];

  if (stats.outdoorRatio >= 60) {
    preferences.push({
      color: 'var(--color-primary)',
      text: '你更喜欢户外场所',
      progress: stats.outdoorRatio,
      progressColor: 'var(--color-primary)'
    });
  } else if (stats.outdoorRatio <= 40) {
    preferences.push({
      color: 'var(--color-purple)',
      text: '你更喜欢室内场所',
      progress: 100 - stats.outdoorRatio,
      progressColor: 'var(--color-purple)'
    });
  }

  const typeInterestMap = {
    'zoo': '动物', 'nature': '自然', 'science': '科学',
    'museum': '博物馆', 'culture': '文化', 'park': '公园',
    'playground': '乐园', 'water': '玩水', 'farm': '农场'
  };
  
  const likedInterest = stats.likedTypes.find(t => typeInterestMap[t]);
  if (likedInterest) {
    preferences.push({
      color: 'var(--color-teal)',
      text: `${babyName}对${typeInterestMap[likedInterest]}类很感兴趣`
    });
  }

  if (stats.avgDuration === 'half') {
    preferences.push({
      color: 'var(--color-purple)',
      text: '你们通常选择半天行程'
    });
  } else {
    preferences.push({
      color: 'var(--color-purple)',
      text: '你们通常选择全天行程'
    });
  }

  if (stats.likedTypes.length > 0) {
    const likedTypesText = stats.likedTypes.slice(0, 2).map(t => typeInterestMap[t] || t).join('、');
    preferences.push({
      color: 'var(--color-yellow)',
      text: `近期偏好：${likedTypesText}`
    });
  }

  if (preferences.length === 0) {
    preferences.push({
      color: 'var(--color-text-tertiary)',
      text: '记录更多出行，搭子就能更懂你啦'
    });
  }

  listEl.innerHTML = preferences.map((pref, index) => `
    <div class="p5-ai-item" style="animation-delay: ${index * 0.15}s;">
      <span class="p5-ai-dot" style="background:${pref.color};"></span>
      <div style="flex:1;">
        <p class="p5-ai-text">${pref.text}</p>
        ${pref.progress !== undefined ? `
          <div class="p5-ai-progress-wrap">
            <div class="p5-ai-progress-bar">
              <div class="p5-ai-progress-fill" data-target="${pref.progress}" style="background:${pref.progressColor};"></div>
            </div>
            <span class="p5-ai-progress-value">${pref.progress}%</span>
          </div>
        ` : ''}
      </div>
    </div>
  `).join('');

  setTimeout(animateProgressBars, 100);
  refreshIcons();
}

function animateProgressBars() {
  const bars = document.querySelectorAll('.p5-ai-progress-fill');
  bars.forEach((bar, index) => {
    const target = bar.dataset.target || 70;
    setTimeout(() => {
      bar.style.width = target + '%';
    }, index * 200);
  });
}

function showProfileEditModal() {
  const modal = document.getElementById('p5-profile-modal');
  if (!modal) return;

  document.body.style.overflow = 'hidden';

  document.getElementById('edit-babyName').value = profile.babyName || '';
  
  setSegGroupValue('edit-age', profile.ageGroup);
  setSegGroupValue('edit-gender', profile.gender);
  setSegGroupValue('edit-duration', profile.preferredDuration);
  setSegGroupValue('edit-transport', profile.transport);
  setSegGroupValue('edit-stroller', String(profile.needsStroller));
  setSegGroupValue('edit-time', profile.preferredTime);
  setSegGroupValue('edit-distance', String(profile.maxDistance));

  document.querySelectorAll('input[name="interest"]').forEach(cb => {
    cb.checked = profile.interests && profile.interests.includes(cb.value);
  });

  document.getElementById('edit-allergies').value = profile.allergies ? profile.allergies.join(', ') : '';

  modal.style.display = 'flex';
  refreshIcons();
}

function closeProfileEditModal() {
  const modal = document.getElementById('p5-profile-modal');
  if (modal) modal.style.display = 'none';
  document.body.style.overflow = '';
}

function saveProfileEdit() {
  const babyName = document.getElementById('edit-babyName').value.trim();
  
  const interests = [];
  document.querySelectorAll('input[name="interest"]:checked').forEach(cb => {
    interests.push(cb.value);
  });
  
  const allergiesInput = document.getElementById('edit-allergies').value.trim();
  const allergies = allergiesInput ? allergiesInput.split(/[,，]/).map(s => s.trim()).filter(Boolean) : [];

  profile = {
    ...profile,
    babyName: babyName || '宝宝',
    ageGroup: getSegGroupValue('edit-age'),
    gender: getSegGroupValue('edit-gender'),
    interests: interests,
    allergies: allergies,
    preferredDuration: getSegGroupValue('edit-duration'),
    transport: getSegGroupValue('edit-transport'),
    needsStroller: getSegGroupValue('edit-stroller') === 'true',
    preferredTime: getSegGroupValue('edit-time'),
    maxDistance: parseInt(getSegGroupValue('edit-distance')) || 60
  };

  store.set('profile', profile);
  
  renderArchivePage();
  closeProfileEditModal();
  showMessage('saved', 'success');
}

function showRecordModal() {
  const modal = document.getElementById('p5-record-modal');
  if (!modal) return;

  document.body.style.overflow = 'hidden';

  const select = document.getElementById('record-place-id');
  select.innerHTML = '<option value="">请选择地点</option>' +
    places.filter(p => !p.closed).map(p => 
      `<option value="${p.id}">${p.name}</option>`
    ).join('');

  const today = new Date().toISOString().split('T')[0];
  document.getElementById('record-date').value = today;
  
  setSegGroupValue('record-feeling', 'love');
  setSegGroupValue('record-duration', 'half');
  document.getElementById('record-note').value = '';

  modal.style.display = 'flex';
  refreshIcons();
}

function closeRecordModal() {
  const modal = document.getElementById('p5-record-modal');
  if (modal) modal.style.display = 'none';
  document.body.style.overflow = '';
}

function saveRecord() {
  const placeId = parseInt(document.getElementById('record-place-id').value);
  const date = document.getElementById('record-date').value;
  const feeling = getSegGroupValue('record-feeling');
  const duration = getSegGroupValue('record-duration');
  const note = document.getElementById('record-note').value.trim();

  if (!placeId || !date || !feeling) {
    showToast('请填写完整信息', 'warning');
    return;
  }

  const place = places.find(p => p.id === placeId);
  if (!place) {
    showToast('选择的地点不存在', 'error');
    return;
  }

  const dateObj = new Date(date);
  const month = dateObj.getMonth() + 1;
  const day = dateObj.getDate();
  const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

  const newRecord = {
    id: Date.now(),
    date: `${month}月${day}日`,
    dayOfWeek: weekDays[dateObj.getDay()],
    placeName: place.name,
    feeling: feeling,
    feelingLabel: FEELING_CONFIG[feeling] ? FEELING_CONFIG[feeling].text : feeling,
    duration: duration === 'half' ? '半天' : '全天',
    note: note,
    outdoors: !place.indoors
  };

  records.unshift(newRecord);
  store.set('records', records);
  
  renderArchivePage();
  closeRecordModal();
  setTimeout(() => {
    showMessage('saved', 'success');
  }, 100);
}

function renderTimeline() {
  const timelineEl = document.getElementById('p5-timeline');
  if (!timelineEl) return;

  if (!records || records.length === 0) {
    timelineEl.innerHTML = `
      <div class="p5-empty-state">
        <div class="p5-empty-icon empty-state-icon"><i data-lucide="sparkles" class="h-12 w-12"></i></div>
        <div class="p5-empty-text">还没有出行记录</div>
        <div class="p5-empty-hint">选好地方出发后，会自动记录在这里~</div>
      </div>
    `;
    refreshIcons();
    return;
  }

  timelineEl.innerHTML = records.map((record, index) => `
    <div class="p5-timeline-item">
      <div class="p5-timeline-bar ${record.feeling}"></div>
      <div class="p5-timeline-content">
        <div class="p5-timeline-date">
          <span class="p5-timeline-date-text">${escapeHtml(record.date)}</span>
          <span class="p5-timeline-dow">${escapeHtml(record.dayOfWeek)}</span>
        </div>
        <div class="p5-timeline-place">${escapeHtml(record.placeName)}</div>
        <div class="p5-timeline-meta">
          <span class="p5-feeling-tag ${record.feeling}">
            <i data-lucide="${record.feeling === 'love' ? 'star' : (record.feeling === 'ok' ? 'minus' : 'x')}" class="h-3 w-3"></i>
            ${escapeHtml(record.feelingLabel)}
          </span>
          <span class="tag tag-gray">${escapeHtml(record.duration)}</span>
        </div>
        ${record.note ? `<div class="p5-timeline-note">"${escapeHtml(record.note)}"</div>` : ''}
      </div>
    </div>
  `).join('');

  timelineEl.classList.remove('list-fade-in');
  void timelineEl.offsetWidth;
  timelineEl.classList.add('list-fade-in');

  refreshIcons();
}

function setSegGroupValue(groupName, value) {
  const group = document.querySelector(`.seg-group[data-group="${groupName}"]`);
  if (!group) return;
  group.querySelectorAll('.seg-btn').forEach(btn => {
    btn.classList.remove('active');
    if (btn.dataset.value === String(value)) {
      btn.classList.add('active');
    }
  });
}

function getSegGroupValue(groupName) {
  const group = document.querySelector(`.seg-group[data-group="${groupName}"]`);
  if (!group) return '';
  const activeBtn = group.querySelector('.seg-btn.active');
  return activeBtn ? activeBtn.dataset.value : '';
}