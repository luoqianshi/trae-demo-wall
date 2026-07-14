/**
 * 今天吃什么 —— Demo 数据层
 * 纯前端预设数据，浏览器直接加载，挂载到 window 全局变量。
 * 包含11大菜系、200道菜品、完整食材库。
 */

const cuisineOptions = ["川菜", "粤菜", "湘菜", "鲁菜", "苏菜", "浙菜", "闽菜", "徽菜", "家常", "东北", "西式"];
const spiceOptions = ["不吃辣", "微辣", "中辣", "特辣"];
const avoidOptions = ["不吃猪肉", "不吃牛肉", "不吃香菜", "不吃海鲜", "无"];
const regionOptions = ["华北", "华东", "华南", "西南", "西北", "东北"];
const nutritionOptions = ["普通", "减脂", "高蛋白"];

const portionMultiplier = { 1: 0.6, 2: 1, 3: 1.4, 4: 1.8, 5: 2.2, 6: 2.5 };

const shelfLifeConfig = {
  short: { batch: 1, label: "第一批（建议今天购买）", color: "#E76F51", icon: "🛒" },
  long:  { batch: 2, label: "第二批（可一次性囤货）", color: "#2A9D8F", icon: "📦" }
};

/**
 * 菜库：200道菜，覆盖川/粤/湘/鲁/苏/浙/闽/徽/家常/东北/西式共11大菜系。
 * category: 荤 | 素 | 半荤
 * meals: 适合的餐段（早餐/中餐/晚餐）
 * nutrition: 营养标签（减脂/高蛋白/减脂,高蛋白/空）
 * ingredients: [{ name, amount, unit }]（amount 为 2 人份基础用量）
 * steps: 完整步骤数组
 * videoUrl: B站搜索链接
 * substitutes: 口味相似替代菜 id（3 个）
 */
const dishDB = [
  // ======================================== 川菜 (25道, id 1-25) ========================================
  {
    id: 1, name: "麻婆豆腐", cuisine: "川菜", category: "半荤", lightness: "regular", meals: ["中餐","晚餐"], nutrition: "高蛋白",
    ingredients: [
      { name: "豆腐", amount: 1, unit: "块" },
      { name: "猪肉末", amount: 100, unit: "克" },
      { name: "豆瓣酱", amount: 1, unit: "勺" },
      { name: "花椒", amount: 1, unit: "小撮" },
      { name: "蒜", amount: 2, unit: "瓣" },
      { name: "葱", amount: 1, unit: "根" }
    ],
    steps: [
      "豆腐切小块，入加了盐的沸水中焯烫1分钟，捞出沥干。",
      "锅中热油，下猪肉末炒散至变色出油。",
      "加入豆瓣酱炒出红油，再加入蒜末炒香。",
      "加入约1碗热水，放入豆腐，小火煮3分钟入味。",
      "水淀粉勾薄芡，撒花椒粉和葱花，出锅即成。"
    ],
    videoUrl: "https://search.bilibili.com/all?keyword=麻婆豆腐",
    substitutes: [152, 147, 51]
  },
  {
    id: 2, name: "宫保鸡丁", cuisine: "川菜", category: "荤", lightness: "regular", meals: ["中餐","晚餐"], nutrition: "高蛋白",
    ingredients: [
      { name: "鸡胸肉", amount: 250, unit: "克" },
      { name: "花生米", amount: 50, unit: "克" },
      { name: "干辣椒", amount: 5, unit: "个" },
      { name: "黄瓜", amount: 1, unit: "根" },
      { name: "蒜", amount: 2, unit: "瓣" },
      { name: "酱油", amount: 1, unit: "勺" }
    ],
    steps: [
      "鸡胸肉切丁，加酱油、料酒、淀粉抓匀腌制10分钟。",
      "调碗汁：酱油、醋、糖、淀粉、少许水搅匀。",
      "油锅烧热，下鸡丁滑炒至变白盛出。",
      "锅留底油，下干辣椒、花椒小火煸香，加蒜片爆香。",
      "倒入鸡丁和花生米，淋入碗汁快速翻炒收汁即可。"
    ],
    videoUrl: "https://search.bilibili.com/all?keyword=宫保鸡丁",
    substitutes: [8, 50, 153]
  },
  {
    id: 3, name: "水煮肉片", cuisine: "川菜", category: "荤", lightness: "regular", meals: ["中餐"], nutrition: "高蛋白",
    ingredients: [
      { name: "猪里脊", amount: 250, unit: "克" },
      { name: "白菜", amount: 200, unit: "克" },
      { name: "豆瓣酱", amount: 1, unit: "勺" },
      { name: "干辣椒", amount: 5, unit: "个" },
      { name: "花椒", amount: 1, unit: "小撮" },
      { name: "蒜", amount: 2, unit: "瓣" },
      { name: "香菜", amount: 1, unit: "小把" }
    ],
    steps: [
      "猪里脊切薄片，加盐、料酒、蛋清、淀粉抓匀腌制10分钟。",
      "白菜撕块焯水垫入碗底。",
      "热锅下油，加入豆瓣酱小火炒出红油。",
      "加姜蒜炒香，倒入高汤烧开，逐片下入肉片。",
      "肉片变色后连汤倒入碗中，撒干辣椒花椒，浇热油激香。",
    ],
    videoUrl: "https://search.bilibili.com/all?keyword=水煮肉片",
    substitutes: [4, 7, 50]
  },
  {
    id: 4, name: "回锅肉", cuisine: "川菜", category: "荤", lightness: "heavy", meals: ["中餐"], nutrition: "高蛋白",
    ingredients: [
      { name: "猪五花肉", amount: 300, unit: "克" },
      { name: "青椒", amount: 2, unit: "个" },
      { name: "蒜苗", amount: 100, unit: "克" },
      { name: "豆瓣酱", amount: 1, unit: "勺" },
      { name: "姜", amount: 3, unit: "片" }
    ],
    steps: [
      "猪五花肉整块冷水下锅，加姜片、料酒煮至筷子可插入。",
      "捞出晾凉切薄片，青椒切块，蒜苗切段。",
      "热锅少油，下肉片中火煸炒至出油卷曲（灯盏窝状）。",
      "下豆瓣酱炒出红油，加入姜片炒香。",
      "放入青椒、蒜苗翻炒断生，加少许糖和酱油调味出锅。"
    ],
    videoUrl: "https://search.bilibili.com/all?keyword=回锅肉",
    substitutes: [19, 148, 50]
  },
  {
    id: 5, name: "鱼香肉丝", cuisine: "川菜", category: "荤", lightness: "regular", meals: ["中餐","晚餐"], nutrition: "高蛋白",
    ingredients: [
      { name: "猪里脊", amount: 200, unit: "克" },
      { name: "木耳", amount: 50, unit: "克" },
      { name: "胡萝卜", amount: 1, unit: "根" },
      { name: "豆瓣酱", amount: 1, unit: "勺" },
      { name: "醋", amount: 1, unit: "勺" },
      { name: "葱", amount: 1, unit: "根" }
    ],
    steps: [
      "猪里脊切丝，加盐、料酒、淀粉腌制10分钟。",
      "木耳泡发切丝，胡萝卜切丝，葱切段。",
      "调鱼香汁：酱油、醋、糖、淀粉、少许水搅匀。",
      "油锅烧热，下肉丝滑炒变白盛出，下豆瓣酱炒出红油。",
      "倒入肉丝和配菜快速翻炒，淋入鱼香汁收汁即可。",
    ],
    videoUrl: "https://search.bilibili.com/all?keyword=鱼香肉丝",
    substitutes: [2, 50, 4]
  },
  {
    id: 6, name: "酸辣土豆丝", cuisine: "川菜", category: "素", lightness: "light", meals: ["早餐","中餐","晚餐"], nutrition: "",
    ingredients: [
      { name: "土豆", amount: 2, unit: "个" },
      { name: "干辣椒", amount: 3, unit: "个" },
      { name: "醋", amount: 1, unit: "勺" },
      { name: "葱", amount: 1, unit: "根" }
    ],
    steps: [
      "土豆去皮切细丝，放清水中浸泡去淀粉。",
      "干辣椒切段，葱切葱花。",
      "锅中热油，下干辣椒和葱花爆香。",
      "倒入沥干的土豆丝大火快炒，加醋翻炒。",
      "加盐调味，翻炒均匀出锅，保持脆爽口感。",
    ],
    videoUrl: "https://search.bilibili.com/all?keyword=酸辣土豆丝",
    substitutes: [149, 151, 30]
  },
  {
    id: 7, name: "水煮鱼", cuisine: "川菜", category: "荤", lightness: "regular", meals: ["中餐"], nutrition: "高蛋白",
    ingredients: [
      { name: "草鱼", amount: 1, unit: "条" },
      { name: "豆芽", amount: 200, unit: "克" },
      { name: "干辣椒", amount: 8, unit: "个" },
      { name: "花椒", amount: 1, unit: "小撮" },
      { name: "豆瓣酱", amount: 1, unit: "勺" },
      { name: "蒜", amount: 3, unit: "瓣" },
      { name: "香菜", amount: 1, unit: "小把" }
    ],
    steps: [
      "草鱼片成薄片，加盐、料酒、蛋清、淀粉抓匀上浆。",
      "豆芽焯水垫入碗底，锅中热油下豆瓣酱炒出红油。",
      "加姜蒜炒香，倒入高汤或清水，调味煮沸。",
      "逐片放入鱼片，轻轻推动，煮至鱼片变白浮起。",
      "连汤带鱼倒入碗中，撒花椒、干辣椒、蒜末，浇热油激香。"
    ],
    videoUrl: "https://search.bilibili.com/all?keyword=水煮鱼",
    substitutes: [3, 17, 49]
  },
  {
    id: 8, name: "辣子鸡", cuisine: "川菜", category: "荤", lightness: "regular", meals: ["中餐","晚餐"], nutrition: "高蛋白",
    ingredients: [
      { name: "鸡腿", amount: 2, unit: "个" },
      { name: "干辣椒", amount: 10, unit: "个" },
      { name: "花椒", amount: 1, unit: "小撮" },
      { name: "蒜", amount: 2, unit: "瓣" },
      { name: "姜", amount: 3, unit: "片" },
      { name: "花生米", amount: 30, unit: "克" }
    ],
    steps: [
      "鸡腿去骨切丁，加盐、酱油、料酒、姜片腌制15分钟。",
      "锅中多油烧至七成热，下鸡丁炸至金黄捞出。",
      "油温升高复炸一次至酥脆。",
      "锅中留底油，下干辣椒和花椒小火煸香。",
      "倒入鸡丁和花生米快速翻炒，撒少许盐和糖出锅。",
    ],
    videoUrl: "https://search.bilibili.com/all?keyword=辣子鸡",
    substitutes: [2, 15, 50]
  },
  {
    id: 9, name: "夫妻肺片", cuisine: "川菜", category: "荤", lightness: "regular", meals: ["中餐","晚餐"], nutrition: "高蛋白",
    ingredients: [
      { name: "牛腱子", amount: 150, unit: "克" },
      { name: "牛肚", amount: 150, unit: "克" },
      { name: "香菜", amount: 1, unit: "小把" },
      { name: "花生米", amount: 30, unit: "克" },
      { name: "辣椒油", amount: 2, unit: "勺" },
      { name: "蒜", amount: 2, unit: "瓣" }
    ],
    steps: [
      "牛腱子和牛肚冷水下锅，加姜片料酒焯水去腥。",
      "另起锅加酱油、花椒、八角、桂皮等卤料炖煮1小时。",
      "捞出晾凉切成薄片摆盘。",
      "蒜切末加辣椒油、酱油、醋、糖调成红油汁。",
      "浇汁撒花生碎和香菜即可。",
    ],
    videoUrl: "https://search.bilibili.com/all?keyword=夫妻肺片",
    substitutes: [14, 21, 11]
  },
  {
    id: 10, name: "担担面", cuisine: "川菜", category: "半荤", lightness: "regular", meals: ["早餐","中餐"], nutrition: "高蛋白",
    ingredients: [
      { name: "细面条", amount: 250, unit: "克" },
      { name: "猪肉末", amount: 100, unit: "克" },
      { name: "芽菜", amount: 30, unit: "克" },
      { name: "花生酱", amount: 1, unit: "勺" },
      { name: "辣椒油", amount: 1, unit: "勺" },
      { name: "葱", amount: 1, unit: "根" }
    ],
    steps: [
      "猪肉末加料酒酱油腌制，芽菜洗净切碎。",
      "热锅加油，下肉末炒散至变色出油。",
      "加入芽菜和辣椒油翻炒出香。",
      "面条煮熟捞出盛碗，浇上炒好的肉臊。",
      "淋芝麻酱和红油，撒葱花即可。",
    ],
    videoUrl: "https://search.bilibili.com/all?keyword=担担面",
    substitutes: [22, 25, 1]
  },
  {
    id: 11, name: "口水鸡", cuisine: "川菜", category: "荤", lightness: "regular", meals: ["中餐","晚餐"], nutrition: "高蛋白",
    ingredients: [
      { name: "鸡腿", amount: 2, unit: "个" },
      { name: "辣椒油", amount: 2, unit: "勺" },
      { name: "花生米", amount: 30, unit: "克" },
      { name: "黄瓜", amount: 1, unit: "根" },
      { name: "蒜", amount: 2, unit: "瓣" },
      { name: "芝麻酱", amount: 1, unit: "勺" }
    ],
    steps: [
      "鸡腿冷水下锅，加姜片料酒煮15分钟关火焖10分钟。",
      "捞出浸冰水过凉，斩块装盘。",
      "蒜切末，加辣椒油、芝麻酱、酱油、醋、糖调汁。",
      "黄瓜切丝垫底，浇上调好的酱汁。",
      "撒花生碎和葱花即可。",
    ],
    videoUrl: "https://search.bilibili.com/all?keyword=口水鸡",
    substitutes: [9, 21, 14]
  },
  {
    id: 12, name: "毛血旺", cuisine: "川菜", category: "荤", lightness: "heavy", meals: ["中餐"], nutrition: "高蛋白",
    ingredients: [
      { name: "鸭血", amount: 200, unit: "克" },
      { name: "毛肚", amount: 150, unit: "克" },
      { name: "火腿", amount: 100, unit: "克" },
      { name: "豆芽", amount: 150, unit: "克" },
      { name: "干辣椒", amount: 5, unit: "个" },
      { name: "豆瓣酱", amount: 1, unit: "勺" },
      { name: "蒜", amount: 3, unit: "瓣" }
    ],
    steps: [
      "鸭血切厚片，毛肚切块，火腿切片，豆芽洗净。",
      "锅中多油，下豆瓣酱小火炒出红油。",
      "加姜蒜爆香，倒入高汤或清水烧开。",
      "依次放入鸭血、火腿、豆芽煮3分钟。",
      "最后放入毛肚烫10秒，撒干辣椒花椒蒜末，浇热油激香。",
    ],
    videoUrl: "https://search.bilibili.com/all?keyword=毛血旺",
    substitutes: [3, 7, 18]
  },
  {
    id: 13, name: "干煸四季豆", cuisine: "川菜", category: "素", lightness: "regular", meals: ["中餐","晚餐"], nutrition: "",
    ingredients: [
      { name: "四季豆", amount: 300, unit: "克" },
      { name: "干辣椒", amount: 3, unit: "个" },
      { name: "花椒", amount: 1, unit: "小撮" },
      { name: "蒜", amount: 2, unit: "瓣" },
      { name: "橄榄菜", amount: 1, unit: "勺" }
    ],
    steps: [
      "四季豆去筋折段，沥干水分。",
      "油锅烧至六成热，下四季豆炸至表皮起皱捞出。",
      "锅中留底油，下干辣椒、花椒小火煸香。",
      "加蒜末和橄榄菜炒香。",
      "倒入四季豆翻炒均匀，加盐调味出锅。",
    ],
    videoUrl: "https://search.bilibili.com/all?keyword=干煸四季豆",
    substitutes: [18, 161, 40]
  },
  {
    id: 14, name: "蒜泥白肉", cuisine: "川菜", category: "荤", lightness: "light", meals: ["中餐","晚餐"], nutrition: "高蛋白",
    ingredients: [
      { name: "猪五花肉", amount: 300, unit: "克" },
      { name: "黄瓜", amount: 1, unit: "根" },
      { name: "蒜", amount: 5, unit: "瓣" },
      { name: "酱油", amount: 1, unit: "勺" },
      { name: "辣椒油", amount: 1, unit: "勺" },
      { name: "葱", amount: 1, unit: "根" }
    ],
    steps: [
      "猪五花肉冷水下锅，加姜片料酒煮至筷子可穿透。",
      "捞出晾凉后切薄片摆盘。",
      "黄瓜切片垫底。",
      "蒜捣成泥，加酱油、辣椒油、少许糖调成蒜泥汁。",
      "将蒜泥汁浇在白肉上，撒葱花即可。",
    ],
    videoUrl: "https://search.bilibili.com/all?keyword=蒜泥白肉",
    substitutes: [9, 4, 21]
  },
  {
    id: 15, name: "泡椒凤爪", cuisine: "川菜", category: "荤", lightness: "light", meals: ["中餐","晚餐"], nutrition: "高蛋白",
    ingredients: [
      { name: "鸡爪", amount: 500, unit: "克" },
      { name: "泡椒", amount: 100, unit: "克" },
      { name: "花椒", amount: 1, unit: "小撮" },
      { name: "姜", amount: 3, unit: "片" },
      { name: "醋", amount: 1, unit: "勺" }
    ],
    steps: [
      "鸡爪剪去指甲洗净，对半切开。",
      "冷水下锅加姜片料酒煮15分钟至熟。",
      "捞出冲洗干净沥干水分。",
      "泡椒连汁水、醋、花椒混合调成泡汁。",
      "将鸡爪放入泡汁中冷藏浸泡4小时以上入味。",
    ],
    videoUrl: "https://search.bilibili.com/all?keyword=泡椒凤爪",
    substitutes: [11, 8, 21]
  },
  {
    id: 16, name: "粉蒸肉", cuisine: "川菜", category: "荤", lightness: "heavy", meals: ["中餐","晚餐"], nutrition: "高蛋白",
    ingredients: [
      { name: "猪五花肉", amount: 300, unit: "克" },
      { name: "米粉", amount: 100, unit: "克" },
      { name: "土豆", amount: 1, unit: "个" },
      { name: "豆瓣酱", amount: 1, unit: "勺" },
      { name: "酱油", amount: 1, unit: "勺" },
      { name: "姜", amount: 3, unit: "片" }
    ],
    steps: [
      "猪五花肉切片，加豆瓣酱、酱油、姜末拌匀腌制20分钟。",
      "土豆去皮切滚刀块铺在蒸碗底部。",
      "肉片裹上米粉，码放在土豆上面。",
      "水开后上锅大火蒸40分钟至肉酥烂。",
      "取出倒扣在盘中，撒葱花即可。",
    ],
    videoUrl: "https://search.bilibili.com/all?keyword=粉蒸肉",
    substitutes: [4, 148, 103]
  },
  {
    id: 17, name: "酸菜鱼", cuisine: "川菜", category: "荤", lightness: "regular", meals: ["中餐","晚餐"], nutrition: "高蛋白",
    ingredients: [
      { name: "草鱼", amount: 1, unit: "条" },
      { name: "酸菜", amount: 200, unit: "克" },
      { name: "泡椒", amount: 50, unit: "克" },
      { name: "姜", amount: 3, unit: "片" },
      { name: "蒜", amount: 3, unit: "瓣" },
      { name: "干辣椒", amount: 3, unit: "个" }
    ],
    steps: [
      "草鱼片成薄片，加盐、蛋清、淀粉抓匀腌制10分钟。",
      "酸菜切段，泡椒切碎，姜蒜切片。",
      "锅中热油，炒香酸菜和泡椒。",
      "加入高汤烧开，下鱼骨煮5分钟，再逐片下鱼片。",
      "鱼片变白浮起即熟，出锅撒葱花干辣椒，浇热油。",
    ],
    videoUrl: "https://search.bilibili.com/all?keyword=酸菜鱼",
    substitutes: [7, 3, 49]
  },
  {
    id: 18, name: "干锅花菜", cuisine: "川菜", category: "半荤", lightness: "regular", meals: ["中餐","晚餐"], nutrition: "高蛋白",
    ingredients: [
      { name: "花菜", amount: 1, unit: "颗" },
      { name: "猪五花肉", amount: 80, unit: "克" },
      { name: "干辣椒", amount: 3, unit: "个" },
      { name: "蒜", amount: 2, unit: "瓣" },
      { name: "酱油", amount: 1, unit: "勺" }
    ],
    steps: [
      "花菜掰成小朵，焯水1分钟捞出沥干。",
      "五花肉切薄片。",
      "热锅少油，下五花肉煸炒出油至微卷。",
      "加干辣椒、蒜末炒香，倒入花菜翻炒。",
      "加酱油调味，炒至花菜边缘微焦出锅。",
    ],
    videoUrl: "https://search.bilibili.com/all?keyword=干锅花菜",
    substitutes: [13, 161, 51]
  },
  {
    id: 19, name: "盐煎肉", cuisine: "川菜", category: "荤", lightness: "regular", meals: ["中餐","晚餐"], nutrition: "高蛋白",
    ingredients: [
      { name: "猪五花肉", amount: 250, unit: "克" },
      { name: "青椒", amount: 2, unit: "个" },
      { name: "蒜苗", amount: 80, unit: "克" },
      { name: "豆瓣酱", amount: 1, unit: "勺" },
      { name: "豆豉", amount: 1, unit: "勺" }
    ],
    steps: [
      "猪五花肉切薄片，青椒切块，蒜苗切段。",
      "热锅少油，下肉片煸炒至出油微卷。",
      "推肉至锅边，下豆瓣酱和豆豉炒香。",
      "混合翻炒均匀，放入青椒和蒜苗。",
      "炒至青椒断生，加少许糖调味出锅。",
    ],
    videoUrl: "https://search.bilibili.com/all?keyword=盐煎肉",
    substitutes: [4, 50, 166]
  },
  {
    id: 20, name: "东坡肘子", cuisine: "川菜", category: "荤", lightness: "heavy", meals: ["中餐","晚餐"], nutrition: "高蛋白",
    ingredients: [
      { name: "猪肘子", amount: 1, unit: "个" },
      { name: "酱油", amount: 2, unit: "勺" },
      { name: "冰糖", amount: 30, unit: "克" },
      { name: "姜", amount: 5, unit: "片" },
      { name: "葱", amount: 2, unit: "根" },
      { name: "料酒", amount: 1, unit: "勺" }
    ],
    steps: [
      "猪肘子洗净，冷水下锅加姜片焯水去腥。",
      "用火燎去表面猪毛，刮洗干净。",
      "砂锅中加姜、葱、料酒、酱油、冰糖。",
      "放入肘子加水没过，大火烧开转小火炖2小时。",
      "收浓汤汁，反复浇汁在肘子上至表面红亮。",
    ],
    videoUrl: "https://search.bilibili.com/all?keyword=东坡肘子",
    substitutes: [103, 148, 74]
  },
  {
    id: 21, name: "棒棒鸡", cuisine: "川菜", category: "荤", lightness: "regular", meals: ["中餐","晚餐"], nutrition: "高蛋白",
    ingredients: [
      { name: "鸡胸肉", amount: 250, unit: "克" },
      { name: "黄瓜", amount: 1, unit: "根" },
      { name: "芝麻酱", amount: 1, unit: "勺" },
      { name: "辣椒油", amount: 1, unit: "勺" },
      { name: "蒜", amount: 2, unit: "瓣" },
      { name: "酱油", amount: 1, unit: "勺" }
    ],
    steps: [
      "鸡胸肉冷水下锅，加姜片料酒煮10分钟至熟。",
      "捞出晾凉用擀面杖敲松撕成丝。",
      "黄瓜切丝垫在盘底。",
      "芝麻酱加辣椒油、酱油、醋、糖、蒜末调成酱汁。",
      "将鸡丝铺在黄瓜上，浇酱汁撒花生碎和葱花。",
    ],
    videoUrl: "https://search.bilibili.com/all?keyword=棒棒鸡",
    substitutes: [11, 9, 14]
  },
  {
    id: 22, name: "红油抄手", cuisine: "川菜", category: "荤", lightness: "regular", meals: ["早餐","中餐"], nutrition: "高蛋白",
    ingredients: [
      { name: "抄手皮", amount: 300, unit: "克" },
      { name: "猪肉末", amount: 200, unit: "克" },
      { name: "辣椒油", amount: 2, unit: "勺" },
      { name: "蒜", amount: 2, unit: "瓣" },
      { name: "酱油", amount: 1, unit: "勺" },
      { name: "葱", amount: 1, unit: "根" }
    ],
    steps: [
      "猪肉末加姜末、酱油、料酒、盐搅打上劲做馅。",
      "取抄手皮包入肉馅，捏成元宝形。",
      "蒜切末，加辣椒油、酱油、醋、糖调成红油汁。",
      "水开后下抄手煮至浮起再煮1分钟。",
      "捞出盛碗，浇红油汁撒葱花即可。",
    ],
    videoUrl: "https://search.bilibili.com/all?keyword=红油抄手",
    substitutes: [10, 1, 51]
  },
  {
    id: 23, name: "樟茶鸭", cuisine: "川菜", category: "荤", lightness: "regular", meals: ["中餐","晚餐"], nutrition: "高蛋白",
    ingredients: [
      { name: "鸭", amount: 1, unit: "只" },
      { name: "茶叶", amount: 30, unit: "克" },
      { name: "花椒", amount: 1, unit: "小撮" },
      { name: "姜", amount: 3, unit: "片" },
      { name: "盐", amount: 1, unit: "小撮" }
    ],
    steps: [
      "鸭子洗净，用花椒盐内外抹匀腌制4小时。",
      "锅中放茶叶、糖，架上蒸格放入鸭子熏制10分钟。",
      "取出鸭子入蒸锅大火蒸40分钟。",
      "晾凉后入油锅炸至表皮金黄酥脆。",
      "斩块装盘即可。",
    ],
    videoUrl: "https://search.bilibili.com/all?keyword=樟茶鸭",
    substitutes: [106, 94, 139]
  },
  {
    id: 24, name: "川北凉粉", cuisine: "川菜", category: "素", lightness: "light", meals: ["早餐","中餐"], nutrition: "",
    ingredients: [
      { name: "凉粉", amount: 300, unit: "克" },
      { name: "辣椒油", amount: 1, unit: "勺" },
      { name: "蒜", amount: 2, unit: "瓣" },
      { name: "酱油", amount: 1, unit: "勺" },
      { name: "醋", amount: 1, unit: "勺" },
      { name: "葱", amount: 1, unit: "根" }
    ],
    steps: [
      "凉粉切成条或块状，摆入盘中。",
      "蒜捣成泥加少许凉开水调成蒜水。",
      "辣椒油加酱油、醋、糖调成酸辣汁。",
      "将蒜水和酸辣汁浇在凉粉上。",
      "撒葱花和花生碎即可。",
    ],
    videoUrl: "https://search.bilibili.com/all?keyword=川北凉粉",
    substitutes: [10, 6, 176]
  },
  {
    id: 25, name: "甜水面", cuisine: "川菜", category: "素", lightness: "regular", meals: ["早餐","中餐"], nutrition: "",
    ingredients: [
      { name: "粗面条", amount: 300, unit: "克" },
      { name: "芝麻酱", amount: 1, unit: "勺" },
      { name: "酱油", amount: 1, unit: "勺" },
      { name: "辣椒油", amount: 1, unit: "勺" },
      { name: "糖", amount: 1, unit: "勺" },
      { name: "蒜", amount: 2, unit: "瓣" }
    ],
    steps: [
      "粗面条入沸水煮至熟透，捞出过凉水沥干。",
      "芝麻酱用温水调稀。",
      "蒜切末，加酱油、辣椒油、糖调成酱汁。",
      "将面条盛碗，淋芝麻酱和酱汁。",
      "撒葱花拌匀即可。",
    ],
    videoUrl: "https://search.bilibili.com/all?keyword=甜水面",
    substitutes: [10, 24, 22]
  },

  // ======================================== 粤菜 (23道, id 26-48) ========================================
  {
    id: 26, name: "白切鸡", cuisine: "粤菜", category: "荤", lightness: "light", meals: ["早餐","中餐","晚餐"], nutrition: "减脂,高蛋白",
    ingredients: [
      { name: "鸡", amount: 1, unit: "只" },
      { name: "姜", amount: 5, unit: "片" },
      { name: "葱", amount: 2, unit: "根" },
      { name: "酱油", amount: 1, unit: "勺" },
      { name: "花生油", amount: 1, unit: "勺" }
    ],
    steps: [
      "鸡处理干净，锅中加水放姜片、葱结烧开。",
      "手提鸡颈，三浸三提（浸入沸水提起，重复三次），使鸡腔内外温度均匀。",
      "将鸡完全浸入水中，水再次微沸后关火，加盖焖25分钟。",
      "取出鸡浸入冰水中过冷，使鸡皮紧致爽滑。",
      "斩件装盘，姜葱蓉加盐、滚油调成蘸料即可。"
    ],
    videoUrl: "https://search.bilibili.com/all?keyword=白切鸡",
    substitutes: [38, 39, 153]
  },
  {
    id: 27, name: "清蒸鲈鱼", cuisine: "粤菜", category: "荤", lightness: "light", meals: ["早餐","中餐","晚餐"], nutrition: "减脂,高蛋白",
    ingredients: [
      { name: "鲈鱼", amount: 1, unit: "条" },
      { name: "姜", amount: 3, unit: "片" },
      { name: "葱", amount: 2, unit: "根" },
      { name: "蒸鱼豉油", amount: 2, unit: "勺" }
    ],
    steps: [
      "鲈鱼处理干净，两面划刀，抹少许盐和料酒，铺姜片腌10分钟。",
      "盘底垫葱段和姜片，放上鲈鱼。",
      "水开后上锅大火蒸8-10分钟，关火虚蒸2分钟。",
      "取出倒掉盘内腥水，铺葱丝，淋蒸鱼豉油。",
      "烧一勺热油浇在葱丝上激香即成。"
    ],
    videoUrl: "https://search.bilibili.com/all?keyword=清蒸鲈鱼",
    substitutes: [104, 49, 70]
  },
  {
    id: 28, name: "蒜蓉菜心", cuisine: "粤菜", category: "素", lightness: "light", meals: ["早餐","中餐","晚餐"], nutrition: "减脂",
    ingredients: [
      { name: "菜心", amount: 300, unit: "克" },
      { name: "蒜", amount: 3, unit: "瓣" },
      { name: "盐", amount: 1, unit: "小撮" }
    ],
    steps: [
      "菜心摘去老叶洗净，根部划十字。",
      "蒜切末。",
      "烧一锅水加少许油和盐，水开后下菜心焯烫1分钟。",
      "捞出沥干摆盘。",
      "热锅加少许油炒香蒜末，淋在菜心上即可。",
    ],
    videoUrl: "https://search.bilibili.com/all?keyword=蒜蓉菜心",
    substitutes: [30, 40, 161]
  },
  {
    id: 29, name: "叉烧", cuisine: "粤菜", category: "荤", lightness: "regular", meals: ["中餐","晚餐"], nutrition: "高蛋白",
    ingredients: [
      { name: "猪梅花肉", amount: 400, unit: "克" },
      { name: "蜂蜜", amount: 2, unit: "勺" },
      { name: "酱油", amount: 2, unit: "勺" },
      { name: "糖", amount: 2, unit: "勺" },
      { name: "料酒", amount: 1, unit: "勺" },
      { name: "蒜", amount: 2, unit: "瓣" }
    ],
    steps: [
      "猪肉切成长条状，用叉子在表面扎孔方便入味。",
      "混合酱油、糖、料酒、蒜末、腐乳汁调成腌料。",
      "将肉放入腌料中按摩均匀，冷藏腌制6小时以上。",
      "烤箱预热180°C，烤盘垫锡纸，肉放在烤架上烤20分钟。",
      "取出刷蜂蜜水，翻面继续烤15分钟至表面红亮即可。"
    ],
    videoUrl: "https://search.bilibili.com/all?keyword=叉烧",
    substitutes: [148, 4, 103]
  },
  {
    id: 30, name: "蚝油生菜", cuisine: "粤菜", category: "素", lightness: "light", meals: ["早餐","中餐","晚餐"], nutrition: "减脂",
    ingredients: [
      { name: "生菜", amount: 300, unit: "克" },
      { name: "蚝油", amount: 1, unit: "勺" },
      { name: "蒜", amount: 2, unit: "瓣" }
    ],
    steps: [
      "生菜摘洗干净，沥干水分。",
      "蒜切末。",
      "水烧开加少许油盐，生菜焯烫30秒捞出摆盘。",
      "热锅少油炒香蒜末，加入蚝油和少许水调匀。",
      "将蚝油汁浇在生菜上即可。",
    ],
    videoUrl: "https://search.bilibili.com/all?keyword=蚝油生菜",
    substitutes: [28, 40, 191]
  },
  {
    id: 31, name: "白灼虾", cuisine: "粤菜", category: "荤", lightness: "light", meals: ["早餐","中餐","晚餐"], nutrition: "减脂,高蛋白",
    ingredients: [
      { name: "虾", amount: 400, unit: "克" },
      { name: "姜", amount: 3, unit: "片" },
      { name: "葱", amount: 1, unit: "根" },
      { name: "酱油", amount: 1, unit: "勺" }
    ],
    steps: [
      "虾剪去虾须虾枪，挑出虾线洗净。",
      "锅中烧水加姜片、葱段、料酒煮沸。",
      "将虾放入沸水中煮约2分钟至变红蜷曲。",
      "捞出摆盘。",
      "姜切末加酱油调成蘸料即可。",
    ],
    videoUrl: "https://search.bilibili.com/all?keyword=白灼虾",
    substitutes: [71, 93, 105]
  },
  {
    id: 32, name: "干炒牛河", cuisine: "粤菜", category: "荤", lightness: "regular", meals: ["中餐","晚餐"], nutrition: "高蛋白",
    ingredients: [
      { name: "河粉", amount: 300, unit: "克" },
      { name: "牛肉", amount: 150, unit: "克" },
      { name: "豆芽", amount: 100, unit: "克" },
      { name: "洋葱", amount: 1, unit: "个" },
      { name: "酱油", amount: 1, unit: "勺" },
      { name: "葱", amount: 1, unit: "根" }
    ],
    steps: [
      "牛肉切薄片，加酱油、料酒、淀粉腌制10分钟。",
      "河粉抖散，豆芽洗净，洋葱切丝。",
      "热锅多油，下牛肉滑炒至变色盛出。",
      "锅中加油烧热，下河粉大火翻炒加酱油调味。",
      "加入牛肉、豆芽、洋葱快速翻炒均匀，撒葱花出锅。",
    ],
    videoUrl: "https://search.bilibili.com/all?keyword=干炒牛河",
    substitutes: [37, 100, 193]
  },
  {
    id: 33, name: "豉汁蒸排骨", cuisine: "粤菜", category: "荤", lightness: "light", meals: ["中餐","晚餐"], nutrition: "高蛋白",
    ingredients: [
      { name: "猪排骨", amount: 400, unit: "克" },
      { name: "豆豉", amount: 1, unit: "勺" },
      { name: "蒜", amount: 3, unit: "瓣" },
      { name: "酱油", amount: 1, unit: "勺" },
      { name: "姜", amount: 3, unit: "片" }
    ],
    steps: [
      "排骨斩小块，加豆豉、蒜末、姜末、酱油、料酒腌制20分钟。",
      "盘中铺平腌好的排骨。",
      "水开后上锅大火蒸20分钟。",
      "取出倒掉多余汤汁。",
      "撒葱花淋少许热油即可。",
    ],
    videoUrl: "https://search.bilibili.com/all?keyword=豉汁蒸排骨",
    substitutes: [150, 45, 65]
  },
  {
    id: 34, name: "菠萝咕咾肉", cuisine: "粤菜", category: "荤", lightness: "heavy", meals: ["中餐","晚餐"], nutrition: "高蛋白",
    ingredients: [
      { name: "猪里脊", amount: 250, unit: "克" },
      { name: "菠萝", amount: 150, unit: "克" },
      { name: "青椒", amount: 2, unit: "个" },
      { name: "番茄酱", amount: 2, unit: "勺" },
      { name: "糖", amount: 1, unit: "勺" },
      { name: "醋", amount: 1, unit: "勺" }
    ],
    steps: [
      "猪里脊切块，加盐料酒腌制，裹淀粉。",
      "油锅六成热，下肉块炸至金黄捞出。",
      "菠萝青椒切块。",
      "另起锅，番茄酱、糖、醋、水熬成酸甜汁。",
      "倒入肉块、菠萝、青椒快速翻炒均匀裹汁。",
    ],
    videoUrl: "https://search.bilibili.com/all?keyword=菠萝咕咾肉",
    substitutes: [69, 120, 16]
  },
  {
    id: 35, name: "姜葱炒蟹", cuisine: "粤菜", category: "荤", lightness: "light", meals: ["中餐","晚餐"], nutrition: "高蛋白",
    ingredients: [
      { name: "螃蟹", amount: 2, unit: "只" },
      { name: "姜", amount: 5, unit: "片" },
      { name: "葱", amount: 3, unit: "根" },
      { name: "料酒", amount: 1, unit: "勺" },
      { name: "盐", amount: 1, unit: "小撮" }
    ],
    steps: [
      "螃蟹刷洗干净，去壳去腮斩块。",
      "姜切大片，葱切段。",
      "热锅多油，下姜片爆香。",
      "放入蟹块大火翻炒至变红。",
      "加料酒、盐调味，放入葱段翻炒均匀出锅。",
    ],
    videoUrl: "https://search.bilibili.com/all?keyword=姜葱炒蟹",
    substitutes: [71, 31, 132]
  },
  {
    id: 36, name: "滑蛋虾仁", cuisine: "粤菜", category: "荤", lightness: "light", meals: ["早餐","中餐","晚餐"], nutrition: "减脂,高蛋白",
    ingredients: [
      { name: "鸡蛋", amount: 3, unit: "个" },
      { name: "虾仁", amount: 150, unit: "克" },
      { name: "葱", amount: 1, unit: "根" },
      { name: "盐", amount: 1, unit: "小撮" },
      { name: "料酒", amount: 1, unit: "小勺" }
    ],
    steps: [
      "虾仁洗净加盐、料酒、蛋清、淀粉腌制10分钟。",
      "鸡蛋打散加少许盐搅匀。",
      "热锅加油，下虾仁滑炒至变红盛出。",
      "锅中加油烧热，倒入蛋液。",
      "蛋液半凝固时加入虾仁，轻推成块撒葱花出锅。",
    ],
    videoUrl: "https://search.bilibili.com/all?keyword=滑蛋虾仁",
    substitutes: [147, 93, 160]
  },
  {
    id: 37, name: "煲仔饭", cuisine: "粤菜", category: "荤", lightness: "regular", meals: ["中餐","晚餐"], nutrition: "高蛋白",
    ingredients: [
      { name: "大米", amount: 200, unit: "克" },
      { name: "腊肠", amount: 2, unit: "根" },
      { name: "腊肉", amount: 80, unit: "克" },
      { name: "菜心", amount: 100, unit: "克" },
      { name: "酱油", amount: 1, unit: "勺" }
    ],
    steps: [
      "大米淘洗浸泡30分钟，放入砂锅加水。",
      "大火烧开后转小火煮至水快干。",
      "腊肠腊肉切片铺在饭面。",
      "盖盖小火焖15分钟至米饭熟透。",
      "淋酱油撒葱花，拌匀即可。",
    ],
    videoUrl: "https://search.bilibili.com/all?keyword=煲仔饭",
    substitutes: [42, 32, 100]
  },
  {
    id: 38, name: "盐焗鸡", cuisine: "粤菜", category: "荤", lightness: "light", meals: ["中餐","晚餐"], nutrition: "减脂,高蛋白",
    ingredients: [
      { name: "鸡", amount: 1, unit: "只" },
      { name: "粗盐", amount: 1000, unit: "克" },
      { name: "姜", amount: 5, unit: "片" },
      { name: "葱", amount: 2, unit: "根" },
      { name: "沙姜粉", amount: 1, unit: "勺" }
    ],
    steps: [
      "鸡处理干净，用沙姜粉、盐内外涂抹腌制1小时。",
      "粗盐倒入锅中小火炒热。",
      "用锡纸将鸡包好。",
      "将鸡埋入热盐中，小火焗40分钟。",
      "取出撕成块装盘即可。",
    ],
    videoUrl: "https://search.bilibili.com/all?keyword=盐焗鸡",
    substitutes: [26, 39, 106]
  },
  {
    id: 39, name: "豉油鸡", cuisine: "粤菜", category: "荤", lightness: "regular", meals: ["中餐","晚餐"], nutrition: "高蛋白",
    ingredients: [
      { name: "鸡腿", amount: 2, unit: "个" },
      { name: "酱油", amount: 3, unit: "勺" },
      { name: "冰糖", amount: 20, unit: "克" },
      { name: "姜", amount: 3, unit: "片" },
      { name: "八角", amount: 2, unit: "个" }
    ],
    steps: [
      "鸡腿洗净，用厨房纸吸干水分。",
      "锅中加酱油、冰糖、姜片、八角和小半碗水烧开。",
      "放入鸡腿，中小火煮10分钟后翻面。",
      "继续煮10分钟至熟透上色。",
      "取出切块摆盘，淋少许豉油汁即可。",
    ],
    videoUrl: "https://search.bilibili.com/all?keyword=豉油鸡",
    substitutes: [26, 38, 153]
  },
  {
    id: 40, name: "清炒芥蓝", cuisine: "粤菜", category: "素", lightness: "light", meals: ["早餐","中餐","晚餐"], nutrition: "减脂",
    ingredients: [
      { name: "芥蓝", amount: 300, unit: "克" },
      { name: "蒜", amount: 2, unit: "瓣" },
      { name: "姜", amount: 2, unit: "片" },
      { name: "盐", amount: 1, unit: "小撮" }
    ],
    steps: [
      "芥蓝摘去老叶，茎部去皮切段。",
      "蒜和姜切末。",
      "水烧开加少许油盐，芥蓝焯烫30秒捞出。",
      "热锅加油，下姜蒜末爆香。",
      "倒入芥蓝大火翻炒，加盐调味出锅。",
    ],
    videoUrl: "https://search.bilibili.com/all?keyword=清炒芥蓝",
    substitutes: [28, 30, 156]
  },
  {
    id: 41, name: "椰子鸡汤", cuisine: "粤菜", category: "荤", lightness: "light", meals: ["中餐","晚餐"], nutrition: "高蛋白",
    ingredients: [
      { name: "鸡", amount: 0.5, unit: "只" },
      { name: "椰子", amount: 1, unit: "个" },
      { name: "红枣", amount: 5, unit: "颗" },
      { name: "枸杞", amount: 10, unit: "克" },
      { name: "姜", amount: 3, unit: "片" }
    ],
    steps: [
      "鸡剁块焯水去血沫。",
      "椰子打开取椰汁和椰肉切条。",
      "砂锅中放入鸡块、椰肉、姜片、红枣。",
      "倒入椰汁和适量清水。",
      "大火烧开转小火炖1小时，加枸杞和盐调味。",
    ],
    videoUrl: "https://search.bilibili.com/all?keyword=椰子鸡汤",
    substitutes: [48, 108, 135]
  },
  {
    id: 42, name: "腊味煲仔饭", cuisine: "粤菜", category: "荤", lightness: "regular", meals: ["中餐","晚餐"], nutrition: "高蛋白",
    ingredients: [
      { name: "大米", amount: 200, unit: "克" },
      { name: "腊肠", amount: 2, unit: "根" },
      { name: "腊肉", amount: 80, unit: "克" },
      { name: "油菜", amount: 100, unit: "克" },
      { name: "酱油", amount: 1, unit: "勺" }
    ],
    steps: [
      "大米淘洗浸泡30分钟，放入砂锅加水。",
      "大火烧开后转小火煮至水快干。",
      "腊肠腊肉切片，油菜焯水备用。",
      "将腊味铺在饭面盖盖小火焖15分钟。",
      "放入油菜再焖2分钟，淋酱油拌匀。",
    ],
    videoUrl: "https://search.bilibili.com/all?keyword=腊味煲仔饭",
    substitutes: [37, 32, 100]
  },
  {
    id: 43, name: "凉瓜炒蛋", cuisine: "粤菜", category: "半荤", lightness: "light", meals: ["早餐","中餐","晚餐"], nutrition: "减脂,高蛋白",
    ingredients: [
      { name: "苦瓜", amount: 1, unit: "根" },
      { name: "鸡蛋", amount: 3, unit: "个" },
      { name: "蒜", amount: 1, unit: "瓣" },
      { name: "盐", amount: 1, unit: "小撮" }
    ],
    steps: [
      "苦瓜对半切开去瓤切薄片，加盐腌制挤去苦水。",
      "鸡蛋打散加少许盐搅匀。",
      "热锅加油，下苦瓜翻炒至断生。",
      "倒入蛋液摊开。",
      "待蛋液半凝固时翻炒成块即可出锅。",
    ],
    videoUrl: "https://search.bilibili.com/all?keyword=凉瓜炒蛋",
    substitutes: [147, 36, 154]
  },
  {
    id: 44, name: "咸鱼茄子煲", cuisine: "粤菜", category: "半荤", lightness: "regular", meals: ["中餐","晚餐"], nutrition: "高蛋白",
    ingredients: [
      { name: "茄子", amount: 2, unit: "根" },
      { name: "咸鱼", amount: 50, unit: "克" },
      { name: "猪肉末", amount: 80, unit: "克" },
      { name: "蒜", amount: 2, unit: "瓣" },
      { name: "酱油", amount: 1, unit: "勺" }
    ],
    steps: [
      "茄子切条，咸鱼切碎，蒜切末。",
      "锅中多油，下茄子炸软捞出沥油。",
      "锅中留底油，下咸鱼碎炒香。",
      "加入蒜末和猪肉末翻炒至变色。",
      "放入茄子加酱油翻炒，加少许水焖2分钟出锅。",
    ],
    videoUrl: "https://search.bilibili.com/all?keyword=咸鱼茄子煲",
    substitutes: [152, 162, 1]
  },
  {
    id: 45, name: "蒜香排骨", cuisine: "粤菜", category: "荤", lightness: "heavy", meals: ["中餐","晚餐"], nutrition: "高蛋白",
    ingredients: [
      { name: "猪排骨", amount: 400, unit: "克" },
      { name: "蒜", amount: 5, unit: "瓣" },
      { name: "料酒", amount: 1, unit: "勺" },
      { name: "酱油", amount: 1, unit: "勺" },
      { name: "糖", amount: 1, unit: "小撮" }
    ],
    steps: [
      "排骨斩小块，加料酒、酱油、蒜末腌制30分钟。",
      "加入淀粉抓匀。",
      "油锅六成热，下排骨炸至金黄捞出。",
      "油温升高复炸一次至酥脆。",
      "捞出沥油装盘即可。",
    ],
    videoUrl: "https://search.bilibili.com/all?keyword=蒜香排骨",
    substitutes: [33, 150, 29]
  },
  {
    id: 46, name: "椒丝腐乳通菜", cuisine: "粤菜", category: "素", lightness: "light", meals: ["中餐","晚餐"], nutrition: "",
    ingredients: [
      { name: "空心菜", amount: 300, unit: "克" },
      { name: "腐乳", amount: 2, unit: "块" },
      { name: "红椒", amount: 1, unit: "个" },
      { name: "蒜", amount: 2, unit: "瓣" }
    ],
    steps: [
      "空心菜摘洗干净切段，红椒切丝。",
      "腐乳用少许水调成腐乳汁。",
      "热锅加油，下蒜末和红椒丝爆香。",
      "放入空心菜大火翻炒至变软。",
      "淋入腐乳汁翻炒均匀即可出锅。",
    ],
    videoUrl: "https://search.bilibili.com/all?keyword=椒丝腐乳通菜",
    substitutes: [30, 28, 40]
  },
  {
    id: 47, name: "沙姜猪手", cuisine: "粤菜", category: "荤", lightness: "light", meals: ["中餐","晚餐"], nutrition: "高蛋白",
    ingredients: [
      { name: "猪蹄", amount: 1, unit: "只" },
      { name: "沙姜", amount: 30, unit: "克" },
      { name: "蒜", amount: 3, unit: "瓣" },
      { name: "酱油", amount: 1, unit: "勺" },
      { name: "料酒", amount: 1, unit: "勺" }
    ],
    steps: [
      "猪蹄洗净斩块冷水下锅焯水。",
      "沙姜切片，蒜切末。",
      "砂锅中放入猪蹄、沙姜、料酒、酱油。",
      "加水没过大火烧开转小火炖1小时至酥烂。",
      "收汁后撒蒜末即可。",
    ],
    videoUrl: "https://search.bilibili.com/all?keyword=沙姜猪手",
    substitutes: [14, 20, 26]
  },
  {
    id: 48, name: "老火排骨汤", cuisine: "粤菜", category: "荤", lightness: "light", meals: ["中餐","晚餐"], nutrition: "高蛋白",
    ingredients: [
      { name: "猪排骨", amount: 300, unit: "克" },
      { name: "胡萝卜", amount: 1, unit: "根" },
      { name: "玉米", amount: 1, unit: "根" },
      { name: "红枣", amount: 5, unit: "颗" },
      { name: "枸杞", amount: 10, unit: "克" },
      { name: "姜", amount: 3, unit: "片" }
    ],
    steps: [
      "排骨斩块焯水去血沫。",
      "胡萝卜和玉米切段。",
      "砂锅中放入排骨、姜片、红枣、枸杞。",
      "加水没过大火烧开转小火炖1小时。",
      "加入胡萝卜和玉米继续炖20分钟，加盐调味。",
    ],
    videoUrl: "https://search.bilibili.com/all?keyword=老火排骨汤",
    substitutes: [41, 164, 115]
  },

  // ======================================== 湘菜 (20道, id 49-68) ========================================
  {
    id: 49, name: "剁椒鱼头", cuisine: "湘菜", category: "荤", lightness: "light", meals: ["中餐","晚餐"], nutrition: "减脂,高蛋白",
    ingredients: [
      { name: "胖头鱼头", amount: 1, unit: "个" },
      { name: "剁椒", amount: 3, unit: "勺" },
      { name: "姜", amount: 3, unit: "片" },
      { name: "葱", amount: 1, unit: "根" },
      { name: "蒜", amount: 3, unit: "瓣" },
      { name: "蒸鱼豉油", amount: 1, unit: "勺" }
    ],
    steps: [
      "鱼头对半劈开洗净，抹盐和料酒腌制10分钟。",
      "盘底铺姜片和葱段，鱼头面朝上摆入盘中。",
      "将剁椒均匀铺满鱼头表面，再放姜丝和蒜末。",
      "水烧开后上锅大火蒸12分钟。",
      "取出淋蒸鱼豉油，烧热油浇在剁椒上激香即可。"
    ],
    videoUrl: "https://search.bilibili.com/all?keyword=剁椒鱼头",
    substitutes: [27, 104, 127]
  },
  {
    id: 50, name: "辣椒炒肉", cuisine: "湘菜", category: "荤", lightness: "regular", meals: ["中餐","晚餐"], nutrition: "高蛋白",
    ingredients: [
      { name: "猪肉", amount: 250, unit: "克" },
      { name: "青椒", amount: 3, unit: "个" },
      { name: "蒜", amount: 3, unit: "瓣" },
      { name: "酱油", amount: 1, unit: "勺" },
      { name: "豆豉", amount: 1, unit: "小勺" }
    ],
    steps: [
      "猪肉切薄片，用酱油和少许料酒腌制10分钟。",
      "青椒斜切成圈，蒜切片。",
      "热锅少油，下肥肉煸出油，再下瘦肉翻炒至变色。",
      "盛出肉片，下青椒大火爆炒至表皮起皱。",
      "倒回肉片，加蒜、豆豉快速翻炒，酱油调味出锅。"
    ],
    videoUrl: "https://search.bilibili.com/all?keyword=辣椒炒肉",
    substitutes: [52, 4, 13]
  },
  {
    id: 51, name: "酸豆角肉末", cuisine: "湘菜", category: "半荤", lightness: "regular", meals: ["中餐","晚餐"], nutrition: "高蛋白",
    ingredients: [
      { name: "猪肉末", amount: 150, unit: "克" },
      { name: "酸豆角", amount: 150, unit: "克" },
      { name: "蒜", amount: 2, unit: "瓣" },
      { name: "干辣椒", amount: 3, unit: "个" }
    ],
    steps: [
      "酸豆角切碎泡水去咸，猪肉末加料酒腌制。",
      "蒜切末，干辣椒切段。",
      "热锅加油，下肉末炒散至变色。",
      "加入干辣椒和蒜末炒香。",
      "倒入酸豆角大火翻炒2分钟，加少许糖调味出锅。",
    ],
    videoUrl: "https://search.bilibili.com/all?keyword=酸豆角肉末",
    substitutes: [1, 152, 59]
  },
  {
    id: 52, name: "小炒黄牛肉", cuisine: "湘菜", category: "荤", lightness: "regular", meals: ["中餐","晚餐"], nutrition: "高蛋白",
    ingredients: [
      { name: "牛肉", amount: 250, unit: "克" },
      { name: "青椒", amount: 2, unit: "个" },
      { name: "红椒", amount: 2, unit: "个" },
      { name: "蒜", amount: 3, unit: "瓣" },
      { name: "酱油", amount: 1, unit: "勺" },
      { name: "香菜", amount: 1, unit: "小把" }
    ],
    steps: [
      "牛肉逆纹切薄片，加酱油、料酒、淀粉腌制10分钟。",
      "青红椒切圈，香菜切段，蒜切片。",
      "热锅多油，下牛肉滑炒至变色盛出。",
      "锅留底油，下蒜片和辣椒爆炒出香。",
      "倒回牛肉快速翻炒，加酱油调味，撒香菜出锅。",
    ],
    videoUrl: "https://search.bilibili.com/all?keyword=小炒黄牛肉",
    substitutes: [50, 59, 64]
  },
  {
    id: 53, name: "毛氏红烧肉", cuisine: "湘菜", category: "荤", lightness: "heavy", meals: ["中餐","晚餐"], nutrition: "高蛋白",
    ingredients: [
      { name: "猪五花肉", amount: 500, unit: "克" },
      { name: "冰糖", amount: 30, unit: "克" },
      { name: "干辣椒", amount: 5, unit: "个" },
      { name: "酱油", amount: 2, unit: "勺" },
      { name: "姜", amount: 3, unit: "片" },
      { name: "八角", amount: 2, unit: "个" }
    ],
    steps: [
      "五花肉切方块，冷水下锅焯水去血沫。",
      "锅中少油，下冰糖小火炒至焦糖色。",
      "放入肉块翻炒上色，加姜片、八角、干辣椒炒香。",
      "加酱油和开水没过肉面，大火烧开转小火炖1小时。",
      "大火收汁至汤汁浓稠包裹肉块即可。",
    ],
    videoUrl: "https://search.bilibili.com/all?keyword=毛氏红烧肉",
    substitutes: [148, 146, 103]
  },
  {
    id: 54, name: "外婆菜炒蛋", cuisine: "湘菜", category: "半荤", lightness: "regular", meals: ["中餐","晚餐"], nutrition: "高蛋白",
    ingredients: [
      { name: "外婆菜", amount: 150, unit: "克" },
      { name: "鸡蛋", amount: 3, unit: "个" },
      { name: "干辣椒", amount: 2, unit: "个" },
      { name: "蒜", amount: 1, unit: "瓣" },
      { name: "葱", amount: 1, unit: "根" }
    ],
    steps: [
      "外婆菜泡水去咸沥干，鸡蛋打散加盐搅匀。",
      "蒜切末，干辣椒切段，葱切花。",
      "热锅加油，下蛋液炒散凝固盛出。",
      "锅中加油，下干辣椒蒜末爆香，倒入外婆菜翻炒。",
      "倒回鸡蛋翻炒均匀，撒葱花出锅。",
    ],
    videoUrl: "https://search.bilibili.com/all?keyword=外婆菜炒蛋",
    substitutes: [59, 51, 147]
  },
  {
    id: 55, name: "腊肉炒蒜苔", cuisine: "湘菜", category: "半荤", lightness: "regular", meals: ["中餐","晚餐"], nutrition: "高蛋白",
    ingredients: [
      { name: "腊肉", amount: 150, unit: "克" },
      { name: "蒜苔", amount: 200, unit: "克" },
      { name: "干辣椒", amount: 3, unit: "个" },
      { name: "蒜", amount: 2, unit: "瓣" }
    ],
    steps: [
      "腊肉用热水洗净切片，蒜苔切段。",
      "干辣椒切段，蒜切片。",
      "热锅少油，下腊肉煸炒出油至透明。",
      "加入干辣椒和蒜片炒香。",
      "放入蒜苔大火翻炒至断生即可出锅。",
    ],
    videoUrl: "https://search.bilibili.com/all?keyword=腊肉炒蒜苔",
    substitutes: [170, 50, 166]
  },
  {
    id: 56, name: "香辣小龙虾", cuisine: "湘菜", category: "荤", lightness: "heavy", meals: ["中餐"], nutrition: "高蛋白",
    ingredients: [
      { name: "小龙虾", amount: 1000, unit: "克" },
      { name: "干辣椒", amount: 10, unit: "个" },
      { name: "豆瓣酱", amount: 1, unit: "勺" },
      { name: "花椒", amount: 1, unit: "小撮" },
      { name: "蒜", amount: 5, unit: "瓣" },
      { name: "姜", amount: 3, unit: "片" }
    ],
    steps: [
      "小龙虾用刷子刷洗干净，剪去虾头前端和虾须。",
      "蒜拍碎，姜切片，干辣椒切段。",
      "锅中多油，下豆瓣酱小火炒出红油。",
      "加姜蒜干辣椒花椒爆香，倒入小龙虾翻炒变红。",
      "加啤酒或水没过，大火烧开中火煮15分钟收汁即可。",
    ],
    videoUrl: "https://search.bilibili.com/all?keyword=香辣小龙虾",
    substitutes: [35, 71, 8]
  },
  {
    id: 57, name: "湘西土匪鸭", cuisine: "湘菜", category: "荤", lightness: "regular", meals: ["中餐","晚餐"], nutrition: "高蛋白",
    ingredients: [
      { name: "鸭", amount: 0.5, unit: "只" },
      { name: "干辣椒", amount: 8, unit: "个" },
      { name: "蒜", amount: 5, unit: "瓣" },
      { name: "姜", amount: 5, unit: "片" },
      { name: "料酒", amount: 1, unit: "勺" },
      { name: "酱油", amount: 1, unit: "勺" }
    ],
    steps: [
      "鸭剁块焯水去血沫，捞出沥干。",
      "姜切片，蒜拍碎，干辣椒切段。",
      "热锅加油，下鸭块煸炒至表面金黄出油。",
      "加姜蒜干辣椒炒香，加酱油料酒翻炒。",
      "加开水没过鸭块，大火烧开转小火炖40分钟收汁。",
    ],
    videoUrl: "https://search.bilibili.com/all?keyword=湘西土匪鸭",
    substitutes: [23, 63, 8]
  },
  {
    id: 58, name: "农家一碗香", cuisine: "湘菜", category: "荤", lightness: "regular", meals: ["中餐","晚餐"], nutrition: "高蛋白",
    ingredients: [
      { name: "猪肉", amount: 150, unit: "克" },
      { name: "鸡蛋", amount: 2, unit: "个" },
      { name: "青椒", amount: 2, unit: "个" },
      { name: "蒜", amount: 2, unit: "瓣" },
      { name: "酱油", amount: 1, unit: "勺" }
    ],
    steps: [
      "猪肉切薄片，加酱油腌制。",
      "鸡蛋打散摊成蛋皮切块。",
      "青椒切圈，蒜切片。",
      "热锅加油，下肉片煸炒出油变色。",
      "加青椒蒜片爆炒，放入蛋块翻炒加酱油调味。",
    ],
    videoUrl: "https://search.bilibili.com/all?keyword=农家一碗香",
    substitutes: [50, 59, 147]
  },
  {
    id: 59, name: "擂辣椒皮蛋", cuisine: "湘菜", category: "半荤", lightness: "regular", meals: ["中餐","晚餐"], nutrition: "高蛋白",
    ingredients: [
      { name: "青椒", amount: 4, unit: "个" },
      { name: "皮蛋", amount: 2, unit: "个" },
      { name: "蒜", amount: 3, unit: "瓣" },
      { name: "酱油", amount: 1, unit: "勺" },
      { name: "香油", amount: 1, unit: "小勺" }
    ],
    steps: [
      "青椒洗净，放火上烤至表皮焦黑起皱。",
      "剥去焦皮，撕成条。",
      "皮蛋剥壳切瓣。",
      "蒜捣成泥，加酱油、香油调汁。",
      "将青椒和皮蛋放入擂钵中，浇汁捣匀即可。",
    ],
    videoUrl: "https://search.bilibili.com/all?keyword=擂辣椒皮蛋",
    substitutes: [51, 54, 58]
  },
  {
    id: 60, name: "干锅肥肠", cuisine: "湘菜", category: "荤", lightness: "heavy", meals: ["中餐"], nutrition: "高蛋白",
    ingredients: [
      { name: "猪大肠", amount: 300, unit: "克" },
      { name: "青椒", amount: 2, unit: "个" },
      { name: "干辣椒", amount: 5, unit: "个" },
      { name: "蒜", amount: 3, unit: "瓣" },
      { name: "酱油", amount: 1, unit: "勺" },
      { name: "姜", amount: 3, unit: "片" }
    ],
    steps: [
      "猪大肠用面粉和醋反复搓洗干净，焯水后切段。",
      "青椒切块，干辣椒切段，姜蒜切片。",
      "锅中多油，下肥肠煸炒至出油微焦。",
      "加豆瓣酱姜蒜干辣椒炒香。",
      "放入青椒翻炒断生，加酱油调味出锅。",
    ],
    videoUrl: "https://search.bilibili.com/all?keyword=干锅肥肠",
    substitutes: [12, 18, 4]
  },
  {
    id: 61, name: "剁椒蒸芋头", cuisine: "湘菜", category: "素", lightness: "light", meals: ["中餐","晚餐"], nutrition: "",
    ingredients: [
      { name: "芋头", amount: 400, unit: "克" },
      { name: "剁椒", amount: 2, unit: "勺" },
      { name: "蒜", amount: 2, unit: "瓣" },
      { name: "葱", amount: 1, unit: "根" }
    ],
    steps: [
      "芋头去皮切滚刀块，摆入蒸碗。",
      "蒜切末撒在芋头上。",
      "剁椒均匀铺在芋头表面。",
      "水开后上锅大火蒸20分钟至芋头软糯。",
      "取出撒葱花，淋少许热油即可。",
    ],
    videoUrl: "https://search.bilibili.com/all?keyword=剁椒蒸芋头",
    substitutes: [16, 110, 144]
  },
  {
    id: 62, name: "永州血鸭", cuisine: "湘菜", category: "荤", lightness: "regular", meals: ["中餐","晚餐"], nutrition: "高蛋白",
    ingredients: [
      { name: "鸭", amount: 0.5, unit: "只" },
      { name: "鸭血", amount: 100, unit: "克" },
      { name: "青椒", amount: 3, unit: "个" },
      { name: "干辣椒", amount: 5, unit: "个" },
      { name: "蒜", amount: 3, unit: "瓣" },
      { name: "姜", amount: 3, unit: "片" }
    ],
    steps: [
      "鸭剁块焯水沥干，鸭血切块。",
      "青椒切块，干辣椒切段，姜蒜切片。",
      "热锅加油，下鸭块煸炒至金黄。",
      "加姜蒜干辣椒炒香，加酱油和水炖20分钟。",
      "倒入鸭血和青椒翻炒至鸭血熟透收汁出锅。",
    ],
    videoUrl: "https://search.bilibili.com/all?keyword=永州血鸭",
    substitutes: [57, 63, 23]
  },
  {
    id: 63, name: "酸辣鸡杂", cuisine: "湘菜", category: "荤", lightness: "regular", meals: ["中餐","晚餐"], nutrition: "高蛋白",
    ingredients: [
      { name: "鸡胗", amount: 200, unit: "克" },
      { name: "酸豆角", amount: 100, unit: "克" },
      { name: "泡椒", amount: 50, unit: "克" },
      { name: "蒜", amount: 2, unit: "瓣" },
      { name: "姜", amount: 3, unit: "片" }
    ],
    steps: [
      "鸡胗切薄片，焯水沥干。",
      "酸豆角切碎，泡椒切段，姜蒜切片。",
      "热锅加油，下鸡胗大火爆炒至变色。",
      "加入泡椒、酸豆角、姜蒜翻炒出香。",
      "加少许酱油调味，翻炒均匀出锅。",
    ],
    videoUrl: "https://search.bilibili.com/all?keyword=酸辣鸡杂",
    substitutes: [51, 62, 50]
  },
  {
    id: 64, name: "孜然牛肉", cuisine: "湘菜", category: "荤", lightness: "regular", meals: ["中餐","晚餐"], nutrition: "高蛋白",
    ingredients: [
      { name: "牛肉", amount: 250, unit: "克" },
      { name: "孜然粉", amount: 1, unit: "勺" },
      { name: "干辣椒", amount: 3, unit: "个" },
      { name: "蒜", amount: 2, unit: "瓣" },
      { name: "青椒", amount: 1, unit: "个" },
      { name: "洋葱", amount: 0.5, unit: "个" }
    ],
    steps: [
      "牛肉逆纹切薄片，加料酒、酱油、淀粉腌制10分钟。",
      "洋葱切丝，青椒切块，蒜切片。",
      "热锅多油，下牛肉滑炒至变色盛出。",
      "锅留底油，下洋葱蒜片炒香。",
      "倒回牛肉，加孜然粉和干辣椒翻炒均匀出锅。",
    ],
    videoUrl: "https://search.bilibili.com/all?keyword=孜然牛肉",
    substitutes: [52, 59, 50]
  },
  {
    id: 65, name: "豆豉蒸排骨", cuisine: "湘菜", category: "荤", lightness: "light", meals: ["中餐","晚餐"], nutrition: "高蛋白",
    ingredients: [
      { name: "猪排骨", amount: 350, unit: "克" },
      { name: "豆豉", amount: 1, unit: "勺" },
      { name: "干辣椒", amount: 3, unit: "个" },
      { name: "蒜", amount: 3, unit: "瓣" },
      { name: "姜", amount: 3, unit: "片" }
    ],
    steps: [
      "排骨斩小块，加豆豉、蒜末、姜末、酱油、料酒腌制30分钟。",
      "盘中铺平腌好的排骨。",
      "水开后上锅大火蒸25分钟。",
      "取出倒掉多余汤汁。",
      "撒葱花淋少许热油即可。",
    ],
    videoUrl: "https://search.bilibili.com/all?keyword=豆豉蒸排骨",
    substitutes: [33, 45, 55]
  },
  {
    id: 66, name: "口味鸡", cuisine: "湘菜", category: "荤", lightness: "regular", meals: ["中餐","晚餐"], nutrition: "高蛋白",
    ingredients: [
      { name: "鸡腿", amount: 2, unit: "个" },
      { name: "青椒", amount: 3, unit: "个" },
      { name: "干辣椒", amount: 5, unit: "个" },
      { name: "姜", amount: 5, unit: "片" },
      { name: "蒜", amount: 3, unit: "瓣" },
      { name: "酱油", amount: 1, unit: "勺" }
    ],
    steps: [
      "鸡腿剁块焯水沥干。",
      "青椒切块，干辣椒切段，姜切片，蒜拍碎。",
      "热锅多油，下鸡块煸炒至表面金黄。",
      "加姜蒜干辣椒炒香，加酱油料酒翻炒。",
      "加少许水焖10分钟，放入青椒大火收汁即可。",
    ],
    videoUrl: "https://search.bilibili.com/all?keyword=口味鸡",
    substitutes: [8, 52, 50]
  },
  {
    id: 67, name: "老干妈炒饭", cuisine: "湘菜", category: "半荤", lightness: "regular", meals: ["早餐","中餐"], nutrition: "高蛋白",
    ingredients: [
      { name: "米饭", amount: 2, unit: "碗" },
      { name: "鸡蛋", amount: 2, unit: "个" },
      { name: "老干妈", amount: 1, unit: "勺" },
      { name: "火腿", amount: 80, unit: "克" },
      { name: "葱", amount: 1, unit: "根" }
    ],
    steps: [
      "鸡蛋打散炒散盛出，火腿切丁。",
      "热锅加油，下米饭大火炒散。",
      "加入老干妈翻炒均匀。",
      "倒入鸡蛋和火腿丁翻炒。",
      "撒葱花加少许盐调味出锅。",
    ],
    videoUrl: "https://search.bilibili.com/all?keyword=老干妈炒饭",
    substitutes: [159, 100, 10]
  },
  {
    id: 68, name: "攸县香干", cuisine: "湘菜", category: "半荤", lightness: "regular", meals: ["中餐","晚餐"], nutrition: "高蛋白",
    ingredients: [
      { name: "香干", amount: 200, unit: "克" },
      { name: "猪肉", amount: 80, unit: "克" },
      { name: "青椒", amount: 2, unit: "个" },
      { name: "蒜", amount: 2, unit: "瓣" },
      { name: "酱油", amount: 1, unit: "勺" }
    ],
    steps: [
      "香干切薄片，猪肉切片，青椒切块。",
      "蒜切片。",
      "热锅加油，下肉片煸炒出油。",
      "放入香干煎至两面微黄。",
      "加青椒蒜片翻炒，加酱油调味出锅。",
    ],
    videoUrl: "https://search.bilibili.com/all?keyword=攸县香干",
    substitutes: [1, 167, 50]
  },

  // ======================================== 鲁菜 (18道, id 69-86) ========================================
  {
    id: 69, name: "糖醋里脊", cuisine: "鲁菜", category: "荤", lightness: "heavy", meals: ["中餐","晚餐"], nutrition: "高蛋白",
    ingredients: [
      { name: "猪里脊", amount: 300, unit: "克" },
      { name: "番茄酱", amount: 2, unit: "勺" },
      { name: "醋", amount: 1, unit: "勺" },
      { name: "糖", amount: 2, unit: "勺" }
    ],
    steps: [
      "猪里脊切条，加盐、料酒、蛋清腌制，裹上淀粉。",
      "油锅烧至六成热，逐条下入肉条炸至金黄捞出。",
      "油温升高后复炸一次至酥脆。",
      "另起锅，放入番茄酱、糖、醋、水熬成糖醋汁。",
      "倒入炸好的里脊快速翻炒，使每块都裹满汁液即可。"
    ],
    videoUrl: "https://search.bilibili.com/all?keyword=糖醋里脊",
    substitutes: [34, 150, 171]
  },
  {
    id: 70, name: "葱烧海参", cuisine: "鲁菜", category: "荤", lightness: "light", meals: ["中餐","晚餐"], nutrition: "减脂,高蛋白",
    ingredients: [
      { name: "海参", amount: 200, unit: "克" },
      { name: "葱", amount: 3, unit: "根" },
      { name: "酱油", amount: 1, unit: "勺" },
      { name: "糖", amount: 1, unit: "小撮" },
      { name: "料酒", amount: 1, unit: "勺" }
    ],
    steps: [
      "海参提前泡发洗净切条。",
      "葱切大段，姜切片。",
      "热锅加油，下葱段小火炸至金黄出香盛出。",
      "锅中留葱油，下姜片爆香，放入海参。",
      "加酱油、糖、料酒和少许水焖3分钟，勾芡淋葱油出锅。",
    ],
    videoUrl: "https://search.bilibili.com/all?keyword=葱烧海参",
    substitutes: [71, 35, 132]
  },
  {
    id: 71, name: "油焖大虾", cuisine: "鲁菜", category: "荤", lightness: "light", meals: ["中餐","晚餐"], nutrition: "减脂,高蛋白",
    ingredients: [
      { name: "虾", amount: 300, unit: "克" },
      { name: "葱", amount: 2, unit: "根" },
      { name: "姜", amount: 3, unit: "片" },
      { name: "酱油", amount: 1, unit: "勺" },
      { name: "糖", amount: 1, unit: "勺" },
      { name: "料酒", amount: 1, unit: "勺" }
    ],
    steps: [
      "虾剪去虾须虾枪，挑出虾线，洗净沥干。",
      "锅中油热，下葱姜爆香。",
      "放入大虾煎至两面变红。",
      "加料酒、酱油、糖和少许水，盖上锅盖焖3分钟。",
      "开盖大火收汁，不断翻动让虾裹满酱汁即可。"
    ],
    videoUrl: "https://search.bilibili.com/all?keyword=油焖大虾",
    substitutes: [31, 35, 56]
  },
  {
    id: 72, name: "九转大肠", cuisine: "鲁菜", category: "荤", lightness: "heavy", meals: ["中餐"], nutrition: "高蛋白",
    ingredients: [
      { name: "猪大肠", amount: 400, unit: "克" },
      { name: "酱油", amount: 1, unit: "勺" },
      { name: "糖", amount: 2, unit: "勺" },
      { name: "醋", amount: 1, unit: "勺" },
      { name: "花椒", amount: 1, unit: "小撮" },
      { name: "姜", amount: 3, unit: "片" }
    ],
    steps: [
      "猪大肠用面粉醋反复搓洗干净，焯水后切段。",
      "锅中加酱油、糖、醋、花椒、姜片调成汁。",
      "放入大肠段大火烧开。",
      "转小火炖煮1小时至入味软烂。",
      "大火收汁至汤汁浓稠包裹大肠即可。",
    ],
    videoUrl: "https://search.bilibili.com/all?keyword=九转大肠",
    substitutes: [60, 20, 86]
  },
  {
    id: 73, name: "木须肉", cuisine: "鲁菜", category: "半荤", lightness: "light", meals: ["中餐","晚餐"], nutrition: "高蛋白",
    ingredients: [
      { name: "猪里脊", amount: 120, unit: "克" },
      { name: "鸡蛋", amount: 2, unit: "个" },
      { name: "木耳", amount: 50, unit: "克" },
      { name: "黄花菜", amount: 30, unit: "克" },
      { name: "黄瓜", amount: 1, unit: "根" },
      { name: "葱", amount: 1, unit: "根" }
    ],
    steps: [
      "猪里脊切片加盐料酒淀粉腌制，鸡蛋打散。",
      "木耳泡发撕小朵，黄花菜泡发，黄瓜切片。",
      "热锅加油，下蛋液炒散盛出。",
      "锅中加油，下肉片滑炒变色，加入木耳黄花菜翻炒。",
      "倒回鸡蛋，加盐调味翻炒均匀出锅。",
    ],
    videoUrl: "https://search.bilibili.com/all?keyword=木须肉",
    substitutes: [147, 5, 150]
  },
  {
    id: 74, name: "四喜丸子", cuisine: "鲁菜", category: "荤", lightness: "heavy", meals: ["中餐","晚餐"], nutrition: "高蛋白",
    ingredients: [
      { name: "猪五花肉", amount: 400, unit: "克" },
      { name: "鸡蛋", amount: 1, unit: "个" },
      { name: "姜", amount: 3, unit: "片" },
      { name: "葱", amount: 1, unit: "根" },
      { name: "酱油", amount: 1, unit: "勺" },
      { name: "淀粉", amount: 2, unit: "勺" }
    ],
    steps: [
      "猪五花肉剁成肉馅，加姜末、葱末、鸡蛋、酱油、淀粉搅打上劲。",
      "将肉馅团成四个大丸子。",
      "油锅六成热，下丸子炸至表面金黄定型。",
      "砂锅中加酱油、糖、水，放入丸子大火烧开。",
      "转小火炖40分钟，勾芡收汁即可。",
    ],
    videoUrl: "https://search.bilibili.com/all?keyword=四喜丸子",
    substitutes: [88, 20, 97]
  },
  {
    id: 75, name: "葱烧豆腐", cuisine: "鲁菜", category: "素", lightness: "light", meals: ["早餐","中餐","晚餐"], nutrition: "",
    ingredients: [
      { name: "豆腐", amount: 1, unit: "块" },
      { name: "葱", amount: 3, unit: "根" },
      { name: "酱油", amount: 1, unit: "勺" },
      { name: "蒜", amount: 1, unit: "瓣" }
    ],
    steps: [
      "豆腐切厚片，葱切段，蒜切片。",
      "热锅加油，下豆腐片煎至两面金黄盛出。",
      "锅中留底油，下葱段小火炸至焦香。",
      "加入蒜片炒香，放入煎好的豆腐。",
      "加酱油和少许水，小火焖2分钟收汁出锅。",
    ],
    videoUrl: "https://search.bilibili.com/all?keyword=葱烧豆腐",
    substitutes: [1, 79, 167]
  },
  {
    id: 76, name: "扒三白", cuisine: "鲁菜", category: "半荤", lightness: "light", meals: ["中餐","晚餐"], nutrition: "减脂,高蛋白",
    ingredients: [
      { name: "鸡胸肉", amount: 100, unit: "克" },
      { name: "鱼肉", amount: 100, unit: "克" },
      { name: "芦笋", amount: 100, unit: "克" },
      { name: "盐", amount: 1, unit: "小撮" },
      { name: "淀粉", amount: 1, unit: "勺" }
    ],
    steps: [
      "鸡胸肉切片加盐蛋清淀粉上浆，鱼肉切片。",
      "芦笋切段焯水。",
      "锅中加水烧开，分别汆烫鸡片和鱼片至变色捞出。",
      "锅中加少许高汤和盐烧开。",
      "放入三种食材轻轻翻动，勾薄芡淋明油出锅。",
    ],
    videoUrl: "https://search.bilibili.com/all?keyword=扒三白",
    substitutes: [36, 27, 190]
  },
  {
    id: 77, name: "醋椒鱼", cuisine: "鲁菜", category: "荤", lightness: "light", meals: ["中餐","晚餐"], nutrition: "减脂,高蛋白",
    ingredients: [
      { name: "草鱼", amount: 1, unit: "条" },
      { name: "醋", amount: 2, unit: "勺" },
      { name: "胡椒", amount: 1, unit: "小撮" },
      { name: "葱", amount: 1, unit: "根" },
      { name: "姜", amount: 3, unit: "片" }
    ],
    steps: [
      "草鱼处理干净，两面剞花刀。",
      "锅中加水放姜片葱段烧开。",
      "放入草鱼小火煮8分钟至熟。",
      "另起锅加鱼汤、醋、胡椒、盐烧开调汁。",
      "将鱼盛入汤碗，浇上醋椒汤，撒葱丝香菜即可。",
    ],
    videoUrl: "https://search.bilibili.com/all?keyword=醋椒鱼",
    substitutes: [104, 27, 17]
  },
  {
    id: 78, name: "糖醋鲤鱼", cuisine: "鲁菜", category: "荤", lightness: "heavy", meals: ["中餐","晚餐"], nutrition: "高蛋白",
    ingredients: [
      { name: "鲤鱼", amount: 1, unit: "条" },
      { name: "醋", amount: 2, unit: "勺" },
      { name: "糖", amount: 2, unit: "勺" },
      { name: "番茄酱", amount: 1, unit: "勺" },
      { name: "葱", amount: 1, unit: "根" },
      { name: "姜", amount: 3, unit: "片" }
    ],
    steps: [
      "鲤鱼处理干净，两面剞牡丹花刀。",
      "鱼身抹盐料酒腌制，拍上干淀粉。",
      "油锅七成热，倒提鱼尾下锅炸至定型金黄。",
      "另起锅，番茄酱、糖、醋、水熬成糖醋汁。",
      "将糖醋汁浇在鱼身上即可。",
    ],
    videoUrl: "https://search.bilibili.com/all?keyword=糖醋鲤鱼",
    substitutes: [89, 69, 34]
  },
  {
    id: 79, name: "锅塌豆腐", cuisine: "鲁菜", category: "素", lightness: "light", meals: ["早餐","中餐","晚餐"], nutrition: "",
    ingredients: [
      { name: "豆腐", amount: 1, unit: "块" },
      { name: "鸡蛋", amount: 2, unit: "个" },
      { name: "葱", amount: 1, unit: "根" },
      { name: "姜", amount: 2, unit: "片" },
      { name: "盐", amount: 1, unit: "小撮" }
    ],
    steps: [
      "豆腐切厚片，撒少许盐腌制5分钟。",
      "鸡蛋打散，葱姜切丝。",
      "豆腐片裹蛋液，下油锅煎至两面金黄。",
      "另起锅加少许水、盐、姜丝烧开。",
      "放入豆腐片小火煨2分钟，撒葱丝出锅。",
    ],
    videoUrl: "https://search.bilibili.com/all?keyword=锅塌豆腐",
    substitutes: [75, 1, 167]
  },
  {
    id: 80, name: "拔丝地瓜", cuisine: "鲁菜", category: "素", lightness: "heavy", meals: ["中餐","晚餐"], nutrition: "",
    ingredients: [
      { name: "地瓜", amount: 350, unit: "克" },
      { name: "糖", amount: 150, unit: "克" },
      { name: "油", amount: 2, unit: "勺" }
    ],
    steps: [
      "地瓜去皮切滚刀块。",
      "油锅六成热，下地瓜炸至金黄熟透捞出。",
      "锅中加糖和少许水，小火慢熬。",
      "不断搅拌至糖浆变成琥珀色起小泡。",
      "倒入地瓜快速翻炒裹匀糖浆，趁热装盘可拉丝。",
    ],
    videoUrl: "https://search.bilibili.com/all?keyword=拔丝地瓜",
    substitutes: [16, 180, 61]
  },
  {
    id: 81, name: "奶汤蒲菜", cuisine: "鲁菜", category: "素", lightness: "light", meals: ["中餐","晚餐"], nutrition: "",
    ingredients: [
      { name: "蒲菜", amount: 200, unit: "克" },
      { name: "虾仁", amount: 50, unit: "克" },
      { name: "火腿", amount: 50, unit: "克" },
      { name: "盐", amount: 1, unit: "小撮" }
    ],
    steps: [
      "蒲菜去皮切段，虾仁洗净，火腿切片。",
      "锅中加高汤烧开。",
      "放入蒲菜煮3分钟至断生。",
      "加入虾仁和火腿继续煮1分钟。",
      "加盐调味，淋少许香油出锅。",
    ],
    videoUrl: "https://search.bilibili.com/all?keyword=奶汤蒲菜",
    substitutes: [76, 73, 2]
  },
  {
    id: 82, name: "清蒸牡蛎", cuisine: "鲁菜", category: "荤", lightness: "light", meals: ["早餐","中餐","晚餐"], nutrition: "减脂,高蛋白",
    ingredients: [
      { name: "牡蛎", amount: 500, unit: "克" },
      { name: "蒜", amount: 4, unit: "瓣" },
      { name: "姜", amount: 3, unit: "片" },
      { name: "酱油", amount: 1, unit: "勺" },
      { name: "葱", amount: 1, unit: "根" }
    ],
    steps: [
      "牡蛎刷洗干净外壳。",
      "蒜切末，姜切片。",
      "水开后上锅大火蒸5分钟至牡蛎开口。",
      "取出去掉上壳。",
      "蒜末加酱油调成蘸料，撒葱花即可。",
    ],
    videoUrl: "https://search.bilibili.com/all?keyword=清蒸牡蛎",
    substitutes: [35, 71, 121]
  },
  {
    id: 83, name: "芙蓉鸡片", cuisine: "鲁菜", category: "荤", lightness: "light", meals: ["中餐","晚餐"], nutrition: "减脂,高蛋白",
    ingredients: [
      { name: "鸡胸肉", amount: 200, unit: "克" },
      { name: "蛋清", amount: 3, unit: "个" },
      { name: "淀粉", amount: 1, unit: "勺" },
      { name: "火腿", amount: 50, unit: "克" },
      { name: "姜", amount: 2, unit: "片" },
      { name: "盐", amount: 1, unit: "小撮" }
    ],
    steps: [
      "鸡胸肉剁成泥，加蛋清、淀粉、盐搅打成鸡浆。",
      "火腿切末。",
      "锅中多油烧至四成热，用勺子舀鸡浆滑入油中成片。",
      "待鸡片浮起变白捞出沥油。",
      "锅中加高汤盐勾薄芡，放入鸡片轻轻翻匀，撒火腿末出锅。",
    ],
    videoUrl: "https://search.bilibili.com/all?keyword=芙蓉鸡片",
    substitutes: [168, 90, 107]
  },
  {
    id: 84, name: "德州扒鸡", cuisine: "鲁菜", category: "荤", lightness: "regular", meals: ["中餐","晚餐"], nutrition: "高蛋白",
    ingredients: [
      { name: "鸡", amount: 1, unit: "只" },
      { name: "酱油", amount: 2, unit: "勺" },
      { name: "蜂蜜", amount: 1, unit: "勺" },
      { name: "姜", amount: 5, unit: "片" },
      { name: "八角", amount: 2, unit: "个" },
      { name: "花椒", amount: 1, unit: "小撮" }
    ],
    steps: [
      "鸡处理干净，用酱油涂抹全身上色。",
      "蜂蜜加水调匀刷在鸡皮上。",
      "油锅烧热，将鸡炸至表皮金黄。",
      "砂锅中加酱油、姜、八角、花椒、水烧开。",
      "放入鸡小火炖1.5小时至骨肉分离即可。",
    ],
    videoUrl: "https://search.bilibili.com/all?keyword=德州扒鸡",
    substitutes: [26, 38, 106]
  },
  {
    id: 85, name: "酸辣汤", cuisine: "鲁菜", category: "半荤", lightness: "light", meals: ["中餐","晚餐"], nutrition: "",
    ingredients: [
      { name: "豆腐", amount: 0.5, unit: "块" },
      { name: "鸡蛋", amount: 1, unit: "个" },
      { name: "木耳", amount: 30, unit: "克" },
      { name: "醋", amount: 1, unit: "勺" },
      { name: "胡椒", amount: 1, unit: "小撮" }
    ],
    steps: [
      "豆腐切细丝，木耳切丝，鸡蛋打散。",
      "锅中加水或高汤烧开，放入豆腐丝和木耳丝。",
      "加醋、胡椒、盐调味。",
      "淋入蛋液搅成蛋花。",
      "勾薄芡撒葱花出锅。",
    ],
    videoUrl: "https://search.bilibili.com/all?keyword=酸辣汤",
    substitutes: [168, 107, 73]
  },
  {
    id: 86, name: "红烧大排", cuisine: "鲁菜", category: "荤", lightness: "heavy", meals: ["中餐","晚餐"], nutrition: "高蛋白",
    ingredients: [
      { name: "猪大排", amount: 300, unit: "克" },
      { name: "酱油", amount: 2, unit: "勺" },
      { name: "冰糖", amount: 20, unit: "克" },
      { name: "姜", amount: 3, unit: "片" },
      { name: "葱", amount: 1, unit: "根" },
      { name: "八角", amount: 1, unit: "个" }
    ],
    steps: [
      "猪大排用刀背拍松，加酱油料酒腌制15分钟。",
      "热锅加油，下大排煎至两面金黄。",
      "加入姜片、葱段、八角炒香。",
      "加酱油、冰糖和水没过，大火烧开转小火炖30分钟。",
      "大火收汁至汤汁浓稠包裹大排即可。",
    ],
    videoUrl: "https://search.bilibili.com/all?keyword=红烧大排",
    substitutes: [148, 72, 20]
  },

  // ======================================== 苏菜 (16道, id 87-102) ========================================
  {
    id: 87, name: "糖醋鱼片", cuisine: "苏菜", category: "荤", lightness: "heavy", meals: ["中餐","晚餐"], nutrition: "高蛋白",
    ingredients: [
      { name: "鱼肉", amount: 300, unit: "克" },
      { name: "番茄酱", amount: 2, unit: "勺" },
      { name: "醋", amount: 1, unit: "勺" },
      { name: "糖", amount: 2, unit: "勺" },
      { name: "葱", amount: 1, unit: "根" }
    ],
    steps: [
      "鱼肉切厚片，加盐料酒腌制。",
      "鱼片裹淀粉。",
      "油锅六成热，下鱼片炸至金黄捞出。",
      "另起锅，番茄酱、糖、醋、水熬成糖醋汁。",
      "倒入鱼片快速翻炒均匀裹汁出锅。",
    ],
    videoUrl: "https://search.bilibili.com/all?keyword=糖醋鱼片",
    substitutes: [69, 89, 34]
  },
  {
    id: 88, name: "清炖狮子头", cuisine: "苏菜", category: "荤", lightness: "light", meals: ["中餐","晚餐"], nutrition: "高蛋白",
    ingredients: [
      { name: "猪五花肉", amount: 400, unit: "克" },
      { name: "白菜", amount: 200, unit: "克" },
      { name: "姜", amount: 3, unit: "片" },
      { name: "葱", amount: 1, unit: "根" },
      { name: "料酒", amount: 1, unit: "勺" }
    ],
    steps: [
      "猪五花肉先切石榴籽大小的细丁，加姜末、料酒、盐搅打上劲。",
      "将肉馅团成大丸子，双手反复摔打使其紧实。",
      "砂锅底垫白菜叶，放入狮子头，加清水没过。",
      "大火烧开撇去浮沫，转小火加盖炖2小时。",
      "加盐调味，放入烫好的青菜点缀即成。"
    ],
    videoUrl: "https://search.bilibili.com/all?keyword=清炖狮子头",
    substitutes: [74, 97, 20]
  },
  {
    id: 89, name: "松鼠鳜鱼", cuisine: "苏菜", category: "荤", lightness: "heavy", meals: ["中餐","晚餐"], nutrition: "高蛋白",
    ingredients: [
      { name: "鳜鱼", amount: 1, unit: "条" },
      { name: "番茄酱", amount: 3, unit: "勺" },
      { name: "醋", amount: 2, unit: "勺" },
      { name: "糖", amount: 2, unit: "勺" },
      { name: "姜", amount: 3, unit: "片" },
      { name: "葱", amount: 1, unit: "根" }
    ],
    steps: [
      "鳜鱼去头，沿脊骨两侧片出鱼肉（尾部不切断），打花刀成松果状。",
      "鱼身抹盐和料酒腌制，拍上干淀粉使花纹分明。",
      "油温七成热，倒提着鱼尾放入炸至定型金黄。",
      "另起锅，用番茄酱、糖、醋、水熬成红亮的糖醋汁。",
      "将糖醋汁均匀浇在炸好的鱼身上，趁热上桌。"
    ],
    videoUrl: "https://search.bilibili.com/all?keyword=松鼠鳜鱼",
    substitutes: [78, 87, 104]
  },
  {
    id: 90, name: "大煮干丝", cuisine: "苏菜", category: "半荤", lightness: "light", meals: ["中餐","晚餐"], nutrition: "高蛋白",
    ingredients: [
      { name: "干丝", amount: 200, unit: "克" },
      { name: "鸡胸肉", amount: 80, unit: "克" },
      { name: "虾仁", amount: 50, unit: "克" },
      { name: "火腿", amount: 50, unit: "克" },
      { name: "姜", amount: 2, unit: "片" },
      { name: "盐", amount: 1, unit: "小撮" }
    ],
    steps: [
      "干丝用温水浸泡回软。",
      "鸡胸肉切丝，火腿切丝，虾仁洗净。",
      "锅中加高汤烧开。",
      "放入干丝小火煮5分钟。",
      "加入鸡丝、虾仁、火腿丝煮熟，加盐调味出锅。",
    ],
    videoUrl: "https://search.bilibili.com/all?keyword=大煮干丝",
    substitutes: [95, 81, 107]
  },
  {
    id: 91, name: "响油鳝糊", cuisine: "苏菜", category: "荤", lightness: "regular", meals: ["中餐","晚餐"], nutrition: "高蛋白",
    ingredients: [
      { name: "鳝鱼", amount: 300, unit: "克" },
      { name: "蒜", amount: 3, unit: "瓣" },
      { name: "酱油", amount: 1, unit: "勺" },
      { name: "糖", amount: 1, unit: "勺" },
      { name: "葱", amount: 1, unit: "根" },
      { name: "姜", amount: 3, unit: "片" }
    ],
    steps: [
      "鳝鱼去骨切段，加料酒淀粉腌制。",
      "蒜切末，葱切段，姜切丝。",
      "热锅加油，下鳝段滑炒至变色。",
      "加酱油、糖、少许水焖2分钟。",
      "盛盘后中间挖一小坑，放蒜末葱花，浇滚热油滋啦作响即可。",
    ],
    videoUrl: "https://search.bilibili.com/all?keyword=响油鳝糊",
    substitutes: [141, 112, 27]
  },
  {
    id: 92, name: "无锡排骨", cuisine: "苏菜", category: "荤", lightness: "heavy", meals: ["中餐","晚餐"], nutrition: "高蛋白",
    ingredients: [
      { name: "猪排骨", amount: 500, unit: "克" },
      { name: "酱油", amount: 2, unit: "勺" },
      { name: "糖", amount: 2, unit: "勺" },
      { name: "料酒", amount: 1, unit: "勺" },
      { name: "姜", amount: 3, unit: "片" },
      { name: "八角", amount: 1, unit: "个" }
    ],
    steps: [
      "排骨斩块焯水去血沫。",
      "锅中加少许油，下糖小火炒至焦糖色。",
      "放入排骨翻炒上色。",
      "加酱油、料酒、姜片、八角和水没过。",
      "大火烧开转小火炖40分钟，收汁至浓稠。",
    ],
    videoUrl: "https://search.bilibili.com/all?keyword=无锡排骨",
    substitutes: [150, 148, 86]
  },
  {
    id: 93, name: "水晶虾仁", cuisine: "苏菜", category: "荤", lightness: "light", meals: ["早餐","中餐","晚餐"], nutrition: "减脂,高蛋白",
    ingredients: [
      { name: "虾仁", amount: 250, unit: "克" },
      { name: "蛋清", amount: 1, unit: "个" },
      { name: "淀粉", amount: 1, unit: "勺" },
      { name: "姜", amount: 2, unit: "片" },
      { name: "盐", amount: 1, unit: "小撮" }
    ],
    steps: [
      "虾仁洗净加盐、蛋清、淀粉抓匀上浆冷藏20分钟。",
      "姜切片。",
      "油锅烧至四成热，下虾仁滑炒至变红透明盛出。",
      "锅中加少许水盐勾薄芡。",
      "倒回虾仁快速翻匀淋明油出锅。",
    ],
    videoUrl: "https://search.bilibili.com/all?keyword=水晶虾仁",
    substitutes: [36, 105, 31]
  },
  {
    id: 94, name: "盐水鸭", cuisine: "苏菜", category: "荤", lightness: "light", meals: ["中餐","晚餐"], nutrition: "减脂,高蛋白",
    ingredients: [
      { name: "鸭", amount: 1, unit: "只" },
      { name: "盐", amount: 3, unit: "勺" },
      { name: "花椒", amount: 1, unit: "小撮" },
      { name: "八角", amount: 2, unit: "个" },
      { name: "姜", amount: 5, unit: "片" },
      { name: "葱", amount: 2, unit: "根" }
    ],
    steps: [
      "鸭子洗净沥干，用花椒盐内外抹匀腌制6小时。",
      "冲洗表面盐分。",
      "锅中加水放姜片、葱段、八角烧开。",
      "放入鸭子大火煮开转小火焖40分钟。",
      "捞出晾凉斩块装盘即可。",
    ],
    videoUrl: "https://search.bilibili.com/all?keyword=盐水鸭",
    substitutes: [23, 106, 139]
  },
  {
    id: 95, name: "文思豆腐", cuisine: "苏菜", category: "素", lightness: "light", meals: ["早餐","中餐","晚餐"], nutrition: "减脂",
    ingredients: [
      { name: "豆腐", amount: 1, unit: "块" },
      { name: "香菇", amount: 3, unit: "朵" },
      { name: "火腿", amount: 30, unit: "克" },
      { name: "青菜", amount: 50, unit: "克" },
      { name: "盐", amount: 1, unit: "小撮" }
    ],
    steps: [
      "豆腐切成极细的丝，放入清水中。",
      "香菇、火腿切细丝，青菜切丝。",
      "锅中加高汤烧开。",
      "轻轻放入豆腐丝和各种配料丝。",
      "加盐调味，小火煮2分钟，勾薄芡出锅。",
    ],
    videoUrl: "https://search.bilibili.com/all?keyword=文思豆腐",
    substitutes: [90, 79, 75]
  },
  {
    id: 96, name: "干烧鲳鱼", cuisine: "苏菜", category: "荤", lightness: "regular", meals: ["中餐","晚餐"], nutrition: "高蛋白",
    ingredients: [
      { name: "鲳鱼", amount: 1, unit: "条" },
      { name: "豆瓣酱", amount: 1, unit: "勺" },
      { name: "糖", amount: 1, unit: "勺" },
      { name: "姜", amount: 3, unit: "片" },
      { name: "葱", amount: 1, unit: "根" },
      { name: "料酒", amount: 1, unit: "勺" }
    ],
    steps: [
      "鲳鱼处理干净，两面划刀。",
      "锅中加油，下鲳鱼煎至两面金黄盛出。",
      "锅留底油，下豆瓣酱姜蒜炒香。",
      "加料酒、糖和水，放回鲳鱼。",
      "中火烧至汤汁收干，撒葱花出锅。",
    ],
    videoUrl: "https://search.bilibili.com/all?keyword=干烧鲳鱼",
    substitutes: [27, 104, 77]
  },
  {
    id: 97, name: "金陵丸子", cuisine: "苏菜", category: "荤", lightness: "heavy", meals: ["中餐","晚餐"], nutrition: "高蛋白",
    ingredients: [
      { name: "猪五花肉", amount: 350, unit: "克" },
      { name: "鸡蛋", amount: 1, unit: "个" },
      { name: "姜", amount: 3, unit: "片" },
      { name: "葱", amount: 1, unit: "根" },
      { name: "酱油", amount: 1, unit: "勺" }
    ],
    steps: [
      "猪五花肉剁成肉馅，加姜末、葱末、鸡蛋、酱油搅打上劲。",
      "团成大丸子。",
      "锅中加水烧开，轻轻放入丸子。",
      "大火烧开撇去浮沫，转小火炖30分钟。",
      "加酱油调味收汁即可。",
    ],
    videoUrl: "https://search.bilibili.com/all?keyword=金陵丸子",
    substitutes: [88, 74, 148]
  },
  {
    id: 98, name: "蟹粉豆腐", cuisine: "苏菜", category: "半荤", lightness: "light", meals: ["中餐","晚餐"], nutrition: "高蛋白",
    ingredients: [
      { name: "豆腐", amount: 1, unit: "块" },
      { name: "螃蟹", amount: 1, unit: "只" },
      { name: "姜", amount: 3, unit: "片" },
      { name: "盐", amount: 1, unit: "小撮" },
      { name: "料酒", amount: 1, unit: "小勺" }
    ],
    steps: [
      "螃蟹蒸熟拆出蟹黄蟹肉。",
      "豆腐切块焯水捞出。",
      "热锅加油，下姜末爆香。",
      "加入蟹粉炒出红油。",
      "放入豆腐块轻轻翻动，加盐调味勾薄芡出锅。",
    ],
    videoUrl: "https://search.bilibili.com/all?keyword=蟹粉豆腐",
    substitutes: [1, 99, 35]
  },
  {
    id: 99, name: "清蒸大闸蟹", cuisine: "苏菜", category: "荤", lightness: "light", meals: ["中餐","晚餐"], nutrition: "减脂,高蛋白",
    ingredients: [
      { name: "大闸蟹", amount: 4, unit: "只" },
      { name: "姜", amount: 5, unit: "片" },
      { name: "醋", amount: 1, unit: "勺" },
      { name: "酱油", amount: 1, unit: "小勺" }
    ],
    steps: [
      "大闸蟹刷洗干净，不要解开绑绳。",
      "蒸锅中放姜片和葱段。",
      "将蟹肚朝上放入蒸锅。",
      "水开后大火蒸15分钟。",
      "取出配姜醋汁蘸食即可。",
    ],
    videoUrl: "https://search.bilibili.com/all?keyword=清蒸大闸蟹",
    substitutes: [35, 71, 82]
  },
  {
    id: 100, name: "扬州炒饭", cuisine: "苏菜", category: "半荤", lightness: "regular", meals: ["早餐","中餐"], nutrition: "高蛋白",
    ingredients: [
      { name: "米饭", amount: 2, unit: "碗" },
      { name: "鸡蛋", amount: 2, unit: "个" },
      { name: "虾仁", amount: 50, unit: "克" },
      { name: "火腿", amount: 50, unit: "克" },
      { name: "青豆", amount: 30, unit: "克" },
      { name: "葱", amount: 1, unit: "根" }
    ],
    steps: [
      "鸡蛋打散炒碎盛出。",
      "火腿切丁，虾仁焯熟，青豆焯水。",
      "热锅加油，下米饭大火炒散至米粒分明。",
      "加入所有配料翻炒均匀。",
      "加盐调味，撒葱花出锅。",
    ],
    videoUrl: "https://search.bilibili.com/all?keyword=扬州炒饭",
    substitutes: [159, 37, 67]
  },
  {
    id: 101, name: "糖藕", cuisine: "苏菜", category: "素", lightness: "light", meals: ["早餐","中餐","晚餐"], nutrition: "",
    ingredients: [
      { name: "莲藕", amount: 2, unit: "节" },
      { name: "糯米", amount: 100, unit: "克" },
      { name: "红糖", amount: 100, unit: "克" },
      { name: "桂花", amount: 1, unit: "小撮" }
    ],
    steps: [
      "莲藕去皮，从一端切开做盖。",
      "糯米提前浸泡2小时沥干。",
      "将糯米塞入藕孔中，用筷子压实。",
      "盖上藕盖用牙签固定，放入锅中加红糖和水。",
      "大火烧开转小火煮2小时，取出切片淋蜂蜜撒桂花。",
    ],
    videoUrl: "https://search.bilibili.com/all?keyword=糖藕",
    substitutes: [114, 80, 16]
  },
  {
    id: 102, name: "碧螺虾仁", cuisine: "苏菜", category: "荤", lightness: "light", meals: ["中餐","晚餐"], nutrition: "减脂,高蛋白",
    ingredients: [
      { name: "虾仁", amount: 250, unit: "克" },
      { name: "碧螺春茶叶", amount: 10, unit: "克" },
      { name: "蛋清", amount: 1, unit: "个" },
      { name: "盐", amount: 1, unit: "小撮" }
    ],
    steps: [
      "碧螺春茶叶用80度热水冲泡取茶汤。",
      "虾仁加盐、蛋清、淀粉上浆。",
      "油锅四成热，下虾仁滑炒变白盛出。",
      "锅中加茶汤、盐煮沸勾薄芡。",
      "倒回虾仁快速翻炒出锅。",
    ],
    videoUrl: "https://search.bilibili.com/all?keyword=碧螺虾仁",
    substitutes: [93, 105, 36]
  },

  // ======================================== 浙菜 (18道, id 103-120) ========================================
  {
    id: 103, name: "东坡肉", cuisine: "浙菜", category: "荤", lightness: "heavy", meals: ["中餐","晚餐"], nutrition: "高蛋白",
    ingredients: [
      { name: "猪五花肉", amount: 500, unit: "克" },
      { name: "酱油", amount: 3, unit: "勺" },
      { name: "冰糖", amount: 30, unit: "克" },
      { name: "姜", amount: 5, unit: "片" },
      { name: "葱", amount: 2, unit: "根" },
      { name: "料酒", amount: 2, unit: "勺" }
    ],
    steps: [
      "五花肉切成方块，冷水下锅焯水去血沫。",
      "砂锅底垫葱段姜片，肉皮朝下码入砂锅中。",
      "加酱油、冰糖、料酒，加水没过肉面。",
      "大火烧开转小火，加盖炖1.5小时至肉酥烂。",
      "将肉翻面皮朝上，再炖30分钟收浓汤汁即可。"
    ],
    videoUrl: "https://search.bilibili.com/all?keyword=东坡肉",
    substitutes: [148, 53, 20]
  },
  {
    id: 104, name: "西湖醋鱼", cuisine: "浙菜", category: "荤", lightness: "light", meals: ["中餐","晚餐"], nutrition: "减脂,高蛋白",
    ingredients: [
      { name: "草鱼", amount: 1, unit: "条" },
      { name: "醋", amount: 2, unit: "勺" },
      { name: "糖", amount: 1, unit: "勺" },
      { name: "姜", amount: 3, unit: "片" },
      { name: "葱", amount: 1, unit: "根" },
      { name: "酱油", amount: 1, unit: "勺" }
    ],
    steps: [
      "草鱼在清水中饿养两天去土腥味。",
      "鱼身两面剞花刀，入沸水烫熟捞出装盘。",
      "锅中留少许鱼汤，加酱油、糖、醋调成糖醋汁。",
      "勾薄芡后浇在鱼身上。",
      "撒姜末，淋少许香油即成。"
    ],
    videoUrl: "https://search.bilibili.com/all?keyword=西湖醋鱼",
    substitutes: [27, 89, 49]
  },
  {
    id: 105, name: "龙井虾仁", cuisine: "浙菜", category: "荤", lightness: "light", meals: ["早餐","中餐","晚餐"], nutrition: "减脂,高蛋白",
    ingredients: [
      { name: "虾仁", amount: 250, unit: "克" },
      { name: "龙井茶叶", amount: 5, unit: "克" },
      { name: "蛋清", amount: 1, unit: "个" },
      { name: "淀粉", amount: 1, unit: "勺" },
      { name: "姜", amount: 2, unit: "片" }
    ],
    steps: [
      "龙井茶叶用80°C热水冲泡，取茶水备用。",
      "虾仁加蛋清、淀粉、盐抓匀上浆，冷藏20分钟。",
      "油温四成热，下虾仁滑炒至变白盛出。",
      "锅中加茶水、盐煮沸，勾薄芡。",
      "倒回虾仁快速翻炒，淋少许明油出锅。"
    ],
    videoUrl: "https://search.bilibili.com/all?keyword=龙井虾仁",
    substitutes: [93, 102, 36]
  },
  {
    id: 106, name: "叫花鸡", cuisine: "浙菜", category: "荤", lightness: "light", meals: ["中餐","晚餐"], nutrition: "减脂,高蛋白",
    ingredients: [
      { name: "鸡", amount: 1, unit: "只" },
      { name: "香菇", amount: 5, unit: "朵" },
      { name: "姜", amount: 5, unit: "片" },
      { name: "葱", amount: 3, unit: "根" },
      { name: "酱油", amount: 2, unit: "勺" },
      { name: "料酒", amount: 1, unit: "勺" }
    ],
    steps: [
      "鸡处理干净，用酱油料酒内外涂抹腌制2小时。",
      "香菇泡发，姜葱切丝，塞入鸡腹中。",
      "用荷叶将鸡包裹严实。",
      "再用锡纸包裹荷叶，入烤箱200度烤1小时。",
      "取出敲开外层，撕开荷叶即可食用。",
    ],
    videoUrl: "https://search.bilibili.com/all?keyword=叫花鸡",
    substitutes: [26, 38, 84]
  },
  {
    id: 107, name: "宋嫂鱼羹", cuisine: "浙菜", category: "荤", lightness: "light", meals: ["中餐","晚餐"], nutrition: "减脂,高蛋白",
    ingredients: [
      { name: "鱼肉", amount: 200, unit: "克" },
      { name: "鸡蛋", amount: 1, unit: "个" },
      { name: "火腿", amount: 30, unit: "克" },
      { name: "香菇", amount: 3, unit: "朵" },
      { name: "醋", amount: 1, unit: "小勺" },
      { name: "姜", amount: 3, unit: "片" }
    ],
    steps: [
      "鱼肉切丝加盐蛋清淀粉上浆。",
      "火腿切丝，香菇切丝，鸡蛋打散。",
      "锅中加高汤烧开，放入香菇丝火腿丝。",
      "下鱼丝煮至变白，淋入蛋液成蛋花。",
      "加醋、盐调味，勾薄芡撒姜丝出锅。",
    ],
    videoUrl: "https://search.bilibili.com/all?keyword=宋嫂鱼羹",
    substitutes: [168, 85, 90]
  },
  {
    id: 108, name: "笋干老鸭煲", cuisine: "浙菜", category: "荤", lightness: "light", meals: ["中餐","晚餐"], nutrition: "高蛋白",
    ingredients: [
      { name: "鸭", amount: 1, unit: "只" },
      { name: "笋干", amount: 100, unit: "克" },
      { name: "姜", amount: 5, unit: "片" },
      { name: "料酒", amount: 2, unit: "勺" },
      { name: "红枣", amount: 5, unit: "颗" },
      { name: "枸杞", amount: 10, unit: "克" }
    ],
    steps: [
      "笋干提前泡发切段，鸭剁块焯水。",
      "姜切片，红枣枸杞洗净。",
      "砂锅中放入鸭块、笋干、姜片、料酒。",
      "加水没过食材大火烧开转小火炖1.5小时。",
      "加入红枣枸杞继续炖15分钟加盐调味。",
    ],
    videoUrl: "https://search.bilibili.com/all?keyword=笋干老鸭煲",
    substitutes: [41, 135, 94]
  },
  {
    id: 109, name: "干炸响铃", cuisine: "浙菜", category: "素", lightness: "heavy", meals: ["中餐","晚餐"], nutrition: "高蛋白",
    ingredients: [
      { name: "豆腐皮", amount: 4, unit: "张" },
      { name: "猪肉末", amount: 80, unit: "克" },
      { name: "姜", amount: 2, unit: "片" },
      { name: "葱", amount: 1, unit: "根" },
      { name: "料酒", amount: 1, unit: "小勺" }
    ],
    steps: [
      "猪肉末加姜末、葱末、料酒、盐搅匀做馅。",
      "豆腐皮铺平，抹上肉馅卷紧。",
      "切成段。",
      "油锅六成热，下入卷段炸至金黄酥脆。",
      "捞出沥油装盘即可。",
    ],
    videoUrl: "https://search.bilibili.com/all?keyword=干炸响铃",
    substitutes: [113, 69, 174]
  },
  {
    id: 110, name: "蜜汁火方", cuisine: "浙菜", category: "荤", lightness: "heavy", meals: ["中餐","晚餐"], nutrition: "高蛋白",
    ingredients: [
      { name: "火腿", amount: 300, unit: "克" },
      { name: "蜂蜜", amount: 3, unit: "勺" },
      { name: "冰糖", amount: 50, unit: "克" },
      { name: "莲子", amount: 30, unit: "克" }
    ],
    steps: [
      "火腿切厚片，用温水浸泡去咸。",
      "莲子泡发去芯。",
      "将火腿片码入碗中，放上莲子和冰糖。",
      "加蜂蜜和少许水上锅蒸1小时。",
      "取出倒扣在盘中，淋蒸汁即可。",
    ],
    videoUrl: "https://search.bilibili.com/all?keyword=蜜汁火方",
    substitutes: [103, 29, 16]
  },
  {
    id: 111, name: "荷叶粉蒸肉", cuisine: "浙菜", category: "荤", lightness: "heavy", meals: ["中餐","晚餐"], nutrition: "高蛋白",
    ingredients: [
      { name: "猪五花肉", amount: 300, unit: "克" },
      { name: "米粉", amount: 100, unit: "克" },
      { name: "荷叶", amount: 2, unit: "张" },
      { name: "酱油", amount: 1, unit: "勺" },
      { name: "姜", amount: 3, unit: "片" },
      { name: "料酒", amount: 1, unit: "勺" }
    ],
    steps: [
      "五花肉切片，加酱油、料酒、姜末腌制20分钟。",
      "肉片裹上米粉。",
      "荷叶用热水烫软铺开。",
      "将肉片码在荷叶上包裹严实。",
      "上锅大火蒸50分钟至肉酥烂即可。",
    ],
    videoUrl: "https://search.bilibili.com/all?keyword=荷叶粉蒸肉",
    substitutes: [16, 103, 111]
  },
  {
    id: 112, name: "雪菜黄鱼", cuisine: "浙菜", category: "荤", lightness: "light", meals: ["中餐","晚餐"], nutrition: "减脂,高蛋白",
    ingredients: [
      { name: "黄鱼", amount: 1, unit: "条" },
      { name: "雪菜", amount: 100, unit: "克" },
      { name: "姜", amount: 3, unit: "片" },
      { name: "葱", amount: 1, unit: "根" },
      { name: "料酒", amount: 1, unit: "勺" }
    ],
    steps: [
      "黄鱼处理干净两面划刀。",
      "雪菜洗净切碎。",
      "热锅加油，下姜片爆香，放入黄鱼煎至两面微黄。",
      "加入雪菜和料酒，加少许水。",
      "中火烧8分钟至鱼熟，撒葱花出锅。",
    ],
    videoUrl: "https://search.bilibili.com/all?keyword=雪菜黄鱼",
    substitutes: [27, 104, 112]
  },
  {
    id: 113, name: "素烧鹅", cuisine: "浙菜", category: "素", lightness: "light", meals: ["早餐","中餐","晚餐"], nutrition: "",
    ingredients: [
      { name: "豆腐皮", amount: 4, unit: "张" },
      { name: "酱油", amount: 1, unit: "勺" },
      { name: "糖", amount: 1, unit: "勺" },
      { name: "香油", amount: 1, unit: "小勺" },
      { name: "姜", amount: 2, unit: "片" }
    ],
    steps: [
      "豆腐皮用酱油、糖、香油调成的汁刷匀。",
      "姜切末。",
      "将豆腐皮卷成卷状。",
      "平底锅加油，放入豆皮卷小火煎至两面金黄。",
      "切段装盘即可。",
    ],
    videoUrl: "https://search.bilibili.com/all?keyword=素烧鹅",
    substitutes: [109, 167, 75]
  },
  {
    id: 114, name: "桂花糯米藕", cuisine: "浙菜", category: "素", lightness: "light", meals: ["中餐","晚餐"], nutrition: "",
    ingredients: [
      { name: "莲藕", amount: 2, unit: "节" },
      { name: "糯米", amount: 100, unit: "克" },
      { name: "红糖", amount: 80, unit: "克" },
      { name: "桂花", amount: 1, unit: "小撮" },
      { name: "蜂蜜", amount: 1, unit: "勺" }
    ],
    steps: [
      "莲藕去皮，一端切开做盖。",
      "糯米浸泡2小时沥干塞入藕孔压实。",
      "盖好藕盖用牙签固定，放入锅中加红糖和水。",
      "大火烧开转小火煮2小时。",
      "取出切片淋蜂蜜撒桂花即可。",
    ],
    videoUrl: "https://search.bilibili.com/all?keyword=桂花糯米藕",
    substitutes: [101, 80, 16]
  },
  {
    id: 115, name: "萝卜丝鲫鱼汤", cuisine: "浙菜", category: "荤", lightness: "light", meals: ["中餐","晚餐"], nutrition: "减脂,高蛋白",
    ingredients: [
      { name: "鲫鱼", amount: 1, unit: "条" },
      { name: "白萝卜", amount: 200, unit: "克" },
      { name: "姜", amount: 3, unit: "片" },
      { name: "葱", amount: 1, unit: "根" },
      { name: "盐", amount: 1, unit: "小撮" }
    ],
    steps: [
      "鲫鱼处理干净两面划刀。",
      "白萝卜去皮切细丝。",
      "热锅加油，下姜片爆香，放入鲫鱼煎至两面微黄。",
      "倒入开水大火煮开至汤变白。",
      "加入萝卜丝煮5分钟，加盐调味撒葱花。",
    ],
    videoUrl: "https://search.bilibili.com/all?keyword=萝卜丝鲫鱼汤",
    substitutes: [164, 27, 77]
  },
  {
    id: 116, name: "西湖莼菜羹", cuisine: "浙菜", category: "半荤", lightness: "light", meals: ["中餐","晚餐"], nutrition: "减脂",
    ingredients: [
      { name: "莼菜", amount: 150, unit: "克" },
      { name: "鸡胸肉", amount: 80, unit: "克" },
      { name: "火腿", amount: 30, unit: "克" },
      { name: "姜", amount: 2, unit: "片" },
      { name: "盐", amount: 1, unit: "小撮" }
    ],
    steps: [
      "鸡胸肉切丝加盐淀粉腌制。",
      "火腿切丝。",
      "锅中加高汤烧开。",
      "放入莼菜、鸡丝、火腿丝煮2分钟。",
      "加盐调味勾薄芡出锅。",
    ],
    videoUrl: "https://search.bilibili.com/all?keyword=西湖莼菜羹",
    substitutes: [168, 107, 81]
  },
  {
    id: 117, name: "油焖笋", cuisine: "浙菜", category: "素", lightness: "light", meals: ["早餐","中餐","晚餐"], nutrition: "",
    ingredients: [
      { name: "春笋", amount: 400, unit: "克" },
      { name: "酱油", amount: 1, unit: "勺" },
      { name: "糖", amount: 1, unit: "勺" },
      { name: "葱", amount: 1, unit: "根" }
    ],
    steps: [
      "春笋去壳切滚刀块。",
      "锅中加油，下笋块煸炒至表面微黄。",
      "加酱油、糖翻炒上色。",
      "加少许水盖上锅盖焖5分钟。",
      "大火收汁撒葱花出锅。",
    ],
    videoUrl: "https://search.bilibili.com/all?keyword=油焖笋",
    substitutes: [156, 117, 161]
  },
  {
    id: 118, name: "葱油拌面", cuisine: "浙菜", category: "素", lightness: "light", meals: ["早餐","中餐"], nutrition: "",
    ingredients: [
      { name: "面条", amount: 250, unit: "克" },
      { name: "葱", amount: 5, unit: "根" },
      { name: "酱油", amount: 2, unit: "勺" },
      { name: "糖", amount: 1, unit: "小撮" }
    ],
    steps: [
      "葱切段。",
      "锅中加油，下葱段小火慢炸至焦黄出香。",
      "面条煮熟捞出沥干。",
      "酱油和糖混合调成酱汁。",
      "将面条盛碗，淋酱汁和葱油拌匀即可。",
    ],
    videoUrl: "https://search.bilibili.com/all?keyword=葱油拌面",
    substitutes: [10, 176, 25]
  },
  {
    id: 119, name: "家常豆腐", cuisine: "浙菜", category: "半荤", lightness: "regular", meals: ["中餐","晚餐"], nutrition: "高蛋白",
    ingredients: [
      { name: "豆腐", amount: 1, unit: "块" },
      { name: "猪肉", amount: 80, unit: "克" },
      { name: "木耳", amount: 30, unit: "克" },
      { name: "青椒", amount: 1, unit: "个" },
      { name: "酱油", amount: 1, unit: "勺" },
      { name: "蒜", amount: 2, unit: "瓣" }
    ],
    steps: [
      "豆腐切三角厚片，猪肉切片，木耳泡发撕小朵。",
      "热锅加油，下豆腐煎至两面金黄盛出。",
      "锅中留油，下肉片翻炒变色。",
      "加入木耳、青椒块和蒜片炒香。",
      "放入豆腐加酱油和少许水焖2分钟出锅。",
    ],
    videoUrl: "https://search.bilibili.com/all?keyword=家常豆腐",
    substitutes: [1, 167, 75]
  },
  {
    id: 120, name: "糖醋排骨", cuisine: "浙菜", category: "荤", lightness: "heavy", meals: ["中餐","晚餐"], nutrition: "高蛋白",
    ingredients: [
      { name: "猪排骨", amount: 400, unit: "克" },
      { name: "醋", amount: 2, unit: "勺" },
      { name: "糖", amount: 2, unit: "勺" },
      { name: "酱油", amount: 1, unit: "勺" },
      { name: "姜", amount: 3, unit: "片" },
      { name: "料酒", amount: 1, unit: "勺" }
    ],
    steps: [
      "排骨斩小块，冷水下锅焯水去血沫。",
      "热锅少许油，下排骨煎至两面微黄。",
      "加入糖炒至融化上色，加酱油、醋、姜片翻炒。",
      "倒入开水没过排骨，大火烧开转小火炖30分钟。",
      "大火收汁至汤汁浓稠包裹排骨即可。"
    ],
    videoUrl: "https://search.bilibili.com/all?keyword=糖醋排骨",
    substitutes: [150, 69, 92]
  },

  // ======================================== 闽菜 (16道, id 121-136) ========================================
  {
    id: 121, name: "佛跳墙", cuisine: "闽菜", category: "荤", lightness: "light", meals: ["中餐","晚餐"], nutrition: "高蛋白",
    ingredients: [
      { name: "鲍鱼", amount: 4, unit: "只" },
      { name: "海参", amount: 100, unit: "克" },
      { name: "鸡腿", amount: 1, unit: "个" },
      { name: "猪蹄", amount: 0.5, unit: "只" },
      { name: "香菇", amount: 5, unit: "朵" },
      { name: "料酒", amount: 2, unit: "勺" }
    ],
    steps: [
      "将所有食材分别处理好，焯水备用。",
      "在坛底铺一层姜片和葱段。",
      "按顺序码入鸡、猪蹄、鲍鱼、海参、香菇等。",
      "加入高汤和料酒，密封坛口。",
      "小火慢炖4小时以上，使各种鲜味充分融合。"
    ],
    videoUrl: "https://search.bilibili.com/all?keyword=佛跳墙",
    substitutes: [41, 48, 135]
  },
  {
    id: 122, name: "荔枝肉", cuisine: "闽菜", category: "荤", lightness: "heavy", meals: ["中餐","晚餐"], nutrition: "高蛋白",
    ingredients: [
      { name: "猪里脊", amount: 250, unit: "克" },
      { name: "荸荠", amount: 5, unit: "个" },
      { name: "番茄酱", amount: 2, unit: "勺" },
      { name: "醋", amount: 1, unit: "勺" },
      { name: "糖", amount: 2, unit: "勺" },
      { name: "淀粉", amount: 2, unit: "勺" }
    ],
    steps: [
      "猪里脊切块剞花刀，加盐料酒腌制。",
      "裹淀粉成荔枝状。",
      "油锅六成热，下肉块炸至金黄捞出。",
      "荸荠切块。",
      "另起锅，番茄酱、糖、醋熬成酸甜汁，倒入肉块和荸荠翻炒裹汁。",
    ],
    videoUrl: "https://search.bilibili.com/all?keyword=荔枝肉",
    substitutes: [34, 69, 120]
  },
  {
    id: 123, name: "海蛎煎", cuisine: "闽菜", category: "半荤", lightness: "regular", meals: ["中餐","晚餐"], nutrition: "高蛋白",
    ingredients: [
      { name: "海蛎", amount: 200, unit: "克" },
      { name: "鸡蛋", amount: 2, unit: "个" },
      { name: "红薯粉", amount: 50, unit: "克" },
      { name: "葱", amount: 2, unit: "根" },
      { name: "蒜", amount: 1, unit: "瓣" }
    ],
    steps: [
      "海蛎洗净沥干。",
      "红薯粉加水调成糊状，加入海蛎和葱花拌匀。",
      "鸡蛋打散。",
      "平底锅多油烧热，倒入海蛎糊摊平煎至底部金黄。",
      "淋入蛋液翻面继续煎至两面金黄出锅。",
    ],
    videoUrl: "https://search.bilibili.com/all?keyword=海蛎煎",
    substitutes: [36, 128, 147]
  },
  {
    id: 124, name: "沙茶面", cuisine: "闽菜", category: "半荤", lightness: "regular", meals: ["早餐","中餐"], nutrition: "高蛋白",
    ingredients: [
      { name: "面条", amount: 250, unit: "克" },
      { name: "猪肉", amount: 80, unit: "克" },
      { name: "虾仁", amount: 50, unit: "克" },
      { name: "沙茶酱", amount: 2, unit: "勺" },
      { name: "花生酱", amount: 1, unit: "勺" },
      { name: "豆芽", amount: 100, unit: "克" }
    ],
    steps: [
      "猪肉切片，虾仁洗净，豆芽焯水。",
      "沙茶酱和花生酱用温水调开。",
      "锅中加水烧开，放入调好的沙茶酱。",
      "下猪肉和虾仁煮熟。",
      "面条煮熟捞入沙茶汤中，放豆芽即可。",
    ],
    videoUrl: "https://search.bilibili.com/all?keyword=沙茶面",
    substitutes: [10, 32, 118]
  },
  {
    id: 125, name: "姜母鸭", cuisine: "闽菜", category: "荤", lightness: "regular", meals: ["中餐","晚餐"], nutrition: "高蛋白",
    ingredients: [
      { name: "鸭", amount: 0.5, unit: "只" },
      { name: "姜", amount: 200, unit: "克" },
      { name: "酱油", amount: 2, unit: "勺" },
      { name: "料酒", amount: 2, unit: "勺" },
      { name: "冰糖", amount: 20, unit: "克" }
    ],
    steps: [
      "鸭剁块焯水沥干。",
      "姜切大片。",
      "砂锅中加多油，下姜片煸炒出香。",
      "放入鸭块翻炒至变色。",
      "加酱油、料酒、冰糖和水，大火烧开转小火炖1小时收汁。",
    ],
    videoUrl: "https://search.bilibili.com/all?keyword=姜母鸭",
    substitutes: [57, 62, 23]
  },
  {
    id: 126, name: "闽南卤面", cuisine: "闽菜", category: "半荤", lightness: "regular", meals: ["早餐","中餐"], nutrition: "高蛋白",
    ingredients: [
      { name: "面条", amount: 250, unit: "克" },
      { name: "猪肉", amount: 80, unit: "克" },
      { name: "香菇", amount: 3, unit: "朵" },
      { name: "鸡蛋", amount: 1, unit: "个" },
      { name: "酱油", amount: 1, unit: "勺" },
      { name: "葱", amount: 1, unit: "根" }
    ],
    steps: [
      "猪肉切片，香菇泡发切丝，鸡蛋打散。",
      "锅中加油，下肉片翻炒，加香菇酱油炒香。",
      "加水烧开。",
      "放入面条煮至断生。",
      "淋入蛋液搅成蛋花，撒葱花出锅。",
    ],
    videoUrl: "https://search.bilibili.com/all?keyword=闽南卤面",
    substitutes: [124, 10, 118]
  },
  {
    id: 127, name: "清蒸石斑鱼", cuisine: "闽菜", category: "荤", lightness: "light", meals: ["早餐","中餐","晚餐"], nutrition: "减脂,高蛋白",
    ingredients: [
      { name: "石斑鱼", amount: 1, unit: "条" },
      { name: "姜", amount: 3, unit: "片" },
      { name: "葱", amount: 2, unit: "根" },
      { name: "蒸鱼豉油", amount: 2, unit: "勺" }
    ],
    steps: [
      "石斑鱼处理干净，两面划刀。",
      "盘底铺姜片和葱段，放上鱼。",
      "水开后上锅大火蒸8-10分钟。",
      "取出倒掉腥水，铺葱丝。",
      "淋蒸鱼豉油，浇热油激香即可。",
    ],
    videoUrl: "https://search.bilibili.com/all?keyword=清蒸石斑鱼",
    substitutes: [27, 49, 104]
  },
  {
    id: 128, name: "蚵仔煎", cuisine: "闽菜", category: "半荤", lightness: "regular", meals: ["中餐","晚餐"], nutrition: "高蛋白",
    ingredients: [
      { name: "牡蛎", amount: 200, unit: "克" },
      { name: "鸡蛋", amount: 2, unit: "个" },
      { name: "红薯粉", amount: 50, unit: "克" },
      { name: "葱", amount: 2, unit: "根" }
    ],
    steps: [
      "牡蛎洗净沥干。",
      "红薯粉加水调糊，加入牡蛎和葱花拌匀。",
      "鸡蛋打散。",
      "平底锅加油烧热，倒入牡蛎糊摊平。",
      "淋蛋液煎至两面金黄即可。",
    ],
    videoUrl: "https://search.bilibili.com/all?keyword=蚵仔煎",
    substitutes: [123, 36, 82]
  },
  {
    id: 129, name: "八宝红鲟饭", cuisine: "闽菜", category: "荤", lightness: "regular", meals: ["中餐","晚餐"], nutrition: "高蛋白",
    ingredients: [
      { name: "螃蟹", amount: 2, unit: "只" },
      { name: "糯米", amount: 200, unit: "克" },
      { name: "香菇", amount: 3, unit: "朵" },
      { name: "火腿", amount: 50, unit: "克" },
      { name: "姜", amount: 3, unit: "片" },
      { name: "酱油", amount: 1, unit: "勺" }
    ],
    steps: [
      "糯米浸泡2小时沥干。",
      "螃蟹处理干净斩块。",
      "香菇火腿切丁。",
      "蒸碗底铺螃蟹，放入糯米和各种配料。",
      "加酱油和水上锅大火蒸40分钟即可。",
    ],
    videoUrl: "https://search.bilibili.com/all?keyword=八宝红鲟饭",
    substitutes: [37, 42, 99]
  },
  {
    id: 130, name: "福州鱼丸", cuisine: "闽菜", category: "荤", lightness: "light", meals: ["中餐","晚餐"], nutrition: "高蛋白",
    ingredients: [
      { name: "鱼肉", amount: 300, unit: "克" },
      { name: "猪肉末", amount: 100, unit: "克" },
      { name: "葱", amount: 2, unit: "根" },
      { name: "姜", amount: 2, unit: "片" },
      { name: "盐", amount: 1, unit: "小撮" }
    ],
    steps: [
      "鱼肉去刺剁成泥，加盐蛋清搅打上劲。",
      "猪肉末加葱姜末酱油调成肉馅。",
      "取鱼泥包入肉馅搓成丸子。",
      "水烧至微开，下鱼丸煮至浮起。",
      "盛碗加葱花和少许盐调味即可。",
    ],
    videoUrl: "https://search.bilibili.com/all?keyword=福州鱼丸",
    substitutes: [87, 22, 107]
  },
  {
    id: 131, name: "闽东烧麦", cuisine: "闽菜", category: "荤", lightness: "regular", meals: ["中餐","晚餐"], nutrition: "高蛋白",
    ingredients: [
      { name: "糯米", amount: 200, unit: "克" },
      { name: "猪肉末", amount: 150, unit: "克" },
      { name: "香菇", amount: 3, unit: "朵" },
      { name: "酱油", amount: 1, unit: "勺" },
      { name: "姜", amount: 2, unit: "片" },
      { name: "葱", amount: 1, unit: "根" }
    ],
    steps: [
      "糯米蒸熟晾凉。",
      "猪肉末加酱油、姜末炒熟。",
      "将肉末和糯米饭拌匀做馅。",
      "用烧麦皮包入馅料捏成石榴形。",
      "上锅大火蒸10分钟即可。",
    ],
    videoUrl: "https://search.bilibili.com/all?keyword=闽东烧麦",
    substitutes: [22, 129, 131]
  },
  {
    id: 132, name: "白灼鱿鱼", cuisine: "闽菜", category: "荤", lightness: "light", meals: ["早餐","中餐","晚餐"], nutrition: "减脂,高蛋白",
    ingredients: [
      { name: "鱿鱼", amount: 300, unit: "克" },
      { name: "姜", amount: 3, unit: "片" },
      { name: "葱", amount: 1, unit: "根" },
      { name: "酱油", amount: 1, unit: "勺" },
      { name: "料酒", amount: 1, unit: "勺" }
    ],
    steps: [
      "鱿鱼处理干净切圈或花刀。",
      "姜切片，葱切段。",
      "锅中烧水加姜片料酒煮沸。",
      "放入鱿鱼烫30秒至卷曲变白捞出。",
      "姜切末加酱油调蘸料即可。",
    ],
    videoUrl: "https://search.bilibili.com/all?keyword=白灼鱿鱼",
    substitutes: [31, 35, 70]
  },
  {
    id: 133, name: "福州锅边糊", cuisine: "闽菜", category: "半荤", lightness: "light", meals: ["早餐","中餐"], nutrition: "高蛋白",
    ingredients: [
      { name: "米粉", amount: 150, unit: "克" },
      { name: "虾仁", amount: 50, unit: "克" },
      { name: "海蛎", amount: 50, unit: "克" },
      { name: "青菜", amount: 100, unit: "克" },
      { name: "姜", amount: 2, unit: "片" }
    ],
    steps: [
      "米粉加水调成米浆。",
      "虾仁海蛎洗净，青菜切段。",
      "锅中加水烧开，放入虾仁海蛎煮熟。",
      "沿锅边淋入米浆，待凝固后铲入汤中。",
      "加入青菜煮1分钟调味出锅。",
    ],
    videoUrl: "https://search.bilibili.com/all?keyword=福州锅边糊",
    substitutes: [126, 123, 133]
  },
  {
    id: 134, name: "酱油水煮鱼", cuisine: "闽菜", category: "荤", lightness: "light", meals: ["中餐","晚餐"], nutrition: "减脂,高蛋白",
    ingredients: [
      { name: "鱼", amount: 1, unit: "条" },
      { name: "酱油", amount: 2, unit: "勺" },
      { name: "姜", amount: 3, unit: "片" },
      { name: "葱", amount: 2, unit: "根" },
      { name: "萝卜干", amount: 30, unit: "克" }
    ],
    steps: [
      "鱼处理干净两面划刀。",
      "萝卜干切碎，姜切片，葱切段。",
      "锅中加水烧开，放入姜片、萝卜干、酱油。",
      "放入鱼大火煮8分钟至熟。",
      "撒葱段淋少许香油出锅。",
    ],
    videoUrl: "https://search.bilibili.com/all?keyword=酱油水煮鱼",
    substitutes: [27, 127, 134]
  },
  {
    id: 135, name: "四物番鸭汤", cuisine: "闽菜", category: "荤", lightness: "light", meals: ["中餐","晚餐"], nutrition: "高蛋白",
    ingredients: [
      { name: "鸭", amount: 0.5, unit: "只" },
      { name: "当归", amount: 5, unit: "克" },
      { name: "熟地", amount: 10, unit: "克" },
      { name: "红枣", amount: 5, unit: "颗" },
      { name: "枸杞", amount: 10, unit: "克" },
      { name: "姜", amount: 3, unit: "片" }
    ],
    steps: [
      "鸭剁块焯水去血沫。",
      "当归、熟地用纱布包好。",
      "砂锅中放入鸭块、红枣、枸杞、姜片和药包。",
      "加水没过大火烧开转小火炖1.5小时。",
      "取出药包加盐调味。",
    ],
    videoUrl: "https://search.bilibili.com/all?keyword=四物番鸭汤",
    substitutes: [41, 108, 48]
  },
  {
    id: 136, name: "南煎肝", cuisine: "闽菜", category: "荤", lightness: "regular", meals: ["中餐","晚餐"], nutrition: "高蛋白",
    ingredients: [
      { name: "猪肝", amount: 250, unit: "克" },
      { name: "洋葱", amount: 0.5, unit: "个" },
      { name: "酱油", amount: 1, unit: "勺" },
      { name: "糖", amount: 1, unit: "勺" },
      { name: "醋", amount: 1, unit: "小勺" },
      { name: "姜", amount: 3, unit: "片" }
    ],
    steps: [
      "猪肝切薄片，加酱油、料酒、淀粉腌制10分钟。",
      "洋葱切丝，姜切片。",
      "热锅加油，下猪肝滑炒至变色盛出。",
      "锅留底油，下洋葱姜片炒香。",
      "倒回猪肝加糖醋酱油快速翻炒收汁出锅。",
    ],
    videoUrl: "https://search.bilibili.com/all?keyword=南煎肝",
    substitutes: [9, 60, 5]
  },

  // ======================================== 徽菜 (16道, id 137-152) ========================================
  {
    id: 137, name: "臭鳜鱼", cuisine: "徽菜", category: "荤", lightness: "regular", meals: ["中餐","晚餐"], nutrition: "减脂,高蛋白",
    ingredients: [
      { name: "鳜鱼", amount: 1, unit: "条" },
      { name: "姜", amount: 5, unit: "片" },
      { name: "蒜", amount: 5, unit: "瓣" },
      { name: "干辣椒", amount: 5, unit: "个" },
      { name: "酱油", amount: 1, unit: "勺" },
      { name: "料酒", amount: 1, unit: "勺" }
    ],
    steps: [
      "鳜鱼处理干净两面划刀，抹盐和料酒腌制。",
      "姜蒜切片，干辣椒切段。",
      "热锅加油，下鳜鱼煎至两面金黄。",
      "加入姜蒜干辣椒、酱油、料酒和少许水。",
      "中火烧10分钟至鱼熟入味，收汁撒葱花出锅。",
    ],
    videoUrl: "https://search.bilibili.com/all?keyword=臭鳜鱼",
    substitutes: [27, 89, 104]
  },
  {
    id: 138, name: "李鸿章大杂烩", cuisine: "徽菜", category: "荤", lightness: "regular", meals: ["中餐","晚餐"], nutrition: "高蛋白",
    ingredients: [
      { name: "鸡腿", amount: 1, unit: "个" },
      { name: "海参", amount: 50, unit: "克" },
      { name: "火腿", amount: 80, unit: "克" },
      { name: "香菇", amount: 5, unit: "朵" },
      { name: "白菜", amount: 150, unit: "克" },
      { name: "姜", amount: 3, unit: "片" }
    ],
    steps: [
      "鸡腿剁块焯水，海参泡发切条，火腿切片。",
      "香菇泡发，白菜切块。",
      "砂锅中放入鸡块、姜片、料酒和水烧开。",
      "转小火炖30分钟。",
      "加入海参、火腿、香菇、白菜继续炖15分钟加盐调味。",
    ],
    videoUrl: "https://search.bilibili.com/all?keyword=李鸿章大杂烩",
    substitutes: [121, 138, 12]
  },
  {
    id: 139, name: "符离集烧鸡", cuisine: "徽菜", category: "荤", lightness: "regular", meals: ["中餐","晚餐"], nutrition: "高蛋白",
    ingredients: [
      { name: "鸡", amount: 1, unit: "只" },
      { name: "酱油", amount: 2, unit: "勺" },
      { name: "蜂蜜", amount: 1, unit: "勺" },
      { name: "花椒", amount: 1, unit: "小撮" },
      { name: "八角", amount: 2, unit: "个" },
      { name: "姜", amount: 5, unit: "片" }
    ],
    steps: [
      "鸡处理干净，用酱油涂抹上色。",
      "蜂蜜加水调匀刷在鸡皮上。",
      "油锅烧热，将鸡炸至金黄。",
      "砂锅中加酱油、花椒、八角、姜片和水。",
      "放入鸡小火炖1.5小时至酥烂脱骨。",
    ],
    videoUrl: "https://search.bilibili.com/all?keyword=符离集烧鸡",
    substitutes: [84, 26, 38]
  },
  {
    id: 140, name: "毛豆腐", cuisine: "徽菜", category: "素", lightness: "light", meals: ["早餐","中餐","晚餐"], nutrition: "",
    ingredients: [
      { name: "毛豆腐", amount: 300, unit: "克" },
      { name: "蒜", amount: 2, unit: "瓣" },
      { name: "辣椒油", amount: 1, unit: "勺" },
      { name: "酱油", amount: 1, unit: "勺" },
      { name: "葱", amount: 1, unit: "根" }
    ],
    steps: [
      "毛豆腐切厚片。",
      "蒜切末，葱切花。",
      "平底锅加油，下毛豆腐小火煎至两面金黄。",
      "撒蒜末和辣椒油。",
      "加酱油调味，撒葱花出锅。",
    ],
    videoUrl: "https://search.bilibili.com/all?keyword=毛豆腐",
    substitutes: [1, 75, 119]
  },
  {
    id: 141, name: "徽州一品锅", cuisine: "徽菜", category: "荤", lightness: "heavy", meals: ["中餐","晚餐"], nutrition: "高蛋白",
    ingredients: [
      { name: "猪五花肉", amount: 300, unit: "克" },
      { name: "鸡腿", amount: 1, unit: "个" },
      { name: "火腿", amount: 100, unit: "克" },
      { name: "油豆腐", amount: 100, unit: "克" },
      { name: "白萝卜", amount: 200, unit: "克" },
      { name: "姜", amount: 3, unit: "片" }
    ],
    steps: [
      "五花肉切块焯水，鸡腿剁块。",
      "火腿切片，白萝卜切块，油豆腐切半。",
      "砂锅底铺白萝卜，依次码入五花肉、鸡腿、火腿、油豆腐。",
      "加姜片、料酒和水大火烧开。",
      "转小火炖1小时至肉酥烂加盐调味。",
    ],
    videoUrl: "https://search.bilibili.com/all?keyword=徽州一品锅",
    substitutes: [138, 121, 148]
  },
  {
    id: 142, name: "黄山炖鸽", cuisine: "徽菜", category: "荤", lightness: "light", meals: ["中餐","晚餐"], nutrition: "减脂,高蛋白",
    ingredients: [
      { name: "鸽子", amount: 1, unit: "只" },
      { name: "山药", amount: 200, unit: "克" },
      { name: "红枣", amount: 5, unit: "颗" },
      { name: "枸杞", amount: 10, unit: "克" },
      { name: "姜", amount: 3, unit: "片" },
      { name: "料酒", amount: 1, unit: "勺" }
    ],
    steps: [
      "鸽子处理干净剁块焯水。",
      "山药去皮切段。",
      "砂锅中放入鸽块、姜片、料酒、红枣。",
      "加水大火烧开转小火炖1小时。",
      "加入山药和枸杞继续炖20分钟加盐调味。",
    ],
    videoUrl: "https://search.bilibili.com/all?keyword=黄山炖鸽",
    substitutes: [41, 135, 108]
  },
  {
    id: 143, name: "问政山笋", cuisine: "徽菜", category: "素", lightness: "light", meals: ["早餐","中餐","晚餐"], nutrition: "减脂",
    ingredients: [
      { name: "春笋", amount: 400, unit: "克" },
      { name: "火腿", amount: 50, unit: "克" },
      { name: "姜", amount: 2, unit: "片" },
      { name: "盐", amount: 1, unit: "小撮" }
    ],
    steps: [
      "春笋去壳切滚刀块。",
      "火腿切丝。",
      "锅中加水烧开，放入笋块焯水3分钟捞出。",
      "热锅加油，下姜片和火腿丝炒香。",
      "放入笋块翻炒加盐调味出锅。",
    ],
    videoUrl: "https://search.bilibili.com/all?keyword=问政山笋",
    substitutes: [117, 156, 143]
  },
  {
    id: 144, name: "中和汤", cuisine: "徽菜", category: "半荤", lightness: "light", meals: ["中餐","晚餐"], nutrition: "",
    ingredients: [
      { name: "豆腐", amount: 1, unit: "块" },
      { name: "火腿", amount: 30, unit: "克" },
      { name: "虾仁", amount: 30, unit: "克" },
      { name: "香菇", amount: 3, unit: "朵" },
      { name: "盐", amount: 1, unit: "小撮" }
    ],
    steps: [
      "豆腐切丁焯水。",
      "火腿切丁，虾仁洗净，香菇切丁。",
      "锅中加高汤烧开。",
      "放入所有配料煮3分钟。",
      "加盐调味勾薄芡出锅。",
    ],
    videoUrl: "https://search.bilibili.com/all?keyword=中和汤",
    substitutes: [168, 75, 95]
  },
  {
    id: 145, name: "火腿炖甲鱼", cuisine: "徽菜", category: "荤", lightness: "light", meals: ["中餐","晚餐"], nutrition: "高蛋白",
    ingredients: [
      { name: "甲鱼", amount: 1, unit: "只" },
      { name: "火腿", amount: 100, unit: "克" },
      { name: "姜", amount: 5, unit: "片" },
      { name: "料酒", amount: 1, unit: "勺" },
      { name: "葱", amount: 1, unit: "根" }
    ],
    steps: [
      "甲鱼处理干净剁块焯水。",
      "火腿切片，姜切片，葱切段。",
      "砂锅中放入甲鱼块、火腿、姜片、葱段。",
      "加料酒和水大火烧开。",
      "转小火炖1小时至甲鱼酥烂加盐调味。",
    ],
    videoUrl: "https://search.bilibili.com/all?keyword=火腿炖甲鱼",
    substitutes: [41, 121, 135]
  },
  {
    id: 146, name: "徽式烧鱼", cuisine: "徽菜", category: "荤", lightness: "regular", meals: ["中餐","晚餐"], nutrition: "高蛋白",
    ingredients: [
      { name: "草鱼", amount: 1, unit: "条" },
      { name: "豆瓣酱", amount: 1, unit: "勺" },
      { name: "酱油", amount: 1, unit: "勺" },
      { name: "姜", amount: 3, unit: "片" },
      { name: "葱", amount: 1, unit: "根" },
      { name: "蒜", amount: 2, unit: "瓣" }
    ],
    steps: [
      "草鱼处理干净两面划刀。",
      "热锅加油，下鱼煎至两面金黄。",
      "加入豆瓣酱、姜蒜炒香。",
      "加酱油、料酒和水，大火烧开。",
      "中火烧10分钟收汁撒葱花出锅。",
    ],
    videoUrl: "https://search.bilibili.com/all?keyword=徽式烧鱼",
    substitutes: [104, 27, 77]
  },
  {
    id: 147, name: "肉末蒸蛋", cuisine: "徽菜", category: "半荤", lightness: "light", meals: ["早餐","中餐","晚餐"], nutrition: "高蛋白",
    ingredients: [
      { name: "鸡蛋", amount: 3, unit: "个" },
      { name: "猪肉末", amount: 80, unit: "克" },
      { name: "葱", amount: 1, unit: "根" },
      { name: "酱油", amount: 1, unit: "小勺" },
      { name: "姜", amount: 2, unit: "片" }
    ],
    steps: [
      "鸡蛋打散加温水（鸡蛋：水 = 1:1.5），加少许盐搅匀。",
      "蛋液过筛滤去泡沫，覆保鲜膜扎孔。",
      "水开后上锅中小火蒸8分钟至表面凝固。",
      "热锅少油炒散猪肉末，加酱油姜末调味。",
      "将炒好的肉末铺在蒸蛋上，撒葱花再蒸2分钟即可。"
    ],
    videoUrl: "https://search.bilibili.com/all?keyword=肉末蒸蛋",
    substitutes: [36, 58, 73]
  },
  {
    id: 148, name: "徽州蒸肉", cuisine: "徽菜", category: "荤", lightness: "heavy", meals: ["中餐","晚餐"], nutrition: "高蛋白",
    ingredients: [
      { name: "猪五花肉", amount: 400, unit: "克" },
      { name: "米粉", amount: 100, unit: "克" },
      { name: "酱油", amount: 1, unit: "勺" },
      { name: "姜", amount: 3, unit: "片" },
      { name: "料酒", amount: 1, unit: "勺" },
      { name: "葱", amount: 1, unit: "根" }
    ],
    steps: [
      "五花肉切片，加酱油、料酒、姜末腌制20分钟。",
      "肉片裹上米粉。",
      "码入蒸碗中。",
      "水开后上锅大火蒸40分钟至肉酥烂。",
      "取出撒葱花即可。",
    ],
    videoUrl: "https://search.bilibili.com/all?keyword=徽州蒸肉",
    substitutes: [16, 103, 111]
  },
  {
    id: 149, name: "土豆烧牛肉", cuisine: "徽菜", category: "荤", lightness: "regular", meals: ["中餐","晚餐"], nutrition: "高蛋白",
    ingredients: [
      { name: "牛肉", amount: 300, unit: "克" },
      { name: "土豆", amount: 2, unit: "个" },
      { name: "洋葱", amount: 0.5, unit: "个" },
      { name: "酱油", amount: 2, unit: "勺" },
      { name: "八角", amount: 1, unit: "个" },
      { name: "姜", amount: 3, unit: "片" }
    ],
    steps: [
      "牛肉切块焯水去血沫。",
      "土豆去皮切块，洋葱切块。",
      "热锅加油，下牛肉煸炒至表面变色。",
      "加酱油、姜片、八角和水没过，大火烧开转小火炖40分钟。",
      "加入土豆和洋葱继续炖20分钟，大火收汁。",
    ],
    videoUrl: "https://search.bilibili.com/all?keyword=土豆烧牛肉",
    substitutes: [52, 64, 175]
  },
  {
    id: 150, name: "蒜蓉粉丝蒸虾", cuisine: "徽菜", category: "荤", lightness: "light", meals: ["中餐","晚餐"], nutrition: "减脂,高蛋白",
    ingredients: [
      { name: "虾", amount: 300, unit: "克" },
      { name: "粉丝", amount: 50, unit: "克" },
      { name: "蒜", amount: 5, unit: "瓣" },
      { name: "葱", amount: 1, unit: "根" },
      { name: "酱油", amount: 1, unit: "勺" }
    ],
    steps: [
      "粉丝温水泡软铺在盘底。",
      "虾去虾线开背摆放在粉丝上。",
      "蒜切末，热油浇在蒜末上激香。",
      "将蒜蓉铺在虾上淋酱油。",
      "水开后上锅大火蒸8分钟，取出撒葱花。",
    ],
    videoUrl: "https://search.bilibili.com/all?keyword=蒜蓉粉丝蒸虾",
    substitutes: [31, 71, 33]
  },
  {
    id: 151, name: "炒青椒素", cuisine: "徽菜", category: "素", lightness: "light", meals: ["早餐","中餐","晚餐"], nutrition: "减脂",
    ingredients: [
      { name: "青椒", amount: 3, unit: "个" },
      { name: "蒜", amount: 2, unit: "瓣" },
      { name: "酱油", amount: 1, unit: "小勺" },
      { name: "盐", amount: 1, unit: "小撮" }
    ],
    steps: [
      "青椒去蒂去籽切块。",
      "蒜切片。",
      "热锅加油，下蒜片爆香。",
      "放入青椒大火翻炒至表皮微皱。",
      "加盐和少许酱油翻炒均匀出锅。",
    ],
    videoUrl: "https://search.bilibili.com/all?keyword=炒青椒素",
    substitutes: [6, 161, 13]
  },
  {
    id: 152, name: "红烧鱼块", cuisine: "徽菜", category: "荤", lightness: "regular", meals: ["中餐","晚餐"], nutrition: "高蛋白",
    ingredients: [
      { name: "草鱼", amount: 1, unit: "条" },
      { name: "酱油", amount: 2, unit: "勺" },
      { name: "糖", amount: 1, unit: "勺" },
      { name: "姜", amount: 3, unit: "片" },
      { name: "葱", amount: 1, unit: "根" },
      { name: "蒜", amount: 2, unit: "瓣" }
    ],
    steps: [
      "草鱼斩块，加盐料酒腌制。",
      "热锅加油，下鱼块煎至两面金黄盛出。",
      "锅留底油，下姜蒜爆香。",
      "加酱油、糖和水烧开。",
      "放回鱼块中火烧10分钟收汁撒葱花出锅。",
    ],
    videoUrl: "https://search.bilibili.com/all?keyword=红烧鱼块",
    substitutes: [146, 104, 152]
  },

  // ======================================== 家常 (20道, id 153-172) ========================================
  {
    id: 153, name: "西红柿炒鸡蛋", cuisine: "家常", category: "半荤", lightness: "light", meals: ["早餐","中餐","晚餐"], nutrition: "减脂,高蛋白",
    ingredients: [
      { name: "西红柿", amount: 2, unit: "个" },
      { name: "鸡蛋", amount: 3, unit: "个" },
      { name: "葱", amount: 1, unit: "根" },
      { name: "盐", amount: 1, unit: "小撮" },
      { name: "糖", amount: 1, unit: "小撮" }
    ],
    steps: [
      "鸡蛋打散加少许盐搅匀，西红柿切块。",
      "热锅多油，倒入蛋液炒散凝固盛出。",
      "锅中留底油下西红柿中火炒至出汁。",
      "倒回鸡蛋翻炒均匀，加盐和少许糖调味。",
      "撒葱花出锅装盘，汤汁拌饭绝佳。"
    ],
    videoUrl: "https://search.bilibili.com/all?keyword=西红柿炒鸡蛋",
    substitutes: [43, 147, 36]
  },
  {
    id: 154, name: "醋溜白菜", cuisine: "家常", category: "素", lightness: "light", meals: ["早餐","中餐","晚餐"], nutrition: "减脂",
    ingredients: [
      { name: "白菜", amount: 300, unit: "克" },
      { name: "醋", amount: 1, unit: "勺" },
      { name: "干辣椒", amount: 2, unit: "个" },
      { name: "蒜", amount: 2, unit: "瓣" },
      { name: "盐", amount: 1, unit: "小撮" }
    ],
    steps: [
      "白菜切片，干辣椒切段，蒜切片。",
      "热锅加油，下干辣椒和蒜片爆香。",
      "放入白菜大火翻炒至变软。",
      "沿锅边淋入醋。",
      "加盐调味翻炒均匀出锅。",
    ],
    videoUrl: "https://search.bilibili.com/all?keyword=醋溜白菜",
    substitutes: [30, 151, 161]
  },
  {
    id: 155, name: "蛋炒饭", cuisine: "家常", category: "半荤", lightness: "regular", meals: ["早餐","中餐"], nutrition: "高蛋白",
    ingredients: [
      { name: "米饭", amount: 2, unit: "碗" },
      { name: "鸡蛋", amount: 2, unit: "个" },
      { name: "葱", amount: 1, unit: "根" },
      { name: "火腿", amount: 50, unit: "克" },
      { name: "盐", amount: 1, unit: "小撮" }
    ],
    steps: [
      "鸡蛋打散，火腿切丁，葱切葱花。",
      "热锅多油，下蛋液快速划散盛出。",
      "锅中加油，下米饭大火翻炒至米粒分明。",
      "倒入鸡蛋和火腿丁翻炒均匀。",
      "加盐调味，撒葱花即可出锅。"
    ],
    videoUrl: "https://search.bilibili.com/all?keyword=蛋炒饭",
    substitutes: [159, 67, 100]
  },
  {
    id: 156, name: "拍黄瓜", cuisine: "家常", category: "素", lightness: "light", meals: ["早餐","中餐","晚餐"], nutrition: "减脂",
    ingredients: [
      { name: "黄瓜", amount: 2, unit: "根" },
      { name: "蒜", amount: 3, unit: "瓣" },
      { name: "醋", amount: 1, unit: "勺" },
      { name: "酱油", amount: 1, unit: "小勺" },
      { name: "香油", amount: 1, unit: "小勺" }
    ],
    steps: [
      "黄瓜洗净用刀拍裂切段。",
      "蒜切末。",
      "将黄瓜放入碗中。",
      "加蒜末、醋、酱油、香油。",
      "拌匀腌5分钟即可。",
    ],
    videoUrl: "https://search.bilibili.com/all?keyword=拍黄瓜",
    substitutes: [24, 14, 59]
  },
  {
    id: 157, name: "红烧茄子", cuisine: "家常", category: "素", lightness: "regular", meals: ["中餐","晚餐"], nutrition: "",
    ingredients: [
      { name: "茄子", amount: 2, unit: "根" },
      { name: "蒜", amount: 3, unit: "瓣" },
      { name: "酱油", amount: 1, unit: "勺" },
      { name: "糖", amount: 1, unit: "小撮" },
      { name: "葱", amount: 1, unit: "根" }
    ],
    steps: [
      "茄子切滚刀块撒盐腌制挤去水分。",
      "蒜切末。",
      "锅中多油，下茄子炸软捞出沥油。",
      "锅留底油，下蒜末爆香。",
      "放入茄子加酱油、糖翻炒，加少许水焖1分钟出锅。",
    ],
    videoUrl: "https://search.bilibili.com/all?keyword=红烧茄子",
    substitutes: [162, 44, 152]
  },
  {
    id: 158, name: "紫菜蛋花汤", cuisine: "家常", category: "半荤", lightness: "light", meals: ["中餐","晚餐"], nutrition: "",
    ingredients: [
      { name: "鸡蛋", amount: 2, unit: "个" },
      { name: "紫菜", amount: 5, unit: "克" },
      { name: "葱", amount: 1, unit: "根" },
      { name: "姜", amount: 2, unit: "片" },
      { name: "盐", amount: 1, unit: "小撮" }
    ],
    steps: [
      "紫菜撕碎，鸡蛋打散。",
      "锅中加水烧开，放入姜片。",
      "放入紫菜煮1分钟。",
      "淋入蛋液搅成蛋花。",
      "加盐调味撒葱花出锅。",
    ],
    videoUrl: "https://search.bilibili.com/all?keyword=紫菜蛋花汤",
    substitutes: [168, 85, 116]
  },
  {
    id: 159, name: "红烧肉", cuisine: "家常", category: "荤", lightness: "heavy", meals: ["中餐","晚餐"], nutrition: "高蛋白",
    ingredients: [
      { name: "猪五花肉", amount: 500, unit: "克" },
      { name: "冰糖", amount: 30, unit: "克" },
      { name: "酱油", amount: 2, unit: "勺" },
      { name: "姜", amount: 3, unit: "片" },
      { name: "八角", amount: 2, unit: "个" },
      { name: "料酒", amount: 1, unit: "勺" }
    ],
    steps: [
      "五花肉切方块，冷水下锅焯烫去血沫。",
      "锅中少油下冰糖小火炒至融化变焦糖色。",
      "放入肉块翻炒上色，加姜片八角炒香。",
      "倒入酱油料酒，加开水没过肉面，大火烧开。",
      "转小火加盖炖40分钟，大火收汁至浓稠即可。"
    ],
    videoUrl: "https://search.bilibili.com/all?keyword=红烧肉",
    substitutes: [148, 103, 53]
  },
  {
    id: 160, name: "手撕包菜", cuisine: "家常", category: "素", lightness: "regular", meals: ["中餐","晚餐"], nutrition: "",
    ingredients: [
      { name: "包菜", amount: 0.5, unit: "颗" },
      { name: "干辣椒", amount: 3, unit: "个" },
      { name: "蒜", amount: 3, unit: "瓣" },
      { name: "酱油", amount: 1, unit: "勺" },
      { name: "醋", amount: 1, unit: "小勺" }
    ],
    steps: [
      "包菜手撕成片，干辣椒切段，蒜切片。",
      "热锅加油，下干辣椒和蒜片爆香。",
      "放入包菜大火翻炒。",
      "沿锅边淋入醋和酱油。",
      "炒至包菜断生但仍脆爽加盐出锅。",
    ],
    videoUrl: "https://search.bilibili.com/all?keyword=手撕包菜",
    substitutes: [154, 161, 18]
  },
  {
    id: 161, name: "蒜蓉西兰花", cuisine: "家常", category: "素", lightness: "light", meals: ["早餐","中餐","晚餐"], nutrition: "减脂",
    ingredients: [
      { name: "西兰花", amount: 1, unit: "颗" },
      { name: "蒜", amount: 3, unit: "瓣" },
      { name: "盐", amount: 1, unit: "小撮" }
    ],
    steps: [
      "西兰花掰小朵洗净。",
      "蒜切末。",
      "烧一锅水加少许油盐，西兰花焯烫1分钟。",
      "捞出沥干摆盘。",
      "热锅加油炒香蒜末，浇在西兰花上即可。",
    ],
    videoUrl: "https://search.bilibili.com/all?keyword=蒜蓉西兰花",
    substitutes: [28, 40, 30]
  },
  {
    id: 162, name: "鱼香茄子", cuisine: "家常", category: "半荤", lightness: "regular", meals: ["中餐","晚餐"], nutrition: "",
    ingredients: [
      { name: "茄子", amount: 2, unit: "根" },
      { name: "猪肉末", amount: 80, unit: "克" },
      { name: "豆瓣酱", amount: 1, unit: "勺" },
      { name: "蒜", amount: 2, unit: "瓣" },
      { name: "姜", amount: 2, unit: "片" },
      { name: "葱", amount: 1, unit: "根" }
    ],
    steps: [
      "茄子切条，猪肉末加料酒腌制。",
      "蒜姜切末，葱切花。",
      "锅中多油，下茄子炸软捞出沥油。",
      "锅留底油，下肉末炒散加豆瓣酱姜蒜炒香。",
      "放入茄子加鱼香汁翻炒均匀撒葱花出锅。",
    ],
    videoUrl: "https://search.bilibili.com/all?keyword=鱼香茄子",
    substitutes: [157, 1, 44]
  },
  {
    id: 163, name: "煎蛋", cuisine: "家常", category: "半荤", lightness: "light", meals: ["早餐","中餐"], nutrition: "高蛋白",
    ingredients: [
      { name: "鸡蛋", amount: 4, unit: "个" },
      { name: "葱", amount: 1, unit: "根" },
      { name: "盐", amount: 1, unit: "小撮" }
    ],
    steps: [
      "鸡蛋打入碗中加盐搅匀。",
      "葱花加入蛋液中拌匀。",
      "平底锅加油烧热。",
      "倒入蛋液摊平，中小火煎至底部金黄。",
      "翻面继续煎至两面金黄出锅。",
    ],
    videoUrl: "https://search.bilibili.com/all?keyword=煎蛋",
    substitutes: [155, 153, 147]
  },
  {
    id: 164, name: "冬瓜排骨汤", cuisine: "家常", category: "荤", lightness: "light", meals: ["中餐","晚餐"], nutrition: "高蛋白",
    ingredients: [
      { name: "猪排骨", amount: 300, unit: "克" },
      { name: "冬瓜", amount: 400, unit: "克" },
      { name: "姜", amount: 3, unit: "片" },
      { name: "葱", amount: 1, unit: "根" },
      { name: "盐", amount: 1, unit: "小撮" }
    ],
    steps: [
      "排骨斩块焯水去血沫。",
      "冬瓜去皮去瓤切块。",
      "砂锅中放入排骨、姜片和水大火烧开。",
      "转小火炖40分钟。",
      "加入冬瓜继续炖15分钟加盐调味撒葱花。",
    ],
    videoUrl: "https://search.bilibili.com/all?keyword=冬瓜排骨汤",
    substitutes: [48, 115, 164]
  },
  {
    id: 165, name: "尖椒土豆丝", cuisine: "家常", category: "素", lightness: "light", meals: ["早餐","中餐","晚餐"], nutrition: "",
    ingredients: [
      { name: "土豆", amount: 2, unit: "个" },
      { name: "青椒", amount: 1, unit: "个" },
      { name: "蒜", amount: 2, unit: "瓣" },
      { name: "醋", amount: 1, unit: "小勺" },
      { name: "盐", amount: 1, unit: "小撮" }
    ],
    steps: [
      "土豆去皮切细丝泡水去淀粉。",
      "青椒切丝，蒜切片。",
      "锅中热油，下蒜片爆香。",
      "倒入土豆丝大火快炒。",
      "加入青椒丝和少许醋，加盐翻炒均匀出锅。",
    ],
    videoUrl: "https://search.bilibili.com/all?keyword=尖椒土豆丝",
    substitutes: [6, 149, 151]
  },
  {
    id: 166, name: "小炒肉", cuisine: "家常", category: "荤", lightness: "regular", meals: ["中餐","晚餐"], nutrition: "高蛋白",
    ingredients: [
      { name: "猪肉", amount: 250, unit: "克" },
      { name: "青椒", amount: 2, unit: "个" },
      { name: "蒜", amount: 3, unit: "瓣" },
      { name: "酱油", amount: 1, unit: "勺" },
      { name: "豆豉", amount: 1, unit: "小勺" }
    ],
    steps: [
      "猪肉切薄片加酱油腌制。",
      "青椒切圈，蒜切片。",
      "热锅加油，下肉片煸炒出油变色。",
      "加入蒜片和豆豉炒香。",
      "放入青椒大火翻炒至断生加酱油调味出锅。",
    ],
    videoUrl: "https://search.bilibili.com/all?keyword=小炒肉",
    substitutes: [50, 52, 58]
  },
  {
    id: 167, name: "麻辣豆腐", cuisine: "家常", category: "半荤", lightness: "regular", meals: ["中餐","晚餐"], nutrition: "高蛋白",
    ingredients: [
      { name: "豆腐", amount: 1, unit: "块" },
      { name: "猪肉末", amount: 80, unit: "克" },
      { name: "豆瓣酱", amount: 1, unit: "勺" },
      { name: "花椒", amount: 1, unit: "小撮" },
      { name: "蒜", amount: 2, unit: "瓣" },
      { name: "葱", amount: 1, unit: "根" }
    ],
    steps: [
      "豆腐切块焯水捞出。",
      "猪肉末加料酒腌制。",
      "热锅加油，下肉末炒散，加豆瓣酱炒出红油。",
      "加蒜末花椒炒香，加水烧开。",
      "放入豆腐小火煮3分钟入味，勾芡撒葱花出锅。",
    ],
    videoUrl: "https://search.bilibili.com/all?keyword=麻辣豆腐",
    substitutes: [1, 75, 119]
  },
  {
    id: 168, name: "番茄蛋汤", cuisine: "家常", category: "半荤", lightness: "light", meals: ["中餐","晚餐"], nutrition: "",
    ingredients: [
      { name: "西红柿", amount: 1, unit: "个" },
      { name: "鸡蛋", amount: 2, unit: "个" },
      { name: "葱", amount: 1, unit: "根" },
      { name: "盐", amount: 1, unit: "小撮" }
    ],
    steps: [
      "西红柿切块，鸡蛋打散。",
      "锅中加油，下西红柿炒出汁。",
      "加水烧开。",
      "淋入蛋液搅成蛋花。",
      "加盐调味撒葱花出锅。",
    ],
    videoUrl: "https://search.bilibili.com/all?keyword=番茄蛋汤",
    substitutes: [153, 158, 168]
  },
  {
    id: 169, name: "回锅肉炒蒜苗", cuisine: "家常", category: "荤", lightness: "regular", meals: ["中餐","晚餐"], nutrition: "高蛋白",
    ingredients: [
      { name: "猪五花肉", amount: 250, unit: "克" },
      { name: "蒜苗", amount: 150, unit: "克" },
      { name: "豆瓣酱", amount: 1, unit: "勺" },
      { name: "姜", amount: 3, unit: "片" },
      { name: "蒜", amount: 2, unit: "瓣" }
    ],
    steps: [
      "猪五花肉整块冷水煮至筷子可穿透。",
      "捞出晾凉切薄片，蒜苗切段。",
      "热锅少油，下肉片煸炒出油卷曲。",
      "加豆瓣酱姜蒜炒香。",
      "放入蒜苗翻炒至断生加少许糖调味出锅。",
    ],
    videoUrl: "https://search.bilibili.com/all?keyword=回锅肉炒蒜苗",
    substitutes: [4, 19, 166]
  },
  {
    id: 170, name: "香菇青菜", cuisine: "家常", category: "素", lightness: "light", meals: ["早餐","中餐","晚餐"], nutrition: "减脂",
    ingredients: [
      { name: "青菜", amount: 300, unit: "克" },
      { name: "香菇", amount: 5, unit: "朵" },
      { name: "蒜", amount: 2, unit: "瓣" },
      { name: "盐", amount: 1, unit: "小撮" }
    ],
    steps: [
      "青菜洗净，香菇泡发切片。",
      "蒜切片。",
      "烧水加少许油盐，青菜焯烫30秒捞出摆盘。",
      "热锅加油，下蒜片和香菇炒香。",
      "加盐蚝油调味，浇在青菜上即可。",
    ],
    videoUrl: "https://search.bilibili.com/all?keyword=香菇青菜",
    substitutes: [28, 161, 40]
  },
  {
    id: 171, name: "宫保虾球", cuisine: "家常", category: "荤", lightness: "regular", meals: ["中餐","晚餐"], nutrition: "高蛋白",
    ingredients: [
      { name: "虾仁", amount: 250, unit: "克" },
      { name: "花生米", amount: 30, unit: "克" },
      { name: "干辣椒", amount: 3, unit: "个" },
      { name: "黄瓜", amount: 1, unit: "根" },
      { name: "蒜", amount: 2, unit: "瓣" },
      { name: "酱油", amount: 1, unit: "勺" }
    ],
    steps: [
      "虾仁开背加盐料酒淀粉腌制。",
      "调碗汁：酱油、醋、糖、淀粉、水搅匀。",
      "油锅烧热，下虾仁滑炒变色盛出。",
      "锅留底油，下干辣椒花椒蒜片爆香。",
      "倒入虾仁和花生米，淋碗汁快速翻炒出锅。",
    ],
    videoUrl: "https://search.bilibili.com/all?keyword=宫保虾球",
    substitutes: [2, 36, 71]
  },
  {
    id: 172, name: "韭菜炒蛋", cuisine: "家常", category: "半荤", lightness: "light", meals: ["早餐","中餐"], nutrition: "高蛋白",
    ingredients: [
      { name: "韭菜", amount: 200, unit: "克" },
      { name: "鸡蛋", amount: 3, unit: "个" },
      { name: "盐", amount: 1, unit: "小撮" }
    ],
    steps: [
      "韭菜洗净切段。",
      "鸡蛋打散加盐搅匀。",
      "热锅加油，下蛋液炒散凝固盛出。",
      "锅中加油，下韭菜大火翻炒30秒。",
      "倒回鸡蛋翻炒均匀出锅。",
    ],
    videoUrl: "https://search.bilibili.com/all?keyword=韭菜炒蛋",
    substitutes: [153, 155, 43]
  },

  // ======================================== 东北 (16道, id 173-188) ========================================
  {
    id: 173, name: "锅包肉", cuisine: "东北", category: "荤", lightness: "heavy", meals: ["中餐","晚餐"], nutrition: "高蛋白",
    ingredients: [
      { name: "猪里脊", amount: 300, unit: "克" },
      { name: "胡萝卜", amount: 1, unit: "根" },
      { name: "姜", amount: 3, unit: "片" },
      { name: "葱", amount: 1, unit: "根" },
      { name: "醋", amount: 2, unit: "勺" },
      { name: "糖", amount: 2, unit: "勺" },
      { name: "淀粉", amount: 3, unit: "勺" }
    ],
    steps: [
      "猪里脊切成厚片，加盐、料酒腌制备用。",
      "淀粉加水调成糊状，肉片裹糊。",
      "油温六成热，逐片下入肉片炸至金黄定型。",
      "糖、醋、少许水调成糖醋汁。",
      "锅中留底油，爆香姜丝，倒入糖醋汁，下炸好的肉片翻炒均匀出锅。"
    ],
    videoUrl: "https://search.bilibili.com/all?keyword=锅包肉",
    substitutes: [69, 34, 120]
  },
  {
    id: 174, name: "地三鲜", cuisine: "东北", category: "素", lightness: "regular", meals: ["中餐","晚餐"], nutrition: "",
    ingredients: [
      { name: "土豆", amount: 2, unit: "个" },
      { name: "茄子", amount: 1, unit: "根" },
      { name: "青椒", amount: 2, unit: "个" },
      { name: "蒜", amount: 3, unit: "瓣" },
      { name: "酱油", amount: 1, unit: "勺" }
    ],
    steps: [
      "土豆、茄子、青椒分别切滚刀块。",
      "锅中多油，分别将土豆和茄子炸至表面金黄。",
      "蒜切片，小火炒香。",
      "倒入炸好的土豆茄子青椒快速翻炒。",
      "加酱油、糖、少许水焖煮1分钟，勾芡出锅。"
    ],
    videoUrl: "https://search.bilibili.com/all?keyword=地三鲜",
    substitutes: [157, 162, 174]
  },
  {
    id: 175, name: "猪肉炖粉条", cuisine: "东北", category: "荤", lightness: "heavy", meals: ["中餐","晚餐"], nutrition: "高蛋白",
    ingredients: [
      { name: "猪五花肉", amount: 300, unit: "克" },
      { name: "粉条", amount: 100, unit: "克" },
      { name: "白菜", amount: 200, unit: "克" },
      { name: "姜", amount: 3, unit: "片" },
      { name: "葱", amount: 1, unit: "根" },
      { name: "酱油", amount: 1, unit: "勺" }
    ],
    steps: [
      "五花肉切块焯水。",
      "粉条泡软，白菜切块。",
      "热锅加油，下肉块煸炒出油。",
      "加酱油姜片葱段和水大火烧开转小火炖30分钟。",
      "放入粉条和白菜继续炖15分钟加盐调味。",
    ],
    videoUrl: "https://search.bilibili.com/all?keyword=猪肉炖粉条",
    substitutes: [159, 175, 141]
  },
  {
    id: 176, name: "小鸡炖蘑菇", cuisine: "东北", category: "荤", lightness: "light", meals: ["中餐","晚餐"], nutrition: "高蛋白",
    ingredients: [
      { name: "鸡", amount: 0.5, unit: "只" },
      { name: "榛蘑", amount: 100, unit: "克" },
      { name: "粉条", amount: 50, unit: "克" },
      { name: "姜", amount: 5, unit: "片" },
      { name: "葱", amount: 1, unit: "根" },
      { name: "料酒", amount: 1, unit: "勺" }
    ],
    steps: [
      "榛蘑提前温水泡发，鸡剁块焯水去血沫。",
      "热锅少油，下鸡块煸炒至表皮微黄。",
      "加入姜片、葱段、料酒翻炒出香。",
      "倒入开水没过鸡块，放入榛蘑，大火烧开转小火炖30分钟。",
      "放入粉条继续炖10分钟，加盐调味即可。"
    ],
    videoUrl: "https://search.bilibili.com/all?keyword=小鸡炖蘑菇",
    substitutes: [41, 41, 26]
  },
  {
    id: 177, name: "溜肉段", cuisine: "东北", category: "荤", lightness: "heavy", meals: ["中餐","晚餐"], nutrition: "高蛋白",
    ingredients: [
      { name: "猪里脊", amount: 250, unit: "克" },
      { name: "青椒", amount: 2, unit: "个" },
      { name: "胡萝卜", amount: 1, unit: "根" },
      { name: "蒜", amount: 2, unit: "瓣" },
      { name: "酱油", amount: 1, unit: "勺" },
      { name: "淀粉", amount: 2, unit: "勺" }
    ],
    steps: [
      "猪里脊切段加盐料酒腌制，裹淀粉。",
      "青椒胡萝卜切片。",
      "油锅六成热，下肉段炸至金黄捞出。",
      "调碗汁：酱油、糖、淀粉、水搅匀。",
      "锅留底油爆香蒜片，倒入肉段和配菜，淋碗汁翻炒出锅。",
    ],
    videoUrl: "https://search.bilibili.com/all?keyword=溜肉段",
    substitutes: [173, 69, 5]
  },
  {
    id: 178, name: "东北大拉皮", cuisine: "东北", category: "素", lightness: "light", meals: ["早餐","中餐"], nutrition: "",
    ingredients: [
      { name: "拉皮", amount: 200, unit: "克" },
      { name: "黄瓜", amount: 1, unit: "根" },
      { name: "胡萝卜", amount: 1, unit: "根" },
      { name: "蒜", amount: 3, unit: "瓣" },
      { name: "芝麻酱", amount: 1, unit: "勺" },
      { name: "醋", amount: 1, unit: "勺" }
    ],
    steps: [
      "拉皮切宽条过凉水。",
      "黄瓜胡萝卜切丝。",
      "蒜切末加芝麻酱、醋、酱油调成麻酱汁。",
      "将拉皮和蔬菜丝摆盘。",
      "浇上麻酱汁拌匀即可。",
    ],
    videoUrl: "https://search.bilibili.com/all?keyword=东北大拉皮",
    substitutes: [24, 156, 178]
  },
  {
    id: 179, name: "酸菜白肉", cuisine: "东北", category: "荤", lightness: "light", meals: ["中餐","晚餐"], nutrition: "高蛋白",
    ingredients: [
      { name: "猪五花肉", amount: 300, unit: "克" },
      { name: "酸菜", amount: 300, unit: "克" },
      { name: "姜", amount: 3, unit: "片" },
      { name: "葱", amount: 1, unit: "根" },
      { name: "酱油", amount: 1, unit: "小勺" }
    ],
    steps: [
      "五花肉整块冷水煮至筷子可穿透。",
      "捞出晾凉切薄片，酸菜切丝。",
      "砂锅中放入酸菜垫底。",
      "铺上白肉片加姜片和水。",
      "大火烧开转小火炖20分钟加少许酱油调味。",
    ],
    videoUrl: "https://search.bilibili.com/all?keyword=酸菜白肉",
    substitutes: [14, 4, 175]
  },
  {
    id: 180, name: "拔丝苹果", cuisine: "东北", category: "素", lightness: "heavy", meals: ["中餐","晚餐"], nutrition: "",
    ingredients: [
      { name: "苹果", amount: 2, unit: "个" },
      { name: "糖", amount: 150, unit: "克" },
      { name: "淀粉", amount: 2, unit: "勺" },
      { name: "面粉", amount: 50, unit: "克" }
    ],
    steps: [
      "苹果去皮去核切块。",
      "苹果块裹面粉和淀粉糊。",
      "油锅六成热，下苹果块炸至金黄捞出。",
      "锅中加糖和少许水小火熬至琥珀色。",
      "倒入苹果块快速翻炒裹匀糖浆，趁热装盘。",
    ],
    videoUrl: "https://search.bilibili.com/all?keyword=拔丝苹果",
    substitutes: [80, 16, 101]
  },
  {
    id: 181, name: "酱骨架", cuisine: "东北", category: "荤", lightness: "heavy", meals: ["中餐","晚餐"], nutrition: "高蛋白",
    ingredients: [
      { name: "猪脊骨", amount: 500, unit: "克" },
      { name: "黄豆酱", amount: 2, unit: "勺" },
      { name: "姜", amount: 5, unit: "片" },
      { name: "八角", amount: 2, unit: "个" },
      { name: "酱油", amount: 2, unit: "勺" },
      { name: "料酒", amount: 1, unit: "勺" }
    ],
    steps: [
      "猪脊骨斩块冷水下锅焯水。",
      "锅中加少许油下姜片爆香。",
      "加黄豆酱酱油炒香。",
      "放入脊骨加水没过，加八角和料酒。",
      "大火烧开转小火炖1.5小时收汁即可。",
    ],
    videoUrl: "https://search.bilibili.com/all?keyword=酱骨架",
    substitutes: [86, 159, 92]
  },
  {
    id: 182, name: "尖椒干豆腐", cuisine: "东北", category: "素", lightness: "light", meals: ["中餐","晚餐"], nutrition: "",
    ingredients: [
      { name: "干豆腐", amount: 200, unit: "克" },
      { name: "青椒", amount: 2, unit: "个" },
      { name: "蒜", amount: 2, unit: "瓣" },
      { name: "酱油", amount: 1, unit: "勺" }
    ],
    steps: [
      "干豆腐切菱形片焯水。",
      "青椒切块，蒜切片。",
      "热锅加油，下蒜片爆香。",
      "放入干豆腐和青椒大火翻炒。",
      "加酱油调味翻炒均匀出锅。",
    ],
    videoUrl: "https://search.bilibili.com/all?keyword=尖椒干豆腐",
    substitutes: [165, 68, 167]
  },
  {
    id: 183, name: "排骨炖豆角", cuisine: "东北", category: "荤", lightness: "light", meals: ["中餐","晚餐"], nutrition: "高蛋白",
    ingredients: [
      { name: "猪排骨", amount: 400, unit: "克" },
      { name: "豆角", amount: 250, unit: "克" },
      { name: "土豆", amount: 1, unit: "个" },
      { name: "姜", amount: 3, unit: "片" },
      { name: "酱油", amount: 1, unit: "勺" }
    ],
    steps: [
      "排骨斩块焯水去血沫。",
      "豆角去筋折段，土豆去皮切块。",
      "热锅加油，下排骨煸炒至变色。",
      "加姜片酱油和水大火烧开转小火炖30分钟。",
      "加入豆角和土豆继续炖20分钟收汁加盐。",
    ],
    videoUrl: "https://search.bilibili.com/all?keyword=排骨炖豆角",
    substitutes: [164, 149, 48]
  },
  {
    id: 184, name: "老虎菜", cuisine: "东北", category: "素", lightness: "light", meals: ["早餐","中餐"], nutrition: "减脂",
    ingredients: [
      { name: "青椒", amount: 2, unit: "个" },
      { name: "黄瓜", amount: 1, unit: "根" },
      { name: "葱", amount: 2, unit: "根" },
      { name: "香菜", amount: 1, unit: "小把" },
      { name: "醋", amount: 1, unit: "勺" },
      { name: "酱油", amount: 1, unit: "小勺" }
    ],
    steps: [
      "青椒去籽切丝，黄瓜切丝。",
      "葱切丝，香菜切段。",
      "将所有蔬菜放入碗中。",
      "加醋、酱油、少许盐和香油。",
      "拌匀即可。",
    ],
    videoUrl: "https://search.bilibili.com/all?keyword=老虎菜",
    substitutes: [156, 24, 178]
  },
  {
    id: 185, name: "溜肝尖", cuisine: "东北", category: "荤", lightness: "regular", meals: ["中餐","晚餐"], nutrition: "高蛋白",
    ingredients: [
      { name: "猪肝", amount: 250, unit: "克" },
      { name: "木耳", amount: 30, unit: "克" },
      { name: "胡萝卜", amount: 1, unit: "根" },
      { name: "蒜", amount: 2, unit: "瓣" },
      { name: "酱油", amount: 1, unit: "勺" },
      { name: "姜", amount: 3, unit: "片" }
    ],
    steps: [
      "猪肝切薄片加酱油料酒淀粉腌制。",
      "木耳泡发撕小朵，胡萝卜切片。",
      "调碗汁：酱油、糖、醋、淀粉、水。",
      "油锅烧热下肝片滑炒变色盛出。",
      "锅留底油爆香姜蒜，倒回肝片配菜，淋碗汁快速翻炒出锅。",
    ],
    videoUrl: "https://search.bilibili.com/all?keyword=溜肝尖",
    substitutes: [136, 73, 177]
  },
  {
    id: 186, name: "雪衣豆沙", cuisine: "东北", category: "素", lightness: "heavy", meals: ["中餐","晚餐"], nutrition: "",
    ingredients: [
      { name: "豆沙", amount: 200, unit: "克" },
      { name: "蛋清", amount: 4, unit: "个" },
      { name: "淀粉", amount: 1, unit: "勺" },
      { name: "面粉", amount: 30, unit: "克" },
      { name: "糖", amount: 2, unit: "勺" }
    ],
    steps: [
      "豆沙搓成小球。",
      "蛋清打发至硬性发泡，加淀粉面粉拌匀。",
      "将豆沙球裹上蛋清糊。",
      "油锅四成热，下入豆沙球炸至膨大金黄。",
      "捞出撒糖粉即可。",
    ],
    videoUrl: "https://search.bilibili.com/all?keyword=雪衣豆沙",
    substitutes: [180, 80, 186]
  },
  {
    id: 187, name: "鱼香烘蛋", cuisine: "东北", category: "半荤", lightness: "regular", meals: ["早餐","中餐","晚餐"], nutrition: "高蛋白",
    ingredients: [
      { name: "鸡蛋", amount: 4, unit: "个" },
      { name: "猪肉末", amount: 50, unit: "克" },
      { name: "豆瓣酱", amount: 1, unit: "勺" },
      { name: "葱", amount: 1, unit: "根" },
      { name: "蒜", amount: 2, unit: "瓣" }
    ],
    steps: [
      "鸡蛋打散加盐搅匀。",
      "猪肉末加豆瓣酱、蒜末、葱花炒成鱼香肉臊。",
      "平底锅多油烧热，倒入蛋液。",
      "中小火烘至蛋液膨胀底部金黄。",
      "将烘蛋盛出浇上鱼香肉臊即可。",
    ],
    videoUrl: "https://search.bilibili.com/all?keyword=鱼香烘蛋",
    substitutes: [163, 155, 153]
  },
  {
    id: 188, name: "东北乱炖", cuisine: "东北", category: "半荤", lightness: "regular", meals: ["中餐","晚餐"], nutrition: "高蛋白",
    ingredients: [
      { name: "猪肉", amount: 150, unit: "克" },
      { name: "土豆", amount: 1, unit: "个" },
      { name: "豆角", amount: 100, unit: "克" },
      { name: "茄子", amount: 1, unit: "根" },
      { name: "西红柿", amount: 1, unit: "个" },
      { name: "姜", amount: 3, unit: "片" }
    ],
    steps: [
      "猪肉切片，土豆去皮切块，豆角折段。",
      "茄子切块，西红柿切块。",
      "热锅加油，下肉片煸炒出油。",
      "加姜片炒香，放入土豆豆角茄子翻炒。",
      "加水炖20分钟，加西红柿再炖10分钟加盐调味。",
    ],
    videoUrl: "https://search.bilibili.com/all?keyword=东北乱炖",
    substitutes: [174, 175, 183]
  },

  // ======================================== 西式 (12道, id 189-200) ========================================
  {
    id: 189, name: "番茄意面", cuisine: "西式", category: "半荤", lightness: "regular", meals: ["中餐","晚餐"], nutrition: "高蛋白",
    ingredients: [
      { name: "意面", amount: 250, unit: "克" },
      { name: "西红柿", amount: 2, unit: "个" },
      { name: "猪肉末", amount: 100, unit: "克" },
      { name: "洋葱", amount: 0.5, unit: "个" },
      { name: "蒜", amount: 2, unit: "瓣" },
      { name: "番茄酱", amount: 2, unit: "勺" }
    ],
    steps: [
      "意面入加盐的沸水中煮至al dente，捞出备用。",
      "洋葱切碎，蒜切末，西红柿切块。",
      "热锅加油，炒香洋葱蒜末，下肉末翻炒至变色。",
      "加入西红柿和番茄酱，小火熬煮15分钟成酱。",
      "将煮好的意面拌入酱中翻炒均匀即可装盘。"
    ],
    videoUrl: "https://search.bilibili.com/all?keyword=番茄意面",
    substitutes: [10, 118, 32]
  },
  {
    id: 190, name: "煎牛排配芦笋", cuisine: "西式", category: "荤", lightness: "light", meals: ["中餐","晚餐"], nutrition: "高蛋白",
    ingredients: [
      { name: "牛排", amount: 2, unit: "块" },
      { name: "芦笋", amount: 150, unit: "克" },
      { name: "蒜", amount: 2, unit: "瓣" },
      { name: "黄油", amount: 20, unit: "克" },
      { name: "盐", amount: 1, unit: "小撮" },
      { name: "黑胡椒", amount: 1, unit: "小撮" }
    ],
    steps: [
      "牛排提前半小时从冰箱取出恢复室温，用厨房纸吸干表面水分。",
      "两面均匀撒盐和黑胡椒。",
      "平底锅大火烧热，不放油，直接下牛排，每面煎2-3分钟。",
      "加入黄油和蒜瓣，用勺子将融化的黄油不断浇在牛排上。",
      "出锅静置5分钟，同时用锅中余油煎熟芦笋装盘。"
    ],
    videoUrl: "https://search.bilibili.com/all?keyword=煎牛排配芦笋",
    substitutes: [2, 76, 192]
  },
  {
    id: 191, name: "凯撒沙拉", cuisine: "西式", category: "素", lightness: "light", meals: ["早餐","中餐","晚餐"], nutrition: "减脂",
    ingredients: [
      { name: "生菜", amount: 200, unit: "克" },
      { name: "面包丁", amount: 50, unit: "克" },
      { name: "鸡蛋", amount: 1, unit: "个" },
      { name: "帕玛森芝士", amount: 30, unit: "克" },
      { name: "凯撒酱", amount: 2, unit: "勺" }
    ],
    steps: [
      "生菜洗净甩干撕成片。",
      "面包切丁烤至酥脆。",
      "鸡蛋煮至溏心切瓣。",
      "将生菜、面包丁、鸡蛋摆入盘中。",
      "撒帕玛森芝士碎，淋凯撒酱拌匀即可。",
    ],
    videoUrl: "https://search.bilibili.com/all?keyword=凯撒沙拉",
    substitutes: [30, 156, 170]
  },
  {
    id: 192, name: "香煎三文鱼", cuisine: "西式", category: "荤", lightness: "light", meals: ["中餐","晚餐"], nutrition: "减脂,高蛋白",
    ingredients: [
      { name: "三文鱼", amount: 2, unit: "块" },
      { name: "柠檬", amount: 0.5, unit: "个" },
      { name: "蒜", amount: 2, unit: "瓣" },
      { name: "盐", amount: 1, unit: "小撮" },
      { name: "黑胡椒", amount: 1, unit: "小撮" },
      { name: "黄油", amount: 15, unit: "克" }
    ],
    steps: [
      "三文鱼用厨房纸吸干水分。",
      "两面撒盐和黑胡椒。",
      "平底锅加黄油烧热。",
      "放入三文鱼中火每面煎3分钟至金黄。",
      "挤柠檬汁装盘即可。",
    ],
    videoUrl: "https://search.bilibili.com/all?keyword=香煎三文鱼",
    substitutes: [190, 27, 127]
  },
  {
    id: 193, name: "奶油蘑菇汤", cuisine: "西式", category: "素", lightness: "light", meals: ["中餐","晚餐"], nutrition: "",
    ingredients: [
      { name: "口蘑", amount: 200, unit: "克" },
      { name: "洋葱", amount: 0.5, unit: "个" },
      { name: "黄油", amount: 20, unit: "克" },
      { name: "面粉", amount: 2, unit: "勺" },
      { name: "牛奶", amount: 200, unit: "毫升" },
      { name: "盐", amount: 1, unit: "小撮" }
    ],
    steps: [
      "口蘑切片，洋葱切碎。",
      "锅中加黄油，炒香洋葱。",
      "加入口蘑翻炒至出水。",
      "撒入面粉翻炒均匀，倒入牛奶搅拌。",
      "小火煮5分钟至浓稠，加盐调味。",
    ],
    videoUrl: "https://search.bilibili.com/all?keyword=奶油蘑菇汤",
    substitutes: [158, 168, 85]
  },
  {
    id: 194, name: "薯条", cuisine: "西式", category: "素", lightness: "heavy", meals: ["中餐","晚餐"], nutrition: "",
    ingredients: [
      { name: "土豆", amount: 3, unit: "个" },
      { name: "盐", amount: 1, unit: "小撮" },
      { name: "油", amount: 3, unit: "勺" }
    ],
    steps: [
      "土豆去皮切条，泡水去淀粉。",
      "沥干用厨房纸吸干水分。",
      "油锅烧至六成热，下薯条炸至微黄捞出。",
      "油温升高复炸至金黄酥脆。",
      "捞出撒盐即可。",
    ],
    videoUrl: "https://search.bilibili.com/all?keyword=薯条",
    substitutes: [6, 174, 80]
  },
  {
    id: 195, name: "芝士焗饭", cuisine: "西式", category: "半荤", lightness: "regular", meals: ["中餐","晚餐"], nutrition: "高蛋白",
    ingredients: [
      { name: "米饭", amount: 2, unit: "碗" },
      { name: "芝士", amount: 100, unit: "克" },
      { name: "火腿", amount: 80, unit: "克" },
      { name: "玉米", amount: 50, unit: "克" },
      { name: "青豆", amount: 30, unit: "克" },
      { name: "洋葱", amount: 0.5, unit: "个" }
    ],
    steps: [
      "米饭盛入烤碗中。",
      "火腿切丁，玉米青豆焯水。",
      "将配料铺在饭上。",
      "撒上芝士碎。",
      "烤箱预热200度烤10分钟至芝士融化金黄。",
    ],
    videoUrl: "https://search.bilibili.com/all?keyword=芝士焗饭",
    substitutes: [155, 100, 37]
  },
  {
    id: 196, name: "烤鸡翅", cuisine: "西式", category: "荤", lightness: "regular", meals: ["中餐","晚餐"], nutrition: "高蛋白",
    ingredients: [
      { name: "鸡翅", amount: 8, unit: "个" },
      { name: "蜂蜜", amount: 2, unit: "勺" },
      { name: "酱油", amount: 1, unit: "勺" },
      { name: "蒜", amount: 3, unit: "瓣" },
      { name: "姜", amount: 3, unit: "片" },
      { name: "料酒", amount: 1, unit: "勺" }
    ],
    steps: [
      "鸡翅洗净划刀。",
      "加酱油、蜂蜜、料酒、蒜末、姜片腌制2小时。",
      "烤盘铺锡纸摆入鸡翅。",
      "烤箱预热200度烤15分钟。",
      "取出翻面刷蜂蜜水再烤10分钟至金黄。",
    ],
    videoUrl: "https://search.bilibili.com/all?keyword=烤鸡翅",
    substitutes: [29, 11, 8]
  },
  {
    id: 197, name: "蔬菜沙拉", cuisine: "西式", category: "素", lightness: "light", meals: ["早餐","中餐","晚餐"], nutrition: "减脂",
    ingredients: [
      { name: "生菜", amount: 100, unit: "克" },
      { name: "黄瓜", amount: 1, unit: "根" },
      { name: "西红柿", amount: 1, unit: "个" },
      { name: "沙拉酱", amount: 2, unit: "勺" }
    ],
    steps: [
      "生菜洗净撕片，黄瓜切片，西红柿切块。",
      "所有蔬菜放入沙拉碗中。",
      "挤入沙拉酱。",
      "拌匀即可。",
    ],
    videoUrl: "https://search.bilibili.com/all?keyword=蔬菜沙拉",
    substitutes: [191, 156, 191]
  },
  {
    id: 198, name: "意式肉酱面", cuisine: "西式", category: "半荤", lightness: "regular", meals: ["中餐","晚餐"], nutrition: "高蛋白",
    ingredients: [
      { name: "意面", amount: 250, unit: "克" },
      { name: "牛肉", amount: 150, unit: "克" },
      { name: "西红柿", amount: 2, unit: "个" },
      { name: "洋葱", amount: 0.5, unit: "个" },
      { name: "蒜", amount: 2, unit: "瓣" },
      { name: "番茄酱", amount: 2, unit: "勺" }
    ],
    steps: [
      "意面入加盐沸水煮至弹牙捞出。",
      "洋葱蒜切末，西红柿切块。",
      "热锅加油炒香洋葱蒜末，下牛肉末炒散。",
      "加入西红柿和番茄酱小火熬15分钟。",
      "将肉酱浇在面上拌匀即可。",
    ],
    videoUrl: "https://search.bilibili.com/all?keyword=意式肉酱面",
    substitutes: [189, 32, 189]
  },
  {
    id: 199, name: "烤三明治", cuisine: "西式", category: "半荤", lightness: "regular", meals: ["早餐","中餐"], nutrition: "高蛋白",
    ingredients: [
      { name: "吐司", amount: 4, unit: "片" },
      { name: "火腿", amount: 100, unit: "克" },
      { name: "芝士", amount: 50, unit: "克" },
      { name: "生菜", amount: 50, unit: "克" },
      { name: "番茄酱", amount: 1, unit: "勺" }
    ],
    steps: [
      "吐司片铺平。",
      "放上火腿片和芝士片。",
      "盖上另一片吐司。",
      "三明治机或平底锅加热至两面金黄。",
      "对角切开即可。",
    ],
    videoUrl: "https://search.bilibili.com/all?keyword=烤三明治",
    substitutes: [195, 155, 199]
  },
  {
    id: 200, name: "罗宋汤", cuisine: "西式", category: "荤", lightness: "light", meals: ["中餐","晚餐"], nutrition: "高蛋白",
    ingredients: [
      { name: "牛肉", amount: 200, unit: "克" },
      { name: "西红柿", amount: 2, unit: "个" },
      { name: "土豆", amount: 1, unit: "个" },
      { name: "胡萝卜", amount: 1, unit: "根" },
      { name: "洋葱", amount: 0.5, unit: "个" },
      { name: "番茄酱", amount: 2, unit: "勺" }
    ],
    steps: [
      "牛肉切块焯水，西红柿切块，土豆胡萝卜切滚刀块。",
      "热锅加油，炒香洋葱，下牛肉翻炒至表面变色。",
      "加入西红柿和番茄酱翻炒出香。",
      "倒入足量清水，大火烧开转小火炖1小时。",
      "加入土豆和胡萝卜继续炖20分钟，加盐调味即可。"
    ],
    videoUrl: "https://search.bilibili.com/all?keyword=罗宋汤",
    substitutes: [149, 175, 48]
  }
];

/**
 * 食材库：所有菜涉及到的食材，含类别和保鲜期。
 * shelfLife: "short"（第一批采购） / "long"（第二批囤货）
 */
const ingredientDB = {
  "豆腐": { category: "豆制品", shelfLife: "short" },
  "猪肉末": { category: "鲜肉类", shelfLife: "short" },
  "豆瓣酱": { category: "调味料", shelfLife: "long" },
  "花椒": { category: "调味料", shelfLife: "long" },
  "蒜": { category: "蔬菜", shelfLife: "long" },
  "葱": { category: "蔬菜", shelfLife: "short" },
  "鸡胸肉": { category: "鲜肉类", shelfLife: "short" },
  "花生米": { category: "干货", shelfLife: "long" },
  "干辣椒": { category: "干货", shelfLife: "long" },
  "黄瓜": { category: "蔬菜", shelfLife: "short" },
  "酱油": { category: "调味料", shelfLife: "long" },
  "猪里脊": { category: "鲜肉类", shelfLife: "short" },
  "白菜": { category: "蔬菜", shelfLife: "short" },
  "香菜": { category: "蔬菜", shelfLife: "short" },
  "猪五花肉": { category: "鲜肉类", shelfLife: "short" },
  "青椒": { category: "蔬菜", shelfLife: "short" },
  "蒜苗": { category: "蔬菜", shelfLife: "short" },
  "姜": { category: "蔬菜", shelfLife: "long" },
  "木耳": { category: "干货", shelfLife: "long" },
  "胡萝卜": { category: "蔬菜", shelfLife: "long" },
  "醋": { category: "调味料", shelfLife: "long" },
  "土豆": { category: "根茎类", shelfLife: "long" },
  "草鱼": { category: "鲜肉类", shelfLife: "short" },
  "豆芽": { category: "蔬菜", shelfLife: "short" },
  "鸡腿": { category: "鲜肉类", shelfLife: "short" },
  "牛腱子": { category: "鲜肉类", shelfLife: "short" },
  "牛肚": { category: "鲜肉类", shelfLife: "short" },
  "辣椒油": { category: "调味料", shelfLife: "long" },
  "细面条": { category: "主食", shelfLife: "short" },
  "芽菜": { category: "干货", shelfLife: "long" },
  "花生酱": { category: "调味料", shelfLife: "long" },
  "芝麻酱": { category: "调味料", shelfLife: "long" },
  "鸭血": { category: "鲜肉类", shelfLife: "short" },
  "毛肚": { category: "鲜肉类", shelfLife: "short" },
  "火腿": { category: "加工肉", shelfLife: "long" },
  "四季豆": { category: "蔬菜", shelfLife: "short" },
  "橄榄菜": { category: "干货", shelfLife: "long" },
  "鸡爪": { category: "鲜肉类", shelfLife: "short" },
  "泡椒": { category: "干货", shelfLife: "long" },
  "米粉": { category: "主食", shelfLife: "long" },
  "酸菜": { category: "干货", shelfLife: "long" },
  "花菜": { category: "蔬菜", shelfLife: "short" },
  "豆豉": { category: "调味料", shelfLife: "long" },
  "猪肘子": { category: "鲜肉类", shelfLife: "short" },
  "冰糖": { category: "调味料", shelfLife: "long" },
  "料酒": { category: "调味料", shelfLife: "long" },
  "抄手皮": { category: "主食", shelfLife: "short" },
  "鸭": { category: "鲜肉类", shelfLife: "short" },
  "茶叶": { category: "干货", shelfLife: "long" },
  "盐": { category: "调味料", shelfLife: "long" },
  "凉粉": { category: "豆制品", shelfLife: "short" },
  "粗面条": { category: "主食", shelfLife: "short" },
  "糖": { category: "调味料", shelfLife: "long" },
  "鸡": { category: "鲜肉类", shelfLife: "short" },
  "花生油": { category: "调味料", shelfLife: "long" },
  "鲈鱼": { category: "鲜肉类", shelfLife: "short" },
  "蒸鱼豉油": { category: "调味料", shelfLife: "long" },
  "菜心": { category: "蔬菜", shelfLife: "short" },
  "猪梅花肉": { category: "鲜肉类", shelfLife: "short" },
  "蜂蜜": { category: "调味料", shelfLife: "long" },
  "生菜": { category: "蔬菜", shelfLife: "short" },
  "蚝油": { category: "调味料", shelfLife: "long" },
  "虾": { category: "鲜肉类", shelfLife: "short" },
  "河粉": { category: "主食", shelfLife: "short" },
  "牛肉": { category: "鲜肉类", shelfLife: "short" },
  "洋葱": { category: "蔬菜", shelfLife: "long" },
  "猪排骨": { category: "鲜肉类", shelfLife: "short" },
  "菠萝": { category: "水果", shelfLife: "short" },
  "番茄酱": { category: "调味料", shelfLife: "long" },
  "螃蟹": { category: "鲜肉类", shelfLife: "short" },
  "鸡蛋": { category: "蛋类", shelfLife: "short" },
  "虾仁": { category: "鲜肉类", shelfLife: "short" },
  "大米": { category: "主食", shelfLife: "long" },
  "腊肠": { category: "加工肉", shelfLife: "long" },
  "腊肉": { category: "加工肉", shelfLife: "long" },
  "粗盐": { category: "调味料", shelfLife: "long" },
  "沙姜粉": { category: "调味料", shelfLife: "long" },
  "八角": { category: "调味料", shelfLife: "long" },
  "芥蓝": { category: "蔬菜", shelfLife: "short" },
  "椰子": { category: "水果", shelfLife: "short" },
  "红枣": { category: "干货", shelfLife: "long" },
  "枸杞": { category: "干货", shelfLife: "long" },
  "油菜": { category: "蔬菜", shelfLife: "short" },
  "苦瓜": { category: "蔬菜", shelfLife: "short" },
  "茄子": { category: "蔬菜", shelfLife: "short" },
  "咸鱼": { category: "干货", shelfLife: "long" },
  "空心菜": { category: "蔬菜", shelfLife: "short" },
  "腐乳": { category: "调味料", shelfLife: "long" },
  "红椒": { category: "蔬菜", shelfLife: "short" },
  "猪蹄": { category: "鲜肉类", shelfLife: "short" },
  "沙姜": { category: "调味料", shelfLife: "long" },
  "玉米": { category: "蔬菜", shelfLife: "short" },
  "胖头鱼头": { category: "鲜肉类", shelfLife: "short" },
  "剁椒": { category: "干货", shelfLife: "long" },
  "猪肉": { category: "鲜肉类", shelfLife: "short" },
  "酸豆角": { category: "干货", shelfLife: "long" },
  "外婆菜": { category: "干货", shelfLife: "long" },
  "蒜苔": { category: "蔬菜", shelfLife: "short" },
  "小龙虾": { category: "鲜肉类", shelfLife: "short" },
  "皮蛋": { category: "蛋类", shelfLife: "long" },
  "香油": { category: "调味料", shelfLife: "long" },
  "猪大肠": { category: "鲜肉类", shelfLife: "short" },
  "芋头": { category: "根茎类", shelfLife: "long" },
  "鸡胗": { category: "鲜肉类", shelfLife: "short" },
  "孜然粉": { category: "调味料", shelfLife: "long" },
  "米饭": { category: "主食", shelfLife: "short" },
  "老干妈": { category: "调味料", shelfLife: "long" },
  "香干": { category: "豆制品", shelfLife: "short" },
  "海参": { category: "鲜肉类", shelfLife: "short" },
  "胡椒": { category: "调味料", shelfLife: "long" },
  "鲤鱼": { category: "鲜肉类", shelfLife: "short" },
  "黄花菜": { category: "干货", shelfLife: "long" },
  "淀粉": { category: "调味料", shelfLife: "long" },
  "芦笋": { category: "蔬菜", shelfLife: "short" },
  "鱼肉": { category: "鲜肉类", shelfLife: "short" },
  "地瓜": { category: "根茎类", shelfLife: "long" },
  "油": { category: "调味料", shelfLife: "long" },
  "蒲菜": { category: "蔬菜", shelfLife: "short" },
  "牡蛎": { category: "鲜肉类", shelfLife: "short" },
  "蛋清": { category: "蛋类", shelfLife: "short" },
  "猪大排": { category: "鲜肉类", shelfLife: "short" },
  "鳜鱼": { category: "鲜肉类", shelfLife: "short" },
  "干丝": { category: "豆制品", shelfLife: "short" },
  "鳝鱼": { category: "鲜肉类", shelfLife: "short" },
  "鲳鱼": { category: "鲜肉类", shelfLife: "short" },
  "大闸蟹": { category: "鲜肉类", shelfLife: "short" },
  "青豆": { category: "蔬菜", shelfLife: "long" },
  "莲藕": { category: "蔬菜", shelfLife: "long" },
  "糯米": { category: "主食", shelfLife: "long" },
  "红糖": { category: "调味料", shelfLife: "long" },
  "桂花": { category: "干货", shelfLife: "long" },
  "碧螺春茶叶": { category: "干货", shelfLife: "long" },
  "龙井茶叶": { category: "干货", shelfLife: "long" },
  "香菇": { category: "干货", shelfLife: "long" },
  "笋干": { category: "干货", shelfLife: "long" },
  "豆腐皮": { category: "豆制品", shelfLife: "short" },
  "莲子": { category: "干货", shelfLife: "long" },
  "荷叶": { category: "干货", shelfLife: "long" },
  "黄鱼": { category: "鲜肉类", shelfLife: "short" },
  "雪菜": { category: "干货", shelfLife: "long" },
  "鲫鱼": { category: "鲜肉类", shelfLife: "short" },
  "白萝卜": { category: "蔬菜", shelfLife: "long" },
  "莼菜": { category: "蔬菜", shelfLife: "short" },
  "春笋": { category: "蔬菜", shelfLife: "short" },
  "面条": { category: "主食", shelfLife: "short" },
  "鲍鱼": { category: "鲜肉类", shelfLife: "short" },
  "荸荠": { category: "蔬菜", shelfLife: "long" },
  "海蛎": { category: "鲜肉类", shelfLife: "short" },
  "红薯粉": { category: "主食", shelfLife: "long" },
  "沙茶酱": { category: "调味料", shelfLife: "long" },
  "石斑鱼": { category: "鲜肉类", shelfLife: "short" },
  "鱿鱼": { category: "鲜肉类", shelfLife: "short" },
  "当归": { category: "干货", shelfLife: "long" },
  "熟地": { category: "干货", shelfLife: "long" },
  "猪肝": { category: "鲜肉类", shelfLife: "short" },
  "毛豆腐": { category: "豆制品", shelfLife: "short" },
  "油豆腐": { category: "豆制品", shelfLife: "short" },
  "鸽子": { category: "鲜肉类", shelfLife: "short" },
  "山药": { category: "根茎类", shelfLife: "long" },
  "甲鱼": { category: "鲜肉类", shelfLife: "short" },
  "粉条": { category: "主食", shelfLife: "long" },
  "榛蘑": { category: "干货", shelfLife: "long" },
  "拉皮": { category: "主食", shelfLife: "long" },
  "苹果": { category: "水果", shelfLife: "long" },
  "面粉": { category: "主食", shelfLife: "long" },
  "猪脊骨": { category: "鲜肉类", shelfLife: "short" },
  "黄豆酱": { category: "调味料", shelfLife: "long" },
  "干豆腐": { category: "豆制品", shelfLife: "short" },
  "豆角": { category: "蔬菜", shelfLife: "short" },
  "豆沙": { category: "干货", shelfLife: "long" },
  "意面": { category: "主食", shelfLife: "long" },
  "牛排": { category: "鲜肉类", shelfLife: "short" },
  "黄油": { category: "调味料", shelfLife: "long" },
  "黑胡椒": { category: "调味料", shelfLife: "long" },
  "面包丁": { category: "主食", shelfLife: "long" },
  "帕玛森芝士": { category: "调味料", shelfLife: "long" },
  "凯撒酱": { category: "调味料", shelfLife: "long" },
  "三文鱼": { category: "鲜肉类", shelfLife: "short" },
  "柠檬": { category: "水果", shelfLife: "long" },
  "口蘑": { category: "蔬菜", shelfLife: "short" },
  "牛奶": { category: "蛋奶", shelfLife: "short" },
  "芝士": { category: "蛋奶", shelfLife: "short" },
  "鸡翅": { category: "鲜肉类", shelfLife: "short" },
  "沙拉酱": { category: "调味料", shelfLife: "long" },
  "吐司": { category: "主食", shelfLife: "short" },
  "青菜": { category: "蔬菜", shelfLife: "short" },
  "包菜": { category: "蔬菜", shelfLife: "short" },
  "西兰花": { category: "蔬菜", shelfLife: "short" },
  "冬瓜": { category: "蔬菜", shelfLife: "long" },
  "韭菜": { category: "蔬菜", shelfLife: "short" },
  "西红柿": { category: "蔬菜", shelfLife: "short" },
  "紫菜": { category: "干货", shelfLife: "long" },
  "萝卜干": { category: "干货", shelfLife: "long" },
  "鱼": { category: "鲜肉类", shelfLife: "short" }
};

if (typeof window !== "undefined") {
  window.cuisineOptions = cuisineOptions;
  window.spiceOptions = spiceOptions;
  window.avoidOptions = avoidOptions;
  window.regionOptions = regionOptions;
  window.nutritionOptions = nutritionOptions;
  window.portionMultiplier = portionMultiplier;
  window.shelfLifeConfig = shelfLifeConfig;
  window.dishDB = dishDB;
  window.ingredientDB = ingredientDB;
}
