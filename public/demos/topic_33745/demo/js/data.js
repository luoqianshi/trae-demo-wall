const COURSE_DATA = {
    languages: [
        {
            id: 'en',
            name: '英语',
            nativeName: 'English',
            icon: '🇬🇧',
            color: '#6366f1',
            colorLight: '#eef2ff',
            description: '全球通用语言，带你连接世界',
            levels: ['A1 入门', 'A2 初级', 'B1 中级', 'B2 中高级', 'C1 高级']
        },
        {
            id: 'ja',
            name: '日语',
            nativeName: '日本語',
            icon: '🇯🇵',
            color: '#ec4899',
            colorLight: '#fdf2f8',
            description: '感受日本文化的独特魅力',
            levels: ['N5 入门', 'N4 初级', 'N3 中级', 'N2 中高级', 'N1 高级']
        },
        {
            id: 'ko',
            name: '韩语',
            nativeName: '한국어',
            icon: '🇰🇷',
            color: '#10b981',
            colorLight: '#f0fdf4',
            description: '体验韩国流行文化的语言之旅',
            levels: ['初级1', '初级2', '中级1', '中级2', '高级']
        }
    ],

    lessons: {
        en: {
            'A1 入门': [
                { id: 'en-a1-1', title: 'Greetings 问候语', type: 'vocabulary', duration: 15, icon: '👋' },
                { id: 'en-a1-2', title: 'Numbers 数字', type: 'vocabulary', duration: 20, icon: '🔢' },
                { id: 'en-a1-3', title: 'Self-introduction 自我介绍', type: 'speaking', duration: 25, icon: '💬' },
                { id: 'en-a1-4', title: 'Basic grammar: be动词', type: 'grammar', duration: 30, icon: '📝' },
                { id: 'en-a1-5', title: 'Listening practice 听力练习', type: 'listening', duration: 20, icon: '👂' }
            ],
            'A2 初级': [
                { id: 'en-a2-1', title: 'Daily life 日常生活', type: 'vocabulary', duration: 25, icon: '🏠' },
                { id: 'en-a2-2', title: 'Present tense 现在时', type: 'grammar', duration: 30, icon: '⏰' },
                { id: 'en-a2-3', title: 'Ordering food 点餐', type: 'speaking', duration: 20, icon: '🍔' },
                { id: 'en-a2-4', title: 'Shopping dialogue', type: 'listening', duration: 25, icon: '🛒' }
            ],
            'B1 中级': [
                { id: 'en-b1-1', title: 'Travel vocabulary', type: 'vocabulary', duration: 30, icon: '✈️' },
                { id: 'en-b1-2', title: 'Past tense 过去时', type: 'grammar', duration: 35, icon: '📅' },
                { id: 'en-b1-3', title: 'Expressing opinions', type: 'speaking', duration: 30, icon: '💭' },
                { id: 'en-b1-4', title: 'News listening', type: 'listening', duration: 30, icon: '📰' }
            ],
            'B2 中高级': [
                { id: 'en-b2-1', title: 'Business English', type: 'vocabulary', duration: 35, icon: '💼' },
                { id: 'en-b2-2', title: 'Complex sentences', type: 'grammar', duration: 40, icon: '📖' },
                { id: 'en-b2-3', title: 'Debate practice', type: 'speaking', duration: 40, icon: '🎤' },
                { id: 'en-b2-4', title: 'TED talk listening', type: 'listening', duration: 35, icon: '🎬' }
            ],
            'C1 高级': [
                { id: 'en-c1-1', title: 'Academic vocabulary', type: 'vocabulary', duration: 40, icon: '🎓' },
                { id: 'en-c1-2', title: 'Advanced grammar', type: 'grammar', duration: 45, icon: '📚' },
                { id: 'en-c1-3', title: 'Public speaking', type: 'speaking', duration: 45, icon: '🏛️' },
                { id: 'en-c1-4', title: 'Literature listening', type: 'listening', duration: 40, icon: '📜' }
            ]
        },
        ja: {
            'N5 入门': [
                { id: 'ja-n5-1', title: 'あいさつ 问候', type: 'vocabulary', duration: 15, icon: '👋' },
                { id: 'ja-n5-2', title: 'ひらがな 平假名', type: 'vocabulary', duration: 30, icon: '🔤' },
                { id: 'ja-n5-3', title: '自己紹介 自我介绍', type: 'speaking', duration: 25, icon: '💬' },
                { id: 'ja-n5-4', title: 'です/ます 基础语法', type: 'grammar', duration: 30, icon: '📝' },
                { id: 'ja-n5-5', title: 'リスニング 听力', type: 'listening', duration: 20, icon: '👂' }
            ],
            'N4 初级': [
                { id: 'ja-n4-1', title: '家族 家庭词汇', type: 'vocabulary', duration: 25, icon: '👨‍👩‍👧' },
                { id: 'ja-n4-2', title: 'ます形/て形', type: 'grammar', duration: 30, icon: '⏰' },
                { id: 'ja-n4-3', title: 'レストラン 餐厅对话', type: 'speaking', duration: 20, icon: '🍜' },
                { id: 'ja-n4-4', title: 'ショッピング 购物听力', type: 'listening', duration: 25, icon: '🛒' }
            ],
            'N3 中级': [
                { id: 'ja-n3-1', title: '旅行 旅行词汇', type: 'vocabulary', duration: 30, icon: '✈️' },
                { id: 'ja-n3-2', title: '受身形 被动语态', type: 'grammar', duration: 35, icon: '📅' },
                { id: 'ja-n3-3', title: '意見を述べる 表达意见', type: 'speaking', duration: 30, icon: '💭' },
                { id: 'ja-n3-4', title: 'ニュース 新闻听力', type: 'listening', duration: 30, icon: '📰' }
            ],
            'N2 中高级': [
                { id: 'ja-n2-1', title: 'ビジネス 商务日语', type: 'vocabulary', duration: 35, icon: '💼' },
                { id: 'ja-n2-2', title: '敬語 敬语', type: 'grammar', duration: 40, icon: '📖' },
                { id: 'ja-n2-3', title: 'ディベート 辩论', type: 'speaking', duration: 40, icon: '🎤' },
                { id: 'ja-n2-4', title: 'ドラマ 日剧听力', type: 'listening', duration: 35, icon: '🎬' }
            ],
            'N1 高级': [
                { id: 'ja-n1-1', title: '学術用語 学术词汇', type: 'vocabulary', duration: 40, icon: '🎓' },
                { id: 'ja-n1-2', title: '高度な文法 高级语法', type: 'grammar', duration: 45, icon: '📚' },
                { id: 'ja-n1-3', title: 'スピーチ 演讲', type: 'speaking', duration: 45, icon: '🏛️' },
                { id: 'ja-n1-4', title: '文学作品 文学听力', type: 'listening', duration: 40, icon: '📜' }
            ]
        },
        ko: {
            '初级1': [
                { id: 'ko-1-1', title: '인사말 问候语', type: 'vocabulary', duration: 15, icon: '👋' },
                { id: 'ko-1-2', title: '한글 韩文字母', type: 'vocabulary', duration: 30, icon: '🔤' },
                { id: 'ko-1-3', title: '자기소개 自我介绍', type: 'speaking', duration: 25, icon: '💬' },
                { id: 'ko-1-4', title: '입니다/아요 基础语法', type: 'grammar', duration: 30, icon: '📝' },
                { id: 'ko-1-5', title: '듣기 听力练习', type: 'listening', duration: 20, icon: '👂' }
            ],
            '初级2': [
                { id: 'ko-2-1', title: '일상생활 日常生活', type: 'vocabulary', duration: 25, icon: '🏠' },
                { id: 'ko-2-2', title: '현재시제 现在时', type: 'grammar', duration: 30, icon: '⏰' },
                { id: 'ko-2-3', title: '주문하기 点餐', type: 'speaking', duration: 20, icon: '🍲' },
                { id: 'ko-2-4', title: '쇼핑 购物听力', type: 'listening', duration: 25, icon: '🛒' }
            ],
            '中级1': [
                { id: 'ko-3-1', title: '여행 旅行词汇', type: 'vocabulary', duration: 30, icon: '✈️' },
                { id: 'ko-3-2', title: '과거시제 过去时', type: 'grammar', duration: 35, icon: '📅' },
                { id: 'ko-3-3', title: '의견표현 表达意见', type: 'speaking', duration: 30, icon: '💭' },
                { id: 'ko-3-4', title: '뉴스 新闻听力', type: 'listening', duration: 30, icon: '📰' }
            ],
            '中级2': [
                { id: 'ko-4-1', title: '비즈니스 商务韩语', type: 'vocabulary', duration: 35, icon: '💼' },
                { id: 'ko-4-2', title: '복잡한 문장 复杂句子', type: 'grammar', duration: 40, icon: '📖' },
                { id: 'ko-4-3', title: '토론 辩论', type: 'speaking', duration: 40, icon: '🎤' },
                { id: 'ko-4-4', title: 'K-drama 韩剧听力', type: 'listening', duration: 35, icon: '🎬' }
            ],
            '高级': [
                { id: 'ko-5-1', title: '학술용어 学术词汇', type: 'vocabulary', duration: 40, icon: '🎓' },
                { id: 'ko-5-2', title: '고급문법 高级语法', type: 'grammar', duration: 45, icon: '📚' },
                { id: 'ko-5-3', title: '연설 演讲', type: 'speaking', duration: 45, icon: '🏛️' },
                { id: 'ko-5-4', title: '문학 文学听力', type: 'listening', duration: 40, icon: '📜' }
            ]
        }
    },

    vocabulary: {
        'en-a1-1': [
            { word: 'Hello', phonetic: '/həˈləʊ/', meaning: '你好', example: 'Hello, nice to meet you.' },
            { word: 'Good morning', phonetic: '/ɡʊd ˈmɔːnɪŋ/', meaning: '早上好', example: 'Good morning, everyone!' },
            { word: 'Goodbye', phonetic: '/ɡʊdˈbaɪ/', meaning: '再见', example: 'Goodbye, see you tomorrow.' },
            { word: 'Thank you', phonetic: '/θæŋk juː/', meaning: '谢谢', example: 'Thank you for your help.' },
            { word: 'Sorry', phonetic: '/ˈsɒri/', meaning: '对不起', example: 'I am sorry for being late.' },
            { word: 'Please', phonetic: '/pliːz/', meaning: '请', example: 'Please sit down.' },
            { word: 'Excuse me', phonetic: '/ɪkˈskjuːz miː/', meaning: '打扰一下', example: 'Excuse me, where is the bathroom?' },
            { word: 'You are welcome', phonetic: '/juː ɑː ˈwelkəm/', meaning: '不客气', example: 'You are welcome!' }
        ],
        'en-a1-2': [
            { word: 'One', phonetic: '/wʌn/', meaning: '一', example: 'I have one book.' },
            { word: 'Two', phonetic: '/tuː/', meaning: '二', example: 'Two cats are playing.' },
            { word: 'Three', phonetic: '/θriː/', meaning: '三', example: 'Three apples please.' },
            { word: 'Four', phonetic: '/fɔːr/', meaning: '四', example: 'Four seasons in a year.' },
            { word: 'Five', phonetic: '/faɪv/', meaning: '五', example: 'Five fingers on my hand.' },
            { word: 'Ten', phonetic: '/ten/', meaning: '十', example: 'Ten students in the class.' },
            { word: 'Hundred', phonetic: '/ˈhʌndrəd/', meaning: '一百', example: 'One hundred dollars.' },
            { word: 'Thousand', phonetic: '/ˈθaʊzənd/', meaning: '一千', example: 'A thousand miles away.' }
        ],
        'ja-n5-1': [
            { word: 'こんにちは', phonetic: 'kon-ni-chi-wa', meaning: '你好', example: 'こんにちは、田中さん。' },
            { word: 'おはようございます', phonetic: 'o-ha-yō go-zai-ma-su', meaning: '早上好', example: 'おはようございます、皆さん。' },
            { word: 'さようなら', phonetic: 'sa-yō-na-ra', meaning: '再见', example: 'さようなら、また明日。' },
            { word: 'ありがとう', phonetic: 'a-ri-ga-tō', meaning: '谢谢', example: 'ありがとうございます。' },
            { word: 'すみません', phonetic: 'su-mi-ma-sen', meaning: '对不起', example: 'すみません、遅れました。' },
            { word: 'お願いします', phonetic: 'o-ne-gai shi-ma-su', meaning: '请', example: 'コーヒーをお願いします。' },
            { word: 'はじめまして', phonetic: 'ha-ji-me-ma-shi-te', meaning: '初次见面', example: 'はじめまして、佐藤です。' },
            { word: 'どういたしまして', phonetic: 'dō i-ta-shi-ma-shi-te', meaning: '不客气', example: 'どういたしまして。' }
        ],
        'ja-n5-2': [
            { word: 'あ', phonetic: 'a', meaning: 'a', example: 'あした (明天)' },
            { word: 'い', phonetic: 'i', meaning: 'i', example: 'いぬ (狗)' },
            { word: 'う', phonetic: 'u', meaning: 'u', example: 'うみ (海)' },
            { word: 'え', phonetic: 'e', meaning: 'e', example: 'えき (车站)' },
            { word: 'お', phonetic: 'o', meaning: 'o', example: 'おとこ (男人)' },
            { word: 'か', phonetic: 'ka', meaning: 'ka', example: 'かお (脸)' },
            { word: 'き', phonetic: 'ki', meaning: 'ki', example: 'きく (听)' },
            { word: 'く', phonetic: 'ku', meaning: 'ku', example: 'くも (云)' }
        ],
        'ko-1-1': [
            { word: '안녕하세요', phonetic: 'an-nyeong-ha-se-yo', meaning: '你好', example: '안녕하세요, 김씨.' },
            { word: '안녕히 가세요', phonetic: 'an-nyeong-hi ga-se-yo', meaning: '再见', example: '안녕히 가세요, 내일 봐요.' },
            { word: '감사합니다', phonetic: 'gam-sa-ham-ni-da', meaning: '谢谢', example: '감사합니다, 선생님.' },
            { word: '죄송합니다', phonetic: 'joe-song-ham-ni-da', meaning: '对不起', example: '죄송합니다, 늦었어요.' },
            { word: '주세요', phonetic: 'ju-se-yo', meaning: '请给我', example: '커피 주세요.' },
            { word: '만나서 반갑습니다', phonetic: 'man-na-seo ban-gap-seum-ni-da', meaning: '很高兴见到你', example: '만나서 반갑습니다.' },
            { word: '천만에요', phonetic: 'cheon-man-e-yo', meaning: '不客气', example: '천만에요.' },
            { word: '좋은 아침', phonetic: 'jo-eun a-chim', meaning: '早上好', example: '좋은 아침이에요.' }
        ],
        'ko-1-2': [
            { word: 'ㄱ', phonetic: 'g/k', meaning: 'giyeok', example: '가다 (去)' },
            { word: 'ㄴ', phonetic: 'n', meaning: 'nieun', example: '나 (我)' },
            { word: 'ㄷ', phonetic: 'd/t', meaning: 'digeut', example: '다다 (全部)' },
            { word: 'ㄹ', phonetic: 'r/l', meaning: 'rieul', example: '라디오 (收音机)' },
            { word: 'ㅁ', phonetic: 'm', meaning: 'mieum', example: '마마 (妈妈)' },
            { word: 'ㅂ', phonetic: 'b/p', meaning: 'bieup', example: '바다 (海)' },
            { word: 'ㅅ', phonetic: 's', meaning: 'siot', example: '사다 (买)' },
            { word: 'ㅇ', phonetic: 'ng/silent', meaning: 'ieung', example: '아이 (孩子)' }
        ]
    },

    grammar: {
        'en-a1-4': {
            title: 'be动词 (am, is, are)',
            explanation: 'be动词是英语中最基础的动词，用于连接主语和表语。根据人称不同变化为：I am, you/we/they are, he/she/it is。',
            questions: [
                { question: 'I ___ a student.', options: ['am', 'is', 'are', 'be'], answer: 0, explain: 'I后面用am。' },
                { question: 'She ___ my teacher.', options: ['am', 'is', 'are', 'be'], answer: 1, explain: 'She是第三人称单数，用is。' },
                { question: 'They ___ my friends.', options: ['am', 'is', 'are', 'be'], answer: 2, explain: 'They是复数，用are。' },
                { question: 'We ___ in the classroom.', options: ['am', 'is', 'are', 'be'], answer: 2, explain: 'We是复数，用are。' }
            ]
        },
        'ja-n5-4': {
            title: 'です/ます形',
            explanation: 'です用于名词和形容词后，ます用于动词后，表示礼貌的断定或动作。',
            questions: [
                { question: '私は学生___。', options: ['です', 'ます', 'だ', 'でした'], answer: 0, explain: '名词后接です表示断定。' },
                { question: '毎日勉強し___。', options: ['です', 'ます', 'だ', 'でした'], answer: 1, explain: '动词后接ます。' },
                { question: 'これは本___。', options: ['です', 'ます', 'だ', 'でした'], answer: 0, explain: '名词后接です。' },
                { question: '朝ご飯を食べ___。', options: ['です', 'ます', 'だ', 'でした'], answer: 1, explain: '动词后接ます。' }
            ]
        },
        'ko-1-4': {
            title: '입니다/아요/어요',
            explanation: '입니다用于名词后表示礼貌的断定。动词/形容词词干后接아요/어요表示现在时。',
            questions: [
                { question: '저는 학생___。', options: ['입니다', '아요', '어요', '해요'], answer: 0, explain: '名词后接입니다。' },
                { question: '밥을 먹___。', options: ['입니다', '아요', '어요', '해요'], answer: 2, explain: '먹다 + 어요 = 먹어요。' },
                { question: '가수___。', options: ['입니다', '아요', '어요', '해요'], answer: 0, explain: '职业名词后接입니다。' },
                { question: '공부하___。', options: ['입니다', '아요', '어요', '해요'], answer: 3, explain: '하다动词后接해요。' }
            ]
        }
    },

    speaking: {
        'en-a1-3': [
            { sentence: 'Hello, my name is Tom.', translation: '你好，我叫Tom。' },
            { sentence: 'I am from China.', translation: '我来自中国。' },
            { sentence: 'I am 20 years old.', translation: '我20岁。' },
            { sentence: 'Nice to meet you.', translation: '很高兴见到你。' },
            { sentence: 'I am a student.', translation: '我是一名学生。' }
        ],
        'ja-n5-3': [
            { sentence: 'はじめまして、佐藤です。', translation: '初次见面，我是佐藤。' },
            { sentence: '日本から来ました。', translation: '我来自日本。' },
            { sentence: '20歳です。', translation: '我20岁。' },
            { sentence: 'どうぞよろしくお願いします。', translation: '请多关照。' },
            { sentence: '学生です。', translation: '我是学生。' }
        ],
        'ko-1-3': [
            { sentence: '안녕하세요, 김민수입니다.', translation: '你好，我是金民秀。' },
            { sentence: '한국에서 왔어요.', translation: '我来自韩国。' },
            { sentence: '스무 살이에요.', translation: '我20岁。' },
            { sentence: '만나서 반갑습니다.', translation: '很高兴见到你。' },
            { sentence: '학생이에요.', translation: '我是学生。' }
        ]
    },

    listening: {
        'en-a1-5': {
            audio: 'Dialogue: A: Hello, my name is Alice. B: Hi Alice, I am Bob. A: Nice to meet you Bob. Where are you from? B: I am from America. A: I am from England.',
            questions: [
                { question: 'What is the first speaker\'s name?', options: ['Alice', 'Bob', 'Tom', 'Mary'], answer: 0, explain: 'A说 my name is Alice。' },
                { question: 'Where is Bob from?', options: ['England', 'America', 'China', 'Japan'], answer: 1, explain: 'B说 I am from America。' },
                { question: 'Where is Alice from?', options: ['England', 'America', 'China', 'Japan'], answer: 0, explain: 'A说 I am from England。' }
            ]
        },
        'ja-n5-5': {
            audio: '对话：A：こんにちは、佐藤です。B：はじめまして、田中です。A：どちらから来ましたか。B：大阪から来ました。A：私は東京出身です。',
            questions: [
                { question: 'Aさんの名前は？', options: ['佐藤', '田中', '鈴木', '山田'], answer: 0, explain: 'A说 佐藤です。' },
                { question: 'Bさんはどこから来ましたか？', options: ['東京', '大阪', '京都', '名古屋'], answer: 1, explain: 'B说 大阪から来ました。' },
                { question: 'Aさんはどこの出身ですか？', options: ['東京', '大阪', '京都', '名古屋'], answer: 0, explain: 'A说 私は東京出身です。' }
            ]
        },
        'ko-1-5': {
            audio: '대화: A: 안녕하세요, 김민수입니다. B: 안녕하세요, 박지영입니다. A: 어디에서 오셨어요? B: 서울에서 왔어요. A: 저는 부산에서 왔어요.',
            questions: [
                { question: 'A의 이름은?', options: ['김민수', '박지영', '이준호', '최수진'], answer: 0, explain: 'A说 김민수입니다。' },
                { question: 'B는 어디에서 왔어요?', options: ['서울', '부산', '인천', '대구'], answer: 0, explain: 'B说 서울에서 왔어요。' },
                { question: 'A는 어디에서 왔어요?', options: ['서울', '부산', '인천', '대구'], answer: 1, explain: 'A说 저는 부산에서 왔어요。' }
            ]
        }
    },

    achievements: [
        { id: 'first-lesson', icon: '🎯', title: '初次学习', desc: '完成第一节课', xp: 50, condition: (stats) => stats.completedLessons >= 1 },
        { id: 'streak-3', icon: '🔥', title: '连续3天', desc: '连续学习3天', xp: 100, condition: (stats) => stats.streak >= 3 },
        { id: 'streak-7', icon: '⚡', title: '一周坚持', desc: '连续学习7天', xp: 200, condition: (stats) => stats.streak >= 7 },
        { id: 'vocab-50', icon: '📖', title: '词汇达人', desc: '学习50个单词', xp: 150, condition: (stats) => stats.vocabLearned >= 50 },
        { id: 'vocab-200', icon: '📚', title: '词汇大师', desc: '学习200个单词', xp: 500, condition: (stats) => stats.vocabLearned >= 200 },
        { id: 'grammar-10', icon: '✍️', title: '语法小能手', desc: '完成10道语法题', xp: 100, condition: (stats) => stats.grammarSolved >= 10 },
        { id: 'speaking-5', icon: '🎤', title: '口语练习者', desc: '完成5次口语练习', xp: 150, condition: (stats) => stats.speakingCompleted >= 5 },
        { id: 'listening-10', icon: '👂', title: '听力高手', desc: '完成10次听力练习', xp: 150, condition: (stats) => stats.listeningCompleted >= 10 },
        { id: 'level-2', icon: '⭐', title: '进步之星', desc: '达到等级2', xp: 200, condition: (stats) => stats.level >= 2 },
        { id: 'level-5', icon: '🌟', title: '语言学者', desc: '达到等级5', xp: 500, condition: (stats) => stats.level >= 5 },
        { id: 'first-post', icon: '💬', title: '社区初体验', desc: '在社区发布第一条帖子', xp: 50, condition: (stats) => stats.postsMade >= 1 },
        { id: 'likes-10', icon: '❤️', title: '受欢迎者', desc: '获得10个点赞', xp: 100, condition: (stats) => stats.likesReceived >= 10 }
    ],

    samplePosts: [
        { id: 'p1', username: '小林', content: '刚完成N5的第一课，感觉日语的发音真的很有节奏感！大家有什么好的学习方法推荐吗？', tags: ['日语', 'N5', '学习心得'], time: '2小时前', likes: 12, replies: [] },
        { id: 'p2', username: 'Emma', content: '英语的过去时真的让我头疼啊！不规则动词太多了，有没有记忆技巧？', tags: ['英语', '语法', '求助'], time: '5小时前', likes: 8, replies: [] },
        { id: 'p3', username: '한국팬', content: '发现韩语的发音和中文有些相似的地方，学起来感觉挺亲切的！', tags: ['韩语', '发音', '心得'], time: '1天前', likes: 15, replies: [] },
        { id: 'p4', username: '多语学习者', content: '我同时在学英语和日语，发现两种语言的思维方式完全不同，太有趣了！', tags: ['英语', '日语', '多语学习'], time: '1天前', likes: 20, replies: [] },
        { id: 'p5', username: '坚持者', content: '连续学习30天打卡！从一开始的每天10分钟到现在能坚持1小时，进步真的看得见。', tags: ['打卡', '坚持', '学习心得'], time: '2天前', likes: 35, replies: [] }
    ]
};
