/* ============================================================
 * 生成+小说总览页 - 流式生成 + 小说详情（页签式）
 *
 * 两种模式：
 *   1. 生成中（readingMode=false）：流式生成视图
 *   2. 小说总览（readingMode=true）：页签式详情页
 *      - 小说设定：基本信息 + 章节列表
 *      - 记忆引擎：原子记忆 / 角色卡片 / 伏笔追踪
 *      - Agent 决策：决策时间线 / 活跃指令 / 效果分析
 *      - 健康监控：健康分 / 章节质量 / 节奏指标
 *      - 操作日志：生成历史 + 操作记录
 * ============================================================ */
const GeneratePage = {
  name: 'GeneratePage',
  data(){
    return {
      // 阅读器状态
      currentChap: 0,
      continueCmd: '',
      // 是否已完成生成，进入总览模式
      readingMode: false,
      // 详情页当前页签
      activeTab: 'settings',
      // 页签数据懒加载标志
      tabLoaded: { memory:false, agent:false, health:false, logs:false },
      // 页签数据缓存
      memoryStats: null,
      agentStats: null,
      healthStats: null,
      logsList: null,
      // 章节列表分页
      chapPage: 1,
      chapPageSize: 10,
      // 记忆引擎子标签
      memorySubTab: 'atoms',
      memorySearchQuery: '',
      memorySearchResults: [],
      memorySearching: false,
      // Agent决策子标签
      agentSubTab: 'monitor',
      // 健康监控子标签
      healthSubTab: 'overview',
    };
  },
  computed: {
    novel(){ return store.currentNovel; },
    novelId(){ return this.novel && this.novel.id; },
    nc(){ return store.novelConfig || {idea:'',genre:'',style:'',chapterCount:0,wordCount:0,plotMode:'',endingStyle:''}; },
    isGenerating(){ return Engine.isGenerating; },
    genBlocks(){ return Engine.genBlocks; },
    activeStep(){ return Engine.activeStep; },
    steps(){ return Engine.steps; },
    progress(){ return Engine.progress; },
    metaStage(){ return Engine.metaStage; },
    metaChap(){ return Engine.metaChap; },
    currentMode(){ return store.mode; },

    // 章节列表（用于小说设定页签）
    chapters(){
      if(!this.novel || !this.novel.chapters) return [];
      return this.novel.chapters;
    },
    doneCount(){
      return this.chapters.filter(c => {
        if(c.status === 'done' || c.status === 'completed') return true;
        if(c.content && c.content.length > 100) return true;
        return false;
      }).length;
    },
    // 章节状态分类汇总：已完成 / 写作中 / 待生成 各多少章
    chapterStatusCounts(){
      const counts = { done: 0, writing: 0, pending: 0 };
      this.chapters.forEach(ch => {
        const cls = this.chapStatusClass(ch);
        if(counts[cls] !== undefined) counts[cls]++;
      });
      return counts;
    },
    // 总体生成进度百分比（用于进度可视化）
    chapterProgressPct(){
      if(this.chapters.length === 0) return 0;
      return Math.round((this.doneCount / this.chapters.length) * 100);
    },
    // 章节列表分页
    pagedChapters(){
      var start = (this.chapPage - 1) * this.chapPageSize;
      return this.chapters.slice(start, start + this.chapPageSize);
    },
    totalChapPages(){
      return Math.ceil(this.chapters.length / this.chapPageSize) || 1;
    },
    chapPageNumbers(){
      var total = this.totalChapPages;
      var cur = this.chapPage;
      if(total <= 7) return Array.from({length: total}, function(_, i){ return i + 1; });
      var pages = [1];
      if(cur > 3) pages.push('...');
      var start = Math.max(2, cur - 1);
      var end = Math.min(total - 1, cur + 1);
      for(var i = start; i <= end; i++) pages.push(i);
      if(cur < total - 2) pages.push('...');
      pages.push(total);
      return pages;
    },
    // 记忆引擎数据
    memoryAtoms(){
      if(!this.novel) return [];
      var atoms = [];
      var mem = this.novel.memory;
      if(!mem) return atoms;
      // 1. 优先使用 novel.memory.atoms（API 返回的数据库数据）
      if(mem.atoms && Array.isArray(mem.atoms) && mem.atoms.length > 0) return mem.atoms;
      // 2. 从 knowledgeBase 派生原子记忆
      if(mem.knowledgeBase){
        var kb = mem.knowledgeBase;
        if(kb.characters) kb.characters.forEach(function(c){ atoms.push({ type:'role', content: c.name + '：' + (c.personality || c.desc || ''), chapter: 0, importance: 0.9 }); });
        if(kb.worldbuilding) kb.worldbuilding.forEach(function(w){ atoms.push({ type:'worldview', content: w.content || w, chapter: 0, importance: 0.7 }); });
        if(kb.plots) kb.plots.forEach(function(p){ atoms.push({ type:'plot', content: p.content || p, chapter: 0, importance: 0.8 }); });
        if(kb.styles) kb.styles.forEach(function(s){ atoms.push({ type:'style', content: s.content || s, chapter: 0, importance: 0.6 }); });
      }
      // 3. 从 keyEvents 派生
      if(mem.keyEvents) mem.keyEvents.forEach(function(e){ atoms.push({ type:'plot', content: e.content || e.description || String(e), chapter: e.chapter || 0, importance: 0.85 }); });
      // 4. 从 arcSummaries 派生
      if(mem.arcSummaries) mem.arcSummaries.forEach(function(a, i){ atoms.push({ type:'plot', content: a.summary || a.content || String(a), chapter: a.startChapter || i, importance: 0.75 }); });
      // 5. 从 storyBible 派生
      if(mem.storyBible && typeof mem.storyBible === 'string' && mem.storyBible.length > 0){
        atoms.push({ type:'worldview', content: mem.storyBible.substring(0, 200), chapter: 0, importance: 0.95 });
      }
      return atoms;
    },
    characterCards(){
      if(!this.novel) return [];
      // novel.memory.characterCards 是对象（按角色名索引），需转为数组
      const cards = this.novel.memory && this.novel.memory.characterCards;
      if(!cards) return [];
      if(Array.isArray(cards)) return cards;
      // 对象转数组：key 作为 name
      return Object.entries(cards).map(([name, card]) => ({
        name: name,
        role: card.role || '',
        personality: card.personality || '',
        goal: card.goal || '',
        ...card,
      }));
    },
    foreshadowings(){
      if(!this.novel) return [];
      // 字段名是 foreshadowing（单数），不是 foreshadowings
      return (this.novel.memory && this.novel.memory.foreshadowing) || [];
    },
    // 小说画像数据
    storyBibleData(){
      if(!this.novel || !this.novel.memory) return null;
      const sb = this.novel.memory.storyBible;
      if(!sb) return null;
      // storyBible 可能是字符串或对象
      if(typeof sb === 'string'){
        try{ return JSON.parse(sb); }catch(e){ return { summary: sb }; }
      }
      return sb;
    },
    // Agent效果分析数据
    agentOutcomeStats(){
      if(!this.novel || !this.novel.agentDirectives) return null;
      const directives = this.novel.agentDirectives;
      const byType = {};
      let effective = 0, total = 0;
      const topEffective = [];
      const topHarmful = [];
      for(const d of directives){
        if(d.outcomes){
          total++;
          const delta = d.outcomes.delta || 0;
          if(delta > 0) effective++;
          if(!byType[d.type]) byType[d.type] = { total: 0, effective: 0, avgDelta: 0 };
          byType[d.type].total++;
          if(delta > 0) byType[d.type].effective++;
          byType[d.type].avgDelta += delta;
          if(delta > 0) topEffective.push({ type: d.type, directive: d.directive || d.text || '', delta });
          if(delta < 0) topHarmful.push({ type: d.type, directive: d.directive || d.text || '', delta });
        }
      }
      // 计算平均
      for(const t in byType){ byType[t].avgDelta = byType[t].total > 0 ? Math.round(byType[t].avgDelta / byType[t].total * 100) / 100 : 0; }
      return {
        byType,
        successRate: total > 0 ? Math.round(effective / total * 100) : 0,
        totalDecisions: total,
        topEffective: topEffective.sort((a,b) => b.delta - a.delta).slice(0, 5),
        topHarmful: topHarmful.sort((a,b) => a.delta - b.delta).slice(0, 5),
      };
    },
    // 健康监控：情绪曲线数据
    emotionCurveData(){
      if(!this.novel || !this.novel.chapters) return [];
      return this.novel.chapters
        .map((c, i) => ({ x: i + 1, y: c.score?.scores?.engagement || 0 }))
        .filter(p => p.y > 0);
    },
    // 健康监控：质量曲线数据
    qualityCurveData(){
      if(!this.novel || !this.novel.chapters) return [];
      return this.novel.chapters
        .map((c, i) => ({ x: i + 1, y: c.score?.overall || 0 }))
        .filter(p => p.y > 0);
    },
    // 健康监控：角色出场状态
    characterStatusList(){
      if(!this.novel || !this.novel.memory) return [];
      const cards = this.characterCards;
      const chapters = this.novel.chapters || [];
      return cards.map(card => {
        let lastChapter = -1;
        const name = card.name || card.role || '';
        if(name && chapters.length > 0){
          for(let i = chapters.length - 1; i >= 0; i--){
            if(chapters[i] && chapters[i].content && chapters[i].content.includes(name)){
              lastChapter = i + 1;
              break;
            }
          }
        }
        const gap = lastChapter > 0 ? chapters.length - lastChapter : 0;
        return { name, lastChapter, gap, status: card.status || (lastChapter === -1 ? 'unknown' : 'active') };
      });
    },
    // 健康监控：待回收伏笔列表
    pendingForeshadowings(){
      if(!this.foreshadowings || this.foreshadowings.length === 0) return { items: [], total: 0, agedCount: 0 };
      const currentChap = this.novel?.chapters?.length || 0;
      const items = this.foreshadowings
        .filter(f => f.status !== 'resolved' && f.status !== 'abandoned')
        .map(f => {
          const plantedAt = f.plantedAt || 0;
          const age = currentChap - plantedAt;
          const deadline = f.deadline || (plantedAt + 15);
          const warning = age > 10 || currentChap >= deadline;
          return { ...f, age, deadline, warning };
        });
      return {
        items,
        total: items.length,
        agedCount: items.filter(f => f.warning).length,
      };
    },
    // Agent 决策数据
    agentDirectives(){
      if(!this.novel) return [];
      return this.novel.agentDirectives || [];
    },
    agentLogs(){
      if(!this.novel) return [];
      // 优先从 novel.agentLogs 获取，其次从章节评分历史推导
      if(this.novel.agentLogs && this.novel.agentLogs.length > 0) return this.novel.agentLogs;
      // 从章节评分推导 Agent 评估日志
      const logs = [];
      this.chapters.forEach((c, i) => {
        if(c.score && c.score.overall){
          logs.push({
            type: 'evaluation',
            message: '第' + (i+1) + '章评分：' + (c.score.overall || 0).toFixed(1) + '分',
            timestamp: c.generatedAt || (this.novel.createdAt || 0) + i * 3600000,
          });
        }
        if(c.criticScore){
          logs.push({
            type: 'critic',
            message: 'CriticAgent 评估第' + (i+1) + '章',
            timestamp: c.generatedAt || (this.novel.createdAt || 0) + i * 3600000,
          });
        }
      });
      return logs;
    },
    // 健康监控数据
    healthScore(){
      if(!this.novel) return 0;
      // 优先使用 novel.healthStats.score
      if(this.novel.healthStats && this.novel.healthStats.score) return this.novel.healthStats.score;
      // P2-6: 使用 TrendAnalyzer 计算综合健康度
      try{
        const doneCount = this.chapters.filter(c => c.score && c.score.overall).length;
        if(doneCount >= 2){
          const analysis = TrendAnalyzer.analyze(this.novel, this.chapters.length);
          if(analysis.overallHealth && analysis.overallHealth.score){
            return analysis.overallHealth.score;
          }
        }
      }catch(e){ /* TrendAnalyzer 不可用时降级 */ }
      // 降级：从章节质量分推导
      const done = this.chapters.filter(c => c.score && c.score.overall);
      if(done.length === 0) return 60;
      const avg = done.reduce((s, c) => s + c.score.overall, 0) / done.length;
      return Math.round(avg * 10);
    },
    healthAlerts(){
      if(!this.novel) return [];
      // 优先使用 novel.healthStats.alerts
      if(this.novel.healthStats && this.novel.healthStats.alerts) return this.novel.healthStats.alerts;
      // 从章节质量推导告警
      const alerts = [];
      this.chapters.forEach((c, i) => {
        if(c.score && c.score.overall){
          if(c.score.overall < 6){
            alerts.push({ level: 'danger', message: '第' + (i+1) + '章质量分偏低（' + c.score.overall.toFixed(1) + '）', chapter: i });
          } else if(c.score.overall < 7){
            alerts.push({ level: 'warning', message: '第' + (i+1) + '章质量分需关注（' + c.score.overall.toFixed(1) + '）', chapter: i });
          }
        }
      });
      // 检查伏笔超期
      if(this.novel.memory && this.novel.memory.foreshadowing){
        this.novel.memory.foreshadowing.forEach((f, i) => {
          if(f.status === 'planted' && f.plantedChapter !== undefined){
            const age = this.chapters.length - f.plantedChapter;
            if(age > 10){
              alerts.push({ level: 'warning', message: '伏笔"' + (f.description || f.content || '').substring(0, 20) + '"已超' + age + '章未回收', chapter: 0 });
            }
          }
        });
      }
      // P2-6: 基于 TrendAnalyzer 的趋势告警
      try{
        const doneCount = this.chapters.filter(c => c.score && c.score.overall).length;
        if(doneCount >= 3){
          const analysis = TrendAnalyzer.analyze(this.novel, this.chapters.length);
          if(analysis.metrics){
            for(const [metric, result] of Object.entries(analysis.metrics)){
              if(result && result.status === 'critical'){
                const names = { quality_score: '质量分', emotion_score: '情感分', cool_point_density: '爽点密度', word_count_accuracy: '字数准确度' };
                alerts.push({ level: 'danger', message: (names[metric] || metric) + '趋势异常：' + (result.recommendation || '需关注'), chapter: 0 });
              } else if(result && result.status === 'warning'){
                const names = { quality_score: '质量分', emotion_score: '情感分', cool_point_density: '爽点密度', word_count_accuracy: '字数准确度' };
                alerts.push({ level: 'warning', message: (names[metric] || metric) + '呈下降趋势', chapter: 0 });
              }
            }
          }
        }
      }catch(e){ /* TrendAnalyzer 不可用时降级 */ }
      return alerts;
    },
    chapterQualities(){
      if(!this.novel) return [];
      return this.chapters.map((c, i) => ({
        index: i,
        title: c.title || ('第' + (i+1) + '章'),
        quality: c.score && c.score.overall ? c.score.overall : (c.quality || (this.chapStatusClass(c) === 'done' ? 7.5 : 0)),
        status: this.chapStatusClass(c),
      }));
    },
    // P2-6: 趋势分析数据
    trendData(){
      if(!this.novel) return null;
      try{
        const doneCount = this.chapters.filter(c => c.score && c.score.overall).length;
        if(doneCount < 2) return null;
        return TrendAnalyzer.analyze(this.novel, this.chapters.length);
      }catch(e){ return null; }
    },
    // P2-6: 统计数据
    statsData(){
      try{ return StatsTracker.getStats(); }catch(e){ return null; }
    },
    // P2-6: 情节模式统计
    plotStats(){
      if(!this.novel) return null;
      try{
        return PlotPatternDetector.getStats(this.novel, this.chapters.length);
      }catch(e){ return null; }
    },
    // 操作日志
    operationLogs(){
      if(!this.novel) return [];
      // 从章节生成历史推导日志
      const logs = [];
      if(this.novel.createdAt){
        logs.push({ time: this.formatTime(this.novel.createdAt), message: '创建小说项目', type: 'info' });
      }
      if(this.novel.pipeline && this.novel.pipeline.startedAt){
        logs.push({ time: this.formatTime(this.novel.pipeline.startedAt), message: '开始生成流程', type: 'info' });
      }
      // 世界观/角色/大纲生成日志
      if(this.novel.worldview){
        logs.push({ time: this.formatTime(this.novel.worldviewGeneratedAt || this.novel.createdAt), message: '世界观构建完成', type: 'success' });
      }
      if(this.novel.characters && this.novel.characters.length > 0){
        logs.push({ time: this.formatTime(this.novel.charactersGeneratedAt || this.novel.createdAt), message: '角色卡生成完成（' + this.novel.characters.length + '个角色）', type: 'success' });
      }
      if(this.novel.outline && this.novel.outline.length > 0){
        logs.push({ time: this.formatTime(this.novel.outlineGeneratedAt || this.novel.createdAt), message: '章节大纲生成完成（' + this.novel.outline.length + '章）', type: 'success' });
      }
      this.chapters.forEach((c, i) => {
        var isDone = c.status === 'done' || c.status === 'completed' || (c.content && c.content.length > 100);
        if(isDone){
          var time = this.formatTime(c.generatedAt || c.updatedAt || this.novel.updatedAt || this.novel.createdAt);
          logs.push({ time: time, message: '第' + (i+1) + '章《' + (c.title||'') + '》生成完成（' + (c.content ? c.content.length : 0) + '字）', type: 'success' });
        }
        if(c.rewrittenAt){
          logs.push({ time: this.formatTime(c.rewrittenAt), message: '第' + (i+1) + '章重写完成', type: 'warn' });
        }
      });
      if(this.novel.pipeline && this.novel.pipeline.completedAt){
        logs.push({ time: this.formatTime(this.novel.pipeline.completedAt), message: '生成流程完成', type: 'success' });
      }
      // 倒序：最新在前
      return logs.reverse();
    },
  },
  watch: {
    // 切换小说时重置分页
    novelId(){
      this.chapPage = 1;
    },
    activeTab(val){
      // 懒加载页签数据
      if(val === 'memory' && !this.tabLoaded.memory){
        this.tabLoaded.memory = true;
        this.loadMemoryData();
      }
      if(val === 'agent' && !this.tabLoaded.agent){
        this.tabLoaded.agent = true;
        this.loadAgentData();
      }
      if(val === 'health' && !this.tabLoaded.health){
        this.tabLoaded.health = true;
        this.loadHealthData();
      }
      if(val === 'logs' && !this.tabLoaded.logs){
        this.tabLoaded.logs = true;
        this.loadLogsData();
      }
    },
  },
  async mounted(){
    if(store.novelConfig && store.novelConfig.idea && !store.currentNovel){
      await this.startGeneration();
    }else if(store.currentNovel){
      this.readingMode = true;
    }
  },
  template: `
  <div>
    <!-- ===== 生成中视图 ===== -->
    <div v-if="!readingMode" class="gen-view">
      <div class="gen-header">
        <div class="gen-header-inner">
          <div class="gen-title">
            {{ novel ? novel.title : '准备生成...' }}
            <small v-if="isGenerating">{{ metaStage }}</small>
          </div>
          <div class="gen-steps">
            <template v-for="(s,i) in steps" :key="s.key">
              <div class="step-pill"
                   :class="{done: i<activeStep, active: i===activeStep, err: activeStep===i && !isGenerating && progress===0 && genBlocks.length===0}">
                <app-icon v-if="i<activeStep" name="check" :size="14" />
                <span v-else>{{ i+1 }}</span>
                {{ s.name }}
              </div>
              <span v-if="i<steps.length-1" class="step-arrow">→</span>
            </template>
          </div>
        </div>
      </div>

      <div class="gen-body">
        <div class="gen-main">
          <div v-if="genBlocks.length===0" style="text-align:center;padding:3rem;color:var(--warm-gray)">
            <div style="opacity:0.5"><app-icon name="pen-line" :size="40" /></div>
            <p style="margin-top:0.8rem">准备开始创作...</p>
          </div>
          <div v-for="block in genBlocks" :key="block.id" class="stream-block" :id="'stream-'+block.id">
            <h3><app-icon v-if="block.icon" :name="block.icon" :size="16" /> {{ block.title }} <span class="badge">{{ block.done ? '完成' : block.hint }}</span></h3>
            <div class="stream-content" :class="{typing: !block.done}">{{ block.content }}</div>
          </div>
        </div>

        <div class="gen-side">
          <div class="side-card">
            <h4><span class="dot"></span>创作档案</h4>
            <div class="meta-line"><span>创意</span><span>{{ nc.idea }}</span></div>
            <div class="meta-line"><span>题材</span><span>{{ nc.genre }}</span></div>
            <div class="meta-line"><span>风格</span><span>{{ nc.style }}</span></div>
            <div class="meta-line"><span>剧情模式</span><span>{{ getPlotModeName() }}</span></div>
            <div class="meta-line"><span>结局风格</span><span>{{ getEndingName() }}</span></div>
            <div class="meta-line"><span>章节</span><span>{{ nc.chapterCount }} 章 × {{ nc.wordCount }}字</span></div>
            <div class="meta-line"><span>生成模式</span><span :class="currentMode==='api' ? 'mode-tag-ok' : 'mode-tag-mock'">{{ currentMode==='api' ? '真实 AI' : '模拟演示' }}</span></div>
          </div>
          <div class="side-card">
            <h4><span class="dot"></span>进度</h4>
            <div class="meta-line"><span>当前阶段</span><span>{{ metaStage || '-' }}</span></div>
            <div class="meta-line"><span>已完成章节</span><span>{{ metaChap || '0 / 0' }}</span></div>
            <div class="progress-bar"><div class="progress-fill" :style="{width: progress+'%'}"></div></div>
          </div>
          <button v-if="isGenerating" class="btn btn-outline btn-sm" @click="abortGen">中断生成</button>
          <button v-else-if="novel && novel.chapters && novel.chapters.length>0" class="btn btn-primary btn-sm" @click="enterDetail">进入总览 →</button>
        </div>
      </div>
    </div>

    <!-- ===== 小说总览（页签式详情页） ===== -->
    <div v-else class="novel-detail-wrap">
      <!-- 头部 -->
      <div class="novel-detail-header">
        <div class="novel-detail-title">
          <h2>{{ novel ? novel.title : '未命名' }}</h2>
          <p v-if="novel">{{ novel.genre }} · {{ novel.style }} · {{ chapters.length }} 章 · {{ doneCount }} 章已完成</p>
        </div>
        <div class="novel-detail-actions">
          <button class="btn btn-outline btn-sm" @click="exportTxt">
            <app-icon name="download" :size="14" style="margin-right:4px" /> 导出TXT
          </button>
          <button class="btn btn-primary btn-sm" @click="enterWorkspace">
            <app-icon name="edit-2" :size="14" style="margin-right:4px" /> 进入工作台
          </button>
        </div>
      </div>

      <!-- 页签导航 -->
      <div class="novel-detail-tabs">
        <button class="detail-tab" :class="{active: activeTab==='settings'}" @click="activeTab='settings'">
          <app-icon name="book" :size="14" /> 小说设定
        </button>
        <button class="detail-tab" :class="{active: activeTab==='chapters'}" @click="activeTab='chapters'">
          <app-icon name="list" :size="14" /> 章节列表
          <span v-if="chapters.length" class="tab-badge">{{ chapters.length }}</span>
        </button>
        <button class="detail-tab" :class="{active: activeTab==='memory'}" @click="activeTab='memory'">
          <app-icon name="clock" :size="14" /> 记忆引擎
          <span v-if="memoryAtoms.length" class="tab-badge">{{ memoryAtoms.length }}</span>
        </button>
        <button class="detail-tab" :class="{active: activeTab==='agent'}" @click="activeTab='agent'">
          <app-icon name="cpu" :size="14" /> Agent 决策
          <span v-if="agentDirectives.length" class="tab-badge">{{ agentDirectives.length }}</span>
        </button>
        <button class="detail-tab" :class="{active: activeTab==='health'}" @click="activeTab='health'">
          <app-icon name="shield" :size="14" /> 健康监控
        </button>
        <button class="detail-tab" :class="{active: activeTab==='logs'}" @click="activeTab='logs'">
          <app-icon name="list" :size="14" /> 操作日志
        </button>
      </div>

      <!-- 页签内容 -->
      <div class="novel-detail-content">

        <!-- ===== 小说设定 ===== -->
        <div v-if="activeTab==='settings'" class="detail-tab-pane">
          <div class="settings-grid">
            <!-- 基本信息 -->
            <div class="detail-card">
              <div class="detail-card-title">
                <app-icon name="info" :size="16" /> 基本信息
              </div>
              <div class="detail-card-body">
                <div class="kv-row"><span class="kv-key">标题</span><span class="kv-val">{{ novel.title || '未命名' }}</span></div>
                <div class="kv-row"><span class="kv-key">题材</span><span class="kv-val">{{ novel.genre || '-' }}</span></div>
                <div class="kv-row"><span class="kv-key">风格</span><span class="kv-val">{{ novel.style || '-' }}</span></div>
                <div class="kv-row"><span class="kv-key">创意</span><span class="kv-val">{{ novel.idea || '-' }}</span></div>
                <div class="kv-row" v-if="novel.plotMode"><span class="kv-key">剧情模式</span><span class="kv-val">{{ getPlotModeName() }}</span></div>
                <div class="kv-row" v-if="novel.endingStyle"><span class="kv-key">结局风格</span><span class="kv-val">{{ getEndingName() }}</span></div>
              </div>
            </div>

            <!-- 写作配置 -->
            <div class="detail-card">
              <div class="detail-card-title"><app-icon name="sliders" :size="16" /> 写作配置</div>
              <div class="detail-card-body">
                <div class="kv-row"><span class="kv-key">规划章数</span><span class="kv-val">{{ nc.chapterCount }} 章</span></div>
                <div class="kv-row"><span class="kv-key">每章字数</span><span class="kv-val">约 {{ nc.wordCount }} 字</span></div>
                <div class="kv-row"><span class="kv-key">已完成</span><span class="kv-val">{{ doneCount }} / {{ chapters.length }} 章</span></div>
                <div class="kv-row" v-if="novel.volumes && novel.volumes.length"><span class="kv-key">卷结构</span><span class="kv-val">{{ novel.volumes.length }} 卷</span></div>
                <div class="kv-row"><span class="kv-key">生成模式</span><span class="kv-val" :class="currentMode==='api' ? 'mode-tag-ok' : 'mode-tag-mock'">{{ currentMode==='api' ? '真实 AI' : '模拟演示' }}</span></div>
              </div>
            </div>

            <!-- 主角设定 -->
            <div class="detail-card" v-if="novel.protagonist">
              <div class="detail-card-title"><app-icon name="users" :size="16" /> 主角设定</div>
              <div class="detail-card-body">
                <div class="kv-row" v-if="novel.protagonist.name"><span class="kv-key">姓名</span><span class="kv-val">{{ novel.protagonist.name }}</span></div>
                <div class="kv-row" v-if="novel.protagonist.personality"><span class="kv-key">性格</span><span class="kv-val">{{ novel.protagonist.personality }}</span></div>
                <div class="kv-row" v-if="novel.protagonist.goal"><span class="kv-key">目标</span><span class="kv-val">{{ novel.protagonist.goal }}</span></div>
                <div class="kv-row" v-if="novel.protagonist.conflict"><span class="kv-key">冲突</span><span class="kv-val">{{ novel.protagonist.conflict }}</span></div>
              </div>
            </div>

            <!-- 世界观设定 -->
            <div class="detail-card" v-if="novel.worldview || novel.worldSetting">
              <div class="detail-card-title"><app-icon name="globe" :size="16" /> 世界观设定</div>
              <div class="detail-card-body">
                <div v-if="novel.worldview" class="setting-text-block">
                  <div class="setting-text-label">世界观概述</div>
                  <div class="setting-text-content">{{ novel.worldview }}</div>
                </div>
                <div v-if="novel.worldSetting" class="setting-text-block">
                  <div class="setting-text-label">补充设定</div>
                  <div class="setting-text-content">{{ novel.worldSetting }}</div>
                </div>
              </div>
            </div>

            <!-- 角色设定 -->
            <div class="detail-card" v-if="novel.characters">
              <div class="detail-card-title">
                <app-icon name="users" :size="16" /> 角色设定
                <span class="detail-card-count" v-if="novel.memory && novel.memory.characterCards">{{ novel.memory.characterCards.length }} 个角色</span>
              </div>
              <div class="detail-card-body">
                <div class="setting-text-content">{{ novel.characters }}</div>
              </div>
            </div>

            <!-- 章节大纲 -->
            <div class="detail-card" v-if="novel.outline && novel.outline.length > 0">
              <div class="detail-card-title">
                <app-icon name="list" :size="16" /> 章节大纲
                <span class="detail-card-count">{{ novel.outline.length }} 章</span>
              </div>
              <div class="detail-card-body" style="padding:0">
                <div class="outline-list">
                  <div v-for="(item, i) in novel.outline" :key="i" class="outline-item">
                    <div class="outline-item-header">
                      <span class="outline-item-num">第{{ i + 1 }}章</span>
                      <span class="outline-item-title">{{ item.title || '未命名' }}</span>
                    </div>
                    <div class="outline-item-summary" v-if="item.summary">{{ item.summary }}</div>
                    <div class="outline-item-meta" v-if="item.keyConflict">
                      <span class="outline-meta-tag conflict"><app-icon name="alert-triangle" :size="11" /> {{ item.keyConflict }}</span>
                    </div>
                    <div class="outline-item-meta" v-if="item.openHook || item.endHook">
                      <span class="outline-meta-tag hook" v-if="item.openHook"><app-icon name="chevron-right" :size="11" /> 开头: {{ item.openHook }}</span>
                      <span class="outline-meta-tag hook" v-if="item.endHook"><app-icon name="chevron-right" :size="11" /> 结尾: {{ item.endHook }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 额外设定 -->
            <div class="detail-card" v-if="novel.extraSettings || (novel.synopses && novel.synopses.length > 0)">
              <div class="detail-card-title"><app-icon name="file-text" :size="16" /> 额外设定</div>
              <div class="detail-card-body">
                <div v-if="novel.extraSettings" class="setting-text-block">
                  <div class="setting-text-label">额外设定</div>
                  <div class="setting-text-content">{{ novel.extraSettings }}</div>
                </div>
                <div v-if="novel.synopses && novel.synopses.length > 0" class="setting-text-block">
                  <div class="setting-text-label">章节梗概 ({{ novel.synopses.length }} 章)</div>
                  <div class="synopses-list">
                    <div v-for="(syn, i) in novel.synopses" :key="i" class="synopses-item" v-if="syn">
                      <span class="synopses-num">第{{ i + 1 }}章</span>
                      <span class="synopses-text">{{ syn.length > 100 ? syn.substring(0, 100) + '...' : syn }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- ===== 章节列表 ===== -->
        <div v-if="activeTab==='chapters'" class="detail-tab-pane">
          <div class="detail-card">
            <div class="detail-card-title">
              <app-icon name="list" :size="16" /> 章节列表
              <span class="detail-card-count">{{ chapters.length }} 章 · {{ doneCount }} 章已完成</span>
            </div>
            <div class="detail-card-body" style="padding:0">
              <!-- 状态分类汇总：已完成 / 写作中 / 待生成 -->
              <div v-if="chapters.length > 0" class="chap-status-summary">
                <div class="chap-summary-item done">
                  <app-icon name="check-circle" :size="14" />
                  <span class="chap-summary-num">{{ chapterStatusCounts.done }}</span>
                  <span class="chap-summary-label">已完成</span>
                </div>
                <div class="chap-summary-item writing">
                  <app-icon name="edit-2" :size="14" />
                  <span class="chap-summary-num">{{ chapterStatusCounts.writing }}</span>
                  <span class="chap-summary-label">写作中</span>
                </div>
                <div class="chap-summary-item pending">
                  <app-icon name="clock" :size="14" />
                  <span class="chap-summary-num">{{ chapterStatusCounts.pending }}</span>
                  <span class="chap-summary-label">待生成</span>
                </div>
                <div class="chap-summary-progress">
                  <div class="chap-progress-track">
                    <div class="chap-progress-fill" :style="{width: chapterProgressPct + '%'}"></div>
                  </div>
                  <span class="chap-progress-text">总进度 {{ chapterProgressPct }}%</span>
                </div>
              </div>
              <div v-if="chapters.length === 0" class="empty-state-sm">
                <app-icon name="book-open" :size="24" />
                <p>暂无章节，请前往工作台生成</p>
              </div>
              <div v-else class="chap-table">
                <div class="chap-list-header">
                  <span class="col-idx">#</span>
                  <span class="col-title">章节标题</span>
                  <span class="col-status">状态</span>
                  <span class="col-words">字数</span>
                  <span class="col-score">质量</span>
                  <span class="col-action">操作</span>
                </div>
                <div v-for="(ch, i) in pagedChapters" :key="(chapPage - 1) * chapPageSize + i" class="chap-row" :class="chapStatusClass(ch)">
                  <span class="col-idx">{{ (chapPage - 1) * chapPageSize + i + 1 }}</span>
                  <span class="col-title" :title="ch.title || ('第' + ((chapPage - 1) * chapPageSize + i + 1) + '章')">{{ ch.title || ('第' + ((chapPage - 1) * chapPageSize + i + 1) + '章') }}</span>
                  <span class="col-status">
                    <span class="status-badge" :class="chapStatusClass(ch)">{{ chapStatusText(ch) }}</span>
                  </span>
                  <span class="col-words">{{ ch.content ? ch.content.length : '—' }}</span>
                  <span class="col-score">{{ ch.score && ch.score.overall ? ch.score.overall : '—' }}</span>
                  <span class="col-action" @click.stop>
                    <button v-if="chapStatusClass(ch) === 'done'" class="btn btn-outline btn-xs" @click="readChapter((chapPage - 1) * chapPageSize + i)">
                      <app-icon name="book-open" :size="11" /> 阅读
                    </button>
                    <button class="btn btn-outline btn-xs" @click="goChapter((chapPage - 1) * chapPageSize + i)">
                      <app-icon name="edit-2" :size="11" /> 编辑
                    </button>
                  </span>
                </div>
                <!-- 分页器 -->
                <div v-if="totalChapPages > 1" class="chap-pagination">
                  <button class="page-btn" :disabled="chapPage === 1" @click="prevChapPage">
                    <app-icon name="chevron-left" :size="14" />
                  </button>
                  <template v-for="(p, i) in chapPageNumbers" :key="i">
                    <span v-if="p === '...'" class="page-ellipsis">...</span>
                    <button v-else class="page-btn" :class="{active: p === chapPage}" @click="goChapPage(p)">{{ p }}</button>
                  </template>
                  <button class="page-btn" :disabled="chapPage === totalChapPages" @click="nextChapPage">
                    <app-icon name="chevron-right" :size="14" />
                  </button>
                  <span class="page-info">共 {{ chapters.length }} 章</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- ===== 记忆引擎 ===== -->
        <div v-if="activeTab==='memory'" class="detail-tab-pane">
          <!-- 统计卡片 -->
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-icon"><app-icon name="database" :size="20" /></div>
              <div class="stat-info">
                <div class="stat-value">{{ memoryAtoms.length }}</div>
                <div class="stat-label">原子记忆</div>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-icon"><app-icon name="users" :size="20" /></div>
              <div class="stat-info">
                <div class="stat-value">{{ characterCards.length }}</div>
                <div class="stat-label">角色卡片</div>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-icon"><app-icon name="book-open" :size="20" /></div>
              <div class="stat-info">
                <div class="stat-value">{{ storyBibleData ? '1' : '0' }}</div>
                <div class="stat-label">小说画像</div>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-icon"><app-icon name="git-branch" :size="20" /></div>
              <div class="stat-info">
                <div class="stat-value">{{ foreshadowings.length }}</div>
                <div class="stat-label">伏笔追踪</div>
              </div>
            </div>
          </div>

          <!-- 子标签导航 -->
          <div class="sub-tab-nav">
            <button class="sub-tab" :class="{active: memorySubTab==='atoms'}" @click="memorySubTab='atoms'">
              <app-icon name="database" :size="14" /> 原子记忆
            </button>
            <button class="sub-tab" :class="{active: memorySubTab==='cards'}" @click="memorySubTab='cards'">
              <app-icon name="users" :size="14" /> 角色卡片
            </button>
            <button class="sub-tab" :class="{active: memorySubTab==='persona'}" @click="memorySubTab='persona'">
              <app-icon name="book-open" :size="14" /> 小说画像
            </button>
            <button class="sub-tab" :class="{active: memorySubTab==='search'}" @click="memorySubTab='search'">
              <app-icon name="search" :size="14" /> 记忆检索
            </button>
          </div>

          <!-- 子页1：原子记忆 -->
          <div v-if="memorySubTab==='atoms'" class="sub-tab-pane">
            <div class="detail-card">
              <div class="detail-card-title">
                <app-icon name="database" :size="16" /> 原子记忆
                <span class="detail-card-count">{{ memoryAtoms.length }} 条</span>
              </div>
              <div class="detail-card-body">
                <div v-if="memoryAtoms.length === 0" class="empty-pane">
                  <app-icon name="database" :size="32" />
                  <p>暂无原子记忆数据</p>
                  <span>进入工作台生成章节后，记忆引擎将自动提取关键信息</span>
                </div>
                <div v-else class="memory-atom-list">
                  <div v-for="(atom, i) in memoryAtoms.slice(0, 50)" :key="i" class="memory-atom-item">
                    <span class="atom-type" :class="atom.type || 'event'">{{ atom.type || 'event' }}</span>
                    <span class="atom-text">{{ atom.content || atom.text || JSON.stringify(atom).substring(0, 100) }}</span>
                    <span class="atom-chap" v-if="atom.chapter !== undefined">第{{ atom.chapter + 1 }}章</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 子页2：角色卡片 -->
          <div v-if="memorySubTab==='cards'" class="sub-tab-pane">
            <div class="detail-card">
              <div class="detail-card-title">
                <app-icon name="users" :size="16" /> 角色卡片
                <span class="detail-card-count">{{ characterCards.length }} 个角色</span>
              </div>
              <div class="detail-card-body">
                <div v-if="characterCards.length === 0" class="empty-pane">
                  <app-icon name="users" :size="32" />
                  <p>暂无角色卡片数据</p>
                  <span>生成章节后系统将自动维护角色信息</span>
                </div>
                <div v-else class="char-card-grid">
                  <div v-for="(card, i) in characterCards" :key="i" class="char-card-item">
                    <div class="char-card-header">
                      <h4>{{ card.name || card.role || '未知角色' }}</h4>
                      <span v-if="card.status" class="char-status-badge" :class="card.status === 'alive' || card.status === 'active' ? 'alive' : 'dead'">{{ card.status === 'alive' || card.status === 'active' ? '存活' : '离场' }}</span>
                    </div>
                    <div class="char-card-body">
                      <p v-if="card.role" class="char-role">定位：{{ card.role }}</p>
                      <p v-if="card.personality" class="char-personality">{{ card.personality }}</p>
                      <p v-if="card.goal" class="char-goal">目标：{{ card.goal }}</p>
                      <p v-if="card.location" class="char-location">位置：{{ card.location }}</p>
                      <p v-if="card.emotion" class="char-emotion">情绪：{{ card.emotion }}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 伏笔追踪也在角色卡片子页下方展示 -->
            <div class="detail-card" v-if="foreshadowings.length > 0" style="margin-top:1rem">
              <div class="detail-card-title">
                <app-icon name="git-branch" :size="16" /> 伏笔追踪
                <span class="detail-card-count">{{ foreshadowings.length }} 条</span>
              </div>
              <div class="detail-card-body">
                <div class="foreshadow-list">
                  <div v-for="(f, i) in foreshadowings" :key="i" class="foreshadow-item">
                    <span class="foreshadow-status" :class="f.status || 'planted'">{{ getForeshadowStatus(f.status) }}</span>
                    <span class="foreshadow-text">{{ f.content || f.description || f.desc || '' }}</span>
                    <span class="foreshadow-chap" v-if="f.plantedAt !== undefined">埋于第{{ f.plantedAt + 1 }}章</span>
                    <span class="foreshadow-chap" v-if="f.deadline">截止第{{ f.deadline + 1 }}章</span>
                    <span class="foreshadow-chap" v-if="f.resolvedAt !== undefined">回收于第{{ f.resolvedAt + 1 }}章</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 子页3：小说画像 -->
          <div v-if="memorySubTab==='persona'" class="sub-tab-pane">
            <div class="detail-card">
              <div class="detail-card-title">
                <app-icon name="book-open" :size="16" /> 小说画像
              </div>
              <div class="detail-card-body">
                <div v-if="!storyBibleData" class="empty-pane">
                  <app-icon name="book-open" :size="32" />
                  <p>暂无小说画像数据</p>
                  <span>生成一定数量章节后，记忆引擎将自动构建小说画像</span>
                </div>
                <div v-else class="persona-grid">
                  <div v-if="storyBibleData.writing_style" class="persona-item">
                    <div class="persona-label">写作风格</div>
                    <div class="persona-value">{{ storyBibleData.writing_style }}</div>
                  </div>
                  <div v-if="storyBibleData.narrative_techniques" class="persona-item">
                    <div class="persona-label">叙事技巧</div>
                    <div class="persona-value">{{ storyBibleData.narrative_techniques }}</div>
                  </div>
                  <div v-if="storyBibleData.theme_preferences" class="persona-item">
                    <div class="persona-label">主题偏好</div>
                    <div class="persona-value">{{ storyBibleData.theme_preferences }}</div>
                  </div>
                  <div v-if="storyBibleData.character_archetypes" class="persona-item">
                    <div class="persona-label">角色原型</div>
                    <div class="persona-value">{{ storyBibleData.character_archetypes }}</div>
                  </div>
                  <div v-if="storyBibleData.world_building_patterns" class="persona-item">
                    <div class="persona-label">世界观模式</div>
                    <div class="persona-value">{{ storyBibleData.world_building_patterns }}</div>
                  </div>
                  <div v-if="storyBibleData.tone_consistency" class="persona-item">
                    <div class="persona-label">基调一致性</div>
                    <div class="persona-value">{{ storyBibleData.tone_consistency }}</div>
                  </div>
                  <div v-if="storyBibleData.summary" class="persona-item persona-full">
                    <div class="persona-label">画像概要</div>
                    <div class="persona-value">{{ storyBibleData.summary }}</div>
                  </div>
                  <!-- 如果 storyBible 是纯文本，直接展示 -->
                  <div v-if="!storyBibleData.writing_style && !storyBibleData.summary && typeof storyBibleData === 'object'" class="persona-item persona-full">
                    <div class="persona-label">画像内容</div>
                    <div class="persona-value">{{ JSON.stringify(storyBibleData, null, 2) }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 子页4：记忆检索 -->
          <div v-if="memorySubTab==='search'" class="sub-tab-pane">
            <div class="detail-card">
              <div class="detail-card-title">
                <app-icon name="search" :size="16" /> 记忆检索
              </div>
              <div class="detail-card-body">
                <!-- 搜索框 -->
                <div class="memory-search-bar">
                  <input v-model="memorySearchQuery" type="text" class="memory-search-input" placeholder="输入关键词搜索记忆..." @keyup.enter="searchMemory" />
                  <button class="btn btn-primary btn-sm" @click="searchMemory" :disabled="memorySearching">
                    <app-icon name="search" :size="14" /> {{ memorySearching ? '搜索中...' : '搜索' }}
                  </button>
                </div>
                <!-- 快捷检索 -->
                <div class="memory-quick-search">
                  <button class="btn btn-outline btn-xs" @click="quickSearchMemory('role')">角色记忆</button>
                  <button class="btn btn-outline btn-xs" @click="quickSearchMemory('plot')">情节记忆</button>
                  <button class="btn btn-outline btn-xs" @click="quickSearchMemory('worldview')">世界观记忆</button>
                </div>
                <!-- 搜索结果 -->
                <div v-if="memorySearchResults.length > 0" class="memory-search-results">
                  <div class="search-results-count">找到 {{ memorySearchResults.length }} 条结果</div>
                  <div v-for="(result, i) in memorySearchResults" :key="i" class="memory-search-item">
                    <span class="atom-type" :class="result.type || 'event'">{{ result.type || 'event' }}</span>
                    <span class="atom-text">{{ result.content || result.text || '' }}</span>
                    <span class="atom-chap" v-if="result.chapter !== undefined">第{{ result.chapter + 1 }}章</span>
                    <span class="search-score" v-if="result.score">相关度：{{ (result.score * 100).toFixed(0) }}%</span>
                  </div>
                </div>
                <div v-else-if="!memorySearching && memorySearchQuery" class="empty-pane-sm">
                  <p>未找到相关记忆</p>
                </div>
                <div v-else class="empty-pane-sm">
                  <app-icon name="search" :size="24" />
                  <p>输入关键词进行语义检索</p>
                  <span>支持角色、情节、世界观等多维度记忆搜索</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- ===== Agent 决策 ===== -->
        <div v-if="activeTab==='agent'" class="detail-tab-pane">
          <!-- 统计卡片 -->
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-icon"><app-icon name="cpu" :size="20" /></div>
              <div class="stat-info">
                <div class="stat-value">{{ agentOutcomeStats?.totalDecisions || agentDirectives.length }}</div>
                <div class="stat-label">总决策次数</div>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-icon"><app-icon name="check-circle" :size="20" /></div>
              <div class="stat-info">
                <div class="stat-value">{{ agentOutcomeStats?.successRate || 0 }}%</div>
                <div class="stat-label">指令有效率</div>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-icon"><app-icon name="zap" :size="20" /></div>
              <div class="stat-info">
                <div class="stat-value">{{ agentDirectives.filter(d => d.isActive !== false).length }}</div>
                <div class="stat-label">活跃指令数</div>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-icon"><app-icon name="trending-up" :size="20" /></div>
              <div class="stat-info">
                <div class="stat-value">{{ agentLogs.filter(l => l.type === 'evaluation').length }}</div>
                <div class="stat-label">评估记录</div>
              </div>
            </div>
          </div>

          <!-- 子标签导航 -->
          <div class="sub-tab-nav">
            <button class="sub-tab" :class="{active: agentSubTab==='monitor'}" @click="agentSubTab='monitor'">
              <app-icon name="activity" :size="14" /> 实时监控
            </button>
            <button class="sub-tab" :class="{active: agentSubTab==='timeline'}" @click="agentSubTab='timeline'">
              <app-icon name="clock" :size="14" /> 决策时间线
            </button>
            <button class="sub-tab" :class="{active: agentSubTab==='directives'}" @click="agentSubTab='directives'">
              <app-icon name="zap" :size="14" /> 活跃指令
            </button>
            <button class="sub-tab" :class="{active: agentSubTab==='outcomes'}" @click="agentSubTab='outcomes'">
              <app-icon name="bar-chart" :size="14" /> 效果分析
            </button>
          </div>

          <!-- 子页1：实时监控 -->
          <div v-if="agentSubTab==='monitor'" class="sub-tab-pane">
            <div class="detail-card">
              <div class="detail-card-title"><app-icon name="activity" :size="16" /> Agent 运行状态</div>
              <div class="detail-card-body">
                <div class="agent-status-grid">
                  <div class="agent-status-card">
                    <div class="agent-status-header"><app-icon name="cpu" :size="14" /> 写作策略师</div>
                    <div class="agent-status-body">
                      <div class="agent-metric"><span>决策数</span><b>{{ agentDirectives.filter(d => d.type === 'strategy').length }}</b></div>
                      <div class="agent-metric"><span>活跃数</span><b>{{ agentDirectives.filter(d => d.type === 'strategy' && d.isActive !== false).length }}</b></div>
                    </div>
                  </div>
                  <div class="agent-status-card">
                    <div class="agent-status-header"><app-icon name="eye" :size="14" /> 质量监控师</div>
                    <div class="agent-status-body">
                      <div class="agent-metric"><span>决策数</span><b>{{ agentDirectives.filter(d => d.type === 'quality').length }}</b></div>
                      <div class="agent-metric"><span>活跃数</span><b>{{ agentDirectives.filter(d => d.type === 'quality' && d.isActive !== false).length }}</b></div>
                    </div>
                  </div>
                  <div class="agent-status-card">
                    <div class="agent-status-header"><app-icon name="sliders" :size="14" /> 系统优化师</div>
                    <div class="agent-status-body">
                      <div class="agent-metric"><span>决策数</span><b>{{ agentDirectives.filter(d => d.type === 'optimization').length }}</b></div>
                      <div class="agent-metric"><span>活跃数</span><b>{{ agentDirectives.filter(d => d.type === 'optimization' && d.isActive !== false).length }}</b></div>
                    </div>
                  </div>
                </div>
                <div class="subsystem-status-grid">
                  <div class="subsystem-card">
                    <span class="subsystem-name">趋势预测器</span>
                    <span class="subsystem-status" :class="trendData ? 'active' : 'idle'">{{ trendData ? '运行中' : '待机' }}</span>
                  </div>
                  <div class="subsystem-card">
                    <span class="subsystem-name">情节模式检测</span>
                    <span class="subsystem-status" :class="plotStats ? 'active' : 'idle'">{{ plotStats ? '运行中' : '待机' }}</span>
                  </div>
                  <div class="subsystem-card">
                    <span class="subsystem-name">认知负荷监控</span>
                    <span class="subsystem-status" :class="novel?.chapters?.length > 3 ? 'active' : 'idle'">{{ novel?.chapters?.length > 3 ? '运行中' : '待机' }}</span>
                  </div>
                  <div class="subsystem-card">
                    <span class="subsystem-name">写后评审组</span>
                    <span class="subsystem-status" :class="agentLogs.length > 0 ? 'active' : 'idle'">{{ agentLogs.length > 0 ? '运行中' : '待机' }}</span>
                  </div>
                  <div class="subsystem-card">
                    <span class="subsystem-name">反馈闭环</span>
                    <span class="subsystem-status" :class="agentOutcomeStats?.totalDecisions > 0 ? 'active' : 'idle'">{{ agentOutcomeStats?.totalDecisions > 0 ? '运行中' : '待机' }}</span>
                  </div>
                  <div class="subsystem-card">
                    <span class="subsystem-name">迭代精修</span>
                    <span class="subsystem-status" :class="agentLogs.filter(l => l.type === 'rewrite').length > 0 ? 'active' : 'idle'">{{ agentLogs.filter(l => l.type === 'rewrite').length > 0 ? '运行中' : '待机' }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 子页2：决策时间线 -->
          <div v-if="agentSubTab==='timeline'" class="sub-tab-pane">
            <div class="detail-card">
              <div class="detail-card-title">
                <app-icon name="clock" :size="16" /> 决策时间线
                <span class="detail-card-count">{{ agentLogs.length }} 条</span>
              </div>
              <div class="detail-card-body">
                <div v-if="agentLogs.length === 0" class="empty-pane">
                  <app-icon name="clock" :size="32" />
                  <p>暂无决策记录</p>
                  <span>生成章节后 Agent 系统将自动产生决策记录</span>
                </div>
                <div v-else class="timeline-list">
                  <div v-for="(log, i) in agentLogs.slice(0, 50)" :key="i" class="timeline-item">
                    <div class="timeline-dot" :class="log.type || 'info'"></div>
                    <div class="timeline-content">
                      <div class="timeline-header">
                        <span class="timeline-type" :class="log.type || 'info'">{{ getAgentLogTypeLabel(log.type) }}</span>
                        <span class="timeline-time" v-if="log.timestamp || log.time">{{ formatTime(log.timestamp || log.time) }}</span>
                      </div>
                      <div class="timeline-message">{{ log.message || log.content || '' }}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 子页3：活跃指令 -->
          <div v-if="agentSubTab==='directives'" class="sub-tab-pane">
            <div class="detail-card">
              <div class="detail-card-title">
                <app-icon name="zap" :size="16" /> 活跃指令
                <span class="detail-card-count">{{ agentDirectives.filter(d => d.isActive !== false).length }} 条</span>
              </div>
              <div class="detail-card-body">
                <div v-if="agentDirectives.length === 0" class="empty-pane">
                  <app-icon name="zap" :size="32" />
                  <p>暂无活跃指令</p>
                  <span>Agent 系统在生成过程中会自动产生策略指令</span>
                </div>
                <div v-else class="directive-list">
                  <div v-for="(d, i) in agentDirectives" :key="i" class="directive-item">
                    <div class="directive-header">
                      <span class="directive-type" :class="d.type || 'strategy'">{{ d.type || 'strategy' }}</span>
                      <span v-if="d.priority" class="directive-priority">优先级：{{ d.priority }}</span>
                      <span v-if="d.isActive === false" class="directive-inactive">已停用</span>
                    </div>
                    <div class="directive-text">{{ d.directive || d.content || d.text || '' }}</div>
                    <div class="directive-meta">
                      <span v-if="d.applyFrom !== undefined">生效：第{{ d.applyFrom + 1 }}章</span>
                      <span v-if="d.applyTo !== undefined">至第{{ d.applyTo + 1 }}章</span>
                      <span v-if="d.expiresAt !== undefined">过期：第{{ d.expiresAt + 1 }}章</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 子页4：效果分析 -->
          <div v-if="agentSubTab==='outcomes'" class="sub-tab-pane">
            <div class="detail-card">
              <div class="detail-card-title">
                <app-icon name="bar-chart" :size="16" /> 效果分析
              </div>
              <div class="detail-card-body">
                <div v-if="!agentOutcomeStats || agentOutcomeStats.totalDecisions === 0" class="empty-pane">
                  <app-icon name="bar-chart" :size="32" />
                  <p>暂无效果分析数据</p>
                  <span>需要生成一定数量章节后才能评估指令效果</span>
                </div>
                <div v-else class="outcome-analysis">
                  <div class="outcome-summary">
                    <div class="outcome-stat">
                      <div class="outcome-stat-value">{{ agentOutcomeStats.totalDecisions }}</div>
                      <div class="outcome-stat-label">总决策</div>
                    </div>
                    <div class="outcome-stat">
                      <div class="outcome-stat-value">{{ agentOutcomeStats.successRate }}%</div>
                      <div class="outcome-stat-label">有效率</div>
                    </div>
                  </div>
                  <div v-if="Object.keys(agentOutcomeStats.byType).length > 0" class="outcome-section">
                    <h4>按类型统计</h4>
                    <div class="outcome-type-list">
                      <div v-for="(stats, type) in agentOutcomeStats.byType" :key="type" class="outcome-type-item">
                        <span class="outcome-type-name">{{ type }}</span>
                        <div class="outcome-type-bar">
                          <div class="outcome-type-fill" :style="{width: (stats.effective / stats.total * 100) + '%'}"></div>
                        </div>
                        <span class="outcome-type-num">{{ stats.effective }}/{{ stats.total }}</span>
                        <span class="outcome-type-delta">平均：{{ stats.avgDelta > 0 ? '+' : '' }}{{ stats.avgDelta }}</span>
                      </div>
                    </div>
                  </div>
                  <div v-if="agentOutcomeStats.topEffective.length > 0" class="outcome-section">
                    <h4>最有效指令 TOP 5</h4>
                    <div class="outcome-top-list">
                      <div v-for="(item, i) in agentOutcomeStats.topEffective" :key="'e'+i" class="outcome-top-item">
                        <span class="outcome-rank">#{{ i + 1 }}</span>
                        <span class="outcome-type-badge" :class="item.type">{{ item.type }}</span>
                        <span class="outcome-directive">{{ item.directive.substring(0, 60) }}{{ item.directive.length > 60 ? '...' : '' }}</span>
                        <span class="outcome-delta positive">+{{ item.delta }}</span>
                      </div>
                    </div>
                  </div>
                  <div v-if="agentOutcomeStats.topHarmful.length > 0" class="outcome-section">
                    <h4>需关注指令 TOP 5</h4>
                    <div class="outcome-top-list">
                      <div v-for="(item, i) in agentOutcomeStats.topHarmful" :key="'h'+i" class="outcome-top-item">
                        <span class="outcome-rank">#{{ i + 1 }}</span>
                        <span class="outcome-type-badge" :class="item.type">{{ item.type }}</span>
                        <span class="outcome-directive">{{ item.directive.substring(0, 60) }}{{ item.directive.length > 60 ? '...' : '' }}</span>
                        <span class="outcome-delta negative">{{ item.delta }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- ===== 健康监控 ===== -->
        <div v-if="activeTab==='health'" class="detail-tab-pane">
          <!-- 健康分 -->
          <div class="health-score-section">
            <div class="health-score-card" :class="getHealthClass(healthScore)">
              <div class="health-score-num">{{ healthScore }}</div>
              <div class="health-score-label">健康分</div>
              <div class="health-score-status">{{ getHealthStatus(healthScore) }}</div>
            </div>
            <div class="health-summary">
              <div class="health-stat">
                <span class="health-stat-label">已完成章节</span>
                <span class="health-stat-val">{{ doneCount }} / {{ chapters.length }}</span>
              </div>
              <div class="health-stat">
                <span class="health-stat-label">平均质量分</span>
                <span class="health-stat-val">{{ getAvgQuality() }}</span>
              </div>
              <div class="health-stat">
                <span class="health-stat-label">告警数</span>
                <span class="health-stat-val" :class="healthAlerts.length > 0 ? 'text-warn' : ''">{{ healthAlerts.length }}</span>
              </div>
            </div>
          </div>

          <!-- 章节质量分布 -->
          <div class="detail-card" style="margin-top:1rem">
            <div class="detail-card-title"><app-icon name="bar-chart" :size="16" /> 章节质量分布</div>
            <div class="detail-card-body">
              <div v-if="chapterQualities.length === 0" class="empty-pane">
                <p>暂无章节数据</p>
              </div>
              <div v-else class="quality-chart">
                <div v-for="q in chapterQualities" :key="q.index" class="quality-bar-row">
                  <span class="quality-bar-label">第{{ q.index + 1 }}章</span>
                  <div class="quality-bar-track">
                    <div class="quality-bar-fill" :class="getQualityClass(q.quality)" :style="{width: (q.quality * 10) + '%'}"></div>
                  </div>
                  <span class="quality-bar-score" :class="getQualityClass(q.quality)">{{ q.quality > 0 ? q.quality.toFixed(1) : '-' }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- 情绪曲线 -->
          <div class="detail-card" style="margin-top:1rem" v-if="emotionCurveData.length > 0">
            <div class="detail-card-title"><app-icon name="activity" :size="16" /> 情绪分数曲线</div>
            <div class="detail-card-body">
              <div class="curve-chart">
                <div v-for="p in emotionCurveData" :key="'e'+p.x" class="curve-bar-row">
                  <span class="curve-bar-label">第{{ p.x }}章</span>
                  <div class="curve-bar-track">
                    <div class="curve-bar-fill emotion" :style="{width: (p.y * 10) + '%'}"></div>
                  </div>
                  <span class="curve-bar-score">{{ p.y.toFixed(1) }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- 质量曲线 -->
          <div class="detail-card" style="margin-top:1rem" v-if="qualityCurveData.length > 0">
            <div class="detail-card-title"><app-icon name="trending-up" :size="16" /> 质量分数曲线</div>
            <div class="detail-card-body">
              <div class="curve-chart">
                <div v-for="p in qualityCurveData" :key="'q'+p.x" class="curve-bar-row">
                  <span class="curve-bar-label">第{{ p.x }}章</span>
                  <div class="curve-bar-track">
                    <div class="curve-bar-fill quality" :style="{width: (p.y * 10) + '%'}"></div>
                  </div>
                  <span class="curve-bar-score">{{ p.y.toFixed(1) }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- 角色出场状态 -->
          <div class="detail-card" style="margin-top:1rem" v-if="characterStatusList.length > 0">
            <div class="detail-card-title"><app-icon name="users" :size="16" /> 角色出场状态</div>
            <div class="detail-card-body">
              <div class="char-status-list">
                <div v-for="(char, i) in characterStatusList" :key="i" class="char-status-row">
                  <span class="char-status-name">{{ char.name }}</span>
                  <span class="char-status-chap" v-if="char.lastChapter > 0">最后出场：第{{ char.lastChapter }}章</span>
                  <span class="char-status-chap" v-else>未出场</span>
                  <span class="char-status-gap" v-if="char.gap > 5" :class="{warning: char.gap > 5}">缺席{{ char.gap }}章</span>
                  <span class="char-status-badge-sm" :class="char.status">{{ char.status === 'active' ? '活跃' : char.status === 'dead' ? '离场' : '未知' }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- 待回收伏笔 -->
          <div class="detail-card" style="margin-top:1rem" v-if="pendingForeshadowings.total > 0">
            <div class="detail-card-title">
              <app-icon name="git-branch" :size="16" /> 待回收伏笔
              <span class="detail-card-count">{{ pendingForeshadowings.total }} 条</span>
              <span v-if="pendingForeshadowings.agedCount > 0" class="badge-warn">{{ pendingForeshadowings.agedCount }} 条预警</span>
            </div>
            <div class="detail-card-body">
              <div class="pending-foreshadow-list">
                <div v-for="(f, i) in pendingForeshadowings.items" :key="i" class="pending-foreshadow-item" :class="{warning: f.warning}">
                  <span class="pending-foreshadow-text">{{ f.content || f.description || f.desc || '' }}</span>
                  <div class="pending-foreshadow-meta">
                    <span>埋于第{{ f.plantedAt + 1 }}章</span>
                    <span>已等待{{ f.age }}章</span>
                    <span v-if="f.deadline">截止第{{ f.deadline + 1 }}章</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 告警信息 -->
          <div class="detail-card" style="margin-top:1rem">
            <div class="detail-card-title"><app-icon name="alert-triangle" :size="16" /> 系统告警</div>
            <div class="detail-card-body">
              <div v-if="healthAlerts.length === 0" class="empty-pane-sm">
                <app-icon name="check-circle" :size="24" />
                <span>所有指标正常</span>
              </div>
              <div v-else class="alert-list">
                <div v-for="(alert, i) in healthAlerts" :key="i" class="alert-item" :class="alert.level || 'warn'">
                  <span class="alert-level">{{ alert.level || 'warn' }}</span>
                  <span class="alert-text">{{ alert.message || alert.text || '' }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- P2-6: 趋势分析 -->
          <div class="detail-card" style="margin-top:1rem" v-if="trendData">
            <div class="detail-card-title"><app-icon name="trending-up" :size="16" /> 趋势分析</div>
            <div class="detail-card-body">
              <div class="trend-metrics">
                <div v-for="(m, key) in trendData.metrics" :key="key" class="trend-metric-item" :class="m.status">
                  <div class="trend-metric-header">
                    <span class="trend-metric-name">{{ trendMetricName(key) }}</span>
                    <span class="trend-metric-status" :class="m.status">{{ m.status }}</span>
                  </div>
                  <div class="trend-metric-bar">
                    <div class="trend-metric-fill" :class="m.status" :style="{width: Math.min(100, (m.current / m.target) * 100) + '%'}"></div>
                  </div>
                  <div class="trend-metric-detail">
                    当前 {{ m.current.toFixed(1) }} / 目标 {{ m.target }}
                    <span v-if="m.slope < 0" class="trend-down">下降</span>
                    <span v-else-if="m.slope > 0" class="trend-up">上升</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- P2-6: 写作统计 -->
          <div class="detail-card" style="margin-top:1rem" v-if="statsData">
            <div class="detail-card-title"><app-icon name="bar-chart" :size="16" /> 写作统计</div>
            <div class="detail-card-body">
              <div class="stats-grid">
                <div class="stats-item">
                  <span class="stats-label">今日字数</span>
                  <span class="stats-value">{{ statsData.today.words }}</span>
                </div>
                <div class="stats-item">
                  <span class="stats-label">今日章节</span>
                  <span class="stats-value">{{ statsData.today.chapters }}</span>
                </div>
                <div class="stats-item">
                  <span class="stats-label">本周字数</span>
                  <span class="stats-value">{{ statsData.week.words }}</span>
                </div>
                <div class="stats-item">
                  <span class="stats-label">总字数</span>
                  <span class="stats-value">{{ statsData.total.words }}</span>
                </div>
                <div class="stats-item">
                  <span class="stats-label">总章节</span>
                  <span class="stats-value">{{ statsData.total.chapters }}</span>
                </div>
                <div class="stats-item">
                  <span class="stats-label">API调用</span>
                  <span class="stats-value">{{ statsData.total.apiCalls }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- P2-6: 情节模式分布 -->
          <div class="detail-card" style="margin-top:1rem" v-if="plotStats">
            <div class="detail-card-title"><app-icon name="layers" :size="16" /> 情节模式分布</div>
            <div class="detail-card-body">
              <div class="plot-stats-section">
                <span class="plot-stats-title">开篇方式</span>
                <div class="plot-stats-tags">
                  <span v-for="(count, type) in plotStats.opening" :key="'o'+type" class="plot-tag">
                    {{ plotTypeName(type) }}: {{ count }}
                  </span>
                </div>
              </div>
              <div class="plot-stats-section">
                <span class="plot-stats-title">钩子类型</span>
                <div class="plot-stats-tags">
                  <span v-for="(count, type) in plotStats.hook" :key="'h'+type" class="plot-tag">
                    {{ plotTypeName(type) }}: {{ count }}
                  </span>
                </div>
              </div>
              <div class="plot-stats-section">
                <span class="plot-stats-title">爽点类型</span>
                <div class="plot-stats-tags">
                  <span v-for="(count, type) in plotStats.coolPoint" :key="'c'+type" class="plot-tag">
                    {{ plotTypeName(type) }}: {{ count }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- ===== 操作日志 ===== -->
        <div v-if="activeTab==='logs'" class="detail-tab-pane">
          <div class="detail-card">
            <div class="detail-card-title">
              <app-icon name="clock" :size="16" /> 操作日志
              <span class="detail-card-count">{{ (logsList || operationLogs).length }} 条</span>
            </div>
            <div class="detail-card-body">
              <div v-if="(logsList || operationLogs).length === 0" class="empty-pane">
                <app-icon name="clock" :size="32" />
                <p>暂无操作日志</p>
                <span>生成小说后操作记录将显示在此处</span>
              </div>
              <div v-else class="log-timeline">
                <div v-for="(log, i) in (logsList || operationLogs)" :key="i" class="log-timeline-item">
                  <span class="log-timeline-dot" :class="log.type"></span>
                  <div class="log-timeline-content">
                    <span class="log-timeline-msg">{{ log.message }}</span>
                    <span class="log-timeline-time">{{ log.time }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  </div>
  `,
  methods: {
    async startGeneration(){
      if(store.mode === 'mock'){
        store.toast('模拟演示模式：生成固定示例内容', 'warn');
      }else{
        store.toast('真实 AI 模式：正在调用大模型生成...', 'success');
      }
      Engine.reset();
      const novel = await Engine.run(store.novelConfig);
      if(novel){
        store.currentNovel = novel;
        store.saveToLibrary(novel);
        if(!Engine.abortFlag){
          store.toast('小说生成完成！', 'success');
          setTimeout(()=>{ this.readingMode = true; }, 1000);
        }
      }
    },

    abortGen(){
      Engine.abort();
    },

    enterDetail(){
      this.readingMode = true;
    },

    // 进入小说工作台
    enterWorkspace(){
      if(this.novelId){
        this.$router.push('/novel/' + this.novelId);
      } else {
        store.toast('无法进入工作台', 'error');
      }
    },

    // 章节状态判定：有 content 即视为已完成
    chapStatusClass(ch){
      if(ch.status === 'done' || ch.status === 'completed') return 'done';
      if(ch.status === 'writing') return 'writing';
      if(ch.content && ch.content.length > 100) return 'done';
      return 'pending';
    },
    chapStatusText(ch){
      var cls = this.chapStatusClass(ch);
      if(cls === 'done') return '已完成';
      if(cls === 'writing') return '写作中';
      return '待生成';
    },

    // 章节分页控制
    goChapPage(p){
      if(p === '...') return;
      if(p < 1 || p > this.totalChapPages) return;
      this.chapPage = p;
    },
    prevChapPage(){
      if(this.chapPage > 1) this.chapPage--;
    },
    nextChapPage(){
      if(this.chapPage < this.totalChapPages) this.chapPage++;
    },

    editSettings(){
      // 跳转到创建页并携带当前小说数据用于编辑
      if(this.novelId){
        this.$router.push('/create?edit=' + this.novelId);
      } else {
        store.toast('无法编辑：小说ID缺失', 'error');
      }
    },

    readChapter(idx){
      // 进入沉浸式阅读界面
      if(this.novelId){
        this.$router.push('/reader/' + this.novelId + '/' + idx);
      } else {
        store.toast('无法打开章节：小说ID缺失', 'error');
      }
    },

    goChapter(idx){
      // 编辑按钮进入章节详情页
      if(this.novelId){
        this.$router.push('/chapter/' + this.novelId + '/' + idx);
      } else {
        store.toast('无法打开章节：小说ID缺失', 'error');
      }
    },

    exportTxt(){
      if(!this.novel) return;
      let txt = `${this.novel.title}\n${'='.repeat(40)}\n\n`;
      txt += `创意：${this.novel.idea}\n题材：${this.novel.genre} | 风格：${this.novel.style}\n\n${'='.repeat(40)}\n\n`;
      this.novel.chapters.forEach((c,i)=>{
        txt += `第${i+1}章 ${c.title||''}\n\n${c.content||''}\n\n`;
      });
      const blob = new Blob([txt],{type:'text/plain;charset=utf-8'});
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `${this.novel.title||'小说'}.txt`;
      a.click();
      URL.revokeObjectURL(a.href);
      store.toast('已导出 TXT 文件', 'success');
    },

    // 懒加载记忆引擎数据 - 调用后端API，回退到本地数据
    async loadMemoryData(){
      if(!this.novelId) return;
      try{
        const res = await fetch('/api/dashboard/' + this.novelId + '/memory');
        const json = await res.json();
        if(json.ok && json.data){
          // 如果API返回了数据，且本地 novel.memory 为空，则填充
          if(!this.novel.memory || (!this.novel.memory.atoms && json.data.atoms)){
            if(!this.novel.memory) this.novel.memory = {};
            if(json.data.atoms && json.data.atoms.length > 0){
              this.novel.memory.atoms = json.data.atoms;
            }
            if(json.data.cards && json.data.cards.length > 0){
              // 转为对象格式以兼容 MemoryEngine 的 characterCards 结构
              const cardObj = {};
              json.data.cards.forEach(c => { cardObj[c.name] = c; });
              this.novel.memory.characterCards = cardObj;
            }
            if(json.data.foreshadowings && json.data.foreshadowings.length > 0){
              this.novel.memory.foreshadowing = json.data.foreshadowings;
            }
          }
          this.memoryStats = json.data.stats || null;
        }
      }catch(e){
        // API不可用时静默回退到本地数据（computed 属性已处理）
      }
      // 本地回退：尝试用 MemoryEngine 提取
      if(this.novel && !this.novel.memory){
        if(typeof MemoryEngine !== 'undefined' && MemoryEngine.getStats){
          this.memoryStats = MemoryEngine.getStats(this.novel);
        }
      }
    },

    async loadAgentData(){
      if(!this.novelId) return;
      try{
        const res = await fetch('/api/dashboard/' + this.novelId + '/agent');
        const json = await res.json();
        if(json.ok && json.data){
          if(json.data.directives && json.data.directives.length > 0 && !this.novel.agentDirectives){
            this.novel.agentDirectives = json.data.directives;
          }
          if(json.data.logs && json.data.logs.length > 0 && !this.novel.agentLogs){
            this.novel.agentLogs = json.data.logs;
          }
          this.agentStats = json.data.stats || null;
        }
      }catch(e){
        // API不可用时静默回退
      }
      // 本地回退：尝试用 AgentCoordinator 获取
      if(this.novel && !this.novel.agentDirectives){
        if(typeof AgentCoordinator !== 'undefined' && AgentCoordinator.getDirectives){
          this.novel.agentDirectives = AgentCoordinator.getDirectives(this.novel);
        }
      }
    },

    async loadHealthData(){
      if(!this.novelId) return;
      try{
        const res = await fetch('/api/dashboard/' + this.novelId + '/health');
        const json = await res.json();
        if(json.ok && json.data){
          if(!this.novel.healthStats){
            this.novel.healthStats = {
              score: json.data.score || 60,
              alerts: json.data.alerts || [],
              emotionCurve: json.data.emotionCurve || [],
              qualityCurve: json.data.qualityCurve || [],
              recommendations: json.data.recommendations || [],
            };
          }
          this.healthStats = json.data;
        }
      }catch(e){
        // API不可用时静默回退
      }
      // 本地回退：尝试用 NovelController 获取
      if(this.novel && !this.novel.healthStats){
        if(typeof NovelController !== 'undefined' && NovelController.getHealthStats){
          this.novel.healthStats = NovelController.getHealthStats(this.novel);
        }
      }
    },

    // 懒加载操作日志 - 调用后端API，回退到本地推导
    async loadLogsData(){
      if(!this.novelId) return;
      try{
        const res = await fetch('/api/dashboard/' + this.novelId + '/logs');
        const json = await res.json();
        if(json.ok && json.data && json.data.length > 0){
          // API 返回的日志优先使用
          this.logsList = json.data.map(log => ({
            time: this.formatTime(log.createdAt || log.created_at),
            message: log.message || log.action || '未知操作',
            type: log.action && log.action.indexOf('error') >= 0 ? 'error' :
                  log.action && log.action.indexOf('rewrite') >= 0 ? 'warn' : 'info',
          }));
        } else {
          // API 无数据时保持 logsList 为 null，回退到 operationLogs
          this.logsList = null;
        }
      }catch(e){
        // API不可用时使用 computed operationLogs 推导的数据
        this.logsList = null;
      }
    },

    // 辅助方法
    getPlotModeName(){
      const nc = this.novel || store.novelConfig;
      if(!nc) return '-';
      const pm = CONST.PLOT_MODES.find(p=>p.val===nc.plotMode);
      return pm ? pm.name : '-';
    },
    getEndingName(){
      const nc = this.novel || store.novelConfig;
      if(!nc) return '-';
      const es = CONST.ENDING_STYLES.find(e=>e.val===nc.endingStyle);
      return es ? es.name : '-';
    },
    getChapStatusName(status){
      const map = { done:'已完成', writing:'写作中', outline:'大纲中', pending:'待生成', error:'出错' };
      return map[status] || '待生成';
    },
    getQualityClass(score){
      if(score >= 8) return 'good';
      if(score >= 6) return 'ok';
      if(score > 0) return 'warn';
      return 'none';
    },
    getHealthClass(score){
      if(score >= 80) return 'healthy';
      if(score >= 50) return 'warning';
      return 'danger';
    },
    getHealthStatus(score){
      if(score >= 80) return '健康';
      if(score >= 50) return '需关注';
      return '异常';
    },
    getAvgQuality(){
      const done = this.chapterQualities.filter(q => q.quality > 0);
      if(done.length === 0) return '-';
      const avg = done.reduce((s, q) => s + q.quality, 0) / done.length;
      return avg.toFixed(1);
    },
    // P2-6: 趋势指标中文名
    trendMetricName(key){
      const names = {
        quality_score: '质量分',
        emotion_score: '情感分',
        cool_point_density: '爽点密度',
        word_count_accuracy: '字数准确度',
      };
      return names[key] || key;
    },
    // P2-6: 情节模式中文名
    plotTypeName(type){
      const names = {
        normal: '常规',
        suspense: '悬念',
        action: '动作',
        dialogue: '对话',
        none: '无',
        underdog_win: '逆袭',
        face_slap: '打脸',
        treasure_find: '寻宝',
        breakthrough: '突破',
        power_expand: '扩力',
        romance_win: '情感',
        wisdom_win: '智斗',
        mystery_reveal: '揭秘',
      };
      return names[type] || type;
    },
    getForeshadowStatus(status){
      const map = { planted:'已埋设', resolved:'已回收', abandoned:'已放弃' };
      return map[status] || '已埋设';
    },
    getAgentLogTypeLabel(type){
      const map = {
        evaluation: '评估', critic: '评审', rewrite: '重写',
        strategy: '策略', quality: '质量', optimization: '优化',
        info: '信息', success: '成功', warn: '警告', error: '错误',
      };
      return map[type] || type || '信息';
    },
    // 记忆检索：调用 MemoryEngine.semanticSearch
    async searchMemory(){
      if(!this.memorySearchQuery.trim() || !this.novel) return;
      this.memorySearching = true;
      try{
        if(typeof MemoryEngine !== 'undefined' && MemoryEngine.semanticSearch){
          const results = MemoryEngine.semanticSearch(this.novel, this.memorySearchQuery, 20);
          this.memorySearchResults = results || [];
        }else{
          // 降级：简单关键词匹配
          const q = this.memorySearchQuery.toLowerCase();
          this.memorySearchResults = this.memoryAtoms.filter(atom => {
            const text = (atom.content || atom.text || '').toLowerCase();
            return text.includes(q);
          }).slice(0, 20);
        }
      }catch(e){
        store.toast('记忆检索失败：' + e.message, 'error');
      }finally{
        this.memorySearching = false;
      }
    },
    // 快捷检索：按类型筛选记忆
    quickSearchMemory(type){
      const typeMap = { role: '角色记忆', plot: '情节记忆', worldview: '世界观记忆' };
      this.memorySearchQuery = typeMap[type] || type;
      this.memorySearchResults = this.memoryAtoms.filter(atom => {
        if(type === 'role') return atom.type === 'role' || atom.type === 'character_trait';
        if(type === 'plot') return atom.type === 'plot' || atom.type === 'plot_detail';
        if(type === 'worldview') return atom.type === 'worldview' || atom.type === 'world_setting';
        return false;
      }).slice(0, 20);
    },
    formatTime(ts){
      if(!ts) return '';
      const d = new Date(ts);
      const pad = n => String(n).padStart(2, '0');
      return `${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
    },
  },
};

window.GeneratePage = GeneratePage;
