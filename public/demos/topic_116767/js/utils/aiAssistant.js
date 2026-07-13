var AiAssistant = (function() {
    'use strict';

    var MAX_CONTEXT_SIZE = 10;

    var conversationHistory = [];

    var INTENT_KEYWORDS = {
        budget: ['预算', '多少钱', '费用', '价格', '花费', '超支', '省钱', '划算', '报价', '成本'],
        process: ['流程', '步骤', '顺序', '先做什么', '后做什么', '阶段', '工期', '时间安排', '进度'],
        pitfall: ['坑', '避坑', '陷阱', '注意', '被骗', '套路', '雷区', '踩坑', '防坑'],
        material: ['材料', '建材', '瓷砖', '地板', '油漆', '板材', '水管', '电线', '品牌', '选购'],
        duration: ['工期', '多久', '时间', '什么时候', '多久能装完', '进度', '延期', '延误'],
        contract: ['合同', '协议', '签合同', '条款', '违约', '纠纷', '保修', '售后'],
        softDecoration: ['软装', '家具', '灯饰', '窗帘', '装饰', '搭配', '风格', '配色', '摆件'],
        other: []
    };

    var TEMPLATE_RESPONSES = {
        greeting: [
            '你好呀！我是你的装修小管家年年~ 有什么装修问题尽管问我吧！',
            '嗨！我是年年，你的专属装修顾问。关于装修的任何问题都可以问我哦~',
            '欢迎欢迎！我是小管家年年，装修路上有我陪你，有什么想了解的吗？'
        ],
        thanks: [
            '不客气~ 能帮到你我很开心！还有其他问题随时问我哦~',
            '哈哈，应该的！装修是大事，有问题随时来找年年~',
            '能帮上忙就好！还有什么想聊的吗？'
        ],
        budget_general: [
            '关于装修预算，年年建议你这样规划：\n\n1. 先确定总预算，建议不超过家庭年收入的2-3倍\n2. 预留10%-20%的备用金，应对突发增项\n3. 硬装占40%-50%，软装10%-15%，家电15%-20%\n4. 厨房和卫生间是花钱大户，预算要给足\n\n需要我帮你看看具体怎么分配吗？'
        ],
        process_general: [
            '装修一般分为这几个阶段：\n\n1. 设计阶段：量房、出设计方案、确定报价\n2. 拆改阶段：拆墙、砌墙、铲墙皮等\n3. 水电改造：开槽、布管穿线、防水\n4. 泥瓦阶段：贴砖、吊顶、墙面基层\n5. 木工阶段：衣柜、吊顶、造型等\n6. 油漆阶段：墙面漆、木器漆\n7. 安装阶段：橱柜、卫浴、门窗、地板\n8. 软装阶段：家具、家电、配饰\n\n想了解哪个阶段的详细内容？'
        ],
        pitfall_general: [
            '装修中常见的坑有这些：\n\n1. 低价签单，后期恶意增项\n2. 材料以次充好，偷换品牌\n3. 施工不规范，留下安全隐患\n4. 合同条款模糊，维权困难\n5. 设计不合理，后期使用不便\n\n想了解具体哪方面的避坑技巧？'
        ],
        material_general: [
            '装修材料选购要点：\n\n1. 主材建议自己选，质量和价格更可控\n2. 辅材虽然不起眼，但质量影响很大\n3. 买材料不要只看价格，环保和耐用性更重要\n4. 建议多逛几家对比，不要急着下单\n\n想了解哪种材料的选购建议？'
        ],
        duration_general: [
            '装修工期参考：\n\n1. 100㎡左右简单装修：2-3个月\n2. 中等装修：3-4个月\n3. 精装修：4-6个月\n\n具体工期还要看户型大小、装修复杂程度、装修公司效率等。建议预留10%-20%的缓冲时间，因为工期延误很常见哦~'
        ],
        contract_general: [
            '签装修合同要注意：\n\n1. 仔细核对报价单，确保项目齐全\n2. 明确工期和延误赔偿条款\n3. 付款方式建议按进度付，首付不超过30%\n4. 保修条款要写清楚，保修期限和范围\n5. 增项必须双方签字确认才能生效\n\n需要我帮你看看合同有什么问题吗？'
        ],
        softDecoration_general: [
            '软装搭配小技巧：\n\n1. 先确定风格，再选家具配饰\n2. 颜色不超过三种主色，避免杂乱\n3. 灯光很重要，层次感靠灯光营造\n4. 绿植是提升氛围感的神器\n5. 少即是多，不要堆砌太多装饰品\n\n想了解具体哪方面的软装建议？'
        ],
        fallback: [
            '这个问题年年还在学习中呢~ 不过我可以帮你在知识库中找找相关内容，或者你可以换个方式问问我？',
            '嗯...这个问题有点难倒年年了，我去知识库翻翻，你也可以试试问我预算、流程、避坑这些话题哦~',
            '年年的知识库还在扩充中，这个问题暂时回答不了。不如我们聊聊装修流程、预算规划这些话题？'
        ]
    };

    var QUICK_QUESTIONS_BY_VIEW = {
        sop: [
            '现在该做什么？',
            '水电改造要注意什么？',
            '瓦工阶段有哪些坑？',
            '工期一般多久？'
        ],
        budget: [
            '预算不够怎么办？',
            '哪些钱不能省？',
            '怎么避免超支？',
            '硬装预算怎么分配？'
        ],
        knowledge: [
            '装修前要准备什么？',
            '怎么选装修公司？',
            '清包半包全包哪个好？',
            '最佳装修季节是什么时候？'
        ],
        tools: [
            '有什么实用的装修工具？',
            '预算计算器怎么用？',
            '面积怎么测量？'
        ],
        home: [
            '我的装修进度怎么样？',
            '接下来该做什么？',
            '预算还剩多少？',
            '给我一些装修建议'
        ],
        hero: [
            '装修第一步做什么？',
            '预算怎么规划？',
            '装修方式怎么选？',
            '需要准备多长时间？'
        ]
    };

    var DEFAULT_QUICK_QUESTIONS = [
        '装修预算怎么定？',
        '装修流程有哪些？',
        '有什么避坑建议？',
        '材料怎么选？'
    ];

    function getRandomResponse(category) {
        var responses = TEMPLATE_RESPONSES[category];
        if (!responses || responses.length === 0) {
            return TEMPLATE_RESPONSES.fallback[0];
        }
        var index = Math.floor(Math.random() * responses.length);
        return responses[index];
    }

    function detectIntent(message) {
        var messageLower = message.toLowerCase();
        var maxScore = 0;
        var detectedIntent = 'other';

        for (var intent in INTENT_KEYWORDS) {
            if (INTENT_KEYWORDS.hasOwnProperty(intent)) {
                var keywords = INTENT_KEYWORDS[intent];
                var score = 0;
                for (var i = 0; i < keywords.length; i++) {
                    if (message.indexOf(keywords[i]) !== -1) {
                        score++;
                    }
                }
                if (score > maxScore) {
                    maxScore = score;
                    detectedIntent = intent;
                }
            }
        }

        return detectedIntent;
    }

    function isGreeting(message) {
        var greetings = ['你好', '您好', 'hi', 'hello', '嗨', '在吗', '在不在', '你好呀', '您好呀', '哈喽'];
        var messageLower = message.toLowerCase();
        for (var i = 0; i < greetings.length; i++) {
            if (messageLower.indexOf(greetings[i]) !== -1) {
                return true;
            }
        }
        return false;
    }

    function isThanks(message) {
        var thanks = ['谢谢', '感谢', '多谢', '谢谢啦', '谢谢你', '感谢你', '3q', '3Q'];
        for (var i = 0; i < thanks.length; i++) {
            if (message.indexOf(thanks[i]) !== -1) {
                return true;
            }
        }
        return false;
    }

    function searchKnowledgeArticles(query) {
        if (typeof KnowledgeArticles === 'undefined') {
            return [];
        }

        var articles = KnowledgeArticles.getArticles ? KnowledgeArticles.getArticles() : [];
        if (!articles || articles.length === 0) {
            return [];
        }

        var results = [];
        var queryLower = query.toLowerCase();

        for (var i = 0; i < articles.length; i++) {
            var article = articles[i];
            var score = 0;

            var title = article.title || '';
            var summary = article.summary || '';
            var content = article.content || '';
            var tags = article.tags || [];

            if (title.indexOf(query) !== -1) {
                score += 10;
            }
            if (summary.indexOf(query) !== -1) {
                score += 5;
            }
            if (content.indexOf(query) !== -1) {
                score += 2;
            }
            for (var j = 0; j < tags.length; j++) {
                if (tags[j].indexOf(query) !== -1 || query.indexOf(tags[j]) !== -1) {
                    score += 8;
                }
            }

            if (score > 0) {
                results.push({
                    article: article,
                    score: score
                });
            }
        }

        results.sort(function(a, b) {
            return b.score - a.score;
        });

        return results.slice(0, 3).map(function(item) {
            return item.article;
        });
    }

    function getUserData() {
        var data = {
            budget: null,
            progress: null,
            currentView: null,
            decorationMode: null
        };

        if (typeof App !== 'undefined' && App.state) {
            var appState = App.state;
            if (appState) {
                data.currentView = appState.currentView || null;
                data.decorationMode = appState.userData ? appState.userData.decorationMode : null;

                if (appState.budgetPlans && data.decorationMode) {
                    data.budget = appState.budgetPlans[data.decorationMode] || null;
                }

                if (appState.sopProgress && data.decorationMode) {
                    data.progress = appState.sopProgress[data.decorationMode] || null;
                }
            }
        }

        return data;
    }

    function generatePersonalizedResponse(intent, userData) {
        var response = '';

        if (intent === 'budget' && userData.budget) {
            var total = userData.budget.total || 0;
            var spent = userData.budget.spent || 0;
            var remaining = total - spent;
            var percent = total > 0 ? Math.round((spent / total) * 100) : 0;

            response = '根据你的预算情况：\n\n';
            response += '总预算：' + formatMoney(total) + '元\n';
            response += '已花费：' + formatMoney(spent) + '元（' + percent + '%）\n';
            response += '剩余：' + formatMoney(remaining) + '元\n\n';

            if (percent > 80) {
                response += '⚠️ 注意：预算已使用超过80%，后面的花费要谨慎哦！建议看看哪些地方还能省一省。';
            } else if (percent > 50) {
                response += '预算使用过半了，进度正常，继续保持合理规划哦~';
            } else {
                response += '预算还很充裕，可以适当提升一些材料品质~';
            }

            return response;
        }

        if (intent === 'process' && userData.progress) {
            var currentStep = userData.progress.currentStep || '未知';
            var completedSteps = userData.progress.completedSteps || [];

            response = '根据你的装修进度：\n\n';
            response += '当前阶段：' + currentStep + '\n';
            response += '已完成步骤：' + completedSteps.length + '个\n\n';
            response += '加油哦，装修顺利！有什么具体问题随时问我~';

            return response;
        }

        return null;
    }

    function formatMoney(num) {
        if (!num && num !== 0) return '0';
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }

    function generateResponse(userMessage) {
        addToHistory('user', userMessage);

        var response = '';
        var relatedArticles = [];

        if (isGreeting(userMessage)) {
            response = getRandomResponse('greeting');
        } else if (isThanks(userMessage)) {
            response = getRandomResponse('thanks');
        } else {
            var intent = detectIntent(userMessage);
            var userData = getUserData();

            var personalized = generatePersonalizedResponse(intent, userData);
            if (personalized) {
                response = personalized;
            } else {
                var templateKey = intent + '_general';
                if (TEMPLATE_RESPONSES[templateKey]) {
                    response = getRandomResponse(templateKey);
                } else {
                    response = getRandomResponse('fallback');
                }
            }

            relatedArticles = searchKnowledgeArticles(userMessage);
        }

        if (relatedArticles && relatedArticles.length > 0) {
            response += '\n\n📚 相关文章推荐：\n';
            for (var i = 0; i < relatedArticles.length; i++) {
                response += (i + 1) + '. ' + relatedArticles[i].title + '\n';
            }
        }

        addToHistory('assistant', response);

        return {
            text: response,
            articles: relatedArticles
        };
    }

    function addToHistory(role, content) {
        conversationHistory.push({
            role: role,
            content: content,
            timestamp: new Date().toISOString()
        });

        if (conversationHistory.length > MAX_CONTEXT_SIZE) {
            conversationHistory = conversationHistory.slice(-MAX_CONTEXT_SIZE);
        }
    }

    function getConversationHistory() {
        return conversationHistory.slice();
    }

    function clearHistory() {
        conversationHistory = [];
    }

    function getQuickQuestions() {
        var userData = getUserData();
        var currentView = userData.currentView || 'hero';

        var questions = QUICK_QUESTIONS_BY_VIEW[currentView] || DEFAULT_QUICK_QUESTIONS;
        return questions.slice(0, 4);
    }

    function reset() {
        clearHistory();
    }

    return {
        generateResponse: generateResponse,
        getConversationHistory: getConversationHistory,
        clearHistory: clearHistory,
        getQuickQuestions: getQuickQuestions,
        detectIntent: detectIntent,
        reset: reset
    };
})();
