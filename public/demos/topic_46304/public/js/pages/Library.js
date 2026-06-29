/* ============================================================
 * 书架页 - 展示所有保存的小说，支持打开/删除
 *
 * 状态显示：根据章节完成度判断 大纲中/写作中/已写完
 * 导航：点击卡片进入小说总览页（/generate）
 *       "进入工作台"按钮也进入总览页，再从总览页进入工作台
 * ============================================================ */
const LibraryPage = {
  name: 'LibraryPage',
  computed: {
    library(){ return store.library; },
  },
  template: `
  <div class="library-wrap">
    <div style="display:flex;justify-content:space-between;align-items:center">
      <h2 style="font-family:'Noto Serif SC',serif">我的书架</h2>
      <button class="btn btn-primary btn-sm" @click="$router.push('/create')">
        <app-icon name="plus" :size="14" style="margin-right:4px" /> 新建小说
      </button>
    </div>

    <div v-if="library.length===0" class="empty-state">
      <div class="icon"><app-icon name="library" :size="48" /></div>
      <p>书架还是空的，去创作你的第一部小说吧！</p>
    </div>

    <div v-else class="library-grid">
      <div v-for="book in library" :key="book.id" class="book-card" @click="openBookDetail(book.id)">
        <div class="del-btn" @click.stop="deleteBook(book.id)"><app-icon name="x" :size="14" /></div>
        <div class="book-card-head">
          <h3>{{ book.title || '未命名' }}</h3>
          <span class="book-status-badge" :class="getBookStatus(book).class">{{ getBookStatus(book).label }}</span>
        </div>
        <span class="book-genre">{{ book.genre }}</span>
        <p class="book-idea">{{ book.idea }}</p>
        <div class="book-progress" v-if="getBookStatus(book).key === 'writing'">
          <div class="book-progress-bar">
            <div class="book-progress-fill" :style="{width: getProgress(book) + '%'}"></div>
          </div>
          <span class="book-progress-text">{{ getProgressText(book) }}</span>
        </div>
        <div class="book-meta">
          <span><app-icon name="layers" :size="12" /> {{ (book.chapters || []).length }} 章</span>
          <span>{{ formatDate(book.createdAt) }}</span>
        </div>
        <div class="book-card-actions">
          <button class="btn btn-outline btn-sm book-action-btn" @click.stop="openBookDetail(book.id)">
            <app-icon name="book-open" :size="12" /> 查看详情
          </button>
        </div>
      </div>
    </div>
  </div>
  `,
  methods: {
    // 章节完成判定：引擎不设 status 字段，以 content 为准
    isChapterDone(c){
      if(c.status === 'done' || c.status === 'completed') return true;
      if(c.content && c.content.length > 100) return true;
      return false;
    },

    // 根据章节完成度判断书本状态
    getBookStatus(book){
      const chapters = book.chapters || [];
      if(chapters.length === 0) return { key:'draft', label:'草稿', class:'draft' };

      const doneCount = chapters.filter(c => this.isChapterDone(c)).length;
      if(doneCount === 0) return { key:'outlining', label:'大纲中', class:'outlining' };
      if(doneCount === chapters.length) return { key:'completed', label:'已写完', class:'completed' };
      return { key:'writing', label:'写作中', class:'writing' };
    },

    getProgress(book){
      const chapters = book.chapters || [];
      if(chapters.length === 0) return 0;
      const done = chapters.filter(c => this.isChapterDone(c)).length;
      return Math.round((done / chapters.length) * 100);
    },

    getProgressText(book){
      const chapters = book.chapters || [];
      const done = chapters.filter(c => this.isChapterDone(c)).length;
      return done + '/' + chapters.length;
    },

    // 点击书架中的书本 → 进入小说总览页（Generate 页）
    openBookDetail(id){
      if(store.openFromLibrary(id)){
        this.$router.push('/generate');
      } else {
        store.toast('无法打开此小说', 'error');
      }
    },

    deleteBook(id){
      if(confirm('确定从书架删除这部小说？')){
        store.removeFromLibrary(id);
        store.toast('已删除', 'success');
      }
    },

    formatDate(ts){
      if(!ts) return '';
      const d = new Date(ts);
      return `${d.getMonth()+1}月${d.getDate()}日`;
    },
  },
};

window.LibraryPage = LibraryPage;
