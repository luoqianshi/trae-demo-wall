/**
 * ============================================
 *   心晴日记 — AI校园情绪日记 · 核心逻辑
 *   mood_logic.js  (V2 — 五类情绪版)
 * ============================================
 *   模块说明：
 *     1. 用户身份管理（UID 生成与绑定）
 *     2. AI 情绪识别引擎（五类正负词汇权重计分法）
 *     3. 疏导建议匹配（五类情绪专属暖心文案）
 *     4. 舒缓音乐推荐播放器（三类负面情绪触发）
 *     5. 本地持久化存储（localStorage + diaryId）
 *     6. 月度情绪可视化条形图（Chart.js）
 *     7. 数据导出（CSV 一键下载）
 *     8. 日记列表渲染与单条删除
 * ============================================
 */

(function () {
    'use strict';

    /* ========================================
     *  一、常量与配置
     * ======================================== */

    // 存储键名
    var STORAGE_KEYS = {
        UID: 'xinqing_uid',           // 用户唯一标识
        DIARIES: 'xinqing_diaries'     // 所有日记数据
    };

    /* ----- 五类情绪定义：标签、表情、代表色 ----- */
    var MOOD_TYPES = {
        happy:    { label: '开心',    emoji: '😊', color: '#FFD93D', bgColor: 'rgba(255,217,61,0.25)' },
        anxious:  { label: '焦虑委屈', emoji: '😥', color: '#FF8A80', bgColor: 'rgba(255,138,128,0.25)' },
        tired:    { label: '疲惫倦怠', emoji: '😔', color: '#90A4AE', bgColor: 'rgba(144,164,174,0.25)' },
        confused: { label: '迷茫困惑', emoji: '🫤', color: '#7EAAF6', bgColor: 'rgba(126,170,246,0.25)' },
        calm:     { label: '平静',    emoji: '😌', color: '#A5D6A7', bgColor: 'rgba(165,214,167,0.25)' }
    };

    /* ----- 正向词汇库（开心类关键词，权重较低） ----- */
    var POSITIVE_KEYWORDS = [
        '开心', '快乐', '高兴', '幸福', '兴奋', '棒', '太好了', '哈哈', '嘻嘻',
        '不错', '满足', '感动', '温馨', '惊喜', '有趣', '好玩', '厉害', '赞',
        '美好', '充实', '成功', '通过', '获奖', '梦想', '收获', '进步', '成长',
        '朋友', '陪伴', '支持', '感谢', '感恩', '幸运', '期待', '自信', '希望',
        '阳光', '温暖', '甜蜜', '恋爱', '表白', '约会', '笑', '愉快', '欢乐',
        '喜欢', '爱', '优秀', '出色', '完美', '顺利', '轻松', '舒服', '享受',
        '欣喜', '激动', '自豪', '骄傲', '满意', '舒适', '安心', '踏实', '欣慰',
        '欢喜', '雀跃', '畅快', '痛快', '过瘾', '得劲', '爽', '牛', '强',
        '给力', '靠谱', '好', '真棒', '超级棒', '上岸', '录取', '入选',
        '晋级', '赢', '胜利', '通关', '达标', '合格', '解决', '克服',
        '战胜', '突破', '超越', '第一', '冠军', '荣誉', '光荣', '荣耀',
        '辉煌', '搞定', '完成', '达成', '实现', '圆满', '越来越好', '喜悦'
    ];

    /* ----- 焦虑委屈类负面词库（权重最高） ----- */
    /*  覆盖：紧张、自卑、难堪、被嘲笑、压抑、难过、社交受挫 */
    var ANXIOUS_KEYWORDS = [
        '焦虑', '紧张', '担心', '害怕', '恐惧', '压力', '烦躁', '不安',
        '失眠', '睡不着', '心慌', '着急', '来不及', 'deadline',
        '考试', '期末', '挂科', '绩点', 'GPA', '保研', '考研', '面试',
        '简历', '实习', 'offer', '找工作', '竞争', '内卷', '催促',
        '焦虑症', '强迫', '恐慌', '崩溃', '受不了', '窒息', '委屈', '难过',
        '伤心', '想哭', '流泪', '悲伤', '痛苦', '绝望', '无助', '孤单', '孤独',
        '被孤立', '排挤', '欺负', '不公', '冤枉', '误解', '不被理解', '没人懂',
        '嘲笑', '难堪', '自卑', '压抑', '郁闷', '烦', '糟心', '倒霉', '不顺',
        '挫败', '失败', '退步', '落后', '不如人', '失望', '心寒', '心累',
        '无奈', '伤害', '折磨', '煎熬', '度日如年', '没意义',
        '愤怒', '生气', '恼火', '火大', '暴怒', '怨恨', '嫉妒',
        '讨厌', '厌恶', '恶心', '反感', '抵触', '抗拒',
        '噩梦', '惊恐', '惶恐', '忐忑', '心神不宁', '魂不守舍', '坐立不安',
        '寝食难安', '茶饭不思', '夜不能寐', '辗转反侧', '难以入眠',
        '神经衰弱', '敏感', '多疑', '猜忌', '忧愁', '忧伤', '忧郁',
        '愁闷', '苦闷', '烦恼', '苦恼', '困扰', '烦扰',
        '创伤', '伤疤', '阴霾', '暴风雨',
        '自责', '内疚', '愧疚', '羞耻', '丢人', '丢脸', '尴尬',
        '被拒绝', '被否定', '不被认可', '不被重视', '被忽视',
        '社交恐惧', '社恐', '不敢说话', '不合群', '融入不了',
        '家暴', '校园暴力', '霸凌', '网络暴力', '网暴',
        '原生家庭', '家庭矛盾', '父母离异', '留守儿童',
        '容貌焦虑', '身材焦虑', '学历焦虑', '同龄人比较',
        '抑郁', '抑郁症', '自残', '自伤', '轻生'
    ];

    /* ----- 疲惫倦怠类词汇库 ----- */
    /*  覆盖：身心透支、乏力、麻木、熬夜劳累、学习超负荷 */
    var TIRED_KEYWORDS = [
        '累', '疲惫', '困', '乏', '无力', '没劲', '倦怠', '疲惫不堪', '精疲力尽',
        '加班', '熬夜', '通宵', '赶作业', '赶论文', '实验', '项目',
        '忙', '忙碌', '连轴转', '头昏', '眼花', '腰酸', '背痛',
        '起不来', '睡不够', '没精神', '打哈欠', '身心俱疲', '透支', '消耗',
        '耗尽', '虚脱', '疲软', '懒散', '怠惰', '无精打采', '萎靡', '颓废',
        '撑不住', '扛不住', '吃不消', '顶不住', '熬不住', '撑不下去了',
        '想休息', '想睡觉', '想躺平', '不想动', '懒得',
        '倦怠期', '职业倦怠', '学习倦怠', 'burnout', '麻木', '困倦',
        '体力不支', '用脑过度', '用眼过度', '肩颈酸痛', '颈椎病',
        '黑眼圈', '掉头发', '脱发', '记忆力下降', '注意力不集中',
        '头重脚轻', '四肢无力', '浑身无力', '眼皮打架'
    ];

    /* ----- 迷茫困惑类专属词库（新增） ----- */
    /*  覆盖：未来方向、学业就业不确定、纠结、看不到目标 */
    var CONFUSED_KEYWORDS = [
        '迷茫', '困惑', '不知所措', '纠结', '没有方向', '看不清前路', '犹豫', '彷徨',
        '不知道该', '不确定', '选什么', '前途', '出路', '方向不清',
        '转专业', '该不该', '值不值得', '怎么办', '到底选',
        '自我怀疑', '怀疑人生', '失去方向', '迷失', '迷途', '困局',
        '徘徊', '犹豫不决', '举棋不定', '左右为难', '进退两难', '进退维谷', '骑虎难下',
        '看不到目标', '看不到未来', '看不到出路', '没目标', '没梦想', '没动力',
        '茫然', '茫然若失', '一片茫然', '迷茫期', '迷茫中', '迷茫感',
        '何去何从', '去哪里', '走哪条路', '路在何方',
        '毕业焦虑', '就业方向', '考研还是工作', '考公还是就业',
        '出国还是留下', '留学还是考研', '大城市还是回家',
        '不知道自己', '不了解自己', '找不到自己', '不认识自己',
        '不知道喜欢', '不知道想要', '不知道能做什么', '不知道会怎样',
        '怀疑自己', '否定自己', '瞧不起自己', '看不起自己',
        '同龄人压力', '同辈压力', '别人都', '只有我', '就我',
        '人生意义', '活着的意义', '为了什么', '图什么',
        '随波逐流', '随大流', '盲目跟风', '没有主见',
        '选择困难', '选择恐惧', '选择障碍',
        '错失', '错过', '遗憾', '后悔', '如果当初', '要是',
        '浪费', '浪费时间', '虚度', '蹉跎',
        '十字路口', '岔路口', '分岔路', '转折点',
        '看不到头', '遥遥无期', '遥不可及', '远在天边',
        '悬而未决', '未定', '待定', '不了了之'
    ];

    /* ----- 情感否定词（用于对正面情绪打折） ----- */
    var NEGATION_WORDS = ['不', '没', '别', '不要', '不再', '不能', '不会', '未', '无', '非', '莫', '勿', '毋'];

    /* ----- 舒缓音乐推荐库（免费可播放的公共领域音乐） ----- */
    var MUSIC_LIBRARY = {
        anxious: [
            { name: 'Clair de Lune',      artist: 'Debussy',          url: 'https://cdn.pixabay.com/audio/2022/02/22/audio_d1718ab41b.mp3' },
            { name: 'Gymnopedie No.1',     artist: 'Erik Satie',       url: 'https://cdn.pixabay.com/audio/2024/11/01/audio_3d02c47e79.mp3' },
            { name: 'River Flows in You',  artist: 'Yiruma',           url: 'https://cdn.pixabay.com/audio/2022/05/27/audio_1808fbf07a.mp3' },
            { name: 'Nocturne Op.9 No.2',  artist: 'Chopin',           url: 'https://cdn.pixabay.com/audio/2023/10/30/audio_564af18b04.mp3' },
            { name: 'Wiegenlied',           artist: 'Brahms',           url: 'https://cdn.pixabay.com/audio/2024/09/09/audio_61b1012eaa.mp3' }
        ],
        tired: [
            { name: 'Weightless',           artist: 'Marconi Union',    url: 'https://cdn.pixabay.com/audio/2022/01/18/audio_d0a13f69d2.mp3' },
            { name: 'Nuvole Bianche',       artist: 'Ludovico Einaudi', url: 'https://cdn.pixabay.com/audio/2022/10/25/audio_59492714b1.mp3' },
            { name: 'Experience',           artist: 'Ludovico Einaudi', url: 'https://cdn.pixabay.com/audio/2023/05/16/audio_2e2bfe81de.mp3' },
            { name: 'Merry Go Round',       artist: 'Mokka',            url: 'https://cdn.pixabay.com/audio/2022/03/10/audio_0e792b6870.mp3' },
            { name: 'Ambient Relaxation',   artist: 'Soundbay',         url: 'https://cdn.pixabay.com/audio/2024/01/09/audio_cb4e3e91e7.mp3' }
        ],
        confused: [
            { name: 'Comptine d\'un autre ete', artist: 'Yann Tiersen', url: 'https://cdn.pixabay.com/audio/2022/07/19/audio_0e65c23dca.mp3' },
            { name: 'Spring',               artist: 'Chopin',           url: 'https://cdn.pixabay.com/audio/2024/01/26/audio_452945e10e.mp3' },
            { name: 'Raindrops',            artist: 'FXB Audio',        url: 'https://cdn.pixabay.com/audio/2022/08/31/audio_80aaf08f2b.mp3' },
            { name: 'Calm Mind',            artist: 'Lesfm',            url: 'https://cdn.pixabay.com/audio/2024/08/15/audio_f67abf7f97.mp3' },
            { name: 'Peaceful Moment',      artist: 'Soundbay',         url: 'https://cdn.pixabay.com/audio/2023/09/04/audio_2d6b06e8f9.mp3' }
        ]
    };

    /* ----- 五类情绪专属疏导建议文案库 ----- */
    var ADVICE_LIBRARY = {
        happy: [
            '🎉 太棒了！开心的时候记得好好享受这一刻。可以尝试把快乐写在日记里，未来翻看时会发现生活其实很美好。也记得把这份快乐分享给身边的朋友哦！',
            '🌟 你的笑容是有感染力的！趁心情好的时候，不妨给自己定一个小目标，积极的情绪是推动我们前进最好的动力。继续加油！',
            '🌈 今天是个好日子！开心的时候就尽情享受吧。你可以试着用画画、听歌或者运动来延续这份好心情，让快乐延续一整天！',
            '☀️ 看到你这么开心真为你高兴！积极的情绪就像阳光，照耀自己也温暖他人。建议你把今天的好心情记录下来，成为未来前进的力量！'
        ],
        anxious: [
            '🌿 深呼吸，慢慢来。焦虑是大脑在提醒你重视某件事，但过度焦虑会消耗你的能量。试试「4-7-8呼吸法」：吸气4秒、屏住7秒、呼气8秒，重复3-5次，会明显感到平静。委屈的时候也可以找一个信任的人倾诉。',
            '💪 你不是一个人在面对这些。焦虑委屈时可以先停下来，问问自己：「最坏的结果是什么？我能承受吗？」大多数情况下，结果没有想象中那么糟。必要时可以向学校的心理咨询中心寻求帮助。',
            '🫂 感到委屈的时候，请记得你的感受是真实的、值得被尊重的。试试把脑子里乱糟糟的想法写在纸上，一条一条列出来。你会发现，写出来之后压力会减轻很多。规律作息和充足睡眠是缓解焦虑的基础。',
            '🧘 焦虑和委屈都是正常的情绪反应，不必为此自责。建议你试试「正念冥想」，每天花5-10分钟安静地关注自己的呼吸。如果负面情绪持续影响生活，请及时联系学校心理辅导老师，寻求帮助是勇敢的表现。'
        ],
        tired: [
            '😴 累了就好好休息吧，你不是机器。今天可以早点上床，睡前泡个热水脚、听一首轻音乐。给自己一个「允许休息」的许可，休息是为了走更远的路。',
            '🍵 身体在提醒你需要充电了。不妨给自己安排一个「慢节奏日」：放下手机、去校园里散步、晒晒太阳、吃一顿自己喜欢的饭。小小的放松就能恢复很多能量。',
            '🌙 持续的疲惫可能是身体发出的信号。建议检查一下最近是不是熬夜太多、饮食不规律？试着调整作息时间，保证每天7-8小时的睡眠，适当运动也会帮你恢复活力。',
            '🌊 疲惫时不要硬撑，学会说「今天到此为止」也是一种智慧。试试给自己一个20分钟的小憩，或者做几组简单的拉伸运动，你会发现状态会好很多。'
        ],
        confused: [
            '🧭 迷茫是成长的必经之路，说明你正在认真思考自己的人生。不需要马上找到答案，试着从「排除法」开始——先弄清楚自己不想要什么，答案会慢慢浮现的。',
            '🗺️ 不知道往哪走的时候，就先走好眼前的每一步。与其纠结遥远的未来，不如专注于当下的学习和生活。多去体验、多去尝试，方向会在行动中逐渐清晰。迷茫不代表你走错了路。',
            '💡 建议你找一个信任的学长学姐或老师聊聊，他们走过的路可能会给你启发。也可以去学校的职业规划中心做个测评，帮助自己更好地了解自己的兴趣和优势。迷茫是暂时的，行动是最好的解药。',
            '🌱 每个人都会经历迷茫期，这不代表你不行。试试写下你最感兴趣的3件事和最看重的3个价值观，看看它们之间有没有交集，那里可能就藏着你的方向。给自己一点耐心，你比自己想象的更有力量。'
        ],
        calm: [
            '🍃 平静也是一种幸福。不是每一天都需要波澜壮阔，能够安然度过平凡的一天，本身就是一种能力。今天的你也很棒！',
            '☕ 平静的日子最适合给自己充电。不妨读一本一直想看的书、学一个感兴趣的小技能，或者整理一下自己的房间和思绪，为下一段旅程做准备。',
            '🌸 平淡的日子里有细碎的小确幸等着你去发现。今天有没有注意到校园里花开的样子？食堂有没有新菜？同学有没有和你打招呼？这些微小的事物都值得珍惜。',
            '🎨 既然心情平静，不如试着做一些平时没时间做的事情：画画、写诗、听一首新的歌单。平静的状态最适合创造，让灵感自由流动吧！'
        ]
    };


    /* ========================================
     *  二、DOM 元素获取（延迟到 DOMContentLoaded）
     * ======================================== */

    var dom = null;

    function getDomElements() {
        return {
            diaryDate:        document.getElementById('diaryDate'),
            diaryText:        document.getElementById('diaryText'),
            uidDisplay:       document.getElementById('uidDisplay'),
            emotionResult:    document.getElementById('emotionResult'),
            emotionTag:       document.getElementById('emotionTag'),
            emotionLabel:     document.getElementById('emotionLabel'),
            emotionConfidence:document.getElementById('emotionConfidence'),
            adviceContent:    document.getElementById('adviceContent'),
            btnAnalyze:       document.getElementById('btnAnalyze'),
            btnSave:          document.getElementById('btnSave'),
            btnExport:        document.getElementById('btnExport'),
            chartMonth:       document.getElementById('chartMonth'),
            chartContainer:   document.getElementById('chartContainer'),
            chartEmpty:       document.getElementById('chartEmpty'),
            diaryList:        document.getElementById('diaryList'),
            toastContainer:   document.getElementById('toastContainer'),
            deleteModal:      document.getElementById('deleteModal'),
            btnCancelDelete:  document.getElementById('btnCancelDelete'),
            btnConfirmDelete: document.getElementById('btnConfirmDelete'),
            // 音乐播放器元素
            musicModal:       document.getElementById('musicModal'),
            musicMoodLabel:   document.getElementById('musicMoodLabel'),
            musicName:        document.getElementById('musicName'),
            musicArtist:      document.getElementById('musicArtist'),
            musicAudio:       document.getElementById('musicAudio'),
            musicDisc:        document.getElementById('musicDisc'),
            musicBtnPlay:     document.getElementById('musicBtnPlay'),
            musicBtnPause:    document.getElementById('musicBtnPause'),
            musicBtnStop:     document.getElementById('musicBtnStop'),
            musicBtnClose:    document.getElementById('musicBtnClose')
        };
    }


    /* ========================================
     *  三、工具函数
     * ======================================== */

    /** 生成唯一ID */
    function generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 6);
    }

    /** 获取或创建用户UID */
    function getOrCreateUID() {
        var uid = localStorage.getItem(STORAGE_KEYS.UID);
        if (!uid) {
            uid = 'U_' + generateId();
            localStorage.setItem(STORAGE_KEYS.UID, uid);
        }
        return uid;
    }

    /** 获取全部日记数据 */
    function getAllDiaries() {
        try {
            var data = localStorage.getItem(STORAGE_KEYS.DIARIES);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            return [];
        }
    }

    /** 保存全部日记数据 */
    function saveAllDiaries(diaries) {
        localStorage.setItem(STORAGE_KEYS.DIARIES, JSON.stringify(diaries));
    }

    /** 获取今天日期 YYYY-MM-DD */
    function getTodayStr() {
        var d = new Date();
        return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    }

    /** 获取当前年月 YYYY-MM */
    function getCurrentMonthStr() {
        var d = new Date();
        return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
    }

    /** Toast 通知 */
    function showToast(message, type) {
        var toast = document.createElement('div');
        toast.className = 'toast' + (type ? ' ' + type : '');
        toast.textContent = message;
        dom.toastContainer.appendChild(toast);
        setTimeout(function () {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(40px)';
            toast.style.transition = 'all 0.3s';
            setTimeout(function () {
                if (toast.parentNode) toast.parentNode.removeChild(toast);
            }, 300);
        }, 3000);
    }

    /** HTML转义防XSS */
    function escapeHtml(str) {
        var div = document.createElement('div');
        div.appendChild(document.createTextNode(str));
        return div.innerHTML;
    }

    /**
     * 兼容旧版4类数据的情绪映射
     * 旧版 confused → anxious；新版 confused 保留
     */
    function mapLegacyMood(mood) {
        if (MOOD_TYPES.hasOwnProperty(mood)) return mood;
        if (mood === 'confused') return 'confused'; // 新版直接保留
        return 'calm';
    }


    /* ========================================
     *  四、AI 情绪识别引擎（五类权重计分法）
     * ======================================== */

    /**
     * 统计文本中某组关键词的总加权得分
     * @param {string} text 日记文本
     * @param {Array} keywords 关键词数组
     * @param {number} shortWeight 短词权重（<=2字）
     * @param {number} longWeight 长词权重（>=3字）
     * @returns {number} 总得分
     */
    function scoreKeywords(text, keywords, shortWeight, longWeight) {
        var total = 0;
        keywords.forEach(function (keyword) {
            var escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            var regex = new RegExp(escaped, 'g');
            var matches = text.match(regex);
            if (matches) {
                var count = matches.length;
                var weight = keyword.length >= 3 ? longWeight : shortWeight;
                total += count * weight;
            }
        });
        return total;
    }

    /**
     * 五类情绪分析引擎
     * 正负词汇权重计分法：负面词权重远高于正词
     * 三类负面（焦虑/疲惫/迷茫）独立计分，互不混淆
     *
     * 权重设计：
     *   正向词：短×1，长×2
     *   焦虑委屈词：短×5，长×6
     *   疲惫倦怠词：短×5，长×6
     *   迷茫困惑词：短×5，长×6
     *
     * @param {string} text 用户输入的日记文本
     * @returns {Object} { mood, scores, confidence }
     */
    function analyzeEmotion(text) {
        // Step 1: 四路独立计分
        var posScore     = scoreKeywords(text, POSITIVE_KEYWORDS, 1, 2);
        var anxiousScore = scoreKeywords(text, ANXIOUS_KEYWORDS, 5, 6);
        var tiredScore   = scoreKeywords(text, TIRED_KEYWORDS,   5, 6);
        var confusedScore= scoreKeywords(text, CONFUSED_KEYWORDS, 5, 6);

        // Step 2: 否定词检测 → 正面情绪打3折
        var hasNegation = NEGATION_WORDS.some(function (w) {
            return text.indexOf(w) !== -1;
        });
        if (hasNegation) {
            posScore = posScore * 0.3;
        }

        // Step 3: 五类判定
        var resultMood = 'calm';
        var maxScore = 0;
        var totalScore = posScore + anxiousScore + tiredScore + confusedScore;

        // 找出三类负面中得分最高的
        var maxNegScore = Math.max(anxiousScore, tiredScore, confusedScore);

        if (totalScore === 0) {
            // 无任何关键词 → 平静
            resultMood = 'calm';
            maxScore = 1;
            totalScore = 1;
        } else if (posScore > maxNegScore) {
            // 正词得分超过所有负面 → 开心
            resultMood = 'happy';
            maxScore = posScore;
        } else {
            // 负面得分更高 → 按最高分归类
            if (anxiousScore >= tiredScore && anxiousScore >= confusedScore) {
                resultMood = 'anxious';
                maxScore = anxiousScore;
            } else if (confusedScore >= tiredScore) {
                resultMood = 'confused';
                maxScore = confusedScore;
            } else {
                resultMood = 'tired';
                maxScore = tiredScore;
            }
        }

        return {
            mood: resultMood,
            scores: {
                happy:    Math.round(posScore * 10) / 10,
                anxious:  Math.round(anxiousScore * 10) / 10,
                tired:    Math.round(tiredScore * 10) / 10,
                confused: Math.round(confusedScore * 10) / 10
            },
            confidence: totalScore > 0 ? Math.round((maxScore / totalScore) * 100) : 0
        };
    }


    /* ========================================
     *  五、疏导建议匹配
     * ======================================== */

    /** 根据情绪类型随机获取一条疏导建议 */
    function getAdvice(moodType) {
        var advices = ADVICE_LIBRARY[moodType] || ADVICE_LIBRARY.calm;
        return advices[Math.floor(Math.random() * advices.length)];
    }


    /* ========================================
     *  六、UI 渲染函数
     * ======================================== */

    var pendingAnalysis = null;   // 待保存的情绪分析结果
    var pendingDeleteId  = null;   // 待删除的日记ID
    var moodChartInstance = null;  // Chart.js 实例

    /** 初始化页面 */
    function initPage() {
        var uid = getOrCreateUID();
        dom.uidDisplay.textContent = 'UID: ' + uid.substring(0, 8) + '...';
        dom.diaryDate.value = getTodayStr();
        dom.chartMonth.value = getCurrentMonthStr();
        dom.btnSave.style.display = 'none';
        renderDiaryList();
        renderChart();
    }

    /** 显示情绪识别结果 */
    function showEmotionResult(analysis) {
        var moodInfo = MOOD_TYPES[analysis.mood];
        dom.emotionTag.textContent = moodInfo.emoji;
        dom.emotionLabel.textContent = '检测到情绪：' + moodInfo.label;
        dom.emotionLabel.style.color = moodInfo.color;

        // 展示五类计分明细
        var s = analysis.scores;
        var detail = '开心 ' + s.happy + ' / 焦虑 ' + s.anxious + ' / 疲惫 ' + s.tired + ' / 迷茫 ' + s.confused;
        dom.emotionConfidence.textContent = '置信度：' + analysis.confidence + '%（' + detail + '）';
        dom.emotionResult.classList.add('show');
    }

    /** 显示疏导建议 */
    function showAdvice(moodType) {
        var advice = getAdvice(moodType);
        dom.adviceContent.innerHTML = '';
        dom.adviceContent.classList.add('has-advice');
        dom.adviceContent.textContent = advice;
    }

    /** 渲染日记历史列表 */
    function renderDiaryList() {
        var diaries = getAllDiaries();
        if (diaries.length === 0) {
            dom.diaryList.innerHTML = '<div class="empty-history">还没有日记记录，开始书写你的第一篇心情日记吧 🌸</div>';
            return;
        }
        diaries.sort(function (a, b) {
            return b.date.localeCompare(a.date) || b.timestamp - a.timestamp;
        });
        var html = '';
        diaries.forEach(function (diary) {
            var mood = MOOD_TYPES[diary.mood] || MOOD_TYPES.calm;
            html += '<div class="diary-item" style="border-left-color:' + mood.color + ';">';
            html += '  <div class="diary-emoji">' + mood.emoji + '</div>';
            html += '  <div class="diary-body">';
            html += '    <div class="diary-date">' + diary.date + '　|　' + mood.label + '</div>';
            html += '    <div class="diary-text">' + escapeHtml(diary.text) + '</div>';
            html += '    <div class="diary-mood-label">ID: ' + diary.diaryId + '</div>';
            html += '  </div>';
            html += '  <button class="btn-delete" data-id="' + diary.diaryId + '">删除</button>';
            html += '</div>';
        });
        dom.diaryList.innerHTML = html;
    }

    /** 渲染月度情绪条形图（五类） */
    function renderChart() {
        var selectedMonth = dom.chartMonth.value;
        var diaries = getAllDiaries();
        var monthDiaries = diaries.filter(function (d) {
            return d.date.substring(0, 7) === selectedMonth;
        });

        // 统计五类情绪数量
        var counts = { happy: 0, anxious: 0, tired: 0, confused: 0, calm: 0 };
        monthDiaries.forEach(function (d) {
            var mood = d.mood && MOOD_TYPES.hasOwnProperty(d.mood) ? d.mood : 'calm';
            counts[mood]++;
        });

        var hasData = monthDiaries.length > 0;
        dom.chartContainer.style.display = hasData ? 'flex' : 'none';
        dom.chartEmpty.style.display = hasData ? 'none' : 'block';

        if (!hasData) {
            if (moodChartInstance) { moodChartInstance.destroy(); moodChartInstance = null; }
            return;
        }

        var labels = [], data = [], bgColors = [], borderColors = [];
        Object.keys(MOOD_TYPES).forEach(function (key) {
            var m = MOOD_TYPES[key];
            labels.push(m.emoji + ' ' + m.label);
            data.push(counts[key]);
            bgColors.push(m.bgColor);
            borderColors.push(m.color);
        });

        if (moodChartInstance) moodChartInstance.destroy();

        var ctx = document.getElementById('moodChart').getContext('2d');
        moodChartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: selectedMonth + ' 情绪记录数',
                    data: data,
                    backgroundColor: bgColors,
                    borderColor: borderColors,
                    borderWidth: 2,
                    borderRadius: 8,
                    borderSkipped: false
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: 'rgba(255,255,255,0.95)',
                        titleColor: '#6b5b95',
                        bodyColor: '#4a4a4a',
                        borderColor: '#e0d4e8',
                        borderWidth: 1,
                        cornerRadius: 10,
                        padding: 12
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { stepSize: 1, color: '#999', font: { size: 12 } },
                        grid: { color: 'rgba(200,180,200,0.15)' }
                    },
                    x: {
                        ticks: { color: '#6b5b95', font: { size: 12 } },
                        grid: { display: false }
                    }
                },
                animation: { duration: 800, easing: 'easeOutQuart' }
            }
        });
    }


    /* ========================================
     *  七、CSV 数据导出
     * ======================================== */

    function exportCSV() {
        var diaries = getAllDiaries();
        if (diaries.length === 0) {
            showToast('暂无日记数据可导出', 'warning');
            return;
        }
        var BOM = '\uFEFF';
        var header = '日记ID,日期,情绪类型,日记内容\n';
        var rows = '';
        diaries.forEach(function (d) {
            var mood = MOOD_TYPES[d.mood] || MOOD_TYPES.calm;
            var text = d.text.replace(/"/g, '""');
            rows += d.diaryId + ',' + d.date + ',' + mood.label + ',"' + text + '"\n';
        });
        var blob = new Blob([BOM + header + rows], { type: 'text/csv;charset=utf-8;' });
        var url = URL.createObjectURL(blob);
        var link = document.createElement('a');
        link.href = url;
        link.download = '心晴日记_全部记录_' + getTodayStr() + '.csv';
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        showToast('已成功导出 ' + diaries.length + ' 条日记记录', 'success');
    }


    /* ========================================
     *  八、日记删除功能
     * ======================================== */

    function showDeleteModal(diaryId) {
        pendingDeleteId = diaryId;
        dom.deleteModal.classList.add('show');
    }

    function hideDeleteModal() {
        pendingDeleteId = null;
        dom.deleteModal.classList.remove('show');
    }

    function confirmDelete() {
        if (!pendingDeleteId) return;
        var diaries = getAllDiaries();
        var filtered = diaries.filter(function (d) { return d.diaryId !== pendingDeleteId; });
        if (filtered.length < diaries.length) {
            saveAllDiaries(filtered);
            showToast('日记已删除', 'success');
        }
        hideDeleteModal();
        renderDiaryList();
        renderChart();
    }


    /* ========================================
     *  八-B、舒缓音乐推荐播放器
     * ======================================== */

    var currentMusic = null;

    /**
     * 根据情绪类型弹出音乐推荐弹窗
     * 焦虑委屈、疲惫倦怠、迷茫困惑三类负面情绪触发
     * 开心、平静不触发
     */
    function showMusicRecommendation(moodType) {
        var playlist = MUSIC_LIBRARY[moodType];
        if (!playlist) return; // 开心和平静不弹

        var track = playlist[Math.floor(Math.random() * playlist.length)];
        currentMusic = track;

        var moodInfo = MOOD_TYPES[moodType];
        dom.musicMoodLabel.textContent = '检测到「' + moodInfo.label + '」情绪，送你一首舒缓音乐，放松一下 ☀️';
        dom.musicName.textContent = track.name;
        dom.musicArtist.textContent = track.artist;
        dom.musicAudio.src = track.url;
        dom.musicAudio.load();

        dom.musicBtnPlay.style.display = 'inline-block';
        dom.musicBtnPause.style.display = 'none';
        dom.musicDisc.classList.remove('spinning');

        dom.musicModal.classList.add('show');
    }

    /** 停止音乐并关闭弹窗 */
    function closeMusicPlayer() {
        dom.musicAudio.pause();
        dom.musicAudio.currentTime = 0;
        dom.musicAudio.src = '';
        dom.musicDisc.classList.remove('spinning');
        dom.musicModal.classList.remove('show');
        currentMusic = null;
    }


    /* ========================================
     *  九、事件绑定
     * ======================================== */

    function bindEvents() {
        // —— 识别情绪按钮 ——
        dom.btnAnalyze.addEventListener('click', function () {
            var text = dom.diaryText.value.trim();
            if (!text) {
                showToast('请先写下你的心情日记再识别哦 ✍️', 'warning');
                return;
            }
            if (text.length < 2) {
                showToast('再多写几个字吧，这样分析更准确 🌿', 'warning');
                return;
            }

            var analysis = analyzeEmotion(text);
            pendingAnalysis = analysis;

            showEmotionResult(analysis);
            showAdvice(analysis.mood);
            dom.btnSave.style.display = 'inline-block';

            // 三类负面情绪自动弹出舒缓音乐
            showMusicRecommendation(analysis.mood);
        });

        // —— 保存日记按钮 ——
        dom.btnSave.addEventListener('click', function () {
            var text = dom.diaryText.value.trim();
            var date = dom.diaryDate.value;
            if (!text) { showToast('日记内容不能为空', 'warning'); return; }
            if (!date) { showToast('请选择日期', 'warning'); return; }
            if (!pendingAnalysis) { showToast('请先识别情绪', 'warning'); return; }

            var diary = {
                diaryId: 'D_' + generateId(),
                uid: getOrCreateUID(),
                date: date,
                text: text,
                mood: pendingAnalysis.mood,
                timestamp: Date.now()
            };

            var diaries = getAllDiaries();
            diaries.push(diary);
            saveAllDiaries(diaries);

            dom.diaryText.value = '';
            dom.btnSave.style.display = 'none';
            dom.emotionResult.classList.remove('show');
            pendingAnalysis = null;
            dom.adviceContent.innerHTML = '<span class="advice-placeholder">写下你的心情日记后，点击"识别情绪"，这里会出现专属于你的暖心小建议 ✨</span>';
            dom.adviceContent.classList.remove('has-advice');

            renderDiaryList();
            renderChart();
            showToast('日记保存成功！今天的你也很棒 🌟', 'success');
        });

        // —— 导出CSV ——
        dom.btnExport.addEventListener('click', exportCSV);

        // —— 月份选择器 ——
        dom.chartMonth.addEventListener('change', renderChart);

        // —— 日记删除（事件委托） ——
        dom.diaryList.addEventListener('click', function (e) {
            if (e.target.classList.contains('btn-delete')) {
                showDeleteModal(e.target.getAttribute('data-id'));
            }
        });

        // —— 删除弹窗 ——
        dom.btnCancelDelete.addEventListener('click', hideDeleteModal);
        dom.btnConfirmDelete.addEventListener('click', confirmDelete);
        dom.deleteModal.addEventListener('click', function (e) {
            if (e.target === dom.deleteModal) hideDeleteModal();
        });

        // —— 音乐播放器 ——
        dom.musicBtnPlay.addEventListener('click', function () {
            if (!currentMusic) return;
            dom.musicAudio.play().then(function () {
                dom.musicBtnPlay.style.display = 'none';
                dom.musicBtnPause.style.display = 'inline-block';
                dom.musicDisc.classList.add('spinning');
            }).catch(function () {
                showToast('音乐加载中，请稍后再试 🎵', 'warning');
            });
        });

        dom.musicBtnPause.addEventListener('click', function () {
            dom.musicAudio.pause();
            dom.musicBtnPlay.style.display = 'inline-block';
            dom.musicBtnPause.style.display = 'none';
            dom.musicDisc.classList.remove('spinning');
        });

        dom.musicBtnStop.addEventListener('click', closeMusicPlayer);
        dom.musicBtnClose.addEventListener('click', closeMusicPlayer);
        dom.musicModal.addEventListener('click', function (e) {
            if (e.target === dom.musicModal) closeMusicPlayer();
        });
    }


    /* ========================================
     *  十、启动应用
     * ======================================== */

    function init() {
        dom = getDomElements();
        initPage();
        bindEvents();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
