/* ========================================
   智游规划 v1.3.0 - 移动端 APP 应用逻辑
   ======================================== */

(function() {
  'use strict';

  // ========================================
  // 内联 Mock 数据（确保 file:// 协议可用）
  // ========================================

  var MOCK_CITIES = [
    { id: "beijing", name: "北京", nameEn: "Beijing", country: "中国", province: "北京市", isHot: true,
      tags: ["history", "culture"],
      description: "北京是中华人民共和国的首都，是一座有着三千多年历史的古都。",
      imageUrl: "https://picsum.photos/seed/beijing-city/600/400",
      popularAttractions: 12, bestSeason: "春秋两季（4-5月、9-10月）" },
    { id: "shanghai", name: "上海", nameEn: "Shanghai", country: "中国", province: "上海市", isHot: true,
      tags: ["shopping", "modern"],
      description: "上海是中国最大的经济中心城市，也是国际化大都市。",
      imageUrl: "https://picsum.photos/seed/shanghai-city/600/400",
      popularAttractions: 10, bestSeason: "春秋两季（3-5月、9-11月）" },
    { id: "chengdu", name: "成都", nameEn: "Chengdu", country: "中国", province: "四川省", isHot: true,
      tags: ["food", "culture"],
      description: "成都自古被誉为天府之国，是一座悠闲、美食、文化兼具的城市。",
      imageUrl: "https://picsum.photos/seed/chengdu-city/600/400",
      popularAttractions: 11, bestSeason: "春秋两季（3-6月、9-11月）" },
    { id: "hangzhou", name: "杭州", nameEn: "Hangzhou", country: "中国", province: "浙江省",
      tags: ["nature", "culture"],
      description: "杭州素有'人间天堂'的美誉，西湖的湖光山色令人陶醉。",
      imageUrl: "https://picsum.photos/seed/hangzhou-city/600/400",
      popularAttractions: 10, bestSeason: "春秋两季（3-5月、9-11月）" },
    { id: "xian", name: "西安", nameEn: "Xi'an", country: "中国", province: "陕西省",
      tags: ["history", "culture"],
      description: "西安是十三朝古都，是中华文明的重要发祥地之一。",
      imageUrl: "https://picsum.photos/seed/xian-city/600/400",
      popularAttractions: 9, bestSeason: "春秋两季（3-5月、9-11月）" },
    { id: "xiamen", name: "厦门", nameEn: "Xiamen", country: "中国", province: "福建省",
      tags: ["nature", "beach"],
      description: "厦门是一座风光旖旎的海滨城市，充满了浪漫与小资情调。",
      imageUrl: "https://picsum.photos/seed/xiamen-city/600/400",
      popularAttractions: 9, bestSeason: "春秋冬三季（10月-次年4月）" },
    { id: "sanya", name: "三亚", nameEn: "Sanya", country: "中国", province: "海南省",
      tags: ["nature", "beach"],
      description: "三亚是中国最南部的热带滨海旅游城市，拥有洁白的沙滩。",
      imageUrl: "https://picsum.photos/seed/sanya-city/600/400",
      popularAttractions: 8, bestSeason: "秋冬季（10月-次年4月）" },
    { id: "chongqing", name: "重庆", nameEn: "Chongqing", country: "中国", province: "重庆市",
      tags: ["food", "nature"],
      description: "重庆是一座山城，也是一座雾都，更是一座美食之都。",
      imageUrl: "https://picsum.photos/seed/chongqing-city/600/400",
      popularAttractions: 10, bestSeason: "春秋两季（3-5月、9-11月）" },
    { id: "guangzhou", name: "广州", nameEn: "Guangzhou", country: "中国", province: "广东省",
      tags: ["food", "shopping"],
      description: "广州是岭南文化的中心，也是中国重要的商贸城市。",
      imageUrl: "https://picsum.photos/seed/guangzhou-city/600/400",
      popularAttractions: 9, bestSeason: "秋冬春三季（10月-次年4月）" },
    { id: "suzhou", name: "苏州", nameEn: "Suzhou", country: "中国", province: "江苏省",
      tags: ["history", "culture"],
      description: "苏州被誉为'东方威尼斯'，是江南水乡的代表城市。",
      imageUrl: "https://picsum.photos/seed/suzhou-city/600/400",
      popularAttractions: 10, bestSeason: "春秋两季（3-5月、9-11月）" },
    { id: "tokyo", name: "东京", nameEn: "Tokyo", country: "日本", province: "东京都", isOverseas: true, isHot: true,
      tags: ["shopping", "modern", "food"],
      description: "东京是日本的首都，也是世界上最繁华的都市之一。传统与现代在这里完美交融，从古老的浅草寺到前卫的涩谷十字路口，从米其林餐厅到街头拉面，东京总能给你惊喜。",
      imageUrl: "https://picsum.photos/seed/tokyo-city/600/400",
      popularAttractions: 15, bestSeason: "春秋两季（3-4月樱花季、10-11月红叶季）",
      currency: "日元（JPY）", timezone: "UTC+9", visa: "需办理日本旅游签证" },
    { id: "osaka", name: "大阪", nameEn: "Osaka", country: "日本", province: "大阪府", isOverseas: true, isHot: true,
      tags: ["food", "shopping"],
      description: "大阪是日本第二大城市，被誉为'天下厨房'。这里有吃不尽的美食，有热情开朗的关西人，还有环球影城、大阪城等知名景点。",
      imageUrl: "https://picsum.photos/seed/osaka-city/600/400",
      popularAttractions: 12, bestSeason: "春秋两季（3-5月、10-11月）",
      currency: "日元（JPY）", timezone: "UTC+9", visa: "需办理日本旅游签证" },
    { id: "bangkok", name: "曼谷", nameEn: "Bangkok", country: "泰国", province: "曼谷", isOverseas: true, isHot: true,
      tags: ["food", "culture"],
      description: "曼谷是泰国的首都，一座充满异域风情的天使之城。金碧辉煌的大皇宫、热闹非凡的水上市场、让人垂涎的泰式美食，还有性价比超高的马杀鸡，都让人欲罢不能。",
      imageUrl: "https://picsum.photos/seed/bangkok-city/600/400",
      popularAttractions: 14, bestSeason: "凉季（11月-次年2月）",
      currency: "泰铢（THB）", timezone: "UTC+7", visa: "可落地签/免签" },
    { id: "seoul", name: "首尔", nameEn: "Seoul", country: "韩国", province: "首尔特别市", isOverseas: true,
      tags: ["shopping", "food"],
      description: "首尔是韩国的首都，时尚与传统并存的都市。景福宫的古典雅致、明洞的热闹购物、弘大的潮流文化、还有让人欲罢不能的韩式烤肉和部队锅。",
      imageUrl: "https://picsum.photos/seed/seoul-city/600/400",
      popularAttractions: 13, bestSeason: "春秋两季（4月樱花、10月红叶）",
      currency: "韩元（KRW）", timezone: "UTC+9", visa: "需办理韩国旅游签证" },
    { id: "singapore", name: "新加坡", nameEn: "Singapore", country: "新加坡", province: "新加坡", isOverseas: true,
      tags: ["nature", "modern"],
      description: "新加坡是一座花园城市国家，干净、安全、多元文化交融。鱼尾狮、滨海湾花园、环球影城、牛车水、小印度，还有各种美食，中文通行让旅行更轻松。",
      imageUrl: "https://picsum.photos/seed/singapore-city/600/400",
      popularAttractions: 11, bestSeason: "全年皆宜（11月-次年2月雨季）",
      currency: "新加坡元（SGD）", timezone: "UTC+8", visa: "可免签/电子签" },
    { id: "paris", name: "巴黎", nameEn: "Paris", country: "法国", province: "法兰西岛大区", isOverseas: true, isHot: true,
      tags: ["history", "culture", "romantic"],
      description: "巴黎是浪漫之都，艺术与时尚的殿堂。埃菲尔铁塔、卢浮宫、香榭丽舍大街、塞纳河畔，每一处都充满着法式浪漫。",
      imageUrl: "https://picsum.photos/seed/paris-city/600/400",
      popularAttractions: 16, bestSeason: "春夏两季（4-6月、9-10月）",
      currency: "欧元（EUR）", timezone: "UTC+1（冬令时）/UTC+2（夏令时）", visa: "需办理申根签证" },
    { id: "newyork", name: "纽约", nameEn: "New York", country: "美国", province: "纽约州", isOverseas: true,
      tags: ["shopping", "modern"],
      description: "纽约是世界第一大都市，不夜城的代表。自由女神像、时代广场、中央公园、百老汇、第五大道，这里是梦想开始的地方。",
      imageUrl: "https://picsum.photos/seed/newyork-city/600/400",
      popularAttractions: 17, bestSeason: "春秋两季（4-6月、9-11月）",
      currency: "美元（USD）", timezone: "UTC-5（冬令时）/UTC-4（夏令时）", visa: "需办理美国旅游签证" },
    { id: "kyoto", name: "京都", nameEn: "Kyoto", country: "日本", province: "京都府", isOverseas: true,
      tags: ["history", "culture"],
      description: "京都保存了日本最完整的传统文化，千年古都的韵味藏在每一条小巷里。伏见稻荷大社的千本鸟居、金阁寺的金碧辉煌、艺伎的优雅身影，都让人沉醉。",
      imageUrl: "https://picsum.photos/seed/kyoto-city/600/400",
      popularAttractions: 18, bestSeason: "春秋两季（3-4月樱花、11月红叶）",
      currency: "日元（JPY）", timezone: "UTC+9", visa: "需办理日本旅游签证" }
  ];

  var MOCK_ATTRACTIONS = [
    { id: "forbidden-city", name: "故宫博物院", cityId: "beijing", category: "历史文化",
      description: "故宫又称紫禁城，是中国明清两代的皇家宫殿，是世界上现存规模最大、保存最为完整的木质结构古建筑之一。",
      durationHours: 3, ticketPrice: 60, rating: 4.9, address: "北京市东城区景山前街4号",
      imageUrl: "https://picsum.photos/seed/forbidden-city/400/300",
      tips: "建议提前网上预约购票，周一闭馆。", mapX: 52, mapY: 45, poiCategory: "attraction" },
    { id: "great-wall-badaling", name: "八达岭长城", cityId: "beijing", category: "历史文化",
      description: "八达岭长城是明长城中保存最好的一段，也是最具代表性的一段。",
      durationHours: 4, ticketPrice: 40, rating: 4.8, address: "北京市延庆区八达岭镇",
      imageUrl: "https://picsum.photos/seed/great-wall/400/300",
      tips: "长城台阶较多，建议穿舒适的运动鞋。", mapX: 38, mapY: 8, poiCategory: "attraction" },
    { id: "summer-palace", name: "颐和园", cityId: "beijing", category: "历史文化",
      description: "颐和园是中国清朝时期皇家园林，以昆明湖、万寿山为基址。",
      durationHours: 3, ticketPrice: 30, rating: 4.7, address: "北京市海淀区新建宫门路19号",
      imageUrl: "https://picsum.photos/seed/summer-palace/400/300",
      tips: "建议春夏秋季游览，可以乘船游湖。", mapX: 30, mapY: 28, poiCategory: "attraction" },
    { id: "tiananmen-square", name: "天安门广场", cityId: "beijing", category: "历史文化",
      description: "天安门广场是世界上最大的城市广场，位于北京市中心。",
      durationHours: 2, ticketPrice: 0, rating: 4.7, address: "北京市东城区长安街",
      imageUrl: "https://picsum.photos/seed/tiananmen/400/300",
      tips: "观看升旗仪式需要很早到达。", mapX: 52, mapY: 50, poiCategory: "attraction" },
    { id: "temple-of-heaven", name: "天坛公园", cityId: "beijing", category: "历史文化",
      description: "天坛是明清两代皇帝祭天、祈谷的场所，是中国现存最大的古代祭祀性建筑群。",
      durationHours: 2.5, ticketPrice: 15, rating: 4.6, address: "北京市东城区天坛东里甲1号",
      imageUrl: "https://picsum.photos/seed/temple-heaven/400/300",
      tips: "建议早上前往，可以看到很多当地人晨练。", mapX: 55, mapY: 62, poiCategory: "attraction" },
    { id: "national-museum-china", name: "中国国家博物馆", cityId: "beijing", category: "博物馆",
      description: "中国国家博物馆是世界上单体建筑面积最大的博物馆。",
      durationHours: 3, ticketPrice: 0, rating: 4.8, address: "北京市东城区东长安街16号",
      imageUrl: "https://picsum.photos/seed/national-museum/400/300",
      tips: "需要提前预约，周一闭馆。", mapX: 56, mapY: 50, poiCategory: "attraction" },
    { id: "798-art-zone", name: "798艺术区", cityId: "beijing", category: "主题乐园",
      description: "798艺术区是由原国营798厂等电子工业老厂区改造而成的艺术区。",
      durationHours: 2.5, ticketPrice: 0, rating: 4.5, address: "北京市朝阳区酒仙桥路4号",
      imageUrl: "https://picsum.photos/seed/798-art/400/300",
      tips: "很多画廊周一闭馆，建议周末前往。", mapX: 72, mapY: 32, poiCategory: "attraction" },
    { id: "wangfujing-street", name: "王府井步行街", cityId: "beijing", category: "购物休闲",
      description: "王府井是北京最著名的商业街之一，汇集了众多品牌店和老字号。",
      durationHours: 2, ticketPrice: 0, rating: 4.3, address: "北京市东城区王府井大街",
      imageUrl: "https://picsum.photos/seed/wangfujing/400/300",
      tips: "晚上灯光很美，可以逛街品尝小吃。", mapX: 58, mapY: 42, poiCategory: "attraction" },
    { id: "hutong-nanluoguxiang", name: "南锣鼓巷", cityId: "beijing", category: "美食街区",
      description: "南锣鼓巷是北京最古老的街区之一，有着北京保护最完整的四合院区。",
      durationHours: 2, ticketPrice: 0, rating: 4.3, address: "北京市东城区南锣鼓巷胡同",
      imageUrl: "https://picsum.photos/seed/nanluoguxiang/400/300",
      tips: "里面有很多特色小店和美食，可以边逛边吃。", mapX: 48, mapY: 40, poiCategory: "attraction" },
    { id: "beihai-park", name: "北海公园", cityId: "beijing", category: "自然风光",
      description: "北海公园是中国现存最古老、最完整、最具综合性和代表性的皇家园林之一。",
      durationHours: 2, ticketPrice: 10, rating: 4.6, address: "北京市西城区文津街1号",
      imageUrl: "https://picsum.photos/seed/beihai-park/400/300",
      tips: "可以划船游湖，白塔是标志性建筑。", mapX: 45, mapY: 42, poiCategory: "attraction" },
    { id: "the-bund", name: "外滩", cityId: "shanghai", category: "历史文化",
      description: "外滩是上海的标志性景点，万国建筑博览群与陆家嘴天际线隔江相望。",
      durationHours: 2, ticketPrice: 0, rating: 4.8, address: "上海市黄浦区中山东一路",
      imageUrl: "https://picsum.photos/seed/bund/400/300",
      tips: "夜景非常美，建议晚上前往。", mapX: 48, mapY: 42, poiCategory: "attraction" },
    { id: "oriental-pearl", name: "东方明珠塔", cityId: "shanghai", category: "主题乐园",
      description: "东方明珠是上海的标志性建筑，塔高468米，可以俯瞰整个上海。",
      durationHours: 2.5, ticketPrice: 180, rating: 4.6, address: "上海市浦东新区世纪大道1号",
      imageUrl: "https://picsum.photos/seed/oriental-pearl/400/300",
      tips: "建议傍晚去，可以看日落和夜景。", mapX: 62, mapY: 38, poiCategory: "attraction" },
    { id: "yu-garden", name: "豫园", cityId: "shanghai", category: "历史文化",
      description: "豫园是江南古典园林，始建于明代，园内亭台楼阁，假山池塘。",
      durationHours: 2.5, ticketPrice: 40, rating: 4.7, address: "上海市黄浦区安仁街132号",
      imageUrl: "https://picsum.photos/seed/yu-garden/400/300",
      tips: "城隍庙就在旁边，可以一起逛。", mapX: 45, mapY: 48, poiCategory: "attraction" },
    { id: "shanghai-museum", name: "上海博物馆", cityId: "shanghai", category: "博物馆",
      description: "上海博物馆是一座大型的中国古代艺术博物馆。",
      durationHours: 2.5, ticketPrice: 0, rating: 4.8, address: "上海市黄浦区人民大道201号",
      imageUrl: "https://picsum.photos/seed/shanghai-museum/400/300",
      tips: "青铜器和陶瓷器是馆藏精华。", mapX: 40, mapY: 45, poiCategory: "attraction" },
    { id: "chengdu-research-base", name: "成都大熊猫繁育研究基地", cityId: "chengdu", category: "自然风光",
      description: "成都大熊猫繁育研究基地是世界著名的大熊猫迁地保护基地。",
      durationHours: 3, ticketPrice: 55, rating: 4.9, address: "成都市成华区熊猫大道1375号",
      imageUrl: "https://picsum.photos/seed/panda-base/400/300",
      tips: "一定要早上去，下午熊猫可能在睡觉。", mapX: 42, mapY: 22, poiCategory: "attraction" },
    { id: "wuhou-shrine", name: "武侯祠", cityId: "chengdu", category: "历史文化",
      description: "武侯祠是纪念诸葛亮的专祠，也是三国文化的圣地。",
      durationHours: 2, ticketPrice: 50, rating: 4.6, address: "成都市武侯区武侯祠大街231号",
      imageUrl: "https://picsum.photos/seed/wuhou/400/300",
      tips: "锦里就在旁边，可以一起逛。", mapX: 38, mapY: 58, poiCategory: "attraction" },
    { id: "jinli-street", name: "锦里古街", cityId: "chengdu", category: "美食街区",
      description: "锦里是成都武侯祠博物馆的一部分，是体验三国文化与成都民俗的街区。",
      durationHours: 2, ticketPrice: 0, rating: 4.5, address: "成都市武侯区武侯祠大街231号附1号",
      imageUrl: "https://picsum.photos/seed/jinli/400/300",
      tips: "晚上灯笼亮起时最美，还有很多小吃。", mapX: 40, mapY: 55, poiCategory: "attraction" },
    { id: "dujiangyan", name: "都江堰", cityId: "chengdu", category: "历史文化",
      description: "都江堰是世界文化遗产，是全世界至今为止年代最久、唯一留存的宏大水利工程。",
      durationHours: 3, ticketPrice: 80, rating: 4.8, address: "成都市都江堰市公园路",
      imageUrl: "https://picsum.photos/seed/dujiangyan/400/300",
      tips: "建议请个讲解员，能更好了解历史。", mapX: 18, mapY: 28, poiCategory: "attraction" }
  ];

  var MOCK_RESTAURANTS = [
    { id: "quanjude-beijing", name: "全聚德（前门店）", cityId: "beijing", cuisine: "北京菜",
      priceRange: 150, rating: 4.5, address: "北京市东城区前门大街30号",
      description: "全聚德是北京烤鸭著名老字号，以挂炉烤鸭闻名天下。",
      imageUrl: "https://picsum.photos/seed/quanjude/400/300",
      signatureDishes: ["烤鸭", "芥末鸭掌", "火燎鸭心"], mapX: 50, mapY: 48, poiCategory: "restaurant" },
    { id: "siji-minfu-beijing", name: "四季民福烤鸭店（故宫店）", cityId: "beijing", cuisine: "北京菜",
      priceRange: 140, rating: 4.7, address: "北京市东城区南池子大街11号",
      description: "四季民福是北京人气很旺的烤鸭店，故宫店位置绝佳。",
      imageUrl: "https://picsum.photos/seed/sijiminfu/400/300",
      signatureDishes: ["酥脆烤鸭", "贝勒烤肉", "炸酱面"], mapX: 53, mapY: 44, poiCategory: "restaurant" },
    { id: "donglaishun-beijing", name: "东来顺（王府井店）", cityId: "beijing", cuisine: "火锅",
      priceRange: 120, rating: 4.4, address: "北京市东城区王府井大街198号",
      description: "东来顺是北京著名的涮羊肉老字号，创立于1903年。",
      imageUrl: "https://picsum.photos/seed/donglaishun/400/300",
      signatureDishes: ["涮羊肉", "手切鲜羊腿肉", "芝麻烧饼"], mapX: 56, mapY: 40, poiCategory: "restaurant" },
    { id: "naixiongxiong-beijing", name: "牛街聚宝源（牛街北口店）", cityId: "beijing", cuisine: "火锅",
      priceRange: 110, rating: 4.8, address: "北京市西城区牛街5-2号",
      description: "聚宝源是北京最火的铜锅涮肉店，牛肉羊肉都来自牛街。",
      imageUrl: "https://picsum.photos/seed/jubaoyuan/400/300",
      signatureDishes: ["手切鲜羊肉", "鲜切牛腱子", "芝麻烧饼"], mapX: 35, mapY: 50, poiCategory: "restaurant" },
    { id: "nanxiang", name: "南翔馒头店（豫园店）", cityId: "shanghai", cuisine: "本帮菜",
      priceRange: 60, rating: 4.3, address: "上海市黄浦区豫园路85号",
      description: "南翔馒头店是上海老字号，以小笼包闻名。",
      imageUrl: "https://picsum.photos/seed/nanxiang/400/300",
      signatureDishes: ["蟹粉小笼", "鲜肉小笼", "蟹黄汤包"], mapX: 46, mapY: 47, poiCategory: "restaurant" },
    { id: "shanghai-no1-shanghai", name: "上海老饭店", cityId: "shanghai", cuisine: "本帮菜",
      priceRange: 120, rating: 4.5, address: "上海市黄浦区福佑路242号",
      description: "上海老饭店是上海本帮菜的发源地，始创于清光绪元年。",
      imageUrl: "https://picsum.photos/seed/laofandian/400/300",
      signatureDishes: ["八宝鸭", "虾子大乌参", "油爆虾"], mapX: 44, mapY: 49, poiCategory: "restaurant" },
    { id: "chenmapo-chengdu", name: "陈麻婆豆腐（青华路店）", cityId: "chengdu", cuisine: "川菜",
      priceRange: 60, rating: 4.6, address: "成都市青羊区青华路19号",
      description: "陈麻婆豆腐是成都老字号，麻婆豆腐的创始人就是陈麻婆。",
      imageUrl: "https://picsum.photos/seed/chenmapo/400/300",
      signatureDishes: ["麻婆豆腐", "回锅肉", "夫妻肺片"], mapX: 36, mapY: 60, poiCategory: "restaurant" },
    { id: "zhongshuijiao-chengdu", name: "钟水饺（总府店）", cityId: "chengdu", cuisine: "川菜",
      priceRange: 40, rating: 4.4, address: "成都市锦江区总府街23号",
      description: "钟水饺是成都著名的传统小吃，始于光绪年间。",
      imageUrl: "https://picsum.photos/seed/zhongshuijiao/400/300",
      signatureDishes: ["钟水饺", "担担面", "龙抄手"], mapX: 52, mapY: 44, poiCategory: "restaurant" },
    { id: "dazhangui-chengdu", name: "大龙燚火锅（春熙路店）", cityId: "chengdu", cuisine: "火锅",
      priceRange: 100, rating: 4.7, address: "成都市锦江区春熙路",
      description: "大龙燚是成都人气很旺的火锅品牌，地道成都味道。",
      imageUrl: "https://picsum.photos/seed/dalongyi/400/300",
      signatureDishes: ["麻辣牛肉", "毛肚", "鸭肠"], mapX: 50, mapY: 47, poiCategory: "restaurant" },
    { id: "longchaoshou-chengdu", name: "龙抄手（春熙路店）", cityId: "chengdu", cuisine: "川菜",
      priceRange: 45, rating: 4.3, address: "成都市锦江区春熙路",
      description: "龙抄手是成都著名的小吃店，以抄手闻名。",
      imageUrl: "https://picsum.photos/seed/longchaoshou/400/300",
      signatureDishes: ["红油抄手", "原汤抄手", "担担面"], mapX: 53, mapY: 46, poiCategory: "restaurant" }
  ];

  var MOCK_ITINERARIES = [
    {
      id: "beijing-3day", cityId: "beijing", days: 3, title: "北京经典3日游",
      description: "精选北京最经典的景点，涵盖历史文化与现代都市风貌。",
      totalBudget: { economy: 1800, comfort: 2800, luxury: 5000 },
      dailyItineraries: [
        { day: 1, title: "皇城根儿初探",
          morning: { activity: "attraction", attractionId: "tiananmen-square", startTime: "08:00", endTime: "10:00", duration: 2, description: "早起前往天安门广场观看升旗仪式，感受庄严肃穆的升旗仪式是北京之旅的开始。" },
          afternoon: { activity: "attraction", attractionId: "forbidden-city", startTime: "10:30", endTime: "14:00", duration: 3.5, description: "从天安门进入故宫博物院，参观世界上现存规模最大、保存最为完整的木质结构古建筑群。" },
          evening: { activity: "attraction", attractionId: "wangfujing-street", startTime: "18:00", endTime: "21:00", duration: 3, description: "前往王府井步行街，逛逛北京最繁华的商业街，品尝北京小吃。" },
          meals: { breakfast: "酒店早餐", lunchRestaurantId: "siji-minfu-beijing", dinnerRestaurantId: "quanjude-beijing" },
          transport: { description: "地铁+步行，市内交通", cost: 50 },
          accommodation: { area: "王府井/东单", suggestion: "推荐住在王府井附近，交通便利，步行可达故宫。" }
        },
        { day: 2, title: "园林艺术之旅",
          morning: { activity: "attraction", attractionId: "summer-palace", startTime: "09:00", endTime: "12:30", duration: 3.5, description: "游览颐和园，中国清朝时期皇家园林，以昆明湖、万寿山为基址。" },
          afternoon: { activity: "attraction", attractionId: "temple-of-heaven", startTime: "14:00", endTime: "16:30", duration: 2.5, description: "参观天坛公园，明清两代皇帝祭天祈谷的场所。" },
          evening: { activity: "attraction", attractionId: "hutong-nanluoguxiang", startTime: "18:00", endTime: "21:00", duration: 3, description: "逛南锣鼓巷，北京最古老的街区，体验老北京胡同文化。" },
          meals: { breakfast: "酒店早餐", lunchRestaurantId: "donglaishun-beijing", dinnerRestaurantId: "naixiongxiong-beijing" },
          transport: { description: "地铁+公交", cost: 40 },
          accommodation: { area: "王府井/东单", suggestion: "继续入住同前一天" }
        },
        { day: 3, title: "长城雄风",
          morning: { activity: "attraction", attractionId: "great-wall-badaling", startTime: "08:00", endTime: "13:00", duration: 5, description: "前往八达岭长城，体验不到长城非好汉的豪情。" },
          afternoon: { activity: "attraction", attractionId: "national-museum-china", startTime: "15:30", endTime: "18:00", duration: 2.5, description: "参观中国国家博物馆，了解中华五千年文明。" },
          evening: { activity: "attraction", attractionId: "798-art-zone", startTime: "19:00", endTime: "21:30", duration: 2.5, description: "游览798艺术区，感受北京的艺术氛围。" },
          meals: { breakfast: "酒店早餐", lunch: "长城脚下农家菜", dinnerRestaurantId: "donglaishun-beijing" },
          transport: { description: "高铁+市内交通", cost: 100 },
          accommodation: { area: "行程结束", suggestion: "行程结束，祝您旅途愉快！" }
        }
      ]
    },
    {
      id: "beijing-5day", cityId: "beijing", days: 5, title: "北京深度5日游",
      description: "深度游览北京，涵盖历史文化、自然风光、艺术人文。",
      totalBudget: { economy: 3000, comfort: 4500, luxury: 8000 },
      dailyItineraries: [
        { day: 1, title: "皇城经典",
          morning: { activity: "attraction", attractionId: "tiananmen-square", startTime: "08:00", endTime: "10:00", duration: 2, description: "观看升旗仪式，参观天安门广场。" },
          afternoon: { activity: "attraction", attractionId: "forbidden-city", startTime: "10:30", endTime: "14:30", duration: 4, description: "深度游览故宫，参观三大殿、后三宫、御花园等。" },
          evening: { activity: "attraction", attractionId: "beihai-park", startTime: "18:00", endTime: "20:30", duration: 2.5, description: "游览北海公园，白塔、琼华岛，感受皇家园林的傍晚。" },
          meals: { breakfast: "酒店早餐", lunchRestaurantId: "siji-minfu-beijing", dinnerRestaurantId: "quanjude-beijing" },
          transport: { description: "步行+地铁", cost: 30 },
          accommodation: { area: "王府井/东单", suggestion: "推荐住在王府井附近，交通便利。" }
        },
        { day: 2, title: "园林与胡同",
          morning: { activity: "attraction", attractionId: "summer-palace", startTime: "09:00", endTime: "12:30", duration: 3.5, description: "游览颐和园，乘船游昆明湖。" },
          afternoon: { activity: "attraction", attractionId: "temple-of-heaven", startTime: "14:00", endTime: "16:30", duration: 2.5, description: "参观天坛公园，回音壁、祈年殿。" },
          evening: { activity: "attraction", attractionId: "hutong-nanluoguxiang", startTime: "18:00", endTime: "21:00", duration: 3, description: "南锣鼓巷胡同游，品尝北京小吃。" },
          meals: { breakfast: "酒店早餐", lunchRestaurantId: "donglaishun-beijing", dinnerRestaurantId: "naixiongxiong-beijing" },
          transport: { description: "地铁+公交", cost: 40 },
          accommodation: { area: "王府井/东单", suggestion: "同上" }
        },
        { day: 3, title: "长城雄关",
          morning: { activity: "attraction", attractionId: "great-wall-badaling", startTime: "08:00", endTime: "14:00", duration: 6, description: "八达岭长城一日游，登长城做好汉。" },
          afternoon: { activity: "leisure", startTime: "15:00", endTime: "17:00", duration: 2, description: "返回市区，途中休息。" },
          evening: { activity: "leisure", startTime: "19:00", endTime: "21:00", duration: 2, description: "返回市区，晚餐后休息。" },
          meals: { breakfast: "酒店早餐", lunch: "长城脚下农家菜", dinnerRestaurantId: "donglaishun-beijing" },
          transport: { description: "包车/一日游交通", cost: 120 },
          accommodation: { area: "王府井/东单", suggestion: "同上" }
        },
        { day: 4, title: "艺术与博物馆",
          morning: { activity: "attraction", attractionId: "national-museum-china", startTime: "09:00", endTime: "12:30", duration: 3.5, description: "参观国家博物馆，古代中国展厅。" },
          afternoon: { activity: "attraction", attractionId: "798-art-zone", startTime: "14:00", endTime: "17:30", duration: 3.5, description: "798艺术区，参观画廊、艺术工作室。" },
          evening: { activity: "attraction", attractionId: "wangfujing-street", startTime: "18:30", endTime: "21:00", duration: 2.5, description: "王府井购物，品尝美食。" },
          meals: { breakfast: "酒店早餐", lunch: "艺术区餐厅", dinnerRestaurantId: "naixiongxiong-beijing" },
          transport: { description: "地铁+打车", cost: 50 },
          accommodation: { area: "王府井/东单", suggestion: "同上" }
        },
        { day: 5, title: "休闲时光",
          morning: { activity: "attraction", attractionId: "beihai-park", startTime: "09:00", endTime: "11:30", duration: 2.5, description: "北海公园，琼岛春阴。" },
          afternoon: { activity: "shopping", startTime: "13:00", endTime: "16:00", duration: 3, description: "前门大街购物，购买伴手礼。" },
          evening: { activity: "departure", startTime: "根据航班时间", endTime: "-", duration: "-", description: "行程结束，送机或送站。" },
          meals: { breakfast: "酒店早餐", lunchRestaurantId: "donglaishun-beijing", dinner: "根据航班时间安排" },
          transport: { description: "送机/送站", cost: 80 },
          accommodation: { area: "行程结束", suggestion: "行程结束，祝您旅途愉快！" }
        }
      ]
    },
    {
      id: "chengdu-3day", cityId: "chengdu", days: 3, title: "成都经典3日游",
      description: "三天玩转成都，看熊猫、逛古街、品美食，感受天府之国的悠闲。",
      totalBudget: { economy: 1500, comfort: 2300, luxury: 4200 },
      dailyItineraries: [
        { day: 1, title: "熊猫基地",
          morning: { activity: "attraction", attractionId: "chengdu-research-base", startTime: "08:00", endTime: "11:30", duration: 3.5, description: "成都大熊猫繁育研究基地，看憨态可掬的大熊猫。" },
          afternoon: { activity: "attraction", attractionId: "wuhou-shrine", startTime: "13:30", endTime: "16:00", duration: 2.5, description: "武侯祠，三国文化圣地。" },
          evening: { activity: "attraction", attractionId: "jinli-street", startTime: "17:00", endTime: "21:00", duration: 4, description: "锦里古街，三国文化与成都民俗，夜景美食。" },
          meals: { breakfast: "酒店早餐", lunchRestaurantId: "chenmapo-chengdu", dinnerRestaurantId: "zhongshuijiao-chengdu" },
          transport: { description: "地铁+公交", cost: 40 },
          accommodation: { area: "春熙路/太古里", suggestion: "推荐住在春熙路附近，交通便利，美食多。" }
        },
        { day: 2, title: "都江堰青城山",
          morning: { activity: "attraction", attractionId: "dujiangyan", startTime: "08:00", endTime: "11:30", duration: 3.5, description: "都江堰水利工程，世界文化遗产。" },
          afternoon: { activity: "leisure", startTime: "13:00", endTime: "17:00", duration: 4, description: "青城山一日游，感受青城天下幽。" },
          evening: { activity: "attraction", attractionId: "jinli-street", startTime: "19:00", endTime: "21:30", duration: 2.5, description: "宽窄巷子，老成都风貌。" },
          meals: { breakfast: "酒店早餐", lunch: "都江堰当地菜", dinnerRestaurantId: "longchaoshou-chengdu" },
          transport: { description: "高铁+景区交通", cost: 150 },
          accommodation: { area: "春熙路/太古里", suggestion: "同上" }
        },
        { day: 3, title: "文化美食",
          morning: { activity: "attraction", attractionId: "wuhou-shrine", startTime: "09:00", endTime: "11:30", duration: 2.5, description: "杜甫草堂，诗圣故居。" },
          afternoon: { activity: "attraction", attractionId: "jinli-street", startTime: "13:00", endTime: "15:30", duration: 2.5, description: "四川博物院，巴蜀文化。" },
          evening: { activity: "attraction", attractionId: "wangfujing-street", startTime: "16:30", endTime: "21:00", duration: 4.5, description: "春熙路太古里，购物美食，成都最繁华商圈。" },
          meals: { breakfast: "酒店早餐", lunchRestaurantId: "dazhangui-chengdu", dinnerRestaurantId: "dazhangui-chengdu" },
          transport: { description: "地铁+公交", cost: 35 },
          accommodation: { area: "行程结束", suggestion: "行程结束，祝您旅途愉快！" }
        }
      ]
    }
  ];

  var MOCK_TRAVEL_TIPS = [
    { cityId: "beijing", tips: [
      { category: "最佳旅行时间", content: "北京的最佳旅游时间是春秋两季，即4-5月和9-10月。此时气温适宜，天气晴朗。" },
      { category: "穿衣建议", content: "春秋季早晚温差大，建议带薄外套。夏季炎热，注意防晒。冬季寒冷，需要穿羽绒服。" },
      { category: "必备物品", content: "身份证（必备）、防晒霜、太阳镜、雨伞、舒适的运动鞋、充电宝、常用药品。" },
      { category: "当地习俗", content: "北京人说话直爽，爱吃面食。进寺庙参观要注意着装，不要穿短裤短裙。" },
      { category: "注意事项", content: "热门景点建议提前网上预约购票。地铁是最方便的出行方式。" }
    ]},
    { cityId: "shanghai", tips: [
      { category: "最佳旅行时间", content: "上海的最佳旅游时间是春秋两季，即3-5月和9-11月。此时气候温和，适合户外活动。" },
      { category: "穿衣建议", content: "春秋季穿长袖衬衫、薄外套即可。夏季炎热潮湿，注意防暑降温。冬季湿冷。" },
      { category: "必备物品", content: "身份证、雨伞（上海多雨）、防晒霜、舒适的鞋子、充电宝、薄外套。" },
      { category: "当地习俗", content: "上海人讲究精致，喜欢吃甜食，本帮菜偏甜。排队是上海的日常。" },
      { category: "注意事项", content: "上海地铁很发达，是出行首选。迪士尼建议工作日去，人少一些。" }
    ]},
    { cityId: "chengdu", tips: [
      { category: "最佳旅行时间", content: "成都的最佳旅游时间是春秋两季，即3-6月和9-11月。此时温度适宜，天气晴好。" },
      { category: "穿衣建议", content: "春秋季穿长袖加薄外套即可。夏季炎热多雨，带好雨具。冬季湿冷。" },
      { category: "必备物品", content: "身份证、雨伞（成都经常下雨）、肠胃药（吃辣多）、舒适的鞋子、防晒霜。" },
      { category: "当地习俗", content: "成都人生活节奏慢，喜欢喝茶、打麻将。吃火锅是社交活动，无辣不欢。" },
      { category: "注意事项", content: "看大熊猫一定要早上去，下午熊猫可能在睡觉。吃火锅不能吃辣要提前说。" }
    ]}
  ];

  var MOCK_FOLDERS = [
    { id: "folder-001", name: "国内游", icon: "folder", color: "#3B82F6" },
    { id: "folder-002", name: "美食之旅", icon: "star", color: "#F97316" },
    { id: "folder-003", name: "亲子游", icon: "heart", color: "#EC4899" }
  ];

  var MOCK_MY_PLANS = [
    {
      id: "plan-001",
      title: "五一北京之旅",
      cityId: "beijing",
      cityName: "北京",
      days: 5,
      startDate: "2026-05-01",
      people: 2,
      budget: "comfort",
      budgetAmount: 6000,
      status: "completed",
      coverImage: "https://picsum.photos/seed/plan001/600/400",
      itineraryId: "beijing-5day",
      tags: ["文化历史", "美食"],
      createdAt: "2026-04-10",
      updatedAt: "2026-05-06",
      order: 0,
      folderId: "folder-001",
      favorite: false,
      deleted: false,
      deletedAt: null
    },
    {
      id: "plan-002",
      title: "国庆成都美食之旅",
      cityId: "chengdu",
      cityName: "成都",
      days: 3,
      startDate: "2026-10-01",
      people: 3,
      budget: "comfort",
      budgetAmount: 5000,
      status: "planning",
      coverImage: "https://picsum.photos/seed/plan002/600/400",
      itineraryId: "chengdu-3day",
      tags: ["美食", "亲子游"],
      createdAt: "2026-08-15",
      updatedAt: "2026-09-01",
      order: 1,
      folderId: "folder-002",
      favorite: false,
      deleted: false,
      deletedAt: null
    },
    {
      id: "plan-003",
      title: "周末上海两日游",
      cityId: "shanghai",
      cityName: "上海",
      days: 2,
      startDate: "2026-07-13",
      people: 2,
      budget: "economy",
      budgetAmount: 2000,
      status: "completed",
      coverImage: "https://picsum.photos/seed/plan003/600/400",
      itineraryId: "beijing-3day",
      tags: ["周末游", "都市风光"],
      createdAt: "2026-07-05",
      updatedAt: "2026-07-15",
      order: 2,
      folderId: "folder-001",
      favorite: false,
      deleted: false,
      deletedAt: null
    },
    {
      id: "plan-004",
      title: "三亚蜜月度假",
      cityId: "sanya",
      cityName: "三亚",
      days: 5,
      startDate: "2026-11-10",
      people: 2,
      budget: "luxury",
      budgetAmount: 15000,
      status: "favorite",
      coverImage: "https://picsum.photos/seed/plan004/600/400",
      itineraryId: "beijing-5day",
      tags: ["情侣游", "休闲度假"],
      createdAt: "2026-09-20",
      updatedAt: "2026-09-25",
      order: 3,
      folderId: null,
      favorite: true,
      deleted: false,
      deletedAt: null
    },
    {
      id: "plan-005",
      title: "西安古都探索",
      cityId: "xian",
      cityName: "西安",
      days: 3,
      startDate: "2026-08-05",
      people: 1,
      budget: "economy",
      budgetAmount: 2500,
      status: "completed",
      coverImage: "https://picsum.photos/seed/plan005/600/400",
      itineraryId: "beijing-3day",
      tags: ["solo旅行", "文化历史"],
      createdAt: "2026-07-20",
      updatedAt: "2026-08-09",
      order: 4,
      folderId: null,
      favorite: false,
      deleted: false,
      deletedAt: null
    },
    {
      id: "plan-006",
      title: "杭州西湖漫步",
      cityId: "hangzhou",
      cityName: "杭州",
      days: 3,
      startDate: "2026-09-15",
      people: 2,
      budget: "comfort",
      budgetAmount: 3500,
      status: "planning",
      coverImage: "https://picsum.photos/seed/plan006/600/400",
      itineraryId: "beijing-3day",
      tags: ["自然风光", "情侣游"],
      createdAt: "2026-08-28",
      updatedAt: "2026-09-05",
      order: 5,
      folderId: "folder-003",
      favorite: false,
      deleted: false,
      deletedAt: null
    }
  ];

  var RECYCLED_PLANS = [];

  var MOCK_COMMUNITY = [
    {
      id: "share-001",
      title: "北京3日深度文化游",
      coverImage: "https://picsum.photos/seed/share001/600/400",
      cityId: "beijing",
      cityName: "北京",
      days: 3,
      author: { id: "user-001", name: "旅行达人小王", avatar: "https://picsum.photos/seed/user001/100/100", bio: "走遍全国的背包客" },
      tags: ["文化历史", "摄影", "美食"],
      likes: 328,
      favorites: 156,
      views: 2340,
      summary: "这条路线带你深度体验北京的历史文化，从故宫到长城，从胡同到皇家园林，三天时间感受千年古都的魅力。",
      itineraryId: "beijing-3day",
      sharedAt: "2026-06-15",
      category: ["all", "domestic", "nature"]
    },
    {
      id: "share-002",
      title: "上海4日都市风情游",
      coverImage: "https://picsum.photos/seed/share002/600/400",
      cityId: "shanghai",
      cityName: "上海",
      days: 4,
      author: { id: "user-002", name: "城市探索者Lily", avatar: "https://picsum.photos/seed/user002/100/100", bio: "喜欢城市漫步和美食探店" },
      tags: ["都市风光", "购物", "美食"],
      likes: 512,
      favorites: 234,
      views: 4521,
      summary: "从外滩的万国建筑到陆家嘴的摩天大楼，从豫园的古典园林到田子坊的文艺小店，感受魔都的独特魅力。",
      itineraryId: "beijing-3day",
      sharedAt: "2026-06-20",
      category: ["all", "domestic", "food"]
    },
    {
      id: "share-003",
      title: "成都5日慢生活美食游",
      coverImage: "https://picsum.photos/seed/share003/600/400",
      cityId: "chengdu",
      cityName: "成都",
      days: 5,
      author: { id: "user-003", name: "吃货小张", avatar: "https://picsum.photos/seed/user003/100/100", bio: "为了美食可以走遍天下" },
      tags: ["美食", "休闲", "亲子游"],
      likes: 890,
      favorites: 567,
      views: 8932,
      summary: "在成都的街头走一走，看看憨态可掬的大熊猫，尝尝地道的川菜火锅，体验天府之国的慢生活。",
      itineraryId: "chengdu-3day",
      sharedAt: "2026-06-25",
      category: ["all", "domestic", "food", "family"]
    },
    {
      id: "share-004",
      title: "杭州3日西湖诗意游",
      coverImage: "https://picsum.photos/seed/share004/600/400",
      cityId: "hangzhou",
      cityName: "杭州",
      days: 3,
      author: { id: "user-004", name: "文艺青年阿美", avatar: "https://picsum.photos/seed/user004/100/100", bio: "喜欢用镜头记录美好" },
      tags: ["自然风光", "情侣游", "摄影"],
      likes: 678,
      favorites: 345,
      views: 5678,
      summary: "上有天堂下有苏杭，西湖的湖光山色令人陶醉。三天时间，慢慢品味这座人间天堂的温婉与精致。",
      itineraryId: "beijing-3day",
      sharedAt: "2026-06-18",
      category: ["all", "domestic", "nature", "couple"]
    },
    {
      id: "share-005",
      title: "西安4日古都穿越之旅",
      coverImage: "https://picsum.photos/seed/share005/600/400",
      cityId: "xian",
      cityName: "西安",
      days: 4,
      author: { id: "user-005", name: "历史爱好者老李", avatar: "https://picsum.photos/seed/user005/100/100", bio: "读万卷书行万里路" },
      tags: ["文化历史", "solo旅行", "美食"],
      likes: 456,
      favorites: 289,
      views: 3456,
      summary: "十三朝古都西安，兵马俑的震撼、古城墙的雄伟、回民街的美食，让你穿越千年感受大唐盛世。",
      itineraryId: "beijing-3day",
      sharedAt: "2026-06-22",
      category: ["all", "domestic", "nature"]
    },
    {
      id: "share-006",
      title: "厦门3日文艺海滨游",
      coverImage: "https://picsum.photos/seed/share006/600/400",
      cityId: "xiamen",
      cityName: "厦门",
      days: 3,
      author: { id: "user-006", name: "鼓浪屿原住民", avatar: "https://picsum.photos/seed/user006/100/100", bio: "土生土长的厦门人" },
      tags: ["自然风光", "情侣游", "文艺"],
      likes: 723,
      favorites: 412,
      views: 6789,
      summary: "鼓浪屿的文艺风情、环岛路的碧海蓝天、厦门大学的最美校园，厦门的浪漫等你来体验。",
      itineraryId: "beijing-3day",
      sharedAt: "2026-06-28",
      category: ["all", "domestic", "nature", "couple"]
    },
    {
      id: "share-007",
      title: "北京5日亲子深度游",
      coverImage: "https://picsum.photos/seed/share007/600/400",
      cityId: "beijing",
      cityName: "北京",
      days: 5,
      author: { id: "user-007", name: "宝妈玲玲", avatar: "https://picsum.photos/seed/user007/100/100", bio: "带着娃看世界" },
      tags: ["亲子游", "文化历史", "主题乐园"],
      likes: 1023,
      favorites: 789,
      views: 12345,
      summary: "专为亲子家庭设计的北京行程，既有故宫长城的文化熏陶，也有科技馆欢乐谷的欢乐时光。",
      itineraryId: "beijing-5day",
      sharedAt: "2026-06-10",
      category: ["all", "domestic", "family"]
    },
    {
      id: "share-008",
      title: "三亚5日蜜月度假游",
      coverImage: "https://picsum.photos/seed/share008/600/400",
      cityId: "sanya",
      cityName: "三亚",
      days: 5,
      author: { id: "user-008", name: "蜜月旅行家", avatar: "https://picsum.photos/seed/user008/100/100", bio: "分享浪漫的旅行故事" },
      tags: ["自然风光", "情侣游", "休闲度假"],
      likes: 1567,
      favorites: 1234,
      views: 18765,
      summary: "亚龙湾的细腻沙滩、蜈支洲岛的清澈海水、天涯海角的浪漫誓言，最适合情侣的三亚蜜月之旅。",
      itineraryId: "beijing-5day",
      sharedAt: "2026-06-05",
      category: ["all", "domestic", "couple", "nature"]
    },
    {
      id: "share-009",
      title: "重庆4日8D魔幻城市游",
      coverImage: "https://picsum.photos/seed/share009/600/400",
      cityId: "chongqing",
      cityName: "重庆",
      days: 4,
      author: { id: "user-009", name: "山城老饕", avatar: "https://picsum.photos/seed/user009/100/100", bio: "在重庆吃了二十多年" },
      tags: ["美食", "都市风光", "solo旅行"],
      likes: 934,
      favorites: 678,
      views: 10234,
      summary: "洪崖洞的吊脚楼夜景、磁器口的古镇风情、解放碑的繁华商圈，还有让人欲罢不能的重庆火锅。",
      itineraryId: "beijing-3day",
      sharedAt: "2026-06-30",
      category: ["all", "domestic", "food"]
    },
    {
      id: "share-010",
      title: "苏州3日江南水乡游",
      coverImage: "https://picsum.photos/seed/share010/600/400",
      cityId: "suzhou",
      cityName: "苏州",
      days: 3,
      author: { id: "user-010", name: "江南女子小婉", avatar: "https://picsum.photos/seed/user010/100/100", bio: "喜欢园林和昆曲" },
      tags: ["文化历史", "自然风光", "情侣游"],
      likes: 567,
      favorites: 345,
      views: 4567,
      summary: "拙政园、留园的精致园林，平江路、山塘街的小桥流水，感受东方威尼斯的温婉与诗意。",
      itineraryId: "beijing-3day",
      sharedAt: "2026-06-12",
      category: ["all", "domestic", "nature", "couple"]
    },
    {
      id: "share-101",
      title: "东京5日漫游记",
      coverImage: "https://picsum.photos/seed/share101/600/400",
      cityId: "tokyo",
      cityName: "东京",
      days: 5,
      author: { id: "user-101", name: "樱花少女", avatar: "https://picsum.photos/seed/user101/100/100", bio: "日本通，打卡控" },
      tags: ["都市风光", "购物", "美食"],
      likes: 1256,
      favorites: 890,
      views: 12340,
      summary: "从浅草寺到涩谷十字路口，从筑地市场的新鲜寿司到新宿的霓虹夜色，带你玩遍东京的每一个角落。",
      itineraryId: "tokyo-5day",
      sharedAt: "2026-06-20",
      category: ["all", "overseas", "food", "shopping"]
    },
    {
      id: "share-102",
      title: "曼谷7日悠闲度假",
      coverImage: "https://picsum.photos/seed/share102/600/400",
      cityId: "bangkok",
      cityName: "曼谷",
      days: 7,
      author: { id: "user-102", name: "泰北玫瑰", avatar: "https://picsum.photos/seed/user102/100/100", bio: "常驻泰国，爱美食爱生活" },
      tags: ["休闲度假", "美食", "海岛"],
      likes: 2340,
      favorites: 1560,
      views: 23450,
      summary: "大皇宫的金碧辉煌、水上市场的烟火气、马杀鸡的舒适放松，还有吃不完的芒果糯米饭和冬阴功汤。",
      itineraryId: "bangkok-7day",
      sharedAt: "2026-06-18",
      category: ["all", "overseas", "food", "relax"]
    },
    {
      id: "share-103",
      title: "京都3日红叶季",
      coverImage: "https://picsum.photos/seed/share103/600/400",
      cityId: "kyoto",
      cityName: "京都",
      days: 3,
      author: { id: "user-103", name: "和风旅人", avatar: "https://picsum.photos/seed/user103/100/100", bio: "走过100座日本城市" },
      tags: ["文化历史", "自然风光", "摄影"],
      likes: 3450,
      favorites: 2100,
      views: 34560,
      summary: "清水寺的夜枫、岚山的竹林、伏见稻荷的千本鸟居，秋天的京都美得不像话，一生一定要来一次。",
      itineraryId: "kyoto-3day",
      sharedAt: "2026-06-10",
      category: ["all", "overseas", "nature", "culture"]
    },
    {
      id: "share-104",
      title: "巴黎5日浪漫之旅",
      coverImage: "https://picsum.photos/seed/share104/600/400",
      cityId: "paris",
      cityName: "巴黎",
      days: 5,
      author: { id: "user-104", name: "法式风情", avatar: "https://picsum.photos/seed/user104/100/100", bio: "欧洲旅行博主" },
      tags: ["情侣游", "文化历史", "摄影"],
      likes: 4560,
      favorites: 3200,
      views: 56780,
      summary: "埃菲尔铁塔的夜景、卢浮宫的艺术宝藏、塞纳河的游船、蒙马特高地的文艺气息，感受法式浪漫。",
      itineraryId: "paris-5day",
      sharedAt: "2026-06-05",
      category: ["all", "overseas", "couple", "culture"]
    },
    {
      id: "share-105",
      title: "首尔4日逛吃之旅",
      coverImage: "https://picsum.photos/seed/share105/600/400",
      cityId: "seoul",
      cityName: "首尔",
      days: 4,
      author: { id: "user-105", name: "韩剧女主", avatar: "https://picsum.photos/seed/user105/100/100", bio: "追剧+逛吃=快乐" },
      tags: ["美食", "购物", "休闲"],
      likes: 2100,
      favorites: 1680,
      views: 28900,
      summary: "明洞购物、弘大逛街、景福宫穿韩服、还有吃不完的韩式烤肉部队锅参鸡汤，逛吃逛吃超满足！",
      itineraryId: "seoul-4day",
      sharedAt: "2026-06-22",
      category: ["all", "overseas", "food", "shopping"]
    },
    {
      id: "share-106",
      title: "新加坡3日亲子游",
      coverImage: "https://picsum.photos/seed/share106/600/400",
      cityId: "singapore",
      cityName: "新加坡",
      days: 3,
      author: { id: "user-106", name: "辣妈带娃", avatar: "https://picsum.photos/seed/user106/100/100", bio: "带娃走遍世界" },
      tags: ["亲子游", "休闲度假", "主题乐园"],
      likes: 1890,
      favorites: 1450,
      views: 23400,
      summary: "环球影城、动物园、滨海湾花园、鱼尾狮公园，中文通行超方便，带娃旅行首选地。",
      itineraryId: "singapore-3day",
      sharedAt: "2026-06-08",
      category: ["all", "overseas", "family", "theme"]
    }
  ];

  var MOCK_USERS = {
    currentUser: {
      id: "user-me",
      name: "旅行的我",
      avatar: "https://picsum.photos/seed/me/200/200",
      bio: "热爱旅行，热爱生活",
      stats: { plans: 5, favorites: 23, following: 18, followers: 32 }
    }
  };

  var MOCK_POIS = [
    { id: "hotel-beijing-001", name: "北京王府井希尔顿酒店", cityId: "beijing", category: "hotel",
      categoryName: "酒店", icon: "🏨", rating: 4.8, priceLevel: 3,
      address: "北京市东城区王府井大街8号",
      description: "位于王府井商业区核心位置，交通便利，周边餐饮购物选择丰富。",
      imageUrl: "https://picsum.photos/seed/hotel-bj-001/400/300", mapX: 54, mapY: 43 },
    { id: "hotel-beijing-002", name: "北京三里屯洲际酒店", cityId: "beijing", category: "hotel",
      categoryName: "酒店", icon: "🏨", rating: 4.7, priceLevel: 3,
      address: "北京市朝阳区三里屯路1号",
      description: "时尚潮流地段，夜生活丰富，适合年轻人入住。",
      imageUrl: "https://picsum.photos/seed/hotel-bj-002/400/300", mapX: 62, mapY: 48 },
    { id: "hotel-beijing-003", name: "北京西单美爵酒店", cityId: "beijing", category: "hotel",
      categoryName: "酒店", icon: "🏨", rating: 4.5, priceLevel: 2,
      address: "北京市西城区西单北大街120号",
      description: "靠近西单商圈，购物方便，性价比高。",
      imageUrl: "https://picsum.photos/seed/hotel-bj-003/400/300", mapX: 45, mapY: 46 },
    { id: "shopping-beijing-001", name: "王府井步行街", cityId: "beijing", category: "shopping",
      categoryName: "购物", icon: "🛍️", rating: 4.6, priceLevel: 2,
      address: "北京市东城区王府井大街",
      description: "北京最著名的商业街，各类品牌店、老字号云集。",
      imageUrl: "https://picsum.photos/seed/shop-bj-001/400/300", mapX: 53, mapY: 41 },
    { id: "shopping-beijing-002", name: "三里屯太古里", cityId: "beijing", category: "shopping",
      categoryName: "购物", icon: "🛍️", rating: 4.7, priceLevel: 3,
      address: "北京市朝阳区三里屯路19号",
      description: "北京时尚地标，国际品牌、潮牌、网红店聚集地。",
      imageUrl: "https://picsum.photos/seed/shop-bj-002/400/300", mapX: 61, mapY: 50 },
    { id: "transport-beijing-001", name: "北京首都国际机场", cityId: "beijing", category: "transport",
      categoryName: "交通枢纽", icon: "✈️", rating: 4.4, priceLevel: 0,
      address: "北京市顺义区机场西路",
      description: "中国最大的机场之一，国内外航线众多。",
      imageUrl: "https://picsum.photos/seed/trans-bj-001/400/300", mapX: 85, mapY: 20 },
    { id: "transport-beijing-002", name: "北京南站", cityId: "beijing", category: "transport",
      categoryName: "交通枢纽", icon: "🚄", rating: 4.3, priceLevel: 0,
      address: "北京市丰台区永外大街车站路12号",
      description: "北京主要高铁站，京沪高铁始发站。",
      imageUrl: "https://picsum.photos/seed/trans-bj-002/400/300", mapX: 50, mapY: 65 },
    { id: "cafe-beijing-001", name: "星巴克（故宫店）", cityId: "beijing", category: "cafe",
      categoryName: "咖啡厅", icon: "☕", rating: 4.4, priceLevel: 2,
      address: "北京市东城区景山前街4号",
      description: "位于故宫角楼附近，可以边喝咖啡边欣赏故宫景色。",
      imageUrl: "https://picsum.photos/seed/cafe-bj-001/400/300", mapX: 50, mapY: 43 },
    { id: "hotel-shanghai-001", name: "上海外滩华尔道夫酒店", cityId: "shanghai", category: "hotel",
      categoryName: "酒店", icon: "🏨", rating: 4.9, priceLevel: 3,
      address: "上海市黄浦区中山东一路2号",
      description: "外滩百年历史建筑，江景房视野绝佳。",
      imageUrl: "https://picsum.photos/seed/hotel-sh-001/400/300", mapX: 55, mapY: 42 },
    { id: "hotel-shanghai-002", name: "上海浦东丽思卡尔顿酒店", cityId: "shanghai", category: "hotel",
      categoryName: "酒店", icon: "🏨", rating: 4.8, priceLevel: 3,
      address: "上海市浦东新区世纪大道8号",
      description: "陆家嘴金融中心，俯瞰黄浦江和外滩全景。",
      imageUrl: "https://picsum.photos/seed/hotel-sh-002/400/300", mapX: 62, mapY: 48 },
    { id: "shopping-shanghai-001", name: "南京路步行街", cityId: "shanghai", category: "shopping",
      categoryName: "购物", icon: "🛍️", rating: 4.6, priceLevel: 2,
      address: "上海市黄浦区南京东路",
      description: "上海最繁华的商业街，百年老字号和现代商场并存。",
      imageUrl: "https://picsum.photos/seed/shop-sh-001/400/300", mapX: 53, mapY: 44 },
    { id: "transport-shanghai-001", name: "上海虹桥国际机场", cityId: "shanghai", category: "transport",
      categoryName: "交通枢纽", icon: "✈️", rating: 4.5, priceLevel: 0,
      address: "上海市长宁区虹桥路2550号",
      description: "上海主要国内机场，距离市区较近。",
      imageUrl: "https://picsum.photos/seed/trans-sh-001/400/300", mapX: 20, mapY: 48 },
    { id: "hotel-chengdu-001", name: "成都瑞吉酒店", cityId: "chengdu", category: "hotel",
      categoryName: "酒店", icon: "🏨", rating: 4.8, priceLevel: 3,
      address: "成都市锦江区太升南路88号",
      description: "位于市中心，交通便利，服务品质一流。",
      imageUrl: "https://picsum.photos/seed/hotel-cd-001/400/300", mapX: 52, mapY: 45 },
    { id: "hotel-chengdu-002", name: "成都博舍酒店", cityId: "chengdu", category: "hotel",
      categoryName: "酒店", icon: "🏨", rating: 4.9, priceLevel: 3,
      address: "成都市锦江区笔帖式街81号",
      description: "太古里精品酒店，设计感十足，闹中取静。",
      imageUrl: "https://picsum.photos/seed/hotel-cd-002/400/300", mapX: 55, mapY: 48 },
    { id: "shopping-chengdu-001", name: "成都远洋太古里", cityId: "chengdu", category: "shopping",
      categoryName: "购物", icon: "🛍️", rating: 4.8, priceLevel: 3,
      address: "成都市锦江区中纱帽街8号",
      description: "开放式购物中心，国际品牌与川西建筑风格融合。",
      imageUrl: "https://picsum.photos/seed/shop-cd-001/400/300", mapX: 54, mapY: 47 }
  ];

  var MAP_CITY_COORDS = {
    beijing: { lat: 39.9042, lng: 116.4074, zoom: 11 },
    shanghai: { lat: 31.2304, lng: 121.4737, zoom: 12 },
    chengdu: { lat: 30.5728, lng: 104.0668, zoom: 11 },
    hangzhou: { lat: 30.2741, lng: 120.1551, zoom: 12 },
    xian: { lat: 34.3416, lng: 108.9398, zoom: 12 },
    xiamen: { lat: 24.4798, lng: 118.0894, zoom: 12 },
    sanya: { lat: 18.2528, lng: 109.5119, zoom: 12 },
    chongqing: { lat: 29.5630, lng: 106.5516, zoom: 11 },
    guangzhou: { lat: 23.1291, lng: 113.2644, zoom: 12 },
    suzhou: { lat: 31.2989, lng: 120.5853, zoom: 12 },
    tokyo: { lat: 35.6762, lng: 139.6503, zoom: 11 },
    osaka: { lat: 34.6937, lng: 135.5023, zoom: 12 },
    bangkok: { lat: 13.7563, lng: 100.5018, zoom: 11 },
    seoul: { lat: 37.5665, lng: 126.9780, zoom: 11 },
    singapore: { lat: 1.3521, lng: 103.8198, zoom: 11 },
    paris: { lat: 48.8566, lng: 2.3522, zoom: 12 },
    newyork: { lat: 40.7128, lng: -74.0060, zoom: 11 },
    kyoto: { lat: 35.0116, lng: 135.7681, zoom: 12 }
  };

  var MAP_POI_COORDS = {
    'forbidden-city': { lat: 39.9163, lng: 116.3972 },
    'great-wall-badaling': { lat: 40.3597, lng: 116.0200 },
    'summer-palace': { lat: 39.9997, lng: 116.2755 },
    'tiananmen-square': { lat: 39.9055, lng: 116.3975 },
    'temple-of-heaven': { lat: 39.8822, lng: 116.4066 },
    'national-museum-china': { lat: 39.9045, lng: 116.4011 },
    '798-art-zone': { lat: 39.9841, lng: 116.4947 },
    'wangfujing-street': { lat: 39.9150, lng: 116.4110 },
    'hutong-nanluoguxiang': { lat: 39.9420, lng: 116.4030 },
    'beihai-park': { lat: 39.9255, lng: 116.3899 },
    'the-bund': { lat: 31.2400, lng: 121.4900 },
    'oriental-pearl': { lat: 31.2397, lng: 121.4998 },
    'yu-garden': { lat: 31.2273, lng: 121.4921 },
    'shanghai-museum': { lat: 31.2304, lng: 121.4755 },
    'chengdu-research-base': { lat: 30.7346, lng: 104.1470 },
    'wuhou-shrine': { lat: 30.6423, lng: 104.0430 },
    'jinli-street': { lat: 30.6420, lng: 104.0423 },
    'dujiangyan': { lat: 31.0011, lng: 103.6058 },
    'quanjude-beijing': { lat: 39.8978, lng: 116.3954 },
    'siji-minfu-beijing': { lat: 39.9187, lng: 116.3981 },
    'donglaishun-beijing': { lat: 39.9146, lng: 116.4116 },
    'naixiongxiong-beijing': { lat: 39.8849, lng: 116.3595 },
    'nanxiang': { lat: 31.2283, lng: 121.4920 },
    'shanghai-no1-shanghai': { lat: 31.2280, lng: 121.4910 },
    'chenmapo-chengdu': { lat: 30.6640, lng: 104.0370 },
    'zhongshuijiao-chengdu': { lat: 30.6600, lng: 104.0800 },
    'dazhangui-chengdu': { lat: 30.6575, lng: 104.0810 },
    'longchaoshou-chengdu': { lat: 30.6585, lng: 104.0815 },
    'hotel-beijing-001': { lat: 39.9176, lng: 116.4140 },
    'hotel-beijing-002': { lat: 39.9338, lng: 116.4550 },
    'hotel-beijing-003': { lat: 39.9135, lng: 116.3730 },
    'shopping-beijing-001': { lat: 39.9150, lng: 116.4110 },
    'shopping-beijing-002': { lat: 39.9340, lng: 116.4550 },
    'transport-beijing-001': { lat: 40.0801, lng: 116.5846 },
    'transport-beijing-002': { lat: 39.8650, lng: 116.3790 },
    'cafe-beijing-001': { lat: 39.9168, lng: 116.3975 },
    'hotel-shanghai-001': { lat: 31.2365, lng: 121.4890 },
    'hotel-shanghai-002': { lat: 31.2375, lng: 121.5010 },
    'shopping-shanghai-001': { lat: 31.2348, lng: 121.4740 },
    'transport-shanghai-001': { lat: 31.1979, lng: 121.3363 },
    'hotel-chengdu-001': { lat: 30.6596, lng: 104.0760 },
    'hotel-chengdu-002': { lat: 30.6535, lng: 104.0815 },
    'shopping-chengdu-001': { lat: 30.6530, lng: 104.0810 }
  };

  // ========================================
  // 应用状态
  // ========================================

  var state = {
    currentTab: 'home',
    currentPage: null,
    // 新建规划表单
    form: {
      departureCity: '',
      destinationCity: 'beijing',
      departureDate: '',
      days: 3,
      adults: 2,
      children: 0,
      budget: 'comfort',
      preferences: [],
      travelStyle: 'classic'
    },
    // 行程详情
    detail: {
      plan: null,
      itinerary: null,
      currentDay: 1,
      currentTab: 'itinerary'
    },
    itineraryEdit: {
      type: null,
      period: null,
      activityIndex: 0,
      mealKey: null,
      transportIndex: null,
      transportDraft: null
    },
    // 发现页
    discover: {
      currentCategory: 'all',
      currentItem: null,
      currentItinerary: null,
      currentDay: 1
    },
    // 地图
    map: {
      zoomLevel: 12,
      filter: 'all'
    },
    // 规划列表
    planList: {
      currentFolder: 'all',
      sortBy: 'custom',
      isEditMode: false,
      selectedPlans: [],
      openSwipeId: null
    },
    // 新建文件夹
    newFolder: {
      name: '',
      icon: 'folder',
      color: '#3B82F6'
    },
    // 旅行助手
    assistant: {
      currentTab: 'domestic',
      selectedCityId: 'beijing',
      selectedInfo: 'overview'
    }
  };

  var mapRuntime = {
    instance: null,
    markerLayer: null,
    routeLayer: null,
    markers: [],
    cityId: null
  };

  var discoverMapRuntime = {
    instance: null,
    markerLayer: null,
    routeLayer: null,
    cityId: null
  };

  // ========================================
  // DOM 元素缓存
  // ========================================

  var dom = {};

  function cacheDom() {
    // Tab 栏
    dom.tabBarItems = document.querySelectorAll('.tab-bar-item');
    dom.tabViews = document.querySelectorAll('.tab-view');

    // Tab 1: 旅游计划
    dom.homeSearchBtn = document.getElementById('homeSearchBtn');
    dom.planList = document.getElementById('planList');
    dom.planCount = document.getElementById('planCount');
    dom.newPlanBtn = document.getElementById('newPlanBtn');
    dom.folderScroll = document.getElementById('folderScroll');
    dom.sortBtn = document.getElementById('sortBtn');
    dom.sortModal = document.getElementById('sortModal');
    dom.sortModalOverlay = document.getElementById('sortModalOverlay');
    dom.sortModalClose = document.getElementById('sortModalClose');
    dom.sortOptions = document.getElementById('sortOptions');
    dom.folderModal = document.getElementById('folderModal');
    dom.folderModalOverlay = document.getElementById('folderModalOverlay');
    dom.folderModalClose = document.getElementById('folderModalClose');
    dom.folderNameInput = document.getElementById('folderNameInput');
    dom.folderIconOptions = document.getElementById('folderIconOptions');
    dom.folderColorOptions = document.getElementById('folderColorOptions');
    dom.createFolderBtn = document.getElementById('createFolderBtn');
    dom.moveFolderModal = document.getElementById('moveFolderModal');
    dom.moveFolderOverlay = document.getElementById('moveFolderOverlay');
    dom.moveFolderClose = document.getElementById('moveFolderClose');
    dom.moveFolderList = document.getElementById('moveFolderList');
    dom.shareModal = document.getElementById('shareModal');
    dom.shareOverlay = document.getElementById('shareOverlay');
    dom.shareClose = document.getElementById('shareClose');
    dom.confirmModal = document.getElementById('confirmModal');
    dom.confirmOverlay = document.getElementById('confirmOverlay');
    dom.confirmText = document.getElementById('confirmText');
    dom.confirmCancel = document.getElementById('confirmCancel');
    dom.confirmOk = document.getElementById('confirmOk');

    // 新建规划页
    dom.pageNewPlan = document.getElementById('page-new-plan');
    dom.backFromNewPlan = document.getElementById('backFromNewPlan');
    dom.destinationPicker = document.getElementById('destinationPicker');
    dom.selectedDestinationDisplay = document.getElementById('selectedDestinationDisplay');
    dom.npDepartureDate = document.getElementById('npDepartureDate');
    dom.npDaySelector = document.getElementById('npDaySelector');
    dom.npAdultMinus = document.getElementById('npAdultMinus');
    dom.npAdultPlus = document.getElementById('npAdultPlus');
    dom.npAdultCount = document.getElementById('npAdultCount');
    dom.npChildMinus = document.getElementById('npChildMinus');
    dom.npChildPlus = document.getElementById('npChildPlus');
    dom.npChildCount = document.getElementById('npChildCount');
    dom.npBudgetOptions = document.getElementById('npBudgetOptions');
    dom.npPreferenceTags = document.getElementById('npPreferenceTags');
    dom.npStyleOptions = document.getElementById('npStyleOptions');
    dom.npGenerateBtn = document.getElementById('npGenerateBtn');

    // 城市选择页
    dom.pageCityPicker = document.getElementById('page-city-picker');
    dom.backFromCityPicker = document.getElementById('backFromCityPicker');
    dom.cityPickerSearch = document.getElementById('cityPickerSearch');
    dom.cityPickerList = document.getElementById('cityPickerList');
    dom.cityPickerEmpty = document.getElementById('cityPickerEmpty');
    dom.cityPickerTabs = document.getElementById('cityPickerTabs');
    dom.cityPickerCategories = document.getElementById('cityPickerCategories');

    // 行程详情页
    dom.pagePlanDetail = document.getElementById('page-plan-detail');
    dom.backFromDetail = document.getElementById('backFromDetail');
    dom.detailTitle = document.getElementById('detailTitle');
    dom.detailCity = document.getElementById('detailCity');
    dom.detailDays = document.getElementById('detailDays');
    dom.detailPeople = document.getElementById('detailPeople');
    dom.detailBudget = document.getElementById('detailBudget');
    dom.detailTags = document.getElementById('detailTags');
    dom.tagModal = document.getElementById('tagModal');
    dom.tagEditGrid = document.getElementById('tagEditGrid');
    dom.tagModalSave = document.getElementById('tagModalSave');
    dom.detailDaySwitcher = document.getElementById('detailDaySwitcher');
    dom.detailDayNum = document.getElementById('detailDayNum');
    dom.detailDayName = document.getElementById('detailDayName');
    dom.detailMorningCard = document.getElementById('detailMorningCard');
    dom.detailAfternoonCard = document.getElementById('detailAfternoonCard');
    dom.detailEveningCard = document.getElementById('detailEveningCard');
    dom.detailRestaurantCards = document.getElementById('detailRestaurantCards');
    dom.detailTransportBar = document.getElementById('detailTransportBar');
    dom.detailAccommodationCard = document.getElementById('detailAccommodationCard');
    dom.detailTabItinerary = document.getElementById('detailTabItinerary');
    dom.itineraryEditModal = document.getElementById('itineraryEditModal');
    dom.itineraryEditOverlay = document.getElementById('itineraryEditOverlay');
    dom.itineraryEditClose = document.getElementById('itineraryEditClose');
    dom.itineraryEditCancel = document.getElementById('itineraryEditCancel');
    dom.itineraryEditSave = document.getElementById('itineraryEditSave');
    dom.itineraryEditTitle = document.getElementById('itineraryEditTitle');
    dom.itineraryEditBody = document.getElementById('itineraryEditBody');
    dom.detailTabs = document.querySelector('#page-plan-detail .result-tabs--detail');
    dom.detailTabBtns = document.querySelectorAll('#page-plan-detail .tab-btn');
    dom.detailTabContents = document.querySelectorAll('#page-plan-detail .tab-content');
    dom.detailBudgetTotal = document.getElementById('detailBudgetTotal');
    dom.detailBudgetMeta = document.getElementById('detailBudgetMeta');
    dom.detailTotalBudget = document.getElementById('detailTotalBudget');
    dom.detailBudgetTickets = document.getElementById('detailBudgetTickets');
    dom.detailBudgetFood = document.getElementById('detailBudgetFood');
    dom.detailBudgetHotel = document.getElementById('detailBudgetHotel');
    dom.detailBudgetTransport = document.getElementById('detailBudgetTransport');
    dom.detailBudgetOther = document.getElementById('detailBudgetOther');
    dom.ledgerBudgetOptions = document.getElementById('ledgerBudgetOptions');
    dom.ledgerBudgetAmount = document.getElementById('ledgerBudgetAmount');
    dom.ledgerSpentAmount = document.getElementById('ledgerSpentAmount');
    dom.ledgerDifferenceItem = document.getElementById('ledgerDifferenceItem');
    dom.ledgerDifferenceLabel = document.getElementById('ledgerDifferenceLabel');
    dom.ledgerDifferenceAmount = document.getElementById('ledgerDifferenceAmount');
    dom.ledgerProgressFill = document.getElementById('ledgerProgressFill');
    dom.ledgerCategoryList = document.getElementById('ledgerCategoryList');
    dom.ledgerEntryList = document.getElementById('ledgerEntryList');
    dom.ledgerEntryCount = document.getElementById('ledgerEntryCount');
    dom.ledgerAddEntry = document.getElementById('ledgerAddEntry');
    dom.ledgerAddCategory = document.getElementById('ledgerAddCategory');
    dom.ledgerEntryModal = document.getElementById('ledgerEntryModal');
    dom.ledgerCategoryModal = document.getElementById('ledgerCategoryModal');
    dom.mapDayCarousel = document.getElementById('mapDayCarousel');
    dom.detailTipsList = document.getElementById('detailTipsList');
    dom.detailShareBtn = document.getElementById('detailShareBtn');
    dom.detailFavBtn = document.getElementById('detailFavBtn');

    // Tab 2: 发现
    dom.discoverSearchBtn = document.getElementById('discoverSearchBtn');
    dom.categoryScroll = document.getElementById('categoryScroll');
    dom.waterfallCol1 = document.getElementById('waterfallCol1');
    dom.waterfallCol2 = document.getElementById('waterfallCol2');
    dom.categoryChips = document.querySelectorAll('.category-chip');

    // 发现详情页
    dom.pageDiscoverDetail = document.getElementById('page-discover-detail');
    dom.backFromDiscoverDetail = document.getElementById('backFromDiscoverDetail');
    dom.discoverCover = document.getElementById('discoverCover');
    dom.discoverTitle = document.getElementById('discoverTitle');
    dom.discoverAvatar = document.getElementById('discoverAvatar');
    dom.discoverAuthorName = document.getElementById('discoverAuthorName');
    dom.discoverAuthorBio = document.getElementById('discoverAuthorBio');
    dom.discoverTags = document.getElementById('discoverTags');
    dom.discoverSummary = document.getElementById('discoverSummary');
    dom.discoverDays = document.getElementById('discoverDays');
    dom.discoverAttractions = document.getElementById('discoverAttractions');
    dom.discoverBudget = document.getElementById('discoverBudget');
    dom.discoverCityName = document.getElementById('discoverCityName');
    dom.discoverHighlights = document.getElementById('discoverHighlights');
    dom.discoverItineraryMeta = document.getElementById('discoverItineraryMeta');
    dom.discoverDayTabs = document.getElementById('discoverDayTabs');
    dom.discoverDaySummary = document.getElementById('discoverDaySummary');
    dom.discoverDayTimeline = document.getElementById('discoverDayTimeline');
    dom.discoverRouteMap = document.getElementById('discoverRouteMap');
    dom.discoverMapHint = document.getElementById('discoverMapHint');
    dom.discoverTips = document.getElementById('discoverTips');
    dom.discoverFollowBtn = document.getElementById('discoverFollowBtn');
    dom.discoverHeaderShareBtn = document.getElementById('discoverHeaderShareBtn');
    dom.discoverShareBtn = document.getElementById('discoverShareBtn');
    dom.discoverLikeBtn = document.getElementById('discoverLikeBtn');
    dom.discoverLikes = document.getElementById('discoverLikes');
    dom.discoverFavBtn = document.getElementById('discoverFavBtn');
    dom.discoverFavs = document.getElementById('discoverFavs');
    dom.reusePlanBtn = document.getElementById('reusePlanBtn');

    // Tab 3: 旅行助手
    dom.assistantSearchBtn = document.getElementById('assistantSearchBtn');
    dom.assistantCityScroll = document.getElementById('assistantCityScroll');
    dom.assistantContent = document.getElementById('assistantContent');
    dom.assistantTabs = document.querySelectorAll('.assistant-tab');

    // 回收站页
    dom.pageRecycleBin = document.getElementById('page-recycle-bin');
    dom.backFromRecycleBin = document.getElementById('backFromRecycleBin');
    dom.recycleBinList = document.getElementById('recycleBinList');
    dom.recycleBinEmpty = document.getElementById('recycleBinEmpty');

    // Tab 3: 我的
    dom.userAvatar = document.getElementById('userAvatar');
    dom.userName = document.getElementById('userName');
    dom.userBio = document.getElementById('userBio');
    dom.statPlans = document.getElementById('statPlans');
    dom.statFavorites = document.getElementById('statFavorites');
    dom.statFollowing = document.getElementById('statFollowing');
    dom.statFollowers = document.getElementById('statFollowers');
    dom.menuItems = document.querySelectorAll('.menu-item');

    // 加载页
    dom.pageLoading = document.getElementById('page-loading');
    dom.loadingStatusText = document.getElementById('loadingStatusText');
    dom.stepItems = document.querySelectorAll('.step-item');

    // 地图相关
    dom.detailItineraryMap = document.getElementById('detailItineraryMap');
    dom.itineraryScrollContainer = document.getElementById('itineraryScrollContainer');
    dom.planDetailSheet = document.getElementById('planDetailSheet');
    dom.planDetailSheetHandle = document.getElementById('planDetailSheetHandle');
    dom.itineraryMapReveal = document.getElementById('itineraryMapReveal');
    dom.itineraryMapTitle = document.getElementById('itineraryMapTitle');
    dom.itineraryMapCount = document.getElementById('itineraryMapCount');

    // Bottom Sheet
    dom.poiBottomSheet = document.getElementById('poiBottomSheet');
    dom.poiSheetOverlay = document.getElementById('poiSheetOverlay');
    dom.poiSheetContent = document.getElementById('poiSheetContent');
    dom.poiDetailImg = document.getElementById('poiDetailImg');
    dom.poiDetailName = document.getElementById('poiDetailName');
    dom.poiDetailRating = document.getElementById('poiDetailRating');
    dom.poiDetailAddress = document.getElementById('poiDetailAddress');
    dom.poiDetailDesc = document.getElementById('poiDetailDesc');
    dom.poiAddBtn = document.getElementById('poiAddBtn');
    dom.poiNavBtn = document.getElementById('poiNavBtn');

    // Toast
    dom.toast = document.getElementById('toast');
  }

  // ========================================
  // 工具函数
  // ========================================

  function indexById(items) {
    var index = {};
    for (var i = 0; i < items.length; i++) {
      index[items[i].id] = items[i];
    }
    return index;
  }

  function groupBy(items, key) {
    var groups = {};
    for (var i = 0; i < items.length; i++) {
      var groupKey = items[i][key];
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(items[i]);
    }
    return groups;
  }

  var DATA_INDEX = {
    cities: indexById(MOCK_CITIES),
    attractions: indexById(MOCK_ATTRACTIONS),
    restaurants: indexById(MOCK_RESTAURANTS),
    itineraries: indexById(MOCK_ITINERARIES),
    tipsByCity: groupBy(MOCK_TRAVEL_TIPS, 'cityId'),
    attractionsByCity: groupBy(MOCK_ATTRACTIONS, 'cityId'),
    restaurantsByCity: groupBy(MOCK_RESTAURANTS, 'cityId'),
    poisByCity: groupBy(MOCK_POIS, 'cityId')
  };

  function stableMapCoordinate(id, axis) {
    var hash = axis === 'y' ? 17 : 11;
    var text = String(id || axis);
    for (var i = 0; i < text.length; i++) {
      hash = (hash * 31 + text.charCodeAt(i)) % 997;
    }
    return 20 + (hash % 61);
  }

  function getCityById(id) {
    return DATA_INDEX.cities[id] || null;
  }

  function getAttractionById(id) {
    return DATA_INDEX.attractions[id] || null;
  }

  function getRestaurantById(id) {
    return DATA_INDEX.restaurants[id] || null;
  }

  function getItineraryById(id) {
    return DATA_INDEX.itineraries[id] || null;
  }

  function getTipsByCity(cityId) {
    var tips = DATA_INDEX.tipsByCity[cityId];
    return tips && tips[0] ? tips[0].tips : [];
  }

  function getAttractionsByCity(cityId) {
    return DATA_INDEX.attractionsByCity[cityId] || [];
  }

  function getRestaurantsByCity(cityId) {
    return DATA_INDEX.restaurantsByCity[cityId] || [];
  }

  function getPoisByCity(cityId) {
    return DATA_INDEX.poisByCity[cityId] || [];
  }

  function formatMoney(num) {
    return '¥' + num.toLocaleString();
  }

  function getRouteStops(cityId, limit) {
    var stops = getAttractionsByCity(cityId).slice(0, limit || 4);
    if (stops.length === 0) {
      stops = [
        { name: '城市中心', mapX: 24, mapY: 42 },
        { name: '热门地标', mapX: 50, mapY: 24 },
        { name: '夜游街区', mapX: 76, mapY: 38 }
      ];
    }
    return stops;
  }

  function getRouteSummary(cityId) {
    var stops = getRouteStops(cityId, 3);
    return stops.map(function(stop) { return stop.name; }).join(' → ');
  }

  function getRouteDistance(days, cityId) {
    var base = getRouteStops(cityId, 4).length * 3.6 + days * 5.4;
    return base.toFixed(1) + ' km';
  }

  function getBudgetLabel(budget) {
    if (budget === 'economy') return '经济';
    if (budget === 'luxury') return '高端';
    return '舒适';
  }

  function getPlanProgress(plan) {
    if (plan.status === 'completed') return 100;
    if (plan.status === 'favorite') return 88;
    var dayFactor = Math.min(32, plan.days * 8);
    var tagFactor = Math.min(18, plan.tags.length * 6);
    return Math.min(92, 46 + dayFactor + tagFactor);
  }

  function formatPlanDateRange(plan) {
    var start = formatDate(plan.startDate);
    return start + '出发 · ' + plan.days + '天';
  }

  function getRouteColor(index) {
    var colors = ['#2563EB', '#F97316', '#8B5CF6', '#22C55E', '#EC4899'];
    return colors[index % colors.length];
  }

  function renderRouteMiniMap(cityId, variant) {
    var stops = getRouteStops(cityId, 4);
    var points = stops.map(function(stop, index) {
      var fallbackX = 20 + index * 20;
      var fallbackY = index % 2 === 0 ? 38 : 20;
      return {
        x: Math.max(10, Math.min(90, stop.mapX || fallbackX)),
        y: Math.max(10, Math.min(50, stop.mapY || fallbackY))
      };
    });
    var path = '';
    for (var i = 0; i < points.length; i++) {
      if (i === 0) {
        path += 'M' + points[i].x + ' ' + points[i].y;
      } else {
        var prev = points[i - 1];
        var midX = (prev.x + points[i].x) / 2;
        var midY = (prev.y + points[i].y) / 2 - 8;
        path += ' Q' + midX + ' ' + midY + ' ' + points[i].x + ' ' + points[i].y;
      }
    }
    var pins = points.map(function(point, index) {
      var cls = index === 0 ? ' route-mini-map__pin--start' :
                index === points.length - 1 ? ' route-mini-map__pin--end' : '';
      return '<g class="route-mini-map__stop" transform="translate(' + point.x + ' ' + point.y + ')">' +
        '<circle class="route-mini-map__pin' + cls + '" r="4.4" style="--stop-color:' + getRouteColor(index) + '"/>' +
        '<text class="route-mini-map__number" y="2.8">' + (index + 1) + '</text>' +
      '</g>';
    }).join('');
    return (
      '<svg class="route-mini-map route-mini-map--' + variant + '" viewBox="0 0 100 60" aria-hidden="true">' +
        '<rect class="route-mini-map__area route-mini-map__area--park" x="6" y="7" width="22" height="15" rx="3"/>' +
        '<rect class="route-mini-map__area route-mini-map__area--city" x="36" y="8" width="22" height="14" rx="3"/>' +
        '<rect class="route-mini-map__area route-mini-map__area--food" x="70" y="12" width="20" height="16" rx="3"/>' +
        '<rect class="route-mini-map__area route-mini-map__area--hotel" x="12" y="39" width="24" height="14" rx="3"/>' +
        '<rect class="route-mini-map__area route-mini-map__area--city" x="55" y="40" width="33" height="13" rx="3"/>' +
        '<path class="route-mini-map__road" d="M8 14 H92 M12 46 H88 M28 6 V54 M62 5 V55 M86 10 V50"/>' +
        '<path class="route-mini-map__road route-mini-map__road--soft" d="M4 32 C26 22 39 40 54 30 S74 18 96 28"/>' +
        '<path class="route-mini-map__line route-mini-map__line--shadow" d="' + path + '"/>' +
        '<path class="route-mini-map__line" d="' + path + '"/>' +
        pins +
      '</svg>'
    );
  }

  function renderPlanCityCover(plan, progress) {
    var city = getCityById(plan.cityId);
    var coverImage = plan.coverImage || (city && city.imageUrl) || '';
    var cityName = plan.cityName || (city && city.name) || '目的地';
    var budgetText = getBudgetLabel(plan.budget) + '预算';

    return (
      '<div class="plan-card__cover-thumb">' +
        '<img class="plan-card__cover-img" src="' + escapeMapHtml(coverImage) + '" alt="' + escapeMapHtml(cityName) + '">' +
        '<div class="plan-card__cover-shade"></div>' +
        '<div class="plan-card__cover-top">' +
          '<span class="plan-card__cover-city">' + escapeMapHtml(cityName) + '</span>' +
          '<strong class="plan-card__cover-progress">' + progress + '%</strong>' +
        '</div>' +
        '<div class="plan-card__cover-bottom">' +
          '<span class="plan-card__cover-day">Day ' + plan.days + '</span>' +
          '<span class="plan-card__cover-budget">' + escapeMapHtml(budgetText) + '</span>' +
        '</div>' +
      '</div>'
    );
  }

  function showToast(message, duration) {
    duration = duration || 2000;
    dom.toast.textContent = message;
    dom.toast.classList.add('toast--show');
    setTimeout(function() {
      dom.toast.classList.remove('toast--show');
    }, duration);
  }

  function formatDate(dateStr) {
    if (!dateStr) return '';
    var date = new Date(dateStr);
    return (date.getMonth() + 1) + '月' + date.getDate() + '日';
  }

  // ========================================
  // 底部 Tab 切换
  // ========================================

  function switchTab(tabName) {
    state.currentTab = tabName;

    for (var i = 0; i < dom.tabBarItems.length; i++) {
      var tab = dom.tabBarItems[i];
      if (tab.dataset.tab === tabName) {
        tab.classList.add('tab-bar-item--active');
      } else {
        tab.classList.remove('tab-bar-item--active');
      }
    }

    for (var j = 0; j < dom.tabViews.length; j++) {
      var view = dom.tabViews[j];
      if (view.id === 'tab-' + tabName) {
        view.classList.add('tab-view--active');
      } else {
        view.classList.remove('tab-view--active');
      }
    }

    if (tabName === 'home') {
      renderFolderBar();
      renderPlanList();
    } else if (tabName === 'discover') {
      renderDiscoverList(state.discover.currentCategory);
    }
  }

  // ========================================
  // Tab 1: 旅游计划 - 规划列表
  // ========================================

  function getFilteredPlans() {
    var folderId = state.planList.currentFolder;
    var filtered = MOCK_MY_PLANS.filter(function(p) { return !p.deleted; });

    if (folderId === 'all') {
      // 全部
    } else if (folderId === 'uncategorized') {
      filtered = filtered.filter(function(p) { return !p.folderId; });
    } else {
      filtered = filtered.filter(function(p) { return p.folderId === folderId; });
    }

    var sortBy = state.planList.sortBy;
    if (sortBy === 'custom') {
      filtered.sort(function(a, b) { return a.order - b.order; });
    } else if (sortBy === 'edit_time') {
      filtered.sort(function(a, b) {
        return new Date(b.updatedAt) - new Date(a.updatedAt);
      });
    } else if (sortBy === 'travel_time') {
      filtered.sort(function(a, b) {
        return new Date(a.startDate) - new Date(b.startDate);
      });
    }

    return filtered;
  }

  function getFolderById(id) {
    for (var i = 0; i < MOCK_FOLDERS.length; i++) {
      if (MOCK_FOLDERS[i].id === id) return MOCK_FOLDERS[i];
    }
    return null;
  }

  function getFolderCount(folderId) {
    var activePlans = MOCK_MY_PLANS.filter(function(p) { return !p.deleted; });
    if (folderId === 'all') return activePlans.length;
    if (folderId === 'uncategorized') {
      return activePlans.filter(function(p) { return !p.folderId; }).length;
    }
    return activePlans.filter(function(p) { return p.folderId === folderId; }).length;
  }

  function renderFolderBar() {
    if (!dom.folderScroll) return;
    dom.folderScroll.innerHTML = '';

    var items = [
      { id: 'all', name: '全部', icon: 'all', color: '#6B7280' },
      { id: 'uncategorized', name: '未分类', icon: 'folder', color: '#9CA3AF' }
    ];
    for (var i = 0; i < MOCK_FOLDERS.length; i++) {
      items.push(MOCK_FOLDERS[i]);
    }
    items.push({ id: 'new', name: '新建', icon: '+', color: '#6B7280', isNew: true });

    for (var j = 0; j < items.length; j++) {
      var item = items[j];
      var btn = document.createElement('button');
      btn.className = 'folder-chip';
      if (state.planList.currentFolder === item.id) {
        btn.classList.add('folder-chip--active');
      }
      if (item.isNew) {
        btn.classList.add('folder-chip--new');
      }
      btn.dataset.folderId = item.id;

      var count = item.isNew ? '' : ' (' + getFolderCount(item.id) + ')';

      btn.innerHTML =
        '<span class="folder-chip__icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg></span>' +
        '<span class="folder-chip__name">' + item.name + count + '</span>';

      if (item.isNew) {
        btn.addEventListener('click', openNewFolderModal);
      } else {
        (function(folderId) {
          btn.addEventListener('click', function() {
            state.planList.currentFolder = folderId;
            renderFolderBar();
            renderPlanList();
          });
        })(item.id);
      }

      dom.folderScroll.appendChild(btn);
    }
  }

  function renderPlanList() {
    var plans = getFilteredPlans();
    dom.planCount.textContent = plans.length + ' 个';
    dom.planList.innerHTML = '';

    for (var i = 0; i < plans.length; i++) {
      var plan = plans[i];
      var cardWrapper = createPlanCardWrapper(plan);
      dom.planList.appendChild(cardWrapper);
    }
  }

  function createPlanCardWrapper(plan) {
    var wrapper = document.createElement('div');
    wrapper.className = 'plan-card-wrapper';
    wrapper.dataset.planId = plan.id;

    var actions = document.createElement('div');
    actions.className = 'plan-card-actions';
    actions.innerHTML =
      '<button class="plan-action plan-action--share" data-action="share">' +
        '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>' +
        '<span>分享</span>' +
      '</button>' +
      '<button class="plan-action plan-action--favorite' + (plan.favorite ? ' is-favorite' : '') + '" data-action="favorite">' +
        '<svg width="24" height="24" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>' +
        '<span>收藏</span>' +
      '</button>' +
      '<button class="plan-action plan-action--delete" data-action="delete">' +
        '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>' +
        '<span>删除</span>' +
      '</button>';

    var card = createPlanCard(plan);
    var swipeTrack = document.createElement('div');
    swipeTrack.className = 'plan-card-swipe-track';
    swipeTrack.appendChild(card);
    swipeTrack.appendChild(actions);
    wrapper.appendChild(swipeTrack);

    initSwipe(wrapper, plan);
    initActionButtons(wrapper, plan);
    initLongPressDrag(wrapper, plan);

    return wrapper;
  }

  function createPlanCard(plan) {
    var card = document.createElement('div');
    card.className = 'plan-card';
    card.dataset.planId = plan.id;

    var statusClass = 'plan-card__status--' + plan.status;
    var statusText = plan.status === 'planning' ? '规划中' : plan.status === 'completed' ? '已完成' : '已收藏';
    var progress = getPlanProgress(plan);

    var favoriteBadge = plan.favorite
      ? '<span class="plan-card__fav-badge"><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg></span>'
      : '';

    card.innerHTML =
      renderPlanCityCover(plan, progress) +
      favoriteBadge +
      '<div class="plan-card__info">' +
        '<div class="plan-card__topline">' +
          '<span class="plan-card__status ' + statusClass + '">' + statusText + '</span>' +
          '<span class="plan-card__date">' + formatPlanDateRange(plan) + '</span>' +
        '</div>' +
        '<div class="plan-card__title">' + plan.title + '</div>' +
        '<div class="plan-card__route">' +
          '<span class="plan-card__route-dot"></span>' +
          '<span>' + getRouteSummary(plan.cityId) + '</span>' +
        '</div>' +
        '<div class="plan-card__metrics">' +
          '<span><strong>' + getRouteDistance(plan.days, plan.cityId) + '</strong><em>路线</em></span>' +
          '<span><strong>' + getRouteStops(plan.cityId, 4).length + '</strong><em>核心点</em></span>' +
          '<span><strong>' + formatMoney(plan.budgetAmount) + '</strong><em>' + getBudgetLabel(plan.budget) + '预算</em></span>' +
        '</div>' +
        '<div class="plan-card__tags">' +
          plan.tags.map(function(t) { return '<span class="plan-card__tag">#' + t + '</span>'; }).join('') +
        '</div>' +
      '</div>';

    card.addEventListener('click', function(e) {
      var wrapper = card.closest('.plan-card-wrapper');
      if (wrapper && wrapper.dataset.swipeClickGuard === '1') {
        e.preventDefault();
        e.stopPropagation();
        return;
      }

      if (wrapper && wrapper.scrollLeft > 4) {
        closeSwipe();
      } else {
        openPlanDetail(plan);
      }
    });

    return card;
  }

  // ========================================
  // 左滑操作
  // ========================================

  function initSwipe(wrapper, plan) {
    var actions = wrapper.querySelector('.plan-card-actions');
    var swipeClickTimer = null;
    if (!actions) return;

    function guardCardClick() {
      wrapper.dataset.swipeClickGuard = '1';
      if (swipeClickTimer) clearTimeout(swipeClickTimer);
      swipeClickTimer = setTimeout(function() {
        delete wrapper.dataset.swipeClickGuard;
        swipeClickTimer = null;
      }, 450);
    }

    wrapper.addEventListener('scroll', function() {
      if (wrapper.scrollLeft > 4) {
        guardCardClick();
        if (state.planList.openSwipeId && state.planList.openSwipeId !== plan.id) {
          closeSwipe();
        }
        state.planList.openSwipeId = plan.id;
        wrapper.classList.add('plan-card-wrapper--open');
      } else if (state.planList.openSwipeId === plan.id) {
        state.planList.openSwipeId = null;
        wrapper.classList.remove('plan-card-wrapper--open');
      }
    }, { passive: true });
  }

  function openSwipe(planId) {
    if (state.planList.openSwipeId && state.planList.openSwipeId !== planId) {
      closeSwipe();
    }
    state.planList.openSwipeId = planId;
    var wrapper = dom.planList.querySelector('.plan-card-wrapper[data-plan-id="' + planId + '"]');
    if (wrapper) {
      var actions = wrapper.querySelector('.plan-card-actions');
      wrapper.scrollTo({ left: actions.getBoundingClientRect().width || 168, behavior: 'smooth' });
      wrapper.classList.add('plan-card-wrapper--open');
    }
  }

  function closeSwipe() {
    if (!state.planList.openSwipeId) return;
    var planId = state.planList.openSwipeId;
    state.planList.openSwipeId = null;
    var wrapper = dom.planList.querySelector('.plan-card-wrapper[data-plan-id="' + planId + '"]');
    if (wrapper) {
      wrapper.scrollTo({ left: 0, behavior: 'smooth' });
      wrapper.classList.remove('plan-card-wrapper--open');
    }
  }

  function initActionButtons(wrapper, plan) {
    var actions = wrapper.querySelectorAll('.plan-action');
    for (var i = 0; i < actions.length; i++) {
      (function(btn, action) {
        btn.addEventListener('click', function(e) {
          e.stopPropagation();
          handlePlanAction(action, plan);
        });
      })(actions[i], actions[i].dataset.action);
    }
  }

  function handlePlanAction(action, plan) {
    if (action === 'delete') {
      showConfirm('确定要删除「' + plan.title + '」吗？', function() {
        moveToRecycleBin(plan.id);
      });
    } else if (action === 'favorite') {
      toggleFavorite(plan.id);
    } else if (action === 'share') {
      openShareModal();
    }
  }

  function moveToRecycleBin(planId) {
    for (var i = 0; i < MOCK_MY_PLANS.length; i++) {
      if (MOCK_MY_PLANS[i].id === planId) {
        MOCK_MY_PLANS[i].deleted = true;
        MOCK_MY_PLANS[i].deletedAt = new Date().toISOString();
        break;
      }
    }
    reorderPlans();
    closeSwipe();
    renderFolderBar();
    renderPlanList();
    showToast('已移到回收站');
  }

  function restorePlan(planId) {
    var plan = null;
    for (var i = 0; i < MOCK_MY_PLANS.length; i++) {
      if (MOCK_MY_PLANS[i].id === planId) {
        plan = MOCK_MY_PLANS[i];
        plan.deleted = false;
        plan.deletedAt = null;
        break;
      }
    }
    if (plan) {
      var activePlans = MOCK_MY_PLANS.filter(function(p) { return !p.deleted; });
      var maxOrder = 0;
      for (var j = 0; j < activePlans.length; j++) {
        if (activePlans[j].order > maxOrder) {
          maxOrder = activePlans[j].order;
        }
      }
      plan.order = maxOrder + 1;
    }
    renderRecycleBin();
    renderFolderBar();
    renderPlanList();
    showToast('已恢复');
  }

  function permanentlyDeletePlan(planId) {
    for (var i = 0; i < MOCK_MY_PLANS.length; i++) {
      if (MOCK_MY_PLANS[i].id === planId) {
        MOCK_MY_PLANS.splice(i, 1);
        break;
      }
    }
    renderRecycleBin();
    showToast('已彻底删除');
  }

  function toggleFavorite(planId) {
    var plan = null;
    for (var i = 0; i < MOCK_MY_PLANS.length; i++) {
      if (MOCK_MY_PLANS[i].id === planId) {
        plan = MOCK_MY_PLANS[i];
        plan.favorite = !plan.favorite;
        if (plan.favorite) {
          plan.status = 'favorite';
        } else {
          if (plan.status === 'favorite') plan.status = 'planning';
        }
        break;
      }
    }
    closeSwipe();
    renderPlanList();
    showToast(plan && plan.favorite ? '已收藏' : '已取消收藏');
  }

  function reorderPlans() {
    var plans = getFilteredPlans();
    for (var i = 0; i < plans.length; i++) {
      plans[i].order = i;
    }
  }

  // ========================================
  // 长按拖拽排序
  // ========================================

  var longPressState = {
    timer: null,
    isLongPress: false,
    isDragging: false,
    dragCard: null,
    dragClone: null,
    dragPlanId: null,
    startX: 0,
    startY: 0,
    offsetX: 0,
    offsetY: 0,
    currentIndex: -1
  };

  function initLongPressDrag(wrapper, plan) {
    var card = wrapper.querySelector('.plan-card');
    if (!card) return;

    function onStart(e) {
      if (state.planList.sortBy !== 'custom') return;
      if (state.planList.openSwipeId) return;

      var point = e.touches ? e.touches[0] : e;
      longPressState.startX = point.clientX;
      longPressState.startY = point.clientY;
      longPressState.isLongPress = false;
      longPressState.isDragging = false;
      longPressState.dragCard = card;
      longPressState.dragPlanId = plan.id;

      var rect = card.getBoundingClientRect();
      longPressState.offsetX = point.clientX - rect.left;
      longPressState.offsetY = point.clientY - rect.top;

      longPressState.timer = setTimeout(function() {
        triggerLongPress(wrapper, card, plan, point);
      }, 500);
    }

    function onMove(e) {
      var point = e.touches ? e.touches[0] : e;
      var deltaX = Math.abs(point.clientX - longPressState.startX);
      var deltaY = Math.abs(point.clientY - longPressState.startY);

      if (!longPressState.isLongPress && !longPressState.isDragging) {
        if (deltaX > 10 || deltaY > 10) {
          clearLongPressTimer();
        }
        return;
      }

      if (longPressState.isDragging && longPressState.dragClone) {
        if (e.cancelable) {
          e.preventDefault && e.preventDefault();
        }
        
        var left = point.clientX - longPressState.offsetX;
        var top = point.clientY - longPressState.offsetY;
        longPressState.dragClone.style.left = left + 'px';
        longPressState.dragClone.style.top = top + 'px';

        updateDragTarget(point.clientY, plan.id);
      }
    }

    function onEnd() {
      clearLongPressTimer();

      if (longPressState.isDragging) {
        endDrag();
      } else if (longPressState.isLongPress) {
        longPressState.isLongPress = false;
        if (longPressState.dragCard) {
          longPressState.dragCard.classList.remove('plan-card--long-press');
        }
      }
    }

    card.addEventListener('touchstart', onStart, { passive: true });
    card.addEventListener('touchmove', onMove, { passive: false });
    card.addEventListener('touchend', onEnd);
    card.addEventListener('touchcancel', onEnd);
    card.addEventListener('mousedown', function(e) {
      if (e.button === 2) return;
      onStart(e);
    });
    card.addEventListener('contextmenu', function(e) {
      if (longPressState.isDragging || longPressState.isLongPress) {
        e.preventDefault();
        return false;
      }
    });
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onEnd);
  }

  function clearLongPressTimer() {
    if (longPressState.timer) {
      clearTimeout(longPressState.timer);
      longPressState.timer = null;
    }
  }

  function triggerLongPress(wrapper, card, plan, point) {
    longPressState.isLongPress = true;
    card.classList.add('plan-card--long-press');

    if (navigator.vibrate) {
      navigator.vibrate(50);
    }

    startDrag(wrapper, card, plan, point);
  }

  function startDrag(wrapper, card, plan, point) {
    longPressState.isDragging = true;
    card.classList.remove('plan-card--long-press');

    var clone = card.cloneNode(true);
    clone.classList.add('plan-card--dragging');
    clone.style.width = card.offsetWidth + 'px';
    clone.style.position = 'fixed';
    clone.style.left = (point.clientX - longPressState.offsetX) + 'px';
    clone.style.top = (point.clientY - longPressState.offsetY) + 'px';
    document.body.appendChild(clone);

    longPressState.dragClone = clone;
    wrapper.classList.add('plan-card-wrapper--dragging');

    var plans = getFilteredPlans();
    for (var i = 0; i < plans.length; i++) {
      if (plans[i].id === plan.id) {
        longPressState.currentIndex = i;
        break;
      }
    }
  }

  function updateDragTarget(mouseY, currentPlanId) {
    var wrappers = dom.planList.querySelectorAll('.plan-card-wrapper');
    var targetIndex = -1;

    for (var i = 0; i < wrappers.length; i++) {
      var rect = wrappers[i].getBoundingClientRect();
      var midY = rect.top + rect.height / 2;
      
      if (mouseY < midY) {
        targetIndex = i;
        break;
      }
    }

    if (targetIndex === -1) {
      targetIndex = wrappers.length;
    }

    if (targetIndex !== longPressState.currentIndex) {
      for (var j = 0; j < wrappers.length; j++) {
        wrappers[j].classList.remove('plan-card-wrapper--drag-over');
      }
      
      if (targetIndex < wrappers.length) {
        wrappers[targetIndex].classList.add('plan-card-wrapper--drag-over');
      }
      
      longPressState.currentIndex = targetIndex;
    }
  }

  function endDrag() {
    if (longPressState.dragClone) {
      longPressState.dragClone.remove();
      longPressState.dragClone = null;
    }

    var wrappers = dom.planList.querySelectorAll('.plan-card-wrapper');
    for (var i = 0; i < wrappers.length; i++) {
      wrappers[i].classList.remove('plan-card-wrapper--dragging');
      wrappers[i].classList.remove('plan-card-wrapper--drag-over');
    }

    var plans = getFilteredPlans();
    var draggedIdx = -1;
    for (var j = 0; j < plans.length; j++) {
      if (plans[j].id === longPressState.dragPlanId) {
        draggedIdx = j;
        break;
      }
    }

    if (draggedIdx !== -1 && longPressState.currentIndex !== -1 && draggedIdx !== longPressState.currentIndex) {
      var targetIdx = longPressState.currentIndex;
      if (draggedIdx < targetIdx) targetIdx--;
      reorderPlan(longPressState.dragPlanId, plans[targetIdx].id);
    }

    longPressState.isDragging = false;
    longPressState.isLongPress = false;
    longPressState.dragCard = null;
    longPressState.dragPlanId = null;
    longPressState.currentIndex = -1;
  }

  function reorderPlan(draggedId, targetId) {
    var plans = getFilteredPlans();
    var draggedIdx = -1;
    var targetIdx = -1;

    for (var i = 0; i < plans.length; i++) {
      if (plans[i].id === draggedId) draggedIdx = i;
      if (plans[i].id === targetId) targetIdx = i;
    }

    if (draggedIdx === -1 || targetIdx === -1) return;

    var draggedPlan = plans[draggedIdx];
    plans.splice(draggedIdx, 1);
    plans.splice(targetIdx, 0, draggedPlan);

    for (var j = 0; j < plans.length; j++) {
      plans[j].order = j;
    }

    renderPlanList();
  }

  function openSortModal() {
    if (!dom.sortModal) return;
    updateSortOptionsUI();
    dom.sortModal.classList.add('modal--show');
  }

  function closeSortModal() {
    if (!dom.sortModal) return;
    dom.sortModal.classList.remove('modal--show');
  }

  function updateSortOptionsUI() {
    if (!dom.sortOptions) return;
    var options = dom.sortOptions.querySelectorAll('.sort-option');
    for (var i = 0; i < options.length; i++) {
      var opt = options[i];
      if (opt.dataset.sort === state.planList.sortBy) {
        opt.classList.add('sort-option--active');
      } else {
        opt.classList.remove('sort-option--active');
      }
    }
  }

  function changeSortBy(sortBy) {
    state.planList.sortBy = sortBy;
    renderPlanList();
    closeSortModal();
    var sortNames = {
      'custom': '自定义排序',
      'edit_time': '编辑时间',
      'travel_time': '旅游时间'
    };
    showToast('已按' + sortNames[sortBy] + '排序');
  }

  // ========================================
  // 文件夹管理
  // ========================================

  function openNewFolderModal() {
    state.newFolder.name = '';
    state.newFolder.icon = 'folder';
    state.newFolder.color = '#3B82F6';
    dom.folderNameInput.value = '';

    var iconOptions = [
      { key: 'folder', svg: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg>' },
      { key: 'star', svg: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>' },
      { key: 'heart', svg: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>' },
      { key: 'bookmark', svg: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/></svg>' },
      { key: 'flag', svg: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>' },
      { key: 'briefcase', svg: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/></svg>' },
      { key: 'camera', svg: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>' },
      { key: 'compass', svg: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>' }
    ];
    dom.folderIconOptions.innerHTML = '';
    for (var i = 0; i < iconOptions.length; i++) {
      var iconBtn = document.createElement('button');
      iconBtn.className = 'folder-icon-option';
      if (iconOptions[i].key === state.newFolder.icon) iconBtn.classList.add('folder-icon-option--active');
      iconBtn.innerHTML = iconOptions[i].svg;
      (function(iconKey) {
        iconBtn.addEventListener('click', function() {
          state.newFolder.icon = iconKey;
          var all = dom.folderIconOptions.querySelectorAll('.folder-icon-option');
          for (var j = 0; j < all.length; j++) all[j].classList.remove('folder-icon-option--active');
          iconBtn.classList.add('folder-icon-option--active');
        });
      })(iconOptions[i].key);
      dom.folderIconOptions.appendChild(iconBtn);
    }

    var colors = ['#3B82F6', '#F97316', '#EC4899', '#8B5CF6', '#22C55E', '#EF4444'];
    dom.folderColorOptions.innerHTML = '';
    for (var c = 0; c < colors.length; c++) {
      var colorBtn = document.createElement('button');
      colorBtn.className = 'folder-color-option';
      if (colors[c] === state.newFolder.color) colorBtn.classList.add('folder-color-option--active');
      colorBtn.style.background = colors[c];
      (function(color) {
        colorBtn.addEventListener('click', function() {
          state.newFolder.color = color;
          var all = dom.folderColorOptions.querySelectorAll('.folder-color-option');
          for (var k = 0; k < all.length; k++) all[k].classList.remove('folder-color-option--active');
          colorBtn.classList.add('folder-color-option--active');
        });
      })(colors[c]);
      dom.folderColorOptions.appendChild(colorBtn);
    }

    dom.folderModal.classList.add('modal--show');
  }

  function closeNewFolderModal() {
    dom.folderModal.classList.remove('modal--show');
  }

  function createFolder() {
    var name = dom.folderNameInput.value.trim();
    if (!name) {
      showToast('请输入文件夹名称');
      return;
    }

    var newFolder = {
      id: 'folder-' + Date.now(),
      name: name,
      icon: state.newFolder.icon,
      color: state.newFolder.color
    };
    MOCK_FOLDERS.push(newFolder);

    closeNewFolderModal();
    state.planList.currentFolder = newFolder.id;
    renderFolderBar();
    renderPlanList();
    showToast('文件夹创建成功');
  }

  function openMoveFolderModal() {
    if (state.planList.selectedPlans.length === 0) {
      showToast('请先选择行程');
      return;
    }

    dom.moveFolderList.innerHTML = '';

    var allItem = document.createElement('button');
    allItem.className = 'move-folder-item';
    allItem.innerHTML = '<span class="move-folder-item__icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"/></svg></span><span class="move-folder-item__name">未分类</span>';
    allItem.addEventListener('click', function() {
      movePlansToFolder(null);
    });
    dom.moveFolderList.appendChild(allItem);

    for (var i = 0; i < MOCK_FOLDERS.length; i++) {
      var folder = MOCK_FOLDERS[i];
      var item = document.createElement('button');
      item.className = 'move-folder-item';
      item.innerHTML =
        '<span class="move-folder-item__icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg></span>' +
        '<span class="move-folder-item__name">' + folder.name + '</span>';
      (function(folderId) {
        item.addEventListener('click', function() {
          movePlansToFolder(folderId);
        });
      })(folder.id);
      dom.moveFolderList.appendChild(item);
    }

    dom.moveFolderModal.classList.add('modal--show');
  }

  function closeMoveFolderModal() {
    dom.moveFolderModal.classList.remove('modal--show');
  }

  function movePlansToFolder(folderId) {
    for (var i = 0; i < state.planList.selectedPlans.length; i++) {
      var planId = state.planList.selectedPlans[i];
      for (var j = 0; j < MOCK_MY_PLANS.length; j++) {
        if (MOCK_MY_PLANS[j].id === planId) {
          MOCK_MY_PLANS[j].folderId = folderId;
          break;
        }
      }
    }

    closeMoveFolderModal();
    state.planList.selectedPlans = [];
    state.planList.isEditMode = false;
    renderFolderBar();
    renderPlanList();
    showToast('已移动到文件夹');
  }

  // ========================================
  // 分享弹窗
  // ========================================

  function openShareModal() {
    closeSwipe();
    dom.shareModal.classList.add('modal--show');
  }

  function closeShareModal() {
    dom.shareModal.classList.remove('modal--show');
  }

  // ========================================
  // 确认弹窗
  // ========================================

  var confirmCallback = null;

  function showConfirm(text, callback) {
    dom.confirmText.textContent = text;
    confirmCallback = callback;
    dom.confirmModal.classList.add('modal--show');
  }

  function closeConfirm() {
    dom.confirmModal.classList.remove('modal--show');
    confirmCallback = null;
  }

  function setSlidePageState(isOpen) {
    document.body.classList.toggle('is-slide-page-open', !!isOpen);
    var app = document.getElementById('app');
    if (app) {
      app.classList.toggle('app--slide-page-open', !!isOpen);
    }
  }

  function openSlidePage(pageEl, pageName) {
    if (!pageEl) return;
    pageEl.classList.add('page-slide--open');
    state.currentPage = pageName;
    setSlidePageState(true);
  }

  function closeSlidePage(pageEl) {
    if (!pageEl) return;
    pageEl.classList.remove('page-slide--open');
    state.currentPage = null;
    setSlidePageState(false);
  }

  function handleConfirmOk() {
    if (confirmCallback) confirmCallback();
    closeConfirm();
  }

  // ========================================
  // 新建规划
  // ========================================

  function openNewPlan() {
    openSlidePage(dom.pageNewPlan, 'new-plan');
    initNewPlanForm();
  }

  function closeNewPlan() {
    closeSlidePage(dom.pageNewPlan);
  }

  function openCityPicker() {
    state.cityPicker = {
      tab: state.form.cityTab || 'domestic',
      category: 'hot',
      keyword: ''
    };
    dom.cityPickerSearch.value = '';
    renderCityPickerTabs();
    renderCityPickerCategories();
    renderCityPickerList('');
    dom.pageCityPicker.classList.add('page-slide--open');
  }

  function closeCityPicker() {
    dom.pageCityPicker.classList.remove('page-slide--open');
  }

  function renderCityPickerTabs() {
    var tabs = dom.cityPickerTabs.querySelectorAll('.city-picker__tab');
    for (var i = 0; i < tabs.length; i++) {
      if (tabs[i].dataset.cityTab === state.cityPicker.tab) {
        tabs[i].classList.add('city-picker__tab--active');
      } else {
        tabs[i].classList.remove('city-picker__tab--active');
      }
    }
  }

  function renderCityPickerCategories() {
    var tabs = dom.cityPickerCategories.querySelectorAll('.city-category-tab');
    for (var i = 0; i < tabs.length; i++) {
      if (tabs[i].dataset.category === state.cityPicker.category) {
        tabs[i].classList.add('city-category-tab--active');
      } else {
        tabs[i].classList.remove('city-category-tab--active');
      }
    }
  }

  function switchCityPickerTab(tab) {
    state.cityPicker.tab = tab;
    state.form.cityTab = tab;
    renderCityPickerTabs();
    renderCityPickerList(dom.cityPickerSearch.value);
  }

  function switchCityPickerCategory(category) {
    state.cityPicker.category = category;
    renderCityPickerCategories();
    renderCityPickerList(dom.cityPickerSearch.value);
  }

  function renderCityPickerList(keyword) {
    dom.cityPickerList.innerHTML = '';
    var keywordLower = keyword ? keyword.toLowerCase() : '';
    var tab = state.cityPicker.tab || 'domestic';
    var category = state.cityPicker.category || 'hot';
    var hasResults = false;

    var categoryTabsEl = dom.cityPickerCategories;
    if (categoryTabsEl) {
      categoryTabsEl.style.display = keyword ? 'none' : 'flex';
    }

    for (var i = 0; i < MOCK_CITIES.length; i++) {
      var city = MOCK_CITIES[i];

      if (tab === 'domestic' && city.isOverseas) continue;
      if (tab === 'overseas' && !city.isOverseas) continue;

      if (!keyword) {
        if (category === 'hot' && !city.isHot) continue;
        if (category === 'history' && (!city.tags || city.tags.indexOf('history') === -1)) continue;
        if (category === 'nature' && (!city.tags || city.tags.indexOf('nature') === -1)) continue;
        if (category === 'food' && (!city.tags || city.tags.indexOf('food') === -1)) continue;
      }

      if (keyword &&
          city.name.toLowerCase().indexOf(keywordLower) === -1 &&
          city.nameEn.toLowerCase().indexOf(keywordLower) === -1 &&
          (city.country && city.country.toLowerCase().indexOf(keywordLower) === -1) &&
          (city.province && city.province.toLowerCase().indexOf(keywordLower) === -1)) {
        continue;
      }

      hasResults = true;

      var card = document.createElement('div');
      card.className = 'city-card';
      if (city.id === state.form.destinationCity) {
        card.classList.add('city-card--active');
      }
      card.dataset.cityId = city.id;

      var badge = '';
      if (city.isOverseas) {
        badge = '<span class="city-card__badge">' + city.country + '</span>';
      } else if (city.isHot) {
        badge = '<span class="city-card__badge city-card__badge--hot">🔥 热门</span>';
      }

      card.innerHTML =
        '<img class="city-card__img" src="' + city.imageUrl + '" alt="' + city.name + '">' +
        badge +
        '<div class="city-card__info">' +
          '<div class="city-card__name">' + city.name + '</div>' +
          '<div class="city-card__desc">' + (city.bestSeason || city.nameEn) + '</div>' +
        '</div>';

      (function(cityId, cityName) {
        card.addEventListener('click', function() {
          state.form.destinationCity = cityId;
          state.form.destinationCityName = cityName;
          updateDestinationDisplay();
          closeCityPicker();
        });
      })(city.id, city.name);

      dom.cityPickerList.appendChild(card);
    }

    if (dom.cityPickerEmpty) {
      dom.cityPickerEmpty.style.display = hasResults ? 'none' : 'flex';
    }
  }

  function updateDestinationDisplay() {
    if (!dom.destinationPicker || !dom.selectedDestinationDisplay) return;

    if (state.form.destinationCity && state.form.destinationCityName) {
      dom.destinationPicker.classList.add('destination-picker--selected');
      var textEl = dom.selectedDestinationDisplay.querySelector('.destination-picker__text');
      if (textEl) {
        textEl.textContent = state.form.destinationCityName;
      }
    } else {
      dom.destinationPicker.classList.remove('destination-picker--selected');
      var textEl = dom.selectedDestinationDisplay.querySelector('.destination-picker__text');
      if (textEl) {
        textEl.textContent = '请选择目的地';
      }
    }
  }

  function initNewPlanForm() {
    var tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    dom.npDepartureDate.value = tomorrow.toISOString().split('T')[0];
    state.form.departureDate = dom.npDepartureDate.value;

    updateDestinationDisplay();
    updateNpDayBtns();
    updateNpCounters();
    updateNpBudgetCards();
    updateNpStyleCards();
  }

  function renderNpCityCards(keyword) {
    dom.npCityCards.innerHTML = '';
    var keywordLower = keyword ? keyword.toLowerCase() : '';
    var tab = state.form.cityTab || 'domestic';
    var category = state.form.cityCategory || 'hot';
    var hasResults = false;
    var emptyEl = document.getElementById('npCityEmpty');
    var categoryTabsEl = document.getElementById('cityCategoryTabs');

    if (categoryTabsEl) {
      categoryTabsEl.style.display = keyword ? 'none' : 'flex';
    }

    for (var i = 0; i < MOCK_CITIES.length; i++) {
      var city = MOCK_CITIES[i];

      if (tab === 'domestic' && city.isOverseas) continue;
      if (tab === 'overseas' && !city.isOverseas) continue;

      if (!keyword) {
        if (category === 'hot' && !city.isHot) continue;
        if (category === 'history' && (!city.tags || city.tags.indexOf('history') === -1)) continue;
        if (category === 'nature' && (!city.tags || city.tags.indexOf('nature') === -1)) continue;
        if (category === 'food' && (!city.tags || city.tags.indexOf('food') === -1)) continue;
      }

      if (keyword &&
          city.name.toLowerCase().indexOf(keywordLower) === -1 &&
          city.nameEn.toLowerCase().indexOf(keywordLower) === -1 &&
          (city.country && city.country.toLowerCase().indexOf(keywordLower) === -1) &&
          (city.province && city.province.toLowerCase().indexOf(keywordLower) === -1)) {
        continue;
      }

      hasResults = true;

      var card = document.createElement('div');
      card.className = 'city-card';
      if (city.id === state.form.destinationCity) {
        card.classList.add('city-card--active');
      }
      card.dataset.cityId = city.id;

      var badge = '';
      if (city.isOverseas) {
        badge = '<span class="city-card__badge">' + city.country + '</span>';
      } else if (city.isHot) {
        badge = '<span class="city-card__badge city-card__badge--hot">🔥 热门</span>';
      }

      card.innerHTML =
        '<img class="city-card__img" src="' + city.imageUrl + '" alt="' + city.name + '">' +
        badge +
        '<div class="city-card__info">' +
          '<div class="city-card__name">' + city.name + '</div>' +
          '<div class="city-card__desc">' + (city.bestSeason || city.nameEn) + '</div>' +
        '</div>';

      (function(cityId) {
        card.addEventListener('click', function() {
          state.form.destinationCity = cityId;
          var allCards = dom.npCityCards.querySelectorAll('.city-card');
          for (var c = 0; c < allCards.length; c++) {
            allCards[c].classList.remove('city-card--active');
          }
          card.classList.add('city-card--active');
        });
      })(city.id);

      dom.npCityCards.appendChild(card);
    }

    if (emptyEl) {
      emptyEl.style.display = hasResults ? 'none' : 'flex';
    }
  }

  function switchCityCategory(category) {
    state.form.cityCategory = category;
    var tabs = document.querySelectorAll('.city-category-tab');
    for (var i = 0; i < tabs.length; i++) {
      tabs[i].classList.remove('city-category-tab--active');
      if (tabs[i].dataset.category === category) {
        tabs[i].classList.add('city-category-tab--active');
      }
    }
    renderNpCityCards(dom.npCitySearch ? dom.npCitySearch.value : '');
  }

  function switchCityTab(tab) {
    state.form.cityTab = tab;
    var tabs = document.querySelectorAll('.city-tab');
    for (var i = 0; i < tabs.length; i++) {
      tabs[i].classList.remove('city-tab--active');
      if (tabs[i].dataset.cityTab === tab) {
        tabs[i].classList.add('city-tab--active');
      }
    }
    renderNpCityCards(dom.npCitySearch ? dom.npCitySearch.value : '');
  }

  function updateNpDayBtns() {
    var btns = dom.npDaySelector.querySelectorAll('.day-btn:not(.day-btn--custom)');
    var customBtn = document.getElementById('npCustomDayBtn');
    var hasCustom = state.form.isCustomDay;

    for (var i = 0; i < btns.length; i++) {
      if (!hasCustom && parseInt(btns[i].dataset.days) === state.form.days) {
        btns[i].classList.add('day-btn--active');
      } else {
        btns[i].classList.remove('day-btn--active');
      }
    }

    if (customBtn) {
      if (hasCustom) {
        customBtn.classList.add('day-btn--active');
        customBtn.innerHTML = '<input type="number" class="day-btn--custom-input" id="npCustomDayInput" value="' + state.form.days + '" min="1" max="30">';
        var input = document.getElementById('npCustomDayInput');
        if (input) {
          input.addEventListener('input', function() {
            var val = parseInt(this.value);
            if (val && val >= 1 && val <= 30) {
              state.form.days = val;
              state.form.customDays = val;
            }
          });
          input.addEventListener('blur', function() {
            var val = parseInt(this.value);
            if (!val || val < 1) val = 1;
            if (val > 30) val = 30;
            state.form.days = val;
            state.form.customDays = val;
            this.value = val;
          });
        }
      } else {
        customBtn.classList.remove('day-btn--active');
        customBtn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>';
      }
    }
  }

  function updateNpCounters() {
    dom.npAdultCount.textContent = state.form.adults;
    dom.npChildCount.textContent = state.form.children;
  }

  function changePeopleCount(type, delta) {
    var key = type === 'adult' ? 'adults' : 'children';
    var min = type === 'adult' ? 1 : 0;
    var currentValue = parseInt(state.form[key], 10);
    if (isNaN(currentValue)) currentValue = min;
    var nextValue = Math.max(min, Math.min(10, currentValue + delta));
    if (currentValue === nextValue) return;
    state.form[key] = nextValue;
    updateNpCounters();
  }

  function handlePeopleCounterClick() {
    var action = this.dataset.peopleAction;
    if (action === 'adult-minus') {
      changePeopleCount('adult', -1);
    } else if (action === 'adult-plus') {
      changePeopleCount('adult', 1);
    } else if (action === 'child-minus') {
      changePeopleCount('child', -1);
    } else if (action === 'child-plus') {
      changePeopleCount('child', 1);
    }
  }

  function bindPeopleCounterButton(btn) {
    if (!btn) return;
    btn.addEventListener('click', handlePeopleCounterClick);
  }

  function updateNpBudgetCards() {
    if (!dom.npBudgetOptions) return;
    var cards = dom.npBudgetOptions.querySelectorAll('.budget-card');
    for (var i = 0; i < cards.length; i++) {
      if (cards[i].dataset.budget === state.form.budget) {
        cards[i].classList.add('budget-card--active');
      } else {
        cards[i].classList.remove('budget-card--active');
      }
    }
  }

  function updateNpStyleCards() {
    var cards = dom.npStyleOptions.querySelectorAll('.style-card');
    for (var i = 0; i < cards.length; i++) {
      if (cards[i].dataset.style === state.form.travelStyle) {
        cards[i].classList.add('style-card--active');
      } else {
        cards[i].classList.remove('style-card--active');
      }
    }
  }

  function startGeneration() {
    if (!state.form.destinationCity) {
      showToast('请先选择目的地');
      return;
    }

    closeNewPlan();
    dom.pageLoading.classList.add('loading-overlay--show');

    for (var i = 0; i < dom.stepItems.length; i++) {
      dom.stepItems[i].classList.remove('step-item--active', 'step-item--done');
    }

    var steps = [
      '正在分析目的地资源...',
      '正在规划行程节奏...',
      '正在匹配旅行偏好...',
      '正在筛选景点组合...',
      '正在优化路线安排...',
      '正在推荐美食餐厅...',
      '正在估算预算明细...'
    ];

    var currentStep = 0;
    var stepDuration = 500;

    function nextStep() {
      if (currentStep > 0) {
        dom.stepItems[currentStep - 1].classList.remove('step-item--active');
        dom.stepItems[currentStep - 1].classList.add('step-item--done');
      }

      if (currentStep < steps.length) {
        dom.stepItems[currentStep].classList.add('step-item--active');
        dom.loadingStatusText.textContent = steps[currentStep];
        currentStep++;
        setTimeout(nextStep, stepDuration);
      } else {
        dom.stepItems[steps.length - 1].classList.remove('step-item--active');
        dom.stepItems[steps.length - 1].classList.add('step-item--done');
        dom.loadingStatusText.textContent = '行程规划完成！';

        setTimeout(function() {
          dom.pageLoading.classList.remove('loading-overlay--show');
          generateItineraryAndOpen();
        }, 400);
      }
    }

    setTimeout(nextStep, 300);
  }

  function generateGenericItinerary(city, days, budget) {
    var cityName = city.name;
    var isOverseas = !!city.isOverseas;
    var prefix = city.id + '-gen-';

    var morningActivities = isOverseas ? [
      { name: cityName + '经典地标打卡', desc: '前往城市最具代表性的地标建筑，感受异国风情的建筑之美。', duration: 3, category: '历史文化' },
      { name: '当地特色市场探索', desc: '逛一逛当地最有名的传统市场，感受当地的生活气息和文化特色。', duration: 2.5, category: '休闲购物' },
      { name: '著名博物馆参观', desc: '深入了解当地历史文化，欣赏珍贵的艺术品和文物收藏。', duration: 3, category: '博物馆' }
    ] : [
      { name: cityName + '著名景点游览', desc: '游览城市最具代表性的景点，感受当地的历史文化魅力。', duration: 3, category: '历史文化' },
      { name: '城市地标打卡', desc: '前往城市标志性建筑，拍照留念，感受城市的独特魅力。', duration: 2.5, category: '休闲观光' },
      { name: '博物馆深度游', desc: '参观城市博物馆，了解城市的历史变迁和文化底蕴。', duration: 3, category: '博物馆' }
    ];

    var afternoonActivities = isOverseas ? [
      { name: '特色街区漫步', desc: '在当地最有特色的街区漫步，逛逛特色小店，感受异国风情。', duration: 3, category: '休闲购物' },
      { name: '海滨/公园休闲', desc: '在城市最美的公园或海滨放松身心，享受悠闲的午后时光。', duration: 2.5, category: '自然风光' },
      { name: '当地文化体验', desc: '参与一次当地特色的文化体验活动，深入了解当地的风土人情。', duration: 3, category: '文化体验' }
    ] : [
      { name: '古街小巷探索', desc: '漫步在城市的古街小巷，感受当地的市井生活和文化氛围。', duration: 3, category: '休闲观光' },
      { name: '自然风光游览', desc: '游览城市周边的自然风光，呼吸新鲜空气，放松身心。', duration: 2.5, category: '自然风光' },
      { name: '文化景区深度游', desc: '深入游览城市的文化景区，感受历史与现代的交融。', duration: 3, category: '历史文化' }
    ];

    var eveningActivities = isOverseas ? [
      { name: '当地美食夜市', desc: '在当地最热闹的夜市品尝各种特色小吃，感受夜生活的魅力。', duration: 3, category: '美食探店' },
      { name: '夜景灯光秀', desc: '欣赏城市最美的夜景，感受异国都市的璀璨与浪漫。', duration: 2, category: '休闲观光' },
      { name: '特色表演/秀场', desc: '观看一场当地特色的表演或秀场，体验独特的文化艺术。', duration: 2.5, category: '文化体验' }
    ] : [
      { name: '夜游城市地标', desc: '夜晚的城市别有一番风味，灯光璀璨的地标更加迷人。', duration: 2, category: '休闲观光' },
      { name: '美食街探店', desc: '前往当地最有名的美食街，品尝各种特色小吃和地道美食。', duration: 3, category: '美食探店' },
      { name: '滨江/湖畔漫步', desc: '在江边或湖边悠闲漫步，感受城市夜晚的宁静与美好。', duration: 2, category: '自然风光' }
    ];

    var dayTitles = isOverseas ? [
      '初识' + cityName,
      '深度探索',
      '文化体验',
      '休闲购物',
      '告别之旅'
    ] : [
      cityName + '初印象',
      '深度探索',
      '文化之旅',
      '自然风光',
      '悠闲时光'
    ];

    var dailyItineraries = [];
    var morningTimes = [
      { start: '08:30', end: '11:45' },
      { start: '09:00', end: '12:15' },
      { start: '08:45', end: '12:00' },
      { start: '09:15', end: '12:30' }
    ];
    var afternoonTimes = [
      { start: '13:30', end: '17:00' },
      { start: '14:00', end: '17:15' },
      { start: '13:45', end: '16:45' },
      { start: '14:15', end: '17:30' }
    ];
    var eveningTimes = [
      { start: '18:30', end: '21:30' },
      { start: '19:00', end: '21:45' },
      { start: '18:15', end: '21:00' },
      { start: '18:45', end: '22:00' }
    ];

    for (var d = 1; d <= days; d++) {
      var morningIdx = (d - 1) % morningActivities.length;
      var afternoonIdx = (d - 1) % afternoonActivities.length;
      var eveningIdx = (d - 1) % eveningActivities.length;
      var timeIdx = (d - 1) % morningTimes.length;

      dailyItineraries.push({
        day: d,
        title: dayTitles[(d - 1) % dayTitles.length],
        morning: {
          activity: 'attraction',
          attractionId: prefix + 'morning-' + d,
          attractionName: morningActivities[morningIdx].name,
          startTime: morningTimes[timeIdx].start,
          endTime: morningTimes[timeIdx].end,
          duration: morningActivities[morningIdx].duration,
          description: morningActivities[morningIdx].desc,
          category: morningActivities[morningIdx].category,
          rating: 4.7,
          ticketPrice: isOverseas ? 150 : 80,
          address: cityName + '市中心',
          imageUrl: 'https://picsum.photos/seed/' + city.id + 'am' + d + '/400/300',
          mapX: 30 + Math.floor(Math.random() * 40),
          mapY: 25 + Math.floor(Math.random() * 30),
          poiCategory: 'attraction'
        },
        afternoon: {
          activity: 'attraction',
          attractionId: prefix + 'afternoon-' + d,
          attractionName: afternoonActivities[afternoonIdx].name,
          startTime: afternoonTimes[timeIdx].start,
          endTime: afternoonTimes[timeIdx].end,
          duration: afternoonActivities[afternoonIdx].duration,
          description: afternoonActivities[afternoonIdx].desc,
          category: afternoonActivities[afternoonIdx].category,
          rating: 4.6,
          ticketPrice: isOverseas ? 120 : 60,
          address: cityName + '特色街区',
          imageUrl: 'https://picsum.photos/seed/' + city.id + 'pm' + d + '/400/300',
          mapX: 50 + Math.floor(Math.random() * 30),
          mapY: 45 + Math.floor(Math.random() * 30),
          poiCategory: 'attraction'
        },
        evening: {
          activity: 'attraction',
          attractionId: prefix + 'evening-' + d,
          attractionName: eveningActivities[eveningIdx].name,
          startTime: eveningTimes[timeIdx].start,
          endTime: eveningTimes[timeIdx].end,
          duration: eveningActivities[eveningIdx].duration,
          description: eveningActivities[eveningIdx].desc,
          category: eveningActivities[eveningIdx].category,
          rating: 4.5,
          ticketPrice: isOverseas ? 80 : 0,
          address: cityName + '夜生活区',
          imageUrl: 'https://picsum.photos/seed/' + city.id + 'eve' + d + '/400/300',
          mapX: 40 + Math.floor(Math.random() * 30),
          mapY: 65 + Math.floor(Math.random() * 25),
          poiCategory: 'attraction'
        },
        meals: {
          breakfast: '酒店早餐',
          lunchRestaurantId: prefix + 'restaurant-' + d + '-lunch',
          lunchRestaurantName: (isOverseas ? '当地特色餐厅' : '本地老字号') + '（午餐）',
          lunchCuisine: isOverseas ? '异国料理' : '当地菜',
          lunchPrice: isOverseas ? 200 : 80,
          lunchRating: 4.5,
          lunchAddress: cityName + '市中心',
          lunchImage: 'https://picsum.photos/seed/' + city.id + 'lunch' + d + '/400/300',
          dinnerRestaurantId: prefix + 'restaurant-' + d + '-dinner',
          dinnerRestaurantName: (isOverseas ? '网红打卡餐厅' : '人气美食店') + '（晚餐）',
          dinnerCuisine: isOverseas ? '特色料理' : '特色菜',
          dinnerPrice: isOverseas ? 300 : 120,
          dinnerRating: 4.6,
          dinnerAddress: cityName + '美食街',
          dinnerImage: 'https://picsum.photos/seed/' + city.id + 'dinner' + d + '/400/300'
        },
        transport: {
          description: isOverseas ? '地铁+出租车，市内交通' : '地铁+公交，市内交通',
          cost: isOverseas ? 150 : 50
        },
        accommodation: {
          area: isOverseas ? cityName + '市中心商圈' : cityName + '市中心区域',
          suggestion: '推荐住在市中心区域，交通便利，周边餐饮购物选择多。'
        }
      });
    }

    var budgetMap = {
      economy: { days_3: isOverseas ? 8000 : 1800, days_5: isOverseas ? 12000 : 2800 },
      comfort: { days_3: isOverseas ? 15000 : 3500, days_5: isOverseas ? 22000 : 5500 },
      luxury: { days_3: isOverseas ? 30000 : 8000, days_5: isOverseas ? 45000 : 12000 }
    };

    var budgetKey = 'days_' + (days >= 5 ? '5' : '3');
    var totalBudget = {
      economy: budgetMap.economy[budgetKey],
      comfort: budgetMap.comfort[budgetKey],
      luxury: budgetMap.luxury[budgetKey]
    };

    return {
      id: 'gen-' + city.id + '-' + days + 'day',
      cityId: city.id,
      cityName: city.name,
      days: days,
      title: city.name + days + '日游',
      description: city.description,
      totalBudget: totalBudget,
      dailyItineraries: dailyItineraries,
      generated: true
    };
  }

  function generateItineraryAndOpen() {
    var templateDays = state.form.days <= 3 ? 3 : 5;
    var cityId = state.form.destinationCity;
    var city = getCityById(cityId);

    var itinerary = null;
    for (var i = 0; i < MOCK_ITINERARIES.length; i++) {
      if (MOCK_ITINERARIES[i].cityId === cityId && MOCK_ITINERARIES[i].days === templateDays) {
        itinerary = JSON.parse(JSON.stringify(MOCK_ITINERARIES[i]));
        break;
      }
    }

    if (!itinerary) {
      itinerary = generateGenericItinerary(city, templateDays, state.form.budget);
    }

    if (state.form.days < itinerary.days) {
      itinerary.dailyItineraries = itinerary.dailyItineraries.slice(0, state.form.days);
      itinerary.days = state.form.days;
    }

    var totalBudget = itinerary.totalBudget[state.form.budget];
    var totalPeople = state.form.adults + state.form.children;

    var plan = {
      id: 'plan-new-' + Date.now(),
      title: getCityById(cityId).name + ' ' + state.form.days + '日游',
      cityId: cityId,
      cityName: getCityById(cityId).name,
      days: state.form.days,
      startDate: state.form.departureDate,
      people: totalPeople,
      budget: state.form.budget,
      budgetAmount: totalBudget * totalPeople,
      status: 'planning',
      coverImage: getCityById(cityId).imageUrl,
      itineraryId: itinerary.id,
      tags: state.form.preferences.length > 0 ? state.form.preferences.slice(0, 2) : ['自由行'],
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
      order: MOCK_MY_PLANS.length,
      folderId: state.planList.currentFolder !== 'all' && state.planList.currentFolder !== 'uncategorized' ? state.planList.currentFolder : null,
      favorite: false
    };

    MOCK_MY_PLANS.push(plan);

    state.detail.plan = plan;
    state.detail.itinerary = itinerary;
    state.detail.currentDay = 1;
    state.detail.currentTab = 'itinerary';

    openPlanDetail(plan, itinerary);
  }

  // ========================================
  // 行程详情页
  // ========================================

  function cloneItineraryData(itinerary) {
    return JSON.parse(JSON.stringify(itinerary));
  }

  function openPlanDetail(plan, itinerary) {
    state.detail.plan = plan;
    if (!plan.itineraryDraft) {
      var sourceItinerary = itinerary || getItineraryById(plan.itineraryId) || MOCK_ITINERARIES[0];
      plan.itineraryDraft = cloneItineraryData(sourceItinerary);
    }
    state.detail.itinerary = plan.itineraryDraft;
    state.detail.currentDay = 1;
    state.detail.currentTab = 'itinerary';

    renderDetailHeader();
    renderDetailDaySwitcher();
    renderDetailDailyItinerary();
    renderDetailBudget();
    renderDetailTips();
    renderDetailMap();
    updateDetailTabs();

    if (dom.pageNewPlan) {
      dom.pageNewPlan.classList.remove('page-slide--open');
    }
    if (dom.pagePlanDetail) {
      dom.pagePlanDetail.scrollTop = 0;
      dom.pagePlanDetail.classList.remove('detail-sheet--pushed');
    }
    if (dom.planDetailSheet) {
      dom.planDetailSheet.scrollTop = 0;
    }
    openSlidePage(dom.pagePlanDetail, 'plan-detail');

    resetMapRevealState();
    settlePlanDetailSheet(false, true);
    setTimeout(initMapReveal, 50);
  }

  function closePlanDetail() {
    resetMapRevealState();
    closeSlidePage(dom.pagePlanDetail);
  }

  var statePlanDetailSheet = {
    dismissed: false,
    candidate: false,
    dragging: false,
    offset: 0,
    startOffset: 0,
    startY: 0,
    lastY: 0,
    lastTime: 0,
    velocity: 0,
    suppressClick: false
  };

  function getPlanDetailSheetMaxOffset() {
    if (!dom.pagePlanDetail) return 0;
    return Math.max(0, dom.pagePlanDetail.clientHeight - 36);
  }

  function getPlanDetailSheetHandleOpenTop() {
    if (!dom.detailTabs) return 166;
    return Math.max(8, dom.detailTabs.offsetTop + 3);
  }

  function applyPlanDetailSheetOffset(offset, immediate) {
    if (!dom.planDetailSheet) return;
    var maxOffset = getPlanDetailSheetMaxOffset();
    var nextOffset = Math.max(0, Math.min(maxOffset, offset));
    var progress = maxOffset > 0 ? nextOffset / maxOffset : 0;
    var handleTop = getPlanDetailSheetHandleOpenTop() * (1 - progress);
    statePlanDetailSheet.offset = nextOffset;
    dom.planDetailSheet.classList.toggle('plan-detail-sheet--dragging', !!immediate);
    dom.planDetailSheet.style.setProperty('--sheet-offset', nextOffset.toFixed(1) + 'px');
    dom.planDetailSheet.style.setProperty('--sheet-handle-top', handleTop.toFixed(1) + 'px');
    if (dom.itineraryMapReveal) {
      dom.itineraryMapReveal.style.setProperty('--map-reveal-progress', progress.toFixed(3));
      dom.itineraryMapReveal.classList.toggle('itinerary-map-reveal--visible', progress > 0.04);
    }
  }

  function settlePlanDetailSheet(dismissed, immediate) {
    if (!dom.planDetailSheet) return;
    statePlanDetailSheet.dismissed = !!dismissed;
    statePlanDetailSheet.dragging = false;
    statePlanDetailSheet.candidate = false;
    dom.planDetailSheet.classList.remove('plan-detail-sheet--dragging');
    dom.planDetailSheet.classList.toggle('plan-detail-sheet--dismissed', statePlanDetailSheet.dismissed);
    if (immediate) dom.planDetailSheet.classList.add('plan-detail-sheet--instant');
    applyPlanDetailSheetOffset(statePlanDetailSheet.dismissed ? getPlanDetailSheetMaxOffset() : 0, false);
    if (immediate) {
      window.requestAnimationFrame(function() {
        dom.planDetailSheet.classList.remove('plan-detail-sheet--instant');
      });
    }
    if (dom.planDetailSheetHandle) {
      dom.planDetailSheetHandle.setAttribute('aria-label', statePlanDetailSheet.dismissed ? '展开行程面板' : '收起行程面板');
    }
    setMapRevealInteraction(statePlanDetailSheet.dismissed);
  }

  function beginPlanDetailSheetDrag(clientY) {
    if (!dom.planDetailSheet) return false;
    if (!statePlanDetailSheet.dismissed && dom.planDetailSheet.scrollTop > 0) return false;
    statePlanDetailSheet.candidate = true;
    statePlanDetailSheet.dragging = false;
    statePlanDetailSheet.startY = clientY;
    statePlanDetailSheet.lastY = clientY;
    statePlanDetailSheet.startOffset = statePlanDetailSheet.offset;
    statePlanDetailSheet.lastTime = Date.now();
    statePlanDetailSheet.velocity = 0;
    return true;
  }

  function movePlanDetailSheetDrag(clientY, event) {
    if (!statePlanDetailSheet.candidate) return;
    var deltaY = clientY - statePlanDetailSheet.startY;
    var openingGesture = statePlanDetailSheet.dismissed && deltaY < 0;
    var closingGesture = !statePlanDetailSheet.dismissed && deltaY > 0;
    if (!statePlanDetailSheet.dragging && !openingGesture && !closingGesture) return;

    if (event && event.cancelable) event.preventDefault();
    if (!statePlanDetailSheet.dragging) setMapRevealInteraction(false);
    statePlanDetailSheet.dragging = true;
    var now = Date.now();
    var elapsed = Math.max(1, now - statePlanDetailSheet.lastTime);
    statePlanDetailSheet.velocity = (clientY - statePlanDetailSheet.lastY) / elapsed;
    statePlanDetailSheet.lastY = clientY;
    statePlanDetailSheet.lastTime = now;
    applyPlanDetailSheetOffset(statePlanDetailSheet.startOffset + deltaY, true);
  }

  function endPlanDetailSheetDrag() {
    if (!statePlanDetailSheet.candidate) return;
    var wasDragging = statePlanDetailSheet.dragging;
    statePlanDetailSheet.candidate = false;
    if (!wasDragging) return;

    var maxOffset = getPlanDetailSheetMaxOffset();
    var dismiss = statePlanDetailSheet.offset > maxOffset * 0.32;
    if (statePlanDetailSheet.velocity > 0.45) dismiss = true;
    if (statePlanDetailSheet.velocity < -0.45) dismiss = false;
    statePlanDetailSheet.suppressClick = true;
    settlePlanDetailSheet(dismiss, false);
    setTimeout(function() {
      statePlanDetailSheet.suppressClick = false;
    }, 320);
  }

  function bindDetailSheetPush() {
    if (!dom.planDetailSheet || !dom.pagePlanDetail) return;

    dom.planDetailSheet.addEventListener('scroll', function() {
      dom.pagePlanDetail.classList.toggle('detail-sheet--pushed', dom.planDetailSheet.scrollTop > 96);
    }, { passive: true });

    dom.planDetailSheet.addEventListener('touchstart', function(e) {
      if (e.touches.length !== 1) return;
      beginPlanDetailSheetDrag(e.touches[0].clientY);
    }, { passive: true });

    dom.planDetailSheet.addEventListener('touchmove', function(e) {
      if (e.touches.length !== 1) return;
      movePlanDetailSheetDrag(e.touches[0].clientY, e);
    }, { passive: false });

    dom.planDetailSheet.addEventListener('touchend', endPlanDetailSheetDrag, { passive: true });
    dom.planDetailSheet.addEventListener('touchcancel', endPlanDetailSheetDrag, { passive: true });

    dom.planDetailSheet.addEventListener('pointerdown', function(e) {
      if (e.pointerType !== 'mouse' || e.button !== 0) return;
      beginPlanDetailSheetDrag(e.clientY);
    });
    window.addEventListener('pointermove', function(e) {
      if (e.pointerType !== 'mouse') return;
      movePlanDetailSheetDrag(e.clientY, e);
    });
    window.addEventListener('pointerup', function(e) {
      if (e.pointerType !== 'mouse') return;
      endPlanDetailSheetDrag();
    });

    if (dom.planDetailSheetHandle) {
      dom.planDetailSheetHandle.addEventListener('click', function() {
        if (statePlanDetailSheet.suppressClick) return;
        settlePlanDetailSheet(!statePlanDetailSheet.dismissed, false);
      });
    }

    window.addEventListener('resize', function() {
      settlePlanDetailSheet(statePlanDetailSheet.dismissed, true);
    });
  }

  function renderDetailHeader() {
    var plan = state.detail.plan;
    dom.detailTitle.textContent = plan.title || '行程详情';
    dom.detailCity.textContent = plan.cityName;
    dom.detailDays.textContent = plan.days;
    dom.detailPeople.textContent = plan.people;
    dom.detailBudget.textContent = formatMoney(plan.budgetAmount);

    var tags = plan.tags || [];
    var html = tags.map(function(t) {
      return '<span class="detail-tags__item">#' + t + '</span>';
    }).join('');
    html += '<span class="detail-tags__edit" id="editDetailTags"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-1px;margin-right:3px;"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg> 编辑</span>';
    dom.detailTags.innerHTML = html;

    var editBtn = document.getElementById('editDetailTags');
    if (editBtn) {
      editBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        openTagModal();
      });
    }
  }

  var AVAILABLE_TAGS = [
    '文化历史', '自然风光', '美食探店', '休闲度假',
    '亲子游', '情侣游', '周末游', '都市风光',
    '户外探险', '摄影', '购物', 'solo旅行',
    '文艺', '主题乐园', '海岛', '温泉',
    '自驾游', '跟团游', '自由行', '穷游'
  ];

  var tagModalState = {
    selectedTags: [],
    maxTags: 5
  };

  function openTagModal() {
    var plan = state.detail.plan;
    var planTags = (plan.tags || []).slice();
    tagModalState.selectedTags = planTags.filter(function(t) {
      return AVAILABLE_TAGS.indexOf(t) >= 0;
    });
    if (tagModalState.selectedTags.length === 0 && planTags.length > 0) {
      tagModalState.selectedTags = planTags.slice(0, tagModalState.maxTags);
    }
    renderTagEditGrid();
    dom.tagModal.classList.add('modal--show');
  }

  function closeTagModal() {
    dom.tagModal.classList.remove('modal--show');
  }

  function renderTagEditGrid() {
    dom.tagEditGrid.innerHTML = '';
    var selected = tagModalState.selectedTags;
    var plan = state.detail.plan;
    var allTags = AVAILABLE_TAGS.slice();
    var planTags = plan.tags || [];
    planTags.forEach(function(t) {
      if (allTags.indexOf(t) < 0) {
        allTags.unshift(t);
      }
    });

    allTags.forEach(function(tag) {
      var item = document.createElement('div');
      var isSelected = selected.indexOf(tag) >= 0;
      var isDisabled = !isSelected && selected.length >= tagModalState.maxTags;
      item.className = 'tag-edit-item';
      if (isSelected) item.classList.add('tag-edit-item--active');
      if (isDisabled) item.classList.add('tag-edit-item--disabled');
      item.textContent = tag;

      item.addEventListener('click', function() {
        if (isDisabled) return;
        var idx = tagModalState.selectedTags.indexOf(tag);
        if (idx >= 0) {
          tagModalState.selectedTags.splice(idx, 1);
        } else {
          if (tagModalState.selectedTags.length < tagModalState.maxTags) {
            tagModalState.selectedTags.push(tag);
          }
        }
        renderTagEditGrid();
      });

      dom.tagEditGrid.appendChild(item);
    });
  }

  function saveTags() {
    var plan = state.detail.plan;
    plan.tags = tagModalState.selectedTags.slice();
    plan.updatedAt = Date.now();
    renderDetailHeader();
    renderPlanList();
    closeTagModal();
    showToast('标签已更新');
  }

  function renderDetailDaySwitcher() {
    if (!dom.detailDaySwitcher) return;
    dom.detailDaySwitcher.innerHTML = '';
    var itinerary = state.detail.itinerary;

    for (var i = 0; i < itinerary.dailyItineraries.length; i++) {
      var day = itinerary.dailyItineraries[i];
      var item = document.createElement('div');
      item.className = 'day-switcher__item';
      if (day.day === state.detail.currentDay) {
        item.classList.add('day-switcher__item--active');
      }
      item.innerHTML =
        '<div class="day-switcher__num">Day ' + day.day + '</div>' +
        '<div class="day-switcher__name">' + day.title.substring(0, 4) + '</div>';

      (function(dayNum) {
        item.addEventListener('click', function() {
          selectDetailDay(dayNum);
        });
      })(day.day);

      dom.detailDaySwitcher.appendChild(item);
    }
    renderMapDayCarousel();
  }

  function selectDetailDay(dayNum) {
    if (!state.detail.itinerary || dayNum === state.detail.currentDay) return;
    state.detail.currentDay = dayNum;
    resetMapRevealState();
    renderDetailDaySwitcher();
    renderDetailDailyItinerary();
  }

  function getMapPointCountForDay(dayData) {
    if (!dayData) return 0;
    var ids = [];
    var periods = ['morning', 'afternoon', 'evening'];
    for (var i = 0; i < periods.length; i++) {
      var activities = normalizeTimelineActivities(dayData[periods[i]]);
      for (var j = 0; j < activities.length; j++) {
        if (activities[j].activity === 'attraction' && activities[j].attractionId) {
          ids.push(activities[j].attractionId);
        }
      }
    }
    if (dayData.meals && dayData.meals.lunchRestaurantId) ids.push(dayData.meals.lunchRestaurantId);
    if (dayData.meals && dayData.meals.dinnerRestaurantId) ids.push(dayData.meals.dinnerRestaurantId);
    return ids.filter(function(id, index) { return ids.indexOf(id) === index; }).length;
  }

  function renderMapDayCarousel() {
    if (!dom.mapDayCarousel || !state.detail.itinerary) return;
    var days = state.detail.itinerary.dailyItineraries || [];
    var html = '';
    for (var i = 0; i < days.length; i++) {
      var day = days[i];
      var activeClass = day.day === state.detail.currentDay ? ' map-day-card--active' : '';
      var pointCount = getMapPointCountForDay(day);
      var transportCount = ensureDayTransports(day).length;
      html +=
        '<button class="map-day-card' + activeClass + '" data-map-day="' + day.day + '" aria-label="查看 Day ' + day.day + ' 行程地图" aria-pressed="' + (day.day === state.detail.currentDay ? 'true' : 'false') + '">' +
          '<span class="map-day-card__icon">' +
            '<svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
              '<path d="M1 6v16l7-4 8 4 7-4V2l-7 4-8-4-7 4z"/>' +
              '<path d="M8 2v16M16 6v16"/>' +
            '</svg>' +
          '</span>' +
          '<span class="map-day-card__body">' +
            '<strong>Day ' + day.day + ' 行程地图</strong>' +
            '<span>' + pointCount + ' 个地点 · ' + transportCount + ' 段交通</span>' +
          '</span>' +
          '<span class="map-day-card__day-name">' + escapeMapHtml(day.title.substring(0, 6)) + '</span>' +
        '</button>';
    }
    dom.mapDayCarousel.innerHTML = html;

    var cards = dom.mapDayCarousel.querySelectorAll('.map-day-card');
    for (var c = 0; c < cards.length; c++) {
      cards[c].addEventListener('click', function() {
        selectDetailDay(parseInt(this.dataset.mapDay, 10));
      });
    }

    if (!dom.mapDayCarousel._dayScrollBound) {
      dom.mapDayCarousel._dayScrollBound = true;
      dom.mapDayCarousel.addEventListener('scroll', function() {
        clearTimeout(dom.mapDayCarousel._dayScrollTimer);
        dom.mapDayCarousel._dayScrollTimer = setTimeout(selectNearestMapDayCard, 100);
      }, { passive: true });
    }

    window.requestAnimationFrame(function() {
      scrollMapDayCarouselToCurrent(false);
    });
  }

  function selectNearestMapDayCard() {
    if (!dom.mapDayCarousel) return;
    var cards = dom.mapDayCarousel.querySelectorAll('.map-day-card');
    if (!cards.length) return;
    var center = dom.mapDayCarousel.scrollLeft + dom.mapDayCarousel.clientWidth / 2;
    var nearest = cards[0];
    var nearestDistance = Infinity;
    for (var i = 0; i < cards.length; i++) {
      var cardCenter = cards[i].offsetLeft + cards[i].offsetWidth / 2;
      var distance = Math.abs(cardCenter - center);
      if (distance < nearestDistance) {
        nearest = cards[i];
        nearestDistance = distance;
      }
    }
    selectDetailDay(parseInt(nearest.dataset.mapDay, 10));
  }

  function scrollMapDayCarouselToCurrent(smooth) {
    if (!dom.mapDayCarousel) return;
    var current = dom.mapDayCarousel.querySelector('[data-map-day="' + state.detail.currentDay + '"]');
    if (!current) return;
    var left = current.offsetLeft - (dom.mapDayCarousel.clientWidth - current.offsetWidth) / 2;
    dom.mapDayCarousel.scrollTo({ left: Math.max(0, left), behavior: smooth ? 'smooth' : 'auto' });
  }

  function getCurrentDayData() {
    var itinerary = state.detail.itinerary;
    if (!itinerary) return null;

    for (var i = 0; i < itinerary.dailyItineraries.length; i++) {
      if (itinerary.dailyItineraries[i].day === state.detail.currentDay) {
        return itinerary.dailyItineraries[i];
      }
    }
    return null;
  }

  function renderDetailDailyItinerary() {
    var dayData = getCurrentDayData();
    if (!dayData) return;

    if (dom.detailDayNum) dom.detailDayNum.textContent = 'Day ' + dayData.day;
    if (dom.detailDayName) dom.detailDayName.textContent = dayData.title;

    renderUnifiedTimeline();
    initMapReveal();

    if (dom.detailAccommodationCard) {
      if (dayData.accommodation) {
        dom.detailAccommodationCard.style.display = 'flex';
        var accArea = dom.detailAccommodationCard.querySelector('.accommodation-card__area');
        var accDesc = dom.detailAccommodationCard.querySelector('.accommodation-card__desc');
        if (accArea) accArea.textContent = '推荐住宿区域：' + dayData.accommodation.area;
        if (accDesc) accDesc.textContent = dayData.accommodation.suggestion;
      } else {
        dom.detailAccommodationCard.style.display = 'none';
      }
    }

    if (state.detail.currentTab === 'itinerary') {
      renderDetailMap();
    }
  }

  function renderActivityCard(activity, period) {
    if (!activity) return '';

    if (activity.activity === 'attraction') {
      var attraction = getAttractionById(activity.attractionId) || {
        id: activity.attractionId || period,
        name: activity.attractionName || activity.title || '目的地',
        ticketPrice: typeof activity.ticketPrice === 'number' ? activity.ticketPrice : 0,
        rating: activity.rating || '4.5'
      };
      var attractionTitle = activity.title || attraction.name;

      var timeDisplay = '';
      if (activity.startTime && activity.endTime) {
        timeDisplay =
          '<span>' + getFancyIcon('clock', 12) + ' ' + escapeMapHtml(activity.startTime) + ' - ' + escapeMapHtml(activity.endTime) + '</span>';
      } else {
        timeDisplay =
          '<span>' + getFancyIcon('clock', 12) + ' ' + activity.duration + '小时</span>';
      }

      return (
        '<div class="attraction-card" data-attraction-id="' + attraction.id + '">' +
          '<div class="attraction-card__body">' +
            '<div class="itinerary-card__head">' +
              '<h3 class="attraction-card__title">' + escapeMapHtml(attractionTitle) + '</h3>' +
              renderItineraryEditButton('activity', period, '') +
            '</div>' +
            '<div class="attraction-card__meta">' +
              timeDisplay +
              '<span>' + getFancyIcon('ticket', 12) + ' ' + (attraction.ticketPrice > 0 ? '¥' + attraction.ticketPrice : '免费') + '</span>' +
              '<span>' + getFancyIcon('star', 12) + ' ' + attraction.rating + '</span>' +
            '</div>' +
            '<p class="attraction-card__desc">' + escapeMapHtml(activity.description || '') + '</p>' +
          '</div>' +
        '</div>'
      );
    } else {
      var activityTitle = activity.title ||
        (activity.activity === 'leisure' ? '自由活动' :
         activity.activity === 'shopping' ? '购物时间' :
         activity.activity === 'departure' ? '行程结束' : '安排');
      return (
        '<div class="attraction-card">' +
          '<div class="attraction-card__body">' +
            '<div class="itinerary-card__head">' +
              '<h3 class="attraction-card__title">' + escapeMapHtml(activityTitle) + '</h3>' +
              renderItineraryEditButton('activity', period, '') +
            '</div>' +
            '<div class="attraction-card__meta">' +
              '<span><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-1px;margin-right:2px;"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>' + escapeMapHtml(activity.startTime || '') + ' - ' + escapeMapHtml(activity.endTime || '') + '</span>' +
            '</div>' +
            '<p class="attraction-card__desc">' + escapeMapHtml(activity.description || '') + '</p>' +
          '</div>' +
        '</div>'
      );
    }
  }

  function renderRestaurants(meals) {
    if (!meals) return '';
    var html = '';

    if (meals.lunchRestaurantId || meals.lunchRestaurantName) {
      var lunch = getMealRestaurant(meals, 'lunch');
      if (lunch) {
        html += renderRestaurantCard(lunch, '午餐推荐', 'lunch');
      }
    }

    if (meals.dinnerRestaurantId || meals.dinnerRestaurantName) {
      var dinner = getMealRestaurant(meals, 'dinner');
      if (dinner) {
        html += renderRestaurantCard(dinner, '晚餐推荐', 'dinner');
      }
    }

    return html;
  }

  function getMealRestaurant(meals, mealKey) {
    if (!meals) return null;
    var prefix = mealKey === 'dinner' ? 'dinner' : 'lunch';
    var restaurantId = meals[prefix + 'RestaurantId'];
    return getRestaurantById(restaurantId) || buildMealFallbackRestaurant(meals, prefix);
  }

  function buildMealFallbackRestaurant(meals, prefix) {
    var name = meals[prefix + 'RestaurantName'];
    var restaurantId = meals[prefix + 'RestaurantId'];
    if (!name && !restaurantId) return null;

    return {
      id: restaurantId || prefix + '-restaurant',
      name: name || (prefix === 'dinner' ? '晚餐餐厅' : '午餐餐厅'),
      cuisine: meals[prefix + 'Cuisine'] || '当地菜',
      priceRange: meals[prefix + 'Price'] || 80,
      rating: meals[prefix + 'Rating'] || '4.5',
      signatureDishes: meals[prefix + 'SignatureDishes'] || ['当地特色']
    };
  }

  function renderRestaurantCard(restaurant, label, mealKey) {
    return (
      '<div class="restaurant-card">' +
        '<div class="restaurant-card__info">' +
          '<div class="itinerary-card__head">' +
            '<div class="restaurant-card__name">' + escapeMapHtml(restaurant.name) + ' <small style="color:#F97316;font-size:11px;">[' + escapeMapHtml(label) + ']</small></div>' +
            renderItineraryEditButton('meal', '', mealKey) +
          '</div>' +
          '<div class="restaurant-card__meta">' +
            escapeMapHtml(restaurant.cuisine) + ' · ¥' + restaurant.priceRange + '/人 · <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="none" style="vertical-align:-1px;"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>' + restaurant.rating +
          '</div>' +
          '<div class="restaurant-card__dishes">招牌：' + escapeMapHtml(restaurant.signatureDishes.join('、')) + '</div>' +
        '</div>' +
      '</div>'
    );
  }

  function renderItineraryEditButton(type, period, mealKey) {
    return (
      '<button class="itinerary-edit-btn" data-edit-type="' + type + '" data-period="' + (period || '') + '" data-meal-key="' + (mealKey || '') + '" aria-label="编辑">' +
        '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">' +
          '<path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>' +
          '<path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>' +
        '</svg>' +
      '</button>'
    );
  }

  function openItineraryEditFromButton(btn) {
    if (!btn || !dom.itineraryEditModal) return;
    state.itineraryEdit.type = btn.dataset.editType || null;
    state.itineraryEdit.period = btn.dataset.period || null;
    state.itineraryEdit.activityIndex = parseInt(btn.dataset.activityIndex || '0', 10);
    state.itineraryEdit.mealKey = btn.dataset.mealKey || null;
    state.itineraryEdit.transportIndex = btn.dataset.transportIndex ? parseInt(btn.dataset.transportIndex, 10) : null;
    state.itineraryEdit.transportDraft = null;
    renderItineraryEditForm();
    dom.itineraryEditModal.classList.add('modal--show');
  }

  function closeItineraryEditModal() {
    if (dom.itineraryEditModal) {
      dom.itineraryEditModal.classList.remove('modal--show');
    }
    state.itineraryEdit.transportIndex = null;
    state.itineraryEdit.transportDraft = null;
  }

  function openTransportSegmentEdit(transportIndex) {
    if (!dom.itineraryEditModal) return;
    state.itineraryEdit.type = 'transport';
    state.itineraryEdit.period = null;
    state.itineraryEdit.mealKey = null;
    state.itineraryEdit.transportIndex = transportIndex;
    state.itineraryEdit.transportDraft = null;
    renderItineraryEditForm();
    dom.itineraryEditModal.classList.add('modal--show');
  }

  function renderItineraryEditForm() {
    var dayData = getCurrentDayData();
    if (!dayData || !dom.itineraryEditBody) return;

    var type = state.itineraryEdit.type;
    if (type === 'activity') {
      renderActivityEditForm(dayData);
    } else if (type === 'meal') {
      renderMealEditForm(dayData);
    } else if (type === 'transport') {
      renderTransportEditForm(dayData);
    } else if (type === 'accommodation') {
      renderAccommodationEditForm(dayData);
    }
  }

  function renderActivityEditForm(dayData) {
    var period = state.itineraryEdit.period;
    var periodData = dayData[period];
    var activity = Array.isArray(periodData) ? periodData[state.itineraryEdit.activityIndex] || {} : periodData || {};
    var title = activity.title || '';

    if (!title && activity.activity === 'attraction') {
      var attraction = getAttractionById(activity.attractionId);
      title = attraction ? attraction.name : '';
    }

    if (!title) {
      title = activity.activity === 'leisure' ? '自由活动' :
              activity.activity === 'shopping' ? '购物时间' :
              activity.activity === 'departure' ? '行程结束' : '安排';
    }

    dom.itineraryEditTitle.textContent = getPeriodName(period) + '安排';
    dom.itineraryEditBody.innerHTML =
      '<div class="form-field">' +
        '<label class="form-label">标题</label>' +
        '<input class="form-input" id="itineraryEditActivityTitle" value="' + escapeMapHtml(title) + '" maxlength="30">' +
      '</div>' +
      '<div class="itinerary-edit-grid">' +
        '<div class="form-field">' +
          '<label class="form-label">开始时间</label>' +
          '<input class="form-input" id="itineraryEditStartTime" type="time" value="' + escapeMapHtml(activity.startTime || '') + '">' +
        '</div>' +
        '<div class="form-field">' +
          '<label class="form-label">结束时间</label>' +
          '<input class="form-input" id="itineraryEditEndTime" type="time" value="' + escapeMapHtml(activity.endTime || '') + '">' +
        '</div>' +
      '</div>' +
      '<div class="form-field">' +
        '<label class="form-label">说明</label>' +
        '<textarea class="form-textarea" id="itineraryEditDescription" rows="4" maxlength="160">' + escapeMapHtml(activity.description || '') + '</textarea>' +
      '</div>';
  }

  function renderMealEditForm(dayData) {
    var mealKey = state.itineraryEdit.mealKey;
    var prop = mealKey === 'dinner' ? 'dinnerRestaurantId' : 'lunchRestaurantId';
    var currentRestaurantId = dayData.meals ? dayData.meals[prop] : '';
    var restaurants = getRestaurantsByCity(state.detail.plan.cityId).slice();
    var currentRestaurant = getMealRestaurant(dayData.meals || {}, mealKey);
    if (currentRestaurant) {
      var hasCurrentRestaurant = restaurants.some(function(restaurant) {
        return restaurant.id === currentRestaurant.id;
      });
      if (!hasCurrentRestaurant) {
        restaurants.unshift(currentRestaurant);
      }
    }
    var options = restaurants.map(function(restaurant) {
      var selected = restaurant.id === currentRestaurantId ? ' selected' : '';
      return '<option value="' + escapeMapHtml(restaurant.id) + '"' + selected + '>' + escapeMapHtml(restaurant.name) + '</option>';
    }).join('');

    dom.itineraryEditTitle.textContent = mealKey === 'dinner' ? '编辑晚餐推荐' : '编辑午餐推荐';
    dom.itineraryEditBody.innerHTML =
      '<div class="form-field">' +
        '<label class="form-label">推荐餐厅</label>' +
        '<select class="form-select" id="itineraryEditRestaurant">' + options + '</select>' +
      '</div>';
  }

  function renderTransportEditForm(dayData) {
    var transports = ensureDayTransports(dayData);
    var transportIndex = state.itineraryEdit.transportIndex;
    var isSingleNode = typeof transportIndex === 'number' && !isNaN(transportIndex);

    if (!state.itineraryEdit.transportDraft) {
      var source = isSingleNode ? [transports[transportIndex] || getDefaultRouteTransport(transportIndex, dayData)] : transports;
      state.itineraryEdit.transportDraft = cloneTransports(source);
    }

    dom.itineraryEditTitle.textContent = isSingleNode ? '编辑交通节点 ' + (transportIndex + 1) : '编辑今日交通';

    var groups = state.itineraryEdit.transportDraft;
    var html = '';
    for (var i = 0; i < groups.length; i++) {
      var realIndex = isSingleNode ? transportIndex : i;
      html += renderTransportEditGroup(groups[i], realIndex, i);
    }

    dom.itineraryEditBody.innerHTML = html;
    bindTransportEditFormEvents(dayData);
  }

  function renderTransportEditGroup(transport, realIndex, draftIndex) {
    var segments = transport && transport.segments ? transport.segments : [];
    if (segments.length === 0) {
      segments = getDefaultRouteTransport(realIndex, null).segments;
    }

    var segmentsHtml = '';
    for (var i = 0; i < segments.length; i++) {
      segmentsHtml += renderTransportEditSegment(segments[i], draftIndex, i, segments.length);
    }

    return (
      '<div class="transport-edit-group" data-real-index="' + realIndex + '" data-draft-index="' + draftIndex + '">' +
        '<div class="transport-edit-group__head">' +
          '<span class="transport-edit-group__title">交通节点 ' + (realIndex + 1) + '</span>' +
          '<span class="transport-edit-group__total">¥' + getTransportTotalCost({ segments: segments }) + '</span>' +
        '</div>' +
        '<div class="transport-edit-segments">' + segmentsHtml + '</div>' +
        '<button type="button" class="transport-edit-add" data-draft-index="' + draftIndex + '">' +
          '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">' +
            '<line x1="12" y1="5" x2="12" y2="19"/>' +
            '<line x1="5" y1="12" x2="19" y2="12"/>' +
          '</svg>' +
          '添加一段交通' +
        '</button>' +
      '</div>'
    );
  }

  function renderTransportEditSegment(segment, draftIndex, segmentIndex, segmentCount) {
    var options = TRANSPORT_TYPES.map(function(type) {
      var selected = type.id === (segment.type || 'walk') ? ' selected' : '';
      return '<option value="' + escapeMapHtml(type.id) + '"' + selected + '>' + escapeMapHtml(type.name) + '</option>';
    }).join('');
    var canRemove = segmentCount > 1;

    return (
      '<div class="transport-edit-segment" data-draft-index="' + draftIndex + '" data-segment-index="' + segmentIndex + '">' +
        '<div class="transport-edit-segment__top">' +
          '<select class="form-select transport-edit-type">' + options + '</select>' +
          '<button type="button" class="transport-edit-remove" data-draft-index="' + draftIndex + '" data-segment-index="' + segmentIndex + '"' + (canRemove ? '' : ' disabled') + ' aria-label="删除交通段">' +
            '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">' +
              '<line x1="18" y1="6" x2="6" y2="18"/>' +
              '<line x1="6" y1="6" x2="18" y2="18"/>' +
            '</svg>' +
          '</button>' +
        '</div>' +
        '<div class="transport-edit-grid">' +
          '<label class="transport-edit-field">' +
            '<span>时间</span>' +
            '<input class="form-input transport-edit-duration" type="number" min="0" max="999" value="' + escapeMapHtml(segment.duration || 0) + '">' +
          '</label>' +
          '<label class="transport-edit-field">' +
            '<span>距离</span>' +
            '<input class="form-input transport-edit-distance" type="number" min="0" max="999" step="0.1" value="' + escapeMapHtml(segment.distance || 0) + '">' +
          '</label>' +
          '<label class="transport-edit-field">' +
            '<span>金额</span>' +
            '<input class="form-input transport-edit-cost" type="number" min="0" max="9999" step="1" value="' + escapeMapHtml(segment.cost || 0) + '">' +
          '</label>' +
        '</div>' +
      '</div>'
    );
  }

  function bindTransportEditFormEvents(dayData) {
    var addBtns = dom.itineraryEditBody.querySelectorAll('.transport-edit-add');
    for (var i = 0; i < addBtns.length; i++) {
      addBtns[i].addEventListener('click', function() {
        updateTransportDraftFromForm();
        var draftIndex = parseInt(this.dataset.draftIndex, 10);
        if (!state.itineraryEdit.transportDraft[draftIndex].segments) {
          state.itineraryEdit.transportDraft[draftIndex].segments = [];
        }
        state.itineraryEdit.transportDraft[draftIndex].segments.push({
          type: 'walk',
          name: '步行',
          duration: 10,
          distance: 0.8,
          cost: 0
        });
        renderTransportEditForm(dayData);
      });
    }

    var removeBtns = dom.itineraryEditBody.querySelectorAll('.transport-edit-remove');
    for (var j = 0; j < removeBtns.length; j++) {
      removeBtns[j].addEventListener('click', function() {
        if (this.disabled) return;
        updateTransportDraftFromForm();
        var draftIndex = parseInt(this.dataset.draftIndex, 10);
        var segmentIndex = parseInt(this.dataset.segmentIndex, 10);
        var segments = state.itineraryEdit.transportDraft[draftIndex].segments || [];
        if (segments.length > 1) {
          segments.splice(segmentIndex, 1);
          renderTransportEditForm(dayData);
        }
      });
    }
  }

  function updateTransportDraftFromForm() {
    if (!state.itineraryEdit.transportDraft || !dom.itineraryEditBody) return;

    var groups = dom.itineraryEditBody.querySelectorAll('.transport-edit-group');
    for (var i = 0; i < groups.length; i++) {
      var draftIndex = parseInt(groups[i].dataset.draftIndex, 10);
      var segmentRows = groups[i].querySelectorAll('.transport-edit-segment');
      var segments = [];
      for (var j = 0; j < segmentRows.length; j++) {
        segments.push(readTransportSegmentFromRow(segmentRows[j]));
      }
      state.itineraryEdit.transportDraft[draftIndex].segments = segments;
    }
  }

  function readTransportSegmentFromRow(row) {
    var typeSelect = row.querySelector('.transport-edit-type');
    var durationInput = row.querySelector('.transport-edit-duration');
    var distanceInput = row.querySelector('.transport-edit-distance');
    var costInput = row.querySelector('.transport-edit-cost');
    var typeId = typeSelect && typeSelect.value ? typeSelect.value : 'walk';
    var typeInfo = TRANSPORT_TYPES.find(function(type) { return type.id === typeId; }) || TRANSPORT_TYPES[0];
    var duration = parseInt(durationInput && durationInput.value, 10);
    var distance = parseFloat(distanceInput && distanceInput.value);
    var cost = parseFloat(costInput && costInput.value);

    if (isNaN(duration) || duration < 0) duration = 0;
    if (isNaN(distance) || distance < 0) distance = 0;
    if (isNaN(cost) || cost < 0) cost = 0;

    return {
      type: typeInfo.id,
      name: typeInfo.name,
      duration: Math.min(duration, 999),
      distance: Math.round(Math.min(distance, 999) * 10) / 10,
      cost: Math.min(cost, 9999)
    };
  }

  function renderAccommodationEditForm(dayData) {
    var accommodation = dayData.accommodation || { area: '', suggestion: '' };
    dom.itineraryEditTitle.textContent = '编辑住宿';
    dom.itineraryEditBody.innerHTML =
      '<div class="form-field">' +
        '<label class="form-label">住宿区域</label>' +
        '<input class="form-input" id="itineraryEditAccommodationArea" value="' + escapeMapHtml(accommodation.area || '') + '" maxlength="24">' +
      '</div>' +
      '<div class="form-field">' +
        '<label class="form-label">住宿建议</label>' +
        '<textarea class="form-textarea" id="itineraryEditAccommodationSuggestion" rows="4" maxlength="120">' + escapeMapHtml(accommodation.suggestion || '') + '</textarea>' +
      '</div>';
  }

  function saveItineraryEdit() {
    var dayData = getCurrentDayData();
    if (!dayData) return;

    var type = state.itineraryEdit.type;
    if (type === 'activity') {
      saveActivityEdit(dayData);
    } else if (type === 'meal') {
      saveMealEdit(dayData);
    } else if (type === 'transport') {
      saveTransportEdit(dayData);
    } else if (type === 'accommodation') {
      saveAccommodationEdit(dayData);
    }

    if (state.detail.plan) {
      state.detail.plan.updatedAt = new Date().toISOString();
      state.detail.plan.itineraryDraft = state.detail.itinerary;
    }
    renderDetailDailyItinerary();
    renderPlanList();
    closeItineraryEditModal();
    showToast('行程已更新');
  }

  function saveActivityEdit(dayData) {
    var period = state.itineraryEdit.period;
    var periodData = dayData[period];
    var activity = Array.isArray(periodData) ? periodData[state.itineraryEdit.activityIndex] : periodData;
    if (!activity) return;

    var titleInput = document.getElementById('itineraryEditActivityTitle');
    var startInput = document.getElementById('itineraryEditStartTime');
    var endInput = document.getElementById('itineraryEditEndTime');
    var descInput = document.getElementById('itineraryEditDescription');

    activity.title = cleanInputValue(titleInput, '');
    activity.startTime = cleanInputValue(startInput, activity.startTime || '');
    activity.endTime = cleanInputValue(endInput, activity.endTime || '');
    activity.description = cleanInputValue(descInput, activity.description || '');
  }

  function saveMealEdit(dayData) {
    if (!dayData.meals) dayData.meals = {};
    var mealKey = state.itineraryEdit.mealKey;
    var prop = mealKey === 'dinner' ? 'dinnerRestaurantId' : 'lunchRestaurantId';
    var restaurantSelect = document.getElementById('itineraryEditRestaurant');
    if (restaurantSelect && restaurantSelect.value) {
      dayData.meals[prop] = restaurantSelect.value;
    }
  }

  function saveTransportEdit(dayData) {
    ensureDayTransports(dayData);
    updateTransportDraftFromForm();

    var draft = state.itineraryEdit.transportDraft || [];
    var transportIndex = state.itineraryEdit.transportIndex;
    var isSingleNode = typeof transportIndex === 'number' && !isNaN(transportIndex);

    if (isSingleNode) {
      dayData.transports[transportIndex] = cloneTransports([draft[0] || getDefaultRouteTransport(transportIndex, dayData)])[0];
    } else {
      for (var i = 0; i < draft.length; i++) {
        dayData.transports[i] = cloneTransports([draft[i]])[0];
      }
    }

    syncTransportSummary(dayData);
  }

  function saveAccommodationEdit(dayData) {
    var areaInput = document.getElementById('itineraryEditAccommodationArea');
    var suggestionInput = document.getElementById('itineraryEditAccommodationSuggestion');
    dayData.accommodation = {
      area: cleanInputValue(areaInput, ''),
      suggestion: cleanInputValue(suggestionInput, '')
    };
  }

  function cleanInputValue(input, fallback) {
    if (!input) return fallback;
    var value = String(input.value || '').trim();
    return value || fallback;
  }

  function getPeriodName(period) {
    if (period === 'morning') return '上午';
    if (period === 'afternoon') return '下午';
    if (period === 'evening') return '晚上';
    return '行程';
  }

  function updateDetailTabs() {
    for (var i = 0; i < dom.detailTabBtns.length; i++) {
      var btn = dom.detailTabBtns[i];
      if (btn.dataset.tab === state.detail.currentTab) {
        btn.classList.add('tab-btn--active');
      } else {
        btn.classList.remove('tab-btn--active');
      }
    }

    for (var j = 0; j < dom.detailTabContents.length; j++) {
      var content = dom.detailTabContents[j];
      if (content.id === 'detailTab' + capitalize(state.detail.currentTab)) {
        content.classList.add('tab-content--active');
      } else {
        content.classList.remove('tab-content--active');
      }
    }
  }

  function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  function renderDetailBudget() {
    var plan = state.detail.plan;
    var people = Math.max(1, Number(plan.people) || 1);
    var totalBudget = Math.max(0, Number(plan.budgetAmount) || 0);
    var perPerson = Math.floor(totalBudget / people);
    if (dom.detailBudgetTotal) dom.detailBudgetTotal.textContent = formatMoney(totalBudget);
    if (dom.detailTotalBudget) dom.detailTotalBudget.textContent = formatMoney(perPerson);
    if (dom.detailBudgetMeta) dom.detailBudgetMeta.textContent = people + ' 人 · ' + plan.days + ' 天';

    var tickets = Math.floor(perPerson * 0.2);
    var food = Math.floor(perPerson * 0.25);
    var hotel = Math.floor(perPerson * 0.35);
    var transport = Math.floor(perPerson * 0.12);
    var other = perPerson - tickets - food - hotel - transport;

    dom.detailBudgetTickets.textContent = formatMoney(tickets);
    dom.detailBudgetFood.textContent = formatMoney(food);
    dom.detailBudgetHotel.textContent = formatMoney(hotel);
    dom.detailBudgetTransport.textContent = formatMoney(transport);
    dom.detailBudgetOther.textContent = formatMoney(other);

    var fills = document.querySelectorAll('.budget-item__fill');
    if (fills.length >= 5) {
      var budgetBase = Math.max(1, perPerson);
      fills[0].style.width = (tickets / budgetBase * 100) + '%';
      fills[1].style.width = (food / budgetBase * 100) + '%';
      fills[2].style.width = (hotel / budgetBase * 100) + '%';
      fills[3].style.width = (transport / budgetBase * 100) + '%';
      fills[4].style.width = (other / budgetBase * 100) + '%';
    }
    renderLedger();
  }

  var ledgerEditingEntryId = null;
  var ledgerSelectedColor = '#2B6CD4';

  function ensurePlanLedger() {
    var plan = state.detail.plan;
    if (!plan) return null;
    if (plan.ledgerDraft) return plan.ledgerDraft;

    var weights = { economy: 1, comfort: 1.5, luxury: 2.4 };
    var selected = weights[plan.budget] ? plan.budget : 'comfort';
    var currentAmount = Math.max(0, Number(plan.budgetAmount) || 0);
    var base = currentAmount / weights[selected];
    var options = {
      economy: Math.round(base * weights.economy / 100) * 100,
      comfort: Math.round(base * weights.comfort / 100) * 100,
      luxury: Math.round(base * weights.luxury / 100) * 100
    };
    options[selected] = currentAmount;

    plan.ledgerDraft = {
      budgetOption: selected,
      budgetOptions: options,
      budgetAmount: currentAmount,
      categories: [
        { id: 'transport', name: '交通', color: '#3F765D', custom: false },
        { id: 'food', name: '餐饮', color: '#D7781E', custom: false },
        { id: 'hotel', name: '住宿', color: '#2B6CD4', custom: false },
        { id: 'ticket', name: '门票', color: '#6957A6', custom: false },
        { id: 'shopping', name: '购物', color: '#A84D67', custom: false },
        { id: 'other', name: '其他', color: '#66768A', custom: false }
      ],
      entries: []
    };
    return plan.ledgerDraft;
  }

  function getLedgerCategory(ledger, categoryId) {
    if (!ledger) return null;
    for (var i = 0; i < ledger.categories.length; i++) {
      if (ledger.categories[i].id === categoryId) return ledger.categories[i];
    }
    return null;
  }

  function getLedgerSpentTotal(ledger) {
    if (!ledger) return 0;
    return ledger.entries.reduce(function(total, entry) {
      return total + (Number(entry.amount) || 0);
    }, 0);
  }

  function renderLedger() {
    var ledger = ensurePlanLedger();
    if (!ledger || !dom.ledgerBudgetOptions) return;

    var optionLabels = { economy: '经济', comfort: '舒适', luxury: '高端' };
    var optionIds = ['economy', 'comfort', 'luxury'];
    dom.ledgerBudgetOptions.innerHTML = optionIds.map(function(optionId) {
      var active = optionId === ledger.budgetOption ? ' ledger-budget-option--active' : '';
      return '<button class="ledger-budget-option' + active + '" data-ledger-budget="' + optionId + '" aria-pressed="' + (optionId === ledger.budgetOption ? 'true' : 'false') + '">' +
        '<span>' + optionLabels[optionId] + '</span>' +
        '<strong>' + formatMoney(ledger.budgetOptions[optionId]) + '</strong>' +
      '</button>';
    }).join('');

    var spent = getLedgerSpentTotal(ledger);
    var difference = ledger.budgetAmount - spent;
    var overBudget = difference < 0;
    dom.ledgerBudgetAmount.textContent = formatMoney(ledger.budgetAmount);
    dom.ledgerSpentAmount.textContent = formatMoney(spent);
    dom.ledgerDifferenceLabel.textContent = overBudget ? '超支' : '剩余';
    dom.ledgerDifferenceAmount.textContent = formatMoney(Math.abs(difference));
    dom.ledgerDifferenceItem.classList.toggle('ledger-compare__item--over', overBudget);
    var progress = ledger.budgetAmount > 0 ? Math.min(100, spent / ledger.budgetAmount * 100) : 0;
    dom.ledgerProgressFill.style.width = progress + '%';
    dom.ledgerProgressFill.classList.toggle('ledger-progress__fill--over', overBudget);

    dom.ledgerCategoryList.innerHTML = ledger.categories.map(function(category) {
      var total = ledger.entries.reduce(function(sum, entry) {
        return entry.categoryId === category.id ? sum + (Number(entry.amount) || 0) : sum;
      }, 0);
      return '<div class="ledger-category" style="--ledger-category-color:' + category.color + '">' +
        '<span class="ledger-category__dot"></span>' +
        '<span class="ledger-category__name">' + escapeMapHtml(category.name) + '</span>' +
        '<strong>' + formatMoney(total) + '</strong>' +
        (category.custom ? '<button data-delete-ledger-category="' + category.id + '" aria-label="删除' + escapeMapHtml(category.name) + '类目">×</button>' : '') +
      '</div>';
    }).join('');

    var entries = ledger.entries.slice().sort(function(a, b) {
      if (a.date === b.date) return String(b.id).localeCompare(String(a.id));
      return String(b.date).localeCompare(String(a.date));
    });
    dom.ledgerEntryCount.textContent = entries.length + ' 笔';
    if (!entries.length) {
      dom.ledgerEntryList.innerHTML =
        '<div class="ledger-empty">' +
          '<span class="ledger-empty__icon">¥</span>' +
          '<strong>还没有账单</strong>' +
          '<span>记录第一笔旅行支出</span>' +
        '</div>';
      return;
    }

    dom.ledgerEntryList.innerHTML = entries.map(function(entry) {
      var category = getLedgerCategory(ledger, entry.categoryId) || { name: '其他', color: '#66768A' };
      var dateText = entry.date ? entry.date.slice(5).replace('-', '/') : '';
      return '<div class="ledger-entry" data-edit-ledger-entry="' + entry.id + '">' +
        '<span class="ledger-entry__category" style="--ledger-category-color:' + category.color + '">' + escapeMapHtml(category.name.substring(0, 1)) + '</span>' +
        '<span class="ledger-entry__body">' +
          '<strong>' + escapeMapHtml(entry.note || category.name) + '</strong>' +
          '<span>' + escapeMapHtml(category.name) + ' · ' + escapeMapHtml(dateText) + '</span>' +
        '</span>' +
        '<strong class="ledger-entry__amount">-' + formatMoney(entry.amount) + '</strong>' +
        '<button class="ledger-entry__delete" data-delete-ledger-entry="' + entry.id + '" aria-label="删除账单">' +
          '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M8 6V4h8v2M19 6l-1 15H6L5 6M10 11v6M14 11v6"/></svg>' +
        '</button>' +
      '</div>';
    }).join('');
  }

  function selectLedgerBudget(optionId) {
    var ledger = ensurePlanLedger();
    if (!ledger || !ledger.budgetOptions[optionId]) return;
    ledger.budgetOption = optionId;
    ledger.budgetAmount = ledger.budgetOptions[optionId];
    state.detail.plan.budget = optionId;
    state.detail.plan.budgetAmount = ledger.budgetAmount;
    renderDetailHeader();
    renderLedger();
    renderPlanList();
  }

  function openLedgerEntryModal(entryId) {
    var ledger = ensurePlanLedger();
    if (!ledger || !dom.ledgerEntryModal) return;
    ledgerEditingEntryId = entryId || null;
    var entry = null;
    for (var i = 0; i < ledger.entries.length; i++) {
      if (ledger.entries[i].id === ledgerEditingEntryId) entry = ledger.entries[i];
    }
    var categorySelect = document.getElementById('ledgerEntryCategory');
    categorySelect.innerHTML = ledger.categories.map(function(category) {
      return '<option value="' + category.id + '">' + escapeMapHtml(category.name) + '</option>';
    }).join('');
    document.querySelector('#ledgerEntryModal .modal__title').textContent = entry ? '编辑账单' : '记一笔';
    document.getElementById('ledgerEntryAmount').value = entry ? entry.amount : '';
    document.getElementById('ledgerEntryNote').value = entry ? entry.note : '';
    document.getElementById('ledgerEntryDate').value = entry && entry.date ? entry.date : new Date().toISOString().split('T')[0];
    categorySelect.value = entry ? entry.categoryId : ledger.categories[0].id;
    dom.ledgerEntryModal.classList.add('modal--show');
  }

  function closeLedgerEntryModal() {
    if (dom.ledgerEntryModal) dom.ledgerEntryModal.classList.remove('modal--show');
    ledgerEditingEntryId = null;
  }

  function saveLedgerEntry() {
    var ledger = ensurePlanLedger();
    if (!ledger) return;
    var wasEditing = !!ledgerEditingEntryId;
    var amount = parseFloat(document.getElementById('ledgerEntryAmount').value);
    var categoryId = document.getElementById('ledgerEntryCategory').value;
    var note = String(document.getElementById('ledgerEntryNote').value || '').trim();
    var date = document.getElementById('ledgerEntryDate').value;
    if (!amount || amount <= 0) {
      showToast('请输入有效金额');
      return;
    }
    var category = getLedgerCategory(ledger, categoryId);
    if (ledgerEditingEntryId) {
      for (var i = 0; i < ledger.entries.length; i++) {
        if (ledger.entries[i].id === ledgerEditingEntryId) {
          ledger.entries[i].amount = Math.round(amount * 100) / 100;
          ledger.entries[i].categoryId = categoryId;
          ledger.entries[i].note = note || (category ? category.name : '旅行支出');
          ledger.entries[i].date = date;
        }
      }
    } else {
      ledger.entries.push({
        id: 'ledger-entry-' + Date.now(),
        amount: Math.round(amount * 100) / 100,
        categoryId: categoryId,
        note: note || (category ? category.name : '旅行支出'),
        date: date
      });
    }
    state.detail.plan.updatedAt = new Date().toISOString();
    closeLedgerEntryModal();
    renderLedger();
    showToast(wasEditing ? '账单已更新' : '账单已记录');
  }

  function deleteLedgerEntry(entryId) {
    var ledger = ensurePlanLedger();
    if (!ledger) return;
    ledger.entries = ledger.entries.filter(function(entry) { return entry.id !== entryId; });
    renderLedger();
    showToast('账单已删除');
  }

  function openLedgerCategoryModal() {
    if (!dom.ledgerCategoryModal) return;
    ledgerSelectedColor = '#2B6CD4';
    document.getElementById('ledgerCategoryName').value = '';
    var colors = document.querySelectorAll('#ledgerColorOptions .ledger-color-option');
    for (var i = 0; i < colors.length; i++) {
      colors[i].classList.toggle('ledger-color-option--selected', colors[i].dataset.color === ledgerSelectedColor);
    }
    dom.ledgerCategoryModal.classList.add('modal--show');
  }

  function closeLedgerCategoryModal() {
    if (dom.ledgerCategoryModal) dom.ledgerCategoryModal.classList.remove('modal--show');
  }

  function saveLedgerCategory() {
    var ledger = ensurePlanLedger();
    var name = String(document.getElementById('ledgerCategoryName').value || '').trim();
    if (!ledger || !name) {
      showToast('请输入类目名称');
      return;
    }
    var duplicate = ledger.categories.some(function(category) { return category.name === name; });
    if (duplicate) {
      showToast('该类目已存在');
      return;
    }
    ledger.categories.push({
      id: 'ledger-category-' + Date.now(),
      name: name,
      color: ledgerSelectedColor,
      custom: true
    });
    closeLedgerCategoryModal();
    renderLedger();
    showToast('类目已添加');
  }

  function deleteLedgerCategory(categoryId) {
    var ledger = ensurePlanLedger();
    if (!ledger) return;
    var inUse = ledger.entries.some(function(entry) { return entry.categoryId === categoryId; });
    if (inUse) {
      showToast('该类目已有账单，暂不能删除');
      return;
    }
    ledger.categories = ledger.categories.filter(function(category) {
      return category.id !== categoryId || !category.custom;
    });
    renderLedger();
    showToast('类目已删除');
  }

  function renderDetailTips() {
    var tips = getTipsByCity(state.detail.plan.cityId);
    dom.detailTipsList.innerHTML = '';
    var groups = [
      { title: '出发前', categories: ['最佳旅行时间', '穿衣建议', '必备物品'] },
      { title: '当地体验', categories: ['当地习俗'] },
      { title: '重要提醒', categories: ['注意事项'], important: true }
    ];

    for (var i = 0; i < groups.length; i++) {
      var groupTips = tips.filter(function(tip) {
        return groups[i].categories.indexOf(tip.category) !== -1;
      });
      if (!groupTips.length) continue;
      var section = document.createElement('section');
      section.className = 'tips-group' + (groups[i].important ? ' tips-group--important' : '');
      var html = '<h3 class="tips-group__title">' + groups[i].title + '</h3>';
      for (var j = 0; j < groupTips.length; j++) {
        html += '<div class="tip-item">' +
          '<div class="tip-item__category">' + escapeMapHtml(groupTips[j].category) + '</div>' +
          '<div class="tip-item__content">' + escapeMapHtml(groupTips[j].content) + '</div>' +
        '</div>';
      }
      section.innerHTML = html;
      dom.detailTipsList.appendChild(section);
    }
  }

  // ========================================
  // 行程地图（背景地图）
  // ========================================

  function renderDetailMap() {
    if (!state.detail.plan) return;

    var cityId = state.detail.plan.cityId;

    if (state.detail.currentTab !== 'itinerary') return;

    var map = ensureItineraryMap(cityId);
    if (!map) return;

    renderDayItineraryMarkers();
    setTimeout(function() {
      map.invalidateSize();
    }, 100);
  }

  function ensureItineraryMap(cityId) {
    if (!dom.detailItineraryMap || !window.L) {
      return null;
    }

    var cityConfig = MAP_CITY_COORDS[cityId];
    if (!cityConfig) return null;

    if (!mapRuntime.instance) {
      mapRuntime.instance = L.map(dom.detailItineraryMap, {
        zoomControl: true,
        attributionControl: false,
        scrollWheelZoom: false,
        doubleClickZoom: false,
        touchZoom: false,
        dragging: false
      });
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19
      }).addTo(mapRuntime.instance);
      mapRuntime.routeLayer = L.layerGroup().addTo(mapRuntime.instance);
      mapRuntime.markerLayer = L.layerGroup().addTo(mapRuntime.instance);
    }

    mapRuntime.cityId = cityId;
    state.map.zoomLevel = cityConfig.zoom || 12;
    mapRuntime.instance.setView([cityConfig.lat, cityConfig.lng], state.map.zoomLevel);
    return mapRuntime.instance;
  }

  function renderDayItineraryMarkers() {
    var map = mapRuntime.instance;
    if (!map || !mapRuntime.markerLayer || !mapRuntime.routeLayer) return;

    mapRuntime.markerLayer.clearLayers();
    mapRuntime.routeLayer.clearLayers();
    mapRuntime.markers = [];
    mapRuntime.routeLine = null;

    var dayMarkers = buildDayItineraryMarkers();
    updateItineraryMapSummary(dayMarkers);

    if (dayMarkers.length > 1) {
      var routeLatLngs = [];
      for (var rp = 0; rp < dayMarkers.length; rp++) {
        dayMarkers[rp].routeIndex = rp + 1;
        routeLatLngs.push(dayMarkers[rp].latLng);
      }
      mapRuntime.routeLine = L.polyline(routeLatLngs, {
        color: '#2563EB',
        weight: 4,
        opacity: 0.84,
        lineCap: 'round',
        lineJoin: 'round',
        dashArray: '10, 6'
      }).addTo(mapRuntime.routeLayer);
    }

    for (var i = 0; i < dayMarkers.length; i++) {
      var marker = dayMarkers[i];
      marker.leafletMarker = L.marker(marker.latLng, {
        icon: createMapMarkerIcon(marker)
      }).on('click', (function(markerData) {
        return function() {
          openPoiBottomSheet(markerData);
        };
      })(marker));
      marker.leafletMarker.addTo(mapRuntime.markerLayer);
      mapRuntime.markers.push(marker);
    }

    if (dayMarkers.length > 0) {
      var group = new L.featureGroup(dayMarkers.map(function(m) { return m.leafletMarker; }));
      map.fitBounds(group.getBounds().pad(0.24), {
        maxZoom: 14
      });
    }
  }

  function updateItineraryMapSummary(markers) {
    if (dom.itineraryMapTitle) {
      dom.itineraryMapTitle.textContent = 'Day ' + state.detail.currentDay + ' 行程地图';
    }
    if (dom.itineraryMapCount) {
      dom.itineraryMapCount.textContent = markers.length + ' 个地点';
    }
  }

  function buildDayItineraryMarkers() {
    var markers = [];
    var itinerary = state.detail.itinerary;
    if (!itinerary) return markers;

    var dayData = null;
    for (var i = 0; i < itinerary.dailyItineraries.length; i++) {
      if (itinerary.dailyItineraries[i].day === state.detail.currentDay) {
        dayData = itinerary.dailyItineraries[i];
        break;
      }
    }
    if (!dayData) return markers;

    appendActivityMarker(markers, dayData.morning);
    appendRestaurantMarker(markers, dayData.meals && dayData.meals.lunchRestaurantId);
    appendActivityMarker(markers, dayData.afternoon);
    appendRestaurantMarker(markers, dayData.meals && dayData.meals.dinnerRestaurantId);
    appendActivityMarker(markers, dayData.evening);

    return markers;
  }

  function appendActivityMarker(markers, activity) {
    if (!activity || activity.activity !== 'attraction' || !activity.attractionId) return;

    var attraction = getAttractionById(activity.attractionId);
    if (!attraction || hasMarker(markers, attraction.id)) return;

    var latLng = getMapLatLng(attraction);
    if (!latLng) return;

    markers.push({
      id: attraction.id,
      name: activity.title || attraction.name,
      latLng: latLng,
      category: 'attraction',
      icon: '景',
      color: '#2563EB',
      data: attraction
    });
  }

  function appendRestaurantMarker(markers, restaurantId) {
    if (!restaurantId) return;

    var restaurant = getRestaurantById(restaurantId);
    if (!restaurant || hasMarker(markers, restaurant.id)) return;

    var latLng = getMapLatLng(restaurant);
    if (!latLng) return;

    markers.push({
      id: restaurant.id,
      name: restaurant.name,
      latLng: latLng,
      category: 'restaurant',
      icon: '食',
      color: '#F97316',
      data: restaurant
    });
  }

  function hasMarker(markers, id) {
    for (var i = 0; i < markers.length; i++) {
      if (markers[i].id === id) return true;
    }
    return false;
  }

  // ========================================
  // 交通节点
  // ========================================

  var TRANSPORT_TYPES = [
    { id: 'walk', name: '步行', icon: 'walk', duration: 15, distance: 1, cost: 0 },
    { id: 'subway', name: '地铁', icon: 'subway', duration: 20, distance: 3.5, cost: 4 },
    { id: 'bus', name: '公交', icon: 'bus', duration: 25, distance: 4, cost: 2 },
    { id: 'taxi', name: '打车', icon: 'taxi', duration: 12, distance: 3.5, cost: 25 },
    { id: 'bike', name: '骑行', icon: 'bike', duration: 10, distance: 2, cost: 2 },
    { id: 'drive', name: '自驾', icon: 'car', duration: 10, distance: 3.5, cost: 15 }
  ];

  function getTransportIconSvg(type) {
    var icons = {
      walk: '<path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>',
      subway: '<rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="8" y2="17"/><line x1="16" y1="21" x2="16" y2="17"/><line x1="2" y1="9" x2="22" y2="9"/>',
      bus: '<path d="M18 8h1a4 4 0 010 8h-1M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/>',
      taxi: '<path d="M5 17h14l-1.5-6.5a2 2 0 00-2-1.5h-7a2 2 0 00-2 1.5L5 17z"/><path d="M7 17V9"/><path d="M17 17V9"/><circle cx="7" cy="19" r="2"/><circle cx="17" cy="19" r="2"/>',
      bike: '<circle cx="5.5" cy="17.5" r="3.5"/><circle cx="18.5" cy="17.5" r="3.5"/><path d="M15 6a1 1 0 100-2 1 1 0 000 2z"/><path d="M12 17.5V14l-3-3 4-3 2 3h3"/>',
      car: '<path d="M5 17h14l-1.5-6.5a2 2 0 00-2-1.5h-7a2 2 0 00-2 1.5L5 17z"/><path d="M7 17V9"/><path d="M17 17V9"/><circle cx="7" cy="19" r="2"/><circle cx="17" cy="19" r="2"/>'
    };
    return icons[type] || icons.walk;
  }

  function getDefaultRouteTransport(index, dayData) {
    var defaultSegments = [
      [
        { type: 'subway', name: '地铁', duration: 20, distance: 3.5, cost: 4 }
      ],
      [
        { type: 'walk', name: '步行', duration: 15, distance: 1, cost: 0 }
      ]
    ];
    var segIndex = index % defaultSegments.length;
    return {
      segments: JSON.parse(JSON.stringify(defaultSegments[segIndex]))
    };
  }

  function ensureDayTransports(dayData) {
    if (!dayData) return [];

    if (!dayData.transports || !dayData.transports.length) {
      var summaryCost = dayData.transport && typeof dayData.transport.cost === 'number'
        ? dayData.transport.cost
        : null;
      var summaryText = dayData.transport && dayData.transport.description
        ? dayData.transport.description
        : '';
      dayData.transports = [
        getDefaultRouteTransport(0, dayData),
        getDefaultRouteTransport(1, dayData)
      ];
      if (summaryCost !== null || summaryText) {
        dayData.transports[0].segments[0].cost = summaryCost !== null ? summaryCost : dayData.transports[0].segments[0].cost;
      }
    }

    for (var i = 0; i < dayData.transports.length; i++) {
      if (!dayData.transports[i]) {
        dayData.transports[i] = getDefaultRouteTransport(i, dayData);
      }
      if (!dayData.transports[i].segments || dayData.transports[i].segments.length === 0) {
        dayData.transports[i].segments = getDefaultRouteTransport(i, dayData).segments;
      }
    }

    while (dayData.transports.length < 2) {
      dayData.transports.push(getDefaultRouteTransport(dayData.transports.length, dayData));
    }

    return dayData.transports;
  }

  function cloneTransports(transports) {
    return JSON.parse(JSON.stringify(transports || []));
  }

  function getTransportSegmentName(segment) {
    if (!segment) return '步行';
    if (segment.customName) return segment.customName;
    if (segment.name) return segment.name;
    var typeInfo = TRANSPORT_TYPES.find(function(t) { return t.id === segment.type; });
    return typeInfo ? typeInfo.name : '步行';
  }

  function getTransportTotalCost(transport) {
    if (!transport || !transport.segments) return 0;
    var total = 0;
    for (var i = 0; i < transport.segments.length; i++) {
      total += Number(transport.segments[i].cost) || 0;
    }
    return total;
  }

  function getTransportTotalDuration(transport) {
    if (!transport || !transport.segments) return 0;
    var total = 0;
    for (var i = 0; i < transport.segments.length; i++) {
      total += transport.segments[i].duration || 0;
    }
    return total;
  }

  function getTransportTotalDistance(transport) {
    if (!transport || !transport.segments) return 0;
    var total = 0;
    for (var i = 0; i < transport.segments.length; i++) {
      total += transport.segments[i].distance || 0;
    }
    return Math.round(total * 10) / 10;
  }

  function getTransportSummaryName(transport) {
    if (!transport || !transport.segments || transport.segments.length === 0) return '步行';
    if (transport.segments.length === 1) {
      return getTransportSegmentName(transport.segments[0]);
    }
    var names = [];
    for (var i = 0; i < transport.segments.length; i++) {
      names.push(getTransportSegmentName(transport.segments[i]));
    }
    return names.join(' → ');
  }

  function getDayTransportTotalCost(dayData) {
    if (!dayData) return 0;
    var transports = ensureDayTransports(dayData);
    var total = 0;
    for (var i = 0; i < transports.length; i++) {
      total += getTransportTotalCost(transports[i]);
    }
    return total;
  }

  function getDayTransportSummaryText(dayData) {
    if (!dayData) return '';
    var transports = ensureDayTransports(dayData);
    var names = [];
    for (var i = 0; i < transports.length; i++) {
      names.push(getTransportSummaryName(transports[i]));
    }
    return names.join(' / ');
  }

  function syncTransportSummary(dayData) {
    if (!dayData) return;
    dayData.transport = {
      description: getDayTransportSummaryText(dayData),
      cost: getDayTransportTotalCost(dayData)
    };
  }

  function renderTransportNodes() {
    var dayData = getCurrentDayData();
    if (!dayData) return;

    var transports = ensureDayTransports(dayData);
    syncTransportSummary(dayData);

    var node1 = document.getElementById('transportNode1');
    var node2 = document.getElementById('transportNode2');

    if (node1) {
      updateTransportNode(node1, transports[0], 0);
    }
    if (node2) {
      updateTransportNode(node2, transports[1], 1);
    }
  }

  function updateTransportNode(nodeEl, transport, index) {
    var segments = transport.segments || [];

    if (segments.length <= 1) {
      var singleSeg = segments[0] || { type: 'walk', name: '步行', duration: 15, distance: 1, cost: 0 };
      var typeInfo = TRANSPORT_TYPES.find(function(t) { return t.id === singleSeg.type; });
      if (!typeInfo) typeInfo = TRANSPORT_TYPES[0];

      var singleHtml =
        '<div class="transport-node__icon">' +
          '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
            getTransportIconSvg(singleSeg.type) +
          '</svg>' +
        '</div>' +
        '<div class="transport-node__info">' +
          '<span class="transport-node__name">' + escapeMapHtml(getTransportSegmentName(singleSeg)) + '</span>' +
          '<span class="transport-node__meta">' + singleSeg.duration + '分钟 · ' + singleSeg.distance + '公里</span>' +
        '</div>' +
        '<span class="transport-node__cost" data-cost-index="' + index + '" data-segment-index="0">' +
          (singleSeg.cost > 0 ? '¥' + singleSeg.cost : '免费') +
        '</span>' +
        '<button class="transport-node__edit" aria-label="编辑交通">' +
          '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">' +
            '<path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>' +
            '<path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>' +
          '</svg>' +
        '</button>';

      nodeEl.querySelector('.transport-node__card').innerHTML = singleHtml;
    } else {
      var totalDuration = getTransportTotalDuration(transport);
      var totalDistance = getTransportTotalDistance(transport);
      var totalCost = getTransportTotalCost(transport);

      var segmentsHtml = '';
      for (var i = 0; i < segments.length; i++) {
        var seg = segments[i];
        segmentsHtml +=
          '<div class="transport-segment">' +
            '<div class="transport-segment__icon">' +
              '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
                getTransportIconSvg(seg.type) +
              '</svg>' +
            '</div>' +
            '<div class="transport-segment__info">' +
              '<span class="transport-segment__name">' + escapeMapHtml(getTransportSegmentName(seg)) + '</span>' +
              '<span class="transport-segment__meta">' + seg.duration + '分钟 · ' + seg.distance + '公里</span>' +
            '</div>' +
            '<span class="transport-node__cost" style="font-size:13px;" data-cost-index="' + index + '" data-segment-index="' + i + '">' +
              (seg.cost > 0 ? '¥' + seg.cost : '免费') +
            '</span>' +
          '</div>';
        if (i < segments.length - 1) {
          segmentsHtml +=
            '<div class="transport-segment__arrow">' +
              '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">' +
                '<polyline points="6 9 12 15 18 9"/>' +
              '</svg>' +
            '</div>';
        }
      }

      var multiHtml =
        '<div class="transport-node__segments">' +
          segmentsHtml +
          '<div class="transport-node__add-segment" data-add-segment="' + index + '">' +
            '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">' +
              '<line x1="12" y1="5" x2="12" y2="19"/>' +
              '<line x1="5" y1="12" x2="19" y2="12"/>' +
            '</svg>' +
            '添加一段' +
          '</div>' +
        '</div>' +
        '<div style="display:flex;flex-direction:column;align-items:flex-end;gap:6px;">' +
          '<span class="transport-node__cost" style="font-size:14px;" data-cost-total="' + index + '">' +
            '合计 ¥' + totalCost +
          '</span>' +
          '<button class="transport-node__edit" aria-label="编辑交通">' +
            '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">' +
              '<path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>' +
              '<path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>' +
            '</svg>' +
          '</button>' +
        '</div>';

      nodeEl.querySelector('.transport-node__card').innerHTML = multiHtml;
    }

    var editBtn = nodeEl.querySelector('.transport-node__edit');
    if (editBtn) {
      editBtn.onclick = function(e) {
        e.stopPropagation();
        openTransportSegmentEdit(index);
      };
    }

    var costEls = nodeEl.querySelectorAll('.transport-node__cost[data-segment-index]');
    for (var ci = 0; ci < costEls.length; ci++) {
      costEls[ci].onclick = function(e) {
        e.stopPropagation();
        var tIdx = parseInt(this.dataset.costIndex);
        var sIdx = parseInt(this.dataset.segmentIndex);
        openCostEditModal(tIdx, sIdx);
      };
    }

    var addBtn = nodeEl.querySelector('.transport-node__add-segment');
    if (addBtn) {
      addBtn.onclick = function(e) {
        e.stopPropagation();
        var tIdx = parseInt(this.dataset.addSegment);
        addTransportSegment(tIdx);
      };
    }
  }

  function addTransportSegment(transportIndex) {
    var dayData = getCurrentDayData();
    if (!dayData || !dayData.transports) return;

    var transport = dayData.transports[transportIndex];
    if (!transport.segments) transport.segments = [];

    transport.segments.push({
      type: 'walk',
      name: '步行',
      duration: 10,
      distance: 0.8,
      cost: 0
    });

    renderTransportNodes();
    updateTotalTransportCost();
    showToast('已添加交通段');
  }

  // ========================================
  // 金额编辑弹窗
  // ========================================

  function openCostEditModal(transportIndex, segmentIndex) {
    var modal = document.getElementById('costEditModal');
    if (!modal) return;

    state.detail.editingCostTransportIndex = transportIndex;
    state.detail.editingCostSegmentIndex = segmentIndex;

    var dayData = getCurrentDayData();
    if (!dayData || !dayData.transports) return;

    var transport = dayData.transports[transportIndex];
    if (!transport || !transport.segments) return;

    var segment = transport.segments[segmentIndex];
    if (!segment) return;

    var input = document.getElementById('costEditInput');
    if (input) {
      input.value = segment.cost || 0;
      setTimeout(function() { input.focus(); }, 100);
    }

    modal.classList.add('cost-edit-modal--open');
  }

  function closeCostEditModal() {
    var modal = document.getElementById('costEditModal');
    if (modal) {
      modal.classList.remove('cost-edit-modal--open');
    }
  }

  function confirmCostEdit() {
    var input = document.getElementById('costEditInput');
    if (!input) {
      closeCostEditModal();
      return;
    }

    var cost = parseFloat(input.value) || 0;
    if (cost < 0) cost = 0;

    var transportIndex = state.detail.editingCostTransportIndex;
    var segmentIndex = state.detail.editingCostSegmentIndex;

    var dayData = getCurrentDayData();
    if (!dayData || !dayData.transports) {
      closeCostEditModal();
      return;
    }

    var transport = dayData.transports[transportIndex];
    if (!transport || !transport.segments || !transport.segments[segmentIndex]) {
      closeCostEditModal();
      return;
    }

    transport.segments[segmentIndex].cost = cost;

    syncTransportSummary(dayData);
    renderTransportNodes();
    renderUnifiedTimeline();
    updateTotalTransportCost();
    closeCostEditModal();
    showToast('费用已更新');
  }

  // ========================================
  // 统一时间轴渲染
  // ========================================

  function getAttractionById(attractionId) {
    if (!attractionId) return null;
    var attractions = state.detail.attractions || MOCK_ATTRACTIONS;
    for (var i = 0; i < attractions.length; i++) {
      if (attractions[i].id === attractionId) {
        return attractions[i];
      }
    }
    return null;
  }

  function getRestaurantById(restaurantId) {
    if (!restaurantId) return null;
    var restaurants = state.detail.recommendations && state.detail.recommendations.restaurants ?
      state.detail.recommendations.restaurants : MOCK_RESTAURANTS;
    for (var i = 0; i < restaurants.length; i++) {
      if (restaurants[i].id === restaurantId) {
        return restaurants[i];
      }
    }
    return null;
  }

  function renderUnifiedTimeline() {
    var dayData = getCurrentDayData();
    if (!dayData) return;

    var timelineEl = document.getElementById('unifiedTimeline');
    if (!timelineEl) return;

    var html = '';
    var itemIndex = 0;

    var morning = normalizeTimelineActivities(dayData.morning);
    var afternoon = normalizeTimelineActivities(dayData.afternoon);
    var evening = normalizeTimelineActivities(dayData.evening);
    var lunch = getMealRestaurant(dayData.meals || {}, 'lunch');
    var dinner = getMealRestaurant(dayData.meals || {}, 'dinner');

    html += buildPeriodDivider('morning', '上午', getActivityStartTime(morning, '09:00'));
    for (var i = 0; i < morning.length; i++) {
      html += buildAttractionItem(morning[i], itemIndex++, 'morning', i);
    }
    html += buildTransportItem(dayData, 0, itemIndex++);

    if (lunch) {
      html += buildPeriodDivider('lunch', '午餐', '12:00');
      html += buildRestaurantItem(lunch, itemIndex++, 'lunch', '12:00');
    }

    html += buildPeriodDivider('afternoon', '下午', getActivityStartTime(afternoon, '13:30'));
    for (var j = 0; j < afternoon.length; j++) {
      html += buildAttractionItem(afternoon[j], itemIndex++, 'afternoon', j);
    }
    html += buildTransportItem(dayData, 1, itemIndex++);

    html += buildPeriodDivider('evening', '晚上', getActivityStartTime(evening, '18:30'));
    for (var k = 0; k < evening.length; k++) {
      html += buildAttractionItem(evening[k], itemIndex++, 'evening', k);
    }

    if (dinner) {
      html += buildPeriodDivider('dinner', '晚餐', '19:30');
      html += buildRestaurantItem(dinner, itemIndex++, 'dinner', '19:30');
    }

    html += '<div class="timeline-item timeline-item--accommodation" data-item-type="accommodation">' +
      '<div class="timeline-item__dot timeline-item__dot--accommodation">' +
        '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">' +
          '<path d="M3 21V9l9-6 9 6v12"/>' +
          '<path d="M9 21v-6h6v6"/>' +
        '</svg>' +
      '</div>' +
      '<div class="timeline-item__content">' +
        '<div class="timeline-item__time-label">住宿</div>' +
        '<div id="detailAccommodationCard" class="timeline-item__card timeline-item__card--accommodation accommodation-card--inline">' +
          '<div class="accommodation-card__icon">' +
            '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' +
              '<path d="M3 21V9l9-6 9 6v12"/>' +
              '<path d="M9 21v-6h6v6"/>' +
            '</svg>' +
          '</div>' +
          '<div class="accommodation-card__content">' +
            '<div class="accommodation-card__area">推荐住宿区域</div>' +
            '<div class="accommodation-card__desc"></div>' +
          '</div>' +
          '<button class="accommodation-card__more itinerary-edit-btn" data-edit-type="accommodation" aria-label="编辑住宿">' +
            '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">' +
              '<path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>' +
              '<path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>' +
            '</svg>' +
          '</button>' +
        '</div>' +
      '</div>' +
    '</div>';

    timelineEl.innerHTML = html;

    dom.detailAccommodationCard = document.getElementById('detailAccommodationCard');

    bindTimelineItemEvents();
    updateMapRevealInfo(dayData);
  }

  function normalizeTimelineActivities(value) {
    if (!value) return [];
    return Array.isArray(value) ? value.filter(Boolean) : [value];
  }

  function getActivityStartTime(activities, fallback) {
    return activities.length && activities[0].startTime ? activities[0].startTime : fallback;
  }

  function buildPeriodDivider(period, label, time) {
    var iconSvg = '';
    if (period === 'morning') {
      iconSvg = '<circle cx="12" cy="12" r="5" fill="#FCD34D"/><path d="M12 2v2M12 20v2" stroke="#F59E0B" stroke-width="1.5" stroke-linecap="round"/>';
    } else if (period === 'afternoon') {
      iconSvg = '<circle cx="12" cy="12" r="5" fill="#60A5FA"/><path d="M12 2v2M12 20v2" stroke="#3B82F6" stroke-width="1.5" stroke-linecap="round"/>';
    } else if (period === 'evening') {
      iconSvg = '<path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" fill="#A78BFA"/>';
    } else if (period === 'dinner' || period === 'lunch') {
      iconSvg = '<path d="M18 8h1a4 4 0 010 8h-1M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8z" fill="#F472B6"/>';
    } else {
      iconSvg = '<circle cx="12" cy="12" r="4" fill="#94A3B8"/>';
    }

    return (
      '<div class="timeline-period-divider">' +
        '<div class="timeline-period-divider__dot">' +
          '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">' + iconSvg + '</svg>' +
        '</div>' +
        '<span class="timeline-period-divider__label">' + label + '</span>' +
        '<span class="timeline-period-divider__time">' + time + '</span>' +
      '</div>'
    );
  }

  function buildAttractionItem(activityData, index, period, periodIndex) {
    var activity = typeof activityData === 'object' ? activityData : { attractionId: activityData, activity: 'attraction' };
    var attraction = getAttractionById(activity.attractionId) || {};
    var timeStr = activity.startTime || getPeriodTime(period, periodIndex);
    var activityType = activity.activity || 'attraction';
    var name = activity.title || attraction.name || activity.attractionName ||
      (activityType === 'leisure' ? '自由活动' : activityType === 'shopping' ? '购物时间' : activityType === 'departure' ? '行程结束' : '行程安排');
    var desc = activity.description || attraction.description || attraction.tagline || '';
    var rating = activity.rating || attraction.rating || '4.7';
    var duration = activity.duration || attraction.duration || '2小时';
    var cost = 0;
    var ticketPrice = typeof activity.ticketPrice !== 'undefined' ? activity.ticketPrice : attraction.ticketPrice;
    if (ticketPrice) {
      cost = ticketPrice.adult || ticketPrice || 0;
    }
    var badge = activityType === 'attraction' ? '景点' : activityType === 'shopping' ? '购物' : activityType === 'departure' ? '返程' : '安排';

    return (
      '<div class="timeline-item" data-item-index="' + index + '" data-item-type="activity" data-period="' + period + '" data-activity-index="' + periodIndex + '">' +
        '<div class="timeline-item__dot timeline-item__dot--attraction">' +
          '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">' +
            '<path d="M1 6v16l7-4 8 4 7-4V2l-7 4-8-4-7 4z"/>' +
            '<path d="M8 2v16M16 6v16"/>' +
          '</svg>' +
        '</div>' +
        '<div class="timeline-item__content">' +
          '<div class="timeline-item__time-label"><strong>' + timeStr + '</strong></div>' +
          '<div class="timeline-item__card timeline-item__card--attraction">' +
            '<div class="timeline-item__card-header">' +
              '<span class="timeline-item__title">' + escapeMapHtml(name) + '</span>' +
              '<span class="timeline-item__badge">' + badge + '</span>' +
            '</div>' +
            (desc ? '<div class="timeline-item__desc">' + escapeMapHtml(desc) + '</div>' : '') +
            '<div class="timeline-item__meta">' +
              '<span class="timeline-item__meta-item timeline-item__rating">' +
                '<svg width="14" height="14" viewBox="0 0 24 24" fill="#FCD34D" stroke="#F59E0B" stroke-width="1.5" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>' +
                rating +
              '</span>' +
              '<span class="timeline-item__meta-item">' +
                '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
                  '<circle cx="12" cy="12" r="10"/>' +
                  '<polyline points="12 6 12 12 16 14"/>' +
                '</svg>' +
                duration +
              '</span>' +
              '<span class="timeline-item__meta-item timeline-item__cost">' +
                (cost > 0 ? '¥' + cost + '起' : '免费') +
              '</span>' +
            '</div>' +
            '<button class="timeline-item__more-btn itinerary-edit-btn" data-edit-type="activity" data-period="' + period + '" data-activity-index="' + periodIndex + '" aria-label="编辑' + escapeMapHtml(name) + '">' +
              '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">' +
                '<circle cx="12" cy="5" r="2"/>' +
                '<circle cx="12" cy="12" r="2"/>' +
                '<circle cx="12" cy="19" r="2"/>' +
              '</svg>' +
            '</button>' +
          '</div>' +
        '</div>' +
      '</div>'
    );
  }

  function buildRestaurantItem(restaurantData, index, mealKey, timeLabel) {
    var restaurant = typeof restaurantData === 'object' ? restaurantData : getRestaurantById(restaurantData);
    if (!restaurant) return '';

    var name = restaurant.name || '餐厅';
    var desc = restaurant.cuisine || restaurant.description || '';
    var rating = restaurant.rating || '4.5';
    var cost = restaurant.priceRange || restaurant.priceLevel || restaurant.avgCost || 80;
    var costStr = typeof cost === 'number' ? '¥' + cost + '/人' : cost;

    return (
      '<div class="timeline-item" data-item-index="' + index + '" data-item-type="meal" data-meal-key="' + mealKey + '">' +
        '<div class="timeline-item__dot timeline-item__dot--restaurant">' +
          '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">' +
            '<path d="M18 8h1a4 4 0 010 8h-1M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8z"/>' +
            '<line x1="6" y1="1" x2="6" y2="4"/>' +
            '<line x1="10" y1="1" x2="10" y2="4"/>' +
            '<line x1="14" y1="1" x2="14" y2="4"/>' +
          '</svg>' +
        '</div>' +
        '<div class="timeline-item__content">' +
          '<div class="timeline-item__time-label"><strong>' + timeLabel + '</strong> · ' + (mealKey === 'dinner' ? '晚餐' : '午餐') + '推荐</div>' +
          '<div class="timeline-item__card timeline-item__card--restaurant">' +
            '<div class="timeline-item__card-header">' +
              '<span class="timeline-item__title">' + escapeMapHtml(name) + '</span>' +
              '<span class="timeline-item__badge timeline-item__badge--restaurant">美食</span>' +
            '</div>' +
            (desc ? '<div class="timeline-item__desc">' + escapeMapHtml(desc) + '</div>' : '') +
            '<div class="timeline-item__meta">' +
              '<span class="timeline-item__meta-item timeline-item__rating">' +
                '<svg width="14" height="14" viewBox="0 0 24 24" fill="#FCD34D" stroke="#F59E0B" stroke-width="1.5" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>' +
                rating +
              '</span>' +
              '<span class="timeline-item__meta-item timeline-item__cost">' + costStr + '</span>' +
            '</div>' +
            '<button class="timeline-item__more-btn itinerary-edit-btn" data-edit-type="meal" data-meal-key="' + mealKey + '" aria-label="编辑' + (mealKey === 'dinner' ? '晚餐' : '午餐') + '">' +
              '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">' +
                '<circle cx="12" cy="5" r="2"/>' +
                '<circle cx="12" cy="12" r="2"/>' +
                '<circle cx="12" cy="19" r="2"/>' +
              '</svg>' +
            '</button>' +
          '</div>' +
        '</div>' +
      '</div>'
    );
  }

  function buildTransportItem(dayData, transportIndex, itemIndex) {
    var transports = ensureDayTransports(dayData);
    var transport = transports[transportIndex];
    if (!transport) return '';

    var segments = transport.segments || [];
    if (segments.length === 0) return '';

    if (segments.length === 1) {
      var seg = segments[0];
      var segName = getTransportSegmentName(seg);
      var transportTotalCost = getTransportTotalCost(transport);

      return (
        '<div class="timeline-item" data-item-index="' + itemIndex + '" data-item-type="transport" data-transport-index="' + transportIndex + '">' +
          '<div class="timeline-item__dot timeline-item__dot--transport">' +
            '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">' +
              getTransportIconSvg(seg.type) +
            '</svg>' +
          '</div>' +
          '<div class="timeline-item__content">' +
            '<div class="timeline-item__time-label">交通 · 约' + seg.duration + '分钟</div>' +
            '<div class="timeline-item__card timeline-item__card--transport">' +
              '<div class="timeline-transport">' +
                '<div class="timeline-transport__icon">' +
                  '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
                    getTransportIconSvg(seg.type) +
                  '</svg>' +
                '</div>' +
                '<div class="timeline-transport__info">' +
                  '<span class="timeline-transport__name">' + escapeMapHtml(segName) + '</span>' +
                  '<span class="timeline-transport__meta">' + seg.duration + '分钟 · ' + seg.distance + '公里</span>' +
                '</div>' +
                '<span class="timeline-transport__cost" data-cost-t-index="' + transportIndex + '" data-cost-s-index="0">' +
                  (transportTotalCost > 0 ? '¥' + transportTotalCost : '免费') +
                '</span>' +
                '<button class="timeline-transport__edit" data-edit-transport="' + transportIndex + '" aria-label="编辑交通">' +
                  '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">' +
                    '<path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>' +
                    '<path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>' +
                  '</svg>' +
                '</button>' +
              '</div>' +
            '</div>' +
          '</div>' +
        '</div>'
      );
    } else {
      var totalDur = getTransportTotalDuration(transport);
      var totalDis = getTransportTotalDistance(transport);
      var totalCost = getTransportTotalCost(transport);
      var summaryName = getTransportSummaryName(transport);

      var segmentsHtml = '';
      for (var s = 0; s < segments.length; s++) {
        var sg = segments[s];
        var sgName = getTransportSegmentName(sg);
        segmentsHtml +=
          '<div class="timeline-transport timeline-transport--segment">' +
            '<div class="timeline-transport__icon">' +
              '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
                getTransportIconSvg(sg.type) +
              '</svg>' +
            '</div>' +
            '<div class="timeline-transport__info">' +
              '<span class="timeline-transport__name">' + escapeMapHtml(sgName) + '</span>' +
              '<span class="timeline-transport__meta">' + sg.duration + '分钟</span>' +
            '</div>' +
            '<span class="timeline-transport__cost" data-cost-t-index="' + transportIndex + '" data-cost-s-index="' + s + '">' +
              (sg.cost > 0 ? '¥' + sg.cost : '免费') +
            '</span>' +
          '</div>';
        if (s < segments.length - 1) {
          segmentsHtml +=
            '<div class="timeline-transport__arrow">' +
              '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">' +
                '<polyline points="6 9 12 15 18 9"/>' +
              '</svg>' +
            '</div>';
        }
      }

      return (
        '<div class="timeline-item" data-item-index="' + itemIndex + '" data-item-type="transport" data-transport-index="' + transportIndex + '">' +
          '<div class="timeline-item__dot timeline-item__dot--transport">' +
            '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">' +
              '<rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>' +
              '<line x1="8" y1="21" x2="8" y2="17"/>' +
              '<line x1="16" y1="21" x2="16" y2="17"/>' +
              '<line x1="2" y1="9" x2="22" y2="9"/>' +
            '</svg>' +
          '</div>' +
          '<div class="timeline-item__content">' +
            '<div class="timeline-item__time-label">交通 · 约' + totalDur + '分钟 · 合计 ¥' + totalCost + '</div>' +
            '<div class="timeline-item__card timeline-item__card--transport">' +
              '<div class="timeline-transport__segments">' +
                segmentsHtml +
              '</div>' +
              '<div class="timeline-transport__actions">' +
                '<button class="timeline-transport__edit" data-edit-transport="' + transportIndex + '" aria-label="编辑交通">' +
                  '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">' +
                    '<path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>' +
                    '<path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>' +
                  '</svg>' +
                '</button>' +
              '</div>' +
            '</div>' +
          '</div>' +
        '</div>'
      );
    }
  }

  function getPeriodTime(period, index) {
    var times = {
      morning: ['09:00', '10:30', '11:30'],
      afternoon: ['13:30', '15:00', '16:30'],
      evening: ['18:30', '19:30', '20:30']
    };
    var periodTimes = times[period] || ['09:00'];
    return periodTimes[index % periodTimes.length];
  }

  function bindTimelineItemEvents() {
    var costEls = document.querySelectorAll('[data-cost-t-index]');
    for (var i = 0; i < costEls.length; i++) {
      costEls[i].addEventListener('click', function(e) {
        e.stopPropagation();
        var tIdx = parseInt(this.dataset.costTIndex);
        var sIdx = parseInt(this.dataset.costSIndex);
        openCostEditModal(tIdx, sIdx);
      });
    }

    var editBtns = document.querySelectorAll('[data-edit-transport]');
    for (var j = 0; j < editBtns.length; j++) {
      editBtns[j].addEventListener('click', function(e) {
        e.stopPropagation();
        var idx = parseInt(this.dataset.editTransport);
        openTransportSegmentEdit(idx);
      });
    }

    var cards = document.querySelectorAll('.timeline-item__card--attraction, .timeline-item__card--restaurant');
    for (var k = 0; k < cards.length; k++) {
      cards[k].addEventListener('click', function(e) {
        if (e.target.closest('button')) return;
        var item = this.closest('.timeline-item');
        if (!item) return;
        var editButton = this.querySelector('.itinerary-edit-btn');
        if (editButton) openItineraryEditFromButton(editButton);
      });
    }
  }

  // ========================================
  // 底部背景地图揭幕
  // ========================================

  var stateMapReveal = {
    active: false,
    fitted: false
  };

  function initMapReveal() {
    if (!dom.itineraryMapReveal || !dom.pagePlanDetail) return;
    applyPlanDetailSheetOffset(statePlanDetailSheet.offset, false);
    setMapRevealInteraction(statePlanDetailSheet.dismissed);
  }

  function updateMapRevealInfo(dayData) {
    var reveal = document.getElementById('itineraryMapReveal');
    if (reveal) {
      var markerCount = getMapPointCountForDay(dayData);
      reveal.setAttribute('aria-label', 'Day ' + state.detail.currentDay + ' 行程地图，' + markerCount + ' 个地点');
    }
  }

  function setMapRevealInteraction(active) {
    var reveal = document.getElementById('itineraryMapReveal');
    if (!reveal || stateMapReveal.active === active) return;

    stateMapReveal.active = active;
    reveal.classList.toggle('itinerary-map-reveal--active', active);

    var map = mapRuntime.instance;
    if (!map) return;
    var handlers = [map.dragging, map.touchZoom, map.doubleClickZoom, map.scrollWheelZoom];
    for (var i = 0; i < handlers.length; i++) {
      if (!handlers[i]) continue;
      if (active) handlers[i].enable();
      else handlers[i].disable();
    }

    if (active && !stateMapReveal.fitted) {
      stateMapReveal.fitted = true;
      setTimeout(function() {
        map.invalidateSize();
        renderDayItineraryMarkers();
      }, 120);
    }
  }

  function resetMapRevealState() {
    stateMapReveal.active = false;
    stateMapReveal.fitted = false;
    var reveal = document.getElementById('itineraryMapReveal');
    if (reveal) {
      reveal.classList.remove('itinerary-map-reveal--visible', 'itinerary-map-reveal--active');
      reveal.style.setProperty('--map-reveal-progress', '0');
    }
    var map = mapRuntime.instance;
    if (map) {
      if (map.dragging) map.dragging.disable();
      if (map.touchZoom) map.touchZoom.disable();
      if (map.doubleClickZoom) map.doubleClickZoom.disable();
      if (map.scrollWheelZoom) map.scrollWheelZoom.disable();
    }
  }

  function openTransportModal(index, currentTransport) {
    var modal = document.getElementById('transportModal');
    if (!modal) return;

    state.detail.editingTransportIndex = index;

    var optionsEl = modal.querySelector('.transport-modal__options');
    if (optionsEl) {
      var html = '';
      for (var i = 0; i < TRANSPORT_TYPES.length; i++) {
        var t = TRANSPORT_TYPES[i];
        var selected = t.id === currentTransport.type ? 'transport-option--selected' : '';
        html +=
          '<div class="transport-option ' + selected + '" data-type="' + t.id + '">' +
            '<div class="transport-option__icon">' +
              '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
                getTransportIconSvg(t.id) +
              '</svg>' +
            '</div>' +
            '<span class="transport-option__name">' + t.name + '</span>' +
          '</div>';
      }
      optionsEl.innerHTML = html;

      var options = optionsEl.querySelectorAll('.transport-option');
      for (var j = 0; j < options.length; j++) {
        options[j].addEventListener('click', function() {
          for (var k = 0; k < options.length; k++) {
            options[k].classList.remove('transport-option--selected');
          }
          this.classList.add('transport-option--selected');
        });
      }
    }

    modal.classList.add('transport-modal--open');
  }

  function closeTransportModal() {
    var modal = document.getElementById('transportModal');
    if (modal) {
      modal.classList.remove('transport-modal--open');
    }
  }

  function confirmTransportChange() {
    var modal = document.getElementById('transportModal');
    if (!modal) return;

    var selectedOption = modal.querySelector('.transport-option--selected');
    if (!selectedOption) {
      closeTransportModal();
      return;
    }

    var typeId = selectedOption.dataset.type;
    var typeInfo = TRANSPORT_TYPES.find(function(t) { return t.id === typeId; });
    if (!typeInfo) {
      closeTransportModal();
      return;
    }

    var index = state.detail.editingTransportIndex;
    var dayData = getCurrentDayData();
    if (!dayData) {
      closeTransportModal();
      return;
    }

    if (!dayData.transports) {
      dayData.transports = [
        getDefaultRouteTransport(0, dayData),
        getDefaultRouteTransport(1, dayData)
      ];
    }

    if (!dayData.transports[index].segments || dayData.transports[index].segments.length === 0) {
      dayData.transports[index].segments = [
        { type: typeInfo.id, name: typeInfo.name, duration: typeInfo.duration, distance: typeInfo.distance, cost: typeInfo.cost }
      ];
    } else {
      dayData.transports[index].segments[0] = {
        type: typeInfo.id,
        name: typeInfo.name,
        duration: typeInfo.duration,
        distance: typeInfo.distance,
        cost: typeInfo.cost
      };
    }

    renderTransportNodes();
    updateTotalTransportCost();
    closeTransportModal();
    showToast('交通方式已更新');
  }

  function updateTotalTransportCost() {
    var dayData = getCurrentDayData();
    if (!dayData) return;

    syncTransportSummary(dayData);
    var totalCost = getDayTransportTotalCost(dayData);
    if (state.detail.plan) {
      state.detail.plan.updatedAt = new Date().toISOString();
      state.detail.plan.itineraryDraft = state.detail.itinerary;
    }

    if (dom.detailTransportBar) {
      var textEl = dom.detailTransportBar.querySelector('.transport-bar__text');
      var costEl = dom.detailTransportBar.querySelector('.transport-bar__cost');
      if (textEl) {
        textEl.textContent = getDayTransportSummaryText(dayData);
      }
      if (costEl) {
        costEl.textContent = '约 ¥' + totalCost;
      }
    }
  }

  function renderMapMarkers(cityId) {
    var map = mapRuntime.instance;
    if (!map || !mapRuntime.markerLayer || !mapRuntime.routeLayer) return;

    mapRuntime.markerLayer.clearLayers();
    mapRuntime.routeLayer.clearLayers();
    mapRuntime.markers = [];
    mapRuntime.routeLine = null;

    var allMarkers = buildMapMarkers(cityId);

    var routeMarkers = allMarkers.filter(function(marker) {
      return marker.category === 'attraction' || marker.category === 'restaurant';
    }).slice(0, 6);
    var routeMarkerIndex = {};
    if (routeMarkers.length > 1) {
      var routeLatLngs = [];
      for (var rp = 0; rp < routeMarkers.length; rp++) {
        routeMarkerIndex[routeMarkers[rp].id] = rp + 1;
        routeLatLngs.push(routeMarkers[rp].latLng);
      }
      mapRuntime.routeLine = L.polyline(routeLatLngs, {
        color: '#2563EB',
        weight: 4,
        opacity: 0.84,
        lineCap: 'round',
        lineJoin: 'round'
      }).addTo(mapRuntime.routeLayer);
    }

    for (var i = 0; i < allMarkers.length; i++) {
      var marker = allMarkers[i];
      marker.routeIndex = routeMarkerIndex[marker.id] || null;
      marker.leafletMarker = L.marker(marker.latLng, {
        icon: createMapMarkerIcon(marker)
      }).on('click', (function(markerData) {
        return function() {
          openPoiBottomSheet(markerData);
        };
      })(marker));
      marker.leafletMarker.addTo(mapRuntime.markerLayer);
      mapRuntime.markers.push(marker);
    }

    applyMapFilter();
    fitRealMapToMarkers(allMarkers, cityId);
  }

  function buildMapMarkers(cityId) {
    var markers = [];
    appendMapMarkers(markers, getAttractionsByCity(cityId), 'attraction', '景', '#2563EB');
    appendMapMarkers(markers, getRestaurantsByCity(cityId), 'restaurant', '食', '#F97316');

    var pois = getPoisByCity(cityId);
    for (var p = 0; p < pois.length; p++) {
      var poi = pois[p];
      var latLng = getMapLatLng(poi);
      if (!latLng) continue;
      markers.push({
        id: poi.id,
        name: poi.name,
        latLng: latLng,
        category: poi.category,
        icon: poi.icon || '•',
        color: getMapCategoryColor(poi.category),
        data: poi
      });
    }

    return markers;
  }

  function appendMapMarkers(target, items, category, icon, color) {
    for (var i = 0; i < items.length; i++) {
      var item = items[i];
      var latLng = getMapLatLng(item);
      if (!latLng) continue;
      target.push({
        id: item.id,
        name: item.name,
        latLng: latLng,
        category: category,
        icon: icon,
        color: color,
        data: item
      });
    }
  }

  function getMapLatLng(item) {
    if (!item) return null;
    if (typeof item.lat === 'number' && typeof item.lng === 'number') {
      return [item.lat, item.lng];
    }
    var coords = MAP_POI_COORDS[item.id];
    if (!coords) return null;
    return [coords.lat, coords.lng];
  }

  function getMapCategoryColor(category) {
    if (category === 'hotel') return '#7C3AED';
    if (category === 'shopping') return '#DB2777';
    if (category === 'transport') return '#16A34A';
    if (category === 'restaurant') return '#F97316';
    if (category === 'attraction') return '#2563EB';
    return '#475569';
  }

  function createMapMarkerIcon(marker) {
    var label = marker.name.length > 8 ? marker.name.slice(0, 8) : marker.name;
    var text = marker.routeIndex || marker.icon;
    return L.divIcon({
      className: 'real-map-marker',
      html:
        '<span class="real-map-marker__pin" style="--marker-color:' + marker.color + '">' +
          '<span class="real-map-marker__text">' + escapeMapHtml(text) + '</span>' +
        '</span>' +
        '<span class="real-map-marker__label">' + escapeMapHtml(label) + '</span>',
      iconSize: [34, 42],
      iconAnchor: [17, 34]
    });
  }

  function fitRealMapToMarkers(markers, cityId) {
    var map = mapRuntime.instance;
    if (!map) return;

    if (!markers.length) {
      var cityConfig = MAP_CITY_COORDS[cityId];
      if (cityConfig) {
        map.setView([cityConfig.lat, cityConfig.lng], cityConfig.zoom || 12);
      }
      return;
    }

    if (markers.length === 1) {
      map.setView(markers[0].latLng, 14);
      return;
    }

    var bounds = L.latLngBounds(markers.map(function(marker) {
      return marker.latLng;
    }));
    map.fitBounds(bounds, {
      padding: [34, 34],
      maxZoom: 14
    });
  }

  function updateMapLevelIndicator() {
    var zoom = mapRuntime.instance ? mapRuntime.instance.getZoom() : state.map.zoomLevel;
    if (zoom <= 10) {
      dom.mapLevelIndicator.textContent = '城市级';
    } else if (zoom <= 13) {
      dom.mapLevelIndicator.textContent = '区域级';
    } else if (zoom <= 16) {
      dom.mapLevelIndicator.textContent = '街道级';
    } else {
      dom.mapLevelIndicator.textContent = '建筑级';
    }
  }

  function mapZoomIn() {
    if (mapRuntime.instance) {
      mapRuntime.instance.zoomIn();
    }
  }

  function mapZoomOut() {
    if (mapRuntime.instance) {
      mapRuntime.instance.zoomOut();
    }
  }

  function updateMapFilterChips() {
    for (var i = 0; i < dom.mapFilterChips.length; i++) {
      var chip = dom.mapFilterChips[i];
      if (chip.dataset.filter === state.map.filter) {
        chip.classList.add('map-filter-chip--active');
      } else {
        chip.classList.remove('map-filter-chip--active');
      }
    }
  }

  function applyMapFilter() {
    var filter = state.map.filter;
    if (!mapRuntime.markerLayer) return;

    for (var i = 0; i < mapRuntime.markers.length; i++) {
      var marker = mapRuntime.markers[i];
      var showByFilter = true;
      if (filter !== 'all') {
        showByFilter = marker.category === filter;
      }

      if (showByFilter) {
        if (!mapRuntime.markerLayer.hasLayer(marker.leafletMarker)) {
          mapRuntime.markerLayer.addLayer(marker.leafletMarker);
        }
      } else if (mapRuntime.markerLayer.hasLayer(marker.leafletMarker)) {
        mapRuntime.markerLayer.removeLayer(marker.leafletMarker);
      }
    }

    if (mapRuntime.routeLine && mapRuntime.routeLayer) {
      var showRoute = filter === 'all' || filter === 'attraction' || filter === 'restaurant';
      if (showRoute && !mapRuntime.routeLayer.hasLayer(mapRuntime.routeLine)) {
        mapRuntime.routeLayer.addLayer(mapRuntime.routeLine);
      } else if (!showRoute && mapRuntime.routeLayer.hasLayer(mapRuntime.routeLine)) {
        mapRuntime.routeLayer.removeLayer(mapRuntime.routeLine);
      }
    }
  }

  function updateMapPoiSummary(cityId) {
    var markers = buildMapMarkers(cityId);
    var attractions = markers.filter(function(marker) { return marker.category === 'attraction'; });
    var restaurants = markers.filter(function(marker) { return marker.category === 'restaurant'; });

    dom.mapPoiCount.textContent = markers.length;
    dom.mapAttractionCount.textContent = attractions.length;
    dom.mapRestaurantCount.textContent = restaurants.length;
  }

  function escapeMapHtml(value) {
    return String(value).replace(/[&<>"']/g, function(ch) {
      return {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
      }[ch];
    });
  }

  // ========================================
  // Bottom Sheet - POI 详情
  // ========================================

  function openPoiBottomSheet(marker) {
    var data = marker.data;
    dom.poiDetailImg.src = data.imageUrl;
    dom.poiDetailName.textContent = marker.name || data.name;
    dom.poiDetailRating.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none" style="vertical-align:-2px;margin-right:4px;"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>' + (data.rating || '4.5');
    dom.poiDetailAddress.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-2px;margin-right:4px;"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>' + (data.address || '地址信息');
    dom.poiDetailDesc.textContent = data.description || '暂无描述';

    dom.poiBottomSheet.classList.add('bottom-sheet--open');
  }

  function closePoiBottomSheet() {
    dom.poiBottomSheet.classList.remove('bottom-sheet--open');
  }

  // ========================================
  // Tab 2: 发现
  // ========================================

  function renderDiscoverList(category) {
    dom.waterfallCol1.innerHTML = '';
    dom.waterfallCol2.innerHTML = '';

    var filtered = MOCK_COMMUNITY.filter(function(item) {
      if (category === 'all') return true;
      return item.category && item.category.indexOf(category) > -1;
    });

    for (var i = 0; i < filtered.length; i++) {
      var card = createDiscoverCard(filtered[i]);
      if (i % 2 === 0) {
        dom.waterfallCol1.appendChild(card);
      } else {
        dom.waterfallCol2.appendChild(card);
      }
    }
  }

  function createDiscoverCard(item) {
    var card = document.createElement('div');
    card.className = 'discover-card';

    var heights = [160, 200, 180, 220, 170, 190, 210, 175];
    var imgHeight = heights[item.id.charCodeAt(item.id.length - 1) % heights.length];
    var imgUrl = item.coverImage.replace('/600/400', '/600/' + (imgHeight * 2));

    card.innerHTML =
      '<div class="discover-card__media" style="height:' + imgHeight + 'px">' +
        '<img class="discover-card__cover" src="' + imgUrl + '" alt="' + item.title + '">' +
        '<span class="discover-card__badge">' + item.days + '天 · ' + getRouteDistance(item.days, item.cityId) + '</span>' +
      '</div>' +
      '<div class="discover-card__body">' +
        '<div class="discover-card__title">' + item.title + '</div>' +
        '<div class="discover-card__route">' +
          '<span class="discover-card__route-dot"></span>' +
          '<span>' + getRouteSummary(item.cityId) + '</span>' +
        '</div>' +
        '<div class="discover-card__author">' +
          '<img class="discover-card__avatar" src="' + item.author.avatar + '" alt="' + item.author.name + '">' +
          '<span class="discover-card__author-name">' + item.author.name + '</span>' +
        '</div>' +
        '<div class="discover-card__meta">' +
          '<span class="discover-card__city"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-1px;margin-right:2px;"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>' + item.cityName + ' · ' + item.days + '天</span>' +
          '<div class="discover-card__stats">' +
            '<span class="discover-card__stat"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-1px;margin-right:2px;"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>' + item.likes + '</span>' +
            '<span class="discover-card__stat"><svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="none" style="vertical-align:-1px;margin-right:2px;"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>' + item.favorites + '</span>' +
          '</div>' +
        '</div>' +
      '</div>';

    card.addEventListener('click', function() {
      openDiscoverDetail(item);
    });

    return card;
  }

  function openDiscoverDetail(item) {
    state.discover.currentItem = item;
    state.discover.currentDay = 1;
    dom.pageDiscoverDetail.scrollTop = 0;

    var itinerary = getDiscoverItinerary(item);
    state.discover.currentItinerary = itinerary;
    var budgetAmount = itinerary ? itinerary.totalBudget.comfort : 2800;
    var attractionCount = countDiscoverAttractions(itinerary);

    dom.discoverCover.src = getDiscoverCoverImage(item);
    dom.discoverCover.alt = item.cityName + '行程封面';
    dom.discoverCityName.textContent = item.cityName;
    dom.discoverTitle.textContent = item.title;
    dom.discoverAvatar.src = item.author.avatar;
    dom.discoverAvatar.alt = item.author.name;
    dom.discoverAuthorName.textContent = item.author.name;
    dom.discoverAuthorBio.textContent = item.author.bio;
    dom.discoverSummary.textContent = item.summary;
    dom.discoverDays.textContent = itinerary.dailyItineraries.length + '天';
    dom.discoverAttractions.textContent = attractionCount + '个景点';
    dom.discoverBudget.textContent = formatMoney(budgetAmount);
    dom.discoverLikes.textContent = item.likes;
    dom.discoverFavs.textContent = item.favorites;
    dom.discoverLikeBtn.classList.remove('action-btn--active');
    dom.discoverFavBtn.classList.remove('action-btn--active');
    dom.discoverFollowBtn.classList.remove('follow-btn--active');
    dom.discoverFollowBtn.textContent = '关注';

    dom.discoverTags.innerHTML = '';
    for (var i = 0; i < item.tags.length; i++) {
      var tag = document.createElement('span');
      tag.className = 'discover-detail__tag';
      tag.textContent = item.tags[i];
      dom.discoverTags.appendChild(tag);
    }

    renderDiscoverHighlights(item, itinerary);
    renderDiscoverDayTabs(itinerary);
    renderDiscoverDay(itinerary, 1);
    renderDiscoverTips(item.cityId);

    openSlidePage(dom.pageDiscoverDetail, 'discover-detail');
    setTimeout(function() {
      renderDiscoverRouteMap(item.cityId, itinerary, 1);
    }, 120);
  }

  var DISCOVER_CITY_COVERS = {
    beijing: 'https://images.unsplash.com/photo-1508804185872-d7badad00f7d?auto=format&fit=crop&w=1200&q=84',
    chengdu: 'https://images.unsplash.com/photo-1564349683136-77e08dba1ef7?auto=format&fit=crop&w=1200&q=84'
  };

  function getDiscoverCoverImage(item) {
    return DISCOVER_CITY_COVERS[item.cityId] || item.coverImage;
  }

  function getDiscoverItinerary(item) {
    var direct = getItineraryById(item.itineraryId);
    if (direct && direct.cityId === item.cityId && direct.days === item.days) {
      return direct;
    }

    for (var i = 0; i < MOCK_ITINERARIES.length; i++) {
      if (MOCK_ITINERARIES[i].cityId === item.cityId && MOCK_ITINERARIES[i].days === item.days) {
        return MOCK_ITINERARIES[i];
      }
    }

    var city = getCityById(item.cityId) || {
      id: item.cityId,
      name: item.cityName,
      description: item.summary,
      isOverseas: false
    };
    return generateGenericItinerary(city, item.days, 'comfort');
  }

  function countDiscoverAttractions(itinerary) {
    var count = 0;
    if (!itinerary) return count;
    for (var i = 0; i < itinerary.dailyItineraries.length; i++) {
      var day = itinerary.dailyItineraries[i];
      var periods = ['morning', 'afternoon', 'evening'];
      for (var p = 0; p < periods.length; p++) {
        if (day[periods[p]] && day[periods[p]].activity === 'attraction') count++;
      }
    }
    return count;
  }

  function getDiscoverActivityName(activity) {
    if (!activity) return '自由活动';
    var attraction = getAttractionById(activity.attractionId);
    if (attraction) return attraction.name;
    if (activity.attractionName || activity.title) return activity.attractionName || activity.title;
    if (activity.activity === 'shopping') return '购物与伴手礼';
    if (activity.activity === 'departure') return '返程';
    if (activity.activity === 'leisure') return '自由活动';
    return '行程安排';
  }

  function renderDiscoverHighlights(item, itinerary) {
    if (!dom.discoverHighlights) return;
    var firstDay = itinerary.dailyItineraries[0] || {};
    var firstStop = getDiscoverActivityName(firstDay.morning);
    var secondStop = getDiscoverActivityName(firstDay.afternoon);
    var texts = [
      firstStop + '、' + secondStop + '等代表性地点串联游览',
      '每天上午、下午与晚间节奏清晰，减少临时决策',
      '兼顾' + (item.tags[0] || '城市体验') + '与' + (item.tags[1] || '当地美食') + '，适合直接复用'
    ];
    var icons = ['route', 'clock', 'spark'];
    dom.discoverHighlights.innerHTML = texts.map(function(text, index) {
      return '<div class="highlight-item">' +
        '<span class="highlight-item__icon highlight-item__icon--' + icons[index] + '">' + (index + 1) + '</span>' +
        '<span class="highlight-item__text">' + escapeMapHtml(text) + '</span>' +
      '</div>';
    }).join('');
  }

  function renderDiscoverDayTabs(itinerary) {
    if (!dom.discoverDayTabs) return;
    dom.discoverItineraryMeta.textContent = itinerary.dailyItineraries.length + '天完整安排';
    dom.discoverDayTabs.innerHTML = itinerary.dailyItineraries.map(function(day) {
      return '<button class="discover-day-tab' + (day.day === state.discover.currentDay ? ' discover-day-tab--active' : '') + '" ' +
        'data-discover-day="' + day.day + '" role="tab" aria-selected="' + (day.day === state.discover.currentDay) + '">' +
        '<strong>Day ' + day.day + '</strong><span>' + escapeMapHtml(day.title) + '</span>' +
      '</button>';
    }).join('');
  }

  function getDiscoverMealName(meals, mealKey) {
    if (!meals) return '';
    var prefix = mealKey === 'dinner' ? 'dinner' : 'lunch';
    var restaurant = getRestaurantById(meals[prefix + 'RestaurantId']);
    return restaurant ? restaurant.name : (meals[prefix + 'RestaurantName'] || meals[prefix] || '当地特色餐厅');
  }

  function renderDiscoverDay(itinerary, dayNumber) {
    var day = null;
    for (var i = 0; i < itinerary.dailyItineraries.length; i++) {
      if (itinerary.dailyItineraries[i].day === dayNumber) day = itinerary.dailyItineraries[i];
    }
    if (!day) return;

    state.discover.currentDay = dayNumber;
    renderDiscoverDayTabs(itinerary);
    dom.discoverDaySummary.innerHTML =
      '<div><span>Day ' + day.day + '</span><strong>' + escapeMapHtml(day.title) + '</strong></div>' +
      '<p>' + getDiscoverDayPointCount(day) + ' 个地点 · ' + escapeMapHtml((day.transport && day.transport.description) || '步行与公共交通') + '</p>';

    var periods = [
      { key: 'morning', label: '上午' },
      { key: 'afternoon', label: '下午' },
      { key: 'evening', label: '晚上' }
    ];
    var html = '';
    for (var p = 0; p < periods.length; p++) {
      var activity = day[periods[p].key];
      if (!activity) continue;
      html += renderDiscoverTimelineItem(periods[p].label, activity.startTime, getDiscoverActivityName(activity), activity.description, 'place');
      if (periods[p].key === 'morning') {
        html += renderDiscoverTimelineItem('午餐', '', getDiscoverMealName(day.meals, 'lunch'), '安排在上午与下午行程之间，预留用餐和休息时间。', 'meal');
      }
      if (periods[p].key === 'evening') {
        html += renderDiscoverTimelineItem('晚餐', '', getDiscoverMealName(day.meals, 'dinner'), '体验当地风味后返回住宿区域。', 'meal');
      }
    }
    if (day.accommodation) {
      html += renderDiscoverTimelineItem('住宿', '', day.accommodation.area, day.accommodation.suggestion, 'stay');
    }
    dom.discoverDayTimeline.innerHTML = html;

    if (state.discover.currentItem) {
      renderDiscoverRouteMap(state.discover.currentItem.cityId, itinerary, dayNumber);
    }
  }

  function renderDiscoverTimelineItem(label, time, title, description, type) {
    return '<div class="discover-timeline-item discover-timeline-item--' + type + '">' +
      '<div class="discover-timeline-item__rail"><span></span></div>' +
      '<div class="discover-timeline-item__time"><strong>' + escapeMapHtml(time || label) + '</strong><span>' + (time ? escapeMapHtml(label) : '') + '</span></div>' +
      '<div class="discover-timeline-item__content"><strong>' + escapeMapHtml(title || '待安排') + '</strong>' +
        '<p>' + escapeMapHtml(description || '') + '</p></div>' +
    '</div>';
  }

  function getDiscoverDayPointCount(day) {
    var count = 0;
    var periods = ['morning', 'afternoon', 'evening'];
    for (var i = 0; i < periods.length; i++) {
      if (day[periods[i]]) count++;
    }
    return count;
  }

  function renderDiscoverTips(cityId) {
    if (!dom.discoverTips) return;
    var tips = getTipsByCity(cityId);
    if (!tips.length) {
      tips = [
        { category: '出发前', content: '提前确认热门景点预约规则，并为跨区行程预留交通时间。' },
        { category: '随身物品', content: '携带身份证件、充电宝、雨具和适合长时间步行的鞋。' },
        { category: '行程节奏', content: '每天保留一段弹性时间，可根据天气和体力调整。' }
      ];
    }
    dom.discoverTips.innerHTML = tips.slice(0, 3).map(function(tip) {
      return '<div class="discover-tip"><strong>' + escapeMapHtml(tip.category) + '</strong><p>' + escapeMapHtml(tip.content) + '</p></div>';
    }).join('');
  }

  function renderDiscoverRouteMap(cityId, itinerary, dayNumber) {
    if (!dom.discoverRouteMap || !window.L || !MAP_CITY_COORDS[cityId]) return;
    var cityConfig = MAP_CITY_COORDS[cityId];
    if (!discoverMapRuntime.instance) {
      discoverMapRuntime.instance = L.map(dom.discoverRouteMap, {
        zoomControl: false,
        attributionControl: false,
        dragging: false,
        touchZoom: false,
        scrollWheelZoom: false,
        doubleClickZoom: false,
        boxZoom: false,
        keyboard: false
      });
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(discoverMapRuntime.instance);
      discoverMapRuntime.routeLayer = L.layerGroup().addTo(discoverMapRuntime.instance);
      discoverMapRuntime.markerLayer = L.layerGroup().addTo(discoverMapRuntime.instance);
    }
    discoverMapRuntime.cityId = cityId;
    discoverMapRuntime.markerLayer.clearLayers();
    discoverMapRuntime.routeLayer.clearLayers();

    var day = itinerary.dailyItineraries.filter(function(value) { return value.day === dayNumber; })[0];
    if (!day) return;
    var markers = buildDiscoverDayMarkers(day, cityConfig);
    var latLngs = markers.map(function(marker) { return marker.latLng; });
    if (latLngs.length > 1) {
      L.polyline(latLngs, { color: '#2563EB', weight: 4, opacity: 0.78, dashArray: '9, 7' }).addTo(discoverMapRuntime.routeLayer);
    }
    for (var i = 0; i < markers.length; i++) {
      L.marker(markers[i].latLng, { icon: createMapMarkerIcon(markers[i]), interactive: false }).addTo(discoverMapRuntime.markerLayer);
    }
    dom.discoverMapHint.textContent = 'Day ' + dayNumber + ' · ' + markers.length + ' 个路线点';
    dom.discoverRouteMap.setAttribute('aria-label', 'Day ' + dayNumber + ' 行程路线地图，共 ' + markers.length + ' 个路线点');
    setTimeout(function() {
      discoverMapRuntime.instance.invalidateSize();
      if (latLngs.length > 1) {
        discoverMapRuntime.instance.fitBounds(L.latLngBounds(latLngs), { padding: [32, 32], maxZoom: 13 });
      } else {
        discoverMapRuntime.instance.setView([cityConfig.lat, cityConfig.lng], cityConfig.zoom || 12);
      }
    }, 60);
  }

  function buildDiscoverDayMarkers(day, cityConfig) {
    var markers = [];
    var periods = ['morning', 'afternoon', 'evening'];
    var offsets = [[0.018, -0.022], [-0.006, 0.018], [0.014, 0.034]];
    for (var i = 0; i < periods.length; i++) {
      var activity = day[periods[i]];
      if (!activity) continue;
      var attraction = getAttractionById(activity.attractionId);
      var latLng = getMapLatLng(attraction || activity);
      if (!latLng) {
        latLng = [cityConfig.lat + offsets[i][0] + (day.day - 1) * 0.004, cityConfig.lng + offsets[i][1] - (day.day - 1) * 0.003];
      }
      markers.push({
        id: activity.attractionId || periods[i],
        name: getDiscoverActivityName(activity),
        latLng: latLng,
        category: 'attraction',
        color: '#2563EB',
        icon: String(i + 1),
        routeIndex: i + 1
      });
    }
    return markers;
  }

  function closeDiscoverDetail() {
    closeSlidePage(dom.pageDiscoverDetail);
  }

  function reusePlan() {
    var item = state.discover.currentItem;
    if (!item) return;

    showToast('已添加到我的规划');

    setTimeout(function() {
      closeDiscoverDetail();
      switchTab('home');
    }, 800);
  }

  // ========================================
  // Tab 3: 我的
  // ========================================

  function openRecycleBin() {
    renderRecycleBin();
    openSlidePage(dom.pageRecycleBin, 'recycle-bin');
  }

  function closeRecycleBin() {
    closeSlidePage(dom.pageRecycleBin);
  }

  function getDeletedPlans() {
    return MOCK_MY_PLANS.filter(function(p) { return p.deleted; }).sort(function(a, b) {
      return new Date(b.deletedAt) - new Date(a.deletedAt);
    });
  }

  function renderRecycleBin() {
    var plans = getDeletedPlans();

    if (plans.length === 0) {
      dom.recycleBinList.style.display = 'none';
      dom.recycleBinEmpty.style.display = 'flex';
      return;
    }

    dom.recycleBinList.style.display = 'flex';
    dom.recycleBinEmpty.style.display = 'none';
    dom.recycleBinList.innerHTML = '';

    for (var i = 0; i < plans.length; i++) {
      var plan = plans[i];
      var card = createRecycleBinCard(plan);
      dom.recycleBinList.appendChild(card);
    }
  }

  function createRecycleBinCard(plan) {
    var card = document.createElement('div');
    card.className = 'recycle-bin-card';
    card.dataset.planId = plan.id;

    var deletedDate = plan.deletedAt ? formatDate(plan.deletedAt) : '';

    card.innerHTML =
      '<div class="recycle-bin-card__header">' +
        '<img class="recycle-bin-card__cover" src="' + plan.coverImage + '" alt="' + plan.title + '">' +
        '<div class="recycle-bin-card__info">' +
          '<div class="recycle-bin-card__title">' + plan.title + '</div>' +
          '<div class="recycle-bin-card__meta"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-1px;margin-right:2px;"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>' + plan.cityName + ' · ' + plan.days + '天</div>' +
          '<span class="recycle-bin-card__deleted">已删除 ' + deletedDate + '</span>' +
        '</div>' +
      '</div>' +
      '<div class="recycle-bin-card__actions">' +
        '<button class="recycle-bin-action recycle-bin-action--restore" data-action="restore">' +
          '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-2px;margin-right:4px;"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 102.13-9.36L1 10"/></svg> 恢复' +
        '</button>' +
        '<button class="recycle-bin-action recycle-bin-action--delete" data-action="delete">' +
          '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-2px;margin-right:4px;"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg> 彻底删除' +
        '</button>' +
      '</div>';

    var actions = card.querySelectorAll('.recycle-bin-action');
    for (var i = 0; i < actions.length; i++) {
      (function(actionEl) {
        actionEl.addEventListener('click', function() {
          var action = actionEl.dataset.action;
          if (action === 'restore') {
            restorePlan(plan.id);
          } else if (action === 'delete') {
            showConfirm('确定要彻底删除吗？此操作无法恢复', function() {
              permanentlyDeletePlan(plan.id);
            });
          }
        });
      })(actions[i]);
    }

    return card;
  }

  function initMePage() {
    var user = MOCK_USERS.currentUser;
    dom.userAvatar.src = user.avatar;
    dom.userName.textContent = user.name;
    dom.userBio.textContent = user.bio;
    dom.statPlans.textContent = user.stats.plans;
    dom.statFavorites.textContent = user.stats.favorites;
    dom.statFollowing.textContent = user.stats.following;
    dom.statFollowers.textContent = user.stats.followers;
  }

  // ========================================
  // Tab 3: 旅行助手
  // ========================================

  var MOCK_ASSISTANT_DATA = {
    exchangeRates: {
      beijing: { currency: '人民币', code: 'CNY', rate: 1, symbol: '¥' },
      shanghai: { currency: '人民币', code: 'CNY', rate: 1, symbol: '¥' },
      chengdu: { currency: '人民币', code: 'CNY', rate: 1, symbol: '¥' },
      hangzhou: { currency: '人民币', code: 'CNY', rate: 1, symbol: '¥' },
      xian: { currency: '人民币', code: 'CNY', rate: 1, symbol: '¥' },
      xiamen: { currency: '人民币', code: 'CNY', rate: 1, symbol: '¥' },
      sanya: { currency: '人民币', code: 'CNY', rate: 1, symbol: '¥' },
      chongqing: { currency: '人民币', code: 'CNY', rate: 1, symbol: '¥' },
      guangzhou: { currency: '人民币', code: 'CNY', rate: 1, symbol: '¥' },
      suzhou: { currency: '人民币', code: 'CNY', rate: 1, symbol: '¥' },
      tokyo: { currency: '日元', code: 'JPY', rate: 0.048, symbol: '¥' },
      osaka: { currency: '日元', code: 'JPY', rate: 0.048, symbol: '¥' },
      kyoto: { currency: '日元', code: 'JPY', rate: 0.048, symbol: '¥' },
      bangkok: { currency: '泰铢', code: 'THB', rate: 0.2, symbol: '฿' },
      seoul: { currency: '韩元', code: 'KRW', rate: 0.0053, symbol: '₩' },
      singapore: { currency: '新加坡元', code: 'SGD', rate: 5.2, symbol: 'S$' },
      paris: { currency: '欧元', code: 'EUR', rate: 7.8, symbol: '€' },
      newyork: { currency: '美元', code: 'USD', rate: 7.2, symbol: '$' }
    },
    visaInfo: {
      tokyo: { type: 'normal', desc: '需办理日本旅游签证，一般5-7个工作日出签', tips: ['需要提供在职证明、银行流水等材料', '建议提前1个月办理', '单次签证有效期3个月，停留15天'] },
      osaka: { type: 'normal', desc: '需办理日本旅游签证，一般5-7个工作日出签', tips: ['需要提供在职证明、银行流水等材料', '建议提前1个月办理', '单次签证有效期3个月，停留15天'] },
      kyoto: { type: 'normal', desc: '需办理日本旅游签证，一般5-7个工作日出签', tips: ['需要提供在职证明、银行流水等材料', '建议提前1个月办理', '单次签证有效期3个月，停留15天'] },
      bangkok: { type: 'easy', desc: '可落地签或免签政策', tips: ['落地签需要准备2寸照片', '建议提前办好电子签更方便', '免签政策可能随时变化，出行前请确认'] },
      seoul: { type: 'normal', desc: '需办理韩国旅游签证，一般5-7个工作日出签', tips: ['需要提供在职证明、银行流水等材料', '济州岛可免签30天', '建议提前1个月办理'] },
      singapore: { type: 'easy', desc: '可办理电子签证，3-5个工作日出签', tips: ['中文通行，旅行很方便', '建议提前2周办理', '需要提供在职证明等材料'] },
      paris: { type: 'hard', desc: '需办理申根签证，一般10-15个工作日出签', tips: ['需要提供详细的行程单、酒店预订单', '需要面签或采集指纹', '建议提前2-3个月办理', '申根签证可通行26个申根国家'] },
      newyork: { type: 'hard', desc: '需办理美国B1/B2签证，需要面签', tips: ['需要提前预约面签', '需要准备充分的材料证明国内约束力', '建议提前3-6个月办理', '签证有效期一般为10年'] }
    },
    transportInfo: {
      beijing: [
        { icon: '✈️', name: '飞机', desc: '北京首都国际机场/大兴国际机场，国内国际航线众多' },
        { icon: '🚄', name: '高铁', desc: '北京是全国高铁枢纽，可直达全国主要城市' },
        { icon: '🚇', name: '地铁', desc: '地铁网络发达，覆盖主要景点，是出行首选' },
        { icon: '🚌', name: '公交', desc: '公交线路密集，配合地铁出行更方便' }
      ],
      shanghai: [
        { icon: '✈️', name: '飞机', desc: '浦东/虹桥两大机场，国内国际航线密集' },
        { icon: '🚄', name: '高铁', desc: '虹桥火车站是重要枢纽，可直达全国主要城市' },
        { icon: '🚇', name: '地铁', desc: '地铁网络发达，是市内出行首选' },
        { icon: '🚌', name: '公交', desc: '公交线路众多，还有观光巴士' }
      ],
      tokyo: [
        { icon: '✈️', name: '飞机', desc: '成田/羽田两大机场，国际航班众多' },
        { icon: '🚄', name: '新干线', desc: '新干线连接日本主要城市，快速便捷' },
        { icon: '🚇', name: '地铁', desc: '地铁和JR线路四通八达，建议购买西瓜卡' },
        { icon: '🚌', name: '公交', desc: '公交覆盖地铁不到的区域' }
      ],
      bangkok: [
        { icon: '✈️', name: '飞机', desc: '素万那普/廊曼两大机场，国际航班众多' },
        { icon: 'BTS', name: 'BTS空铁', desc: '覆盖主要商圈景点，是出行首选' },
        { icon: 'MRT', name: 'MRT地铁', desc: '连接部分区域，可与BTS换乘' },
        { icon: '🛺', name: '突突车', desc: '当地特色交通工具，记得砍价' }
      ],
      seoul: [
        { icon: '✈️', name: '飞机', desc: '仁川/金浦两大机场，国际航班众多' },
        { icon: '🚇', name: '地铁', desc: '地铁网络发达，覆盖主要景点商圈' },
        { icon: '🚌', name: '公交', desc: '公交线路众多，配合地铁出行更方便' },
        { icon: '🚕', name: '出租车', desc: '出租车价格适中，有黑色模范车' }
      ],
      singapore: [
        { icon: '✈️', name: '飞机', desc: '樟宜机场是全球最佳机场之一' },
        { icon: 'MRT', name: 'MRT地铁', desc: '地铁网络覆盖全岛，干净便捷' },
        { icon: '🚌', name: '公交', desc: '公交系统完善，可刷EZ-Link卡' },
        { icon: '🚕', name: '出租车', desc: '出租车价格较高，但服务好' }
      ],
      paris: [
        { icon: '✈️', name: '飞机', desc: '戴高乐/奥利两大机场，国际航班众多' },
        { icon: '🚄', name: 'TGV高铁', desc: 'TGV连接欧洲主要城市' },
        { icon: 'Métro', name: '地铁', desc: '地铁网络密集，是市内出行首选' },
        { icon: '🚌', name: '公交', desc: '公交线路众多，还有观光巴士' }
      ],
      newyork: [
        { icon: '✈️', name: '飞机', desc: '肯尼迪/纽瓦克/拉瓜迪亚三大机场' },
        { icon: '🚇', name: '地铁', desc: '地铁24小时运营，覆盖全市' },
        { icon: '🚌', name: '公交', desc: '公交线路众多，配合地铁出行' },
        { icon: '🚕', name: '出租车', desc: '黄色出租车是纽约标志，还有Uber' }
      ]
    }
  };

  function getCityAttractions(cityId) {
    var attractions = [];
    for (var i = 0; i < MOCK_ATTRACTIONS.length; i++) {
      if (MOCK_ATTRACTIONS[i].cityId === cityId) {
        attractions.push(MOCK_ATTRACTIONS[i]);
      }
    }
    return attractions.slice(0, 5);
  }

  function getDefaultTransport(cityId) {
    var city = getCityById(cityId);
    if (!city) return [];
    if (city.isOverseas) {
      return MOCK_ASSISTANT_DATA.transportInfo[cityId] || [
        { icon: '✈️', name: '飞机', desc: '国际机场，国际航班众多' },
        { icon: '🚇', name: '地铁', desc: '地铁网络覆盖主要景点商圈' },
        { icon: '🚌', name: '公交', desc: '公交线路完善，出行便捷' },
        { icon: '🚕', name: '出租车', desc: '出租车服务便利' }
      ];
    }
    return MOCK_ASSISTANT_DATA.transportInfo[cityId] || [
      { icon: '✈️', name: '飞机', desc: '国内航线众多，出行方便' },
      { icon: '🚄', name: '高铁', desc: '高铁连接周边主要城市' },
      { icon: '🚇', name: '地铁', desc: '地铁网络覆盖主要景点' },
      { icon: '🚌', name: '公交', desc: '公交线路密集，出行方便' }
    ];
  }

  function getTransportIconSvg(name) {
    var svgMap = {
      '飞机': '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.8 19.2L16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/></svg>',
      '高铁': '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="3" width="16" height="14" rx="2"/><path d="M4 17h16M8 21h8M12 17v4M9 7h6"/></svg>',
      '地铁': '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="2" width="14" height="16" rx="2"/><path d="M5 18h14M8 22h8M12 18v4M8 7h8M8 11h.01M16 11h.01"/></svg>',
      '公交': '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="14" rx="2"/><path d="M3 17h18M7 21h.01M17 21h.01M7 8h10"/></svg>',
      '出租车': '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 17h14l-1.5-6.5a2 2 0 00-2-1.5h-7a2 2 0 00-2 1.5L5 17z"/><circle cx="7.5" cy="17.5" r="1.5"/><circle cx="16.5" cy="17.5" r="1.5"/><path d="M9 7h6"/></svg>'
    };
    return svgMap[name] || svgMap['公交'];
  }

  function getFancyIcon(name, size) {
    size = size || 20;
    var iconMap = {
      'visa': '<svg width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="fgVisa" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#38BDF8"/><stop offset="100%" stop-color="#0EA5E9"/></linearGradient></defs><rect x="3" y="4" width="18" height="16" rx="3" fill="url(#fgVisa)"/><path d="M4 8h16M4 13h8M4 16h6" stroke="#fff" stroke-width="1.5" stroke-linecap="round" opacity="0.9"/><circle cx="17" cy="15" r="2.5" fill="#fff" opacity="0.9"/><path d="M19 15c0-1.5-1-2.5-2.5-2.5" stroke="#fff" stroke-width="1.2" stroke-linecap="round" opacity="0.7"/></svg>',
      'exchange': '<svg width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="fgEx" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#A78BFA"/><stop offset="100%" stop-color="#8B5CF6"/></linearGradient></defs><circle cx="12" cy="12" r="10" fill="url(#fgEx)"/><path d="M7 8h10M17 8l-2-3M17 16H7M7 16l2 3" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" opacity="0.95"/><circle cx="12" cy="12" r="3" fill="#fff" opacity="0.85"/></svg>',
      'money': '<svg width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="fgMoney" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#34D399"/><stop offset="100%" stop-color="#10B981"/></linearGradient></defs><circle cx="12" cy="12" r="10" fill="url(#fgMoney)"/><circle cx="12" cy="12" r="6" fill="none" stroke="#fff" stroke-width="1.8" opacity="0.9"/><text x="12" y="16" text-anchor="middle" fill="#fff" font-size="10" font-weight="bold" opacity="0.95">¥</text><path d="M12 6v12" stroke="#fff" stroke-width="1.5" stroke-linecap="round" opacity="0.6"/></svg>',
      'transport': '<svg width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="fgTrans" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#F59E0B"/><stop offset="100%" stop-color="#D97706"/></linearGradient></defs><rect x="3" y="5" width="18" height="13" rx="3" fill="url(#fgTrans)"/><path d="M3 14h18M7 20h2M15 20h2M5 9h14" stroke="#fff" stroke-width="1.5" stroke-linecap="round" opacity="0.9"/><circle cx="8" cy="17" r="1.5" fill="#fff" opacity="0.85"/><circle cx="16" cy="17" r="1.5" fill="#fff" opacity="0.85"/></svg>',
      'attraction': '<svg width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="fgAttr" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#F472B6"/><stop offset="100%" stop-color="#EC4899"/></linearGradient></defs><path d="M3 21h18M5 21V8l7-5 7 5v13M9 21v-7h6v7" fill="url(#fgAttr)"/><path d="M10 10h4M12 7v2" stroke="#fff" stroke-width="1.5" stroke-linecap="round" opacity="0.9"/><circle cx="12" cy="14" r="1.5" fill="#fff" opacity="0.85"/></svg>',
      'info': '<svg width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="fgInfo" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#60A5FA"/><stop offset="100%" stop-color="#3B82F6"/></linearGradient></defs><rect x="4" y="3" width="16" height="18" rx="3" fill="url(#fgInfo)"/><path d="M8 8h8M8 12h6M8 16h5" stroke="#fff" stroke-width="1.8" stroke-linecap="round" opacity="0.95"/><circle cx="17" cy="6" r="1.5" fill="#fff" opacity="0.85"/></svg>',
      'lightbulb': '<svg width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="fgBulb" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#FBBF24"/><stop offset="100%" stop-color="#F59E0B"/></linearGradient></defs><path d="M9 18h6M10 21h4M12 2a7 7 0 00-5 11.8V16h10v-2.2A7 7 0 0012 2z" fill="url(#fgBulb)"/><circle cx="12" cy="9" r="3" fill="#fff" opacity="0.85"/><path d="M10 18v1M14 18v1" stroke="#fff" stroke-width="1.2" stroke-linecap="round" opacity="0.7"/></svg>',
      'star': '<svg width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="fgStar" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#FCD34D"/><stop offset="100%" stop-color="#F59E0B"/></linearGradient></defs><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" fill="url(#fgStar)"/><polygon points="12 5 13.8 9.5 18.5 10.2 15 13.5 15.9 18.2 12 16.1 8.1 18.2 9 13.5 5.5 10.2 10.2 9.5 12 5" fill="#fff" opacity="0.4"/></svg>',
      'clock': '<svg width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="fgClock" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#38BDF8"/><stop offset="100%" stop-color="#0EA5E9"/></linearGradient></defs><circle cx="12" cy="12" r="10" fill="url(#fgClock)"/><circle cx="12" cy="12" r="7" fill="#fff" opacity="0.9"/><path d="M12 8v4l2.5 2.5" stroke="#0EA5E9" stroke-width="1.8" stroke-linecap="round"/></svg>',
      'ticket': '<svg width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="fgTicket" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#F472B6"/><stop offset="100%" stop-color="#EC4899"/></linearGradient></defs><path d="M3 8a2 2 0 012-2h14a2 2 0 012 2v2.5a2 2 0 000 3V16a2 2 0 01-2 2H5a2 2 0 01-2-2v-2.5a2 2 0 000-3V8z" fill="url(#fgTicket)"/><path d="M9 6v12" stroke="#fff" stroke-width="1.5" stroke-dasharray="2 2" opacity="0.6"/><circle cx="15" cy="12" r="2" fill="#fff" opacity="0.9"/></svg>'
    };
    return iconMap[name] || iconMap['info'];
  }

  function getDefaultVisaInfo(cityId) {
    var city = getCityById(cityId);
    if (!city || !city.isOverseas) return null;
    return MOCK_ASSISTANT_DATA.visaInfo[cityId] || {
      type: 'normal',
      desc: '需办理当地旅游签证',
      tips: ['建议提前1-2个月办理', '请准备好相关材料', '出行前确认签证有效期']
    };
  }

  function initAssistantPage() {
    renderAssistantCityChips();
    renderAssistantContent();
  }

  function renderAssistantCityChips() {
    var tab = state.assistant.currentTab;
    dom.assistantCityScroll.innerHTML = '';

    for (var i = 0; i < MOCK_CITIES.length; i++) {
      var city = MOCK_CITIES[i];
      if (tab === 'domestic' && city.isOverseas) continue;
      if (tab === 'overseas' && !city.isOverseas) continue;

      var chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'assistant-city-chip';
      if (city.id === state.assistant.selectedCityId) {
        chip.classList.add('assistant-city-chip--active');
      }
      chip.dataset.cityId = city.id;
      chip.setAttribute('aria-pressed', city.id === state.assistant.selectedCityId ? 'true' : 'false');
      chip.innerHTML = 
        '<img class="assistant-city-chip__img" src="' + city.imageUrl + '" alt="' + city.name + '">' +
        '<span class="assistant-city-chip__name">' + city.name + '</span>';

      chip.addEventListener('click', function() {
        state.assistant.selectedCityId = this.dataset.cityId;
        renderAssistantCityChips();
        renderAssistantContent();
      });

      dom.assistantCityScroll.appendChild(chip);
    }
  }

  function renderAssistantLegacyContent() {
    var cityId = state.assistant.selectedCityId;
    var city = getCityById(cityId);
    if (!city) return;

    var html = '';

    html +=
      '<div class="assistant-route-board">' +
        '<div class="assistant-route-board__map">' + renderRouteMiniMap(cityId, 'assistant') + '</div>' +
        '<div class="assistant-route-board__content">' +
          '<span class="assistant-route-board__eyebrow">Destination map</span>' +
          '<strong>' + city.name + '路线建议</strong>' +
          '<p>' + getRouteSummary(cityId) + '</p>' +
          '<div class="assistant-route-board__metrics">' +
            '<span>' + getRouteDistance(3, cityId) + '</span>' +
            '<span>' + city.popularAttractions + ' 个热门点</span>' +
          '</div>' +
        '</div>' +
      '</div>';

    var visaInfo = getDefaultVisaInfo(cityId);
    if (visaInfo) {
      var visaClass = visaInfo.type === 'easy' ? 'assistant-visa-status--easy' :
                     visaInfo.type === 'hard' ? 'assistant-visa-status--hard' :
                     'assistant-visa-status--normal';
      var visaText = visaInfo.type === 'easy' ? '容易办理' :
                     visaInfo.type === 'hard' ? '较难办理' : '正常办理';
      html += 
        '<div class="assistant-card">' +
          '<div class="assistant-card__header">' +
            '<div class="assistant-card__icon">' + getFancyIcon('visa', 22) + '</div>' +
            '<div class="assistant-card__title">签证攻略</div>' +
          '</div>' +
          '<div class="assistant-card__body">' +
            '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">' +
              '<span style="font-size:14px;font-weight:500;">' + city.name + '签证</span>' +
              '<span class="assistant-visa-status ' + visaClass + '">' + visaText + '</span>' +
            '</div>' +
            '<p style="font-size:13px;color:var(--text-secondary);margin-bottom:10px;">' + visaInfo.desc + '</p>' +
            '<div style="background:#f9fafb;padding:10px 12px;border-radius:8px;">' +
              '<div style="font-size:12px;font-weight:500;margin-bottom:6px;color:var(--text-primary);">' + getFancyIcon('lightbulb', 14) + ' 温馨提示</div>';
      for (var t = 0; t < visaInfo.tips.length; t++) {
        html += '<div style="font-size:12px;color:var(--text-secondary);margin-bottom:4px;">• ' + visaInfo.tips[t] + '</div>';
      }
      html += '</div></div></div>';
    }

    var rate = MOCK_ASSISTANT_DATA.exchangeRates[cityId];
    if (rate) {
      if (city.isOverseas) {
        html += 
          '<div class="assistant-card">' +
            '<div class="assistant-card__header">' +
              '<div class="assistant-card__icon">' + getFancyIcon('exchange', 22) + '</div>' +
              '<div class="assistant-card__title">汇率参考</div>' +
            '</div>' +
            '<div class="assistant-card__body">' +
              '<div class="assistant-rate-box">' +
                '<div>' +
                  '<div class="assistant-rate__currency">' + rate.currency + ' (' + rate.code + ')</div>' +
                  '<div style="font-size:12px;color:var(--text-light);">当地货币</div>' +
                '</div>' +
                '<div style="text-align:right;">' +
                  '<div class="assistant-rate__value">' + rate.symbol + '100 ≈ ¥' + (rate.rate * 100).toFixed(2) + '</div>' +
                  '<div style="font-size:11px;color:var(--text-light);">仅供参考</div>' +
                '</div>' +
              '</div>' +
              '<div style="font-size:12px;color:var(--text-light);text-align:center;">汇率实时变动，建议出行前查询最新汇率</div>' +
            '</div>' +
          '</div>';
      } else {
        html += 
          '<div class="assistant-card">' +
            '<div class="assistant-card__header">' +
              '<div class="assistant-card__icon">' + getFancyIcon('money', 22) + '</div>' +
              '<div class="assistant-card__title">消费水平</div>' +
            '</div>' +
            '<div class="assistant-card__body">' +
              '<div class="assistant-card__item">' +
                '<span class="assistant-card__item-label">货币</span>' +
                '<span class="assistant-card__item-value">人民币 (CNY)</span>' +
              '</div>' +
              '<div class="assistant-card__item">' +
                '<span class="assistant-card__item-label">人均餐饮</span>' +
                '<span class="assistant-card__item-value">¥50-200/天</span>' +
              '</div>' +
              '<div class="assistant-card__item">' +
                '<span class="assistant-card__item-label">市内交通</span>' +
                '<span class="assistant-card__item-value">¥30-100/天</span>' +
              '</div>' +
            '</div>' +
          '</div>';
      }
    }

    var transport = getDefaultTransport(cityId);
    if (transport && transport.length > 0) {
      html += 
        '<div class="assistant-card">' +
          '<div class="assistant-card__header">' +
            '<div class="assistant-card__icon">' + getFancyIcon('transport', 22) + '</div>' +
            '<div class="assistant-card__title">交通信息</div>' +
          '</div>' +
          '<div class="assistant-card__body">';
      for (var tr = 0; tr < transport.length; tr++) {
        var transportIcon = getTransportIconSvg(transport[tr].name);
        html += 
          '<div class="assistant-transport-item">' +
            '<div class="assistant-transport__icon">' + transportIcon + '</div>' +
            '<div class="assistant-transport__content">' +
              '<div class="assistant-transport__name">' + transport[tr].name + '</div>' +
              '<div class="assistant-transport__desc">' + transport[tr].desc + '</div>' +
            '</div>' +
          '</div>';
      }
      html += '</div></div>';
    }

    var attractions = getCityAttractions(cityId);
    if (attractions.length > 0) {
      html += 
        '<div class="assistant-card">' +
          '<div class="assistant-card__header">' +
            '<div class="assistant-card__icon">' + getFancyIcon('attraction', 22) + '</div>' +
            '<div class="assistant-card__title">热门景点</div>' +
          '</div>' +
          '<div class="assistant-card__body">' +
            '<div class="assistant-spot-list">';
      for (var a = 0; a < attractions.length; a++) {
        var attr = attractions[a];
        html += 
          '<div class="assistant-spot-item">' +
            '<img class="assistant-spot__img" src="' + attr.imageUrl + '" alt="' + attr.name + '">' +
            '<div class="assistant-spot__info">' +
              '<div class="assistant-spot__name">' + attr.name + '</div>' +
              '<div class="assistant-spot__meta">' +
                '<span class="assistant-spot__rating">' + getFancyIcon('star', 12) + ' ' + attr.rating + '</span>' +
                '<span class="assistant-spot__price">' + (attr.ticketPrice > 0 ? '¥' + attr.ticketPrice : '免费') + '</span>' +
              '</div>' +
            '</div>' +
          '</div>';
      }
      html += '</div></div></div>';
    }

    html += 
      '<div class="assistant-card">' +
        '<div class="assistant-card__header">' +
          '<div class="assistant-card__icon">' + getFancyIcon('info', 22) + '</div>' +
          '<div class="assistant-card__title">出行须知</div>' +
        '</div>' +
        '<div class="assistant-card__body">' +
          '<div class="assistant-card__item">' +
            '<span class="assistant-card__item-label">最佳旅行时间</span>' +
            '<span class="assistant-card__item-value" style="text-align:right;">' + city.bestSeason + '</span>' +
          '</div>' +
          '<div class="assistant-card__item">' +
            '<span class="assistant-card__item-label">热门景点数</span>' +
            '<span class="assistant-card__item-value">' + city.popularAttractions + '个</span>' +
          '</div>';
    if (city.isOverseas) {
      html += 
        '<div class="assistant-card__item">' +
          '<span class="assistant-card__item-label">货币</span>' +
          '<span class="assistant-card__item-value">' + city.currency + '</span>' +
        '</div>' +
        '<div class="assistant-card__item">' +
          '<span class="assistant-card__item-label">时区</span>' +
          '<span class="assistant-card__item-value">' + city.timezone + '</span>' +
        '</div>';
    }
    html += '</div></div>';

    dom.assistantContent.innerHTML = html;
  }

  var ASSISTANT_THEME_PRESETS = {
    classic: {
      label: '经典初访',
      title: '第一次来，3 天这样玩',
      description: '把最有代表性的地标串成一条顺路、不过度赶行程的城市体验线。',
      routeSuffix: '经典初访路线',
      fit: '适合第一次到访'
    },
    food: {
      label: '美食探索',
      title: '边逛边吃，3 天吃透城市',
      description: '把老字号、街区漫步和夜间体验放进同一条路线，减少往返。',
      routeSuffix: '美食探索路线',
      fit: '适合美食爱好者'
    },
    family: {
      label: '亲子轻松',
      title: '带孩子出发，节奏留得更松',
      description: '每天只安排核心地点，预留休息与用餐时间，减少体力消耗。',
      routeSuffix: '亲子轻松路线',
      fit: '适合亲子同行'
    },
    slow: {
      label: '慢游休闲',
      title: '不赶路，留时间感受城市',
      description: '用少量重点地点串联城市散步、自然景观与夜间体验。',
      routeSuffix: '慢游休闲路线',
      fit: '适合轻松度假'
    }
  };

  function getAssistantItinerary(city) {
    for (var i = 0; i < MOCK_ITINERARIES.length; i++) {
      if (MOCK_ITINERARIES[i].cityId === city.id && MOCK_ITINERARIES[i].days === 3) {
        return MOCK_ITINERARIES[i];
      }
    }
    return generateGenericItinerary(city, 3, 'comfort');
  }

  function getAssistantActivityName(activity) {
    if (!activity) return '自由活动';
    var attraction = getAttractionById(activity.attractionId);
    if (attraction) return attraction.name;
    return activity.attractionName || activity.title || (activity.activity === 'leisure' ? '自由活动' : '城市探索');
  }

  function getAssistantTips(city) {
    var tips = getTipsByCity(city.id);
    if (tips.length) return tips.slice(0, 2);
    return [
      { category: '出发前', content: '热门地点建议提前确认预约规则，并为跨区移动预留交通时间。' },
      { category: '行程节奏', content: '每天保留一段弹性时间，可根据天气和体力调整安排。' }
    ];
  }

  function renderAssistantPlanDays(itinerary) {
    return itinerary.dailyItineraries.map(function(day) {
      var stops = [day.morning, day.afternoon, day.evening].filter(Boolean).map(function(activity) {
        return getAssistantActivityName(activity);
      });
      return '<div class="assistant-v2-day">' +
        '<span>Day ' + day.day + '</span>' +
        '<strong>' + escapeMapHtml(day.title) + '</strong>' +
        '<p>' + escapeMapHtml(stops.slice(0, 2).join(' · ')) + '</p>' +
      '</div>';
    }).join('');
  }

  function renderAssistantPlanningContent() {
    var cityId = state.assistant.selectedCityId;
    var city = getCityById(cityId);
    if (!city) return;

    var theme = ASSISTANT_THEME_PRESETS[state.assistant.selectedTheme] || ASSISTANT_THEME_PRESETS.classic;
    var itinerary = getAssistantItinerary(city);
    var rate = MOCK_ASSISTANT_DATA.exchangeRates[cityId];
    var transport = getDefaultTransport(cityId).slice(0, 2);
    var attractions = getCityAttractions(cityId).slice(0, 3);
    var tips = getAssistantTips(city);
    var visaInfo = getDefaultVisaInfo(cityId);
    var budget = itinerary.totalBudget.comfort;
    var html =
      '<section class="assistant-v2-hero">' +
        '<span class="assistant-v2-kicker">目的地决策</span>' +
        '<h2>' + escapeMapHtml(city.name + '，' + theme.title) + '</h2>' +
        '<p>' + escapeMapHtml(theme.description) + '</p>' +
        '<div class="assistant-v2-intents" role="group" aria-label="选择旅行方式">';

    Object.keys(ASSISTANT_THEME_PRESETS).forEach(function(key) {
      var preset = ASSISTANT_THEME_PRESETS[key];
      html += '<button type="button" class="assistant-v2-intent' + (key === state.assistant.selectedTheme ? ' assistant-v2-intent--active' : '') + '" data-assistant-theme="' + key + '" aria-pressed="' + (key === state.assistant.selectedTheme) + '">' + escapeMapHtml(preset.label) + '</button>';
    });

    html += '</div></section>' +
      '<section class="assistant-v2-plan">' +
        '<div class="assistant-v2-plan__top">' +
          '<div><span>推荐方案</span><h3>' + escapeMapHtml(city.name + theme.routeSuffix) + '</h3></div>' +
          '<strong>3 天</strong>' +
        '</div>' +
        '<p class="assistant-v2-plan__summary">' + escapeMapHtml(getRouteSummary(cityId)) + '</p>' +
        '<div class="assistant-v2-plan__days">' + renderAssistantPlanDays(itinerary) + '</div>' +
        '<div class="assistant-v2-plan__meta"><span>' + escapeMapHtml(theme.fit) + '</span><span>人均 ' + formatMoney(budget) + ' 起</span></div>' +
        '<button type="button" class="assistant-v2-primary" data-assistant-action="create-plan">用此方案开始规划</button>' +
      '</section>' +
      '<section class="assistant-v2-section assistant-v2-section--essentials">' +
        '<div class="assistant-v2-section__head"><h3>出发前先看</h3><span>快速判断是否适合出发</span></div>' +
        '<div class="assistant-v2-facts">' +
          '<div><span>最佳时间</span><strong>' + escapeMapHtml(city.bestSeason) + '</strong></div>' +
          '<div><span>每日餐饮</span><strong>' + (city.isOverseas ? '按当地消费浮动' : '¥50-200/人') + '</strong></div>' +
          '<div><span>市内交通</span><strong>' + (transport[0] ? escapeMapHtml(transport[0].name + '优先') : '公共交通优先') + '</strong></div>' +
        '</div>' +
      '</section>' +
      '<section class="assistant-v2-section">' +
        '<div class="assistant-v2-section__head"><h3>抵达与市内移动</h3><span>先选对交通方式</span></div>' +
        '<div class="assistant-v2-transport">';

    for (var tr = 0; tr < transport.length; tr++) {
      html += '<div class="assistant-v2-transport__item"><span>' + getTransportIconSvg(transport[tr].name) + '</span><div><strong>' + escapeMapHtml(transport[tr].name) + '</strong><p>' + escapeMapHtml(transport[tr].desc) + '</p></div></div>';
    }
    html += '</div></section>';

    if (visaInfo) {
      html += '<section class="assistant-v2-section assistant-v2-section--notice">' +
        '<div class="assistant-v2-section__head"><h3>证件与支付</h3><span>' + escapeMapHtml(rate ? rate.currency : '') + '</span></div>' +
        '<div class="assistant-v2-notice"><strong>' + escapeMapHtml(visaInfo.desc) + '</strong><p>' + escapeMapHtml(visaInfo.tips[0]) + '</p></div>' +
      '</section>';
    }

    if (attractions.length) {
      html += '<section class="assistant-v2-section">' +
        '<div class="assistant-v2-section__head"><h3>值得优先安排</h3><span>先锁定核心地点</span></div>' +
        '<div class="assistant-v2-spots">';
      for (var a = 0; a < attractions.length; a++) {
        var attr = attractions[a];
        html += '<article class="assistant-v2-spot">' +
          '<img src="' + escapeMapHtml(attr.imageUrl) + '" alt="' + escapeMapHtml(attr.name) + '">' +
          '<div><strong>' + escapeMapHtml(attr.name) + '</strong><span>评分 ' + escapeMapHtml(attr.rating) + ' · ' + (attr.ticketPrice > 0 ? '门票 ¥' + attr.ticketPrice : '免费') + '</span></div>' +
        '</article>';
      }
      html += '</div></section>';
    }

    html += '<section class="assistant-v2-section assistant-v2-section--tips">' +
      '<div class="assistant-v2-section__head"><h3>行前提醒</h3><span>减少临时踩坑</span></div>' +
      '<div class="assistant-v2-tips">';
    for (var tipIndex = 0; tipIndex < tips.length; tipIndex++) {
      html += '<div><strong>' + escapeMapHtml(tips[tipIndex].category) + '</strong><p>' + escapeMapHtml(tips[tipIndex].content) + '</p></div>';
    }
    html += '</div></section>';

    dom.assistantContent.innerHTML = html;
  }

  function renderAssistantContent() {
    var city = getCityById(state.assistant.selectedCityId);
    if (!city) return;

    var rate = MOCK_ASSISTANT_DATA.exchangeRates[city.id];
    var transport = getDefaultTransport(city.id).slice(0, 3);
    var attractions = getCityAttractions(city.id).slice(0, 3);
    var tips = getAssistantTips(city);
    var visaInfo = getDefaultVisaInfo(city.id);
    var topics = [
      { id: 'overview', label: '速览' },
      { id: 'transport', label: '交通' },
      { id: 'spending', label: '花费' },
      { id: 'spots', label: '景点' },
      { id: 'notes', label: '提醒' }
    ];
    var html =
      '<section class="assistant-v3-hero" id="assistant-info-overview">' +
        '<span class="assistant-v3-kicker">目的地指南</span>' +
        '<h2>' + escapeMapHtml(city.name + '旅行信息') + '</h2>' +
        '<p>' + escapeMapHtml(city.description) + '</p>' +
        '<div class="assistant-v3-topics" role="navigation" aria-label="旅行信息分类">';

    for (var topicIndex = 0; topicIndex < topics.length; topicIndex++) {
      var topic = topics[topicIndex];
      html += '<button type="button" class="assistant-v3-topic' + (topic.id === state.assistant.selectedInfo ? ' assistant-v3-topic--active' : '') + '" data-assistant-topic="' + topic.id + '" aria-pressed="' + (topic.id === state.assistant.selectedInfo) + '">' + topic.label + '</button>';
    }

    html += '</div></section>' +
      '<section class="assistant-v3-summary">' +
        '<div><span>最佳出行</span><strong>' + escapeMapHtml(city.bestSeason) + '</strong></div>' +
        '<div><span>城市交通</span><strong>' + escapeMapHtml(transport[0] ? transport[0].name + '较便利' : '公共交通便利') + '</strong></div>' +
        '<div><span>' + (city.isOverseas ? '当地货币' : '日常餐饮') + '</span><strong>' + escapeMapHtml(city.isOverseas && rate ? rate.currency : '¥50-200/人') + '</strong></div>' +
      '</section>' +
      '<section class="assistant-v3-section" id="assistant-info-transport">' +
        '<div class="assistant-v3-section__head"><h3>抵达与市内交通</h3><span>出行前先确认</span></div>' +
        '<div class="assistant-v3-transport">';

    for (var transportIndex = 0; transportIndex < transport.length; transportIndex++) {
      var transportItem = transport[transportIndex];
      html += '<div class="assistant-v3-transport__item">' +
        '<span>' + getTransportIconSvg(transportItem.name) + '</span>' +
        '<div><strong>' + escapeMapHtml(transportItem.name) + '</strong><p>' + escapeMapHtml(transportItem.desc) + '</p></div>' +
      '</div>';
    }
    html += '</div></section>' +
      '<section class="assistant-v3-section" id="assistant-info-spending">' +
        '<div class="assistant-v3-section__head"><h3>花费与支付</h3><span>仅作出行参考</span></div>' +
        '<div class="assistant-v3-costs">';

    if (city.isOverseas && rate) {
      html += '<div><span>当地货币</span><strong>' + escapeMapHtml(rate.currency + ' (' + rate.code + ')') + '</strong></div>' +
        '<div><span>参考汇率</span><strong>' + escapeMapHtml(rate.symbol + '100 ≈ ¥' + (rate.rate * 100).toFixed(2)) + '</strong></div>' +
        '<div><span>支付提示</span><strong>备好实体卡与少量现金</strong></div>';
    } else {
      html += '<div><span>日常餐饮</span><strong>¥50-200/人</strong></div>' +
        '<div><span>市内出行</span><strong>¥30-100/人</strong></div>' +
        '<div><span>常用支付</span><strong>移动支付更方便</strong></div>';
    }
    html += '</div></section>';

    if (visaInfo) {
      html += '<section class="assistant-v3-section assistant-v3-section--notice">' +
        '<div class="assistant-v3-section__head"><h3>证件提醒</h3><span>出发前确认</span></div>' +
        '<div class="assistant-v3-notice"><strong>' + escapeMapHtml(visaInfo.desc) + '</strong><p>' + escapeMapHtml(visaInfo.tips[0]) + '</p></div>' +
      '</section>';
    }

    if (attractions.length) {
      html += '<section class="assistant-v3-section" id="assistant-info-spots">' +
        '<div class="assistant-v3-section__head"><h3>热门景点</h3><span>可提前查预约</span></div>' +
        '<div class="assistant-v3-spots">';
      for (var attractionIndex = 0; attractionIndex < attractions.length; attractionIndex++) {
        var attraction = attractions[attractionIndex];
        html += '<article class="assistant-v3-spot">' +
          '<img src="' + escapeMapHtml(attraction.imageUrl) + '" alt="' + escapeMapHtml(attraction.name) + '">' +
          '<div><strong>' + escapeMapHtml(attraction.name) + '</strong><span>评分 ' + escapeMapHtml(attraction.rating) + ' · ' + (attraction.ticketPrice > 0 ? '门票 ¥' + attraction.ticketPrice : '免费') + '</span></div>' +
        '</article>';
      }
      html += '</div></section>';
    }

    html += '<section class="assistant-v3-section" id="assistant-info-notes">' +
      '<div class="assistant-v3-section__head"><h3>行前提醒</h3><span>减少临时踩坑</span></div>' +
      '<div class="assistant-v3-tips">';
    for (var tipIndex = 0; tipIndex < tips.length; tipIndex++) {
      html += '<div><strong>' + escapeMapHtml(tips[tipIndex].category) + '</strong><p>' + escapeMapHtml(tips[tipIndex].content) + '</p></div>';
    }
    html += '</div></section>';

    dom.assistantContent.innerHTML = html;
  }

  function switchAssistantTab(tab) {
    state.assistant.currentTab = tab;

    for (var i = 0; i < dom.assistantTabs.length; i++) {
      if (dom.assistantTabs[i].dataset.assistantTab === tab) {
        dom.assistantTabs[i].classList.add('assistant-tab--active');
      } else {
        dom.assistantTabs[i].classList.remove('assistant-tab--active');
      }
    }

    var cities = [];
    for (var j = 0; j < MOCK_CITIES.length; j++) {
      if (tab === 'domestic' && !MOCK_CITIES[j].isOverseas) {
        cities.push(MOCK_CITIES[j]);
      }
      if (tab === 'overseas' && MOCK_CITIES[j].isOverseas) {
        cities.push(MOCK_CITIES[j]);
      }
    }

    if (cities.length > 0) {
      state.assistant.selectedCityId = cities[0].id;
    }

    renderAssistantCityChips();
    renderAssistantContent();
  }

  // ========================================
  // 事件绑定
  // ========================================

  function bindEvents() {
    for (var i = 0; i < dom.tabBarItems.length; i++) {
      dom.tabBarItems[i].addEventListener('click', function() {
        switchTab(this.dataset.tab);
      });
    }

    dom.newPlanBtn.addEventListener('click', openNewPlan);
    dom.backFromNewPlan.addEventListener('click', closeNewPlan);
    bindPeopleCounterButton(dom.npAdultMinus);
    bindPeopleCounterButton(dom.npAdultPlus);
    bindPeopleCounterButton(dom.npChildMinus);
    bindPeopleCounterButton(dom.npChildPlus);

    document.addEventListener('click', function(e) {
      if (state.planList.openSwipeId && !e.target.closest('.plan-card-wrapper')) {
        closeSwipe();
      }
    });

    if (dom.homeSearchBtn) {
      dom.homeSearchBtn.addEventListener('click', function() {
        showToast('搜索功能开发中');
      });
    }
    if (dom.discoverSearchBtn) {
      dom.discoverSearchBtn.addEventListener('click', function() {
        showToast('搜索功能开发中');
      });
    }
    if (dom.sortBtn) {
      dom.sortBtn.addEventListener('click', openSortModal);
    }
    if (dom.sortModalOverlay) {
      dom.sortModalOverlay.addEventListener('click', closeSortModal);
    }
    if (dom.sortModalClose) {
      dom.sortModalClose.addEventListener('click', closeSortModal);
    }
    if (dom.sortOptions) {
      dom.sortOptions.addEventListener('click', function(e) {
        var opt = e.target.closest('.sort-option');
        if (opt) {
          changeSortBy(opt.dataset.sort);
        }
      });
    }
    if (dom.tagModal) {
      var tagOverlay = document.getElementById('tagModalOverlay');
      var tagClose = document.getElementById('tagModalClose');
      if (tagOverlay) tagOverlay.addEventListener('click', closeTagModal);
      if (tagClose) tagClose.addEventListener('click', closeTagModal);
      if (dom.tagModalSave) dom.tagModalSave.addEventListener('click', saveTags);
    }
    if (dom.detailTabItinerary) {
      dom.detailTabItinerary.addEventListener('click', function(e) {
        var btn = e.target.closest('.itinerary-edit-btn');
        if (!btn) {
          var accCard = e.target.closest('.accommodation-card--timeline, .accommodation-card--inline');
          if (accCard) {
            btn = accCard.querySelector('.itinerary-edit-btn');
          }
        }
        if (!btn || !dom.detailTabItinerary.contains(btn)) return;
        e.preventDefault();
        e.stopPropagation();
        openItineraryEditFromButton(btn);
      });
    }
    if (dom.itineraryEditOverlay) {
      dom.itineraryEditOverlay.addEventListener('click', closeItineraryEditModal);
    }
    if (dom.itineraryEditClose) {
      dom.itineraryEditClose.addEventListener('click', closeItineraryEditModal);
    }
    if (dom.itineraryEditCancel) {
      dom.itineraryEditCancel.addEventListener('click', closeItineraryEditModal);
    }
    if (dom.itineraryEditSave) {
      dom.itineraryEditSave.addEventListener('click', saveItineraryEdit);
    }
    if (dom.ledgerAddEntry) dom.ledgerAddEntry.addEventListener('click', function() { openLedgerEntryModal(null); });
    if (dom.ledgerAddCategory) dom.ledgerAddCategory.addEventListener('click', openLedgerCategoryModal);
    if (dom.ledgerBudgetOptions) {
      dom.ledgerBudgetOptions.addEventListener('click', function(e) {
        var option = e.target.closest('[data-ledger-budget]');
        if (option) selectLedgerBudget(option.dataset.ledgerBudget);
      });
    }
    if (dom.ledgerEntryList) {
      dom.ledgerEntryList.addEventListener('click', function(e) {
        var deleteButton = e.target.closest('[data-delete-ledger-entry]');
        if (deleteButton) {
          e.stopPropagation();
          deleteLedgerEntry(deleteButton.dataset.deleteLedgerEntry);
          return;
        }
        var entry = e.target.closest('[data-edit-ledger-entry]');
        if (entry) openLedgerEntryModal(entry.dataset.editLedgerEntry);
      });
    }
    if (dom.ledgerCategoryList) {
      dom.ledgerCategoryList.addEventListener('click', function(e) {
        var deleteButton = e.target.closest('[data-delete-ledger-category]');
        if (deleteButton) deleteLedgerCategory(deleteButton.dataset.deleteLedgerCategory);
      });
    }
    var ledgerEntryOverlay = document.getElementById('ledgerEntryOverlay');
    var ledgerEntryClose = document.getElementById('ledgerEntryClose');
    var ledgerEntryCancel = document.getElementById('ledgerEntryCancel');
    var ledgerEntrySave = document.getElementById('ledgerEntrySave');
    if (ledgerEntryOverlay) ledgerEntryOverlay.addEventListener('click', closeLedgerEntryModal);
    if (ledgerEntryClose) ledgerEntryClose.addEventListener('click', closeLedgerEntryModal);
    if (ledgerEntryCancel) ledgerEntryCancel.addEventListener('click', closeLedgerEntryModal);
    if (ledgerEntrySave) ledgerEntrySave.addEventListener('click', saveLedgerEntry);

    var ledgerCategoryOverlay = document.getElementById('ledgerCategoryOverlay');
    var ledgerCategoryClose = document.getElementById('ledgerCategoryClose');
    var ledgerCategoryCancel = document.getElementById('ledgerCategoryCancel');
    var ledgerCategorySave = document.getElementById('ledgerCategorySave');
    var ledgerColorOptions = document.getElementById('ledgerColorOptions');
    if (ledgerCategoryOverlay) ledgerCategoryOverlay.addEventListener('click', closeLedgerCategoryModal);
    if (ledgerCategoryClose) ledgerCategoryClose.addEventListener('click', closeLedgerCategoryModal);
    if (ledgerCategoryCancel) ledgerCategoryCancel.addEventListener('click', closeLedgerCategoryModal);
    if (ledgerCategorySave) ledgerCategorySave.addEventListener('click', saveLedgerCategory);
    if (ledgerColorOptions) {
      ledgerColorOptions.addEventListener('click', function(e) {
        var color = e.target.closest('.ledger-color-option');
        if (!color) return;
        ledgerSelectedColor = color.dataset.color;
        var options = ledgerColorOptions.querySelectorAll('.ledger-color-option');
        for (var i = 0; i < options.length; i++) {
          options[i].classList.toggle('ledger-color-option--selected', options[i] === color);
        }
      });
    }
    bindDetailSheetPush();
    if (dom.folderModalOverlay) {
      dom.folderModalOverlay.addEventListener('click', closeNewFolderModal);
    }
    if (dom.folderModalClose) {
      dom.folderModalClose.addEventListener('click', closeNewFolderModal);
    }
    if (dom.createFolderBtn) {
      dom.createFolderBtn.addEventListener('click', createFolder);
    }
    if (dom.moveFolderOverlay) {
      dom.moveFolderOverlay.addEventListener('click', closeMoveFolderModal);
    }
    if (dom.moveFolderClose) {
      dom.moveFolderClose.addEventListener('click', closeMoveFolderModal);
    }
    if (dom.shareOverlay) {
      dom.shareOverlay.addEventListener('click', closeShareModal);
    }
    if (dom.shareClose) {
      dom.shareClose.addEventListener('click', closeShareModal);
    }
    if (dom.confirmOverlay) {
      dom.confirmOverlay.addEventListener('click', closeConfirm);
    }
    if (dom.confirmCancel) {
      dom.confirmCancel.addEventListener('click', closeConfirm);
    }
    if (dom.confirmOk) {
      dom.confirmOk.addEventListener('click', handleConfirmOk);
    }

    var shareBtns = document.querySelectorAll('.share-option');
    for (var sb = 0; sb < shareBtns.length; sb++) {
      shareBtns[sb].addEventListener('click', function() {
        closeShareModal();
        showToast('分享功能开发中');
      });
    }

    if (dom.destinationPicker) {
      dom.destinationPicker.addEventListener('click', openCityPicker);
    }
    if (dom.backFromCityPicker) {
      dom.backFromCityPicker.addEventListener('click', closeCityPicker);
    }

    if (dom.cityPickerSearch) {
      dom.cityPickerSearch.addEventListener('input', function() {
        renderCityPickerList(this.value);
      });
    }

    if (dom.cityPickerTabs) {
      var cityPickerTabs = dom.cityPickerTabs.querySelectorAll('.city-picker__tab');
      for (var cpt = 0; cpt < cityPickerTabs.length; cpt++) {
        (function(tab) {
          tab.addEventListener('click', function() {
            switchCityPickerTab(tab.dataset.cityTab);
          });
        })(cityPickerTabs[cpt]);
      }
    }

    if (dom.cityPickerCategories) {
      var cityPickerCategories = dom.cityPickerCategories.querySelectorAll('.city-category-tab');
      for (var cpct = 0; cpct < cityPickerCategories.length; cpct++) {
        (function(tab) {
          tab.addEventListener('click', function() {
            switchCityPickerCategory(tab.dataset.category);
          });
        })(cityPickerCategories[cpct]);
      }
    }

    if (dom.npDepartureDate) {
      dom.npDepartureDate.addEventListener('change', function() {
        state.form.departureDate = this.value;
      });
    }

    if (dom.npDaySelector) {
      var dayBtns = dom.npDaySelector.querySelectorAll('.day-btn:not(.day-btn--custom)');
      for (var d = 0; d < dayBtns.length; d++) {
        dayBtns[d].addEventListener('click', function() {
          state.form.days = parseInt(this.dataset.days);
          state.form.isCustomDay = false;
          updateNpDayBtns();
        });
      }

      var customDayBtn = document.getElementById('npCustomDayBtn');
      if (customDayBtn) {
        customDayBtn.addEventListener('click', function() {
          if (state.form.isCustomDay) return;
          state.form.isCustomDay = true;
          if (!state.form.customDays || state.form.customDays < 1) {
            state.form.customDays = 7;
          }
          state.form.days = state.form.customDays;
          updateNpDayBtns();
          var input = customDayBtn.querySelector('.day-btn--custom-input');
          if (input) {
            input.focus();
            input.select();
          }
        });
      }
    }

    if (dom.npBudgetOptions) {
      var budgetCards = dom.npBudgetOptions.querySelectorAll('.budget-card');
      for (var b = 0; b < budgetCards.length; b++) {
        budgetCards[b].addEventListener('click', function() {
          state.form.budget = this.dataset.budget;
          updateNpBudgetCards();
        });
      }
    }

    if (dom.npPreferenceTags) {
      var prefTags = dom.npPreferenceTags.querySelectorAll('.tag');
      for (var p = 0; p < prefTags.length; p++) {
        prefTags[p].addEventListener('click', function() {
          var pref = this.dataset.pref;
          var idx = state.form.preferences.indexOf(pref);
          if (idx > -1) {
            state.form.preferences.splice(idx, 1);
            this.classList.remove('tag--active');
          } else {
            state.form.preferences.push(pref);
            this.classList.add('tag--active');
          }
        });
      }
    }

    if (dom.npStyleOptions) {
      var styleCards = dom.npStyleOptions.querySelectorAll('.style-card');
      for (var s = 0; s < styleCards.length; s++) {
        styleCards[s].addEventListener('click', function() {
          state.form.travelStyle = this.dataset.style;
          updateNpStyleCards();
        });
      }
    }

    if (dom.npGenerateBtn) {
      dom.npGenerateBtn.addEventListener('click', startGeneration);
    }

    dom.backFromDetail.addEventListener('click', closePlanDetail);

    for (var t = 0; t < dom.detailTabBtns.length; t++) {
      dom.detailTabBtns[t].addEventListener('click', function() {
        state.detail.currentTab = this.dataset.tab;
        updateDetailTabs();
        if (this.dataset.tab === 'itinerary') {
          renderDetailMap();
          setTimeout(initMapReveal, 50);
        } else {
          resetMapRevealState();
        }
      });
    }

    dom.detailShareBtn.addEventListener('click', function() {
      showToast('分享功能开发中');
    });

    dom.detailFavBtn.addEventListener('click', function() {
      showToast('已收藏');
    });

    dom.poiSheetOverlay.addEventListener('click', closePoiBottomSheet);
    dom.poiAddBtn.addEventListener('click', function() {
      showToast('已加入行程');
      closePoiBottomSheet();
    });
    dom.poiNavBtn.addEventListener('click', function() {
      showToast('导航功能开发中');
    });

    // 交通弹窗
    var transportModalOverlay = document.getElementById('transportModalOverlay');
    var transportModalConfirm = document.getElementById('transportModalConfirm');
    if (transportModalOverlay) {
      transportModalOverlay.addEventListener('click', closeTransportModal);
    }
    if (transportModalConfirm) {
      transportModalConfirm.addEventListener('click', confirmTransportChange);
    }

    // 金额编辑弹窗
    var costEditModalOverlay = document.getElementById('costEditModalOverlay');
    var costEditCancel = document.getElementById('costEditCancel');
    var costEditConfirm = document.getElementById('costEditConfirm');
    var costEditInput = document.getElementById('costEditInput');
    if (costEditModalOverlay) {
      costEditModalOverlay.addEventListener('click', closeCostEditModal);
    }
    if (costEditCancel) {
      costEditCancel.addEventListener('click', closeCostEditModal);
    }
    if (costEditConfirm) {
      costEditConfirm.addEventListener('click', confirmCostEdit);
    }
    if (costEditInput) {
      costEditInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
          confirmCostEdit();
        }
      });
    }

    var quickPriceBtns = document.querySelectorAll('.cost-quick-btn');
    for (var q = 0; q < quickPriceBtns.length; q++) {
      quickPriceBtns[q].addEventListener('click', function() {
        var price = this.dataset.price;
        if (costEditInput) {
          costEditInput.value = price;
        }
      });
    }

    for (var c = 0; c < dom.categoryChips.length; c++) {
      dom.categoryChips[c].addEventListener('click', function() {
        state.discover.currentCategory = this.dataset.category;
        for (var cc = 0; cc < dom.categoryChips.length; cc++) {
          dom.categoryChips[cc].classList.remove('category-chip--active');
        }
        this.classList.add('category-chip--active');
        renderDiscoverList(state.discover.currentCategory);
      });
    }

    dom.backFromDiscoverDetail.addEventListener('click', closeDiscoverDetail);

    if (dom.discoverDayTabs) {
      dom.discoverDayTabs.addEventListener('click', function(event) {
        var button = event.target.closest('[data-discover-day]');
        if (!button || !state.discover.currentItinerary) return;
        renderDiscoverDay(state.discover.currentItinerary, parseInt(button.dataset.discoverDay, 10));
      });
    }

    if (dom.discoverFollowBtn) {
      dom.discoverFollowBtn.addEventListener('click', function() {
        var active = this.classList.toggle('follow-btn--active');
        this.textContent = active ? '已关注' : '关注';
        showToast(active ? '已关注作者' : '已取消关注');
      });
    }

    function shareDiscoverPlan() {
      openShareModal();
    }
    if (dom.discoverHeaderShareBtn) dom.discoverHeaderShareBtn.addEventListener('click', shareDiscoverPlan);
    if (dom.discoverShareBtn) dom.discoverShareBtn.addEventListener('click', shareDiscoverPlan);

    dom.discoverLikeBtn.addEventListener('click', function() {
      var likes = parseInt(dom.discoverLikes.textContent);
      var active = this.classList.toggle('action-btn--active');
      dom.discoverLikes.textContent = likes + (active ? 1 : -1);
      showToast(active ? '点赞成功' : '已取消点赞');
    });

    dom.discoverFavBtn.addEventListener('click', function() {
      var favs = parseInt(dom.discoverFavs.textContent);
      var active = this.classList.toggle('action-btn--active');
      dom.discoverFavs.textContent = favs + (active ? 1 : -1);
      showToast(active ? '收藏成功' : '已取消收藏');
    });

    dom.reusePlanBtn.addEventListener('click', reusePlan);

    for (var at = 0; at < dom.assistantTabs.length; at++) {
      dom.assistantTabs[at].addEventListener('click', function() {
        switchAssistantTab(this.dataset.assistantTab);
      });
    }

    if (dom.assistantSearchBtn) {
      dom.assistantSearchBtn.addEventListener('click', function() {
        showToast('搜索功能开发中');
      });
    }

    if (dom.assistantContent) {
      dom.assistantContent.addEventListener('click', function(event) {
        var topicButton = event.target.closest('[data-assistant-topic]');
        if (topicButton) {
          var topic = topicButton.dataset.assistantTopic;
          state.assistant.selectedInfo = topic;
          renderAssistantContent();
          var target = document.getElementById('assistant-info-' + topic);
          if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    }

    dom.backFromRecycleBin.addEventListener('click', closeRecycleBin);

    for (var m = 0; m < dom.menuItems.length; m++) {
      dom.menuItems[m].addEventListener('click', function() {
        var menu = this.dataset.menu;
        if (menu === 'recycle-bin') {
          openRecycleBin();
        } else {
          showToast('功能开发中');
        }
      });
    }

  }

  // ========================================
  // 初始化
  // ========================================

  function init() {
    cacheDom();
    bindEvents();
    renderFolderBar();
    renderPlanList();
    initMePage();
    initAssistantPage();

    if (dom.planList) {
      dom.planList.addEventListener('contextmenu', function(e) {
        e.preventDefault();
        return false;
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
