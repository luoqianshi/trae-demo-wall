// 中科大CSL数据集 - 100个中国手语词汇
// 包含词、拼音、类别信息

const CSL_WORDS = [
    // 基础词汇
    { word: "中国", pinyin: "zhōng guó", category: "基础" },
    { word: "北京", pinyin: "běi jīng", category: "基础" },
    { word: "上海", pinyin: "shàng hǎi", category: "基础" },
    { word: "大学", pinyin: "dà xué", category: "基础" },
    { word: "学生", pinyin: "xué shēng", category: "基础" },
    { word: "老师", pinyin: "lǎo shī", category: "基础" },
    { word: "学习", pinyin: "xué xí", category: "基础" },
    { word: "工作", pinyin: "gōng zuò", category: "基础" },
    { word: "朋友", pinyin: "péng yǒu", category: "基础" },
    { word: "家", pinyin: "jiā", category: "基础" },
    // 称呼
    { word: "爸爸", pinyin: "bà ba", category: "称呼" },
    { word: "妈妈", pinyin: "mā ma", category: "称呼" },
    { word: "爷爷", pinyin: "yé ye", category: "称呼" },
    { word: "奶奶", pinyin: "nǎi nai", category: "称呼" },
    { word: "哥哥", pinyin: "gē ge", category: "称呼" },
    { word: "姐姐", pinyin: "jiě jie", category: "称呼" },
    { word: "弟弟", pinyin: "dì di", category: "称呼" },
    { word: "妹妹", pinyin: "mèi mei", category: "称呼" },
    { word: "男人", pinyin: "nán rén", category: "称呼" },
    { word: "女人", pinyin: "nǚ rén", category: "称呼" },
    // 代词
    { word: "我", pinyin: "wǒ", category: "代词" },
    { word: "你", pinyin: "nǐ", category: "代词" },
    { word: "他", pinyin: "tā", category: "代词" },
    { word: "她", pinyin: "tā", category: "代词" },
    { word: "我们", pinyin: "wǒ men", category: "代词" },
    { word: "你们", pinyin: "nǐ men", category: "代词" },
    { word: "他们", pinyin: "tā men", category: "代词" },
    { word: "大家", pinyin: "dà jiā", category: "代词" },
    { word: "自己", pinyin: "zì jǐ", category: "代词" },
    { word: "别人", pinyin: "bié ren", category: "代词" },
    // 日常用语
    { word: "谢谢", pinyin: "xiè xie", category: "日常" },
    { word: "对不起", pinyin: "duì bu qǐ", category: "日常" },
    { word: "没关系", pinyin: "méi guān xi", category: "日常" },
    { word: "请", pinyin: "qǐng", category: "日常" },
    { word: "是", pinyin: "shì", category: "日常" },
    { word: "不", pinyin: "bù", category: "日常" },
    { word: "好", pinyin: "hǎo", category: "日常" },
    { word: "可以", pinyin: "kě yǐ", category: "日常" },
    { word: "帮忙", pinyin: "bāng máng", category: "日常" },
    { word: "帮助", pinyin: "bāng zhù", category: "日常" },
    // 情感
    { word: "爱", pinyin: "ài", category: "情感" },
    { word: "喜欢", pinyin: "xǐ huan", category: "情感" },
    { word: "高兴", pinyin: "gāo xìng", category: "情感" },
    { word: "难过", pinyin: "nán guò", category: "情感" },
    { word: "生气", pinyin: "shēng qì", category: "情感" },
    { word: "害怕", pinyin: "hài pà", category: "情感" },
    { word: "累", pinyin: "lèi", category: "情感" },
    { word: "饿", pinyin: "è", category: "情感" },
    { word: "渴", pinyin: "kě", category: "情感" },
    { word: "疼", pinyin: "téng", category: "情感" },
    // 数字
    { word: "一", pinyin: "yī", category: "数字" },
    { word: "二", pinyin: "èr", category: "数字" },
    { word: "三", pinyin: "sān", category: "数字" },
    { word: "四", pinyin: "sì", category: "数字" },
    { word: "五", pinyin: "wǔ", category: "数字" },
    { word: "六", pinyin: "liù", category: "数字" },
    { word: "七", pinyin: "qī", category: "数字" },
    { word: "八", pinyin: "bā", category: "数字" },
    { word: "九", pinyin: "jiǔ", category: "数字" },
    { word: "十", pinyin: "shí", category: "数字" },
    // 时间
    { word: "今天", pinyin: "jīn tiān", category: "时间" },
    { word: "昨天", pinyin: "zuó tiān", category: "时间" },
    { word: "明天", pinyin: "míng tiān", category: "时间" },
    { word: "现在", pinyin: "xiàn zài", category: "时间" },
    { word: "早上", pinyin: "zǎo shang", category: "时间" },
    { word: "中午", pinyin: "zhōng wǔ", category: "时间" },
    { word: "晚上", pinyin: "wǎn shang", category: "时间" },
    { word: "几点", pinyin: "jǐ diǎn", category: "时间" },
    { word: "星期", pinyin: "xīng qī", category: "时间" },
    { word: "月", pinyin: "yuè", category: "时间" },
    // 更多时间
    { word: "年", pinyin: "nián", category: "时间" },
    { word: "时间", pinyin: "shí jiān", category: "时间" },
    { word: "以后", pinyin: "yǐ hòu", category: "时间" },
    { word: "以前", pinyin: "yǐ qián", category: "时间" },
    // 动作
    { word: "来", pinyin: "lái", category: "动作" },
    { word: "去", pinyin: "qù", category: "动作" },
    { word: "回来", pinyin: "huí lái", category: "动作" },
    { word: "进来", pinyin: "jìn lái", category: "动作" },
    { word: "出去", pinyin: "chū qù", category: "动作" },
    { word: "起来", pinyin: "qǐ lái", category: "动作" },
    { word: "吃饭", pinyin: "chī fàn", category: "动作" },
    { word: "喝水", pinyin: "hē shuǐ", category: "动作" },
    { word: "睡觉", pinyin: "shuì jiào", category: "动作" },
    { word: "起床", pinyin: "qǐ chuáng", category: "动作" },
    // 更多动作
    { word: "洗澡", pinyin: "xǐ zǎo", category: "动作" },
    { word: "走路", pinyin: "zǒu lù", category: "动作" },
    { word: "跑步", pinyin: "pǎo bù", category: "动作" },
    { word: "开车", pinyin: "kāi chē", category: "动作" },
    { word: "打电话", pinyin: "dǎ diàn huà", category: "动作" },
    { word: "开门", pinyin: "kāi mén", category: "动作" },
    // 物品
    { word: "电脑", pinyin: "diàn nǎo", category: "物品" },
    { word: "手机", pinyin: "shǒu jī", category: "物品" },
    { word: "电视", pinyin: "diàn shì", category: "物品" },
    { word: "书", pinyin: "shū", category: "物品" },
    { word: "笔", pinyin: "bǐ", category: "物品" },
    { word: "水", pinyin: "shuǐ", category: "物品" },
    { word: "衣服", pinyin: "yī fu", category: "物品" },
    { word: "钱", pinyin: "qián", category: "物品" },
    { word: "医院", pinyin: "yī yuàn", category: "物品" },
    { word: "学校", pinyin: "xué xiào", category: "物品" }
];

// 为了模型一致性，刚好100个词
const CSLWordCount = CSL_WORDS.length;

function getCSLWordList() {
    return CSL_WORDS.map((item, idx) => ({
        id: idx,
        word: item.word,
        pinyin: item.pinyin,
        category: item.category
    }));
}

function getCSLWordById(id) {
    if (id < 0 || id >= CSL_WORDS.length) return null;
    return CSL_WORDS[id];
}

function getCSLWordCount() {
    return CSL_WORDS.length;
}

// 按类别分组显示
function getCSLCategories() {
    const categories = {};
    CSL_WORDS.forEach((item, idx) => {
        if (!categories[item.category]) {
            categories[item.category] = [];
        }
        categories[item.category].push({
            id: idx,
            word: item.word,
            pinyin: item.pinyin
        });
    });
    return categories;
}

window.CSLWords = {
    words: CSL_WORDS,
    getList: getCSLWordList,
    getById: getCSLWordById,
    getCount: getCSLWordCount,
    getCategories: getCSLCategories
};
