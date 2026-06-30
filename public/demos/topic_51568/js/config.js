/**
 * 配置文件
 * Global configuration for the Marking Scheme Generator
 */

const AppConfig = {
    // API defaults
    api: {
        url: 'https://open.bigmodel.cn/api/paas/v4/chat/completions',
        key: '',
        model: 'glm-5.2',
        temperature: 0.1,
        maxTokens: 8192,
        timeout: 180,
        stream: true
    },

    // localStorage keys
    storage: {
        settings: 'msg_settings',
        history: 'msg_history',
        lastInput: 'msg_last_input'
    },

    // Exam type configurations
    examTypes: {
        'new-gaokao-1': {
            label: '新高考Ⅰ卷',
            totalScore: 150,
            structure: '单选8题(40分) + 多选3题(18分) + 填空3题(15分) + 解答5题(77分)',
            answerStructure: [
                { type: 'single-choice', count: 8, scoreEach: 5, total: 40 },
                { type: 'multi-choice', count: 3, scoreEach: 6, total: 18 },
                { type: 'fill-blank', count: 3, scoreEach: 5, total: 15 },
                { type: 'solution', count: 5, scores: [13, 15, 15, 17, 17], total: 77 }
            ]
        },
        'new-gaokao-2': {
            label: '新高考Ⅱ卷',
            totalScore: 150,
            structure: '单选8题(40分) + 多选3题(18分) + 填空3题(15分) + 解答5题(77分)',
            answerStructure: [
                { type: 'single-choice', count: 8, scoreEach: 5, total: 40 },
                { type: 'multi-choice', count: 3, scoreEach: 6, total: 18 },
                { type: 'fill-blank', count: 3, scoreEach: 5, total: 15 },
                { type: 'solution', count: 5, scores: [13, 15, 15, 17, 17], total: 77 }
            ]
        },
        'guangdong': {
            label: '广东',
            totalScore: 150,
            structure: '单选8题(40分) + 多选3题(18分) + 填空3题(15分) + 解答5题(77分)',
            answerStructure: [
                { type: 'single-choice', count: 8, scoreEach: 5, total: 40 },
                { type: 'multi-choice', count: 3, scoreEach: 6, total: 18 },
                { type: 'fill-blank', count: 3, scoreEach: 5, total: 15 },
                { type: 'solution', count: 5, scores: [13, 15, 15, 17, 17], total: 77 }
            ]
        },
        'shenzhen': {
            label: '深圳',
            totalScore: 150,
            structure: '单选8题(40分) + 多选3题(18分) + 填空3题(15分) + 解答5题(77分)',
            answerStructure: [
                { type: 'single-choice', count: 8, scoreEach: 5, total: 40 },
                { type: 'multi-choice', count: 3, scoreEach: 6, total: 18 },
                { type: 'fill-blank', count: 3, scoreEach: 5, total: 15 },
                { type: 'solution', count: 5, scores: [13, 15, 15, 17, 17], total: 77 }
            ]
        },
        'zhejiang': {
            label: '浙江',
            totalScore: 150,
            structure: '单选8题(40分) + 多选3题(18分) + 填空3题(15分) + 解答5题(77分)',
            answerStructure: [
                { type: 'single-choice', count: 8, scoreEach: 5, total: 40 },
                { type: 'multi-choice', count: 3, scoreEach: 6, total: 18 },
                { type: 'fill-blank', count: 3, scoreEach: 5, total: 15 },
                { type: 'solution', count: 5, scores: [13, 15, 15, 17, 17], total: 77 }
            ]
        },
        'jiangsu': {
            label: '江苏',
            totalScore: 150,
            structure: '单选8题(40分) + 多选3题(18分) + 填空3题(15分) + 解答5题(77分)',
            answerStructure: [
                { type: 'single-choice', count: 8, scoreEach: 5, total: 40 },
                { type: 'multi-choice', count: 3, scoreEach: 6, total: 18 },
                { type: 'fill-blank', count: 3, scoreEach: 5, total: 15 },
                { type: 'solution', count: 5, scores: [13, 15, 15, 17, 17], total: 77 }
            ]
        },
        'national': {
            label: '全国卷风格',
            totalScore: 150,
            structure: '单选12题(60分) + 填空4题(20分) + 解答6题(70分)',
            answerStructure: [
                { type: 'single-choice', count: 12, scoreEach: 5, total: 60 },
                { type: 'fill-blank', count: 4, scoreEach: 5, total: 20 },
                { type: 'solution', count: 6, scores: [10, 12, 12, 12, 12, 12], total: 70 }
            ]
        }
    },

    // Marking style configurations
    markingStyles: {
        'shenzhen': {
            label: '深圳教研院官方格式',
            scoreNotation: '......X分',
            cumulativeScore: true,
            rightAlignedScore: true,
            proofStyle: '完整证明推导',
            formulaStyle: '行内公式与行间公式并用',
            omissions: '推导省略号使用居中三点'
        },
        'guangdong': {
            label: '广东省高考格式',
            scoreNotation: '......X分',
            cumulativeScore: true,
            rightAlignedScore: true,
            proofStyle: '完整证明推导',
            formulaStyle: '行内公式为主',
            omissions: '推导省略号使用居中三点'
        },
        'national': {
            label: '全国卷格式',
            scoreNotation: '......X分',
            cumulativeScore: true,
            rightAlignedScore: true,
            proofStyle: '完整证明推导',
            formulaStyle: '行内公式为主',
            omissions: '推导省略号使用居中三点'
        }
    },

    // Verification checklist
    verificationItems: [
        { id: 'all-questions', title: '所有题目均已生成', detail: '检查全卷每道题是否都有对应评分标准' },
        { id: 'cumulative-score', title: '每一步都有累计得分', detail: '解答题每个推导节点都有累计分值标注' },
        { id: 'score-match', title: '累计得分=题目总分', detail: '每题最终累计得分等于该题满分' },
        { id: 'total-score', title: '全卷总分正确', detail: '所有题目分值之和等于150分' },
        { id: 'no-skip', title: '不存在跳步', detail: '所有推导步骤完整连贯，无跳跃' },
        { id: 'no-missing', title: '不存在漏步骤', detail: '关键推导节点完整，无遗漏' },
        { id: 'proof-complete', title: '证明题完整', detail: '证明题从已知到结论完整推导' },
        { id: 'stat-methods', title: '统计题两种方法均保留', detail: '统计题若有多种解法，全部保留' },
        { id: 'derivative-methods', title: '导数题允许多种方法', detail: '导数题若有多解，分别标注法一、法二' },
        { id: 'format-match', title: '最终版式与官方评分标准一致', detail: '语言、格式、版式完全符合要求' },
        { id: 'independent-scoring', title: '关键步骤独立给分', detail: '不因后续错误全部失分，各步骤独立评分' },
        { id: 'error-no-accumulate', title: '错误不累计原则', detail: '前步计算错误但后续推理正确时，后续步骤继续给分' },
        { id: 'no-repeat-deduction', title: '同一错误不重复扣分', detail: '同一计算错误只扣一次分' },
        { id: 'method-score', title: '方法分保留', detail: '方法正确但计算失误时保留方法分' },
        { id: 'process-score', title: '过程分保留', detail: '最终答案错误但关键推导正确时获得过程分' },
        { id: 'key-point-scoring', title: '按关键得分点评分', detail: '多解问题按得分点评分而非固定过程' },
        { id: 'innovation-score', title: '创新方法等值给分', detail: '学生采用创新正确方法给予与标准解法相同分值' },
        { id: 'missing-step-score', title: '步骤缺失酌情给分', detail: '步骤缺失但结论唯一推出时酌情给步骤分' },
        { id: 'no-vague-deduction', title: '无模糊扣分描述', detail: '不允许出现"不给分"，应明确扣分额度' },
        { id: 'score-sum-check', title: '步骤分值之和=题总分', detail: '每题所有步骤分值之和严格等于该题总分' }
    ],

    // Workflow steps for progress display
    workflowSteps: [
        { id: 'parse', label: '解析输入', desc: '读取并解析参考答案内容' },
        { id: 'identify', label: '识别题型', desc: '识别选择、多选、填空、解答题' },
        { id: 'score', label: '识别分值', desc: '识别每道题的总分' },
        { id: 'complete', label: '补全步骤', desc: '自动补全所有省略计算' },
        { id: 'generate', label: '生成标准', desc: '生成官方评分标准' },
        { id: 'verify', label: '校验一致性', desc: '检查累计得分与总分' },
        { id: 'finalize', label: '输出结果', desc: '输出最终评分标准' }
    ]
};

// Export
window.AppConfig = AppConfig;
