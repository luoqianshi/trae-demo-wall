// ONE TOW MORE - AI Agent 任务中心模块

class AgentModule {
    constructor() {
        this.agents = [
            {
                id: 1, name: '文档自动分类任务', description: '对技术文档库中的所有文档进行智能分类和标签化处理',
                status: 'running', progress: 65, type: 'document', skill: '文档智能分类',
                knowledgeBase: '技术文档库', createdAt: '2026-06-18 10:30', estimatedTime: '预计还剩 5 分钟',
                icon: 'file-code', logs: [
                    { time: '10:30:00', msg: '任务启动，开始加载技术文档库...' },
                    { time: '10:30:15', msg: '已加载 234 个文档，开始预处理...' },
                    { time: '10:31:00', msg: '文档向量化完成，开始分类...' },
                    { time: '10:32:30', msg: '已分类 152 个文档（65%），继续处理中...' }
                ]
            },
            {
                id: 2, name: '知识图谱构建', description: '基于产品需求库构建知识图谱，识别实体关系和概念关联',
                status: 'running', progress: 32, type: 'analysis', skill: '知识图谱构建',
                knowledgeBase: '产品需求库', createdAt: '2026-06-18 11:00', estimatedTime: '预计还剩 15 分钟',
                icon: 'network', logs: [
                    { time: '11:00:00', msg: '任务启动，连接产品需求库...' },
                    { time: '11:00:20', msg: '开始实体抽取（NER）...' },
                    { time: '11:01:45', msg: '已抽取 89 个实体，开始关系识别...' }
                ]
            },
            {
                id: 3, name: '数据清洗任务', description: '清洗市场调研数据，去除重复和无效信息，标准化数据格式',
                status: 'completed', progress: 100, type: 'analysis', skill: '数据清洗助手',
                knowledgeBase: '市场调研库', createdAt: '2026-06-18 09:00', completedAt: '2026-06-18 09:45',
                icon: 'database', logs: [
                    { time: '09:00:00', msg: '任务启动...' },
                    { time: '09:15:00', msg: '数据去重完成，移除 23 条重复记录' },
                    { time: '09:30:00', msg: '数据标准化完成...' },
                    { time: '09:45:00', msg: '任务完成，处理了 128 条数据' }
                ],
                output: '清洗后的数据集已保存，共 105 条有效记录，数据质量评分从 72 提升至 95。'
            },
            {
                id: 4, name: '智能摘要生成', description: '为法律法规库中的所有文档生成智能摘要和关键词',
                status: 'completed', progress: 100, type: 'document', skill: '智能摘要生成',
                knowledgeBase: '法律法规库', createdAt: '2026-06-17 14:00', completedAt: '2026-06-17 15:30',
                icon: 'file-text', logs: [
                    { time: '14:00:00', msg: '任务启动，加载法律法规库...' },
                    { time: '14:30:00', msg: '已处理 45 个文档...' },
                    { time: '15:00:00', msg: '已处理 78 个文档...' },
                    { time: '15:30:00', msg: '全部 89 个文档摘要生成完毕' }
                ],
                output: '已为 89 个法律文档生成摘要，平均摘要长度 200 字，关键词提取准确率 96.3%。'
            },
            {
                id: 5, name: '竞品分析报告', description: '分析竞争对手产品特性，生成对比分析报告和SWOT分析',
                status: 'failed', progress: 45, type: 'research', skill: '竞品分析助手',
                knowledgeBase: '市场调研库', createdAt: '2026-06-17 16:00', error: '数据源连接超时，请检查网络设置后重试',
                icon: 'bar-chart-3', logs: [
                    { time: '16:00:00', msg: '任务启动，连接外部数据源...' },
                    { time: '16:10:00', msg: '正在抓取竞品官网数据...' },
                    { time: '16:25:00', msg: '错误：数据源连接超时' }
                ]
            },
            {
                id: 6, name: '文献综述生成', description: '基于医学文献库生成最新研究进展综述报告',
                status: 'completed', progress: 100, type: 'research', skill: '文献综述生成',
                knowledgeBase: '医学文献库', createdAt: '2026-06-16 10:00', completedAt: '2026-06-16 12:00',
                icon: 'book-open', logs: [
                    { time: '10:00:00', msg: '任务启动，筛选近 6 个月文献...' },
                    { time: '10:30:00', msg: '筛选出 128 篇相关文献...' },
                    { time: '11:30:00', msg: '综述初稿生成完毕...' },
                    { time: '12:00:00', msg: '综述定稿完成，共 15 页' }
                ],
                output: '综述报告已生成，涵盖 128 篇文献，识别出 5 大研究趋势和 3 个研究空白。'
            },
            {
                id: 7, name: '合同批量审查', description: '对金融研报库中的合同文件进行风险条款审查',
                status: 'stopped', progress: 28, type: 'document', skill: '合同审查助手',
                knowledgeBase: '金融研报库', createdAt: '2026-06-17 08:00',
                icon: 'scale', logs: [
                    { time: '08:00:00', msg: '任务启动...' },
                    { time: '08:15:00', msg: '正在审查第 8 份合同...' },
                    { time: '08:30:00', msg: '用户手动停止任务' }
                ]
            },
            {
                id: 8, name: '制造工艺优化分析', description: '分析制造工艺库数据，识别工艺瓶颈并提出优化建议',
                status: 'running', progress: 12, type: 'analysis', skill: '数据清洗助手',
                knowledgeBase: '制造工艺库', createdAt: '2026-06-18 13:00', estimatedTime: '预计还剩 25 分钟',
                icon: 'cog', logs: [
                    { time: '13:00:00', msg: '任务启动，加载制造工艺数据...' },
                    { time: '13:05:00', msg: '数据加载完成，开始分析...' }
                ]
            }
        ];
        this.templates = [
            { id: 1, name: '文档分类模板', type: 'document', skill: '文档智能分类', desc: '自动对知识库文档进行分类和标签化' },
            { id: 2, name: '摘要生成模板', type: 'document', skill: '智能摘要生成', desc: '为文档批量生成智能摘要' },
            { id: 3, name: '知识图谱模板', type: 'analysis', skill: '知识图谱构建', desc: '从文档中提取实体关系构建图谱' }
        ];
        this.init();
    }

    init() {
        this.renderAgentList();
        this.updateStats();
        this.initEventListeners();
        this.startProgressSimulation();
    }

    renderAgentList() {
        const agentList = document.getElementById('agent-list');
        if (!agentList) return;

        agentList.innerHTML = this.agents.map(agent => `
            <div class="agent-item" data-id="${agent.id}">
                <div class="agent-status-icon ${agent.status}">
                    <i data-lucide="${this.getStatusIcon(agent.status)}"></i>
                </div>
                <div class="agent-info">
                    <div class="agent-name">${agent.name}</div>
                    <div class="agent-desc">${agent.description}</div>
                    <div style="margin-top: 8px;">
                        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                            <div style="flex: 1; height: 4px; background: var(--bg-secondary); border-radius: 2px; overflow: hidden;">
                                <div style="width: ${agent.progress}%; height: 100%; background: ${this.getProgressColor(agent.status)}; border-radius: 2px; transition: width 0.3s ease;"></div>
                            </div>
                            <span style="font-size: 12px; color: var(--text-muted); min-width: 36px;">${agent.progress}%</span>
                        </div>
                        ${agent.status === 'running' ? `<span style="font-size: 12px; color: var(--accent);">${agent.estimatedTime}</span>` : ''}
                        ${agent.status === 'failed' ? `<span style="font-size: 12px; color: var(--danger);">错误: ${agent.error}</span>` : ''}
                        ${agent.status === 'stopped' ? `<span style="font-size: 12px; color: var(--warning);">已停止</span>` : ''}
                    </div>
                </div>
                <div class="agent-meta">
                    <span>${agent.type === 'document' ? '文档处理' : agent.type === 'analysis' ? '数据分析' : '研究辅助'}</span>
                    <span>${agent.createdAt}</span>
                </div>
                <div class="agent-actions">
                    ${this.getAgentActions(agent)}
                </div>
            </div>
        `).join('');

        agentList.querySelectorAll('.agent-item').forEach(item => {
            const id = parseInt(item.dataset.id);
            const viewBtn = item.querySelector('.view-btn');
            const retryBtn = item.querySelector('.retry-btn');
            const stopBtn = item.querySelector('.stop-btn');
            const deleteBtn = item.querySelector('.delete-btn');

            if (viewBtn) viewBtn.addEventListener('click', () => this.viewAgentDetails(id));
            if (retryBtn) retryBtn.addEventListener('click', () => this.retryAgent(id));
            if (stopBtn) stopBtn.addEventListener('click', () => this.stopAgent(id));
            if (deleteBtn) deleteBtn.addEventListener('click', () => this.deleteAgent(id));
        });

        this.initIcons();
    }

    getStatusIcon(status) {
        return { running: 'loader-2', completed: 'check-circle', failed: 'x-circle', stopped: 'pause-circle' }[status] || 'circle';
    }

    getProgressColor(status) {
        return { running: 'var(--accent)', completed: 'var(--success)', failed: 'var(--danger)', stopped: 'var(--warning)' }[status] || 'var(--text-muted)';
    }

    getAgentActions(agent) {
        let actions = `<button class="btn-icon view-btn" title="查看详情"><i data-lucide="eye"></i></button>`;
        if (agent.status === 'running') actions += `<button class="btn-icon stop-btn" title="停止"><i data-lucide="square"></i></button>`;
        if (agent.status === 'failed' || agent.status === 'stopped') actions += `<button class="btn-icon retry-btn" title="重试"><i data-lucide="refresh-cw"></i></button>`;
        if (agent.status !== 'running') actions += `<button class="btn-icon delete-btn" title="删除"><i data-lucide="trash-2"></i></button>`;
        return actions;
    }

    updateStats() {
        const running = this.agents.filter(a => a.status === 'running').length;
        const completed = this.agents.filter(a => a.status === 'completed').length;
        const failed = this.agents.filter(a => a.status === 'failed').length;

        const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
        set('running-count', running);
        set('completed-count', completed);
        set('failed-count', failed);
    }

    initEventListeners() {
        const createBtn = document.getElementById('create-agent-btn');
        if (createBtn) {
            createBtn.addEventListener('click', () => this.showCreateAgentModal());
        }
    }

    showCreateAgentModal() {
        const skills = window.skillsModule ? window.skillsModule.skills : [];
        const kbs = window.knowledgeBase ? window.knowledgeBase.kbs : [];

        const content = `
            <form id="create-agent-form">
                <div class="form-group">
                    <label>任务名称</label>
                    <input type="text" id="agent-name" placeholder="输入任务名称" required>
                </div>
                <div class="form-group">
                    <label>任务描述</label>
                    <textarea id="agent-desc" placeholder="描述这个任务的具体内容..."></textarea>
                </div>
                <div class="form-group">
                    <label>任务类型</label>
                    <select id="agent-type" onchange="agentModule.onTypeChange()">
                        <option value="document">文档处理</option>
                        <option value="analysis">数据分析</option>
                        <option value="research">研究辅助</option>
                        <option value="custom">自定义</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>选择 Skill</label>
                    <select id="agent-skill">
                        ${skills.map(s => `<option value="${s.id}">${s.name} (${s.version})</option>`).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label>选择知识库</label>
                    <select id="agent-kb">
                        <option value="">不指定</option>
                        ${kbs.map(kb => `<option value="${kb.id}">${kb.name}</option>`).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label>任务参数</label>
                    <textarea id="agent-params" placeholder='JSON格式参数，例如：{"batch_size": 50, "language": "zh"}' style="font-family: monospace; min-height: 80px;"></textarea>
                </div>
                <div class="form-group">
                    <label>执行计划</label>
                    <div style="display: flex; gap: 12px; flex-wrap: wrap;">
                        <label style="display: flex; align-items: center; gap: 6px; cursor: pointer;">
                            <input type="radio" name="schedule" value="now" checked> <span>立即执行</span>
                        </label>
                        <label style="display: flex; align-items: center; gap: 6px; cursor: pointer;">
                            <input type="radio" name="schedule" value="later"> <span>定时执行</span>
                        </label>
                    </div>
                </div>
                <div class="form-group" id="schedule-time-group" style="display: none;">
                    <label>执行时间</label>
                    <input type="datetime-local" id="agent-schedule-time">
                </div>
                <div style="display: flex; gap: 12px;">
                    <button type="submit" class="btn btn-primary" style="flex: 1;"><i data-lucide="play"></i> 创建并执行</button>
                    <button type="button" class="btn" style="background: var(--bg-secondary); color: var(--text-primary);" onclick="agentModule.saveAsTemplate()"><i data-lucide="save"></i> 保存为模板</button>
                </div>
            </form>
        `;

        window.app.openModal('新建 AI Agent 任务', content, { wide: true });
        setTimeout(() => {
            const form = document.getElementById('create-agent-form');
            if (form) {
                form.addEventListener('submit', (e) => { e.preventDefault(); this.createAgent(); });
            }
            const radios = form.querySelectorAll('input[name="schedule"]');
            radios.forEach(r => r.addEventListener('change', () => {
                document.getElementById('schedule-time-group').style.display = r.value === 'later' ? 'block' : 'none';
            }));
            this.initIcons();
        }, 100);
    }

    onTypeChange() {}

    createAgent() {
        const name = document.getElementById('agent-name').value;
        const desc = document.getElementById('agent-desc').value;
        const type = document.getElementById('agent-type').value;
        const skill = document.getElementById('agent-skill');
        const skillName = skill.options[skill.selectedIndex].text.split(' (')[0];

        if (!name) { alert('请输入任务名称'); return; }

        const typeIcons = { document: 'file-code', analysis: 'bar-chart-3', research: 'book-open', custom: 'settings' };

        this.agents.unshift({
            id: Date.now(), name, description: desc || '暂无描述',
            status: 'running', progress: 0, type, skill: skillName,
            knowledgeBase: '', createdAt: new Date().toLocaleString('zh-CN'),
            estimatedTime: '预计还剩 10 分钟', icon: typeIcons[type] || 'settings',
            logs: [{ time: new Date().toLocaleTimeString('zh-CN'), msg: '任务启动...' }]
        });

        this.renderAgentList();
        this.updateStats();
        window.app.closeModal();
    }

    saveAsTemplate() {
        const name = document.getElementById('agent-name').value;
        if (!name) { alert('请先填写任务名称'); return; }

        this.templates.push({
            id: Date.now(), name: name + '模板',
            type: document.getElementById('agent-type').value,
            skill: '', desc: '用户保存的任务模板'
        });
        alert('模板已保存！');
    }

    viewAgentDetails(id) {
        const agent = this.agents.find(a => a.id === id);
        if (!agent) return;

        const statusText = { running: '运行中', completed: '已完成', failed: '失败', stopped: '已停止' };
        const statusColor = this.getProgressColor(agent.status);

        let logHtml = agent.logs.map(log => `
            <div style="display: flex; gap: 12px; padding: 8px 0; border-bottom: 1px solid var(--border); font-size: 13px;">
                <span style="color: var(--text-muted); flex-shrink: 0;">${log.time}</span>
                <span>${log.msg}</span>
            </div>
        `).join('');

        const content = `
            <div style="padding: 20px;">
                <div style="display: flex; align-items: center; gap: 16px; margin-bottom: 24px;">
                    <div style="width: 48px; height: 48px; border-radius: 50%; background: ${statusColor}20; display: flex; align-items: center; justify-content: center;">
                        <i data-lucide="${agent.icon}" style="color: ${statusColor};"></i>
                    </div>
                    <div>
                        <h3 style="margin-bottom: 4px;">${agent.name}</h3>
                        <span style="padding: 4px 12px; border-radius: 9999px; font-size: 12px; background: ${statusColor}20; color: ${statusColor};">${statusText[agent.status]}</span>
                    </div>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px;">
                    <div>
                        <div style="font-size: 12px; color: var(--text-muted); margin-bottom: 4px;">任务描述</div>
                        <div style="font-size: 14px;">${agent.description}</div>
                    </div>
                    <div>
                        <div style="font-size: 12px; color: var(--text-muted); margin-bottom: 4px;">关联 Skill</div>
                        <div style="font-size: 14px;">${agent.skill || '未指定'}</div>
                    </div>
                    <div>
                        <div style="font-size: 12px; color: var(--text-muted); margin-bottom: 4px;">知识库</div>
                        <div style="font-size: 14px;">${agent.knowledgeBase || '未指定'}</div>
                    </div>
                    <div>
                        <div style="font-size: 12px; color: var(--text-muted); margin-bottom: 4px;">创建时间</div>
                        <div style="font-size: 14px;">${agent.createdAt}</div>
                    </div>
                </div>

                <div style="margin-bottom: 24px;">
                    <h4 style="margin-bottom: 12px; font-size: 14px;">执行进度</h4>
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <div style="flex: 1; height: 8px; background: var(--bg-secondary); border-radius: 4px; overflow: hidden;">
                            <div style="width: ${agent.progress}%; height: 100%; background: ${statusColor}; border-radius: 4px;"></div>
                        </div>
                        <span style="font-weight: 600;">${agent.progress}%</span>
                    </div>
                </div>

                <div style="margin-bottom: 24px;">
                    <h4 style="margin-bottom: 12px; font-size: 14px;">执行日志</h4>
                    <div style="max-height: 200px; overflow-y: auto; background: var(--bg-secondary); padding: 12px; border-radius: var(--radius-md);">
                        ${logHtml}
                    </div>
                </div>

                ${agent.output ? `
                    <div style="margin-bottom: 24px; padding: 16px; background: var(--bg-secondary); border-radius: var(--radius-md);">
                        <h4 style="margin-bottom: 8px; font-size: 14px;">输出结果</h4>
                        <p style="font-size: 14px; color: var(--text-secondary);">${agent.output}</p>
                    </div>
                ` : ''}

                ${agent.error ? `
                    <div style="margin-bottom: 24px; padding: 16px; background: rgba(239,68,68,0.1); border-radius: var(--radius-md);">
                        <h4 style="margin-bottom: 8px; font-size: 14px; color: var(--danger);">错误信息</h4>
                        <p style="font-size: 14px; color: var(--danger);">${agent.error}</p>
                    </div>
                ` : ''}

                <div style="display: flex; gap: 12px;">
                    ${agent.status === 'completed' ? `<button class="btn btn-primary" onclick="alert('报告导出成功！')"><i data-lucide="download"></i> 导出报告</button>` : ''}
                    ${agent.status === 'failed' ? `<button class="btn btn-primary" onclick="agentModule.retryAgent(${agent.id}); window.app.closeModal();"><i data-lucide="refresh-cw"></i> 重试任务</button>` : ''}
                    <button class="btn" style="background: var(--bg-secondary); color: var(--text-primary);" onclick="window.app.closeModal()">关闭</button>
                </div>
            </div>
        `;

        window.app.openModal('任务详情', content, { wide: true });
        this.initIcons();
    }

    retryAgent(id) {
        const agent = this.agents.find(a => a.id === id);
        if (!agent) return;
        agent.status = 'running';
        agent.progress = 0;
        agent.error = null;
        agent.createdAt = new Date().toLocaleString('zh-CN');
        agent.estimatedTime = '预计还剩 10 分钟';
        agent.logs.push({ time: new Date().toLocaleTimeString('zh-CN'), msg: '任务重新启动...' });
        this.renderAgentList();
        this.updateStats();
    }

    stopAgent(id) {
        const agent = this.agents.find(a => a.id === id);
        if (!agent) return;
        if (confirm('确定要停止这个任务吗？')) {
            agent.status = 'stopped';
            agent.estimatedTime = null;
            agent.logs.push({ time: new Date().toLocaleTimeString('zh-CN'), msg: '用户手动停止任务' });
            this.renderAgentList();
            this.updateStats();
        }
    }

    deleteAgent(id) {
        const agent = this.agents.find(a => a.id === id);
        if (!agent) return;
        if (confirm(`确定要删除任务 "${agent.name}" 吗？`)) {
            this.agents = this.agents.filter(a => a.id !== id);
            this.renderAgentList();
            this.updateStats();
        }
    }

    startProgressSimulation() {
        setInterval(() => {
            let updated = false;
            this.agents.forEach(agent => {
                if (agent.status === 'running' && agent.progress < 100) {
                    agent.progress = Math.min(agent.progress + Math.random() * 3, 99);
                    updated = true;
                    if (agent.progress >= 99 && Math.random() > 0.9) {
                        agent.progress = 100;
                        agent.status = 'completed';
                        agent.completedAt = new Date().toLocaleString('zh-CN');
                        agent.estimatedTime = null;
                        agent.output = '任务已成功完成。';
                        agent.logs.push({ time: new Date().toLocaleTimeString('zh-CN'), msg: '任务执行完毕' });
                    }
                }
            });
            if (updated) {
                this.renderAgentList();
                this.updateStats();
            }
        }, 5000);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.agentModule = new AgentModule();
});
