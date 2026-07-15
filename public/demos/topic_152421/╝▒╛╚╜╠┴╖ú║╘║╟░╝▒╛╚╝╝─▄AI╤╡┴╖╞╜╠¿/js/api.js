// ===== 急救教练 - AI API模块 =====

// 预设服务商（供设置页选择使用）
var aiProviders = [
    { id: 'deepseek', name: 'DeepSeek', baseUrl: 'https://api.deepseek.com/v1', model: 'deepseek-chat' },
    { id: 'qwen', name: '通义千问', baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1', model: 'qwen-plus' },
    { id: 'zhipu', name: '智谱GLM', baseUrl: 'https://open.bigmodel.cn/api/paas/v4', model: 'glm-4' },
    { id: 'doubao', name: '豆包', baseUrl: 'https://ark.cn-beijing.volces.com/api/v3', model: 'doubao-pro-32k' }
];

// XOR加密/解密（保留用于可能的敏感数据处理）
function xorEncode(str) {
    if (!str) return '';
    var key = 'JCFirstAid2026';
    var result = '';
    for (var i = 0; i < str.length; i++) {
        result += String.fromCharCode(str.charCodeAt(i) ^ key.charCodeAt(i % key.length));
    }
    return btoa(result);
}

function xorDecode(encoded) {
    if (!encoded) return '';
    try {
        var decoded = atob(encoded);
        var key = 'JCFirstAid2026';
        var result = '';
        for (var i = 0; i < decoded.length; i++) {
            result += String.fromCharCode(decoded.charCodeAt(i) ^ key.charCodeAt(i % key.length));
        }
        return result;
    } catch(e) { return ''; }
}

// AI对话（流式输出）
// 使用全局变量 apiConfig（由 main.js 定义，localStorage key: jjjl_apiConfig）
function callAI(userMessage, context, onChunk, onDone, role) {
    // 检查全局 apiConfig 是否有有效API配置
    var config = (typeof apiConfig !== 'undefined') ? apiConfig : null;
    if (!config || !config.apiKey || !config.baseUrl) {
        var mockReply = getMockReply(userMessage);
        if (onChunk) {
            var words = mockReply.split('');
            var idx = 0;
            var timer = setInterval(function() {
                if (idx < words.length) {
                    var chunk = words.slice(idx, idx + 3).join('');
                    onChunk(chunk);
                    idx += 3;
                } else {
                    clearInterval(timer);
                    if (onDone) onDone(mockReply);
                }
            }, 30);
        } else {
            if (onDone) onDone(mockReply);
        }
        return Promise.resolve(mockReply);
    }

    var systemPrompt = '你是"急救教练"AI助手，一位专业、耐心的院前急救培训教官。你的回答应该：\n' +
        '1. 基于最新的AHA（美国心脏协会）和红十字会急救指南\n' +
        '2. 用通俗易懂的语言解释专业医学术语\n' +
        '3. 给出明确、可操作的步骤指导\n' +
        '4. 强调安全注意事项\n' +
        '5. 适当鼓励学习者\n' +
        '6. 回答简洁，通常不超过300字';

    var messages = [
        { role: 'system', content: systemPrompt }
    ];

    // 添加急救知识库上下文（如果 firstAidKnowledge 存在）
    if (context === 'knowledge' || !context) {
        var knowledge = (typeof firstAidKnowledge !== 'undefined') ? firstAidKnowledge : [];
        if (knowledge.length > 0) {
            var related = knowledge.filter(function(item) {
                return userMessage.indexOf(item.q.replace('？','').replace('?','').substring(0,4)) > -1 ||
                       item.q.replace('？','').replace('?','').substring(0,4).indexOf(userMessage.substring(0,4)) > -1;
            });
            if (related.length > 0) {
                messages.push({
                    role: 'system',
                    content: '相关知识：' + related.map(function(r) { return 'Q:' + r.q + ' A:' + r.a; }).join('\n')
                });
            }
        }
    }

    messages.push({ role: 'user', content: userMessage });

    return fetch(config.baseUrl + '/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + config.apiKey
        },
        body: JSON.stringify({
            model: config.model,
            messages: messages,
            stream: true
        })
    }).then(function(response) {
        if (!response.ok) throw new Error('API请求失败: ' + response.status);
        var reader = response.body.getReader();
        var decoder = new TextDecoder();
        var fullText = '';

        function read() {
            reader.read().then(function(result) {
                if (result.done) {
                    if (onDone) onDone(fullText);
                    return;
                }
                var text = decoder.decode(result.value, { stream: true });
                var lines = text.split('\n');
                for (var i = 0; i < lines.length; i++) {
                    var line = lines[i].trim();
                    if (line.startsWith('data: ') && line !== 'data: [DONE]') {
                        try {
                            var json = JSON.parse(line.substring(6));
                            var content = json.choices && json.choices[0] && json.choices[0].delta && json.choices[0].delta.content;
                            if (content) {
                                fullText += content;
                                if (onChunk) onChunk(content);
                            }
                        } catch(e) {}
                    }
                }
                read();
            }).catch(function(err) {
                if (onDone) onDone(fullText);
            });
        }
        read();
    }).catch(function(err) {
        var fallback = getMockReply(userMessage);
        if (onDone) onDone(fallback);
        return fallback;
    });
}

// 模拟AI回复（无API时）
function getMockReply(message) {
    var knowledge = (typeof firstAidKnowledge !== 'undefined') ? firstAidKnowledge : [];
    var lower = message.toLowerCase();
    for (var i = 0; i < knowledge.length; i++) {
        var item = knowledge[i];
        if (lower.indexOf(item.q.substring(0,6).replace(/[？?]/g,'')) > -1 ||
            item.q.replace(/[？?]/g,'').substring(0,6).indexOf(lower.substring(0,6)) > -1) {
            return item.a;
        }
    }
    // 通用回复
    var generalReplies = [
        '这是一个很好的急救问题。根据AHA最新指南，我建议你：1）保持冷静 2）确保现场安全 3）评估患者意识和呼吸 4）如有需要立即拨打120。你可以使用我们的CPR训练和场景闯关模块来加强练习。有什么具体的急救场景想了解吗？',
        '急救的关键是"黄金4分钟"。心脏骤停后4-6分钟脑细胞开始死亡，10分钟后脑死亡基本不可逆。所以掌握基础急救技能非常重要。我建议你先从CPR训练开始，逐步掌握各项技能。需要我为你推荐学习路径吗？',
        '记住急救基本原则：先确保自身安全，再救助他人。不要让自己成为第二个伤者。在不确定该做什么的时候，拨打120并跟随调度员的指导是最安全的选择。建议你多使用我们的场景闯关功能来提升实战决策能力。'
    ];
    return generalReplies[Math.floor(Math.random() * generalReplies.length)];
}
