function getContentText(content) {
  if (!content) return '';
  if (typeof content === 'string') return content;
  if (typeof content === 'object') {
    // 三餐搭配格式 - 合并显示为一张卡片，不重复
    if (content.breakfast || content.lunch || content.dinner) {
      var parts = [];
      // 标题（如果有）
      if (content.text) parts.push('<strong>' + content.text + '</strong>');
      // 三餐合并为一个区块
      parts.push('<div style="margin-top:4px;">');
      if (content.breakfast) parts.push('<div style="margin-bottom:2px;"><span style="color:#f59e0b;">&#127749;</span> ' + content.breakfast + '</div>');
      if (content.lunch) parts.push('<div style="margin-bottom:2px;"><span style="color:#f59e0b;">&#9728;&#65039;</span> ' + content.lunch + '</div>');
      if (content.dinner) parts.push('<div style="margin-bottom:2px;"><span style="color:#f59e0b;">&#127769;</span> ' + content.dinner + '</div>');
      parts.push('</div>');
      if (content.total_calories) parts.push('<small style="color:var(--text-secondary);">预估热量: ' + content.total_calories + 'kcal</small>');
      return parts.join('');
    }
    // 运动格式 - 增强显示运动时间和步骤
    if (content.exercise_name) {
      var exParts = [];
      if (content.period) exParts.push('<strong>' + content.period + '运动</strong>');
      if (content.exercise_name) exParts.push('<span style="font-weight:600;">' + content.exercise_name + '</span>');
      // 显示运动时间段（如 18:30-19:00）
      if (content.start_time && content.end_time) {
        exParts.push('<small style="color:var(--text-secondary);">&#128336; ' + content.start_time + ' - ' + content.end_time + '</small>');
      } else if (content.start_time) {
        exParts.push('<small style="color:var(--text-secondary);">&#128336; 开始: ' + content.start_time + '</small>');
      }
      if (content.text) exParts.push(content.text);
      if (content.duration) exParts.push('<small>时长: ' + content.duration + '分钟</small>');
      if (content.calories) exParts.push('<small>消耗: ' + content.calories + 'kcal</small>');
      // 步骤摘要
      if (content.steps && Array.isArray(content.steps) && content.steps.length > 0) {
        var stepsPreview = content.steps.slice(0, 3).map(function(s, i) {
          return (i + 1) + '. ' + s;
        }).join('；');
        if (content.steps.length > 3) {
          stepsPreview += '...等' + content.steps.length + '个步骤';
        }
        exParts.push('<small style="color:var(--text-secondary);">&#127919; ' + stepsPreview + '</small>');
      }
      return exParts.join('<br>');
    }
    if (content.text) return content.text;
    if (content.name) return content.name;
    try { return JSON.stringify(content); } catch (e) { return ''; }
  }
  return String(content);
}

const planPage = {
  plan: null,
  selectedDate: null,
  editingItemId: null,
  weekDates: [],

  async render() {
    const app = document.getElementById('app');

    app.innerHTML = `
      <div class="page">
        <div class="page-header">
          <h1>健康方案</h1>
          <div class="subtitle">你的专属养生计划</div>
        </div>
        <div id="plan-content">
          <div class="loading"><div class="loading-spinner"></div><div class="loading-text">加载中...</div></div>
        </div>
      </div>
    `;

    await this.loadPlan();
  },

  async loadPlan() {
    const container = document.getElementById('plan-content');
    if (!container) return;

    const isGuest = localStorage.getItem('guestMode');

    if (isGuest) {
      this.renderGuestPlan(container);
      return;
    }

    try {
      const result = await api.getCurrentPlan();
      if (result.code === 0 && result.data) {
        // 后端返回 { plans: [{date, items}] }, 转换为 { items: [{date, ...}], status }
        var backendPlans = result.data.plans || [];
        var allItems = [];
        backendPlans.forEach(function(p) {
          var planItems = p.items || [];
          planItems.forEach(function(item) {
            item.date = p.plan_date;
          });
          allItems = allItems.concat(planItems);
        });
        this.plan = {
          items: allItems,
          status: result.data.status || 'draft',
          startDate: backendPlans.length > 0 ? backendPlans[0].plan_date : new Date().toISOString().split('T')[0],
          endDate: backendPlans.length > 0 ? backendPlans[backendPlans.length-1].plan_date : new Date().toISOString().split('T')[0],
        };
        this.selectedDate = this.getSelectedDate();
        this.weekDates = this.getWeekDates();
        this.renderPlanView(container);
      } else {
        this.renderEmptyState(container);
      }
    } catch (err) {
      this.renderEmptyState(container);
    }
  },

  getSelectedDate() {
    if (this.selectedDate) return this.selectedDate;
    const today = new Date();
    return today.toISOString().split('T')[0];
  },

  getWeekDates() {
    const dates = [];
    const today = new Date();
    const weekday = ['日', '一', '二', '三', '四', '五', '六'];

    for (let i = -3; i <= 3; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      dates.push({
        dateStr: d.toISOString().split('T')[0],
        day: '周' + weekday[d.getDay()],
        date: d.getDate(),
        isToday: i === 0,
      });
    }
    return dates;
  },

  /**
   * 合并三餐饮食项：
   * 如果 content 对象中已有 breakfast/lunch/dinner 属性，说明后端已合并，无需处理。
   * 如果同一个 time 有多个 type='diet' 的简单字符串项（如"早餐：..."），尝试合并为一条。
   */
  mergeMealItems(rawItems) {
    // 检查是否有需要合并的纯文本饮食项
    var dietItems = rawItems.filter(function(item) {
      return item.type === 'diet' && typeof item.content === 'string';
    });
    var otherItems = rawItems.filter(function(item) {
      return item.type !== 'diet' || typeof item.content !== 'string';
    });

    // 如果饮食项少于3个或都是对象格式，不需要合并
    if (dietItems.length < 3) {
      return rawItems;
    }

    // 尝试按餐次文本合并（识别"早餐："、"午餐："、"晚餐："开头的字符串）
    var mealMap = {};  // key: 分组标识, value: {breakfast, lunch, dinner, ids, time}
    var processedIds = {};
    var unmergedDietItems = [];

    dietItems.forEach(function(item) {
      var text = item.content || '';
      var mealType = null;
      if (text.indexOf('早餐') === 0 || text.indexOf('早') === 0) mealType = 'breakfast';
      else if (text.indexOf('午餐') === 0 || text.indexOf('午') === 0) mealType = 'lunch';
      else if (text.indexOf('晚餐') === 0 || text.indexOf('晚') === 0) mealType = 'dinner';

      if (mealType) {
        // 使用 time 或 item.id 的前几位作为分组key
        var groupKey = item.time || item.id;
        if (!mealMap[groupKey]) {
          mealMap[groupKey] = { ids: [], breakfast: null, lunch: null, dinner: null, time: item.time };
        }
        mealMap[groupKey][mealType] = text;
        mealMap[groupKey].ids.push(item.id);
        processedIds[item.id] = true;
      } else {
        unmergedDietItems.push(item);
      }
    });

    // 只有当至少有一组包含2个以上餐次时才进行合并
    var mergedResult = [];
    var hasMerged = false;
    Object.keys(mealMap).forEach(function(key) {
      var group = mealMap[key];
      var mealCount = (group.breakfast ? 1 : 0) + (group.lunch ? 1 : 0) + (group.dinner ? 1 : 0);
      if (mealCount >= 2) {
        // 合并为一个 item
        hasMerged = true;
        var mergedContent = {};
        if (group.breakfast) mergedContent.breakfast = group.breakfast;
        if (group.lunch) mergedContent.lunch = group.lunch;
        if (group.dinner) mergedContent.dinner = group.dinner;
        mergedResult.push({
          id: group.ids[0],
          date: rawItems[0].date,
          time: group.time,
          type: 'diet',
          content: mergedContent,
          _mergedFrom: group.ids  // 记录来源ID
        });
      } else {
        // 不足2餐不合并，保留原始项
        group.ids.forEach(function(id) {
          var origItem = dietItems.find(function(d) { return d.id === id; });
          if (origItem) mergedResult.push(origItem);
        });
      }
    });

    // 如果没有发生任何合并，返回原始列表
    if (!hasMerged) return rawItems;

    // 合并非饮食项和未合并的饮食项
    return otherItems.concat(unmergedDietItems).concat(mergedResult).sort(function(a, b) {
      return (a.time || '').localeCompare(b.time || '');
    });
  },

  renderEmptyState(container) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📋</div>
        <div class="empty-title">还没有健康方案</div>
        <div class="empty-desc">根据你的健康信息，AI将为你生成个性化的养生方案</div>
        <button class="btn btn-primary" id="generate-plan-btn" style="margin-top: 12px;">生成方案</button>
      </div>
    `;

    document.getElementById('generate-plan-btn')?.addEventListener('click', () => {
      this.generatePlan();
    });
  },

  renderGuestPlan(container) {
    this.plan = this.getMockPlanData();
    this.selectedDate = this.getSelectedDate();
    this.weekDates = this.getWeekDates();
    this.renderPlanView(container);
  },

  getMockPlanData() {
    const today = new Date().toISOString().split('T')[0];
    const items = [
      { id: 'm1', date: today, time: '07:30', type: 'diet', content: '早餐：燕麦粥 + 蓝莓 + 坚果' },
      { id: 'm2', date: today, time: '10:00', type: 'exercise', content: '工间操 10分钟，活动肩颈' },
      { id: 'm3', date: today, time: '12:00', type: 'diet', content: '午餐：糙米饭 + 蔬菜 + 鸡胸肉，七分饱' },
      { id: 'm4', date: today, time: '14:00', type: 'water', content: '下午茶时间喝水 300ml' },
      { id: 'm5', date: today, time: '18:30', type: 'diet', content: '晚餐：杂粮粥 + 清蒸鱼 + 时令蔬菜' },
      { id: 'm6', date: today, time: '20:00', type: 'exercise', content: '散步 30分钟或瑜伽拉伸' },
      { id: 'm7', date: today, time: '22:30', type: 'sleep', content: '泡脚 15分钟，准备入睡' },
    ];

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    items.push(
      { id: 'm8', date: tomorrowStr, time: '07:30', type: 'diet', content: '早餐：全麦面包 + 牛奶 + 鸡蛋' },
      { id: 'm9', date: tomorrowStr, time: '12:00', type: 'diet', content: '午餐：番茄牛腩 + 米饭 + 青菜' },
      { id: 'm10', date: tomorrowStr, time: '18:00', type: 'exercise', content: '慢跑 20分钟' },
      { id: 'm11', date: tomorrowStr, time: '22:00', type: 'sleep', content: '阅读放松，22:30入睡' },
    );

    return {
      id: 'mock-plan',
      status: 'draft',
      startDate: today,
      endDate: tomorrowStr,
      items,
    };
  },

  renderPlanView(container) {
    const statusTag = this.plan.status === 'confirmed'
      ? '<span class="tag tag-success">已确认</span>'
      : '<span class="tag tag-accent">草稿</span>';

    container.innerHTML = `
      <div class="date-tabs" id="plan-date-tabs">
        ${this.weekDates.map(d => `
          <div class="date-tab ${d.dateStr === this.selectedDate ? 'active' : ''}" data-date="${d.dateStr}">
            <span class="day">${d.isToday ? '今天' : d.day}</span>
            <span class="date">${d.date}</span>
          </div>
        `).join('')}
      </div>

      <div class="section" style="padding-top: 0;">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
          <span class="section-title" style="margin-bottom: 0;">方案详情</span>
          ${statusTag}
        </div>
        <div id="plan-items-list"></div>
      </div>

      ${this.plan.status !== 'confirmed' ? `
        <div class="section">
          <button class="btn btn-primary btn-block" id="confirm-plan-btn">确认方案</button>
        </div>
      ` : ''}
    `;

    this.renderPlanItems();
    this.bindPlanEvents();
  },

  renderPlanItems() {
    const list = document.getElementById('plan-items-list');
    if (!list) return;

    const rawItems = (this.plan.items || []).filter(item => item.date === this.selectedDate);

    if (rawItems.length === 0) {
      list.innerHTML = `
        <div class="empty-state" style="padding: 32px 16px;">
          <div class="empty-icon">📅</div>
          <div class="empty-title">该日期暂无安排</div>
          <div class="empty-desc">选择其他日期查看</div>
        </div>
      `;
      return;
    }

    // 三餐合并逻辑：将同一组（time相同或相邻）的饮食项合并为一张卡片
    var items = this.mergeMealItems(rawItems);

    const typeColors = {
      diet: 'border-left-color: #22c55e',
      exercise: 'border-left-color: #3b82f6',
      sleep: 'border-left-color: #8b5cf6',
      water: 'border-left-color: #06b6d4',
      other: 'border-left-color: #f59e0b',
    };

    const typeNames = { diet: '饮食', exercise: '运动', sleep: '睡眠', water: '饮水', other: '其他' };

    list.innerHTML = items.map(item => {
      const isEditing = this.editingItemId === item.id;
      const color = typeColors[item.type] || typeColors.other;
      const typeName = typeNames[item.type] || '其他';

      if (isEditing) {
        return `
          <div class="plan-item editing" style="${color}" data-id="${item.id}">
            <div class="plan-item-header">
              <span class="tag tag-primary">${typeName}</span>
              <span class="plan-item-time">${item.time || ''}</span>
            </div>
            <textarea class="edit-field" id="edit-content-${item.id}">${getContentText(item.content)}</textarea>
            <div class="plan-item-actions">
              <button class="btn btn-sm btn-primary" id="save-item-${item.id}">保存</button>
              <button class="btn btn-sm btn-secondary" id="cancel-item-${item.id}">取消</button>
            </div>
          </div>
        `;
      }

      return `
        <div class="plan-item" style="${color}" data-id="${item.id}">
          <div class="plan-item-header">
            <span class="tag tag-primary">${typeName}</span>
            <span class="plan-item-time">${item.time || ''}</span>
          </div>
          <div class="plan-item-content">${getContentText(item.content)}</div>
          ${this.plan.status !== 'confirmed' ? `
            <div class="plan-item-actions">
              <button class="btn btn-sm btn-outline edit-item-btn" data-id="${item.id}">编辑</button>
            </div>
          ` : ''}
        </div>
      `;
    }).join('');

    this.bindItemEvents();
  },

  bindPlanEvents() {
    // 日期Tab切换
    document.querySelectorAll('.date-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        this.selectedDate = tab.dataset.date;
        this.editingItemId = null;
        document.querySelectorAll('.date-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        this.renderPlanItems();
      });
    });

    // 确认方案
    document.getElementById('confirm-plan-btn')?.addEventListener('click', () => {
      this.confirmPlan();
    });
  },

  bindItemEvents() {
    // 编辑按钮
    document.querySelectorAll('.edit-item-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.editingItemId = btn.dataset.id;
        this.renderPlanItems();
      });
    });

    // 保存按钮
    document.querySelectorAll('[id^="save-item-"]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const itemId = btn.id.replace('save-item-', '');
        const content = document.getElementById(`edit-content-${itemId}`)?.value;
        if (!content || !content.trim()) {
          showToast('内容不能为空', 'error');
          return;
        }

        const isGuest = localStorage.getItem('guestMode');
        if (isGuest) {
          const item = this.plan.items.find(i => i.id === itemId);
          if (item) item.content = content.trim();
          this.editingItemId = null;
          this.renderPlanItems();
          showToast('已保存', 'success');
          return;
        }

        btn.disabled = true;
        btn.textContent = '保存中...';
        try {
          const result = await api.updatePlanItem(itemId, { content: content.trim() });
          if (result.code === 0) {
            const item = this.plan.items.find(i => i.id === itemId);
            if (item) item.content = content.trim();
            this.editingItemId = null;
            this.renderPlanItems();
            showToast('已保存', 'success');
          } else {
            showToast(result.message || '保存失败', 'error');
          }
        } catch (err) {
          showToast('网络错误', 'error');
        } finally {
          btn.disabled = false;
          btn.textContent = '保存';
        }
      });
    });

    // 取消按钮
    document.querySelectorAll('[id^="cancel-item-"]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.editingItemId = null;
        this.renderPlanItems();
      });
    });
  },

  async generatePlan() {
    const container = document.getElementById('plan-content');
    container.innerHTML = `
      <div class="loading" style="padding: 60px 20px;">
        <div class="loading-spinner"></div>
        <div class="loading-text">AI正在为你生成个性化方案...</div>
        <div class="loading-text" style="font-size: 12px; color: var(--text-light); margin-top: 8px;">请稍候，这可能需要几秒钟</div>
      </div>
    `;

    try {
      const result = await api.generatePlan();
      if (result.code === 0 && result.data) {
        this.plan = result.data;
        this.selectedDate = this.getSelectedDate();
        this.weekDates = this.getWeekDates();
        this.renderPlanView(container);
        showToast('方案生成成功！', 'success');
      } else {
        this.renderGuestPlan(container);
        showToast('使用演示方案', 'info');
      }
    } catch (err) {
      this.renderGuestPlan(container);
      showToast('使用演示方案', 'info');
    }
  },

  async confirmPlan() {
    const btn = document.getElementById('confirm-plan-btn');
    if (!btn) return;
    btn.disabled = true;
    btn.textContent = '确认中...';

    try {
      const result = await api.confirmPlan();
      if (result.code === 0) {
        this.plan.status = 'confirmed';
        this.renderPlanView(document.getElementById('plan-content'));
        showToast('方案已确认！', 'success');
      } else {
        showToast(result.message || '确认失败', 'error');
      }
    } catch (err) {
      showToast('网络错误', 'error');
    } finally {
      btn.disabled = false;
    }
  }
};
