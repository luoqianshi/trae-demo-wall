// 沙囊AI - 引导式首次体验

const Onboarding = {
  steps: [
    {
      title: '欢迎使用沙囊AI',
      desc: '沙囊AI是一个可塑的、有想象力的参谋。它不会替你做决定，而是帮你看到决策背后的更多可能性。'
    },
    {
      title: '第一步：选择场景',
      desc: '从三个真实的企业决策场景中，选择一个你最感兴趣的。每个场景都来自小微企业主的真实困惑。'
    },
    {
      title: '第二步：构建沙盘',
      desc: '点击"构建沙盘"，AI会分析你的企业情况，识别关键实体和特征标签。这是推演的基础。'
    },
    {
      title: '第三步：开始推演',
      desc: '点击"开始推演"，AI会从乐观、中性、悲观三个情景进行推演，帮你发现认知盲区。'
    },
    {
      title: '记住：AI是参谋，决策权在你',
      desc: 'AI推演仅供参考，不追求唯一正确答案。最终决策权永远在您手中。描述越详细，推演越准确。'
    }
  ],
  
  currentStep: 0,
  overlay: null,
  box: null,
  
  init() {
    // 检查是否已经看过引导
    const hasSeen = localStorage.getItem('sha-nang-onboarded');
    if (hasSeen) return;
    
    this.createOverlay();
    this.showStep(0);
  },
  
  createOverlay() {
    this.overlay = document.createElement('div');
    this.overlay.className = 'onboarding-overlay';
    this.overlay.innerHTML = `
      <div class="onboarding-box">
        <div class="onboarding-step-indicator">
          ${this.steps.map((_, i) => `<div class="onboarding-step-dot" data-step="${i}"></div>`).join('')}
        </div>
        <div class="onboarding-title" id="onboardingTitle"></div>
        <div class="onboarding-desc" id="onboardingDesc"></div>
        <div class="onboarding-buttons">
          <button class="onboarding-btn secondary" id="onboardingSkip">跳过</button>
          <button class="onboarding-btn primary" id="onboardingNext">下一步</button>
        </div>
      </div>
    `;
    document.body.appendChild(this.overlay);
    
    // 绑定事件
    document.getElementById('onboardingSkip').addEventListener('click', () => this.finish());
    document.getElementById('onboardingNext').addEventListener('click', () => this.next());
    
    // ESC键跳过
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.overlay.classList.contains('active')) {
        this.finish();
      }
    });
  },
  
  showStep(idx) {
    this.currentStep = idx;
    const step = this.steps[idx];
    
    document.getElementById('onboardingTitle').textContent = step.title;
    document.getElementById('onboardingDesc').textContent = step.desc;
    
    // 更新步骤指示器
    document.querySelectorAll('.onboarding-step-dot').forEach((dot, i) => {
      dot.classList.toggle('active', i === idx);
    });
    
    // 更新按钮文字
    const nextBtn = document.getElementById('onboardingNext');
    if (idx === this.steps.length - 1) {
      nextBtn.textContent = '开始使用';
    } else {
      nextBtn.textContent = '下一步';
    }
    
    this.overlay.classList.add('active');
  },
  
  next() {
    if (this.currentStep < this.steps.length - 1) {
      this.showStep(this.currentStep + 1);
    } else {
      this.finish();
    }
  },
  
  finish() {
    localStorage.setItem('sha-nang-onboarded', 'true');
    this.overlay.classList.remove('active');
    
    // 延迟移除DOM
    setTimeout(() => {
      if (this.overlay && this.overlay.parentNode) {
        this.overlay.parentNode.removeChild(this.overlay);
      }
    }, 300);
  }
};

// 导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { Onboarding };
}
