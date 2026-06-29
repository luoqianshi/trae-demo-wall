/* ============================================================
 * EmotionDictionary - 情绪字典系统
 * 对标 Reference-php includes/emotion_dict.php
 * 8 类情绪 + 密度分析 + 曲线异常检测
 * ============================================================ */

const EmotionDictionary = {

  // ===== 8 类情绪分类（Plutchik 轮模型的中文适配版）=====
  EMOTION_CATEGORIES: {
    joy:        { label: '喜悦', color: '#FFD700' },
    sadness:    { label: '悲伤', color: '#4682B4' },
    anger:      { label: '愤怒', color: '#DC143C' },
    fear:       { label: '恐惧', color: '#8B008B' },
    surprise:   { label: '惊讶', color: '#FF8C00' },
    disgust:    { label: '厌恶', color: '#556B2F' },
    anticipation:{ label: '期待', color: '#32CD32' },
    trust:      { label: '信任', color: '#87CEEB' },
  },

  // ===== 情绪关键词表（中文小说语境适配）=====
  // 每类情绪配多个近义词和常用描写词，提高召回率
  EMOTION_KEYWORDS: {
    joy: [
      '喜悦','高兴','开心','欢喜','欣慰','雀跃','欣喜','愉悦','快乐','幸福',
      '喜笑颜开','眉开眼笑','心花怒放','喜不自胜','喜出望外','乐不可支',
      '笑','乐','甜','暖','畅快','舒心','满足',
    ],
    sadness: [
      '悲伤','悲痛','哀伤','凄凉','伤心','落泪','泪流满面','哀痛','悲恸',
      '凄惨','心碎','黯然','怅然','失落','沮丧','消沉','颓废','绝望',
      '哭','泣','泪','哀','戚','悲','凉','孤寂','落寞',
    ],
    anger: [
      '愤怒','暴怒','怒火','气愤','恼怒','震怒','怒不可遏','勃然大怒',
      '火冒三丈','怒发冲冠','暴跳如雷','气急败坏','恼羞成怒','愤恨',
      '怒','气','恨','咬牙','瞪','拍桌','摔',
    ],
    fear: [
      '恐惧','害怕','惊恐','畏惧','胆寒','不寒而栗','毛骨悚然','心惊肉跳',
      '战战兢兢','惶恐','惊慌','惊骇','畏缩','颤栗','哆嗦','发抖',
      '怕','惧','寒','颤','抖','腿软','脸色苍白',
    ],
    surprise: [
      '惊讶','震惊','诧异','愕然','大吃一惊','目瞪口呆','瞠目结舌',
      '难以置信','不可思议','出乎意料','意想不到','大惊失色','惊愕',
      '惊','愣','怔','呆','傻眼','倒吸一口凉气',
    ],
    disgust: [
      '厌恶','讨厌','反感','憎恶','厌烦','作呕','恶心','嫌弃',
      '鄙夷','不屑','唾弃','厌弃','嫌恶','腻烦',
      '皱眉','撇嘴','嫌弃','厌恶','烦','腻',
    ],
    anticipation: [
      '期待','期盼','盼望','渴望','企盼','拭目以待','翘首以盼',
      '等候','等待','向往','憧憬','希冀','希望','盼望',
      '盼','等','望','想','要','准备','蓄势',
    ],
    trust: [
      '信任','信赖','相信','信服','倚重','托付','交付',
      '放心','安心','踏实','依赖','倚靠','靠','信',
      '点头','微笑','握手','拥抱','接纳',
    ],
  },

  // ===== 修饰词强度加权 =====
  INTENSIFIERS: {
    high:   { words: ['十分','非常','极度','无比','异常','极其','万分','空前'], multiplier: 1.8 },
    medium: { words: ['颇为','相当','甚为','尤为','格外','分外'], multiplier: 1.4 },
    low:    { words: ['一丝','微微','有些','略微','稍','隐约','淡淡'], multiplier: 0.5 },
  },

  // ===== 核心方法 =====

  // 统计文本中各类情绪词的出现密度
  // 对应 Reference-php EmotionDictionary.countEmotionDensity() 第 164-208 行
  countEmotionDensity(text){
    if(!text || text.length === 0){
      return { total: 0, density: 0, categories: {} };
    }

    const len = text.length;
    const categories = {};

    for(const [emotion, keywords] of Object.entries(this.EMOTION_KEYWORDS)){
      let count = 0;
      let weightedCount = 0;

      for(const kw of keywords){
        // 统计关键词出现次数
        let idx = 0;
        while((idx = text.indexOf(kw, idx)) !== -1){
          count++;
          // 检查修饰词
          const context = text.slice(Math.max(0, idx - 6), idx + kw.length + 6);
          let multiplier = 1.0;
          for(const [level, config] of Object.entries(this.INTENSIFIERS)){
            if(config.words.some(w => context.includes(w))){
              multiplier = config.multiplier;
              break;
            }
          }
          weightedCount += multiplier;
          idx += kw.length;
        }
      }

      categories[emotion] = {
        count,
        weighted: Math.round(weightedCount * 10) / 10,
        density: Math.round(count / len * 10000) / 10, // 每千字密度
      };
    }

    const total = Object.values(categories).reduce((sum, c) => sum + c.count, 0);
    return {
      total,
      density: Math.round(total / len * 10000) / 10, // 每千字总情绪密度
      categories,
    };
  },

  // 获取文本的情绪详情（主导情绪 + 分布）
  // 对应 Reference-php getEmotionDetails() 第 249-299 行
  getEmotionDetails(text){
    const density = this.countEmotionDensity(text);

    if(density.total === 0){
      return {
        dominant: null,
        dominantLabel: '无明显情绪',
        distribution: {},
        total: 0,
        density: 0,
      };
    }

    // 按加权值排序，找主导情绪
    const sorted = Object.entries(density.categories)
      .sort((a, b) => b[1].weighted - a[1].weighted);

    const dominant = sorted[0][0];
    const total = density.total;

    // 计算分布占比
    const distribution = {};
    for(const [emotion, data] of Object.entries(density.categories)){
      distribution[emotion] = {
        label: this.EMOTION_CATEGORIES[emotion]?.label || emotion,
        ratio: total > 0 ? Math.round(data.count / total * 100) : 0,
        count: data.count,
        density: data.density,
      };
    }

    return {
      dominant,
      dominantLabel: this.EMOTION_CATEGORIES[dominant]?.label || dominant,
      distribution,
      total,
      density: density.density,
    };
  },

  // 评估情绪密度是否合理
  // 对应 Reference-php evaluateDensity() 第 336-410 行
  evaluateDensity(text){
    const details = this.getEmotionDetails(text);
    const len = text.length;

    if(len < 100){
      return { level: 'insufficient', message: '文本过短，无法评估情绪密度', details };
    }

    // 情绪密度参考值（每千字）
    // 为什么用这些阈值：网文平均每千字 8-15 个情绪词，低于 3 过于平淡，高于 30 过于煽情
    const LOW_THRESHOLD = 3;
    const HIGH_THRESHOLD = 30;
    const OPTIMAL_MIN = 6;
    const OPTIMAL_MAX = 20;

    if(details.density < LOW_THRESHOLD){
      return {
        level: 'low',
        message: `情绪密度过低（${details.density}/千字），文本缺乏情感冲击力，建议增加情绪描写`,
        details,
      };
    }

    if(details.density > HIGH_THRESHOLD){
      return {
        level: 'high',
        message: `情绪密度过高（${details.density}/千字），可能过度煽情，建议适当克制`,
        details,
      };
    }

    if(details.density >= OPTIMAL_MIN && details.density <= OPTIMAL_MAX){
      return {
        level: 'optimal',
        message: `情绪密度适中（${details.density}/千字），情感节奏良好`,
        details,
      };
    }

    return {
      level: 'normal',
      message: `情绪密度正常（${details.density}/千字）`,
      details,
    };
  },

  // 生成情绪分析报告
  generateEmotionReport(text){
    const details = this.getEmotionDetails(text);
    const evalResult = this.evaluateDensity(text);

    const lines = [];
    lines.push('=== 情绪分析报告 ===');
    lines.push(`主导情绪：${details.dominantLabel}`);
    lines.push(`情绪密度：${details.density}/千字（${evalResult.level}）`);
    lines.push(`情绪词总数：${details.total}`);

    if(details.dominant){
      lines.push('\n情绪分布：');
      const sorted = Object.entries(details.distribution)
        .sort((a, b) => b[1].ratio - a[1].ratio);
      for(const [emotion, data] of sorted){
        if(data.count > 0){
          lines.push(`  ${data.label}：${data.ratio}%（${data.count}次，${data.density}/千字）`);
        }
      }
    }

    lines.push(`\n评估：${evalResult.message}`);

    return lines.join('\n');
  },

  // ===== 情绪曲线异常检测 =====
  // 对标 Reference-php helpers.detectEmotionCurveAnomaly() 第 491-533 行
  // 检测情绪曲线是否出现异常（突然跳跃、长期平淡）
};

// ============================================================
// 情绪曲线异常检测（独立函数，非对象方法）
// 对标 Reference-php helpers.detectEmotionCurveAnomaly()
// ============================================================

function detectEmotionCurveAnomaly(chapterHistory){
  if(!chapterHistory || chapterHistory.length < 5){
    return { detected: false, reason: '章节数不足' };
  }

  // 提取每章的主导情绪和密度
  const emotions = [];
  for(const ch of chapterHistory){
    if(!ch?.content) continue;
    const details = EmotionDictionary.getEmotionDetails(ch.content);
    emotions.push({
      chapIdx: ch.chapIdx ?? emotions.length,
      dominant: details.dominant,
      density: details.density,
      label: details.dominantLabel,
    });
  }

  if(emotions.length < 5){
    return { detected: false, reason: '有效章节数不足' };
  }

  const anomalies = [];

  // 1. 突然跳跃检测：相邻章节主导情绪突变
  // 为什么检测跳跃：读者情绪体验需要过渡，突变会导致割裂感
  for(let i = 1; i < emotions.length; i++){
    const prev = emotions[i - 1];
    const curr = emotions[i];
    if(prev.dominant && curr.dominant && prev.dominant !== curr.dominant){
      // 检查是否为对立情绪对（喜悦↔悲伤、愤怒↔信任等）
      const oppositePairs = [
        ['joy', 'sadness'], ['anger', 'trust'], ['fear', 'anticipation'],
      ];
      const isOpposite = oppositePairs.some(
        ([a, b]) => (prev.dominant === a && curr.dominant === b) ||
                     (prev.dominant === b && curr.dominant === a)
      );
      if(isOpposite && prev.density > 5 && curr.density > 5){
        anomalies.push({
          type: 'sudden_jump',
          chapIdx: curr.chapIdx,
          from: prev.label,
          to: curr.label,
          message: `第${curr.chapIdx + 1}章情绪从"${prev.label}"突变到"${curr.label}"，缺乏过渡`,
        });
      }
    }
  }

  // 2. 长期平淡检测：连续 N 章主导情绪为 null 或密度过低
  let flatStreak = 0;
  let maxFlatStreak = 0;
  let flatStart = 0;
  for(let i = 0; i < emotions.length; i++){
    if(!emotions[i].dominant || emotions[i].density < 2){
      if(flatStreak === 0) flatStart = i;
      flatStreak++;
      if(flatStreak > maxFlatStreak) maxFlatStreak = flatStreak;
    } else {
      flatStreak = 0;
    }
  }
  if(maxFlatStreak >= 5){
    anomalies.push({
      type: 'long_flat',
      startChapIdx: emotions[flatStart]?.chapIdx ?? 0,
      length: maxFlatStreak,
      message: `连续${maxFlatStreak}章情绪平淡（密度<2/千字或无主导情绪），读者可能疲劳`,
    });
  }

  // 3. 情绪单调检测：连续多章主导情绪相同
  let monoStreak = 1;
  let maxMonoStreak = 1;
  let monoEmotion = null;
  for(let i = 1; i < emotions.length; i++){
    if(emotions[i].dominant && emotions[i].dominant === emotions[i - 1].dominant){
      monoStreak++;
      if(monoStreak > maxMonoStreak){
        maxMonoStreak = monoStreak;
        monoEmotion = emotions[i].label;
      }
    } else {
      monoStreak = 1;
    }
  }
  if(maxMonoStreak >= 8 && monoEmotion){
    anomalies.push({
      type: 'monotone',
      emotion: monoEmotion,
      length: maxMonoStreak,
      message: `连续${maxMonoStreak}章主导情绪均为"${monoEmotion}"，缺乏变化`,
    });
  }

  return {
    detected: anomalies.length > 0,
    anomalies,
    emotions,
  };
}

window.EmotionDictionary = EmotionDictionary;
window.detectEmotionCurveAnomaly = detectEmotionCurveAnomaly;
