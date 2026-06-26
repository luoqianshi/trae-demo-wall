/* ============================================================
 * Novel 工作台页 - 小说创作全流程管理
 *
 * 布局：左侧栏（信息+管道+统计）+ 右侧主区域（生成流/章节列表）
 * 核心能力：
 *   1. 七步生成管道，每步可独立触发
 *   2. 一键全流程（Engine.run）
 *   3. 章节列表 + 单章写作
 *   4. 自动连写（循环 genChapter，可中断）
 *   5. 导出 TXT
 *
 * ctx 对象与 Engine.run 保持一致：
 *   Object.defineProperty 同步 abortFlag 到 Engine.abortFlag，
 *   确保中断信号在单步/连写模式下也能正确传递。
 * ============================================================ */

// 七步生成管道定义
// field 对应 novel 对象上的字段，用于判断该步是否已完成
const PIPELINE_STEPS = [
  { key:'worldview',     name:'世界观',   icon:'globe',   gen:'genWorldview',      field:'worldview' },
  { key:'characters',    name:'角色',     icon:'users',   gen:'genCharacters',     field:'characters' },
  { key:'storyOutline',  name:'故事纲',   icon:'map',     gen:'genStoryOutline',   field:'storyOutline' },
  { key:'volumeOutline', name:'卷大纲',   icon:'layers',  gen:'genVolumeOutline',  field:'volumeOutlines' },
  { key:'outline',       name:'章节细纲', icon:'list',    gen:'genOutline',        field:'outline' },
  { key:'synopses',      name:'章节简介', icon:'file-text', gen:'genAllSynopses',  field:'synopses' },
  { key:'chapters',      name:'正文',     icon:'book',    gen:'genAllChapters',    field:'chapters' },
];

const NovelPage = {
  name: 'NovelPage',

  // 使用 Composition API 获取路由参数（与 VueRouter 4 useRoute 一致）
  setup(){
    const route = VueRouter.useRoute();
    return { route };
  },

  data(){
    return {
      // 右侧主区域视图：'chapters' 章节列表 | 'stream' 生成流 | 'info' 小说设定
      mainView: 'chapters',
      // 当前生成模式：'idle' | 'single' | 'full' | 'auto'
      runMode: 'idle',
      // 自动写作标志
      autoWriting: false,
      // 正在写作的章节序号（-1 表示无）
      writingChapIdx: -1,
      // 当前查看内容的管道步骤序号（null 表示关闭弹窗）
      viewingStep: null,
      // 侧边栏折叠状态
      sideCollapsed: {},
      // P2-5: 导出菜单
      showExportMenu: false,
      // P2-4: 封面管理
      coverData: null,
      coverLoading: false,
      // 生成流当前查看的步骤序号（步骤可点击切换）
      activeStreamStep: 0,
      // 章节列表分页
      chapPage: 1,
      chapPageSize: 10,
      // 生成流 chunk 折叠状态
      collapsedChunks: {},
      // 管道查看弹窗中当前选择的 chunk/章节索引
      viewingChunkIdx: 0,
    };
  },

  computed: {
    // 直接引用 store.currentNovel，保证 Engine 修改字段后视图自动更新
    novel(){ return store.currentNovel; },
    pipelineSteps(){ return PIPELINE_STEPS; },

    // Engine 响应式状态包装（Vue 3 模板无法直接访问全局变量，需经 computed 暴露）
    isGenerating(){ return Engine.isGenerating; },
    genBlocks(){ return Engine.genBlocks; },
    activeStep(){ return Engine.activeStep; },
    metaStage(){ return Engine.metaStage; },
    metaChap(){ return Engine.metaChap; },
    progress(){ return Engine.progress; },

    // ===== 管道查看弹窗：多块步骤的下拉选项 =====
    viewingStepOptions(){
      if(this.viewingStep === null) return [];
      const step = this.pipelineSteps[this.viewingStep];
      const n = this.novel;
      if(!n) return [];
      if(step.field === 'outline'){
        const total = n.outline ? n.outline.length : 0;
        if(total === 0) return [];
        const batchCount = Math.ceil(total / 10);
        return Array.from({length: batchCount}, function(_, i){
          return { label: '第' + (i * 10 + 1) + '-' + Math.min((i + 1) * 10, total) + '章', value: i };
        });
      }
      if(step.field === 'synopses'){
        if(!n.synopses) return [];
        return n.synopses.map(function(s, i){
          if(!s || s.length < 10) return null;
          return { label: '第' + (i + 1) + '章简介', value: i };
        }).filter(function(o){ return o !== null; });
      }
      if(step.field === 'chapters'){
        if(!n.chapters) return [];
        return n.chapters.map(function(c, i){
          if(!c || !c.content) return null;
          return { label: '第' + (i + 1) + '章 ' + (c.title || ''), value: i };
        }).filter(function(o){ return o !== null; });
      }
      return [];
    },
    // 弹窗中当前显示的内容（基于 viewingChunkIdx 选择）
    viewingStepContent(){
      if(this.viewingStep === null) return '';
      const step = this.pipelineSteps[this.viewingStep];
      const n = this.novel;
      if(!n) return '';
      const val = n[step.field];
      if(!val) return '';
      if(Array.isArray(val)){
        if(step.field === 'outline'){
          var batch = this.viewingChunkIdx;
          var start = batch * 10;
          var end = Math.min(start + 10, val.length);
          return val.slice(start, end).map(function(o, i){
            return '第' + (start + i + 1) + '章 ' + (o.title || '') + '\n' + (o.summary || '');
          }).join('\n\n');
        }
        if(step.field === 'synopses'){
          var idx = this.viewingChunkIdx;
          return '=== 第' + (idx + 1) + '章简介 ===\n' + (val[idx] || '');
        }
        if(step.field === 'chapters'){
          var idx = this.viewingChunkIdx;
          var c = val[idx];
          if(!c) return '';
          return '第' + (idx + 1) + '章 ' + (c.title || '') + '\n' + (c.content || '');
        }
        if(step.field === 'volumeOutlines'){
          return val.map(function(v){ return v.raw || v.name || ''; }).join('\n\n');
        }
        return JSON.stringify(val, null, 2);
      }
      return String(val);
    },

    // ===== 小说状态（实时计算，避免持久化的 status 字段过期）=====
    novelStatus(){
      const n = this.novel;
      if(!n) return 'draft';
      const completed = this.completedCount;
      const total = this.totalChapters;
      if(total > 0 && completed >= total) return 'completed';
      if(n.chapters && n.chapters.some(c => c && c.content)) return 'writing';
      if(n.outline && n.outline.length > 0) return 'outlining';
      return 'draft';
    },
    statusText(){
      return { draft:'草稿', outlining:'大纲中', writing:'写作中', completed:'已完成' }[this.novelStatus] || '草稿';
    },

    // ===== 进度统计 =====
    totalChapters(){
      const n = this.novel;
      if(!n) return 0;
      return n.chapterCount || (n.outline ? n.outline.length : 0) || 0;
    },
    completedCount(){
      const n = this.novel;
      if(!n || !n.chapters) return 0;
      return n.chapters.filter(c => c && c.content).length;
    },
    progressPct(){
      if(this.totalChapters === 0) return 0;
      return Math.round(this.completedCount / this.totalChapters * 100);
    },
    totalWords(){
      const n = this.novel;
      if(!n || !n.chapters) return 0;
      return n.chapters.reduce((sum, c) => sum + (c && c.content ? c.content.length : 0), 0);
    },
    avgScore(){
      const n = this.novel;
      if(!n || !n.chapters) return 0;
      const scores = n.chapters.filter(c => c && c.score).map(c => c.score.overall);
      if(scores.length === 0) return 0;
      return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    },

    // ===== 章节列表（合并 outline 与 chapters）=====
    mergedChapters(){
      const n = this.novel;
      if(!n) return [];
      const outline = n.outline || [];
      const chapters = n.chapters || [];
      const count = Math.max(outline.length, chapters.length, this.totalChapters);
      const result = [];
      for(let i = 0; i < count; i++){
        const o = outline[i];
        const c = chapters[i];
        result.push({
          idx: i,
          title: (c && c.title) || (o && o.title) || ('第' + (i + 1) + '章'),
          outline: o ? (o.summary || '') : '',
          content: c ? (c.content || '') : '',
          words: c && c.content ? c.content.length : 0,
          score: c && c.score ? c.score.overall : null,
          status: this.chapStatus(i),
        });
      }
      return result;
    },

    // ===== 分页 =====
    pagedChapters(){
      const start = (this.chapPage - 1) * this.chapPageSize;
      return this.mergedChapters.slice(start, start + this.chapPageSize);
    },
    totalChapPages(){
      return Math.ceil(this.mergedChapters.length / this.chapPageSize) || 1;
    },
    chapPageNumbers(){
      const total = this.totalChapPages;
      const cur = this.chapPage;
      if(total <= 7) return Array.from({length: total}, (_, i) => i + 1);
      var pages = [1];
      if(cur > 3) pages.push('...');
      var start = Math.max(2, cur - 1);
      var end = Math.min(total - 1, cur + 1);
      for(var i = start; i <= end; i++) pages.push(i);
      if(cur < total - 2) pages.push('...');
      pages.push(total);
      return pages;
    },

    // ===== 生成流：当前步骤的输出 blocks =====
    // 生成中 → 取 Engine.genBlocks 实时数据
    // 非生成中 → 取 novel.streamData 持久化数据（兼容 chunks 和 blocks 两种格式）
    // 兼容旧数据 → 从 novel 字段合成 block
    currentStepBlocks(){
      var stepIdx = this.activeStreamStep;
      // 生成中且当前步骤匹配：取实时 Engine.genBlocks
      if(Engine.isGenerating && Engine.activeStep === stepIdx){
        return this.genBlocks.filter(b => this.blockStepIndex(b.id) === stepIdx);
      }
      // 非生成中：取持久化数据（优先 chunks 格式，兼容 blocks 格式）
      if(this.novel && this.novel.streamData){
        var step = this.pipelineSteps[stepIdx];
        var saved = this.novel.streamData[step.key];
        if(saved){
          // 新格式：chunks — 过滤降级合成块和旧格式单块，仅保留真实分块
          if(saved.chunks && saved.chunks.length > 0){
            var realChunks = saved.chunks.filter(function(c){
              return !c.id.endsWith('-synth') && c.id !== step.key;
            });
            if(realChunks.length > 0) return realChunks;
            return saved.chunks;
          }
          // 旧格式：blocks
          if(saved.blocks && saved.blocks.length > 0) return saved.blocks;
        }
      }
      // 降级：从 novel 字段合成 block（兼容无 streamData 的旧数据）
      if(this.novel && this.stepStatus(stepIdx) === 'done'){
        var step2 = this.pipelineSteps[stepIdx];
        var content = this.stepContent(stepIdx);
        if(content){
          return [{
            id: step2.key + '-synth',
            title: step2.name,
            hint: '',
            icon: step2.icon,
            content: content,
            done: true,
          }];
        }
      }
      return [];
    },

    hasOutline(){
      const n = this.novel;
      return !!(n && n.outline && n.outline.length > 0);
    },

    autoWriteProgress(){
      return this.completedCount + '/' + this.totalChapters;
    },

    plotModeName(){
      const n = this.novel;
      if(!n) return '-';
      const pm = CONST.PLOT_MODES.find(p => p.val === n.plotMode);
      return pm ? pm.name : (n.plotMode || '-');
    },
    endingName(){
      const n = this.novel;
      if(!n) return '-';
      const es = CONST.ENDING_STYLES.find(e => e.val === n.endingStyle);
      return es ? es.name : (n.endingStyle || '-');
    },
  },

  mounted(){
    const id = this.route.params.id;
    this.loadNovel(id);
  },

  template: `
  <div class="novel-wrap">
    <!-- 未加载到小说 -->
    <div v-if="!novel" class="empty-state">
      <div class="icon"><app-icon name="book-open" :size="48" /></div>
      <p>未找到该小说，请从书架进入</p>
      <button class="btn btn-outline btn-sm" style="margin-top:1rem" @click="$router.push('/library')">返回书架</button>
    </div>

    <template v-else>
      <!-- ===== 头部 ===== -->
      <div class="novel-header">
        <div class="novel-header-left">
          <button class="btn btn-outline btn-sm" @click="$router.push('/library')">
            <app-icon name="arrow-left" :size="16" /> 书架
          </button>
          <h1 class="novel-title">{{ novel.title || '未命名' }}</h1>
          <span class="status-badge" :class="novelStatus">{{ statusText }}</span>
        </div>
        <div class="novel-header-right">
          <button class="btn btn-primary btn-sm" @click="runAll" :disabled="isGenerating">
            <app-icon name="zap" :size="16" /> 一键生成
          </button>
          <div class="export-dropdown" v-if="showExportMenu" v-click-outside="closeExportMenu">
            <button class="export-menu-item" @click="doExport('txt')">
              <app-icon name="file-text" :size="14" /> 导出 TXT
            </button>
            <button class="export-menu-item" @click="doExport('json')">
              <app-icon name="code" :size="14" /> 导出 JSON
            </button>
            <button class="export-menu-item" @click="exportSynopses">
              <app-icon name="list" :size="14" /> 导出章节简介
            </button>
          </div>
          <button class="btn btn-outline btn-sm" @click="toggleExportMenu">
            <app-icon name="download" :size="16" /> 导出
          </button>
          <button class="btn btn-outline btn-sm" @click="triggerImport">
            <app-icon name="upload" :size="16" /> 导入
          </button>
          <input ref="importInput" type="file" accept=".json" style="display:none" @change="handleImport" />
        </div>
      </div>

      <!-- ===== 主体双栏 ===== -->
      <div class="novel-body">
        <!-- 左侧栏 -->
        <aside class="novel-side">
          <!-- 小说信息 -->
          <div class="side-card novel-info">
            <h4 @click="toggleSide('info')" style="cursor:pointer">
              <span class="card-icon"><app-icon name="info" :size="16" /></span>
              小说信息
              <span class="sec-chevron" style="margin-left:auto" :class="{collapsed: sideCollapsed.info}"><app-icon name="chevron-down" :size="14" /></span>
            </h4>
            <div v-show="!sideCollapsed.info">
              <div class="meta-line"><span>题材</span><span>{{ novel.genre || '-' }}</span></div>
              <div class="meta-line"><span>风格</span><span>{{ novel.style || '-' }}</span></div>
              <div class="meta-line"><span>剧情模式</span><span>{{ plotModeName }}</span></div>
              <div class="meta-line"><span>结局风格</span><span>{{ endingName }}</span></div>
              <div class="meta-line"><span>进度</span><span>{{ completedCount }}/{{ totalChapters }} 章</span></div>
              <div class="progress-bar"><div class="progress-fill" :style="{width: progressPct + '%'}"></div></div>
            </div>
          </div>

          <!-- 生成管道 -->
          <div class="side-card pipeline-card">
            <h4 @click="toggleSide('pipe')" style="cursor:pointer">
              <span class="card-icon"><app-icon name="sliders" :size="16" /></span>
              生成管道
              <span class="sec-chevron" style="margin-left:auto" :class="{collapsed: sideCollapsed.pipe}"><app-icon name="chevron-down" :size="14" /></span>
            </h4>
            <div v-show="!sideCollapsed.pipe" class="pipeline-timeline">
              <div v-for="(step, i) in pipelineSteps" :key="step.key" class="pipeline-step" :class="stepStatus(i)">
                <div class="step-info">
                  <span class="step-name"><app-icon :name="step.icon" :size="14" /> {{ step.name }}</span>
                  <span class="step-status" :class="stepStatus(i)">{{ stepStatusText(i) }}</span>
                </div>
                <div class="step-actions">
                  <button class="btn btn-outline btn-sm" @click="runStep(i)" :disabled="stepDisabled(i)">
                    <app-icon name="play" :size="12" /> {{ stepStatus(i)==='done' ? '重生成' : '生成' }}
                  </button>
                  <button v-if="stepStatus(i)==='done'" class="btn btn-outline btn-sm" @click="viewStep(i)">
                    <app-icon name="eye" :size="12" /> 查看
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- 统计 -->
          <div class="side-card stats-card">
            <h4 @click="toggleSide('stats')" style="cursor:pointer">
              <span class="card-icon"><app-icon name="trending-up" :size="16" /></span>
              统计
              <span class="sec-chevron" style="margin-left:auto" :class="{collapsed: sideCollapsed.stats}"><app-icon name="chevron-down" :size="14" /></span>
            </h4>
            <div v-show="!sideCollapsed.stats" class="stats-grid">
              <div class="stat-item">
                <div class="stat-num">{{ totalWords }}</div>
                <div class="stat-label">总字数</div>
              </div>
              <div class="stat-item">
                <div class="stat-num">{{ completedCount }}</div>
                <div class="stat-label">已完成章</div>
              </div>
              <div class="stat-item">
                <div class="stat-num">{{ avgScore || '-' }}</div>
                <div class="stat-label">平均质量分</div>
              </div>
              <div class="stat-item">
                <div class="stat-num">{{ totalChapters }}</div>
                <div class="stat-label">目标章数</div>
              </div>
            </div>
          </div>
        </aside>

        <!-- 右侧主区域 -->
        <main class="novel-main">
          <!-- Tab 导航 -->
          <div class="main-tabs">
            <button class="main-tab" :class="{active: mainView==='chapters'}" @click="mainView='chapters'">
              <app-icon name="list" :size="16" /> 章节列表
            </button>
            <button class="main-tab" :class="{active: mainView==='stream'}" @click="mainView='stream'">
              <app-icon name="pen-line" :size="16" /> 生成流
            </button>
            <button class="main-tab" :class="{active: mainView==='info'}" @click="mainView='info'">
              <app-icon name="book-open" :size="16" /> 小说设定
            </button>
          </div>

          <!-- ===== 生成流视图（按步骤单独显示，步骤可点击） ===== -->
          <div v-if="mainView==='stream'" class="gen-view">
            <div class="gen-header">
              <div class="gen-header-inner">
                <div class="gen-title">
                  {{ isGenerating ? metaStage : '生成输出' }}
                  <small v-if="isGenerating && metaChap">{{ metaChap }}</small>
                </div>
                <div class="gen-steps">
                  <template v-for="(s, i) in pipelineSteps" :key="s.key">
                    <div class="step-pill step-clickable"
                         :class="{done: stepStatus(i)==='done', active: activeStreamStep===i, generating: isGenerating && activeStep===i}"
                         @click="selectStreamStep(i)">
                      <app-icon v-if="stepStatus(i)==='done'" name="check" :size="14" />
                      <span v-else>{{ i + 1 }}</span>
                      {{ s.name }}
                    </div>
                    <span v-if="i < pipelineSteps.length - 1" class="step-arrow">→</span>
                  </template>
                </div>
              </div>
            </div>

            <div class="gen-stream">
              <div v-if="currentStepBlocks.length === 0" class="stream-empty">
                <app-icon name="pen-line" :size="40" />
                <p style="margin-top:0.8rem">{{ isGenerating ? '正在准备...' : '该步骤暂无内容，请在左侧管道点击「生成」' }}</p>
              </div>
              <div v-for="block in currentStepBlocks" :key="block.id" class="stream-block chunk-block" :id="'stream-' + block.id">
                <div class="chunk-header" @click="toggleChunkCollapse(block.id)">
                  <span class="chunk-toggle">
                    <app-icon :name="isChunkCollapsed(block.id) ? 'chevron-right' : 'chevron-down'" :size="14" />
                  </span>
                  <h3 style="margin:0;flex:1">
                    <app-icon v-if="block.icon" :name="block.icon" :size="16" /> {{ block.title }}
                    <span class="badge">{{ block.done ? '完成' : block.hint }}</span>
                  </h3>
                  <span v-if="block.truncated" class="truncation-warning" title="内容被截断，可能不完整">
                    <app-icon name="alert-triangle" :size="14" />
                  </span>
                  <button v-if="!isGenerating && block.done" class="btn btn-outline btn-xs"
                          @click.stop="regenerateChunk(block.id)" title="重生成此块">
                    <app-icon name="refresh-cw" :size="11" />
                  </button>
                </div>
                <div v-show="!isChunkCollapsed(block.id)" class="stream-content" :class="{typing: !block.done}">{{ block.content }}</div>
              </div>
            </div>

            <div class="gen-footer">
              <div class="progress-bar"><div class="progress-fill" :style="{width: progress + '%'}"></div></div>
              <div class="gen-footer-actions">
                <button v-if="isGenerating" class="btn btn-danger btn-sm" @click="abortGen">
                  <app-icon name="square" :size="14" /> 中断
                </button>
                <template v-else>
                  <button v-if="stepStatus(activeStreamStep)==='done'" class="btn btn-outline btn-sm" @click="runStep(activeStreamStep)">
                    <app-icon name="refresh-cw" :size="14" /> 重生成此步骤
                  </button>
                  <button class="btn btn-outline btn-sm" @click="mainView='chapters'">
                    <app-icon name="list" :size="14" /> 返回章节列表
                  </button>
                </template>
              </div>
            </div>
          </div>

          <!-- ===== 章节列表视图 ===== -->
          <div v-if="mainView==='chapters'" class="chap-list-view">
            <div class="chap-toolbar">
              <h3>章节列表 <span class="chap-count">{{ mergedChapters.length }}</span></h3>
              <div class="chap-toolbar-actions">
                <button v-if="!autoWriting" class="btn btn-primary btn-sm"
                        @click="startAutoWrite" :disabled="isGenerating || !hasOutline">
                  <app-icon name="play" :size="14" /> 开始连写
                </button>
                <button v-else class="btn btn-danger btn-sm" @click="stopAutoWrite">
                  <app-icon name="square" :size="14" /> 停止 ({{ autoWriteProgress }})
                </button>
                <button class="btn btn-outline btn-sm" @click="exportTxt">
                  <app-icon name="download" :size="14" /> 导出
                </button>
              </div>
            </div>

            <div v-if="mergedChapters.length === 0" class="empty-state">
              <div class="icon"><app-icon name="list" :size="48" /></div>
              <p>暂无章节，请先在左侧管道生成「章节细纲」</p>
            </div>

            <div v-else class="chap-list">
              <div class="chap-list-header">
                <span class="col-idx">序号</span>
                <span class="col-title">标题</span>
                <span class="col-status">状态</span>
                <span class="col-words">字数</span>
                <span class="col-score">质量分</span>
                <span class="col-action">操作</span>
              </div>
              <div v-for="ch in pagedChapters" :key="ch.idx"
                   class="chap-row" :class="ch.status" @click="openChapter(ch.idx)">
                <span class="col-idx">{{ ch.idx + 1 }}</span>
                <span class="col-title">
                  <div class="chap-title-text">{{ ch.title }}</div>
                  <div v-if="ch.outline" class="chap-outline-text">{{ ch.outline.slice(0, 60) }}{{ ch.outline.length > 60 ? '...' : '' }}</div>
                </span>
                <span class="col-status">
                  <span class="status-badge" :class="ch.status">{{ chapStatusText(ch.status) }}</span>
                </span>
                <span class="col-words">{{ ch.words > 0 ? ch.words : '—' }}</span>
                <span class="col-score">{{ ch.score !== null ? ch.score : '—' }}</span>
                <span class="col-action" @click.stop>
                  <button class="btn btn-outline btn-xs"
                          @click="writeSingle(ch.idx)" :disabled="isGenerating">
                    <app-icon name="pen-line" :size="11" /> 生成
                  </button>
                  <button class="btn btn-outline btn-xs" @click="openChapter(ch.idx)">
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
                <span class="page-info">共 {{ mergedChapters.length }} 章</span>
              </div>
            </div>
          </div>

          <!-- ===== 小说设定视图 ===== -->
          <div v-if="mainView==='info'" class="novel-settings-panel">
            <h3 style="font-family:'Noto Serif SC',serif;font-size:1.1rem;margin-bottom:1rem;display:flex;align-items:center;gap:0.5rem">
              <app-icon name="book-open" :size="18" /> 小说设定
              <button class="btn btn-outline btn-xs" style="margin-left:auto" @click="editSettings">
                <app-icon name="edit-2" :size="14" /> 编辑
              </button>
            </h3>
            <div class="settings-grid">
              <div class="settings-item">
                <div class="si-label">标题</div>
                <div class="si-value">{{ novel.title || '-' }}</div>
              </div>
              <div class="settings-item">
                <div class="si-label">题材类型</div>
                <div class="si-value">{{ novel.genre || '-' }}</div>
              </div>
              <div class="settings-item">
                <div class="si-label">写作风格</div>
                <div class="si-value">{{ novel.style || '-' }}</div>
              </div>
              <div class="settings-item">
                <div class="si-label">参考作者</div>
                <div class="si-value">{{ novel.referenceAuthor || '-' }}</div>
              </div>
              <div class="settings-item">
                <div class="si-label">剧情模式</div>
                <div class="si-value">{{ plotModeName }}</div>
              </div>
              <div class="settings-item">
                <div class="si-label">结局风格</div>
                <div class="si-value">{{ endingName }}</div>
              </div>
              <div class="settings-item">
                <div class="si-label">章节数</div>
                <div class="si-value">{{ novel.chapterCount || '-' }} 章</div>
              </div>
              <div class="settings-item">
                <div class="si-label">每章字数</div>
                <div class="si-value">{{ novel.wordCount || '-' }} 字</div>
              </div>
              <div class="settings-item">
                <div class="si-label">卷结构</div>
                <div class="si-value">{{ novel.volumeStructure || 'single' }}</div>
              </div>
              <div class="settings-item" v-if="novel.protagonist && novel.protagonist.name">
                <div class="si-label">主角</div>
                <div class="si-value">{{ novel.protagonist.name }}</div>
              </div>
            </div>

            <div v-if="novel.idea" class="settings-item" style="margin-top:1rem">
              <div class="si-label">创意描述</div>
              <div class="si-value long">{{ novel.idea }}</div>
            </div>
            <div v-if="novel.worldSetting" class="settings-item" style="margin-top:0.8rem">
              <div class="si-label">世界观补充</div>
              <div class="si-value long">{{ novel.worldSetting }}</div>
            </div>
            <div v-if="novel.protagonist && (novel.protagonist.personality || novel.protagonist.goal || novel.protagonist.conflict)" class="settings-item" style="margin-top:0.8rem">
              <div class="si-label">主角设定</div>
              <div class="si-value long">
                <span v-if="novel.protagonist.personality">性格：{{ novel.protagonist.personality }}</span><br v-if="novel.protagonist.personality && novel.protagonist.goal">
                <span v-if="novel.protagonist.goal">目标：{{ novel.protagonist.goal }}</span><br v-if="novel.protagonist.goal && novel.protagonist.conflict">
                <span v-if="novel.protagonist.conflict">冲突：{{ novel.protagonist.conflict }}</span>
              </div>
            </div>

            <div v-if="novel.styleVector" class="settings-item" style="margin-top:0.8rem">
              <div class="si-label">风格向量</div>
              <div class="si-value">
                文风: {{ novel.styleVector.style || '-' }} |
                节奏: {{ novel.styleVector.pacing || '-' }} |
                情感: {{ novel.styleVector.emotion || '-' }} |
                智识: {{ novel.styleVector.intellect || '-' }}
              </div>
            </div>
          </div>
        </main>
      </div>

      <!-- ===== 步骤内容查看弹窗 ===== -->
      <div v-if="viewingStep !== null" class="step-modal-mask" @click="viewingStep = null">
        <div class="step-modal" @click.stop>
          <div class="step-modal-header">
            <h3><app-icon :name="pipelineSteps[viewingStep].icon" :size="18" /> {{ pipelineSteps[viewingStep].name }}</h3>
            <button class="drawer-close" @click="viewingStep = null"><app-icon name="x" :size="18" /></button>
          </div>
          <div v-if="viewingStepOptions.length > 1" class="step-modal-selector">
            <select v-model="viewingChunkIdx" class="step-selector">
              <option v-for="opt in viewingStepOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
            </select>
          </div>
          <div class="step-modal-body">
            <pre class="step-content-pre">{{ viewingStepContent }}</pre>
          </div>
        </div>
      </div>
    </template>
  </div>
  `,

  methods: {
    // ===== 侧边栏折叠 =====
    toggleSide(key){
      this.sideCollapsed[key] = !this.sideCollapsed[key];
    },

    // ===== 加载小说 =====
    // 优先使用 store.currentNovel（id 匹配时），否则从书架查找
    loadNovel(id){
      let novel = store.currentNovel;
      if(!novel || novel.id !== id){
        if(!store.openFromLibrary(id)){
          store.toast('未找到该小说', 'error');
          return;
        }
        novel = store.currentNovel;
      }
      // 确保记忆引擎已初始化（单步生成依赖 MemoryEngine）
      if(novel && !novel.memory){
        MemoryEngine.init(novel);
      }
      // 初始化生成流持久化数据结构
      if(novel && !novel.streamData){
        novel.streamData = {};
      }
      // 默认查看最后完成的步骤
      if(novel && novel.streamData){
        for(let i = PIPELINE_STEPS.length - 1; i >= 0; i--){
          if(novel.streamData[PIPELINE_STEPS[i].key]){
            this.activeStreamStep = i;
            break;
          }
        }
      }
      // 重置章节分页
      this.chapPage = 1;
      // 同步 novelConfig，供 Engine.run 全流程使用
      this.syncNovelConfig();
    },

    // 将当前小说的配置字段同步到 store.novelConfig
    // 为什么这么做：Engine.run(novelConfig) 内部会 createNovel(novelConfig)，
    // 需要完整的配置字段才能正确创建小说对象
    syncNovelConfig(){
      const n = this.novel;
      if(!n) return;
      store.novelConfig = {
        idea: n.idea,
        title: n.title,
        genre: n.genre,
        style: n.style,
        styleVector: n.styleVector,
        referenceAuthor: n.referenceAuthor,
        protagonist: n.protagonist,
        worldSetting: n.worldSetting,
        plotMode: n.plotMode,
        endingStyle: n.endingStyle,
        chapterCount: n.chapterCount,
        wordCount: n.wordCount,
        volumeStructure: n.volumeStructure,
        volumes: n.volumes,
      };
    },

    // ===== 创建 ctx 对象 =====
    // 与 Engine.run 内部一致：用 Object.defineProperty 把 abortFlag
    // 绑定到 Engine.abortFlag，确保中断信号实时同步
    makeCtx(){
      const ctx = { novelConfig: this.novel, abortFlag: false, abortCtrl: null };
      Object.defineProperty(ctx, 'abortFlag', {
        get: () => Engine.abortFlag,
        configurable: true,
      });
      return ctx;
    },

    // ===== 管道步骤状态 =====
    stepStatus(i){
      // 生成中：当前激活步骤
      if(Engine.isGenerating && Engine.activeStep === i) return 'generating';
      // 全流程模式下，已过去的步骤视为完成
      if(Engine.isGenerating && this.runMode === 'full' && i < Engine.activeStep) return 'done';
      // 根据小说字段判断
      const n = this.novel;
      if(n){
        const step = this.pipelineSteps[i];
        const val = n[step.field];
        const done = Array.isArray(val) ? val.length > 0 : !!val;
        if(done) return 'done';
      }
      return 'pending';
    },
    stepStatusText(i){
      const s = this.stepStatus(i);
      return { done:'已完成', generating:'生成中', pending:'待生成' }[s] || '待生成';
    },
    // 前置步骤未完成时禁用后续步骤（已完成的步骤允许重生成）
    stepDisabled(i){
      if(Engine.isGenerating) return true;
      if(this.stepStatus(i) === 'done') return false;
      for(let j = 0; j < i; j++){
        if(this.stepStatus(j) !== 'done') return true;
      }
      return false;
    },

    // ===== 单步生成 =====
    async runStep(stepIdx){
      if(Engine.isGenerating) return;
      if(!this.novel) return;
      if(!this.checkConfig()) return;

      const step = this.pipelineSteps[stepIdx];
      this.mainView = 'stream';
      this.activeStreamStep = stepIdx;
      this.runMode = 'single';
      Engine.reset();
      Engine.isGenerating = true;
      Engine.activeStep = stepIdx;
      Engine.metaStage = '生成' + step.name;
      const ctx = this.makeCtx();
      try{
        await Engine[step.gen](this.novel, ctx);
        if(!Engine.abortFlag){
          // 持久化该步骤的生成流数据
          this.saveStepBlocks(stepIdx);
          store.saveToLibrary(this.novel);
          store.toast(step.name + '生成完成', 'success');
        }
      }catch(e){
        console.error(step.name + '生成失败', e);
        store.toast(step.name + '生成失败: ' + e.message, 'error');
      }finally{
        Engine.isGenerating = false;
        Engine.activeStep = -1;
        this.runMode = 'idle';
      }
    },

    // ===== 一键全流程（逐步保存） =====
    // 按管道顺序逐步执行，每步完成后立即保存到数据库
    // 为什么不用 Engine.run：Engine.run 内部一次性生成所有内容，
    // 中途中断会导致前面的步骤数据全部丢失
    async runAll(){
      if(Engine.isGenerating) return;
      if(!this.checkConfig()) return;

      this.syncNovelConfig();
      this.mainView = 'stream';
      this.runMode = 'full';
      Engine.reset();
      const ctx = this.makeCtx();
      const n = this.novel;

      try{
        for(let i = 0; i < this.pipelineSteps.length; i++){
          if(Engine.abortFlag) break;
          const step = this.pipelineSteps[i];
          // 跳过已完成的步骤（但允许用户强制重生成）
          if(this.stepStatus(i) === 'done') continue;

          Engine.isGenerating = true;
          Engine.activeStep = i;
          this.activeStreamStep = i;
          Engine.metaStage = '生成' + step.name;
          Engine.metaChap = '';

          try{
            await Engine[step.gen](n, ctx);
            // 每步完成后保存生成流数据并持久化
            this.saveStepBlocks(i);
            store.saveToLibrary(n);
            if(!Engine.abortFlag){
              store.toast(step.name + ' 已保存', 'success');
            }
          }catch(e){
            console.error(step.name + '生成失败', e);
            store.toast(step.name + '生成失败: ' + e.message, 'error');
            // 即使某步失败也保存已有数据
            store.saveToLibrary(n);
            break;
          }
        }
        Engine.updateProgress(6, 1);
        if(!Engine.abortFlag){
          store.toast('全流程生成完成', 'success');
        }
      }finally{
        Engine.isGenerating = false;
        Engine.activeStep = -1;
        this.runMode = 'idle';
      }
    },

    // ===== 单章写作 =====
    async writeSingle(chapIdx){
      if(Engine.isGenerating) return;
      const n = this.novel;
      if(!n || !n.outline || !n.outline[chapIdx]) return;
      if(!this.checkConfig()) return;

      this.mainView = 'stream';
      this.activeStreamStep = 6;
      this.runMode = 'single';
      this.writingChapIdx = chapIdx;
      Engine.reset();
      Engine.isGenerating = true;
      Engine.activeStep = 6;
      Engine.metaStage = '正在写第' + (chapIdx + 1) + '章';
      Engine.metaChap = chapIdx + ' / ' + n.chapterCount;
      Engine.addBlock('chap' + chapIdx, '第' + (chapIdx + 1) + '章 ' + (n.outline[chapIdx].title || ''), '正在生成正文...', 'book');
      const ctx = this.makeCtx();
      try{
        await Engine.genChapter(n, chapIdx, ctx);
        Engine.finalizeBlock('chap' + chapIdx);
        var completedCh = n.chapters.filter(function(c){ return c && c.content; }).length;
        Engine.updateProgress(6, completedCh / n.chapterCount);
        // 持久化正文步骤的生成流
        this.saveStepBlocks(6);
        store.saveToLibrary(n);
        if(!Engine.abortFlag){
          store.toast('第' + (chapIdx + 1) + '章写作完成', 'success');
        }
      }catch(e){
        store.toast('写作失败: ' + e.message, 'error');
      }finally{
        Engine.isGenerating = false;
        Engine.activeStep = -1;
        this.writingChapIdx = -1;
        this.runMode = 'idle';
      }
    },

    // ===== 自动连写 =====
    // 循环调用 genChapter 生成所有未完成章节，可中断
    async startAutoWrite(){
      if(Engine.isGenerating) return;
      if(!this.hasOutline){
        store.toast('请先生成章节细纲', 'warn');
        return;
      }
      if(!this.checkConfig()) return;

      const n = this.novel;
      this.mainView = 'stream';
      this.activeStreamStep = 6;
      this.runMode = 'auto';
      this.autoWriting = true;
      Engine.reset();
      Engine.isGenerating = true;
      const ctx = this.makeCtx();
      try{
        for(let i = 0; i < n.outline.length; i++){
          if(Engine.abortFlag) break;
          // 跳过已完成的章节
          if(n.chapters[i] && n.chapters[i].content) continue;
          this.writingChapIdx = i;
          Engine.activeStep = 6;
          Engine.metaStage = '正在写第' + (i + 1) + '章';
          Engine.metaChap = i + ' / ' + n.chapterCount;
          Engine.addBlock('chap' + i, '第' + (i + 1) + '章 ' + (n.outline[i].title || ''), '正在生成正文...', 'book');
          await Engine.genChapter(n, i, ctx);
          Engine.finalizeBlock('chap' + i);
          var completedCh = n.chapters.filter(function(c){ return c && c.content; }).length;
          Engine.updateProgress(6, completedCh / n.chapterCount);
          Engine.metaChap = (i + 1) + ' / ' + n.chapterCount;
          // 持久化正文步骤的生成流
          this.saveStepBlocks(6);
          store.saveToLibrary(n);
        }
        if(!Engine.abortFlag){
          store.toast('自动写作完成', 'success');
        }
      }catch(e){
        store.toast('写作失败: ' + e.message, 'error');
      }finally{
        Engine.isGenerating = false;
        Engine.activeStep = -1;
        this.writingChapIdx = -1;
        this.autoWriting = false;
        this.runMode = 'idle';
      }
    },

    stopAutoWrite(){
      Engine.abort();
      this.autoWriting = false;
    },

    abortGen(){
      Engine.abort();
      this.autoWriting = false;
      this.runMode = 'idle';
    },

    // ===== 章节状态 =====
    chapStatus(i){
      if(this.writingChapIdx === i && Engine.isGenerating) return 'writing';
      const n = this.novel;
      if(n && n.chapters && n.chapters[i] && n.chapters[i].content) return 'completed';
      if(n && n.outline && n.outline[i]) return 'outlined';
      return 'pending';
    },
    chapStatusText(s){
      return { pending:'待写作', outlined:'已大纲', writing:'写作中', completed:'已完成' }[s] || s;
    },

    // ===== 跳转章节详情 =====
    openChapter(idx){
      if(!this.novel) return;
      this.$router.push('/chapter/' + this.novel.id + '/' + idx);
    },

    // ===== 跳转沉浸式阅读界面 =====
    readChapter(idx){
      if(!this.novel) return;
      this.$router.push('/reader/' + this.novel.id + '/' + idx);
    },

    // ===== 编辑小说设定 =====
    editSettings(){
      if(!this.novel) return;
      this.$router.push('/create?edit=' + this.novel.id);
    },

    // ===== 查看步骤内容 =====
    viewStep(idx){
      this.viewingStep = idx;
      this.viewingChunkIdx = 0;
    },
    stepContent(idx){
      const n = this.novel;
      if(!n) return '';
      const step = this.pipelineSteps[idx];
      const val = n[step.field];
      if(!val) return '';
      if(Array.isArray(val)){
        if(step.field === 'outline'){
          return val.map((o, i) => '第' + (i + 1) + '章 ' + (o.title || '') + '\n' + (o.summary || '')).join('\n\n');
        }
        if(step.field === 'synopses'){
          return val.map((s, i) => '=== 第' + (i + 1) + '章简介 ===\n' + (s || '')).join('\n\n');
        }
        if(step.field === 'chapters'){
          return val.map((c, i) => '第' + (i + 1) + '章 ' + (c.title || '') + '\n' + (c.content || '')).join('\n\n');
        }
        if(step.field === 'volumeOutlines'){
          return val.map(v => v.raw || v.name || '').join('\n\n');
        }
        return JSON.stringify(val, null, 2);
      }
      return String(val);
    },

    // ===== 生成流步骤管理 =====
    // 将 block id 映射到管道步骤序号（支持分块 ID 如 storyOutline-act1, outline-batch0）
    blockStepIndex(blockId){
      if(blockId === 'worldview') return 0;
      if(blockId === 'characters') return 1;
      if(blockId.startsWith('storyOutline')) return 2;
      if(blockId.startsWith('volumeOutline')) return 3;
      if(blockId.startsWith('outline')) return 4;
      if(blockId.startsWith('syn')) return 5;
      if(blockId.startsWith('chap') || blockId === 'continue') return 6;
      return -1;
    },
    // 选择查看某个步骤的输出流
    selectStreamStep(idx){
      this.activeStreamStep = idx;
    },
    // 将当前 Engine.genBlocks 中属于该步骤的 block 保存到 novel.streamData
    // 使用 chunks 格式（新），兼容 blocks 格式（旧）
    // 合并策略：按 block.id 去重，新 block 覆盖同 id 的旧 block
    saveStepBlocks(stepIdx){
      if(!this.novel) return;
      if(!this.novel.streamData) this.novel.streamData = {};
      var step = this.pipelineSteps[stepIdx];
      var newBlocks = this.genBlocks.filter(b => this.blockStepIndex(b.id) === stepIdx);
      if(newBlocks.length === 0) return;
      var existing = this.novel.streamData[step.key];
      // 兼容旧格式：优先读 chunks，回退 blocks
      var existingChunks = existing ? (existing.chunks || existing.blocks || []) : [];
      // 过滤降级合成块和旧格式单块，避免与真实分块混存
      existingChunks = existingChunks.filter(function(b){
        return !b.id.endsWith('-synth') && b.id !== step.key;
      });
      var blockMap = {};
      existingChunks.forEach(function(b){ blockMap[b.id] = b; });
      newBlocks.forEach(function(b){ blockMap[b.id] = b; });
      this.novel.streamData[step.key] = {
        chunks: JSON.parse(JSON.stringify(Object.values(blockMap))),
        completedAt: Date.now(),
      };
    },

    // 折叠/展开某个 chunk
    toggleChunkCollapse(chunkId){
      if(!this.collapsedChunks) this.collapsedChunks = {};
      this.collapsedChunks[chunkId] = !this.collapsedChunks[chunkId];
    },
    isChunkCollapsed(chunkId){
      return this.collapsedChunks && this.collapsedChunks[chunkId] === true;
    },

    // 重生成单个 chunk
    // 根据 block.id 判断属于哪个步骤，调用对应的单块生成
    async regenerateChunk(blockId){
      var stepIdx = this.blockStepIndex(blockId);
      if(stepIdx < 0) return;
      // 单块步骤（世界观、角色）：直接 runStep
      if(stepIdx <= 1){
        this.runStep(stepIdx);
        return;
      }
      // 分块步骤：调用 Engine.regenerateSingleChunk 仅重生成指定块
      if(Engine.isGenerating) return;
      if(!this.novel) return;
      if(!this.checkConfig()) return;

      this.mainView = 'stream';
      this.activeStreamStep = stepIdx;
      this.runMode = 'single';
      Engine.isGenerating = true;
      Engine.activeStep = stepIdx;
      const ctx = this.makeCtx();
      try{
        await Engine.regenerateSingleChunk(this.novel, blockId, ctx);
        this.saveStepBlocks(stepIdx);
        store.saveToLibrary(this.novel);
        store.toast('重新生成完成', 'success');
      }catch(e){
        store.toast('重新生成失败: ' + e.message, 'error');
        // 确保 block 不停留在生成中状态
        Engine.finalizeBlock(blockId);
      }finally{
        Engine.isGenerating = false;
        Engine.activeStep = -1;
        this.runMode = 'idle';
      }
    },

    // ===== 章节分页控制 =====
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

    // ===== 导出/导入（P2-5）=====
    toggleExportMenu(){
      this.showExportMenu = !this.showExportMenu;
    },
    closeExportMenu(){
      this.showExportMenu = false;
    },
    doExport(format){
      this.showExportMenu = false;
      if(!this.novel) return;
      store.exportNovel(this.novel.id, format);
    },
    exportSynopses(){
      this.showExportMenu = false;
      if(!this.novel) return;
      store.exportChapterSynopses(this.novel.id, 'json');
    },
    triggerImport(){
      if(this.$refs.importInput){
        this.$refs.importInput.click();
      }
    },
    async handleImport(e){
      const file = e.target.files[0];
      if(!file) return;
      try{
        await store.importNovel(file);
        // 导入成功后跳转到书架
        this.$router.push('/library');
      }catch(err){
        store.toast('导入失败: ' + err.message, 'error');
      }
      // 清空 input，允许再次选择同一文件
      e.target.value = '';
    },

    // ===== 导出 TXT（兼容旧调用）=====
    exportTxt(){
      if(!this.novel) return;
      store.exportNovel(this.novel.id, 'txt');
    },

    // ===== P2-4: 封面管理 =====
    async loadCover(){
      if(!this.novel) return;
      try{
        const res = await fetch(`/api/covers/${this.novel.id}`);
        const json = await res.json();
        if(json.ok && json.data){
          this.coverData = json.data;
        }else{
          this.coverData = null;
        }
      }catch(e){
        console.warn('加载封面失败', e);
      }
    },
    async generateCover(){
      if(!this.novel) return;
      this.coverLoading = true;
      try{
        const res = await fetch('/api/covers/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            novelId: this.novel.id,
            title: this.novel.title,
            genre: this.novel.genre,
            style: this.novel.style,
            author: this.novel.referenceAuthor,
            color: this.novel.coverColor,
          }),
        });
        const json = await res.json();
        if(json.ok){
          this.coverData = json.data;
          store.toast('封面生成成功', 'success');
        }else{
          store.toast('封面生成失败: ' + (json.error || ''), 'error');
        }
      }catch(e){
        store.toast('封面生成失败: ' + e.message, 'error');
      }finally{
        this.coverLoading = false;
      }
    },
    triggerCoverUpload(){
      if(this.$refs.coverInput){
        this.$refs.coverInput.click();
      }
    },
    async handleCoverUpload(e){
      const file = e.target.files[0];
      if(!file) return;
      if(file.size > 5 * 1024 * 1024){
        store.toast('图片过大（限制 5MB）', 'warn');
        return;
      }
      try{
        const reader = new FileReader();
        reader.onload = async (ev) => {
          const imageData = ev.target.result;
          const res = await fetch('/api/covers/upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ novelId: this.novel.id, imageData }),
          });
          const json = await res.json();
          if(json.ok){
            this.coverData = `<img src="${imageData}" style="width:100%;height:100%;object-fit:cover;border-radius:var(--radius)" />`;
            store.toast('封面上传成功', 'success');
          }else{
            store.toast('上传失败: ' + (json.error || ''), 'error');
          }
        };
        reader.readAsDataURL(file);
      }catch(e){
        store.toast('上传失败: ' + e.message, 'error');
      }
      e.target.value = '';
    },
    async deleteCover(){
      if(!this.novel) return;
      try{
        const res = await fetch(`/api/covers/${this.novel.id}`, { method: 'DELETE' });
        const json = await res.json();
        if(json.ok){
          this.coverData = null;
          store.toast('封面已删除', 'success');
        }
      }catch(e){
        store.toast('删除失败: ' + e.message, 'error');
      }
    },

    // ===== 配置检查 =====
    checkConfig(){
      if(!store.isConfigured){
        store.toast('请先配置 API 或切换到模拟模式', 'warn');
        store.drawerOpen = true;
        return false;
      }
      return true;
    },
  },
};

window.NovelPage = NovelPage;
