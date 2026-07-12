const AppData = {
    languages: {
        en: {
            name: '英语',
            flag: '🇺🇸',
            levels: ['入门', '初级', '中级', '高级'],
            description: '全球通用语言，商务、旅行必备'
        },
        ja: {
            name: '日语',
            flag: '🇯🇵',
            levels: ['入门', 'N5', 'N4', 'N3'],
            description: '动漫、文化、商务交流'
        },
        ko: {
            name: '韩语',
            flag: '🇰🇷',
            levels: ['入门', '初级', '中级', '高级'],
            description: '韩剧、K-pop、韩国文化'
        }
    },

    vocabulary: {
        en: [
            { word: 'apple', meaning: '苹果', example: 'I eat an apple every day.', phonetic: '/ˈæpl/' },
            { word: 'book', meaning: '书', example: 'This book is very interesting.', phonetic: '/bʊk/' },
            { word: 'computer', meaning: '电脑', example: 'I use a computer for work.', phonetic: '/kəmˈpjuːtər/' },
            { word: 'happy', meaning: '快乐的', example: 'She looks very happy today.', phonetic: '/ˈhæpi/' },
            { word: 'water', meaning: '水', example: 'Please give me a glass of water.', phonetic: '/ˈwɔːtər/' },
            { word: 'friend', meaning: '朋友', example: 'He is my best friend.', phonetic: '/frend/' },
            { word: 'school', meaning: '学校', example: 'I go to school every day.', phonetic: '/skuːl/' },
            { word: 'beautiful', meaning: '美丽的', example: 'What a beautiful day!', phonetic: '/ˈbjuːtɪfl/' },
            { word: 'important', meaning: '重要的', example: 'This is very important.', phonetic: '/ɪmˈpɔːrtənt/' },
            { word: 'learn', meaning: '学习', example: 'I want to learn English.', phonetic: '/lɜːrn/' }
        ],
        ja: [
            { word: 'こんにちは', meaning: '你好', example: 'こんにちは、元気ですか？', phonetic: 'konnichiwa' },
            { word: 'ありがとう', meaning: '谢谢', example: 'ありがとうございます。', phonetic: 'arigatou' },
            { word: '水', meaning: '水', example: '水をください。', phonetic: 'mizu' },
            { word: '本', meaning: '书', example: 'この本は面白いです。', phonetic: 'hon' },
            { word: '学校', meaning: '学校', example: '学校に行きます。', phonetic: 'gakkou' },
            { word: '友達', meaning: '朋友', example: '彼は私の友達です。', phonetic: 'tomodachi' },
            { word: '食べる', meaning: '吃', example: 'ご飯を食べる。', phonetic: 'taberu' },
            { word: '飲む', meaning: '喝', example: '水を飲む。', phonetic: 'nomu' },
            { word: '勉強', meaning: '学习', example: '日本語を勉強します。', phonetic: 'benkyou' },
            { word: '先生', meaning: '老师', example: '田中先生は優しいです。', phonetic: 'sensei' }
        ],
        ko: [
            { word: '안녕하세요', meaning: '你好', example: '안녕하세요, 만나서 반갑습니다.', phonetic: 'annyeonghaseyo' },
            { word: '감사합니다', meaning: '谢谢', example: '도와주셔서 감사합니다.', phonetic: 'gamsahamnida' },
            { word: '물', meaning: '水', example: '물 한 잔 주세요.', phonetic: 'mul' },
            { word: '책', meaning: '书', example: '이 책은 재미있어요.', phonetic: 'chaek' },
            { word: '학교', meaning: '学校', example: '학교에 갑니다.', phonetic: 'hakgyo' },
            { word: '친구', meaning: '朋友', example: '그는 제 친구예요.', phonetic: 'chingu' },
            { word: '먹다', meaning: '吃', example: '밥을 먹어요.', phonetic: 'meokda' },
            { word: '마시다', meaning: '喝', example: '물을 마셔요.', phonetic: 'masida' },
            { word: '공부', meaning: '学习', example: '한국어를 공부해요.', phonetic: 'gongbu' },
            { word: '선생님', meaning: '老师', example: '선생님께 감사드려요.', phonetic: 'seonsaengnim' }
        ]
    },

    grammar: {
        en: [
            {
                title: '一般现在时',
                description: '表示经常发生的动作或存在的状态',
                questions: [
                    { type: 'choice', question: 'She ___ to school every day.', options: ['go', 'goes', 'going', 'went'], answer: 1 },
                    { type: 'choice', question: 'They ___ football on weekends.', options: ['play', 'plays', 'playing', 'played'], answer: 0 },
                    { type: 'fill', question: 'I ___ (be) a student.', answer: 'am' },
                    { type: 'fill', question: 'He ___ (have) a cat.', answer: 'has' }
                ]
            },
            {
                title: '现在进行时',
                description: '表示正在进行的动作',
                questions: [
                    { type: 'choice', question: 'Look! The children ___ in the park.', options: ['play', 'plays', 'are playing', 'played'], answer: 2 },
                    { type: 'choice', question: 'She ___ her homework now.', options: ['do', 'does', 'is doing', 'did'], answer: 2 },
                    { type: 'fill', question: 'I ___ (read) a book now.', answer: 'am reading' },
                    { type: 'fill', question: 'They ___ (watch) TV.', answer: 'are watching' }
                ]
            }
        ],
        ja: [
            {
                title: 'ます形',
                description: '礼貌体动词变形',
                questions: [
                    { type: 'choice', question: '毎朝新聞を___。', options: ['読みます', '読んでます', '読みました', '読んで'], answer: 0 },
                    { type: 'choice', question: 'コーヒーを___か。', options: ['飲みます', '飲んでます', '飲みました', '飲んで'], answer: 0 },
                    { type: 'fill', question: '日本語を___(勉強します)。', answer: '勉強します' },
                    { type: 'fill', question: '学校に___(行きます)。', answer: '行きます' }
                ]
            }
        ],
        ko: [
            {
                title: '现在时',
                description: '表示现在的状态或经常发生的动作',
                questions: [
                    { type: 'choice', question: '저는 학생___.', options: ['이에요', '입니다', '이었어요', '일거예요'], answer: 1 },
                    { type: 'choice', question: '밥을___.', options: ['먹어요', '먹었어요', '먹을 거예요', '먹다'], answer: 0 },
                    { type: 'fill', question: '저는 한국어를 ___(공부해요).', answer: '공부해요' },
                    { type: 'fill', question: '물을 ___(마셔요).', answer: '마셔요' }
                ]
            }
        ]
    },

    listening: {
        en: [
            { title: '日常对话 - 购物', audioText: "A: Can I help you? B: Yes, I'd like a cup of coffee. A: Black or white? B: White, please. A: Anything else? B: No, thank you.", questions: [
                { question: 'What does the person want?', options: ['Tea', 'Coffee', 'Juice', 'Water'], answer: 1 },
                { question: 'How does the person like the drink?', options: ['Black', 'White', 'Iced', 'Hot'], answer: 1 }
            ]},
            { title: '天气预报', audioText: "Good morning! Today will be sunny and warm. The temperature will be around 25 degrees. Tomorrow will be cloudy with some rain in the afternoon.", questions: [
                { question: "What's the weather like today?", options: ['Rainy', 'Cloudy', 'Sunny', 'Snowy'], answer: 2 },
                { question: "What's the temperature today?", options: ['20 degrees', '25 degrees', '30 degrees', '15 degrees'], answer: 1 }
            ]}
        ],
        ja: [
            { title: '日常对话 - 餐厅', audioText: "A: いらっしゃいませ。何名様ですか？ B: 二人です。 A: ご注文は？ B: ラーメンをお願いします。 A: かしこまりました。少々お待ちください。", questions: [
                { question: '何人で来ましたか？', options: ['一人', '二人', '三人', '四人'], answer: 1 },
                { question: '何を注文しましたか？', options: ['うどん', 'そば', 'ラーメン', 'ご飯'], answer: 2 }
            ]}
        ],
        ko: [
            { title: '日常对话 - 咖啡店', audioText: "A: 어서 오세요. 뭐 드릴까요? B: 아이스 아메리카노 한 잔 주세요. A: 사이즈는 어떻게 해드릴까요? B: 톨 사이즈로 주세요. A: 네, 잠시만 기다려 주세요.", questions: [
                { question: '무엇을 주문했습니까?', options: ['따뜻한 커피', '아이스 아메리카노', '주스', '차'], answer: 1 },
                { question: '사이즈는 무엇입니까?', options: ['스몰', '톨', '그란데', '벤티'], answer: 1 }
            ]}
        ]
    },

    speaking: {
        en: [
            { text: 'Hello, nice to meet you.', translation: '你好，很高兴见到你。' },
            { text: 'How are you today?', translation: '你今天怎么样？' },
            { text: 'I am learning English.', translation: '我正在学习英语。' },
            { text: 'Thank you very much.', translation: '非常感谢你。' },
            { text: 'See you tomorrow.', translation: '明天见。' }
        ],
        ja: [
            { text: 'こんにちは、はじめまして。', translation: '你好，初次见面。' },
            { text: 'お元気ですか？', translation: '你好吗？' },
            { text: '日本語を勉強しています。', translation: '我正在学习日语。' },
            { text: 'ありがとうございます。', translation: '非常感谢。' },
            { text: 'また明日。', translation: '明天见。' }
        ],
        ko: [
            { text: '안녕하세요, 만나서 반갑습니다.', translation: '你好，很高兴见到你。' },
            { text: '오늘 기분이 어떠세요?', translation: '你今天心情怎么样？' },
            { text: '저는 한국어를 공부하고 있어요.', translation: '我正在学习韩语。' },
            { text: '정말 감사합니다.', translation: '非常感谢。' },
            { text: '내일 봐요.', translation: '明天见。' }
        ]
    },

    courses: {
        en: [
            { id: 'en1', title: '英语入门 - 基础词汇', level: '入门', duration: '2周', lessons: 10, description: '从零开始，学习英语最基础的100个常用词汇' },
            { id: 'en2', title: '英语初级 - 日常会话', level: '初级', duration: '4周', lessons: 20, description: '掌握日常交流中最常用的对话和句型' },
            { id: 'en3', title: '英语中级 - 语法进阶', level: '中级', duration: '6周', lessons: 30, description: '系统学习中级语法，提升句子表达能力' },
            { id: 'en4', title: '英语高级 - 商务英语', level: '高级', duration: '8周', lessons: 40, description: '职场商务场景英语，邮件、会议、谈判全掌握' }
        ],
        ja: [
            { id: 'ja1', title: '日语入门 - 五十音图', level: '入门', duration: '2周', lessons: 10, description: '从零开始，掌握日语五十音图的读写' },
            { id: 'ja2', title: '日语N5 - 基础语法', level: 'N5', duration: '4周', lessons: 20, description: 'N5级别核心语法，打好日语学习基础' },
            { id: 'ja3', title: '日语N4 - 词汇强化', level: 'N4', duration: '6周', lessons: 30, description: 'N4级核心词汇，扩展日语词汇量' },
            { id: 'ja4', title: '日语N3 - 听力突破', level: 'N3', duration: '8周', lessons: 40, description: 'N3级听力专项训练，提升听力理解能力' }
        ],
        ko: [
            { id: 'ko1', title: '韩语入门 - 发音基础', level: '入门', duration: '2周', lessons: 10, description: '掌握韩语四十音，打好发音基础' },
            { id: 'ko2', title: '韩语初级 - 日常表达', level: '初级', duration: '4周', lessons: 20, description: '日常场景常用韩语表达，轻松开口说' },
            { id: 'ko3', title: '韩语中级 - 语法系统', level: '中级', duration: '6周', lessons: 30, description: '系统学习中级语法，构建韩语语法体系' },
            { id: 'ko4', title: '韩语高级 - 文化深度', level: '高级', duration: '8周', lessons: 40, description: '深入学习韩国文化，语言文化双提升' }
        ]
    },

    communityPosts: [
        { id: 1, author: '李小明', avatar: 'L', level: '英语中级', content: '今天终于把过去完成时搞懂了！分享一下我的学习笔记，希望能帮助到大家。', likes: 23, comments: 8, time: '2小时前' },
        { id: 2, author: '王小红', avatar: 'W', level: '日语N4', content: '推荐一部超棒的日语动画片《哆啦A梦》，发音清晰，非常适合练习听力！', likes: 45, comments: 15, time: '5小时前' },
        { id: 3, author: '张伟', avatar: 'Z', level: '韩语初级', content: '有没有一起学习韩语的小伙伴？组建一个学习小组互相监督怎么样？', likes: 32, comments: 21, time: '1天前' },
        { id: 4, author: '刘洋', avatar: 'L', level: '英语高级', content: '分享我的背单词方法：结合例句和语境记忆，效率真的高很多！', likes: 67, comments: 34, time: '2天前' },
        { id: 5, author: '陈美', avatar: 'C', level: '日语N5', content: '五十音图背了两周终于记住了，给大家分享一下我的记忆口诀～', likes: 89, comments: 42, time: '3天前' },
        { id: 6, author: '赵敏', avatar: 'Z', level: '韩语中级', content: 'TOPIK考试经验分享：备考3个月，从零基础到中级的学习计划', likes: 56, comments: 28, time: '5天前' }
    ],

    achievements: [
        { icon: '🏆', name: '学习达人', desc: '累计学习时长达到100小时' },
        { icon: '🔥', name: '连续打卡', desc: '连续学习7天不中断' },
        { icon: '📚', name: '单词大师', desc: '掌握1000个单词' },
        { icon: '🎯', name: '目标达成', desc: '完成10个学习目标' },
        { icon: '🌟', name: '优秀学员', desc: '课程考试满分通过' },
        { icon: '💬', name: '社区活跃', desc: '社区发帖获得100个赞' },
        { icon: '🎧', name: '听力高手', desc: '完成100篇听力练习' },
        { icon: '🎤', name: '口语达人', desc: '口语练习评分平均90分以上' }
    ]
};

const Storage = {
    getUser() {
        return JSON.parse(localStorage.getItem('lingua_user') || 'null');
    },

    setUser(user) {
        localStorage.setItem('lingua_user', JSON.stringify(user));
    },

    clearUser() {
        localStorage.removeItem('lingua_user');
    },

    getProgress() {
        return JSON.parse(localStorage.getItem('lingua_progress') || '{}');
    },

    setProgress(progress) {
        localStorage.setItem('lingua_progress', JSON.stringify(progress));
    },

    getSelectedLanguage() {
        return localStorage.getItem('lingua_language') || 'en';
    },

    setSelectedLanguage(lang) {
        localStorage.setItem('lingua_language', lang);
    },

    getStreak() {
        const streak = JSON.parse(localStorage.getItem('lingua_streak') || '{"days":0,"lastDate":null}');
        const today = new Date().toDateString();
        
        if (streak.lastDate !== today) {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            if (streak.lastDate === yesterday.toDateString()) {
                streak.days += 1;
            } else if (streak.lastDate !== today) {
                streak.days = 1;
            }
            streak.lastDate = today;
            localStorage.setItem('lingua_streak', JSON.stringify(streak));
        }
        return streak.days;
    },

    addStudyTime(minutes) {
        const progress = this.getProgress();
        if (!progress.totalMinutes) progress.totalMinutes = 0;
        progress.totalMinutes += minutes;
        this.setProgress(progress);
    },

    getLearnedWords(lang) {
        const progress = this.getProgress();
        return progress[`words_${lang}`] || [];
    },

    addLearnedWord(lang, word) {
        const progress = this.getProgress();
        const key = `words_${lang}`;
        if (!progress[key]) progress[key] = [];
        if (!progress[key].includes(word)) {
            progress[key].push(word);
        }
        this.setProgress(progress);
    },

    getCompletedLessons(lang) {
        const progress = this.getProgress();
        return progress[`lessons_${lang}`] || [];
    },

    completeLesson(lang, lessonId) {
        const progress = this.getProgress();
        const key = `lessons_${lang}`;
        if (!progress[key]) progress[key] = [];
        if (!progress[key].includes(lessonId)) {
            progress[key].push(lessonId);
        }
        this.setProgress(progress);
    },

    getAchievements() {
        const progress = this.getProgress();
        return progress.achievements || [];
    },

    unlockAchievement(achievementName) {
        const progress = this.getProgress();
        if (!progress.achievements) progress.achievements = [];
        if (!progress.achievements.includes(achievementName)) {
            progress.achievements.push(achievementName);
            this.setProgress(progress);
            return true;
        }
        return false;
    }
};

const Utils = {
    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        const bgColor = type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : '#333';
        toast.style.cssText = `
            position: fixed;
            top: 100px;
            left: 50%;
            transform: translateX(-50%);
            background: ${bgColor};
            color: white;
            padding: 15px 30px;
            border-radius: 25px;
            z-index: 2000;
            animation: fadeInOut 2s ease;
            font-size: 14px;
        `;
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.remove();
        }, 2000);
    },

    formatTime(minutes) {
        if (minutes < 60) return `${minutes}分钟`;
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return mins > 0 ? `${hours}小时${mins}分钟` : `${hours}小时`;
    },

    shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }
};

const toastStyle = document.createElement('style');
toastStyle.textContent = `
    @keyframes fadeInOut {
        0% { opacity: 0; transform: translateX(-50%) translateY(-20px); }
        10% { opacity: 1; transform: translateX(-50%) translateY(0); }
        90% { opacity: 1; transform: translateX(-50%) translateY(0); }
        100% { opacity: 0; transform: translateX(-50%) translateY(-20px); }
    }
`;
document.head.appendChild(toastStyle);

function toggleUserMenu(event) {
    event.stopPropagation();
    const avatar = document.getElementById('userAvatar');
    if (avatar) {
        avatar.classList.toggle('active');
    }
}

function closeUserMenu() {
    const avatar = document.getElementById('userAvatar');
    if (avatar) {
        avatar.classList.remove('active');
    }
}

document.addEventListener('click', function(e) {
    const avatar = document.getElementById('userAvatar');
    if (avatar && !avatar.contains(e.target)) {
        avatar.classList.remove('active');
    }
});
