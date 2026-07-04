/* ============================================================
   坏情绪粉碎机 · 情绪分析引擎
   基于关键词权重的本地分析（无需后端）
   ============================================================ */

(function () {
  'use strict';

  // 6 大情绪维度：压力/愤怒/焦虑/悲伤/孤独/喜悦
  const DICT = {
    stress: {
      label: '压力',
      emoji: '💼',
      color: '#F59E0B',
      words: {
        // 高权重
        '加班': 3, 'kpi': 3, 'KPI': 3, 'okr': 3, 'OKR': 3, 'ddl': 3, 'DDL': 3, 'deadline': 3, 'deadline': 3,
        '甲方': 3, '老板': 2, '领导': 2, '主管': 2, '周报': 2, '日报': 2, '会议': 2, 'ppt': 2, 'PPT': 2,
        '汇报': 2, '项目': 2, '提案': 2, '需求': 2, '改稿': 3, '返工': 3, '上线': 2, 'bug': 2, 'BUG': 2,
        '背锅': 3, '甩锅': 3, '内卷': 3, '裁员': 3, '优化': 2, '绩效': 2, '考核': 2,
        // 中
        '累': 2, '忙': 2, '赶': 2, '通宵': 3, '熬夜': 2, '加班': 3, '任务': 2, '工作': 1, '上班': 1, '下班': 1,
      },
    },
    anger: {
      label: '愤怒',
      emoji: '😤',
      color: '#EF4444',
      words: {
        '滚': 3, '去死': 4, '傻逼': 4, 'shabi': 4, 'sb': 3, '垃圾': 3, '废物': 3, '废物': 3,
        '气死': 3, '气炸': 3, '气死': 3, '恼火': 3, '火大': 3, '愤怒': 3, '怒': 2, '气': 2, '烦': 2,
        '草': 2, 'fuck': 4, 'fxxk': 4, 'shit': 4, 'damn': 3, 'wtf': 3, 'tmd': 4, '妈的': 3,
        '受不了': 3, '过分': 2, '太过分': 3, '离谱': 2, '崩': 2, '破防': 2, '炸了': 3,
        '不公': 2, '欺负': 2, '委屈': 2, '凭什么': 3, '无语': 2, '离谱': 2,
      },
    },
    anxiety: {
      label: '焦虑',
      emoji: '😰',
      color: '#8B5CF6',
      words: {
        '焦虑': 3, '紧张': 3, '担心': 2, '怕': 2, '害怕': 2, '恐惧': 3, '惶恐': 3, '不安': 2,
        '迷茫': 3, '彷徨': 3, '未知': 2, '将来': 1, '未来': 1, '以后': 1, '万一': 2, '如果': 1,
        '睡不着': 3, '失眠': 3, '噩梦': 2, '心慌': 2, '心跳': 2, '喘': 2, '窒息': 3,
        '考试': 2, '面试': 2, '答辩': 2, '选择': 2, '纠结': 3, '犹豫': 2, '没想好': 2,
        '卷': 2, '比不过': 3, '落后': 2, '差距': 2, '丢人': 2, '失败': 2,
      },
    },
    sadness: {
      label: '悲伤',
      emoji: '🥺',
      color: '#3B82F6',
      words: {
        '难过': 3, '伤心': 3, '哭': 2, '想哭': 3, '流泪': 3, '眼泪': 2, '哭死': 3,
        'emo': 3, 'EMO': 3, '低落': 3, '失望': 2, '绝望': 3, '心碎': 3, '碎': 2, '心死': 3,
        '想念': 2, '想他': 2, '想她': 2, '分手': 3, '失恋': 3, '离别': 3, '去世': 3, '离开': 2,
        '孤独': 3, '寂寞': 3, '没人懂': 3, '不被理解': 3, '不被爱': 3, '卑微': 3,
        '抑郁': 3, '抑郁症': 3, '不开心': 2, '难受': 2, '痛苦': 3,
      },
    },
    lonely: {
      label: '孤独',
      emoji: '🌙',
      color: '#6366F1',
      words: {
        '一个人': 3, '独自': 3, '单身': 2, '一个人吃饭': 3, '一个人看电影': 3,
        '没人陪': 3, '没人聊天': 3, '没人说话': 3, '一个人睡': 3, '自己': 1,
        '朋友': 1, '闺蜜': 1, '兄弟': 1, '家人': 1, '爸妈': 1, '父母': 1,
        '想家': 3, '想妈妈': 3, '想爸爸': 3, '想朋友': 2, '想他': 2, '想她': 2,
        '社恐': 3, 'i人': 2, 'E人': -1, '内向': 2, '不擅长': 1, '不合群': 3,
        '异乡': 2, '外地': 1, '出租屋': 3, '独居': 3, '空房间': 3,
      },
    },
    joy: {
      label: '喜悦',
      emoji: '✨',
      color: '#10B981',
      words: {
        '开心': 3, '快乐': 3, '高兴': 3, '爽': 2, '舒服': 2, '棒': 2, '赞': 1, '完美': 3,
        '哈哈': 2, '哈哈哈': 3, '嘻嘻': 2, '嘿嘿': 2, 'lol': 2, '笑死': 2, '笑哭': 2,
        '爱': 1, '喜欢': 1, '心动': 2, '幸福': 3, '甜': 2, '甜蜜': 3, '温暖': 2,
        '谢谢': 2, '感谢': 2, '感恩': 2, '遇见': 1, '被理解': 3, '被爱': 3,
        '涨薪': 4, '升职': 4, '加薪': 4, '中奖': 4, '上岸': 4, '收到offer': 4,
        '放假': 3, '周末': 2, '出游': 2, '旅行': 2, '美食': 2, '好吃': 1,
      },
    },
  };

  // 否定词（在否定词后的情绪权重反转）
  const NEGATORS = ['不', '没', '别', '无', '非', '未', '没有', '不会', '不想', '不敢'];

  function tokenize(text) {
    if (!text) return [];
    // 中文按字符 / 英文按单词
    const tokens = [];
    let buf = '';
    for (const ch of text) {
      if (/[\u4e00-\u9fa5]/.test(ch)) {
        if (buf) { tokens.push(buf); buf = ''; }
        tokens.push(ch);
      } else if (/[a-zA-Z0-9]/.test(ch)) {
        buf += ch;
      } else {
        if (buf) { tokens.push(buf); buf = ''; }
        tokens.push(ch);
      }
    }
    if (buf) tokens.push(buf);
    return tokens;
  }

  function bigrams(tokens) {
    const out = [];
    for (let i = 0; i < tokens.length - 1; i++) {
      out.push(tokens[i] + tokens[i + 1]);
    }
    return out;
  }

  // 找到词位置用于否定词检测
  function checkNegation(text, pos) {
    // 检查 pos 前面 2 字符内是否有否定词
    const before = text.slice(Math.max(0, pos - 4), pos);
    return NEGATORS.some(n => before.includes(n));
  }

  // 分析一段文本，返回每维情绪分数（0-100）+ 主导情绪
  function analyze(text) {
    if (!text || !text.trim()) {
      return { scores: zeroScores(), dominant: null, topWords: [], totalScore: 0 };
    }
    const scores = zeroScores();
    const wordHits = {}; // emotion -> [{word, weight}]
    const tokens = tokenize(text);
    const bigramList = bigrams(tokens);
    const haystack = text;

    // 单字 & 双字 & 完整词匹配
    Object.keys(DICT).forEach(emotion => {
      const words = DICT[emotion].words;
      const hits = [];
      Object.keys(words).forEach(w => {
        let regex;
        if (w.length === 1) {
          regex = new RegExp(w, 'g');
        } else {
          regex = new RegExp(escapeReg(w), 'g');
        }
        let m;
        let lastIdx = 0;
        while ((m = regex.exec(haystack)) !== null) {
          // 检查是否在否定词后面
          const negated = checkNegation(haystack, m.index);
          const w0 = words[w];
          const weight = negated ? -w0 * 0.6 : w0;
          hits.push({ word: w, weight, negated, idx: m.index });
          lastIdx = m.index;
        }
      });
      if (hits.length) {
        const total = hits.reduce((s, h) => s + h.weight, 0);
        scores[emotion] = Math.max(0, total);
        wordHits[emotion] = hits;
      }
    });

    // 归一化到 0-100
    const max = Math.max(1, ...Object.values(scores));
    Object.keys(scores).forEach(k => {
      scores[k] = Math.round((scores[k] / max) * 100);
    });

    // 主导情绪
    const dominant = pickDominant(scores);

    // 提取高权重关键词
    const allHits = [];
    Object.keys(wordHits).forEach(em => {
      wordHits[em].forEach(h => allHits.push({ ...h, emotion: em }));
    });
    allHits.sort((a, b) => Math.abs(b.weight) - Math.abs(a.weight));
    const topWords = allHits.slice(0, 5).map(h => ({ word: h.word, emotion: DICT[h.emotion].label }));

    const totalScore = Object.values(scores).reduce((a, b) => a + b, 0);

    return { scores, dominant, topWords, totalScore };
  }

  function pickDominant(scores) {
    let best = null, bestVal = 0;
    Object.keys(scores).forEach(k => {
      if (scores[k] > bestVal) { bestVal = scores[k]; best = k; }
    });
    if (!best || bestVal < 5) return null;
    return { key: best, label: DICT[best].label, emoji: DICT[best].emoji, color: DICT[best].color, value: bestVal };
  }

  function zeroScores() {
    return { stress: 0, anger: 0, anxiety: 0, sadness: 0, lonely: 0, joy: 0 };
  }

  function escapeReg(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

  // 综合多段文本分析
  function analyzeMultiple(texts) {
    const merged = zeroScores();
    const allTop = [];
    texts.forEach(t => {
      const r = analyze(t);
      Object.keys(merged).forEach(k => { merged[k] = Math.max(merged[k], r.scores[k]); });
      if (r.dominant) allTop.push(r);
    });
    return { scores: merged, dominant: pickDominant(merged), topWords: allTop.flatMap(r => r.topWords).slice(0, 8) };
  }

  // 一句话吐槽总结（犀利版）
  function roastSummary(analysis) {
    const dom = analysis.dominant;
    if (!dom) {
      return { title: '今日波澜不惊', text: '今天的你，情绪稳定得像一条直线 ✨ 是个狠人。' };
    }
    const map = {
      stress: { title: '压力爆表', text: '被工作压得喘不过气？没关系，戳破云朵的瞬间，加班费没到但你到了 🫡' },
      anger: { title: '怒气值拉满', text: '今天谁惹你了？说出来！我帮你把 ta 钉在云朵上 🪛' },
      anxiety: { title: '焦虑中', text: '未来还没来，但你已经替它焦虑了 800 轮 🌀 试试呼吸几下' },
      sadness: { title: '低气压笼罩', text: '抱抱你。今天的你已经很努力了，允许自己丧一会儿 ☁️' },
      lonely: { title: '独自闪烁', text: '你其实并不孤独，只是热闹都和你隔着一层屏幕 🌙' },
      joy:  { title: '今日高光', text: '快乐很难得，记得截图保存 🪄' },
    };
    return map[dom.key] || { title: '今日情绪', text: '情绪丰富，挺好。' };
  }

  // 文字 → 心情 emoji
  function moodEmoji(text) {
    const r = analyze(text);
    if (!r.dominant) return '😐';
    const map = { stress: '😮‍💨', anger: '😤', anxiety: '😰', sadness: '🥺', lonely: '🌙', joy: '✨' };
    return map[r.dominant.key] || '😐';
  }

  window.MCAnalyzer = { analyze, analyzeMultiple, roastSummary, moodEmoji, pickDominant, DICT, zeroScores };
})();
