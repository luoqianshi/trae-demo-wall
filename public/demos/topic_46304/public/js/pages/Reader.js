/**
 * Reader.js — 沉浸式阅读界面
 * 左侧：可点击的章节目录（按状态分类：已完成 / 未生成）
 * 右侧：章节正文（优化排版，提升阅读舒适度）
 * 顶栏：返回书架、目录切换、进入工作台
 * 所有图标统一使用 <app-icon> 组件
 */
const Reader = {
  name: 'Reader',
  data(){
    return {
      novelId: '',
      novel: null,
      currentIdx: 0,
      sidebarOpen: true,
    };
  },
  computed: {
    chapters(){
      return this.novel?.chapters || [];
    },
    currentChapter(){
      return this.chapters[this.currentIdx] || null;
    },
    currentTitle(){
      if(!this.currentChapter) return '暂无章节';
      return this.currentChapter.title || `第${this.currentIdx + 1}章`;
    },
    currentContent(){
      if(!this.currentChapter) return '';
      return this.currentChapter.content || this.currentChapter.summary || '（本章内容尚未生成）';
    },
    novelTitle(){
      return this.novel?.title || '未知小说';
    },
    hasPrev(){ return this.currentIdx > 0; },
    hasNext(){ return this.currentIdx < this.chapters.length - 1; },

    // 已完成章节（保留原始索引，便于点击跳转）
    doneChapters(){
      return this.chapters
        .map((ch, i) => ({ ch, idx: i }))
        .filter(x => !!x.ch.content);
    },
    // 未生成章节
    pendingChapters(){
      return this.chapters
        .map((ch, i) => ({ ch, idx: i }))
        .filter(x => !x.ch.content);
    },
    // 整本阅读进度（百分比）
    readProgress(){
      if(this.chapters.length === 0) return 0;
      return Math.round(((this.currentIdx + 1) / this.chapters.length) * 100);
    },
    // 正文按段落拆分，提升排版与阅读舒适度
    // 为什么拆段：原实现把 \n 替换为 <br> 用 v-html 渲染，无法应用首行缩进与段间距；
    // 拆成 <p> 后可精细控制段落排版，且避免 v-html 的 XSS 风险。
    contentParagraphs(){
      if(!this.currentChapter || !this.currentChapter.content) return [];
      const raw = this.currentChapter.content;
      // 兼容字面量 \n 与真实换行两种存储形式
      const text = raw.replace(/\\n/g, '\n');
      return text.split(/\n+/).filter(p => p.trim());
    },
  },
  methods: {
    loadNovel(){
      const n = store.library.find(b => b.id === this.novelId);
      if(!n){
        store.toast('未找到该小说', 'error');
        this.$router.push('/library');
        return;
      }
      this.novel = n;
      // 从 URL 参数获取章节索引
      const idx = parseInt(this.$route.params.chapIdx);
      if(!isNaN(idx) && idx >= 0 && idx < this.chapters.length){
        this.currentIdx = idx;
      }
    },
    selectChapter(idx){
      this.currentIdx = idx;
      // 更新 URL 但不刷新页面
      this.$router.replace(`/reader/${this.novelId}/${idx}`);
      // 滚动到顶部
      this.$nextTick(() => {
        const el = this.$refs.content;
        if(el) el.scrollTop = 0;
      });
    },
    prevChapter(){
      if(this.hasPrev) this.selectChapter(this.currentIdx - 1);
    },
    nextChapter(){
      if(this.hasNext) this.selectChapter(this.currentIdx + 1);
    },
    goWorkshop(){
      // 进入工作台
      this.$router.push(`/novel/${this.novelId}`);
    },
    goLibrary(){
      this.$router.push('/library');
    },
    toggleSidebar(){
      this.sidebarOpen = !this.sidebarOpen;
    },
    chapterStatusLabel(ch){
      if(!ch) return '';
      if(ch.content) return '已生成';
      return '未生成';
    },
    chapterWordCount(ch){
      if(!ch || !ch.content) return '—';
      return ch.content.length;
    },
    // 键盘快捷键
    onKeydown(e){
      if(e.key === 'ArrowLeft' && this.hasPrev) this.prevChapter();
      else if(e.key === 'ArrowRight' && this.hasNext) this.nextChapter();
      else if(e.key === 'Escape') this.goWorkshop();
    },
  },
  created(){
    this.novelId = this.$route.params.novelId;
    this.loadNovel();
  },
  mounted(){
    window.addEventListener('keydown', this.onKeydown);
  },
  beforeUnmount(){
    window.removeEventListener('keydown', this.onKeydown);
  },
  watch: {
    '$route.params.novelId'(){
      this.novelId = this.$route.params.novelId;
      this.loadNovel();
    },
    '$route.params.chapIdx'(v){
      const idx = parseInt(v);
      if(!isNaN(idx) && idx >= 0 && idx < this.chapters.length){
        this.currentIdx = idx;
      }
    },
  },
  template: `
  <div class="reader-page" v-if="novel">
    <!-- 顶栏 -->
    <div class="reader-topbar">
      <div class="reader-topbar-left">
        <button class="btn btn-ghost btn-sm" @click="goLibrary" title="返回书架">
          <app-icon name="arrow-left" :size="20" />
          <span>书架</span>
        </button>
        <button class="btn btn-ghost btn-sm reader-toggle-btn" @click="toggleSidebar" :title="sidebarOpen ? '隐藏目录' : '显示目录'">
          <app-icon name="list" :size="20" />
        </button>
        <div class="reader-title-box">
          <app-icon name="book-open" :size="16" />
          <span class="reader-novel-title">{{ novelTitle }}</span>
        </div>
      </div>
      <div class="reader-topbar-right">
        <button class="btn btn-primary btn-sm" @click="goWorkshop" title="进入工作台">
          <app-icon name="gear" :size="16" />
          <span>工作台</span>
        </button>
      </div>
    </div>

    <!-- 顶部阅读进度条 -->
    <div class="reader-progress-bar"><div class="reader-progress-fill" :style="{width: readProgress + '%'}"></div></div>

    <!-- 主体：左侧目录 + 右侧正文 -->
    <div class="reader-body">
      <!-- 左侧章节目录（按状态分类） -->
      <aside class="reader-sidebar" :class="{ 'reader-sidebar-collapsed': !sidebarOpen }">
        <div class="reader-sidebar-header">
          <span class="reader-sidebar-title"><app-icon name="list" :size="16" /> 目录</span>
          <span class="reader-chap-count">{{ chapters.length }} 章</span>
        </div>
        <div class="reader-chap-list">
          <!-- 已完成分组 -->
          <div v-if="doneChapters.length" class="reader-chap-group">
            <div class="reader-chap-group-header reader-group-done">
              <app-icon name="check-circle" :size="14" />
              <span class="reader-group-name">已完成</span>
              <span class="reader-chap-group-count">{{ doneChapters.length }}</span>
            </div>
            <div
              v-for="item in doneChapters"
              :key="'d'+item.idx"
              class="reader-chap-item"
              :class="{ 'reader-chap-active': item.idx === currentIdx }"
              @click="selectChapter(item.idx)"
            >
              <span class="reader-chap-num">{{ item.idx + 1 }}</span>
              <span class="reader-chap-name">{{ item.ch.title || ('第' + (item.idx+1) + '章') }}</span>
              <span class="reader-chap-status reader-chap-done"></span>
            </div>
          </div>
          <!-- 未生成分组 -->
          <div v-if="pendingChapters.length" class="reader-chap-group">
            <div class="reader-chap-group-header reader-group-pending">
              <app-icon name="clock" :size="14" />
              <span class="reader-group-name">未生成</span>
              <span class="reader-chap-group-count">{{ pendingChapters.length }}</span>
            </div>
            <div
              v-for="item in pendingChapters"
              :key="'p'+item.idx"
              class="reader-chap-item reader-chap-pending"
              :class="{ 'reader-chap-active': item.idx === currentIdx }"
              @click="selectChapter(item.idx)"
            >
              <span class="reader-chap-num">{{ item.idx + 1 }}</span>
              <span class="reader-chap-name">{{ item.ch.title || ('第' + (item.idx+1) + '章') }}</span>
              <span class="reader-chap-status"></span>
            </div>
          </div>
          <div v-if="chapters.length === 0" class="reader-chap-empty">
            暂无章节
          </div>
        </div>
      </aside>

      <!-- 右侧正文 -->
      <main class="reader-main" ref="content">
        <div class="reader-content">
          <div class="reader-chap-header">
            <h1 class="reader-chap-title">{{ currentTitle }}</h1>
            <div class="reader-chap-meta">
              <span v-if="currentChapter && currentChapter.content">
                <app-icon name="file-text" :size="13" /> {{ currentChapter.content.length }} 字
              </span>
              <span class="reader-chap-pos">
                <app-icon name="book-open" :size="13" /> 第 {{ currentIdx + 1 }} / {{ chapters.length }} 章
              </span>
              <span v-if="!currentChapter || !currentChapter.content" class="reader-chap-meta-pending">
                <app-icon name="clock" :size="13" /> 未生成
              </span>
            </div>
          </div>
          <div class="reader-chap-body" v-if="contentParagraphs.length">
            <p v-for="(p, i) in contentParagraphs" :key="i">{{ p }}</p>
          </div>
          <div class="reader-chap-empty-body" v-else>
            <app-icon name="book-open" :size="40" />
            <p>本章内容尚未生成</p>
            <button class="btn btn-primary btn-sm" @click="goWorkshop">
              <app-icon name="gear" :size="14" /> 前往工作台生成
            </button>
          </div>

          <!-- 翻页导航 -->
          <div class="reader-nav">
            <button
              class="btn btn-ghost btn-sm"
              :disabled="!hasPrev"
              @click="prevChapter"
            >
              <app-icon name="chevron-left" :size="16" /> 上一章
            </button>
            <span class="reader-nav-info">{{ currentIdx + 1 }} / {{ chapters.length }}</span>
            <button
              class="btn btn-ghost btn-sm"
              :disabled="!hasNext"
              @click="nextChapter"
            >
              下一章 <app-icon name="chevron-right" :size="16" />
            </button>
          </div>
        </div>
      </main>
    </div>
  </div>
  <div v-else class="reader-loading">
    <div class="reader-loading-text">加载中...</div>
  </div>
  `,
};

window.ReaderPage = Reader;
