const app = {
  state: {
    role: null,
    currentElderId: 'e1',
    currentTrendRange: 'week',
    currentRecognition: null,
    currentMeal: '午餐',
  },

  // 模拟数据：菜品库
  foodDatabase: {
    '红烧肉': { calories: 470, protein: 18, fat: 42, sugar: 8, salt: 1.8, tags: ['高脂', '高糖'], icon: '🥩' },
    '糖醋排骨': { calories: 520, protein: 22, fat: 35, sugar: 18, salt: 1.5, tags: ['高糖', '高脂'], icon: '🍖' },
    '清蒸鱼': { calories: 180, protein: 28, fat: 6, sugar: 1, salt: 0.8, tags: ['高蛋白', '低脂'], icon: '🐟' },
    '白灼菜心': { calories: 60, protein: 3, fat: 1, sugar: 2, salt: 0.4, tags: ['低脂', '高纤维'], icon: '🥬' },
    '小米粥': { calories: 90, protein: 2, fat: 0.5, sugar: 1, salt: 0.1, tags: ['易消化', '低糖'], icon: '🥣' },
    '杂粮饭': { calories: 140, protein: 4, fat: 0.8, sugar: 0.5, salt: 0, tags: ['低GI', '高纤维'], icon: '🍚' },
    '宫保鸡丁': { calories: 320, protein: 24, fat: 18, sugar: 6, salt: 1.6, tags: ['中辣', '中盐'], icon: '🍗' },
    '西红柿炒蛋': { calories: 160, protein: 10, fat: 11, sugar: 4, salt: 0.9, tags: ['家常', '均衡'], icon: '🍅' },
  },

  // 模拟数据：禁忌规则
  forbiddenRules: {
    '糖尿病': { keywords: ['糖', '甜', '红烧', '糖醋'], message: '这道菜含糖量高，糖尿病患者建议少吃' },
    '高血压': { keywords: ['咸', '腌', '腊', '酱'], message: '这道菜含盐量高，高血压患者建议少吃' },
    '痛风': { keywords: ['海鲜', '内脏', '肉汤', '菌菇'], message: '这道菜嘌呤含量高，痛风患者建议少吃' },
    '高血脂': { keywords: ['肥', '炸', '红烧', '油'], message: '这道菜脂肪含量较高，高血脂患者建议少吃' },
  },

  // 模拟数据：老人和饮食记录
  elders: [
    {
      id: 'e1',
      name: '张爷爷',
      age: 72,
      avatar: '👴',
      diseases: ['糖尿病', '高血压'],
      inviteCode: '820491',
      boundFamily: [{ name: '张阿姨', relation: '女儿' }, { name: '张叔叔', relation: '儿子' }],
      today: {
        date: '2024年7月4日',
        meals: {
          '早餐': { time: '07:20', foods: [{ name: '小米粥', icon: '🥣' }, { name: '白灼菜心', icon: '🥬' }] },
          '午餐': { time: '12:05', foods: [{ name: '红烧肉', icon: '🥩' }, { name: '杂粮饭', icon: '🍚' }] },
          '晚餐': { time: '--:--', foods: [] }
        }
      },
      messages: [
        { author: '张阿姨', text: '爸爸，晚饭记得吃清淡点~', time: '12:30' },
        { author: '系统', text: '今日午餐检测到高糖菜品，请注意控制。', time: '12:06' }
      ],
      trends: {
        week: {
          labels: ['6/28', '6/29', '6/30', '7/1', '7/2', '7/3', '7/4'],
          calories: [1650, 1720, 1580, 1810, 1690, 1750, 1650],
          protein: [58, 62, 55, 68, 60, 64, 59],
          salt: [4.5, 5.2, 4.0, 6.1, 4.8, 5.5, 4.2],
          sugar: [22, 28, 18, 35, 24, 30, 26]
        },
        month: {
          labels: ['6/5', '6/10', '6/15', '6/20', '6/25', '7/1', '7/4'],
          calories: [1680, 1700, 1660, 1740, 1710, 1810, 1650],
          protein: [59, 61, 58, 63, 60, 68, 59],
          salt: [4.8, 5.0, 4.5, 5.5, 4.9, 6.1, 4.2],
          sugar: [24, 25, 22, 28, 25, 35, 26]
        }
      }
    },
    {
      id: 'e2',
      name: '李奶奶',
      age: 69,
      avatar: '👵',
      diseases: ['高血脂'],
      inviteCode: '635728',
      boundFamily: [{ name: '张阿姨', relation: '儿媳' }],
      today: {
        date: '2024年7月4日',
        meals: {
          '早餐': { time: '07:45', foods: [{ name: '杂粮饭', icon: '🍚' }, { name: '清蒸鱼', icon: '🐟' }] },
          '午餐': { time: '11:50', foods: [{ name: '白灼菜心', icon: '🥬' }, { name: '西红柿炒蛋', icon: '🍅' }] },
          '晚餐': { time: '--:--', foods: [] }
        }
      },
      messages: [
        { author: '张阿姨', text: '妈，今天吃得真健康，给您点赞！', time: '12:10' }
      ],
      trends: {
        week: {
          labels: ['6/28', '6/29', '6/30', '7/1', '7/2', '7/3', '7/4'],
          calories: [1500, 1480, 1520, 1490, 1510, 1470, 1460],
          protein: [55, 53, 56, 54, 55, 52, 58],
          salt: [3.8, 3.5, 4.0, 3.6, 3.9, 3.4, 3.2],
          sugar: [15, 14, 16, 15, 14, 13, 14]
        },
        month: {
          labels: ['6/5', '6/10', '6/15', '6/20', '6/25', '7/1', '7/4'],
          calories: [1520, 1500, 1510, 1490, 1500, 1490, 1460],
          protein: [54, 53, 55, 54, 55, 54, 58],
          salt: [3.9, 3.7, 3.8, 3.6, 3.8, 3.6, 3.2],
          sugar: [15, 15, 15, 14, 14, 15, 14]
        }
      }
    }
  ],

  init() {
    this.updateStatusBar();
    this.bindMealOptions();
    this.renderElderHome();
    this.renderElderMine();
    this.renderFamilyHome();
    this.renderFamilyMine();
    this.renderTrend();
  },

  updateStatusBar() {
    const now = new Date();
    const time = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
    document.getElementById('statusBar').innerHTML = `<span>${time}</span><span>膳养记</span><span>📶 🔋</span>`;
  },

  switchRole(role) {
    this.state.role = role;
    document.getElementById('roleSelect').classList.remove('active');
    document.querySelectorAll('.role-shell').forEach(el => el.style.display = 'none');
    document.getElementById(role + 'Shell').style.display = 'block';
    this.go(role, 'home');
    if (role === 'family') {
      this.renderFamilyHome();
    }
  },

  backToRole() {
    this.state.role = null;
    document.querySelectorAll('.view').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.role-shell').forEach(el => el.style.display = 'none');
    document.getElementById('roleSelect').classList.add('active');
  },

  go(role, page) {
    document.querySelectorAll(`#${role}Shell .view`).forEach(el => el.classList.remove('active'));
    document.getElementById(`${role}-${page}`).classList.add('active');

    // 更新 tab active 状态
    const activePage = page === 'detail' ? 'home' : page;
    document.querySelectorAll(`#${role}Shell .tab-item`).forEach(el => el.classList.remove('active'));
    document.querySelectorAll(`#${role}Shell .tab-item`).forEach(el => {
      const onclick = el.getAttribute('onclick') || '';
      if (onclick.includes(`'${activePage}'`)) el.classList.add('active');
    });

    if (role === 'elder' && page === 'home') this.renderElderHome();
    if (role === 'elder' && page === 'diet') this.renderElderDiet();
    if (role === 'elder' && page === 'mine') this.renderElderMine();
    if (role === 'family' && page === 'home') this.renderFamilyHome();
    if (role === 'family' && page === 'detail') this.renderFamilyDetail();
    if (role === 'family' && page === 'trend') this.renderTrend();
    if (role === 'family' && page === 'mine') this.renderFamilyMine();
  },

  getElder(id) {
    return this.elders.find(e => e.id === id) || this.elders[0];
  },

  getCurrentElder() {
    return this.getElder(this.state.currentElderId);
  },

  // 老人端首页
  renderElderHome() {
    const elder = this.getCurrentElder();
    document.getElementById('elderHomeDate').textContent = elder.today.date;

    const names = { '早餐': 'sun', '午餐': 'sun', '晚餐': 'moon' };
    const icons = { '早餐': '🌅', '午餐': '☀️', '晚餐': '🌙' };
    let html = '';
    for (const [meal, data] of Object.entries(elder.today.meals)) {
      const hasForbidden = data.foods.some(f => this.checkForbidden(f.name, elder.diseases).length > 0);
      const foodText = data.foods.length ? data.foods.map(f => f.name).join('、') : '尚未记录';
      html += `
        <div class="overview-card ${hasForbidden ? 'forbidden' : ''}">
          <div class="overview-icon">${icons[meal]}</div>
          <div class="overview-info">
            <div class="overview-meal">${meal} <span style="font-size:15px;color:#888;font-weight:400;">${data.time}</span></div>
            <div class="overview-food">${foodText}</div>
            ${hasForbidden ? '<div class="overview-tags"><span class="tag tag-red">⚠️ 含禁忌食材</span></div>' : ''}
          </div>
        </div>
      `;
    }
    document.getElementById('elderOverview').innerHTML = html;
  },

  // 拍照识别
  takePhoto() {
    this.simulateCapture();
  },

  pickFromAlbum() {
    this.simulateCapture();
  },

  simulateCapture() {
    const foods = Object.keys(this.foodDatabase);
    const randomFood = foods[Math.floor(Math.random() * foods.length)];
    const info = this.foodDatabase[randomFood];
    this.state.currentRecognition = { name: randomFood, ...info };

    this.go('elder', 'result');
    document.getElementById('resultImage').src = '';
    document.getElementById('recognizing').style.display = 'block';
    document.getElementById('resultCard').innerHTML = '';
    document.getElementById('warningBox').innerHTML = '';
    document.getElementById('nutritionCard').innerHTML = '';

    setTimeout(() => {
      document.getElementById('resultImage').src = `https://placehold.co/600x400/4CAF50/FFFFFF?text=${encodeURIComponent(info.icon + ' ' + randomFood)}`;
      document.getElementById('recognizing').style.display = 'none';
      this.renderResult();
    }, 1200);
  },

  renderResult() {
    const rec = this.state.currentRecognition;
    const elder = this.getCurrentElder();
    if (!rec) return;

    document.getElementById('resultCard').innerHTML = `
      <div class="result-dish">${rec.icon} ${rec.name}</div>
      <div class="result-confidence">AI 识别置信度 96.8%</div>
    `;

    const warnings = this.checkForbidden(rec.name, elder.diseases);
    const warningHtml = warnings.length
      ? `<div class="warning-icon">⚠️</div>
         <div class="warning-text">
           <div class="warning-title">禁忌提醒</div>
           <div class="warning-desc">${warnings.map(w => w.message).join('；')}</div>
         </div>`
      : `<div class="warning-icon">✅</div>
         <div class="warning-text">
           <div class="warning-title" style="color:#4CAF50;">适宜食用</div>
           <div class="warning-desc">根据您的慢病档案，这道菜适合您食用。</div>
         </div>`;
    document.getElementById('warningBox').innerHTML = warningHtml;

    document.getElementById('nutritionCard').innerHTML = `
      <div class="nutrition-title">🥗 营养成分（每100g）</div>
      <div class="nutrition-grid">
        <div class="nutrition-item"><div class="nutrition-value">${rec.calories}</div><div class="nutrition-label">千卡</div></div>
        <div class="nutrition-item"><div class="nutrition-value">${rec.protein}g</div><div class="nutrition-label">蛋白质</div></div>
        <div class="nutrition-item"><div class="nutrition-value">${rec.fat}g</div><div class="nutrition-label">脂肪</div></div>
        <div class="nutrition-item"><div class="nutrition-value">${rec.sugar}g</div><div class="nutrition-label">糖</div></div>
      </div>
    `;

    if (warnings.length) {
      this.showVoiceToast(warnings.map(w => w.message).join('；'));
    }
  },

  checkForbidden(foodName, diseases) {
    const warnings = [];
    for (const disease of diseases) {
      const rule = this.forbiddenRules[disease];
      if (rule && rule.keywords.some(k => foodName.includes(k))) {
        warnings.push({ disease, message: rule.message });
      }
    }
    return warnings;
  },

  showVoiceToast(text) {
    const toast = document.getElementById('voiceToast');
    document.getElementById('voiceText').textContent = text;
    toast.classList.add('show');
    if ('speechSynthesis' in window) {
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'zh-CN';
      u.rate = 0.85;
      window.speechSynthesis.speak(u);
    }
    setTimeout(() => {
      toast.classList.remove('show');
    }, 3500);
  },

  confirmRecord() {
    const rec = this.state.currentRecognition;
    if (!rec) return;
    const elder = this.getCurrentElder();
    const meal = this.state.currentMeal;
    elder.today.meals[meal].foods.push({ name: rec.name, icon: rec.icon });
    elder.today.meals[meal].time = this.getCurrentTime();

    // 触发异常预警给家属端
    const warnings = this.checkForbidden(rec.name, elder.diseases);
    if (warnings.length) {
      elder.messages.unshift({ author: '系统', text: `检测到${meal}有禁忌食材：${rec.name}，${warnings[0].message}`, time: this.getCurrentTime() });
    }

    alert(`已记录到${meal}：${rec.name}`);
    this.go('elder', 'home');
  },

  getCurrentTime() {
    const now = new Date();
    return now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
  },

  // 老人端今日饮食
  renderElderDiet() {
    const elder = this.getCurrentElder();
    document.getElementById('elderMealList').innerHTML = this.buildMealListHtml(elder);
  },

  buildMealListHtml(elder) {
    const icons = { '早餐': '🌅', '午餐': '☀️', '晚餐': '🌙' };
    let html = '';
    for (const [meal, data] of Object.entries(elder.today.meals)) {
      const hasForbidden = data.foods.some(f => this.checkForbidden(f.name, elder.diseases).length > 0);
      let foodsHtml = '';
      if (data.foods.length) {
        foodsHtml = data.foods.map(f => {
          const warnings = this.checkForbidden(f.name, elder.diseases);
          return `
            <div class="meal-food-item">
              <div class="meal-food-img" style="display:flex;align-items:center;justify-content:center;font-size:36px;background:#f5f5f5;">${f.icon}</div>
              <div class="meal-food-info">
                <div class="meal-food-name">${f.name}</div>
                <div class="meal-food-tags">
                  ${this.foodDatabase[f.name]?.tags.map(t => `<span class="tag tag-green">${t}</span>`).join('') || ''}
                  ${warnings.length ? `<span class="tag tag-red">禁忌</span>` : ''}
                </div>
                ${warnings.length ? `<div class="meal-warning">⚠️ ${warnings.map(w => w.message).join('；')}</div>` : ''}
              </div>
            </div>
          `;
        }).join('');
      } else {
        foodsHtml = `<div class="empty-state"><div class="empty-icon">🍽️</div>暂无记录</div>`;
      }
      html += `
        <div class="meal-card ${hasForbidden ? 'forbidden' : ''}">
          <div class="meal-header">
            <div class="meal-name">${icons[meal]} ${meal}</div>
            <div class="meal-time">${data.time}</div>
          </div>
          <div class="meal-body">${foodsHtml}</div>
        </div>
      `;
    }
    return html;
  },

  // 老人端我的
  renderElderMine() {
    const elder = this.getCurrentElder();
    document.getElementById('elderDiseaseTags').innerHTML = elder.diseases.map(d => `<span class="disease-tag">${d}</span>`).join('');
    document.getElementById('elderInviteCode').textContent = elder.inviteCode;
    document.getElementById('elderQrBox').innerHTML = '▣';
  },

  shareInvite() {
    const elder = this.getCurrentElder();
    alert(`邀请码 ${elder.inviteCode} 已复制，快发给家人吧！`);
  },

  bindMealOptions() {
    document.querySelectorAll('.meal-option').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.meal-option').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.state.currentMeal = btn.dataset.meal;
      });
    });
  },

  saveManual() {
    const name = document.getElementById('manualName').value.trim();
    if (!name) {
      alert('请输入菜品名称');
      return;
    }
    const elder = this.getCurrentElder();
    const meal = this.state.currentMeal;
    const icon = this.foodDatabase[name]?.icon || '🍽️';
    elder.today.meals[meal].foods.push({ name, icon });
    elder.today.meals[meal].time = this.getCurrentTime();
    document.getElementById('manualName').value = '';
    document.getElementById('manualNote').value = '';
    alert(`已手动记录到${meal}：${name}`);
    this.go('elder', 'home');
  },

  // 家属端首页
  renderFamilyHome() {
    const switchHtml = this.elders.map(e => `
      <div class="family-member-chip ${e.id === this.state.currentElderId ? 'active' : ''}" onclick="app.selectElder('${e.id}')">
        <span class="member-avatar">${e.avatar}</span>
        <span>${e.name}</span>
      </div>
    `).join('');
    document.getElementById('familySwitch').innerHTML = switchHtml;

    const elder = this.getCurrentElder();
    const hasWarning = Object.values(elder.today.meals).some(m => m.foods.some(f => this.checkForbidden(f.name, elder.diseases).length > 0));

    let mealsHtml = '';
    for (const [meal, data] of Object.entries(elder.today.meals)) {
      const foodText = data.foods.length ? data.foods.map(f => f.name).join('、') : '未记录';
      mealsHtml += `
        <div class="daily-meal">
          <div class="daily-meal-name">${meal}</div>
          <div class="daily-meal-food ${data.foods.length ? '' : 'empty'}">${foodText}</div>
        </div>
      `;
    }

    document.getElementById('familyHomeContent').innerHTML = `
      <div class="daily-card" onclick="app.go('family','detail')">
        <div class="daily-header">
          <div class="daily-name">${elder.avatar} ${elder.name} 的饮食日报</div>
          <div class="daily-status ${hasWarning ? 'warn' : 'normal'}">${hasWarning ? '⚠️ 异常' : '✅ 正常'}</div>
        </div>
        <div class="daily-meals">${mealsHtml}</div>
      </div>
      ${hasWarning ? `
        <div class="card" style="border:2px solid var(--danger);background:var(--danger-light);">
          <div class="card-title" style="color:var(--danger);">🚨 异常预警</div>
          <div style="font-size:17px;color:var(--text-primary);">检测到今日饮食触发了慢病禁忌规则，请查看详情并提醒长辈。</div>
        </div>
      ` : ''}
      <div class="card">
        <div class="card-title">💬 最新留言</div>
        ${elder.messages.slice(0, 2).map(m => `
          <div style="margin-bottom:10px;font-size:17px;"><strong>${m.author}：</strong>${m.text}</div>
        `).join('')}
      </div>
    `;
  },

  selectElder(id) {
    this.state.currentElderId = id;
    this.renderFamilyHome();
  },

  // 家属端日报详情
  renderFamilyDetail() {
    const elder = this.getCurrentElder();
    document.getElementById('familyDetailTitle').textContent = `${elder.name}的饮食日报`;

    // 汇总
    let totalCalories = 0, totalProtein = 0, totalSugar = 0, totalSalt = 0;
    for (const data of Object.values(elder.today.meals)) {
      for (const f of data.foods) {
        const info = this.foodDatabase[f.name] || {};
        totalCalories += info.calories || 0;
        totalProtein += info.protein || 0;
        totalSugar += info.sugar || 0;
        totalSalt += info.salt || 0;
      }
    }

    document.getElementById('dailySummary').innerHTML = `
      <div class="summary-row"><span class="summary-label">日期</span><span class="summary-value">${elder.today.date}</span></div>
      <div class="summary-row"><span class="summary-label">总热量</span><span class="summary-value">${totalCalories} 千卡</span></div>
      <div class="summary-row"><span class="summary-label">餐次完成</span><span class="summary-value">${Object.values(elder.today.meals).filter(m => m.foods.length).length}/3</span></div>
    `;

    document.getElementById('familyMealList').innerHTML = this.buildMealListHtml(elder);

    document.getElementById('nutritionSummary').innerHTML = `
      <div class="nutrition-progress">
        <div class="progress-label"><span>热量</span><span>${totalCalories}/2000 千卡</span></div>
        <div class="progress-bar"><div class="progress-fill" style="width:${Math.min(totalCalories/2000*100,100)}%;background:#4CAF50;"></div></div>
      </div>
      <div class="nutrition-progress">
        <div class="progress-label"><span>蛋白质</span><span>${totalProtein}/60 g</span></div>
        <div class="progress-bar"><div class="progress-fill" style="width:${Math.min(totalProtein/60*100,100)}%;background:#2196F3;"></div></div>
      </div>
      <div class="nutrition-progress">
        <div class="progress-label"><span>糖</span><span>${totalSugar.toFixed(1)}/50 g</span></div>
        <div class="progress-bar"><div class="progress-fill" style="width:${Math.min(totalSugar/50*100,100)}%;background:#FF9800;"></div></div>
      </div>
      <div class="nutrition-progress">
        <div class="progress-label"><span>盐</span><span>${totalSalt.toFixed(1)}/6 g</span></div>
        <div class="progress-bar"><div class="progress-fill" style="width:${Math.min(totalSalt/6*100,100)}%;background:#F44336;"></div></div>
      </div>
    `;

    this.renderMessages();
  },

  renderMessages() {
    const elder = this.getCurrentElder();
    document.getElementById('messageList').innerHTML = elder.messages.map(m => `
      <div class="message-item">
        <div class="message-author">${m.author}</div>
        <div class="message-text">${m.text}</div>
        <div class="message-time">${m.time}</div>
      </div>
    `).join('');
  },

  sendMessage() {
    const input = document.getElementById('messageInput');
    const text = input.value.trim();
    if (!text) return;
    const elder = this.getCurrentElder();
    elder.messages.unshift({ author: '张阿姨', text, time: this.getCurrentTime() });
    input.value = '';
    this.renderMessages();
  },

  // 家属端趋势
  switchTrend(range) {
    this.state.currentTrendRange = range;
    document.querySelectorAll('.trend-tab').forEach(t => t.classList.remove('active'));
    document.querySelector(`.trend-tab[data-range="${range}"]`).classList.add('active');
    this.renderTrend();
  },

  renderTrend() {
    const elder = this.getCurrentElder();
    document.getElementById('trendMember').innerHTML = `
      <div class="family-member-chip active" style="margin-bottom:16px;">
        <span class="member-avatar">${elder.avatar}</span>
        <span>${elder.name}</span>
      </div>
    `;

    const data = elder.trends[this.state.currentTrendRange];
    this.renderChart('calorieChart', data.labels, data.calories, '#4CAF50', 2200);
    this.renderChart('proteinChart', data.labels, data.protein, '#2196F3', 80);
    this.renderChart('saltSugarChart', data.labels, data.salt, '#F44336', 6, data.sugar, '#FF9800');

    const last = data.calories.length - 1;
    const prev = last - 1;
    const diff = data.calories[last] - data.calories[prev];
    const sugarHigh = data.sugar[last] > 25;
    document.getElementById('insightCard').innerHTML = `
      <div class="insight-title">💡 智能分析</div>
      <div class="insight-text">
        今日热量摄入 ${data.calories[last]} 千卡，较上日${diff >= 0 ? '增加' : '减少'} ${Math.abs(diff)} 千卡。<br/>
        ${sugarHigh ? '近几日糖分摄入偏高，建议减少甜食和红烧类菜品。' : '近日饮食结构较为均衡，请继续保持。'}
      </div>
    `;
  },

  renderChart(containerId, labels, values, color, max, values2, color2) {
    const container = document.getElementById(containerId);
    let html = '';
    for (let i = 0; i < labels.length; i++) {
      const h = Math.max((values[i] / max) * 140, 4);
      const bar2 = values2 ? `<div class="bar" style="height:${Math.max((values2[i]/50)*140,4)}px;background:${color2};margin-left:4px;"><span class="bar-value">${values2[i]}</span><span class="bar-label">${labels[i]}</span></div>` : '';
      html += `
        <div style="display:flex;align-items:flex-end;">
          <div class="bar" style="height:${h}px;background:${color};">
            <span class="bar-value">${values[i]}</span>
            <span class="bar-label">${labels[i]}</span>
          </div>
          ${bar2}
        </div>
      `;
    }
    container.innerHTML = html;
  },

  // 家属端我的
  renderFamilyMine() {
    const elder = this.getCurrentElder();
    document.getElementById('boundList').innerHTML = elder.boundFamily.map(f => `
      <div class="bound-item">
        <div class="avatar" style="width:48px;height:48px;font-size:24px;">👤</div>
        <div class="bound-info">
          <div class="bound-name">${f.name}</div>
          <div class="bound-relation">${f.relation}</div>
        </div>
        <button class="bound-btn">解绑</button>
      </div>
    `).join('');
  },

  addElder() {
    const code = prompt('请输入老人端的6位邀请码：');
    if (code) {
      const found = this.elders.find(e => e.inviteCode === code);
      if (found) {
        alert(`成功绑定：${found.name}`);
        this.renderFamilyMine();
      } else {
        alert('邀请码无效');
      }
    }
  }
};

window.app = app;

document.addEventListener('DOMContentLoaded', () => {
  app.init();
});
