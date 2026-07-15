// pages/record/record.js
// 修复 PT-mp-001/003：textarea 双向绑定，避免持续 setData
// 修复 PT-mp-dev-002：时间 picker 颗粒度到分钟
// 修复 PT-mp-dev-004：Bristol UI 形状代替数字编号
// 修复 PT-mp-001/004/005：editId 不再 parseInt
// V0.2.0：身体感受（疼痛/腹胀/残留/排不尽）+ 波波表情反馈

const { recordRepository, appSettingsRepository } = require('../../data/repositories/index.js');
const { BRISTOL_TYPES, BRISTOL_COLORS, COLORS, STOOL_COLORS } = require('../../utils/constants.js');
const { formatDateTime, formatTime } = require('../../utils/date-utils.js');
const bobo = require('../../utils/bobo.js');

// UI 形状（emoji-like 文字符号）
const BRISTOL_SHAPES = {
  1: '⚫', 2: '➖', 3: '➖', 4: '➖', 5: '◯', 6: '◎', 7: '∿'
};

// UI 颜色配置 - 上排 3 + 下排 4 交叉错开
const COLOR_ITEMS = [
  // 上排（3 个）
  { key: 'brown', name: '棕色', value: '#6B4226' },
  { key: 'yellow', name: '黄色', value: '#D4A017' },
  { key: 'green', name: '绿色', value: '#5B8C3E' },
  // 下排（4 个）
  { key: 'black', name: '黑色', value: '#2C2C2C' },
  { key: 'red', name: '红色', value: '#C0392B' },
  { key: 'gray', name: '灰色', value: '#7F8C8D' },
  { key: 'white', name: '灰白', value: '#BDC3C7' }
];
const COLORS_TOP = COLOR_ITEMS.slice(0, 3);
const COLORS_BOTTOM = COLOR_ITEMS.slice(3, 7);

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0') + ' 时');
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0') + ' 分');

Page({
  data: {
    isEdit: false,
    editingId: null,
    timestamp: 0,
    timeText: '',
    timePickerIndex: [0, 0],
    timePickerRange: [HOURS, MINUTES],
    bristolTypes: BRISTOL_TYPES.map(t => ({
      type: t.type,
      name: t.name,
      shortDesc: t.shortDesc,
      color: BRISTOL_COLORS[t.type] || '#999',
      shapeIcon: BRISTOL_SHAPES[t.type] || '●'
    })),
    selectedBristol: null,
    colors: COLOR_ITEMS,
    colorsTop: COLORS_TOP,
    colorsBottom: COLORS_BOTTOM,
    selectedColor: null,
    note: '',
    // V0.2.0 身体感受
    painLevel: 0,        // 0-3
    swelling: false,     // 腹胀
    residue: false,      // 残留
    unfinished: false,   // 排不尽
    // V0.2.0 波波
    boboExpression: bobo.EXPRESSIONS.NORMAL,
    boboComment: '波波在看你记录哦~',
    boboBubbleVisible: true
  },

  onLoad(options) {
    if (options.editId) {
      this.loadForEdit(options.editId);
    } else if (options.year && options.month && options.day) {
      const y = parseInt(options.year);
      const m = parseInt(options.month);
      const d = parseInt(options.day);
      const now = new Date();
      const ts = new Date(y, m, d, now.getHours(), now.getMinutes(), 0, 0).getTime();
      this.initForCreate(ts);
    } else {
      this.initForCreate(Date.now());
    }
  },

  initForCreate(timestamp) {
    this.setData({
      isEdit: false,
      editingId: null,
      timestamp,
      ...this.computeTimeParts(timestamp),
      selectedBristol: null,
      selectedColor: null,
      note: ''
    });
  },

  loadForEdit(editId) {
    const record = recordRepository.getRecordById(editId);
    if (!record) {
      wx.showToast({ title: '记录不存在', icon: 'none' });
      setTimeout(() => wx.navigateBack(), 800);
      return;
    }
    this.setData({
      isEdit: true,
      editingId: record.id,
      timestamp: record.timestamp,
      ...this.computeTimeParts(record.timestamp),
      selectedBristol: record.bristolType,
      selectedColor: record.color,
      note: record.note || '',
      // V0.2.0 身体感受回填
      painLevel: Number(record.painLevel) || 0,
      swelling: !!record.swelling,
      residue: !!record.residue,
      unfinished: !!record.unfinished
    });
    this.refreshBobo();
  },

  /**
   * 从 timestamp 分解到 hour/minute 用于 picker
   */
  computeTimeParts(timestamp) {
    const d = new Date(timestamp);
    const hour = d.getHours();
    const minute = d.getMinutes();
    return {
      timeText: `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`,
      timePickerIndex: [hour, minute]
    };
  },

  onTimeColumnChange(e) {
    // 滚动时不更新 timestamp，避免与 multi-select picker 冲突
  },

  onTimeChange(e) {
    const [h, m] = e.detail.value;
    const d = new Date(this.data.timestamp);
    d.setHours(parseInt(h, 10), parseInt(m, 10), 0, 0);
    this.setData({
      timestamp: d.getTime(),
      ...this.computeTimeParts(d.getTime()),
      timePickerIndex: [parseInt(h, 10), parseInt(m, 10)]
    });
  },

  onBristolSelect(e) {
    const { type } = e.currentTarget.dataset;
    const t = parseInt(type, 10);
    this.setData({ selectedBristol: t });
    // V0.2.0：选完 Bristol 后波波给反馈（基于 bristol + 已选颜色 + 已选身体感受）
    this.refreshBobo();
  },

  onColorSelect(e) {
    const { color } = e.currentTarget.dataset;
    this.setData({ selectedColor: color });
    // V0.2.0：颜色变化时刷新波波反馈
    this.refreshBobo();
  },

  // V0.2.0 身体感受 - 4 个 toggle
  onPainLevelSelect(e) {
    const { level } = e.currentTarget.dataset;
    const lv = parseInt(level, 10);
    this.setData({ painLevel: lv });
    this.refreshBobo();
  },

  onSwellingToggle() {
    this.setData({ swelling: !this.data.swelling });
    this.refreshBobo();
  },

  onResidueToggle() {
    this.setData({ residue: !this.data.residue });
    this.refreshBobo();
  },

  onUnfinishedToggle() {
    this.setData({ unfinished: !this.data.unfinished });
    this.refreshBobo();
  },

  onBubbleDismiss() {
    this.setData({ boboBubbleVisible: false });
    try { bobo.incrementInteractionCount(); } catch (e) {}
  },

  /**
   * V0.2.0：根据当前表单状态更新波波表情 + 点评
   */
  refreshBobo() {
    try {
      const settings = appSettingsRepository.getSettings();
      if (!settings || !settings.boboEnabled) {
        this.setData({ boboExpression: bobo.EXPRESSIONS.NORMAL, boboComment: '' });
        return;
      }
      const ctx = {
        bristolType: this.data.selectedBristol,
        color: this.data.selectedColor,
        painLevel: this.data.painLevel,
        swelling: this.data.swelling,
        residue: this.data.residue,
        unfinished: this.data.unfinished
      };
      const expression = bobo.pickExpression(ctx);
      const comment = bobo.generateComment(ctx);
      this.setData({ boboExpression: expression, boboComment: comment });
    } catch (e) {
      // 容错：不阻塞主流程
    }
  },

  onNoteInput(e) {
    // 修复 PT-mp-001：实时同步输入
    this.setData({ note: e.detail.value });
  },

  onNoteBlur(e) {
    // blur 时最终确认（无副作用）
    if (e.detail.value !== this.data.note) {
      this.setData({ note: e.detail.value });
    }
  },

  onNoteConfirm(e) {
    // 点完成按钮收起键盘
    this.setData({ note: e.detail.value });
  },

  onCancel() {
    wx.navigateBack();
  },

  onSave() {
    const { selectedBristol, selectedColor, timestamp, note, isEdit, editingId,
            painLevel, swelling, residue, unfinished } = this.data;

    if (!selectedBristol) {
      wx.showToast({ title: '请选择 Bristol 类型', icon: 'none' });
      return;
    }
    if (!selectedColor) {
      wx.showToast({ title: '请选择颜色', icon: 'none' });
      return;
    }

    const payload = {
      bristolType: selectedBristol,
      color: selectedColor,
      timestamp: timestamp || Date.now(),
      note: (note || '').trim(),
      // V0.2.0 身体感受
      painLevel: Number(painLevel) || 0,
      swelling: !!swelling,
      residue: !!residue,
      unfinished: !!unfinished
    };

    if (isEdit && editingId) {
      payload.id = editingId;
      const updated = recordRepository.updateRecord(payload);
      if (updated) {
        wx.showToast({ title: '已更新', icon: 'success' });
        setTimeout(() => wx.navigateBack(), 600);
      } else {
        wx.showToast({ title: '更新失败', icon: 'none' });
      }
    } else {
      recordRepository.insertRecord(payload);
      // 修复 PT-mp-welcome-004：首次成功记录后标记 FAB 气泡已看过
      // 后续回到 home 不会再显示"点击这里记录"的提示
      try {
        const settings = appSettingsRepository.getSettings();
        if (!settings.hasSeenFabHint) {
          settings.hasSeenFabHint = true;
          appSettingsRepository.saveSettings(settings);
        }
      } catch (e) {
        console.error('[record] save hasSeenFabHint error:', e);
      }
      wx.showToast({ title: '已保存', icon: 'success' });
      setTimeout(() => wx.navigateBack(), 600);
    }
  }
});
