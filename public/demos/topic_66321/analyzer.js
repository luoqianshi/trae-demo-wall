/* ============================================
   analyzer.js - 文本分析引擎
   功能：关键词提取 / 实体识别 / 关系构建 / 重要性评分
   纯前端实现，无需后端 API
   ============================================ */

(function (global) {
    'use strict';

    /* ---------- 停用词表 ---------- */
    const STOPWORDS_ZH = new Set([
        '的', '了', '是', '在', '我', '有', '和', '就', '不', '人', '都', '一', '一个',
        '上', '也', '很', '到', '说', '要', '去', '你', '会', '着', '没有', '看', '好',
        '自己', '这', '那', '它', '他', '她', '我们', '你们', '他们', '这个', '那个',
        '可以', '但是', '因为', '所以', '如果', '虽然', '然而', '并且', '而且', '或者',
        '以及', '对于', '关于', '通过', '根据', '按照', '随着', '为了', '由于', '鉴于',
        '之后', '之前', '之间', '之内', '之外', '上面', '下面', '里面', '外面', '前面',
        '后面', '中间', '旁边', '左边', '右边', '现在', '过去', '未来', '今天', '明天',
        '昨天', '已经', '正在', '将要', '马上', '立刻', '突然', '慢慢', '渐渐', '一直',
        '总是', '经常', '有时', '偶尔', '从来', '几乎', '基本', '主要', '重要', '可能',
        '应该', '必须', '需要', '能够', '可以', '得以', '予以', '给予', '进行', '作出',
        '一种', '一些', '一般', '一样', '一直', '一定', '只有', '只要', '才是', '才是',
        '什么', '怎么', '为什么', '怎样', '哪里', '哪个', '哪些', '多少', '几个', '许多',
        '这些', '那些', '某种', '某些', '其他', '另外', '此外', '同时', '同样', '否则',
        '本文', '本节', '本章', '本书', '此次', '此外', '其中', '另外', '如下', '例如',
        '比如', '譬如', '总之', '总的', '总的来说', '总而言之', '换言之', '也就是说',
        '不仅', '而且', '不但', '还', '再', '又', '更', '最', '比较', '相对', '相当',
        '非常', '特别', '尤其', '十分', '极其', '格外', '万分', '绝对', '完全', '十分',
        '使得', '成为', '作为', '属于', '存在', '发生', '出现', '产生', '形成', '具有',
        '拥有', '包含', '包括', '涉及', '关于', '至于', '对于', '对', '跟', '向', '往',
        '从', '由', '为', '被', '把', '将', '给', '让', '使', '令', '请', '要求',
        '以及', '或', '与', '及', '并', '且', '而', '则', '即', '便', '就是', '便是',
        '等', '等等', '之类', '什么的', '之类的', '什么的', '等等', '之类', '什么的',
        '个', '位', '名', '件', '种', '类', '项', '次', '场', '部', '本', '册', '篇',
        '把', '条', '块', '片', '张', '根', '支', '枝', '朵', '棵', '颗', '粒', '滴'
    ]);

    const STOPWORDS_EN = new Set([
        'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
        'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
        'should', 'may', 'might', 'must', 'shall', 'can', 'need', 'dare',
        'and', 'or', 'but', 'if', 'then', 'else', 'when', 'where', 'why',
        'how', 'what', 'which', 'who', 'whom', 'this', 'that', 'these', 'those',
        'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us',
        'them', 'my', 'your', 'his', 'its', 'our', 'their', 'mine', 'yours',
        'hers', 'ours', 'theirs', 'to', 'of', 'in', 'on', 'at', 'by', 'for',
        'with', 'about', 'against', 'between', 'into', 'through', 'during',
        'before', 'after', 'above', 'below', 'from', 'up', 'down', 'out',
        'off', 'over', 'under', 'again', 'further', 'once', 'here', 'there',
        'all', 'any', 'both', 'each', 'few', 'more', 'most', 'other', 'some',
        'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too',
        'very', 's', 't', 'just', 'don', 'now', 'as', 'also', 'very', 'well',
        'will', 'one', 'two', 'three', 'first', 'second', 'last', 'new', 'old',
        'good', 'bad', 'big', 'small', 'high', 'low', 'long', 'short', 'great',
        'little', 'own', 'same', 'other', 'such', 'many', 'much', 'more', 'most',
        'into', 'onto', 'within', 'without', 'upon', 'along', 'around', 'behind',
        'beside', 'beyond', 'toward', 'towards', 'until', 'among', 'amongst',
        'during', 'throughout', 'via', 'per', 'versus', 'via', 'amid', 'amidst'
    ]);

    /* ---------- 领域词典（用于实体识别与分词增强） ---------- */
    // 技术类
    const DICT_TECH = new Set([
        '人工智能', '机器学习', '深度学习', '神经网络', '自然语言处理', '计算机视觉',
        '强化学习', '监督学习', '无监督学习', '半监督学习', '迁移学习', '联邦学习',
        '知识图谱', '知识表示', '知识抽取', '知识推理', '知识融合', '知识建模',
        '大模型', '语言模型', '生成式', '预训练', '微调', '提示工程', '向量数据库',
        '向量检索', '语义搜索', '嵌入', 'embedding', 'transformer', 'attention',
        '算法', '模型', '训练', '推理', '参数', '梯度', '损失函数', '激活函数',
        '过拟合', '欠拟合', '正则化', '归一化', '标准化', '反向传播', '前向传播',
        '卷积', '池化', '全连接', '循环神经网络', '长短期记忆', '生成对抗网络',
        '自编码器', '变分自编码器', '扩散模型', '生成模型', '判别模型', '聚类',
        '分类', '回归', '决策树', '随机森林', '支持向量机', '朴素贝叶斯', 'k近邻',
        '梯度提升', '集成学习', '特征工程', '特征选择', '降维', '主成分分析',
        '数据库', '关系型', '非关系型', '分布式', '微服务', '容器化', 'docker',
        'kubernetes', 'devops', '持续集成', '持续部署', '敏捷开发', '架构设计',
        '前端', '后端', '全栈', '框架', '组件', '模块', '接口', '协议', 'http',
        '缓存', '队列', '负载均衡', '高可用', '容灾', '监控', '日志', '告警',
        '区块链', '智能合约', '加密货币', '比特币', '以太坊', '去中心化', '共识机制',
        '云计算', '边缘计算', '雾计算', 'serverless', 'iaas', 'paas', 'saas',
        '物联网', '传感器', '嵌入式', '硬件', '芯片', '处理器', '内存', '存储',
        '操作系统', 'linux', 'windows', 'macos', '文件系统', '进程', '线程', '并发',
        '编程语言', 'python', 'java', 'javascript', 'c++', 'go', 'rust', 'typescript',
        '数据结构', '链表', '树', '图', '哈希表', '栈', '队列', '堆', '排序', '查找',
        '时间复杂度', '空间复杂度', '动态规划', '贪心算法', '分治', '回溯', '递归'
    ]);

    // 概念/方法论类
    const DICT_CONCEPT = new Set([
        '思维', '认知', '学习', '记忆', '理解', '思考', '分析', '综合', '归纳',
        '演绎', '推理', '判断', '决策', '问题', '解决', '创新', '创造', '灵感',
        '直觉', '逻辑', '抽象', '具体', '概念', '理论', '假设', '验证', '实验',
        '观察', '数据', '信息', '知识', '智慧', '经验', '规律', '原则', '方法',
        '策略', '技巧', '习惯', '能力', '技能', '天赋', '努力', '兴趣', '动机',
        '目标', '计划', '执行', '反馈', '改进', '优化', '迭代', '敏捷', '精益',
        '系统', '要素', '关系', '结构', '功能', '过程', '流程', '输入', '输出',
        '反馈循环', '因果关系', '相关性', '概率', '统计', '变量', '常量', '函数',
        '模型', '范式', '框架', '体系', '架构', '层次', '维度', '视角', '角度',
        '效率', '效果', '质量', '成本', '风险', '收益', '价值', '意义', '目的'
    ]);

    // 人物类（常见领域人物）
    const DICT_PERSON = new Set([
        '孔子', '老子', '庄子', '孟子', '荀子', '韩非子', '墨子', '孙子',
        '诸葛亮', '曹操', '刘备', '关羽', '张飞', '赵云', '孙权', '周瑜',
        '李白', '杜甫', '白居易', '苏轼', '王安石', '欧阳修', '韩愈', '柳宗元',
        '朱元璋', '康熙', '乾隆', '雍正', '张居正', '王阳明', '黄宗羲', '顾炎武',
        '图灵', '冯诺依曼', '香农', '高德纳', '丹尼斯里奇', '林纳斯托瓦兹',
        '艾伦凯', '蒂姆伯纳斯李', '维特根斯坦', '罗素', '康德', '黑格尔', '尼采',
        '达尔文', '牛顿', '爱因斯坦', '麦克斯韦', '玻尔兹曼', '费曼', '霍金',
        '图灵', '辛顿', '杨立昆', '本吉奥', '吴恩达', '李飞飞', '何恺明'
    ]);

    // 地点类
    const DICT_PLACE = new Set([
        '中国', '北京', '上海', '广州', '深圳', '杭州', '成都', '武汉', '南京',
        '西安', '天津', '重庆', '苏州', '青岛', '大连', '厦门', '宁波', '长沙',
        '美国', '日本', '韩国', '英国', '法国', '德国', '意大利', '俄罗斯',
        '加拿大', '澳大利亚', '印度', '巴西', '新加坡', '马来西亚', '泰国',
        '纽约', '洛杉矶', '旧金山', '西雅图', '波士顿', '芝加哥', '伦敦', '巴黎',
        '柏林', '东京', '首尔', '香港', '台湾', '澳门', '欧洲', '亚洲', '美洲',
        '非洲', '大洋洲', '南极洲', '北极', '太平洋', '大西洋', '印度洋'
    ]);

    // 组织机构类
    const DICT_ORG = new Set([
        '谷歌', 'google', '微软', 'microsoft', '苹果', 'apple', '亚马逊', 'amazon',
        'meta', 'facebook', '特斯拉', 'tesla', '英伟达', 'nvidia', 'openai',
        '阿里', '阿里巴巴', '腾讯', '字节跳动', '字节', '百度', 'baidu', '华为',
        '小米', '京东', '美团', '拼多多', '网易', '新浪', '搜狐', '360',
        '清华大学', '北京大学', '复旦大学', '上海交通大学', '浙江大学', '南京大学',
        '中国科学技术大学', '华中科技大学', '武汉大学', '中山大学', '麻省理工',
        '斯坦福', '哈佛', '剑桥', '牛津', '卡内基梅隆', '加州大学', '伯克利',
        '中科院', '工程院', '科学院', 'ieee', 'acm', 'w3c', 'iso', 'ietf'
    ]);

    // 时间相关词
    const DICT_TIME = new Set([
        '古代', '近代', '现代', '当代', '远古', '上古', '中古', '文艺复兴',
        '工业革命', '信息时代', '互联网时代', '人工智能时代', '大数据时代',
        '春秋', '战国', '秦朝', '汉朝', '唐朝', '宋朝', '元朝', '明朝', '清朝',
        '民国', '新中国成立', '改革开放', '二十一世纪', '二十世纪', '十九世纪'
    ]);

    /* ---------- 类别配置 ---------- */
    const CATEGORIES = {
        technology: { label: '技术', color: '#667eea', dict: DICT_TECH },
        concept: { label: '概念', color: '#f093fb', dict: DICT_CONCEPT },
        person: { label: '人物', color: '#f5576c', dict: DICT_PERSON },
        place: { label: '地点', color: '#4facfe', dict: DICT_PLACE },
        organization: { label: '机构', color: '#43e97b', dict: DICT_ORG },
        time: { label: '时代', color: '#fa709a', dict: DICT_TIME },
        other: { label: '其他', color: '#a8a8b8' }
    };

    /* ---------- 工具函数 ---------- */

    // 中文分词：基于词典最大匹配 + 字符切分
    function segmentChinese(text) {
        const tokens = [];
        const allDicts = [
            ...DICT_TECH, ...DICT_CONCEPT, ...DICT_PERSON,
            ...DICT_PLACE, ...DICT_ORG, ...DICT_TIME
        ];
        // 按长度倒序，优先匹配长词
        const sortedDict = allDicts.sort((a, b) => b.length - a.length);
        let i = 0;
        while (i < text.length) {
            const ch = text[i];
            // 非中文字符跳过
            if (!/[\u4e00-\u9fa5]/.test(ch)) {
                i++;
                continue;
            }
            let matched = false;
            // 尝试匹配词典中的词（最长优先，最多 8 字）
            for (let len = Math.min(8, text.length - i); len >= 2; len--) {
                const word = text.substr(i, len);
                if (sortedDict.indexOf(word) >= 0) {
                    tokens.push({ word, start: i, end: i + len });
                    i += len;
                    matched = true;
                    break;
                }
            }
            if (!matched) {
                // 单字作为候选，后续过滤
                if (!STOPWORDS_ZH.has(ch) && ch.trim()) {
                    tokens.push({ word: ch, start: i, end: i + 1, single: true });
                }
                i++;
            }
        }
        return tokens;
    }

    // 英文分词
    function segmentEnglish(text) {
        const tokens = [];
        const regex = /[A-Za-z][A-Za-z0-9+#-]*/g;
        let match;
        while ((match = regex.exec(text)) !== null) {
            const word = match[0].toLowerCase();
            if (word.length < 2) continue;
            if (STOPWORDS_EN.has(word)) continue;
            tokens.push({
                word,
                start: match.index,
                end: match.index + word.length
            });
        }
        return tokens;
    }

    // 句子切分
    function splitSentences(text) {
        return text
            .split(/[。！？.!?\n；;\r]+/)
            .map(s => s.trim())
            .filter(s => s.length > 1);
    }

    // 识别术语类别
    function categorize(word) {
        const lower = word.toLowerCase();
        for (const [key, cat] of Object.entries(CATEGORIES)) {
            if (key === 'other') continue;
            if (cat.dict.has(word) || cat.dict.has(lower)) {
                return key;
            }
        }
        return 'other';
    }

    /* ---------- 主分析函数 ---------- */

    /**
     * 分析文本，提取知识节点和关系
     * @param {string} text 输入文本
     * @returns {{nodes: Array, edges: Array, sentences: Array, stats: Object}}
     */
    function analyze(text) {
        if (!text || text.trim().length < 5) {
            return { nodes: [], edges: [], sentences: [], stats: { nodes: 0, edges: 0, categories: 0, density: 0 } };
        }

        const sentences = splitSentences(text);

        // 1. 分词
        const zhTokens = segmentChinese(text);
        const enTokens = segmentEnglish(text);

        // 2. 统计词频 + 位置信息 + 类别
        const wordMap = new Map(); // word -> {count, positions, category, contexts}

        // 处理中文词
        for (const tok of zhTokens) {
            // 过滤单字（除非是领域词典中的字，但词典词都是 2 字以上，单字直接跳过以提高质量）
            if (tok.single) continue;
            if (STOPWORDS_ZH.has(tok.word)) continue;
            if (tok.word.length < 2) continue;

            if (!wordMap.has(tok.word)) {
                wordMap.set(tok.word, {
                    word: tok.word,
                    count: 0,
                    positions: [],
                    contexts: [],
                    category: categorize(tok.word)
                });
            }
            const entry = wordMap.get(tok.word);
            entry.count++;
            entry.positions.push(tok.start);

            // 提取上下文（所在句子）
            for (const s of sentences) {
                if (s.includes(tok.word)) {
                    if (entry.contexts.length < 2 && !entry.contexts.includes(s)) {
                        entry.contexts.push(s);
                    }
                    break;
                }
            }
        }

        // 处理英文词
        for (const tok of enTokens) {
            if (STOPWORDS_EN.has(tok.word)) continue;
            if (!wordMap.has(tok.word)) {
                wordMap.set(tok.word, {
                    word: tok.word,
                    count: 0,
                    positions: [],
                    contexts: [],
                    category: categorize(tok.word)
                });
            }
            const entry = wordMap.get(tok.word);
            entry.count++;
            entry.positions.push(tok.start);
            for (const s of sentences) {
                const lower = s.toLowerCase();
                if (lower.includes(tok.word)) {
                    if (entry.contexts.length < 2 && !entry.contexts.includes(s)) {
                        entry.contexts.push(s);
                    }
                    break;
                }
            }
        }

        // 3. 计算重要性得分（TF + 位置加权 + 类别加权 + 长度加权）
        const totalWords = zhTokens.length + enTokens.length;
        const candidates = [];
        for (const entry of wordMap.values()) {
            // TF 分量
            const tf = entry.count / Math.max(totalWords, 1);
            // 位置加权：出现在前 30% 的词更可能重要
            const earlyBoost = entry.positions.some(p => p < text.length * 0.3) ? 1.2 : 1.0;
            // 类别加权：领域实体更可能重要
            const catBoost = entry.category !== 'other' ? 1.5 : 1.0;
            // 长度加权：长词通常更有信息量
            const lenBoost = entry.word.length >= 4 ? 1.3 : (entry.word.length >= 3 ? 1.1 : 1.0);
            // 频次加权：出现多次的更可能重要
            const freqBoost = entry.count >= 3 ? 1.3 : (entry.count >= 2 ? 1.1 : 1.0);

            const score = tf * earlyBoost * catBoost * lenBoost * freqBoost * 100;

            candidates.push({
                ...entry,
                score
            });
        }

        // 4. 排序并筛选 top N 节点
        candidates.sort((a, b) => b.score - a.score);
        // 动态决定节点数：文本越长节点越多，但限制在 12-40 之间
        const nodeCount = Math.min(40, Math.max(12, Math.floor(Math.sqrt(text.length) * 1.2)));
        const topNodes = candidates.slice(0, nodeCount);

        // 构造节点
        const nodes = topNodes.map((c, idx) => ({
            id: 'n' + idx,
            label: c.word,
            category: c.category,
            weight: c.count,
            score: c.score,
            contexts: c.contexts,
            // 节点大小基于得分归一化
            size: 0
        }));

        // 归一化节点大小
        if (nodes.length > 0) {
            const maxScore = Math.max(...nodes.map(n => n.score));
            const minScore = Math.min(...nodes.map(n => n.score));
            const range = maxScore - minScore || 1;
            for (const n of nodes) {
                // 大小范围 16-42
                n.size = 16 + ((n.score - minScore) / range) * 26;
            }
        }

        // 5. 构建关系（基于共现）
        const nodeMap = new Map(nodes.map(n => [n.label, n]));
        const edgeMap = new Map(); // key: "id1-id2" -> weight
        const nodeInSentence = new Map(); // nodeId -> Set of sentence indices

        // 统计每个节点出现在哪些句子
        sentences.forEach((s, sIdx) => {
            const lower = s.toLowerCase();
            for (const n of nodes) {
                if (s.includes(n.label) || lower.includes(n.label.toLowerCase())) {
                    if (!nodeInSentence.has(n.id)) nodeInSentence.set(n.id, new Set());
                    nodeInSentence.get(n.id).add(sIdx);
                }
            }
        });

        // 共现 = 同一句子中出现
        for (let i = 0; i < nodes.length; i++) {
            for (let j = i + 1; j < nodes.length; j++) {
                const a = nodes[i], b = nodes[j];
                const sA = nodeInSentence.get(a.id) || new Set();
                const sB = nodeInSentence.get(b.id) || new Set();
                let cooccur = 0;
                for (const idx of sA) if (sB.has(idx)) cooccur++;
                if (cooccur > 0) {
                    const key = a.id < b.id ? `${a.id}-${b.id}` : `${b.id}-${a.id}`;
                    // 关系强度：共现次数 * 两节点重要性的几何平均
                    const strength = cooccur * Math.sqrt(a.score * b.score);
                    edgeMap.set(key, {
                        source: a.id < b.id ? a.id : b.id,
                        target: a.id < b.id ? b.id : a.id,
                        weight: cooccur,
                        strength: strength
                    });
                }
            }
        }

        const edges = Array.from(edgeMap.values());

        // 6. 统计
        const categoriesUsed = new Set(nodes.map(n => n.category));
        const maxPossibleEdges = nodes.length * (nodes.length - 1) / 2;
        const density = maxPossibleEdges > 0 ? (edges.length / maxPossibleEdges) : 0;

        return {
            nodes,
            edges,
            sentences,
            stats: {
                nodes: nodes.length,
                edges: edges.length,
                categories: categoriesUsed.size,
                density: Math.round(density * 100)
            }
        };
    }

    /* ---------- 搜索（语义近似匹配） ---------- */

    /**
     * 在节点中搜索
     * @param {Array} nodes 节点列表
     * @param {string} query 查询词
     * @returns {Array} 匹配的节点（带匹配度）
     */
    function search(nodes, query) {
        if (!query || !query.trim()) return [];
        const q = query.trim().toLowerCase();
        const results = [];
        for (const n of nodes) {
            const label = n.label.toLowerCase();
            let score = 0;
            // 完全匹配
            if (label === q) score = 1.0;
            // 包含匹配
            else if (label.includes(q)) score = 0.8;
            // 前缀匹配
            else if (label.startsWith(q)) score = 0.7;
            // 查询包含标签
            else if (q.includes(label)) score = 0.6;
            // 字符相似（简单 Jaccard）
            else {
                const set1 = new Set(label);
                const set2 = new Set(q);
                let inter = 0;
                for (const c of set1) if (set2.has(c)) inter++;
                const union = set1.size + set2.size - inter;
                const sim = union > 0 ? inter / union : 0;
                if (sim >= 0.5) score = sim * 0.5;
            }
            if (score > 0) {
                results.push({ node: n, score });
            }
        }
        results.sort((a, b) => b.score - a.score);
        return results.slice(0, 10);
    }

    /**
     * 基于图结构推荐关联节点
     * @param {string} nodeId 选中节点 id
     * @param {Array} edges 边列表
     * @param {Array} nodes 节点列表
     * @param {number} topN 推荐数量
     * @returns {Array} 推荐节点列表
     */
    function recommend(nodeId, edges, nodes, topN) {
        topN = topN || 5;
        const nodeMap = new Map(nodes.map(n => [n.id, n]));
        // 一度关联：直接相连
        const direct = new Map(); // nodeId -> totalStrength
        // 二度关联：通过中间节点连接
        const indirect = new Map(); // nodeId -> {via: [intermediateIds], score}

        const neighborsOf = new Map(); // nodeId -> [{target, strength}]
        for (const e of edges) {
            if (!neighborsOf.has(e.source)) neighborsOf.set(e.source, []);
            if (!neighborsOf.has(e.target)) neighborsOf.set(e.target, []);
            neighborsOf.get(e.source).push({ target: e.target, strength: e.strength });
            neighborsOf.get(e.target).push({ target: e.source, strength: e.strength });
        }

        const oneHop = neighborsOf.get(nodeId) || [];
        for (const n of oneHop) {
            direct.set(n.target, n.strength);
            // 继续找二度
            const twoHop = neighborsOf.get(n.target) || [];
            for (const n2 of twoHop) {
                if (n2.target === nodeId || n2.target === n.target) continue;
                const combinedScore = n.strength * 0.4 + n2.strength * 0.6;
                if (!indirect.has(n2.target) || indirect.get(n2.target).score < combinedScore) {
                    indirect.set(n2.target, {
                        via: n.target,
                        score: combinedScore
                    });
                }
            }
        }

        const recommendations = [];
        // 直接关联优先
        for (const [id, strength] of direct.entries()) {
            const node = nodeMap.get(id);
            if (!node) continue;
            recommendations.push({
                node,
                score: strength,
                reason: '直接关联',
                type: 'direct'
            });
        }
        // 间接关联补充（排除已直接关联的）
        const indirectRecs = [];
        for (const [id, info] of indirect.entries()) {
            if (direct.has(id)) continue;
            const node = nodeMap.get(id);
            if (!node) continue;
            const viaNode = nodeMap.get(info.via);
            indirectRecs.push({
                node,
                score: info.score * 0.5, // 间接关联降权
                reason: `经由「${viaNode ? viaNode.label : '?'}」关联`,
                type: 'indirect'
            });
        }

        // 合并、排序、去 topN
        recommendations.push(...indirectRecs);
        recommendations.sort((a, b) => b.score - a.score);
        return recommendations.slice(0, topN);
    }

    /* ---------- 知识洞察分析 ---------- */

    /**
     * 分析知识图谱的洞察信息
     * - 核心主题：度中心性最高的节点（关联数最多）
     * - 知识枢纽：邻居跨越 ≥2 个类别的桥梁节点
     * - 孤立节点：只有 0-1 个关联的节点（知识薄弱点）
     * - 类别分布：各类别节点数量与占比
     * @param {Array} nodes 节点列表
     * @param {Array} edges 边列表
     * @returns {Object} 洞察数据
     */
    function analyzeInsights(nodes, edges) {
        const empty = { coreTopic: null, hubs: [], isolated: [], categoryDistribution: [] };
        if (!nodes || nodes.length === 0) return empty;

        // 构建邻接表 / 度数 / 邻居类别集合
        const degreeMap = new Map();          // nodeId -> degree
        const neighborCatsMap = new Map();    // nodeId -> Set<category>
        const neighborMap = new Map();        // nodeId -> Set<nodeId>
        const nodeMap = new Map(nodes.map(n => [n.id, n]));
        for (const n of nodes) {
            degreeMap.set(n.id, 0);
            neighborCatsMap.set(n.id, new Set());
            neighborMap.set(n.id, new Set());
        }
        for (const e of edges || []) {
            if (!degreeMap.has(e.source) || !degreeMap.has(e.target)) continue;
            degreeMap.set(e.source, degreeMap.get(e.source) + 1);
            degreeMap.set(e.target, degreeMap.get(e.target) + 1);
            neighborMap.get(e.source).add(e.target);
            neighborMap.get(e.target).add(e.source);
        }
        // 统计每个节点的邻居类别
        for (const n of nodes) {
            const cats = neighborCatsMap.get(n.id);
            for (const nbId of neighborMap.get(n.id)) {
                const nb = nodeMap.get(nbId);
                if (nb) cats.add(nb.category);
            }
        }

        // 核心主题：度最高（且至少有 1 条关联）
        let coreTopic = null;
        let maxDegree = 0;
        for (const n of nodes) {
            const d = degreeMap.get(n.id);
            if (d > maxDegree) {
                maxDegree = d;
                coreTopic = { node: n, degree: d };
            }
        }
        if (maxDegree <= 0) coreTopic = null;

        // 知识枢纽：邻居跨越 ≥2 个类别
        const hubs = [];
        for (const n of nodes) {
            const cats = neighborCatsMap.get(n.id);
            if (cats.size >= 2) {
                hubs.push({
                    node: n,
                    degree: degreeMap.get(n.id),
                    neighborCategories: Array.from(cats)
                });
            }
        }
        hubs.sort((a, b) => b.degree - a.degree);

        // 孤立节点：度 0-1
        const isolated = [];
        for (const n of nodes) {
            const d = degreeMap.get(n.id);
            if (d <= 1) {
                isolated.push({ node: n, degree: d });
            }
        }

        // 类别分布
        const catCountMap = {};
        for (const n of nodes) {
            catCountMap[n.category] = (catCountMap[n.category] || 0) + 1;
        }
        const total = nodes.length;
        const categoryDistribution = Object.entries(catCountMap)
            .map(([key, count]) => {
                const cat = CATEGORIES[key] || { label: key, color: '#a8a8b8' };
                return {
                    key,
                    label: cat.label,
                    color: cat.color,
                    count,
                    percentage: total > 0 ? Math.round((count / total) * 100) : 0
                };
            })
            .sort((a, b) => b.count - a.count);

        return { coreTopic, hubs, isolated, categoryDistribution };
    }

    /* ---------- 导出 ---------- */
    global.KGAnalyzer = {
        analyze,
        search,
        recommend,
        analyzeInsights,
        CATEGORIES
    };

})(window);
