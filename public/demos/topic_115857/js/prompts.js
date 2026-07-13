const Prompts = {
  system: `你是一位专业的漫剧创作助手，擅长帮助用户创作漫画/动画剧本和内容。
请用中文回答，语言生动有趣，符合漫剧创作的风格。
输出内容要结构清晰，分点明确，方便用户直接使用。`,

  story_idea: {
    name: '题材定位建议',
    description: '输入你的想法，AI帮你分析方向',
    system: '你是一位资深漫剧策划，擅长分析市场趋势和题材定位。',
    template: `请帮我分析一下漫剧题材方向。

我的想法是：{{user_input}}

请帮我：
1. 分析这个题材的市场前景
2. 推荐3-5个具体的细分方向
3. 分析每个方向的受众群体
4. 给出你的最终建议`
  },

  world_building: {
    name: '世界观设定',
    description: '生成完整的世界观设定',
    system: '你是一位世界观设定专家，擅长构建丰富有趣的故事世界。',
    template: `请帮我设计一个漫剧的世界观设定。

题材：{{user_input}}

请详细设定以下内容：
1. 时代背景与地理环境
2. 社会结构与权力体系
3. 特殊设定（如果有，比如超能力、系统、穿越规则等）
4. 主要势力/阵营
5. 重要地点
6. 常见的生活细节（增强代入感）

请用清晰的结构输出，方便直接使用。`
  },

  character: {
    name: '人物设定',
    description: '生成角色设定表',
    system: '你是一位角色设计专家，擅长塑造有魅力的漫画角色。',
    template: `请帮我设计漫剧的主要角色。

故事背景：{{user_input}}

请设计：
1. 男主角（姓名、年龄、外貌、性格、身份、背景、口头禅、标志性动作）
2. 女主角（姓名、年龄、外貌、性格、身份、背景、口头禅、标志性动作）
3. 2-3个重要配角
4. 人物关系图

每个角色的外貌描述要详细，方便AI绘画生成。包括发型、发色、眼睛、体型、常穿服装等。`
  },

  outline: {
    name: '故事大纲',
    description: '生成完整故事大纲',
    system: '你是一位编剧，擅长写有吸引力的故事大纲。',
    template: `请帮我写一个漫剧的故事大纲。

题材：{{user_input}}
主角设定：
{{character_info}}

请写出：
1. 一句话概括整个故事
2. 核心主题
3. 开端（第1-3集）：如何开篇，如何引入人物和设定
4. 发展（第4-15集）：主要冲突和感情线发展
5. 高潮（第16-18集）：最大的危机
6. 结局（第19-20集）：如何收尾

注意要有起承转合，有悬念，有爽点。`
  },

  episode_outline: {
    name: '分集梗概',
    description: '把大纲拆成分集剧情',
    system: '你是一位分集编剧，擅长设计每集的看点和钩子。',
    template: `请帮我把故事大纲拆成分集梗概。

故事大纲：
{{outline}}

总集数：{{total_episodes}}集

请为每一集写：
- 集数和标题
- 100-200字的本集主要内容
- 本集的看点/爽点
- 本集结尾的悬念（钩子）

注意节奏，每集都要有吸引人的点，结尾一定要留悬念让观众想看下一集。`
  },

  script: {
    name: '详细剧本',
    description: '生成分镜用的详细剧本',
    system: '你是一位专业漫画编剧，擅长写画面感强的剧本。',
    template: `请帮我写一集漫剧的详细剧本。

人物设定：
{{character_info}}

本集梗概：
{{episode_summary}}

请写出完整的剧本，格式要求：
【场景】场景名 时间 内/外
人物：xxx、xxx

（环境描述和画面氛围）

（角色动作/表情）
角色名：台词内容

（角色动作/表情）
角色名：台词内容

【转场】淡入淡出/切镜/闪白

【场景】下一个场景...

注意：
1. 台词要符合人物性格
2. 动作描述要具体，方便画分镜
3. 重要的情绪和细节用括号标注
4. 画面感要强，读者能脑补出画面`
  },

  shot_list: {
    name: '镜头拆解',
    description: '把剧本拆成镜头清单',
    system: '你是一位分镜师，擅长把剧本拆成有节奏感的镜头。',
    template: `请帮我把下面的剧本拆解成分镜镜头清单。

剧本：
{{script}}

请逐段拆解，每个镜头列出：
- 镜号
- 景别（远景/全景/中景/近景/特写）
- 镜头角度（平视/仰视/俯视/侧视）
- 镜头运动（固定/推/拉/摇/移）
- 画面内容描述
- 台词/音效
- 预估时长（秒）
- 备注（特殊效果等）

注意节奏：
- 对话场景多用中近景和特写切换
- 情绪激动时镜头要短、切换要快
- 重要场景可以给长一点的时间
- 开场和结尾要有全景交代环境`
  },

  storyboard_desc: {
    name: '分镜画面描述',
    description: '生成每个镜头的详细画面描述',
    system: '你是一位资深分镜师，擅长用文字描述生动的画面。',
    template: `请为下面的分镜镜头写详细的画面描述，要具体到可以直接用来AI绘画。

镜头信息：
{{shot_info}}

角色参考：
{{character_info}}

请详细描述：
1. 画面构图（人物位置、背景、前景）
2. 角色的姿势、表情、动作细节
3. 光影效果（光源方向、明暗对比）
4. 色彩基调
5. 画面风格（日漫/国漫/写实等）

描述要详细但有条理，适合作为AI绘画的提示词使用。`
  },

  character_art: {
    name: '角色绘画提示词',
    description: '生成角色AI绘画的英文提示词',
    system: '你是一位AI绘画提示词专家，擅长写高质量的Midjourney/Stable Diffusion提示词。',
    template: `请根据下面的角色设定，生成一组AI绘画用的英文提示词。

角色设定：
{{character_info}}

请生成：
1. 正面全身像的提示词
2. 侧面像的提示词
3. 面部特写的提示词
4. 不同表情的版本（微笑、生气、惊讶、悲伤等）

每组提示词包含：
- 主体描述（人物外貌、服装、姿势、表情）
- 风格描述（anime style, manhua style等）
- 画质描述（masterpiece, best quality, highly detailed等）
- 光影描述
- 背景描述
- 负面提示词（不需要的元素）

请用英文输出，格式清晰。`
  },

  scene_art: {
    name: '场景绘画提示词',
    description: '生成场景AI绘画的英文提示词',
    system: '你是一位AI绘画提示词专家，擅长写高质量的场景提示词。',
    template: `请根据下面的场景描述，生成AI绘画用的英文提示词。

场景描述：
{{scene_desc}}

风格：动漫/国漫风格

请生成：
1. 白天版本的提示词
2. 夜晚版本的提示词（如果需要）

每组提示词包含：
- 场景主体描述
- 时间/天气/光线
- 风格描述（anime background, studio ghibli style等）
- 画质描述（masterpiece, best quality, highly detailed, 8k等）
- 光影氛围描述
- 构图描述
- 负面提示词

请用英文输出。`
  },

  optimize: {
    name: '内容优化',
    description: '润色优化已有内容',
    system: '你是一位内容编辑，擅长优化和润色文字内容。',
    template: `请帮我优化下面的内容，让它更好。

内容类型：{{content_type}}
原始内容：
{{user_input}}

请优化：
1. 让语言更生动有趣
2. 结构更清晰
3. 补充细节让内容更丰富
4. 保持原意的基础上提升质量

请直接输出优化后的内容。`
  },

  general: {
    name: '自由问答',
    description: '任何漫剧相关问题都可以问',
    system: '你是一位漫剧创作导师，有丰富的制作经验。',
    template: `用户的问题：{{user_input}}

请用专业但易懂的方式回答，给出实用的建议。
如果是技术问题，尽量给出具体的操作步骤。`
  },

  buildPrompt(promptType, variables) {
    const promptConfig = this[promptType];
    if (!promptConfig) return variables.user_input || '';
    
    let template = promptConfig.template;
    
    Object.keys(variables).forEach(key => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      template = template.replace(regex, variables[key] || '');
    });
    
    return template;
  },

  buildMessages(promptType, variables) {
    const promptConfig = this[promptType];
    if (!promptConfig) {
      return [
        { role: 'system', content: this.system },
        { role: 'user', content: variables.user_input || '' }
      ];
    }
    
    const userContent = this.buildPrompt(promptType, variables);
    
    return [
      { role: 'system', content: promptConfig.system || this.system },
      { role: 'user', content: userContent }
    ];
  },

  getPromptList() {
    return Object.keys(this)
      .filter(key => typeof this[key] === 'object' && this[key].name)
      .map(key => ({
        id: key,
        name: this[key].name,
        description: this[key].description
      }));
  }
};
