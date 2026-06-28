// 违规关键词（分级过滤）
const VIOLATION_KEYWORDS = {
    severe: [
        '强奸', '杀人', '自杀', '毒品', '赌博', '恐怖主义', '贩卖人口',
        '种族歧视', '纳粹', '法西斯', '屠杀', '爆炸', '暗杀'
    ],
    moderate: [
        '傻逼', '操你', '草泥马', '去死', '滚蛋', '废物', '畜生', '贱人', '婊子',
        '妈的', '你妈', '你爸', '你全家', '死全家', '诅咒', '咒你',
        '猪狗', '猪头', '狗屎', '狗屁', '放屁', '智障', '脑残', '白痴', '弱智',
        '人渣', '败类', '禽兽', '杂种', '狗娘养的', '乌龟王八蛋'
    ],
    mild: [
        '恶心', '讨厌', '闭嘴', '滚开', '走开', '烦人', '真烦',
        '垃圾', '丑陋', '恶心死了', '恶心人'
    ]
};
// 需要AI介入的上下文特征（非仅关键词）
const INTERVENTION_CONTEXT = {
    distress: ['帮帮我', '救救我', '怎么办', '不知道怎么办', '无助', '绝望', '崩溃', '受不了'],
    request: ['帮我', '能不能帮我', '请帮我', '帮帮忙', '求助', '谁来帮', '你能帮', '小助手'],
    conflict: ['你不对', '你错了', '凭什么', '为什么总是', '你从来都', '你每次都', '你懂什么', '你不懂'],
    mediation: ['评评理', '你说说', '你怎么看', '你觉得呢', '第三方', '旁观者', '调解', '仲裁'],
    confusion: ['我不懂', '我不明白', '什么意思', '不理解', '搞不懂', '怎么处理', '怎么解决'],
    emotional: ['好难过', '想哭', '哭了', '伤心', '心痛', '心碎', '难过死了', '气死我了', '太生气了', '愤怒']
};
// 简易语义分析：检测是否需要AI介入
function detectContextualNeed(content, recentMessages) {
    // 1. 检查明确的求助和情绪关键词
    for (const context of Object.values(INTERVENTION_CONTEXT)) {
        for (const keyword of context) {
            if (content.includes(keyword))
                return true;
        }
    }
    // 2. 上下文分析：检测对话中的冲突模式
    if (recentMessages.length >= 4) {
        const recent4 = recentMessages.slice(-4);
        const userMessages = recent4.filter(m => m.type === 'user');
        // 连续反驳/否定模式
        let negationCount = 0;
        const negationPatterns = ['不', '不是', '不对', '错了', '你', '但', '可是', '然而'];
        for (const msg of userMessages) {
            for (const pattern of negationPatterns) {
                if (msg.content.includes(pattern))
                    negationCount++;
            }
        }
        if (negationCount >= 3)
            return true;
        // 消息越来越短，可能情绪恶化
        const lengths = userMessages.map(m => m.content.length);
        if (lengths.length >= 3 && lengths.every(l => l < 10))
            return true;
    }
    // 3. 连续问号（困惑/质问）
    const questionCount = (content.match(/[?？]/g) || []).length;
    if (questionCount >= 3)
        return true;
    // 4. 连续感叹号（情绪激动）
    const exclaimCount = (content.match(/[!！]/g) || []).length;
    if (exclaimCount >= 4)
        return true;
    return false;
}
// 检测违规内容（分级）
export function detectViolation(content) {
    const lowerContent = content.toLowerCase();
    for (const keyword of VIOLATION_KEYWORDS.severe) {
        if (lowerContent.includes(keyword)) {
            return { hasViolation: true, keyword, level: 'severe' };
        }
    }
    for (const keyword of VIOLATION_KEYWORDS.moderate) {
        if (lowerContent.includes(keyword)) {
            return { hasViolation: true, keyword, level: 'moderate' };
        }
    }
    for (const keyword of VIOLATION_KEYWORDS.mild) {
        if (lowerContent.includes(keyword)) {
            return { hasViolation: true, keyword, level: 'mild' };
        }
    }
    return { hasViolation: false };
}
// 获取违规词列表（供AI参考）
export function getViolationKeywords() {
    return {
        severe: [...VIOLATION_KEYWORDS.severe],
        moderate: [...VIOLATION_KEYWORDS.moderate],
        mild: [...VIOLATION_KEYWORDS.mild]
    };
}
// 检测是否需要AI介入（基于上下文）
export function detectInterventionNeed(content, recentMessages = []) {
    return detectContextualNeed(content, recentMessages);
}
// 简单的情感分析（基于关键词）
export function analyzeSentiment(messages) {
    const positiveWords = ['谢谢', '好的', '不错', '很好', '开心', '喜欢', '棒', '赞', '哈哈', '好棒', '太好了', '真棒', '厉害', '优秀', '感谢', '辛苦', '加油', '支持', '理解', '同意', '没问题', '可以的', '没关系', '不错哦', '挺好', '满意'];
    const negativeWords = ['不好', '糟糕', '失望', '难过', '生气', '愤怒', '讨厌', '烦', '累了', '算了', '随便', '无所谓', '不行', '不对', '别说了', '够了', '烦死了'];
    let positive = 0;
    let negative = 0;
    for (const msg of messages) {
        for (const word of positiveWords) {
            if (msg.content.includes(word))
                positive++;
        }
        for (const word of negativeWords) {
            if (msg.content.includes(word))
                negative++;
        }
    }
    if (positive > negative)
        return 'positive';
    if (negative > positive)
        return 'negative';
    return 'neutral';
}
// AI裁决友善评分
export function evaluateRating(messages, rating, ratingReason) {
    // 分析对话内容
    let violationCount = 0;
    let positiveCount = 0;
    for (const msg of messages) {
        if (detectViolation(msg.content).hasViolation) {
            violationCount++;
        }
        const sentiment = analyzeSentiment([msg]);
        if (sentiment === 'positive')
            positiveCount++;
    }
    // 如果有违规行为，评分需要谨慎
    if (violationCount > 2) {
        // 多次违规，低评分更合理
        if (rating >= 4) {
            return {
                valid: false,
                reason: '检测到对话中存在不当言辞，高分评分可能不符合实际情况'
            };
        }
    }
    // 如果对话整体积极，极低评分需要理由
    if (positiveCount > messages.length * 0.6 && rating <= 2) {
        if (!ratingReason || ratingReason.length < 5) {
            return {
                valid: false,
                reason: '对话整体氛围良好，低分评分需要提供合理理由'
            };
        }
    }
    // 评分在合理范围内
    if (rating >= 1 && rating <= 5) {
        return {
            valid: true,
            reason: '评分有效，已记录'
        };
    }
    return {
        valid: false,
        reason: '评分超出有效范围'
    };
}
