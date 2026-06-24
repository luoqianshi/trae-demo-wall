/**
 * TRAE DevFlow Demo - Agent协作模拟
 * 模拟8个专业Agent的并行工作状态
 */

const AgentTypes = [
    { id: 'coder-1', name: '代码生成者 #1', role: 'coder', icon: '&#128187;', color: '#0066ff' },
    { id: 'coder-2', name: '代码生成者 #2', role: 'coder', icon: '&#128187;', color: '#0066ff' },
    { id: 'reviewer', name: '代码审查员', role: 'reviewer', icon: '&#128270;', color: '#a371f7' },
    { id: 'tester', name: '测试工程师', role: 'tester', icon: '&#9989;', color: '#3fb950' },
    { id: 'architect', name: '架构设计师', role: 'architect', icon: '&#128202;', color: '#db6d28' },
    { id: 'builder', name: '构建发布员', role: 'builder', icon: '&#128190;', color: '#d29922' },
    { id: 'documenter', name: '文档撰写员', role: 'documenter', icon: '&#128196;', color: '#79c0ff' },
    { id: 'deployer', name: '部署运维员', role: 'deployer', icon: '&#128640;', color: '#f85149' }
];

class AgentManager {
    constructor() {
        this.agents = {};
        this.activeCount = 0;
        this.onAgentUpdate = null;
        
        // 初始化所有Agent
        AgentTypes.forEach(agent => {
            this.agents[agent.id] = {
                ...agent,
                status: 'idle',
                task: '',
                progress: 0
            };
        });
    }

    /**
     * 初始化Agent网格UI
     */
    initUI(containerId) {
        const container = document.getElementById(containerId);
        container.innerHTML = AgentTypes.map(agent => `
            <div class="agent-card idle" id="agent-${agent.id}">
                <div class="agent-name">${agent.icon} ${agent.name}</div>
                <div class="agent-task">空闲等待中...</div>
                <div class="agent-progress">
                    <div class="agent-progress-bar" style="width:0%"></div>
                </div>
            </div>
        `).join('');
        
        this._updateActiveCount();
    }

    /**
     * 根据流水线阶段激活对应Agent
     */
    async activateForStage(stageId, taskDescription) {
        const stageAgentMap = {
            'analyzed': ['architect'],
            'coded': ['coder-1', 'coder-2'],
            'reviewed': ['reviewer'],
            'tested': ['tester'],
            'built': ['builder'],
            'deployed': ['deployer'],
            'documented': ['documenter']
        };

        const agentIds = stageAgentMap[stageId] || [];
        
        // 激活指定Agent
        for (const aid of agentIds) {
            this._setAgentStatus(aid, 'working', taskDescription);
            
            // 模拟进度增长
            await this._simulateProgress(aid, 2000 + Math.random() * 2000);
            
            this._setAgentStatus(aid, 'done', '任务完成');
        }
        
        // 延迟后让Agent回到idle
        setTimeout(() => {
            agentIds.forEach(aid => {
                if (this.agents[aid]) {
                    this._setAgentStatus(aid, 'idle', '空闲等待中...');
                }
            });
        }, 1500);
    }

    /**
     * 设置Agent状态
     */
    _setAgentStatus(agentId, status, task) {
        const agent = this.agents[agentId];
        if (!agent) return;

        agent.status = status;
        agent.task = task || '';
        if (status === 'working') agent.progress = 0;
        if (status === 'done') agent.progress = 100;

        const el = document.getElementById(`agent-${agentId}`);
        if (el) {
            el.className = `agent-card ${status}`;
            el.querySelector('.agent-task').textContent = task || '空闲等待中...';
            
            const progressBar = el.querySelector('.agent-progress-bar');
            if (progressBar) {
                progressBar.style.width = `${agent.progress}%`;
            }
        }

        this._updateActiveCount();
        
        if (this.onAgentUpdate) {
            this.onAgentUpdate(agentId, agent);
        }
    }

    /**
     * 模拟进度增长
     */
    _simulateProgress(agentId, duration) {
        return new Promise(resolve => {
            const startTime = Date.now();
            const interval = setInterval(() => {
                const elapsed = Date.now() - startTime;
                const progress = Math.min(100, (elapsed / duration) * 100 + (Math.random() * 5));
                
                const agent = this.agents[agentId];
                if (agent) {
                    agent.progress = progress;
                    
                    const progressBar = document.querySelector(`#agent-${agentId} .agent-progress-bar`);
                    if (progressBar) {
                        progressBar.style.width = `${Math.min(100, progress)}%`;
                    }
                }
                
                if (elapsed >= duration) {
                    clearInterval(interval);
                    resolve();
                }
            }, 100);
        });
    }

    /**
     * 更新活跃Agent计数
     */
    _updateActiveCount() {
        let active = 0;
        Object.values(this.agents).forEach(a => {
            if (a.status === 'working') active++;
        });
        this.activeCount = active;
        
        const el = document.getElementById('agentCount');
        if (el) {
            el.textContent = `${active}/8 活跃`;
        }
    }

    /**
     * 重置所有Agent
     */
    resetAll() {
        Object.keys(this.agents).forEach(id => {
            this._setAgentStatus(id, 'idle', '空闲等待中...');
        });
    }

    /**
     * 获取Agent统计信息
     */
    getStats() {
        const stats = { total: 8, working: 0, done: 0, idle: 0 };
        Object.values(this.agents).forEach(a => {
            stats[a.status]++;
        });
        return stats;
    }
}

// 导出全局实例
window.agentManager = new AgentManager();
