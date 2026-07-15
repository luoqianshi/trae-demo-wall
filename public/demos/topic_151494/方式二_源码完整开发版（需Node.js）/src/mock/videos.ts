import type { DouyinVideo } from '@/types'

const cover = (seed: string) => {
  const covers: Record<string, string> = {
    opera1: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=chinese%20beijing%20opera%20performance%20traditional%20costume%20colorful%20stage%20elegant&image_size=landscape_4_3',
    opera2: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=chinese%20henan%20opera%20yu%20opera%20performance%20traditional%20theater&image_size=landscape_4_3',
    dance1: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=chinese%20elderly%20people%20square%20dance%20park%20colorful%20happy%20group%20morning&image_size=landscape_4_3',
    health1: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=chinese%20elderly%20health%20massage%20abdomen%20wellness%20warm%20peaceful&image_size=landscape_4_3',
    health2: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=traditional%20chinese%20medicine%20acupressure%20elderly%20health%20care&image_size=landscape_4_3',
    food1: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=chinese%20braised%20pork%20belly%20hongshao%20rou%20delicious%20homemade%20food%20warm&image_size=landscape_4_3',
    food2: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=chinese%20handmade%20noodles%20rolling%20pin%20traditional%20cooking%20kitchen&image_size=landscape_4_3',
    food3: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=chinese%20northeast%20style%20steamed%20buns%20sauerkraut%20filling%20homemade&image_size=landscape_4_3',
    rural1: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=chinese%20countryside%20farm%20autumn%20persimmon%20harvest%20peaceful%20village&image_size=landscape_4_3',
    fraud1: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=elderly%20finance%20scam%20warning%20red%20danger%20sign%20retirement%20home&image_size=landscape_4_3',
    fraud2: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=online%20click%20farm%20scam%20warning%20elderly%20phone%20red%20alert&image_size=landscape_4_3',
    anti1: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=chinese%20official%20anti%20fraud%20education%20poster%20government%20serious%20elderly&image_size=landscape_4_3',
    anti2: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=online%20scam%20fraud%20warning%20red%20danger%20sign%20illustration&image_size=landscape_4_3',
    anti3: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=elderly%20chinese%20health%20products%20scam%20warning%20education%20family&image_size=landscape_4_3'
  }
  return covers[seed] || covers.opera1
}
const coverH = cover

export const mockVideos: DouyinVideo[] = [
  {
    id: 'dy_001_opera_01',
    title: '京剧《贵妃醉酒》经典选段 名家名段百听不厌',
    coverUrl: coverH('opera1'),
    videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
    duration: 248,
    subtitle: [
      '各位老哥哥老姐姐们好',
      '今天给大家带来一段经典京剧《贵妃醉酒》',
      '海岛冰轮初转腾 见玉兔又早东升',
      '那冰轮离海岛 乾坤分外明',
      '皓月当空 恰便似嫦娥离月宫',
      '这一段是梅派经典代表作之一',
      '喜欢的朋友点个赞 谢谢大家'
    ],
    author: '戏曲大观园',
    likes: 128400,
    category: 'opera',
    description: '传承国粹，经典老戏完整唱段，配超大字幕适合老年戏迷观看。'
  },
  {
    id: 'dy_002_opera_02',
    title: '豫剧《穆桂英挂帅》选段 马金凤大师原声',
    coverUrl: coverH('opera2'),
    videoUrl: 'https://www.w3schools.com/html/movie.mp4',
    duration: 186,
    subtitle: [
      '辕门外三声炮如同雷震',
      '天波府里走出来我保国臣',
      '头戴金冠压双鬓',
      '当年的铁甲我又披上了身',
      '帅字旗飘入云 斗大的穆字震乾坤',
      '穆桂英我五十三岁又管三军'
    ],
    author: '豫剧传承者',
    likes: 89200,
    category: 'opera',
    description: '豫剧五大名旦马金凤老师经典作品《穆桂英挂帅》，音质清晰版。'
  },
  {
    id: 'dy_003_dance_01',
    title: '广场舞《最炫民族风》32步 背面演示教学',
    coverUrl: coverH('dance1'),
    videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
    duration: 320,
    subtitle: [
      '亲爱的姐妹们大家好',
      '今天学习《最炫民族风》32步',
      '动作简单 适合初学者',
      '苍茫的天涯是我的爱',
      '绵绵的青山脚下花正开',
      '什么样的节奏是最呀最摇摆',
      '大家跟着我 左右左右',
      '转圈 对 就是这样 非常好'
    ],
    author: '快乐广场舞队',
    likes: 256700,
    category: 'square-dance',
    description: '全网最火广场舞，附分解教学，早晚各跳三遍身体好。'
  },
  {
    id: 'dy_004_health_01',
    title: '每天揉肚子5分钟 便秘消失睡眠好',
    coverUrl: coverH('health1'),
    videoUrl: 'https://www.w3schools.com/html/movie.mp4',
    duration: 145,
    subtitle: [
      '大家好 今天教大家一个揉腹小妙招',
      '每天早晚各5分钟',
      '先顺时针揉30圈',
      '记住是顺时针方向哦',
      '再逆时针揉30圈',
      '力气不要太大 轻轻的就好',
      '坚持一周 便秘不见了 睡眠也香了'
    ],
    author: '养生小课堂',
    likes: 412300,
    category: 'health',
    description: '中老年养生小技巧，不花钱效果好，转发给您的老友。'
  },
  {
    id: 'dy_005_health_02',
    title: '降压操：每天按这3个穴位 血压稳如山',
    coverUrl: coverH('health2'),
    videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
    duration: 210,
    subtitle: [
      '高血压的朋友们注意了',
      '教你3个自己就能按的降压穴位',
      '第一个 涌泉穴 在脚心',
      '第二个 太冲穴 在脚背上',
      '第三个 百会穴 在头顶心',
      '每个穴位按3分钟 微微发热就好',
      '配合吃药效果更好'
    ],
    author: '老中医李大夫',
    likes: 325600,
    category: 'health',
    description: '穴位按摩保健法，请在专业医师指导下进行。'
  },
  {
    id: 'dy_006_food_01',
    title: '红烧五花肉这样做 肥而不腻入口即化',
    coverUrl: coverH('food1'),
    videoUrl: 'https://www.w3schools.com/html/movie.mp4',
    duration: 268,
    subtitle: [
      '今天做一锅正宗红烧肉',
      '先把五花肉切成麻将块',
      '冷水下锅焯水 放姜片料酒',
      '炒糖色 小火慢慢熬成枣红色',
      '下肉块翻炒上色',
      '加八角桂皮香叶 生抽老抽',
      '加热水没过肉 小火炖45分钟',
      '最后大火收汁 齐活'
    ],
    author: '张阿姨的厨房',
    likes: 578900,
    category: 'food',
    description: '老师傅秘方，全家老小都爱吃的家常菜。'
  },
  {
    id: 'dy_007_food_02',
    title: '手擀面详细做法 擀出来的面条筋道爽滑',
    coverUrl: coverH('food2'),
    videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
    duration: 385,
    subtitle: [
      '老北京手擀面 就两个字 筋道',
      '一斤面 加一个鸡蛋 220克凉水',
      '拌成面絮 下手揉面',
      '醒面20分钟 再揉一遍',
      '擀成大面片 叠起来切条',
      '水开下面 点三次凉水',
      '浇上卤子 您就吃去吧 香'
    ],
    author: '面食大王老王',
    likes: 234500,
    category: 'food',
    description: '北方人手把手教做手擀面，零失败教程。'
  },
  {
    id: 'dy_008_fraud_demo_01',
    title: '【危险示例】养老院高额理财 年化30%保本高收益骗局',
    coverUrl: coverH('fraud1'),
    videoUrl: 'https://www.w3schools.com/html/movie.mp4',
    duration: 95,
    subtitle: [
      '叔叔阿姨们好消息呀！',
      '民政部下属养老基金今天内部开售',
      '保本保息 年化收益率30%高额回报！',
      '仅限今日 仅限今天一天！',
      '10万起投 一年利息就3万！',
      '内部名额只有200个 先到先得',
      '点击下面链接领取 或者加我微信转账！',
      '还能抵扣养老院床位费哦'
    ],
    author: '【反诈演示-已标记风险】',
    likes: 12,
    category: 'fraud-demo',
    description: '【反诈教学用】本视频为典型养老理财诈骗示例，用于反诈识别教学。关键词：养老理财、高额回报、仅限今日、加微信、内部名额。'
  },
  {
    id: 'dy_009_fraud_demo_02',
    title: '【危险示例】刷单日赚500：垫付本金 连本带利返 诈骗教程',
    coverUrl: coverH('fraud2'),
    videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
    duration: 120,
    subtitle: [
      '退休在家没事做？',
      '跟着我做刷单任务 每天动动手指日赚500',
      '第一单 垫付100元 返利130',
      '第二单 垫付500 返利650',
      '本金+高额佣金 扫码直接转账！',
      '做满5单还有额外奖金888元！',
      '需要做的朋友输入验证码入群'
    ],
    author: '【反诈演示-已标记风险】',
    likes: 8,
    category: 'fraud-demo',
    description: '【反诈教学用】刷单诈骗经典套路，关键词：刷单、垫付本金、高额佣金、验证码。'
  },
  {
    id: 'dy_010_cook_routine',
    title: '东北大包子 酸菜馅这样调最香',
    coverUrl: coverH('food3'),
    videoUrl: 'https://www.w3schools.com/html/movie.mp4',
    duration: 310,
    subtitle: [
      '今天包东北酸菜大包子',
      '酸菜切丝 多洗两遍挤干',
      '五花肉切丁 炒香',
      '淋上葱姜油 调味',
      '发面揪剂子 擀皮',
      '包成大包子 醒15分钟再蒸',
      '上汽20分钟出锅 香啊'
    ],
    author: '东北一家人',
    likes: 198000,
    category: 'food',
    description: '地道东北味，皮薄馅大咬一口直流汁。'
  },
  {
    id: 'dy_011_rural',
    title: '秋天的农家小院：摘柿子晒辣椒 这样的生活比蜜甜',
    coverUrl: coverH('rural1'),
    videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
    duration: 225,
    subtitle: [
      '大家好 欢迎来到俺们村',
      '今天霜降 把院子里的柿子摘下来',
      '一串串红柿子像小灯笼',
      '墙角的辣椒也红了 穿起来挂屋檐下',
      '院子里大公鸡咯咯哒',
      '晚上炖一锅土鸡 一家人围在一起',
      '这就是俺们农民的好日子'
    ],
    author: '乡村田园生活',
    likes: 667800,
    category: 'countryside',
    description: '真实记录农村日常生活，治愈系短视频。'
  }
]

export const antiFraudVideos: DouyinVideo[] = [
  {
    id: 'edu_fraud_01',
    title: '【官方反诈】养老诈骗套路大揭秘，儿女必看转发给爸妈',
    coverUrl: coverH('anti1'),
    videoUrl: 'https://www.w3schools.com/html/movie.mp4',
    duration: 340,
    subtitle: ['公安部刑侦局权威发布养老诈骗6大常见套路'],
    author: '国家反诈中心',
    likes: 1200000,
    category: 'other',
    description: '国家反诈中心官方短视频，揭露养老诈骗的6大类骗局。'
  },
  {
    id: 'edu_fraud_02',
    title: '3分钟看懂"刷单诈骗"：为什么越刷钱越拿不回来？',
    coverUrl: coverH('anti2'),
    videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
    duration: 180,
    subtitle: ['所有刷单都是诈骗！所有刷单都是诈骗！所有刷单都是诈骗！'],
    author: '96110反诈热线',
    likes: 890000,
    category: 'other',
    description: '反诈动画演示刷单返利诈骗的完整套路链条。'
  },
  {
    id: 'edu_fraud_03',
    title: '保健品骗局：8000块"神药"成本仅80元，老人被套路全过程',
    coverUrl: coverH('anti3'),
    videoUrl: 'https://www.w3schools.com/html/movie.mp4',
    duration: 420,
    subtitle: ['央视记者卧底保健品诈骗团伙实录。'],
    author: '央视社会与法',
    likes: 2340000,
    category: 'other',
    description: '央视深度调查：保健品诈骗是如何给老年人"洗脑"的。'
  }
]

export const samplePushed = [
  { videoId: 'dy_001_opera_01', fromChild: '女儿小芳', remark: '妈，您最爱的贵妃醉酒，想您了❤️', pushedAt: Date.now() - 3600_000 * 4, category: 'opera' },
  { videoId: 'dy_004_health_01', fromChild: '儿子小军', remark: '爸，这个揉肚子操您试试，对便秘好', pushedAt: Date.now() - 3600_000 * 20, category: 'health' },
  { videoId: 'dy_007_food_02', fromChild: '女儿小芳', remark: '妈您看这个手擀面教程，下次回家我给您做！', pushedAt: Date.now() - 3600_000 * 48, category: 'food' }
]
