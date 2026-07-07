/* ============================================================
 * Agents - 多Agent控制系统
 *
 * 对标参考项目 includes/agents/ 目录：
 *   - StyleGuard: AI痕迹检测+风格漂移+五感平衡（纯正则，零API成本）
 *   - DialogueVoiceChecker: 对话提取+角色语音差异检查（纯正则）
 *   - CriticAgent: 读者视角五维评分+三层校准（需LLM调用）
 *   - AgentDirectives: 指令存储+优先级去重+效果追踪
 *   - AgentCoordinator: 写前/写后协调+动态间隔
 *
 * 指令闭环：
 *   检测问题 → 生成指令(带优先级/类型/生效范围) → 去重存入指令池
 *   → 下一章Prompt注入(按优先级排序+截断) → 章节完成后评估效果
 *   → 效果统计回喂自适应权重
 * ============================================================ */

// ============================================================
// AgentDirectives - 指令存储与闭环
// 对标参考项目 AgentDirectives.php
// ============================================================
const AgentDirectives = {

  // 初始化指令池
  init(novel){
    if(!novel.agentDirectives) novel.agentDirectives = [];
    if(!novel.directiveOutcomes) novel.directiveOutcomes = [];
  },

  // 添加指令 — 带指纹去重
  // type: urgent | quality | strategy | optimization | global
  add(novel, applyFrom, type, directive, applyRange, source){
    this.init(novel);
    const range = applyRange || 3;
    const applyTo = applyFrom + range - 1;

    // 指纹去重：取前80字符作为指纹，查询同type、同范围的已有指令
    const fingerprint = directive.slice(0, 80);
    const exists = novel.agentDirectives.find(d =>
      d.isActive &&
      d.type === type &&
      d.applyFrom === applyFrom &&
      d.directive.startsWith(fingerprint)
    );
    if(exists){
      // 刷新过期时间，不新增
      exists.expiresAt = Date.now() + 24 * 60 * 60 * 1000;
      return exists.id;
    }

    const id = 'dir-' + Date.now() + '-' + Math.random().toString(36).slice(2,6);
    novel.agentDirectives.push({
      id,
      type,
      directive,
      applyFrom,
      applyTo,
      isActive: true,
      createdAt: Date.now(),
      expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24小时过期
      source: source || 'unknown',
    });
    return id;
  },

  // 获取当前章节有效指令
  active(novel, chapIdx){
    this.init(novel);
    const now = Date.now();
    const active = novel.agentDirectives.filter(d =>
      d.isActive &&
      chapIdx >= d.applyFrom &&
      chapIdx <= d.applyTo &&
      now < d.expiresAt
    );

    // 冲突解决：同类型只保留最高优先级
    const resolved = this.resolveConflicts(active);
    // 内容去重：同type+同applyFrom保留最长
    const deduped = this.deduplicate(resolved);
    return deduped;
  },

  // 冲突解决：同类型只保留第一条（已按优先级排序）
  resolveConflicts(directives){
    const priorityOrder = { urgent: 0, quality: 1, emotion_continuity: 1, strategy: 2, optimization: 3, global: 5 };
    const sorted = [...directives].sort((a, b) =>
      (priorityOrder[a.type] || 5) - (priorityOrder[b.type] || 5)
    );
    const seen = new Set();
    return sorted.filter(d => {
      if(seen.has(d.type)) return false;
      seen.add(d.type);
      return true;
    });
  },

  // 内容去重：同type+同applyFrom保留最长
  deduplicate(directives){
    const groups = {};
    for(const d of directives){
      const key = d.type + '_' + d.applyFrom;
      if(!groups[key] || d.directive.length > groups[key].directive.length){
        groups[key] = d;
      }
    }
    return Object.values(groups);
  },

  // 记录指令效果 — 对标 recordOutcomes()
  recordOutcomes(novel, chapIdx, qualityScore){
    this.init(novel);
    const activeAtChap = novel.agentDirectives.filter(d =>
      d.isActive &&
      chapIdx >= d.applyFrom &&
      chapIdx <= d.applyTo
    );

    // 计算基线质量（前5章平均分）
    const baseline = this.getBaselineQuality(novel, chapIdx);

    for(const d of activeAtChap){
      // 幂等：同一指令+同一章节只记录一次
      const exists = novel.directiveOutcomes.find(o =>
        o.directiveId === d.id && o.chapIdx === chapIdx
      );
      if(exists) continue;

      novel.directiveOutcomes.push({
        directiveId: d.id,
        chapIdx,
        qualityBefore: baseline,
        qualityAfter: qualityScore,
        qualityChange: qualityScore - baseline,
        type: d.type,
        recordedAt: Date.now(),
      });
    }
  },

  // 获取基线质量（前5章平均分）
  getBaselineQuality(novel, chapIdx){
    if(!novel.chapters || chapIdx < 5) return 60;
    const recent = novel.chapters.slice(Math.max(0, chapIdx - 5), chapIdx);
    const scores = recent.filter(c => c.score).map(c => c.score.overall);
    if(scores.length === 0) return 60;
    return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  },

  // 获取指令效果统计 — 对标 getOutcomeStats()
  getOutcomeStats(novel){
    this.init(novel);
    const outcomes = novel.directiveOutcomes;
    if(outcomes.length === 0) return null;

    const byType = {};
    for(const o of outcomes){
      if(!byType[o.type]) byType[o.type] = { count: 0, totalChange: 0, improved: 0, declined: 0 };
      byType[o.type].count++;
      byType[o.type].totalChange += o.qualityChange;
      if(o.qualityChange > 0) byType[o.type].improved++;
      if(o.qualityChange < 0) byType[o.type].declined++;
    }

    const stats = {};
    for(const [type, data] of Object.entries(byType)){
      stats[type] = {
        count: data.count,
        avgChange: Math.round(data.totalChange / data.count * 10) / 10,
        improved: data.improved,
        declined: data.declined,
        effectiveness: data.count > 0 ? data.improved / data.count : 0,
      };
    }
    return stats;
  },

  // 获取指令有效率（用于自适应权重）
  getDirectiveEffectiveness(novel){
    const stats = this.getOutcomeStats(novel);
    if(!stats) return 0.6; // 默认中等有效率
    let totalCount = 0, totalImproved = 0;
    for(const data of Object.values(stats)){
      totalCount += data.count;
      totalImproved += data.improved;
    }
    return totalCount > 0 ? totalImproved / totalCount : 0.6;
  },
};

// ============================================================
// StyleGuard - 风格守卫（纯正则，零API成本）
// 对标参考项目 StyleGuard.php
// ============================================================
const StyleGuard = {

  // AI痕迹检测 — 4类规则
  detectAIPatterns(content){
    const issues = [];
    const wordCount = content.length;
    const perThousand = (matches) => wordCount > 0 ? (matches / wordCount * 1000) : 0;

    // 1. 段首副词过度（突然/忽然/猛然...）≤5次/千字
    const adverbStarts = (content.match(/^(突然|忽然|猛然|骤然|陡然|霎时|瞬间|刹那)/gm) || []).length;
    if(perThousand(adverbStarts) > 5){
      issues.push({
        severity: 'medium',
        type: 'adverb_overuse',
        message: `段首副词过度（${adverbStarts}次，${perThousand(adverbStarts).toFixed(1)}/千字），建议减少"突然/忽然/猛然"等开头`,
      });
    }

    // 2. 转折词过度（竟然/居然/不禁...）≤8次/千字
    const transitionWords = (content.match(/(竟然|居然|不禁|不由|没想到|岂料|谁知|哪知)/g) || []).length;
    if(perThousand(transitionWords) > 8){
      issues.push({
        severity: 'medium',
        type: 'transition_overuse',
        message: `转折词过度（${transitionWords}次，${perThousand(transitionWords).toFixed(1)}/千字），建议减少"竟然/居然"等转折词`,
      });
    }

    // 3. 情绪三件套（攥紧+眼神+心中）≤3处/章
    const emotionTrio = (content.match(/(攥紧|握紧|攥着).{0,20}(眼神|目光).{0,20}(心中|内心|心底)/g) || []).length;
    if(emotionTrio > 3){
      issues.push({
        severity: 'low',
        type: 'emotion_formula',
        message: `情绪描写公式化（${emotionTrio}处"攥紧+眼神+心中"三件套），建议用行动展示情绪`,
      });
    }

    // 4. 对话标签单一（说道/道/笑道...）单一标签占比≤60%
    const dialogueTags = {};
    const tagMatches = content.matchAll(/(说道|道|笑道|说|问|答道|喊道|冷道|怒道|叹道|低声道|低声说)/g);
    let totalTags = 0;
    for(const m of tagMatches){
      const tag = m[1];
      dialogueTags[tag] = (dialogueTags[tag] || 0) + 1;
      totalTags++;
    }
    if(totalTags > 5){
      const maxTag = Object.entries(dialogueTags).sort((a,b) => b[1] - a[1])[0];
      const maxRatio = maxTag[1] / totalTags;
      if(maxRatio > 0.6){
        issues.push({
          severity: 'low',
          type: 'dialogue_tag_monotone',
          message: `对话标签单一（"${maxTag[0]}"占${Math.round(maxRatio*100)}%），建议多样化对话标签`,
        });
      }
    }

    return issues;
  },

  // 五感平衡检测
  checkSensoryBalance(content){
    const senses = {
      visual: ['看到', '看见', '映入', '目光', '颜色', '光芒', '闪烁', '色彩'],
      auditory: ['听到', '听见', '声音', '响起', '回荡', '轰鸣', '低语', '尖叫'],
      olfactory: ['闻到', '气味', '香味', '腥味', '芬芳', '刺鼻', '弥漫'],
      tactile: ['感到', '触感', '冰冷', '灼热', '粗糙', '光滑', '刺痛'],
      gustatory: ['尝到', '味道', '苦涩', '甘甜', '咸', '酸', '辣'],
    };

    const counts = {};
    for(const [sense, words] of Object.entries(senses)){
      counts[sense] = 0;
      for(const w of words){
        counts[sense] += (content.split(w).length - 1);
      }
    }

    const total = Object.values(counts).reduce((a, b) => a + b, 0);
    const balance = {};
    for(const [sense, count] of Object.entries(counts)){
      balance[sense] = total > 0 ? Math.round(count / total * 100) : 0;
    }

    // 视觉占比过高（>70%）或触觉/嗅觉为零
    const issues = [];
    if(balance.visual > 70){
      issues.push({
        severity: 'low',
        type: 'sensory_imbalance',
        message: `视觉描写占比过高(${balance.visual}%)，建议增加听觉、触觉、嗅觉描写`,
      });
    }
    if(balance.olfactory === 0 && content.length > 800){
      issues.push({
        severity: 'low',
        type: 'sensory_missing',
        message: '缺少嗅觉描写，适当加入气味细节可增强沉浸感',
      });
    }
    if(balance.tactile === 0 && content.length > 800){
      issues.push({
        severity: 'low',
        type: 'sensory_missing',
        message: '缺少触觉描写，适当加入触感细节可增强真实感',
      });
    }

    return { balance, issues };
  },

  // 风格漂移检测 — 提取4维风格向量
  detectStyleDrift(novel, chapIdx){
    if(chapIdx < 10) return null; // 需要至少10章才有意义

    const earlyChapters = novel.chapters.slice(0, 5);
    const recentChapters = novel.chapters.slice(Math.max(0, chapIdx - 5), chapIdx);
    if(earlyChapters.length < 3 || recentChapters.length < 3) return null;

    const earlyVector = this.extractStyleVector(earlyChapters);
    const recentVector = this.extractStyleVector(recentChapters);

    // 计算偏移度
    const drift = {
      avgSentenceLen: Math.abs(earlyVector.avgSentenceLen - recentVector.avgSentenceLen) / Math.max(1, earlyVector.avgSentenceLen),
      dialogueDensity: Math.abs(earlyVector.dialogueDensity - recentVector.dialogueDensity) / Math.max(0.01, earlyVector.dialogueDensity),
      sensoryRatio: Math.abs(earlyVector.sensoryRatio - recentVector.sensoryRatio) / Math.max(0.01, earlyVector.sensoryRatio),
      paragraphLenAvg: Math.abs(earlyVector.paragraphLenAvg - recentVector.paragraphLenAvg) / Math.max(1, earlyVector.paragraphLenAvg),
    };

    const maxDrift = Math.max(drift.avgSentenceLen, drift.dialogueDensity, drift.sensoryRatio, drift.paragraphLenAvg);
    if(maxDrift > 0.25){
      const driftDim = Object.entries(drift).find(([_, v]) => v === maxDrift)[0];
      const dimNames = {
        avgSentenceLen: '句长',
        dialogueDensity: '对话密度',
        sensoryRatio: '感官描写比例',
        paragraphLenAvg: '段落长度',
      };
      return {
        severity: 'medium',
        type: 'style_drift',
        message: `风格漂移：${dimNames[driftDim]}偏移${Math.round(maxDrift*100)}%，与开篇风格不一致`,
      };
    }
    return null;
  },

  // 提取风格向量
  extractStyleVector(chapters){
    const contents = chapters.filter(c => c && c.content).map(c => c.content);
    if(contents.length === 0) return { avgSentenceLen: 0, dialogueDensity: 0, sensoryRatio: 0, paragraphLenAvg: 0 };

    const allText = contents.join('\n');
    const sentences = allText.split(/[。！？\n]+/).filter(s => s.trim());
    const avgSentenceLen = sentences.length > 0 ?
      Math.round(sentences.reduce((a, s) => a + s.length, 0) / sentences.length) : 0;

    const dialogueChars = (allText.match(/["「『"][^"」』"]*["」』"]/g) || []).join('').length;
    const dialogueDensity = allText.length > 0 ? dialogueChars / allText.length : 0;

    const sensoryWords = ['看到', '听到', '闻到', '感到', '尝到', '光芒', '声音', '气味', '冰冷', '灼热'];
    const sensoryCount = sensoryWords.reduce((sum, w) => sum + (allText.split(w).length - 1), 0);
    const sensoryRatio = allText.length > 0 ? sensoryCount / allText.length * 1000 : 0;

    const paragraphs = allText.split('\n').filter(p => p.trim());
    const paragraphLenAvg = paragraphs.length > 0 ?
      Math.round(paragraphs.reduce((a, p) => a + p.length, 0) / paragraphs.length) : 0;

    return { avgSentenceLen, dialogueDensity, sensoryRatio, paragraphLenAvg };
  },

  // 综合检测
  review(novel, chapIdx, content){
    const allIssues = [];

    // AI痕迹
    const aiIssues = this.detectAIPatterns(content);
    allIssues.push(...aiIssues);

    // 五感平衡
    const sensory = this.checkSensoryBalance(content);
    allIssues.push(...sensory.issues);

    // 风格漂移（每20章触发）
    if(chapIdx >= 10 && (chapIdx + 1) % 20 === 0){
      const drift = this.detectStyleDrift(novel, chapIdx);
      if(drift) allIssues.push(drift);
    }

    return { issues: allIssues, sensoryBalance: sensory.balance };
  },
};

// ============================================================
// DialogueVoiceChecker - 对话语音检查（纯正则）
// 对标参考项目 DialogueVoiceChecker.php
// ============================================================
const DialogueVoiceChecker = {

  // 提取对话及说话人
  extractDialogues(content, characterNames){
    const dialogues = [];
    // 5种对话格式
    const patterns = [
      /[""]([^""]+)[""]\s*[，,]?\s*([\u4e00-\u9fa5]{2,6})(?:说道|道|说|问|答|喊|笑道|冷道|怒道)/g,
      /([\u4e00-\u9fa5]{2,6})(?:说道|道|说|问|答|喊|笑道|冷道|怒道)[：:]\s*[""]([^""]+)[""]/g,
      /[「『]([^」』]+)[」』]\s*[，,]?\s*([\u4e00-\u9fa5]{2,6})(?:说道|道|说)/g,
      /([\u4e00-\u9fa5]{2,6})(?:说道|道|说)[：:]\s*[「『]([^」』]+)[」』]/g,
    ];

    for(const pattern of patterns){
      let match;
      while((match = pattern.exec(content)) !== null){
        const text = match[1] || match[2];
        const speaker = match[2] || match[1];
        if(text && speaker && characterNames.includes(speaker)){
          dialogues.push({ speaker, text, length: text.length });
        }
      }
    }

    return dialogues;
  },

  // 检查角色语音差异
  check(novel, chapIdx, content){
    if(!novel.characters) return { issues: [] };

    // 提取角色名
    const characterNames = QualityGuard.extractCharacterNames(novel.characters);
    if(characterNames.length === 0) return { issues: [] };

    // 提取对话
    const dialogues = this.extractDialogues(content, characterNames);
    if(dialogues.length < 3) return { issues: [], dialogues: [] };

    // 按角色分组
    const byCharacter = {};
    for(const d of dialogues){
      if(!byCharacter[d.speaker]) byCharacter[d.speaker] = [];
      byCharacter[d.speaker].push(d);
    }

    const issues = [];

    // 检查每个角色的对话特征
    for(const [name, lines] of Object.entries(byCharacter)){
      if(lines.length < 2) continue;

      // 句长分析
      const avgLen = lines.reduce((a, l) => a + l.length, 0) / lines.length;

      // 检查口癖重复（同一角色3句以上以相同词开头）
      const starts = {};
      for(const l of lines){
        const start = l.text.slice(0, 2);
        starts[start] = (starts[start] || 0) + 1;
      }
      const maxStart = Object.entries(starts).sort((a,b) => b[1] - a[1])[0];
      if(maxStart && maxStart[1] >= 3){
        issues.push({
          severity: 'low',
          type: 'catchphrase_overuse',
          message: `角色"${name}"的对话口癖重复（"${maxStart[0]}"开头${maxStart[1]}次），建议差异化说话方式`,
        });
      }

      // 检查句长过于一致
      if(avgLen > 5){
        const variance = lines.reduce((sum, l) => sum + Math.pow(l.length - avgLen, 2), 0) / lines.length;
        const stdDev = Math.sqrt(variance);
        if(stdDev < 2 && lines.length >= 4){
          issues.push({
            severity: 'low',
            type: 'dialogue_uniform',
            message: `角色"${name}"的对话句长过于一致（平均${Math.round(avgLen)}字），建议增加长短句变化`,
          });
        }
      }
    }

    // 检查角色间对话风格差异
    const charCount = Object.keys(byCharacter).length;
    if(charCount >= 2){
      const avgLens = {};
      for(const [name, lines] of Object.entries(byCharacter)){
        avgLens[name] = lines.reduce((a, l) => a + l.length, 0) / lines.length;
      }
      const values = Object.values(avgLens);
      const maxDiff = Math.max(...values) - Math.min(...values);
      // 如果所有角色句长几乎相同，说明缺乏语音差异
      if(maxDiff < 3 && Math.min(...values) > 5){
        issues.push({
          severity: 'medium',
          type: 'voice_uniformity',
          message: '各角色对话风格过于相似，建议通过句长、用词、语气词区分角色语音',
        });
      }
    }

    return { issues, dialogues };
  },
};

// ============================================================
// CriticAgent - 读者批评Agent（需LLM调用）
// 对标参考项目 CriticAgent.php
// ============================================================
const CriticAgent = {

  // 读者视角评分Prompt
  buildReviewPrompt(novel, chapIdx, content){
    const chap = novel.chapters[chapIdx];
    const truncated = content.length > 4000 ?
      content.slice(0, 2000) + '\n……（省略）……\n' + content.slice(-2000) : content;

    return `你是一位资深网文读者，请以读者视角对以下章节进行评分。

【小说信息】
题材：${novel.genre}
风格：${novel.style}
章节：第${chapIdx+1}章 ${chap?.title || ''}

【章节正文】
${truncated}

请从以下5个维度评分（1-10分，整数）：
1. thrill（爽感）：阅读时的兴奋感、满足感
2. immersion（代入感）：是否能沉浸到故事中
3. pacing（节奏）：剧情推进节奏是否舒适
4. freshness（新鲜度）：是否有新意，避免套路化
5. read_next（追读欲）：看完后是否想继续看下一章

请严格按以下JSON格式输出，不要输出其他内容：
{"thrill":7,"immersion":6,"pacing":7,"freshness":5,"read_next":6}`;
  },

  // 读者评分 — 调用LLM
  async review(novel, chapIdx, content){
    if(store.mode !== 'api') return null;

    try{
      const { base, key, model } = store.config;
      const prompt = this.buildReviewPrompt(novel, chapIdx, content);
      const res = await fetch(base.replace(/\/$/,'')+'/chat/completions',{
        method:'POST',
        headers:{'Content-Type':'application/json','Authorization':`Bearer ${key}`},
        body: JSON.stringify({
          model,
          messages:[{role:'user',content:prompt}],
          stream:false,
          temperature:0.3,
          max_tokens:200,
        })
      });
      if(!res.ok) return null;
      const json = await res.json();
      const text = json.choices?.[0]?.message?.content?.trim() || '';
      // 解析JSON
      const match = text.match(/\{[^}]+\}/);
      if(!match) return null;
      const scores = JSON.parse(match[0]);

      // 三层校准
      const calibrated = this.calibrate(novel, chapIdx, scores);
      return calibrated;
    }catch(e){
      console.warn('CriticAgent评分失败', e);
      return null;
    }
  },

  // 三层校准算法
  calibrate(novel, chapIdx, rawScores){
    const dims = ['thrill', 'immersion', 'pacing', 'freshness', 'read_next'];
    let calibrated = { ...rawScores };

    // Step 0: 自动锚定 — 连续5章>8.5分则-1.0，连续5章<5.5则+0.5
    if(chapIdx >= 5){
      const recent = novel.chapters.slice(Math.max(0, chapIdx - 5), chapIdx);
      const scored = recent.filter(c => c.criticScore);
      if(scored.length >= 5){
        const avgRecent = scored.reduce((sum, c) =>
          sum + (c.criticScore.avg || 0), 0) / scored.length;
        if(avgRecent > 8.5){
          for(const d of dims) calibrated[d] = Math.max(1, calibrated[d] - 1);
        } else if(avgRecent < 5.5){
          for(const d of dims) calibrated[d] = Math.min(10, calibrated[d] + 0.5);
        }
      }
    }

    // 计算均分
    const avg = Math.round(dims.reduce((sum, d) => sum + (calibrated[d] || 5), 0) / dims.length * 10) / 10;

    // 识别弱项（<6分的维度）
    const weakDims = dims.filter(d => (calibrated[d] || 5) < 6);

    return { ...calibrated, avg, weakDims };
  },

  // 从弱项生成改进指令
  generateDirectivesFromWeak(criticResult){
    if(!criticResult || !criticResult.weakDims || criticResult.weakDims.length === 0) return [];

    const dimNames = {
      thrill: '爽感',
      immersion: '代入感',
      pacing: '节奏',
      freshness: '新鲜度',
      read_next: '追读欲',
    };
    const dimAdvice = {
      thrill: '本章爽感不足，建议增加冲突高潮或反转，让读者获得情绪满足',
      immersion: '本章代入感不足，建议增加感官细节和角色内心活动，增强沉浸体验',
      pacing: '本章节奏不佳，建议调整事件密度，避免拖沓或仓促',
      freshness: '本章新鲜度不足，建议避免套路化描写，尝试新的情节角度',
      read_next: '本章追读欲不足，建议在结尾设置更强悬念，激发读者好奇心',
    };

    const directives = [];
    for(const dim of criticResult.weakDims){
      directives.push(dimAdvice[dim] || `${dimNames[dim]}需要改善`);
    }
    return directives;
  },
};

// ============================================================
// AgentCoordinator - Agent协调器
// 对标参考项目 AgentCoordinator.php
// ============================================================
const AgentCoordinator = {

  // 动态间隔计算
  calculateIntervals(novel, chapIdx){
    const progress = (chapIdx + 1) / novel.chapterCount;
    // 阶段乘数
    let stageMultiplier = 1.0;
    if(progress < 0.1) stageMultiplier = 2.0;      // 开篇加密
    else if(progress < 0.2) stageMultiplier = 1.5;
    else if(progress > 0.85) stageMultiplier = 0.5; // 收尾最密
    else if(progress > 0.7) stageMultiplier = 0.75;

    // 基础间隔
    const baseIntervals = { strategy: 10, quality: 5, optimization: 20 };

    const result = {};
    for(const [key, base] of Object.entries(baseIntervals)){
      result[key] = Math.max(1, Math.round(base * stageMultiplier));
    }
    return result;
  },

  // 写后Agent评估 — 对标 postWriteAgents()
  async postWriteAgents(novel, chapIdx, content){
    const allDirectives = [];

    // 1. StyleGuard 风格守卫（每章都跑）
    try{
      const styleResult = StyleGuard.review(novel, chapIdx, content);
      for(const issue of styleResult.issues){
        if(issue.severity === 'medium' || issue.severity === 'high'){
          allDirectives.push({
            type: 'quality',
            directive: issue.message,
            applyRange: 3,
          });
        }
      }
    }catch(e){ console.warn('StyleGuard失败', e); }

    // 2. DialogueVoiceChecker 对话检查（每章都跑）
    try{
      const voiceResult = DialogueVoiceChecker.check(novel, chapIdx, content);
      for(const issue of voiceResult.issues){
        if(issue.severity === 'medium' || issue.severity === 'high'){
          allDirectives.push({
            type: 'quality',
            directive: issue.message,
            applyRange: 3,
          });
        }
      }
    }catch(e){ console.warn('DialogueVoiceChecker失败', e); }

    // 3. CriticAgent 读者评分（每章都跑，需API）
    let criticResult = null;
    try{
      criticResult = await CriticAgent.review(novel, chapIdx, content);
      if(criticResult){
        // 保存评分到章节
        if(novel.chapters[chapIdx]){
          novel.chapters[chapIdx].criticScore = criticResult;
        }
        // 从弱项生成指令
        const criticDirectives = CriticAgent.generateDirectivesFromWeak(criticResult);
        for(const d of criticDirectives){
          allDirectives.push({
            type: 'quality',
            directive: d,
            applyRange: 3,
          });
        }
      }
    }catch(e){ console.warn('CriticAgent失败', e); }

    // 3.5 QualityMonitorAgent 质量监控（每章都跑）
    // 对标 Reference-php AgentCoordinator.runDecisionCycle() 中的 quality agent 调用
    let qualityMonitorResult = null;
    try{
      qualityMonitorResult = await QualityMonitorAgent.check(novel, chapIdx, content);
      for(const alert of qualityMonitorResult.alerts){
        if(alert.severity === 'high'){
          allDirectives.push({
            type: 'urgent',
            directive: alert.message,
            applyRange: 2,
          });
        } else {
          allDirectives.push({
            type: 'quality',
            directive: alert.message,
            applyRange: 3,
          });
        }
      }
    }catch(e){ console.warn('QualityMonitorAgent失败', e); }

    // 3.6 OptimizationAgent 优化机会识别（每章都跑）
    // 对标 Reference-php AgentCoordinator.runDecisionCycle() 中的 optimization agent 调用
    let optimizationResult = null;
    try{
      const opportunities = OptimizationAgent.identifyOpportunities(novel, chapIdx, content);
      for(const opt of opportunities){
        allDirectives.push({
          type: 'optimization',
          directive: opt.suggestion,
          applyRange: 3,
        });
      }
      optimizationResult = { opportunities: opportunities.length };
    }catch(e){ console.warn('OptimizationAgent失败', e); }

    // 3.7 WritingExpertise 专家知识库（每章都跑，零API成本）
    // 对标 Reference-php WritingExpertise — 从 Gate 结果中提取问题类型并生成专家建议
    let expertiseResult = null;
    try{
      const gateResult = novel.chapters[chapIdx]?.gateResult;
      if(gateResult?.gates){
        for(const gate of gateResult.gates){
          if(!gate.status && gate.issues.length > 0){
            // 从 Gate 失败结果推断问题类型
            const issueType = this._mapGateToExpertise(gate.name, gate.issues);
            if(issueType){
              const advice = WritingExpertise.getAdvice(issueType, { genre: novel.genre, symptoms: gate.issues });
              if(advice.found && advice.matched_solutions.length > 0){
                const directive = WritingExpertise.generateDirective(issueType, advice.matched_subtype, {});
                if(directive){
                  allDirectives.push({
                    type: 'quality',
                    directive,
                    applyRange: 3,
                  });
                }
              }
            }
          }
        }
      }
      expertiseResult = { applied: true };
    }catch(e){ console.warn('WritingExpertise失败', e); }

    // 3.8 WritingStrategyAgent 写作策略（每5章跑一次，避免过度干预）
    // 对标 Reference-php WritingStrategyAgent — 动态调整字数/爽点/节奏/伏笔策略
    let strategyResult = null;
    try{
      if((chapIdx + 1) % 5 === 0){
        const pendingFs = novel.memory?.foreshadowing?.filter(f => f.status !== 'resolved').length || 0;
        const strategy = WritingStrategyAgent.decide(novel, chapIdx, {
          pending_foreshadowing_count: pendingFs,
        });
        if(strategy.success && strategy.decisions){
          // 执行决策，将策略注入指令池
          const execResults = WritingStrategyAgent.execute(novel, chapIdx, strategy.decisions);
          strategyResult = {
            decisions: strategy.decisions,
            analysis: strategy.analysis,
            adaptive_weight: strategy.adaptive_weight,
            executed: execResults,
          };
        }
      }
    }catch(e){ console.warn('WritingStrategyAgent失败', e); }

    // 4. 写入指令池（注入下一章）
    const nextChap = chapIdx + 1;
    for(const d of allDirectives){
      AgentDirectives.add(novel, nextChap, d.type, d.directive, d.applyRange, 'postWrite');
    }

    // 3.9 PlotPatternDetector 情节模式检测（每3章跑一次）
    let plotPatternResult = null;
    try{
      if((chapIdx + 1) % 3 === 0 && typeof PlotPatternDetector !== 'undefined'){
        const pattern = PlotPatternDetector.detect(novel, chapIdx);
        if(pattern){
          const desc = PlotPatternDetector.describePattern(pattern);
          if(pattern.directive){
            allDirectives.push({ type: 'strategy', directive: pattern.directive, applyRange: 3 });
          }
          plotPatternResult = { detected: true, description: desc, pattern };
        } else {
          plotPatternResult = { detected: false };
        }
      }
    }catch(e){ console.warn('PlotPatternDetector失败', e); }

    // 3.10 AdaptiveDecisionEngine 自适应决策（每5章跑一次，与策略Agent错开）
    let adaptiveResult = null;
    try{
      if((chapIdx + 1) % 5 === 0 && chapIdx > 0 && typeof AdaptiveDecisionEngine !== 'undefined'){
        const predictions = AdaptiveDecisionEngine.predictIssues(novel, chapIdx);
        if(predictions.length > 0){
          const advice = AdaptiveDecisionEngine.generateExpertAdvice(predictions);
          const hunger = AdaptiveDecisionEngine.getCoolPointHunger(novel, chapIdx);
          const fsRisk = AdaptiveDecisionEngine.getForeshadowingRisk(novel);
          // 高优先级预警转为指令
          for(const p of predictions){
            if(p.severity === 'high' || p.severity === 'critical'){
              allDirectives.push({ type: 'urgent', directive: p.message, applyRange: 2 });
            }
          }
          adaptiveResult = { predictions, advice, coolPointHunger: hunger, foreshadowingRisk: fsRisk };
        } else {
          adaptiveResult = { predictions: [], advice: '当前无风险预警' };
        }
      }
    }catch(e){ console.warn('AdaptiveDecisionEngine失败', e); }

    // 5. 记录指令效果
    if(novel.chapters[chapIdx]?.score){
      AgentDirectives.recordOutcomes(novel, chapIdx, novel.chapters[chapIdx].score.overall);
    }

    return {
      styleIssues: allDirectives.filter(d => d.type === 'quality').length,
      criticScore: criticResult,
      qualityMonitor: qualityMonitorResult,
      optimization: optimizationResult,
      expertise: expertiseResult,
      strategy: strategyResult,
      plotPattern: plotPatternResult,
      adaptive: adaptiveResult,
    };
  },

  // 将 Gate 名称映射到 WritingExpertise 的问题类型
  // 为什么用映射表：Gate 名称是固定的5个，Expertise 类型是6个，需要桥接
  _mapGateToExpertise(gateName, issues){
    const map = {
      'Gate1 结构': 'pacing_issue',
      'Gate2 角色': 'emotion_low',
      'Gate3 描写': 'quality_low',
      'Gate4 爽点': 'coolpoint_low',
      'Gate5 连贯': 'foreshadowing_issue',
    };
    // 模糊匹配 Gate 名称
    for(const [key, value] of Object.entries(map)){
      if(gateName?.includes(key.split(' ')[1]) || gateName?.includes(key)){
        return value;
      }
    }
    return null;
  },

  // 获取下一章应注入的Agent指令文本
  buildAgentSection(novel, chapIdx){
    const active = AgentDirectives.active(novel, chapIdx);
    if(active.length === 0) return '';

    // 按优先级排序
    const priorityOrder = { urgent: 0, quality: 1, emotion_continuity: 1, strategy: 2, optimization: 3, global: 5 };
    const sorted = [...active].sort((a, b) =>
      (priorityOrder[a.type] || 5) - (priorityOrder[b.type] || 5)
    );

    // 截断：每类最多2条，总共最多5条
    const byType = {};
    const result = [];
    for(const d of sorted){
      if(!byType[d.type]) byType[d.type] = 0;
      if(byType[d.type] >= 2) continue;
      byType[d.type]++;
      result.push(d);
      if(result.length >= 5) break;
    }

    // 格式化：单条≤200字，总计≤800字
    const lines = ['【Agent写作指令（本章必须遵循）】'];
    let totalLen = 0;
    for(const d of result){
      const text = d.directive.slice(0, 200);
      if(totalLen + text.length > 800) break;
      lines.push(`- ${text}`);
      totalLen += text.length;
    }
    return lines.length > 1 ? lines.join('\n') : '';
  },
};

// ============================================================
// RewriteAgent - 重写Agent
// 对标参考项目 rewrite-agent.js
// 触发条件 + 采纳门槛 + 防退化
// ============================================================
const RewriteAgent = {

  // 配置
  THRESHOLD: 70,       // 质量分低于此值才考虑重写
  MIN_GAIN: 10,        // 重写后至少提升10分才采纳
  THRESHOLD_MARGIN: 10, // 接近阈值（差10分内）不重写

  // 判断是否需要重写
  shouldRewrite(originalScore, gateResults){
    // 分数达标 → 不重写
    if(originalScore >= this.THRESHOLD) return false;
    // 接近阈值且无严重问题 → 不重写
    if(originalScore >= this.THRESHOLD - this.THRESHOLD_MARGIN){
      const criticalIssues = this.extractCriticalIssues(gateResults);
      if(criticalIssues.length === 0) return false;
    }
    return true;
  },

  // 提取严重问题
  extractCriticalIssues(gateResults){
    if(!gateResults) return [];
    const issues = [];
    for(const [gate, result] of Object.entries(gateResults)){
      if(result.score < 60 && result.issues){
        for(const issue of result.issues.slice(0, 3)){
          issues.push({ gate, ...issue });
        }
      }
    }
    return issues;
  },

  // 构建重写Prompt
  buildRewritePrompt(novel, chapIdx, content, criticalIssues){
    const chap = novel.chapters[chapIdx];
    const issuesText = criticalIssues.map(i => `- ${i.gate}：${i.message}`).join('\n');

    return `你是一位资深网文编辑。以下章节存在质量问题，请基于问题清单重写，保持核心剧情不变。

【质量问题】
${issuesText}

【原章节内容】
${content}

【重写要求】
1. 只修正指出的问题，不要改动合格段落
2. 保持人物性格、情节走向、对话风格
3. 保持字数约 ${novel.wordCount} 字
4. 直接输出完整正文，不要输出说明或分析

请直接输出重写后的正文：`;
  },

  // 执行重写
  async rewrite(novel, chapIdx, content, gateResults, originalScore){
    if(!this.shouldRewrite(originalScore, gateResults)) return null;
    if(store.mode !== 'api') return null;

    try{
      const criticalIssues = this.extractCriticalIssues(gateResults);
      if(criticalIssues.length === 0) return null;

      const prompt = this.buildRewritePrompt(novel, chapIdx, content, criticalIssues);
      const { base, key, model } = store.config;

      const res = await fetch(base.replace(/\/$/,'')+'/chat/completions',{
        method:'POST',
        headers:{'Content-Type':'application/json','Authorization':`Bearer ${key}`},
        body: JSON.stringify({
          model,
          messages:[{role:'user', content: prompt}],
          stream: false,
          temperature: 0.7,
          max_tokens: Api.estimateMaxTokens(prompt),
        })
      });

      if(!res.ok) return null;
      const json = await res.json();
      const rewritten = json.choices?.[0]?.message?.content?.trim() || '';
      if(!rewritten || rewritten.length < 50) return null;

      // 评估重写后质量
      const postResult = QualityGuard.postWriteCheck(novel, chapIdx, rewritten);
      const newScore = postResult.score.overall;

      // 采纳门槛：提升不足则不采纳
      const gain = newScore - originalScore;
      if(gain < this.MIN_GAIN){
        return {
          rewritten: false,
          reason: `重写后提升${gain}分，不足${this.MIN_GAIN}分门槛，保留原文`,
          originalScore, newScore, gain,
        };
      }

      return {
        rewritten: true,
        content: postResult.cleanedContent,
        originalScore, newScore, gain,
        postResult,
      };
    }catch(e){
      console.warn('RewriteAgent重写失败', e);
      return null;
    }
  },
};

// ============================================================
// IterativeRefinementController - 迭代精炼控制器
// 对标参考项目 iterative-refinement-controller.js
// 6步迭代 + 终止条件 + 最佳内容保留
// ============================================================
const IterativeRefinementController = {

  // 配置
  MAX_ITERATIONS: 3,
  TARGET_SCORE: 80,
  MIN_IMPROVEMENT: 5,
  TIME_BUDGET: 300000,  // 5分钟
  QUALITY_DECLINE_THRESHOLD: 3,

  // 执行迭代精炼
  async refine(novel, chapIdx, initialContent, initialScore, gateResults){
    let currentContent = initialContent;
    let currentScore = initialScore;
    let bestContent = initialContent;
    let bestScore = initialScore;
    const history = [];
    const startTime = Date.now();

    for(let iter = 0; iter < this.MAX_ITERATIONS; iter++){
      // 检查终止条件
      if(this.shouldTerminate(currentScore, bestScore, history, iter, startTime)){
        break;
      }

      // Step 1: 识别问题
      const issues = this.identifyIssues(gateResults, novel, chapIdx, currentContent);
      if(issues.length === 0) break;

      // Step 2: 生成建议
      const suggestions = this.generateSuggestions(issues, iter);
      if(suggestions.length === 0) break;

      // Step 3: 应用改进（调用RewriteAgent）
      const rewriteResult = await RewriteAgent.rewrite(novel, chapIdx, currentContent, gateResults, currentScore);
      if(!rewriteResult || !rewriteResult.rewritten) break;

      const beforeScore = currentScore;
      currentContent = rewriteResult.content;
      currentScore = rewriteResult.newScore;

      // Step 4: 评估效果
      const evaluation = ImprovementEvaluator.evaluateIteration(beforeScore, currentScore, issues, []);
      history.push({ iteration: iter + 1, before: beforeScore, after: currentScore, ...evaluation });

      // Step 5: 更新最佳
      if(currentScore > bestScore){
        bestScore = currentScore;
        bestContent = currentContent;
      }

      // Step 6: 检查达标
      if(currentScore >= this.TARGET_SCORE) break;
    }

    return {
      success: bestScore > initialScore,
      final_content: bestContent,
      final_score: bestScore,
      iterations_used: history.length,
      total_improvement: bestScore - initialScore,
      history,
      reached_target: bestScore >= this.TARGET_SCORE,
    };
  },

  // 终止条件判断
  shouldTerminate(currentScore, bestScore, history, iter, startTime){
    // 达到目标分数
    if(currentScore >= this.TARGET_SCORE) return true;
    // 质量下降
    if(history.length > 0){
      const lastIter = history[history.length - 1];
      if(currentScore < lastIter.before - this.QUALITY_DECLINE_THRESHOLD) return true;
      // 边际收益递减
      if(history.length >= 2){
        const prevGain = history[history.length - 2].improvement;
        const currGain = lastIter.improvement;
        if(currGain < prevGain * 0.3 || currGain < this.MIN_IMPROVEMENT * 0.5) return true;
      }
      // 连续两轮低改进
      if(history.length >= 2){
        const last2 = history.slice(-2);
        if(last2.every(h => h.improvement < this.MIN_IMPROVEMENT * 0.5)) return true;
      }
    }
    // 超时
    if(Date.now() - startTime > this.TIME_BUDGET) return true;
    return false;
  },

  // 识别问题
  identifyIssues(gateResults, novel, chapIdx, content){
    const issues = [];

    // 从五关检测结果提取
    if(gateResults){
      for(const [gate, result] of Object.entries(gateResults)){
        if(result.score < 60 && result.issues){
          for(const issue of result.issues){
            issues.push({ source: gate, severity: 'high', ...issue });
          }
        }
      }
    }

    // 从StyleGuard提取
    try{
      const styleResult = StyleGuard.review(novel, chapIdx, content);
      for(const issue of styleResult.issues){
        if(issue.severity === 'medium' || issue.severity === 'high'){
          issues.push({ source: 'style', severity: issue.severity, message: issue.message });
        }
      }
    }catch(e){}

    return issues;
  },

  // 生成建议
  generateSuggestions(issues, iteration){
    const high = issues.filter(i => i.severity === 'high');
    const medium = issues.filter(i => i.severity === 'medium');

    const suggestions = [];
    // high 优先级最多3个
    suggestions.push(...high.slice(0, 3));
    // medium 最多2个
    if(iteration < 2) suggestions.push(...medium.slice(0, 2));

    return suggestions;
  },

  // ============================================================
  // P0-2 新增方法 — 对标 Reference-php RewriteAgent/IterativeRefinementController
  // ============================================================

  // 执行迭代精修 — performIterativeRefinement
  // 对应 Reference-php RewriteAgent.performIterativeRefinement() 第 132-232 行
  // 与 refine() 区别：本方法接受 issues 参数，支持外部传入问题列表
  async performIterativeRefinement(novel, chapIdx, chapterText, issues, config){
    const maxIter = config?.maxIterations || this.MAX_ITERATIONS;
    let currentContent = chapterText;
    let currentScore = 0;
    let bestContent = chapterText;
    let bestScore = 0;
    const history = [];
    const startTime = Date.now();

    // 初始评分
    const initialPost = QualityGuard.postWriteCheck(novel, chapIdx, chapterText);
    currentScore = initialPost.score.overall;
    bestScore = currentScore;
    bestContent = chapterText;

    for(let iter = 0; iter < maxIter; iter++){
      // 终止条件
      if(this.shouldTerminate(currentScore, bestScore, history, iter, startTime)) break;
      if(currentScore >= this.TARGET_SCORE) break;

      // Step 1: 识别问题（优先用传入的 issues，其次从 gateResult 提取）
      let identifiedIssues = issues;
      if(!identifiedIssues || identifiedIssues.length === 0){
        const post = QualityGuard.postWriteCheck(novel, chapIdx, currentContent);
        identifiedIssues = this.identifyIssues(post.gateResult, novel, chapIdx, currentContent);
      }

      if(identifiedIssues.length === 0) break;

      // Step 2: 生成修复指令
      const fixInstructions = this.generateCriticFixInstructions(identifiedIssues);
      if(fixInstructions.length === 0) break;

      // Step 3: 调用 RewriteAgent 重写
      const gateResults = initialPost.gateResult?.gateResults || {};
      const rewriteResult = await RewriteAgent.rewrite(novel, chapIdx, currentContent, gateResults, currentScore);
      if(!rewriteResult || !rewriteResult.rewritten) break;

      const beforeScore = currentScore;
      currentContent = rewriteResult.content;
      currentScore = rewriteResult.newScore;

      // Step 4: 评估本轮效果（内联实现，避免外部依赖）
      const improvement = currentScore - beforeScore;
      const evaluation = {
        improvement,
        improvement_pct: beforeScore > 0 ? Math.round(improvement / beforeScore * 100) : 0,
        issues_addressed: identifiedIssues.length,
      };
      history.push({ iteration: iter + 1, before: beforeScore, after: currentScore, ...evaluation });

      // Step 5: 更新最佳
      if(currentScore > bestScore){
        bestScore = currentScore;
        bestContent = currentContent;
      }
    }

    // 综合评估
    const overall = this.evaluateOverall(history);

    // P0-2 集成：用 getCriticScore 获取 AI 评分（API 模式下更准确）
    // 为什么在循环后调用：规则评分用于迭代过程（快速），AI 评分用于最终评估（精确）
    let finalScore = bestScore;
    try{
      if(store.mode === 'api'){
        const aiScore = await this.getCriticScore(novel, chapIdx, bestContent);
        if(aiScore > 0) finalScore = aiScore;
      }
    }catch(e){ console.warn('getCriticScore 最终评估失败，使用规则评分', e); }

    return {
      success: finalScore > initialPost.score.overall,
      final_content: bestContent,
      final_score: finalScore,
      rule_score: bestScore,
      initial_score: initialPost.score.overall,
      iterations_used: history.length,
      total_improvement: finalScore - initialPost.score.overall,
      history,
      overall,
      reached_target: finalScore >= this.TARGET_SCORE,
    };
  },

  // 综合评估所有迭代结果 — evaluateOverall
  // 对应 Reference-php evaluateOverall()
  evaluateOverall(iterationHistory){
    if(!iterationHistory || iterationHistory.length === 0){
      return { best_iteration: 0, avg_improvement: 0, trend: 'no_data' };
    }

    const improvements = iterationHistory.map(h => h.improvement || 0);
    const totalImprovement = improvements.reduce((a, b) => a + b, 0);
    const avgImprovement = totalImprovement / improvements.length;

    // 找最佳迭代
    let bestIter = 0;
    let bestGain = -Infinity;
    for(const h of iterationHistory){
      const gain = (h.after || 0) - (h.before || 0);
      if(gain > bestGain){
        bestGain = gain;
        bestIter = h.iteration;
      }
    }

    // 趋势分析
    let trend = 'stable';
    if(improvements.length >= 2){
      const lastHalf = improvements.slice(Math.floor(improvements.length / 2));
      const firstHalf = improvements.slice(0, Math.floor(improvements.length / 2));
      const avgLast = lastHalf.reduce((a, b) => a + b, 0) / lastHalf.length;
      const avgFirst = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
      if(avgLast > avgFirst * 1.2) trend = 'improving';
      else if(avgLast < avgFirst * 0.8) trend = 'declining';
    }

    return {
      best_iteration: bestIter,
      best_gain: bestGain,
      avg_improvement: Math.round(avgImprovement * 10) / 10,
      total_improvement: totalImprovement,
      trend,
    };
  },

  // 将质量 issues 转化为具体的重写指令 — generateCriticFixInstructions
  // 对应 Reference-php generateCriticFixInstructions() 第 516-535 行
  generateCriticFixInstructions(issues){
    if(!issues || issues.length === 0) return [];

    const instructions = [];
    const seen = new Set();

    for(const issue of issues){
      const msg = issue.message || issue.desc || String(issue);
      if(seen.has(msg)) continue;
      seen.add(msg);

      // 根据问题来源生成针对性指令
      const source = issue.source || issue.gate || '';
      const severity = issue.severity || 'medium';

      if(severity === 'high' || source.includes('gate')){
        instructions.push(`修复问题：${msg}`);
      } else if(severity === 'medium'){
        instructions.push(`改进：${msg}`);
      }
      // low severity 不生成重写指令，避免过度修改
    }

    // 限制指令数量（最多 5 条，避免 prompt 过长）
    return instructions.slice(0, 5);
  },

  // 调用 CriticAgent 评估章节得分 — getCriticScore
  // 对应 Reference-php getCriticScore() 第 354-373 行
  async getCriticScore(novel, chapIdx, chapterText){
    // 优先用 CriticAgent（需 API）
    if(store.mode === 'api'){
      try{
        const criticResult = await CriticAgent.review(novel, chapIdx, chapterText);
        if(criticResult && criticResult.avg){
          // 将 10 分制转为 100 分制
          return Math.round(criticResult.avg * 10);
        }
      }catch(e){
        console.warn('getCriticScore: CriticAgent 调用失败，回退到规则评分', e);
      }
    }

    // 回退：使用 QualityGuard 的规则评分
    const post = QualityGuard.scoreChapter(novel, chapIdx, chapterText);
    return post.overall;
  },
};

// ============================================================
// QualityMonitorAgent - 质量监控智能体
// 对标参考项目 QualityMonitorAgent.php
// 8 维质量指标 + 阈值告警 + 角色一致性检测
// ============================================================
const QualityMonitorAgent = {

  // 8 维质量阈值
  THRESHOLDS: {
    overall:           { min: 60, label: '综合质量' },
    structure:        { min: 70, label: '结构评分' },
    character_consistency: { min: 0.8, label: '角色一致性' },
    description:      { min: 50, label: '描写评分' },
    engagement:       { min: 50, label: '爽感评分' },
    coherence:        { min: 50, label: '连贯性评分' },
    dialogue_density: { min: 25, label: '对话密度' },
    sensory_balance:  { min: 3, label: '感官多样性' },
  },

  // 角色一致性检测 — 对标 Reference-php 第 519-584 行
  // 检查角色行为是否与角色卡设定一致
  calculateCharacterConsistency(chapterText, characterCards){
    if(!characterCards) return { score: 1.0, issues: [] };

    let charNames = [];
    if(typeof characterCards === 'string'){
      charNames = QualityGuard.extractCharacterNames(characterCards);
    } else if(Array.isArray(characterCards)){
      charNames = characterCards.map(c => c.name).filter(Boolean);
    }

    if(charNames.length === 0) return { score: 1.0, issues: [] };

    const issues = [];
    let consistentCount = 0;
    let totalChecked = 0;

    // 解析角色卡中的性格关键词
    const charTraits = this.parseCharacterTraits(characterCards);

    for(const name of charNames){
      if(!chapterText.includes(name)) continue;
      totalChecked++;

      const traits = charTraits[name];
      if(!traits || traits.length === 0) continue;

      // 检查性格矛盾
      let isConsistent = true;

      // 冷静性格不应出现暴怒描写
      if(traits.includes('冷静') && /暴跳如雷|歇斯底里|疯狂|癫狂/.test(chapterText)){
        issues.push({
          character: name,
          type: 'ooc_calm_to_rage',
          message: `"${name}"设定为冷静性格，但出现暴怒描写，可能 OOC`,
        });
        isConsistent = false;
      }

      // 善良性格不应出现残忍描写
      if(traits.includes('善良') && /残忍|虐杀|冷血|无情/.test(chapterText)){
        issues.push({
          character: name,
          type: 'ooc_kind_to_cruel',
          message: `"${name}"设定为善良性格，但出现残忍描写，可能 OOC`,
        });
        isConsistent = false;
      }

      // 高傲性格不应出现卑微描写
      if(traits.includes('高傲') && /跪下|求饶|卑微|低声下气/.test(chapterText)){
        issues.push({
          character: name,
          type: 'ooc_proud_to_humble',
          message: `"${name}"设定为高傲性格，但出现卑微描写，可能 OOC`,
        });
        isConsistent = false;
      }

      // 谨慎性格不应出现鲁莽描写
      if(traits.includes('谨慎') && /鲁莽|冲动|不顾一切|贸然/.test(chapterText)){
        issues.push({
          character: name,
          type: 'ooc_cautious_to_reckless',
          message: `"${name}"设定为谨慎性格，但出现鲁莽描写，可能 OOC`,
        });
        isConsistent = false;
      }

      if(isConsistent) consistentCount++;
    }

    const score = totalChecked > 0 ? consistentCount / totalChecked : 1.0;

    return { score, issues, checked: totalChecked, consistent: consistentCount };
  },

  // 回退方案：纯正则的角色一致性检测 — 对标 Reference-php 第 586-623 行
  // 当角色卡解析失败时使用
  fallbackCharacterConsistencyCheck(chapterText){
    const issues = [];

    // 检测对话风格一致性
    // 同一角色的对话句长应有一定变化，但不应过于一致
    const dialoguePattern = /["「『"]([^"」』"]{2,})["」』"]/g;
    const dialogues = [];
    let match;
    while((match = dialoguePattern.exec(chapterText)) !== null){
      dialogues.push(match[1]);
    }

    if(dialogues.length >= 5){
      // 检测是否有完全重复的对话
      const seen = new Set();
      for(const d of dialogues){
        if(seen.has(d)){
          issues.push({
            type: 'duplicate_dialogue',
            message: '检测到完全重复的对话，可能角色语音不一致',
          });
          break;
        }
        seen.add(d);
      }
    }

    // 检测对话标签过于单一
    const tagPattern = /(说道|道|说|问|答|喊道|笑道|冷道|怒道)/g;
    const tags = chapterText.match(tagPattern) || [];
    if(tags.length > 5){
      const tagCounts = {};
      for(const t of tags) tagCounts[t] = (tagCounts[t] || 0) + 1;
      const maxTag = Object.entries(tagCounts).sort((a, b) => b[1] - a[1])[0];
      if(maxTag && maxTag[1] / tags.length > 0.6){
        issues.push({
          type: 'tag_monotone',
          message: `对话标签"${maxTag[0]}"占比过高（${Math.round(maxTag[1] / tags.length * 100)}%），角色语音缺乏差异化`,
        });
      }
    }

    return { score: issues.length === 0 ? 1.0 : 0.7, issues };
  },

  // 解析角色卡中的性格关键词
  parseCharacterTraits(characterCards){
    const traits = {};
    if(typeof characterCards !== 'string') return traits;

    const lines = characterCards.split('\n');
    let currentName = '';
    for(const line of lines){
      const nameMatch = line.match(/^###\s*(.+?)(?:（.+）)?$/);
      if(nameMatch){
        currentName = nameMatch[1].trim();
        traits[currentName] = [];
        continue;
      }
      if(currentName && line.includes('性格')){
        // 提取性格关键词
        const traitKeywords = ['冷静','善良','高傲','谨慎','热血','腹黑','天真','沉稳','暴躁','温柔','冷酷','豪爽','阴险','正直','狡猾'];
        for(const kw of traitKeywords){
          if(line.includes(kw)) traits[currentName].push(kw);
        }
      }
    }
    return traits;
  },

  // ===== v4 计划补全方法：拆分 check() 逻辑为独立方法 =====

  // 决策入口 — 对标 Reference-php QualityMonitorAgent.decide() 第 91-124 行
  // 协调全流程：收集指标 → 识别问题 → 评估风险 → 生成建议 → 执行
  async decide(novel, chapIdx, content){
    const metrics = this.collectQualityMetrics(novel, chapIdx, content);
    const issues = this.identifyQualityIssues(metrics, novel, content);
    const risks = this.assessRisks(issues);
    const recommendations = this.generateRecommendations(issues, risks);
    const directives = this.execute(recommendations);
    return { metrics, issues, risks, recommendations, directives };
  },

  // 收集质量指标 — 对标 Reference-php 第 132-146 行
  collectQualityMetrics(novel, chapIdx, content){
    const metrics = {};
    const score = QualityGuard.scoreChapter(novel, chapIdx, content);
    metrics.overall = score.overall;
    metrics.structure = score.scores.structure;
    metrics.description = score.scores.description;
    metrics.engagement = score.scores.engagement;
    metrics.coherence = score.scores.coherence;
    // 角色一致性
    const charConsistency = this.calculateCharacterConsistency(content, novel.characters);
    metrics.character_consistency = charConsistency.score;
    // 对话密度
    const dialogueMatches = content.match(/["「『"][^"」』"]+["」』"]/g) || [];
    const dialoguePerK = content.length > 0 ? (dialogueMatches.join('').length / content.length * 1000) : 0;
    metrics.dialogue_density = Math.round(dialoguePerK);
    // 感官多样性
    const sensoryResult = StyleGuard.checkSensoryBalance(content);
    metrics.sensory_balance = Object.values(sensoryResult.balance).filter(v => v > 0).length;
    return metrics;
  },

  // 识别质量问题 — 对标 Reference-php 第 154-247 行
  identifyQualityIssues(metrics, novel, content){
    const issues = [];
    for(const [key, threshold] of Object.entries(this.THRESHOLDS)){
      const value = metrics[key];
      if(value !== undefined && value < threshold.min){
        issues.push({
          metric: key,
          label: threshold.label,
          value,
          threshold: threshold.min,
          severity: value < threshold.min * 0.7 ? 'high' : 'medium',
          message: `${threshold.label}为${value}，低于阈值${threshold.min}`,
        });
      }
    }
    // 角色一致性问题
    const charConsistency = this.calculateCharacterConsistency(content, novel.characters);
    if(charConsistency.issues.length > 0){
      for(const issue of charConsistency.issues){
        issues.push({
          metric: 'character_consistency',
          label: '角色一致性',
          value: charConsistency.score,
          threshold: 0.8,
          severity: 'high',
          message: issue.message,
        });
      }
    }
    return issues;
  },

  // 风险评估 — 对标 Reference-php 第 255-279 行
  assessRisks(issues){
    const risks = [];
    for(const issue of issues){
      const impact = this.assessImpact(issue);
      const urgency = this.assessUrgency(issue);
      risks.push({
        issue,
        impact,
        urgency,
        riskLevel: impact === 'high' && urgency === 'high' ? 'critical' : (impact === 'high' || urgency === 'high' ? 'high' : 'medium'),
      });
    }
    return risks;
  },

  // 生成建议 — 对标 Reference-php 第 288-352 行
  generateRecommendations(issues, risks){
    const recommendations = [];
    for(let i = 0; i < issues.length; i++){
      const issue = issues[i];
      const risk = risks[i] || { riskLevel: 'medium' };
      const directive = this.generateQuantifiableDirective(issue);
      recommendations.push({
        issue,
        riskLevel: risk.riskLevel,
        directive,
        action: this.classifyIssueType(issue),
      });
    }
    return recommendations;
  },

  // 执行建议 — 对标 Reference-php 第 360-370 行
  execute(recommendations){
    const directives = [];
    for(const rec of recommendations){
      const result = this.executeRecommendation(rec);
      if(result) directives.push(result);
    }
    return directives;
  },

  // 问题分类 — 对标 Reference-php 第 378-387 行
  classifyIssueType(issue){
    const msg = issue.message || '';
    if(msg.includes('角色') || msg.includes('OOC')) return 'character';
    if(msg.includes('描写') || msg.includes('感官')) return 'description';
    if(msg.includes('爽') || msg.includes('高潮')) return 'engagement';
    if(msg.includes('结构') || msg.includes('字数')) return 'structure';
    if(msg.includes('连贯') || msg.includes('一致')) return 'coherence';
    if(msg.includes('对话')) return 'dialogue';
    return 'general';
  },

  // 生成量化指令 — 对标 Reference-php 第 389-417 行
  generateQuantifiableDirective(issue){
    if(issue.severity === 'high'){
      return `【质量告警】${issue.message}，必须改进`;
    }
    return `【质量建议】${issue.message}，建议改进`;
  },

  // 执行单个建议 — 对标 Reference-php 第 419-470 行
  executeRecommendation(rec){
    if(!rec.directive) return null;
    return rec.directive;
  },

  // 获取最近章节 — 对标 Reference-php 第 474-486 行
  getRecentChapters(novel, count){
    count = count || 5;
    if(!novel?.chapters) return [];
    return novel.chapters.slice(-count).filter(c => c && c.content);
  },

  // 计算总体质量分 — 对标 Reference-php 第 488-498 行
  calculateOverallQuality(metrics){
    if(!metrics) return 0;
    const weights = { overall: 0.3, structure: 0.15, description: 0.15, engagement: 0.15, coherence: 0.15, character_consistency: 0.1 };
    let sum = 0, weightSum = 0;
    for(const [key, w] of Object.entries(weights)){
      if(metrics[key] !== undefined){
        const val = key === 'character_consistency' ? metrics[key] * 100 : metrics[key];
        sum += val * w;
        weightSum += w;
      }
    }
    return weightSum > 0 ? Math.round(sum / weightSum) : 0;
  },

  // 结构评分 — 对标 Reference-php 第 500-517 行
  calculateStructureScore(text){
    if(!text) return 0;
    const paragraphs = text.split(/\n+/).filter(p => p.trim().length > 0);
    const sentences = text.split(/[。！？\n.!?]/).filter(s => s.trim().length > 0);
    let score = 50;
    if(paragraphs.length >= 3) score += 10;
    if(paragraphs.length >= 6) score += 10;
    if(sentences.length >= 5) score += 10;
    if(sentences.length >= 10) score += 10;
    if(text.length >= 800) score += 10;
    return Math.min(100, score);
  },

  // 描写丰富度 — 对标 Reference-php 第 625-672 行
  calculateDescriptionRichness(text){
    if(!text) return 0;
    const sensoryMarkers = (text.match(/看到|听到|闻到|感到|尝到|仿佛|宛如|犹如|似乎/g) || []).length;
    const adjMarkers = (text.match(/的|地|着/g) || []).length;
    const lengthFactor = text.length / 1000;
    return Math.round(Math.min(100, (sensoryMarkers + adjMarkers * 0.5) / Math.max(1, lengthFactor) * 10));
  },

  // 情节连贯性 — 对标 Reference-php 第 674-689 行
  calculatePlotCoherence(text){
    if(!text) return 50;
    let score = 50;
    if(text.includes('因为') || text.includes('所以')) score += 10;
    if(text.includes('然而') || text.includes('但是') || text.includes('不过')) score += 10;
    if(text.includes('于是') || text.includes('然后') || text.includes('接着')) score += 10;
    if(text.includes('虽然') || text.includes('尽管')) score += 5;
    if(text.includes('突然') || text.includes('忽然')) score += 5;
    return Math.min(100, score);
  },

  // 影响评估 — 对标 Reference-php 第 777-790 行
  assessImpact(issue){
    if(issue.severity === 'high') return 'high';
    if(issue.severity === 'medium') return 'medium';
    return 'low';
  },

  // 紧急度评估 — 对标 Reference-php 第 792-801 行
  assessUrgency(issue){
    if(issue.metric === 'overall' && issue.value < 40) return 'high';
    if(issue.metric === 'character_consistency') return 'high';
    if(issue.severity === 'high') return 'high';
    if(issue.severity === 'medium') return 'medium';
    return 'low';
  },

  // 综合质量检测 — 保留 check() 作为 decide() 的兼容入口
  async check(novel, chapIdx, content){
    const result = await this.decide(novel, chapIdx, content);
    const charConsistency = this.calculateCharacterConsistency(content, novel.characters);
    return {
      metrics: result.metrics,
      alerts: result.issues,
      directives: result.directives,
      charConsistency,
    };
  },
};

// ============================================================
// OptimizationAgent - 优化智能体
// 对标参考项目 OptimizationAgent.php
// 章节优化 + 大纲优化 + 优化机会识别
// ============================================================
const OptimizationAgent = {

  // 优化章节内容 — optimizeChapter
  // 根据问题列表生成优化建议
  optimizeChapter(chapterText, issues){
    if(!issues || issues.length === 0){
      return { optimizations: [], summary: '无需优化' };
    }

    const optimizations = [];

    for(const issue of issues){
      const msg = issue.message || issue.desc || String(issue);
      const source = issue.source || issue.gate || '';
      const severity = issue.severity || 'medium';

      // 根据问题类型生成优化策略
      if(msg.includes('字数') || msg.includes('长度')){
        optimizations.push({
          type: 'word_count',
          action: '调整字数至目标范围',
          instruction: msg.includes('不足') ? '扩展场景描写和对话，增加细节' : '精简冗余描写，保留核心情节',
          severity,
        });
      } else if(msg.includes('对话')){
        optimizations.push({
          type: 'dialogue',
          action: '优化对话质量',
          instruction: '增加角色对话，通过对话推进剧情和展现性格',
          severity,
        });
      } else if(msg.includes('感官') || msg.includes('描写')){
        optimizations.push({
          type: 'description',
          action: '增强描写质量',
          instruction: '增加感官细节（视/听/嗅/触/味），提升场景沉浸感',
          severity,
        });
      } else if(msg.includes('爽点') || msg.includes('高潮')){
        optimizations.push({
          type: 'engagement',
          action: '提升爽感',
          instruction: '加入冲突/反转/突破等爽点元素，增强情绪冲击',
          severity,
        });
      } else if(msg.includes('钩子') || msg.includes('结尾')){
        optimizations.push({
          type: 'hook',
          action: '强化结尾钩子',
          instruction: '结尾设置悬念，使用疑问/感叹/省略号等钩子词',
          severity,
        });
      } else if(msg.includes('一致') || msg.includes('OOC') || msg.includes('角色')){
        optimizations.push({
          type: 'consistency',
          action: '修正角色一致性',
          instruction: '检查角色行为是否与设定矛盾，修正 OOC 描写',
          severity,
        });
      } else if(msg.includes('衔接') || msg.includes('承接')){
        optimizations.push({
          type: 'coherence',
          action: '改善前后衔接',
          instruction: '本章开头应承接上一章结尾，使用转场词保持连贯',
          severity,
        });
      } else {
        optimizations.push({
          type: 'general',
          action: '通用优化',
          instruction: msg,
          severity,
        });
      }
    }

    // 按严重度排序
    const severityOrder = { high: 0, medium: 1, low: 2 };
    optimizations.sort((a, b) => (severityOrder[a.severity] || 3) - (severityOrder[b.severity] || 3));

    return {
      optimizations,
      summary: `${optimizations.length} 项优化建议（高${optimizations.filter(o => o.severity === 'high').length}/中${optimizations.filter(o => o.severity === 'medium').length}/低${optimizations.filter(o => o.severity === 'low').length}）`,
    };
  },

  // 优化大纲 — optimizeOutline
  // 根据反馈优化大纲
  optimizeOutline(outline, feedback){
    if(!outline || !Array.isArray(outline)) return { optimized: false, outline };
    if(!feedback) return { optimized: false, outline };

    const optimized = JSON.parse(JSON.stringify(outline)); // 深拷贝
    const changes = [];

    // 根据反馈类型优化
    if(feedback.similarChapters && feedback.similarChapters.length > 0){
      // 情节相似：差异化处理
      for(const pair of feedback.similarChapters){
        const idx = pair.indices?.[1];
        if(idx !== undefined && optimized[idx]){
          optimized[idx].summary += `（差异化：${pair.suggestion || '调整冲突焦点'}）`;
          changes.push(`第${idx+1}章差异化调整`);
        }
      }
    }

    if(feedback.missingHooks && feedback.missingHooks.length > 0){
      // 缺少钩子：补充钩子
      for(const idx of feedback.missingHooks){
        if(optimized[idx] && !optimized[idx].endHook){
          optimized[idx].endHook = '（建议补充悬念钩子）';
          changes.push(`第${idx+1}章补充结尾钩子`);
        }
      }
    }

    if(feedback.weakProgress && feedback.weakProgress.length > 0){
      // 推进较弱：强化冲突
      for(const idx of feedback.weakProgress){
        if(optimized[idx]){
          optimized[idx].summary = optimized[idx].summary.replace(/。$/, '，需增加明确的冲突结果或局面变化。');
          changes.push(`第${idx+1}章强化冲突推进`);
        }
      }
    }

    return {
      optimized: changes.length > 0,
      outline: optimized,
      changes,
    };
  },

  // 识别优化机会 — 对标 Reference-php OptimizationAgent.identifyOpportunities()
  identifyOpportunities(novel, chapIdx, content){
    const opportunities = [];

    // 1. 重复用词检测
    const wordFreq = {};
    const words = content.match(/[\u4e00-\u9fa5]{2,4}/g) || [];
    for(const w of words){
      wordFreq[w] = (wordFreq[w] || 0) + 1;
    }
    const topWords = Object.entries(wordFreq)
      .sort((a, b) => b[1] - a[1])
      .filter(([w, c]) => c > 5 && w.length >= 2);

    for(const [word, count] of topWords.slice(0, 3)){
      if(count > 8){
        opportunities.push({
          type: 'word_overuse',
          word,
          count,
          suggestion: `词汇"${word}"出现${count}次，建议使用同义词替换部分实例`,
        });
      }
    }

    // 2. 长句检测
    const longSentences = content.split(/[。！？]/).filter(s => s.length > 80);
    if(longSentences.length > 3){
      opportunities.push({
        type: 'long_sentences',
        count: longSentences.length,
        suggestion: `${longSentences.length}个超过80字的句子，建议拆分以提升可读性`,
      });
    }

    // 3. 被动语态过多
    const passiveCount = (content.match(/被[^，。\n]{2,10}[，。]/g) || []).length;
    if(passiveCount > 5){
      opportunities.push({
        type: 'passive_overuse',
        count: passiveCount,
        suggestion: `被动语态使用${passiveCount}次，建议改为主动语态增强力量感`,
      });
    }

    return opportunities;
  },

  // ===== v4 计划补全方法 =====

  // 决策入口 — 对标 Reference-php OptimizationAgent.decide()
  decide(novel, chapIdx, context){
    const history = this.analyzeHistoricalData(novel);
    const opportunities = this.identifyOptimizationOpportunities(novel, chapIdx, context?.content || '');
    const proposals = opportunities.map(opp => this.generateProposal(opp.type, { ...context, opportunity: opp }));
    const evaluated = this.evaluateOptimizationProposals(proposals);
    const selected = this.selectBestProposals(evaluated);
    const results = this.execute(novel, chapIdx, selected);
    return { history, opportunities, proposals: evaluated, selected, results };
  },

  // 分析历史数据 — 对标 Reference-php 第 45-78 行
  analyzeHistoricalData(novel){
    if(!novel?.chapters) return { avgScore: 0, trend: 'stable', totalChapters: 0 };
    const done = novel.chapters.filter(c => c && c.score);
    if(done.length === 0) return { avgScore: 0, trend: 'stable', totalChapters: 0 };
    const scores = done.map(c => c.score.overall || 0);
    const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
    const recent = scores.slice(-5);
    const early = scores.slice(0, 5);
    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const earlyAvg = early.reduce((a, b) => a + b, 0) / early.length;
    const trend = recentAvg > earlyAvg + 3 ? 'improving' : recentAvg < earlyAvg - 3 ? 'declining' : 'stable';
    return { avgScore: Math.round(avgScore), trend, totalChapters: done.length, recentAvg: Math.round(recentAvg), earlyAvg: Math.round(earlyAvg) };
  },

  // 识别优化机会 — 对标 Reference-php identifyOptimizationOpportunities()
  // 包装现有 identifyOpportunities 方法
  identifyOptimizationOpportunities(novel, chapIdx, content){
    return this.identifyOpportunities(novel, chapIdx, content);
  },

  // 评估优化提案 — 对标 Reference-php 第 120-156 行
  evaluateOptimizationProposals(proposals){
    return proposals.map(p => {
      const risk = this.assessRisk(p);
      const feasibility = this.assessFeasibility(p);
      const roi = this.calculateROI(p, p.cost || 1, p.benefit || 5);
      return { ...p, risk, feasibility, roi, score: roi * (risk === 'low' ? 1.2 : risk === 'high' ? 0.6 : 1) };
    });
  },

  // 生成单个提案 — 对标 Reference-php 第 158-192 行
  generateProposal(type, context){
    const opp = context?.opportunity || {};
    return {
      type,
      action: opp.suggestion || '优化建议',
      instruction: opp.suggestion || '',
      severity: opp.severity || 'medium',
      cost: 1,
      benefit: 5,
      source: 'optimization_agent',
    };
  },

  // 选择最佳提案 — 对标 Reference-php 第 194-210 行
  selectBestProposals(proposals, limit){
    limit = limit || 3;
    return proposals
      .sort((a, b) => (b.score || 0) - (a.score || 0))
      .slice(0, limit);
  },

  // 执行优化 — 对标 Reference-php 第 212-230 行
  execute(novel, chapIdx, proposals){
    const results = [];
    for(const p of proposals){
      const result = this.executeAction(novel, chapIdx, p);
      if(result) results.push(result);
    }
    return results;
  },

  // 执行单个操作 — 对标 Reference-php 第 232-260 行
  executeAction(novel, chapIdx, action){
    if(!action) return null;
    return {
      type: action.type,
      action: action.action || action.suggestion || '',
      applied: true,
      chapterIdx: chapIdx,
    };
  },

  // 分析性能趋势 — 对标 Reference-php 第 262-288 行
  analyzePerformanceTrends(novel){
    const history = this.analyzeHistoricalData(novel);
    return {
      avgScore: history.avgScore,
      trend: history.trend,
      totalChapters: history.totalChapters,
      recommendation: history.trend === 'declining' ? '质量下降趋势，建议加强质量检查' : history.trend === 'improving' ? '质量提升趋势，保持当前策略' : '质量稳定',
    };
  },

  // 分析质量趋势 — 对标 Reference-php 第 290-312 行
  analyzeQualityTrends(novel){
    if(!novel?.chapters) return { stable: true };
    const done = novel.chapters.filter(c => c && c.score);
    if(done.length < 2) return { stable: true };
    const scores = done.map(c => c.score.overall || 0);
    const recent = scores.slice(-3);
    const avg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const prev = scores.slice(-6, -3);
    const prevAvg = prev.length > 0 ? prev.reduce((a, b) => a + b, 0) / prev.length : avg;
    return {
      current: Math.round(avg),
      previous: Math.round(prevAvg),
      delta: Math.round(avg - prevAvg),
      stable: Math.abs(avg - prevAvg) < 3,
    };
  },

  // 分析成本效率 — 对标 Reference-php 第 314-338 行
  analyzeCostEfficiency(novel){
    if(!novel?.chapters) return { efficiency: 0 };
    const done = novel.chapters.filter(c => c && c.score);
    if(done.length === 0) return { efficiency: 0 };
    const totalWords = done.reduce((s, c) => s + (c.content?.length || 0), 0);
    const avgScore = done.reduce((s, c) => s + (c.score.overall || 0), 0) / done.length;
    // 效率 = 平均质量分 / 千字
    const efficiency = totalWords > 0 ? Math.round((avgScore / (totalWords / 1000)) * 100) / 100 : 0;
    return { efficiency, totalWords, avgScore: Math.round(avgScore), chapters: done.length };
  },

  // 计算 ROI — 对标 Reference-php 第 340-358 行
  calculateROI(action, cost, benefit){
    if(cost <= 0) return benefit > 0 ? 10 : 0;
    return Math.round((benefit / cost) * 10) / 10;
  },

  // 风险评估 — 对标 Reference-php 第 360-378 行
  assessRisk(proposal){
    if(!proposal) return 'unknown';
    if(proposal.severity === 'high') return 'high';
    if(proposal.type === 'consistency' || proposal.type === 'coherence') return 'high';
    if(proposal.severity === 'medium') return 'medium';
    return 'low';
  },

  // 可行性评估 — 对标 Reference-php 第 380-398 行
  assessFeasibility(proposal){
    if(!proposal) return 'low';
    // 词汇替换、长句拆分等低风险操作可行性高
    if(['word_overuse', 'long_sentences', 'passive_overuse'].includes(proposal.type)) return 'high';
    // 角色一致性、情节连贯等需要谨慎处理
    if(['consistency', 'coherence'].includes(proposal.type)) return 'medium';
    return 'medium';
  },

  // 指令效果分析 — 对标 Reference-php 第 400-430 行
  analyzeDirectiveEffectiveness(novel){
    if(!novel?.memory?.directives || novel.memory.directives.length === 0){
      return { total: 0, effective: 0, rate: 0 };
    }
    const directives = novel.memory.directives.filter(d => d.outcomes && d.outcomes.length > 0);
    const effective = directives.filter(d => {
      const outcomes = d.outcomes;
      const positive = outcomes.filter(o => o.delta > 0).length;
      return positive > outcomes.length / 2;
    });
    return {
      total: novel.memory.directives.length,
      effective: effective.length,
      rate: novel.memory.directives.length > 0 ? Math.round(effective.length / novel.memory.directives.length * 100) : 0,
    };
  },
};

// ============================================================
// WritingExpertise - 网文创作专家知识库
// 对标参考项目 WritingExpertise.php
// 问题类型 → 诊断 → 解决方案的知识库
// 纯静态数据 + 匹配逻辑，零API成本
// ============================================================
const WritingExpertise = {

  // 专家知识库：问题类型 → 诊断 → 解决方案
  // 为什么用嵌套结构：一个问题类型可能有多个子类型，需要精确匹配
  KNOWLEDGE_BASE: {
    quality_low: {
      subtypes: {
        dialogue_weak: {
          diagnosis: '对话缺乏张力',
          symptoms: ['对话回合过长', '信息单向输出', '缺乏立场对立'],
          solutions: [
            '每轮对话控制在3句以内，必须有回应或反应',
            '对话双方必须有不同目标/信息/态度',
            '插入动作描写：表情、手势、眼神变化',
            '用"说"以外的动词：反驳、追问、冷笑、打断',
          ],
          example_fix: '原：他说："我觉得应该这样做。" 改：他敲了敲桌子："没有别的选择了吗？"',
        },
        pacing_slow: {
          diagnosis: '节奏拖沓',
          symptoms: ['铺垫段过长', '无事件段落超过300字', '过渡句过多'],
          solutions: [
            '开篇200字内必须有问题/悬念/冲突',
            '检查铺垫段：超过300字无事件必须打断',
            '删除过渡句：如"过了好一会""时间一分一秒过去"',
            '用动作代替时间流逝的描写',
          ],
          example_fix: '原：过了好一会，他才开口说话。 改：他猛地抬头。',
        },
        description_flat: {
          diagnosis: '描写平淡',
          symptoms: ['缺乏感官细节', '全是视觉描写', '形容词堆砌'],
          solutions: [
            '调用五感：不要只写"看到"，要写"听到""闻到""感觉到"',
            '用具体动作代替抽象形容词',
            '场景描写要有情绪色彩，不只是罗列物品',
          ],
          example_fix: '原：房间很乱。 改：桌上堆满了外卖盒，空气中弥漫着变质的饭菜味。',
        },
        emotion_hollow: {
          diagnosis: '情感空洞',
          symptoms: ['人物反应平淡', '缺乏内心独白', '重大事件无情绪波澜'],
          solutions: [
            '重大事件后必须有情绪反应',
            '用生理反应代替直接说情绪：手抖、心跳加速、喉咙发紧',
            '内心独白要和对话穿插',
          ],
          example_fix: '原：他很生气。 改：他攥紧了拳头，指节发白。',
        },
      },
    },
    coolpoint_low: {
      subtypes: {
        no_climax: {
          diagnosis: '缺乏高潮爽点',
          symptoms: [],
          solutions: [
            '每章至少安排一个"读者看到这里会叫好"的时刻',
            '高潮必须解决一个具体问题或带来重大突破',
            '用"预期-反转"结构制造惊喜',
          ],
        },
        coolpoint_rushed: {
          diagnosis: '爽点铺垫不足',
          symptoms: [],
          solutions: [
            '爽点要有"压抑-爆发"过程，不能太突然',
            '先让读者感受到压抑/不公/困境',
            '爆发时要有足够的笔墨渲染',
          ],
        },
        coolpoint_repetitive: {
          diagnosis: '爽点类型重复',
          symptoms: [],
          solutions: [
            '检查近5章是否使用了相同的爽点类型',
            '轮换使用：打脸、逆袭、获宝、扮猪吃虎、智斗',
            '每种爽点间隔至少3章再用',
          ],
        },
      },
    },
    pacing_issue: {
      subtypes: {
        opening_weak: {
          diagnosis: '开篇吸引力不足',
          symptoms: [],
          solutions: [
            '开篇第一句必须有钩子：悬念/冲突/意外',
            '避免从"天气很好"或"人物介绍"开始',
            '用"倒叙"或"中途切入"增加张力',
          ],
          opening_types: {
            '悬念式': '用未解之谜开场',
            '冲突式': '直接进入矛盾冲突',
            '反转式': '先给出意外信息再解释',
          },
        },
        middle_sagging: {
          diagnosis: '中段疲软',
          symptoms: [],
          solutions: [
            '每500字必须有一个小转折或新信息',
            '用子目标分解主线，让读者有阶段性成就感',
            '插入意外事件打断平淡',
          ],
        },
        ending_rushed: {
          diagnosis: '结尾仓促',
          symptoms: [],
          solutions: [
            '高潮后留出200-300字收尾空间',
            '结尾必须有钩子：悬念/预告/情绪余韵',
            '避免用"就这样"式的硬着陆结尾',
          ],
        },
      },
    },
    emotion_low: {
      subtypes: {
        emotion_monotone: {
          diagnosis: '情绪单调',
          symptoms: [],
          solutions: [
            '情绪曲线要有起伏：不能一直是兴奋或一直是平静',
            '用"对比"制造情绪张力：期待vs失望、希望vs绝望',
            '每个场景确定一个主情绪，其他情绪为辅',
          ],
        },
        emotion_inauthentic: {
          diagnosis: '情绪不真实',
          symptoms: [],
          solutions: [
            '情绪反应要符合人物性格',
            '用具体细节代替笼统的情绪词',
            '避免"他非常愤怒"这种直接告知，用行动展示',
          ],
        },
      },
    },
    foreshadowing_issue: {
      subtypes: {
        foreshadowing_forgotten: {
          diagnosis: '伏笔遗忘',
          symptoms: [],
          solutions: [
            '在伏笔表中标注提醒章节',
            '每隔5章检查一次待回收伏笔',
            '重要伏笔在回收前2-3章再次提及',
          ],
        },
        foreshadowing_rushed: {
          diagnosis: '伏笔回收仓促',
          symptoms: [],
          solutions: [
            '回收伏笔时要有铺垫，不能太突然',
            '回收方式要有惊喜感，最好超出读者预期',
            '一个伏笔回收至少用200字来展开',
          ],
        },
      },
    },
  },

  // 题材特定建议
  GENRE_ADVICE: {
    '玄幻': { focus: ['爽点密度', '等级体系', '功法设定'], pacing: '快节奏，每章都有进展', coolpoint_types: ['逆袭', '获宝', '扮猪吃虎', '打脸'], common_pitfalls: ['等级混乱', '功法重复', '反派智商掉线'] },
    '都市': { focus: ['生活细节', '人物关系', '情感变化'], pacing: '中等节奏，张弛有度', coolpoint_types: ['打脸', '逆袭', '智斗', '事业突破'], common_pitfalls: ['脱离现实', '人物脸谱化', '感情线混乱'] },
    '言情': { focus: ['情感描写', '人物互动', '心理活动'], pacing: '慢节奏，注重细节', coolpoint_types: ['心动时刻', '误会解除', '告白', '保护'], common_pitfalls: ['过度纠结', '角色降智', '狗血情节'] },
    '科幻': { focus: ['设定严谨', '逻辑自洽', '细节真实'], pacing: '中等节奏，层层递进', coolpoint_types: ['科技突破', '发现真相', '逆转局势'], common_pitfalls: ['设定冲突', '硬伤', '人物工具化'] },
    '历史': { focus: ['历史细节', '权谋策略', '人物群像'], pacing: '慢节奏，厚重感', coolpoint_types: ['智斗', '翻盘', '成就大事'], common_pitfalls: ['历史错误', '人物扁平', '权谋幼稚'] },
  },

  // 获取专家建议
  getAdvice(issueType, context){
    const knowledge = this.KNOWLEDGE_BASE[issueType];
    if(!knowledge){
      return { found: false, message: `未找到问题类型「${issueType}」的专家知识` };
    }

    const subtypes = knowledge.subtypes || {};
    const allSolutions = {};
    const allDiagnoses = [];

    for(const [subtypeName, subtype] of Object.entries(subtypes)){
      allDiagnoses.push({
        type: subtypeName,
        diagnosis: subtype.diagnosis || '',
        symptoms: subtype.symptoms || [],
      });
      allSolutions[subtypeName] = subtype.solutions || [];
    }

    // 匹配子类型
    let matchedSubtype = null;
    if(context?.symptoms?.length > 0){
      matchedSubtype = this.matchSubtype(context.symptoms, subtypes);
    }

    // 题材建议
    let genreAdvice = null;
    if(context?.genre){
      genreAdvice = this.GENRE_ADVICE[context.genre] || null;
    }

    return {
      found: true,
      issue_type: issueType,
      diagnoses: allDiagnoses,
      solutions: allSolutions,
      matched_subtype: matchedSubtype,
      matched_solutions: matchedSubtype ? (allSolutions[matchedSubtype] || []) : [],
      genre_advice: genreAdvice,
    };
  },

  // 根据症状匹配子类型
  matchSubtype(symptoms, subtypes){
    let bestMatch = null, bestScore = 0;
    for(const [name, subtype] of Object.entries(subtypes)){
      const subtypeSymptoms = subtype.symptoms || [];
      const score = symptoms.filter(s => subtypeSymptoms.includes(s)).length;
      if(score > bestScore){ bestScore = score; bestMatch = name; }
    }
    return bestMatch;
  },

  // 生成改进指令
  generateDirective(issueType, subtype, context){
    const knowledge = this.KNOWLEDGE_BASE[issueType]?.subtypes?.[subtype];
    if(!knowledge) return '';

    const diagnosis = knowledge.diagnosis || '';
    const solutions = knowledge.solutions || [];
    const selectedSolutions = solutions.slice(0, 3);

    let directive = `【问题诊断】${diagnosis}。\n【改进建议】\n`;
    selectedSolutions.forEach((s, i) => { directive += `${i + 1}. ${s}\n`; });
    if(knowledge.example_fix) directive += `【示例】${knowledge.example_fix}`;

    return directive;
  },

  // 获取题材特定建议
  getGenreAdvice(genre){
    return this.GENRE_ADVICE[genre] || null;
  },

  // 获取开篇类型建议
  getOpeningAdvice(type){
    const openings = this.KNOWLEDGE_BASE.pacing_issue?.subtypes?.opening_weak?.opening_types || {};
    return openings[type] || '';
  },

  // 检查是否为常见陷阱
  checkPitfall(genre, issue){
    const pitfalls = this.GENRE_ADVICE[genre]?.common_pitfalls || [];
    return pitfalls.includes(issue);
  },
};

// ============================================================
// WritingStrategyAgent - 写作策略Agent
// 对标参考项目 WritingStrategyAgent.php
// 根据小说特征和历史数据动态调整写作策略
// 决策内容：字数目标调整、爽点密度调整、节奏控制策略、伏笔策略
// ============================================================
const WritingStrategyAgent = {

  // 题材特征配置
  GENRE_CONFIGS: {
    '玄幻': { coolpoint_density: 1.2, pacing: 'fast' },
    '都市': { coolpoint_density: 1.0, pacing: 'medium' },
    '言情': { coolpoint_density: 0.8, pacing: 'slow' },
    '科幻': { coolpoint_density: 1.0, pacing: 'medium' },
    '历史': { coolpoint_density: 0.9, pacing: 'slow' },
  },

  // 决策入口
  decide(novel, chapIdx, context){
    const factors = this.collectDecisionFactors(novel, chapIdx, context);

    // 自适应权重（来自 AdaptiveDecisionEngine）
    let adaptiveWeight = 1.0;
    try{
      adaptiveWeight = AdaptiveDecisionEngine.getAdaptiveWeight(novel, 'strategy');
    }catch(e){ /* AdaptiveDecisionEngine 未加载时用默认值 */ }
    factors.adaptive_weight = adaptiveWeight;

    // 趋势预测
    let predictions = [];
    try{
      predictions = AdaptiveDecisionEngine.predictIssues(novel, chapIdx);
      factors.predictions = predictions;
    }catch(e){ /* 降级 */ }

    const analysis = this.analyzeCurrentState(factors);
    let decisions = this.generateDecisions(analysis, factors);
    decisions = this.applyAdaptiveWeight(decisions, adaptiveWeight);

    return {
      success: true,
      decisions,
      analysis,
      predictions,
      adaptive_weight: adaptiveWeight,
    };
  },

  // 应用自适应权重调整决策强度
  applyAdaptiveWeight(decisions, weight){
    if(weight < 0.7 && decisions.coolpoint_density_adjustment){
      decisions.coolpoint_density_adjustment.reason += '（历史指令效果一般，谨慎调整）';
    }
    if(weight > 1.2 && decisions.reasoning){
      decisions.reasoning = decisions.reasoning.map(r => r + '，历史指令效果良好');
    }
    return decisions;
  },

  // 收集决策因素
  collectDecisionFactors(novel, chapIdx, context){
    const genre = novel.genre || '玄幻';
    const targetChapters = novel.chapterCount || 100;
    const currentChapter = chapIdx + 1;
    const progress = targetChapters > 0 ? currentChapter / targetChapters : 0;

    // 平均质量分（近10章）
    const recentChapters = (novel.chapters || []).slice(-10);
    const qualityScores = recentChapters.filter(c => c?.score?.overall).map(c => c.score.overall);
    const avgQuality = qualityScores.length > 0
      ? Math.round(qualityScores.reduce((a, b) => a + b, 0) / qualityScores.length)
      : 75;

    // 字数准确率
    const wordAccuracy = this.getRecentWordAccuracy(novel);

    // 爽点密度
    const coolpointDensity = this.getRecentCoolPointDensity(novel, chapIdx);

    // 指令效果
    let directiveEffectiveness = { by_type: {}, overall_effectiveness: 0.5 };
    try{
      const stats = AgentDirectives.getOutcomeStats(novel);
      if(stats){
        let totalOutcomes = 0, totalImproved = 0;
        for(const [type, data] of Object.entries(stats)){
          directiveEffectiveness.by_type[type] = {
            avg_change: data.avgChange,
            effectiveness_rate: data.effectiveness,
            total: data.count,
          };
          totalOutcomes += data.count;
          totalImproved += data.improved;
        }
        directiveEffectiveness.overall_effectiveness = totalOutcomes > 0 ? totalImproved / totalOutcomes : 0.5;
      }
    }catch(e){ /* 降级 */ }

    return {
      genre,
      progress,
      avg_quality_score: avgQuality,
      recent_word_accuracy: wordAccuracy,
      recent_coolpoint_density: coolpointDensity,
      pending_foreshadowing: context?.pending_foreshadowing_count || 0,
      current_chapter: currentChapter,
      directive_effectiveness: directiveEffectiveness,
    };
  },

  // 分析当前状态（SWOT 分析）
  analyzeCurrentState(factors){
    const analysis = { strengths: [], weaknesses: [], opportunities: [], threats: [], recommendations: [] };

    if(factors.avg_quality_score >= 80){
      analysis.strengths.push('质量评分优秀');
    } else if(factors.avg_quality_score < 60){
      analysis.weaknesses.push('质量评分偏低');
      analysis.recommendations.push('建议启用严格质量检查');
    }

    if(factors.recent_word_accuracy >= 0.9){
      analysis.strengths.push('字数控制准确');
    } else if(factors.recent_word_accuracy < 0.7){
      analysis.weaknesses.push('字数控制不佳');
      analysis.recommendations.push('建议调整字数容差');
    }

    const targetDensity = this.getTargetCoolPointDensity(factors.genre);
    if(factors.recent_coolpoint_density < targetDensity * 0.8){
      analysis.opportunities.push('爽点密度可提升');
      analysis.recommendations.push('建议增加爽点密度');
    }

    if(factors.progress > 0.8){
      analysis.threats.push('接近完结，需回收伏笔');
    } else if(factors.progress < 0.2){
      analysis.opportunities.push('开篇阶段，可大胆铺垫');
    }

    if(factors.pending_foreshadowing > 10){
      analysis.threats.push('伏笔堆积过多');
      analysis.recommendations.push('建议规划伏笔回收');
    }

    return analysis;
  },

  // 生成决策建议
  generateDecisions(analysis, factors){
    const decisions = {
      word_count_adjustment: null,
      coolpoint_density_adjustment: null,
      pacing_strategy: null,
      foreshadowing_strategy: null,
      reasoning: [],
    };

    const dirEff = factors.directive_effectiveness || {};
    const strategyEff = dirEff.by_type?.strategy?.effectiveness_rate ?? 0.5;
    const adjustmentFactor = strategyEff < 0.4 ? 0.5 : (strategyEff < 0.6 ? 0.75 : 1.0);

    // 字数调整
    if(analysis.weaknesses.includes('字数控制不佳')){
      decisions.word_count_adjustment = {
        action: 'increase_tolerance',
        value: Math.round(0.15 * adjustmentFactor * 1000) / 1000,
        reason: strategyEff < 0.4 ? '上次字数指令效果差，减少调整幅度' : '字数控制不佳，增加容差范围',
      };
      decisions.reasoning.push('字数准确率低于70%' + (strategyEff < 0.4 ? '，但历史指令效果差，谨慎调整' : ''));
    }

    // 爽点密度调整
    for(const opp of analysis.opportunities){
      if(opp.includes('爽点密度可提升')){
        const targetDensity = this.getTargetCoolPointDensity(factors.genre);
        const qualityEff = dirEff.by_type?.quality?.effectiveness_rate ?? 0.5;
        const densityFactor = qualityEff < 0.4 ? 0.8 : 1.2;
        decisions.coolpoint_density_adjustment = {
          action: 'increase_density',
          value: Math.round(targetDensity * densityFactor * 100) / 100,
          reason: densityFactor < 1 ? '上次爽点指令效果差，降低提升幅度' : '爽点密度低于目标，建议提升20%',
        };
        decisions.reasoning.push(densityFactor < 1 ? '当前爽点密度不足，但历史指令效果差，谨慎增强' : '当前爽点密度不足，需要增强');
        break;
      }
    }

    // 节奏策略
    if(factors.progress > 0.8){
      decisions.pacing_strategy = { action: 'accelerate', reason: '接近完结，加快节奏' };
      decisions.reasoning.push('进度超过80%，进入收尾阶段');
    } else if(factors.progress < 0.2){
      decisions.pacing_strategy = { action: 'steady', reason: '开篇阶段，稳步推进' };
    }

    // 伏笔策略
    if(factors.pending_foreshadowing > 10){
      decisions.foreshadowing_strategy = {
        action: 'prioritize_resolution',
        value: Math.min(3, factors.pending_foreshadowing - 5),
        reason: '伏笔堆积，优先回收',
      };
      decisions.reasoning.push(`待回收伏笔${factors.pending_foreshadowing}个，需要优先处理`);
    }

    return decisions;
  },

  // 执行决策 — 将决策转为 AgentDirectives 指令
  execute(novel, chapIdx, decisions){
    const results = {};
    const nextChap = chapIdx + 1;

    if(decisions.word_count_adjustment){
      results.word_count_adjustment = this.executeWordCountAdjustment(novel, nextChap, decisions.word_count_adjustment);
    }
    if(decisions.coolpoint_density_adjustment){
      results.coolpoint_density_adjustment = this.executeCoolPointAdjustment(novel, nextChap, decisions.coolpoint_density_adjustment);
    }
    if(decisions.pacing_strategy){
      results.pacing_strategy = this.executePacingStrategy(novel, nextChap, decisions.pacing_strategy);
    }
    if(decisions.foreshadowing_strategy){
      results.foreshadowing_strategy = this.executeForeshadowingStrategy(novel, nextChap, decisions.foreshadowing_strategy);
    }

    return results;
  },

  // 执行字数调整
  executeWordCountAdjustment(novel, nextChap, decision){
    const directive = decision.value > 0.12
      ? '本章字数要求放宽：允许±15%的字数波动，内容完整性优先于精确字数。宁可多写200字保证高潮段完整性，也不要为了凑字数硬删内容。'
      : '本章字数要求收紧：严格控制在目标字数±8%以内。开头快速入戏，中间不拖沓，80%字数时必须进入收尾。宁可精简描写也要控制总字数。';
    AgentDirectives.add(novel, nextChap, 'strategy', directive, 3, 'WritingStrategyAgent');
    return { action: 'adjust_word_tolerance', status: 'success', message: '字数策略已注入指令' };
  },

  // 执行爽点密度调整
  executeCoolPointAdjustment(novel, nextChap, decision){
    const directive = `爽点密度调整：目标${decision.value}。本章必须安排至少1个核心爽点，优先选择「逆袭」「打脸」「获宝」类型。爽点要埋在章节中后段，铺垫不超过30%，高潮段要有情绪爆发力。`;
    AgentDirectives.add(novel, nextChap, 'strategy', directive, 3, 'WritingStrategyAgent');
    return { action: 'adjust_coolpoint_density', status: 'success', message: `爽点密度已调整至${decision.value}` };
  },

  // 执行节奏策略
  executePacingStrategy(novel, nextChap, decision){
    const pacingDirectives = {
      accelerate: '本章节奏加速：缩短铺垫段（≤15%），加长高潮段（≥40%）。减少环境描写和内心独白，用短句快速推进剧情。对话节奏紧凑，一问一答不超过3轮就要触发事件。收尾钩子必须是强悬念或危机爆发。',
      decelerate: '本章节奏放缓：铺垫段可占25%，增加角色内心描写和环境氛围渲染。对话中穿插回忆或情感流露。高潮段可以用慢镜头方式展开，放大情绪张力。但结尾仍需悬念。',
      steady: '本章保持稳定节奏：严格按照四段式比例推进，铺垫20%、发展30%、高潮35%、钩子15%。对话与动作交替，张弛有度。',
      intensify: '本章增强冲突强度：每个场景都必须包含至少一个冲突或对抗。对话中必须有立场对立或信息不对等。高潮段要达到情绪顶点，制造"不得不继续读"的冲动。',
      prioritize_resolution: '本章优先回收伏笔：在发展段和高潮段穿插伏笔回收，每个伏笔回收必须带来新的信息或反转。回收伏笔的同时推进主线，不要变成纯解释性段落。',
    };
    const directive = pacingDirectives[decision.action] || `本章节奏调整为${decision.action}。${decision.reason}`;
    AgentDirectives.add(novel, nextChap, 'strategy', directive, 3, 'WritingStrategyAgent');
    return { action: 'adjust_pacing', status: 'success', message: `节奏策略已注入指令: ${decision.action}` };
  },

  // 执行伏笔策略
  executeForeshadowingStrategy(novel, nextChap, decision){
    const directive = `伏笔回收指令：${decision.reason}。本章必须在发展段或高潮段回收至少${decision.value}个旧伏笔。回收方式：通过剧情推进自然揭示，或角色互动中意外触发。禁止用旁白式「原来如此」硬解释。`;
    AgentDirectives.add(novel, nextChap, 'strategy', directive, 3, 'WritingStrategyAgent');
    return { action: 'foreshadowing_strategy', status: 'success', message: `伏笔策略已执行: ${decision.action}` };
  },

  // ===== 辅助方法 =====

  getRecentWordAccuracy(novel){
    const recent = (novel.chapters || []).slice(-10).filter(c => c?.content && c?.targetWordCount);
    if(recent.length === 0) return 1.0;
    let accurate = 0;
    for(const ch of recent){
      const target = ch.targetWordCount;
      const actual = ch.content.length;
      if(Math.abs(actual - target) <= target * 0.1) accurate++;
    }
    return accurate / recent.length;
  },

  getRecentCoolPointDensity(novel, chapIdx){
    const recent = (novel.chapters || []).slice(Math.max(0, chapIdx - 20), chapIdx);
    if(recent.length === 0) return 1.0;
    const withCoolPoint = recent.filter(c => c?.score?.scores?.engagement > 50).length;
    return withCoolPoint / recent.length;
  },

  getTargetCoolPointDensity(genre){
    return this.GENRE_CONFIGS[genre]?.coolpoint_density ?? 1.0;
  },

  // ===== v4 计划补全方法 =====

  // 获取指令效果 — 对标 Reference-php WritingStrategyAgent.getDirectiveEffectiveness()
  // 评估历史指令的效果，用于自适应权重调整
  getDirectiveEffectiveness(novel, directiveType){
    if(!novel?.memory?.directives || novel.memory.directives.length === 0){
      return { total: 0, effective: 0, rate: 0, avgDelta: 0 };
    }
    // 筛选指定类型的指令
    const typed = directiveType
      ? novel.memory.directives.filter(d => d.type === directiveType)
      : novel.memory.directives;
    if(typed.length === 0){
      return { total: 0, effective: 0, rate: 0, avgDelta: 0 };
    }
    // 统计有结果的指令
    const withOutcomes = typed.filter(d => d.outcomes && d.outcomes.length > 0);
    const effective = withOutcomes.filter(d => {
      const avgDelta = d.outcomes.reduce((s, o) => s + (o.delta || 0), 0) / d.outcomes.length;
      return avgDelta > 0;
    });
    const allDeltas = withOutcomes.flatMap(d => d.outcomes.map(o => o.delta || 0));
    const avgDelta = allDeltas.length > 0 ? allDeltas.reduce((a, b) => a + b, 0) / allDeltas.length : 0;
    return {
      total: typed.length,
      effective: effective.length,
      rate: typed.length > 0 ? Math.round(effective.length / typed.length * 100) : 0,
      avgDelta: Math.round(avgDelta * 10) / 10,
    };
  },
};

window.AgentDirectives = AgentDirectives;
window.StyleGuard = StyleGuard;
window.DialogueVoiceChecker = DialogueVoiceChecker;
window.CriticAgent = CriticAgent;
window.AgentCoordinator = AgentCoordinator;
window.RewriteAgent = RewriteAgent;
window.IterativeRefinementController = IterativeRefinementController;
window.QualityMonitorAgent = QualityMonitorAgent;
window.OptimizationAgent = OptimizationAgent;
window.WritingExpertise = WritingExpertise;
window.WritingStrategyAgent = WritingStrategyAgent;
