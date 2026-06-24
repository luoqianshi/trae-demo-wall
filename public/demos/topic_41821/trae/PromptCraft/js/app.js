const sceneTemplates = {
    '绘画': {
        prefix: 'Masterpiece, best quality, ultra detailed, 8k resolution, professional artwork,',
        suffix: ', photorealistic, cinematic lighting, highly detailed, perfect composition, trending on ArtStation',
        examples: ['画一只穿着宇航服的可爱猫咪', '赛博朋克风格的未来城市', '油画风格的田园风光'],
        qualityWords: ['masterpiece', 'best quality', 'ultra detailed', '8k', '4k', 'high resolution', 'photorealistic', 'cinematic', 'professional']
    },
    '写作': {
        prefix: 'Write a professional, engaging, and well-structured piece about:',
        suffix: '. Use vivid descriptions, compelling narrative, and clear organization. Target audience: general readers.',
        examples: ['写一篇关于人工智能发展的文章', '帮我写一封感谢信', '创作一个科幻短篇故事'],
        qualityWords: ['professional', 'engaging', 'well-structured', 'compelling', 'vivid', 'insightful', 'thought-provoking']
    },
    '编程': {
        prefix: 'Write clean, efficient, well-documented code for:',
        suffix: '. Follow best practices, include error handling, and add comments where necessary. Provide complete implementation.',
        examples: ['用Python写一个爬虫', '实现一个贪吃蛇游戏', '写一个前端表单验证'],
        qualityWords: ['clean', 'efficient', 'well-documented', 'scalable', 'maintainable', 'robust']
    },
    '对话': {
        prefix: 'As an expert AI assistant, provide a thoughtful, accurate, and helpful response to:',
        suffix: '. Be informative, clear, and friendly. Include examples where appropriate.',
        examples: ['解释什么是区块链', '推荐几本经典书籍', '如何提高学习效率'],
        qualityWords: ['thoughtful', 'accurate', 'helpful', 'informative', 'clear', 'comprehensive']
    },
    '分析': {
        prefix: 'Provide a comprehensive analysis of:',
        suffix: '. Include key insights, data trends, actionable recommendations, and potential challenges. Use structured format with clear sections.',
        examples: ['分析当前市场趋势', '评估这个商业计划书', '研究用户行为数据'],
        qualityWords: ['comprehensive', 'data-driven', 'insightful', 'actionable', 'strategic', 'thorough']
    },
    '视频': {
        prefix: 'Create a detailed video script for:',
        suffix: '. Include scene descriptions, dialogue, timing, camera angles, and visual effects. Target length: 2-3 minutes.',
        examples: ['拍一个产品宣传视频', '做一个科普短视频', '脚本关于旅行vlog'],
        qualityWords: ['engaging', 'visual', 'dynamic', 'story-driven', 'cinematic', 'professional']
    }
};

const quickExamples = [
    { text: '画一只太空猫', scene: '绘画' },
    { text: '写一篇科技文章', scene: '写作' },
    { text: '写个Python爬虫', scene: '编程' },
    { text: '解释量子计算', scene: '对话' },
    { text: '分析市场趋势', scene: '分析' },
    { text: '做个视频脚本', scene: '视频' }
];

let currentScene = '绘画';
let history = JSON.parse(localStorage.getItem('promptHistory') || '[]');

const userInput = document.getElementById('userInput');
const charCount = document.getElementById('charCount');
const generateBtn = document.getElementById('generateBtn');
const outputSection = document.getElementById('outputSection');
const outputPrompt = document.getElementById('outputPrompt');
const copyBtn = document.getElementById('copyBtn');
const copyText = document.getElementById('copyText');
const regenerateBtn = document.getElementById('regenerateBtn');
const historyList = document.getElementById('historyList');
const clearBtn = document.getElementById('clearBtn');
const toast = document.getElementById('toast');
const sceneBtns = document.querySelectorAll('.scene-btn');
const quickExampleTags = document.querySelectorAll('.example-tag');

function init() {
    renderHistory();
    renderQuickExamples();
    setupEventListeners();
}

function setupEventListeners() {
    userInput.addEventListener('input', () => {
        charCount.textContent = userInput.value.length;
    });

    sceneBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            sceneBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentScene = btn.dataset.scene;
            updateQuickExamples();
        });
    });

    generateBtn.addEventListener('click', generatePrompt);
    copyBtn.addEventListener('click', copyToClipboard);
    regenerateBtn.addEventListener('click', generatePrompt);
    clearBtn.addEventListener('click', clearHistory);

    quickExampleTags.forEach(tag => {
        tag.addEventListener('click', () => {
            const example = JSON.parse(tag.dataset.example);
            userInput.value = example.text;
            charCount.textContent = example.text.length;
            
            sceneBtns.forEach(b => {
                b.classList.toggle('active', b.dataset.scene === example.scene);
            });
            currentScene = example.scene;
        });
    });
}

function renderQuickExamples() {
    const examplesContainer = document.querySelector('.quick-examples');
    if (!examplesContainer) return;

    examplesContainer.innerHTML = quickExamples.map((example, index) => `
        <span 
            class="example-tag" 
            data-example='${JSON.stringify(example)}'
            style="animation-delay: ${index * 0.1}s"
        >
            ${example.text}
        </span>
    `).join('');

    document.querySelectorAll('.example-tag').forEach(tag => {
        tag.addEventListener('click', () => {
            const example = JSON.parse(tag.dataset.example);
            userInput.value = example.text;
            charCount.textContent = example.text.length;
            
            sceneBtns.forEach(b => {
                b.classList.toggle('active', b.dataset.scene === example.scene);
            });
            currentScene = example.scene;
        });
    });
}

function updateQuickExamples() {
    const examples = sceneTemplates[currentScene].examples;
    const examplesContainer = document.querySelector('.quick-examples');
    if (!examplesContainer) return;

    examplesContainer.innerHTML = examples.map((example, index) => `
        <span 
            class="example-tag" 
            data-example='${JSON.stringify({ text: example, scene: currentScene })}'
        >
            ${example}
        </span>
    `).join('');

    document.querySelectorAll('.example-tag').forEach(tag => {
        tag.addEventListener('click', () => {
            const example = JSON.parse(tag.dataset.example);
            userInput.value = example.text;
            charCount.textContent = example.text.length;
        });
    });
}

function generatePrompt() {
    const input = userInput.value.trim();
    if (!input) {
        showToast('请输入内容', 'error');
        return;
    }

    generateBtn.classList.add('loading');
    generateBtn.textContent = '生成中...';
    if (regenerateBtn) regenerateBtn.classList.add('loading');

    setTimeout(() => {
        const template = sceneTemplates[currentScene];
        const enhanced = enhancePrompt(input, currentScene);
        const finalPrompt = `${template.prefix} ${enhanced}${template.suffix}`;

        outputPrompt.textContent = finalPrompt;
        outputSection.classList.add('show');

        saveToHistory(input, currentScene, finalPrompt);

        generateBtn.classList.remove('loading');
        generateBtn.textContent = '🚀 生成提示词';
        if (regenerateBtn) regenerateBtn.classList.remove('loading');
        showToast('生成成功！', 'success');
    }, 1200);
}

function enhancePrompt(input, scene) {
    let enhanced = input.trim();

    enhanced = enhanced.replace(/^(一幅|一张|生成?|创作?|写?|帮我|请|画)/i, '').trim();

    const commonMap = {
        '城市': 'city', '未来': 'futuristic', '风格': 'style',
        '少女': 'young girl', '女孩': 'girl', '男孩': 'boy',
        '男人': 'man', '女人': 'woman', '人物': 'person',
        '地球': 'Earth', '太空': 'space', '宇宙': 'universe',
        '猫': 'cat', '狗': 'dog', '动物': 'animal',
        '风景': 'landscape', '建筑': 'building', '房子': 'house',
        '汽车': 'car', '飞机': 'airplane', '飞船': 'spaceship',
        '机器人': 'robot', '食物': 'food', '水果': 'fruit',
        '花': 'flower', '树': 'tree', '森林': 'forest',
        '山': 'mountain', '海': 'ocean', '水': 'water',
        '天空': 'sky', '云': 'cloud', '星星': 'stars',
        '月亮': 'moon', '太阳': 'sun', '夜晚': 'night',
        '白天': 'day', '季节': 'season', '春天': 'spring',
        '夏天': 'summer', '秋天': 'autumn', '冬天': 'winter',
        '美丽的': 'beautiful', '可爱的': 'cute', '漂亮的': 'pretty',
        '神秘的': 'mysterious', '梦幻的': 'dreamy', '震撼的': 'stunning',
        '古老的': 'ancient', '现代的': 'modern', '未来的': 'futuristic',
        '看着': 'looking at', '站在': 'standing in', '坐在': 'sitting on',
        '走在': 'walking in', '飞在': 'flying in', '漂浮在': 'floating in',
        '穿着': 'wearing', '拿着': 'holding', '带着': 'with',
        '有': 'with', '和': 'and', '与': 'and',
        '在': 'in', '的': '', '，': ', ', '。': '.',
        '比较': 'very', '非常': 'very', '十分': 'very',
        '偏向': 'in the style of', '风格偏向': 'in the style of',
        '画面': 'visual', '画质': 'image quality', '写实': 'photorealistic',
        '艺术': 'art', '设计': 'design', '创意': 'creative',
        '高清': 'high resolution', '逼真': 'realistic', '精细': 'detailed'
    };

    Object.keys(commonMap).sort((a, b) => b.length - a.length).forEach(key => {
        const regex = new RegExp(key, 'g');
        enhanced = enhanced.replace(regex, commonMap[key]);
    });

    if (scene === '绘画') {
        const artStyleMap = {
            '油画': 'oil painting', '水彩': 'watercolor', '素描': 'pencil sketch',
            '动漫': 'anime', '卡通': 'cartoon', '3D': '3D rendering',
            '像素': 'pixel art', '赛博朋克': 'cyberpunk', '蒸汽朋克': 'steampunk',
            '印象派': 'impressionist', '现实主义': 'realistic', '超现实': 'surreal',
            '极简': 'minimalist', '复古': 'vintage', '未来主义': 'futuristic',
            '抽象': 'abstract', '波普': 'pop art', '达达': 'dada',
            '立体主义': 'cubism', '表现主义': 'expressionism', '极简主义': 'minimalism'
        };

        Object.keys(artStyleMap).sort((a, b) => b.length - a.length).forEach(style => {
            const regex = new RegExp(style, 'g');
            enhanced = enhanced.replace(regex, artStyleMap[style]);
        });

        const moodMap = {
            '压迫感': 'oppressive atmosphere', '紧张': 'tense', '温馨': 'warm and cozy',
            '神秘': 'mysterious', '梦幻': 'dreamy', '震撼': 'stunning',
            '唯美': 'aesthetic', '恐怖': 'horror', '宁静': 'serene',
            '浪漫': 'romantic', '奇幻': 'fantasy', '科幻': 'sci-fi',
            '忧郁': 'melancholic', '欢快': 'cheerful', '庄严': 'majestic'
        };

        Object.keys(moodMap).sort((a, b) => b.length - a.length).forEach(mood => {
            const regex = new RegExp(mood, 'g');
            enhanced = enhanced.replace(regex, moodMap[mood]);
        });

        const compositionMap = {
            '特写': 'close-up', '远景': 'wide shot', '全景': 'panoramic view',
            '中景': 'medium shot', '低角度': 'low angle', '高角度': 'high angle',
            '仰视': 'low angle', '俯视': 'high angle', '平视': 'eye level'
        };

        Object.keys(compositionMap).sort((a, b) => b.length - a.length).forEach(comp => {
            const regex = new RegExp(comp, 'g');
            enhanced = enhanced.replace(regex, compositionMap[comp]);
        });

        const lightingMap = {
            '自然光': 'natural lighting', '灯光': 'studio lighting',
            '背光': 'backlit', '侧光': 'side lighting', '顶光': 'top lighting',
            '暖光': 'warm lighting', '冷光': 'cool lighting', '霓虹光': 'neon lighting',
            '烛光': 'candlelight', '月光': 'moonlight', '阳光': 'sunlight'
        };

        Object.keys(lightingMap).sort((a, b) => b.length - a.length).forEach(light => {
            const regex = new RegExp(light, 'g');
            enhanced = enhanced.replace(regex, lightingMap[light]);
        });
    }

    if (scene === '写作') {
        const writingMap = {
            '文章': 'article', '故事': 'story', '文案': 'copywriting',
            '报告': 'report', '小说': 'novel', '诗歌': 'poem',
            '散文': 'essay', '评论': 'review', '日记': 'diary',
            '信': 'letter', '邮件': 'email', '通知': 'notification',
            '摘要': 'summary', '引言': 'introduction', '结论': 'conclusion'
        };

        Object.keys(writingMap).sort((a, b) => b.length - a.length).forEach(key => {
            const regex = new RegExp(key, 'g');
            enhanced = enhanced.replace(regex, writingMap[key]);
        });
    }

    if (scene === '编程') {
        const codingMap = {
            '代码': 'code', '程序': 'program', '功能': 'feature',
            '模块': 'module', '接口': 'API', '算法': 'algorithm',
            '框架': 'framework', '库': 'library', '插件': 'plugin',
            '网站': 'website', '应用': 'application', '系统': 'system',
            '数据库': 'database', '服务器': 'server', '客户端': 'client'
        };

        Object.keys(codingMap).sort((a, b) => b.length - a.length).forEach(key => {
            const regex = new RegExp(key, 'g');
            enhanced = enhanced.replace(regex, codingMap[key]);
        });

        const languages = ['Python', 'JavaScript', 'Java', 'C++', 'Go', 'Rust', 'TypeScript'];
        let foundLang = false;
        languages.forEach(lang => {
            if (enhanced.includes(lang)) {
                foundLang = true;
            }
        });
        if (!foundLang) {
            enhanced = `Python - ${enhanced}`;
        }
    }

    if (scene === '对话') {
        const dialogueMap = {
            '解释': 'explain', '回答': 'answer', '讨论': 'discuss',
            '介绍': 'introduce', '说明': 'describe', '分析': 'analyze',
            '建议': 'suggest', '推荐': 'recommend', '比较': 'compare',
            '评价': 'evaluate', '总结': 'summarize', '预测': 'predict'
        };

        Object.keys(dialogueMap).sort((a, b) => b.length - a.length).forEach(key => {
            const regex = new RegExp(key, 'g');
            enhanced = enhanced.replace(regex, dialogueMap[key]);
        });
    }

    if (scene === '分析') {
        const analysisMap = {
            '分析': 'analyze', '评估': 'evaluate', '研究': 'research',
            '趋势': 'trends', '数据': 'data', '统计': 'statistics',
            '报告': 'report', '预测': 'forecast', '洞察': 'insights',
            '对比': 'comparison', '总结': 'summary', '建议': 'recommendations'
        };

        Object.keys(analysisMap).sort((a, b) => b.length - a.length).forEach(key => {
            const regex = new RegExp(key, 'g');
            enhanced = enhanced.replace(regex, analysisMap[key]);
        });
    }

    if (scene === '视频') {
        const videoMap = {
            '脚本': 'script', '短片': 'short video', '剪辑': 'editing',
            '分镜': 'storyboard', '镜头': 'shot', '场景': 'scene',
            '拍摄': 'filming', '后期': 'post-production', '特效': 'special effects',
            '配音': 'voiceover', '字幕': 'subtitles', '配乐': 'background music'
        };

        Object.keys(videoMap).sort((a, b) => b.length - a.length).forEach(key => {
            const regex = new RegExp(key, 'g');
            enhanced = enhanced.replace(regex, videoMap[key]);
        });

        const platforms = ['YouTube', '抖音', 'TikTok', 'B站'];
        platforms.forEach(platform => {
            if (enhanced.includes(platform)) {
                enhanced = enhanced.replace(platform, `for ${platform}`);
            }
        });
    }

    enhanced = enhanced.replace(/\s+/g, ' ').trim();
    enhanced = enhanced.charAt(0).toUpperCase() + enhanced.slice(1);

    return enhanced;
}

function copyToClipboard() {
    const text = outputPrompt.textContent;
    navigator.clipboard.writeText(text).then(() => {
        copyBtn.classList.add('copied');
        copyText.textContent = '✅ 已复制';
        showToast('复制成功！', 'success');
        setTimeout(() => {
            copyBtn.classList.remove('copied');
            copyText.textContent = '📋 复制';
        }, 2000);
    }).catch(() => {
        showToast('复制失败，请手动复制', 'error');
    });
}

function saveToHistory(input, scene, output) {
    const item = {
        id: Date.now(),
        input,
        scene,
        output,
        time: new Date().toLocaleString('zh-CN')
    };

    history.unshift(item);
    if (history.length > 20) history.pop();

    localStorage.setItem('promptHistory', JSON.stringify(history));
    renderHistory();
}

function renderHistory() {
    if (history.length === 0) {
        historyList.innerHTML = `
            <div class="empty-history">
                <div class="empty-history-icon">📝</div>
                <p>暂无历史记录</p>
                <p style="font-size: 0.85rem; margin-top: 8px; opacity: 0.7;">尝试生成一些提示词吧！</p>
            </div>
        `;
        return;
    }

    const sceneIcons = {
        '绘画': '🎨',
        '写作': '✍️',
        '编程': '💻',
        '对话': '💬',
        '分析': '📊',
        '视频': '🎬'
    };

    historyList.innerHTML = history.map(item => `
        <div class="history-item" data-id="${item.id}">
            <span class="history-scene">${sceneIcons[item.scene] || '💡'}</span>
            <div class="history-content">
                <div class="history-input">${escapeHtml(item.input)}</div>
                <div class="history-meta">
                    <span class="history-scene-tag">${item.scene}</span>
                    <span>${item.time}</span>
                </div>
            </div>
        </div>
    `).join('');

    document.querySelectorAll('.history-item').forEach(el => {
        el.addEventListener('click', () => {
            const id = parseInt(el.dataset.id);
            const item = history.find(h => h.id === id);
            if (item) {
                userInput.value = item.input;
                charCount.textContent = item.input.length;
                outputPrompt.textContent = item.output;
                outputSection.classList.add('show');

                sceneBtns.forEach(b => {
                    b.classList.toggle('active', b.dataset.scene === item.scene);
                });
                currentScene = item.scene;
            }
        });
    });
}

function clearHistory() {
    if (confirm('确定要清空所有历史记录吗？')) {
        history = [];
        localStorage.removeItem('promptHistory');
        renderHistory();
        showToast('已清空', 'success');
    }
}

function showToast(message, type = 'success') {
    toast.textContent = message;
    toast.className = `toast ${type}`;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2500);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

init();