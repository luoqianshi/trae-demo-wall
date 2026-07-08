// ONE TOW MORE - Skill 系统管理模块

class SkillsModule {
    constructor() {
        this.currentCategory = 'all';
        this.skills = [
            {
                id: 1, name: '文档智能分类', description: '自动识别文档内容并进行分类和标签化，支持多种文档格式',
                version: 'v2.1.0', category: 'document', icon: 'file-code', iconColor: '#3B82F6',
                tags: ['文档处理', 'NLP', '分类'], usage: 1234, rating: 4.8, author: '系统内置', status: 'active',
                isSystem: true,
                versions: [
                    { ver: 'v1.0.0', date: '2025-01', accuracy: 78, speed: 2.5, note: '初始版本，基础分类功能' },
                    { ver: 'v1.5.0', date: '2025-04', accuracy: 85, speed: 2.1, note: '新增多语言支持' },
                    { ver: 'v2.0.0', date: '2025-08', accuracy: 91, speed: 1.8, note: '引入BERT模型，大幅提升准确率' },
                    { ver: 'v2.1.0', date: '2026-03', accuracy: 94, speed: 1.5, note: '优化推理速度，新增标签推荐' }
                ],
                metrics: { accuracy: [78, 85, 91, 94], speed: [2.5, 2.1, 1.8, 1.5], rating: [4.2, 4.5, 4.7, 4.8] }
            },
            {
                id: 2, name: '知识图谱构建', description: '从非结构化文本中提取实体和关系，构建可视化知识图谱',
                version: 'v1.5.2', category: 'analysis', icon: 'network', iconColor: '#8B5CF6',
                tags: ['知识图谱', 'NER', '关系抽取'], usage: 567, rating: 4.6, author: '系统内置', status: 'active',
                isSystem: true,
                versions: [
                    { ver: 'v1.0.0', date: '2025-03', accuracy: 72, speed: 5.0, note: '基础实体抽取' },
                    { ver: 'v1.3.0', date: '2025-07', accuracy: 82, speed: 4.2, note: '新增关系类型识别' },
                    { ver: 'v1.5.2', date: '2026-02', accuracy: 88, speed: 3.5, note: '优化图谱可视化效果' }
                ],
                metrics: { accuracy: [72, 82, 88], speed: [5.0, 4.2, 3.5], rating: [4.0, 4.4, 4.6] }
            },
            {
                id: 3, name: '智能摘要生成', description: '基于大语言模型生成文档摘要，支持提取式和生成式摘要',
                version: 'v3.0.1', category: 'document', icon: 'file-text', iconColor: '#10B981',
                tags: ['摘要', 'LLM', '文本生成'], usage: 2341, rating: 4.9, author: '系统内置', status: 'active',
                isSystem: true,
                versions: [
                    { ver: 'v1.0.0', date: '2025-01', accuracy: 75, speed: 3.0, note: '提取式摘要' },
                    { ver: 'v2.0.0', date: '2025-06', accuracy: 88, speed: 4.5, note: '引入生成式摘要' },
                    { ver: 'v3.0.0', date: '2026-01', accuracy: 95, speed: 3.8, note: '多模型融合，质量大幅提升' },
                    { ver: 'v3.0.1', date: '2026-05', accuracy: 96, speed: 3.5, note: 'Bug修复，优化长文档处理' }
                ],
                metrics: { accuracy: [75, 88, 95, 96], speed: [3.0, 4.5, 3.8, 3.5], rating: [4.3, 4.6, 4.8, 4.9] }
            },
            {
                id: 4, name: '数据清洗助手', description: '自动识别并处理数据中的缺失值、异常值和重复数据',
                version: 'v1.2.0', category: 'analysis', icon: 'database', iconColor: '#F59E0B',
                tags: ['数据清洗', '预处理', 'ETL'], usage: 892, rating: 4.5, author: '系统内置', status: 'active',
                isSystem: true,
                versions: [
                    { ver: 'v1.0.0', date: '2025-05', accuracy: 80, speed: 2.0, note: '基础清洗功能' },
                    { ver: 'v1.2.0', date: '2026-01', accuracy: 87, speed: 1.6, note: '新增异常值智能检测' }
                ],
                metrics: { accuracy: [80, 87], speed: [2.0, 1.6], rating: [4.2, 4.5] }
            },
            {
                id: 5, name: '文献综述生成', description: '基于多篇文献自动生成综述报告，识别研究趋势和空白',
                version: 'v2.0.0', category: 'research', icon: 'book-open', iconColor: '#EF4444',
                tags: ['文献综述', '研究辅助', '学术'], usage: 445, rating: 4.7, author: '系统内置', status: 'active',
                isSystem: true,
                versions: [
                    { ver: 'v1.0.0', date: '2025-04', accuracy: 70, speed: 8.0, note: '基础综述生成' },
                    { ver: 'v2.0.0', date: '2026-02', accuracy: 86, speed: 6.5, note: '新增趋势分析和空白识别' }
                ],
                metrics: { accuracy: [70, 86], speed: [8.0, 6.5], rating: [4.3, 4.7] }
            },
            {
                id: 6, name: '竞品分析助手', description: '自动收集竞品信息，生成对比分析报告和SWOT分析',
                version: 'v1.8.3', category: 'research', icon: 'bar-chart-3', iconColor: '#06B6D4',
                tags: ['竞品分析', '市场调研', '报告生成'], usage: 678, rating: 4.4, author: '系统内置', status: 'active',
                isSystem: true,
                versions: [
                    { ver: 'v1.0.0', date: '2025-06', accuracy: 73, speed: 6.0, note: '基础竞品信息收集' },
                    { ver: 'v1.5.0', date: '2025-11', accuracy: 80, speed: 5.2, note: '新增SWOT分析' },
                    { ver: 'v1.8.3', date: '2026-04', accuracy: 84, speed: 4.8, note: '优化数据源覆盖' }
                ],
                metrics: { accuracy: [73, 80, 84], speed: [6.0, 5.2, 4.8], rating: [4.1, 4.3, 4.4] }
            },
            {
                id: 7, name: '合同审查助手', description: '自动识别合同中的风险条款，提供修改建议和合规检查',
                version: 'v1.1.0', category: 'document', icon: 'scale', iconColor: '#EC4899',
                tags: ['法律', '合同', '合规'], usage: 234, rating: 4.6, author: '系统内置', status: 'beta',
                isSystem: true,
                versions: [
                    { ver: 'v1.0.0', date: '2026-01', accuracy: 82, speed: 4.0, note: 'Beta版本发布' },
                    { ver: 'v1.1.0', date: '2026-05', accuracy: 88, speed: 3.5, note: '新增合规检查规则库' }
                ],
                metrics: { accuracy: [82, 88], speed: [4.0, 3.5], rating: [4.4, 4.6] }
            },
            {
                id: 8, name: '自定义数据处理', description: '用户自定义的数据处理流程，支持拖拽式流程编排',
                version: 'v1.0.0', category: 'custom', icon: 'settings', iconColor: '#6B7280',
                tags: ['自定义', '流程编排', '低代码'], usage: 123, rating: 4.2, author: '用户创建', status: 'active',
                isSystem: false,
                versions: [
                    { ver: 'v1.0.0', date: '2026-03', accuracy: 75, speed: 3.0, note: '初始发布' }
                ],
                metrics: { accuracy: [75], speed: [3.0], rating: [4.2] }
            },
            {
                id: 9, name: '多语言翻译', description: '基于大模型的多语言翻译，支持100+语种互译',
                version: 'v2.3.0', category: 'document', icon: 'languages', iconColor: '#14B8A6',
                tags: ['翻译', '多语言', 'NLP'], usage: 1876, rating: 4.7, author: '系统内置', status: 'active',
                isSystem: true,
                versions: [
                    { ver: 'v1.0.0', date: '2025-02', accuracy: 85, speed: 1.5, note: '支持20种语言' },
                    { ver: 'v2.0.0', date: '2025-09', accuracy: 92, speed: 1.2, note: '扩展至100+语种' },
                    { ver: 'v2.3.0', date: '2026-04', accuracy: 95, speed: 1.0, note: '新增领域术语优化' }
                ],
                metrics: { accuracy: [85, 92, 95], speed: [1.5, 1.2, 1.0], rating: [4.4, 4.6, 4.7] }
            },
            {
                id: 10, name: '情感分析引擎', description: '对文本进行细粒度情感分析，支持观点抽取和情感倾向判断',
                version: 'v1.4.0', category: 'analysis', icon: 'heart', iconColor: '#F43F5E',
                tags: ['情感分析', 'NLP', '观点挖掘'], usage: 567, rating: 4.5, author: '用户创建', status: 'active',
                isSystem: false,
                versions: [
                    { ver: 'v1.0.0', date: '2025-10', accuracy: 78, speed: 2.0, note: '基础情感分类' },
                    { ver: 'v1.4.0', date: '2026-05', accuracy: 89, speed: 1.5, note: '新增观点抽取和细粒度分析' }
                ],
                metrics: { accuracy: [78, 89], speed: [2.0, 1.5], rating: [4.2, 4.5] }
            }
        ];
        this.evolutionRules = {
            feedbackEnabled: true,
            feedbackThreshold: 10,
            kbLinkageEnabled: true,
            kbLinkageThreshold: 5,
            scheduledEnabled: false,
            scheduledCron: '0 2 * * *'
        };
        this.init();
    }

    init() {
        this.renderSkillsList();
        this.initEventListeners();
    }

    renderSkillsList(category = 'all') {
        const skillsList = document.getElementById('skills-list');
        if (!skillsList) return;

        const filtered = category === 'all' ? this.skills : this.skills.filter(s => s.category === category);

        skillsList.innerHTML = filtered.map(skill => `
            <div class="skill-card" data-id="${skill.id}" style="position: relative;">
                <div class="skill-header">
                    <div class="skill-icon" style="background: ${skill.iconColor}20; color: ${skill.iconColor};">
                        <i data-lucide="${skill.icon}"></i>
                    </div>
                    <div>
                        <div class="skill-title">${skill.name}</div>
                        <div class="skill-version">${skill.version} ${skill.isSystem ? '' : '(用户创建)'}</div>
                    </div>
                </div>
                <div class="skill-desc">${skill.description}</div>
                <div class="skill-tags">
                    ${skill.tags.map(tag => `<span class="skill-tag">${tag}</span>`).join('')}
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 16px; padding-top: 16px; border-top: 1px solid var(--border);">
                    <div style="display: flex; gap: 12px; font-size: 12px; color: var(--text-muted);">
                        <span><i data-lucide="play" style="width: 12px; height: 12px;"></i> ${skill.usage}</span>
                        <span><i data-lucide="star" style="width: 12px; height: 12px;"></i> ${skill.rating}</span>
                    </div>
                    <span style="font-size: 12px; color: var(--text-muted);">${skill.author}</span>
                </div>
                ${skill.status === 'beta' ? '<div style="position: absolute; top: 12px; right: 12px; padding: 4px 8px; background: var(--warning); color: white; border-radius: var(--radius-sm); font-size: 11px; font-weight: 600;">BETA</div>' : ''}
            </div>
        `).join('');

        skillsList.querySelectorAll('.skill-card').forEach(card => {
            card.addEventListener('click', () => this.openSkillDetail(parseInt(card.dataset.id)));
        });

        this.initIcons();
    }

    initEventListeners() {
        const categories = document.querySelectorAll('.skill-category');
        categories.forEach(cat => {
            cat.addEventListener('click', () => {
                categories.forEach(c => c.classList.remove('active'));
                cat.classList.add('active');
                this.currentCategory = cat.dataset.category;
                this.renderSkillsList(this.currentCategory);
            });
        });

        const createBtn = document.getElementById('create-skill-btn');
        if (createBtn) {
            createBtn.addEventListener('click', () => this.showCreateSkillModal());
        }
    }

    openSkillDetail(id) {
        const skill = this.skills.find(s => s.id === id);
        if (!skill) return;

        const content = `
            <div class="skill-detail-tabs">
                <div class="kb-tab active" data-tab="info" onclick="skillsModule.switchSkillTab(this, 'info', ${id})">基础信息</div>
                <div class="kb-tab" data-tab="versions" onclick="skillsModule.switchSkillTab(this, 'versions', ${id})">进化版本树</div>
                <div class="kb-tab" data-tab="metrics" onclick="skillsModule.switchSkillTab(this, 'metrics', ${id})">运行效果</div>
            </div>
            <div class="kb-detail-content" id="skill-detail-content">
                ${this.renderSkillInfoTab(skill)}
            </div>
        `;

        window.app.openModal('Skill 详情 - ' + skill.name, content, { wide: true });
        this.initIcons();
    }

    switchSkillTab(tabEl, tab, id) {
        const skill = this.skills.find(s => s.id === id);
        if (!skill) return;

        document.querySelectorAll('.skill-detail-tabs .kb-tab').forEach(t => t.classList.remove('active'));
        tabEl.classList.add('active');

        const contentEl = document.getElementById('skill-detail-content');
        if (!contentEl) return;

        if (tab === 'info') contentEl.innerHTML = this.renderSkillInfoTab(skill);
        else if (tab === 'versions') contentEl.innerHTML = this.renderVersionTreeTab(skill);
        else if (tab === 'metrics') contentEl.innerHTML = this.renderMetricsTab(skill);

        this.initIcons();
    }

    renderSkillInfoTab(skill) {
        return `
            <div style="padding: 20px;">
                <div style="display: flex; align-items: center; gap: 16px; margin-bottom: 24px;">
                    <div style="width: 56px; height: 56px; border-radius: var(--radius-lg); background: ${skill.iconColor}20; display: flex; align-items: center; justify-content: center; color: ${skill.iconColor};">
                        <i data-lucide="${skill.icon}" style="width: 28px; height: 28px;"></i>
                    </div>
                    <div>
                        <h3 style="margin-bottom: 4px;">${skill.name}</h3>
                        <span style="font-size: 14px; color: var(--text-secondary);">${skill.version}</span>
                        ${skill.isSystem ? '<span style="margin-left: 8px; padding: 2px 8px; background: var(--accent-light); color: var(--accent); border-radius: var(--radius-sm); font-size: 11px;">系统内置</span>' : '<span style="margin-left: 8px; padding: 2px 8px; background: rgba(139,92,246,0.15); color: #8B5CF6; border-radius: var(--radius-sm); font-size: 11px;">用户创建</span>'}
                        ${skill.status === 'beta' ? '<span style="margin-left: 8px; padding: 2px 8px; background: var(--warning); color: white; border-radius: var(--radius-sm); font-size: 11px;">BETA</span>' : ''}
                    </div>
                </div>
                <div style="margin-bottom: 24px;">
                    <h4 style="margin-bottom: 8px; font-size: 14px; color: var(--text-secondary);">功能描述</h4>
                    <p>${skill.description}</p>
                </div>
                <div style="margin-bottom: 24px;">
                    <h4 style="margin-bottom: 8px; font-size: 14px; color: var(--text-secondary);">标签</h4>
                    <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                        ${skill.tags.map(tag => `<span class="skill-tag">${tag}</span>`).join('')}
                    </div>
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; margin-bottom: 24px;">
                    <div style="text-align: center; padding: 16px; background: var(--bg-secondary); border-radius: var(--radius-md);">
                        <div style="font-size: 24px; font-weight: 700; color: ${skill.iconColor};">${skill.usage}</div>
                        <div style="font-size: 12px; color: var(--text-muted); margin-top: 4px;">使用次数</div>
                    </div>
                    <div style="text-align: center; padding: 16px; background: var(--bg-secondary); border-radius: var(--radius-md);">
                        <div style="font-size: 24px; font-weight: 700; color: ${skill.iconColor};">${skill.rating}</div>
                        <div style="font-size: 12px; color: var(--text-muted); margin-top: 4px;">用户评分</div>
                    </div>
                    <div style="text-align: center; padding: 16px; background: var(--bg-secondary); border-radius: var(--radius-md);">
                        <div style="font-size: 14px; font-weight: 700; color: ${skill.iconColor};">${skill.author}</div>
                        <div style="font-size: 12px; color: var(--text-muted); margin-top: 4px;">来源</div>
                    </div>
                </div>
                <div style="display: flex; gap: 12px;">
                    <button class="btn btn-primary" style="flex: 1;" onclick="skillsModule.useSkill(${skill.id})"><i data-lucide="play"></i> 使用 Skill</button>
                    <button class="btn" style="background: var(--bg-secondary); color: var(--text-primary);" onclick="skillsModule.editSkill(${skill.id})"><i data-lucide="edit"></i> 编辑</button>
                    <button class="btn" style="background: var(--bg-secondary); color: var(--text-primary);" onclick="skillsModule.cloneSkill(${skill.id})"><i data-lucide="copy"></i> 克隆</button>
                    ${!skill.isSystem ? `<button class="btn" style="background: var(--bg-secondary); color: var(--danger);" onclick="skillsModule.deleteSkill(${skill.id})"><i data-lucide="trash-2"></i></button>` : ''}
                </div>
            </div>
        `;
    }

    renderVersionTreeTab(skill) {
        const versions = skill.versions || [];
        let treeHtml = '';

        versions.forEach((v, i) => {
            const isLatest = i === versions.length - 1;
            treeHtml += `
                <div style="display: flex; gap: 20px; position: relative; padding-bottom: ${isLatest ? '0' : '24px'};">
                    <div style="display: flex; flex-direction: column; align-items: center; flex-shrink: 0;">
                        <div style="width: 16px; height: 16px; border-radius: 50%; background: ${isLatest ? skill.iconColor : 'var(--bg-secondary)'}; border: 3px solid ${isLatest ? skill.iconColor : 'var(--text-muted)'};"></div>
                        ${!isLatest ? '<div style="width: 2px; flex: 1; background: var(--border); margin-top: 4px;"></div>' : ''}
                    </div>
                    <div style="flex: 1; padding-bottom: 8px;">
                        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 6px;">
                            <span style="font-weight: 600; font-size: 15px; color: ${isLatest ? skill.iconColor : 'var(--text-primary)'};">${v.ver}</span>
                            <span style="font-size: 12px; color: var(--text-muted);">${v.date}</span>
                            ${isLatest ? '<span style="padding: 2px 8px; background: var(--success); color: white; border-radius: 9999px; font-size: 10px;">最新</span>' : ''}
                        </div>
                        <p style="font-size: 13px; color: var(--text-secondary); margin-bottom: 8px;">${v.note}</p>
                        <div style="display: flex; gap: 16px; font-size: 12px;">
                            <span style="color: var(--success);">准确率: ${v.accuracy}%</span>
                            <span style="color: var(--accent);">耗时: ${v.speed}s</span>
                        </div>
                    </div>
                </div>
            `;
        });

        return `
            <div style="padding: 20px;">
                <h4 style="margin-bottom: 20px; font-size: 15px;">版本迭代树</h4>
                ${treeHtml}
                <div style="margin-top: 24px; padding: 16px; background: var(--bg-secondary); border-radius: var(--radius-md);">
                    <h4 style="margin-bottom: 12px; font-size: 14px;">自动进化触发机制</h4>
                    <div style="display: flex; flex-direction: column; gap: 12px;">
                        <div style="display: flex; align-items: center; gap: 12px; padding: 10px; background: var(--bg-card); border-radius: var(--radius-sm);">
                            <i data-lucide="message-circle" style="width: 20px; height: 20px; color: var(--accent);"></i>
                            <div>
                                <div style="font-size: 13px; font-weight: 500;">执行反馈进化</div>
                                <div style="font-size: 12px; color: var(--text-muted);">当收到 ${this.evolutionRules.feedbackThreshold} 条以上用户反馈时自动触发优化</div>
                            </div>
                            <span style="margin-left: auto; padding: 2px 8px; border-radius: 9999px; font-size: 11px; background: ${this.evolutionRules.feedbackEnabled ? 'rgba(16,185,129,0.15); color: var(--success);' : 'rgba(107,114,128,0.15); color: var(--text-muted);'}">${this.evolutionRules.feedbackEnabled ? '已开启' : '已关闭'}</span>
                        </div>
                        <div style="display: flex; align-items: center; gap: 12px; padding: 10px; background: var(--bg-card); border-radius: var(--radius-sm);">
                            <i data-lucide="database" style="width: 20px; height: 20px; color: #8B5CF6;"></i>
                            <div>
                                <div style="font-size: 13px; font-weight: 500;">知识库联动进化</div>
                                <div style="font-size: 12px; color: var(--text-muted);">当关联知识库更新超过 ${this.evolutionRules.kbLinkageThreshold} 篇文档时自动触发</div>
                            </div>
                            <span style="margin-left: auto; padding: 2px 8px; border-radius: 9999px; font-size: 11px; background: ${this.evolutionRules.kbLinkageEnabled ? 'rgba(16,185,129,0.15); color: var(--success);' : 'rgba(107,114,128,0.15); color: var(--text-muted);'}">${this.evolutionRules.kbLinkageEnabled ? '已开启' : '已关闭'}</span>
                        </div>
                        <div style="display: flex; align-items: center; gap: 12px; padding: 10px; background: var(--bg-card); border-radius: var(--radius-sm);">
                            <i data-lucide="clock" style="width: 20px; height: 20px; color: var(--warning);"></i>
                            <div>
                                <div style="font-size: 13px; font-weight: 500;">定时周期进化</div>
                                <div style="font-size: 12px; color: var(--text-muted);">按 Cron 表达式定期执行进化 (${this.evolutionRules.scheduledCron})</div>
                            </div>
                            <span style="margin-left: auto; padding: 2px 8px; border-radius: 9999px; font-size: 11px; background: ${this.evolutionRules.scheduledEnabled ? 'rgba(16,185,129,0.15); color: var(--success);' : 'rgba(107,114,128,0.15); color: var(--text-muted);'}">${this.evolutionRules.scheduledEnabled ? '已开启' : '已关闭'}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    renderMetricsTab(skill) {
        const m = skill.metrics || {};
        const renderChart = (data, label, color) => {
            const max = Math.max(...data);
            const bars = data.map((val, i) => `
                <div style="display: flex; flex-direction: column; align-items: center; gap: 4px; flex: 1;">
                    <span style="font-size: 11px; color: var(--text-muted);">${val}${label === '速度' ? 's' : '%'}</span>
                    <div style="width: 100%; max-width: 40px; height: ${Math.max(20, (val / max) * 120)}px; background: ${color}; border-radius: 4px 4px 0 0; transition: height 0.5s ease;"></div>
                    <span style="font-size: 10px; color: var(--text-muted);">v${i + 1}</span>
                </div>
            `).join('');

            return `
                <div style="margin-bottom: 20px;">
                    <div style="font-size: 14px; margin-bottom: 12px; color: var(--text-secondary);">${label}</div>
                    <div style="display: flex; align-items: flex-end; gap: 8px; height: 160px; padding: 12px; background: var(--bg-secondary); border-radius: var(--radius-md);">
                        ${bars}
                    </div>
                </div>
            `;
        };

        return `
            <div style="padding: 20px;">
                <h4 style="margin-bottom: 20px; font-size: 15px;">运行效果趋势</h4>
                ${m.accuracy ? renderChart(m.accuracy, '准确率', 'var(--success)') : ''}
                ${m.speed ? renderChart(m.speed, '速度', 'var(--accent)') : ''}
                ${m.rating ? renderChart(m.rating, '评分', '#8B5CF6') : ''}
            </div>
        `;
    }

    showCreateSkillModal() {
        const content = `
            <form id="create-skill-form">
                <div class="form-group">
                    <label>Skill 名称</label>
                    <input type="text" id="skill-name" placeholder="输入 Skill 名称" required>
                </div>
                <div class="form-group">
                    <label>功能描述</label>
                    <textarea id="skill-desc" placeholder="描述这个 Skill 的功能..."></textarea>
                </div>
                <div class="form-group">
                    <label>分类</label>
                    <select id="skill-category">
                        <option value="document">文档处理</option>
                        <option value="analysis">数据分析</option>
                        <option value="research">研究辅助</option>
                        <option value="custom">自定义</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>标签（用逗号分隔）</label>
                    <input type="text" id="skill-tags" placeholder="例如: NLP, 分类, 智能">
                </div>
                <div class="form-group">
                    <label>执行代码</label>
                    <textarea id="skill-code" placeholder="// 输入 Skill 的执行逻辑" style="min-height: 120px; font-family: monospace;"></textarea>
                </div>
                <button type="submit" class="btn btn-primary" style="width: 100%;"><i data-lucide="plus"></i> 创建 Skill</button>
            </form>
        `;

        window.app.openModal('创建新 Skill', content);
        setTimeout(() => {
            const form = document.getElementById('create-skill-form');
            if (form) form.addEventListener('submit', (e) => { e.preventDefault(); this.createSkill(); });
            this.initIcons();
        }, 100);
    }

    createSkill() {
        const name = document.getElementById('skill-name').value;
        const desc = document.getElementById('skill-desc').value;
        const category = document.getElementById('skill-category').value;
        const tagsInput = document.getElementById('skill-tags').value;

        if (!name) { alert('请输入 Skill 名称'); return; }

        const colors = { document: '#3B82F6', analysis: '#F59E0B', research: '#EF4444', custom: '#6B7280' };
        const icons = { document: 'file-code', analysis: 'bar-chart-3', research: 'book-open', custom: 'settings' };

        this.skills.unshift({
            id: Date.now(), name, description: desc || '暂无描述', version: 'v1.0.0',
            category, icon: icons[category] || 'settings', iconColor: colors[category] || '#6B7280',
            tags: tagsInput ? tagsInput.split(',').map(t => t.trim()) : ['自定义'],
            usage: 0, rating: 5.0, author: '用户创建', status: 'active', isSystem: false,
            versions: [{ ver: 'v1.0.0', date: new Date().toISOString().slice(0, 7), accuracy: 75, speed: 3.0, note: '初始版本' }],
            metrics: { accuracy: [75], speed: [3.0], rating: [5.0] }
        });

        this.renderSkillsList(this.currentCategory);
        window.app.closeModal();
    }

    useSkill(id) {
        const skill = this.skills.find(s => s.id === id);
        if (!skill) return;
        alert(`正在使用 "${skill.name}"...\n\n在实际应用中，这里会打开 Skill 的执行界面。`);
        window.app.closeModal();
    }

    editSkill(id) {
        const skill = this.skills.find(s => s.id === id);
        if (!skill) return;

        const content = `
            <form id="edit-skill-form">
                <div class="form-group">
                    <label>Skill 名称</label>
                    <input type="text" id="edit-skill-name" value="${skill.name}" required>
                </div>
                <div class="form-group">
                    <label>功能描述</label>
                    <textarea id="edit-skill-desc">${skill.description}</textarea>
                </div>
                <div class="form-group">
                    <label>标签（用逗号分隔）</label>
                    <input type="text" id="edit-skill-tags" value="${skill.tags.join(', ')}">
                </div>
                <button type="submit" class="btn btn-primary" style="width: 100%;"><i data-lucide="save"></i> 保存修改</button>
            </form>
        `;

        window.app.openModal('编辑 Skill', content);
        setTimeout(() => {
            const form = document.getElementById('edit-skill-form');
            if (form) {
                form.addEventListener('submit', (e) => {
                    e.preventDefault();
                    skill.name = document.getElementById('edit-skill-name').value;
                    skill.description = document.getElementById('edit-skill-desc').value;
                    const tagsInput = document.getElementById('edit-skill-tags').value;
                    skill.tags = tagsInput ? tagsInput.split(',').map(t => t.trim()) : [];
                    this.renderSkillsList(this.currentCategory);
                    window.app.closeModal();
                });
            }
            this.initIcons();
        }, 100);
    }

    cloneSkill(id) {
        const skill = this.skills.find(s => s.id === id);
        if (!skill) return;

        this.skills.unshift({
            ...skill, id: Date.now(), name: skill.name + ' (副本)',
            version: 'v1.0.0', usage: 0, author: '用户创建', isSystem: false,
            versions: [{ ver: 'v1.0.0', date: new Date().toISOString().slice(0, 7), accuracy: skill.versions[skill.versions.length - 1].accuracy, speed: skill.versions[skill.versions.length - 1].speed, note: '从 ' + skill.name + ' 克隆' }],
            metrics: { accuracy: [skill.versions[skill.versions.length - 1].accuracy], speed: [skill.versions[skill.versions.length - 1].speed], rating: [5.0] }
        });

        this.renderSkillsList(this.currentCategory);
        alert('Skill 已克隆！');
        window.app.closeModal();
    }

    deleteSkill(id) {
        const skill = this.skills.find(s => s.id === id);
        if (!skill) return;
        if (confirm(`确定要删除 Skill "${skill.name}" 吗？`)) {
            this.skills = this.skills.filter(s => s.id !== id);
            this.renderSkillsList(this.currentCategory);
            window.app.closeModal();
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.skillsModule = new SkillsModule();
});
