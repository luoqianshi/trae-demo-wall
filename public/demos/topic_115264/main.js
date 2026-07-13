// ===== 心创工坊 - 主应用逻辑 =====
// 整合所有改进功能，使用IndexedDB持久化存储

// ===== 标准测评量表分类配置 =====
const assessmentCategoryMap = {
    sds: { cat: 'mood', icon: '😔', desc: '20题，约5分钟' },
    sas: { cat: 'anxiety', icon: '😰', desc: '20题，约5分钟' },
    sleep: { cat: 'other', icon: '😴', desc: '10题，约3分钟' },
    pss: { cat: 'stress', icon: '💼', desc: '10题，约3分钟' },
    ocs: { cat: 'anxiety', icon: '🧹', desc: '10题，约3分钟' },
    interpersonal: { cat: 'self', icon: '👥', desc: '10题，约3分钟' },
    phobia: { cat: 'anxiety', icon: '🕷️', desc: '10题，约3分钟' },
    paranoia: { cat: 'psychotic', icon: '👁️', desc: '10题，约3分钟' },
    psychotic: { cat: 'psychotic', icon: '🧠', desc: '10题，约3分钟' },
    selfEsteem: { cat: 'self', icon: '💎', desc: '10题，约3分钟' },
    ghq12: { cat: 'mood', icon: '📊', desc: '12题，约4分钟' },
    pcl5: { cat: 'mood', icon: '💔', desc: '18题，约5分钟' },
    lifeEvent: { cat: 'stress', icon: '📅', desc: '12题，约3分钟' },
    copingStyle: { cat: 'stress', icon: '🛡️', desc: '12题，约4分钟' },
    marriage: { cat: 'other', icon: '💒', desc: '12题，约4分钟' },
    crisis: { cat: 'crisis', icon: '⚠️', desc: '5题，约2分钟' }
};

let currentAssessmentCategory = 'all';
let currentAssessmentKeyword = '';

function filterByCategory(cat, btn) {
    currentAssessmentCategory = cat;
    // 更新按钮样式
    document.querySelectorAll('#assessmentCategory button').forEach(b => {
        b.classList.remove('btn-primary');
        b.classList.add('btn-secondary');
    });
    btn.classList.remove('btn-secondary');
    btn.classList.add('btn-primary');
    renderAssessmentCards();
}

function filterAssessments(keyword) {
    currentAssessmentKeyword = keyword.trim().toLowerCase();
    renderAssessmentCards();
}

function renderAssessmentCards() {
    const container = document.getElementById('assessmentCards');
    if (!container) return;

    // 合并标准量表和自定义量表
    const merged = { ...standardAssessments, ...customAssessmentsCache };

    const entries = Object.entries(merged).filter(([key, data]) => {
        const cfg = assessmentCategoryMap[key];
        const catMatch = currentAssessmentCategory === 'all' || (cfg && cfg.cat === currentAssessmentCategory);
        const kwMatch = !currentAssessmentKeyword || data.name.toLowerCase().includes(currentAssessmentKeyword);
        return catMatch && kwMatch;
    });

    const stat = document.getElementById('assessmentsStat');
    if (stat) stat.textContent = `共 ${entries.length} 个量表`;

    if (entries.length === 0) {
        container.innerHTML = '<div class="empty-state" style="grid-column:1/-1"><div class="empty-state-icon">🔍</div><h3>未找到匹配的量表</h3></div>';
        return;
    }

    container.innerHTML = entries.map(([key, data]) => {
        const cfg = assessmentCategoryMap[key] || { icon: '📋', desc: data.questions.length + '题' };
        const sourceColors = {
            'standard': { bg: 'rgba(99,102,241,0.1)', color: 'var(--primary)' },
            'custom': { bg: 'rgba(249,115,22,0.1)', color: 'var(--warm-accent)' }
        };
        const sc = sourceColors[data.source || 'standard'] || sourceColors.standard;
        return `<div class="quick-card" onclick="startAssessment('${key}')">
            <div class="quick-icon">${cfg.icon}</div>
            <div class="quick-title">${data.name}</div>
            <div class="quick-desc">${cfg.desc}</div>
            <div style="margin-top:8px;display:flex;gap:4px;flex-wrap:wrap;justify-content:center">
                ${data.sourceLabel ? `<span style="font-size:11px;padding:2px 8px;background:${sc.bg};color:${sc.color};border-radius:10px">${data.sourceLabel}</span>` : ''}
                ${data.redFlags && data.redFlags.length > 0 ? '<span style="font-size:11px;padding:2px 8px;background:rgba(239,68,68,0.1);color:var(--danger);border-radius:10px">含红旗题项</span>' : ''}
                ${data.dimensions ? '<span style="font-size:11px;padding:2px 8px;background:rgba(91,110,232,0.1);color:var(--primary);border-radius:10px">含维度分析</span>' : ''}
            </div>
        </div>`;
    }).join('');
}

// ===== 标准测评量表数据 =====
// 来源分类：standard(平台内置标准量表) / custom(用户自定义量表)
const standardAssessments = {
    sas: {
        name: 'SAS 焦虑自评量表',
        source: 'standard',
        sourceLabel: '📚 经典量表',
        author: 'Zung WWK (1971)',
        questions: [
            '我觉得比平常容易紧张和着急','我无缘无故地感到害怕','我容易心里烦乱或觉得惊恐',
            '我觉得我可能将要发疯','我觉得一切都很好，也不会发生什么不幸','我手脚发抖打颤',
            '我因为头痛、头颈痛和背痛而苦恼','我感觉容易衰弱和疲乏','我觉得心平气和，并且容易安静坐着',
            '我觉得心跳得很快','我因为一阵阵头晕而苦恼','我有晕倒发作或觉得要晕倒似的',
            '我呼气吸气都感到很容易','我手脚麻木和刺痛','我因为胃痛和消化不良而苦恼',
            '我常常要小便','我的手常常是干燥温暖的','我脸红发热','我容易入睡并且一夜睡得很好','我做噩梦'
        ],
        options: ['没有或很少','有时','经常','绝大部分或全部时间'],
        scores: [1,2,3,4],
        reverse: [4,8,12,16,17,18,19],
        // 红旗题项（高危指标）
        redFlags: [3, 0, 5],
        redFlagNames: ['我觉得我可能将要发疯', '我觉得比平常容易紧张和着急', '我手脚发抖打颤'],
        // 维度拆分：躯体焦虑（题1-5,7-8,10-12,14-16）和精神焦虑（题6,9,13,17-20）
        dimensions: {
            somatic: { name: '躯体焦虑', questions: [0,1,2,6,7,9,10,11,13,14,15] },
            psychic: { name: '精神焦虑', questions: [3,4,5,8,12,16,17,18,19] }
        },
        ranges: [
            { max: 50, level: '正常', desc: '焦虑水平在正常范围内。', color: '#22C55E' },
            { max: 59, level: '轻度焦虑', desc: '建议关注。', color: '#F59E0B' },
            { max: 69, level: '中度焦虑', desc: '建议系统干预。', color: '#F59E0B' },
            { max: 100, level: '重度焦虑', desc: '建议寻求专业帮助。', color: '#EF4444' }
        ]
    },
    sds: {
        name: 'SDS 抑郁自评量表',
        source: 'standard',
        sourceLabel: '📚 经典量表',
        author: 'Zung WWK (1965)',
        questions: [
            '我觉得闷闷不乐，情绪低沉','我觉得一天之中早晨最好','我一阵阵哭出来或觉得想哭',
            '我晚上睡眠不好','我吃得跟平常一样多','我与异性密切接触时和以往一样感到愉快',
            '我发觉我的体重在下降','我有便秘的苦恼','我心跳比平时快','我无缘无故地感到疲乏',
            '我的头脑跟平常一样清楚','我觉得经常做的事情并没有困难','我觉得不安而平静不下来',
            '我对将来抱有希望','我比平常容易生气激动','我觉得作出决定是容易的',
            '我觉得自己是个有用的人','我的生活过得很有意思','我认为如果我死了，别人会生活的好些',
            '平常感兴趣的事我仍然照样感兴趣'
        ],
        options: ['没有或很少','有时','经常','绝大部分或全部时间'],
        scores: [1,2,3,4],
        reverse: [1,4,5,11,12,13,15,16,17,19],
        redFlags: [2, 18],
        redFlagNames: ['我一阵阵哭出来或觉得想哭', '我认为如果我死了，别人会生活的好些'],
        dimensions: {
            emotional: { name: '情感症状', questions: [0,2,13,14,18] },
            somatic: { name: '躯体症状', questions: [3,6,7,8,9,10] },
            cognitive: { name: '认知症状', questions: [1,5,11,12,15,16,17,19] }
        },
        ranges: [
            { max: 53, level: '正常', desc: '抑郁水平正常。', color: '#22C55E' },
            { max: 62, level: '轻度抑郁', desc: '建议关注。', color: '#F59E0B' },
            { max: 72, level: '中度抑郁', desc: '建议深入评估。', color: '#F59E0B' },
            { max: 100, level: '重度抑郁', desc: '建议专业帮助。', color: '#EF4444' }
        ]
    },
    sleep: {
        name: '睡眠质量评估',
        source: 'standard',
        sourceLabel: '📋 平台内置',
        author: '心创工坊参考 PSQI',
        questions: [
            '入睡时间超过30分钟','夜间易醒或早醒','睡眠感觉浅，多梦',
            '白天感到疲倦嗜睡','注意力不集中','情绪易怒或低落',
            '需要借助药物才能入睡','打鼾或呼吸暂停','腿部不适影响睡眠','整体睡眠质量不满意'
        ],
        options: ['从不','偶尔','有时','经常','总是'],
        scores: [0,1,2,3,4],
        redFlags: [6],
        redFlagNames: ['需要借助药物才能入睡'],
        dimensions: {
            quality: { name: '睡眠质量', questions: [0,1,2,9] },
            impact: { name: '日间影响', questions: [3,4,5] },
            behavior: { name: '睡眠行为', questions: [6,7,8] }
        },
        ranges: [
            { max: 10, level: '睡眠良好', desc: '睡眠质量良好。', color: '#22C55E' },
            { max: 20, level: '轻度问题', desc: '建议调整作息。', color: '#F59E0B' },
            { max: 30, level: '中度问题', desc: '建议干预。', color: '#F59E0B' },
            { max: 40, level: '重度问题', desc: '建议专业帮助。', color: '#EF4444' }
        ]
    },
    pss: {
        name: 'PSS 压力知觉量表',
        questions: [
            '在过去一个月里，你因为意外发生的事情而感到心烦意乱的频率是多少？',
            '在过去一个月里，你感到无法控制生活中重要事情的频率是多少？',
            '在过去一个月里，你感到紧张和有压力的频率是多少？',
            '在过去一个月里，你对应对个人问题的能力感到有信心的频率是多少？',
            '在过去一个月里，你感到事情的发展如你所愿的频率是多少？',
            '在过去一个月里，你发现自己无法应付所有必须要做的事情的频率是多少？',
            '在过去一个月里，你能够控制生活中烦躁情绪的频率是多少？',
            '在过去一个月里，你感到事情都在你的掌控之中的频率是多少？',
            '在过去一个月里，你因为事情超出了你的掌控而感到愤怒的频率是多少？',
            '在过去一个月里，你感到困难堆积到无法克服的频率是多少？'
        ],
        options: ['从不','几乎不','有时','经常','总是'],
        scores: [0,1,2,3,4],
        reverse: [3,4,6,7],
        redFlags: [5, 9],
        redFlagNames: ['无法应付所有必须做的事', '困难堆积到无法克服'],
        dimensions: {
            perceived: { name: '压力感知', questions: [0,1,2,5,8,9] },
            coping: { name: '应对效能', questions: [3,4,6,7] }
        },
        ranges: [
            { max: 13, level: '压力较小', desc: '当前压力水平较低，应对良好。', color: '#22C55E' },
            { max: 20, level: '中度压力', desc: '有一定压力，建议关注自我调节。', color: '#F59E0B' },
            { max: 27, level: '较高压力', desc: '压力水平偏高，建议寻求支持。', color: '#F59E0B' },
            { max: 40, level: '高压状态', desc: '压力严重，建议专业干预。', color: '#EF4444' }
        ]
    },
    ocs: {
        name: '强迫症状筛查',
        questions: [
            '你是否有重复的、令人不安的想法挥之不去？',
            '你是否需要反复检查某些事情（如门锁、电器）？',
            '你是否需要按照特定的顺序或模式做事？',
            '你是否过度关注清洁或细菌污染？',
            '你是否觉得如果不做某些仪式化动作就会有坏事发生？',
            '你是否花大量时间反复洗手、整理或计数？',
            '这些想法或行为是否影响了你的日常工作或学习？',
            '你是否试图抵抗这些想法或行为但难以做到？',
            '你是否因为这些症状而感到痛苦或焦虑？',
            '你是否会囤积物品，即使它们没有实际价值？'
        ],
        options: ['完全没有','轻度','中度','重度','极重'],
        scores: [0,1,2,3,4],
        redFlags: [5, 6],
        redFlagNames: ['大量时间花在重复行为上', '影响日常工作或学习'],
        dimensions: {
            obsessions: { name: '强迫观念', questions: [0,4,7,8] },
            compulsions: { name: '强迫行为', questions: [1,2,3,5,9] },
            impact: { name: '功能影响', questions: [6] }
        },
        ranges: [
            { max: 5, level: '无明显症状', desc: '无明显强迫症状。', color: '#22C55E' },
            { max: 12, level: '轻度症状', desc: '有轻微强迫倾向，建议观察。', color: '#F59E0B' },
            { max: 22, level: '中度症状', desc: '强迫症状明显，建议评估。', color: '#F59E0B' },
            { max: 40, level: '重度症状', desc: '症状严重影响生活，建议专业治疗。', color: '#EF4444' }
        ]
    },
    interpersonal: {
        name: '人际敏感量表',
        questions: [
            '和陌生人相处时你会感到不自在吗？',
            '你是否担心别人会对你有不好的看法？',
            '在人群中你是否感到紧张或不安？',
            '你是否经常觉得自己不如别人？',
            '被批评时你是否会特别难过？',
            '你是否回避需要与人打交道的场合？',
            '你是否很难对别人说"不"？',
            '你是否经常猜测别人在想什么？',
            '你是否因为害怕被拒绝而不敢表达真实想法？',
            '你是否在社交后需要很长时间恢复精力？'
        ],
        options: ['完全不符合','不太符合','一般','比较符合','完全符合'],
        scores: [1,2,3,4,5],
        redFlags: [5, 8],
        redFlagNames: ['回避社交场合', '因害怕拒绝不敢表达自己'],
        dimensions: {
            sensitivity: { name: '敏感性', questions: [0,1,3,4,7] },
            avoidance: { name: '回避性', questions: [2,5,9] },
            assertiveness: { name: '自信水平', questions: [6,8] }
        },
        ranges: [
            { max: 15, level: '人际适应良好', desc: '人际交往适应良好。', color: '#22C55E' },
            { max: 25, level: '轻度敏感', desc: '有一定人际敏感，建议社交练习。', color: '#F59E0B' },
            { max: 35, level: '中度敏感', desc: '人际敏感较明显，建议关注。', color: '#F59E0B' },
            { max: 50, level: '重度敏感', desc: '严重影响社交，建议专业帮助。', color: '#EF4444' }
        ]
    },
    phobia: {
        name: '恐惧症状筛查',
        questions: [
            '你是否对特定的物体或场景（如蜘蛛、蛇、高处）感到强烈恐惧？',
            '面临恐惧对象时你是否会有心跳加速、出汗、发抖等生理反应？',
            '你是否因为害怕而主动回避某些场景或活动？',
            '你是否知道这种恐惧是过度的或不合理的？',
            '这种恐惧是否影响了你的日常出行或工作？',
            '你是否害怕在公共场合说话或表演？',
            '你是否害怕封闭或狭小的空间（如电梯、地铁）？',
            '你是否害怕空旷的地方或人群聚集处？',
            '看到血液或伤口时你是否会感到极度不适？',
            '你是否因为某种恐惧而限制了自己的生活？'
        ],
        options: ['完全没有','轻度','中度','重度','极重'],
        scores: [0,1,2,3,4],
        redFlags: [1, 9],
        redFlagNames: ['强烈生理反应', '恐惧限制了生活'],
        dimensions: {
            specific: { name: '特定恐惧', questions: [0,1,2,3,8] },
            social: { name: '社交恐惧', questions: [5] },
            agoraphobia: { name: '广场恐惧', questions: [6,7] },
            impact: { name: '功能影响', questions: [4,9] }
        },
        ranges: [
            { max: 4, level: '无明显恐惧', desc: '无明显恐惧症状。', color: '#22C55E' },
            { max: 10, level: '轻度恐惧', desc: '有轻微恐惧，基本不影响生活。', color: '#F59E0B' },
            { max: 20, level: '中度恐惧', desc: '恐惧症状较明显，有一定回避。', color: '#F59E0B' },
            { max: 40, level: '重度恐惧', desc: '恐惧严重影响生活，建议系统脱敏治疗。', color: '#EF4444' }
        ]
    },
    paranoia: {
        name: '偏执倾向筛查',
        questions: [
            '你是否经常觉得别人在背后议论你？',
            '你是否怀疑别人有不可告人的动机？',
            '你是否觉得很难信任别人？',
            '你是否认为大多数人会利用你，如果有机会的话？',
            '你是否对别人的眼神或动作过度解读？',
            '你是否经常感到被针对或被孤立？',
            '你是否有过别人无法理解的"特殊发现"？',
            '你是否因为怀疑而不愿与人深交？',
            '你是否经常因为觉得不公平而生气？',
            '你是否对任何批评都感到难以接受？'
        ],
        options: ['完全不符合','不太符合','一般','比较符合','完全符合'],
        scores: [1,2,3,4,5],
        redFlags: [3, 6],
        redFlagNames: ['认为大多数人会利用自己', '有无法理解的特殊发现'],
        dimensions: {
            suspicion: { name: '猜疑', questions: [0,1,2,4,5,8] },
            grandiosity: { name: '偏执思维', questions: [3,6,9] },
            isolation: { name: '社交隔离', questions: [7] }
        },
        ranges: [
            { max: 15, level: '正常范围', desc: '无明显偏执倾向。', color: '#22C55E' },
            { max: 25, level: '轻度敏感', desc: '有一定人际警戒，属正常范围。', color: '#F59E0B' },
            { max: 35, level: '中度偏执倾向', desc: '偏执倾向较明显，建议进一步评估。', color: '#F59E0B' },
            { max: 50, level: '重度偏执倾向', desc: '可能存在偏执性思维，建议专业评估。', color: '#EF4444' }
        ]
    },
    psychotic: {
        name: '精神病性症状筛查',
        questions: [
            '你是否听到过别人听不到的声音？',
            '你是否看到过别人看不到的东西？',
            '你是否有过一些旁人觉得古怪或不寻常的想法？',
            '你是否觉得自己有特殊的使命或超能力？',
            '你是否觉得有人在控制你的思想或行为？',
            '你是否觉得有人在监视你或跟踪你？',
            '你的想法是否会突然涌入，不受控制？',
            '你是否感到与周围的世界脱节或不真实？',
            '你的语言表达是否让别人难以理解？',
            '你是否在情感上感到麻木或疏离？'
        ],
        options: ['完全没有','偶尔','有时','经常','总是'],
        scores: [0,1,2,3,4],
        redFlags: [0, 4],
        redFlagNames: ['幻听', '被控制感'],
        dimensions: {
            hallucination: { name: '幻觉', questions: [0,1] },
            delusion: { name: '妄想', questions: [2,3,4,5] },
            thought: { name: '思维障碍', questions: [6,8] },
            dissociation: { name: '解离/疏离', questions: [7,9] }
        },
        ranges: [
            { max: 4, level: '无明显症状', desc: '无明显精神病性症状。', color: '#22C55E' },
            { max: 10, level: '轻度异常', desc: '有轻微体验，建议观察随访。', color: '#F59E0B' },
            { max: 20, level: '中度症状', desc: '症状较明显，建议精神科评估。', color: '#F59E0B' },
            { max: 40, level: '重度症状', desc: '症状严重，需尽快专业干预。', color: '#EF4444' }
        ]
    },
    selfEsteem: {
        name: '自尊水平评估（RSES简化版）',
        questions: [
            '我觉得自己是个有价值的人，至少与其他人在同一水平上',
            '我觉得自己有很多优点',
            '归根结底，我倾向于觉得自己是一个失败者',
            '我能把事情做得和大多数人一样好',
            '我觉得自己没什么值得骄傲的',
            '我对自己持有积极的态度',
            '总的来说，我对自己是满意的',
            '我希望我能为自己赢得更多尊重',
            '我确实时常感到自己毫无用处',
            '我时常认为自己一无是处'
        ],
        options: ['非常同意','同意','不同意','非常不同意'],
        scores: [4,3,2,1],
        reverse: [2,4,7,8,9],
        redFlags: [8, 9],
        redFlagNames: ['感到自己毫无用处', '认为自己一无是处'],
        dimensions: {
            positive: { name: '积极自尊', questions: [0,1,3,5,6] },
            negative: { name: '消极自我', questions: [2,4,7,8,9] }
        },
        ranges: [
            { max: 15, level: '低自尊', desc: '自尊水平很低，建议深入探索自我价值。', color: '#EF4444' },
            { max: 25, level: '偏低自尊', desc: '自尊水平偏低，建议自我接纳练习。', color: '#F59E0B' },
            { max: 32, level: '正常水平', desc: '自尊水平在正常范围内。', color: '#22C55E' },
            { max: 40, level: '高自尊', desc: '自尊水平较高，自我接纳良好。', color: '#22C55E' }
        ]
    },
    ghq12: {
        name: 'GHQ-12 一般健康问卷',
        questions: [
            '你最近是否能集中注意力做事情？',
            '你最近是否因为担心而失眠？',
            '你是否觉得自己在某些事情上扮演着有用的角色？',
            '你是否觉得自己能够做出决定？',
            '你是否一直感到紧张和压力？',
            '你是否觉得无法克服困难？',
            '你是否能享受日常活动？',
            '你是否能够面对问题？',
            '你是否感到不开心或情绪低落？',
            '你是否对自己失去信心？',
            '你是否觉得自己是个没用的人？',
            '你是否想过结束自己的生命？'
        ],
        options: ['比平常少得多','比平常少一些','和平时一样','比平常多一些','比平常多得多'],
        scores: [0,0,0,1,1],
        redFlags: [11],
        redFlagNames: ['想过结束自己的生命'],
        dimensions: {
            psychological: { name: '心理痛苦', questions: [1,4,5,8,9,10,11] },
            functioning: { name: '社会功能', questions: [0,2,3,6,7] }
        },
        ranges: [
            { max: 2, level: '良好', desc: '心理健康状况良好。', color: '#22C55E' },
            { max: 5, level: '轻度困扰', desc: '有轻度心理困扰，建议自我调节。', color: '#F59E0B' },
            { max: 8, level: '中度困扰', desc: '心理困扰较明显，建议寻求帮助。', color: '#F59E0B' },
            { max: 12, level: '重度困扰', desc: '心理困扰严重，建议专业干预。', color: '#EF4444' }
        ]
    },
    pcl5: {
        name: 'PCL-5 创伤后应激筛查',
        questions: [
            '你是否反复、非自愿地想起创伤事件的记忆？',
            '你是否反复做与创伤事件相关的噩梦？',
            '你是否有闪回或解离体验，仿佛创伤事件正在再次发生？',
            '当接触到与创伤事件相关的提示时，你是否感到强烈的情绪痛苦？',
            '当接触到与创伤事件相关的提示时，你是否有强烈的生理反应？',
            '你是否努力避免与创伤事件相关的想法或感受？',
            '你是否努力回避能唤起创伤记忆的人、地点或活动？',
            '你是否记不起创伤事件的重要部分？',
            '你是否对重要活动失去兴趣或减少参与？',
            '你是否感到与他人疏远或格格不入？',
            '你是否体验到持续的消极情绪状态（如恐惧、愤怒、羞耻、内疚）？',
            '你是否难以体验到积极情绪（如快乐、满足、爱）？',
            '你是否易怒或有攻击性爆发？',
            '你是否表现出鲁莽或自我毁灭的行为？',
            '你是否过度警觉，总是处于"戒备"状态？',
            '你是否容易受到惊吓？',
            '你是否难以集中注意力？',
            '你是否有睡眠问题（入睡困难、易醒、睡眠质量差）？'
        ],
        options: ['完全没有','有一点','中等程度','相当严重','极度'],
        scores: [0,1,2,3,4],
        redFlags: [13, 17],
        redFlagNames: ['自我毁灭行为', '严重睡眠问题'],
        dimensions: {
            reExperiencing: { name: '侵入性症状', questions: [0,1,2,3,4] },
            avoidance: { name: '回避症状', questions: [5,6] },
            cognitionMood: { name: '认知与情绪改变', questions: [7,8,9,10,11] },
            arousal: { name: '高度唤起', questions: [12,13,14,15,16,17] }
        },
        ranges: [
            { max: 10, level: '无明显PTSD症状', desc: '无明显创伤后应激症状。', color: '#22C55E' },
            { max: 22, level: '轻度症状', desc: '有轻度创伤反应，建议关注。', color: '#F59E0B' },
            { max: 33, level: '中度症状', desc: '症状较明显，建议创伤干预。', color: '#F59E0B' },
            { max: 72, level: '重度症状', desc: '症状严重，建议专业创伤治疗。', color: '#EF4444' }
        ]
    },
    lifeEvent: {
        name: '生活事件量表',
        questions: [
            '亲人离世',
            '重大疾病或受伤',
            '离婚或分手',
            '失业或被解雇',
            '重大经济损失',
            '搬家或环境剧变',
            '家庭成员关系严重冲突',
            '工作/学业压力剧增',
            '亲密关系问题',
            '法律纠纷',
            '亲友重病',
            '重大成就或荣誉'
        ],
        options: ['未发生','轻度影响','中度影响','重度影响','极重影响'],
        scores: [0,10,20,30,40],
        redFlags: [0, 1],
        redFlagNames: ['亲人离世', '重大疾病或受伤'],
        dimensions: {
            loss: { name: '丧失事件', questions: [0,2,3,4] },
            change: { name: '改变事件', questions: [5,7,11] },
            conflict: { name: '冲突事件', questions: [1,6,8,9,10] }
        },
        ranges: [
            { max: 50, level: '轻度压力', desc: '生活事件压力较小，应对良好。', color: '#22C55E' },
            { max: 150, level: '中度压力', desc: '累积压力中等，建议自我调节。', color: '#F59E0B' },
            { max: 250, level: '高度压力', desc: '生活事件压力很大，建议寻求支持。', color: '#F59E0B' },
            { max: 480, level: '极高压力', desc: '面临重大生活变故，建议专业干预。', color: '#EF4444' }
        ]
    },
    copingStyle: {
        name: '应对方式问卷',
        questions: [
            '遇到压力时，我会制定行动计划并照着做',
            '遇到压力时，我会寻求家人或朋友的支持',
            '遇到压力时，我会通过运动或兴趣爱好来释放',
            '遇到压力时，我会专注于解决问题本身',
            '遇到压力时，我会改变看问题的角度，往好的方面想',
            '遇到压力时，我会回避或假装事情没有发生',
            '遇到压力时，我会责怪自己或感到自责',
            '遇到压力时，我会通过吃、睡、玩手机等方式逃避',
            '遇到压力时，我会向专业人士求助',
            '遇到压力时，我会使用正念、冥想等方式调节',
            '遇到压力时，我会发泄情绪（如哭泣、发脾气）',
            '遇到压力时，我会否认问题的存在'
        ],
        options: ['从不使用','偶尔使用','有时使用','经常使用','总是使用'],
        scores: [1,2,3,4,5],
        redFlags: [6, 11],
        redFlagNames: ['严重自责', '否认问题存在'],
        dimensions: {
            problem: { name: '问题取向', questions: [0,3,9] },
            emotion: { name: '情绪取向', questions: [2,4,10] },
            social: { name: '社会支持', questions: [1,8] },
            avoidant: { name: '回避应对', questions: [5,7,11] },
            selfBlaming: { name: '自责型', questions: [6] }
        },
        ranges: [
            { max: 30, level: '以积极应对为主', desc: '主要使用积极应对方式，适应良好。', color: '#22C55E' },
            { max: 40, level: '应对方式混合', desc: '积极与消极应对并存，建议优化。', color: '#F59E0B' },
            { max: 50, level: '消极应对偏多', desc: '较多使用消极应对，建议学习积极策略。', color: '#F59E0B' },
            { max: 60, level: '以消极应对为主', desc: '主要使用消极应对，建议专业指导。', color: '#EF4444' }
        ]
    },
    marriage: {
        name: '婚姻/关系满意度评估',
        questions: [
            '你和伴侣的沟通是否顺畅？',
            '你对你们目前的亲密关系满意吗？',
            '你们在重大决策上是否能达成一致？',
            '你是否感到被伴侣理解和支持？',
            '你们的性生活满意度如何？',
            '你们是否经常因为琐事争吵？',
            '你信任你的伴侣吗？',
            '你对伴侣的家人或朋友关系满意吗？',
            '你们在财务问题上是否有共识？',
            '你是否觉得这段关系让你感到幸福？',
            '你是否想过结束这段关系？',
            '如果可以重来，你还会选择和对方在一起吗？'
        ],
        options: ['非常不满意','不太满意','一般','比较满意','非常满意'],
        scores: [1,2,3,4,5],
        reverse: [5, 10],
        redFlags: [10],
        redFlagNames: ['想过结束关系'],
        dimensions: {
            communication: { name: '沟通质量', questions: [0,3,6] },
            intimacy: { name: '亲密感', questions: [1,4,9] },
            conflict: { name: '冲突处理', questions: [2,5,8] },
            commitment: { name: '承诺水平', questions: [7,10,11] }
        },
        ranges: [
            { max: 20, level: '高度不满意', desc: '关系质量很差，建议伴侣咨询。', color: '#EF4444' },
            { max: 35, level: '偏低满意度', desc: '关系存在较多问题，需要改善。', color: '#F59E0B' },
            { max: 48, level: '中等满意度', desc: '关系基本稳定，有提升空间。', color: '#22C55E' },
            { max: 60, level: '高度满意度', desc: '关系质量良好，满意度高。', color: '#22C55E' }
        ]
    },
    crisis: {
        name: '危机快速评估量表',
        questions: [
            '最近一周，你是否有过自杀的念头？',
            '你是否有具体的自杀计划？',
            '你是否有过伤害自己的行为？',
            '你是否感到绝望，觉得没有希望？',
            '你是否有可以求助的人？'
        ],
        options: ['没有', '偶尔有', '经常有', '持续有'],
        scores: [0, 1, 2, 3],
        reverse: [4],
        redFlags: [0, 1, 2],
        redFlagNames: ['最近一周，你是否有过自杀的念头？', '你是否有具体的自杀计划？', '你是否有过伤害自己的行为？'],
        dimensions: {
            suicidal: { name: '自杀风险', questions: [0, 1, 2] },
            hopelessness: { name: '绝望感', questions: [3] },
            support: { name: '社会支持', questions: [4] }
        },
        ranges: [
            { max: 2, level: '低风险', desc: '危机风险较低，继续常规关注。', color: '#22C55E' },
            { max: 5, level: '中风险', desc: '存在一定危机风险，加强监测。', color: '#F59E0B' },
            { max: 8, level: '高风险', desc: '危机风险较高，建议立即干预。', color: '#EF4444' },
            { max: 12, level: '紧急', desc: '紧急危机状态，请立即采取行动！', color: '#DC2626' }
        ]
    }
};

// ===== 常用咨询技术标签 =====
const commonTechs = ['认知重构', '正念放松', '情感反映', '空椅子技术', '行为实验', '动机式访谈', '系统脱敏', '叙事疗法', '焦点解决', '家庭系统'];

// ===== 常用句式模板 =====
const phraseTemplates = {
    S: [
        '来访者主诉近期情绪低落，主要表现为...',
        '来访者描述本周睡眠质量下降，具体为...',
        '来访者表达了对...的担忧，认为...',
        '来访者提到最近与家人/同事的关系出现...',
        '来访者自述注意力难以集中，影响到...',
        '来访者表示对之前感兴趣的事情提不起劲，包括...',
        '来访者主动提及想聊聊关于...的话题',
        '来访者反馈上次布置的作业完成情况：...'
    ],
    O: [
        '来访者准时到达，衣着整洁，精神状态尚可',
        '来访者初次见面略显拘谨，沟通中逐渐放松',
        '咨询过程中来访者数次落泪，情绪波动明显',
        '来访者语速较快，表现出明显的焦虑特质',
        '来访者大部分时间低头，目光接触较少',
        '来访者配合度良好，能够回应提问并主动表达',
        '来访者言语表达流畅，逻辑清晰',
        '来访者在谈到...话题时出现明显的情绪变化'
    ],
    A: [
        '本次咨询的核心议题是...，来访者的核心信念表现为...',
        '从认知行为角度分析，来访者的自动思维主要是...',
        '结合上周测评结果，SAS/SDS分数显示...',
        '咨询关系建立良好，来访者的开放度较上次有所提升',
        '进展评估：本次咨询在...方面取得一定进展',
        '需要关注的风险点：...',
        '来访者的社会支持系统情况：...',
        '鉴别诊断考虑：需排除...的可能性'
    ],
    P: [
        '下次咨询重点：继续深入探讨...',
        '建议来访者完成：每日情绪打卡记录',
        '布置作业：每天3件小事记录，培养积极关注',
        '下次预约时间：确认中',
        '建议进行...测评，进一步评估当前状态',
        '下次咨询计划使用...技术，针对...进行工作',
        '建议来访者增加户外活动，每天30分钟',
        '危机预案：如出现...情况，立即联系...'
    ]
};

const phraseTextareaMap = {
    S: 'rSubContent',
    O: 'rObjBehavior',
    A: 'rInsight',
    P: 'rNextFocus'
};

// ===== 模拟用户列表（多用户协作Demo） =====
const mockUsers = [
    { id: 'demo', username: 'demo', name: '王咨询师', role: 'counselor', password: 'demo' },
    { id: 'u2', username: 'li', name: '李咨询师', role: 'counselor', password: '123456' },
    { id: 'u3', username: 'zhang', name: '张督导', role: 'supervisor', password: '123456' },
    { id: 'u4', username: 'admin', name: '系统管理员', role: 'admin', password: 'admin' }
];

// ===== 全局状态 =====
let currentUser = null;
let currentAssessment = null;
let assessmentAnswers = {};
let assessmentClientId = null;
let assessmentMode = 'list'; // 'list' | 'single'
let currentQuestionIdx = 0;
let editingClientId = null;
let selectedTechs = [];
let supervisorMode = false;
let originalDashboardHTML = '';
let lastRecordData = null;
let recordSaveAction = 'list'; // 'list' | 'view'  保存记录后的跳转动作
let notificationPermission = false;
let appointmentReminderInterval = null;
let currentStarRating = 0;

// ===== 疗效评估：星星评分 =====
function setStarRating(val) {
    currentStarRating = val;
    document.getElementById('rCounselorRatingVal').value = val;
    const stars = document.querySelectorAll('#rCounselorRating .star-rate');
    const hints = ['', '效果有限', '略有效果', '效果一般', '效果明显', '效果显著'];
    stars.forEach((s, idx) => {
        s.style.color = (idx < val) ? '#F59E0B' : '#E5E7EB';
    });
    document.getElementById('rCounselorRatingHint').textContent = val > 0 ? `已选 ${val} 星（${hints[val]}）` : '点击星星评分';
}

function resetStarRating() {
    currentStarRating = 0;
    document.getElementById('rCounselorRatingVal').value = '';
    const stars = document.querySelectorAll('#rCounselorRating .star-rate');
    stars.forEach(s => s.style.color = '#E5E7EB');
    document.getElementById('rCounselorRatingHint').textContent = '点击星星评分';
}

// ===== 初始化 =====
async function initApp() {
    await initDB();
    window.db = db;
    
    // 初始化演示数据
    await initDemoData();
    await initDemoAIData();
    
    // 请求通知权限
    requestNotificationPermission();
    
    // 启动预约提醒检查
    startAppointmentReminder();
    
    // 检查是否有进行中的咨询，恢复计时器
    await resumeActiveConsultation();
    
    // 页面关闭时自动备份
    window.addEventListener('beforeunload', async () => {
        if (db && db.isReady) {
            try { await db.createBackup('auto_close'); } catch(e) {}
        }
    });
    
    // 检查隐私协议同意状态
    const agreed = await db.getSetting('privacyAgreed', false);
    if (!agreed) {
        showPrivacyModal();
        return;
    }
    
    // 检查登录状态
    const savedUser = await db.getSetting('currentUser', null);
    if (savedUser) {
        currentUser = savedUser;
        window.currentUser = currentUser;
        await showMainApp();
    } else {
        showLoginPage();
    }
}

// ===== 隐私协议弹窗 =====
function showPrivacyModal() {
    const modal = document.getElementById('privacyModal');
    if (modal) modal.classList.add('active');
}

async function acceptPrivacy() {
    await db.setSetting('privacyAgreed', true);
    document.getElementById('privacyModal').classList.remove('active');
    showLoginPage();
}

// ===== 登录/注册 =====
function showLoginPage() {
    document.getElementById('loginPage').classList.remove('hidden');
    document.getElementById('registerPage').classList.add('hidden');
    document.getElementById('app').classList.remove('active');
    document.getElementById('privacyModal').classList.remove('active');
}

function toggleAuth() {
    document.getElementById('loginPage').classList.toggle('hidden');
    document.getElementById('registerPage').classList.toggle('hidden');
}

document.getElementById('loginForm').addEventListener('submit', async e => {
    e.preventDefault();
    const u = document.getElementById('loginUsername').value.trim();
    const p = document.getElementById('loginPassword').value.trim();
    
    // 多用户选择（Demo）
    const userSelect = document.getElementById('userSelect');
    if (userSelect && userSelect.value) {
        currentUser = mockUsers.find(x => x.id === userSelect.value);
    } else {
        const users = await Storage.get('users', []);
        currentUser = users.find(x => x.username === u && x.password === p);
        if (!currentUser) currentUser = mockUsers.find(x => x.username === u && x.password === p);
    }
    
    if (currentUser) {
        await db.setSetting('currentUser', currentUser);
        window.currentUser = currentUser;
        await db.logOperation('login', 'user', currentUser.id);
        await showMainApp();
    } else {
        alert('用户名或密码错误。演示账号: demo/demo');
    }
});

document.getElementById('registerForm').addEventListener('submit', async e => {
    e.preventDefault();
    const username = document.getElementById('regUsername').value.trim();
    const name = document.getElementById('regName').value.trim();
    const password = document.getElementById('regPassword').value.trim();
    if (!username || !name || !password) return;
    
    let users = await Storage.get('users', []);
    if (users.find(x => x.username === username)) { alert('用户名已存在'); return; }
    
    const user = { id: 'u' + Date.now(), username, name, password, role: 'counselor' };
    await Storage.putOne('users', user);
    currentUser = user;
    await db.setSetting('currentUser', currentUser);
    window.currentUser = currentUser;
    await db.logOperation('register', 'user', user.id);
    await showMainApp();
});

async function logout() {
    await db.logOperation('logout', 'user', currentUser.id);
    currentUser = null;
    await db.setSetting('currentUser', null);
    window.currentUser = null;
    showLoginPage();
}

// ===== 显示主应用 =====
async function showMainApp() {
    document.getElementById('loginPage').classList.add('hidden');
    document.getElementById('registerPage').classList.add('hidden');
    document.getElementById('app').classList.add('active');
    
    document.getElementById('userName').textContent = currentUser.name;
    document.getElementById('userAvatar').textContent = currentUser.name.charAt(0);
    
    // 显示角色标签
    const roleBadge = document.getElementById('roleBadge');
    if (roleBadge) {
        roleBadge.textContent = currentUser.role === 'supervisor' ? '督导' : currentUser.role === 'admin' ? '管理员' : '咨询师';
        roleBadge.style.display = 'inline-block';
    }
    
    // 督导模式按钮显示控制
    const supervisorBtn = document.getElementById('supervisorBtn');
    if (supervisorBtn) {
        supervisorBtn.style.display = currentUser.role === 'supervisor' || currentUser.role === 'admin' ? 'inline-flex' : 'none';
    }

    // 导航可见性控制
    updateNavVisibility();

    await showPage('dashboard');

    // 首次使用触发新手引导（每个用户独立记录）
    const userId = currentUser ? currentUser.id : 'default';
    const guideKey = 'hasCompletedGuide_' + userId;
    if (!localStorage.getItem(guideKey)) {
        startOnboarding();
    } else {
        // 老用户：随机展示一条情感化文案（每天最多1条）
        showDailyEncouragement();
    }
}

// ===== 页面导航 =====
async function showPage(pageId) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(pageId).classList.add('active');
    document.querySelectorAll('.nav-link').forEach(n => n.classList.remove('active'));
    const nav = document.querySelector(`.nav-link[data-page="${pageId}"]`);
    if (nav) nav.classList.add('active');
    
    const titles = { 
        dashboard: '工作台', 
        clients: '来访者档案', 
        assessments: '测评量表', 
        records: '咨询记录', 
        schedule: '预约日程', 
        alerts: '风险预警', 
        aiAnalysis: '智能咨询分析',
        backups: '数据备份',
        operationLogs: '操作日志',
        clientLink: '来访者扫码入口',
        workload: '工作情况',
        clientOverview: '来访者概览',
        assessmentRun: '测评进行中',
        assessmentReport: '测评报告',
        assessmentCompare: '测评对比',
        recordDetail: '记录详情',
        supervisorReview: '督导审阅',
        supervisorFeedback: '督导反馈',
        insights: '数据洞察',
        organization: '机构管理'
    };
    document.getElementById('pageTitle').textContent = titles[pageId] || '工作台';
    
    // 刷新数据
    if (pageId === 'dashboard') {
        if (supervisorMode && originalDashboardHTML) {
            // 督导模式下切换到其他页面再回来时，需要重新渲染督导视图
            renderSupervisorDashboard();
        } else {
            // 恢复原始HTML（如果被督导模式覆盖过）
            if (originalDashboardHTML && document.getElementById('dashboard').innerHTML !== originalDashboardHTML) {
                document.getElementById('dashboard').innerHTML = originalDashboardHTML;
            }
            renderDashboard();
        }
    }
    if (pageId === 'clients') await renderClients();
    if (pageId === 'assessments') await renderAssessments();
    if (pageId === 'records') await renderRecords();
    if (pageId === 'schedule') await renderSchedule('today');
    if (pageId === 'alerts') await renderAlerts();
    if (pageId === 'aiAnalysis') await renderAIAnalysis();
    if (pageId === 'backups') await renderBackups();
    if (pageId === 'operationLogs') await renderOperationLogs();
    if (pageId === 'clientLink') await renderClientLink();
    if (pageId === 'supervisorReview') await renderSupervisorReview();
    if (pageId === 'supervisorFeedback') await renderSupervisorFeedback();
    if (pageId === 'insights') await renderInsights();
    if (pageId === 'organization') await renderOrganization();
    if (pageId === 'workload') await renderWorkloadPage();
}

// ===== 工作台 =====
async function renderTodaySchedule() {
    const schedContainer = document.getElementById('todaySchedule');
    if (!schedContainer) return;
    
    const appointments = await Storage.get('appointments', []);
    const clients = await Storage.get('clients', []);
    const today = formatDate(new Date());
    const todayAppts = appointments.filter(a => a.date === today && a.status !== '已取消').sort((a,b)=>a.time.localeCompare(b.time));
    
    if (todayAppts.length === 0) {
        schedContainer.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📅</div><h3>今日暂无预约</h3></div>';
        return;
    }
    
    schedContainer.innerHTML = todayAppts.map(a => {
        const c = clients.find(x => x.id === a.clientId);
        const countdown = getAppointmentCountdown(a.date, a.time);
        let actionBtns = '';
        if (a.status === '待进行') {
            actionBtns = `<button class="btn btn-sm btn-success" onclick="startConsultation('${a.id}')">开始咨询</button>`;
        } else if (a.status === '进行中') {
            actionBtns = `<button class="btn btn-sm btn-primary" onclick="endConsultation()">结束咨询</button>`;
        } else if (a.status === '已完成') {
            actionBtns = `<span class="badge badge-success">已完成</span>`;
        }
        
        return `<div class="schedule-item">
            <div class="schedule-time">${a.time}</div>
            <div class="schedule-content">
                <div class="schedule-title">${c ? c.name : '未知'} · ${a.type} ${a.status === '进行中' ? '<span class="badge badge-warning">进行中</span>' : ''}</div>
                <div class="schedule-meta">${countdown ? `<span style="color:${countdown.urgent ? 'var(--danger)' : 'var(--primary)'}">${countdown.text}</span>` : ''} ${a.note || ''}</div>
            </div>
            <div class="schedule-actions">${actionBtns}</div>
        </div>`;
    }).join('');
}

async function renderDashboard() {
    const clients = await Storage.get('clients', []);
    const records = await Storage.get('records', []);
    const assessments = await Storage.get('assessments', []);
    const appointments = await Storage.get('appointments', []);
    const moods = await Storage.get('moods', []);
    const today = formatDate(new Date());

    const dashClients = document.getElementById('dashClients');
    const dashRecords = document.getElementById('dashRecords');
    const dashAssessments = document.getElementById('dashAssessments');
    const dashAlertCount = document.getElementById('dashAlertCount');
    const attentionContainer = document.getElementById('attentionList');

    if (!dashClients || !dashRecords || !dashAssessments) return;

    dashClients.textContent = clients.length;
    dashRecords.textContent = records.length;
    dashAssessments.textContent = assessments.length;

    const alerts = await Storage.get('alerts', []);
    const unreadAlerts = alerts.filter(a => !a.read);
    if (dashAlertCount) dashAlertCount.textContent = unreadAlerts.length;

    // 情感化欢迎语
    updateDashboardGreeting();

    // 智能下一步推荐（系统建议）
    await renderSystemSuggestions();

    // 场景计数
    const todayAppts = appointments.filter(a => a.date === today && a.status === '待进行');
    const todayRecords = records.filter(r => r.date === today);
    const pendingAssess = assessments.filter(a => !a.completed).length;

    const sceneReception = document.getElementById('sceneReceptionCount');
    const sceneConsult = document.getElementById('sceneConsultCount');
    const sceneAssess = document.getElementById('sceneAssessCount');
    const sceneSummary = document.getElementById('sceneSummaryCount');

    if (sceneReception) sceneReception.textContent = todayAppts.length;
    if (sceneConsult) sceneConsult.textContent = todayRecords.length;
    if (sceneAssess) sceneAssess.textContent = pendingAssess;
    if (sceneSummary) sceneSummary.textContent = todayRecords.length;

    // 需要关注（按紧急程度排序：高风险>情绪异常>脱落预警）
    if (attentionContainer) {
        const attentionList = await buildAttentionList(clients, records, assessments, moods, appointments);
        if (attentionList.length === 0) {
            attentionContainer.innerHTML = '<div class="empty-state" style="padding:24px"><div class="empty-state-icon">✨</div><h3 style="font-size:14px">所有来访者状态良好</h3></div>';
        } else {
            attentionContainer.innerHTML = attentionList.slice(0, 5).map(item => `
                <div style="padding:12px;background:${item.bgColor};border-radius:8px;border-left:3px solid ${item.borderColor};margin-bottom:8px;display:flex;justify-content:space-between;align-items:center;cursor:pointer" onclick="${item.action}">
                    <div>
                        <div style="font-weight:600;font-size:14px">${item.icon} ${item.name}</div>
                        <div style="font-size:12px;color:var(--text-muted);margin-top:2px">${item.reason}</div>
                    </div>
                    <button class="btn btn-sm" style="background:${item.borderColor};color:white">查看</button>
                </div>
            `).join('');
        }
    }
}

// ===== 疗效追踪三段式闭环 =====
async function renderEfficacyCurve(clientId) {
    const records = await Storage.get('records', []);
    const clientRecords = records.filter(r => r.clientId === clientId).sort((a, b) => a.date.localeCompare(b.date));
    const assessments = await Storage.get('assessments', []);
    const clientAssessments = assessments.filter(a => a.clientId === clientId).sort((a, b) => a.date.localeCompare(b.date));

    const hasSuds = clientRecords.some(r => r.suds !== undefined);
    const hasRating = clientRecords.some(r => r.counselorRating);
    const hasAssess = clientAssessments.length > 0;

    if (!hasSuds && !hasRating && !hasAssess) {
        return '';
    }

    let html = `<div class="card" style="margin-bottom:16px">
        <div class="card-header">
            <div class="card-title">📈 疗效追踪曲线</div>
            <span style="font-size:12px;color:var(--text-muted)">基线 ⭐ · 过程 🔵 · 终点 🏁</span>
        </div>
        <div style="padding:8px">`;

    // 图例
    html += `<div style="display:flex;gap:16px;margin-bottom:12px;font-size:12px">`;
    if (hasSuds) html += `<div><span style="display:inline-block;width:12px;height:3px;background:#8B5CF6;border-radius:2px"></span> SUDS (0-10)</div>`;
    if (hasRating) html += `<div><span style="display:inline-block;width:12px;height:3px;background:#F59E0B;border-radius:2px"></span> 疗效自评 (1-5)</div>`;
    if (hasAssess) html += `<div><span style="display:inline-block;width:12px;height:3px;background:#22C55E;border-radius:2px"></span> 测评得分</div>`;
    html += `</div>`;

    // SVG 曲线
    const width = 600;
    const height = 180;
    const padding = 40;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    // 收集所有数据点
    const allPoints = [];
    
    // SUDS 数据点
    if (hasSuds) {
        clientRecords.forEach((r, idx) => {
            if (r.suds !== undefined) {
                allPoints.push({
                    x: idx,
                    y: r.suds,
                    type: 'suds',
                    date: r.date,
                    label: `咨询${idx + 1}次`,
                    phase: idx === 0 ? 'baseline' : (idx === clientRecords.length - 1 && clientRecords.length >= 8 ? 'endpoint' : 'mid'),
                    value: r.suds
                });
            }
        });
    }

    // 疗效自评数据点
    if (hasRating) {
        clientRecords.forEach((r, idx) => {
            if (r.counselorRating) {
                allPoints.push({
                    x: idx,
                    y: r.counselorRating * 2, // 映射到 0-10 范围
                    type: 'rating',
                    date: r.date,
                    label: `咨询${idx + 1}次`,
                    value: r.counselorRating
                });
            }
        });
    }

    // 测评数据点
    if (hasAssess) {
        const maxScore = Math.max(...clientAssessments.map(a => a.score));
        clientAssessments.forEach((a, idx) => {
            allPoints.push({
                x: clientRecords.findIndex(r => r.date === a.date) >= 0 ? 
                    clientRecords.findIndex(r => r.date === a.date) : idx,
                y: (a.score / maxScore) * 10, // 归一化到 0-10
                type: 'assess',
                date: a.date,
                phase: a.phase,
                value: a.score
            });
        });
    }

    if (allPoints.length === 0) {
        html += '<div class="empty-state" style="padding:24px"><div class="empty-state-icon">📊</div><h3>暂无疗效数据</h3></div></div></div>';
        return html;
    }

    html += `<svg viewBox="0 0 ${width} ${height}" style="width:100%;height:auto">`;
    
    // 背景网格
    html += `<defs>
        <pattern id="grid" width="40" height="20" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 20" fill="none" stroke="var(--border)" stroke-width="0.5" opacity="0.3"/>
        </pattern>
        <linearGradient id="sudsGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#8B5CF6"/>
            <stop offset="100%" stop-color="#A78BFA"/>
        </linearGradient>
        <linearGradient id="ratingGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#F59E0B"/>
            <stop offset="100%" stop-color="#FBBF24"/>
        </linearGradient>
    </defs>`;

    html += `<rect x="${padding}" y="${padding}" width="${chartWidth}" height="${chartHeight}" fill="url(#grid)"/>`;

    // Y轴
    for (let i = 0; i <= 5; i++) {
        const y = padding + (chartHeight / 5) * (5 - i);
        html += `<line x1="${padding}" y1="${y}" x2="${width - padding}" y2="${y}" stroke="var(--border)" stroke-width="0.5"/>`;
        html += `<text x="${padding - 8}" y="${y + 4}" text-anchor="end" font-size="10" fill="var(--text-muted)">${i * 2}</text>`;
    }

    // X轴标签
    const xLabels = clientRecords.map((r, idx) => ({ x: padding + (chartWidth / Math.max(clientRecords.length - 1, 1)) * idx, label: `第${idx + 1}次` }));
    xLabels.forEach(l => {
        html += `<text x="${l.x}" y="${height - 10}" text-anchor="middle" font-size="10" fill="var(--text-muted)">${l.label}</text>`;
    });

    // 绘制 SUDS 曲线
    if (hasSuds) {
        const sudsPoints = allPoints.filter(p => p.type === 'suds');
        if (sudsPoints.length > 1) {
            const path = sudsPoints.map((p, i) => {
                const x = padding + (chartWidth / Math.max(clientRecords.length - 1, 1)) * p.x;
                const y = padding + chartHeight - (p.y / 10) * chartHeight;
                return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
            }).join(' ');
            html += `<path d="${path}" fill="none" stroke="url(#sudsGrad)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`;
        }
        sudsPoints.forEach(p => {
            const x = padding + (chartWidth / Math.max(clientRecords.length - 1, 1)) * p.x;
            const y = padding + chartHeight - (p.y / 10) * chartHeight;
            const phaseMarker = p.phase === 'baseline' ? '⭐' : p.phase === 'endpoint' ? '🏁' : '';
            html += `<circle cx="${x}" cy="${y}" r="4" fill="#8B5CF6" stroke="white" stroke-width="2"/>`;
            if (phaseMarker) {
                html += `<text x="${x + 8}" y="${y - 4}" font-size="14">${phaseMarker}</text>`;
            }
        });
    }

    // 绘制疗效自评曲线
    if (hasRating) {
        const ratingPoints = allPoints.filter(p => p.type === 'rating');
        if (ratingPoints.length > 1) {
            const path = ratingPoints.map((p, i) => {
                const x = padding + (chartWidth / Math.max(clientRecords.length - 1, 1)) * p.x;
                const y = padding + chartHeight - (p.y / 10) * chartHeight;
                return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
            }).join(' ');
            html += `<path d="${path}" fill="none" stroke="url(#ratingGrad)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="4,4"/>`;
        }
        ratingPoints.forEach(p => {
            const x = padding + (chartWidth / Math.max(clientRecords.length - 1, 1)) * p.x;
            const y = padding + chartHeight - (p.y / 10) * chartHeight;
            html += `<circle cx="${x}" cy="${y}" r="3" fill="#F59E0B" stroke="white" stroke-width="2"/>`;
        });
    }

    // 绘制测评得分点
    if (hasAssess) {
        const assessPoints = allPoints.filter(p => p.type === 'assess');
        assessPoints.forEach(p => {
            const x = padding + (chartWidth / Math.max(clientRecords.length - 1, 1)) * p.x;
            const y = padding + chartHeight - (p.y / 10) * chartHeight;
            html += `<rect x="${x - 4}" y="${y - 4}" width="8" height="8" fill="#22C55E" stroke="white" stroke-width="2"/>`;
        });
    }

    html += '</svg>';

    // 趋势分析
    if (hasSuds && clientRecords.length >= 3) {
        const sudsValues = clientRecords.filter(r => r.suds !== undefined).map(r => r.suds);
        const trend = sudsValues[sudsValues.length - 1] < sudsValues[0] ? '好转' : 
                      sudsValues[sudsValues.length - 1] > sudsValues[0] ? '恶化' : '稳定';
        const trendColor = trend === '好转' ? 'var(--success)' : trend === '恶化' ? 'var(--danger)' : 'var(--warning)';
        const change = ((sudsValues[sudsValues.length - 1] - sudsValues[0]) / sudsValues[0] * 100).toFixed(0);
        
        html += `<div style="margin-top:8px;padding:8px;background:rgba(99,102,241,0.05);border-radius:6px;font-size:12px">
            <strong style="color:${trendColor}">趋势判断：${trend}</strong> · SUDS 变化 ${change > 0 ? '+' : ''}${change}% · 
            ${trend === '好转' ? '疗效明显，继续保持当前干预方案' : 
              trend === '恶化' ? '需重新评估治疗方案，考虑调整策略' : '疗效稳定，可继续当前计划'}
        </div>`;
    }

    html += `</div></div>`;
    return html;
}

// ===== 危机评估配置 =====
const PLATFORM_MIN_CRISIS_THRESHOLD = {
    assessmentHighScore: 50,        // 平台最低：测评得分≥50触发
    moodLowDays: 3,                 // 平台最低：连续3天情绪低落
    moodLowScore: 3,                // 平台最低：情绪评分≤3
    noAppointmentDays: 21,          // 平台最低：21天未咨询
    noMoodRecordDays: 14            // 平台最低：14天未记录情绪
};

const DEFAULT_CRISIS_CONFIG = {
    assessmentHighScore: 70,
    moodLowDays: 5,
    moodLowScore: 2,
    noAppointmentDays: 14,
    noMoodRecordDays: 7
};

async function getCrisisConfig() {
    const userId = currentUser ? currentUser.id : 'default';
    const stored = await Storage.get('crisisConfig_' + userId, null);
    if (stored) {
        // 合并配置，并确保不低于平台最低阈值
        return {
            assessmentHighScore: Math.max(stored.assessmentHighScore || DEFAULT_CRISIS_CONFIG.assessmentHighScore, PLATFORM_MIN_CRISIS_THRESHOLD.assessmentHighScore),
            moodLowDays: Math.max(stored.moodLowDays || DEFAULT_CRISIS_CONFIG.moodLowDays, PLATFORM_MIN_CRISIS_THRESHOLD.moodLowDays),
            moodLowScore: Math.min(stored.moodLowScore || DEFAULT_CRISIS_CONFIG.moodLowScore, PLATFORM_MIN_CRISIS_THRESHOLD.moodLowScore),
            noAppointmentDays: Math.max(stored.noAppointmentDays || DEFAULT_CRISIS_CONFIG.noAppointmentDays, PLATFORM_MIN_CRISIS_THRESHOLD.noAppointmentDays),
            noMoodRecordDays: Math.max(stored.noMoodRecordDays || DEFAULT_CRISIS_CONFIG.noMoodRecordDays, PLATFORM_MIN_CRISIS_THRESHOLD.noMoodRecordDays)
        };
    }
    return { ...DEFAULT_CRISIS_CONFIG };
}

async function saveCrisisConfig(config) {
    const userId = currentUser ? currentUser.id : 'default';
    const oldConfig = await getCrisisConfig();
    await db.setSetting('crisisConfig_' + userId, config);
    await db.logOperation('update', 'crisisConfig', userId, { config });
    await logCrisisConfigChange(oldConfig, config);
    return true;
}

// 打开危机配置模态框
async function openCrisisConfigModal() {
    const config = await getCrisisConfig();
    document.getElementById('ccAssessment').value = config.assessmentHighScore;
    document.getElementById('ccAssessmentVal').textContent = config.assessmentHighScore;
    document.getElementById('ccMoodDays').value = config.moodLowDays;
    document.getElementById('ccMoodDaysVal').textContent = config.moodLowDays;
    document.getElementById('ccMoodScore').value = config.moodLowScore;
    document.getElementById('ccMoodScoreVal').textContent = config.moodLowScore;
    document.getElementById('ccNoAppt').value = config.noAppointmentDays;
    document.getElementById('ccNoApptVal').textContent = config.noAppointmentDays;
    document.getElementById('ccNoMood').value = config.noMoodRecordDays;
    document.getElementById('ccNoMoodVal').textContent = config.noMoodRecordDays;
    await renderCrisisConfigLogs();
    openModal('crisisConfigModal');
}

async function renderCrisisConfigLogs() {
    const container = document.getElementById('crisisConfigLogs');
    if (!container) return;
    const userId = currentUser ? currentUser.id : 'default';
    const allLogs = await Storage.get('crisisConfigLogs', []);
    const myLogs = allLogs.filter(l => l.userId === userId).sort((a, b) => b.timestamp.localeCompare(a.timestamp));
    if (myLogs.length === 0) {
        container.innerHTML = '<div style="padding:16px;text-align:center;color:var(--text-muted);font-size:13px">暂无变更记录</div>';
        return;
    }
    container.innerHTML = myLogs.slice(0, 10).map(l => {
        const date = new Date(l.timestamp);
        const dateStr = date.toLocaleString('zh-CN', { hour12: false });
        const diffs = [];
        if (l.diff.assessmentHighScore) diffs.push(`测评高分 ${l.oldConfig.assessmentHighScore}→${l.newConfig.assessmentHighScore}`);
        if (l.diff.moodLowDays) diffs.push(`低落天数 ${l.oldConfig.moodLowDays}→${l.newConfig.moodLowDays}`);
        if (l.diff.moodLowScore) diffs.push(`低落评分 ${l.oldConfig.moodLowScore}→${l.newConfig.moodLowScore}`);
        if (l.diff.noAppointmentDays) diffs.push(`未咨询 ${l.oldConfig.noAppointmentDays}→${l.newConfig.noAppointmentDays}`);
        if (l.diff.noMoodRecordDays) diffs.push(`未记录 ${l.oldConfig.noMoodRecordDays}→${l.newConfig.noMoodRecordDays}`);
        return `<div style="padding:10px 12px;background:var(--bg);border-radius:8px;margin-bottom:8px;font-size:12px;line-height:1.6">
            <div style="display:flex;justify-content:space-between;margin-bottom:4px">
                <strong style="color:var(--text)">${l.userName}</strong>
                <span style="color:var(--text-muted)">${dateStr}</span>
            </div>
            <div style="color:var(--text-muted)">${diffs.length > 0 ? '调整：' + diffs.join('；') : '无变化'}</div>
        </div>`;
    }).join('');
}

async function resetCrisisConfigToDefault() {
    if (!confirm('确定要恢复默认配置吗？')) return;
    const oldConfig = await getCrisisConfig();
    await db.setSetting('crisisConfig_' + (currentUser ? currentUser.id : 'default'), { ...DEFAULT_CRISIS_CONFIG });
    await logCrisisConfigChange(oldConfig, { ...DEFAULT_CRISIS_CONFIG });
    await openCrisisConfigModal();
    showToast('已恢复默认配置', 'success');
}

document.getElementById('crisisConfigForm').addEventListener('submit', async e => {
    e.preventDefault();
    const config = {
        assessmentHighScore: parseInt(document.getElementById('ccAssessment').value),
        moodLowDays: parseInt(document.getElementById('ccMoodDays').value),
        moodLowScore: parseInt(document.getElementById('ccMoodScore').value),
        noAppointmentDays: parseInt(document.getElementById('ccNoAppt').value),
        noMoodRecordDays: parseInt(document.getElementById('ccNoMood').value)
    };
    await saveCrisisConfig(config);
    showToast('配置已保存', 'success');
    await renderCrisisConfigLogs();
    await renderDashboard();
});

// 记录危机配置变更日志
async function logCrisisConfigChange(oldConfig, newConfig) {
    const userId = currentUser ? currentUser.id : 'default';
    const logs = await Storage.get('crisisConfigLogs', []);
    logs.push({
        id: 'log_' + Date.now(),
        userId: userId,
        userName: currentUser ? currentUser.name : 'unknown',
        timestamp: new Date().toISOString(),
        oldConfig: oldConfig,
        newConfig: newConfig,
        diff: {
            assessmentHighScore: newConfig.assessmentHighScore !== oldConfig.assessmentHighScore,
            moodLowDays: newConfig.moodLowDays !== oldConfig.moodLowDays,
            moodLowScore: newConfig.moodLowScore !== oldConfig.moodLowScore,
            noAppointmentDays: newConfig.noAppointmentDays !== oldConfig.noAppointmentDays,
            noMoodRecordDays: newConfig.noMoodRecordDays !== oldConfig.noMoodRecordDays
        }
    });
    await Storage.putAll('crisisConfigLogs', logs);
}

function getAppointmentCountdown(date, time) {
    const now = new Date();
    const apptTime = new Date(`${date}T${time}`);
    const diff = apptTime - now;
    if (diff < 0) return null;
    const minutes = Math.floor(diff / 60000);
    if (minutes <= 10) return { text: `${minutes}分钟后`, urgent: true };
    if (minutes <= 60) return { text: `${minutes}分钟后`, urgent: false };
    const hours = Math.floor(minutes / 60);
    return { text: `${hours}小时后`, urgent: false };
}

// 切换工作统计折叠
function toggleWorkStats() {
    const stats = document.getElementById('workStats');
    const toggle = document.getElementById('workStatsToggle');
    if (!stats || !toggle) return;
    if (stats.style.display === 'none') {
        stats.style.display = 'block';
        toggle.textContent = '▴';
    } else {
        stats.style.display = 'none';
        toggle.textContent = '▾';
    }
}

// ===== 治疗阶段引擎 =====
const STAGE_CONFIG = {
    initial: { name: '初始访谈期', countMin: 0, countMax: 3, color: '#F59E0B', icon: '📋', hint: '建议完善主诉、紧急联系人、心理治疗史' },
    assessment: { name: '评估期', countMin: 3, countMax: 5, color: '#3B82F6', icon: '📊', hint: '建议完成基线测评（推荐SAS+SDS）' },
    working: { name: '工作期', countMin: 5, countMax: 999, color: '#22C55E', icon: '💪', hint: '定期复评、关注疗效变化' },
    ending: { name: '结束期', countMin: 0, countMax: 999, color: '#8B5CF6', icon: '🔚', hint: '准备结案评估、效果总结' }
};

function getClientStage(recordCount, expectedCount) {
    if (recordCount <= 3) return 'initial';
    if (recordCount <= 5) return 'assessment';
    if (expectedCount > 0 && recordCount >= expectedCount * 0.8) return 'ending';
    return 'working';
}

async function getClientStageInfo(clientId) {
    const records = await Storage.get('records', []);
    const clientRecords = records.filter(r => r.clientId === clientId);
    const clients = await Storage.get('clients', []);
    const client = clients.find(c => c.id === clientId);
    const stageKey = getClientStage(clientRecords.length, client?.expected || 0);
    return {
        stage: stageKey,
        ...STAGE_CONFIG[stageKey],
        recordCount: clientRecords.length,
        expectedCount: client?.expected || 0,
        progress: clientRecords.length > 0 && client?.expected > 0 ? Math.round(clientRecords.length / client.expected * 100) : 0
    };
}

// ===== 4大高频场景 =====
function showSceneReception() {
    showPage('schedule');
    showScheduleTab('today');
}

function showSceneConsult() {
    openModal('recordModal');
}

function showSceneAssess() {
    showPage('assessments');
}

function showSceneSummary() {
    showPage('workload');
}

// ===== 智能下一步推荐（系统建议）=====
async function renderSystemSuggestions() {
    const container = document.getElementById('systemSuggestions');
    if (!container) return;

    const clients = await Storage.get('clients', []);
    const records = await Storage.get('records', []);
    const assessments = await Storage.get('assessments', []);
    const appointments = await Storage.get('appointments', []);
    const today = formatDate(new Date());

    const suggestions = [];
    const todayAppts = appointments.filter(a => a.date === today && a.status === '待进行');

    for (const client of clients) {
        const stageInfo = await getClientStageInfo(client.id);
        const clientRecords = records.filter(r => r.clientId === client.id);
        const clientAssessments = assessments.filter(a => a.clientId === client.id);

        // 规则1：高风险测评预警
        const highRiskAssess = clientAssessments.find(a => a.level && (a.level.includes('重度') || a.level.includes('高')));
        if (highRiskAssess) {
            suggestions.push({
                priority: 1,
                type: 'danger',
                text: `${client.name} 测评得分 ${highRiskAssess.score} 分（${highRiskAssess.level}），建议评估危机等级`,
                action: () => viewClient(client.id)
            });
        }

        // 规则2：初始访谈期未完成信息
        if (stageInfo.stage === 'initial' && (!client.emergency || !client.problemHistory)) {
            suggestions.push({
                priority: 2,
                type: 'warning',
                text: `${client.name} 处于初始访谈期，建议补充紧急联系人/心理治疗史`,
                action: () => editClient(client.id)
            });
        }

        // 规则3：评估期未做测评
        if (stageInfo.stage === 'assessment' && clientAssessments.length === 0) {
            suggestions.push({
                priority: 3,
                type: 'info',
                text: `${client.name} 处于评估期，建议完成基线测评`,
                action: () => { startAssessment('sas'); }
            });
        }

        // 规则4：工作期未记录情绪超过阈值
        const crisisConfig = await getCrisisConfig();
        if (stageInfo.stage === 'working') {
            const moods = await Storage.get('moods', []);
            const clientMoods = moods.filter(m => m.clientId === client.id).sort((a, b) => b.date.localeCompare(a.date));
            if (clientMoods.length > 0) {
                const lastMoodDate = clientMoods[0].date;
                const daysSinceLastMood = Math.floor((new Date() - new Date(lastMoodDate)) / (1000 * 60 * 60 * 24));
                if (daysSinceLastMood >= crisisConfig.noMoodRecordDays) {
                    suggestions.push({
                        priority: 3,
                        type: 'info',
                        text: `${client.name} 已 ${daysSinceLastMood} 天未记录情绪，建议跟进`,
                        action: () => viewClient(client.id)
                    });
                }
            }
        }

        // 规则5：结束期未做结案评估
        if (stageInfo.stage === 'ending' && !clientAssessments.find(a => a.phase === 'endpoint')) {
            suggestions.push({
                priority: 2,
                type: 'warning',
                text: `${client.name} 已接近结案（${stageInfo.recordCount}/${client.expected}次），建议准备结案评估`,
                action: () => viewClient(client.id)
            });
        }
    }

    // 规则6：今日未完成记录
    const todayRecords = records.filter(r => r.date === today);
    const todayApptClients = todayAppts.map(a => a.clientId);
    const apptsWithoutRecords = todayApptClients.filter(cid => !todayRecords.find(r => r.clientId === cid));
    if (apptsWithoutRecords.length > 0) {
        const names = apptsWithoutRecords.map(cid => {
            const c = clients.find(cl => cl.id === cid);
            return c ? c.name : '未知';
        }).join('、');
        suggestions.push({
            priority: 2,
            type: 'warning',
            text: `今天有 ${apptsWithoutRecords.length} 位来访者尚未更新记录（${names}）`,
            action: () => openModal('recordModal')
        });
    }

    // 规则7：今日待接待提醒
    if (todayAppts.length > 0) {
        const nextAppt = todayAppts.sort((a, b) => a.time.localeCompare(b.time))[0];
        const c = clients.find(cl => cl.id === nextAppt.clientId);
        suggestions.push({
            priority: 3,
            type: 'info',
            text: `今日待接待 ${todayAppts.length} 位来访者，下一位是 ${c ? c.name : '未知'}（${nextAppt.time}）`,
            action: () => showPage('schedule')
        });
    }

    // 排序：priority 越小越优先，相同 priority 按 type（danger > warning > info）
    const typeOrder = { danger: 0, warning: 1, info: 2 };
    suggestions.sort((a, b) => {
        if (a.priority !== b.priority) return a.priority - b.priority;
        return typeOrder[a.type] - typeOrder[b.type];
    });

    if (suggestions.length === 0) {
        container.innerHTML = '<div class="empty-state" style="padding:16px"><div class="empty-state-icon">✨</div><h3>暂无建议，今天一切顺利</h3></div>';
    } else {
        container.innerHTML = suggestions.slice(0, 5).map((s, idx) => {
            const colors = {
                danger: { bg: 'rgba(239,68,68,0.06)', border: 'var(--danger)', dot: '#EF4444' },
                warning: { bg: 'rgba(245,158,11,0.06)', border: 'var(--warning)', dot: '#F59E0B' },
                info: { bg: 'rgba(99,102,241,0.06)', border: 'var(--primary)', dot: '#6366F1' }
            };
            const c = colors[s.type];
            return `<div style="display:flex;align-items:flex-start;gap:10px;padding:12px;margin-bottom:8px;background:${c.bg};border-radius:8px;border-left:3px solid ${c.border};cursor:pointer" onclick="(${s.action}.toString())()">
                <span style="font-size:10px;width:6px;height:6px;border-radius:50%;background:${c.dot};margin-top:6px;flex-shrink:0"></span>
                <span style="font-size:13px;color:var(--text);flex:1">${s.text}</span>
                <span style="font-size:12px;color:${c.border};font-weight:500">→</span>
            </div>`;
        }).join('') + (suggestions.length > 5 ? `<div style="text-align:center;padding:8px;font-size:12px;color:var(--text-muted)">还有 ${suggestions.length - 5} 条建议...</div>` : '');
    }
}

// ===== 新手引导 =====
let onboardingDemoClientId = null;

function startOnboarding() {
    document.getElementById('loginPage').classList.add('hidden');
    document.getElementById('registerPage').classList.add('hidden');
    document.getElementById('app').classList.remove('active');
    document.getElementById('onboardingPage').classList.remove('hidden');
    onboardingNext(1);
}

function onboardingNext(step) {
    for (let i = 1; i <= 4; i++) {
        const el = document.getElementById('onboardingStep' + i);
        if (el) el.classList.toggle('hidden', i !== step);
    }
}

function onboardingSkip() {
    onboardingExit(true);
}

async function onboardingCreateClient() {
    const name = document.getElementById('onboardClientName').value || '演示来访者';
    const gender = document.getElementById('onboardClientGender').value;
    const age = document.getElementById('onboardClientAge').value;
    const issues = document.getElementById('onboardClientIssues').value;

    const client = {
        id: 'onboard_' + Date.now(),
        name: name,
        gender: gender,
        age: parseInt(age) || 30,
        issues: issues,
        contact: '',
        emergencyContact: '',
        notes: '由新手引导创建',
        tags: ['引导演示'],
        createdBy: currentUser ? currentUser.id : 'demo',
        createdAt: new Date().toISOString()
    };

    const clients = await Storage.get('clients', []);
    clients.push(client);
    await Storage.putAll('clients', clients);
    onboardingDemoClientId = client.id;

    onboardingNext(3);
}

async function onboardingCreateRecord() {
    if (!onboardingDemoClientId) {
        onboardingNext(4);
        return;
    }

    const sub = document.getElementById('onboardRecordSub').value;
    const ass = document.getElementById('onboardRecordAss').value;

    const record = {
        id: 'onboard_record_' + Date.now(),
        clientId: onboardingDemoClientId,
        date: formatDate(new Date()),
        session: 1,
        duration: 50,
        subContent: sub,
        objBehavior: '来访者表达清晰，配合度良好',
        insight: ass,
        nextFocus: '继续探索工作压力源',
        methods: '认知行为疗法',
        risk: '低',
        suds: 5,
        counselorRating: 4,
        createdBy: currentUser ? currentUser.id : 'demo',
        createdAt: new Date().toISOString()
    };

    const records = await Storage.get('records', []);
    records.push(record);
    await Storage.putAll('records', records);

    onboardingNext(4);
}

async function onboardingExit(clearDemo) {
    const userId = currentUser ? currentUser.id : 'default';
    const guideKey = 'hasCompletedGuide_' + userId;
    localStorage.setItem(guideKey, 'true');

    if (clearDemo && onboardingDemoClientId) {
        // 清除演示数据
        let clients = await Storage.get('clients', []);
        clients = clients.filter(c => c.id !== onboardingDemoClientId);
        await Storage.putAll('clients', clients);

        let records = await Storage.get('records', []);
        records = records.filter(r => r.clientId !== onboardingDemoClientId);
        await Storage.putAll('records', records);
    }

    document.getElementById('onboardingPage').classList.add('hidden');
    document.getElementById('app').classList.add('active');
    await showMainApp();
}

// ===== 功能引导提示（第二层引导） =====
function showFeatureGuide(icon, text, featureKey) {
    if (localStorage.getItem('guide_' + featureKey) === '1') return;
    document.getElementById('featureGuideIcon').textContent = icon;
    document.getElementById('featureGuideText').innerHTML = text;
    document.getElementById('featureGuide').style.display = 'block';
    localStorage.setItem('guide_' + featureKey, '1');
}

function closeFeatureGuide() {
    document.getElementById('featureGuide').style.display = 'none';
}

// ===== 情感化欢迎语 =====
function updateDashboardGreeting() {
    const greetingEl = document.getElementById('dashboardGreeting');
    if (!greetingEl) return;
    const hour = new Date().getHours();
    let greeting = '';
    let emoji = '';
    if (hour < 6) { greeting = '夜深了，注意休息'; emoji = '🌙'; }
    else if (hour < 12) { greeting = '早安'; emoji = '☀️'; }
    else if (hour < 14) { greeting = '中午好'; emoji = '🌤️'; }
    else if (hour < 18) { greeting = '下午好'; emoji = '⛅'; }
    else if (hour < 22) { greeting = '晚上好'; emoji = '🌆'; }
    else { greeting = '夜深了，记得早点休息'; emoji = '🌙'; }

    const name = (currentUser && currentUser.name) ? currentUser.name : '咨询师';
    const encouragements = [
        '今天也要照顾好自己 💙',
        '您的用心，来访者会感受到的',
        '每一个来访者都是一份信任',
        '专业且温暖，是您一直的坚持',
        '记得劳逸结合，照顾好自己'
    ];
    const randomEnc = encouragements[Math.floor(Math.random() * encouragements.length)];

    greetingEl.innerHTML = `<span style="font-size:18px">${emoji}</span> <span style="font-weight:600">${greeting}，${name}</span> <span style="color:var(--text-muted);font-weight:400;margin-left:8px">${randomEnc}</span>`;
}

// ===== 每日情感化鼓励（每天最多1条）=====
function showDailyEncouragement() {
    try {
        const userId = currentUser ? currentUser.id : 'default';
        const today = formatDate(new Date());
        const dailyKey = 'dailyEncouragement_' + userId + '_' + today;
        if (sessionStorage.getItem(dailyKey)) return;
        sessionStorage.setItem(dailyKey, '1');

        const tips = [
            { icon: '💡', text: '小贴士：使用 Ctrl+K 可快速打开搜索' },
            { icon: '🌟', text: '今天可以尝试为一位来访者写一份阶段总结' },
            { icon: '⏰', text: '记得检查今日日程，提前与来访者确认时间' },
            { icon: '💙', text: '别忘了，工作之余也要给自己一些时间' },
            { icon: '📈', text: '疗效跟踪能帮助您看到咨询的实际效果' },
            { icon: '🔔', text: '"需要关注"列表帮您及时发现异常情况' },
            { icon: '✨', text: '一句鼓励的话，可能成为来访者前行的力量' }
        ];
        const tip = tips[Math.floor(Math.random() * tips.length)];

        const toast = document.createElement('div');
        toast.style.cssText = 'position:fixed;top:80px;right:24px;background:var(--bg-card);padding:14px 20px;border-radius:12px;box-shadow:0 6px 24px rgba(99,102,241,0.15);border-left:4px solid var(--primary);z-index:10000;display:flex;align-items:center;gap:10px;max-width:340px;animation:slideInRight 0.4s ease';
        toast.innerHTML = `<span style="font-size:20px">${tip.icon}</span><span style="font-size:14px;color:var(--text)">${tip.text}</span><span style="margin-left:8px;cursor:pointer;color:var(--text-muted);font-size:18px" onclick="this.parentElement.remove()">×</span>`;
        document.body.appendChild(toast);
        setTimeout(() => { if (toast.parentElement) toast.remove(); }, 6000);
    } catch (e) {
        console.warn('每日鼓励展示失败', e);
    }
}

// ===== 构建需要关注列表（按紧急程度排序）=====
async function buildAttentionList(clients, records, assessments, moods, appointments) {
    const list = [];
    const crisisConfig = await getCrisisConfig();

    for (const client of clients) {
        const clientRecords = records.filter(r => r.clientId === client.id).sort((a, b) => b.date.localeCompare(a.date));
        const clientAssessments = assessments.filter(a => a.clientId === client.id).sort((a, b) => b.date.localeCompare(a.date));
        const clientMoods = moods.filter(m => m.clientId === client.id).sort((a, b) => b.date.localeCompare(a.date));
        const clientAppts = appointments.filter(a => a.clientId === client.id && a.status === '已完成').sort((a, b) => b.date.localeCompare(a.date));

        let reason = '';
        let type = ''; // high_risk | mood_abnormal | dropout
        let bgColor = 'rgba(239,68,68,0.05)';
        let borderColor = 'var(--danger)';
        let icon = '🔴';

        // 1. 高风险检测
        const lastAssess = clientAssessments[0];
        if (lastAssess && lastAssess.level && (lastAssess.level.includes('重度') || lastAssess.level.includes('高'))) {
            reason = `${standardAssessments[lastAssess.type]?.name?.split(' ')[0] || lastAssess.type}评分${lastAssess.score}分（${lastAssess.level}）`;
            type = 'high_risk';
            bgColor = 'rgba(239,68,68,0.05)';
            borderColor = 'var(--danger)';
            icon = '🔴';
        } else if (lastAssess && lastAssess.redFlags && lastAssess.redFlags.length > 0) {
            reason = `检测到红旗题项：${lastAssess.redFlags[0].substring(0, 20)}...`;
            type = 'high_risk';
            bgColor = 'rgba(239,68,68,0.05)';
            borderColor = 'var(--danger)';
            icon = '🔴';
        }

        // 2. 情绪异常检测（连续低分）
        if (!type && clientMoods.length >= 3) {
            const recentMoods = clientMoods.slice(0, 7);
            if (recentMoods.length >= crisisConfig.moodLowDays) {
                const lowDays = recentMoods.slice(0, crisisConfig.moodLowDays).filter(m => (m.score || 3) <= crisisConfig.moodLowScore).length;
                if (lowDays >= crisisConfig.moodLowDays) {
                    reason = `近${crisisConfig.moodLowDays}天情绪持续低落（${lowDays}/${crisisConfig.moodLowDays}天）`;
                    type = 'mood_abnormal';
                    bgColor = 'rgba(245,158,11,0.05)';
                    borderColor = 'var(--warning)';
                    icon = '🟠';
                }
            }
        }

        // 3. 脱落预警（超过N天未预约或未记录）
        if (!type && clientRecords.length > 0) {
            const lastRecordDate = new Date(clientRecords[0].date);
            const daysSince = Math.floor((new Date() - lastRecordDate) / (24 * 60 * 60 * 1000));
            if (daysSince >= crisisConfig.noAppointmentDays) {
                reason = `已${daysSince}天未咨询，建议主动跟进`;
                type = 'dropout';
                bgColor = 'rgba(91,110,232,0.05)';
                borderColor = 'var(--info)';
                icon = '🔵';
            }
        }

        if (type) {
            list.push({
                id: client.id,
                name: client.name,
                reason: reason,
                type: type,
                bgColor: bgColor,
                borderColor: borderColor,
                icon: icon,
                action: `viewClient('${client.id}')`
            });
        }
    }

    // 按紧急程度排序：高风险 > 情绪异常 > 脱落预警
    const priorityMap = { 'high_risk': 0, 'mood_abnormal': 1, 'dropout': 2 };
    list.sort((a, b) => priorityMap[a.type] - priorityMap[b.type]);
    return list;
}

// ===== 预约提醒机制 =====
function requestNotificationPermission() {
    if ('Notification' in window) {
        Notification.requestPermission().then(permission => {
            notificationPermission = permission === 'granted';
        });
    }
}

function startAppointmentReminder() {
    if (appointmentReminderInterval) clearInterval(appointmentReminderInterval);
    
    appointmentReminderInterval = setInterval(async () => {
        const appointments = await Storage.get('appointments', []);
        const now = new Date();
        const today = formatDate(now);
        
        for (const appt of appointments) {
            if (appt.date !== today || appt.status === '已取消' || appt.status === '已完成') continue;
            
            const apptTime = new Date(`${appt.date}T${appt.time}`);
            const diff = apptTime - now;
            const minutes = Math.floor(diff / 60000);
            
            // 10分钟前提醒
            if (minutes >= 9 && minutes <= 11 && !appt.reminded) {
                const clients = await Storage.get('clients', []);
                const c = clients.find(x => x.id === appt.clientId);
                
                if (notificationPermission) {
                    new Notification('预约提醒', {
                        body: `${c ? c.name : '来访者'}的咨询将在10分钟后开始`,
                        icon: '🧠'
                    });
                }
                
                // 更新预约状态
                appt.reminded = true;
                await Storage.putOne('appointments', appt);
                
                // 刷新工作台
                if (document.getElementById('dashboard').classList.contains('active')) {
                    await renderDashboard();
                }
            }
        }
    }, 60000); // 每分钟检查一次
}

let consultationTimer = null;
let consultationStart = null;
let currentAppointmentId = null;

async function startConsultation(apptId) {
    const appointments = await Storage.get('appointments', []);
    const appt = appointments.find(a => a.id === apptId);
    if (!appt) return;
    
    const clients = await Storage.get('clients', []);
    const client = clients.find(c => c.id === appt.clientId);
    
    // 显示咨询准备面板
    showConsultationPrep(appt, client);
}

async function showConsultationPrep(appt, client) {
    const records = await Storage.get('records', []);
    const assessments = await Storage.get('assessments', []);
    const moods = await Storage.get('moods', []);
    
    const clientRecords = records.filter(r => r.clientId === client.id).sort((a,b) => b.date.localeCompare(a.date));
    const clientAssessments = assessments.filter(a => a.clientId === client.id).sort((a,b) => b.date.localeCompare(a.date));
    const clientMoods = moods.filter(m => m.clientId === client.id).sort((a,b) => b.date.localeCompare(a.date));
    
    const lastRecord = clientRecords[0];
    const lastAssessment = clientAssessments[0];
    const recentMoods = clientMoods.slice(0, 7);
    
    const riskPoints = [];
    if (lastAssessment && (lastAssessment.level.includes('重度') || lastAssessment.level.includes('高'))) {
        riskPoints.push({ type: 'high', text: `${standardAssessments[lastAssessment.type]?.name?.split(' ')[0] || lastAssessment.type}评分显示高风险` });
    }
    if (lastAssessment && lastAssessment.redFlags && lastAssessment.redFlags.length > 0) {
        riskPoints.push({ type: 'warning', text: '存在红旗题项' });
    }
    if (recentMoods.length > 0) {
        const avgMood = recentMoods.reduce((sum, m) => sum + (m.score || 0), 0) / recentMoods.length;
        if (avgMood <= 2) {
            riskPoints.push({ type: 'warning', text: '近一周情绪较低落' });
        }
    }
    
    const keyPoints = [];
    if (lastRecord) {
        if (lastRecord.subContent) keyPoints.push(lastRecord.subContent.substring(0, 50) + '...');
        if (lastRecord.nextFocus) keyPoints.push('下次关注：' + lastRecord.nextFocus);
    }
    
    const recommendations = [];
    if (lastAssessment && lastAssessment.type === 'sas') {
        recommendations.push('可考虑使用放松训练技术');
    }
    if (lastAssessment && lastAssessment.type === 'sds') {
        recommendations.push('可考虑认知行为疗法(CBT)');
    }
    if (clientRecords.length >= 3) {
        recommendations.push('可评估咨询进展，调整目标');
    }
    
    const html = `
        <div class="card" style="max-width:800px;margin:0 auto">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">
                <h2 style="font-size:18px">🤖 智能咨询准备</h2>
                <button class="btn btn-sm btn-secondary" onclick="hideConsultationPrep()">关闭</button>
            </div>
            
            <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-bottom:20px">
                <div style="padding:16px;background:linear-gradient(135deg,rgba(91,110,232,0.05),rgba(91,110,232,0.1));border-radius:12px">
                    <div style="font-size:24px;font-weight:700;color:var(--primary)">${client.name}</div>
                    <div style="font-size:12px;color:var(--text-muted);margin-top:4px">${client.gender || ''} · ${client.age || ''}岁</div>
                    <div style="font-size:12px;color:var(--text-muted)">第 ${clientRecords.length + 1} 次咨询</div>
                </div>
                <div style="padding:16px;background:linear-gradient(135deg,rgba(34,197,94,0.05),rgba(34,197,94,0.1));border-radius:12px">
                    <div style="font-size:12px;color:var(--text-muted)">最近测评</div>
                    <div style="font-size:18px;font-weight:600;color:var(--success)">${lastAssessment ? (standardAssessments[lastAssessment.type]?.name?.split(' ')[0] || lastAssessment.type) : '暂无'}</div>
                    <div style="font-size:14px;margin-top:4px">得分：${lastAssessment ? lastAssessment.score : '-'} · ${lastAssessment ? lastAssessment.level : '-'}</div>
                </div>
                <div style="padding:16px;background:linear-gradient(135deg,rgba(245,158,11,0.05),rgba(245,158,11,0.1));border-radius:12px">
                    <div style="font-size:12px;color:var(--text-muted)">最近情绪</div>
                    <div style="font-size:24px;font-weight:700;color:var(--warning)">
                        ${recentMoods.length > 0 ? recentMoods[0].score : '-'}
                    </div>
                    <div style="font-size:12px;color:var(--text-muted);margin-top:4px">${recentMoods.length > 0 ? recentMoods[0].date : '暂无记录'}</div>
                </div>
            </div>
            
            ${riskPoints.length > 0 ? `
                <div style="margin-bottom:20px;padding:16px;background:rgba(239,68,68,0.05);border-radius:12px;border:1px solid rgba(239,68,68,0.1)">
                    <div style="font-weight:600;color:var(--danger);margin-bottom:8px">⚠️ 需关注指标</div>
                    <ul style="margin:0;padding-left:20px">
                        ${riskPoints.map(p => `<li>${p.text}</li>`).join('')}
                    </ul>
                </div>
            ` : ''}
            
            ${keyPoints.length > 0 ? `
                <div style="margin-bottom:20px;padding:16px;background:rgba(91,110,232,0.05);border-radius:12px">
                    <div style="font-weight:600;color:var(--primary);margin-bottom:8px">📋 上次咨询要点</div>
                    <ul style="margin:0;padding-left:20px">
                        ${keyPoints.map(kp => `<li>${kp}</li>`).join('')}
                    </ul>
                </div>
            ` : ''}
            
            ${recommendations.length > 0 ? `
                <div style="margin-bottom:20px;padding:16px;background:rgba(34,197,94,0.05);border-radius:12px">
                    <div style="font-weight:600;color:var(--success);margin-bottom:8px">💡 推荐干预策略</div>
                    <ul style="margin:0;padding-left:20px">
                        ${recommendations.map(r => `<li>${r}</li>`).join('')}
                    </ul>
                </div>
            ` : ''}
            
            <div style="display:flex;justify-content:center;gap:12px">
                <button class="btn btn-primary" onclick="beginConsultation('${appt.id}')">开始咨询</button>
                <button class="btn btn-secondary" onclick="hideConsultationPrep()">稍后开始</button>
            </div>
        </div>
    `;
    
    let modal = document.getElementById('consultationPrepModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'consultationPrepModal';
        modal.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:1000;padding:20px';
        document.body.appendChild(modal);
    }
    modal.innerHTML = html;
    modal.style.display = 'flex';
}

function hideConsultationPrep() {
    const modal = document.getElementById('consultationPrepModal');
    if (modal) modal.style.display = 'none';
}

async function beginConsultation(apptId) {
    const appointments = await Storage.get('appointments', []);
    const appt = appointments.find(a => a.id === apptId);
    if (!appt) return;
    
    appt.status = '进行中';
    appt.startTime = new Date().toISOString();
    await Storage.putOne('appointments', appt);
    
    currentAppointmentId = apptId;
    consultationStart = new Date(appt.startTime);
    
    hideConsultationPrep();
    
    startConsultationTimer();
    showConsultationBar(appt);
    
    await db.logOperation('start', 'appointment', apptId);
    await renderDashboard();
    await refreshScheduleViews();
}

function startConsultationTimer() {
    if (consultationTimer) clearInterval(consultationTimer);
    consultationTimer = setInterval(updateConsultationTimer, 1000);
    updateConsultationTimer();
}

function updateConsultationTimer() {
    const bar = document.getElementById('consultationBar');
    if (!bar || !consultationStart) return;
    
    const now = new Date();
    const diff = Math.floor((now - consultationStart) / 1000);
    const h = Math.floor(diff / 3600);
    const m = Math.floor((diff % 3600) / 60);
    const s = diff % 60;
    const timeStr = `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
    
    const timerEl = document.getElementById('consultationTimer');
    if (timerEl) timerEl.textContent = timeStr;
}

function showConsultationBar(appt) {
    let bar = document.getElementById('consultationBar');
    if (!bar) {
        bar = document.createElement('div');
        bar.id = 'consultationBar';
        bar.style.cssText = 'background:linear-gradient(90deg,var(--warning),var(--primary-light));color:white;padding:10px 24px;display:flex;align-items:center;justify-content:space-between;font-size:14px;box-shadow:var(--shadow);z-index:100';
        document.querySelector('.main-content').insertBefore(bar, document.querySelector('.content'));
    }
    
    Storage.get('clients', []).then(clients => {
        const c = clients.find(x => x.id === appt.clientId);
        bar.innerHTML = `
            <div style="display:flex;align-items:center;gap:12px">
                <span style="font-size:18px">⏱️</span>
                <span><strong>${c ? c.name : '咨询中'}</strong> · ${appt.type} · 已进行 <strong id="consultationTimer">00:00:00</strong></span>
                <span id="emotionIndicator" style="display:none;margin-left:8px">😊 平静</span>
                <span id="silenceAlert" style="display:none;margin-left:8px;color:#fbbf24">⚠️ 沉默30秒</span>
            </div>
            <div style="display:flex;gap:8px">
                <button class="btn btn-sm" style="background:rgba(255,255,255,0.2);color:white;border:none" onclick="quickNote()">📝 快速笔记</button>
                <button class="btn btn-sm" style="background:rgba(255,255,255,0.2);color:white;border:none" onclick="showRealTimeMonitor()">🔍 监测</button>
                <button class="btn btn-sm" style="background:white;color:var(--warning);border:none;font-weight:600" onclick="endConsultation()">结束咨询</button>
            </div>`;
    });
    
    startRealTimeMonitoring();
}

let realTimeMonitorTimer = null;
let silenceCounter = 0;

function startRealTimeMonitoring() {
    if (realTimeMonitorTimer) clearInterval(realTimeMonitorTimer);
    silenceCounter = 0;
    
    realTimeMonitorTimer = setInterval(() => {
        silenceCounter++;
        
        const silenceAlert = document.getElementById('silenceAlert');
        if (silenceAlert) {
            if (silenceCounter >= 30) {
                silenceAlert.style.display = 'inline-block';
            } else {
                silenceAlert.style.display = 'none';
            }
        }
    }, 1000);
}

function stopRealTimeMonitoring() {
    if (realTimeMonitorTimer) {
        clearInterval(realTimeMonitorTimer);
        realTimeMonitorTimer = null;
    }
}

function showRealTimeMonitor() {
    const html = `
        <div class="card" style="max-width:600px;margin:0 auto">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">
                <h2 style="font-size:18px">🔍 咨询实时监测</h2>
                <button class="btn btn-sm btn-secondary" onclick="hideRealTimeMonitor()">关闭</button>
            </div>
            
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:20px">
                <div style="padding:16px;background:rgba(34,197,94,0.05);border-radius:12px;text-align:center">
                    <div style="font-size:24px">😊</div>
                    <div style="font-size:14px;color:var(--text-muted);margin-top:4px">情绪状态</div>
                    <div style="font-weight:600;color:var(--success)">平静</div>
                </div>
                <div style="padding:16px;background:rgba(245,158,11,0.05);border-radius:12px;text-align:center">
                    <div style="font-size:24px">⏱️</div>
                    <div style="font-size:14px;color:var(--text-muted);margin-top:4px">沉默时长</div>
                    <div style="font-weight:600;color:var(--warning)" id="monitorSilenceTime">0秒</div>
                </div>
            </div>
            
            <div style="margin-bottom:20px;padding:16px;background:rgba(91,110,232,0.05);border-radius:12px">
                <div style="font-weight:600;color:var(--primary);margin-bottom:8px">📝 关键要点记录</div>
                <textarea id="realTimeNotes" style="width:100%;height:100px;padding:10px;border:1px solid var(--border);border-radius:8px;font-size:14px" placeholder="记录咨询中的关键要点..."></textarea>
            </div>
            
            <div style="margin-bottom:20px;padding:16px;background:rgba(239,68,68,0.05);border-radius:12px">
                <div style="font-weight:600;color:var(--danger);margin-bottom:8px">⚠️ 危机信号监测</div>
                <div style="font-size:14px;color:var(--text-muted)">系统正在监测对话中的危机信号...</div>
                <div style="margin-top:8px;padding:8px;background:white;border-radius:8px;font-size:12px">
                    监测关键词：自杀、想死、活不下去、伤害自己
                </div>
            </div>
            
            <div style="display:flex;justify-content:flex-end;gap:12px">
                <button class="btn btn-primary" onclick="saveRealTimeNotes()">保存笔记</button>
                <button class="btn btn-secondary" onclick="hideRealTimeMonitor()">关闭</button>
            </div>
        </div>
    `;
    
    let modal = document.getElementById('realTimeMonitorModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'realTimeMonitorModal';
        modal.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:1000;padding:20px';
        document.body.appendChild(modal);
    }
    modal.innerHTML = html;
    modal.style.display = 'flex';
    
    updateMonitorSilenceTime();
}

function updateMonitorSilenceTime() {
    const timer = setInterval(() => {
        const el = document.getElementById('monitorSilenceTime');
        if (!el) {
            clearInterval(timer);
            return;
        }
        el.textContent = `${silenceCounter}秒`;
    }, 1000);
}

function hideRealTimeMonitor() {
    const modal = document.getElementById('realTimeMonitorModal');
    if (modal) modal.style.display = 'none';
}

function saveRealTimeNotes() {
    const notes = document.getElementById('realTimeNotes')?.value || '';
    if (notes && notes.trim()) {
        if (!window.quickNotes) window.quickNotes = [];
        const timeStr = formatTime(new Date());
        window.quickNotes.push(`[${timeStr}] ${notes.trim()}`);
        alert('已保存，咨询结束后会自动附加到记录中');
        hideRealTimeMonitor();
    } else {
        alert('请输入笔记内容');
    }
}

function hideConsultationBar() {
    const bar = document.getElementById('consultationBar');
    if (bar) bar.remove();
    stopRealTimeMonitoring();
    if (consultationTimer) {
        clearInterval(consultationTimer);
        consultationTimer = null;
    }
    consultationStart = null;
    currentAppointmentId = null;
}

async function quickNote() {
    const note = prompt('快速笔记（会自动附加到本次记录中）：');
    if (note && note.trim()) {
        if (!window.quickNotes) window.quickNotes = [];
        const timeStr = formatTime(new Date());
        window.quickNotes.push(`[${timeStr}] ${note.trim()}`);
        alert('已保存，咨询结束后会自动附加到记录中');
    }
}

async function endConsultation() {
    if (!currentAppointmentId) return;
    if (!confirm('确定结束本次咨询？结束后将进入记录填写。')) return;
    
    const appointments = await Storage.get('appointments', []);
    const appt = appointments.find(a => a.id === currentAppointmentId);
    if (!appt) return;
    
    appt.status = '已完成';
    appt.endTime = new Date().toISOString();
    appt.duration = Math.round((new Date(appt.endTime) - new Date(appt.startTime)) / 60000);
    await Storage.putOne('appointments', appt);
    
    hideConsultationBar();
    
    const records = await Storage.get('records', []);
    const clientRecords = records.filter(r => r.clientId === appt.clientId);
    
    // 生成AI辅助SOAP初稿
    const soapDraft = generateSOAPDraft(appt, clientRecords);
    
    await openModal('recordModal');
    document.getElementById('rClient').value = appt.clientId;
    document.getElementById('rDate').value = appt.date;
    
    document.getElementById('rSession').value = clientRecords.length + 1;
    if (appt.duration) document.getElementById('rDuration').value = appt.duration;
    
    // 填充AI生成的SOAP内容
    if (soapDraft) {
        if (soapDraft.subContent) document.getElementById('rSubContent').value = soapDraft.subContent;
        if (soapDraft.subFeeling) document.getElementById('rSubFeeling').value = soapDraft.subFeeling;
        if (soapDraft.objBehavior) document.getElementById('rObjBehavior').value = soapDraft.objBehavior;
        if (soapDraft.insight) document.getElementById('rInsight').value = soapDraft.insight;
        if (soapDraft.nextFocus) document.getElementById('rNextFocus').value = soapDraft.nextFocus;
    }
    
    if (window.quickNotes && window.quickNotes.length > 0) {
        const homeworkInput = document.getElementById('rHomework');
        if (homeworkInput) {
            homeworkInput.value = '【咨询中快速笔记】\n' + window.quickNotes.join('\n') + '\n\n' + (homeworkInput.value || '');
        }
        window.quickNotes = [];
    }
    
    if (clientRecords.length > 0) {
        lastRecordData = clientRecords.sort((a,b)=>b.date.localeCompare(a.date))[0];
    }
    
    await db.logOperation('end', 'appointment', currentAppointmentId, { duration: appt.duration });
    await renderDashboard();
}

function generateSOAPDraft(appt, clientRecords) {
    const lastRecord = clientRecords.length > 0 ? clientRecords[clientRecords.length - 1] : null;
    
    let draft = {};
    
    if (lastRecord) {
        draft.subContent = `本次咨询继续讨论${lastRecord.subContent ? '上次的话题' : '来访者的情况'}，来访者表达了`;
        draft.subFeeling = '平静';
        draft.objBehavior = '来访者情绪稳定，沟通顺畅';
        
        if (lastRecord.risk === '高风险') {
            draft.insight = '需要继续关注风险情况，确保来访者安全';
        } else {
            draft.insight = '来访者正在逐步进步，继续保持当前干预方案';
        }
        
        if (lastRecord.nextFocus) {
            draft.nextFocus = `继续${lastRecord.nextFocus}，评估进展情况`;
        } else {
            draft.nextFocus = '评估咨询进展，调整后续计划';
        }
    } else {
        draft.subContent = '首次咨询，来访者介绍了自己的基本情况和主要困扰';
        draft.subFeeling = '平静';
        draft.objBehavior = '来访者初次接触，表现出一定的紧张，但配合度良好';
        draft.insight = '初步了解来访者情况，需要进一步评估';
        draft.nextFocus = '进行全面测评，制定咨询计划';
    }
    
    return draft;
}

async function completeAppointment(id) {
    // 从预约列表点击"完成"时，也走同样流程
    currentAppointmentId = id;
    await endConsultation();
}

async function refreshScheduleViews() {
    const tabs = ['today', 'week', 'all'];
    for (const tab of tabs) {
        const panel = document.getElementById('schedule' + tab.charAt(0).toUpperCase() + tab.slice(1));
        if (panel && panel.classList.contains('active')) {
            await renderSchedule(tab);
        }
    }
    // 刷新今日日程
    if (typeof renderTodaySchedule === 'function') await renderTodaySchedule();
}

async function resumeActiveConsultation() {
    const appointments = await Storage.get('appointments', []);
    const active = appointments.find(a => a.status === '进行中');
    if (active && active.startTime) {
        currentAppointmentId = active.id;
        consultationStart = new Date(active.startTime);
        showConsultationBar(active);
        startConsultationTimer();
    }
}

// ===== 来访者档案 =====
async function renderClients() {
    const clients = await Storage.get('clients', []);
    const tbody = document.getElementById('clientsTable');
    
    if (clients.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="empty-state"><div class="empty-state-icon">👥</div><h3>暂无来访者档案</h3></td></tr>';
        return;
    }
    
    tbody.innerHTML = clients.map(c => {
        const riskClass = c.risk === '紧急' ? 'risk-urgent' : c.risk === '高' ? 'risk-high' : c.risk === '中' ? 'risk-medium' : 'risk-low';
        const problemShort = c.problem.length > 24 ? c.problem.substring(0,24)+'...' : c.problem;
        return `<tr>
            <td><strong>${c.name}</strong></td>
            <td>${c.gender}</td>
            <td>${c.age || '-'}</td>
            <td>${problemShort}</td>
            <td class="${riskClass}">${c.risk}</td>
            <td><span class="badge badge-primary">${c.status}</span></td>
            <td class="actions">
                <button class="btn btn-sm btn-secondary" onclick="viewClient('${c.id}')">查看</button>
                <button class="btn btn-sm btn-primary" onclick="editClient('${c.id}')">编辑</button>
            </td>
        </tr>`;
    }).join('');
}

async function viewClient(id) {
    const clients = await Storage.get('clients', []);
    const c = clients.find(x => x.id === id);
    if (!c) return;
    
    const records = await Storage.get('records', []);
    const clientRecords = records.filter(r => r.clientId === id).sort((a,b)=>b.date.localeCompare(a.date));
    
    const assessments = await Storage.get('assessments', []);
    const clientAssessments = assessments.filter(a => a.clientId === id).sort((a,b)=>b.date.localeCompare(a.date));
    
    const moods = await Storage.get('moods', []);
    const clientMoods = moods.filter(m => m.clientId === id).sort((a,b)=>a.date.localeCompare(b.date));
    
    const appointments = await Storage.get('appointments', []);
    const clientAppts = appointments.filter(a => a.clientId === id).sort((a,b)=>(b.date+' '+b.time).localeCompare(a.date+' '+a.time));
    
    // 记录查看日志
    await db.logOperation('view', 'client', id);
    
    const goalPct = Math.min(100, Math.round((clientRecords.length / (c.expected || 8)) * 100));
    const lastRecord = clientRecords[0];
    const nextAppt = clientAppts.find(a => a.status === '待进行');
    
    let html = `<div style="margin-bottom:16px;display:flex;justify-content:space-between;align-items:center">
        <div>
            <h2 style="font-size:20px">${c.name} 
                <span class="badge ${c.riskLevel === '高风险' ? 'badge-danger' : c.riskLevel === '中风险' ? 'badge-warning' : 'badge-success'}" style="margin-left:8px">${c.riskLevel || '低风险'}</span>
            </h2>
            <p style="color:var(--text-muted);font-size:13px;margin-top:4px">${c.gender || ''} ${c.age ? c.age+'岁' : ''} · ${c.problem ? c.problem.substring(0,30) : '暂无主诉'}</p>
        </div>
        <div style="display:flex;gap:8px">
            <button class="btn btn-sm btn-secondary" onclick="editClient('${c.id}')">编辑</button>
            <button class="btn btn-sm btn-primary" onclick="openRecordForClient('${c.id}')">写记录</button>
        </div>
    </div>`;
    
    // Tab导航
    html += `<div class="tab-bar-horizontal" style="display:flex;gap:4px;border-bottom:2px solid var(--border);margin-bottom:16px;overflow-x:auto">
        <div class="tab-h active" onclick="switchClientTab('overview')" id="ctab-overview">📋 概览</div>
        <div class="tab-h" onclick="switchClientTab('basic')" id="ctab-basic">基本信息</div>
        <div class="tab-h" onclick="switchClientTab('assess')" id="ctab-assess">测评 (${clientAssessments.length})</div>
        <div class="tab-h" onclick="switchClientTab('records')" id="ctab-records">记录 (${clientRecords.length})</div>
        <div class="tab-h" onclick="switchClientTab('appt')" id="ctab-appt">预约 (${clientAppts.length})</div>
        <div class="tab-h" onclick="switchClientTab('mood')" id="ctab-mood">情绪 (${clientMoods.length})</div>
    </div>`;
    
    // 概览Tab - 最关键的5条信息
    html += `<div class="ctab-content" id="ctabContent-overview">
        <div class="overview-grid">
            <div class="overview-card">
                <div class="overview-header"><h3>📌 上次咨询</h3></div>`;
    if (lastRecord) {
        html += `<div class="overview-item"><span class="overview-item-label">日期</span><span class="overview-item-value">${lastRecord.date}</span></div>
                <div class="overview-item"><span class="overview-item-label">主题</span><span class="overview-item-value" style="max-width:60%">${(lastRecord.subContent||'').substring(0,40)}</span></div>
                <div class="overview-item"><span class="overview-item-label">进展</span><span class="overview-item-value">${lastRecord.progress || '-'}</span></div>
                <div class="overview-item"><span class="overview-item-label">风险</span><span class="overview-item-value">${lastRecord.risk || '-'}</span></div>
                <div class="overview-item"><span class="overview-item-label">下次重点</span><span class="overview-item-value" style="max-width:60%">${(lastRecord.nextFocus||'').substring(0,40)}</span></div>`;
    } else {
        html += '<p style="color:var(--text-muted)">暂无咨询记录</p>';
    }
    html += `</div>
            <div class="overview-card">
                <div class="overview-header"><h3>📅 下次预约</h3></div>`;
    if (nextAppt) {
        const countdown = getAppointmentCountdown(nextAppt.date, nextAppt.time);
        html += `<div class="overview-item"><span class="overview-item-label">时间</span><span class="overview-item-value">${nextAppt.date} ${nextAppt.time}</span></div>
                <div class="overview-item"><span class="overview-item-label">类型</span><span class="overview-item-value">${nextAppt.type}</span></div>
                <div class="overview-item"><span class="overview-item-label">倒计时</span><span class="overview-item-value" style="color:var(--primary)">${countdown ? countdown.text : '已过'}</span></div>`;
    } else {
        html += '<p style="color:var(--text-muted)">暂无待进行预约</p>';
    }
    html += `</div>
        </div>
        
        <div class="overview-grid" style="margin-top:16px">
            <div class="overview-card">
                <div class="overview-header"><h3>🎯 咨询目标</h3></div>
                <div class="overview-item"><span class="overview-item-label">目标</span><span class="overview-item-value">${c.goal || '-'}</span></div>
                <div class="goal-tracker">
                    <div class="goal-header"><span class="goal-title">达成进度</span><span class="goal-progress">${clientRecords.length} / ${c.expected || 8} 次 (${goalPct}%)</span></div>
                    <div class="goal-bar"><div class="goal-fill" style="width:${goalPct}%"></div></div>
                </div>
            </div>
            <div class="overview-card">
                <div class="overview-header"><h3>📊 最新测评</h3></div>`;
    if (clientAssessments.length > 0) {
        const latest = clientAssessments[0];
        const typeNames = { sas: 'SAS焦虑', sds: 'SDS抑郁', sleep: '睡眠质量' };
        const color = latest.level.includes('重度') || latest.level.includes('高') ? 'var(--danger)' : latest.level.includes('中度') || latest.level.includes('中') ? 'var(--warning)' : 'var(--success)';
        html += `<div class="overview-item"><span class="overview-item-label">量表</span><span class="overview-item-value">${typeNames[latest.type] || latest.type}</span></div>
                <div class="overview-item"><span class="overview-item-label">日期</span><span class="overview-item-value">${latest.date}</span></div>
                <div class="overview-item"><span class="overview-item-label">得分</span><span class="overview-item-value" style="color:${color};font-weight:600">${latest.score}分</span></div>
                <div class="overview-item"><span class="overview-item-label">等级</span><span class="overview-item-value" style="color:${color}">${latest.level}</span></div>`;
    } else {
        html += '<p style="color:var(--text-muted)">暂无测评记录</p>';
    }
    html += `</div>
        </div>
    </div>`;

    // 来访者画像标签
    if (c.tags && c.tags.length > 0) {
        html += `<div class="card" style="margin-bottom:16px">
            <div class="card-header"><div class="card-title">🏷️ 来访者画像</div><span style="font-size:12px;color:var(--text-muted)">共 ${c.tags.length} 个标签</span></div>
            <div style="display:flex;flex-wrap:wrap;gap:8px;padding:4px 0">
                ${c.tags.map(t => `<span style="padding:6px 14px;background:rgba(99,102,241,0.1);color:var(--primary);border-radius:16px;font-size:13px;border:1px solid rgba(99,102,241,0.2)">${t}</span>`).join('')}
            </div>
        </div>`;
    }

    // 疗效追踪曲线图
    html += await renderEfficacyCurve(id);

    // 基本信息Tab
    html += `<div class="ctab-content" id="ctabContent-basic" style="display:none">
        <div class="overview-grid">
            <div class="overview-card">
                <div class="overview-header"><h3>基本信息</h3></div>
                <div class="overview-item"><span class="overview-item-label">姓名</span><span class="overview-item-value">${c.name}</span></div>
                <div class="overview-item"><span class="overview-item-label">性别</span><span class="overview-item-value">${c.gender}</span></div>
                <div class="overview-item"><span class="overview-item-label">年龄</span><span class="overview-item-value">${c.age || '-'}</span></div>
                <div class="overview-item"><span class="overview-item-label">电话</span><span class="overview-item-value">${c.phone || '-'}</span></div>
                <div class="overview-item"><span class="overview-item-label">紧急联系人</span><span class="overview-item-value">${c.emergency || '-'}</span></div>
            </div>
            <div class="overview-card">
                <div class="overview-header"><h3>评估信息</h3></div>
                <div class="overview-item"><span class="overview-item-label">主诉问题</span><span class="overview-item-value" style="text-align:right;max-width:60%">${c.problem}</span></div>
                <div class="overview-item"><span class="overview-item-label">发展历程</span><span class="overview-item-value" style="text-align:right;max-width:60%">${c.problemHistory || '-'}</span></div>
                <div class="overview-item"><span class="overview-item-label">既往躯体病史</span><span class="overview-item-value">${c.medical || '-'}</span></div>
                <div class="overview-item"><span class="overview-item-label">心理治疗史</span><span class="overview-item-value">${c.mental || '-'}</span></div>
                <div class="overview-item"><span class="overview-item-label">家族病史</span><span class="overview-item-value">${c.family || '-'}</span></div>
            </div>
        </div>
    </div>`;
    
    // 测评Tab
    html += `<div class="ctab-content" id="ctabContent-assess" style="display:none">
        <div class="card">
            <div class="card-header"><div class="card-title">测评历史</div><button class="btn btn-sm btn-primary" onclick="startAssessmentForClient('${c.id}')">发起测评</button></div>`;
    if (clientAssessments.length === 0) {
        html += '<div class="empty-state"><div class="empty-state-icon">📋</div><h3>暂无测评记录</h3></div>';
    } else {
        html += `<div class="chart-container" style="height:120px;margin-bottom:16px">`;
        const maxScore = Math.max(...clientAssessments.map(a=>a.score), 1);
        html += clientAssessments.slice().reverse().map(a => {
            const pct = (a.score / maxScore) * 100;
            const color = a.level.includes('重度') || a.level.includes('高') ? '#EF4444' : a.level.includes('中度') || a.level.includes('中') ? '#F59E0B' : '#22C55E';
            return `<div class="chart-bar" style="height:${pct}%;background:${color}"><div class="chart-bar-value">${a.score}</div><div class="chart-bar-label">${a.date.slice(5)}</div></div>`;
        }).join('');
        html += '</div>';
        html += `<table class="table"><thead><tr><th>日期</th><th>量表</th><th>得分</th><th>等级</th><th>操作</th></tr></thead><tbody>`;
        html += clientAssessments.map(a => `<tr><td>${a.date}</td><td>${standardAssessments[a.type].name}</td><td>${a.score}</td><td>${a.level}</td><td><button class="btn btn-sm btn-secondary" onclick="viewAssessmentReport('${a.id}')">查看</button></td></tr>`).join('');
        html += '</tbody></table>';
    }
    html += '</div></div>';
    
    // 记录Tab
    html += `<div class="ctab-content" id="ctabContent-records" style="display:none">
        <div class="card">
            <div class="card-header"><div class="card-title">咨询记录</div><button class="btn btn-sm btn-primary" onclick="openRecordForClient('${c.id}')">写记录</button></div>`;
    if (clientRecords.length === 0) {
        html += '<div class="empty-state"><div class="empty-state-icon">📝</div><h3>暂无记录</h3></div>';
    } else {
        html += clientRecords.map((r, i) => {
            const num = clientRecords.length - i;
            const riskBadge = r.risk === '高风险' ? '<span class="badge badge-danger">高风险</span>' : r.risk === '中风险' ? '<span class="badge badge-warning">中风险</span>' : '';
            return `<div style="padding:14px;border-bottom:1px solid var(--border);cursor:pointer" onclick="viewRecord('${r.id}')">
                <div style="display:flex;justify-content:space-between;align-items:center">
                    <div><strong>第${num}次</strong> · ${r.date} · ${r.duration}分钟 ${riskBadge}</div>
                    <span class="badge badge-primary">${r.progress || ''}</span>
                </div>
                <div style="font-size:13px;color:var(--text-muted);margin-top:4px">${(r.subContent||'').substring(0,50)}...</div>
            </div>`;
        }).join('');
    }
    html += '</div></div>';
    
    // 预约Tab
    html += `<div class="ctab-content" id="ctabContent-appt" style="display:none">
        <div class="card">
            <div class="card-header"><div class="card-title">预约历史</div><button class="btn btn-sm btn-primary" onclick="openApptForClient('${c.id}')">新增预约</button></div>`;
    if (clientAppts.length === 0) {
        html += '<div class="empty-state"><div class="empty-state-icon">📅</div><h3>暂无预约</h3></div>';
    } else {
        html += clientAppts.map(a => {
            const statusBadge = a.status === '待进行' ? '<span class="badge badge-primary">待进行</span>' :
                                a.status === '进行中' ? '<span class="badge badge-warning">进行中</span>' :
                                a.status === '已完成' ? '<span class="badge badge-success">已完成</span>' :
                                '<span class="badge" style="background:rgba(100,116,139,0.1);color:var(--text-muted)">已取消</span>';
            return `<div style="padding:12px;border-bottom:1px solid var(--border)">
                <div style="display:flex;justify-content:space-between"><div><strong>${a.date} ${a.time}</strong></div>${statusBadge}</div>
                <div style="font-size:13px;color:var(--text-muted);margin-top:4px">${a.type} ${a.note || ''}</div>
            </div>`;
        }).join('');
    }
    html += '</div></div>';
    
    // 情绪Tab
    html += `<div class="ctab-content" id="ctabContent-mood" style="display:none">
        <div class="card">
            <div class="card-header"><div class="card-title">情绪打卡趋势</div></div>`;
    if (clientMoods.length === 0) {
        html += '<div class="empty-state"><div class="empty-state-icon">😊</div><h3>暂无情绪打卡</h3><p style="font-size:13px;color:var(--text-muted)">来访者在来访者端打卡后将显示在这里</p></div>';
    } else {
        html += `<div class="chart-container" style="height:100px;gap:12px;margin-bottom:16px">`;
        html += clientMoods.map(m => {
            const pct = (m.score / 5) * 100;
            const color = m.score <= 2 ? '#EF4444' : m.score === 3 ? '#F59E0B' : '#22C55E';
            return `<div class="chart-bar" style="height:${pct}%;background:${color}"><div class="chart-bar-value">${m.score}</div><div class="chart-bar-label">${m.date.slice(5)}</div></div>`;
        }).join('');
        html += '</div>';
        html += clientMoods.slice().reverse().slice(0,10).map(m => {
            const emoji = m.score <= 2 ? '😞' : m.score === 3 ? '😐' : m.score === 4 ? '🙂' : '😄';
            return `<div style="padding:10px;border-bottom:1px solid var(--border)"><span style="font-size:18px">${emoji}</span> <strong>${m.score}/5</strong> · ${m.date} ${m.note ? '<span style="color:var(--text-muted);font-size:13px">- ' + m.note + '</span>' : ''}</div>`;
        }).join('');
    }
    html += '</div></div>';
    
    document.getElementById('clientOverviewContent').innerHTML = html;
    
    // 添加Tab切换样式
    if (!document.getElementById('clientTabStyle')) {
        const style = document.createElement('style');
        style.id = 'clientTabStyle';
        style.textContent = `.tab-h { padding:10px 16px; cursor:pointer; font-size:14px; color:var(--text-muted); border-bottom:2px solid transparent; white-space:nowrap; transition:all 0.2s; }
        .tab-h:hover { color:var(--primary); }
        .tab-h.active { color:var(--primary); border-bottom-color:var(--primary); font-weight:600; }`;
        document.head.appendChild(style);
    }
    
    showPage('clientOverview');
}

function switchClientTab(tab) {
    document.querySelectorAll('.tab-h').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.ctab-content').forEach(c => c.style.display = 'none');
    const tabEl = document.getElementById('ctab-' + tab);
    const contentEl = document.getElementById('ctabContent-' + tab);
    if (tabEl) tabEl.classList.add('active');
    if (contentEl) contentEl.style.display = 'block';
}

async function openRecordForClient(clientId) {
    await openModal('recordModal');
    document.getElementById('rClient').value = clientId;
    const records = await Storage.get('records', []);
    const clientRecords = records.filter(r => r.clientId === clientId);
    document.getElementById('rSession').value = clientRecords.length + 1;
    if (clientRecords.length > 0) {
        lastRecordData = clientRecords.sort((a,b)=>b.date.localeCompare(a.date))[0];
    }
}

async function openApptForClient(clientId) {
    await openModal('appointmentModal');
    if (document.getElementById('aClient')) {
        document.getElementById('aClient').value = clientId;
    }
}

async function startAssessmentForClient(clientId) {
    showPage('assessments');
    assessmentClientId = clientId;
}

async function openClientFromSearch(clientId) {
    document.getElementById('searchDropdown').style.display = 'none';
    document.getElementById('globalSearch').value = '';
    await viewClient(clientId);
}

async function editClient(id) {
    const clients = await Storage.get('clients', []);
    const c = clients.find(x => x.id === id);
    if (!c) return;

    editingClientId = id;
    document.getElementById('cName').value = c.name;
    document.getElementById('cGender').value = c.gender;
    document.getElementById('cAge').value = c.age || '';
    document.getElementById('cPhone').value = c.phone || '';
    document.getElementById('cEmergency').value = c.emergency || '';
    document.getElementById('cProblem').value = c.problem;
    document.getElementById('cProblemHistory').value = c.problemHistory || '';
    document.getElementById('cMedical').value = c.medical || '';
    document.getElementById('cMental').value = c.mental || '';
    document.getElementById('cFamily').value = c.family || '';
    document.getElementById('cMedication').value = c.medication || '';
    document.getElementById('cGoal').value = c.goal || '';
    document.getElementById('cExpected').value = c.expected || '';
    document.getElementById('cRisk').value = c.risk;

    await renderClientTags(c.tags || []);
    openModal('clientModal');
}

// ===== 来访者标签库 =====
const PRESET_TAG_CATEGORIES = [
    {
        name: '年龄群体', tags: ['青少年', '青年', '中年', '老年', '儿童家长']
    },
    {
        name: '问题类型', tags: ['焦虑', '抑郁', '强迫', '睡眠问题', '人际关系', '情感困扰', '家庭矛盾', '工作压力', '学业压力', '创伤', '哀伤', '自我认同']
    },
    {
        name: '性格特质', tags: ['内向', '外向', '敏感', '完美主义', '低自尊', '高控制', '回避型', '依赖型']
    },
    {
        name: '咨询状态', tags: ['首次咨询', '老来访者', '依从性好', '依从性待提升', '脱落风险', '咨询进展良好', '咨询进展缓慢']
    },
    {
        name: '🌟 优势资源', tags: ['自我觉察力强', '学习能力强', '有创造力', '乐观积极', '意志力坚定', '善于反思', '责任心强', '执行力强', '有幽默感', '有艺术天赋', '有运动天赋']
    },
    {
        name: '🤝 支持系统', tags: ['家人支持', '伴侣支持', '朋友支持', '同事支持', '社区支持', '宗教信仰', '宠物陪伴', '心理咨询', '药物治疗', '自助团体']
    },
    {
        name: '🔥 动机水平', tags: ['强烈改变动机', '中等改变动机', '动机不稳定', '外部动机为主', '内部动机为主', '想要改变但害怕', '想要改变但迷茫']
    },
    {
        name: '💪 应对方式', tags: ['积极应对', '问题解决', '寻求支持', '情绪调节', '正念冥想', '运动锻炼', '艺术表达', '写日记', '回避应对', '压抑情绪', '过度思考']
    }
];

let currentSelectedTags = [];

async function renderClientTags(selected) {
    currentSelectedTags = [...(selected || [])];
    const lib = await getClientTagLibrary();
    const libEl = document.getElementById('cTagLibrary');
    
    const getTagColors = (catName) => {
        if (catName.includes('优势')) return { active: '#22C55E', border: '#86EFAC' };
        if (catName.includes('支持')) return { active: '#3B82F6', border: '#93C5FD' };
        if (catName.includes('动机')) return { active: '#F59E0B', border: '#FCD34D' };
        if (catName.includes('应对')) return { active: '#8B5CF6', border: '#C4B5FD' };
        return { active: 'var(--primary)', border: 'var(--border)' };
    };
    
    if (libEl) {
        libEl.innerHTML = PRESET_TAG_CATEGORIES.map(cat => {
            const colors = getTagColors(cat.name);
            return `
            <div style="margin-bottom:12px">
                <div style="font-size:12px;font-weight:600;color:var(--text-muted);margin-bottom:6px">${cat.name}</div>
                <div style="display:flex;flex-wrap:wrap;gap:6px">
                    ${cat.tags.map(t => {
                        const active = currentSelectedTags.includes(t);
                        return `<span onclick="toggleClientTag('${t}')" style="padding:4px 10px;border-radius:14px;font-size:12px;cursor:pointer;transition:all 0.15s;${active ? `background:${colors.active};color:white` : `background:white;border:1px solid ${colors.border};color:var(--text)`}">${t}</span>`;
                    }).join('')}
                </div>
            </div>
        `}).join('') + (lib.customTags && lib.customTags.length > 0 ? `
            <div style="margin-bottom:12px">
                <div style="font-size:12px;font-weight:600;color:var(--text-muted);margin-bottom:6px">我的自定义标签</div>
                <div style="display:flex;flex-wrap:wrap;gap:6px">
                    ${lib.customTags.map(t => {
                        const active = currentSelectedTags.includes(t);
                        return `<span onclick="toggleClientTag('${t}')" style="padding:4px 10px;border-radius:14px;font-size:12px;cursor:pointer;${active ? 'background:var(--warm-accent);color:white' : 'background:white;border:1px dashed var(--warm-accent);color:var(--text)'};position:relative">
                            ${t}
                            <span onclick="event.stopPropagation();deleteCustomTag('${t}')" style="margin-left:4px;opacity:0.6">×</span>
                        </span>`;
                    }).join('')}
                </div>
            </div>
        ` : '');
    }
    renderSelectedTags();
}

function renderSelectedTags() {
    const el = document.getElementById('cSelectedTags');
    if (!el) return;
    if (currentSelectedTags.length === 0) {
        el.innerHTML = '<span style="font-size:12px;color:var(--text-muted);align-self:center">暂未选择</span>';
        return;
    }
    
    const getTagColor = (tag) => {
        const strengthTags = ['自我觉察力强', '学习能力强', '有创造力', '乐观积极', '意志力坚定', '善于反思', '责任心强', '执行力强', '有幽默感', '有艺术天赋', '有运动天赋'];
        const supportTags = ['家人支持', '伴侣支持', '朋友支持', '同事支持', '社区支持', '宗教信仰', '宠物陪伴', '心理咨询', '药物治疗', '自助团体'];
        const motivationTags = ['强烈改变动机', '中等改变动机', '动机不稳定', '外部动机为主', '内部动机为主', '想要改变但害怕', '想要改变但迷茫'];
        const copingTags = ['积极应对', '问题解决', '寻求支持', '情绪调节', '正念冥想', '运动锻炼', '艺术表达', '写日记', '回避应对', '压抑情绪', '过度思考'];
        
        if (strengthTags.includes(tag)) return { bg: 'rgba(34,197,94,0.1)', color: '#22C55E' };
        if (supportTags.includes(tag)) return { bg: 'rgba(59,130,246,0.1)', color: '#3B82F6' };
        if (motivationTags.includes(tag)) return { bg: 'rgba(245,158,11,0.1)', color: '#F59E0B' };
        if (copingTags.includes(tag)) return { bg: 'rgba(139,92,246,0.1)', color: '#8B5CF6' };
        return { bg: 'rgba(99,102,241,0.1)', color: 'var(--primary)' };
    };
    
    el.innerHTML = currentSelectedTags.map(t => {
        const colors = getTagColor(t);
        return `<span style="padding:4px 10px;background:${colors.bg};color:${colors.color};border-radius:14px;font-size:12px;display:inline-flex;align-items:center;gap:4px">
            ${t}
            <span onclick="toggleClientTag('${t}')" style="cursor:pointer;opacity:0.6;font-weight:700">×</span>
        </span>`;
    }).join('');
}

function toggleClientTag(tag) {
    const idx = currentSelectedTags.indexOf(tag);
    if (idx > -1) {
        currentSelectedTags.splice(idx, 1);
    } else {
        currentSelectedTags.push(tag);
    }
    renderClientTags(currentSelectedTags);
}

function addCustomTag() {
    const input = document.getElementById('cCustomTag');
    if (!input) return;
    const val = input.value.trim();
    if (!val) return;
    if (currentSelectedTags.includes(val)) {
        showToast('该标签已选择', 'info');
        return;
    }
    currentSelectedTags.push(val);
    renderClientTags(currentSelectedTags);
    input.value = '';
    input.focus();
}

async function deleteCustomTag(tag) {
    if (!confirm(`确定要删除自定义标签"${tag}"吗？`)) return;
    const lib = await getClientTagLibrary();
    lib.customTags = (lib.customTags || []).filter(t => t !== tag);
    await db.setSetting('clientTagLibrary', lib);
    currentSelectedTags = currentSelectedTags.filter(t => t !== tag);
    renderClientTags(currentSelectedTags);
}

async function getClientTagLibrary() {
    return await db.getSetting('clientTagLibrary', { customTags: [] });
}

async function saveClientTagLibrary() {
    const lib = await getClientTagLibrary();
    // 收集新增的自定义标签
    const presetSet = new Set();
    PRESET_TAG_CATEGORIES.forEach(c => c.tags.forEach(t => presetSet.add(t)));
    const customs = currentSelectedTags.filter(t => !presetSet.has(t));
    customs.forEach(t => {
        if (!lib.customTags.includes(t)) lib.customTags.push(t);
    });
    await db.setSetting('clientTagLibrary', lib);
}

document.getElementById('clientForm').addEventListener('submit', async e => {
    e.preventDefault();

    await saveClientTagLibrary();

    const data = {
        name: document.getElementById('cName').value.trim(),
        gender: document.getElementById('cGender').value,
        age: parseInt(document.getElementById('cAge').value) || null,
        phone: document.getElementById('cPhone').value.trim(),
        emergency: document.getElementById('cEmergency').value.trim(),
        problem: document.getElementById('cProblem').value.trim(),
        problemHistory: document.getElementById('cProblemHistory').value.trim(),
        medical: document.getElementById('cMedical').value.trim(),
        mental: document.getElementById('cMental').value.trim(),
        family: document.getElementById('cFamily').value.trim(),
        medication: document.getElementById('cMedication').value.trim(),
        goal: document.getElementById('cGoal').value.trim(),
        expected: parseInt(document.getElementById('cExpected').value) || 8,
        risk: document.getElementById('cRisk').value,
        tags: [...currentSelectedTags],
        status: '咨询中',
        createdAt: formatDate(new Date())
    };

    if (editingClientId) {
        const clients = await Storage.get('clients', []);
        const idx = clients.findIndex(x => x.id === editingClientId);
        if (idx > -1) {
            data.id = editingClientId;
            data.createdAt = clients[idx].createdAt;
            await Storage.putOne('clients', data);
            await db.logOperation('edit', 'client', editingClientId);
        }
        editingClientId = null;
    } else {
        data.id = 'c' + Date.now();
        await Storage.putOne('clients', data);
        await db.logOperation('create', 'client', data.id);
    }

    closeModal('clientModal');
    document.getElementById('clientForm').reset();
    currentSelectedTags = [];
    await renderClients();
});

// ===== 量表使用时机建议 =====
const STAGE_ASSESSMENT_RECOMMENDATIONS = {
    initial: {
        name: '初始访谈期',
        recommend: ['sas', 'sds'],
        reason: '了解基线状态，建立评估基准',
        description: '建议在第1-3次咨询完成基线测评，了解来访者初始症状水平'
    },
    assessment: {
        name: '评估期',
        recommend: ['sas', 'sds', 'sleep'],
        reason: '完成全面评估，制定治疗计划',
        description: '建议完成焦虑、抑郁、睡眠等核心量表，为治疗方案提供依据'
    },
    working: {
        name: '工作期',
        recommend: ['sas', 'sds'],
        reason: '定期复评，监控疗效变化',
        description: '建议每4-6次咨询进行一次复评，追踪症状变化趋势'
    },
    ending: {
        name: '结束期',
        recommend: ['sas', 'sds', 'selfEsteem'],
        reason: '结案评估，总结疗效',
        description: '建议完成全面评估，对比基线数据，评估治疗效果'
    }
};

async function renderAssessmentRecommendations() {
    const container = document.getElementById('assessmentRecommendations');
    if (!container) return;

    const clients = await Storage.get('clients', []);
    const records = await Storage.get('records', []);
    const assessments = await Storage.get('assessments', []);

    const recommendations = [];

    for (const client of clients) {
        const stageInfo = await getClientStageInfo(client.id);
        const clientAssessments = assessments.filter(a => a.clientId === client.id);
        const recConfig = STAGE_ASSESSMENT_RECOMMENDATIONS[stageInfo.stage];

        if (!recConfig) continue;

        const neededAssessments = recConfig.recommend.filter(type => {
            return !clientAssessments.some(a => a.type === type && a.phase === stageInfo.stage);
        });

        if (neededAssessments.length > 0) {
            recommendations.push({
                clientId: client.id,
                clientName: client.name,
                stage: stageInfo.stage,
                stageName: recConfig.name,
                stageColor: stageInfo.color,
                recommendations: neededAssessments.map(type => ({
                    type,
                    name: standardAssessments[type]?.name || type,
                    icon: assessmentCategoryMap[type]?.icon || '📋'
                })),
                reason: recConfig.reason,
                description: recConfig.description
            });
        }
    }

    if (recommendations.length === 0) {
        container.innerHTML = '<div class="empty-state" style="padding:16px"><div class="empty-state-icon">✨</div><h3>暂无推荐测评</h3></div>';
        return;
    }

    container.innerHTML = recommendations.slice(0, 3).map(rec => `
        <div style="padding:12px;border-radius:8px;margin-bottom:12px;background:${rec.stageColor}10;border-left:3px solid ${rec.stageColor}">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
                <div>
                    <strong style="color:${rec.stageColor}">${rec.clientName}</strong>
                    <span style="font-size:12px;color:var(--text-muted);margin-left:8px">${rec.stageName}</span>
                </div>
                <span style="font-size:12px;color:var(--text-muted)">${rec.reason}</span>
            </div>
            <div style="font-size:12px;color:var(--text-muted);margin-bottom:10px">${rec.description}</div>
            <div style="display:flex;gap:8px;flex-wrap:wrap">
                ${rec.recommendations.map(a => `
                    <button class="btn btn-sm" style="background:${rec.stageColor};color:white" onclick="startAssessmentForClient('${rec.clientId}', '${a.type}')">
                        ${a.icon} ${a.name}
                    </button>
                `).join('')}
            </div>
        </div>
    `).join('') + (recommendations.length > 3 ? `<div style="text-align:center;padding:8px;font-size:12px;color:var(--text-muted)">还有 ${recommendations.length - 3} 位来访者需要测评...</div>` : '');
}

// ===== 测评量表 =====
async function renderAssessments() {
    // 加载自定义量表
    await loadCustomAssessments();
    // 渲染智能推荐
    await renderAssessmentRecommendations();
    // 渲染量表卡片
    renderAssessmentCards();

    const assessments = await Storage.get('assessments', []);
    const clients = await Storage.get('clients', []);
    const tbody = document.getElementById('assessmentsTable');

    if (assessments.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="empty-state"><div class="empty-state-icon">📋</div><h3>暂无测评记录</h3></td></tr>';
        return;
    }

    const allAssessments = { ...standardAssessments, ...customAssessmentsCache };
    tbody.innerHTML = assessments.sort((a,b)=>b.date.localeCompare(a.date)).map(a => {
        const c = clients.find(x => x.id === a.clientId);
        const color = a.level.includes('重度') || a.level.includes('高') || a.level.includes('高风险') ? '#EF4444' : a.level.includes('中度') || a.level.includes('中') ? '#F59E0B' : '#22C55E';
        const redFlagWarning = a.redFlags && a.redFlags.length > 0 ? `<span style="color:var(--danger);font-size:11px;margin-left:4px">⚠红旗</span>` : '';
        const aData = allAssessments[a.type] || { name: a.type, sourceLabel: '' };
        return `<tr>
            <td>${a.date}</td>
            <td>${c ? c.name : '-'}</td>
            <td>${aData.name}${aData.sourceLabel ? ` <span style="font-size:10px;padding:1px 6px;background:rgba(249,115,22,0.1);color:var(--warm-accent);border-radius:8px">${aData.sourceLabel}</span>` : ''}</td>
            <td><strong>${a.score}</strong>${redFlagWarning}</td>
            <td><span style="color:${color};font-weight:600">${a.level}</span></td>
            <td>${a.note || '-'}</td>
            <td class="actions">
                <button class="btn btn-sm btn-secondary" onclick="viewReport('${a.id}')">报告</button>
                <button class="btn btn-sm btn-primary" onclick="compareAssessments('${a.clientId}')">对比</button>
            </td>
        </tr>`;
    }).join('');
}

async function startAssessment(type) {
    const clients = await Storage.get('clients', []);
    if (clients.length === 0) { alert('请先添加来访者档案'); await showPage('clients'); return; }

    // 合并标准量表和用户自定义量表
    await loadCustomAssessments();
    const allAssessments = { ...standardAssessments, ...customAssessmentsCache };
    const a = allAssessments[type];
    if (!a) { alert('量表不存在'); return; }
    currentAssessment = { ...a, type };
    assessmentAnswers = {};
    assessmentClientId = null;
    currentQuestionIdx = 0;
    
    document.getElementById('runTitle').textContent = a.name;

    const opts = clients.map(c => `<option value="${c.id}">${c.name} (${c.gender}${c.age ? ' '+c.age+'岁' : ''})</option>`).join('');
    document.getElementById('runClientSelect').innerHTML = `
        <div class="form-group" style="max-width:360px">
            <label>选择来访者 *</label>
            <select id="runClientId" class="form-control" onchange="onAssessmentClientChange(this.value)" style="width:100%;padding:10px 14px;border:1px solid var(--border);border-radius:10px;font-size:14px">
                <option value="">请选择...</option>
                ${opts}
            </select>
        </div>
    `;
    
    document.getElementById('runContent').innerHTML = `<div class="empty-state"><div class="empty-state-icon">👤</div><h3>请先选择来访者</h3></div>`;
    showPage('assessmentRun');
}

function onAssessmentClientChange(clientId) {
    if (!clientId) {
        document.getElementById('runContent').innerHTML = `<div class="empty-state"><div class="empty-state-icon">👤</div><h3>请先选择来访者</h3></div>`;
        assessmentClientId = null;
        return;
    }

    Storage.get('clients', []).then(clients => {
        const c = clients.find(x => x.id === clientId);
        if (!c) return;
        assessmentClientId = clientId;

        const a = currentAssessment;
        const total = a.questions.length;
        // 模式切换按钮
        const modeToggle = `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;flex-wrap:wrap;gap:8px">
            <div style="font-size:14px">来访者：<strong>${c.name}</strong> · 共 ${total} 题</div>
            <div style="display:flex;gap:6px;background:var(--bg);padding:4px;border-radius:10px">
                <button class="btn btn-sm ${assessmentMode==='list'?'btn-primary':'btn-secondary'}" onclick="setAssessmentMode('list')">📋 列表模式</button>
                <button class="btn btn-sm ${assessmentMode==='single'?'btn-primary':'btn-secondary'}" onclick="setAssessmentMode('single')">🎯 单题模式</button>
            </div>
        </div>`;
        document.getElementById('runClientSelect').innerHTML = modeToggle;

        if (assessmentMode === 'single') {
            currentQuestionIdx = 0;
            renderSingleQuestion();
        } else {
            renderListQuestion();
        }
    });
}

function setAssessmentMode(mode) {
    assessmentMode = mode;
    if (assessmentClientId) onAssessmentClientChange(assessmentClientId);
}

function renderListQuestion() {
    const a = currentAssessment;
    const submitBar = document.getElementById('runSubmitBar');
    if (submitBar) submitBar.style.display = 'block';
    document.getElementById('runContent').innerHTML = a.questions.map((q, i) => {
        const isRedFlag = a.redFlags && a.redFlags.includes(i);
        const selected = assessmentAnswers[i];
        return `<div class="question-card" id="q${i}" style="${isRedFlag ? 'border:1px solid rgba(239,68,68,0.3);background:rgba(239,68,68,0.02)' : ''}">
            <div class="question-text">
                <span class="question-number">${i+1}</span>
                ${q}
                ${isRedFlag ? '<span style="color:var(--danger);font-size:11px;margin-left:8px">⚠红旗题项</span>' : ''}
            </div>
            <div class="options-group">
                ${a.options.map((opt, j) => `<button class="option-btn ${selected===j?'selected':''}" onclick="selectOption(${i}, ${j}, this)">${opt}</button>`).join('')}
            </div>
        </div>`;
    }).join('');
}

function renderSingleQuestion() {
    const a = currentAssessment;
    const submitBar = document.getElementById('runSubmitBar');
    if (submitBar) submitBar.style.display = 'none';
    const total = a.questions.length;
    const i = currentQuestionIdx;
    const q = a.questions[i];
    const isRedFlag = a.redFlags && a.redFlags.includes(i);
    const selected = assessmentAnswers[i];
    const answered = Object.keys(assessmentAnswers).length;
    const progress = Math.round((answered / total) * 100);

    const html = `<div style="max-width:680px;margin:0 auto">
        <!-- 进度条 -->
        <div style="margin-bottom:20px">
            <div style="display:flex;justify-content:space-between;font-size:13px;color:var(--text-muted);margin-bottom:6px">
                <span>第 ${i+1} / ${total} 题</span>
                <span>已答 ${answered} 题 · ${progress}%</span>
            </div>
            <div style="height:8px;background:var(--border);border-radius:4px;overflow:hidden">
                <div style="height:100%;width:${progress}%;background:linear-gradient(90deg,var(--primary),var(--primary-light));transition:width 0.3s"></div>
            </div>
        </div>

        <!-- 题目卡片 -->
        <div style="background:white;border-radius:16px;padding:32px 28px;box-shadow:var(--shadow-md);margin-bottom:20px;${isRedFlag?'border:2px solid rgba(239,68,68,0.3);':''}">
            <div style="font-size:13px;color:var(--text-muted);margin-bottom:12px">
                第 ${i+1} 题${isRedFlag?' <span style="color:var(--danger)">· ⚠红旗题项</span>':''}
            </div>
            <div style="font-size:22px;font-weight:600;line-height:1.6;margin-bottom:28px;color:var(--text)">${q}</div>

            <!-- 大按钮选项 -->
            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px">
                ${a.options.map((opt, j) => `
                    <button class="single-option-btn ${selected===j?'selected':''}" onclick="selectSingleOption(${i}, ${j})" style="
                        padding:18px 16px;border-radius:12px;border:2px solid ${selected===j?'var(--primary)':'var(--border)'};
                        background:${selected===j?'rgba(91,110,232,0.08)':'white'};cursor:pointer;font-size:16px;font-weight:500;
                        transition:all 0.2s;font-family:inherit;text-align:center;color:var(--text);
                        ${isRedFlag&&selected===j&&j>=2?'border-color:var(--danger);background:rgba(239,68,68,0.08);color:var(--danger);':''}
                    ">
                        ${opt}
                    </button>
                `).join('')}
            </div>
        </div>

        <!-- 导航 -->
        <div style="display:flex;justify-content:space-between;align-items:center;gap:12px">
            <button class="btn btn-secondary" ${i===0?'disabled style="opacity:0.5;cursor:not-allowed"':''} onclick="prevQuestion()">← 上一题</button>
            <div style="font-size:12px;color:var(--text-muted)">${selected!==undefined?'已选择：'+a.options[selected]:'未作答'}</div>
            ${i < total-1
                ? `<button class="btn btn-primary" onclick="nextQuestion()">下一题 →</button>`
                : `<button class="btn btn-success" onclick="submitAssessment()">✓ 完成并提交</button>`
            }
        </div>
    </div>`;

    document.getElementById('runContent').innerHTML = html;
}

function selectSingleOption(qIdx, optIdx) {
    assessmentAnswers[qIdx] = optIdx;
    // 红旗题项高亮提示
    const a = currentAssessment;
    if (a.redFlags && a.redFlags.includes(qIdx) && optIdx >= 2) {
        showToast('注意：此为红旗题项，已选中较严重选项', 'warning');
    }
    renderSingleQuestion();
    // 最后一题不自动跳转，由用户点击提交
    if (currentQuestionIdx < a.questions.length - 1) {
        // 自动跳到下一题（1秒后）
        setTimeout(() => {
            if (assessmentAnswers[qIdx] !== undefined && currentQuestionIdx === qIdx) {
                nextQuestion();
            }
        }, 600);
    }
}

function nextQuestion() {
    if (currentQuestionIdx < currentAssessment.questions.length - 1) {
        currentQuestionIdx++;
        renderSingleQuestion();
    }
}

function prevQuestion() {
    if (currentQuestionIdx > 0) {
        currentQuestionIdx--;
        renderSingleQuestion();
    }
}

function selectOption(qIdx, optIdx, btn) {
    btn.parentElement.querySelectorAll('.option-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    assessmentAnswers[qIdx] = optIdx;
    
    // 红旗题项高亮
    const a = currentAssessment;
    if (a.redFlags && a.redFlags.includes(qIdx) && optIdx >= 2) {
        btn.classList.add('red-flag-selected');
        btn.style.background = 'var(--danger)';
        btn.style.color = 'white';
    }
}

// ===== 自定义量表 =====
let customAssessmentsCache = {};

async function loadCustomAssessments() {
    customAssessmentsCache = await db.getSetting('customAssessments', {});
}

function openCustomAssessmentModal() {
    document.getElementById('caName').value = '';
    document.getElementById('caDesc').value = '';
    document.getElementById('caOptions').value = '完全不同意\n不同意\n中立\n同意\n完全同意';
    document.getElementById('caScores').value = '1\n2\n3\n4\n5';
    document.getElementById('caQuestions').value = '';
    openModal('customAssessmentModal');
}

document.getElementById('customAssessmentForm').addEventListener('submit', async e => {
    e.preventDefault();
    const name = document.getElementById('caName').value.trim();
    const desc = document.getElementById('caDesc').value.trim();
    const optionsRaw = document.getElementById('caOptions').value;
    const scoresRaw = document.getElementById('caScores').value;
    const questionsRaw = document.getElementById('caQuestions').value;

    const options = optionsRaw.split(/[,\n，、]/).map(s => s.trim()).filter(s => s);
    const questions = questionsRaw.split(/[,\n，、]/).map(s => s.trim()).filter(s => s);
    const scores = scoresRaw ? scoresRaw.split(/[,\n，、]/).map(s => parseFloat(s.trim())).filter(s => !isNaN(s)) : options.map((_, i) => i + 1);

    if (options.length < 2 || options.length > 7) {
        showToast('选项数量应在2-7之间', 'warning');
        return;
    }
    if (questions.length < 1) {
        showToast('请至少添加一道题', 'warning');
        return;
    }
    if (scores.length !== options.length) {
        showToast('分值数量应与选项数量一致', 'warning');
        return;
    }

    await loadCustomAssessments();
    const type = 'custom_' + Date.now();
    customAssessmentsCache[type] = {
        name: name,
        source: 'custom',
        sourceLabel: '✏️ 自定义',
        author: '我的自定义量表',
        desc: desc,
        questions: questions,
        options: options,
        scores: scores,
        ranges: [
            { max: scores[0] * questions.length, level: '低', desc: '低水平', color: '#22C55E' },
            { max: scores[Math.floor(scores.length / 2)] * questions.length, level: '中', desc: '中等水平', color: '#F59E0B' },
            { max: scores[scores.length - 1] * questions.length + 1, level: '高', desc: '高水平', color: '#EF4444' }
        ]
    };
    await db.setSetting('customAssessments', customAssessmentsCache);
    await db.logOperation('create', 'customAssessment', type, { name });

    // 重新渲染量表卡片
    renderAssessmentCards();
    closeModal('customAssessmentModal');
    showToast('自定义量表已创建', 'success');
});

async function submitAssessment() {
    const total = currentAssessment.questions.length;
    const answered = Object.keys(assessmentAnswers).length;
    if (answered < total) { alert(`还有 ${total - answered} 道题未完成`); return; }
    
    // 计算总分
    let score = 0;
    const dimensionScores = {};
    
    for (let i = 0; i < total; i++) {
        const optIdx = assessmentAnswers[i];
        let point = currentAssessment.scores[optIdx];
        
        // 反向计分
        if (currentAssessment.reverse && currentAssessment.reverse.includes(i)) {
            point = currentAssessment.scores[currentAssessment.scores.length - 1] - point + 1;
        }
        
        score += point;
        
        // 维度计分
        if (currentAssessment.dimensions) {
            for (const dim in currentAssessment.dimensions) {
                if (currentAssessment.dimensions[dim].questions.includes(i)) {
                    dimensionScores[dim] = (dimensionScores[dim] || 0) + point;
                }
            }
        }
    }
    
    let finalScore = score;
    if (currentAssessment.type === 'sas' || currentAssessment.type === 'sds') {
        finalScore = Math.round(score * 1.25);
    }
    
    const range = currentAssessment.ranges.find(r => finalScore <= r.max);
    
    // 检测红旗题项
    const redFlagHit = [];
    if (currentAssessment.redFlags) {
        for (const idx of currentAssessment.redFlags) {
            if (assessmentAnswers[idx] >= 2) {
                redFlagHit.push({
                    question: currentAssessment.questions[idx],
                    answer: currentAssessment.options[assessmentAnswers[idx]]
                });
            }
        }
    }
    
    const assessmentData = {
        id: 'a' + Date.now(),
        clientId: assessmentClientId,
        type: currentAssessment.type,
        score: finalScore,
        rawScore: score,
        level: range ? range.level : '未知',
        dimensionScores,
        redFlags: redFlagHit,
        answers: assessmentAnswers,
        date: formatDate(new Date()),
        note: '',
        phase: 'mid'
    };

    // 根据治疗阶段自动判定测评阶段
    const stageInfo = await getClientStageInfo(assessmentClientId);
    if (stageInfo.stage === 'assessment') {
        assessmentData.phase = 'baseline';
    } else if (stageInfo.stage === 'ending') {
        assessmentData.phase = 'endpoint';
    }
    
    await Storage.putOne('assessments', assessmentData);
    await db.logOperation('assess', 'client', assessmentClientId, { type: currentAssessment.type, score: finalScore });
    
    // 红旗题项触发预警
    if (redFlagHit.length > 0) {
        const clients = await Storage.get('clients', []);
        const c = clients.find(x => x.id === assessmentClientId);
        const alertData = {
            id: 'al' + Date.now(),
            type: 'redFlag',
            clientId: assessmentClientId,
            title: `${c ? c.name : ''} 测评红旗题项触发`,
            desc: `在${currentAssessment.name}中，"${redFlagHit[0].question}"选择了"${redFlagHit[0].answer}"，建议密切关注。`,
            date: formatDate(new Date()),
            read: false
        };
        await Storage.putOne('alerts', alertData);
    }
    
    await checkAlerts();
    await viewReport(assessmentData.id);
}

async function viewReport(id) {
    const assessments = await Storage.get('assessments', []);
    const a = assessments.find(x => x.id === id);
    if (!a) return;
    
    const clients = await Storage.get('clients', []);
    const c = clients.find(x => x.id === a.clientId);
    const template = standardAssessments[a.type];
    const range = template.ranges.find(r => a.score <= r.max);
    
    let html = `<div class="card">
        <div class="report-box">
            <div class="report-score">${a.score}</div>
            <div class="report-level" style="color:${range ? range.color : '#333'}">${range ? range.level : '未知'}</div>
            <div class="report-desc">${range ? range.desc : ''}</div>
        </div>
        
        <div class="report-section">
            <h4>来访者信息</h4>
            <p>${c ? c.name : '-'} · ${template.name} · ${a.date}</p>
        </div>`;
    
    // 维度分析（雷达图）
    if (a.dimensionScores) {
        html += `<div class="report-section">
            <h4>维度分析</h4>
            <div style="display:flex;gap:16px;flex-wrap:wrap">`;
        for (const dim in a.dimensionScores) {
            const dimName = template.dimensions[dim].name;
            const dimScore = a.dimensionScores[dim];
            const maxPossible = template.dimensions[dim].questions.length * 4;
            const pct = Math.round((dimScore / maxPossible) * 100);
            html += `<div style="flex:1;min-width:120px">
                <div style="font-size:13px;color:var(--text-muted);margin-bottom:4px">${dimName}</div>
                <div style="height:8px;background:var(--border);border-radius:4px;overflow:hidden">
                    <div style="height:100%;width:${pct}%;background:linear-gradient(90deg,var(--primary),var(--primary-dark))"></div>
                </div>
                <div style="font-size:12px;margin-top:4px">${dimScore}分 (${pct}%)</div>
            </div>`;
        }
        html += '</div></div>';
    }
    
    // 红旗题项提醒
    if (a.redFlags && a.redFlags.length > 0) {
        html += `<div class="report-section" style="background:rgba(239,68,68,0.05);padding:12px;border-radius:8px;border:1px solid rgba(239,68,68,0.2)">
            <h4 style="color:var(--danger)">⚠️ 红旗题项提醒</h4>
            <ul style="font-size:14px;line-height:1.8;padding-left:20px">`;
        a.redFlags.forEach(rf => {
            html += `<li>"${rf.question}" → 选择"${rf.answer}"</li>`;
        });
        html += `<li style="font-weight:600;margin-top:8px">建议：在下次咨询中优先核实相关内容，必要时启动风险评估。</li></ul></div>`;
    }
    
    // 答题详情
    if (a.answerDetails && a.answerDetails.length > 0) {
        html += `<div class="report-section">
            <h4>📝 答题详情</h4>
            <div style="margin-bottom:12px;font-size:13px;color:var(--text-muted)">
                以下展示每道题目及用户的作答情况（选项不可修改，仅作展示）
            </div>`;
        
        a.answerDetails.forEach(detail => {
            const isRedFlag = template.redFlags && template.redFlags.includes(detail.questionIdx);
            const durationStr = detail.duration < 60 ? `${detail.duration}秒` : `${Math.floor(detail.duration / 60)}分${detail.duration % 60}秒`;
            const isLongTime = detail.duration > 120;
            
            html += `<div class="question-card" style="${isRedFlag ? 'border:1px solid rgba(239,68,68,0.3);background:rgba(239,68,68,0.02)' : ''}">
                <div class="question-text">
                    <span class="question-number">${detail.questionIdx + 1}</span>
                    ${detail.question}
                    ${isRedFlag ? '<span style="color:var(--danger);font-size:11px;margin-left:8px">⚠红旗题项</span>' : ''}
                </div>
                <div class="options-group" style="pointer-events:none">
                    ${template.options.map((opt, j) => {
                        const isSelected = j === detail.answerIdx;
                        return `<button class="option-btn ${isSelected ? 'selected' : ''}" style="${isSelected && isRedFlag && j >= 2 ? 'background:rgba(239,68,68,0.1);border-color:var(--danger);color:var(--danger)' : ''}">${opt}</button>`;
                    }).join('')}
                </div>
                <div style="margin-top:10px;padding:8px 12px;background:var(--bg);border-radius:8px;display:flex;gap:16px;flex-wrap:wrap;font-size:12px">
                    <span><strong>用户选择：</strong><span style="color:var(--primary)">${detail.answer}</span></span>
                    <span><strong>得分：</strong>${detail.score}分</span>
                    <span style="${isLongTime ? 'color:var(--warning)' : ''}"><strong>耗时：</strong>${durationStr}${isLongTime ? ' ⚠耗时较长' : ''}</span>
                </div>
            </div>`;
        });
        
        const avgDuration = Math.round(a.answerDetails.reduce((sum, d) => sum + d.duration, 0) / a.answerDetails.length);
        const totalDuration = a.answerDetails.reduce((sum, d) => sum + d.duration, 0);
        const longQuestions = a.answerDetails.filter(d => d.duration > 120).length;
        html += `<div style="margin-top:16px;padding:16px;background:linear-gradient(135deg,rgba(91,110,232,0.05),rgba(244,117,168,0.05));border-radius:12px;display:flex;gap:24px;flex-wrap:wrap;font-size:14px">
            <div><strong>📊 总耗时：</strong>${Math.floor(totalDuration / 60)}分${totalDuration % 60}秒</div>
            <div><strong>📊 平均每题：</strong>${avgDuration}秒</div>
            <div><strong>⚠️ 超长答题：</strong>${longQuestions > 0 ? `<span style="color:var(--warning)">${longQuestions}题（>2分钟）</span>` : '无'}</div>
        </div></div>`;
    } else if (a.answers && template && template.questions) {
        html += `<div class="report-section">
            <h4>📝 答题详情</h4>
            <div style="margin-bottom:12px;font-size:13px;color:var(--text-muted)">
                以下展示每道题目及用户的作答情况（选项不可修改，仅作展示）
            </div>`;
        
        Object.keys(a.answers).forEach(idx => {
            const qIdx = parseInt(idx);
            const question = template.questions[qIdx];
            const answerIdx = a.answers[idx];
            const answer = template.options[answerIdx];
            const isRedFlag = template.redFlags && template.redFlags.includes(qIdx);
            
            html += `<div class="question-card" style="${isRedFlag ? 'border:1px solid rgba(239,68,68,0.3);background:rgba(239,68,68,0.02)' : ''}">
                <div class="question-text">
                    <span class="question-number">${qIdx + 1}</span>
                    ${question}
                    ${isRedFlag ? '<span style="color:var(--danger);font-size:11px;margin-left:8px">⚠红旗题项</span>' : ''}
                </div>
                <div class="options-group" style="pointer-events:none">
                    ${template.options.map((opt, j) => {
                        const isSelected = j === answerIdx;
                        return `<button class="option-btn ${isSelected ? 'selected' : ''}" style="${isSelected && isRedFlag && j >= 2 ? 'background:rgba(239,68,68,0.1);border-color:var(--danger);color:var(--danger)' : ''}">${opt}</button>`;
                    }).join('')}
                </div>
                <div style="margin-top:10px;padding:8px 12px;background:var(--bg);border-radius:8px;font-size:12px">
                    <span><strong>用户选择：</strong><span style="color:var(--primary)">${answer}</span></span>
                </div>
            </div>`;
        });
        html += `</div>`;
    }
    
    html += `<div class="report-section">
        <h4>建议</h4>
        <p>${range && range.level.includes('重度') ? '建议尽快安排进一步评估，必要时转介。' : range && range.level.includes('中度') ? '建议持续关注，动态评估。' : '当前状态良好，建议定期复测。'}</p>
    </div>
    </div>`;
    
    document.getElementById('reportContent').innerHTML = html;
    showPage('assessmentReport');
}

async function compareAssessments(clientId) {
    const assessments = await Storage.get('assessments', []);
    const clientAssessments = assessments.filter(a => a.clientId === clientId).sort((a,b)=>a.date.localeCompare(b.date));
    const clients = await Storage.get('clients', []);
    const c = clients.find(x => x.id === clientId);
    
    if (clientAssessments.length < 2) { alert('测评记录不足2次，无法对比'); return; }
    
    let html = `<div style="margin-bottom:16px"><strong>${c ? c.name : '-'}</strong> 的测评历史对比</div>`;
    
    // 图表
    html += `<div class="chart-container" style="height:200px;margin-bottom:20px">`;
    const maxScore = Math.max(...clientAssessments.map(a=>a.score), 1);
    html += clientAssessments.map(a => {
        const pct = (a.score / maxScore) * 100;
        const color = a.level.includes('重度') || a.level.includes('高') ? '#EF4444' : a.level.includes('中度') || a.level.includes('中') ? '#F59E0B' : '#22C55E';
        return `<div class="chart-bar" style="height:${pct}%;background:${color}"><div class="chart-bar-value">${a.score}</div><div class="chart-bar-label">${a.date.slice(5)}<br>${standardAssessments[a.type].name.split(' ')[0]}</div></div>`;
    }).join('');
    html += '</div>';
    
    // 表格
    html += `<table class="table"><thead><tr><th>日期</th><th>量表</th><th>分数</th><th>维度变化</th><th>红旗</th></tr></thead><tbody>`;
    clientAssessments.forEach(a => {
        const dimText = a.dimensionScores ? Object.entries(a.dimensionScores).map(([k,v])=> `${standardAssessments[a.type].dimensions[k].name}:${v}`).join(' ') : '-';
        html += `<tr><td>${a.date}</td><td>${standardAssessments[a.type].name}</td><td>${a.score}</td><td style="font-size:12px">${dimText}</td><td>${a.redFlags && a.redFlags.length > 0 ? '⚠️' : '-'}</td></tr>`;
    });
    html += '</tbody></table>';
    
    document.getElementById('compareContent').innerHTML = html;
    showPage('assessmentCompare');
}

// ===== 咨询记录（SOAP模板化） =====
async function renderRecords() {
    let records = await Storage.get('records', []);
    const clients = await Storage.get('clients', []);
    const tbody = document.getElementById('recordsTable');
    
    if (!tbody) return;
    
    // 搜索筛选
    const searchKw = document.getElementById('recordSearch')?.value?.trim().toLowerCase() || '';
    const riskFilter = document.getElementById('recordRiskFilter')?.value || '';
    const progressFilter = document.getElementById('recordProgressFilter')?.value || '';
    
    if (searchKw) {
        records = records.filter(r => {
            const c = clients.find(x => x.id === r.clientId);
            const clientName = c ? c.name.toLowerCase() : '';
            const content = (r.subContent + r.insight + r.nextFocus).toLowerCase();
            return clientName.includes(searchKw) || content.includes(searchKw);
        });
    }
    if (riskFilter) records = records.filter(r => r.risk === riskFilter);
    if (progressFilter) records = records.filter(r => r.progress === progressFilter);
    
    if (records.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="empty-state"><div class="empty-state-icon">📝</div><h3>暂无匹配记录</h3></td></tr>';
        return;
    }
    
    tbody.innerHTML = records.sort((a,b)=>b.date.localeCompare(a.date)).map(r => {
        const c = clients.find(x => x.id === r.clientId);
        const allClientRecords = (Storage._cache?.records || []).filter(x => x.clientId === r.clientId);
        const num = 'N/A';
        const riskBadge = r.risk === '高风险' ? '<span class="badge badge-danger">高风险</span>' :
                        r.risk === '中风险' ? '<span class="badge badge-warning">中风险</span>' :
                        '<span class="badge badge-success">低风险</span>';
        return `<tr><td>${r.date}</td><td>${c ? c.name : '-'}</td><td>—</td><td>${(r.subContent||'').substring(0,20)}...</td><td>${r.progress || '-'}</td><td>${riskBadge}</td><td>${r.duration || 50}分钟</td><td class="actions"><button class="btn btn-sm btn-secondary" onclick="viewRecord('${r.id}')">查看</button></td></tr>`;
    }).join('');
}

async function viewRecord(id) {
    const records = await Storage.get('records', []);
    const r = records.find(x => x.id === id);
    if (!r) return;
    
    const clients = await Storage.get('clients', []);
    const c = clients.find(x => x.id === r.clientId);

    let html = `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
        <button class="btn btn-secondary btn-sm" onclick="showPage('records')">← 返回记录列表</button>
        <div style="display:flex;gap:8px">
            ${c ? `<button class="btn btn-secondary btn-sm" onclick="viewClient('${c.id}')">👤 查看来访者档案</button>` : ''}
            <button class="btn btn-secondary btn-sm" onclick="printRecord()">🖨️ 打印</button>
        </div>
    </div>`;

    html += `<div class="card">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;padding-bottom:16px;border-bottom:1px solid var(--border)">
            <div><h2 style="font-size:18px">${c ? c.name : '-'} 的咨询记录</h2><p style="color:var(--text-muted);font-size:13px">${r.date} · ${r.duration}分钟${r.createdAt ? ' · 录入于 '+r.createdAt : ''}</p></div>
            <span class="badge ${r.risk === '高风险' ? 'badge-danger' : r.risk === '中风险' ? 'badge-warning' : 'badge-success'}">${r.risk}</span>
        </div>`;
    
    html += `<div class="soap-section"><div class="soap-header"><div class="soap-letter">S</div><div class="soap-title">主观感受</div></div>`;
    html += `<p><strong>主要讨论：</strong>${r.subContent || '-'}</p>`;
    html += `<p><strong>情绪状态：</strong>${r.subFeeling || '-'}</p>`;
    html += `<p><strong>关键陈述：</strong><em>"${r.subStatement || '-'}"</em></p>`;
    html += '</div>';
    
    html += `<div class="soap-section" style="border-left-color:var(--info)"><div class="soap-header"><div class="soap-letter" style="background:var(--info)">O</div><div class="soap-title">客观观察</div></div>`;
    html += `<p><strong>行为观察：</strong>${r.objBehavior || '-'}</p>`;
    html += `<p><strong>外表状态：</strong>${r.objAppearance || '-'}</p>`;
    html += `<p><strong>互动表现：</strong>${r.objInteraction || '-'}</p>`;
    html += '</div>';
    
    html += `<div class="soap-section" style="border-left-color:var(--warning)"><div class="soap-header"><div class="soap-letter" style="background:var(--warning)">A</div><div class="soap-title">评估分析</div></div>`;
    html += `<p><strong>咨询进展：</strong>${r.progress}</p>`;
    html += `<p><strong>关键洞察：</strong>${r.insight || '-'}</p>`;
    html += `<p><strong>使用技术：</strong>${r.methods || '-'}</p>`;
    html += '</div>';

    // 疗效评估
    html += `<div class="soap-section" style="border-left-color:#8B5CF6;background:rgba(139,92,246,0.04)"><div class="soap-header"><div class="soap-letter" style="background:#8B5CF6">效</div><div class="soap-title">疗效评估</div></div>`;
    if (r.suds !== undefined && r.suds !== null) {
        const sudsColor = r.suds >= 7 ? 'var(--danger)' : r.suds >= 4 ? 'var(--warning)' : 'var(--success)';
        html += `<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:4px">
            <div style="padding:12px;background:white;border-radius:8px;border:1px solid var(--border)">
                <div style="font-size:12px;color:var(--text-muted);margin-bottom:6px">SUDS 主观痛苦程度</div>
                <div style="display:flex;align-items:baseline;gap:8px">
                    <span style="font-size:32px;font-weight:700;color:${sudsColor}">${r.suds}</span>
                    <span style="font-size:13px;color:var(--text-muted)">/ 10</span>
                </div>
                <div style="height:6px;background:var(--border);border-radius:3px;overflow:hidden;margin-top:6px">
                    <div style="height:100%;width:${r.suds * 10}%;background:linear-gradient(90deg,var(--success),var(--warning),var(--danger))"></div>
                </div>
            </div>
            <div style="padding:12px;background:white;border-radius:8px;border:1px solid var(--border)">
                <div style="font-size:12px;color:var(--text-muted);margin-bottom:6px">咨询师疗效自评</div>
                <div style="font-size:28px;color:#F59E0B">${'★'.repeat(r.counselorRating || 0)}${'☆'.repeat(5 - (r.counselorRating || 0))}</div>
                <div style="font-size:12px;color:var(--text-muted);margin-top:4px">${['', '效果有限', '略有效果', '效果一般', '效果明显', '效果显著'][r.counselorRating || 0]}</div>
            </div>
        </div>`;
    } else {
        html += `<p style="color:var(--text-muted);font-size:13px">未填写疗效评估</p>`;
    }
    html += '</div>';

    html += `<div class="soap-section" style="border-left-color:var(--success)"><div class="soap-header"><div class="soap-letter" style="background:var(--success)">P</div><div class="soap-title">计划</div></div>`;
    html += `<p><strong>下次重点：</strong>${r.nextFocus || '-'}</p>`;
    html += `<p><strong>布置作业：</strong>${r.homework || '-'}</p>`;
    if (r.nextDate) html += `<p><strong>下次预约：</strong>${r.nextDate.replace('T',' ')}</p>`;
    if (r.goalProgress) html += `<p><strong>目标进展评估：</strong>${r.goalProgress}</p>`;
    html += '</div>';

    // 督导评语区
    const allReviews = await Storage.get('supervisorReviews', []);
    const recordReviews = allReviews.filter(v => v.recordId === r.id).sort((a,b)=>(a.date+a.time).localeCompare(b.date+a.time));
    html += `<div class="soap-section" style="border-left-color:var(--secondary)"><div class="soap-header"><div class="soap-letter" style="background:var(--secondary)">督导</div><div class="soap-title">督导评语 (${recordReviews.length})</div></div>`;
    if (recordReviews.length === 0) {
        html += `<p style="color:var(--text-muted);font-size:13px">暂无督导评语</p>`;
    } else {
        recordReviews.forEach(v => {
            html += `<div style="padding:10px 12px;background:var(--bg);border-radius:8px;margin-bottom:8px;font-size:13px;line-height:1.7">
                <div style="display:flex;justify-content:space-between;margin-bottom:4px">
                    <strong style="color:var(--secondary)">督导 ${v.reviewer}</strong>
                    <span style="font-size:12px;color:var(--text-muted)">${v.date} ${v.time}</span>
                </div>
                <div>${v.comment}</div>
                ${v.acknowledged ? '<span style="font-size:11px;color:var(--success)">已确认</span>' : '<span style="font-size:11px;color:var(--warning)">未确认</span>'}
            </div>`;
        });
    }
    html += '</div></div>';

    document.getElementById('recordDetailContent').innerHTML = html;
    showPage('recordDetail');
}

function renderTechTags() {
    selectedTechs = [];
    const container = document.getElementById('techTagContainer');
    if (!container) return;
    
    container.innerHTML = commonTechs.map(t => `<span class="tech-tag" onclick="toggleTechTag(this, '${t}')">${t}</span>`).join('');
}

function toggleTechTag(el, tech) {
    if (selectedTechs.includes(tech)) {
        selectedTechs = selectedTechs.filter(t => t !== tech);
        el.classList.remove('selected');
    } else {
        selectedTechs.push(tech);
        el.classList.add('selected');
    }
    document.getElementById('rMethods').value = selectedTechs.join('、');
}

function insertTimestamp() {
    const textarea = document.activeElement;
    if (textarea && textarea.tagName === 'TEXTAREA') {
        const now = formatTime(new Date());
        const timestamp = `[${now}] `;
        const start = textarea.selectionStart;
        const text = textarea.value;
        textarea.value = text.substring(0, start) + timestamp + text.substring(start);
        textarea.selectionStart = textarea.selectionEnd = start + timestamp.length;
        textarea.focus();
    }
}

function insertPhraseTemplate(section) {
    const textareaId = phraseTextareaMap[section];
    const textarea = document.getElementById(textareaId);
    if (!textarea) return;
    
    const phrases = phraseTemplates[section];
    const randomPhrase = phrases[Math.floor(Math.random() * phrases.length)];
    textarea.value = randomPhrase + '\n' + textarea.value;
    textarea.focus();
}

async function insertLatestAssessment() {
    const clientId = document.getElementById('rClient').value;
    if (!clientId) { showToast('请先选择来访者', 'warning'); return; }
    
    const assessments = await Storage.get('assessments', []);
    const clientAssess = assessments.filter(a => a.clientId === clientId).sort((a,b)=>b.date.localeCompare(a.date));
    
    if (clientAssess.length === 0) {
        showToast('该来访者暂无测评记录', 'warning');
        return;
    }
    
    const latest = clientAssess[0];
    const typeNames = { sas: 'SAS焦虑自评', sds: 'SDS抑郁自评', sleep: '睡眠质量评估' };
    const text = `【${typeNames[latest.type] || latest.type}测评 - ${latest.date}】得分：${latest.score}分（${latest.level}）`;
    
    insertToTextarea('rInsight', text);
    showToast('已插入最新测评结果', 'success');
}

function insertToTextarea(textareaId, text) {
    const textarea = document.getElementById(textareaId);
    if (!textarea) return;
    textarea.value = text + (textarea.value ? '\n' + textarea.value : '');
    textarea.focus();
}

function inheritLastRecord() {
    if (!lastRecordData) { alert('暂无上次记录可继承'); return; }
    
    document.getElementById('rSubContent').value = lastRecordData.subContent || '';
    document.getElementById('rSubFeeling').value = lastRecordData.subFeeling || '';
    document.getElementById('rSubStatement').value = lastRecordData.subStatement || '';
    document.getElementById('rObjBehavior').value = lastRecordData.objBehavior || '';
    document.getElementById('rObjAppearance').value = lastRecordData.objAppearance || '';
    document.getElementById('rObjInteraction').value = lastRecordData.objInteraction || '';
    document.getElementById('rInsight').value = lastRecordData.insight || '';
    document.getElementById('rMethods').value = lastRecordData.methods || '';
    document.getElementById('rNextFocus').value = lastRecordData.nextFocus || '';
    
    // 解析上次使用的技术
    if (lastRecordData.methods) {
        selectedTechs = lastRecordData.methods.split('、').filter(t => commonTechs.includes(t));
        renderTechTags();
        selectedTechs.forEach(t => {
            const el = document.querySelector(`.tech-tag.selected`);
            // 恢复选中状态
        });
    }
}

document.getElementById('recordForm').addEventListener('submit', async e => {
    e.preventDefault();

    const clientId = document.getElementById('rClient').value;
    const goalProgress = document.getElementById('rGoalProgress').value;
    const suds = parseInt(document.getElementById('rSuds').value);
    const counselorRating = parseInt(document.getElementById('rCounselorRatingVal').value);

    // 验证疗效评估必填
    if (!suds && suds !== 0) {
        showToast('请填写SUDS主观痛苦程度评分', 'warning');
        return;
    }
    if (!counselorRating) {
        showToast('请完成咨询师疗效自评（1-5星）', 'warning');
        return;
    }

    const data = {
        id: 'r' + Date.now(),
        clientId,
        date: document.getElementById('rDate').value,
        duration: parseInt(document.getElementById('rDuration').value) || 50,
        subContent: document.getElementById('rSubContent').value.trim(),
        subFeeling: document.getElementById('rSubFeeling').value.trim(),
        subStatement: document.getElementById('rSubStatement').value.trim(),
        objBehavior: document.getElementById('rObjBehavior').value.trim(),
        objAppearance: document.getElementById('rObjAppearance').value.trim(),
        objInteraction: document.getElementById('rObjInteraction').value.trim(),
        progress: document.getElementById('rProgress').value,
        risk: document.getElementById('rRisk').value,
        insight: document.getElementById('rInsight').value.trim(),
        methods: document.getElementById('rMethods').value.trim(),
        nextFocus: document.getElementById('rNextFocus').value.trim(),
        homework: document.getElementById('rHomework').value.trim(),
        nextDate: document.getElementById('rNextDate').value,
        goalProgress,
        suds,
        counselorRating,
        efficacy: { suds, counselorRating, evaluatedAt: new Date().toISOString() },
        createdAt: formatDateTime(new Date())
    };

    await Storage.putOne('records', data);
    await db.logOperation('record', 'client', clientId, { date: data.date, duration: data.duration, suds, counselorRating });
    
    // 记录目标进展历史
    if (goalProgress) {
        const goalHistory = {
            id: 'gh' + Date.now(),
            clientId,
            date: data.date,
            progress: goalProgress,
            recordId: data.id
        };
        await Storage.putOne('goalsHistory', goalHistory);
    }
    
    closeModal('recordModal');
    document.getElementById('recordForm').reset();
    selectedTechs = [];
    resetStarRating();

    showToast('记录已保存', 'success');

    await checkAlerts();
    await renderRecords();

    // 自动创建下次预约
    if (data.nextDate) {
        const apptData = {
            id: 'ap' + Date.now(),
            clientId,
            date: data.nextDate.split('T')[0],
            time: data.nextDate.split('T')[1] || '10:00',
            type: '咨询',
            status: '待进行',
            note: ''
        };
        await Storage.putOne('appointments', apptData);
    }

    // 根据保存动作决定跳转
    if (recordSaveAction === 'view') {
        recordSaveAction = 'list'; // 重置
        await viewRecord(data.id);
    }
});

function saveRecordAndView() {
    recordSaveAction = 'view';
    document.getElementById('recordForm').requestSubmit();
}

function printRecord() {
    const content = document.getElementById('recordDetailContent');
    if (!content) return;
    const win = window.open('', '_blank');
    win.document.write(`<html><head><title>咨询记录打印</title>
    <style>
        body{font-family:'Noto Sans SC',sans-serif;padding:32px;line-height:1.7;color:#0F172A}
        h2{font-size:18px;margin-bottom:4px}
        .soap-section{padding:12px 16px;margin-bottom:12px;border-left:4px solid #5B6EE8;background:#f8fafc;border-radius:4px}
        p{margin:6px 0;font-size:13px}
        strong{color:#0F172A}
        .badge{padding:2px 10px;border-radius:12px;font-size:12px;background:#eef2ff;color:#5B6EE8}
    </style></head><body>${content.innerHTML}</body></html>`);
    win.document.close();
    setTimeout(() => { win.print(); }, 300);
}

async function openModal(id) {
    if (id === 'recordModal' || id === 'appointmentModal') {
        const clients = await Storage.get('clients', []);
        const opts = clients.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
        document.getElementById('rClient').innerHTML = '<option value="">选择来访者</option>' + opts;
        document.getElementById('aClient').innerHTML = '<option value="">选择来访者</option>' + opts;

        if (id === 'recordModal') {
            document.getElementById('rDate').value = formatDate(new Date());
            renderTechTags();
        }
        if (id === 'appointmentModal') {
            document.getElementById('aDate').min = formatDate(new Date());
        }
    }
    if (id === 'clientModal' && !editingClientId) {
        // 新增来访者：渲染标签库（不预选）
        await renderClientTags([]);
    }
    document.getElementById(id).classList.add('active');
}

function closeModal(id) {
    document.getElementById(id).classList.remove('active');
    editingClientId = null;
}

// ===== 预约日程 =====
async function renderSchedule(tab) {
    const appointments = await Storage.get('appointments', []);
    const clients = await Storage.get('clients', []);
    
    const today = formatDate(new Date());
    const now = new Date();
    const weekStart = new Date(now); weekStart.setDate(now.getDate() - now.getDay());
    const weekEnd = new Date(weekStart); weekEnd.setDate(weekStart.getDate() + 6);
    
    let filtered = appointments.filter(a => a.status !== '已取消');
    if (tab === 'today') filtered = filtered.filter(a => a.date === today);
    if (tab === 'week') {
        const ws = formatDate(weekStart), we = formatDate(weekEnd);
        filtered = filtered.filter(a => a.date >= ws && a.date <= we);
    }
    filtered = filtered.sort((a,b)=>(a.date+' '+a.time).localeCompare(b.date+' '+b.time));
    
    const containerId = tab === 'today' ? 'scheduleToday' : tab === 'week' ? 'scheduleWeek' : 'scheduleAll';
    const container = document.getElementById(containerId);
    
    if (filtered.length === 0) {
        container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📅</div><h3>暂无预约</h3></div>';
        return;
    }
    
    container.innerHTML = filtered.map(a => {
        const c = clients.find(x => x.id === a.clientId);
        const countdown = getAppointmentCountdown(a.date, a.time);
        const statusBadge = a.status === '进行中' ? '<span class="badge badge-warning">进行中</span>' :
                            a.status === '已完成' ? '<span class="badge badge-success">已完成</span>' : '';
        
        return `<div class="schedule-item">
            <div class="schedule-time">${a.date}<br>${a.time}</div>
            <div class="schedule-content">
                <div class="schedule-title">${c ? c.name : '未知'} · ${a.type} ${statusBadge}</div>
                <div class="schedule-meta">${countdown ? countdown.text : ''} ${a.note || ''}</div>
            </div>
            <div class="schedule-actions">
                ${a.status === '待进行' ? `<button class="btn btn-sm btn-success" onclick="startConsultation('${a.id}')">开始</button>` : ''}
                ${a.status !== '已取消' && a.status !== '已完成' ? `<button class="btn btn-sm btn-secondary" onclick="cancelAppointment('${a.id}')">取消</button>` : ''}
                ${a.status === '进行中' ? `<button class="btn btn-sm btn-primary" onclick="completeAppointment('${a.id}')">完成</button>` : ''}
            </div>
        </div>`;
    }).join('');
}

function showScheduleTab(tab) {
    document.querySelectorAll('#schedule .tab-btn').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('#schedule .tab-panel').forEach(p => p.classList.remove('active'));
    if (event && event.target) event.target.classList.add('active');
    const panel = document.getElementById('schedule' + tab.charAt(0).toUpperCase() + tab.slice(1));
    if (panel) panel.classList.add('active');
    renderSchedule(tab);
}

async function completeAppointment(id) {
    const appointments = await Storage.get('appointments', []);
    const idx = appointments.findIndex(a => a.id === id);
    if (idx > -1) {
        appointments[idx].status = '已完成';
        await Storage.putOne('appointments', appointments[idx]);
        await db.logOperation('complete', 'appointment', id);
        await renderSchedule('today');
        await renderDashboard();
    }
}

async function cancelAppointment(id) {
    if (!confirm('确定取消此预约？')) return;
    const appointments = await Storage.get('appointments', []);
    const idx = appointments.findIndex(a => a.id === id);
    if (idx > -1) {
        appointments[idx].status = '已取消';
        await Storage.putOne('appointments', appointments[idx]);
        await db.logOperation('cancel', 'appointment', id);
        const activeTab = document.querySelector('#schedule .tab-btn.active');
        await renderSchedule(activeTab ? (activeTab.textContent === '今日' ? 'today' : activeTab.textContent === '本周' ? 'week' : 'all') : 'today');
        await renderDashboard();
    }
}

document.getElementById('appointmentForm').addEventListener('submit', async e => {
    e.preventDefault();
    
    const data = {
        id: 'ap' + Date.now(),
        clientId: document.getElementById('aClient').value,
        date: document.getElementById('aDate').value,
        time: document.getElementById('aTime').value,
        type: document.getElementById('aType').value,
        note: document.getElementById('aNote').value.trim(),
        status: '待进行',
        reminded: false
    };
    
    await Storage.putOne('appointments', data);
    await db.logOperation('create', 'appointment', data.id);
    
    closeModal('appointmentModal');
    document.getElementById('appointmentForm').reset();
    await renderSchedule('today');
    await renderDashboard();
});

// ===== 风险预警 =====
async function renderAlerts() {
    const alerts = await Storage.get('alerts', []);
    const clients = await Storage.get('clients', []);
    const container = document.getElementById('alertsList');
    
    const unreadCount = alerts.filter(a => !a.read).length;
    const badge = document.getElementById('alertCount');
    if (badge) {
        badge.textContent = unreadCount;
        badge.style.display = unreadCount > 0 ? 'inline-block' : 'none';
    }
    
    if (alerts.length === 0) {
        container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">🛡️</div><h3>暂无风险预警</h3></div>';
        return;
    }
    
    container.innerHTML = alerts.sort((a,b)=>b.date.localeCompare(a.date)).map(a => {
        const c = clients.find(x => x.id === a.clientId);
        const typeIcon = a.type === 'assessment' ? '📊' : a.type === 'record' ? '📝' : a.type === 'redFlag' ? '⚠️' : '🔔';
        return `<div class="alert-card" style="${a.read ? 'opacity:0.7' : ''}" onclick="viewClient('${a.clientId}')">
            <div class="alert-icon">${typeIcon}</div>
            <div class="alert-content">
                <div class="alert-title">${a.title}</div>
                <div class="alert-desc">${a.desc}</div>
                <div class="alert-meta">${c ? c.name : ''} · ${a.date} · ${a.read ? '已读' : '<strong style="color:var(--danger)">未读</strong>'}</div>
            </div>
            <div class="schedule-actions">
                <button class="btn btn-sm btn-secondary" onclick="event.stopPropagation();markAlertRead('${a.id}')">标记已读</button>
            </div>
        </div>`;
    }).join('');
}

async function markAlertRead(id) {
    const alerts = await Storage.get('alerts', []);
    const idx = alerts.findIndex(a => a.id === id);
    if (idx > -1) {
        alerts[idx].read = true;
        await Storage.putOne('alerts', alerts[idx]);
        await db.logOperation('markRead', 'alert', id);
        await renderAlerts();
    }
}

async function checkAlerts() {
    const clients = await Storage.get('clients', []);
    const assessments = await Storage.get('assessments', []);
    const records = await Storage.get('records', []);
    let alerts = await Storage.get('alerts', []);
    
    // 检查测评高分
    for (const a of assessments) {
        const range = standardAssessments[a.type].ranges.find(r => a.score <= r.max);
        if (range && (range.level.includes('中度') || range.level.includes('重度') || range.level.includes('高'))) {
            const c = clients.find(x => x.id === a.clientId);
            const title = `${c ? c.name : ''} ${standardAssessments[a.type].name.split(' ')[0]}评分偏高`;
            if (!alerts.find(al => al.clientId === a.clientId && al.title === title && al.date === a.date)) {
                const alertData = {
                    id: 'al' + Date.now() + Math.random().toString(36).substr(2, 4),
                    type: 'assessment',
                    clientId: a.clientId,
                    title,
                    desc: `${standardAssessments[a.type].name}评分${a.score}分，${range.level}`,
                    date: a.date,
                    read: false
                };
                await Storage.putOne('alerts', alertData);
            }
        }
    }
    
    // 检查记录中的高风险
    for (const r of records) {
        if (r.risk === '高风险') {
            const c = clients.find(x => x.id === r.clientId);
            const title = `${c ? c.name : ''} 咨询记录提示高风险`;
            if (!alerts.find(al => al.clientId === r.clientId && al.title === title && al.date === r.date)) {
                const alertData = {
                    id: 'al' + Date.now() + Math.random().toString(36).substr(2, 4),
                    type: 'record',
                    clientId: r.clientId,
                    title,
                    desc: `${r.date}的咨询记录中风险评估为"高风险"`,
                    date: r.date,
                    read: false
                };
                await Storage.putOne('alerts', alertData);
            }
        }
    }
    
    await renderAlerts();
}

async function checkAllAlerts() {
    await checkAlerts();
    alert('风险检查完成');
}

// ===== 导出/导入 =====
async function exportData() {
    const data = await db.exportData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `心创工坊数据备份_${formatDate(new Date())}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    await db.logOperation('export', 'system', 'all');
    alert('数据已导出');
}

async function importData() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async e => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async event => {
            try {
                const data = JSON.parse(event.target.result);
                await db.importData(data);
                await db.logOperation('import', 'system', 'all');
                alert('数据导入成功，页面即将刷新');
                location.reload();
            } catch (err) {
                alert('文件格式错误');
            }
        };
        reader.readAsText(file);
    };
    input.click();
}

// ===== 督导模式 =====
function toggleSupervisorMode() {
    supervisorMode = !supervisorMode;
    const btn = document.getElementById('supervisorBtn');
    
    if (supervisorMode) {
        // 保存原始dashboard HTML
        originalDashboardHTML = document.getElementById('dashboard').innerHTML;
        btn.classList.remove('btn-secondary');
        btn.classList.add('btn-primary');
        btn.textContent = '👁️ 督导模式(开)';
        renderSupervisorDashboard();
    } else {
        btn.classList.remove('btn-primary');
        btn.classList.add('btn-secondary');
        btn.textContent = '👁️ 督导模式';
        // 恢复原始dashboard
        if (originalDashboardHTML) {
            document.getElementById('dashboard').innerHTML = originalDashboardHTML;
            renderDashboard();
        }
    }
}

async function renderSupervisorDashboard() {
    const clients = await Storage.get('clients', []);
    const records = await Storage.get('records', []);
    const assessments = await Storage.get('assessments', []);
    const alerts = await Storage.get('alerts', []);
    
    let html = `<div class="stats-grid">
        <div class="stat-card"><div class="stat-value">${clients.length}</div><div class="stat-label">在案来访者</div></div>
        <div class="stat-card"><div class="stat-value">${records.length}</div><div class="stat-label">本月咨询记录</div></div>
        <div class="stat-card"><div class="stat-value">${assessments.length}</div><div class="stat-label">测评次数</div></div>
        <div class="stat-card"><div class="stat-value" style="color:var(--danger)">${alerts.filter(a=>!a.read).length}</div><div class="stat-label">未读预警</div></div>
    </div>`;
    
    // 风险分布
    html += `<div class="overview-grid">
        <div class="overview-card"><div class="overview-header"><h3>风险等级分布</h3></div>`;
    const riskCounts = {低:0, 中:0, 高:0, 紧急:0};
    clients.forEach(c => riskCounts[c.risk] = (riskCounts[c.risk] || 0) + 1);
    Object.entries(riskCounts).forEach(([k,v]) => {
        const color = k === '紧急' || k === '高' ? 'var(--danger)' : k === '中' ? 'var(--warning)' : 'var(--success)';
        html += `<div class="overview-item"><span class="overview-item-label" style="color:${color}">${k}风险</span><span class="overview-item-value">${v}人</span></div>`;
    });
    html += '</div>';
    
    // 重点关注个案
    html += `<div class="overview-card"><div class="overview-header"><h3>重点关注个案</h3></div>`;
    const highRisk = clients.filter(c => c.risk === '高' || c.risk === '紧急');
    if (highRisk.length === 0) html += '<p style="color:var(--text-muted)">暂无</p>';
    else {
        for (const c of highRisk) {
            const recent = records.filter(r=>r.clientId===c.id).sort((a,b)=>b.date.localeCompare(a.date))[0];
            html += `<div class="overview-item"><span class="overview-item-label">${c.name}</span><span class="overview-item-value" style="color:var(--danger)">${recent ? '最近:'+recent.date : '无记录'}</span></div>`;
        }
    }
    html += '</div></div>';
    
    // 全机构预警
    html += `<div class="card"><div class="card-header"><div class="card-title">全机构风险预警</div></div>`;
    if (alerts.length === 0) html += '<p style="color:var(--text-muted);padding:12px">暂无预警</p>';
    else {
        html += alerts.map(a => {
            const c = clients.find(x => x.id === a.clientId);
            return `<div class="alert-card"><div class="alert-icon">⚠️</div><div class="alert-content"><div class="alert-title">${a.title}</div><div class="alert-desc">${a.desc}</div><div class="alert-meta">${c?c.name:''} · ${a.date}</div></div></div>`;
        }).join('');
    }
    html += '</div>';
    
    // 督导审阅入口
    html += `<div class="card">
        <div class="card-header"><div class="card-title">待审阅记录</div><button class="btn btn-sm btn-primary" onclick="showPage('supervisorReview')">进入审阅</button></div>
    </div>`;
    
    document.getElementById('dashboard').innerHTML = html;
}

// ===== 数据备份页面 =====
async function renderBackups() {
    const backups = await db.getBackups();
    const container = document.getElementById('backupsList');
    
    if (backups.length === 0) {
        container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">💾</div><h3>暂无备份记录</h3><p>系统会在页面关闭时自动备份</p></div>';
        return;
    }
    
    container.innerHTML = backups.map(b => {
        const dataCount = b.data ? Object.values(b.data).reduce((sum, arr) => sum + (arr ? arr.length : 0), 0) : 0;
        return `<div class="schedule-item">
            <div class="schedule-time">${b.date}<br>${formatTime(new Date(b.timestamp))}</div>
            <div class="schedule-content">
                <div class="schedule-title">${b.reason === 'auto_close' ? '自动备份' : '手动备份'}</div>
                <div class="schedule-meta">包含${dataCount}条数据</div>
            </div>
            <div class="schedule-actions">
                <button class="btn btn-sm btn-primary" onclick="restoreBackup('${b.id}')">恢复</button>
                <button class="btn btn-sm btn-danger" onclick="deleteBackup('${b.id}')">删除</button>
            </div>
        </div>`;
    }).join('');
}

async function createManualBackup() {
    await db.createBackup('manual');
    showToast('备份已创建 ✓', 'success');
    await renderBackups();
}

async function quickBackup() {
    try {
        await db.createBackup('manual');
        showToast('数据已成功备份到本地', 'success');
    } catch(e) {
        showToast('备份失败: ' + e.message, 'error');
    }
}

function showToast(message, type = 'info') {
    let toast = document.getElementById('toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toast';
        toast.style.cssText = 'position:fixed;top:24px;left:50%;transform:translateX(-50%);padding:12px 24px;border-radius:10px;font-size:14px;font-weight:500;z-index:9999;box-shadow:0 8px 32px rgba(0,0,0,0.15);transition:all 0.3s;opacity:0;pointer-events:none';
        document.body.appendChild(toast);
    }
    
    const colors = {
        success: 'background:#22C55E;color:white',
        error: 'background:#EF4444;color:white',
        warning: 'background:#F59E0B;color:white',
        info: 'background:var(--primary);color:white'
    };
    
    toast.style.cssText = toast.style.cssText.replace(/background[^;]*/, '').replace(/color[^;]*/, '');
    toast.style.cssText += ';' + (colors[type] || colors.info);
    toast.textContent = message;
    toast.style.opacity = '1';
    toast.style.transform = 'translateX(-50%) translateY(0)';
    
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(-50%) translateY(-10px)';
    }, 2500);
}

async function restoreBackup(backupId) {
    if (!confirm('恢复备份将覆盖当前数据，确定继续？')) return;
    await db.restoreBackup(backupId);
    await db.logOperation('restore', 'backup', backupId);
    alert('备份已恢复，页面即将刷新');
    location.reload();
}

async function deleteBackup(backupId) {
    await db.delete('backups', backupId);
    await renderBackups();
}

// ===== 操作日志页面 =====
async function renderOperationLogs() {
    const logs = await Storage.get('operationLogs', []);
    const container = document.getElementById('logsList');
    
    if (logs.length === 0) {
        container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📋</div><h3>暂无操作日志</h3></div>';
        return;
    }
    
    container.innerHTML = `<table class="table">
        <thead><tr><th>时间</th><th>用户</th><th>操作</th><th>对象</th><th>详情</th></tr></thead>
        <tbody>${logs.sort((a,b)=>b.timestamp-a.timestamp).slice(0,50).map(l => {
            const actionText = {login:'登录',logout:'退出',view:'查看',create:'创建',edit:'编辑',delete:'删除',assess:'测评',record:'写记录',export:'导出',import:'导入',restore:'恢复备份'};
            const targetText = {user:'用户',client:'来访者',appointment:'预约',system:'系统',backup:'备份'};
            return `<tr><td>${l.date} ${l.time}</td><td>${l.userName}</td><td>${actionText[l.action] || l.action}</td><td>${targetText[l.targetType] || l.targetType}</td><td style="font-size:12px">${l.details ? JSON.stringify(l.details).substring(0,30) : '-'}</td></tr>`;
        }).join('')}</tbody>
    </table>`;
}

// ===== 来访者扫码入口 =====
async function renderClientLink() {
    const clients = await Storage.get('clients', []);
    const container = document.getElementById('clientLinkContent');
    
    // 生成关联码
    const links = await Storage.get('clientLinks', []);
    
    let html = `<div class="card">
        <div class="card-header"><div class="card-title">来访者扫码入口</div></div>
        <div style="padding:20px;text-align:center">
            <div style="font-size:18px;margin-bottom:16px">来访者可扫描以下二维码进入来访者端</div>
            <div style="width:200px;height:200px;background:var(--bg);border-radius:12px;display:flex;align-items:center;justify-content:center;margin:0 auto 16px">
                <div style="font-size:48px">📱</div>
            </div>
            <div style="font-size:14px;color:var(--text-muted)">来访者端地址：${location.origin}/client.html</div>
        </div>
    </div>`;
    
    // 生成关联码
    html += `<div class="card">
        <div class="card-header"><div class="card-title">生成来访者关联码</div></div>
        <div style="padding:20px">
            <div class="form-group">
                <label>选择来访者</label>
                <select id="linkClientSelect" class="form-control" style="width:100%">
                    <option value="">请选择...</option>
                    ${clients.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
                </select>
            </div>
            <button class="btn btn-primary" onclick="generateClientLink()">生成关联码</button>
        </div>
    </div>`;
    
    // 已生成的关联码
    if (links.length > 0) {
        html += `<div class="card">
            <div class="card-header"><div class="card-title">已生成的关联码</div></div>
            <table class="table"><thead><tr><th>来访者</th><th>关联码</th><th>创建时间</th><th>状态</th></tr></thead>
            <tbody>${links.map(l => {
                const c = clients.find(x => x.id === l.clientId);
                return `<tr><td>${c ? c.name : '-'}</td><td style="font-size:16px;font-weight:600">${l.code}</td><td>${l.createdAt}</td><td>${l.used ? '已使用' : '未使用'}</td></tr>`;
            }).join('')}</tbody></table>
        </div>`;
    }
    
    container.innerHTML = html;
}

async function generateClientLink() {
    const clientId = document.getElementById('linkClientSelect').value;
    if (!clientId) { alert('请选择来访者'); return; }
    
    const code = Math.random().toString(36).substr(2, 8).toUpperCase();
    const link = {
        code,
        clientId,
        createdAt: formatDate(new Date()),
        used: false
    };
    
    await Storage.putOne('clientLinks', link);
    alert(`关联码已生成：${code}\n请将此码告知来访者，来访者在来访者端输入此码后可关联数据`);
    await renderClientLink();
}

// ===== 演示数据初始化 =====
async function initDemoData() {
    const initialized = await db.getSetting('demoInitialized', false);
    if (initialized) return;
    
    const now = new Date();
    const makeDate = (offset) => {
        const d = new Date(now);
        d.setDate(d.getDate() + offset);
        return formatDate(d);
    };
    
    // 演示来访者
    const clients = [
        { id:'c1', name:'李明', gender:'男', age:17, phone:'138****1234', emergency:'李父-139****5678', problem:'考试焦虑，临近高考失眠心悸', problemHistory:'从高一开始每逢大考紧张', medical:'无', mental:'无', family:'无', medication:'无', goal:'缓解考试焦虑，改善睡眠', expected:12, risk:'中', status:'咨询中', createdAt:makeDate(-14) },
        { id:'c2', name:'张雪', gender:'女', age:16, phone:'136****5678', emergency:'张母-137****9012', problem:'情绪低落，社交回避', problemHistory:'初二霸凌后回避社交', medical:'无', mental:'曾接受学校心理辅导', family:'外婆有抑郁症病史', medication:'无', goal:'重建自信，恢复社交', expected:16, risk:'高', status:'咨询中', createdAt:makeDate(-21) },
        { id:'c3', name:'王浩', gender:'男', age:15, phone:'135****9012', emergency:'王母-138****3456', problem:'网络成瘾，亲子冲突', problemHistory:'初二开始沉迷手游', medical:'近视400度', mental:'无', family:'无', medication:'无', goal:'控制游戏时间，改善亲子关系', expected:10, risk:'中', status:'咨询中', createdAt:makeDate(-5) }
    ];
    
    for (const c of clients) await Storage.putOne('clients', c);
    
    // 演示测评
    const assessments = [
        { id:'a1', clientId:'c1', type:'sas', score:68, rawScore:54, level:'中度焦虑', dimensionScores:{somatic:28,psychic:26}, redFlags:[], date:makeDate(-14), note:'初评' },
        { id:'a2', clientId:'c1', type:'sds', score:45, rawScore:36, level:'正常', dimensionScores:{emotional:10,somatic:15,cognitive:11}, redFlags:[], date:makeDate(-14), note:'初评' },
        { id:'a3', clientId:'c2', type:'sas', score:52, rawScore:42, level:'轻度焦虑', dimensionScores:{somatic:22,psychic:20}, redFlags:[], date:makeDate(-21), note:'初评' },
        { id:'a4', clientId:'c2', type:'sds', score:72, rawScore:58, level:'中度抑郁', dimensionScores:{emotional:18,somatic:22,cognitive:18}, redFlags:[{question:'我认为如果我死了，别人会生活的好些',answer:'经常'}], date:makeDate(-21), note:'初评' },
        { id:'a5', clientId:'c3', type:'sleep', score:28, rawScore:28, level:'中度睡眠问题', dimensionScores:{quality:12,impact:10,behavior:6}, redFlags:[], date:makeDate(-5), note:'初评' }
    ];
    
    for (const a of assessments) await Storage.putOne('assessments', a);
    
    // 演示记录
    const records = [
        { id:'r1', clientId:'c1', date:makeDate(-14), duration:50, subContent:'来访者主诉高考压力大', subFeeling:'焦虑紧张', subStatement:'我怕考不好让父母失望', objBehavior:'坐立不安', objAppearance:'面色疲惫', objInteraction:'配合度高', progress:'进展良好', risk:'中风险', insight:'核心信念：自我价值与考试成绩绑定', methods:'认知重构、呼吸放松', nextFocus:'探索失败的具体含义', homework:'记录3件做得好的小事', nextDate:makeDate(-7)+'T14:00', goalProgress:'进展', createdAt:makeDate(-14) },
        { id:'r2', clientId:'c2', date:makeDate(-21), duration:60, subContent:'来访者低着头说话声音很小', subFeeling:'低落无助', subStatement:'我觉得大家都不喜欢我', objBehavior:'目光回避', objAppearance:'衣着暗淡', objInteraction:'防御性强', progress:'无明显进展', risk:'高风险', insight:'核心信念：我不值得被爱', methods:'建立安全感、情感反映', nextFocus:'继续建立信任', homework:'每天写下1个优点', nextDate:makeDate(-14)+'T10:00', goalProgress:'停滞', createdAt:makeDate(-21) },
        { id:'r3', clientId:'c3', date:makeDate(-5), duration:50, subContent:'来访者由母亲陪同前来', subFeeling:'烦躁抵触', subStatement:'游戏里我才能做主', objBehavior:'双臂交叉', objAppearance:'头发较长', objInteraction:'对抗性强', progress:'无明显进展', risk:'中风险', insight:'游戏是获得控制感的唯一渠道', methods:'动机式访谈', nextFocus:'理解游戏的心理功能', homework:'记录游戏时最开心的3个瞬间', nextDate:makeDate(2)+'T16:00', goalProgress:'停滞', createdAt:makeDate(-5) }
    ];
    
    for (const r of records) await Storage.putOne('records', r);
    
    // 演示预约
    const appointments = [
        { id:'ap1', clientId:'c1', date:makeDate(0), time:'14:00', type:'咨询', status:'待进行', reminded:false },
        { id:'ap2', clientId:'c2', date:makeDate(2), time:'10:00', type:'咨询', status:'待进行', reminded:false },
        { id:'ap3', clientId:'c3', date:makeDate(5), time:'16:00', type:'咨询', status:'待进行', reminded:false }
    ];
    
    for (const a of appointments) await Storage.putOne('appointments', a);
    
    // 演示情绪打卡
    const moods = [
        { id:'m1', clientId:'c1', date:makeDate(-3), score:3, note:'模拟考进步了' },
        { id:'m2', clientId:'c1', date:makeDate(-2), score:4, note:'今天状态不错' },
        { id:'m3', clientId:'c1', date:makeDate(-1), score:4, note:'复习效率挺高' },
        { id:'m4', clientId:'c2', date:makeDate(-2), score:3, note:'妈妈陪我散步' },
        { id:'m5', clientId:'c2', date:makeDate(-1), score:2, note:'' }
    ];
    
    for (const m of moods) await Storage.putOne('moods', m);
    
    // 演示预警
    const alerts = [
        { id:'al1', type:'assessment', clientId:'c2', title:'张雪 SDS评分偏高', desc:'SDS评分72分，中度抑郁', date:makeDate(-21), read:false },
        { id:'al2', type:'redFlag', clientId:'c2', title:'张雪 测评红旗题项触发', desc:'SDS第19题选择了经常', date:makeDate(-21), read:false }
    ];
    
    for (const a of alerts) await Storage.putOne('alerts', a);
    
    await db.setSetting('demoInitialized', true);
    await db.createBackup('init');
}

// ===== 页面初始化 =====
window.addEventListener('DOMContentLoaded', initApp);

// ===== 全局函数绑定 =====
window.showPage = showPage;
window.toggleAuth = toggleAuth;
window.logout = logout;
window.acceptPrivacy = acceptPrivacy;
window.viewClient = viewClient;
window.editClient = editClient;
window.startAssessment = startAssessment;
window.onAssessmentClientChange = onAssessmentClientChange;
window.filterByCategory = filterByCategory;
window.filterAssessments = filterAssessments;
window.renderAssessmentCards = renderAssessmentCards;
window.setAssessmentMode = setAssessmentMode;
window.renderListQuestion = renderListQuestion;
window.renderSingleQuestion = renderSingleQuestion;
window.selectSingleOption = selectSingleOption;
window.nextQuestion = nextQuestion;
window.prevQuestion = prevQuestion;
window.selectOption = selectOption;
window.submitAssessment = submitAssessment;
window.viewReport = viewReport;
window.viewAssessmentReport = viewReport;
window.compareAssessments = compareAssessments;
window.viewRecord = viewRecord;
window.saveRecordAndView = saveRecordAndView;
window.printRecord = printRecord;
window.renderTechTags = renderTechTags;
window.setStarRating = setStarRating;
window.resetStarRating = resetStarRating;
window.openCrisisConfigModal = openCrisisConfigModal;
window.resetCrisisConfigToDefault = resetCrisisConfigToDefault;
window.toggleClientTag = toggleClientTag;
window.addCustomTag = addCustomTag;
window.deleteCustomTag = deleteCustomTag;
window.renderWorkloadPage = renderWorkloadPage;
window.exportWorkloadReport = exportWorkloadReport;
window.openCustomAssessmentModal = openCustomAssessmentModal;
window.startOnboarding = startOnboarding;
window.onboardingNext = onboardingNext;
window.onboardingCreateClient = onboardingCreateClient;
window.onboardingCreateRecord = onboardingCreateRecord;
window.onboardingExit = onboardingExit;
window.onboardingSkip = onboardingSkip;
window.showDailyEncouragement = showDailyEncouragement;
window.toggleTechTag = toggleTechTag;
window.insertTimestamp = insertTimestamp;
window.insertPhraseTemplate = insertPhraseTemplate;
window.inheritLastRecord = inheritLastRecord;
window.openModal = openModal;
window.closeModal = closeModal;
window.showScheduleTab = showScheduleTab;
window.startConsultation = startConsultation;
window.beginConsultation = beginConsultation;
window.hideConsultationPrep = hideConsultationPrep;
window.showRealTimeMonitor = showRealTimeMonitor;
window.hideRealTimeMonitor = hideRealTimeMonitor;
window.saveRealTimeNotes = saveRealTimeNotes;
window.completeAppointment = completeAppointment;
window.cancelAppointment = cancelAppointment;
window.markAlertRead = markAlertRead;
window.checkAllAlerts = checkAllAlerts;
window.exportData = exportData;
window.importData = importData;
window.toggleSupervisorMode = toggleSupervisorMode;
window.createManualBackup = createManualBackup;
window.restoreBackup = restoreBackup;
window.deleteBackup = deleteBackup;
window.generateClientLink = generateClientLink;

// ===== 全局搜索 =====
async function handleGlobalSearch(keyword) {
    const dropdown = document.getElementById('searchDropdown');
    keyword = (keyword || '').trim();
    
    if (!keyword) {
        dropdown.style.display = 'none';
        return;
    }
    
    const clients = await Storage.get('clients', []);
    const kw = keyword.toLowerCase();
    
    const results = clients.filter(c => 
        c.name.toLowerCase().includes(kw) ||
        (c.phone && c.phone.includes(kw)) ||
        (c.problem && c.problem.toLowerCase().includes(kw))
    ).slice(0, 8);
    
    if (results.length === 0) {
        dropdown.innerHTML = '<div class="search-empty">没有找到匹配的来访者</div>';
    } else {
        dropdown.innerHTML = results.map(c => 
            `<div class="search-item" onclick="openClientFromSearch('${c.id}')">
                <div class="search-item-name">${c.name} ${c.riskLevel && c.riskLevel !== '低风险' ? `<span class="badge badge-danger" style="margin-left:6px">${c.riskLevel}</span>` : ''}</div>
                <div class="search-item-info">${c.age ? c.age + '岁 ' : ''}${c.gender || ''} · ${c.problem ? c.problem.substring(0, 20) : '暂无主诉'}</div>
            </div>`
        ).join('');
    }
    dropdown.style.display = 'block';
}

// 快捷键：Ctrl/Cmd + K 聚焦搜索
document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        const input = document.getElementById('globalSearch');
        if (input) input.focus();
    }
    // 自定义标签输入框：回车添加
    if (e.key === 'Enter' && e.target && e.target.id === 'cCustomTag') {
        e.preventDefault();
        addCustomTag();
    }
});

// ===== AI 智能咨询分析 =====
async function renderAIAnalysis() {
    await renderAIHistory();
}

async function renderAIHistory() {
    const analyses = await Storage.get('aiAnalyses', []);
    const clients = await Storage.get('clients', []);
    const container = document.getElementById('aiHistory');
    if (!container) return;
    
    if (analyses.length === 0) {
        container.innerHTML = '';
        return;
    }
    
    let html = `<div class="card"><div class="card-header"><div class="card-title">分析历史</div></div>`;
    analyses.sort((a,b)=>b.date.localeCompare(a.date)).forEach(ai => {
        const c = clients.find(x => x.id === ai.clientId);
        html += `<div style="padding:16px;border-bottom:1px solid var(--border)">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
                <div><strong>${ai.filename}</strong> <span class="ai-badge">AI</span></div>
                <span style="font-size:12px;color:var(--text-muted)">${ai.date} · ${ai.duration}</span>
            </div>
            <div style="font-size:13px;color:var(--text-muted);margin-bottom:8px">${c ? c.name : '-'} · ${ai.type === 'audio' ? '音频分析' : '视频分析'}</div>
            <div style="font-size:14px;margin-bottom:10px">${ai.summary}</div>
            ${ai.risks && ai.risks.length > 0 ? `<div style="color:var(--danger);font-size:13px;margin-bottom:8px">⚠️ 识别到 ${ai.risks.length} 个风险信号</div>` : ''}
            <button class="btn btn-sm btn-secondary" onclick="showAIResult('${ai.id}')">查看完整分析</button>
        </div>`;
    });
    html += `</div>`;
    container.innerHTML = html;
}

function triggerAIUpload() {
    const clients = Storage.get('clients', []).then(clients => {
        if (clients.length === 0) { alert('请先添加来访者档案'); return; }
        
        // 显示来访者选择下拉框
        const selectHtml = `<div class="form-group" style="max-width:400px;margin:0 auto 20px">
            <label>选择来访者 *</label>
            <select id="aiClientSelect" class="form-control" style="width:100%;padding:10px 14px;border:1px solid var(--border);border-radius:10px;font-size:14px">
                <option value="">请选择...</option>
                ${clients.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
            </select>
        </div>
        <div class="form-group" style="max-width:400px;margin:0 auto 20px">
            <label>文件类型</label>
            <select id="aiFileType" class="form-control" style="width:100%;padding:10px 14px;border:1px solid var(--border);border-radius:10px;font-size:14px">
                <option value="audio">音频（MP3/WAV）</option>
                <option value="video">视频（MP4/MOV）</option>
            </select>
        </div>
        <div style="text-align:center"><button class="btn btn-primary btn-lg" onclick="startAIAnalysis()">开始分析</button></div>`;
        
        document.getElementById('aiUploadArea').innerHTML = selectHtml;
    });
}

async function startAIAnalysis() {
    const clientId = document.getElementById('aiClientSelect').value;
    const fileType = document.getElementById('aiFileType').value;
    
    if (!clientId) { alert('请选择来访者'); return; }
    
    const clients = await Storage.get('clients', []);
    const c = clients.find(x => x.id === clientId);
    if (!c) return;
    
    document.getElementById('aiUploadArea').style.display = 'none';
    const resultDiv = document.getElementById('aiAnalysisResult');
    resultDiv.style.display = 'block';
    
    // 模拟AI处理流程
    const steps = [
        { text: '正在上传文件...', icon: '📁' },
        { text: '语音转写中...', icon: '🎙️' },
        { text: '情绪识别中...', icon: '🎭' },
        { text: '心理特征提取中...', icon: '🧠' },
        { text: '风险扫描中...', icon: '⚠️' },
        { text: '生成分析报告...', icon: '📝' }
    ];
    
    let stepIdx = 0;
    resultDiv.innerHTML = `<div class="empty-state" style="padding:60px">
        <div class="empty-state-icon" id="aiStepIcon">📁</div>
        <h3 id="aiStepText">正在上传文件...</h3>
        <div class="progress-bar" style="margin-top:20px;max-width:400px;margin-left:auto;margin-right:auto">
            <div class="progress-fill" id="aiProgress" style="width:0%"></div>
        </div>
        <p id="aiStepDesc" style="margin-top:12px;font-size:13px;color:var(--text-muted)">${c.name} · ${fileType === 'audio' ? '音频' : '视频'}分析</p>
    </div>`;
    
    const interval = setInterval(() => {
        stepIdx++;
        const pct = Math.round((stepIdx / steps.length) * 100);
        const bar = document.getElementById('aiProgress');
        const icon = document.getElementById('aiStepIcon');
        const text = document.getElementById('aiStepText');
        
        if (bar) bar.style.width = pct + '%';
        if (stepIdx < steps.length) {
            if (icon) icon.textContent = steps[stepIdx].icon;
            if (text) text.textContent = steps[stepIdx].text;
        } else {
            clearInterval(interval);
            generateMockAIResult(c, fileType);
        }
    }, 800);
}

async function generateMockAIResult(c, fileType) {
    const isVideo = fileType === 'video';
    const mock = {
        id: 'ai' + Date.now(),
        clientId: c.id,
        filename: `${c.name}_${formatDate(new Date()).replace(/-/g,'')}_咨询${isVideo?'视频':'录音'}.${isVideo?'mp4':'mp3'}`,
        date: formatDate(new Date()),
        duration: '50分钟',
        type: fileType,
        summary: `本次咨询中，${c.name}主要讨论了${c.problem.substring(0,20)}...相关议题。来访者在咨询前半段表现出明显的防御性，随着安全感建立，逐渐能够表达深层情绪。AI识别出4个情绪转折点和2个潜在风险信号，建议咨询师关注。`,
        transcript: [
            { time: '00:01:20', text: `${c.name}：最近一周感觉还可以，但晚上还是睡不好。`, emotion: '平静', confidence: 0.92 },
            { time: '00:05:30', text: `咨询师：能具体说说睡眠的情况吗？`, emotion: '中性', confidence: 0.95 },
            { time: '00:06:15', text: `${c.name}：每次闭上眼就会想起那件事...（声音变低）`, emotion: '悲伤', confidence: 0.88 },
            { time: '00:12:40', text: `${c.name}：有时候觉得活着没什么意思...（沉默约5秒）`, emotion: '抑郁', confidence: 0.91, risk: true },
            { time: '00:15:20', text: `咨询师：你说的"没什么意思"是指...？`, emotion: '中性', confidence: 0.93 },
            { time: '00:16:00', text: `${c.name}：也不是想死，就是觉得累，什么都不想做。`, emotion: '无力', confidence: 0.87 },
            { time: '00:28:20', text: `${c.name}：其实上周试了你说的方法，感觉好了一点。`, emotion: '积极', confidence: 0.89 },
            { time: '00:35:50', text: `${c.name}：最近胃口不太好，吃饭没什么味道。`, emotion: '平淡', confidence: 0.85, risk: true },
            { time: '00:41:05', text: `${c.name}：下次我想聊聊和妈妈的关系。`, emotion: '期待', confidence: 0.90 },
            { time: '00:48:30', text: `咨询师：好的，我们下次从这个话题开始。`, emotion: '中性', confidence: 0.94 }
        ],
        emotions: [
            { time: '00:06:15', text: '声音变低，语速放缓，提到核心议题时情绪下降', tag: '悲伤触发' },
            { time: '00:12:40', text: '出现"活着没意思"的表述，伴随长时间沉默', tag: '抑郁信号' },
            { time: '00:28:20', text: '语调上扬，提到积极体验时出现轻微笑声', tag: '积极资源' },
            { time: '00:41:05', text: '主动提出下次话题，参与感和自我效能感提升', tag: '合作性提升' }
        ],
        risks: [
            { time: '00:12:40', text: '出现"活着没什么意思"的表述，需评估自杀意念的具体计划与手段', level: '高' },
            { time: '00:35:50', text: '提到食欲下降、进食减少，需关注躯体化症状和营养状况', level: '中' }
        ],
        behaviors: isVideo ? [
            { time: '00:06:15', text: '目光下移，双手交叉于膝上，身体微微前倾' },
            { time: '00:12:40', text: '双手捂面，肩膀下垂，呼吸变浅' },
            { time: '00:28:20', text: '坐姿舒展，与咨询师有目光接触，偶尔点头' },
            { time: '00:41:05', text: '身体前倾，语速加快，手势增加' }
        ] : []
    };
    
    await Storage.putOne('aiAnalyses', mock);
    await db.logOperation('ai_analyze', 'client', c.id, { type: fileType, duration: mock.duration });
    
    showAIResult(mock.id);
    await renderAIHistory();
}

async function showAIResult(id) {
    const analyses = await Storage.get('aiAnalyses', []);
    const ai = analyses.find(x => x.id === id);
    if (!ai) return;
    
    const clients = await Storage.get('clients', []);
    const c = clients.find(x => x.id === ai.clientId);
    
    document.getElementById('aiUploadArea').style.display = 'none';
    const resultDiv = document.getElementById('aiAnalysisResult');
    resultDiv.style.display = 'block';
    
    let html = `<div style="margin-bottom:16px"><button class="btn btn-sm btn-secondary" onclick="resetAIUpload()">← 返回</button></div>`;
    
    // 头部
    html += `<div class="card" style="margin-bottom:16px">
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px">
            <div><h2 style="font-size:18px">${ai.filename} <span class="ai-badge">AI 分析完成</span></h2>
            <p style="color:var(--text-muted);font-size:13px;margin-top:4px">${c ? c.name : '-'} · ${ai.date} · ${ai.duration}</p></div>
            <div style="text-align:center">
                <div style="font-size:24px;font-weight:700;color:var(--primary)">${ai.emotions.length}</div>
                <div style="font-size:12px;color:var(--text-muted)">情绪转折点</div>
            </div>
        </div>
    </div>`;
    
    // 波形图
    html += `<div class="card" style="margin-bottom:16px">
        <div class="card-title" style="margin-bottom:12px">🎙️ 语音波形与关键标记</div>
        <div class="waveform">`;
    for (let i = 0; i < 60; i++) {
        const h = 15 + Math.random() * 40;
        const isRisk = ai.risks.some(r => {
            const secs = parseInt(r.time.split(':')[0])*60 + parseInt(r.time.split(':')[1]);
            const idx = Math.floor((secs / 3000) * 60);
            return Math.abs(idx - i) <= 2;
        });
        html += `<div class="wave-bar ${isRisk ? 'risk' : ''}" style="height:${h}px"></div>`;
    }
    html += `</div>
        <div style="display:flex;gap:16px;font-size:12px;color:var(--text-muted);margin-top:8px">
            <span style="display:flex;align-items:center;gap:4px"><span style="width:8px;height:8px;background:var(--primary-light);border-radius:2px"></span>正常语音</span>
            <span style="display:flex;align-items:center;gap:4px"><span style="width:8px;height:8px;background:var(--danger);border-radius:2px"></span>风险信号</span>
        </div>
    </div>`;
    
    // 智能纪要
    html += `<div class="ai-summary-box">
        <div class="ai-summary-title">📝 智能纪要摘要</div>
        <div style="font-size:14px;line-height:1.8">${ai.summary}</div>
    </div>`;
    
    // 逐句转写
    if (ai.transcript && ai.transcript.length > 0) {
        html += `<div class="card" style="margin-bottom:16px">
            <div class="analysis-section">
                <h4>💬 逐句转写文本（含情绪标注）</h4>
                <div style="max-height:400px;overflow-y:auto">`;
        ai.transcript.forEach(t => {
            const emotionColor = { '平静':'#64748B','中性':'#64748B','悲伤':'#3B82F6','抑郁':'#EF4444','无力':'#F59E0B','积极':'#22C55E','期待':'#22C55E','平淡':'#64748B' }[t.emotion] || '#64748B';
            html += `<div style="padding:12px;border-bottom:1px solid var(--border);${t.risk ? 'background:rgba(239,68,68,0.03)' : ''}">
                <div style="display:flex;justify-content:space-between;align-items:flex-start">
                    <div style="flex:1">
                        <span style="font-size:12px;color:var(--primary);font-weight:600;font-family:monospace">[${t.time}]</span>
                        <span style="font-size:14px;margin-left:8px">${t.text}</span>
                    </div>
                    <div style="display:flex;gap:8px;align-items:center">
                        <span style="font-size:12px;padding:2px 8px;border-radius:20px;background:${emotionColor}20;color:${emotionColor}">${t.emotion}</span>
                        <span style="font-size:11px;color:var(--text-muted)">${Math.round(t.confidence*100)}%</span>
                        ${t.risk ? '<span style="font-size:11px;padding:2px 8px;border-radius:20px;background:rgba(239,68,68,0.1);color:var(--danger)">⚠风险</span>' : ''}
                    </div>
                </div>
            </div>`;
        });
        html += `</div></div></div>`;
    }
    
    // 情绪时间轴
    html += `<div class="card" style="margin-bottom:16px">
        <div class="analysis-section">
            <h4>🎭 情绪时间轴</h4>
            <div class="timeline">`;
    ai.emotions.forEach(e => {
        html += `<div class="timeline-item">
            <div class="timeline-dot emotion"></div>
            <div class="timeline-time">${e.time}</div>
            <div class="timeline-text">${e.text}</div>
            <span class="timeline-tag" style="background:rgba(244,117,168,0.1);color:var(--secondary)">${e.tag}</span>
        </div>`;
    });
    html += `</div></div></div>`;
    
    // 风险信号
    if (ai.risks && ai.risks.length > 0) {
        html += `<div class="card" style="margin-bottom:16px;border:1px solid rgba(239,68,68,0.2)">
            <div class="analysis-section">
                <h4 style="color:var(--danger)">⚠️ 风险信号识别</h4>
                <div class="timeline">`;
        ai.risks.forEach(r => {
            html += `<div class="timeline-item">
                <div class="timeline-dot risk"></div>
                <div class="timeline-time">${r.time}</div>
                <div class="timeline-text">${r.text}</div>
                <span class="timeline-tag" style="background:rgba(239,68,68,0.1);color:var(--danger)">${r.level}风险</span>
            </div>`;
        });
        html += `</div>
                <div style="margin-top:12px;padding:12px;background:rgba(239,68,68,0.05);border-radius:8px;font-size:13px;color:var(--danger)">
                    <strong>建议：</strong>基于心理学风险评估模型，建议咨询师在下次咨询中优先核实自杀意念的具体计划与手段，必要时启动危机干预协议。
                </div>
            </div>
        </div>`;
    }
    
    // 非言语行为
    if (ai.behaviors && ai.behaviors.length > 0) {
        html += `<div class="card" style="margin-bottom:16px">
            <div class="analysis-section">
                <h4>📊 非言语行为分析（视频）</h4>
                <div class="timeline">`;
        ai.behaviors.forEach(b => {
            html += `<div class="timeline-item">
                <div class="timeline-dot" style="background:var(--info)"></div>
                <div class="timeline-time">${b.time}</div>
                <div class="timeline-text">${b.text}</div>
                <span class="timeline-tag" style="background:rgba(59,130,246,0.1);color:var(--info)">微行为</span>
            </div>`;
        });
        html += `</div></div></div>`;
    }
    
    // AI建议
    html += `<div class="card">
        <div class="analysis-section">
            <h4>✅ AI 建议后续行动</h4>
            <ul style="font-size:14px;line-height:2;color:var(--text);padding-left:20px">
                <li>在下次咨询开场时，温和地询问来访者关于"活着没意思"表述的具体含义</li>
                <li>使用哥伦比亚自杀风险评估量表（C-SSRS）进行标准化筛查</li>
                <li>关注来访者的睡眠和食欲变化，必要时建议医学检查</li>
                <li>肯定来访者在咨询中展现的自我总结能力，强化积极改变</li>
                <li>下次咨询聚焦来访者主动提出的"与妈妈的关系"话题</li>
            </ul>
            <div style="margin-top:16px;padding:12px;background:rgba(91,110,232,0.05);border-radius:8px;font-size:13px;color:var(--text-muted)">
                <strong>📌 技术说明：</strong>本分析基于大语言模型（LLM）对语音转写文本进行自然语言处理，结合心理学情感分析模型生成。情绪识别置信度均值为 90%。以上建议仅供参考，具体干预方案应由咨询师根据实际情况制定。
            </div>
        </div>
    </div>`;
    
    resultDiv.innerHTML = html;
}

function resetAIUpload() {
    document.getElementById('aiUploadArea').style.display = 'block';
    document.getElementById('aiUploadArea').innerHTML = `
        <div class="upload-zone" onclick="triggerAIUpload()">
            <div class="upload-icon">📁</div>
            <div class="upload-title">点击上传咨询录音或视频</div>
            <div class="upload-desc">支持 MP3、WAV、MP4、MOV 格式<br>AI 将自动转写语音、提取纪要、分析情绪变化与心理特征</div>
        </div>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:16px;margin-top:20px">
            <div class="capability-card"><div class="capability-icon">📝</div><div class="capability-title">智能纪要</div><div class="capability-desc">自动提取咨询核心内容，生成结构化摘要</div></div>
            <div class="capability-card"><div class="capability-icon">🎭</div><div class="capability-title">情绪时间轴</div><div class="capability-desc">识别来访者全程情绪波动，标注关键时刻</div></div>
            <div class="capability-card"><div class="capability-icon">⚠️</div><div class="capability-title">风险信号识别</div><div class="capability-desc">基于心理学模型识别潜在危机信号</div></div>
            <div class="capability-card"><div class="capability-icon">📊</div><div class="capability-title">非言语行为分析</div><div class="capability-desc">视频模式下分析微表情、身体姿态</div></div>
        </div>`;
    document.getElementById('aiAnalysisResult').style.display = 'none';
    document.getElementById('aiAnalysisResult').innerHTML = '';
}

// ===== AI 智能工具库 =====
function showAITool(type) {
    const modal = document.getElementById('aiToolModal');
    const title = document.getElementById('aiToolTitle');
    const body = document.getElementById('aiToolBody');
    
    if (!modal) return;
    
    const toolMap = {
        scaleGen: { t: '📋 智能量表定制', fn: renderScaleGenTool },
        exerciseGen: { t: '🧘 练习方案生成', fn: renderExerciseGenTool },
        caseAnalyze: { t: '🔍 个案概念化辅助', fn: renderCaseAnalyzeTool },
        crisisAssess: { t: '🚨 危机评估辅助', fn: renderCrisisAssessTool },
        learningPath: { t: '🎓 治疗阶段学习路径', fn: renderLearningPathTool },
        caseLibrary: { t: '📚 临床示范案例库', fn: renderCaseLibraryTool }
    };
    
    const tool = toolMap[type];
    if (!tool) return;
    
    title.textContent = tool.t;
    tool.fn(body);
    modal.style.display = 'flex';
}

function closeAITool() {
    const modal = document.getElementById('aiToolModal');
    if (modal) modal.style.display = 'none';
}

function renderScaleGenTool(container) {
    container.innerHTML = `
        <div style="font-size:13px;color:var(--text-muted);margin-bottom:16px">输入来访者的主诉和主要症状，AI 将自动推荐最合适的测评量表组合</div>
        <div class="form-group">
            <label>主要问题领域</label>
            <select id="sgDomain" onchange="sgAutoRecommend()">
                <option value="">请选择...</option>
                <option value="mood">情绪低落 / 抑郁</option>
                <option value="anxiety">焦虑 / 紧张 / 恐惧</option>
                <option value="stress">压力过大 / 适应困难</option>
                <option value="trauma">创伤经历 / PTSD</option>
                <option value="interpersonal">人际关系 / 社交</option>
                <option value="self">自我认知 / 自尊</option>
                <option value="sleep">睡眠问题</option>
                <option value="marital">婚姻 / 家庭关系</option>
                <option value="psychotic">疑似精神病性症状</option>
                <option value="ocd">强迫症状</option>
            </select>
        </div>
        <div class="form-group">
            <label>症状描述（可选）</label>
            <textarea id="sgSymptoms" rows="3" placeholder="简要描述来访者的主要症状、持续时间、严重程度等..."></textarea>
        </div>
        <div style="text-align:right;margin-bottom:16px">
            <button class="btn btn-primary" onclick="sgGenerate()">🤖 生成推荐方案</button>
        </div>
        <div id="sgResult"></div>
    `;
}

async function sgAutoRecommend() {
    const domain = document.getElementById('sgDomain').value;
    if (!domain) return;
    
    const recMap = {
        mood: ['sds', 'ghq12', 'pss'],
        anxiety: ['sas', 'ocs', 'ghq12'],
        stress: ['pss', 'sas', 'lifeEvent', 'copingStyle'],
        trauma: ['pcl5', 'sds', 'sas'],
        interpersonal: ['interpersonal', 'selfEsteem', 'sas'],
        self: ['selfEsteem', 'sds', 'ghq12'],
        sleep: ['sleep', 'sas', 'sds'],
        marital: ['marriage', 'sds', 'ghq12'],
        psychotic: ['psychotic', 'paranoia', 'ghq12'],
        ocd: ['ocs', 'sas', 'ghq12']
    };
    
    const recs = recMap[domain] || [];
    const result = document.getElementById('sgResult');
    if (!result) return;
    
    let html = `<div style="padding:12px;background:rgba(91,110,232,0.05);border-radius:8px;margin-bottom:12px">
        <strong style="color:var(--primary)">💡 推荐方案</strong><span style="font-size:12px;color:var(--text-muted);margin-left:8px">共推荐 ${recs.length} 个量表</span>
    </div>`;
    
    html += recs.map(key => {
        const meta = assessmentCategoryMap[key] || {};
        const data = standardAssessments[key] || { name: key };
        return `<div style="display:flex;align-items:center;gap:12px;padding:12px;background:var(--bg);border-radius:8px;margin-bottom:8px">
            <div style="font-size:24px">${meta.icon || '📋'}</div>
            <div style="flex:1">
                <div style="font-weight:600;font-size:14px">${data.name}</div>
                <div style="font-size:12px;color:var(--text-muted)">${meta.desc || ''}</div>
            </div>
            <button class="btn btn-sm btn-primary" onclick="sgAddToClient('${key}')">添加</button>
        </div>`;
    }).join('');
    
    html += `<div style="font-size:12px;color:var(--text-muted);margin-top:12px;padding:10px;background:rgba(245,158,11,0.05);border-radius:8px">
        <strong>📌 说明：</strong>量表推荐基于常见临床模式生成，仅供参考。实际使用时请结合临床访谈和专业判断进行调整。
    </div>`;
    
    result.innerHTML = html;
}

function sgGenerate() {
    sgAutoRecommend();
}

function sgAddToClient(key) {
    alert('量表已添加到来访者测评待办。\\n\\n（Demo 功能：实际使用时将自动创建测评任务并通知来访者）');
}

function renderExerciseGenTool(container) {
    container.innerHTML = `
        <div style="font-size:13px;color:var(--text-muted);margin-bottom:16px">基于咨询目标和来访者情况，生成个性化的家庭作业与练习方案</div>
        <div class="form-group">
            <label>咨询目标</label>
            <select id="egGoal">
                <option value="">请选择主要目标...</option>
                <option value="mood">改善抑郁情绪</option>
                <option value="anxiety">缓解焦虑紧张</option>
                <option value="sleep">改善睡眠质量</option>
                <option value="stress">压力管理</option>
                <option value="cognition">认知重构</option>
                <option value="social">社交技能提升</option>
                <option value="selfesteem">提升自尊自信</option>
                <option value="trauma">创伤疗愈</option>
                <option value="marriage">婚姻关系改善</option>
                <option value="mindfulness">正念培养</option>
            </select>
        </div>
        <div class="form-group">
            <label>来访者特征</label>
            <div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:6px">
                <label style="display:flex;align-items:center;gap:4px;font-size:13px;cursor:pointer"><input type="checkbox" value="beginner"> 初学者/无经验</label>
                <label style="display:flex;align-items:center;gap:4px;font-size:13px;cursor:pointer"><input type="checkbox" value="low_motivation"> 动机偏低</label>
                <label style="display:flex;align-items:center;gap:4px;font-size:13px;cursor:pointer"><input type="checkbox" value="time_limited"> 时间紧张</label>
                <label style="display:flex;align-items:center;gap:4px;font-size:13px;cursor:pointer"><input type="checkbox" value="has_support"> 有社会支持</label>
            </div>
        </div>
        <div style="text-align:right;margin-bottom:16px">
            <button class="btn btn-primary" onclick="egGenerate()">🤖 生成练习方案</button>
        </div>
        <div id="egResult"></div>
    `;
}

function egGenerate() {
    const goal = document.getElementById('egGoal').value;
    const result = document.getElementById('egResult');
    if (!goal) { alert('请选择咨询目标'); return; }
    
    const planMap = {
        mood: {
            title: '抑郁情绪改善 - 行为激活练习方案',
            items: [
                { name: '每日活动记录表', freq: '每日 1 次', time: '5 分钟', desc: '记录全天活动并评分愉悦感和掌控感，识别低谷时段' },
                { name: '三件好事练习', freq: '每晚睡前', time: '3 分钟', desc: '写下当天发生的3件好事及其原因，培养积极关注' },
                { name: '渐进式活动安排', freq: '每周 3 次', time: '20-30 分钟', desc: '从低难度活动开始，逐步增加活动量和社交接触' },
                { name: '正念身体扫描', freq: '每日 1 次', time: '10 分钟', desc: '觉察身体感受，与情绪建立连接，减少回避' }
            ],
            tip: '第一周建议从每日活动记录开始，不要给自己太大压力。关键是"做了"而不是"做得好"。'
        },
        anxiety: {
            title: '焦虑缓解 - 放松与暴露练习方案',
            items: [
                { name: '腹式呼吸练习', freq: '每日 3 次', time: '5 分钟', desc: '4秒吸气-7秒屏息-8秒呼气，激活副交感神经系统' },
                { name: '渐进式肌肉放松', freq: '每日 1 次', time: '15 分钟', desc: '从脚到头逐组肌肉紧张放松，降低整体焦虑水平' },
                { name: '焦虑记录与认知检验', freq: '焦虑发作时', time: '5 分钟', desc: '记录焦虑事件、想法、情绪强度，寻找支持和反对的证据' },
                { name: '逐级暴露练习', freq: '每周 2-3 次', time: '20 分钟', desc: '从恐惧等级最低的场景开始，逐步面对恐惧对象' }
            ],
            tip: '放松练习需要坚持2周以上才能看到明显效果。焦虑波动是正常的，不要因为偶尔的反复而气馁。'
        },
        sleep: {
            title: '睡眠改善 - 睡眠卫生与刺激控制方案',
            items: [
                { name: '睡眠日记', freq: '每日早晨', time: '3 分钟', desc: '记录入睡时间、夜醒次数、起床时间、白天精神状态' },
                { name: '睡前放松仪式', freq: '每晚睡前 30 分钟', time: '30 分钟', desc: '关闭电子设备、温水泡脚、轻柔音乐、阅读纸质书' },
                { name: '刺激控制练习', freq: '每晚', time: '随时', desc: '床上只做睡眠相关活动，20分钟未入睡即起床，有睡意再回床' },
                { name: '白天光照活动', freq: '每日上午', time: '20 分钟', desc: '户外活动接受自然光照，调节生物钟节律' }
            ],
            tip: '睡眠改善通常需要2-4周才能显现效果。固定起床时间比早睡更重要。'
        },
        stress: {
            title: '压力管理 - 综合应对方案',
            items: [
                { name: '压力源盘点', freq: '每周 1 次', time: '10 分钟', desc: '列出当前所有压力事件，按可控/不可控分类' },
                { name: '时间管理练习', freq: '每日早晨', time: '5 分钟', desc: '用四象限法规划当日任务，优先处理重要且紧急的事' },
                { name: '5-4-3-2-1  grounding 技术', freq: '压力峰值时', time: '2 分钟', desc: '说出5个所见、4个所触、3个所听、2个所嗅、1个所尝' },
                { name: '边界设定练习', freq: '每周 2 次', time: '10 分钟', desc: '识别难以拒绝的场景，练习用"我"信息表达立场' }
            ],
            tip: '压力管理的核心不是消除所有压力，而是建立与压力共处的能力。'
        },
        cognition: {
            title: '认知重构练习方案',
            items: [
                { name: '思维记录表', freq: '情绪波动时', time: '5 分钟', desc: '记录情境-自动思维-情绪-证据-替代思维-新情绪' },
                { name: '认知歪曲识别', freq: '每日 1 次', time: '3 分钟', desc: '学习识别非黑即白、灾难化、读心术等常见认知歪曲' },
                { name: '行为实验', freq: '每周 1 个', time: '30 分钟', desc: '用行动检验负面想法的真实性，收集客观证据' },
                { name: '去中心化练习', freq: '每日 1 次', time: '5 分钟', desc: '将想法看作"心理事件"而非事实，观察想法来去' }
            ],
            tip: '认知重构需要反复练习才能形成新的思维习惯。建议先用思维记录表坚持2周。'
        },
        social: {
            title: '社交技能提升练习方案',
            items: [
                { name: '社交情境等级表', freq: '第 1 周', time: '10 分钟', desc: '列出10个社交场景，按焦虑程度0-100分排序' },
                { name: '倾听与回应练习', freq: '每日 1 次', time: '5 分钟', desc: '在日常对话中练习复述对方内容+表达感受+开放式提问' },
                { name: '逐级社交暴露', freq: '每周 2-3 次', time: '20 分钟', desc: '从等级最低的场景开始，逐步进行社交接触' },
                { name: '自我肯定脚本', freq: '每日 1 次', time: '3 分钟', desc: '提前准备自我介绍和常见话题，减少临场焦虑' }
            ],
            tip: '社交能力是可以练习的。从低焦虑场景开始，每次成功的经验都会积累信心。'
        },
        selfesteem: {
            title: '自尊提升练习方案',
            items: [
                { name: '优点清单', freq: '第 1 天', time: '15 分钟', desc: '写下自己的10个优点和过去的成功经历' },
                { name: '自我慈悲信', freq: '每周 1 封', time: '10 分钟', desc: '以好朋友的语气给自己写一封理解和鼓励的信' },
                { name: '成就记录', freq: '每晚', time: '2 分钟', desc: '记录当天的3个小成就，不论大小' },
                { name: '批判者对话练习', freq: '每日 1 次', time: '5 分钟', desc: '识别自我批判的声音，用支持性的自我对话替代' }
            ],
            tip: '自尊提升是一个渐进的过程。对自己多一些耐心，就像你会对一个正在学习新技能的朋友那样。'
        },
        trauma: {
            title: '创伤疗愈 - 稳定化练习方案',
            items: [
                { name: '安全容器练习', freq: '每日 1 次', time: '5 分钟', desc: '想象一个安全的容器，将创伤记忆暂时存放其中' },
                { name: '内在安全之地', freq: '每日 1 次', time: '10 分钟', desc: '想象一个让自己感到完全安全的地方，丰富感官细节' },
                { name: '蝴蝶拍', freq: '需要时', time: '3 分钟', desc: '双臂交叉胸前，双手交替轻拍，双侧刺激调节情绪' },
                { name: ' grounding 练习', freq: '每日 2 次', time: '3 分钟', desc: '5-4-3-2-1 技术，锚定当下，减少闪回侵入' }
            ],
            tip: '创伤疗愈的第一阶段是稳定化。在处理创伤记忆之前，先建立足够的情绪调节能力。'
        },
        marriage: {
            title: '婚姻关系改善练习方案',
            items: [
                { name: '每日5分钟积极对话', freq: '每日', time: '5 分钟', desc: '每天专门安排5分钟，只聊积极的事，不聊问题' },
                { name: '欣赏清单', freq: '每周 1 次', time: '5 分钟', desc: '写下对方的3个优点或让你感激的事，并分享给对方' },
                { name: '"我"信息表达', freq: '需要时', time: '随时', desc: '用"我感到...因为...我希望..."替代"你总是..."' },
                { name: '每周约会时间', freq: '每周 1 次', time: '1-2 小时', desc: '专门的二人时光，不讨论问题，只增进连接' }
            ],
            tip: '关系改善的关键是"存款"多于"取款"。5个积极互动才能抵消1个消极互动的影响。'
        },
        mindfulness: {
            title: '正念培养练习方案',
            items: [
                { name: '正念呼吸', freq: '每日 1 次', time: '5 分钟', desc: '专注于呼吸的进出，走神时温和地带回' },
                { name: '身体扫描', freq: '每日 1 次', time: '10 分钟', desc: '从头到脚逐部位觉察身体感受，不评判' },
                { name: '正念行走', freq: '每日 1 次', time: '10 分钟', desc: '走路时专注于脚步的感觉、周围的声音和景象' },
                { name: '葡萄干练习', freq: '每周 1 次', time: '5 分钟', desc: '用所有感官慢慢体验一颗葡萄干的吃的过程' }
            ],
            tip: '正念练习的关键不是"清空思绪"，而是觉察到走神后温和地带回。每一次带回都是一次锻炼。'
        }
    };
    
    const plan = planMap[goal];
    if (!plan) return;
    
    let html = `<div style="padding:12px;background:rgba(91,110,232,0.05);border-radius:8px;margin-bottom:12px">
        <strong style="color:var(--primary)">📋 ${plan.title}</strong>
    </div>`;
    
    html += plan.items.map((item, i) => `
        <div style="padding:12px;border:1px solid var(--border);border-radius:8px;margin-bottom:8px">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
                <strong style="font-size:14px">${i + 1}. ${item.name}</strong>
                <span style="font-size:11px;color:var(--primary);background:rgba(91,110,232,0.1);padding:2px 8px;border-radius:10px">${item.freq} · ${item.time}</span>
            </div>
            <div style="font-size:13px;color:var(--text-muted);line-height:1.6">${item.desc}</div>
        </div>
    `).join('');
    
    html += `<div style="margin-top:12px;padding:12px;background:rgba(91,110,232,0.05);border-radius:8px">
        <div style="font-weight:600;font-size:13px;margin-bottom:4px">💡 咨询师提示</div>
        <div style="font-size:13px;color:var(--text-muted);line-height:1.6">${plan.tip}</div>
    </div>`;
    
    html += `<div style="text-align:right;margin-top:12px">
        <button class="btn btn-secondary btn-sm" onclick="alert('方案已保存到咨询记录')">💾 保存到记录</button>
        <button class="btn btn-primary btn-sm" onclick="alert('已发送到来访者端')">📱 发送给来访者</button>
    </div>`;
    
    result.innerHTML = html;
}

function renderCaseAnalyzeTool(container) {
    container.innerHTML = `
        <div style="font-size:13px;color:var(--text-muted);margin-bottom:16px">基于 CBT 5因素模型进行个案概念化分析，辅助制定治疗计划</div>
        
        <div style="background:rgba(91,110,232,0.05);padding:12px;border-radius:8px;margin-bottom:16px;font-size:12px;line-height:1.6">
            <strong style="color:var(--primary)">📌 5因素模型说明</strong><br>
            情境 → 自动思维 → 情绪 → 行为 → 生理反应，形成恶性循环。个案概念化的目标是识别这个循环并找到干预切入点。
        </div>

        <div class="form-group">
            <label>来访者基本信息</label>
            <textarea id="caInfo" rows="2" placeholder="年龄、性别、职业、婚姻状况等..."></textarea>
        </div>
        <div class="form-group">
            <label>主诉问题 *</label>
            <textarea id="caChiefComplaint" rows="2" placeholder="来访者最主要的困扰是什么？持续多久了？"></textarea>
        </div>
        <div class="form-group">
            <label>诱发事件（可选）</label>
            <textarea id="caTrigger" rows="2" placeholder="问题出现前发生了什么？有什么压力事件？"></textarea>
        </div>
        <div class="form-group">
            <label>已收集的测评数据（可选）</label>
            <select id="caAssessments" multiple style="width:100%;height:100px;padding:8px;border:1px solid var(--border);border-radius:8px">
                <option value="sas">SAS 焦虑自评（焦虑水平）</option>
                <option value="sds">SDS 抑郁自评（抑郁水平）</option>
                <option value="pss">PSS 压力知觉（压力水平）</option>
                <option value="selfEsteem">自尊量表（自我价值感）</option>
                <option value="sleep">睡眠量表（睡眠质量）</option>
                <option value="interpersonal">人际关系量表</option>
            </select>
        </div>
        <div style="text-align:right;margin-bottom:16px">
            <button class="btn btn-secondary" onclick="caShowTemplate()">📋 显示空白模板</button>
            <button class="btn btn-primary" onclick="caGenerate()">🤖 生成概念化框架</button>
        </div>
        <div id="caResult"></div>
    `;
}

function caShowTemplate() {
    const result = document.getElementById('caResult');
    if (!result) return;
    
    result.innerHTML = `
        <div style="padding:12px;background:rgba(91,110,232,0.05);border-radius:8px;margin-bottom:12px">
            <strong style="color:var(--primary)">📋 CBT 5因素模型 - 空白模板</strong>
            <span style="font-size:12px;color:var(--text-muted);margin-left:8px">请根据访谈信息填写</span>
        </div>
        
        ${renderFiveFactorSection('情境 Situations', '#6366F1', [
            { label: '触发情境', placeholder: '列举3-5个典型的触发情境，如：社交场合、工作汇报、独处时...' },
            { label: '情境特点', placeholder: '这些情境有什么共同特征？时间、地点、人物、事件...' }
        ])}
        
        ${renderFiveFactorSection('自动思维 Automatic Thoughts', '#3B82F6', [
            { label: '典型自动思维', placeholder: '来访者在这些情境中脑海中出现的想法...' },
            { label: '思维类型', placeholder: '灾难化、过度概括、非黑即白、读心术、个人化...' },
            { label: '信念强度', placeholder: '0-100%，来访者相信这些想法的程度...' }
        ])}
        
        ${renderFiveFactorSection('情绪 Emotions', '#8B5CF6', [
            { label: '主要情绪', placeholder: '焦虑、抑郁、愤怒、羞耻、恐惧、悲伤...' },
            { label: '情绪强度', placeholder: '0-100%，情绪的强烈程度...' },
            { label: '情绪变化规律', placeholder: '情绪何时升高？何时降低？什么因素影响情绪？' }
        ])}
        
        ${renderFiveFactorSection('行为 Behaviors', '#F59E0B', [
            { label: '适应性行为', placeholder: '有助于问题解决的行为...' },
            { label: '适应不良行为', placeholder: '回避、拖延、过度思考、自我伤害、物质滥用...' },
            { label: '行为后果', placeholder: '这些行为带来的短期和长期后果...' }
        ])}
        
        ${renderFiveFactorSection('生理反应 Physical Reactions', '#EF4444', [
            { label: '躯体症状', placeholder: '心跳加快、呼吸急促、出汗、肌肉紧张、头痛、胃痛...' },
            { label: '生理变化规律', placeholder: '症状何时出现？持续多久？与情绪的关系...' }
        ])}
        
        <div style="padding:16px;background:rgba(34,197,94,0.05);border-left:4px solid var(--success);border-radius:8px;margin-top:16px">
            <div style="font-weight:600;font-size:14px;margin-bottom:8px">🎯 治疗计划初步建议</div>
            <div style="font-size:13px;color:var(--text-muted);line-height:1.6">
                1. <strong>认知干预：</strong>识别并挑战自动思维，进行认知重构<br>
                2. <strong>行为干预：</strong>行为激活、暴露疗法、社交技能训练<br>
                3. <strong>情绪调节：</strong>正念练习、放松训练、情绪日志<br>
                4. <strong>生理调节：</strong>睡眠卫生、规律运动、饮食调整
            </div>
        </div>
    `;
}

function renderFiveFactorSection(title, color, items) {
    return `<div style="padding:16px;border:1px solid ${color}30;border-radius:12px;margin-bottom:12px;background:${color}05">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px">
            <div style="width:32px;height:32px;border-radius:8px;background:${color};display:flex;align-items:center;justify-content:center;color:white;font-weight:700;font-size:12px">${title.split(' ')[0].charAt(0)}</div>
            <div>
                <div style="font-weight:600;font-size:14px;color:${color}">${title}</div>
                <div style="font-size:11px;color:var(--text-muted)">${title.split(' ')[1] || ''}</div>
            </div>
        </div>
        <div style="display:flex;flex-direction:column;gap:8px">
            ${items.map(item => `
                <div class="form-group" style="margin-bottom:0">
                    <label style="font-size:12px;font-weight:500;color:var(--text)">${item.label}</label>
                    <textarea style="width:100%;padding:8px 12px;border:1px solid var(--border);border-radius:6px;font-size:13px;font-family:inherit;resize:vertical;min-height:60px" placeholder="${item.placeholder || ''}">${item.value || ''}</textarea>
                </div>
            `).join('')}
        </div>
    </div>`;
}

function caGenerate() {
    const info = document.getElementById('caInfo').value;
    const cc = document.getElementById('caChiefComplaint').value;
    const trigger = document.getElementById('caTrigger').value;
    const assessments = Array.from(document.getElementById('caAssessments').selectedOptions).map(o => o.value);
    const result = document.getElementById('caResult');
    
    if (!cc.trim()) { alert('请填写主诉问题'); return; }
    
    const isAnxiety = cc.includes('焦虑') || cc.includes('紧张') || cc.includes('害怕') || assessments.includes('sas');
    const isDepression = cc.includes('抑郁') || cc.includes('低落') || cc.includes('开心') || assessments.includes('sds');
    const isStress = cc.includes('压力') || cc.includes('工作') || cc.includes('学业') || assessments.includes('pss');
    const isInterpersonal = cc.includes('人际') || cc.includes('社交') || cc.includes('朋友') || assessments.includes('interpersonal');
    
    let scenarioExamples = '社交场合、工作汇报、公共演讲、与陌生人交往';
    let thoughtExamples = '"他们会觉得我很蠢"、"我一定会出丑"、"我无法应对"';
    let emotionExamples = '焦虑、紧张、恐惧、羞耻';
    let behaviorExamples = '回避社交、提前离场、过度准备、拖延';
    let physicalExamples = '心跳加快、手心出汗、呼吸急促、肌肉紧张';
    let coreBelief = '"我是不可爱的/无能的"、"我会被拒绝"';
    
    if (isDepression) {
        scenarioExamples = '独处时、看到别人开心、想到未来';
        thoughtExamples = '"我一无是处"、"未来没有希望"、"没人在乎我"';
        emotionExamples = '抑郁、悲伤、绝望、空虚';
        behaviorExamples = '活动减少、社交退缩、睡眠紊乱、食欲改变';
        physicalExamples = '疲劳乏力、精力下降、头痛、胃痛';
        coreBelief = '"我是无用的"、"我不配被爱"、"未来没有希望"';
    } else if (isInterpersonal) {
        scenarioExamples = '与他人交往、团队合作、表达不同意见';
        thoughtExamples = '"他们不喜欢我"、"我会说错话"、"我不合群"';
        emotionExamples = '焦虑、尴尬、孤独、愤怒';
        behaviorExamples = '回避社交、讨好他人、过度思考对话';
        physicalExamples = '脸红、发抖、心跳加速';
        coreBelief = '"我是不被接纳的"、"我必须完美才能被喜欢"';
    } else if (isStress) {
        scenarioExamples = '工作截止日期、任务繁重、突发状况';
        thoughtExamples = '"我完不成了"、"我会被解雇"、"我能力不够"';
        emotionExamples = '焦虑、烦躁、易怒、无助';
        behaviorExamples = '拖延、加班、过度工作、忽视休息';
        physicalExamples = '头痛、失眠、胃痛、肌肉紧张';
        coreBelief = '"我必须完美"、"我不能犯错"';
    }
    
    result.innerHTML = `
        <div style="padding:12px;background:rgba(91,110,232,0.05);border-radius:8px;margin-bottom:12px">
            <strong style="color:var(--primary)">🔍 CBT 5因素个案概念化分析</strong>
            <span style="font-size:12px;color:var(--text-muted);margin-left:8px">基于输入信息自动生成，供咨询师参考完善</span>
        </div>
        
        ${renderFiveFactorSection('情境 Situations', '#6366F1', [
            { label: '触发情境', placeholder: '', value: scenarioExamples },
            { label: '情境特点', placeholder: '', value: trigger || '需进一步探索具体触发情境' },
            { label: '最近发生的重要事件', placeholder: '', value: info || '基本信息待补充' }
        ])}
        
        ${renderFiveFactorSection('自动思维 Automatic Thoughts', '#3B82F6', [
            { label: '典型自动思维', placeholder: '', value: thoughtExamples },
            { label: '认知歪曲类型', placeholder: '', value: '灾难化思维、过度概括、读心术、个人化、非黑即白' },
            { label: '假设的核心信念', placeholder: '', value: coreBelief }
        ])}
        
        ${renderFiveFactorSection('情绪 Emotions', '#8B5CF6', [
            { label: '主要情绪', placeholder: '', value: emotionExamples },
            { label: '情绪强度评估', placeholder: '', value: '根据主诉描述，情绪强度约为 60-80/100' },
            { label: '情绪变化规律', placeholder: '', value: '情境出现时情绪迅速升高，回避行为后暂时降低，但长期维持较高水平' }
        ])}
        
        ${renderFiveFactorSection('行为 Behaviors', '#F59E0B', [
            { label: '适应不良行为', placeholder: '', value: behaviorExamples },
            { label: '行为的短期后果', placeholder: '', value: '暂时减轻焦虑/痛苦，获得安全感' },
            { label: '行为的长期后果', placeholder: '', value: '强化负面信念，限制生活范围，问题持续存在甚至加重' }
        ])}
        
        ${renderFiveFactorSection('生理反应 Physical Reactions', '#EF4444', [
            { label: '躯体症状', placeholder: '', value: physicalExamples },
            { label: '生理-情绪循环', placeholder: '', value: '情境→生理唤醒→情绪升高→自动思维→更多生理唤醒' }
        ])}
        
        <div style="padding:16px;background:rgba(34,197,94,0.05);border-left:4px solid var(--success);border-radius:8px;margin-top:16px">
            <div style="font-weight:600;font-size:14px;margin-bottom:8px">🎯 治疗计划建议</div>
            <div style="font-size:13px;color:var(--text);line-height:1.8">
                ${isAnxiety ? '<strong>• 暴露疗法：</strong>从低焦虑场景开始，逐步面对恐惧对象，打破回避-焦虑循环<br>' : ''}
                ${isDepression ? '<strong>• 行为激活：</strong>从低难度活动开始，逐步增加活动量，重建愉悦感和掌控感<br>' : ''}
                ${isStress ? '<strong>• 时间管理：</strong>使用四象限法规划任务，学习说"不"，建立工作-生活边界<br>' : ''}
                ${isInterpersonal ? '<strong>• 社交技能训练：</strong>角色扮演练习，学习有效沟通和自我表达<br>' : ''}
                <strong>• 认知重构：</strong>识别自动思维和认知歪曲，通过证据检验和行为实验挑战负面信念<br>
                <strong>• 情绪调节：</strong>正念呼吸、渐进式肌肉放松、情绪日志记录<br>
                <strong>• 家庭作业：</strong>思维记录表、行为实验记录、情绪追踪
            </div>
        </div>
        
        <div style="padding:12px;background:rgba(245,158,11,0.05);border-radius:8px;margin-top:12px">
            <div style="font-weight:600;font-size:13px;margin-bottom:4px">💡 下一步建议</div>
            <div style="font-size:12px;color:var(--text-muted);line-height:1.6">
                1. 在后续咨询中验证上述概念化假设，特别关注核心信念的确认<br>
                2. 收集更多测评数据（如未完成），建立基线评估<br>
                3. 与来访者共同制定具体的治疗目标和计划<br>
                4. 准备首次认知干预的材料（思维记录表等）
            </div>
        </div>
        
        <div style="text-align:right;margin-top:12px">
            <button class="btn btn-secondary btn-sm" onclick="caSaveConceptualization()">💾 保存概念化记录</button>
            <button class="btn btn-primary btn-sm" onclick="caShowTemplate()">📋 切换空白模板</button>
        </div>
    `;
}

function caSaveConceptualization() {
    alert('个案概念化记录已保存到来访者档案中。\\n\\n（Demo 功能：实际使用时将关联到来访者档案，方便后续查阅和更新）');
}

function renderLearningPathTool(container) {
    container.innerHTML = `
        <div style="font-size:13px;color:var(--text-muted);margin-bottom:16px">根据您的经验水平，获取个性化的学习路径和能力提升建议</div>
        
        <div style="display:flex;justify-content:center;margin-bottom:20px">
            <div style="display:flex;gap:4px;background:var(--bg);padding:4px;border-radius:12px">
                <button class="lp-btn btn btn-sm btn-primary" onclick="lpSelectLevel('beginner')" data-level="beginner">🌱 新手期</button>
                <button class="lp-btn btn btn-sm btn-secondary" onclick="lpSelectLevel('growing')" data-level="growing">🌿 成长期</button>
                <button class="lp-btn btn btn-sm btn-secondary" onclick="lpSelectLevel('mature')" data-level="mature">🌳 成熟期</button>
            </div>
        </div>
        
        <div id="lpResult"></div>
    `;
    lpSelectLevel('beginner');
}

function lpSelectLevel(level) {
    document.querySelectorAll('.lp-btn').forEach(btn => {
        btn.classList.remove('btn-primary');
        btn.classList.add('btn-secondary');
        if (btn.dataset.level === level) {
            btn.classList.remove('btn-secondary');
            btn.classList.add('btn-primary');
        }
    });
    
    const result = document.getElementById('lpResult');
    if (!result) return;
    
    const pathData = {
        beginner: {
            title: '🌱 新手咨询师学习路径',
            subtitle: '0-1年咨询经验 · 建立基础能力',
            color: '#6366F1',
            milestones: [
                { name: '基础技能', desc: '倾听技巧、共情能力、结构化访谈', status: 'current', progress: 60 },
                { name: '评估能力', desc: '初步心理评估、风险识别', status: 'next', progress: 30 },
                { name: '伦理规范', desc: '知情同意、保密原则、边界设置', status: 'pending', progress: 10 }
            ],
            focus: '当前重点：建立扎实的基本功和咨询框架',
            resources: [
                { title: '《心理咨询的理论与实务》', type: '书籍', desc: '了解咨询基本流程和技术' },
                { title: '初始访谈技巧训练', type: '课程', desc: '学习如何进行有效的首次会谈' },
                { title: '危机干预基础', type: '课程', desc: '识别和应对来访者的危机信号' }
            ],
            challenges: ['焦虑和自我怀疑', '难以建立咨询关系', '缺乏经验导致信心不足'],
            tips: ['多进行角色扮演练习', '寻求督导支持', '保持规律的个人体验', '从小个案开始积累']
        },
        growing: {
            title: '🌿 成长咨询师学习路径',
            subtitle: '1-3年咨询经验 · 深化专业能力',
            color: '#F59E0B',
            milestones: [
                { name: '理论整合', desc: '选择并深入学习1-2个咨询流派', status: 'current', progress: 70 },
                { name: '个案概念化', desc: '系统性评估和制定治疗计划', status: 'next', progress: 50 },
                { name: '特殊议题', desc: '处理复杂个案、危机干预、转介', status: 'pending', progress: 30 }
            ],
            focus: '当前重点：深化理论理解，发展个人咨询风格',
            resources: [
                { title: 'CBT认知行为治疗实务', type: '课程', desc: '系统学习CBT理论和技术' },
                { title: '《心理治疗师之路》', type: '书籍', desc: '探索专业认同和职业发展' },
                { title: '督导小组', type: '实践', desc: '参与案例督导，获得反馈' }
            ],
            challenges: ['遭遇瓶颈期', '处理复杂个案压力', '职业耗竭风险'],
            tips: ['定期接受督导', '保持持续学习', '建立同行支持网络', '关注自身身心健康']
        },
        mature: {
            title: '🌳 成熟咨询师学习路径',
            subtitle: '3年以上经验 · 拓展专业影响力',
            color: '#22C55E',
            milestones: [
                { name: '专业深耕', desc: '成为某个领域的专家', status: 'current', progress: 80 },
                { name: '督导能力', desc: '学习成为督导师，指导新人', status: 'next', progress: 60 },
                { name: '行业贡献', desc: '参与培训、写作、研究', status: 'pending', progress: 40 }
            ],
            focus: '当前重点：拓展专业影响力，回馈行业',
            resources: [
                { title: '督导技能培训', type: '课程', desc: '学习如何有效督导新手咨询师' },
                { title: '专业写作指导', type: '课程', desc: '提升专业文章写作能力' },
                { title: '行业会议', type: '活动', desc: '参与专业研讨会，拓展人脉' }
            ],
            challenges: ['保持专业热情', '避免固步自封', '平衡工作与生活'],
            tips: ['寻找新的学习领域', '培养下一代咨询师', '参与行业建设', '保持好奇心和开放态度']
        }
    };
    
    const data = pathData[level];
    if (!data) return;
    
    result.innerHTML = `
        <div style="padding:16px;background:${data.color}08;border-radius:12px;margin-bottom:16px">
            <div style="font-weight:700;font-size:18px;color:${data.color}">${data.title}</div>
            <div style="font-size:13px;color:var(--text-muted);margin-top:4px">${data.subtitle}</div>
        </div>
        
        <div style="padding:12px;background:rgba(245,158,11,0.05);border-radius:8px;margin-bottom:16px">
            <strong style="color:var(--warning)">🎯 ${data.focus}</strong>
        </div>
        
        <div style="margin-bottom:16px">
            <div style="font-weight:600;font-size:14px;margin-bottom:10px">📊 成长里程碑</div>
            ${data.milestones.map(m => `
                <div style="padding:12px;border:1px solid var(--border);border-radius:8px;margin-bottom:8px">
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
                        <div style="display:flex;align-items:center;gap:8px">
                            <span style="font-size:16px">${m.status === 'current' ? '🚀' : m.status === 'next' ? '📌' : '⏳'}</span>
                            <strong>${m.name}</strong>
                        </div>
                        <span style="font-size:12px;color:var(--text-muted)">${m.progress}%</span>
                    </div>
                    <div style="font-size:13px;color:var(--text-muted);margin-bottom:8px">${m.desc}</div>
                    <div style="height:6px;background:var(--border);border-radius:3px;overflow:hidden">
                        <div style="height:100%;width:${m.progress}%;background:${m.status === 'current' ? data.color : m.status === 'next' ? '#F59E0B' : '#E2E8F0'};transition:width 0.5s"></div>
                    </div>
                </div>
            `).join('')}
        </div>
        
        <div style="margin-bottom:16px">
            <div style="font-weight:600;font-size:14px;margin-bottom:10px">📚 推荐学习资源</div>
            ${data.resources.map(r => `
                <div style="display:flex;align-items:center;gap:12px;padding:10px;background:var(--bg);border-radius:8px;margin-bottom:6px">
                    <span style="font-size:12px;padding:4px 8px;background:rgba(91,110,232,0.1);color:var(--primary);border-radius:6px">${r.type}</span>
                    <div style="flex:1">
                        <div style="font-weight:500;font-size:13px">${r.title}</div>
                        <div style="font-size:12px;color:var(--text-muted)">${r.desc}</div>
                    </div>
                    <button class="btn btn-sm btn-primary" onclick="alert('资源已添加到学习清单')">📖</button>
                </div>
            `).join('')}
        </div>
        
        <div style="margin-bottom:16px">
            <div style="font-weight:600;font-size:14px;margin-bottom:10px">⚠️ 常见挑战</div>
            <div style="display:flex;flex-wrap:wrap;gap:6px">
                ${data.challenges.map(c => `<span style="padding:4px 12px;background:rgba(239,68,68,0.08);color:var(--danger);border-radius:14px;font-size:12px">${c}</span>`).join('')}
            </div>
        </div>
        
        <div style="padding:12px;background:rgba(34,197,94,0.05);border-radius:8px">
            <div style="font-weight:600;font-size:13px;margin-bottom:6px">💡 成长建议</div>
            <ul style="margin:0;padding-left:20px;font-size:13px;color:var(--text-muted);line-height:1.8">
                ${data.tips.map(t => `<li>${t}</li>`).join('')}
            </ul>
        </div>
        
        <div style="text-align:right;margin-top:16px">
            <button class="btn btn-primary btn-sm" onclick="lpSavePlan()">💾 保存学习计划</button>
            <button class="btn btn-secondary btn-sm" onclick="lpSharePlan()">📤 分享给同行</button>
        </div>
    `;
}

function lpSavePlan() {
    alert('学习计划已保存到个人中心。\\n\\n（Demo 功能：实际使用时将在个人中心显示学习进度）');
}

function lpSharePlan() {
    alert('学习计划链接已复制到剪贴板。\\n\\n（Demo 功能：实际使用时将生成可分享的学习计划链接）');
}

function renderCaseLibraryTool(container) {
    container.innerHTML = `
        <div style="font-size:13px;color:var(--text-muted);margin-bottom:16px">三大咨询流派的完整示范案例，帮助您理解不同理论框架下的咨询实践</div>
        
        <div style="display:flex;gap:4px;background:var(--bg);padding:4px;border-radius:12px;margin-bottom:20px">
            <button class="cl-btn btn btn-sm btn-primary" onclick="clSelectSchool('cbt')" data-school="cbt">🧠 CBT</button>
            <button class="cl-btn btn btn-sm btn-secondary" onclick="clSelectSchool('psychodynamic')" data-school="psychodynamic">🌀 精神动力学</button>
            <button class="cl-btn btn btn-sm btn-secondary" onclick="clSelectSchool('humanistic')" data-school="humanistic">💝 人本主义</button>
        </div>
        
        <div id="clResult"></div>
    `;
    clSelectSchool('cbt');
}

function clSelectSchool(school) {
    document.querySelectorAll('.cl-btn').forEach(btn => {
        btn.classList.remove('btn-primary');
        btn.classList.add('btn-secondary');
        if (btn.dataset.school === school) {
            btn.classList.remove('btn-secondary');
            btn.classList.add('btn-primary');
        }
    });
    
    const result = document.getElementById('clResult');
    if (!result) return;
    
    const caseData = {
        cbt: {
            title: '🧠 CBT 认知行为治疗案例',
            subtitle: '社交焦虑障碍的CBT治疗',
            color: '#6366F1',
            school: '认知行为治疗',
            theory: 'CBT认为情绪和行为问题源于不合理的思维模式。治疗目标是识别和挑战这些思维，并用更现实、更适应的思维替代。',
            case: {
                client: '李明，28岁，程序员',
                problem: '社交焦虑障碍，无法在工作会议中发言，回避社交场合，严重影响职业发展',
                duration: '8次咨询',
                stages: [
                    { name: '第1-2次：评估与建立关系', desc: '收集病史，完成SAS/SDS测评，建立咨询关系，介绍CBT基本原理', keyTech: '结构化访谈、心理教育' },
                    { name: '第3-4次：认知概念化', desc: '帮助来访者识别自动思维（如"他们会觉得我很蠢"），探索核心信念（"我是无能的"）', keyTech: '思维记录表、苏格拉底式提问' },
                    { name: '第5-6次：认知重构', desc: '通过证据检验挑战自动思维，学习认知歪曲识别，进行行为实验检验信念', keyTech: '认知重构、行为实验' },
                    { name: '第7-8次：暴露与巩固', desc: '逐级暴露练习（从小组讨论到部门汇报），巩固新思维模式，预防复发', keyTech: '逐级暴露、复发预防' }
                ],
                outcome: '来访者能够在会议中主动发言，社交焦虑评分从82分降至45分，职业发展得到明显改善',
                keyTakeaways: ['识别自动思维是CBT的核心', '行为实验是检验信念的有效方法', '逐级暴露需要循序渐进', '家庭作业是CBT成功的关键']
            }
        },
        psychodynamic: {
            title: '🌀 精神动力学案例',
            subtitle: '抑郁情绪的精神动力学理解与治疗',
            color: '#8B5CF6',
            school: '精神动力学治疗',
            theory: '精神动力学认为心理问题源于潜意识的冲突和早期经历。治疗目标是帮助来访者觉察潜意识动机，实现人格整合。',
            case: {
                client: '王芳，35岁，教师',
                problem: '反复发作的抑郁情绪，人际关系困难，无法建立亲密关系',
                duration: '16次咨询',
                stages: [
                    { name: '第1-4次：建立联盟与自由联想', desc: '建立安全的咨询关系，引导自由联想，开始探索来访者的内在世界', keyTech: '自由联想、共情倾听' },
                    { name: '第5-8次：阻抗分析', desc: '识别咨询中的阻抗表现（迟到、沉默、回避话题），理解阻抗背后的潜意识动机', keyTech: '阻抗分析、面质' },
                    { name: '第9-12次：移情分析', desc: '探索来访者对咨询师的移情反应，理解早期客体关系如何影响当前人际关系', keyTech: '移情分析、解释' },
                    { name: '第13-16次：修通与整合', desc: '整合领悟，帮助来访者理解早期经历与当前问题的联系，促进人格成长', keyTech: '修通、工作联盟巩固' }
                ],
                outcome: '来访者能够识别自己的情感模式，抑郁发作频率明显降低，开始建立健康的亲密关系',
                keyTakeaways: ['安全的咨询关系是探索潜意识的基础', '阻抗是理解潜意识的窗口', '移情是治疗的核心工具', '耐心是精神动力学治疗的关键']
            }
        },
        humanistic: {
            title: '💝 人本主义案例',
            subtitle: '自我认同困惑的以人为中心治疗',
            color: '#F475A8',
            school: '以人为中心治疗',
            theory: '人本主义认为人具有自我实现的潜能。治疗目标是提供无条件积极关注、共情和真诚，帮助来访者自我觉察和成长。',
            case: {
                client: '张雪，22岁，大学生',
                problem: '自我认同困惑，对未来感到迷茫，缺乏自信',
                duration: '10次咨询',
                stages: [
                    { name: '第1-3次：建立安全氛围', desc: '提供无条件积极关注，让来访者感到被接纳和理解，开始表达内心感受', keyTech: '无条件积极关注、共情理解' },
                    { name: '第4-6次：自我探索', desc: '在安全的氛围中，来访者开始探索自己的价值观、兴趣和需求', keyTech: '真诚一致、反射性倾听' },
                    { name: '第7-8次：自我接纳', desc: '帮助来访者接纳自己的全部，包括不完美的部分，培养自我关怀', keyTech: '自我接纳练习、自我关怀' },
                    { name: '第9-10次：自我实现', desc: '来访者明确自己的目标和方向，开始做出符合自我价值观的选择', keyTech: '目标设定、行动计划' }
                ],
                outcome: '来访者明确了自己的职业方向，自信心明显提升，能够做出自主的人生选择',
                keyTakeaways: ['来访者是自己最好的专家', '无条件积极关注是改变的催化剂', '共情理解帮助来访者感到被看见', '真诚一致建立信任关系']
            }
        }
    };
    
    const data = caseData[school];
    if (!data) return;
    
    result.innerHTML = `
        <div style="padding:16px;background:${data.color}08;border-radius:12px;margin-bottom:16px">
            <div style="font-weight:700;font-size:18px;color:${data.color}">${data.title}</div>
            <div style="font-size:13px;color:var(--text-muted);margin-top:4px">${data.subtitle}</div>
        </div>
        
        <div style="padding:12px;background:rgba(91,110,232,0.05);border-radius:8px;margin-bottom:16px">
            <div style="font-weight:600;font-size:13px;margin-bottom:6px;color:var(--primary)">📚 ${data.school}</div>
            <div style="font-size:13px;color:var(--text-muted);line-height:1.6">${data.theory}</div>
        </div>
        
        <div style="margin-bottom:16px">
            <div style="font-weight:600;font-size:14px;margin-bottom:10px">👤 案例概况</div>
            <div style="display:flex;flex-wrap:wrap;gap:8px">
                <span style="padding:6px 12px;background:var(--bg);border-radius:8px;font-size:13px">${data.case.client}</span>
                <span style="padding:6px 12px;background:var(--bg);border-radius:8px;font-size:13px">${data.case.problem}</span>
                <span style="padding:6px 12px;background:var(--bg);border-radius:8px;font-size:13px">咨询时长：${data.case.duration}</span>
            </div>
        </div>
        
        <div style="margin-bottom:16px">
            <div style="font-weight:600;font-size:14px;margin-bottom:10px">📊 治疗阶段</div>
            ${data.case.stages.map((stage, i) => `
                <div style="padding:14px;border:1px solid ${data.color}20;border-radius:10px;margin-bottom:8px;background:${data.color}03">
                    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:6px">
                        <div style="font-weight:600;font-size:14px;color:${data.color}">${stage.name}</div>
                        <span style="font-size:12px;padding:2px 8px;background:${data.color}20;color:${data.color};border-radius:6px">${stage.keyTech}</span>
                    </div>
                    <div style="font-size:13px;color:var(--text-muted);line-height:1.6">${stage.desc}</div>
                </div>
            `).join('')}
        </div>
        
        <div style="padding:14px;background:rgba(34,197,94,0.05);border-left:4px solid var(--success);border-radius:8px;margin-bottom:16px">
            <div style="font-weight:600;font-size:14px;margin-bottom:6px">🎯 治疗效果</div>
            <div style="font-size:13px;color:var(--text);line-height:1.6">${data.case.outcome}</div>
        </div>
        
        <div style="padding:12px;background:rgba(245,158,11,0.05);border-radius:8px">
            <div style="font-weight:600;font-size:13px;margin-bottom:6px">💡 核心要点</div>
            <ul style="margin:0;padding-left:20px;font-size:13px;color:var(--text-muted);line-height:1.8">
                ${data.case.keyTakeaways.map(t => `<li>${t}</li>`).join('')}
            </ul>
        </div>
        
        <div style="text-align:right;margin-top:16px">
            <button class="btn btn-primary btn-sm" onclick="clDownloadCase()">📥 下载案例文档</button>
            <button class="btn btn-secondary btn-sm" onclick="clShareCase()">📤 分享给同行</button>
        </div>
    `;
}

function clDownloadCase() {
    alert('案例文档已下载。\\n\\n（Demo 功能：实际使用时将生成PDF格式的完整案例文档）');
}

function clShareCase() {
    alert('案例链接已复制到剪贴板。\\n\\n（Demo 功能：实际使用时将生成可分享的案例链接）');
}

function renderCrisisAssessTool(container) {
    container.innerHTML = `
        <div style="font-size:13px;color:var(--text-muted);margin-bottom:16px">自杀/自伤风险评估清单，辅助咨询师进行危机等级判断</div>
        
        <div style="padding:12px;background:rgba(239,68,68,0.05);border:1px solid rgba(239,68,68,0.2);border-radius:8px;margin-bottom:16px">
            <strong style="color:var(--danger)">⚠️ 重要提示</strong>
            <div style="font-size:12px;color:var(--text-muted);margin-top:4px">本工具仅为辅助评估清单，不能替代专业的临床判断。如遇高危情况，请立即启动危机干预预案。</div>
        </div>
        
        <div class="form-group">
            <label>来访者姓名</label>
            <input type="text" id="crName" placeholder="选填">
        </div>
        
        <div style="font-weight:600;font-size:14px;margin-bottom:8px">一、自杀意念评估</div>
        <div style="margin-bottom:12px">
            ${['有被动自杀意念（希望自己死去）', '有主动自杀意念（想要结束生命）', '有具体的自杀计划', '有近期实施的意图（24小时内）'].map((item, i) => `
                <label style="display:flex;align-items:flex-start;gap:8px;margin-bottom:6px;font-size:13px;cursor:pointer">
                    <input type="checkbox" class="cr-item" data-level="${i + 1}" onchange="crCalculate()">
                    <span>${item}</span>
                </label>
            `).join('')}
        </div>
        
        <div style="font-weight:600;font-size:14px;margin-bottom:8px">二、自伤行为评估</div>
        <div style="margin-bottom:12px">
            ${['有无自杀意图的自伤史', '近1个月有自伤行为', '自伤频率增加/程度加重'].map((item, i) => `
                <label style="display:flex;align-items:flex-start;gap:8px;margin-bottom:6px;font-size:13px;cursor:pointer">
                    <input type="checkbox" class="cr-item" data-level="${i + 1}" onchange="crCalculate()">
                    <span>${item}</span>
                </label>
            `).join('')}
        </div>
        
        <div style="font-weight:600;font-size:14px;margin-bottom:8px">三、风险因素</div>
        <div style="margin-bottom:12px">
            ${['有具体的方法和工具', '有自杀未遂史', '近期有重大丧失（亲人离世/分手/失业等）', '社会支持系统薄弱/孤立无援', '有物质滥用', '患有严重躯体疾病', '家族自杀史'].map((item, i) => `
                <label style="display:flex;align-items:flex-start;gap:8px;margin-bottom:6px;font-size:13px;cursor:pointer">
                    <input type="checkbox" class="cr-item" data-level="${1}" onchange="crCalculate()">
                    <span>${item}</span>
                </label>
            `).join('')}
        </div>
        
        <div style="font-weight:600;font-size:14px;margin-bottom:8px">四、保护因素</div>
        <div style="margin-bottom:12px">
            ${['有强烈的生存理由（孩子/家人等）', '愿意接受帮助并签订安全契约', '有良好的社会支持', '对未来有希望'].map(item => `
                <label style="display:flex;align-items:flex-start;gap:8px;margin-bottom:6px;font-size:13px;cursor:pointer">
                    <input type="checkbox" class="cr-protective" onchange="crCalculate()">
                    <span>${item}</span>
                </label>
            `).join('')}
        </div>
        
        <div id="crResult" style="margin-top:16px"></div>
    `;
}

function crCalculate() {
    const riskItems = document.querySelectorAll('.cr-item:checked');
    const protectItems = document.querySelectorAll('.cr-protective:checked');
    const result = document.getElementById('crResult');
    if (!result) return;
    
    let riskScore = 0;
    riskItems.forEach(item => {
        riskScore += parseInt(item.dataset.level) || 1;
    });
    
    let maxIdeation = 0;
    riskItems.forEach(item => {
        const lvl = parseInt(item.dataset.level) || 0;
        if (lvl > maxIdeation) maxIdeation = lvl;
    });
    
    let riskLevel, riskColor, riskDesc, action;
    
    if (maxIdeation >= 4 || riskScore >= 12) {
        riskLevel = '极高风险';
        riskColor = '#EF4444';
        riskDesc = '来访者有立即实施自杀的危险，需立即启动危机干预';
        action = '立即启动危机干预预案，确保来访者安全，必要时联系紧急联系人或送医';
    } else if (maxIdeation >= 3 || riskScore >= 8) {
        riskLevel = '高风险';
        riskColor = '#F97316';
        riskDesc = '来访者有明确的自杀计划，需要密切关注和干预';
        action = '制定详细安全计划，增加联系频率，考虑通知家属，建议加强治疗密度';
    } else if (maxIdeation >= 1 || riskScore >= 4) {
        riskLevel = '中风险';
        riskColor = '#F59E0B';
        riskDesc = '来访者有自杀意念或自伤史，存在一定风险';
        action = '定期评估风险状态，建立安全契约，纳入咨询目标进行持续干预';
    } else if (riskScore >= 1) {
        riskLevel = '低风险';
        riskColor = '#22C55E';
        riskDesc = '风险因素较少，但仍需持续关注';
        action = '继续关注情绪变化，每次咨询例行筛查，强化保护因素';
    } else {
        riskLevel = '未检出明显风险';
        riskColor = '#22C55E';
        riskDesc = '当前未检出明显的自杀自伤风险因素';
        action = '继续定期筛查，关注情绪变化，保持咨询关系';
    }
    
    const protectBonus = protectItems.length >= 3 ? '保护因素较多，有一定缓冲作用' : '';
    
    result.innerHTML = `
        <div style="padding:16px;border:2px solid ${riskColor};border-radius:8px;background:${riskColor}08">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
                <strong style="font-size:16px;color:${riskColor}">风险等级：${riskLevel}</strong>
                <span style="font-size:12px;color:var(--text-muted)">风险评分：${riskScore} 分</span>
            </div>
            <div style="font-size:13px;color:var(--text);margin-bottom:8px">${riskDesc}</div>
            ${protectBonus ? `<div style="font-size:12px;color:var(--success);margin-bottom:8px">✅ ${protectBonus}</div>` : ''}
            <div style="padding:10px;background:white;border-radius:6px;font-size:13px;line-height:1.6">
                <strong>建议行动：</strong><br>${action}
            </div>
        </div>
        <div style="text-align:right;margin-top:12px">
            <button class="btn btn-primary btn-sm" onclick="alert('评估结果已保存')">💾 保存评估记录</button>
        </div>
    `;
}

// ===== 督导审阅 =====
async function renderSupervisorReview() {
    const records = await Storage.get('records', []);
    const clients = await Storage.get('clients', []);
    const reviews = await Storage.get('supervisorReviews', []);
    
    const container = document.getElementById('supervisorReviewContent');
    if (!container) return;
    
    // 找出高风险记录
    const highRiskRecords = records.filter(r => r.risk === '高风险').sort((a,b)=>b.date.localeCompare(a.date));
    
    let html = `<div class="card">
        <div class="card-header"><div class="card-title">待审阅记录（高风险）</div></div>`;
    
    if (highRiskRecords.length === 0) {
        html += '<div class="empty-state"><div class="empty-state-icon">✅</div><h3>暂无待审阅记录</h3></div>';
    } else {
        html += '<div>';
        highRiskRecords.forEach(r => {
            const c = clients.find(x => x.id === r.clientId);
            const reviewed = reviews.find(v => v.recordId === r.id);
            html += `<div style="padding:16px;border-bottom:1px solid var(--border)">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
                    <div><strong>${c ? c.name : '-'}</strong> · ${r.date} · <span class="badge badge-danger">${r.risk}</span></div>
                    ${reviewed ? '<span class="badge badge-success">已审阅</span>' : '<span class="badge badge-warning">待审阅</span>'}
                </div>
                <div style="font-size:13px;color:var(--text-muted);margin-bottom:8px">${r.subContent}</div>
                <div style="font-size:13px;margin-bottom:8px"><strong>洞察：</strong>${r.insight || '-'}</div>
                ${reviewed ? `<div style="padding:8px;background:var(--bg);border-radius:8px;font-size:13px"><strong>督导评语：</strong>${reviewed.comment}</div>` : `
                    <div class="form-group" style="margin-top:8px">
                        <textarea id="review_${r.id}" rows="2" placeholder="输入督导评语..."></textarea>
                        <button class="btn btn-sm btn-primary" style="margin-top:8px" onclick="submitReview('${r.id}')">提交评语</button>
                    </div>
                `}
            </div>`;
        });
        html += '</div>';
    }
    html += '</div>';
    
    container.innerHTML = html;
    showPage('supervisorReview');
}

async function submitReview(recordId) {
    const comment = document.getElementById('review_' + recordId).value.trim();
    if (!comment) { alert('请输入评语'); return; }
    
    const review = {
        id: 'sr' + Date.now(),
        recordId,
        comment,
        reviewer: currentUser.name,
        reviewerId: currentUser.id,
        date: formatDate(new Date()),
        time: formatTime(new Date())
    };
    
    await Storage.putOne('supervisorReviews', review);
    await db.logOperation('review', 'record', recordId, { comment });
    
    alert('评语已提交');
    await renderSupervisorReview();
}

// ===== 督导反馈（咨询师端） =====
async function renderSupervisorFeedback() {
    const container = document.getElementById('supervisorFeedbackContent');
    if (!container) return;

    const reviews = await Storage.get('supervisorReviews', []);
    const records = await Storage.get('records', []);
    const clients = await Storage.get('clients', []);

    // 当前咨询师负责的来访者
    const myClientIds = clients.filter(c => c.counselorId === currentUser.id).map(c => c.id);
    const myRecordIds = records.filter(r => myClientIds.includes(r.clientId)).map(r => r.id);
    const myReviews = reviews.filter(v => myRecordIds.includes(v.recordId)).sort((a,b)=>(b.date+b.time).localeCompare(a.date+a.time));

    const newCount = myReviews.filter(v => !v.acknowledged).length;

    let html = `<div class="card">
        <div class="card-header">
            <div>
                <div class="card-title">📬 督导反馈</div>
                <div class="card-subtitle">共 ${myReviews.length} 条 · 未读 ${newCount} 条</div>
            </div>
            ${newCount > 0 ? `<button class="btn btn-sm btn-secondary" onclick="acknowledgeAllReviews()">全部标为已读</button>` : ''}
        </div>`;

    if (myReviews.length === 0) {
        html += '<div class="empty-state"><div class="empty-state-icon">📭</div><h3>暂无督导反馈</h3><p>督导审阅您的咨询记录后，评语会显示在这里</p></div>';
    } else {
        html += '<div>';
        myReviews.forEach(v => {
            const r = records.find(x => x.id === v.recordId);
            const c = r ? clients.find(x => x.id === r.clientId) : null;
            html += `<div style="padding:16px;border-bottom:1px solid var(--border);${v.acknowledged ? 'opacity:0.7;' : 'background:rgba(91,110,232,0.03);'}">
                <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px">
                    <div>
                        <strong>${c ? c.name : '-'}</strong>
                        <span style="color:var(--text-muted);font-size:12px;margin-left:8px">${v.date} ${v.time}</span>
                        ${v.acknowledged ? '<span class="badge badge-success" style="margin-left:8px">已读</span>' : '<span class="badge badge-warning" style="margin-left:8px">未读</span>'}
                    </div>
                    ${r ? `<button class="btn btn-sm btn-secondary" onclick="viewRecord('${r.id}')">查看记录</button>` : ''}
                </div>
                <div style="padding:10px 12px;background:var(--bg);border-radius:8px;font-size:13px;line-height:1.7;margin-bottom:8px">
                    <strong style="color:var(--primary)">督导 ${v.reviewer}：</strong>${v.comment}
                </div>
                ${r ? `<div style="font-size:12px;color:var(--text-muted)">原记录：${r.date} · ${r.subContent ? r.subContent.slice(0,40) : '-'}...</div>` : ''}
                ${!v.acknowledged ? `<button class="btn btn-sm btn-primary" style="margin-top:8px" onclick="acknowledgeReview('${v.id}')">确认已读</button>` : ''}
            </div>`;
        });
        html += '</div>';
    }
    html += '</div>';

    container.innerHTML = html;
}

async function acknowledgeReview(reviewId) {
    const reviews = await Storage.get('supervisorReviews', []);
    const idx = reviews.findIndex(v => v.id === reviewId);
    if (idx === -1) return;
    reviews[idx].acknowledged = true;
    reviews[idx].acknowledgedAt = formatDate(new Date()) + ' ' + formatTime(new Date());
    await Storage.put('supervisorReviews', reviews);
    await db.logOperation('acknowledge', 'supervisorReview', reviewId, {});
    showToast('已标记为已读');
    await renderSupervisorFeedback();
}

async function acknowledgeAllReviews() {
    const reviews = await Storage.get('supervisorReviews', []);
    const records = await Storage.get('records', []);
    const clients = await Storage.get('clients', []);
    const myClientIds = clients.filter(c => c.counselorId === currentUser.id).map(c => c.id);
    const myRecordIds = records.filter(r => myClientIds.includes(r.clientId)).map(r => r.id);
    let changed = 0;
    reviews.forEach(v => {
        if (myRecordIds.includes(v.recordId) && !v.acknowledged) {
            v.acknowledged = true;
            v.acknowledgedAt = formatDate(new Date()) + ' ' + formatTime(new Date());
            changed++;
        }
    });
    if (changed === 0) { showToast('没有未读反馈'); return; }
    await Storage.put('supervisorReviews', reviews);
    await db.logOperation('acknowledgeAll', 'supervisorReview', '', { count: changed });
    showToast(`已将 ${changed} 条反馈标为已读`);
    await renderSupervisorFeedback();
}

// ===== 初始化演示AI数据 =====
async function initDemoAIData() {
    const analyses = await Storage.get('aiAnalyses', []);
    if (analyses.length > 0) return;
    
    const mockAI = {
        id: 'ai_demo1',
        clientId: 'c2',
        filename: '张雪_咨询录音.mp3',
        date: formatDate(new Date(Date.now() - 5*24*60*60*1000)),
        duration: '52分钟',
        type: 'audio',
        summary: '本次咨询主要围绕社交焦虑展开。来访者在学校食堂独自就餐时感到明显不适，但通过上周的行为实验（向同学微笑），发现实际情况比预期好。核心信念"我不值得被喜欢"出现松动。',
        transcript: [
            { time: '00:03:15', text: '张雪：最近在学校还是不太敢跟人说话...', emotion: '焦虑', confidence: 0.89 },
            { time: '00:08:20', text: '咨询师：上周我们说的微笑实验，试了吗？', emotion: '中性', confidence: 0.94 },
            { time: '00:09:00', text: '张雪：试了一次...发现对方好像也没觉得奇怪。', emotion: '积极', confidence: 0.87 },
            { time: '00:15:30', text: '张雪：但是课间的时候，她们在聊天，我就不敢过去。', emotion: '悲伤', confidence: 0.91 },
            { time: '00:22:10', text: '张雪：有时候觉得...算了，不说了。', emotion: '回避', confidence: 0.85, risk: true },
            { time: '00:28:00', text: '咨询师：没关系，慢慢来。', emotion: '中性', confidence: 0.95 },
            { time: '00:34:12', text: '张雪：初二的时候...她们说我身上有味道。（声音很低）', emotion: '悲伤', confidence: 0.93 },
            { time: '00:47:30', text: '张雪：下周我想试试在食堂跟同桌一起吃。', emotion: '期待', confidence: 0.88 }
        ],
        emotions: [
            { time: '00:03:15', text: '提到学校时语速加快，焦虑情绪上升', tag: '焦虑上升' },
            { time: '00:09:00', text: '描述成功向同学微笑的经历，语调轻快', tag: '积极突破' },
            { time: '00:34:12', text: '提及初二霸凌事件时沉默约15秒，声音低沉', tag: '创伤触发' },
            { time: '00:47:30', text: '咨询结束时主动询问下周作业，参与感增强', tag: '合作性提升' }
        ],
        risks: [
            { time: '00:22:10', text: '出现回避性表述"算了，不说了"，需关注是否有未表达的负面情绪', level: '中' },
            { time: '00:34:12', text: '霸凌回忆触发时，需评估是否需要进行创伤处理', level: '中' }
        ],
        behaviors: []
    };
    
    await Storage.putOne('aiAnalyses', mockAI);
}

// ===== 机构管理 =====
async function renderOrganization() {
    const container = document.getElementById('organizationContent');
    if (!container) return;

    const users = await Storage.get('users', []);
    const clients = await Storage.get('clients', []);
    const records = await Storage.get('records', []);
    const assessments = await Storage.get('assessments', []);
    const reviews = await Storage.get('supervisorReviews', []);
    const appointments = await Storage.get('appointments', []);

    const counselors = users.filter(u => u.role === 'counselor');
    const supervisors = users.filter(u => u.role === 'supervisor');

    let html = '';

    // 机构概览
    html += `<div class="stats-grid">
        <div class="stat-card"><div class="stat-value">${counselors.length}</div><div class="stat-label">咨询师</div></div>
        <div class="stat-card"><div class="stat-value">${supervisors.length}</div><div class="stat-label">督导师</div></div>
        <div class="stat-card"><div class="stat-value">${clients.length}</div><div class="stat-label">在案来访者</div></div>
        <div class="stat-card"><div class="stat-value">${records.length}</div><div class="stat-label">累计咨询量</div></div>
    </div>`;

    // 咨询师团队
    html += `<div class="card">
        <div class="card-header">
            <div>
                <div class="card-title">👥 咨询师团队</div>
                <div class="card-subtitle">工作负载与督导关系</div>
            </div>
            ${currentUser && currentUser.role === 'admin' ? '<button class="btn btn-sm btn-primary" onclick="openModal(\'addUserModal\')">+ 添加成员</button>' : ''}
        </div>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:16px">`;

    counselors.forEach(u => {
        const counselorClients = clients.filter(c => c.counselorId === u.id);
        const counselorRecords = records.filter(r => counselorClients.some(c => c.id === r.clientId));
        const counselorAssess = assessments.filter(a => counselorClients.some(c => c.id === a.clientId));
        const counselorReviews = reviews.filter(v => {
            const r = records.find(x => x.id === v.recordId);
            return r && counselorClients.some(c => c.id === r.clientId);
        });
        const pendingReviews = counselorReviews.filter(v => !v.acknowledged).length;
        const highRiskCount = counselorClients.filter(c => c.riskLevel === '高风险' || c.riskLevel === '紧急').length;
        const supervisor = users.find(x => x.id === u.supervisorId);

        html += `<div style="background:var(--bg);border-radius:12px;padding:16px;border:1px solid var(--border)">
            <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px">
                <div style="width:44px;height:44px;background:linear-gradient(135deg,var(--primary),var(--secondary));border-radius:10px;display:flex;align-items:center;justify-content:center;color:white;font-weight:600;font-size:16px">${u.name.charAt(0)}</div>
                <div style="flex:1">
                    <div style="font-weight:600;font-size:15px">${u.name}</div>
                    <div style="font-size:12px;color:var(--text-muted)">咨询师 · ${counselorClients.length} 位来访者</div>
                </div>
                <span class="badge badge-primary">在职</span>
            </div>
            <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:12px;text-align:center">
                <div style="padding:8px;background:white;border-radius:8px">
                    <div style="font-size:18px;font-weight:700;color:var(--primary)">${counselorRecords.length}</div>
                    <div style="font-size:11px;color:var(--text-muted)">咨询记录</div>
                </div>
                <div style="padding:8px;background:white;border-radius:8px">
                    <div style="font-size:18px;font-weight:700;color:${highRiskCount>0?'var(--danger)':'var(--success)'}">${highRiskCount}</div>
                    <div style="font-size:11px;color:var(--text-muted)">高风险个案</div>
                </div>
                <div style="padding:8px;background:white;border-radius:8px">
                    <div style="font-size:18px;font-weight:700;color:${pendingReviews>0?'var(--warning)':'var(--text-muted)'}">${pendingReviews}</div>
                    <div style="font-size:11px;color:var(--text-muted)">待读督导</div>
                </div>
            </div>
            <div style="font-size:12px;color:var(--text-muted);margin-bottom:8px">
                督导：${supervisor ? supervisor.name : '<span style="color:var(--warning)">未分配</span>'}
            </div>
            ${currentUser && (currentUser.role === 'admin' || currentUser.role === 'supervisor') ? `
                <div style="display:flex;gap:6px">
                    <select onchange="assignSupervisor('${u.id}', this.value)" style="flex:1;padding:6px 10px;border:1px solid var(--border);border-radius:8px;font-size:12px">
                        <option value="">分配督导...</option>
                        ${supervisors.map(s => `<option value="${s.id}" ${u.supervisorId===s.id?'selected':''}>${s.name}</option>`).join('')}
                    </select>
                    <button class="btn btn-sm btn-secondary" onclick="viewCounselorClients('${u.id}')">查看个案</button>
                </div>
            ` : ''}
        </div>`;
    });

    html += '</div></div>';

    // 督导团队
    if (supervisors.length > 0) {
        html += `<div class="card">
            <div class="card-header"><div class="card-title">🎓 督导团队</div></div>
            <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:16px">`;

        supervisors.forEach(s => {
            const supervisedCounselors = counselors.filter(c => c.supervisorId === s.id);
            const sReviews = reviews.filter(v => v.reviewerId === s.id);
            const supervisedClientCount = clients.filter(c => supervisedCounselors.some(cn => cn.id === c.counselorId)).length;

            html += `<div style="background:linear-gradient(135deg,rgba(91,110,232,0.05),rgba(244,117,168,0.05));border-radius:12px;padding:16px;border:1px solid var(--border)">
                <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px">
                    <div style="width:48px;height:48px;background:linear-gradient(135deg,var(--secondary),var(--primary));border-radius:12px;display:flex;align-items:center;justify-content:center;color:white;font-weight:600;font-size:18px">${s.name.charAt(0)}</div>
                    <div>
                        <div style="font-weight:600;font-size:15px">${s.name}</div>
                        <div style="font-size:12px;color:var(--text-muted)">督导师 · 指导 ${supervisedCounselors.length} 位咨询师</div>
                    </div>
                </div>
                <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;text-align:center">
                    <div style="padding:8px;background:white;border-radius:8px">
                        <div style="font-size:16px;font-weight:700;color:var(--primary)">${supervisedClientCount}</div>
                        <div style="font-size:11px;color:var(--text-muted)">管辖个案</div>
                    </div>
                    <div style="padding:8px;background:white;border-radius:8px">
                        <div style="font-size:16px;font-weight:700;color:var(--info)">${sReviews.length}</div>
                        <div style="font-size:11px;color:var(--text-muted)">督导评语</div>
                    </div>
                    <div style="padding:8px;background:white;border-radius:8px">
                        <div style="font-size:16px;font-weight:700;color:var(--warning)">${supervisedCounselors.length}</div>
                        <div style="font-size:11px;color:var(--text-muted)">指导咨询师</div>
                    </div>
                </div>
            </div>`;
        });

        html += '</div></div>';
    }

    container.innerHTML = html;
}

async function assignSupervisor(counselorId, supervisorId) {
    const users = await Storage.get('users', []);
    const idx = users.findIndex(u => u.id === counselorId);
    if (idx === -1) return;
    users[idx].supervisorId = supervisorId || null;
    await Storage.put('users', users);
    await db.logOperation('assign', 'supervisor', counselorId, { supervisorId });
    showToast(supervisorId ? '已分配督导' : '已取消分配', 'success');
    await renderOrganization();
}

async function viewCounselorClients(counselorId) {
    const users = await Storage.get('users', []);
    const counselor = users.find(u => u.id === counselorId);
    // 跳转到来访者列表并筛选（此处简化：直接跳转列表页）
    showToast(`查看 ${counselor ? counselor.name : ''} 的来访者`);
    showPage('clients');
}

// 导航可见性控制
function updateNavVisibility() {
    const orgNav = document.getElementById('navOrganization');
    if (orgNav) {
        orgNav.style.display = (currentUser && (currentUser.role === 'admin' || currentUser.role === 'supervisor')) ? 'block' : 'none';
    }
}

// ===== 数据洞察 =====
async function renderInsights() {
    const container = document.getElementById('insightsContent');
    if (!container) return;

    const clients = await Storage.get('clients', []);
    const records = await Storage.get('records', []);
    const assessments = await Storage.get('assessments', []);
    const moods = await Storage.get('moods', []);
    const appointments = await Storage.get('appointments', []);

    // 筛选当前用户的来访者（咨询师视角）
    const myClients = currentUser && currentUser.role === 'counselor'
        ? clients.filter(c => c.counselorId === currentUser.id)
        : clients;
    const myClientIds = myClients.map(c => c.id);
    const myRecords = records.filter(r => myClientIds.includes(r.clientId));
    const myAssessments = assessments.filter(a => myClientIds.includes(a.clientId));
    const myMoods = moods.filter(m => myClientIds.includes(m.clientId));
    const myAppts = appointments.filter(a => myClientIds.includes(a.clientId));

    let html = '';

    // ========== 概览统计 ==========
    html += `<div class="stats-grid">
        <div class="stat-card"><div class="stat-value">${myClients.length}</div><div class="stat-label">在案来访者</div></div>
        <div class="stat-card"><div class="stat-value">${myRecords.length}</div><div class="stat-label">累计咨询次数</div></div>
        <div class="stat-card"><div class="stat-value">${myAssessments.length}</div><div class="stat-label">测评总次数</div></div>
        <div class="stat-card"><div class="stat-value" style="color:var(--success)">${calculateImprovementRate(myClients, myAssessments)}%</div><div class="stat-label">整体好转率</div></div>
    </div>`;

    // ========== 疗效趋势分析 ==========
    html += `<div class="overview-grid">
        <div class="overview-card">
            <div class="overview-header"><h3>📈 疗效趋势（最近8周）</h3></div>
            ${renderTrendChart(myAssessments, myMoods)}
        </div>
        <div class="overview-card">
            <div class="overview-header"><h3>🎯 风险分布</h3></div>
            ${renderRiskDistribution(myClients, myAssessments)}
        </div>
    </div>`;

    // ========== 智能洞察建议 ==========
    const insights = generateInsights(myClients, myRecords, myAssessments, myMoods, myAppts);
    html += `<div class="card">
        <div class="card-header">
            <div>
                <div class="card-title">💡 智能洞察</div>
                <div class="card-subtitle">基于咨询数据生成的分析建议</div>
            </div>
            <span class="badge badge-primary">Beta</span>
        </div>
        <div style="display:flex;flex-direction:column;gap:12px">
            ${insights.length === 0 ? '<p style="color:var(--text-muted);padding:12px">数据不足，继续积累咨询记录以获取更多洞察</p>' : insights.map(item => `
                <div style="padding:14px 16px;border-radius:10px;background:${item.color}08;border-left:4px solid ${item.color}">
                    <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
                        <span style="font-size:18px">${item.icon}</span>
                        <strong style="font-size:14px">${item.title}</strong>
                        ${item.tag ? `<span style="font-size:11px;padding:2px 8px;background:${item.color}20;color:${item.color};border-radius:10px;margin-left:auto">${item.tag}</span>` : ''}
                    </div>
                    <div style="font-size:13px;color:var(--text);line-height:1.7;padding-left:28px">${item.detail}</div>
                </div>
            `).join('')}
        </div>
    </div>`;

    // ========== 来访者疗效排行 ==========
    const clientProgress = getClientProgressList(myClients, myAssessments, myRecords);
    html += `<div class="card">
        <div class="card-header"><div class="card-title">📊 来访者疗效追踪</div></div>
        <table class="table">
            <thead><tr><th>来访者</th><th>咨询次数</th><th>测评变化</th><th>进展评估</th><th>操作</th></tr></thead>
            <tbody>
                ${clientProgress.length === 0 ? '<tr><td colspan="5" class="empty-state" style="padding:32px"><div class="empty-state-icon">📊</div><h3>暂无数据</h3></td></tr>' : clientProgress.map(item => `
                    <tr>
                        <td><strong>${item.name}</strong></td>
                        <td>${item.recordCount} 次</td>
                        <td>
                            ${item.scoreChange !== null ? `
                                <span style="color:${item.scoreChange < 0 ? 'var(--success)' : item.scoreChange > 0 ? 'var(--danger)' : 'var(--text-muted)'};font-weight:600">
                                    ${item.scoreChange > 0 ? '+' : ''}${item.scoreChange}分
                                </span>
                                <span style="font-size:11px;color:var(--text-muted)">(${item.firstScore} → ${item.lastScore})</span>
                            ` : '<span style="color:var(--text-muted)">无测评</span>'}
                        </td>
                        <td><span class="badge ${item.progressClass}">${item.progressText}</span></td>
                        <td><button class="btn btn-sm btn-secondary" onclick="viewClient('${item.id}')">查看档案</button></td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    </div>`;

    // ========== 数据关联分析 ==========
    const correlationData = calculateCorrelations(myClients, myRecords, myAssessments, myMoods, myAppts);
    html += `<div class="card">
        <div class="card-header">
            <div>
                <div class="card-title">🔗 数据关联分析</div>
                <div class="card-subtitle">测评-记录-情绪三维关联分析</div>
            </div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px;margin-bottom:20px">
            <div style="padding:16px;background:rgba(91,110,232,0.05);border-radius:12px">
                <div style="font-size:12px;color:var(--text-muted);margin-bottom:8px">测评与情绪相关性</div>
                <div style="font-weight:700;font-size:24px;color:var(--primary)">${correlationData.moodCorrelation}</div>
                <div style="font-size:12px;color:${correlationData.moodCorrelationStrength === '强' ? 'var(--success)' : correlationData.moodCorrelationStrength === '中等' ? 'var(--warning)' : 'var(--text-muted)'};margin-top:4px">
                    ${correlationData.moodCorrelationStrength}相关
                </div>
            </div>
            <div style="padding:16px;background:rgba(34,197,94,0.05);border-radius:12px">
                <div style="font-size:12px;color:var(--text-muted);margin-bottom:8px">最优咨询频率</div>
                <div style="font-weight:700;font-size:24px;color:var(--success)">${correlationData.optimalFrequency}</div>
                <div style="font-size:12px;color:var(--text-muted);margin-top:4px">效果最佳</div>
            </div>
            <div style="padding:16px;background:rgba(245,158,11,0.05);border-radius:12px">
                <div style="font-size:12px;color:var(--text-muted);margin-bottom:8px">最有效技术</div>
                <div style="font-weight:700;font-size:24px;color:var(--warning)">${correlationData.bestTechnique}</div>
                <div style="font-size:12px;color:var(--text-muted);margin-top:4px">成功率 ${correlationData.bestTechniqueRate}</div>
            </div>
        </div>
        
        ${correlationData.insights.length > 0 ? `
            <div style="display:flex;flex-direction:column;gap:8px">
                ${correlationData.insights.map(insight => `
                    <div style="padding:12px;background:rgba(91,110,232,0.05);border-radius:8px;border-left:3px solid var(--primary)">
                        <div style="font-weight:600;font-size:14px">💡 ${insight.title}</div>
                        <div style="font-size:13px;color:var(--text-muted);margin-top:4px">${insight.detail}</div>
                    </div>
                `).join('')}
            </div>
        ` : ''}
    </div>`;

    // ========== 工作量分析 ==========
    const workload = calculateWorkload(myRecords, myAppts);
    html += `<div class="overview-grid">
        <div class="overview-card">
            <div class="overview-header"><h3>⏱️ 本月工作量</h3></div>
            <div class="overview-item"><span class="overview-item-label">咨询总时长</span><span class="overview-item-value"><strong>${workload.totalMinutes}</strong> 分钟</span></div>
            <div class="overview-item"><span class="overview-item-label">咨询次数</span><span class="overview-item-value">${workload.recordCount} 次</span></div>
            <div class="overview-item"><span class="overview-item-label">平均时长</span><span class="overview-item-value">${workload.avgMinutes} 分钟</span></div>
            <div class="overview-item"><span class="overview-item-label">活跃来访者</span><span class="overview-item-value">${workload.activeClients} 人</span></div>
        </div>
        <div class="overview-card">
            <div class="overview-header"><h3>🧩 常用技术分布</h3></div>
            ${renderTechDistribution(myRecords)}
        </div>
    </div>`;

    // ========== 风险防控中心 ==========
    const riskData = calculateRiskData(myClients, myRecords, myAssessments, myMoods, myAppts);
    html += `<div class="card">
        <div class="card-header">
            <div>
                <div class="card-title">🛡️ 风险防控中心</div>
                <div class="card-subtitle">综合风险评估与预警</div>
            </div>
            <span class="badge ${riskData.highCount > 0 ? 'badge-danger' : 'badge-success'}">
                ${riskData.highCount > 0 ? `${riskData.highCount} 高风险` : '全部低风险'}
            </span>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:20px">
            <div style="padding:16px;background:rgba(239,68,68,0.05);border-radius:12px">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
                    <span style="font-size:14px;color:var(--danger)">🔴 高风险来访者</span>
                    <span style="font-weight:700;font-size:24px;color:var(--danger)">${riskData.highCount}</span>
                </div>
                <div style="font-size:12px;color:var(--text-muted)">需立即关注</div>
            </div>
            <div style="padding:16px;background:rgba(245,158,11,0.05);border-radius:12px">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
                    <span style="font-size:14px;color:var(--warning)">🟠 社交隔离预警</span>
                    <span style="font-weight:700;font-size:24px;color:var(--warning)">${riskData.isolationCount}</span>
                </div>
                <div style="font-size:12px;color:var(--text-muted)">社交活动较少</div>
            </div>
        </div>
        
        ${riskData.highRiskClients.length > 0 ? `
            <div style="margin-bottom:16px">
                <div style="font-weight:600;margin-bottom:12px">⚠️ 高风险来访者列表</div>
                <div style="display:flex;flex-direction:column;gap:8px">
                    ${riskData.highRiskClients.map(c => `
                        <div style="padding:12px;background:rgba(239,68,68,0.05);border-radius:8px;border-left:3px solid var(--danger);display:flex;justify-content:space-between;align-items:center">
                            <div>
                                <div style="font-weight:600">${c.name}</div>
                                <div style="font-size:12px;color:var(--text-muted)">${c.riskReason}</div>
                            </div>
                            <button class="btn btn-sm btn-danger" onclick="viewClient('${c.id}')">查看详情</button>
                        </div>
                    `).join('')}
                </div>
            </div>
        ` : ''}
        
        ${riskData.isolationClients.length > 0 ? `
            <div style="margin-bottom:16px">
                <div style="font-weight:600;margin-bottom:12px">🟠 社交隔离预警</div>
                <div style="display:flex;flex-direction:column;gap:8px">
                    ${riskData.isolationClients.map(c => `
                        <div style="padding:12px;background:rgba(245,158,11,0.05);border-radius:8px;border-left:3px solid var(--warning);display:flex;justify-content:space-between;align-items:center">
                            <div>
                                <div style="font-weight:600">${c.name}</div>
                                <div style="font-size:12px;color:var(--text-muted)">隔离指数：${c.isolationScore}/100 · ${c.isolationReason}</div>
                            </div>
                            <button class="btn btn-sm btn-warning" onclick="viewClient('${c.id}')">查看详情</button>
                        </div>
                    `).join('')}
                </div>
            </div>
        ` : ''}
        
        <div style="padding:12px;background:rgba(91,110,232,0.05);border-radius:8px;font-size:13px">
            <strong>💡 危机干预提示：</strong>发现高风险来访者时，请立即评估危机程度，建立安全计划，并在必要时通知紧急联系人。
        </div>
    </div>`;

    // ========== 咨询师能力发展中心 ==========
    const counselorData = calculateCounselorData(myRecords, myClients);
    html += `<div class="card">
        <div class="card-header">
            <div>
                <div class="card-title">🎓 咨询师能力发展中心</div>
                <div class="card-subtitle">基于咨询数据的能力评估与成长建议</div>
            </div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px;margin-bottom:20px">
            <div style="padding:16px;background:rgba(91,110,232,0.05);border-radius:12px">
                <div style="font-size:12px;color:var(--text-muted);margin-bottom:8px">咨询风格</div>
                <div style="font-weight:700;font-size:20px;color:var(--primary)">${counselorData.style}</div>
                <div style="font-size:12px;color:var(--text-muted);margin-top:4px">${counselorData.styleDesc}</div>
            </div>
            <div style="padding:16px;background:rgba(34,197,94,0.05);border-radius:12px">
                <div style="font-size:12px;color:var(--text-muted);margin-bottom:8px">擅长技术</div>
                <div style="font-weight:700;font-size:20px;color:var(--success)">${counselorData.bestTechnique}</div>
                <div style="font-size:12px;color:var(--text-muted);margin-top:4px">使用率 ${counselorData.bestTechniqueRate}</div>
            </div>
            <div style="padding:16px;background:rgba(245,158,11,0.05);border-radius:12px">
                <div style="font-size:12px;color:var(--text-muted);margin-bottom:8px">擅长领域</div>
                <div style="font-weight:700;font-size:20px;color:var(--warning)">${counselorData.bestArea}</div>
                <div style="font-size:12px;color:var(--text-muted);margin-top:4px">${counselorData.bestAreaCount} 位来访者</div>
            </div>
        </div>
        
        ${counselorData.growthAreas.length > 0 ? `
            <div style="margin-bottom:16px">
                <div style="font-weight:600;margin-bottom:12px">📈 待提升领域</div>
                <div style="display:flex;flex-direction:column;gap:8px">
                    ${counselorData.growthAreas.map(area => `
                        <div style="padding:12px;background:rgba(245,158,11,0.05);border-radius:8px;border-left:3px solid var(--warning)">
                            <div style="font-weight:600">${area.name}</div>
                            <div style="font-size:13px;color:var(--text-muted);margin-top:4px">${area.suggestion}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        ` : ''}
        
        ${counselorData.learningSuggestions.length > 0 ? `
            <div style="padding:12px;background:rgba(34,197,94,0.05);border-radius:8px">
                <div style="font-weight:600;margin-bottom:8px">💡 学习推荐</div>
                <ul style="margin:0;padding-left:20px;font-size:13px">
                    ${counselorData.learningSuggestions.map(s => `<li>${s}</li>`).join('')}
                </ul>
            </div>
        ` : ''}
    </div>`;

    container.innerHTML = html;
}

// 计算整体好转率
function calculateImprovementRate(clients, assessments) {
    let improved = 0, total = 0;
    for (const c of clients) {
        const clientAssess = assessments.filter(a => a.clientId === c.id).sort((a,b) => a.date.localeCompare(b.date));
        if (clientAssess.length >= 2) {
            total++;
            if (clientAssess[clientAssess.length-1].score < clientAssess[0].score) improved++;
        }
    }
    return total > 0 ? Math.round(improved / total * 100) : 0;
}

// 计算风险数据
function calculateRiskData(clients, records, assessments, moods, appointments) {
    const highRiskClients = [];
    const isolationClients = [];
    let highCount = 0;
    let isolationCount = 0;
    
    clients.forEach(client => {
        const clientRecords = records.filter(r => r.clientId === client.id).sort((a,b) => b.date.localeCompare(a.date));
        const clientAssessments = assessments.filter(a => a.clientId === client.id).sort((a,b) => b.date.localeCompare(a.date));
        const clientMoods = moods.filter(m => m.clientId === client.id).sort((a,b) => b.date.localeCompare(a.date));
        const clientAppointments = appointments.filter(a => a.clientId === client.id && a.status === '已完成');
        
        let riskReason = '';
        let isHighRisk = false;
        
        if (clientAssessments.length > 0) {
            const lastAssess = clientAssessments[0];
            if (lastAssess.level && (lastAssess.level.includes('重度') || lastAssess.level.includes('高'))) {
                isHighRisk = true;
                riskReason += `${standardAssessments[lastAssess.type]?.name?.split(' ')[0] || lastAssess.type}评分显示高风险；`;
            }
            if (lastAssess.redFlags && lastAssess.redFlags.length > 0) {
                isHighRisk = true;
                riskReason += '存在红旗题项；';
            }
        }
        
        if (clientRecords.length > 0) {
            const lastRecord = clientRecords[0];
            if (lastRecord.risk === '高风险') {
                isHighRisk = true;
                riskReason += '咨询记录标记高风险；';
            }
        }
        
        if (clientMoods.length >= 7) {
            const recentMoods = clientMoods.slice(0, 7);
            const avgMood = recentMoods.reduce((sum, m) => sum + (m.score || 0), 0) / recentMoods.length;
            if (avgMood <= 2) {
                isHighRisk = true;
                riskReason += '近一周情绪持续低落；';
            }
        }
        
        if (isHighRisk) {
            highCount++;
            highRiskClients.push({
                id: client.id,
                name: client.name,
                riskReason: riskReason.slice(0, -1)
            });
        }
        
        const isolationScore = calculateIsolationScore(clientRecords, clientAppointments, clientMoods);
        if (isolationScore >= 50) {
            isolationCount++;
            let isolationReason = '';
            if (clientRecords.length < 2) isolationReason += '咨询频率低；';
            if (clientMoods.length < 3) isolationReason += '情绪记录少；';
            isolationClients.push({
                id: client.id,
                name: client.name,
                isolationScore: isolationScore,
                isolationReason: isolationReason.slice(0, -1) || '综合指标显示社交活动较少'
            });
        }
    });
    
    return {
        highCount: highCount,
        isolationCount: isolationCount,
        highRiskClients: highRiskClients,
        isolationClients: isolationClients
    };
}

// 计算社交隔离指数
function calculateIsolationScore(records, appointments, moods) {
    let score = 0;
    
    const daysSinceLastRecord = records.length > 0 
        ? Math.floor((new Date() - new Date(records[0].date)) / (24 * 60 * 60 * 1000)) 
        : 30;
    
    const daysSinceLastAppointment = appointments.length > 0
        ? Math.floor((new Date() - new Date(appointments[appointments.length - 1].date)) / (24 * 60 * 60 * 1000))
        : 30;
    
    const moodCount = moods.length;
    
    if (daysSinceLastRecord > 14) score += 30;
    else if (daysSinceLastRecord > 7) score += 15;
    
    if (daysSinceLastAppointment > 14) score += 25;
    else if (daysSinceLastAppointment > 7) score += 10;
    
    if (moodCount < 3) score += 25;
    else if (moodCount < 7) score += 10;
    
    if (records.length < 2) score += 20;
    
    return Math.min(100, score);
}

// 计算数据关联分析
function calculateCorrelations(clients, records, assessments, moods, appointments) {
    const insights = [];
    
    let moodCorrelation = '0.00';
    let moodCorrelationStrength = '弱';
    
    if (assessments.length >= 5 && moods.length >= 5) {
        const assessmentScores = assessments.slice(-20).map(a => a.score);
        const moodScores = moods.slice(-20).map(m => m.score || 3);
        
        const avgAssess = assessmentScores.reduce((a, b) => a + b, 0) / assessmentScores.length;
        const avgMood = moodScores.reduce((a, b) => a + b, 0) / moodScores.length;
        
        let numerator = 0, denomAssess = 0, denomMood = 0;
        for (let i = 0; i < Math.min(assessmentScores.length, moodScores.length); i++) {
            numerator += (assessmentScores[i] - avgAssess) * (moodScores[i] - avgMood);
            denomAssess += Math.pow(assessmentScores[i] - avgAssess, 2);
            denomMood += Math.pow(moodScores[i] - avgMood, 2);
        }
        
        if (denomAssess > 0 && denomMood > 0) {
            const corr = numerator / (Math.sqrt(denomAssess) * Math.sqrt(denomMood));
            moodCorrelation = Math.abs(corr).toFixed(2);
            
            if (Math.abs(corr) >= 0.7) moodCorrelationStrength = '强';
            else if (Math.abs(corr) >= 0.4) moodCorrelationStrength = '中等';
            else moodCorrelationStrength = '弱';
        }
    }
    
    const frequencyGroups = { '每周1次': 0, '每周2次': 0, '每周3次以上': 0 };
    appointments.forEach(appt => {
        const clientAppts = appointments.filter(a => a.clientId === appt.clientId);
        const weeks = new Set(clientAppts.map(a => a.date.substring(0, 7)));
        if (weeks.size > 0) {
            const freq = clientAppts.length / weeks.size;
            if (freq >= 3) frequencyGroups['每周3次以上']++;
            else if (freq >= 2) frequencyGroups['每周2次']++;
            else frequencyGroups['每周1次']++;
        }
    });
    
    let optimalFrequency = '每周2次';
    const maxFreq = Math.max(...Object.values(frequencyGroups));
    for (const [freq, count] of Object.entries(frequencyGroups)) {
        if (count === maxFreq) {
            optimalFrequency = freq;
            break;
        }
    }
    
    const techCounts = {};
    records.forEach(r => {
        if (r.methods) {
            const methods = r.methods.split(/[,，、]/).map(m => m.trim()).filter(m => m);
            methods.forEach(m => {
                techCounts[m] = (techCounts[m] || 0) + 1;
            });
        }
    });
    
    let bestTechnique = '待积累';
    let bestTechniqueRate = '-';
    if (Object.keys(techCounts).length > 0) {
        const sortedTechs = Object.entries(techCounts).sort((a, b) => b[1] - a[1]);
        bestTechnique = sortedTechs[0][0];
        bestTechniqueRate = `${Math.round(sortedTechs[0][1] / records.length * 100)}%`;
    }
    
    if (moodCorrelationStrength === '强') {
        insights.push({
            title: '测评与情绪高度相关',
            detail: '测评分数变化与情绪记录呈现强相关，说明测评能有效反映来访者的真实状态，建议继续使用当前测评方案。'
        });
    }
    
    if (optimalFrequency === '每周2次') {
        insights.push({
            title: '每周2次咨询效果最佳',
            detail: '根据数据分析，每周2次的咨询频率效果最好，建议以此为标准安排来访者的咨询计划。'
        });
    }
    
    if (bestTechnique !== '待积累') {
        insights.push({
            title: `${bestTechnique}技术使用最频繁`,
            detail: `您最常使用${bestTechnique}技术，使用率达${bestTechniqueRate}。建议继续深化该技术的应用，并适当探索其他互补技术。`
        });
    }
    
    return {
        moodCorrelation: moodCorrelation,
        moodCorrelationStrength: moodCorrelationStrength,
        optimalFrequency: optimalFrequency,
        bestTechnique: bestTechnique,
        bestTechniqueRate: bestTechniqueRate,
        insights: insights
    };
}

// 计算咨询师能力数据
function calculateCounselorData(records, clients) {
    let style = '整合式';
    let styleDesc = '善于根据来访者特点灵活运用多种技术';
    
    const techCounts = {};
    records.forEach(r => {
        if (r.methods) {
            const methods = r.methods.split(/[,，、]/).map(m => m.trim()).filter(m => m);
            methods.forEach(m => {
                techCounts[m] = (techCounts[m] || 0) + 1;
            });
        }
    });
    
    let bestTechnique = '待积累';
    let bestTechniqueRate = '-';
    if (Object.keys(techCounts).length > 0) {
        const sortedTechs = Object.entries(techCounts).sort((a, b) => b[1] - a[1]);
        bestTechnique = sortedTechs[0][0];
        bestTechniqueRate = `${Math.round(sortedTechs[0][1] / records.length * 100)}%`;
        
        if (bestTechnique.includes('认知') || bestTechnique.includes('CBT')) {
            style = '认知行为取向';
            styleDesc = '善于运用认知行为技术帮助来访者改变思维模式';
        } else if (bestTechnique.includes('正念') || bestTechnique.includes('放松')) {
            style = '人本存在取向';
            styleDesc = '注重来访者的当下体验和自我觉察';
        } else if (bestTechnique.includes('叙事') || bestTechnique.includes('焦点')) {
            style = '建构主义取向';
            styleDesc = '帮助来访者重构人生故事，发现新的可能性';
        }
    }
    
    const areaCounts = {};
    clients.forEach(c => {
        if (c.issues) {
            const issues = c.issues.split(/[,，、]/).map(i => i.trim()).filter(i => i);
            issues.forEach(i => {
                areaCounts[i] = (areaCounts[i] || 0) + 1;
            });
        }
    });
    
    let bestArea = '待积累';
    let bestAreaCount = 0;
    if (Object.keys(areaCounts).length > 0) {
        const sortedAreas = Object.entries(areaCounts).sort((a, b) => b[1] - a[1]);
        bestArea = sortedAreas[0][0];
        bestAreaCount = sortedAreas[0][1];
    }
    
    const growthAreas = [];
    const learningSuggestions = [];
    
    const allTechniques = ['认知重构', '正念放松', '情感反映', '空椅子技术', '行为实验', '动机式访谈', '系统脱敏', '叙事疗法', '焦点解决', '家庭系统'];
    const usedTechniques = Object.keys(techCounts);
    const unusedTechniques = allTechniques.filter(t => !usedTechniques.includes(t));
    
    if (unusedTechniques.length >= 3) {
        growthAreas.push({
            name: '技术多样性',
            suggestion: `您目前使用了${usedTechniques.length}种技术，建议尝试${unusedTechniques[0]}、${unusedTechniques[1]}等新技术，提升技术多样性。`
        });
        learningSuggestions.push(`学习${unusedTechniques[0]}技术的应用方法`);
        learningSuggestions.push(`了解${unusedTechniques[1]}技术在不同情境下的应用`);
    }
    
    if (records.length < 10) {
        growthAreas.push({
            name: '经验积累',
            suggestion: '建议增加咨询实践，积累更多案例经验，提升专业能力。'
        });
        learningSuggestions.push('参与案例讨论会，学习同行经验');
    }
    
    if (bestTechnique !== '待积累') {
        learningSuggestions.push(`深入学习${bestTechnique}技术的高级应用`);
    }
    
    return {
        style: style,
        styleDesc: styleDesc,
        bestTechnique: bestTechnique,
        bestTechniqueRate: bestTechniqueRate,
        bestArea: bestArea,
        bestAreaCount: bestAreaCount,
        growthAreas: growthAreas,
        learningSuggestions: learningSuggestions
    };
}

// 渲染趋势图（柱状图）
function renderTrendChart(assessments, moods) {
    // 取最近8周
    const weeks = [];
    const now = new Date();
    for (let i = 7; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i * 7);
        weeks.push({ label: `第${8-i}周`, score: 0, mood: 0, count: 0, moodCount: 0 });
    }

    assessments.forEach(a => {
        const date = new Date(a.date);
        const diffWeeks = Math.floor((now - date) / (7 * 24 * 60 * 60 * 1000));
        if (diffWeeks >= 0 && diffWeeks < 8) {
            const idx = 7 - diffWeeks;
            weeks[idx].score += a.score;
            weeks[idx].count++;
        }
    });

    moods.forEach(m => {
        const date = new Date(m.date);
        const diffWeeks = Math.floor((now - date) / (7 * 24 * 60 * 60 * 1000));
        if (diffWeeks >= 0 && diffWeeks < 8) {
            const idx = 7 - diffWeeks;
            weeks[idx].mood += m.score || 3;
            weeks[idx].moodCount++;
        }
    });

    const maxScore = Math.max(...weeks.map(w => w.count > 0 ? w.score / w.count : 0), 1);

    if (assessments.length === 0 && moods.length === 0) {
        return '<p style="color:var(--text-muted);padding:12px">暂无趋势数据</p>';
    }

    return `<div class="chart-container" style="align-items:flex-end;height:160px;padding:0">
        ${weeks.map((w, i) => {
            const avgScore = w.count > 0 ? w.score / w.count : 0;
            const h = Math.max(4, Math.round(avgScore / maxScore * 120));
            return `<div class="chart-bar" style="height:${h}px;min-width:24px">
                <span class="chart-bar-value" style="font-size:10px">${w.count > 0 ? Math.round(avgScore) : '-'}</span>
            </div>`;
        }).join('')}
    </div>
    <div style="display:flex;justify-content:space-between;margin-top:8px">
        ${weeks.map(w => `<span style="font-size:11px;color:var(--text-muted)">${w.label.replace('第','W')}</span>`).join('')}
    </div>
    <div style="margin-top:8px;font-size:11px;color:var(--text-muted);text-align:center">平均测评分数（分数越低越好）</div>`;
}

// 风险分布
function renderRiskDistribution(clients, assessments) {
    const levels = { '低风险': 0, '中风险': 0, '高风险': 0, '紧急': 0 };
    clients.forEach(c => {
        const level = c.riskLevel || '低风险';
        const key = level.includes('高') ? '高风险' : level.includes('中') ? '中风险' : level.includes('低') ? '低风险' : '低风险';
        levels[key] = (levels[key] || 0) + 1;
    });
    const total = clients.length || 1;
    const colors = { '低风险': '#22C55E', '中风险': '#F59E0B', '高风险': '#EF4444', '紧急': '#DC2626' };

    return Object.entries(levels).map(([level, count]) => {
        const pct = Math.round(count / total * 100);
        return `<div class="overview-item">
            <span class="overview-item-label" style="color:${colors[level]}">${level}</span>
            <span class="overview-item-value">${count}人 (${pct}%)</span>
        </div>
        <div style="height:6px;background:var(--border);border-radius:3px;overflow:hidden;margin-bottom:8px">
            <div style="height:100%;width:${pct}%;background:${colors[level]};transition:width 0.3s"></div>
        </div>`;
    }).join('');
}

// 生成智能洞察
function generateInsights(clients, records, assessments, moods, appointments) {
    const insights = [];

    // 高风险来访者预警
    const highRisk = clients.filter(c => c.riskLevel === '高风险' || c.riskLevel === '紧急');
    if (highRisk.length > 0) {
        insights.push({
            icon: '🚨',
            title: `${highRisk.length} 位来访者处于高风险状态`,
            detail: `建议优先关注：${highRisk.slice(0,3).map(c=>c.name).join('、')}${highRisk.length>3?' 等':''}。可增加测评频率或安排督导会诊。`,
            color: '#EF4444',
            tag: '高优先级'
        });
    }

    // 无进展个案
    const noProgress = clients.filter(c => {
        const ca = assessments.filter(a => a.clientId === c.id).sort((a,b) => a.date.localeCompare(b.date));
        if (ca.length < 2) return false;
        return ca[ca.length-1].score >= ca[0].score;
    });
    if (noProgress.length > 0 && records.length > 5) {
        insights.push({
            icon: '🔍',
            title: `${noProgress.length} 位来访者疗效不明显`,
            detail: `建议重新评估个案概念化，考虑调整干预方案或转介。可结合督导意见优化技术策略。`,
            color: '#F59E0B',
            tag: '需关注'
        });
    }

    // 脱落风险
    const last30Days = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const atRiskDropout = clients.filter(c => {
        const recent = records.filter(r => r.clientId === c.id && r.date >= last30Days);
        const future = appointments.filter(a => a.clientId === c.id && a.status === '待进行');
        return recent.length === 0 && future.length === 0 && records.filter(r => r.clientId === c.id).length > 0;
    });
    if (atRiskDropout.length > 0) {
        insights.push({
            icon: '⚠️',
            title: `${atRiskDropout.length} 位来访者有脱落风险`,
            detail: `超过30天未咨询且无后续预约。建议主动联系了解情况，或发送关怀信息维持连接。`,
            color: '#F59E0B',
            tag: '脱落预警'
        });
    }

    // 工作量建议
    const thisMonthRecords = records.filter(r => {
        const now = new Date();
        return r.date.startsWith(`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`);
    });
    if (thisMonthRecords.length > 20) {
        insights.push({
            icon: '🔥',
            title: '本月咨询量较高，注意自我关怀',
            detail: `本月已完成 ${thisMonthRecords.length} 次咨询，建议安排督导和休假，防止职业倦怠。`,
            color: '#5B6EE8',
            tag: '关怀提醒'
        });
    }

    // 技术使用建议
    const techCount = {};
    records.forEach(r => {
        if (r.methods) {
            r.methods.split(/[、,，]/).forEach(t => {
                t = t.trim();
                if (t) techCount[t] = (techCount[t] || 0) + 1;
            });
        }
    });
    const techs = Object.entries(techCount).sort((a,b) => b[1]-a[1]);
    if (techs.length > 0 && techs[0][1] > records.length * 0.5) {
        insights.push({
            icon: '🎯',
            title: `技术使用较集中：${techs[0][0]}`,
            detail: `"${techs[0][0]}" 在 ${techs[0][1]} 次咨询中使用（占比 ${Math.round(techs[0][1]/records.length*100)}%）。可尝试多样化技术匹配不同来访者需求。`,
            color: '#3B82F6',
            tag: '建议'
        });
    }

    // 情绪趋势
    const recentMoods = moods.filter(m => m.date >= last30Days);
    if (recentMoods.length > 5) {
        const avgScore = recentMoods.reduce((s,m) => s + (m.score || 3), 0) / recentMoods.length;
        if (avgScore < 3) {
            insights.push({
                icon: '😊',
                title: '整体情绪水平呈上升趋势',
                detail: `近30天来访者平均情绪评分为 ${avgScore.toFixed(1)}/5（分数越高越好），干预效果整体积极。`,
                color: '#22C55E',
                tag: '积极信号'
            });
        }
    }

    // 测评完成率
    const totalClientsWithAssess = new Set(assessments.map(a => a.clientId)).size;
    if (clients.length > 0 && totalClientsWithAssess / clients.length < 0.5) {
        insights.push({
            icon: '📋',
            title: '测评使用率有提升空间',
            detail: `仅 ${Math.round(totalClientsWithAssess/clients.length*100)}% 的来访者完成过测评。建议建立基线测评+定期追踪的标准化流程。`,
            color: '#F59E0B',
            tag: '流程建议'
        });
    }

    return insights;
}

// 来访者疗效排行
function getClientProgressList(clients, assessments, records) {
    return clients.map(c => {
        const clientRecords = records.filter(r => r.clientId === c.id);
        const clientAssess = assessments.filter(a => a.clientId === c.id).sort((a,b) => a.date.localeCompare(b.date));

        let scoreChange = null, firstScore = '-', lastScore = '-', progressText = '数据不足', progressClass = 'badge-primary';

        if (clientAssess.length >= 2) {
            firstScore = clientAssess[0].score;
            lastScore = clientAssess[clientAssess.length-1].score;
            scoreChange = lastScore - firstScore;

            if (scoreChange < -5) { progressText = '明显好转'; progressClass = 'badge-success'; }
            else if (scoreChange < 0) { progressText = '有所改善'; progressClass = 'badge-success'; }
            else if (scoreChange === 0) { progressText = '保持稳定'; progressClass = 'badge-warning'; }
            else if (scoreChange <= 5) { progressText = '略有波动'; progressClass = 'badge-warning'; }
            else { progressText = '需要关注'; progressClass = 'badge-danger'; }
        } else if (clientAssess.length === 1) {
            firstScore = clientAssess[0].score;
            lastScore = clientAssess[0].score;
            progressText = '仅基线';
            progressClass = 'badge-primary';
        }

        if (clientRecords.length === 0) {
            progressText = '尚未开始';
            progressClass = 'badge-primary';
        }

        return {
            id: c.id,
            name: c.name,
            recordCount: clientRecords.length,
            scoreChange,
            firstScore,
            lastScore,
            progressText,
            progressClass
        };
    }).sort((a,b) => (b.recordCount) - (a.recordCount));
}

// ===== 工作情况页面 =====
async function renderWorkloadPage() {
    const container = document.getElementById('workloadContent');
    if (!container) return;
    const period = document.getElementById('workloadPeriod') ? document.getElementById('workloadPeriod').value : 'month';
    const now = new Date();
    let startDate = '';
    if (period === 'week') {
        const dayOfWeek = now.getDay() || 7;
        const monday = new Date(now);
        monday.setDate(now.getDate() - dayOfWeek + 1);
        startDate = monday.toISOString().split('T')[0];
    } else if (period === 'month') {
        startDate = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-01`;
    } else if (period === 'quarter') {
        const q = Math.floor(now.getMonth() / 3);
        startDate = `${now.getFullYear()}-${String(q*3+1).padStart(2,'0')}-01`;
    } else {
        startDate = `${now.getFullYear()}-01-01`;
    }

    const records = await Storage.get('records', []);
    const appointments = await Storage.get('appointments', []);
    const clients = await Storage.get('clients', []);
    const periodRecords = records.filter(r => r.date >= startDate);
    const periodAppts = appointments.filter(a => a.date >= startDate);
    const totalMinutes = periodRecords.reduce((s, r) => s + (r.duration || 50), 0);
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    const avgSuds = periodRecords.filter(r => r.suds !== undefined).length > 0
        ? (periodRecords.reduce((s, r) => s + (r.suds || 0), 0) / periodRecords.filter(r => r.suds !== undefined).length).toFixed(1)
        : '-';
    const avgRating = periodRecords.filter(r => r.counselorRating).length > 0
        ? (periodRecords.reduce((s, r) => s + (r.counselorRating || 0), 0) / periodRecords.filter(r => r.counselorRating).length).toFixed(1)
        : '-';
    const completedAppts = periodAppts.filter(a => a.status === '已完成').length;
    const cancelledAppts = periodAppts.filter(a => a.status === '已取消').length;
    const completionRate = periodAppts.length > 0 ? Math.round(completedAppts / periodAppts.length * 100) : 0;
    const activeClients = new Set(periodRecords.map(r => r.clientId)).size;
    const newClients = clients.filter(c => (c.createdAt || '').substring(0, 10) >= startDate).length;

    // 每日咨询分布
    const dailyMap = {};
    periodRecords.forEach(r => { dailyMap[r.date] = (dailyMap[r.date] || 0) + 1; });
    const dailyEntries = Object.entries(dailyMap).sort((a, b) => a[0].localeCompare(b[0]));
    const maxDaily = Math.max(1, ...Object.values(dailyMap));

    // 技术使用统计
    const techCount = {};
    periodRecords.forEach(r => {
        if (r.methods) {
            r.methods.split(/[、,，]/).forEach(t => {
                t = t.trim();
                if (t) techCount[t] = (techCount[t] || 0) + 1;
            });
        }
    });
    const techEntries = Object.entries(techCount).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const maxTech = Math.max(1, ...techEntries.map(e => e[1]));

    container.innerHTML = `
        <!-- 核心数据 -->
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:16px;margin-bottom:20px">
            <div style="padding:20px;background:linear-gradient(135deg,rgba(99,102,241,0.1),rgba(99,102,241,0.05));border-radius:12px;text-align:center">
                <div style="font-size:32px;font-weight:700;color:var(--primary)">${periodRecords.length}</div>
                <div style="font-size:13px;color:var(--text-muted);margin-top:4px">咨询记录</div>
            </div>
            <div style="padding:20px;background:linear-gradient(135deg,rgba(34,197,94,0.1),rgba(34,197,94,0.05));border-radius:12px;text-align:center">
                <div style="font-size:32px;font-weight:700;color:var(--success)">${hours}<span style="font-size:18px">h</span>${mins}<span style="font-size:18px">m</span></div>
                <div style="font-size:13px;color:var(--text-muted);margin-top:4px">总咨询时长</div>
            </div>
            <div style="padding:20px;background:linear-gradient(135deg,rgba(139,92,246,0.1),rgba(139,92,246,0.05));border-radius:12px;text-align:center">
                <div style="font-size:32px;font-weight:700;color:#8B5CF6">${activeClients}</div>
                <div style="font-size:13px;color:var(--text-muted);margin-top:4px">活跃来访者</div>
            </div>
            <div style="padding:20px;background:linear-gradient(135deg,rgba(245,158,11,0.1),rgba(245,158,11,0.05));border-radius:12px;text-align:center">
                <div style="font-size:32px;font-weight:700;color:var(--warning)">${newClients}</div>
                <div style="font-size:13px;color:var(--text-muted);margin-top:4px">新增来访者</div>
            </div>
            <div style="padding:20px;background:linear-gradient(135deg,rgba(59,130,246,0.1),rgba(59,130,246,0.05));border-radius:12px;text-align:center">
                <div style="font-size:32px;font-weight:700;color:#3B82F6">${completionRate}%</div>
                <div style="font-size:13px;color:var(--text-muted);margin-top:4px">预约完成率</div>
            </div>
        </div>

        <!-- 疗效数据 -->
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:16px;margin-bottom:20px">
            <div class="overview-card">
                <div class="overview-header"><h3>📊 平均 SUDS</h3></div>
                <div style="text-align:center;padding:8px 0">
                    <div style="font-size:36px;font-weight:700;color:#8B5CF6">${avgSuds}</div>
                    <div style="font-size:12px;color:var(--text-muted)">来访者主观痛苦程度（0-10）</div>
                </div>
            </div>
            <div class="overview-card">
                <div class="overview-header"><h3>⭐ 平均疗效自评</h3></div>
                <div style="text-align:center;padding:8px 0">
                    <div style="font-size:36px;font-weight:700;color:#F59E0B">${avgRating}</div>
                    <div style="font-size:12px;color:var(--text-muted)">咨询师自评（1-5星）</div>
                </div>
            </div>
            <div class="overview-card">
                <div class="overview-header"><h3>✅ 预约情况</h3></div>
                <div class="overview-item"><span class="overview-item-label">已完成</span><span class="overview-item-value">${completedAppts}</span></div>
                <div class="overview-item"><span class="overview-item-label">已取消</span><span class="overview-item-value">${cancelledAppts}</span></div>
                <div class="overview-item"><span class="overview-item-label">总预约</span><span class="overview-item-value">${periodAppts.length}</span></div>
            </div>
        </div>

        <!-- 每日咨询分布 -->
        <div class="overview-card" style="margin-bottom:16px">
            <div class="overview-header"><h3>📅 每日咨询分布</h3></div>
            ${dailyEntries.length === 0 ? '<p style="color:var(--text-muted);text-align:center;padding:24px">本期暂无咨询记录</p>' : `
            <div style="display:flex;align-items:flex-end;gap:4px;height:120px;padding:8px 0;overflow-x:auto">
                ${dailyEntries.map(([d, c]) => `<div style="flex:0 0 auto;min-width:24px;text-align:center" title="${d}: ${c}次">
                    <div style="background:linear-gradient(180deg,var(--primary),var(--primary-light));height:${(c / maxDaily * 80) + 12}px;border-radius:4px 4px 0 0;margin:0 auto;width:20px"></div>
                    <div style="font-size:10px;color:var(--text-muted);margin-top:4px">${c}</div>
                </div>`).join('')}
            </div>`}
        </div>

        <!-- 技术使用统计 -->
        ${techEntries.length > 0 ? `
        <div class="overview-card">
            <div class="overview-header"><h3>🛠️ 主要咨询技术</h3></div>
            ${techEntries.map(([t, c]) => `<div class="overview-item">
                <span class="overview-item-label">${t}</span>
                <span class="overview-item-value">${c} 次</span>
            </div>
            <div style="height:6px;background:var(--border);border-radius:3px;overflow:hidden;margin-bottom:8px">
                <div style="height:100%;width:${c / maxTech * 100}%;background:linear-gradient(90deg,var(--primary),var(--primary-light))"></div>
            </div>`).join('')}
        </div>` : ''}
    `;
}

async function exportWorkloadReport() {
    const period = document.getElementById('workloadPeriod').value;
    const periodNames = { week: '本周', month: '本月', quarter: '本季度', year: '本年度' };
    const records = await Storage.get('records', []);
    const clients = await Storage.get('clients', []);
    const appointments = await Storage.get('appointments', []);

    const now = new Date();
    let startDate = '';
    if (period === 'week') {
        const dayOfWeek = now.getDay() || 7;
        const monday = new Date(now);
        monday.setDate(now.getDate() - dayOfWeek + 1);
        startDate = monday.toISOString().split('T')[0];
    } else if (period === 'month') {
        startDate = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-01`;
    } else if (period === 'quarter') {
        const q = Math.floor(now.getMonth() / 3);
        startDate = `${now.getFullYear()}-${String(q*3+1).padStart(2,'0')}-01`;
    } else {
        startDate = `${now.getFullYear()}-01-01`;
    }

    const periodRecords = records.filter(r => r.date >= startDate);
    const periodAppts = appointments.filter(a => a.date >= startDate);

    const lines = [
        `心创工坊 - 咨询师工作情况报告`,
        `报告人：${currentUser ? currentUser.name : ''}`,
        `报告周期：${periodNames[period]}（${startDate} 至今）`,
        `生成时间：${formatDateTime(new Date())}`,
        ``,
        `【核心数据】`,
        `咨询记录：${periodRecords.length} 次`,
        `总时长：${periodRecords.reduce((s, r) => s + (r.duration || 50), 0)} 分钟`,
        `已完成预约：${periodAppts.filter(a => a.status === '已完成').length}`,
        `已取消预约：${periodAppts.filter(a => a.status === '已取消').length}`,
        `预约完成率：${periodAppts.length > 0 ? Math.round(periodAppts.filter(a => a.status === '已完成').length / periodAppts.length * 100) : 0}%`,
        `活跃来访者：${new Set(periodRecords.map(r => r.clientId)).size} 人`,
        ``,
        `【咨询明细】`,
        `日期\t来访者\t时长\t进展\t风险\tSUDS\t疗效自评`
    ];
    periodRecords.sort((a, b) => a.date.localeCompare(b.date)).forEach(r => {
        const c = clients.find(x => x.id === r.clientId);
        lines.push(`${r.date}\t${c ? c.name : '-'}\t${r.duration || 50}分钟\t${r.progress || '-'}\t${r.risk || '-'}\t${r.suds !== undefined ? r.suds : '-'}\t${r.counselorRating ? r.counselorRating + '星' : '-'}`);
    });

    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `工作情况报告_${periodNames[period]}_${formatDate(new Date())}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('报告已导出', 'success');
}

// 工作量统计
function calculateWorkload(records, appointments) {
    const now = new Date();
    const monthStart = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
    const monthRecords = records.filter(r => r.date.startsWith(monthStart));
    const totalMinutes = monthRecords.reduce((s, r) => s + (r.duration || 50), 0);
    const activeClients = new Set(monthRecords.map(r => r.clientId)).size;

    return {
        totalMinutes,
        recordCount: monthRecords.length,
        avgMinutes: monthRecords.length > 0 ? Math.round(totalMinutes / monthRecords.length) : 0,
        activeClients
    };
}

// 技术分布
function renderTechDistribution(records) {
    const techCount = {};
    records.forEach(r => {
        if (r.methods) {
            r.methods.split(/[、,，]/).forEach(t => {
                t = t.trim();
                if (t) techCount[t] = (techCount[t] || 0) + 1;
            });
        }
    });

    const entries = Object.entries(techCount).sort((a,b) => b[1]-a[1]).slice(0, 6);
    if (entries.length === 0) return '<p style="color:var(--text-muted);padding:12px">暂无技术记录</p>';

    const maxCount = entries[0][1] || 1;
    return entries.map(([tech, count]) => {
        const pct = Math.round(count / maxCount * 100);
        return `<div class="overview-item">
            <span class="overview-item-label">${tech}</span>
            <span class="overview-item-value">${count}次</span>
        </div>
        <div style="height:6px;background:var(--border);border-radius:3px;overflow:hidden;margin-bottom:6px">
            <div style="height:100%;width:${pct}%;background:linear-gradient(90deg,var(--primary),var(--primary-light))"></div>
        </div>`;
    }).join('');
}

// 挂载到全局
window.triggerAIUpload = triggerAIUpload;
window.startAIAnalysis = startAIAnalysis;
window.showAIResult = showAIResult;
window.resetAIUpload = resetAIUpload;
window.showAITool = showAITool;
window.closeAITool = closeAITool;
window.sgAutoRecommend = sgAutoRecommend;
window.sgGenerate = sgGenerate;
window.sgAddToClient = sgAddToClient;
window.egGenerate = egGenerate;
window.caGenerate = caGenerate;
window.crCalculate = crCalculate;
window.renderSupervisorReview = renderSupervisorReview;
window.submitReview = submitReview;
window.renderSupervisorFeedback = renderSupervisorFeedback;
window.acknowledgeReview = acknowledgeReview;
window.acknowledgeAllReviews = acknowledgeAllReviews;
window.renderInsights = renderInsights;
window.renderOrganization = renderOrganization;
window.assignSupervisor = assignSupervisor;
window.viewCounselorClients = viewCounselorClients;
window.updateNavVisibility = updateNavVisibility;


