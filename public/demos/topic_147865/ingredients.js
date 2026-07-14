/**
 * 食材单位转克数 & 价格数据库
 * key: 食材名称（与 ingredientDB 中的名称严格一致）
 * value: { category, baseUnit, unitConv: { "单位": 克数 }, price: 每500克价格(元) }
 * 所有价格均以每500克为单位，方便比较
 * 食材按拼音排序（localeCompare('zh-CN')）
 */
const ingredientUnitDB = {
  "白菜": {
    category: "蔬菜",
    baseUnit: "克",
    unitConv: { "克": 1 },
    price: 1.2
  },
  "白萝卜": {
    category: "蔬菜",
    baseUnit: "克",
    unitConv: { "克": 1 },
    price: 1.5
  },
  "包菜": {
    category: "蔬菜",
    baseUnit: "克",
    unitConv: { "克": 1, "颗": 1500 },
    price: 1.5
  },
  "鲍鱼": {
    category: "鲜肉类",
    baseUnit: "克",
    unitConv: { "克": 1, "只": 60 },
    price: 80
  },
  "荸荠": {
    category: "蔬菜",
    baseUnit: "克",
    unitConv: { "克": 1, "个": 30 },
    price: 4
  },
  "碧螺春茶叶": {
    category: "干货",
    baseUnit: "克",
    unitConv: { "克": 1 },
    price: 160
  },
  "菠萝": {
    category: "水果",
    baseUnit: "克",
    unitConv: { "克": 1 },
    price: 4
  },
  "菜心": {
    category: "蔬菜",
    baseUnit: "克",
    unitConv: { "克": 1 },
    price: 4
  },
  "草鱼": {
    category: "鲜肉类",
    baseUnit: "克",
    unitConv: { "克": 1, "条": 1000 },
    price: 8
  },
  "茶叶": {
    category: "干货",
    baseUnit: "克",
    unitConv: { "克": 1 },
    price: 40
  },
  "鲳鱼": {
    category: "鲜肉类",
    baseUnit: "克",
    unitConv: { "克": 1, "条": 500 },
    price: 16
  },
  "抄手皮": {
    category: "主食",
    baseUnit: "克",
    unitConv: { "克": 1 },
    price: 5
  },
  "春笋": {
    category: "蔬菜",
    baseUnit: "克",
    unitConv: { "克": 1 },
    price: 6
  },
  "葱": {
    category: "蔬菜",
    baseUnit: "克",
    unitConv: { "克": 1, "根": 20 },
    price: 12
  },
  "莼菜": {
    category: "蔬菜",
    baseUnit: "克",
    unitConv: { "克": 1 },
    price: 10
  },
  "粗面条": {
    category: "主食",
    baseUnit: "克",
    unitConv: { "克": 1 },
    price: 4
  },
  "大闸蟹": {
    category: "鲜肉类",
    baseUnit: "克",
    unitConv: { "克": 1, "只": 200 },
    price: 45
  },
  "大米": {
    category: "主食",
    baseUnit: "克",
    unitConv: { "克": 1 },
    price: 3.5
  },
  "蛋清": {
    category: "蛋类",
    baseUnit: "克",
    unitConv: { "克": 1, "个": 35 },
    price: 3
  },
  "当归": {
    category: "干货",
    baseUnit: "克",
    unitConv: { "克": 1 },
    price: 50
  },
  "地瓜": {
    category: "根茎类",
    baseUnit: "克",
    unitConv: { "克": 1 },
    price: 2
  },
  "冬瓜": {
    category: "蔬菜",
    baseUnit: "克",
    unitConv: { "克": 1 },
    price: 1.2
  },
  "豆角": {
    category: "蔬菜",
    baseUnit: "克",
    unitConv: { "克": 1 },
    price: 4
  },
  "豆腐": {
    category: "豆制品",
    baseUnit: "克",
    unitConv: { "克": 1, "块": 400 },
    price: 2
  },
  "豆腐皮": {
    category: "豆制品",
    baseUnit: "克",
    unitConv: { "克": 1, "张": 50 },
    price: 6
  },
  "豆沙": {
    category: "干货",
    baseUnit: "克",
    unitConv: { "克": 1 },
    price: 6
  },
  "豆芽": {
    category: "蔬菜",
    baseUnit: "克",
    unitConv: { "克": 1 },
    price: 1.5
  },
  "粉丝": {
    category: "主食",
    baseUnit: "克",
    unitConv: { "克": 1 },
    price: 5
  },
  "粉条": {
    category: "主食",
    baseUnit: "克",
    unitConv: { "克": 1 },
    price: 6
  },
  "干豆腐": {
    category: "豆制品",
    baseUnit: "克",
    unitConv: { "克": 1 },
    price: 5
  },
  "干丝": {
    category: "豆制品",
    baseUnit: "克",
    unitConv: { "克": 1 },
    price: 7
  },
  "鸽子": {
    category: "鲜肉类",
    baseUnit: "克",
    unitConv: { "克": 1, "只": 350 },
    price: 28
  },
  "枸杞": {
    category: "干货",
    baseUnit: "克",
    unitConv: { "克": 1 },
    price: 30
  },
  "桂花": {
    category: "干货",
    baseUnit: "克",
    unitConv: { "克": 1, "小撮": 2 },
    price: 60
  },
  "鳜鱼": {
    category: "鲜肉类",
    baseUnit: "克",
    unitConv: { "克": 1, "条": 600 },
    price: 38
  },
  "海参": {
    category: "鲜肉类",
    baseUnit: "克",
    unitConv: { "克": 1 },
    price: 80
  },
  "海蛎": {
    category: "鲜肉类",
    baseUnit: "克",
    unitConv: { "克": 1 },
    price: 15
  },
  "河粉": {
    category: "主食",
    baseUnit: "克",
    unitConv: { "克": 1 },
    price: 4
  },
  "荷叶": {
    category: "干货",
    baseUnit: "克",
    unitConv: { "克": 1, "张": 10 },
    price: 15
  },
  "红椒": {
    category: "蔬菜",
    baseUnit: "克",
    unitConv: { "克": 1, "个": 120 },
    price: 4
  },
  "红薯粉": {
    category: "主食",
    baseUnit: "克",
    unitConv: { "克": 1 },
    price: 5
  },
  "红枣": {
    category: "干货",
    baseUnit: "克",
    unitConv: { "克": 1, "颗": 5 },
    price: 12
  },
  "胡萝卜": {
    category: "蔬菜",
    baseUnit: "克",
    unitConv: { "克": 1, "根": 150 },
    price: 2.5
  },
  "花菜": {
    category: "蔬菜",
    baseUnit: "克",
    unitConv: { "克": 1, "颗": 500 },
    price: 3
  },
  "花生米": {
    category: "干货",
    baseUnit: "克",
    unitConv: { "克": 1 },
    price: 8
  },
  "黄瓜": {
    category: "蔬菜",
    baseUnit: "克",
    unitConv: { "克": 1, "根": 200 },
    price: 3
  },
  "黄花菜": {
    category: "干货",
    baseUnit: "克",
    unitConv: { "克": 1 },
    price: 20
  },
  "黄鱼": {
    category: "鲜肉类",
    baseUnit: "克",
    unitConv: { "克": 1, "条": 500 },
    price: 22
  },
  "火腿": {
    category: "加工肉",
    baseUnit: "克",
    unitConv: { "克": 1 },
    price: 16
  },
  "姜": {
    category: "蔬菜",
    baseUnit: "克",
    unitConv: { "克": 1, "块": 40 },
    price: 16
  },
  "鸡": {
    category: "鲜肉类",
    baseUnit: "克",
    unitConv: { "克": 1, "只": 1500 },
    price: 12
  },
  "鸡翅": {
    category: "鲜肉类",
    baseUnit: "克",
    unitConv: { "克": 1, "个": 30 },
    price: 12
  },
  "鸡蛋": {
    category: "蛋类",
    baseUnit: "克",
    unitConv: { "克": 1, "个": 55 },
    price: 4.5
  },
  "鸡腿": {
    category: "鲜肉类",
    baseUnit: "克",
    unitConv: { "克": 1, "个": 200 },
    price: 8
  },
  "鸡胸肉": {
    category: "鲜肉类",
    baseUnit: "克",
    unitConv: { "克": 1 },
    price: 10
  },
  "鸡胗": {
    category: "鲜肉类",
    baseUnit: "克",
    unitConv: { "克": 1 },
    price: 11
  },
  "鸡爪": {
    category: "鲜肉类",
    baseUnit: "克",
    unitConv: { "克": 1 },
    price: 9
  },
  "鲫鱼": {
    category: "鲜肉类",
    baseUnit: "克",
    unitConv: { "克": 1, "条": 400 },
    price: 9
  },
  "甲鱼": {
    category: "鲜肉类",
    baseUnit: "克",
    unitConv: { "克": 1, "只": 750 },
    price: 45
  },
  "芥蓝": {
    category: "蔬菜",
    baseUnit: "克",
    unitConv: { "克": 1 },
    price: 4
  },
  "韭菜": {
    category: "蔬菜",
    baseUnit: "克",
    unitConv: { "克": 1 },
    price: 3
  },
  "空心菜": {
    category: "蔬菜",
    baseUnit: "克",
    unitConv: { "克": 1 },
    price: 2.5
  },
  "口蘑": {
    category: "蔬菜",
    baseUnit: "克",
    unitConv: { "克": 1 },
    price: 8
  },
  "苦瓜": {
    category: "蔬菜",
    baseUnit: "克",
    unitConv: { "克": 1, "根": 250 },
    price: 3.5
  },
  "拉皮": {
    category: "主食",
    baseUnit: "克",
    unitConv: { "克": 1 },
    price: 4
  },
  "腊肠": {
    category: "加工肉",
    baseUnit: "克",
    unitConv: { "克": 1, "根": 80 },
    price: 18
  },
  "腊肉": {
    category: "加工肉",
    baseUnit: "克",
    unitConv: { "克": 1 },
    price: 20
  },
  "鲤鱼": {
    category: "鲜肉类",
    baseUnit: "克",
    unitConv: { "克": 1, "条": 1000 },
    price: 7
  },
  "莲藕": {
    category: "蔬菜",
    baseUnit: "克",
    unitConv: { "克": 1, "节": 300 },
    price: 4
  },
  "莲子": {
    category: "干货",
    baseUnit: "克",
    unitConv: { "克": 1 },
    price: 20
  },
  "凉粉": {
    category: "豆制品",
    baseUnit: "克",
    unitConv: { "克": 1 },
    price: 3
  },
  "龙井茶叶": {
    category: "干货",
    baseUnit: "克",
    unitConv: { "克": 1 },
    price: 200
  },
  "芦笋": {
    category: "蔬菜",
    baseUnit: "克",
    unitConv: { "克": 1 },
    price: 8
  },
  "鲈鱼": {
    category: "鲜肉类",
    baseUnit: "克",
    unitConv: { "克": 1, "条": 600 },
    price: 18
  },
  "毛肚": {
    category: "鲜肉类",
    baseUnit: "克",
    unitConv: { "克": 1 },
    price: 28
  },
  "毛豆腐": {
    category: "豆制品",
    baseUnit: "克",
    unitConv: { "克": 1 },
    price: 5
  },
  "米粉": {
    category: "主食",
    baseUnit: "克",
    unitConv: { "克": 1 },
    price: 5
  },
  "米饭": {
    category: "主食",
    baseUnit: "克",
    unitConv: { "克": 1, "碗": 150 },
    price: 2
  },
  "面包丁": {
    category: "主食",
    baseUnit: "克",
    unitConv: { "克": 1 },
    price: 8
  },
  "面粉": {
    category: "主食",
    baseUnit: "克",
    unitConv: { "克": 1 },
    price: 3
  },
  "面条": {
    category: "主食",
    baseUnit: "克",
    unitConv: { "克": 1 },
    price: 4
  },
  "馒头": {
    category: "主食",
    baseUnit: "克",
    unitConv: { "克": 1, "个": 80 },
    price: 4
  },
  "木耳": {
    category: "干货",
    baseUnit: "克",
    unitConv: { "克": 1 },
    price: 25
  },
  "牡蛎": {
    category: "鲜肉类",
    baseUnit: "克",
    unitConv: { "克": 1 },
    price: 18
  },
  "牛肚": {
    category: "鲜肉类",
    baseUnit: "克",
    unitConv: { "克": 1 },
    price: 28
  },
  "牛腱子": {
    category: "鲜肉类",
    baseUnit: "克",
    unitConv: { "克": 1 },
    price: 38
  },
  "牛奶": {
    category: "蛋奶",
    baseUnit: "克",
    unitConv: { "克": 1, "毫升": 1 },
    price: 6
  },
  "牛排": {
    category: "鲜肉类",
    baseUnit: "克",
    unitConv: { "克": 1, "块": 200 },
    price: 45
  },
  "牛肉": {
    category: "鲜肉类",
    baseUnit: "克",
    unitConv: { "克": 1 },
    price: 36
  },
  "糯米": {
    category: "主食",
    baseUnit: "克",
    unitConv: { "克": 1 },
    price: 4
  },
  "螃蟹": {
    category: "鲜肉类",
    baseUnit: "克",
    unitConv: { "克": 1, "只": 250 },
    price: 28
  },
  "胖头鱼头": {
    category: "鲜肉类",
    baseUnit: "克",
    unitConv: { "克": 1, "个": 1500 },
    price: 10
  },
  "皮蛋": {
    category: "蛋类",
    baseUnit: "克",
    unitConv: { "克": 1, "个": 60 },
    price: 8
  },
  "苹果": {
    category: "水果",
    baseUnit: "克",
    unitConv: { "克": 1, "个": 200 },
    price: 4
  },
  "蒲菜": {
    category: "蔬菜",
    baseUnit: "克",
    unitConv: { "克": 1 },
    price: 6
  },
  "茄子": {
    category: "蔬菜",
    baseUnit: "克",
    unitConv: { "克": 1, "根": 200 },
    price: 2.5
  },
  "青菜": {
    category: "蔬菜",
    baseUnit: "克",
    unitConv: { "克": 1 },
    price: 3
  },
  "青豆": {
    category: "蔬菜",
    baseUnit: "克",
    unitConv: { "克": 1 },
    price: 5
  },
  "青椒": {
    category: "蔬菜",
    baseUnit: "克",
    unitConv: { "克": 1, "个": 80 },
    price: 3.5
  },
  "三文鱼": {
    category: "鲜肉类",
    baseUnit: "克",
    unitConv: { "克": 1, "块": 200 },
    price: 60
  },
  "山药": {
    category: "根茎类",
    baseUnit: "克",
    unitConv: { "克": 1 },
    price: 5
  },
  "鳝鱼": {
    category: "鲜肉类",
    baseUnit: "克",
    unitConv: { "克": 1 },
    price: 25
  },
  "生菜": {
    category: "蔬菜",
    baseUnit: "克",
    unitConv: { "克": 1 },
    price: 3
  },
  "石斑鱼": {
    category: "鲜肉类",
    baseUnit: "克",
    unitConv: { "克": 1, "条": 800 },
    price: 55
  },
  "熟地": {
    category: "干货",
    baseUnit: "克",
    unitConv: { "克": 1 },
    price: 20
  },
  "四季豆": {
    category: "蔬菜",
    baseUnit: "克",
    unitConv: { "克": 1 },
    price: 4
  },
  "蒜": {
    category: "蔬菜",
    baseUnit: "克",
    unitConv: { "克": 1, "瓣": 5, "头": 60 },
    price: 14
  },
  "蒜苗": {
    category: "蔬菜",
    baseUnit: "克",
    unitConv: { "克": 1 },
    price: 4
  },
  "蒜苔": {
    category: "蔬菜",
    baseUnit: "克",
    unitConv: { "克": 1 },
    price: 5
  },
  "笋干": {
    category: "干货",
    baseUnit: "克",
    unitConv: { "克": 1 },
    price: 28
  },
  "土豆": {
    category: "根茎类",
    baseUnit: "克",
    unitConv: { "克": 1, "个": 200 },
    price: 2
  },
  "吐司": {
    category: "主食",
    baseUnit: "克",
    unitConv: { "克": 1, "片": 30 },
    price: 8
  },
  "西红柿": {
    category: "蔬菜",
    baseUnit: "克",
    unitConv: { "克": 1, "个": 150 },
    price: 3
  },
  "西兰花": {
    category: "蔬菜",
    baseUnit: "克",
    unitConv: { "克": 1, "颗": 350 },
    price: 5
  },
  "细面条": {
    category: "主食",
    baseUnit: "克",
    unitConv: { "克": 1 },
    price: 4
  },
  "虾": {
    category: "鲜肉类",
    baseUnit: "克",
    unitConv: { "克": 1 },
    price: 32
  },
  "虾仁": {
    category: "鲜肉类",
    baseUnit: "克",
    unitConv: { "克": 1 },
    price: 38
  },
  "咸鱼": {
    category: "干货",
    baseUnit: "克",
    unitConv: { "克": 1 },
    price: 18
  },
  "香菜": {
    category: "蔬菜",
    baseUnit: "克",
    unitConv: { "克": 1, "小把": 30 },
    price: 5
  },
  "香菇": {
    category: "干货",
    baseUnit: "克",
    unitConv: { "克": 1, "朵": 10 },
    price: 35
  },
  "香干": {
    category: "豆制品",
    baseUnit: "克",
    unitConv: { "克": 1 },
    price: 5
  },
  "小龙虾": {
    category: "鲜肉类",
    baseUnit: "克",
    unitConv: { "克": 1 },
    price: 22
  },
  "鸭": {
    category: "鲜肉类",
    baseUnit: "克",
    unitConv: { "克": 1, "只": 2000 },
    price: 10
  },
  "鸭血": {
    category: "鲜肉类",
    baseUnit: "克",
    unitConv: { "克": 1 },
    price: 5
  },
  "洋葱": {
    category: "蔬菜",
    baseUnit: "克",
    unitConv: { "克": 1, "个": 250 },
    price: 2
  },
  "椰子": {
    category: "水果",
    baseUnit: "克",
    unitConv: { "克": 1, "个": 1000 },
    price: 5
  },
  "意面": {
    category: "主食",
    baseUnit: "克",
    unitConv: { "克": 1 },
    price: 8
  },
  "油菜": {
    category: "蔬菜",
    baseUnit: "克",
    unitConv: { "克": 1 },
    price: 3
  },
  "油豆腐": {
    category: "豆制品",
    baseUnit: "克",
    unitConv: { "克": 1 },
    price: 6
  },
  "鱿鱼": {
    category: "鲜肉类",
    baseUnit: "克",
    unitConv: { "克": 1 },
    price: 20
  },
  "鱼": {
    category: "鲜肉类",
    baseUnit: "克",
    unitConv: { "克": 1, "条": 600 },
    price: 12
  },
  "鱼肉": {
    category: "鲜肉类",
    baseUnit: "克",
    unitConv: { "克": 1 },
    price: 12
  },
  "玉米": {
    category: "蔬菜",
    baseUnit: "克",
    unitConv: { "克": 1, "根": 300 },
    price: 3
  },
  "芋头": {
    category: "根茎类",
    baseUnit: "克",
    unitConv: { "克": 1 },
    price: 3
  },
  "榛蘑": {
    category: "干货",
    baseUnit: "克",
    unitConv: { "克": 1 },
    price: 45
  },
  "芝士": {
    category: "蛋奶",
    baseUnit: "克",
    unitConv: { "克": 1 },
    price: 30
  },
  "猪大肠": {
    category: "鲜肉类",
    baseUnit: "克",
    unitConv: { "克": 1 },
    price: 10
  },
  "猪大排": {
    category: "鲜肉类",
    baseUnit: "克",
    unitConv: { "克": 1 },
    price: 15
  },
  "猪肝": {
    category: "鲜肉类",
    baseUnit: "克",
    unitConv: { "克": 1 },
    price: 8
  },
  "猪脊骨": {
    category: "鲜肉类",
    baseUnit: "克",
    unitConv: { "克": 1 },
    price: 10
  },
  "猪里脊": {
    category: "鲜肉类",
    baseUnit: "克",
    unitConv: { "克": 1 },
    price: 16
  },
  "猪梅花肉": {
    category: "鲜肉类",
    baseUnit: "克",
    unitConv: { "克": 1 },
    price: 14
  },
  "猪排骨": {
    category: "鲜肉类",
    baseUnit: "克",
    unitConv: { "克": 1 },
    price: 19
  },
  "猪肉": {
    category: "鲜肉类",
    baseUnit: "克",
    unitConv: { "克": 1 },
    price: 13
  },
  "猪肉末": {
    category: "鲜肉类",
    baseUnit: "克",
    unitConv: { "克": 1 },
    price: 11
  },
  "猪蹄": {
    category: "鲜肉类",
    baseUnit: "克",
    unitConv: { "克": 1, "只": 500 },
    price: 13
  },
  "猪五花肉": {
    category: "鲜肉类",
    baseUnit: "克",
    unitConv: { "克": 1 },
    price: 15
  },
  "猪肘子": {
    category: "鲜肉类",
    baseUnit: "克",
    unitConv: { "克": 1, "个": 1200 },
    price: 12
  },
  "紫菜": {
    category: "干货",
    baseUnit: "克",
    unitConv: { "克": 1 },
    price: 25
  },
  "柠檬": {
    category: "水果",
    baseUnit: "克",
    unitConv: { "克": 1, "个": 100 },
    price: 6
  }
};

if (typeof window !== "undefined") {
  window.ingredientUnitDB = ingredientUnitDB;
}
