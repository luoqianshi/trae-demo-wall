// pages/record-detail/record-detail.js
// 修复 PT-mp-004/005：直接用字符串 id 而非 parseInt
// V0.2.0：显示身体感受 + 波波点评

const { recordRepository } = require('../../data/repositories/index.js');
const { BRISTOL_TYPES, STOOL_COLORS, getBristolHealthStatus } = require('../../utils/constants.js');
const { formatDateTime } = require('../../utils/date-utils.js');
const bobo = require('../../utils/bobo.js');

Page({
  data: {
    record: null,
    bristolName: '',
    bristolDesc: '',
    colorName: '',
    healthStatus: null
  },

  onLoad(options) {
    // 修复：使用原始字符串 id（不要 parseInt，会丢失 _xxx 后缀）
    this.loadRecord(options.id);
  },

  loadRecord(id) {
    if (!id) {
      wx.showToast({ title: '记录不存在', icon: 'none' });
      setTimeout(() => wx.navigateBack(), 800);
      return;
    }

    const record = recordRepository.getRecordById(id);
    if (!record) {
      wx.showToast({ title: '记录不存在', icon: 'none' });
      setTimeout(() => wx.navigateBack(), 800);
      return;
    }

    const bristol = BRISTOL_TYPES.find(t => t.type === record.bristolType);
    const color = STOOL_COLORS.find(c => c.key === record.color);
    const health = getBristolHealthStatus(record.bristolType);

    // V0.2.0 身体感受字段
    const painLevel = Number(record.painLevel) || 0;
    const swelling = !!record.swelling;
    const residue = !!record.residue;
    const unfinished = !!record.unfinished;
    const hasFeelings = painLevel > 0 || swelling || residue || unfinished;
    // V0.2.0 波波点评
    const boboCtx = {
      bristolType: record.bristolType,
      color: record.color,
      painLevel, swelling, residue, unfinished
    };
    const boboExpression = bobo.pickExpression(boboCtx);
    const boboComment = bobo.generateComment(boboCtx);

    this.setData({
      record: {
        ...record.toObject(),
        dateTimeText: formatDateTime(record.timestamp)
      },
      bristolName: bristol?.name || '',
      bristolDesc: bristol?.description || '',
      colorName: color?.name || '',
      healthStatus: health,
      // V0.2.0
      painLevel,
      swelling,
      residue,
      unfinished,
      hasFeelings,
      boboExpression,
      boboComment
    });
  },

  onEdit() {
    if (!this.data.record) return;
    wx.navigateTo({ url: `/pages/record/record?editId=${this.data.record.id}` });
  },

  onDelete() {
    if (!this.data.record) return;
    const self = this;
    wx.showModal({
      title: '确认删除',
      content: '删除后无法恢复，是否继续？',
      confirmColor: '#EA4335',
      success: (res) => {
        if (res.confirm) {
          recordRepository.deleteRecord(self.data.record.id);
          wx.showToast({ title: '已删除', icon: 'success' });
          setTimeout(() => wx.navigateBack(), 800);
        }
      }
    });
  }
});
