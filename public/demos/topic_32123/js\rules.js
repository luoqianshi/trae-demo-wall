/**
 * TRAE DevFlow Demo - 规则引擎模拟
 * 模拟4层规则体系的执行过程
 */

const RuleDefinitions = [
    {
        id: 'SEC-001',
        name: '危险命令检测',
        level: 'SYSTEM',
        category: 'security',
        icon: '&#128737;',
        description: '检测并阻止代码中的危险系统命令',
        patterns: ['rm -rf /', 'eval(', 'os.system(']
    },
    {
        id: 'SEC-002',
        name: '敏感信息检测',
        level: 'SYSTEM',
        category: 'security',
        icon: '&#128274;',
        description: '检测密码、密钥等敏感信息泄露',
        patterns: ['password', 'api_key', 'secret']
    },
    {
        id: 'SEC-003',
        name: '资源限制检查',
        level: 'SYSTEM',
        category: 'resource',
        icon: '&#128202;',
        description: '检查是否超出内存/CPU配额'
    },
    {
        id: 'STYLE-001',
        name: '代码风格检查',
        level: 'PROJECT',
        category: 'style',
        icon: '&#128220;',
        description: '检查代码是否符合PEP8/ESLint规范'
    },
    {
        id: 'TECH-001',
        name: '技术栈约束',
        level: 'PROJECT',
        category: 'tech',
        icon: '&#9881;',
        description: '确保使用的语言/框架在允许列表内'
    },
    {
        id: 'USER-001',
        name: '用户偏好应用',
        level: 'USER',
        category: 'preference',
        icon: '&#129302;',
        description: '应用用户的历史偏好设置'
    }
];

class RulesEngine {
    constructor() {
        this.ruleLog = [];       // 规则执行日志
        this.violations = 0;     // 违规次数
        this.passes = 0;         // 通过次数
    }

    /**
     * 根据流水线阶段执行对应规则
     */
    async executeForStage(stageId, codeContent) {
        const stageRuleMap = {
            'coded': ['TECH-001', 'USER-001'],
            'reviewed': ['SEC-001', 'SEC-002', 'STYLE-001'],
            'tested': ['SEC-003'],
            'dispatched': ['TECH-001']
        };

        const ruleIds = stageRuleMap[stageId] || [];
        
        for (const ruleId of ruleIds) {
            await this._executeRule(ruleId, stageId, codeContent);
            
            // 短暂延迟，让UI有时间更新
            await this._sleep(300 + Math.random() * 400);
        }
    }

    /**
     * 执行单条规则
     */
    async _executeRule(ruleId, stageId, content) {
        const rule = RuleDefinitions.find(r => r.id === ruleId);
        if (!rule) return;

        // 随机决定结果（90%通过率，10%警告）
        const rand = Math.random();
        let result;
        
        if (rand < 0.85) {
            result = { status: 'pass', message: `${rule.name}检查通过` };
            this.passes++;
        } else if (rand < 0.95) {
            result = { 
                status: 'warn', 
                message: `发现轻微问题：${rule.patterns ? rule.patterns[Math.floor(Math.random() * rule.patterns.length)] : '未知'}`,
                detail: '已自动修复或记录警告'
            };
        } else {
            result = {
                status: 'block',
                message: `严重违规！`,
                detail: `触发了${rule.name}，需要人工审核`
            };
            this.violations++;
        }

        const logEntry = {
            ...rule,
            stage: stageId,
            result,
            timestamp: Date.now()
        };

        this.ruleLog.push(logEntry);
        this._addLogEntryUI(logEntry);
    }

    /**
     * 添加规则执行日志到UI
     */
    _addLogEntryUI(entry) {
        const container = document.getElementById('ruleLog');
        if (!container) return;

        const div = document.createElement('div');
        div.className = `rule-entry rule-${entry.result.status}`;
        div.innerHTML = `
            <span class="rule-icon">${entry.icon}</span>
            <div class="rule-detail">
                <div class="rule-name">${entry.name} <span style="font-size:0.7rem;color:var(--gray-3)">[${entry.level}]</span></div>
                <div class="rule-desc">${entry.result.message}</div>
                ${entry.result.detail ? `<div class="rule-desc" style="color:var(--yellow)">${entry.result.detail}</div>` : ''}
            </div>
        `;

        container.insertBefore(div, container.firstChild);

        // 限制日志数量
        while (container.children.length > 20) {
            container.removeChild(container.lastChild);
        }
    }

    /**
     * 获取规则统计
     */
    getStats() {
        return {
            total: this.passes + this.violations,
            passes: this.passes,
            violations: this.violations,
            passRate: this.passes + this.violations > 0 
                ? ((this.passes / (this.passes + this.violations)) * 100).toFixed(1) + '%' 
                : 'N/A'
        };
    }

    /**
     * 清空日志
     */
    clearLog() {
        this.ruleLog = [];
        this.violations = 0;
        this.passes = 0;
        const container = document.getElementById('ruleLog');
        if (container) container.innerHTML = '';
    }

    _sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// 导出全局实例
window.rulesEngine = new RulesEngine();
