// ===== 萌宠学堂 - 数据层 =====
const Data = {
  // 宠物类型定义 — 扩展为 10-12 个细致阶段
  petTypes: [
    {
      id: 'egg', name: '蛋生', desc: '温暖的小蛋，期待新生命的破壳',
      icon: '🥚', varieties: ['小鸡', '小鸭', '小鹅'],
      stages: [
        { name: '蛋', icon: '🥚', threshold: 0 },
        { name: '裂纹', icon: '🥚', threshold: 8 },
        { name: '破壳', icon: '🐣', threshold: 18 },
        { name: '绒毛', icon: '🐥', threshold: 35 },
        { name: '学步', icon: '🐤', threshold: 60 },
        { name: '幼鸟', icon: '🐔', threshold: 100 },
        { name: '换羽', icon: '🐓', threshold: 160 },
        { name: '亚成', icon: '🦚', threshold: 240 },
        { name: '成鸟', icon: '🦜', threshold: 350 },
        { name: '完全体', icon: '👑', threshold: 500 }
      ]
    },
    {
      id: 'amphibian', name: '卵生', desc: '晶莹的小卵，静待生命的蜕变',
      icon: '🫧', varieties: ['小青蛙', '小乌龟'],
      stages: [
        { name: '卵', icon: '🫧', threshold: 0 },
        { name: '卵裂', icon: '🫧', threshold: 8 },
        { name: '胚胎', icon: '🫧', threshold: 18 },
        { name: '蝌蚪', icon: '🐋', threshold: 35 },
        { name: '长腿', icon: '🦎', threshold: 60 },
        { name: '尾退', icon: '🐸', threshold: 100 },
        { name: '幼蛙', icon: '🐸', threshold: 160 },
        { name: '亚成', icon: '🐸', threshold: 240 },
        { name: '成蛙', icon: '🐸', threshold: 350 },
        { name: '完全体', icon: '👑', threshold: 500 }
      ]
    },
    {
      id: 'seed', name: '种子', desc: '沉睡的种子，蕴藏着生长的力量',
      icon: '🌱', varieties: ['向日葵', '仙人掌', '蘑菇'],
      stages: [
        { name: '种子', icon: '🌰', threshold: 0 },
        { name: '吸水', icon: '🌰', threshold: 6 },
        { name: '萌芽', icon: '🌱', threshold: 15 },
        { name: '扎根', icon: '🌱', threshold: 28 },
        { name: '出苗', icon: '🌿', threshold: 48 },
        { name: '抽茎', icon: '🌿', threshold: 75 },
        { name: '长叶', icon: '🍃', threshold: 110 },
        { name: '分枝', icon: '🌳', threshold: 155 },
        { name: '花苞', icon: '🌸', threshold: 210 },
        { name: '初开', icon: '🌼', threshold: 280 },
        { name: '盛放', icon: '🌻', threshold: 370 },
        { name: '结果', icon: '🍎', threshold: 500 }
      ]
    }
  ],

  // 模拟视频库 — source 标识来源平台，sourceUrl 为对应链接
  videos: [
    { id: 'v1', title: '蝴蝶的生命周期', category: '自然科学', ageGroup: '3-6', duration: 300, icon: '🦋',
      desc: '从卵到毛毛虫，从蛹到蝴蝶，大自然最神奇的变身故事', source: 'B站青少年频道', sourceUrl: 'https://www.bilibili.com/video/BV1aK4y1e7Q', creatorId: 'cr-ziran' },
    { id: 'v2', title: '太阳系漫游指南', category: '自然科学', ageGroup: '7-9', duration: 420, icon: '🪐',
      desc: '跟着小火箭一起探访太阳系的八大行星', source: '国家中小学智慧教育平台', sourceUrl: 'https://www.smart-edu.cn/teacher/course/detail/a3f7c2e1-8b4d-4a6f-9e1c-5d3b8a7f2e6c', creatorId: 'cr-ziran' },
    { id: 'v3', title: '海底世界探秘', category: '自然科学', ageGroup: '3-6', duration: 240, icon: '🐙',
      desc: '潜入深海，认识珊瑚、海马、水母等神奇的海洋生物', source: 'B站青少年频道', sourceUrl: 'https://www.bilibili.com/video/BV1xG4y1kR9', creatorId: 'cr-dongwu' },
    { id: 'v4', title: '中国古代四大发明', category: '历史人文', ageGroup: '7-9', duration: 360, icon: '📜',
      desc: '造纸术、印刷术、火药、指南针，改变世界的中国智慧', source: 'AcFun知识区', sourceUrl: 'https://www.acfun.cn/v/ac35829174', creatorId: 'cr-lishi' },
    { id: 'v5', title: '有趣的数学：认识图形', category: '数学思维', ageGroup: '3-6', duration: 180, icon: '🔷',
      desc: '圆形、三角形、正方形……生活中的图形真有趣', source: '国家中小学智慧教育平台', sourceUrl: 'https://www.smart-edu.cn/teacher/course/detail/b5e8d3f6-2c7a-4e1b-8d9f-6a4c3e7b0d1a', creatorId: 'cr-shuxue' },
    { id: 'v6', title: '地球的四季变化', category: '自然科学', ageGroup: '7-9', duration: 300, icon: '🌍',
      desc: '为什么会有春夏秋冬？地球如何绕太阳转动？', source: '国家中小学智慧教育平台', sourceUrl: 'https://www.smart-edu.cn/teacher/course/detail/c7f1a4b9-3d8e-4c2f-a5b6-8e7d9c1f3a5b', creatorId: 'cr-shuxue' },
    { id: 'v7', title: '恐龙时代大揭秘', category: '自然科学', ageGroup: '7-9', duration: 480, icon: '🦕',
      desc: '霸王龙、三角龙、翼龙……回到恐龙统治地球的时代', source: 'B站青少年频道', sourceUrl: 'https://www.bilibili.com/video/BV1jM4y1hN3', creatorId: 'cr-ziran' },
    { id: 'v8', title: '小水滴的旅行', category: '自然科学', ageGroup: '3-6', duration: 200, icon: '💧',
      desc: '小水滴从大海出发，变成云朵，变成雨滴，再回到大海', source: '中国教育电视台', sourceUrl: 'https://www.cetv.cn/program/284751', creatorId: 'cr-shenghuo' },
    { id: 'v9', title: '太空站里的生活', category: '自然科学', ageGroup: '10-12', duration: 360, icon: '🚀',
      desc: '宇航员在太空中怎么吃饭、睡觉、洗澡？', source: '国家中小学智慧教育平台', sourceUrl: 'https://www.smart-edu.cn/teacher/course/detail/d9a2c5e8-4f1b-4d3a-b7c6-1e8f9a2c5d7e', creatorId: 'cr-ziran' },
    { id: 'v10', title: '音乐入门：认识乐器', category: '艺术审美', ageGroup: '3-6', duration: 240, icon: '🎵',
      desc: '钢琴、小提琴、架子鼓……听一听它们的声音', source: 'B站青少年频道', sourceUrl: 'https://www.bilibili.com/video/BV1pP4y1wL5', creatorId: 'cr-dongwu' },
    { id: 'v11', title: '人体奥秘：骨骼与肌肉', category: '自然科学', ageGroup: '10-12', duration: 300, icon: '🦴',
      desc: '人体有多少块骨头？肌肉是怎么让我们动起来的？', source: '国家中小学智慧教育平台', sourceUrl: 'https://www.smart-edu.cn/teacher/course/detail/e1b3d6f9-5a2c-4e8b-c7d4-2f9a1e3b5c8d', creatorId: 'cr-shenghuo' },
    { id: 'v12', title: '唐诗里的春天', category: '历史人文', ageGroup: '7-9', duration: 280, icon: '🌸',
      desc: '春眠不觉晓，处处闻啼鸟——在唐诗中感受春天的美', source: 'AcFun知识区', sourceUrl: 'https://www.acfun.cn/v/ac61948273', creatorId: 'cr-yishu' },
    // === 新增内容 v13-v36 ===
    // 自然科学
    { id: 'v13', title: '植物如何喝水', category: '自然科学', ageGroup: '3-6', duration: 180, icon: '🌿',
      desc: '植物的根就像吸管一样，把水分从土壤吸到全身', source: '中国教育电视台', sourceUrl: 'https://www.cetv.cn/program/391026', creatorId: 'cr-shenghuo' },
    { id: 'v14', title: '为什么天空是蓝色的', category: '自然科学', ageGroup: '7-9', duration: 240, icon: '🌤️',
      desc: '阳光穿过大气层时，蓝色光被散射到四面八方', source: '国家中小学智慧教育平台', sourceUrl: 'https://www.smart-edu.cn/teacher/course/detail/f2c4e7a1-6b3d-4f9c-d8e5-3a1b4c6f8e2a', creatorId: 'cr-shenghuo' },
    { id: 'v15', title: '磁铁的奥秘', category: '自然科学', ageGroup: '7-9', duration: 300, icon: '🧲',
      desc: '为什么磁铁能吸铁？南北极又是什么？一起探索磁力世界', source: '国家中小学智慧教育平台', sourceUrl: 'https://www.smart-edu.cn/teacher/course/detail/a4d6f8b2-7c5e-4a1d-e9f6-4b2c5d7a9e3f', creatorId: 'cr-shenghuo' },
    { id: 'v16', title: '火山爆发实验', category: '自然科学', ageGroup: '7-9', duration: 360, icon: '🌋',
      desc: '小苏打加醋模拟火山喷发，了解地球内部的巨大能量', source: '国家中小学智慧教育平台', sourceUrl: 'https://www.smart-edu.cn/teacher/course/detail/b5e7a9c3-8d6f-4b2e-f1a7-5c3d6e8b0a4f', creatorId: 'cr-shenghuo' },
    { id: 'v17', title: '天气与云朵', category: '自然科学', ageGroup: '3-6', duration: 200, icon: '☁️',
      desc: '积云、层云、雨云……不同云朵告诉我们不同的天气', source: '中国教育电视台', sourceUrl: 'https://www.cetv.cn/program/528417', creatorId: 'cr-dongwu' },
    { id: 'v18', title: '昆虫的世界', category: '自然科学', ageGroup: '7-9', duration: 350, icon: '🐛',
      desc: '蚂蚁、蜜蜂、蜻蜓——昆虫王国里藏着多少秘密', source: 'B站青少年频道', sourceUrl: 'https://www.bilibili.com/video/BV1sS4y1mP7', creatorId: 'cr-lishi' },
    { id: 'v19', title: '化石的形成', category: '自然科学', ageGroup: '10-12', duration: 400, icon: '🪨',
      desc: '古生物是如何变成化石的？化石又告诉我们什么故事？', source: '中国教育电视台', sourceUrl: 'https://www.cetv.cn/program/673920', creatorId: 'cr-dongwu' },
    { id: 'v20', title: '电的奇妙之旅', category: '自然科学', ageGroup: '10-12', duration: 320, icon: '⚡',
      desc: '从发电厂到家里的灯泡，电是怎么来到我们身边的', source: '中国教育电视台', sourceUrl: 'https://www.cetv.cn/program/814536', creatorId: 'cr-dongwu' },
    // 历史人文
    { id: 'v21', title: '丝绸之路的故事', category: '历史人文', ageGroup: '7-9', duration: 420, icon: '🐫',
      desc: '张骞出使西域，开辟了一条连接东西方的伟大商路', source: 'AcFun知识区', sourceUrl: 'https://www.acfun.cn/v/ac74293658', creatorId: 'cr-lishi' },
    { id: 'v22', title: '十二生肖的传说', category: '历史人文', ageGroup: '3-6', duration: 220, icon: '🐭',
      desc: '为什么老鼠排第一？猫为什么不在十二生肖里？', source: 'AcFun知识区', sourceUrl: 'https://www.acfun.cn/v/ac85304791', creatorId: 'cr-yishu' },
    { id: 'v23', title: '长城的故事', category: '历史人文', ageGroup: '7-9', duration: 380, icon: '🏯',
      desc: '万里长城是怎么建造的？它真的能在太空中看到吗？', source: '学而思素养', sourceUrl: 'https://www.xueersi.com/course/492817', creatorId: 'cr-lishi' },
    { id: 'v24', title: '世界各地的节日', category: '历史人文', ageGroup: '10-12', duration: 350, icon: '🎉',
      desc: '春节、圣诞节、排灯节——看看世界各地的人们如何庆祝节日', source: '学而思素养', sourceUrl: 'https://www.xueersi.com/course/635410', creatorId: 'cr-yishu' },
    // 数学思维
    { id: 'v25', title: '数字的起源', category: '数学思维', ageGroup: '3-6', duration: 180, icon: '🔢',
      desc: '古人是怎么数数的？数字是怎么被发明出来的？', source: '国家中小学智慧教育平台', sourceUrl: 'https://www.smart-edu.cn/teacher/course/detail/c6f8b1d4-9e7a-4c3f-a2b5-6d4e7f9c1a3b', creatorId: 'cr-ziran' },
    { id: 'v26', title: '有趣的对称', category: '数学思维', ageGroup: '7-9', duration: 260, icon: '🦋',
      desc: '蝴蝶的翅膀、雪花、剪纸——对称之美无处不在', source: '国家中小学智慧教育平台', sourceUrl: 'https://www.smart-edu.cn/teacher/course/detail/d7a9c2e5-1f8b-4d4a-b3c6-7e5f8a0d2b4c', creatorId: 'cr-shuxue' },
    { id: 'v27', title: '概率与统计入门', category: '数学思维', ageGroup: '10-12', duration: 340, icon: '🎲',
      desc: '抛硬币、掷骰子——概率到底是怎么算的？', source: '国家中小学智慧教育平台', sourceUrl: 'https://www.smart-edu.cn/teacher/course/detail/e8b1d3f6-2a9c-4e5b-c4d7-8f6a1b3e5c7d', creatorId: 'cr-shuxue' },
    // 艺术审美
    { id: 'v28', title: '梵高的向日葵', category: '艺术审美', ageGroup: '7-9', duration: 280, icon: '🌻',
      desc: '走进梵高的世界，了解这位伟大画家和他的向日葵', source: 'B站青少年频道', sourceUrl: 'https://www.bilibili.com/video/BV1tT4y1nQ8', creatorId: 'cr-lishi' },
    { id: 'v29', title: '京剧脸谱', category: '艺术审美', ageGroup: '7-9', duration: 320, icon: '🎭',
      desc: '红脸关公、白脸曹操——京剧脸谱的颜色代表什么', source: 'AcFun知识区', sourceUrl: 'https://www.acfun.cn/v/ac96184025', creatorId: 'cr-yuyan' },
    { id: 'v30', title: '建筑之美：世界奇观', category: '艺术审美', ageGroup: '10-12', duration: 400, icon: '🏛️',
      desc: '金字塔、埃菲尔铁塔、故宫——人类建筑的伟大奇迹', source: '学而思素养', sourceUrl: 'https://www.xueersi.com/course/748293', creatorId: 'cr-lishi' },
    // 新增分类：语言表达
    { id: 'v31', title: '成语故事：守株待兔', category: '语言表达', ageGroup: '3-6', duration: 160, icon: '🐰',
      desc: '一个农夫守在树桩旁等兔子撞上来，结果呢？', source: '少儿短视频平台合集', sourceUrl: 'https://www.douyin.com/video/7284930165829301742', creatorId: 'cr-tansuo' },
    { id: 'v32', title: '绕口令大挑战', category: '语言表达', ageGroup: '7-9', duration: 200, icon: '🗣️',
      desc: '吃葡萄不吐葡萄皮——看看你能说得多快', source: 'B站青少年频道', sourceUrl: 'https://www.bilibili.com/video/BV1uU4y1oR6', creatorId: 'cr-dongwu' },
    { id: 'v33', title: '演讲与表达技巧', category: '语言表达', ageGroup: '10-12', duration: 380, icon: '🎤',
      desc: '如何自信地站在台上讲话？从准备到表达的完整指南', source: '学而思素养', sourceUrl: 'https://www.xueersi.com/course/819504', creatorId: 'cr-yishu' },
    // 新增分类：生活常识
    { id: 'v34', title: '食品安全小课堂', category: '生活常识', ageGroup: '3-6', duration: 180, icon: '🍎',
      desc: '哪些食物要洗干净？为什么不能吃过期食品？', source: '少儿短视频平台合集', sourceUrl: 'https://www.kuaishou.com/short-video/3x9k2m7p', creatorId: 'cr-shenghuo' },
    { id: 'v35', title: '交通安全小卫士', category: '生活常识', ageGroup: '3-6', duration: 160, icon: '🚦',
      desc: '红灯停、绿灯行——在马路上如何保护自己', source: '少儿短视频平台合集', sourceUrl: 'https://www.douyin.com/video/7395048263194025817', creatorId: 'cr-tansuo' },
    { id: 'v36', title: '垃圾分类与环保', category: '生活常识', ageGroup: '7-9', duration: 260, icon: '♻️',
      desc: '可回收、厨余、有害、其他——垃圾应该怎么分类', source: '少儿短视频平台合集', sourceUrl: 'https://www.kuaishou.com/short-video/5b8n4q1r', creatorId: 'cr-tansuo' }
  ],

  // 题库（关联视频）
  quizzes: {
    'v1': [
      { question: '蝴蝶是由什么变成的？', options: ['毛毛虫', '蚯蚓', '蜘蛛', '蚂蚁'], answer: 0, knowledge: '昆虫变态发育' },
      { question: '蝴蝶的翅膀上覆盖着什么？', options: ['羽毛', '鳞片', '毛发', '贝壳'], answer: 1, knowledge: '昆虫身体结构' }
    ],
    'v2': [
      { question: '太阳系中最大的行星是？', options: ['土星', '木星', '天王星', '海王星'], answer: 1, knowledge: '行星知识' },
      { question: '哪颗行星被称为"红色星球"？', options: ['金星', '木星', '火星', '水星'], answer: 2, knowledge: '行星特征' }
    ],
    'v3': [
      { question: '水母大部分身体是由什么组成的？', options: ['骨骼', '水', '脂肪', '空气'], answer: 1, knowledge: '海洋生物' }
    ],
    'v4': [
      { question: '四大发明中哪一个与文字传播关系最密切？', options: ['火药', '指南针', '印刷术', '造纸术'], answer: 2, knowledge: '中国古代发明' },
      { question: '造纸术是谁改进的？', options: ['孔子', '蔡伦', '张衡', '祖冲之'], answer: 1, knowledge: '历史人物' }
    ],
    'v5': [
      { question: '交通标志"停止"是什么形状？', options: ['三角形', '圆形', '正方形', '五角星'], answer: 1, knowledge: '生活中的图形' }
    ],
    'v6': [
      { question: '地球绕太阳公转一周需要多长时间？', options: ['一天', '一个月', '一年', '一周'], answer: 2, knowledge: '天文知识' }
    ],
    'v7': [
      { question: '霸王龙的前肢有什么特点？', options: ['非常长', '非常短小', '有翅膀', '能抓东西'], answer: 1, knowledge: '古生物知识' }
    ],
    'v8': [
      { question: '水蒸发后会变成什么？', options: ['冰', '水蒸气', '石头', '沙子'], answer: 1, knowledge: '水的三态' }
    ],
    'v9': [
      { question: '在太空中，宇航员的身高会怎样变化？', options: ['变矮', '变高', '不变', '忽高忽矮'], answer: 1, knowledge: '太空物理' }
    ],
    'v10': [
      { question: '钢琴有多少个键？', options: ['66个', '77个', '88个', '99个'], answer: 2, knowledge: '音乐知识' }
    ],
    'v11': [
      { question: '成年人有多少块骨头？', options: ['106块', '156块', '206块', '256块'], answer: 2, knowledge: '人体结构' }
    ],
    'v12': [
      { question: '"春眠不觉晓"的作者是谁？', options: ['李白', '杜甫', '孟浩然', '王维'], answer: 2, knowledge: '唐诗作者' }
    ],
    // 新增题目 v13-v36
    'v13': [
      { question: '植物的根主要有什么作用？', options: ['🌊 吸收水分', '🍎 制造食物', '🌸 开花结果', '🌬️ 传播种子'], answer: 0, knowledge: '植物生理', ageGroup: '3-6', type: 'choice' },
      { question: '水从植物的哪里蒸发到空气中？', options: ['🌱 根', '🌿 茎', '🍃 叶子', '🌺 花'], answer: 2, knowledge: '植物蒸腾作用', ageGroup: '3-6', type: 'choice' }
    ],
    'v14': [
      { question: '天空是蓝色的主要因为什么？', options: ['大气层反射', '蓝色光被散射', '海水倒映', '云朵过滤'], answer: 1, knowledge: '光学原理' }
    ],
    'v15': [
      { question: '磁铁有几个极？', options: ['一个', '两个', '三个', '四个'], answer: 1, knowledge: '磁学基础' },
      { question: '磁铁能吸什么金属？', options: ['铜', '铝', '铁', '金'], answer: 2, knowledge: '磁性材料' }
    ],
    'v16': [
      { question: '火山喷发实验中，小苏打和什么混合会产生气泡？', options: ['水', '醋', '盐', '糖'], answer: 1, knowledge: '酸碱反应' }
    ],
    'v17': [
      { question: '哪种云朵通常预示着晴天？', options: ['积云', '雨云', '层云', '雷云'], answer: 0, knowledge: '气象知识' }
    ],
    'v18': [
      { question: '蜜蜂用什么传递信息？', options: ['声音', '舞蹈', '气味', '触角'], answer: 1, knowledge: '昆虫行为' },
      { question: '蚂蚁的触角有什么作用？', options: ['看东西', '闻气味', '听声音', '抓食物'], answer: 1, knowledge: '昆虫结构' }
    ],
    'v19': [
      { question: '化石通常保存在哪种岩石中？', options: ['岩浆岩', '沉积岩', '变质岩', '花岗岩'], answer: 1, knowledge: '古生物学' }
    ],
    'v20': [
      { question: '家庭电路中的电流是什么类型？', options: ['直流电', '交流电', '静电', '雷电'], answer: 1, knowledge: '电学基础' }
    ],
    'v21': [
      { question: '丝绸之路的开辟者是谁？', options: ['郑和', '张骞', '玄奘', '马可波罗'], answer: 1, knowledge: '中国古代史' }
    ],
    'v22': [
      { question: '十二生肖中排第一的是什么动物？', options: ['牛', '鼠', '虎', '龙'], answer: 1, knowledge: '传统文化' }
    ],
    'v23': [
      { question: '长城真的能在太空中看到吗？', options: ['能', '不能', '有时能', '需要望远镜'], answer: 1, knowledge: '航天常识' }
    ],
    'v24': [
      { question: '圣诞节是为了纪念谁？', options: ['圣诞老人', '耶稣', '孔子', '佛陀'], answer: 1, knowledge: '世界文化' }
    ],
    'v25': [
      { question: '古人最早用什么方法来记数？', options: ['写数字', '结绳记事', '用算盘', '刻石头'], answer: 1, knowledge: '数学史' }
    ],
    'v26': [
      { question: '下面哪种东西是对称的？', options: ['蝴蝶', '树叶', '雪花', '以上都是'], answer: 3, knowledge: '对称概念' }
    ],
    'v26b': [
      { question: '以下哪些图形是轴对称图形？（多选）', options: ['🔺 等边三角形', '🔲 正方形', '📐 直角三角形', '⭕ 圆形'], answer: [0, 1, 3], knowledge: '对称图形', ageGroup: '10-12', type: 'multichoice' }
    ],
    'v27': [
      { question: '抛一枚硬币，正面朝上的概率是多少？', options: ['1/2', '1/3', '1/4', '1/6'], answer: 0, knowledge: '概率基础' }
    ],
    'v28': [
      { question: '梵高是哪个国家的画家？', options: ['法国', '荷兰', '意大利', '西班牙'], answer: 1, knowledge: '艺术史' }
    ],
    'v29': [
      { question: '京剧脸谱中红色通常代表什么？', options: ['奸诈', '忠诚', '勇敢', '智慧'], answer: 1, knowledge: '戏曲文化' }
    ],
    'v30': [
      { question: '世界七大奇迹中，唯一保存至今的是？', options: ['金字塔', '空中花园', '长城', '兵马俑'], answer: 0, knowledge: '世界建筑' }
    ],
    'v31': [
      { question: '"守株待兔"告诉我们什么道理？', options: ['要勤劳', '不要侥幸', '要勇敢', '要聪明'], answer: 1, knowledge: '成语寓意' }
    ],
    'v32': [
      { question: '绕口令练习主要锻炼什么能力？', options: ['听力', '发音', '记忆力', '写作'], answer: 1, knowledge: '语言训练' }
    ],
    'v33': [
      { question: '演讲时眼神应该看哪里？', options: ['天花板', '地面', '观众', '讲稿'], answer: 2, knowledge: '演讲技巧' }
    ],
    'v34': [
      { question: '吃水果前应该怎么做？', options: ['直接吃', '洗干净', '削皮', '加热'], answer: 1, knowledge: '食品卫生' }
    ],
    'v34b': [
      { question: '请按正确的洗手步骤排序：', options: ['🧼 涂肥皂', '💧 湿手', '🌊 冲洗', '🧽 擦干'], answer: [1, 0, 2, 3], knowledge: '卫生步骤', ageGroup: '10-12', type: 'sort' }
    ],
    'v35': [
      { question: '过马路时应该走哪里？', options: ['车道', '斑马线', '绿化带', '随便走'], answer: 1, knowledge: '交通安全' }
    ],
    'v36': [
      { question: '厨余垃圾应该投进什么颜色的垃圾桶？', options: ['蓝色', '绿色', '红色', '灰色'], answer: 1, knowledge: '垃圾分类' }
    ]
  },

  // 视频来源配置
  videoSources: [
    {
      id: 'bilibili', name: 'B站青少年频道', icon: '📺',
      url: 'https://www.bilibili.com/',
      apiDoc: 'https://api.bilibili.com/',
      desc: '哔哩哔哩青少年模式精选科普内容',
      categories: ['自然科学', '艺术审美', '历史人文'],
      ageRange: ['3-6', '7-9', '10-12'],
      enabled: true
    },
    {
      id: 'acfun', name: 'AcFun知识区', icon: '🎯',
      url: 'https://www.acfun.cn/',
      apiDoc: 'https://www.acfun.cn/rest/app/channel/list',
      desc: 'AcFun知识区动画科普、历史人文内容',
      categories: ['历史人文', '艺术审美', '语言表达'],
      ageRange: ['7-9', '10-12'],
      enabled: true
    },
    {
      id: 'smart-edu', name: '国家中小学智慧教育平台', icon: '🏫',
      url: 'https://www.smart-edu.cn/',
      apiDoc: 'https://www.smart-edu.cn/api/',
      desc: '教育部官方中小学数字教育资源公共服务平台',
      categories: ['自然科学', '数学思维', '语言表达', '生活常识'],
      ageRange: ['3-6', '7-9', '10-12'],
      enabled: true
    },
    {
      id: 'cetv', name: '中国教育电视台', icon: '📡',
      url: 'https://www.cetv.cn/',
      apiDoc: 'https://www.cetv.cn/api/content',
      desc: '中国教育电视台少儿节目与科普内容',
      categories: ['自然科学', '生活常识'],
      ageRange: ['3-6', '7-9'],
      enabled: true
    },
    {
      id: 'xueersi', name: '学而思素养', icon: '📘',
      url: 'https://www.xueersi.com/',
      apiDoc: 'https://www.xueersi.com/api/course',
      desc: '学而思素养课，涵盖人文、科学、艺术等综合素养',
      categories: ['历史人文', '艺术审美', '语言表达'],
      ageRange: ['7-9', '10-12'],
      enabled: true
    },
    {
      id: 'douyin-kuaishou', name: '短视频平台精选', icon: '📱',
      url: 'https://www.douyin.com/',
      apiDoc: 'https://open.douyin.com/platform/',
      desc: '抖音/快手青少年模式精选短视频，经教育专家审核',
      categories: ['自然科学', '生活常识', '语言表达'],
      ageRange: ['3-6', '7-9'],
      enabled: true
    }
  ],

  // 模拟博主数据
  creators: [
    { id: 'cr-ziran', name: '自然探索家', platform: 'bilibili', avatar: '🧑‍🔬', categories: ['自然科学'], desc: '专注自然科学科普动画', videoCount: 24, subscriberCount: '58万', recommended: true, tips: 0 },
    { id: 'cr-lishi', name: '历史故事会', platform: 'bilibili', avatar: '📚', categories: ['历史人文'], desc: '用故事讲历史，生动有趣', videoCount: 36, subscriberCount: '120万', recommended: true, tips: 0 },
    { id: 'cr-shuxue', name: '数学小天才', platform: 'smart-edu', avatar: '🧮', categories: ['数学思维'], desc: '趣味数学思维训练', videoCount: 18, subscriberCount: '32万', recommended: true, tips: 0 },
    { id: 'cr-yishu', name: '艺术小课堂', platform: 'acfun', avatar: '🎨', categories: ['艺术审美'], desc: '儿童绘画与手工创意', videoCount: 42, subscriberCount: '86万', recommended: true, tips: 0 },
    { id: 'cr-yuyan', name: '语言大冒险', platform: 'xueersi', avatar: '🗣️', categories: ['语言表达'], desc: '中英文语言能力培养', videoCount: 30, subscriberCount: '45万', recommended: false, tips: 0 },
    { id: 'cr-shenghuo', name: '生活小百科', platform: 'cetv', avatar: '🌍', categories: ['生活常识'], desc: '日常生活中的趣味知识', videoCount: 28, subscriberCount: '67万', recommended: true, tips: 0 },
    { id: 'cr-dongwu', name: '动物星球', platform: 'bilibili', avatar: '🦁', categories: ['自然科学', '生活常识'], desc: '走进奇妙的动物世界', videoCount: 50, subscriberCount: '200万', recommended: true, tips: 0 },
    { id: 'cr-tansuo', name: '小小探险家', platform: 'douyin-kuaishou', avatar: '🔬', categories: ['自然科学', '数学思维'], desc: '科学实验小课堂', videoCount: 15, subscriberCount: '28万', recommended: false, tips: 0 },
  ],

  // 房间装饰
  rooms: {
    backgrounds: [
      { id: 'bg-star', name: '星空', icon: '🌌', unlock: 0, gradient: 'linear-gradient(180deg, #0B1026 0%, #1A1B4B 50%, #2D1B69 100%)' },
      { id: 'bg-forest', name: '森林', icon: '🌲', unlock: 0, gradient: 'linear-gradient(180deg, #87CEEB 0%, #98D8A0 40%, #2D7A3A 100%)' },
      { id: 'bg-study', name: '书房', icon: '📚', unlock: 0, gradient: 'linear-gradient(180deg, #F5E6D3 0%, #E8D5B7 50%, #D4A76A 100%)' },
      { id: 'bg-ocean', name: '海洋', icon: '🌊', unlock: 0, gradient: 'linear-gradient(180deg, #4FC3F7 0%, #0288D1 40%, #01579B 100%)' },
      { id: 'bg-garden', name: '花园', icon: '🌸', unlock: 0, gradient: 'linear-gradient(180deg, #87CEEB 0%, #F8BBD0 40%, #81C784 100%)' },
      { id: 'bg-desert', name: '沙漠', icon: '🏜️', unlock: 7, gradient: 'linear-gradient(180deg, #FF8A65 0%, #FFB74D 40%, #D4A054 100%)' },
      { id: 'bg-space', name: '宇宙', icon: '🪐', unlock: 14, gradient: 'linear-gradient(180deg, #000033 0%, #000066 40%, #1A0033 100%)' }
    ],
    furniture: [
      { id: 'f-lamp', name: '台灯', icon: '🪔', unlock: 0 },
      { id: 'f-rug', name: '地毯', icon: '🟫', unlock: 0 },
      { id: 'f-shelf', name: '书架', icon: '📚', unlock: 5 },
      { id: 'f-clock', name: '闹钟', icon: '⏰', unlock: 0 },
      { id: 'f-plant', name: '花盆', icon: '🪴', unlock: 3 },
      { id: 'f-globe', name: '地球仪', icon: '🌍', unlock: 10 },
      { id: 'f-telescope', name: '望远镜', icon: '🔭', unlock: 20 }
    ],
    costumes: [
      { id: 'c-hat', name: '礼帽', icon: '🎩', unlock: 0 },
      { id: 'c-scarf', name: '红围巾', icon: '🧣', unlock: 0 },
      { id: 'c-glasses', name: '墨镜', icon: '🕶️', unlock: 3 },
      { id: 'c-bow', name: '领结', icon: '🎀', unlock: 5 },
      { id: 'c-crown', name: '皇冠', icon: '👑', unlock: 10 },
      { id: 'c-wings', name: '天使翅膀', icon: '🪽', unlock: 15 },
      { id: 'c-halo', name: '光环', icon: '😇', unlock: 20 },
      { id: 'c-bell', name: '铃铛', icon: '🔔', unlock: 25 },
      { id: 'c-cape', name: '披风', icon: '🦸', unlock: 30 },
      { id: 'c-magic', name: '魔法帽', icon: '🧙', unlock: 40 }
    ]
  },

  // 默认家长管控
  defaultControls: {
    dailyLimit: 30,
    allowedStart: '08:00',
    allowedEnd: '21:00',
    contentMode: 'open',
    contentLevel: 'standard',
    whitelistedCreators: ['cr-ziran', 'cr-lishi', 'cr-shuxue', 'cr-yishu', 'cr-shenghuo', 'cr-dongwu'],
    customVideos: [],
    blacklistKeywords: [],
    eyeCare: true,
    allowedSlots: [6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21],
    paused: false
  },

  // ===== 家长自定义出题 — 题型模板 =====
  questionTypeTemplates: [
    {
      id: 'choice',
      name: '单选题',
      icon: '🔘',
      desc: '给出多个选项，选择唯一正确答案',
      difficulties: {
        easy: { name: '简单', optionCount: 2, hasHint: true, desc: '2个选项，基础知识点' },
        medium: { name: '中等', optionCount: 3, hasHint: false, desc: '3个选项，常规知识点' },
        hard: { name: '困难', optionCount: 4, hasHint: false, desc: '4个选项，易混淆干扰项' }
      }
    },
    {
      id: 'truefalse',
      name: '判断题',
      icon: '✅',
      desc: '判断陈述是否正确',
      difficulties: {
        easy: { name: '简单', optionCount: 2, hasHint: true, desc: '直观判断，对错分明' },
        medium: { name: '中等', optionCount: 2, hasHint: false, desc: '需要简单推理' },
        hard: { name: '困难', optionCount: 2, hasHint: false, desc: '容易混淆的概念' }
      }
    },
    {
      id: 'fillblank',
      name: '填空题',
      icon: '✏️',
      desc: '在空白处填入正确答案',
      difficulties: {
        easy: { name: '简单', maxLength: 4, hasHint: true, desc: '1-2个字，直接答案' },
        medium: { name: '中等', maxLength: 8, hasHint: false, desc: '3-4个字，常规答案' },
        hard: { name: '困难', maxLength: 15, hasHint: false, desc: '5个字以上，完整表述' }
      }
    }
  ],

  // ===== 家长出题分类提示词 =====
  quizCategoryHints: {
    '自然科学': ['四季变化', '动植物知识', '天文地理', '物理现象'],
    '历史人文': ['古代故事', '传统节日', '历史人物', '文化常识'],
    '数学思维': ['数字计算', '图形认知', '逻辑推理', '生活数学'],
    '艺术审美': ['音乐乐器', '绘画色彩', '建筑风格', '戏曲文化'],
    '语言表达': ['成语故事', '词语搭配', '口语表达', '阅读理解'],
    '生活常识': ['食品安全', '交通安全', '环保知识', '健康习惯']
  },

  // 管理员可配置的宠物模板 — 预定义了三个基础类型，管理员可在此添加更多
  adminPetTemplates: [
    {
      id: 'dragon', name: '恐龙', desc: '霸王龙从蛋孵化到成年',
      icon: '🦕', varieties: ['霸王龙', '三角龙', '翼龙'],
      stages: [
        { name: '蛋', icon: '🥚', threshold: 0 },
        { name: '孵化', icon: '🐣', threshold: 50 },
        { name: '幼龙', icon: '🦖', threshold: 100 },
        { name: '亚成', icon: '🦖', threshold: 200 },
        { name: '成年', icon: '🦕', threshold: 350 },
        { name: '完全体', icon: '👑', threshold: 500 }
      ]
    },
    {
      id: 'sunflower', name: '向日葵', desc: '向日葵从种子到花朵',
      icon: '🌻', varieties: ['普通向日葵', '黑色向日葵'],
      stages: [
        { name: '种子', icon: '🌰', threshold: 0 },
        { name: '发芽', icon: '🌱', threshold: 15 },
        { name: '幼苗', icon: '🌿', threshold: 40 },
        { name: '植株', icon: '🌻', threshold: 80 },
        { name: '花苞', icon: '🌼', threshold: 150 },
        { name: '盛开', icon: '🌻', threshold: 250 },
        { name: '结果', icon: '🍯', threshold: 400 },
        { name: '丰收', icon: '👑', threshold: 500 }
      ]
    },
    {
      id: 'whale', name: '鲸鱼', desc: '小蓝鲸从幼崽到蓝鲸',
      icon: '🐳', varieties: ['蓝鲸', '虎鲸'],
      stages: [
        { name: '宝宝', icon: '🐳', threshold: 0 },
        { name: '成长', icon: '🐳', threshold: 100 },
        { name: '亚成', icon: '🐳', threshold: 200 },
        { name: '成年', icon: '🐳', threshold: 350 },
        { name: '巨鲸', icon: '🐋', threshold: 500 },
        { name: '完全体', icon: '👑', threshold: 600 }
      ]
    }
  ],

  // 获取所有可用宠物类型（基础 + 管理员模板 + 自定义）
  getAllPetTypes() {
    return [...this.petTypes, ...this.adminPetTemplates, ...(this.adminConfig.customTemplates || [])];
  },

  // 获取所有视频（静态 + 自定义）
  getAllVideos() {
    return [...this.videos, ...(this.adminConfig.customVideos || [])];
  },

  // 获取所有分类
  getAllCategories() {
    const allVideos = this.getAllVideos();
    return [...new Set(allVideos.map(v => v.category))];
  },

  // 获取所有题目（静态 + 自定义）
  getAllQuizzes() {
    return { ...this.quizzes, ...(this.adminConfig.customQuizzes || {}) };
  },

  // 获取所有任务（静态 + 自定义）
  getAllTasks() {
    return [...(this.adminConfig.customTasks || [])];
  },



  // ===== 管理员配置 =====
  adminConfig: {
    customTemplates: [],
    customVideos: [],
    customQuizzes: {},
    customTasks: [],
    parentQuizzes: [],
    settings: {
      defaultDailyLimit: 30,
      defaultAllowedStart: '08:00',
      defaultAllowedEnd: '21:00',
      growthWatchRate: 1,
      growthQuizRate: 3,
      maxPetsPerChild: null
    },

    opLog: []
  },

  // 加载管理员配置
  loadAdminConfig() {
    const saved = Utils.loadLocal('adminConfig');
    if (saved) {
      this.adminConfig = { ...this.adminConfig, ...saved };
    }
  },

  // 保存管理员配置
  saveAdminConfig() {
    Utils.saveLocal('adminConfig', this.adminConfig);
  },

  // 初始化：合并自定义数据到静态数据
  init() {
    this.loadAdminConfig();
    // 合并自定义视频
    if (this.adminConfig.customVideos && this.adminConfig.customVideos.length > 0) {
      this.videos.push(...this.adminConfig.customVideos);
    }
    // 合并自定义模板
    if (this.adminConfig.customTemplates && this.adminConfig.customTemplates.length > 0) {
      this.adminPetTemplates.push(...this.adminConfig.customTemplates);
    }
    // 合并自定义题目
    if (this.adminConfig.customQuizzes) {
      Object.assign(this.quizzes, this.adminConfig.customQuizzes);
    }
  },

  // 记录操作日志
  logOp(action, detail) {
    this.adminConfig.opLog.unshift({
      action, detail,
      timestamp: Date.now(),
      timeStr: new Date().toLocaleString('zh-CN')
    });
    if (this.adminConfig.opLog.length > 100) {
      this.adminConfig.opLog = this.adminConfig.opLog.slice(0, 100);
    }
    this.saveAdminConfig();
  },

  // 生成唯一 ID
  _genId(prefix) {
    return prefix + '_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
  },

  // ===== 宠物模板管理 =====
  addTemplate(tpl) {
    tpl.id = this._genId('tpl');
    tpl.enabled = tpl.enabled !== false;
    this.adminPetTemplates.push(tpl);
    this.adminConfig.customTemplates.push(tpl);
    this.logOp('新增模板', tpl.name);
    this.saveAdminConfig();
    return tpl;
  },

  updateTemplate(id, updates) {
    const idx = this.adminPetTemplates.findIndex(t => t.id === id);
    if (idx >= 0) {
      Object.assign(this.adminPetTemplates[idx], updates);
      const cIdx = this.adminConfig.customTemplates.findIndex(t => t.id === id);
      if (cIdx >= 0) Object.assign(this.adminConfig.customTemplates[cIdx], updates);
      this.logOp('编辑模板', updates.name || id);
      this.saveAdminConfig();
      return true;
    }
    return false;
  },

  deleteTemplate(id) {
    const tpl = this.adminPetTemplates.find(t => t.id === id);
    this.adminPetTemplates = this.adminPetTemplates.filter(t => t.id !== id);
    this.adminConfig.customTemplates = this.adminConfig.customTemplates.filter(t => t.id !== id);
    this.logOp('删除模板', tpl ? tpl.name : id);
    this.saveAdminConfig();
  },

  toggleTemplate(id) {
    const tpl = this.adminPetTemplates.find(t => t.id === id);
    if (tpl) {
      tpl.enabled = !tpl.enabled;
      const cIdx = this.adminConfig.customTemplates.findIndex(t => t.id === id);
      if (cIdx >= 0) this.adminConfig.customTemplates[cIdx].enabled = tpl.enabled;
      this.logOp(tpl.enabled ? '启用模板' : '禁用模板', tpl.name);
      this.saveAdminConfig();
    }
  },

  // ===== 视频内容管理 =====
  addVideo(video) {
    video.id = this._genId('cv');
    this.videos.push(video);
    this.adminConfig.customVideos.push(video);
    this.logOp('新增视频', video.title);
    this.saveAdminConfig();
    return video;
  },

  updateVideo(id, updates) {
    const idx = this.videos.findIndex(v => v.id === id);
    if (idx >= 0) {
      Object.assign(this.videos[idx], updates);
      const cIdx = this.adminConfig.customVideos.findIndex(v => v.id === id);
      if (cIdx >= 0) Object.assign(this.adminConfig.customVideos[cIdx], updates);
      this.logOp('编辑视频', updates.title || id);
      this.saveAdminConfig();
      return true;
    }
    return false;
  },

  deleteVideo(id) {
    const v = this.videos.find(vv => vv.id === id);
    this.videos = this.videos.filter(vv => vv.id !== id);
    this.adminConfig.customVideos = this.adminConfig.customVideos.filter(vv => vv.id !== id);
    // 同时删除关联题目
    delete this.quizzes[id];
    delete this.adminConfig.customQuizzes[id];
    this.logOp('删除视频', v ? v.title : id);
    this.saveAdminConfig();
  },

  // ===== 题库管理 =====
  addQuiz(videoId, quiz) {
    if (!this.quizzes[videoId]) this.quizzes[videoId] = [];
    this.quizzes[videoId].push(quiz);
    if (!this.adminConfig.customQuizzes[videoId]) this.adminConfig.customQuizzes[videoId] = [];
    this.adminConfig.customQuizzes[videoId].push(quiz);
    this.logOp('新增题目', `视频 ${videoId}`);
    this.saveAdminConfig();
  },

  deleteQuiz(videoId, questionIndex) {
    if (this.quizzes[videoId]) {
      this.quizzes[videoId].splice(questionIndex, 1);
    }
    if (this.adminConfig.customQuizzes[videoId]) {
      this.adminConfig.customQuizzes[videoId].splice(questionIndex, 1);
    }
    this.logOp('删除题目', `视频 ${videoId}`);
    this.saveAdminConfig();
  },

  // ===== 任务管理 =====
  addTask(task) {
    task.id = this._genId('task');
    task.createdAt = Date.now();
    this.adminConfig.customTasks.push(task);
    this.logOp('新增任务', task.title);
    this.saveAdminConfig();
    return task;
  },

  updateTask(id, updates) {
    const idx = this.adminConfig.customTasks.findIndex(t => t.id === id);
    if (idx >= 0) {
      Object.assign(this.adminConfig.customTasks[idx], updates);
      this.logOp('编辑任务', updates.title || id);
      this.saveAdminConfig();
      return true;
    }
    return false;
  },

  deleteTask(id) {
    const t = this.adminConfig.customTasks.find(tt => tt.id === id);
    this.adminConfig.customTasks = this.adminConfig.customTasks.filter(tt => tt.id !== id);
    this.logOp('删除任务', t ? t.title : id);
    this.saveAdminConfig();
  },

  // ===== 系统设置 =====
  updateSetting(key, value) {
    this.adminConfig.settings[key] = value;
    this.logOp('修改设置', `${key} = ${value}`);
    this.saveAdminConfig();
  },



  // ===== 家长自定义出题管理 =====
  addParentQuiz(quiz) {
    quiz.id = this._genId('pq');
    quiz.createdAt = Date.now();
    quiz.status = 'active';
    this.adminConfig.parentQuizzes.push(quiz);
    this.logOp('家长出题', `${quiz.category} · ${quiz.typeName} · ${quiz.difficultyName}`);
    this.saveAdminConfig();
    return quiz;
  },

  updateParentQuiz(id, updates) {
    const idx = this.adminConfig.parentQuizzes.findIndex(q => q.id === id);
    if (idx >= 0) {
      Object.assign(this.adminConfig.parentQuizzes[idx], updates);
      this.saveAdminConfig();
      return true;
    }
    return false;
  },

  deleteParentQuiz(id) {
    this.adminConfig.parentQuizzes = this.adminConfig.parentQuizzes.filter(q => q.id !== id);
    this.saveAdminConfig();
  },

  getParentQuizzes(filter = {}) {
    let list = [...(this.adminConfig.parentQuizzes || [])];
    if (filter.category) list = list.filter(q => q.category === filter.category);
    if (filter.type) list = list.filter(q => q.type === filter.type);
    if (filter.difficulty) list = list.filter(q => q.difficulty === filter.difficulty);
    if (filter.status) list = list.filter(q => q.status === filter.status);
    return list.sort((a, b) => b.createdAt - a.createdAt);
  },

  getParentQuizById(id) {
    return this.adminConfig.parentQuizzes.find(q => q.id === id);
  },

  toggleParentQuizStatus(id) {
    const q = this.adminConfig.parentQuizzes.find(q => q.id === id);
    if (q) {
      q.status = q.status === 'active' ? 'disabled' : 'active';
      this.saveAdminConfig();
    }
  },

  // ===== 事件埋点 =====
  trackEvent(eventName, params = {}) {
    const events = Utils.loadLocal('events') || [];
    events.push({
      event: eventName,
      params: params,
      timestamp: Date.now(),
      sessionId: this._getSessionId()
    });
    // 最多保留500条
    if (events.length > 500) events.splice(0, events.length - 500);
    Utils.saveLocal('events', events);
  },

  getEvents(filter = {}) {
    const events = Utils.loadLocal('events') || [];
    let result = events;
    if (filter.event) result = result.filter(e => e.event === filter.event);
    if (filter.since) result = result.filter(e => e.timestamp >= filter.since);
    if (filter.until) result = result.filter(e => e.timestamp <= filter.until);
    return result;
  },

  clearEvents() {
    Utils.saveLocal('events', []);
  },

  _getSessionId() {
    let sid = sessionStorage.getItem('mc_session_id');
    if (!sid) {
      sid = 's_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
      sessionStorage.setItem('mc_session_id', sid);
    }
    return sid;
  },

  // 获取事件统计
  getEventStats(since = Date.now() - 7 * 86400000) {
    const events = this.getEvents({ since });
    const stats = {};
    events.forEach(e => {
      stats[e.event] = (stats[e.event] || 0) + 1;
    });
    return stats;
  }
};

// 工具函数
const Utils = {
  formatTime: (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  },
  formatMinutes: (seconds) => Math.round(seconds / 60),
  getAgeGroup: (birthYear) => {
    const age = 2026 - birthYear;
    if (age <= 6) return '3-6';
    if (age <= 9) return '7-9';
    return '10-12';
  },
  saveLocal: (key, data) => { try { localStorage.setItem('mengchong_' + key, JSON.stringify(data)); } catch(e) { console.error('存储失败:', e); if (window.App) window.App._alert('存储空间已满，部分数据可能无法保存，请清理后重试'); } },
  loadLocal: (key) => { try { const d = localStorage.getItem('mengchong_' + key); return d ? JSON.parse(d) : null; } catch(e) { console.error('读取失败:', e); return null; } },
  clearLocal: () => { Object.keys(localStorage).filter(k => k.startsWith('mengchong_')).forEach(k => localStorage.removeItem(k)); }
};

// 初始化 Data（必须在 Utils 定义之后）
Data.init();

// 导出
window.Data = Data;
window.Utils = Utils;
