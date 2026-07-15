// pages/home/home.js
// 修复 PT-mp-002：使用复合 key `${year}-${month}-${day}` 避免填充日冲突
// 修复 PT-mp-006：首屏逻辑由 welcome 接管，home 不再做引导跳转
// 新增：首次用户 FAB 气泡提示（appSettingsRepository.hasSeenFabHint 字段控制）
// V0.2.0：FAB 旁绘制波波立绘（Canvas）
// V0.2.0-fix：波波立绘改用 SVG 资源（不依赖 Lottie/Canvas/构建 npm），2 倍 FAB（192rpx），长按拖动到屏幕任意位置，位置持久化到 AppSettings.boboPosition

const { recordRepository, appSettingsRepository } = require('../../data/repositories/index.js');
const { BRISTOL_COLORS, COLORS } = require('../../utils/constants.js');
const {
  getMonthDays, getStartOfDay, getEndOfDay, isToday,
  formatTime, formatDate
} = require('../../utils/date-utils.js');
const bobo = require('../../utils/bobo.js');
const boboPos = require('../../utils/bobo-position.js');

// ===== V0.2.0-fix SVG 资源映射 =====
// 不使用 lottie-miniprogram，直接用 SVG 立绘，避开 canvas/npm 依赖
// 路径用 /images/bobo/ 开头（项目根绝对路径），这是微信 image 标签的官方格式
const BOBO_SVG_FILES = {
  normal: '/images/bobo/bobo-normal.svg',
  happy: '/images/bobo/bobo-happy.svg',
  worried: '/images/bobo/bobo-worried.svg',
  celebrate: '/images/bobo/bobo-happy.svg',
  peek: '/images/bobo/bobo-normal.svg'
};

Page({
  data: {
    currentYear: 0,
    currentMonth: 0,
    currentMonthLabel: '',
    weekHeaders: ['日', '一', '二', '三', '四', '五', '六'],
    calendarDays: [],
    selectedDay: null,
    selectedDayRecords: [],
    monthRecordCount: 0,
    hasRecords: false,
    isEmpty: true,
    bristolColors: BRISTOL_COLORS,
    todayText: '今天',
    recordSummary: '',
    fabBottomRpx: 124,
    showFabHint: false,
    // V0.2.0-fix 波波（SVG 立绘 + 拖动）
    boboEnabled: true,
    boboExpressive: true,                   // 是否启用呼吸摆动动画
    BOBO_SIZE_RPX: 192,                     // 2 倍 FAB (96rpx)
    boboStyle: { left: '0rpx', top: '0rpx' }, // 由 onLoad 计算
    boboImageSrc: BOBO_SVG_FILES.normal,    // 当前表情对应的 SVG
    isDragging: false,
    _dragStartX: 0,
    _dragStartY: 0,
    _dragOriginLeft: 0,
    _dragOriginTop: 0,
    _longPressTimer: null,
    _longPressTriggered: false,
    _boboExpressionTimer: null
  },

  onLoad() {
    // 引导由 welcome 接管：home 不再做任何重定向
    const now = new Date();
    this.setData({
      currentYear: now.getFullYear(),
      currentMonth: now.getMonth()
    });
    this.loadMonthData();
    // 同步：计算波波位置 + 设置默认表情（不依赖 DOM 节点）
    this.initBobo();
  },

  onShow() {
    this.loadMonthData();
    this.checkFabHint();
  },

  /**
   * 首次用户显示 FAB 气泡提示："点击下方 + 按钮记录"
   * 看完一次后写入 hasSeenFabHint=true，下次不再显示
   * 修复 PT-mp-welcome-005：必须显式 setData showFabHint=false，否则
   * 第一次 setData true 之后即使 hasSeenFabHint 已为 true，
   * 视图层依然保留 showFabHint=true 状态，气泡不消失
   */
  checkFabHint() {
    try {
      const settings = appSettingsRepository.getSettings();
      const shouldShow = !!(settings && !settings.hasSeenFabHint);
      // 显式 setData 两种状态都处理，避免视图层残留旧值
      if (this.data.showFabHint !== shouldShow) {
        this.setData({ showFabHint: shouldShow });
      }
    } catch (e) {
      console.error('[home] checkFabHint error:', e);
    }
  },

  /**
   * 用户点击 FAB 关闭气泡，记录已查看
   */
  onFabHintDismiss() {
    try {
      const settings = appSettingsRepository.getSettings();
      settings.hasSeenFabHint = true;
      appSettingsRepository.saveSettings(settings);
    } catch (e) {
      console.error('[home] save hasSeenFabHint error:', e);
    }
    this.setData({ showFabHint: false });
  },

  loadMonthData() {
    const { currentYear, currentMonth } = this.data;
    const monthStart = new Date(currentYear, currentMonth, 1, 0, 0, 0, 0).getTime();
    const monthEnd = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59, 999).getTime();

    const records = recordRepository.getRecordsByDateRange(monthStart, monthEnd);
    const days = getMonthDays(currentYear, currentMonth);

    // 修复：使用复合 key 避免填充日 day 数字与当月日冲突
    const dayRecordMap = {};
    records.forEach(r => {
      const d = new Date(r.timestamp);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      if (!dayRecordMap[key]) dayRecordMap[key] = [];
      dayRecordMap[key].push(r);
    });

    const today = new Date();
    const calendarDays = days.map(day => {
      const key = `${day.year}-${day.month}-${day.day}`;
      // 修复：仅当是当月日 且 该日有记录时显示
      const list = dayRecordMap[key] || [];
      const hasRecord = list.length > 0 && day.isCurrentMonth;
      const isTodayDate = day.isCurrentMonth && isToday(day.year, day.month, day.day);
      return {
        ...day,
        key,
        hasRecord,
        isToday: isTodayDate,
        recordCount: day.isCurrentMonth ? list.length : 0,
        showAsToday: isTodayDate
      };
    });

    this.setData({
      calendarDays,
      monthRecordCount: records.length,
      hasRecords: records.length > 0,
      isEmpty: records.length === 0,
      currentMonthLabel: `${currentYear} 年 ${currentMonth + 1} 月`
    });

    // 修复 PT-mp-006：FAB 大小固定 96rpx，位置动态计算使其位于
    // "日历底部到 tabBar 顶部"空白段的垂直中央
    setTimeout(() => this.updateFabPosition(), 0);

    if (this.data.selectedDay) {
      this.loadDayRecords(this.data.selectedDay);
    }
  },

  /**
   * 修复 PT-mp-006：FAB 大小固定，仅让位置（bottom）随空白段自适应居中
   * 空白段 = 屏幕高度 - tabBar 高度 - 日历卡片底部
   * fab 中心应在空白段中央 → fab-dock 底部 = tabBar 高度 + (空白段 - fab 高度) / 2
   */
  updateFabPosition() {
    try {
      const sys = wx.getSystemInfoSync();
      const ratio = sys.windowWidth / 750; // rpx -> px
      const screenH = sys.windowHeight;
      // 兼容新旧 API：tabBarHeight 在新基础库是 px
      const tabBarPx = (typeof sys.tabBarHeight === 'number' && sys.tabBarHeight > 0)
        ? sys.tabBarHeight
        : 100 * ratio;
      const tabBarRpx = Math.round(tabBarPx / ratio);

      const query = wx.createSelectorQuery().in(this);
      query.select('.calendar-card').boundingClientRect();
      query.exec((res) => {
        if (!res || !res[0] || res[0].bottom == null) {
          // 兜底：保持原有 124rpx
          this.setData({ fabBottomRpx: 124 });
          return;
        }
        // 空白段 px
        const emptyPx = Math.max(0, screenH - tabBarPx - res[0].bottom);
        // fab 高度 96rpx = 48px（iPhone6 1rpx=0.5px）
        const fabHpx = 96 * ratio;
        // fab 中心在空白段中央 → 中心 = (日历底 + emptyPx/2) → fab 顶 = 中心 - fabH/2
        // → fab-dock 底 = (屏幕高 - 中心) - 0 ... 简化为 fab-dock 底部 = tabBar + (empty - fabH)/2
        const fabBottomRpx = Math.round(tabBarRpx + (emptyPx / ratio - 96) / 2);
        this.setData({ fabBottomRpx: Math.max(0, fabBottomRpx) });
      });
    } catch (e) {
      this.setData({ fabBottomRpx: 124 });
    }
  },

  prevMonth() {
    let { currentYear, currentMonth } = this.data;
    currentMonth--;
    if (currentMonth < 0) {
      currentMonth = 11;
      currentYear--;
    }
    this.setData({ currentYear, currentMonth, selectedDay: null, selectedDayRecords: [] });
    this.loadMonthData();
  },

  nextMonth() {
    let { currentYear, currentMonth } = this.data;
    currentMonth++;
    if (currentMonth > 11) {
      currentMonth = 0;
      currentYear++;
    }
    this.setData({ currentYear, currentMonth, selectedDay: null, selectedDayRecords: [] });
    this.loadMonthData();
  },

  onDayTap(e) {
    const { year, month, day, hasrecord } = e.currentTarget.dataset;
    if (!hasrecord) {
      wx.navigateTo({
        url: `/pages/record/record?year=${year}&month=${month}&day=${day}`
      });
      return;
    }
    this.loadDayRecords({ year, month, day });
  },

  loadDayRecords({ year, month, day }) {
    const startOfDay = getStartOfDay(year, month, day);
    const endOfDay = getEndOfDay(year, month, day);
    const records = recordRepository.getRecordsByDate(startOfDay, endOfDay);

    const selectedDayRecords = records
      .sort((a, b) => b.timestamp - a.timestamp)
      .map(r => ({
        ...r.toObject(),
        timeStr: formatTime(r.timestamp),
        colorName: this.getColorName(r.color),
        bristolName: this.getBristolName(r.bristolType)
      }));

    this.setData({
      selectedDay: { year, month, day },
      selectedDayRecords
    });
  },

  getColorName(colorKey) {
    const map = {
      brown: '棕色', yellow: '黄色', green: '绿色',
      black: '黑色', red: '红色', gray: '灰色', white: '白色'
    };
    return map[colorKey] || colorKey;
  },

  getBristolName(type) {
    const map = {
      1: '坚果状', 2: '香肠状但硬', 3: '香肠状有裂纹',
      4: '光滑香肠', 5: '柔软块状', 6: '边缘毛糙', 7: '水样'
    };
    return map[type] || '未知';
  },

  onAddRecord() {
    wx.navigateTo({
      url: '/pages/record/record'
    });
  },

  onRecordItemTap(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/record-detail/record-detail?id=${id}`
    });
  },

  // ===== V0.2.0-fix 波波 SVG + 长按拖动 =====

  /**
   * 初始化：读取设置、计算位置、设置默认表情
   * 位置优先级：AppSettings.boboPosition > 默认（FAB 上方偏左）
   */
  initBobo() {
    try {
      const settings = appSettingsRepository.getSettings();
      const enabled = settings && settings.boboEnabled !== false;
      this.setData({ boboEnabled: enabled });
      if (!enabled) return;
      // 计算波波立绘位置
      this.computeBoboPosition();
    } catch (e) {
      console.error('[home] initBobo error:', e);
    }
  },

  /**
   * 计算波波立绘位置（rpx 单位）
   *  - 如果 AppSettings.boboPosition 有值，用它
   *  - 否则默认：FAB 上方 200rpx 偏左
   */
  computeBoboPosition() {
    const settings = appSettingsRepository.getSettings();
    const sysInfo = wx.getSystemInfoSync();
    const screenHRpx = boboPos.calcScreenHeightRpx(sysInfo);

    const BOBO = this.data.BOBO_SIZE_RPX;
    const saved = boboPos.parseBoboPosition(settings && settings.boboPosition);
    let x, y;
    if (saved) {
      x = saved.x;
      y = saved.y;
    } else {
      // 默认位置：FAB 左侧 240rpx（FAB 在屏幕中央，所以 750/2 - 48 - 240 = 87rpx），FAB 上方 200rpx
      x = 750 / 2 - 48 - 240 - BOBO / 2;
      y = screenHRpx - 124 - BOBO - 200;
    }
    // 边界保护：不能超出屏幕，且不能被 tabBar 遮挡
    const safe = boboPos.clampBoboPosition(x, y, { boboSize: BOBO, screenHeightRpx: screenHRpx });
    this.setData({ boboStyle: { left: safe.x + 'rpx', top: safe.y + 'rpx' } });
  },

  /**
   * 边界保护（薄封装，保留以兼容 home.js 内部调用）
   *   x ∈ [0, 750-BOBO]
   *   y ∈ [40, screenH - 280 - BOBO]
   *   - 上边界 40rpx：避免顶到状态栏
   *   - 下边界 screenH - 280 - BOBO：避免遮挡 tabBar（tabBar 约 100rpx + FAB 124rpx = 224rpx + 56rpx 缓冲）
   */
  clampBoboPosition(x, y) {
    const sysInfo = wx.getSystemInfoSync();
    return boboPos.clampBoboPosition(x, y, {
      boboSize: this.data.BOBO_SIZE_RPX,
      screenHeightRpx: boboPos.calcScreenHeightRpx(sysInfo)
    });
  },

  /**
   * 切换波波表情（切换 SVG 资源）
   * @param {string} expr normal | happy | worried | celebrate | peek
   */
  setBoboExpression(expr) {
    const src = BOBO_SVG_FILES[expr] || BOBO_SVG_FILES.normal;
    if (this.data.boboImageSrc !== src) {
      this.setData({ boboImageSrc: src });
    }
  },

  // ===== 长按拖动事件 =====

  onBoboTouchStart(e) {
    const t = (e.touches && e.touches[0]) || (e.changedTouches && e.changedTouches[0]);
    if (!t) return;
    this._dragStartX = t.clientX;
    this._dragStartY = t.clientY;
    const sysInfo = wx.getSystemInfoSync();
    // 把 clientX（px）转 rpx
    this._dragStartXrpx = boboPos.pxToRpx(t.clientX, sysInfo.windowWidth);
    this._dragStartYrpx = boboPos.pxToRpx(t.clientY, sysInfo.windowWidth);
    // 解析当前 left/top（去掉 "rpx"）
    const leftRpx = parseFloat(this.data.boboStyle.left) || 0;
    const topRpx = parseFloat(this.data.boboStyle.top) || 0;
    this._dragOriginLeft = leftRpx;
    this._dragOriginTop = topRpx;
    this._longPressTriggered = false;
    // 设置长按检测定时器（350ms 后认为是长按拖动）
    this.clearLongPressTimer();
    this._longPressTimer = setTimeout(() => {
      this._longPressTriggered = true;
      this.setData({ isDragging: true });
      try { wx.vibrateShort({ type: 'light' }); } catch (e) {}
    }, 350);
  },

  onBoboTouchMove(e) {
    const t = (e.touches && e.touches[0]) || (e.changedTouches && e.changedTouches[0]);
    if (!t) return;
    const sysInfo = wx.getSystemInfoSync();
    const dx = boboPos.pxToRpx(t.clientX, sysInfo.windowWidth) - this._dragStartXrpx;
    const dy = boboPos.pxToRpx(t.clientY, sysInfo.windowWidth) - this._dragStartYrpx;
    if (!this._longPressTriggered) {
      // 移动超 8rpx 则立即开始拖动（也取消长按定时器）
      if (boboPos.isOverDragThreshold(dx, dy, 8)) {
        this.clearLongPressTimer();
        this._longPressTriggered = true;
        this.setData({ isDragging: true });
        try { wx.vibrateShort({ type: 'light' }); } catch (e) {}
      } else {
        return;
      }
    }
    // 拖动中
    const screenHRpx = boboPos.calcScreenHeightRpx(sysInfo);
    const safe = boboPos.clampBoboPosition(
      this._dragOriginLeft + dx,
      this._dragOriginTop + dy,
      { boboSize: this.data.BOBO_SIZE_RPX, screenHeightRpx: screenHRpx }
    );
    this.setData({ boboStyle: { left: safe.x + 'rpx', top: safe.y + 'rpx' } });
  },

  onBoboTouchEnd() {
    this.clearLongPressTimer();
    if (this._longPressTriggered && this.data.isDragging) {
      // 落点：持久化
      this.persistBoboPosition();
      this.setData({ isDragging: false });
    }
  },

  onBoboLongPress() {
    // 备用：兜底触发拖动（如果用户按住不放且 move 事件不响应）
    if (!this._longPressTriggered) {
      this._longPressTriggered = true;
      this.setData({ isDragging: true });
      try { wx.vibrateShort({ type: 'light' }); } catch (e) {}
    }
  },

  onBoboTap() {
    // 点击（非拖动）：给反馈
    if (this._longPressTriggered) return;
    try { bobo.incrementInteractionCount(); } catch (e) {}
    // 切换到 happy 1.5 秒后回到 normal
    this.setBoboExpression(bobo.EXPRESSIONS.HAPPY);
    if (this._boboExpressionTimer) clearTimeout(this._boboExpressionTimer);
    this._boboExpressionTimer = setTimeout(() => {
      this.setBoboExpression(bobo.EXPRESSIONS.NORMAL);
    }, 1500);
  },

  clearLongPressTimer() {
    if (this._longPressTimer) {
      clearTimeout(this._longPressTimer);
      this._longPressTimer = null;
    }
  },

  /**
   * 把当前波波位置持久化到 AppSettings
   */
  persistBoboPosition() {
    try {
      const leftRpx = parseFloat(this.data.boboStyle.left);
      const topRpx = parseFloat(this.data.boboStyle.top);
      if (!isFinite(leftRpx) || !isFinite(topRpx)) return;
      const settings = appSettingsRepository.getSettings();
      settings.boboPosition = { x: leftRpx, y: topRpx };
      appSettingsRepository.saveSettings(settings);
    } catch (e) {
      console.error('[home] persistBoboPosition error:', e);
    }
  }
});
