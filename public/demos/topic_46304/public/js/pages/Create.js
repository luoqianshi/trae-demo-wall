/* ============================================================
 * 创建小说页 - 分组卡片式表单
 *
 * 对标参考项目 create.html 的 form-section 结构：
 *   1. 基本信息（标题/创意/题材/风格）
 *   2. 主角设定（4字段）
 *   3. 写作风格（四维向量/参考作者）
 *   4. 世界观与情节（世界观/剧情模式/结局风格）
 *   5. 篇幅与卷结构（章数/字数/卷结构）
 *
 * 为什么用分组卡片：
 *   参考项目用 form-section 将 14+ 字段组织为 6 个语义组，
 *   每组有图标标题和折叠功能，降低用户认知负担。
 * ============================================================ */
const CreatePage = {
  name: 'CreatePage',
  data(){
    return {
      // 页签：'workshop' 创意工坊（默认） | 'regular' 新建小说
      activeTab: 'workshop',
      genres: CONST.GENRES,
      styles: CONST.STYLES,
      plotModes: CONST.PLOT_MODES,
      endingStyles: CONST.ENDING_STYLES,
      styleVectors: CONST.STYLE_VECTORS,
      volumePresets: CONST.VOLUME_PRESETS,
      targetReaders: CONST.TARGET_READERS,
      protagonistTemplates: CONST.PROTAGONIST_TEMPLATES,
      chapterOptions: [3, 5, 8, 10, 15, 20],
      wordOptions: [800, 1200, 2000, 3000],
      // 自定义选项状态
      customChapterInput: '',
      customWordInput: '',
      // 折叠状态：默认全部展开
      collapsed: {},
      // AI 模型选择
      selectedModelId: '',
      // 编辑模式：非 null 表示正在编辑已有小说
      editingId: null,
      form: {
        title: '',
        idea: '',
        genre: '历史穿越',
        style: '热血爽文',
        styleVector: { style: 'concise', pacing: 'fast', emotion: 'passionate', intellect: 'balanced' },
        referenceAuthor: '',
        protagonist: { name: '', personality: '', goal: '', conflict: '' },
        worldSetting: '',
        plotMode: 'linear',
        endingStyle: 'happy',
        extraSettings: '',        // 额外设定（对标 create.php extra_settings）
        targetReader: 'general',   // 目标读者（对标 create.php target_reader）
        coverColor: '#c9a227',     // 封面颜色（对标 create.php cover_color）
        chapterCount: 5,
        wordCount: 1200,
        volumeStructure: 'single',
        volumes: [],
      },
    };
  },
  computed: {
    isReady(){ return this.form.idea.trim().length > 0; },
    isMockMode(){ return store.mode === 'mock'; },
    isApiReady(){ return store.isConfigured; },
    models(){ return store.models; },
    isEditing(){ return !!this.editingId; },
    submitBtnText(){ return this.isEditing ? '保存修改' : '创建小说'; },
    triplePreview(){
      const total = this.effectiveChapterCount;
      const v1 = Math.max(1, Math.floor(total * 0.33));
      const v2 = Math.max(1, Math.floor(total * 0.34));
      const v3 = Math.max(1, total - v1 - v2);
      return [
        { name: '起', chapterCount: v1 },
        { name: '承', chapterCount: v2 },
        { name: '合', chapterCount: v3 },
      ];
    },
    customChapterSum(){
      return this.form.volumes.reduce((s, v) => s + (parseInt(v.chapterCount) || 0), 0);
    },
    totalWords(){
      return (this.form.chapterCount * this.form.wordCount).toLocaleString();
    },
    currentVolumeDesc(){
      const vp = this.volumePresets.find(p => p.val === this.form.volumeStructure);
      return vp ? vp.desc : '';
    },
    isCustomChapter(){ return this.form.chapterCount === -1; },
    isCustomWord(){ return this.form.wordCount === -1; },
    effectiveChapterCount(){
      return this.isCustomChapter ? (parseInt(this.customChapterInput) || 0) : this.form.chapterCount;
    },
    effectiveWordCount(){
      return this.isCustomWord ? (parseInt(this.customWordInput) || 0) : this.form.wordCount;
    },
    effectiveTotalWords(){
      return (this.effectiveChapterCount * this.effectiveWordCount).toLocaleString();
    },
  },
  watch: {
    // 模型列表变化时重新选择默认模型
    models: {
      handler(val){
        if(!this.selectedModelId && val.length > 0){
          const dm = store.getDefaultModel();
          if(dm) this.selectedModelId = dm.id;
        }
      },
      immediate: true,
    },
  },
  mounted(){
    if(store.draftIdea) this.form.idea = store.draftIdea;
    // 预选默认模型
    const dm = store.getDefaultModel();
    if(dm) this.selectedModelId = dm.id;

    // 检查是否为编辑模式：URL 带 ?edit=novelId
    const editId = this.$route && this.$route.query && this.$route.query.edit;
    if(editId){
      this.loadNovelForEdit(editId);
    } else {
      this.loadFromStore();
    }

    if(this.form.volumeStructure === 'custom' && this.form.volumes.length === 0){
      this.addVolume();
    }
  },
  template: `
  <div class="create-wrap">
    <!-- 头部 -->
    <div class="create-header">
      <div class="create-title">
        <h2>{{ isEditing ? '编辑小说' : '新建小说' }}</h2>
        <p class="sub">{{ isEditing ? '修改创作设定，保留已生成的内容' : '填写创作设定，AI 将据此构建完整小说' }}</p>
      </div>
      <button class="btn btn-outline btn-sm" @click="$router.push('/')">
        <app-icon name="arrow-left" :size="14" style="margin-right:4px" /> 返回
      </button>
    </div>

    <!-- 内容卡片（页签在卡片内部顶部）-->
    <div class="create-card">

      <!-- 页签导航 -->
      <div class="create-tabs">
        <div class="create-tab" :class="{active: activeTab==='workshop'}" @click="switchTab('workshop')">
          <app-icon name="sparkles" :size="16" />
          <span>创意工坊</span>
        </div>
        <div class="create-tab" :class="{active: activeTab==='regular'}" @click="switchTab('regular')">
          <app-icon name="edit" :size="16" />
          <span>新建小说</span>
        </div>
      </div>

      <!-- ===== 常规新建页签 ===== -->
      <div v-if="activeTab==='regular'">

      <!-- 模式状态提示 -->
      <div v-if="isMockMode" class="mode-banner mode-banner-warn">
        <app-icon name="help-circle" :size="18" />
        <span>当前为<strong>模拟演示模式</strong>，生成阶段将输出固定示例内容。如需真实 AI 写作，请在设置中配置 API。</span>
        <button class="btn btn-outline btn-sm" @click="openSettings">去设置</button>
      </div>
      <div v-else-if="!isApiReady" class="mode-banner mode-banner-err">
        <app-icon name="x" :size="18" />
        <span>API 配置不完整，无法使用真实 AI 生成。</span>
        <button class="btn btn-outline btn-sm" @click="openSettings">去配置</button>
      </div>
      <div v-else class="mode-banner mode-banner-ok">
        <app-icon name="check" :size="18" />
        <span>真实 API 模式已就绪，将使用 AI 生成原创内容</span>
      </div>

      <!-- ===== 1. 基本信息 ===== -->
      <div class="form-section">
        <div class="form-section-head" @click="toggleSection('basic')">
          <span class="sec-icon"><app-icon name="book" :size="18" /></span>
          <span class="sec-title">基本信息</span>
          <span class="sec-desc">标题、创意、题材</span>
          <span class="sec-chevron" :class="{collapsed: collapsed.basic}"><app-icon name="chevron-down" :size="18" /></span>
        </div>
        <div class="form-section-body" :class="{collapsed: collapsed.basic}">
          <div class="config-section">
            <label>小说标题 <span class="opt-tag">可选</span></label>
            <input type="text" v-model="form.title" placeholder="留空则由 AI 根据创意自动生成">
          </div>
          <div class="config-section">
            <label>创意描述 <span style="color:var(--danger)">*</span></label>
            <textarea v-model="form.idea" rows="3" placeholder="用一两句话描述你的故事想法..."></textarea>
            <div class="hint">越具体越好，例如：一个穿越到明朝的程序员，用现代知识在科举和商战中崛起</div>
          </div>
          <div class="config-section">
            <label>题材类型</label>
            <div class="tag-row">
              <span v-for="g in genres" :key="g" class="tag-chip" :class="{active: form.genre===g}" @click="form.genre=g">{{ g }}</span>
            </div>
          </div>
          <div class="config-section">
            <label>写作风格</label>
            <div class="tag-row">
              <span v-for="s in styles" :key="s" class="tag-chip" :class="{active: form.style===s}" @click="form.style=s">{{ s }}</span>
            </div>
          </div>
          <div class="config-section">
            <label>目标读者 <span class="opt-tag">可选</span></label>
            <select v-model="form.targetReader">
              <option v-for="r in targetReaders" :key="r.val" :value="r.val">{{ r.name }}</option>
            </select>
          </div>
        </div>
      </div>

      <!-- ===== 2. 主角设定 ===== -->
      <div class="form-section">
        <div class="form-section-head" @click="toggleSection('protagonist')">
          <span class="sec-icon"><app-icon name="users" :size="18" /></span>
          <span class="sec-title">主角设定</span>
          <span class="sec-desc">可选，留空由 AI 设计</span>
          <span class="sec-chevron" :class="{collapsed: collapsed.protagonist}"><app-icon name="chevron-down" :size="18" /></span>
        </div>
        <div class="form-section-body" :class="{collapsed: collapsed.protagonist}">
          <div class="config-section">
            <label>主角类型模板 <span class="opt-tag">点击快速填充</span></label>
            <div class="tag-row">
              <span v-for="t in protagonistTemplates" :key="t.val"
                    class="tag-chip" @click="applyProtagonistTemplate(t)">{{ t.name }}</span>
            </div>
          </div>
          <div class="opt-grid">
            <div class="config-section">
              <label>姓名 <span class="opt-tag">可选</span></label>
              <input type="text" v-model="form.protagonist.name" placeholder="例：叶辰、萧炎...">
            </div>
            <div class="config-section">
              <label>性格特点 <span class="opt-tag">可选</span></label>
              <input type="text" v-model="form.protagonist.personality" placeholder="例：沉稳内敛、腹黑机智...">
            </div>
            <div class="config-section">
              <label>核心目标 <span class="opt-tag">可选</span></label>
              <input type="text" v-model="form.protagonist.goal" placeholder="例：重振家族、登顶武道...">
            </div>
            <div class="config-section">
              <label>核心冲突 <span class="opt-tag">可选</span></label>
              <input type="text" v-model="form.protagonist.conflict" placeholder="例：与宿敌的世仇、内心的道德挣扎...">
            </div>
          </div>
        </div>
      </div>

      <!-- ===== 3. 写作风格 ===== -->
      <div class="form-section">
        <div class="form-section-head" @click="toggleSection('style')">
          <span class="sec-icon"><app-icon name="sliders" :size="18" /></span>
          <span class="sec-title">写作风格</span>
          <span class="sec-desc">四维精细控制</span>
          <span class="sec-chevron" :class="{collapsed: collapsed.style}"><app-icon name="chevron-down" :size="18" /></span>
        </div>
        <div class="form-section-body" :class="{collapsed: collapsed.style}">
          <div class="opt-grid">
            <div class="config-section">
              <label>文风</label>
              <select v-model="form.styleVector.style">
                <option v-for="o in styleVectors.style" :key="o.val" :value="o.val">{{ o.name }}</option>
              </select>
            </div>
            <div class="config-section">
              <label>节奏</label>
              <select v-model="form.styleVector.pacing">
                <option v-for="o in styleVectors.pacing" :key="o.val" :value="o.val">{{ o.name }}</option>
              </select>
            </div>
            <div class="config-section">
              <label>情感</label>
              <select v-model="form.styleVector.emotion">
                <option v-for="o in styleVectors.emotion" :key="o.val" :value="o.val">{{ o.name }}</option>
              </select>
            </div>
            <div class="config-section">
              <label>智识</label>
              <select v-model="form.styleVector.intellect">
                <option v-for="o in styleVectors.intellect" :key="o.val" :value="o.val">{{ o.name }}</option>
              </select>
            </div>
          </div>
          <div class="config-section" style="margin-top:1rem">
            <label>参考作者 <span class="opt-tag">可选</span></label>
            <input type="text" v-model="form.referenceAuthor" placeholder="例：辰东、猫腻、耳根...（留空使用默认风格）">
          </div>
        </div>
      </div>

      <!-- ===== 4. 世界观与情节 ===== -->
      <div class="form-section">
        <div class="form-section-head" @click="toggleSection('world')">
          <span class="sec-icon"><app-icon name="map" :size="18" /></span>
          <span class="sec-title">世界观与情节</span>
          <span class="sec-desc">世界观、剧情模式、结局</span>
          <span class="sec-chevron" :class="{collapsed: collapsed.world}"><app-icon name="chevron-down" :size="18" /></span>
        </div>
        <div class="form-section-body" :class="{collapsed: collapsed.world}">
          <div class="config-section">
            <label>世界观补充 <span class="opt-tag">可选</span></label>
            <textarea v-model="form.worldSetting" rows="3" placeholder="描述世界背景、修炼体系、势力格局等..."></textarea>
          </div>
          <div class="config-section">
            <label>剧情模式</label>
            <div class="option-grid-2">
              <div v-for="pm in plotModes" :key="pm.val"
                   class="option-card" :class="{active: form.plotMode===pm.val}"
                   @click="form.plotMode=pm.val">
                <div class="option-card-header">
                  <span class="option-icon"><app-icon :name="plotIcon(pm.val)" :size="20" /></span>
                  <strong>{{ pm.name }}</strong>
                </div>
                <p class="option-desc">{{ pm.desc }}</p>
              </div>
            </div>
          </div>
          <div class="config-section">
            <label>大结局风格</label>
            <div class="option-grid-2">
              <div v-for="es in endingStyles" :key="es.val"
                   class="option-card" :class="{active: form.endingStyle===es.val}"
                   @click="form.endingStyle=es.val">
                <div class="option-card-header">
                  <span class="option-icon"><app-icon :name="endingIcon(es.val)" :size="20" /></span>
                  <strong>{{ es.name }}</strong>
                </div>
                <p class="option-desc">{{ es.desc }}</p>
              </div>
            </div>
          </div>
          <div class="config-section">
            <label>额外设定 <span class="opt-tag">可选</span></label>
            <textarea v-model="form.extraSettings" rows="2"
              placeholder="其他补充要求，例如：&#10;- 主角要有金手指系统&#10;- 要有青梅竹马的女主&#10;- 世界观要融合东方神话"></textarea>
          </div>
        </div>
      </div>

      <!-- ===== 5. 篇幅与卷结构 ===== -->
      <div class="form-section">
        <div class="form-section-head" @click="toggleSection('volume')">
          <span class="sec-icon"><app-icon name="layers" :size="18" /></span>
          <span class="sec-title">篇幅与卷结构</span>
          <span class="sec-desc">预计 {{ effectiveTotalWords }} 字</span>
          <span class="sec-chevron" :class="{collapsed: collapsed.volume}"><app-icon name="chevron-down" :size="18" /></span>
        </div>
        <div class="form-section-body" :class="{collapsed: collapsed.volume}">
          <div class="opt-grid">
            <div class="config-section">
              <label>章节数量</label>
              <select v-model.number="form.chapterCount">
                <option v-for="n in chapterOptions" :key="n" :value="n">{{ n }} 章</option>
                <option :value="-1">自定义...</option>
              </select>
              <input v-if="isCustomChapter" type="number" v-model="customChapterInput" min="1" max="200" placeholder="输入章节数" class="custom-input-below">
            </div>
            <div class="config-section">
              <label>每章字数</label>
              <select v-model.number="form.wordCount">
                <option v-for="w in wordOptions" :key="w" :value="w">约 {{ w }} 字</option>
                <option :value="-1">自定义...</option>
              </select>
              <input v-if="isCustomWord" type="number" v-model="customWordInput" min="100" max="10000" step="100" placeholder="输入每章字数" class="custom-input-below">
            </div>
          </div>
          <div class="hint" style="margin-top:0.5rem">预计总字数约 {{ effectiveTotalWords }} 字</div>

          <div class="config-section" style="margin-top:1rem">
            <label>卷结构</label>
            <div class="tag-row">
              <span v-for="vp in volumePresets" :key="vp.val"
                    class="tag-chip" :class="{active: form.volumeStructure===vp.val}"
                    @click="selectVolume(vp.val)">
                {{ vp.name }}
              </span>
            </div>
            <div class="hint">{{ currentVolumeDesc }}</div>

            <div v-if="form.volumeStructure==='single'" class="volume-preview">
              <span class="vol-pill"><strong>正文</strong>{{ effectiveChapterCount }} 章</span>
            </div>

            <div v-else-if="form.volumeStructure==='triple'" class="volume-preview">
              <span v-for="(v,i) in triplePreview" :key="i" class="vol-pill">
                <strong>{{ v.name }}</strong>{{ v.chapterCount }} 章
              </span>
            </div>

            <div v-else class="volume-edit-list">
              <div v-for="(v,i) in form.volumes" :key="i" class="volume-edit-row">
                <span class="vol-num">第{{ i+1 }}卷</span>
                <input type="text" v-model="v.name" placeholder="卷名（可选）">
                <input type="number" v-model.number="v.chapterCount" min="1" placeholder="章数" class="vol-count-input">
                <span class="del-vol" @click="removeVolume(i)"><app-icon name="x" :size="14" /></span>
              </div>
              <button class="btn btn-outline btn-sm add-vol-btn" @click="addVolume">
                <app-icon name="plus" :size="14" style="margin-right:4px" /> 添加卷
              </button>
              <div class="hint">自定义卷总章数：{{ customChapterSum }} 章（目标 {{ effectiveChapterCount }} 章）</div>
            </div>
          </div>
        </div>
      </div>

      <!-- ===== 6. AI 模型选择 ===== -->
      <div class="form-section">
        <div class="form-section-head" @click="toggleSection('model')">
          <span class="sec-icon"><app-icon name="cpu" :size="18" /></span>
          <span class="sec-title">AI 模型</span>
          <span class="sec-desc">选择生成模型</span>
          <span class="sec-chevron" :class="{collapsed: collapsed.model}"><app-icon name="chevron-down" :size="18" /></span>
        </div>
        <div class="form-section-body" :class="{collapsed: collapsed.model}">
          <div class="config-section">
            <label>使用模型</label>
            <select v-model="selectedModelId">
              <option value="">使用默认模型</option>
              <option v-for="m in models" :key="m.id" :value="m.id">
                {{ m.name }} ({{ m.modelName }})
              </option>
            </select>
            <div v-if="models.length === 0" class="hint" style="color:var(--danger)">
              请先在设置中添加 AI 模型
            </div>
          </div>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="create-actions">
        <button class="btn btn-outline" @click="$router.push('/')">返回</button>
        <button class="btn btn-primary" :disabled="!isReady" @click="createNovel">
          {{ isReady ? submitBtnText : '请先输入创意' }}
        </button>
      </div>

    </div>

    <!-- ===== 创意工坊页签 ===== -->
    <div v-if="activeTab==='workshop'">
      <Workshop @generated="onWorkshopGenerated" />
    </div>

    </div><!-- /create-card -->
  </div>
  `,
  methods: {
    openSettings(){ store.drawerOpen = true; },

    switchTab(tab){ this.activeTab = tab; },

    // 创意工坊生成完成后：切换到常规新建页签并重新加载 store.novelConfig
    onWorkshopGenerated(){
      this.activeTab = 'regular';
      // 为什么用 nextTick：等待页签切换后再读取 store 数据填充表单
      this.$nextTick(() => {
        this.loadFromStore();
      });
    },

    // 从 store.novelConfig 重新加载表单数据
    loadFromStore(){
      const c = store.novelConfig;
      if(!c) return;
      if(c.title) this.form.title = c.title;
      if(c.idea) this.form.idea = c.idea;
      if(c.genre) this.form.genre = c.genre;
      if(c.style) this.form.style = c.style;
      if(c.styleVector) this.form.styleVector = { ...this.form.styleVector, ...c.styleVector };
      if(c.referenceAuthor !== undefined) this.form.referenceAuthor = c.referenceAuthor;
      if(c.protagonist) this.form.protagonist = { ...this.form.protagonist, ...c.protagonist };
      if(c.worldSetting) this.form.worldSetting = c.worldSetting;
      if(c.plotMode) this.form.plotMode = c.plotMode;
      if(c.endingStyle) this.form.endingStyle = c.endingStyle;
      if(c.extraSettings) this.form.extraSettings = c.extraSettings;
      if(c.targetReader) this.form.targetReader = c.targetReader;
      if(c.coverColor) this.form.coverColor = c.coverColor;
      if(c.chapterCount){
        if(!this.chapterOptions.includes(c.chapterCount)){
          this.customChapterInput = String(c.chapterCount);
          this.form.chapterCount = -1;
        } else {
          this.form.chapterCount = c.chapterCount;
        }
      }
      if(c.wordCount){
        if(!this.wordOptions.includes(c.wordCount)){
          this.customWordInput = String(c.wordCount);
          this.form.wordCount = -1;
        } else {
          this.form.wordCount = c.wordCount;
        }
      }
      if(c.volumeStructure) this.form.volumeStructure = c.volumeStructure;
      if(c.volumes && c.volumes.length) this.form.volumes = c.volumes.map(v => ({ ...v }));
      // 展开所有区块让用户看到生成结果
      this.collapsed = {};
    },

    // 编辑模式：从书架加载已有小说设定
    loadNovelForEdit(novelId){
      const novel = store.library.find(n => n.id === novelId);
      if(!novel){
        store.toast('未找到该小说，请从书架进入', 'warn');
        this.$router.push('/library');
        return;
      }
      this.editingId = novelId;
      // 将 novel 字段映射到表单
      this.form.title = novel.title || '';
      this.form.idea = novel.idea || '';
      this.form.genre = novel.genre || '历史穿越';
      this.form.style = novel.style || '热血爽文';
      if(novel.styleVector) this.form.styleVector = { ...this.form.styleVector, ...novel.styleVector };
      this.form.referenceAuthor = novel.referenceAuthor || '';
      if(novel.protagonist) this.form.protagonist = { ...this.form.protagonist, ...novel.protagonist };
      this.form.worldSetting = novel.worldSetting || '';
      this.form.plotMode = novel.plotMode || 'linear';
      this.form.endingStyle = novel.endingStyle || 'happy';
      this.form.extraSettings = novel.extraSettings || '';
      this.form.targetReader = novel.targetReader || 'general';
      this.form.coverColor = novel.coverColor || '#c9a227';
      if(novel.chapterCount){
        if(!this.chapterOptions.includes(novel.chapterCount)){
          this.customChapterInput = String(novel.chapterCount);
          this.form.chapterCount = -1;
        } else {
          this.form.chapterCount = novel.chapterCount;
        }
      }
      if(novel.wordCount){
        if(!this.wordOptions.includes(novel.wordCount)){
          this.customWordInput = String(novel.wordCount);
          this.form.wordCount = -1;
        } else {
          this.form.wordCount = novel.wordCount;
        }
      }
      if(novel.volumeStructure) this.form.volumeStructure = novel.volumeStructure;
      if(novel.volumes && novel.volumes.length) this.form.volumes = novel.volumes.map(v => ({ ...v }));
      // 编辑模式默认展开所有区块
      this.collapsed = {};
      // 切换到常规新建页签
      this.activeTab = 'regular';
    },
    applyProtagonistTemplate(t){
      const templates = {
        underdog: {
          personality: '资质平庸但不屈不挠，性格坚韧隐忍，受挫愈强',
          goal: '从底层崛起，证明自身价值',
          conflict: '出身卑微与天赋不足的双重困境',
        },
        fallen: {
          personality: '曾经的天才，跌落后沉稳内敛，带着不甘与复仇之心',
          goal: '重回巅峰，查明陨落真相',
          conflict: '昔日荣光与今朝落魄的巨大落差',
        },
        transmigrator: {
          personality: '来自现代的灵魂，思维灵活务实，善于利用信息差',
          goal: '在新世界站稳脚跟，寻找回家的方法或接受新身份',
          conflict: '前世记忆与今生身份的矛盾',
        },
        raising: {
          personality: '天真烂漫但逐渐成熟，从稚嫩走向沉稳',
          goal: '从零开始成长，最终独当一面',
          conflict: '成长过程中的试炼与抉择',
        },
      };
      const tpl = templates[t.val];
      if(tpl){
        this.form.protagonist.personality = tpl.personality;
        this.form.protagonist.goal = tpl.goal;
        this.form.protagonist.conflict = tpl.conflict;
        store.toast('已应用「' + t.name + '」模板', 'success');
      }
    },

    toggleSection(key){
      // 为什么用 Vue.set：确保响应式更新
      this.collapsed[key] = !this.collapsed[key];
    },

    plotIcon(val){
      return { linear: 'trending-up', episodic: 'search', multithread: 'network', twist: 'refresh-cw' }[val] || 'clipboard-list';
    },
    endingIcon(val){
      return { happy: 'party-popper', open: 'door-open', tragic: 'heart-crack', suspense: 'help-circle' }[val] || 'book';
    },

    selectVolume(val){
      this.form.volumeStructure = val;
      if(val === 'custom' && this.form.volumes.length === 0){
        this.addVolume();
      }
    },

    addVolume(){
      this.form.volumes.push({ name: '', chapterCount: 1 });
    },
    removeVolume(idx){
      this.form.volumes.splice(idx, 1);
    },

    buildVolumes(){
      const chapterCount = this.effectiveChapterCount;
      if(this.form.volumeStructure === 'single'){
        return [{ name: '正文', chapterCount }];
      }
      if(this.form.volumeStructure === 'triple'){
        return this.triplePreview.map(v => ({ ...v }));
      }
      return this.form.volumes
        .filter(v => (parseInt(v.chapterCount) || 0) > 0)
        .map(v => ({ name: v.name || '', chapterCount: parseInt(v.chapterCount) || 0 }));
    },

    createNovel(){
      if(!this.form.idea.trim()){
        store.toast('请输入创意描述', 'error');
        return;
      }
      if(!store.isConfigured){
        store.toast('请先配置 API 或切换到模拟模式', 'warn');
        store.drawerOpen = true;
        return;
      }
      if(!this.form.title.trim()){
        const idea = this.form.idea.trim();
        this.form.title = idea.slice(0, 12) + (idea.length > 12 ? '...' : '');
      }

      const volumes = this.buildVolumes();

      // 使用有效值（处理自定义章数/字数）
      const chapterCount = this.effectiveChapterCount;
      const wordCount = this.effectiveWordCount;

      if(chapterCount < 1){
        store.toast('章节数量不能小于1', 'error');
        return;
      }
      if(wordCount < 100){
        store.toast('每章字数不能小于100', 'error');
        return;
      }

      store.novelConfig = {
        title: this.form.title,
        idea: this.form.idea,
        genre: this.form.genre,
        style: this.form.style,
        styleVector: { ...this.form.styleVector },
        referenceAuthor: this.form.referenceAuthor,
        protagonist: { ...this.form.protagonist },
        worldSetting: this.form.worldSetting,
        plotMode: this.form.plotMode,
        endingStyle: this.form.endingStyle,
        extraSettings: this.form.extraSettings,
        targetReader: this.form.targetReader,
        coverColor: this.form.coverColor,
        chapterCount,
        wordCount,
        volumeStructure: this.form.volumeStructure,
        volumes,
      };

      // 如果选了特定模型，临时切换
      if(this.selectedModelId){
        const m = store.getModel(this.selectedModelId);
        if(m) store.config = { base:m.apiUrl, key:m.apiKey, model:m.modelName };
      }

      // 编辑模式：更新已有小说设定，保留已生成的章节和记忆数据
      if(this.editingId){
        const novel = store.library.find(n => n.id === this.editingId);
        if(novel){
          Object.assign(novel, {
            title: this.form.title,
            idea: this.form.idea,
            genre: this.form.genre,
            style: this.form.style,
            styleVector: { ...this.form.styleVector },
            referenceAuthor: this.form.referenceAuthor,
            protagonist: { ...this.form.protagonist },
            worldSetting: this.form.worldSetting,
            plotMode: this.form.plotMode,
            endingStyle: this.form.endingStyle,
            extraSettings: this.form.extraSettings,
            targetReader: this.form.targetReader,
            coverColor: this.form.coverColor,
            chapterCount,
            wordCount,
            volumeStructure: this.form.volumeStructure,
            volumes,
          });
          // 同步更新 currentNovel
          if(store.currentNovel && store.currentNovel.id === this.editingId){
            Object.assign(store.currentNovel, JSON.parse(JSON.stringify(novel)));
          }
          store.saveToLibrary(novel);
          store.toast('小说设定已更新', 'success');
          this.$router.push('/novel/' + novel.id);
          return;
        }
      }

      const novel = Engine.createNovel(store.novelConfig);
      store.currentNovel = novel;
      store.saveToLibrary(novel);

      store.toast('小说创建成功，即将进入工作台', 'success');
      this.$router.push('/novel/' + novel.id);
    },
  },
};

window.CreatePage = CreatePage;
