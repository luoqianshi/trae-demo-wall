const WorkflowData = {
  phases: [
    {
      id: 'writing',
      name: '编剧阶段',
      icon: 'fa-pen-fancy',
      color: '#FF69B4',
      description: '从零开始构思故事，完成从题材到完整剧本的创作',
      tasks: [
        {
          id: 'writing-1',
          name: '确定题材与风格',
          shortDesc: '选择故事类型和整体风格',
          description: '先想清楚你要做什么类型的漫剧，是甜宠都市还是古风玄幻？风格是搞笑还是治愈？这决定了后面所有环节的方向。',
          whyImportant: '题材和风格是漫剧的灵魂，选对了就能吸引精准的观众，选错了后面再努力也很难出彩。',
          steps: [
            '列出你感兴趣的3-5个题材方向',
            '去抖音/快手上看看同类型爆款数据',
            '选一个你既喜欢又有市场的方向'
          ],
          tools: ['chatgpt', 'douyin'],
          promptType: 'story_idea',
          output: '题材定位文档（100-200字）',
          outputExample: '【题材】都市甜宠\n【风格】轻松搞笑+治愈\n【目标受众】18-30岁女性\n【核心卖点】..."'
        },
        {
          id: 'writing-2',
          name: '核心世界观设定',
          shortDesc: '构建故事的世界背景',
          description: '你的故事发生在什么样的世界里？是现代都市还是架空古代？有没有特殊的设定比如穿越、系统、重生？把这些规则想清楚。',
          whyImportant: '好的世界观能让观众快速代入，也为后续剧情发展提供合理的框架。',
          steps: [
            '确定时代背景（现代/古代/未来/架空）',
            '设定世界的特殊规则（如果有）',
            '想好故事发生的主要场景'
          ],
          tools: ['chatgpt'],
          promptType: 'world_building',
          output: '世界观设定文档',
          outputExample: '【时代背景】现代都市\n【特殊设定】女主能看到他人的好感度\n【主要场景】公司、咖啡厅、男主家...'
        },
        {
          id: 'writing-3',
          name: '主要人物设定',
          shortDesc: '设计主角和重要配角',
          description: '给你的主角们设计好外貌、性格、背景故事，他们长什么样？什么性格？有什么过往经历？越详细越好。',
          whyImportant: '人物是观众追更的动力，讨喜的人设比剧情还重要。',
          steps: [
            '设计男主角：外貌、性格、身份、口头禅',
            '设计女主角：外貌、性格、身份、口头禅',
            '设计2-3个重要配角',
            '想好人物之间的关系'
          ],
          tools: ['chatgpt', 'midjourney'],
          promptType: 'character',
          output: '人物设定表（每人200-300字）',
          outputExample: '【姓名】林小满\n【年龄】24岁\n【外貌】齐肩短发，圆眼睛，笑起来有梨涡\n【性格】乐观开朗，有点迷糊但很努力\n【身份】..."'
        },
        {
          id: 'writing-4',
          name: '故事大纲',
          shortDesc: '梳理起承转合的主线',
          description: '把整个故事的主线想清楚：开头怎么引入？中间有什么冲突？高潮是什么？结局怎么样？有一条清晰的故事线。',
          whyImportant: '大纲是后面所有创作的蓝图，没有大纲容易写着写着就跑偏了。',
          steps: [
            '写一句话概括整个故事',
            '拆分成开头、发展、高潮、结局四部分',
            '每部分用3-5句话描述主要情节'
          ],
          tools: ['chatgpt'],
          promptType: 'outline',
          output: '故事大纲（500-800字）',
          outputExample: '【一句话概述】普通女孩意外获得读心能力，与高冷总裁上演欢喜冤家...\n\n【开头】林小满是个普通白领，一次意外后...\n【发展】...'
        },
        {
          id: 'writing-5',
          name: '分集剧情梗概',
          shortDesc: '把故事拆成一集一集',
          description: '按照你计划的集数，把大纲拆分成每集的主要内容。每集要有一个小高潮，结尾留个小钩子让观众想看下一集。',
          whyImportant: '漫剧是按更的，每集都要有看点才能留住观众。',
          steps: [
            '确定总集数（建议先做10-20集）',
            '给每集写一个标题',
            '用100-200字写清楚每集发生了什么',
            '确保每集结尾都有悬念'
          ],
          tools: ['chatgpt'],
          promptType: 'episode_outline',
          output: '分集梗概文档',
          outputExample: '第1集：意外的相遇\n林小满第一天上班就迟到了，慌慌张张撞到了新总裁...结尾：她发现自己能听到总裁心里在想什么？\n\n第2集：...'
        },
        {
          id: 'writing-6',
          name: '详细剧本',
          shortDesc: '写出完整的对白和动作',
          description: '把每一集的内容写成详细的剧本，包括角色的对白、动作、表情、场景描述。这是后面分镜和绘画的直接依据。',
          whyImportant: '剧本越详细，后面分镜和绘画越省心，质量也越有保障。',
          steps: [
            '先写场景说明（时间、地点、环境）',
            '写角色的动作和表情',
            '写对白（要符合人物性格）',
            '标注需要的特效或特殊画面'
          ],
          tools: ['chatgpt'],
          promptType: 'script',
          output: '完整剧本（每集约800-1500字）',
          outputExample: '【场景】公司电梯 日 内\n\n人物：林小满、顾辰\n\n（电梯门缓缓打开，林小满抱着文件冲进来，没注意到里面有人）\n\n林小满：（低着头道歉）对不起对不起！\n\n（抬头看到顾辰，愣住）\n\n顾辰：（面无表情）...'
        }
      ]
    },
    {
      id: 'storyboard',
      name: '分镜阶段',
      icon: 'fa-layer-group',
      color: '#9B59B6',
      description: '把文字剧本变成一个个镜头画面的设计',
      tasks: [
        {
          id: 'storyboard-1',
          name: '剧本拆解为镜头',
          shortDesc: '把剧本拆成一个个画面',
          description: '仔细读剧本，把每一段剧情都拆成具体的镜头。比如一句话对话可能需要2-3个镜头来回切。',
          whyImportant: '镜头拆解直接影响最终的观看体验，好的分镜能让故事更有张力。',
          steps: [
            '通读一遍剧本，在脑中脑补画面',
            '按剧情顺序列出所有镜头',
            '给每个镜头编个号',
            '预估每个镜头的时长'
          ],
          tools: ['chatgpt'],
          promptType: 'shot_list',
          output: '镜头清单',
          outputExample: '镜头1：全景 公司大楼外景 2秒\n镜头2：中景 电梯内 3秒\n镜头3：特写 林小满慌张的脸 1.5秒\n镜头4：近景 顾辰面无表情 2秒\n...'
        },
        {
          id: 'storyboard-2',
          name: '设计每个镜头的构图',
          shortDesc: '设计画面怎么拍',
          description: '给每个镜头设计画面：是全景还是特写？人物在画面什么位置？镜头是静止的还是移动的？角度是俯视还是仰视？',
          whyImportant: '构图决定了画面好不好看、有没有氛围感，也影响观众的情绪。',
          steps: [
            '确定景别（远景/全景/中景/近景/特写）',
            '确定镜头角度（平视/俯视/仰视/侧视）',
            '确定镜头运动（固定/推/拉/摇/移）',
            '简单画一下构图示意图'
          ],
          tools: ['midjourney'],
          promptType: 'storyboard_desc',
          output: '分镜脚本（带图或文字描述）',
          outputExample: '镜头3：\n景别：特写\n角度：平视\n画面：林小满眼睛瞪大，嘴巴微张，脸上写满惊讶。背景虚化。\n光线：自然光，柔和...'
        },
        {
          id: 'storyboard-3',
          name: '确定镜头时长与节奏',
          shortDesc: '安排每个镜头多长时间',
          description: '根据剧情的节奏，给每个镜头设定时长。紧张的地方镜头短一点，抒情的地方镜头长一点。',
          whyImportant: '节奏把控得好，观众看得才过瘾，不会觉得拖沓或者太快看不懂。',
          steps: [
            '估算每集总时长（建议1-3分钟）',
            '给每个镜头分配时长',
            '检查整体节奏：紧张的段落镜头要快',
            '重要的情绪镜头给够时间'
          ],
          tools: [],
          promptType: null,
          output: '时间轴（每集总时长+各镜头时长）',
          outputExample: '第1集 总时长：2分30秒\n\n0:00-0:05 开场（镜头1-2）\n0:05-0:15 相遇（镜头3-8）\n0:15-0:30 发现能力（镜头9-15）\n...'
        },
        {
          id: 'storyboard-4',
          name: '标注特效与转场',
          shortDesc: '想好哪里加特效和转场',
          description: '标注哪些地方需要加特效（比如心里活动的气泡、回忆的滤镜、闪回效果），以及镜头之间怎么转场。',
          whyImportant: '适当的特效和转场能提升质感，但太多也会花哨，提前规划好。',
          steps: [
            '标记需要特效的镜头（标注特效类型）',
            '设计转场方式（淡入淡出/闪白/推拉/匹配剪辑）',
            '考虑回忆/想象画面的视觉风格'
          ],
          tools: [],
          promptType: null,
          output: '特效与转场说明',
          outputExample: '镜头5→6：淡入淡出转场\n镜头12：加好感度数字悬浮特效\n镜头18：回忆画面用暖色调复古滤镜\n...'
        },
        {
          id: 'storyboard-5',
          name: '分镜审核与调整',
          shortDesc: '检查一遍整体效果',
          description: '把所有镜头按顺序过一遍，看看故事讲不讲得清楚，节奏合不合理，有没有遗漏的重要画面。',
          whyImportant: '现在改还容易，等画完了再改就麻烦了。',
          steps: [
            '按顺序看一遍所有分镜',
            '检查剧情是否连贯',
            '调整节奏和镜头数量',
            '最终确认分镜稿'
          ],
          tools: [],
          promptType: null,
          output: '最终分镜稿',
          outputExample: '确认无误的完整分镜文档'
        }
      ]
    },
    {
      id: 'drawing',
      name: '绘画阶段',
      icon: 'fa-palette',
      color: '#E74C3C',
      description: '用AI生成所有需要的画面素材',
      tasks: [
        {
          id: 'drawing-1',
          name: '角色形象定稿',
          shortDesc: '确定主角们长什么样',
          description: '先用AI生成主要角色的形象图，多角度多表情测试，选一个最满意的版本作为标准，后面所有画面都要保持一致。',
          whyImportant: '角色形象是漫剧的门面，好不好看直接决定观众愿不愿意点进来。',
          steps: [
            '写好角色描述词（外貌、发型、服装、风格）',
            '用AI生成多个版本',
            '选出最满意的一张作为标准图',
            '生成不同角度和表情的参考图'
          ],
          tools: ['midjourney', 'jimeng'],
          promptType: 'character_art',
          output: '角色设计图（每人3-5张）',
          outputExample: '女主林小满标准形象：齐肩棕色短发，齐刘海，圆眼睛，粉色连衣裙...\n包含：正面、侧面、微笑、生气、惊讶等版本'
        },
        {
          id: 'drawing-2',
          name: '场景背景绘制',
          shortDesc: '画故事发生的场景',
          description: '根据剧本里的场景，生成需要的背景图。比如公司、家、咖啡厅、街道等。不同时间段（白天/晚上/黄昏）也分开做。',
          whyImportant: '好看的背景能大大提升漫剧的质感和代入感。',
          steps: [
            '列出所有需要的场景',
            '给每个场景写描述词',
            'AI生成并挑选最合适的',
            '按场景分类保存好'
          ],
          tools: ['midjourney', 'jimeng'],
          promptType: 'scene_art',
          output: '场景图（每个场景1-3张）',
          outputExample: '场景列表：\n1. 现代公司大楼外景（日景/夜景）\n2. 总裁办公室（白天/黄昏）\n3. 普通工位\n4. 咖啡厅...'
        },
        {
          id: 'drawing-3',
          name: '道具与元素设计',
          shortDesc: '画一些特殊道具',
          description: '如果故事里有重要的道具或者特殊元素（比如手机、礼物、信物、特效元素），也单独生成好。',
          whyImportant: '重要道具可能反复出现，提前做好能保持一致性。',
          steps: [
            '梳理剧本中的重要道具',
            '逐个生成道具图',
            '考虑不同角度和状态'
          ],
          tools: ['midjourney'],
          promptType: null,
          output: '道具图',
          outputExample: '1. 女主的粉色手机壳\n2. 定情信物：银色项链\n3. 好感度数字特效样式...'
        },
        {
          id: 'drawing-4',
          name: '分镜画面逐帧生成',
          shortDesc: '按分镜生成每一张图',
          description: '按照分镜表，一张一张地生成所有需要的画面。注意保持人物形象一致，画风统一。',
          whyImportant: '这是最耗时但也最重要的一步，画面质量直接决定漫剧质量。',
          steps: [
            '从第一个镜头开始',
            '结合角色+场景+动作写提示词',
            '用图生图保证人物一致性',
            '生成后检查并调整',
            '按镜头编号命名保存'
          ],
          tools: ['midjourney', 'jimeng'],
          promptType: 'frame_art',
          output: '逐帧插画（按分镜数量）',
          outputExample: '第1集所有镜头的画面文件，按 shot_001.jpg, shot_002.jpg... 命名'
        },
        {
          id: 'drawing-5',
          name: '画面一致性调整',
          shortDesc: '统一画风和人物',
          description: '把所有生成的图放在一起对比，看看人物长相有没有变，画风有没有差太多。有问题的图重新生成或者修一下。',
          whyImportant: '人物变脸是AI漫剧最容易翻车的地方，一定要检查。',
          steps: [
            '把同一个角色的所有图放在一起对比',
            '标记出差异太大的图',
            '用图生图重新生成有问题的图',
            '统一调色和滤镜'
          ],
          tools: ['photoshop'],
          promptType: null,
          output: '修正后的画面',
          outputExample: '调整后的所有画面文件'
        },
        {
          id: 'drawing-6',
          name: '抠图与分层处理',
          shortDesc: '把人物从背景中分离',
          description: '如果后面要做动效（比如人物移动、镜头推拉），需要把人物和背景分开。用抠图工具把人物抠出来。',
          whyImportant: '分层素材是做动态效果的基础，不分层就只能做简单的缩放平移。',
          steps: [
            '用抠图工具把人物抠出来',
            '检查边缘是否干净',
            '保存为PNG透明背景',
            '人物和背景分层存放'
          ],
          tools: ['removebg', 'photoshop'],
          promptType: null,
          output: '分层素材（人物PNG + 背景图）',
          outputExample: 'characters/ 文件夹：人物PNG图\nbackgrounds/ 文件夹：背景图'
        }
      ]
    },
    {
      id: 'dubbing',
      name: '配音阶段',
      icon: 'fa-microphone',
      color: '#3498DB',
      description: '给画面配上声音：对白、音乐、音效',
      tasks: [
        {
          id: 'dubbing-1',
          name: '角色声音设定',
          shortDesc: '确定每个角色的声音',
          description: '给每个角色选一个合适的声音。女主是甜美的还是活泼的？男主是低沉的还是清冷的？先试听几个AI声线选好。',
          whyImportant: '声音是塑造角色的重要部分，合适的配音能让角色活起来。',
          steps: [
            '列出所有有台词的角色',
            '去AI配音平台试听不同声线',
            '给每个角色选定一个声线',
            '记录下声线名称和参数'
          ],
          tools: ['doubao_tts', 'xunfei_tts'],
          promptType: null,
          output: '声线方案表',
          outputExample: '林小满：豆包-甜美女声，语速1.0，语调1.1\n顾辰：讯飞-磁性男声，语速0.9，语调0.9\n...'
        },
        {
          id: 'dubbing-2',
          name: '对白配音生成',
          shortDesc: '把台词变成声音',
          description: '把剧本里的每句对白都用AI生成配音。注意控制好语速、语气、停顿，让配音听起来自然。',
          whyImportant: '配音质量直接影响观看体验，太生硬会让人出戏。',
          steps: [
            '把台词按角色分好',
            '逐句生成配音',
            '听一下效果，不行就重生成',
            '按角色和集数整理好音频文件'
          ],
          tools: ['doubao_tts', 'xunfei_tts', 'elevenlabs'],
          promptType: null,
          output: '配音文件（每句一个音频或整集一个）',
          outputExample: '第1集音频文件夹：\nlin_001.mp3\ngu_001.mp3\nlin_002.mp3\n...'
        },
        {
          id: 'dubbing-3',
          name: '背景音乐选择',
          shortDesc: '选合适的BGM',
          description: '根据剧情的情绪选背景音乐。甜的地方用甜的音乐，紧张的地方用紧张的音乐，悲伤的地方用悲伤的。',
          whyImportant: '音乐是情绪的催化剂，好的BGM能让观众更容易代入。',
          steps: [
            '列出需要音乐的情绪段落',
            '去音乐平台找合适的BGM',
            '选3-5首备用',
            '注意版权问题！'
          ],
          tools: ['suno', 'udio', 'aigei'],
          promptType: null,
          output: 'BGM素材包',
          outputExample: 'bgm/ 文件夹：\nhappy.mp3（欢快场景）\nromantic.mp3（甜蜜场景）\ntension.mp3（紧张场景）\n...'
        },
        {
          id: 'dubbing-4',
          name: '音效素材收集',
          shortDesc: '找各种音效',
          description: '收集需要的音效：脚步声、开门声、手机铃声、心跳声、笑声等等。这些细节能让漫剧更真实。',
          whyImportant: '音效是容易被忽视但非常重要的细节，有了音效画面才会"活"。',
          steps: [
            '过一遍剧本，标记需要的音效',
            '去音效网站下载',
            '按类型分类保存'
          ],
          tools: ['aigei', 'freesound'],
          promptType: null,
          output: '音效素材包',
          outputExample: 'sfx/ 文件夹：\ndoor_open.mp3\nphone_ring.mp3\nheartbeat.mp3\nlaugh.mp3\n...'
        },
        {
          id: 'dubbing-5',
          name: '音频初步混音',
          shortDesc: '把声音素材初步拼一下',
          description: '把对白、BGM、音效放在一起听听效果，调整一下音量比例，看看有没有问题。',
          whyImportant: '先混一遍能提前发现问题，比如某句配音听不清、音乐太大声盖过人声。',
          steps: [
            '把所有音频导入剪辑软件',
            '对好台词的时间位置',
            '调整音量：人声最响，BGM次之，音效最小',
            '整体听一遍'
          ],
          tools: ['audacity', 'premiere'],
          promptType: null,
          output: '初步混音文件',
          outputExample: 'episode_01_mix_v1.mp3'
        }
      ]
    },
    {
      id: 'editing',
      name: '剪辑阶段',
      icon: 'fa-film',
      color: '#F39C12',
      description: '把画面和声音合成最终的视频',
      tasks: [
        {
          id: 'editing-1',
          name: '素材导入与整理',
          shortDesc: '把所有素材导入剪辑软件',
          description: '把画好的图片、配好的音频都导入到剪辑软件里，按类别整理好，方便后面用。',
          whyImportant: '素材整理好了，剪辑的时候才不会乱找，效率高很多。',
          steps: [
            '新建剪辑项目',
            '导入所有图片素材',
            '导入所有音频素材（配音/BGM/音效）',
            '建立文件夹分类整理'
          ],
          tools: ['jianying', 'premiere'],
          promptType: null,
          output: '整理好的剪辑项目工程',
          outputExample: '项目文件：manhua_ep01.prproj / manhua_ep01.jianying'
        },
        {
          id: 'editing-2',
          name: '画面动效制作',
          shortDesc: '让画面动起来',
          description: '给静态的图片加上动态效果。比如镜头慢慢推进、人物从左移到右、放大缩小、转场效果等。让画面不那么死板。',
          whyImportant: '漫剧是"动"的漫画，动效做得好就像真的在看动画一样。',
          steps: [
            '按分镜顺序把图片放到时间轴上',
            '给每个镜头设置时长',
            '加基础动效：推拉摇移',
            '加转场效果（淡入淡出、闪白等）',
            '有分层素材的可以做更复杂的动效'
          ],
          tools: ['jianying', 'premiere', 'aftereffects'],
          promptType: null,
          output: '有动效的画面时间轴',
          outputExample: '时间轴上排好的图片序列，带动效'
        },
        {
          id: 'editing-3',
          name: '字幕制作与排版',
          shortDesc: '加上字幕',
          description: '把所有对白都做成字幕，选个好看的字体和颜色，放在画面合适的位置。重要的台词可以加特殊样式。',
          whyImportant: '很多人看视频是静音的，没有字幕等于没了一半观众。',
          steps: [
            '逐句添加字幕',
            '选好字体、大小、颜色',
            '统一字幕位置（一般在底部）',
            '重要台词可以用不同颜色或样式'
          ],
          tools: ['jianying', 'xunfei'],
          promptType: null,
          output: '带字幕的视频',
          outputExample: '时间轴上的字幕轨道'
        },
        {
          id: 'editing-4',
          name: '音画同步调整',
          shortDesc: '让声音和画面对上',
          description: '把配音、BGM、音效都放到时间轴上，和画面对齐。口型对不上的话调整一下画面时长或者音频位置。',
          whyImportant: '音画不同步是很低级但很影响体验的问题，一定要对上。',
          steps: [
            '把配音放到对应的位置',
            '检查口型和声音是否匹配',
            '加入BGM和音效',
            '调整音量平衡',
            '整体播放一遍检查'
          ],
          tools: ['jianying', 'premiere'],
          promptType: null,
          output: '音画同步的粗剪版',
          outputExample: 'episode_01_draft_v1.mp4'
        },
        {
          id: 'editing-5',
          name: '特效与调色',
          shortDesc: '加点特效和调色',
          description: '给视频加一些特效（比如闪光、震动、滤镜），整体调一下颜色，让画面更好看更有氛围感。',
          whyImportant: '调色和特效是提升质感的最后一步，调完整体会上一个档次。',
          steps: [
            '整体调色（亮度、对比度、饱和度）',
            '加滤镜统一色调',
            '在需要的地方加特效',
            '加片头片尾（如果有）'
          ],
          tools: ['jianying', 'aftereffects'],
          promptType: null,
          output: '精剪版视频',
          outputExample: 'episode_01_final_v1.mp4'
        },
        {
          id: 'editing-6',
          name: '最终渲染输出',
          shortDesc: '导出成片',
          description: '全部确认没问题后，设置好参数，渲染导出最终的视频文件。',
          whyImportant: '输出参数设置不对可能导致画质模糊或者文件太大。',
          steps: [
            '确认时间轴上没有问题',
            '设置导出参数（分辨率1080p、帧率30fps）',
            '选择输出格式（MP4）',
            '渲染导出',
            '看一遍导出的成片'
          ],
          tools: ['jianying', 'premiere'],
          promptType: null,
          output: '成片视频',
          outputExample: '第1集_最终版.mp4 （1080p, 30fps）'
        }
      ]
    },
    {
      id: 'publish',
      name: '发布运营',
      icon: 'fa-rocket',
      color: '#2ECC71',
      description: '把作品发出去，让更多人看到',
      tasks: [
        {
          id: 'publish-1',
          name: '平台选择与账号准备',
          shortDesc: '选平台，注册账号',
          description: '根据你的题材和目标受众，选择合适的发布平台。抖音、快手、小红书、B站、视频号，各有各的特点。',
          whyImportant: '选对平台很重要，不同平台的用户喜好不一样。',
          steps: [
            '了解各平台的特点和用户群',
            '选择1-2个主平台',
            '注册账号，完善资料',
            '研究同类型爆款账号'
          ],
          tools: ['douyin', 'kuaishou', 'xiaohongshu'],
          promptType: null,
          output: '账号与发布计划',
          outputExample: '主平台：抖音 + 快手\n账号名：XX漫剧\n简介：...\n更新频率：每周三、六更新'
        },
        {
          id: 'publish-2',
          name: '封面与标题设计',
          shortDesc: '做吸引人的封面和标题',
          description: '设计视频封面和标题，这是观众点不点进来的关键。封面要有冲击力，标题要勾起好奇心。',
          whyImportant: '封面和标题决定了点击率，内容再好没人点也白搭。',
          steps: [
            '从视频里选最精彩的一帧做封面底图',
            '加标题文字（大字、醒目）',
            '写3-5个标题备选',
            '参考同类型爆款的风格'
          ],
          tools: ['canva'],
          promptType: null,
          output: '封面图 + 标题文案',
          outputExample: '封面：ep01_cover.jpg\n标题备选：\n1. 意外获得读心术，竟听到总裁的心声是...\n2. 第一天上班就撞到新总裁，还发现了他的秘密！\n...'
        },
        {
          id: 'publish-3',
          name: '简介与话题标签',
          shortDesc: '写简介加话题',
          description: '写视频简介，加上相关的话题标签，可以让更多人刷到。',
          whyImportant: '好的话题标签能带来更多的自然流量。',
          steps: [
            '写1-2句简介',
            '选5-10个相关话题标签',
            '热门标签+垂直标签搭配'
          ],
          tools: [],
          promptType: null,
          output: '发布文案',
          outputExample: '简介：当普通女孩能听到高冷总裁的心声...\n\n话题：#漫剧 #甜宠 #都市 #读心术 #总裁 #二次元 #AI漫剧'
        },
        {
          id: 'publish-4',
          name: '定时发布',
          shortDesc: '选个好时间发出去',
          description: '选一个用户活跃的时间段发布。一般中午12-13点、晚上19-22点是流量高峰。',
          whyImportant: '发的时间不对，可能刚发就被淹没了。',
          steps: [
            '确定发布时间',
            '设置定时发布',
            '发布后第一时间自己点赞评论转发一下'
          ],
          tools: ['douyin', 'kuaishou'],
          promptType: null,
          output: '发布记录',
          outputExample: '第1集发布时间：周六晚20:00\n发布平台：抖音、快手'
        },
        {
          id: 'publish-5',
          name: '数据复盘',
          shortDesc: '看看数据怎么样',
          description: '发布后24小时、48小时看看数据：播放量、点赞、评论、收藏、转发、完播率。分析哪些好哪些不好，下一期改进。',
          whyImportant: '复盘才能进步，知道观众喜欢什么，后面越做越好。',
          steps: [
            '记录关键数据（播放、点赞、评论、完播率）',
            '看评论区观众的反馈',
            '分析哪个时间段掉粉多',
            '总结经验，下一期优化'
          ],
          tools: [],
          promptType: null,
          output: '数据复盘报告',
          outputExample: '第1集数据：\n播放量：12.5万\n点赞：8600\n评论：520\n完播率：45%\n\n观众反馈：...\n改进点：...'
        }
      ]
    }
  ],

  tools: [
    {
      id: 'chatgpt',
      name: 'ChatGPT',
      type: 'AI写作',
      category: 'writing',
      phases: ['writing', 'storyboard'],
      description: 'OpenAI的大模型，写剧本、想创意、问答都很强',
      features: ['剧本创作', '故事构思', '角色设定', '分镜脚本', '内容优化'],
      difficulty: 2,
      freeLevel: '部分免费',
      url: 'https://chat.openai.com',
      tutorial: '1. 打开官网注册登录\n2. 选一个模型（推荐GPT-4o）\n3. 在输入框输入你的需求\n4. 不满意可以让它改',
      tips: '写剧本时给的信息越详细，生成的质量越高。可以先给人设和大纲，再让它写具体内容。'
    },
    {
      id: 'claude',
      name: 'Claude',
      type: 'AI写作',
      category: 'writing',
      phases: ['writing', 'storyboard'],
      description: 'Anthropic的大模型，长文本和创意写作表现很好',
      features: ['长剧本创作', '世界观设定', '角色深度塑造', '风格统一'],
      difficulty: 2,
      freeLevel: '部分免费',
      url: 'https://claude.ai',
      tutorial: '1. 打开官网注册登录\n2. 新建一个对话\n3. 输入你的需求和参考资料\n4. 一步步引导它创作',
      tips: 'Claude特别擅长写很长的内容，可以一次性给很多参考资料，它能记住上下文。'
    },
    {
      id: 'deepseek',
      name: 'DeepSeek',
      type: 'AI写作',
      category: 'writing',
      phases: ['writing', 'storyboard'],
      description: '国产大模型，性价比高，中文理解好',
      features: ['中文剧本', '分镜拆解', '性价比高', '响应快'],
      difficulty: 2,
      freeLevel: '部分免费',
      url: 'https://www.deepseek.com',
      tutorial: '1. 打开官网注册登录\n2. 选择深度求索模型\n3. 输入你的需求\n4. 支持API调用',
      tips: '国产模型对中文网络梗和文化理解更好，写接地气的剧本效果不错。'
    },
    {
      id: 'midjourney',
      name: 'Midjourney',
      type: 'AI绘画',
      category: 'drawing',
      phases: ['drawing'],
      description: '最火的AI绘画工具，画风多样，质量高',
      features: ['角色设计', '场景绘制', '风格多变', '高质量画面'],
      difficulty: 3,
      freeLevel: '付费',
      url: 'https://www.midjourney.com',
      tutorial: '1. 需要科学上网\n2. 注册Discord账号\n3. 加入Midjourney服务器\n4. 在对话框输入 /imagine + 描述词\n5. 等它生成后可以选图细化',
      tips: '提示词要写得详细：主体+环境+风格+画质+比例。用图生图可以保持人物一致。'
    },
    {
      id: 'jimeng',
      name: '即梦AI',
      type: 'AI绘画',
      category: 'drawing',
      phases: ['drawing'],
      description: '字节跳动的AI绘画工具，国漫风格效果好，国内可用',
      features: ['国漫风格', '角色一致性', '图生图', '国内直接用'],
      difficulty: 2,
      freeLevel: '部分免费',
      url: 'https://jimeng.jianying.com',
      tutorial: '1. 打开官网或剪映里的即梦\n2. 选择AI绘画\n3. 输入描述词，选择风格\n4. 生成后可以继续优化',
      tips: '做国漫风格选即梦很合适，人物长得比较符合国人审美，而且国内访问方便。'
    },
    {
      id: 'dalle',
      name: 'DALL-E',
      type: 'AI绘画',
      category: 'drawing',
      phases: ['drawing'],
      description: 'OpenAI的绘画模型，跟ChatGPT配合好用',
      features: ['文字精准理解', '跟ChatGPT集成', '容易上手'],
      difficulty: 1,
      freeLevel: '部分免费',
      url: 'https://chat.openai.com',
      tutorial: '1. 在ChatGPT里选GPT-4o\n2. 直接说"帮我画一张..."\n3. 它会生成图片给你',
      tips: '适合新手，直接用自然语言描述就行，不用学复杂的提示词语法。'
    },
    {
      id: 'doubao_tts',
      name: '豆包TTS',
      type: 'AI配音',
      category: 'dubbing',
      phases: ['dubbing'],
      description: '字节的AI配音，声音自然，有很多情感声线',
      features: ['情感丰富', '多种声线', '中文自然', '免费额度'],
      difficulty: 1,
      freeLevel: '部分免费',
      url: 'https://www.doubao.com',
      tutorial: '1. 打开豆包\n2. 选择配音功能\n3. 输入文字，选好声音\n4. 生成并下载',
      tips: '豆包的情感配音做得不错，喜怒哀乐都能表现出来，适合做漫剧配音。'
    },
    {
      id: 'xunfei_tts',
      name: '讯飞配音',
      type: 'AI配音',
      category: 'dubbing',
      phases: ['dubbing'],
      description: '科大讯飞的语音合成，老牌技术，声音稳定',
      features: ['声音稳定', '多种方言', '语速可调', '企业级'],
      difficulty: 2,
      freeLevel: '部分免费',
      url: 'https://www.xfyun.cn',
      tutorial: '1. 注册讯飞开放平台\n2. 开通语音合成服务\n3. 在线使用或者API调用\n4. 下载音频',
      tips: '讯飞的声音很多很全，适合需要多种不同角色声音的情况。'
    },
    {
      id: 'elevenlabs',
      name: 'ElevenLabs',
      type: 'AI配音',
      category: 'dubbing',
      phases: ['dubbing'],
      description: '海外的AI配音，英文效果极佳，中文也在进步',
      features: ['超自然', '声音克隆', '多语言', '情感丰富'],
      difficulty: 2,
      freeLevel: '部分免费',
      url: 'https://elevenlabs.io',
      tutorial: '1. 打开官网注册\n2. 选择一个声音\n3. 输入文字生成\n4. 可以克隆自己的声音',
      tips: '英文配音首选，非常自然几乎听不出来是AI。中文也可以试试，但不如国产模型。'
    },
    {
      id: 'suno',
      name: 'Suno',
      type: 'AI音乐',
      category: 'dubbing',
      phases: ['dubbing'],
      description: 'AI生成歌曲和音乐，能写词作曲演唱一条龙',
      features: ['生成歌曲', '纯音乐BGM', '多种风格', '快速生成'],
      difficulty: 2,
      freeLevel: '部分免费',
      url: 'https://suno.com',
      tutorial: '1. 打开官网注册登录\n2. 输入风格和歌词描述\n3. 生成音乐\n4. 下载使用',
      tips: '要BGM的话描述里加上"instrumental"（纯音乐），还可以指定风格比如"lo-fi"、"piano"。'
    },
    {
      id: 'udio',
      name: 'Udio',
      type: 'AI音乐',
      category: 'dubbing',
      phases: ['dubbing'],
      description: '另一个AI音乐生成工具，质量也很高',
      features: ['高质量音乐', '风格多样', '可延长', '多轨'],
      difficulty: 2,
      freeLevel: '部分免费',
      url: 'https://udio.com',
      tutorial: '1. 注册登录\n2. 描述你想要的音乐\n3. 生成并下载',
      tips: '和Suno各有千秋，可以都试试，看哪个生成的更符合你的需求。'
    },
    {
      id: 'aigei',
      name: '爱给网',
      type: '素材库',
      category: 'dubbing',
      phases: ['dubbing'],
      description: '国内的音效素材网站，资源丰富',
      features: ['音效素材', 'BGM素材', '免费下载', '分类清晰'],
      difficulty: 1,
      freeLevel: '部分免费',
      url: 'https://www.aigei.com',
      tutorial: '1. 打开网站\n2. 搜索你需要的音效\n3. 预览一下\n4. 下载使用',
      tips: '找音效很方便，注意看清楚授权协议，商用的话可能需要付费。'
    },
    {
      id: 'freesound',
      name: 'Freesound',
      type: '素材库',
      category: 'dubbing',
      phases: ['dubbing'],
      description: '海外的免费音效社区，资源超多',
      features: ['海量音效', '免费', '用户上传', '分类全'],
      difficulty: 2,
      freeLevel: '免费',
      url: 'https://freesound.org',
      tutorial: '1. 注册账号\n2. 搜索音效关键词（英文）\n3. 预览下载\n4. 注意授权协议',
      tips: '音效非常全，但需要用英文搜索。注意看授权，有些需要署名。'
    },
    {
      id: 'jianying',
      name: '剪映',
      type: '视频剪辑',
      category: 'editing',
      phases: ['editing'],
      description: '字节的剪辑软件，免费好用，新手首选',
      features: ['免费', '易上手', '模板多', '手机电脑都能用', '自带即梦AI'],
      difficulty: 1,
      freeLevel: '免费',
      url: 'https://www.capcut.cn',
      tutorial: '1. 下载安装剪映专业版\n2. 新建项目，导入素材\n3. 拖到时间轴上编辑\n4. 加字幕、音乐、特效\n5. 导出',
      tips: '新手强烈推荐剪映！功能全还免费，很多漫剧博主都用它。手机端也能剪，很方便。'
    },
    {
      id: 'premiere',
      name: 'Premiere Pro',
      type: '视频剪辑',
      category: 'editing',
      phases: ['editing'],
      description: 'Adobe的专业剪辑软件，功能强大',
      features: ['专业级', '功能全', '跟Adobe全家桶配合', '稳定'],
      difficulty: 4,
      freeLevel: '付费',
      url: 'https://www.adobe.com/cn/products/premiere.html',
      tutorial: '1. 安装Adobe Creative Cloud\n2. 安装Premiere Pro\n3. 新建项目\n4. 导入素材开始剪辑',
      tips: '功能强大但学习曲线也陡，有基础了可以试试。配合After Effects做特效更强大。'
    },
    {
      id: 'aftereffects',
      name: 'After Effects',
      type: '特效合成',
      category: 'editing',
      phases: ['editing'],
      description: 'Adobe的特效软件，做动效和特效的神器',
      features: ['专业特效', '动效丰富', '模板多', '跟Pr联动'],
      difficulty: 5,
      freeLevel: '付费',
      url: 'https://www.adobe.com/cn/products/aftereffects.html',
      tutorial: '1. 安装AE\n2. 新建合成\n3. 导入素材做动效\n4. 渲染导出',
      tips: '想做高质量的漫剧动效，AE是必修课。网上有很多教程和模板可以学。'
    },
    {
      id: 'audacity',
      name: 'Audacity',
      type: '音频编辑',
      category: 'dubbing',
      phases: ['dubbing'],
      description: '免费开源的音频编辑软件',
      features: ['免费', '开源', '基础音频编辑', '插件多'],
      difficulty: 2,
      freeLevel: '免费',
      url: 'https://www.audacityteam.org',
      tutorial: '1. 下载安装\n2. 导入音频\n3. 剪辑、调整音量、加效果\n4. 导出',
      tips: '免费又好用的音频编辑工具，处理配音足够用了。'
    },
    {
      id: 'removebg',
      name: 'Remove.bg',
      type: '抠图工具',
      category: 'drawing',
      phases: ['drawing'],
      description: '一键抠图的在线工具',
      features: ['一键抠图', '在线使用', '效果好', '免费额度'],
      difficulty: 1,
      freeLevel: '部分免费',
      url: 'https://www.remove.bg',
      tutorial: '1. 打开网站\n2. 上传图片\n3. 自动抠图\n4. 下载透明背景图',
      tips: '抠人物效果很好，简单省事。免费版有分辨率限制，高清的需要付费。'
    },
    {
      id: 'photoshop',
      name: 'Photoshop',
      type: '图像处理',
      category: 'drawing',
      phases: ['drawing'],
      description: 'Adobe的图像处理软件，修图必备',
      features: ['专业修图', '精细抠图', '调色', '合成'],
      difficulty: 4,
      freeLevel: '付费',
      url: 'https://www.adobe.com/cn/products/photoshop.html',
      tutorial: '1. 安装PS\n2. 打开图片\n3. 用各种工具修图\n4. 保存',
      tips: '对画面质量要求高的话，PS还是最强大的。主要用来修脸、调色、精细抠图。'
    },
    {
      id: 'canva',
      name: 'Canva可画',
      type: '设计工具',
      category: 'publish',
      phases: ['publish'],
      description: '在线设计平台，做封面海报很方便',
      features: ['模板多', '易上手', '免费', '中文友好'],
      difficulty: 1,
      freeLevel: '部分免费',
      url: 'https://www.canva.cn',
      tutorial: '1. 打开网站注册\n2. 搜索"视频封面"模板\n3. 改字改图\n4. 下载',
      tips: '做封面很快，有很多现成的模板，改改文字和图就能用。'
    }
  ],

  templates: {
    writing: [
      {
        name: '人物设定表模板',
        content: `【姓名】
【年龄】
【性别】
【外貌】
  - 发型发色：
  - 眼睛：
  - 身高体型：
  - 常穿服装：
  - 标志性特征：
【性格】
  - 正面特点：
  - 负面特点：
  - 口头禅：
  - 习惯动作：
【身份背景】
  - 职业/身份：
  - 家庭背景：
  - 成长经历：
【人物关系】
  - 和男主/女主的关系：
  - 和其他角色的关系：
【人物弧光】
  - 开始时：
  - 经历中：
  - 结束时：`
      },
      {
        name: '故事大纲模板',
        content: `【一句话概括】
用一句话说出整个故事

【核心主题】
这个故事想表达什么

【主要人物】
男主：
女主：
重要配角：

【故事大纲】
一、开端（第1-3集）
  - 故事背景介绍
  - 主要人物出场
  - 核心设定引出
  - 第一个冲突事件

二、发展（第4-15集）
  - 主角们的关系变化
  - 主要障碍和挑战
  - 感情升温过程
  - 重要转折事件

三、高潮（第16-18集）
  - 最大的危机/误会
  - 人物关系的最低谷
  - 主角的成长和抉择

四、结局（第19-20集）
  - 危机解除
  - 人物关系的最终走向
  - 收尾和彩蛋`
      },
      {
        name: '剧本格式模板',
        content: `第X集：标题

【场景】场景名 时间 内/外

人物：角色A、角色B

（环境描述，画面氛围）

（角色动作/表情）
角色A：台词内容

（角色动作/表情）
角色B：台词内容

【转场】淡入淡出/闪白/切镜

【场景】下一个场景...

---
标注说明：
* 重要情绪或动作可以用【】标注
* 心里活动用（心里：xxx）标注
* 需要特效的地方用【特效：xxx】标注`
      }
    ],
    storyboard: [
      {
        name: '分镜表模板',
        content: `第X集 分镜表
总时长：X分X秒
总镜头数：XX个

| 镜号 | 景别 | 角度 | 画面描述 | 台词/音效 | 时长 | 备注 |
|------|------|------|----------|-----------|------|------|
| 1 | 全景 | 平视 | 城市大楼外景，阳光明媚 | BGM起 | 3s | 开场 |
| 2 | 中景 | 平视 | 女主走进大楼 | 脚步声 | 2s |  |
| 3 | 特写 | 俯视 | 女主手表，显示快迟到了 | 滴答声 | 1s | 强调时间 |
| 4 | ... | ... | ... | ... | ... | ... |

镜头类型说明：
- 景别：远景/全景/中景/近景/特写/大特写
- 角度：平视/仰视/俯视/侧视/主观视角
- 运动：固定/推/拉/摇/移/跟/升降
- 转场：切/淡入淡出/叠化/闪白/划像`
      }
    ],
    drawing: [
      {
        name: '角色绘画提示词模板',
        content: `【角色名】，【年龄】岁，【外貌描述：发型发色眼睛脸型】，
【服装：穿什么衣服】，【姿势表情：在做什么，什么表情】，
【风格：anime style / manhua style / 国漫风格】，
【画质：masterpiece, best quality, highly detailed, 8k】，
【光影：soft lighting, cinematic lighting】，
【视角：full body / upper body / close-up / front view / side view】，
【背景：simple background / white background / 具体场景】`
      },
      {
        name: '场景绘画提示词模板',
        content: `【场景描述：什么地方，什么时间，什么氛围】，
【风格：anime background / manhua style / 国漫风格】，
【时间：day / night / sunset / sunrise】，
【天气：sunny / rainy / snowy / cloudy】，
【画质：masterpiece, best quality, highly detailed, 8k, beautiful scenery】，
【光影：cinematic lighting, volumetric lighting, soft shadows】，
【构图：wide shot / panoramic view】，
【氛围：cozy / mysterious / bustling / peaceful】`
      }
    ],
    dubbing: [
      {
        name: '配音台词表模板',
        content: `第X集 配音台词表

【角色A】声线：XXX
---
序号01：（情绪：开心）
台词内容

序号02：（情绪：惊讶）
台词内容

【角色B】声线：XXX
---
序号01：（情绪：冷淡）
台词内容

序号02：（情绪：无奈）
台词内容

配音注意事项：
1. 语速：正常/稍快/稍慢
2. 语气：符合人物性格
3. 停顿：标点处适当停顿
4. 情感：根据情境调整`
      }
    ],
    editing: [
      {
        name: '剪辑检查清单',
        content: `剪辑完成检查清单

画面检查：
□ 所有镜头都按顺序放好了
□ 每个镜头的时长合适
□ 动效自然不生硬
□ 转场流畅不突兀
□ 画面没有穿帮
□ 人物形象基本一致
□ 整体色调统一

音频检查：
□ 配音都对好了位置
□ 音画同步，口型对得上
□ 配音音量合适，听得清
□ BGM音量不盖过人声
□ 音效都加到位了
□ 没有爆音或杂音

字幕检查：
□ 每句台词都有字幕
□ 字幕内容和配音一致
□ 字幕字体大小合适
□ 字幕位置不挡脸
□ 没有错别字

整体检查：
□ 开头有吸引力
□ 节奏张弛有度
□ 结尾有悬念/钩子
□ 总时长合适
□ 导出参数正确（1080p/30fps）
□ 完整看一遍没有问题`
      }
    ],
    publish: [
      {
        name: '发布计划表模板',
        content: `漫剧发布计划表

【作品名称】
【平台】抖音 / 快手 / 小红书 / B站 / 视频号
【更新频率】每周X更
【更新时间】周X 几点

排期表：
| 集数 | 标题 | 计划完成 | 计划发布 | 实际发布 | 状态 |
|------|------|----------|----------|----------|------|
| 第1集 | XXX | 6月X日 | 6月X日 | | 制作中 |
| 第2集 | XXX | 6月X日 | 6月X日 | | 待制作 |
| 第3集 | ... | ... | ... | ... | ... |

各平台发布时间建议：
- 抖音：中午12:00 / 晚上20:00-22:00
- 快手：中午12:00 / 晚上19:00-21:00
- 小红书：中午12:00 / 晚上20:00-22:00
- B站：晚上18:00-20:00
- 视频号：晚上20:00-22:00`
      }
    ]
  },

  onboardingSteps: [
    {
      title: '欢迎来到漫剧制作陪跑！',
      description: '这个平台会带你从零开始，一步步做出属于你的AI漫剧。跟着任务走就对啦～'
    },
    {
      title: '左边是流程阶段',
      description: '漫剧制作分为六个阶段：编剧→分镜→绘画→配音→剪辑→发布。按顺序来，一步一步走。'
    },
    {
      title: '每个阶段有细分任务',
      description: '点击阶段卡片可以看到详细任务清单。每个任务都有大白话说明和操作步骤，小白也能看懂。'
    },
    {
      title: '用AI帮你干活',
      description: '很多任务可以用AI一键生成！先在右上角设置里配置好大模型API，就能直接在任务里调用了。'
    },
    {
      title: '从第一个任务开始吧！',
      description: '准备好了吗？点击"编剧阶段"，从确定题材开始你的漫剧之旅吧！加油～'
    }
  ]
};
