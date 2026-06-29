/* ============================================================
 * 主页组件 - 完整还原创意产物 HTML 设计
 * 包含: Hero + 核心功能 + 使用流程 + 产品预览 + 统计 + Footer
 * ============================================================ */
const HomePage = {
  name: 'HomePage',
  data(){
    return {
      idea: '',
      examples: CONST.EXAMPLES,
      // 产品预览的模拟目录
      mockChapters: [
        { title: '第一章 穿越', active: false },
        { title: '第二章 初识大明', active: false },
        { title: '第三章 程序员的第一桶金', active: true },
        { title: '第四章 京城风云', active: false },
        { title: '第五章 科举之路', active: false },
        { title: '第六章 待生成...', active: false, pending: true },
      ],
    };
  },
  template: `
  <div>
    <!-- Hero 区 -->
    <section class="hero-wrap">
      <div class="hero-card">
        <div class="hero-badge anim-down">TRAE AI 创造力大赛 · 可体验 Demo</div>
        <h1 class="hero-title anim-up-d1">灵笔 <span class="accent-text">AI</span> 小说生成器</h1>
        <p class="hero-sub anim-up-d2">输入一句话，AI 为你写一部完整小说</p>

        <div class="hero-input-box anim-up-d3">
          <textarea v-model="idea" placeholder="试试输入：一个穿越到明朝的程序员..."></textarea>

          <div class="hero-tags">
            <span class="hero-tag" v-for="g in ['玄幻修仙','都市异能','历史穿越','悬疑推理','甜宠言情','科幻未来']" :key="g">{{ g }}</span>
          </div>

          <button class="demo-btn" @click="goCreate">
            开始创作
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="margin-left:6px"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </button>

          <div class="hero-examples">
            <small>没灵感？试试：</small>
            <span class="ex-link" v-for="(ex,i) in examples" :key="i" @click="idea = ex">{{ ex.slice(0,8) }}...</span>
          </div>
        </div>
      </div>

      <div class="scroll-indicator">
        <svg viewBox="0 0 24 24" fill="none" stroke-width="2"><path d="M12 5v14M5 12l7 7 7-7"/></svg>
      </div>
    </section>

    <!-- 核心功能 -->
    <section class="features-section">
      <div class="section-header">
        <h2>核心功能</h2>
        <p>不只是生成文字，更是完整的创作生态</p>
      </div>
      <div class="features-grid">
        <div class="feature-card" v-for="(f,i) in features" :key="i" :style="{animationDelay: (i*0.1)+'s'}">
          <div class="feature-icon"><app-icon :name="f.icon" :size="28" /></div>
          <h3>{{ f.title }}</h3>
          <p>{{ f.desc }}</p>
        </div>
      </div>
    </section>

    <!-- 使用流程 -->
    <section class="steps-section">
      <div class="section-header">
        <h2>使用流程</h2>
        <p>三步开启你的创作之旅</p>
      </div>
      <div class="steps">
        <div class="step" v-for="(s,i) in steps" :key="i">
          <div class="step-number">{{ i+1 }}</div>
          <h3>{{ s.title }}</h3>
          <p>{{ s.desc }}</p>
        </div>
      </div>
    </section>

    <!-- 产品预览 -->
    <section class="preview-section">
      <div class="preview-container">
        <div class="section-header">
          <h2>产品预览</h2>
          <p>沉浸式阅读与创作体验</p>
        </div>
        <div class="preview-mockup">
          <div class="mockup-header">
            <div class="mockup-dot red"></div>
            <div class="mockup-dot yellow"></div>
            <div class="mockup-dot green"></div>
            <span class="mockup-title-label">灵笔 AI 小说生成器</span>
          </div>
          <div class="mockup-body">
            <div class="mockup-sidebar">
              <h4>目录</h4>
              <div v-for="(c,i) in mockChapters" :key="i"
                   class="mockup-chapter" :class="{active: c.active, pending: c.pending}">
                {{ c.title }}
              </div>
            </div>
            <div class="mockup-main">
              <h3 class="mockup-title">第三章 程序员的第一桶金</h3>
              <div class="mockup-meta">字数：3,256 | 预计阅读：12 分钟 | AI 生成于 2 分钟前</div>
              <div class="mockup-content">
                <p>李明远站在应天府的街头，看着熙熙攘攘的人群，心中涌起一股奇异的感觉。三天前，他还是一家互联网公司的后端工程师，熬夜改 bug 是他的日常；而现在，他身着粗布长衫，站在明朝洪武年间的南京城。</p>
                <p>"既来之，则安之。"他喃喃自语。作为一个程序员，他首先评估了自己的处境：没有身份路引、没有银两、没有熟人。这在明朝，基本上等于"黑户"。</p>
                <p>但他并不慌张。现代人的知识储备，就是他最大的资本。他环顾四周，目光落在街角的一家算盘铺子上。一个念头在他脑海中闪过——他可以做一件这个时代的人从未见过的东西。</p>
                <p>三日后，应天府的集市上出现了一位奇人。他摆摊不卖货，只让人出题。无论多么复杂的算术，他都能在几息之间给出答案。</p>
                <p>"这位先生，请问三百七十二乘四百八十五，得数几何？"一位绸缎商人试探着问道。</p>
                <p>李明远微微一笑，手指在自制的简易算盘上翻飞。"十八万零四百二十。"他平静地说。</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 统计区 -->
    <section class="stats-section">
      <div class="stats-container">
        <div class="stat" v-for="(s,i) in stats" :key="i">
          <div class="stat-number">{{ s.num }}</div>
          <div class="stat-label">{{ s.label }}</div>
        </div>
      </div>
    </section>

    <!-- Footer -->
    <footer class="site-footer">
      <p><strong class="accent-text">灵笔 AI 小说生成器</strong> —— 让每个人都能成为小说家</p>
      <p style="margin-top:0.5rem">TRAE AI 创造力大赛参赛作品 | 生活娱乐赛道</p>
    </footer>
  </div>
  `,
  computed: {
    features(){
      return [
        {icon:'pen-line',title:'一句话生成',desc:'只需输入一个创意点子，AI 自动构建世界观、设计角色、规划大纲，生成完整长篇小说。从灵感到成书，分钟级完成。'},
        {icon:'brain',title:'记忆引擎',desc:'四层金字塔记忆架构，自动追踪角色关系、剧情伏笔、世界观设定。确保百万字长篇前后一致，不崩人设。'},
        {icon:'drama',title:'多 Agent 协同',desc:'写作策略、质量监控、优化三大 Agent 协同决策。动态调整爽点密度、节奏把控、字数分配，专业级输出。'},
        {icon:'book-open',title:'多模型支持',desc:'兼容 DeepSeek、Kimi、GLM、通义千问等主流模型。智能选择最优模型执行不同任务，支持 Fallback 自动切换。'},
        {icon:'zap',title:'实时续写',desc:'对生成内容不满意？随时指令 AI 改写、扩写、续写。支持"加一场打斗""让主角更腹黑"等自然语言指令。'},
        {icon:'download',title:'一键导出',desc:'支持导出为 TXT 格式。生成的作品可直接发布到起点、晋江等平台，或导入微信读书阅读。'},
      ];
    },
    steps(){
      return [
        {title:'输入创意',desc:'用一句话描述你的故事想法，选择题材类型和风格偏好'},
        {title:'AI 构建',desc:'系统自动生成世界观、角色卡、章节大纲，你随时可调整'},
        {title:'生成阅读',desc:'AI 逐章生成正文，支持实时阅读、续写、导出全本'},
      ];
    },
    stats(){
      return [
        {num:'10min',label:'生成一章速度'},
        {num:'100万+',label:'支持长篇字数'},
        {num:'8',label:'记忆追踪维度'},
        {num:'0',label:'使用门槛'},
      ];
    },
  },
  methods: {
    goCreate(){
      store.draftIdea = this.idea;
      // 如果未配置，提示用户先设置
      if(!store.isConfigured){
        store.toast('请先配置 API 或切换到模拟模式', 'warn');
        store.drawerOpen = true;
        return;
      }
      this.$router.push('/create');
    },
  },
};

window.HomePage = HomePage;
