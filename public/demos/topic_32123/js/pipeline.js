/**
 * TRAE DevFlow Demo - 流水线模拟引擎
 * 模拟完整的12阶段任务处理流水线
 */

const PipelineStages = [
    { id: 'received', name: '消息接收', icon: '&#128242;', desc: '接收并验证微信消息' },
    { id: 'analyzed', name: '需求分析', icon: '&#129504;', desc: 'NLP意图识别与参数提取' },
    { id: 'dispatched', name: '任务分发', icon: '&#9889;', desc: '任务拆分与优先级排序' },
    { id: 'designed', name: '架构设计', icon: '&#128202;', desc: '技术选型与接口定义' },
    { id: 'coded', name: '代码生成', icon: '&#128187;', desc: '多Agent并行生成代码' },
    { id: 'reviewed', name: '代码审查', icon: '&#128270;', desc: '静态分析与安全扫描' },
    { id: 'tested', name: '自动测试', icon: '&#9989;', desc: '单元测试与覆盖率分析' },
    { id: 'built', name: '构建打包', icon: '&#128190;', desc: '依赖安装与Docker镜像构建' },
    { id: 'deployed', name: '部署就绪', icon: '&#128640;', desc: '环境配置与健康检查' },
    { id: 'documented', name: '文档生成', icon: '&#128196;', desc: 'API文档与README生成' },
    { id: 'notified', name: '结果推送', icon: '&#128228;', desc: '微信消息格式化推送' },
    { id: 'completed', name: '完成', icon: '&#127881;', desc: '全部流程结束' }
];

class PipelineEngine {
    constructor() {
        this.currentStageIndex = -1;
        this.isRunning = false;
        this.onStageChange = null;  // 回调函数
        this.onComplete = null;
        this.stageDurations = {};   // 各阶段耗时
        this.taskData = null;
    }

    /**
     * 初始化流水线UI
     */
    initUI(containerId) {
        const container = document.getElementById(containerId);
        container.innerHTML = `
            <div class="pipeline-nodes">
                ${PipelineStages.map((stage, i) => `
                    <div class="pipe-node pending" data-stage="${stage.id}" data-index="${i}">
                        <span class="node-icon">${stage.icon}</span>
                        <div class="node-name">${stage.name}</div>
                        <div class="node-status">等待中</div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    /**
     * 启动流水线执行
     */
    async start(taskData) {
        if (this.isRunning) return;
        
        this.isRunning = true;
        this.taskData = taskData;
        this.currentStageIndex = 0;

        for (let i = 0; i < PipelineStages.length; i++) {
            if (!this.isRunning) break;
            
            this.currentStageIndex = i;
            const stage = PipelineStages[i];
            
            // 更新节点状态为active
            this._setNodeStatus(i, 'active', '处理中...');
            
            // 记录开始时间
            const startTime = Date.now();
            
            // 触发回调
            if (this.onStageChange) {
                await this.onStageChange(stage, i, taskData);
            }
            
            // 模拟处理时间（不同阶段不同时长）
            const duration = this._getStageDuration(stage.id);
            await this._sleep(duration);
            
            // 记录耗时
            this.stageDurations[stage.id] = Date.now() - startTime;
            
            // 更新节点状态为completed
            this._setNodeStatus(i, 'completed', `${(this.stageDurations[stage.id] / 1000).toFixed(1)}s`);
            
            // 更新进度
            this._updateProgress(i + 1, PipelineStages.length);
        }

        this.isRunning = false;
        if (this.onComplete) {
            this.onComplete(this.stageDurations);
        }
    }

    /**
     * 停止流水线
     */
    stop() {
        this.isRunning = false;
    }

    /**
     * 重置流水线
     */
    reset() {
        this.isRunning = false;
        this.currentStageIndex = -1;
        this.stageDurations = {};
        
        document.querySelectorAll('.pipe-node').forEach(node => {
            node.className = 'pipe-node pending';
            node.querySelector('.node-status').textContent = '等待中';
        });
        
        document.getElementById('currentStage').textContent = '等待任务';
        document.getElementById('progressPercent').textContent = '0%';
    }

    /**
     * 获取当前阶段信息
     */
    getCurrentStage() {
        if (this.currentStageIndex >= 0 && this.currentStageIndex < PipelineStages.length) {
            return PipelineStages[this.currentStageIndex];
        }
        return null;
    }

    /**
     * 设置节点状态
     */
    _setNodeStatus(index, status, statusText) {
        const nodes = document.querySelectorAll('.pipe-node');
        if (nodes[index]) {
            nodes[index].className = `pipe-node ${status}`;
            const statusEl = nodes[index].querySelector('.node-status');
            if (statusEl) statusEl.textContent = statusText;
        }
    }

    /**
     * 更新进度显示
     */
    _updateProgress(completed, total) {
        const percent = Math.round((completed / total) * 100);
        const el = document.getElementById('progressPercent');
        if (el) el.textContent = `${percent}%`;
        
        const stageEl = document.getElementById('currentStage');
        if (stageEl && this.getCurrentStage()) {
            stageEl.textContent = this.getCurrentStage().name;
        }
    }

    /**
     * 模拟各阶段的处理时间（毫秒）
     */
    _getStageDuration(stageId) {
        const durations = {
            received: 500,
            analyzed: 1500,
            dispatched: 1000,
            designed: 2000,
            coded: 4000,      // 代码生成最慢
            reviewed: 2000,
            tested: 2500,
            built: 1500,
            deployed: 1000,
            documented: 1200,
            notified: 800,
            completed: 300
        };
        return durations[stageId] || 1000;
    }

    _sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// 导出全局实例
window.pipelineEngine = new PipelineEngine();
