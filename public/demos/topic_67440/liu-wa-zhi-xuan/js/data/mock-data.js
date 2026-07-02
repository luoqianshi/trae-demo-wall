(function(window) {
  const categories = [
    { id: 'handcraft', name: '亲子手工', icon: 'palette' },
    { id: 'dance', name: '舞蹈展演', icon: 'music' },
    { id: 'music', name: '音乐演出', icon: 'headphones' },
    { id: 'lecture', name: '公益讲座', icon: 'book-open' },
    { id: 'outdoor', name: '户外运动', icon: 'tree-pine' },
    { id: 'market', name: '市集跳蚤', icon: 'shopping-bag' },
    { id: 'baking', name: '烘焙体验', icon: 'cake' },
    { id: 'reading', name: '绘本阅读', icon: 'book' },
    { id: 'science', name: '科学实验', icon: 'flask-conical' }
  ];

  const sceneTags = [
    { id: 'weekend', name: '周末带娃', color: '#E85D4E' },
    { id: 'afterwork', name: '下班路过', color: '#2A9D8F' },
    { id: 'rainy', name: '雨天室内', color: '#3B82F6' },
    { id: 'holiday', name: '假日出行', color: '#F5A623' },
    { id: 'night', name: '夜间活动', color: '#6366F1' },
    { id: 'senior', name: '银发专属', color: '#8B5CF6' }
  ];

  const activities = [
    {
      id: '1',
      title: '创意黏土手工课',
      description: '让孩子发挥想象力，用彩色黏土塑造自己的小世界。专业老师指导，材料安全无毒，适合3-8岁儿童。\n\n【活动亮点】\n• 安全无毒黏土材料，宝宝放心玩\n• 专业美术老师1对4小班教学\n• 作品可带走，留下美好纪念\n• 锻炼动手能力和空间想象力\n\n【活动流程】\n1. 老师示范基础造型（15分钟）\n2. 孩子自由创作，老师巡回指导（60分钟）\n3. 作品展示与分享（15分钟）\n\n【注意事项】\n• 建议穿着耐脏衣物\n• 家长可陪同参与\n• 活动提供所有材料工具',
      startTime: '2024-07-15T10:00:00',
      endTime: '2024-07-15T11:30:00',
      address: '朝阳区望京SOHO T1 3层亲子空间',
      latitude: 39.9987,
      longitude: 116.4716,
      minAge: 3,
      maxAge: 8,
      maxSlots: 20,
      bookedSlots: 15,
      status: 'upcoming',
      category: 'handcraft',
      tags: ['weekend', 'rainy'],
      highlights: ['亲子互动', '材料全包', '专业指导', '作品可带走'],
      coverImage: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=colorful%20clay%20art%20workshop%20for%20children%20with%20happy%20kids&image_size=landscape_16_9',
      organizer: {
        name: '童趣工坊',
        activityCount: 32,
        intro: '专注3-12岁儿童手工教育，已服务10000+家庭'
      },
      distance: 2.5
    },
    {
      id: '2',
      title: '儿童街舞体验课',
      description: '动感街舞，释放活力！专业街舞教练带领孩子感受舞蹈魅力，提升自信心和协调能力。\n\n【活动亮点】\n• 国家级街舞教练授课\n• 小班教学，因材施教\n• 培养自信与节奏感\n• 免费提供舞蹈服\n\n【活动流程】\n1. 热身运动与基础律动（20分钟）\n2. 街舞基础动作教学（60分钟）\n3. 小组展示与点评（10分钟）',
      startTime: '2024-07-15T14:00:00',
      endTime: '2024-07-15T15:30:00',
      address: '海淀区中关村创业大街 6号楼',
      latitude: 39.9976,
      longitude: 116.3149,
      minAge: 5,
      maxAge: 12,
      maxSlots: 15,
      bookedSlots: 8,
      status: 'upcoming',
      category: 'dance',
      tags: ['weekend'],
      highlights: ['专业教练', '小班教学', '免费试课', '提升自信'],
      coverImage: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=children%20hip%20hop%20dance%20class%20energetic%20kids&image_size=landscape_16_9',
      organizer: {
        name: '星舞飞扬',
        activityCount: 45,
        intro: '北京知名少儿舞蹈培训机构，拥有20+专业舞蹈教师'
      },
      distance: 5.2
    },
    {
      id: '3',
      title: '亲子音乐会',
      description: '专为儿童打造的室内音乐会，精选经典曲目，让孩子在音乐中感受美好。\n\n【活动亮点】\n• 专业交响乐团演奏\n• 互动环节多，孩子可上台\n• 曲目专为儿童编排\n• 赠送音乐启蒙手册\n\n【曲目单】\n• 小星星变奏曲\n• 动物狂欢节选段\n• 彼得与狼\n• 蓝色多瑙河',
      startTime: '2024-07-16T19:00:00',
      endTime: '2024-07-16T20:30:00',
      address: '西城区国家大剧院小剧场',
      latitude: 39.9078,
      longitude: 116.3972,
      minAge: 4,
      maxAge: 10,
      maxSlots: 100,
      bookedSlots: 78,
      status: 'upcoming',
      category: 'music',
      tags: ['night', 'holiday'],
      highlights: ['专业乐团', '互动演出', '亲子时光', '艺术启蒙'],
      coverImage: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=children%20classical%20music%20concert%20beautiful%20hall&image_size=landscape_16_9',
      organizer: {
        name: '爱乐乐团',
        activityCount: 68,
        intro: '国家级专业交响乐团，每年举办百余场儿童音乐会'
      },
      distance: 8.3
    },
    {
      id: '4',
      title: '安全教育公益讲座',
      description: '儿童安全专家主讲，涵盖交通安全、防溺水、防拐骗等实用知识，家长孩子一起学。\n\n【活动亮点】\n• 资深安全专家主讲\n• 互动情景模拟教学\n• 家长孩子共同参与\n• 免费安全手册\n\n【讲座内容】\n1. 交通安全知识\n2. 防溺水安全教育\n3. 防拐骗情景演练\n4. 家庭安全隐患排查',
      startTime: '2024-07-17T10:00:00',
      endTime: '2024-07-17T11:30:00',
      address: '丰台区青少年活动中心',
      latitude: 39.8567,
      longitude: 116.2845,
      minAge: 6,
      maxAge: 14,
      maxSlots: 50,
      bookedSlots: 42,
      status: 'upcoming',
      category: 'lecture',
      tags: ['weekend'],
      highlights: ['免费参与', '专家主讲', '互动教学', '实用知识'],
      coverImage: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=safety%20education%20lecture%20for%20children%20professional&image_size=landscape_16_9',
      organizer: {
        name: '安全守护联盟',
        activityCount: 120,
        intro: '公益安全教育组织，已走进500+学校，受益儿童超10万人'
      },
      distance: 12.1
    },
    {
      id: '5',
      title: '户外自然探索',
      description: '走进大自然，观察植物昆虫，学习生态知识。专业导师带领，安全保障。\n\n【活动亮点】\n• 资深自然导师带队\n• 专业观察工具提供\n• 探索手册打卡集章\n• 安全小礼品赠送\n\n【探索路线】\n1. 森林步道植物观察\n2. 昆虫旅馆探秘\n3. 溪流生态观察\n4. 自然笔记创作',
      startTime: '2024-07-18T09:00:00',
      endTime: '2024-07-18T12:00:00',
      address: '海淀区西山国家森林公园',
      latitude: 39.9905,
      longitude: 116.2408,
      minAge: 6,
      maxAge: 12,
      maxSlots: 25,
      bookedSlots: 18,
      status: 'upcoming',
      category: 'outdoor',
      tags: ['weekend', 'holiday'],
      highlights: ['亲近自然', '专业导师', '科普知识', '安全保障'],
      coverImage: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=children%20nature%20exploration%20outdoor%20forest%20adventure&image_size=landscape_16_9',
      organizer: {
        name: '绿野仙踪',
        activityCount: 56,
        intro: '专业自然教育机构，致力于让孩子在自然中学习成长'
      },
      distance: 6.8
    },
    {
      id: '6',
      title: '周末亲子跳蚤市场',
      description: '让孩子体验买卖乐趣，培养理财意识。摊位有限，先到先得！\n\n【活动亮点】\n• 孩子当掌柜，锻炼社交能力\n• 闲置物品循环利用\n• 亲子游戏互动区\n• 最佳小摊主评选\n\n【摊位配置】\n• 标准摊位（1.2m桌）\n• 摊位装饰套装\n• 价格标签贴纸\n• 小掌柜围裙',
      startTime: '2024-07-20T10:00:00',
      endTime: '2024-07-20T16:00:00',
      address: '朝阳区朝阳公园南门广场',
      latitude: 39.9289,
      longitude: 116.4866,
      minAge: 4,
      maxAge: 12,
      maxSlots: 30,
      bookedSlots: 22,
      status: 'upcoming',
      category: 'market',
      tags: ['weekend', 'holiday'],
      highlights: ['亲子互动', '财商培养', '环保理念', '户外畅玩'],
      coverImage: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=kids%20flea%20market%20outdoor%20colorful%20stalls&image_size=landscape_16_9',
      organizer: {
        name: '小小掌柜',
        activityCount: 78,
        intro: '专注儿童财商教育，已举办百余场亲子市集活动'
      },
      distance: 4.5
    },
    {
      id: '7',
      title: '亲子烘焙体验',
      description: '一起动手做饼干、蛋糕，享受甜蜜时光。材料优质，专业烘焙师指导。\n\n【活动亮点】\n• 进口烘焙食材\n• 专业烘焙师指导\n• 作品可打包带走\n• 亲子围裙提供\n\n【烘焙内容】\n1. 曲奇饼干制作\n2. 奶油纸杯蛋糕\n3. 创意装饰环节',
      startTime: '2024-07-21T14:00:00',
      endTime: '2024-07-21T16:00:00',
      address: '东城区王府井银泰in88 5层',
      latitude: 39.9136,
      longitude: 116.4038,
      minAge: 5,
      maxAge: 10,
      maxSlots: 12,
      bookedSlots: 9,
      status: 'upcoming',
      category: 'baking',
      tags: ['weekend', 'rainy'],
      highlights: ['亲子互动', '材料全包', '专业指导', '美味成品'],
      coverImage: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=parent%20child%20baking%20workshop%20happy%20making%20cookies&image_size=landscape_16_9',
      organizer: {
        name: '甜蜜工坊',
        activityCount: 42,
        intro: '高端亲子烘焙品牌，进口食材，专业教学，好评如潮'
      },
      distance: 7.2
    },
    {
      id: '8',
      title: '绘本故事会',
      description: '精选优秀绘本，专业老师声情并茂讲述，激发孩子阅读兴趣。\n\n【活动亮点】\n• 资深绘本讲师\n• 精选国际获奖绘本\n• 互动提问启发思考\n• 手工延伸活动\n\n【本期绘本】\n• 《猜猜我有多爱你》\n• 《好饿的毛毛虫》\n• 《大卫不可以》',
      startTime: '2024-07-22T10:30:00',
      endTime: '2024-07-22T11:30:00',
      address: '朝阳区三里屯pageone书店',
      latitude: 39.9397,
      longitude: 116.4608,
      minAge: 2,
      maxAge: 6,
      maxSlots: 30,
      bookedSlots: 25,
      status: 'upcoming',
      category: 'reading',
      tags: ['weekend', 'rainy'],
      highlights: ['阅读启蒙', '专业讲师', '互动教学', '免费参与'],
      coverImage: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=children%20picture%20book%20storytime%20cozy%20library&image_size=landscape_16_9',
      organizer: {
        name: '悦读时光',
        activityCount: 89,
        intro: '专业儿童阅读推广机构，已服务5000+家庭'
      },
      distance: 3.8
    },
    {
      id: '9',
      title: '科学实验小课堂',
      description: '有趣的科学小实验，让孩子亲手操作，探索科学奥秘。\n\n【活动亮点】\n• 趣味科学实验\n• 专业器材设备\n• 科学原理讲解\n• 实验报告手册\n\n【实验内容】\n1. 火山爆发实验\n2. 彩虹牛奶实验\n3. 自制水晶生长\n4. 静电现象探索',
      startTime: '2024-07-23T14:00:00',
      endTime: '2024-07-23T15:30:00',
      address: '海淀区科技馆少儿活动区',
      latitude: 39.9778,
      longitude: 116.3065,
      minAge: 6,
      maxAge: 12,
      maxSlots: 20,
      bookedSlots: 14,
      status: 'upcoming',
      category: 'science',
      tags: ['weekend', 'rainy'],
      highlights: ['趣味实验', '科学启蒙', '动手能力', '专业器材'],
      coverImage: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=children%20science%20experiment%20class%20colorful%20chemicals&image_size=landscape_16_9',
      organizer: {
        name: '小小科学家',
        activityCount: 65,
        intro: '专业少儿科学教育品牌，STEM教育理念，让孩子爱上科学'
      },
      distance: 5.5
    },
    {
      id: '10',
      title: '京剧脸谱绘画',
      description: '体验中国传统文化，绘制精美京剧脸谱，了解脸谱背后的故事。\n\n【活动亮点】\n• 非遗传承人授课\n• 传统脸谱知识讲解\n• 专业绘画材料\n• 作品可带回家\n\n【活动内容】\n1. 京剧脸谱知识讲解\n2. 脸谱颜色含义介绍\n3. 亲手绘制脸谱\n4. 作品展示交流',
      startTime: '2024-07-25T10:00:00',
      endTime: '2024-07-25T11:30:00',
      address: '西城区梅兰芳大剧院',
      latitude: 39.9235,
      longitude: 116.3618,
      minAge: 5,
      maxAge: 12,
      maxSlots: 18,
      bookedSlots: 11,
      status: 'upcoming',
      category: 'handcraft',
      tags: ['weekend'],
      highlights: ['传统文化', '非遗体验', '专业指导', '作品可带走'],
      coverImage: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=chinese%20opera%20mask%20painting%20workshop%20traditional&image_size=landscape_16_9',
      organizer: {
        name: '国粹传承',
        activityCount: 28,
        intro: '专注传统文化推广，非遗传承人团队，让孩子了解国粹'
      },
      distance: 9.1
    },
    {
      id: '11',
      title: '芭蕾舞启蒙课',
      description: '优雅的芭蕾舞，培养孩子的气质和形体美。专业芭蕾老师授课。\n\n【活动亮点】\n• 专业芭蕾教师\n• 小班精品教学\n• 免费舞蹈服试穿\n• 形体气质培养\n\n【课程内容】\n1. 芭蕾基础站姿\n2. 手位脚位练习\n3. 简单组合学习\n4. 形体拉伸放松',
      startTime: '2024-07-26T16:00:00',
      endTime: '2024-07-26T17:30:00',
      address: '朝阳区国贸商城 3层艺术中心',
      latitude: 39.9086,
      longitude: 116.4775,
      minAge: 4,
      maxAge: 8,
      maxSlots: 10,
      bookedSlots: 6,
      status: 'upcoming',
      category: 'dance',
      tags: ['afterwork'],
      highlights: ['气质培养', '专业老师', '小班教学', '免费体验'],
      coverImage: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=children%20ballet%20class%20graceful%20little%20ballerinas&image_size=landscape_16_9',
      organizer: {
        name: '天鹅湖艺术',
        activityCount: 52,
        intro: '专业少儿芭蕾培训中心，教师均毕业于专业舞蹈院校'
      },
      distance: 6.3
    },
    {
      id: '12',
      title: '儿童音乐剧',
      description: '精彩的儿童音乐剧表演，互动性强，让孩子沉浸在艺术的海洋。\n\n【活动亮点】\n• 专业儿童剧团演出\n• 全程互动环节多\n• 高品质舞台效果\n• 剧情寓教于乐\n\n【剧情简介】\n讲述小木偶皮诺曹的冒险故事，教会孩子诚实、勇敢的品质。',
      startTime: '2024-07-27T19:30:00',
      endTime: '2024-07-27T21:00:00',
      address: '东城区东图剧场',
      latitude: 39.9185,
      longitude: 116.4283,
      minAge: 3,
      maxAge: 10,
      maxSlots: 80,
      bookedSlots: 55,
      status: 'upcoming',
      category: 'music',
      tags: ['night'],
      highlights: ['专业演出', '互动性强', '寓教于乐', '亲子时光'],
      coverImage: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=children%20musical%20theater%20colorful%20stage%20performance&image_size=landscape_16_9',
      organizer: {
        name: '童话剧团',
        activityCount: 95,
        intro: '北京知名儿童剧团，原创剧目20+部，年演出超300场'
      },
      distance: 8.0
    },
    {
      id: '13',
      title: '家庭教育讲座',
      description: '知名教育专家分享育儿经验，解答家长困惑，助力孩子健康成长。\n\n【活动亮点】\n• 知名教育专家主讲\n• 真实案例分析\n• 现场答疑解惑\n• 实用方法指导\n\n【讲座主题】\n如何培养孩子的学习兴趣和良好习惯',
      startTime: '2024-07-28T14:00:00',
      endTime: '2024-07-28T16:00:00',
      address: '海淀区中关村软件园国际会议中心',
      latitude: 40.0128,
      longitude: 116.2878,
      minAge: 0,
      maxAge: 18,
      maxSlots: 200,
      bookedSlots: 160,
      status: 'upcoming',
      category: 'lecture',
      tags: ['weekend'],
      highlights: ['专家主讲', '免费参与', '现场答疑', '实用干货'],
      coverImage: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=parenting%20education%20seminar%20professional%20speakers&image_size=landscape_16_9',
      organizer: {
        name: '智慧父母',
        activityCount: 150,
        intro: '专业家庭教育平台，汇聚百余位教育专家，服务百万家长'
      },
      distance: 10.5
    },
    {
      id: '14',
      title: '亲子露营体验',
      description: '远离城市喧嚣，享受户外露营乐趣。专业装备，安全舒适。\n\n【活动亮点】\n• 专业露营装备提供\n• 丰富亲子活动\n• 露天电影烧烤\n• 看星空看日出\n\n【活动安排】\nDay1: 集合签到 → 搭建帐篷 → 户外拓展 → 烧烤晚餐 → 篝火晚会 → 露天电影\nDay2: 观赏日出 → 晨间瑜伽 → 营养早餐 → 自然探索 → 收拾返程',
      startTime: '2024-07-29T15:00:00',
      endTime: '2024-07-30T10:00:00',
      address: '延庆区野鸭湖国家湿地公园',
      latitude: 40.4052,
      longitude: 115.9758,
      minAge: 4,
      maxAge: 12,
      maxSlots: 15,
      bookedSlots: 10,
      status: 'upcoming',
      category: 'outdoor',
      tags: ['holiday'],
      highlights: ['亲子露营', '星空夜话', '烧烤美食', '自然探索'],
      coverImage: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=family%20camping%20experience%20tent%20outdoor%20nature&image_size=landscape_16_9',
      organizer: {
        name: '野趣户外',
        activityCount: 38,
        intro: '专业亲子户外俱乐部，安全保障完善，活动设计丰富有趣'
      },
      distance: 55.2
    },
    {
      id: '15',
      title: '旧物改造市集',
      description: '变废为宝，创意无限！带上家里的旧物品，一起改造再利用。\n\n【活动亮点】\n• 环保理念培养\n• 创意动手能力\n• 专业老师指导\n• 作品可带回家\n\n【改造内容】\n1. 旧衣物改造\n2. 瓶罐创意装饰\n3. 纸箱手工制作\n4. 旧物交换区',
      startTime: '2024-08-01T10:00:00',
      endTime: '2024-08-01T15:00:00',
      address: '朝阳区798艺术区',
      latitude: 39.9968,
      longitude: 116.4958,
      minAge: 6,
      maxAge: 14,
      maxSlots: 20,
      bookedSlots: 13,
      status: 'upcoming',
      category: 'market',
      tags: ['weekend'],
      highlights: ['环保创意', '动手能力', '专业指导', '材料全包'],
      coverImage: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=upcycling%20market%20creative%20reuse%20crafts%20fair&image_size=landscape_16_9',
      organizer: {
        name: '创意市集',
        activityCount: 42,
        intro: '致力于推广环保理念的创意市集，让旧物焕发新生'
      },
      distance: 4.0
    },
    {
      id: '16',
      title: '披萨DIY体验',
      description: '自己动手做披萨，从揉面到烘烤，体验美食制作的乐趣。\n\n【活动亮点】\n• 意式风味食材\n• 专业厨师指导\n• 自己做的披萨自己吃\n• 亲子围裙提供\n\n【制作内容】\n1. 披萨饼底制作\n2. 番茄酱涂抹\n3. 芝士和配料铺放\n4. 烤箱烘焙等待',
      startTime: '2024-08-03T15:00:00',
      endTime: '2024-08-03T17:00:00',
      address: '海淀区五彩城购物中心',
      latitude: 40.0152,
      longitude: 116.3456,
      minAge: 5,
      maxAge: 12,
      maxSlots: 15,
      bookedSlots: 8,
      status: 'upcoming',
      category: 'baking',
      tags: ['afterwork'],
      highlights: ['美食DIY', '亲子互动', '专业指导', '美味成品'],
      coverImage: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=kids%20pizza%20making%20workshop%20cheese%20toppings&image_size=landscape_16_9',
      organizer: {
        name: '小小厨师',
        activityCount: 58,
        intro: '儿童厨艺培训品牌，让孩子在动手中学到生活技能'
      },
      distance: 6.8
    },
    {
      id: '17',
      title: '睡前故事夜读会',
      description: '温馨的夜间阅读时光，在柔和的灯光下听故事，伴孩子入眠。\n\n【活动亮点】\n• 温馨氛围营造\n• 精选睡前故事\n• 舒缓音乐背景\n• 亲子阅读指导\n\n【本期故事】\n• 《月亮的味道》\n• 《猜猜我有多爱你》\n• 《逃家小兔》',
      startTime: '2024-08-05T19:00:00',
      endTime: '2024-08-05T20:00:00',
      address: '朝阳区朝阳大悦城西西弗书店',
      latitude: 39.9258,
      longitude: 116.5289,
      minAge: 3,
      maxAge: 7,
      maxSlots: 25,
      bookedSlots: 19,
      status: 'upcoming',
      category: 'reading',
      tags: ['night'],
      highlights: ['温馨夜读', '睡前故事', '亲子时光', '免费参与'],
      coverImage: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=bedtime%20story%20reading%20night%20cozy%20warm%20lights&image_size=landscape_16_9',
      organizer: {
        name: '晚安故事',
        activityCount: 72,
        intro: '专注睡前阅读推广，帮助孩子养成良好阅读习惯'
      },
      distance: 5.6
    },
    {
      id: '18',
      title: '机器人编程体验',
      description: '零基础入门机器人编程，培养孩子的逻辑思维和创造力。\n\n【活动亮点】\n• 专业编程教具\n• 趣味闯关任务\n• 编程思维培养\n• 作品可演示\n\n【课程内容】\n1. 机器人组件认识\n2. 基础编程逻辑\n3. 任务挑战编程\n4. 成果展示分享',
      startTime: '2024-08-08T10:00:00',
      endTime: '2024-08-08T11:30:00',
      address: '海淀区中关村科技园区',
      latitude: 39.9985,
      longitude: 116.3128,
      minAge: 7,
      maxAge: 14,
      maxSlots: 12,
      bookedSlots: 7,
      status: 'upcoming',
      category: 'science',
      tags: ['weekend'],
      highlights: ['编程启蒙', '机器人', '逻辑思维', '动手实践'],
      coverImage: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=children%20robot%20programming%20class%20technology%20fun&image_size=landscape_16_9',
      organizer: {
        name: '未来创客',
        activityCount: 48,
        intro: '青少年编程教育品牌，STEM教育理念，培养未来创新人才'
      },
      distance: 5.0
    },
    {
      id: '19',
      title: '非遗剪纸体验',
      description: '感受中国传统剪纸艺术，学习基本技法，创作属于自己的剪纸作品。\n\n【活动亮点】\n• 非遗传承人亲授\n• 传统剪纸技艺\n• 红纸剪刀提供\n• 作品装裱带走\n\n【学习内容】\n1. 剪纸历史文化介绍\n2. 基本剪法技巧\n3. 对称纹样练习\n4. 创作个人作品',
      startTime: '2024-08-10T14:00:00',
      endTime: '2024-08-10T15:30:00',
      address: '东城区非遗文化体验中心',
      latitude: 39.9156,
      longitude: 116.4052,
      minAge: 6,
      maxAge: 12,
      maxSlots: 16,
      bookedSlots: 12,
      status: 'upcoming',
      category: 'handcraft',
      tags: ['weekend'],
      highlights: ['非遗体验', '传统文化', '专业指导', '作品可带走'],
      coverImage: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=chinese%20paper%20cutting%20art%20workshop%20traditional&image_size=landscape_16_9',
      organizer: {
        name: '非遗传承',
        activityCount: 35,
        intro: '致力于非物质文化遗产传承与推广的文化机构'
      },
      distance: 7.5
    },
    {
      id: '20',
      title: '老年亲子互动活动',
      description: '祖孙同乐，增进隔代感情。适合爷爷奶奶带孙辈一起参加。\n\n【活动亮点】\n• 祖孙共同参与\n• 怀旧游戏体验\n• 手工作品制作\n• 合影留念赠送\n\n【活动内容】\n1. 怀旧游戏大比拼\n2. 祖孙手牵手DIY\n3. 故事分享时光\n4. 全家福合影',
      startTime: '2024-08-12T10:00:00',
      endTime: '2024-08-12T12:00:00',
      address: '朝阳区太阳宫社区活动中心',
      latitude: 39.9678,
      longitude: 116.4785,
      minAge: 4,
      maxAge: 10,
      maxSlots: 30,
      bookedSlots: 20,
      status: 'upcoming',
      category: 'handcraft',
      tags: ['senior', 'weekend'],
      highlights: ['祖孙同乐', '温馨互动', '免费参与', '社区活动'],
      coverImage: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=grandparents%20grandchildren%20activity%20happy%20family&image_size=landscape_16_9',
      organizer: {
        name: '幸福社区',
        activityCount: 85,
        intro: '社区公益活动组织者，致力于打造温馨和谐的社区生活'
      },
      distance: 3.2
    }
  ];

  const defaultUser = {
    id: 'default-user',
    name: '用户',
    avatar: '',
    phone: '',
    location: '北京市',
    childAge: 5,
    preferences: ['handcraft', 'reading', 'music']
  };

  const messages = [
    {
      id: 'm1',
      type: 'system',
      title: '欢迎使用趣享本地',
      content: '感谢您的注册！我们为您推荐了一些适合5岁儿童的活动，快去看看吧~',
      read: false,
      createdAt: '2024-07-10T09:00:00'
    },
    {
      id: 'm2',
      type: 'subscription',
      title: '您关注的「亲子手工」有新活动',
      content: '「创意黏土手工课」正在报名中，名额有限，先到先得！',
      read: false,
      createdAt: '2024-07-12T10:30:00'
    },
    {
      id: 'm3',
      type: 'reminder',
      title: '活动即将开始',
      content: '您报名的「绘本故事会」明天上午10:30开始，请准时参加。',
      read: true,
      createdAt: '2024-07-14T15:00:00'
    },
    {
      id: 'm4',
      type: 'review',
      title: '活动审核通过',
      content: '您报名的「亲子烘焙体验」已审核通过，期待您的参与！',
      read: true,
      createdAt: '2024-07-13T14:00:00'
    },
    {
      id: 'm5',
      type: 'system',
      title: '会员权益升级',
      content: '恭喜您成为银卡会员！享受95折优惠和优先报名特权。',
      read: false,
      createdAt: '2024-07-11T16:00:00'
    }
  ];

  function initializeActivityTimes() {
    const now = new Date();
    const baseDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    baseDate.setDate(baseDate.getDate() + 1);

    activities.forEach((activity, index) => {
      const startDate = new Date(baseDate);
      startDate.setDate(startDate.getDate() + Math.floor(index / 3));
      
      const startTime = new Date(activity.startTime);
      startDate.setHours(startTime.getHours(), startTime.getMinutes(), 0, 0);
      
      const endTime = new Date(activity.endTime);
      const endDate = new Date(startDate);
      const durationMs = endTime - startTime;
      endDate.setTime(endDate.getTime() + durationMs);

      activity.startTime = startDate.toISOString().slice(0, 19);
      activity.endTime = endDate.toISOString().slice(0, 19);
    });

    messages.forEach((msg, index) => {
      const msgDate = new Date(now);
      msgDate.setDate(msgDate.getDate() - (messages.length - 1 - index));
      msg.createdAt = msgDate.toISOString().slice(0, 19);
    });
  }

  initializeActivityTimes();

  function enrichActivityData() {
    const transportOptions = [
      { subway: '地铁10号线望京站A口出，步行5分钟', bus: '公交404路、361路望京街站', parking: '园区内有地下停车场，约200个车位，前2小时免费' },
      { subway: '地铁4号线中关村站C口出，步行8分钟', bus: '公交302路、731路中关村南站', parking: '大厦地下停车场，5元/小时' },
      { subway: '地铁1号线天安门西站B口出，步行10分钟', bus: '公交1路、52路天安门西站', parking: '国家大剧院地下停车场，8元/小时' },
      { subway: '地铁9号线丰台南路站D口出，步行6分钟', bus: '公交83路、694路丰台体育中心站', parking: '活动中心院内免费停车，约50个车位' },
      { subway: '地铁西郊线香山站B口出，换乘景区摆渡车', bus: '公交318路、360路森林公园站', parking: '景区停车场，10元/次，约500个车位' },
      { subway: '地铁14号线朝阳公园站B口出，步行3分钟', bus: '公交419路、677路朝阳公园南门站', parking: '朝阳公园南门停车场，6元/小时' },
      { subway: '地铁1号线王府井站C口出，步行5分钟', bus: '公交103路、104路王府井站', parking: '银泰中心地下停车场，10元/小时' },
      { subway: '地铁10号线团结湖站D口出，步行6分钟', bus: '公交115路、117路三里屯站', parking: '商场地下停车场，前1小时免费' },
      { subway: '地铁10号线牡丹园站C口出，步行7分钟', bus: '公交21路、304路牡丹园西站', parking: '科技馆地下停车场，5元/小时' },
      { subway: '地铁2号线车公庄站B口出，步行8分钟', bus: '公交105路、111路平安里站', parking: '剧院停车场，8元/小时' },
      { subway: '地铁1号线国贸站E口出，步行5分钟', bus: '公交1路、28路大北窑站', parking: '国贸商城地下停车场，10元/小时' },
      { subway: '地铁5号线东四站B口出，步行6分钟', bus: '公交106路、116路东四站', parking: '剧院门前停车场，6元/小时' },
      { subway: '地铁13号线西二旗站A口出，步行10分钟', bus: '公交333路、963路软件园广场站', parking: '会议中心停车场，免费停车' },
      { subway: '地铁德胜门站换乘919路直达', bus: '公交919路、880路野鸭湖站', parking: '景区停车场，10元/次' },
      { subway: '地铁14号线将台站A口出，步行8分钟', bus: '公交401路、402路大山子路口南站', parking: '艺术区停车场，5元/小时' },
      { subway: '地铁13号线上地站B口出，步行10分钟', bus: '公交328路、419路上地站', parking: '购物中心地下停车场，前2小时免费' },
      { subway: '地铁6号线青年路站B口出，步行3分钟', bus: '公交75路、126路青年路口站', parking: '大悦城地下停车场，6元/小时' },
      { subway: '地铁10号线知春里站A口出，步行6分钟', bus: '公交304路、386路知春里站', parking: '科技园停车场，5元/小时' },
      { subway: '地铁5号线灯市口站C口出，步行7分钟', bus: '公交106路、108路灯市东口站', parking: '中心停车场，8元/小时' },
      { subway: '地铁10号线太阳宫站B口出，步行5分钟', bus: '公交130路、567路太阳宫站', parking: '社区活动中心免费停车' }
    ];

    const facilitiesOptions = [
      ['卫生间', '母婴室', '休息区', 'WiFi', '饮水机'],
      ['卫生间', '休息区', 'WiFi', '更衣室', '储物柜'],
      ['卫生间', '休息区', '饮水处', '小卖部'],
      ['卫生间', '休息区', 'WiFi', '饮水处'],
      ['卫生间', '休息区', '小卖部', '急救站'],
      ['卫生间', '休息区', '饮水处', '遮阳棚'],
      ['卫生间', '母婴室', '休息区', 'WiFi', '储物柜'],
      ['卫生间', '休息区', 'WiFi', '饮水处'],
      ['卫生间', '休息区', 'WiFi', '储物柜'],
      ['卫生间', '休息区', '饮水处', '储物柜'],
      ['卫生间', '母婴室', '休息区', '更衣室', '储物柜'],
      ['卫生间', '休息区', '小卖部', '饮水处'],
      ['卫生间', '休息区', 'WiFi', '饮水处'],
      ['卫生间', '淋浴间', '休息区', '小卖部', '急救站'],
      ['卫生间', '休息区', 'WiFi', '饮水处'],
      ['卫生间', '休息区', '储物柜', '洗手台'],
      ['卫生间', '休息区', 'WiFi', '饮水处'],
      ['卫生间', '休息区', 'WiFi', '储物柜'],
      ['卫生间', '休息区', '饮水处', '储物柜'],
      ['卫生间', '休息区', 'WiFi', '饮水处']
    ];

    const tipsOptions = [
      ['建议穿着舒适的衣服和鞋子', '可携带水杯，活动场地有饮水处', '活动提供所有材料工具', '家长可陪同参与'],
      ['建议穿着运动服装', '请提前10分钟到达签到', '免费提供舞蹈服', '活动后可领取小礼品'],
      ['建议提前30分钟入场', '场内禁止饮食', '1.2米以下儿童需家长陪同', '可携带水杯'],
      ['请家长全程陪同孩子', '建议携带纸笔记录笔记', '活动提供免费资料手册', '现场有互动环节请积极参与'],
      ['建议穿着舒适的运动鞋', '请做好防晒措施', '可携带驱蚊水', '建议携带水杯和小零食', '活动提供观察工具'],
      ['建议给孩子准备零花钱', '可携带遮阳帽和水', '现场有休息区', '建议穿舒适的鞋子'],
      ['建议穿着耐脏的衣服', '活动提供所有食材和工具', '成品可打包带走', '家长可陪同参与'],
      ['建议家长陪同参与', '可携带孩子喜欢的绘本', '活动后有手工延伸环节', '现场提供饮用水'],
      ['建议穿着便于活动的衣服', '活动提供所有实验器材', '请遵守安全规范', '家长可陪同观看'],
      ['建议穿着舒适的衣服', '活动提供绘画材料', '作品可带回家', '可携带水杯'],
      ['建议穿着宽松舒适的衣服', '可自带舞蹈鞋或袜子', '提前10分钟到达', '免费提供试穿舞蹈服'],
      ['建议提前30分钟入场', '场内禁止摄影摄像', '可携带小零食', '1米以下儿童免票'],
      ['请提前15分钟入场', '建议携带纸笔记录', '现场有答疑环节', '提供免费资料'],
      ['建议穿着休闲运动装', '请做好防晒和防蚊准备', '营地提供帐篷和睡袋', '可携带个人洗漱用品', '晚上气温较低建议带外套'],
      ['建议穿着耐脏的衣服', '可携带家里的旧物品', '活动提供改造工具和材料', '作品可带回家'],
      ['建议穿着舒适的衣服', '活动提供所有食材和工具', '成品可当场食用', '建议提前洗手做好卫生'],
      ['建议穿着舒适的睡衣或家居服', '可携带孩子熟悉的安抚物', '活动现场灯光柔和', '建议提前到达选好位置'],
      ['建议穿着便于活动的衣服', '活动提供所有器材', '请遵守安全操作规范', '家长可陪同参与'],
      ['建议穿着舒适的衣服', '活动提供所有材料工具', '作品可装裱带走', '可携带水杯'],
      ['建议穿着舒适的衣服', '活动提供手工材料', '祖孙共同参与效果更佳', '现场提供饮用水']
    ];

    const reviewTemplates = [
      [
        { user: '宝妈小李', rating: 5, content: '老师很有耐心，孩子玩得特别开心！材料也很安全，下次还会再来！', time: '3天前', likes: 23 },
        { user: '浩浩妈妈', rating: 5, content: '环境很好，老师专业，孩子收获满满，作品还能带回家，非常推荐！', time: '1周前', likes: 18 },
        { user: '萱萱爸', rating: 4, content: '整体不错，就是场地稍微小了点，孩子玩得很开心。', time: '2周前', likes: 12 },
        { user: '糖糖妈', rating: 5, content: '材料安全无毒，老师很会引导孩子，强烈推荐！', time: '5天前', likes: 31 }
      ],
      [
        { user: '街舞小王子妈妈', rating: 5, content: '教练非常专业，孩子学的很认真，已经报了正式课！', time: '2天前', likes: 28 },
        { user: '朵朵妈妈', rating: 5, content: '老师很有亲和力，孩子从害羞到主动参与，进步很大！', time: '4天前', likes: 15 },
        { user: '轩轩爸', rating: 4, content: '体验课不错，就是时间稍微短了点，孩子意犹未尽。', time: '1周前', likes: 9 },
        { user: '琪琪妈', rating: 5, content: '舞蹈教室环境很好，老师专业，强烈推荐！', time: '3天前', likes: 22 }
      ],
      [
        { user: '音乐爱好者', rating: 5, content: '非常棒的音乐会！孩子第一次听音乐会，全程都很专注！', time: '1天前', likes: 45 },
        { user: '乐乐妈妈', rating: 5, content: '曲目选得很好，互动环节也多，孩子特别喜欢！', time: '3天前', likes: 38 },
        { user: '悦悦爸', rating: 5, content: '专业乐团就是不一样，音质效果很棒，值回票价！', time: '5天前', likes: 29 },
        { user: '萌萌妈', rating: 4, content: '整体很好，就是座位稍微有点挤，下次早点来。', time: '1周前', likes: 16 }
      ],
      [
        { user: '安全意识强的妈妈', rating: 5, content: '非常实用的讲座！学到了很多安全知识，强烈推荐家长们都来听听！', time: '2天前', likes: 52 },
        { user: '阳阳妈妈', rating: 5, content: '专家讲得很好，案例分析很到位，收获很大。', time: '4天前', likes: 34 },
        { user: '彤彤爸', rating: 5, content: '情景模拟环节很真实，孩子也学到了很多。', time: '1周前', likes: 27 },
        { user: '菲菲妈', rating: 4, content: '内容很好，就是时间有点长，孩子坐不住。', time: '3天前', likes: 19 }
      ],
      [
        { user: '自然爱好者', rating: 5, content: '导师很专业，学到了很多植物知识，孩子大开眼界！', time: '1天前', likes: 36 },
        { user: '小雨妈妈', rating: 5, content: '路线设计合理，安全保障到位，孩子玩得很开心！', time: '3天前', likes: 28 },
        { user: '小宇爸', rating: 5, content: '亲近大自然的好活动，下次还会参加！', time: '5天前', likes: 23 },
        { user: '朵朵妈', rating: 4, content: '活动不错，就是天气有点热，建议早一点出发就好了。', time: '2周前', likes: 14 }
      ]
    ];

    const prices = [0, 99, 128, 0, 168, 50, 68, 0, 188, 120, 0, 158, 0, 299, 0, 189, 0, 149, 99, 0];
    const venueTypes = ['indoor', 'indoor', 'indoor', 'indoor', 'outdoor', 'outdoor', 'indoor', 'indoor', 'indoor', 'indoor', 'indoor', 'indoor', 'indoor', 'outdoor', 'mixed', 'indoor', 'indoor', 'indoor', 'indoor', 'indoor'];
    const durations = [90, 90, 90, 90, 180, 360, 120, 60, 90, 90, 90, 90, 120, 1140, 300, 120, 60, 90, 90, 120];

    activities.forEach((activity, index) => {
      activity.transport = transportOptions[index % transportOptions.length];
      activity.facilities = facilitiesOptions[index % facilitiesOptions.length];
      activity.tips = tipsOptions[index % tipsOptions.length];
      activity.price = prices[index];
      activity.venueType = venueTypes[index % venueTypes.length];
      activity.durationMinutes = durations[index];

      const reviewSet = reviewTemplates[index % reviewTemplates.length];
      activity.reviews = reviewSet.map((review, idx) => ({
        id: `r${index}_${idx}`,
        ...review,
        avatar: ''
      }));

      activity.activityHighlights = activity.highlights || [];
    });
  }

  enrichActivityData();

  const inspirationCards = [
    {
      id: 'art',
      title: '艺术熏陶日',
      subtitle: '培养审美，激发创意',
      activityCount: 3,
      theme: 'art',
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      activities: ['10', '3', '12'],
      description: '带娃走进艺术的世界，感受美的力量'
    },
    {
      id: 'outdoor',
      title: '户外探险日',
      subtitle: '亲近自然，释放活力',
      activityCount: 3,
      theme: 'outdoor',
      gradient: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
      activities: ['5', '14', '6'],
      description: '走进大自然，让孩子在阳光下奔跑成长'
    },
    {
      id: 'science',
      title: '科学探索日',
      subtitle: '动手实践，启迪智慧',
      activityCount: 3,
      theme: 'science',
      gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      activities: ['9', '18', '4'],
      description: '有趣的科学实验，激发孩子的求知欲'
    }
  ];

  const quickReplies = [
    { id: 'refresh', text: '换一批', icon: 'refresh' },
    { id: 'nearby', text: '附近的', icon: 'map-pin' },
    { id: 'weekend', text: '周末的', icon: 'calendar' },
    { id: 'age3', text: '适合3岁', icon: 'baby' }
  ];

  const MockData = {
    activities,
    categories,
    sceneTags,
    defaultUser,
    messages,
    inspirationCards,
    quickReplies,

    getActivityById(id) {
      return this.activities.find(item => item.id === id);
    },

    getActivitiesByCategory(categoryId) {
      return this.activities.filter(item => item.category === categoryId);
    },

    getActivitiesByTag(tagId) {
      return this.activities.filter(item => item.tags.includes(tagId));
    },

    searchActivities(keyword) {
      const lowerKeyword = keyword.toLowerCase();
      return this.activities.filter(item =>
        item.title.toLowerCase().includes(lowerKeyword) ||
        item.description.toLowerCase().includes(lowerKeyword) ||
        item.tags.some(tag => tag.toLowerCase().includes(lowerKeyword))
      );
    },

    getUpcomingActivities() {
      const now = new Date();
      return this.activities.filter(item => new Date(item.startTime) > now);
    },

    getCategoryById(id) {
      return this.categories.find(item => item.id === id);
    },

    getSceneTagById(id) {
      return this.sceneTags.find(item => item.id === id);
    },

    getInspirationCardById(id) {
      return this.inspirationCards.find(item => item.id === id);
    },

    generateItinerary(date, duration, age, preferences) {
      const allActivities = this.getUpcomingActivities();
      let filtered = allActivities.filter(a => a.minAge <= age && a.maxAge >= age);

      if (preferences && preferences.length > 0) {
        const preferred = filtered.filter(a => preferences.includes(a.category));
        if (preferred.length >= 2) {
          filtered = preferred;
        }
      }

      const sorted = [...filtered].sort((a, b) => a.distance - b.distance);
      const activityCount = duration === 'half' ? 2 : 3;
      const selected = sorted.slice(0, activityCount);

      const lunchSpots = [
        { name: '亲子主题餐厅', type: 'restaurant', distance: 1.2, cuisine: '儿童餐/家常菜' },
        { name: '欢乐儿童餐厅', type: 'restaurant', distance: 0.8, cuisine: '西式简餐/甜品' },
        { name: '宝贝食光', type: 'restaurant', distance: 1.5, cuisine: '营养套餐/辅食' }
      ];

      const lunch = lunchSpots[Math.floor(Math.random() * lunchSpots.length)];

      const transportTips = [
        '建议自驾前往，停车场充足',
        '地铁X号线XX站下车，步行5分钟',
        '公交XX路直达，门口有站点'
      ];

      return {
        activities: selected,
        lunch,
        transportTip: transportTips[Math.floor(Math.random() * transportTips.length)],
        totalDuration: duration === 'half' ? '约3小时' : '约6小时',
        date
      };
    }
  };

  window.MockData = MockData;
})(window);