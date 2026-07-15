/**
 * 成长印记 · 状态管理（Store）
 * 单例模式，统一管理所有数据，避免模块间直接耦合
 * 包含订阅机制，供渲染层监听状态变化
 *
 * 设计说明：路线（paths）概念已与标签合并，演进脉络视图改为按标签聚合的时间轴。
 *            标签是唯一的归类维度，标签颜色由 _tagColor 基于标签名 hash 生成。
 */

// ============================================================
// Store 定义
// ============================================================
const Store = {
  // 数据容器
  records: [],      // 所有成长印记（按时间排序，最新在后）
  review: null,     // 当前展示的时光回顾（对应 reviewWeekOffset 那一周）
  reviewWeekOffset: 0, // 时光回顾当前翻页偏移：0=本周，1=上周，2=2周前…
  currentView: 'home', // 当前视图：home | review | routes

  // 订阅者列表（用于渲染层监听变化）
  _subscribers: [],

  _storageKey: 'growthmark_data_v2',

  // 标签色板：从一组协调的暖色中取色，避免纯随机 RGB 过于杂乱
  // _tagColor 基于标签名 hash 在此色板中稳定取色，同一标签始终同色
  _TAG_PALETTE: ['#5B9A6F', '#D4A843', '#4A7BC4', '#7B9EC4', '#9B7BB8', '#C47B8A', '#6FA8A0', '#E07B5A'],

  // 预置标签 → 颜色映射（人工指定，确保常用标签有暖心现代感配色）
  _TAG_COLOR_MAP: {
    '成长': '#5B9A6F',
    '工作': '#4A7BC4',
    '学习': '#D4A843',
    '前端开发': '#5A9FD4',
    '数据分析': '#7B9EC4',
    '数据看板': '#6FA8A0',
    'React': '#61DAFB',
    'React Hooks': '#61DAFB',
    'TypeScript': '#3178C6',
    'SQL': '#E07B5A',
    '健身': '#5AA8A0',
    '阅读': '#A07DB8',
    '情绪': '#D47A8A',
    '项目': '#E07B5A',
    '反思': '#B48A70',
    '增长策略': '#9B7BB8',
    '习惯养成': '#5AA8A0',
    '工作方法': '#4A7BC4',
    '沟通': '#C47B8A',
    '复盘': '#5B9A6F',
  },

  // ============================================================
  // 初始化（从 localStorage 加载，失败或为空则回退预置数据）
  // ============================================================
  init() {
    const loaded = this._loadFromStorage();
    // 仅当 localStorage 有非空 records 时才采用，否则回退预置数据
    // （避免用户测试删除功能清空记录后，demo 永远显示空状态）
    if (loaded && loaded.records && loaded.records.length > 0) {
      this.records = loaded.records;
      // 对加载的每条记录做防御性修复（补全缺失字段）
      this._repairRecords(this.records);
      console.log('[成长印记] 从本地存储加载数据', { records: this.records.length });
    } else {
      this.records = JSON.parse(JSON.stringify(PresetData.records));
      // 预置数据也做防御性修复
      this._repairRecords(this.records);
      console.log('[成长印记] 使用预置数据初始化');
    }

    // review 不信任 localStorage 旧值：基于 records 统一重算
    // 定位到最近有数据的那一周，确保打开时光回顾就能看到内容
    this.resetReviewToNearestWeek();
  },

  // ============================================================
  // 添加新记录
  // 合并后记录结构：{ originalContent, understanding, warmResponse, milestone, relations }
  // understanding: { title, summary, tags }（类型已合并到标签中）
  // relations: { upstream: [{recordId, type, reason}], crossLinks: [{recordId, sharedTag, otherTag}] }
  // ============================================================
  addRecord(record) {
    if (!record) return null;

    // 数据完整性校验：确保必要字段存在且类型正确
    if (!record.originalContent || typeof record.originalContent !== 'string') {
      record.originalContent = String(record.originalContent || '');
    }

    // 防御：确保 understanding 结构完整
    if (!record.understanding) record.understanding = { title: '未命名记录', summary: '', tags: [] };
    if (!record.understanding.title || typeof record.understanding.title !== 'string') {
      record.understanding.title = '未命名记录';
    }
    if (!record.understanding.summary || typeof record.understanding.summary !== 'string') {
      record.understanding.summary = '';
    }
    if (!Array.isArray(record.understanding.tags)) {
      record.understanding.tags = [];
    }
    // 过滤标签中的非字符串值
    record.understanding.tags = record.understanding.tags.filter(t => typeof t === 'string' && t.trim());

    // 生成新 ID（容错：id 格式异常时从 0 开始）
    const maxId = this.records.reduce((max, r) => {
      const num = parseInt(r.id.replace('#', ''), 10);
      return (isNaN(num) || num <= max) ? max : num;
    }, 0);
    record.id = '#' + String(maxId + 1).padStart(3, '0');
    record.createdAt = Date.now();
    record.displayDate = this._formatDate(record.createdAt);

    // 添加到记录列表（保持时间排序，最新在后）
    this.records.push(record);

    // 计算新记录的关联关系（若 processRecord 已计算则跳过，避免重复 O(n) 开销）
    if (!record.relations) {
      this._computeRelations(record);
    }

    // 增量更新已有记录的关联：新记录可能成为已有记录的上游候选
    this._updateExistingRelations(record);

    // 重新生成周回顾（包含新记录）
    // 新记录属于本周，回到本周展示，确保用户能看到刚添加的内容
    this.reviewWeekOffset = 0;
    this.regenerateReview();

    // 通知订阅者
    this._notify({ type: 'record_added', record });
    return record;
  },

  // ============================================================
  // 查询记录（基础查询，不带筛选）
  // sort='desc' 返回最新在前
  // ============================================================
  getRecords(filters = {}) {
    let result = [...this.records];
    if (filters.sort === 'desc') {
      result.reverse(); // 最新在前
    }
    return result;
  },

  // ============================================================
  // 按标签查询记录：返回包含该标签的所有记录，按时间正序（最早在前）
  // 用于演进脉络视图的"标签时间轴"
  // ============================================================
  getRecordsByTag(tag) {
    return this.records
      .filter(r => {
        const tags = (r.understanding && r.understanding.tags) || [];
        return tags.includes(tag);
      })
      .sort((a, b) => a.createdAt - b.createdAt);
  },

  // ============================================================
  // 搜索与筛选记录
  // 参数说明：
  //   keyword   - 搜索关键词，匹配标题、标签、原文内容（不区分大小写）
  //   tags      - 标签筛选数组，为空表示不限（类型已合并到标签中）
  // 返回：过滤后的记录数组（最新在前）
  // ============================================================
  searchRecords({ keyword = '', tags = [] } = {}) {
    let result = [...this.records];

    // 关键词搜索：匹配标题、标签、原文内容
    const kw = (keyword || '').trim().toLowerCase();
    if (kw) {
      result = result.filter(r => {
        const title = (r.understanding && r.understanding.title || '').toLowerCase();
        const summary = (r.understanding && r.understanding.summary || '').toLowerCase();
        const original = (r.originalContent || '').toLowerCase();
        const recTags = ((r.understanding && r.understanding.tags) || []).join(' ').toLowerCase();
        return title.includes(kw) ||
               summary.includes(kw) ||
               original.includes(kw) ||
               recTags.includes(kw);
      });
    }

    // 标签筛选：记录包含所有选中的标签（AND 逻辑，精准筛选）
    // 注：类型已合并到标签中，主分类(工作/学习/项目/情绪/成长)作为第一个标签附加
    if (tags.length > 0) {
      result = result.filter(r => {
        const recTags = (r.understanding && r.understanding.tags) || [];
        return tags.every(t => recTags.includes(t));
      });
    }

    // 最新在前
    result.reverse();
    return result;
  },

  // ============================================================
  // 获取所有出现过的标签及其使用次数（供筛选器与演进脉络 Tab 使用）
  // 返回格式：[{ tag, count }]，按使用次数降序排列
  // ============================================================
  getAllTags() {
    const tagCount = {};
    this.records.forEach(r => {
      const tags = (r.understanding && r.understanding.tags) || [];
      tags.forEach(t => {
        tagCount[t] = (tagCount[t] || 0) + 1;
      });
    });
    return Object.entries(tagCount)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count);
  },

  // ============================================================
  // 获取与指定标签有关联的其他标签（基于 crossLinks）
  // 返回：[{ tag, count, nodes }]，count 为连接次数
  // ============================================================
  getRelatedTags(tag) {
    const related = new Map();
    this.records.forEach(r => {
      const tags = (r.understanding && r.understanding.tags) || [];
      if (!tags.includes(tag)) return;
      (r.relations && r.relations.crossLinks || []).forEach(link => {
        const other = link.sharedTag === tag ? link.otherTag : (link.otherTag === tag ? link.sharedTag : null);
        if (other && !tags.includes(other)) {
          if (!related.has(other)) {
            related.set(other, { count: 0, nodes: [] });
          }
          related.get(other).count++;
          related.get(other).nodes.push(r.id);
        }
      });
    });
    return Array.from(related.entries())
      .map(([t, data]) => ({ tag: t, ...data }))
      .sort((a, b) => b.count - a.count);
  },

  // ============================================================
  // 获取节点在跨标签脉络中的上下文信息
  // 返回在其他标签下的兄弟节点数组
  // ============================================================
  getNodeCrossContext(recordId, currentTag) {
    const record = this.getRecord(recordId);
    if (!record) return [];
    const otherTags = ((record.understanding && record.understanding.tags) || [])
      .filter(t => t !== currentTag);
    return otherTags.map(t => {
      const siblings = this.getRecordsByTag(t).filter(r => r.id !== recordId);
      return { tag: t, siblingCount: siblings.length, latestSibling: siblings.length > 0 ? siblings[siblings.length - 1] : null };
    });
  },

  // ============================================================
  // 标签颜色：优先使用预置映射，未映射的标签用 hash 在色板中取色
  // 同一标签始终返回同一颜色，不同标签尽量分散
  // ============================================================
  _tagColor(tag) {
    if (this._TAG_COLOR_MAP[tag]) return this._TAG_COLOR_MAP[tag];
    let hash = 0;
    for (let i = 0; i < tag.length; i++) {
      hash = tag.charCodeAt(i) + ((hash << 5) - hash);
      hash |= 0;
    }
    return this._TAG_PALETTE[Math.abs(hash) % this._TAG_PALETTE.length];
  },

  // ============================================================
  // 单条查询
  // ============================================================
  getRecord(id) {
    return this.records.find(r => r.id === id) || null;
  },

  // ============================================================
  // 周范围工具方法
  // ============================================================
  // 计算给定时间戳所在周的"周一 00:00"时间戳
  _getWeekStart(timestamp) {
    const d = new Date(timestamp);
    d.setHours(0, 0, 0, 0);
    const dayOfWeek = d.getDay(); // 0=周日, 1=周一...
    const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    d.setDate(d.getDate() - diffToMonday);
    return d.getTime();
  },

  // 计算 offset 对应那周的时间范围
  // 所有 offset 统一返回完整周范围（周一 00:00:00 ~ 周日 23:59:59.999）
  _getWeekRange(offset) {
    const thisWeekStart = this._getWeekStart(Date.now());
    const weekStart = thisWeekStart - offset * 7 * 24 * 60 * 60 * 1000;
    // 统一使用完整周范围（周一 00:00 ~ 周日 23:59:59），避免本周数据被 Date.now() 截断
    return { start: weekStart, end: weekStart + 7 * 24 * 60 * 60 * 1000 - 1 };
  },

  // 取某个时间范围内（含端点）的记录
  _getRecordsInRange(start, end) {
    return this.records.filter(r =>
      r && typeof r.createdAt === 'number' && !isNaN(r.createdAt) &&
      r.createdAt >= start && r.createdAt <= end
    );
  },

  // 计算时间戳所在周相对本周的偏移（本周=0，上周=1...）
  _offsetForTimestamp(ts) {
    const thisWeekStart = this._getWeekStart(Date.now());
    const tsWeekStart = this._getWeekStart(ts);
    return Math.max(0, Math.round((thisWeekStart - tsWeekStart) / (7 * 24 * 60 * 60 * 1000)));
  },

  // 最早有记录的那一周相对本周的偏移（无记录返回 0）
  _getMaxWeekOffset() {
    if (this.records.length === 0) return 0;
    const earliest = this.records.reduce((min, r) => {
      const t = r.createdAt;
      return (typeof t === 'number' && !isNaN(t) && t < min) ? t : min;
    }, Date.now());
    return this._offsetForTimestamp(earliest);
  },

  // ============================================================
  // 生成指定周的回顾（核心逻辑，供 regenerateReview / 翻页复用）
  // ============================================================
  _buildReviewForWeek(offset) {
    const range = this._getWeekRange(offset);
    const weekRecords = this._getRecordsInRange(range.start, range.end);

    // 统计本周活跃标签（容错：understanding 可能为空）
    const activeTags = [...new Set(
      weekRecords.flatMap(r => (r.understanding && r.understanding.tags) || [])
    )];

    // 高光时刻：里程碑记录 + 本周最新3条
    const milestoneRecords = weekRecords.filter(r => r.milestone != null);
    const latestRecords = weekRecords.slice(-3).reverse();
    const seen = new Set();
    const highlights = [...milestoneRecords, ...latestRecords]
      .filter(r => {
        if (seen.has(r.id)) return false;
        seen.add(r.id);
        return true;
      })
      .slice(0, 5)
      .map(r => ({
        recordId: r.id,
        title: (r.understanding && r.understanding.title) || '未命名记录',
        summary: (r.understanding && r.understanding.summary) || ''
      }));

    // 标签进展：本周该标签新增数 + 该标签历史总记录数
    // 排序：本周新增数降序，让活跃标签排在前面
    const tagProgress = activeTags.map(tag => {
      const totalCount = this.records.filter(r => {
        const tags = (r.understanding && r.understanding.tags) || [];
        return tags.includes(tag);
      }).length;
      return {
        tag,
        newCount: weekRecords.filter(r => {
          const tags = (r.understanding && r.understanding.tags) || [];
          return tags.includes(tag);
        }).length,
        totalCount,
        color: this._tagColor(tag)
      };
    }).sort((a, b) => b.newCount - a.newCount);

    // 对比上周：基于真实上一周数据计算差值（不再用模拟值）
    const prevRange = this._getWeekRange(offset + 1);
    const prevWeekRecords = this._getRecordsInRange(prevRange.start, prevRange.end);
    const prevActiveTags = [...new Set(
      prevWeekRecords.flatMap(r => (r.understanding && r.understanding.tags) || [])
    )];

    // 趋势分析
    const trend = this._buildTrendData(offset, weekRecords);

    // 个性化建议（基于趋势数据）
    const suggestions = this._buildSuggestions(offset, weekRecords, trend);

    // 温暖回应
    const warmResponse = this._buildReviewWarmResponse(weekRecords, highlights, offset === 0);

    return {
      id: 'review-week-' + new Date(range.start).toISOString().slice(0, 10),
      weekOffset: offset,
      timeRange: {
        start: range.start,
        end: range.end,
        label: this._formatDateRange(range.start, range.end)
      },
      totalRecords: weekRecords.length,
      activeTagCount: activeTags.length,
      highlights,
      tagProgress,
      comparison: {
        recordsDelta: weekRecords.length - prevWeekRecords.length,
        tagsDelta: activeTags.length - prevActiveTags.length,
        highlightsText: this._buildComparisonText(weekRecords, prevWeekRecords)
      },
      trend,
      suggestions,
      warmResponse
    };
  },

  // ============================================================
  // 构建趋势分析数据
  // 从当前周向历史遍历最多 6 周，收集记录数和标签活跃度
  // ============================================================
  _buildTrendData(offset, weekRecords) {
    const maxOffset = this._getMaxWeekOffset();
    const maxWeeks = 6;

    // 从当前周向历史遍历，收集每周记录数
    // weeks[0] = 当前周，weeks[最后] = 最早周
    const rawWeeks = [];
    for (let i = 0; i < maxWeeks; i++) {
      const weekOffset = i;
      if (weekOffset > maxOffset) break;
      const range = this._getWeekRange(weekOffset);
      const records = this._getRecordsInRange(range.start, range.end);
      rawWeeks.push({
        offset: weekOffset,
        label: this._weekOffsetLabel(weekOffset),
        count: records.length,
        records
      });
    }

    // 反转为从早到晚排列（柱状图从左到右）
    const weeks = [...rawWeeks].reverse();

    // 计算趋势方向：比较最近两周（反转后的最后两个）
    let direction = null;
    if (weeks.length >= 3) {
      const latest = weeks[weeks.length - 1].count;
      const prev = weeks[weeks.length - 2].count;
      if (latest > prev) direction = 'up';
      else if (latest < prev) direction = 'down';
      else direction = 'stable';
    }

    // 柱状图高度归一化用的最大值，至少为 1 避免除零
    const maxCount = Math.max(1, ...weeks.map(w => w.count));
    const sufficientData = weeks.length >= 3;

    // 标签活跃度趋势：本周 top3 标签的近 N 周出现次数（仅 sufficientData 时计算）
    let tagTrends = [];
    if (sufficientData) {
      // 统计本周标签频次，取 top3
      const tagCount = {};
      weekRecords.forEach(r => {
        ((r.understanding && r.understanding.tags) || []).forEach(t => {
          tagCount[t] = (tagCount[t] || 0) + 1;
        });
      });
      const topTags = Object.entries(tagCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([tag]) => tag);

      // 取最近 4 周数据（从早到晚）
      const recentWeeks = weeks.slice(-4);
      tagTrends = topTags.map(tag => {
        const counts = recentWeeks.map(w =>
          w.records.filter(r =>
            ((r.understanding && r.understanding.tags) || []).includes(tag)
          ).length
        );
        return {
          tag,
          color: this._tagColor(tag),
          counts,
          latestCount: counts[counts.length - 1]
        };
      });
    }

    return {
      recordTrend: { weeks, direction, maxCount },
      tagTrends,
      sufficientData
    };
  },

  // ============================================================
  // 基于趋势数据生成个性化建议（规则驱动，0-3 条）
  // 每条规则对应多候选文案池，运行时随机选取，确保多样化暖心
  // ============================================================
  _buildSuggestions(offset, weekRecords, trend) {
    // 从候选文案池中随机选取一条
    function _pickRandom(pool) {
      return pool[Math.floor(Math.random() * pool.length)];
    }

    // ---- 文案池定义 ----

    // 规则1：数据不足时的鼓励
    const INSUFFICIENT_POOL = [
      '每一棵大树都从小苗开始，你的成长故事也值得被记录下来',
      '不用写很多，哪怕今天只记一个小感悟，也是未来的你珍贵的回忆',
      '成长的路不怕慢，就怕没有留下痕迹——试试记录今天的一件小事',
      '翻开第一页总是最难的，但你已经迈出了这一步，继续保持'
    ];

    // 规则2：记录频率下降时的鼓励
    const FREQUENCY_DOWN_POOL = [
      '最近是不是太忙了？别忘了给自己留一点回顾的时间，哪怕只写两三句话',
      '休息也是一种成长，等有精力了再慢慢拾起记录的习惯，不着急',
      '生活总有起伏，偶尔断几天很正常，最重要的是不要对自己太苛刻',
      '感受到你在努力平衡生活，也许可以试试在通勤路上随手记一条'
    ];

    // 规则3：记录稳定时的复盘建议
    const REVIEW_POOL = [
      '好习惯已经养成了！现在是做一次系统性复盘的好时机，你会发现隐藏的进步',
      '你的坚持让人佩服，每一条记录都在构建你独特的成长地图',
      '稳定输出很不容易，趁着状态好，可以试着串联这段时间的成长脉络',
      '记录本上的每一行都是你认真生活的证据，是时候回顾一下了'
    ];

    // 规则4：标签重新激活（模板函数，调用时传入 tag）
    const REACTIVATE_POOL = [
      tag => `「${tag}」又回来了！想想上次记录时和现在有什么不同，也许会有新的体悟`,
      tag => `好久不见「${tag}」！回来总是好的，翻翻之前的记录，可能会有新发现`,
      tag => `「${tag}」这个方向你并没有放下呢，看看之前的积累有没有带来新的启发`,
      tag => `「${tag}」重新出现在你的成长记录里，带着之前的基础继续探索吧`
    ];

    // 规则5：单一标签时的跨领域建议（模板函数，调用时传入 tag）
    const DIVERSIFY_POOL = [
      tag => `这周深耕「${tag}」，专注力很棒！偶尔跳出舒适圈，说不定能碰撞出新灵感`,
      tag => `在「${tag}」方向上积累得很扎实，如果想换换口味，试试从其他角度看看问题`,
      tag => `专注一个方向也有独特的收获，不过生活就像调色盘，多种颜色才更丰富呢`
    ];

    // 规则6：稳定但可挑战
    const CHALLENGE_POOL = [
      '你已经很稳定了，是时候给自己一点新的刺激，比如深入研究一个感兴趣的子主题',
      '舒适区的对面是成长区，试着选一个稍微有难度的方向挑战一下自己',
      '稳定是好事，但偶尔跳一跳才能知道自己的边界在哪里，试试看？'
    ];

    // ---- 规则匹配逻辑 ----

    // 数据不足或本周无记录时，返回 1 条通用鼓励
    if (weekRecords.length === 0) return [];

    const suggestions = [];

    // 不足 3 周数据时：只给通用鼓励
    if (!trend.sufficientData) {
      suggestions.push({
        type: 'consistency',
        text: _pickRandom(INSUFFICIENT_POOL)
      });
      return suggestions.slice(0, 3);
    }

    const { recordTrend, tagTrends } = trend;
    const weeks = recordTrend.weeks;

    // 规则1（高优先级）：最近 2 周记录数连续下降
    if (weeks.length >= 3) {
      const latest = weeks[weeks.length - 1].count;
      const prev = weeks[weeks.length - 2].count;
      const prevPrev = weeks[weeks.length - 3].count;
      if (latest < prev && prev < prevPrev && latest < prevPrev) {
        suggestions.push({
          type: 'consistency',
          text: _pickRandom(FREQUENCY_DOWN_POOL)
        });
      }
    }

    // 规则2（中优先级）：连续 3 周+每周记录数 >= 5
    const recent3 = weeks.slice(-3);
    if (recent3.length === 3 && recent3.every(w => w.count >= 5)) {
      suggestions.push({
        type: 'review',
        text: _pickRandom(REVIEW_POOL)
      });
    }

    // 规则3（中优先级）：标签重新激活——最多输出 1 条，避免占满建议上限
    if (tagTrends.length > 0) {
      const reactivated = tagTrends.filter(tt =>
        tt.counts.length >= 2 && tt.counts[tt.counts.length - 2] === 0 && tt.counts[tt.counts.length - 1] > 0
      );
      if (reactivated.length > 0) {
        // 选本周出现次数最多的那个标签
        const best = reactivated.reduce((a, b) => a.latestCount > b.latestCount ? a : b);
        suggestions.push({
          type: 'reactivate',
          text: _pickRandom(REACTIVATE_POOL)(best.tag)
        });
      }
    }

    // 规则4（低优先级）：本周仅 1 个标签出现
    const activeTags = [...new Set(weekRecords.flatMap(r => (r.understanding && r.understanding.tags) || []))];
    if (activeTags.length === 1) {
      suggestions.push({
        type: 'diversify',
        text: _pickRandom(DIVERSIFY_POOL)(activeTags[0])
      });
    }

    // 规则5（低优先级兜底）：稳定记录但可挑战
    if (suggestions.length === 0) {
      const recent2 = weeks.slice(-2);
      if (recent2.length === 2 && recent2.every(w => w.count >= 3) && recordTrend.direction === 'stable') {
        suggestions.push({
          type: 'challenge',
          text: _pickRandom(CHALLENGE_POOL)
        });
      }
    }

    return suggestions.slice(0, 3);
  },

  // ============================================================
  // 重新生成当前展示周的回顾（记录变化后调用）
  // ============================================================
  regenerateReview() {
    // 完全无记录时，回顾置空（触发"暂无回顾数据"空状态，而非空周提示）
    if (this.records.length === 0) {
      this.review = null;
    } else {
      // 边界保护：删除记录可能导致最早有数据的周变化，clamp 当前 offset
      const maxOffset = this._getMaxWeekOffset();
      if (this.reviewWeekOffset > maxOffset) {
        this.reviewWeekOffset = maxOffset;
      }
      this.review = this._buildReviewForWeek(this.reviewWeekOffset);
    }
    this._notify({ type: 'review_regenerated', review: this.review });
    return this.review;
  },

  // ============================================================
  // 翻页：delta 为 -1 往本周方向（未来），+1 往历史方向（过去）
  // ============================================================
  changeReviewWeek(delta) {
    if (delta === 0) return this.review;
    const maxOffset = this._getMaxWeekOffset();
    const next = this.reviewWeekOffset + delta;
    // 边界约束：不能超过本周（0），不能早于最早有记录的周
    const clamped = Math.max(0, Math.min(maxOffset, next));
    if (clamped === this.reviewWeekOffset) return this.review;
    this.reviewWeekOffset = clamped;
    this.review = this._buildReviewForWeek(this.reviewWeekOffset);
    this._notify({ type: 'review_week_changed', review: this.review });
    return this.review;
  },

  // ============================================================
  // 重置到最近有数据的那一周（进入时光回顾视图时调用）
  // 返回 true 表示定位成功（有数据），false 表示完全无记录
  // ============================================================
  resetReviewToNearestWeek() {
    if (this.records.length === 0) {
      this.reviewWeekOffset = 0;
      this.review = null;
      this._notify({ type: 'review_regenerated', review: null });
      return false;
    }
    // 从本周（offset=0）向历史方向遍历，找到第一个有数据的一周
    const maxOffset = this._getMaxWeekOffset();
    this.reviewWeekOffset = 0;
    for (let off = 0; off <= maxOffset; off++) {
      const range = this._getWeekRange(off);
      const records = this._getRecordsInRange(range.start, range.end);
      if (records.length > 0) {
        this.reviewWeekOffset = off;
        break;
      }
    }
    this.review = this._buildReviewForWeek(this.reviewWeekOffset);
    this._notify({ type: 'review_week_changed', review: this.review });
    return true;
  },

  // ============================================================
  // 当前翻页状态信息（供渲染层使用）
  // ============================================================
  getReviewWeekInfo() {
    const offset = this.reviewWeekOffset;
    const maxOffset = this._getMaxWeekOffset();
    return {
      offset,
      label: this._weekOffsetLabel(offset),
      hasPrev: offset < maxOffset, // 能否往历史方向翻
      hasNext: offset > 0          // 能否往本周方向翻
    };
  },

  // 周偏移的可读标签
  _weekOffsetLabel(offset) {
    if (offset === 0) return '本周';
    if (offset === 1) return '上周';
    return `${offset} 周前`;
  },

  // ============================================================
  // 添加标签
  // ============================================================
  addTag(recordId, tagText) {
    const record = this.getRecord(recordId);
    if (!record) return false;

    // 确保标签数组存在
    if (!record.understanding) record.understanding = {};
    if (!record.understanding.tags) record.understanding.tags = [];

    // 校验：去除首尾空白
    const trimmed = (tagText || '').trim();
    if (!trimmed) return false;

    // 校验：最大长度 20 字符
    if (trimmed.length > 20) return false;

    // 校验：最大 10 个标签
    if (record.understanding.tags.length >= 10) return false;

    // 校验：重复标签（区分大小写）
    if (record.understanding.tags.includes(trimmed)) return false;

    record.understanding.tags.push(trimmed);
    this._notify({ type: 'tags_updated', recordId, tags: record.understanding.tags });
    return true;
  },

  // ============================================================
  // 删除标签
  // ============================================================
  removeTag(recordId, tagText) {
    const record = this.getRecord(recordId);
    if (!record) return false;
    if (!record.understanding || !record.understanding.tags) return false;

    const idx = record.understanding.tags.indexOf(tagText);
    if (idx === -1) return false;

    record.understanding.tags.splice(idx, 1);
    this._notify({ type: 'tags_updated', recordId, tags: record.understanding.tags });
    return true;
  },

  // ============================================================
  // 更新记录（编辑后调用）
  // updates 支持字段：originalContent, title, summary,
  //   understanding(整个对象，来自 AI 重解析), milestone, warmResponse
  // 若 AI 重解析结果与用户手动编辑冲突，由调用方决定优先级（App 中处理）
  // ============================================================
  updateRecord(recordId, updates) {
    const record = this.getRecord(recordId);
    if (!record) return null;

    // 更新原文（若变化触发重解析，由调用方处理后传入）
    if (updates.originalContent !== undefined) {
      record.originalContent = updates.originalContent;
    }

    // 更新用户手动编辑的字段
    if (updates.title !== undefined) {
      record.understanding.title = updates.title;
    }
    if (updates.summary !== undefined) {
      record.understanding.summary = updates.summary;
    }

    // 若传入 AI 重解析结果（原文变化后调用 processRecord 获得）
    if (updates.understanding) {
      // AI 重解析可能覆盖 title/summary/tags/milestone/warmResponse
      record.understanding = {
        ...updates.understanding,
        // 但用户手动编辑的 title/summary 优先级更高
        title: updates.title !== undefined ? updates.title : updates.understanding.title,
        summary: updates.summary !== undefined ? updates.summary : updates.understanding.summary
      };
    }
    if (updates.milestone !== undefined) {
      record.milestone = updates.milestone;
    }
    if (updates.warmResponse !== undefined) {
      record.warmResponse = updates.warmResponse;
    }

    // 重算关联关系（标签/原文变化都可能影响）
    this._computeRelations(record);
    this._updateExistingRelations(record);
    // 重新生成周回顾
    this.regenerateReview();
    // 通知订阅者
    this._notify({ type: 'record_updated', recordId });
    return record;
  },

  // ============================================================
  // 删除记录
  // 合并后无需清理路线引用与 upstreamIds（均已移除），逻辑简化
  // 删除后需清理其他记录 relations 中对被删记录的引用
  // ============================================================
  removeRecord(recordId) {
    const idx = this.records.findIndex(r => r.id === recordId);
    if (idx === -1) return false;

    // 1. 从记录列表中删除
    this.records.splice(idx, 1);

    // 2. 清理其他记录的关联引用
    this._cleanupRelations(recordId);

    // 3. 重新生成时光回顾（高光时刻、标签进展可能变化）
    this.regenerateReview();

    // 4. 通知订阅者
    this._notify({ type: 'record_removed', recordId });
    return true;
  },

  // ============================================================
  // 订阅机制
  // ============================================================
  subscribe(fn) {
    this._subscribers.push(fn);
  },

  unsubscribe(fn) {
    this._subscribers = this._subscribers.filter(s => s !== fn);
  },

  _notify(hint = {}) {
    // 逐个调用订阅者，单个订阅者异常不影响其他订阅者
    this._subscribers.forEach(fn => {
      try {
        fn(this.state, hint);
      } catch (err) {
        console.error('[成长印记] 订阅者回调异常', err);
      }
    });
    this._saveToStorage();
  },

  // ============================================================
  // localStorage 持久化：保存数据
  // ============================================================
  _saveToStorage() {
    try {
      const data = {
        records: this.records,
        review: this.review
      };
      localStorage.setItem(this._storageKey, JSON.stringify(data));
    } catch (e) {
      console.error('[成长印记] 保存数据失败', e);
    }
  },

  // ============================================================
  // localStorage 持久化：加载数据
  // 兼容旧数据：忽略已废弃的 paths 字段与 records 中的 relations 字段
  // ============================================================
  _loadFromStorage() {
    try {
      const raw = localStorage.getItem(this._storageKey);
      if (!raw) return null;
      const data = JSON.parse(raw);
      if (!data || typeof data !== 'object') return null;

      // 数据完整性校验：过滤掉结构不完整的脏记录
      if (Array.isArray(data.records)) {
        data.records = data.records.filter(r => this._validateRecord(r));
      }

      return data;
    } catch (e) {
      console.error('[成长印记] 加载数据失败，将使用预置数据', e);
      return null;
    }
  },

  // ============================================================
  // 校验单条记录的数据完整性
  // 返回 true 表示记录有效，false 表示脏数据需过滤
  // ============================================================
  _validateRecord(r) {
    if (!r || typeof r !== 'object') return false;
    // 必须有 id
    if (!r.id || typeof r.id !== 'string') return false;
    // 必须有 createdAt 且为有效数字
    if (typeof r.createdAt !== 'number' || isNaN(r.createdAt)) return false;
    // understanding 结构校验
    if (!r.understanding || typeof r.understanding !== 'object') return false;
    if (typeof r.understanding.title !== 'string') return false;
    if (!Array.isArray(r.understanding.tags)) return false;
    return true;
  },

  // ============================================================
  // 防御性修复记录数组：补全缺失字段，防止脏数据导致渲染崩溃
  // ============================================================
  _repairRecords(records) {
    if (!Array.isArray(records)) return;
    records.forEach(r => {
      if (!r || typeof r !== 'object') return;
      // 补全 understanding 结构
      if (!r.understanding || typeof r.understanding !== 'object') {
        r.understanding = { title: '未命名记录', summary: '', tags: [] };
      }
      if (typeof r.understanding.title !== 'string') r.understanding.title = '未命名记录';
      if (typeof r.understanding.summary !== 'string') r.understanding.summary = '';
      // 过滤标签中的非字符串值
      if (!Array.isArray(r.understanding.tags)) r.understanding.tags = [];
      r.understanding.tags = r.understanding.tags.filter(t => typeof t === 'string' && t.trim());
      // 补全 originalContent
      if (typeof r.originalContent !== 'string') r.originalContent = String(r.originalContent || '');
      // 补全 displayDate
      if (typeof r.displayDate !== 'string' && typeof r.createdAt === 'number') {
        r.displayDate = this._formatDate(r.createdAt);
      }
    });
  },

  // ============================================================
  // 公开方法：重新计算指定记录的关联关系（供外部调用，如标签变更后）
  // 标签变化会影响双向关联（旧记录可能发现新上游，新记录可能被旧记录发现）
  // 因此全量重算，确保所有记录关联一致
  // ============================================================
  updateRecordRelations(recordId) {
    const record = this.getRecord(recordId);
    if (!record) return;
    this.rebuildAllRelations();
  },

  // ============================================================
  // 关联计算：为单条记录计算与所有已有记录的关联关系
  // ============================================================
  _computeRelations(record) {
    // buildRelations 在 mockAI.js 中定义，接收新记录和已有记录列表
    if (typeof buildRelations === 'function') {
      // 传入除自身外的所有记录
      const others = this.records.filter(r => r.id !== record.id);
      record.relations = buildRelations(record, others);
    } else {
      // 兜底：mockAI 未加载时给空结构
      record.relations = { upstream: [], crossLinks: [] };
    }
  },

  // ============================================================
  // 增量关联更新：关联方变化后，检查其他记录是否受其影响
  // 对每条记录重新计算关联（buildRelations 内部会排除自身），确保双向一致性
  // 从 addRecord/updateRecord 均可调用：addRecord 时目标总是最新记录，
  // updateRecord 时目标可能较旧，较新记录中原有的上游引用可能失效，
  // 因此不对 records 做 createdAt 过滤——全部重算以保持正确
  // ============================================================
  _updateExistingRelations(targetRecord) {
    if (typeof buildRelations !== 'function') return;
    this.records.forEach(record => {
      if (record.id === targetRecord.id) return;
      record.relations = buildRelations(record, this.records.filter(r => r.id !== record.id));
    });
  },

  // ============================================================
  // 清理关联引用：删除记录后，从其他记录的 relations 中移除引用
  // ============================================================
  _cleanupRelations(deletedId) {
    this.records.forEach(record => {
      if (!record.relations) return;
      // 清理 upstream 中的引用
      if (Array.isArray(record.relations.upstream)) {
        record.relations.upstream = record.relations.upstream.filter(
          link => link.recordId !== deletedId
        );
      }
      // 清理 crossLinks 中的引用
      if (Array.isArray(record.relations.crossLinks)) {
        record.relations.crossLinks = record.relations.crossLinks.filter(
          link => link.recordId !== deletedId
        );
      }
    });
    // 引用清理后，全量重算剩余记录的最优关联
    // 确保 A→C 的旧引用清除后，A 能重新发现与 B 的更优关联
    this.rebuildAllRelations();
  },

  // ============================================================
  // 重建所有记录的关联关系（init 后或批量变更后调用）
  // relations 是派生数据，始终全量重算以确保一致性
  // ============================================================
  rebuildAllRelations() {
    if (typeof buildRelations !== 'function') return;
    this.records.forEach(record => {
      const others = this.records.filter(r => r.id !== record.id);
      record.relations = buildRelations(record, others);
    });
    this._notify({ type: 'relations_rebuilt' });
    this._saveToStorage();
  },

  // ============================================================
  // 状态快照（供订阅者使用）
  // ============================================================
  get state() {
    return {
      records: this.records,
      review: this.review,
      currentView: this.currentView
    };
  },

  // ============================================================
  // 私有工具方法
  // ============================================================
  _formatDate(timestamp) {
    const d = new Date(timestamp);
    const year = d.getFullYear();
    const month = d.getMonth() + 1;
    const day = d.getDate();
    const hour = String(d.getHours()).padStart(2, '0');
    const minute = String(d.getMinutes()).padStart(2, '0');
    return `${year}年${month}月${day}日 ${hour}:${minute}`;
  },

  _formatDateRange(start, end) {
    const startStr = this._formatDate(start);
    const endStr = this._formatDate(end);
    // 提取日期部分
    return startStr.split(' ')[0] + ' - ' + endStr.split(' ')[0];
  },

  // 温暖回应：基于本周记录与高光时刻的实际内容生成（适配任意周，不写死特定记录）
  _buildReviewWarmResponse(records, highlights, isCurrentWeek = true) {
    const count = records.length;
    const weekLabel = isCurrentWeek ? '这周' : '那周';

    // 取本周出现频次最高的若干标签，体现"在哪些方向有进展"
    const tagCount = {};
    records.forEach(r => {
      const tags = (r.understanding && r.understanding.tags) || [];
      tags.forEach(t => { tagCount[t] = (tagCount[t] || 0) + 1; });
    });
    const topTags = Object.entries(tagCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([tag]) => tag);

    const hasBreakthrough = records.some(r => r.milestone === 'breakthrough');
    const hasCrossNode = records.some(r => r.milestone === 'cross_node');
    const hasFirstStep = records.some(r => r.milestone === 'first_step');

    let parts = [];
    parts.push(`${weekLabel}你留下了 ${count} 个成长印记。`);
    if (topTags.length > 0) {
      parts.push(`在 ${topTags.length} 个方向上都有进展——${topTags.join('、')}。`);
    }

    // 用高光时刻的实际标题生成回看提示，避免写死特定记录内容
    if (highlights.length > 0) {
      const topTitles = highlights.slice(0, 3).map(h => h.title);
      parts.push(`其中 ${topTitles.length} 条值得回看——${topTitles.join('、')}。`);
    }

    if (hasCrossNode) {
      parts.push('跨领域的连接，往往是成长最快的方式。');
    }
    if (hasBreakthrough) {
      parts.push('从"好难"到"搞定"的突破，是成长最好的证明。');
    }
    if (hasFirstStep) {
      parts.push('从需求到交付，独立走完全程——做到了。');
    }

    return parts.join('\n\n');
  },

  // 对比上周：基于当前周与上一周的真实记录数差值生成文案
  _buildComparisonText(currentRecords, prevRecords) {
    const delta = currentRecords.length - prevRecords.length;
    if (delta > 0) return `比上周多 ${delta} 条记录`;
    if (delta < 0) return `比上周少 ${-delta} 条记录`;
    return '与上周记录数持平';
  }
};
