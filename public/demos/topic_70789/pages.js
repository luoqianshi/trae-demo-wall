// ===== 页面渲染模块 =====

const Pages = {
    // 当前页面状态
    state: {
        currentPage: 'home',
        caseId: null,
        internalScores: {},
        bodySignals: {},
        isDemoMode: false,
        demoInstance: null
    },
    
    // 页面容器
    container: null,
    
    // 初始化页面模块
    init: function(containerId = 'page-container') {
        this.container = document.getElementById(containerId);
        if (!this.container) {
            console.error(`Page container not found: ${containerId}`);
            return;
        }
        
        this.renderHome();
    },
    
    // 渲染首页
    renderHome: function() {
        this.state.currentPage = 'home';
        const cases = Cases.getCaseList();
        
        const html = `
            <section class="hero-section animate-fade-in">
                <div class="navbar">
                    <div class="navbar-content">
                        <a href="#" class="logo" onclick="Pages.renderHome()">
                            <div class="logo-icon">DC</div>
                            <span class="logo-text">决策体检</span>
                        </a>
                        <nav>
                            <ul class="nav-links">
                                <li><a href="#features" onclick="Utils.scrollToElement('features')">功能介绍</a></li>
                                <li><a href="#cases" onclick="Utils.scrollToElement('cases')">案例演示</a></li>
                            </ul>
                        </nav>
                        <div class="nav-actions">
                            <button class="btn btn-outline btn-sm" onclick="Pages.renderCaseList()">开始体检</button>
                        </div>
                    </div>
                </div>
                
                <h1 class="hero-title">
                    先看到<span>谁在替你做决定</span>，<br>
                    再把决策主权拿回来
                </h1>
                <p class="hero-subtitle">
                    通过内外双校准机制，将外部环境评估与内在心理状态放在同一框架下对比，<br>
                    帮你定位决策卡点，识别真正阻碍你的"部分"。
                </p>
                
                <div class="hero-actions">
                    <button class="btn btn-primary btn-lg" onclick="Pages.renderCaseList()">开始体检</button>
                    <button class="btn btn-secondary btn-lg" onclick="Pages.renderDemoIntro()">观看演示</button>
                </div>
                
                <div class="hero-stats">
                    <div class="hero-stat">
                        <div class="hero-stat-value">4</div>
                        <div class="hero-stat-label">核心维度</div>
                    </div>
                    <div class="hero-stat">
                        <div class="hero-stat-value">3</div>
                        <div class="hero-stat-label">预置案例</div>
                    </div>
                    <div class="hero-stat">
                        <div class="hero-stat-value">5分钟</div>
                        <div class="hero-stat-label">快速体检</div>
                    </div>
                </div>
            </section>
            
            <section id="features" class="features-section animate-slide-left">
                <h2 class="section-title">核心功能</h2>
                <div class="features-grid">
                    <div class="feature-card">
                        <div class="feature-icon">📊</div>
                        <h3 class="feature-title">外部校准</h3>
                        <p class="feature-description">基于政策文件、行业报告和公开数据，对决策的外部环境进行客观评估</p>
                    </div>
                    <div class="feature-card">
                        <div class="feature-icon">🧠</div>
                        <h3 class="feature-title">内部自评</h3>
                        <p class="feature-description">通过科学的心理学量表，帮助你觉察自己的内在状态和身体信号</p>
                    </div>
                    <div class="feature-card">
                        <div class="feature-icon">🎯</div>
                        <h3 class="feature-title">卡点诊断</h3>
                        <p class="feature-description">对比内外评分，自动识别差距最大的维度，精准定位决策卡点</p>
                    </div>
                    <div class="feature-card">
                        <div class="feature-icon">📈</div>
                        <h3 class="feature-title">可视化报告</h3>
                        <p class="feature-description">雷达图、柱状图直观展示，让你清晰看到内外撕裂的具体位置</p>
                    </div>
                </div>
            </section>
            
            <section id="cases" class="features-section animate-slide-right">
                <h2 class="section-title">案例演示</h2>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: var(--spacing-lg);">
                    ${cases.map(caseItem => `
                        <div class="case-card ${caseItem.featured ? 'featured' : ''}" onclick="Pages.selectCase('${caseItem.id}')">
                            <div class="case-thumbnail" style="background: linear-gradient(135deg, ${caseItem.thumbnailColor}, ${caseItem.thumbnailColor}cc);">
                                <span class="case-icon">${caseItem.icon}</span>
                            </div>
                            <div class="case-content">
                                <h3 class="case-title">${caseItem.title}</h3>
                                <p class="case-summary">${caseItem.description}</p>
                                <div class="case-tags">
                                    ${caseItem.tags.map(tag => `<span class="case-tag">${tag}</span>`).join('')}
                                </div>
                                <button class="btn btn-primary btn-sm" style="margin-top: var(--spacing-md); width: 100%;">开始体验</button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </section>
        `;
        
        this.container.innerHTML = html;
    },
    
    // 渲染案例列表页
    renderCaseList: function() {
        this.state.currentPage = 'case-list';
        const cases = Cases.getCaseList();
        
        const html = `
            <div style="max-width: 1200px; margin: 0 auto;">
                <div style="margin-bottom: var(--spacing-xl);">
                    <button class="btn btn-outline" onclick="Pages.renderHome()">← 返回首页</button>
                </div>
                
                <h1 style="font-size: 2rem; font-weight: 700; color: var(--text-primary); margin-bottom: var(--spacing-lg);">
                    选择一个决策场景
                </h1>
                <p style="color: var(--text-secondary); margin-bottom: var(--spacing-xl);">
                    选择一个预置案例开始体验，或输入你自己的决策难题
                </p>
                
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: var(--spacing-lg);">
                    ${cases.map(caseItem => `
                        <div class="case-card ${caseItem.featured ? 'featured' : ''}" onclick="Pages.selectCase('${caseItem.id}')">
                            <div class="case-thumbnail" style="background: linear-gradient(135deg, ${caseItem.thumbnailColor}, ${caseItem.thumbnailColor}cc);">
                                <span class="case-icon">${caseItem.icon}</span>
                            </div>
                            <div class="case-content">
                                <h3 class="case-title">${caseItem.title}</h3>
                                <p class="case-summary">${caseItem.description}</p>
                                <div class="case-tags">
                                    ${caseItem.tags.map(tag => `<span class="case-tag">${tag}</span>`).join('')}
                                </div>
                                <button class="btn btn-primary btn-sm" style="margin-top: var(--spacing-md); width: 100%;">选择这个案例</button>
                            </div>
                        </div>
                    `).join('')}
                </div>
                
                <div class="card" style="margin-top: var(--spacing-xl);">
                    <div class="card-header">
                        <h3 class="card-title">自定义决策</h3>
                        <p class="card-subtitle">输入你正在纠结的决策难题</p>
                    </div>
                    <div class="card-body">
                        <div class="form-group">
                            <label class="form-label">决策描述</label>
                            <textarea class="form-textarea" id="custom-decision" placeholder="请简要描述你正在纠结的决策..."></textarea>
                        </div>
                        <button class="btn btn-secondary" onclick="Pages.startCustomDecision()">开始体检</button>
                    </div>
                </div>
            </div>
        `;
        
        this.container.innerHTML = html;
    },
    
    // 选择案例
    selectCase: function(caseId) {
        this.state.caseId = caseId;
        this.state.internalScores = {};
        this.state.bodySignals = {};
        this.state.isDemoMode = false;
        this.clearAssessmentData();
        
        this.renderExternalCalibration();
    },
    
    // 开始自定义决策
    startCustomDecision: function() {
        const customDecision = document.getElementById('custom-decision')?.value || '';
        if (!customDecision.trim()) {
            alert('请输入决策描述');
            return;
        }
        
        this.state.caseId = 'custom';
        this.state.internalScores = {};
        this.state.bodySignals = {};
        this.clearAssessmentData();
        
        this.renderExternalCalibration();
    },
    
    // 渲染外部校准页面
    renderExternalCalibration: function() {
        this.state.currentPage = 'external';
        const caseId = this.state.caseId;
        const caseInfo = caseId === 'custom' 
            ? { title: '自定义决策', description: '基于通用评估框架' }
            : Cases.getCaseById(caseId);
        
        const externalData = caseId === 'custom' 
            ? this.generateDefaultExternalData()
            : Cases.externalData[caseId];
        
        const dimensionOrder = Cases.getDimensionOrder();
        const totalScore = Diagnosis.calculateExternalTotal(externalData);
        
        const renderEvidence = (evidence) => {
            if (!evidence || evidence.length === 0) return '';
            return `
                <div style="margin-top: var(--spacing-md); padding-top: var(--spacing-md); border-top: 1px solid var(--border-light);">
                    <div style="font-size: 0.75rem; font-weight: 600; color: var(--text-muted); margin-bottom: var(--spacing-sm);">评估依据</div>
                    <ul style="margin: 0; padding-left: var(--spacing-md);">
                        ${evidence.map((item, idx) => `
                            <li style="font-size: 0.75rem; color: var(--text-secondary); margin-bottom: var(--spacing-xs);">
                                <span style="color: var(--tech-blue-primary);">•</span> ${item.content}
                                <span style="color: var(--text-muted); font-style: italic;">（数据来源：${item.source}）</span>
                            </li>
                        `).join('')}
                    </ul>
                </div>
            `;
        };
        
        const html = `
            <div style="max-width: 1400px; margin: 0 auto;">
                <div style="margin-bottom: var(--spacing-xl);">
                    <button class="btn btn-outline" onclick="Pages.renderCaseList()">← 返回案例列表</button>
                </div>
                
                <h1 style="font-size: 2rem; font-weight: 700; color: var(--text-primary); margin-bottom: var(--spacing-md);">
                    外部校准
                </h1>
                <p style="color: var(--text-secondary); margin-bottom: var(--spacing-xl);">
                    基于公开数据和政策文件，对"${caseInfo.title}"的外部环境进行客观评估
                </p>
                
                ${externalData.overallReport ? `
                    <div class="card" style="margin-bottom: var(--spacing-xl);">
                        <div class="card-header">
                            <h3 class="card-title">外部环境总体评估</h3>
                        </div>
                        <div class="card-body">
                            <div style="white-space: pre-line; line-height: 1.8; color: var(--text-secondary);">${externalData.overallReport}</div>
                        </div>
                    </div>
                ` : ''}
                
                <div class="card" style="margin-bottom: var(--spacing-lg);">
                    <div class="card-header">
                        <h3 class="card-title">四维度评分</h3>
                    </div>
                    <div class="card-body">
                        <div class="chart-container" id="external-bar-chart" style="height: 260px;"></div>
                    </div>
                </div>
                
                ${caseId === 'career-switch' && externalData.salaryData ? `
                    <div class="card" style="margin-bottom: var(--spacing-lg);">
                        <div class="card-header">
                            <h3 class="card-title">FDE岗位薪资对比</h3>
                            <p class="card-subtitle">不同公司FDE岗位月薪（单位：千元人民币，OpenAI为万美元）</p>
                        </div>
                        <div class="card-body">
                            <div class="chart-container" id="salary-comparison-chart" style="height: 260px;"></div>
                        </div>
                    </div>
                ` : ''}
                
                <div class="dimension-card-grid" style="display: grid; grid-template-columns: repeat(2, 1fr); gap: var(--spacing-md); margin-bottom: var(--spacing-lg);">
                    ${dimensionOrder.map(dim => {
                        const dimData = externalData[dim];
                        return `
                            <div class="dimension-card" style="border-left-color: ${Cases.getDimensionColor(dim)}; min-height: 100%;">
                                <div class="dimension-header">
                                    <span class="dimension-name">${Cases.dimensionNames[dim]}</span>
                                    <div class="score-display">
                                        <div class="score-circle external">${dimData.score}</div>
                                    </div>
                                </div>
                                <div class="dimension-body">
                                    <p style="font-size: 0.875rem; color: var(--text-muted); margin-bottom: var(--spacing-sm);">
                                        ${dimData.reliability} · ${dimData.coreJudgment}
                                    </p>
                                    <p class="dimension-description">${dimData.assessment}</p>
                                    ${renderEvidence(dimData.evidence)}
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
                
                <div class="card" style="text-align: center;">
                    <div class="card-body">
                        <div style="display: flex; align-items: center; justify-content: center; gap: var(--spacing-lg);">
                            <div>
                                <div class="score-circle external" style="width: 64px; height: 64px; font-size: 1.5rem;">${totalScore}</div>
                            </div>
                            <div style="text-align: left;">
                                <div style="font-size: 0.875rem; color: var(--text-muted);">外部校准总分</div>
                                <div style="font-size: 1.5rem; font-weight: 700; color: var(--text-primary);">${totalScore}/5</div>
                            </div>
                        </div>
                    </div>
                    <div class="card-footer">
                        <button class="btn btn-primary btn-lg" onclick="Pages.renderInternalAssessment()">下一步：内部自评</button>
                    </div>
                </div>
                
                <div style="margin-top: var(--spacing-xl); padding: var(--spacing-md); background: var(--bg-secondary); border-radius: var(--radius-md);">
                    <p style="font-size: 0.75rem; color: var(--text-muted); text-align: center;">
                        <strong>数据来源声明：</strong>以上外部校准数据基于公开政策文件、招聘信息和行业报告整理，仅供决策参考，不构成投资或职业建议。
                    </p>
                </div>
            </div>
        `;
        
        this.container.innerHTML = html;
        
        setTimeout(() => {
            if (window.Chart) {
                this.renderExternalCharts(externalData, caseId);
            }
        }, 100);
    },
    
    // 渲染外部校准图表
    renderExternalCharts: function(externalData, caseId) {
        const dimensionOrder = Cases.getDimensionOrder();
        const labels = dimensionOrder.map(dim => Cases.dimensionNames[dim]);
        const scores = dimensionOrder.map(dim => externalData[dim].score);
        
        if (document.getElementById('external-bar-chart')) {
            Charts.destroyChart('external-bar-chart');
            Charts.barCharts['external-bar-chart'] = new Chart(document.getElementById('external-bar-chart'), {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [{
                        label: '外部评分',
                        data: scores,
                        backgroundColor: dimensionOrder.map(dim => Cases.getDimensionColor(dim)),
                        borderColor: dimensionOrder.map(dim => Cases.getDimensionColor(dim)),
                        borderWidth: 1,
                        borderRadius: 6
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true,
                            max: 5,
                            ticks: { stepSize: 1 }
                        }
                    },
                    plugins: {
                        legend: { display: false }
                    }
                }
            });
        }
        
        if (caseId === 'career-switch' && externalData.salaryData && document.getElementById('salary-comparison-chart')) {
            const sd = externalData.salaryData;
            Charts.destroyChart('salary-comparison-chart');
            Charts.barCharts['salary-comparison-chart'] = new Chart(document.getElementById('salary-comparison-chart'), {
                type: 'bar',
                data: {
                    labels: sd.companies,
                    datasets: [{
                        label: '月薪（千元/万元）',
                        data: sd.monthlySalary,
                        backgroundColor: ['#137aa8', '#2199d4', '#0f7c4f', '#f3952f', '#ffc83a'],
                        borderColor: ['#137aa8', '#2199d4', '#0f7c4f', '#f3952f', '#ffc83a'],
                        borderWidth: 1,
                        borderRadius: 6
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    }
                }
            });
        }
    },
    
    // 生成默认外部数据（自定义决策用）
    generateDefaultExternalData: function() {
        return {
            overallReport: '由于你选择了自定义决策，系统无法提供预设的外部环境评估。请根据你对当前决策的了解，自行评估各维度的外部环境情况。',
            direction: { score: 3, reliability: '中可信', coreJudgment: '需要更多信息', assessment: '请根据你了解的信息进行判断。', evidence: [] },
            certainty: { score: 3, reliability: '中可信', coreJudgment: '信息不足', assessment: '请根据你掌握的信息进行判断。', evidence: [] },
            timing: { score: 3, reliability: '中可信', coreJudgment: '时机不确定', assessment: '请根据你的判断进行评估。', evidence: [] },
            cost: { score: 3, reliability: '中可信', coreJudgment: '代价不确定', assessment: '请根据你的情况进行评估。', evidence: [] },
            totalScore: 3
        };
    },
    
    // 渲染内部自评页面
    renderInternalAssessment: function() {
        this.state.currentPage = 'internal';
        this.loadAssessmentData();
        
        const caseInfo = this.state.caseId === 'custom' 
            ? { title: '自定义决策' }
            : Cases.getCaseById(this.state.caseId);
        
        const questions = Cases.questions;
        const dimensionOrder = Cases.getDimensionOrder();
        
        const html = `
            <div style="max-width: 800px; margin: 0 auto;">
                <div style="margin-bottom: var(--spacing-xl);">
                    <button class="btn btn-outline" onclick="Pages.renderExternalCalibration()">← 返回外部校准</button>
                </div>
                
                <div style="margin-bottom: var(--spacing-xl);">
                    <h1 class="page-title">${caseInfo.title}</h1>
                    <p class="page-subtitle">内部自评 · 探索你的内在感受</p>
                </div>
                
                <div class="card" style="margin-bottom: var(--spacing-xl);">
                    <div class="card-body">
                        <div style="font-size: 1.5rem; margin-bottom: var(--spacing-md); text-align: center;">🧘</div>
                        <h3 class="card-title" style="text-align: center; margin-bottom: var(--spacing-lg);">填写前必读</h3>
                        <div style="color: var(--text-secondary); line-height: 1.8;">
                            <p style="margin-bottom: var(--spacing-md);">在回答任何问题之前，先做一件事：</p>
                            <p style="margin-bottom: var(--spacing-md);"><strong>闭上眼睛</strong>，想象你已经做出了你正在纠结的那个决定——不是"想"这个决定，而是<strong>已经在做</strong>了。</p>
                            <ul style="margin-bottom: var(--spacing-md); padding-left: var(--spacing-lg);">
                                <li>如果是"要不要做副业" → 想象你已经开始了</li>
                                <li>如果是"要不要换城市" → 想象你已经在新城市安顿下来了</li>
                                <li>如果是"要不要转行AI" → 想象你已经入职了新岗位</li>
                            </ul>
                            <p style="margin-bottom: var(--spacing-md);">保持这个画面，感受一下你的身体此刻的状态：</p>
                            <blockquote style="border-left: 3px solid var(--tech-blue-primary); padding-left: var(--spacing-md); margin: var(--spacing-md) 0; color: var(--tech-blue-dark); font-style: italic;">
                                "哪个部位有感觉？是紧的，还是松的？是暖的，还是沉的？"
                            </blockquote>
                            <p><strong>不需要判断"对不对"</strong>，只需要留意"有什么"。然后带着这个身体印象回答下面的题目。</p>
                        </div>
                    </div>
                </div>
                
                <div style="margin-bottom: var(--spacing-lg);">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--spacing-sm);">
                        <span style="font-size: 0.875rem; color: var(--text-muted);">作答进度</span>
                        <div style="display: flex; align-items: center; gap: var(--spacing-sm);">
                            <span style="font-size: 0.875rem; font-weight: 600; color: var(--tech-blue-primary);" id="progress-text">0/4</span>
                            <span style="font-size: 0.75rem; color: var(--text-muted); opacity: 0; transition: opacity var(--transition-fast);" id="save-indicator">✓ 已保存</span>
                        </div>
                    </div>
                    <div style="height: 6px; background: var(--border-light); border-radius: var(--radius-full); overflow: hidden;">
                        <div style="height: 100%; background: linear-gradient(90deg, var(--tech-blue-primary), var(--secondary-blue)); border-radius: var(--radius-full); transition: width var(--transition-normal);" id="progress-bar"></div>
                    </div>
                    <div style="display: flex; gap: 4px; margin-top: var(--spacing-xs);">
                        ${dimensionOrder.map((dim) => `
                            <div style="flex: 1; height: 8px; border-radius: 4px; background: ${this.state.internalScores[dim] ? '#0f7c4f' : '#e5e7eb'}; transition: background 0.3s ease;" id="dimension-status-${dim}"></div>
                        `).join('')}
                    </div>
                </div>
                
                <form id="assessment-form" onsubmit="event.preventDefault(); Pages.submitAssessment();">
                    ${dimensionOrder.map((dim, index) => {
                        const question = questions[dim];
                        const isAnswered = !!this.state.internalScores[dim];
                        return `
                            <div class="card ${isAnswered ? 'completed' : ''}" style="margin-bottom: var(--spacing-lg);" id="card-${dim}">
                                <div class="card-header">
                                    <div style="display: flex; justify-content: space-between; align-items: center;">
                                        <div>
                                            <h4 style="font-weight: 600; color: var(--text-primary);">${index + 1}. ${question.dimension}</h4>
                                            <p style="font-size: 0.875rem; color: var(--text-muted);">${question.coreQuestion}</p>
                                        </div>
                                        <div style="display: flex; align-items: center; gap: var(--spacing-sm);">
                                            <span style="padding: var(--spacing-xs) var(--spacing-sm); background: ${Cases.getDimensionColor(dim)}20; color: ${Cases.getDimensionColor(dim)}; border-radius: var(--radius-full); font-size: 0.75rem; font-weight: 600;">
                                                ${question.dimension}
                                            </span>
                                            ${isAnswered ? '<span style="color: #0f7c4f; font-size: 1rem;">✓</span>' : ''}
                                        </div>
                                    </div>
                                </div>
                                <div class="card-body">
                                    <p style="margin-bottom: var(--spacing-lg); font-size: 1rem; color: var(--text-primary); font-weight: 500;">${question.question}</p>
                                    
                                    <div class="rating-selector" style="margin-bottom: var(--spacing-xl);">
                                        ${Utils.range(1, 5).map(score => `
                                            <label class="rating-option" for="radio-${dim}-${score}">
                                                <input type="radio" id="radio-${dim}-${score}" name="${dim}" value="${score}" onchange="Pages.handleRatingChange('${dim}', ${score})">
                                                <div class="rating-dot" id="rating-${dim}-${score}">${score}</div>
                                                <div class="rating-label">${score}</div>
                                            </label>
                                        `).join('')}
                                    </div>
                                    
                                    <div style="margin-bottom: var(--spacing-lg); padding: var(--spacing-md); background: var(--bg-secondary); border-radius: var(--radius-md);">
                                        <table style="width: 100%; font-size: 0.75rem; border-collapse: collapse;">
                                            <thead>
                                                <tr style="border-bottom: 1px solid var(--border-light);">
                                                    ${Utils.range(1, 5).map(score => `<th style="padding: var(--spacing-sm); text-align: center; color: var(--text-muted);">${score}</th>`).join('')}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                <tr>
                                                    ${Utils.range(1, 5).map(score => `<td style="padding: var(--spacing-sm); text-align: center; color: var(--text-secondary); line-height: 1.4;">${question.scaleDescriptions[score]}</td>`).join('')}
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                    
                                    ${question.note ? `<p style="font-size: 0.75rem; color: var(--text-muted); margin-bottom: var(--spacing-md); padding-left: var(--spacing-md); border-left: 2px solid var(--border-medium);">${question.note}</p>` : ''}
                                    
                                    <div class="form-group">
                                        <label class="form-label" style="font-weight: 400;">身体感受（选填）</label>
                                        <input type="text" class="form-input" id="body-${dim}" placeholder="${question.bodyPrompt}" maxlength="100" oninput="Pages.handleBodySignalChange('${dim}', this.value)">
                                    </div>
                                </div>
                            </div>
                        `;
                    }).join('')}
                    
                    <button type="submit" class="btn btn-primary btn-lg" style="width: 100%; margin-top: var(--spacing-xl);" id="submit-btn" disabled>
                        请完成所有题目
                    </button>
                </form>
                
                <div style="margin-top: var(--spacing-xl); text-align: center; color: var(--text-muted); font-size: 0.75rem;">
                    <p>您的答案会自动保存，页面刷新后数据不会丢失</p>
                </div>
            </div>
        `;
        
        this.container.innerHTML = html;
        
        dimensionOrder.forEach(dim => {
            if (this.state.internalScores[dim]) {
                const radioInput = document.getElementById(`radio-${dim}-${this.state.internalScores[dim]}`);
                if (radioInput) {
                    radioInput.checked = true;
                }
                this.updateCardState(dim, true);
            }
            
            const bodyInput = document.getElementById(`body-${dim}`);
            if (bodyInput && this.state.bodySignals[dim]) {
                bodyInput.value = this.state.bodySignals[dim];
            }
        });
        
        this.startAutoSave();
        this.updateProgress();
        this.updateSubmitButton();
    },
    
    // 处理评分变化（替代旧的selectRating）
    handleRatingChange: function(dimension, score) {
        this.state.internalScores[dimension] = score;
        
        Utils.range(1, 5).forEach(s => {
            const dot = document.getElementById(`rating-${dimension}-${s}`);
            if (dot) {
                dot.parentElement.classList.toggle('selected', s === score);
            }
        });
        
        this.updateCardState(dimension, true);
        this.updateProgress();
        this.updateSubmitButton();
        this.saveAssessmentData(true);
    },
    
    // 处理身体感受变化
    handleBodySignalChange: function(dimension, value) {
        this.state.bodySignals[dimension] = value;
        this.scheduleSave();
    },
    
    // 更新卡片状态
    updateCardState: function(dimension, completed) {
        const card = document.getElementById(`card-${dimension}`);
        const statusIndicator = document.getElementById(`dimension-status-${dimension}`);
        
        if (card) {
            card.classList.toggle('completed', completed);
        }
        
        if (statusIndicator) {
            statusIndicator.style.background = completed ? '#0f7c4f' : '#e5e7eb';
        }
    },
    
    // 防抖保存（减少频繁保存操作）
    scheduleSave: function() {
        if (this.saveTimeout) {
            clearTimeout(this.saveTimeout);
        }
        this.saveTimeout = setTimeout(() => {
            this.saveAssessmentData(true);
        }, 300);
    },
    
    // 定时自动保存（每30秒）
    startAutoSave: function() {
        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
        }
        this.autoSaveInterval = setInterval(() => {
            const hasData = Object.keys(this.state.internalScores).length > 0 || 
                           Object.keys(this.state.bodySignals).length > 0;
            if (hasData) {
                this.saveAssessmentData();
            }
        }, 30000);
    },
    
    // 停止自动保存
    stopAutoSave: function() {
        if (this.saveTimeout) {
            clearTimeout(this.saveTimeout);
        }
        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
        }
    },
    
    // 保存评估数据到 localStorage
    saveAssessmentData: function(showFeedback = false) {
        try {
            const data = {
                caseId: this.state.caseId,
                internalScores: this.state.internalScores,
                bodySignals: this.state.bodySignals,
                timestamp: Date.now()
            };
            localStorage.setItem('decision-checkup-assessment', JSON.stringify(data));
            
            if (showFeedback) {
                this.showSaveIndicator(true);
            }
            
            this.lastSaveTime = Date.now();
            return { success: true };
        } catch (e) {
            console.error('Failed to save assessment data to localStorage:', e);
            
            if (showFeedback) {
                this.showSaveIndicator(false);
            }
            
            if (e.name === 'QuotaExceededError') {
                this.showNotification('存储空间不足，部分数据可能无法保存', 'warning');
            } else {
                this.showNotification('数据保存失败，请稍后重试', 'error');
            }
            
            return { success: false, error: e };
        }
    },
    
    // 显示保存状态指示器
    showSaveIndicator: function(success) {
        const indicator = document.getElementById('save-indicator');
        if (indicator) {
            indicator.textContent = success ? '✓ 已保存' : '✗ 保存失败';
            indicator.style.color = success ? '#0f7c4f' : '#e53e3e';
            indicator.style.opacity = '1';
            
            setTimeout(() => {
                indicator.style.opacity = '0';
            }, 2000);
        }
    },
    
    // 显示通知
    showNotification: function(message, type = 'info') {
        const notification = document.createElement('div');
        const colors = {
            info: '#137aa8',
            warning: '#f3952f',
            error: '#e53e3e',
            success: '#0f7c4f'
        };
        
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            background: ${colors[type]};
            color: white;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 1000;
            animation: slideInRight 0.3s ease;
            max-width: 400px;
            font-size: 14px;
        `;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideInRight 0.3s ease reverse';
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 4000);
    },
    
    // 从 localStorage 加载评估数据
    loadAssessmentData: function() {
        try {
            const saved = localStorage.getItem('decision-checkup-assessment');
            if (saved) {
                const data = JSON.parse(saved);
                if (data.caseId === this.state.caseId) {
                    this.state.internalScores = data.internalScores || {};
                    this.state.bodySignals = data.bodySignals || {};
                }
            }
        } catch (e) {
            console.warn('Failed to load assessment data from localStorage:', e);
        }
    },
    
    // 更新进度指示
    updateProgress: function() {
        const dimensionOrder = Cases.getDimensionOrder();
        const answeredCount = dimensionOrder.filter(dim => this.state.internalScores[dim]).length;
        const totalCount = dimensionOrder.length;
        
        const progressText = document.getElementById('progress-text');
        const progressBar = document.getElementById('progress-bar');
        
        if (progressText) {
            progressText.textContent = `${answeredCount}/${totalCount}`;
        }
        
        if (progressBar) {
            const percentage = (answeredCount / totalCount) * 100;
            progressBar.style.width = `${percentage}%`;
        }
    },
    
    // 更新提交按钮状态
    updateSubmitButton: function() {
        const submitBtn = document.getElementById('submit-btn');
        const validation = Diagnosis.validateInternalScores(this.state.internalScores);
        
        if (submitBtn) {
            submitBtn.disabled = !validation.isValid;
            submitBtn.textContent = validation.isValid ? '提交并生成报告' : '请完成所有题目';
        }
    },
    
    // 提交评估
    submitAssessment: function() {
        const validation = Diagnosis.validateInternalScores(this.state.internalScores);
        if (!validation.isValid) {
            alert(`请完成所有题目后再提交（还剩${validation.missing.length}题）`);
            return;
        }
        
        const dimensionOrder = Cases.getDimensionOrder();
        dimensionOrder.forEach(dim => {
            const bodyInput = document.getElementById(`body-${dim}`);
            if (bodyInput) {
                this.state.bodySignals[dim] = bodyInput.value;
            }
        });
        
        this.stopAutoSave();
        this.saveAssessmentData(true);
        
        this.renderReport();
        this.clearAssessmentData();
    },
    
    // 清除评估数据
    clearAssessmentData: function() {
        try {
            localStorage.removeItem('decision-checkup-assessment');
        } catch (e) {
            console.warn('Failed to clear assessment data:', e);
        }
    },
    
    // 渲染报告页面
    renderReport: function() {
        this.state.currentPage = 'report';
        const caseId = this.state.caseId;
        const caseInfo = caseId === 'custom' 
            ? { title: '自定义决策' }
            : Cases.getCaseById(caseId);
        
        const externalData = caseId === 'custom' 
            ? this.generateDefaultExternalData()
            : Cases.externalData[caseId];
        
        const internalScores = this.state.internalScores;
        const report = Diagnosis.generateFullReport(caseId, externalData, internalScores);
        const formattedReport = Diagnosis.formatDiagnosisResult(report);
        const maxGapDimension = formattedReport.maxGapDimension;
        
        const html = `
            <div style="max-width: 1200px; margin: 0 auto;">
                <div style="margin-bottom: var(--spacing-xl);">
                    <button class="btn btn-outline" onclick="Pages.renderInternalAssessment()">← 返回自评</button>
                </div>
                
                <h1 style="font-size: 2rem; font-weight: 700; color: var(--text-primary); margin-bottom: var(--spacing-md);">
                    决策体检报告
                </h1>
                <p style="color: var(--text-secondary); margin-bottom: var(--spacing-xl);">
                    决策：${caseInfo.title}
                </p>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--spacing-lg); margin-bottom: var(--spacing-xl);">
                    <div class="card">
                        <div class="card-header">
                            <h3 class="card-title">外部评估总分</h3>
                        </div>
                        <div class="card-body" style="text-align: center;">
                            <div class="score-circle external" style="width: 80px; height: 80px; font-size: 2rem; margin: 0 auto;">${report.externalTotal}</div>
                            <div style="margin-top: var(--spacing-md); color: var(--text-muted);">外部环境评估</div>
                        </div>
                    </div>
                    
                    <div class="card">
                        <div class="card-header">
                            <h3 class="card-title">内在感受总分</h3>
                        </div>
                        <div class="card-body" style="text-align: center;">
                            <div class="score-circle internal" style="width: 80px; height: 80px; font-size: 2rem; margin: 0 auto;">${report.internalTotal}</div>
                            <div style="margin-top: var(--spacing-md); color: var(--text-muted);">自我心理状态</div>
                        </div>
                    </div>
                </div>
                
                <div class="card" style="margin-bottom: var(--spacing-lg);">
                    <div class="card-header">
                        <h3 class="card-title">内外对比柱状图</h3>
                        <p class="card-subtitle">${maxGapDimension ? `红色高亮：差距最大的维度（${Cases.dimensionNames[maxGapDimension]}）` : '所有维度差距均在正常范围'}</p>
                    </div>
                    <div class="card-body">
                        <div class="chart-container" id="bar-chart"></div>
                    </div>
                </div>
                
                <div class="diagnosis-card" style="margin-bottom: var(--spacing-lg);">
                    <div class="diagnosis-header">
                        <div class="diagnosis-icon">💡</div>
                        <div>
                            <h3 class="diagnosis-title">卡点诊断</h3>
                            ${maxGapDimension ? `
                                <span class="gap-indicator ${report.diagnosis.gapLevel === 'high' ? 'high' : report.diagnosis.gapLevel === 'medium' ? 'medium' : 'low'}">
                                    ${Diagnosis.getGapLabel(report.diagnosis.gapType)} · 差距 ${report.diagnosis.maxGapValue.toFixed(1)}
                                </span>
                            ` : ''}
                        </div>
                    </div>
                    <p class="diagnosis-text">${report.diagnosis.diagnosis}</p>
                </div>
                
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">各维度详细差距</h3>
                    </div>
                    <div class="card-body">
                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: var(--spacing-md);">
                            ${formattedReport.gaps.map(gap => `
                                <div class="dimension-card ${gap.gapLevel === 'high' ? 'gap-high' : ''}">
                                    <div class="dimension-header">
                                        <span class="dimension-name">${gap.dimensionName}</span>
                                        <span class="gap-indicator ${gap.gapLevel === 'high' ? 'high' : gap.gapLevel === 'medium' ? 'medium' : 'low'}">
                                            ${gap.gap > 0 ? '+' : ''}${gap.gap.toFixed(1)}
                                        </span>
                                    </div>
                                    <div style="display: flex; gap: var(--spacing-md); margin: var(--spacing-sm) 0;">
                                        <div class="score-display">
                                            <div class="score-circle external" style="width: 36px; height: 36px; font-size: 0.875rem;">${gap.external}</div>
                                            <div style="font-size: 0.625rem; color: var(--text-muted); text-align: center;">外部</div>
                                        </div>
                                        <div class="score-display">
                                            <div class="score-circle internal" style="width: 36px; height: 36px; font-size: 0.875rem;">${gap.internal}</div>
                                            <div style="font-size: 0.625rem; color: var(--text-muted); text-align: center;">内部</div>
                                        </div>
                                    </div>
                                    <div style="font-size: 0.75rem; color: var(--text-muted);">${Diagnosis.getGapDescription(gap.gapType)}</div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
                
                <div class="card" style="margin-top: var(--spacing-lg); text-align: center;">
                    <div class="card-body">
                        <p style="color: var(--text-secondary); margin-bottom: var(--spacing-md);">扫码获取完整报告及内测资格</p>
                        <div style="width: 160px; height: 160px; background: var(--bg-secondary); border-radius: var(--radius-lg); margin: 0 auto; display: flex; align-items: center; justify-content: center; font-size: 3rem;">📱</div>
                    </div>
                    <div class="card-footer">
                        <button class="btn btn-primary btn-lg" onclick="Pages.renderCaseList()">重新体检</button>
                    </div>
                </div>
                
                <div style="margin-top: var(--spacing-lg); padding: var(--spacing-md); background: var(--bg-secondary); border-radius: var(--radius-md);">
                    <p style="font-size: 0.75rem; color: var(--text-muted); text-align: center; line-height: 1.6;">
                        <strong>工具定位声明：</strong>本自评模块是"决策体检"产品活动现场的交互演示工具，用于帮助用户观察自己在特定决策场景下的内在状态。它不提供任何诊断性结论，不替代专业心理咨询或评估。如需获得标准化的量表分数，请使用未经改动的完整原版量表在标准化条件下施测。
                    </p>
                </div>
            </div>
        `;
        
        this.container.innerHTML = html;
        
        setTimeout(() => {
            Charts.safeRenderBarChart('bar-chart', externalData, internalScores, maxGapDimension);
        }, 100);
    },
    
    // 渲染演示模式介绍页
    renderDemoIntro: function() {
        this.state.currentPage = 'demo-intro';
        const cases = Cases.getCaseList();
        
        const html = `
            <div style="max-width: 800px; margin: 0 auto;">
                <div style="margin-bottom: var(--spacing-xl);">
                    <button class="btn btn-outline" onclick="Pages.renderHome()">← 返回首页</button>
                </div>
                
                <h1 style="font-size: 2rem; font-weight: 700; color: var(--text-primary); margin-bottom: var(--spacing-md);">
                    观看演示
                </h1>
                <p style="color: var(--text-secondary); margin-bottom: var(--spacing-xl);">
                    选择一个案例，系统将自动演示完整的决策体检流程
                </p>
                
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: var(--spacing-lg);">
                    ${cases.map(caseItem => `
                        <div class="case-card ${caseItem.featured ? 'featured' : ''}" onclick="Pages.startDemo('${caseItem.id}')">
                            <div class="case-thumbnail" style="background: linear-gradient(135deg, ${caseItem.thumbnailColor}, ${caseItem.thumbnailColor}cc);">
                                <span class="case-icon">${caseItem.icon}</span>
                            </div>
                            <div class="case-content">
                                <h3 class="case-title">${caseItem.title}</h3>
                                <p class="case-summary">${caseItem.description}</p>
                                <div class="case-tags">
                                    ${caseItem.tags.map(tag => `<span class="case-tag">${tag}</span>`).join('')}
                                </div>
                                <button class="btn btn-primary btn-sm" style="margin-top: var(--spacing-md); width: 100%;">开始演示</button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        
        this.container.innerHTML = html;
    },
    
    // 开始演示模式
    startDemo: function(caseId) {
        this.state.isDemoMode = true;
        this.state.caseId = caseId;
        
        Demo.init(caseId, {
            speed: 1,
            onStepChange: (stepInfo) => {
                this.handleDemoStepChange(stepInfo);
            },
            onPlayStateChange: (isPlaying) => {
                this.handleDemoPlayStateChange(isPlaying);
            }
        });
        
        this.renderDemoPlayer();
        Demo.play();
    },
    
    // 渲染演示播放器
    renderDemoPlayer: function() {
        const caseInfo = Cases.getCaseById(this.state.caseId);
        
        const html = `
            <div style="max-width: 1200px; margin: 0 auto;">
                <div style="margin-bottom: var(--spacing-xl);">
                    <button class="btn btn-outline" onclick="Pages.stopDemo()">← 退出演示</button>
                </div>
                
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--spacing-lg);">
                    <h1 style="font-size: 1.75rem; font-weight: 700; color: var(--text-primary);">
                        演示：${caseInfo.title}
                    </h1>
                    <div class="speed-control">
                        <button class="speed-btn ${Demo.getConfig().speed === 0.5 ? 'active' : ''}" onclick="Demo.setSpeed(0.5)">0.5x</button>
                        <button class="speed-btn ${Demo.getConfig().speed === 1 ? 'active' : ''}" onclick="Demo.setSpeed(1)">1x</button>
                        <button class="speed-btn ${Demo.getConfig().speed === 2 ? 'active' : ''}" onclick="Demo.setSpeed(2)">2x</button>
                    </div>
                </div>
                
                <div class="demo-controls">
                    <button class="demo-btn" onclick="Demo.stepBackward()" id="demo-prev" title="上一步">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="15 18 9 12 15 6"></polyline>
                        </svg>
                    </button>
                    <button class="demo-btn" onclick="Demo.isPlaying ? Demo.pause() : Demo.play()" id="demo-play">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" id="play-icon">
                            <polygon points="5 3 19 12 5 21 5 3"></polygon>
                        </svg>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" id="pause-icon" style="display: none;">
                            <rect x="6" y="4" width="4" height="16"></rect>
                            <rect x="14" y="4" width="4" height="16"></rect>
                        </svg>
                    </button>
                    <button class="demo-btn" onclick="Demo.stepForward()" id="demo-next" title="下一步">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="9 18 15 12 9 6"></polyline>
                        </svg>
                    </button>
                    <div class="progress-bar">
                        <div class="progress-fill" id="demo-progress"></div>
                    </div>
                </div>
                
                <div id="demo-content" class="animate-fade-in"></div>
                
                <div style="display: flex; justify-content: center; gap: var(--spacing-sm); margin-top: var(--spacing-xl);">
                    ${Demo.getSteps().map((step, index) => `
                        <div style="width: 12px; height: 12px; border-radius: 50%; background: ${step.isCurrent ? '#137aa8' : step.isPast ? '#cbd5e0' : '#e2e8f0'}; cursor: pointer;" onclick="Demo.goToStep(${index})"></div>
                    `).join('')}
                </div>
            </div>
        `;
        
        this.container.innerHTML = html;
    },
    
    // 处理演示步骤变化
    handleDemoStepChange: function(stepInfo) {
        const { index, step, progress, isPlaying } = stepInfo;
        
        const progressBar = document.getElementById('demo-progress');
        if (progressBar) {
            progressBar.style.width = `${progress}%`;
        }
        
        const playIcon = document.getElementById('play-icon');
        const pauseIcon = document.getElementById('pause-icon');
        if (playIcon && pauseIcon) {
            playIcon.style.display = isPlaying ? 'none' : 'block';
            pauseIcon.style.display = isPlaying ? 'block' : 'none';
        }
        
        const prevBtn = document.getElementById('demo-prev');
        const nextBtn = document.getElementById('demo-next');
        if (prevBtn) prevBtn.disabled = Demo.isFirstStep();
        if (nextBtn) nextBtn.disabled = Demo.isLastStep();
        
        this.renderDemoStepContent(step);
    },
    
    // 处理演示播放状态变化
    handleDemoPlayStateChange: function(isPlaying) {
        const playIcon = document.getElementById('play-icon');
        const pauseIcon = document.getElementById('pause-icon');
        if (playIcon && pauseIcon) {
            playIcon.style.display = isPlaying ? 'none' : 'block';
            pauseIcon.style.display = isPlaying ? 'block' : 'none';
        }
    },
    
    // 渲染演示步骤内容
    renderDemoStepContent: function(step) {
        const contentContainer = document.getElementById('demo-content');
        if (!contentContainer || !step) return;
        
        const caseId = this.state.caseId;
        const externalData = Cases.externalData[caseId];
        const demoScores = Demo.getDemoScores(caseId);
        
        let html = '';
        let animationType = 'fadeIn';
        
        switch (step.type) {
            case Demo.STEP_TYPES.INTRO:
                html = `
                    <div class="card" style="text-align: center; padding: var(--spacing-2xl);" id="demo-intro-card">
                        <div style="font-size: 4rem; margin-bottom: var(--spacing-lg); opacity: 0; transform: translateY(20px);" id="demo-intro-icon">🎯</div>
                        <h2 class="card-title" style="font-size: 1.5rem; opacity: 0; transform: translateY(20px);" id="demo-intro-title">${step.title}</h2>
                        <p style="color: var(--text-secondary); margin-top: var(--spacing-md); opacity: 0; transform: translateY(20px);" id="demo-intro-desc">${step.description}</p>
                        <p style="color: var(--text-muted); margin-top: var(--spacing-lg); opacity: 0; transform: translateY(20px);" id="demo-intro-case">案例：${Cases.getCaseById(caseId).title}</p>
                    </div>
                `;
                break;
                
            case Demo.STEP_TYPES.EXTERNAL:
                html = `
                    <div>
                        <div class="card" style="margin-bottom: var(--spacing-lg);" id="demo-external-header">
                            <div class="card-header">
                                <h2 class="card-title" style="opacity: 0; transform: translateX(-20px);">${step.title}</h2>
                                <p class="card-subtitle" style="opacity: 0; transform: translateX(-20px);">${step.description}</p>
                            </div>
                        </div>
                        
                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: var(--spacing-lg);">
                            ${Cases.getDimensionOrder().map((dim, index) => {
                                const dimData = externalData[dim];
                                return `
                                    <div class="dimension-card" style="border-left-color: ${Cases.getDimensionColor(dim)}; opacity: 0; transform: translateY(30px);" id="demo-dimension-${dim}">
                                        <div class="dimension-header">
                                            <span class="dimension-name">${Cases.dimensionNames[dim]}</span>
                                            <div class="score-display">
                                                <div class="score-circle external" id="demo-score-${dim}">0</div>
                                            </div>
                                        </div>
                                        <div class="dimension-body">
                                            <p style="font-size: 0.875rem; color: var(--text-muted); margin-bottom: var(--spacing-sm);">${dimData.reliability}</p>
                                            <p class="dimension-description" style="opacity: 0;">${dimData.assessment}</p>
                                        </div>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </div>
                `;
                break;
                
            case Demo.STEP_TYPES.QUESTION:
                const { dimension, question, answer, order, total } = step.data;
                html = `
                    <div class="card" style="padding: var(--spacing-xl); opacity: 0; transform: translateX(-30px);" id="demo-question-card">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--spacing-lg);">
                            <span class="gap-indicator medium" style="opacity: 0;">问题 ${order}/${total}</span>
                            <span style="padding: var(--spacing-xs) var(--spacing-sm); background: ${Cases.getDimensionColor(dimension)}20; color: ${Cases.getDimensionColor(dimension)}; border-radius: var(--radius-full); font-size: 0.875rem; font-weight: 600; opacity: 0;">
                                ${question.dimension}
                            </span>
                        </div>
                        
                        <h3 style="font-size: 1.25rem; font-weight: 600; color: var(--text-primary); margin-bottom: var(--spacing-md); opacity: 0;">${question.question}</h3>
                        
                        <div class="rating-selector">
                            ${Utils.range(1, 5).map(score => `
                                <label class="rating-option" id="demo-rating-${score}">
                                    <div class="rating-dot">${score}</div>
                                    <div class="rating-label">${score}</div>
                                </label>
                            `).join('')}
                        </div>
                        
                        <div style="margin-top: var(--spacing-lg); padding: var(--spacing-md); background: var(--bg-secondary); border-radius: var(--radius-md); opacity: 0;" id="demo-core-question">
                            <div style="font-size: 0.875rem; color: var(--text-muted); margin-bottom: var(--spacing-xs);">核心问题</div>
                            <div style="font-weight: 600; color: var(--text-primary);">${question.coreQuestion}</div>
                        </div>
                    </div>
                `;
                break;
                
            case Demo.STEP_TYPES.TRANSITION:
                html = `
                    <div class="card" style="text-align: center; padding: var(--spacing-2xl);" id="demo-transition-card">
                        <div class="loading-spinner" style="margin: 0 auto var(--spacing-lg);"></div>
                        <h2 class="card-title">${step.title}</h2>
                        <p style="color: var(--text-secondary);">${step.description}</p>
                    </div>
                `;
                break;
                
            case Demo.STEP_TYPES.REPORT:
                const report = Diagnosis.generateFullReport(caseId, externalData, demoScores);
                const maxGapDimension = report.maxGapDimension;
                
                html = `
                    <div>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--spacing-lg); margin-bottom: var(--spacing-xl);">
                            <div class="card" style="opacity: 0; transform: translateY(20px);" id="demo-report-external">
                                <div class="card-header">
                                    <h3 class="card-title">外部评估总分</h3>
                                </div>
                                <div class="card-body" style="text-align: center;">
                                    <div class="score-circle external" style="width: 72px; height: 72px; font-size: 1.75rem; margin: 0 auto;" id="demo-report-external-score">0</div>
                                </div>
                            </div>
                            <div class="card" style="opacity: 0; transform: translateY(20px);" id="demo-report-internal">
                                <div class="card-header">
                                    <h3 class="card-title">内在感受总分</h3>
                                </div>
                                <div class="card-body" style="text-align: center;">
                                    <div class="score-circle internal" style="width: 72px; height: 72px; font-size: 1.75rem; margin: 0 auto;" id="demo-report-internal-score">0</div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="card" style="margin-bottom: var(--spacing-xl); opacity: 0; transform: translateY(20px);" id="demo-report-bar">
                            <div class="card-header">
                                <h3 class="card-title">内外对比柱状图</h3>
                            </div>
                            <div class="card-body">
                                <div class="chart-container" id="demo-bar-chart"></div>
                            </div>
                        </div>
                        
                        <div class="diagnosis-card" style="opacity: 0; transform: translateY(20px);" id="demo-report-diagnosis">
                            <div class="diagnosis-header">
                                <div class="diagnosis-icon">💡</div>
                                <div>
                                    <h3 class="diagnosis-title">卡点诊断</h3>
                                    ${maxGapDimension ? `
                                        <span class="gap-indicator ${report.diagnosis.gapLevel === 'high' ? 'high' : 'medium'}">
                                            ${Diagnosis.getGapLabel(report.diagnosis.gapType)}
                                        </span>
                                    ` : ''}
                                </div>
                            </div>
                            <p class="diagnosis-text">${report.diagnosis.diagnosis}</p>
                        </div>
                    </div>
                `;
                break;
        }
        
        contentContainer.innerHTML = html;
        
        this.animateDemoContent(step, externalData, demoScores);
    },
    
    // 动画演示内容
    animateDemoContent: function(step, externalData, demoScores) {
        switch (step.type) {
            case Demo.STEP_TYPES.INTRO:
                setTimeout(() => {
                    const elements = ['demo-intro-icon', 'demo-intro-title', 'demo-intro-desc', 'demo-intro-case'];
                    elements.forEach((id, index) => {
                        const el = document.getElementById(id);
                        if (el) {
                            setTimeout(() => {
                                el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
                                el.style.opacity = '1';
                                el.style.transform = 'translateY(0)';
                            }, index * 200);
                        }
                    });
                }, 100);
                break;
                
            case Demo.STEP_TYPES.EXTERNAL:
                setTimeout(() => {
                    const header = document.querySelector('#demo-external-header .card-title');
                    const subtitle = document.querySelector('#demo-external-header .card-subtitle');
                    if (header) {
                        header.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
                        header.style.opacity = '1';
                        header.style.transform = 'translateX(0)';
                    }
                    if (subtitle) {
                        setTimeout(() => {
                            subtitle.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
                            subtitle.style.opacity = '1';
                            subtitle.style.transform = 'translateX(0)';
                        }, 200);
                    }
                    
                    const dimensionOrder = Cases.getDimensionOrder();
                    dimensionOrder.forEach((dim, index) => {
                        setTimeout(() => {
                            const dimCard = document.getElementById(`demo-dimension-${dim}`);
                            if (dimCard) {
                                dimCard.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
                                dimCard.style.opacity = '1';
                                dimCard.style.transform = 'translateY(0)';
                                
                                Demo.animateScore(`demo-score-${dim}`, externalData[dim].score, 800);
                                
                                const desc = dimCard.querySelector('.dimension-description');
                                if (desc) {
                                    setTimeout(() => {
                                        desc.style.transition = 'opacity 0.5s ease';
                                        desc.style.opacity = '1';
                                    }, 300);
                                }
                            }
                        }, 300 + index * 250);
                    });
                }, 100);
                break;
                
            case Demo.STEP_TYPES.QUESTION:
                setTimeout(() => {
                    const card = document.getElementById('demo-question-card');
                    if (card) {
                        card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
                        card.style.opacity = '1';
                        card.style.transform = 'translateX(0)';
                    }
                    
                    const labels = card.querySelectorAll('.gap-indicator, h3, span');
                    labels.forEach((label, index) => {
                        setTimeout(() => {
                            label.style.transition = 'opacity 0.4s ease';
                            label.style.opacity = '1';
                        }, 200 + index * 150);
                    });
                    
                    const answer = step.data.answer;
                    setTimeout(() => {
                        const ratingOption = document.getElementById(`demo-rating-${answer}`);
                        if (ratingOption) {
                            ratingOption.classList.add('selected');
                            Demo.pulseHighlight(ratingOption, 800);
                        }
                    }, 800);
                    
                    setTimeout(() => {
                        const coreQuestion = document.getElementById('demo-core-question');
                        if (coreQuestion) {
                            coreQuestion.style.transition = 'opacity 0.5s ease';
                            coreQuestion.style.opacity = '1';
                        }
                    }, 1200);
                }, 100);
                break;
                
            case Demo.STEP_TYPES.REPORT:
                setTimeout(() => {
                    const externalCard = document.getElementById('demo-report-external');
                    const internalCard = document.getElementById('demo-report-internal');
                    const externalTotal = Diagnosis.calculateExternalTotal(externalData);
                    
                    if (externalCard) {
                        externalCard.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
                        externalCard.style.opacity = '1';
                        externalCard.style.transform = 'translateY(0)';
                        Demo.animateScore('demo-report-external-score', externalTotal, 1000);
                    }
                    
                    setTimeout(() => {
                        if (internalCard) {
                            internalCard.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
                            internalCard.style.opacity = '1';
                            internalCard.style.transform = 'translateY(0)';
                            Demo.animateScore('demo-report-internal-score', Diagnosis.calculateInternalTotal(demoScores), 1000);
                        }
                    }, 300);
                    
                    setTimeout(() => {
                        const barCard = document.getElementById('demo-report-bar');
                        if (barCard) {
                            barCard.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
                            barCard.style.opacity = '1';
                            barCard.style.transform = 'translateY(0)';
                        }
                        
                        const report = Diagnosis.generateFullReport(this.state.caseId, externalData, demoScores);
                        Charts.safeRenderBarChart('demo-bar-chart', externalData, demoScores, report.maxGapDimension);
                    }, 700);
                    
                    setTimeout(() => {
                        const diagnosisCard = document.getElementById('demo-report-diagnosis');
                        if (diagnosisCard) {
                            diagnosisCard.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
                            diagnosisCard.style.opacity = '1';
                            diagnosisCard.style.transform = 'translateY(0)';
                        }
                    }, 1400);
                }, 100);
                break;
        }
    },
    
    // 停止演示
    stopDemo: function() {
        Demo.destroy();
        this.state.isDemoMode = false;
        this.renderHome();
    },
    
    // 获取当前状态
    getState: function() {
        return {
            currentPage: this.state.currentPage,
            caseId: this.state.caseId,
            internalScores: this.state.internalScores,
            bodySignals: this.state.bodySignals,
            isDemoMode: this.state.isDemoMode
        };
    },
    
    // 重置状态
    resetState: function() {
        this.state = {
            currentPage: 'home',
            caseId: null,
            internalScores: {},
            bodySignals: {},
            isDemoMode: false,
            demoInstance: null
        };
    }
};

// 全局暴露
window.Pages = Pages;