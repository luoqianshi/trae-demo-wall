/* ============================================================
   report.js — 报告生成与 AI 洞察模块
   ============================================================ */
const ReportGenerator = (() => {

  // 噪音等级判定
  function grade(db) {
    if (db < 35) return { label: "安静", color: "mint", char: "A" };
    if (db < 45) return { label: "轻度", color: "mint", char: "B" };
    if (db < 55) return { label: "警戒", color: "amber", char: "C" };
    if (db < 65) return { label: "偏吵", color: "amber", char: "D" };
    return { label: "嘈杂", color: "coral", char: "E" };
  }

  // 安静占比（< 阈值的采样比例）
  function quietRatio(session, threshold) {
    if (!session.samples.length) return 0;
    const quiet = session.samples.filter(s => s.db < threshold).length;
    return Math.round(quiet / session.samples.length * 100);
  }

  // 单会话统计
  function sessionStats(session) {
    const threshold = Storage.getSettings().threshold;
    return {
      peak: session.peakDb,
      avg: session.avgDb,
      duration: session.durationSec,
      quietRatio: quietRatio(session, threshold),
      eventCount: session.events.length,
      grade: grade(session.avgDb)
    };
  }

  // 找最吵 Top3 时段
  function topLoudHours(sessions) {
    const buckets = {};
    sessions.forEach(s => {
      s.samples.forEach(sm => {
        const h = new Date(sm.t).getHours();
        if (!buckets[h]) buckets[h] = { hour: h, max: 0, count: 0, sum: 0 };
        buckets[h].max = Math.max(buckets[h].max, sm.db);
        buckets[h].sum += sm.db;
        buckets[h].count++;
      });
    });
    return Object.values(buckets)
      .map(b => ({ hour: b.hour, max: b.max, avg: b.sum / b.count }))
      .sort((a, b) => b.max - a.max)
      .slice(0, 3);
  }

  // AI 洞察文字生成（基于规则）
  function generateInsight(session, allSessions) {
    if (!session) return "请先选择一次会话。";
    const stats = sessionStats(session);
    const threshold = Storage.getSettings().threshold;
    const peakTime = session.peakTime ? new Date(session.peakTime) : null;
    const peakStr = peakTime
      ? `${peakTime.getHours().toString().padStart(2,"0")}:${peakTime.getMinutes().toString().padStart(2,"0")}`
      : "未知";

    // 声源推测
    const events = session.events || [];
    const labelCounts = {};
    events.forEach(e => {
      const l = e.label || "未知";
      labelCounts[l] = (labelCounts[l] || 0) + 1;
    });
    const topLabel = Object.entries(labelCounts).sort((a,b)=>b[1]-a[1])[0];
    const topLabelStr = topLabel ? topLabel[0] : null;

    // 时段判断
    const startH = new Date(session.startTime).getHours();
    const isNight = startH >= 22 || startH < 6;
    const periodStr = isNight ? "深夜时段" : (startH >= 18 ? "傍晚时段" : (startH >= 7 && startH < 18 ? "白天时段" : "夜间时段"));

    // 环比：与同类型历史会话均值对比
    const histAvg = allSessions
      .filter(s => s.id !== session.id)
      .map(s => s.avgDb);
    const histMean = histAvg.length ? histAvg.reduce((a,b)=>a+b,0)/histAvg.length : stats.avg;
    const diff = stats.avg - histMean;
    const trendStr = histAvg.length === 0
      ? "暂无历史对比"
      : (diff > 2 ? `比历史平均<span style="color:var(--coral-soft)">高出 ${diff.toFixed(1)} dB</span>，噪音有所加重`
         : diff < -2 ? `比历史平均<span style="color:var(--mint-soft)">降低 ${Math.abs(diff).toFixed(1)} dB</span>，有所改善`
         : "与历史平均持平，声环境稳定");

    const quietStr = stats.quietRatio >= 70
      ? `安静时段占比 <strong>${stats.quietRatio}%</strong>，整体可控`
      : stats.quietRatio >= 40
      ? `安静时段占比 <strong>${stats.quietRatio}%</strong>，间歇性噪音明显`
      : `安静时段仅 <strong>${stats.quietRatio}%</strong>，噪音持续偏强`;

    const sourceStr = topLabelStr
      ? `标记事件中「${topLabelStr}」出现最多，可能是主要声源`
      : "本次未捕捉到明显标记事件";

    const advice = isNight && stats.peak >= threshold
      ? `建议在 <strong>${peakStr}</strong> 前后留意楼上活动，可凭此时段数据与邻居友好沟通`
      : stats.quietRatio < 40
      ? "建议连续监测数天，确认噪音规律后再决定是否加装隔音"
      : "当前声环境尚可，保持关注即可";

    return `${periodStr}录制 ${formatDuration(stats.duration)}，峰值 <strong>${stats.peak} dB</strong>（${peakStr}），平均 <strong>${stats.avg} dB</strong>。${quietStr}。${sourceStr}。${trendStr}。${advice}。`;
  }

  // 洞察标签
  function insightTags(session) {
    if (!session) return [];
    const tags = [];
    const stats = sessionStats(session);
    const startH = new Date(session.startTime).getHours();
    if (startH >= 22 || startH < 6) tags.push("深夜");
    if (stats.peak >= 60) tags.push("超 60 dB");
    if (stats.quietRatio >= 70) tags.push("整体安静");
    if (stats.eventCount > 5) tags.push(`事件 ${stats.eventCount} 次`);
    const labels = new Set((session.events||[]).map(e=>e.label));
    labels.forEach(l => { if (l && l !== "自动标记" && l !== "手动标记") tags.push(l); });
    return tags.slice(0, 6);
  }

  // 日汇总
  function dailySummary(dateStr, sessions) {
    const day = new Date(dateStr); day.setHours(0,0,0,0);
    const next = new Date(day.getTime() + 86400000);
    const daySessions = sessions.filter(s => {
      const t = new Date(s.startTime);
      return t >= day && t < next;
    });
    if (!daySessions.length) return null;
    const allSamples = daySessions.flatMap(s => s.samples);
    const peak = Math.max(...allSamples.map(s => s.db));
    const avg = allSamples.reduce((a,b)=>a+b.db,0) / allSamples.length;
    return { date: day, peak, avg, count: daySessions.length, sessions: daySessions };
  }

  // 周对比（本周 vs 上周）
  function weeklyComparison(sessions) {
    const today = new Date(); today.setHours(0,0,0,0);
    const weekAgo = new Date(today.getTime() - 7*86400000);
    const twoWeekAgo = new Date(today.getTime() - 14*86400000);

    const thisWeek = sessions.filter(s => { const t = new Date(s.startTime); return t >= weekAgo && t < today; });
    const lastWeek = sessions.filter(s => { const t = new Date(s.startTime); return t >= twoWeekAgo && t < weekAgo; });

    function stats(list) {
      if (!list.length) return { avg: 0, peak: 0, count: 0 };
      const allSamples = list.flatMap(s => s.samples);
      if (!allSamples.length) return { avg: 0, peak: 0, count: list.length };
      return {
        avg: allSamples.reduce((a,b)=>a+b.db,0) / allSamples.length,
        peak: Math.max(...allSamples.map(s=>s.db)),
        count: list.length
      };
    }
    const tw = stats(thisWeek);
    const lw = stats(lastWeek);
    return {
      thisWeek: tw,
      lastWeek: lw,
      avgDiff: tw.avg - lw.avg,
      peakDiff: tw.peak - lw.peak
    };
  }

  // 热力图数据：按 日 × 小时 聚合
  function heatmapData(sessions, days = 7) {
    const today = new Date(); today.setHours(0,0,0,0);
    const dates = [];
    for (let i = days - 1; i >= 0; i--) {
      dates.push(new Date(today.getTime() - i * 86400000));
    }
    const grid = []; // [dateIndex][hour] = avg db
    dates.forEach((d, di) => {
      const next = new Date(d.getTime() + 86400000);
      const daySessions = sessions.filter(s => {
        const t = new Date(s.startTime); return t >= d && t < next;
      });
      const hours = new Array(24).fill(null).map(()=>({sum:0,count:0}));
      daySessions.forEach(s => {
        s.samples.forEach(sm => {
          const h = new Date(sm.t).getHours();
          hours[h].sum += sm.db;
          hours[h].count++;
        });
      });
      grid.push({
        date: d,
        hours: hours.map(h => h.count ? h.sum / h.count : null)
      });
    });
    return grid;
  }

  function formatDuration(sec) {
    if (sec < 60) return sec + " 秒";
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    if (m < 60) return s ? `${m} 分 ${s} 秒` : `${m} 分钟`;
    const h = Math.floor(m / 60);
    const rm = m % 60;
    return `${h} 小时 ${rm} 分`;
  }

  return {
    grade, quietRatio, sessionStats, topLoudHours,
    generateInsight, insightTags,
    dailySummary, weeklyComparison, heatmapData,
    formatDuration
  };
})();
