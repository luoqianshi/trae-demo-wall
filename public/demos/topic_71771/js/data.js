/**
 * 今天吃什么 - 食物数据集
 * 包含100+种常见食物，覆盖各时段和菜系
 * searchKeywords 字段为未来商家地图功能预留
 */

const foodDatabase = [
  // ========== 早餐 ==========
  {
    id: 1,
    name: "豆浆油条",
    emoji: "🥖",
    mealType: ["早餐"],
    cuisine: "中餐",
    price: 40,
    tags: ["家常", "面食", "热食"],
    description: "经典搭配，香脆油条配温热豆浆",
    searchKeywords: ["豆浆油条", "早餐店", "中式早餐"]
  },
  {
    id: 2,
    name: "小笼包",
    emoji: "🥟",
    mealType: ["早餐", "午餐"],
    cuisine: "中餐",
    price: 50,
    tags: ["精致", "面食", "热食"],
    description: "皮薄汁多，一口咬下满嘴鲜香",
    searchKeywords: ["小笼包", "包子铺", "上海菜"]
  },
  {
    id: 3,
    name: "皮蛋瘦肉粥",
    emoji: "🍲",
    mealType: ["早餐", "夜宵"],
    cuisine: "中餐",
    price: 30,
    tags: ["家常", "汤羹", "清淡"],
    description: "绵密暖胃，早餐夜宵两相宜",
    searchKeywords: ["皮蛋瘦肉粥", "粥店", "广式早餐"]
  },
  {
    id: 4,
    name: "三明治",
    emoji: "🥪",
    mealType: ["早餐", "午餐"],
    cuisine: "西餐",
    price: 85,
    tags: ["清淡", "快捷"],
    description: "层层叠加，营养与美味并存",
    searchKeywords: ["三明治", "轻食", "西餐早餐"]
  },
  {
    id: 5,
    name: "煎饼果子",
    emoji: "🌯",
    mealType: ["早餐"],
    cuisine: "小吃",
    price: 25,
    tags: ["家常", "面食", "热食"],
    description: "外酥里嫩，街头早餐之王",
    searchKeywords: ["煎饼果子", "煎饼摊", "天津小吃"]
  },
  {
    id: 6,
    name: "日式饭团",
    emoji: "🍙",
    mealType: ["早餐", "午餐"],
    cuisine: "日料",
    price: 65,
    tags: ["精致", "米饭", "清淡"],
    description: "简单却不失风味，携带着海的鲜甜",
    searchKeywords: ["饭团", "日式早餐", "便利店"]
  },
  {
    id: 7,
    name: "包子",
    emoji: "🥟",
    mealType: ["早餐", "午餐"],
    cuisine: "中餐",
    price: 75,
    tags: ["家常", "面食", "热食"],
    description: "肉馅鲜美多汁，面皮松软可口",
    searchKeywords: ["包子", "早餐店", "中式早餐"]
  },
  {
    id: 8,
    name: "葱油饼",
    emoji: "🫓",
    mealType: ["早餐"],
    cuisine: "中餐",
    price: 80,
    tags: ["家常", "面食", "热食"],
    description: "层起酥脆，葱香四溢的早晨",
    searchKeywords: ["葱油饼", "早餐店", "中式早餐"]
  },
  {
    id: 9,
    name: "烧麦",
    emoji: "🥟",
    mealType: ["早餐", "午餐"],
    cuisine: "中餐",
    price: 50,
    tags: ["精致", "面食", "热食"],
    description: "糯米馅料饱满，虾仁鲜肉一口满足",
    searchKeywords: ["烧麦", "点心店", "粤式早茶"]
  },
  {
    id: 10,
    name: "手抓饼",
    emoji: "🫓",
    mealType: ["早餐"],
    cuisine: "小吃",
    price: 10,
    tags: ["面食", "热食", "快捷"],
    description: "层层酥脆，夹蛋夹肠更满足",
    searchKeywords: ["手抓饼", "早餐摊", "台式小吃"]
  },
  {
    id: 11,
    name: "肠粉",
    emoji: "🥟",
    mealType: ["早餐", "午餐"],
    cuisine: "中餐",
    price: 30,
    tags: ["精致", "清淡", "热食"],
    description: "滑嫩爽口，广式早餐的灵魂",
    searchKeywords: ["肠粉", "广式早餐", "广东小吃"]
  },
  {
    id: 12,
    name: "油条",
    emoji: "🥖",
    mealType: ["早餐"],
    cuisine: "中餐",
    price: 55,
    tags: ["家常", "面食", "热食"],
    description: "金黄酥脆，配粥配豆浆都绝配",
    searchKeywords: ["油条", "早餐店", "中式早餐"]
  },
  {
    id: 13,
    name: "蛋饼",
    emoji: "🥚",
    mealType: ["早餐"],
    cuisine: "小吃",
    price: 25,
    tags: ["家常", "快捷", "热食"],
    description: "蛋香浓郁，简单快手的早餐选择",
    searchKeywords: ["蛋饼", "早餐摊", "中式早餐"]
  },
  {
    id: 14,
    name: "吐司抹黄油",
    emoji: "🍞",
    mealType: ["早餐"],
    cuisine: "西餐",
    price: 80,
    tags: ["清淡", "快捷", "家常"],
    description: "酥脆吐司遇上融化黄油，简约经典",
    searchKeywords: ["吐司", "面包店", "西式早餐"]
  },
  {
    id: 15,
    name: "煎饺",
    emoji: "🥟",
    mealType: ["早餐", "午餐"],
    cuisine: "中餐",
    price: 30,
    tags: ["家常", "面食", "热食"],
    description: "底部金黄酥脆，内馅鲜美多汁",
    searchKeywords: ["煎饺", "饺子馆", "中式早餐"]
  },

  // ========== 午餐/晚餐 中餐 川湘菜 ==========
  {
    id: 16,
    name: "红烧肉",
    emoji: "🍖",
    mealType: ["午餐", "晚餐"],
    cuisine: "中餐",
    price: 25,
    tags: ["家常", "下饭", "热菜", "重口"],
    description: "肥而不腻，入口即化，配饭一绝",
    searchKeywords: ["红烧肉", "家常菜", "本帮菜"]
  },
  {
    id: 17,
    name: "麻婆豆腐",
    emoji: "🥘",
    mealType: ["午餐", "晚餐"],
    cuisine: "中餐",
    price: 75,
    tags: ["家常", "下饭", "热菜", "重口"],
    description: "麻辣鲜香，豆腐嫩滑入味",
    searchKeywords: ["麻婆豆腐", "川菜", "四川菜"]
  },
  {
    id: 18,
    name: "宫保鸡丁",
    emoji: "🍗",
    mealType: ["午餐", "晚餐"],
    cuisine: "中餐",
    price: 30,
    tags: ["家常", "下饭", "热菜"],
    description: "花生酥脆，鸡肉嫩滑，酸甜微辣",
    searchKeywords: ["宫保鸡丁", "川菜", "家常菜"]
  },
  {
    id: 19,
    name: "清蒸鲈鱼",
    emoji: "🐟",
    mealType: ["午餐", "晚餐"],
    cuisine: "中餐",
    price: 50,
    tags: ["精致", "清淡", "热菜"],
    description: "鲜嫩细滑，原汁原味健康之选",
    searchKeywords: ["清蒸鲈鱼", "粤菜", "海鲜"]
  },
  {
    id: 20,
    name: "糖醋排骨",
    emoji: "🍖",
    mealType: ["午餐", "晚餐"],
    cuisine: "中餐",
    price: 25,
    tags: ["家常", "下饭", "热菜"],
    description: "酸甜可口，外酥里嫩老少皆宜",
    searchKeywords: ["糖醋排骨", "江浙菜", "家常菜"]
  },
  {
    id: 21,
    name: "北京烤鸭",
    emoji: "🦆",
    mealType: ["午餐", "晚餐"],
    cuisine: "中餐",
    price: 70,
    tags: ["精致", "热菜"],
    description: "皮脆肉嫩，蘸酱卷饼，中华美食名片",
    searchKeywords: ["北京烤鸭", "烤鸭店", "京菜"]
  },
  {
    id: 22,
    name: "兰州拉面",
    emoji: "🍜",
    mealType: ["午餐", "晚餐"],
    cuisine: "中餐",
    price: 45,
    tags: ["面食", "热食", "家常"],
    description: "一清二白三红四绿五黄，汤鲜味美",
    searchKeywords: ["兰州拉面", "牛肉拉面", "面馆"]
  },
  {
    id: 23,
    name: "火锅",
    emoji: "🍲",
    mealType: ["午餐", "晚餐", "夜宵"],
    cuisine: "中餐",
    price: 40,
    tags: ["火锅", "热食", "重口", "聚餐"],
    description: "热气腾腾，涮出人间烟火味",
    searchKeywords: ["火锅", "重庆火锅", "四川火锅"]
  },
  {
    id: 24,
    name: "酸菜鱼",
    emoji: "🐟",
    mealType: ["午餐", "晚餐"],
    cuisine: "中餐",
    price: 30,
    tags: ["热菜", "重口", "下饭"],
    description: "酸爽开胃，鱼肉滑嫩汤底浓郁",
    searchKeywords: ["酸菜鱼", "川菜", "鱼火锅"]
  },
  {
    id: 25,
    name: "炒饭",
    emoji: "🍚",
    mealType: ["午餐", "晚餐"],
    cuisine: "中餐",
    price: 45,
    tags: ["家常", "米饭", "快捷"],
    description: "粒粒分明，简单食材炒出大满足",
    searchKeywords: ["炒饭", "扬州炒饭", "中式快餐"]
  },
  {
    id: 26,
    name: "鱼香肉丝",
    emoji: "🥩",
    mealType: ["午餐", "晚餐"],
    cuisine: "中餐",
    price: 65,
    tags: ["家常", "下饭", "热菜"],
    description: "酸甜微辣，肉丝嫩滑木耳脆爽",
    searchKeywords: ["鱼香肉丝", "川菜", "家常菜"]
  },
  {
    id: 27,
    name: "水煮牛肉",
    emoji: "🥩",
    mealType: ["午餐", "晚餐"],
    cuisine: "中餐",
    price: 60,
    tags: ["热菜", "重口", "下饭", "麻辣"],
    description: "麻辣鲜香，牛肉嫩滑在红油中翻滚",
    searchKeywords: ["水煮牛肉", "川菜", "四川菜"]
  },
  {
    id: 28,
    name: "回锅肉",
    emoji: "🥓",
    mealType: ["午餐", "晚餐"],
    cuisine: "中餐",
    price: 40,
    tags: ["家常", "下饭", "热菜"],
    description: "肥瘦相间，蒜苗配五花香气十足",
    searchKeywords: ["回锅肉", "川菜", "家常菜"]
  },
  {
    id: 29,
    name: "辣子鸡",
    emoji: "🍗",
    mealType: ["午餐", "晚餐"],
    cuisine: "中餐",
    price: 65,
    tags: ["热菜", "重口", "麻辣"],
    description: "干辣椒裹着酥脆鸡块，越吃越香",
    searchKeywords: ["辣子鸡", "川菜", "重庆菜"]
  },
  {
    id: 30,
    name: "剁椒鱼头",
    emoji: "🐟",
    mealType: ["午餐", "晚餐"],
    cuisine: "中餐",
    price: 30,
    tags: ["热菜", "重口", "下饭", "蒸菜"],
    description: "鲜辣红亮，鱼肉嫩滑入味",
    searchKeywords: ["剁椒鱼头", "湘菜", "湖南菜"]
  },
  {
    id: 31,
    name: "毛血旺",
    emoji: "🥘",
    mealType: ["午餐", "晚餐"],
    cuisine: "中餐",
    price: 55,
    tags: ["热菜", "重口", "麻辣", "下饭"],
    description: "红油滚烫，食材丰富麻辣过瘾",
    searchKeywords: ["毛血旺", "川菜", "重庆菜"]
  },
  {
    id: 32,
    name: "口水鸡",
    emoji: "🍗",
    mealType: ["午餐", "晚餐"],
    cuisine: "中餐",
    price: 50,
    tags: ["热菜", "重口", "麻辣"],
    description: "红油浇淋，鸡肉嫩滑辣而不燥",
    searchKeywords: ["口水鸡", "川菜", "凉拌菜"]
  },

  // ========== 午餐/晚餐 中餐 粤菜/江浙/东北 ==========
  {
    id: 33,
    name: "白切鸡",
    emoji: "🍗",
    mealType: ["午餐", "晚餐"],
    cuisine: "中餐",
    price: 40,
    tags: ["精致", "清淡", "热菜"],
    description: "皮爽肉滑，蘸姜葱酱原汁原味",
    searchKeywords: ["白切鸡", "粤菜", "广东菜"]
  },
  {
    id: 34,
    name: "蒜蓉粉丝蒸虾",
    emoji: "🦐",
    mealType: ["午餐", "晚餐"],
    cuisine: "中餐",
    price: 45,
    tags: ["精致", "清淡", "蒸菜", "海鲜"],
    description: "蒜香浓郁，粉丝吸满虾汁鲜美",
    searchKeywords: ["蒜蓉粉丝蒸虾", "粤菜", "海鲜"]
  },
  {
    id: 35,
    name: "叉烧",
    emoji: "🥩",
    mealType: ["午餐", "晚餐"],
    cuisine: "中餐",
    price: 60,
    tags: ["精致", "热菜"],
    description: "蜜汁香浓，肥瘦均匀入口即化",
    searchKeywords: ["叉烧", "粤菜", "烧腊"]
  },
  {
    id: 36,
    name: "干炒牛河",
    emoji: "🍜",
    mealType: ["午餐", "晚餐", "夜宵"],
    cuisine: "中餐",
    price: 55,
    tags: ["面食", "热食", "下饭"],
    description: "镬气十足，河粉嫩滑牛肉香嫩",
    searchKeywords: ["干炒牛河", "粤菜", "广东小吃"]
  },
  {
    id: 37,
    name: "东坡肉",
    emoji: "🍖",
    mealType: ["午餐", "晚餐"],
    cuisine: "中餐",
    price: 60,
    tags: ["精致", "热菜", "重口"],
    description: "酒香浓郁，酥烂不腻的千古名菜",
    searchKeywords: ["东坡肉", "杭帮菜", "浙江菜"]
  },
  {
    id: 38,
    name: "松鼠桂鱼",
    emoji: "🐟",
    mealType: ["午餐", "晚餐"],
    cuisine: "中餐",
    price: 40,
    tags: ["精致", "酸甜", "热菜"],
    description: "造型精美，酸甜酱汁浇淋酥炸鱼身",
    searchKeywords: ["松鼠桂鱼", "苏菜", "江苏菜"]
  },
  {
    id: 39,
    name: "小炒黄牛肉",
    emoji: "🥩",
    mealType: ["午餐", "晚餐"],
    cuisine: "中餐",
    price: 40,
    tags: ["热菜", "下饭", "重口"],
    description: "黄牛肉嫩滑，辣椒爆香下饭神器",
    searchKeywords: ["小炒黄牛肉", "湘菜", "湖南菜"]
  },
  {
    id: 40,
    name: "锅包肉",
    emoji: "🍖",
    mealType: ["午餐", "晚餐"],
    cuisine: "中餐",
    price: 80,
    tags: ["酸甜", "油炸", "热菜"],
    description: "外酥内嫩，酸甜挂汁的东北经典",
    searchKeywords: ["锅包肉", "东北菜", "黑龙江菜"]
  },
  {
    id: 41,
    name: "地三鲜",
    emoji: "🍆",
    mealType: ["午餐", "晚餐"],
    cuisine: "中餐",
    price: 70,
    tags: ["家常", "素食", "下饭", "热菜"],
    description: "土豆茄子青椒，东北人的朴素美味",
    searchKeywords: ["地三鲜", "东北菜", "家常菜"]
  },
  {
    id: 42,
    name: "西红柿炒鸡蛋",
    emoji: "🍳",
    mealType: ["午餐", "晚餐"],
    cuisine: "中餐",
    price: 25,
    tags: ["家常", "下饭", "热菜", "清淡"],
    description: "国民第一家常菜，酸甜可口百吃不厌",
    searchKeywords: ["西红柿炒鸡蛋", "家常菜", "中式快餐"]
  },
  {
    id: 43,
    name: "黄焖鸡米饭",
    emoji: "🍚",
    mealType: ["午餐", "晚餐"],
    cuisine: "中餐",
    price: 25,
    tags: ["家常", "米饭", "热食", "下饭"],
    description: "酱香浓郁，鸡肉软烂入味配白饭",
    searchKeywords: ["黄焖鸡米饭", "中式快餐", "家常菜"]
  },
  {
    id: 44,
    name: "煲仔饭",
    emoji: "🍚",
    mealType: ["午餐", "晚餐"],
    cuisine: "中餐",
    price: 35,
    tags: ["精致", "米饭", "热食"],
    description: "锅巴焦脆，腊味飘香，广式一煲满足",
    searchKeywords: ["煲仔饭", "粤菜", "广东快餐"]
  },
  {
    id: 45,
    name: "水煮鱼",
    emoji: "🐟",
    mealType: ["午餐", "晚餐"],
    cuisine: "中餐",
    price: 55,
    tags: ["热菜", "重口", "麻辣", "下饭"],
    description: "麻辣鲜香，鱼片薄如蝉翼滑嫩",
    searchKeywords: ["水煮鱼", "川菜", "重庆菜"]
  },
  {
    id: 46,
    name: "夫妻肺片",
    emoji: "🥩",
    mealType: ["午餐", "晚餐"],
    cuisine: "中餐",
    price: 75,
    tags: ["麻辣", "精致", "冷菜"],
    description: "红油浸润，牛杂薄切麻辣鲜香",
    searchKeywords: ["夫妻肺片", "川菜", "凉拌菜"]
  },
  {
    id: 47,
    name: "蛋炒饭",
    emoji: "🍚",
    mealType: ["午餐", "晚餐"],
    cuisine: "中餐",
    price: 45,
    tags: ["家常", "米饭", "快捷"],
    description: "最朴素的美味，蛋香与饭香交融",
    searchKeywords: ["蛋炒饭", "中式快餐", "家常菜"]
  },
  {
    id: 48,
    name: "小龙虾",
    emoji: "🦞",
    mealType: ["晚餐", "夜宵"],
    cuisine: "中餐",
    price: 25,
    tags: ["重口", "麻辣", "聚餐", "热食"],
    description: "麻辣鲜香，剥虾的快乐谁懂",
    searchKeywords: ["小龙虾", "麻辣小龙虾", "夜宵"]
  },

  // ========== 中式汤面/米线 ==========
  {
    id: 49,
    name: "炸酱面",
    emoji: "🍜",
    mealType: ["午餐", "晚餐"],
    cuisine: "中餐",
    price: 65,
    tags: ["面食", "家常", "热食"],
    description: "黄瓜丝配肉酱，老北京的味道",
    searchKeywords: ["炸酱面", "京菜", "面馆"]
  },
  {
    id: 50,
    name: "担担面",
    emoji: "🍜",
    mealType: ["午餐", "晚餐", "夜宵"],
    cuisine: "中餐",
    price: 45,
    tags: ["面食", "麻辣", "热食"],
    description: "芝麻酱香配肉臊，麻辣微甜",
    searchKeywords: ["担担面", "川菜", "面馆"]
  },
  {
    id: 51,
    name: "热干面",
    emoji: "🍜",
    mealType: ["早餐", "午餐"],
    cuisine: "小吃",
    price: 20,
    tags: ["面食", "热食", "快捷"],
    description: "芝麻酱拌匀，浓香暖胃的武汉味道",
    searchKeywords: ["热干面", "武汉小吃", "面馆"]
  },
  {
    id: 52,
    name: "过桥米线",
    emoji: "🍜",
    mealType: ["午餐", "晚餐"],
    cuisine: "中餐",
    price: 65,
    tags: ["面食", "热食", "汤羹"],
    description: "滚烫鸡汤浇灌，配料丰富层次分明",
    searchKeywords: ["过桥米线", "云南菜", "米线店"]
  },
  {
    id: 53,
    name: "重庆小面",
    emoji: "🍜",
    mealType: ["早餐", "午餐"],
    cuisine: "小吃",
    price: 25,
    tags: ["面食", "麻辣", "热食"],
    description: "麻辣鲜香，一碗小面唤醒一整天",
    searchKeywords: ["重庆小面", "重庆小吃", "面馆"]
  },
  {
    id: 54,
    name: "刀削面",
    emoji: "🍜",
    mealType: ["午餐", "晚餐"],
    cuisine: "中餐",
    price: 75,
    tags: ["面食", "热食", "家常"],
    description: "面条厚薄不一口感筋道，浇头丰富",
    searchKeywords: ["刀削面", "山西面食", "面馆"]
  },
  {
    id: 55,
    name: "桂林米粉",
    emoji: "🍜",
    mealType: ["早餐", "午餐"],
    cuisine: "小吃",
    price: 15,
    tags: ["面食", "热食", "清淡"],
    description: "米粉细腻顺滑，卤水浇头回味无穷",
    searchKeywords: ["桂林米粉", "广西小吃", "米粉店"]
  },
  {
    id: 56,
    name: "酸辣粉",
    emoji: "🍜",
    mealType: ["午餐", "晚餐", "夜宵"],
    cuisine: "小吃",
    price: 25,
    tags: ["面食", "酸辣", "热食"],
    description: "红薯粉Q弹，酸辣开胃停不下来",
    searchKeywords: ["酸辣粉", "重庆小吃", "酸辣粉店"]
  },
  {
    id: 57,
    name: "阳春面",
    emoji: "🍜",
    mealType: ["早餐", "午餐", "夜宵"],
    cuisine: "中餐",
    price: 25,
    tags: ["面食", "清淡", "汤羹", "家常"],
    description: "清汤素面，简约中见真味",
    searchKeywords: ["阳春面", "江南面食", "面馆"]
  },

  // ========== 西餐 ==========
  {
    id: 58,
    name: "牛排",
    emoji: "🥩",
    mealType: ["午餐", "晚餐"],
    cuisine: "西餐",
    price: 50,
    tags: ["精致", "热菜"],
    description: "外焦里嫩，肉汁丰盈的满足感",
    searchKeywords: ["牛排", "西餐厅", "扒房"]
  },
  {
    id: 59,
    name: "意大利面",
    emoji: "🍝",
    mealType: ["午餐", "晚餐"],
    cuisine: "西餐",
    price: 95,
    tags: ["面食", "精致", "热菜"],
    description: "酱汁浓郁裹满每一根面条",
    searchKeywords: ["意大利面", "意式餐厅", "西餐"]
  },
  {
    id: 60,
    name: "披萨",
    emoji: "🍕",
    mealType: ["午餐", "晚餐"],
    cuisine: "西餐",
    price: 65,
    tags: ["面食", "热食", "聚餐"],
    description: "芝士拉丝，配料满满的大满足",
    searchKeywords: ["披萨", "比萨", "意式餐厅"]
  },
  {
    id: 61,
    name: "凯撒沙拉",
    emoji: "🥗",
    mealType: ["午餐", "晚餐"],
    cuisine: "西餐",
    price: 85,
    tags: ["清淡", "素食", "健康"],
    description: "清爽脆嫩，健康与美味兼得",
    searchKeywords: ["凯撒沙拉", "轻食", "沙拉吧"]
  },
  {
    id: 62,
    name: "奶油蘑菇汤",
    emoji: "🥣",
    mealType: ["午餐", "晚餐"],
    cuisine: "西餐",
    price: 90,
    tags: ["汤羹", "热食", "精致"],
    description: "浓郁顺滑，蘑菇香气四溢",
    searchKeywords: ["奶油蘑菇汤", "西餐厅", "法式汤品"]
  },
  {
    id: 63,
    name: "法式焗蜗牛",
    emoji: "🐌",
    mealType: ["晚餐"],
    cuisine: "西餐",
    price: 105,
    tags: ["精致", "热菜"],
    description: "蒜香黄油焗烤，法式经典前菜",
    searchKeywords: ["焗蜗牛", "法餐", "西餐厅"]
  },
  {
    id: 64,
    name: "烤羊排",
    emoji: "🥩",
    mealType: ["午餐", "晚餐"],
    cuisine: "西餐",
    price: 105,
    tags: ["精致", "热菜", "重口"],
    description: "外焦里嫩，羊脂香气浓郁",
    searchKeywords: ["烤羊排", "西餐厅", "烧烤"]
  },
  {
    id: 65,
    name: "焗饭",
    emoji: "🍚",
    mealType: ["午餐", "晚餐"],
    cuisine: "西餐",
    price: 60,
    tags: ["面食", "热食", "精致"],
    description: "芝士焗烤，浓郁拉丝的满足",
    searchKeywords: ["焗饭", "西式简餐", "茶餐厅"]
  },
  {
    id: 66,
    name: "薯角",
    emoji: "🥔",
    mealType: ["午餐", "晚餐"],
    cuisine: "西餐",
    price: 45,
    tags: ["油炸", "热食", "小吃"],
    description: "外酥内软，撒上香料更有味",
    searchKeywords: ["薯角", "西餐厅", "美式快餐"]
  },
  {
    id: 67,
    name: "焗烤通心粉",
    emoji: "🧀",
    mealType: ["午餐", "晚餐"],
    cuisine: "西餐",
    price: 120,
    tags: ["面食", "热食", "精致"],
    description: "芝士通心粉焗烤至金黄，浓郁满足",
    searchKeywords: ["焗烤通心粉", "美式西餐", "意式简餐"]
  },

  // ========== 快餐 ==========
  {
    id: 68,
    name: "汉堡",
    emoji: "🍔",
    mealType: ["午餐", "晚餐"],
    cuisine: "快餐",
    price: 30,
    tags: ["快捷", "热食"],
    description: "肉饼多汁，层层叠叠的味觉冲击",
    searchKeywords: ["汉堡", "汉堡店", "美式快餐"]
  },
  {
    id: 69,
    name: "炸薯条",
    emoji: "🍟",
    mealType: ["午餐", "晚餐", "夜宵"],
    cuisine: "快餐",
    price: 15,
    tags: ["油炸", "快捷", "小吃"],
    description: "金黄酥脆，蘸上番茄酱的经典",
    searchKeywords: ["薯条", "快餐店", "美式快餐"]
  },
  {
    id: 70,
    name: "炸鸡块",
    emoji: "🍗",
    mealType: ["午餐", "晚餐", "夜宵"],
    cuisine: "快餐",
    price: 35,
    tags: ["油炸", "快捷", "热食"],
    description: "外脆里嫩，一口一个停不下来",
    searchKeywords: ["炸鸡块", "快餐店", "炸鸡店"]
  },
  {
    id: 71,
    name: "鸡米花",
    emoji: "🍗",
    mealType: ["午餐", "晚餐", "夜宵"],
    cuisine: "快餐",
    price: 35,
    tags: ["油炸", "快捷", "小吃"],
    description: "一口一个的酥脆小确幸",
    searchKeywords: ["鸡米花", "快餐店", "美式快餐"]
  },
  {
    id: 72,
    name: "鸡肉卷",
    emoji: "🌯",
    mealType: ["午餐", "晚餐"],
    cuisine: "快餐",
    price: 30,
    tags: ["快捷", "热食"],
    description: "饼皮包裹嫩鸡肉和蔬菜，一手掌握",
    searchKeywords: ["鸡肉卷", "快餐店", "美式快餐"]
  },
  {
    id: 73,
    name: "炸鸡三明治",
    emoji: "🥪",
    mealType: ["午餐", "晚餐"],
    cuisine: "快餐",
    price: 25,
    tags: ["快捷", "热食", "油炸"],
    description: "酥脆炸鸡配蛋黄酱，简单粗暴的美味",
    searchKeywords: ["炸鸡三明治", "炸鸡店", "美式快餐"]
  },
  {
    id: 74,
    name: "墨西哥卷饼",
    emoji: "🌯",
    mealType: ["午餐", "晚餐"],
    cuisine: "快餐",
    price: 25,
    tags: ["快捷", "热食"],
    description: "馅料丰富，牛肉莎莎酱热情奔放",
    searchKeywords: ["墨西哥卷饼", "墨西哥菜", "快餐"]
  },
  {
    id: 75,
    name: "热狗",
    emoji: "🌭",
    mealType: ["午餐", "晚餐", "夜宵"],
    cuisine: "快餐",
    price: 40,
    tags: ["快捷", "热食"],
    description: "松软面包夹香肠，街头经典快餐",
    searchKeywords: ["热狗", "快餐店", "美式快餐"]
  },

  // ========== 日料 ==========
  {
    id: 76,
    name: "寿司拼盘",
    emoji: "🍣",
    mealType: ["午餐", "晚餐"],
    cuisine: "日料",
    price: 70,
    tags: ["精致", "生冷"],
    description: "新鲜刺身，一口一个海洋的馈赠",
    searchKeywords: ["寿司", "日料店", "日本料理"]
  },
  {
    id: 77,
    name: "豚骨拉面",
    emoji: "🍜",
    mealType: ["午餐", "晚餐", "夜宵"],
    cuisine: "日料",
    price: 40,
    tags: ["面食", "热食", "汤羹"],
    description: "浓白汤底，叉烧软糯，暖心暖胃",
    searchKeywords: ["豚骨拉面", "拉面店", "日式拉面"]
  },
  {
    id: 78,
    name: "天妇罗",
    emoji: "🍤",
    mealType: ["午餐", "晚餐"],
    cuisine: "日料",
    price: 50,
    tags: ["精致", "热菜", "油炸"],
    description: "轻薄酥脆，锁住食材的鲜甜",
    searchKeywords: ["天妇罗", "日料店", "天妇罗专门店"]
  },
  {
    id: 79,
    name: "牛肉盖饭",
    emoji: "🍚",
    mealType: ["午餐", "晚餐"],
    cuisine: "日料",
    price: 40,
    tags: ["家常", "米饭", "热食"],
    description: "洋葱甜软，牛肉薄片裹满酱汁",
    searchKeywords: ["牛肉盖饭", "丼饭", "日式快餐"]
  },
  {
    id: 80,
    name: "鳗鱼饭",
    emoji: "🍱",
    mealType: ["午餐", "晚餐"],
    cuisine: "日料",
    price: 60,
    tags: ["精致", "米饭", "热食"],
    description: "蒲烧酱香，鳗鱼肉厚脂丰",
    searchKeywords: ["鳗鱼饭", "日料店", "鳗鱼专门店"]
  },
  {
    id: 81,
    name: "日式咖喱饭",
    emoji: "🍛",
    mealType: ["午餐", "晚餐"],
    cuisine: "日料",
    price: 65,
    tags: ["家常", "米饭", "热食"],
    description: "浓郁甜咖喱，配米饭暖心暖胃",
    searchKeywords: ["日式咖喱", "咖喱饭", "日式快餐"]
  },
  {
    id: 82,
    name: "味噌汤",
    emoji: "🥣",
    mealType: ["早餐", "午餐", "晚餐"],
    cuisine: "日料",
    price: 65,
    tags: ["汤羹", "清淡", "热食"],
    description: "味噌香浓，豆腐海带暖身佳品",
    searchKeywords: ["味噌汤", "日料店", "日本料理"]
  },
  {
    id: 83,
    name: "刺身拼盘",
    emoji: "🐟",
    mealType: ["午餐", "晚餐"],
    cuisine: "日料",
    price: 90,
    tags: ["精致", "生冷", "海鲜"],
    description: "三文鱼金枪鱼甜虾，新鲜到舌尖",
    searchKeywords: ["刺身", "日料店", "日本料理"]
  },
  {
    id: 84,
    name: "日式炸猪排",
    emoji: "🍖",
    mealType: ["午餐", "晚餐"],
    cuisine: "日料",
    price: 90,
    tags: ["油炸", "热食", "家常"],
    description: "面包糠裹炸至金黄，蘸酱更美味",
    searchKeywords: ["日式炸猪排", "日式简餐", "日本料理"]
  },
  {
    id: 85,
    name: "章鱼小丸子",
    emoji: "🍙",
    mealType: ["午餐", "晚餐", "夜宵"],
    cuisine: "日料",
    price: 60,
    tags: ["热食", "小吃"],
    description: "外酥内软，章鱼弹牙配上特制酱汁",
    searchKeywords: ["章鱼小丸子", "日式小吃", "大阪烧"]
  },

  // ========== 韩料 ==========
  {
    id: 86,
    name: "韩式烤肉",
    emoji: "🥓",
    mealType: ["午餐", "晚餐", "夜宵"],
    cuisine: "韩料",
    price: 65,
    tags: ["烧烤", "热食", "聚餐", "重口"],
    description: "炭火炙烤，肉香四溢包裹生菜",
    searchKeywords: ["韩式烤肉", "烤肉店", "韩国料理"]
  },
  {
    id: 87,
    name: "石锅拌饭",
    emoji: "🍚",
    mealType: ["午餐", "晚餐"],
    cuisine: "韩料",
    price: 60,
    tags: ["家常", "米饭", "热食"],
    description: "锅底焦香，拌上辣酱一口满足",
    searchKeywords: ["石锅拌饭", "韩料店", "韩国料理"]
  },
  {
    id: 88,
    name: "泡菜汤",
    emoji: "🥘",
    mealType: ["午餐", "晚餐"],
    cuisine: "韩料",
    price: 35,
    tags: ["汤羹", "热食", "重口"],
    description: "酸辣开胃，豆腐软嫩汤底浓郁",
    searchKeywords: ["泡菜汤", "韩料店", "韩国料理"]
  },
  {
    id: 89,
    name: "炸鸡",
    emoji: "🍗",
    mealType: ["午餐", "晚餐", "夜宵"],
    cuisine: "韩料",
    price: 80,
    tags: ["油炸", "热食", "重口"],
    description: "外酥里嫩，裹上甜辣酱更过瘾",
    searchKeywords: ["韩式炸鸡", "炸鸡店", "韩国料理"]
  },
  {
    id: 90,
    name: "冷面",
    emoji: "🍜",
    mealType: ["午餐", "晚餐"],
    cuisine: "韩料",
    price: 70,
    tags: ["面食", "生冷", "清淡"],
    description: "冰爽酸甜，夏日解暑首选",
    searchKeywords: ["韩式冷面", "韩料店", "韩国料理"]
  },
  {
    id: 91,
    name: "韩式炸酱面",
    emoji: "🍜",
    mealType: ["午餐", "晚餐"],
    cuisine: "韩料",
    price: 80,
    tags: ["面食", "热食"],
    description: "黑色春酱拌面，浓郁醇厚",
    searchKeywords: ["韩式炸酱面", "韩料店", "韩国料理"]
  },
  {
    id: 92,
    name: "部队锅",
    emoji: "🥘",
    mealType: ["午餐", "晚餐", "夜宵"],
    cuisine: "韩料",
    price: 40,
    tags: ["热食", "聚餐", "重口"],
    description: "泡菜年糕午餐肉，热气腾腾大满足",
    searchKeywords: ["部队锅", "韩料店", "韩国料理"]
  },
  {
    id: 93,
    name: "韩式豆腐汤",
    emoji: "🥘",
    mealType: ["午餐", "晚餐", "夜宵"],
    cuisine: "韩料",
    price: 60,
    tags: ["汤羹", "热食", "清淡"],
    description: "嫩豆腐炖煮，配米饭暖胃舒适",
    searchKeywords: ["韩式豆腐汤", "韩料店", "韩国料理"]
  },
  {
    id: 94,
    name: "韩式拌面",
    emoji: "🍜",
    mealType: ["午餐", "晚餐"],
    cuisine: "韩料",
    price: 40,
    tags: ["面食", "清爽", "热食"],
    description: "辣酱拌面，配黄瓜丝清爽开胃",
    searchKeywords: ["韩式拌面", "韩料店", "韩国料理"]
  },

  // ========== 东南亚 ==========
  {
    id: 95,
    name: "冬阴功汤",
    emoji: "🥘",
    mealType: ["午餐", "晚餐"],
    cuisine: "东南亚",
    price: 65,
    tags: ["汤羹", "热食", "重口", "酸辣"],
    description: "泰式酸辣，香茅柠檬叶的奇妙碰撞",
    searchKeywords: ["冬阴功", "泰国菜", "泰式餐厅"]
  },
  {
    id: 96,
    name: "泰式炒河粉",
    emoji: "🍜",
    mealType: ["午餐", "晚餐"],
    cuisine: "东南亚",
    price: 40,
    tags: ["面食", "热食", "酸甜"],
    description: "花生碎点缀，酸甜酱汁裹满河粉",
    searchKeywords: ["泰式炒河粉", "泰国菜", "东南亚菜"]
  },
  {
    id: 97,
    name: "越南河粉",
    emoji: "🍜",
    mealType: ["午餐", "晚餐"],
    cuisine: "东南亚",
    price: 35,
    tags: ["面食", "热食", "清淡", "汤羹"],
    description: "清澈牛骨汤底，薄切牛肉滑嫩",
    searchKeywords: ["越南河粉", "越南菜", "pho"]
  },
  {
    id: 98,
    name: "海南鸡饭",
    emoji: "🍚",
    mealType: ["午餐", "晚餐"],
    cuisine: "东南亚",
    price: 60,
    tags: ["家常", "米饭", "清淡", "热食"],
    description: "嫩滑白切鸡，香油饭粒粒分明",
    searchKeywords: ["海南鸡饭", "新加坡菜", "东南亚菜"]
  },
  {
    id: 99,
    name: "泰式绿咖喱",
    emoji: "🍛",
    mealType: ["午餐", "晚餐"],
    cuisine: "东南亚",
    price: 40,
    tags: ["热食", "重口", "咖喱"],
    description: "椰奶配青辣椒，浓郁香滑",
    searchKeywords: ["泰式绿咖喱", "泰国菜", "东南亚菜"]
  },
  {
    id: 100,
    name: "新加坡辣椒蟹",
    emoji: "🦀",
    mealType: ["晚餐"],
    cuisine: "东南亚",
    price: 30,
    tags: ["精致", "热菜", "海鲜"],
    description: "番茄辣椒酱汁，蟹肉鲜美甜辣",
    searchKeywords: ["辣椒蟹", "新加坡菜", "海鲜"]
  },
  {
    id: 101,
    name: "马来西亚叻沙",
    emoji: "🍜",
    mealType: ["午餐", "晚餐"],
    cuisine: "东南亚",
    price: 55,
    tags: ["面食", "汤羹", "重口", "热食"],
    description: "椰浆咖喱汤底，浓香鲜辣层次丰富",
    searchKeywords: ["叻沙", "马来西亚菜", "东南亚菜"]
  },
  {
    id: 102,
    name: "泰式烤鸡",
    emoji: "🍗",
    mealType: ["午餐", "晚餐"],
    cuisine: "东南亚",
    price: 45,
    tags: ["烧烤", "热食"],
    description: "香料腌制炭烤，外焦里嫩香气浓郁",
    searchKeywords: ["泰式烤鸡", "泰国菜", "东南亚菜"]
  },

  // ========== 小吃/街头 ==========
  {
    id: 103,
    name: "炸鸡排",
    emoji: "🍗",
    mealType: ["午餐", "晚餐", "夜宵"],
    cuisine: "小吃",
    price: 25,
    tags: ["油炸", "热食", "小吃"],
    description: "外皮酥脆肉质饱满，撒上胡椒盐",
    searchKeywords: ["炸鸡排", "小吃摊", "台式小吃"]
  },
  {
    id: 104,
    name: "烤串",
    emoji: "🍢",
    mealType: ["晚餐", "夜宵"],
    cuisine: "小吃",
    price: 15,
    tags: ["烧烤", "热食", "重口", "聚餐"],
    description: "炭火烧烤，孜然辣椒香气扑鼻",
    searchKeywords: ["烤串", "烧烤摊", "夜市"]
  },
  {
    id: 105,
    name: "肉夹馍",
    emoji: "🥙",
    mealType: ["午餐", "晚餐", "夜宵"],
    cuisine: "小吃",
    price: 20,
    tags: ["面食", "热食", "家常", "小吃"],
    description: "白吉馍酥脆，腊汁肉肥瘦相间",
    searchKeywords: ["肉夹馍", "陕西小吃", "中式汉堡"]
  },
  {
    id: 106,
    name: "关东煮",
    emoji: "🍢",
    mealType: ["午餐", "晚餐", "夜宵"],
    cuisine: "小吃",
    price: 15,
    tags: ["热食", "汤羹", "清淡", "小吃"],
    description: "高汤慢煮，各种食材吸饱汤汁",
    searchKeywords: ["关东煮", "便利店", "日式小吃"]
  },
  {
    id: 107,
    name: "螺蛳粉",
    emoji: "🍜",
    mealType: ["午餐", "晚餐", "夜宵"],
    cuisine: "小吃",
    price: 10,
    tags: ["面食", "热食", "重口", "酸辣"],
    description: "闻着臭吃着香，酸笋螺蛳汤底浓郁",
    searchKeywords: ["螺蛳粉", "广西小吃", "柳州螺蛳粉"]
  },
  {
    id: 108,
    name: "煎饼",
    emoji: "🥞",
    mealType: ["早餐"],
    cuisine: "小吃",
    price: 15,
    tags: ["家常", "快捷", "热食"],
    description: "鸡蛋面粉糊煎至金黄，简单美味",
    searchKeywords: ["煎饼", "早餐摊", "中式早餐"]
  },
  {
    id: 109,
    name: "烤红薯",
    emoji: "🍠",
    mealType: ["早餐", "午餐", "夜宵"],
    cuisine: "小吃",
    price: 15,
    tags: ["热食", "家常", "香甜"],
    description: "冬天街头的温暖，软糯甜蜜",
    searchKeywords: ["烤红薯", "街头小吃", "烤地瓜"]
  },
  {
    id: 110,
    name: "臭豆腐",
    emoji: "🧈",
    mealType: ["午餐", "晚餐", "夜宵"],
    cuisine: "小吃",
    price: 20,
    tags: ["油炸", "热食", "小吃"],
    description: "闻着臭吃着香，外酥里嫩蘸酱更佳",
    searchKeywords: ["臭豆腐", "夜市小吃", "湖南小吃"]
  },
  {
    id: 111,
    name: "凉皮",
    emoji: "🫓",
    mealType: ["午餐", "夜宵"],
    cuisine: "小吃",
    price: 10,
    tags: ["面食", "清淡", "凉拌"],
    description: "爽滑Q弹，酸辣清爽的夏日之选",
    searchKeywords: ["凉皮", "陕西小吃", "街头小吃"]
  },
  {
    id: 112,
    name: "鸡排",
    emoji: "🍗",
    mealType: ["午餐", "晚餐", "夜宵"],
    cuisine: "小吃",
    price: 15,
    tags: ["油炸", "热食", "小吃"],
    description: "超大一块，撒粉调味的街头快乐",
    searchKeywords: ["鸡排", "鸡排店", "台式小吃"]
  },
  {
    id: 113,
    name: "烤鸡翅",
    emoji: "🍗",
    mealType: ["晚餐", "夜宵"],
    cuisine: "小吃",
    price: 20,
    tags: ["烧烤", "热食"],
    description: "外焦里嫩，蜜汁或椒盐都美味",
    searchKeywords: ["烤鸡翅", "烧烤摊", "夜市"]
  },
  {
    id: 114,
    name: "烤玉米",
    emoji: "🌽",
    mealType: ["晚餐", "夜宵"],
    cuisine: "小吃",
    price: 15,
    tags: ["烧烤", "热食"],
    description: "炭火炙烤，黄油蜂蜜甜香四溢",
    searchKeywords: ["烤玉米", "烧烤摊", "夜市"]
  },
  {
    id: 115,
    name: "生煎包",
    emoji: "🥟",
    mealType: ["早餐", "午餐"],
    cuisine: "小吃",
    price: 15,
    tags: ["面食", "热食", "精致"],
    description: "底部焦脆金黄，鲜肉汤汁满满",
    searchKeywords: ["生煎包", "上海小吃", "生煎馆"]
  },
  {
    id: 116,
    name: "豆花",
    emoji: "🥣",
    mealType: ["早餐", "午餐", "夜宵"],
    cuisine: "小吃",
    price: 10,
    tags: ["清淡", "素食", "热食"],
    description: "嫩滑如丝，甜咸皆宜的传统小吃",
    searchKeywords: ["豆花", "甜品店", "中式小吃"]
  },

  // ========== 甜品/饮品 ==========
  {
    id: 117,
    name: "奶茶",
    emoji: "🧋",
    mealType: ["早餐", "午餐", "晚餐", "夜宵"],
    cuisine: "甜品",
    price: 25,
    tags: ["甜品", "饮品", "快捷"],
    description: "茶香奶滑，珍珠Q弹有嚼劲",
    searchKeywords: ["奶茶", "奶茶店", "珍珠奶茶"]
  },
  {
    id: 118,
    name: "蛋糕",
    emoji: "🍰",
    mealType: ["早餐", "午餐", "晚餐"],
    cuisine: "甜品",
    price: 30,
    tags: ["甜品", "精致"],
    description: "绵密柔软，甜而不腻的小确幸",
    searchKeywords: ["蛋糕", "甜品店", "烘焙店"]
  },
  {
    id: 119,
    name: "冰淇淋",
    emoji: "🍦",
    mealType: ["午餐", "晚餐", "夜宵"],
    cuisine: "甜品",
    price: 20,
    tags: ["甜品", "生冷", "快捷"],
    description: "冰凉甜蜜，融化在舌尖的快乐",
    searchKeywords: ["冰淇淋", "甜品店", "冰品店"]
  },
  {
    id: 120,
    name: "布丁",
    emoji: "🍮",
    mealType: ["午餐", "晚餐", "夜宵"],
    cuisine: "甜品",
    price: 25,
    tags: ["甜品", "精致", "顺滑"],
    description: "嫩滑如丝，焦糖微苦配奶香甜",
    searchKeywords: ["布丁", "甜品店", "下午茶"]
  },
  {
    id: 121,
    name: "红豆汤圆",
    emoji: "🍡",
    mealType: ["早餐", "夜宵"],
    cuisine: "甜品",
    price: 20,
    tags: ["甜品", "热食", "家常"],
    description: "软糯汤圆配绵密红豆沙，暖心甜品",
    searchKeywords: ["汤圆", "甜品店", "中式甜品"]
  },
  {
    id: 122,
    name: "芒果糯米饭",
    emoji: "🥭",
    mealType: ["午餐", "晚餐", "夜宵"],
    cuisine: "东南亚",
    price: 70,
    tags: ["甜品", "精致", "香甜"],
    description: "椰浆浸润的糯米饭配鲜甜芒果",
    searchKeywords: ["芒果糯米饭", "泰国甜品", "东南亚菜"]
  },
  {
    id: 123,
    name: "双皮奶",
    emoji: "🥣",
    mealType: ["午餐", "晚餐", "夜宵"],
    cuisine: "甜品",
    price: 15,
    tags: ["甜品", "精致", "热食"],
    description: "顺德名品，奶香浓郁嫩滑如绸",
    searchKeywords: ["双皮奶", "广式甜品", "甜品店"]
  },
  {
    id: 124,
    name: "杨枝甘露",
    emoji: "🥭",
    mealType: ["午餐", "晚餐", "夜宵"],
    cuisine: "甜品",
    price: 15,
    tags: ["甜品", "精致", "生冷"],
    description: "芒果西柚西米露，清爽甜蜜经典",
    searchKeywords: ["杨枝甘露", "港式甜品", "甜品店"]
  },
  {
    id: 125,
    name: "椰子鸡",
    emoji: "🍗",
    mealType: ["午餐", "晚餐"],
    cuisine: "中餐",
    price: 40,
    tags: ["清淡", "汤羹", "精致"],
    description: "椰子水炖鸡，清甜滋补",
    searchKeywords: ["椰子鸡", "海南菜", "粤菜"]
  },
  {
    id: 126,
    name: "烤鱼",
    emoji: "🐟",
    mealType: ["晚餐", "夜宵"],
    cuisine: "中餐",
    price: 75,
    tags: ["烧烤", "热食", "重口", "聚餐"],
    description: "炭烤鱼身配满香料，香辣过瘾",
    searchKeywords: ["烤鱼", "烤鱼店", "夜宵"]
  },
  {
    id: 127,
    name: "羊蝎子火锅",
    emoji: "🍖",
    mealType: ["晚餐", "夜宵"],
    cuisine: "中餐",
    price: 50,
    tags: ["火锅", "热食", "重口", "聚餐"],
    description: "羊脊椎骨炖煮，肉香汤浓",
    searchKeywords: ["羊蝎子", "火锅店", "北京菜"]
  },
  {
    id: 128,
    name: "钵钵鸡",
    emoji: "🍗",
    mealType: ["午餐", "晚餐", "夜宵"],
    cuisine: "小吃",
    price: 15,
    tags: ["麻辣", "冷菜", "小吃"],
    description: "竹签串起各种食材，泡在红油里",
    searchKeywords: ["钵钵鸡", "四川小吃", "冷锅串串"]
  },
  {
    id: 129,
    name: "沙茶面",
    emoji: "🍜",
    mealType: ["早餐", "午餐"],
    cuisine: "中餐",
    price: 70,
    tags: ["面食", "热食", "汤羹"],
    description: "沙茶汤底浓郁，配料丰富的福建味",
    searchKeywords: ["沙茶面", "福建小吃", "厦门菜"]
  },
  {
    id: 130,
    name: "鸡蛋灌饼",
    emoji: "🫓",
    mealType: ["早餐"],
    cuisine: "小吃",
    price: 25,
    tags: ["面食", "快捷", "热食"],
    description: "灌入蛋液煎至金黄，酥脆多层",
    searchKeywords: ["鸡蛋灌饼", "早餐摊", "中式早餐"]
  },
  {
    id: 131,
    name: "糯米鸡",
    emoji: "🥟",
    mealType: ["早餐", "午餐"],
    cuisine: "中餐",
    price: 75,
    tags: ["精致", "面食", "热食"],
    description: "荷叶包裹糯米鸡肉，荷香四溢",
    searchKeywords: ["糯米鸡", "粤式早茶", "广东小吃"]
  },
  {
    id: 132,
    name: "烤冷面",
    emoji: "🍜",
    mealType: ["午餐", "晚餐", "夜宵"],
    cuisine: "小吃",
    price: 20,
    tags: ["面食", "热食", "快捷"],
    description: "铁板烤制的东北街头传奇",
    searchKeywords: ["烤冷面", "东北小吃", "街头小吃"]
  },
  {
    id: 133,
    name: "铁板烧",
    emoji: "🥩",
    mealType: ["午餐", "晚餐"],
    cuisine: "日料",
    price: 35,
    tags: ["精致", "热菜", "聚餐"],
    description: "铁板上的火焰艺术，食材原味升华",
    searchKeywords: ["铁板烧", "日料店", "铁板料理"]
  },
  {
    id: 134,
    name: "酱牛肉面",
    emoji: "🍜",
    mealType: ["午餐", "晚餐"],
    cuisine: "中餐",
    price: 25,
    tags: ["面食", "热食", "家常"],
    description: "浓香酱牛肉配劲道面条，实在满足",
    searchKeywords: ["酱牛肉面", "面馆", "中式快餐"]
  },
  {
    id: 135,
    name: "馄饨",
    emoji: "🥟",
    mealType: ["早餐", "午餐", "夜宵"],
    cuisine: "中餐",
    price: 50,
    tags: ["面食", "清淡", "汤羹"],
    description: "薄皮大馅，清汤鲜美，暖胃首选",
    searchKeywords: ["馄饨", "馄饨店", "中式早餐"]
  }
];

// 分类配置（用于UI渲染）
const filterConfig = {
  mealType: {
    label: "用餐时段",
    options: ["早餐", "午餐", "晚餐", "夜宵"]
  },
  cuisine: {
    label: "菜系分类",
    options: ["中餐", "西餐", "日料", "韩料", "东南亚", "快餐", "小吃", "甜品"]
  }
};

// 导出（浏览器环境）
if (typeof window !== 'undefined') {
  window.foodDatabase = foodDatabase;
  window.filterConfig = filterConfig;
}
