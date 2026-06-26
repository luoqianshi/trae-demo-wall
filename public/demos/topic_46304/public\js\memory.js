/* ============================================================
 * MemoryEngine - 长程记忆引擎
 *
 * 设计理念（对标参考项目 MemoryEngine.php）：
 *   记忆不是简单拼接历史正文，而是结构化资产。
 *   人物卡、伏笔、弧段摘要、关键事件、故事圣经各自独立维护，
 *   写入时幂等容错，读取时按预算优先级裁剪。
 *
 * 前端环境无数据库，记忆数据挂载在 novel.memory 对象上，
 *   通过 store.saveToLibrary 持久化到 localStorage。
 *
 * 记忆层级与预算优先级：
 *   P0：全局设定 + 前章尾文 + 人物当前状态 + 故事势能
 *   P1：弧段摘要 + 近章细纲 + 伏笔
 *   P2：关键事件 + 金句
 *
 * 数据结构：
 *   novel.memory = {
 *     characterCards: { name: { role, status, emotion, location,
 *                               abilities, relationships, arc, history:[] } },
 *     foreshadowing: [{ id, desc, plantedAt, deadline,
 *                       status:'open'|'mentioned'|'resolved',
 *                       mentions:[], priority }],
 *     arcSummaries: [{ startChap, endChap, summary }],
 *     keyEvents: [{ chapIdx, event, importance }],
 *     storyBible: '',
 *     catchphrases: [{ chapIdx, text, character }],
 *     storyPotential: 0,   // 故事势能 0-100
 *   }
 * ============================================================ */

const MemoryEngine = {

  // ===== 初始化 =====
  init(novel){
    if(!novel.memory) novel.memory = {};
    const m = novel.memory;
    // 确保所有字段存在，避免后续访问 undefined
    if(!m.characterCards) m.characterCards = {};
    if(!m.foreshadowing) m.foreshadowing = [];
    if(!m.arcSummaries) m.arcSummaries = [];
    if(!m.keyEvents) m.keyEvents = [];
    if(m.storyBible === undefined) m.storyBible = '';
    if(!m.catchphrases) m.catchphrases = [];
    if(m.storyPotential === undefined) m.storyPotential = 50;
    // 知识库：4类结构化知识（对标参考项目 knowledge-base.js）
    if(!m.knowledgeBase) m.knowledgeBase = { characters:[], worldbuilding:[], plots:[], styles:[] };
    // P1-1: 长尾原子记忆（对标 AtomRepo）
    if(!m.atoms) m.atoms = [];
    // P1-1: 场景模板使用记录（对标 SceneTemplateRepo）
    if(!m.sceneTemplates) m.sceneTemplates = [];
    // 连贯性追踪字段：死亡角色、场景位置、情绪状态
    if(!novel.deadCharacters) novel.deadCharacters = [];
    if(!novel.lastLocation) novel.lastLocation = null;
    if(!novel.emotionStates) novel.emotionStates = [];
  },

  // ============================================================
  // 写入模型：章节后处理
  // ============================================================

  // 章节入库 — 对标 ingestChapter()
  // 每类数据独立容错，单类失败不影响其他
  // aiCall 为可选的 AI 调用回调，传入后启用 AI 压缩能力
  async ingestChapter(novel, chapIdx, content, summary, aiCall){
    this.init(novel);
    const m = novel.memory;

    // 1. 更新弧段摘要（每5章压缩一次，作为 AI 失败时的回退）
    try{ this.maybeCompressArc(novel, chapIdx); }catch(e){ console.warn('弧段摘要失败', e); }

    // 2. 更新故事势能
    try{ this.updateStoryPotential(novel, chapIdx, content); }catch(e){ console.warn('势能更新失败', e); }

    // 3. 追踪伏笔提及
    try{ this.trackForeshadowingMentions(novel, chapIdx, content); }catch(e){ console.warn('伏笔追踪失败', e); }

    // 4. 记录关键事件（从摘要中提取）
    try{ this.extractKeyEvents(novel, chapIdx, summary); }catch(e){ console.warn('关键事件提取失败', e); }

    // 5. 更新人物状态（基于摘要）
    try{ this.updateCharactersFromSummary(novel, chapIdx, summary); }catch(e){ console.warn('人物状态更新失败', e); }

    // 6. 检查伏笔临期/逾期
    try{ this.checkForeshadowingDeadlines(novel, chapIdx); }catch(e){ console.warn('伏笔检查失败', e); }

    // 7. 角色死亡追踪
    try{ this.trackCharacterDeath(novel, chapIdx, content); }catch(e){ console.warn('角色死亡追踪失败', e); }

    // 8. 场景位置追踪
    try{ this.trackSceneLocation(novel, chapIdx, content); }catch(e){ console.warn('场景位置追踪失败', e); }

    // 9. 情绪追踪
    try{ this.trackEmotionState(novel, chapIdx, content); }catch(e){ console.warn('情绪追踪失败', e); }

    // 10. 每5章调用 AI 生成弧段摘要（覆盖回退版本）
    if((chapIdx + 1) % 5 === 0){
      try{ await this.generateArcSummary(novel, chapIdx, aiCall); }catch(e){ console.warn('AI 弧段摘要失败', e); }
    }

    // 11. 每5章调用 AI 生成故事圣经
    if((chapIdx + 1) % 5 === 0){
      try{ await this.generateStoryBible(novel, aiCall); }catch(e){ console.warn('AI 故事圣经失败', e); }
    }

    // 12. 知识库提取（AI 可选，无 AI 时用正则回退）
    try{ await KnowledgeBase.extractFromChapter(novel, chapIdx, content, aiCall); }catch(e){ console.warn('知识库提取失败', e); }

    // 13. P1-1: 金句 callback 追踪（对标 CatchphraseRepo::trackCallbacksInContent）
    try{ CatchphraseRepo.trackCallbacksInContent(novel, content, chapIdx + 1); }catch(e){ console.warn('金句callback追踪失败', e); }
  },

  // 弧段压缩 — 每5章生成一次弧段摘要
  maybeCompressArc(novel, chapIdx){
    const m = novel.memory;
    const arcLen = 5;
    // chapIdx 是 0-based，第4章写完（idx=4）时压缩 0-4
    if((chapIdx + 1) % arcLen === 0){
      const startChap = chapIdx - arcLen + 1;
      const endChap = chapIdx;
      // 检查是否已存在该弧段
      const exists = m.arcSummaries.find(a => a.startChap === startChap && a.endChap === endChap);
      if(!exists){
        const chapters = novel.chapters.slice(startChap, endChap + 1);
        const summaries = chapters.map((c, i) =>
          `第${startChap+i+1}章《${c.title||''}》：${c.summary||''}`
        ).join('\n');
        const arcSummary = {
          startChap,
          endChap,
          summary: summaries,
        };
        m.arcSummaries.push(arcSummary);
      }
    }
  },

  // AI 弧段摘要 — 每5章用 AI 压缩，失败降级为拼接摘要
  // 对标参考项目 ArcSummarizer，保证长篇剧情压缩质量
  async generateArcSummary(novel, chapIdx, aiCall){
    this.init(novel);
    const m = novel.memory;
    const arcLen = 5;
    const startChap = chapIdx - arcLen + 1;
    const endChap = chapIdx;

    // 收集最近5章摘要作为 AI 输入和降级回退
    const chapters = novel.chapters.slice(startChap, endChap + 1);
    const fallback = chapters.map((c, i) =>
      `第${startChap+i+1}章《${c.title||''}》：${c.summary||''}`
    ).join('\n');

    // 无 AI 回调时直接降级
    if(!aiCall || typeof aiCall !== 'function'){
      this._upsertArcSummary(m, startChap, endChap, fallback);
      return fallback;
    }

    const prompt = `请将以下5章剧情压缩为不超过200字的弧段总结，保留核心事件与人物变化：

${fallback}

要求：只输出总结，不要额外说明。`;

    try{
      const aiResult = await aiCall(prompt);
      const summary = (aiResult || '').trim().slice(0, 200);
      if(!summary) throw new Error('AI 返回空内容');
      this._upsertArcSummary(m, startChap, endChap, summary);
      return summary;
    }catch(e){
      console.warn('弧段摘要 AI 调用失败，降级为拼接摘要', e);
      this._upsertArcSummary(m, startChap, endChap, fallback);
      return fallback;
    }
  },

  // 幂等写入弧段摘要 — 已存在则更新，避免重复
  _upsertArcSummary(m, startChap, endChap, summary){
    const exists = m.arcSummaries.find(a => a.startChap === startChap && a.endChap === endChap);
    if(exists){
      exists.summary = summary;
    }else{
      m.arcSummaries.push({ startChap, endChap, summary });
    }
  },

  // 故事势能更新 — 简化版：基于章节进度和关键词
  updateStoryPotential(novel, chapIdx, content){
    const m = novel.memory;
    const progress = (chapIdx + 1) / novel.chapterCount;
    // 检测高潮关键词
    const climaxKeywords = ['决战', '真相', '爆发', '崩溃', '转折', '高潮', '生死', '绝境'];
    const calmKeywords = ['日常', '休息', '准备', '回忆', '闲聊', '平静'];
    let boost = 0;
    for(const kw of climaxKeywords){ if(content.includes(kw)) boost += 8; }
    for(const kw of calmKeywords){ if(content.includes(kw)) boost -= 5; }
    // 基础势能随进度上升，结尾阶段下降
    let base = 30 + progress * 50;
    if(progress > 0.85) base -= 20; // 收尾阶段势能回收
    m.storyPotential = Math.max(10, Math.min(100, Math.round(base + boost)));
  },

  // 伏笔提及追踪
  trackForeshadowingMentions(novel, chapIdx, content){
    const m = novel.memory;
    for(const fs of m.foreshadowing){
      if(fs.status === 'resolved') continue;
      // 简化版：关键词匹配
      const keywords = fs.desc.split(/[，。、,.\s]+/).filter(w => w.length >= 2);
      let mentioned = false;
      for(const kw of keywords){
        if(kw.length >= 2 && content.includes(kw)){
          mentioned = true;
          break;
        }
      }
      if(mentioned){
        if(!fs.mentions.includes(chapIdx)){
          fs.mentions.push(chapIdx);
        }
        if(fs.status === 'open') fs.status = 'mentioned';
      }
    }
  },

  // 关键事件提取 — 从摘要中提取
  extractKeyEvents(novel, chapIdx, summary){
    const m = novel.memory;
    // 简化版：将摘要作为关键事件，避免额外 AI 调用
    // 只在关键节点记录（每章记录，但 importance 分级）
    const progress = (chapIdx + 1) / novel.chapterCount;
    let importance = 'normal';
    if(chapIdx === 0) importance = 'critical';
    else if(progress > 0.8) importance = 'critical';
    else if((chapIdx + 1) % 5 === 0) importance = 'high';

    // 避免重复
    const exists = m.keyEvents.find(e => e.chapIdx === chapIdx);
    if(!exists){
      m.keyEvents.push({ chapIdx, event: summary, importance });
    }
  },

  // 从摘要更新人物状态
  updateCharactersFromSummary(novel, chapIdx, summary){
    const m = novel.memory;
    // 遍历已有人物卡，检查摘要中是否提及
    for(const [name, card] of Object.entries(m.characterCards)){
      if(summary.includes(name)){
        // 记录出场
        if(!card.history) card.history = [];
        card.history.push({ chapIdx, event: `第${chapIdx+1}章出场` });
        // 更新最后出场章节
        card.lastAppearChap = chapIdx;
      }
    }
  },

  // 伏笔临期/逾期检查
  checkForeshadowingDeadlines(novel, chapIdx){
    const m = novel.memory;
    for(const fs of m.foreshadowing){
      if(fs.status === 'resolved') continue;
      if(fs.deadline !== undefined && fs.deadline !== null){
        const remaining = fs.deadline - chapIdx;
        if(remaining <= 0 && fs.status !== 'resolved'){
          fs.status = 'overdue';
        } else if(remaining <= 2){
          fs.urgent = true;
        }
      }
    }
  },

  // ============================================================
  // 伏笔管理
  // ============================================================

  // 埋设伏笔
  addForeshadowing(novel, chapIdx, desc, deadline, priority){
    this.init(novel);
    const m = novel.memory;
    const fs = {
      id: 'fs-' + Date.now() + '-' + Math.random().toString(36).slice(2,6),
      desc,
      plantedAt: chapIdx,
      deadline: deadline || null,  // 截止章节号 (0-based)
      status: 'open',
      mentions: [],
      priority: priority || 'normal',  // high | normal | low
      urgent: false,
    };
    m.foreshadowing.push(fs);
    return fs.id;
  },

  // 标记伏笔回收
  resolveForeshadowing(novel, fsId){
    const m = novel.memory;
    const fs = m.foreshadowing.find(f => f.id === fsId);
    if(fs) fs.status = 'resolved';
  },

  // 主动伏笔回收决策 — 对标 ForeshadowingResolver
  // 6维打分：优先级 + 埋藏时长 + deadline临近 + 近期提及 + 大纲关键词匹配
  // 回收计划：基于压力(pending/remaining)和进度(progress)决定回收数量
  resolveForeshadowingDecision(novel, chapIdx){
    this.init(novel);
    const m = novel.memory;
    const progress = (chapIdx + 1) / novel.chapterCount;
    const outline = novel.outline?.[chapIdx];
    const outlineText = outline ? (outline.summary || '') + ' ' + (outline.title || '') : '';

    // 1. 打分阶段
    const candidates = [];
    for(const fs of m.foreshadowing){
      if(fs.status === 'resolved') continue;

      // 硬性门槛：埋设不足3章不参与回收
      const age = chapIdx - fs.plantedAt;
      if(age < 3) continue;

      let score = 0;

      // 维度1：优先级权重
      if(fs.priority === 'critical') score += 25;
      else if(fs.priority === 'high') score += 12;
      else score += 0;

      // 维度2：埋藏时长
      if(age > 25) score += 15;
      else if(age > 15) score += 10;
      else if(age > 8) score += 5;

      // 维度3：deadline临近
      if(fs.deadline !== null){
        const remaining = fs.deadline - chapIdx;
        if(remaining <= 0) score += 30;       // 已逾期
        else if(remaining <= 3) score += 20;  // 临近deadline
        else if(remaining <= 7) score += 10;  // 渐近
      }

      // 维度4：近期提及（1-3章内被提及）
      if(fs.mentions.length > 0){
        const lastMention = Math.max(...fs.mentions);
        const mentionAge = chapIdx - lastMention;
        if(mentionAge <= 3) score += 8;
      }

      // 维度5：大纲关键词匹配
      const keywords = this.extractKeywords(fs.desc);
      let keywordOverlap = 0;
      for(const kw of keywords){
        if(kw.length >= 2 && outlineText.includes(kw)) keywordOverlap++;
      }
      score += keywordOverlap * 10;

      // 维度6：全书后期压力
      if(progress > 0.85) score += 20;
      else if(progress > 0.7) score += 10;

      // 入选条件：score >= 10 或 keywords_overlap >= 1
      if(score >= 10 || keywordOverlap >= 1){
        candidates.push({ foreshadowing: fs, score, keywords: keywordOverlap });
      }
    }

    if(candidates.length === 0) return [];

    // 2. 去重：已选伏笔与新候选的关键词重叠≥2则跳过
    candidates.sort((a, b) => b.score - a.score);
    const selected = [];
    for(const c of candidates){
      let overlap = false;
      for(const s of selected){
        const sKeywords = this.extractKeywords(s.foreshadowing.desc);
        const cKeywords = this.extractKeywords(c.foreshadowing.desc);
        let shared = 0;
        for(const kw of cKeywords){
          if(sKeywords.includes(kw)) shared++;
        }
        if(shared >= 2){ overlap = true; break; }
      }
      if(!overlap) selected.push(c);
    }

    // 3. 回收计划：基于压力和进度决定回收数量
    const pending = m.foreshadowing.filter(f => f.status !== 'resolved').length;
    const remaining = novel.chapterCount - chapIdx;
    const effectiveRemaining = Math.max(remaining, Math.max(5, Math.ceil(pending * 0.5)));
    const pressure = pending / Math.max(1, effectiveRemaining);

    let maxResolve;
    if(progress < 0.05){
      maxResolve = pressure > 0.5 ? 1 : 0;  // 建置期：只埋不收
    } else if(pressure > 0.8){
      maxResolve = 2;  // 紧急回收
    } else if(pressure > 0.5){
      maxResolve = 2;  // 高压
    } else if(progress >= 0.8){
      maxResolve = 2;  // 收尾冲刺
    } else if(progress >= 0.6){
      maxResolve = 1;  // 加速
    } else if((chapIdx + 1) % 3 === 0){
      maxResolve = 1;  // 每3章触发
    } else if(pressure > 0.3){
      maxResolve = 1;  // 适度
    } else {
      maxResolve = 0;  // 自然
    }

    return selected.slice(0, maxResolve).map(c => c.foreshadowing);
  },

  // 关键词提取 — 从描述中提取2字以上中文词组
  extractKeywords(text){
    if(!text) return [];
    const matches = text.match(/[\u4e00-\u9fa5]{2,}|[a-zA-Z0-9_]{3,}/g) || [];
    // 简单停用词过滤
    const stopWords = ['这个', '那个', '一个', '什么', '怎么', '可以', '应该', '就是', '已经', '他们', '我们', '自己', '现在', '之后', '之前', '但是'];
    return matches.filter(w => !stopWords.includes(w));
  },

  // ============================================================
  // 人物卡管理
  // ============================================================

  // 初始化人物卡（从角色设计文本中提取）
  initCharacterCards(novel){
    this.init(novel);
    const m = novel.memory;
    if(!novel.characters) return;

    // 解析角色文本中的角色名
    // 格式：### 角色名 或 ### 角色名（xxx）
    const lines = novel.characters.split('\n');
    for(const line of lines){
      const m1 = line.match(/^###\s*(.+?)(?:（.+）)?$/);
      if(m1){
        const name = m1[1].trim();
        if(name && !m.characterCards[name]){
          m.characterCards[name] = {
            role: '',
            status: '初始状态',
            emotion: '未知',
            location: '未知',
            abilities: '未知',
            relationships: {},
            arc: '未开始',
            lastAppearChap: -1,
            history: [],
          };
        }
      }
    }
  },

  // 更新人物卡 — 对标 CharacterCardRepo.upsert()
  // 只传需要变更的键，未传的键保持原值
  // attributes 合并模式：新值覆盖旧同名键，其他键保留
  // 变更追踪：每次实际变化写入 history
  updateCharacterCard(novel, name, updates, chapIdx){
    this.init(novel);
    const m = novel.memory;
    if(!m.characterCards[name]){
      // 新建
      m.characterCards[name] = {
        role: '', status: '初始状态', emotion: '未知', location: '未知',
        abilities: '未知', relationships: {}, arc: '未开始',
        lastAppearChap: -1, lastUpdatedChap: -1, history: [],
        attributes: {}, voiceProfile: {},
      };
    }

    const card = m.characterCards[name];
    const changes = [];

    // 逐字段检测变化
    for(const [key, newVal] of Object.entries(updates)){
      if(key === 'attributes' || key === 'voiceProfile' || key === 'relationships'){
        // 合并模式：新值覆盖旧同名键
        const oldVal = card[key] || {};
        const merged = { ...oldVal, ...newVal };
        // 键序归一化后比较，避免假阳性变更
        const oldSorted = JSON.stringify(Object.keys(oldVal).sort().reduce((obj, k) => { obj[k] = oldVal[k]; return obj; }, {}));
        const newSorted = JSON.stringify(Object.keys(merged).sort().reduce((obj, k) => { obj[k] = merged[k]; return obj; }, {}));
        if(oldSorted !== newSorted){
          card[key] = merged;
          changes.push({ field: key, old: oldVal, new: merged });
        }
      } else {
        // 普通字段：值不同才更新
        if(card[key] !== newVal && newVal !== undefined){
          changes.push({ field: key, old: card[key], new: newVal });
          card[key] = newVal;
        }
      }
    }

    // 记录变更历史
    if(changes.length > 0 && chapIdx !== undefined){
      card.lastUpdatedChap = chapIdx;
      card.history.push({ chapIdx, changes, timestamp: Date.now() });
    }
  },

  // 获取人物卡
  getCharacterCard(novel, name){
    return novel.memory?.characterCards?.[name] || null;
  },

  // 获取所有活跃人物卡摘要
  getCharacterCardsSummary(novel){
    this.init(novel);
    const m = novel.memory;
    const cards = m.characterCards;
    const result = [];
    for(const [name, card] of Object.entries(cards)){
      result.push(`${name}：${card.status||'未知'}（情绪：${card.emotion||'未知'}，位置：${card.location||'未知'}）`);
    }
    return result.join('\n');
  },

  // ============================================================
  // 故事圣经 — 全书稳定事实压缩
  // ============================================================

  // 更新故事圣经 — 三段式结构（world/character/timeline）
  // 对标参考项目 StoryBible.php
  // 每10章或全书结束时更新，增量压缩
  updateStoryBible(novel, chapIdx){
    this.init(novel);
    const m = novel.memory;
    const progress = (chapIdx + 1) / novel.chapterCount;

    // 每10章或最后1章更新
    if((chapIdx + 1) % 10 !== 0 && progress < 1) return;

    // 三段式结构
    const bible = {
      world: '',      // 世界规则：不可违反的核心设定
      character: '',  // 人物现状：主要角色当前状态
      timeline: '',   // 主线时间线：关键事件按顺序
      updatedChapter: chapIdx,
    };

    // 世界规则
    bible.world = novel.worldview?.slice(0, 300) || '';

    // 人物现状
    const charParts = [];
    for(const [name, card] of Object.entries(m.characterCards)){
      const status = card.status || '未知';
      const emotion = card.emotion || '未知';
      const location = card.location || '未知';
      charParts.push(`${name}：${status}（${emotion}，${location}）`);
    }
    bible.character = charParts.join('；').slice(0, 400);

    // 主线时间线（关键事件按顺序）
    const importantEvents = m.keyEvents.filter(e => e.importance !== 'normal');
    const timelineParts = [];
    for(const e of importantEvents.slice(-10)){
      timelineParts.push(`第${e.chapIdx+1}章：${(e.event||'').slice(0, 60)}`);
    }
    bible.timeline = timelineParts.join(' → ').slice(0, 400);

    // 序列化存储
    m.storyBible = `【世界规则】${bible.world}\n【人物现状】${bible.character}\n【主线时间线】${bible.timeline}`;
    m.storyBibleObj = bible;
  },

  // AI 故事圣经 — 全书稳定快照，注入 prompt 稳定前缀
  // 设计理念：每5章用 AI 压缩全书设定，给全书零漂移基准
  // AI 失败时保留旧版，避免设定回退
  async generateStoryBible(novel, aiCall){
    this.init(novel);
    const m = novel.memory;

    // 无 AI 回调时回退到规则版
    if(!aiCall || typeof aiCall !== 'function'){
      this.updateStoryBible(novel, (novel.chapters?.length || 1) - 1);
      return m.storyBible;
    }

    // 收集 AI 所需上下文
    const parts = [];
    if(novel.worldview) parts.push(`【世界观】${novel.worldview.slice(0, 300)}`);
    if(novel.characters) parts.push(`【主要角色】${novel.characters.slice(0, 400)}`);

    const charStatus = this.getCharacterCardsSummary(novel);
    if(charStatus) parts.push(`【人物现状】${charStatus.slice(0, 500)}`);

    const timeline = m.keyEvents
      .filter(e => e.importance !== 'normal')
      .slice(-10)
      .map(e => `第${e.chapIdx+1}章：${(e.event||'').slice(0, 60)}`)
      .join('\n');
    if(timeline) parts.push(`【关键事件】\n${timeline}`);

    parts.push(`【进度】${novel.chapters?.length || 0}/${novel.chapterCount || 0}章`);

    const prompt = `请基于以下信息生成不超过500字的故事圣经，严格包含三部分：
1. 世界规则：不可违反的核心设定
2. 人物现状：主要角色当前状态
3. 主线时间线：关键事件按顺序

${parts.join('\n')}

要求：只输出故事圣经，不要额外说明。`;

    try{
      const aiResult = await aiCall(prompt);
      const bible = (aiResult || '').trim();
      if(!bible || bible.length < 20) throw new Error('AI 返回内容过短');
      // AI 成功才覆盖，失败保留旧版
      m.storyBible = bible.slice(0, 500);
      return m.storyBible;
    }catch(e){
      console.warn('故事圣经 AI 调用失败，保留旧版', e);
      return m.storyBible;
    }
  },

  // ============================================================
  // 检索模型：构造 Prompt 上下文
  // ============================================================

  // 获取完整 Prompt 上下文 — 对标 getPromptContext()
  getPromptContext(novel, chapIdx){
    this.init(novel);
    const m = novel.memory;
    const context = {
      // P0 级
      globalSetting: this.buildGlobalSetting(novel),
      prevChapterTail: this.getPrevChapterTail(novel, chapIdx),
      characterStatus: this.getCharacterCardsSummary(novel),
      storyPotential: m.storyPotential,

      // P1 级
      arcSummaries: this.getArcSummariesText(novel, chapIdx),
      recentOutlines: this.getRecentOutlines(novel, chapIdx),
      foreshadowing: this.getForeshadowingText(novel, chapIdx),

      // P2 级
      keyEvents: this.getKeyEventsText(novel, chapIdx),
      storyBible: m.storyBible,

      // 伏笔回收指令
      foreshadowingResolve: this.getForeshadowingResolveText(novel, chapIdx),

      // 连贯性追踪字段
      deadCharacters: (novel.deadCharacters || []).map(d => d.character),
      lastLocation: novel.lastLocation?.location || null,
      emotionStates: novel.emotionStates || [],
      storyOutline: novel.storyOutline || null,

      // 钩子闭环：上章结尾钩子文本，供 PromptBuilder 强约束本章兑现
      prevEndHook: this.getPrevEndHook(novel, chapIdx),

      // 伏笔压力梯度：倒计时与到期伏笔，供 PromptBuilder 四层递进约束
      foreshadowingTimer: this.getForeshadowingTimer(novel, chapIdx),
      foreshadowingDue: this.getForeshadowingDue(novel, chapIdx),
    };
    return context;
  },

  // 增强版记忆上下文 — 在 getPromptContext 基础上增加因果链预警 + 语义搜索
  // 对标参考项目的 continuity checker，写章前注入预警避免连贯性事故
  // P1-1 集成：增加 semanticSearch 语义召回，丰富上下文
  async getEnhancedPromptContext(novel, chapIdx){
    const base = this.getPromptContext(novel, chapIdx);
    const causalChainWarnings = [];

    // 死角色复活检测
    try{
      const outline = novel.outline?.[chapIdx];
      const revivalWarnings = this.checkDeadCharRevival(novel, chapIdx, outline);
      causalChainWarnings.push(...revivalWarnings);
    }catch(e){ console.warn('死角色复活检测失败', e); }

    // 场景连续性检测
    try{
      const outline = novel.outline?.[chapIdx];
      const sceneWarning = this.checkSceneContinuity(novel, chapIdx, outline);
      if(sceneWarning) causalChainWarnings.push(sceneWarning);
    }catch(e){ console.warn('场景连续性检测失败', e); }

    // P1-1: 语义搜索 — 从已有记忆中召回与本章大纲相关的条目
    // 为什么用大纲作为查询：大纲包含本章核心情节，能召回最相关的记忆
    let semanticContext = [];
    try{
      const outline = novel.outline?.[chapIdx];
      const query = outline?.summary || outline?.title || '';
      if(query && query.length > 5){
        semanticContext = await this.semanticSearch(novel, query, 5);
      }
    }catch(e){ console.info('[MemoryEngine] semanticSearch 降级跳过', e); }

    return {
      ...base,
      causalChainWarnings,
      semanticContext,
    };
  },

  // 全局设定
  buildGlobalSetting(novel){
    const parts = [];
    if(novel.worldview) parts.push(`世界观：${novel.worldview.slice(0, 500)}`);
    if(novel.characters) parts.push(`主要角色：${novel.characters.slice(0, 500)}`);
    return parts.join('\n');
  },

  // 前一章尾文（最后200字）
  getPrevChapterTail(novel, chapIdx){
    if(chapIdx === 0) return '（本章为开篇，无前文）';
    const prev = novel.chapters[chapIdx - 1];
    if(!prev || !prev.content) return '';
    const content = prev.content;
    return content.slice(-300);
  },

  // 弧段摘要文本
  getArcSummariesText(novel, chapIdx){
    const m = novel.memory;
    if(m.arcSummaries.length === 0) return '';
    // 只取最近的弧段摘要
    const recent = m.arcSummaries.slice(-3);
    return recent.map(a =>
      `第${a.startChap+1}-${a.endChap+1}章弧段：${a.summary}`
    ).join('\n');
  },

  // 近章细纲（最近3章）
  getRecentOutlines(novel, chapIdx){
    if(!novel.outline || novel.outline.length === 0) return '';
    const start = Math.max(0, chapIdx - 3);
    const end = Math.min(novel.outline.length, chapIdx);
    const parts = [];
    for(let i = start; i < end; i++){
      const o = novel.outline[i];
      parts.push(`第${i+1}章《${o.title||''}》：${o.summary||''}`);
    }
    return parts.join('\n');
  },

  // 伏笔文本（待回收/临期/逾期）
  getForeshadowingText(novel, chapIdx){
    const m = novel.memory;
    const active = m.foreshadowing.filter(f => f.status !== 'resolved');
    if(active.length === 0) return '';

    const parts = [];
    for(const fs of active){
      let label = '';
      if(fs.status === 'overdue') label = '【逾期】';
      else if(fs.urgent) label = '【临期】';
      else if(fs.status === 'mentioned') label = '【已提及】';
      else label = '【待回收】';

      let deadlineInfo = '';
      if(fs.deadline !== null){
        const remaining = fs.deadline - chapIdx;
        deadlineInfo = `（剩余${remaining}章）`;
      }
      parts.push(`${label}${fs.desc}${deadlineInfo}`);
    }
    return parts.join('\n');
  },

  // 伏笔回收指令文本
  getForeshadowingResolveText(novel, chapIdx){
    const toResolve = this.resolveForeshadowingDecision(novel, chapIdx);
    if(toResolve.length === 0) return '';
    const parts = toResolve.map(fs =>
      `本章应回收伏笔：${fs.desc}（埋设于第${fs.plantedAt+1}章）`
    );
    return parts.join('\n');
  },

  // 上章结尾钩子 — 供 PromptBuilder 钩子闭环使用
  getPrevEndHook(novel, chapIdx){
    if(chapIdx === 0) return '';
    const prevOutline = novel.outline?.[chapIdx - 1];
    return prevOutline?.endHook || '';
  },

  // 伏笔倒计时 — 距回收点5章以内的未回收伏笔
  getForeshadowingTimer(novel, chapIdx){
    const m = novel.memory;
    if(!m?.foreshadowing) return [];
    return m.foreshadowing
      .filter(f => f.status !== 'resolved' && f.deadline !== null)
      .map(f => ({
        name: f.desc.slice(0, 20),
        chaptersLeft: f.deadline - chapIdx,
      }))
      .filter(f => f.chaptersLeft > 0 && f.chaptersLeft <= 5);
  },

  // 到期伏笔 — 已过回收点但仍未回收
  getForeshadowingDue(novel, chapIdx){
    const m = novel.memory;
    if(!m?.foreshadowing) return [];
    return m.foreshadowing
      .filter(f => f.status !== 'resolved' && f.deadline !== null && f.deadline <= chapIdx)
      .map(f => ({
        name: f.desc.slice(0, 20),
        hint: `埋设于第${f.plantedAt+1}章，已逾期`,
      }));
  },

  // 关键事件文本
  getKeyEventsText(novel, chapIdx){
    const m = novel.memory;
    if(m.keyEvents.length === 0) return '';
    // 只取最近5个关键事件
    const recent = m.keyEvents.slice(-5);
    return recent.map(e =>
      `第${e.chapIdx+1}章：${e.event?.slice(0, 80) || ''}`
    ).join('\n');
  },

  // ============================================================
  // 预算裁剪 — 对标 applyBudget()
  // P0硬上限兜底 → P2先裁 → P1后裁，每步实时计算总长度
  // ============================================================
  applyBudget(context, maxChars){
    const budget = maxChars || 8000;
    const result = { ...context };
    let total = this.estimateContextChars(result);

    if(total <= budget) return result;

    // Step 1: P0 硬上限兜底
    // 前章尾文最多占 30% budget
    const tailMax = Math.round(budget * 0.3);
    if(result.prevChapterTail && result.prevChapterTail.length > tailMax){
      result.prevChapterTail = result.prevChapterTail.slice(-tailMax);
    }
    // 人物状态最多占 20% budget
    const charMax = Math.round(budget * 0.2);
    if(result.characterStatus && result.characterStatus.length > charMax){
      result.characterStatus = result.characterStatus.slice(0, charMax);
    }
    // 故事势能最多 200 字
    total = this.estimateContextChars(result);

    // Step 2: P2 先裁（最低价值先丢）
    if(total > budget){
      // 关键事件：从最旧丢
      if(result.keyEvents){
        while(result.keyEvents.length > 100 && total > budget){
          result.keyEvents = result.keyEvents.split('\n').slice(1).join('\n');
          total = this.estimateContextChars(result);
        }
        if(total > budget){ result.keyEvents = ''; total = this.estimateContextChars(result); }
      }
      // 故事圣经：直接移除
      if(total > budget){ result.storyBible = ''; total = this.estimateContextChars(result); }
    }

    // Step 3: P1 后裁
    if(total > budget){
      // 近章细纲：8章 → 4章 → 2章
      if(result.recentOutlines){
        const lines = result.recentOutlines.split('\n');
        while(lines.length > 2 && total > budget){
          lines.shift();
          result.recentOutlines = lines.join('\n');
          total = this.estimateContextChars(result);
        }
        if(total > budget){ result.recentOutlines = ''; total = this.estimateContextChars(result); }
      }
    }

    if(total > budget){
      // 弧段摘要：逐步裁剪，至少保留 2 段
      if(result.arcSummaries){
        const lines = result.arcSummaries.split('\n');
        while(lines.length > 2 && total > budget){
          lines.shift();
          result.arcSummaries = lines.join('\n');
          total = this.estimateContextChars(result);
        }
        if(total > budget){ result.arcSummaries = ''; total = this.estimateContextChars(result); }
      }
    }

    if(total > budget){
      // 伏笔：从远期开始砍，至少保留 3 条
      if(result.foreshadowing){
        const lines = result.foreshadowing.split('\n');
        while(lines.length > 3 && total > budget){
          lines.pop();
          result.foreshadowing = lines.join('\n');
          total = this.estimateContextChars(result);
        }
      }
    }

    // Step 4: P0 极端缩减（最后手段）
    if(total > budget){
      result.globalSetting = result.globalSetting?.slice(0, 300) || '';
      result.prevChapterTail = result.prevChapterTail?.slice(0, 150) || '';
      result.characterStatus = result.characterStatus?.slice(0, 150) || '';
    }

    return result;
  },

  // 估算上下文字符数
  estimateContextChars(ctx){
    let total = 0;
    for(const v of Object.values(ctx)){
      if(typeof v === 'string') total += v.length;
      else if(typeof v === 'number') total += 10;
    }
    return total;
  },

  // ============================================================
  // 连贯性追踪 — 角色死亡 / 场景位置 / 情绪状态
  // 对标参考项目 CharacterCardRepo + ForeshadowingRepo
  // ============================================================

  // 角色死亡追踪 — 从正文检测死亡事件，更新 deadCharacters
  // 设计理念：死亡是不可逆事件，追踪后用于复活检测预警
  trackCharacterDeath(novel, chapIdx, content){
    this.init(novel);
    if(!novel.deadCharacters) novel.deadCharacters = [];

    const deathKeywords = ['死亡','陨落','身亡','断气','咽气','毙命','魂灭','形神俱灭'];
    const charNames = Object.keys(novel.memory.characterCards);

    // 按句子扫描，降低误判率
    const sentences = content.split(/[。！？\n]/);
    for(const sentence of sentences){
      // 句子必须同时包含死亡关键词和角色名才算有效事件
      let hasDeath = false;
      for(const kw of deathKeywords){
        if(sentence.includes(kw)){ hasDeath = true; break; }
      }
      if(!hasDeath) continue;

      for(const name of charNames){
        if(!sentence.includes(name)) continue;
        // 避免重复记录同一角色
        const exists = novel.deadCharacters.find(d => d.character === name);
        if(!exists){
          novel.deadCharacters.push({
            character: name,
            chapIdx,
            context: sentence.trim().slice(0, 100),
          });
        }
      }
    }
    return novel.deadCharacters;
  },

  // 死角色复活检测 — 大纲中出现已死角色且无复活描述时预警
  checkDeadCharRevival(novel, chapIdx, outline){
    this.init(novel);
    const warnings = [];
    if(!novel.deadCharacters || novel.deadCharacters.length === 0) return warnings;

    // outline 可能是字符串或对象
    const outlineText = typeof outline === 'string'
      ? outline
      : (outline?.summary || outline?.title || '');
    if(!outlineText) return warnings;

    // 有复活关键词则不预警
    const revivalKeywords = ['复活','重生','转世','夺舍'];
    const hasRevival = revivalKeywords.some(kw => outlineText.includes(kw));
    if(hasRevival) return warnings;

    for(const dead of novel.deadCharacters){
      if(outlineText.includes(dead.character)){
        warnings.push({
          character: dead.character,
          severity: 'high',
          message: `角色「${dead.character}」已于第${dead.chapIdx+1}章死亡，但本章大纲再次出现且无复活描述`,
        });
      }
    }
    return warnings;
  },

  // 场景位置追踪 — 从正文提取最后提到的地点
  // 设计理念：长篇易出现场景跳跃，追踪位置用于连续性检测
  trackSceneLocation(novel, chapIdx, content){
    this.init(novel);
    let lastLocation = null;

    // 优先匹配"在XXX中/里/内/前/后"模式
    const locationPattern = /在([^\s，。！？、（）()]{2,8})(?:之中|中|里|内|前|后)/g;
    let match;
    while((match = locationPattern.exec(content)) !== null){
      lastLocation = match[1];
    }

    // 其次匹配常见地点词，取最后一次出现
    if(!lastLocation){
      const commonLocations = [
        '宫殿','大厅','房间','森林','山脉','河流','湖泊','海洋',
        '城市','村庄','街道','广场','高塔','洞穴','山谷','悬崖',
        '草原','沙漠','雪山','花园','书房','卧室','厨房','地牢',
        '密室','战场','营地','酒楼','客栈','府邸','庄园','宗门',
        '门派','学院','王宫','皇宫','大殿','阁楼','庭院','城墙',
      ];
      let lastIdx = -1;
      let matchedLoc = null;
      for(const loc of commonLocations){
        const idx = content.lastIndexOf(loc);
        if(idx > lastIdx){
          lastIdx = idx;
          matchedLoc = loc;
        }
      }
      if(matchedLoc){
        // 尝试提取前置修饰词（如"黑暗森林"中的"黑暗"）
        let start = lastIdx;
        while(start > 0 && /[^\s，。！？、]/.test(content[start - 1])){
          start--;
          if(lastIdx - start >= 6) break;
        }
        lastLocation = content.substring(start, lastIdx + matchedLoc.length);
      }
    }

    if(lastLocation){
      novel.lastLocation = {
        location: lastLocation,
        chapIdx,
      };
      return lastLocation;
    }
    return null;
  },

  // 场景连续性检测 — 大纲未提及上章位置且无转场时预警
  checkSceneContinuity(novel, chapIdx, outline){
    this.init(novel);
    if(!novel.lastLocation || chapIdx === 0) return null;

    const outlineText = typeof outline === 'string'
      ? outline
      : (outline?.summary || outline?.title || '');
    if(!outlineText) return null;

    // 大纲已提及上章位置，视为连续
    const lastLoc = novel.lastLocation.location;
    if(outlineText.includes(lastLoc)) return null;

    // 有转场关键词则视为合理切换
    const transitionKeywords = ['来到','前往','抵达','离开','回到','传送'];
    const hasTransition = transitionKeywords.some(kw => outlineText.includes(kw));
    if(hasTransition) return null;

    return {
      severity: 'medium',
      message: `上章结尾位置为「${lastLoc}」，本章大纲未提及且无转场描述，可能场景断裂`,
    };
  },

  // 情绪追踪 — 从正文检测主要角色情绪变化
  // 设计理念：情绪连贯是角色真实感的关键，追踪后注入 prompt
  trackEmotionState(novel, chapIdx, content){
    this.init(novel);
    if(!novel.emotionStates) novel.emotionStates = [];

    // P1-2 修复：使用 EmotionDictionary 的关键词表替代内联 emotionMap，消除重复
    // 为什么改：原 emotionMap 与 EmotionDictionary.EMOTION_WORDS 重复维护，统一为单一数据源
    const emotionMap = (typeof EmotionDictionary !== 'undefined' && EmotionDictionary.EMOTION_WORDS)
      ? EmotionDictionary.EMOTION_WORDS
      : {
        '愤怒': ['愤怒','暴怒','怒火','气愤','恼怒','震怒','怒不可遏'],
        '悲伤': ['悲伤','悲痛','哀伤','凄凉','伤心','落泪','泪流满面'],
        '喜悦': ['喜悦','高兴','开心','欢喜','欣慰','雀跃','喜笑颜开'],
        '恐惧': ['恐惧','害怕','惊恐','畏惧','胆寒','不寒而栗','毛骨悚然'],
        '惊讶': ['惊讶','震惊','诧异','愕然','大吃一惊','目瞪口呆'],
        '厌恶': ['厌恶','讨厌','反感','憎恶','厌烦','作呕'],
        '期待': ['期待','期盼','盼望','渴望','企盼','拭目以待'],
        '绝望': ['绝望','心灰意冷','万念俱灰','崩溃','无望','走投无路'],
        '平静': ['平静','淡然','从容','镇定','心如止水','波澜不惊'],
        '兴奋': ['兴奋','激动','振奋','热血沸腾','心潮澎湃','摩拳擦掌'],
      };

    const charNames = Object.keys(novel.memory.characterCards);
    const sentences = content.split(/[。！？\n]/);
    const results = [];

    for(const name of charNames){
      let detectedEmotion = null;
      let maxIntensity = 0;

      for(const sentence of sentences){
        if(!sentence.includes(name)) continue;
        for(const [emotion, keywords] of Object.entries(emotionMap)){
          for(const kw of keywords){
            if(!sentence.includes(kw)) continue;
            // 强度估算：修饰词加权
            let intensity = 5;
            if(/十分|非常|极度|无比|异常/.test(sentence)) intensity = 8;
            else if(/一丝|微微|有些|略微/.test(sentence)) intensity = 3;
            if(intensity > maxIntensity){
              maxIntensity = intensity;
              detectedEmotion = emotion;
            }
          }
        }
      }

      if(detectedEmotion){
        results.push({
          character: name,
          emotion: detectedEmotion,
          intensity: maxIntensity,
          chapIdx,
        });
      }
    }

    // 更新持久状态：每角色只保留最新情绪
    for(const r of results){
      const card = novel.memory.characterCards[r.character];
      if(card) card.emotion = r.emotion;
      novel.emotionStates = novel.emotionStates.filter(e => e.character !== r.character);
      novel.emotionStates.push(r);
    }

    // P1-2 修复：直接调用 EmotionDictionary.countEmotionDensity() 计算全章情绪密度
    // 为什么改：原通过 getEmotionDetails 间接调用，v4 计划要求直接调用 countEmotionDensity
    try{
      if(typeof EmotionDictionary !== 'undefined' && EmotionDictionary.countEmotionDensity){
        const density = EmotionDictionary.countEmotionDensity(content);
        if(density && density.total > 0){
          // 保存到章节情绪记录
          if(!novel.chapterEmotions) novel.chapterEmotions = [];
          novel.chapterEmotions[chapIdx] = {
            dominant: density.dominant,
            dominantLabel: density.dominantLabel || density.dominant,
            density: density.density,
            total: density.total,
            distribution: density.distribution,
          };
        }
      }
    }catch(e){ /* EmotionDictionary 未加载时静默降级 */ }

    return results;
  },

  // ============================================================
  // 章节重写时的回滚 — 对标参考项目的幂等策略
  // ============================================================
  rollbackChapter(novel, chapIdx){
    this.init(novel);
    const m = novel.memory;

    // 移除该章的关键事件
    m.keyEvents = m.keyEvents.filter(e => e.chapIdx !== chapIdx);

    // 移除该章的伏笔提及记录
    for(const fs of m.foreshadowing){
      fs.mentions = fs.mentions.filter(idx => idx !== chapIdx);
      // 如果该章是唯一提及，回退状态
      if(fs.mentions.length === 0 && fs.status === 'mentioned'){
        fs.status = 'open';
      }
    }

    // 移除该章的人物出场记录
    for(const card of Object.values(m.characterCards)){
      if(card.history){
        card.history = card.history.filter(h => h.chapIdx !== chapIdx);
      }
    }

    // 移除该章所在弧段的摘要（如果弧段终点 <= chapIdx 则保留）
    // 弧段摘要在 chapIdx 所在弧段未完成时不影响
  },

  // ============================================================
  // 语义搜索 — 对标 Reference-php MemoryEngine.semanticSearch() 第 982-1132 行
  // 优先使用 AI embedding，降级到 TF-IDF 关键词匹配
  // ============================================================
  async semanticSearch(novel, query, topK = 5){
    this.init(novel);
    const m = novel.memory;
    if(!m) return [];

    // 收集所有可搜索的记忆条目
    const items = [];

    // 关键事件
    for(const ev of m.keyEvents || []){
      items.push({
        type: 'event',
        text: ev.summary || ev.content || '',
        chapIdx: ev.chapIdx,
        data: ev,
      });
    }

    // 角色卡
    for(const [name, card] of Object.entries(m.characterCards || {})){
      items.push({
        type: 'character',
        text: `${name} ${card.personality || ''} ${card.background || ''} ${card.emotion || ''}`,
        chapIdx: card.lastSeen,
        data: card,
      });
    }

    // 知识库条目 — 跨对象调用 KnowledgeBase.getCharacters
    if(m.knowledgeBase){
      for(const kbItem of KnowledgeBase.getCharacters(m.knowledgeBase) || []){
        items.push({
          type: 'kb_character',
          text: `${kbItem.name} ${kbItem.personality || ''} ${kbItem.background || ''}`,
          data: kbItem,
        });
      }
    }

    if(items.length === 0) return [];

    // 尝试 AI embedding
    try{
      const queryEmbedding = await EmbeddingProvider.embed(query);
      if(queryEmbedding && queryEmbedding.source === 'api'){
        // API embedding 可用：计算所有条目的 embedding
        const texts = items.map(i => i.text);
        const embeddings = await EmbeddingProvider.embedBatch(texts);
        const vectors = [];
        for(let i = 0; i < items.length; i++){
          if(embeddings[i]){
            vectors.push({
              ...items[i],
              vector: embeddings[i].vector,
            });
          }
        }
        const results = Vector.topK(vectors, queryEmbedding.vector, topK);
        return results.map(r => ({
          ...r.data,
          similarity: r.similarity,
          source: 'embedding',
        }));
      }
    }catch(e){
      console.info('[MemoryEngine] semanticSearch embedding 降级到 TF-IDF');
    }

    // TF-IDF 降级
    const texts = items.map(i => i.text);
    const vocab = Vector.buildVocab([...texts, query]);
    const idf = Vector.computeIDF(texts, vocab);
    const queryVec = Vector.computeTFIDF(query, vocab, idf);
    const vectors = items.map((item, idx) => ({
      ...item,
      vector: Vector.computeTFIDF(item.text, vocab, idf),
    }));
    const results = Vector.topK(vectors, queryVec, topK);
    return results.map(r => ({
      ...r.data,
      similarity: r.similarity,
      source: 'tfidf',
    }));
  },
};

// ============================================================
// AtomRepo — 长尾原子记忆仓储
// 对标参考项目 AtomRepo.php
// 存储 character_trait / world_setting / plot_detail / style_preference /
// constraint / technique / world_state / cool_point
// 数据挂载在 novel.memory.atoms 数组
// ============================================================
const AtomRepo = {

  VALID_TYPES: [
    'character_trait', 'world_setting', 'plot_detail',
    'style_preference', 'constraint', 'technique', 'world_state', 'cool_point',
  ],

  init(novel){
    MemoryEngine.init(novel);
  },

  // 插入一条 atom（指纹去重）
  add(novel, type, content, sourceChapter, confidence, metadata){
    if(!this.VALID_TYPES.includes(type)) return -1;
    content = (content || '').trim();
    if(content === '') return -1;
    this.init(novel);
    const m = novel.memory;
    const fp = content.slice(0, 60);
    const exists = m.atoms.find(a => a.atom_type === type && a.content.startsWith(fp));
    if(exists) return exists.id;

    const id = 'atom-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6);
    m.atoms.push({
      id,
      novel_id: novel.id,
      atom_type: type,
      content,
      source_chapter: sourceChapter ?? null,
      confidence: confidence ?? 0.8,
      metadata: metadata || {},
      created_at: Date.now(),
    });
    return id;
  },

  // 批量插入
  addBatch(novel, atoms){
    let n = 0;
    for(const a of atoms){
      const id = this.add(novel, a.type, a.content, a.chapter, a.confidence, a.metadata);
      if(id !== -1) n++;
    }
    return n;
  },

  // 列出所有 atoms（支持类型和章节过滤）
  listAll(novel, type, chapter, limit = 50){
    this.init(novel);
    let atoms = [...novel.memory.atoms];
    if(type) atoms = atoms.filter(a => a.atom_type === type);
    if(chapter !== undefined) atoms = atoms.filter(a => a.source_chapter === chapter);
    atoms.sort((a, b) => (b.source_chapter ?? 0) - (a.source_chapter ?? 0));
    return atoms.slice(0, limit);
  },

  // 取最近 N 条某类型 atom
  latestByType(novel, type, limit = 20, beforeChapter){
    this.init(novel);
    let atoms = novel.memory.atoms.filter(a => a.atom_type === type);
    if(beforeChapter !== undefined){
      atoms = atoms.filter(a => a.source_chapter === null || a.source_chapter <= beforeChapter);
    }
    atoms.sort((a, b) => (b.source_chapter ?? 0) - (a.source_chapter ?? 0));
    return atoms.slice(0, limit);
  },

  // 关键词搜索
  search(novel, keyword, type, limit = 10, beforeChapter){
    this.init(novel);
    keyword = (keyword || '').trim();
    if(keyword === '') return [];
    let atoms = novel.memory.atoms.filter(a => a.content.includes(keyword));
    if(type) atoms = atoms.filter(a => a.atom_type === type);
    if(beforeChapter !== undefined){
      atoms = atoms.filter(a => a.source_chapter === null || a.source_chapter <= beforeChapter);
    }
    atoms.sort((a, b) => b.confidence - a.confidence);
    return atoms.slice(0, limit);
  },

  // 删除单条
  delete(novel, atomId){
    this.init(novel);
    const idx = novel.memory.atoms.findIndex(a => a.id === atomId);
    if(idx >= 0){ novel.memory.atoms.splice(idx, 1); return true; }
    return false;
  },

  // 更新内容
  updateContent(novel, atomId, content, atomType){
    this.init(novel);
    const atom = novel.memory.atoms.find(a => a.id === atomId);
    if(!atom) return false;
    atom.content = (content || '').trim();
    if(atomType && this.VALID_TYPES.includes(atomType)) atom.atom_type = atomType;
    return true;
  },

  // 统计各类型数量
  countByType(novel){
    this.init(novel);
    const counts = {};
    for(const a of novel.memory.atoms){
      counts[a.atom_type] = (counts[a.atom_type] || 0) + 1;
    }
    return counts;
  },

  // 取候选集（给向量检索用）
  listForVector(novel, type, beforeChapter, limit = 500){
    this.init(novel);
    let atoms = [...novel.memory.atoms];
    if(type) atoms = atoms.filter(a => a.atom_type === type);
    if(beforeChapter !== undefined){
      atoms = atoms.filter(a => a.source_chapter === null || a.source_chapter <= beforeChapter);
    }
    return atoms.slice(-limit).reverse();
  },
};

// ============================================================
// CatchphraseRepo — 金句调度仓储
// 对标参考项目 CatchphraseRepo.php
// 数据挂载在 novel.memory.catchphrases 数组
// ============================================================
const CatchphraseRepo = {

  init(novel){
    MemoryEngine.init(novel);
  },

  // 插入一条金句（去重）
  add(novel, phrase, speaker, chapterNum, importance = 'normal'){
    phrase = (phrase || '').trim();
    if(phrase === '' || phrase.length > 255) return -1;
    this.init(novel);
    const validImportance = ['iconic', 'normal', 'minor'];
    if(!validImportance.includes(importance)) importance = 'normal';

    const m = novel.memory;
    const exists = m.catchphrases.find(c => c.phrase === phrase);
    if(exists) return exists.id;

    const id = 'cp-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6);
    m.catchphrases.push({
      id,
      novel_id: novel.id,
      phrase,
      speaker: speaker || null,
      first_chapter: chapterNum,
      callback_count: 0,
      last_callback_chapter: null,
      importance,
      created_at: Date.now(),
    });
    return id;
  },

  // 记录 callback
  recordCallback(novel, phraseId, chapterNum){
    this.init(novel);
    const cp = novel.memory.catchphrases.find(c => c.id === phraseId);
    if(!cp) return;
    cp.callback_count++;
    cp.last_callback_chapter = chapterNum;
  },

  // 获取可用于 callback 的金句列表
  listForCallback(novel, currentChapter, limit = 10){
    this.init(novel);
    const phrases = novel.memory.catchphrases
      .filter(c => c.first_chapter < currentChapter)
      .sort((a, b) => {
        const impOrder = { iconic: 0, normal: 1, minor: 2 };
        const diff = (impOrder[a.importance] ?? 1) - (impOrder[b.importance] ?? 1);
        if(diff !== 0) return diff;
        return a.callback_count - b.callback_count;
      });
    return phrases.slice(0, limit);
  },

  // 获取所有金句
  listAll(novel){
    this.init(novel);
    return [...novel.memory.catchphrases].sort((a, b) => a.first_chapter - b.first_chapter);
  },

  // 删除一条
  delete(novel, phraseId){
    this.init(novel);
    const idx = novel.memory.catchphrases.findIndex(c => c.id === phraseId);
    if(idx >= 0){ novel.memory.catchphrases.splice(idx, 1); return true; }
    return false;
  },

  // 构建金句 prompt 注入段落
  buildCallbackSection(novel, currentChapter){
    const phrases = this.listForCallback(novel, currentChapter, 8);
    if(phrases.length === 0) return '';

    const lines = [];
    for(const p of phrases){
      const speaker = p.speaker ? `（${p.speaker}）` : '';
      const cbInfo = p.callback_count > 0 ? `已callback ${p.callback_count}次` : '未callback';
      lines.push(`· 第${p.first_chapter}章${speaker}：「${p.phrase}」（${cbInfo}）`);
    }

    let section = '【可调用金句（建议在恰当场景 callback，强化角色记忆点）】\n';
    section += lines.join('\n') + '\n';
    section += '如果本章是高潮/转折，建议让角色 callback 自己之前说过的金句，增加读者上头感。\n\n';

    return section;
  },

  // 从章节正文中检测金句 callback
  trackCallbacksInContent(novel, content, chapterNum){
    this.init(novel);
    const phrases = novel.memory.catchphrases.filter(c => c.first_chapter < chapterNum);
    if(phrases.length === 0) return 0;

    let matched = 0;
    for(const p of phrases){
      const clean = p.phrase.replace(/[\s\u3000-\u303f\uff01-\uff5e\u2018-\u201f\u300a-\u3011]+/g, '');
      const kw = clean.slice(0, 15);
      if(kw.length < 4) continue;
      if(content.includes(kw)){
        this.recordCallback(novel, p.id, chapterNum);
        matched++;
      }
    }
    return matched;
  },
};

// ============================================================
// SceneTemplateRepo — 场景模板调度仓储
// 对标参考项目 SceneTemplateRepo.php
// 跟踪场景模板使用历史，防止过度重复
// 数据挂载在 novel.memory.sceneTemplates 数组
// ============================================================

// 场景模板定义（对标 SCENE_TEMPLATES 常量）
const SCENE_TEMPLATES = {
  'underdog_win': { name: '逆袭翻盘', cool_type: 'underdog_win', max_uses: 0, cooldown: 5 },
  'face_slap': { name: '打脸', cool_type: 'face_slap', max_uses: 0, cooldown: 3 },
  'treasure_find': { name: '获宝', cool_type: 'treasure_find', max_uses: 0, cooldown: 8 },
  'breakthrough': { name: '突破', cool_type: 'breakthrough', max_uses: 0, cooldown: 5 },
  'power_expand': { name: '势力扩张', cool_type: 'power_expand', max_uses: 0, cooldown: 10 },
  'romance_win': { name: '情感突破', cool_type: 'romance_win', max_uses: 0, cooldown: 10 },
  'wisdom_win': { name: '智斗胜利', cool_type: 'wisdom_win', max_uses: 0, cooldown: 5 },
  'mystery_reveal': { name: '揭秘', cool_type: 'mystery_reveal', max_uses: 0, cooldown: 8 },
};

const SceneTemplateRepo = {

  init(novel){
    MemoryEngine.init(novel);
  },

  // 记录场景模板使用
  add(novel, templateId, chapterNumber){
    this.init(novel);
    novel.memory.sceneTemplates.push({
      novel_id: novel.id,
      chapter_number: chapterNumber,
      template_id: templateId,
      cool_point_type: SCENE_TEMPLATES[templateId]?.cool_type || templateId,
      created_at: Date.now(),
    });
  },

  // 批量记录
  batchAdd(novel, templateIds, chapterNumber){
    let count = 0;
    for(const tid of templateIds){
      if(!SCENE_TEMPLATES[tid]) continue;
      try{ this.add(novel, tid, chapterNumber); count++; }catch(e){}
    }
    return count;
  },

  // 获取模板使用历史
  getTemplateHistory(novel){
    this.init(novel);
    const history = {};
    for(const r of novel.memory.sceneTemplates){
      const tid = r.template_id;
      if(!history[tid]){
        history[tid] = { template_id: tid, use_count: 0, chapters: [], last_chapter: 0 };
      }
      history[tid].use_count++;
      history[tid].chapters.push(r.chapter_number);
      history[tid].last_chapter = r.chapter_number;
    }
    return history;
  },

  // 获取已耗尽的模板
  getExhaustedTemplates(novel){
    const history = this.getTemplateHistory(novel);
    const exhausted = {};
    for(const [tid, info] of Object.entries(history)){
      const tpl = SCENE_TEMPLATES[tid];
      if(!tpl) continue;
      const maxUses = tpl.max_uses || 0;
      if(maxUses > 0 && info.use_count >= maxUses){
        exhausted[tid] = {
          name: tpl.name,
          cool_type: tpl.cool_type,
          use_count: info.use_count,
          max_uses: maxUses,
          last_chapter: info.last_chapter,
        };
      }
    }
    return exhausted;
  },

  // 获取最近使用的模板
  getRecentlyUsedTemplates(novel, currentChapter, lookback = 20){
    this.init(novel);
    const from = Math.max(1, currentChapter - lookback);
    return novel.memory.sceneTemplates
      .filter(r => r.chapter_number >= from && r.chapter_number < currentChapter)
      .map(r => ({ template_id: r.template_id, chapter_number: r.chapter_number }));
  },

  // 获取可用替代模板（同 cool_type，排除冷却中）
  getAlternativeTemplates(novel, coolType, currentChapter){
    const history = this.getTemplateHistory(novel);
    const alternatives = [];

    for(const [tid, tpl] of Object.entries(SCENE_TEMPLATES)){
      if(tpl.cool_type !== coolType) continue;

      const info = history[tid];
      const useCount = info?.use_count ?? 0;
      const lastChapter = info?.last_chapter ?? 0;
      const maxUses = tpl.max_uses || 0;
      const cooldown = tpl.cooldown || 0;

      if(maxUses > 0 && useCount >= maxUses) continue;
      if(cooldown > 0 && lastChapter > 0 && (currentChapter - lastChapter) < cooldown) continue;

      const gap = lastChapter > 0 ? currentChapter - lastChapter : 9999;
      alternatives.push({
        template_id: tid,
        name: tpl.name,
        use_count: useCount,
        gap,
      });
    }

    alternatives.sort((a, b) => b.gap - a.gap);
    return alternatives;
  },

  // 统计某模板使用次数
  countUsage(novel, templateId){
    this.init(novel);
    return novel.memory.sceneTemplates.filter(r => r.template_id === templateId).length;
  },
};

// ============================================================
// KnowledgeBase - 知识库规范化管理
// 对标参考项目 knowledge-base.js
//
// 4类结构化知识：角色 / 世界观 / 情节 / 风格
// 核心能力：类型规范化 + 去重合并 + AI提取(可选)
//
// 数据存储在 novel.memory.knowledgeBase 中：
//   { characters:[], worldbuilding:[], plots:[], styles:[] }
// ============================================================
const KnowledgeBase = {

  // ── 类型规范化映射 ──
  // 为什么用映射：AI 返回的中文类型需要统一为英文常量，便于后续逻辑判断
  ROLE_TYPE_MAP: {
    '主角':'protagonist', '主要角色':'major', '配角':'minor', '背景':'background',
    protagonist:'protagonist', major:'major', minor:'minor', background:'background',
  },
  WORLD_CATEGORY_MAP: {
    '地点':'location', '位置':'location', '场所':'location', '场景':'location',
    '势力':'faction', '组织':'faction', '宗门':'faction', '帮派':'faction', '国家':'faction', '家族':'faction',
    '规则':'rule', '法则':'rule', '系统':'rule', '设定':'rule',
    '物品':'item', '道具':'item', '法宝':'item', '丹药':'item',
    location:'location', faction:'faction', rule:'rule', item:'item',
  },
  EVENT_TYPE_MAP: {
    '主线':'main', '支线':'subplot', '伏笔':'foreshadowing', '回收':'callback',
    main:'main', subplot:'subplot', foreshadowing:'foreshadowing', callback:'callback',
  },
  STYLE_CATEGORY_MAP: {
    '叙述':'narrative', '对话':'dialogue', '描写':'description', '情感':'emotion',
    narrative:'narrative', dialogue:'dialogue', description:'description', emotion:'emotion',
  },

  // ── 规范化函数 ──
  normalizeRoleType(type){
    if(!type) return 'minor';
    return this.ROLE_TYPE_MAP[type] || this.ROLE_TYPE_MAP[String(type)] || 'minor';
  },
  normalizeWorldCategory(cat){
    if(!cat) return 'other';
    const lowered = String(cat).toLowerCase();
    for(const [key, value] of Object.entries(this.WORLD_CATEGORY_MAP)){
      if(lowered.includes(key.toLowerCase())) return value;
    }
    return 'other';
  },
  normalizeEventType(type){
    if(!type) return 'main';
    return this.EVENT_TYPE_MAP[type] || this.EVENT_TYPE_MAP[String(type)] || 'other';
  },
  normalizeStyleCategory(cat){
    if(!cat) return 'other';
    return this.STYLE_CATEGORY_MAP[cat] || this.STYLE_CATEGORY_MAP[String(cat)] || 'other';
  },

  // ── 合并：仅覆盖非空字段 ──
  // 为什么不直接覆盖：避免新数据中缺失的字段清空已有数据
  mergeNonEmpty(existing, newData, skipKeys){
    skipKeys = skipKeys || [];
    for(const [k, v] of Object.entries(newData)){
      if(skipKeys.includes(k)) continue;
      if(v === null || v === undefined || v === '') continue;
      if(Array.isArray(v) && v.length === 0) continue;
      existing[k] = v;
    }
    return existing;
  },

  // ── 去重查找 ──
  // 角色按 name 去重，其他按 name+category 去重
  findExisting(kb, type, item){
    const list = kb[type] || [];
    if(type === 'characters'){
      return list.find(e => e.name === item.name);
    }
    return list.find(e => e.name === item.name && e.category === item.category);
  },

  // ── 保存单条知识（去重+合并）──
  save(kb, type, data){
    if(!kb[type]) kb[type] = [];

    // 规范化类型字段
    const normalized = { ...data };
    if(type === 'characters'){
      normalized.role_type = this.normalizeRoleType(data.role_type);
    } else if(type === 'worldbuilding'){
      normalized.category = this.normalizeWorldCategory(data.category);
    } else if(type === 'plots'){
      normalized.event_type = this.normalizeEventType(data.event_type);
    } else if(type === 'styles'){
      normalized.category = this.normalizeStyleCategory(data.category);
    }

    const existing = this.findExisting(kb, type, normalized);
    if(existing){
      // 合并：仅覆盖非空字段，递增出场次数
      this.mergeNonEmpty(existing, normalized, ['name', 'category', 'first_appear']);
      if(type === 'characters'){
        existing.appear_count = (existing.appear_count || 1) + 1;
        if(data.source_chapter) existing.last_appear = data.source_chapter;
      }
      return existing;
    }

    // 新增
    if(type === 'characters'){
      normalized.appear_count = 1;
      if(!normalized.first_appear && data.source_chapter) normalized.first_appear = data.source_chapter;
    }
    kb[type].push(normalized);
    return normalized;
  },

  // ── 从章节内容提取知识 ──
  // 有 AI 回调时用 AI 提取（结构化），无 AI 时用正则回退（基础提取）
  async extractFromChapter(novel, chapIdx, content, aiCall){
    MemoryEngine.init(novel);
    const kb = novel.memory.knowledgeBase;
    const stats = { characters:0, worldbuilding:0, plots:0, styles:0 };

    if(!content || content.trim().length < 200) return stats;

    // AI 提取路径
    if(aiCall && typeof aiCall === 'function'){
      const result = await this.aiExtract(novel, chapIdx, content, aiCall);
      if(result){
        for(const c of (result.characters || [])){
          if(!c?.name) continue;
          c.source_chapter = chapIdx + 1;
          c.last_appear = chapIdx + 1;
          if(!c.first_appear) c.first_appear = chapIdx + 1;
          this.save(kb, 'characters', c);
          stats.characters++;
        }
        for(const w of (result.worldbuilding || [])){
          if(!w?.name) continue;
          this.save(kb, 'worldbuilding', w);
          stats.worldbuilding++;
        }
        for(const p of (result.plots || [])){
          if(!p?.title) continue;
          p.name = p.title;
          if(!p.chapter_from) p.chapter_from = chapIdx + 1;
          this.save(kb, 'plots', p);
          stats.plots++;
        }
        for(const s of (result.styles || [])){
          if(!s?.name) continue;
          this.save(kb, 'styles', s);
          stats.styles++;
        }
        return stats;
      }
    }

    // 正则回退路径：从人物卡中同步角色，从正文提取基础世界观元素
    this.regexExtract(novel, chapIdx, content, kb, stats);
    return stats;
  },

  // AI 提取 — 构建结构化提取 Prompt
  async aiExtract(novel, chapIdx, content, aiCall){
    const excerpt = content.length > 3000 ? content.slice(0, 3000) : content;
    const prompt = [
      '你是一位专业的小说编辑，请从以下章节内容中提取结构化知识。只输出纯JSON，无前缀后缀。',
      '',
      '请提取以下四类信息并输出一个JSON对象：',
      '{',
      '  "characters": [',
      '    {"name":"角色名","alias":"别名","role_type":"protagonist/major/minor/background","gender":"性别","appearance":"外貌描述","personality":"性格特点","background":"背景故事","abilities":"能力技能","relationships":{"角色名":"关系描述"}}',
      '  ],',
      '  "worldbuilding": [',
      '    {"name":"名称","category":"location/faction/rule/item/other","description":"详细描述","importance":3}',
      '  ],',
      '  "plots": [',
      '    {"title":"事件标题","event_type":"main/subplot/foreshadowing/callback","description":"事件描述","characters":["角色名"],"importance":3}',
      '  ],',
      '  "styles": [',
      '    {"name":"风格特点名称","category":"narrative/dialogue/description/emotion/other","content":"具体描述或示例"}',
      '  ]',
      '}',
      '',
      '规则：',
      '1. 只提取本章新出现或有变化的要素',
      '2. 未出现的类别返回空数组[]',
      '3. name 字段必填，其他字段可选',
      '4. 角色关系填写在 relationships 对象中',
      '',
      `【第${chapIdx + 1}章正文（首3000字）】`,
      excerpt,
    ].join('\n');

    try{
      const raw = await aiCall(prompt);
      let cleaned = (raw || '').trim();
      // 清理 markdown 包裹
      if(cleaned.startsWith('```')){
        cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '');
      }
      return JSON.parse(cleaned);
    }catch(e){
      console.warn('[KB] AI提取失败，回退正则模式', e.message);
      return null;
    }
  },

  // 正则回退提取 — 无 AI 时从已有数据源同步
  regexExtract(novel, chapIdx, content, kb, stats){
    // 1. 从人物卡同步角色知识
    const cards = novel.memory.characterCards;
    for(const [name, card] of Object.entries(cards)){
      const existing = kb.characters.find(c => c.name === name);
      if(!existing){
        this.save(kb, 'characters', {
          name,
          role_type: card.role || 'minor',
          personality: card.personality || '',
          abilities: card.abilities || '',
          first_appear: card.firstAppearChap !== undefined ? card.firstAppearChap + 1 : 1,
          source_chapter: chapIdx + 1,
        });
        stats.characters++;
      } else {
        existing.last_appear = chapIdx + 1;
        existing.appear_count = (existing.appear_count || 1) + 1;
      }
    }

    // 2. 从正文提取地点关键词（简化版）
    const locationPattern = /(?:来到|抵达|进入|离开|返回|前往)([^\s，。！？、的]{2,8}(?:城|镇|村|山|谷|宫|殿|阁|楼|院|府|门|派|宗))/g;
    const locations = new Set();
    let match;
    while((match = locationPattern.exec(content)) !== null){
      locations.add(match[1]);
    }
    for(const loc of locations){
      const existing = kb.worldbuilding.find(w => w.name === loc && w.category === 'location');
      if(!existing){
        this.save(kb, 'worldbuilding', { name: loc, category: 'location', description: '', importance: 2 });
        stats.worldbuilding++;
      }
    }

    // 3. 从伏笔列表同步情节知识
    for(const fs of (novel.memory.foreshadowing || [])){
      if(fs.plantedAt === chapIdx){
        const existing = kb.plots.find(p => p.name === fs.desc);
        if(!existing){
          this.save(kb, 'plots', {
            name: fs.desc,
            title: fs.desc,
            event_type: 'foreshadowing',
            chapter_from: chapIdx + 1,
            description: fs.desc,
            status: fs.status,
            importance: fs.priority || 3,
          });
          stats.plots++;
        }
      }
    }
  },

  // ── 查询接口 ──
  getCharacters(kb, roleType){
    let list = kb.characters || [];
    if(roleType) list = list.filter(c => c.role_type === roleType);
    return list.sort((a, b) => (b.appear_count || 0) - (a.appear_count || 0));
  },
  getWorldbuilding(kb, category){
    let list = kb.worldbuilding || [];
    if(category) list = list.filter(w => w.category === category);
    return list.sort((a, b) => (b.importance || 0) - (a.importance || 0));
  },
  getPlots(kb, eventType, status){
    let list = kb.plots || [];
    if(eventType) list = list.filter(p => p.event_type === eventType);
    if(status) list = list.filter(p => p.status === status);
    return list.sort((a, b) => (a.chapter_from || 0) - (b.chapter_from || 0));
  },
  getStyles(kb, category){
    let list = kb.styles || [];
    if(category) list = list.filter(s => s.category === category);
    return list;
  },

  // ── 生成知识库摘要（用于 Prompt 注入）──
  buildKnowledgeSummary(kb, maxChars = 800){
    const parts = [];

    // 角色摘要：按出场频率取前5
    const chars = this.getCharacters(kb).slice(0, 5);
    if(chars.length > 0){
      const charSummary = chars.map(c => {
        const role = c.role_type === 'protagonist' ? '主角' : c.role_type === 'major' ? '主要' : '配角';
        return `${c.name}(${role})${c.personality ? ':' + c.personality.slice(0, 30) : ''}`;
      }).join('、');
      parts.push(`【角色】${charSummary}`);
    }

    // 世界观摘要：按重要度取前5
    const worlds = this.getWorldbuilding(kb).slice(0, 5);
    if(worlds.length > 0){
      const worldSummary = worlds.map(w => `${w.name}(${w.category})`).join('、');
      parts.push(`【世界观】${worldSummary}`);
    }

    // 活跃伏笔摘要
    const plots = this.getPlots(kb, 'foreshadowing', 'active').slice(0, 3);
    if(plots.length > 0){
      const plotSummary = plots.map(p => p.name).join('、');
      parts.push(`【活跃伏笔】${plotSummary}`);
    }

    let result = parts.join('\n');
    if(result.length > maxChars) result = result.slice(0, maxChars);
    return result;
  },
};

window.MemoryEngine = MemoryEngine;
window.KnowledgeBase = KnowledgeBase;
window.AtomRepo = AtomRepo;
window.CatchphraseRepo = CatchphraseRepo;
window.SceneTemplateRepo = SceneTemplateRepo;
window.SCENE_TEMPLATES = SCENE_TEMPLATES;
