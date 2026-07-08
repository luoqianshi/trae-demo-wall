/**
 * 声纹智转 - 模拟数据层
 */

const AppData = {
    // 会议场景模拟数据
    meetingData: {
        title: "Q3产品规划评审会议",
        scene: "meeting",
        duration: "45:32",
        speakers: [
            { id: 0, name: "张产品", role: "产品经理", avatar: "张", color: "#06B6D4" },
            { id: 1, name: "李技术", role: "技术负责人", avatar: "李", color: "#8B5CF6" },
            { id: 2, name: "王设计", role: "设计师", avatar: "王", color: "#F59E0B" },
            { id: 3, name: "赵运营", role: "运营", avatar: "赵", color: "#10B981" }
        ],
        transcript: [
            { speaker: 0, text: "各位，今天我们讨论Q3的产品规划。首先看用户增长目标。", time: "00:00" },
            { speaker: 1, text: "技术侧已经准备好了新的推荐算法，准确率提升了15%。", time: "00:15" },
            { speaker: 2, text: "UI改版方案我这边有三版，主推极简风格。", time: "00:32" },
            { speaker: 3, text: "运营活动需要配合新版本上线，建议8月中旬启动。", time: "00:48" },
            { speaker: 0, text: "好的，那决策是：推荐算法7月底上线，UI改版8月初，运营活动8月15日启动。", time: "01:05" },
            { speaker: 1, text: "需要增加两名后端开发，目前人手紧张。", time: "01:20" },
            { speaker: 0, text: "同意，HR下周开始招聘。李技术负责技术面试。", time: "01:35" },
            { speaker: 2, text: "设计资源也需要补充，动效设计比较复杂。", time: "01:50" },
            { speaker: 3, text: "预算方面，Q3营销费用申请增加30万。", time: "02:05" },
            { speaker: 0, text: "预算申请我本周五前审批完成。还有其他问题吗？", time: "02:20" },
            { speaker: 1, text: "技术债务需要排期处理，建议留出20%的迭代时间。", time: "02:35" },
            { speaker: 0, text: "同意，每个迭代周期留出2天处理技术债务。", time: "02:50" }
        ],
        summary: {
            full: "本次会议确定了Q3产品规划的核心方向：推荐算法优化（7月底）、UI极简改版（8月初）、运营活动启动（8月15日）。关键决策包括增加2名后端开发、Q3营销预算增加30万、每个迭代留出20%时间处理技术债务。",
            chapters: [
                { title: "用户增长目标", time: "00:00-00:30", summary: "讨论Q3用户增长目标及推荐算法优化方案" },
                { title: "产品改版计划", time: "00:30-01:00", summary: "确定UI改版三版方案，主推极简风格" },
                { title: "资源与预算", time: "01:00-02:00", summary: "讨论人员招聘、设计资源及营销预算调整" },
                { title: "技术债务", time: "02:00-03:00", summary: "确定每个迭代周期留出20%时间处理技术债务" }
            ],
            speakers: [
                { name: "张产品", summary: "主持会议，确定Q3核心规划，审批预算，安排招聘" },
                { name: "李技术", summary: "汇报推荐算法进展，提出人手需求，强调技术债务" },
                { name: "王设计", summary: "展示UI改版方案，提出动效设计资源需求" },
                { name: "赵运营", summary: "协调运营活动时间，申请营销预算" }
            ],
            keywords: ["推荐算法", "UI改版", "预算", "招聘", "技术债务", "用户增长"],
            todos: [
                { task: "推荐算法上线", assignee: "李技术", deadline: "7月31日" },
                { task: "UI改版交付", assignee: "王设计", deadline: "8月5日" },
                { task: "后端开发招聘", assignee: "李技术", deadline: "持续进行" },
                { task: "Q3预算审批", assignee: "张产品", deadline: "本周五" }
            ]
        }
    },

    // 课堂场景模拟数据
    classData: {
        title: "深度学习基础 - 第8讲",
        scene: "class",
        duration: "90:15",
        speakers: [
            { id: 0, name: "陈教授", role: "教授", avatar: "陈", color: "#06B6D4" }
        ],
        transcript: [
            { speaker: 0, text: "同学们好，今天讲卷积神经网络CNN的核心原理。", time: "00:00" },
            { speaker: 0, text: "CNN由卷积层、池化层和全连接层组成。卷积层负责特征提取。", time: "00:30" },
            { speaker: 0, text: "重点：卷积核的大小和步长会直接影响感受野的范围。", time: "01:15" },
            { speaker: 0, text: "ResNet解决了深层网络的梯度消失问题，引入了残差连接。", time: "02:30" },
            { speaker: 0, text: "考试重点：ResNet的残差块结构、Batch Normalization的作用。", time: "03:45" }
        ],
        summary: {
            full: "本讲介绍卷积神经网络CNN的核心原理，包括卷积层、池化层、全连接层的作用，以及ResNet的残差连接机制。考试重点为残差块结构和Batch Normalization。",
            chapters: [
                { title: "CNN基本结构", time: "00:00-01:00", summary: "介绍卷积层、池化层、全连接层的功能" },
                { title: "卷积核与感受野", time: "01:00-02:00", summary: "讲解卷积核参数对感受野的影响" },
                { title: "ResNet原理", time: "02:00-04:00", summary: "残差连接机制及梯度消失解决方案" }
            ],
            keywords: ["CNN", "卷积神经网络", "ResNet", "残差连接", "Batch Normalization"],
            todos: [
                { task: "完成CNN课后习题", assignee: "学生", deadline: "下周三" },
                { task: "阅读ResNet原论文", assignee: "学生", deadline: "下周日" }
            ]
        }
    },

    // 访谈场景模拟数据
    interviewData: {
        title: "人工智能伦理专题访谈",
        scene: "interview",
        duration: "35:20",
        speakers: [
            { id: 0, name: "记者", role: "记者", avatar: "记", color: "#06B6D4" },
            { id: 1, name: "刘专家", role: "AI伦理专家", avatar: "刘", color: "#8B5CF6" }
        ],
        transcript: [
            { speaker: 0, text: "刘教授，您认为当前AI技术最大的伦理风险是什么？", time: "00:00" },
            { speaker: 1, text: "我认为是算法偏见和数据隐私。算法可能放大社会已有偏见。", time: "00:10" },
            { speaker: 0, text: "企业应该如何构建负责任的AI系统？", time: "01:30" },
            { speaker: 1, text: "需要建立AI伦理委员会，进行算法审计，确保透明度。", time: "01:45" },
            { speaker: 0, text: "对于普通用户，如何保护自己的数据权益？", time: "03:00" },
            { speaker: 1, text: "要仔细阅读隐私政策，使用本地化处理的产品，声纹智转就是很好的例子。", time: "03:15" }
        ],
        summary: {
            full: "访谈围绕AI伦理展开，讨论了算法偏见、数据隐私风险，以及企业构建负责任AI的方法。专家建议建立伦理委员会、算法审计，用户应选择本地化处理产品。",
            keywords: ["AI伦理", "算法偏见", "数据隐私", "算法审计", "本地化处理"],
            todos: []
        }
    },

    // 历史记录数据
    historyRecords: [
        { id: 1, title: "Q3产品规划评审会议", scene: "meeting", date: "2026-07-05", duration: "45:32", speakers: 4, words: 3200, status: "completed" },
        { id: 2, title: "深度学习基础 - 第8讲", scene: "class", date: "2026-07-04", duration: "90:15", speakers: 1, words: 8500, status: "completed" },
        { id: 3, title: "人工智能伦理专题访谈", scene: "interview", date: "2026-07-03", duration: "35:20", speakers: 2, words: 2100, status: "completed" },
        { id: 4, title: "医疗影像诊断研讨会", scene: "medical", date: "2026-07-02", duration: "60:00", speakers: 5, words: 5600, status: "completed" },
        { id: 5, title: "合同纠纷庭审记录", scene: "court", date: "2026-07-01", duration: "120:00", speakers: 4, words: 12000, status: "completed" },
        { id: 6, title: "周例会 - 技术部", scene: "meeting", date: "2026-06-30", duration: "30:00", speakers: 6, words: 1800, status: "completed" }
    ],

    // 待办任务
    tasks: [
        { id: 1, title: "推荐算法上线", assignee: "李技术", deadline: "2026-07-31", status: "todo", source: "Q3产品规划评审会议" },
        { id: 2, title: "UI改版交付", assignee: "王设计", deadline: "2026-08-05", status: "in-progress", source: "Q3产品规划评审会议" },
        { id: 3, title: "后端开发招聘", assignee: "李技术", deadline: "持续", status: "todo", source: "Q3产品规划评审会议" },
        { id: 4, title: "Q3预算审批", assignee: "张产品", deadline: "2026-07-10", status: "done", source: "Q3产品规划评审会议" },
        { id: 5, title: "完成CNN课后习题", assignee: "学生", deadline: "2026-07-12", status: "todo", source: "深度学习基础 - 第8讲" },
        { id: 6, title: "阅读ResNet原论文", assignee: "学生", deadline: "2026-07-15", status: "in-progress", source: "深度学习基础 - 第8讲" }
    ],

    // 说话人库
    speakers: [
        { id: 1, name: "张产品", role: "产品经理", count: 12, duration: "5小时20分", color: "#06B6D4" },
        { id: 2, name: "李技术", role: "技术负责人", count: 15, duration: "6小时10分", color: "#8B5CF6" },
        { id: 3, name: "王设计", role: "设计师", count: 8, duration: "3小时45分", color: "#F59E0B" },
        { id: 4, name: "赵运营", role: "运营", count: 10, duration: "4小时20分", color: "#10B981" },
        { id: 5, name: "陈教授", role: "教授", count: 5, duration: "7小时30分", color: "#EF4444" },
        { id: 6, name: "刘专家", role: "AI伦理专家", count: 3, duration: "1小时45分", color: "#EC4899" }
    ],

    // 团队数据
    teams: [
        { id: 1, name: "产品技术部", members: 12, records: 45 },
        { id: 2, name: "学术研究组", members: 8, records: 32 },
        { id: 3, name: "媒体采访组", members: 5, records: 18 }
    ],

    // 模板数据
    templates: [
        { id: 1, name: "标准会议纪要", scene: "meeting", description: "包含参会人、议题、决议、待办的通用模板" },
        { id: 2, name: "课堂笔记模板", scene: "class", description: "包含知识点、重点标记、课后作业的学术模板" },
        { id: 3, name: "访谈纪要模板", scene: "interview", description: "问答式结构，适合媒体访谈记录" },
        { id: 4, name: "医疗问诊记录", scene: "medical", description: "符合医疗规范的病历记录格式" },
        { id: 5, name: "庭审记录模板", scene: "court", description: "法律规范的庭审笔录格式" }
    ],

    // 插件数据
    plugins: [
        { id: 1, name: "Chrome浏览器插件", desc: "网页音视频一键转写", installed: true },
        { id: 2, name: "腾讯会议助手", desc: "会议自动录音转写", installed: true },
        { id: 3, name: "钉钉集成", desc: "钉钉会议实时字幕", installed: false },
        { id: 4, name: "Zoom插件", desc: "跨国会议实时翻译", installed: false },
        { id: 5, name: "飞书集成", desc: "妙记自动同步", installed: false },
        { id: 6, name: "VS Code扩展", desc: "语音编程助手", installed: false }
    ],

    // 设置默认值
    settings: {
        language: "zh-CN",
        model: "standard",
        theme: "light",
        noiseReduction: true,
        autoSummary: true,
        autoTodo: true,
        privacyMode: true,
        saveLocal: true
    },

    // 统计数据
    stats: {
        totalDuration: "128小时35分",
        totalWords: "1,245,800",
        totalRecords: 156,
        timeSaved: "386小时",
        languages: 52,
        accuracy: 98.5
    },

    // 问答预设
    qaPresets: [
        { q: "本次会议的主要决策是什么？", a: "主要决策包括：1) 推荐算法7月底上线；2) UI改版8月初交付；3) 运营活动8月15日启动；4) 增加2名后端开发；5) Q3营销预算增加30万。" },
        { q: "李技术的发言要点有哪些？", a: "李技术主要表达了：1) 新推荐算法准确率提升15%；2) 需要增加2名后端开发；3) 建议每个迭代留出20%时间处理技术债务。" },
        { q: "有哪些待办事项？", a: "待办包括：推荐算法上线（李技术，7/31）、UI改版交付（王设计，8/5）、后端开发招聘（李技术）、Q3预算审批（张产品，本周五）。" }
    ]
};

// 工具函数
function formatDuration(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function getSceneLabel(scene) {
    const labels = {
        meeting: '会议',
        class: '课堂',
        interview: '访谈',
        medical: '医疗',
        court: '法庭'
    };
    return labels[scene] || scene;
}

function getSceneIcon(scene) {
    const icons = {
        meeting: 'users',
        class: 'graduation-cap',
        interview: 'mic',
        medical: 'heart-pulse',
        court: 'scale'
    };
    return icons[scene] || 'file-text';
}

// 挂载到 window 供所有模块通过 window.AppData 访问
window.AppData = AppData;
