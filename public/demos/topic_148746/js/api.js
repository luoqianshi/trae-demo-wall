const API = {
    async getVocabulary() {
        return {
            "units": [
                {
                    "id": "unit1",
                    "name": "第一单元：My Classmates",
                    "words": [
                        {"id": "w1", "word": "classmate", "phonetic": "/ˈklɑːsmeɪt/", "meaning": "同学", "example": "This is my classmate, Li Ming."},
                        {"id": "w2", "word": "friend", "phonetic": "/frend/", "meaning": "朋友", "example": "She is my best friend."},
                        {"id": "w3", "word": "teacher", "phonetic": "/ˈtiːtʃər/", "meaning": "老师", "example": "Our English teacher is very nice."},
                        {"id": "w4", "word": "student", "phonetic": "/ˈstjuːdnt/", "meaning": "学生", "example": "I am a middle school student."},
                        {"id": "w5", "word": "school", "phonetic": "/skuːl/", "meaning": "学校", "example": "I go to school every day."},
                        {"id": "w6", "word": "classroom", "phonetic": "/ˈklɑːsruːm/", "meaning": "教室", "example": "Our classroom is very clean."},
                        {"id": "w7", "word": "desk", "phonetic": "/desk/", "meaning": "书桌", "example": "There is a book on my desk."},
                        {"id": "w8", "word": "chair", "phonetic": "/tʃeər/", "meaning": "椅子", "example": "Please sit on the chair."},
                        {"id": "w9", "word": "blackboard", "phonetic": "/ˈblækbɔːrd/", "meaning": "黑板", "example": "The teacher writes on the blackboard."},
                        {"id": "w10", "word": "notebook", "phonetic": "/ˈnoʊtbʊk/", "meaning": "笔记本", "example": "I write notes in my notebook."}
                    ]
                },
                {
                    "id": "unit2",
                    "name": "第二单元：Family",
                    "words": [
                        {"id": "w11", "word": "family", "phonetic": "/ˈfæməli/", "meaning": "家庭", "example": "I have a happy family."},
                        {"id": "w12", "word": "father", "phonetic": "/ˈfɑːðər/", "meaning": "父亲", "example": "My father is a doctor."},
                        {"id": "w13", "word": "mother", "phonetic": "/ˈmʌðər/", "meaning": "母亲", "example": "My mother is a teacher."},
                        {"id": "w14", "word": "brother", "phonetic": "/ˈbrʌðər/", "meaning": "兄弟", "example": "I have a little brother."},
                        {"id": "w15", "word": "sister", "phonetic": "/ˈsɪstər/", "meaning": "姐妹", "example": "My sister is very cute."},
                        {"id": "w16", "word": "grandfather", "phonetic": "/ˈɡrænfɑːðər/", "meaning": "祖父", "example": "My grandfather likes reading."},
                        {"id": "w17", "word": "grandmother", "phonetic": "/ˈɡrænmʌðər/", "meaning": "祖母", "example": "My grandmother cooks well."},
                        {"id": "w18", "word": "parents", "phonetic": "/ˈperənts/", "meaning": "父母", "example": "My parents love me very much."},
                        {"id": "w19", "word": "uncle", "phonetic": "/ˈʌŋkl/", "meaning": "叔叔", "example": "My uncle is a driver."},
                        {"id": "w20", "word": "aunt", "phonetic": "/ɑːnt/", "meaning": "阿姨", "example": "My aunt works in a hospital."}
                    ]
                },
                {
                    "id": "unit3",
                    "name": "第三单元：School Subjects",
                    "words": [
                        {"id": "w21", "word": "subject", "phonetic": "/ˈsʌbdʒekt/", "meaning": "科目", "example": "What is your favorite subject?"},
                        {"id": "w22", "word": "math", "phonetic": "/mæθ/", "meaning": "数学", "example": "I like math very much."},
                        {"id": "w23", "word": "English", "phonetic": "/ˈɪŋɡlɪʃ/", "meaning": "英语", "example": "English is my favorite subject."},
                        {"id": "w24", "word": "Chinese", "phonetic": "/tʃaɪˈniːz/", "meaning": "语文", "example": "We have Chinese class every day."},
                        {"id": "w25", "word": "science", "phonetic": "/ˈsaɪəns/", "meaning": "科学", "example": "Science is very interesting."},
                        {"id": "w26", "word": "history", "phonetic": "/ˈhɪstri/", "meaning": "历史", "example": "I like learning about history."},
                        {"id": "w27", "word": "geography", "phonetic": "/dʒiˈɒɡrəfi/", "meaning": "地理", "example": "Geography helps us know the world."},
                        {"id": "w28", "word": "music", "phonetic": "/ˈmjuːzɪk/", "meaning": "音乐", "example": "I can play the piano."},
                        {"id": "w29", "word": "art", "phonetic": "/ɑːrt/", "meaning": "美术", "example": "I like drawing pictures."},
                        {"id": "w30", "word": "PE", "phonetic": "/ˌpiː ˈiː/", "meaning": "体育", "example": "We have PE class twice a week."}
                    ]
                },
                {
                    "id": "unit4",
                    "name": "第四单元：Daily Activities",
                    "words": [
                        {"id": "w31", "word": "get up", "phonetic": "/ɡet ʌp/", "meaning": "起床", "example": "I get up at 7 o'clock."},
                        {"id": "w32", "word": "go to school", "phonetic": "/ɡoʊ tuː skuːl/", "meaning": "去上学", "example": "I go to school by bus."},
                        {"id": "w33", "word": "have breakfast", "phonetic": "/hæv ˈbrekfəst/", "meaning": "吃早餐", "example": "I have breakfast at home."},
                        {"id": "w34", "word": "do homework", "phonetic": "/duː ˈhoʊmwɜːrk/", "meaning": "做作业", "example": "I do homework after school."},
                        {"id": "w35", "word": "go to bed", "phonetic": "/ɡoʊ tuː bed/", "meaning": "睡觉", "example": "I go to bed at 9 o'clock."},
                        {"id": "w36", "word": "brush teeth", "phonetic": "/brʌʃ tiːθ/", "meaning": "刷牙", "example": "I brush my teeth twice a day."},
                        {"id": "w37", "word": "wash face", "phonetic": "/wɒʃ feɪs/", "meaning": "洗脸", "example": "I wash my face every morning."},
                        {"id": "w38", "word": "have lunch", "phonetic": "/hæv lʌntʃ/", "meaning": "吃午饭", "example": "I have lunch at school."},
                        {"id": "w39", "word": "have dinner", "phonetic": "/hæv ˈdɪnər/", "meaning": "吃晚饭", "example": "We have dinner together."},
                        {"id": "w40", "word": "watch TV", "phonetic": "/wɒtʃ ˈtiː ˈviː/", "meaning": "看电视", "example": "I watch TV for an hour."}
                    ]
                },
                {
                    "id": "unit5",
                    "name": "第五单元：Food",
                    "words": [
                        {"id": "w41", "word": "food", "phonetic": "/fuːd/", "meaning": "食物", "example": "I like Chinese food."},
                        {"id": "w42", "word": "rice", "phonetic": "/raɪs/", "meaning": "米饭", "example": "I eat rice every day."},
                        {"id": "w43", "word": "noodles", "phonetic": "/ˈnuːdlz/", "meaning": "面条", "example": "I like beef noodles."},
                        {"id": "w44", "word": "vegetable", "phonetic": "/ˈvedʒtəbl/", "meaning": "蔬菜", "example": "Eat more vegetables."},
                        {"id": "w45", "word": "fruit", "phonetic": "/fruːt/", "meaning": "水果", "example": "I like apples and bananas."},
                        {"id": "w46", "word": "bread", "phonetic": "/bred/", "meaning": "面包", "example": "I have bread for breakfast."},
                        {"id": "w47", "word": "milk", "phonetic": "/mɪlk/", "meaning": "牛奶", "example": "Drink milk every day."},
                        {"id": "w48", "word": "egg", "phonetic": "/eɡ/", "meaning": "鸡蛋", "example": "An egg a day keeps the doctor away."},
                        {"id": "w49", "word": "meat", "phonetic": "/miːt/", "meaning": "肉", "example": "I like eating meat."},
                        {"id": "w50", "word": "fish", "phonetic": "/fɪʃ/", "meaning": "鱼", "example": "Fish is good for health."}
                    ]
                },
                {
                    "id": "unit6",
                    "name": "第六单元：Animals",
                    "words": [
                        {"id": "w51", "word": "animal", "phonetic": "/ˈænɪml/", "meaning": "动物", "example": "I like animals very much."},
                        {"id": "w52", "word": "dog", "phonetic": "/dɒɡ/", "meaning": "狗", "example": "The dog is very cute."},
                        {"id": "w53", "word": "cat", "phonetic": "/kæt/", "meaning": "猫", "example": "I have a pet cat."},
                        {"id": "w54", "word": "bird", "phonetic": "/bɜːrd/", "meaning": "鸟", "example": "The bird can fly."},
                        {"id": "w55", "word": "fish", "phonetic": "/fɪʃ/", "meaning": "鱼", "example": "Fish can swim."},
                        {"id": "w56", "word": "tiger", "phonetic": "/ˈtaɪɡər/", "meaning": "老虎", "example": "The tiger is very strong."},
                        {"id": "w57", "word": "lion", "phonetic": "/ˈlaɪən/", "meaning": "狮子", "example": "The lion is the king of the jungle."},
                        {"id": "w58", "word": "elephant", "phonetic": "/ˈelɪfənt/", "meaning": "大象", "example": "The elephant has a long nose."},
                        {"id": "w59", "word": "monkey", "phonetic": "/ˈmʌŋki/", "meaning": "猴子", "example": "The monkey likes bananas."},
                        {"id": "w60", "word": "panda", "phonetic": "/ˈpændə/", "meaning": "熊猫", "example": "The panda is very cute."}
                    ]
                },
                {
                    "id": "unit7",
                    "name": "第七单元：Weather and Seasons",
                    "words": [
                        {"id": "w61", "word": "weather", "phonetic": "/ˈweðər/", "meaning": "天气", "example": "What's the weather like today?"},
                        {"id": "w62", "word": "sunny", "phonetic": "/ˈsʌni/", "meaning": "晴朗的", "example": "It's sunny today."},
                        {"id": "w63", "word": "rainy", "phonetic": "/ˈreɪni/", "meaning": "下雨的", "example": "It's raining outside."},
                        {"id": "w64", "word": "cloudy", "phonetic": "/ˈklaʊdi/", "meaning": "多云的", "example": "The sky is cloudy."},
                        {"id": "w65", "word": "windy", "phonetic": "/ˈwɪndi/", "meaning": "有风的", "example": "It's very windy today."},
                        {"id": "w66", "word": "season", "phonetic": "/ˈsiːzn/", "meaning": "季节", "example": "There are four seasons in a year."},
                        {"id": "w67", "word": "spring", "phonetic": "/sprɪŋ/", "meaning": "春天", "example": "Spring is warm and beautiful."},
                        {"id": "w68", "word": "summer", "phonetic": "/ˈsʌmər/", "meaning": "夏天", "example": "Summer is hot."},
                        {"id": "w69", "word": "autumn", "phonetic": "/ˈɔːtəm/", "meaning": "秋天", "example": "Autumn is cool."},
                        {"id": "w70", "word": "winter", "phonetic": "/ˈwɪntər/", "meaning": "冬天", "example": "Winter is cold."}
                    ]
                },
                {
                    "id": "unit8",
                    "name": "第八单元：Clothes",
                    "words": [
                        {"id": "w71", "word": "clothes", "phonetic": "/kloʊðz/", "meaning": "衣服", "example": "I need to buy new clothes."},
                        {"id": "w72", "word": "shirt", "phonetic": "/ʃɜːrt/", "meaning": "衬衫", "example": "He wears a white shirt."},
                        {"id": "w73", "word": "pants", "phonetic": "/pænts/", "meaning": "裤子", "example": "These pants are too long."},
                        {"id": "w74", "word": "dress", "phonetic": "/dres/", "meaning": "连衣裙", "example": "She has a beautiful dress."},
                        {"id": "w75", "word": "shoes", "phonetic": "/ʃuːz/", "meaning": "鞋子", "example": "My shoes are dirty."},
                        {"id": "w76", "word": "socks", "phonetic": "/sɒks/", "meaning": "袜子", "example": "I wear white socks."},
                        {"id": "w77", "word": "hat", "phonetic": "/hæt/", "meaning": "帽子", "example": "He wears a baseball hat."},
                        {"id": "w78", "word": "coat", "phonetic": "/koʊt/", "meaning": "外套", "example": "It's cold, put on your coat."},
                        {"id": "w79", "word": "skirt", "phonetic": "/skɜːrt/", "meaning": "裙子", "example": "She wears a red skirt."},
                        {"id": "w80", "word": "sweater", "phonetic": "/ˈswetər/", "meaning": "毛衣", "example": "I have a warm sweater."}
                    ]
                },
                {
                    "id": "unit9",
                    "name": "第九单元：School Supplies",
                    "words": [
                        {"id": "w81", "word": "book", "phonetic": "/bʊk/", "meaning": "书", "example": "I read a book every day."},
                        {"id": "w82", "word": "pen", "phonetic": "/pen/", "meaning": "钢笔", "example": "Can I borrow your pen?"},
                        {"id": "w83", "word": "pencil", "phonetic": "/ˈpensəl/", "meaning": "铅笔", "example": "I write with a pencil."},
                        {"id": "w84", "word": "eraser", "phonetic": "/ɪˈreɪzər/", "meaning": "橡皮", "example": "I need an eraser."},
                        {"id": "w85", "word": "ruler", "phonetic": "/ˈruːlər/", "meaning": "尺子", "example": "This ruler is 30cm long."},
                        {"id": "w86", "word": "bag", "phonetic": "/bæɡ/", "meaning": "书包", "example": "My bag is heavy."},
                        {"id": "w87", "word": "notebook", "phonetic": "/ˈnoʊtbʊk/", "meaning": "笔记本", "example": "I take notes in my notebook."},
                        {"id": "w88", "word": "crayon", "phonetic": "/ˈkreɪən/", "meaning": "蜡笔", "example": "I draw with crayons."},
                        {"id": "w89", "word": "sharpener", "phonetic": "/ˈʃɑːrpənər/", "meaning": "卷笔刀", "example": "I need a pencil sharpener."},
                        {"id": "w90", "word": "dictionary", "phonetic": "/ˈdɪkʃəneri/", "meaning": "字典", "example": "Look it up in the dictionary."}
                    ]
                },
                {
                    "id": "unit10",
                    "name": "第十单元：Time and Date",
                    "words": [
                        {"id": "w91", "word": "time", "phonetic": "/taɪm/", "meaning": "时间", "example": "What time is it?"},
                        {"id": "w92", "word": "clock", "phonetic": "/klɒk/", "meaning": "时钟", "example": "The clock shows three o'clock."},
                        {"id": "w93", "word": "hour", "phonetic": "/ˈaʊər/", "meaning": "小时", "example": "One hour has 60 minutes."},
                        {"id": "w94", "word": "minute", "phonetic": "/ˈmɪnɪt/", "meaning": "分钟", "example": "Wait a minute."},
                        {"id": "w95", "word": "second", "phonetic": "/ˈsekənd/", "meaning": "秒", "example": "One minute has 60 seconds."},
                        {"id": "w96", "word": "day", "phonetic": "/deɪ/", "meaning": "天", "example": "There are seven days in a week."},
                        {"id": "w97", "word": "week", "phonetic": "/wiːk/", "meaning": "星期", "example": "I go to school five days a week."},
                        {"id": "w98", "word": "month", "phonetic": "/mʌnθ/", "meaning": "月份", "example": "There are twelve months in a year."},
                        {"id": "w99", "word": "year", "phonetic": "/jɪr/", "meaning": "年", "example": "Happy New Year!"},
                        {"id": "w100", "word": "birthday", "phonetic": "/ˈbɜːrθdeɪ/", "meaning": "生日", "example": "Happy birthday to you!"}
                    ]
                },
                {
                    "id": "unit11",
                    "name": "第十一单元：Emotions",
                    "words": [
                        {"id": "w101", "word": "happy", "phonetic": "/ˈhæpi/", "meaning": "快乐的", "example": "I am very happy today."},
                        {"id": "w102", "word": "sad", "phonetic": "/sæd/", "meaning": "悲伤的", "example": "She looks sad."},
                        {"id": "w103", "word": "angry", "phonetic": "/ˈæŋɡri/", "meaning": "生气的", "example": "Don't be angry."},
                        {"id": "w104", "word": "tired", "phonetic": "/ˈtaɪərd/", "meaning": "疲倦的", "example": "I am tired after school."},
                        {"id": "w105", "word": "excited", "phonetic": "/ɪkˈsaɪtɪd/", "meaning": "兴奋的", "example": "I am excited about the trip."},
                        {"id": "w106", "word": "nervous", "phonetic": "/ˈnɜːrvəs/", "meaning": "紧张的", "example": "I feel nervous before tests."},
                        {"id": "w107", "word": "proud", "phonetic": "/praʊd/", "meaning": "骄傲的", "example": "My parents are proud of me."},
                        {"id": "w108", "word": "worried", "phonetic": "/ˈwɜːrid/", "meaning": "担心的", "example": "Don't be worried."},
                        {"id": "w109", "word": "surprised", "phonetic": "/sərˈpraɪzd/", "meaning": "惊讶的", "example": "I am surprised to see you."},
                        {"id": "w110", "word": "glad", "phonetic": "/ɡlæd/", "meaning": "高兴的", "example": "I am glad to help you."}
                    ]
                },
                {
                    "id": "unit12",
                    "name": "第十二单元：Travel",
                    "words": [
                        {"id": "w111", "word": "travel", "phonetic": "/ˈtrævl/", "meaning": "旅行", "example": "I love to travel."},
                        {"id": "w112", "word": "trip", "phonetic": "/trɪp/", "meaning": "短途旅行", "example": "We had a nice trip."},
                        {"id": "w113", "word": "vacation", "phonetic": "/veɪˈkeɪʃn/", "meaning": "假期", "example": "I went on vacation."},
                        {"id": "w114", "word": "train", "phonetic": "/treɪn/", "meaning": "火车", "example": "I took a train to Beijing."},
                        {"id": "w115", "word": "plane", "phonetic": "/pleɪn/", "meaning": "飞机", "example": "The plane flies very fast."},
                        {"id": "w116", "word": "bus", "phonetic": "/bʌs/", "meaning": "公交车", "example": "I take the bus to school."},
                        {"id": "w117", "word": "hotel", "phonetic": "/hoʊˈtel/", "meaning": "酒店", "example": "We stayed in a hotel."},
                        {"id": "w118", "word": "ticket", "phonetic": "/ˈtɪkɪt/", "meaning": "票", "example": "I bought a train ticket."},
                        {"id": "w119", "word": "map", "phonetic": "/mæp/", "meaning": "地图", "example": "Let's look at the map."},
                        {"id": "w120", "word": "guide", "phonetic": "/ɡaɪd/", "meaning": "导游", "example": "The guide shows us around."}
                    ]
                },
                {
                    "id": "unit13",
                    "name": "第十三单元：Technology",
                    "words": [
                        {"id": "w121", "word": "computer", "phonetic": "/kəmˈpjuːtər/", "meaning": "电脑", "example": "I use a computer every day."},
                        {"id": "w122", "word": "phone", "phonetic": "/foʊn/", "meaning": "电话", "example": "I have a mobile phone."},
                        {"id": "w123", "word": "internet", "phonetic": "/ˈɪntərnet/", "meaning": "互联网", "example": "I surf the internet."},
                        {"id": "w124", "word": "email", "phonetic": "/ˈiːmeɪl/", "meaning": "电子邮件", "example": "I send emails to my friends."},
                        {"id": "w125", "word": "video", "phonetic": "/ˈvɪdiəʊ/", "meaning": "视频", "example": "I watch videos online."},
                        {"id": "w126", "word": "music", "phonetic": "/ˈmjuːzɪk/", "meaning": "音乐", "example": "I listen to music every day."},
                        {"id": "w127", "word": "camera", "phonetic": "/ˈkæmərə/", "meaning": "相机", "example": "I took photos with my camera."},
                        {"id": "w128", "word": "screen", "phonetic": "/skriːn/", "meaning": "屏幕", "example": "The screen is very big."},
                        {"id": "w129", "word": "keyboard", "phonetic": "/ˈkiːbɔːrd/", "meaning": "键盘", "example": "I type on the keyboard."},
                        {"id": "w130", "word": "mouse", "phonetic": "/maʊs/", "meaning": "鼠标", "example": "I use a mouse to click."}
                    ]
                },
                {
                    "id": "unit14",
                    "name": "第十四单元：Nature",
                    "words": [
                        {"id": "w131", "word": "nature", "phonetic": "/ˈneɪtʃər/", "meaning": "自然", "example": "I love nature."},
                        {"id": "w132", "word": "mountain", "phonetic": "/ˈmaʊntən/", "meaning": "山", "example": "The mountain is very high."},
                        {"id": "w133", "word": "river", "phonetic": "/ˈrɪvər/", "meaning": "河流", "example": "The river flows quickly."},
                        {"id": "w134", "word": "forest", "phonetic": "/ˈfɒrɪst/", "meaning": "森林", "example": "We walked through the forest."},
                        {"id": "w135", "word": "lake", "phonetic": "/leɪk/", "meaning": "湖", "example": "The lake is very beautiful."},
                        {"id": "w136", "word": "sea", "phonetic": "/siː/", "meaning": "海", "example": "The sea is blue."},
                        {"id": "w137", "word": "sky", "phonetic": "/skaɪ/", "meaning": "天空", "example": "The sky is clear."},
                        {"id": "w138", "word": "star", "phonetic": "/stɑːr/", "meaning": "星星", "example": "The stars are bright at night."},
                        {"id": "w139", "word": "moon", "phonetic": "/muːn/", "meaning": "月亮", "example": "The moon is round."},
                        {"id": "w140", "word": "sun", "phonetic": "/sʌn/", "meaning": "太阳", "example": "The sun rises in the east."}
                    ]
                },
                {
                    "id": "unit15",
                    "name": "第十五单元：Abstract",
                    "words": [
                        {"id": "w141", "word": "knowledge", "phonetic": "/ˈnɒlɪdʒ/", "meaning": "知识", "example": "Knowledge is power."},
                        {"id": "w142", "word": "success", "phonetic": "/səkˈses/", "meaning": "成功", "example": "Hard work leads to success."},
                        {"id": "w143", "word": "friendship", "phonetic": "/ˈfrendʃɪp/", "meaning": "友谊", "example": "Our friendship is strong."},
                        {"id": "w144", "word": "happiness", "phonetic": "/ˈhæpinəs/", "meaning": "幸福", "example": "Money can't buy happiness."},
                        {"id": "w145", "word": "education", "phonetic": "/ˌedʒuˈkeɪʃn/", "meaning": "教育", "example": "Education is important."},
                        {"id": "w146", "word": "health", "phonetic": "/helθ/", "meaning": "健康", "example": "Health is wealth."},
                        {"id": "w147", "word": "dream", "phonetic": "/driːm/", "meaning": "梦想", "example": "I have a dream."},
                        {"id": "w148", "word": "hope", "phonetic": "/hoʊp/", "meaning": "希望", "example": "I hope you can come."},
                        {"id": "w149", "word": "love", "phonetic": "/lʌv/", "meaning": "爱", "example": "I love my family."},
                        {"id": "w150", "word": "peace", "phonetic": "/piːs/", "meaning": "和平", "example": "I wish for world peace."}
                    ]
                }
            ]
        };
    },

    async getGrammar() {
        return {
            "topics": [
                {
                    "id": "g1",
                    "title": "一般现在时",
                    "description": "表示经常性、习惯性的动作或状态",
                    "rules": [
                        {"rule": "主语是第一、二人称或复数时，动词用原形", "example": "I study English every day."},
                        {"rule": "主语是第三人称单数时，动词要加s或es", "example": "She goes to school by bus."},
                        {"rule": "否定句用don't或doesn't + 动词原形", "example": "He doesn't like math."},
                        {"rule": "疑问句用Do/Does + 主语 + 动词原形", "example": "Do you like music?"}
                    ],
                    "exercises": [
                        {"question": "She ______ to school every day.", "options": ["go", "goes", "going", "went"], "answer": "goes"},
                        {"question": "I ______ like swimming.", "options": ["don't", "doesn't", "not", "no"], "answer": "don't"},
                        {"question": "______ he play football?", "options": ["Do", "Does", "Is", "Are"], "answer": "Does"},
                        {"question": "They ______ TV every evening.", "options": ["watch", "watches", "watching", "watched"], "answer": "watch"},
                        {"question": "He ______ his homework after school.", "options": ["do", "does", "doing", "did"], "answer": "does"}
                    ]
                },
                {
                    "id": "g2",
                    "title": "现在进行时",
                    "description": "表示正在进行的动作",
                    "rules": [
                        {"rule": "结构：am/is/are + 动词-ing形式", "example": "I am reading a book."},
                        {"rule": "动词-ing形式：一般直接加ing", "example": "play - playing"},
                        {"rule": "以e结尾的动词，去掉e再加ing", "example": "write - writing"},
                        {"rule": "重读闭音节结尾，双写末尾字母再加ing", "example": "run - running"}
                    ],
                    "exercises": [
                        {"question": "Look! He ______ basketball.", "options": ["play", "plays", "is playing", "playing"], "answer": "is playing"},
                        {"question": "They ______ TV now.", "options": ["watch", "watches", "are watching", "watching"], "answer": "are watching"},
                        {"question": "She ______ a letter.", "options": ["write", "writes", "is writing", "writing"], "answer": "is writing"},
                        {"question": "I ______ my homework.", "options": ["do", "does", "am doing", "doing"], "answer": "am doing"},
                        {"question": "The bird ______ in the sky.", "options": ["fly", "flies", "is flying", "flying"], "answer": "is flying"}
                    ]
                },
                {
                    "id": "g3",
                    "title": "一般过去时",
                    "description": "表示过去发生的动作或状态",
                    "rules": [
                        {"rule": "规则动词过去式：直接加ed", "example": "work - worked"},
                        {"rule": "以e结尾的动词：直接加d", "example": "live - lived"},
                        {"rule": "重读闭音节结尾：双写末尾字母加ed", "example": "stop - stopped"},
                        {"rule": "不规则动词需要特殊记忆", "example": "go - went, see - saw"}
                    ],
                    "exercises": [
                        {"question": "I ______ to school yesterday.", "options": ["go", "goes", "went", "going"], "answer": "went"},
                        {"question": "She ______ her homework last night.", "options": ["finish", "finishes", "finished", "finishing"], "answer": "finished"},
                        {"question": "They ______ a movie yesterday evening.", "options": ["see", "saw", "seen", "seeing"], "answer": "saw"},
                        {"question": "He ______ to the park last Sunday.", "options": ["go", "goes", "went", "going"], "answer": "went"},
                        {"question": "We ______ English class this morning.", "options": ["have", "has", "had", "having"], "answer": "had"}
                    ]
                },
                {
                    "id": "g4",
                    "title": "There be句型",
                    "description": "表示某处有某物",
                    "rules": [
                        {"rule": "单数名词用There is", "example": "There is a book on the desk."},
                        {"rule": "复数名词用There are", "example": "There are two pens in the bag."},
                        {"rule": "否定句：There is/are not", "example": "There is not a cat here."},
                        {"rule": "疑问句：Is/Are there...?", "example": "Are there any students in the classroom?"}
                    ],
                    "exercises": [
                        {"question": "______ a pen on the desk.", "options": ["There is", "There are", "There be", "Is there"], "answer": "There is"},
                        {"question": "______ five books in the bag.", "options": ["There is", "There are", "There be", "Is there"], "answer": "There are"},
                        {"question": "______ any water in the bottle?", "options": ["There is", "There are", "Is there", "Are there"], "answer": "Is there"},
                        {"question": "______ many students in the classroom.", "options": ["There is", "There are", "There be", "Is there"], "answer": "There are"},
                        {"question": "______ a dog under the tree.", "options": ["There is", "There are", "There be", "Is there"], "answer": "There is"}
                    ]
                },
                {
                    "id": "g5",
                    "title": "名词复数",
                    "description": "名词的复数形式变化规则",
                    "rules": [
                        {"rule": "一般名词直接加s", "example": "book - books"},
                        {"rule": "以s, x, sh, ch结尾的名词加es", "example": "box - boxes"},
                        {"rule": "以辅音字母+y结尾的名词，变y为i加es", "example": "baby - babies"},
                        {"rule": "不规则变化需要特殊记忆", "example": "child - children, foot - feet"}
                    ],
                    "exercises": [
                        {"question": "I have two ______.", "options": ["book", "books", "bookes", "book's"], "answer": "books"},
                        {"question": "There are three ______ in the room.", "options": ["box", "boxes", "boxs", "box's"], "answer": "boxes"},
                        {"question": "She has many ______.", "options": ["baby", "babies", "babys", "baby's"], "answer": "babies"},
                        {"question": "We saw five ______ in the park.", "options": ["child", "children", "childs", "childes"], "answer": "children"},
                        {"question": "He has two ______.", "options": ["foot", "feet", "foots", "footes"], "answer": "feet"}
                    ]
                },
                {
                    "id": "g6",
                    "title": "人称代词",
                    "description": "用来指代人或事物的代词",
                    "rules": [
                        {"rule": "主格代词：I, you, he, she, it, we, they", "example": "I am a student."},
                        {"rule": "宾格代词：me, you, him, her, it, us, them", "example": "Please help me."},
                        {"rule": "形容词性物主代词：my, your, his, her, its, our, their", "example": "This is my book."},
                        {"rule": "名词性物主代词：mine, yours, his, hers, its, ours, theirs", "example": "This book is mine."}
                    ],
                    "exercises": [
                        {"question": "______ am a student.", "options": ["I", "Me", "My", "Mine"], "answer": "I"},
                        {"question": "Please help ______.", "options": ["I", "me", "my", "mine"], "answer": "me"},
                        {"question": "This is ______ book.", "options": ["I", "me", "my", "mine"], "answer": "my"},
                        {"question": "This book is ______.", "options": ["I", "me", "my", "mine"], "answer": "mine"},
                        {"question": "______ are my friends.", "options": ["They", "Them", "Their", "Theirs"], "answer": "They"}
                    ]
                },
                {
                    "id": "g7",
                    "title": "情态动词",
                    "description": "表示能力、许可、意愿等",
                    "rules": [
                        {"rule": "can表示能力", "example": "I can swim."},
                        {"rule": "may表示许可", "example": "May I come in?"},
                        {"rule": "must表示必须", "example": "You must finish your homework."},
                        {"rule": "should表示建议", "example": "You should study hard."}
                    ],
                    "exercises": [
                        {"question": "I ______ swim.", "options": ["can", "may", "must", "should"], "answer": "can"},
                        {"question": "______ I use your pen?", "options": ["Can", "May", "Must", "Should"], "answer": "May"},
                        {"question": "You ______ finish your homework first.", "options": ["can", "may", "must", "should"], "answer": "must"},
                        {"question": "You ______ eat more vegetables.", "options": ["can", "may", "must", "should"], "answer": "should"},
                        {"question": "She ______ speak English well.", "options": ["can", "may", "must", "should"], "answer": "can"}
                    ]
                },
                {
                    "id": "g8",
                    "title": "形容词比较级",
                    "description": "表示两者之间的比较",
                    "rules": [
                        {"rule": "单音节词：直接加-er", "example": "tall - taller"},
                        {"rule": "以e结尾的词：直接加-r", "example": "nice - nicer"},
                        {"rule": "重读闭音节结尾：双写末尾字母加-er", "example": "big - bigger"},
                        {"rule": "多音节词：在前面加more", "example": "beautiful - more beautiful"}
                    ],
                    "exercises": [
                        {"question": "This book is ______ than that one.", "options": ["interesting", "more interesting", "most interesting", "interestinger"], "answer": "more interesting"},
                        {"question": "He is ______ than his brother.", "options": ["tall", "taller", "tallest", "more tall"], "answer": "taller"},
                        {"question": "This apple is ______ than that one.", "options": ["big", "bigger", "biggest", "more big"], "answer": "bigger"},
                        {"question": "She is ______ than me.", "options": ["beautiful", "more beautiful", "most beautiful", "beautifuller"], "answer": "more beautiful"},
                        {"question": "The weather is ______ today.", "options": ["warm", "warmer", "warmest", "more warm"], "answer": "warmer"}
                    ]
                },
                {
                    "id": "g9",
                    "title": "介词",
                    "description": "表示时间、地点、方式等关系",
                    "rules": [
                        {"rule": "in + 月份/年份/季节", "example": "in January, in 2024"},
                        {"rule": "on + 具体日期", "example": "on Monday, on June 1st"},
                        {"rule": "at + 时间点", "example": "at 7 o'clock, at noon"},
                        {"rule": "in + 地点（大地方），at + 地点（小地方）", "example": "in Beijing, at home"}
                    ],
                    "exercises": [
                        {"question": "I get up ______ 7 o'clock.", "options": ["in", "on", "at", "for"], "answer": "at"},
                        {"question": "We go to school ______ Monday.", "options": ["in", "on", "at", "for"], "answer": "on"},
                        {"question": "She was born ______ May.", "options": ["in", "on", "at", "for"], "answer": "in"},
                        {"question": "I live ______ Beijing.", "options": ["in", "on", "at", "for"], "answer": "in"},
                        {"question": "He is ______ home now.", "options": ["in", "on", "at", "for"], "answer": "at"}
                    ]
                },
                {
                    "id": "g10",
                    "title": "祈使句",
                    "description": "表示请求、命令、建议等",
                    "rules": [
                        {"rule": "肯定祈使句：动词原形开头", "example": "Please sit down."},
                        {"rule": "否定祈使句：Don't + 动词原形", "example": "Don't be late."},
                        {"rule": "Let's开头的祈使句", "example": "Let's go to school."},
                        {"rule": "Be + 形容词开头的祈使句", "example": "Be quiet."}
                    ],
                    "exercises": [
                        {"question": "______ sit down, please.", "options": ["Sit", "Sits", "Sitting", "Sat"], "answer": "Sit"},
                        {"question": "______ be late for school.", "options": ["Not", "Don't", "Doesn't", "Didn't"], "answer": "Don't"},
                        {"question": "______ go to the park.", "options": ["Let", "Let's", "Lets", "Let is"], "answer": "Let's"},
                        {"question": "______ quiet in the library.", "options": ["Be", "Being", "Been", "To be"], "answer": "Be"},
                        {"question": "______ your homework.", "options": ["Do", "Does", "Doing", "Did"], "answer": "Do"}
                    ]
                }
            ]
        };
    },

    async getReading() {
        return {
            "articles": [
                {
                    "id": "r1",
                    "title": "My School",
                    "titleChinese": "我的学校",
                    "content": [
                        {"english": "I study at No.1 Middle School.", "chinese": "我在第一中学学习。"},
                        {"english": "It is a beautiful school with many trees and flowers.", "chinese": "这是一所美丽的学校，有许多树木和花朵。"},
                        {"english": "There are 30 classrooms and a big library.", "chinese": "有30间教室和一个大图书馆。"},
                        {"english": "I have eight classes every day.", "chinese": "我每天有八节课。"},
                        {"english": "My favorite subject is English.", "chinese": "我最喜欢的科目是英语。"},
                        {"english": "Our English teacher is very kind.", "chinese": "我们的英语老师非常和蔼。"},
                        {"english": "I love my school very much.", "chinese": "我非常爱我的学校。"}
                    ],
                    "keyPoints": [
                        {"sentence": "It is a beautiful school with many trees and flowers.", "explanation": "with表示'带有'，用来描述事物的特征"},
                        {"sentence": "My favorite subject is English.", "explanation": "favorite表示'最喜欢的'"},
                        {"sentence": "Our English teacher is very kind.", "explanation": "kind表示'和蔼的、友善的'"}
                    ]
                },
                {
                    "id": "r2",
                    "title": "My Family",
                    "titleChinese": "我的家庭",
                    "content": [
                        {"english": "I have a happy family.", "chinese": "我有一个幸福的家庭。"},
                        {"english": "There are four people in my family.", "chinese": "我家有四口人。"},
                        {"english": "My father is a doctor.", "chinese": "我的父亲是一名医生。"},
                        {"english": "He works in a hospital.", "chinese": "他在一家医院工作。"},
                        {"english": "My mother is a teacher.", "chinese": "我的母亲是一名教师。"},
                        {"english": "She teaches math at a school.", "chinese": "她在一所学校教数学。"},
                        {"english": "I have a little sister.", "chinese": "我有一个小妹妹。"},
                        {"english": "She is five years old.", "chinese": "她五岁了。"},
                        {"english": "We love each other very much.", "chinese": "我们非常爱彼此。"}
                    ],
                    "keyPoints": [
                        {"sentence": "There are four people in my family.", "explanation": "There be句型表示'有'"},
                        {"sentence": "He works in a hospital.", "explanation": "work in表示'在...工作'"},
                        {"sentence": "She teaches math at a school.", "explanation": "teach + 科目 表示'教某科目'"}
                    ]
                },
                {
                    "id": "r3",
                    "title": "My Day",
                    "titleChinese": "我的一天",
                    "content": [
                        {"english": "I get up at 7 o'clock every morning.", "chinese": "我每天早上7点起床。"},
                        {"english": "Then I have breakfast with my family.", "chinese": "然后我和家人一起吃早餐。"},
                        {"english": "I go to school at 7:30.", "chinese": "我7点半去上学。"},
                        {"english": "School starts at 8 o'clock.", "chinese": "学校8点开始上课。"},
                        {"english": "I have lunch at school.", "chinese": "我在学校吃午饭。"},
                        {"english": "After school, I do my homework.", "chinese": "放学后，我做作业。"},
                        {"english": "I have dinner at 6 o'clock.", "chinese": "我6点吃晚饭。"},
                        {"english": "Then I watch TV for a while.", "chinese": "然后我看一会儿电视。"},
                        {"english": "I go to bed at 9 o'clock.", "chinese": "我9点睡觉。"},
                        {"english": "This is my busy but happy day.", "chinese": "这就是我忙碌但快乐的一天。"}
                    ],
                    "keyPoints": [
                        {"sentence": "I get up at 7 o'clock every morning.", "explanation": "at + 时间点 表示'在几点'"},
                        {"sentence": "Then I have breakfast with my family.", "explanation": "have breakfast表示'吃早餐'"},
                        {"sentence": "After school, I do my homework.", "explanation": "after school表示'放学后'"}
                    ]
                },
                {
                    "id": "r4",
                    "title": "My Favorite Food",
                    "titleChinese": "我最喜欢的食物",
                    "content": [
                        {"english": "I like many kinds of food.", "chinese": "我喜欢很多种食物。"},
                        {"english": "My favorite food is noodles.", "chinese": "我最喜欢的食物是面条。"},
                        {"english": "I eat noodles for breakfast every day.", "chinese": "我每天早餐吃面条。"},
                        {"english": "My mother makes delicious noodles.", "chinese": "我妈妈做的面条非常美味。"},
                        {"english": "I also like rice and vegetables.", "chinese": "我也喜欢米饭和蔬菜。"},
                        {"english": "Vegetables are good for our health.", "chinese": "蔬菜对我们的健康有好处。"},
                        {"english": "I eat fruit every day too.", "chinese": "我每天也吃水果。"},
                        {"english": "Apples and bananas are my favorite.", "chinese": "苹果和香蕉是我的最爱。"},
                        {"english": "I think healthy food is important.", "chinese": "我认为健康的食物很重要。"}
                    ],
                    "keyPoints": [
                        {"sentence": "I like many kinds of food.", "explanation": "many kinds of表示'许多种类的'"},
                        {"sentence": "Vegetables are good for our health.", "explanation": "be good for表示'对...有好处'"},
                        {"sentence": "I think healthy food is important.", "explanation": "I think...表示'我认为...'"}
                    ]
                },
                {
                    "id": "r5",
                    "title": "My Hobbies",
                    "titleChinese": "我的爱好",
                    "content": [
                        {"english": "I have many hobbies.", "chinese": "我有许多爱好。"},
                        {"english": "I like reading books.", "chinese": "我喜欢读书。"},
                        {"english": "I read storybooks every evening.", "chinese": "我每天晚上读故事书。"},
                        {"english": "I also like playing sports.", "chinese": "我也喜欢运动。"},
                        {"english": "I play basketball with my friends.", "chinese": "我和朋友们一起打篮球。"},
                        {"english": "Swimming is my favorite sport.", "chinese": "游泳是我最喜欢的运动。"},
                        {"english": "I swim every weekend.", "chinese": "我每个周末游泳。"},
                        {"english": "Hobbies make me happy.", "chinese": "爱好让我快乐。"},
                        {"english": "What are your hobbies?", "chinese": "你的爱好是什么呢？"}
                    ],
                    "keyPoints": [
                        {"sentence": "I like reading books.", "explanation": "like doing表示'喜欢做某事'"},
                        {"sentence": "I play basketball with my friends.", "explanation": "play + 球类运动 表示'打/踢...'"},
                        {"sentence": "What are your hobbies?", "explanation": "这是一个特殊疑问句，用来询问爱好"}
                    ]
                },
                {
                    "id": "r6",
                    "title": "My Pet",
                    "titleChinese": "我的宠物",
                    "content": [
                        {"english": "I have a pet dog.", "chinese": "我有一只宠物狗。"},
                        {"english": "Its name is Lucky.", "chinese": "它的名字叫幸运。"},
                        {"english": "It is brown and white.", "chinese": "它是棕色和白色的。"},
                        {"english": "It is very cute and friendly.", "chinese": "它非常可爱和友好。"},
                        {"english": "I play with it every day.", "chinese": "我每天和它玩。"},
                        {"english": "It likes to run and jump.", "chinese": "它喜欢跑和跳。"},
                        {"english": "It also likes to eat bones.", "chinese": "它也喜欢吃骨头。"},
                        {"english": "Lucky is my best friend.", "chinese": "幸运是我最好的朋友。"}
                    ],
                    "keyPoints": [
                        {"sentence": "Its name is Lucky.", "explanation": "its表示'它的'（物主代词）"},
                        {"sentence": "It is very cute and friendly.", "explanation": "and连接两个形容词"},
                        {"sentence": "Lucky is my best friend.", "explanation": "best表示'最好的'"}
                    ]
                },
                {
                    "id": "r7",
                    "title": "The Weather",
                    "titleChinese": "天气",
                    "content": [
                        {"english": "The weather is very important in our life.", "chinese": "天气在我们的生活中非常重要。"},
                        {"english": "Today is sunny and warm.", "chinese": "今天阳光明媚，天气温暖。"},
                        {"english": "I can go out and play.", "chinese": "我可以出去玩。"},
                        {"english": "Sometimes it is rainy.", "chinese": "有时候会下雨。"},
                        {"english": "When it rains, I stay at home and read books.", "chinese": "下雨的时候，我待在家里看书。"},
                        {"english": "I like all kinds of weather.", "chinese": "我喜欢各种天气。"},
                        {"english": "Every season has different weather.", "chinese": "每个季节都有不同的天气。"},
                        {"english": "Spring is warm, summer is hot, autumn is cool, and winter is cold.", "chinese": "春天温暖，夏天炎热，秋天凉爽，冬天寒冷。"}
                    ],
                    "keyPoints": [
                        {"sentence": "The weather is very important.", "explanation": "important表示'重要的'"},
                        {"sentence": "When it rains, I stay at home.", "explanation": "when引导时间状语从句"},
                        {"sentence": "Every season has different weather.", "explanation": "different表示'不同的'"}
                    ]
                },
                {
                    "id": "r8",
                    "title": "Going to the Zoo",
                    "titleChinese": "去动物园",
                    "content": [
                        {"english": "Last Sunday, I went to the zoo with my family.", "chinese": "上周日，我和家人去了动物园。"},
                        {"english": "We saw many animals there.", "chinese": "我们在那里看到了很多动物。"},
                        {"english": "First, we saw the tigers.", "chinese": "首先，我们看到了老虎。"},
                        {"english": "The tigers were very strong.", "chinese": "老虎非常强壮。"},
                        {"english": "Then we saw the pandas.", "chinese": "然后我们看到了熊猫。"},
                        {"english": "The pandas were eating bamboo.", "chinese": "熊猫正在吃竹子。"},
                        {"english": "We also saw elephants, monkeys, and birds.", "chinese": "我们还看到了大象、猴子和鸟。"},
                        {"english": "It was a very happy day.", "chinese": "那是非常快乐的一天。"}
                    ],
                    "keyPoints": [
                        {"sentence": "Last Sunday, I went to the zoo.", "explanation": "last Sunday表示'上周日'，用一般过去时"},
                        {"sentence": "The pandas were eating bamboo.", "explanation": "过去进行时表示过去正在进行的动作"},
                        {"sentence": "It was a very happy day.", "explanation": "was是is的过去式"}
                    ]
                }
            ]
        };
    },

    async getListening() {
        return {
            "exercises": [
                {
                    "id": "l1",
                    "title": "数字听力",
                    "description": "听数字并选择正确答案",
                    "questions": [
                        {"audioText": "three", "options": ["3", "13", "30", "23"], "answer": "3"},
                        {"audioText": "fifteen", "options": ["5", "15", "50", "25"], "answer": "15"},
                        {"audioText": "twenty-eight", "options": ["18", "28", "38", "8"], "answer": "28"},
                        {"audioText": "one hundred", "options": ["10", "100", "110", "90"], "answer": "100"},
                        {"audioText": "seventy-five", "options": ["65", "75", "85", "57"], "answer": "75"},
                        {"audioText": "nine", "options": ["9", "19", "90", "29"], "answer": "9"},
                        {"audioText": "thirty-two", "options": ["23", "32", "13", "42"], "answer": "32"},
                        {"audioText": "fifty", "options": ["15", "50", "5", "60"], "answer": "50"}
                    ]
                },
                {
                    "id": "l2",
                    "title": "日常用语",
                    "description": "听句子并选择正确答案",
                    "questions": [
                        {"audioText": "Good morning", "options": ["早上好", "下午好", "晚上好", "晚安"], "answer": "早上好"},
                        {"audioText": "How are you", "options": ["你是谁", "你好吗", "你多大", "你在哪里"], "answer": "你好吗"},
                        {"audioText": "Thank you", "options": ["对不起", "没关系", "谢谢", "再见"], "answer": "谢谢"},
                        {"audioText": "What is your name", "options": ["你叫什么名字", "你多大", "你好", "谢谢"], "answer": "你叫什么名字"},
                        {"audioText": "Nice to meet you", "options": ["很高兴认识你", "你好吗", "再见", "谢谢"], "answer": "很高兴认识你"},
                        {"audioText": "Goodbye", "options": ["你好", "谢谢", "再见", "对不起"], "answer": "再见"},
                        {"audioText": "Excuse me", "options": ["谢谢", "对不起", "打扰一下", "没关系"], "answer": "打扰一下"},
                        {"audioText": "I am fine", "options": ["我很好", "你好吗", "谢谢", "再见"], "answer": "我很好"}
                    ]
                },
                {
                    "id": "l3",
                    "title": "星期听力",
                    "description": "听星期并选择正确答案",
                    "questions": [
                        {"audioText": "Monday", "options": ["星期一", "星期二", "星期三", "星期四"], "answer": "星期一"},
                        {"audioText": "Wednesday", "options": ["星期一", "星期二", "星期三", "星期四"], "answer": "星期三"},
                        {"audioText": "Friday", "options": ["星期三", "星期四", "星期五", "星期六"], "answer": "星期五"},
                        {"audioText": "Saturday", "options": ["星期五", "星期六", "星期日", "星期一"], "answer": "星期六"},
                        {"audioText": "Sunday", "options": ["星期五", "星期六", "星期日", "星期一"], "answer": "星期日"},
                        {"audioText": "Tuesday", "options": ["星期一", "星期二", "星期三", "星期四"], "answer": "星期二"},
                        {"audioText": "Thursday", "options": ["星期三", "星期四", "星期五", "星期六"], "answer": "星期四"}
                    ]
                },
                {
                    "id": "l4",
                    "title": "颜色听力",
                    "description": "听颜色并选择正确答案",
                    "questions": [
                        {"audioText": "red", "options": ["红色", "蓝色", "绿色", "黄色"], "answer": "红色"},
                        {"audioText": "blue", "options": ["红色", "蓝色", "绿色", "黄色"], "answer": "蓝色"},
                        {"audioText": "green", "options": ["红色", "蓝色", "绿色", "黄色"], "answer": "绿色"},
                        {"audioText": "yellow", "options": ["紫色", "橙色", "黄色", "粉色"], "answer": "黄色"},
                        {"audioText": "purple", "options": ["紫色", "橙色", "黄色", "粉色"], "answer": "紫色"},
                        {"audioText": "orange", "options": ["紫色", "橙色", "黄色", "粉色"], "answer": "橙色"},
                        {"audioText": "pink", "options": ["紫色", "橙色", "黄色", "粉色"], "answer": "粉色"},
                        {"audioText": "black", "options": ["黑色", "白色", "灰色", "棕色"], "answer": "黑色"}
                    ]
                },
                {
                    "id": "l5",
                    "title": "食物听力",
                    "description": "听食物并选择正确答案",
                    "questions": [
                        {"audioText": "rice", "options": ["面包", "米饭", "面条", "饺子"], "answer": "米饭"},
                        {"audioText": "noodles", "options": ["面包", "米饭", "面条", "饺子"], "answer": "面条"},
                        {"audioText": "apple", "options": ["苹果", "香蕉", "橙子", "梨"], "answer": "苹果"},
                        {"audioText": "banana", "options": ["苹果", "香蕉", "橙子", "梨"], "answer": "香蕉"},
                        {"audioText": "vegetable", "options": ["水果", "蔬菜", "肉", "鱼"], "answer": "蔬菜"},
                        {"audioText": "bread", "options": ["面包", "米饭", "面条", "饺子"], "answer": "面包"},
                        {"audioText": "milk", "options": ["牛奶", "果汁", "水", "茶"], "answer": "牛奶"},
                        {"audioText": "egg", "options": ["鸡蛋", "鸭蛋", "鹅蛋", "鸟蛋"], "answer": "鸡蛋"}
                    ]
                },
                {
                    "id": "l6",
                    "title": "动物听力",
                    "description": "听动物并选择正确答案",
                    "questions": [
                        {"audioText": "dog", "options": ["猫", "狗", "鸟", "鱼"], "answer": "狗"},
                        {"audioText": "cat", "options": ["猫", "狗", "鸟", "鱼"], "answer": "猫"},
                        {"audioText": "bird", "options": ["猫", "狗", "鸟", "鱼"], "answer": "鸟"},
                        {"audioText": "tiger", "options": ["狮子", "老虎", "大象", "熊猫"], "answer": "老虎"},
                        {"audioText": "panda", "options": ["狮子", "老虎", "大象", "熊猫"], "answer": "熊猫"},
                        {"audioText": "elephant", "options": ["狮子", "老虎", "大象", "熊猫"], "answer": "大象"},
                        {"audioText": "monkey", "options": ["猴子", "兔子", "熊", "狐狸"], "answer": "猴子"},
                        {"audioText": "fish", "options": ["猫", "狗", "鸟", "鱼"], "answer": "鱼"}
                    ]
                },
                {
                    "id": "l7",
                    "title": "季节天气",
                    "description": "听季节和天气并选择正确答案",
                    "questions": [
                        {"audioText": "spring", "options": ["春天", "夏天", "秋天", "冬天"], "answer": "春天"},
                        {"audioText": "summer", "options": ["春天", "夏天", "秋天", "冬天"], "answer": "夏天"},
                        {"audioText": "autumn", "options": ["春天", "夏天", "秋天", "冬天"], "answer": "秋天"},
                        {"audioText": "winter", "options": ["春天", "夏天", "秋天", "冬天"], "answer": "冬天"},
                        {"audioText": "sunny", "options": ["晴朗的", "下雨的", "多云的", "有风的"], "answer": "晴朗的"},
                        {"audioText": "rainy", "options": ["晴朗的", "下雨的", "多云的", "有风的"], "answer": "下雨的"},
                        {"audioText": "cloudy", "options": ["晴朗的", "下雨的", "多云的", "有风的"], "answer": "多云的"},
                        {"audioText": "windy", "options": ["晴朗的", "下雨的", "多云的", "有风的"], "answer": "有风的"}
                    ]
                },
                {
                    "id": "l8",
                    "title": "家庭成员",
                    "description": "听家庭成员并选择正确答案",
                    "questions": [
                        {"audioText": "father", "options": ["父亲", "母亲", "兄弟", "姐妹"], "answer": "父亲"},
                        {"audioText": "mother", "options": ["父亲", "母亲", "兄弟", "姐妹"], "answer": "母亲"},
                        {"audioText": "brother", "options": ["父亲", "母亲", "兄弟", "姐妹"], "answer": "兄弟"},
                        {"audioText": "sister", "options": ["父亲", "母亲", "兄弟", "姐妹"], "answer": "姐妹"},
                        {"audioText": "grandfather", "options": ["祖父", "祖母", "叔叔", "阿姨"], "answer": "祖父"},
                        {"audioText": "grandmother", "options": ["祖父", "祖母", "叔叔", "阿姨"], "answer": "祖母"},
                        {"audioText": "uncle", "options": ["祖父", "祖母", "叔叔", "阿姨"], "answer": "叔叔"},
                        {"audioText": "aunt", "options": ["祖父", "祖母", "叔叔", "阿姨"], "answer": "阿姨"}
                    ]
                }
            ]
        };
    },

    speak(text) {
        return new Promise((resolve, reject) => {
            if ('speechSynthesis' in window) {
                const utterance = new SpeechSynthesisUtterance(text);
                utterance.lang = 'en-US';
                utterance.rate = 0.9;
                utterance.onend = resolve;
                utterance.onerror = reject;
                speechSynthesis.speak(utterance);
            } else {
                reject(new Error('浏览器不支持语音合成'));
            }
        });
    },

    async getDialogues() {
        return {
            "dialogues": [
                {
                    "id": "d1",
                    "title": "问候与自我介绍",
                    "scene": "在学校门口遇到新同学",
                    "roles": ["小明", "新同学"],
                    "content": [
                        {"role": "小明", "text": "Hello! My name is Xiao Ming.", "chinese": "你好！我叫小明。"},
                        {"role": "新同学", "text": "Hi! Nice to meet you. My name is Li Hua.", "chinese": "你好！很高兴认识你。我叫李华。"},
                        {"role": "小明", "text": "Nice to meet you too! Which class are you in?", "chinese": "我也很高兴认识你！你在哪个班？"},
                        {"role": "新同学", "text": "I'm in Class 2, Grade 7. What about you?", "chinese": "我在七年级二班。你呢？"},
                        {"role": "小明", "text": "I'm in Class 2 too! Let's go to class together.", "chinese": "我也在二班！我们一起去上课吧。"}
                    ]
                },
                {
                    "id": "d2",
                    "title": "谈论家庭",
                    "scene": "课间休息时聊天",
                    "roles": ["小红", "小刚"],
                    "content": [
                        {"role": "小红", "text": "Do you have any brothers or sisters?", "chinese": "你有兄弟姐妹吗？"},
                        {"role": "小刚", "text": "Yes, I have a little sister. She is five years old.", "chinese": "有，我有一个小妹妹。她五岁了。"},
                        {"role": "小红", "text": "That's cute! What does your father do?", "chinese": "真可爱！你爸爸是做什么的？"},
                        {"role": "小刚", "text": "He is a doctor. My mother is a teacher.", "chinese": "他是一名医生。我妈妈是一名教师。"},
                        {"role": "小红", "text": "Wow, your parents have great jobs!", "chinese": "哇，你父母的工作真棒！"}
                    ]
                },
                {
                    "id": "d3",
                    "title": "谈论爱好",
                    "scene": "体育课休息时",
                    "roles": ["小华", "小丽"],
                    "content": [
                        {"role": "小华", "text": "What do you like to do in your free time?", "chinese": "你空闲时间喜欢做什么？"},
                        {"role": "小丽", "text": "I like reading books and playing the piano.", "chinese": "我喜欢读书和弹钢琴。"},
                        {"role": "小华", "text": "That's cool! I like playing basketball.", "chinese": "真酷！我喜欢打篮球。"},
                        {"role": "小丽", "text": "Do you play basketball every day?", "chinese": "你每天都打篮球吗？"},
                        {"role": "小华", "text": "Yes, I play with my friends after school.", "chinese": "是的，放学后我和朋友们一起打。"}
                    ]
                },
                {
                    "id": "d4",
                    "title": "谈论食物",
                    "scene": "午餐时间",
                    "roles": ["小强", "小美"],
                    "content": [
                        {"role": "小强", "text": "What's your favorite food?", "chinese": "你最喜欢的食物是什么？"},
                        {"role": "小美", "text": "My favorite food is noodles. What about you?", "chinese": "我最喜欢的食物是面条。你呢？"},
                        {"role": "小强", "text": "I like rice and vegetables.", "chinese": "我喜欢米饭和蔬菜。"},
                        {"role": "小美", "text": "Vegetables are good for health.", "chinese": "蔬菜对健康有好处。"},
                        {"role": "小强", "text": "Yes! I also eat fruit every day.", "chinese": "是的！我每天也吃水果。"}
                    ]
                },
                {
                    "id": "d5",
                    "title": "谈论天气",
                    "scene": "早上上学路上",
                    "roles": ["小芳", "小军"],
                    "content": [
                        {"role": "小芳", "text": "What's the weather like today?", "chinese": "今天天气怎么样？"},
                        {"role": "小军", "text": "It's sunny and warm. Perfect for walking.", "chinese": "阳光明媚，天气温暖。很适合散步。"},
                        {"role": "小芳", "text": "Yes! I hope it stays sunny all day.", "chinese": "是的！我希望一整天都是晴天。"},
                        {"role": "小军", "text": "Me too. Do you like rainy days?", "chinese": "我也是。你喜欢下雨天吗？"},
                        {"role": "小芳", "text": "Sometimes. I like staying at home and reading on rainy days.", "chinese": "有时候喜欢。下雨天我喜欢待在家里看书。"}
                    ]
                },
                {
                    "id": "d6",
                    "title": "谈论学校",
                    "scene": "新生入学",
                    "roles": ["学生", "老师"],
                    "content": [
                        {"role": "老师", "text": "Welcome to our school! My name is Ms. Wang.", "chinese": "欢迎来到我们学校！我姓王。"},
                        {"role": "学生", "text": "Thank you, Ms. Wang. I'm Zhang Wei.", "chinese": "谢谢王老师。我叫张伟。"},
                        {"role": "老师", "text": "Nice to meet you, Zhang Wei. Do you have any questions?", "chinese": "很高兴认识你，张伟。你有什么问题吗？"},
                        {"role": "学生", "text": "Yes, where is the library?", "chinese": "有，图书馆在哪里？"},
                        {"role": "老师", "text": "The library is on the second floor. I'll show you later.", "chinese": "图书馆在二楼。我稍后带你去。"}
                    ]
                },
                {
                    "id": "d7",
                    "title": "日常活动",
                    "scene": "放学回家路上",
                    "roles": ["小李", "小张"],
                    "content": [
                        {"role": "小李", "text": "What time do you usually get up?", "chinese": "你通常几点起床？"},
                        {"role": "小张", "text": "I get up at 7 o'clock every morning.", "chinese": "我每天早上7点起床。"},
                        {"role": "小李", "text": "Do you have breakfast at home?", "chinese": "你在家吃早餐吗？"},
                        {"role": "小张", "text": "Yes, my mom makes breakfast for me.", "chinese": "是的，我妈妈给我做早餐。"},
                        {"role": "小李", "text": "That's great! I usually have bread and milk.", "chinese": "真好！我通常吃面包和牛奶。"}
                    ]
                },
                {
                    "id": "d8",
                    "title": "周末计划",
                    "scene": "周五下午",
                    "roles": ["小王", "小刘"],
                    "content": [
                        {"role": "小王", "text": "What are you going to do this weekend?", "chinese": "这个周末你打算做什么？"},
                        {"role": "小刘", "text": "I'm going to visit my grandparents.", "chinese": "我打算去看望我的祖父母。"},
                        {"role": "小王", "text": "Sounds nice! Do you visit them often?", "chinese": "听起来不错！你经常去看望他们吗？"},
                        {"role": "小刘", "text": "Yes, I go every weekend. What about you?", "chinese": "是的，我每个周末都去。你呢？"},
                        {"role": "小王", "text": "I'm going to the zoo with my family.", "chinese": "我要和家人一起去动物园。"}
                    ]
                }
            ]
        };
    },

    speakChinese(text) {
        return new Promise((resolve, reject) => {
            if ('speechSynthesis' in window) {
                const utterance = new SpeechSynthesisUtterance(text);
                utterance.lang = 'zh-CN';
                utterance.rate = 0.9;
                utterance.onend = resolve;
                utterance.onerror = reject;
                speechSynthesis.speak(utterance);
            } else {
                reject(new Error('浏览器不支持语音合成'));
            }
        });
    },

    async getMathTopics() {
        return {
            "topics": [
                {
                    "id": "m1",
                    "title": "一元一次方程",
                    "description": "只含有一个未知数，并且未知数的次数是1的方程",
                    "rules": [
                        {"rule": "移项：把含未知数的项移到一边，常数项移到另一边", "example": "2x + 3 = 7 → 2x = 7 - 3"},
                        {"rule": "合并同类项：将同类项合并", "example": "3x - 2x = x"},
                        {"rule": "系数化为1：两边同时除以未知数的系数", "example": "2x = 4 → x = 2"}
                    ],
                    "examples": ["2x + 5 = 11", "3x - 4 = 8", "5(x + 2) = 25"],
                    "exercises": [
                        {"question": "解方程：2x + 5 = 11，x = ?", "options": ["2", "3", "4", "5"], "answer": "3"},
                        {"question": "解方程：3x - 4 = 8，x = ?", "options": ["3", "4", "5", "6"], "answer": "4"},
                        {"question": "解方程：5(x + 2) = 25，x = ?", "options": ["2", "3", "4", "5"], "answer": "3"},
                        {"question": "解方程：4x - 3 = 9，x = ?", "options": ["2", "3", "4", "5"], "answer": "3"},
                        {"question": "解方程：2(x - 1) = 6，x = ?", "options": ["2", "3", "4", "5"], "answer": "4"}
                    ]
                },
                {
                    "id": "m2",
                    "title": "一元一次不等式",
                    "description": "表示两个量之间大小关系的式子，只含有一个未知数",
                    "rules": [
                        {"rule": "不等式两边同时加或减同一个数，不等号方向不变", "example": "x + 3 > 5 → x > 2"},
                        {"rule": "不等式两边同时乘或除以同一个正数，不等号方向不变", "example": "2x < 10 → x < 5"},
                        {"rule": "不等式两边同时乘或除以同一个负数，不等号方向改变", "example": "-2x > 6 → x < -3"}
                    ],
                    "examples": ["x + 3 > 7", "2x < 10", "-3x ≥ 9"],
                    "exercises": [
                        {"question": "解不等式：x + 3 > 7，x > ?", "options": ["3", "4", "5", "6"], "answer": "4"},
                        {"question": "解不等式：2x < 10，x < ?", "options": ["4", "5", "6", "7"], "answer": "5"},
                        {"question": "解不等式：-3x ≥ 9，x ≤ ?", "options": ["-3", "-2", "-1", "0"], "answer": "-3"},
                        {"question": "解不等式：4x - 2 > 10，x > ?", "options": ["2", "3", "4", "5"], "answer": "3"},
                        {"question": "解不等式：-2x + 5 ≤ 1，x ≥ ?", "options": ["1", "2", "3", "4"], "answer": "2"}
                    ]
                },
                {
                    "id": "m3",
                    "title": "几何图形",
                    "description": "三角形、矩形、圆形等基本图形的性质",
                    "rules": [
                        {"rule": "三角形内角和等于180度", "example": "∠A + ∠B + ∠C = 180°"},
                        {"rule": "矩形的对边相等，四个角都是直角", "example": "AB = CD, AD = BC"},
                        {"rule": "正方形的四条边都相等，四个角都是直角", "example": "AB = BC = CD = DA"}
                    ],
                    "examples": ["三角形内角和180°", "矩形对边相等", "正方形四条边相等"],
                    "exercises": [
                        {"question": "三角形内角和等于多少度？", "options": ["90°", "180°", "270°", "360°"], "answer": "180°"},
                        {"question": "正方形有几条边？", "options": ["3", "4", "5", "6"], "answer": "4"},
                        {"question": "矩形的对边有什么特点？", "options": ["不相等", "相等", "垂直", "平行"], "answer": "相等"},
                        {"question": "等边三角形的三条边有什么特点？", "options": ["都不相等", "都相等", "两条相等", "不确定"], "answer": "都相等"},
                        {"question": "圆的周长公式是什么？", "options": ["πr", "2πr", "πr²", "2πr²"], "answer": "2πr"}
                    ]
                },
                {
                    "id": "m4",
                    "title": "有理数运算",
                    "description": "正数、负数和零的加减乘除运算",
                    "rules": [
                        {"rule": "同号两数相加，取相同的符号，并把绝对值相加", "example": "(-3) + (-5) = -8"},
                        {"rule": "异号两数相加，取绝对值较大的符号，并用较大绝对值减去较小绝对值", "example": "(-3) + 5 = 2"},
                        {"rule": "两数相乘，同号得正，异号得负，并把绝对值相乘", "example": "4 × (-2) = -8"}
                    ],
                    "examples": ["(-3) + 5 = 2", "4 × (-2) = -8", "(-6) ÷ (-3) = 2"],
                    "exercises": [
                        {"question": "(-5) + 8 = ?", "options": ["2", "3", "4", "5"], "answer": "3"},
                        {"question": "6 × (-2) = ?", "options": ["-12", "-6", "6", "12"], "answer": "-12"},
                        {"question": "(-9) ÷ (-3) = ?", "options": ["-3", "-1", "1", "3"], "answer": "3"},
                        {"question": "10 - (-5) = ?", "options": ["3", "5", "15", "20"], "answer": "15"},
                        {"question": "(-4) × (-5) = ?", "options": ["-20", "-9", "9", "20"], "answer": "20"}
                    ]
                },
                {
                    "id": "m5",
                    "title": "整式的加减",
                    "description": "单项式和多项式的加减运算",
                    "rules": [
                        {"rule": "同类项：所含字母相同，并且相同字母的指数也相同的项", "example": "3x和5x是同类项"},
                        {"rule": "合并同类项：把同类项的系数相加，字母和指数不变", "example": "3x + 5x = 8x"},
                        {"rule": "去括号：括号前是正号，括号内各项不变号；括号前是负号，括号内各项变号", "example": "a - (b - c) = a - b + c"}
                    ],
                    "examples": ["3x + 5x = 8x", "2a - 3a = -a", "5(x + 2) = 5x + 10"],
                    "exercises": [
                        {"question": "3x + 5x = ?", "options": ["6x", "7x", "8x", "9x"], "answer": "8x"},
                        {"question": "2a - 3a = ?", "options": ["-a", "a", "5a", "-5a"], "answer": "-a"},
                        {"question": "5(x + 2) = ?", "options": ["5x + 2", "5x + 10", "5x - 2", "5x - 10"], "answer": "5x + 10"},
                        {"question": "a - (b - c) = ?", "options": ["a - b - c", "a - b + c", "a + b - c", "a + b + c"], "answer": "a - b + c"},
                        {"question": "2x² + 3x² = ?", "options": ["5x²", "5x⁴", "6x²", "6x⁴"], "answer": "5x²"}
                    ]
                }
            ]
        };
    },

    async getChinesePoems() {
        return {
            "poems": [
                {
                    "id": "c1",
                    "title": "静夜思",
                    "author": "李白",
                    "dynasty": "唐",
                    "content": ["床前明月光", "疑是地上霜", "举头望明月", "低头思故乡"],
                    "explanation": "这首诗描写了诗人在寂静的月夜思念家乡的情感。诗的前两句写诗人在作客他乡的特定环境中一刹那间产生的错觉，后两句通过动作神态的刻画，深化思乡之情。",
                    "keyPoints": ["明月光：明亮的月光", "疑：怀疑，以为", "举头：抬头", "故乡：家乡"]
                },
                {
                    "id": "c2",
                    "title": "春晓",
                    "author": "孟浩然",
                    "dynasty": "唐",
                    "content": ["春眠不觉晓", "处处闻啼鸟", "夜来风雨声", "花落知多少"],
                    "explanation": "这首诗描绘了春天早晨的美好景象。诗人抓住春天的早晨刚刚醒来时的一瞬间展开联想，描绘了一幅春天早晨绚丽的图景，抒发了诗人热爱春天、珍惜春光的美好心情。",
                    "keyPoints": ["春眠：春天的睡眠", "不觉：不知不觉", "啼鸟：鸟的啼叫声", "夜来：昨夜"]
                },
                {
                    "id": "c3",
                    "title": "登鹳雀楼",
                    "author": "王之涣",
                    "dynasty": "唐",
                    "content": ["白日依山尽", "黄河入海流", "欲穷千里目", "更上一层楼"],
                    "explanation": "这首诗写诗人在登高望远中表现出来的不凡的胸襟抱负。前两句写景，把上下、远近、东西的景物都容纳其中；后两句写意，写的出人意料，把哲理与景物、情势溶化得天衣无缝。",
                    "keyPoints": ["白日：太阳", "依：依傍，靠着", "尽：消失", "欲：想要", "穷：尽"]
                },
                {
                    "id": "c4",
                    "title": "悯农（其二）",
                    "author": "李绅",
                    "dynasty": "唐",
                    "content": ["锄禾日当午", "汗滴禾下土", "谁知盘中餐", "粒粒皆辛苦"],
                    "explanation": "这首诗描写了农民在烈日下辛勤劳作的场景，告诫人们要珍惜粮食，尊重劳动人民。语言朴实无华，浅显易懂，但却十分感人。",
                    "keyPoints": ["锄禾：用锄头除去禾苗周围的杂草", "日当午：太阳当头照的时候", "盘中餐：碗里的饭食", "粒粒：每一粒"]
                },
                {
                    "id": "c5",
                    "title": "咏鹅",
                    "author": "骆宾王",
                    "dynasty": "唐",
                    "content": ["鹅鹅鹅", "曲项向天歌", "白毛浮绿水", "红掌拨清波"],
                    "explanation": "这首诗相传是骆宾王七岁时所作，描写了白鹅在水中游玩的情景。诗中色彩鲜艳，形象生动，表现了儿童天真活泼的情趣。",
                    "keyPoints": ["曲项：弯曲的脖子", "向天歌：向着天空歌唱", "白毛：白色的羽毛", "红掌：红色的脚掌"]
                },
                {
                    "id": "c6",
                    "title": "江雪",
                    "author": "柳宗元",
                    "dynasty": "唐",
                    "content": ["千山鸟飞绝", "万径人踪灭", "孤舟蓑笠翁", "独钓寒江雪"],
                    "explanation": "这首诗描写了一幅冰天雪地的江面上一位渔翁独自垂钓的画面。诗人借孤舟独钓的渔翁形象，寄托了自己清高孤傲的情感。",
                    "keyPoints": ["绝：绝迹", "万径：所有的小路", "人踪：人的脚印", "蓑笠翁：披蓑衣戴斗笠的老人"]
                },
                {
                    "id": "c7",
                    "title": "望庐山瀑布",
                    "author": "李白",
                    "dynasty": "唐",
                    "content": ["日照香炉生紫烟", "遥看瀑布挂前川", "飞流直下三千尺", "疑是银河落九天"],
                    "explanation": "这首诗形象地描绘了庐山瀑布雄奇壮丽的景色。诗人运用了比喻、夸张等修辞手法，将瀑布比作银河，表现了瀑布飞流直下的壮观景象。",
                    "keyPoints": ["香炉：香炉峰", "紫烟：紫色的云雾", "遥看：远远看去", "飞流：飞泻的水流", "九天：天的最高处"]
                },
                {
                    "id": "c8",
                    "title": "早发白帝城",
                    "author": "李白",
                    "dynasty": "唐",
                    "content": ["朝辞白帝彩云间", "千里江陵一日还", "两岸猿声啼不住", "轻舟已过万重山"],
                    "explanation": "这首诗是李白流放遇赦返回时所作，描写了从白帝城到江陵一路的壮丽景色和诗人轻快的心情。诗中运用了夸张和对比的手法，表现了船行的速度之快。",
                    "keyPoints": ["朝辞：早晨告别", "白帝：白帝城", "彩云间：彩云缭绕之间", "啼不住：不停地啼叫", "万重山：层层叠叠的山峦"]
                }
            ]
        };
    },

    async getChineseReading() {
        return {
            "articles": [
                {
                    "id": "cr1",
                    "title": "秋天的田野",
                    "content": "秋天来了，田野里一片金黄。稻穗沉甸甸的，好像在向人们点头。农民伯伯们忙着收割，脸上洋溢着丰收的喜悦。果园里，苹果红了，梨子黄了，葡萄紫了。小朋友们在树下捡落叶，有的做成书签，有的拼成图案。秋天真是一个美丽又丰收的季节！",
                    "questions": [
                        {"question": "文章描写的是什么季节？", "options": ["春天", "夏天", "秋天", "冬天"], "answer": "秋天"},
                        {"question": "稻穗是什么颜色的？", "options": ["绿色", "金黄", "红色", "紫色"], "answer": "金黄"},
                        {"question": "果园里的苹果是什么颜色？", "options": ["黄色", "红色", "紫色", "绿色"], "answer": "红色"},
                        {"question": "小朋友们用落叶做什么？", "options": ["做饭", "做书签", "做衣服", "做玩具"], "answer": "做书签"}
                    ],
                    "keyPoints": ["洋溢：充分流露", "沉甸甸：形容很重", "收割：收获庄稼"]
                },
                {
                    "id": "cr2",
                    "title": "可爱的小猫",
                    "content": "我家有一只可爱的小猫，它的名字叫咪咪。咪咪的毛是白色的，像雪一样白。它的眼睛圆圆的，晚上会发出绿色的光。咪咪喜欢吃鱼，每次看到鱼都会喵喵叫。它还喜欢玩毛线球，常常把自己缠在毛线团里。咪咪是我的好朋友，我非常喜欢它。",
                    "questions": [
                        {"question": "小猫的名字叫什么？", "options": ["花花", "咪咪", "白白", "球球"], "answer": "咪咪"},
                        {"question": "小猫的毛是什么颜色？", "options": ["黑色", "黄色", "白色", "灰色"], "answer": "白色"},
                        {"question": "小猫喜欢吃什么？", "options": ["骨头", "鱼", "米饭", "蔬菜"], "answer": "鱼"},
                        {"question": "小猫喜欢玩什么？", "options": ["球", "毛线球", "玩具车", "积木"], "answer": "毛线球"}
                    ],
                    "keyPoints": ["圆圆：形容很圆", "喵喵叫：猫的叫声", "缠：绕在一起"]
                },
                {
                    "id": "cr3",
                    "title": "春雨",
                    "content": "春天来了，春雨也来了。细细的春雨像牛毛，像花针，轻轻地落在地上。小草喝饱了水，长得更绿了。花儿洗了澡，开得更艳了。小朋友们打着五颜六色的雨伞，在雨中快乐地玩耍。春雨滋润着大地，让春天变得更加美丽。",
                    "questions": [
                        {"question": "春雨是什么样子的？", "options": ["大大的", "细细的", "红红的", "圆圆的"], "answer": "细细的"},
                        {"question": "春雨像什么？", "options": ["牛毛", "石头", "树叶", "花朵"], "answer": "牛毛"},
                        {"question": "小草喝饱水后怎么样了？", "options": ["变黄了", "长得更绿了", "长高了", "枯萎了"], "answer": "长得更绿了"},
                        {"question": "小朋友们打着什么？", "options": ["帽子", "雨伞", "雨衣", "围巾"], "answer": "雨伞"}
                    ],
                    "keyPoints": ["滋润：使湿润", "五颜六色：各种颜色", "轻轻地：动作很轻"]
                },
                {
                    "id": "cr4",
                    "title": "勇敢的小蚂蚁",
                    "content": "一天，小蚂蚁发现了一块很大的面包。它想把面包搬回家，可是面包太重了，它搬不动。于是，小蚂蚁跑回蚁穴，叫来许多同伴。大家一起用力，终于把面包搬回了家。这个故事告诉我们：团结就是力量，只要大家齐心协力，就能完成看似不可能的任务。",
                    "questions": [
                        {"question": "小蚂蚁发现了什么？", "options": ["糖果", "面包", "饼干", "蛋糕"], "answer": "面包"},
                        {"question": "小蚂蚁自己能搬动面包吗？", "options": ["能", "不能", "不知道", "可能"], "answer": "不能"},
                        {"question": "小蚂蚁叫来了谁帮忙？", "options": ["小鸟", "同伴", "蜜蜂", "蝴蝶"], "answer": "同伴"},
                        {"question": "这个故事告诉我们什么道理？", "options": ["自私自利", "团结就是力量", "独自奋斗", "放弃努力"], "answer": "团结就是力量"}
                    ],
                    "keyPoints": ["齐心协力：大家一起努力", "力量：力气，能力", "任务：要完成的工作"]
                }
            ]
        };
    },

    async getChineseVocabulary() {
        return {
            "words": [
                {"word": "思念", "pinyin": "sī niàn", "meaning": "想念", "example": "我思念远方的亲人。", "partOfSpeech": "动词"},
                {"word": "喜悦", "pinyin": "xǐ yuè", "meaning": "高兴、愉快", "example": "他脸上洋溢着喜悦的笑容。", "partOfSpeech": "名词"},
                {"word": "洋溢", "pinyin": "yáng yì", "meaning": "充分流露、充满", "example": "节日的气氛洋溢在整个城市。", "partOfSpeech": "动词"},
                {"word": "珍惜", "pinyin": "zhēn xī", "meaning": "重视并爱护", "example": "我们要珍惜时间。", "partOfSpeech": "动词"},
                {"word": "辛勤", "pinyin": "xīn qín", "meaning": "辛苦勤劳", "example": "农民伯伯辛勤地劳作。", "partOfSpeech": "形容词"},
                {"word": "壮丽", "pinyin": "zhuàng lì", "meaning": "雄伟美丽", "example": "祖国的山河多么壮丽！", "partOfSpeech": "形容词"},
                {"word": "温馨", "pinyin": "wēn xīn", "meaning": "温暖亲切", "example": "家里充满了温馨的气氛。", "partOfSpeech": "形容词"},
                {"word": "勇敢", "pinyin": "yǒng gǎn", "meaning": "不怕困难和危险", "example": "他是一个勇敢的孩子。", "partOfSpeech": "形容词"},
                {"word": "团结", "pinyin": "tuán jié", "meaning": "为了共同的目标而联合起来", "example": "团结就是力量。", "partOfSpeech": "名词"},
                {"word": "努力", "pinyin": "nǔ lì", "meaning": "把力量尽量使出来", "example": "我们要努力学习。", "partOfSpeech": "动词"},
                {"word": "智慧", "pinyin": "zhì huì", "meaning": "辨析判断、发明创造的能力", "example": "他用智慧解决了问题。", "partOfSpeech": "名词"},
                {"word": "诚实", "pinyin": "chéng shí", "meaning": "言行跟内心思想一致，不虚假", "example": "做人要诚实。", "partOfSpeech": "形容词"},
                {"word": "善良", "pinyin": "shàn liáng", "meaning": "心地纯洁，没有恶意", "example": "她是一个善良的人。", "partOfSpeech": "形容词"},
                {"word": "感恩", "pinyin": "gǎn ēn", "meaning": "对别人所给的帮助表示感激", "example": "我们要学会感恩。", "partOfSpeech": "动词"},
                {"word": "梦想", "pinyin": "mèng xiǎng", "meaning": "对未来的美好想象和希望", "example": "每个人都有自己的梦想。", "partOfSpeech": "名词"}
            ]
        };
    },

    async getMathPuzzles() {
        return {
            "puzzles": [
                {"question": "一个数加上8等于15，这个数是多少？", "answer": "7", "hint": "用15减去8", "difficulty": "简单"},
                {"question": "小明有5个苹果，小红比小明多3个，小红有几个？", "answer": "8", "hint": "用5加上3", "difficulty": "简单"},
                {"question": "3个小朋友分12个糖果，每人分几个？", "answer": "4", "hint": "用12除以3", "difficulty": "简单"},
                {"question": "一根绳子长20米，剪成4段，每段长多少米？", "answer": "5", "hint": "用20除以4", "difficulty": "简单"},
                {"question": "一本书有36页，每天看6页，几天看完？", "answer": "6", "hint": "用36除以6", "difficulty": "简单"},
                {"question": "爸爸今年35岁，儿子今年5岁，爸爸的年龄是儿子的几倍？", "answer": "7", "hint": "用35除以5", "difficulty": "中等"},
                {"question": "有两盒铅笔，一盒有8支，另一盒有12支，一共有多少支？", "answer": "20", "hint": "用8加上12", "difficulty": "中等"},
                {"question": "商店里有45个书包，卖出20个，还剩多少个？", "answer": "25", "hint": "用45减去20", "difficulty": "中等"},
                {"question": "一个长方形的长是8厘米，宽是5厘米，周长是多少厘米？", "answer": "26", "hint": "(长+宽)×2", "difficulty": "中等"},
                {"question": "一只青蛙一天吃30只害虫，5天吃多少只害虫？", "answer": "150", "hint": "用30乘以5", "difficulty": "中等"}
            ]
        };
    }
};
