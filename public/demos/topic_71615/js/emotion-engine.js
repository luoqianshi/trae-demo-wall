/* ==========================================
   情绪识别引擎 v2.0 - 多维度段落情绪分析
   特性：关键词加权 / 标点情绪 / 句式结构 / 上下文窗口平滑
   ========================================== */

const EmotionEngine = (() => {
  /* ------------------------------------------------------------------
     1. 情绪关键词库（每种情绪 >= 80 个关键词）
     ------------------------------------------------------------------ */
  const EMOTION_KEYWORDS = {
    sweet: {
      label: '甜宠',
      words: [
        // 爱意表达（2字）
        '爱你', '喜欢', '心动', '温柔', '宠溺', '甜蜜', '幸福', '微笑', '拥抱',
        '撒娇', '羞涩', '脸颊', '脸红', '柔软', '宠着', '哄着', '低声', '轻柔',
        '眉眼', '笑意', '眼眸', '眸中', '嘴角', '弯弯', '甜甜', '宝贝', '傻瓜',
        '笨蛋', '疼爱', '呵护', '怜惜', '珍视', '轻轻', '柔柔', '暖意', '喜悦',
        '欢喜', '疼惜', '含笑', '害羞', '含羞', '蹭蹭', '揉揉', '摸头', '乖乖',
        '可爱', '嘟嘴', '耳根', '恋爱', '牵手', '亲亲', '抱抱', '撒娇',
        // 爱意表达（3字）
        '怦怦跳', '小可爱', '宠上天', '甜蜜蜜', '甜到心', '暖暖的', '幸福地',
        '轻轻拍', '温柔地', '舍不得', '心甘愿', '甘情愿', '宠溺的', '温柔的',
        '羞答答', '喜滋滋', '笑盈盈', '甜蜜的', '甜甜地', '轻轻地', '呵护着',
        '怜惜着', '疼惜着', '眼巴巴', '眨巴眼',
        // 爱意表达（4字+）
        '心动不已', '怦然心动', '心头一软', '心头微动', '心中一暖',
        '目光柔软', '眼神温柔', '语气温柔', '小心翼翼', '温柔地笑',
        '怦然心动', '衣袖遮风', '为你挡雨', '满心欢喜',
        '甜言蜜语', '情意绵绵', '含情脉脉', '甜甜蜜蜜',
        '耳鬓厮磨', '如胶似漆', '卿卿我我', '你侬我侬',
        '眉目传情', '秋波暗送', '柔情似水', '佳偶天成',
        '天作之合', '比翼双飞', '琴瑟和鸣', '举案齐眉',
        '初恋味道', '暗恋心事', '心动瞬间', '告白时刻',
        // 校园/日常甜宠
        '同桌', '暗恋', '告白', '表白', '情书', '初恋',
        '放学', '等你', '回家', '等你来', '课后',
        '一起走', '牵着手', '靠着肩', '靠着你',
        '小脸蛋', '小脑袋', '小手', '乖巧',
        '公主抱', '壁咚', '摸头杀', '捏脸', '宠溺笑',
        '护短', '独宠', '专宠', '溺爱', '偏爱',
        '心动', '心尖', '心肝', '心上人', '意中人',
        '恋爱中', '热恋', '约会', '约会吧', '在一起'
      ],
      bg: 'bg-cherry',
      filterPreset: { warmth: 60, vignette: 20, brightness: 95 },
      music: 'sweet'
    },
    angsty: {
      label: '虐心',
      words: [
        // 悲伤痛苦（2字）
        '痛苦', '悲伤', '眼泪', '哭泣', '心碎', '绝望', '心寒', '冰冷', '凄凉',
        '离别', '分离', '分别', '放手', '离开', '消失', '孤独', '寂寞', '孤单',
        '落寞', '萧瑟', '凄惨', '无助', '迷茫', '心口', '疼痛', '窒息', '泪水',
        '泪流', '泪痕', '泪珠', '哽咽', '沉默', '空洞', '灰暗', '黯淡', '黯然',
        '苦涩', '酸涩', '鼻酸', '强忍', '忍住', '噩梦', '惊醒', '冷汗', '颤抖',
        '蜷缩', '痛心', '痛惜', '不甘', '无奈', '苦笑', '惨笑', '血痕', '伤痕',
        '伤口', '结痂', '愈合', '离别', '遗弃', '背叛', '辜负', '错过', '遗憾',
        '残缺', '破碎', '枯萎', '凋零', '凋落', '荒凉', '凄冷', '阴霾',
        // 悲伤痛苦（3字）
        '喘不过气', '湿透了', '发紧了', '惨白的', '绝望地', '凄凉地', '悲凉地',
        '孤独地', '寂寞地', '沉默地', '空洞的', '灰暗的', '惨淡的', '凄惨的',
        // 悲伤痛苦（4字+）
        '心如刀割', '心如刀绞', '痛彻心扉', '万箭穿心', '肝肠寸断',
        '伤痕累累', '遍体鳞伤', '支离破碎', '碎了一地',
        '来不及了', '再也回不', '再也见不', '再也听不',
        '天崩地裂', '天塌了', '世界崩塌', '一片漆黑',
        '喉咙发紧', '嘴唇发白', '脸色苍白', '咬住嘴唇',
        '对不起你', '没关系了', '忘了你吧', '忘记一切',
        '缩成一团', '隐忍着', '默默流泪', '无声哭泣',
        '痛不欲生', '生不如死', '哀莫大于', '物是人非',
        '人走茶凉', '曲终人散', '孤影独怜', '形单影只',
        '茕茕孑立', '形影相吊', '黯然神伤', '悲从中来',
        '泪如雨下', '泣不成声', '号啕大哭', '泪流满面',
        '沧海桑田', '时过境迁', '物换星移', '斗转星移',
        '阴阳两隔', '天人永隔', '生死相隔', '永不相见',
        '咫尺天涯', '天涯陌路', '陌路殊途', '渐行渐远',
        '刻骨铭心', '难以忘怀', '挥之不去', '记忆犹新',
        '触景生情', '睹物思人', '借酒消愁', '愁肠百结',
        '夜不能寐', '辗转反侧', '孤枕难眠', '形影相吊',
        '离别之痛', '分别之苦', '相思之苦', '爱而不得',
        '求而不得', '得而复失', '失之交臂', '追悔莫及',
        '无能为力', '望洋兴叹', '无可奈何', '徒劳无功'
      ],
      bg: 'bg-rain',
      filterPreset: { warmth: 20, vignette: 50, brightness: 70 },
      music: 'angsty'
    },
    passionate: {
      label: '热血',
      words: [
        // 激昂热烈（2字）
        '热血', '战斗', '勇敢', '强大', '力量', '燃烧', '怒吼', '咆哮', '呐喊',
        '奋力', '气势', '威压', '压倒', '碾压', '横扫', '无敌', '剑光', '出招',
        '一击', '破空', '气劲', '灵力', '真气', '突破', '觉醒', '进化', '修炼',
        '境界', '飞升', '激情', '激昂', '豪情', '壮志', '不服', '逆天', '誓言',
        '承诺', '守护', '捍卫', '担当', '使命', '责任', '兄弟', '并肩', '战友',
        '同袍', '胜利', '凯旋', '荣耀', '辉煌', '巅峰', '震撼', '惊天', '动地',
        '爆发', '浩瀚', '无穷', '无敌手', '所向', '披靡', '斗志', '昂扬',
        '冲锋', '冲刺', '冲刺', '决斗', '厮杀', '对决', '对抗', '迎战',
        // 激昂热烈（3字）
        '冲上去', '拼了命', '全力以', '往前冲', '怒吼道', '咆哮着',
        '热血沸', '要变强', '绝不服', '不认输', '站起来',
        '战到底', '杀上去', '冲过去', '冲过去', '不退缩',
        '天地间', '风云变', '雷电交',
        // 激昂热烈（4字+）
        '全力以赴', '勇往直前', '绝不退缩', '所向披靡',
        '突破极限', '热血沸腾', '逆天而行', '逆流而上',
        '绝不认输', '奋不顾身', '挺身而出', '挡在前面',
        '惊天动地', '风云变幻', '天地乾坤', '日月星辰',
        '一起战斗', '燃烧吧', '爆发出', '蕴含着',
        '气势磅礴', '排山倒海', '翻江倒海', '雷霆万钧',
        '天崩地裂', '石破天惊', '气吞山河', '势如破竹',
        '锐不可当', '势不可挡', '所向无敌', '横扫千军',
        '金戈铁马', '烽火连天', '血战到底', '浴血奋战',
        '不屈不挠', '宁死不屈', '视死如归', '舍生忘死',
        '一往无前', '义无反顾', '前赴后继', '赴汤蹈火',
        '粉身碎骨', '在所不惜', '万死不辞', '死而后已',
        '破釜沉舟', '背水一战', '孤注一掷', '殊死搏斗',
        '绝地反击', '逆转乾坤', '扭转乾坤', '力挽狂澜',
        '临危不惧', '大义凛然', '浩然正气', '气冲霄汉',
        '壮志凌云', '志存高远', '胸怀天下', '心怀苍生',
        '巅峰对决', '终极之战', '最终决战', '命运之战',
        '王者归来', '浴火重生', '凤凰涅槃', '百炼成钢'
      ],
      bg: 'bg-sunset',
      filterPreset: { warmth: 70, vignette: 30, brightness: 90 },
      music: 'passionate'
    },
    suspense: {
      label: '悬疑',
      words: [
        // 悬疑紧张（2字）
        '神秘', '诡异', '黑暗', '阴冷', '幽暗', '恐怖', '寒意', '影子', '黑影',
        '暗处', '角落', '迷雾', '浓雾', '薄雾', '雾气', '异响', '蹊跷', '突然',
        '忽然', '猛地', '骤然', '背后', '身后', '回头', '秘密', '阴谋', '真相',
        '隐藏', '掩盖', '揭开', '发现', '线索', '证据', '痕迹', '破绽', '疑点',
        '失踪', '离奇', '恐惧', '害怕', '畏惧', '战栗', '盯住', '凝视', '注视',
        '走廊', '楼道', '阁楼', '密室', '昏暗', '漆黑', '低语', '呢喃', '耳语',
        '回声', '回响', '紧迫', '危险', '危机', '猜疑', '怀疑', '试探', '暗中',
        '密谋', '策划', '谜团', '迷局', '谜底', '惊恐', '惊惧', '惨白', '可疑',
        '不安', '惶恐', '紧张', '压抑', '窒息感', '毛骨悚',
        // 悬疑紧张（3字）
        '不对劲', '有蹊跷', '什么人', '那个人', '神秘人', '陌生人',
        '回头望', '转过头', '蛛丝马', '千钧一', '生死存',
        '真相白', '不寒栗', '冒冷汗',
        // 悬疑紧张（4字+）
        '毫无预兆', '出其不意', '猛然回头', '一回头去',
        '心跳加速', '屏住呼吸', '不寒而栗', '毛骨悚然',
        '伸手不见', '窃窃私语', '千钧一发', '生死存亡',
        '真相大白', '匪夷所思', '倒计时了', '脚步声响',
        '死死盯着', '环顾四周', '扫视四周', '地下室里',
        '触目惊心', '令人发指', '不寒而栗', '心惊肉跳',
        '胆战心惊', '心惊胆战', '如履薄冰', '如临深渊',
        '步步惊心', '危机四伏', '暗藏杀机', '杀机四伏',
        '危机重重', '险象环生', '命悬一线', '岌岌可危',
        '扑朔迷离', '真假难辨', '雾里看花', '水中望月',
        '疑云密布', '迷雾重重', '重重迷雾', '深不可测',
        '讳莫如深', '欲盖弥彰', '欲说还休', '闪烁其词',
        '蛛丝马迹', '顺藤摸瓜', '抽丝剥茧', '层层剥开',
        '骇人听闻', '耸人听闻', '闻风丧胆', '谈虎色变',
        '鬼鬼祟祟', '形迹可疑', '暗度陈仓', '偷天换日',
        '瞒天过海', '暗箭难防', '防不胜防', '猝不及防',
        '杀气腾腾', '凶相毕露', '原形毕露', '图穷匕见',
        '月黑风高', '风声鹤唳', '草木皆兵', '杯弓蛇影',
        '疑神疑鬼', '心神不宁', '坐立不安', '寝食难安',
        '阴谋诡计', '诡计多端', '居心叵测', '心怀叵测'
      ],
      bg: 'bg-stars',
      filterPreset: { warmth: 10, vignette: 60, brightness: 65 },
      music: 'suspense'
    }
  };

  /* ------------------------------------------------------------------
     2. 标点情绪映射表
     ------------------------------------------------------------------ */
  const PUNCT_EMOTION_WEIGHTS = {
    sweet: {
      '～': 0.5,
      '~': 0.5,
      '♡': 2.0,
      '♥': 2.0,
      '❤': 2.0,
      '…': 0.1   // 省略号在甜宠中偏弱
    },
    angsty: {
      '…': 1.5,
      '……': 2.0,
      '⋯⋯': 2.0,
      '。': 0.2,
      '、': 0.1
    },
    passionate: {
      '！': 2.0,
      '！！': 3.0,
      '！！！': 4.0
    },
    suspense: {
      '？': 1.5,
      '？？': 2.5,
      '？？？': 3.5,
      '！？': 2.0,
      '？！': 2.0,
      '…': 1.0,
      '……': 1.5,
      '…！': 2.5
    }
  };

  /* ------------------------------------------------------------------
     3. 预编译正则缓存
     ------------------------------------------------------------------ */
  const _regexCache = new Map();

  /**
   * 根据关键词列表生成 OR 连接的预编译正则
   * 按词长降序排列保证最长匹配优先
   */
  function buildKeywordRegex(words) {
    if (_regexCache.has(words)) return _regexCache.get(words);
    // 按长度降序排列，确保长词优先匹配
    const sorted = [...words].sort((a, b) => b.length - a.length);
    // 转义正则特殊字符
    const escaped = sorted.map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    const pattern = escaped.join('|');
    const regex = new RegExp(pattern, 'g');
    _regexCache.set(words, regex);
    return regex;
  }

  // 预编译所有情绪的关键词正则
  const _emotionRegexes = {};
  for (const [emotion, config] of Object.entries(EMOTION_KEYWORDS)) {
    _emotionRegexes[emotion] = buildKeywordRegex(config.words);
  }

  // 预编译标点统计正则
  const _punctRegex = /[！？…～~♡♥❤。、]{1,}/g;
  const _ellipsisRegex = /\.{3,}|…+|⋯+/g;
  const _exclamationRegex = /[！]{1,}/g;
  const _questionRegex = /[？]{1,}/g;
  const _dialogRegex = /[「」""''『』]/g;

  /* ------------------------------------------------------------------
     4. 段落分析结果缓存（Map）
     ------------------------------------------------------------------ */
  const _paragraphCache = new Map();
  const PARAGRAPH_CACHE_MAX = 2000;

  function getCacheKey(text) {
    // 简单哈希，用前200字符 + 长度做 key（平衡性能和准确性）
    if (text.length <= 200) return text;
    return text.slice(0, 200) + '::' + text.length;
  }

  /* ------------------------------------------------------------------
     5. 多维度评分核心
     ------------------------------------------------------------------ */

  /**
   * 维度一：关键词匹配评分
   * 词长加权：4字以上=3.0，3字=2.0，2字=1.0
   * @returns {{ sweet: number, angsty: number, passionate: number, suspense: number }}
   */
  function scoreByKeywords(text) {
    const scores = { sweet: 0, angsty: 0, passionate: 0, suspense: 0 };

    for (const [emotion, regex] of Object.entries(_emotionRegexes)) {
      let match;
      let count = 0;
      const r = new RegExp(regex.source, regex.flags);
      while ((match = r.exec(text)) !== null) {
        const word = match[0];
        const len = word.length;
        // 按词长分级加权
        const weight = len >= 4 ? 3.0 : len === 3 ? 2.0 : 1.0;
        scores[emotion] += weight;
        count++;
        // 防止零宽匹配死循环
        if (word.length === 0) r.lastIndex++;
      }
    }

    return scores;
  }

  /**
   * 维度二：标点情绪评分
   * ！密度 → 热血/悬疑紧张感
   * ？密度 → 悬疑
   * ……省略号 → 虐心悲伤感
   * ～/~ → 甜宠
   * @returns {{ sweet: number, angsty: number, passionate: number, suspense: number }}
   */
  function scoreByPunctuation(text) {
    const scores = { sweet: 0, angsty: 0, passionate: 0, suspense: 0 };
    const textLen = Math.max(text.length, 1);

    // 统计各标点出现情况
    let ellipsisCount = 0;
    let exclamationCount = 0;
    let questionCount = 0;

    let m;
    const ellipsisRe = new RegExp(_ellipsisRegex.source, 'g');
    while ((m = ellipsisRe.exec(text)) !== null) {
      ellipsisCount += m[0].length;
    }
    const exclRe = new RegExp(_exclamationRegex.source, 'g');
    while ((m = exclRe.exec(text)) !== null) {
      exclamationCount += m[0].length;
    }
    const quesRe = new RegExp(_questionRegex.source, 'g');
    while ((m = quesRe.exec(text)) !== null) {
      questionCount += m[0].length;
    }

    // 按字符数加权
    scores.angsty += ellipsisCount * 1.5;
    scores.suspense += questionCount * 1.8;
    scores.suspense += ellipsisCount * 0.8;
    scores.passionate += exclamationCount * 1.6;
    scores.suspense += exclamationCount * 0.5;

    // 使用精确标点映射加分
    const punctMatches = text.match(_punctRegex) || [];
    for (const p of punctMatches) {
      for (const [emotion, mapping] of Object.entries(PUNCT_EMOTION_WEIGHTS)) {
        if (mapping[p] !== undefined) {
          scores[emotion] += mapping[p];
        }
      }
    }

    return scores;
  }

  /**
   * 维度三：句式结构分析
   * 短句密集 → 紧张/热血
   * 长句 → 抒情/虐心
   * 对话格式 → 甜宠倾向
   * @returns {{ sweet: number, angsty: number, passionate: number, suspense: number }}
   */
  function scoreBySentenceStructure(text) {
    const scores = { sweet: 0, angsty: 0, passionate: 0, suspense: 0 };
    const textLen = Math.max(text.length, 1);

    // 按 。！？ 分句
    const sentences = text.split(/[。！？；\n]+/).filter(s => s.trim().length > 0);
    if (sentences.length === 0) return scores;

    // 计算平均句长
    const totalChars = sentences.reduce((sum, s) => sum + s.length, 0);
    const avgLen = totalChars / sentences.length;

    // 短句密集（平均句长 < 12）→ 紧张/热血
    if (avgLen < 12) {
      const intensity = Math.min(1, (12 - avgLen) / 8) * sentences.length * 0.5;
      scores.passionate += intensity;
      scores.suspense += intensity * 0.6;
    }

    // 长句（平均句长 > 25）→ 抒情/虐心
    if (avgLen > 25) {
      const intensity = Math.min(1, (avgLen - 25) / 20) * sentences.length * 0.5;
      scores.angsty += intensity;
      scores.sweet += intensity * 0.3;
    }

    // 对话格式检测（「」"" ''）→ 甜宠倾向
    const dialogChars = (text.match(_dialogRegex) || []).length;
    const dialogRatio = dialogChars / (textLen * 0.5); // 归一化
    if (dialogRatio > 0.05) {
      scores.sweet += Math.min(5, dialogRatio * 8);
    }

    // 极短句密度（大量1-4字的句子）→ 强烈紧张
    const shortSentences = sentences.filter(s => s.trim().length <= 4).length;
    if (shortSentences >= 3 && avgLen < 10) {
      const burstIntensity = Math.min(5, shortSentences * 0.8);
      scores.passionate += burstIntensity;
      scores.suspense += burstIntensity * 0.4;
    }

    return scores;
  }

  /* ------------------------------------------------------------------
     6. 上下文窗口平滑
     ------------------------------------------------------------------ */
  const CONTEXT_WEIGHTS = { prev: 0.2, current: 0.6, next: 0.2 };

  /**
   * 对单个段落应用上下文窗口平滑
   * @param {string[]} paragraphs - 所有段落文本
   * @param {number} index - 当前段落索引
   * @returns {{ sweet: number, angsty: number, passionate: number, suspense: number }}
   */
  function smoothWithContext(paragraphs, index) {
    const rawScores = { prev: null, current: null, next: null };

    if (index > 0) {
      rawScores.prev = analyzeParagraphRaw(paragraphs[index - 1]);
    }
    rawScores.current = analyzeParagraphRaw(paragraphs[index]);
    if (index < paragraphs.length - 1) {
      rawScores.next = analyzeParagraphRaw(paragraphs[index + 1]);
    }

    const blended = { sweet: 0, angsty: 0, passionate: 0, suspense: 0 };
    const emotions = ['sweet', 'angsty', 'passionate', 'suspense'];

    for (const emo of emotions) {
      let total = 0;
      let weightSum = 0;
      if (rawScores.prev) {
        total += rawScores.prev[emo] * CONTEXT_WEIGHTS.prev;
        weightSum += CONTEXT_WEIGHTS.prev;
      }
      total += rawScores.current[emo] * CONTEXT_WEIGHTS.current;
      weightSum += CONTEXT_WEIGHTS.current;
      if (rawScores.next) {
        total += rawScores.next[emo] * CONTEXT_WEIGHTS.next;
        weightSum += CONTEXT_WEIGHTS.next;
      }
      blended[emo] = weightSum > 0 ? total / weightSum : 0;
    }

    return blended;
  }

  /* ------------------------------------------------------------------
     7. 原始段落分析（不带上下文，用于缓存和平滑）
     ------------------------------------------------------------------ */

  /**
   * 分析单个段落的原始多维度评分（不带上下文平滑）
   * @param {string} text
   * @returns {{ sweet: number, angsty: number, passionate: number, suspense: number }}
   */
  function analyzeParagraphRaw(text) {
    const cacheKey = getCacheKey(text);
    if (_paragraphCache.has(cacheKey)) {
      return _paragraphCache.get(cacheKey);
    }

    // 三个维度评分
    const keywordScores = scoreByKeywords(text);
    const punctScores = scoreByPunctuation(text);
    const structureScores = scoreBySentenceStructure(text);

    // 维度权重：关键词 50%，标点 25%，句式结构 25%
    const emotions = ['sweet', 'angsty', 'passionate', 'suspense'];
    const raw = {};
    for (const emo of emotions) {
      raw[emo] = keywordScores[emo] * 0.5 + punctScores[emo] * 0.25 + structureScores[emo] * 0.25;
    }

    // 根据文本长度归一化
    const textLen = Math.max(text.length, 1);
    const factor = 100 / textLen;
    for (const emo of emotions) {
      raw[emo] = Math.min(100, raw[emo] * factor * 8);
    }

    // 写入缓存
    if (_paragraphCache.size >= PARAGRAPH_CACHE_MAX) {
      // LRU：删除最早插入的 key
      const firstKey = _paragraphCache.keys().next().value;
      _paragraphCache.delete(firstKey);
    }
    _paragraphCache.set(cacheKey, raw);

    return raw;
  }

  /* ------------------------------------------------------------------
     8. 氛围配置构建
     ------------------------------------------------------------------ */

  /**
   * 根据评分构建完整的氛围配置对象
   * @param {Object} rawScores - { sweet: n, angsty: n, ... }
   * @param {string|null} dominantEmotion
   * @param {number} confidence
   * @returns {Object}
   */
  function buildAtmosphereConfig(rawScores, dominantEmotion, confidence) {
    const config = EMOTION_KEYWORDS[dominantEmotion];
    return {
      bg: config ? config.bg : null,
      filterPreset: config ? { ...config.filterPreset } : null,
      music: config ? config.music : null
    };
  }

  /* ------------------------------------------------------------------
     9. 公开 API
     ------------------------------------------------------------------ */

  /**
   * 分析单个段落的情绪（带上下文平滑）
   * @param {string} text - 段落文本
   * @returns {Object} - 完整情绪分析结果
   */
  function analyzeParagraph(text) {
    return analyzeParagraphWithContext(text, [text], 0);
  }

  /**
   * 带上下文的段落分析（供 analyzeFullText 内部使用）
   */
  function analyzeParagraphWithContext(text, paragraphs, index) {
    // 带上下文平滑的评分
    const smoothed = smoothWithContext(paragraphs, index);

    // 找到最高分的情绪
    let maxEmotion = null;
    let maxScore = 0;
    let totalScore = 0;

    for (const [emotion, score] of Object.entries(smoothed)) {
      totalScore += score;
      if (score > maxScore) {
        maxScore = score;
        maxEmotion = emotion;
      }
    }

    const confidence = totalScore > 0 ? maxScore / totalScore : 0;

    // 取整后的 scores 用于展示
    const displayScores = {};
    for (const [emo, score] of Object.entries(smoothed)) {
      displayScores[emo] = Math.round(score);
    }

    // 构建氛围配置
    const atmosphere = buildAtmosphereConfig(smoothed, maxEmotion, confidence);

    return {
      emotion: maxScore > 3 ? maxEmotion : null,
      label: maxScore > 3 && maxEmotion ? EMOTION_KEYWORDS[maxEmotion].label : null,
      confidence: Math.round(confidence * 100) / 100,
      scores: displayScores,
      atmosphere,
      dominant: maxEmotion,
      maxScore: Math.round(maxScore)
    };
  }

  /**
   * 分析整段文本，返回每段的情绪（带上下文平滑）
   * @param {string} fullText - 完整小说文本
   * @returns {Array} - 段落数组，每个带情绪标签和氛围配置
   */
  function analyzeFullText(fullText) {
    // 分段：按换行或双换行
    const rawParagraphs = fullText
      .split(/\n\s*\n|\n/)
      .map(p => p.trim())
      .filter(p => p.length > 0);

    return rawParagraphs.map((text, index) => {
      const emotionResult = analyzeParagraphWithContext(text, rawParagraphs, index);
      return {
        index,
        text,
        emotion: emotionResult.emotion,
        emotionLabel: emotionResult.label,
        confidence: emotionResult.confidence,
        scores: emotionResult.scores,
        atmosphere: emotionResult.atmosphere,
        bg: emotionResult.atmosphere ? emotionResult.atmosphere.bg : null
      };
    });
  }

  /**
   * 从文本中提取角色名
   * @param {string} fullText - 完整小说文本
   * @returns {Array} - 角色列表 [{ name, count }]
   */
  function extractCharacters(fullText) {
    const nameCount = {};
    const STOP_WORDS = new Set([
      '这个', '那个', '什么', '怎么', '为什么', '不过', '但是', '虽然', '如果',
      '因为', '所以', '而且', '或者', '已经', '还是', '只是', '只有', '不要',
      '不能', '不会', '可以', '应该', '也许', '可能', '一定', '突然', '忽然',
      '于是', '然后', '接着', '最后', '终于', '竟然', '居然', '难道', '究竟',
      '到底', '真的', '一直', '果然', '原来', '其实', '当然', '这样', '那样',
      '怎样', '这里', '那里', '哪里', '自己', '他们', '她们', '我们', '你们',
      '大家', '别人', '有人', '没人', '看着', '想着', '说着', '知道', '觉得',
      '认为', '发现', '感觉', '看到', '听到', '想到', '来到', '站在', '坐在',
      '走', '跑', '起来', '下去', '出去', '回来', '过来', '上去', '下来'
    ]);

    // 人名识别模式
    const NAME_PATTERNS = [
      /([^\s，。！？、；：""''（）\[\]【】《》\d]{2,4})(说|笑道|喊道|问道|答道|低声说|轻声说|沉声说|冷声说|怒声说|柔声说|嘀咕道|嘟囔道|喃喃道|冷冷地说|淡淡地说|微笑着说|皱眉说|叹气道)/g,
      /([^\s，。！？、；：""''（）\[\]【】《》\d]{2,4})(看了一眼|望向|走向|拉着|推着|扶着|拥抱着|握住|牵起|抱住|挡在)/g,
      /([^\s，。！？、；：""''（）\[\]【】《》\d]{2,3})[：:]/g
    ];

    for (const pattern of NAME_PATTERNS) {
      let match;
      const regex = new RegExp(pattern.source, pattern.flags);
      while ((match = regex.exec(fullText)) !== null) {
        const name = match[1];
        if (!STOP_WORDS.has(name)) {
          const weight = pattern.source.includes('[：:]') ? 2 : 1;
          nameCount[name] = (nameCount[name] || 0) + weight;
        }
      }
    }

    // 按出现次数排序，取前8个
    return Object.entries(nameCount)
      .filter(([name, count]) => count >= 2)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name, count]) => ({ name, count }));
  }

  /**
   * 计算全文总体情绪分布
   * @param {Array} paragraphs - analyzeFullText 的返回结果
   * @returns {Object} - { sweet: pct, angsty: pct, ... }
   */
  function getOverallEmotionDistribution(paragraphs) {
    const totals = { sweet: 0, angsty: 0, passionate: 0, suspense: 0 };
    let identified = 0;

    for (const p of paragraphs) {
      if (p.emotion) {
        totals[p.emotion]++;
        identified++;
      }
    }

    if (identified === 0) return totals;

    return {
      sweet: Math.round((totals.sweet / identified) * 100),
      angsty: Math.round((totals.angsty / identified) * 100),
      passionate: Math.round((totals.passionate / identified) * 100),
      suspense: Math.round((totals.suspense / identified) * 100)
    };
  }

  /**
   * 清除段落缓存（供外部调用）
   */
  function clearCache() {
    _paragraphCache.clear();
  }

  return {
    analyzeParagraph,
    analyzeFullText,
    extractCharacters,
    getOverallEmotionDistribution,
    clearCache,
    EMOTION_KEYWORDS
  };
})();
