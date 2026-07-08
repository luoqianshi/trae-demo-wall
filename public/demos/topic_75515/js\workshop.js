// ONE TOW MORE - 创意工坊模块

class WorkshopModule {
    constructor() {
        this.currentCategory = 'all';
        this.currentTab = 'market';
        this.favorites = new Set();
        this.purchased = [1, 4, 7];
        this.products = [
            {
                id: 1, name: '企业级知识管理套件', type: 'knowledge', category: '知识包',
                description: '包含8个预置知识库模板，覆盖技术、产品、市场等核心领域，即买即用',
                price: 299, originalPrice: 499, rating: 4.9, sales: 1234, author: 'ONE TOW MORE 官方',
                cover: 'package', coverColor: '#3B82F6',
                detail: '本套件包含企业知识管理所需的全部基础模板，涵盖技术文档、产品需求、市场调研、法律法规、医学文献、金融研报、制造工艺、科研文献八大领域。每个知识库均预置分类体系、文档模板和运营面板配置。',
                demo: '支持在线预览效果演示，购买后可直接导入到您的知识库中。',
                versions: [
                    { ver: 'v1.0', date: '2025-06', note: '初始发布，包含6个模板' },
                    { ver: 'v2.0', date: '2026-01', note: '新增制造工艺和科研文献模板' },
                    { ver: 'v2.1', date: '2026-05', note: '优化运营面板，新增覆盖度分析' }
                ],
                reviews: [
                    { user: '张经理', score: 5, text: '非常实用，节省了大量初始化时间', time: '2026-06-10' },
                    { user: '李工', score: 5, text: '模板质量很高，分类体系设计合理', time: '2026-06-08' }
                ]
            },
            {
                id: 2, name: '智能文档处理 Skill 包', type: 'skill', category: 'Skill',
                description: '包含文档分类、摘要生成、合同审查3个高级 Skill，大幅提升文档处理效率',
                price: 199, originalPrice: 399, rating: 4.8, sales: 876, author: 'ONE TOW MORE 官方',
                cover: 'zap', coverColor: '#8B5CF6',
                detail: '三个经过深度优化的 Skill 组合，支持 PDF、Word、Markdown 等多种格式，准确率超过 95%。',
                demo: '可在线体验文档分类和摘要生成的效果。',
                versions: [
                    { ver: 'v1.0', date: '2025-09', note: '初始发布' },
                    { ver: 'v1.5', date: '2026-04', note: '准确率提升至95%+' }
                ],
                reviews: [
                    { user: '王主管', score: 5, text: '处理效率提升了3倍', time: '2026-06-12' },
                    { user: '赵助理', score: 4, text: '合同审查功能很实用', time: '2026-06-05' }
                ]
            },
            {
                id: 3, name: '数据分析 Agent 任务流', type: 'template', category: '任务模板',
                description: '预置5种常见数据分析任务模板，一键启动自动化分析流程',
                price: 149, originalPrice: 249, rating: 4.7, sales: 567, author: '数据工坊',
                cover: 'workflow', coverColor: '#10B981',
                detail: '包含数据清洗、特征工程、可视化报告、异常检测、趋势预测五种任务模板。',
                demo: '支持在线预览任务配置和执行效果。',
                versions: [
                    { ver: 'v1.0', date: '2026-02', note: '初始发布' },
                    { ver: 'v1.2', date: '2026-05', note: '新增趋势预测模板' }
                ],
                reviews: [
                    { user: '陈分析师', score: 5, text: '模板设计很专业，参数可灵活调整', time: '2026-06-14' }
                ]
            },
            {
                id: 4, name: '医疗行业知识包', type: 'knowledge', category: '知识包',
                description: '专为医疗行业定制的知识库模板，包含临床指南、药物信息、诊疗规范',
                price: 399, originalPrice: 599, rating: 4.9, sales: 432, author: '医疗AI团队',
                cover: 'heart-pulse', coverColor: '#EF4444',
                detail: '覆盖内科、外科、儿科、妇产科等主要科室的临床指南和诊疗规范，药物数据库包含5000+种药品信息。',
                demo: '提供部分免费样本供预览。',
                versions: [
                    { ver: 'v1.0', date: '2025-11', note: '初始发布' },
                    { ver: 'v2.0', date: '2026-04', note: '新增药物相互作用数据库' }
                ],
                reviews: [
                    { user: '刘医生', score: 5, text: '临床指南更新很及时', time: '2026-06-11' },
                    { user: '周主任', score: 5, text: '药物查询功能非常方便', time: '2026-06-03' }
                ]
            },
            {
                id: 5, name: '多语言翻译 Skill', type: 'skill', category: 'Skill',
                description: '支持100+语种互译的专业翻译 Skill，特别优化了技术文档翻译准确率',
                price: 99, originalPrice: 199, rating: 4.6, sales: 2100, author: '翻译工坊',
                cover: 'languages', coverColor: '#06B6D4',
                detail: '基于大模型的专业翻译 Skill，针对技术文档、法律文件、医学文献等领域进行了专项优化。',
                demo: '支持在线翻译体验。',
                versions: [
                    { ver: 'v1.0', date: '2025-08', note: '支持20种语言' },
                    { ver: 'v2.0', date: '2026-01', note: '扩展至100+语种' }
                ],
                reviews: [
                    { user: '孙翻译', score: 4, text: '技术文档翻译质量不错', time: '2026-06-09' }
                ]
            },
            {
                id: 6, name: '竞品监控任务模板', type: 'template', category: '任务模板',
                description: '自动化竞品监控任务，定期抓取竞品动态并生成分析报告',
                price: 179, originalPrice: 299, rating: 4.5, sales: 345, author: '市场智能',
                cover: 'radar', coverColor: '#F59E0B',
                detail: '支持配置监控频率、数据源、分析维度，自动生成竞品动态周报/月报。',
                demo: '提供配置界面预览。',
                versions: [
                    { ver: 'v1.0', date: '2026-03', note: '初始发布' }
                ],
                reviews: [
                    { user: '吴经理', score: 5, text: '竞品动态掌握更及时了', time: '2026-06-13' }
                ]
            },
            {
                id: 7, name: '金融风控知识包', type: 'knowledge', category: '知识包',
                description: '金融行业专属知识库，涵盖风险评估、合规要求、监管政策',
                price: 349, originalPrice: 549, rating: 4.8, sales: 289, author: '金融AI',
                cover: 'shield', coverColor: '#EC4899',
                detail: '包含银行业、证券业、保险业的监管政策和合规要求，以及信用风险评估模型说明。',
                demo: '提供样本数据预览。',
                versions: [
                    { ver: 'v1.0', date: '2025-12', note: '初始发布' },
                    { ver: 'v1.5', date: '2026-05', note: '新增2026年最新监管政策' }
                ],
                reviews: [
                    { user: '郑风控', score: 5, text: '合规检查效率大幅提升', time: '2026-06-15' }
                ]
            },
            {
                id: 8, name: '情感分析 Skill', type: 'skill', category: 'Skill',
                description: '细粒度情感分析 Skill，支持观点抽取、情感倾向判断和舆情监控',
                price: 129, originalPrice: 229, rating: 4.5, sales: 678, author: 'NLP工坊',
                cover: 'heart', coverColor: '#F43F5E',
                detail: '支持中英文情感分析，可识别正面/负面/中性情感，提取关键观点和情感词。',
                demo: '提供在线文本分析体验。',
                versions: [
                    { ver: 'v1.0', date: '2025-10', note: '基础情感分类' },
                    { ver: 'v1.4', date: '2026-05', note: '新增观点抽取' }
                ],
                reviews: [
                    { user: '黄运营', score: 4, text: '舆情监控很好用', time: '2026-06-07' }
                ]
            },
            {
                id: 9, name: '制造行业知识包', type: 'knowledge', category: '知识包',
                description: '制造业专属知识库模板，涵盖生产工艺、质量控制、设备管理',
                price: 259, originalPrice: 399, rating: 4.7, sales: 198, author: '工业AI',
                cover: 'cog', coverColor: '#14B8A6',
                detail: '包含SMT、注塑、冲压等主要工艺流程模板，以及六西格玛、5S管理等质量管理工具。',
                demo: '提供工艺流程图预览。',
                versions: [
                    { ver: 'v1.0', date: '2026-01', note: '初始发布' }
                ],
                reviews: [
                    { user: '钱工程师', score: 5, text: '工艺参数库很全面', time: '2026-06-06' }
                ]
            },
            {
                id: 10, name: '内容生成 Agent 流', type: 'template', category: '任务模板',
                description: '自动化内容生成任务流，支持文章、报告、摘要等多种内容类型',
                price: 159, originalPrice: 259, rating: 4.6, sales: 456, author: '内容工坊',
                cover: 'pen-tool', coverColor: '#A855F7',
                detail: '支持配置生成风格、长度、格式等参数，可对接知识库进行基于事实的内容生成。',
                demo: '提供生成效果预览。',
                versions: [
                    { ver: 'v1.0', date: '2026-02', note: '初始发布' },
                    { ver: 'v1.3', date: '2026-05', note: '新增多风格模板' }
                ],
                reviews: [
                    { user: '冯编辑', score: 4, text: '报告生成效率提升明显', time: '2026-06-12' }
                ]
            },
            {
                id: 11, name: '知识图谱构建 Skill', type: 'skill', category: 'Skill',
                description: '从非结构化文本自动构建知识图谱，支持实体识别和关系抽取',
                price: 249, originalPrice: 399, rating: 4.7, sales: 534, author: '图谱工坊',
                cover: 'share-2', coverColor: '#6366F1',
                detail: '支持中英文实体识别，可抽取人物、组织、地点、事件等多种实体类型及其关系。',
                demo: '提供图谱构建效果演示。',
                versions: [
                    { ver: 'v1.0', date: '2025-07', note: '基础实体抽取' },
                    { ver: 'v1.5', date: '2026-03', note: '新增关系类型识别' }
                ],
                reviews: [
                    { user: '褚研究员', score: 5, text: '实体识别准确率很高', time: '2026-06-10' }
                ]
            },
            {
                id: 12, name: '科研项目任务模板', type: 'template', category: '任务模板',
                description: '面向科研场景的任务模板，支持文献检索、数据分析和论文辅助',
                price: 189, originalPrice: 319, rating: 4.8, sales: 267, author: '学术工坊',
                cover: 'graduation-cap', coverColor: '#0EA5E9',
                detail: '包含文献综述生成、实验数据分析、论文格式检查三种科研辅助任务模板。',
                demo: '提供任务执行效果预览。',
                versions: [
                    { ver: 'v1.0', date: '2026-04', note: '初始发布' }
                ],
                reviews: [
                    { user: '卫博士', score: 5, text: '文献综述生成质量很高', time: '2026-06-14' }
                ]
            }
        ];
        this.init();
    }

    init() {
        this.renderWorkshopList();
        this.initEventListeners();
    }

    renderWorkshopList(category = 'all') {
        const container = document.getElementById('workshop-list');
        if (!container) return;

        let filtered = this.products;
        if (category && category !== 'all') {
            filtered = filtered.filter(p => p.category === category);
        }

        container.innerHTML = filtered.map(product => `
            <div class="workshop-card" data-id="${product.id}" style="background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-lg); overflow: hidden; cursor: pointer; transition: var(--transition);">
                <div style="height: 140px; background: linear-gradient(135deg, ${product.coverColor}30, ${product.coverColor}10); display: flex; align-items: center; justify-content: center;">
                    <i data-lucide="${product.cover}" style="width: 48px; height: 48px; color: ${product.coverColor};"></i>
                </div>
                <div style="padding: 16px;">
                    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                        <span style="padding: 2px 8px; border-radius: 9999px; font-size: 11px; background: ${product.coverColor}20; color: ${product.coverColor};">${product.category}</span>
                        <span style="font-size: 11px; color: var(--text-muted);">by ${product.author}</span>
                    </div>
                    <h4 style="font-size: 15px; font-weight: 600; margin-bottom: 6px;">${product.name}</h4>
                    <p style="font-size: 13px; color: var(--text-secondary); margin-bottom: 12px; line-height: 1.5; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">${product.description}</p>
                    <div style="display: flex; align-items: center; justify-content: space-between;">
                        <div style="display: flex; align-items: baseline; gap: 8px;">
                            <span style="font-size: 20px; font-weight: 700; color: var(--accent);">&yen;${product.price}</span>
                            ${product.originalPrice ? `<span style="font-size: 13px; color: var(--text-muted); text-decoration: line-through;">&yen;${product.originalPrice}</span>` : ''}
                        </div>
                        <div style="display: flex; align-items: center; gap: 12px; font-size: 12px; color: var(--text-muted);">
                            <span><i data-lucide="star" style="width: 12px; height: 12px; color: var(--warning);"></i> ${product.rating}</span>
                            <span>${product.sales} 已购</span>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');

        container.querySelectorAll('.workshop-card').forEach(card => {
            card.addEventListener('click', () => this.openProductDetail(parseInt(card.dataset.id)));
            card.addEventListener('mouseover', () => { card.style.borderColor = 'var(--border-hover)'; card.style.transform = 'translateY(-4px)'; card.style.boxShadow = 'var(--shadow-lg)'; });
            card.addEventListener('mouseout', () => { card.style.borderColor = 'var(--border)'; card.style.transform = 'none'; card.style.boxShadow = 'none'; });
        });

        this.initIcons();
    }

    initEventListeners() {
        const catBtns = document.querySelectorAll('.workshop-category');
        catBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                catBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.currentCategory = btn.dataset.category;
                this.renderWorkshopList(this.currentCategory);
            });
        });

        const tabs = document.querySelectorAll('.workshop-tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                this.currentTab = tab.dataset.tab;
                if (this.currentTab === 'purchased') {
                    this.renderPurchasedList();
                } else {
                    this.renderWorkshopList(this.currentCategory);
                }
            });
        });
    }

    renderPurchasedList() {
        const container = document.getElementById('workshop-list');
        if (!container) return;

        const purchased = this.products.filter(p => this.purchased.includes(p.id));
        if (purchased.length === 0) {
            container.innerHTML = '<div style="text-align: center; padding: 60px; color: var(--text-muted);">暂无已购商品</div>';
            return;
        }

        container.innerHTML = purchased.map(product => `
            <div class="workshop-card" data-id="${product.id}" style="background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-lg); overflow: hidden; cursor: pointer; transition: var(--transition);">
                <div style="height: 140px; background: linear-gradient(135deg, ${product.coverColor}30, ${product.coverColor}10); display: flex; align-items: center; justify-content: center; position: relative;">
                    <i data-lucide="${product.cover}" style="width: 48px; height: 48px; color: ${product.coverColor};"></i>
                    <span style="position: absolute; top: 12px; right: 12px; padding: 4px 10px; background: var(--success); color: white; border-radius: 9999px; font-size: 11px;">已购买</span>
                </div>
                <div style="padding: 16px;">
                    <h4 style="font-size: 15px; font-weight: 600; margin-bottom: 6px;">${product.name}</h4>
                    <p style="font-size: 13px; color: var(--text-secondary); margin-bottom: 12px;">${product.description}</p>
                    <button class="btn btn-sm btn-primary" onclick="event.stopPropagation(); alert('正在导入...');">导入使用</button>
                </div>
            </div>
        `).join('');

        this.initIcons();
    }

    openProductDetail(id) {
        const product = this.products.find(p => p.id === id);
        if (!product) return;

        const isPurchased = this.purchased.includes(id);
        const isFav = this.favorites.has(id);

        let versionHtml = (product.versions || []).map(v => `
            <div style="display: flex; gap: 12px; padding: 8px 0; border-bottom: 1px solid var(--border); font-size: 13px;">
                <span style="color: var(--accent); font-weight: 600; flex-shrink: 0;">${v.ver}</span>
                <span style="color: var(--text-muted); flex-shrink: 0;">${v.date}</span>
                <span>${v.note}</span>
            </div>
        `).join('');

        let reviewHtml = (product.reviews || []).map(r => `
            <div style="padding: 12px; background: var(--bg-secondary); border-radius: var(--radius-md); margin-bottom: 8px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
                    <span style="font-size: 13px; font-weight: 500;">${r.user}</span>
                    <span style="font-size: 12px; color: var(--warning);">${'★'.repeat(r.score)}${'☆'.repeat(5 - r.score)}</span>
                </div>
                <p style="font-size: 13px; color: var(--text-secondary);">${r.text}</p>
                <span style="font-size: 11px; color: var(--text-muted);">${r.time}</span>
            </div>
        `).join('');

        const content = `
            <div style="padding: 20px;">
                <div style="height: 120px; background: linear-gradient(135deg, ${product.coverColor}30, ${product.coverColor}10); border-radius: var(--radius-md); display: flex; align-items: center; justify-content: center; margin-bottom: 20px;">
                    <i data-lucide="${product.cover}" style="width: 56px; height: 56px; color: ${product.coverColor};"></i>
                </div>

                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                    <span style="padding: 2px 8px; border-radius: 9999px; font-size: 11px; background: ${product.coverColor}20; color: ${product.coverColor};">${product.category}</span>
                    <span style="font-size: 12px; color: var(--text-muted);">by ${product.author}</span>
                </div>

                <h3 style="margin-bottom: 12px;">${product.name}</h3>
                <p style="font-size: 14px; color: var(--text-secondary); margin-bottom: 16px; line-height: 1.6;">${product.detail}</p>

                <div style="display: flex; align-items: center; gap: 16px; margin-bottom: 20px; padding: 16px; background: var(--bg-secondary); border-radius: var(--radius-md);">
                    <div style="display: flex; align-items: baseline; gap: 8px;">
                        <span style="font-size: 28px; font-weight: 700; color: var(--accent);">&yen;${product.price}</span>
                        ${product.originalPrice ? `<span style="font-size: 14px; color: var(--text-muted); text-decoration: line-through;">&yen;${product.originalPrice}</span>` : ''}
                    </div>
                    <div style="display: flex; gap: 16px; font-size: 13px; color: var(--text-muted);">
                        <span><i data-lucide="star" style="width: 14px; height: 14px; color: var(--warning);"></i> ${product.rating}</span>
                        <span><i data-lucide="shopping-cart" style="width: 14px; height: 14px;"></i> ${product.sales} 已购</span>
                    </div>
                </div>

                <div style="margin-bottom: 20px;">
                    <h4 style="margin-bottom: 12px; font-size: 14px;">效果演示</h4>
                    <p style="font-size: 13px; color: var(--text-secondary); padding: 12px; background: var(--bg-secondary); border-radius: var(--radius-md);">${product.demo}</p>
                </div>

                <div style="margin-bottom: 20px;">
                    <h4 style="margin-bottom: 12px; font-size: 14px;">版本记录</h4>
                    ${versionHtml}
                </div>

                <div style="margin-bottom: 20px;">
                    <h4 style="margin-bottom: 12px; font-size: 14px;">用户评价</h4>
                    ${reviewHtml}
                </div>

                <div style="display: flex; gap: 12px;">
                    ${isPurchased
                        ? '<button class="btn btn-primary" style="flex: 1;" onclick="alert(\'正在导入...\');"><i data-lucide="download"></i> 导入使用</button>'
                        : `<button class="btn btn-primary" style="flex: 1;" onclick="workshopModule.purchaseProduct(${id})"><i data-lucide="shopping-cart"></i> 立即购买 &yen;${product.price}</button>
                           <button class="btn" style="background: var(--bg-secondary); color: var(--text-primary);" onclick="workshopModule.trialProduct(${id})"><i data-lucide="play"></i> 免费试用</button>`
                    }
                    <button class="btn-icon" onclick="workshopModule.toggleFavorite(${id})" title="${isFav ? '取消收藏' : '收藏'}" style="border: 1px solid var(--border); border-radius: var(--radius-sm);">
                        <i data-lucide="${isFav ? 'heart' : 'heart'}" style="width: 18px; height: 18px; color: ${isFav ? 'var(--danger)' : 'var(--text-muted)'};"></i>
                    </button>
                </div>
            </div>
        `;

        window.app.openModal(product.name, content, { extraWide: true });
        this.initIcons();
    }

    purchaseProduct(id) {
        this.purchased.push(id);
        alert('购买成功！已添加到您的已购列表。');
        window.app.closeModal();
    }

    trialProduct(id) {
        alert('试用已开通！有效期7天。');
    }

    toggleFavorite(id) {
        if (this.favorites.has(id)) {
            this.favorites.delete(id);
            alert('已取消收藏');
        } else {
            this.favorites.add(id);
            alert('已添加收藏');
        }
        window.app.closeModal();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.workshopModule = new WorkshopModule();
});
