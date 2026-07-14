const esc = window.escapeHtml;
window.YXProgressChart = {
  renderCircle: function(container, options) {
    const { value, max, label, color = '#58CC02', size = 120 } = options;
    const percentage = Math.min((value / max) * 100, 100);
    const radius = (size - 12) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percentage / 100) * circumference;
    
    container.innerHTML = `
      <div style="display: flex; flex-direction: column; align-items: center;">
        <svg width="${size}" height="${size}" class="progress-circle">
          <circle
            cx="${size / 2}"
            cy="${size / 2}"
            r="${radius}"
            fill="none"
            stroke="#D4EDDA"
            stroke-width="8"
          />
          <circle
            cx="${size / 2}"
            cy="${size / 2}"
            r="${radius}"
            fill="none"
            stroke="${color}"
            stroke-width="8"
            stroke-linecap="round"
            stroke-dasharray="${circumference}"
            stroke-dashoffset="${offset}"
            transform="rotate(-90 ${size / 2} ${size / 2})"
            style="transition: stroke-dashoffset 0.5s ease;"
          />
          <text
            x="${size / 2}"
            y="${size / 2}"
            text-anchor="middle"
            dominant-baseline="middle"
            style="font-size: 24px; font-weight: 700; fill: var(--color-text);"
          >
            ${value}
          </text>
          <text
            x="${size / 2}"
            y="${size / 2 + 20}"
            text-anchor="middle"
            style="font-size: 12px; fill: var(--color-text-secondary);"
          >
            / ${max}
          </text>
        </svg>
        <div style="margin-top: 8px; font-size: 13px; color: var(--color-text-secondary);">${label}</div>
      </div>
    `;
  },
  
  renderBar: function(container, options) {
    const { label, value, max, color = '#58CC02', showLabel = true } = options;
    const percentage = Math.min((value / max) * 100, 100);
    
    container.innerHTML = `
      <div style="margin-bottom: 12px;">
        ${showLabel ? `
          <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
            <span style="font-size: 13px; color: var(--color-text);">${label}</span>
            <span style="font-size: 13px; color: var(--color-text-secondary);">${value}/${max} (${Math.round(percentage)}%)</span>
          </div>
        ` : ''}
        <div style="height: 8px; background: #D4EDDA; border-radius: 4px; overflow: hidden;">
          <div 
            style="height: 100%; background: ${color}; border-radius: 4px; transition: width 0.5s ease; width: ${percentage}%;"
          ></div>
        </div>
      </div>
    `;
  },
  
  renderStats: function(container, stats) {
    container.innerHTML = `
      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px;">
        ${stats.map(stat => `
          <div style="background: var(--color-primary-bg); border-radius: var(--radius-md); padding: 16px; text-align: center;">
            <div style="font-size: 28px; font-weight: 700; color: ${stat.color || 'var(--color-primary)'};">${esc(stat.value)}</div>
            <div style="font-size: 12px; color: var(--color-text-secondary); margin-top: 4px;">${esc(stat.label)}</div>
          </div>
        `).join('')}
      </div>
    `;
  },
  
  renderAchievements: function(container, achievements) {
    container.innerHTML = `
      <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px;">
        ${achievements.map(achievement => `
          <div style="aspect-ratio: 1; background: ${achievement.unlocked ? 'var(--color-primary-bg)' : '#D4EDDA'}; border-radius: var(--radius-md); display: flex; flex-direction: column; align-items: center; justify-content: center;">
            <div style="font-size: 24px; filter: ${achievement.unlocked ? 'none' : 'grayscale(100%)'};">${esc(achievement.icon)}</div>
            <div style="font-size: 10px; color: ${achievement.unlocked ? 'var(--color-text-secondary)' : '#BCAAA4'}; margin-top: 4px;">${esc(achievement.name)}</div>
          </div>
        `).join('')}
      </div>
    `;
  }
};