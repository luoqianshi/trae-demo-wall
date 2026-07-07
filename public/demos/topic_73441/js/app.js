/* ========================================
   文言智学 - 主逻辑
   ======================================== */

(function () {
    'use strict';

    // --- 全局状态 ---
    let wordsData = [];    // 完整字词数据
    let miniData = [];     // 精简字词数据（高频字表用）
    let sentencesData = []; // 六步翻译法句子数据
    let currentFilter = 'all';
    let currentDailyWord = null; // 每日一词当前字

    // 翻译模块状态
    let currentSentence = null;
    let currentStepIndex = 0;
    let answerRevealed = false;
    let stepScores = [];       // 每步得分 [{evaluation, userInput}]
    let stepHistory = [];      // 每步的UI快照，用于累积显示
    let isSubmitting = false;  // 防止重复提交

    // --- 初始化 ---
    function init() {
        try {
            // 直接使用内嵌数据（无需fetch，支持file://协议直接打开）
            wordsData = WORDS_DATA;
            miniData = WORDS_MINI_DATA;
            sentencesData = SENTENCES_DATA;

            // 按频次降序排序
            miniData.sort((a, b) => b.frequency - a.frequency);

            // 渲染热门字
            renderHotWords();
            // 渲染高频字表
            renderRankTable();
            // 渲染句子列表
            renderSentenceList();
            // 初始化练习模块
            initPractice();
            // 初始化每日一词
            initDailyWord();
            // 渲染首页每日一词（精简版）
            renderHomeDaily();
            // 初始化AI模块
            initAI();
            // 初始化设置页面
            initSettingsPage();
            // 绑定事件
            bindEvents();
        } catch (err) {
            console.error('数据加载失败:', err);
            const heroEl = document.querySelector('.search-hero') || document.querySelector('.home-search');
            if (heroEl) {
                heroEl.innerHTML =
                    '<div class="no-result"><div class="no-result-icon">⚠️</div><div class="no-result-text">数据加载失败，请刷新页面重试</div></div>';
            }
        }
    }

    // --- 渲染热门字 ---
    function renderHotWords() {
        const container = document.getElementById('hot-words');
        const countEl = document.getElementById('hot-words-count');
        // 取频次最高的20个字
        const hotList = miniData.slice(0, 20);
        container.innerHTML = hotList.map(w => `
            <div class="hot-word-btn" data-char="${w.character}">
                <span class="hot-word-char">${w.character}</span>
                <span class="hot-word-star">${getStarText(w.star)}</span>
            </div>
        `).join('');
        // 显示收录总数
        if (countEl) {
            countEl.textContent = `共收录 ${wordsData.length} 字`;
        }
    }

    // --- 渲染高频字表 ---
    function renderRankTable(filter) {
        filter = filter || currentFilter;
        const container = document.getElementById('rank-table');
        let list = miniData;

        if (filter !== 'all') {
            list = list.filter(w => w.star === parseInt(filter));
        }

        if (list.length === 0) {
            container.innerHTML = '<div class="no-result"><div class="no-result-text">暂无数据</div></div>';
            return;
        }

        container.innerHTML = list.map((w, i) => `
            <div class="rank-row" data-char="${w.character}">
                <div class="rank-num">${i + 1}</div>
                <div class="rank-char">${w.character}</div>
                <div class="rank-info">
                    <div class="rank-pinyin">${w.pinyin}</div>
                    <div class="rank-star">${getStarText(w.star)}</div>
                </div>
                <div class="rank-freq">教材频次 ${w.frequency}</div>
            </div>
        `).join('');
    }

    // --- 搜索字词 ---
    function searchWord(char) {
        const hint = document.getElementById('search-hint');
        const resultDiv = document.getElementById('search-result');

        // 校验输入
        if (!char) {
            hint.textContent = '请输入一个汉字';
            resultDiv.style.display = 'none';
            return;
        }

        if (char.length > 1) {
            hint.textContent = '目前仅支持单字查询';
            resultDiv.style.display = 'none';
            return;
        }

        // 查找数据
        const word = wordsData.find(w => w.character === char);

        if (!word) {
            hint.textContent = `未收录「${char}」字，目前共收录 ${wordsData.length} 个文言文常用字`;
            resultDiv.style.display = 'none';
            return;
        }

        // 清除提示
        hint.textContent = '';

        // 渲染结果
        document.getElementById('result-char').textContent = word.character;
        document.getElementById('result-pinyin').textContent = word.pinyin;
        document.getElementById('result-star').textContent = getStarText(word.star) + ' ' + getStarLabel(word.star);
        document.getElementById('result-freq').textContent = `教材出现频次：${word.frequency} 次`;

        const meaningsDiv = document.getElementById('result-meanings');
        meaningsDiv.innerHTML = word.meaning.map((m, i) => `
            <div class="meaning-item ${i === 0 ? 'kaodian' : ''}">
                <div class="meaning-header">
                    <div class="meaning-seq">${m.seq}</div>
                    <div class="meaning-content">${m.content}</div>
                    ${i === 0 ? '<span class="meaning-tag">常考</span>' : ''}
                </div>
                <div class="meaning-example">${m.example}</div>
            </div>
        `).join('');

        resultDiv.style.display = 'block';
        // 滚动到结果
        resultDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    // --- 星级工具函数 ---
    function getStarText(star) {
        return '★'.repeat(star) + '☆'.repeat(5 - star);
    }

    function getStarLabel(star) {
        const labels = {
            5: '必考字',
            4: '高频字',
            3: '中频字',
            2: '低频字',
            1: '了解即可'
        };
        return labels[star] || '';
    }

    // --- 页面切换 ---
    function switchPage(pageName) {
        // 隐藏所有页面
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        // 显示目标页面
        const target = document.getElementById('page-' + pageName);
        if (target) target.classList.add('active');

        // 更新桌面端导航高亮
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.toggle('active', link.dataset.page === pageName);
        });

        // 更新移动端导航高亮
        document.querySelectorAll('.mobile-nav-link').forEach(link => {
            link.classList.toggle('active', link.dataset.page === pageName);
        });

        // 滚动到顶部
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // --- 汉堡菜单 ---
    function toggleMobileNav() {
        const nav = document.getElementById('mobile-nav');
        const overlay = document.getElementById('mobile-nav-overlay');
        nav.classList.toggle('open');
        overlay.classList.toggle('open');
        document.body.style.overflow = nav.classList.contains('open') ? 'hidden' : '';
    }

    function closeMobileNav() {
        document.getElementById('mobile-nav').classList.remove('open');
        document.getElementById('mobile-nav-overlay').classList.remove('open');
        document.body.style.overflow = '';
    }

    // ========================================
    // 六步翻译法模块
    // ========================================

    // --- 渲染句子列表 ---
    function renderSentenceList() {
        const container = document.getElementById('sentence-list');
        if (!sentencesData.length) return;

        container.innerHTML = sentencesData.map(s => {
            const gradeLabel = s.grade ? '<span class="sentence-grade">' + s.grade + '</span>' : '';
            return `
                <div class="sentence-item" data-id="${s.id}">
                    <div class="sentence-text">${s.sentence}</div>
                    <div class="sentence-source">${s.source}${gradeLabel}</div>
                </div>
            `;
        }).join('');
    }

    // --- 开始翻译练习 ---
    function startTranslation(sentenceId) {
        currentSentence = sentencesData.find(s => s.id === sentenceId);
        if (!currentSentence) return;

        currentStepIndex = 0;
        answerRevealed = false;
        stepScores = [];
        stepHistory = [];

        // 清空历史容器
        var historyEl = document.getElementById('step-history');
        if (historyEl) historyEl.innerHTML = '';

        // 显示工作区，隐藏句子选择
        document.querySelector('.sentence-selector').style.display = 'none';
        document.getElementById('translate-workspace').style.display = 'block';
        document.getElementById('final-result').style.display = 'none';
        document.getElementById('step-card').style.display = 'block';

        // 渲染原文
        document.getElementById('source-sentence').textContent = currentSentence.sentence;
        document.getElementById('source-from').textContent = currentSentence.source;

        // 渲染进度条
        renderStepProgress();

        // 渲染第一步
        renderCurrentStep();

        // 滚动到顶部
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // --- 渲染步骤进度条 ---
    function renderStepProgress() {
        const container = document.getElementById('step-progress');
        const stepNames = ['留', '替', '调', '补', '删', '贯'];

        container.innerHTML = stepNames.map((name, i) => `
            <div class="step-dot ${i === currentStepIndex ? 'active' : ''} ${i < currentStepIndex ? 'completed' : ''}">
                <span class="step-dot-label">${name}</span>
            </div>
        `).join('');
    }

    // --- 渲染当前步骤 ---
    function renderCurrentStep() {
        const step = currentSentence.steps[currentStepIndex];
        answerRevealed = false;

        // 渲染前序步骤参考答案摘要（从第2步开始显示）
        renderPriorStepsSummary();

        // 更新步骤卡片
        document.getElementById('step-card-num').textContent = currentStepIndex + 1;
        document.getElementById('step-card-name').textContent = '第' + (currentStepIndex + 1) + '步：' + step.name;
        document.getElementById('step-card-instruction').textContent = step.instruction;

        // 清空回答区域
        document.getElementById('user-answer').value = '';
        document.getElementById('user-answer').style.display = 'block';

        // 显示"提交回答"按钮，隐藏其他
        document.getElementById('btn-submit-answer').style.display = 'inline-block';
        document.getElementById('btn-submit-answer').textContent = '提交回答';
        document.getElementById('btn-submit-answer').disabled = false;
        document.getElementById('btn-show-answer').style.display = 'inline-block';
        document.getElementById('btn-show-answer').textContent = '查看参考答案';
        document.getElementById('btn-retry-answer').style.display = 'none';
        document.getElementById('btn-next-step').style.display = 'none';

        // 隐藏之前的AI反馈
        document.getElementById('step-card-feedback').style.display = 'none';

        // 移除之前插入的参考答案、解析和提前完成提示
        const existingRef = document.querySelector('.reference-answer');
        if (existingRef) existingRef.remove();
        const existingEarly = document.getElementById('early-finish-hint');
        if (existingEarly) existingEarly.remove();
        document.getElementById('step-card-explanation').style.display = 'none';

        // 更新进度条
        renderStepProgress();

        // 重新触发动画
        const card = document.getElementById('step-card');
        card.style.animation = 'none';
        card.offsetHeight; // 触发重排
        card.style.animation = 'fadeInUp 0.4s ease';
    }

    // --- 渲染前序步骤参考答案摘要 ---
    function renderPriorStepsSummary() {
        var summaryEl = document.getElementById('prior-steps-summary');
        if (!summaryEl) return;

        // 第一步没有前序，但也展示题目
        var html = '<div class="summary-sentence">' + escapeHTML(currentSentence.sentence) + '</div>';

        if (currentStepIndex === 0) {
            summaryEl.innerHTML = html;
            summaryEl.style.display = 'block';
            return;
        }

        html += '<div class="summary-title">前序步骤结果</div>';
        for (var i = 0; i < currentStepIndex; i++) {
            var s = currentSentence.steps[i];
            if (i > 0) html += '<div class="summary-divider"></div>';
            var answerText = s.answer ? s.answer.join('；') : '';
            html += '<div class="summary-item">';
            html += '<span class="summary-step-badge">' + (i + 1) + '</span>';
            html += '<span class="summary-step-name">' + s.name + '：</span>';
            html += '<span class="summary-answer">' + answerText + '</span>';
            html += '</div>';
        }

        summaryEl.innerHTML = html;
        summaryEl.style.display = 'block';
    }

    // --- 显示参考答案 ---
    function showAnswer() {
        if (answerRevealed) return;
        answerRevealed = true;

        // 保存用户已输入的内容（即使未提交也要记录）
        if (!stepScores[currentStepIndex]) {
            var inputEl = document.getElementById('user-answer');
            var userInput = inputEl ? inputEl.value.trim() : '';
            stepScores[currentStepIndex] = { evaluation: 'skipped', userInput: userInput };
        }

        const step = currentSentence.steps[currentStepIndex];

        // 在按钮后面插入参考答案
        const actionsDiv = document.querySelector('.answer-actions');
        const refDiv = document.createElement('div');
        refDiv.className = 'reference-answer';
        refDiv.innerHTML = `
            <div class="reference-answer-label">参考答案</div>
            <div class="reference-answer-text">${step.answer.join('；')}</div>
        `;
        actionsDiv.after(refDiv);

        // 显示解析
        document.getElementById('explanation-content').textContent = step.explanation;
        document.getElementById('step-card-explanation').style.display = 'block';

        // 切换按钮状态
        document.getElementById('btn-submit-answer').style.display = 'none';
        document.getElementById('btn-show-answer').style.display = 'none';
        document.getElementById('btn-next-step').style.display = 'inline-block';

        // 禁用输入
        document.getElementById('user-answer').style.display = 'none';
    }

    // --- 将当前步骤保存到历史记录 ---
    function saveStepToHistory() {
        var step = currentSentence.steps[currentStepIndex];
        var score = stepScores[currentStepIndex] || { evaluation: 'skipped', userInput: '' };
        var evalLabels = { correct: '正确', partial: '部分正确', incorrect: '需改进', skipped: '未作答' };

        // 构建历史记录数据
        var historyItem = {
            stepIndex: currentStepIndex,
            name: step.name,
            instruction: step.instruction,
            answer: step.answer,
            explanation: step.explanation,
            userInput: score.userInput,
            evaluation: score.evaluation,
            evalLabel: evalLabels[score.evaluation] || score.evaluation,
            feedbackText: ''
        };

        // 获取AI反馈文字（如果有的话）
        var feedbackEl = document.getElementById('step-card-feedback');
        if (feedbackEl && feedbackEl.style.display !== 'none') {
            var fbText = document.getElementById('feedback-text');
            if (fbText) historyItem.feedbackText = fbText.textContent;
        }

        stepHistory.push(historyItem);
        renderStepHistoryItem(historyItem);
    }

    // --- 渲染一个步骤历史卡片 ---
    function renderStepHistoryItem(item) {
        var container = document.getElementById('step-history');
        if (!container) return;

        var div = document.createElement('div');
        div.className = 'step-history-item';
        div.setAttribute('data-step-index', item.stepIndex);

        // 标题行：步骤名 + 评价 + 参考答案摘要
        var headerHTML = '<div class="step-history-header">' +
            '<span class="history-step-num">' + (item.stepIndex + 1) + '</span>' +
            '<span class="history-step-name">第' + (item.stepIndex + 1) + '步：' + item.name + '</span>' +
            '<span class="history-step-result">' + (item.answer ? item.answer.join('；').substring(0, 40) : '') + '</span>' +
            '<span class="history-eval-badge ' + item.evaluation + '">' + item.evalLabel + '</span>' +
            '<span class="history-toggle">▼</span>' +
            '</div>';

        // 展开内容
        var bodyHTML = '<div class="step-history-body">';
        bodyHTML += '<div class="step-history-section"><div class="section-label">题目要求</div>' + item.instruction + '</div>';

        if (item.userInput) {
            bodyHTML += '<div class="step-history-section"><div class="section-label">你的回答</div><div class="user-answer-text">' + escapeHTML(item.userInput) + '</div></div>';
        }

        if (item.feedbackText) {
            bodyHTML += '<div class="step-history-section"><div class="section-label">AI评价</div>' + item.feedbackText + '</div>';
        }

        bodyHTML += '<div class="step-history-section"><div class="section-label">参考答案</div><div class="reference-text">' + (item.answer ? item.answer.join('；') : '') + '</div></div>';
        bodyHTML += '<div class="step-history-section"><div class="section-label">详细解析</div><div class="explanation-text">' + item.explanation + '</div></div>';
        bodyHTML += '</div>';

        div.innerHTML = headerHTML + bodyHTML;
        container.appendChild(div);

        // 绑定展开/收起事件
        div.querySelector('.step-history-header').addEventListener('click', function() {
            div.classList.toggle('expanded');
        });
    }

    // HTML转义
    function escapeHTML(str) {
        var div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    // --- 下一步 ---
    function nextStep() {
        // 先把当前步骤保存到历史
        saveStepToHistory();

        if (currentStepIndex < 5) {
            currentStepIndex++;
            renderCurrentStep();
            // 滚动到工作区顶部（原文+前序摘要+当前步骤）
            document.getElementById('translate-work-area').scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
            // 完成所有步骤，显示最终结果
            showFinalResult();
        }
    }

    // --- 显示最终翻译结果 ---
    function showFinalResult() {
        document.getElementById('step-card').style.display = 'none';
        document.getElementById('final-result').style.display = 'block';

        document.getElementById('final-original').textContent = currentSentence.sentence;
        document.getElementById('final-translated').textContent = currentSentence.fullTranslation;

        // 渲染六步评分
        renderFinalScore();

        // AI综合点评（异步）
        generateAIFinalComment();

        // 更新进度条全部完成
        var dots = document.querySelectorAll('.step-dot');
        dots.forEach(function(dot) {
            dot.classList.remove('active');
            dot.classList.add('completed');
        });

        // 滚动到结果
        document.getElementById('final-result').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    // 渲染六步评分汇总
    function renderFinalScore() {
        var stepNames = ['留', '替', '调', '补', '删', '贯'];
        var evalLabels = { correct: '正确', partial: '部分正确', incorrect: '需改进', skipped: '未作答' };
        var scoresDiv = document.getElementById('score-steps');
        var totalDiv = document.getElementById('score-total');

        var correctCount = 0;
        // 找出用户实际做到的步骤数（非提前完成的skipped）
        var actualStepCount = 0;
        for (var i = 0; i < 6; i++) {
            var s = stepScores[i];
            if (s && s.evaluation !== 'skipped') {
                actualStepCount = i + 1;
            }
        }
        // 如果用户提前完成了，实际做到的步骤数就是总步数
        if (actualStepCount === 0) actualStepCount = 6;

        scoresDiv.innerHTML = stepNames.map(function(name, i) {
            var score = stepScores[i];
            var cls = 'skipped';
            var label = '未作答';
            if (score) {
                cls = score.evaluation;
                label = evalLabels[score.evaluation] || score.evaluation;
                if (score.evaluation === 'correct') correctCount++;
                // 如果是提前完成的跳过步骤，特殊标记
                if (score.evaluation === 'skipped' && i >= actualStepCount) {
                    label = '提前完成';
                    cls = 'early-finish';
                }
            }
            return '<div class="score-step-item ' + cls + '">' +
                '<div class="score-step-name">' + name + '</div>' +
                '<div class="score-step-label">' + label + '</div>' +
                '</div>';
        }).join('');

        totalDiv.textContent = correctCount + '/' + actualStepCount + ' 步正确';
    }

    // AI综合点评（异步）
    async function generateAIFinalComment() {
        var commentDiv = document.getElementById('final-ai-comment');
        var commentText = document.getElementById('ai-comment-text');

        var answeredSteps = stepScores.filter(function(s) { return s && s.evaluation !== 'skipped'; });
        if (answeredSteps.length === 0) {
            commentDiv.style.display = 'none';
            return;
        }

        // 找出实际完成的步骤数
        var actualStepCount = 0;
        for (var i = 0; i < 6; i++) {
            var s = stepScores[i];
            if (s && s.evaluation !== 'skipped') {
                actualStepCount = i + 1;
            }
        }
        var earlyFinished = actualStepCount < 6;

        var stepSummary = stepScores.map(function(s, i) {
            var step = currentSentence.steps[i];
            if (s && s.evaluation === 'skipped' && i >= actualStepCount) {
                return '第' + (i+1) + '步「' + step.name + '」：提前完成（该步骤无需操作）';
            }
            return '第' + (i+1) + '步「' + step.name + '」：' + (s ? s.evaluation + '（回答：' + s.userInput + '）' : '未作答');
        }).join('\n');

        var earlyNote = earlyFinished ? '\n注意：该学生在第' + actualStepCount + '步就已完成翻译，后续步骤被标记为提前完成。这说明该句不需要走完全部六步，学生的表现优秀。' : '';

        var prompt = [
            '学生使用六步翻译法翻译了以下文言文句子：',
            '原文：' + currentSentence.sentence,
            '参考译文：' + currentSentence.fullTranslation,
            '',
            '学生六步表现（共' + actualStepCount + '步实际作答）：',
            stepSummary,
            earlyNote,
            '',
            '请给出简洁的综合点评（80字以内），指出学生的优势和需要加强的地方。如果学生提前完成了，请特别表扬。直接输出点评文字，不要JSON。'
        ].join('\n');

        try {
            var result = await callAIWithFallback(TRANSLATE_AI_SYSTEM_PROMPT, prompt);
            if (result) {
                commentText.textContent = result;
                commentDiv.style.display = 'block';
            }
        } catch (e) {
            // AI不可用时不显示综合点评
        }
    }

    // --- 重新练习 ---
    function restartTranslation() {
        if (currentSentence) {
            startTranslation(currentSentence.id);
        }
    }

    // --- 返回句子列表 ---
    function backToSentenceList() {
        document.querySelector('.sentence-selector').style.display = 'block';
        document.getElementById('translate-workspace').style.display = 'none';
        currentSentence = null;
    }

    // --- AI六步分析核心函数 ---

    // 调用AI一次性生成六步分析
    async function analyzeSentence(sentence, context) {
        var userMsg = '请分析以下文言文句子：\n「' + sentence + '」';
        if (context) {
            userMsg += '\n\n课文上下文：' + context;
        }
        try {
            console.log('[六步翻译] 开始AI分析, 句子:', sentence);
            updateLoadingStatus('AI正在分析「' + sentence + '」...', 'DeepSeek大模型正在生成六步翻译分析');
            var result = await callAIWithFallback(ANALYZE_SYSTEM_PROMPT, userMsg);
            if (!result) {
                console.error('[六步翻译] AI返回为空, 所有provider均失败');
                return null;
            }
            console.log('[六步翻译] AI返回内容长度:', result.length, '前200字:', result.substring(0, 200));
            updateLoadingStatus('正在解析AI分析结果...', '即将进入六步翻译工作区');
            var parsed = parseAnalysisResult(result);
            if (!parsed) {
                console.error('[六步翻译] JSON解析失败, 原始内容:', result.substring(0, 500));
            }
            return parsed;
        } catch (e) {
            console.error('[六步翻译] analyzeSentence异常:', e.message, e.stack);
            return null;
        }
    }

    // 解析AI返回的六步分析JSON，校验6步完整性
    function parseAnalysisResult(result) {
        try {
            var text = result;
            var jsonMatch = text.match(/\{[\s\S]*\}/);
            if (!jsonMatch) return null;

            var jsonStr = jsonMatch[0];

            // 尝试解析，如果失败则尝试修复常见JSON问题
            var parsed;
            try {
                parsed = JSON.parse(jsonStr);
            } catch (parseErr) {
                console.warn('[六步翻译] 首次JSON解析失败，尝试修复:', parseErr.message);
                // 修复1: 中文引号 " " 替换为ASCII直引号（可能干扰JSON结构）
                var fixed = jsonStr.replace(/\u201c/g, '"').replace(/\u201d/g, '"');
                // 修复2: 未闭合的括号（被max_tokens截断）
                var openBrackets = (fixed.match(/\[/g) || []).length;
                var closeBrackets = (fixed.match(/\]/g) || []).length;
                var openBraces = (fixed.match(/\{/g) || []).length;
                var closeBraces = (fixed.match(/\}/g) || []).length;
                while (closeBrackets < openBrackets) { fixed += ']'; closeBrackets++; }
                while (closeBraces < openBraces) { fixed += '}'; closeBraces++; }
                // 修复3: 移除尾部不完整的键值对（如 "instruction\n 即被截断）
                fixed = fixed.replace(/,\s*"[^"]*"\s*:\s*"[^"]*$/m, '');
                try {
                    parsed = JSON.parse(fixed);
                } catch (e2) {
                    console.error('[六步翻译] JSON修复也失败:', e2.message);
                    return null;
                }
            }

            if (!parsed.steps || !Array.isArray(parsed.steps)) return null;

            // 校验6步完整性
            var expectedSteps = ['留', '替', '调', '补', '删', '贯'];
            if (parsed.steps.length !== 6) return null;

            for (var i = 0; i < 6; i++) {
                if (parsed.steps[i].name !== expectedSteps[i]) return null;
                if (!parsed.steps[i].instruction || !parsed.steps[i].answer || !parsed.steps[i].explanation) return null;
                // 确保 answer 是数组
                if (!Array.isArray(parsed.steps[i].answer)) {
                    parsed.steps[i].answer = [String(parsed.steps[i].answer)];
                }
            }

            return parsed;
        } catch (e) {
            console.error('parseAnalysisResult error:', e);
            return null;
        }
    }

    // 更新loading状态文字
    function updateLoadingStatus(text, subText) {
        var el = document.getElementById('loading-status-text');
        if (el) el.textContent = text;
        var sub = document.getElementById('loading-sub-text');
        if (sub && subText !== undefined) sub.textContent = subText;
    }

    // 自由输入模式的入口函数
    async function startFreeTranslate(sentence, source) {
        // 隐藏模式选择区，显示loading
        document.getElementById('translate-modes').style.display = 'none';
        var loadingEl = document.getElementById('analyze-loading');
        if (loadingEl) loadingEl.style.display = 'block';
        document.getElementById('translate-workspace').style.display = 'none';
        document.getElementById('translate-work-area').style.display = 'none';
        updateLoadingStatus('正在连接AI服务...', '首次分析可能需要10-20秒，请耐心等待');

        // 调用AI生成六步分析
        var analysis = await analyzeSentence(sentence);

        // 隐藏loading
        if (loadingEl) loadingEl.style.display = 'none';

        if (!analysis) {
            // 检查是否因为没有配置API Key
            var available = getAvailableProviders();
            if (available.length === 0) {
                // 没有配置任何AI服务商，引导用户去设置
                var modesEl = document.getElementById('translate-modes');
                modesEl.style.display = 'flex';
                // 在模式选择区顶部显示提示
                var hint = document.createElement('div');
                hint.className = 'ai-config-hint';
                hint.style.cssText = 'background:#fff3e0;border:1px solid #ff9800;border-radius:8px;padding:12px 16px;margin-bottom:16px;color:#e65100;font-size:14px;line-height:1.6;';
                hint.innerHTML = '使用六步翻译法需要配置AI服务商。请先到 <a href="#" data-page="settings" style="color:#1565c0;text-decoration:underline;font-weight:bold;">设置页面</a> 配置API Key（推荐DeepSeek）。';
                modesEl.insertBefore(hint, modesEl.firstChild);
                // 绑定设置页面跳转
                hint.querySelector('a').addEventListener('click', function(e) {
                    e.preventDefault();
                    switchPage('settings');
                });
            } else {
                alert('AI分析失败，请稍后重试或检查网络连接。');
                document.getElementById('translate-modes').style.display = 'flex';
            }
            return;
        }

        // 用AI返回的数据构造currentSentence对象
        currentSentence = {
            sentence: sentence,
            source: source || analysis.source || '',
            fullTranslation: analysis.fullTranslation || '',
            steps: analysis.steps
        };

        currentStepIndex = 0;
        answerRevealed = false;
        stepScores = [];

        // 显示工作区
        document.getElementById('translate-workspace').style.display = 'block';
        document.getElementById('translate-work-area').style.display = 'block';
        document.getElementById('final-result').style.display = 'none';
        document.getElementById('step-card').style.display = 'block';
        document.getElementById('text-panel').style.display = 'none';

        // 渲染原文
        document.getElementById('source-sentence').textContent = currentSentence.sentence;
        document.getElementById('source-from').textContent = currentSentence.source;

        // 渲染进度条
        renderStepProgress();

        // 渲染第一步
        renderCurrentStep();

        // 滚动到顶部
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // 返回模式选择页面
    function backToModes() {
        document.getElementById('translate-modes').style.display = 'flex';
        document.getElementById('translate-workspace').style.display = 'none';
        document.getElementById('final-result').style.display = 'none';
        document.getElementById('text-panel').style.display = 'none';
        currentSentence = null;
    }

    // ========== 六步翻译法：AI评价核心逻辑 ==========

    // System Prompt for AI六步分析
    const ANALYZE_SYSTEM_PROMPT = [
        '你是一位经验丰富的初中语文教师，专精文言文翻译教学。',
        '请使用"六步翻译法"分析以下文言文句子，为每一步生成教学引导内容。',
        '',
        '【六步翻译法v2.1】',
        '- 留：识别并保留专有名词（人名、地名、官职、年号、朝代、书名等）。如果没有专有名词，明确说明"无专有名词"。',
        '- 替：根据语境确定每个词应取的义项并替换为现代汉语表达。注意词义演变（扩大/缩小/转移）、一词多义、词类活用、通假字。',
        '- 调：检查是否有特殊句式（宾语前置、状语后置、定语后置、主谓倒装），如有则调整。语序正常则明确说明。',
        '- 补：检查是否有省略成分（主语、谓语、宾语、介词宾语），如有则补出。无省略则明确说明。',
        '- 删：检查有无无实义的虚词。没有则说明"无"。',
        '- 贯：将前五步整合，用通顺自然的现代汉语翻译整句。',
        '',
        '【要求】',
        '1. 严格按六步顺序，每步必须有实质性内容',
        '2. 语法分析必须准确',
        '3. 词义分析体现词义系统观，不要使用"古今异义"标签',
        '4. 每步explanation控制在50字以内，保持简洁',
        '5. 不要在JSON值中使用中文引号（""）、书名号（《》）等特殊标点，用普通标点',
        '',
        '【输出格式】只输出JSON，不要输出任何其他文字或代码块标记：',
        '{"source":"出处","steps":[{"name":"留","instruction":"...","answer":["..."],"explanation":"..."},{"name":"替","instruction":"...","answer":["..."],"explanation":"..."},{"name":"调","instruction":"...","answer":["..."],"explanation":"..."},{"name":"补","instruction":"...","answer":["..."],"explanation":"..."},{"name":"删","instruction":"...","answer":["..."],"explanation":"..."},{"name":"贯","instruction":"...","answer":["完整译文"],"explanation":"..."}],"fullTranslation":"完整译文"}'
    ].join('\n');

    // System Prompt for AI评价
    const TRANSLATE_AI_SYSTEM_PROMPT = [
        '你是一位经验丰富的初中语文教师，专精文言文翻译教学。',
        '你正在引导学生使用"六步翻译法"（留、替、调、补、删、贯）翻译文言文句子。',
        '',
        '【六步翻译法v2.1】',
        '- 留：保留专有名词（人名、地名、官职、年号等）',
        '- 替：根据语境确定义项并替换为现代汉语表达。注意词义演变（扩大/缩小/转移）、一词多义、词类活用、通假字',
        '- 调：调整倒装语序（宾语前置、状语后置、定语后置）',
        '- 补：补出省略成分（主语、谓语、宾语、介词宾语）',
        '- 删：删除无实义虚词（发语词、语气词、提宾标志）',
        '- 贯：意译贯通，信达雅',
        '',
        '【重要教学原则】',
        '六步翻译法是完整的翻译方法论，但不是所有句子都需要走完六步。',
        '很多简单的句子可能在第2步（替）或第3步（调）就已经翻译完成。',
        '如果学生的回答已经包含了后续步骤的分析内容，或者已经给出了准确的完整翻译，',
        '你应该：',
        '1. 热情肯定学生的能力（"你已经掌握了翻译的精髓！"）',
        '2. 指出该句子确实不需要后续步骤（如"这句没有特殊句式，无需调；没有省略，无需补"）',
        '3. 将canFinishEarly设为true，让学生可以提前完成',
        '',
        '【评价要求】',
        '1. 语义等价判断：学生答案不必与参考答案字面一致，意思对即可',
        '2. 鼓励为主：先肯定正确部分，再指出可改进之处',
        '3. 引导而非告知：不直接给答案，而是用提问或提示引导学生思考',
        '4. 语言简洁：评价控制在100字以内',
        '',
        '【输出格式】严格输出JSON，不要输出其他内容：',
        '{"evaluation":"correct|partial|incorrect","feedback":"...","hint":"...","canFinishEarly":false}',
        '- evaluation: correct=正确, partial=部分正确, incorrect=需改进',
        '- feedback: 对学生回答的评价（鼓励性语气）',
        '- hint: 引导提示（仅partial和incorrect时提供，correct时为空字符串）',
        '- canFinishEarly: 仅当学生已经完成翻译且当前步骤评价为correct时设为true，其他情况为false'
    ].join('\n');

    // 本地评价模板（AI不可用时降级）
    const LOCAL_TRANSLATE_TEMPLATES = {
        correctMessages: [
            '很棒！你的分析正确地抓住了这一步的核心。继续保持！',
            '完全正确！你对这一步的理解很到位。',
            '很好！你的回答准确体现了这一步的操作要点。'
        ],
        partialMessages: [
            '思路是对的，但还可以更完善。',
            '方向正确，但有遗漏。再仔细看看步骤指导。',
            '接近正确了！再想想是否还有遗漏。'
        ],
        incorrectMessages: [
            '这一步的分析需要重新思考。别急，再看一遍步骤指导。',
            '不太对哦。先回顾一下步骤指导，再试试看。',
            '没关系，这个步骤需要多练习。重新思考一下吧。'
        ],
        getFallback: function(step, userInput, refAnswer) {
            var input = userInput.trim();
            var ref = Array.isArray(refAnswer) ? refAnswer.join('；') : refAnswer;

            if (!input) {
                return {
                    evaluation: 'incorrect',
                    feedback: '你还没有写回答哦。先试着分析一下这一步吧！',
                    hint: '回顾步骤指导，思考这一步要求你做什么操作。'
                };
            }

            // 简单关键词匹配
            var keywords = ref.replace(/[；、，。！？]/g, ' ').split(/\s+/).filter(function(w) { return w.length >= 2; });
            var matchCount = keywords.filter(function(k) { return input.includes(k); }).length;

            if (keywords.length === 0 || matchCount >= Math.max(keywords.length * 0.5, 1)) {
                return {
                    evaluation: 'correct',
                    feedback: this.correctMessages[Math.floor(Math.random() * this.correctMessages.length)],
                    hint: ''
                };
            } else if (matchCount >= 1) {
                return {
                    evaluation: 'partial',
                    feedback: this.partialMessages[Math.floor(Math.random() * this.partialMessages.length)],
                    hint: '参考答案中提到了「' + keywords[0] + '」，你的分析中似乎遗漏了这一点。'
                };
            } else {
                return {
                    evaluation: 'incorrect',
                    feedback: this.incorrectMessages[Math.floor(Math.random() * this.incorrectMessages.length)],
                    hint: '参考答案的关键词：' + keywords.join('、') + '。再想想这些在句子中的作用。'
                };
            }
        }
    };

    // 构建翻译评价Prompt
    function buildTranslatePrompt(sentence, step, userInput) {
        var answerText = Array.isArray(step.answer) ? step.answer.join('；') : step.answer;
        return [
            '【翻译任务】',
            '原文：' + sentence.sentence,
            '出处：' + sentence.source,
            '',
            '【当前步骤】第' + (currentStepIndex + 1) + '步「' + step.name + '」',
            '步骤指导：' + step.instruction,
            '',
            '【参考答案】（仅供评判参考，学生答案不必完全一致）',
            answerText,
            '',
            '【学生的回答】',
            userInput,
            '',
            '请评价学生的回答，严格输出JSON：',
            '{"evaluation":"correct|partial|incorrect","feedback":"...","hint":"..."}'
        ].join('\n');
    }

    // 解析AI返回的评价JSON
    function parseAIEvaluation(result) {
        try {
            var text = result;
            var jsonMatch = text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                var parsed = JSON.parse(jsonMatch[0]);
                // 验证字段
                if (parsed.evaluation && parsed.feedback) {
                    if (['correct', 'partial', 'incorrect'].indexOf(parsed.evaluation) === -1) {
                        parsed.evaluation = 'partial';
                    }
                    if (!parsed.hint) parsed.hint = '';
                    // canFinishEarly 仅在 correct 时生效
                    parsed.canFinishEarly = !!(parsed.canFinishEarly && parsed.evaluation === 'correct');
                    return parsed;
                }
            }
            return { evaluation: 'partial', feedback: 'AI评价解析出现问题，但你的回答已记录。请参考答案核对。', hint: '', canFinishEarly: false };
        } catch (e) {
            return { evaluation: 'partial', feedback: 'AI评价解析出现问题，但你的回答已记录。请参考答案核对。', hint: '', canFinishEarly: false };
        }
    }

    // 渲染步骤反馈
    function renderStepFeedback(evaluation) {
        var feedbackDiv = document.getElementById('step-card-feedback');
        feedbackDiv.style.display = 'block';

        var evalLabels = { correct: '✓ 正确', partial: '△ 部分正确', incorrect: '✗ 需改进' };
        document.getElementById('feedback-evaluation').textContent = evalLabels[evaluation.evaluation] || evaluation.evaluation;
        document.getElementById('feedback-evaluation').className = 'feedback-evaluation ' + evaluation.evaluation;
        document.getElementById('feedback-text').textContent = evaluation.feedback;

        var hintDiv = document.getElementById('feedback-hint');
        if (evaluation.hint) {
            hintDiv.textContent = '提示：' + evaluation.hint;
            hintDiv.style.display = 'block';
        } else {
            hintDiv.style.display = 'none';
        }

        // 提前完成鼓励
        var earlyDiv = document.getElementById('early-finish-hint');
        if (earlyDiv) earlyDiv.remove();

        if (evaluation.canFinishEarly && currentStepIndex < 5) {
            var earlyHTML = '<div class="early-finish-hint" id="early-finish-hint" style="margin-top:12px;padding:12px 16px;background:linear-gradient(135deg,#e8f5e9,#c8e6c9);border-radius:10px;border:1px solid #a5d6a7;">';
            earlyHTML += '<div style="font-weight:600;color:#2e7d32;margin-bottom:4px;">🎉 翻译已完成！</div>';
            earlyHTML += '<div style="font-size:13px;color:#555;margin-bottom:8px;">你的回答已经涵盖了后续步骤的内容，这个句子不需要走完全部六步。你可以直接完成翻译，也可以继续练习剩余步骤。</div>';
            earlyHTML += '<button id="btn-finish-early" class="btn-primary" style="background:#2e7d32;margin-right:8px;">直接完成翻译</button>';
            earlyHTML += '</div>';
            feedbackDiv.insertAdjacentHTML('afterend', earlyHTML);
            // 绑定提前完成按钮
            document.getElementById('btn-finish-early').addEventListener('click', function() {
                // 把剩余步骤都标记为跳过
                for (var i = currentStepIndex + 1; i < 6; i++) {
                    if (!stepScores[i]) {
                        stepScores[i] = { evaluation: 'skipped', userInput: '' };
                    }
                }
                showFinalResult();
            });
        }

        feedbackDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    // 提交回答（核心函数）
    async function submitAnswer() {
        if (isSubmitting) return;

        var userInput = document.getElementById('user-answer').value.trim();
        if (!userInput) {
            // 内联提示
            var textarea = document.getElementById('user-answer');
            textarea.style.borderColor = '#f8d7da';
            setTimeout(function() { textarea.style.borderColor = ''; }, 1500);
            return;
        }

        isSubmitting = true;
        var step = currentSentence.steps[currentStepIndex];

        // 显示loading
        var submitBtn = document.getElementById('btn-submit-answer');
        submitBtn.textContent = 'AI评判中...';
        submitBtn.disabled = true;

        var systemPrompt = TRANSLATE_AI_SYSTEM_PROMPT;
        var userMessage = buildTranslatePrompt(currentSentence, step, userInput);

        try {
            var result = await callAIWithFallback(systemPrompt, userMessage);

            var evaluation;
            if (result) {
                evaluation = parseAIEvaluation(result);
            } else {
                evaluation = LOCAL_TRANSLATE_TEMPLATES.getFallback(step, userInput, step.answer);
            }

            stepScores[currentStepIndex] = {
                evaluation: evaluation.evaluation,
                userInput: userInput
            };

            // 切换按钮（先切换，renderStepFeedback中可能修改）
            submitBtn.style.display = 'none';
            document.getElementById('btn-show-answer').style.display = 'none';
            document.getElementById('btn-retry-answer').style.display = 'inline-block';
            document.getElementById('btn-next-step').style.display = evaluation.canFinishEarly ? 'none' : 'inline-block';

            renderStepFeedback(evaluation);

        } catch (error) {
            console.error('提交答案失败:', error);
            submitBtn.textContent = '提交失败，重试';
            submitBtn.disabled = false;
        } finally {
            isSubmitting = false;
            if (submitBtn.style.display !== 'none') {
                submitBtn.textContent = '提交回答';
                submitBtn.disabled = false;
            }
        }
    }

    // ========================================
    // 词语练习模块
    // ========================================

    let questionsData = [];
    let practiceState = {
        mode: 'random',
        count: 20,
        selectedTags: [],
        selectedGrades: [],      // 选中的年级
        selectedTexts: [],       // 选中的课文
        selectedKnowledgePoints: [], // 选中的知识点
        questions: [],
        currentIndex: 0,
        score: 0,
        correctCount: 0,
        wrongCount: 0,
        wrongQuestionIds: [],
        currentWrongQuestions: [], // 本次练习错题详情
        answered: false
    };

    // 学习进度数据结构
    let progressData = {
        practicedIds: [],        // 已练习题目ID
        correctIds: [],          // 答对题目ID
        wrongBook: {}            // 错题本 { questionId: { wrongCount, lastWrongTime, wrongOptions, correctStreak } }
    };

    const STORAGE_KEY = 'wenyan_zhixue_progress';

    // 年级列表
    const GRADES = ['七上', '七下', '八上', '八下', '九上', '九下', '课外'];

    function initPractice() {
        // 兼容新旧格式：新格式是 {schema_version, questions:[...]}, 旧格式是 [...]
        const rawData = typeof QUESTIONS_DATA !== 'undefined' ? QUESTIONS_DATA : [];
        questionsData = Array.isArray(rawData) ? rawData : (rawData.questions || []);
        questionsData = questionsData.map(normalizeQuestion);
        loadProgress();
        renderGradeList();
        renderTagList();
        updateStatsDisplay();
    }

    // Task 2: 数据兼容性修复 - 确保正确处理各种字段格式
    function normalizeQuestion(q) {
        if (q._normalized) return q;

        // 处理sentence字段（可能是字符串或对象）
        let sentenceText = '';
        if (typeof q.sentence === 'string') {
            sentenceText = q.sentence;
        } else if (q.sentence && typeof q.sentence === 'object') {
            sentenceText = q.sentence.text || '';
        } else if (q.sentence_text) {
            sentenceText = q.sentence_text;
        }

        // 处理target_word字段
        let targetWord = '';
        if (q.target_word) {
            targetWord = q.target_word;
        } else if (q.sentence && typeof q.sentence === 'object' && q.sentence.target_word) {
            targetWord = q.sentence.target_word;
        }

        // 处理source_text字段
        let sourceWork = '';
        let sourceGrade = '';
        if (q.source_text) {
            sourceWork = q.source_text;
        } else if (q.source) {
            if (typeof q.source === 'string') {
                sourceWork = q.source;
            } else if (typeof q.source === 'object' && q.source.work) {
                sourceWork = q.source.work;
                if (q.source.grade) sourceGrade = q.source.grade;
            }
        }

        // 处理knowledge_points字段
        let knowledgePoints = [];
        if (q.knowledge_points && Array.isArray(q.knowledge_points)) {
            knowledgePoints = q.knowledge_points;
        } else if (q.tags && Array.isArray(q.tags)) {
            knowledgePoints = q.tags;
        }

        // 处理answer字段（可能是选项标签如'A'或选项文本）
        let answerText = q.answer || '';
        if (q.options && q.options.length > 0) {
            // 检查answer是否是选项标签（A/B/C/D）
            const labelMatch = q.answer && q.answer.match(/^[A-D]$/);
            if (labelMatch) {
                const labelIndex = q.answer.charCodeAt(0) - 65; // A=0, B=1, C=2, D=3
                if (q.options[labelIndex]) {
                    answerText = q.options[labelIndex].text || q.options[labelIndex];
                }
            } else {
                // 尝试匹配选项文本
                const answerOpt = q.options.find(o => {
                    const optText = typeof o === 'object' ? o.text : o;
                    return optText === q.answer || o.label === q.answer;
                });
                if (answerOpt) {
                    answerText = typeof answerOpt === 'object' ? answerOpt.text : answerOpt;
                }
            }
        }

        // 处理grade字段（年级）
        let grade = q.grade || '';
        // 跳过"课外"，优先使用 source.grade
        if (!grade || grade === '课外') {
            if (sourceGrade) {
                grade = sourceGrade;
            } else if (sourceWork) {
                const gradeMatch = sourceWork.match(/(七[上下]|八[上下]|九[上下])/);
                if (gradeMatch) {
                    grade = gradeMatch[1];
                }
            }
        }
        // 从 tags 中查找年级（兜底）
        if (!grade || grade === '课外') {
            if (q.tags && Array.isArray(q.tags)) {
                const gradeTag = q.tags.find(t => /^(七[上下]|八[上下]|九[上下])$/.test(t));
                if (gradeTag) grade = gradeTag;
            }
        }

        // 规范化options格式
        let normalizedOptions = [];
        if (q.options && Array.isArray(q.options)) {
            normalizedOptions = q.options.map((opt, index) => {
                if (typeof opt === 'string') {
                    return { label: String.fromCharCode(65 + index), text: opt };
                }
                return { label: opt.label || String.fromCharCode(65 + index), text: opt.text || opt };
            });
        }

        return {
            ...q,
            _normalized: true,
            sentence: sentenceText,
            target_word: targetWord,
            source_text: sourceWork,
            knowledge_points: knowledgePoints,
            answer: answerText,
            grade: grade,
            options: normalizedOptions
        };
    }

    // Task 7: 学习进度追踪 - 从localStorage加载进度
    function loadProgress() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                const data = JSON.parse(saved);
                progressData = {
                    practicedIds: data.practicedIds || [],
                    correctIds: data.correctIds || [],
                    wrongBook: data.wrongBook || {}
                };
                // 同步到practiceState.wrongQuestionIds
                practiceState.wrongQuestionIds = Object.keys(progressData.wrongBook);
                console.log('✅ 进度已加载，错题本数量:', Object.keys(progressData.wrongBook).length);
            } else {
                console.log('📝 暂无保存的进度');
            }
        } catch (e) {
            console.error('❌ 加载进度失败:', e);
        }
    }

    // Task 7: 保存进度到localStorage
    function saveProgress() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(progressData));
            console.log('✅ 进度已保存，错题本数量:', Object.keys(progressData.wrongBook).length);
        } catch (e) {
            console.error('❌ 保存进度失败:', e);
        }
    }

    // Task 7: 记录答题
    function recordAnswer(questionId, isCorrect, selectedOption) {
        // 记录已练习
        if (!progressData.practicedIds.includes(questionId)) {
            progressData.practicedIds.push(questionId);
        }

        if (isCorrect) {
            // 答对
            if (!progressData.correctIds.includes(questionId)) {
                progressData.correctIds.push(questionId);
            }

            // 更新错题本中的连续正确次数
            if (progressData.wrongBook[questionId]) {
                progressData.wrongBook[questionId].correctStreak =
                    (progressData.wrongBook[questionId].correctStreak || 0) + 1;

                // 连续答对2次，从错题本移除
                if (progressData.wrongBook[questionId].correctStreak >= 2) {
                    delete progressData.wrongBook[questionId];
                    // 同步到practiceState
                    const idx = practiceState.wrongQuestionIds.indexOf(questionId);
                    if (idx > -1) {
                        practiceState.wrongQuestionIds.splice(idx, 1);
                    }
                }
            }
        } else {
            // 答错
            if (!progressData.wrongBook[questionId]) {
                progressData.wrongBook[questionId] = {
                    wrongCount: 0,
                    lastWrongTime: 0,
                    wrongOptions: [],
                    correctStreak: 0
                };
                console.log('📝 新增错题:', questionId);
            }

            progressData.wrongBook[questionId].wrongCount++;
            progressData.wrongBook[questionId].lastWrongTime = Date.now();
            progressData.wrongBook[questionId].correctStreak = 0;

            // 记录错误选项（去重）
            if (selectedOption && !progressData.wrongBook[questionId].wrongOptions.includes(selectedOption)) {
                progressData.wrongBook[questionId].wrongOptions.push(selectedOption);
            }

            console.log('❌ 记录错题:', questionId, '累计错误:', progressData.wrongBook[questionId].wrongCount);

            // 同步到practiceState
            if (!practiceState.wrongQuestionIds.includes(questionId)) {
                practiceState.wrongQuestionIds.push(questionId);
            }
        }

        saveProgress();
    }

    // 获取错题详情
    function getWrongQuestionInfo(questionId) {
        return progressData.wrongBook[questionId] || null;
    }

    // Task 7: 计算统计数据
    function getStats() {
        const practiced = progressData.practicedIds.length;
        const correct = progressData.correctIds.length;
        const wrong = Object.keys(progressData.wrongBook).length;
        const rate = practiced > 0 ? Math.round((correct / practiced) * 100) : 0;

        return {
            total: questionsData.length,
            practiced: practiced,
            correct: correct,
            wrong: wrong,
            rate: rate
        };
    }

    // Task 7: 更新统计卡片显示
    function updateStatsDisplay() {
        const stats = getStats();
        const statTotal = document.getElementById('stat-total');
        const statCorrect = document.getElementById('stat-correct');
        const statWrong = document.getElementById('stat-wrong');
        const statRate = document.getElementById('stat-rate');

        if (statTotal) statTotal.textContent = stats.practiced;
        if (statCorrect) statCorrect.textContent = stats.correct;
        if (statWrong) statWrong.textContent = stats.wrong;
        if (statRate) statRate.textContent = stats.rate + '%';
    }

    function renderTagList() {
        const tagList = document.getElementById('tag-list');
        if (!tagList || !questionsData.length) return;

        const allTags = new Set();
        questionsData.forEach(q => {
            if (q.knowledge_points) {
                q.knowledge_points.forEach(t => allTags.add(t));
            }
        });

        const tags = Array.from(allTags);
        if (tags.length === 0) {
            tagList.innerHTML = '<span style="color:#999;font-size:13px;">暂无知识点标签</span>';
            return;
        }

        tagList.innerHTML = tags.map(t => `
            <span class="tag-item" data-tag="${t}">${t}</span>
        `).join('');
    }

    // Task 6: 模式切换（支持四种模式：random, wrong, bytag, bytext）
    function setMode(mode) {
        practiceState.mode = mode;
        document.querySelectorAll('.mode-card').forEach(card => {
            card.classList.toggle('active', card.dataset.mode === mode);
        });

        // 显示/隐藏年级选择器
        const gradeSelector = document.getElementById('grade-selector');
        if (gradeSelector) {
            gradeSelector.style.display = (mode === 'bytext' || mode === 'bytag') ? 'block' : 'none';
        }

        // 显示/隐藏课文选择器
        const textSelector = document.getElementById('text-selector');
        if (textSelector) {
            textSelector.style.display = mode === 'bytext' ? 'block' : 'none';
        }

        // 显示/隐藏知识点选择器
        const tagSelector = document.getElementById('tag-selector');
        if (tagSelector) {
            tagSelector.style.display = mode === 'bytag' ? 'block' : 'none';
        }

        // 更新可选题量
        updateAvailableCount();
        updateFilterPreview();
    }

    // Task 6: 年级选择
    function toggleGrade(grade) {
        const idx = practiceState.selectedGrades.indexOf(grade);
        if (idx > -1) {
            practiceState.selectedGrades.splice(idx, 1);
        } else {
            practiceState.selectedGrades.push(grade);
        }

        // 更新UI
        document.querySelectorAll('.grade-item').forEach(item => {
            item.classList.toggle('active',
                practiceState.selectedGrades.includes(item.dataset.grade));
        });

        // 年级变化时重新渲染课文列表
        renderTextList();
        updateAvailableCount();
        updateFilterPreview();
    }

    // Task 6: 课文选择
    function toggleText(text) {
        const idx = practiceState.selectedTexts.indexOf(text);
        if (idx > -1) {
            practiceState.selectedTexts.splice(idx, 1);
        } else {
            practiceState.selectedTexts.push(text);
        }

        // 更新UI
        document.querySelectorAll('.text-item').forEach(item => {
            item.classList.toggle('active',
                practiceState.selectedTexts.includes(item.dataset.text));
        });

        updateAvailableCount();
        updateFilterPreview();
    }

    // Task 6: 知识点选择
    function toggleKnowledgePoint(kp) {
        const idx = practiceState.selectedKnowledgePoints.indexOf(kp);
        if (idx > -1) {
            practiceState.selectedKnowledgePoints.splice(idx, 1);
        } else {
            practiceState.selectedKnowledgePoints.push(kp);
        }

        // 更新UI
        document.querySelectorAll('.kp-item').forEach(item => {
            item.classList.toggle('active',
                practiceState.selectedKnowledgePoints.includes(item.dataset.kp));
        });

        updateAvailableCount();
        updateFilterPreview();
    }

    // Task 6: 根据筛选条件获取题目池
    function getQuestionPool() {
        let pool = [...questionsData];

        // 按模式筛选
        if (practiceState.mode === 'wrong') {
            pool = pool.filter(q => practiceState.wrongQuestionIds.includes(q.id));
        } else if (practiceState.mode === 'bytag') {
            // 按知识点筛选
            if (practiceState.selectedKnowledgePoints.length > 0) {
                pool = pool.filter(q => {
                    if (!q.knowledge_points) return false;
                    return q.knowledge_points.some(kp =>
                        practiceState.selectedKnowledgePoints.includes(kp));
                });
            }
            // 按年级筛选
            if (practiceState.selectedGrades.length > 0) {
                pool = pool.filter(q =>
                    practiceState.selectedGrades.includes(q.grade));
            }
        } else if (practiceState.mode === 'bytext') {
            // 按课文筛选
            if (practiceState.selectedTexts.length > 0) {
                pool = pool.filter(q =>
                    practiceState.selectedTexts.includes(q.source_text));
            }
            // 按年级筛选
            if (practiceState.selectedGrades.length > 0) {
                pool = pool.filter(q =>
                    practiceState.selectedGrades.includes(q.grade));
            }
        }

        return pool;
    }

    // 更新筛选条件预览显示
    function updateFilterPreview() {
        let previewHtml = '';
        const conditions = [];
        
        if (practiceState.selectedGrades.length > 0) {
            conditions.push(...practiceState.selectedGrades);
        }
        if (practiceState.selectedTexts.length > 0) {
            conditions.push(...practiceState.selectedTexts);
        }
        if (practiceState.selectedKnowledgePoints.length > 0) {
            conditions.push(...practiceState.selectedKnowledgePoints);
        }
        
        if (conditions.length > 0) {
            previewHtml = `
                <div class="filter-preview">
                    <span class="filter-preview-label">已选：</span>
                    ${conditions.map(c => `<span class="filter-preview-tag">${c}</span>`).join('')}
                    <button class="filter-clear-all">清除全部</button>
                </div>
            `;
        }
        
        // 插入到配置区域
        const configCard = document.querySelector('.config-card');
        if (configCard) {
            const existing = configCard.querySelector('.filter-preview');
            if (existing) existing.remove();
            configCard.insertAdjacentHTML('afterbegin', previewHtml);
            // 事件委托绑定清除按钮（IIFE内部函数不能用inline onclick）
            var clearBtn = configCard.querySelector('.filter-clear-all');
            if (clearBtn) {
                clearBtn.addEventListener('click', clearAllFilters);
            }
        }
    }

    // 清除所有筛选条件
    function clearAllFilters() {
        practiceState.selectedGrades = [];
        practiceState.selectedTexts = [];
        practiceState.selectedKnowledgePoints = [];
        document.querySelectorAll('.grade-item, .text-item, .kp-item, .tag-item').forEach(item => {
            item.classList.remove('active');
        });
        updateFilterPreview();
        updateAvailableCount();
    }

    // Task 6: 动态更新可选题量
    function updateAvailableCount() {
        const pool = getQuestionPool();
        const availableCountEl = document.getElementById('available-count');
        if (availableCountEl) {
            availableCountEl.textContent = pool.length;
        }

        // 更新题量按钮状态
        const countBtns = document.querySelectorAll('.count-btn');
        countBtns.forEach(btn => {
            const count = parseInt(btn.dataset.count);
            btn.disabled = count > pool.length;
            if (count > pool.length) {
                btn.classList.add('disabled');
            } else {
                btn.classList.remove('disabled');
            }
        });
    }

    // Task 6: 渲染年级列表
    function renderGradeList() {
        const gradeList = document.getElementById('grade-list');
        if (!gradeList) return;

        gradeList.innerHTML = GRADES.map(g => `
            <span class="grade-item" data-grade="${g}">${g}</span>
        `).join('');
    }

    // Task 6: 根据选中年级渲染课文列表
    function renderTextList() {
        const textList = document.getElementById('text-list');
        if (!textList || !questionsData.length) return;

        // 获取选中年级下的所有课文
        let texts = new Set();
        questionsData.forEach(q => {
            if (q.source_text) {
                // 如果选中了年级，只显示该年级的课文
                if (practiceState.selectedGrades.length > 0) {
                    if (practiceState.selectedGrades.includes(q.grade)) {
                        texts.add(q.source_text);
                    }
                } else {
                    texts.add(q.source_text);
                }
            }
        });

        const textArray = Array.from(texts).sort();
        if (textArray.length === 0) {
            textList.innerHTML = '<span style="color:#999;font-size:13px;">该年级暂无课文</span>';
            return;
        }

        textList.innerHTML = textArray.map(t => `
            <span class="text-item" data-text="${t}">${t}</span>
        `).join('');
    }

    // Task 6: 渲染知识点列表
    function renderKnowledgePointList() {
        const kpList = document.getElementById('knowledge-point-list');
        if (!kpList || !questionsData.length) return;

        const allKP = new Set();
        questionsData.forEach(q => {
            if (q.knowledge_points && Array.isArray(q.knowledge_points)) {
                q.knowledge_points.forEach(kp => allKP.add(kp));
            }
        });

        const kpArray = Array.from(allKP).sort();
        if (kpArray.length === 0) {
            kpList.innerHTML = '<span style="color:#999;font-size:13px;">暂无知识点标签</span>';
            return;
        }

        kpList.innerHTML = kpArray.map(kp => `
            <span class="kp-item" data-kp="${kp}">${kp}</span>
        `).join('');
    }

    function setCount(count) {
        practiceState.count = count;
        document.querySelectorAll('.count-btn').forEach(btn => {
            btn.classList.toggle('active', parseInt(btn.dataset.count) === count);
        });
        updateAvailableCount();
    }

    // 选择全部题量
    function selectAllCount() {
        const pool = getQuestionPool();
        practiceState.count = pool.length;
        document.querySelectorAll('.count-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.count === 'all');
        });
        updateAvailableCount();
    }

    function shuffleArray(arr) {
        const a = [...arr];
        for (let i = a.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
    }

    function startPractice() {
        const pool = getQuestionPool();

        if (pool.length === 0) {
            alert(practiceState.mode === 'wrong' ?
                '暂无错题记录，先去练习一些题目吧！' :
                '该条件下暂无题目');
            return;
        }

        const count = Math.min(practiceState.count, pool.length);
        practiceState.questions = shuffleArray(pool).slice(0, count);
        practiceState.currentIndex = 0;
        practiceState.score = 0;
        practiceState.correctCount = 0;
        practiceState.wrongCount = 0;
        practiceState.currentWrongQuestions = []; // 清空本次错题
        practiceState.answered = false;

        document.getElementById('practice-config').style.display = 'none';
        document.getElementById('practice-area').style.display = 'block';
        document.getElementById('practice-result').style.display = 'none';

        document.getElementById('progress-total').textContent = practiceState.questions.length;
        renderCurrentQuestion();
    }

    // Task 8: 渲染当前题目（显示错题历史错误次数）
    function renderCurrentQuestion() {
        const q = practiceState.questions[practiceState.currentIndex];
        if (!q) return;

        practiceState.answered = false;

        document.getElementById('progress-current').textContent = practiceState.currentIndex + 1;
        document.getElementById('practice-score').textContent = practiceState.questions.length > 0 ? Math.round((practiceState.correctCount / practiceState.questions.length) * 100) : 0;

        const progressFill = document.getElementById('progress-fill');
        progressFill.style.width =
            ((practiceState.currentIndex) / practiceState.questions.length * 100) + '%';

        document.getElementById('question-id').textContent = q.id;
        document.getElementById('question-difficulty').textContent =
            '★'.repeat(q.difficulty || 2) + '☆'.repeat(5 - (q.difficulty || 2));
        document.getElementById('question-source').textContent =
            q.source_text || q.source || '';

        // Task 8: 显示错题的历史错误次数
        const wrongInfo = getWrongQuestionInfo(q.id);
        const wrongHistoryEl = document.getElementById('wrong-history');
        if (wrongHistoryEl) {
            if (wrongInfo && wrongInfo.wrongCount > 0) {
                wrongHistoryEl.innerHTML = `<span class="wrong-badge">历史错${wrongInfo.wrongCount}次</span>`;
                wrongHistoryEl.style.display = 'inline';
            } else {
                wrongHistoryEl.style.display = 'none';
            }
        }

        const sentenceDiv = document.getElementById('question-sentence');
        const targetWord = q.target_word;
        const sentence = q.sentence;
        if (sentence && targetWord) {
            const highlighted = sentence.replace(
                new RegExp(targetWord, 'g'),
                `<span class="highlight-word">${targetWord}</span>`
            );
            sentenceDiv.innerHTML = highlighted;
        } else {
            sentenceDiv.textContent = sentence || '';
        }

        const optionsDiv = document.getElementById('question-options');
        const shuffledOptions = shuffleArray(q.options);
        optionsDiv.innerHTML = shuffledOptions.map((opt, i) => `
            <div class="option-item" data-option="${opt.text}">
                <div class="option-label">${String.fromCharCode(65 + i)}</div>
                <div class="option-text">${opt.text}</div>
            </div>
        `).join('');

        document.getElementById('question-result').style.display = 'none';
        document.getElementById('btn-next-question').style.display = 'none';
    }

    // Task 8: 选择选项（改进错题本记录 + UX优化）
    function selectOption(optionText) {
        if (practiceState.answered) return;
        practiceState.answered = true;

        const q = practiceState.questions[practiceState.currentIndex];
        const isCorrect = optionText === q.answer;

        // 添加触觉反馈
        const clickedOption = document.querySelector(`.option-item[data-option="${optionText}"]`);
        if (clickedOption) {
            clickedOption.style.transform = 'scale(0.95)';
            setTimeout(() => {
                clickedOption.style.transform = '';
            }, 100);
        }

        const options = document.querySelectorAll('.option-item');
        options.forEach(opt => {
            opt.classList.add('disabled');
            if (opt.dataset.option === q.answer) {
                opt.classList.add('highlight-correct');
            } else if (opt.dataset.option === optionText && !isCorrect) {
                opt.classList.add('wrong');
            }
        });

        const resultDiv = document.getElementById('question-result');
        const resultIcon = document.getElementById('result-icon');
        const resultText = document.getElementById('result-text');
        const resultExplanation = document.getElementById('result-explanation');

        if (isCorrect) {
            practiceState.correctCount++;
            resultDiv.className = 'question-result correct';
            resultIcon.textContent = '✅';
            resultText.textContent = '回答正确！';

            // 检查是否从错题本移除（显示提示）
            const wrongInfo = getWrongQuestionInfo(q.id);
            if (wrongInfo) {
                const streak = wrongInfo.correctStreak + 1;
                if (streak >= 2) {
                    resultText.textContent = '回答正确！此题已从错题本移除 🎉';
                } else {
                    resultText.textContent = `回答正确！再答对1次即可移除错题本`;
                }
            }
        } else {
            practiceState.wrongCount++;
            resultDiv.className = 'question-result wrong';
            resultIcon.textContent = '❌';
            resultText.textContent = '回答错误';

            // 显示历史错误次数
            const wrongInfo = getWrongQuestionInfo(q.id);
            if (wrongInfo) {
                resultText.textContent = `回答错误（累计错${wrongInfo.wrongCount + 1}次）`;
            }

            // 记录到本次错题列表（用于结果页展示）
            practiceState.currentWrongQuestions.push(Object.assign({}, q, { userAnswer: optionText }));
        }

        // Task 8: 使用recordAnswer记录答题（自动处理错题本逻辑）
        recordAnswer(q.id, isCorrect, optionText);

        let explanation = `正确答案：${q.answer}`;
        if (q.explanation) {
            explanation += `<br><br>${q.explanation}`;
        }
        resultExplanation.innerHTML = explanation;
        resultDiv.style.display = 'block';

        // 更新得分时添加动画
        const scoreEl = document.getElementById('practice-score');
        if (scoreEl) {
            scoreEl.classList.add('bump');
            setTimeout(() => {
                scoreEl.classList.remove('bump');
            }, 300);
        }

        document.getElementById('practice-score').textContent = practiceState.questions.length > 0 ? Math.round((practiceState.correctCount / practiceState.questions.length) * 100) : 0;

        updateStatsDisplay();

        document.getElementById('btn-next-question').style.display = 'inline-block';
        document.getElementById('btn-next-question').textContent =
            practiceState.currentIndex >= practiceState.questions.length - 1 ? '查看结果' : '下一题';

        // 答题后自动滚动到结果区域
        setTimeout(() => {
            const resultDiv = document.getElementById('question-result');
            if (resultDiv) {
                resultDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }, 200);
    }

    function nextQuestion() {
        if (practiceState.currentIndex >= practiceState.questions.length - 1) {
            showPracticeResult();
        } else {
            practiceState.currentIndex++;
            renderCurrentQuestion();
        }
    }

    function showPracticeResult() {
        document.getElementById('practice-area').style.display = 'none';
        document.getElementById('practice-result').style.display = 'block';
        
        // 重置动画
        const resultCard = document.querySelector('.practice-result-page .result-card');
        if (resultCard) {
            resultCard.style.animation = 'none';
            resultCard.offsetHeight; // 触发重排
            resultCard.style.animation = '';
        }

        const total = practiceState.questions.length;
        const correct = practiceState.correctCount;
        const rate = total > 0 ? Math.round((correct / total) * 100) : 0;

        document.getElementById('final-score').textContent = total > 0 ? Math.round((correct / total) * 100) : 0;
        document.getElementById('final-correct').textContent = correct;
        document.getElementById('final-wrong').textContent = practiceState.wrongCount;
        document.getElementById('final-rate').textContent = rate + '%';

        // 渲染知识点正确率分布图表
        renderKnowledgeChart();

        // 渲染本次错题列表
        renderWrongList();

        // 控制按钮显示
        const retryBtn = document.getElementById('btn-retry-wrong');
        if (retryBtn) {
            retryBtn.style.display = practiceState.wrongCount > 0 ? 'inline-block' : 'none';
        }
    }

    // 渲染知识点正确率分布图表
    function renderKnowledgeChart() {
        const chartBars = document.getElementById('knowledge-chart-bars');
        const chartContainer = document.getElementById('knowledge-chart');

        if (!chartBars || !chartContainer) return;

        // 统计各知识点的答题情况
        const knowledgeStats = {};

        practiceState.questions.forEach(q => {
            const tags = q.knowledge_points || ['未分类'];
            const isWrong = practiceState.currentWrongQuestions.some(w => w.id === q.id);

            tags.forEach(tag => {
                if (!knowledgeStats[tag]) {
                    knowledgeStats[tag] = { total: 0, correct: 0 };
                }
                knowledgeStats[tag].total++;
                if (!isWrong) {
                    knowledgeStats[tag].correct++;
                }
            });
        });

        // 如果没有知识点数据，隐藏图表
        if (Object.keys(knowledgeStats).length === 0) {
            chartContainer.style.display = 'none';
            return;
        }

        chartContainer.style.display = 'block';

        // 计算正确率并排序
        const sortedStats = Object.entries(knowledgeStats)
            .map(([tag, stats]) => ({
                tag,
                rate: stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0,
                total: stats.total,
                correct: stats.correct
            }))
            .sort((a, b) => a.rate - b.rate); // 按正确率升序排列

        // 渲染条形图（CSS 类名与 style.css 保持一致）
        chartBars.innerHTML = sortedStats.map(stat => {
            return `
                <div class="knowledge-bar">
                    <div class="knowledge-bar-label">${stat.tag}</div>
                    <div class="knowledge-bar-track">
                        <div class="knowledge-bar-fill" style="width: ${stat.rate}%;"></div>
                    </div>
                    <span class="knowledge-bar-count">${stat.correct}/${stat.total} (${stat.rate}%)</span>
                </div>
            `;
        }).join('');
    }

    // 渲染本次错题列表
    function renderWrongList() {
        const wrongListItems = document.getElementById('wrong-list-items');
        const wrongListContainer = document.getElementById('wrong-list');

        if (!wrongListItems || !wrongListContainer) return;

        // 如果没有错题，隐藏列表
        if (practiceState.currentWrongQuestions.length === 0) {
            wrongListContainer.style.display = 'none';
            return;
        }

        wrongListContainer.style.display = 'block';

        // 渲染错题列表
        wrongListItems.innerHTML = practiceState.currentWrongQuestions.map((wrong, index) => {
            const sentence = wrong.sentence || '';
            const targetWord = wrong.target_word || '';
            const highlightedSentence = targetWord && sentence
                ? sentence.replace(new RegExp(targetWord, 'g'), `<span class="wrong-highlight">${targetWord}</span>`)
                : sentence;

            return `
                <div class="wrong-item" data-index="${index}">
                    <div class="wrong-item-header">
                        <span class="wrong-item-num">${index + 1}</span>
                        <span class="wrong-item-source">${wrong.source_text || ''}</span>
                    </div>
                    <div class="wrong-item-sentence">${highlightedSentence}</div>
                    <div class="wrong-item-target">目标字词：<strong>${targetWord}</strong></div>
                    <div class="wrong-item-answer">
                        <div><span class="wrong-answer-label">你的答案：</span><span class="wrong-answer-user">${wrong.userAnswer || '未记录'}</span></div>
                        <div><span class="wrong-answer-label">正确答案：</span><span class="wrong-answer-correct">${wrong.answer}</span></div>
                    </div>
                    <div class="wrong-item-detail" style="display:none;">
                        ${wrong.explanation ? `<div class="wrong-item-explanation">${wrong.explanation}</div>` : ''}
                        ${wrong.knowledge_points && wrong.knowledge_points.length > 0
                            ? `<div class="wrong-item-tags">知识点：${wrong.knowledge_points.join('、')}</div>` : ''}
                    </div>
                    <button class="wrong-item-toggle" data-index="${index}">查看详情</button>
                    <button class="wrong-item-ai-btn" data-index="${index}">
                        <span class="btn-icon">🤖</span>AI讲解
                    </button>
                </div>
            `;
        }).join('');

        // 绑定查看详情按钮事件
        wrongListItems.querySelectorAll('.wrong-item-toggle').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = e.target.dataset.index;
                const detailDiv = wrongListItems.querySelector(`.wrong-item[data-index="${index}"] .wrong-item-detail`);
                if (detailDiv) {
                    const isVisible = detailDiv.style.display !== 'none';
                    detailDiv.style.display = isVisible ? 'none' : 'block';
                    e.target.textContent = isVisible ? '查看详情' : '收起详情';
                }
            });
        });

        // 绑定AI讲解按钮事件
        wrongListItems.querySelectorAll('.wrong-item-ai-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = e.currentTarget.dataset.index;
                const wrong = practiceState.currentWrongQuestions[index];
                if (wrong) {
                    startAIWrongAnalysis(wrong, wrong.userAnswer);
                }
            });
        });
    }

    function restartPractice() {
        startPractice();
    }

    function retryWrong() {
        practiceState.mode = 'wrong';
        setMode('wrong');
        startPractice();
    }

    function backToConfig() {
        document.getElementById('practice-config').style.display = 'flex';
        document.getElementById('practice-area').style.display = 'none';
        document.getElementById('practice-result').style.display = 'none';
    }

    // --- 绑定事件 ---
    function bindEvents() {
        // 添加按钮防抖
        let lastClickTime = 0;
        const CLICK_DEBOUNCE = 500; // 500ms防抖

        function debounceClick(handler) {
            return function(e) {
                const now = Date.now();
                if (now - lastClickTime < CLICK_DEBOUNCE) {
                    return;
                }
                lastClickTime = now;
                handler.call(this, e);
            };
        }
        // 搜索按钮
        document.getElementById('search-btn').addEventListener('click', () => {
            const input = document.getElementById('search-input');
            searchWord(input.value.trim());
        });

        // 回车搜索
        document.getElementById('search-input').addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                searchWord(e.target.value.trim());
            }
        });

        // 限制输入为单字
        document.getElementById('search-input').addEventListener('input', (e) => {
            const val = e.target.value;
            // 只保留最后一个汉字
            const chinese = val.replace(/[^\u4e00-\u9fa5]/g, '');
            if (chinese.length > 1) {
                e.target.value = chinese[chinese.length - 1];
            } else if (chinese.length === 0) {
                e.target.value = '';
            } else {
                e.target.value = chinese;
            }
        });

        // 热门字点击
        document.getElementById('hot-words').addEventListener('click', (e) => {
            const btn = e.target.closest('.hot-word-btn');
            if (btn) {
                const char = btn.dataset.char;
                document.getElementById('search-input').value = char;
                searchWord(char);
            }
        });

        // 高频字表点击 -> 跳转查询
        document.getElementById('rank-table').addEventListener('click', (e) => {
            const row = e.target.closest('.rank-row');
            if (row) {
                const char = row.dataset.char;
                switchPage('home');
                document.getElementById('search-input').value = char;
                searchWord(char);
            }
        });

        // 导航切换
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                switchPage(link.dataset.page);
            });
        });

        // 首页功能卡片导航
        document.querySelectorAll('.feature-card').forEach(card => {
            card.addEventListener('click', (e) => {
                e.preventDefault();
                const targetPage = card.dataset.page;
                if (targetPage) switchPage(targetPage);
            });
        });

        // 首页"查看详情"按钮 → 跳转到每日一词详情页
        const dailyDetailBtn = document.getElementById('home-daily-detail');
        if (dailyDetailBtn) {
            dailyDetailBtn.addEventListener('click', (e) => {
                e.preventDefault();
                switchPage('daily-detail');
            });
        }

        // 汉堡菜单
        document.getElementById('hamburger-btn').addEventListener('click', toggleMobileNav);
        document.getElementById('mobile-nav-close').addEventListener('click', closeMobileNav);
        document.getElementById('mobile-nav-overlay').addEventListener('click', closeMobileNav);

        // 移动端导航链接
        document.querySelectorAll('.mobile-nav-link').forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                document.querySelectorAll('.mobile-nav-link').forEach(l => l.classList.remove('active'));
                this.classList.add('active');
                closeMobileNav();
                switchPage(link.dataset.page);
            });
        });

        // 星级筛选
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                currentFilter = btn.dataset.star;
                renderRankTable(currentFilter);
            });
        });

        // --- 翻译模块事件 ---

        // 句子选择
        document.getElementById('sentence-list').addEventListener('click', (e) => {
            const item = e.target.closest('.sentence-item');
            if (item) {
                var sentenceId = parseInt(item.dataset.id);
                var sentenceObj = sentencesData.find(function(s) { return s.id === sentenceId; });
                if (sentenceObj) {
                    startTranslation(sentenceId);
                }
            }
        });

        // 自由输入翻译
        var btnStartFreeTranslate = document.getElementById('btn-start-free-translate');
        if (btnStartFreeTranslate) {
            btnStartFreeTranslate.addEventListener('click', function() {
                var inputEl = document.getElementById('free-input-sentence');
                if (inputEl) {
                    var text = inputEl.value.trim();
                    if (text) {
                        startFreeTranslate(text, '');
                    } else {
                        alert('请输入要分析的文言文句子');
                    }
                }
            });

            // 输入框回车键触发翻译
            var freeInputEl = document.getElementById('free-input-sentence');
            if (freeInputEl) {
                freeInputEl.addEventListener('keydown', function(e) {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        var text = this.value.trim();
                        if (text) {
                            startFreeTranslate(text, '');
                        }
                    }
                });
            }
        }

        // 返回模式选择
        var btnBackToModes = document.getElementById('btn-back-to-modes');
        if (btnBackToModes) {
            btnBackToModes.addEventListener('click', backToModes);
        }

        // 查看参考答案
        document.getElementById('btn-show-answer').addEventListener('click', showAnswer);

        // 提交回答（AI评价）
        document.getElementById('btn-submit-answer').addEventListener('click', submitAnswer);

        // 重新作答
        document.getElementById('btn-retry-answer').addEventListener('click', function() {
            document.getElementById('user-answer').style.display = 'block';
            document.getElementById('user-answer').focus();
            document.getElementById('btn-submit-answer').style.display = 'inline-block';
            document.getElementById('btn-submit-answer').textContent = '提交回答';
            document.getElementById('btn-submit-answer').disabled = false;
            document.getElementById('btn-retry-answer').style.display = 'none';
            document.getElementById('btn-next-step').style.display = 'none';
            document.getElementById('step-card-feedback').style.display = 'none';
        });

        // 下一步
        document.getElementById('btn-next-step').addEventListener('click', nextStep);

        // 重新练习
        document.getElementById('btn-restart-translate').addEventListener('click', restartTranslation);

        // 返回句子列表
        document.getElementById('btn-back-list').addEventListener('click', backToSentenceList);

        // --- 练习模块事件 ---

        // 模式选择
        document.querySelectorAll('.mode-card').forEach(card => {
            card.addEventListener('click', () => {
                setMode(card.dataset.mode);
            });
        });

        // 题量选择（特殊处理 "all"）
        document.querySelectorAll('.count-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const countVal = btn.dataset.count;
                if (countVal === 'all') {
                    selectAllCount();
                } else {
                    setCount(parseInt(countVal));
                }
            });
        });

        // 全部题量按钮
        const countAllBtn = document.getElementById('count-all-btn');
        if (countAllBtn) {
            countAllBtn.addEventListener('click', selectAllCount);
        }

        // 年级选择
        const gradeList = document.getElementById('grade-list');
        if (gradeList) {
            gradeList.addEventListener('click', (e) => {
                const gradeItem = e.target.closest('.grade-item');
                if (gradeItem) {
                    toggleGrade(gradeItem.dataset.grade);
                }
            });
        }

        // 课文选择
        const textList = document.getElementById('text-list');
        if (textList) {
            textList.addEventListener('click', (e) => {
                const textItem = e.target.closest('.text-item');
                if (textItem) {
                    toggleText(textItem.dataset.text);
                }
            });
        }

        // 知识点选择
        const kpList = document.getElementById('knowledge-point-list');
        if (kpList) {
            kpList.addEventListener('click', (e) => {
                const kpItem = e.target.closest('.kp-item');
                if (kpItem) {
                    toggleKnowledgePoint(kpItem.dataset.kp);
                }
            });
        }

        // 标签选择（兼容旧版）
        const tagList = document.getElementById('tag-list');
        if (tagList) {
            tagList.addEventListener('click', (e) => {
                const tagItem = e.target.closest('.tag-item');
                if (tagItem) {
                    toggleKnowledgePoint(tagItem.dataset.tag);
                }
            });
        }

        // 开始练习
        const btnStart = document.getElementById('btn-start-practice');
        if (btnStart) {
            btnStart.addEventListener('click', startPractice);
        }

        // 选项点击
        const optionsDiv = document.getElementById('question-options');
        if (optionsDiv) {
            optionsDiv.addEventListener('click', debounceClick((e) => {
                const option = e.target.closest('.option-item');
                if (option && !option.classList.contains('disabled')) {
                    selectOption(option.dataset.option);
                }
            }));
        }

        // 下一题
        const btnNext = document.getElementById('btn-next-question');
        if (btnNext) {
            btnNext.addEventListener('click', nextQuestion);
        }

        // 只练错题
        const btnRetryWrong = document.getElementById('btn-retry-wrong');
        if (btnRetryWrong) {
            btnRetryWrong.addEventListener('click', retryWrong);
        }

        // 再来一组
        const btnRestart = document.getElementById('btn-restart');
        if (btnRestart) {
            btnRestart.addEventListener('click', restartPractice);
        }

        // 返回配置
        const btnBackConfig = document.getElementById('btn-back-config');
        if (btnBackConfig) {
            btnBackConfig.addEventListener('click', backToConfig);
        }

        // 每日一词事件
        const btnMastered = document.getElementById('btn-mastered');
        if (btnMastered) {
            btnMastered.addEventListener('click', toggleMastered);
        }

        const historyToggle = document.getElementById('daily-history-toggle');
        if (historyToggle) {
            historyToggle.addEventListener('click', toggleHistory);
        }

        const btnShare = document.getElementById('btn-share');
        if (btnShare) {
            btnShare.addEventListener('click', shareDailyCard);
        }

        const btnTheme = document.getElementById('btn-theme');
        if (btnTheme) {
            btnTheme.addEventListener('click', toggleCardTheme);
        }
    }

    // --- 启动 ---
    document.addEventListener('DOMContentLoaded', init);

    // ========================================
    // 首页每日一词（精简版）
    // ========================================

    function renderHomeDaily() {
        const word = currentDailyWord || null;
        if (!word) {
            // 如果每日一词还未初始化，用数据直接计算
            const seed = new Date().getFullYear() * 10000 + (new Date().getMonth() + 1) * 100 + new Date().getDate();
            const index = seed % wordsData.length;
            const todayWord = wordsData[index];
            if (!todayWord) return;
            renderHomeDailyCard(todayWord);
        } else {
            renderHomeDailyCard(word);
        }
    }

    function renderHomeDailyCard(word) {
        if (!word) return;

        // 日期
        const dateEl = document.getElementById('home-daily-date');
        if (dateEl) {
            const now = new Date();
            dateEl.textContent = `${now.getMonth() + 1}月${now.getDate()}日`;
        }

        // 字
        const charEl = document.getElementById('home-daily-char');
        if (charEl) charEl.textContent = word.character;

        // 拼音
        const pinyinEl = document.getElementById('home-daily-pinyin');
        if (pinyinEl) pinyinEl.textContent = word.pinyin;

        // 星级
        const starEl = document.getElementById('home-daily-star');
        if (starEl) {
            starEl.textContent = '★'.repeat(word.star || 1) + '☆'.repeat(5 - (word.star || 1));
        }

        // 释义（只显示第一个）
        const meaningEl = document.getElementById('home-daily-meaning');
        if (meaningEl && word.meaning) {
            const meanings = Array.isArray(word.meaning) ? word.meaning : [];
            if (meanings.length > 0) {
                const firstMeaning = typeof meanings[0] === 'string' ? meanings[0] : (meanings[0].content || '');
                meaningEl.textContent = firstMeaning;
            }
        }

        // 例句
        const exampleEl = document.getElementById('home-daily-example');
        if (exampleEl) {
            let exampleText = '';
            let exampleSource = '';
            if (word.examples && word.examples.length > 0) {
                exampleText = word.examples[0].sentence || word.examples[0].text || '';
                exampleSource = word.examples[0].source || '';
            } else if (word.meaning && Array.isArray(word.meaning)) {
                for (const m of word.meaning) {
                    const example = m.example || m.examples;
                    if (example) {
                        exampleText = typeof example === 'string' ? example : (example.sentence || example.text || '');
                        exampleSource = example.source || '';
                        break;
                    }
                }
            }
            if (exampleText) {
                exampleEl.innerHTML = exampleSource
                    ? `${exampleText}<br><span style="font-size:12px;opacity:0.7">—— ${exampleSource}</span>`
                    : exampleText;
            } else {
                exampleEl.textContent = '';
            }
        }
    }

    // ========================================
    // 每日一词模块
    // ========================================

    const DAILY_STORAGE_KEY = 'wenyan_daily_word';

let countdownInterval = null;

function initDailyWord() {
    const today = getTodayWord();
    currentDailyWord = today;
    renderDailyCard(today);
    renderDailyDate();
    renderDailyHistory();
    restoreCardTheme();
    startCountdown();
}

function getTodayDate() {
    const now = new Date();
    return `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日`;
}

function getTodayKey() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

function getDailySeed() {
    const now = new Date();
    return now.getFullYear() * 10000 + (now.getMonth() + 1) * 100 + now.getDate();
}

function getTodayWord() {
    const seed = getDailySeed();
    const index = seed % wordsData.length;
    return wordsData[index];
}

function renderDailyDate() {
    const dateEl = document.getElementById('daily-date');
    const cardDateEl = document.getElementById('card-date-value');
    const dateStr = getTodayDate();
    if (dateEl) dateEl.textContent = dateStr;
    if (cardDateEl) cardDateEl.textContent = dateStr;
}

function renderDailyCard(word) {
    if (!word) return;
    
    // 字词
    const charEl = document.getElementById('daily-char');
    if (charEl) charEl.textContent = word.character;
    
    // 拼音
    const pinyinEl = document.getElementById('daily-pinyin');
    if (pinyinEl) pinyinEl.textContent = word.pinyin;
    
    // 星级
    const starEl = document.getElementById('daily-star');
    if (starEl) {
        starEl.textContent = '★'.repeat(word.star || 1) + '☆'.repeat(5 - (word.star || 1));
    }
    
    // 释义 + 例句（每个义项紧跟其对应例句）
    const meaningEl = document.getElementById('daily-meaning');
    const exampleEl = document.getElementById('daily-example');
    if (meaningEl && word.meaning) {
        let meaningHtml = '';
        const meanings = Array.isArray(word.meaning) ? word.meaning : 
            (typeof word.meaning === 'string' ? [{seq: 1, content: word.meaning}] : []);
        
        meanings.forEach((m, i) => {
            const content = typeof m === 'string' ? m : (m.content || m);
            const example = (typeof m === 'object' && m.example) ? m.example : '';
            
            meaningHtml += `
                <div class="daily-meaning-item">
                    <span class="daily-meaning-seq">${i + 1}.</span>
                    <div class="daily-meaning-body">
                        <span class="daily-meaning-content">${content}</span>
                        ${example ? `<div class="daily-meaning-example">${example}</div>` : ''}
                    </div>
                </div>
            `;
        });
        meaningEl.innerHTML = meaningHtml;
    }
    
    // 底部例句区不再需要，隐藏
    if (exampleEl) {
        exampleEl.innerHTML = '';
        exampleEl.style.display = 'none';
    }
    
    // 掌握状态
    updateMasteredState();
}

function updateMasteredState() {
    const todayKey = getTodayKey();
    const history = getDailyHistory();
    const todayRecord = history.find(h => h.date === todayKey);
    const isMastered = todayRecord && todayRecord.mastered;
    
    const btnEl = document.getElementById('btn-mastered');
    const btnTextEl = document.getElementById('btn-mastered-text');
    
    if (btnEl) {
        btnEl.classList.toggle('active', isMastered);
    }
    if (btnTextEl) {
        btnTextEl.textContent = isMastered ? '已掌握 ✓' : '标记已掌握';
    }
}

function toggleMastered() {
    const todayKey = getTodayKey();
    const history = getDailyHistory();
    const todayIndex = history.findIndex(h => h.date === todayKey);
    
    if (todayIndex > -1) {
        history[todayIndex].mastered = !history[todayIndex].mastered;
    } else {
        history.unshift({
            date: todayKey,
            character: currentDailyWord.character,
            pinyin: currentDailyWord.pinyin,
            mastered: true
        });
    }
    
    saveDailyHistory(history);
    updateMasteredState();
    renderDailyHistory();
}

function getDailyHistory() {
    try {
        const saved = localStorage.getItem(DAILY_STORAGE_KEY);
        return saved ? JSON.parse(saved) : [];
    } catch (e) {
        return [];
    }
}

function saveDailyHistory(history) {
    // 只保留最近7天
    const recent = history.slice(0, 7);
    try {
        localStorage.setItem(DAILY_STORAGE_KEY, JSON.stringify(recent));
    } catch (e) {
        console.warn('保存历史记录失败:', e);
    }
}

function renderDailyHistory() {
    const listEl = document.getElementById('daily-history-list');
    if (!listEl) return;
    
    const history = getDailyHistory();
    
    if (history.length === 0) {
        listEl.innerHTML = '<div style="padding:20px;text-align:center;color:#999;">暂无学习记录</div>';
        return;
    }
    
    const todayKey = getTodayKey();
    
    listEl.innerHTML = history.map(item => {
        const date = new Date(item.date);
        const dateStr = `${date.getMonth() + 1}/${date.getDate()} ${['日','一','二','三','四','五','六'][date.getDay()]}`;
        const isToday = item.date === todayKey;
        
        return `
            <div class="daily-history-item" data-date="${item.date}">
                <div class="daily-history-date">${isToday ? '今天' : dateStr}</div>
                <div class="daily-history-char">${item.character}</div>
                <div class="daily-history-info">
                    <div class="daily-history-pinyin">${item.pinyin}</div>
                </div>
                ${item.mastered ? '<span class="daily-history-mastered">已掌握</span>' : ''}
            </div>
        `;
    }).join('');
}

function toggleCardTheme() {
    const cardEl = document.getElementById('daily-share-card');
    const btnTheme = document.getElementById('btn-theme');
    if (!cardEl) return;
    
    const isDark = cardEl.classList.toggle('dark-theme');
    localStorage.setItem('wenyan_daily_theme', isDark ? 'dark' : 'light');
    
    if (btnTheme) {
        btnTheme.innerHTML = isDark 
            ? '<span class="btn-icon">☀</span><span>日间模式</span>'
            : '<span class="btn-icon">☾</span><span>夜读模式</span>';
    }
}

function restoreCardTheme() {
    const cardEl = document.getElementById('daily-share-card');
    const btnTheme = document.getElementById('btn-theme');
    if (!cardEl) return;
    
    const saved = localStorage.getItem('wenyan_daily_theme');
    if (saved === 'dark') {
        cardEl.classList.add('dark-theme');
        if (btnTheme) {
            btnTheme.innerHTML = '<span class="btn-icon">☀</span><span>日间模式</span>';
        }
    }
}

function shareDailyCard() {
    const cardEl = document.getElementById('daily-share-card');
    if (!cardEl) return;
    
    const btnShare = document.getElementById('btn-share');
    if (btnShare) {
        btnShare.textContent = '生成中…';
        btnShare.disabled = true;
    }
    
    // 使用 html2canvas 截图
    if (typeof html2canvas === 'undefined' || !html2canvas) {
        console.warn('html2canvas 未加载，使用降级方案');
        if (btnShare) {
            btnShare.innerHTML = '<span class="btn-icon">↗</span><span>保存分享图</span>';
            btnShare.disabled = false;
        }
        alert('html2canvas 库未加载成功，请检查网络连接后刷新页面。您也可以直接截屏分享。');
        return;
    }
    html2canvas(cardEl, {
        scale: 2,
        backgroundColor: null,
        useCORS: true,
        logging: false
    }).then(canvas => {
        // 创建下载链接
        const link = document.createElement('a');
        const char = currentDailyWord ? currentDailyWord.character : 'word';
        const dateKey = getTodayKey();
        link.download = `文言智学_每日一词_${char}_${dateKey}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
        
        if (btnShare) {
            btnShare.innerHTML = '<span class="btn-icon">✓</span><span>已保存</span>';
            btnShare.disabled = false;
            setTimeout(() => {
                btnShare.innerHTML = '<span class="btn-icon">↗</span><span>保存分享图</span>';
            }, 2000);
        }
    }).catch(err => {
        console.error('生成分享图失败:', err);
        if (btnShare) {
            btnShare.innerHTML = '<span class="btn-icon">↗</span><span>保存分享图</span>';
            btnShare.disabled = false;
        }
        // 降级方案：提示用户截屏
        alert('自动生成图片失败，请直接截屏分享');
    });
}

function toggleHistory() {
    const listEl = document.getElementById('daily-history-list');
    const headerEl = document.getElementById('daily-history-toggle');
    if (listEl && headerEl) {
        const isExpanded = listEl.style.display !== 'none';
        listEl.style.display = isExpanded ? 'none' : 'block';
        headerEl.parentElement.classList.toggle('expanded', !isExpanded);
    }
}

function startCountdown() {
    if (countdownInterval) clearInterval(countdownInterval);
    
    function update() {
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        
        const diff = tomorrow - now;
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        
        const countdownEl = document.getElementById('daily-countdown');
        if (countdownEl) {
            countdownEl.textContent = `距离明日新词：${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        }
        
        // 到达新的一天，刷新页面
        if (diff <= 1000) {
            location.reload();
        }
    }
    
    update();
    countdownInterval = setInterval(update, 1000);
}

    // ========================================
    // AI智能讲解模块 - 多API适配层
    // ========================================

    const AI_STORAGE_KEY = 'wenyan_ai_config_v2';  // V2版本，使用新配置结构
    const AI_FEEDBACK_KEY = 'wenyan_ai_feedback';

    // ========================================
    // 1. AI服务商配置定义
    // ========================================

    // 服务商配置模板（不含用户密钥）
    const AI_PROVIDER_TEMPLATES = {
        coze: {
            name: '扣子智能体',
            nameEn: 'Coze Bot',
            type: 'coze',
            baseUrl: 'https://api.coze.cn',
            endpoint: '/v3/chat',
            badge: '智能体',
            color: '#00d4aa',
            fields: ['apiKey', 'botId'],
            desc: '标准扣子智能体API'
        },
        cozecode: {
            name: '扣子编程',
            nameEn: 'Coze Code',
            type: 'cozecode',
            baseUrl: 'https://q7cgq89kdw.coze.site',
            endpoint: '/stream_run',
            projectId: '7638262846312218633',
            badge: '智能体',
            color: '#00d4aa',
            fields: ['apiKey', 'domain', 'projectId'],
            desc: '扣子编程专属域名API'
        },
        deepseek: {
            name: 'DeepSeek',
            nameEn: 'DeepSeek',
            type: 'openai',
            baseUrl: 'https://api.deepseek.com/v1',
            endpoint: '/chat/completions',
            model: 'deepseek-v4-flash',
            badge: 'AI模式',
            color: '#6972f1',
            fields: ['apiKey'],
            desc: '国产大模型，性价比高'
        },
        tokendance: {
            name: 'Token Dance',
            nameEn: 'Token Dance',
            type: 'openai',
            baseUrl: 'https://api.tokendance.com/v1',
            endpoint: '/chat/completions',
            model: 'gpt-4o-mini',
            badge: '备选模式',
            color: '#f472b6',
            fields: ['apiKey'],
            desc: '备用API服务商'
        }
    };

    // 默认调用优先级（按顺序尝试）
    const DEFAULT_PRIORITY = ['cozecode', 'coze', 'deepseek', 'tokendance'];

    // ========================================
    // 2. AI配置状态
    // ========================================

    // AI配置（新V2结构）
    let aiConfig = {
        mode: 'auto',
        singleProvider: 'cozecode',
        priority: [...DEFAULT_PRIORITY],
        providers: {
            cozecode: {
                enabled: false,
                apiKey: '',
                domain: 'https://q7cgq89kdw.coze.site',
                projectId: '7638262846312218633'
            },
            coze: {
                enabled: false,
                apiKey: '',
                botId: ''
            },
            deepseek: {
                enabled: false,
                apiKey: '',
                model: 'deepseek-v4-flash'
            },
            tokendance: {
                enabled: false,
                apiKey: '',
                model: 'gpt-4o-mini'
            }
        }
    };

    // AI讲解状态
    let aiState = {
        isOpen: false,
        isGenerating: false,
        currentTopic: null,
        currentMode: 'template',
        currentProvider: null,  // 当前使用的provider
        abortController: null,
        typewriterTimer: null,
        fullContent: ''
    };

    // ========================================
    // 3. 配置加载与保存
    // ========================================

    // 加载AI配置（V2结构兼容旧版本）
    async function loadAIConfig() {
        // 1. 先加载本地开发配置文件（如果存在）
        await loadLocalDevConfig();
        
        // 2. 再加载localStorage中的用户配置（优先级更高）
        try {
            const saved = localStorage.getItem(AI_STORAGE_KEY);
            if (saved) {
                const data = JSON.parse(saved);
                
                // V2版本：完整的providers结构
                if (data.providers) {
                    aiConfig = { ...aiConfig, ...data };
                } 
                // V1版本兼容：如果只有provider和apiKey
                else if (data.provider) {
                    // 迁移V1配置到V2
                    if (data.provider === 'deepseek' && data.apiKey) {
                        aiConfig.providers.deepseek.apiKey = data.apiKey;
                    }
                    if (data.customBaseUrl) {
                        aiConfig.customBaseUrl = data.customBaseUrl;
                    }
                }
            }
        } catch (e) {
            console.warn('加载AI配置失败:', e);
        }
    }

    // 加载本地开发配置文件（config.local.json）
    async function loadLocalDevConfig() {
        try {
            const response = await fetch('config.local.json', { cache: 'no-store' });
            if (!response.ok) return;
            
            const localConfig = await response.json();
            console.log('📋 已加载本地开发配置 config.local.json');
            
            // 合并providers配置
            if (localConfig.providers) {
                for (const [provider, config] of Object.entries(localConfig.providers)) {
                    if (aiConfig.providers[provider]) {
                        aiConfig.providers[provider] = {
                            ...aiConfig.providers[provider],
                            ...config
                        };
                    }
                }
            }
            
            // 合并默认模式
            if (localConfig.defaultMode) {
                aiConfig.mode = localConfig.defaultMode;
            }
            if (localConfig.defaultProvider) {
                aiConfig.singleProvider = localConfig.defaultProvider;
            }
        } catch (e) {
            // 配置文件不存在是正常的，静默忽略
            if (!e.message.includes('Failed to fetch')) {
                console.warn('加载本地配置文件失败:', e);
            }
        }
    }

    // 保存AI配置
    function saveAIConfig() {
        try {
            localStorage.setItem(AI_STORAGE_KEY, JSON.stringify(aiConfig));
        } catch (e) {
            console.warn('保存AI配置失败:', e);
        }
    }

    // ========================================
    // 4. 辅助函数
    // ========================================

    // 检查provider是否已配置（API Key等必填项）
    function isProviderConfigured(providerName) {
        const provider = aiConfig.providers[providerName];
        if (!provider || !provider.enabled) return false;
        
        // 检查必填字段
        const template = AI_PROVIDER_TEMPLATES[providerName];
        if (!template) return false;
        
        for (const field of template.fields) {
            if (field === 'apiKey' && !provider.apiKey) return false;
            if (field === 'botId' && !provider.botId) return false;
        }
        
        return true;
    }

    // 获取当前可用的provider列表（按优先级）
    function getAvailableProviders() {
        if (aiConfig.mode === 'templateOnly') {
            return [];
        }
        
        if (aiConfig.mode === 'single') {
            const provider = aiConfig.singleProvider;
            return isProviderConfigured(provider) ? [provider] : [];
        }
        
        // auto模式：按优先级返回已配置的providers
        return aiConfig.priority.filter(p => isProviderConfigured(p));
    }

    // 获取provider的配置信息（模板+用户配置合并）
    function getProviderConfig(providerName) {
        const template = AI_PROVIDER_TEMPLATES[providerName];
        const userConfig = aiConfig.providers[providerName] || {};
        
        const config = {
            ...template,
            ...userConfig,
            apiKey: userConfig.apiKey || ''
        };
        
        // cozecode支持自定义域名
        if (providerName === 'cozecode' && userConfig.domain) {
            config.baseUrl = userConfig.domain;
        }
        
        return config;
    }

    // 打开AI讲解抽屉
    function openAIDrawer() {
        document.getElementById('ai-drawer').classList.add('open');
        document.getElementById('ai-drawer-overlay').classList.add('open');
        document.body.style.overflow = 'hidden';
        aiState.isOpen = true;
    }

    // 关闭AI讲解抽屉
    function closeAIDrawer() {
        document.getElementById('ai-drawer').classList.remove('open');
        document.getElementById('ai-drawer-overlay').classList.remove('open');
        document.body.style.overflow = '';
        aiState.isOpen = false;
        stopAIGeneration();
    }

    // 重置AI内容
    function resetAIContent() {
        document.getElementById('ai-message').innerHTML = '';
        document.getElementById('ai-thinking').style.display = 'none';
        document.getElementById('ai-cursor').style.display = 'none';
        document.getElementById('ai-btn-stop').style.display = 'none';
        document.getElementById('ai-btn-retry').style.display = 'none';
        document.getElementById('ai-feedback').style.display = 'none';
        document.getElementById('ai-mode-badge').style.display = 'none';
        aiState.fullContent = '';
    }

    // 显示思考中
    function showAIThinking() {
        document.getElementById('ai-thinking').style.display = 'flex';
        document.getElementById('ai-message').innerHTML = '';
        document.getElementById('ai-cursor').style.display = 'none';
        document.getElementById('ai-btn-stop').style.display = 'flex';
        document.getElementById('ai-btn-retry').style.display = 'none';
        document.getElementById('ai-feedback').style.display = 'none';
    }

    // 显示模式标签
    function showModeBadge(providerName) {
        const badge = document.getElementById('ai-mode-badge');
        
        if (providerName === 'template') {
            badge.textContent = '本地模式';
            badge.style.display = 'inline-block';
            badge.style.background = '#6b7280';
        } else if (providerName) {
            const template = AI_PROVIDER_TEMPLATES[providerName];
            if (template) {
                badge.textContent = template.badge;
                badge.style.display = 'inline-block';
                badge.style.background = template.color;
            } else {
                badge.style.display = 'none';
            }
        } else {
            badge.style.display = 'none';
        }
    }

    // 轻量级 Markdown → HTML 渲染（覆盖本地模板和API返回的常见格式）
    function renderMarkdown(text) {
        if (!text) return '';
        let html = text;
        // ### 标题 → <h3>
        html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
        // ## 标题 → <h2>
        html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
        // **粗体** → <strong>
        html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
        // *斜体* → <em>
        html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
        // - 列表项 → <li>（包裹在 <ul> 中）
        html = html.replace(/^- (.+)$/gm, '<li>$1</li>');
        // 数字列表 1. → <li>
        html = html.replace(/^\d+\.\s(.+)$/gm, '<li>$1</li>');
        // 连续 <li> 包裹 <ul>
        html = html.replace(/((?:<li>.*<\/li>\s*)+)/g, '<ul>$1</ul>');
        // 段落：双换行 → </p><p>
        html = html.replace(/\n\n+/g, '</p><p>');
        // 单换行 → <br>
        html = html.replace(/\n/g, '<br>');
        // 包裹整体
        html = '<p>' + html + '</p>';
        // 清理空段落
        html = html.replace(/<p>\s*<\/p>/g, '');
        return html;
    }

    // 打字机效果输出
    function typewriterEffect(text, speed = 20) {
        return new Promise((resolve) => {
            const messageEl = document.getElementById('ai-message');
            const cursorEl = document.getElementById('ai-cursor');
            let index = 0;
            
            cursorEl.style.display = 'inline-block';
            
            function type() {
                if (!aiState.isGenerating && index < text.length) {
                    // 停止时也渲染已有内容
                    messageEl.innerHTML = renderMarkdown(text.substring(0, index + 1));
                    resolve();
                    return;
                }
                
                if (index < text.length) {
                    messageEl.innerHTML = renderMarkdown(text.substring(0, index + 1));
                    index++;
                    aiState.typewriterTimer = setTimeout(type, speed);
                } else {
                    cursorEl.style.display = 'none';
                    aiState.isGenerating = false;
                    resolve();
                }
            }
            
            type();
        });
    }

    // 停止生成
    function stopAIGeneration() {
        aiState.isGenerating = false;
        
        if (aiState.abortController) {
            aiState.abortController.abort();
            aiState.abortController = null;
        }
        
        if (aiState.typewriterTimer) {
            clearTimeout(aiState.typewriterTimer);
            aiState.typewriterTimer = null;
        }
        
        document.getElementById('ai-btn-stop').style.display = 'none';
        document.getElementById('ai-cursor').style.display = 'none';
    }

    // ========================================
    // 5. API调用适配层
    // ========================================

    // ----------------------------------------
    // 5.1 OpenAI兼容API调用（DeepSeek、Token Dance等）
    // ----------------------------------------
    async function callOpenAICompatibleAPI(providerConfig, systemPrompt, userMessage) {
        const { baseUrl, endpoint, model, apiKey } = providerConfig;
        console.log('[API] OpenAI兼容调用:', baseUrl + endpoint, '模型:', model);

        aiState.abortController = new AbortController();

        try {
            const response = await fetch(`${baseUrl}${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: model,
                    messages: [
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: userMessage }
                    ],
                    stream: true,
                    temperature: 0.7,
                    max_tokens: 8000
                }),
                signal: aiState.abortController.signal
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`API错误: ${response.status} - ${errorText.substring(0, 100)}`);
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let fullText = '';
            let buffer = '';

            const messageEl = document.getElementById('ai-message');
            const cursorEl = document.getElementById('ai-cursor');
            
            document.getElementById('ai-thinking').style.display = 'none';
            cursorEl.style.display = 'inline-block';

            while (true) {
                const { value, done } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = line.substring(6);
                        if (data === '[DONE]') continue;
                        
                        try {
                            const json = JSON.parse(data);
                            const content = (json.choices && json.choices[0] && json.choices[0].delta && json.choices[0].delta.content) || '';
                            if (content) {
                                fullText += content;
                                messageEl.innerHTML = renderMarkdown(fullText);
                                const contentEl = document.getElementById('ai-drawer-content');
                                contentEl.scrollTop = contentEl.scrollHeight;
                            }
                        } catch (e) {
                            // 忽略解析错误
                        }
                    }
                }
            }

            cursorEl.style.display = 'none';
            aiState.fullContent = fullText;
            return fullText;

        } catch (error) {
            if (error.name === 'AbortError') {
                throw new Error('已取消');
            }
            throw error;
        }
    }

    // ----------------------------------------
    // 5.2 扣子智能体API调用
    // ----------------------------------------
    async function callCozeAPI(providerConfig, systemPrompt, userMessage) {
        const { baseUrl, apiKey, botId } = providerConfig;

        aiState.abortController = new AbortController();

        try {
            // 构建消息列表：如果有systemPrompt，先作为assistant角色设定注入
            var messages = [];
            if (systemPrompt) {
                messages.push({
                    role: 'assistant',
                    content: systemPrompt,
                    content_type: 'text'
                });
            }
            messages.push({
                role: 'user',
                content: userMessage,
                content_type: 'text'
            });

            const response = await fetch(`${baseUrl}/v3/chat`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                    'Accept': 'text/event-stream'
                },
                body: JSON.stringify({
                    bot_id: botId,
                    user_id: 'wenyan_user_' + Date.now(),
                    stream: true,
                    auto_save_history: false,
                    additional_messages: messages
                }),
                signal: aiState.abortController.signal
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`扣子API错误: ${response.status} - ${errorText.substring(0, 100)}`);
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let fullText = '';
            let buffer = '';
            let currentEvent = '';

            const messageEl = document.getElementById('ai-message');
            const cursorEl = document.getElementById('ai-cursor');
            
            document.getElementById('ai-thinking').style.display = 'none';
            cursorEl.style.display = 'inline-block';

            while (true) {
                const { value, done } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';

                for (const line of lines) {
                    if (line.startsWith(':')) continue;
                    
                    if (line.startsWith('event:')) {
                        currentEvent = line.substring(6).trim();
                        continue;
                    }
                    
                    if (line.startsWith('data: ')) {
                        const data = line.substring(6);
                        if (!data || data.trim() === '') continue;
                        if (data === '[DONE]') continue;
                        
                        try {
                            const json = JSON.parse(data);
                            
                            let deltaContent = '';
                            
                            if (currentEvent === 'conversation.message.delta') {
                                deltaContent = (json.delta && json.delta.content) || '';
                            } else if (currentEvent === '') {
                                deltaContent = (json.delta && json.delta.content) || 
                                              (json.data && json.data.delta && json.data.delta.content) || 
                                              (json.data && json.data.content) || '';
                            }
                            
                            if (deltaContent) {
                                fullText += deltaContent;
                                messageEl.innerHTML = renderMarkdown(fullText);
                                const contentEl = document.getElementById('ai-drawer-content');
                                contentEl.scrollTop = contentEl.scrollHeight;
                            }
                            
                            if (currentEvent === 'conversation.chat.completed' ||
                                currentEvent === 'conversation.message.completed' ||
                                json.event === 'conversation.chat.completed' ||
                                json.type === 'done') {
                                break;
                            }
                        } catch (e) {
                            // 忽略解析错误
                        }
                    }
                }
            }

            cursorEl.style.display = 'none';
            aiState.fullContent = fullText;
            return fullText;

        } catch (error) {
            if (error.name === 'AbortError') {
                throw new Error('已取消');
            }
            throw error;
        }
    }

    // ----------------------------------------
    // 5.2 扣子编程API调用（扣子编程专属域名格式）
    // ----------------------------------------
    async function callCozeCodeAPI(providerConfig, userMessage) {
        const { baseUrl, apiKey, projectId } = providerConfig;

        aiState.abortController = new AbortController();
        
        const sessionId = 'wenyan_' + Date.now();

        try {
            const response = await fetch(`${baseUrl}/stream_run`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                    'Accept': 'text/event-stream'
                },
                body: JSON.stringify({
                    content: {
                        query: {
                            prompt: [
                                {
                                    type: 'text',
                                    content: {
                                        text: userMessage
                                    }
                                }
                            ]
                        }
                    },
                    type: 'query',
                    session_id: sessionId,
                    project_id: projectId || 0
                }),
                signal: aiState.abortController.signal
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`扣子编程API错误: ${response.status} - ${errorText.substring(0, 200)}`);
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let fullText = '';
            let buffer = '';

            const messageEl = document.getElementById('ai-message');
            const cursorEl = document.getElementById('ai-cursor');
            
            document.getElementById('ai-thinking').style.display = 'none';
            cursorEl.style.display = 'inline-block';

            while (true) {
                const { value, done } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';

                for (const line of lines) {
                    if (line.startsWith(':')) continue;
                    
                    if (line.startsWith('event:')) continue;
                    
                    if (line.startsWith('data: ')) {
                        const data = line.substring(6);
                        if (!data || data.trim() === '') continue;
                        
                        try {
                            const json = JSON.parse(data);
                            
                            // 扣子编程SSE格式
                            // data.type = "answer" 时，data.content.answer 是回复内容
                            // data.type = "message_end" 时，表示结束
                            
                            if (json.type === 'answer') {
                                const answerContent = (json.content && json.content.answer) || '';
                                if (answerContent) {
                                    fullText += answerContent;
                                    messageEl.innerHTML = renderMarkdown(fullText);
                                    const contentEl = document.getElementById('ai-drawer-content');
                                    contentEl.scrollTop = contentEl.scrollHeight;
                                }
                            }
                            
                            if (json.type === 'message_end' || json.finish === true) {
                                break;
                            }
                        } catch (e) {
                            // 忽略解析错误
                        }
                    }
                }
            }

            cursorEl.style.display = 'none';
            aiState.fullContent = fullText;
            return fullText;

        } catch (error) {
            if (error.name === 'AbortError') {
                throw new Error('已取消');
            }
            throw error;
        }
    }

    // ----------------------------------------
    // 5.3 统一API调用接口
    // ----------------------------------------
    async function callAI(providerName, systemPrompt, userMessage) {
        const providerConfig = getProviderConfig(providerName);
        
        if (providerConfig.type === 'cozecode') {
            return callCozeCodeAPI(providerConfig, userMessage);
        } else if (providerConfig.type === 'coze') {
            return callCozeAPI(providerConfig, systemPrompt, userMessage);
        } else {
            // OpenAI兼容格式
            return callOpenAICompatibleAPI(providerConfig, systemPrompt, userMessage);
        }
    }

    // ----------------------------------------
    // 5.4 四级自动降级调用
    // ----------------------------------------
    async function callAIWithFallback(systemPrompt, userMessage) {
        const availableProviders = getAvailableProviders();
        console.log('[AI] 可用providers:', availableProviders.join(', '), '模式:', aiConfig.mode);
        
        // 尝试每个可用的provider
        for (const providerName of availableProviders) {
            try {
                aiState.currentProvider = providerName;
                showModeBadge(providerName);
                
                var providerLabel = (AI_PROVIDER_TEMPLATES[providerName] && AI_PROVIDER_TEMPLATES[providerName].name) || providerName;
                console.log('[AI] 尝试', providerName, '...');
                updateLoadingStatus('正在调用' + providerLabel + '...', 'AI模型正在思考，请耐心等待');
                const result = await callAI(providerName, systemPrompt, userMessage);
                console.log('[AI]', providerName, '成功, 返回长度:', (result && result.length) || 0);
                return result;
            } catch (error) {
                console.warn('[AI]', (AI_PROVIDER_TEMPLATES[providerName] && AI_PROVIDER_TEMPLATES[providerName].name) || providerName, '调用失败:', error.message);
                // 继续尝试下一个provider
                continue;
            }
        }
        
        // 所有API都失败了，返回null
        console.error('[AI] 所有provider均失败');
        return null;
    }

    // 本地字词讲解模板
    const LOCAL_WORD_TEMPLATES = {
        _default: {
            origin: (word) => `「${word.character}」是一个文言文中的${word.star >= 4 ? '高频' : '常用'}字。在古汉语中，它的本义与现代含义有所不同。`,
            usage: (word) => {
                const meanings = word.meaning || [];
                if (meanings.length === 0) return '这个字有多个义项，需要结合具体语境来判断。';
                let text = `「${word.character}」主要有以下几种用法：\n\n`;
                meanings.slice(0, 3).forEach((m, i) => {
                    const content = typeof m === 'string' ? m : (m.content || '');
                    text += `${i + 1}. **${content}**\n`;
                    if (m.example) {
                        text += `   例：${m.example}\n`;
                    }
                });
                return text;
            },
            memory: (word) => `记忆「${word.character}」这个字，可以联系它的字形和常见搭配来记忆。${word.star >= 4 ? '由于是高频字，建议通过多读多练来熟悉它的各种用法。' : '建议结合具体例句来记忆，印象会更深刻。'}`,
            exam: (word) => {
                const freq = word.frequency || 0;
                const star = word.star || 1;
                return `「${word.character}」在中考中出现频次${star >= 4 ? '很高' : star >= 3 ? '中等' : '较低'}，${star >= 4 ? '属于必须掌握的核心字词' : star >= 3 ? '建议重点掌握' : '了解即可'}。建议关注它的${word.meaning && word.meaning.length > 2 ? '多个义项辨析' : '基本用法'}。`;
            }
        },
        之: {
            origin: () => '「之」字最早见于商代甲骨文，字形像一只脚在地面上行走的样子，本义是"往、到...去"。后来假借为代词和助词，成为文言文中使用频率最高的字之一。',
            usage: () => `「之」的用法非常丰富，主要有：\n\n1. **代词**：代指人、事、物，相当于"他(们)、它(们)"\n   例：学而时习**之**（代指学过的知识）\n\n2. **结构助词**：相当于"的"\n   例：关关雎鸠，在河**之**洲\n\n3. **动词**：到...去\n   例：辍耕**之**垄上\n\n4. **取消句子独立性**：放在主谓之间\n   例：予独爱莲**之**出淤泥而不染`,
            memory: () => '记忆技巧："之"字就像一个"万能胶水"——可以指代东西（代词），可以连接（助词），还可以表示"去"（动词）。记住最常用的三种：代词、的、去。',
            exam: () => '中考考点：「之」是中考文言文最高频字，近5年出现超过50次。重点考查：①代词用法 ②结构助词"的" ③取消句子独立性。尤以第②③点最易混淆，务必结合语境判断。'
        },
        而: {
            origin: () => '「而」是象形字，本义是胡须。后来被假借为连词，成为文言文中最重要的连词之一，表示各种逻辑关系。',
            usage: () => `「而」主要作连词，连接词、短语或句子：\n\n1. **表并列**：又、并且\n   例：敏**而**好学\n\n2. **表承接**：然后、就\n   例：温故**而**知新\n\n3. **表转折**：但是、却\n   例：人不知**而**不愠\n\n4. **表修饰**：着、地\n   例：河曲智叟笑**而**止之\n\n5. **表递进**：而且\n   例：饮少辄醉，**而**年又最高`,
            memory: () => '记忆技巧："而"是"关系大师"——并列、承接、转折、修饰、递进，五种关系都能用。诀窍：看前后两个动作或状态的关系——同时发生是并列，先后发生是承接，反过来是转折。',
            exam: () => '中考考点：「而」的连词用法是必考内容，尤其"表转折"和"表修饰"最容易混淆。判断技巧：翻译成"但是"通顺就是转折，翻译成"地"通顺就是修饰。'
        },
        其: {
            origin: () => '「其」原本是簸箕的象形，后来假借为代词。在文言文中使用频率很高，主要作代词和语气词。',
            usage: () => `「其」的主要用法：\n\n1. **代词**：他(的)、它(的)、那、那些\n   例：择**其**善者而从之（他的）\n   例：**其**人视端容寂（那个）\n\n2. **表示推测、反问**：大概、难道\n   例：**其**真无马邪？（难道）\n   例：**其**必曰...（大概）\n\n3. **其中的**\n   例：**其**中往来种作`,
            memory: () => '记忆技巧："其"≈"他/那/难道"。绝大多数时候作代词，相当于"他的/它的/那个"。放在句首表示推测或反问时，翻译成"大概""难道"。',
            exam: () => '中考考点：「其」是高频虚词，重点考查代词用法。难点在于"其"在句首作语气词的情况，如"其真无马邪"（难道）和"其真不知马也"（大概）的区别。'
        },
        以: {
            origin: () => '「以」本义是"用、使用"，字形像人用手拿着东西。后来发展出丰富的虚词用法。',
            usage: () => `「以」的主要用法：\n\n1. **介词**：用、拿、把、凭、因为\n   例：**以**刀劈狼首（用）\n   例：不**以**物喜（因为）\n   例：策之不**以**其道（按照）\n\n2. **连词**：来、用来、以致\n   例：属予作文**以**记之（来）\n\n3. **动词**：认为\n   例：皆**以**美于徐公`,
            memory: () => '记忆技巧："以"最常用的意思是"用"——用工具、用原因、用方式。从"用"延伸出"因为、按照、来"等义。记住核心义"用"，其他义项都能推导。',
            exam: () => '中考考点：「以」是必考虚词，重点考查：①介词"用/凭借" ②介词"因为" ③连词"来"。其中"因为"和"来"最易混淆——看前后是因果关系还是目的关系。'
        },
        于: {
            origin: () => '「于」是象形字，像鸟儿落在树上，本义是"在"。作为介词，它是文言文中最灵活的介词之一。',
            usage: () => `「于」主要作介词，引出各种补语：\n\n1. **在、从、到**（地点时间）\n   例：生**于**忧患（在）\n   例：皆朝**于**齐（到）\n\n2. **对、对于、向**（对象）\n   例：不汲汲**于**富贵（对）\n\n3. **比**（比较）\n   例：贤**于**材人远矣（比）\n\n4. **被**（被动）\n   例：困**于**心（被）`,
            memory: () => '记忆技巧："于"是"位置介词之王"——在、从、到、对、比、被，都和"位置/方向"有关。翻译时看前后名词的关系：地点→在，方向→到/对，比较→比，被动→被。',
            exam: () => '中考考点：「于」的"比"和"被"是难点。判断方法：形容词+于=比（如"贤于"）；动词+于+动作发出者=被（如"困于心"）。'
        },
        为: {
            origin: () => '「为」本义是做、干，是一个动作性很强的字。从动词发展出介词用法，读wèi。',
            usage: () => `「为」有两个读音两种用法：\n\n1. **读wéi，动词**：做、成为、是\n   例：可以**为**师矣（做）\n   例：**为**人五（刻有）\n\n2. **读wèi，介词**：替、给、因为、为了\n   例：不足**为**外人道也（对、向）\n   例：**为**宫室之美（为了）\n\n3. **被动**：被\n   例：士卒多**为**用者（被）`,
            memory: () => '记忆技巧：wéi=做（动词），wèi=替/为了（介词）。读音不同，词性不同。一个小口诀："做事情读wéi，为别人读wèi"。',
            exam: () => '中考考点：「为」的多音多义是常考点。掌握两个读音对应的主要义项，结合语境判断词性——后面有名词宾语大多读wèi（介词）。'
        }
    };

    // 生成字词讲解（本地模板）
    function generateWordTemplate(word) {
        const char = word.character;
        const template = LOCAL_WORD_TEMPLATES[char] || LOCAL_WORD_TEMPLATES._default;
        
        let result = '';
        
        result += '### 📖 字源演变\n\n';
        result += typeof template.origin === 'function' ? template.origin(word) : template.origin;
        result += '\n\n';
        
        result += '### 🔍 用法辨析\n\n';
        result += typeof template.usage === 'function' ? template.usage(word) : template.usage;
        result += '\n\n';
        
        result += '### 💡 记忆技巧\n\n';
        result += typeof template.memory === 'function' ? template.memory(word) : template.memory;
        result += '\n\n';
        
        result += '### 📝 中考考点\n\n';
        result += typeof template.exam === 'function' ? template.exam(word) : template.exam;
        
        return result;
    }

    // 句子分析提示词
    function buildSentenceAnalysisPrompt(sentence, source) {
        return `请分析下面这句文言文：

句子：${sentence}
出处：${source || '未记载'}

请按以下格式分析：
### 📌 重点字词
句中2-3个重点字词的解释

### 🔗 句式结构
这是什么句式（判断句/倒装句/省略句/被动句/普通句等），结构特点是什么

### ✍️ 翻译思路
翻译这句话的步骤和技巧，关键字词如何处理

### 📚 背景知识
这句话的上下文背景或相关文化常识

要求：
- 用亲切的语气，适合中学生理解
- 总字数300-500字
- 用Markdown格式`;
    }

    // 错题解析提示词
    function buildWrongAnalysisPrompt(question, wrongOption) {
        return `请分析这道文言文词语解释题：

题目：${question.sentence}
目标词：${question.target_word}
正确答案：${question.answer}
用户错误选择：${wrongOption}

请按以下格式分析：
### ❌ 错在哪里
分析学生可能混淆的地方，为什么会选错

### 🧠 记忆技巧
怎么记住"${question.target_word}"的正确意思，有什么联想或口诀

### 📖 关联拓展
和这个词相关的其他用法或类似词语

要求：
- 语气温和，鼓励为主
- 实用的记忆方法
- 总字数200-300字
- 用Markdown格式`;
    }

    // 字词讲解提示词
    function buildWordExplainPrompt(word) {
        const meanings = Array.isArray(word.meaning) 
            ? word.meaning.map((m, i) => `${i+1}. ${typeof m === 'string' ? m : m.content}`).join('\n')
            : '';
        
        return `请深度讲解这个文言文字词：

字词：${word.character}
拼音：${word.pinyin || '未知'}
中考频次星级：${word.star || 1}星
已知义项：
${meanings}

请按以下格式讲解：
### 📖 字源演变
这个字的本义是什么，字形演变（可以提甲骨文/金文的样子）

### 🔍 用法辨析
详细讲解这个字的各种用法和义项，每个义项配一个典型例句

### 💡 记忆技巧
怎么记住这个字的多个意思，有什么巧妙的联想或方法

### 📝 中考考点
这个字在中考中的重要程度，常见考法，易错点

要求：
- 语气亲切，像一位资深语文老师
- 内容准确，对中学生有帮助
- 总字数400-600字
- 用Markdown格式`;
    }

    // 系统提示词
    const AI_SYSTEM_PROMPT = `你是一位资深的中学语文老师，专门教授文言文。

你的特点：
- 知识渊博，对文言文有深入研究
- 讲解生动有趣，善于用比喻和联想帮助学生记忆
- 语气温和亲切，像一位耐心的老师
- 内容准确，符合中考要求
- 善于总结规律和技巧`;

    // ========================================
    // 6. AI讲解入口函数
    // ========================================

    // 开始AI讲解（字词）
    async function startAIWordExplain(word) {
        if (!word) return;
        
        aiState.currentTopic = { type: 'word', data: word };
        
        openAIDrawer();
        resetAIContent();
        
        // 检查是否有可用的API
        const availableProviders = getAvailableProviders();
        
        if (availableProviders.length > 0) {
            showAIThinking();
            aiState.isGenerating = true;
            
            try {
                const prompt = buildWordExplainPrompt(word);
                const result = await callAIWithFallback(AI_SYSTEM_PROMPT, prompt);
                
                if (result) {
                    // API成功
                    aiState.fullContent = result;
                    onAIGenerationComplete();
                } else {
                    // 所有API都失败了，降级到本地模板
                    showModeBadge('template');
                    startTemplateWordExplain(word);
                }
            } catch (error) {
                console.warn('API调用失败:', error);
                if (error.message !== '已取消') {
                    // 降级到本地模板
                    showModeBadge('template');
                    startTemplateWordExplain(word);
                }
            }
        } else {
            // 没有可用API，直接使用本地模板
            showModeBadge('template');
            startTemplateWordExplain(word);
        }
    }

    // 本地模板讲解
    async function startTemplateWordExplain(word) {
        aiState.isGenerating = true;
        showAIThinking();
        
        await new Promise(r => setTimeout(r, 800));
        
        document.getElementById('ai-thinking').style.display = 'none';
        
        const content = generateWordTemplate(word);
        aiState.fullContent = content;
        
        await typewriterEffect(content, 10);
        onAIGenerationComplete();
    }

    // 生成完成后
    function onAIGenerationComplete() {
        aiState.isGenerating = false;
        document.getElementById('ai-btn-stop').style.display = 'none';
        document.getElementById('ai-btn-retry').style.display = 'flex';
        document.getElementById('ai-feedback').style.display = 'flex';
        document.getElementById('ai-cursor').style.display = 'none';
    }

    // 重新讲解
    function retryAIExplain() {
        if (!aiState.currentTopic) return;
        
        const topic = aiState.currentTopic;
        resetAIContent();
        
        if (topic.type === 'word') {
            startAIWordExplain(topic.data);
        } else if (topic.type === 'sentence') {
            startAISentenceAnalysis(topic.data.sentence, topic.data.source);
        } else if (topic.type === 'wrong') {
            startAIWrongAnalysis(topic.data.question, topic.data.wrongOption);
        }
    }

    // 开始AI讲解（句子）
    async function startAISentenceAnalysis(sentence, source) {
        aiState.currentTopic = { type: 'sentence', data: { sentence, source } };
        
        openAIDrawer();
        resetAIContent();
        
        const availableProviders = getAvailableProviders();
        
        if (availableProviders.length > 0) {
            showAIThinking();
            aiState.isGenerating = true;
            
            try {
                const prompt = buildSentenceAnalysisPrompt(sentence, source);
                const result = await callAIWithFallback(AI_SYSTEM_PROMPT, prompt);
                
                if (result) {
                    aiState.fullContent = result;
                    onAIGenerationComplete();
                } else {
                    showModeBadge('template');
                    startTemplateSentenceAnalysis(sentence, source);
                }
            } catch (error) {
                console.warn('API调用失败:', error);
                if (error.message !== '已取消') {
                    showModeBadge('template');
                    startTemplateSentenceAnalysis(sentence, source);
                }
            }
        } else {
            showModeBadge('template');
            startTemplateSentenceAnalysis(sentence, source);
        }
    }

    // 本地句子分析模板
    async function startTemplateSentenceAnalysis(sentence, source) {
        aiState.isGenerating = true;
        showAIThinking();
        
        await new Promise(r => setTimeout(r, 800));
        
        document.getElementById('ai-thinking').style.display = 'none';
        
        const content = `### 📌 重点字词\n\n这句话中的字词需要结合上下文理解。建议先划分句子节奏，再逐一分析关键字词的含义。\n\n### 🔗 句式结构\n\n这是一个典型的文言文句式。翻译时注意调整语序，使其符合现代汉语的表达习惯。\n\n### ✍️ 翻译思路\n\n1. 先找出句子的主语和谓语\n2. 确定每个字词的准确含义\n3. 调整语序，用通顺的现代汉语表达\n4. 检查是否符合原意\n\n### 📚 背景知识\n\n出自${source || '古典文献'}。阅读文言文时，了解背景知识有助于更好地理解文章含义。`;
        
        aiState.fullContent = content;
        await typewriterEffect(content, 10);
        onAIGenerationComplete();
    }

    // 开始AI错题解析
    async function startAIWrongAnalysis(question, wrongOption) {
        aiState.currentTopic = { type: 'wrong', data: { question, wrongOption } };
        
        openAIDrawer();
        resetAIContent();
        
        const availableProviders = getAvailableProviders();
        
        if (availableProviders.length > 0) {
            showAIThinking();
            aiState.isGenerating = true;
            
            try {
                const prompt = buildWrongAnalysisPrompt(question, wrongOption);
                const result = await callAIWithFallback(AI_SYSTEM_PROMPT, prompt);
                
                if (result) {
                    aiState.fullContent = result;
                    onAIGenerationComplete();
                } else {
                    showModeBadge('template');
                    startTemplateWrongAnalysis(question, wrongOption);
                }
            } catch (error) {
                console.warn('API调用失败:', error);
                if (error.message !== '已取消') {
                    showModeBadge('template');
                    startTemplateWrongAnalysis(question, wrongOption);
                }
            }
        } else {
            showModeBadge('template');
            startTemplateWrongAnalysis(question, wrongOption);
        }
    }

    // 本地错题解析模板
    async function startTemplateWrongAnalysis(question, wrongOption) {
        aiState.isGenerating = true;
        showAIThinking();
        
        await new Promise(r => setTimeout(r, 800));
        
        document.getElementById('ai-thinking').style.display = 'none';
        
        const content = `### ❌ 错在哪里\n\n你选择了「${wrongOption}」，正确答案是「${question.answer}」。这两个意思容易混淆，建议仔细对比它们在不同语境下的用法差异。\n\n### 🧠 记忆技巧\n\n建议把「${question.target_word}」的多个义项整理在一起，通过例句来记忆每个意思。可以用"组词法"，把字的意思和现代词语联系起来。\n\n### 📖 关联拓展\n\n「${question.target_word}」是文言文中的${question.difficulty >= 4 ? '难' : '常用'}字，建议复习它的其他常见义项，做到举一反三。`;
        
        aiState.fullContent = content;
        await typewriterEffect(content, 10);
        onAIGenerationComplete();
    }

    // 初始化设置页面
    // ========================================
    // 7. 设置页面
    // ========================================

    async function initSettingsPage() {
        await loadAIConfig();
        
        const modeCards = document.querySelectorAll('.ai-mode-card');
        const smartConfig = document.getElementById('ai-smart-config');
        const localTip = document.getElementById('ai-local-tip');
        const providerSelect = document.getElementById('ai-provider-select');
        const modeSelect = document.getElementById('ai-mode-select');
        const advancedToggle = document.getElementById('ai-advanced-toggle');
        const advancedContent = document.getElementById('ai-advanced-content');
        
        // 初始化：根据当前配置显示对应状态
        const isLocal = aiConfig.mode === 'templateOnly';
        const currentMode = isLocal ? 'local' : 'smart';
        
        modeCards.forEach(card => {
            if (card.dataset.mode === currentMode) {
                card.classList.add('active');
            }
        });
        
        if (!isLocal) {
            smartConfig.style.display = 'block';
        } else {
            localTip.style.display = 'block';
        }
        
        // 模式卡片点击事件
        modeCards.forEach(card => {
            card.addEventListener('click', function() {
                modeCards.forEach(c => c.classList.remove('active'));
                this.classList.add('active');
                
                const mode = this.dataset.mode;
                if (mode === 'smart') {
                    smartConfig.style.display = 'block';
                    localTip.style.display = 'none';
                } else {
                    smartConfig.style.display = 'none';
                    localTip.style.display = 'block';
                }
            });
        });
        
        // 服务商选择切换
        if (providerSelect) {
            const savedProvider = aiConfig.singleProvider || 'deepseek';
            providerSelect.value = savedProvider;
            showProviderConfig(savedProvider);
            
            providerSelect.addEventListener('change', function() {
                showProviderConfig(this.value);
            });
        }
        
        function showProviderConfig(provider) {
            document.querySelectorAll('.ai-provider-config').forEach(el => {
                el.style.display = 'none';
            });
            const configEl = document.getElementById('ai-config-' + provider);
            if (configEl) configEl.style.display = 'block';
        }
        
        // 高级设置折叠
        if (advancedToggle) {
            advancedToggle.addEventListener('click', function() {
                const isOpen = advancedContent.style.display !== 'none';
                advancedContent.style.display = isOpen ? 'none' : 'block';
                advancedToggle.querySelector('.toggle-arrow').style.transform = isOpen ? 'rotate(0deg)' : 'rotate(180deg)';
            });
        }
        
        // 加载各服务商配置
        fillConfigValues();
        
        function fillConfigValues() {
            // 扣子编程
            const cozecodeKey = document.getElementById('ai-cozecode-key');
            if (cozecodeKey) cozecodeKey.value = (aiConfig.providers.cozecode && aiConfig.providers.cozecode.apiKey) || '';
            
            const cozecodeDomain = document.getElementById('ai-cozecode-domain');
            if (cozecodeDomain) cozecodeDomain.value = (aiConfig.providers.cozecode && aiConfig.providers.cozecode.domain) || '';
            
            const cozecodeProject = document.getElementById('ai-cozecode-project-id');
            if (cozecodeProject) cozecodeProject.value = (aiConfig.providers.cozecode && aiConfig.providers.cozecode.projectId) || '';
            
            // DeepSeek
            const deepseekKey = document.getElementById('ai-deepseek-key');
            if (deepseekKey) deepseekKey.value = (aiConfig.providers.deepseek && aiConfig.providers.deepseek.apiKey) || '';
            
            // Token Dance
            const tokendanceKey = document.getElementById('ai-tokendance-key');
            if (tokendanceKey) tokendanceKey.value = (aiConfig.providers.tokendance && aiConfig.providers.tokendance.apiKey) || '';
            
            // 标准扣子
            const cozeKey = document.getElementById('ai-coze-key');
            if (cozeKey) cozeKey.value = (aiConfig.providers.coze && aiConfig.providers.coze.apiKey) || '';
            
            const cozeBot = document.getElementById('ai-coze-bot-id');
            if (cozeBot) cozeBot.value = (aiConfig.providers.coze && aiConfig.providers.coze.botId) || '';
            
            // 运行策略
            if (modeSelect) {
                modeSelect.value = aiConfig.mode === 'single' ? 'single' : 'auto';
            }
        }
        
        // 密码可见性切换
        document.querySelectorAll('.toggle-key-visibility').forEach(btn => {
            btn.addEventListener('click', function() {
                const targetId = this.dataset.target;
                const input = document.getElementById(targetId);
                if (input) {
                    if (input.type === 'password') {
                        input.type = 'text';
                        this.textContent = '🙈';
                    } else {
                        input.type = 'password';
                        this.textContent = '👁️';
                    }
                }
            });
        });
        
        // 保存按钮
        document.getElementById('ai-save-settings').addEventListener('click', function() {
            const activeCard = document.querySelector('.ai-mode-card.active');
            const selectedMode = activeCard ? activeCard.dataset.mode : 'smart';
            
            if (selectedMode === 'local') {
                aiConfig.mode = 'templateOnly';
            } else {
                const strategy = modeSelect ? modeSelect.value : 'auto';
                aiConfig.mode = strategy;
                aiConfig.singleProvider = providerSelect ? providerSelect.value : 'deepseek';
            }
            
            // 保存所有配置值
            saveAllProviderConfigs();
            saveAIConfig();
            showSettingsHint('✅ 设置已保存！', 'success');
        });
        
        // 本地模式按钮
        const saveLocalBtn = document.getElementById('ai-save-local');
        if (saveLocalBtn) {
            saveLocalBtn.addEventListener('click', function() {
                aiConfig.mode = 'templateOnly';
                saveAIConfig();
                showSettingsHint('✅ 已切换到本地模式！', 'success');
            });
        }
        
        function saveAllProviderConfigs() {
            // 扣子编程
            const cozecodeKey = document.getElementById('ai-cozecode-key');
            if (cozecodeKey) aiConfig.providers.cozecode.apiKey = cozecodeKey.value.trim();
            const cozecodeDomain = document.getElementById('ai-cozecode-domain');
            if (cozecodeDomain) aiConfig.providers.cozecode.domain = cozecodeDomain.value.trim();
            const cozecodeProject = document.getElementById('ai-cozecode-project-id');
            if (cozecodeProject) aiConfig.providers.cozecode.projectId = cozecodeProject.value.trim();
            aiConfig.providers.cozecode.enabled = !!(aiConfig.providers.cozecode.apiKey && aiConfig.providers.cozecode.domain);
            
            // 标准扣子
            const cozeKey = document.getElementById('ai-coze-key');
            if (cozeKey) aiConfig.providers.coze.apiKey = cozeKey.value.trim();
            const cozeBot = document.getElementById('ai-coze-bot-id');
            if (cozeBot) aiConfig.providers.coze.botId = cozeBot.value.trim();
            aiConfig.providers.coze.enabled = !!(aiConfig.providers.coze.apiKey && aiConfig.providers.coze.botId);
            
            // DeepSeek
            const deepseekKey = document.getElementById('ai-deepseek-key');
            if (deepseekKey) aiConfig.providers.deepseek.apiKey = deepseekKey.value.trim();
            aiConfig.providers.deepseek.enabled = !!aiConfig.providers.deepseek.apiKey;
            
            // Token Dance
            const tokendanceKey = document.getElementById('ai-tokendance-key');
            if (tokendanceKey) aiConfig.providers.tokendance.apiKey = tokendanceKey.value.trim();
            aiConfig.providers.tokendance.enabled = !!aiConfig.providers.tokendance.apiKey;
        }
        
        // 测试连接
        document.getElementById('ai-test-connection').addEventListener('click', async function() {
            const provider = providerSelect ? providerSelect.value : 'cozecode';
            const providerConfig = getProviderConfig(provider);
            
            if (!providerConfig || !providerConfig.apiKey) {
                showSettingsHint('❌ 请先配置API Token/Key', 'error');
                return;
            }
            
            const btn = this;
            btn.disabled = true;
            btn.textContent = '测试中...';
            
            try {
                let testUrl, testBody;
                
                if (providerConfig.type === 'cozecode') {
                    testUrl = `${providerConfig.baseUrl}/stream_run`;
                    testBody = {
                        content: {
                            query: {
                                prompt: [{ type: 'text', content: { text: '你好' } }]
                            }
                        },
                        type: 'query',
                        session_id: 'test_' + Date.now(),
                        project_id: providerConfig.projectId || 0
                    };
                } else if (providerConfig.type === 'coze') {
                    if (!providerConfig.botId) {
                        showSettingsHint('❌ 请先配置Bot ID', 'error');
                        btn.disabled = false;
                        btn.textContent = '测试连接';
                        return;
                    }
                    testUrl = `${providerConfig.baseUrl}${providerConfig.endpoint}`;
                    testBody = {
                        bot_id: providerConfig.botId,
                        user_id: 'test_user',
                        stream: false,
                        additional_messages: [{ role: 'user', content_type: 'text', content: '测试' }]
                    };
                } else {
                    testUrl = `${providerConfig.baseUrl}${providerConfig.endpoint}`;
                    testBody = {
                        model: providerConfig.model,
                        messages: [{ role: 'user', content: '测试连接' }],
                        max_tokens: 10,
                        stream: false
                    };
                }
                
                const response = await fetch(testUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${providerConfig.apiKey}`
                    },
                    body: JSON.stringify(testBody)
                });
                
                if (response.ok) {
                    showSettingsHint(`✅ ${(AI_PROVIDER_TEMPLATES[provider] && AI_PROVIDER_TEMPLATES[provider].name) || provider}连接成功！`, 'success');
                } else {
                    showSettingsHint(`❌ 连接失败: ${response.status}`, 'error');
                }
            } catch (error) {
                showSettingsHint(`❌ 连接失败: ${error.message}`, 'error');
            }
            
            btn.disabled = false;
            btn.textContent = '测试连接';
        });
        
        // AI抽屉里的"去设置"按钮
        const goSettingsBtn = document.getElementById('ai-go-settings');
        if (goSettingsBtn) {
            goSettingsBtn.addEventListener('click', function(e) {
                e.preventDefault();
                closeAIDrawer();
                switchPage('settings');
            });
        }
    }

    function showSettingsHint(text, type) {
        const hint = document.getElementById('settings-hint');
        hint.textContent = text;
        hint.className = 'settings-hint ' + type;
        
        if (type === 'success') {
            setTimeout(() => {
                hint.className = 'settings-hint';
            }, 3000);
        }
    }

    // 初始化AI模块
    async function initAI() {
        await loadAIConfig();
        
        document.getElementById('ai-drawer-close').addEventListener('click', closeAIDrawer);
        document.getElementById('ai-drawer-overlay').addEventListener('click', closeAIDrawer);
        
        document.getElementById('ai-btn-stop').addEventListener('click', stopAIGeneration);
        
        document.getElementById('ai-btn-retry').addEventListener('click', retryAIExplain);
        
        document.querySelectorAll('.feedback-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const feedback = this.dataset.feedback;
                saveFeedback(feedback);
                document.getElementById('ai-feedback').innerHTML = '<span style="color:var(--color-text-secondary);font-size:14px;">感谢你的反馈！</span>';
            });
        });
        
        const wordBtn = document.getElementById('ai-explain-word-btn');
        if (wordBtn) {
            wordBtn.addEventListener('click', function() {
                const char = document.getElementById('result-char').textContent;
                const word = wordsData.find(w => w.character === char);
                if (word) {
                    startAIWordExplain(word);
                }
            });
        }
        
        const sentenceBtn = document.getElementById('ai-analyze-sentence-btn');
        if (sentenceBtn) {
            sentenceBtn.addEventListener('click', function() {
                if (currentSentence) {
                    startAISentenceAnalysis(currentSentence.text, currentSentence.source);
                }
            });
        }
    }

    // 保存反馈
    function saveFeedback(type) {
        try {
            const feedbacks = JSON.parse(localStorage.getItem(AI_FEEDBACK_KEY) || '[]');
            feedbacks.push({
                type,
                topic: aiState.currentTopic,
                time: Date.now()
            });
            localStorage.setItem(AI_FEEDBACK_KEY, JSON.stringify(feedbacks));
        } catch (e) {
        }
    }

})();
