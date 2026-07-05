/* ============================================
   鸢韵潍风 - Mock 数据集
   ============================================ */

const WF_DATA = {
  /* 顶部数字指标 */
  kpis: [
    { label: '非遗代表项目', value: 1742, unit: '项', suffix: '+', color: 'vermilion' },
    { label: '传承人总数', value: 836, unit: '位', suffix: '', color: 'gold' },
    { label: '国家级名录', value: 17, unit: '项', suffix: '', color: 'celadon' },
    { label: '文创衍生品', value: 5263, unit: '件', suffix: '+', color: 'vermilion' },
    { label: '年度游客量', value: 1286, unit: '万人次', suffix: '', color: 'gold' },
    { label: '工坊体验点', value: 96, unit: '处', suffix: '', color: 'celadon' }
  ],

  /* 潍坊区县非遗数量（热力地图） */
  districts: [
    { name: '奎文区', value: 86, lng: 119.13, lat: 36.71, hot: '杨家埠年画' },
    { name: '潍城区', value: 72, lng: 119.10, lat: 36.72, hot: '城关风筝' },
    { name: '寒亭区', value: 118, lng: 119.21, lat: 36.77, hot: '杨家埠木版年画' },
    { name: '坊子区', value: 54, lng: 119.16, lat: 36.65, hot: '南流风筝' },
    { name: '临朐县', value: 93, lng: 118.54, lat: 36.51, hot: '临朐手绘年画' },
    { name: '青州市', value: 126, lng: 118.48, lat: 36.68, hot: '青州挫琴' },
    { name: '诸城市', value: 110, lng: 119.41, lat: 35.99, hot: '诸城古琴' },
    { name: '寿光市', value: 88, lng: 118.79, lat: 36.85, hot: '寿光卤水制盐' },
    { name: '安丘市', value: 79, lng: 119.21, lat: 36.42, hot: '安丘泥塑' },
    { name: '高密市', value: 134, lng: 119.76, lat: 36.38, hot: '聂家庄泥塑 · 高密剪纸' },
    { name: '昌邑市', value: 61, lng: 119.41, lat: 36.86, hot: '昌邑丝绸' },
    { name: '昌乐县', value: 70, lng: 118.83, lat: 36.71, hot: '昌乐蓝宝石雕刻' }
  ],

  /* 品类分布饼图 */
  categories: [
    { name: '传统手工艺', value: 428 },
    { name: '民间美术', value: 312 },
    { name: '传统音乐', value: 156 },
    { name: '传统戏剧', value: 98 },
    { name: '民俗节庆', value: 246 },
    { name: '传统医药', value: 87 },
    { name: '民间文学', value: 135 }
  ],

  /* 热门非遗展品（3D 轮播 + 展厅） */
  heritageItems: [
    {
      id: 'kite',
      name: '龙头蜈蚣风筝',
      en: 'Dragon Centipede Kite',
      cat: '传统手工艺 · 风筝',
      region: '寒亭区',
      desc: '潍坊风筝的代表之作，以竹篾扎制龙头，纸糊龙身，长达数丈。放飞时龙头昂首、龙尾摆动，气势恢宏。',
      steps: ['选竹削篾', '扎制骨架', '糊纸绘彩', '系线试飞'],
      palette: ['#C8392F', '#C9A14A', '#2E8B7A', '#2A2520'],
      img: 'kite'
    },
    {
      id: 'claytiger',
      name: '聂家庄泥叫虎',
      en: 'Nie Family Clay Tiger',
      cat: '传统手工艺 · 泥塑',
      region: '高密市',
      desc: '聂家庄泥塑已有四百余年历史，泥叫虎可发声，色彩浓烈，造型憨态可掬，是儿童玩具与镇宅之物。',
      steps: ['取泥练土', '塑形阴干', '上粉彩绘', '装哨发声'],
      palette: ['#C8392F', '#C9A14A', '#1A1208', '#FFF6E6'],
      img: 'claytiger'
    },
    {
      id: 'newyearpic',
      name: '杨家埠木版年画',
      en: 'Yangjiabu Woodblock Print',
      cat: '民间美术 · 年画',
      region: '寒亭区',
      desc: '中国三大木版年画之一，以"刻版、印墨、套色"工艺闻名，题材涵盖门神、灶王、吉祥纳福。',
      steps: ['设计画样', '刻制木版', '印墨勾线', '套色印刷'],
      palette: ['#C8392F', '#C9A14A', '#2E8B7A', '#1F4E8C'],
      img: 'newyearpic'
    },
    {
      id: 'paper',
      name: '高密剪纸',
      en: 'Gaomi Paper Cutting',
      cat: '民间美术 · 剪纸',
      region: '高密市',
      desc: '高密剪纸线条粗犷，造型夸张，以"阴阳结合"的刀法著称，被誉为"民间艺术活化石"。',
      steps: ['选纸折页', '构图起样', '剪刻成形', '装裱成画'],
      palette: ['#C8392F', '#A82820', '#2A2520', '#FFF6E6'],
      img: 'paper'
    },
    {
      id: 'silk',
      name: '昌邑丝绸',
      en: 'Changyi Silk Weaving',
      cat: '传统手工艺 · 织造',
      region: '昌邑市',
      desc: '昌邑丝绸织造技艺繁复，质地轻柔，纹样华美，曾为贡品，是海上丝绸之路的重要货物。',
      steps: ['选茧缫丝', '染色上浆', '上机织造', '整理成匹'],
      palette: ['#C9A14A', '#E8C97A', '#9AA3B8', '#1A1208'],
      img: 'silk'
    },
    {
      id: 'guqin',
      name: '诸城派古琴',
      en: 'Zhucheng Guqin School',
      cat: '传统音乐 · 古琴',
      region: '诸城市',
      desc: '诸城派古琴形成于清末，风格刚劲苍古，代表曲目《长门怨》《关山月》传唱至今。',
      steps: ['选桐制琴', '上漆调音', '定谱习曲', '抚琴入境'],
      palette: ['#1A1208', '#5A4F44', '#C9A14A', '#2E8B7A'],
      img: 'guqin'
    }
  ],

  /* 匠人档案 */
  masters: [
    {
      name: '杨乃让',
      title: '国家级非遗传承人',
      craft: '杨家埠木版年画',
      region: '寒亭区',
      years: '从艺 56 年',
      avatar: 'M1',
      bio: '杨氏木版年画第六代传人，精通刻版与套色技艺，复原古版三百余套，作品被多家博物馆收藏。其刻刀下的门神线条遒劲，色彩沉稳，延续了杨家埠"粗看不俗，细品有味"的百年风骨。',
      video: 'https://www.w3schools.com/html/mov_bbb.mp4'
    },
    {
      name: '张效春',
      title: '国家级非遗传承人',
      craft: '潍坊风筝扎制',
      region: '寒亭区',
      years: '从艺 48 年',
      avatar: 'M2',
      bio: '自幼随父学艺，擅长龙头蜈蚣风筝扎制，作品曾在国际风筝节获金奖。其骨架讲究"对称、平衡、弹性"，彩绘融合年画风格，放飞时气韵生动，被誉为"会飞的年画"。',
      video: 'https://www.w3schools.com/html/mov_bbb.mp4'
    },
    {
      name: '聂希蔚',
      title: '国家级非遗传承人',
      craft: '聂家庄泥塑',
      region: '高密市',
      years: '从艺 60 余年',
      avatar: 'M3',
      bio: '聂家庄泥塑第二十一代传人，泥叫虎制作集大成者。改良泥料配方，使作品不易碎裂；色彩上大胆使用石绿、朱砂，造型憨拙中见灵气，让古老泥玩焕发新生。',
      video: 'https://www.w3schools.com/html/mov_bbb.mp4'
    },
    {
      name: '范祚信',
      title: '国家级非遗传承人',
      craft: '高密剪纸',
      region: '高密市',
      years: '从艺 50 年',
      avatar: 'M4',
      bio: '高密剪纸代表性人物，刀法"阴阳并济"，能在方寸之间剪出繁复纹样。代表作品《百鸡图》《富贵牡丹》被中国美术馆收藏，曾赴二十余国展演，让东方红纸艺术惊艳世界。',
      video: 'https://www.w3schools.com/html/mov_bbb.mp4'
    },
    {
      name: '李玉香',
      title: '省级非遗传承人',
      craft: '诸城派古琴',
      region: '诸城市',
      years: '从艺 38 年',
      avatar: 'M5',
      bio: '诸城派古琴第五代传人，致力于古谱打谱与传习教学。其演奏苍古刚劲，气韵悠长，主导复排《梅庵琴谱》全套曲目，培养弟子百余名，让百年琴韵薪火相传。',
      video: 'https://www.w3schools.com/html/mov_bbb.mp4'
    },
    {
      name: '王绪德',
      title: '省级非遗传承人',
      craft: '昌邑丝绸织造',
      region: '昌邑市',
      years: '从艺 42 年',
      avatar: 'M6',
      bio: '昌邑柳丝绸织造技艺传人，精通提花、妆花等复杂工艺。复原明清贡缎纹样四十余种，作品纹样华美、质地轻盈，再现了"丝绸之乡"的辉煌织造史。',
      video: 'https://www.w3schools.com/html/mov_bbb.mp4'
    }
  ],

  /* 文旅打卡点 */
  hotspots: [
    {
      name: '杨家埠民间艺术大观园',
      lng: 119.24, lat: 36.79,
      cat: '木版年画',
      region: '寒亭区',
      desc: '集年画印制、风筝扎制、民俗体验于一体的国家 4A 景区，可亲手体验刻版套色。',
      img: 'newyearpic'
    },
    {
      name: '高密聂家庄泥塑工坊',
      lng: 119.78, lat: 36.41,
      cat: '泥塑',
      region: '高密市',
      desc: '聂家庄泥塑发源地，可观摩泥叫虎制作全流程，并亲手捏塑上色。',
      img: 'claytiger'
    },
    {
      name: '高密剪纸艺术馆',
      lng: 119.76, lat: 36.38,
      cat: '剪纸',
      region: '高密市',
      desc: '收藏范祚信等大师作品千余幅，定期举办剪纸体验课堂。',
      img: 'paper'
    },
    {
      name: '潍坊世界风筝博物馆',
      lng: 119.13, lat: 36.71,
      cat: '风筝',
      region: '奎文区',
      desc: '世界最大风筝专题博物馆，藏有各国风筝珍品，每年四月举办国际风筝会。',
      img: 'kite'
    },
    {
      name: '青州挫琴传习所',
      lng: 118.48, lat: 36.68,
      cat: '传统音乐',
      region: '青州市',
      desc: '挫琴为古击弦乐器，传习所可聆听千年古韵，体验挫琴演奏。',
      img: 'guqin'
    },
    {
      name: '昌邑丝绸文化园',
      lng: 119.41, lat: 36.86,
      cat: '织造',
      region: '昌邑市',
      desc: '展示昌邑丝绸千年织造史，可参观古织机现场操作，定制丝绸文创。',
      img: 'silk'
    },
    {
      name: '临朐手绘年画村',
      lng: 118.54, lat: 36.51,
      cat: '年画',
      region: '临朐县',
      desc: '农家院落即画室，村民户户作画，可参与年画手绘并带回家。',
      img: 'newyearpic'
    },
    {
      name: '诸城古琴雅集',
      lng: 119.41, lat: 35.99,
      cat: '古琴',
      region: '诸城市',
      desc: '常超派古琴雅集举办地，月度开放，可抚琴品茗，体验文人雅事。',
      img: 'guqin'
    }
  ],

  /* 文创数据看板 */
  stats: {
    /* 销量趋势（近 12 月） */
    salesTrend: {
      months: ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'],
      online: [320, 332, 401, 538, 720, 654, 580, 612, 735, 868, 992, 1180],   // 线上销量（万元）
      offline: [220, 245, 280, 360, 520, 480, 420, 460, 540, 720, 820, 980]    // 线下销量（万元）
    },
    /* 品类销量占比 */
    categorySales: [
      { name: '风筝文创', value: 38 },
      { name: '年画衍生', value: 26 },
      { name: '泥塑摆件', value: 18 },
      { name: '剪纸装裱', value: 12 },
      { name: '丝绸织品', value: 6 }
    ],
    /* 游客访问量（近 12 月，万人次） */
    visitors: [42, 38, 56, 128, 142, 96, 88, 92, 105, 156, 138, 168],
    /* 顶栏指标 */
    kpis: [
      { label: '年度文创营收', value: 12860, unit: '万元', up: '+24.6%', color: 'gold' },
      { label: '线上订单', value: 8642, unit: '单', up: '+18.3%', color: 'celadon' },
      { label: '复购率', value: 46, unit: '%', up: '+5.2%', color: 'vermilion' },
      { label: '社交曝光', value: 3260, unit: '万次', up: '+62.8%', color: 'gold' }
    ]
  },

  /* 纹样素材库 */
  patternTags: ['全部', '风筝纹样', '年画纹样', '剪纸纹样', '丝绸纹样', '吉祥纹样'],
  patterns: [
    { id: 1, title: '龙头蜈蚣·云龙纹', cat: '风筝纹样', h: 280, palette: ['#C8392F','#C9A14A','#2A2520'], steps: 4 },
    { id: 2, title: '门神·秦琼', cat: '年画纹样', h: 340, palette: ['#C8392F','#C9A14A','#2E8B7A','#1A1208'], steps: 5 },
    { id: 3, title: '富贵牡丹', cat: '剪纸纹样', h: 240, palette: ['#C8392F','#A82820'], steps: 3 },
    { id: 4, title: '祥云瑞鹤', cat: '吉祥纹样', h: 300, palette: ['#C9A14A','#E8C97A','#2E8B7A'], steps: 4 },
    { id: 5, title: '连年有余', cat: '年画纹样', h: 260, palette: ['#C8392F','#C9A14A','#2E8B7A'], steps: 4 },
    { id: 6, title: '蝴蝶燕风筝', cat: '风筝纹样', h: 320, palette: ['#C8392F','#C9A14A','#1F4E8C'], steps: 5 },
    { id: 7, title: '丝绸团龙', cat: '丝绸纹样', h: 290, palette: ['#C9A14A','#A82820','#1A1208'], steps: 4 },
    { id: 8, title: '石榴多子', cat: '剪纸纹样', h: 250, palette: ['#C8392F','#A82820'], steps: 3 },
    { id: 9, title: '福寿三多', cat: '吉祥纹样', h: 330, palette: ['#C8392F','#C9A14A','#2E8B7A','#A82820'], steps: 5 },
    { id: 10, title: '锦地缠枝', cat: '丝绸纹样', h: 270, palette: ['#C9A14A','#2E8B7A','#1A1208'], steps: 4 },
    { id: 11, title: '灶王灶母', cat: '年画纹样', h: 310, palette: ['#C8392F','#C9A14A','#2A2520'], steps: 5 },
    { id: 12, title: '硬翅沙燕', cat: '风筝纹样', h: 240, palette: ['#C8392F','#C9A14A','#2E8B7A'], steps: 4 },
    { id: 13, title: '五福捧寿', cat: '吉祥纹样', h: 290, palette: ['#C8392F','#A82820','#C9A14A'], steps: 4 },
    { id: 14, title: '莲生贵子', cat: '剪纸纹样', h: 260, palette: ['#C8392F','#2E8B7A'], steps: 3 },
    { id: 15, title: '海水江崖', cat: '丝绸纹样', h: 320, palette: ['#1F4E8C','#C9A14A','#2E8B7A'], steps: 5 }
  ]
};

window.WF_DATA = WF_DATA;
