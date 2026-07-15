const { getBristolHealthStatus, STOOL_COLOR_NAME_MAP } = require('./constants.js');
const { getWeekStart, getEndOfToday, getStartOfToday } = require('./date-utils.js');

// 计算本周记录（按本地时区"本周一 0:00"起的绝对毫秒数过滤）
// 修复 PT-mp-009：双层防御
//   1) 强制 Number() + isFinite() 转换 timestamp
//   2) 排除 r.timestamp > now 的未来时间（脏数据防护）
//   3) weekStart 用 Math.floor 避免浮点
function getThisWeekRecords(records) {
  if (!Array.isArray(records)) return [];
  const weekStart = Math.floor(Number(getWeekStart()));
  const nowMs = Date.now();
  if (!isFinite(weekStart) || !isFinite(nowMs)) return [];
  return records.filter(r => {
    if (!r) return false;
    const t = Math.floor(Number(r.timestamp));
    if (!isFinite(t) || t <= 0) return false;
    if (t > nowMs) return false; // 排除未来时间（脏数据）
    return t >= weekStart;
  });
}

// 计算本周频率
function getThisWeekFrequency(records) {
  return getThisWeekRecords(records).length;
}

// 计算本月记录（防御脏数据）
function getThisMonthRecords(records) {
  if (!Array.isArray(records)) return [];
  const now = new Date();
  const monthStart = Math.floor(Number(new Date(now.getFullYear(), now.getMonth(), 1).getTime()));
  const nowMs = Date.now();
  if (!isFinite(monthStart) || !isFinite(nowMs)) return [];
  return records.filter(r => {
    if (!r) return false;
    const t = Math.floor(Number(r.timestamp));
    if (!isFinite(t) || t <= 0) return false;
    if (t > nowMs) return false;
    return t >= monthStart;
  });
}

// 计算平均 Bristol 类型
function getAverageBristolType(records) {
  if (records.length === 0) return null;
  const sum = records.reduce((acc, r) => acc + r.bristolType, 0);
  return Math.round((sum / records.length) * 10) / 10;
}

// Bristol 类型分布
function getBristolDistribution(records) {
  const dist = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0 };
  records.forEach(r => {
    if (dist[r.bristolType] !== undefined) {
      dist[r.bristolType]++;
    }
  });
  return dist;
}

// 获取最近 N 条记录（按 timestamp 降序，防御 timestamp 为字符串/非数字）
function getRecentRecords(records, count = 5) {
  if (!Array.isArray(records)) return [];
  return records
    .filter(r => isFinite(Number(r && r.timestamp)))
    .sort((a, b) => Number(b.timestamp) - Number(a.timestamp))
    .slice(0, count);
}

// 健康判断
// 修复 PT-mp-insights-001：分层给出洞察，让用户在 0/1/2 条时也看到反馈
//   0 条：尚未开始
//   1 条：刚开始记录
//   2 条：继续记录
//   3+ 条：进入分析模式
// V0.2.0：在 Bristol + 颜色基础上叠加"身体感受"信号
//   - painLevel >= 2 出现 ≥2 次 → 升级为"请关注"
//   - swelling/residue/unfinished 任一 ≥ 50% → "建议关注消化"
//   - t6/t7 + painLevel>=1 → 升级到"请关注"
function getHealthAnalysis(records) {
  if (!Array.isArray(records)) records = [];
  const n = records.length;

  if (n === 0) {
    return {
      status: '等待记录',
      color: '#80868b',
      advice: '点击首页下方 "+" 按钮，开始你的第一次记录吧',
      level: 'empty'
    };
  }
  if (n === 1) {
    return {
      status: '已记录 1 次',
      color: '#4285F4',
      advice: '再记录 2 次即可开启健康趋势分析',
      level: 'insufficient'
    };
  }
  if (n === 2) {
    return {
      status: '已记录 2 次',
      color: '#4285F4',
      advice: '再记录 1 次即可开启健康趋势分析',
      level: 'insufficient'
    };
  }

  const weekCount = getThisWeekFrequency(records);
  const avgType = getAverageBristolType(records);
  const recent = getRecentRecords(records, 3);

  // ===== V0.2.0 身体感受信号（基于 recent 3 条 + 最近全部）=====
  // 中度及以上疼痛出现次数（painLevel >= 2）
  const painHighCount = records.filter(r => Number(r && r.painLevel) >= 2).length;
  // 腹胀/残留/排不尽 任一出现比例
  const swellingRate = countTrue(records, 'swelling') / Math.max(1, records.length);
  const residueRate = countTrue(records, 'residue') / Math.max(1, records.length);
  const unfinishedRate = countTrue(records, 'unfinished') / Math.max(1, records.length);
  // 升级信号：t6/t7 且疼痛 >= 1
  const wateryPain = records.filter(r =>
    (Number(r && r.bristolType) === 6 || Number(r && r.bristolType) === 7) &&
    Number(r && r.painLevel) >= 1
  ).length;

  // 1) 严重疼痛出现 ≥2 次 → 红色
  if (painHighCount >= 2) {
    return {
      status: '请关注',
      color: '#EA4335',
      advice: '近期多次出现中度以上疼痛，建议咨询医生。',
      level: 'alert'
    };
  }
  // 2) 颜色异常检测
  const abnormalColor = recent.find(r => r.color === 'black' || r.color === 'red');
  if (abnormalColor) {
    return {
      status: '请关注',
      color: '#EA4335',
      advice: '最近发现异常颜色，建议尽快咨询医生。',
      level: 'alert'
    };
  }
  // 3) 水样/糊状 + 疼痛 → 升级
  if (wateryPain >= 1) {
    return {
      status: '请关注',
      color: '#EA4335',
      advice: '稀便伴随疼痛，提示消化或肠道不适，建议咨询医生。',
      level: 'alert'
    };
  }
  // 4) 腹胀/残留/不尽 频繁出现 → 黄色
  if (swellingRate >= 0.5 || residueRate >= 0.5 || unfinishedRate >= 0.5) {
    return {
      status: '建议关注',
      color: '#FBBC04',
      advice: '近期频繁出现腹胀/残留/排不尽感，建议关注饮食和作息。',
      level: 'warning'
    };
  }

  // ===== 原有判断逻辑（保留） =====
  // 频率判断
  if (weekCount < 3) {
    return {
      status: '频率偏低',
      color: '#FBBC04',
      advice: '本周排便次数偏少，建议关注饮食和运动。',
      level: 'warning'
    };
  }
  if (weekCount > 21) {
    return {
      status: '频率偏高',
      color: '#FBBC04',
      advice: '本周排便次数偏多，如持续建议咨询医生。',
      level: 'warning'
    };
  }

  // Bristol 类型判断
  if (avgType !== null) {
    if (avgType <= 2.5) {
      return {
        status: '偏干',
        color: '#FBBC04',
        advice: '您的排便偏干，建议多喝水、增加膳食纤维。',
        level: 'warning'
      };
    }
    if (avgType >= 5.5) {
      return {
        status: '偏稀',
        color: '#FBBC04',
        advice: '您的排便偏稀，如持续出现建议咨询医生。',
        level: 'warning'
      };
    }
  }

  return {
    status: '正常',
    color: '#34A853',
    advice: '您的排便状况看起来不错，继续保持健康的生活习惯！',
    level: 'good'
  };
}

// V0.2.0 工具函数：计算 records 中指定布尔字段为真值的数量
//   - 严格只对布尔字段有效（swelling/residue/unfinished）
//   - 老数据可能存的是 1（从 storage 归一化后的值），所以兼容 === 1
//   - 对数字字段（如 painLevel）即使值是 1 也不计，行为安全
function countTrue(records, field) {
  if (!Array.isArray(records)) return 0;
  let n = 0;
  for (let i = 0; i < records.length; i++) {
    const r = records[i];
    if (!r) continue;
    const v = r[field];
    if (v === true || v === 1) n++;
  }
  return n;
}

module.exports = {
  getThisWeekRecords, getThisWeekFrequency,
  getThisMonthRecords, getAverageBristolType,
  getBristolDistribution, getRecentRecords,
  getHealthAnalysis,
  // V0.2.0 工具函数（暴露给上层复用）
  countTrue
};
