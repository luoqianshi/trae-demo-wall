/**
 * ABCFunLearn - 儿童英语学习应用 Web原型
 * 交互逻辑文件 - 包含完整的页面导航、考试逻辑、学习状态管理
 */

/* ===== 内嵌完整单词数据 ===== */
const WORD_DATA = {
  categories: [
    { id: "animals", englishName: "Animals", chineseName: "动物", sortOrder: 1 },
    { id: "poultry", englishName: "Poultry", chineseName: "家禽", sortOrder: 2 },
    { id: "fruits", englishName: "Fruits", chineseName: "水果", sortOrder: 3 },
    { id: "vegetables", englishName: "Vegetables", chineseName: "蔬菜", sortOrder: 4 },
    { id: "vehicles", englishName: "Vehicles", chineseName: "交通工具", sortOrder: 5 },
    { id: "facilities", englishName: "Public Facilities", chineseName: "公共设施", sortOrder: 6 },
    { id: "body_parts", englishName: "Body Parts", chineseName: "身体部位", sortOrder: 7 },
    { id: "family", englishName: "Family Members", chineseName: "家庭成员", sortOrder: 8 },
    { id: "colors", englishName: "Colors", chineseName: "颜色", sortOrder: 9 },
    { id: "numbers", englishName: "Numbers", chineseName: "数字", sortOrder: 10 },
    { id: "kitchen", englishName: "Kitchen", chineseName: "厨房", sortOrder: 11 },
    { id: "bedroom", englishName: "Bedroom", chineseName: "卧室", sortOrder: 12 }
  ],
  words: [
    // ===== 动物 Animals =====
    { id: "animals_cat", categoryId: "animals", englishName: "Cat", chineseName: "猫", phonetic: "/kæt/", exampleSentence: "The cat is sleeping.", exampleSentenceChinese: "猫正在睡觉。", sortOrder: 1 },
    { id: "animals_dog", categoryId: "animals", englishName: "Dog", chineseName: "狗", phonetic: "/dɒɡ/", exampleSentence: "The dog is running.", exampleSentenceChinese: "狗正在跑。", sortOrder: 2 },
    { id: "animals_rabbit", categoryId: "animals", englishName: "Rabbit", chineseName: "兔子", phonetic: "/ˈræbɪt/", exampleSentence: "The rabbit likes carrots.", exampleSentenceChinese: "兔子喜欢胡萝卜。", sortOrder: 3 },
    { id: "animals_elephant", categoryId: "animals", englishName: "Elephant", chineseName: "大象", phonetic: "/ˈelɪfənt/", exampleSentence: "The elephant is very big.", exampleSentenceChinese: "大象非常大。", sortOrder: 4 },
    { id: "animals_lion", categoryId: "animals", englishName: "Lion", chineseName: "狮子", phonetic: "/ˈlaɪən/", exampleSentence: "The lion is the king.", exampleSentenceChinese: "狮子是国王。", sortOrder: 5 },
    { id: "animals_monkey", categoryId: "animals", englishName: "Monkey", chineseName: "猴子", phonetic: "/ˈmʌŋki/", exampleSentence: "The monkey eats bananas.", exampleSentenceChinese: "猴子吃香蕉。", sortOrder: 6 },
    { id: "animals_panda", categoryId: "animals", englishName: "Panda", chineseName: "熊猫", phonetic: "/ˈpændə/", exampleSentence: "The panda eats bamboo.", exampleSentenceChinese: "熊猫吃竹子。", sortOrder: 7 },
    { id: "animals_fish", categoryId: "animals", englishName: "Fish", chineseName: "鱼", phonetic: "/fɪʃ/", exampleSentence: "The fish swims in water.", exampleSentenceChinese: "鱼在水里游。", sortOrder: 8 },
    { id: "animals_bear", categoryId: "animals", englishName: "Bear", chineseName: "熊", phonetic: "/beər/", exampleSentence: "The bear likes honey.", exampleSentenceChinese: "熊喜欢蜂蜜。", sortOrder: 9 },
    { id: "animals_tiger", categoryId: "animals", englishName: "Tiger", chineseName: "老虎", phonetic: "/ˈtaɪɡər/", exampleSentence: "The tiger has stripes.", exampleSentenceChinese: "老虎有条纹。", sortOrder: 10 },

    // ===== 家禽 Poultry =====
    { id: "poultry_chicken", categoryId: "poultry", englishName: "Chicken", chineseName: "鸡", phonetic: "/ˈtʃɪkɪn/", exampleSentence: "The chicken is eating.", exampleSentenceChinese: "鸡正在吃东西。", sortOrder: 1 },
    { id: "poultry_duck", categoryId: "poultry", englishName: "Duck", chineseName: "鸭子", phonetic: "/dʌk/", exampleSentence: "The duck swims in the pond.", exampleSentenceChinese: "鸭子在池塘里游泳。", sortOrder: 2 },
    { id: "poultry_goose", categoryId: "poultry", englishName: "Goose", chineseName: "鹅", phonetic: "/ɡuːs/", exampleSentence: "The goose is very white.", exampleSentenceChinese: "鹅非常白。", sortOrder: 3 },
    { id: "poultry_turkey", categoryId: "poultry", englishName: "Turkey", chineseName: "火鸡", phonetic: "/ˈtɜːrki/", exampleSentence: "The turkey has colorful feathers.", exampleSentenceChinese: "火鸡有彩色的羽毛。", sortOrder: 4 },
    { id: "poultry_rooster", categoryId: "poultry", englishName: "Rooster", chineseName: "公鸡", phonetic: "/ˈruːstər/", exampleSentence: "The rooster crows in the morning.", exampleSentenceChinese: "公鸡在早上打鸣。", sortOrder: 5 },
    { id: "poultry_hen", categoryId: "poultry", englishName: "Hen", chineseName: "母鸡", phonetic: "/hen/", exampleSentence: "The hen lays eggs.", exampleSentenceChinese: "母鸡下蛋。", sortOrder: 6 },
    { id: "poultry_pigeon", categoryId: "poultry", englishName: "Pigeon", chineseName: "鸽子", phonetic: "/ˈpɪdʒɪn/", exampleSentence: "The pigeon can fly high.", exampleSentenceChinese: "鸽子能飞得很高。", sortOrder: 7 },
    { id: "poultry_parrot", categoryId: "poultry", englishName: "Parrot", chineseName: "鹦鹉", phonetic: "/ˈpærət/", exampleSentence: "The parrot can talk.", exampleSentenceChinese: "鹦鹉会说话。", sortOrder: 8 },
    { id: "poultry_swan", categoryId: "poultry", englishName: "Swan", chineseName: "天鹅", phonetic: "/swɒn/", exampleSentence: "The swan is beautiful.", exampleSentenceChinese: "天鹅很美丽。", sortOrder: 9 },
    { id: "poultry_peacock", categoryId: "poultry", englishName: "Peacock", chineseName: "孔雀", phonetic: "/ˈpiːkɒk/", exampleSentence: "The peacock has pretty feathers.", exampleSentenceChinese: "孔雀有漂亮的羽毛。", sortOrder: 10 },

    // ===== 水果 Fruits =====
    { id: "fruits_apple", categoryId: "fruits", englishName: "Apple", chineseName: "苹果", phonetic: "/ˈæpəl/", exampleSentence: "I like to eat an apple.", exampleSentenceChinese: "我喜欢吃苹果。", sortOrder: 1 },
    { id: "fruits_banana", categoryId: "fruits", englishName: "Banana", chineseName: "香蕉", phonetic: "/bəˈnɑːnə/", exampleSentence: "The banana is yellow.", exampleSentenceChinese: "香蕉是黄色的。", sortOrder: 2 },
    { id: "fruits_orange", categoryId: "fruits", englishName: "Orange", chineseName: "橙子", phonetic: "/ˈɒrɪndʒ/", exampleSentence: "The orange is sweet.", exampleSentenceChinese: "橙子很甜。", sortOrder: 3 },
    { id: "fruits_grape", categoryId: "fruits", englishName: "Grape", chineseName: "葡萄", phonetic: "/ɡreɪp/", exampleSentence: "I have some grapes.", exampleSentenceChinese: "我有一些葡萄。", sortOrder: 4 },
    { id: "fruits_watermelon", categoryId: "fruits", englishName: "Watermelon", chineseName: "西瓜", phonetic: "/ˈwɔːtərmelən/", exampleSentence: "The watermelon is big and red.", exampleSentenceChinese: "西瓜又大又红。", sortOrder: 5 },
    { id: "fruits_strawberry", categoryId: "fruits", englishName: "Strawberry", chineseName: "草莓", phonetic: "/ˈstrɔːbəri/", exampleSentence: "The strawberry is red.", exampleSentenceChinese: "草莓是红色的。", sortOrder: 6 },
    { id: "fruits_pear", categoryId: "fruits", englishName: "Pear", chineseName: "梨", phonetic: "/peər/", exampleSentence: "This pear is very juicy.", exampleSentenceChinese: "这个梨很多汁。", sortOrder: 7 },
    { id: "fruits_peach", categoryId: "fruits", englishName: "Peach", chineseName: "桃子", phonetic: "/piːtʃ/", exampleSentence: "The peach is soft and sweet.", exampleSentenceChinese: "桃子又软又甜。", sortOrder: 8 },
    { id: "fruits_mango", categoryId: "fruits", englishName: "Mango", chineseName: "芒果", phonetic: "/ˈmæŋɡəʊ/", exampleSentence: "I love to eat mango.", exampleSentenceChinese: "我喜欢吃芒果。", sortOrder: 9 },
    { id: "fruits_cherry", categoryId: "fruits", englishName: "Cherry", chineseName: "樱桃", phonetic: "/ˈtʃeri/", exampleSentence: "The cherry is small and red.", exampleSentenceChinese: "樱桃又小又红。", sortOrder: 10 },

    // ===== 蔬菜 Vegetables =====
    { id: "vegetables_carrot", categoryId: "vegetables", englishName: "Carrot", chineseName: "胡萝卜", phonetic: "/ˈkærət/", exampleSentence: "The carrot is orange.", exampleSentenceChinese: "胡萝卜是橙色的。", sortOrder: 1 },
    { id: "vegetables_tomato", categoryId: "vegetables", englishName: "Tomato", chineseName: "番茄", phonetic: "/təˈmɑːtəʊ/", exampleSentence: "The tomato is round and red.", exampleSentenceChinese: "番茄又圆又红。", sortOrder: 2 },
    { id: "vegetables_potato", categoryId: "vegetables", englishName: "Potato", chineseName: "土豆", phonetic: "/pəˈteɪtəʊ/", exampleSentence: "I like to eat potato.", exampleSentenceChinese: "我喜欢吃土豆。", sortOrder: 3 },
    { id: "vegetables_corn", categoryId: "vegetables", englishName: "Corn", chineseName: "玉米", phonetic: "/kɔːrn/", exampleSentence: "The corn is yellow.", exampleSentenceChinese: "玉米是黄色的。", sortOrder: 4 },
    { id: "vegetables_cucumber", categoryId: "vegetables", englishName: "Cucumber", chineseName: "黄瓜", phonetic: "/ˈkjuːkʌmbər/", exampleSentence: "The cucumber is long and green.", exampleSentenceChinese: "黄瓜又长又绿。", sortOrder: 5 },
    { id: "vegetables_pumpkin", categoryId: "vegetables", englishName: "Pumpkin", chineseName: "南瓜", phonetic: "/ˈpʌmpkɪn/", exampleSentence: "The pumpkin is very big.", exampleSentenceChinese: "南瓜非常大。", sortOrder: 6 },
    { id: "vegetables_onion", categoryId: "vegetables", englishName: "Onion", chineseName: "洋葱", phonetic: "/ˈʌnjən/", exampleSentence: "The onion makes me cry.", exampleSentenceChinese: "洋葱让我流泪。", sortOrder: 7 },
    { id: "vegetables_cabbage", categoryId: "vegetables", englishName: "Cabbage", chineseName: "卷心菜", phonetic: "/ˈkæbɪdʒ/", exampleSentence: "The cabbage is green.", exampleSentenceChinese: "卷心菜是绿色的。", sortOrder: 8 },
    { id: "vegetables_pepper", categoryId: "vegetables", englishName: "Pepper", chineseName: "辣椒", phonetic: "/ˈpepər/", exampleSentence: "The pepper is red and spicy.", exampleSentenceChinese: "辣椒又红又辣。", sortOrder: 9 },
    { id: "vegetables_mushroom", categoryId: "vegetables", englishName: "Mushroom", chineseName: "蘑菇", phonetic: "/ˈmʌʃruːm/", exampleSentence: "The mushroom looks like an umbrella.", exampleSentenceChinese: "蘑菇看起来像一把伞。", sortOrder: 10 },

    // ===== 交通工具 Vehicles =====
    { id: "vehicles_car", categoryId: "vehicles", englishName: "Car", chineseName: "汽车", phonetic: "/kɑːr/", exampleSentence: "The car is fast.", exampleSentenceChinese: "汽车很快。", sortOrder: 1 },
    { id: "vehicles_bus", categoryId: "vehicles", englishName: "Bus", chineseName: "公共汽车", phonetic: "/bʌs/", exampleSentence: "I go to school by bus.", exampleSentenceChinese: "我坐公共汽车去上学。", sortOrder: 2 },
    { id: "vehicles_train", categoryId: "vehicles", englishName: "Train", chineseName: "火车", phonetic: "/treɪn/", exampleSentence: "The train is very long.", exampleSentenceChinese: "火车非常长。", sortOrder: 3 },
    { id: "vehicles_airplane", categoryId: "vehicles", englishName: "Airplane", chineseName: "飞机", phonetic: "/ˈeərpleɪn/", exampleSentence: "The airplane flies in the sky.", exampleSentenceChinese: "飞机在天上飞。", sortOrder: 4 },
    { id: "vehicles_bicycle", categoryId: "vehicles", englishName: "Bicycle", chineseName: "自行车", phonetic: "/ˈbaɪsɪkəl/", exampleSentence: "I can ride a bicycle.", exampleSentenceChinese: "我会骑自行车。", sortOrder: 5 },
    { id: "vehicles_boat", categoryId: "vehicles", englishName: "Boat", chineseName: "船", phonetic: "/bəʊt/", exampleSentence: "The boat is on the water.", exampleSentenceChinese: "船在水上。", sortOrder: 6 },
    { id: "vehicles_truck", categoryId: "vehicles", englishName: "Truck", chineseName: "卡车", phonetic: "/trʌk/", exampleSentence: "The truck is very big.", exampleSentenceChinese: "卡车非常大。", sortOrder: 7 },
    { id: "vehicles_motorcycle", categoryId: "vehicles", englishName: "Motorcycle", chineseName: "摩托车", phonetic: "/ˈməʊtərsaɪkəl/", exampleSentence: "The motorcycle goes fast.", exampleSentenceChinese: "摩托车跑得很快。", sortOrder: 8 },
    { id: "vehicles_helicopter", categoryId: "vehicles", englishName: "Helicopter", chineseName: "直升机", phonetic: "/ˈhelɪkɒptər/", exampleSentence: "The helicopter flies up high.", exampleSentenceChinese: "直升机飞得很高。", sortOrder: 9 },
    { id: "vehicles_subway", categoryId: "vehicles", englishName: "Subway", chineseName: "地铁", phonetic: "/ˈsʌbweɪ/", exampleSentence: "We take the subway to the park.", exampleSentenceChinese: "我们坐地铁去公园。", sortOrder: 10 },

    // ===== 公共设施 Facilities =====
    { id: "facilities_school", categoryId: "facilities", englishName: "School", chineseName: "学校", phonetic: "/skuːl/", exampleSentence: "I go to school every day.", exampleSentenceChinese: "我每天去学校。", sortOrder: 1 },
    { id: "facilities_hospital", categoryId: "facilities", englishName: "Hospital", chineseName: "医院", phonetic: "/ˈhɒspɪtəl/", exampleSentence: "The doctor works at the hospital.", exampleSentenceChinese: "医生在医院工作。", sortOrder: 2 },
    { id: "facilities_park", categoryId: "facilities", englishName: "Park", chineseName: "公园", phonetic: "/pɑːrk/", exampleSentence: "I play in the park.", exampleSentenceChinese: "我在公园里玩。", sortOrder: 3 },
    { id: "facilities_library", categoryId: "facilities", englishName: "Library", chineseName: "图书馆", phonetic: "/ˈlaɪbrəri/", exampleSentence: "I read books in the library.", exampleSentenceChinese: "我在图书馆看书。", sortOrder: 4 },
    { id: "facilities_supermarket", categoryId: "facilities", englishName: "Supermarket", chineseName: "超市", phonetic: "/ˈsuːpərmɑːrkɪt/", exampleSentence: "Mom goes to the supermarket.", exampleSentenceChinese: "妈妈去超市。", sortOrder: 5 },
    { id: "facilities_zoo", categoryId: "facilities", englishName: "Zoo", chineseName: "动物园", phonetic: "/zuː/", exampleSentence: "I see animals at the zoo.", exampleSentenceChinese: "我在动物园看动物。", sortOrder: 6 },
    { id: "facilities_museum", categoryId: "facilities", englishName: "Museum", chineseName: "博物馆", phonetic: "/mjuːˈziːəm/", exampleSentence: "The museum is very big.", exampleSentenceChinese: "博物馆非常大。", sortOrder: 7 },
    { id: "facilities_playground", categoryId: "facilities", englishName: "Playground", chineseName: "游乐场", phonetic: "/ˈpleɪɡraʊnd/", exampleSentence: "I have fun at the playground.", exampleSentenceChinese: "我在游乐场玩得很开心。", sortOrder: 8 },
    { id: "facilities_station", categoryId: "facilities", englishName: "Station", chineseName: "车站", phonetic: "/ˈsteɪʃən/", exampleSentence: "We wait at the station.", exampleSentenceChinese: "我们在车站等车。", sortOrder: 9 },
    { id: "facilities_cinema", categoryId: "facilities", englishName: "Cinema", chineseName: "电影院", phonetic: "/ˈsɪnəmə/", exampleSentence: "We watch movies at the cinema.", exampleSentenceChinese: "我们在电影院看电影。", sortOrder: 10 },

    // ===== 身体部位 Body Parts =====
    { id: "body_parts_head", categoryId: "body_parts", englishName: "Head", chineseName: "头", phonetic: "/hed/", exampleSentence: "I nod my head.", exampleSentenceChinese: "我点头。", sortOrder: 1 },
    { id: "body_parts_eye", categoryId: "body_parts", englishName: "Eye", chineseName: "眼睛", phonetic: "/aɪ/", exampleSentence: "I see with my eye.", exampleSentenceChinese: "我用眼睛看。", sortOrder: 2 },
    { id: "body_parts_nose", categoryId: "body_parts", englishName: "Nose", chineseName: "鼻子", phonetic: "/nəʊz/", exampleSentence: "I smell with my nose.", exampleSentenceChinese: "我用鼻子闻。", sortOrder: 3 },
    { id: "body_parts_mouth", categoryId: "body_parts", englishName: "Mouth", chineseName: "嘴巴", phonetic: "/maʊθ/", exampleSentence: "I eat with my mouth.", exampleSentenceChinese: "我用嘴巴吃东西。", sortOrder: 4 },
    { id: "body_parts_ear", categoryId: "body_parts", englishName: "Ear", chineseName: "耳朵", phonetic: "/ɪər/", exampleSentence: "I hear with my ear.", exampleSentenceChinese: "我用耳朵听。", sortOrder: 5 },
    { id: "body_parts_hand", categoryId: "body_parts", englishName: "Hand", chineseName: "手", phonetic: "/hænd/", exampleSentence: "I wave my hand.", exampleSentenceChinese: "我挥手。", sortOrder: 6 },
    { id: "body_parts_foot", categoryId: "body_parts", englishName: "Foot", chineseName: "脚", phonetic: "/fʊt/", exampleSentence: "I kick the ball with my foot.", exampleSentenceChinese: "我用脚踢球。", sortOrder: 7 },
    { id: "body_parts_arm", categoryId: "body_parts", englishName: "Arm", chineseName: "手臂", phonetic: "/ɑːrm/", exampleSentence: "I raise my arm.", exampleSentenceChinese: "我举起手臂。", sortOrder: 8 },
    { id: "body_parts_leg", categoryId: "body_parts", englishName: "Leg", chineseName: "腿", phonetic: "/leɡ/", exampleSentence: "I run with my legs.", exampleSentenceChinese: "我用腿跑步。", sortOrder: 9 },
    { id: "body_parts_finger", categoryId: "body_parts", englishName: "Finger", chineseName: "手指", phonetic: "/ˈfɪŋɡər/", exampleSentence: "I have ten fingers.", exampleSentenceChinese: "我有十个手指。", sortOrder: 10 },

    // ===== 家庭成员 Family =====
    { id: "family_mom", categoryId: "family", englishName: "Mom", chineseName: "妈妈", phonetic: "/mɒm/", exampleSentence: "I love my mom.", exampleSentenceChinese: "我爱妈妈。", sortOrder: 1 },
    { id: "family_dad", categoryId: "family", englishName: "Dad", chineseName: "爸爸", phonetic: "/dæd/", exampleSentence: "My dad is tall.", exampleSentenceChinese: "我爸爸很高。", sortOrder: 2 },
    { id: "family_brother", categoryId: "family", englishName: "Brother", chineseName: "哥哥/弟弟", phonetic: "/ˈbrʌðər/", exampleSentence: "My brother plays with me.", exampleSentenceChinese: "我的哥哥和我一起玩。", sortOrder: 3 },
    { id: "family_sister", categoryId: "family", englishName: "Sister", chineseName: "姐姐/妹妹", phonetic: "/ˈsɪstər/", exampleSentence: "My sister is kind.", exampleSentenceChinese: "我的姐姐很善良。", sortOrder: 4 },
    { id: "family_grandma", categoryId: "family", englishName: "Grandma", chineseName: "奶奶/外婆", phonetic: "/ˈɡrænmɑː/", exampleSentence: "Grandma tells me stories.", exampleSentenceChinese: "奶奶给我讲故事。", sortOrder: 5 },
    { id: "family_grandpa", categoryId: "family", englishName: "Grandpa", chineseName: "爷爷/外公", phonetic: "/ˈɡrænpɑː/", exampleSentence: "Grandpa takes me to the park.", exampleSentenceChinese: "爷爷带我去公园。", sortOrder: 6 },
    { id: "family_uncle", categoryId: "family", englishName: "Uncle", chineseName: "叔叔/舅舅", phonetic: "/ˈʌŋkəl/", exampleSentence: "My uncle is funny.", exampleSentenceChinese: "我的叔叔很有趣。", sortOrder: 7 },
    { id: "family_aunt", categoryId: "family", englishName: "Aunt", chineseName: "阿姨/姑姑", phonetic: "/ɑːnt/", exampleSentence: "My aunt gives me candy.", exampleSentenceChinese: "阿姨给我糖果。", sortOrder: 8 },
    { id: "family_baby", categoryId: "family", englishName: "Baby", chineseName: "宝宝", phonetic: "/ˈbeɪbi/", exampleSentence: "The baby is smiling.", exampleSentenceChinese: "宝宝在微笑。", sortOrder: 9 },
    { id: "family_cousin", categoryId: "family", englishName: "Cousin", chineseName: "表兄妹/堂兄妹", phonetic: "/ˈkʌzən/", exampleSentence: "My cousin comes to visit.", exampleSentenceChinese: "我的表兄妹来做客。", sortOrder: 10 },

    // ===== 颜色 Colors =====
    { id: "colors_red", categoryId: "colors", englishName: "Red", chineseName: "红色", phonetic: "/red/", exampleSentence: "The apple is red.", exampleSentenceChinese: "苹果是红色的。", sortOrder: 1 },
    { id: "colors_blue", categoryId: "colors", englishName: "Blue", chineseName: "蓝色", phonetic: "/bluː/", exampleSentence: "The sky is blue.", exampleSentenceChinese: "天空是蓝色的。", sortOrder: 2 },
    { id: "colors_yellow", categoryId: "colors", englishName: "Yellow", chineseName: "黄色", phonetic: "/ˈjeləʊ/", exampleSentence: "The sun is yellow.", exampleSentenceChinese: "太阳是黄色的。", sortOrder: 3 },
    { id: "colors_green", categoryId: "colors", englishName: "Green", chineseName: "绿色", phonetic: "/ɡriːn/", exampleSentence: "The grass is green.", exampleSentenceChinese: "草是绿色的。", sortOrder: 4 },
    { id: "colors_orange", categoryId: "colors", englishName: "Orange", chineseName: "橙色", phonetic: "/ˈɒrɪndʒ/", exampleSentence: "The orange ball is round.", exampleSentenceChinese: "橙色的球是圆的。", sortOrder: 5 },
    { id: "colors_purple", categoryId: "colors", englishName: "Purple", chineseName: "紫色", phonetic: "/ˈpɜːrpəl/", exampleSentence: "The flower is purple.", exampleSentenceChinese: "花是紫色的。", sortOrder: 6 },
    { id: "colors_pink", categoryId: "colors", englishName: "Pink", chineseName: "粉色", phonetic: "/pɪŋk/", exampleSentence: "I like the pink dress.", exampleSentenceChinese: "我喜欢粉色的裙子。", sortOrder: 7 },
    { id: "colors_white", categoryId: "colors", englishName: "White", chineseName: "白色", phonetic: "/waɪt/", exampleSentence: "The snow is white.", exampleSentenceChinese: "雪是白色的。", sortOrder: 8 },
    { id: "colors_black", categoryId: "colors", englishName: "Black", chineseName: "黑色", phonetic: "/blæk/", exampleSentence: "The cat is black.", exampleSentenceChinese: "猫是黑色的。", sortOrder: 9 },
    { id: "colors_brown", categoryId: "colors", englishName: "Brown", chineseName: "棕色", phonetic: "/braʊn/", exampleSentence: "The bear is brown.", exampleSentenceChinese: "熊是棕色的。", sortOrder: 10 },

    // ===== 数字 Numbers =====
    { id: "numbers_one", categoryId: "numbers", englishName: "One", chineseName: "一", phonetic: "/wʌn/", exampleSentence: "I have one apple.", exampleSentenceChinese: "我有一个苹果。", sortOrder: 1 },
    { id: "numbers_two", categoryId: "numbers", englishName: "Two", chineseName: "二", phonetic: "/tuː/", exampleSentence: "I have two hands.", exampleSentenceChinese: "我有两只手。", sortOrder: 2 },
    { id: "numbers_three", categoryId: "numbers", englishName: "Three", chineseName: "三", phonetic: "/θriː/", exampleSentence: "There are three cats.", exampleSentenceChinese: "有三只猫。", sortOrder: 3 },
    { id: "numbers_four", categoryId: "numbers", englishName: "Four", chineseName: "四", phonetic: "/fɔːr/", exampleSentence: "A dog has four legs.", exampleSentenceChinese: "狗有四条腿。", sortOrder: 4 },
    { id: "numbers_five", categoryId: "numbers", englishName: "Five", chineseName: "五", phonetic: "/faɪv/", exampleSentence: "I have five fingers.", exampleSentenceChinese: "我有五个手指。", sortOrder: 5 },
    { id: "numbers_six", categoryId: "numbers", englishName: "Six", chineseName: "六", phonetic: "/sɪks/", exampleSentence: "There are six eggs.", exampleSentenceChinese: "有六个鸡蛋。", sortOrder: 6 },
    { id: "numbers_seven", categoryId: "numbers", englishName: "Seven", chineseName: "七", phonetic: "/ˈsevən/", exampleSentence: "There are seven days in a week.", exampleSentenceChinese: "一周有七天。", sortOrder: 7 },
    { id: "numbers_eight", categoryId: "numbers", englishName: "Eight", chineseName: "八", phonetic: "/eɪt/", exampleSentence: "The spider has eight legs.", exampleSentenceChinese: "蜘蛛有八条腿。", sortOrder: 8 },
    { id: "numbers_nine", categoryId: "numbers", englishName: "Nine", chineseName: "九", phonetic: "/naɪn/", exampleSentence: "I count to nine.", exampleSentenceChinese: "我数到九。", sortOrder: 9 },
    { id: "numbers_ten", categoryId: "numbers", englishName: "Ten", chineseName: "十", phonetic: "/ten/", exampleSentence: "I have ten toes.", exampleSentenceChinese: "我有十个脚趾。", sortOrder: 10 },

    // ===== 厨房 Kitchen =====
    { id: "kitchen_fridge", categoryId: "kitchen", englishName: "Fridge", chineseName: "冰箱", phonetic: "/frɪdʒ/", exampleSentence: "The milk is in the fridge.", exampleSentenceChinese: "牛奶在冰箱里。", sortOrder: 1 },
    { id: "kitchen_stove", categoryId: "kitchen", englishName: "Stove", chineseName: "炉灶", phonetic: "/stəʊv/", exampleSentence: "Mom cooks on the stove.", exampleSentenceChinese: "妈妈在炉灶上做饭。", sortOrder: 2 },
    { id: "kitchen_cup", categoryId: "kitchen", englishName: "Cup", chineseName: "杯子", phonetic: "/kʌp/", exampleSentence: "I drink water from a cup.", exampleSentenceChinese: "我用杯子喝水。", sortOrder: 3 },
    { id: "kitchen_plate", categoryId: "kitchen", englishName: "Plate", chineseName: "盘子", phonetic: "/pleɪt/", exampleSentence: "The food is on the plate.", exampleSentenceChinese: "食物在盘子上。", sortOrder: 4 },
    { id: "kitchen_spoon", categoryId: "kitchen", englishName: "Spoon", chineseName: "勺子", phonetic: "/spuːn/", exampleSentence: "I eat soup with a spoon.", exampleSentenceChinese: "我用勺子喝汤。", sortOrder: 5 },
    { id: "kitchen_fork", categoryId: "kitchen", englishName: "Fork", chineseName: "叉子", phonetic: "/fɔːrk/", exampleSentence: "I use a fork to eat.", exampleSentenceChinese: "我用叉子吃饭。", sortOrder: 6 },
    { id: "kitchen_knife", categoryId: "kitchen", englishName: "Knife", chineseName: "刀", phonetic: "/naɪf/", exampleSentence: "Dad cuts bread with a knife.", exampleSentenceChinese: "爸爸用刀切面包。", sortOrder: 7 },
    { id: "kitchen_bowl", categoryId: "kitchen", englishName: "Bowl", chineseName: "碗", phonetic: "/bəʊl/", exampleSentence: "I have rice in my bowl.", exampleSentenceChinese: "我的碗里有米饭。", sortOrder: 8 },
    { id: "kitchen_pot", categoryId: "kitchen", englishName: "Pot", chineseName: "锅", phonetic: "/pɒt/", exampleSentence: "The soup is in the pot.", exampleSentenceChinese: "汤在锅里。", sortOrder: 9 },
    { id: "kitchen_table", categoryId: "kitchen", englishName: "Table", chineseName: "桌子", phonetic: "/ˈteɪbəl/", exampleSentence: "We eat at the table.", exampleSentenceChinese: "我们在桌子上吃饭。", sortOrder: 10 },

    // ===== 卧室 Bedroom =====
    { id: "bedroom_bed", categoryId: "bedroom", englishName: "Bed", chineseName: "床", phonetic: "/bed/", exampleSentence: "I sleep in my bed.", exampleSentenceChinese: "我在床上睡觉。", sortOrder: 1 },
    { id: "bedroom_pillow", categoryId: "bedroom", englishName: "Pillow", chineseName: "枕头", phonetic: "/ˈpɪləʊ/", exampleSentence: "The pillow is soft.", exampleSentenceChinese: "枕头很柔软。", sortOrder: 2 },
    { id: "bedroom_blanket", categoryId: "bedroom", englishName: "Blanket", chineseName: "毯子", phonetic: "/ˈblæŋkɪt/", exampleSentence: "The blanket keeps me warm.", exampleSentenceChinese: "毯子让我暖和。", sortOrder: 3 },
    { id: "bedroom_lamp", categoryId: "bedroom", englishName: "Lamp", chineseName: "台灯", phonetic: "/læmp/", exampleSentence: "I turn on the lamp at night.", exampleSentenceChinese: "我晚上打开台灯。", sortOrder: 4 },
    { id: "bedroom_clock", categoryId: "bedroom", englishName: "Clock", chineseName: "时钟", phonetic: "/klɒk/", exampleSentence: "The clock shows the time.", exampleSentenceChinese: "时钟显示时间。", sortOrder: 5 },
    { id: "bedroom_mirror", categoryId: "bedroom", englishName: "Mirror", chineseName: "镜子", phonetic: "/ˈmɪrər/", exampleSentence: "I look in the mirror.", exampleSentenceChinese: "我照镜子。", sortOrder: 6 },
    { id: "bedroom_wardrobe", categoryId: "bedroom", englishName: "Wardrobe", chineseName: "衣柜", phonetic: "/ˈwɔːrdrəʊb/", exampleSentence: "My clothes are in the wardrobe.", exampleSentenceChinese: "我的衣服在衣柜里。", sortOrder: 7 },
    { id: "bedroom_window", categoryId: "bedroom", englishName: "Window", chineseName: "窗户", phonetic: "/ˈwɪndəʊ/", exampleSentence: "I open the window.", exampleSentenceChinese: "我打开窗户。", sortOrder: 8 },
    { id: "bedroom_curtain", categoryId: "bedroom", englishName: "Curtain", chineseName: "窗帘", phonetic: "/ˈkɜːrtən/", exampleSentence: "I close the curtain at night.", exampleSentenceChinese: "我晚上拉上窗帘。", sortOrder: 9 },
    { id: "bedroom_toy", categoryId: "bedroom", englishName: "Toy", chineseName: "玩具", phonetic: "/tɔɪ/", exampleSentence: "I play with my toy.", exampleSentenceChinese: "我玩我的玩具。", sortOrder: 10 }
  ]
};

/* ===== 分类emoji映射 ===== */
const CATEGORY_EMOJIS = {
  animals: "🐾", poultry: "🐓", fruits: "🍎", vegetables: "🥦",
  vehicles: "🚗", facilities: "🏫", body_parts: "🦶", family: "👨‍👩‍👧‍👦",
  colors: "🎨", numbers: "🔢", kitchen: "🍳", bedroom: "🛏️"
};

/* ===== 单词emoji映射（用于替代图片） ===== */
const WORD_EMOJIS = {
  // 动物
  animals_cat: "🐱", animals_dog: "🐶", animals_rabbit: "🐰", animals_elephant: "🐘",
  animals_lion: "🦁", animals_monkey: "🐵", animals_panda: "🐼", animals_fish: "🐟",
  animals_bear: "🐻", animals_tiger: "🐯",
  // 家禽
  poultry_chicken: "🐔", poultry_duck: "🦆", poultry_goose: "🦢", poultry_turkey: "🦃",
  poultry_rooster: "🐓", poultry_hen: "🐔", poultry_pigeon: "🐦", poultry_parrot: "🦜",
  poultry_swan: "🦢", poultry_peacock: "🦚",
  // 水果
  fruits_apple: "🍎", fruits_banana: "🍌", fruits_orange: "🍊", fruits_grape: "🍇",
  fruits_watermelon: "🍉", fruits_strawberry: "🍓", fruits_pear: "🍐", fruits_peach: "🍑",
  fruits_mango: "🥭", fruits_cherry: "🍒",
  // 蔬菜
  vegetables_carrot: "🥕", vegetables_tomato: "🍅", vegetables_potato: "🥔", vegetables_corn: "🌽",
  vegetables_cucumber: "🥒", vegetables_pumpkin: "🎃", vegetables_onion: "🧅", vegetables_cabbage: "🥬",
  vegetables_pepper: "🌶️", vegetables_mushroom: "🍄",
  // 交通工具
  vehicles_car: "🚗", vehicles_bus: "🚌", vehicles_train: "🚂", vehicles_airplane: "✈️",
  vehicles_bicycle: "🚲", vehicles_boat: "⛵", vehicles_truck: "🚛", vehicles_motorcycle: "🏍️",
  vehicles_helicopter: "🚁", vehicles_subway: "🚇",
  // 公共设施
  facilities_school: "🏫", facilities_hospital: "🏥", facilities_park: "🌳", facilities_library: "📚",
  facilities_supermarket: "🛒", facilities_zoo: "🦁", facilities_museum: "🏛️", facilities_playground: "🎠",
  facilities_station: "🚉", facilities_cinema: "🎬",
  // 身体部位
  body_parts_head: "🗣️", body_parts_eye: "👁️", body_parts_nose: "👃", body_parts_mouth: "👄",
  body_parts_ear: "👂", body_parts_hand: "✋", body_parts_foot: "🦶", body_parts_arm: "💪",
  body_parts_leg: "🦵", body_parts_finger: "☝️",
  // 家庭成员
  family_mom: "👩", family_dad: "👨", family_brother: "👦", family_sister: "👧",
  family_grandma: "👵", family_grandpa: "👴", family_uncle: "🧑", family_aunt: "👩‍🦰",
  family_baby: "👶", family_cousin: "🧒",
  // 颜色
  colors_red: "🔴", colors_blue: "🔵", colors_yellow: "🟡", colors_green: "🟢",
  colors_orange: "🟠", colors_purple: "🟣", colors_pink: "🩷", colors_white: "⚪",
  colors_black: "⚫", colors_brown: "🟤",
  // 数字
  numbers_one: "1️⃣", numbers_two: "2️⃣", numbers_three: "3️⃣", numbers_four: "4️⃣",
  numbers_five: "5️⃣", numbers_six: "6️⃣", numbers_seven: "7️⃣", numbers_eight: "8️⃣",
  numbers_nine: "9️⃣", numbers_ten: "🔟",
  // 厨房
  kitchen_fridge: "🧊", kitchen_stove: "🔥", kitchen_cup: "☕", kitchen_plate: "🍽️",
  kitchen_spoon: "🥄", kitchen_fork: "🍴", kitchen_knife: "🔪", kitchen_bowl: "🥣",
  kitchen_pot: "🍲", kitchen_table: "🪑",
  // 卧室
  bedroom_bed: "🛏️", bedroom_pillow: "🛋️", bedroom_blanket: "🧣", bedroom_lamp: "💡",
  bedroom_clock: "⏰", bedroom_mirror: "🪞", bedroom_wardrobe: "🚪", bedroom_window: "🪟",
  bedroom_curtain: "🪭", bedroom_toy: "🧸"
};

/* ===== 卡片背景色循环 ===== */
const CARD_BG_COLORS = [
  "var(--orange-light)", "var(--blue-light)", "var(--green-light)", "var(--pink-light)",
  "var(--purple-light)", "var(--yellow-light)"
];

/* ===== 应用状态管理 ===== */
const AppState = {
  /* 从localStorage恢复学习状态，或初始化空状态 */
  learnedWords: JSON.parse(localStorage.getItem("abcfunlearn_learned") || "[]"),
  masteredWords: JSON.parse(localStorage.getItem("abcfunlearn_mastered") || "[]"),

  /* 保存学习状态到localStorage */
  save() {
    localStorage.setItem("abcfunlearn_learned", JSON.stringify(this.learnedWords));
    localStorage.setItem("abcfunlearn_mastered", JSON.stringify(this.masteredWords));
  },

  /* 检查单词是否已学习 */
  isLearned(wordId) {
    return this.learnedWords.includes(wordId);
  },

  /* 检查单词是否已掌握 */
  isMastered(wordId) {
    return this.masteredWords.includes(wordId);
  },

  /* 标记为已学习 */
  markLearned(wordId) {
    if (!this.isLearned(wordId)) {
      this.learnedWords.push(wordId);
      /* 标记学习日期 */
      const dates = JSON.parse(localStorage.getItem("abcfunlearn_learn_dates") || "{}");
      const today = new Date().toISOString().split("T")[0];
      dates[today] = (dates[today] || 0) + 1;
      localStorage.setItem("abcfunlearn_learn_dates", JSON.stringify(dates));
    }
    this.save();
  },

  /* 切换掌握状态 */
  toggleMastered(wordId) {
    if (this.isMastered(wordId)) {
      this.masteredWords = this.masteredWords.filter(id => id !== wordId);
    } else {
      this.masteredWords.push(wordId);
    }
    this.save();
  },

  /* 获取分类的已学单词数 */
  getCategoryLearnedCount(categoryId) {
    const words = WORD_DATA.words.filter(w => w.categoryId === categoryId);
    return words.filter(w => this.isLearned(w.id)).length;
  },

  /* 获取总已学单词数 */
  getTotalLearnedCount() {
    return this.learnedWords.length;
  },

  /* 获取总掌握单词数 */
  getTotalMasteredCount() {
    return this.masteredWords.length;
  },

  /* 获取今日学习数 */
  getTodayLearnedCount() {
    const dates = JSON.parse(localStorage.getItem("abcfunlearn_learn_dates") || "{}");
    const today = new Date().toISOString().split("T")[0];
    return dates[today] || 0;
  },

  /* 获取最近7天学习数据 */
  getLast7DaysData() {
    const dates = JSON.parse(localStorage.getItem("abcfunlearn_learn_dates") || "{}");
    const result = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split("T")[0];
      const weekDays = ["日", "一", "二", "三", "四", "五", "六"];
      result.push({
        label: "周" + weekDays[d.getDay()],
        value: dates[key] || 0
      });
    }
    return result;
  },

  /* 重置所有数据 */
  resetAll() {
    this.learnedWords = [];
    this.masteredWords = [];
    localStorage.removeItem("abcfunlearn_learned");
    localStorage.removeItem("abcfunlearn_mastered");
    localStorage.removeItem("abcfunlearn_learn_dates");
  }
};

/* ===== 页面导航系统 ===== */
const Navigator = {
  /* 页面栈 */
  stack: [],
  screenStack: null,

  /* 初始化 */
  init() {
    this.screenStack = document.getElementById("screen-stack");
    /* 默认显示首页 */
    this.push("home");
  },

  /* 压入新页面 */
  push(screenName, params) {
    const screenEl = document.createElement("div");
    screenEl.className = "screen";
    screenEl.dataset.screen = screenName;
    /* 渲染页面内容 */
    screenEl.innerHTML = Screens.render(screenName, params);
    this.screenStack.appendChild(screenEl);

    /* 将旧页面标记为退出 */
    const prevScreens = this.screenStack.querySelectorAll(".screen.active");
    prevScreens.forEach(s => {
      s.classList.remove("active");
      s.classList.add("exit-left");
    });

    /* 激活新页面（延迟一帧触发动画） */
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        screenEl.classList.add("active");
      });
    });

    this.stack.push({ name: screenName, params, el: screenEl });

    /* 绑定页面事件 */
    Screens.bindEvents(screenName, params, screenEl);
  },

  /* 弹出当前页面 */
  pop() {
    if (this.stack.length <= 1) return;
    const current = this.stack.pop();
    const prev = this.stack[this.stack.length - 1];

    /* 退出动画 */
    current.el.classList.remove("active");
    current.el.style.transform = "translateX(100%)";
    current.el.style.opacity = "0";

    prev.el.classList.remove("exit-left");
    prev.el.classList.add("active");

    /* 动画结束后移除DOM */
    setTimeout(() => {
      if (current.el.parentNode) {
        current.el.parentNode.removeChild(current.el);
      }
    }, 300);
  },

  /* 替换当前页面 */
  replace(screenName, params) {
    this.pop();
    setTimeout(() => this.push(screenName, params), 320);
  },

  /* 刷新当前页面 */
  refreshCurrent() {
    if (this.stack.length === 0) return;
    const current = this.stack[this.stack.length - 1];
    const screenEl = current.el;
    screenEl.innerHTML = Screens.render(current.name, current.params);
    Screens.bindEvents(current.name, current.params, screenEl);
  },

  /* 获取当前页面信息 */
  current() {
    return this.stack.length > 0 ? this.stack[this.stack.length - 1] : null;
  }
};

/* ===== 页面渲染器 ===== */
const Screens = {
  /* 渲染分发 */
  render(name, params) {
    switch (name) {
      case "home": return this.renderHome();
      case "categoryWords": return this.renderCategoryWords(params);
      case "wordCard": return this.renderWordCard(params);
      case "examSetup": return this.renderExamSetup();
      case "exam": return this.renderExam(params);
      case "examResult": return this.renderExamResult(params);
      case "search": return this.renderSearch();
      case "progress": return this.renderProgress();
      case "settings": return this.renderSettings();
      case "statusWords": return this.renderStatusWords(params);
      case "addWord": return this.renderAddWord(params);
      default: return "<div>页面不存在</div>";
    }
  },

  /* 事件绑定分发 */
  bindEvents(name, params, el) {
    switch (name) {
      case "home": this.bindHomeEvents(el); break;
      case "categoryWords": this.bindCategoryWordsEvents(params, el); break;
      case "wordCard": this.bindWordCardEvents(params, el); break;
      case "examSetup": this.bindExamSetupEvents(el); break;
      case "exam": this.bindExamEvents(params, el); break;
      case "examResult": this.bindExamResultEvents(params, el); break;
      case "search": this.bindSearchEvents(el); break;
      case "progress": this.bindProgressEvents(el); break;
      case "settings": this.bindSettingsEvents(el); break;
      case "statusWords": this.bindStatusWordsEvents(params, el); break;
      case "addWord": this.bindAddWordEvents(params, el); break;
    }
  },

  /* ===== 页面1: 首页 ===== */
  renderHome() {
    const totalWords = WORD_DATA.words.length;
    const learnedCount = AppState.getTotalLearnedCount();
    const unlearnedCount = totalWords - learnedCount;

    let categoriesHtml = "";
    WORD_DATA.categories.forEach(cat => {
      const words = WORD_DATA.words.filter(w => w.categoryId === cat.id);
      const learned = words.filter(w => AppState.isLearned(w.id)).length;
      const progress = words.length > 0 ? (learned / words.length * 100) : 0;
      categoriesHtml += `
        <div class="category-card" data-category="${cat.id}">
          <span class="emoji">${CATEGORY_EMOJIS[cat.id] || "📦"}</span>
          <div class="eng-name">${cat.englishName}</div>
          <div class="chn-name">${cat.chineseName}</div>
          <div class="progress-bar-wrap">
            <div class="progress-bar-fill" style="width:${progress}%"></div>
          </div>
          <div class="progress-text">已学 ${learned}/${words.length}</div>
        </div>
      `;
    });

    return `
      <div class="nav-bar">
        <div class="logo">🔤 ABC Fun Learn</div>
        <div class="nav-actions">
          <button class="nav-btn" data-action="progress" title="学习报告">📊</button>
          <button class="nav-btn" data-action="examSetup" title="考试">📝</button>
          <button class="nav-btn" data-action="search" title="搜索">🔍</button>
          <button class="nav-btn" data-action="download" title="下载">☁️</button>
          <button class="nav-btn" data-action="addWordGlobal" title="添加">➕</button>
          <button class="nav-btn" data-action="settings" title="设置">⚙️</button>
        </div>
      </div>
      <div class="screen-content">
        <div class="welcome-text">Hi! 今天想学什么呢？ 👋</div>
        <div class="status-cards">
          <div class="status-card learned" data-action="statusWordsMastered">
            <div class="icon">✅</div>
            <div class="info">
              <div class="label">已掌握</div>
              <div class="count">${learnedCount}</div>
            </div>
          </div>
          <div class="status-card unlearned" data-action="statusWordsUnlearned">
            <div class="icon">📖</div>
            <div class="info">
              <div class="label">未学会</div>
              <div class="count">${unlearnedCount}</div>
            </div>
          </div>
        </div>
        <div class="category-grid">
          ${categoriesHtml}
        </div>
      </div>
    `;
  },

  bindHomeEvents(el) {
    /* 分类卡片点击 */
    el.querySelectorAll(".category-card").forEach(card => {
      card.addEventListener("click", () => {
        Navigator.push("categoryWords", { categoryId: card.dataset.category });
      });
    });

    /* 状态卡片点击 */
    el.querySelector('[data-action="statusWordsMastered"]')?.addEventListener("click", () => {
      Navigator.push("statusWords", { type: "mastered" });
    });
    el.querySelector('[data-action="statusWordsUnlearned"]')?.addEventListener("click", () => {
      Navigator.push("statusWords", { type: "unlearned" });
    });

    /* 导航按钮 */
    el.querySelectorAll(".nav-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const action = btn.dataset.action;
        switch (action) {
          case "progress": Navigator.push("progress"); break;
          case "examSetup": Navigator.push("examSetup"); break;
          case "search": Navigator.push("search"); break;
          case "settings": Navigator.push("settings"); break;
          case "download":
            showToast("离线数据包已是最新版本");
            break;
          case "addWordGlobal":
            Navigator.push("addWord", {});
            break;
        }
      });
    });
  },

  /* ===== 页面2: 分类单词列表 ===== */
  renderCategoryWords(params) {
    const category = WORD_DATA.categories.find(c => c.id === params.categoryId);
    if (!category) return "<div>分类不存在</div>";

    const words = WORD_DATA.words.filter(w => w.categoryId === params.categoryId);
    const learned = words.filter(w => AppState.isLearned(w.id)).length;

    let wordsHtml = "";
    words.forEach((word, idx) => {
      const bg = CARD_BG_COLORS[idx % CARD_BG_COLORS.length];
      const isLearned = AppState.isLearned(word.id);
      const emoji = WORD_EMOJIS[word.id] || "📖";
      wordsHtml += `
        <div class="word-card-item" data-word-id="${word.id}">
          <div class="card-thumb ${isLearned ? "learned-badge" : ""}" style="background:${bg}">
            ${emoji}
          </div>
          <div class="card-info">
            <div class="eng-name">${word.englishName}</div>
            <div class="chn-name">${word.chineseName}</div>
          </div>
        </div>
      `;
    });

    return `
      <div class="sub-nav-bar">
        <button class="back-btn" data-action="back">←</button>
        <div class="title">${category.chineseName}</div>
        <div class="nav-right">
          <span class="progress-pill">${learned}/${words.length}</span>
          <button class="add-btn" data-action="addWord" title="添加单词">+</button>
        </div>
      </div>
      <div class="screen-content">
        <div class="word-grid cols-auto">
          ${wordsHtml}
        </div>
      </div>
    `;
  },

  bindCategoryWordsEvents(params, el) {
    el.querySelector('[data-action="back"]')?.addEventListener("click", () => Navigator.pop());
    el.querySelector('[data-action="addWord"]')?.addEventListener("click", () => {
      Navigator.push("addWord", { categoryId: params.categoryId });
    });

    /* 单词卡片点击 */
    el.querySelectorAll(".word-card-item").forEach(item => {
      item.addEventListener("click", () => {
        const wordId = item.dataset.wordId;
        /* 先标记为已学习 */
        AppState.markLearned(wordId);
        Navigator.push("wordCard", { wordId, categoryId: params.categoryId });
      });
    });
  },

  /* ===== 页面3: 单词卡片 ===== */
  renderWordCard(params) {
    const word = WORD_DATA.words.find(w => w.id === params.wordId);
    if (!word) return "<div>单词不存在</div>";

    const categoryWords = WORD_DATA.words.filter(w => w.categoryId === params.categoryId);
    const currentIndex = categoryWords.findIndex(w => w.id === word.id);
    const total = categoryWords.length;
    const pageNum = currentIndex + 1;
    const isMastered = AppState.isMastered(word.id);
    const emoji = WORD_EMOJIS[word.id] || "📖";

    return `
      <div class="sub-nav-bar">
        <button class="back-btn" data-action="back">←</button>
        <div class="title">${word.englishName}</div>
        <div class="nav-right">
          <span class="progress-pill">${pageNum}/${total}</span>
        </div>
      </div>
      <div class="word-card-screen">
        <div class="word-card-page-info">第 ${pageNum} 个 / 共 ${total} 个</div>
        <div class="word-card-image-area">
          ${emoji}
          ${isMastered ? '<span class="learned-tag">已掌握</span>' : ''}
        </div>
        <div class="word-card-english">${word.englishName}</div>
        <button class="play-btn" data-action="playWord" data-word="${word.englishName}">🔊</button>
        <div class="word-card-phonetic">${word.phonetic}</div>
        <div class="word-card-chinese">${word.chineseName}</div>
        <div class="divider-line"></div>
        <div class="example-card">
          <div class="example-en">
            <button class="example-play-btn" data-action="playSentence" data-text="${word.exampleSentence}">▶</button>
            <span>${word.exampleSentence}</span>
          </div>
          <div class="example-cn">${word.exampleSentenceChinese}</div>
        </div>
        <button class="master-btn ${isMastered ? 'mastered' : 'not-mastered'}" data-action="toggleMaster" data-word-id="${word.id}">
          ${isMastered ? "✅ 已掌握 - 点击取消" : "标记为已掌握"}
        </button>
        <div class="swipe-hint">← 左右滑动或点击箭头切换单词 →</div>
      </div>
      <div class="word-card-arrows">
        <button class="arrow-btn" data-action="prevWord" ${currentIndex <= 0 ? 'disabled style="opacity:0.3"' : ''}>←</button>
        <button class="arrow-btn" data-action="nextWord" ${currentIndex >= total - 1 ? 'disabled style="opacity:0.3"' : ''}>→</button>
      </div>
    `;
  },

  bindWordCardEvents(params, el) {
    el.querySelector('[data-action="back"]')?.addEventListener("click", () => Navigator.pop());

    /* 切换掌握状态 */
    el.querySelector('[data-action="toggleMaster"]')?.addEventListener("click", (e) => {
      const wordId = e.currentTarget.dataset.wordId;
      AppState.toggleMastered(wordId);
      Navigator.refreshCurrent();
    });

    /* 播放单词发音 */
    el.querySelector('[data-action="playWord"]')?.addEventListener("click", (e) => {
      speakText(e.currentTarget.dataset.word);
    });
    el.querySelector('[data-action="playSentence"]')?.addEventListener("click", (e) => {
      speakText(e.currentTarget.dataset.text);
    });

    /* 左右切换 */
    const categoryWords = WORD_DATA.words.filter(w => w.categoryId === params.categoryId);
    const currentIndex = categoryWords.findIndex(w => w.id === params.wordId);

    el.querySelector('[data-action="prevWord"]')?.addEventListener("click", () => {
      if (currentIndex > 0) {
        Navigator.replace("wordCard", { wordId: categoryWords[currentIndex - 1].id, categoryId: params.categoryId });
      }
    });
    el.querySelector('[data-action="nextWord"]')?.addEventListener("click", () => {
      if (currentIndex < categoryWords.length - 1) {
        Navigator.replace("wordCard", { wordId: categoryWords[currentIndex + 1].id, categoryId: params.categoryId });
      }
    });
  },

  /* ===== 页面4: 考试设置 ===== */
  renderExamSetup() {
    const totalLearned = AppState.getTotalLearnedCount();

    let categoryChips = "";
    WORD_DATA.categories.forEach(cat => {
      categoryChips += `
        <div class="exam-category-chip" data-category="${cat.id}">
          <span class="chip-emoji">${CATEGORY_EMOJIS[cat.id] || "📦"}</span>
          <span class="chip-name">${cat.chineseName}</span>
        </div>
      `;
    });

    return `
      <div class="sub-nav-bar">
        <button class="back-btn" data-action="back">←</button>
        <div class="title">考试设置 📝</div>
        <div class="nav-right">
          <button class="download-btn-style" data-action="examHistory">考试历史</button>
        </div>
      </div>
      <div class="screen-content">
        <div class="exam-setup-section">
          <div class="section-title">选择考试范围</div>
          <div class="exam-tab-bar">
            <button class="exam-tab active" data-tab="all">全部已学单词</button>
            <button class="exam-tab" data-tab="category">按分类选择</button>
          </div>
          <div id="exam-category-selector" style="display:none">
            <div class="exam-category-grid">
              ${categoryChips}
            </div>
          </div>
        </div>

        <div class="exam-setup-section">
          <div class="section-title">选择题目数量</div>
          <div class="count-selector">
            <div class="count-card" data-count="5">5</div>
            <div class="count-card active" data-count="10">10</div>
            <div class="count-card" data-count="15">15</div>
            <div class="count-card" data-count="20">20</div>
          </div>
        </div>

        <div class="exam-hint">
          ℹ️ 提示：考试将从已学习的单词中随机出题，包含看图选词、听音选词、看中文选英文等多种题型。
        </div>

        <button class="start-exam-btn" data-action="startExam" ${totalLearned < 4 ? 'disabled' : ''}>
          开始考试
        </button>
        ${totalLearned < 4 ? '<p style="text-align:center;color:var(--text-muted);font-size:13px;margin-top:8px">至少需要学习4个单词才能开始考试</p>' : ''}
      </div>
    `;
  },

  bindExamSetupEvents(el) {
    el.querySelector('[data-action="back"]')?.addEventListener("click", () => Navigator.pop());
    el.querySelector('[data-action="examHistory"]')?.addEventListener("click", () => {
      showToast("考试历史功能演示");
    });

    /* Tab切换 */
    el.querySelectorAll(".exam-tab").forEach(tab => {
      tab.addEventListener("click", () => {
        el.querySelectorAll(".exam-tab").forEach(t => t.classList.remove("active"));
        tab.classList.add("active");
        const selector = el.querySelector("#exam-category-selector");
        selector.style.display = tab.dataset.tab === "category" ? "block" : "none";
      });
    });

    /* 分类选择 */
    el.querySelectorAll(".exam-category-chip").forEach(chip => {
      chip.addEventListener("click", () => {
        chip.classList.toggle("selected");
      });
    });

    /* 数量选择 */
    el.querySelectorAll(".count-card").forEach(card => {
      card.addEventListener("click", () => {
        el.querySelectorAll(".count-card").forEach(c => c.classList.remove("active"));
        card.classList.add("active");
      });
    });

    /* 开始考试 */
    el.querySelector('[data-action="startExam"]')?.addEventListener("click", () => {
      const activeTab = el.querySelector(".exam-tab.active").dataset.tab;
      const count = parseInt(el.querySelector(".count-card.active").dataset.count);

      let sourceWords = [];
      if (activeTab === "all") {
        sourceWords = WORD_DATA.words.filter(w => AppState.isLearned(w.id));
      } else {
        const selectedCats = [];
        el.querySelectorAll(".exam-category-chip.selected").forEach(c => {
          selectedCats.push(c.dataset.category);
        });
        sourceWords = WORD_DATA.words.filter(w =>
          selectedCats.includes(w.categoryId) && AppState.isLearned(w.id)
        );
      }

      if (sourceWords.length < 4) {
        showToast("已学单词不足4个，无法开始考试");
        return;
      }

      /* 生成考试题目 */
      const exam = ExamEngine.generate(sourceWords, count);
      Navigator.push("exam", { exam });
    });
  },

  /* ===== 页面5: 答题页面 ===== */
  renderExam(params) {
    const exam = params.exam;
    if (exam.currentIndex >= exam.questions.length) return "";

    const q = exam.questions[exam.currentIndex];
    const total = exam.questions.length;
    const current = exam.currentIndex + 1;
    const progress = (current / total * 100).toFixed(0);

    /* 题型标签 */
    const typeLabels = {
      "image_to_word": "看图选词",
      "audio_to_word": "听音选词",
      "cn_to_en": "看中文选英文",
      "en_to_cn": "看英文选中文"
    };

    /* 题目内容区 */
    let questionContent = "";
    const emoji = WORD_EMOJIS[q.word.id] || "📖";
    switch (q.type) {
      case "image_to_word":
        questionContent = `<div class="exam-question-emoji">${emoji}</div>`;
        break;
      case "audio_to_word":
        questionContent = `<button class="exam-question-audio" data-action="playQuestion" data-word="${q.word.englishName}">🔊</button>`;
        break;
      case "cn_to_en":
        questionContent = `<div class="exam-question-text">${q.word.chineseName}</div>`;
        break;
      case "en_to_cn":
        questionContent = `<div class="exam-question-text">${q.word.englishName}</div>`;
        break;
    }

    /* 选项 */
    const labels = ["A", "B", "C", "D"];
    const labelClasses = ["label-a", "label-b", "label-c", "label-d"];
    let optionsHtml = "";
    q.options.forEach((opt, idx) => {
      optionsHtml += `
        <div class="exam-option" data-option-idx="${idx}" data-option-id="${opt.id}">
          <span class="option-label ${labelClasses[idx]}">${labels[idx]}</span>
          <span>${opt.text}</span>
        </div>
      `;
    });

    return `
      <div class="sub-nav-bar">
        <button class="close-btn" data-action="closeExam">✕</button>
        <div class="exam-progress-info" style="flex:1">
          <span class="exam-progress-text">第${current}题/共${total}题</span>
          <span class="exam-progress-pill">${current}/${total}</span>
        </div>
      </div>
      <div class="screen-content">
        <div class="exam-progress-bar">
          <div class="exam-progress-fill" style="width:${progress}%"></div>
        </div>
        <div style="text-align:center;margin-top:12px">
          <span class="exam-type-badge">${typeLabels[q.type] || "选择题"}</span>
        </div>
        <div class="exam-question-area">
          ${questionContent}
        </div>
        <div class="exam-options-grid" id="exam-options">
          ${optionsHtml}
        </div>
      </div>
    `;
  },

  bindExamEvents(params, el) {
    el.querySelector('[data-action="closeExam"]')?.addEventListener("click", () => {
      if (confirm("确定要退出考试吗？")) {
        Navigator.pop();
      }
    });

    el.querySelector('[data-action="playQuestion"]')?.addEventListener("click", (e) => {
      speakText(e.currentTarget.dataset.word);
    });

    /* 选项点击 */
    const exam = params.exam;
    const q = exam.questions[exam.currentIndex];
    let answered = false;

    el.querySelectorAll(".exam-option").forEach(opt => {
      opt.addEventListener("click", () => {
        if (answered) return;
        answered = true;

        const selectedId = opt.dataset.optionId;
        const isCorrect = selectedId === q.word.id;

        /* 标记正确选项 */
        el.querySelectorAll(".exam-option").forEach(o => {
          if (o.dataset.optionId === q.word.id) {
            o.classList.add("correct");
          }
          if (o === opt && !isCorrect) {
            o.classList.add("wrong");
          }
          /* 禁用所有选项 */
          o.style.pointerEvents = "none";
        });

        /* 记录结果 */
        exam.answers.push({
          wordId: q.word.id,
          word: q.word,
          type: q.type,
          correct: isCorrect,
          selectedId: selectedId
        });

        /* 自动进入下一题或结果 */
        setTimeout(() => {
          exam.currentIndex++;
          if (exam.currentIndex >= exam.questions.length) {
            Navigator.replace("examResult", { exam });
          } else {
            Navigator.refreshCurrent();
          }
        }, 1500);
      });
    });
  },

  /* ===== 页面6: 考试结果 ===== */
  renderExamResult(params) {
    const exam = params.exam;
    const total = exam.questions.length;
    const correctCount = exam.answers.filter(a => a.correct).length;
    const wrongCount = total - correctCount;
    const percent = Math.round(correctCount / total * 100);

    /* 鼓励语 */
    let emoji = "🎉";
    let message = "太棒了!";
    if (percent < 60) { emoji = "💪"; message = "继续努力!"; }
    else if (percent < 80) { emoji = "🏆"; message = "加油!"; }

    /* 答题详情 */
    let detailHtml = "";
    exam.answers.forEach(a => {
      const word = a.word;
      const wordEmoji = WORD_EMOJIS[word.id] || "📖";
      const statusIcon = a.correct ? "✅" : "❌";
      const selectedWord = WORD_DATA.words.find(w => w.id === a.selectedId);
      const answerInfo = a.correct ? "回答正确" : `正确答案: ${word.englishName}`;
      detailHtml += `
        <div class="result-item">
          <span class="result-icon">${wordEmoji} ${statusIcon}</span>
          <span class="result-word">${word.englishName} (${word.chineseName})</span>
          <span class="result-answer">${answerInfo}</span>
        </div>
      `;
    });

    return `
      <div class="sub-nav-bar">
        <button class="back-btn" data-action="back">←</button>
        <div class="title">考试结果</div>
        <div class="nav-right"></div>
      </div>
      <div class="screen-content">
        <div class="result-score-card fade-in">
          <div class="result-emoji">${emoji}</div>
          <div class="result-message">${message}</div>
          <div class="result-detail">答对 ${correctCount} 题 / 共 ${total} 题</div>
          <div class="result-progress-bar">
            <div class="result-progress-fill" id="result-progress" style="width:0%"></div>
          </div>
        </div>

        <div class="result-summary">
          <span class="summary-title">答题详情</span>
          <span class="result-count-pill correct-pill">答对 ${correctCount}</span>
          <span class="result-count-pill wrong-pill">答错 ${wrongCount}</span>
        </div>

        ${detailHtml}

        <div class="result-actions">
          <button class="btn btn-primary" data-action="retry">再考一次</button>
          <button class="btn btn-secondary" data-action="goHome">返回首页</button>
        </div>
      </div>
    `;
  },

  bindExamResultEvents(params, el) {
    /* 进度条动画 */
    setTimeout(() => {
      const exam = params.exam;
      const correctCount = exam.answers.filter(a => a.correct).length;
      const total = exam.questions.length;
      const percent = Math.round(correctCount / total * 100);
      const bar = el.querySelector("#result-progress");
      if (bar) bar.style.width = percent + "%";
    }, 100);

    el.querySelector('[data-action="back"]')?.addEventListener("click", () => Navigator.pop());
    el.querySelector('[data-action="retry"]')?.addEventListener("click", () => {
      Navigator.pop();
      setTimeout(() => Navigator.push("examSetup"), 320);
    });
    el.querySelector('[data-action="goHome"]')?.addEventListener("click", () => {
      /* 弹出所有页面回到首页 */
      while (Navigator.stack.length > 1) {
        Navigator.stack.pop().el.remove();
      }
      Navigator.refreshCurrent();
    });
  },

  /* ===== 页面7: 搜索页 ===== */
  renderSearch() {
    return `
      <div class="sub-nav-bar">
        <button class="back-btn" data-action="back">←</button>
        <div class="search-input-wrap">
          <span class="search-input-icon">🔍</span>
          <input class="search-input" type="text" placeholder="搜索单词（中文或英文）..." data-action="searchInput" autofocus>
        </div>
      </div>
      <div class="screen-content">
        <div class="search-count" id="search-count">共 ${WORD_DATA.words.length} 个单词</div>
        <div id="search-results"></div>
      </div>
    `;
  },

  bindSearchEvents(el) {
    el.querySelector('[data-action="back"]')?.addEventListener("click", () => Navigator.pop());

    const input = el.querySelector('[data-action="searchInput"]');
    const resultsContainer = el.querySelector("#search-results");
    const countEl = el.querySelector("#search-count");

    /* 渲染搜索结果 */
    function renderResults(query) {
      if (!query || query.trim() === "") {
        countEl.textContent = `共 ${WORD_DATA.words.length} 个单词`;
        resultsContainer.innerHTML = "";
        return;
      }

      const q = query.toLowerCase().trim();
      const results = WORD_DATA.words.filter(w =>
        w.englishName.toLowerCase().includes(q) ||
        w.chineseName.includes(q)
      );

      countEl.textContent = `找到 ${results.length} 个结果`;

      if (results.length === 0) {
        resultsContainer.innerHTML = `
          <div class="empty-state">
            <div class="empty-icon">🔍</div>
            <p>没有找到匹配的单词</p>
          </div>
        `;
        return;
      }

      let html = "";
      results.forEach(word => {
        const emoji = WORD_EMOJIS[word.id] || "📖";
        const isLearned = AppState.isLearned(word.id);
        html += `
          <div class="search-result-item" data-word-id="${word.id}">
            <span class="item-emoji">${emoji}</span>
            ${isLearned ? '<span class="item-learned">✓</span>' : ''}
            <div class="item-info">
              <div class="item-eng">${word.englishName}</div>
              <div class="item-chn">${word.chineseName}</div>
            </div>
            <span class="item-arrow">›</span>
          </div>
        `;
      });
      resultsContainer.innerHTML = html;

      /* 绑定结果点击 */
      resultsContainer.querySelectorAll(".search-result-item").forEach(item => {
        item.addEventListener("click", () => {
          const wordId = item.dataset.wordId;
          const word = WORD_DATA.words.find(w => w.id === wordId);
          if (word) {
            AppState.markLearned(wordId);
            Navigator.push("wordCard", { wordId, categoryId: word.categoryId });
          }
        });
      });
    }

    /* 实时搜索 */
    input.addEventListener("input", (e) => {
      renderResults(e.target.value);
    });

    /* 初始渲染为空 */
    renderResults("");
  },

  /* ===== 页面8: 学习报告 ===== */
  renderProgress() {
    const totalWords = WORD_DATA.words.length;
    const learnedCount = AppState.getTotalLearnedCount();
    const masteredCount = AppState.getTotalMasteredCount();
    const todayCount = AppState.getTodayLearnedCount();
    const percent = totalWords > 0 ? Math.round(learnedCount / totalWords * 100) : 0;

    /* 最近7天数据 */
    const daysData = AppState.getLast7DaysData();
    const maxVal = Math.max(...daysData.map(d => d.value), 1);

    let barsHtml = "";
    daysData.forEach(day => {
      const height = Math.max((day.value / maxVal) * 120, 4);
      barsHtml += `
        <div class="bar-item">
          <div class="bar-value">${day.value}</div>
          <div class="bar" style="height:${height}px"></div>
          <div class="bar-label">${day.label}</div>
        </div>
      `;
    });

    return `
      <div class="sub-nav-bar">
        <button class="back-btn" data-action="back">←</button>
        <div class="title">学习报告</div>
        <div class="nav-right"></div>
      </div>
      <div class="screen-content">
        <div class="report-grid">
          <div class="report-stat-card">
            <div class="stat-icon">📚</div>
            <div class="stat-value">${learnedCount}</div>
            <div class="stat-label">已学习</div>
          </div>
          <div class="report-stat-card">
            <div class="stat-icon">📝</div>
            <div class="stat-value">${totalWords}</div>
            <div class="stat-label">总单词</div>
          </div>
          <div class="report-stat-card">
            <div class="stat-icon">✅</div>
            <div class="stat-value">${percent}%</div>
            <div class="stat-label">完成率</div>
          </div>
          <div class="report-stat-card">
            <div class="stat-icon">🔥</div>
            <div class="stat-value">${todayCount}</div>
            <div class="stat-label">今日学习</div>
          </div>
        </div>

        <div class="report-chart-title">最近7天学习情况</div>
        <div class="report-chart">
          <div class="bar-chart">
            ${barsHtml}
          </div>
        </div>
      </div>
    `;
  },

  bindProgressEvents(el) {
    el.querySelector('[data-action="back"]')?.addEventListener("click", () => Navigator.pop());
  },

  /* ===== 页面9: 设置页 ===== */
  renderSettings() {
    return `
      <div class="sub-nav-bar">
        <button class="back-btn" data-action="back">←</button>
        <div class="title">设置</div>
        <div class="nav-right"></div>
      </div>
      <div class="screen-content">
        <div class="setting-group">
          <div class="setting-item">
            <span class="setting-icon">🌐</span>
            <span class="setting-label">语言</span>
            <span class="setting-value">中文</span>
            <span class="setting-arrow">›</span>
          </div>
          <div class="setting-item">
            <span class="setting-icon">🔔</span>
            <span class="setting-label">每日提醒</span>
            <span class="setting-value">已开启</span>
            <span class="setting-arrow">›</span>
          </div>
          <div class="setting-item">
            <span class="setting-icon">🔊</span>
            <span class="setting-label">自动发音</span>
            <span class="setting-value">已开启</span>
            <span class="setting-arrow">›</span>
          </div>
        </div>
        <div class="setting-group">
          <div class="setting-item">
            <span class="setting-icon">🎨</span>
            <span class="setting-label">主题</span>
            <span class="setting-value">浅色模式</span>
            <span class="setting-arrow">›</span>
          </div>
          <div class="setting-item">
            <span class="setting-icon">📐</span>
            <span class="setting-label">字体大小</span>
            <span class="setting-value">标准</span>
            <span class="setting-arrow">›</span>
          </div>
        </div>
        <div class="setting-group">
          <div class="setting-item">
            <span class="setting-icon">💾</span>
            <span class="setting-label">导出学习数据</span>
            <span class="setting-arrow">›</span>
          </div>
          <div class="setting-item" data-action="resetData">
            <span class="setting-icon">🗑️</span>
            <span class="setting-label" style="color:#FF3B30">重置学习数据</span>
            <span class="setting-arrow">›</span>
          </div>
        </div>
        <div class="setting-group">
          <div class="setting-item">
            <span class="setting-icon">ℹ️</span>
            <span class="setting-label">关于</span>
            <span class="setting-value">v1.0.0</span>
            <span class="setting-arrow">›</span>
          </div>
        </div>
      </div>
    `;
  },

  bindSettingsEvents(el) {
    el.querySelector('[data-action="back"]')?.addEventListener("click", () => Navigator.pop());
    el.querySelector('[data-action="resetData"]')?.addEventListener("click", () => {
      if (confirm("确定要重置所有学习数据吗？此操作不可撤销。")) {
        AppState.resetAll();
        showToast("学习数据已重置");
        Navigator.pop();
        setTimeout(() => Navigator.refreshCurrent(), 350);
      }
    });
  },

  /* ===== 页面10: 已学会/未学会单词列表 ===== */
  renderStatusWords(params) {
    const isMastered = params.type === "mastered";
    const title = isMastered ? "已掌握单词" : "未学会单词";

    let words;
    if (isMastered) {
      words = WORD_DATA.words.filter(w => AppState.isMastered(w.id));
    } else {
      words = WORD_DATA.words.filter(w => !AppState.isLearned(w.id));
    }

    let wordsHtml = "";
    if (words.length === 0) {
      wordsHtml = `
        <div class="empty-state">
          <div class="empty-icon">${isMastered ? "✅" : "📖"}</div>
          <p>${isMastered ? "还没有掌握任何单词，继续加油！" : "所有单词都已学习！"}</p>
        </div>
      `;
    } else {
      wordsHtml = `<div class="word-grid cols-auto">`;
      words.forEach((word, idx) => {
        const bg = CARD_BG_COLORS[idx % CARD_BG_COLORS.length];
        const emoji = WORD_EMOJIS[word.id] || "📖";
        wordsHtml += `
          <div class="word-card-item" data-word-id="${word.id}" data-category="${word.categoryId}">
            <div class="card-thumb" style="background:${bg}">
              ${emoji}
            </div>
            <div class="card-info">
              <div class="eng-name">${word.englishName}</div>
              <div class="chn-name">${word.chineseName}</div>
            </div>
          </div>
        `;
      });
      wordsHtml += "</div>";
    }

    return `
      <div class="sub-nav-bar">
        <button class="back-btn" data-action="back">←</button>
        <div class="title">${title}</div>
        <div class="nav-right">
          <span class="pill purple">${words.length} 个单词</span>
        </div>
      </div>
      <div class="screen-content">
        ${wordsHtml}
      </div>
    `;
  },

  bindStatusWordsEvents(params, el) {
    el.querySelector('[data-action="back"]')?.addEventListener("click", () => Navigator.pop());

    el.querySelectorAll(".word-card-item").forEach(item => {
      item.addEventListener("click", () => {
        const wordId = item.dataset.wordId;
        const categoryId = item.dataset.category;
        if (!AppState.isLearned(wordId)) {
          AppState.markLearned(wordId);
        }
        Navigator.push("wordCard", { wordId, categoryId });
      });
    });
  },

  /* ===== 添加单词页（演示） ===== */
  renderAddWord(params) {
    let categoryOptions = '<option value="">请选择分类</option>';
    WORD_DATA.categories.forEach(cat => {
      const selected = params.categoryId === cat.id ? "selected" : "";
      categoryOptions += `<option value="${cat.id}" ${selected}>${cat.englishName} (${cat.chineseName})</option>`;
    });

    return `
      <div class="sub-nav-bar">
        <button class="back-btn" data-action="back">←</button>
        <div class="title">添加单词</div>
        <div class="nav-right"></div>
      </div>
      <div class="screen-content">
        <div class="add-word-form">
          <div class="form-group">
            <label class="form-label">选择分类</label>
            <select class="form-input" id="add-word-category">
              ${categoryOptions}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">英文单词</label>
            <input class="form-input" type="text" id="add-word-english" placeholder="例如: Apple">
          </div>
          <div class="form-group">
            <label class="form-label">中文释义</label>
            <input class="form-input" type="text" id="add-word-chinese" placeholder="例如: 苹果">
          </div>
          <div class="form-group">
            <label class="form-label">音标（可选）</label>
            <input class="form-input" type="text" id="add-word-phonetic" placeholder="例如: /ˈæpəl/">
          </div>
          <div class="form-group">
            <label class="form-label">例句（可选）</label>
            <input class="form-input" type="text" id="add-word-example" placeholder="例如: I like apples.">
          </div>
          <button class="form-submit-btn" data-action="submitAddWord">保存单词</button>
        </div>
      </div>
    `;
  },

  bindAddWordEvents(params, el) {
    el.querySelector('[data-action="back"]')?.addEventListener("click", () => Navigator.pop());
    el.querySelector('[data-action="submitAddWord"]')?.addEventListener("click", () => {
      const english = el.querySelector("#add-word-english")?.value?.trim();
      const chinese = el.querySelector("#add-word-chinese")?.value?.trim();
      if (!english || !chinese) {
        showToast("请填写英文单词和中文释义");
        return;
      }
      showToast(`单词 "${english}" 已添加成功！（演示模式）`);
      Navigator.pop();
    });
  }
};

/* ===== 考试引擎 ===== */
const ExamEngine = {
  /* 题型定义 */
  questionTypes: ["image_to_word", "audio_to_word", "cn_to_en", "en_to_cn"],

  /* 生成考试 */
  generate(sourceWords, count) {
    /* 从源单词中随机选取 */
    const shuffled = [...sourceWords].sort(() => Math.random() - 0.5);
    const selectedWords = shuffled.slice(0, Math.min(count, shuffled.length));

    /* 获取所有单词作为干扰项 */
    const allLearnedWords = WORD_DATA.words.filter(w => AppState.isLearned(w.id));

    const questions = selectedWords.map(word => {
      /* 随机选择题型 */
      const type = this.questionTypes[Math.floor(Math.random() * this.questionTypes.length)];

      /* 生成3个干扰项 */
      const distractors = allLearnedWords
        .filter(w => w.id !== word.id)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3);

      /* 根据题型生成选项文本 */
      let options = [];
      switch (type) {
        case "image_to_word":
        case "audio_to_word":
          options = [word, ...distractors].sort(() => Math.random() - 0.5)
            .map(w => ({ id: w.id, text: w.englishName }));
          break;
        case "cn_to_en":
          options = [word, ...distractors].sort(() => Math.random() - 0.5)
            .map(w => ({ id: w.id, text: w.englishName }));
          break;
        case "en_to_cn":
          options = [word, ...distractors].sort(() => Math.random() - 0.5)
            .map(w => ({ id: w.id, text: w.chineseName }));
          break;
      }

      return { word, type, options };
    });

    return {
      questions,
      answers: [],
      currentIndex: 0
    };
  }
};

/* ===== 语音合成（使用Web Speech API） ===== */
function speakText(text) {
  if (!("speechSynthesis" in window)) {
    showToast("当前浏览器不支持语音功能");
    return;
  }
  /* 取消之前的语音 */
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-US";
  utterance.rate = 0.8;
  utterance.pitch = 1.1;
  window.speechSynthesis.speak(utterance);
}

/* ===== Toast提示 ===== */
function showToast(msg) {
  const toast = document.getElementById("toast");
  toast.textContent = msg;
  toast.classList.add("show");
  setTimeout(() => {
    toast.classList.remove("show");
  }, 2000);
}

/* ===== 触摸滑动支持（单词卡片页） ===== */
document.addEventListener("touchstart", (e) => {
  const current = Navigator.current();
  if (current && current.name === "wordCard") {
    current._touchStartX = e.touches[0].clientX;
  }
}, { passive: true });

document.addEventListener("touchend", (e) => {
  const current = Navigator.current();
  if (current && current.name === "wordCard" && current._touchStartX !== undefined) {
    const diff = e.changedTouches[0].clientX - current._touchStartX;
    if (Math.abs(diff) > 50) {
      const direction = diff < 0 ? "nextWord" : "prevWord";
      current.el.querySelector(`[data-action="${direction}"]`)?.click();
    }
    delete current._touchStartX;
  }
}, { passive: true });

/* ===== 键盘事件支持 ===== */
document.addEventListener("keydown", (e) => {
  const current = Navigator.current();
  if (!current) return;

  if (current.name === "wordCard") {
    if (e.key === "ArrowLeft") current.el.querySelector('[data-action="prevWord"]')?.click();
    if (e.key === "ArrowRight") current.el.querySelector('[data-action="nextWord"]')?.click();
    if (e.key === "Escape" || e.key === "Backspace") Navigator.pop();
  }
  if (current.name === "exam") {
    if (e.key === "Escape") {
      if (confirm("确定要退出考试吗？")) Navigator.pop();
    }
  }
  if (current.name !== "home" && (e.key === "Escape")) {
    Navigator.pop();
  }
});

/* ===== 应用初始化 ===== */
document.addEventListener("DOMContentLoaded", () => {
  Navigator.init();
});
