/* ============================================================
 * PromptBuilder - 分层 Prompt 构建器
 *
 * 设计理念（对标参考项目 ChapterPromptBuilder.php）：
 *   Prompt 不是静态模板，而是多段落装配器。
 *   System/User 分层；稳定前缀提高缓存命中；动态尾部利用尾部注意力。
 *
 * 装配策略：
 *   ┌─ System Prompt（按章节阶段降级）──────────────┐
 *   │  full(1-5章) / compact(6-20章) / minimal(21+章) │
 *   └────────────────────────────────────────────────┘
 *   ┌─ User Prompt ──────────────────────────────────┐
 *   │  [稳定前缀] 世界观 + 角色 + 风格范本             │  ← 缓存命中区
 *   │  [动态中部] 本章细纲 + 记忆上下文 + 伏笔         │
 *   │  [动态尾部] 字数约束 + 节奏 + Agent指令 + 开始   │  ← 尾部注意力
 *   └────────────────────────────────────────────────┘
 * ============================================================ */

const PromptBuilder = {

  // ============================================================
  // System Prompt — 按章节阶段降级
  // 控制固定提示词成本：早期详细指导，后期精简
  // ============================================================
  buildSystemPrompt(novel, chapIdx){
    const progress = (chapIdx + 1) / novel.chapterCount;
    let level = 'full';
    if(chapIdx >= 20) level = 'minimal';
    else if(chapIdx >= 5) level = 'compact';

    if(level === 'full'){
      // 前5章：完整指导，建立风格基调，黄金三行/情绪词库/对话风格/Show don't tell 全量注入
      return `你是一位${novel.genre}领域的顶尖网文作家，擅长${novel.style}风格。

【写作原则】
1. 场景描写生动，调动视觉、听觉、嗅觉等多感官
2. 对话自然口语化，每个角色有独特的说话方式
3. 节奏紧凑，每章至少一个冲突或转折
4. 结尾留钩子，激发读者追读欲
5. 与前文衔接自然，保持人物性格和关系连贯
6. 展示而非叙述（Show don't tell），用行动和细节表现角色

【黄金三行原则】
每章开头三行决定读者去留，必须满足：
- 第一行：制造悬念或冲突，抓住注意力
- 第二行：建立场景氛围或人物状态
- 第三行：抛出问题或矛盾，驱动阅读欲

【情绪词汇库】
避免使用"愤怒""悲伤"等直白情绪词，改用具体表现：
- 愤怒：攥紧拳头、咬牙切齿、太阳穴突突跳动
- 悲伤：喉头发紧、眼眶发酸、胸口像堵了团棉花
- 紧张：手心冒汗、呼吸发紧、后背绷直
- 喜悦：嘴角上扬、脚步轻快、眉眼舒展
- 恐惧：瞳孔收缩、寒意窜上脊背、腿像灌了铅

【对话风格指南】
- 每个角色有独特口头禅或说话节奏，通过用词习惯区分身份
- 对话中穿插动作和神态描写，避免纯对白堆砌
- 潜台词比明说更有张力，让读者读出弦外之音
- 对话长度控制在3-5句内交替，避免长篇独白

【展示而非叙述的具体方法】
- 不要说"他很害怕"，写"他的手抖得连杯子都端不稳"
- 不要说"她很美"，写"路人纷纷回头，有人撞上了电线杆"
- 不要说"战斗很激烈"，写"刀光闪过，他的袖子裂开一道口子，血珠渗出"
- 用具体动作、感官细节、他人反应来传递抽象概念

【禁忌】
- 不要在正文中出现"第X章"标题
- 不要输出大纲、分析、说明等非正文内容
- 不要使用"本章""上文"等元叙事词汇
- 不要让角色突然性格突变（除非有合理剧情驱动）`;
    }

    if(level === 'compact'){
      // 6-20章：精简指导，保留钩子指南和密度标准以控制质量下限
      return `你是一位${novel.genre}领域的顶尖网文作家，擅长${novel.style}风格。

要求：场景生动、对话自然、节奏紧凑、展示而非叙述。

【钩子指南】
- 开头钩子：前200字内抛出悬念或冲突
- 结尾钩子：留下未解之谜或情绪张力，驱动追读
- 中段钩子：每800字左右一个小高潮或转折

【密度标准】
- 每章至少1个核心冲突 + 1个转折
- 对话与描写比例约4:6，避免大段独白
- 每1000字推进一次剧情，不注水

禁忌：不输出章节标题、大纲、说明；不使用元叙事词汇。`;
    }

    // 21章后：最小化提示，风格基调已建立，仅需硬约束
    return `你是${novel.genre}网文作家。直接写正文，不输出标题和说明。结尾留钩子。展示而非叙述。`;
  },

  // ============================================================
  // 故事纲 Prompt — 全书结构规划
  // 对标参考项目三层大纲体系的第一层
  // ============================================================
  buildStoryOutlinePrompt(n){
    return `你是一位资深网文剧情架构师。请为这部小说规划全书故事纲。

【创意】${n.idea}
【题材】${n.genre}
【风格】${n.style}
【剧情模式】${PLOT_MODE_DESC[n.plotMode]||''}
【大结局风格】${ENDING_DESC[n.endingStyle]||''}
【世界观】
${n.worldview}
【主要角色】
${n.characters}
【总章数】${n.chapterCount}章

请输出全书故事纲（用 markdown 格式）：
## 三幕结构
- 第一幕（开篇，约占30%）：主角起点、核心冲突引入、第一个转折
- 第二幕（发展，约占50%）：升级/探索/对抗、中点反转、危机加深
- 第三幕（高潮与结局，约占20%）：最终决战、伏笔收束、结局

## 关键转折点
（列出3-5个关键转折，标注大约发生在第几章）

## 角色弧线
（每个主要角色的成长轨迹，3-4句话概括）

## 伏笔布局
（列出3-5个重要伏笔，标注埋设和回收的大致章节）

要求：结构清晰，伏笔有埋有收。剧情走向符合"${n.plotMode}"模式。直接输出内容，不要多余寒暄。`;
  },

  // ============================================================
  // 章节细纲 Prompt — 增强大纲
  // 每章包含：标题、剧情概要、开头钩子、结尾钩子、关键冲突
  // ============================================================
  buildChapterSynopsisPrompt(n, storyOutline){
    return `你是一位资深网文剧情策划。基于以下信息，为 ${n.chapterCount} 章规划详细章节大纲。

【创意】${n.idea}
【题材】${n.genre}
【风格】${n.style}
【剧情模式】${PLOT_MODE_DESC[n.plotMode]||''}
【大结局风格】${ENDING_DESC[n.endingStyle]||''}
【世界观】
${n.worldview}
【主要角色】
${n.characters}
【全书故事纲】
${storyOutline || '（无故事纲，请自由规划）'}

要求：
1. 第一行输出小说标题，格式：**书名：《xxx》**
2. 然后输出每一章的详细大纲，严格按以下格式，每章一段：

第1章 章节标题
剧情概要（80-120字，包含主要事件、冲突发展）
开头钩子：本章开头的吸引点
结尾钩子：本章结尾的悬念
关键冲突：本章的核心矛盾

注意：共 ${n.chapterCount} 章。每章必须有开头钩子和结尾钩子。
最后一章的大结局必须是"${ENDING_DESC[n.endingStyle]}"风格。
剧情必须符合"${n.plotMode}"模式的结构特点。直接输出，不要多余寒暄。`;
  },

  // ============================================================
  // 分块生成 Prompt — 用于超长内容（1000章）分块生成
  // 对标 Reference-php generate_outline.php 的分批模式
  // ============================================================

  // 故事纲分幕 Prompt — 生成第 N 幕，注入前几幕摘要保证连贯
  buildStoryOutlineActPrompt(n, actIdx, prevActsContent){
    const actNames = ['第一幕（开篇，约占30%）', '第二幕（发展，约占50%）', '第三幕（高潮与结局，约占20%）'];
    const actDescs = [
      '主角起点、核心冲突引入、第一个转折',
      '升级/探索/对抗、中点反转、危机加深',
      '最终决战、伏笔收束、结局',
    ];
    const actName = actNames[actIdx] || '';
    const actDesc = actDescs[actIdx] || '';

    return `你是一位资深网文剧情架构师。请为这部小说规划${actName}。

【创意】${n.idea}
【题材】${n.genre}
【风格】${n.style}
【剧情模式】${PLOT_MODE_DESC[n.plotMode]||''}
【大结局风格】${ENDING_DESC[n.endingStyle]||''}
【世界观】
${n.worldview}
【主要角色】
${n.characters}
【总章数】${n.chapterCount}章

${prevActsContent ? `【已生成的前序幕内容（摘要）】\n${prevActsContent.slice(0, 800)}\n` : ''}

请输出${actName}的内容（约800字，用 markdown 格式）：

## ${actName}
- 本幕核心内容：${actDesc}
- 涉及章节范围：大约第${actIdx === 0 ? '1' : actIdx === 1 ? Math.ceil(n.chapterCount * 0.3) + 1 : Math.ceil(n.chapterCount * 0.8) + 1}章到第${actIdx === 0 ? Math.ceil(n.chapterCount * 0.3) : actIdx === 1 ? Math.ceil(n.chapterCount * 0.8) : n.chapterCount}章
- 主要事件发展
- 角色成长轨迹
- 本幕结尾的悬念或转折

要求：与前序幕衔接自然。直接输出内容，不要多余寒暄。`;
  },

  // 卷大纲单卷 Prompt — 生成第 N 卷，注入故事纲和前卷概要
  buildVolumeOutlineSinglePrompt(n, storyOutline, volIdx, volRange, prevVolumes){
    const vol = n.volumes?.[volIdx] || {};
    const volName = vol.name || `第${volIdx + 1}卷`;
    const volChapters = vol.chapterCount || (volRange ? volRange.end - volRange.start + 1 : 10);

    return `你是一位资深网文剧情架构师。请基于以下信息规划${volName}的大纲。

【创意】${n.idea}
【题材】${n.genre}
【风格】${n.style}
【总章数】${n.chapterCount}章
【本卷信息】${volName}（第${volRange ? volRange.start : '?'}-${volRange ? volRange.end : '?'}章，共${volChapters}章）

【全书故事纲】
${(storyOutline || '').slice(0, 600)}

${prevVolumes ? `【前卷概要】\n${prevVolumes.slice(0, 400)}\n` : ''}

请输出本卷大纲（用 markdown 格式）：
## 第${volIdx + 1}卷《${volName}》（第${volRange ? volRange.start : '?'}-${volRange ? volRange.end : '?'}章）
- **卷主题**：本卷核心主题（一句话）
- **关键事件**：3-5个关键事件
- **角色聚焦**：本卷重点发展的角色
- **核心冲突**：本卷的主要矛盾
- **冲突解决**：本卷结尾时冲突的解决程度
- **伏笔布局**：本卷埋设/回收的伏笔
- **卷目标**：本卷结束时主角应达到的状态

要求：本卷约${volChapters}章的规划要具体可执行。直接输出，不要多余寒暄。`;
  },

  // 章节细纲分批 Prompt — 生成一批章节的细纲（默认10章/批）
  // 对标 Reference-php generate_outline.php 的滑动窗口模式
  buildChapterSynopsisBatchPrompt(n, startCh, endCh, recentOutlines, prevHook, usedTitles){
    const batchCount = endCh - startCh + 1;
    const volInfo = n.volumeOutlines?.find(v => {
      const start = v.startChapter || 0;
      const end = v.endChapter || 999999;
      return startCh + 1 >= start && startCh + 1 <= end;
    });

    return `你是一位资深网文剧情策划。基于以下信息，为第${startCh + 1}章到第${endCh + 1}章规划详细章节大纲。

【创意】${n.idea}
【题材】${n.genre}
【风格】${n.style}
【剧情模式】${PLOT_MODE_DESC[n.plotMode]||''}
【世界观摘要】
${(n.worldview || '').slice(0, 300)}
【主要角色摘要】
${(n.characters || '').slice(0, 300)}
【全书故事纲摘要】
${(n.storyOutline || '').slice(0, 400)}
${volInfo ? `【当前卷信息】\n第${volInfo.index}卷《${volInfo.name}》- ${volInfo.theme || ''}\n` : ''}
${recentOutlines && recentOutlines.length > 0 ? `【近期已生成章节大纲（滑动窗口）】\n${recentOutlines.slice(-5).map((o, i) => '第' + (startCh - recentOutlines.length + i + 1) + '章 ' + o.title + '：' + (o.summary || '').slice(0, 80)).join('\n')}\n` : ''}
${prevHook ? `【上一章结尾钩子】${prevHook}\n` : ''}
${usedTitles && usedTitles.length > 0 ? `【已使用标题（避免重复）】${usedTitles.slice(-20).join('、')}\n` : ''}

请输出第${startCh + 1}章到第${endCh + 1}章的详细大纲（共${batchCount}章），严格按以下格式，每章一段：

第${startCh + 1}章 章节标题
剧情概要（80-120字，包含主要事件、冲突发展）
开头钩子：本章开头的吸引点
结尾钩子：本章结尾的悬念
关键冲突：本章的核心矛盾

注意：本批共${batchCount}章。每章必须有开头钩子和结尾钩子。
${endCh + 1 >= n.chapterCount ? '最后一章的大结局必须是"' + (ENDING_DESC[n.endingStyle]||'') + '"风格。' : ''}
剧情必须符合"${n.plotMode}"模式的结构特点。直接输出，不要多余寒暄。`;
  },
  // 卷大纲 Prompt — 第二层大纲
  // 对标参考项目 buildVolumeOutlinePrompt
  // ============================================================
  buildVolumeOutlinePrompt(n, storyOutline){
    const volumes = n.volumes?.length > 0
      ? n.volumes.map((v, i) => `第${i+1}卷《${v.name}》：${v.chapterCount}章`).join('\n')
      : `全书共${n.chapterCount}章，请自行规划卷数（建议2-4卷）`;

    return `你是一位资深网文剧情架构师。请基于以下信息规划卷大纲。

【创意】${n.idea}
【题材】${n.genre}
【风格】${n.style}
【总章数】${n.chapterCount}章
【卷结构】
${volumes}

【全书故事纲】
${storyOutline || '（无故事纲，请自由规划）'}

请输出每卷的大纲（用 markdown 格式），每卷包含：
## 第X卷《卷名》（第X-X章）
- **卷主题**：本卷核心主题（一句话）
- **关键事件**：3-5个关键事件
- **角色聚焦**：本卷重点发展的角色
- **核心冲突**：本卷的主要矛盾
- **冲突解决**：本卷结尾时冲突的解决程度
- **伏笔布局**：本卷埋设/回收的伏笔
- **卷目标**：本卷结束时主角应达到的状态

要求：卷与卷之间要有递进关系，冲突逐步升级。直接输出，不要多余寒暄。`;
  },

  // ============================================================
  // 章节简介 Prompt — 详细写作蓝图
  // 对标参考项目 buildSynopsisPrompt
  // 场景分解/对话要点/感官细节/节奏/悬念
  // ============================================================
  buildChapterDetailSynopsisPrompt(n, chapIdx, chapterOutline){
    const prevOutline = chapIdx > 0 ? n.outline?.[chapIdx - 1] : null;
    const prevSummary = prevOutline ? `上一章：${prevOutline.title} - ${prevOutline.summary || ''}` : '（第一章）';

    return `你是一位资深网文写作策划。请为以下章节生成详细的写作蓝图。

【小说信息】
题材：${n.genre} | 风格：${n.style} | 总章数：${n.chapterCount}章

【前情衔接】
${prevSummary}

【本章大纲】
第${chapIdx + 1}章 ${chapterOutline?.title || ''}
剧情概要：${chapterOutline?.summary || ''}
开头钩子：${chapterOutline?.openingHook || ''}
结尾钩子：${chapterOutline?.endingHook || ''}
关键冲突：${chapterOutline?.keyConflict || ''}

【全书故事纲】
${(n.storyOutline || '').slice(0, 500)}

请输出本章的详细写作蓝图（用 markdown 格式）：

## 场景分解
（列出3-5个场景，每个场景包含：地点、时间、出场人物、场景目标）

## 对话要点
（列出3-5个关键对话，每个对话包含：说话人、核心内容、情绪基调、潜台词）

## 感官细节
（针对每个场景，建议视觉/听觉/嗅觉/触觉的具体描写方向）

## 节奏安排
（按四段式安排：铺垫20% / 发展30% / 高潮35% / 钩子15%，标注每个段落的起止位置）

## 悬念设计
（本章的悬念点，以及如何与下一章衔接）

要求：蓝图要具体可执行，不要泛泛而谈。直接输出，不要多余寒暄。`;
  },

  // ============================================================
  // 正文 Prompt — U型注意力布局 + 缓存友好前缀 + 超长裁剪
  // 对标 ChapterPromptBuilder::buildUserPrompt()
  //
  // U型布局：
  //   ┌─ prefix（稳定，缓存命中）─────────┐
  //   │  小说设定 + 故事纲 + 故事圣经       │
  //   ├─ dynHead（强注意，本章关键）──────┤
  //   │  质量反馈 + 人物状态 + 伏笔 + 细纲  │
  //   ├─ middle（弱注意，超长时优先裁剪）─┤
  //   │  弧段摘要 + 近章 + 关键事件        │
  //   ├─ tail（强 recency，完整保留）─────┤
  //   │  节奏 + Agent指令 + 铁律 + 开始    │
  //   └────────────────────────────────────┘
  buildChapterPrompt(n, i, chapOutline, memoryContext, directives){
    const isLastChap = (i === n.chapterCount - 1);
    const isFirstChap = (i === 0);

    // ===== 稳定前缀（缓存命中区）=====
    const prefix = this.buildStablePrefix(n);

    // ===== 动态头部（强注意区）=====
    const dynHead = this.buildDynamicHead(n, i, chapOutline, memoryContext);

    // ===== 动态中部（弱注意区，超长时优先裁剪）=====
    const middle = this.buildDynamicMiddle(n, i, memoryContext);

    // ===== 动态尾部（尾部注意力区，完整保留）=====
    const tail = this.buildDynamicTail(n, i, isLastChap, isFirstChap, directives, memoryContext, chapOutline);

    // ===== 超长裁剪：只裁剪 middle，head 和 tail 永不裁剪 =====
    const maxPromptLen = 40000;
    let prompt = `${prefix}\n\n${dynHead}\n\n${middle}\n\n${tail}`;
    if(prompt.length > maxPromptLen && middle.length > 0){
      const overflow = prompt.length - maxPromptLen;
      // 从 middle 尾部截断
      const trimmedMiddle = middle.length > overflow + 100
        ? middle.slice(0, middle.length - overflow - 100) + '\n……（部分前情已省略）……'
        : '';
      prompt = `${prefix}\n\n${dynHead}\n\n${trimmedMiddle}\n\n${tail}`;
    }

    return prompt;
  },

  // 稳定前缀 — 世界观、角色、风格、故事纲（相对不变，提高缓存命中）
  buildStablePrefix(n){
    const parts = [`【小说设定】
世界观：${n.worldview}
主要角色：${n.characters}
风格：${n.style}
剧情模式：${PLOT_MODE_DESC[n.plotMode]||''}`];

    // 故事纲注入（全书视角，稳定不变）
    const storyOutlineSection = this.buildStoryOutlineSection(n);
    if(storyOutlineSection) parts.push(storyOutlineSection);

    // 故事圣经（每N章才变，半稳定）
    if(n.memory?.storyBible){
      parts.push(`【全书圣经】\n${n.memory.storyBible}`);
    }

    return parts.join('\n\n');
  },

  // 动态头部 — 本章关键信息（强注意区，永不裁剪）
  buildDynamicHead(n, i, chapOutline, ctx){
    const parts = [];

    if(ctx){
      // P0：前章尾文（衔接）
      if(ctx.prevChapterTail){
        parts.push(`【前文衔接】\n上一章结尾：\n${ctx.prevChapterTail}`);
      }

      // P0：人物当前状态
      if(ctx.characterStatus){
        parts.push(`【人物当前状态】\n${ctx.characterStatus}`);
      }

      // P0：故事势能
      if(ctx.storyPotential !== undefined){
        const potential = ctx.storyPotential;
        let potentialHint = '';
        if(potential > 70) potentialHint = '（剧情处于高潮期，节奏应加快）';
        else if(potential < 30) potentialHint = '（剧情处于蓄势期，可适当铺垫）';
        parts.push(`【故事势能】${potential}${potentialHint}`);
      }

      // P1：伏笔（待回收/临期/逾期）
      if(ctx.foreshadowing){
        parts.push(`【待回收伏笔】\n${ctx.foreshadowing}`);
      }

      // P1：伏笔回收指令
      if(ctx.foreshadowingResolve){
        parts.push(`【本章伏笔回收任务】\n${ctx.foreshadowingResolve}`);
      }
    }

    // 本章细纲（核心，放头部强注意区）
    parts.push(`【本章细纲】\n第${i+1}章 ${chapOutline.title||''}\n${chapOutline.summary||''}`);
    if(chapOutline.openHook){
      parts.push(`开头钩子：${chapOutline.openHook}`);
    }
    if(chapOutline.endHook){
      parts.push(`结尾钩子：${chapOutline.endHook}`);
    }
    if(chapOutline.keyConflict){
      parts.push(`关键冲突：${chapOutline.keyConflict}`);
    }

    // 因果链预警
    const causalSection = this.buildCausalChainSection(n, i, chapOutline, ctx);
    if(causalSection) parts.push(causalSection);

    // 增强伏笔压力
    const foreshadowSection = this.buildForeshadowSection(ctx);
    if(foreshadowSection) parts.push(foreshadowSection);

    return parts.join('\n\n');
  },

  // 动态中部 — 弱注意区（超长时优先裁剪）
  buildDynamicMiddle(n, i, ctx){
    const parts = [];

    if(ctx){
      // P1：弧段摘要
      if(ctx.arcSummaries){
        parts.push(`【前情弧段摘要】\n${ctx.arcSummaries}`);
      }

      // P1：近章细纲
      if(ctx.recentOutlines){
        parts.push(`【近章概要】\n${ctx.recentOutlines}`);
      }

      // P2：关键事件
      if(ctx.keyEvents){
        parts.push(`【关键事件回顾】\n${ctx.keyEvents}`);
      }
    }

    return parts.join('\n\n');
  },

  // 动态尾部 — 字数、节奏、Agent指令、钩子闭环、写前检查卡、铁律、穿帮防护、开始写作
  // 新增可选参数 memoryContext/chapOutline 保持向后兼容，供钩子闭环和写前检查卡使用
  buildDynamicTail(n, i, isLastChap, isFirstChap, directives, memoryContext, chapOutline){
    const parts = [];

    // P2-1: 作者画像注入（如果启用）
    try{
      if(AuthorProfile.enabled && AuthorProfile.profile){
        const profileSection = AuthorProfile.buildProfilePrompt();
        if(profileSection) parts.push(profileSection);
      }
    }catch(e){ /* AuthorProfile 未加载时静默降级 */ }

    // 章节类型提示
    if(isFirstChap){
      parts.push('【特别提示】本章是开篇，需要迅速抓住读者注意力，在500字内建立主角形象和核心冲突。');
    }
    if(isLastChap){
      parts.push(`【特别提示】本章是大结局，必须采用"${ENDING_DESC[n.endingStyle]}"风格收尾，回收所有重要伏笔。`);
    }

    // 节奏指令
    const rhythmHint = this.getRhythmHint(n, i);
    if(rhythmHint){
      parts.push(rhythmHint);
    }

    // Agent 改进指令
    if(directives && directives.length > 0){
      parts.push('【写作改进指令】');
      for(const d of directives){
        parts.push(`- ${d}`);
      }
    }

    // 写作约束注入（对标 Reference-php ConstraintConfig + PostWriteValidator）
    // 为什么在 Agent 指令后注入：约束是硬规则，应紧贴铁律之前
    const constraintSection = this.buildConstraintSection(n, i);
    if(constraintSection) parts.push(constraintSection);

    // P1-1: 金句 callback 注入（对标 CatchphraseRepo::buildCallbackSection）
    // 为什么在约束之后注入：金句是可选增强，不应干扰硬约束
    try{
      const catchphraseSection = CatchphraseRepo.buildCallbackSection(n, i + 1);
      if(catchphraseSection) parts.push(catchphraseSection);
    }catch(e){ /* CatchphraseRepo 未加载时静默降级 */ }

    // 钩子闭环（新增）：强约束本章前1/3回应上章悬念，防止钩子断裂
    const hookSection = this.buildPrevHookSection(n, i, memoryContext);
    if(hookSection) parts.push(hookSection);

    // 写前检查卡（新增）：动笔前目标锚定，防止"写到哪算哪"
    if(chapOutline){
      parts.push(this.buildPreWriteChecklist(n, i, chapOutline, isLastChap));
    }

    // 铁律锚定（新增）：P0/P1/P2 三级硬约束，放尾部利用注意力
    parts.push(this.ironRules(n));

    // 穿帮防护（新增）：元信息穿帮独立护栏
    parts.push(this.buildMetaLeakGuard());

    // 硬约束（放最后，利用尾部注意力）
    parts.push(`【硬约束】
1. 字数约 ${n.wordCount} 字
2. 直接写正文，不要章节标题
3. 段落之间用空行分隔
4. 不要输出任何说明、分析或大纲`);

    return parts.join('\n\n');
  },

  // 节奏提示 — 根据章节进度动态调整
  getRhythmHint(n, i){
    const progress = (i + 1) / n.chapterCount;
    if(progress < 0.15){
      return '【节奏建议】开篇阶段，节奏适中偏快，重点建立世界观和人物。';
    }
    if(progress < 0.4){
      return '【节奏建议】发展前期，每章推进一个事件，保持爽点密度。';
    }
    if(progress < 0.7){
      return '【节奏建议】发展中段，可适当加入转折和伏笔回收，提升复杂度。';
    }
    if(progress < 0.9){
      return '【节奏建议】高潮临近，节奏加快，冲突升级，为最终决战蓄势。';
    }
    return '【节奏建议】收尾阶段，回收伏笔，解决核心冲突，节奏由急转缓。';
  },

  // ============================================================
  // 写作约束段落 — 对标 Reference-php ConstraintConfig
  // 从 ConstraintState 获取当前生效约束，注入到 Prompt 中
  // ============================================================
  buildConstraintSection(novel, chapIdx){
    try{
      const config = ConstraintConfig.load(novel);
      if(!config.enabled) return '';

      const activeConstraints = ConstraintState.getActiveConstraints(novel, chapIdx);
      if(activeConstraints.length === 0) return '';

      const lines = ['【写作约束】（本章必须遵守）'];
      for(const c of activeConstraints){
        lines.push(`- ${c.message}`);
      }
      return lines.join('\n');
    }catch(e){
      // ConstraintConfig 未加载时静默降级
      return '';
    }
  },

  // ============================================================
  // 铁律锚定 — P0/P1/P2 三级优先级硬约束
  // 放在尾部利用注意力机制，P0 违反即废稿
  // ============================================================
  ironRules(novel){
    // 从角色描述中提取主角名用于锚定，防止 AI 擅自改名
    let protagonistName = '';
    if(novel.characters){
      const mdMatch = novel.characters.match(/###\s*(.+)/);
      if(mdMatch){
        protagonistName = mdMatch[1].trim();
      }else{
        protagonistName = novel.characters.split(/[,，\n]/)[0].trim();
      }
    }

    const p0Rules = [
      `字数严格控制在 ${novel.wordCount} 字区间，严重不足或超标视为废稿`,
      protagonistName
        ? `主角名锚定：「${protagonistName}」全章不可更改，不得出现别名/错名/化名（剧情需要的伪装除外）`
        : '主角名全章保持一致，不可更改',
      '直接输出正文，不输出章节标题、大纲、说明等任何非正文内容'
    ];

    const p1Rules = [
      '逻辑自洽：人物行为符合其性格和动机，不出现矛盾',
      '情节不重复：不重复前文已发生的事件和桥段',
      '场景连续：时间、地点、人物位置前后衔接，不跳跃',
      '风格统一：叙事风格、用词习惯全章一致',
      '死角色不可复活：已死亡角色不得以任何形式重新出现'
    ];

    const p2Rules = [
      '字数节奏：开头铺垫约20%，中段推进约50%，结尾收束约30%',
      '段落长短交替，避免视觉疲劳'
    ];

    return `【铁律锚定】
■ P0（废稿级，违反即废稿重写）
${p0Rules.map(r => `- ${r}`).join('\n')}

■ P1（重点，违反扣分）
${p1Rules.map(r => `- ${r}`).join('\n')}

■ P2（参考，尽量遵守）
${p2Rules.map(r => `- ${r}`).join('\n')}`;
  },

  // ============================================================
  // 写前检查卡 — 动笔前目标锚定
  // 强制 AI 明确本章目标，防止"写到哪算哪"导致剧情失控
  // ============================================================
  buildPreWriteChecklist(novel, i, chapOutline, isLastChap){
    const progress = (i + 1) / novel.chapterCount;
    // 收尾期（进度>80%或末章）需额外约束，禁止开新支线
    const isEndingPhase = progress > 0.8 || isLastChap;

    const items = [
      '1. 本章主角改变了什么？（成长/困境/关系，必须有一个明确变化）',
      '2. 推进了哪条剧情线？（主线/支线，具体说明推进内容）',
      '3. 如何处理伏笔？（埋设新伏笔/回收旧伏笔/提及已有伏笔，三选一或组合）',
      '4. 核心冲突是什么？（一句话概括本章核心矛盾）',
      '5. 结尾钩子如何设置？（悬念/反转/情绪张力，具体说明）'
    ];

    let result = `【写前检查卡】动笔前请在心中明确回答以下问题，写作过程中时刻对照：\n${items.join('\n')}`;

    if(isEndingPhase){
      result += '\n\n⚠ 收尾期特别约束：禁止开新支线，禁止引入新主要角色，集中收束已有剧情线和伏笔。';
    }

    return result;
  },

  // ============================================================
  // 因果链预警 — 连贯性漏洞检测
  // 在动笔前检测死角色复活、场景断裂、境界跳级等问题
  // ============================================================
  buildCausalChainSection(novel, i, chapOutline, memoryContext){
    if(!memoryContext) return '';

    const warnings = [];
    // 汇总大纲全文用于关键词检测
    const outlineText = `${chapOutline.title||''} ${chapOutline.summary||''} ${chapOutline.openHook||''} ${chapOutline.endHook||''} ${chapOutline.keyConflict||''}`;

    // 死角色复活检测：已死亡角色出现在大纲中是严重逻辑漏洞
    if(memoryContext.deadCharacters && memoryContext.deadCharacters.length > 0){
      for(const dead of memoryContext.deadCharacters){
        if(outlineText.includes(dead)){
          warnings.push(`🔴 严重：已死亡角色「${dead}」出现在本章大纲中。禁止以任何形式让其复活或出场（回忆/幻觉除外，且需明确标注为非现实）。`);
        }
      }
    }

    // 场景连续性：上章地点未衔接且无转场关键词，可能导致空间跳跃
    if(memoryContext.lastLocation){
      const transitionKeywords = ['来到', '前往', '抵达', '回到', '离开', '进入', '穿过', '飞向', '赶往', '传送', '出发', '动身'];
      const hasTransition = transitionKeywords.some(kw => outlineText.includes(kw));
      const hasLocation = outlineText.includes(memoryContext.lastLocation);
      if(!hasLocation && !hasTransition){
        warnings.push(`🟡 提示：上一章结束于「${memoryContext.lastLocation}」，本章大纲未提及该地点且无转场描写。需补充场景过渡，保证空间连续。`);
      }
    }

    // 境界跳级检测：突破关键词存在但跨级突破破坏升级体系
    const breakthroughKeywords = ['突破', '晋升', '进阶', '升阶', '蜕变', '渡劫'];
    const hasBreakthrough = breakthroughKeywords.some(kw => outlineText.includes(kw));
    if(hasBreakthrough && memoryContext.currentLevel){
      const levelOrder = ['凡人','练气','筑基','金丹','元婴','化神','炼虚','合体','大乘','渡劫','仙人'];
      const currentIdx = levelOrder.indexOf(memoryContext.currentLevel);
      const levelMatches = outlineText.match(/(凡人|练气|筑基|金丹|元婴|化神|炼虚|合体|大乘|渡劫|仙人)/g);
      if(levelMatches && currentIdx >= 0){
        for(const lv of levelMatches){
          const targetIdx = levelOrder.indexOf(lv);
          if(targetIdx - currentIdx > 1){
            warnings.push(`🟠 警告：当前境界「${memoryContext.currentLevel}」，大纲出现「${lv}」，跨度超过一级。需补充中间突破过程或调整大纲。`);
            break;
          }
        }
      }
    }

    if(warnings.length === 0) return '';
    return `【因果链预警】\n${warnings.join('\n')}`;
  },

  // ============================================================
  // 钩子闭环 — 上章悬念兑现约束
  // 强约束本章前1/3正面回应上章钩子，防止"钩子断裂"
  // ============================================================
  buildPrevHookSection(novel, i, memoryContext){
    // 第一章无上章钩子，跳过
    if(i === 0) return '';
    if(!memoryContext || !memoryContext.prevEndHook) return '';

    return `【上章钩子兑现】上一章结尾悬念：${memoryContext.prevEndHook}
本章前1/3必须正面回应此悬念，不得回避或遗忘。回应方式可以是：揭晓答案/推进悬念/制造反转，但必须让读者感受到"这个坑在被填"。`;
  },

  // ============================================================
  // 穿帮防护 — 元信息泄露独立护栏
  // 元信息穿帮会瞬间打破读者沉浸感，是网文常见硬伤
  // ============================================================
  buildMetaLeakGuard(){
    return `【穿帮防护】以下行为视为严重穿帮，禁止出现：
- 禁止在正文中出现"第X章""第X节"等章节标题或编号
- 禁止输出大纲、分析、说明、总结等任何非正文内容
- 禁止使用"本章""上文""前文""下章""后文"等元叙事词汇
- 禁止在正文中出现章节编号（如"第25章"）
- 禁止让角色表现出"知道自己在故事中"的任何迹象（如"这一章""作为主角"）
- 禁止使用作者口吻评论剧情`;
  },

  // ============================================================
  // 故事纲注入 — 全书结构坐标
  // 提取故事纲核心结构信息，帮助 AI 保持全书视角
  // ============================================================
  buildStoryOutlineSection(novel){
    if(!novel.storyOutline) return '';

    const outline = novel.storyOutline;
    const sections = [];

    // 按 markdown 标题提取核心结构，避免全文注入浪费 token
    const actMatch = outline.match(/##\s*三幕结构[\s\S]*?(?=##\s|$)/);
    if(actMatch) sections.push(`【三幕结构】${actMatch[0].replace(/##\s*三幕结构/, '').trim()}`);

    const turnMatch = outline.match(/##\s*关键转折点[\s\S]*?(?=##\s|$)/);
    if(turnMatch) sections.push(`【关键转折】${turnMatch[0].replace(/##\s*关键转折点/, '').trim()}`);

    const arcMatch = outline.match(/##\s*角色弧线[\s\S]*?(?=##\s|$)/);
    if(arcMatch) sections.push(`【角色弧线】${arcMatch[0].replace(/##\s*角色弧线/, '').trim()}`);

    // 无法按结构提取时截取前500字作为参考
    if(sections.length === 0){
      sections.push(`【故事纲参考】${outline.slice(0, 500)}`);
    }

    return `【全书故事纲】写作时请保持全书视角，本章应服务于整体结构。\n${sections.join('\n\n')}`;
  },

  // ============================================================
  // 伏笔压力梯度 — 四层递进约束
  // 确保伏笔既不被遗忘，也不被草率回收
  // ============================================================
  buildForeshadowSection(memoryContext){
    if(!memoryContext) return '';

    const layers = [];

    // 第一层：本章伏笔回收任务（最高优先级，必须执行）
    if(memoryContext.foreshadowingResolve){
      layers.push(`▶ 第一层·本章回收任务（必须执行）：\n${memoryContext.foreshadowingResolve}`);
    }

    // 第二层：倒计时压力（根据距回收点的章数施加梯度压力）
    if(memoryContext.foreshadowingTimer && memoryContext.foreshadowingTimer.length > 0){
      const timers = memoryContext.foreshadowingTimer.map(f => {
        if(f.chaptersLeft <= 1){
          return `🔴 紧急：「${f.name}」距回收仅剩 ${f.chaptersLeft} 章，本章必须回收`;
        }
        if(f.chaptersLeft <= 3){
          return `🟡 优先：「${f.name}」距回收剩 ${f.chaptersLeft} 章，需开始铺垫`;
        }
        return `⚪ 待定：「${f.name}」距回收剩 ${f.chaptersLeft} 章`;
      });
      layers.push(`▶ 第二层·倒计时压力：\n${timers.join('\n')}`);
    }

    // 第三层：到期伏笔提醒（已到回收点）
    if(memoryContext.foreshadowingDue && memoryContext.foreshadowingDue.length > 0){
      const dues = memoryContext.foreshadowingDue.map(f => `「${f.name}」：${f.hint||'需在本章回收'}`);
      layers.push(`▶ 第三层·到期伏笔（本章已到回收点）：\n${dues.join('\n')}`);
    }

    // 第四层：防穿帮护栏（伏笔回收的元叙事禁忌）
    layers.push(`▶ 第四层·防穿帮护栏：\n- 伏笔回收要自然，禁止角色突然"想起"或生硬点题\n- 禁止出现"这是第X章埋的伏笔"等元叙事表述\n- 伏笔回收后不要刻意说明"这个伏笔回收了"`);

    // 仅有第四层时不注入（无伏笔任务时不需要伏笔压力）
    if(layers.length <= 1) return '';
    return `【伏笔压力梯度】\n${layers.join('\n\n')}`;
  },

  // ============================================================
  // 摘要 Prompt — 结构化摘要
  // ============================================================
  buildSummaryPrompt(content){
    return `请用100字以内概括以下小说章节的核心内容。

要求包含：
1. 主要事件（1-2句）
2. 人物状态变化（1句）
3. 关键冲突或转折（1句）
4. 结尾悬念（1句）

只输出摘要内容，不要多余说明。

【章节正文】
${content.slice(0, 3000)}`;
  },

  // ============================================================
  // 续写/改写 Prompt
  // ============================================================
  buildContinuePrompt(n, i, cmd){
    const chap = n.chapters[i];
    const memoryContext = MemoryEngine.getPromptContext(n, i);
    const systemPrompt = this.buildSystemPrompt(n, i);

    const userPrompt = `【小说设定】
世界观：${n.worldview}
主要角色：${n.characters}

【前文记忆】
${memoryContext.characterStatus || ''}
${memoryContext.foreshadowing || ''}

【原章节内容】
${chap.content}

【用户指令】${cmd}

要求：
1. 如果是改写指令，保留原章节核心剧情，按指令调整
2. 如果是续写指令，在原内容后自然延续
3. 风格：${n.style}，字数约 ${n.wordCount} 字
4. 直接输出完整的章节正文，段落间空行分隔`;

    return { system: systemPrompt, user: userPrompt };
  },

  // ============================================================
  // 世界观 Prompt（保留原有功能）
  // ============================================================
  buildWorldviewPrompt(n){
    return `你是一位资深网文世界观架构师。请根据以下创意，构建一个详细的故事世界观。

【创意】${n.idea}
【题材】${n.genre}
【风格】${n.style}
【剧情模式】${PLOT_MODE_DESC[n.plotMode]||''}
【大结局风格】${ENDING_DESC[n.endingStyle]||''}

请输出以下内容（用 markdown 格式）：
## 时代背景
（故事发生的时代、地点、社会环境，100字内）
## 核心设定
（这个世界独特的规则、力量体系、科技水平或特殊机制，150字内）
## 势力格局
（主要势力、组织、阵营及其关系，100字内）
## 核心冲突
（故事的主要矛盾和悬念，80字内）

要求：设定要为${n.genre}题材服务，有新意，避免俗套。剧情走向需符合"${n.plotMode}"模式。直接输出内容，不要多余寒暄。`;
  },

  // ============================================================
  // 角色 Prompt（保留原有功能）
  // ============================================================
  buildCharacterPrompt(n){
    return `你是一位资深网文角色设计师。基于以下信息，设计这部小说的主要角色。

【创意】${n.idea}
【题材】${n.genre}
【风格】${n.style}
【剧情模式】${PLOT_MODE_DESC[n.plotMode]||''}
【世界观】
${n.worldview}

请设计 3-4 个核心角色，每个角色包含（用 markdown 格式）：
### 角色名
- **身份**：职业/地位
- **性格**：2-3个性格关键词及简述
- **外貌**：简短外貌描写
- **动机**：核心目标或执念
- **与主角关系**：盟友/对手/暧昧等

主角要有鲜明记忆点，配角要各有功能。直接输出内容，不要多余寒暄。`;
  },
};

window.PromptBuilder = PromptBuilder;
