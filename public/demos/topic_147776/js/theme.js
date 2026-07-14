/**
 * 主题切换管理器
 */

class ThemeManager {
  constructor() {
    this.currentTheme = localStorage.getItem('dashboard-theme') || 'space';
    this.themes = ['space', 'aurora', 'cyber', 'forest', 'sunset'];
    this.themeNames = {
      space: '深空科技',
      aurora: '极光幻境',
      cyber: '赛博朋克',
      forest: '自然森林',
      sunset: '暖阳橙韵'
    };
    
    // 应用保存的主题
    this.applyTheme(this.currentTheme);
  }
  
  /**
   * 应用主题
   */
  applyTheme(themeName) {
    if (!this.themes.includes(themeName)) {
      console.warn(`未知主题: ${themeName}`);
      return;
    }
    
    this.currentTheme = themeName;
    document.documentElement.setAttribute('data-theme', themeName);
    localStorage.setItem('dashboard-theme', themeName);
    
    // 更新ECharts图表颜色
    this.updateChartsTheme();
    
    console.log(`主题已切换为: ${this.themeNames[themeName]}`);
  }
  
  /**
   * 获取当前主题
   */
  getCurrentTheme() {
    return this.currentTheme;
  }
  
  /**
   * 获取主题配置
   */
  getThemeConfig() {
    const rootStyles = getComputedStyle(document.documentElement);
    
    return {
      backgroundColor: rootStyles.getPropertyValue('--bg-primary').trim(),
      textColor: rootStyles.getPropertyValue('--text-primary').trim(),
      axisLineColor: rootStyles.getPropertyValue('--border-color').trim(),
      splitLineColor: rootStyles.getPropertyValue('--border-color').trim(),
      colors: [
        rootStyles.getPropertyValue('--chart-color-1').trim(),
        rootStyles.getPropertyValue('--chart-color-2').trim(),
        rootStyles.getPropertyValue('--chart-color-3').trim(),
        rootStyles.getPropertyValue('--chart-color-4').trim(),
        rootStyles.getPropertyValue('--chart-color-5').trim(),
        rootStyles.getPropertyValue('--chart-color-6').trim()
      ]
    };
  }
  
  /**
   * 更新ECharts图表主题
   */
  updateChartsTheme() {
    if (!window.echarts || !window.chartInstances) {
      return;
    }
    
    const config = this.getThemeConfig();
    
    // 遍历所有图表实例并更新
    Object.keys(window.chartInstances).forEach(key => {
      const chart = window.chartInstances[key];
      if (chart && chart.setOption) {
        const currentOption = chart.getOption();
        
        // 更新颜色配置
        const newOption = {
          color: config.colors,
          backgroundColor: 'transparent',
          textStyle: {
            color: config.textColor
          },
          title: {
            textStyle: {
              color: config.textColor
            }
          },
          legend: {
            textStyle: {
              color: config.textColor
            }
          },
          xAxis: currentOption.xAxis ? {
            axisLine: { lineStyle: { color: config.axisLineColor } },
            axisLabel: { textStyle: { color: config.textColor } },
            splitLine: { lineStyle: { color: config.splitLineColor } }
          } : undefined,
          yAxis: currentOption.yAxis ? {
            axisLine: { lineStyle: { color: config.axisLineColor } },
            axisLabel: { textStyle: { color: config.textColor } },
            splitLine: { lineStyle: { color: config.splitLineColor } }
          } : undefined
        };
        
        chart.setOption(newOption);
      }
    });
  }
  
  /**
   * 创建主题切换器UI
   */
  createSwitcherUI() {
    const switcher = document.createElement('div');
    switcher.className = 'theme-switcher';
    
    const title = document.createElement('div');
    title.className = 'theme-switcher-title';
    title.textContent = '主题切换';
    switcher.appendChild(title);
    
    this.themes.forEach(theme => {
      const btn = document.createElement('button');
      btn.className = 'theme-btn';
      btn.textContent = this.themeNames[theme];
      btn.dataset.theme = theme;
      
      if (theme === this.currentTheme) {
        btn.classList.add('active');
      }
      
      btn.addEventListener('click', () => {
        this.applyTheme(theme);
        
        // 更新按钮状态
        switcher.querySelectorAll('.theme-btn').forEach(b => {
          b.classList.remove('active');
        });
        btn.classList.add('active');
      });
      
      switcher.appendChild(btn);
    });
    
    document.body.appendChild(switcher);
    
    return switcher;
  }
}

// 创建全局实例
window.themeManager = new ThemeManager();

// DOM加载完成后创建UI
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.themeManager.createSwitcherUI();
  });
} else {
  window.themeManager.createSwitcherUI();
}
