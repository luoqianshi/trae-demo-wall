/* ============================================================
 * 生成配置页 - 优化剧情模式/大结局风格布局
 * ============================================================ */
const ConfigPage = {
  name: 'ConfigPage',
  data(){
    return {
      genres: CONST.GENRES,
      styles: CONST.STYLES,
      plotModes: CONST.PLOT_MODES,
      endingStyles: CONST.ENDING_STYLES,
      form: {
        idea: '',
        genre: '历史穿越',
        style: '热血爽文',
        chapterCount: 5,
        wordCount: 1200,
        plotMode: 'linear',
        endingStyle: 'happy',
      },
    };
  },
  computed: {
    isReady(){ return this.form.idea.trim().length > 0; },
    // 当前模式状态
    currentMode(){ return store.mode; },
    isMockMode(){ return store.mode === 'mock'; },
    isApiReady(){ return store.isConfigured; },
  },
  mounted(){
    if(store.draftIdea) this.form.idea = store.draftIdea;
    if(store.novelConfig && store.novelConfig.idea){
      const c = store.novelConfig;
      this.form.genre = c.genre;
      this.form.style = c.style;
      this.form.chapterCount = c.chapterCount;
      this.form.wordCount = c.wordCount;
      this.form.plotMode = c.plotMode;
      this.form.endingStyle = c.endingStyle;
    }
  },
  template: `
  <div class="config-wrap">
    <div class="config-card">
      <h2>创作配置</h2>
      <p class="sub">设定你的创意和偏好，AI 将据此生成专属小说</p>

      <!-- 模式状态提示 -->
      <div v-if="isMockMode" class="mode-banner mode-banner-warn">
        <app-icon name="alert-triangle" :size="18" />
        <span>当前为<strong>模拟演示模式</strong>，将生成固定示例内容。如需真实 AI 写作，请在设置中配置 API 后切换到真实模式。</span>
        <button class="btn btn-outline btn-sm" @click="openSettings">去设置</button>
      </div>
      <div v-else-if="!isApiReady" class="mode-banner mode-banner-err">
        <app-icon name="alert-circle" :size="18" />
        <span>API 配置不完整，无法使用真实 AI 生成。</span>
        <button class="btn btn-outline btn-sm" @click="openSettings">去配置</button>
      </div>
      <div v-else class="mode-banner mode-banner-ok">
        <app-icon name="check-circle" :size="18" />
        <span>真实 API 模式已就绪，将使用 AI 生成原创内容</span>
      </div>

      <!-- 创意输入 -->
      <div class="config-section">
        <label>你的创意 <span style="color:var(--danger)">*</span></label>
        <textarea v-model="form.idea" placeholder="用一两句话描述你的故事想法..."></textarea>
        <div class="hint">越具体越好，例如：一个穿越到明朝的程序员，用现代知识在科举和商战中崛起</div>
      </div>

      <!-- 题材 -->
      <div class="config-section">
        <label>题材类型</label>
        <div class="tag-row">
          <span v-for="g in genres" :key="g" class="tag-chip" :class="{active: form.genre===g}" @click="form.genre=g">{{ g }}</span>
        </div>
      </div>

      <!-- 风格 -->
      <div class="config-section">
        <label>写作风格</label>
        <div class="tag-row">
          <span v-for="s in styles" :key="s" class="tag-chip" :class="{active: form.style===s}" @click="form.style=s">{{ s }}</span>
        </div>
      </div>

      <!-- 剧情模式 -->
      <div class="config-section">
        <label>剧情模式</label>
        <div class="option-grid-2">
          <div v-for="pm in plotModes" :key="pm.val"
               class="option-card" :class="{active: form.plotMode===pm.val}"
               @click="form.plotMode=pm.val">
            <div class="option-card-header">
              <span class="option-icon"><app-icon :name="plotIcon(pm.val)" :size="22" /></span>
              <strong>{{ pm.name }}</strong>
            </div>
            <p class="option-desc">{{ pm.desc }}</p>
          </div>
        </div>
      </div>

      <!-- 大结局风格 -->
      <div class="config-section">
        <label>大结局风格</label>
        <div class="option-grid-2">
          <div v-for="es in endingStyles" :key="es.val"
               class="option-card" :class="{active: form.endingStyle===es.val}"
               @click="form.endingStyle=es.val">
            <div class="option-card-header">
              <span class="option-icon"><app-icon :name="endingIcon(es.val)" :size="22" /></span>
              <strong>{{ es.name }}</strong>
            </div>
            <p class="option-desc">{{ es.desc }}</p>
          </div>
        </div>
      </div>

      <!-- 章节与字数 -->
      <div class="config-section">
        <div class="opt-grid">
          <div>
            <label>章节数量</label>
            <select v-model.number="form.chapterCount">
              <option :value="3">3 章（快速体验）</option>
              <option :value="5">5 章</option>
              <option :value="8">8 章</option>
              <option :value="10">10 章（完整短篇）</option>
            </select>
          </div>
          <div>
            <label>每章字数</label>
            <select v-model.number="form.wordCount">
              <option :value="800">约 800 字</option>
              <option :value="1200">约 1200 字</option>
              <option :value="2000">约 2000 字</option>
            </select>
          </div>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="config-actions">
        <button class="btn btn-outline" @click="$router.push('/')">返回主页</button>
        <button class="btn btn-primary" :disabled="!isReady" @click="startGenerate">
          {{ isReady ? '开始生成' : '请先输入创意' }}
        </button>
      </div>
    </div>
  </div>
  `,
  methods: {
    startGenerate(){
      if(!this.isReady){ store.toast('请先输入创意', 'error'); return; }
      if(!store.isConfigured){
        store.toast('请先在设置中配置 API 或切换到模拟模式', 'warn');
        store.drawerOpen = true;
        return;
      }
      // mock 模式下二次确认，避免用户误以为在用真实 AI
      if(store.mode === 'mock'){
        if(!confirm('当前为模拟演示模式，将生成固定示例内容（非真实 AI 写作）。\n\n点击"确定"继续模拟生成，或点击"取消"去配置真实 API。')){
          store.drawerOpen = true;
          return;
        }
      }
      store.novelConfig = { ...this.form };
      this.$router.push('/generate');
    },
    openSettings(){
      store.drawerOpen = true;
    },
    plotIcon(val){
      return { linear:'trending-up', episodic:'search', multithread:'network', twist:'refresh-cw' }[val] || 'clipboard-list';
    },
    endingIcon(val){
      return { happy:'party-popper', open:'door-open', tragic:'heart-crack', suspense:'help-circle' }[val] || 'book';
    },
  },
};

window.ConfigPage = ConfigPage;
