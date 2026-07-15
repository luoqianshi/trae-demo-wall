/**
 * EnergyMapPage.js - 能量地图页面控制器
 * 记录能量消耗/恢复事件，本周概览柱状图，分析建议
 * 纯CSS柱状图，全部数据持久化到Store + localStorage
 * 原生 ES6+，严格模式
 */
'use strict';

const EnergyMapPage = {
  /** @type {string} 当前选中的记录类型 'drain' | 'gain' */
  _currentType: 'drain',

  /** @type {number} 当前选中的强度 1-5 */
  _currentIntensity: 3,

  /** @type {Array} 本周记录列表 */
  _records: [],

  // ============================================================
  // 生命周期
  // ============================================================

  /**
   * 渲染能量地图页面HTML
   * @returns {string} 页面HTML字符串
   */
  render() {
    return `
      <div class="page energy-map">
        <h2 class="energy-map__title">能量地图</h2>
        <p class="energy-map__subtitle">记录每天的能量变化，了解什么消耗你、什么恢复你</p>

        <!-- 快速记录按钮 -->
        <div class="energy-map__quick-actions">
          <button class="energy-map__quick-btn energy-map__quick-btn--drain" id="energyTypeDrain" onclick="EnergyMapPage.selectType('drain')">- 耗能</button>
          <button class="energy-map__quick-btn energy-map__quick-btn--gain" id="energyTypeGain" onclick="EnergyMapPage.selectType('gain')">+ 获能</button>
        </div>

        <!-- 事件输入行 -->
        <div class="energy-map__event-input">
          <input
            id="energyEventInput"
            type="text"
            class="energy-map__event-input-field"
            placeholder="输入事件名称，比如：加班、散步..."
            maxlength="30"
          />
          <button class="energy-map__event-add-btn" id="energyAddBtn" onclick="EnergyMapPage.addRecord()">+</button>
        </div>

        <!-- 强度选择 -->
        <div class="energy-map__intensity">
          <span class="energy-map__intensity-label">强度：</span>
          <div class="energy-map__intensity-dots" id="energyIntensityDots">
            ${[1, 2, 3, 4, 5].map(val => `
              <div
                class="energy-map__intensity-dot ${val === 3 ? 'energy-map__intensity-dot--active energy-map__intensity-dot--drain' : ''}"
                data-intensity="${val}"
                onclick="EnergyMapPage.selectIntensity(${val})"
                title="${val}级"
              ></div>
            `).join('')}
          </div>
        </div>

        <!-- 本周概览柱状图 -->
        <div class="energy-map__chart" id="energyChartSection">
          <div class="energy-map__chart-title">本周概览</div>
          <div class="energy-map__chart-bars" id="energyChartBars">
            ${this._renderEmptyChart()}
          </div>
        </div>

        <!-- 统计卡片 -->
        <div class="energy-map__stats" id="energyStatsSection">
          <div class="energy-map__stat-card energy-map__stat-card--drain">
            <div class="energy-map__stat-label">最大耗能</div>
            <div class="energy-map__stat-value energy-map__stat-value--drain" id="energyMaxDrain">--</div>
            <div class="energy-map__stat-desc" id="energyMaxDrainEvent">暂无记录</div>
          </div>
          <div class="energy-map__stat-card energy-map__stat-card--gain">
            <div class="energy-map__stat-label">最大恢复</div>
            <div class="energy-map__stat-value energy-map__stat-value--gain" id="energyMaxGain">--</div>
            <div class="energy-map__stat-desc" id="energyMaxGainEvent">暂无记录</div>
          </div>
        </div>

        <!-- 建议卡片 -->
        <div id="energyAdviceSection" style="display:none;margin-bottom:20px;">
          <div class="card" style="text-align:center;">
            <div style="font-size:14px;font-weight:600;color:var(--text-primary);margin-bottom:8px;">小建议</div>
            <div id="energyAdviceText" style="font-size:13px;color:var(--text-secondary);line-height:1.6;"></div>
          </div>
        </div>

        <!-- 记录列表 -->
        <div class="energy-map__records" id="energyRecordsList">
          <div class="energy-map__records-title">记录列表</div>
          <div class="energy-map__empty" id="energyEmptyState">
            <span class="energy-map__empty-icon">📊</span>
            <div class="energy-map__empty-text">还没有记录，开始记录你的能量变化吧</div>
          </div>
        </div>
      </div>
    `;
  },

  /**
   * 渲染空状态柱状图
   * @returns {string} 7天空柱状图HTML
   * @private
   */
  _renderEmptyChart() {
    const days = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
    return days.map(day => `
      <div class="energy-map__chart-bar-group">
        <div class="energy-map__chart-bar-wrapper">
          <div class="energy-map__chart-bar energy-map__chart-bar--drain" style="height:2px;"></div>
          <div class="energy-map__chart-bar energy-map__chart-bar--gain" style="height:2px;"></div>
        </div>
        <span class="energy-map__chart-bar-label">${day}</span>
      </div>
    `).join('');
  },

  /**
   * 页面挂载：显示导航栏，加载数据，渲染图表
   * @param {HTMLElement} pageView - 页面DOM元素
   * @param {Object} [params] - 路由参数
   */
  mount(pageView, params = {}) {
    // 显示导航栏
    if (typeof NavBar !== 'undefined' && typeof NavBar.show === 'function') {
      NavBar.show('energy-map');
    }

    // 重置状态
    this._currentType = 'drain';
    this._currentIntensity = 3;

    // 加载数据
    this._loadRecords();

    // 更新强度选择器样式
    this._updateIntensityDots();

    // 渲染图表和统计
    this._renderChart();
    this._renderStats();
    this._renderRecords();
  },

  // ============================================================
  // 数据管理
  // ============================================================

  /**
   * 从Store加载记录数据
   * @private
   */
  _loadRecords() {
    if (typeof Store !== 'undefined') {
      const stored = Store.getState('training.energyRecords');
      this._records = Array.isArray(stored) ? stored : [];
    } else {
      this._records = [];
    }
  },

  /**
   * 保存记录到Store和localStorage
   * @private
   */
  _saveRecords() {
    if (typeof Store !== 'undefined') {
      Store.setState('training', { energyRecords: this._records });
      Store.saveToStorage('training');
    }
  },

  // ============================================================
  // 用户操作
  // ============================================================

  /**
   * 选择记录类型
   * @param {'drain'|'gain'} type - 记录类型
   */
  selectType(type) {
    this._currentType = type;

    // 更新按钮样式
    const drainBtn = document.getElementById('energyTypeDrain');
    const gainBtn = document.getElementById('energyTypeGain');

    if (drainBtn && gainBtn) {
      drainBtn.style.opacity = type === 'drain' ? '1' : '0.5';
      gainBtn.style.opacity = type === 'gain' ? '1' : '0.5';
    }

    // 更新强度点样式
    this._updateIntensityDots();
  },

  /**
   * 选择强度
   * @param {number} val - 强度值 1-5
   */
  selectIntensity(val) {
    this._currentIntensity = val;
    this._updateIntensityDots();
  },

  /**
   * 更新强度选择器圆点样式
   * @private
   */
  _updateIntensityDots() {
    const dots = document.querySelectorAll('.energy-map__intensity-dot');
    dots.forEach(dot => {
      const val = parseInt(dot.dataset.intensity, 10);
      dot.classList.remove(
        'energy-map__intensity-dot--active',
        'energy-map__intensity-dot--drain',
        'energy-map__intensity-dot--gain'
      );

      if (val <= this._currentIntensity) {
        dot.classList.add('energy-map__intensity-dot--active');
        dot.classList.add(this._currentType === 'drain' ? 'energy-map__intensity-dot--drain' : 'energy-map__intensity-dot--gain');
      }
    });
  },

  /**
   * 添加记录
   */
  addRecord() {
    const input = document.getElementById('energyEventInput');
    if (!input) return;

    const eventName = input.value.trim();
    if (!eventName) {
      input.style.borderColor = '#ff4444';
      input.focus();
      setTimeout(() => {
        input.style.borderColor = '';
      }, 1500);
      return;
    }

    // 构建记录
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0=周日, 1=周一, ...
    const dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    const dateStr = this._formatDate(today);

    const record = {
      id: Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
      date: dateStr,
      dayLabel: dayNames[dayOfWeek],
      type: this._currentType,
      event: eventName,
      value: this._currentIntensity,
      createdAt: Date.now()
    };

    // 添加到记录列表
    this._records.push(record);
    this._saveRecords();

    // 清空输入
    input.value = '';
    input.focus();

    // 更新UI
    this._renderChart();
    this._renderStats();
    this._renderRecords();

    // 滚动到图表区域
    setTimeout(() => {
      const chart = document.getElementById('energyChartSection');
      if (chart) chart.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);

    console.log('[EnergyMapPage] 记录已添加:', record);
  },

  /**
   * 删除记录
   * @param {string} recordId - 记录ID
   */
  deleteRecord(recordId) {
    if (!recordId) return;

    const index = this._records.findIndex(r => r.id === recordId);
    if (index === -1) return;

    this._records.splice(index, 1);
    this._saveRecords();

    // 更新UI
    this._renderChart();
    this._renderStats();
    this._renderRecords();

    console.log('[EnergyMapPage] 记录已删除:', recordId);
  },

  // ============================================================
  // UI渲染
  // ============================================================

  /**
   * 渲染柱状图
   * @private
   */
  _renderChart() {
    const chartContainer = document.getElementById('energyChartBars');
    if (!chartContainer) return;

    // 获取本周每天的数据
    const weekData = this._getWeekData();

    chartContainer.innerHTML = weekData.map(day => {
      const drainHeight = Math.max(day.drainTotal * 12, 2);
      const gainHeight = Math.max(day.gainTotal * 12, 2);

      return `
        <div class="energy-map__chart-bar-group">
          <div class="energy-map__chart-bar-wrapper">
            <div class="energy-map__chart-bar energy-map__chart-bar--drain" style="height:${Math.min(drainHeight, 120)}px;" title="耗能 ${day.drainTotal}"></div>
            <div class="energy-map__chart-bar energy-map__chart-bar--gain" style="height:${Math.min(gainHeight, 120)}px;" title="获能 ${day.gainTotal}"></div>
          </div>
          <span class="energy-map__chart-bar-label">${day.label}</span>
        </div>
      `;
    }).join('');
  },

  /**
   * 获取本周每天的数据汇总
   * @returns {Array<{label: string, drainTotal: number, gainTotal: number}>}
   * @private
   */
  _getWeekData() {
    const dayLabels = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
    const today = new Date();
    const currentDay = today.getDay();

    // 构建本周日期序列
    const weekDays = [];
    for (let i = 0; i < 7; i++) {
      const diff = currentDay === 0 ? 6 - i : i - (currentDay - 1);
      // 当currentDay=0（周日），周一=diff=-6...周日=diff=0
      // 当currentDay=1（周一），周一=diff=0...周日=diff=6
      let dayDiff;
      if (currentDay === 0) {
        dayDiff = -6 + i;
      } else {
        dayDiff = i - (currentDay - 1);
      }

      const date = new Date(today);
      date.setDate(today.getDate() + dayDiff);

      weekDays.push({
        label: dayLabels[i],
        dateStr: this._formatDate(date),
        drainTotal: 0,
        gainTotal: 0
      });
    }

    // 汇总每天的数据
    this._records.forEach(record => {
      const day = weekDays.find(d => d.dateStr === record.date);
      if (day) {
        if (record.type === 'drain') {
          day.drainTotal += record.value;
        } else {
          day.gainTotal += record.value;
        }
      }
    });

    return weekDays;
  },

  /**
   * 渲染统计卡片和分析建议
   * @private
   */
  _renderStats() {
    const maxDrainEl = document.getElementById('energyMaxDrain');
    const maxDrainEventEl = document.getElementById('energyMaxDrainEvent');
    const maxGainEl = document.getElementById('energyMaxGain');
    const maxGainEventEl = document.getElementById('energyMaxGainEvent');
    const adviceSection = document.getElementById('energyAdviceSection');
    const adviceText = document.getElementById('energyAdviceText');

    if (!maxDrainEl || !maxGainEl) return;

    // 查找最大耗能事件
    const drainRecords = this._records.filter(r => r.type === 'drain');
    const gainRecords = this._records.filter(r => r.type === 'gain');

    // 最大耗能
    let maxDrain = null;
    let maxDrainEvent = '暂无记录';
    let maxDrainStr = '--';

    if (drainRecords.length > 0) {
      // 按值降序排序
      const sortedDrain = [...drainRecords].sort((a, b) => b.value - a.value);
      maxDrain = sortedDrain[0];
      maxDrainStr = String(maxDrain.value);
      maxDrainEvent = maxDrain.event;
    }

    maxDrainEl.textContent = maxDrainStr;
    maxDrainEventEl.textContent = maxDrainEvent;

    // 最大恢复
    let maxGain = null;
    let maxGainEvent = '暂无记录';
    let maxGainStr = '--';

    if (gainRecords.length > 0) {
      const sortedGain = [...gainRecords].sort((a, b) => b.value - a.value);
      maxGain = sortedGain[0];
      maxGainStr = String(maxGain.value);
      maxGainEvent = maxGain.event;
    }

    maxGainEl.textContent = maxGainStr;
    maxGainEventEl.textContent = maxGainEvent;

    // 生成建议
    if (this._records.length > 0) {
      const advice = this._generateAdvice(maxDrain, maxGain, drainRecords, gainRecords);
      if (adviceSection) adviceSection.style.display = 'block';
      if (adviceText) adviceText.textContent = advice;
    } else {
      if (adviceSection) adviceSection.style.display = 'none';
    }
  },

  /**
   * 基于数据生成建议文本
   * @param {Object|null} maxDrain - 最大耗能记录
   * @param {Object|null} maxGain - 最大恢复记录
   * @param {Array} drainRecords - 所有耗能记录
   * @param {Array} gainRecords - 所有获能记录
   * @returns {string} 建议文本
   * @private
   */
  _generateAdvice(maxDrain, maxGain, drainRecords, gainRecords) {
    let advice = '';

    // 总耗能 vs 总获能比较
    const totalDrain = drainRecords.reduce((sum, r) => sum + r.value, 0);
    const totalGain = gainRecords.reduce((sum, r) => sum + r.value, 0);

    if (totalDrain > totalGain * 1.5) {
      advice += '本周耗能明显高于获能，建议多安排一些让自己放松的活动。';
    } else if (totalGain > totalDrain * 1.5) {
      advice += '本周获能状态不错，继续保持！';
    } else {
      advice += '能量收支基本平衡，注意观察长期趋势。';
    }

    // 最大耗能提醒
    if (maxDrain) {
      advice += ' 特别留意「' + maxDrain.event + '」对你的消耗较大，可以尝试减少暴露或提前做好准备。';
    }

    // 最大恢复建议
    if (maxGain) {
      advice += ' 「' + maxGain.event + '」对你恢复能量很有帮助，建议每周安排固定时间。';
    }

    return advice || '继续记录，更好的了解自己的能量模式。';
  },

  /**
   * 渲染记录列表
   * @private
   */
  _renderRecords() {
    const listContainer = document.getElementById('energyRecordsList');
    const emptyState = document.getElementById('energyEmptyState');
    if (!listContainer) return;

    if (this._records.length === 0) {
      // 显示空状态
      if (emptyState) emptyState.style.display = 'block';
      // 移除已有的记录DOM
      const existingRecords = listContainer.querySelectorAll('.energy-map__record');
      existingRecords.forEach(el => el.remove());
      return;
    }

    // 隐藏空状态
    if (emptyState) emptyState.style.display = 'none';

    // 移除旧记录DOM
    const existingRecords = listContainer.querySelectorAll('.energy-map__record');
    existingRecords.forEach(el => el.remove());

    // 按时间倒序排列
    const sortedRecords = [...this._records].sort((a, b) => b.createdAt - a.createdAt);

    // 渲染新记录
    sortedRecords.forEach(record => {
      const recordEl = document.createElement('div');
      recordEl.className = 'energy-map__record';
      recordEl.dataset.recordId = record.id;

      // 图标
      const icon = document.createElement('div');
      icon.className = 'energy-map__record-icon energy-map__record-icon--' + record.type;
      icon.textContent = record.type === 'drain' ? '-' : '+';

      // 信息
      const info = document.createElement('div');
      info.className = 'energy-map__record-info';

      const text = document.createElement('div');
      text.className = 'energy-map__record-text';
      text.textContent = record.event;

      const meta = document.createElement('div');
      meta.className = 'energy-map__record-meta';

      const dateSpan = document.createElement('span');
      dateSpan.textContent = record.date + ' ' + (record.dayLabel || '');

      const intensityWrapper = document.createElement('span');
      intensityWrapper.className = 'energy-map__record-intensity';
      for (let i = 0; i < 5; i++) {
        const dot = document.createElement('span');
        dot.className = 'energy-map__record-intensity-dot';
        if (i < record.value) {
          dot.classList.add('energy-map__record-intensity-dot--fill');
          dot.classList.add('energy-map__record-intensity-dot--' + record.type);
        }
        intensityWrapper.appendChild(dot);
      }

      meta.appendChild(dateSpan);
      meta.appendChild(intensityWrapper);

      info.appendChild(text);
      info.appendChild(meta);

      // 删除按钮
      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'energy-map__record-delete';
      deleteBtn.textContent = '✕';
      deleteBtn.setAttribute('data-record-id', record.id);
      deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = e.currentTarget.getAttribute('data-record-id');
        this.deleteRecord(id);
      });

      recordEl.appendChild(icon);
      recordEl.appendChild(info);
      recordEl.appendChild(deleteBtn);

      listContainer.appendChild(recordEl);
    });
  },

  /**
   * 格式化日期为MM-DD
   * @param {Date} date - 日期对象
   * @returns {string} 格式化后的日期字符串
   * @private
   */
  _formatDate(date) {
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return month + '-' + day;
  }
};

// 注册页面到待处理队列（App初始化后自动注册）
window._pageRegistrations = window._pageRegistrations || [];
window._pageRegistrations.push({page: 'energy-map', controller: EnergyMapPage});

// 暴露到全局，供inline onclick调用
window.EnergyMapPage = EnergyMapPage;