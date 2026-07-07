/* ============================================================
 * 创意工坊组件 - AI 一句话生成完整设定
 *
 * 设计理念（对齐全局设计系统）：
 *   两个页签只是数据来源不同——常规新建是手动填写，
 *   创意工坊是 AI 填充。所以创意工坊生成后，
 *   直接将结果写入 store.novelConfig 并切换到常规新建页签，
 *   用户在统一的表单中微调后创建。
 *
 * 为什么这样设计：
 *   1. 两个页签共享同一套表单 UI，零设计割裂
 *   2. 生成的字段直接映射 store.novelConfig，与项目数据结构完全匹配
 *   3. 创意工坊 UI 极简：输入创意 → 可选偏好 → 生成
 * ============================================================ */
const Workshop = {
  name: 'Workshop',
  emits: ['generated'],
  data(){
    return {
      genres: CONST.GENRES,
      styles: CONST.STYLES,
      // 输入表单
      form: {
        idea: '',
        genre: '',
        style: '',
        plotPattern: '',
        endingStyle: '',
        extraSettings: '',
      },
      // 状态
      generating: false,
      loadingStatus: '',
    };
  },
  computed: {
    isMockMode(){ return store.mode === 'mock'; },
    isApiReady(){ return store.isConfigured; },
    canGenerate(){ return this.form.idea.trim().length > 0 && !this.generating; },
  },
  mounted(){
    if(store.draftIdea) this.form.idea = store.draftIdea;
  },
  template: `
  <div class="workshop-wrap">

    <!-- 模式提示 -->
    <div v-if="isMockMode" class="mode-banner mode-banner-warn">
      <app-icon name="help-circle" :size="18" />
      <span>当前为<strong>模拟演示模式</strong>，将输出固定示例。配置 API 可获得真实 AI 生成。</span>
    </div>
    <div v-else-if="!isApiReady" class="mode-banner mode-banner-err">
      <app-icon name="x" :size="18" />
      <span>API 配置不完整，无法生成。</span>
      <button class="btn btn-outline btn-sm" @click="openSettings">去配置</button>
    </div>

    <!-- 核心创意输入 -->
    <div class="form-section">
      <div class="form-section-head" style="cursor:default">
        <span class="sec-icon"><app-icon name="lightbulb" :size="18" /></span>
        <span class="sec-title">一句话创意</span>
      </div>
      <div class="form-section-body">
        <div class="config-section">
          <label>小说思路 <span style="color:var(--danger)">*</span></label>
          <textarea v-model="form.idea" rows="4"
            placeholder="描述你的故事灵感，AI 将自动生成完整的小说设定&#10;&#10;例如：&#10;- 一个穿越到明朝的程序员，用现代知识在科举和商战中崛起&#10;- 末日降临，主角觉醒种田系统，在废土上建立幸存者家园&#10;- 一所重点高中里接连发生离奇失踪案，转学生暗中调查发现惊天秘密"></textarea>
          <div class="hint">越详细越好，AI 将据此生成书名、主角、世界观、剧情等全部设定</div>
        </div>
      </div>
    </div>

    <!-- 可选偏好 -->
    <div class="form-section">
      <div class="form-section-head" style="cursor:default">
        <span class="sec-icon"><app-icon name="sliders" :size="18" /></span>
        <span class="sec-title">偏好设定</span>
        <span class="sec-desc">可选，留空由 AI 自动判断</span>
      </div>
      <div class="form-section-body">
        <div class="opt-grid">
          <div class="config-section">
            <label>题材类型</label>
            <select v-model="form.genre">
              <option value="">AI 自动判断</option>
              <option v-for="g in genres" :key="g" :value="g">{{ g }}</option>
            </select>
          </div>
          <div class="config-section">
            <label>写作风格</label>
            <select v-model="form.style">
              <option value="">AI 自动判断</option>
              <option v-for="s in styles" :key="s" :value="s">{{ s }}</option>
            </select>
          </div>
        </div>
        <div class="config-section" style="margin-top:1rem">
          <label>额外要求 <span class="opt-tag">可选</span></label>
          <textarea v-model="form.extraSettings" rows="2"
            placeholder="其他补充要求，例如：&#10;- 主角要有金手指系统&#10;- 要有青梅竹马的女主&#10;- 世界观要融合东方神话"></textarea>
        </div>
      </div>
    </div>

    <!-- 生成按钮 -->
    <div class="create-actions">
      <button class="btn btn-primary btn-lg" :disabled="!canGenerate" @click="generateIdea"
        style="width:100%;justify-content:center">
        <span v-if="generating" class="spinner-sm"></span>
        <app-icon v-else name="sparkles" :size="18" style="margin-right:6px" />
        {{ generating ? (loadingStatus || '生成中...') : '一键生成完整设定' }}
      </button>
    </div>

    <!-- 说明 -->
    <div class="workshop-tips">
      <app-icon name="info" :size="14" />
      <span>AI 生成后将自动填充到「新建小说」表单中，你可自由编辑任何字段后创建小说</span>
    </div>
  </div>
  `,
  methods: {
    openSettings(){ store.drawerOpen = true; },

    // 构建生成提示词 — 输出 JSON，字段与 store.novelConfig 完全对应
    buildPrompt(){
      const genre = this.form.genre || '根据创意自动判断';
      const style = this.form.style || '根据创意自动判断';
      const extra = this.form.extraSettings || '无';

      return `你是一位专业的网文创意策划师。请根据以下信息，生成一个完整的小说设定框架。

【核心创意】
${this.form.idea}

【偏好类型】${genre}
【偏好风格】${style}
【额外要求】${extra}

请严格按以下 JSON 格式输出（必须是合法 JSON，不要有任何额外文字或 Markdown 标记）：

{
    "title": "书名（要有吸引力，符合网文命名风格）",
    "genre": "题材类型（从以下选择：玄幻修仙、都市异能、历史穿越、悬疑推理、甜宠言情、科幻未来、武侠江湖、恐怖惊悚）",
    "style": "写作风格（从以下选择：轻松幽默、热血爽文、细腻文艺、暗黑沉重、快节奏、慢热深度）",
    "protagonist": {
        "name": "主角姓名",
        "personality": "性格特点（简短描述，如：沉稳内敛、腹黑机智）",
        "goal": "核心目标",
        "conflict": "核心冲突"
    },
    "worldSetting": "世界观设定（世界背景、力量体系、地理环境、势力分布等，100-200字）",
    "plotMode": "剧情模式（从以下选择：linear-线性成长、episodic-单元解密、multithread-多线交织、twist-反转流）",
    "endingStyle": "大结局风格（从以下选择：happy-圆满胜利、open-开放式、tragic-悲剧美学、suspense-悬念留白）",
    "extraSettings": "额外设定（重要配角、特殊物品、金手指等，50-100字）",
    "targetReader": "目标读者（从以下选择：general、young_male、young_female、all_age、niche）",
    "coverColor": "封面颜色（十六进制颜色码，如 #c9a227）",
    "chapterCount": 5,
    "wordCount": 1200
}

注意：
1. plotMode 和 endingStyle 只能填上述英文值之一
2. targetReader 只能填上述英文值之一
3. genre 和 style 只能填上述中文值之一
4. chapterCount 建议范围 3-20，wordCount 建议范围 800-3000
5. 输出纯 JSON，不要有任何其他内容`;
    },

    // 解析 AI 返回的 JSON
    parseResult(raw){
      let json = raw;
      const m = raw.match(/```(?:json)?\s*([\s\S]+?)```/);
      if(m) json = m[1];
      try{
        const data = JSON.parse(json.trim());
        // 校验并规范化字段，确保与 store.novelConfig 完全匹配
        const validGenres = CONST.GENRES;
        const validStyles = CONST.STYLES;
        const validPlotModes = CONST.PLOT_MODES.map(p => p.val);
        const validEndings = CONST.ENDING_STYLES.map(e => e.val);
        const validReaders = CONST.TARGET_READERS.map(r => r.val);

        return {
          title: data.title || '',
          genre: validGenres.includes(data.genre) ? data.genre : validGenres[0],
          style: validStyles.includes(data.style) ? data.style : validStyles[0],
          protagonist: {
            name: data.protagonist?.name || '',
            personality: data.protagonist?.personality || '',
            goal: data.protagonist?.goal || '',
            conflict: data.protagonist?.conflict || '',
          },
          worldSetting: data.worldSetting || '',
          plotMode: validPlotModes.includes(data.plotMode) ? data.plotMode : 'linear',
          endingStyle: validEndings.includes(data.endingStyle) ? data.endingStyle : 'happy',
          extraSettings: data.extraSettings || '',
          targetReader: validReaders.includes(data.targetReader) ? data.targetReader : 'general',
          coverColor: data.coverColor || '#c9a227',
          chapterCount: Math.max(1, Math.min(50, parseInt(data.chapterCount) || 5)),
          wordCount: Math.max(800, Math.min(5000, parseInt(data.wordCount) || 1200)),
          // 默认风格向量
          styleVector: { style:'concise', pacing:'fast', emotion:'passionate', intellect:'balanced' },
          referenceAuthor: '',
          volumeStructure: 'single',
          volumes: [],
          // 保留写作参数
          contextBudget: store.novelConfig.contextBudget || 8000,
          arcLength: store.novelConfig.arcLength || 5,
          wordTolerance: store.novelConfig.wordTolerance || 0.15,
          outlineBatch: store.novelConfig.outlineBatch || 5,
          coolPointDensity: store.novelConfig.coolPointDensity || 0.29,
          rhythmRatio: store.novelConfig.rhythmRatio || { setup:20, rising:30, climax:35, hook:15 },
          temperature: store.novelConfig.temperature || 0.85,
          rewriteThreshold: store.novelConfig.rewriteThreshold || 60,
          enableQualityGuard: store.novelConfig.enableQualityGuard,
          enableMemory: store.novelConfig.enableMemory,
          enableAgents: store.novelConfig.enableAgents,
          enableRewrite: store.novelConfig.enableRewrite,
          enablePID: store.novelConfig.enablePID,
        };
      }catch(e){
        console.error('Workshop parse error:', e);
        return null;
      }
    },

    // 一键生成
    // 为什么移除 isConfigured 拦截：
    //   创意工坊的核心价值是"快速试创意"，不应被 API 配置阻断。
    //   未配置时自动降级为 mock 生成，用户仍能体验完整流程。
    async generateIdea(){
      if(!this.form.idea.trim()){
        store.toast('请输入小说思路', 'error');
        return;
      }

      // 未配置时自动降级 mock 模式（仅本次生成，不改变全局设置）
      const useMock = store.mode === 'mock' || !store.isConfigured;
      if(useMock && store.mode !== 'mock'){
        store.toast('API 未配置，本次使用模拟数据生成', 'warn');
      }

      this.generating = true;
      this.loadingStatus = '正在准备...';

      try{
        let config;
        if(useMock){
          this.loadingStatus = '模拟生成中...';
          await this.sleep(800);
          config = MockGen.workshop(this.form.idea);
        } else {
          this.loadingStatus = 'AI 正在创作中...';
          const prompt = this.buildPrompt();
          const raw = await Api.callApiNonStream(prompt, { taskType:'structured', maxTokens:4096 });
          config = this.parseResult(raw);
          if(!config){
            throw new Error('AI 返回格式异常，请重试');
          }
        }

        // 将生成结果写入 store.novelConfig
        store.novelConfig = {
          ...store.novelConfig,
          ...config,
          idea: this.form.idea,
        };

        store.toast('AI 已生成完整设定，请检查并修改', 'success');

        // 通知父组件切换到常规新建页签
        this.$emit('generated');
      }catch(e){
        store.toast('生成失败: ' + e.message, 'error');
        console.error('Workshop generate error:', e);
      }finally{
        this.generating = false;
        this.loadingStatus = '';
      }
    },

    sleep(ms){ return new Promise(r => setTimeout(r, ms)); },
  },
};

window.Workshop = Workshop;
