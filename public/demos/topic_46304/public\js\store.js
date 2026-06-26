/* ============================================================
 * Store - 全局状态管理
 * 使用 Vue 3 reactive API，无需 Pinia 依赖
 * ============================================================ */

// 常量定义
const GENRES = ['玄幻修仙','都市异能','历史穿越','悬疑推理','甜宠言情','科幻未来','武侠江湖','恐怖惊悚'];
const STYLES = ['轻松幽默','热血爽文','细腻文艺','暗黑沉重','快节奏','慢热深度'];
const PLOT_MODES = [
  { val:'linear', name:'线性成长', desc:'经典爽文，主角一路升级打怪' },
  { val:'episodic', name:'单元解密', desc:'每章一个独立案件/事件，逐步揭开主线' },
  { val:'multithread', name:'多线交织', desc:'多视角并行，线索最终汇合' },
  { val:'twist', name:'反转流', desc:'不断反转，出人意料的剧情走向' },
];
const ENDING_STYLES = [
  { val:'happy', name:'圆满胜利', desc:'大团圆结局，所有伏笔收束' },
  { val:'open', name:'开放式', desc:'留白想象，结局意味深长' },
  { val:'tragic', name:'悲剧美学', desc:'壮烈收场，情感冲击力强' },
  { val:'suspense', name:'悬念留白', desc:'解决主要矛盾但埋下新悬念' },
];
const EXAMPLES = [
  '一个穿越到明朝的程序员，用现代知识在科举和商战中崛起',
  '末日降临，主角觉醒种田系统，在废土上建立幸存者家园',
  '一所重点高中里接连发生离奇失踪案，转学生暗中调查发现惊天秘密',
];
// 模型预设 — 2026-06-26 更新，依据各厂商最新官方文档
const PRESETS = {
  // DeepSeek V4 系列（旧名 deepseek-chat/deepseek-reasoner 2026/7/24 停用）
  deepseek:{ base:'https://api.deepseek.com/v1', model:'deepseek-v4-flash', name:'DeepSeek V4 Flash' },
  deepseek_pro:{ base:'https://api.deepseek.com/v1', model:'deepseek-v4-pro', name:'DeepSeek V4 Pro (思考)' },
  // Moonshot Kimi K2.5（kimi-latest 已于 2026/1/28 下线）
  kimi:{ base:'https://api.moonshot.cn/v1', model:'kimi-k2.5', name:'Kimi K2.5' },
  kimi_turbo:{ base:'https://api.moonshot.cn/v1', model:'kimi-k2-turbo-preview', name:'Kimi K2 Turbo' },
  // 智谱 GLM-5.2（2026/6 开源旗舰）
  glm:{ base:'https://open.bigmodel.cn/api/paas/v4', model:'glm-5.2', name:'智谱 GLM-5.2' },
  glm_flash:{ base:'https://open.bigmodel.cn/api/paas/v4', model:'glm-4-flash', name:'智谱 GLM-4 Flash (免费)' },
  // 通义千问 Qwen3.6（旧名 qwen-turbo/plus 已过时）
  qwen_max:{ base:'https://dashscope.aliyuncs.com/compatible-mode/v1', model:'qwen3.6-max-preview', name:'通义千问 3.6 Max' },
  qwen_plus:{ base:'https://dashscope.aliyuncs.com/compatible-mode/v1', model:'qwen3.6-plus', name:'通义千问 3.6 Plus' },
  qwen_flash:{ base:'https://dashscope.aliyuncs.com/compatible-mode/v1', model:'qwen3.6-flash', name:'通义千问 3.6 Flash' },
  // 火山方舟 豆包 2.1 系列（旧名 doubao-pro-32k 已过时）
  ark:{ base:'https://ark.cn-beijing.volces.com/api/v3', model:'Doubao-Seed-2.1-pro', name:'豆包 2.1 Pro' },
  ark_turbo:{ base:'https://ark.cn-beijing.volces.com/api/v3', model:'Doubao-Seed-2.1-turbo', name:'豆包 2.1 Turbo' },
  // 硅基流动（模型名格式：厂商/模型）
  siliconflow:{ base:'https://api.siliconflow.cn/v1', model:'deepseek-ai/DeepSeek-V3', name:'硅基流动 DeepSeek V3' },
  siliconflow_qwen:{ base:'https://api.siliconflow.cn/v1', model:'Qwen/Qwen3.6-35B-A3B', name:'硅基流动 Qwen3.6' },
  // Claude（Anthropic）
  claude:{ base:'https://api.anthropic.com/v1', model:'claude-sonnet-4-6', name:'Claude Sonnet 4.6' },
  // Ollama 本地
  ollama:{ base:'http://localhost:11434/v1', model:'llama3.3', name:'Ollama Llama 3.3 (本地)' },
};

// 风格向量选项（对标参考项目 style_vectors）
const STYLE_VECTORS = {
  style: [
    { val:'concise', name:'简洁' },
    { val:'ornate', name:'华丽' },
    { val:'humorous', name:'幽默' },
  ],
  pacing: [
    { val:'fast', name:'快节奏' },
    { val:'slow', name:'慢节奏' },
    { val:'alternating', name:'快慢交替' },
  ],
  emotion: [
    { val:'passionate', name:'热血激情' },
    { val:'warm', name:'温馨治愈' },
    { val:'dark', name:'暗黑压抑' },
  ],
  intellect: [
    { val:'strategy', name:'谋略为主' },
    { val:'power', name:'力量为主' },
    { val:'balanced', name:'智勇双全' },
  ],
};

// 卷结构预设（对标参考项目 volume_presets）
const VOLUME_PRESETS = [
  { val:'single', name:'单卷本', desc:'全书一卷，适合短篇' },
  { val:'triple', name:'三卷本', desc:'起/承/合三卷，经典结构' },
  { val:'custom', name:'自定义', desc:'手动规划卷数和章数' },
];

// 目标读者（对标参考项目 reader_profile_options）
const TARGET_READERS = [
  { val:'general', name:'通用读者' },
  { val:'young_male', name:'年轻男性（热血爽文向）' },
  { val:'young_female', name:'年轻女性（情感细腻向）' },
  { val:'all_age', name:'全年龄（合家欢）' },
  { val:'niche', name:'小众硬核（高门槛设定）' },
];

// 创意工坊剧情走向模式（对标参考项目 workshop.php plotPatterns）
const WORKSHOP_PLOT_PATTERNS = [
  { val:'linear_growth', name:'线性成长型', desc:'经典爽文模式，主角从弱小起步，一步步克服困难，实力/地位不断提升' },
  { val:'unit_puzzle', name:'单元解谜型', desc:'主角进入一个个独立的副本或案件，解决谜题，逐步揭开主线真相' },
  { val:'apocalypse', name:'救世/末世型', desc:'世界面临崩溃，主角在绝望中寻找希望，对抗终极威胁' },
  { val:'intellectual_battle', name:'智斗/布局型', desc:'多方势力通过信息差、策略、阴谋进行较量，剧情充满反转' },
  { val:'anti_cliche', name:'反套路/解构型', desc:'颠覆传统网文套路，用幽默或荒诞的方式解构经典设定' },
  { val:'custom', name:'自定义', desc:'自行描述剧情走向' },
];

// 创意工坊大结局风格（对标参考项目 workshop.php endingStyles）
const WORKSHOP_ENDING_STYLES = [
  { val:'happy_ending', name:'圆满胜利型', desc:'大团圆结局，主角达成所有目标' },
  { val:'open_ending', name:'开放式结局', desc:'留白想象，结局意味深长' },
  { val:'tragic_hero', name:'悲剧/牺牲型', desc:'壮烈收场，情感冲击力强' },
  { val:'dark_twist', name:'黑暗反转型', desc:'结局揭露颠覆性真相' },
  { val:'daily_return', name:'日常回归型', desc:'冒险后回归平静，强调平凡可贵' },
  { val:'sequel_setup', name:'续作铺垫型', desc:'当前危机解除，引出更大威胁' },
  { val:'custom', name:'自定义', desc:'自行描述大结局风格' },
];

// 主角类型模板（对标参考项目 create.php fillProtagonist）
const PROTAGONIST_TEMPLATES = [
  { val:'underdog', name:'废柴逆袭型', desc:'资质平庸的底层少年，受尽欺凌却不屈不挠，意外获得金手指后踏上逆袭之路' },
  { val:'fallen', name:'天骄陨落型', desc:'曾经的天之骄子因某种原因跌落神坛，在绝境中觉醒真正的力量，重新崛起' },
  { val:'transmigrator', name:'穿越者型', desc:'来自地球的现代灵魂穿越到陌生世界，带着前世的记忆/知识/系统' },
  { val:'raising', name:'养成型', desc:'从幼年/新手阶段开始培养，读者见证从零到一的完整成长过程' },
];

const store = Vue.reactive({
  // ===== API 配置 =====
  mode: 'api',  // 'api' | 'mock'
  config: { base:'', key:'', model:'' },

  // ===== 多模型管理（对标参考项目 ai_models 表）=====
  // 为什么用数组：支持配置多个模型，按任务类型(creative/structured/synopsis)智能选择
  models: [],
  defaultModelId: null,

  // ===== 页面间传递的创意 =====
  draftIdea: '',  // 主页输入的创意，传到配置页

  // ===== 小说生成配置 =====
  novelConfig: {
    idea: '',
    title: '',              // 小说标题
    genre: '历史穿越',
    style: '热血爽文',
    // 风格向量（对标参考项目 style_vectors）
    styleVector: { style:'concise', pacing:'fast', emotion:'passionate', intellect:'balanced' },
    referenceAuthor: '',    // 参考作者
    // 主角信息（对标参考项目 protagonist）
    protagonist: { name:'', personality:'', goal:'', conflict:'' },
    worldSetting: '',       // 世界观设定补充
    plotMode: 'linear',
    endingStyle: 'happy',
    extraSettings: '',       // 额外设定（对标参考项目 extra_settings）
    targetReader: 'general', // 目标读者（对标参考项目 target_reader）
    coverColor: '#c9a227',   // 封面颜色（对标参考项目 cover_color）
    chapterCount: 5,
    wordCount: 1200,
    // 卷结构（对标参考项目 volume_structure）
    volumeStructure: 'single',
    volumes: [],            // 自定义卷结构 [{name, chapterCount}]
    // 写作参数扩展（对标参考项目 writing_params）
    contextBudget: 8000,    // 记忆上下文字符预算
    arcLength: 5,           // 弧段压缩间隔（章）
    wordTolerance: 0.15,    // 字数容差(±15%)
    outlineBatch: 5,        // 大纲批量生成数
    coolPointDensity: 0.29, // 爽点密度目标
    rhythmRatio: { setup:20, rising:30, climax:35, hook:15 }, // 四段式节奏比例
    temperature: 0.85,      // 基础温度
    rewriteThreshold: 60,   // 重写阈值(质量分低于此值触发重写)
    enableQualityGuard: true,
    enableMemory: true,
    enableAgents: true,
    enableRewrite: false,
    enablePID: true,
  },

  // ===== 约束配置（对标参考项目 constraints/config.js）=====
  constraintConfig: {
    enabled: true,                   // 启用约束框架
    strictMode: false,               // 严格模式(P0拦截)
    maxCoincidences: 5,              // 巧合数上限
    maxSameConflict: 1,              // 同类冲突上限
    foreshadowingRecoveryMin: 70,    // 伏笔回收率下限(%)
    maxNewInfoPerCh: 2,              // 每章新信息上限
    minBufferRelease: 2,             // 高潮后缓冲释放章数
    cooldownAfterClimax: 1,          // 高潮后冷却章数
    maxBannedWordUsage: 15,          // 禁用词使用上限
    bannedWords: '绝境,反杀,真相,背水,逆袭', // 禁用词列表(逗号分隔)
    combatRatioMin: 40,              // 战斗比例下限%(对标 cf_combat_ratio_min)
    combatRatioMax: 60,              // 战斗比例上限%(对标 cf_combat_ratio_max)
    speedFactor: 10,                 // 速度因子(对标 cf_speed_factor)
    rivalFactor: 0.8,                // 对手因子(对标 cf_rival_factor)
  },

  // ===== 写作参数（对标参考项目 writing_settings，38+项）=====
  writingParams: {
    // 基础生成参数
    chapterWords: 2000,              // 每章目标字数
    chapterWordTolerance: 150,       // 章节字数容差(固定)
    dynamicToleranceRatio: 0.10,     // 动态容差比例(对标 ws_dynamic_tolerance_ratio)
    minTolerance: 100,               // 动态容差下限(对标 ws_min_tolerance)
    maxTolerance: 500,               // 动态容差上限(对标 ws_max_tolerance)
    outlineBatch: 5,                 // 大纲批量生成数
    outlineBatch1M: 30,              // 大纲批量-1M模式(对标 ws_outline_batch_1m)
    autoWriteInterval: 2,            // 自动写作间隔(秒)
    contextMode: 'auto',             // 上下文模式: auto/compressed/full

    // 爽点调度参数
    coolPointDensityTarget: 0.88,    // 爽点密度目标
    coolPointHungerThreshold: 0.6,   // 爽点饥饿阈值
    doubleCoolpointGap: 3,           // 双爽点最小间隔(章)

    // 章节结构参数(四段占比%)
    segmentRatioSetup: 20,           // 铺垫段
    segmentRatioRising: 30,          // 发展段
    segmentRatioClimax: 35,          // 高潮/爽点释放
    segmentRatioHook: 15,            // 钩子收尾

    // 伏笔与记忆参数
    foreshadowingLookback: 10,       // 伏笔唤醒回溯章数
    memoryLookback: 5,               // 上下文记忆回溯章数
    embeddingTopK: 5,                // 语义检索 Top-K

    // AI 生成参数
    temperatureOutline: 0.3,         // 大纲温度
    temperatureChapter: 0.8,         // 正文温度
    maxTokensOutline: 4096,          // 大纲 MaxTokens
    maxTokensChapter: 8192,          // 正文 MaxTokens

    // 质量检查参数
    qualityCheckEnabled: true,       // 启用质量检查
    qualityMinScore: 6.0,            // 质量最低分阈值(1-10)

    // 写作质量增强
    criticEnabled: true,             // 读者视角评分
    styleGuardEnabled: true,         // 风格守护
    aiPatternsCheckEnabled: true,    // AI痕迹检测

    // 迭代重写参数
    rewriteEnabled: false,           // 启用重写
    rewriteThreshold: 70,            // 重写触发阈值
    rewriteMinGain: 10,              // 最低质量提升
    rewriteMaxIterations: 3,         // 最大迭代次数
    rewriteTargetScore: 80,          // 目标质量分数
    rewriteDeclineThreshold: 3,      // 质量下降容忍度
  },

  // ===== 统计追踪（对标参考项目 stats-tracker.js）=====
  usageStats: {
    todayWords: 0,
    todayChapters: 0,
    monthWords: 0,
    monthChapters: 0,
    totalWords: 0,
    totalChapters: 0,
    lastDate: '',
  },

  // ===== 当前正在生成/阅读的小说 =====
  currentNovel: null,
  currentChap: 0,

  // ===== 书架 =====
  library: [],

  // ===== UI 状态 =====
  drawerOpen: false,
  toasts: [],
  // 数据加载状态：true=正在从数据库加载，false=加载完成
  loading: true,
  // 写作参数卡片折叠状态：{ sectionKey: true/false }
  // true = 已折叠，false/undefined = 展开
  wpCollapsed: {},

  // ===== 计算属性 =====
  get isConfigured(){
    if(this.mode==='mock') return true;
    return !!(this.config.base && this.config.key && this.config.model);
  },

  get statusText(){
    if(this.mode==='mock') return '模拟模式';
    if(this.isConfigured) return '已配置';
    return '未配置';
  },

  get statusClass(){
    if(this.mode==='mock') return 'mock';
    if(this.isConfigured) return 'ok';
    return '';
  },

  // ===== 配置持久化 =====
  // 数据流向：仅从后端数据库加载，不再读取 localStorage
  // localStorage 仅作为写入时的备份，不用于加载
  async loadConfig(){
    try{
      const res = await fetch('/api/settings');
      const json = await res.json();
      if(json.ok && json.data && json.data.app_config){
        const c = json.data.app_config;
        this.mode = c.mode || 'api';
        this.config = c.config || {base:'',key:'',model:''};
        if(c.models) this.models = c.models;
        if(c.defaultModelId) this.defaultModelId = c.defaultModelId;
        if(c.writingParams) Object.assign(this.writingParams, c.writingParams);
        if(c.constraintConfig) Object.assign(this.constraintConfig, c.constraintConfig);
        if(c.wpCollapsed) this.wpCollapsed = c.wpCollapsed;
      }
    }catch(e){
      console.error('[store] 从数据库加载配置失败', e);
    }
  },

  saveConfig(){
    // 异步写数据库（唯一持久化路径）
    this._syncConfigToServer();
  },

  // 异步保存配置到后端数据库
  async _syncConfigToServer(){
    try{
      await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          settings: {
            app_config: {
              mode: this.mode,
              config: this.config,
              models: this.models,
              defaultModelId: this.defaultModelId,
              writingParams: this.writingParams,
              constraintConfig: this.constraintConfig,
              wpCollapsed: this.wpCollapsed,
            },
          },
        }),
        keepalive: true,
      });
    }catch(e){
      console.error('[store] 配置保存到数据库失败', e);
    }
  },

  // ===== 多模型管理（对标参考项目 ai_models 表）=====
  // 为什么用数组+id：支持多模型配置，按能力标签(creative/structured/synopsis)智能路由
  addModel(m){
    const model = {
      id: 'm_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8),
      name: m.name || '',
      apiUrl: m.apiUrl || m.base || '',
      apiKey: m.apiKey || m.key || '',
      modelName: m.modelName || m.model || '',
      maxTokens: m.maxTokens || 8192,
      temperature: m.temperature ?? 0.8,
      isDefault: m.isDefault || false,
      // 能力标签
      capCreative: m.capCreative || false,
      capStructured: m.capStructured || false,
      capSynopsis: m.capSynopsis || false,
      // 深度思考
      thinkingEnabled: m.thinkingEnabled || false,
      createdAt: new Date().toISOString(),
    };
    this.models.push(model);
    // 第一个模型自动设为默认
    if(this.models.length === 1 || model.isDefault){
      this.setDefaultModel(model.id);
    }
    this.saveConfig();
    return model;
  },

  updateModel(id, updates){
    const m = this.models.find(x => x.id === id);
    if(!m) return;
    Object.assign(m, updates);
    // 如果更新了 isDefault 为 true，需要取消其他模型的默认
    if(updates.isDefault === true){
      this.models.forEach(x => { if(x.id !== id) x.isDefault = false; });
      this.defaultModelId = id;
    }
    this.saveConfig();
  },

  removeModel(id){
    const idx = this.models.findIndex(x => x.id === id);
    if(idx < 0) return;
    this.models.splice(idx, 1);
    // 删除的是默认模型时，自动指定第一个为默认
    if(this.defaultModelId === id){
      this.defaultModelId = this.models.length > 0 ? this.models[0].id : null;
      if(this.defaultModelId) this.models[0].isDefault = true;
    }
    this.saveConfig();
  },

  setDefaultModel(id){
    this.models.forEach(m => { m.isDefault = (m.id === id); });
    this.defaultModelId = id;
    // 同步到 config 供 Engine 使用
    const m = this.models.find(x => x.id === id);
    if(m){
      this.config = { base: m.apiUrl, key: m.apiKey, model: m.modelName };
      this.mode = 'api';
    }
    this.saveConfig();
  },

  getModel(id){
    return this.models.find(m => m.id === id);
  },

  getDefaultModel(){
    if(this.defaultModelId) return this.getModel(this.defaultModelId);
    return this.models.find(m => m.isDefault) || this.models[0] || null;
  },

  // 导出配置为 JSON 文件
  exportConfigFile(){
    const data = {
      type: 'lingbi-config',
      version: '2.0',
      exportedAt: new Date().toISOString(),
      mode: this.mode,
      config: { ...this.config },
      models: JSON.parse(JSON.stringify(this.models)),
      defaultModelId: this.defaultModelId,
      writingParams: { ...this.writingParams },
      constraintConfig: { ...this.constraintConfig },
      wpCollapsed: { ...this.wpCollapsed },
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {type:'application/json'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `lingbi-config-${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  },

  // ===== 小说导出/导入（P2-5）=====

  // 导出小说 — format: 'txt' | 'json'
  exportNovel(novelId, format){
    const novel = this.library.find(n => n.id === novelId) || (this.currentNovel && this.currentNovel.id === novelId ? this.currentNovel : null);
    if(!novel){
      this.toast('未找到该小说', 'error');
      return;
    }
    format = format || 'txt';

    if(format === 'json'){
      // JSON 导出：完整数据，可重新导入
      const data = {
        type: 'lingbi-novel',
        version: '2.0',
        exportedAt: new Date().toISOString(),
        novel: JSON.parse(JSON.stringify(novel)),
      };
      const blob = new Blob([JSON.stringify(data, null, 2)], {type:'application/json'});
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `${novel.title || '小说'}-${new Date().toISOString().slice(0,10)}.json`;
      a.click();
      URL.revokeObjectURL(a.href);
      this.toast('已导出 JSON 文件', 'success');
    } else {
      // TXT 导出：纯文本，适合阅读
      const completed = (novel.chapters || []).filter(c => c && c.content);
      if(completed.length === 0){
        this.toast('暂无已完成的章节', 'warn');
        return;
      }
      let txt = `${novel.title || '小说'}\n${'='.repeat(40)}\n\n`;
      txt += `创意：${novel.idea || ''}\n题材：${novel.genre || ''} | 风格：${novel.style || ''}\n\n${'='.repeat(40)}\n\n`;
      (novel.chapters || []).forEach((c, i) => {
        if(c && c.content){
          txt += `第${i+1}章 ${c.title || ''}\n\n${c.content}\n\n`;
        }
      });
      const blob = new Blob([txt], {type:'text/plain;charset=utf-8'});
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `${novel.title || '小说'}.txt`;
      a.click();
      URL.revokeObjectURL(a.href);
      this.toast('已导出 TXT 文件', 'success');
    }
  },

  // 导入小说 — 从 JSON 文件
  importNovel(file){
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try{
          const data = JSON.parse(e.target.result);
          if(data.type !== 'lingbi-novel') throw new Error('不是有效的灵笔小说文件');
          const novel = data.novel;
          if(!novel || !novel.id) throw new Error('小说数据不完整');
          // 生成新 ID 避免冲突
          novel.id = 'novel-' + Date.now();
          novel.createdAt = Date.now();
          // 初始化记忆引擎
          if(novel.memory){
            MemoryEngine.init(novel);
          }
          // 加入书架
          this.library.unshift(JSON.parse(JSON.stringify(novel)));
          this.saveLibrary();
          this.toast('小说导入成功', 'success');
          resolve(novel);
        }catch(err){
          reject(err);
        }
      };
      reader.onerror = () => reject(new Error('文件读取失败'));
      reader.readAsText(file);
    });
  },

  // 导出章节简介 — format: 'json' | 'txt'
  exportChapterSynopses(novelId, format){
    const novel = this.library.find(n => n.id === novelId) || (this.currentNovel && this.currentNovel.id === novelId ? this.currentNovel : null);
    if(!novel){
      this.toast('未找到该小说', 'error');
      return;
    }
    format = format || 'json';
    const synopses = novel.synopses || [];
    if(synopses.length === 0){
      this.toast('暂无章节简介', 'warn');
      return;
    }

    if(format === 'json'){
      const data = {
        type: 'lingbi-synopses',
        novelId: novel.id,
        novelTitle: novel.title,
        exportedAt: new Date().toISOString(),
        synopses: synopses,
      };
      const blob = new Blob([JSON.stringify(data, null, 2)], {type:'application/json'});
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `${novel.title || '小说'}-章节简介.json`;
      a.click();
      URL.revokeObjectURL(a.href);
    } else {
      let txt = `${novel.title || '小说'} - 章节简介\n${'='.repeat(40)}\n\n`;
      synopses.forEach((s, i) => {
        txt += `=== 第${i+1}章 ===\n${s || ''}\n\n`;
      });
      const blob = new Blob([txt], {type:'text/plain;charset=utf-8'});
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `${novel.title || '小说'}-章节简介.txt`;
      a.click();
      URL.revokeObjectURL(a.href);
    }
    this.toast('章节简介已导出', 'success');
  },

  // 导入章节简介
  importChapterSynopses(novelId, file){
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try{
          const data = JSON.parse(e.target.result);
          if(data.type !== 'lingbi-synopses') throw new Error('不是有效的章节简介文件');
          const novel = this.library.find(n => n.id === novelId) || (this.currentNovel && this.currentNovel.id === novelId ? this.currentNovel : null);
          if(!novel) throw new Error('未找到目标小说');
          novel.synopses = data.synopses || [];
          this.saveToLibrary(novel);
          this.toast('章节简介导入成功', 'success');
          resolve(novel);
        }catch(err){
          reject(err);
        }
      };
      reader.onerror = () => reject(new Error('文件读取失败'));
      reader.readAsText(file);
    });
  },

  // 从 JSON 文件导入配置
  importConfigFile(file){
    return new Promise((resolve, reject)=>{
      const reader = new FileReader();
      reader.onload = (e)=>{
        try{
          const data = JSON.parse(e.target.result);
          if(data.type !== 'lingbi-config') throw new Error('不是有效的灵笔配置文件');
          this.mode = data.mode || 'api';
          this.config = data.config || {base:'',key:'',model:''};
          if(data.models) this.models = data.models;
          if(data.defaultModelId) this.defaultModelId = data.defaultModelId;
          if(data.writingParams) Object.assign(this.writingParams, data.writingParams);
          if(data.constraintConfig) Object.assign(this.constraintConfig, data.constraintConfig);
          if(data.wpCollapsed) this.wpCollapsed = data.wpCollapsed;
          this.saveConfig();
          resolve(true);
        }catch(err){ reject(err); }
      };
      reader.onerror = ()=>reject(new Error('文件读取失败'));
      reader.readAsText(file);
    });
  },

  // ===== 书架管理 =====
  // 数据流向：仅从后端数据库加载，不再读取 localStorage
  async loadLibrary(){
    try{
      const res = await fetch('/api/library');
      const json = await res.json();
      if(json.ok && json.data && Array.isArray(json.data)){
        this.library = json.data;
      }
    }catch(e){
      console.error('[store] 从数据库加载书架失败', e);
    }
  },

  saveLibrary(){
    // 异步写数据库（唯一持久化路径）
    this._syncToServer();
  },

  // 异步保存书架到后端数据库
  // 优化：先尝试单本 PUT（减少传输量），失败则回退到整库 PUT
  // 为什么：1000 章小说约 2MB，每次保存都传整个书架是 O(n²) 瓶颈
  async _syncToServer(){
    try{
      // 优先使用单本 PUT
      const lastNovel = this._lastSavedNovel;
      if(lastNovel){
        await fetch('/api/library/' + lastNovel.id, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(lastNovel),
          keepalive: true,
        });
        this._lastSavedNovel = null;
        return;
      }
      // 回退：整库 PUT
      await fetch('/api/library', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ library: this.library }),
        keepalive: true,
      });
    }catch(e){
      console.error('[store] 书架保存到数据库失败', e);
    }
  },

  // 保存当前小说到书架
  // 记忆系统数据（novel.memory）随 novel 对象一起序列化持久化
  saveToLibrary(novel){
    if(!novel) return;
    const existing = this.library.find(b => b.id === novel.id);
    const novelCopy = JSON.parse(JSON.stringify(novel));
    if(existing){
      // 更新已有 — 深拷贝确保记忆数据完整保存
      Object.assign(existing, novelCopy);
    }else{
      // 新增
      this.library.unshift(novelCopy);
    }
    // 标记待保存的单本，_syncToServer 会用单本 PUT 接口
    this._lastSavedNovel = novelCopy;
    this.saveLibrary();
  },

  // 从书架删除
  removeFromLibrary(id){
    const idx = this.library.findIndex(b => b.id === id);
    if(idx >= 0){
      this.library.splice(idx, 1);
      this.saveLibrary();
    }
  },

  // 从书架打开小说
  // 深拷贝确保书架数据不被意外修改，同时恢复记忆引擎状态
  openFromLibrary(id){
    const novel = this.library.find(b => b.id === id);
    if(novel){
      this.currentNovel = JSON.parse(JSON.stringify(novel));
      this.currentChap = 0;
      // 确保记忆数据完整恢复
      if(this.currentNovel.memory){
        MemoryEngine.init(this.currentNovel);
      }
      return true;
    }
    return false;
  },

  // ===== Toast =====
  toast(msg, type){
    const id = Date.now() + Math.random();
    this.toasts.push({ id, msg, type: type||'' });
    setTimeout(()=>{
      const idx = this.toasts.findIndex(t => t.id === id);
      if(idx >= 0) this.toasts.splice(idx, 1);
    }, 2800);
  },

  // ===== 初始化 =====
  // 为什么 async：数据从数据库加载，必须在 Vue 挂载前完成，否则组件看到空数据
  async init(){
    await Promise.all([
      this.loadConfig(),
      this.loadLibrary(),
    ]);
    // P2-2: 加载统计数据
    try{ await StatsTracker.load(); }catch(e){}
    // P2-1: 加载作者画像
    try{ await AuthorProfile.load(); }catch(e){}
    this.loading = false;

    // 页面关闭/切换时强制同步数据到后端
    // 为什么用 pagehide 而非 beforeunload：pagehide 在移动端更可靠，且不会被弹窗阻塞
    window.addEventListener('pagehide', () => {
      if(this.library.length > 0) this._syncToServer();
      this._syncConfigToServer();
    });
  },
});

// 导出常量供组件使用
window.CONST = { GENRES, STYLES, PLOT_MODES, ENDING_STYLES, EXAMPLES, PRESETS, STYLE_VECTORS, VOLUME_PRESETS, TARGET_READERS, WORKSHOP_PLOT_PATTERNS, WORKSHOP_ENDING_STYLES, PROTAGONIST_TEMPLATES };
window.store = store;
