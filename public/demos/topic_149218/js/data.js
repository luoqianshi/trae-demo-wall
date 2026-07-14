/* ========================================================
   语析 EnglishLab — Web DEMO 数据层
   负责模拟数据、应用状态与本地存储
   ======================================================== */

// 语法成分角色映射
const ROLE_MAP = {
    subject: { label: '主语', colorClass: 'role-subject', explain: '句子所描述的主体' },
    predicate: { label: '谓语', colorClass: 'role-predicate', explain: '说明主语的动作或状态' },
    object: { label: '宾语', colorClass: 'role-object', explain: '动作的承受者' },
    attributive: { label: '定语', colorClass: 'role-attributive', explain: '修饰名词或代词' },
    adverbial: { label: '状语', colorClass: 'role-adverbial', explain: '修饰动词、形容词或整个句子' },
    complement: { label: '补语', colorClass: 'role-complement', explain: '补充说明主语或宾语' }
};

// 内置词典数据
const DICTIONARY = {
    'sleep': { phonetic: '/sliːp/', meaning: 'n. 睡眠；vi. 睡觉', root: 'slep-（睡眠）' },
    'essential': { phonetic: '/ɪˈsenʃl/', meaning: 'adj. 必不可少的，极其重要的', root: 'ess-（存在，本质）+-ential' },
    'human': { phonetic: '/ˈhjuːmən/', meaning: 'n. 人类；adj. 人的，人类的', root: 'hum-（土，人）' },
    'health': { phonetic: '/helθ/', meaning: 'n. 健康；卫生', root: 'heal-（治愈）+-th' },
    'well-being': { phonetic: '/ˌwel ˈbiːɪŋ/', meaning: 'n. 幸福；健康；安乐', root: 'well（好）+ being（存在）' },
    'brain': { phonetic: '/breɪn/', meaning: 'n. 大脑；智力', root: 'brai-（膨胀，头）' },
    'consolidate': { phonetic: '/kənˈsɒlɪdeɪt/', meaning: 'v. 巩固；合并', root: 'con-（共同）+ solid（坚固）+-ate' },
    'memory': { phonetic: '/ˈmeməri/', meaning: 'n. 记忆；回忆', root: 'memor-（记忆）+-y' },
    'deprivation': { phonetic: '/ˌdeprɪˈveɪʃn/', meaning: 'n. 剥夺；缺失', root: 'de-（去掉）+ priv（私人）+-ation' },
    'impair': { phonetic: '/ɪmˈpeə(r)/', meaning: 'v. 损害；削弱', root: 'im-（进入）+ pair（更坏）' },
    'cognitive': { phonetic: '/ˈkɒɡnɪtɪv/', meaning: 'adj. 认知的', root: 'cogn-（知道）+-itive' },
    'function': { phonetic: '/ˈfʌŋkʃn/', meaning: 'n. 功能；职能', root: 'funct-（执行）+-ion' },
    'quick': { phonetic: '/kwɪk/', meaning: 'adj. 快的；迅速的', root: 'quick-（活的，敏捷的）' },
    'brown': { phonetic: '/braʊn/', meaning: 'adj. 棕色的', root: 'brun-（棕色）' },
    'fox': { phonetic: '/fɒks/', meaning: 'n. 狐狸', root: 'fox-（狐狸）' },
    'jumps': { phonetic: '/dʒʌmps/', meaning: 'v. 跳跃（第三人称单数）', root: 'jump-（跳）' },
    'lazy': { phonetic: '/ˈleɪzi/', meaning: 'adj. 懒惰的', root: 'laz-（懒散）+-y' },
    'dog': { phonetic: '/dɒɡ/', meaning: 'n. 狗', root: 'dog-（狗）' },
    'the': { phonetic: '/ðə; ðiː/', meaning: 'art. 定冠词', root: '-' },
    'over': { phonetic: '/ˈəʊvə(r)/', meaning: 'prep. 越过；在…之上', root: 'over-（在上，越过）' }
};

// 默认内置材料
const DEFAULT_MATERIALS = [
    {
        id: 'm1',
        title: 'The Science of Sleep',
        difficulty: 'B2',
        sentences: [
            { text: 'Sleep is essential for human health and well-being.', status: 'done', analysis: [
                { word: 'Sleep', role: 'subject', explain: '名词，句子主语' },
                { word: 'is', role: 'predicate', explain: '系动词' },
                { word: 'essential', role: 'complement', explain: '形容词，主语补足语' },
                { word: 'for', role: 'adverbial', explain: '介词，表示对象' },
                { word: 'human', role: 'attributive', explain: '形容词，修饰 health' },
                { word: 'health', role: 'object', explain: '介词 for 的宾语' },
                { word: 'and', role: 'attributive', explain: '连词，连接 health 与 well-being' },
                { word: 'well-being', role: 'object', explain: '介词 for 的宾语' }
            ]},
            { text: 'During sleep, the brain consolidates memories.', status: 'done', analysis: [
                { word: 'During', role: 'adverbial', explain: '介词，表示时间' },
                { word: 'sleep', role: 'object', explain: '介词 During 的宾语' },
                { word: 'the', role: 'attributive', explain: '定冠词' },
                { word: 'brain', role: 'subject', explain: '名词，句子主语' },
                { word: 'consolidates', role: 'predicate', explain: '动词，谓语' },
                { word: 'memories', role: 'object', explain: '名词，宾语' }
            ]},
            { text: 'Sleep deprivation can impair cognitive function.', status: 'current', analysis: [
                { word: 'Sleep', role: 'attributive', explain: '名词作定语，修饰 deprivation' },
                { word: 'deprivation', role: 'subject', explain: '名词，句子主语' },
                { word: 'can', role: 'predicate', explain: '情态动词' },
                { word: 'impair', role: 'predicate', explain: '动词，谓语' },
                { word: 'cognitive', role: 'attributive', explain: '形容词，修饰 function' },
                { word: 'function', role: 'object', explain: '名词，宾语' }
            ]},
            { text: 'A healthy sleep schedule improves focus and mood.', status: 'pending', analysis: [
                { word: 'A', role: 'attributive', explain: '不定冠词' },
                { word: 'healthy', role: 'attributive', explain: '形容词，修饰 schedule' },
                { word: 'sleep', role: 'attributive', explain: '名词作定语' },
                { word: 'schedule', role: 'subject', explain: '名词，主语' },
                { word: 'improves', role: 'predicate', explain: '动词，谓语' },
                { word: 'focus', role: 'object', explain: '名词，宾语' },
                { word: 'and', role: 'attributive', explain: '连词' },
                { word: 'mood', role: 'object', explain: '名词，宾语' }
            ]}
        ]
    },
    {
        id: 'm2',
        title: 'Quick Brown Fox',
        difficulty: 'A1',
        sentences: [
            { text: 'The quick brown fox jumps over the lazy dog.', status: 'current', analysis: [
                { word: 'The', role: 'attributive', explain: '定冠词' },
                { word: 'quick', role: 'attributive', explain: '形容词，修饰 fox' },
                { word: 'brown', role: 'attributive', explain: '形容词，修饰 fox' },
                { word: 'fox', role: 'subject', explain: '名词，句子主语' },
                { word: 'jumps', role: 'predicate', explain: '动词，谓语' },
                { word: 'over', role: 'adverbial', explain: '介词，表示越过' },
                { word: 'the', role: 'attributive', explain: '定冠词' },
                { word: 'lazy', role: 'attributive', explain: '形容词，修饰 dog' },
                { word: 'dog', role: 'object', explain: '介词 over 的宾语' }
            ]}
        ]
    }
];

// 应用状态
const AppState = {
    materials: [],
    vocabulary: [],
    settings: {
        aiEnabled: false,
        ttsEnabled: true,
        accent: 'en-US',
        dailyGoal: 10
    },
    stats: {
        analyzedSentences: 0,
        learnedWords: 0,
        quizCompleted: 0,
        studyMinutes: 0
    }
};

/*
 * 初始化应用状态：从 localStorage 读取或加载默认数据
 */
function initState() {
    try {
        const saved = localStorage.getItem('englishlab_demo_state');
        if (saved) {
            const parsed = JSON.parse(saved);
            // 直接赋值，避免 Object.assign 对数组按索引合并导致数据异常
            AppState.materials = Array.isArray(parsed.materials) ? parsed.materials : JSON.parse(JSON.stringify(DEFAULT_MATERIALS));
            AppState.vocabulary = Array.isArray(parsed.vocabulary) ? parsed.vocabulary : [];
            AppState.settings = Object.assign({}, AppState.settings, parsed.settings || {});
            AppState.stats = Object.assign({}, AppState.stats, parsed.stats || {});
        } else {
            AppState.materials = JSON.parse(JSON.stringify(DEFAULT_MATERIALS));
        }
    } catch (e) {
        console.warn('读取本地存储失败，使用默认数据', e);
        AppState.materials = JSON.parse(JSON.stringify(DEFAULT_MATERIALS));
        AppState.vocabulary = [];
    }
    ensureVocabularyFromMaterials();
    saveState();
}

/*
 * 持久化状态到 localStorage
 */
function saveState() {
    try {
        localStorage.setItem('englishlab_demo_state', JSON.stringify({
            materials: AppState.materials,
            vocabulary: AppState.vocabulary,
            settings: AppState.settings,
            stats: AppState.stats
        }));
    } catch (e) {
        console.warn('保存本地存储失败', e);
    }
}

/*
 * 根据材料中的生词自动补全单词本
 */
function ensureVocabularyFromMaterials() {
    AppState.materials.forEach(material => {
        material.sentences.forEach((sentence, sIndex) => {
            const words = extractWords(sentence.text);
            words.forEach(word => {
                const lower = word.toLowerCase();
                if (DICTIONARY[lower] && !AppState.vocabulary.find(v => v.word === lower)) {
                    AppState.vocabulary.push({
                        word: lower,
                        phonetic: DICTIONARY[lower].phonetic,
                        meaning: DICTIONARY[lower].meaning,
                        sourceMaterialId: material.id,
                        sourceSentenceIndex: sIndex,
                        context: sentence.text,
                        proficiency: 'new',
                        addedAt: new Date().toISOString()
                    });
                }
            });
        });
    });
    AppState.stats.learnedWords = AppState.vocabulary.length;
}

/*
 * 从句子中提取单词（去除标点后按空格分割）
 */
function extractWords(text) {
    return text.replace(/[.,;:!?()]/g, '').split(/\s+/).filter(w => w.length > 0);
}

/*
 * 查找单词释义
 */
function lookupWord(word) {
    const lower = word.toLowerCase().replace(/[^a-z0-9'-]/g, '');
    return DICTIONARY[lower] || { phonetic: '', meaning: '（DEMO 词库暂无释义）', root: '' };
}

/*
 * 添加新材料
 */
function addMaterial(title, text) {
    const rawSentences = text.split(/(?<=[.!?])\s+/).filter(s => s.trim().length > 0);
    const sentences = rawSentences.map((s, index) => ({
        text: s.trim(),
        status: index === 0 ? 'current' : 'pending',
        analysis: [] // DEMO 中可在语法分析页生成
    }));
    const material = {
        id: 'm' + Date.now(),
        title: title || '未命名材料',
        difficulty: estimateDifficulty(text),
        sentences: sentences
    };
    AppState.materials.unshift(material);
    ensureVocabularyFromMaterials();
    saveState();
    return material;
}

/*
 * 简单难度评估规则
 */
function estimateDifficulty(text) {
    const words = extractWords(text);
    const avgLen = words.reduce((sum, w) => sum + w.length, 0) / Math.max(words.length, 1);
    const longWords = words.filter(w => w.length > 6).length;
    if (avgLen > 6 || longWords > words.length * 0.3) return 'C1';
    if (avgLen > 5 || longWords > words.length * 0.2) return 'B2';
    if (avgLen > 4.5) return 'B1';
    if (avgLen > 4) return 'A2';
    return 'A1';
}

/*
 * 标记句子为已完成，并推进下一句
 */
function markSentenceDone(materialId, sentenceIndex) {
    const material = AppState.materials.find(m => m.id === materialId);
    if (!material) return;
    material.sentences[sentenceIndex].status = 'done';
    if (sentenceIndex + 1 < material.sentences.length && material.sentences[sentenceIndex + 1].status === 'pending') {
        material.sentences[sentenceIndex + 1].status = 'current';
    }
    AppState.stats.analyzedSentences += 1;
    saveState();
}

/*
 * 切换单词熟练度
 */
function setProficiency(word, proficiency) {
    const item = AppState.vocabulary.find(v => v.word === word);
    if (item) {
        item.proficiency = proficiency;
        saveState();
    }
}

/*
 * 更新设置项
 */
function updateSetting(key, value) {
    AppState.settings[key] = value;
    saveState();
}

/*
 * 生成背诵题目
 */
function generateQuiz(materialId) {
    const material = AppState.materials.find(m => m.id === materialId);
    if (!material) return [];
    const quizzes = [];
    material.sentences.forEach((sentence, idx) => {
        const words = extractWords(sentence.text);
        if (words.length < 3) return;

        // 填空题：隐藏一个名词或长词，仅替换目标位置的单词
        const targetIndex = Math.floor(words.length / 2);
        const target = words[targetIndex];
        const fillQuestion = replaceWordAt(sentence.text, target);
        quizzes.push({
            type: 'fill',
            sentenceIndex: idx,
            sentence: sentence.text,
            question: fillQuestion,
            answer: target,
            userAnswer: ''
        });

        // 选择题：选择正确词义
        const correct = lookupWord(words[0]);
        quizzes.push({
            type: 'choice',
            sentenceIndex: idx,
            word: words[0],
            question: `“${words[0]}” 在此句中的意思是？`,
            options: shuffle([correct.meaning, 'n. 苹果', 'adj. 红色的', 'v. 跑']),
            answer: correct.meaning
        });

        // 排序题：打乱前 4 个单词
        if (words.length >= 4) {
            const slice = words.slice(0, 4);
            quizzes.push({
                type: 'sort',
                sentenceIndex: idx,
                question: '将下列单词排成正确顺序：',
                words: shuffle(slice),
                answer: slice.join(' ')
            });
        }
    });
    return shuffle(quizzes);
}

/*
 * 将句子中第一次出现的指定单词替换为占位符，避免 replace 被当作正则解析
 */
function replaceWordAt(text, word) {
    const idx = text.indexOf(word);
    if (idx === -1) return text;
    return text.slice(0, idx) + '______' + text.slice(idx + word.length);
}

/*
 * 数组随机打乱（Fisher-Yates）
 */
function shuffle(array) {
    const arr = array.slice();
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

// 初始化
initState();
