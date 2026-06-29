/* ============================================================
 * QualityGuard - 质量守卫与反馈闭环
 *
 * 设计理念（对标参考项目 PostWriteValidator.php + OutlineQualityGuard.php）：
 *   落盘前做硬约束校验（P0/P1），落盘后做软检测和质量评分。
 *   质量问题转化为下一章改进指令，形成反馈闭环。
 *
 * 校验层级：
 *   P0（阻断级）：字数严重不足、正文为空、包含元信息穿帮
 *   P1（警告级）：字数偏差、缺少对话、缺少场景描写、结尾无钩子
 *   P2（建议级）：节奏过快/过慢、伏笔未提及、人物未出场
 *
 * 评分维度（对标五关质检）：
 *   结构、人物、描写、连贯性、爽感
 * ============================================================ */

const QualityGuard = {

  // ============================================================
  // 章节类型检测 — 对标 ChapterTypeDetector
  // 6类关键词打分法 + 置信度计算 + 比例混合
  // ============================================================

  // 6种章节类型的关键词库
  CHAPTER_TYPE_KEYWORDS: {
    combat:       { label:'战斗章', keywords:['战','打','斗','杀','剑','刀','斩','轰','碎','灭','攻','防','冲','击','拳','掌','法术','阵法'], ratios:{setup:10,rising:20,climax:55,hook:15} },
    strategy:     { label:'谋略章', keywords:['计','谋','策','局','布局','阴谋','谈判','密谈','算计','陷阱','伏击','离间','反间','将计就计'], ratios:{setup:15,rising:40,climax:30,hook:15} },
    cultivation:  { label:'修炼章', keywords:['修炼','闭关','突破','炼丹','经脉','丹田','功法','境界','悟道','参悟','筑基','金丹','元婴'], ratios:{setup:20,rising:30,climax:35,hook:15} },
    daily:        { label:'日常章', keywords:['日常','休整','闲聊','逛街','宴','温馨','聚会','茶馆','酒楼','集市','休息','聊天'], ratios:{setup:25,rising:35,climax:25,hook:15} },
    revelation:   { label:'揭秘章', keywords:['真相','揭秘','发现','秘密','身世','传承','遗迹','古卷','密室','档案','记录','证据'], ratios:{setup:15,rising:25,climax:45,hook:15} },
    travel:       { label:'旅途章', keywords:['赶','出发','旅途','森林','山脉','抵达','启程','路途','跋涉','穿行','航行','骑马'], ratios:{setup:30,rising:30,climax:25,hook:15} },
  },

  detectChapterType(novel, chapIdx){
    const progress = (chapIdx + 1) / novel.chapterCount;
    const outline = novel.outline?.[chapIdx];
    const outlineText = (outline?.summary || '') + ' ' + (outline?.title || '');

    // 结尾阶段直接返回
    if(progress >= 0.9) return { type:'finale', confidence:1.0, label:'收尾章' };

    // 关键词打分
    const scores = {};
    let totalScore = 0;
    for(const [type, config] of Object.entries(this.CHAPTER_TYPE_KEYWORDS)){
      let count = 0;
      for(const kw of config.keywords){
        if(outlineText.includes(kw)) count++;
      }
      scores[type] = count;
      totalScore += count;
    }

    // 无命中 → 常规章
    if(totalScore === 0){
      // 根据进度推断
      if(progress <= 0.15) return { type:'opening', confidence:0.5, label:'开篇章' };
      if(progress >= 0.7) return { type:'lateDevelopment', confidence:0.5, label:'后期发展章' };
      return { type:'development', confidence:0.3, label:'常规章' };
    }

    // 取最高分类型
    const sorted = Object.entries(scores).sort((a,b) => b[1] - a[1]);
    const topType = sorted[0][0];
    const topScore = sorted[0][1];
    const confidence = topScore / totalScore;

    // confidence < 0.35 → 常规章
    if(confidence < 0.35){
      if(progress <= 0.15) return { type:'opening', confidence:0.5, label:'开篇章' };
      return { type:'development', confidence:0.3, label:'常规章' };
    }

    return {
      type: topType,
      confidence,
      label: this.CHAPTER_TYPE_KEYWORDS[topType].label,
      ratios: this.CHAPTER_TYPE_KEYWORDS[topType].ratios,
    };
  },

  // 根据章节类型获取节奏参数
  getRhythmParams(chapterType){
    const params = {
      opening:         { tempBoost: 0.05, paceHint: '适中偏快，迅速建立代入感' },
      development:     { tempBoost: 0,    paceHint: '稳步推进，每章一个事件' },
      combat:          { tempBoost: 0.1,  paceHint: '战斗节奏紧凑，动作描写密集' },
      strategy:        { tempBoost: 0.05, paceHint: '谋略章节奏沉稳，重在布局和反转' },
      cultivation:     { tempBoost: 0,    paceHint: '修炼章节奏舒缓，重在感悟和突破' },
      daily:           { tempBoost: -0.05,paceHint: '日常章节奏轻松，调节整体节奏' },
      revelation:      { tempBoost: 0.1,  paceHint: '揭秘章节奏由缓到急，真相揭露时爆发' },
      travel:          { tempBoost: 0,    paceHint: '旅途章节奏平稳，重在见闻和过渡' },
      lateDevelopment: { tempBoost: 0.05, paceHint: '冲突升级，为高潮蓄势' },
      climax:          { tempBoost: 0.1,  paceHint: '最高节奏，全力爆发' },
      finale:          { tempBoost: -0.05,paceHint: '回收伏笔，节奏由急转缓' },
    };
    return params[chapterType] || params.development;
  },

  // ============================================================
  // 节奏调整器 — 对标 rhythm_adjuster.php
  // 五阶段定义 + 爽点密度反馈 + 四段式节奏比例
  // ============================================================

  // 五阶段定义（基于全书进度百分比）
  RHYTHM_STAGES: {
    setup:   { range:[0, 0.2],   tension:4, ratios:{setup:30,rising:30,climax:25,hook:15}, coolPointEvery:5 },
    rising:  { range:[0.2, 0.5], tension:6, ratios:{setup:20,rising:35,climax:30,hook:15}, coolPointEvery:5 },
    climax:  { range:[0.5, 0.8], tension:8, ratios:{setup:15,rising:30,climax:40,hook:15}, coolPointEvery:3 },
    resolve: { range:[0.8, 0.95],tension:7, ratios:{setup:10,rising:25,climax:50,hook:15}, coolPointEvery:1 },
    ending:  { range:[0.95, 1],  tension:9, ratios:{setup:5,rising:20,climax:60,hook:15}, coolPointEvery:1 },
  },

  // 计算节奏参数
  calculateRhythm(novel, chapIdx){
    const progress = (chapIdx + 1) / novel.chapterCount;

    // 1. 阶段判定
    let stage = 'setup';
    for(const [name, config] of Object.entries(this.RHYTHM_STAGES)){
      if(progress >= config.range[0] && progress < config.range[1]){
        stage = name;
        break;
      }
    }
    if(progress >= 1) stage = 'ending';

    const stageConfig = this.RHYTHM_STAGES[stage];
    let tension = stageConfig.tension;
    let ratios = { ...stageConfig.ratios };

    // 2. 爽点密度反馈
    let coolPointStatus = 'normal';
    if(novel.chapters && novel.chapters.length >= 5){
      const recentChapters = novel.chapters.slice(Math.max(0, chapIdx - 5), chapIdx);
      const scoredChapters = recentChapters.filter(c => c.score);
      if(scoredChapters.length >= 3){
        const avgEngagement = scoredChapters.reduce((sum, c) =>
          sum + (c.score.scores?.engagement || 0), 0) / scoredChapters.length;
        const targetDensity = 50;

        if(avgEngagement < targetDensity * 0.6){
          // 爽点饥饿：强制安排爽点
          coolPointStatus = 'starved';
          tension = Math.min(10, tension + 1);
          ratios.climax = Math.min(60, ratios.climax + 5);
        } else if(avgEngagement > targetDensity * 1.5){
          // 爽点过密：建议过渡章
          coolPointStatus = 'oversaturated';
          tension = Math.max(1, tension - 1);
          ratios.setup = Math.min(40, ratios.setup + 5);
        }
      }
    }

    // 3. 章节类型比例混合
    const typeInfo = this.detectChapterType(novel, chapIdx);
    if(typeInfo.ratios && typeInfo.confidence >= 0.35){
      const blend = Math.min(0.6, typeInfo.confidence);
      for(const phase of ['setup', 'rising', 'climax', 'hook']){
        ratios[phase] = Math.round(
          ratios[phase] * (1 - blend) + typeInfo.ratios[phase] * blend
        );
      }
    }

    // 4. 生成节奏指令文本
    const stageNames = {
      setup: '铺垫期', rising: '发展期', climax: '高潮期', resolve: '收束期', ending: '结局期',
    };
    const instructions = [];
    instructions.push(`【节奏指令】当前处于${stageNames[stage]}（进度${Math.round(progress*100)}%），张力${tension}/10`);
    instructions.push(`段落比例：铺垫${ratios.setup}%/发展${ratios.rising}%/高潮${ratios.climax}%/钩子${ratios.hook}%`);
    if(coolPointStatus === 'starved'){
      instructions.push('【爽点预警】近几章爽感不足，本章必须安排一个明确的爽点（突破/反转/打脸）');
    } else if(coolPointStatus === 'oversaturated'){
      instructions.push('【节奏调节】近期爽点过密，本章适当放缓节奏，做铺垫和过渡');
    }
    if(stageConfig.coolPointEvery <= 3 && (chapIdx + 1) % stageConfig.coolPointEvery === 0){
      instructions.push('【爽点排期】本章应安排爽点事件');
    }

    return {
      stage,
      stageName: stageNames[stage],
      tension,
      ratios,
      coolPointStatus,
      instructions: instructions.join('\n'),
    };
  },

  // ============================================================
  // 大纲校验 — 对标 OutlineQualityGuard
  // 保留方法名兼容旧调用，实际委托给 validateOutlineWithRepair
  // ============================================================
  validateOutline(novel, outline){
    return this.validateOutlineWithRepair(novel, outline);
  },

  // ============================================================
  // 大纲质量守护（带修复建议）— 对标 OutlineQualityGuard 增强
  // 在基础校验上增加：情节相似度、钩子承接、弱推进检测
  // ============================================================
  validateOutlineWithRepair(novel, outline){
    const errors = [];   // P0
    const warnings = []; // P1
    const repairSuggestions = [];

    // P0：章节数量必须匹配
    if(outline.length !== novel.chapterCount){
      errors.push(`大纲章节数(${outline.length})与设定(${novel.chapterCount})不匹配`);
    }

    // P0：每章必须有标题和概要
    for(let i = 0; i < outline.length; i++){
      if(!outline[i].title || outline[i].title.trim() === ''){
        errors.push(`第${i+1}章缺少标题`);
      }
      if(!outline[i].summary || outline[i].summary.trim() === ''){
        errors.push(`第${i+1}章缺少剧情概要`);
      }
    }

    // P1：最后一章应包含结局元素
    if(outline.length > 0){
      const lastChap = outline[outline.length - 1];
      const lastText = (lastChap.title + lastChap.summary).toLowerCase();
      const endingKeywords = ['结局', '终', '完结', '最后', '真相', '收束', '落幕'];
      const hasEnding = endingKeywords.some(kw => lastText.includes(kw));
      if(!hasEnding){
        warnings.push('最后一章缺少结局元素，建议强化收尾');
      }
    }

    // P1：检查钩子覆盖率
    let hookCount = 0;
    for(const o of outline){
      if(o.endHook) hookCount++;
    }
    const hookRate = outline.length > 0 ? hookCount / outline.length : 0;
    if(hookRate < 0.5){
      warnings.push(`结尾钩子覆盖率仅${Math.round(hookRate*100)}%，建议每章都有钩子`);
    }

    // 情节相似度检测：3-gram shingle Jaccard，阈值 0.56
    // 为什么用 0.56：参考项目经验值，高于此值通常意味着情节雷同
    const SIM_THRESHOLD = 0.56;
    for(let i = 0; i < outline.length; i++){
      for(let j = i + 1; j < outline.length; j++){
        const text1 = (outline[i].summary || '') + (outline[i].title || '');
        const text2 = (outline[j].summary || '') + (outline[j].title || '');
        const sim = this.shingleJaccard(text1, text2, 3);
        if(sim >= SIM_THRESHOLD){
          warnings.push(`第${i+1}章与第${j+1}章情节相似度过高(${Math.round(sim*100)}%)，可能重复`);
          repairSuggestions.push(`第${i+1}章与第${j+1}章情节重复，建议差异化：调整冲突焦点或场景`);
        }
      }
    }

    // 钩子未承接检测：每章开头应承接上章结尾钩子
    for(let i = 1; i < outline.length; i++){
      const prevHook = outline[i-1].endHook || '';
      const currStart = outline[i].summary || '';
      if(prevHook){
        const entities = this.extractKeyEntities(prevHook);
        if(entities.length > 0){
          const missing = entities.filter(e => !currStart.includes(e));
          if(missing.length > 0){
            warnings.push(`第${i+1}章开头未承接第${i}章结尾钩子（缺失：${missing.join('、')}）`);
            repairSuggestions.push(`第${i+1}章开头应承接上一章钩子"${prevHook}"，提及${missing.join('、')}`);
          }
        }
      }
    }

    // 弱推进检测：每章应有冲突结果或局面变化
    const progressKeywords = ['冲突', '对决', '战斗', '危机', '转折', '真相', '发现', '揭秘', '突破', '失败', '胜利', '改变', '变化', '升级', '降级', '失去', '获得', '暴露', '陨落', '觉醒'];
    for(let i = 0; i < outline.length; i++){
      const text = (outline[i].summary || '') + (outline[i].title || '');
      const hasProgress = progressKeywords.some(kw => text.includes(kw));
      if(!hasProgress){
        warnings.push(`第${i+1}章缺少冲突结果或局面变化，推进较弱`);
        repairSuggestions.push(`第${i+1}章建议增加明确的冲突结果或局面变化`);
      }
    }

    return {
      passed: errors.length === 0,
      errors,
      warnings,
      repairSuggestions,
    };
  },

  // ============================================================
  // 章节正文校验 — 对标 PostWriteValidator
  // P0 阻断 / P1 警告 / P2 建议
  // ============================================================
  validateChapter(novel, chapIdx, content){
    const errors = [];   // P0：阻断级
    const warnings = []; // P1：警告级
    const suggestions = []; // P2：建议级

    const targetWords = novel.wordCount || 1200;
    const actualWords = content.length;

    // P0：正文为空
    if(!content || content.trim().length < 50){
      errors.push('正文内容为空或过短');
      return { passed: false, errors, warnings, suggestions };
    }

    // P0：元信息穿帮（增强检测模式，覆盖更多变体）
    const metaPatterns = [
      /^第[一二三四五六七八九十百千零\d]+章/m,
      /^Chapter\s+\d+/im,
      /^#{1,6}\s/m,
      /【[^】]*】/,
      /^(以下是|这是|下面是|接下来是)[^\n]*正文/,
      /作为[^，。\n]{0,10}(?:AI|人工智能|语言模型)/i,
      /在第?\d+章中/,
      /如前所述/,
    ];
    for(const pattern of metaPatterns){
      if(pattern.test(content)){
        errors.push('正文包含元信息或格式标记，需清洗');
        break;
      }
    }

    // P0：死角色复活（复用因果链检查的 P0 违规）
    const causalViolations = this.checkCausalChain(novel, chapIdx, content);
    for(const v of causalViolations){
      if(v.severity === 'P0'){
        errors.push(v.message);
      }
    }

    // P1：字数偏差超过 50%
    if(actualWords < targetWords * 0.5){
      warnings.push(`字数严重不足：目标${targetWords}字，实际${actualWords}字`);
    } else if(actualWords < targetWords * 0.7){
      warnings.push(`字数偏少：目标${targetWords}字，实际${actualWords}字`);
    }

    // P1：缺少对话（正文无引号）
    const dialogueCount = (content.match(/["「『"]/g) || []).length;
    if(dialogueCount === 0 && actualWords > 500){
      warnings.push('本章缺少对话，建议增加角色互动');
    }

    // P1：结尾无钩子（最后一段过于平淡）
    const lastParagraph = content.split('\n').filter(p => p.trim()).pop() || '';
    const hookKeywords = ['？', '！', '...', '……', '突然', '然而', '但是', '就在这时', '却'];
    const hasHook = hookKeywords.some(kw => lastParagraph.includes(kw));
    if(!hasHook && chapIdx < novel.chapterCount - 1){
      suggestions.push('结尾缺少悬念钩子，建议强化');
    }

    // P1：场景断裂（复用因果链检查的 P1 违规）
    for(const v of causalViolations){
      if(v.severity === 'P1'){
        warnings.push(v.message);
      }
    }

    // P2：段落过少（可能缺乏场景描写）
    const paragraphCount = content.split('\n').filter(p => p.trim()).length;
    if(paragraphCount < 5 && actualWords > 800){
      suggestions.push('段落过少，建议增加场景描写和节奏变化');
    }

    return {
      passed: errors.length === 0,
      errors,
      warnings,
      suggestions,
    };
  },

  // ============================================================
  // 正文清洗 — 清理模型误输出的元信息
  // 保留方法名以兼容旧调用，实际委托给 enhancedCleanContent
  // ============================================================
  cleanContent(content){
    return this.enhancedCleanContent(content);
  },

  // ============================================================
  // 增强正文清洗 — 对标 PostWriteValidator 的清洗阶段
  // 覆盖更多穿帮模式，避免低质量元信息落盘
  // ============================================================
  enhancedCleanContent(content){
    if(!content) return '';
    let cleaned = content;

    // 移除"第X章"标题：兼容中文数字、阿拉伯数字、英文 Chapter
    cleaned = cleaned.replace(/^第[一二三四五六七八九十百千零\d]+章[^\n]*\n?/gm, '');
    cleaned = cleaned.replace(/^Chapter\s+\d+[^\n]*\n?/gim, '');

    // 移除 markdown 标题（# ~ ######）
    cleaned = cleaned.replace(/^#{1,6}\s+.+$/gm, '');

    // 移除"以下是正文"等元叙事引导句
    cleaned = cleaned.replace(/^(以下是|这是|下面是|接下来是|这是本章)[^\n]*正文[^\n]*\n?/gim, '');

    // 移除"作为AI/人工智能/语言模型"等身份声明
    cleaned = cleaned.replace(/作为[^，。\n]{0,10}(?:AI|人工智能|语言模型)[^\n]*[。.\n]?/gi, '');

    // 移除段落标记（如【段落1】【场景A】）
    cleaned = cleaned.replace(/【[^】]*】/g, '');

    // 移除章节坐标穿帮：模型误把章节序号写进正文
    cleaned = cleaned.replace(/在第?\d+章中[，,。]?/g, '');
    cleaned = cleaned.replace(/在第[一二三四五六七八九十百千]+章中[，,。]?/g, '');
    cleaned = cleaned.replace(/在上一章中[，,。]?/g, '');
    cleaned = cleaned.replace(/在前面的章节中[，,。]?/g, '');
    cleaned = cleaned.replace(/如前所述[，,。]?/g, '');
    cleaned = cleaned.replace(/前文提到[，,。]?/g, '');

    // 移除开头的空行
    cleaned = cleaned.replace(/^\n+/, '');

    // 移除结尾的多余空行，保留单个换行结尾
    cleaned = cleaned.replace(/\n+$/, '\n');

    return cleaned;
  },

  // ============================================================
  // 质量评分 — 对标五关质检
  // 维度：结构、人物、描写、连贯性、爽感
  // ============================================================
  scoreChapter(novel, chapIdx, content){
    const scores = {
      structure: 0,    // 结构完整性
      character: 0,    // 人物塑造
      description: 0,  // 场景描写
      coherence: 0,    // 连贯性
      engagement: 0,   // 爽感/吸引力
    };

    const targetWords = novel.wordCount || 1200;
    const actualWords = content.length;

    // 结构评分：字数达标度 + 段落结构
    const wordRatio = Math.min(actualWords / targetWords, 1.2);
    scores.structure = Math.round(wordRatio * 60);
    const paraCount = content.split('\n').filter(p => p.trim()).length;
    if(paraCount >= 8) scores.structure += 20;
    else if(paraCount >= 5) scores.structure += 10;
    if(content.length > 100) scores.structure += 20;
    scores.structure = Math.min(100, scores.structure);

    // 人物评分：对话量 + 角色名出现频率
    const dialogueCount = (content.match(/["「『"][^"」』]*["」』"]/g) || []).length;
    scores.character = Math.min(40, dialogueCount * 8);
    // 检查角色名出现
    if(novel.characters){
      const charNames = this.extractCharacterNames(novel.characters);
      let nameAppear = 0;
      for(const name of charNames){
        if(content.includes(name)) nameAppear++;
      }
      scores.character += Math.min(60, nameAppear * 20);
    }
    scores.character = Math.min(100, scores.character);

    // 描写评分：感官词汇 + 环境描写
    const senseWords = ['看到', '听到', '闻到', '感觉', '触', '光', '声', '味', '色', '热', '冷', '风', '光'];
    let senseCount = 0;
    for(const w of senseWords){ if(content.includes(w)) senseCount++; }
    scores.description = Math.min(100, senseCount * 15);

    // 连贯性评分：前后文衔接（简化版：检查过渡词）
    const transitionWords = ['于是', '然后', '接着', '随后', '然而', '但是', '因此', '所以', '突然', '这时'];
    let transCount = 0;
    for(const w of transitionWords){ if(content.includes(w)) transCount++; }
    scores.coherence = Math.min(100, 40 + transCount * 12);

    // 爽感评分：冲突 + 转折 + 钩子
    const engagementWords = ['爆发', '突破', '震惊', '不可思议', '竟然', '原来', '瞬间', '猛然', '终于', '决然'];
    let engageCount = 0;
    for(const w of engagementWords){ if(content.includes(w)) engageCount++; }
    scores.engagement = Math.min(100, 30 + engageCount * 14);

    // 综合分
    const overall = Math.round(
      (scores.structure + scores.character + scores.description + scores.coherence + scores.engagement) / 5
    );

    return { scores, overall };
  },

  // 从角色文本中提取角色名
  extractCharacterNames(charactersText){
    const names = [];
    const lines = charactersText.split('\n');
    for(const line of lines){
      const m = line.match(/^###\s*(.+?)(?:（.+）)?$/);
      if(m){
        const name = m[1].trim();
        if(name && name.length <= 10) names.push(name);
      }
    }
    return names;
  },

  // ============================================================
  // 文本相似度 — n-gram shingle Jaccard
  // 用于大纲情节重复检测，避免逐字比对的开销与噪声
  // ============================================================
  shingleJaccard(text1, text2, n = 3){
    if(!text1 || !text2) return 0;
    // 文本过短时 shingle 无统计意义，直接判 0
    if(text1.length < n || text2.length < n) return 0;

    const shingles1 = new Set();
    const shingles2 = new Set();

    for(let i = 0; i <= text1.length - n; i++){
      shingles1.add(text1.slice(i, i + n));
    }
    for(let i = 0; i <= text2.length - n; i++){
      shingles2.add(text2.slice(i, i + n));
    }

    if(shingles1.size === 0 || shingles2.size === 0) return 0;

    // 计算交集：遍历较小集合以降低复杂度
    let intersection = 0;
    const [smaller, larger] = shingles1.size <= shingles2.size
      ? [shingles1, shingles2]
      : [shingles2, shingles1];
    for(const s of smaller){
      if(larger.has(s)) intersection++;
    }

    const union = shingles1.size + shingles2.size - intersection;
    return union === 0 ? 0 : intersection / union;
  },

  // ============================================================
  // 关键实体抽取 — 用于钩子回收验证
  // 优先级：引号内容 > 角色名 > 名词性词语
  // 为什么不用 NLP：保持同步、零依赖，且钩子文本短，规则足够
  // ============================================================
  extractKeyEntities(text){
    if(!text) return [];
    const entities = [];
    const seen = new Set();

    const add = (e) => {
      e = (e || '').trim();
      // 过滤过短片段与标点残留
      if(e && e.length >= 2 && !seen.has(e)){
        seen.add(e);
        entities.push(e);
      }
    };

    // 言说/动作动词字符集：用于人名锚点与名词过滤，避免把动作误判为实体
    const verbChars = '说道问笑怒喊看想走来去站坐打踢跑跳扑抓握持拿放拔指举挥转抬低皱冷';

    // 优先：引号内的内容（往往是对白/关键称谓）
    const quoteRegex = /["「『“"]([^"」』”"]{2,20})["」』”"]/g;
    let qm;
    while((qm = quoteRegex.exec(text)) !== null){
      add(qm[1]);
    }

    // 其次：2-4字中文人名（后接言行动词，且名字本身不含动词字）
    // 为什么用负向前瞻：避免贪婪匹配把动词字吞进人名（如"林风说"误判为人名）
    const nameRegex = new RegExp(
      '((?![' + verbChars + '])[\\u4e00-\\u9fa5]){2,4}(?=转身|抬头|低头|皱眉|冷笑|[' + verbChars + '])',
      'g'
    );
    let nm;
    while((nm = nameRegex.exec(text)) !== null){
      add(nm[0]);
    }

    // 最后：兜底取前3个名词性词语（2字中文词，过滤含动词字的词）
    // 为什么用2字块：4字块过于具体（如"林风拔剑"），会导致钩子验证误判
    if(entities.length < 3){
      const nounRegex = /[\u4e00-\u9fa5]{2}/g;
      let nn;
      while((nn = nounRegex.exec(text)) !== null){
        if(entities.length >= 3) break;
        const word = nn[0];
        // 过滤含动词字符的词，保留名词性词语
        if(![...word].some(ch => verbChars.includes(ch))){
          add(word);
        }
      }
    }

    // 限制返回数量，避免钩子验证噪声
    return entities.slice(0, 5);
  },

  // ============================================================
  // 改进指令生成 — 对标 AgentDirectives
  // 质量问题转化为下一章自然语言指令
  // ============================================================
  generateDirectives(novel, chapIdx, validationResult, score){
    const directives = [];

    // 基于校验结果
    if(validationResult.warnings){
      for(const w of validationResult.warnings){
        // 字数不足
        if(w.includes('字数')){
          directives.push('本章字数需达标，适当扩展场景描写和对话');
        }
        // 缺少对话
        if(w.includes('对话')){
          directives.push('增加角色对话，通过对话推进剧情和展现人物性格');
        }
      }
    }

    if(validationResult.suggestions){
      for(const s of validationResult.suggestions){
        if(s.includes('钩子')){
          directives.push('结尾必须设置悬念钩子，激发读者追读欲');
        }
        if(s.includes('段落')){
          directives.push('增加场景描写，丰富段落层次');
        }
      }
    }

    // 基于评分
    if(score){
      if(score.scores.character < 50){
        directives.push('加强人物塑造，通过行动和对话展现角色性格');
      }
      if(score.scores.description < 40){
        directives.push('增加环境描写和感官细节，提升画面感');
      }
      if(score.scores.engagement < 50){
        directives.push('提升爽感密度，加入冲突、反转或意外元素');
      }
      if(score.scores.coherence < 50){
        directives.push('注意前后文衔接，使用过渡词保持叙事流畅');
      }
    }

    // 去重
    return [...new Set(directives)];
  },

  // ============================================================
  // 重写指令生成 — 评分低于阈值时生成具体重写指令
  // 与 generateDirectives 区别：本方法针对当前章节重写，而非下一章改进
  // ============================================================
  generateRewriteDirective(novel, chapIdx, score, validation){
    const directives = [];
    const overall = score?.overall ?? 0;
    const targetWords = novel.wordCount || 1200;

    // 评分 < 60：全面重写
    if(overall < 60){
      directives.push(`第${chapIdx+1}章质量评分${overall}分，低于60分阈值，建议全面重写`);
      directives.push('重写要求：');
      directives.push('- 重新构思本章核心冲突，确保有明确的起承转合');
      directives.push(`- 字数需达到目标${targetWords}字`);
      directives.push('- 至少包含3段对话，通过对话推进剧情');
      directives.push('- 结尾设置悬念钩子，承接下一章');
      directives.push('- 增加环境描写和感官细节，提升画面感');
    } else if(overall < 70){
      // 评分 60-70：定向改进
      directives.push(`第${chapIdx+1}章质量评分${overall}分，需定向改进`);

      if(score && score.scores){
        if(score.scores.structure < 60){
          directives.push(`- 结构评分${score.scores.structure}：优化段落结构，确保起承转合完整`);
        }
        if(score.scores.character < 60){
          directives.push(`- 人物评分${score.scores.character}：增加角色对话和行动描写`);
        }
        if(score.scores.description < 60){
          directives.push(`- 描写评分${score.scores.description}：补充环境、感官细节`);
        }
        if(score.scores.coherence < 60){
          directives.push(`- 连贯性评分${score.scores.coherence}：增加过渡词，强化前后衔接`);
        }
        if(score.scores.engagement < 60){
          directives.push(`- 爽感评分${score.scores.engagement}：加入冲突、反转或意外元素`);
        }
      }
    }

    // 基于校验错误补充修复指令（P0 阻断问题必须修复）
    if(validation && validation.errors){
      for(const e of validation.errors){
        directives.push(`- 修复阻断问题：${e}`);
      }
    }

    return directives;
  },

  // ============================================================
  // 钩子回收验证 — 对标 HookPayoffChecker
  // 验证本章开头是否兑现上一章结尾钩子，避免"挖坑不填"
  // ============================================================
  checkHookPayoff(novel, chapIdx, content){
    // 第一章无前置钩子，无法判定
    if(chapIdx <= 0) return { resolved: null };

    const prevOutline = novel.outline?.[chapIdx - 1];
    const hookText = prevOutline?.endHook || '';
    // 无钩子文本则无法判定
    if(!hookText) return { resolved: null };

    // 从钩子文本抽取关键实体
    const entities = this.extractKeyEntities(hookText);
    // 抽不出实体时无法判定，返回 null 表示"不确定"
    if(entities.length === 0) return { resolved: null };

    // 检查本章开头（前40%）是否提及这些实体
    const headLen = Math.max(200, Math.floor(content.length * 0.4));
    const head = content.slice(0, headLen);

    const missingEntities = entities.filter(e => !head.includes(e));

    return {
      resolved: missingEntities.length === 0,
      hookText,
      missingEntities,
    };
  },

  // ============================================================
  // 因果链检查 — 对标 PostWriteValidator 的连贯性硬约束
  // 检测死角色复活、场景断裂等破坏世界一致性的违规
  // ============================================================
  checkCausalChain(novel, chapIdx, content){
    const violations = [];

    // 死角色复活：已死亡角色出现在正文且无复活/回忆上下文
    const deadChars = novel.deadCharacters || [];
    // 复活/非现实上下文关键词，命中则视为合理出现
    const reviveKeywords = ['复活', '重生', '转世', '幻象', '回忆', '梦境', '梦', '鬼魂', '灵魂', '幻觉', '闪回', '从前', '当年'];
    for(const name of deadChars){
      if(content.includes(name)){
        const hasReviveContext = reviveKeywords.some(kw => content.includes(kw));
        if(!hasReviveContext){
          violations.push({
            type: 'deadRevival',
            severity: 'P0',
            message: `已死亡角色"${name}"出现于正文，且无复活/回忆相关上下文`,
          });
        }
      }
    }

    // 场景断裂：本章开头未提及上一场景，且无转场描写
    const lastLocation = novel.lastLocation;
    if(lastLocation){
      const headLen = Math.max(200, Math.floor(content.length * 0.2));
      const head = content.slice(0, headLen);
      const transitionKeywords = ['来到', '前往', '抵达', '进入', '离开', '回到', '穿过', '走过', '赶往', '奔向', '踏入', '走出'];
      const hasTransition = transitionKeywords.some(kw => head.includes(kw));
      const hasLocation = head.includes(lastLocation);
      if(!hasLocation && !hasTransition){
        violations.push({
          type: 'sceneBreak',
          severity: 'P1',
          message: `本章开头未提及上一场景"${lastLocation}"，且无转场描写，可能场景断裂`,
        });
      }
    }

    return violations;
  },

  // ============================================================
  // 综合后处理 — 校验 + 评分 + 指令生成
  // 增强版：整合清洗、P0 阻断、钩子回收、因果链、评分、重写指令
  // 返回完整的后处理结果
  // ============================================================
  postWriteCheck(novel, chapIdx, content){
    // 增强清洗
    const cleaned = this.enhancedCleanContent(content);

    // P0 阻断校验
    const validation = this.validateChapter(novel, chapIdx, cleaned);

    // 钩子回收验证
    const hookCheck = this.checkHookPayoff(novel, chapIdx, cleaned);

    // 因果链检查
    const causalChainCheck = this.checkCausalChain(novel, chapIdx, cleaned);

    // 质量评分
    const score = this.scoreChapter(novel, chapIdx, cleaned);

    // 5 门验证体系 — 对标 Reference-php validate_consistency.php
    // 为什么单独跑：gateResults 提供更结构化的质量诊断，供迭代精修使用
    const gateResult = this.runAllGates(cleaned, { novel, chapIdx });

    // 下一章改进指令
    const directives = this.generateDirectives(novel, chapIdx, validation, score);

    // 从 5 门验证问题生成额外改进指令
    if(gateResult.allIssues.length > 0){
      for(const issue of gateResult.allIssues.slice(0, 3)){
        directives.push(`[${issue.gate}] ${issue.message}`);
      }
    }

    // 当前章节重写指令（评分低于阈值时生成）
    const rewriteDirectives = this.generateRewriteDirective(novel, chapIdx, score, validation);

    // 从 gateResults 补充重写指令（低于 60 分的门）
    if(gateResult.gateResults){
      for(const [gate, result] of Object.entries(gateResult.gateResults)){
        if(result.score < 60 && result.issues.length > 0){
          rewriteDirectives.push(`- [${result.name}] ${result.issues[0]}`);
        }
      }
    }

    // 约束验证 — 对标 Reference-php PostWriteValidator
    // 为什么在 5 门验证后执行：约束是额外的写作规则检查，与质量门禁互补
    let constraintResult = null;
    try{
      // 先更新约束状态
      ConstraintState.updateState(novel, chapIdx, cleaned);
      // 再执行写后验证
      constraintResult = PostWriteValidator.validate(novel, chapIdx, cleaned);
      // 从违规生成修复指令
      if(constraintResult.all_issues.length > 0){
        const fixDirectives = PostWriteValidator.generateFixDirective(constraintResult.all_issues);
        for(const fd of fixDirectives){
          if(fd.type === 'urgent'){
            rewriteDirectives.push(fd.directive);
          } else {
            directives.push(fd.directive);
          }
        }
      }
    }catch(e){ /* constraints.js 未加载时静默降级 */ }

    // 综合判定：P0 校验通过且无 P0 因果链违规且 5 门全通过且无 P0 约束违规
    const hasP0Causal = causalChainCheck.some(v => v.severity === 'P0');
    const hasP0Constraint = constraintResult?.has_p0 || false;
    const passed = validation.passed && !hasP0Causal && gateResult.passed &&
      (!constraintResult || !hasP0Constraint || !ConstraintConfig.isStrictMode(novel));

    return {
      cleanedContent: cleaned,
      validation,
      score,
      directives,
      hookCheck,
      causalChainCheck,
      rewriteDirectives,
      gateResult,
      constraintResult,
      passed,
    };
  },

  // ============================================================
  // 钩子系统 — 对标参考项目 hooks.js
  // 6类钩子 + 9类爽点 + 饥饿度排期
  // ============================================================

  HOOK_TYPES: {
    crisis_interrupt: { label:'危机打断型', frequency:0.25, desc:'对话被中断/敌人出现/紧急消息' },
    info_bomb:        { label:'信息爆炸型', frequency:0.20, desc:'发现秘密/身份揭晓/预言应验' },
    plot_twist:       { label:'反转颠覆型', frequency:0.20, desc:'盟友背叛/敌人是内鬼' },
    new_goal:         { label:'新目标型',   frequency:0.15, desc:'收到邀请/发现新地图' },
    emotional_impact: { label:'情感冲击型', frequency:0.12, desc:'重要人物遇险/重逢' },
    upgrade_omen:     { label:'升级预示型', frequency:0.08, desc:'突破征兆/能力觉醒' },
  },

  COOL_POINT_TYPES: {
    underdog_win:  { label:'越级战胜', weight:20, cooldown:4 },
    face_slap:     { label:'打脸反转', weight:18, cooldown:3 },
    treasure_find: { label:'宝物奇遇', weight:15, cooldown:5 },
    breakthrough:  { label:'修为突破', weight:15, cooldown:6 },
    power_expand:  { label:'势力扩张', weight:12, cooldown:7 },
    romance_win:   { label:'红颜倾心', weight:10, cooldown:9 },
    truth_reveal:  { label:'真相揭露', weight:14, cooldown:8 },
    last_stand:    { label:'背水一战', weight:13, cooldown:6 },
    sacrifice:     { label:'牺牲',     weight:8,  cooldown:12 },
  },

  // 钩子关键词规则
  HOOK_KEYWORD_RULES: [
    { type:'crisis_interrupt', regex:/(突然|忽然|猛然|危机|危险|紧急|警报|袭击)/ },
    { type:'info_bomb',        regex:/(秘密|真相|身份|揭晓|发现|档案|记录)/ },
    { type:'plot_twist',       regex:/(背叛|反转|内鬼|卧底|原来|竟然|其实)/ },
    { type:'new_goal',         regex:/(邀请|任务|目标|地图|征程|出发|启程)/ },
    { type:'emotional_impact', regex:/(重逢|遇险|生死|泪|悲伤|感动|震惊)/ },
    { type:'upgrade_omen',     regex:/(突破|觉醒|进阶|征兆|预感|异象)/ },
  ],

  // 推荐钩子类型
  suggestHookType(novel, chapIdx){
    const outline = novel.outline?.[chapIdx];
    const outlineText = (outline?.summary || '') + ' ' + (outline?.title || '');

    // 1. 关键词匹配
    let matched = null;
    for(const rule of this.HOOK_KEYWORD_RULES){
      if(rule.regex.test(outlineText)){
        matched = rule.type;
        break;
      }
    }

    // 2. 去重：检查近2章钩子类型
    const recentHooks = (novel.chapters || [])
      .slice(Math.max(0, chapIdx - 2), chapIdx)
      .map(c => c.hookType)
      .filter(Boolean);

    if(matched && recentHooks.filter(h => h === matched).length < 2){
      return { type: matched, reason: '关键词匹配', desc: this.HOOK_TYPES[matched].desc };
    }

    // 3. 默认轮换
    const types = Object.keys(this.HOOK_TYPES);
    let defaultType = types[chapIdx % types.length];
    // 避开最近1章
    if(recentHooks.length > 0 && recentHooks[recentHooks.length - 1] === defaultType){
      defaultType = types[(chapIdx + 1) % types.length];
    }
    return { type: defaultType, reason: '轮换选择', desc: this.HOOK_TYPES[defaultType].desc };
  },

  // 爽点排期 — 饥饿度模型
  calculateCoolPointSchedule(novel, chapIdx){
    const recent = novel.chapters || [];
    const lastUsed = {};
    for(let i = 0; i < recent.length; i++){
      const cp = recent[i].coolPointType;
      if(cp) lastUsed[cp] = i;
    }

    const candidates = [];
    for(const [type, config] of Object.entries(this.COOL_POINT_TYPES)){
      const lastUse = lastUsed[type] ?? -Infinity;
      const gap = chapIdx - lastUse;
      const hunger = gap / config.cooldown;
      if(hunger >= 0.6){
        candidates.push({ type, hunger, score: config.weight * hunger, config });
      }
    }

    if(candidates.length === 0) return null;

    candidates.sort((a, b) => b.score - a.score);
    const recommended = candidates[0];

    // 避免与上一章同类型
    const lastCP = recent.length > 0 ? recent[recent.length - 1].coolPointType : null;
    if(lastCP && recommended.type === lastCP && candidates.length > 1){
      return { ...candidates[1], primary: recommended };
    }

    // 每3章可安排双爽点
    const isDoubleChapter = (chapIdx + 1) % 3 === 0;
    if(isDoubleChapter && candidates.length > 1){
      const secondary = candidates.find(c => c.hunger >= 0.8 && c.type !== recommended.type);
      if(secondary) return { ...recommended, secondary };
    }

    return recommended;
  },

  // ============================================================
  // 认知负荷监控 — 对标参考项目 cognitive-load-monitor.js
  // 新元素数量监控 + 趋势判断
  // ============================================================

  COGNITIVE_LOAD_LIMITS: {
    MAX_NEW_PER_CHAPTER: 3,
    MAX_NEW_PER_5_CHAPTERS: 12,
    WINDOW: 5,
  },

  // 分析认知负荷
  analyzeCognitiveLoad(novel, chapIdx, newElements){
    // newElements: { characters: [], locations: [], concepts: [] }
    const total = (newElements.characters?.length || 0) +
                  (newElements.locations?.length || 0) +
                  (newElements.concepts?.length || 0);

    // 单章超限
    if(total > this.COGNITIVE_LOAD_LIMITS.MAX_NEW_PER_CHAPTER){
      return {
        severity: 'high',
        total_new: total,
        message: `认知负荷过高：本章引入${total}个新元素（上限${this.COGNITIVE_LOAD_LIMITS.MAX_NEW_PER_CHAPTER}个）`,
        directive: this.buildCognitiveLoadDirective(newElements, total),
      };
    }

    // 5章滑动窗口累计
    const recent = novel.chapters?.slice(Math.max(0, chapIdx - 4), chapIdx) || [];
    const recent5Sum = total + recent
      .filter(c => c.cognitiveLoad?.total_new)
      .reduce((sum, c) => sum + c.cognitiveLoad.total_new, 0);

    if(recent5Sum > this.COGNITIVE_LOAD_LIMITS.MAX_NEW_PER_5_CHAPTERS){
      return {
        severity: 'medium',
        total_new: total,
        recent_5_sum: recent5Sum,
        message: `近5章累计引入${recent5Sum}个新元素（上限${this.COGNITIVE_LOAD_LIMITS.MAX_NEW_PER_5_CHAPTERS}个），建议放缓`,
        directive: '本章不再引入新角色/地点/概念，让已有元素之间发生交互',
      };
    }

    return { severity: 'ok', total_new: total };
  },

  buildCognitiveLoadDirective(newElements, total){
    const parts = [`【认知负荷警告】上章引入了${total}个新元素`];
    if(newElements.characters?.length > 0) parts.push(`新角色：${newElements.characters.join('、')}`);
    if(newElements.locations?.length > 0) parts.push(`新地点：${newElements.locations.join('、')}`);
    parts.push('本章请：1.不再引入新元素 2.让已有元素互动 3.优先用已有角色推进情节');
    return parts.join('\n');
  },

  // ============================================================
  // 结局强制器 — 对标参考项目 ending-enforcer.js
  // 三阶段收尾规则 + 新伏笔/支线检测
  // ============================================================

  // 获取结局阶段
  getEndingStage(progress){
    const pct = Math.min(1, Math.max(0, progress));
    if(pct < 0.8) return 'normal';
    if(pct < 0.95) return 'resolve';
    return 'ending';
  },

  // 结局强制指令
  getEndingDirectives(novel, chapIdx){
    const progress = (chapIdx + 1) / novel.chapterCount;
    const stage = this.getEndingStage(progress);
    const remaining = novel.chapterCount - chapIdx - 1;
    const directives = [];

    if(stage === 'resolve'){
      if(progress < 0.9){
        directives.push('【收束期提醒】开始收束主线，禁止引入新的重大冲突，优先回收即将过期伏笔');
      } else {
        directives.push('【强制收束】立即停止一切新伏笔新支线，严禁新角色/地点/设定，所有未回收伏笔必须回收');
      }
    }

    if(stage === 'ending'){
      directives.push('【最终结局】核心矛盾必须解决，主要人物命运必须交代，所有线索必须完结，主角弧光必须完成');
    }

    // 剩余章数分级
    if(remaining <= 1){
      directives.push('【最终章】必须解决所有核心矛盾、给出主角结局、回收所有核心伏笔、安排情感爆发点');
    } else if(remaining <= 3){
      directives.push('【倒数章】开始解决核心矛盾、主要人物命运明确、回收50%核心伏笔');
    } else if(remaining <= 5){
      directives.push('【收尾阶段】逐步解决主要矛盾、回收重要伏笔');
    }

    return directives;
  },

  // 检测新伏笔（收束期不应埋新伏笔）
  checkNewForeshadowing(content){
    const keywords = ['伏笔','暗示','预示','暗藏','不简单','深意','另有','秘密','隐藏','潜在','埋下'];
    for(const kw of keywords){
      if(content.includes(kw)) return { detected: true, keyword: kw };
    }
    return { detected: false };
  },

  // 检测新支线（收束期不应开新支线）
  checkNewSubplot(content, knownCharacters){
    const matches = content.matchAll(/[【「]([^」】]{2,8})[」】]/g);
    for(const m of matches){
      const name = m[1];
      if(!knownCharacters.includes(name) && name.length >= 2){
        return { detected: true, name };
      }
    }
    return { detected: false };
  },

  // 检查结局合规性
  checkEndingCompliance(novel, chapIdx, content){
    const progress = (chapIdx + 1) / novel.chapterCount;
    const stage = this.getEndingStage(progress);
    if(stage === 'normal') return { compliant: true, warnings: [] };

    const warnings = [];
    const knownChars = QualityGuard.extractCharacterNames(novel.characters || '');

    // 收束期不应埋新伏笔
    if(stage === 'resolve' || stage === 'ending'){
      const newFs = this.checkNewForeshadowing(content);
      if(newFs.detected){
        warnings.push(`收束期检测到新伏笔关键词"${newFs.keyword}"，建议不再埋设新伏笔`);
      }
      const newSub = this.checkNewSubplot(content, knownChars);
      if(newSub.detected){
        warnings.push(`收束期检测到新角色/支线"${newSub.name}"，建议不再引入新角色`);
      }
    }

    // 结局期检查情感收束
    if(stage === 'ending'){
      const last500 = content.slice(-500);
      const emotionKeywords = ['感悟','释然','满足','安慰','平静','宁静','回忆','泪','微笑','看着','望着'];
      const hasEmotion = emotionKeywords.some(kw => last500.includes(kw));
      if(!hasEmotion){
        warnings.push('结局章缺少情感收束元素，建议增加感悟/释然/回忆等情感描写');
      }
    }

    return { compliant: warnings.length === 0, warnings };
  },

  // ============================================================
  // 5 门验证体系 — 对标 Reference-php validate_consistency.php
  // 每门返回 { name, status, score, issues }
  // score 从 100 起扣（Gate4 从 80 起），低于 60 为 fail
  // ============================================================

  // Gate 1: 结构验证
  // 检查字数范围、开头"黄金三行"、结尾钩子
  // 对应 Reference-php checkGate1_Structure() 第 160-219 行
  checkGate1_Structure(chapterText, outline, config){
    const issues = [];
    let score = 100;
    const target = config?.wordCount || 1200;
    const tolerance = config?.wordTolerance ? config.wordTolerance : Math.max(50, Math.round(target * 0.15));
    const len = chapterText.length;

    // 1.1 字数范围检查
    if(target > 0 && (len < target - tolerance || len > target + tolerance)){
      const pct = tolerance > 0 ? Math.round(tolerance / target * 100) : 0;
      issues.push(`字数${len}字${len < target ? '不足' : '超出'}目标${target}字（容差${tolerance}字/±${pct}%）`);
      score -= 30;
    }

    // 1.2 开头"黄金三行"检测：前 200 字必须命中至少一种吸引模式
    // 五种模式：动作 / 感官 / 对话 / 异常 / 危机
    const cleanContent = chapterText.replace(/[\r\n\t ]/g, '');
    const firstLines = cleanContent.slice(0, 200);

    const hasAction   = /(冲|刺|劈|斩|射|踢|打|挥|扑|撞|跃|翻|闪|拔|握|挡|格)/.test(firstLines);
    const hasSensory  = /(看到|听见|闻到|感受到|刺骨|灼热|冰冷|震颤|刺痛|光芒|声响|气息)/.test(firstLines);
    const hasDialogue = /["「『"][^"」』]+["」』"]/.test(firstLines);
    const hasAbnormal = /(突然|忽然|异常|怪异|不对|诡异|离奇|反常|奇怪|不对劲)/.test(firstLines);
    const hasCrisis   = /(危险|危机|紧急|致命|逃|死|血|伤|爆炸|塌|陷)/.test(firstLines);

    if(!hasAction && !hasSensory && !hasDialogue && !hasAbnormal && !hasCrisis){
      issues.push('开头 200 字缺乏吸引力元素（动作/感官/对话/异常/危机均未命中）');
      score -= 15;
    }

    // 1.3 结尾钩子检查：最后一段不应以平淡模式开头
    const lastPara = this.getLastParagraph(chapterText);
    const calmPatterns = [
      /^(于是|然后|接着|随后|就这样|日子一天天)/,
      /^(天亮了|天黑了|第二天|过了一会|不多时)/,
    ];
    for(const p of calmPatterns){
      if(p.test(lastPara.trim())){
        issues.push('结尾段以平淡过渡开头，缺少悬念钩子');
        score -= 25;
        break;
      }
    }

    // 非最后一章应有结尾钩子
    const isLastChapter = config?.isLastChapter || false;
    if(!isLastChapter){
      const hookKeywords = ['？','！','...','……','突然','然而','但是','就在这时','却','果然','没想到'];
      const hasHook = hookKeywords.some(kw => lastPara.includes(kw));
      if(!hasHook){
        issues.push('结尾缺少悬念钩子词（？/！/……/突然/然而等）');
        score -= 10;
      }
    }

    return {
      name: 'Gate1 结构',
      status: score >= 60,
      score: Math.max(0, score),
      issues,
    };
  },

  // Gate 2: 角色验证
  // 检查角色出场一致性、已死亡角色复活、角色出场比例
  // 对应 Reference-php checkGate2_Characters() 第 225-266 行
  checkGate2_Characters(chapterText, characterCards, config){
    const issues = [];
    let score = 100;

    // 提取角色名
    let charNames = [];
    if(typeof characterCards === 'string'){
      charNames = this.extractCharacterNames(characterCards);
    } else if(Array.isArray(characterCards)){
      charNames = characterCards.map(c => c.name).filter(Boolean);
    } else if(characterCards && typeof characterCards === 'object'){
      charNames = Object.values(characterCards).map(c => c.name).filter(Boolean);
    }

    if(charNames.length === 0){
      return { name: 'Gate2 角色', status: true, score: 100, issues: [] };
    }

    // 2.1 已死亡角色复活检测
    const deadChars = config?.deadCharacters || [];
    const reviveKeywords = ['复活','重生','转世','幻象','回忆','梦境','梦','鬼魂','灵魂','幻觉','闪回','从前','当年'];
    for(const name of deadChars){
      if(chapterText.includes(name)){
        const hasReviveContext = reviveKeywords.some(kw => chapterText.includes(kw));
        if(!hasReviveContext){
          issues.push(`已死亡角色"${name}"出现于正文且无复活/回忆上下文`);
          score -= 40;
        }
      }
    }

    // 2.2 角色出场比例（>2 个角色时，每个至少 30% 出场率的主角应出现）
    if(charNames.length > 2){
      const presentNames = charNames.filter(name => chapterText.includes(name));
      const absentNames = charNames.filter(name => !chapterText.includes(name));
      // 主角（第一个角色）必须出现
      if(absentNames.includes(charNames[0])){
        issues.push(`主角"${charNames[0]}"未在本章出现`);
        score -= 25;
      }
      // 超过半数角色未出场
      if(absentNames.length > charNames.length / 2){
        issues.push(`${absentNames.length}/${charNames.length} 个角色未出场，出场率过低`);
        score -= 15;
      }
    }

    // 2.3 OOC 检测（简化版：检查角色性格关键词是否与设定矛盾）
    // 这里仅做基本检测，完整 OOC 需要 LLM 判断
    if(config?.characterTraits && typeof config.characterTraits === 'object'){
      for(const [name, traits] of Object.entries(config.characterTraits)){
        if(!chapterText.includes(name)) continue;
        // 检查是否有与性格明显矛盾的描述
        if(traits.includes('冷静') && /暴跳如雷|歇斯底里/.test(chapterText)){
          issues.push(`角色"${name}"设定为冷静性格，但出现暴跳如雷/歇斯底里描写，可能 OOC`);
          score -= 10;
        }
      }
    }

    return {
      name: 'Gate2 角色',
      status: score >= 60,
      score: Math.max(0, score),
      issues,
    };
  },

  // Gate 3: 描写质量验证
  // 检查对话密度、段落长度、感官描写
  // 对应 Reference-php checkGate3_Description() 第 272-327 行
  checkGate3_Description(chapterText, config){
    const issues = [];
    let score = 100;
    const len = chapterText.length;

    // 3.1 对话密度：每 1000 字至少 25 字对话
    const dialogueMatches = chapterText.match(/["「『"][^"」』"]+["」』"]/g) || [];
    const dialogueChars = dialogueMatches.join('').length;
    const dialoguePerK = len > 0 ? (dialogueChars / len * 1000) : 0;
    if(dialoguePerK < 25 && len > 500){
      issues.push(`对话密度过低（${dialoguePerK.toFixed(1)}/千字，建议≥25/千字）`);
      score -= 15;
    }

    // 3.2 非对话段落最大长度（≤350 字）
    const paragraphs = chapterText.split('\n').filter(p => p.trim());
    let maxNonDialoguePara = 0;
    for(const para of paragraphs){
      // 排除纯对话段落
      if(/^["「『"]/.test(para.trim())) continue;
      if(para.length > maxNonDialoguePara) maxNonDialoguePara = para.length;
    }
    if(maxNonDialoguePara > 350){
      issues.push(`非对话段落过长（${maxNonDialoguePara}字，建议≤350字），可能信息密度过高`);
      score -= 10;
    }

    // 3.3 平均段落长度（≤400 字）
    const avgParaLen = paragraphs.length > 0
      ? Math.round(paragraphs.reduce((sum, p) => sum + p.length, 0) / paragraphs.length)
      : 0;
    if(avgParaLen > 400){
      issues.push(`平均段落长度${avgParaLen}字偏长（建议≤400字），读者阅读负荷大`);
      score -= 10;
    }

    // 3.4 感官描写密度
    const sensoryWords = ['看到','听见','闻到','感到','尝到','光芒','声音','气味','冰冷','灼热','粗糙','光滑','刺痛','震颤'];
    let sensoryCount = 0;
    for(const w of sensoryWords){ if(chapterText.includes(w)) sensoryCount++; }
    if(sensoryCount < 3 && len > 800){
      issues.push('感官描写不足（少于3种感官词），场景沉浸感不够');
      score -= 10;
    }

    // 3.5 段落数量（太少说明缺乏场景切换）
    if(paragraphs.length < 5 && len > 800){
      issues.push(`段落仅${paragraphs.length}段，缺乏场景切换和节奏变化`);
      score -= 10;
    }

    return {
      name: 'Gate3 描写',
      status: score >= 60,
      score: Math.max(0, score),
      issues,
    };
  },

  // Gate 4: 爽点验证
  // 检查是否在预期位置出现高潮/转折/爽点信号
  // 对应 Reference-php checkGate4_CoolPoint() 第 333-370 行
  checkGate4_CoolPoint(chapterText, chapterIndex, config){
    const issues = [];
    let score = 80; // Gate4 从 80 起扣

    // 爽点信号关键词库
    const coolSignals = {
      underdog_win:  { label:'越级战胜', keywords:['越级','以弱胜强','逆杀','反败为胜','不可思议','震惊'] },
      face_slap:     { label:'打脸反转', keywords:['打脸','啪啪','哑口无言','目瞪口呆','悔不当初','跪下'] },
      treasure_find:{ label:'宝物奇遇', keywords:['宝物','传承','遗迹','秘境','天材地宝','意外收获'] },
      breakthrough:  { label:'修为突破', keywords:['突破','进阶','晋升','境界提升','蜕变','觉醒'] },
      power_expand: { label:'势力扩张', keywords:['收服','归顺','扩张','势力大增','一统','臣服'] },
      romance_win:  { label:'红颜倾心', keywords:['倾心','心动','告白','在一起','携手','红颜'] },
    };

    // 检测命中的爽点信号
    let hitCount = 0;
    const hitTypes = [];
    for(const [type, signalCfg] of Object.entries(coolSignals)){
      for(const kw of signalCfg.keywords){
        if(chapterText.includes(kw)){
          hitCount++;
          hitTypes.push(signalCfg.label);
          break;
        }
      }
    }

    // 根据章节进度判断爽点需求
    const progress = config?.progress || (chapterIndex + 1) / (config?.chapterCount || 10);
    const isClimaxStage = progress >= 0.5 && progress <= 0.8;
    const isEndingStage = progress >= 0.8;

    if(hitCount === 0){
      if(isClimaxStage){
        issues.push('高潮期章节未检测到任何爽点信号，建议安排明确的高潮事件');
        score -= 30;
      } else if(!isEndingStage){
        issues.push('本章未检测到爽点信号，建议增加冲突/反转/突破等元素');
        score -= 15;
      }
    } else if(hitCount >= 2){
      score += 10; // 多爽点奖励
    }

    // 结局期必须有核心爽点
    if(isEndingStage){
      const hasCoreCool = hitTypes.some(t =>
        ['越级战胜','打脸反转','修为突破'].includes(t)
      );
      if(!hasCoreCool){
        issues.push('结局期章节缺少核心爽点（越级战胜/打脸反转/修为突破）');
        score -= 20;
      }
    }

    return {
      name: 'Gate4 爽点',
      status: score >= 60,
      score: Math.max(0, Math.min(100, score)),
      issues,
    };
  },

  // Gate 5: 一致性验证
  // 检查前章衔接、伏笔回收、设定不矛盾
  // 对应 Reference-php checkGate5_Consistency() 第 376-463 行
  checkGate5_Consistency(chapterText, context){
    const issues = [];
    let score = 100;
    const chapIdx = context?.chapIdx ?? 0;

    // 5.1 前章衔接：第二章起，开头应承接上一章
    if(chapIdx > 0){
      const prevChapter = context?.prevChapter;
      if(prevChapter && prevChapter.content){
        // 提取上一章结尾的关键实体
        const prevTail = prevChapter.content.slice(-300);
        const entities = this.extractKeyEntities(prevTail);
        // 检查本章前 300 字是否提及这些实体
        const currHead = chapterText.slice(0, 300);
        const missingEntities = entities.filter(e => !currHead.includes(e));
        if(missingEntities.length > 0 && entities.length > 0){
          issues.push(`本章开头未承接上一章结尾（缺失实体：${missingEntities.join('、')}）`);
          score -= 15;
        }
      }

      // 转场词检测
      const transitionKeywords = ['来到','前往','抵达','进入','离开','回到','穿过','走过','赶往','次日','随后','此时','另一边','与此同时'];
      const hasTransition = transitionKeywords.some(kw => chapterText.slice(0, 200).includes(kw));
      const prevLocation = context?.prevLocation;
      if(prevLocation && !chapterText.slice(0, 300).includes(prevLocation) && !hasTransition){
        issues.push(`本章开头未提及上一场景"${prevLocation}"且无转场描写，可能场景断裂`);
        score -= 10;
      }
    }

    // 5.2 伏笔回收检查
    const foreshadowings = context?.foreshadowings || [];
    if(foreshadowings.length > 0){
      const progress = (chapIdx + 1) / (context?.chapterCount || 10);
      // 收束期（进度 > 80%）检查未回收伏笔
      if(progress > 0.8){
        const unresolved = foreshadowings.filter(f => !f.resolved && !chapterText.includes(f.keyword || ''));
        if(unresolved.length > 0){
          issues.push(`收束期仍有${unresolved.length}条伏笔未回收，建议尽快回收`);
          score -= 20;
        }
      }

      // 即将过期的伏笔（deadline 在 2 章内）
      const remaining = context?.chapterCount - chapIdx - 1;
      const urgent = foreshadowings.filter(f =>
        !f.resolved &&
        f.deadline &&
        f.deadline - chapIdx <= 2 &&
        f.deadline - chapIdx > 0
      );
      for(const f of urgent){
        if(!chapterText.includes(f.keyword || '')){
          issues.push(`伏笔"${f.desc || f.keyword}"即将到期（剩余${f.deadline - chapIdx}章），本章应提及或回收`);
          score -= 10;
        }
      }
    }

    // 5.3 设定矛盾检测（简化版：检查已知设定是否被违反）
    const worldSettings = context?.worldSettings || [];
    for(const setting of worldSettings){
      if(setting.forbidden && chapterText.includes(setting.forbidden)){
        issues.push(`检测到禁止元素"${setting.forbidden}"，与世界观设定矛盾`);
        score -= 15;
      }
    }

    return {
      name: 'Gate5 一致性',
      status: score >= 60,
      score: Math.max(0, score),
      issues,
    };
  },

  // 获取最后一段（非空）
  getLastParagraph(text){
    const paras = text.split('\n').filter(p => p.trim());
    return paras.length > 0 ? paras[paras.length - 1] : '';
  },

  // 运行全部 5 门验证
  // 返回 { passed, gateResults, overallScore, allIssues }
  runAllGates(chapterText, context){
    const config = context?.config || {};
    const novel = context?.novel || {};

    const gateResults = {
      gate1: this.checkGate1_Structure(chapterText, novel.outline?.[context?.chapIdx || 0], {
        wordCount: novel.wordCount || config.wordCount || 1200,
        wordTolerance: config.wordTolerance,
        isLastChapter: (context?.chapIdx || 0) === (novel.chapterCount || 10) - 1,
      }),
      gate2: this.checkGate2_Characters(chapterText, novel.characters, {
        deadCharacters: novel.deadCharacters || [],
        characterTraits: novel.characterTraits,
      }),
      gate3: this.checkGate3_Description(chapterText, config),
      gate4: this.checkGate4_CoolPoint(chapterText, context?.chapIdx || 0, {
        progress: ((context?.chapIdx || 0) + 1) / (novel.chapterCount || 10),
        chapterCount: novel.chapterCount,
      }),
      gate5: this.checkGate5_Consistency(chapterText, {
        chapIdx: context?.chapIdx || 0,
        chapterCount: novel.chapterCount,
        prevChapter: novel.chapters?.[(context?.chapIdx || 0) - 1],
        prevLocation: novel.lastLocation,
        foreshadowings: novel.foreshadowings || [],
        worldSettings: novel.worldSettings || [],
      }),
    };

    // 计算综合分
    const scores = Object.values(gateResults).map(g => g.score);
    const overallScore = scores.length > 0
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length * 10) / 10
      : 0;

    // 汇总所有问题
    const allIssues = [];
    for(const [gate, result] of Object.entries(gateResults)){
      for(const issue of result.issues){
        allIssues.push({ gate, message: issue });
      }
    }

    // 判定是否通过：所有门都 pass
    const passed = Object.values(gateResults).every(g => g.status);

    return {
      passed,
      gateResults,
      overallScore,
      allIssues,
    };
  },
};

window.QualityGuard = QualityGuard;
