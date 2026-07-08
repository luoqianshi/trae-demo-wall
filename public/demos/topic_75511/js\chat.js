// ONE TOW MORE - AI 智能问答模块

class ChatModule {
    constructor() {
        this.currentChat = null;
        this.selectedKBs = [];
        this.chats = [
            {
                id: 1, title: '技术架构讨论', preview: '关于微服务架构的最佳实践...',
                messages: [
                    { role: 'user', content: '请介绍一下微服务架构的最佳实践' },
                    { role: 'ai', content: '微服务架构的最佳实践包括：\n\n**1. 服务拆分原则**\n- 按业务领域拆分（DDD领域驱动设计）\n- 单一职责原则，每个服务专注一个业务能力\n- 服务间松耦合、高内聚\n\n**2. 通信机制**\n- 同步通信：REST API、gRPC\n- 异步通信：消息队列（Kafka、RabbitMQ）\n- 事件驱动架构（EDA）\n\n**3. 数据管理**\n- 每个服务独立数据库（Database per Service）\n- 避免分布式事务，采用Saga模式\n- 最终一致性策略\n\n**4. 部署与运维**\n- 容器化部署（Docker + Kubernetes）\n- CI/CD自动化流水线\n- 服务网格（Service Mesh）\n\n> 来源：技术文档库 - 微服务架构设计规范 v3.0' },
                    { role: 'user', content: '服务网格具体怎么选型？' },
                    { role: 'ai', content: '主流服务网格方案对比：\n\n**Istio**\n- 功能最全面，社区最活跃\n- 支持流量管理、安全、可观测性\n- 学习曲线较陡，资源开销较大\n\n**Linkerd**\n- 轻量级，性能优秀\n- 部署简单，运维成本低\n- 功能相对精简\n\n**Consul Connect**\n- 与Consul生态深度集成\n- 适合已有Consul基础设施的团队\n\n> 来源：技术文档库 - Kubernetes 部署手册' }
                ]
            },
            {
                id: 2, title: '数据分析咨询', preview: '如何分析用户行为数据？',
                messages: [
                    { role: 'user', content: '如何分析用户行为数据？' },
                    { role: 'ai', content: '用户行为数据分析可以从以下几个维度进行：\n\n**1. 用户路径分析**\n- 漏斗分析：转化率各环节流失\n- 留存分析：次日/7日/30日留存\n- 转化分析：关键行为转化路径\n\n**2. 行为模式识别**\n- 聚类分析：用户分群\n- 关联规则挖掘：行为关联性\n- 时序分析：行为周期性\n\n**3. 数据采集方案**\n- 埋点方案设计\n- 事件模型定义\n- 数据质量监控\n\n> 来源：市场调研库 - 用户满意度调研结果' }
                ]
            },
            {
                id: 3, title: '产品方案评估', preview: '新功能的技术可行性分析',
                messages: [
                    { role: 'user', content: '评估一下AI助手功能的技术可行性' },
                    { role: 'ai', content: 'AI助手功能的技术可行性分析：\n\n**技术架构**\n- 前端：React/Vue + WebSocket实时通信\n- 后端：Node.js/Python FastAPI\n- AI模型：GPT-4 / Claude API + RAG检索增强\n\n**核心功能评估**\n| 功能 | 可行性 | 工期 |\n|------|--------|------|\n| 自然语言理解 | 高 | 2周 |\n| 上下文记忆 | 中 | 3周 |\n| 知识库检索 | 高 | 2周 |\n| 多轮对话 | 中 | 3周 |\n\n**风险点**\n- API调用成本控制\n- 响应延迟优化\n- 内容安全过滤\n\n> 来源：产品需求库 - V2.5版本需求规格说明书' }
                ]
            },
            {
                id: 4, title: '法规合规咨询', preview: '数据安全法对企业的影响',
                messages: [
                    { role: 'user', content: '数据安全法对我们企业有什么具体影响？' },
                    { role: 'ai', content: '《数据安全法》对企业的核心影响：\n\n**1. 数据分类分级义务**\n- 建立数据分类分级制度\n- 识别重要数据和核心数据\n- 制定相应的保护措施\n\n**2. 数据安全保护义务**\n- 建立健全数据安全管理制度\n- 配备数据安全管理人员\n- 定期开展风险评估\n\n**3. 数据出境限制**\n- 重要数据出境需安全评估\n- 个人信息出境需满足条件\n- 关键信息基础设施运营者特殊要求\n\n**4. 法律责任**\n- 违规最高罚款5000万元\n- 直接责任人个人责任\n- 吊销相关业务许可\n\n> 来源：法律法规库 - 个人信息保护法解读' }
                ]
            },
            {
                id: 5, title: '竞品对比分析', preview: '主流竞品功能特性对比',
                messages: [
                    { role: 'user', content: '帮我对比一下市场上主流的AI知识管理平台' },
                    { role: 'ai', content: '主流AI知识管理平台对比分析：\n\n**平台A - Notion AI**\n- 优势：文档协作体验好，AI集成自然\n- 劣势：知识图谱能力弱，企业级功能不足\n- 适合：中小团队\n\n**平台B - Confluence + AI**\n- 优势：企业级权限管理，Jira集成\n- 劣势：AI能力较新，智能化程度有限\n- 适合：大型企业\n\n**平台C - 飞书知识库**\n- 优势：国产化，IM集成好，审批流程完善\n- 劣势：AI问答准确率有待提升\n- 适合：国内企业\n\n**ONE TOW MORE 差异化优势**\n- 多知识库融合问答\n- Skill自动进化机制\n- Agent任务编排\n- 知识运营面板\n\n> 来源：市场调研库 - 竞品功能对比矩阵' }
                ]
            }
        ];
        this.init();
    }

    init() {
        this.renderChatList();
        this.renderMessages();
        this.initEventListeners();
    }

    renderChatList() {
        const chatList = document.getElementById('chat-list');
        if (!chatList) return;

        chatList.innerHTML = this.chats.map(chat => `
            <div class="chat-item ${this.currentChat && this.currentChat.id === chat.id ? 'active' : ''}" data-id="${chat.id}">
                <div class="chat-item-title">${chat.title}</div>
                <div class="chat-item-preview">${chat.preview}</div>
            </div>
        `).join('');

        chatList.querySelectorAll('.chat-item').forEach(item => {
            item.addEventListener('click', () => this.loadChat(parseInt(item.dataset.id)));
        });
    }

    loadChat(id) {
        const chat = this.chats.find(c => c.id === id);
        if (!chat) return;
        this.currentChat = chat;
        this.renderChatList();
        this.renderMessages();
    }

    renderMessages() {
        const container = document.getElementById('chat-messages');
        if (!container) return;

        if (!this.currentChat) {
            container.innerHTML = `
                <div class="welcome-message">
                    <i data-lucide="sparkles" class="welcome-icon"></i>
                    <h3>ONE TOW MORE AI 助手</h3>
                    <p>基于您的企业知识库，为您提供精准的智能问答服务</p>
                    <div class="quick-actions">
                        <button class="quick-action-btn" data-prompt="总结最近的技术文档">总结技术文档</button>
                        <button class="quick-action-btn" data-prompt="查找关于机器学习的资料">查找机器学习资料</button>
                        <button class="quick-action-btn" data-prompt="分析上季度的财务报告">分析财务报告</button>
                        <button class="quick-action-btn" data-prompt="对比主流竞品的功能差异">竞品功能对比</button>
                    </div>
                </div>
            `;
            this.initQuickActions();
            this.initIcons();
            return;
        }

        container.innerHTML = this.currentChat.messages.map((msg, idx) => `
            <div class="message">
                <div class="message-avatar ${msg.role}">
                    <i data-lucide="${msg.role === 'user' ? 'user' : 'bot'}"></i>
                </div>
                <div class="message-content ${msg.role}">
                    ${this.formatMessage(msg.content)}
                    ${msg.role === 'ai' ? `
                        <div class="msg-actions" style="display: flex; gap: 8px; margin-top: 10px; padding-top: 10px; border-top: 1px solid var(--border);">
                            <button class="tool-btn" onclick="chatModule.copyMessage(${idx})" title="复制"><i data-lucide="copy" style="width: 13px; height: 13px;"></i></button>
                            <button class="tool-btn" onclick="chatModule.regenerateMessage(${idx})" title="重新生成"><i data-lucide="refresh-cw" style="width: 13px; height: 13px;"></i></button>
                            <button class="tool-btn" onclick="chatModule.rateMessage(${idx}, 'up')" title="有帮助"><i data-lucide="thumbs-up" style="width: 13px; height: 13px;"></i></button>
                            <button class="tool-btn" onclick="chatModule.rateMessage(${idx}, 'down')" title="待改进"><i data-lucide="thumbs-down" style="width: 13px; height: 13px;"></i></button>
                            <button class="tool-btn" onclick="chatModule.archiveToKB(${idx})" title="归档到知识库"><i data-lucide="archive" style="width: 13px; height: 13px;"></i></button>
                        </div>
                    ` : ''}
                </div>
            </div>
        `).join('');

        container.scrollTop = container.scrollHeight;
        this.initIcons();
    }

    formatMessage(content) {
        return content
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/>(.*?)$/gm, '<div style="padding: 8px 12px; margin-top: 8px; background: var(--accent-light); border-left: 3px solid var(--accent); border-radius: 0 var(--radius-sm) var(--radius-sm) 0; font-size: 12px; color: var(--text-secondary);">$1</div>')
            .replace(/\n/g, '<br>');
    }

    initEventListeners() {
        const sendBtn = document.getElementById('send-btn');
        const chatInput = document.getElementById('chat-input');

        if (sendBtn) {
            sendBtn.addEventListener('click', () => this.sendMessage());
        }

        if (chatInput) {
            chatInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.sendMessage();
                }
            });
            chatInput.addEventListener('input', () => {
                chatInput.style.height = 'auto';
                chatInput.style.height = Math.min(chatInput.scrollHeight, 120) + 'px';
            });
        }

        const newChatBtn = document.getElementById('new-chat-btn');
        if (newChatBtn) {
            newChatBtn.addEventListener('click', () => this.createNewChat());
        }

        const kbSelectBtn = document.getElementById('kb-select-btn');
        if (kbSelectBtn) {
            kbSelectBtn.addEventListener('click', () => this.showKBSelector());
        }

        const uploadBtn = document.getElementById('upload-btn');
        if (uploadBtn) {
            uploadBtn.addEventListener('click', () => this.showUploadModal());
        }

        this.initQuickActions();
    }

    initQuickActions() {
        document.querySelectorAll('.quick-action-btn').forEach(btn => {
            btn.onclick = () => {
                const prompt = btn.dataset.prompt;
                if (prompt) {
                    const chatInput = document.getElementById('chat-input');
                    if (chatInput) {
                        chatInput.value = prompt;
                        this.sendMessage();
                    }
                }
            };
        });
    }

    sendMessage() {
        const chatInput = document.getElementById('chat-input');
        if (!chatInput) return;

        const message = chatInput.value.trim();
        if (!message) return;

        if (!this.currentChat) {
            this.createNewChat(message);
            return;
        }

        this.currentChat.messages.push({ role: 'user', content: message });
        this.currentChat.preview = message.substring(0, 30) + '...';
        chatInput.value = '';
        chatInput.style.height = 'auto';

        this.renderMessages();
        this.renderChatList();
        this.simulateAIResponse();
    }

    simulateAIResponse() {
        const container = document.getElementById('chat-messages');
        const loadingId = 'loading-' + Date.now();

        const loadingHtml = `
            <div class="message" id="${loadingId}">
                <div class="message-avatar ai">
                    <i data-lucide="bot"></i>
                </div>
                <div class="message-content ai">
                    <div class="loading-dots">
                        <span></span><span></span><span></span>
                    </div>
                </div>
            </div>
        `;

        container.insertAdjacentHTML('beforeend', loadingHtml);
        container.scrollTop = container.scrollHeight;
        this.initIcons();

        setTimeout(() => {
            const loadingEl = document.getElementById(loadingId);
            if (loadingEl) loadingEl.remove();

            const response = this.generateRichResponse();
            this.currentChat.messages.push({ role: 'ai', content: response });
            this.renderMessages();
        }, 1500);
    }

    generateRichResponse() {
        const responses = [
            '根据您的知识库内容，我为您整理了以下信息：\n\n**核心要点**\n- 知识管理是企业数字化转型的关键环节\n- AI 技术可以大幅提升知识检索效率（提升约 300%）\n- 构建知识图谱有助于发现隐性知识关联\n\n**建议行动**\n1. 梳理现有知识资产，建立统一分类体系\n2. 引入 RAG（检索增强生成）技术提升问答质量\n3. 设立知识运营岗位，持续维护知识库质量\n4. 建立知识贡献激励机制\n\n**预期效果**\n- 知识检索时间从平均 15 分钟降至 30 秒\n- 新员工入职培训周期缩短 40%\n- 重复问题减少 60%\n\n> 来源：技术文档库、市场调研库',
            '这是一个很好的问题。基于我检索到的相关资料：\n\n**现状分析**\n当前企业知识管理面临的主要挑战：\n- 知识分散在多个系统中，形成信息孤岛\n- 检索效率低下，平均查找时间超过 15 分钟\n- 知识更新不及时，约 30% 的文档已过时\n- 缺乏有效的知识共享机制\n\n**解决方案**\n建议采用 ONE TOW MORE 智能知识中台：\n1. **统一采集**：多源数据自动采集和清洗\n2. **智能标签**：AI 自动打标，建立知识分类体系\n3. **语义检索**：基于向量数据库的语义级搜索\n4. **智能问答**：多知识库融合的 RAG 问答系统\n5. **知识运营**：覆盖度分析、质量监控、自动提醒\n\n> 来源：市场调研库 - 2026年AI行业趋势报告',
            '我查阅了您的知识库，发现以下相关信息：\n\n**关键数据**\n- 技术文档库包含 234 个文档，覆盖 6 大技术领域\n- 微服务相关内容占比 35%，是最大的知识板块\n- 最近更新的文档集中在云原生和 AI 方向\n- 知识覆盖度整体 78%，安全规范和测试策略需补全\n\n**详细分析**\n基于这些数据，我建议：\n1. **优先补全**：安全规范（当前 55%）和测试策略（当前 42%）\n2. **重点更新**：容器化和 Kubernetes 实践案例\n3. **新增内容**：Service Mesh 实战经验、GitOps 工作流\n4. **知识整合**：将分散的 DevOps 文档统一归入技术文档库\n\n> 来源：技术文档库 - 运营面板数据'
        ];

        return responses[Math.floor(Math.random() * responses.length)];
    }

    createNewChat(firstMessage = null) {
        const newChat = {
            id: Date.now(),
            title: firstMessage ? firstMessage.substring(0, 20) + '...' : '新对话',
            preview: firstMessage || '开始新的对话...',
            messages: []
        };

        this.chats.unshift(newChat);
        this.currentChat = newChat;
        this.renderChatList();

        if (firstMessage) {
            this.currentChat.messages.push({ role: 'user', content: firstMessage });
            this.renderMessages();
            this.simulateAIResponse();
        } else {
            this.renderMessages();
        }
    }

    copyMessage(idx) {
        if (!this.currentChat) return;
        const msg = this.currentChat.messages[idx];
        if (msg) {
            navigator.clipboard.writeText(msg.content).then(() => {
                alert('已复制到剪贴板');
            }).catch(() => {
                alert('复制失败，请手动复制');
            });
        }
    }

    regenerateMessage(idx) {
        if (!this.currentChat) return;
        const msg = this.currentChat.messages[idx];
        if (msg && msg.role === 'ai') {
            msg.content = this.generateRichResponse();
            this.renderMessages();
        }
    }

    rateMessage(idx, type) {
        if (!this.currentChat) return;
        const msg = this.currentChat.messages[idx];
        if (msg) {
            msg.rating = type;
            alert(type === 'up' ? '感谢您的正面反馈！' : '感谢反馈，我们会持续改进。');
        }
    }

    archiveToKB(idx) {
        if (!this.currentChat) return;
        const msg = this.currentChat.messages[idx];
        if (!msg) return;

        const kbs = window.knowledgeBase ? window.knowledgeBase.kbs : [];
        const content = `
            <form id="archive-form">
                <div class="form-group">
                    <label>选择目标知识库</label>
                    <select id="archive-kb">
                        ${kbs.map(kb => `<option value="${kb.id}">${kb.name}</option>`).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label>标签</label>
                    <input type="text" id="archive-tags" placeholder="输入标签，用逗号分隔">
                </div>
                <div class="form-group">
                    <label>备注</label>
                    <textarea id="archive-note" placeholder="可选备注..."></textarea>
                </div>
                <button type="submit" class="btn btn-primary" style="width: 100%;">
                    <i data-lucide="archive"></i> 归档到知识库
                </button>
            </form>
        `;

        window.app.openModal('归档到知识库', content);
        setTimeout(() => {
            const form = document.getElementById('archive-form');
            if (form) {
                form.addEventListener('submit', (e) => {
                    e.preventDefault();
                    alert('已成功归档到知识库！');
                    window.app.closeModal();
                });
            }
            this.initIcons();
        }, 100);
    }

    archiveChat() {
        if (!this.currentChat) return;

        const kbs = window.knowledgeBase ? window.knowledgeBase.kbs : [];
        const content = `
            <form id="archive-chat-form">
                <p style="margin-bottom: 16px; color: var(--text-secondary);">将整个对话归档到知识库，方便后续检索和参考。</p>
                <div class="form-group">
                    <label>选择目标知识库</label>
                    <select id="archive-chat-kb">
                        ${kbs.map(kb => `<option value="${kb.id}">${kb.name}</option>`).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label>标签</label>
                    <input type="text" id="archive-chat-tags" placeholder="例如: 技术讨论, 架构设计">
                </div>
                <button type="submit" class="btn btn-primary" style="width: 100%;">
                    <i data-lucide="archive"></i> 归档对话
                </button>
            </form>
        `;

        window.app.openModal('归档对话', content);
        setTimeout(() => {
            const form = document.getElementById('archive-chat-form');
            if (form) {
                form.addEventListener('submit', (e) => {
                    e.preventDefault();
                    alert('对话已成功归档！');
                    window.app.closeModal();
                });
            }
            this.initIcons();
        }, 100);
    }

    showKBSelector() {
        const kbs = window.knowledgeBase ? window.knowledgeBase.kbs : [];

        const content = `
            <div style="max-height: 400px; overflow-y: auto;">
                <p style="margin-bottom: 16px; color: var(--text-secondary);">选择要关联的知识库（支持多选）：</p>
                ${kbs.map(kb => `
                    <div class="recent-item" style="margin-bottom: 8px; cursor: pointer; ${this.selectedKBs.includes(kb.id) ? 'background: var(--accent-light);' : ''}" onclick="chatModule.toggleKB(${kb.id})">
                        <div style="width: 18px; height: 18px; border-radius: 4px; border: 2px solid ${this.selectedKBs.includes(kb.id) ? 'var(--accent)' : 'var(--text-muted)'}; background: ${this.selectedKBs.includes(kb.id) ? 'var(--accent)' : 'transparent'}; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                            ${this.selectedKBs.includes(kb.id) ? '<i data-lucide="check" style="width: 12px; height: 12px; color: white;"></i>' : ''}
                        </div>
                        <div class="recent-info">
                            <div class="recent-title">${kb.name}</div>
                            <div class="recent-meta">${kb.docCount} 文档</div>
                        </div>
                    </div>
                `).join('')}
                <button class="btn btn-primary" style="width: 100%; margin-top: 16px;" onclick="chatModule.confirmKBSelection()">
                    确认选择 (${this.selectedKBs.length} 个)
                </button>
            </div>
        `;

        window.app.openModal('选择知识库（多选）', content);
        this.initIcons();
    }

    toggleKB(id) {
        const idx = this.selectedKBs.indexOf(id);
        if (idx >= 0) {
            this.selectedKBs.splice(idx, 1);
        } else {
            this.selectedKBs.push(id);
        }
        this.showKBSelector();
    }

    confirmKBSelection() {
        const btn = document.getElementById('kb-select-btn');
        if (btn) {
            const count = this.selectedKBs.length;
            btn.innerHTML = `<i data-lucide="database"></i><span>已选 ${count} 个知识库</span>`;
            this.initIcons();
        }
        window.app.closeModal();
    }

    showUploadModal() {
        const content = `
            <form id="upload-form">
                <div class="form-group">
                    <label>上传文件</label>
                    <input type="file" id="chat-file" multiple accept=".pdf,.doc,.docx,.txt,.md,.png,.jpg,.jpeg,.xlsx,.csv">
                    <small style="color: var(--text-muted); display: block; margin-top: 4px;">支持文档、图片、表格格式</small>
                </div>
                <div class="form-group">
                    <label>文件说明（可选）</label>
                    <textarea id="file-desc" placeholder="描述这些文件的用途..."></textarea>
                </div>
                <button type="submit" class="btn btn-primary" style="width: 100%;">
                    <i data-lucide="upload"></i> 上传文件
                </button>
            </form>
        `;

        window.app.openModal('上传文件', content);
        setTimeout(() => {
            const form = document.getElementById('upload-form');
            if (form) {
                form.addEventListener('submit', (e) => {
                    e.preventDefault();
                    alert('文件上传成功！');
                    window.app.closeModal();
                });
            }
            this.initIcons();
        }, 100);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.chatModule = new ChatModule();
});
