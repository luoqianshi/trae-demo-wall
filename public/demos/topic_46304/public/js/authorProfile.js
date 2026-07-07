/* ============================================================
 * AuthorProfile - 作者画像系统
 *
 * 对标参考项目 author-profile.js
 *
 * 核心能力：
 *   1. analyzeWork(novel) — 从已生成的小说中分析写作风格
 *   2. analyzeSentiment(text) — 情感倾向分析
 *   3. getWritingFingerprint(novel) — 提取写作指纹（句式/用词/节奏）
 *   4. buildProfilePrompt(profile) — 生成 Prompt 注入段
 *   5. analyzeAllWorks() — 分析所有作品，合并画像
 *
 * 数据持久化：
 *   通过 /api/settings 接口存储到数据库 settings 表，key = 'author_profile'
 * ============================================================ */

const AuthorProfile = {
  // 当前作者画像
  profile: null,
  // 是否已启用
  enabled: false,

  // ===== 分析单部作品 =====
  // 返回该作品的写作特征
  analyzeWork(novel){
    if(!novel || !novel.chapters) return null;
    const chapters = novel.chapters.filter(c => c && c.content);
    if(chapters.length === 0) return null;

    const allText = chapters.map(c => c.content).join('\n');
    const wordCount = allText.length;

    // 1. 句子长度分布
    const sentences = this._splitSentences(allText);
    const avgSentLen = sentences.reduce((s, x) => s + x.length, 0) / sentences.length;
    const shortSentRatio = sentences.filter(s => s.length < 20).length / sentences.length;
    const longSentRatio = sentences.filter(s => s.length > 80).length / sentences.length;

    // 2. 对话占比
    const dialogueText = allText.match(/[「」""''『』].*?[」""''』』]/g) || [];
    const dialogueRatio = dialogueText.length / Math.max(1, sentences.length);

    // 3. 高频用词
    const wordFreq = this._extractWordFreq(allText);
    const topWords = Object.entries(wordFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 30)
      .map(([word, count]) => ({ word, count }));

    // 4. 段落长度
    const paragraphs = allText.split(/\n+/).filter(p => p.trim().length > 0);
    const avgParaLen = paragraphs.reduce((s, p) => s + p.length, 0) / Math.max(1, paragraphs.length);

    // 5. 情感倾向
    const sentiment = this.analyzeSentiment(allText);

    // 6. 描写密度（形容词/副词比例）
    const descDensity = this._estimateDescriptionDensity(allText);

    // 7. 动作密度（动词比例）
    const actionDensity = this._estimateActionDensity(allText);

    // 8. P2-1 v4 补全：叙事风格分析
    const narrative = this.analyzeNarrative(allText);

    // 9. P2-1 v4 补全：写作习惯分析
    const writingHabits = this.analyzeWritingHabits(allText);

    return {
      novelId: novel.id,
      title: novel.title,
      genre: novel.genre,
      wordCount,
      chapterCount: chapters.length,
      style: {
        avgSentenceLength: Math.round(avgSentLen),
        shortSentenceRatio: Math.round(shortSentRatio * 100),
        longSentenceRatio: Math.round(longSentRatio * 100),
        avgParagraphLength: Math.round(avgParaLen),
        dialogueRatio: Math.round(dialogueRatio * 100),
        descriptionDensity: Math.round(descDensity * 100),
        actionDensity: Math.round(actionDensity * 100),
      },
      topWords,
      sentiment,
      narrative,
      writingHabits,
      analyzedAt: Date.now(),
    };
  },

  // ===== 情感分析 =====
  // 返回 { tone, intensity, distribution }
  analyzeSentiment(text){
    if(!text) return { tone: 'neutral', intensity: 0.5, distribution: {} };

    const POSITIVE_WORDS = ['快乐','喜悦','温暖','希望','胜利','光明','幸福','微笑','美好','勇敢','坚强','成功','突破','惊喜','感动'];
    const NEGATIVE_WORDS = ['悲伤','痛苦','绝望','黑暗','恐惧','愤怒','仇恨','死亡','毁灭','背叛','孤独','哭泣','失败','沉沦','深渊'];
    const INTENSE_WORDS = ['爆发','轰鸣','撕裂','震撼','疯狂','极度','无比','彻底','空前','绝后'];
    const CALM_WORDS = ['静静','缓缓','微微','轻轻','淡然','从容','安详','宁静','平和','默默'];

    let positive = 0, negative = 0, intense = 0, calm = 0;
    for(const w of POSITIVE_WORDS) if(text.includes(w)) positive += (text.split(w).length - 1);
    for(const w of NEGATIVE_WORDS) if(text.includes(w)) negative += (text.split(w).length - 1);
    for(const w of INTENSE_WORDS) if(text.includes(w)) intense += (text.split(w).length - 1);
    for(const w of CALM_WORDS) if(text.includes(w)) calm += (text.split(w).length - 1);

    const total = positive + negative + 1;
    const tone = positive > negative * 1.3 ? 'positive' : negative > positive * 1.3 ? 'negative' : 'neutral';
    const intensity = Math.min(1, (intense * 2 + (positive + negative)) / (text.length / 1000 + 1));

    return {
      tone,
      intensity: Math.round(intensity * 100) / 100,
      distribution: { positive, negative, intense, calm },
    };
  },

  // ===== 写作指纹 =====
  // 提取独特写作模式摘要
  getWritingFingerprint(novel){
    const analysis = this.analyzeWork(novel);
    if(!analysis) return null;

    const fp = [];

    // 句式特征
    if(analysis.style.shortSentenceRatio > 40) fp.push('偏好短句（快节奏）');
    else if(analysis.style.longSentenceRatio > 25) fp.push('偏好长句（细腻描写）');
    else fp.push('句式均衡');

    // 对话特征
    if(analysis.style.dialogueRatio > 30) fp.push('对话密集型');
    else if(analysis.style.dialogueRatio < 10) fp.push('叙述为主型');

    // 描写特征
    if(analysis.style.descriptionDensity > 20) fp.push('描写丰富');
    else if(analysis.style.descriptionDensity < 8) fp.push('白描简练');

    // 情感特征
    if(analysis.sentiment.tone === 'positive') fp.push('整体情感积极');
    else if(analysis.sentiment.tone === 'negative') fp.push('整体情感压抑');
    if(analysis.sentiment.intensity > 0.6) fp.push('情感浓烈');

    // 标志性用词
    if(analysis.topWords.length > 0){
      const signatureWords = analysis.topWords.slice(0, 5).map(w => w.word).join('、');
      fp.push('高频用词：' + signatureWords);
    }

    return {
      features: fp,
      summary: fp.join('；'),
    };
  },

  // ===== P2-1 v4 补全：叙事风格分析 =====
  // 对标 Reference-php NarrativeAnalyzer.analyzeTensionCurve()
  // 分析叙事张力曲线、视角、节奏、对话风格
  analyzeNarrative(text){
    if(!text) return null;

    // 1. 张力曲线分析（按段落计算张力值）
    const paragraphs = text.split(/\n+/).filter(p => p.trim().length > 0);
    const tensionCurve = paragraphs.map((p, i) => {
      let tension = 0;
      // 动作词增加张力
      tension += (p.match(/打|杀|冲|爆|裂|撞|劈|刺|挥|射/g) || []).length * 2;
      // 情绪词增加张力
      tension += (p.match(/愤怒|恐惧|震惊|绝望|兴奋|激动|紧张|危机|危险/g) || []).length * 1.5;
      // 短句增加张力
      const shortSentences = p.split(/[。！？]/).filter(s => s.trim().length > 0 && s.trim().length < 15);
      tension += shortSentences.length * 0.5;
      // 标点符号增加张力
      tension += (p.match(/！|？/g) || []).length * 0.8;
      return { paragraph: i, tension: Math.round(tension * 10) / 10 };
    });

    // 张力统计
    const tensionValues = tensionCurve.map(t => t.tension);
    const avgTension = tensionValues.reduce((a, b) => a + b, 0) / Math.max(1, tensionValues.length);
    const maxTension = Math.max(...tensionValues, 0);
    const minTension = Math.min(...tensionValues, 0);
    const tensionVariance = avgTension > 0 ? Math.round((maxTension - minTension) / avgTension * 100) / 100 : 0;

    // 2. 视角分析
    const firstPerson = (text.match(/我(?=[们是的有说想])/g) || []).length;
    const thirdPerson = (text.match(/他(?=[是的有说想们])|她(?=[是的有说想])/g) || []).length;
    const pov = firstPerson > thirdPerson * 2 ? 'first_person' : thirdPerson > firstPerson * 2 ? 'third_person' : 'mixed';

    // 3. 节奏分析
    const sentences = text.split(/[。！？\n.!?]/).filter(s => s.trim().length > 0);
    const sentLengths = sentences.map(s => s.trim().length);
    const avgSentLen = sentLengths.reduce((a, b) => a + b, 0) / Math.max(1, sentLengths.length);
    const rhythmType = avgSentLen < 25 ? 'fast' : avgSentLen > 60 ? 'slow' : 'balanced';

    // 4. 对话风格分析
    const dialogueMatches = text.match(/[「」""''『』].*?[」""''』』]/g) || [];
    const dialogueText = dialogueMatches.join('');
    const dialogueRatio = text.length > 0 ? dialogueText.length / text.length : 0;
    const avgDialogueLen = dialogueMatches.length > 0 ? dialogueText.length / dialogueMatches.length : 0;
    const dialogueStyle = dialogueRatio > 0.3 ? 'dialogue_heavy' : dialogueRatio < 0.05 ? 'narrative_heavy' : 'balanced';

    return {
      tensionCurve,
      tensionStats: {
        avg: Math.round(avgTension * 10) / 10,
        max: maxTension,
        min: minTension,
        variance: tensionVariance,
      },
      pov,
      rhythm: {
        type: rhythmType,
        avgSentenceLength: Math.round(avgSentLen),
      },
      dialogue: {
        style: dialogueStyle,
        ratio: Math.round(dialogueRatio * 100) / 100,
        avgLength: Math.round(avgDialogueLen),
        count: dialogueMatches.length,
      },
    };
  },

  // ===== P2-1 v4 补全：写作习惯分析 =====
  // 对标 Reference-php WritingHabitAnalyzer (276 行)
  // 分析句式模式、用词频率、段落长度、标点习惯
  analyzeWritingHabits(text){
    if(!text) return null;

    // 1. 句式模式分析
    const sentences = text.split(/[。！？\n.!?]/).filter(s => s.trim().length > 0).map(s => s.trim());
    const sentLengths = sentences.map(s => s.length);

    // 句长分布
    const short = sentLengths.filter(l => l < 20).length;
    const medium = sentLengths.filter(l => l >= 20 && l <= 50).length;
    const long = sentLengths.filter(l => l > 50).length;
    const total = sentLengths.length || 1;

    // 2. 用词频率分析
    const wordFreq = this._extractWordFreq(text);
    const sortedWords = Object.entries(wordFreq).sort((a, b) => b[1] - a[1]);
    const top10 = sortedWords.slice(0, 10).map(([word, count]) => ({ word, count }));
    const top30 = sortedWords.slice(0, 30).map(([word, count]) => ({ word, count }));

    // 3. 段落长度分析
    const paragraphs = text.split(/\n+/).filter(p => p.trim().length > 0);
    const paraLengths = paragraphs.map(p => p.trim().length);
    const avgParaLen = paraLengths.reduce((a, b) => a + b, 0) / Math.max(1, paraLengths.length);
    const maxParaLen = Math.max(...paraLengths, 0);

    // 4. 标点习惯分析
    const punctuation = {
      period: (text.match(/。/g) || []).length,
      comma: (text.match(/，/g) || []).length,
      exclamation: (text.match(/！/g) || []).length,
      question: (text.match(/？/g) || []).length,
      ellipsis: (text.match(/……/g) || []).length,
      dash: (text.match(/——/g) || []).length,
      semicolon: (text.match(/；/g) || []).length,
    };
    const totalPunct = Object.values(punctuation).reduce((a, b) => a + b, 0) || 1;
    const punctRatio = {};
    for(const [key, val] of Object.entries(punctuation)){
      punctRatio[key] = Math.round(val / totalPunct * 100) / 100;
    }

    // 5. 修辞习惯
    const metaphors = (text.match(/像[^，。！？]*一样|宛如|仿佛|犹如|好似/g) || []).length;
    const parallelism = (text.match(/[，；][^。！？]*[，；][^。！？]*[，；]/g) || []).length;

    return {
      sentencePatterns: {
        short: Math.round(short / total * 100),
        medium: Math.round(medium / total * 100),
        long: Math.round(long / total * 100),
        avgLength: Math.round(sentLengths.reduce((a, b) => a + b, 0) / total),
      },
      wordFrequency: {
        top10,
        top30,
        uniqueWordCount: Object.keys(wordFreq).length,
      },
      paragraphLength: {
        avg: Math.round(avgParaLen),
        max: maxParaLen,
        count: paragraphs.length,
      },
      punctuationHabits: {
        counts: punctuation,
        ratios: punctRatio,
        exclamationRate: Math.round(punctuation.exclamation / total * 1000) / 10,
      },
      rhetoric: {
        metaphors,
        parallelism,
        metaphorDensity: text.length > 0 ? Math.round(metaphors / (text.length / 1000) * 100) / 100 : 0,
      },
    };
  },

  // ===== 分析所有作品 =====
  // 合并多部作品的画像，生成综合作者风格
  async analyzeAllWorks(){
    const novels = store.library.filter(n => n.chapters && n.chapters.some(c => c && c.content));
    if(novels.length === 0){
      store.toast('暂无已生成章节的作品可分析', 'warn');
      return null;
    }

    const analyses = novels.map(n => this.analyzeWork(n)).filter(a => a);
    if(analyses.length === 0) return null;

    // 合并画像
    const merged = {
      totalWorks: analyses.length,
      totalWords: analyses.reduce((s, a) => s + a.wordCount, 0),
      avgStyle: this._mergeStyles(analyses.map(a => a.style)),
      topWords: this._mergeTopWords(analyses.map(a => a.topWords)),
      avgSentiment: this._mergeSentiments(analyses.map(a => a.sentiment)),
      // P2-1 v4 补全：合并叙事风格
      avgNarrative: this._mergeNarratives(analyses.map(a => a.narrative).filter(n => n)),
      // P2-1 v4 补全：合并写作习惯
      avgWritingHabits: this._mergeWritingHabits(analyses.map(a => a.writingHabits).filter(w => w)),
      fingerprints: novels.map(n => this.getWritingFingerprint(n)).filter(f => f),
      generatedAt: Date.now(),
    };

    this.profile = merged;
    await this._save();
    return merged;
  },

  // ===== 生成 Prompt 注入段 =====
  buildProfilePrompt(profile){
    if(!profile && !this.profile) return '';
    const p = profile || this.profile;
    if(!p) return '';

    const lines = [];
    lines.push('=== 作者风格画像 ===');

    // 句式偏好
    if(p.avgStyle){
      const s = p.avgStyle;
      if(s.avgSentenceLength) lines.push(`句式偏好：平均句长${s.avgSentenceLength}字，短句占比${s.shortSentenceRatio}%，长句占比${s.longSentenceRatio}%`);
      if(s.dialogueRatio !== undefined) lines.push(`对话密度：${s.dialogueRatio}%`);
      if(s.descriptionDensity !== undefined) lines.push(`描写密度：${s.descriptionDensity}%`);
      if(s.actionDensity !== undefined) lines.push(`动作密度：${s.actionDensity}%`);
    }

    // 情感倾向
    if(p.avgSentiment){
      const toneMap = { positive: '积极正向', negative: '偏沉重', neutral: '中性平衡' };
      lines.push(`情感基调：${toneMap[p.avgSentiment.tone] || '中性'}，强度${Math.round((p.avgSentiment.intensity || 0) * 100)}%`);
    }

    // P2-1 v4 补全：叙事风格
    if(p.avgNarrative){
      const n = p.avgNarrative;
      const povMap = { first_person: '第一人称', third_person: '第三人称', mixed: '混合视角' };
      const rhythmMap = { fast: '快节奏', slow: '慢节奏', balanced: '均衡节奏' };
      lines.push(`叙事视角：${povMap[n.pov] || '未知'}`);
      lines.push(`叙事节奏：${rhythmMap[n.rhythm?.type] || '均衡'}，平均句长${n.rhythm?.avgSentenceLength || 0}字`);
      if(n.tensionStats) lines.push(`张力波动：均值${n.tensionStats.avg}，峰值${n.tensionStats.max}，方差${n.tensionStats.variance}`);
    }

    // P2-1 v4 补全：写作习惯
    if(p.avgWritingHabits){
      const w = p.avgWritingHabits;
      if(w.sentencePatterns) lines.push(`句式分布：短句${w.sentencePatterns.short}%，中句${w.sentencePatterns.medium}%，长句${w.sentencePatterns.long}%`);
      if(w.punctuationHabits) lines.push(`标点习惯：感叹号占比${w.punctuationHabits.exclamationRate}‰`);
      if(w.rhetoric) lines.push(`修辞密度：比喻${w.rhetoric.metaphorDensity}/千字，排比${w.rhetoric.parallelism}处`);
    }

    // 标志性用词
    if(p.topWords && p.topWords.length > 0){
      const words = p.topWords.slice(0, 10).map(w => w.word).join('、');
      lines.push(`偏好用词：${words}`);
    }

    // 指纹摘要
    if(p.fingerprints && p.fingerprints.length > 0){
      const allFeatures = p.fingerprints.flatMap(f => f.features);
      const uniqueFeatures = [...new Set(allFeatures)];
      lines.push(`写作特征：${uniqueFeatures.slice(0, 5).join('；')}`);
    }

    lines.push('=== 请参考以上作者风格画像保持一致性 ===');
    return lines.join('\n');
  },

  // ===== 持久化 =====
  async _save(){
    try{
      await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          settings: { author_profile: this.profile },
        }),
        keepalive: true,
      });
    }catch(e){
      console.warn('[AuthorProfile] 保存失败', e);
    }
  },

  async load(){
    try{
      const res = await fetch('/api/settings');
      const json = await res.json();
      if(json.ok && json.data && json.data.author_profile){
        this.profile = json.data.author_profile;
      }
    }catch(e){
      console.warn('[AuthorProfile] 加载失败', e);
    }
  },

  // ===== 内部工具 =====

  // 分句
  _splitSentences(text){
    return text.split(/[。！？\n.!?]/).filter(s => s.trim().length > 0).map(s => s.trim());
  },

  // 提取高频词（简化版：2-4字中文词组）
  _extractWordFreq(text){
    const freq = {};
    // 提取双字词
    const regex = /[\u4e00-\u9fa5]{2,4}/g;
    const matches = text.match(regex) || [];
    for(const word of matches){
      // 跳过常见停用词
      if(STOP_WORDS.has(word)) continue;
      freq[word] = (freq[word] || 0) + 1;
    }
    return freq;
  },

  // 估算描写密度（"的"字密度作为近似指标）
  _estimateDescriptionDensity(text){
    const descMarkers = (text.match(/的|地|着|般|似的|仿佛|宛如/g) || []).length;
    return descMarkers / Math.max(1, text.length / 100);
  },

  // 估算动作密度
  _estimateActionDensity(text){
    const actionMarkers = (text.match(/跑|跳|打|冲|抓|推|拉|踢|劈|刺|挥|射|撞|摔|爬/g) || []).length;
    return actionMarkers / Math.max(1, text.length / 100);
  },

  // 合并多部作品的风格
  _mergeStyles(styles){
    if(!styles || styles.length === 0) return null;
    const sum = styles.reduce((acc, s) => {
      for(const key in s) acc[key] = (acc[key] || 0) + s[key];
      return acc;
    }, {});
    const count = styles.length;
    const result = {};
    for(const key in sum) result[key] = Math.round(sum[key] / count);
    return result;
  },

  // 合并高频词
  _mergeTopWords(wordLists){
    const freq = {};
    for(const list of wordLists){
      for(const item of list){
        if(!freq[item.word]) freq[item.word] = 0;
        freq[item.word] += item.count;
      }
    }
    return Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 30)
      .map(([word, count]) => ({ word, count }));
  },

  // 合并情感分析
  _mergeSentiments(sentiments){
    if(!sentiments || sentiments.length === 0) return null;
    let posSum = 0, negSum = 0, intenseSum = 0, calmSum = 0;
    for(const s of sentiments){
      posSum += s.distribution?.positive || 0;
      negSum += s.distribution?.negative || 0;
      intenseSum += s.distribution?.intense || 0;
      calmSum += s.distribution?.calm || 0;
    }
    const tone = posSum > negSum * 1.3 ? 'positive' : negSum > posSum * 1.3 ? 'negative' : 'neutral';
    const intensity = intenseSum / (sentiments.length + 1);
    return { tone, intensity, distribution: { positive: posSum, negative: negSum, intense: intenseSum, calm: calmSum } };
  },

  // P2-1 v4 补全：合并叙事风格
  _mergeNarratives(narratives){
    if(!narratives || narratives.length === 0) return null;
    const n = narratives.length;
    // 取最常见视角
    const povCounts = {};
    narratives.forEach(na => { povCounts[na.pov] = (povCounts[na.pov] || 0) + 1; });
    const dominantPov = Object.entries(povCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'mixed';

    // 平均张力
    const avgTension = narratives.reduce((s, na) => s + (na.tensionStats?.avg || 0), 0) / n;
    const maxTension = Math.max(...narratives.map(na => na.tensionStats?.max || 0));
    const avgVariance = narratives.reduce((s, na) => s + (na.tensionStats?.variance || 0), 0) / n;

    // 平均节奏
    const rhythmCounts = {};
    narratives.forEach(na => { const t = na.rhythm?.type; if(t) rhythmCounts[t] = (rhythmCounts[t] || 0) + 1; });
    const dominantRhythm = Object.entries(rhythmCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'balanced';
    const avgSentLen = Math.round(narratives.reduce((s, na) => s + (na.rhythm?.avgSentenceLength || 0), 0) / n);

    // 对话风格
    const dialogueRatios = narratives.map(na => na.dialogue?.ratio || 0);
    const avgDialogueRatio = dialogueRatios.reduce((a, b) => a + b, 0) / n;

    return {
      pov: dominantPov,
      rhythm: { type: dominantRhythm, avgSentenceLength: avgSentLen },
      tensionStats: {
        avg: Math.round(avgTension * 10) / 10,
        max: Math.round(maxTension * 10) / 10,
        variance: Math.round(avgVariance * 100) / 100,
      },
      dialogue: {
        ratio: Math.round(avgDialogueRatio * 100) / 100,
        style: avgDialogueRatio > 0.3 ? 'dialogue_heavy' : avgDialogueRatio < 0.05 ? 'narrative_heavy' : 'balanced',
      },
    };
  },

  // P2-1 v4 补全：合并写作习惯
  _mergeWritingHabits(habits){
    if(!habits || habits.length === 0) return null;
    const n = habits.length;
    // 平均句式分布
    const avgShort = Math.round(habits.reduce((s, h) => s + (h.sentencePatterns?.short || 0), 0) / n);
    const avgMedium = Math.round(habits.reduce((s, h) => s + (h.sentencePatterns?.medium || 0), 0) / n);
    const avgLong = Math.round(habits.reduce((s, h) => s + (h.sentencePatterns?.long || 0), 0) / n);
    const avgSentLen = Math.round(habits.reduce((s, h) => s + (h.sentencePatterns?.avgLength || 0), 0) / n);

    // 平均段落长度
    const avgPara = Math.round(habits.reduce((s, h) => s + (h.paragraphLength?.avg || 0), 0) / n);

    // 标点习惯平均
    const avgExcl = Math.round(habits.reduce((s, h) => s + (h.punctuationHabits?.exclamationRate || 0), 0) / n * 10) / 10;

    // 修辞密度平均
    const avgMetaphor = Math.round(habits.reduce((s, h) => s + (h.rhetoric?.metaphorDensity || 0), 0) / n * 100) / 100;
    const avgParallel = Math.round(habits.reduce((s, h) => s + (h.rhetoric?.parallelism || 0), 0) / n);

    return {
      sentencePatterns: { short: avgShort, medium: avgMedium, long: avgLong, avgLength: avgSentLen },
      paragraphLength: { avg: avgPara },
      punctuationHabits: { exclamationRate: avgExcl },
      rhetoric: { metaphorDensity: avgMetaphor, parallelism: avgParallel },
    };
  },
};

// 停用词集合
const STOP_WORDS = new Set([
  '的是', '是一', '一个', '可以', '这个', '那个', '什么', '怎么',
  '他们', '我们', '你们', '自己', '这种', '那种', '这样', '那样',
  '就是', '还是', '不要', '不能', '不会', '没有', '已经', '现在',
  '如果', '虽然', '但是', '因为', '所以', '不过', '然后', '这是',
  '那是', '只有', '一样', '一种', '一直', '一切', '的话', '感到',
  '看着', '想着', '说着', '着他', '着她', '着的', '来的', '去的',
]);

window.AuthorProfile = AuthorProfile;
