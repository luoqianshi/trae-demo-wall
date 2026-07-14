// ============================================
// P3 分享决策
// ============================================

function saveData() {
  if (typeof store !== 'undefined' && store.set) {
    store.set('records', records);
    store.set('profile', profile);
  }
}

function copyWechatText() {
  if (!selectedDestination) {
    showToast('请先选择一个目的地', 'warning');
    return;
  }

  const age = currentParams.age || profile?.ageGroup || 
    (selectedDestination.ageRange && selectedDestination.ageRange.length > 0 
      ? selectedDestination.ageRange.join('、') : '');
  const reason = selectedDestination.reasons && selectedDestination.reasons[0]
    ? selectedDestination.reasons[0].text
    : '本周六天气好，适合带荔枝去';
  const warning = selectedDestination.crowdLevel >= 4
    ? '⚠️ 注意：周末人较多，建议上午去'
    : '';

  const ageLine = age ? `👶 适合${age}岁 | 🚗 推车友好` : '🚗 推车友好';
  const text = `【遛娃搭子推荐】${selectedDestination.name}
⭐ 匹配度 ${selectedDestination.score}%
🌤️ 周六晴 27°C | ⏰ 半天
${ageLine}
💬 "${reason}"
${warning}`.trim();

  if (navigator.clipboard) {
    navigator.clipboard.writeText(text).then(() => {
      showToast('文案已复制，去微信粘贴吧~', 'success');
    }).catch(() => {
      fallbackCopy(text);
    });
  } else {
    fallbackCopy(text);
  }
}

function fallbackCopy(text) {
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  textarea.style.left = '-9999px';
  document.body.appendChild(textarea);
  textarea.select();
  try {
    const successful = document.execCommand('copy');
    if (successful) {
      showToast('文案已复制，去微信粘贴吧~', 'success');
    } else {
      showToast('复制失败，请手动复制', 'error');
    }
  } catch (e) {
    showToast('复制失败，请手动复制', 'error');
  }
  document.body.removeChild(textarea);
}

function confirmDecision() {
  if (!selectedDestination) {
    showMessage('noSelection', 'warning');
    return;
  }
  showMessage('tripConfirmed', 'success');
  
  const today = new Date();
  const dateStr = `${today.getMonth() + 1}月${today.getDate()}日`;
  const dayOfWeek = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][today.getDay()];
  
  records.unshift({
    id: Date.now(),
    date: dateStr,
    dayOfWeek: dayOfWeek,
    placeName: selectedDestination.name,
    feeling: 'love',
    feelingLabel: '还会再去',
    duration: selectedDestination.duration || '半天',
    note: ''
  });
  
  // 重新计算档案统计
  if (typeof calculateProfileStats === 'function') {
    profile.stats = calculateProfileStats();
  }
  
  saveData();
  
  setTimeout(() => {
    switchTab('home');
  }, 1500);
}
