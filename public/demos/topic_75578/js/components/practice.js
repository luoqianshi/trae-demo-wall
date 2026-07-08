/**
 * 学智云学习平台 - 题库练习组件
 */

const PracticeComponent = {
    currentQuestionIndex: 0,
    questions: [],
    selectedAnswer: null,
    isSubmitted: false,
    timer: null,
    timeSpent: 0,
    selectedDifficulty: 'all',
    consecutiveWrongCount: 0,
    captchaRequired: false,
    currentCaptcha: '',
    wrongAnswersInSession: 0,

    /**
     * 渲染题库练习页面
     * @returns {string} HTML字符串
     */
    render() {
        const currentGrade = Storage.getCurrentGrade();
        const currentSubject = Storage.getCurrentSubject();

        this.questions = API.getQuestions({ 
            grade: currentGrade, 
            subject: currentSubject,
            difficulty: this.selectedDifficulty === 'all' ? null : parseInt(this.selectedDifficulty)
        });

        if (this.questions.length === 0) {
            return `
                <div class="no-data-container">
                    <i class="el-icon-document" style="font-size: 48px; color: var(--text-light);"></i>
                    <p>暂无相关题目</p>
                    <p>请选择其他年级或科目</p>
                </div>
            `;
        }

        return `
            <!-- 题目筛选器 -->
            <div class="question-filter">
                <div class="filter-row">
                    <span class="filter-label">科目：</span>
                    <div class="filter-options">
                        ${this.renderSubjectFilters()}
                    </div>
                </div>
                <div class="filter-row">
                    <span class="filter-label">难度：</span>
                    <div class="filter-options">
                        ${this.renderDifficultyFilters()}
                    </div>
                </div>
            </div>

            <!-- 验证码区域（需要时显示） -->
            ${this.captchaRequired ? this.renderCaptcha() : ''}

            <!-- 题目内容 -->
            <div class="question-card" id="questionCard">
                ${this.renderQuestion()}
            </div>
        `;
    },

    /**
     * 渲染学科筛选器
     * @returns {string} HTML字符串
     */
    renderSubjectFilters() {
        const currentGrade = Storage.getCurrentGrade();
        const currentSubject = Storage.getCurrentSubject();
        
        let subjects;
        if (currentGrade <= 6) {
            subjects = ['chinese', 'math', 'english', 'science'];
        } else {
            subjects = ['chinese', 'math', 'english', 'physics', 'chemistry', 'biology'];
        }

        return subjects.map(subject => `
            <button class="filter-option ${subject === currentSubject ? 'active' : ''}"
                    onclick="PracticeComponent.selectSubject('${subject}')">
                ${Helpers.getSubjectName(subject)}
            </button>
        `).join('');
    },

    /**
     * 渲染难度筛选器
     * @returns {string} HTML字符串
     */
    renderDifficultyFilters() {
        const difficulties = [
            { level: 'all', label: '全部' },
            { level: 1, label: '简单' },
            { level: 2, label: '较易' },
            { level: 3, label: '中等' },
            { level: 4, label: '较难' },
            { level: 5, label: '困难' }
        ];

        return difficulties.map(d => `
            <button class="filter-option ${d.level === this.selectedDifficulty ? 'active' : ''}" 
                    onclick="PracticeComponent.selectDifficulty('${d.level}')">
                ${d.label}
            </button>
        `).join('');
    },

    /**
     * 渲染验证码
     * @returns {string} HTML字符串
     */
    renderCaptcha() {
        this.currentCaptcha = Auth.generateCaptcha();
        return `
            <div class="captcha-section">
                <div class="captcha-container">
                    <label>验证码</label>
                    <div class="captcha-row">
                        <input type="text" id="captchaInput" placeholder="请输入验证码" maxlength="4">
                        <div class="captcha-code" onclick="PracticeComponent.refreshCaptcha()">${this.currentCaptcha}</div>
                        <button class="captcha-refresh" onclick="PracticeComponent.refreshCaptcha()">
                            <i class="el-icon-refresh"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    },

    /**
     * 刷新验证码
     */
    refreshCaptcha() {
        this.currentCaptcha = Auth.generateCaptcha();
        const captchaCode = document.querySelector('.captcha-code');
        if (captchaCode) {
            captchaCode.textContent = this.currentCaptcha;
        }
    },

    /**
     * 渲染当前题目
     * @returns {string} HTML字符串
     */
    renderQuestion() {
        const question = this.questions[this.currentQuestionIndex];

        if (!question) {
            return '<p class="no-data">题目加载失败</p>';
        }

        return `
            <div class="question-header">
                <div class="question-meta">
                    <span class="question-tag">${Helpers.getGradeName(question.grade)}</span>
                    <span class="question-tag">${Helpers.getSubjectName(question.subject)}</span>
                    <span class="question-tag">${question.knowledgePoint}</span>
                </div>
                <div class="question-difficulty">
                    <span class="difficulty-label">难度：</span>
                    ${Helpers.generateStarsHTML(question.difficulty)}
                </div>
            </div>

            <div class="question-content">
                ${question.content}
            </div>

            <div class="question-options" id="questionOptions">
                ${this.renderOptions(question.options)}
            </div>

            ${this.isSubmitted ? this.renderAnswerResult(question) : ''}

            <div class="question-footer">
                <div class="question-progress">
                    第 ${this.currentQuestionIndex + 1} / ${this.questions.length} 题
                </div>
                <div class="question-timer" id="questionTimer">
                    <i class="el-icon-time timer-icon"></i>
                    <span id="timerDisplay">00:00</span>
                </div>
                <div class="question-actions">
                    ${!this.isSubmitted ? `
                        <button class="action-btn submit-btn" onclick="PracticeComponent.submitAnswer()">提交答案</button>
                    ` : `
                        <button class="action-btn next-btn" onclick="PracticeComponent.nextQuestion()">下一题</button>
                        <button class="action-btn skip-btn" onclick="PracticeComponent.nextQuestion()">跳过</button>
                    `}
                </div>
            </div>
        `;
    },

    /**
     * 渲染选项
     * @param {array} options - 选项列表
     * @returns {string} HTML字符串
     */
    renderOptions(options) {
        return options.map(option => {
            const optionLetter = option.charAt(0);
            const isSelected = this.selectedAnswer === optionLetter;
            const isCorrect = this.isSubmitted && this.questions[this.currentQuestionIndex].answer === optionLetter;
            const isWrong = this.isSubmitted && isSelected && !isCorrect;

            return `
                <div class="option-item ${isSelected ? 'selected' : ''} ${isCorrect ? 'correct' : ''} ${isWrong ? 'wrong' : ''}"
                     onclick="PracticeComponent.selectOption('${optionLetter}')">
                    <div class="option-label">${optionLetter}</div>
                    <div class="option-text">${option.substring(2)}</div>
                </div>
            `;
        }).join('');
    },

    /**
     * 渲染答案结果
     * @param {object} question - 题目信息
     * @returns {string} HTML字符串
     */
    renderAnswerResult(question) {
        const correct = question.answer === this.selectedAnswer;

        return `
            <div class="answer-explanation">
                <div class="explanation-title">
                    <i class="el-icon ${correct ? 'el-icon-success' : 'el-icon-error'}"
                       style="color: ${correct ? 'var(--success-color)' : 'var(--error-color)'}"></i>
                    <span>${correct ? '回答正确！' : '回答错误'}</span>
                </div>
                <div class="correct-answer">
                    <i class="el-icon-check correct-icon"></i>
                    <span class="answer-text">正确答案：${question.answer}</span>
                </div>
                <div class="explanation-content">
                    ${question.explanation}
                </div>
            </div>
        `;
    },

    /**
     * 选择选项
     * @param {string} optionLetter - 选项字母
     */
    selectOption(optionLetter) {
        if (this.isSubmitted) return;

        this.selectedAnswer = optionLetter;
        const optionsContainer = document.getElementById('questionOptions');
        if (optionsContainer) {
            optionsContainer.innerHTML = this.renderOptions(this.questions[this.currentQuestionIndex].options);
        }
    },

    /**
     * 提交答案
     */
    submitAnswer() {
        if (!this.selectedAnswer) {
            Helpers.showMessage('请先选择答案', 'warning');
            return;
        }

        // 检查是否需要验证码
        if (this.captchaRequired) {
            const captchaInput = document.getElementById('captchaInput');
            if (!captchaInput || !captchaInput.value.trim()) {
                Helpers.showMessage('请输入验证码', 'warning');
                return;
            }
            if (!Auth.validateCaptcha(captchaInput.value)) {
                Helpers.showMessage('验证码错误', 'error');
                this.refreshCaptcha();
                captchaInput.value = '';
                return;
            }
            this.captchaRequired = false;
        }

        // 停止计时器
        this.stopTimer();

        // 获取当前题目
        const question = this.questions[this.currentQuestionIndex];

        // 提交答案到API
        const result = API.submitAnswer(question.id, this.selectedAnswer);

        if (result.success) {
            this.isSubmitted = true;

            // 检查是否答对
            if (result.correct) {
                this.consecutiveWrongCount = 0;
                Helpers.showMessage('回答正确！', 'success');
            } else {
                this.consecutiveWrongCount++;
                this.wrongAnswersInSession++;
                Helpers.showMessage('回答错误，正确答案：' + result.correctAnswer, 'warning');

                // 检查是否需要触发验证码（连续3次错误）
                if (this.consecutiveWrongCount >= 3) {
                    this.captchaRequired = true;
                    Helpers.showMessage('连续答题错误，请输入验证码继续', 'warning');
                }

                // 检查是否需要封禁（连续10次错误或会话内20次错误）
                if (this.consecutiveWrongCount >= 10 || this.wrongAnswersInSession >= 20) {
                    Helpers.showMessage('检测到异常答题行为，账号将被暂时封禁', 'error');
                    const user = Auth.getCurrentUser();
                    if (user) {
                        Auth.addToBlacklist(user.id, 30, '异常答题行为');
                    }
                    Auth.logout();
                    return;
                }
            }

            // 重新渲染题目卡片
            const questionCard = document.getElementById('questionCard');
            if (questionCard) {
                questionCard.innerHTML = this.renderQuestion();
            }
        }
    },

    /**
     * 下一题
     */
    nextQuestion() {
        this.currentQuestionIndex++;

        if (this.currentQuestionIndex >= this.questions.length) {
            Helpers.showMessage('已完成所有题目！', 'success');
            Router.navigate('report');
            return;
        }

        // 重置状态
        this.selectedAnswer = null;
        this.isSubmitted = false;
        this.timeSpent = 0;

        // 重新渲染题目
        const questionCard = document.getElementById('questionCard');
        if (questionCard) {
            questionCard.innerHTML = this.renderQuestion();
        }

        // 如果需要验证码，重新渲染验证码区域
        if (this.captchaRequired) {
            const captchaSection = document.querySelector('.captcha-section');
            if (captchaSection) {
                captchaSection.innerHTML = this.renderCaptcha();
            }
        }

        // 开始计时
        this.startTimer();

        // 滚动到顶部
        Helpers.scrollToTop();
    },

    /**
     * 选择学科
     * @param {string} subject - 学科名称
     */
    selectSubject(subject) {
        Storage.setCurrentSubject(subject);
        this.currentQuestionIndex = 0;
        this.selectedAnswer = null;
        this.isSubmitted = false;
        Router.refresh();
    },

    /**
     * 选择难度
     * @param {string} difficulty - 难度等级
     */
    selectDifficulty(difficulty) {
        this.selectedDifficulty = difficulty;
        this.currentQuestionIndex = 0;
        this.selectedAnswer = null;
        this.isSubmitted = false;
        Router.refresh();
    },

    /**
     * 开始计时器
     */
    startTimer() {
        this.timer = setInterval(() => {
            this.timeSpent++;
            const timerDisplay = document.getElementById('timerDisplay');
            if (timerDisplay) {
                timerDisplay.textContent = Helpers.formatTimer(this.timeSpent);
            }
        }, 1000);
    },

    /**
     * 停止计时器
     */
    stopTimer() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }
};

// 导出PracticeComponent对象
window.PracticeComponent = PracticeComponent;