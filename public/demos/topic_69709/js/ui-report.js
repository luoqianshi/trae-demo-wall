// ============ 成长报告渲染 ============
function renderReport() {
  const persona = Storage.get('userPersona', {});
  const records = Storage.get('readingRecords', []);
  const today = new Date();

  // 根据周期计算统计
  let periodRecords;
  if (currentReportPeriod === 'week') {
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - 6);
    weekStart.setHours(0, 0, 0, 0);
    periodRecords = records.filter(r => new Date(r.date) >= weekStart);
  } else {
    const monthStart = new Date(today);
    monthStart.setDate(today.getDate() - 29);
    monthStart.setHours(0, 0, 0, 0);
    periodRecords = records.filter(r => new Date(r.date) >= monthStart);
  }

  const periodBooks = new Set(periodRecords.map(r => r.bookTitle)).size;
  const periodMinutes = periodRecords.reduce((sum, r) => sum + (r.duration || 0), 0);

  // 显示/隐藏月度趋势图
  document.getElementById('month-trend-card').style.display = currentReportPeriod === 'month' ? 'block' : 'none';

  renderCalendar();
  renderAnalysisReport();
  renderGrowthComparison();
  renderRadarChart();
  renderAbilityProgress();
  renderSuggestions();

  // 画月度趋势图
  if (currentReportPeriod === 'month') {
    setTimeout(() => renderTrendChart(), 100);
  }
}

function switchReportPeriod(period) {
  currentReportPeriod = period;
  document.querySelectorAll('.report-tab').forEach(tab => {
    tab.classList.toggle('active', tab.dataset.period === period);
  });
  renderReport();
}

// ============ 成长对比 ============
function renderGrowthComparison() {
  const records = Storage.get('readingRecords', []);
  const now = new Date();
  
  // 本月数据
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const thisMonthRecords = records.filter(r => {
    const d = new Date(r.date);
    return d >= thisMonthStart && d <= now;
  });
  
  // 上月数据
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
  const lastMonthRecords = records.filter(r => {
    const d = new Date(r.date);
    return d >= lastMonthStart && d <= lastMonthEnd;
  });
  
  // 计算各项指标
  const thisBooks = new Set(thisMonthRecords.map(r => r.bookTitle)).size;
  const lastBooks = new Set(lastMonthRecords.map(r => r.bookTitle)).size;
  const booksChange = thisBooks - lastBooks;
  
  const thisMinutes = thisMonthRecords.reduce((sum, r) => sum + (r.duration || 0), 0);
  const lastMinutes = lastMonthRecords.reduce((sum, r) => sum + (r.duration || 0), 0);
  const minutesChange = thisMinutes - lastMinutes;
  
  // 注意力（根据情绪标签判断）
  const thisFocused = thisMonthRecords.filter(r => 
    r.emotionTags && r.emotionTags.includes('主动提问')
  ).length;
  const lastFocused = lastMonthRecords.filter(r => 
    r.emotionTags && r.emotionTags.includes('主动提问')
  ).length;
  const focusedChange = thisFocused - lastFocused;
  
  // 兴趣分布（分类偏好）
  const thisCategories = {};
  const lastCategories = {};
  
  thisMonthRecords.forEach(r => {
    const book = bookDatabase.find(b => b.title === r.bookTitle);
    if (book && book.tags[0]) {
      thisCategories[book.tags[0]] = (thisCategories[book.tags[0]] || 0) + 1;
    }
  });
  
  lastMonthRecords.forEach(r => {
    const book = bookDatabase.find(b => b.title === r.bookTitle);
    if (book && book.tags[0]) {
      lastCategories[book.tags[0]] = (lastCategories[book.tags[0]] || 0) + 1;
    }
  });
  
  // 找出本月最热门分类
  const topCategory = Object.entries(thisCategories).sort((a, b) => b[1] - a[1])[0];
  const lastTopCategory = Object.entries(lastCategories).sort((a, b) => b[1] - a[1])[0];
  
  // 渲染对比内容
  const container = document.getElementById('growth-comparison-content');
  container.innerHTML = `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
      <div style="background:var(--secondary-bg);padding:12px;border-radius:10px;">
        <div style="font-size:12px;color:var(--text-light);margin-bottom:4px;">📚 阅读量</div>
        <div style="display:flex;align-items:center;gap:6px;">
          <span style="font-size:18px;font-weight:700;color:var(--primary);">${thisBooks}本</span>
          <span style="font-size:12px;color:${booksChange > 0 ? '#4CAF50' : booksChange < 0 ? '#f44336' : '#999'};">
            ${getChangeArrow(booksChange)} ${booksChange > 0 ? '+' + booksChange : booksChange < 0 ? booksChange : '持平'}
          </span>
        </div>
        <div style="font-size:11px;color:var(--text-light);">上月 ${lastBooks}本</div>
      </div>
      
      <div style="background:var(--secondary-bg);padding:12px;border-radius:10px;">
        <div style="font-size:12px;color:var(--text-light);margin-bottom:4px;">⏱️ 阅读时长</div>
        <div style="display:flex;align-items:center;gap:6px;">
          <span style="font-size:18px;font-weight:700;color:var(--primary);">${thisMinutes}分钟</span>
          <span style="font-size:12px;color:${minutesChange > 0 ? '#4CAF50' : minutesChange < 0 ? '#f44336' : '#999'};">
            ${getChangeArrow(minutesChange)} ${minutesChange > 0 ? '+' + minutesChange : minutesChange < 0 ? minutesChange : '持平'}
          </span>
        </div>
        <div style="font-size:11px;color:var(--text-light);">上月 ${lastMinutes}分钟</div>
      </div>
      
      <div style="background:var(--secondary-bg);padding:12px;border-radius:10px;">
        <div style="font-size:12px;color:var(--text-light);margin-bottom:4px;">🎯 主动提问</div>
        <div style="display:flex;align-items:center;gap:6px;">
          <span style="font-size:18px;font-weight:700;color:var(--primary);">${thisFocused}次</span>
          <span style="font-size:12px;color:${focusedChange > 0 ? '#4CAF50' : focusedChange < 0 ? '#f44336' : '#999'};">
            ${getChangeArrow(focusedChange)} ${focusedChange > 0 ? '+' + focusedChange : focusedChange < 0 ? focusedChange : '持平'}
          </span>
        </div>
        <div style="font-size:11px;color:var(--text-light);">上月 ${lastFocused}次</div>
      </div>
      
      <div style="background:var(--secondary-bg);padding:12px;border-radius:10px;">
        <div style="font-size:12px;color:var(--text-light);margin-bottom:4px;">📖 最爱分类</div>
        <div style="font-size:14px;font-weight:600;color:var(--primary);">
          ${topCategory ? topCategory[0] : '暂无'}
        </div>
        <div style="font-size:11px;color:var(--text-light);">
          ${topCategory ? `上月 ${lastTopCategory ? lastTopCategory[0] : '暂无'}` : ''}
        </div>
      </div>
    </div>
    
    <div style="margin-top:10px;padding:8px 12px;background:#FFF8E1;border-radius:8px;font-size:12px;color:#E65100;">
      ${getGrowthSummary(booksChange, minutesChange, focusedChange, thisBooks, thisMinutes, thisFocused)}
    </div>
  `;
}

function getChangeArrow(change) {
  if (change > 0) return '↑';
  if (change < 0) return '↓';
  return '→';
}

function getGrowthSummary(books, minutes, focused, totalBooks, totalMinutes, totalFocused) {
  const improvements = [];
  if (books > 0) improvements.push('阅读量增加');
  if (minutes > 0) improvements.push('阅读时长增长');
  if (focused > 0) improvements.push('注意力提升');
  
  if (improvements.length === 0) {
    return '💡 本月阅读数据与上月持平，建议尝试新绘本类型激发兴趣';
  }
  
  const avgMinutes = totalBooks > 0 ? Math.round(totalMinutes / totalBooks) : 0;
  return `🎉 本月${improvements.join('、')}！平均每本阅读${avgMinutes}分钟，继续保持～`;
}

let currentCalendarDate = new Date();

function changeCalendarMonth(delta) {
  currentCalendarDate.setMonth(currentCalendarDate.getMonth() + delta);
  renderCalendar();
}

function renderCalendar() {
  const records = Storage.get('readingRecords', []);
  const dateCounts = {};
  records.forEach(r => {
    dateCounts[r.date] = (dateCounts[r.date] || 0) + 1;
  });

  const year = currentCalendarDate.getFullYear();
  const month = currentCalendarDate.getMonth();

  document.getElementById('calendar-month').textContent = `${year}年${month + 1}月`;

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDay = firstDay.getDay();
  const daysInMonth = lastDay.getDate();

  const today = new Date();
  const todayStr = formatDate(today);

  const allCounts = Object.values(dateCounts);
  const avgCount = allCounts.length > 0 ? allCounts.reduce((a, b) => a + b, 0) / allCounts.length : 0;

  const calendarDays = [];

  for (let i = startDay - 1; i >= 0; i--) {
    const d = new Date(year, month, -i);
    const dateStr = formatDate(d);
    const count = dateCounts[dateStr] || 0;
    let level = 0;
    if (count >= 4) level = 4;
    else if (count >= 3) level = 3;
    else if (count >= 2) level = 2;
    else if (count >= 1) level = 1;
    calendarDays.push({
      day: d.getDate(),
      dateStr,
      count,
      level,
      isPeak: count > avgCount * 1.5 && count >= 2,
      isToday: dateStr === todayStr,
      isOtherMonth: true
    });
  }

  for (let i = 1; i <= daysInMonth; i++) {
    const d = new Date(year, month, i);
    const dateStr = formatDate(d);
    const count = dateCounts[dateStr] || 0;
    let level = 0;
    if (count >= 4) level = 4;
    else if (count >= 3) level = 3;
    else if (count >= 2) level = 2;
    else if (count >= 1) level = 1;
    calendarDays.push({
      day: i,
      dateStr,
      count,
      level,
      isPeak: count > avgCount * 1.5 && count >= 2,
      isToday: dateStr === todayStr,
      isOtherMonth: false
    });
  }

  const remaining = 42 - calendarDays.length;
  for (let i = 1; i <= remaining; i++) {
    const d = new Date(year, month + 1, i);
    const dateStr = formatDate(d);
    const count = dateCounts[dateStr] || 0;
    let level = 0;
    if (count >= 4) level = 4;
    else if (count >= 3) level = 3;
    else if (count >= 2) level = 2;
    else if (count >= 1) level = 1;
    calendarDays.push({
      day: i,
      dateStr,
      count,
      level,
      isPeak: count > avgCount * 1.5 && count >= 2,
      isToday: dateStr === todayStr,
      isOtherMonth: true
    });
  }

  const container = document.getElementById('calendar-grid');
  container.innerHTML = calendarDays.map(d => {
    const levelClass = d.count > 0 ? `level-${d.level}` : '';
    const peakClass = d.isPeak ? 'is-peak' : '';
    const todayClass = d.isToday ? 'today' : '';
    const otherClass = d.isOtherMonth ? 'other-month' : '';
    const hasDataClass = d.count > 0 ? 'has-data' : '';
    const clickAttr = d.count > 0 ? `onclick="showDayDetail('${d.dateStr}')"` : '';
    return `<div class="calendar-day ${hasDataClass} ${levelClass} ${peakClass} ${todayClass} ${otherClass}" ${clickAttr} title="${d.dateStr} · ${d.count}本">${d.day}</div>`;
  }).join('');
}

function showDayDetail(dateStr) {
  const records = Storage.get('readingRecords', []);
  const dayRecords = records.filter(r => r.date === dateStr);
  
  if (dayRecords.length === 0) return;
  
  // 格式化日期显示
  const dateObj = new Date(dateStr);
  const displayDate = `${dateObj.getMonth() + 1}月${dateObj.getDate()}日`;
  document.getElementById('day-detail-title').textContent = `📅 ${displayDate}阅读详情`;
  
  const modal = document.getElementById('day-detail-modal');
  const content = document.getElementById('day-detail-content');
  
  content.innerHTML = dayRecords.map(r => {
    const book = bookDatabase.find(b => b.title === r.bookTitle);
    const emoji = book ? book.emoji : '📚';
    const rating = r.rating ? '⭐'.repeat(r.rating) : '';
    return `
      <div class="day-record-item" style="display:flex;gap:10px;padding:10px 0;border-bottom:1px solid var(--border);">
        <div style="font-size:28px;">${emoji}</div>
        <div style="flex:1;">
          <div style="font-weight:600;font-size:14px;">${r.bookTitle}</div>
          <div style="font-size:12px;color:var(--text-secondary);margin-top:2px;">
            ${r.duration || 5}分钟 ${rating}
          </div>
          ${r.interactionHighlights ? `<div style="font-size:12px;color:var(--text-light);margin-top:4px;line-height:1.4;">${r.interactionHighlights.substring(0, 50)}${r.interactionHighlights.length > 50 ? '...' : ''}</div>` : ''}
        </div>
      </div>
    `;
  }).join('');
  
  modal.classList.add('show');
}

function closeDayDetailModal() {
  document.getElementById('day-detail-modal').classList.remove('show');
}

// 雷达图
function renderRadarChart() {
  const canvas = document.getElementById('radar-chart');
  const ctx = canvas.getContext('2d');
  const records = Storage.get('readingRecords', []);
  const today = new Date();

  // 最近30天的记录
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(today.getDate() - 29);
  const recentRecords = records.filter(r => new Date(r.date) >= thirtyDaysAgo);

  if (recentRecords.length === 0) {
    // 无记录时显示提示
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#999';
    ctx.font = '13px -apple-system, "PingFang SC", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('记录阅读后', canvas.width / 2, canvas.height / 2 - 10);
    ctx.fillText('自动发现兴趣偏好', canvas.width / 2, canvas.height / 2 + 10);
    return;
  }

  // 具体兴趣关键词（更细粒度）
  const interestKeywords = [
    { name: '动物', keywords: ['动物', '熊', '兔', '鸭', '鱼', '鳄鱼', '猫', '狗', '大象', '长颈鹿', '企鹅', '猴子'] },
    { name: '恐龙', keywords: ['恐龙', '霸王龙', '甲龙', '你看起来好像很好吃'] },
    { name: '昆虫', keywords: ['昆虫', '毛毛虫', '蟋蟀', '蝴蝶', '蚂蚁', '蜜蜂'] },
    { name: '海洋', keywords: ['海洋', '鱼', '鲨鱼', '章鱼', '海底', '潜水'] },
    { name: '太空', keywords: ['太空', '宇宙', '星球', '火箭', '月亮', '星星'] },
    { name: '数学', keywords: ['数学', '数数', '数字', '算术', '加减', '形状'] },
    { name: '颜色', keywords: ['颜色', '彩虹', '点点点', '变变变', '小黄小蓝'] },
    { name: '冒险', keywords: ['冒险', '探险', '海盗', '寻宝', '旅行', '出发'] },
    { name: '手工', keywords: ['手工', '制作', '创意', '艺术', '画画', '剪纸'] },
    { name: '逻辑', keywords: ['逻辑', '推理', '找不同', '迷宫', '拼图', '排序'] },
    { name: '观察', keywords: ['观察', '找找看', '谁藏起来了', '小金鱼逃走了', '发现'] },
    { name: '互动', keywords: ['互动', '翻翻', '洞洞', '触摸', '声音', '立体'] },
    { name: '情绪', keywords: ['情绪', '生气', '开心', '难过', '害怕', '勇敢', '冷静'] },
    { name: '友情', keywords: ['友情', '朋友', '友谊', '分享', '合作'] },
    { name: '亲情', keywords: ['亲情', '爸爸', '妈妈', '爷爷', '奶奶', '外婆', '抱抱', '爱'] },
    { name: '睡前', keywords: ['睡前', '晚安', '睡觉', '月亮', '夜晚'] },
    { name: '自然', keywords: ['自然', '种子', '植物', '花', '树', '四季', '天气'] },
    { name: '汽车', keywords: ['汽车', '车', '火车', '飞机', '船', '交通工具'] },
  ];

  // 统计每个兴趣关键词的出现次数
  const interestCounts = {};
  const interestFirstDate = {}; // 记录首次出现日期，用于判断新兴趣
  const RECENT_DAYS = 7; // 最近7天内首次出现的为新兴趣
  
  const recentNewDate = new Date(today);
  recentNewDate.setDate(today.getDate() - RECENT_DAYS);
  const recentNewDateStr = formatDate(recentNewDate);

  recentRecords.forEach(r => {
    const book = bookDatabase.find(b => b.title === r.bookTitle);
    if (!book) return;
    
    // 合并书名、标签、描述作为关键词来源
    const text = (book.title + ' ' + (book.tags || []).join(' ') + ' ' + (book.description || '')).toLowerCase();
    
    interestKeywords.forEach(interest => {
      const matched = interest.keywords.some(kw => 
        text.includes(kw.toLowerCase())
      );
      
      if (matched) {
        interestCounts[interest.name] = (interestCounts[interest.name] || 0) + 1;
        if (!interestFirstDate[interest.name] || r.date < interestFirstDate[interest.name]) {
          interestFirstDate[interest.name] = r.date;
        }
      }
    });
  });

  // 按出现次数排序，取前6个
  const sortedInterests = Object.entries(interestCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  if (sortedInterests.length === 0) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#999';
    ctx.font = '13px -apple-system, "PingFang SC", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('暂无兴趣数据', canvas.width / 2, canvas.height / 2);
    return;
  }

  // 构建维度数据
  const dimensions = sortedInterests.map(([name, count]) => ({
    name,
    count,
    isNew: interestFirstDate[name] >= recentNewDateStr
  }));

  // 如果维度少于3个，补充常见维度
  const defaultInterests = ['动物', '自然', '情绪', '友情', '冒险', '观察'];
  const existingNames = dimensions.map(d => d.name);
  defaultInterests.forEach(interest => {
    if (!existingNames.includes(interest) && dimensions.length < 6) {
      dimensions.push({ name: interest, count: 0, isNew: false });
    }
  });

  const data = dimensions.map(d => d.count);
  const maxVal = Math.max(...data, 1);
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  const radius = Math.min(centerX, centerY) - 50;
  const levels = 5;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // 绘制背景网格
  ctx.strokeStyle = '#F0E6D8';
  ctx.lineWidth = 1;
  for (let i = 1; i <= levels; i++) {
    const r = radius * i / levels;
    ctx.beginPath();
    for (let j = 0; j < dimensions.length; j++) {
      const angle = (Math.PI * 2 * j / dimensions.length) - Math.PI / 2;
      const x = centerX + r * Math.cos(angle);
      const y = centerY + r * Math.sin(angle);
      if (j === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.stroke();
  }

  // 绘制轴线
  for (let j = 0; j < dimensions.length; j++) {
    const angle = (Math.PI * 2 * j / dimensions.length) - Math.PI / 2;
    const x = centerX + radius * Math.cos(angle);
    const y = centerY + radius * Math.sin(angle);
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(x, y);
    ctx.stroke();
  }

  // 绘制数据区域
  ctx.beginPath();
  for (let j = 0; j < dimensions.length; j++) {
    const angle = (Math.PI * 2 * j / dimensions.length) - Math.PI / 2;
    const val = data[j] / maxVal;
    const r = radius * val;
    const x = centerX + r * Math.cos(angle);
    const y = centerY + r * Math.sin(angle);
    if (j === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fillStyle = 'rgba(255, 140, 66, 0.3)';
  ctx.fill();
  ctx.strokeStyle = '#FF8C42';
  ctx.lineWidth = 2;
  ctx.stroke();

  // 绘制数据点
  for (let j = 0; j < dimensions.length; j++) {
    const angle = (Math.PI * 2 * j / dimensions.length) - Math.PI / 2;
    const val = data[j] / maxVal;
    const r = radius * val;
    const x = centerX + r * Math.cos(angle);
    const y = centerY + r * Math.sin(angle);
    
    // 新兴趣点用不同颜色
    ctx.beginPath();
    ctx.arc(x, y, dimensions[j].isNew ? 6 : 4, 0, Math.PI * 2);
    ctx.fillStyle = dimensions[j].isNew ? '#4CAF50' : '#FF8C42';
    ctx.fill();
    
    // 新兴趣点加外圈
    if (dimensions[j].isNew) {
      ctx.beginPath();
      ctx.arc(x, y, 9, 0, Math.PI * 2);
      ctx.strokeStyle = '#4CAF50';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }

  // 绘制标签
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (let j = 0; j < dimensions.length; j++) {
    const angle = (Math.PI * 2 * j / dimensions.length) - Math.PI / 2;
    const labelRadius = radius + 28;
    const x = centerX + labelRadius * Math.cos(angle);
    const y = centerY + labelRadius * Math.sin(angle);
    
    // 新兴趣点标签加"新"标记
    const labelText = dimensions[j].isNew ? dimensions[j].name + ' ✨' : dimensions[j].name;
    ctx.fillStyle = dimensions[j].isNew ? '#4CAF50' : '#666';
    ctx.font = dimensions[j].isNew ? 'bold 12px -apple-system, "PingFang SC", sans-serif' : '12px -apple-system, "PingFang SC", sans-serif';
    ctx.fillText(labelText, x, y);
  }
}

// 月度趋势折线图
function renderTrendChart() {
  const canvas = document.getElementById('trend-chart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const records = Storage.get('readingRecords', []);
  const today = new Date();

  // 统计最近30天每天的阅读量
  const dailyData = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dateStr = formatDate(d);
    const count = records.filter(r => r.date === dateStr).length;
    dailyData.push({ date: d, count, day: d.getDate() });
  }

  const padding = { top: 20, right: 15, bottom: 25, left: 25 };
  const chartW = canvas.width - padding.left - padding.right;
  const chartH = canvas.height - padding.top - padding.bottom;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const maxVal = Math.max(...dailyData.map(d => d.count), 1);

  // 网格线
  ctx.strokeStyle = '#F0E6D8';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const y = padding.top + chartH * i / 4;
    ctx.beginPath();
    ctx.moveTo(padding.left, y);
    ctx.lineTo(padding.left + chartW, y);
    ctx.stroke();

    ctx.fillStyle = '#999';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillText(Math.round(maxVal * (4 - i) / 4), padding.left - 5, y);
  }

  // 折线
  ctx.beginPath();
  ctx.strokeStyle = '#FF8C42';
  ctx.lineWidth = 2.5;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  dailyData.forEach((d, i) => {
    const x = padding.left + chartW * i / (dailyData.length - 1);
    const y = padding.top + chartH * (1 - d.count / maxVal);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();

  // 填充区域
  ctx.lineTo(padding.left + chartW, padding.top + chartH);
  ctx.lineTo(padding.left, padding.top + chartH);
  ctx.closePath();
  ctx.fillStyle = 'rgba(255, 140, 66, 0.15)';
  ctx.fill();

  // 数据点
  dailyData.forEach((d, i) => {
    const x = padding.left + chartW * i / (dailyData.length - 1);
    const y = padding.top + chartH * (1 - d.count / maxVal);
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, Math.PI * 2);
    ctx.fillStyle = '#FF8C42';
    ctx.fill();
  });

  // X轴标签（每隔5天）
  ctx.fillStyle = '#999';
  ctx.font = '10px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  for (let i = 0; i < dailyData.length; i += 5) {
    const x = padding.left + chartW * i / (dailyData.length - 1);
    ctx.fillText(dailyData[i].day + '日', x, padding.top + chartH + 5);
  }
}

// 能力发展进度（完全基于阅读记录计算）
function renderAbilityProgress() {
  const persona = Storage.get('userPersona', {});
  const counts = persona.abilityCounts || {};
  
  // 5大核心能力（基于绘本数据库的能力维度）
  const abilities = [
    { key: 'language', name: '语言', icon: '🗣️', tags: ['语言表达', '语言'] },
    { key: 'science', name: '科学', icon: '🔬', tags: ['自然认知', '科学思维', '科学'] },
    { key: 'social', name: '社交', icon: '🤝', tags: ['社交能力', '社交'] },
    { key: 'emotion', name: '情绪', icon: '💖', tags: ['情绪认知', '情商'] },
    { key: 'art', name: '艺术', icon: '🎨', tags: ['艺术美育', '艺术'] }
  ];

  // 完全从阅读记录计算能力值
  // 计算逻辑：基于该能力在所有记录中出现的次数
  const totalRecords = persona.recordCount || 0;
  const hasData = totalRecords > 0 && Object.keys(counts).length > 0;

  if (!hasData) {
    // 无数据时显示"待评估"
    const container = document.getElementById('ability-progress-list');
    container.innerHTML = abilities.map(ab => `
      <div class="ability-progress">
        <div class="ability-progress-header">
          <span class="ability-progress-name">${ab.icon} ${ab.name}</span>
          <span class="ability-progress-value" style="color: var(--text-light);">待评估</span>
        </div>
        <div class="progress-bar">
          <div class="progress-fill" style="width: 0%; background: var(--text-light);"></div>
        </div>
      </div>
    `).join('');
    return;
  }

  // 计算每个能力的实际百分比
  const abilityData = {};
  abilities.forEach(ab => {
    // 累加所有相关标签的次数
    let count = 0;
    ab.tags.forEach(tag => {
      count += counts[tag] || 0;
    });
    
    // 计算百分比：基于该能力在总能力标签中的占比
    // 基准值30%（即使只读1本书也有30%），每多一次相关阅读+5%，最高95%
    const baseValue = 30;
    const maxValue = 95;
    const increment = 5;
    
    if (count > 0) {
      abilityData[ab.key] = Math.min(maxValue, baseValue + count * increment);
    } else {
      abilityData[ab.key] = baseValue;
    }
  });

  // 计算能力排名，判断优势和待提升
  const sortedByValue = Object.entries(abilityData)
    .sort((a, b) => b[1] - a[1])
    .map(([key]) => key);
  
  const top2Keys = sortedByValue.slice(0, 2);
  const bottom2Keys = sortedByValue.slice(-2);

  const STRONG_THRESHOLD = 70;
  const WEAK_THRESHOLD = 50;

  const container = document.getElementById('ability-progress-list');
  container.innerHTML = abilities.map(ab => {
    const val = Math.round(abilityData[ab.key]);
    
    // 判断是否是优势或待提升
    let tagClass = '';
    let tagText = '';
    
    const isTop2 = top2Keys.includes(ab.key);
    const isBottom2 = bottom2Keys.includes(ab.key);
    
    if (isTop2 && val >= STRONG_THRESHOLD) {
      tagClass = 'strong';
      tagText = '<span class="ability-tag strong">优势</span>';
    } else if (isBottom2 && val < WEAK_THRESHOLD) {
      tagClass = 'weak';
      tagText = '<span class="ability-tag weak">待提升</span>';
    }

    return `
      <div class="ability-progress">
        <div class="ability-progress-header">
          <span class="ability-progress-name">${ab.icon} ${ab.name} ${tagText}</span>
          <span class="ability-progress-value">${val}%</span>
        </div>
        <div class="progress-bar">
          <div class="progress-fill ${tagClass}" style="width: ${val}%;"></div>
        </div>
      </div>
    `;
  }).join('');
}

// ============ 周/月分析报告 ============
function getPeriodRecords(period) {
  const records = Storage.get('readingRecords', []);
  const today = new Date();
  const startDate = new Date(today);
  startDate.setHours(0, 0, 0, 0);

  if (period === 'week') {
    startDate.setDate(today.getDate() - 6);
  } else {
    startDate.setDate(today.getDate() - 29);
  }

  const startStr = formatDate(startDate);
  return records.filter(r => r.date >= startStr);
}

function analyzeAttention(highlights) {
  let fullFocus = 0;
  let mostFocus = 0;
  let fluctuated = 0;
  let lowFocus = 0;

  highlights.forEach(h => {
    if (h.includes('超投入') || h.includes('非常投入') || h.includes('全程')) fullFocus++;
    else if (h.includes('不太投入') || h.includes('明显不想') || h.includes('敷衍')) lowFocus++;
    else if (h.includes('很投入') || h.includes('比较投入') || h.includes('注意力很好')) mostFocus++;
    else if (h.includes('不太') || h.includes('分心') || h.includes('波动') || h.includes('时好时坏')) fluctuated++;
    else mostFocus++;
  });

  return { fullFocus, mostFocus, fluctuated, lowFocus, total: highlights.length };
}

function findHighlights(records, count = 3) {
  const highlightTemplates = [
    {
      what: '孩子主动提问的次数增加了',
      meaning: '这说明孩子的好奇心和思考能力在发展，开始对故事内容产生自己的疑问。'
    },
    {
      what: '出现了"互动片段"式的深度参与',
      meaning: '从被动听故事到主动参与角色扮演/游戏，是阅读参与度提升的重要信号。'
    },
    {
      what: '认字问字的行为越来越多',
      meaning: '文字意识开始萌芽——孩子发现书上的符号和说话有关系，这是阅读准备的起点。'
    },
    {
      what: '能预测故事情节的发展',
      meaning: '说明孩子开始理解故事逻辑，不是只看单张图，而是能串联起前后内容了。'
    },
    {
      what: '会用自己的话复述片段',
      meaning: '语言表达和记忆能力都在发展，能把听到的内容内化为自己的语言。'
    },
    {
      what: '把故事和自己的生活联系起来',
      meaning: '这是高级思维能力的体现——孩子开始把书本知识迁移到真实生活中。'
    },
    {
      what: '注意力持续时间变长了',
      meaning: '专注力是可以锻炼的，持续的亲子共读正在帮助孩子延长注意力周期。'
    },
    {
      what: '主动要求读同一本书',
      meaning: '重复阅读是这个年龄段很正常的学习方式，孩子在用"反复"来消化和巩固理解。'
    }
  ];

  const shuffled = highlightTemplates.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

function generateAnalysisReport(period) {
  const records = getPeriodRecords(period);
  const profile = Storage.get('childProfile', {});
  const nickname = profile.nickname || '宝贝';
  const ageRange = profile.ageRange || '4-5';

  if (records.length === 0) {
    return `
      <div class="analysis-section">
        <div class="analysis-section-title">📊 数据总览</div>
        <div style="font-size:13px;color:var(--text-secondary);text-align:center;padding:20px 0;">
          暂无${period === 'week' ? '本周' : '本月'}阅读记录
        </div>
      </div>
    `;
  }

  const totalDays = new Set(records.map(r => r.date)).size;
  const totalBooks = new Set(records.map(r => r.bookTitle)).size;
  const totalMinutes = records.reduce((sum, r) => sum + (r.duration || 0), 0);
  const highlights = records.map(r => r.interactionHighlights || '');
  const attention = analyzeAttention(highlights);
  const topHighlights = findHighlights(records, Math.min(3, records.length));

  let html = '';

  html += `
    <div class="analysis-section">
      <div class="analysis-section-title">📊 ${period === 'week' ? '本周' : '本月'}数据总览</div>
      <div class="analysis-data-row"><span>共读天数</span><span style="font-weight:600;color:var(--primary);">${totalDays} 天</span></div>
      <div class="analysis-data-row"><span>绘本数量</span><span style="font-weight:600;color:var(--primary);">${totalBooks} 本</span></div>
      <div class="analysis-data-row"><span>总时长</span><span style="font-weight:600;color:var(--primary);">约 ${totalMinutes} 分钟</span></div>
      <div class="analysis-data-row"><span>阅读投入程度</span>
        <span>
          <span class="analysis-tag green">非常投入${attention.fullFocus}次</span>
          <span class="analysis-tag orange">比较投入${attention.mostFocus}次</span>
          <span class="analysis-tag purple">一般投入${attention.fluctuated}次</span>
          <span class="analysis-tag red">不太投入${attention.lowFocus}次</span>
        </span>
      </div>
    </div>
  `;

  html += `<div class="analysis-section"><div class="analysis-section-title">⭐ ${Math.min(3, records.length)}个亮点</div>`;
  topHighlights.forEach(h => {
    html += `
      <div class="analysis-highlight">
        <div class="what">✓ ${h.what}</div>
        <div class="meaning">💡 ${h.meaning}</div>
      </div>
    `;
  });
  html += `</div>`;

  const bookCounts = {};
  records.forEach(r => {
    bookCounts[r.bookTitle] = (bookCounts[r.bookTitle] || 0) + 1;
  });
  const topBook = Object.entries(bookCounts).sort((a, b) => b[1] - a[1])[0];
  const hasRepetitiveReading = topBook && topBook[1] >= 2;

  const interestPattern = records.some(r =>
    r.interactionHighlights && r.interactionHighlights.includes('互动片段')
  );

  html += `<div class="analysis-section"><div class="analysis-section-title">🔍 核心发现</div>`;

  if (records.length < 3 && period === 'week') {
    html += `
      <div class="analysis-finding">
        📝 本周记录较少（${records.length}天），数据不够做趋势判断。继续坚持记录，下周就能看到更清晰的发展规律啦～
      </div>
    `;
  } else {
    let findingText = '';
    if (hasRepetitiveReading) {
      findingText = `${nickname}对《${topBook[0]}》特别感兴趣，读了${topBook[1]}次。<br><br>💡 这是深度阅读的信号，不是"喜新厌旧"有问题。这个年龄段的孩子会通过反复阅读来消化和巩固理解，就像大人反复听一首歌一样。每次重读，孩子都会发现新的细节。<br><br>👉 待继续观察：这种深度阅读会持续多久？是否会自然过渡到新书？`;
    } else if (interestPattern) {
      findingText = `${nickname}的阅读参与度很高，多本绘本都出现了"互动片段"式的深度参与（角色扮演、游戏化阅读等）。<br><br>💡 这说明孩子已经不满足于"听"，而是想要"玩"故事。这是从被动接受到主动参与的重要转变，想象力和创造力都在发展。<br><br>👉 可以多提供能让孩子参与进来的互动类绘本。`;
    } else {
      findingText = `${nickname}的阅读兴趣比较广泛，${totalBooks}本书涉及不同主题。<br><br>💡 广泛接触不同类型的绘本对开阔视野很有帮助。同时注意观察：有没有哪一类书让${nickname}明显更投入、互动更多？<br><br>👉 待继续观察：兴趣点是否会逐渐集中？`;
    }
    html += `<div class="analysis-finding">${findingText}</div>`;
  }
  html += `</div>`;

  html += `<div class="analysis-section"><div class="analysis-section-title">💡 ${period === 'week' ? '下周' : '下月'}建议</div>`;

  const suggestions = [];

  if (attention.fluctuated > attention.fullFocus) {
    suggestions.push({
      type: '给孩子的发展支持',
      text: `观察到${nickname}注意力时有波动，可以试试用"分段读"的方式——每读2-3页就停下来聊一聊，因为这个年龄段孩子的注意力大约是${ageRange === '3-4' ? '8-12' : ageRange === '4-5' ? '12-18' : '15-25'}分钟，超过了就需要中场休息。`
    });
  } else {
    suggestions.push({
      type: '给孩子的发展支持',
      text: `观察到${nickname}${attention.fullFocus}次全程投入，注意力基础很好，可以试试在阅读后留一个小问题让孩子思考，比如"你觉得接下来会发生什么"，慢慢锻炼预测和推理能力。`
    });
  }

  const questionPattern = records.some(r =>
    r.interactionHighlights && (r.interactionHighlights.includes('问') || r.interactionHighlights.includes('提问'))
  );

  if (questionPattern) {
    suggestions.push({
      type: '给父母的互动优化',
      text: '当孩子问"为什么"时，试试先反问"你觉得呢"，而不是直接给答案。这样能引导孩子自己思考，而不是被动接收信息。'
    });
  } else {
    suggestions.push({
      type: '给父母的互动优化',
      text: '当读到有趣的画面时，试试停下来问"你看到了什么"，而不是继续往下读。给孩子留出表达的空间，哪怕只说一两个词也好。'
    });
  }

  suggestions.forEach(s => {
    html += `
      <div class="analysis-suggestion">
        <div class="type">${s.type}</div>
        <div>${s.text}</div>
      </div>
    `;
  });

  html += `</div>`;

  html += `
    <div class="analysis-section">
      <div class="analysis-section-title">📚 选书参考</div>
      <div class="analysis-book-ref">
        基于${nickname}${hasRepetitiveReading ? `对《${topBook[0]}》的深度兴趣` : '广泛的阅读偏好'}和${ageRange}岁的发展阶段，建议试试：<br>
        <span class="analysis-tag orange">互动类绘本</span>
        <span class="analysis-tag green">预测类绘本</span>
        <span class="analysis-tag blue">翻翻/立体书</span>
      </div>
    </div>
  `;

  return html;
}

let aiAnalysisLoading = false;

function renderAnalysisReport() {
  const container = document.getElementById('analysis-report');
  const titleEl = document.getElementById('analysis-report-title');
  titleEl.textContent = currentReportPeriod === 'week' ? '📝 周分析报告' : '📝 月分析报告';
  
  container.innerHTML = generateAnalysisReport(currentReportPeriod);
  
  aiAnalysisLoading = true;
  const records = Storage.get('readingRecords', []);
  const profile = Storage.get('childProfile', {});
  const periodType = currentReportPeriod;
  
  // 获取周期内的记录
  const periodRecords = getPeriodRecords(periodType);
  
  // 延迟加载 AI 分析（先显示报告主体）
  setTimeout(async () => {
    if (!aiAnalysisLoading) return;
    
    let aiAnalysis = null;
    let isFallback = false;
    
    // 1. 尝试从缓存获取
    const cached = getAIAnalysisCache(periodType);
    if (cached) {
      aiAnalysis = cached;
      console.log('📦 使用 AI 分析缓存');
    }
    
    // 2. 缓存不存在或过期，调用 API
    if (!aiAnalysis) {
      console.log('🤖 调用 Kimi API 生成 AI 分析...');
      try {
        aiAnalysis = await kimiAnalyzeReading(periodRecords, profile);
        if (aiAnalysis) {
          // 保存到缓存
          saveAIAnalysisCache(periodType, aiAnalysis);
          console.log('💾 AI 分析已缓存');
        }
      } catch (e) {
        console.error('Kimi API 调用失败:', e);
      }
    }
    
    // 3. API 失败，使用降级策略
    if (!aiAnalysis) {
      console.log('📝 使用本地规则生成降级分析');
      aiAnalysis = generateFallbackAnalysis(periodRecords, periodType);
      isFallback = true;
    }
    
    if (aiAnalysis && aiAnalysisLoading) {
      const dataSection = container.querySelector('.analysis-section');
      if (dataSection) {
        const aiSection = document.createElement('div');
        aiSection.className = 'analysis-section';
        aiSection.innerHTML = `
          <div class="analysis-section-title" style="display:flex;align-items:center;gap:6px;">
            <span>✨ AI智能解读</span>
            <span style="font-size:10px;background:${isFallback ? '#FFF3E0;color:#E65100' : '#E8F5E9;color:#2E7D32'};padding:2px 6px;border-radius:4px;font-weight:400;">${isFallback ? '基于阅读数据' : 'AI 生成'}</span>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
            <div style="background:linear-gradient(135deg,#FFF3E0,#FFE0B2);padding:10px 12px;border-radius:8px;">
              <div style="font-size:12px;color:#E65100;font-weight:600;margin-bottom:4px;">📚 阅读偏好</div>
              <div style="font-size:12px;line-height:1.5;color:#5D4037;" class="ai-text" data-text="${aiAnalysis.preference || ''}"></div>
            </div>
            <div style="background:linear-gradient(135deg,#E8F5E9,#C8E6C9);padding:10px 12px;border-radius:8px;">
              <div style="font-size:12px;color:#2E7D32;font-weight:600;margin-bottom:4px;">🌟 能力发展</div>
              <div style="font-size:12px;line-height:1.5;color:#1B5E20;" class="ai-text" data-text="${aiAnalysis.ability || ''}"></div>
            </div>
            <div style="background:linear-gradient(135deg,#E3F2FD,#BBDEFB);padding:10px 12px;border-radius:8px;">
              <div style="font-size:12px;color:#1565C0;font-weight:600;margin-bottom:4px;">💡 阅读建议</div>
              <div style="font-size:12px;line-height:1.5;color:#0D47A1;" class="ai-text" data-text="${aiAnalysis.suggestion || ''}"></div>
            </div>
            <div style="background:linear-gradient(135deg,#FCE4EC,#F8BBD0);padding:10px 12px;border-radius:8px;">
              <div style="font-size:12px;color:#C2185B;font-weight:600;margin-bottom:4px;">🚀 拓展推荐</div>
              <div style="font-size:12px;line-height:1.5;color:#880E4F;" class="ai-text" data-text="${aiAnalysis.expand || ''}"></div>
            </div>
          </div>
        `;
        dataSection.after(aiSection);
        
        // 打字机效果
        const aiTexts = aiSection.querySelectorAll('.ai-text');
        aiTexts.forEach((el, index) => {
          const text = el.dataset.text;
          el.textContent = '';
          setTimeout(() => typeWriter(el, text, 0), index * 200);
        });
      }
    }
    aiAnalysisLoading = false;
  }, 300);
}

// 打字机效果
function typeWriter(element, text, index) {
  if (index < text.length && element.dataset.text === text) {
    element.textContent += text.charAt(index);
    setTimeout(() => typeWriter(element, text, index + 1), 30);
  }
}

// AI 阅读建议
function renderSuggestions() {
  const persona = Storage.get('userPersona', {});
  const suggestions = [];
  const profile = Storage.get('childProfile', {});
  const nickname = profile.nickname || '宝贝';

  // 兴趣相关建议
  const topInterest = Object.entries(persona.interestProfile || {})
    .sort((a, b) => b[1] - a[1])[0];

  if (topInterest) {
    const interest = topInterest[0];
    let nextTopic = '太空探索';
    if (interest === '恐龙') nextTopic = '古生物';
    if (interest === '动物') nextTopic = '海洋生物';
    if (interest === '自然') nextTopic = '四季变化';
    if (interest === '情绪认知') nextTopic = '社交礼仪';
    if (interest === '亲情') nextTopic = '友情';

    suggestions.push({
      icon: '🌟',
      text: `这个月${nickname}最爱的主题是${interest}，建议接下来尝试${nextTopic}类绘本拓展视野`,
      category: 'science'
    });
  }

  // 薄弱项建议
  (persona.weakAbilities || []).forEach(weak => {
    let book = '《我的情绪小怪兽》';
    let cat = 'emotion';
    if (weak.includes('社交')) { book = '《彩虹鱼》'; cat = 'social'; }
    if (weak.includes('科学')) { book = '《小种子》'; cat = 'science'; }
    if (weak.includes('语言')) { book = '《棕色的熊》'; cat = 'language'; }

    suggestions.push({
      icon: '💡',
      text: `${nickname}在${weak}方面阅读较少，推荐尝试${book}系列`,
      category: cat
    });
  });

  // 阅读习惯建议
  if (persona.streakDays < 3) {
    suggestions.push({
      icon: '⏰',
      text: '建议每天固定时间读绘本，比如睡前15分钟，帮助孩子养成阅读习惯',
      category: 'today'
    });
  }

  // 适龄建议
  suggestions.push({
    icon: '📈',
    text: `根据${nickname}的阅读水平，接下来可以尝试文字稍多的故事绘本，提升理解能力`,
    category: 'language'
  });

  const container = document.getElementById('suggestion-list');
  container.innerHTML = suggestions.slice(0, 5).map(s => `
    <div class="suggestion-card">
      <div class="text"><span class="icon">${s.icon}</span>${s.text}</div>
      <div class="action" onclick="goToCategory('${s.category}')">→ 查看推荐绘本</div>
    </div>
  `).join('');
}

function goToCategory(categoryId) {
  currentCategory = categoryId;
  switchPage('home');
}

// ============ 分享卡片生成 ============
function generateShareCard() {
  const profile = Storage.get('childProfile', {});
  const persona = Storage.get('userPersona', {});
  const records = Storage.get('readingRecords', []);
  
  const nickname = profile.nickname || '小橙子';
  const avatar = profile.avatar || '🧒';
  
  // 获取本周/本月数据
  const period = currentReportPeriod || 'week';
  const periodRecords = getPeriodRecords(period);
  
  const bookCount = periodRecords.length;
  const totalMinutes = periodRecords.reduce((sum, r) => sum + (r.duration || 0), 0);
  const uniqueDays = [...new Set(periodRecords.map(r => r.date))].length;
  
  // 分析亮点
  const highlights = findHighlights(periodRecords);
  const topHighlight = highlights.length > 0 ? highlights[0] : null;
  
  // 获取阅读投入程度统计
  const interactionTexts = periodRecords.map(r => r.interactionHighlights || '');
  const attentionStats = analyzeAttention(interactionTexts);
  const highEngagement = attentionStats.fullFocus;
  
  // 创建分享卡片 Canvas
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  // 卡片尺寸
  const cardWidth = 600;
  const cardHeight = 850;
  canvas.width = cardWidth;
  canvas.height = cardHeight;
  
  // 渐变背景
  const gradient = ctx.createLinearGradient(0, 0, cardWidth, cardHeight);
  gradient.addColorStop(0, '#FF8C42');
  gradient.addColorStop(1, '#FFB07A');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, cardWidth, cardHeight);
  
  // 顶部圆角白色区域
  ctx.fillStyle = '#FFFBF5';
  ctx.beginPath();
  ctx.moveTo(0, 30);
  ctx.lineTo(30, 0);
  ctx.lineTo(cardWidth - 30, 0);
  ctx.lineTo(cardWidth, 30);
  ctx.lineTo(cardWidth, cardHeight);
  ctx.lineTo(0, cardHeight);
  ctx.closePath();
  ctx.fill();
  
  // 标题
  ctx.fillStyle = '#FF8C42';
  ctx.font = 'bold 28px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('📚 童书伴读', cardWidth / 2, 50);
  
  // 分割线
  ctx.strokeStyle = '#F0E6D8';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(40, 70);
  ctx.lineTo(cardWidth - 40, 70);
  ctx.stroke();
  
  // 宝贝信息
  ctx.fillStyle = '#FF8C42';
  ctx.font = 'bold 40px sans-serif';
  ctx.fillText(avatar, cardWidth / 2, 135);
  
  ctx.fillStyle = '#333';
  ctx.font = 'bold 24px sans-serif';
  ctx.fillText(`${nickname}的阅读时光`, cardWidth / 2, 180);
  
  ctx.font = '14px sans-serif';
  ctx.fillStyle = '#888';
  const periodText = period === 'week' ? '本周' : '本月';
  ctx.fillText(`${periodText}阅读回顾 · ${new Date().toLocaleDateString('zh-CN', {month:'long', day:'numeric'})}`, cardWidth / 2, 205);
  
  // 数据卡片区域
  const cardY = 235;
  const cardH = 130;
  const cardW = (cardWidth - 60) / 3;
  const cardRadius = 12;
  
  // 绘制圆角矩形函数
  function drawRoundedRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }
  
  // 数据卡片1：共读天数
  ctx.fillStyle = '#FFF3E0';
  drawRoundedRect(30, cardY, cardW, cardH, cardRadius);
  ctx.fill();
  ctx.fillStyle = '#FF8C42';
  ctx.font = 'bold 32px sans-serif';
  ctx.fillText('📅', cardWidth / 6, cardY + 40);
  ctx.font = 'bold 30px sans-serif';
  ctx.fillText(`${uniqueDays}`, cardWidth / 6, cardY + 80);
  ctx.font = '14px sans-serif';
  ctx.fillStyle = '#666';
  ctx.fillText('共读天数', cardWidth / 6, cardY + 110);
  
  // 数据卡片2：绘本数量
  ctx.fillStyle = '#E8F5E9';
  drawRoundedRect(30 + cardW + 5, cardY, cardW, cardH, cardRadius);
  ctx.fill();
  ctx.fillStyle = '#7BC67E';
  ctx.font = 'bold 32px sans-serif';
  ctx.fillText('📚', cardWidth / 2, cardY + 40);
  ctx.font = 'bold 30px sans-serif';
  ctx.fillText(`${bookCount}`, cardWidth / 2, cardY + 80);
  ctx.font = '14px sans-serif';
  ctx.fillStyle = '#666';
  ctx.fillText('绘本数量', cardWidth / 2, cardY + 110);
  
  // 数据卡片3：阅读时长
  ctx.fillStyle = '#E3F2FD';
  drawRoundedRect(30 + cardW * 2 + 10, cardY, cardW, cardH, cardRadius);
  ctx.fill();
  ctx.fillStyle = '#5DADE2';
  ctx.font = 'bold 32px sans-serif';
  ctx.fillText('⏱️', cardWidth * 5 / 6, cardY + 40);
  const hours = Math.round(totalMinutes / 60 * 10) / 10;
  ctx.font = 'bold 30px sans-serif';
  ctx.fillText(hours >= 1 ? `${hours}h` : `${totalMinutes}m`, cardWidth * 5 / 6, cardY + 80);
  ctx.font = '14px sans-serif';
  ctx.fillStyle = '#666';
  ctx.fillText('总阅读时长', cardWidth * 5 / 6, cardY + 110);
  
  // 亮点和优点区域
  const highlightY = cardY + cardH + 30;
  
  if (topHighlight) {
    ctx.fillStyle = '#FF8C42';
    ctx.font = 'bold 18px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('🌟 本期亮点', 30, highlightY);
    
    // 亮点卡片
    ctx.fillStyle = '#FFF8E1';
    drawRoundedRect(30, highlightY + 10, cardWidth - 60, 80, 12);
    ctx.fill();
    
    ctx.fillStyle = '#333';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText(topHighlight.what, 45, highlightY + 40);
    
    ctx.fillStyle = '#666';
    ctx.font = '14px sans-serif';
    // 文本换行
    const lines = wrapText(ctx, topHighlight.meaning, cardWidth - 90);
    lines.forEach((line, i) => {
      ctx.fillText(line, 45, highlightY + 65 + i * 18);
    });
  }
  
  // 高光时刻区域
  const highlight2Y = highlightY + (topHighlight ? 110 : 0);
  
  ctx.fillStyle = '#FF8C42';
  ctx.font = 'bold 18px sans-serif';
  ctx.fillText('💪 投入时刻', 30, highlight2Y + 20);
  
  // 投入程度展示
  ctx.fillStyle = '#E8F5E9';
  drawRoundedRect(30, highlight2Y + 30, cardWidth - 60, 60, 12);
  ctx.fill();
  
  ctx.fillStyle = '#2E7D32';
  ctx.font = 'bold 24px sans-serif';
  ctx.fillText('🌟', 50, highlight2Y + 70);
  ctx.font = 'bold 18px sans-serif';
  ctx.fillStyle = '#333';
  ctx.fillText(`${highEngagement}次`, 85, highlight2Y + 70);
  
  ctx.fillStyle = '#666';
  ctx.font = '14px sans-serif';
  ctx.fillText('非常投入的阅读时光', 145, highlight2Y + 70);
  
  // 父母骄傲区域
  const parentY = highlight2Y + 110;
  
  ctx.fillStyle = '#FF8C42';
  ctx.font = 'bold 18px sans-serif';
  ctx.fillText('👨‍👩‍👧 我们的骄傲', 30, parentY + 20);
  
  // 父母心得卡片
  ctx.fillStyle = '#FCE4EC';
  drawRoundedRect(30, parentY + 30, cardWidth - 60, 100, 12);
  ctx.fill();
  
  ctx.fillStyle = '#C2185B';
  ctx.font = 'bold 16px sans-serif';
  ctx.fillText('💝 陪伴的温暖', 45, parentY + 58);
  
  ctx.fillStyle = '#333';
  ctx.font = '14px sans-serif';
  const parentText = highEngagement > 0 
    ? `看到${nickname}这么投入地阅读，真的很欣慰。坚持亲子共读，让我们一起见证成长！`
    : `每一次陪伴都是珍贵的时光。和${nickname}一起阅读，是最幸福的时刻。继续加油！`;
  
  const parentLines = wrapText(ctx, parentText, cardWidth - 90);
  parentLines.forEach((line, i) => {
    ctx.fillText(line, 45, parentY + 85 + i * 18);
  });
  
  // 二维码区域
  const qrY = parentY + 150;
  
  if (typeof qrcode !== 'undefined') {
    const qr = qrcode(0, 'M');
    qr.addData('https://tongshu.app/share');
    qr.make();
    
    const qrSize = 80;
    const qrX = (cardWidth - qrSize) / 2;
    
    // 二维码背景
    ctx.fillStyle = '#FFF';
    drawRoundedRect(qrX - 10, qrY - 5, qrSize + 20, qrSize + 30, 8);
    ctx.fill();
    
    // 绘制二维码
    const cellSize = qrSize / qr.getModuleCount();
    for (let row = 0; row < qr.getModuleCount(); row++) {
      for (let col = 0; col < qr.getModuleCount(); col++) {
        if (qr.isDark(row, col)) {
          ctx.fillStyle = '#FF8C42';
          ctx.fillRect(qrX + col * cellSize, qrY + row * cellSize, cellSize, cellSize);
        }
      }
    }
    
    ctx.fillStyle = '#666';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('微信扫码，一起记录阅读时光', cardWidth / 2, qrY + qrSize + 18);
  }
  
  // 底部标签
  ctx.fillStyle = '#999';
  ctx.font = '12px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('✨ 童书伴读 | 伴读让父母更懂孩子，童书让孩子更懂世界 ✨', cardWidth / 2, cardHeight - 20);
  
  // 显示预览
  showSharePreview(canvas, nickname);
}

// 文本换行辅助函数
function wrapText(ctx, text, maxWidth) {
  const words = text.split('');
  const lines = [];
  let currentLine = '';
  
  for (let i = 0; i < words.length; i++) {
    const char = words[i];
    const testLine = currentLine + char;
    const metrics = ctx.measureText(testLine);
    
    if (metrics.width > maxWidth && currentLine.length > 0) {
      lines.push(currentLine);
      currentLine = char;
    } else {
      currentLine = testLine;
    }
  }
  
  if (currentLine.length > 0) {
    lines.push(currentLine);
  }
  
  return lines.slice(0, 3); // 最多3行
}

// 显示分享预览
function showSharePreview(canvas, nickname) {
  const previewHTML = `
    <div class="modal-overlay" id="share-preview-modal" style="z-index: 3000;">
      <div class="modal" style="width: 90%; max-width: 360px; text-align: center;">
        <div class="modal-title">📤 分享卡片</div>
        <div style="margin: 12px 0;">
          <img src="${canvas.toDataURL('image/png')}" style="width: 100%; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);" />
        </div>
        <div style="font-size:12px;color:var(--text-light);margin-bottom:12px;line-height:1.5;">
          💡 点击保存图片，打开微信即可分享给好友或朋友圈
        </div>
        <div style="display: flex; gap: 12px; margin-top: 8px;">
          <button class="btn btn-outline" style="flex: 1;" onclick="closeSharePreview()">关闭</button>
          <button class="btn btn-primary" style="flex: 1;" onclick="downloadShareCard('${nickname}')">📥 保存图片</button>
        </div>
      </div>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', previewHTML);
  document.getElementById('share-preview-modal').classList.add('show');
  
  document.getElementById('share-preview-modal').addEventListener('click', (e) => {
    if (e.target.id === 'share-preview-modal') {
      closeSharePreview();
    }
  });
}

// 关闭分享预览
function closeSharePreview() {
  const modal = document.getElementById('share-preview-modal');
  if (modal) {
    modal.classList.remove('show');
    setTimeout(() => modal.remove(), 300);
  }
}

// 下载分享卡片
function downloadShareCard(nickname) {
  const canvas = document.querySelector('#share-preview-modal canvas') || 
                document.querySelector('#share-preview-modal img');
  
  if (!canvas) {
    showToast('生成失败，请重试');
    return;
  }
  
  const link = document.createElement('a');
  link.download = `${nickname}_阅读成长报告_${new Date().toLocaleDateString().replace(/\//g, '-')}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
  
  showToast('✅ 分享卡片已保存');
  closeSharePreview();
}
