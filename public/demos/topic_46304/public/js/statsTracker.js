/* ============================================================
 * StatsTracker - 写作统计追踪器
 *
 * 对标参考项目 stats_tracker.php（427 行）
 *
 * 核心能力：
 *   1. record(event, data) — 记录生成事件（开始/完成/错误/重写等）
 *   2. getStats() — 获取统计数据（今日/本周/本月/总计）
 *   3. report() — 生成可读统计报告
 *   4. cleanup() — 清理过期事件日志
 *
 * 数据持久化：
 *   通过 /api/settings 接口存储到数据库 settings 表，key = 'stats_data'
 *   遵循 AGENTS.md：禁止使用 localStorage 作为持久化方案
 *
 * 事件类型：
 *   generation_start / generation_complete / generation_abort
 *   chapter_start / chapter_complete / chapter_error / chapter_rewrite
 *   worldview_complete / characters_complete / outline_complete
 *   api_call / api_error
 * ============================================================ */

const StatsTracker = {
  // 内存中的事件队列（最多保留 500 条）
  events: [],
  // 聚合统计缓存
  _aggregates: null,
  // 最后一次持久化时间
  _lastSync: 0,
  // 同步间隔（30 秒，避免频繁写库）
  SYNC_INTERVAL: 30000,

  // ===== 事件常量 =====
  EVENT_TYPES: {
    GENERATION_START: 'generation_start',
    GENERATION_COMPLETE: 'generation_complete',
    GENERATION_ABORT: 'generation_abort',
    CHAPTER_START: 'chapter_start',
    CHAPTER_COMPLETE: 'chapter_complete',
    CHAPTER_ERROR: 'chapter_error',
    CHAPTER_REWRITE: 'chapter_rewrite',
    WORLDVIEW_COMPLETE: 'worldview_complete',
    CHARACTERS_COMPLETE: 'characters_complete',
    OUTLINE_COMPLETE: 'outline_complete',
    SYNOPSIS_COMPLETE: 'synopsis_complete',
    API_CALL: 'api_call',
    API_ERROR: 'api_error',
  },

  // ===== 核心方法 =====

  // 记录事件
  // event: 事件类型常量
  // data: { novelId, chapIdx, wordCount, duration, score, error, ... }
  record(event, data){
    const entry = {
      id: 'evt_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
      event,
      data: data || {},
      timestamp: Date.now(),
      // 日期标记，用于按日聚合
      dateKey: this._getDateKey(Date.now()),
    };
    this.events.push(entry);

    // 超过上限时丢弃最旧的事件
    if(this.events.length > 500){
      this.events = this.events.slice(-400);
    }

    // 清除聚合缓存（下次 getStats 会重新计算）
    this._aggregates = null;

    // 异步同步到数据库（节流）
    this._maybeSync();

    return entry;
  },

  // 获取统计数据
  // 返回 { today, week, month, total, byEvent }
  getStats(){
    if(this._aggregates) return this._aggregates;

    const now = Date.now();
    const todayKey = this._getDateKey(now);
    const weekAgo = now - 7 * 24 * 3600 * 1000;
    const monthAgo = now - 30 * 24 * 3600 * 1000;

    const stats = {
      today: { words: 0, chapters: 0, apiCalls: 0, errors: 0, events: 0 },
      week: { words: 0, chapters: 0, apiCalls: 0, errors: 0, events: 0 },
      month: { words: 0, chapters: 0, apiCalls: 0, errors: 0, events: 0 },
      total: { words: 0, chapters: 0, apiCalls: 0, errors: 0, events: 0 },
      byEvent: {},
      lastUpdated: now,
    };

    for(const evt of this.events){
      const isToday = evt.dateKey === todayKey;
      const isWeek = evt.timestamp >= weekAgo;
      const isMonth = evt.timestamp >= monthAgo;

      // 按事件类型聚合
      if(!stats.byEvent[evt.event]) stats.byEvent[evt.event] = 0;
      stats.byEvent[evt.event]++;

      // 字数累加
      const wc = evt.data.wordCount || 0;
      const isChapterComplete = evt.event === this.EVENT_TYPES.CHAPTER_COMPLETE;

      if(isToday){ stats.today.events++; stats.today.words += wc; if(isChapterComplete) stats.today.chapters++; if(evt.event === this.EVENT_TYPES.API_CALL) stats.today.apiCalls++; if(evt.event === this.EVENT_TYPES.API_ERROR || evt.event === this.EVENT_TYPES.CHAPTER_ERROR) stats.today.errors++; }
      if(isWeek){ stats.week.events++; stats.week.words += wc; if(isChapterComplete) stats.week.chapters++; if(evt.event === this.EVENT_TYPES.API_CALL) stats.week.apiCalls++; if(evt.event === this.EVENT_TYPES.API_ERROR || evt.event === this.EVENT_TYPES.CHAPTER_ERROR) stats.week.errors++; }
      if(isMonth){ stats.month.events++; stats.month.words += wc; if(isChapterComplete) stats.month.chapters++; if(evt.event === this.EVENT_TYPES.API_CALL) stats.month.apiCalls++; if(evt.event === this.EVENT_TYPES.API_ERROR || evt.event === this.EVENT_TYPES.CHAPTER_ERROR) stats.month.errors++; }
      stats.total.events++; stats.total.words += wc; if(isChapterComplete) stats.total.chapters++; if(evt.event === this.EVENT_TYPES.API_CALL) stats.total.apiCalls++; if(evt.event === this.EVENT_TYPES.API_ERROR || evt.event === this.EVENT_TYPES.CHAPTER_ERROR) stats.total.errors++;
    }

    this._aggregates = stats;
    return stats;
  },

  // 生成可读统计报告
  report(){
    const s = this.getStats();
    const lines = [];
    lines.push('=== 写作统计报告 ===');
    lines.push('');
    lines.push('【今日】');
    lines.push('  字数: ' + s.today.words);
    lines.push('  章节: ' + s.today.chapters);
    lines.push('  API调用: ' + s.today.apiCalls);
    lines.push('  错误: ' + s.today.errors);
    lines.push('');
    lines.push('【本周】');
    lines.push('  字数: ' + s.week.words);
    lines.push('  章节: ' + s.week.chapters);
    lines.push('  API调用: ' + s.week.apiCalls);
    lines.push('');
    lines.push('【本月】');
    lines.push('  字数: ' + s.month.words);
    lines.push('  章节: ' + s.month.chapters);
    lines.push('');
    lines.push('【总计】');
    lines.push('  字数: ' + s.total.words);
    lines.push('  章节: ' + s.total.chapters);
    lines.push('  API调用: ' + s.total.apiCalls);
    lines.push('  错误: ' + s.total.errors);
    lines.push('');
    lines.push('【事件分布】');
    for(const [event, count] of Object.entries(s.byEvent)){
      lines.push('  ' + event + ': ' + count);
    }
    return lines.join('\n');
  },

  // 清理过期数据
  // maxAgeDays: 保留最近 N 天的事件，默认 90 天
  cleanup(maxAgeDays){
    maxAgeDays = maxAgeDays || 90;
    const cutoff = Date.now() - maxAgeDays * 24 * 3600 * 1000;
    const before = this.events.length;
    this.events = this.events.filter(e => e.timestamp >= cutoff);
    const removed = before - this.events.length;
    if(removed > 0){
      this._aggregates = null;
      this._maybeSync();
    }
    return removed;
  },

  // ===== P2-2 v6 补全：单部小说统计方法 =====
  // 对标 Reference-php stats_tracker.php 第 79-180 行

  // 获取指定小说的历史记录
  // count: 最多返回多少条（默认全部）
  getHistory(novelId, count){
    if(!novelId) return [];
    const filtered = this.events.filter(e => e.data?.novelId === novelId);
    const sorted = filtered.sort((a, b) => a.timestamp - b.timestamp);
    return count ? sorted.slice(-count) : sorted;
  },

  // 获取指定小说的平均值
  // 返回 { avgWords, avgScore, avgDuration, totalChapters, totalWords }
  getAverages(novelId){
    const history = this.getHistory(novelId);
    if(history.length === 0){
      return { avgWords: 0, avgScore: 0, avgDuration: 0, totalChapters: 0, totalWords: 0 };
    }

    const completions = history.filter(e => e.event === this.EVENT_TYPES.CHAPTER_COMPLETE);
    if(completions.length === 0){
      return { avgWords: 0, avgScore: 0, avgDuration: 0, totalChapters: 0, totalWords: 0 };
    }

    const wordCounts = completions.map(e => e.data.wordCount || 0).filter(w => w > 0);
    const scores = completions.map(e => e.data.score || 0).filter(s => s > 0);
    const durations = completions.map(e => e.data.duration || 0).filter(d => d > 0);

    return {
      avgWords: wordCounts.length > 0 ? Math.round(wordCounts.reduce((a, b) => a + b, 0) / wordCounts.length) : 0,
      avgScore: scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0,
      avgDuration: durations.length > 0 ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : 0,
      totalChapters: completions.length,
      totalWords: wordCounts.reduce((a, b) => a + b, 0),
    };
  },

  // 获取指定小说的趋势分析
  // 对标 Reference-php stats_tracker.php getTrends()
  getTrends(novelId){
    const history = this.getHistory(novelId);
    const completions = history.filter(e => e.event === this.EVENT_TYPES.CHAPTER_COMPLETE);
    if(completions.length < 2){
      return { trend: 'insufficient_data', chapters: completions.length };
    }

    const scores = completions.map(e => e.data.score || 0).filter(s => s > 0);
    const words = completions.map(e => e.data.wordCount || 0).filter(w => w > 0);

    // 质量趋势：最近 5 章与前 5 章比较
    let qualityTrend = 'stable';
    if(scores.length >= 4){
      const recent = scores.slice(-5);
      const early = scores.slice(0, 5);
      const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
      const earlyAvg = early.reduce((a, b) => a + b, 0) / early.length;
      const delta = recentAvg - earlyAvg;
      qualityTrend = delta > 3 ? 'improving' : delta < -3 ? 'declining' : 'stable';
    }

    // 字数趋势
    let wordTrend = 'stable';
    if(words.length >= 4){
      const recent = words.slice(-5);
      const early = words.slice(0, 5);
      const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
      const earlyAvg = early.reduce((a, b) => a + b, 0) / early.length;
      const ratio = earlyAvg > 0 ? recentAvg / earlyAvg : 1;
      wordTrend = ratio > 1.1 ? 'increasing' : ratio < 0.9 ? 'decreasing' : 'stable';
    }

    // 错误率趋势
    const errors = history.filter(e =>
      e.event === this.EVENT_TYPES.CHAPTER_ERROR || e.event === this.EVENT_TYPES.API_ERROR
    );
    const errorRate = completions.length > 0 ? errors.length / completions.length : 0;

    return {
      qualityTrend,
      wordTrend,
      errorRate: Math.round(errorRate * 100) / 100,
      totalEvents: history.length,
      chapters: completions.length,
      recentAvgScore: scores.length > 0 ? Math.round(scores.slice(-5).reduce((a, b) => a + b, 0) / Math.min(5, scores.length)) : 0,
    };
  },

  // 导出指定小说的完整统计数据
  // 对标 Reference-php stats_tracker.php exportStats()
  exportStats(novelId){
    const history = this.getHistory(novelId);
    const averages = this.getAverages(novelId);
    const trends = this.getTrends(novelId);

    // 按事件类型聚合
    const byEvent = {};
    for(const evt of history){
      if(!byEvent[evt.event]) byEvent[evt.event] = 0;
      byEvent[evt.event]++;
    }

    // 章节级别的详细数据
    const chapterStats = history
      .filter(e => e.event === this.EVENT_TYPES.CHAPTER_COMPLETE)
      .map(e => ({
        chapterIdx: e.data.chapIdx,
        wordCount: e.data.wordCount || 0,
        score: e.data.score || 0,
        duration: e.data.duration || 0,
        timestamp: e.timestamp,
      }));

    return {
      novelId,
      exportedAt: new Date().toISOString(),
      summary: {
        totalEvents: history.length,
        totalChapters: averages.totalChapters,
        totalWords: averages.totalWords,
        avgWords: averages.avgWords,
        avgScore: averages.avgScore,
        avgDuration: averages.avgDuration,
      },
      trends,
      byEvent,
      chapters: chapterStats,
    };
  },

  // ===== 从数据库加载 =====
  async load(){
    try{
      const res = await fetch('/api/settings');
      const json = await res.json();
      if(json.ok && json.data && json.data.stats_data){
        const data = json.data.stats_data;
        if(data.events) this.events = data.events;
        this._aggregates = null;
      }
    }catch(e){
      console.warn('[StatsTracker] 从数据库加载失败', e);
    }
  },

  // ===== 持久化到数据库 =====
  async _sync(){
    try{
      await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          settings: { stats_data: { events: this.events.slice(-500), savedAt: Date.now() } },
        }),
        keepalive: true,
      });
      this._lastSync = Date.now();
    }catch(e){
      console.warn('[StatsTracker] 持久化到数据库失败', e);
    }
  },

  // 节流同步：距上次同步超过 SYNC_INTERVAL 才触发
  _maybeSync(){
    const now = Date.now();
    if(now - this._lastSync >= this.SYNC_INTERVAL){
      this._sync();
    }
  },

  // 强制同步（页面关闭时调用）
  flush(){
    this._sync();
  },

  // ===== 工具方法 =====

  // 生成日期 key（YYYY-MM-DD）
  _getDateKey(ts){
    const d = new Date(ts);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return y + '-' + m + '-' + day;
  },

  // 格式化时间戳为可读时间
  formatTime(ts){
    const d = new Date(ts);
    const h = String(d.getHours()).padStart(2, '0');
    const m = String(d.getMinutes()).padStart(2, '0');
    return h + ':' + m;
  },
};

// 页面关闭时强制同步
window.addEventListener('pagehide', () => {
  StatsTracker.flush();
});

window.StatsTracker = StatsTracker;
