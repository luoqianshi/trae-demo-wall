/**
 * TRAE DevFlow Demo - 记忆系统模拟
 * 模拟短期记忆(STM)和长期记忆(LTM)的运作
 */

class MemorySystem {
    constructor() {
        this.stm = [];   // 短期记忆 (最近的事件)
        this.ltm = [];   // 长期记忆 (持久化知识)
        this.maxSTM = 20;
        
        // 预设一些LTM数据
        this._initLTM();
    }

    /**
     * 初始化长期记忆（预设用户偏好和历史知识）
     */
    _initLTM() {
        this.ltm = [
            {
                id: 'ltm-001',
                type: 'USER_PREFERENCE',
                subject: '编程语言偏好',
                content: '用户倾向于使用Python和TypeScript进行后端开发',
                confidence: 0.92,
                createdAt: Date.now() - 86400000 * 3,
                accessCount: 15
            },
            {
                id: 'ltm-002',
                type: 'SUCCESS_PATTERN',
                subject: 'Flask API最佳实践',
                content: '使用Flask-SQLAlchemy + JWT认证 + Blueprint模块化的架构模式成功率最高',
                confidence: 0.88,
                createdAt: Date.now() - 86400000 * 7,
                accessCount: 23
            },
            {
                id: 'ltm-003',
                type: 'FAILURE_LESSON',
                subject: '依赖缺失错误',
                content: '常见错误：ModuleNotFoundError flask_sqlalchemy → 解决方案：在requirements.txt中添加flask-sqlalchemy',
                confidence: 0.95,
                createdAt: Date.now() - 86400000 * 2,
                accessCount: 8
            },
            {
                id: 'ltm-004',
                type: 'TECHNICAL_DECISION',
                subject: 'ORM选择策略',
                content: '对于中小型项目优先使用SQLAlchemy，大型高并发项目考虑使用Tortoise ORM或原生SQL',
                confidence: 0.85,
                createdAt: Date.now() - 86400000 * 5,
                accessCount: 12
            }
        ];
    }

    /**
     * 添加短期记忆事件
     */
    addSTMEvent(type, content, importance = 0.5) {
        const event = {
            id: `stm-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            type,           // USER_MESSAGE / AGENT_RESPONSE / STAGE_COMPLETE / ERROR / FEEDBACK / DECISION
            content,
            importance,
            timestamp: Date.now()
        };

        this.stm.unshift(event);  // 最新的在前面
        
        // 限制数量
        if (this.stm.length > this.maxSTM) {
            this.stm.pop();
        }

        // 高重要性事件自动考虑迁移到LTM
        if (importance >= 0.8) {
            setTimeout(() => this._consolidateToLTM(event), 500);
        }

        return event;
    }

    /**
     * 记忆整合：将重要的STM事件迁移到LTM
     */
    _consolidateToLTM(stmEvent) {
        const ltmTypes = {
            'USER_FEEDBACK': 'USER_PREFERENCE',
            'DECISION_MADE': 'TECHNICAL_DECISION',
            'ERROR_OCCURRED': 'FAILURE_LESSON',
            'STAGE_COMPLETE': 'SUCCESS_PATTERN'
        };

        const ltmType = ltmTypes[stmEvent.type];
        if (!ltmType) return;

        // 检查是否已存在类似条目
        const exists = this.ltm.find(l => 
            l.type === ltmType && 
            l.content.includes(stmEvent.content.substring(0, 20))
        );

        if (!exists) {
            const newLTM = {
                id: `ltm-${Date.now()}`,
                type: ltmType,
                subject: stmEvent.type.replace(/_/g, ' '),
                content: stmEvent.content,
                confidence: stmEvent.importance,
                createdAt: Date.now(),
                accessCount: 1
            };
            
            this.ltm.unshift(newLTM);
            this._refreshLTMUI();
        }
    }

    /**
     * 获取上下文窗口（用于Prompt组装）
     */
    getContextWindow(maxTokens = 2000) {
        let context = '';
        let currentTokens = 0;
        
        for (const event of this.stm) {
            const text = `[${this._formatTime(event.timestamp)}] ${event.type}: ${event.content}`;
            const estTokens = Math.ceil(text.length / 2);
            
            if (currentTokens + estTokens > maxTokens) break;
            
            context += text + '\n';
            currentTokens += estTokens;
        }
        
        return context;
    }

    /**
     * 刷新STM UI
     */
    refreshSTMUI() {
        const container = document.getElementById('stmList');
        if (!container) return;

        container.innerHTML = this.stm.slice(0, 10).map(event => `
            <div class="memory-item stm-item">
                <div class="mem-type">${event.type}</div>
                <div class="mem-content">${event.content}</div>
                <div class="mem-time">${this._formatTime(event.timestamp)} | 重要性: ${(event.importance * 100).toFixed(0)}%</div>
            </div>
        `).join('');
    }

    /**
     * 刷新LTM UI
     */
    refreshLTMUI() {
        this._refreshLTMUI();
    }

    _refreshLTMUI() {
        const container = document.getElementById('ltmList');
        if (!container) return;

        container.innerHTML = this.ltm.map(item => `
            <div class="memory-item ltm-item">
                <div class="mem-type">${item.type} | 置信度: ${(item.confidence * 100).toFixed(0)}%</div>
                <div class="mem-content">${item.content}</div>
                <div class="mem-time">访问${item.accessCount}次 | ${this._formatRelativeTime(item.createdAt)}</div>
            </div>
        `).join('');
    }

    /**
     * 清空短期记忆
     */
    clearSTM() {
        this.stm = [];
        this.refreshSTMUI();
    }

    /**
     * 格式化时间
     */
    _formatTime(timestamp) {
        const d = new Date(timestamp);
        return `${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}:${d.getSeconds().toString().padStart(2,'0')}`;
    }

    /**
     * 格式化相对时间
     */
    _formatRelativeTime(timestamp) {
        const diff = Date.now() - timestamp;
        const days = Math.floor(diff / 86400000);
        if (days === 0) return '今天';
        if (days === 1) return '昨天';
        if (days < 7) return `${days}天前`;
        return `${Math.floor(days/7)}周前`;
    }
}

// 导出全局实例
window.memorySystem = new MemorySystem();
