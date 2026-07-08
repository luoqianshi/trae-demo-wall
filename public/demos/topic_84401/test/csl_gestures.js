/**
 * 中国手语识别系统
 * 基于MediaPipe Hands + TensorFlow.js
 * 
 * 包含常用中国手语词汇（参考《中国手语常用词表》）
 */

const CSL_Gestures = [
    // ===== 基础词汇（50个最常用）=====
    { id: 1, word: '你', pinyin: 'nǐ', category: '基础', description: '食指向外指' },
    { id: 2, word: '我', pinyin: 'wǒ', category: '基础', description: '食指向自己' },
    { id: 3, word: '他', pinyin: 'tā', category: '基础', description: '食指向一侧' },
    { id: 4, word: '好', pinyin: 'hǎo', category: '基础', description: '食指中指并拢，向外旋转' },
    { id: 5, word: '是', pinyin: 'shì', category: '基础', description: '食指横放，指向下方' },
    { id: 6, word: '不', pinyin: 'bù', category: '基础', description: '食指中指交叉' },
    { id: 7, word: '谢谢', pinyin: 'xièxiè', category: '基础', description: '双手拇指交叉，前后移动' },
    { id: 8, word: '对不起', pinyin: 'duìbuqǐ', category: '基础', description: '右手食指顶在左掌心，弯曲' },
    { id: 9, word: '没关系', pinyin: 'méiguānxi', category: '基础', description: '双手握拳，伸出食指，相触后分开' },
    { id: 10, word: '请', pinyin: 'qǐng', category: '基础', description: '五指伸直，向外推出' },
    { id: 11, word: '再见', pinyin: 'zàijiàn', category: '基础', description: '食指向上，向外挥动' },
    { id: 12, word: '帮助', pinyin: 'bāngzhù', category: '基础', description: '双手掌心向上，向上托起' },
    { id: 13, word: '朋友', pinyin: 'péngyou', category: '基础', description: '食指中指夹住对方食指' },
    { id: 14, word: '家', pinyin: 'jiā', category: '基础', description: '双手搭成∧形' },
    { id: 15, word: '爱', pinyin: 'ài', category: '基础', description: '双手交叉贴在胸口' },
    { id: 16, word: '喜欢', pinyin: 'xǐhuan', category: '基础', description: '拇指食指弯曲，在胸前点两下' },
    { id: 17, word: '学习', pinyin: 'xuéxí', category: '基础', description: '双手掌心向上，交替翻动' },
    { id: 18, word: '工作', pinyin: 'gōngzuò', category: '基础', description: '双手握拳，上下交替移动' },
    { id: 19, word: '老师', pinyin: 'lǎoshī', category: '基础', description: '双手掌心向外，指尖轻点额头' },
    { id: 20, word: '学生', pinyin: 'xuéshēng', category: '基础', description: '书本手势' },
    
    // ===== 数字（10个）=====
    { id: 21, word: '一', pinyin: 'yī', category: '数字', description: '食指伸直' },
    { id: 22, word: '二', pinyin: 'èr', category: '数字', description: '食指中指并拢伸直' },
    { id: 23, word: '三', pinyin: 'sān', category: '数字', description: '食、中、无名三指伸直' },
    { id: 24, word: '四', pinyin: 'sì', category: '数字', description: '四指伸直' },
    { id: 25, word: '五', pinyin: 'wǔ', category: '数字', description: '五指伸直' },
    { id: 26, word: '六', pinyin: 'liù', category: '数字', description: '拇指小指伸出' },
    { id: 27, word: '七', pinyin: 'qī', category: '数字', description: '拇指食指张开成L形' },
    { id: 28, word: '八', pinyin: 'bā', category: '数字', description: '拇指食指分开成八字' },
    { id: 29, word: '九', pinyin: 'jiǔ', category: '数字', description: '食指弯曲成钩' },
    { id: 30, word: '十', pinyin: 'shí', category: '数字', description: '食指弯曲抵住掌心' },
    
    // ===== 时间相关（15个）=====
    { id: 31, word: '今天', pinyin: 'jīntiān', category: '时间', description: '今+天组合' },
    { id: 32, word: '昨天', pinyin: 'zuótiān', category: '时间', description: '昨天手势' },
    { id: 33, word: '明天', pinyin: 'míngtiān', category: '时间', description: '明天手势' },
    { id: 34, word: '现在', pinyin: 'xiànzài', category: '时间', description: '食指指向手腕' },
    { id: 35, word: '早上', pinyin: 'zǎoshang', category: '时间', description: '双手在眼前比划太阳升起' },
    { id: 36, word: '中午', pinyin: 'zhōngwǔ', category: '时间', description: '太阳在头顶' },
    { id: 37, word: '晚上', pinyin: 'wǎnshang', category: '时间', description: '双手比划月亮升起' },
    { id: 38, word: '几点', pinyin: 'jǐdiǎn', category: '时间', description: '食指向下手腕转动' },
    { id: 39, word: '星期', pinyin: 'xīngqī', category: '时间', description: '双手交叉转动' },
    { id: 40, word: '月', pinyin: 'yuè', category: '时间', description: '手刀形沿另一手臂滑动' },
    { id: 41, word: '年', pinyin: 'nián', category: '时间', description: '拳头在另一手掌上转圈' },
    { id: 42, word: '时间', pinyin: 'shíjiān', category: '时间', description: '手腕转动手表位置' },
    { id: 43, word: '小时', pinyin: 'xiǎoshí', category: '时间', description: '食指指向手腕' },
    { id: 44, word: '分钟', pinyin: 'fēnzhōng', category: '时间', description: '食指点腕' },
    { id: 45, word: '以后', pinyin: 'yǐhòu', category: '时间', description: '手掌从后向前推出' },
    
    // ===== 日常用品（20个）=====
    { id: 46, word: '手机', pinyin: 'shǒujī', category: '物品', description: '拇指贴在耳边做打电话状' },
    { id: 47, word: '电脑', pinyin: 'diànnǎo', category: '物品', description: '食指在另一手掌上敲击' },
    { id: 48, word: '电视', pinyin: 'diànshì', category: '物品', description: '双手比划方框' },
    { id: 49, word: '书', pinyin: 'shū', category: '物品', description: '双手合拢，打开' },
    { id: 50, word: '笔', pinyin: 'bǐ', category: '物品', description: '食指与中指夹住做写字状' },
    { id: 51, word: '水', pinyin: 'shuǐ', category: '物品', description: '拇指小指伸出，倾斜如水滴' },
    { id: 52, word: '衣服', pinyin: 'yīfu', category: '物品', description: '双手比划衣服形状' },
    { id: 53, word: '鞋', pinyin: 'xié', category: '物品', description: '双手比划鞋子' },
    { id: 54, word: '包', pinyin: 'bāo', category: '物品', description: '单手握住，做提包状' },
    { id: 55, word: '钥匙', pinyin: 'yàoshi', category: '物品', description: '食指拇指转动如拧钥匙' },
    { id: 56, word: '钱', pinyin: 'qián', category: '物品', description: '拇指搓动食指' },
    { id: 57, word: '杯子', pinyin: 'bēizi', category: '物品', description: '双手成C形' },
    { id: 58, word: '饭', pinyin: 'fàn', category: '物品', description: '拇指食指捏住，做吃饭状' },
    { id: 59, word: '菜', pinyin: 'cài', category: '物品', description: '筷子夹菜动作' },
    { id: 60, word: '医院', pinyin: 'yīyuàn', category: '场所', description: '手腕内侧交叉点两下' },
    { id: 61, word: '学校', pinyin: 'xuéxiào', category: '场所', description: '书本+房子组合' },
    { id: 62, word: '超市', pinyin: 'chāoshì', category: '场所', description: '手指点另一手臂' },
    { id: 63, word: '银行', pinyin: 'yínháng', category: '场所', description: '食指横划如金字' },
    { id: 64, word: '公园', pinyin: 'gōngyuán', category: '场所', description: '双手搭成A形' },
    { id: 65, word: '餐厅', pinyin: 'cāntīng', category: '场所', description: '碗+房子组合' },
    
    // ===== 动作动词（25个）=====
    { id: 66, word: '吃', pinyin: 'chī', category: '动作', description: '食指中指弯曲，做吃东西状' },
    { id: 67, word: '喝', pinyin: 'hē', category: '动作', description: '拇指食指成C形，放嘴边' },
    { id: 68, word: '走', pinyin: 'zǒu', category: '动作', description: '食指中指交替向前' },
    { id: 69, word: '跑', pinyin: 'pǎo', category: '动作', description: '握拳，前后快速摆动' },
    { id: 70, word: '坐', pinyin: 'zuò', category: '动作', description: '手掌下压' },
    { id: 71, word: '站', pinyin: 'zhàn', category: '动作', description: '食指中指并拢伸直，指地' },
    { id: 72, word: '看', pinyin: 'kàn', category: '动作', description: '手背贴眉部，向前伸出' },
    { id: 73, word: '听', pinyin: 'tīng', category: '动作', description: '手背贴耳部' },
    { id: 74, word: '说', pinyin: 'shuō', category: '动作', description: '食指在嘴边动一下' },
    { id: 75, word: '写', pinyin: 'xiě', category: '动作', description: '食指做写字状' },
    { id: 76, word: '读', pinyin: 'dú', category: '动作', description: '双手打开，如翻书' },
    { id: 77, word: '睡觉', pinyin: 'shuìjiào', category: '动作', description: '手掌贴在脸颊，头歪向一侧' },
    { id: 78, word: '起床', pinyin: 'qǐchuáng', category: '动作', description: '手掌从枕头上抬起' },
    { id: 79, word: '洗澡', pinyin: 'xǐzǎo', category: '动作', description: '双手在身上搓洗' },
    { id: 80, word: '打电话', pinyin: 'dǎdiànhuà', category: '动作', description: '拇指小指伸出，做打电话状' },
    { id: 81, word: '开车', pinyin: 'kāichē', category: '动作', description: '双手握拳，转动如握方向盘' },
    { id: 82, word: '买', pinyin: 'mǎi', category: '动作', description: '拇指点击另一手掌' },
    { id: 83, word: '卖', pinyin: 'mài', category: '动作', description: '手刀形上下切' },
    { id: 84, word: '给', pinyin: 'gěi', category: '动作', description: '掌心向上，向外推' },
    { id: 85, word: '拿', pinyin: 'ná', category: '动作', description: '五指张开，向内抓' },
    { id: 86, word: '找', pinyin: 'zhǎo', category: '动作', description: '食指在眼前转动' },
    { id: 87, word: '来', pinyin: 'lái', category: '动作', description: '手掌向下，向身体方向招' },
    { id: 88, word: '去', pinyin: 'qù', category: '动作', description: '食指指向外' },
    { id: 89, word: '回来', pinyin: 'huílái', category: '动作', description: '食指指向外，再指向自己' },
    { id: 90, word: '打开', pinyin: 'dǎkāi', category: '动作', description: '掌心相对，向两边打开' },
    
    // ===== 形容词（15个）=====
    { id: 91, word: '大', pinyin: 'dà', category: '形容词', description: '双手向外扩大' },
    { id: 92, word: '小', pinyin: 'xiǎo', category: '形容词', description: '双手向内缩小' },
    { id: 93, word: '长', pinyin: 'cháng', category: '形容词', description: '双手向外拉长' },
    { id: 94, word: '短', pinyin: 'duǎn', category: '形容词', description: '双手距离缩短' },
    { id: 95, word: '高', pinyin: 'gāo', category: '形容词', description: '手掌向上升高' },
    { id: 96, word: '低', pinyin: 'dī', category: '形容词', description: '手掌向下降低' },
    { id: 97, word: '快', pinyin: 'kuài', category: '形容词', description: '食指向外快速划' },
    { id: 98, word: '慢', pinyin: 'màn', category: '形容词', description: '食指向外缓慢划' },
    { id: 99, word: '新', pinyin: 'xīn', category: '形容词', description: '拳头在胸前敲一下' },
    { id: 100, word: '旧', pinyin: 'jiù', category: '形容词', description: '手背在脸上蹭' },
    { id: 101, word: '好', pinyin: 'hǎo', category: '形容词', description: '拇指竖起，左右摇摆' },
    { id: 102, word: '坏', pinyin: 'huài', category: '形容词', description: '拇指横放，向下砍' },
    { id: 103, word: '多', pinyin: 'duō', category: '形容词', description: '五指张开，向外扩大' },
    { id: 104, word: '少', pinyin: 'shǎo', category: '形容词', description: '五指捏合' },
    { id: 105, word: '漂亮', pinyin: 'piàoliang', category: '形容词', description: '拇指食指捏住下巴，向外撇' },
    
    // ===== 疑问词（10个）=====
    { id: 106, word: '什么', pinyin: 'shénme', category: '疑问', description: '食指中指弯曲，在胸前转动' },
    { id: 107, word: '谁', pinyin: 'shuí', category: '疑问', description: '小指点向人' },
    { id: 108, word: '哪', pinyin: 'nǎ', category: '疑问', description: '小指指向一侧' },
    { id: 109, word: '哪里', pinyin: 'nǎlǐ', category: '疑问', description: '小指在一侧画圈' },
    { id: 110, word: '怎么', pinyin: 'zěnme', category: '疑问', description: '食指点在掌心，转动' },
    { id: 111, word: '为什么', pinyin: 'wèishénme', category: '疑问', description: '食指点太阳穴，转动' },
    { id: 112, word: '多少', pinyin: 'duōshǎo', category: '疑问', description: '五指捏合，再张开' },
    { id: 113, word: '几个', pinyin: 'jǐgè', category: '疑问', description: '食指向下手腕转动' },
    { id: 114, word: '可以吗', pinyin: 'kěyǐma', category: '疑问', description: 'OK手势，向上抬一下' },
    { id: 115, word: '是不是', pinyin: 'shìbúshì', category: '疑问', description: '食指横放，点头动作' },
    
    // ===== 情绪表达（10个）=====
    { id: 116, word: '高兴', pinyin: 'gāoxìng', category: '情绪', description: '双手在胸前上下扇动' },
    { id: 117, word: '难过', pinyin: 'nánguò', category: '情绪', description: '拳头在胸前向下移动' },
    { id: 118, word: '生气', pinyin: 'shēngqì', category: '情绪', description: '握拳，上下颤抖' },
    { id: 119, word: '害怕', pinyin: 'hàipà', category: '情绪', description: '握拳，手臂发抖' },
    { id: 120, word: '累', pinyin: 'lèi', category: '情绪', description: '双手垂下晃动' },
    { id: 121, word: '饿', pinyin: 'è', category: '情绪', description: '握拳贴在胃部' },
    { id: 122, word: '渴', pinyin: 'kě', category: '情绪', description: '手指点喉咙' },
    { id: 123, word: '冷', pinyin: 'lěng', category: '情绪', description: '双臂交叉抱胸' },
    { id: 124, word: '热', pinyin: 'rè', category: '情绪', description: '扇风动作' },
    { id: 125, word: '疼', pinyin: 'téng', category: '情绪', description: '在痛处点一下' },
    
    // ===== 人称代词（5个）=====
    { id: 126, word: '我们', pinyin: 'wǒmen', category: '代词', description: '食指向自己，再指向多人' },
    { id: 127, word: '他们', pinyin: 'tāmen', category: '代词', description: '食指向外划，再向多人指' },
    { id: 128, word: '大家', pinyin: 'dàjiā', category: '代词', description: '双手向外扩大' },
    { id: 129, word: '自己', pinyin: 'zìjǐ', category: '代词', description: '食指点自己胸口' },
    { id: 130, word: '别人', pinyin: 'biéren', category: '代词', description: '小指向外指' }
];

// 手势特征提取配置
const GestureConfig = {
    // 关键点索引
    landmarks: {
        wrist: 0,
        thumb: { base: 1, tip: 4 },
        index: { base: 5, mid: 6, tip: 8 },
        middle: { base: 9, mid: 10, tip: 12 },
        ring: { base: 13, mid: 14, tip: 16 },
        pinky: { base: 17, mid: 18, tip: 20 }
    },
    
    // 特征向量维度 - 21个关键点 × 2个坐标 (x, y)
    featureDimension: 42,
    
    // 识别阈值
    confidenceThreshold: 0.7,
    
    // 缓冲区大小
    bufferSize: 12,
    
    // 最小确认次数
    minConfirmCount: 4
};

// 获取所有手势词列表
function getCSLGestureList() {
    return CSL_Gestures.map(g => ({
        id: g.id,
        word: g.word,
        pinyin: g.pinyin,
        category: g.category
    }));
}

// 获取手势总数
function getCSLGestureCount() {
    return CSL_Gestures.length;
}

// 获取某个手势的详细信息
function getCSLGestureInfo(index) {
    return CSL_Gestures[index] || null;
}

// 导出配置
window.CSLGestures = {
    gestures: CSL_Gestures,
    config: GestureConfig,
    getList: getCSLGestureList,
    getCount: getCSLGestureCount,
    getInfo: getCSLGestureInfo
};
