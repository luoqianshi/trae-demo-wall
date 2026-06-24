// 沙囊AI - 主应用逻辑

const App = {
  currentScenario: 0,
  isBuilt: false,
  isReasoning: false,
  currentStep: 0,
  
  // 初始化
  init() {
    this.bindEvents();
    this.selectScenario(0);
    RadarChart.init();
    Onboarding.init();
    this.updateStepIndicator();
  },
  
  // 绑定事件
  bindEvents() {
    // 场景卡片点击
    document.querySelectorAll('.scenario-card').forEach((card, idx) => {
      card.addEventListener('click', () => this.selectScenario(idx));
    });
    
    // 构建沙盘按钮
    document.getElementById('buildBtn').addEventListener('click', () => this.buildSandbox());
    
    // 开始推演按钮
    document.getElementById('reasonBtn').addEventListener('click', () => this.startReasoning());
    
    // 取消推演
    document.getElementById('cancelReasoning').addEventListener('click', () => this.cancelReasoning());
    
    // 对比场景按钮
    document.getElementById('compareBtn').addEventListener('click', () => CompareView.show());
    
    // 关闭对比
    document.getElementById('closeCompare').addEventListener('click', () => CompareView.hide());
    
    // 快速标签点击
    document.getElementById('quickTags').addEventListener('click', (e) => {
      if (e.target.classList.contains('quick-tag')) {
        this.onQuickTagClick(e.target);
      }
    });
    
    // 推理链条折叠（动态生成的元素，使用事件委托）
    document.addEventListener('click', (e) => {
      if (e.target.closest('#reasoningChainTitle')) {
        const content = document.getElementById('reasoningChainContent');
        if (content) content.classList.toggle('collapsed');
      }
    });
    
    // 帮助按钮
    document.getElementById('helpFab').addEventListener('click', () => {
      window.open('help.html', '_blank');
    });
  },
  
  // 选择场景
  selectScenario(idx) {
    if (this.isReasoning) return;
    
    this.currentScenario = idx;
    this.isBuilt = false;
    this.currentStep = 0;
    
    // 更新场景卡片状态
    document.querySelectorAll('.scenario-card').forEach((c, i) => {
      c.classList.toggle('active', i === idx);
    });
    
    const s = scenarios[idx];
    
    // 更新表单内容
    document.getElementById('sandboxDesc').value = s.desc;
    document.getElementById('questionInput').value = s.question;
    document.getElementById('sandboxStatus').textContent = '尚未构建沙盘。请点击"构建沙盘"。';
    document.getElementById('sandboxStatus').classList.remove('built');
    
    // 重置按钮状态
    const buildBtn = document.getElementById('buildBtn');
    buildBtn.disabled = false;
    buildBtn.classList.remove('success');
    buildBtn.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
      构建沙盘
    `;
    
    document.getElementById('reasonBtn').disabled = true;
    document.getElementById('scoreBars').style.display = 'none';
    document.getElementById('buildProgress').classList.remove('active');
    
    // 重置结果区
    document.getElementById('resultPlaceholder').style.display = 'flex';
    document.getElementById('resultContent').style.display = 'none';
    document.getElementById('resultContent').innerHTML = '';
    document.getElementById('knowledgeSection').style.display = 'none';
    document.getElementById('knowledgeGrid').innerHTML = '';
    
    // 更新快速标签
    const tagsEl = document.getElementById('quickTags');
    tagsEl.innerHTML = s.quickTags.map(t => `<span class="quick-tag">${t}</span>`).join('');
    
    // 重置雷达图
    RadarChart.draw({ people: 50, policies: 50, finance: 50, operations: 50, sales: 50 });
    
    // 清空参谋对话
    AdvisorChat.clear();
    
    this.updateStepIndicator();
  },
  
  // 构建沙盘
  async buildSandbox() {
    if (this.isBuilt || this.isReasoning) return;
    
    const s = scenarios[this.currentScenario];
    const buildBtn = document.getElementById('buildBtn');
    const buildProgress = document.getElementById('buildProgress');
    
    // 禁用按钮
    buildBtn.disabled = true;
    buildBtn.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="animation:spin 0.8s linear infinite"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
      构建中...
    `;
    
    // 显示进度
    buildProgress.classList.add('active');
    
    const steps = [
      { id: 'buildStep1', text: '正在读取企业描述...', delay: 500 },
      { id: 'buildStep2', text: '识别关键实体...', delay: 800 },
      { id: 'buildStep3', text: '提取特征标签...', delay: 600 },
      { id: 'buildStep4', text: '生成能力评估...', delay: 500 }
    ];
    
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      const el = document.getElementById(step.id);
      
      // 标记为进行中
      el.classList.add('active');
      el.querySelector('.build-step-icon').textContent = '●';
      
      await this.delay(step.delay);
      
      // 标记为完成
      el.classList.remove('active');
      el.classList.add('done');
      el.querySelector('.build-step-icon').innerHTML = '✓';
    }
    
    // 构建完成
    this.isBuilt = true;
    this.currentStep = 1;
    
    // 更新状态
    document.getElementById('sandboxStatus').textContent = s.sandboxStatus;
    document.getElementById('sandboxStatus').classList.add('built');
    
    // 更新按钮
    buildBtn.classList.add('success');
    buildBtn.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
      沙盘已构建
    `;
    
    document.getElementById('reasonBtn').disabled = false;
    document.getElementById('scoreBars').style.display = 'block';
    
    // 动画显示分数条
    this.animateScoreBars(s.scores);
    
    // 动画雷达图
    RadarChart.animate(s.scores);
    
    // 显示标签云
    this.showTagCloud(s);
    
    this.updateStepIndicator();
    
    // 脉冲引导推演按钮
    setTimeout(() => {
      document.getElementById('reasonBtn').style.animation = 'pulse-glow 2s ease-in-out infinite';
    }, 500);
  },
  
  // 显示标签云
  showTagCloud(s) {
    const tagCloud = document.getElementById('tagCloud');
    const tags = this.extractTags(s.sandboxStatus);
    
    tagCloud.innerHTML = tags.map((tag, i) => 
      `<span class="tag-item" style="animation-delay:${i * 0.1}s">${tag}</span>`
    ).join('');
  },
  
  // 从沙盘状态提取标签
  extractTags(statusText) {
    const match = statusText.match(/提取 (\d+) 个特征标签：(.+)$/);
    if (match) {
      return match[2].split('、').slice(0, 8);
    }
    return [];
  },
  
  // 动画分数条
  animateScoreBars(scores) {
    const dims = ['people', 'policies', 'finance', 'operations', 'sales'];
    const colors = ['--blue', '--purple', '--orange', '--green-light', '--pink'];
    
    dims.forEach((dim, i) => {
      setTimeout(() => {
        const val = scores[dim];
        const bar = document.getElementById(`bar-${dim}`);
        const valEl = document.getElementById(`val-${dim}`);
        
        // 设置颜色类
        bar.className = 'score-bar-fill';
        if (val < 40) bar.classList.add('low');
        else if (val < 70) bar.classList.add('medium');
        else bar.classList.add('high');
        
        bar.style.width = val + '%';
        
        // 数字滚动动画
        this.countUp(valEl, val, 800);
        
      }, i * 150);
    });
  },
  
  // 数字滚动
  countUp(el, target, duration) {
    const start = performance.now();
    const startVal = 0;
    
    const step = (now) => {
      const t = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - t, 3);
      const current = Math.round(startVal + (target - startVal) * ease);
      el.textContent = current;
      if (t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  },
  
  // 开始推演
  async startReasoning() {
    if (!this.isBuilt || this.isReasoning) return;
    this.isReasoning = true;
    this.currentStep = 2;
    
    const overlay = document.getElementById('loadingOverlay');
    overlay.classList.add('active');
    
    const steps = [
      { id: 'loadStep1', desc: '解析决策问题中的关键变量和约束条件', delay: 800 },
      { id: 'loadStep2', desc: '调用沙盘模型，加载企业能力评估数据', delay: 700 },
      { id: 'loadStep3', desc: '进行多维度关系推理和情景模拟', delay: 1200 },
      { id: 'loadStep4', desc: '生成推演结论、盲区识别和行动建议', delay: 900 }
    ];
    
    let percent = 0;
    const percentEl = document.getElementById('loadingPercent');
    
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      const el = document.getElementById(step.id);
      const descEl = document.getElementById(step.id + 'Desc');
      
      // 标记为进行中
      if (i > 0) {
        document.getElementById(steps[i-1].id).classList.remove('active');
        document.getElementById(steps[i-1].id).classList.add('done');
      }
      el.classList.add('active');
      
      // 打字机效果显示描述
      if (descEl) {
        descEl.textContent = '';
        await this.typewriter(descEl, step.desc, 20);
      }
      
      // 更新百分比
      const targetPercent = ((i + 1) / steps.length) * 100;
      await this.animatePercent(percentEl, percent, targetPercent, step.delay);
      percent = targetPercent;
    }
    
    // 最后一步完成
    document.getElementById(steps[steps.length - 1].id).classList.remove('active');
    document.getElementById(steps[steps.length - 1].id).classList.add('done');
    
    await this.delay(400);
    
    overlay.classList.remove('active');
    this.showResults();
    this.isReasoning = false;
    this.currentStep = 3;
    this.updateStepIndicator();
    
    // 停止推演按钮脉冲
    document.getElementById('reasonBtn').style.animation = '';
  },
  
  // 取消推演
  cancelReasoning() {
    this.isReasoning = false;
    document.getElementById('loadingOverlay').classList.remove('active');
  },
  
  // 打字机效果
  async typewriter(el, text, speed) {
    for (let i = 0; i < text.length; i++) {
      el.textContent += text[i];
      await this.delay(speed);
    }
  },
  
  // 动画百分比
  async animatePercent(el, from, to, duration) {
    const start = performance.now();
    
    return new Promise(resolve => {
      const step = (now) => {
        const t = Math.min((now - start) / duration, 1);
        const ease = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
        const current = Math.round(from + (to - from) * ease);
        el.textContent = current + '%';
        if (t < 1) requestAnimationFrame(step);
        else resolve();
      };
      requestAnimationFrame(step);
    });
  },
  
  // 显示结果
  showResults() {
    const s = scenarios[this.currentScenario];
    
    document.getElementById('resultPlaceholder').style.display = 'none';
    const content = document.getElementById('resultContent');
    content.style.display = 'block';
    
    let html = '';
    
    // 置信度仪表盘
    html += this.renderConfidenceGauge(s.confidence, s.confidenceFactors);
    
    // 概率分布条
    html += this.renderProbDistribution(s.scenarios);
    
    // 三情景结果
    html += `<div class="scenario-results">`;
    s.scenarios.forEach((sc, i) => {
      const expanded = sc.type === 'neutral' ? 'expanded' : '';
      html += `
        <div class="scenario-item ${sc.type} ${expanded}" onclick="this.classList.toggle('expanded')" style="animation-delay:${i * 0.1}s">
          <div class="scenario-item-header">
            <span class="scenario-item-label">${sc.label}</span>
            <span class="scenario-item-prob">${sc.prob}</span>
          </div>
          <div class="scenario-item-desc">${sc.desc}</div>
        </div>
      `;
    });
    html += `</div>`;
    
    // 推理链条
    html += this.renderReasoningChain(s.reasoning);
    
    // 认知盲区
    html += this.renderBlindSpots(s.blindSpots);
    
    // 行动建议
    html += this.renderActions(s.actions);
    
    // AI诚实提示
    html += this.renderAIHonesty(s.confidence, s.confidenceFactors);
    
    // 信息缺口
    html += this.renderInfoGaps(s.infoGaps);
    
    // 决策权提示
    html += `
      <div class="decision-notice">
        <strong>最终决策权在您手中</strong><br/>
        AI推演仅供参考，请结合实际情况做出最终判断
      </div>
    `;
    
    // 参谋对话
    html += AdvisorChat.render(s.advisorDialog);
    
    // 免责声明
    html += `
      <div class="disclaimer">
        结果仅供参考。AI推演依赖您提供的信息和当前技术能力，可能存在错误或遗漏。<br/>
        描述越详细，推演越准确。最终决策请结合实际情况，由您和团队共同做出。
      </div>
    `;
    
    content.innerHTML = html;
    
    // 动画显示置信度仪表盘
    setTimeout(() => this.animateGauge(s.confidence), 100);
    
    // 显示知识库
    document.getElementById('knowledgeSection').style.display = 'block';
    document.getElementById('knowledgeGrid').innerHTML = s.knowledge.map((k, i) => `
      <div class="knowledge-card fade-in-up" style="animation-delay:${i * 0.1}s">
        <div class="knowledge-card-inner">
          <div class="knowledge-card-front">
            <div class="knowledge-card-title">${k.title}</div>
            <div class="knowledge-card-desc">${k.desc}</div>
          </div>
          <div class="knowledge-card-back">
            <div class="knowledge-card-title" style="color:var(--purple)">应用场景</div>
            <div class="knowledge-card-apply">${k.apply}</div>
          </div>
        </div>
      </div>
    `).join('');
    
    // 绑定盲区点击事件
    this.bindBlindSpotEvents();
    
    // 绑定参谋对话事件
    AdvisorChat.bindEvents(s.advisorDialog);
  },
  
  // 渲染置信度仪表盘
  renderConfidenceGauge(confidence, factors) {
    const circumference = 2 * Math.PI * 52;
    const offset = circumference - (confidence / 100) * circumference;
    
    let color = 'var(--green-light)';
    if (confidence < 50) color = 'var(--red)';
    else if (confidence < 70) color = 'var(--orange)';
    
    return `
      <div class="confidence fade-in-up">
        <div class="confidence-gauge">
          <svg width="120" height="120" viewBox="0 0 120 120">
            <circle class="confidence-gauge-bg" cx="60" cy="60" r="52"/>
            <circle class="confidence-gauge-fill" cx="60" cy="60" r="52" 
              stroke="${color}" 
              stroke-dasharray="${circumference}" 
              stroke-dashoffset="${circumference}"
              data-target-offset="${offset}"/>
          </svg>
          <div class="confidence-value" style="color:${color}">${confidence}%</div>
        </div>
        <div class="confidence-label">推演置信度</div>
        <div class="confidence-factors">
          <div class="confidence-factors-title">影响置信度的因素</div>
          ${factors.map(f => `• ${f}`).join('<br/>')}
        </div>
      </div>
    `;
  },
  
  // 动画仪表盘
  animateGauge(confidence) {
    const circle = document.querySelector('.confidence-gauge-fill');
    if (circle) {
      const targetOffset = circle.dataset.targetOffset;
      setTimeout(() => {
        circle.style.strokeDashoffset = targetOffset;
      }, 200);
    }
  },
  
  // 渲染概率分布条
  renderProbDistribution(scenarios) {
    return `
      <div class="prob-distribution fade-in-up" style="animation-delay:0.1s">
        ${scenarios.map(s => `
          <div class="prob-bar ${s.type}" style="width:0%" data-width="${s.probValue}%"></div>
        `).join('')}
      </div>
      <div style="display:flex;justify-content:space-between;font-size:11px;color:var(--text-muted);margin-bottom:12px">
        <span style="color:var(--green-light)">乐观 ${scenarios[0].prob}</span>
        <span style="color:var(--orange)">中性 ${scenarios[1].prob}</span>
        <span style="color:var(--red)">悲观 ${scenarios[2].prob}</span>
      </div>
    `;
  },
  
  // 渲染推理链条
  renderReasoningChain(reasoning) {
    return `
      <div class="reasoning-chain fade-in-up" style="animation-delay:0.2s">
        <div class="reasoning-chain-title" id="reasoningChainTitle" style="cursor:pointer">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>
          推理链条
          <span style="margin-left:auto;font-size:11px;color:var(--text-muted);font-weight:normal">点击展开/折叠</span>
        </div>
        <div class="reasoning-chain-content" id="reasoningChainContent">
          ${reasoning.map((r, i) => `
            <div class="reasoning-step" style="animation-delay:${i * 0.1}s">
              <span class="step-num">${i + 1}</span>
              <span class="step-text">${r}</span>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  },
  
  // 渲染认知盲区
  renderBlindSpots(blindSpots) {
    return `
      <div class="blind-spots fade-in-up" style="animation-delay:0.3s">
        <div class="blind-spots-title">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
          AI 发现的认知盲区
        </div>
        ${blindSpots.map((b, i) => `
          <div class="blind-spot-item" data-index="${i}">
            <div class="spot-summary">
              <span>• ${b.text}</span>
              <svg class="expand-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>
            </div>
            <div class="spot-detail">${b.detail}</div>
          </div>
        `).join('')}
      </div>
    `;
  },
  
  // 绑定盲区事件
  bindBlindSpotEvents() {
    document.querySelectorAll('.blind-spot-item').forEach(item => {
      item.addEventListener('click', () => {
        item.classList.toggle('expanded');
      });
    });
  },
  
  // 渲染行动建议
  renderActions(actions) {
    const priorityMap = { high: '高', medium: '中', low: '低' };
    return `
      <div class="action-items fade-in-up" style="animation-delay:0.4s">
        <div class="action-items-title">行动建议</div>
        ${actions.map(a => `
          <div class="action-item">
            <span class="action-priority ${a.priority}">${priorityMap[a.priority]}</span>
            <span>${a.text}</span>
          </div>
        `).join('')}
      </div>
    `;
  },
  
  // 渲染AI诚实提示
  renderAIHonesty(confidence, factors) {
    return `
      <div class="ai-honesty fade-in-up" style="animation-delay:0.5s">
        <div class="ai-honesty-title">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
          AI的诚实告白
        </div>
        <div class="ai-honesty-content">
          <p>本次推演基于您提供的有限信息，置信度为 <strong>${confidence}%</strong>。以下因素可能影响准确性：</p>
          <ul>
            ${factors.map(f => `<li>${f}</li>`).join('')}
          </ul>
          <p style="margin-top:8px;color:var(--text-muted)">描述越详细，推演越准确。您可以补充更多信息后重新推演。</p>
        </div>
      </div>
    `;
  },
  
  // 渲染信息缺口
  renderInfoGaps(gaps) {
    return `
      <div class="info-gaps fade-in-up" style="animation-delay:0.55s">
        <div class="info-gaps-title">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>
          AI 还需要知道
        </div>
        ${gaps.map(g => `<div class="info-gap-item">${g}</div>`).join('')}
      </div>
    `;
  },
  
  // 快速标签点击
  onQuickTagClick(tagEl) {
    // 视觉反馈
    tagEl.style.transform = 'scale(0.95)';
    setTimeout(() => {
      tagEl.style.transform = '';
    }, 150);
    
    // 如果已经构建沙盘，可以在这里添加更多交互
    if (this.isBuilt) {
      // 可以高亮相关的内容
    }
  },
  
  // 更新步骤指示器
  updateStepIndicator() {
    const dots = document.querySelectorAll('.step-dot');
    const labels = ['选场景', '构建沙盘', '开始推演', '查看结论'];
    
    dots.forEach((dot, i) => {
      dot.classList.remove('active', 'completed');
      if (i === this.currentStep) {
        dot.classList.add('active');
      } else if (i < this.currentStep) {
        dot.classList.add('completed');
      }
    });
  },
  
  // 延迟工具
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
};

// 启动应用
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
