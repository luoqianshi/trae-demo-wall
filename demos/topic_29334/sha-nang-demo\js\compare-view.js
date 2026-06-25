// 沙囊AI - 场景对比模块

const CompareView = {
  show() {
    const overlay = document.getElementById('compareOverlay');
    const grid = document.getElementById('compareGrid');
    
    // 生成对比内容
    grid.innerHTML = scenarios.map((s, idx) => this.renderCompareCard(s, idx)).join('');
    
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  },
  
  hide() {
    const overlay = document.getElementById('compareOverlay');
    overlay.classList.remove('active');
    document.body.style.overflow = '';
  },
  
  renderCompareCard(s, idx) {
    const bestScenario = s.scenarios.reduce((best, sc) => sc.probValue > best.probValue ? sc : best, s.scenarios[0]);
    const worstScenario = s.scenarios.reduce((worst, sc) => sc.probValue < worst.probValue ? sc : worst, s.scenarios[0]);
    const topAction = s.actions.find(a => a.priority === 'high') || s.actions[0];
    
    const colors = ['var(--blue)', 'var(--pink)', 'var(--green-light)'];
    const bgColors = ['rgba(88,166,255,0.1)', 'rgba(247,120,186,0.1)', 'rgba(63,185,80,0.1)'];
    
    return `
      <div class="compare-card" style="border-top:3px solid ${colors[idx]}">
        <div class="compare-card-header" style="color:${colors[idx]}">
          ${s.icon} ${s.industry}
        </div>
        <div class="compare-card-item">
          <div class="compare-card-label">场景</div>
          <div class="compare-card-value">${s.title}</div>
        </div>
        <div class="compare-card-item">
          <div class="compare-card-label">推演置信度</div>
          <div class="compare-card-value" style="color:${s.confidence >= 70 ? 'var(--green-light)' : s.confidence >= 50 ? 'var(--orange)' : 'var(--red)'}">${s.confidence}%</div>
        </div>
        <div class="compare-card-item">
          <div class="compare-card-label">最可能情景</div>
          <div class="compare-card-value" style="color:${bestScenario.type === 'optimistic' ? 'var(--green-light)' : bestScenario.type === 'neutral' ? 'var(--orange)' : 'var(--red)'}">${bestScenario.label} (${bestScenario.prob})</div>
        </div>
        <div class="compare-card-item">
          <div class="compare-card-label">最大风险</div>
          <div class="compare-card-value" style="color:var(--red)">${worstScenario.label} (${worstScenario.prob})</div>
        </div>
        <div class="compare-card-item">
          <div class="compare-card-label">首要行动</div>
          <div class="compare-card-value">${topAction.text}</div>
        </div>
        <div class="compare-card-item">
          <div class="compare-card-label">认知盲区数</div>
          <div class="compare-card-value">${s.blindSpots.length} 个</div>
        </div>
      </div>
    `;
  }
};

// 导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { CompareView };
}
