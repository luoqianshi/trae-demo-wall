/* ============================================ */
/* guide.js - 新手引导模块                      */
/* 作用：首次打开App时显示引导流程               */
/* ============================================ */

window.Guide = {
    currentStep: 0,
    steps: [
        {
            icon: '👋',
            title: '欢迎使用旅简！',
            desc: '一站式智能旅游规划助手，帮你轻松完成"找景点→挑餐馆→选交通→定行程"'
        },
        {
            icon: '🔍',
            title: '搜索城市或景点',
            desc: '在首页输入城市名或景点名，查看天气、景点、美食等推荐'
        },
        {
            icon: '📋',
            title: '添加景点，生成行程',
            desc: '点击景点加入行程，在"我的行程"中一键生成完整旅游安排'
        },
        {
            icon: '🤖',
            title: '智小程随时帮你',
            desc: '有任何问题都可以问智小程，景点、美食、天气、交通都能答！'
        }
    ],

    show() {
        this.currentStep = 0;
        this.renderStep();
    },

    renderStep() {
        const overlay = document.getElementById('guide-overlay');
        const step = this.steps[this.currentStep];

        overlay.classList.add('active');
        overlay.innerHTML = `
            <div style="background: var(--bg-card); border-radius: 16px; padding: 40px 30px; text-align: center; max-width: 320px; width: 90%;">
                <div style="font-size: 64px; margin-bottom: 20px;">${step.icon}</div>
                <h2 style="font-size: 20px; margin-bottom: 12px;">${step.title}</h2>
                <p style="font-size: 14px; color: var(--text-secondary); line-height: 1.6; margin-bottom: 24px;">${step.desc}</p>

                <!-- 进度指示器 -->
                <div style="display: flex; justify-content: center; gap: 6px; margin-bottom: 20px;">
                    ${this.steps.map((_, i) => `
                        <div style="width: ${i === this.currentStep ? '24px' : '8px'}; height: 8px; border-radius: 4px; background: ${i === this.currentStep ? 'var(--primary)' : 'var(--divider-color)'}; transition: all 0.3s;"></div>
                    `).join('')}
                </div>

                <div style="display: flex; gap: 12px;">
                    ${this.currentStep > 0 ? `
                        <button class="btn btn-default" style="flex: 1;" onclick="Guide.prevStep()">上一步</button>
                    ` : ''}
                    ${this.currentStep < this.steps.length - 1 ? `
                        <button class="btn btn-primary" style="flex: 1;" onclick="Guide.nextStep()">下一步</button>
                    ` : `
                        <button class="btn btn-primary" style="flex: 1;" onclick="Guide.close()">开始探索</button>
                    `}
                </div>

                <button class="btn-text" style="margin-top: 12px; font-size: 13px; color: var(--text-placeholder);" onclick="Guide.close()">跳过</button>
            </div>
        `;
    },

    nextStep() {
        if (this.currentStep < this.steps.length - 1) {
            this.currentStep++;
            this.renderStep();
        }
    },

    prevStep() {
        if (this.currentStep > 0) {
            this.currentStep--;
            this.renderStep();
        }
    },

    close() {
        document.getElementById('guide-overlay').classList.remove('active');
    },

    init() {}
};
