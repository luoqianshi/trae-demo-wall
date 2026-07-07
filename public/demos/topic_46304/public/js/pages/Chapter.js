/* ============================================================
 * 章节详情页 - 阅读/编辑/生成/续写 单个章节
 *
 * 布局：
 *   .chapter-wrap
 *     .chapter-header        章节标题 + 状态徽章
 *     .chapter-body
 *       .chapter-side (240px)  元信息/大纲/蓝图/评分
 *       .chapter-main          工具栏 + 正文 + 续写框
 *
 * 路由：/chapter/:novelId/:chapIdx
 * ============================================================ */

const ChapterPage = {
  name: 'ChapterPage',

  // 使用 Composition API 的 useRoute 获取路由参数
  setup() {
    const route = VueRouter.useRoute();
    return { route };
  },

  data() {
    return {
      novelId: '',
      chapIdx: 0,
      novel: null,
      // 'read' | 'edit' — 无内容时展示空状态（含生成按钮）
      mode: 'read',
      // 编辑缓冲
      editTitle: '',
      editContent: '',
      // 续写指令
      continueCmd: '',
      // 写作蓝图折叠
      synopsisExpanded: false,
      // 加载状态
      loading: true,
      loadError: '',
      // P2-3: 润色状态
      showPolishPanel: false,
      polishing: false,
      polishStyle: '综合',
      polishStrength: '中',
    };
  },

  computed: {
    /* ===== 数据派生 ===== */
    chapOutline() {
      if (!this.novel || !this.novel.outline) return null;
      return this.novel.outline[this.chapIdx] || null;
    },

    chapter() {
      if (!this.novel || !this.novel.chapters) return null;
      return this.novel.chapters[this.chapIdx] || null;
    },

    synopsis() {
      if (!this.novel || !this.novel.synopses) return '';
      return this.novel.synopses[this.chapIdx] || '';
    },

    hasContent() {
      return !!(this.chapter && this.chapter.content && this.chapter.content.trim());
    },

    contentParas() {
      if (!this.hasContent) return [];
      return this.chapter.content.split('\n').filter(p => p.trim());
    },

    wordCount() {
      if (!this.hasContent) return 0;
      return this.chapter.content.replace(/\s+/g, '').length;
    },

    editWordCount() {
      return (this.editContent || '').replace(/\s+/g, '').length;
    },

    chapTitle() {
      if (this.chapter && this.chapter.title) return this.chapter.title;
      if (this.chapOutline && this.chapOutline.title) return this.chapOutline.title;
      return '\u7B2C' + (this.chapIdx + 1) + '\u7AE0';
    },

    /* ===== 状态显示 ===== */
    isGenerating() { return Engine.isGenerating; },
    isAborted() { return Engine.abortFlag; },

    statusText() {
      if (this.isGenerating) return '\u751F\u6210\u4E2D';
      if (this.hasContent) return '\u5DF2\u751F\u6210';
      if (this.chapOutline) return '\u5F85\u751F\u6210';
      return '\u672A\u89C4\u5212';
    },

    statusClass() {
      if (this.isGenerating) return 'generating';
      if (this.hasContent) return 'done';
      if (this.chapOutline) return 'pending';
      return 'unplanned';
    },

    chapterTypeLabel() {
      if (!this.chapter || !this.chapter.chapterType) return '';
      return this.chapter.chapterType.label || '';
    },

    rhythmStageName() {
      if (!this.chapter || !this.chapter.rhythmStage) return '';
      const names = {
        setup: '\u94FA\u57AB\u671F',
        rising: '\u53D1\u5C55\u671F',
        climax: '\u9AD8\u6F6E\u671F',
        resolve: '\u6536\u675F\u671F',
        ending: '\u7ED3\u5C40\u671F',
      };
      return names[this.chapter.rhythmStage] || this.chapter.rhythmStage;
    },

    /* ===== 质量评分 ===== */
    scoreDims() {
      if (!this.chapter || !this.chapter.score) return null;
      const s = this.chapter.score.scores || {};
      return [
        { key: 'structure',   label: '\u7ED3\u6784', value: s.structure   || 0 },
        { key: 'character',   label: '\u4EBA\u7269', value: s.character   || 0 },
        { key: 'description', label: '\u63CF\u5199', value: s.description || 0 },
        { key: 'coherence',   label: '\u8FDE\u8D2F\u6027', value: s.coherence   || 0 },
        { key: 'engagement',  label: '\u723D\u611F', value: s.engagement  || 0 },
      ];
    },

    overallScore() {
      if (!this.chapter || !this.chapter.score) return null;
      return this.chapter.score.overall;
    },

    scoreClass() {
      if (this.overallScore === null) return '';
      if (this.overallScore >= 80) return 'good';
      if (this.overallScore >= 60) return 'fair';
      return 'poor';
    },

    /* ===== 导航边界 ===== */
    isFirstChap() { return this.chapIdx <= 0; },

    isLastChap() {
      if (!this.novel) return true;
      const total = (this.novel.outline && this.novel.outline.length) || this.novel.chapterCount || 0;
      return this.chapIdx >= total - 1;
    },

    /* ===== 流式生成块 ===== */
    currentGenBlock() {
      if (!Engine.genBlocks || Engine.genBlocks.length === 0) return null;
      // 优先匹配当前章节的生成块
      const chapBlock = Engine.genBlocks.find(b => b.id === 'chap' + this.chapIdx);
      if (chapBlock) return chapBlock;
      // 其次匹配续写块
      const continueBlock = Engine.genBlocks.find(b => b.id === 'continue');
      if (continueBlock) return continueBlock;
      // 兜底取最后一个
      return Engine.genBlocks[Engine.genBlocks.length - 1];
    },
  },

  watch: {
    // 监听路由参数变化（上一章/下一章导航）
    'route.params.chapIdx'(val) {
      if (val !== undefined && val !== null) {
        this.chapIdx = parseInt(val, 10) || 0;
        this.afterNav();
      }
    },
  },

  mounted() {
    this.novelId = this.route.params.novelId;
    this.chapIdx = parseInt(this.route.params.chapIdx, 10) || 0;
    this.loadNovel();
  },

  template: `
  <div class="chapter-wrap">
    <!-- ===== 加载错误状态 ===== -->
    <div v-if="loadError" class="chapter-error">
      <div class="error-icon"><app-icon name="x" :size="48" /></div>
      <h3>{{ loadError }}</h3>
      <button class="btn btn-outline btn-sm" @click="$router.push('/library')">\u8FD4\u56DE\u4E66\u67B6</button>
    </div>

    <template v-else-if="novel">
    <!-- ===== Header ===== -->
    <div class="chapter-header">
      <div class="chapter-header-left">
        <button class="btn btn-outline btn-sm" @click="goBack" title="\u8FD4\u56DE">
          <app-icon name="arrow-right" :size="14" style="transform:rotate(180deg)" />
        </button>
        <div class="chapter-title-box">
          <span class="chapter-num">\u7B2C{{ chapIdx + 1 }}\u7AE0</span>
          <h2 class="chapter-title">{{ chapTitle }}</h2>
        </div>
      </div>
      <div class="chapter-header-right">
        <span class="chap-status-badge" :class="statusClass">{{ statusText }}</span>
      </div>
    </div>

    <!-- ===== Body ===== -->
    <div class="chapter-body">
      <!-- ===== 左侧栏 ===== -->
      <aside class="chapter-side">

        <!-- 章节元信息 -->
        <div class="chap-card chap-meta-card">
          <h4><app-icon name="list" :size="16" /> \u7AE0\u8282\u4FE1\u606F</h4>
          <div class="meta-line"><span>\u72B6\u6001</span><span>{{ statusText }}</span></div>
          <div class="meta-line"><span>\u5B57\u6570</span><span>{{ wordCount.toLocaleString() }}</span></div>
          <div class="meta-line" v-if="overallScore !== null">
            <span>\u8D28\u91CF\u8BC4\u5206</span><span :class="scoreClass">{{ overallScore }}/100</span>
          </div>
          <div class="meta-line" v-if="chapterTypeLabel">
            <span>\u7AE0\u8282\u7C7B\u578B</span><span>{{ chapterTypeLabel }}</span>
          </div>
          <div class="meta-line" v-if="rhythmStageName">
            <span>\u8282\u594F\u9636\u6BB5</span><span>{{ rhythmStageName }}</span>
          </div>
        </div>

        <!-- 章节大纲 -->
        <div class="chap-card chap-outline-card" v-if="chapOutline">
          <h4><app-icon name="clipboard-list" :size="16" /> \u7AE0\u8282\u5927\u7EB2</h4>
          <div class="outline-field" v-if="chapOutline.title">
            <label>\u6807\u9898</label>
            <p>{{ chapOutline.title }}</p>
          </div>
          <div class="outline-field" v-if="chapOutline.summary">
            <label>\u5267\u60C5\u6982\u8981</label>
            <p>{{ chapOutline.summary }}</p>
          </div>
          <div class="outline-field" v-if="chapOutline.openHook">
            <label>\u5F00\u5934\u94A9\u5B50</label>
            <p>{{ chapOutline.openHook }}</p>
          </div>
          <div class="outline-field" v-if="chapOutline.endHook">
            <label>\u7ED3\u5C3E\u94A9\u5B50</label>
            <p>{{ chapOutline.endHook }}</p>
          </div>
          <div class="outline-field" v-if="chapOutline.keyConflict">
            <label>\u5173\u952E\u51B2\u7A81</label>
            <p>{{ chapOutline.keyConflict }}</p>
          </div>
        </div>

        <!-- 写作蓝图（可折叠） -->
        <div class="chap-card chap-synopsis-card" v-if="synopsis">
          <h4 class="clickable" @click="synopsisExpanded = !synopsisExpanded">
            <app-icon name="book-open" :size="16" /> \u5199\u4F5C\u84DD\u56FE
            <app-icon name="chevron-down" :size="14" class="expand-icon" :class="{expanded: synopsisExpanded}" />
          </h4>
          <div v-show="synopsisExpanded" class="synopsis-content">{{ synopsis }}</div>
          <div v-show="!synopsisExpanded" class="synopsis-preview">{{ synopsis.slice(0, 120) }}...</div>
        </div>

        <!-- 质量评分详情 -->
        <div class="chap-card chap-quality-card" v-if="scoreDims">
          <h4><app-icon name="check" :size="16" /> \u8D28\u91CF\u8BC4\u5206</h4>
          <div class="quality-total">
            <div class="quality-score-circle" :class="scoreClass">{{ overallScore }}</div>
            <span class="quality-label">\u7EFC\u5408\u8BC4\u5206</span>
          </div>
          <div class="quality-dims">
            <div class="quality-dim" v-for="dim in scoreDims" :key="dim.key">
              <div class="dim-header">
                <span>{{ dim.label }}</span>
                <span :class="dimScoreClass(dim.value)">{{ dim.value }}</span>
              </div>
              <div class="dim-bar">
                <div class="dim-bar-fill" :class="dimScoreClass(dim.value)" :style="{width: dim.value + '%'}"></div>
              </div>
            </div>
          </div>
        </div>

      </aside>

      <!-- ===== 右侧主区域 ===== -->
      <main class="chapter-main">

        <!-- 工具栏 -->
        <div class="chapter-toolbar">
          <div class="toolbar-left">
            <button class="btn btn-outline btn-sm" :disabled="isFirstChap || isGenerating" @click="goPrev">
              <app-icon name="arrow-right" :size="14" style="transform:rotate(180deg)" /> \u4E0A\u4E00\u7AE0
            </button>
            <button class="btn btn-outline btn-sm" :disabled="isLastChap || isGenerating" @click="goNext">
              \u4E0B\u4E00\u7AE0 <app-icon name="arrow-right" :size="14" />
            </button>
          </div>
          <div class="toolbar-right">
            <button v-if="hasContent && !isGenerating" class="btn btn-outline btn-sm" @click="toggleEdit">
              <app-icon name="edit" :size="14" /> {{ mode === 'edit' ? '\u9605\u8BFB' : '\u7F16\u8F91' }}
            </button>
            <button v-if="!hasContent && !isGenerating" class="btn btn-primary btn-sm" @click="generateChapter">
              <app-icon name="pen-line" :size="14" /> \u751F\u6210\u6B63\u6587
            </button>
            <button v-if="isGenerating" class="btn btn-danger btn-sm" @click="abortGen">
              <app-icon name="x" :size="14" /> \u4E2D\u65AD
            </button>
            <button v-if="hasContent && !isGenerating" class="btn btn-outline btn-sm" @click="scrollToContinue">
              <app-icon name="edit" :size="14" /> \u7EED\u5199/\u6539\u5199
            </button>
            <button v-if="hasContent && !isGenerating && !polishing" class="btn btn-outline btn-sm" @click="showPolishPanel = !showPolishPanel">
              <app-icon name="sparkles" :size="14" /> \u6DA6\u8272
            </button>
            <button class="btn btn-outline btn-sm" @click="goWorkshop">
              <app-icon name="book" :size="14" /> \u5DE5\u4F5C\u53F0
            </button>
          </div>
        </div>

        <!-- 正文内容区 -->
        <div class="chapter-content">
          <!-- 生成中：流式输出 -->
          <div v-if="isGenerating && currentGenBlock" class="gen-stream-view">
            <div class="stream-block">
              <h3>
                <app-icon :name="currentGenBlock.icon || 'pen-line'" :size="16" />
                {{ currentGenBlock.title }}
                <span class="badge">{{ currentGenBlock.done ? '\u5B8C\u6210' : currentGenBlock.hint }}</span>
              </h3>
              <div class="stream-content" :class="{typing: !currentGenBlock.done}">{{ currentGenBlock.content || '\u51C6\u5907\u751F\u6210...' }}</div>
            </div>
          </div>

          <!-- 阅读模式 -->
          <div v-else-if="mode === 'read' && hasContent" class="read-view">
            <p v-for="(p, i) in contentParas" :key="i">{{ p }}</p>
          </div>

          <!-- 编辑模式 -->
          <div v-else-if="mode === 'edit'" class="edit-view">
            <div class="edit-field">
              <label>\u7AE0\u8282\u6807\u9898</label>
              <input v-model="editTitle" class="edit-title-input" />
            </div>
            <div class="edit-field">
              <label>\u7AE0\u8282\u5185\u5BB9 <span class="word-count-hint">{{ editWordCount.toLocaleString() }} \u5B57</span></label>
              <textarea v-model="editContent" class="edit-content-input"></textarea>
            </div>
            <div class="edit-actions">
              <button class="btn btn-primary btn-sm" @click="saveEdit">
                <app-icon name="check" :size="14" /> \u4FDD\u5B58
              </button>
              <button class="btn btn-outline btn-sm" @click="cancelEdit">\u53D6\u6D88</button>
            </div>
          </div>

          <!-- 空状态（无内容） -->
          <div v-else class="empty-view">
            <div class="empty-icon"><app-icon name="book" :size="48" /></div>
            <h3>\u672C\u7AE0\u6682\u65E0\u5185\u5BB9</h3>
            <p v-if="chapOutline">\u5927\u7EB2\u5DF2\u5C31\u7EEA\uFF0C\u70B9\u51FB\u201C\u751F\u6210\u6B63\u6587\u201D\u8BA9 AI \u521B\u4F5C\u672C\u7AE0</p>
            <p v-else>\u5C1A\u672A\u751F\u6210\u5927\u7EB2\uFF0C\u53EF\u624B\u52A8\u7F16\u8F91\u6216\u8FD4\u56DE\u5DE5\u4F5C\u53F0\u751F\u6210\u5927\u7EB2</p>
            <div class="empty-actions">
              <button v-if="!isGenerating" class="btn btn-primary btn-sm" @click="generateChapter">
                <app-icon name="pen-line" :size="14" /> \u751F\u6210\u6B63\u6587
              </button>
              <button class="btn btn-outline btn-sm" @click="startManualEdit">
                <app-icon name="edit" :size="14" /> \u624B\u52A8\u7F16\u8F91
              </button>
            </div>
          </div>
        </div>

        <!-- 续写/改写指令框 -->
        <div class="continue-box" v-if="hasContent || isGenerating">
          <label>\u7EED\u5199/\u6539\u5199\u6307\u4EE4\uFF08\u81EA\u7136\u8BED\u8A00\uFF09</label>
          <textarea v-model="continueCmd"
                    placeholder="\u4F8B\u5982\uFF1A\u52A0\u4E00\u573A\u6253\u6597 / \u8BA9\u4E3B\u89D2\u66F4\u8179\u9ED1 / \u7EED\u5199\u4E0B\u4E00\u7AE0"
                    rows="2"
                    :disabled="isGenerating"></textarea>
          <div class="continue-actions">
            <button class="btn btn-primary btn-sm"
                    @click="doContinue"
                    :disabled="!continueCmd.trim() || isGenerating">
              <app-icon name="zap" :size="14" /> \u6267\u884C
            </button>
          </div>
        </div>

        <!-- P2-3: 润色面板 -->
        <div class="polish-panel" v-if="showPolishPanel && hasContent">
          <label>\u6DA6\u8272\u8BBE\u7F6E</label>
          <div class="polish-options">
            <div class="polish-option-group">
              <span class="polish-option-label">\u65B9\u5411</span>
              <div class="polish-tags">
                <button v-for="s in ['综合','文风','节奏','描写','对话']" :key="s"
                        class="polish-tag" :class="{active: polishStyle === s}"
                        @click="polishStyle = s">{{ s }}</button>
              </div>
            </div>
            <div class="polish-option-group">
              <span class="polish-option-label">\u529B\u5EA6</span>
              <div class="polish-tags">
                <button v-for="st in ['轻','中','重']" :key="st"
                        class="polish-tag" :class="{active: polishStrength === st}"
                        @click="polishStrength = st">{{ st }}</button>
              </div>
            </div>
          </div>
          <div class="polish-actions">
            <button class="btn btn-primary btn-sm" @click="doPolish" :disabled="polishing">
              <app-icon name="sparkles" :size="14" /> {{ polishing ? '\u6DA6\u8272\u4E2D...' : '\u5F00\u59CB\u6DA6\u8272' }}
            </button>
            <button class="btn btn-outline btn-sm" @click="showPolishPanel = false">\u53D6\u6D88</button>
          </div>
        </div>

      </main>
    </div>
    </template>
  </div>
  `,

  methods: {
    /* ===== 加载小说 ===== */
    loadNovel() {
      this.loading = true;
      this.loadError = '';

      // 优先使用当前打开的小说
      if (store.currentNovel && store.currentNovel.id === this.novelId) {
        this.novel = store.currentNovel;
      } else {
        // 从书架加载（openFromLibrary 内部会初始化 MemoryEngine）
        if (store.openFromLibrary(this.novelId)) {
          this.novel = store.currentNovel;
        } else {
          this.loadError = '\u672A\u627E\u5230\u8BE5\u5C0F\u8BF4\uFF0C\u8BF7\u8FD4\u56DE\u4E66\u67B6\u91CD\u65B0\u6253\u5F00';
          this.loading = false;
          return;
        }
      }

      // 校正 chapIdx 边界
      const total = (this.novel.outline && this.novel.outline.length) || this.novel.chapterCount || 0;
      if (this.chapIdx >= total) this.chapIdx = Math.max(0, total - 1);
      if (this.chapIdx < 0) this.chapIdx = 0;

      // 默认模式：有内容→阅读，无内容→空状态
      this.mode = 'read';
      this.loading = false;
    },

    /* ===== 导航 ===== */
    goPrev() {
      if (this.isFirstChap || this.isGenerating) return;
      this.$router.push('/chapter/' + this.novelId + '/' + (this.chapIdx - 1));
    },

    goNext() {
      if (this.isLastChap || this.isGenerating) return;
      this.$router.push('/chapter/' + this.novelId + '/' + (this.chapIdx + 1));
    },

    afterNav() {
      this.mode = 'read';
      this.editTitle = '';
      this.editContent = '';
      this.continueCmd = '';
      this.synopsisExpanded = false;
    },

    goBack() {
      if (window.history.length > 1) {
        this.$router.back();
      } else {
        this.$router.push('/library');
      }
    },

    goWorkshop() {
      if (this.novel) {
        store.currentNovel = this.novel;
        store.currentChap = this.chapIdx;
      }
      // 进入小说工作台而非总览页
      const novelId = this.novel && this.novel.id;
      if (novelId) {
        this.$router.push('/novel/' + novelId);
      } else {
        this.$router.push('/generate');
      }
    },

    /* ===== 编辑模式 ===== */
    toggleEdit() {
      if (this.mode === 'edit') {
        this.mode = 'read';
        return;
      }
      // 进入编辑前填充缓冲
      this.editTitle = (this.chapter && this.chapter.title) || this.chapTitle;
      this.editContent = (this.chapter && this.chapter.content) || '';
      this.mode = 'edit';
    },

    startManualEdit() {
      // 确保章节对象存在
      if (!this.novel.chapters) this.novel.chapters = [];
      if (!this.novel.chapters[this.chapIdx]) {
        this.novel.chapters[this.chapIdx] = {
          title: (this.chapOutline && this.chapOutline.title) || ('\u7B2C' + (this.chapIdx + 1) + '\u7AE0'),
          content: '',
        };
      }
      this.editTitle = this.novel.chapters[this.chapIdx].title || '';
      this.editContent = this.novel.chapters[this.chapIdx].content || '';
      this.mode = 'edit';
    },

    saveEdit() {
      if (!this.novel.chapters) this.novel.chapters = [];
      if (!this.novel.chapters[this.chapIdx]) {
        this.novel.chapters[this.chapIdx] = {};
      }
      this.novel.chapters[this.chapIdx].title = this.editTitle;
      this.novel.chapters[this.chapIdx].content = this.editContent;
      store.saveToLibrary(this.novel);
      store.toast('\u7AE0\u8282\u5DF2\u4FDD\u5B58', 'success');
      this.mode = 'read';
    },

    cancelEdit() {
      this.mode = 'read';
      this.editTitle = '';
      this.editContent = '';
    },

    /* ===== 章节生成 =====
     *
     * 流程：
     *   创建 ctx → Engine.reset → addBlock → genChapter → finalizeBlock → save
     *
     * ctx 对象与 Engine.run / continueChapter 保持一致：
     *   abortFlag 通过 getter 绑定到 Engine.abortFlag，实现中断信号传递
     */
    async generateChapter() {
      if (!this.novel) return;
      if (!this.novel.outline || !this.novel.outline[this.chapIdx]) {
        store.toast('\u7AE0\u8282\u5927\u7EB2\u4E0D\u5B58\u5728\uFF0C\u8BF7\u5148\u751F\u6210\u5927\u7EB2', 'warn');
        return;
      }
      if (store.mode === 'mock') {
        store.toast('\u6A21\u62DF\u6A21\u5F0F\u4E0D\u652F\u6301\u5355\u7AE0\u751F\u6210\uFF0C\u8BF7\u914D\u7F6E\u771F\u5B9E API', 'warn');
        return;
      }

      // 构建 ctx — 与 Engine.continueChapter 相同的模式
      const ctx = { novelConfig: this.novel, abortFlag: false, abortCtrl: null };
      Object.defineProperty(ctx, 'abortFlag', {
        get: () => Engine.abortFlag,
        configurable: true,
      });

      // 重置引擎状态并开始生成
      Engine.reset();
      Engine.isGenerating = true;
      Engine.activeStep = 6; // 正文阶段
      Engine.metaStage = '\u6B63\u5728\u5199\u7B2C' + (this.chapIdx + 1) + '\u7AE0';
      Engine.metaChap = this.chapIdx + ' / ' + this.novel.chapterCount;

      const chapOutline = this.novel.outline[this.chapIdx];
      Engine.addBlock(
        'chap' + this.chapIdx,
        '\u7B2C' + (this.chapIdx + 1) + '\u7AE0 ' + (chapOutline.title || ''),
        '\u6B63\u5728\u751F\u6210\u6B63\u6587...',
        'book'
      );

      try {
        await Engine.genChapter(this.novel, this.chapIdx, ctx);
        Engine.finalizeBlock('chap' + this.chapIdx);

        if (!Engine.abortFlag) {
          store.saveToLibrary(this.novel);
          store.toast('\u7AE0\u8282\u751F\u6210\u5B8C\u6210', 'success');
          this.mode = 'read';
        }
      } catch (e) {
        console.error('\u751F\u6210\u5931\u8D25', e);
        store.toast('\u751F\u6210\u5931\u8D25: ' + e.message, 'error');
      } finally {
        Engine.isGenerating = false;
      }
    },

    /* ===== 续写/改写 =====
     *
     * Engine.continueChapter 内部管理 reset/isGenerating/addBlock/finalizeBlock，
     * 调用方只需传入 novel、chapIdx、cmd。
     */
    async doContinue() {
      if (!this.continueCmd.trim() || !this.novel) return;
      if (store.mode === 'mock') {
        store.toast('\u6A21\u62DF\u6A21\u5F0F\u4E0D\u652F\u6301\u7EED\u5199\uFF0C\u8BF7\u914D\u7F6E\u771F\u5B9E API', 'warn');
        return;
      }

      const cmd = this.continueCmd;
      this.continueCmd = '';
      store.toast('\u6B63\u5728\u6267\u884C\u7EED\u5199\u6307\u4EE4...', 'success');

      try {
        await Engine.continueChapter(this.novel, this.chapIdx, cmd);
        if (!Engine.abortFlag) {
          store.saveToLibrary(this.novel);
          store.toast('\u6539\u5199\u5B8C\u6210', 'success');
          this.mode = 'read';
        }
      } catch (e) {
        console.error('\u7EED\u5199\u5931\u8D25', e);
        store.toast('\u7EED\u5199\u5931\u8D25: ' + e.message, 'error');
      }
    },

    /* ===== 中断生成 ===== */
    abortGen() {
      Engine.abort();
    },

    /* ===== P2-3: 章节润色 ===== */
    async doPolish() {
      if (!this.novel || !this.chapter || !this.chapter.content) return;
      if (store.mode === 'mock') {
        store.toast('模拟模式不支持润色，请配置真实 API', 'warn');
        return;
      }

      this.polishing = true;
      store.toast('正在润色章节内容...', 'info');

      try {
        const original = this.chapter.content;
        const polished = await Api.polishChapter(this.novel, this.chapIdx, original, {
          style: this.polishStyle,
          strength: this.polishStrength,
          preservePlot: true,
        });

        if (polished !== original) {
          // 更新章节内容
          this.novel.chapters[this.chapIdx].content = polished;
          // 重新校验
          const postResult = QualityGuard.postWriteCheck(this.novel, this.chapIdx, polished);
          this.novel.chapters[this.chapIdx].score = postResult.score;
          // 保存
          store.saveToLibrary(this.novel);
          // 记录统计
          try { StatsTracker.record(StatsTracker.EVENT_TYPES.CHAPTER_REWRITE, { novelId: this.novel.id, chapIdx: this.chapIdx, type: 'polish' }); }catch(e){}
          store.toast('润色完成', 'success');
        } else {
          store.toast('润色未产生变化', 'warn');
        }
      } catch (e) {
        console.error('润色失败', e);
        store.toast('润色失败: ' + e.message, 'error');
      } finally {
        this.polishing = false;
      }
    },

    /* ===== 滚动到续写框 ===== */
    scrollToContinue() {
      const el = this.$el.querySelector('.continue-box');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
        const textarea = el.querySelector('textarea');
        if (textarea) setTimeout(() => textarea.focus(), 300);
      }
    },

    /* ===== 评分等级 ===== */
    dimScoreClass(val) {
      if (val >= 80) return 'good';
      if (val >= 60) return 'fair';
      return 'poor';
    },
  },
};

window.ChapterPage = ChapterPage;
