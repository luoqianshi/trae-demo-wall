const SubjectConfig = {
    english: { name: '英语', icon: 'fa-language', color: '#3b82f6', gradient: 'linear-gradient(135deg, #3b82f6, #1d4ed8)' },
    math: { name: '数学', icon: 'fa-calculator', color: '#10b981', gradient: 'linear-gradient(135deg, #10b981, #059669)' },
    chinese: { name: '语文', icon: 'fa-book-open', color: '#f59e0b', gradient: 'linear-gradient(135deg, #f59e0b, #d97706)' }
};
const QuestionTypes = {
    english: [
        { id: 'phonetics', name: '音标学习', icon: 'fa-volume-up', desc: '48个国际音标发音练习', difficulty: 'easy' },
        { id: 'vocab', name: '单词词组', icon: 'fa-spell-check', desc: '核心词汇、短语、固定搭配', difficulty: 'easy' },
        { id: 'grammar', name: '语法选择', icon: 'fa-check-square', desc: '时态、句型、语法点辨析', difficulty: 'medium' },
        { id: 'listening', name: '听力理解', icon: 'fa-headphones', desc: '数字、时间、对话、短文听力', difficulty: 'medium' },
        { id: 'speaking', name: '口语跟读', icon: 'fa-microphone', desc: '发音、语调、流利度训练', difficulty: 'medium' },
        { id: 'reading', name: '时事阅读', icon: 'fa-newspaper', desc: '紧跟热点的短文阅读理解', difficulty: 'hard' },
        { id: 'cloze', name: '完形填空', icon: 'fa-puzzle-piece', desc: '语篇理解与词汇综合运用', difficulty: 'hard' },
        { id: 'translation', name: '英汉互译', icon: 'fa-exchange-alt', desc: '句子翻译与书面表达', difficulty: 'hard' }
    ],
    math: [
        { id: 'concept', name: '概念辨析', icon: 'fa-lightbulb', desc: '基本概念、定义、性质判断', difficulty: 'easy' },
        { id: 'calculate', name: '计算训练', icon: 'fa-calculator', desc: '有理数、整式、方程计算', difficulty: 'easy' },
        { id: 'choice', name: '选择题', icon: 'fa-check-circle', desc: '知识点综合考查', difficulty: 'medium' },
        { id: 'fillblank', name: '填空题', icon: 'fa-edit', desc: '计算、推理、应用填空', difficulty: 'medium' },
        { id: 'application', name: '应用题', icon: 'fa-wordpress-simple', desc: '行程、工程、利润、等积变形', difficulty: 'hard' },
        { id: 'proof', name: '规律探究', icon: 'fa-flask', desc: '几何规律、数字规律探究', difficulty: 'hard' }
    ],
    chinese: [
        { id: 'ziyin', name: '字音字形', icon: 'fa-font', desc: '易错字、多音字、形近字辨析', difficulty: 'easy' },
        { id: 'chengyu', name: '词语成语', icon: 'fa-comment-dots', desc: '词语辨析、成语正确使用', difficulty: 'easy' },
        { id: 'bingju', name: '病句标点', icon: 'fa-exclamation-triangle', desc: '常见病句、标点符号修改', difficulty: 'medium' },
        { id: 'gushi', name: '古诗词', icon: 'fa-feather-alt', desc: '诗词背诵、理解、赏析', difficulty: 'medium' },
        { id: 'wenyan', name: '文言文', icon: 'fa-scroll', desc: '实词、虚词、翻译、文意理解', difficulty: 'hard' },
        { id: 'xiandai', name: '现代文阅读', icon: 'fa-book-reader', desc: '记叙文、散文阅读理解', difficulty: 'hard' }
    ]
};
const KnowledgeBase = { english: [], math: [], chinese: [] };
function addQuestion(subject, type, question) {
    question.subject = subject;
    question.type = type;
    question.id = `${subject}_${type}_${KnowledgeBase[subject].filter(q => q.type === type).length + 1}`;
    KnowledgeBase[subject].push(question);
}
const Phonemes = [
    { symbol: '/iː/', example: 'see' }, { symbol: '/ɪ/', example: 'sit' }, { symbol: '/e/', example: 'bed' },
    { symbol: '/æ/', example: 'bad' }, { symbol: '/ɑː/', example: 'car' }, { symbol: '/ɒ/', example: 'hot' },
    { symbol: '/ɔː/', example: 'four' }, { symbol: '/ʊ/', example: 'book' }, { symbol: '/uː/', example: 'food' },
    { symbol: '/ʌ/', example: 'cup' }, { symbol: '/ɜː/', example: 'bird' }, { symbol: '/ə/', example: 'about' },
    { symbol: '/eɪ/', example: 'day' }, { symbol: '/aɪ/', example: 'my' }, { symbol: '/ɔɪ/', example: 'boy' },
    { symbol: '/aʊ/', example: 'now' }, { symbol: '/əʊ/', example: 'go' }, { symbol: '/ɪə/', example: 'ear' },
    { symbol: '/eə/', example: 'air' }, { symbol: '/ʊə/', example: 'tour' },
    { symbol: '/p/', example: 'pen' }, { symbol: '/b/', example: 'bad' }, { symbol: '/t/', example: 'tea' },
    { symbol: '/d/', example: 'day' }, { symbol: '/k/', example: 'cat' }, { symbol: '/g/', example: 'go' },
    { symbol: '/f/', example: 'five' }, { symbol: '/v/', example: 'very' }, { symbol: '/θ/', example: 'think' },
    { symbol: '/ð/', example: 'this' }, { symbol: '/s/', example: 'see' }, { symbol: '/z/', example: 'zoo' },
    { symbol: '/ʃ/', example: 'she' }, { symbol: '/ʒ/', example: 'measure' }, { symbol: '/h/', example: 'hat' },
    { symbol: '/m/', example: 'man' }, { symbol: '/n/', example: 'no' }, { symbol: '/ŋ/', example: 'sing' },
    { symbol: '/l/', example: 'love' }, { symbol: '/r/', example: 'red' }, { symbol: '/w/', example: 'we' },
    { symbol: '/j/', example: 'yes' }, { symbol: '/tʃ/', example: 'chair' }, { symbol: '/dʒ/', example: 'jam' },
    { symbol: '/tr/', example: 'tree' }, { symbol: '/dr/', example: 'dream' }, { symbol: '/ts/', example: 'cats' },
    { symbol: '/dz/', example: 'beds' }
];
Phonemes.forEach((p, i) => {
    const distractors = [];
    for (let j = 1; j <= 3; j++) {
        distractors.push(Phonemes[(i + j * 5) % Phonemes.length].example);
    }
    addQuestion('english', 'phonetics', {
        topic: '国际音标 ' + p.symbol,
        difficulty: 'beginner',
        tags: ['音标', '发音'],
        question: `这个音标怎么读？ <span style="font-size:36px;color:#60a5fa;font-family:'Arial Unicode MS',serif;font-weight:700;">${p.symbol}</span>`,
        phonetic: p.symbol,
        speakText: p.example,
        options: [
            { text: p.example, correct: true },
            { text: distractors[0], correct: false },
            { text: distractors[1], correct: false },
            { text: distractors[2], correct: false }
        ].sort(() => Math.random() - 0.5),
        hints: [
            '点击喇叭按钮听发音',
            '注意舌位、唇形和长短音',
            `找一找单词 "${p.example}" 中哪个部分发这个音`
        ],
        explanation: `音标 ${p.symbol} 在单词 "${p.example}" 中发这个音。多听多模仿是掌握音标的最好方法！可以对着镜子看自己的口型。`
    });
});
const EnglishVocab = [
    { en: 'favorite', zh: '最喜欢的', phonetic: '/ˈfeɪvərɪt/', example: 'My favorite subject is English.', exampleZh: '我最喜欢的科目是英语。' },
    { en: 'because', zh: '因为', phonetic: '/bɪˈkɒz/', example: 'I like pandas because they are cute.', exampleZh: '我喜欢熊猫因为它们很可爱。' },
    { en: 'subject', zh: '科目；主题', phonetic: '/ˈsʌbdʒɪkt/', example: 'How many subjects do you have?', exampleZh: '你有多少门科目？' },
    { en: 'science', zh: '科学', phonetic: '/ˈsaɪəns/', example: 'Science is very interesting.', exampleZh: '科学非常有趣。' },
    { en: 'geography', zh: '地理', phonetic: '/dʒiˈɒɡrəfi/', example: 'We learn about maps in geography class.', exampleZh: '我们在地理课上学地图。' },
    { en: 'history', zh: '历史', phonetic: '/ˈhɪstri/', example: 'History tells us about the past.', exampleZh: '历史告诉我们过去的事情。' },
    { en: 'breakfast', zh: '早餐', phonetic: '/ˈbrekfəst/', example: 'I have breakfast at 7 o\'clock.', exampleZh: '我7点吃早餐。' },
    { en: 'lunch', zh: '午餐', phonetic: '/lʌntʃ/', example: 'We have lunch at school.', exampleZh: '我们在学校吃午餐。' },
    { en: 'dinner', zh: '晚餐', phonetic: '/ˈdɪnə/', example: 'Family dinner is important.', exampleZh: '家庭晚餐很重要。' },
    { en: 'healthy', zh: '健康的', phonetic: '/ˈhelθi/', example: 'Vegetables are healthy food.', exampleZh: '蔬菜是健康食品。' },
    { en: 'delicious', zh: '美味的', phonetic: '/dɪˈlɪʃəs/', example: 'The cake is delicious!', exampleZh: '蛋糕太美味了！' },
    { en: 'difficult', zh: '困难的', phonetic: '/ˈdɪfɪkəlt/', example: 'Math is difficult but interesting.', exampleZh: '数学很难但很有趣。' },
    { en: 'interesting', zh: '有趣的', phonetic: '/ˈɪntrəstɪŋ/', example: 'This book is very interesting.', exampleZh: '这本书非常有趣。' },
    { en: 'boring', zh: '无聊的', phonetic: '/ˈbɔːrɪŋ/', example: 'The movie is boring.', exampleZh: '这部电影很无聊。' },
    { en: 'relaxing', zh: '令人放松的', phonetic: '/rɪˈlæksɪŋ/', example: 'Music is relaxing.', exampleZh: '音乐令人放松。' },
    { en: 'vegetable', zh: '蔬菜', phonetic: '/ˈvedʒtəbl/', example: 'Eat more vegetables.', exampleZh: '多吃蔬菜。' },
    { en: 'fruit', zh: '水果', phonetic: '/fruːt/', example: 'Apples are my favorite fruit.', exampleZh: '苹果是我最喜欢的水果。' },
    { en: 'hamburger', zh: '汉堡包', phonetic: '/ˈhæmbɜːɡə/', example: 'I want a hamburger.', exampleZh: '我想要一个汉堡包。' },
    { en: 'tomato', zh: '西红柿', phonetic: '/təˈmɑːtəʊ/', example: 'Tomatoes are red.', exampleZh: '西红柿是红色的。' },
    { en: 'strawberry', zh: '草莓', phonetic: '/ˈstrɔːbəri/', example: 'Strawberries are sweet.', exampleZh: '草莓很甜。' },
    { en: 'birthday', zh: '生日', phonetic: '/ˈbɜːθdeɪ/', example: 'Happy birthday to you!', exampleZh: '祝你生日快乐！' },
    { en: 'festival', zh: '节日', phonetic: '/ˈfestɪvl/', example: 'Spring Festival is important in China.', exampleZh: '春节在中国很重要。' },
    { en: 'student', zh: '学生', phonetic: '/ˈstjuːdnt/', example: 'I am a middle school student.', exampleZh: '我是一名中学生。' },
    { en: 'teacher', zh: '老师', phonetic: '/ˈtiːtʃə/', example: 'Our English teacher is very kind.', exampleZh: '我们的英语老师很和蔼。' },
    { en: 'classmate', zh: '同学', phonetic: '/ˈklɑːsmeɪt/', example: 'My classmates are friendly.', exampleZh: '我的同学们很友好。' },
    { en: 'busy', zh: '忙碌的', phonetic: '/ˈbɪzi/', example: 'I am busy with my homework.', exampleZh: '我忙着做作业。' },
    { en: 'free', zh: '空闲的；免费的', phonetic: '/friː/', example: 'Are you free this afternoon?', exampleZh: '你今天下午有空吗？' },
    { en: 'useful', zh: '有用的', phonetic: '/ˈjuːsfl/', example: 'English is very useful.', exampleZh: '英语很有用。' },
    { en: 'after', zh: '在...之后', phonetic: '/ˈɑːftə/', example: 'After class, we play basketball.', exampleZh: '下课后我们打篮球。' },
    { en: 'finish', zh: '完成；结束', phonetic: '/ˈfɪnɪʃ/', example: 'School finishes at 4:30.', exampleZh: '学校4:30放学。' },
    { en: 'lesson', zh: '课；一节课', phonetic: '/ˈlesn/', example: 'We have 8 lessons a day.', exampleZh: '我们一天有8节课。' },
    { en: 'hour', zh: '小时', phonetic: '/ˈaʊə/', example: 'An hour has 60 minutes.', exampleZh: '一小时有60分钟。' },
    { en: 'practice', zh: '练习', phonetic: '/ˈpræktɪs/', example: 'I practice speaking English every day.', exampleZh: '我每天练习说英语。' },
    { en: 'remember', zh: '记得；想起', phonetic: '/rɪˈmembə/', example: 'Remember to close the door.', exampleZh: '记得关门。' },
    { en: 'question', zh: '问题', phonetic: '/ˈkwestʃən/', example: 'May I ask you a question?', exampleZh: '我能问你一个问题吗？' },
    { en: 'answer', zh: '回答；答案', phonetic: '/ˈɑːnsə/', example: 'Can you answer this question?', exampleZh: '你能回答这个问题吗？' },
    { en: 'welcome', zh: '欢迎', phonetic: '/ˈwelkəm/', example: 'Welcome to our school!', exampleZh: '欢迎来到我们学校！' },
    { en: 'everyone', zh: '每人；人人', phonetic: '/ˈevriwʌn/', example: 'Everyone is here today.', exampleZh: '今天大家都到了。' },
    { en: 'sometimes', zh: '有时', phonetic: '/ˈsʌmtaɪmz/', example: 'Sometimes I go to school by bike.', exampleZh: '有时我骑自行车上学。' },
    { en: 'usually', zh: '通常', phonetic: '/ˈjuːʒuəli/', example: 'I usually get up at six.', exampleZh: '我通常六点起床。' }
];
EnglishVocab.forEach((v, i) => {
    const qType = i % 4;
    if (qType === 0) {
        const distractors = [];
        for (let j = 1; j <= 3; j++) {
            distractors.push(EnglishVocab[(i + j * 7) % EnglishVocab.length].zh);
        }
        addQuestion('english', 'vocab', {
            topic: v.en,
            difficulty: i < 20 ? 'beginner' : 'intermediate',
            tags: ['词汇', '单词'],
            question: `这个单词是什么意思？<br><div style="margin-top:12px;"><span style="font-size:32px;color:#60a5fa;font-weight:700;">${v.en}</span> <span style="color:var(--text-secondary);font-size:20px;">${v.phonetic}</span></div>`,
            speakText: v.en,
            options: [
                { text: v.zh, correct: true },
                { text: distractors[0], correct: false },
                { text: distractors[1], correct: false },
                { text: distractors[2], correct: false }
            ].sort(() => Math.random() - 0.5),
            hints: [
                '点击喇叭听发音，回忆一下在哪见过这个词',
                `例句：<br>"${v.example}"`,
                `想想它的词性，中文意思是"${v.zh.charAt(0)}..."`
            ],
            explanation: `<strong style="font-size:18px;">${v.en}</strong> ${v.phonetic}<br>意思：${v.zh}<br>📝 例句：${v.example}<br>翻译：${v.exampleZh}`
        });
    } else if (qType === 1) {
        const distractors = [];
        for (let j = 1; j <= 3; j++) {
            distractors.push(EnglishVocab[(i + j * 8) % EnglishVocab.length].en);
        }
        addQuestion('english', 'vocab', {
            topic: v.zh,
            difficulty: i < 20 ? 'beginner' : 'intermediate',
            tags: ['词汇', '拼写'],
            question: `"${v.zh}"对应的英语单词是？（提示：音标 ${v.phonetic}）`,
            options: [
                { text: v.en, correct: true },
                { text: distractors[0], correct: false },
                { text: distractors[1], correct: false },
                { text: distractors[2], correct: false }
            ].sort(() => Math.random() - 0.5),
            hints: [
                `根据音标 ${v.phonetic} 试着拼一下`,
                `例句提示：${v.example.replace(new RegExp(v.en, 'gi'), '_____')}`,
                `首字母是 "${v.en.charAt(0).toUpperCase()}"，共 ${v.en.length} 个字母`
            ],
            explanation: `<strong>${v.en}</strong> ${v.phonetic} = ${v.zh}<br>例句：${v.example}<br>翻译：${v.exampleZh}`
        });
    } else if (qType === 2) {
        const pattern = new RegExp(v.en, 'gi');
        const blanked = v.example.replace(pattern, v.en.charAt(0) + '____');
        addQuestion('english', 'vocab', {
            topic: v.en + ' 填空',
            difficulty: 'intermediate',
            tags: ['词汇', '运用'],
            typeInput: 'fill',
            question: `根据句子意思和首字母提示填空：<br><br><div style="font-size:18px;line-height:2;padding:16px;background:var(--bg-dark);border-radius:12px;">${blanked}</div><br>首字母：<strong style="color:#60a5fa;font-size:22px;">${v.en.charAt(0).toUpperCase()}</strong>`,
            answer: v.en.toLowerCase(),
            speakText: v.example,
            hints: [
                `💡 这句话的意思是："${v.exampleZh}"`,
                `这个词的意思是"${v.zh}"，音标是 ${v.phonetic}`,
                '再想想：结合首字母和句子语境'
            ],
            explanation: `正确答案是 <strong style="color:#60a5fa;font-size:20px;">${v.en}</strong><br><br>✅ 完整句子：${v.example}<br>翻译：${v.exampleZh}`
        });
    } else {
        addQuestion('english', 'vocab', {
            topic: v.en + ' 发音',
            difficulty: 'beginner',
            tags: ['词汇', '发音'],
            typeInput: 'speak',
            speakText: v.example,
            question: `请点击麦克风，跟读下面的句子（包含单词 ${v.en}）：`,
            displayText: v.example,
            hints: ['注意发音饱满','模仿语音语调','大声读出来'],
            explanation: `句子：${v.example}<br>翻译：${v.exampleZh}<br>单词 ${v.en} 读作 ${v.phonetic}`
        });
    }
});
const EnglishGrammar = [
    { topic: '一般现在时-三单', difficulty: 'beginner', tags: ['语法', '时态'], question: 'She ___ to school every day.', options: [{text:'go',correct:false},{text:'goes',correct:true},{text:'went',correct:false},{text:'going',correct:false}], hints:['主语 She 是第三人称单数','every day 表示经常性动作，用一般现在时','一般现在时三单动词要加s/es'], explanation:'一般现在时中，主语是第三人称单数（he/she/it/单数名词）时，谓语动词要加-s/-es。go的三单形式是goes（特殊变化）。' },
    { topic: '一般现在时-否定', difficulty: 'beginner', tags: ['语法', '时态'], question: 'I ___ like math. It\'s too difficult.', options: [{text:'am not',correct:false},{text:'don\'t',correct:true},{text:'doesn\'t',correct:false},{text:'not',correct:false}], hints:['like是实义动词，否定要借助助动词','主语是I，不是第三人称单数','一般现在时非三单否定用don\'t'], explanation:'一般现在时否定句：主语 + don\'t/doesn\'t + 动词原形。主语是I/you/we/they时用don\'t，三单主语用doesn\'t。' },
    { topic: '现在进行时', difficulty: 'intermediate', tags: ['语法', '时态'], question: 'Listen! The birds ___ in the tree.', options: [{text:'sing',correct:false},{text:'sings',correct:false},{text:'are singing',correct:true},{text:'sang',correct:false}], hints:['Listen! 是现在进行时的标志词','现在进行时结构：be + doing','主语birds是复数，be动词用are'], explanation:'Listen!/Look!/Be quiet!等提示词表明动作正在发生，用现在进行时（am/is/are + 动词ing）。主语复数用are。' },
    { topic: '现在进行时-否定', difficulty: 'intermediate', tags: ['语法', '时态'], question: 'Please be quiet. The baby ___.', options: [{text:'sleeps',correct:false},{text:'sleep',correct:false},{text:'is sleeping',correct:true},{text:'sleeping',correct:false}], hints:['"请安静"说明宝宝正在做什么？','现在进行时：be + V-ing','主语baby是单数'], explanation:'根据语境"请安静"，说明宝宝正在睡觉，用现在进行时is sleeping。' },
    { topic: '一般过去时-规则', difficulty: 'beginner', tags: ['语法', '时态'], question: 'Yesterday I ___ my homework at home.', options: [{text:'do',correct:false},{text:'does',correct:false},{text:'did',correct:true},{text:'doing',correct:false}], hints:['Yesterday是过去时间状语','用一般过去时','do的过去式是什么？'], explanation:'yesterday/last week/...ago等过去时间状语，用一般过去时。do的过去式是不规则变化did。' },
    { topic: '一般过去时-不规则', difficulty: 'intermediate', tags: ['语法', '时态'], question: 'We ___ to the park last weekend.', options: [{text:'go',correct:false},{text:'goes',correct:false},{text:'went',correct:true},{text:'goed',correct:false}], hints:['last weekend是过去时间','go是不规则动词','go的过去式不是goed哦'], explanation:'go的过去式是went（不规则变化，需要熟记）。常见不规则动词：go-went, do-did, have-had, eat-ate, see-saw。' },
    { topic: '一般过去时-否定疑问', difficulty: 'intermediate', tags: ['语法', '时态'], question: '— ___ you go to the party last night? — No, I ___.', options: [{text:'Did; didn\'t',correct:true},{text:'Do; don\'t',correct:false},{text:'Did; don\'t',correct:false},{text:'Do; didn\'t',correct:false}], hints:['last night是过去时间，助动词用did','用did问，用什么答？','答句时态要一致'], explanation:'一般过去时的一般疑问句：Did + 主语 + 动词原形？肯定回答Yes, ...did，否定回答No, ...didn\'t。' },
    { topic: '一般将来时-will', difficulty: 'intermediate', tags: ['语法', '时态'], question: 'I ___ visit my grandparents tomorrow.', options: [{text:'will',correct:true},{text:'am',correct:false},{text:'do',correct:false},{text:'did',correct:false}], hints:['tomorrow是将来时间','一般将来时：will + 动词原形','也可以用be going to结构'], explanation:'tomorrow/next week/in the future等将来时间，用一般将来时：will + 动词原形，或am/is/are going to + 动词原形。' },
    { topic: '一般将来时-be going to', difficulty: 'intermediate', tags: ['语法', '时态'], question: 'Look at the clouds! It ___ rain.', options: [{text:'will',correct:false},{text:'is going to',correct:true},{text:'shall',correct:false},{text:'will be',correct:false}], hints:['"看乌云"是有迹象表明要发生','be going to 表示有迹象/计划要发生','will表示临时决定，be going to表示有预兆'], explanation:'有迹象表明即将发生的事用be going to。乌云是下雨的迹象，所以用is going to rain。' },
    { topic: 'There be句型', difficulty: 'beginner', tags: ['语法', '句型'], question: '___ a book and two pens on the desk.', options: [{text:'There is',correct:true},{text:'There are',correct:false},{text:'Have',correct:false},{text:'Has',correct:false}], hints:['这是There be句型，表示"某地有某物"','There be遵循就近原则，看最近的名词','a book是单数'], explanation:'There be句型遵循"就近原则"：be动词由离它最近的名词决定。a book是单数，所以用There is。' },
    { topic: '情态动词can', difficulty: 'beginner', tags: ['语法', '情态动词'], question: '— Can you swim? — Yes, I ___.', options: [{text:'am',correct:false},{text:'can',correct:true},{text:'do',correct:false},{text:'don\'t',correct:false}], hints:['用什么提问就用什么回答','情态动词can问can答','这是一般疑问句的问答规则'], explanation:'Can引导的一般疑问句，肯定回答用"Yes, 主语 + can"，否定回答用"No, 主语 + can\'t"。' },
    { topic: '情态动词must', difficulty: 'intermediate', tags: ['语法', '情态动词'], question: 'You ___ eat in class. It\'s against the school rules.', options: [{text:'must',correct:false},{text:'mustn\'t',correct:true},{text:'can',correct:false},{text:'need',correct:false}], hints:['这是违反校规的，所以是"禁止"','must是必须，mustn\'t是什么意思？','mustn\'t表示禁止、不准'], explanation:'must表示"必须"，mustn\'t表示"禁止，不准"（不允许做）。can\'t表示"不可能"，needn\'t表示"不必"。上课吃东西是被禁止的。' },
    { topic: 'how many/how much', difficulty: 'intermediate', tags: ['语法', '疑问词'], question: '___ water do you drink every day?', options: [{text:'How many',correct:false},{text:'How much',correct:true},{text:'How long',correct:false},{text:'How often',correct:false}], hints:['water是可数还是不可数名词？','how many修饰可数名词复数','how much修饰不可数名词'], explanation:'how many + 可数名词复数，how much + 不可数名词。water是不可数名词，所以用How much。How long问多长/多久，How often问频率。' },
    { topic: '形容词比较级', difficulty: 'intermediate', tags: ['语法', '比较级'], question: 'Tom is ___ than his brother.', options: [{text:'tall',correct:false},{text:'taller',correct:true},{text:'tallest',correct:false},{text:'more tall',correct:false}], hints:['than是比较级的标志词','tall是单音节词，比较级怎么变？','单音节词一般在词尾加er'], explanation:'than表示两者比较，用比较级。单音节形容词+er：tall→taller, short→shorter, long→longer。多音节词前加more。' },
    { topic: '形容词最高级', difficulty: 'intermediate', tags: ['语法', '最高级'], question: 'This is the ___ movie I have ever seen.', options: [{text:'interesting',correct:false},{text:'more interesting',correct:false},{text:'most interesting',correct:true},{text:'interestinger',correct:false}], hints:['"我看过的...的电影"，三者以上比较用最高级','interesting是多音节词','多音节形容词最高级前加most'], explanation:'"the + 最高级 + 范围"表示"最...的"。多音节形容词（三个音节及以上）的比较级加more，最高级加most。' },
    { topic: '介词in/on/at', difficulty: 'beginner', tags: ['语法', '介词'], question: 'My birthday is ___ October 15th.', options: [{text:'in',correct:false},{text:'on',correct:true},{text:'at',correct:false},{text:'for',correct:false}], hints:['具体某一天前用什么介词？','in用于年月季节，on用于具体日期','October 15th是具体日期'], explanation:'时间介词：in+年/月/季节/泛指上下午；on+具体日期/星期/特定某天的上下午；at+具体时刻。' },
    { topic: '介词at', difficulty: 'beginner', tags: ['语法', '介词'], question: 'We usually get up ___ 6:30 in the morning.', options: [{text:'in',correct:false},{text:'on',correct:false},{text:'at',correct:true},{text:'to',correct:false}], hints:['具体几点几分前用什么介词？','at用于具体时刻','6:30是具体时间点'], explanation:'at用于具体时刻（几点几分）：at six, at 7:30, at noon, at night。' },
    { topic: '名词所有格', difficulty: 'beginner', tags: ['语法', '所有格'], question: 'This is ___ room. It\'s very clean.', options: [{text:'Tom',correct:false},{text:'Toms',correct:false},{text:'Tom\'s',correct:true},{text:'Toms\'',correct:false}], hints:['"汤姆的房间"需要用名词所有格','单数名词的所有格怎么构成？','一般在名词后加\'s'], explanation:'单数名词所有格在词尾加\'s，表示"某人的"：Tom\'s room = 汤姆的房间。以s结尾的复数名词只加\'，如Teachers\' Day。' },
    { topic: '特殊疑问词', difficulty: 'beginner', tags: ['语法', '疑问词'], question: '— ___ do you play basketball? — Three times a week.', options: [{text:'How long',correct:false},{text:'How often',correct:true},{text:'How many',correct:false},{text:'How soon',correct:false}], hints:['答语"一周三次"是在问什么？','How often问频率（多久一次）','How long问时长，How soon问多久以后'], explanation:'How often问频率（多久一次），答语是once/twice/three times a week等。' },
    { topic: '现在进行时vs一般现在时', difficulty: 'advanced', tags: ['语法', '时态'], question: 'Look! The boy ___ under the tree. He often ___ there on weekends.', options: [{text:'reads; reads',correct:false},{text:'is reading; reads',correct:true},{text:'reads; is reading',correct:false},{text:'is reading; is reading',correct:false}], hints:['Look! 提示什么时态？','often/on weekends提示什么时态？','现在进行时表正在进行，一般现在时表经常性动作'], explanation:'Look!是现在进行时标志(am/is/are+doing)；often/on weekends是一般现在时标志。注意区分：正在做用进行时，经常做用一般时。' }
];
EnglishGrammar.forEach(q => addQuestion('english', 'grammar', q));
const EnglishListening = [
    { topic: '听力-数字', difficulty: 'beginner', tags: ['听力', '数字'], speakText: 'I have thirteen apples and twenty oranges.', question: 'How many apples does the speaker have?', options: [{text:'12',correct:false},{text:'13',correct:true},{text:'20',correct:false},{text:'30',correct:false}], hints:['👂 注意听thirteen还是thirty','thirteen是13，thirty是30','听清楚问的是apples不是oranges'], explanation:'听力原文："I have thirteen apples and twenty oranges." 注意区分thirteen(13)和thirty(30)，重音位置不同：thirteen重音在-teen。' },
    { topic: '听力-时间', difficulty: 'beginner', tags: ['听力', '时间'], speakText: 'The first class begins at eight fifteen, but Tom arrived at eight thirty.', question: 'What time does the first class begin?', options: [{text:'8:00',correct:false},{text:'8:15',correct:true},{text:'8:30',correct:false},{text:'8:50',correct:false}], hints:['👂 问的是begin还是arrive？','注意but后面往往是干扰信息','不要被Tom到达的时间迷惑'], explanation:'原文说"first class begins at eight fifteen"，eight fifteen = 8:15。eight thirty是Tom到达的时间，不是开始时间。' },
    { topic: '听力-价格', difficulty: 'intermediate', tags: ['听力', '价格'], speakText: 'This T-shirt is usually 25 dollars, but today it\'s on sale for only 18 dollars.', question: 'How much is the T-shirt today?', options: [{text:'$15',correct:false},{text:'$18',correct:true},{text:'$25',correct:false},{text:'$80',correct:false}], hints:['👂 问的是today的价格','on sale是什么意思？','注意but后面的信息'], explanation:'原价$25，今天促销on sale only $18。听力题中but/however后面的内容往往是正确答案。' },
    { topic: '听力-地点', difficulty: 'beginner', tags: ['听力', '地点'], speakText: 'I want to borrow some books about Chinese history. Where should I go?', question: 'Where is the speaker going?', options: [{text:'Hospital',correct:false},{text:'Library',correct:true},{text:'Restaurant',correct:false},{text:'Museum',correct:false}], hints:['👂 关键词：borrow some books','哪里可以借书？','医院、图书馆、饭店、博物馆'], explanation:'borrow books（借书）是图书馆library的功能。hospital看病，restaurant吃饭，museum看展览。' },
    { topic: '听力-天气', difficulty: 'intermediate', tags: ['听力', '天气'], speakText: 'It was sunny in the morning, but now it\'s raining heavily. You\'d better take an umbrella.', question: 'What\'s the weather like now?', options: [{text:'Sunny',correct:false},{text:'Cloudy',correct:false},{text:'Rainy',correct:true},{text:'Windy',correct:false}], hints:['👂 注意问的是now的天气','but后面是重点','heavily形容什么？'], explanation:'上午sunny晴天，但now现在raining heavily下大雨。要注意时间标志词：in the morning vs now。' },
    { topic: '听力-对话理解', difficulty: 'intermediate', tags: ['听力', '对话'], speakText: 'W: Would you like some more rice? M: No, thanks. I\'m full. But could I have a cup of coffee, please?', question: 'What does the man want?', options: [{text:'More rice',correct:false},{text:'Some bread',correct:false},{text:'A cup of coffee',correct:true},{text:'A glass of water',correct:false}], hints:['👂 男士先说No, thanks拒绝了什么？','I\'m full是什么意思？','But后面才是他真正想要的'], explanation:'男士说"I\'m full我饱了"，所以不要米饭了，But后说"I\'d like a cup of coffee"想要咖啡。' },
    { topic: '听力-运动', difficulty: 'beginner', tags: ['听力', '运动'], speakText: 'My favorite sport is basketball. I play it with my classmates every Friday afternoon.', question: 'What sport does the speaker like best?', options: [{text:'Football',correct:false},{text:'Basketball',correct:true},{text:'Tennis',correct:false},{text:'Swimming',correct:false}], hints:['👂 favorite sport是什么？','favorite = like best','不要被classmates干扰'], explanation:'favorite sport = like best最喜欢的运动。原文直接说"My favorite sport is basketball"，第一句通常是主旨句。' },
    { topic: '听力-饮食偏好', difficulty: 'intermediate', tags: ['听力', '饮食'], speakText: 'For breakfast, I usually have an egg, some bread and a glass of milk. But this morning I had noodles.', question: 'What does the speaker usually have for breakfast?', options: [{text:'Noodles',correct:false},{text:'Egg, bread and milk',correct:true},{text:'Only bread',correct:false},{text:'Nothing',correct:false}], hints:['👂 问的是usually通常还是this morning今天早上？','But后面是例外情况','听清楚问题问的是"通常"'], explanation:'usually早餐吃egg, bread, milk，this morning例外吃了noodles。要注意问题中的关键词usually，选通常的情况而不是例外。' },
    { topic: '听力-交通方式', difficulty: 'intermediate', tags: ['听力', '交通'], speakText: 'I usually go to school by bike, but yesterday my bike was broken, so I took the bus.', question: 'How did the speaker go to school yesterday?', options: [{text:'By bike',correct:false},{text:'By bus',correct:true},{text:'On foot',correct:false},{text:'By car',correct:false}], hints:['👂 问的是yesterday昨天','自行车坏了所以怎么去的？','注意so后面是结果'], explanation:'usually骑自行车，但yesterday自行车坏了was broken，so took the bus所以坐公交。问的是昨天，选by bus。' },
    { topic: '听力-短文理解', difficulty: 'hard', tags: ['听力', '短文'], speakText: 'Hello, everyone. My name is Li Ming. I am 12 years old. I am in Class 3, Grade 7. My favorite subject is English because it is very interesting. After school, I often play football with my best friend Zhang Wei. My favorite food is noodles.', question: 'Which is NOT true about Li Ming?', options: [{text:'He is 12 years old',correct:false},{text:'His favorite subject is English',correct:false},{text:'He likes playing basketball',correct:true},{text:'He likes noodles best',correct:false}], hints:['👂 注意NOT true，要选错的','逐项核对原文','他踢足球还是打篮球？'], explanation:'原文说play football踢足球，不是play basketball打篮球。其他选项都正确：12岁，最喜欢英语，最喜欢面条。' }
];
EnglishListening.forEach(q => addQuestion('english', 'listening', q));
const EnglishSpeaking = [
    { topic: '跟读-问候', difficulty: 'beginner', tags: ['口语', '跟读'], speakText: 'Good morning! How are you today?', displayText: 'Good morning! How are you today?' },
    { topic: '跟读-自我介绍', difficulty: 'beginner', tags: ['口语', '跟读'], speakText: 'My name is Li Ming. I am twelve years old and I am in Grade 7.', displayText: 'My name is Li Ming. I am twelve years old and I am in Grade 7.' },
    { topic: '跟读-喜好表达', difficulty: 'intermediate', tags: ['口语', '跟读'], speakText: 'I like playing basketball with my friends after school. It is really relaxing.', displayText: 'I like playing basketball with my friends after school. It is really relaxing.' },
    { topic: '跟读-课堂用语', difficulty: 'beginner', tags: ['口语', '跟读'], speakText: 'Could you please speak more slowly? I didn\'t catch that.', displayText: 'Could you please speak more slowly? I didn\'t catch that.' },
    { topic: '跟读-描述日常', difficulty: 'intermediate', tags: ['口语', '跟读'], speakText: 'I usually get up at six thirty and have breakfast at seven. Then I go to school by bike.', displayText: 'I usually get up at six thirty and have breakfast at seven. Then I go to school by bike.' },
    { topic: '跟读-询问意见', difficulty: 'intermediate', tags: ['口语', '跟读'], speakText: 'What do you think of this movie? I think it is very interesting and exciting.', displayText: 'What do you think of this movie? I think it is very interesting and exciting.' },
    { topic: '跟读-购物', difficulty: 'advanced', tags: ['口语', '跟读'], speakText: 'How much is this T-shirt? It looks nice. Can I try it on, please?', displayText: 'How much is this T-shirt? It looks nice. Can I try it on, please?' },
    { topic: '跟读-节日祝福', difficulty: 'intermediate', tags: ['口语', '跟读'], speakText: 'Merry Christmas and Happy New Year! Wish you all the best in the coming year.', displayText: 'Merry Christmas and Happy New Year! Wish you all the best in the coming year.' }
];
EnglishSpeaking.forEach(q => {
    addQuestion('english', 'speaking', {
        topic: q.topic,
        difficulty: q.difficulty,
        tags: q.tags,
        typeInput: 'speak',
        speakText: q.speakText,
        question: '🎤 请点击麦克风按钮，大声跟读下面的句子：',
        displayText: q.displayText,
        hints: ['注意语音语调，先听示范','模仿发音和连读','大声、清晰地读出来'],
        explanation: `句子：${q.displayText}<br><br>💡 跟读技巧：<br>1. 先听2-3遍示范<br>2. 注意连读、弱读、重音<br>3. 模仿语音语调<br>4. 录音后对比自己和标准发音的差异`
    });
});
const EnglishReading = [
    {
        topic: 'AI走进校园', difficulty: 'advanced', tags: ['阅读', '科技'],
        passageTitle: '📰 AI in Schools - 人工智能走进校园',
        passage: `Artificial Intelligence (AI) is becoming more and more popular in schools today. Many teachers now use AI tools to help them prepare lessons and correct homework. Students can also use AI to get help with their studies. For example, if a student has difficulty with a math problem, they can ask AI for hints instead of looking for the answer directly.

However, some people worry that students may rely too much on AI and not think for themselves. "AI is a tool, just like a dictionary," says Mr. Wang, a middle school teacher in Beijing. "The key is to use it wisely. You should use it to learn, not to let it do your homework for you."

Many schools are now making rules about how to use AI properly. Students are taught that AI can help them understand difficult ideas, but their own thinking and creativity are irreplaceable. After all, the goal of education is to help students become independent thinkers.

As one student says, "AI gives me answers quickly, but when I work out a problem by myself, I feel a real sense of achievement. That feeling is amazing!"`,
        questions: [
            { q: 'What is the main idea of this passage?', options: [
                {text:'AI will replace teachers soon',correct:false},
                {text:'AI is popular but should be used wisely',correct:true},
                {text:'Students should not use AI at all',correct:false},
                {text:'AI can do all homework for students',correct:false}] },
            { q: 'How do teachers use AI according to the passage?', options: [
                {text:'To play games with students',correct:false},
                {text:'To prepare lessons and correct homework',correct:true},
                {text:'To talk to parents',correct:false},
                {text:'To clean the classroom',correct:false}] },
            { q: 'What does Mr. Wang compare AI to?', options: [
                {text:'A book',correct:false},{text:'A dictionary',correct:true},
                {text:'A teacher',correct:false},{text:'A computer',correct:false}] },
            { q: 'What does "irreplaceable" mean in Chinese?', options: [
                {text:'可替代的',correct:false},{text:'重要的',correct:false},
                {text:'不可替代的',correct:true},{text:'有趣的',correct:false}] },
            { q: 'What can we learn from the student\'s words?', options: [
                {text:'AI is better than thinking',correct:false},
                {text:'Working out problems alone brings satisfaction',correct:true},
                {text:'Students should never use AI',correct:false},
                {text:'AI answers are always wrong',correct:false}] }
        ]
    },
    {
        topic: '环保行动', difficulty: 'intermediate', tags: ['阅读', '环保'],
        passageTitle: '🌍 Saving Our Planet - 保护我们的地球',
        passage: `Climate change is a serious problem for our world. But many young people around the world are taking action to protect the environment. They prove that small actions can make a big difference.

In China, students in many schools have started "No-Plastic Fridays". On this day, everyone brings their own chopsticks, water bottles, and lunch boxes. No single-use plastic is allowed on campus. One school in Shanghai reports that they reduced plastic waste by 70% since starting this program.

"We only have one Earth," says 13-year-old Liu Mei, who started a recycling club at her school. "There is no Planet B. If we don't take care of it, who will?"

Her club organizes clean-up activities in the park every month. They also teach other students how to sort garbage properly. Experts say that forming good habits when young is very important. Things like saving water, turning off lights when leaving a room, taking public transport, and bringing reusable bags when shopping are all easy ways to help.

The message is clear: it's not about being perfect, it's about making an effort. Everyone can do something to make our planet greener!`,
        questions: [
            { q: 'What is "No-Plastic Fridays"?', options: [
                {text:'A day when students don\'t go to school',correct:false},
                {text:'A day when no single-use plastic is allowed at school',correct:true},
                {text:'A day when students only use plastic',correct:false},
                {text:'A day when people clean plastic in the ocean',correct:false}] },
            { q: 'How much plastic waste did one Shanghai school reduce?', options: [
                {text:'50%',correct:false},{text:'60%',correct:false},{text:'70%',correct:true},{text:'80%',correct:false}] },
            { q: 'What does "There is no Planet B" mean?', options: [
                {text:'We should move to Planet B',correct:false},
                {text:'Other planets are better',correct:false},
                {text:'We only have one Earth to protect',correct:true},
                {text:'Planets are expensive',correct:false}] },
            { q: 'Which of the following is NOT mentioned as an easy way to help?', options: [
                {text:'Saving water',correct:false},
                {text:'Taking public transport',correct:false},
                {text:'Turning off lights',correct:false},
                {text:'Driving cars to school',correct:true}] },
            { q: 'What is the main message of this passage?', options: [
                {text:'Climate change is not a big problem',correct:false},
                {text:'Only adults can help the environment',correct:false},
                {text:'Everyone can do small things to protect the Earth',correct:true},
                {text:'Recycling is too difficult for students',correct:false}] }
        ]
    },
    {
        topic: '运动与健康', difficulty: 'intermediate', tags: ['阅读', '健康'],
        passageTitle: '🏃 Sports for Teens - 青少年运动',
        passage: `A new study shows that only 25% of Chinese middle school students get enough exercise. Doctors say that teenagers should do at least 60 minutes of physical activity every day. However, many students spend most of their time sitting in class or doing homework.

"Exercise is not wasted time," says Dr. Li, a sports medicine expert. "When you exercise, your brain gets more oxygen. This helps you think better, remember more, and focus longer in class. Students who exercise regularly actually do better in exams!"

This is good news for schools. Many schools are now adding more PE classes and organizing different sports clubs. Basketball, football, badminton, running, and dancing are among the most popular choices. Some schools even encourage walking or biking to school.

13-year-old Zhang Hao used to hate sports. "I thought PE was tiring and boring," he says. "But then I joined the badminton club. Now I play three times a week. I have more energy, I sleep better, and my grades even improved! I wish I started earlier."

Experts suggest starting small: take the stairs instead of the elevator, walk around during breaks, or do 10 minutes of stretching every hour. Remember: a healthy body leads to a healthy mind!`,
        questions: [
            { q: 'How much exercise should teenagers get every day?', options: [
                {text:'30 minutes',correct:false},{text:'60 minutes',correct:true},
                {text:'90 minutes',correct:false},{text:'2 hours',correct:false}] },
            { q: 'Why does Dr. Li say exercise is good for studying?', options: [
                {text:'It makes students taller',correct:false},
                {text:'The brain gets more oxygen',correct:true},
                {text:'Students don\'t need to study',correct:false},
                {text:'Exercise makes exams easier',correct:false}] },
            { q: 'What sport did Zhang Hao start playing?', options: [
                {text:'Basketball',correct:false},{text:'Football',correct:false},
                {text:'Badminton',correct:true},{text:'Dancing',correct:false}] },
            { q: 'Which is NOT mentioned as a way to start small?', options: [
                {text:'Taking the stairs',correct:false},
                {text:'Walking during breaks',correct:false},
                {text:'Doing stretching',correct:false},
                {text:'Joining a gym',correct:true}] },
            { q: 'What is the best title for this passage?', options: [
                {text:'How to Become a Sports Star',correct:false},
                {text:'Exercise Helps Both Body and Mind',correct:true},
                {text:'PE Classes Are Boring',correct:false},
                {text:'Homework Is More Important Than Sports',correct:false}] }
        ]
    }
];
EnglishReading.forEach(r => {
    r.questions.forEach((q, qi) => {
        addQuestion('english', 'reading', {
            topic: r.topic + (r.questions.length > 1 ? ` (${qi+1}/${r.questions.length})` : ''),
            difficulty: r.difficulty,
            tags: r.tags,
            passage: r.passage,
            passageTitle: r.passageTitle,
            question: q.q,
            options: q.options,
            hints: [
                '📖 回到原文中找答案，不要凭感觉',
                '找题干中的关键词定位段落',
                '注意同义替换，答案往往是原文的另一种说法'
            ],
            explanation: '阅读理解技巧：①先读题再读文章 ②找关键词定位 ③注意同义替换 ④排除法选择 ⑤答案一定在原文中有依据！'
        });
    });
});
const EnglishCloze = [
    {
        topic: '我的学校生活', difficulty: 'advanced', tags: ['完形', '词汇'],
        text: `My name is Wang Wei. I am a Grade 7 student. My school life is very ___1___. We have six classes every day. I like all my classes ___2___ my teachers are all very kind and patient. My favorite ___3___ is English. I think it is very interesting and ___4___. I practice speaking English every morning.

After class, I always ___5___ basketball with my classmates. It is my favorite sport. I also like reading. I ___6___ go to the school library on Friday afternoons. There are so many great books there. I have ___7___ many new friends at school. We often study together and help each other.

___8___ I have a lot of homework, I still feel happy. I think middle school life is challenging but wonderful. I am ___9___ every day, because I am learning new things and making progress. I ___10___ my school life!`,
        blanks: [
            { options: [{text:'boring',correct:false},{text:'interesting',correct:true},{text:'difficult',correct:false},{text:'lazy',correct:false}] },
            { options: [{text:'but',correct:false},{text:'or',correct:false},{text:'because',correct:true},{text:'so',correct:false}] },
            { options: [{text:'food',correct:false},{text:'sport',correct:false},{text:'subject',correct:true},{text:'color',correct:false}] },
            { options: [{text:'useless',correct:false},{text:'useful',correct:true},{text:'easy',correct:false},{text:'expensive',correct:false}] },
            { options: [{text:'play',correct:true},{text:'do',correct:false},{text:'go',correct:false},{text:'make',correct:false}] },
            { options: [{text:'never',correct:false},{text:'hardly',correct:false},{text:'sometimes',correct:false},{text:'often',correct:true}] },
            { options: [{text:'made',correct:true},{text:'done',correct:false},{text:'taken',correct:false},{text:'given',correct:false}] },
            { options: [{text:'If',correct:false},{text:'Although',correct:true},{text:'Because',correct:false},{text:'So',correct:false}] },
            { options: [{text:'sad',correct:false},{text:'angry',correct:false},{text:'happy',correct:true},{text:'tired',correct:false}] },
            { options: [{text:'hate',correct:false},{text:'love',correct:true},{text:'forget',correct:false},{text:'stop',correct:false}] }
        ]
    }
];
EnglishCloze.forEach(c => {
    c.blanks.forEach((b, i) => {
        addQuestion('english', 'cloze', {
            topic: c.topic + ` (空${i+1})`,
            difficulty: c.difficulty,
            tags: c.tags,
            clozeText: c.text.replace(`___${i+1}___`, '<span style="background:var(--warning);color:black;padding:2px 8px;border-radius:4px;font-weight:700;">_____</span>').replace(/___\d+___/g, '(     )'),
            question: '请选择最合适的词填入空格：',
            options: b.options,
            hints: [
                '📝 先通读全文，了解文章大意',
                '根据上下文逻辑和语境判断',
                '注意固定搭配、语法和连词'
            ],
            explanation: '做完形填空：①先通读全文理解大意 ②逐空分析，结合上下文 ③注意语法和固定搭配 ④最后复读检查'
        });
    });
});
const EnglishTranslation = [
    { topic: '翻译-早餐', difficulty: 'beginner', tags: ['翻译', '句型'], zh: '我每天早上七点吃早餐。', answer: ['i have breakfast at seven every morning', 'i eat breakfast at 7 every morning', 'i have breakfast at seven o\'clock every morning'], hints:['"吃早餐"是have/eat breakfast','具体时刻前用介词at','every morning 放句末'], explanation:'I have breakfast at seven o\'clock every morning. 注意时间表达：at + 具体时刻。' },
    { topic: '翻译-喜欢数学', difficulty: 'intermediate', tags: ['翻译', '句型'], zh: '他不喜欢数学，因为太难了。', answer: ['he doesn\'t like math because it is too difficult', 'he doesn\'t like maths because it\'s too hard', 'he doesn\'t like math because it is too hard'], hints:['主语he是三单，否定用doesn\'t + 动词原形','"因为"是because','"太难"是too difficult/hard'], explanation:'He doesn\'t like math because it is too difficult. 注意一般现在时第三人称单数否定形式。' },
    { topic: '翻译-生日', difficulty: 'beginner', tags: ['翻译', '句型'], zh: '你的生日是什么时候？', answer: ['when is your birthday', 'what date is your birthday'], hints:['"什么时候"用When提问','"你的生日"是your birthday','特殊疑问句：疑问词 + be + 主语'], explanation:'When is your birthday? 特殊疑问句结构：疑问词 + 一般疑问句语序。' },
    { topic: '翻译-正在进行', difficulty: 'intermediate', tags: ['翻译', '时态'], zh: '看！孩子们正在操场上踢足球。', answer: ['look the children are playing football on the playground', 'look the kids are playing soccer on the playground', 'look the children are playing football in the playground'], hints:['"看！"是Look! 用现在进行时','"孩子们"是children/kids','"踢足球"：play football/soccer，现在进行时 are playing'], explanation:'Look! The children are playing football on the playground. Look! 提示用现在进行时（be + doing）。' },
    { topic: '翻译-计划', difficulty: 'intermediate', tags: ['翻译', '时态'], zh: '我明天打算去看望我的爷爷奶奶。', answer: ['i am going to visit my grandparents tomorrow', 'i will visit my grandparents tomorrow', 'i plan to visit my grandparents tomorrow'], hints:['"明天"是tomorrow，用将来时','"打算"可以用be going to','"看望"是visit'], explanation:'I am going to visit my grandparents tomorrow. 表示计划打算用be going to结构。' }
];
EnglishTranslation.forEach(t => {
    addQuestion('english', 'translation', {
        topic: t.topic,
        difficulty: t.difficulty,
        tags: t.tags,
        typeInput: 'fill',
        question: `请将这句话翻译成英语（注意大小写和标点）：<br><br><div style="font-size:20px;color:#60a5fa;padding:16px;background:var(--bg-dark);border-radius:12px;">${t.zh}</div>`,
        answerList: t.answer,
        hints: t.hints,
        explanation: t.explanation
    });
});
const MathConcept = [
    { topic: '有理数概念', difficulty: 'beginner', tags: ['有理数', '概念'], question: '下列各数中，是负整数的是（　　）', options: [{text:'-3.5',correct:false},{text:'-3',correct:true},{text:'0',correct:false},{text:'2',correct:false}], hints:['负整数需要满足两个条件：是负数、是整数','小数不是整数','0既不是正数也不是负数'], explanation:'负整数是既是负数又是整数的数。-3.5是负分数，0既不是正也不是负，2是正整数，所以选-3。' },
    { topic: '相反数', difficulty: 'beginner', tags: ['有理数', '相反数'], question: '-5的相反数是（　　）', options: [{text:'-5',correct:false},{text:'5',correct:true},{text:'-1/5',correct:false},{text:'1/5',correct:false}], hints:['相反数：只有符号不同的两个数','a的相反数是-a','0的相反数是0'], explanation:'一个数的相反数就是在它前面加负号：-(-5)=5。正数的相反数是负数，负数的相反数是正数。' },
    { topic: '绝对值', difficulty: 'beginner', tags: ['有理数', '绝对值'], question: '|-7| = （　　）', options: [{text:'-7',correct:false},{text:'7',correct:true},{text:'0',correct:false},{text:'±7',correct:false}], hints:['绝对值表示数轴上点到原点的距离','距离不能是负数','|a| ≥ 0'], explanation:'绝对值是非负数。|-7|表示-7到原点的距离，距离是7，所以|-7|=7。正数绝对值是本身，负数绝对值是相反数。' },
    { topic: '数轴', difficulty: 'beginner', tags: ['有理数', '数轴'], question: '在数轴上，到原点距离等于3个单位长度的点表示的数是（　　）', options: [{text:'3',correct:false},{text:'-3',correct:false},{text:'3或-3',correct:true},{text:'0',correct:false}], hints:['距离是正数，但点可能在左边或右边','原点左边是负数，右边是正数','到原点距离相等的点有两个'], explanation:'到原点距离3个单位的点：右边是+3，左边是-3，所以是3或-3。这就是绝对值|a|=3的解：a=±3。' },
    { topic: '整式概念', difficulty: 'beginner', tags: ['整式', '概念'], question: '单项式 -3x²y 的系数和次数分别是（　　）', options: [{text:'系数-3，次数2',correct:false},{text:'系数3，次数3',correct:false},{text:'系数-3，次数3',correct:true},{text:'系数-3，次数4',correct:false}], hints:['单项式中的数字因数叫系数','所有字母的指数和叫次数','x的指数是2，y的指数是1'], explanation:'系数是-3（包含负号）；次数是2+1=3（x²指数2，y指数1，加起来是3次）。' },
    { topic: '一元一次方程概念', difficulty: 'beginner', tags: ['方程', '概念'], question: '下列方程中是一元一次方程的是（　　）', options: [{text:'x² - 1 = 0',correct:false},{text:'2x + y = 3',correct:false},{text:'3x - 5 = 2x + 1',correct:true},{text:'1/x = 2',correct:false}], hints:['"一元"：只含一个未知数','"一次"：未知数最高次数是1','必须是整式方程（分母不含未知数）'], explanation:'一元一次方程三要素：①一个未知数 ②未知数次数为1 ③整式方程。A是二次，B是二元，D分母有未知数，只有C符合。' },
    { topic: '几何图形', difficulty: 'beginner', tags: ['几何', '概念'], question: '下列图形中属于立体图形的是（　　）', options: [{text:'三角形',correct:false},{text:'圆',correct:false},{text:'正方体',correct:true},{text:'线段',correct:false}], hints:['平面图形各部分都在同一平面内','立体图形各部分不在同一平面内','三角形、圆、线段都是平面图形'], explanation:'三角形、圆、线段是平面图形（二维），正方体是立体图形（三维，有长宽高）。常见立体图形：长方体、正方体、圆柱、圆锥、球。' },
    { topic: '直线射线线段', difficulty: 'beginner', tags: ['几何', '概念'], question: '下列说法正确的是（　　）', options: [{text:'直线可以度量长度',correct:false},{text:'射线AB和射线BA是同一条射线',correct:false},{text:'两点之间线段最短',correct:true},{text:'延长直线AB',correct:false}], hints:['直线和射线无限长，不能度量','射线有方向，端点不同不是同一条','直线本身无限长，不需要延长'], explanation:'两点之间，线段最短——这是线段的基本性质（公理）。直线、射线不能度量，射线端点不同不是同一条。' }
];
MathConcept.forEach(q => addQuestion('math', 'concept', q));
const MathCalculate = [
    { topic: '有理数加法', difficulty: 'beginner', tags: ['有理数', '计算'], question: '(-3) + 5 = （　　）', options: [{text:'-8',correct:false},{text:'8',correct:false},{text:'2',correct:true},{text:'-2',correct:false}], hints:['异号两数相加：取绝对值大的符号','用大绝对值减小绝对值','5-3=?'], explanation:'异号相加：5-3=2，取正号，结果是2。可以理解为：欠3元赚5元，还剩2元。' },
    { topic: '有理数加减混合', difficulty: 'intermediate', tags: ['有理数', '计算'], question: '计算：-5 + 8 - 3 + 2 = （　　）', options: [{text:'2',correct:true},{text:'-2',correct:false},{text:'4',correct:false},{text:'0',correct:false}], hints:['可以正负数分别相加','正数：8+2=10','负数：-5-3=-8，然后10+(-8)=?'], explanation:'方法：正负数分别计算。正数和：8+2=10；负数和：-5-3=-8；总和：10+(-8)=2。按顺序算：-5+8=3, 3-3=0, 0+2=2。' },
    { topic: '有理数乘法', difficulty: 'beginner', tags: ['有理数', '计算'], question: '(-4) × (-6) = （　　）', options: [{text:'-24',correct:false},{text:'24',correct:true},{text:'-10',correct:false},{text:'10',correct:false}], hints:['同号相乘得正，异号得负','负负得正','4×6=?'], explanation:'有理数乘法：同号得正，异号得负，绝对值相乘。(-4)×(-6)=+(4×6)=24。' },
    { topic: '有理数乘方', difficulty: 'intermediate', tags: ['有理数', '乘方'], question: '(-2)³ = （　　）', options: [{text:'-6',correct:false},{text:'6',correct:false},{text:'-8',correct:true},{text:'8',correct:false}], hints:['乘方表示几个相同因数相乘','(-2)³ = (-2)×(-2)×(-2)','先定符号再算数：负数奇次幂是负数'], explanation:'(-2)³ = (-2)×(-2)×(-2) = 4×(-2) = -8。负数奇数次幂是负数，偶数次幂是正数。' },
    { topic: '有理数混合运算', difficulty: 'intermediate', tags: ['有理数', '计算'], typeInput: 'fill', question: '计算：-2² + |-3| = _____', answer: '-1', hints:['注意运算顺序：先乘方，再绝对值，最后加减','⚠️ -2² 和 (-2)² 不同！-2² = -(2²) = -4','|-3| = 3，然后-4 + 3 = ?'], explanation:'-2² = -(2²) = -4（注意：负号在外面，不是(-2)²=4！）；|-3|=3；所以-2²+|-3|=-4+3=-1。运算顺序：先乘方开方，再乘除，最后加减。' },
    { topic: '科学记数法', difficulty: 'intermediate', tags: ['有理数', '科学记数法'], question: '用科学记数法表示 3 500 000，正确的是（　　）', options: [{text:'35×10⁵',correct:false},{text:'3.5×10⁶',correct:true},{text:'3.5×10⁵',correct:false},{text:'0.35×10⁷',correct:false}], hints:['科学记数法：a×10ⁿ，其中 1≤|a|<10','把小数点移到第一个非零数字后面','数小数点移动了几位'], explanation:'3500000 = 3.5 × 10⁶（小数点左移6位）。a必须满足1≤a<10，所以是3.5不是35也不是0.35。' },
    { topic: '合并同类项', difficulty: 'beginner', tags: ['整式', '计算'], question: '化简：3a + 2a - 5a = （　　）', options: [{text:'0',correct:true},{text:'a',correct:false},{text:'-a',correct:false},{text:'10a',correct:false}], hints:['同类项：字母相同，相同字母指数也相同','合并同类项：系数相加减，字母不变','3+2-5=?'], explanation:'合并同类项：(3+2-5)a = 0a = 0。同类项系数相加，字母和指数保持不变。' },
    { topic: '去括号化简', difficulty: 'intermediate', tags: ['整式', '计算'], question: '化简：2(x - 3) - (x + 2) = （　　）', options: [{text:'x - 8',correct:true},{text:'x - 4',correct:false},{text:'3x - 4',correct:false},{text:'3x - 8',correct:false}], hints:['去括号：括号前是正号不变号，负号全变号','2(x-3) = 2x - 6','-(x+2) = -x - 2，再合并'], explanation:'2(x-3)=2x-6；-(x+2)=-x-2；合并：2x-6-x-2 = (2x-x)+(-6-2) = x-8。去括号时括号前是负号，括号内每一项都要变号！' },
    { topic: '解一元一次方程', difficulty: 'intermediate', tags: ['方程', '计算'], question: '解方程 2x + 3 = 11，x = （　　）', options: [{text:'4',correct:true},{text:'7',correct:false},{text:'-4',correct:false},{text:'3',correct:false}], hints:['先移项：把常数项移到等号右边','2x = 11 - 3 = ?','然后两边除以2'], explanation:'2x+3=11 → 2x=11-3=8 → x=4。⚠️ 移项要变号！' },
    { topic: '一元一次方程去分母', difficulty: 'advanced', tags: ['方程', '计算'], typeInput: 'fill', question: '解方程：(x+1)/2 - (2x-1)/3 = 1，x = _____', answer: '-1', hints:['去分母：两边乘分母最小公倍数6','3(x+1) - 2(2x-1) = 6（每一项都要乘！）','去括号后解整式方程'], explanation:'去分母×6：3(x+1)-2(2x-1)=6 → 3x+3-4x+2=6 → -x+5=6 → -x=1 → x=-1。去分母不要漏乘不含分母的项！' },
    { topic: '绝对值非负性', difficulty: 'advanced', tags: ['绝对值', '非负性'], typeInput: 'fill', question: '若 |x-2| + |y+3| = 0，则 x + y = _____', answer: '-1', hints:['绝对值具有非负性：|a| ≥ 0','几个非负数的和为0，则每个都为0','所以 x-2=0，y+3=0'], explanation:'绝对值非负：|x-2|≥0，|y+3|≥0，和为0说明都为0。x-2=0→x=2；y+3=0→y=-3；x+y=2+(-3)=-1。' }
];
MathCalculate.forEach(q => addQuestion('math', 'calculate', q));
const MathApplication = [
    { topic: '行程相遇问题', difficulty: 'advanced', tags: ['方程', '应用题'], question: '甲、乙两车分别从A、B两地同时出发相向而行，甲车每小时行60千米，乙车每小时行40千米，2小时后相遇。A、B两地相距多少千米？', options: [{text:'100千米',correct:false},{text:'200千米',correct:true},{text:'120千米',correct:false},{text:'80千米',correct:false}], hints:['相遇问题公式：总路程 = 速度和 × 相遇时间','先算速度和：60+40=?','然后乘以相遇时间2小时'], explanation:'相向而行相遇：路程 = (甲速+乙速)×时间 = (60+40)×2 = 100×2 = 200千米。' },
    { topic: '利润问题', difficulty: 'advanced', tags: ['方程', '应用题'], question: '一件商品按成本价提高40%后标价，再打8折销售，售价为224元。这件商品的成本价是多少元？', options: [{text:'180元',correct:false},{text:'200元',correct:true},{text:'220元',correct:false},{text:'250元',correct:false}], hints:['设成本价为x元','提高40%标价：x×(1+40%) = 1.4x','打8折：1.4x × 0.8 = 224，解方程'], explanation:'设成本价x元：x×(1+40%)×0.8=224 → 1.12x=224 → x=200元。利润问题：售价=标价×折扣。' },
    { topic: '等积变形问题', difficulty: 'intermediate', tags: ['方程', '应用题'], question: '要锻造一个直径为10cm、高为8cm的圆柱形毛坯，应截取直径为8cm的圆钢多长？', options: [{text:'10cm',correct:false},{text:'12.5cm',correct:true},{text:'15cm',correct:false},{text:'8cm',correct:false}], hints:['锻造前后体积不变（等积变形）','圆柱体积 = πr²h（注意是半径r不是直径！）','毛坯体积 = 圆钢体积，列方程'], explanation:'体积相等：π×5²×8 = π×4²×h → 25×8 = 16×h → h = 200÷16 = 12.5cm。注意半径=直径÷2！' },
    { topic: '年龄问题', difficulty: 'intermediate', tags: ['方程', '应用题'], question: '今年爸爸35岁，儿子9岁。几年后爸爸的年龄是儿子年龄的3倍？', options: [{text:'3年',correct:false},{text:'4年',correct:true},{text:'5年',correct:false},{text:'6年',correct:false}], hints:['设x年后爸爸年龄是儿子的3倍','x年后爸爸(35+x)岁，儿子(9+x)岁','列方程：35+x = 3(9+x)'], explanation:'设x年后：35+x=3(9+x) → 35+x=27+3x → 35-27=3x-x → 8=2x → x=4。4年后爸爸39岁，儿子13岁，39=3×13✓。' },
    { topic: '配套问题', difficulty: 'advanced', tags: ['方程', '应用题'], question: '某车间有22名工人生产螺栓和螺母，每人每天平均生产螺栓1200个或螺母2000个，一个螺栓要配两个螺母。为了使产品刚好配套，应分配多少名工人生产螺栓？', options: [{text:'10名',correct:true},{text:'12名',correct:false},{text:'14名',correct:false},{text:'8名',correct:false}], hints:['设x人生产螺栓，(22-x)人生产螺母','螺栓数×2 = 螺母数（配套关系）','列方程：1200x × 2 = 2000(22-x)'], explanation:'设x人生产螺栓：2×1200x=2000(22-x) → 2400x=44000-2000x → 4400x=44000 → x=10。10人生产螺栓（12000个），12人生产螺母（24000个），螺母是螺栓的2倍刚好配套。' },
    { topic: '线段计算', difficulty: 'intermediate', tags: ['几何', '计算'], question: '已知线段AB=8cm，点C是AB中点，点D在AB上，BD=3cm，则CD的长为（　　）', options: [{text:'1cm',correct:true},{text:'2cm',correct:false},{text:'3cm',correct:false},{text:'4cm',correct:false}], hints:['先画图！C是AB中点，所以BC=?','中点把线段分成相等两段：BC=AB÷2','CD=BC-BD=4-3=?'], explanation:'C是AB中点，BC=8÷2=4cm；BD=3cm；CD=BC-BD=4-3=1cm。几何题一定要画图！' },
    { topic: '角度计算', difficulty: 'intermediate', tags: ['几何', '角'], typeInput: 'fill', question: '已知一个角的补角比它的余角的3倍少20°，这个角的度数是_____度。', answer: '35', hints:['设这个角为x°','补角 = 180°-x，余角 = 90°-x','列方程：180-x = 3(90-x) - 20'], explanation:'设角为x°：180-x = 3(90-x)-20 → 180-x=270-3x-20 → 2x=70 → x=35°。补角和为180°，余角和为90°。' },
    { topic: '三角板拼角', difficulty: 'intermediate', tags: ['几何', '角'], question: '用一副三角板（含30°、45°、60°、90°角）不能拼出的角是（　　）', options: [{text:'75°',correct:false},{text:'105°',correct:false},{text:'120°',correct:false},{text:'130°',correct:true}], hints:['能拼出的角是30/45/60/90°的和或差','75°=45°+30°，105°=60°+45°','120°=90°+30°，看130°能不能凑'], explanation:'75°=30+45，105°=60+45，120°=30+90，都能拼出。130°无法用30/45/60/90通过加减得到，所以选D。' },
    { topic: '规律探究', difficulty: 'advanced', tags: ['规律', '探究'], question: '观察单项式：x, -2x², 4x³, -8x⁴, 16x⁵, ... 按此规律，第8个单项式是（　　）', options: [{text:'-64x⁸',correct:false},{text:'128x⁸',correct:false},{text:'-128x⁸',correct:true},{text:'256x⁸',correct:false}], hints:['符号规律：+,-,+,-... 即(-1)^(n+1)','系数绝对值：1,2,4,8,16... 是2^(n-1)','x的指数就是n：第n个是xⁿ'], explanation:'第n个：(-1)^(n+1) × 2^(n-1) × xⁿ。第8个：(-1)^9 × 2^7 × x⁸ = -1×128x⁸ = -128x⁸。' }
];
MathApplication.forEach(q => addQuestion('math', 'application', q));
const ChineseZiyin = [
    { topic: '字音辨析1', difficulty: 'beginner', tags: ['字音', '基础'], question: '下列加点字读音完全正确的一项是（　　）', options: [
        {text:'酝酿(niàng) 黄晕(hūn) 发髻(jì) 贮蓄(zhù)',correct:false},
        {text:'吝啬(lìn) 棱镜(léng) 静谧(mì) 着落(zhuó)',correct:true},
        {text:'粗犷(kuàng) 菜畦(qí) 确凿(záo) 秕谷(bǐ)',correct:false},
        {text:'蝉蜕(tuì) 沮丧(sàng) 嫉妒(jì) 盔甲(kuī)',correct:false}],
      hints:['注意多音字在不同语境中的读音','"粗犷"的"犷"读什么？','"黄晕"的"晕"读yùn不是hūn'],
      explanation:'A项"黄晕"应读yùn；C项"粗犷"应读guǎng；D项"嫉妒"应读jí。B项全部正确。' },
    { topic: '字形辨析1', difficulty: 'beginner', tags: ['字形', '基础'], question: '下列词语中没有错别字的一项是（　　）', options: [
        {text:'决别 分歧 各得其所 翻来复去',correct:false},
        {text:'云霄 鉴赏 人声鼎沸 恍然大悟',correct:true},
        {text:'嘹亮 诀别 喜出忘外 油然而生',correct:false},
        {text:'郎润 静谧 花团锦簇 美不胜收',correct:false}],
      hints:['A"决别"应为? "翻来复去"应为?','C"喜出忘外"应为?','D"郎润"应为?'],
      explanation:'A"决别"→"诀别"，"翻来复去"→"翻来覆去"；C"喜出忘外"→"喜出望外"；D"郎润"→"朗润"。B正确。' },
    { topic: '多音字辨析', difficulty: 'intermediate', tags: ['字音', '多音字'], question: '下列加点字读音相同的一项是（　　）', options: [
        {text:'和蔼/应和',correct:false},
        {text:'散文/散步',correct:false},
        {text:'称职/对称',correct:true},
        {text:'差别/出差',correct:false}],
      hints:['A"和"有几个读音？','B"散"什么时候读sǎn/sàn？','D"差"是多音字'],
      explanation:'A项：hé/hè；B项：sǎn/sàn；C项：都读chèn；D项：chā/chāi。' }
];
ChineseZiyin.forEach(q => addQuestion('chinese', 'ziyin', q));
const ChineseChengyu = [
    { topic: '成语运用1', difficulty: 'intermediate', tags: ['成语', '运用'], question: '下列句子中加点成语使用正确的一项是（　　）', options: [
        {text:'他上课经常迟到迟到，真是不可救药。',correct:false},
        {text:'同学们经常向老师请教，这种不耻下问的精神值得提倡。',correct:false},
        {text:'这道题他想了很久，终于恍然大悟找到了答案。',correct:true},
        {text:'运动会上，他借的衣服很不合身，简直是画蛇添足。',correct:false}],
      hints:['"不可救药"是不是用得太重了？','"不耻下问"是向谁问？学生问老师能用吗？','"画蛇添足"是什么意思？'],
      explanation:'A"不可救药"比喻坏到无法挽救，语意过重；B"不耻下问"是向地位/学识比自己低的人请教，学生问老师不适用；D"画蛇添足"比喻做多余的事反而不恰当，不合适用来形容衣服不合身；C正确。' },
    { topic: '词语辨析', difficulty: 'intermediate', tags: ['词语', '辨析'], question: '依次填入横线处最恰当的一项是（　　）<br>①他对这件事很____，因为他亲身经历过。<br>②听完这个感人的故事，他____流下了眼泪。', options: [
        {text:'熟悉 情不自禁',correct:true},
        {text:'熟习 不由自主',correct:false},
        {text:'熟悉 不由自主',correct:false},
        {text:'熟习 情不自禁',correct:false}],
      hints:['"熟悉"和"熟习"的区别是什么？','"熟悉"指知道得清楚，"熟习"侧重技术学问掌握得熟练','"情不自禁"侧重感情激动'],
      explanation:'"熟悉"指知道得清楚，对象可以是人或事；"熟习"侧重对技术/学问掌握熟练。"情不自禁"强调感情激动控制不住；"不由自主"强调由不得自己。此处选A最恰当。' }
];
ChineseChengyu.forEach(q => addQuestion('chinese', 'chengyu', q));
const ChineseBingju = [
    { topic: '病句-成分残缺', difficulty: 'intermediate', tags: ['病句', '修改'], question: '下列句子没有语病的一项是（　　）', options: [
        {text:'通过学习《论语》十二章，使我明白了很多学习的道理。',correct:false},
        {text:'能否刻苦钻研是提高学习成绩的关键。',correct:false},
        {text:'中学生是培养健康情操的重要阶段。',correct:false},
        {text:'阅读名著是提升语文素养的重要途径之一。',correct:true}],
      hints:['A"通过...使..."是什么问题？缺什么？','B"能否"是两面词，后面是一面，两面对一面','C"中学生"和"阶段"能搭配吗？'],
      explanation:'A缺主语，删去"通过"或"使"；B两面对一面，删去"能否"或在"提高"前加"能否"；C搭配不当，"中学生"不是"阶段"，应改为"中学阶段"；D正确。' },
    { topic: '病句-搭配不当', difficulty: 'intermediate', tags: ['病句', '辨析'], question: '下列句子有语病的一项是（　　）', options: [
        {text:'春天的济南是个美丽的季节。',correct:true},
        {text:'《春》是朱自清先生写的一篇优美散文。',correct:false},
        {text:'我们要养成认真写字的好习惯。',correct:false},
        {text:'通过这次活动，我认识到了团结的重要性。',correct:false}],
      hints:['A句的主语和宾语能搭配吗？','济南是城市，不是季节','应该是"济南的春天"'],
      explanation:'A主宾搭配不当："济南"不是"季节"，应改为"济南的春天是个美丽的季节"或"春天的济南是个美丽的地方"。' },
    { topic: '标点符号', difficulty: 'intermediate', tags: ['标点', '运用'], question: '下列句子标点符号使用正确的一项是（　　）', options: [
        {text:'"哎呀，真是美极了！"皇帝说："我十分满意！"',correct:false},
        {text:'我心里默念道："这是我的叔叔，父亲的弟弟，我的亲叔叔。"',correct:true},
        {text:'他站起来问："老师，"不约而同"是什么意思？"',correct:false},
        {text:'我不知道他为什么迟到？',correct:false}],
      hints:['A"某某说"在中间，后面用逗号还是冒号？','C引号里面再用引号要用单引号','D这是陈述句还是疑问句？'],
      explanation:'A"皇帝说"在引语中间，后面应用逗号；C引号内的引号应用单引号；D陈述句末尾应用句号；B正确。' }
];
ChineseBingju.forEach(q => addQuestion('chinese', 'bingju', q));
const ChineseGushi = [
    { topic: '次北固山下', difficulty: 'intermediate', tags: ['古诗', '赏析'],
      passage: '客路青山外，行舟绿水前。潮平两岸阔，风正一帆悬。<br>海日生残夜，江春入旧年。乡书何处达？归雁洛阳边。',
      question: '对"海日生残夜，江春入旧年"赏析有误的一项是（　　）', options: [
        {text:'这两句描写时序交替中的景物，暗示着时光流逝',correct:false},
        {text:'"生""入"用拟人手法，赋予景物以人的意志情思',correct:false},
        {text:'这两句透露出诗人消极、惆怅、悲观的情绪',correct:true},
        {text:'蕴含着新事物孕育于旧事物解体之时的哲理',correct:false}],
      hints:['这两句是千古名句，情感是积极还是消极？','"生""入"体现了什么生机？','积极乐观还是消极悲观？'],
      explanation:'"海日生残夜，江春入旧年"表现了新旧交替的自然理趣，给人以乐观、积极、向上的力量，并非消极惆怅。' },
    { topic: '天净沙秋思', difficulty: 'intermediate', tags: ['古诗', '主旨'],
      passage: '枯藤老树昏鸦，小桥流水人家，古道西风瘦马。夕阳西下，断肠人在天涯。',
      question: '这首曲的主旨句是（　　）', options: [
        {text:'枯藤老树昏鸦',correct:false},
        {text:'小桥流水人家',correct:false},
        {text:'古道西风瘦马',correct:false},
        {text:'夕阳西下，断肠人在天涯',correct:true}],
      hints:['前面三句是什么描写？','写景是为了什么？','哪一句直接表达了作者的情感？'],
      explanation:'"夕阳西下，断肠人在天涯"是主旨句，直接抒发了天涯游子孤寂愁苦、思念家乡的情感。前面几句都是景物烘托。' },
    { topic: '观沧海', difficulty: 'beginner', tags: ['古诗', '默写'], typeInput: 'fill',
      question: '曹操《观沧海》中最能体现作者博大胸襟的句子是：_____，若出其中；_____，若出其里。',
      answer: '日月之行,星汉灿烂',
      hints:['这几句是虚写，运用想象','太阳月亮好像从哪里升起？','银河星光好像出自哪里？'],
      explanation:'"日月之行，若出其中；星汉灿烂，若出其里"运用夸张和想象，写出了大海吞吐日月星辰的气概，表现了曹操博大的胸襟和统一天下的抱负。' },
    { topic: '闻王昌龄左迁', difficulty: 'beginner', tags: ['古诗', '默写'], typeInput: 'fill',
      question: '李白《闻王昌龄左迁龙标遥有此寄》中，把明月人格化，表达对友人不幸遭贬的深切同情与关怀的名句是：_____，随君直到夜郎西。',
      answer: '我寄愁心与明月',
      hints:['诗人要把什么寄托给明月？','"愁心"是什么意思？','明月陪伴友人到哪里？'],
      explanation:'"我寄愁心与明月，随君直到夜郎西"运用拟人手法，将无知无情的明月变成了善解人意的知心人，把思念和同情带给远方的朋友。' }
];
ChineseGushi.forEach(q => addQuestion('chinese', 'gushi', q));
const ChineseWenyan = [
    { topic: '陈太丘与友期行-字词', difficulty: 'intermediate', tags: ['文言文', '实词'],
      passage: '陈太丘与友期行，期日中。过中不至，太丘舍去，去后乃至。元方时年七岁，门外戏。客问元方："尊君在不？"答曰："待君久不至，已去。"友人便怒曰："非人哉！与人期行，相委而去。"元方曰："君与家君期日中。日中不至，则是无信；对子骂父，则是无礼。"友人惭，下车引之。元方入门不顾。',
      question: '下列加点词解释有误的一项是（　　）', options: [
        {text:'陈太丘与友期行（期：约定）',correct:false},
        {text:'太丘舍去（去：离开）',correct:false},
        {text:'相委而去（委：委托）',correct:true},
        {text:'元方入门不顾（顾：回头看）',correct:false}],
      hints:['"相委而去"的"委"是什么意思？','是丢下、舍弃的意思','"委"不是委托'],
      explanation:'"相委而去"的"委"是"舍弃、丢下"的意思，不是"委托"。朋友说陈太丘不等他就走了，丢下他。' },
    { topic: '陈太丘与友期行-理解', difficulty: 'intermediate', tags: ['文言文', '理解'],
      passage: '陈太丘与友期行，期日中。过中不至，太丘舍去，去后乃至。元方时年七岁，门外戏。客问元方："尊君在不？"答曰："待君久不至，已去。"友人便怒曰："非人哉！与人期行，相委而去。"元方曰："君与家君期日中。日中不至，则是无信；对子骂父，则是无礼。"友人惭，下车引之。元方入门不顾。',
      question: '这个小故事告诉我们什么道理？', options: [
        {text:'对朋友要大方，不要小气',correct:false},
        {text:'做人要讲诚信、有礼貌',correct:true},
        {text:'小孩子不懂事可以原谅',correct:false},
        {text:'与人约会要早点到',correct:false}],
      hints:['元方指出友人的两个错误是什么？','"无信"和"无礼"指什么？','核心是哪两种品质？'],
      explanation:'元方指出友人"日中不至，则是无信；对子骂父，则是无礼"，告诉我们做人要讲诚信、懂礼貌，这是中华民族的传统美德。' },
    { topic: '论语十二章-字词', difficulty: 'beginner', tags: ['文言文', '字词'], typeInput: 'fill',
      question:'《论语》中"学而时习之，不亦说乎"的"说"读音是_____，意思是_____。（用一个字回答）',
      answer:'yuè,悦',
      hints:['"说"在这里是通假字，通什么字？','读音不读shuō','表示愉快的意思'],
      explanation:'"说"通"悦"，读yuè，愉快、高兴的意思。这是文言文中的通假字现象。' },
    { topic: '论语-学习方法', difficulty: 'intermediate', tags: ['文言文', '理解'],
      question:'下列《论语》中的句子，属于讲学习方法的是（　　）', options: [
        {text:'人不知而不愠，不亦君子乎？',correct:false},
        {text:'温故而知新，可以为师矣。',correct:true},
        {text:'不义而富且贵，于我如浮云。',correct:false},
        {text:'三军可夺帅也，匹夫不可夺志也。',correct:false}],
      hints:['A是关于修养的','C是关于义利的','D是关于志向的'],
      explanation:'"温故而知新"讲学习方法：复习旧知识能获得新理解，强调复习的重要性。其他选项讲的是品德修养。' }
];
ChineseWenyan.forEach(q => addQuestion('chinese', 'wenyan', q));
const ChineseXiandai = [
    { topic: '春-词语赏析', difficulty: 'intermediate', tags: ['现代文', '赏析'],
      passage: '"小草偷偷地从土里钻出来，嫩嫩的，绿绿的。"（朱自清《春》）',
      question: '"偷偷地""钻"用得好，好在哪里？下列分析不正确的一项是（　　）', options: [
        {text:'"偷偷地"写出了春草悄然而出的情态',correct:false},
        {text:'"钻"写出了小草顽强的生命力',correct:false},
        {text:'"偷偷地"说明小草生长得很隐蔽，不想让人看见',correct:true},
        {text:'运用拟人手法，赋予小草人的情态',correct:false}],
      hints:['"偷偷地"在这里是贬义还是褒义？','是在批评小草吗？','这是拟人手法，写出春草的什么特点？'],
      explanation:'"偷偷地"是拟人手法，写出了春草在不经意间悄然而出的情景，表现出作者的惊喜，不是"不想让人看见"的意思。' },
    { topic: '春-修辞', difficulty: 'beginner', tags: ['现代文', '修辞'],
      passage:'红的像火，粉的像霞，白的像雪。（朱自清《春》）',
      question:'这句话没有使用的修辞手法是（　　）', options: [
        {text:'比喻',correct:false},
        {text:'排比',correct:false},
        {text:'拟人',correct:true},
        {text:'以上都用了',correct:false}],
      hints:['"像"是什么修辞？','三个结构相似的句子是什么修辞？','有没有把物当人写？'],
      explanation:'"像火/像霞/像雪"是比喻；三个"……像……"是排比；没有把事物当作人来写，不是拟人。' },
    { topic: '散步-主旨', difficulty: 'intermediate', tags: ['现代文', '主旨'],
      passage:'但我和妻子都是慢慢地，稳稳地，走得很仔细，好像我背上的同她背上的加起来，就是整个世界。（莫怀戚《散步》）',
      question:'对这句话理解不正确的一项是（　　）', options: [
        {text:'"慢慢地""稳稳地"表现了对老人的尊重和对孩子的爱护',correct:false},
        {text:'"整个世界"表明中年人肩负着赡养老人和抚养孩子的责任',correct:false},
        {text:'这句话写出了他们走得很慢是因为路不好走',correct:true},
        {text:'以小见大，表现了中华民族"尊老爱幼"的传统美德',correct:false}],
      hints:['"走得仔细"是因为路难走吗？','这是在写什么深层含义？','背上背的是什么人？象征什么？'],
      explanation:'"慢慢地、稳稳地"不是因为路不好走，而是象征中年人肩负的责任重大：上有老下有小，要照顾好一家三代，这是对家庭和社会的责任感。' }
];
ChineseXiandai.forEach(q => addQuestion('chinese', 'xiandai', q));
const Achievements = [
    { id: 'first_correct', name: '初出茅庐', desc: '答对第一道题', icon: '🎯', condition: d => d.correctAnswers >= 1 },
    { id: 'streak_3', name: '三连击', desc: '连续答对3题', icon: '🔥', condition: d => d.maxStreak >= 3 },
    { id: 'streak_10', name: '十全十美', desc: '连续答对10题', icon: '💯', condition: d => d.maxStreak >= 10 },
    { id: 'questions_10', name: '勤奋好学', desc: '累计答题10道', icon: '📚', condition: d => d.totalQuestions >= 10 },
    { id: 'questions_50', name: '小有所成', desc: '累计答题50道', icon: '📖', condition: d => d.totalQuestions >= 50 },
    { id: 'questions_100', name: '学霸初现', desc: '累计答题100道', icon: '🏅', condition: d => d.totalQuestions >= 100 },
    { id: 'perfect_10', name: '完美主义者', desc: '10道题全部答对', icon: '✨', condition: d => d.perfectSets >= 1 },
    { id: 'feynman_1', name: '费曼学徒', desc: '第一次使用费曼学习法', icon: '🎓', condition: d => d.feynmanCount >= 1 },
    { id: 'feynman_5', name: '以教为学', desc: '使用费曼学习法5次', icon: '👨‍🏫', condition: d => d.feynmanCount >= 5 },
    { id: 'speech_1', name: '开口说英语', desc: '第一次完成口语跟读', icon: '🗣️', condition: d => d.speakingCount >= 1 },
    { id: 'all_subjects', name: '全面发展', desc: '三个科目都答过题', icon: '🌈', condition: d => d.subjectsTried && d.subjectsTried.english && d.subjectsTried.math && d.subjectsTried.chinese },
    { id: 'review_master', name: '复习达人', desc: '完成20次复习', icon: '🔄', condition: d => d.reviewCount >= 20 }
];

