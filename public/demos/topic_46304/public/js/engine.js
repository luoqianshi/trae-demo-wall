/* ============================================================
 * Engine - 小说生成编排引擎（重构版）
 *
 * 对标参考项目 WriteEngine.php 六阶段架构：
 *   1. 世界观 → 2. 角色 → 3. 故事纲 → 4. 章节细纲 → 5. 逐章正文 → 6. 后处理闭环
 *
 * 逐章正文阶段内部闭环：
 *   写前决策(章节类型+节奏) → 记忆构建 → Prompt装配 → 流式生成
 *   → 清洗校验 → 落盘 → 后处理(摘要+记忆入库+评分+改进指令)
 *
 * 改进指令注入下一章 Prompt 尾部，形成跨章反馈闭环。
 * ============================================================ */

// 剧情模式描述映射
const PLOT_MODE_DESC = {
  linear: '线性成长模式：主角从弱到强，一路升级打怪，每章有明确的成长节点和爽点',
  episodic: '单元解密模式：每章是一个相对独立的案件/事件，同时逐步揭开主线谜团',
  multithread: '多线交织模式：多视角并行推进，各条线索在后期汇合形成高潮',
  twist: '反转流模式：剧情不断反转，每章结尾都有出人意料的转折，打破读者预期',
};

// 大结局风格描述映射
const ENDING_DESC = {
  happy: '圆满胜利型大结局：所有伏笔收束，主角达成目标，正义战胜邪恶，大团圆收场',
  open: '开放式结局：主要矛盾解决但留下想象空间，让读者自行解读角色命运',
  tragic: '悲剧美学结局：主角付出巨大代价达成目标，壮烈收场，情感冲击力强',
  suspense: '悬念留白结局：解决当前主要矛盾，但埋下更大的悬念，为续篇留余地',
};

// 各步骤进度权重：世界观5 + 角色5 + 故事纲5 + 卷大纲5 + 细纲20 + 简介20 + 正文40 = 100
const STEP_WEIGHTS = [5, 5, 5, 5, 20, 20, 40];

const Engine = Vue.reactive({
  steps: [
    {key:'worldview', name:'世界观'},
    {key:'characters', name:'角色'},
    {key:'storyOutline', name:'故事纲'},
    {key:'volumeOutline', name:'卷大纲'},
    {key:'outline', name:'章节细纲'},
    {key:'synopses', name:'章节简介'},
    {key:'chapters', name:'正文'},
  ],
  activeStep: -1,
  isGenerating: false,
  abortFlag: false,
  abortCtrl: null,
  genBlocks: [],   // 生成内容块
  metaStage: '',
  metaChap: '',
  progress: 0,

  // 重置状态
  reset(){
    this.activeStep = -1;
    this.isGenerating = false;
    this.abortFlag = false;
    this.abortCtrl = null;
    this.genBlocks = [];
    this.metaStage = '';
    this.metaChap = '';
    this.progress = 0;
  },

  // 统一进度计算（按步骤权重）
  // stepIdx: 当前步骤序号, stepProgress: 当前步骤内部进度 (0-1)
  updateProgress(stepIdx, stepProgress){
    var base = 0;
    for(var i = 0; i < stepIdx; i++) base += STEP_WEIGHTS[i];
    this.progress = Math.round(base + STEP_WEIGHTS[stepIdx] * stepProgress);
  },

  // 主生成流程
  async run(novelConfig){
    this.reset();
    this.isGenerating = true;
    const ctx = { novelConfig, abortFlag:false, abortCtrl:null };
    // 把 abortFlag 引用同步
    Object.defineProperty(ctx, 'abortFlag', {
      get: () => this.abortFlag,
      configurable: true,
    });

    const novel = this.createNovel(novelConfig);

    // 初始化记忆引擎
    MemoryEngine.init(novel);

    // P2-2: 记录生成开始事件
    try{ StatsTracker.record(StatsTracker.EVENT_TYPES.GENERATION_START, { novelId: novel.id, title: novel.title, chapterCount: novel.chapterCount }); }catch(e){}

    try{
      // Step 1: 世界观
      this.activeStep = 0;
      this.metaStage = '构建世界观';
      await this.genWorldview(novel, ctx);
      if(this.abortFlag) return this.finish(novel);

      // Step 2: 角色
      this.activeStep = 1;
      this.metaStage = '设计角色';
      await this.genCharacters(novel, ctx);
      if(this.abortFlag) return this.finish(novel);

      // Step 3: 故事纲
      this.activeStep = 2;
      this.metaStage = '规划故事纲';
      await this.genStoryOutline(novel, ctx);
      if(this.abortFlag) return this.finish(novel);

      // Step 4: 卷大纲
      this.activeStep = 3;
      this.metaStage = '规划卷大纲';
      await this.genVolumeOutline(novel, ctx);
      if(this.abortFlag) return this.finish(novel);

      // Step 5: 章节细纲
      this.activeStep = 4;
      this.metaStage = '生成章节细纲';
      await this.genOutline(novel, ctx);
      if(this.abortFlag) return this.finish(novel);

      // Step 6: 章节简介（批量）
      this.activeStep = 5;
      this.metaStage = '生成章节简介';
      await this.genAllSynopses(novel, ctx);
      if(this.abortFlag) return this.finish(novel);

      // Step 7: 逐章正文（含写前决策+后处理闭环）
      this.activeStep = 6;
      this.metaStage = '生成正文';
      await this.genAllChapters(novel, ctx);

      this.metaStage = '生成完成';
      this.metaChap = `${novel.chapterCount} / ${novel.chapterCount}`;
      this.updateProgress(6, 1);
      // P2-2: 记录生成完成
      try{ StatsTracker.record(StatsTracker.EVENT_TYPES.GENERATION_COMPLETE, { novelId: novel.id, title: novel.title }); }catch(e){}
      return this.finish(novel);
    }catch(e){
      console.error('生成失败', e);
      store.toast('生成失败: '+e.message, 'error');
      // P2-2: 记录生成错误
      try{ StatsTracker.record(StatsTracker.EVENT_TYPES.GENERATION_ABORT, { novelId: novel.id, error: e.message }); }catch(e){}
      return this.finish(novel);
    }
  },

  finish(novel){
    this.isGenerating = false;
    return novel;
  },

  abort(){
    this.abortFlag = true;
    if(this.abortCtrl){ try{ this.abortCtrl.abort(); }catch(e){} }
    store.toast('已中断生成', 'warn');
  },

  // ===== 创建小说对象（不生成内容，仅初始化元数据）=====
  // 用于工作台模式：用户先创建小说，再逐步生成各阶段
  createNovel(novelConfig){
    const novel = {
      id: 'novel-' + Date.now(),
      title: novelConfig.title || '',
      idea: novelConfig.idea,
      genre: novelConfig.genre,
      style: novelConfig.style,
      styleVector: novelConfig.styleVector || {},
      referenceAuthor: novelConfig.referenceAuthor || '',
      protagonist: novelConfig.protagonist || {},
      worldSetting: novelConfig.worldSetting || '',
      plotMode: novelConfig.plotMode,
      endingStyle: novelConfig.endingStyle,
      chapterCount: novelConfig.chapterCount,
      wordCount: novelConfig.wordCount,
      volumeStructure: novelConfig.volumeStructure || 'single',
      volumes: novelConfig.volumes || [],
      // 生成内容
      worldview: '',
      characters: '',
      storyOutline: '',
      storyOutlineChunks: [],  // 分块：三幕各自的内容
      volumeOutlines: [],   // 卷大纲
      outline: [],          // 章节细纲
      synopses: [],         // 章节简介（详细写作蓝图）
      chapters: [],
      // 状态
      status: 'draft',      // draft → outlining → writing → completed
      memory: null,
      directives: [],
      createdAt: Date.now(),
    };
    MemoryEngine.init(novel);
    return novel;
  },

  // ===== 卷大纲（分块：按卷分别生成）=====
  // 为什么分块：多卷小说单次生成会被 max_tokens 截断
  // 逐卷生成，每卷注入故事纲和前卷概要
  async genVolumeOutline(novel, ctx){
    novel.volumeOutlines = novel.volumeOutlines || [];
    // 如果没有卷结构信息，先尝试一次性生成（兼容旧逻辑）
    if(!novel.volumes || novel.volumes.length === 0){
      this.addBlock('volumeOutline','卷大纲规划','正在规划卷大纲...', 'layers');
      const prompt = PromptBuilder.buildVolumeOutlinePrompt(novel, novel.storyOutline);
      const content = await Api.streamGenerate(prompt, 'volumeOutline', ctx, { taskType: 'volumeOutline' });
      if(Api.lastFinishReason === 'length') this.markBlockTruncated('volumeOutline');
      novel.volumeOutlines = this.parseVolumeOutlines(content, novel);
      this.finalizeBlock('volumeOutline');
      this.updateProgress(3, 1);
      return;
    }
    // 逐卷分块生成
    for(let v = 0; v < novel.volumes.length; v++){
      if(this.abortFlag) return;
      // 断点续传：跳过已生成的卷
      if(novel.volumeOutlines[v] && novel.volumeOutlines[v].raw && novel.volumeOutlines[v].raw.length > 50){
        continue;
      }
      const vol = novel.volumes[v];
      const blockId = 'volumeOutline-vol' + (v + 1);
      this.metaStage = '生成卷大纲 - 第' + (v + 1) + '卷';
      this.addBlock(blockId, '第' + (v + 1) + '卷 ' + (vol.name || ''), '正在生成...', 'layers');
      // 计算卷的章节范围
      const volRange = this.getVolumeRange(novel, v);
      // 注入前卷概要
      const prevVolumes = novel.volumeOutlines.slice(0, v).map(function(vo){ return vo.raw || vo.theme || ''; }).join('\n');
      const prompt = PromptBuilder.buildVolumeOutlineSinglePrompt(novel, novel.storyOutline, v, volRange, prevVolumes);
      const content = await Api.streamGenerate(prompt, blockId, ctx, { taskType: 'volumeOutline' });
      if(Api.lastFinishReason === 'length') this.markBlockTruncated(blockId);
      // 解析单卷
      const parsed = this.parseSingleVolume(content, v + 1, vol, volRange);
      novel.volumeOutlines[v] = parsed;
      this.finalizeBlock(blockId);
      this.updateProgress(3, (v + 1) / novel.volumes.length);
    }
  },

  // 计算卷的章节范围
  getVolumeRange(novel, volIdx){
    if(!novel.volumes || novel.volumes.length === 0) return null;
    let start = 1;
    for(let i = 0; i < volIdx; i++){
      start += novel.volumes[i].chapterCount || 10;
    }
    const end = start + (novel.volumes[volIdx].chapterCount || 10) - 1;
    return { start: start, end: Math.min(end, novel.chapterCount) };
  },

  // 解析单卷大纲
  parseSingleVolume(content, volIdx, volInfo, volRange){
    const volName = volInfo?.name || '第' + volIdx + '卷';
    return {
      index: volIdx,
      name: volName,
      theme: this.extractField(content, '卷主题'),
      keyEvents: [],
      characterFocus: this.extractField(content, '角色聚焦'),
      coreConflict: this.extractField(content, '核心冲突'),
      conflictResolution: this.extractField(content, '冲突解决'),
      foreshadowing: [],
      volumeGoal: this.extractField(content, '卷目标'),
      startChapter: volRange ? volRange.start : 0,
      endChapter: volRange ? volRange.end : 0,
      raw: content,
    };
  },

  // 从 markdown 内容中提取字段值
  extractField(text, fieldName){
    const m = text.match(new RegExp(fieldName + '[：:]\\s*(.+)'));
    return m ? m[1].trim() : '';
  },

  // 解析卷大纲
  parseVolumeOutlines(content, novel){
    const volumes = [];
    const blocks = content.split(/^## /m).filter(s => s.trim());
    for(const block of blocks){
      const lines = block.split('\n').filter(l => l.trim());
      if(lines.length === 0) continue;
      const titleMatch = lines[0].match(/第(\d+)卷[《]([^》]+)[》]/);
      if(!titleMatch) continue;
      const volIdx = parseInt(titleMatch[1]);
      const volName = titleMatch[2];
      const vol = {
        index: volIdx,
        name: volName,
        theme: '',
        keyEvents: [],
        characterFocus: '',
        coreConflict: '',
        conflictResolution: '',
        foreshadowing: [],
        volumeGoal: '',
        raw: block.trim(),
      };
      for(const line of lines.slice(1)){
        if(line.includes('卷主题')) vol.theme = line.replace(/.*卷主题[：:]\s*/, '').trim();
        else if(line.includes('关键事件')) vol.keyEvents.push(line.replace(/.*关键事件[：:]\s*/, '').trim());
        else if(line.includes('角色聚焦')) vol.characterFocus = line.replace(/.*角色聚焦[：:]\s*/, '').trim();
        else if(line.includes('核心冲突')) vol.coreConflict = line.replace(/.*核心冲突[：:]\s*/, '').trim();
        else if(line.includes('冲突解决')) vol.conflictResolution = line.replace(/.*冲突解决[：:]\s*/, '').trim();
        else if(line.includes('伏笔布局')) vol.foreshadowing.push(line.replace(/.*伏笔布局[：:]\s*/, '').trim());
        else if(line.includes('卷目标')) vol.volumeGoal = line.replace(/.*卷目标[：:]\s*/, '').trim();
      }
      volumes.push(vol);
    }
    // 如果解析失败，创建默认卷结构
    if(volumes.length === 0){
      volumes.push({ index:1, name:'正文', theme:'全书', raw: content });
    }
    return volumes;
  },

  // ===== 章节简介（批量）=====
  async genAllSynopses(novel, ctx){
    novel.synopses = novel.synopses || [];
    for(let i = 0; i < novel.outline.length; i++){
      if(this.abortFlag) return;
      // 断点续传：跳过已完成的简介
      if(novel.synopses[i] && novel.synopses[i].length > 50) continue;
      this.metaStage = `生成第${i+1}章简介`;
      this.metaChap = `${i} / ${novel.chapterCount}`;
      this.addBlock('syn'+i, `第${i+1}章简介`, '正在生成写作蓝图...', 'file-text');
      await this.genSynopsis(novel, i, ctx);
      this.finalizeBlock('syn'+i);
      this.updateProgress(5, (i + 1) / novel.outline.length);
    }
  },

  // 单章简介生成
  async genSynopsis(novel, chapIdx, ctx){
    const chapOutline = novel.outline[chapIdx];
    if(!chapOutline) return;
    const prompt = PromptBuilder.buildChapterDetailSynopsisPrompt(novel, chapIdx, chapOutline);
    const content = await Api.streamGenerate(prompt, 'syn'+chapIdx, ctx, { taskType: 'outline' });
    if(Api.lastFinishReason === 'length') this.markBlockTruncated('syn'+chapIdx);
    novel.synopses[chapIdx] = content;
  },

  // ===== 世界观 =====
  async genWorldview(novel, ctx){
    this.addBlock('worldview','世界观构建','正在构建故事世界观...', 'globe');
    const prompt = PromptBuilder.buildWorldviewPrompt(novel);
    const content = await Api.streamGenerate(prompt, 'worldview', ctx, { taskType: 'outline' });
    if(Api.lastFinishReason === 'length') this.markBlockTruncated('worldview');
    novel.worldview = content;
    this.finalizeBlock('worldview');
    this.updateProgress(0, 1);
    // P2-2: 记录世界观完成
    try{ StatsTracker.record(StatsTracker.EVENT_TYPES.WORLDVIEW_COMPLETE, { novelId: novel.id }); }catch(e){}
  },

  // ===== 角色 =====
  async genCharacters(novel, ctx){
    this.addBlock('characters','角色设计','正在设计主要角色...', 'users');
    const prompt = PromptBuilder.buildCharacterPrompt(novel);
    const content = await Api.streamGenerate(prompt, 'characters', ctx, { taskType: 'outline' });
    if(Api.lastFinishReason === 'length') this.markBlockTruncated('characters');
    novel.characters = content;
    // 初始化人物卡
    MemoryEngine.initCharacterCards(novel);
    this.finalizeBlock('characters');
    this.updateProgress(1, 1);
    // P2-2: 记录角色完成
    try{ StatsTracker.record(StatsTracker.EVENT_TYPES.CHARACTERS_COMPLETE, { novelId: novel.id }); }catch(e){}
  },

  // ===== 故事纲（分块：三幕分别生成）=====
  // 为什么分块：单次生成 1000 章的故事纲会被 max_tokens 截断
  // 分三幕生成，每幕注入前序幕摘要保证连贯
  async genStoryOutline(novel, ctx){
    novel.storyOutlineChunks = novel.storyOutlineChunks || [];
    const actNames = ['第一幕（开篇）', '第二幕（发展）', '第三幕（高潮与结局）'];
    for(let act = 0; act < 3; act++){
      if(this.abortFlag) return;
      // 断点续传：跳过已生成的幕
      if(novel.storyOutlineChunks[act] && novel.storyOutlineChunks[act].length > 50){
        continue;
      }
      const blockId = 'storyOutline-act' + (act + 1);
      this.metaStage = '生成故事纲 - ' + actNames[act];
      this.addBlock(blockId, actNames[act], '正在生成...', 'map');
      // 注入前序幕摘要作为上下文
      const prevActs = novel.storyOutlineChunks.slice(0, act).join('\n\n');
      const prompt = PromptBuilder.buildStoryOutlineActPrompt(novel, act, prevActs);
      const content = await Api.streamGenerate(prompt, blockId, ctx, { taskType: 'storyOutline' });
      if(Api.lastFinishReason === 'length') this.markBlockTruncated(blockId);
      novel.storyOutlineChunks[act] = content;
      this.finalizeBlock(blockId);
      this.updateProgress(2, (act + 1) / 3);
    }
    // 拼接为完整故事纲（兼容旧字段）
    novel.storyOutline = novel.storyOutlineChunks.join('\n\n---\n\n');
  },

  // ===== 章节细纲（分块：每批10章）=====
  // 为什么分块：1000章单次生成会被 max_tokens 硬截断在第12章
  // 分批生成，每批注入滑动窗口上下文（近N章大纲+上一章钩子）
  async genOutline(novel, ctx){
    novel.outline = novel.outline || [];
    const batchSize = 10;  // 每批章数
    const totalBatches = Math.ceil(novel.chapterCount / batchSize);
    // 断点续传：从现有大纲提取已用标题，避免恢复时生成重复标题
    const usedTitles = novel.outline.map(function(o){ return o && o.title; }).filter(function(t){ return t; });

    for(let batch = 0; batch < totalBatches; batch++){
      if(this.abortFlag) return;
      const startCh = batch * batchSize;
      const endCh = Math.min(startCh + batchSize - 1, novel.chapterCount - 1);
      const expectedCount = endCh - startCh + 1;

      // 断点续传：检查整批是否完整
      // 为什么检查整批：仅检查首章会导致部分生成的批次被跳过，造成章节缺失和索引错位
      var batchComplete = novel.outline.length >= (startCh + expectedCount);
      if(batchComplete){
        for(var ch = startCh; ch <= endCh; ch++){
          if(!novel.outline[ch] || !novel.outline[ch].title){
            batchComplete = false;
            break;
          }
        }
      }
      if(batchComplete) continue;

      // 清理不完整的批次数据：截断该位置之后的所有元素
      // 为什么截断后续所有：后续批次的上下文基于不完整数据，必须一并重新生成
      novel.outline.splice(startCh);

      const blockId = 'outline-batch' + batch;
      this.metaStage = '生成章节细纲 - 第' + (startCh + 1) + '-' + (endCh + 1) + '章';
      this.addBlock(blockId, '第' + (startCh + 1) + '-' + (endCh + 1) + '章细纲', '正在生成...', 'list');

      // 滑动窗口：近5章已生成大纲
      const recentOutlines = novel.outline.slice(-5);
      // 上一章结尾钩子
      const prevHook = recentOutlines.length > 0 ? recentOutlines[recentOutlines.length - 1].endHook : '';

      const prompt = PromptBuilder.buildChapterSynopsisBatchPrompt(novel, startCh, endCh, recentOutlines, prevHook, usedTitles);
      const content = await Api.streamGenerate(prompt, blockId, ctx, { taskType: 'outline', maxTokens: this.estimateOutlineMaxTokens(batchSize) });
      if(Api.lastFinishReason === 'length') this.markBlockTruncated(blockId);
      // 解析本批大纲
      const batchOutlines = this.parseOutline(content, endCh - startCh + 1);
      // 收集标题用于去重
      batchOutlines.forEach(function(o){ usedTitles.push(o.title); });
      // 追加到总大纲
      novel.outline.push(...batchOutlines);
      this.finalizeBlock(blockId);
      this.updateProgress(4, (batch + 1) / totalBatches);
    }

    // 提取小说标题
    novel.title = this.guessTitle(novel.idea) || novel.title;

    // 大纲质量校验
    const validation = QualityGuard.validateOutline(novel, novel.outline);
    if(validation.warnings.length > 0) console.warn('大纲校验警告:', validation.warnings);
    if(!validation.passed) store.toast('大纲存在质量问题，将尝试继续', 'warn');

    try{ StatsTracker.record(StatsTracker.EVENT_TYPES.OUTLINE_COMPLETE, { novelId: novel.id, chapterCount: novel.outline.length }); }catch(e){}
  },

  // 估算章节细纲分批的 max_tokens
  // 每章约 150 字 × 1.5 token/字 × 1.2 余量
  estimateOutlineMaxTokens(batchSize){
    return Math.round(batchSize * 150 * 1.5 * 1.2);
  },

  // ===== 单块重生成（不重跑整个步骤）=====
  // 为什么需要：用户只想重新生成某个分块（如第二幕），而非全部
  async regenerateSingleChunk(novel, blockId, ctx){
    // 移除旧块，避免重复显示
    this.genBlocks = this.genBlocks.filter(function(b){ return b.id !== blockId; });
    // 故事纲单幕
    if(blockId.startsWith('storyOutline-act')){
      var actIdx = parseInt(blockId.replace('storyOutline-act', '')) - 1;
      novel.storyOutlineChunks = novel.storyOutlineChunks || [];
      novel.storyOutlineChunks[actIdx] = '';
      var actNames = ['第一幕（开篇）', '第二幕（发展）', '第三幕（高潮与结局）'];
      this.addBlock(blockId, actNames[actIdx], '正在重生成...', 'map');
      var prevActs = novel.storyOutlineChunks.slice(0, actIdx).join('\n\n');
      var prompt = PromptBuilder.buildStoryOutlineActPrompt(novel, actIdx, prevActs);
      var content = await Api.streamGenerate(prompt, blockId, ctx, { taskType: 'storyOutline' });
      if(Api.lastFinishReason === 'length') this.markBlockTruncated(blockId);
      novel.storyOutlineChunks[actIdx] = content;
      novel.storyOutline = novel.storyOutlineChunks.join('\n\n---\n\n');
      this.finalizeBlock(blockId);
      return;
    }
    // 卷大纲单卷
    if(blockId.startsWith('volumeOutline-vol')){
      var volIdx = parseInt(blockId.replace('volumeOutline-vol', '')) - 1;
      if(!novel.volumes || !novel.volumes[volIdx]) return;
      novel.volumeOutlines[volIdx] = null;
      var vol = novel.volumes[volIdx];
      var volRange = this.getVolumeRange(novel, volIdx);
      var prevVolumes = novel.volumeOutlines.slice(0, volIdx).map(function(vo){ return (vo && (vo.raw || vo.theme)) || ''; }).join('\n');
      this.addBlock(blockId, '第' + (volIdx + 1) + '卷 ' + (vol.name || ''), '正在重生成...', 'layers');
      var prompt = PromptBuilder.buildVolumeOutlineSinglePrompt(novel, novel.storyOutline, volIdx, volRange, prevVolumes);
      var content = await Api.streamGenerate(prompt, blockId, ctx, { taskType: 'volumeOutline' });
      if(Api.lastFinishReason === 'length') this.markBlockTruncated(blockId);
      novel.volumeOutlines[volIdx] = this.parseSingleVolume(content, volIdx + 1, vol, volRange);
      this.finalizeBlock(blockId);
      return;
    }
    // 章节细纲单批
    if(blockId.startsWith('outline-batch')){
      var batchIdx = parseInt(blockId.replace('outline-batch', ''));
      var batchSize = 10;
      var startCh = batchIdx * batchSize;
      var endCh = Math.min(startCh + batchSize - 1, novel.chapterCount - 1);
      novel.outline.splice(startCh, endCh - startCh + 1);
      this.addBlock(blockId, '第' + (startCh + 1) + '-' + (endCh + 1) + '章细纲', '正在重生成...', 'list');
      var recentOutlines = novel.outline.slice(Math.max(0, startCh - 5), startCh);
      var prevHook = recentOutlines.length > 0 ? recentOutlines[recentOutlines.length - 1].endHook : '';
      var prompt = PromptBuilder.buildChapterSynopsisBatchPrompt(novel, startCh, endCh, recentOutlines, prevHook, []);
      var content = await Api.streamGenerate(prompt, blockId, ctx, { taskType: 'outline', maxTokens: this.estimateOutlineMaxTokens(batchSize) });
      if(Api.lastFinishReason === 'length') this.markBlockTruncated(blockId);
      var batchOutlines = this.parseOutline(content, endCh - startCh + 1);
      novel.outline.splice(startCh, 0, ...batchOutlines);
      this.finalizeBlock(blockId);
      return;
    }
    // 章节简介单章
    if(blockId.startsWith('syn')){
      var chapIdx = parseInt(blockId.replace('syn', ''));
      novel.synopses[chapIdx] = '';
      this.addBlock(blockId, '第' + (chapIdx + 1) + '章简介', '正在重生成...', 'file-text');
      await this.genSynopsis(novel, chapIdx, ctx);
      this.finalizeBlock(blockId);
      return;
    }
    // 正文单章
    if(blockId.startsWith('chap')){
      var chapIdx = parseInt(blockId.replace('chap', ''));
      this.addBlock(blockId, '第' + (chapIdx + 1) + '章', '正在重生成...', 'book');
      await this.genChapter(novel, chapIdx, ctx);
      this.finalizeBlock(blockId);
      return;
    }
  },

  // ===== 逐章正文（含写前决策+后处理闭环）=====
  async genAllChapters(novel, ctx){
    for(let i=0;i<novel.outline.length;i++){
      if(this.abortFlag) return;
      // 断点续传：跳过已完成的章节
      if(novel.chapters[i] && novel.chapters[i].content && novel.chapters[i].content.length > 100) continue;
      this.metaStage = `正在写第${i+1}章`;
      this.metaChap = `${i} / ${novel.chapterCount}`;
      this.addBlock('chap'+i, `第${i+1}章 ${novel.outline[i].title||''}`, '正在生成正文...', 'book');
      await this.genChapter(novel, i, ctx);
      this.finalizeBlock('chap'+i);
      this.updateProgress(6, (i + 1) / novel.outline.length);
      this.metaChap = `${i+1} / ${novel.chapterCount}`;
      // 实时保存到书架
      store.saveToLibrary(novel);
    }
  },

  // 单章生成 — 六阶段闭环（增强版）
  //
  // 增强点：
  //   Phase 2: 使用 getEnhancedPromptContext 获取因果链预警
  //   Phase 4: 基于大纲关键词的动态 temperature + taskType: 'creative'
  //   Phase 5: P0 阻断重试 — 校验失败时带重写指令重新生成（最多1次）
  //   Phase 6: 传入 aiCall 回调启用 AI 压缩；钩子验证结果注入改进指令
  async genChapter(novel, i, ctx){
    const chapOutline = novel.outline[i];

    // P2-2: 记录章节生成开始
    try{ StatsTracker.record(StatsTracker.EVENT_TYPES.CHAPTER_START, { novelId: novel.id, chapIdx: i, title: chapOutline?.title }); }catch(e){}

    // ===== Phase 1: 写前决策 =====
    // detectChapterType 返回 { type, confidence, label, ratios }
    const typeInfo = QualityGuard.detectChapterType(novel, i);
    const chapterType = typeInfo.type;
    const rhythmParams = QualityGuard.getRhythmParams(chapterType);
    // 节奏调整器：五阶段 + 爽点密度反馈 + 四段式比例
    const rhythmInfo = QualityGuard.calculateRhythm(novel, i);
    // 钩子推荐：6类钩子 + 爽点排期
    const hookSuggestion = QualityGuard.suggestHookType(novel, i);
    const coolPointSchedule = QualityGuard.calculateCoolPointSchedule(novel, i);
    // 结局强制指令
    const endingDirectives = QualityGuard.getEndingDirectives(novel, i);

    // ===== Phase 2: 记忆上下文构建（增强版）=====
    // 使用 getEnhancedPromptContext 获取因果链预警，写前注入避免连贯性事故
    // P1-1: 现在包含 semanticSearch 语义召回，需 await
    let memoryContext = await MemoryEngine.getEnhancedPromptContext(novel, i);
    memoryContext = MemoryEngine.applyBudget(memoryContext, 8000);

    // ===== Phase 3: Prompt 装配 =====
    const systemPrompt = PromptBuilder.buildSystemPrompt(novel, i);
    // 合并改进指令：上一章质量指令 + Agent指令 + 节奏指令 + 钩子 + 爽点 + 结局强制
    const qualityDirectives = novel.directives || [];
    const agentSection = AgentCoordinator.buildAgentSection(novel, i);
    const allDirectives = [...qualityDirectives];
    if(agentSection) allDirectives.push(agentSection);
    if(rhythmInfo.instructions) allDirectives.push(rhythmInfo.instructions);
    // 钩子推荐
    if(hookSuggestion){
      allDirectives.push(`【本章钩子】推荐使用${hookSuggestion.type}（${hookSuggestion.desc}），原因：${hookSuggestion.reason}`);
    }
    // 爽点排期
    if(coolPointSchedule){
      let cpHint = `【爽点排期】推荐安排"${coolPointSchedule.config?.label || coolPointSchedule.type}"（饥饿度${coolPointSchedule.hunger.toFixed(1)}）`;
      if(coolPointSchedule.secondary) cpHint += `，次要爽点"${coolPointSchedule.secondary.config?.label}"`;
      allDirectives.push(cpHint);
    }
    // 结局强制指令
    for(const ed of endingDirectives){ allDirectives.push(ed); }
    // 章节简介（写作蓝图）— 如果存在则注入
    const synopsis = novel.synopses?.[i];
    if(synopsis){
      allDirectives.push(`【写作蓝图】\n${synopsis.slice(0, 800)}`);
    }
    const userPrompt = PromptBuilder.buildChapterPrompt(novel, i, chapOutline, memoryContext, allDirectives);

    // ===== Phase 4: 流式生成 =====
    // 动态 temperature：基础 + 章节类型 + 大纲关键词微调
    const baseTemp = 0.85;
    const keywordBoost = this.calcKeywordTempBoost(chapOutline);
    const temperature = Math.max(0.5, Math.min(1.2, baseTemp + rhythmParams.tempBoost + keywordBoost));

    let content = await Api.streamGenerateWithSystem(
      systemPrompt, userPrompt, 'chap'+i, ctx,
      { temperature, taskType: 'creative' }
    );
    if(Api.lastFinishReason === 'length') this.markBlockTruncated('chap'+i);

    // ===== Phase 5: 清洗 + 校验 + 落盘 =====
    let postResult = QualityGuard.postWriteCheck(novel, i, content);

    // P0 阻断重试：校验失败时带重写指令重新生成
    // 为什么只重试1次：避免无限循环消耗 token，P0 问题通常需要人工介入
    if(!postResult.passed && !ctx.abortFlag && store.mode === 'api'){
      console.warn(`第${i+1}章 P0 校验失败，尝试重写`, postResult.validation.errors);
      store.toast(`第${i+1}章质量不达标，正在重写...`, 'warn');

      // 清除首次生成的截断标记，重试可能成功
      var chapBlock = this.genBlocks.find(function(b){ return b.id === 'chap'+i; });
      if(chapBlock) chapBlock.truncated = false;

      // 将重写指令注入 Prompt 尾部
      // 为什么用 allDirectives：复用 Phase 3 已装配的全部指令，确保重写时约束一致
      const rewriteDirectives = postResult.rewriteDirectives || [];
      const retryPrompt = PromptBuilder.buildChapterPrompt(
        novel, i, chapOutline, memoryContext,
        [...allDirectives, ...rewriteDirectives]
      );

      content = await Api.streamGenerateWithSystem(
        systemPrompt, retryPrompt, 'chap'+i, ctx,
        { temperature: Math.max(0.6, temperature - 0.1), taskType: 'creative' }
      );
      if(Api.lastFinishReason === 'length') this.markBlockTruncated('chap'+i);

      // 重新校验
      postResult = QualityGuard.postWriteCheck(novel, i, content);
      if(!postResult.passed){
        console.error(`第${i+1}章重写后仍不达标`, postResult.validation.errors);
        store.toast(`第${i+1}章重写后仍有问题，已保留当前版本`, 'warn');
      }
    }

    // ===== Phase 5.5: 迭代精修（对标 Reference-php IterativeRefinementController）=====
    // 触发条件：enableRewrite 开启 + 质量分低于 rewriteThreshold + API 模式
    // 为什么在 P0 重试后触发：P0 重试解决硬伤，迭代精修处理软伤（描写/爽感/连贯等）
    if(store.mode === 'api' && novel.config?.enableRewrite && postResult.score.overall < (novel.config?.rewriteThreshold || 60)){
      try{
        console.log(`[Engine] 第${i+1}章质量分${postResult.score.overall}低于阈值，启动迭代精修`);
        store.toast(`第${i+1}章启动迭代精修...`, 'info');

        // 从 5 门验证结果提取问题
        const gateIssues = postResult.gateResult?.allIssues || [];
        const refinementResult = await IterativeRefinementController.performIterativeRefinement(
          novel, i, postResult.cleanedContent, gateIssues, { maxIterations: 2 }
        );

        if(refinementResult.success && refinementResult.final_score > postResult.score.overall){
          console.log(`[Engine] 迭代精修完成：${postResult.score.overall} → ${refinementResult.final_score}（${refinementResult.iterations_used}轮）`);
          store.toast(`第${i+1}章精修完成，质量提升${refinementResult.total_improvement}分`, 'success');
          // 使用精修后的内容
          content = refinementResult.final_content;
          postResult = QualityGuard.postWriteCheck(novel, i, content);
        } else {
          console.log(`[Engine] 迭代精修未改善，保留原版（${refinementResult.iterations_used}轮）`);
        }
      }catch(e){
        console.warn(`[Engine] 第${i+1}章迭代精修失败`, e);
      }
    }

    const finalContent = postResult.cleanedContent;

    // 生成摘要
    let summary = '';
    if(store.mode==='api'){
      summary = await Api.generateSummary(finalContent);
    }else{
      summary = finalContent.slice(0,120);
    }

    // 落盘
    novel.chapters[i] = {
      title: chapOutline.title || `第${i+1}章`,
      content: finalContent,
      summary,
      score: postResult.score,
      chapterType: typeInfo,
      rhythmStage: rhythmInfo.stage,
      hookCheck: postResult.hookCheck,
      causalChainCheck: postResult.causalChainCheck,
      gateResult: postResult.gateResult,
    };

    // ===== Phase 6: 后处理闭环 =====
    // 记忆入库 — 传入 aiCall 回调启用 AI 故事圣经/弧段摘要
    const aiCall = Api.getAiCallCallback();
    await MemoryEngine.ingestChapter(novel, i, finalContent, summary, aiCall);

    // 故事圣经更新
    MemoryEngine.updateStoryBible(novel, i);

    // Agent 协调器：写后评估（StyleGuard + DialogueVoiceChecker + CriticAgent）
    // 纯正则检测零成本，CriticAgent 需 API 调用
    try{
      await AgentCoordinator.postWriteAgents(novel, i, finalContent);
    }catch(e){ console.warn('Agent评估失败', e); }

    // 结局强制器：收束期/结局期合规检查
    try{
      const endingCompliance = QualityGuard.checkEndingCompliance(novel, i, finalContent);
      if(!endingCompliance.compliant){
        for(const w of endingCompliance.warnings){
          AgentDirectives.add(novel, i + 1, 'urgent', w, 2, 'endingEnforcer');
        }
      }
    }catch(e){ console.warn('结局强制检查失败', e); }

    // PID 控制器：4变量闭环评估
    try{
      const metrics = PIDController.computeMetrics(novel, i);
      if(metrics){
        const pidResults = PIDController.evaluateAll(novel, metrics);
        const recs = PIDController.buildRecommendations(pidResults);
        // 最多注入2条PID建议，避免指令池过载
        for(const rec of recs.slice(0, 2)){
          AgentDirectives.add(novel, i + 1, 'strategy', rec, 3, 'pidController');
        }
      }
    }catch(e){ console.warn('PID评估失败', e); }

    // 全书控制器：每20章触发5项检查
    try{
      const globalCheck = await GlobalNovelController.regulate(novel, i);
      if(globalCheck && globalCheck.directives){
        for(const d of globalCheck.directives){
          AgentDirectives.add(novel, i + 1, d.type, d.directive, d.applyRange, 'globalController');
        }
      }
    }catch(e){ console.warn('全书控制检查失败', e); }

    // 情节模式检测：套路化检测
    try{
      const patternIssue = PlotPatternDetector.detect(novel, i);
      if(patternIssue && patternIssue.directive){
        AgentDirectives.add(novel, i + 1, 'quality', patternIssue.directive, 3, 'plotPatternDetector');
      }
    }catch(e){ console.warn('情节模式检测失败', e); }

    // 趋势预测：风险预警
    try{
      const predictions = AdaptiveDecisionEngine.predictIssues(novel, i);
      for(const p of predictions){
        if(p.severity === 'high' || p.severity === 'critical'){
          AgentDirectives.add(novel, i + 1, 'urgent', p.message, 2, 'trendPredictor');
        }
      }
    }catch(e){ console.warn('趋势预测失败', e); }

    // 构建下一章改进指令（跨章反馈闭环）
    // 合并：基础改进指令 + 钩子未兑现提醒 + 因果链问题
    const nextDirectives = [...(postResult.directives || [])];
    if(postResult.hookCheck && postResult.hookCheck.resolved === false){
      nextDirectives.push(`上一章钩子"${postResult.hookCheck.hookText}"未被兑现，本章开头需正面回应`);
    }
    for(const violation of (postResult.causalChainCheck || [])){
      if(violation.severity === 'P1'){
        nextDirectives.push(`注意连贯性：${violation.message}`);
      }
    }
    novel.directives = nextDirectives;

    // 日志输出质量评分和Agent评估结果
    if(postResult.score.overall < 60){
      console.warn(`第${i+1}章质量评分较低: ${postResult.score.overall}/100`, postResult.score.scores);
    }
    const chap = novel.chapters[i];
    if(chap.criticScore){
      console.log(`第${i+1}章读者评分: ${chap.criticScore.avg}/10`, chap.criticScore.weakDims);
    }

    // P2-2: 记录章节生成完成
    try{
      StatsTracker.record(StatsTracker.EVENT_TYPES.CHAPTER_COMPLETE, {
        novelId: novel.id,
        chapIdx: i,
        wordCount: finalContent.length,
        score: postResult.score.overall,
        duration: 0, // genChapter 内部不追踪耗时
      });
      // 同步到 store.usageStats（P2-2 兼容已有字段）
      const s = store.usageStats;
      const today = StatsTracker._getDateKey(Date.now());
      if(s.lastDate !== today){
        s.todayWords = 0;
        s.todayChapters = 0;
        s.lastDate = today;
      }
      s.todayWords += finalContent.length;
      s.todayChapters++;
      s.totalWords = (s.totalWords || 0) + finalContent.length;
      s.totalChapters = (s.totalChapters || 0) + 1;
    }catch(e){}
  },

  // 大纲关键词温度微调 — 冲突/转折关键词提升发散性
  // 为什么用关键词：大纲摘要比正文短，关键词检测成本低且信号明确
  calcKeywordTempBoost(chapOutline){
    const text = `${chapOutline.summary||''} ${chapOutline.keyConflict||''}`;
    const highTempKeywords = ['反转', '转折', '真相', '揭秘', '意外', '震惊'];
    const lowTempKeywords = ['回忆', '铺垫', '日常', '准备', '休整'];
    let boost = 0;
    for(const kw of highTempKeywords){ if(text.includes(kw)) boost += 0.05; }
    for(const kw of lowTempKeywords){ if(text.includes(kw)) boost -= 0.05; }
    return Math.max(-0.1, Math.min(0.15, boost));
  },

  // ===== 续写/改写 =====
  async continueChapter(novel, chapIdx, cmd){
    const ctx = { novelConfig: novel, abortFlag:false, abortCtrl:null };
    Object.defineProperty(ctx, 'abortFlag', { get:()=>this.abortFlag, configurable:true });
    this.reset();
    this.isGenerating = true;
    this.activeStep = 4;
    this.addBlock('continue', `改写第${chapIdx+1}章`, '正在按指令改写...', 'edit');

    // 回滚该章记忆（幂等策略）
    MemoryEngine.rollbackChapter(novel, chapIdx);

    // 使用分层 Prompt
    const { system, user } = PromptBuilder.buildContinuePrompt(novel, chapIdx, cmd);
    const content = await Api.streamGenerateWithSystem(system, user, 'continue', ctx, { taskType: 'creative' });

    // 后处理
    const postResult = QualityGuard.postWriteCheck(novel, chapIdx, content);
    novel.chapters[chapIdx].content = postResult.cleanedContent;
    novel.chapters[chapIdx].score = postResult.score;
    novel.chapters[chapIdx].gateResult = postResult.gateResult;
    novel.chapters[chapIdx].constraintResult = postResult.constraintResult;

    if(store.mode==='api'){
      novel.chapters[chapIdx].summary = await Api.generateSummary(postResult.cleanedContent);
    }else{
      novel.chapters[chapIdx].summary = postResult.cleanedContent.slice(0,120);
    }

    // 重新入库记忆 — 传入 aiCall 回调
    const aiCall = Api.getAiCallCallback();
    await MemoryEngine.ingestChapter(novel, chapIdx, postResult.cleanedContent, novel.chapters[chapIdx].summary, aiCall);

    this.finalizeBlock('continue');
    this.isGenerating = false;
    store.saveToLibrary(novel);
    return novel;
  },

  // ============================================================
  // UI 辅助
  // ============================================================
  addBlock(id, title, hint, icon){
    this.genBlocks.push({ id, title, hint, icon: icon||'', content:'', done:false, truncated:false });
    // 滚动到底部（用 nextTick 确保 DOM 更新后执行）
    setTimeout(()=>{
      const el = document.getElementById('stream-'+id);
      if(el) el.scrollIntoView({behavior:'smooth', block:'end'});
    }, 50);
  },

  // 流式更新 block 内容（Vue 响应式驱动渲染）
  updateBlockContent(id, text){
    const block = this.genBlocks.find(b => b.id === id);
    if(block) block.content = text;
  },

  finalizeBlock(id){
    const block = this.genBlocks.find(b => b.id === id);
    if(block) block.done = true;
  },

  // 标记块为截断状态（finish_reason === 'length'）
  markBlockTruncated(id){
    const block = this.genBlocks.find(b => b.id === id);
    if(block) block.truncated = true;
  },

  // 增强大纲解析 — 支持钩子、关键冲突等字段
  parseOutline(text, count){
    const lines = text.split('\n');
    const result = [];
    let cur = null;
    for(let line of lines){
      line = line.trim();
      const m = line.match(/^第\s*(\d+)\s*章\s*(.*)/);
      if(m){
        if(cur) result.push(cur);
        cur = { title: m[2].replace(/[《》**]/g,'').trim(), summary:'', openHook:'', endHook:'', keyConflict:'' };
      }else if(cur && line){
        // 解析增强字段
        if(line.startsWith('开头钩子：') || line.startsWith('开头钩子:')){
          cur.openHook = line.replace(/^开头钩子[：:]\s*/, '');
        }else if(line.startsWith('结尾钩子：') || line.startsWith('结尾钩子:')){
          cur.endHook = line.replace(/^结尾钩子[：:]\s*/, '');
        }else if(line.startsWith('关键冲突：') || line.startsWith('关键冲突:')){
          cur.keyConflict = line.replace(/^关键冲突[：:]\s*/, '');
        }else{
          cur.summary = (cur.summary?cur.summary+'\n':'') + line;
        }
      }
    }
    if(cur) result.push(cur);
    if(result.length===0){
      for(let i=0;i<count;i++) result.push({title:`第${i+1}章`, summary:'（大纲解析失败，AI 自由发挥）', openHook:'', endHook:'', keyConflict:''});
    }
    return result.slice(0, count);
  },

  extractTitle(text){
    const m = text.match(/《([^》]+)》/);
    return m ? m[1] : null;
  },

  guessTitle(idea){
    return idea.slice(0, 12) + (idea.length>12?'...':'');
  },
});

window.Engine = Engine;
