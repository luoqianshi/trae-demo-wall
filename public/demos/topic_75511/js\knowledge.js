// ONE TOW MORE - 知识库管理模块

class KnowledgeBase {
    constructor() {
        this.viewMode = 'card';
        this.currentCategory = 'all';
        this.kbs = [
            {
                id: 1, name: '技术文档库', description: '包含微服务架构、前端开发、DevOps、云原生等技术文档',
                icon: 'file-code', docCount: 234, updateTime: '2小时前', category: '技术',
                documents: [
                    { id: 1, name: '微服务架构设计规范 v3.0.pdf', size: '2.4 MB', uploadTime: '2026-06-18', type: 'pdf' },
                    { id: 2, name: 'Kubernetes 部署手册.docx', size: '1.8 MB', uploadTime: '2026-06-17', type: 'docx' },
                    { id: 3, name: '前端性能优化指南.md', size: '156 KB', uploadTime: '2026-06-16', type: 'md' },
                    { id: 4, name: 'CI/CD 流水线配置说明.pdf', size: '890 KB', uploadTime: '2026-06-15', type: 'pdf' },
                    { id: 5, name: '数据库设计规范 v2.1.docx', size: '3.2 MB', uploadTime: '2026-06-14', type: 'docx' }
                ],
                coverage: { overall: 78, dimensions: { '架构设计': 92, '前端开发': 85, '后端开发': 76, '运维部署': 68, '安全规范': 55, '测试策略': 42 } },
                topKnowledge: ['微服务拆分原则', 'Docker容器化部署', 'React性能优化', 'gRPC通信协议', '服务网格Istio', 'Redis缓存策略', 'MySQL索引优化', 'Nginx负载均衡', 'Jenkins自动化', 'ELK日志系统'],
                pendingDimensions: ['安全规范', '测试策略', '监控告警'],
                alerts: [
                    { type: 'duplicate', text: '发现3组重复文档，建议合并处理' },
                    { type: 'outdated', text: '有12篇文档超过90天未更新，请检查时效性' }
                ]
            },
            {
                id: 2, name: '产品需求库', description: '产品规划、需求文档、用户故事、PRD等产品资料',
                icon: 'clipboard-list', docCount: 56, updateTime: '5小时前', category: '产品',
                documents: [
                    { id: 1, name: '2026年Q3产品路线图.pdf', size: '4.1 MB', uploadTime: '2026-06-18', type: 'pdf' },
                    { id: 2, name: '用户画像分析报告.docx', size: '2.3 MB', uploadTime: '2026-06-16', type: 'docx' },
                    { id: 3, name: 'V2.5版本需求规格说明书.pdf', size: '5.6 MB', uploadTime: '2026-06-14', type: 'pdf' }
                ],
                coverage: { overall: 65, dimensions: { '需求分析': 88, '用户研究': 72, '竞品分析': 60, '数据指标': 45, '版本规划': 80 } },
                topKnowledge: ['用户增长策略', 'A/B测试方案', '产品迭代节奏', 'MVP定义标准', '用户反馈闭环'],
                pendingDimensions: ['数据指标'],
                alerts: [{ type: 'outdated', text: '有5篇需求文档关联的版本已发布，请归档' }]
            },
            {
                id: 3, name: '市场调研库', description: '行业分析报告、竞品分析、用户调研数据、市场趋势',
                icon: 'bar-chart-3', docCount: 128, updateTime: '1天前', category: '市场',
                documents: [
                    { id: 1, name: '2026年AI行业趋势报告.pdf', size: '8.2 MB', uploadTime: '2026-06-17', type: 'pdf' },
                    { id: 2, name: '竞品功能对比矩阵.xlsx', size: '1.5 MB', uploadTime: '2026-06-15', type: 'xlsx' },
                    { id: 3, name: '用户满意度调研结果.pdf', size: '3.7 MB', uploadTime: '2026-06-12', type: 'pdf' }
                ],
                coverage: { overall: 72, dimensions: { '行业趋势': 85, '竞品分析': 78, '用户调研': 65, '市场预测': 58 } },
                topKnowledge: ['AI市场增长率', '头部竞品技术栈', '用户留存率分析', 'SaaS定价策略', '出海市场机会'],
                pendingDimensions: ['市场预测'],
                alerts: [{ type: 'duplicate', text: '发现2份相似的市场报告' }]
            },
            {
                id: 4, name: '法律法规库', description: '数据安全法、隐私政策、合规文档、行业监管法规',
                icon: 'scale', docCount: 89, updateTime: '2天前', category: '法律',
                documents: [
                    { id: 1, name: '个人信息保护法解读.pdf', size: '1.2 MB', uploadTime: '2026-06-16', type: 'pdf' },
                    { id: 2, name: '数据出境安全评估指南.docx', size: '2.8 MB', uploadTime: '2026-06-14', type: 'docx' },
                    { id: 3, name: 'GDPR合规检查清单.pdf', size: '560 KB', uploadTime: '2026-06-10', type: 'pdf' }
                ],
                coverage: { overall: 81, dimensions: { '数据安全': 90, '隐私保护': 85, '行业合规': 78, '跨境法规': 65, '知识产权': 70 } },
                topKnowledge: ['数据最小化原则', '知情同意机制', '数据分类分级', '安全评估流程', '合规审计要求'],
                pendingDimensions: ['跨境法规'],
                alerts: []
            },
            {
                id: 5, name: '医学文献库', description: '临床试验数据、医学研究论文、诊疗指南、药物信息',
                icon: 'heart-pulse', docCount: 456, updateTime: '3天前', category: '医疗',
                documents: [
                    { id: 1, name: '2026年肿瘤免疫治疗进展综述.pdf', size: '6.3 MB', uploadTime: '2026-06-15', type: 'pdf' },
                    { id: 2, name: '心血管疾病诊疗指南 v4.0.pdf', size: '4.5 MB', uploadTime: '2026-06-12', type: 'pdf' },
                    { id: 3, name: '药物相互作用数据库更新.docx', size: '2.1 MB', uploadTime: '2026-06-10', type: 'docx' }
                ],
                coverage: { overall: 85, dimensions: { '临床研究': 92, '诊疗指南': 88, '药物信息': 82, '基础医学': 75, '公共卫生': 60 } },
                topKnowledge: ['PD-1抑制剂疗效', '基因治疗进展', '远程医疗规范', 'AI辅助诊断', '中医药现代化'],
                pendingDimensions: ['公共卫生'],
                alerts: [{ type: 'outdated', text: '有8篇文献引用的指南已更新至新版本' }]
            },
            {
                id: 6, name: '金融研报库', description: '投资研究报告、市场分析、风险评估、宏观经济数据',
                icon: 'trending-up', docCount: 312, updateTime: '1周前', category: '金融',
                documents: [
                    { id: 1, name: '2026年中期投资策略报告.pdf', size: '5.8 MB', uploadTime: '2026-06-11', type: 'pdf' },
                    { id: 2, name: '新能源行业深度分析.pdf', size: '7.2 MB', uploadTime: '2026-06-08', type: 'pdf' },
                    { id: 3, name: '信用风险评估模型说明.docx', size: '1.9 MB', uploadTime: '2026-06-05', type: 'docx' }
                ],
                coverage: { overall: 76, dimensions: { '投资策略': 82, '行业分析': 78, '风险评估': 70, '宏观经济': 68, '量化模型': 55 } },
                topKnowledge: ['ESG投资趋势', '量化对冲策略', '利率周期研判', '科创板估值', '跨境资本流动'],
                pendingDimensions: ['量化模型'],
                alerts: [{ type: 'outdated', text: '有15份研报数据截止到上季度，建议更新' }]
            },
            {
                id: 7, name: '制造工艺库', description: '生产工艺流程、质量控制标准、设备维护手册、精益制造',
                icon: 'cog', docCount: 178, updateTime: '4天前', category: '制造',
                documents: [
                    { id: 1, name: 'SMT贴片工艺标准 v2.0.pdf', size: '3.4 MB', uploadTime: '2026-06-14', type: 'pdf' },
                    { id: 2, name: '六西格玛质量管理体系.docx', size: '2.7 MB', uploadTime: '2026-06-12', type: 'docx' },
                    { id: 3, name: '设备预防性维护手册.pdf', size: '4.1 MB', uploadTime: '2026-06-10', type: 'pdf' }
                ],
                coverage: { overall: 70, dimensions: { '生产工艺': 80, '质量控制': 75, '设备管理': 68, '精益制造': 62, '安全操作': 58 } },
                topKnowledge: ['SMT回流焊参数', 'AOI检测标准', 'TPM设备管理', '5S现场管理', 'SPC统计控制'],
                pendingDimensions: ['安全操作', '精益制造'],
                alerts: [{ type: 'duplicate', text: '发现4份重复的工艺参数表' }]
            },
            {
                id: 8, name: '科研文献库', description: '学术论文、研究方法论、实验数据、科研项目资料',
                icon: 'book-open', docCount: 267, updateTime: '5天前', category: '科研',
                documents: [
                    { id: 1, name: '大语言模型训练优化方法综述.pdf', size: '4.9 MB', uploadTime: '2026-06-13', type: 'pdf' },
                    { id: 2, name: '联邦学习隐私保护研究.docx', size: '2.3 MB', uploadTime: '2026-06-11', type: 'docx' },
                    { id: 3, name: '多模态AI最新进展报告.pdf', size: '6.1 MB', uploadTime: '2026-06-09', type: 'pdf' }
                ],
                coverage: { overall: 74, dimensions: { 'AI/ML': 90, '数据科学': 82, '网络安全': 65, '量子计算': 48, '生物信息': 55 } },
                topKnowledge: ['Transformer架构演进', 'RLHF训练方法', '知识蒸馏技术', 'Prompt Engineering', '多模态融合'],
                pendingDimensions: ['量子计算', '生物信息'],
                alerts: []
            }
        ];
        this.init();
    }

    init() {
        this.renderKBList();
        this.initEventListeners();
    }

    renderKBList(filter = '', category = 'all') {
        const kbList = document.getElementById('kb-list');
        if (!kbList) return;

        let filtered = this.kbs;
        if (category && category !== 'all') {
            filtered = filtered.filter(kb => kb.category === category);
        }
        if (filter) {
            const q = filter.toLowerCase();
            filtered = filtered.filter(kb =>
                kb.name.toLowerCase().includes(q) ||
                kb.description.toLowerCase().includes(q)
            );
        }

        if (this.viewMode === 'card') {
            this.renderCardView(kbList, filtered);
        } else {
            this.renderGraphView(kbList, filtered);
        }
    }

    renderCardView(container, kbs) {
        container.className = 'kb-grid';
        container.innerHTML = kbs.map(kb => `
            <div class="kb-card" data-id="${kb.id}">
                <div class="kb-header">
                    <div class="kb-icon">
                        <i data-lucide="${kb.icon}"></i>
                    </div>
                    <button class="kb-menu" onclick="event.stopPropagation(); knowledgeBase.showKBMenu(${kb.id})">
                        <i data-lucide="more-vertical"></i>
                    </button>
                </div>
                <div class="kb-title">${kb.name}</div>
                <div class="kb-desc">${kb.description}</div>
                <div class="kb-meta">
                    <span><i data-lucide="file-text"></i> ${kb.docCount} 文档</span>
                    <span><i data-lucide="clock"></i> ${kb.updateTime}</span>
                    <span><i data-lucide="tag"></i> ${kb.category}</span>
                </div>
            </div>
        `).join('');

        container.querySelectorAll('.kb-card').forEach(card => {
            card.addEventListener('click', () => {
                this.openKBDetail(parseInt(card.dataset.id));
            });
        });

        this.initIcons();
    }

    renderGraphView(container, kbs) {
        container.className = 'kb-graph-view';
        const nodes = kbs.map((kb, i) => {
            const cols = 4;
            const row = Math.floor(i / cols);
            const col = i % cols;
            const x = 50 + col * 220;
            const y = 80 + row * 180;
            return { ...kb, x, y };
        });

        const edges = [];
        for (let i = 0; i < nodes.length - 1; i++) {
            if (i + 1 < nodes.length) {
                edges.push({ from: nodes[i], to: nodes[i + 1] });
            }
            if (i + cols < nodes.length) {
                edges.push({ from: nodes[i], to: nodes[i + cols] });
            }
        }

        let svg = `<svg width="100%" height="${Math.ceil(nodes.length / 4) * 180 + 120}" style="position: absolute; top: 0; left: 0; pointer-events: none;">`;
        edges.forEach(e => {
            svg += `<line x1="${e.from.x + 40}" y1="${e.from.y + 30}" x2="${e.to.x + 40}" y2="${e.to.y + 30}" stroke="rgba(59,130,246,0.2)" stroke-width="1.5" stroke-dasharray="4,4"/>`;
        });
        svg += `</svg>`;

        let html = `<div style="position: relative; min-height: ${Math.ceil(nodes.length / 4) * 180 + 120}px;">${svg}`;
        nodes.forEach(node => {
            html += `
                <div class="kb-graph-node" data-id="${node.id}" style="position: absolute; left: ${node.x}px; top: ${node.y}px; width: 160px; padding: 16px; background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-md); cursor: pointer; transition: var(--transition); text-align: center;" onmouseover="this.style.borderColor='var(--border-hover)'" onmouseout="this.style.borderColor='var(--border)'">
                    <div style="width: 36px; height: 36px; border-radius: var(--radius-sm); background: var(--accent-light); color: var(--accent); display: flex; align-items: center; justify-content: center; margin: 0 auto 8px;">
                        <i data-lucide="${node.icon}" style="width: 18px; height: 18px;"></i>
                    </div>
                    <div style="font-size: 13px; font-weight: 600; margin-bottom: 4px;">${node.name}</div>
                    <div style="font-size: 11px; color: var(--text-muted);">${node.docCount} 文档</div>
                </div>
            `;
        });
        html += `</div>`;

        container.innerHTML = html;

        container.querySelectorAll('.kb-graph-node').forEach(node => {
            node.addEventListener('click', () => {
                this.openKBDetail(parseInt(node.dataset.id));
            });
        });

        this.initIcons();
    }

    initEventListeners() {
        const searchInput = document.getElementById('kb-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.renderKBList(e.target.value, this.currentCategory);
            });
        }

        const createBtn = document.getElementById('create-kb-btn');
        if (createBtn) {
            createBtn.addEventListener('click', () => this.showCreateKBModal());
        }

        const viewToggle = document.getElementById('kb-view-toggle');
        if (viewToggle) {
            viewToggle.querySelectorAll('.view-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    viewToggle.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    this.viewMode = btn.dataset.view;
                    this.renderKBList('', this.currentCategory);
                });
            });
        }

        const catFilter = document.getElementById('kb-category-filter');
        if (catFilter) {
            catFilter.querySelectorAll('.cat-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    catFilter.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    this.currentCategory = btn.dataset.category;
                    this.renderKBList('', this.currentCategory);
                });
            });
        }
    }

    showCreateKBModal() {
        const content = `
            <form id="create-kb-form">
                <div class="form-group">
                    <label>知识库名称</label>
                    <input type="text" id="kb-name" placeholder="输入知识库名称" required>
                </div>
                <div class="form-group">
                    <label>知识库描述</label>
                    <textarea id="kb-desc" placeholder="描述这个知识库的用途..."></textarea>
                </div>
                <div class="form-group">
                    <label>分类</label>
                    <select id="kb-category">
                        <option value="技术">技术</option>
                        <option value="产品">产品</option>
                        <option value="市场">市场</option>
                        <option value="法律">法律</option>
                        <option value="医疗">医疗</option>
                        <option value="金融">金融</option>
                        <option value="制造">制造</option>
                        <option value="科研">科研</option>
                        <option value="其他">其他</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>上传文档</label>
                    <input type="file" id="kb-files" multiple accept=".pdf,.doc,.docx,.txt,.md">
                    <small style="color: var(--text-muted); display: block; margin-top: 4px;">支持 PDF、Word、TXT、Markdown 格式</small>
                </div>
                <button type="submit" class="btn btn-primary" style="width: 100%;">
                    <i data-lucide="plus"></i> 创建知识库
                </button>
            </form>
        `;

        window.app.openModal('新建知识库', content);

        setTimeout(() => {
            const form = document.getElementById('create-kb-form');
            if (form) {
                form.addEventListener('submit', (e) => {
                    e.preventDefault();
                    this.createKB();
                });
            }
            this.initIcons();
        }, 100);
    }

    createKB() {
        const name = document.getElementById('kb-name').value;
        const desc = document.getElementById('kb-desc').value;
        const category = document.getElementById('kb-category').value;

        if (!name) { alert('请输入知识库名称'); return; }

        const iconMap = {
            '技术': 'file-code', '产品': 'clipboard-list', '市场': 'bar-chart-3',
            '法律': 'scale', '医疗': 'heart-pulse', '金融': 'trending-up',
            '制造': 'cog', '科研': 'book-open', '其他': 'folder'
        };

        this.kbs.unshift({
            id: Date.now(), name, description: desc || '暂无描述',
            icon: iconMap[category] || 'folder', docCount: 0,
            updateTime: '刚刚', category,
            documents: [], coverage: { overall: 0, dimensions: {} },
            topKnowledge: [], pendingDimensions: [], alerts: []
        });

        this.renderKBList('', this.currentCategory);
        window.app.closeModal();
    }

    openKBDetail(id) {
        const kb = this.kbs.find(k => k.id === id);
        if (!kb) return;

        const content = `
            <div class="kb-detail-tabs">
                <div class="kb-tab active" data-tab="info" onclick="knowledgeBase.switchDetailTab(this, 'info', ${id})">基础信息</div>
                <div class="kb-tab" data-tab="docs" onclick="knowledgeBase.switchDetailTab(this, 'docs', ${id})">文档管理</div>
                <div class="kb-tab" data-tab="ops" onclick="knowledgeBase.switchDetailTab(this, 'ops', ${id})">运营面板</div>
            </div>
            <div class="kb-detail-content" id="kb-detail-content">
                ${this.renderInfoTab(kb)}
            </div>
        `;

        window.app.openModal('知识库详情 - ' + kb.name, content, { wide: true });
        this.initIcons();
    }

    switchDetailTab(tabEl, tab, id) {
        const kb = this.kbs.find(k => k.id === id);
        if (!kb) return;

        document.querySelectorAll('.kb-tab').forEach(t => t.classList.remove('active'));
        tabEl.classList.add('active');

        const contentEl = document.getElementById('kb-detail-content');
        if (!contentEl) return;

        if (tab === 'info') {
            contentEl.innerHTML = this.renderInfoTab(kb);
        } else if (tab === 'docs') {
            contentEl.innerHTML = this.renderDocsTab(kb);
        } else if (tab === 'ops') {
            contentEl.innerHTML = this.renderOpsTab(kb);
        }
        this.initIcons();
    }

    renderInfoTab(kb) {
        return `
            <div style="padding: 20px;">
                <div style="display: flex; align-items: center; gap: 16px; margin-bottom: 24px;">
                    <div style="width: 56px; height: 56px; border-radius: var(--radius-lg); background: var(--accent-light); color: var(--accent); display: flex; align-items: center; justify-content: center;">
                        <i data-lucide="${kb.icon}" style="width: 28px; height: 28px;"></i>
                    </div>
                    <div>
                        <h3 style="margin-bottom: 4px;">${kb.name}</h3>
                        <span style="font-size: 13px; color: var(--text-secondary);">${kb.description}</span>
                    </div>
                </div>
                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 24px;">
                    <div style="text-align: center; padding: 16px; background: var(--bg-secondary); border-radius: var(--radius-md);">
                        <div style="font-size: 24px; font-weight: 700; color: var(--accent);">${kb.docCount}</div>
                        <div style="font-size: 12px; color: var(--text-muted); margin-top: 4px;">文档数量</div>
                    </div>
                    <div style="text-align: center; padding: 16px; background: var(--bg-secondary); border-radius: var(--radius-md);">
                        <div style="font-size: 24px; font-weight: 700; color: var(--success);">${kb.coverage.overall}%</div>
                        <div style="font-size: 12px; color: var(--text-muted); margin-top: 4px;">知识覆盖度</div>
                    </div>
                    <div style="text-align: center; padding: 16px; background: var(--bg-secondary); border-radius: var(--radius-md);">
                        <div style="font-size: 24px; font-weight: 700; color: var(--warning);">${kb.category}</div>
                        <div style="font-size: 12px; color: var(--text-muted); margin-top: 4px;">分类标签</div>
                    </div>
                </div>
                <div style="margin-bottom: 16px;">
                    <div style="font-size: 14px; color: var(--text-secondary); margin-bottom: 8px;">最近更新</div>
                    <div style="font-size: 14px;">${kb.updateTime}</div>
                </div>
                <div style="display: flex; gap: 12px;">
                    <button class="btn btn-primary" onclick="knowledgeBase.editKB(${kb.id})"><i data-lucide="edit"></i> 编辑</button>
                    <button class="btn" style="background: var(--bg-secondary); color: var(--text-primary);" onclick="knowledgeBase.deleteKB(${kb.id})"><i data-lucide="trash-2"></i> 删除</button>
                </div>
            </div>
        `;
    }

    renderDocsTab(kb) {
        let docRows = kb.documents.map(doc => `
            <tr style="border-bottom: 1px solid var(--border);">
                <td style="padding: 12px 8px;">
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <i data-lucide="${doc.type === 'pdf' ? 'file-text' : doc.type === 'xlsx' ? 'table' : 'file'}" style="width: 16px; height: 16px; color: var(--accent);"></i>
                        <span style="font-size: 13px;">${doc.name}</span>
                    </div>
                </td>
                <td style="padding: 12px 8px; font-size: 12px; color: var(--text-muted);">${doc.size}</td>
                <td style="padding: 12px 8px; font-size: 12px; color: var(--text-muted);">${doc.uploadTime}</td>
                <td style="padding: 12px 8px;">
                    <button class="btn-icon" onclick="knowledgeBase.deleteDocument(${kb.id}, ${doc.id})" title="删除">
                        <i data-lucide="trash-2" style="width: 14px; height: 14px; color: var(--danger);"></i>
                    </button>
                </td>
            </tr>
        `).join('');

        return `
            <div style="padding: 20px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                    <span style="font-size: 14px; color: var(--text-secondary);">共 ${kb.documents.length} 个文档</span>
                    <button class="btn btn-sm btn-primary" onclick="knowledgeBase.uploadDocument(${kb.id})">
                        <i data-lucide="upload"></i> 上传文档
                    </button>
                </div>
                <table style="width: 100%; border-collapse: collapse;">
                    <thead>
                        <tr style="border-bottom: 1px solid var(--border);">
                            <th style="padding: 10px 8px; text-align: left; font-size: 12px; color: var(--text-muted); font-weight: 500;">文件名</th>
                            <th style="padding: 10px 8px; text-align: left; font-size: 12px; color: var(--text-muted); font-weight: 500;">大小</th>
                            <th style="padding: 10px 8px; text-align: left; font-size: 12px; color: var(--text-muted); font-weight: 500;">上传时间</th>
                            <th style="padding: 10px 8px; text-align: left; font-size: 12px; color: var(--text-muted); font-weight: 500;">操作</th>
                        </tr>
                    </thead>
                    <tbody>${docRows}</tbody>
                </table>
                ${kb.documents.length === 0 ? '<div style="text-align: center; padding: 40px; color: var(--text-muted);">暂无文档，点击上方按钮上传</div>' : ''}
            </div>
        `;
    }

    renderOpsTab(kb) {
        const cov = kb.coverage;
        let dimBars = '';
        if (cov.dimensions) {
            dimBars = Object.entries(cov.dimensions).map(([name, val]) => `
                <div style="margin-bottom: 12px;">
                    <div style="display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 4px;">
                        <span>${name}</span><span style="color: ${val >= 80 ? 'var(--success)' : val >= 60 ? 'var(--warning)' : 'var(--danger)'};">${val}%</span>
                    </div>
                    <div style="height: 6px; background: var(--bg-secondary); border-radius: 3px; overflow: hidden;">
                        <div style="width: ${val}%; height: 100%; background: ${val >= 80 ? 'var(--success)' : val >= 60 ? 'var(--warning)' : 'var(--danger)'}; border-radius: 3px; transition: width 0.5s ease;"></div>
                    </div>
                </div>
            `).join('');
        }

        let topList = kb.topKnowledge.map((item, i) => `
            <div style="display: flex; align-items: center; gap: 10px; padding: 8px 0; border-bottom: 1px solid var(--border);">
                <span style="width: 22px; height: 22px; border-radius: 50%; background: ${i < 3 ? 'var(--accent)' : 'var(--bg-secondary)'}; color: ${i < 3 ? 'white' : 'var(--text-muted)'}; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 600; flex-shrink: 0;">${i + 1}</span>
                <span style="font-size: 13px;">${item}</span>
            </div>
        `).join('');

        let pendingList = kb.pendingDimensions.map(d => `
            <div style="display: flex; align-items: center; gap: 8px; padding: 8px 12px; background: rgba(245,158,11,0.1); border-radius: var(--radius-sm); margin-bottom: 8px;">
                <i data-lucide="alert-triangle" style="width: 14px; height: 14px; color: var(--warning);"></i>
                <span style="font-size: 13px; color: var(--warning);">${d}</span>
            </div>
        `).join('');

        let alertList = kb.alerts.map(a => `
            <div style="display: flex; align-items: center; gap: 8px; padding: 10px 12px; background: ${a.type === 'duplicate' ? 'rgba(245,158,11,0.1)' : 'rgba(239,68,68,0.1)'}; border-radius: var(--radius-sm); margin-bottom: 8px;">
                <i data-lucide="${a.type === 'duplicate' ? 'copy' : 'alert-circle'}" style="width: 14px; height: 14px; color: ${a.type === 'duplicate' ? 'var(--warning)' : 'var(--danger)'};"></i>
                <span style="font-size: 13px; color: ${a.type === 'duplicate' ? 'var(--warning)' : 'var(--danger)'};">${a.text}</span>
            </div>
        `).join('');

        return `
            <div style="padding: 20px;">
                <div style="margin-bottom: 24px;">
                    <h4 style="font-size: 15px; margin-bottom: 16px;">知识覆盖度分析</h4>
                    <div style="display: flex; align-items: center; gap: 16px; margin-bottom: 16px;">
                        <div style="width: 80px; height: 80px; border-radius: 50%; border: 6px solid ${cov.overall >= 80 ? 'var(--success)' : cov.overall >= 60 ? 'var(--warning)' : 'var(--danger)'}; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                            <span style="font-size: 20px; font-weight: 700;">${cov.overall}%</span>
                        </div>
                        <span style="font-size: 13px; color: var(--text-secondary);">整体覆盖度</span>
                    </div>
                    ${dimBars}
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                    <div>
                        <h4 style="font-size: 15px; margin-bottom: 12px;">高频知识点 Top10</h4>
                        ${topList}
                    </div>
                    <div>
                        <h4 style="font-size: 15px; margin-bottom: 12px;">待补全维度</h4>
                        ${pendingList || '<span style="color: var(--text-muted); font-size: 13px;">暂无待补全维度</span>'}
                        <h4 style="font-size: 15px; margin: 20px 0 12px;">内容提醒</h4>
                        ${alertList || '<span style="color: var(--text-muted); font-size: 13px;">暂无提醒</span>'}
                    </div>
                </div>
            </div>
        `;
    }

    editKB(id) {
        const kb = this.kbs.find(k => k.id === id);
        if (!kb) return;

        const content = `
            <form id="edit-kb-form">
                <div class="form-group">
                    <label>知识库名称</label>
                    <input type="text" id="edit-kb-name" value="${kb.name}" required>
                </div>
                <div class="form-group">
                    <label>知识库描述</label>
                    <textarea id="edit-kb-desc">${kb.description}</textarea>
                </div>
                <div class="form-group">
                    <label>分类</label>
                    <select id="edit-kb-category">
                        <option value="技术" ${kb.category === '技术' ? 'selected' : ''}>技术</option>
                        <option value="产品" ${kb.category === '产品' ? 'selected' : ''}>产品</option>
                        <option value="市场" ${kb.category === '市场' ? 'selected' : ''}>市场</option>
                        <option value="法律" ${kb.category === '法律' ? 'selected' : ''}>法律</option>
                        <option value="医疗" ${kb.category === '医疗' ? 'selected' : ''}>医疗</option>
                        <option value="金融" ${kb.category === '金融' ? 'selected' : ''}>金融</option>
                        <option value="制造" ${kb.category === '制造' ? 'selected' : ''}>制造</option>
                        <option value="科研" ${kb.category === '科研' ? 'selected' : ''}>科研</option>
                        <option value="其他" ${kb.category === '其他' ? 'selected' : ''}>其他</option>
                    </select>
                </div>
                <button type="submit" class="btn btn-primary" style="width: 100%;"><i data-lucide="save"></i> 保存修改</button>
            </form>
        `;

        window.app.openModal('编辑知识库', content);
        setTimeout(() => {
            const form = document.getElementById('edit-kb-form');
            if (form) {
                form.addEventListener('submit', (e) => {
                    e.preventDefault();
                    kb.name = document.getElementById('edit-kb-name').value;
                    kb.description = document.getElementById('edit-kb-desc').value;
                    kb.category = document.getElementById('edit-kb-category').value;
                    this.renderKBList('', this.currentCategory);
                    window.app.closeModal();
                });
            }
            this.initIcons();
        }, 100);
    }

    deleteKB(id) {
        const kb = this.kbs.find(k => k.id === id);
        if (!kb) return;
        if (confirm(`确定要删除知识库 "${kb.name}" 吗？此操作不可恢复。`)) {
            this.kbs = this.kbs.filter(k => k.id !== id);
            this.renderKBList('', this.currentCategory);
            window.app.closeModal();
        }
    }

    deleteDocument(kbId, docId) {
        const kb = this.kbs.find(k => k.id === kbId);
        if (!kb) return;
        kb.documents = kb.documents.filter(d => d.id !== docId);
        kb.docCount = Math.max(0, kb.docCount - 1);
        this.openKBDetail(kbId);
    }

    uploadDocument(kbId) {
        const kb = this.kbs.find(k => k.id === kbId);
        if (!kb) return;
        const newDoc = {
            id: Date.now(),
            name: '新上传文档.pdf',
            size: '1.0 MB',
            uploadTime: new Date().toISOString().split('T')[0],
            type: 'pdf'
        };
        kb.documents.push(newDoc);
        kb.docCount++;
        kb.updateTime = '刚刚';
        this.openKBDetail(kbId);
    }

    showKBMenu(id) {
        const kb = this.kbs.find(k => k.id === id);
        if (!kb) return;
        const content = `
            <div style="padding: 8px;">
                <div class="recent-item" style="cursor: pointer; margin-bottom: 4px;" onclick="knowledgeBase.editKB(${id}); window.app.closeModal();">
                    <i data-lucide="edit" style="width: 16px; height: 16px;"></i>
                    <span style="font-size: 14px;">编辑知识库</span>
                </div>
                <div class="recent-item" style="cursor: pointer; margin-bottom: 4px;" onclick="knowledgeBase.openKBDetail(${id}); window.app.closeModal();">
                    <i data-lucide="eye" style="width: 16px; height: 16px;"></i>
                    <span style="font-size: 14px;">查看详情</span>
                </div>
                <div class="recent-item" style="cursor: pointer;" onclick="knowledgeBase.deleteKB(${id}); window.app.closeModal();">
                    <i data-lucide="trash-2" style="width: 16px; height: 16px; color: var(--danger);"></i>
                    <span style="font-size: 14px; color: var(--danger);">删除知识库</span>
                </div>
            </div>
        `;
        window.app.openModal(kb.name + ' - 操作', content);
        this.initIcons();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.knowledgeBase = new KnowledgeBase();
});
