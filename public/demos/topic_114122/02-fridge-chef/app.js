const KEY = "fridge-chef.v3";
const state = loadState();

const $ = (id) => document.getElementById(id);
const form = $("foodForm");
const fields = ["foodId", "foodName", "foodAmount", "foodUnit", "foodCategory", "foodExpiry", "foodPlace", "foodNote"]
  .reduce((acc, id) => ({ ...acc, [id]: $(id) }), {});

// 同义词与别名：让 AI 匹配更智能
const synonyms = {
  "番茄": ["西红柿", "蕃茄"],
  "鸡蛋": ["蛋"],
  "鸡胸肉": ["鸡胸", "鸡肉"],
  "猪肉": ["五花肉", "瘦肉", "里脊", "排骨", "肉末"],
  "牛肉": ["牛腩", "牛腱"],
  "土豆": ["马铃薯", "洋芋"],
  "青椒": ["尖椒", "辣椒"],
  "豆腐": ["嫩豆腐", "老豆腐"],
  "米饭": ["剩饭", "大米"],
  "面条": ["挂面", "意面", "拉面"],
  "葱": ["葱花", "大葱", "小葱"],
  "蒜": ["大蒜", "蒜头"],
  "姜": ["生姜"],
  "青菜": ["小白菜", "油菜", "蔬菜"],
  "生菜": ["罗马生菜"],
  "蘑菇": ["香菇", "平菇", "菌菇"],
  "牛奶": ["纯牛奶", "鲜奶"],
  "燕麦": ["麦片"],
  "胡萝卜": ["红萝卜"],
  "虾": ["虾仁", "基围虾"],
  "黄瓜": ["青瓜"],
  "西葫芦": ["角瓜", "小瓜"],
  "茄子": ["茄瓜"],
  "豆角": ["四季豆", "长豆角"],
  "酸奶": ["酸牛奶"]
};

// 默认常备调料：这些食材默认视为家里有，匹配时不拖低匹配度，也不加入购物清单
const pantryStaples = ["葱", "姜", "蒜", "生抽", "老抽", "醋", "盐", "糖", "油", "料酒", "蚝油", "胡椒粉", "淀粉", "香油", "鸡精"];

const recipes = [
  { name: "番茄炒蛋", tags: ["快手", "下饭菜"], time: 10, calories: 180, ingredients: ["鸡蛋", "番茄", "葱"],
    amounts: { "鸡蛋": { amount: 2, unit: "个" }, "番茄": { amount: 1, unit: "个" }, "葱": { amount: 1, unit: "根" } },
    steps: ["番茄切块，鸡蛋打散加少许盐。", "热锅倒油，炒熟鸡蛋盛出。", "番茄炒出汁后倒回鸡蛋炒匀。", "撒葱花出锅。"] },
  { name: "番茄鸡蛋拌面", tags: ["快手", "主食"], time: 18, calories: 420, ingredients: ["番茄", "鸡蛋", "面条", "葱"],
    amounts: { "番茄": { amount: 1, unit: "个" }, "鸡蛋": { amount: 2, unit: "个" }, "面条": { amount: 1, unit: "份" }, "葱": { amount: 1, unit: "根" } },
    steps: ["番茄切块，鸡蛋打散。", "鸡蛋炒熟盛出，番茄炒出汁。", "加入鸡蛋和煮好的面条拌匀。", "撒葱花即可。"] },
  { name: "青椒土豆丝", tags: ["快手", "清淡"], time: 15, calories: 150, ingredients: ["土豆", "青椒", "蒜", "醋"],
    amounts: { "土豆": { amount: 1, unit: "个" }, "青椒": { amount: 1, unit: "个" }, "蒜": { amount: 2, unit: "瓣" }, "醋": { amount: 1, unit: "勺" } },
    steps: ["土豆切丝冲洗淀粉。", "热锅下蒜末和土豆丝翻炒。", "加入青椒丝，调味后出锅。", "沿锅边淋少许醋更香。"] },
  { name: "鸡胸肉蔬菜碗", tags: ["高蛋白", "清淡"], time: 25, calories: 380, ingredients: ["鸡胸肉", "生菜", "胡萝卜", "玉米"],
    amounts: { "鸡胸肉": { amount: 150, unit: "克" }, "生菜": { amount: 3, unit: "片" }, "胡萝卜": { amount: 0.5, unit: "根" }, "玉米": { amount: 50, unit: "克" } },
    steps: ["鸡胸肉煎熟切片。", "蔬菜焯水或洗净。", "组合后加入少量酱汁。", "撒黑胡椒调味。"] },
  { name: "剩饭蛋炒饭", tags: ["快手", "主食"], time: 12, calories: 450, ingredients: ["米饭", "鸡蛋", "葱", "胡萝卜"],
    amounts: { "米饭": { amount: 1, unit: "碗" }, "鸡蛋": { amount: 1, unit: "个" }, "葱": { amount: 1, unit: "根" }, "胡萝卜": { amount: 0.5, unit: "根" } },
    steps: ["鸡蛋炒散。", "加入米饭炒松。", "加入配菜和调味翻炒均匀。", "撒葱花出锅。"] },
  { name: "豆腐菌菇汤", tags: ["清淡"], time: 20, calories: 160, ingredients: ["豆腐", "蘑菇", "青菜"],
    amounts: { "豆腐": { amount: 1, unit: "盒" }, "蘑菇": { amount: 100, unit: "克" }, "青菜": { amount: 2, unit: "棵" } },
    steps: ["蘑菇切片，豆腐切块。", "清水煮开后加入食材。", "小火煮 8 分钟后调味。", "滴几滴香油提鲜。"] },
  { name: "牛奶燕麦早餐杯", tags: ["快手"], time: 5, calories: 240, ingredients: ["牛奶", "燕麦", "水果"],
    amounts: { "牛奶": { amount: 1, unit: "盒" }, "燕麦": { amount: 50, unit: "克" }, "水果": { amount: 1, unit: "份" } },
    steps: ["燕麦倒入杯中。", "加入牛奶和水果。", "冷藏或直接食用。"] },
  { name: "土豆炖鸡块", tags: ["主食", "下饭菜"], time: 40, calories: 520, ingredients: ["土豆", "鸡胸肉", "胡萝卜", "姜", "蒜"],
    amounts: { "土豆": { amount: 2, unit: "个" }, "鸡胸肉": { amount: 200, unit: "克" }, "胡萝卜": { amount: 1, unit: "根" }, "姜": { amount: 3, unit: "片" }, "蒜": { amount: 3, unit: "瓣" } },
    steps: ["鸡肉切块焯水。", "姜蒜爆香，翻炒鸡肉。", "加入土豆、胡萝卜和没过食材的水。", "炖 25 分钟至土豆绵软，调味收汁。"] },
  { name: "青椒肉丝", tags: ["下饭菜", "高蛋白"], time: 20, calories: 320, ingredients: ["猪肉", "青椒", "蒜", "生抽"],
    amounts: { "猪肉": { amount: 150, unit: "克" }, "青椒": { amount: 2, unit: "个" }, "蒜": { amount: 2, unit: "瓣" }, "生抽": { amount: 1, unit: "勺" } },
    steps: ["肉切丝，青椒切丝。", "肉丝用生抽腌制 10 分钟。", "热锅炒肉丝至变色盛出。", "炒青椒和蒜末，倒回肉丝炒匀。"] },
  { name: "家常豆腐煲", tags: ["清淡", "下饭菜"], time: 25, calories: 300, ingredients: ["豆腐", "猪肉", "葱", "姜", "蒜"],
    amounts: { "豆腐": { amount: 1, unit: "盒" }, "猪肉": { amount: 80, unit: "克" }, "葱": { amount: 1, unit: "根" }, "姜": { amount: 2, unit: "片" }, "蒜": { amount: 3, unit: "瓣" } },
    steps: ["豆腐切块煎至两面金黄。", "肉末炒香，加入姜蒜。", "放入豆腐和少许水焖煮。", "调味后撒葱花出锅。"] },
  { name: "什锦炒饭", tags: ["快手", "主食"], time: 15, calories: 480, ingredients: ["米饭", "鸡蛋", "胡萝卜", "青椒", "葱"],
    amounts: { "米饭": { amount: 1, unit: "碗" }, "鸡蛋": { amount: 2, unit: "个" }, "胡萝卜": { amount: 0.5, unit: "根" }, "青椒": { amount: 1, unit: "个" }, "葱": { amount: 1, unit: "根" } },
    steps: ["所有配菜切丁。", "鸡蛋炒散盛出。", "依次炒配菜和米饭。", "加入鸡蛋和调味料翻炒均匀。"] },
  { name: "番茄豆腐汤", tags: ["清淡"], time: 18, calories: 180, ingredients: ["番茄", "豆腐", "葱"],
    amounts: { "番茄": { amount: 1, unit: "个" }, "豆腐": { amount: 0.5, unit: "盒" }, "葱": { amount: 1, unit: "根" } },
    steps: ["番茄去皮切块炒出汁。", "加水煮开，放入豆腐块。", "煮 8 分钟，调味撒葱花。"] },
  { name: "鸡蛋灌饼", tags: ["快手", "主食"], time: 12, calories: 360, ingredients: ["鸡蛋", "面粉", "葱"],
    amounts: { "鸡蛋": { amount: 1, unit: "个" }, "面粉": { amount: 100, unit: "克" }, "葱": { amount: 1, unit: "根" } },
    steps: ["面粉加水调成稀糊。", "平底锅摊成薄饼。", "饼半熟时倒入蛋液。", "翻面煎至金黄。"] },
  { name: "蒜香西兰花", tags: ["清淡", "快手"], time: 10, calories: 120, ingredients: ["西兰花", "蒜"],
    amounts: { "西兰花": { amount: 200, unit: "克" }, "蒜": { amount: 3, unit: "瓣" } },
    steps: ["西兰花切小朵焯水。", "蒜末爆香。", "下西兰花快速翻炒。", "加盐调味出锅。"] },
  { name: "胡萝卜鸡蛋饼", tags: ["快手", "主食"], time: 15, calories: 280, ingredients: ["胡萝卜", "鸡蛋", "面粉"],
    amounts: { "胡萝卜": { amount: 0.5, unit: "根" }, "鸡蛋": { amount: 2, unit: "个" }, "面粉": { amount: 80, unit: "克" } },
    steps: ["胡萝卜擦丝，与鸡蛋面粉混合。", "加少许盐调味。", "平底锅摊成小饼。", "两面煎至金黄。"] },
  { name: "鸡胸肉炒蘑菇", tags: ["高蛋白", "清淡"], time: 22, calories: 340, ingredients: ["鸡胸肉", "蘑菇", "蒜"],
    amounts: { "鸡胸肉": { amount: 150, unit: "克" }, "蘑菇": { amount: 150, unit: "克" }, "蒜": { amount: 2, unit: "瓣" } },
    steps: ["鸡胸肉切片腌制。", "蘑菇切片。", "鸡肉炒至变色盛出。", "炒蘑菇和蒜末，倒回鸡肉炒匀。"] },
  { name: "青菜豆腐汤", tags: ["清淡"], time: 15, calories: 140, ingredients: ["青菜", "豆腐", "姜"],
    amounts: { "青菜": { amount: 2, unit: "棵" }, "豆腐": { amount: 0.5, unit: "盒" }, "姜": { amount: 2, unit: "片" } },
    steps: ["豆腐切块。", "水开加姜和豆腐煮 5 分钟。", "加入青菜烫熟。", "调味出锅。"] },
  { name: "牛奶水果燕麦", tags: ["快手"], time: 5, calories: 260, ingredients: ["牛奶", "燕麦", "香蕉"],
    amounts: { "牛奶": { amount: 1, unit: "盒" }, "燕麦": { amount: 50, unit: "克" }, "香蕉": { amount: 1, unit: "根" } },
    steps: ["燕麦加牛奶微波炉加热 1 分钟。", "香蕉切片铺在上面。", "搅拌均匀即可。"] },
  { name: "土豆泥", tags: ["主食", "快手"], time: 20, calories: 220, ingredients: ["土豆", "牛奶"],
    amounts: { "土豆": { amount: 2, unit: "个" }, "牛奶": { amount: 50, unit: "克" } },
    steps: ["土豆去皮切块蒸熟。", "压成泥后加牛奶拌匀。", "加少许盐和黑胡椒调味。"] },
  { name: "番茄土豆炖牛腩", tags: ["下饭菜", "主食"], time: 60, calories: 580, ingredients: ["番茄", "土豆", "牛肉", "姜", "葱"],
    amounts: { "番茄": { amount: 2, unit: "个" }, "土豆": { amount: 1, unit: "个" }, "牛肉": { amount: 200, unit: "克" }, "姜": { amount: 3, unit: "片" }, "葱": { amount: 1, unit: "根" } },
    steps: ["牛肉切块焯水。", "番茄炒出汁，加入牛肉翻炒。", "加水炖煮 40 分钟。", "加入土豆再炖 15 分钟，撒葱花。"] },
  { name: "西兰花炒鸡胸肉", tags: ["高蛋白", "清淡"], time: 20, calories: 320, ingredients: ["西兰花", "鸡胸肉", "蒜"],
    amounts: { "西兰花": { amount: 150, unit: "克" }, "鸡胸肉": { amount: 150, unit: "克" }, "蒜": { amount: 2, unit: "瓣" } },
    steps: ["鸡胸肉切丁腌制。", "西兰花焯水。", "炒鸡胸肉至变色。", "加入西兰花和蒜末炒匀调味。"] },
  { name: "香蕉牛奶昔", tags: ["快手"], time: 3, calories: 200, ingredients: ["香蕉", "牛奶"],
    amounts: { "香蕉": { amount: 1, unit: "根" }, "牛奶": { amount: 1, unit: "盒" } },
    steps: ["香蕉切段。", "与牛奶一起放入搅拌机。", "搅打均匀即可饮用。"] },
  { name: "葱油拌面", tags: ["快手", "主食"], time: 10, calories: 400, ingredients: ["面条", "葱", "生抽"],
    amounts: { "面条": { amount: 1, unit: "份" }, "葱": { amount: 2, unit: "根" }, "生抽": { amount: 2, unit: "勺" } },
    steps: ["面条煮熟过凉水。", "小葱切段炸至焦香。", "加生抽和糖调成酱汁。", "拌匀面条即可。"] },
  { name: "肉末土豆泥", tags: ["主食", "下饭菜"], time: 30, calories: 460, ingredients: ["土豆", "猪肉", "葱", "姜"],
    amounts: { "土豆": { amount: 2, unit: "个" }, "猪肉": { amount: 100, unit: "克" }, "葱": { amount: 1, unit: "根" }, "姜": { amount: 2, unit: "片" } },
    steps: ["土豆蒸熟压泥。", "肉末加姜炒熟调味。", "肉末铺在土豆泥上。", "撒葱花食用。"] },
  { name: "西葫芦炒蛋", tags: ["快手", "清淡"], time: 12, calories: 200, ingredients: ["西葫芦", "鸡蛋", "蒜"],
    amounts: { "西葫芦": { amount: 1, unit: "根" }, "鸡蛋": { amount: 2, unit: "个" }, "蒜": { amount: 2, unit: "瓣" } },
    steps: ["西葫芦切片，鸡蛋打散。", "鸡蛋炒熟盛出。", "蒜末爆香后炒西葫芦。", "倒回鸡蛋炒匀调味。"] },
  { name: "紫菜蛋花汤", tags: ["快手", "清淡"], time: 8, calories: 90, ingredients: ["鸡蛋", "紫菜", "葱"],
    amounts: { "鸡蛋": { amount: 1, unit: "个" }, "紫菜": { amount: 1, unit: "张" }, "葱": { amount: 1, unit: "根" } },
    steps: ["水烧开。", "放入紫菜煮 2 分钟。", "淋入蛋液搅散。", "调味撒葱花出锅。"] },
  { name: "黄瓜炒鸡蛋", tags: ["快手", "清淡"], time: 10, calories: 170, ingredients: ["黄瓜", "鸡蛋", "蒜"],
    amounts: { "黄瓜": { amount: 1, unit: "根" }, "鸡蛋": { amount: 2, unit: "个" }, "蒜": { amount: 2, unit: "瓣" } },
    steps: ["黄瓜切片，鸡蛋打散。", "鸡蛋炒熟盛出。", "炒黄瓜和蒜末。", "倒回鸡蛋炒匀调味。"] },
  { name: "冬瓜排骨汤", tags: ["清淡"], time: 50, calories: 340, ingredients: ["冬瓜", "猪肉", "姜", "葱"],
    amounts: { "冬瓜": { amount: 300, unit: "克" }, "猪肉": { amount: 200, unit: "克" }, "姜": { amount: 3, unit: "片" }, "葱": { amount: 1, unit: "根" } },
    steps: ["排骨焯水洗净。", "加水、姜炖煮 30 分钟。", "加入冬瓜块再煮 15 分钟。", "调味撒葱花。"] },
  { name: "番茄鸡蛋疙瘩汤", tags: ["快手", "主食"], time: 20, calories: 320, ingredients: ["番茄", "鸡蛋", "面粉", "葱"],
    amounts: { "番茄": { amount: 1, unit: "个" }, "鸡蛋": { amount: 1, unit: "个" }, "面粉": { amount: 80, unit: "克" }, "葱": { amount: 1, unit: "根" } },
    steps: ["番茄炒出汁，加水煮开。", "面粉加水搅成小面疙瘩。", "倒入疙瘩煮至浮起。", "淋入蛋液，撒葱花调味。"] },
  { name: "蚝油生菜", tags: ["快手", "清淡"], time: 8, calories: 110, ingredients: ["生菜", "蒜", "蚝油"],
    amounts: { "生菜": { amount: 1, unit: "棵" }, "蒜": { amount: 3, unit: "瓣" }, "蚝油": { amount: 1, unit: "勺" } },
    steps: ["生菜洗净焯水 10 秒捞出。", "蒜末爆香，加蚝油和少许水调成汁。", "淋在生菜上即可。"] },
  { name: "酸辣土豆丝", tags: ["快手", "下饭菜"], time: 12, calories: 160, ingredients: ["土豆", "青椒", "蒜", "醋"],
    amounts: { "土豆": { amount: 1, unit: "个" }, "青椒": { amount: 1, unit: "个" }, "蒜": { amount: 2, unit: "瓣" }, "醋": { amount: 2, unit: "勺" } },
    steps: ["土豆切丝冲洗沥干。", "热锅爆香蒜和干辣椒。", "大火快炒土豆丝。", "加醋和青椒丝炒匀出锅。"] },
  { name: "蒸蛋羹", tags: ["快手", "清淡"], time: 15, calories: 140, ingredients: ["鸡蛋"],
    amounts: { "鸡蛋": { amount: 2, unit: "个" } },
    steps: ["鸡蛋打散，加 1.5 倍温水。", "过筛去泡沫。", "盖保鲜膜蒸 10 分钟。", "淋生抽和香油。"] },
  { name: "玉米排骨汤", tags: ["清淡"], time: 55, calories: 360, ingredients: ["玉米", "猪肉", "姜", "葱"],
    amounts: { "玉米": { amount: 1, unit: "根" }, "猪肉": { amount: 200, unit: "克" }, "姜": { amount: 3, unit: "片" }, "葱": { amount: 1, unit: "根" } },
    steps: ["排骨焯水。", "加姜和水炖煮 35 分钟。", "放入玉米段再煮 15 分钟。", "调味撒葱花。"] },
  { name: "韭菜炒鸡蛋", tags: ["快手", "下饭菜"], time: 10, calories: 190, ingredients: ["韭菜", "鸡蛋"],
    amounts: { "韭菜": { amount: 150, unit: "克" }, "鸡蛋": { amount: 3, unit: "个" } },
    steps: ["韭菜切段，鸡蛋打散。", "鸡蛋炒熟盛出。", "炒韭菜至断生。", "倒回鸡蛋炒匀调味。"] },
  { name: "红烧豆腐", tags: ["下饭菜", "快手"], time: 18, calories: 260, ingredients: ["豆腐", "葱", "姜", "蒜", "生抽"],
    amounts: { "豆腐": { amount: 1, unit: "盒" }, "葱": { amount: 1, unit: "根" }, "姜": { amount: 2, unit: "片" }, "蒜": { amount: 2, unit: "瓣" }, "生抽": { amount: 1, unit: "勺" } },
    steps: ["豆腐切块煎至两面金黄。", "姜蒜爆香，加生抽和少许水。", "放入豆腐焖煮 5 分钟。", "撒葱花出锅。"] },
  { name: "南瓜粥", tags: ["快手", "主食"], time: 25, calories: 220, ingredients: ["南瓜", "大米"],
    amounts: { "南瓜": { amount: 200, unit: "克" }, "大米": { amount: 50, unit: "克" } },
    steps: ["南瓜去皮切块，大米洗净。", "一起入锅加水煮开。", "小火熬至南瓜软烂。", "用勺子压碎拌匀。"] },
  { name: "凉拌黄瓜", tags: ["快手", "清淡"], time: 5, calories: 80, ingredients: ["黄瓜", "蒜", "醋"],
    amounts: { "黄瓜": { amount: 1, unit: "根" }, "蒜": { amount: 2, unit: "瓣" }, "醋": { amount: 1, unit: "勺" } },
    steps: ["黄瓜拍碎切段。", "蒜末、醋、盐、糖调成汁。", "拌匀腌制 5 分钟即可。"] },
  { name: "洋葱炒蛋", tags: ["快手", "下饭菜"], time: 10, calories: 180, ingredients: ["洋葱", "鸡蛋"],
    amounts: { "洋葱": { amount: 0.5, unit: "个" }, "鸡蛋": { amount: 2, unit: "个" } },
    steps: ["洋葱切丝，鸡蛋打散。", "鸡蛋炒熟盛出。", "炒洋葱至变软。", "倒回鸡蛋炒匀调味。"] },
  { name: "香菇滑鸡", tags: ["高蛋白", "下饭菜"], time: 30, calories: 380, ingredients: ["鸡胸肉", "蘑菇", "姜", "葱"],
    amounts: { "鸡胸肉": { amount: 200, unit: "克" }, "蘑菇": { amount: 100, unit: "克" }, "姜": { amount: 2, unit: "片" }, "葱": { amount: 1, unit: "根" } },
    steps: ["鸡肉切块腌制。", "香菇泡发切片。", "鸡肉和香菇一起蒸或焖 20 分钟。", "撒葱花出锅。"] },
  { name: "丝瓜蛋汤", tags: ["快手", "清淡"], time: 12, calories: 120, ingredients: ["丝瓜", "鸡蛋", "葱"],
    amounts: { "丝瓜": { amount: 1, unit: "根" }, "鸡蛋": { amount: 1, unit: "个" }, "葱": { amount: 1, unit: "根" } },
    steps: ["丝瓜去皮切块。", "加水煮开煮 5 分钟。", "淋入蛋液搅散。", "调味撒葱花。"] },
  { name: "西红柿鸡蛋汤面", tags: ["快手", "主食"], time: 15, calories: 380, ingredients: ["番茄", "鸡蛋", "面条", "葱"],
    amounts: { "番茄": { amount: 1, unit: "个" }, "鸡蛋": { amount: 1, unit: "个" }, "面条": { amount: 1, unit: "份" }, "葱": { amount: 1, unit: "根" } },
    steps: ["番茄炒出汁，加水煮开。", "放入面条煮熟。", "淋入蛋液搅散。", "撒葱花调味。"] },
  { name: "清炒时蔬", tags: ["快手", "清淡"], time: 8, calories: 90, ingredients: ["青菜", "蒜"],
    amounts: { "青菜": { amount: 200, unit: "克" }, "蒜": { amount: 2, unit: "瓣" } },
    steps: ["青菜洗净沥干。", "蒜末爆香。", "大火快炒青菜。", "加盐调味出锅。"] },
  { name: "鸡蛋三明治", tags: ["快手"], time: 8, calories: 320, ingredients: ["鸡蛋", "生菜", "番茄", "面包"],
    amounts: { "鸡蛋": { amount: 1, unit: "个" }, "生菜": { amount: 2, unit: "片" }, "番茄": { amount: 0.5, unit: "个" }, "面包": { amount: 2, unit: "片" } },
    steps: ["鸡蛋煮熟切片。", "面包片铺上生菜、番茄、鸡蛋。", "盖上另一片面包。", "对角切开即可。"] },
  { name: "水果酸奶杯", tags: ["快手"], time: 5, calories: 230, ingredients: ["酸奶", "香蕉", "燕麦"],
    amounts: { "酸奶": { amount: 1, unit: "盒" }, "香蕉": { amount: 1, unit: "根" }, "燕麦": { amount: 30, unit: "克" } },
    steps: ["杯底铺一层燕麦。", "倒入酸奶。", "香蕉切片铺在上面。", "可撒少许坚果。"] },
  { name: "糖醋里脊", tags: ["下饭菜"], time: 30, calories: 420, ingredients: ["猪肉", "醋", "糖", "生抽", "淀粉"],
    amounts: { "猪肉": { amount: 200, unit: "克" }, "醋": { amount: 2, unit: "勺" }, "糖": { amount: 1, unit: "勺" }, "生抽": { amount: 1, unit: "勺" }, "淀粉": { amount: 2, unit: "勺" } },
    steps: ["肉切条，用生抽和淀粉腌制。", "炸至金黄捞出。", "糖醋汁煮开，倒入肉条翻炒。", "裹匀酱汁出锅。"] },
  { name: "干煸豆角", tags: ["下饭菜", "快手"], time: 18, calories: 200, ingredients: ["豆角", "蒜", "生抽"],
    amounts: { "豆角": { amount: 200, unit: "克" }, "蒜": { amount: 3, unit: "瓣" }, "生抽": { amount: 1, unit: "勺" } },
    steps: ["豆角掰段，热锅干煸至起皱。", "蒜末爆香。", "倒入豆角翻炒。", "加生抽调味出锅。"] },
  { name: "白灼虾", tags: ["高蛋白", "清淡"], time: 10, calories: 160, ingredients: ["虾", "姜", "葱"],
    amounts: { "虾": { amount: 200, unit: "克" }, "姜": { amount: 3, unit: "片" }, "葱": { amount: 1, unit: "根" } },
    steps: ["水中加姜葱烧开。", "放入虾煮至变红卷曲。", "捞出蘸酱油或姜醋汁。"] },
  { name: "可乐鸡翅", tags: ["下饭菜"], time: 35, calories: 480, ingredients: ["鸡翅", "可乐", "姜", "生抽"],
    amounts: { "鸡翅": { amount: 6, unit: "个" }, "可乐": { amount: 1, unit: "罐" }, "姜": { amount: 3, unit: "片" }, "生抽": { amount: 1, unit: "勺" } },
    steps: ["鸡翅两面划刀，煎至微黄。", "加生抽和姜片翻炒。", "倒入可乐没过鸡翅。", "中火炖至收汁。"] },
  { name: "蒜泥白肉", tags: ["下饭菜", "高蛋白"], time: 25, calories: 360, ingredients: ["猪肉", "蒜", "黄瓜", "醋"],
    amounts: { "猪肉": { amount: 200, unit: "克" }, "蒜": { amount: 5, unit: "瓣" }, "黄瓜": { amount: 0.5, unit: "根" }, "醋": { amount: 1, unit: "勺" } },
    steps: ["猪肉煮熟切片。", "蒜泥加醋、生抽调成蘸汁。", "黄瓜片垫底，摆上肉片。", "淋蘸汁食用。"] },
  { name: "麻婆豆腐", tags: ["下饭菜"], time: 20, calories: 320, ingredients: ["豆腐", "猪肉", "豆瓣酱", "葱", "姜", "蒜"],
    amounts: { "豆腐": { amount: 1, unit: "盒" }, "猪肉": { amount: 50, unit: "克" }, "豆瓣酱": { amount: 1, unit: "勺" }, "葱": { amount: 1, unit: "根" }, "姜": { amount: 2, unit: "片" }, "蒜": { amount: 2, unit: "瓣" } },
    steps: ["豆腐切块焯水。", "肉末炒香，加豆瓣酱、姜蒜炒出红油。", "加少量水和豆腐煮 5 分钟。", "撒花椒粉和葱花出锅。"] },
  { name: "扬州炒饭", tags: ["主食", "快手"], time: 15, calories: 500, ingredients: ["米饭", "鸡蛋", "胡萝卜", "青豆", "葱"],
    amounts: { "米饭": { amount: 1, unit: "碗" }, "鸡蛋": { amount: 2, unit: "个" }, "胡萝卜": { amount: 0.5, unit: "根" }, "青豆": { amount: 30, unit: "克" }, "葱": { amount: 1, unit: "根" } },
    steps: ["配菜切丁，鸡蛋炒散盛出。", "依次炒配菜和米饭。", "加入鸡蛋炒匀。", "撒葱花调味出锅。"] },
  { name: "红烧茄子", tags: ["下饭菜"], time: 20, calories: 280, ingredients: ["茄子", "蒜", "生抽", "糖"],
    amounts: { "茄子": { amount: 2, unit: "个" }, "蒜": { amount: 3, unit: "瓣" }, "生抽": { amount: 2, unit: "勺" }, "糖": { amount: 0.5, unit: "勺" } },
    steps: ["茄子切条，用盐腌出水分。", "蒜末爆香，炒软茄子。", "加生抽、糖和少许水焖煮。", "收汁出锅。"] },
  { name: "清炒虾仁", tags: ["高蛋白", "清淡"], time: 12, calories: 180, ingredients: ["虾", "黄瓜", "姜"],
    amounts: { "虾": { amount: 150, unit: "克" }, "黄瓜": { amount: 0.5, unit: "根" }, "姜": { amount: 2, unit: "片" } },
    steps: ["虾仁去虾线，用姜腌制。", "黄瓜切丁。", "炒虾仁至变色。", "加入黄瓜丁快速炒匀调味。"] },
  { name: "皮蛋瘦肉粥", tags: ["主食", "清淡"], time: 40, calories: 290, ingredients: ["大米", "猪肉", "皮蛋", "姜"],
    amounts: { "大米": { amount: 80, unit: "克" }, "猪肉": { amount: 80, unit: "克" }, "皮蛋": { amount: 1, unit: "个" }, "姜": { amount: 2, unit: "片" } },
    steps: ["大米加水煮成粥。", "肉末加姜末炒熟。", "皮蛋切丁。", "粥煮好后加入肉末和皮蛋，调味。"] },
  { name: "番茄牛腩面", tags: ["主食", "下饭菜"], time: 50, calories: 560, ingredients: ["番茄", "牛肉", "面条", "葱", "姜"],
    amounts: { "番茄": { amount: 2, unit: "个" }, "牛肉": { amount: 150, unit: "克" }, "面条": { amount: 1, unit: "份" }, "葱": { amount: 1, unit: "根" }, "姜": { amount: 3, unit: "片" } },
    steps: ["牛肉焯水后炖 30 分钟。", "番茄炒出汁加入牛肉汤中。", "放入煮好的面条。", "撒葱花出锅。"] }
];

// 模拟 AI 视觉可能识别到的常见食材
const aiDetectableFoods = [
  { name: "鸡蛋", category: "肉蛋奶", unit: "个", amount: 6 },
  { name: "番茄", category: "蔬菜", unit: "个", amount: 3 },
  { name: "土豆", category: "蔬菜", unit: "个", amount: 4 },
  { name: "青椒", category: "蔬菜", unit: "个", amount: 2 },
  { name: "胡萝卜", category: "蔬菜", unit: "根", amount: 2 },
  { name: "鸡胸肉", category: "肉蛋奶", unit: "克", amount: 300 },
  { name: "猪肉", category: "肉蛋奶", unit: "克", amount: 250 },
  { name: "豆腐", category: "肉蛋奶", unit: "盒", amount: 1 },
  { name: "牛奶", category: "肉蛋奶", unit: "盒", amount: 2 },
  { name: "西兰花", category: "蔬菜", unit: "克", amount: 200 },
  { name: "香蕉", category: "水果", unit: "根", amount: 3 },
  { name: "蘑菇", category: "蔬菜", unit: "克", amount: 150 },
  { name: "米饭", category: "主食", unit: "碗", amount: 1 },
  { name: "黄瓜", category: "蔬菜", unit: "根", amount: 2 },
  { name: "茄子", category: "蔬菜", unit: "个", amount: 2 },
  { name: "虾", category: "肉蛋奶", unit: "克", amount: 200 }
];

form.addEventListener("submit", saveFood);
$("cancelEditBtn").addEventListener("click", clearForm);
$("seedBtn").addEventListener("click", seedFoods);
$("matchBtn").addEventListener("click", renderRecipes);
$("planBtn").addEventListener("click", generateMenuPlan);
$("clearShoppingBtn").addEventListener("click", () => { state.shopping = []; persist(); renderShopping(); });
$("searchInput").addEventListener("input", renderInventory);
$("categoryFilter").addEventListener("change", renderInventory);
$("expiryFilter").addEventListener("change", renderInventory);
$("servings").addEventListener("input", renderRecipes);
$("preference").addEventListener("change", renderRecipes);
$("useExpiringFirst").addEventListener("change", renderRecipes);
$("exportBtn").addEventListener("click", exportData);
$("importFile").addEventListener("change", importData);
$("resetBtn").addEventListener("click", resetData);
$("fridgePhoto").addEventListener("change", handlePhotoUpload);
$("modalClose").addEventListener("click", closeModal);

document.querySelectorAll(".quick-chips .chip").forEach((chip) => {
  chip.addEventListener("click", () => {
    fields.foodName.value = chip.dataset.name;
    fields.foodCategory.value = chip.dataset.cat;
    fields.foodUnit.value = chip.dataset.unit;
    fields.foodAmount.value = 1;
    fields.foodName.focus();
  });
});

render();

function loadState() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY));
    if (!raw || typeof raw !== "object") return { foods: [], shopping: [] };
    return {
      foods: Array.isArray(raw.foods) ? raw.foods : [],
      shopping: Array.isArray(raw.shopping) ? raw.shopping : []
    };
  } catch {
    return { foods: [], shopping: [] };
  }
}

function persist() {
  localStorage.setItem(KEY, JSON.stringify(state));
}

function uid() {
  return `food-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function saveFood(event) {
  event.preventDefault();
  const item = {
    id: fields.foodId.value || uid(),
    name: fields.foodName.value.trim(),
    amount: Number(fields.foodAmount.value || 0),
    unit: fields.foodUnit.value.trim() || "份",
    category: fields.foodCategory.value,
    expiry: fields.foodExpiry.value,
    place: fields.foodPlace.value,
    note: fields.foodNote.value.trim()
  };
  const index = state.foods.findIndex((food) => food.id === item.id);
  if (index >= 0) state.foods[index] = item;
  else state.foods.unshift(item);
  clearForm();
  persist();
  render();
}

function clearForm() {
  form.reset();
  fields.foodId.value = "";
  fields.foodAmount.value = 1;
  $("cancelEditBtn").classList.add("hidden");
}

function render() {
  renderInventory();
  renderRecipes();
  renderShopping();
}

function renderInventory() {
  const list = $("inventoryList");
  const foods = filteredFoods();
  $("stockSummary").textContent = `${foods.length} / ${state.foods.length} 项`;
  $("wasteCount").textContent = state.foods.filter((food) => daysUntil(food.expiry) <= 3 && daysUntil(food.expiry) >= 0).length;
  if (!foods.length) {
    list.innerHTML = `<div class="empty">还没有食材。点击上方“示例食材”一键填充，或上传冰箱照片让 AI 识别。</div>`;
    return;
  }
  list.innerHTML = foods.map((food) => {
    const days = daysUntil(food.expiry);
    const klass = days < 0 ? "expired" : days <= 3 ? "soon" : "";
    const expiryText = food.expiry ? (days < 0 ? `已过期 ${Math.abs(days)} 天` : days === 0 ? `今天到期` : `${days} 天后到期`) : "未填写到期";
    return `
      <article class="food-card ${klass}">
        <div>
          <div class="title">${escapeHtml(food.name)} · ${food.amount}${escapeHtml(food.unit)}</div>
          <div class="meta">
            <span>${escapeHtml(food.category)}</span><span>${escapeHtml(food.place)}</span><span>${expiryText}</span><span>${escapeHtml(food.note)}</span>
          </div>
        </div>
        <div class="card-actions">
          <button data-id="${food.id}" data-action="minus" title="减少">−</button>
          <button data-id="${food.id}" data-action="edit" title="编辑">✎</button>
          <button data-id="${food.id}" data-action="delete" title="删除">×</button>
        </div>
      </article>`;
  }).join("");
  list.querySelectorAll("button").forEach((button) => button.addEventListener("click", handleFoodAction));
}

function filteredFoods() {
  const query = $("searchInput").value.trim().toLowerCase();
  const category = $("categoryFilter").value;
  const expiry = $("expiryFilter").value;
  return state.foods.filter((food) => {
    if (query && !`${food.name} ${food.note}`.toLowerCase().includes(query)) return false;
    if (category && food.category !== category) return false;
    const days = daysUntil(food.expiry);
    if (expiry === "soon" && !(days >= 0 && days <= 3)) return false;
    if (expiry === "expired" && !(days < 0)) return false;
    return true;
  });
}

function handleFoodAction(event) {
  const food = state.foods.find((item) => item.id === event.currentTarget.dataset.id);
  if (!food) return;
  const action = event.currentTarget.dataset.action;
  if (action === "edit") {
    Object.entries({
      foodId: food.id,
      foodName: food.name,
      foodAmount: food.amount,
      foodUnit: food.unit,
      foodCategory: food.category,
      foodExpiry: food.expiry,
      foodPlace: food.place,
      foodNote: food.note
    }).forEach(([key, value]) => { fields[key].value = value; });
    $("cancelEditBtn").classList.remove("hidden");
  }
  if (action === "delete" && confirm("删除这个食材？")) {
    state.foods = state.foods.filter((item) => item.id !== food.id);
  }
  if (action === "minus") {
    food.amount = Math.max(0, Number((food.amount - 1).toFixed(1)));
    if (food.amount === 0) state.foods = state.foods.filter((item) => item.id !== food.id);
  }
  persist();
  render();
}

function renderRecipes() {
  $("recipePlan").classList.add("hidden");
  const scored = getScoredRecipes();
  $("recipeSummary").textContent = `${scored.length} 道`;
  const list = $("recipeList");
  if (!scored.length) {
    list.innerHTML = `<div class="empty">没有匹配到菜谱。换一个偏好或补充食材。</div>`;
    return;
  }
  list.innerHTML = scored.map((recipe) => recipeHtml(recipe)).join("");
  list.querySelectorAll("button").forEach((button) => button.addEventListener("click", handleRecipeAction));
}

function getScoredRecipes() {
  const preference = $("preference").value;
  const useExpiringFirst = $("useExpiringFirst").checked;
  const inventory = state.foods;
  return recipes
    .filter((recipe) => !preference || recipe.tags.includes(preference))
    .map((recipe) => {
      const have = [];
      const pantryHave = [];
      const missing = [];
      const short = [];
      let scoredTotal = 0;
      let scoredHave = 0;
      for (const name of recipe.ingredients) {
        if (isPantry(name)) {
          pantryHave.push(name);
          continue;
        }
        scoredTotal++;
        const matched = findFoodInInventory(name, inventory);
        if (matched) {
          have.push(name);
          scoredHave++;
          const need = recipe.amounts[name];
          if (need && matched.amount < need.amount) {
            short.push({ name, have: matched.amount, need: need.amount, unit: need.unit });
          }
        } else {
          missing.push(name);
        }
      }
      const baseScore = scoredTotal > 0 ? scoredHave / scoredTotal : 1;
      const expiringBonus = useExpiringFirst ? have.filter((name) => {
        const food = findFoodInInventory(name, inventory);
        return food && daysUntil(food.expiry) <= 3;
      }).length * 0.08 : 0;
      const score = Math.min(1, baseScore + expiringBonus);
      return { ...recipe, have: [...have, ...pantryHave], missing, short, score };
    })
    .sort((a, b) => b.score - a.score || a.time - b.time);
}

function recipeHtml(recipe) {
  const score = Math.round(recipe.score * 100);
  const servings = Number($("servings").value || 2);
  const missingList = recipe.missing.map((name) => {
    const need = recipe.amounts[name];
    return need ? `${name} ${need.amount * servings}${need.unit}` : name;
  });
  const shortList = recipe.short.map((s) => `${s.name} 差 ${(s.need * servings - s.have).toFixed(1)}${s.unit}`);
  const allMissing = [...missingList, ...shortList];
  return `
    <article class="recipe-card">
      <div>
        <div class="title">${escapeHtml(recipe.name)} · ${recipe.time} 分钟 · ${servings} 人份</div>
        <div class="score"><span style="width:${score}%"></span></div>
        <div class="meta">匹配度 ${score}% · 已有：${recipe.have.map(escapeHtml).join("、") || "无"}</div>
        <div class="tags">${recipe.tags.map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("")}</div>
        <div class="missing">${allMissing.length ? `缺少：${allMissing.map(escapeHtml).join("、")}` : "食材充足，可以开做！"}</div>
      </div>
      <div class="card-actions recipe-actions">
        <button data-name="${escapeHtml(recipe.name)}" data-action="detail" title="查看详情">ℹ</button>
        <button data-name="${escapeHtml(recipe.name)}" data-action="shop" title="缺料加入购物清单">＋</button>
        <button data-name="${escapeHtml(recipe.name)}" data-action="cook" title="做这道菜并扣库存">✓</button>
      </div>
    </article>`;
}

function handleRecipeAction(event) {
  const recipe = getScoredRecipes().find((item) => item.name === event.currentTarget.dataset.name);
  if (!recipe) return;
  const action = event.currentTarget.dataset.action;
  if (action === "detail") {
    openRecipeModal(recipe);
    return;
  }
  if (action === "shop") {
    addToShopping(recipe);
  } else {
    cookRecipe(recipe);
  }
  persist();
  render();
}

function addToShopping(recipe) {
  const servings = Number($("servings").value || 2);
  for (const name of recipe.missing) {
    if (isPantry(name)) continue;
    const need = recipe.amounts[name];
    const existing = state.shopping.find((item) => item.name === name);
    if (existing) {
      existing.amount = Math.max(existing.amount, need ? need.amount * servings : 1);
    } else {
      state.shopping.push({ name, amount: need ? need.amount * servings : 1, unit: need ? need.unit : "份" });
    }
  }
  for (const s of recipe.short) {
    const name = s.name;
    if (isPantry(name)) continue;
    const needAmount = (s.need * servings - s.have);
    const existing = state.shopping.find((item) => item.name === name);
    if (existing) {
      existing.amount = Math.max(existing.amount, needAmount);
    } else {
      state.shopping.push({ name, amount: needAmount, unit: s.unit });
    }
  }
  showToast("已加入购物清单");
}

function cookRecipe(recipe) {
  const servings = Number($("servings").value || 2);
  for (const name of recipe.have) {
    if (isPantry(name)) continue;
    const need = recipe.amounts[name];
    const food = findFoodInInventory(name, state.foods);
    if (food && need) {
      food.amount = Math.max(0, Number((food.amount - need.amount * servings).toFixed(2)));
    }
  }
  state.foods = state.foods.filter((food) => food.amount > 0);
  showToast(`已烹饪：${recipe.name}`);
}

function renderShopping() {
  $("shoppingList").innerHTML = state.shopping.length
    ? state.shopping.map((item, index) => `
        <div class="shopping-item">
          <span>${escapeHtml(item.name)} ${Number(item.amount).toFixed(item.amount % 1 === 0 ? 0 : 1)}${escapeHtml(item.unit || "份")}</span>
          <button data-index="${index}" class="ghost small">移除</button>
        </div>`).join("")
    : `<div class="empty">暂无购物项。</div>`;
  $("shoppingList").querySelectorAll("button").forEach((button) => {
    button.addEventListener("click", () => {
      state.shopping.splice(Number(button.dataset.index), 1);
      persist();
      renderShopping();
    });
  });
}

function generateMenuPlan() {
  const scored = getScoredRecipes().filter((r) => r.score >= 0.5);
  if (scored.length < 2) {
    alert("当前食材太少，无法生成一桌菜单。建议先添加食材。");
    return;
  }
  const preference = $("preference").value;
  let main = scored.find((r) => r.tags.includes("主食")) || scored[0];
  let dishes = scored.filter((r) => r.name !== main.name).slice(0, 2);
  if (preference === "主食" && main.tags.includes("主食")) {
    dishes = scored.filter((r) => r.name !== main.name && !r.tags.includes("主食")).slice(0, 2);
  }
  const plan = [main, ...dishes];
  const totalTime = Math.max(...plan.map((r) => r.time));
  const totalCal = plan.reduce((sum, r) => sum + (r.calories || 0) * Number($("servings").value || 2), 0);

  const planEl = $("recipePlan");
  planEl.classList.remove("hidden");
  planEl.innerHTML = `
    <div class="plan-head">
      <strong>今日菜单推荐</strong>
      <span>约 ${totalTime} 分钟 · ${Math.round(totalCal)} 千卡</span>
      <button id="cookPlanBtn" class="small">全部烹饪（扣库存）</button>
    </div>
    <div class="plan-list">${plan.map((r) => `<span>${escapeHtml(r.name)}</span>`).join(" → ")}</div>
  `;
  $("cookPlanBtn").addEventListener("click", () => {
    plan.forEach((r) => cookRecipe(r));
    persist();
    render();
    planEl.classList.add("hidden");
  });

  const list = $("recipeList");
  list.innerHTML = plan.map((recipe) => recipeHtml(recipe)).join("");
  list.querySelectorAll("button").forEach((button) => button.addEventListener("click", handleRecipeAction));
  $("recipeSummary").textContent = `${plan.length} 道（菜单）`;
}

function openRecipeModal(recipe) {
  const servings = Number($("servings").value || 2);
  const score = Math.round(recipe.score * 100);
  const ingredientRows = recipe.ingredients.map((name) => {
    const need = recipe.amounts[name];
    const food = findFoodInInventory(name, state.foods);
    const haveText = food ? `（库存 ${food.amount}${food.unit}）` : "（无库存）";
    const needText = need ? `${need.amount * servings}${need.unit}` : "";
    return `<li>${escapeHtml(name)} ${needText} ${haveText}</li>`;
  }).join("");
  $("modalBody").innerHTML = `
    <h2>${escapeHtml(recipe.name)}</h2>
    <div class="modal-meta">
      <span>${recipe.time} 分钟</span>
      <span>${servings} 人份</span>
      <span>匹配度 ${score}%</span>
      <span>${recipe.calories * servings} 千卡</span>
    </div>
    <div class="tags">${recipe.tags.map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("")}</div>
    <h3>食材</h3>
    <ul class="modal-ingredients">${ingredientRows}</ul>
    <h3>步骤</h3>
    <ol class="modal-steps">${recipe.steps.map((step) => `<li>${escapeHtml(step)}</li>`).join("")}</ol>
  `;
  $("recipeModal").classList.remove("hidden");
}

function closeModal() {
  $("recipeModal").classList.add("hidden");
}

function handlePhotoUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  const aiResult = $("aiResult");
  aiResult.classList.remove("hidden");
  aiResult.innerHTML = `<div class="ai-loading"><span class="spinner"></span> AI 正在识别冰箱食材...</div>`;

  setTimeout(() => {
    const count = 3 + Math.floor(Math.random() * 4);
    const shuffled = [...aiDetectableFoods].sort(() => 0.5 - Math.random());
    const detected = shuffled.slice(0, count);
    aiResult.innerHTML = `
      <div class="ai-title">识别到 ${detected.length} 种食材</div>
      <div class="ai-chips">${detected.map((f) => `
        <button class="ai-chip" data-name="${escapeHtml(f.name)}" data-cat="${escapeHtml(f.category)}" data-unit="${escapeHtml(f.unit)}" data-amount="${f.amount}">
          ${escapeHtml(f.name)} ${f.amount}${escapeHtml(f.unit)}
        </button>`).join("")}</div>
      <button id="aiAddAll" class="small">全部添加</button>
    `;
    aiResult.querySelectorAll(".ai-chip").forEach((btn) => {
      btn.addEventListener("click", () => addAiFood(btn));
    });
    $("aiAddAll").addEventListener("click", () => {
      aiResult.querySelectorAll(".ai-chip").forEach((btn) => addAiFood(btn));
      aiResult.classList.add("hidden");
    });
  }, 1500);

  event.target.value = "";
}

function addAiFood(btn) {
  const name = btn.dataset.name;
  if (state.foods.some((f) => f.name === name)) {
    btn.classList.add("added");
    btn.textContent = `${name} 已存在`;
    return;
  }
  state.foods.unshift({
    id: uid(),
    name,
    amount: Number(btn.dataset.amount),
    unit: btn.dataset.unit,
    category: btn.dataset.cat,
    expiry: addDays([3, 5, 7][Math.floor(Math.random() * 3)]),
    place: name === "牛奶" || name === "鸡蛋" ? "冷藏" : name === "鸡胸肉" ? "冷冻" : "冷藏",
    note: "AI 识别"
  });
  btn.classList.add("added");
  btn.textContent = `${name} 已添加`;
  persist();
  render();
}

function seedFoods() {
  state.foods = [
    { id: uid(), name: "番茄", amount: 2, unit: "个", category: "蔬菜", expiry: addDays(2), place: "冷藏", note: "优先用" },
    { id: uid(), name: "鸡蛋", amount: 6, unit: "个", category: "肉蛋奶", expiry: addDays(10), place: "冷藏", note: "" },
    { id: uid(), name: "面条", amount: 2, unit: "份", category: "主食", expiry: addDays(60), place: "常温", note: "" },
    { id: uid(), name: "胡萝卜", amount: 1, unit: "根", category: "蔬菜", expiry: addDays(4), place: "冷藏", note: "" },
    { id: uid(), name: "米饭", amount: 1, unit: "碗", category: "主食", expiry: addDays(1), place: "冷藏", note: "剩饭" },
    { id: uid(), name: "鸡胸肉", amount: 300, unit: "克", category: "肉蛋奶", expiry: addDays(3), place: "冷冻", note: "" },
    { id: uid(), name: "土豆", amount: 3, unit: "个", category: "蔬菜", expiry: addDays(5), place: "常温", note: "" },
    { id: uid(), name: "青椒", amount: 2, unit: "个", category: "蔬菜", expiry: addDays(2), place: "冷藏", note: "" }
  ];
  persist();
  render();
}

function isPantry(name) {
  return pantryStaples.some((s) => s === name || name.includes(s) || s.includes(name));
}

function findFoodInInventory(name, inventory) {
  const direct = inventory.find((food) => food.name === name);
  if (direct) return direct;
  const aliasMatch = inventory.find((food) => {
    const aliases = synonyms[name] || [];
    return aliases.includes(food.name) || food.name.includes(name) || name.includes(food.name);
  });
  if (aliasMatch) return aliasMatch;
  return inventory.find((food) => {
    const foodAliases = synonyms[food.name] || [];
    return foodAliases.includes(name);
  });
}

function daysUntil(date) {
  if (!date) return 9999;
  return Math.ceil((new Date(date) - new Date(today())) / 86400000);
}

function today() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function addDays(days) {
  const next = new Date();
  next.setDate(next.getDate() + days);
  return `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}-${String(next.getDate()).padStart(2, "0")}`;
}

function exportData() {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `fridge-chef-${today()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function importData(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result);
      if (!Array.isArray(data.foods)) throw new Error("bad data");
      state.foods = data.foods;
      state.shopping = Array.isArray(data.shopping) ? data.shopping : [];
      persist();
      render();
    } catch {
      alert("导入失败：文件格式不正确。");
    }
  };
  reader.readAsText(file);
  event.target.value = "";
}

function resetData() {
  if (!confirm("确认清空本应用的本地数据？")) return;
  state.foods = [];
  state.shopping = [];
  persist();
  render();
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;"
  })[char]);
}

function showToast(message) {
  let toast = $("toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "toast";
    toast.className = "toast";
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 2200);
}
