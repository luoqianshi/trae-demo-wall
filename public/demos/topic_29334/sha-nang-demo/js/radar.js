// 沙囊AI - 雷达图模块

const RadarChart = {
  svg: null,
  tooltip: null,
  
  labels: ['人员能力', '制度完善', '财务健康', '经营效率', '销售竞争'],
  colors: ['#58A6FF', '#A371F7', '#F0883E', '#3FB950', '#F778BA'],
  keys: ['people', 'policies', 'finance', 'operations', 'sales'],
  cx: 120,
  cy: 120,
  r: 90,
  
  init() {
    this.svg = document.getElementById('radarChart');
    this.createTooltip();
    this.draw({ people: 50, policies: 50, finance: 50, operations: 50, sales: 50 });
  },
  
  createTooltip() {
    this.tooltip = document.createElement('div');
    this.tooltip.className = 'radar-tooltip';
    document.querySelector('.radar-container').appendChild(this.tooltip);
  },
  
  getPoint(deg, radius) {
    const rad = (deg * Math.PI) / 180;
    return {
      x: this.cx + radius * Math.cos(rad),
      y: this.cy + radius * Math.sin(rad)
    };
  },
  
  draw(scores) {
    const angles = this.keys.map((_, i) => -90 + i * 72);
    let html = '';
    
    // 网格
    [0.2, 0.4, 0.6, 0.8, 1.0].forEach(level => {
      const pts = angles.map(a => {
        const p = this.getPoint(a, this.r * level);
        return `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
      }).join(' ');
      html += `<polygon points="${pts}" fill="none" stroke="#30363D" stroke-width="0.5" opacity="0.5"/>`;
    });
    
    // 轴线
    angles.forEach(angle => {
      const p = this.getPoint(angle, this.r);
      html += `<line x1="${this.cx}" y1="${this.cy}" x2="${p.x.toFixed(1)}" y2="${p.y.toFixed(1)}" stroke="#30363D" stroke-width="1" opacity="0.6"/>`;
    });
    
    // 数据多边形
    const dataPoints = this.keys.map((key, i) => {
      const score = scores[key] || 50;
      const p = this.getPoint(angles[i], (this.r * score) / 100);
      return `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
    }).join(' ');
    html += `<polygon points="${dataPoints}" fill="rgba(88,166,255,0.12)" stroke="#58A6FF" stroke-width="2" stroke-opacity="0.7"/>`;
    
    // 数据点 + 标签
    this.keys.forEach((key, i) => {
      const score = scores[key] || 50;
      const p = this.getPoint(angles[i], (this.r * score) / 100);
      const lp = this.getPoint(angles[i], this.r + 22);
      
      // 可交互的数据点
      html += `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="5" fill="${this.colors[i]}" stroke="#0D1117" stroke-width="2" class="radar-point" data-key="${key}" data-score="${score}" data-label="${this.labels[i]}" style="cursor:pointer;transition:all 0.2s;"/>`;
      html += `<text x="${p.x.toFixed(1)}" y="${(p.y - 12).toFixed(1)}" text-anchor="middle" fill="${this.colors[i]}" font-size="11" font-weight="bold">${score}</text>`;
      html += `<text x="${lp.x.toFixed(1)}" y="${lp.y.toFixed(1)}" text-anchor="middle" fill="#8B949E" font-size="9">${this.labels[i]}</text>`;
    });
    
    // 中心总分
    const total = Object.values(scores).reduce((a, b) => a + b, 0);
    html += `<text x="${this.cx}" y="${this.cy + 4}" text-anchor="middle" fill="#E6EDF3" font-size="13" font-weight="bold">${total}</text>`;
    html += `<text x="${this.cx}" y="${this.cy + 18}" text-anchor="middle" fill="#6E7681" font-size="8">总分</text>`;
    
    this.svg.innerHTML = html;
    this.attachEvents();
  },
  
  attachEvents() {
    const points = this.svg.querySelectorAll('.radar-point');
    points.forEach(point => {
      point.addEventListener('mouseenter', (e) => {
        const key = e.target.dataset.key;
        const score = e.target.dataset.score;
        const label = e.target.dataset.label;
        
        e.target.setAttribute('r', '7');
        
        this.tooltip.innerHTML = `<strong style="color:var(--text-primary)">${label}</strong><br/><span style="color:var(--blue);font-size:14px;font-weight:600">${score}分</span>`;
        this.tooltip.classList.add('visible');
      });
      
      point.addEventListener('mousemove', (e) => {
        const rect = this.svg.getBoundingClientRect();
        this.tooltip.style.left = (e.clientX - rect.left + 10) + 'px';
        this.tooltip.style.top = (e.clientY - rect.top - 30) + 'px';
      });
      
      point.addEventListener('mouseleave', (e) => {
        e.target.setAttribute('r', '5');
        this.tooltip.classList.remove('visible');
      });
      
      point.addEventListener('click', (e) => {
        const key = e.target.dataset.key;
        // 高亮对应的分数条
        const bar = document.getElementById(`bar-${key}`);
        if (bar) {
          bar.style.filter = 'brightness(1.3)';
          setTimeout(() => { bar.style.filter = ''; }, 500);
        }
      });
    });
  },
  
  animate(targetScores, duration = 800) {
    const start = { people: 50, policies: 50, finance: 50, operations: 50, sales: 50 };
    const startTime = performance.now();
    
    const step = (now) => {
      const t = Math.min((now - startTime) / duration, 1);
      const ease = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      const current = {};
      for (const k in targetScores) {
        current[k] = Math.round(start[k] + (targetScores[k] - start[k]) * ease);
      }
      this.draw(current);
      if (t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }
};

// 导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { RadarChart };
}
