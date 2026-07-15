const { recordRepository } = require('../../data/repositories/index.js');
const { BRISTOL_TYPES, BRISTOL_COLORS, getBristolHealthStatus } = require('../../utils/constants.js');
const { getAverageBristolType, getBristolDistribution, getRecentRecords, getHealthAnalysis } = require('../../utils/health-analyzer.js');
const { formatTime, formatDate, getWeekStart } = require('../../utils/date-utils.js');

const app = getApp();

/**
 * 修复 PT-mp-009：直接在本页内联实现"本周次数"过滤。
 * 双层防御：
 *   1) 强制 Number() 转换 timestamp
 *   2) 排除 t > nowMs 的未来时间（脏数据防护）
 *   3) 排除 t <= 0 的非法时间
 */
function computeWeekFrequency(records) {
  if (!Array.isArray(records) || records.length === 0) return 0;
  const weekStart = Math.floor(Number(getWeekStart()));
  const nowMs = Date.now();
  if (!isFinite(weekStart) || !isFinite(nowMs)) return 0;
  let count = 0;
  for (let i = 0; i < records.length; i++) {
    const r = records[i];
    if (!r) continue;
    const t = Math.floor(Number(r.timestamp));
    if (!isFinite(t) || t <= 0) continue;
    if (t > nowMs) continue; // 排除未来时间
    if (t >= weekStart) count++;
  }
  return count;
}

Page({
  data: {
    totalRecords: 0,
    weekFrequency: 0,
    avgBristol: null,
    healthAnalysis: null,
    bristolDistribution: [],
    bristolColors: BRISTOL_COLORS,
    recentRecords: [],
    hasEnoughData: false
  },

  onShow() {
    this.loadData();
  },

  loadData() {
    const records = recordRepository.getAllRecords();
    // 修复 PT-mp-009：直接用本页内联 computeWeekFrequency 计算本周次数
    const weekFreq = computeWeekFrequency(records);
    const avg = getAverageBristolType(records);
    const distribution = getBristolDistribution(records);
    const recent = getRecentRecords(records, 5);
    const analysis = getHealthAnalysis(records);

    // 调试日志：方便用户从控制台看到真实值
    if (typeof console !== 'undefined' && console.log) {
      const weekStart = getWeekStart();
      console.log('[insights] totalRecords=' + records.length + ', weekFrequency=' + weekFreq);
      console.log('[insights] weekStart=' + new Date(weekStart).toISOString() + ' (ts=' + weekStart + ')');
      console.log('[insights] now=' + new Date().toISOString() + ' (ts=' + Date.now() + ')');
      console.log('[insights] sample records (前5条):');
      for (let i = 0; i < Math.min(5, records.length); i++) {
        const r = records[i];
        console.log('  [' + i + '] ts=' + r.timestamp + ' (' + new Date(r.timestamp).toISOString() + ') inWeek=' + (Number(r.timestamp) >= weekStart));
      }
    }

    const bristolDistribution = BRISTOL_TYPES.map(t => ({
      type: t.type,
      name: t.name,
      count: distribution[t.type] || 0,
      color: BRISTOL_COLORS[t.type]
    }));

    const recentRecords = recent.map(r => {
      const health = getBristolHealthStatus(r.bristolType);
      return {
        id: r.id,
        typeName: BRISTOL_TYPES.find(t => t.type === r.bristolType)?.name || '未知',
        bristolColor: BRISTOL_COLORS[r.bristolType] || '#999',
        timeText: formatTime(r.timestamp) + ' · ' + formatDate(r.timestamp, 'MM-DD'),
        colorName: this.getColorName(r.color),
        colorHex: this.getColorHex(r.color),
        // V0.2.0 身体感受
        painLevel: Number(r.painLevel) || 0,
        note: r.note || '',
        // 兼容保留
        healthStatus: health.status,
        healthColor: health.color
      };
    });

    // ===== V0.2.0 身体感受统计 =====
    const painLevels = records.map(r => Number(r.painLevel) || 0);
    const avgPain = painLevels.length > 0 ? painLevels.reduce((a, b) => a + b, 0) / painLevels.length : 0;
    const swellingCount = records.filter(r => r && (r.swelling === true || r.swelling === 1)).length;
    const residueCount = records.filter(r => r && (r.residue === true || r.residue === 1)).length;
    const unfinishedCount = records.filter(r => r && (r.unfinished === true || r.unfinished === 1)).length;
    const denom = Math.max(1, records.length);
    const swellingRate = swellingCount / denom;
    const residueRate = residueCount / denom;
    const unfinishedRate = unfinishedCount / denom;

    // ===== V0.2.0 近 7 天疼痛柱状图 =====
    const painTrendBars = [];
    const nowMs = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;
    for (let i = 6; i >= 0; i--) {
      const dayStart = new Date(nowMs - i * oneDayMs);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = dayStart.getTime() + oneDayMs;
      const dayRecords = records.filter(r => {
        const t = Number(r && r.timestamp);
        return isFinite(t) && t >= dayStart.getTime() && t < dayEnd;
      });
      const dayPains = dayRecords.map(r => Number(r.painLevel) || 0);
      const dayAvg = dayPains.length > 0 ? dayPains.reduce((a, b) => a + b, 0) / dayPains.length : 0;
      let levelClass = 'lv-0';
      if (dayAvg >= 0.5 && dayAvg < 1.5) levelClass = 'lv-1';
      else if (dayAvg >= 1.5 && dayAvg < 2.5) levelClass = 'lv-2';
      else if (dayAvg >= 2.5) levelClass = 'lv-3';
      painTrendBars.push({
        date: dayStart.toISOString().slice(0, 10),
        dateLabel: (dayStart.getMonth() + 1) + '/' + dayStart.getDate(),
        value: dayAvg,
        levelClass
      });
    }

    this.setData({
      totalRecords: records.length,
      weekFrequency: weekFreq,
      avgBristol: avg !== null ? avg.toFixed(1) : '-',
      healthAnalysis: analysis,
      bristolDistribution,
      recentRecords,
      // 保留字段供向后兼容
      hasEnoughData: records.length >= 3,
      // V0.2.0 身体感受
      avgPainLevelText: avgPain === 0 ? '0' : avgPain.toFixed(1),
      avgPainColor: avgPain >= 2 ? '#E57373' : (avgPain >= 1 ? '#FFB74D' : '#66BB6A'),
      swellingRateText: Math.round(swellingRate * 100) + '%',
      swellingRateColor: swellingRate >= 0.5 ? '#FFB74D' : '#999',
      residueRateText: Math.round(residueRate * 100) + '%',
      residueRateColor: residueRate >= 0.5 ? '#FFB74D' : '#999',
      unfinishedRateText: Math.round(unfinishedRate * 100) + '%',
      unfinishedRateColor: unfinishedRate >= 0.5 ? '#FFB74D' : '#999',
      painTrendBars
    });
  },

  getColorName(colorKey) {
    const map = { brown: '棕色', yellow: '黄色', green: '绿色', black: '黑色', red: '红色', gray: '灰色', white: '白色' };
    return map[colorKey] || colorKey;
  },

  getColorHex(colorKey) {
    const map = {
      brown: '#6B4226',
      yellow: '#D4A017',
      green: '#5B8C3E',
      black: '#2C2C2C',
      red: '#C0392B',
      gray: '#7F8C8D',
      white: '#BDC3C7'
    };
    return map[colorKey] || '#999';
  },

  onRecordTap(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({ url: `/pages/record-detail/record-detail?id=${id}` });
  }
});
