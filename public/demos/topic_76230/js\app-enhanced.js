/**
 * 财富江湖 - 3D增强版主程序
 * 功能：粒子系统、3D交互、AI可视化、动态效果
 */

// ============================================
// 全局状态管理
// ============================================
const AppState = {
  user: {
    name: '少侠',
    level: 1,
    title: '初入江湖',
    city: '某城',
    stats: { wisdom: 10, courage: 10, fortune: 10 },
    exp: 0,
    expMax: 100
  },
  ai: {
    mode: 'simulation',
    processing: false
  },
  settings: {
    particles: true,
    sound: false,
    animations: true
  }
};

// ============================================
// 粒子系统 - 水墨风格
// ============================================
class ParticleSystem {
  constructor() {
    this.canvas = null;
    this.ctx = null;
    this.particles = [];
    this.animationId = null;
    this.isActive = false;
  }

  init() {
    // 创建粒子画布
    this.canvas = document.createElement('canvas');
    this.canvas.id = 'particles-canvas';
    this.canvas.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 0;
      pointer-events: none;
      opacity: 0.6;
    `;
    document.body.insertBefore(this.canvas, document.body.firstChild);
    
    this.ctx = this.canvas.getContext('2d');
    this.resize();
    
    // 创建粒子
    this.createParticles();
    
    // 开始动画
    this.isActive = true;
    this.animate();
    
    // 监听窗口大小变化
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  createParticles() {
    const count = Math.min(50, Math.floor(window.innerWidth / 30));
    this.particles = [];
    
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height,
        size: Math.random() * 3 + 1,
        speedX: (Math.random() - 0.5) * 0.3,
        speedY: (Math.random() - 0.5) * 0.3,
        opacity: Math.random() * 0.3 + 0.1,
        color: this.getRandomColor()
      });
    }
  }

  getRandomColor() {
    const colors = [
      'rgba(74, 124, 89, ',    // 山绿
      'rgba(126, 200, 227, ',  // 水蓝
      'rgba(212, 168, 67, ',   // 金色
      'rgba(192, 57, 43, ',    // 朱红
      'rgba(141, 132, 104, '   // 石色
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  animate() {
    if (!this.isActive) return;
    
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.particles.forEach(p => {
      // 更新位置
      p.x += p.speedX;
      p.y += p.speedY;
      
      // 边界处理
      if (p.x < 0) p.x = this.canvas.width;
      if (p.x > this.canvas.width) p.x = 0;
      if (p.y < 0) p.y = this.canvas.height;
      if (p.y > this.canvas.height) p.y = 0;
      
      // 绘制粒子 - 水墨风格
      const gradient = this.ctx.createRadialGradient(
        p.x, p.y, 0,
        p.x, p.y, p.size * 2
      );
      gradient.addColorStop(0, p.color + p.opacity + ')');
      gradient.addColorStop(1, p.color + '0)');
      
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size * 2, 0, Math.PI * 2);
      this.ctx.fillStyle = gradient;
      this.ctx.fill();
    });
    
    // 绘制连线 - 营造水墨晕染效果
    this.drawConnections();
    
    this.animationId = requestAnimationFrame(() => this.animate());
  }

  drawConnections() {
    const maxDistance = 100;
    
    for (let i = 0; i < this.particles.length; i++) {
      for (let j = i + 1; j < this.particles.length; j++) {
        const dx = this.particles[i].x - this.particles[j].x;
        const dy = this.particles[i].y - this.particles[j].y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < maxDistance) {
          const opacity = (1 - distance / maxDistance) * 0.1;
          this.ctx.beginPath();
          this.ctx.moveTo(this.particles[i].x, this.particles[i].y);
          this.ctx.lineTo(this.particles[j].x, this.particles[j].y);
          this.ctx.strokeStyle = `rgba(74, 124, 89, ${opacity})`;
          this.ctx.lineWidth = 0.5;
          this.ctx.stroke();
        }
      }
    }
  }

  destroy() {
    this.isActive = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    if (this.canvas && this.canvas.parentNode) {
      this.canvas.parentNode.removeChild(this.canvas);
    }
  }
}

// ============================================
// 3D交互系统
// ============================================
class Interaction3D {
  constructor() {
    this.mouseX = 0;
    this.mouseY = 0;
    this.targetX = 0;
    this.targetY = 0;
    this.isActive = false;
  }

  init() {
    this.isActive = true;
    
    // 监听鼠标移动
    document.addEventListener('mousemove', (e) => {
      this.mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
      this.mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
    });
    
    // 更新3D效果
    this.update();
  }

  update() {
    if (!this.isActive) return;
    
    // 平滑插值
    this.targetX += (this.mouseX - this.targetX) * 0.05;
    this.targetY += (this.mouseY - this.targetY) * 0.05;
    
    // 应用到世界舞台
    const worldStage = document.querySelector('.world-stage');
    if (worldStage) {
      worldStage.style.transform = `
        perspective(1200px) 
        rotateX(${this.targetY * 2}deg) 
        rotateY(${this.targetX * 2}deg)
      `;
    }
    
    // 应用到浮动面板
    const panels = document.querySelectorAll('.float-panel');
    panels.forEach((panel, index) => {
      const depth = (index + 1) * 10;
      panel.style.transform = `
        translateZ(${depth}px)
        rotateX(${this.targetY * -1}deg)
        rotateY(${this.targetX * -1}deg)
      `;
    });
    
    requestAnimationFrame(() => this.update());
  }
}

// ============================================
// AI可视化系统
// ============================================
class AIVisualization {
  constructor() {
    this.container = null;
    this.isActive = false;
  }

  show() {
    // 创建AI可视化容器
    this.container = document.createElement('div');
    this.container.className = 'ai-visualization active';
    this.container.innerHTML = `
      <div class="ai-core">
        <div class="ai-rings">
          <div class="ai-ring"></div>
          <div class="ai-ring"></div>
          <div class="ai-ring"></div>
        </div>
      </div>
      <div class="ai-data-streams"></div>
    `;
    
    document.body.appendChild(this.container);
    this.isActive = true;
    
    // 添加数据流
    this.createDataStreams();
    
    // 3秒后自动隐藏
    setTimeout(() => this.hide(), 3000);
  }

  createDataStreams() {
    const streamsContainer = this.container.querySelector('.ai-data-streams');
    
    for (let i = 0; i < 8; i++) {
      const stream = document.createElement('div');
      stream.className = 'data-stream';
      stream.style.cssText = `
        position: absolute;
        width: 2px;
        height: 80px;
        background: linear-gradient(to bottom, transparent, var(--tech-cyan), transparent);
        left: ${50 + (Math.random() - 0.5) * 100}px;
        top: ${50 + (Math.random() - 0.5) * 100}px;
        animation: dataFlow ${0.8 + Math.random() * 0.4}s linear infinite;
        animation-delay: ${Math.random() * 1}s;
      `;
      streamsContainer.appendChild(stream);
    }
  }

  hide() {
    if (this.container) {
      this.container.classList.remove('active');
      setTimeout(() => {
        if (this.container && this.container.parentNode) {
          this.container.parentNode.removeChild(this.container);
        }
        this.isActive = false;
      }, 500);
    }
  }
}

// ============================================
// 页面过渡动画
// ============================================
class PageTransition {
  constructor() {
    this.overlay = null;
  }

  init() {
    this.overlay = document.createElement('div');
    this.overlay.className = 'page-transition';
    document.body.appendChild(this.overlay);
  }

  transition(url) {
    this.overlay.classList.add('active');
    
    setTimeout(() => {
      window.location.href = url;
    }, 300);
  }
}

// ============================================
// 打字机效果
// ============================================
class Typewriter {
  constructor(element, text, speed = 50) {
    this.element = element;
    this.text = text;
    this.speed = speed;
    this.index = 0;
    this.isTyping = false;
  }

  start() {
    this.isTyping = true;
    this.element.classList.add('typing');
    this.element.textContent = '';
    this.type();
  }

  type() {
    if (!this.isTyping) return;
    
    if (this.index < this.text.length) {
      this.element.textContent += this.text.charAt(this.index);
      this.index++;
      setTimeout(() => this.type(), this.speed);
    } else {
      this.element.classList.remove('typing');
      this.isTyping = false;
    }
  }

  stop() {
    this.isTyping = false;
    this.element.classList.remove('typing');
  }
}

// ============================================
// 滚动视差效果
// ============================================
class ParallaxScroll {
  constructor() {
    this.elements = [];
  }

  init() {
    // 收集需要视差效果的元素
    this.elements = document.querySelectorAll('.parallax-layer');
    
    window.addEventListener('scroll', () => this.update());
  }

  update() {
    const scrollY = window.scrollY;
    
    this.elements.forEach((el, index) => {
      const speed = (index + 1) * 0.1;
      el.style.transform = `translateY(${scrollY * speed}px)`;
    });
  }
}

// ============================================
// 建筑交互增强
// ============================================
class BuildingInteraction {
  constructor() {
    this.buildings = [];
  }

  init() {
    this.buildings = document.querySelectorAll('.map-building');
    
    this.buildings.forEach(building => {
      // 鼠标进入效果
      building.addEventListener('mouseenter', () => {
        this.onHover(building);
      });
      
      // 鼠标离开效果
      building.addEventListener('mouseleave', () => {
        this.onLeave(building);
      });
      
      // 点击效果
      building.addEventListener('click', (e) => {
        this.onClick(building, e);
      });
    });
  }

  onHover(building) {
    // 播放音效（如果开启）
    if (AppState.settings.sound) {
      this.playHoverSound();
    }
    
    // 创建涟漪效果
    this.createRipple(building);
  }

  onLeave(building) {
    // 清理效果
  }

  onClick(building, e) {
    e.preventDefault();
    
    // 显示AI处理效果
    building.classList.add('ai-processing');
    
    // 显示AI可视化
    const aiViz = new AIVisualization();
    aiViz.show();
    
    // 获取目标URL
    const url = building.getAttribute('data-url') || building.onclick;
    
    // 延迟跳转
    setTimeout(() => {
      building.classList.remove('ai-processing');
      if (typeof url === 'function') {
        url();
      } else if (url) {
        window.location.href = url;
      }
    }, 1500);
  }

  createRipple(building) {
    const icon = building.querySelector('.b-icon');
    if (!icon) return;
    
    const ripple = document.createElement('div');
    ripple.style.cssText = `
      position: absolute;
      inset: -10px;
      border: 2px solid rgba(212, 168, 67, 0.5);
      border-radius: 50%;
      animation: rippleEffect 0.6s ease-out forwards;
      pointer-events: none;
    `;
    
    icon.appendChild(ripple);
    
    setTimeout(() => {
      if (ripple.parentNode) {
        ripple.parentNode.removeChild(ripple);
      }
    }, 600);
  }

  playHoverSound() {
    // 音效实现
  }
}

// 添加涟漪动画
const style = document.createElement('style');
style.textContent = `
  @keyframes rippleEffect {
    0% { transform: scale(1); opacity: 1; }
    100% { transform: scale(1.5); opacity: 0; }
  }
`;
document.head.appendChild(style);

// ============================================
// 经验条动画
// ============================================
class ExpBarAnimation {
  constructor() {
    this.bars = [];
  }

  init() {
    this.bars = document.querySelectorAll('.exp-fill');
    this.animateBars();
  }

  animateBars() {
    this.bars.forEach(bar => {
      const width = bar.style.width || bar.getAttribute('data-width') || '0%';
      bar.style.width = '0%';
      
      setTimeout(() => {
        bar.style.width = width;
      }, 300);
    });
  }
}

// ============================================
// 导航栏滚动效果
// ============================================
class NavbarScroll {
  constructor() {
    this.navbar = null;
    this.lastScroll = 0;
  }

  init() {
    this.navbar = document.querySelector('.top-nav');
    if (!this.navbar) return;
    
    window.addEventListener('scroll', () => this.update());
  }

  update() {
    const currentScroll = window.scrollY;
    
    if (currentScroll > 50) {
      this.navbar.classList.add('scrolled');
    } else {
      this.navbar.classList.remove('scrolled');
    }
    
    this.lastScroll = currentScroll;
  }
}

// ============================================
// 工具函数
// ============================================
const Utils = {
  // 防抖函数
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

  // 节流函数
  throttle(func, limit) {
    let inThrottle;
    return function(...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  },

  // 随机数生成
  random(min, max) {
    return Math.random() * (max - min) + min;
  },

  // 缓动函数
  easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }
};

// ============================================
// 初始化
// ============================================
function initApp() {
  console.log('🏔️ 财富江湖 - 3D增强版启动');
  
  // 初始化粒子系统
  const particles = new ParticleSystem();
  particles.init();
  
  // 初始化3D交互
  const interaction3D = new Interaction3D();
  interaction3D.init();
  
  // 初始化建筑交互
  const buildingInteraction = new BuildingInteraction();
  buildingInteraction.init();
  
  // 初始化导航栏滚动效果
  const navbarScroll = new NavbarScroll();
  navbarScroll.init();
  
  // 初始化经验条动画
  const expBarAnimation = new ExpBarAnimation();
  expBarAnimation.init();
  
  // 初始化视差滚动
  const parallaxScroll = new ParallaxScroll();
  parallaxScroll.init();
  
  // 初始化页面过渡
  const pageTransition = new PageTransition();
  pageTransition.init();
  
  // 替换原有的goTo函数
  window.goTo = function(url) {
    pageTransition.transition(url);
  };
  
  // 添加NPC打字机效果
  const npcText = document.querySelector('.npc-text');
  if (npcText) {
    const text = npcText.textContent;
    const typewriter = new Typewriter(npcText, text, 30);
    typewriter.start();
  }
  
  console.log('✨ 所有系统初始化完成');
}

// DOM加载完成后初始化
document.addEventListener('DOMContentLoaded', initApp);

// 导出模块
window.WealthJianghu = {
  AppState,
  ParticleSystem,
  AIVisualization,
  Utils
};

// ============================================
// 功能一：AI 武侠章回体小说自动生成
// ============================================
const NOVEL_TITLES = ['钱途漫漫录', '财富江湖志', '金银岛奇谭', '铜钱外传', '小满江湖奇遇记', '青蚨记'];

window.generateNovel = function() {
  const d = typeof getData === 'function' ? getData() : {};
  const chapters = d.chapters || [];
  let events = [];
  if (typeof getEvents === 'function') {
    events = getEvents();
  } else {
    try {
      const raw = localStorage.getItem('wealth_jianghu_events');
      events = raw ? JSON.parse(raw) : [];
    } catch(e) {}
  }
  if (chapters.length === 0 && events.length === 0) {
    alert('尚无江湖事迹，去各处走走积累阅历后再来著书。');
    return null;
  }

  // 合并事件和章回到时间线
  const timeline = [];
  chapters.forEach(ch => {
    timeline.push({ type: 'chapter', time: ch.date || '', data: ch });
  });
  events.forEach(ev => {
    if (ev.style !== 'good' && ev.style !== 'warn' && ev.style !== 'bad') return;
    const time = ev.time ? ev.time.slice(0, 10) : '';
    if (!timeline.find(t => t.type === 'event' && t.data.id === ev.id)) {
      timeline.push({ type: 'event', time: time, data: ev });
    }
  });
  timeline.sort((a, b) => (a.time || '').localeCompare(b.time || ''));

  const heroName = (d.user && d.user.name) || (d.hero && d.hero.name) || '少侠';
  const title = NOVEL_TITLES[Math.floor(Math.random() * NOVEL_TITLES.length)];

  const contentParts = [];
  let chapterIndex = 0;

  timeline.forEach(item => {
    if (item.type === 'chapter') {
      chapterIndex++;
      const ch = item.data;
      const chTitle = ch.title || `第${toChineseNum ? toChineseNum(chapterIndex) : chapterIndex}回 · 江湖行`;
      const body = ch.body || '';
      contentParts.push({ type: 'chapter', title: chTitle, body });
    } else if (item.type === 'event') {
      chapterIndex++;
      const ev = item.data;
      let evTitle = '';
      let evBody = '';
      const npc = ev.npc || '江湖侠客';
      const msg = ev.message || '';
      if (ev.style === 'good') {
        evTitle = `第${toChineseNum ? toChineseNum(chapterIndex) : chapterIndex}回 · 吉星高照`;
        evBody = `这日${heroName}行至途中，${npc}飘然而至，言道："${msg}"${heroName}闻言大喜，心中豁然开朗。`;
      } else if (ev.style === 'warn') {
        evTitle = `第${toChineseNum ? toChineseNum(chapterIndex) : chapterIndex}回 · 江湖警示`;
        evBody = `${npc}拦住去路，正色道："${msg}"${heroName}心中一凛，暗自记下。`;
      } else {
        evTitle = `第${toChineseNum ? toChineseNum(chapterIndex) : chapterIndex}回 · 暗流涌动`;
        evBody = `忽闻${npc}低语："${msg}"江湖险恶，此言不虚。${heroName}握紧钱袋，打定主意。`;
      }
      contentParts.push({ type: 'chapter', title: evTitle, body: evBody });
    }
  });

  const novel = {
    title,
    author: heroName,
    generatedAt: new Date().toISOString(),
    chapters: contentParts
  };

  try { localStorage.setItem('wealth_jianghu_novel', JSON.stringify(novel)); } catch(e) {}
  return novel;
};

window.showNovel = function() {
  let novel;
  try {
    const raw = localStorage.getItem('wealth_jianghu_novel');
    novel = raw ? JSON.parse(raw) : null;
  } catch(e) { novel = null; }

  if (!novel || !novel.chapters || novel.chapters.length === 0) {
    novel = window.generateNovel();
    if (!novel) return;
  }

  const existing = document.getElementById('novel-modal');
  if (existing) existing.remove();

  const modal = document.createElement('div');
  modal.id = 'novel-modal';
  modal.className = 'novel-modal';

  const chaptersHTML = novel.chapters.map((ch, i) => {
    const divider = i > 0 ? '<div class="novel-divider">◆ ◆ ◆</div>' : '';
    return divider + '<div class="novel-chapter"><h3>' + ch.title + '</h3><p>' + ch.body + '</p></div>';
  }).join('');

  modal.innerHTML = `
    <div class="novel-paper">
      <div class="novel-scroll">
        <div class="novel-title">${novel.title}</div>
        ${chaptersHTML}
        <div class="novel-divider">◆ ◆ ◆</div>
        <div class="novel-ending">欲知后事如何，且听下回分解。</div>
      </div>
      <div class="novel-btn-row">
        <button class="btn-novel-action btn-novel-pdf" onclick="window.exportNovelPDF()">下载 PDF</button>
        <button class="btn-novel-action btn-novel-close" onclick="window.closeNovel()">关闭</button>
      </div>
    </div>
  `;

  modal.addEventListener('click', function(e) {
    if (e.target === modal) window.closeNovel();
  });
  document.body.appendChild(modal);
};

window.closeNovel = function() {
  const modal = document.getElementById('novel-modal');
  if (modal) modal.remove();
};

window.exportNovelPDF = function() {
  const novelPaper = document.querySelector('.novel-paper');
  if (!novelPaper) return;
  const clone = novelPaper.cloneNode(true);
  const btnRow = clone.querySelector('.novel-btn-row');
  if (btnRow) btnRow.remove();

  const printWin = window.open('', '_blank', 'width=800,height=600');
  if (!printWin) { alert('请允许弹窗以打印小说。'); return; }
  printWin.document.write('<!DOCTYPE html><html><head><meta charset="UTF-8"><title>江湖录</title><style>'
    + 'body { font-family: "Noto Serif SC", "STKaiti", "KaiTi", serif; background: #fff; padding: 40px; color: #2C2C2C; }'
    + '.novel-paper { max-width: 680px; margin: 0 auto; background: #F5F0E0; padding: 32px 28px; border: 4px solid #8B7D6B; }'
    + '.novel-title { text-align: center; font-size: 28px; font-weight: 700; letter-spacing: 4px; padding-bottom: 20px; border-bottom: 1px solid rgba(139,125,107,0.3); margin-bottom: 24px; }'
    + '.novel-chapter { margin-bottom: 28px; }'
    + '.novel-chapter h3 { font-size: 17px; font-weight: 700; color: #5B3A1A; letter-spacing: 2px; margin-bottom: 10px; padding-left: 12px; border-left: 3px solid #C0392B; }'
    + '.novel-chapter p { font-size: 15px; line-height: 2; color: #3A3028; text-indent: 2em; letter-spacing: 1px; }'
    + '.novel-divider { text-align: center; color: #C0392B; font-size: 14px; letter-spacing: 6px; margin: 20px 0 24px; opacity: 0.6; }'
    + '.novel-ending { text-align: center; font-size: 15px; color: #8B7D6B; letter-spacing: 2px; padding: 16px 0; font-style: italic; }'
    + '@media print { @page { margin: 0; } body { margin: 0; padding: 20px; } }'
    + '</style></head><body>' + clone.outerHTML + '</body></html>');
  printWin.document.close();
  printWin.focus();
  setTimeout(function() { printWin.print(); }, 500);
};

// ============================================
// 功能二：古风战报海报（Canvas）
// ============================================
window.showBattleReport = function() {
  const existing = document.getElementById('battle-overlay');
  if (existing) existing.remove();

  const d = typeof getData === 'function' ? getData() : { user: {}, hero: {} };
  const heroName = d.user?.name || '少侠';
  const heroTitle = d.hero?.title || '初入江湖';
  const today = new Date();
  const dateStr = today.getFullYear() + '年' + (today.getMonth() + 1) + '月' + today.getDate() + '日';

  const overlay = document.createElement('div');
  overlay.id = 'battle-overlay';
  overlay.className = 'battle-report-overlay';
  overlay.innerHTML = `
    <div class="battle-report-card">
      <h3>🎋 生成战报</h3>
      <div class="form-group">
        <label>战报标题</label>
        <input type="text" id="br-title" value="财富江湖战报" placeholder="战报标题">
      </div>
      <div class="form-group">
        <label>副标题</label>
        <input type="text" id="br-subtitle" value="${heroName} · ${heroTitle} · ${dateStr}" placeholder="副标题">
      </div>
      <div class="btn-row">
        <button class="btn-battle-cancel" onclick="document.getElementById('battle-overlay').remove()">取消</button>
        <button class="btn-battle-generate" onclick="window.generateBattleReport()">生成战报</button>
      </div>
    </div>
  `;
  overlay.addEventListener('click', function(e) { if (e.target === overlay) overlay.remove(); });
  document.body.appendChild(overlay);
};

window.generateBattleReport = function(opts) {
  const d = typeof getData === 'function' ? getData() : { user: {}, hero: {} };
  const title = (opts && opts.title) || (document.getElementById('br-title') && document.getElementById('br-title').value) || '财富江湖战报';
  const subtitle = (opts && opts.subtitle) || (document.getElementById('br-subtitle') && document.getElementById('br-subtitle').value) || '';
  const overlay = document.getElementById('battle-overlay');
  if (overlay) overlay.remove();

  const hero = d.hero || {};
  const stats = [
    { label: '等级', value: 'Lv.' + (hero.level || 1) },
    { label: '修为', value: hero.wisdom || 10 },
    { label: '胆识', value: hero.courage || 10 },
    { label: '财运', value: hero.luck || 10 },
    { label: '铜钱', value: (hero.coins || 0) + '枚' },
    { label: '竹林', value: '第' + (hero.forestStage || 0) + '阶' }
  ];

  const ach = d.achievements || [];
  const ACH = window.ACHIEVEMENTS || [];
  const achievements = ach.map(function(id) {
    const a = ACH.find(function(x) { return x.id === id; });
    return a ? a.name : id;
  });

  const quotes = [
    '财脉康健，根基扎实。',
    '江湖路远，稳字当先。',
    '以武会财，以理服人。',
    '一分耕耘，一分铜钱。',
    '莫道财帛轻如纸，且看江湖万丈深。'
  ];
  const quote = (opts && opts.quote) || quotes[Math.floor(Math.random() * quotes.length)];

  // Canvas 绘制
  const W = 750, H = 1334;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');

  // 背景 - 宣纸渐变
  const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
  bgGrad.addColorStop(0, '#FDF8F0');
  bgGrad.addColorStop(0.3, '#F5ECD7');
  bgGrad.addColorStop(0.7, '#F0E4CC');
  bgGrad.addColorStop(1, '#EDDEC0');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, W, H);

  // 淡墨纹理
  ctx.globalAlpha = 0.03;
  for (let i = 0; i < 40; i++) {
    const x = Math.random() * W, y = Math.random() * H;
    ctx.beginPath();
    ctx.arc(x, y, Math.random() * 80 + 20, 0, Math.PI * 2);
    ctx.fillStyle = '#2C2C2C';
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // 顶部装饰线
  ctx.strokeStyle = 'rgba(192,57,43,0.3)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(60, 100);
  ctx.lineTo(W - 60, 100);
  ctx.stroke();

  // 标题「战 报」
  ctx.fillStyle = '#C0392B';
  ctx.font = 'bold 72px "Noto Serif SC", "STKaiti", serif';
  ctx.textAlign = 'center';
  ctx.fillText('战  报', W / 2, 180);

  // 副标题
  ctx.fillStyle = '#8D8468';
  ctx.font = '18px "Noto Serif SC", serif';
  ctx.fillText(subtitle, W / 2, 220);

  // 分隔线
  ctx.strokeStyle = 'rgba(192,57,43,0.2)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(60, 250);
  ctx.lineTo(W - 60, 250);
  ctx.stroke();

  // 标题行
  ctx.fillStyle = '#5B3A1A';
  ctx.font = 'bold 28px "Noto Serif SC", serif';
  ctx.fillText(title, W / 2, 300);

  // 属性区 - 两列网格
  const colW = (W - 120) / 2;
  const startY = 360;
  const rowH = 100;
  stats.forEach(function(st, i) {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const cx = 60 + col * colW;
    const cy = startY + row * rowH;
    const bw = colW - 20;
    const bh = rowH - 16;

    // 古风边框
    ctx.strokeStyle = 'rgba(74,124,89,0.4)';
    ctx.lineWidth = 1.5;
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    roundRect(ctx, cx + 10, cy + 8, bw - 20, bh - 16, 8, true, true);

    // 标签
    ctx.fillStyle = '#8D8468';
    ctx.font = '14px "Noto Serif SC", serif';
    ctx.textAlign = 'center';
    ctx.fillText(st.label, cx + bw / 2, cy + bh / 2 - 12);

    // 值
    ctx.fillStyle = '#3A3028';
    ctx.font = 'bold 26px "Noto Serif SC", serif';
    ctx.fillText(String(st.value), cx + bw / 2, cy + bh / 2 + 24);
  });

  // 成就区
  let achY = startY + Math.ceil(stats.length / 2) * rowH + 20;
  if (achievements.length > 0) {
    ctx.fillStyle = '#D4A843';
    ctx.font = 'bold 22px "Noto Serif SC", serif';
    ctx.textAlign = 'center';
    ctx.fillText('—— 新获成就 ——', W / 2, achY);
    achY += 40;

    ctx.font = '16px "Noto Serif SC", serif';
    achievements.forEach(function(a) {
      ctx.fillText('🏅 ' + a, W / 2, achY);
      achY += 30;
    });
    achY += 20;
  }

  // 金句区
  achY = Math.max(achY, H - 260);
  ctx.strokeStyle = 'rgba(212,168,67,0.3)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(80, achY);
  ctx.lineTo(W - 80, achY);
  ctx.stroke();
  achY += 30;

  ctx.fillStyle = '#5B3A1A';
  ctx.font = 'italic 20px "Noto Serif SC", "STKaiti", serif';
  ctx.textAlign = 'center';
  ctx.fillText('「' + quote + '」', W / 2, achY + 20);

  // 右下角印章
  ctx.fillStyle = '#C0392B';
  const sealX = W - 110, sealY = H - 160;
  ctx.fillRect(sealX, sealY, 80, 80);
  ctx.fillStyle = '#FFF';
  ctx.font = 'bold 32px "STKaiti", serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('江湖', sealX + 40, sealY + 40);

  // 左下角日期
  ctx.fillStyle = '#8D8468';
  ctx.font = '14px "Noto Serif SC", serif';
  ctx.textAlign = 'left';
  const now = new Date();
  const datestr = now.getFullYear() + '年' + (now.getMonth() + 1) + '月' + now.getDate() + '日';
  ctx.fillText(datestr + ' · 财富江湖', 60, H - 40);

  // 导出下载
  canvas.toBlob(function(blob) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const ts = now.getFullYear() + ('0' + (now.getMonth() + 1)).slice(-2) + ('0' + now.getDate()).slice(-2) + '_' + ('0' + now.getHours()).slice(-2) + ('0' + now.getMinutes()).slice(-2) + ('0' + now.getSeconds()).slice(-2);
    a.download = '战报_' + ts + '.png';
    a.href = url;
    a.click();
    URL.revokeObjectURL(url);
  }, 'image/png');
};

function roundRect(ctx, x, y, w, h, r, fill, stroke) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
  if (fill) ctx.fill();
  if (stroke) ctx.stroke();
}

// ============================================
// 功能三：成就 / 称号双轨系统
// ============================================
window.ACHIEVEMENTS = [
  { id: 'first_exam', name: '初探脉象', desc: '完成首次钱包体检', icon: '🏥', category: 'exam', condition: function(d) { return (d.stats && d.stats.totalCheckups || 0) >= 1; } },
  { id: 'exam_master', name: '杏林圣手', desc: '完成5次钱包体检', icon: '💊', category: 'exam', condition: function(d) { return (d.stats && d.stats.totalCheckups || 0) >= 5; } },
  { id: 'first_decision', name: '初涉江湖', desc: '完成首次消费决策', icon: '⚖️', category: 'decision', condition: function(d) { return (d.stats && d.stats.totalDecisions || 0) >= 1; } },
  { id: 'wise_three', name: '铁算盘', desc: '连续3次做出明智决策', icon: '🧮', category: 'decision', condition: function(d) { return (d.stats && d.stats.goodDecisions || 0) >= 3; } },
  { id: 'stoic_warrior', name: '断腕勇士', desc: '成功拒绝1次不值得的消费', icon: '⚔️', category: 'decision', condition: function(d) {
    const decisions = d.decisions || [];
    return decisions.some(function(dc) { return dc.result === '不值得'; });
  }},
  { id: 'first_prediction', name: '夜观天象', desc: '完成首次未来推演', icon: '🔮', category: 'prediction', condition: function(d) { return (d.stats && d.stats.totalPredictions || 0) >= 1; } },
  { id: 'all_scrolls', name: '复利宗师', desc: '翻看全部8张竹简心法', icon: '🎍', category: 'zhulin', condition: function(d) { return (d.hero && d.hero.forestStage || 0) >= 8; } },
  { id: 'level_5', name: '一方豪杰', desc: '达到Lv.5', icon: '⚡', category: 'level', condition: function(d) { return (d.hero && d.hero.exp || 0) >= 600; } },
  { id: 'level_10', name: '武林盟主', desc: '达到Lv.10', icon: '👑', category: 'level', condition: function(d) { return (d.hero && d.hero.exp || 0) >= 4500; } },
  { id: 'coins_100', name: '初有积蓄', desc: '累计获得100铜钱', icon: '🪙', category: 'coins', condition: function(d) { return (d.hero && d.hero.coins || 0) >= 100; } },
  { id: 'coins_500', name: '富甲一方', desc: '累计获得500铜钱', icon: '💰', category: 'coins', condition: function(d) { return (d.hero && d.hero.coins || 0) >= 500; } },
  { id: 'visit_all', name: '江湖行者', desc: '访问过全部4个场所', icon: '🗺️', category: 'explore', condition: function(d) {
    var b = d.buildings || {};
    return (b.yiguan || 0) > 0 && (b.chatting || 0) > 0 && (b.guanxing || 0) > 0 && (b.zhulin || 0) > 0;
  }},
  { id: 'encounter_3', name: '奇遇连连', desc: '触发3次江湖奇遇', icon: '🍀', category: 'encounter', condition: function(d) { return (d.stats && d.stats.totalEncounters || 0) >= 3; } },
  { id: 'encounter_10', name: '天命之子', desc: '触发10次江湖奇遇', icon: '🌟', category: 'encounter', condition: function(d) { return (d.stats && d.stats.totalEncounters || 0) >= 10; } },
  { id: 'scroll_all_good', name: '慧眼如炬', desc: '全部消费决策均为正向', icon: '👁️', category: 'decision', condition: function(d) {
    var decisions = d.decisions || [];
    if (decisions.length === 0) return false;
    return decisions.every(function(dc) { return dc.result === '值得' || dc.result === '可考虑'; });
  }}
];

window.checkAchievements = function() {
  var d = typeof getData === 'function' ? getData() : {};
  d.achievements = d.achievements || [];
  d.stats = d.stats || {};
  var ACH = window.ACHIEVEMENTS;
  var newlyUnlocked = [];

  ACH.forEach(function(a) {
    if (d.achievements.indexOf(a.id) >= 0) return;
    try {
      if (a.condition(d)) {
        d.achievements.push(a.id);
        newlyUnlocked.push(a);
      }
    } catch(e) {}
  });

  if (newlyUnlocked.length > 0) {
    if (typeof saveData === 'function') saveData(d);
    if (typeof pushEvent === 'function') {
      newlyUnlocked.forEach(function(a) {
        pushEvent('系统', '🏅', '恭喜！解锁新成就：' + a.name + ' —— ' + a.desc, 'good');
      });
    } else {
      try {
        var raw = localStorage.getItem('wealth_jianghu_events');
        var events = raw ? JSON.parse(raw) : [];
        newlyUnlocked.forEach(function(a) {
          events.unshift({ id: Date.now().toString(36), npc: '系统', icon: '🏅', message: '恭喜！解锁新成就：' + a.name + ' —— ' + a.desc, style: 'good', time: new Date().toISOString() });
        });
        if (events.length > 30) events.length = 30;
        localStorage.setItem('wealth_jianghu_events', JSON.stringify(events));
      } catch(e) {}
    }
  }

  return newlyUnlocked;
};

window.renderBadges = function() {
  var d = typeof getData === 'function' ? getData() : {};
  var ach = d.achievements || [];
  var ACH = window.ACHIEVEMENTS || [];
  var grid = document.getElementById('badge-grid');
  if (!grid) return;

  var unlockedItems = ACH.filter(function(a) { return ach.indexOf(a.id) >= 0; });
  var lockedItems = ACH.filter(function(a) { return ach.indexOf(a.id) < 0; });
  var totalSlots = 8;
  var html = '';

  unlockedItems.slice(0, totalSlots).forEach(function(a) {
    html += '<div class="badge-item unlocked" title="' + a.desc + '"><div class="badge-icon">' + a.icon + '</div><div class="badge-name">' + a.name + '</div></div>';
  });

  var remainingSlots = totalSlots - Math.min(unlockedItems.length, totalSlots);
  lockedItems.slice(0, remainingSlots).forEach(function(a) {
    html += '<div class="badge-item locked" title="??？（未解锁）"><div class="badge-icon">🔒</div><div class="badge-name">' + a.name + '</div></div>';
  });

  if (unlockedItems.length + lockedItems.length > totalSlots) {
    html += '<div class="badge-more">+ 更多徽章待解锁...</div>';
  }

  grid.innerHTML = html;
};

// ============================================
// 功能四：江湖奇遇随机事件
// ============================================
window.ENCOUNTERS = [
  {
    id: 'old_man', title: '路遇算卦先生', icon: '🔮', npc: '算卦先生',
    text: '一位白发老者拦住去路："少侠留步，老夫观你面相，今日财运暗藏玄机。不妨卜一卦，可窥天机。"',
    options: [
      { text: '卜一卦（消耗10铜钱）', effect: { coins: -10, wisdom: 3, luck: 2 }, result: '算卦先生掐指一算："三月之内，必有横财。但切记，不可贪。"你若有所思，觉得眼界开阔了些。' },
      { text: '婉拒离开', effect: {}, result: '你拱手道谢，继续赶路。老者摇头叹息，消失在人群中。' }
    ]
  },
  {
    id: 'secret_book', title: '拾到残缺秘籍', icon: '📜', npc: '无',
    text: '路边草丛中露出一角泛黄的书页，似乎是一本残缺的理财秘籍。四下无人，你是捡还是不捡？',
    options: [
      { text: '拾起细读（+3修为）', effect: { wisdom: 3 }, result: '你小心翼翼拾起书页，借着月光细细品读。虽残缺不全，但其中"开源节流"四字让你若有所悟。' },
      { text: '原路放回', effect: { courage: 2 }, result: '你想起江湖规矩——不是自己的东西莫贪。你将书页放回原处，心中坦荡。' }
    ]
  },
  {
    id: 'tea_merchant', title: '茶商拦路', icon: '🍵', npc: '茶商',
    text: '一位茶商推着满载茶叶的板车，满头大汗："少侠，帮我推一把车上坡，我赠你一包上等龙井！"',
    options: [
      { text: '出手相助（+2胆识）', effect: { courage: 2, luck: 1 }, result: '你挽起袖子，与茶商合力将车推上坡顶。茶商感激不尽，不仅送你龙井，还悄悄告诉你一个赚钱的好去处。' },
      { text: '匆匆走过', effect: {}, result: '你假装没听见，加快脚步离开。身后传来茶商一声叹息。' }
    ]
  },
  {
    id: 'beggar', title: '乞丐赠言', icon: '🥷', npc: '老乞丐',
    text: '一个衣衫褴褛的老乞丐拦住你，声音沙哑："年轻人，我看你面带财运，但这财来得快去得也快。给老朽一文钱，老朽赠你一句真言。"',
    options: [
      { text: '施舍一文（消耗1铜钱，+3修为）', effect: { coins: -1, wisdom: 3 }, result: '你摸出一枚铜钱递给老乞丐。老乞丐接过钱，低声道："财不入急门，慢就是快。"你默念几遍，幡然醒悟。' },
      { text: '摇头走开', effect: {}, result: '你觉得此人不过是个骗钱的，绕道而行。老乞丐也不追赶，只是摇头笑了笑。' }
    ]
  },
  {
    id: 'market_crash', title: '市集风波', icon: '📉', npc: '集市商人',
    text: '前方集市突然喧哗，听说某种货物价格暴跌。几个商人正在低价抛售库存，围观者议论纷纷。',
    options: [
      { text: '冷静观察（+2修为）', effect: { wisdom: 2 }, result: '你站在人群中静静观察，发现这不过是恐慌性抛售。你暗记于心：市场波动时，最忌追涨杀跌。' },
      { text: '跟风抢购', effect: { coins: -5, courage: 1 }, result: '你头脑一热跟风买入，结果发现东西并不需要。虽然金额不大，但也算买个教训。' }
    ]
  },
  {
    id: 'mysterious_letter', title: '飞鸽传书', icon: '🕊️', npc: '信鸽',
    text: '一只信鸽落在你肩头，脚上绑着一封信。信上写着："明日午时，城东老槐树下，有一桩好买卖。"落款是一个模糊的印章。',
    options: [
      { text: '赴约一探（+3胆识，+2财运）', effect: { courage: 3, luck: 2 }, result: '你如约前往，原来是一位老前辈正在寻找合伙人。虽然最终没有合作，但长了不少见识。' },
      { text: '不为所动', effect: { wisdom: 2 }, result: '你思忖片刻，觉得来路不明的邀约不可轻信。你将信鸽放飞，继续走自己的路。' }
    ]
  },
  {
    id: 'herb_collector', title: '采药人求助', icon: '🌿', npc: '采药人',
    text: '一位采药人从山坡上滑下，扭伤了脚。他求你帮忙采一株长在崖边的稀有草药，答应分你一半。',
    options: [
      { text: '冒险采药（+3胆识）', effect: { courage: 3, coins: 8 }, result: '你攀上崖边，小心翼翼采下草药。采药人大喜，如约分你一半，还指点你附近的药材行情。' },
      { text: '帮他包扎，不采药', effect: { wisdom: 2, courage: 1 }, result: '你帮采药人包扎伤口，劝他莫要贪图稀有草药而涉险。采药人感激地点点头："少侠说的是，命比药贵。"' }
    ]
  },
  {
    id: 'fortune_cat', title: '招财猫显灵', icon: '🐱', npc: '招财猫',
    text: '一只金色招财猫蹲在路边，冲你眨了眨眼。它的爪下压着一枚闪闪发光的铜钱，似乎在等你来取。',
    options: [
      { text: '恭敬地取走铜钱（+5铜钱）', effect: { coins: 5, luck: 2 }, result: '你恭敬地双手合十，轻轻取走铜钱。招财猫满意地"喵"了一声，消失在一阵金光中。' },
      { text: '摸摸猫头，不取铜钱', effect: { wisdom: 3 }, result: '你弯腰摸了摸猫头："是你的就是你的，不是我的强求不得。"招财猫蹭了蹭你的手，留下一串金粉后离去。' }
    ]
  },
  {
    id: 'river_crossing', title: '渡口抉择', icon: '⛵', npc: '船夫',
    text: '前方一条大河拦住去路，只有一位老船夫在岸边。船费5铜钱，但上游不远处似乎有座独木桥。',
    options: [
      { text: '花钱渡河（消耗5铜钱）', effect: { coins: -5, luck: 1 }, result: '你付了船费，老船夫稳稳当当将你渡过河。途中他讲了不少江湖趣事，倒也不亏。' },
      { text: '走独木桥', effect: { courage: 2 }, result: '你壮着胆子走过独木桥，虽然心惊胆战，但既省了钱又练了胆，一举两得。' }
    ]
  },
  {
    id: 'night_market', title: '夜市偶遇', icon: '🏮', npc: '夜市小贩',
    text: '夜幕降临，前方夜市灯火通明。各种奇珍异宝琳琅满目，小贩的吆喝声此起彼伏。',
    options: [
      { text: '精挑细选（消耗3铜钱，+2修为）', effect: { coins: -3, wisdom: 2 }, result: '你逛了一圈，货比三家后买了件实用的小物件。小贩竖起大拇指："少侠好眼力！"' },
      { text: '只看不买', effect: { wisdom: 1, luck: 1 }, result: '你悠闲地逛了一圈，虽未消费，却对物价行情有了更深的了解。' }
    ]
  }
];

window.triggerEncounter = function(force) {
  var now = Date.now();
  var lastKey = 'wealth_jianghu_last_encounter';
  var lastTime = parseInt(localStorage.getItem(lastKey) || '0', 10);
  // 每30分钟最多1次（手动触发可绕过）
  if (!force && (now - lastTime < 30 * 60 * 1000)) return;
  if (!force && Math.random() >= 0.4) return;

  var pool = window.ENCOUNTERS;
  var enc = pool[Math.floor(Math.random() * pool.length)];
  var existing = document.getElementById('encounter-overlay');
  if (existing) existing.remove();

  var overlay = document.createElement('div');
  overlay.id = 'encounter-overlay';
  overlay.className = 'encounter-overlay';

  var optionsHTML = enc.options.map(function(opt, i) {
    return '<button class="encounter-option" data-idx="' + i + '">' + opt.text + '</button>';
  }).join('');

  overlay.innerHTML = `
    <div class="encounter-card">
      <div class="encounter-header">
        <div class="encounter-npc-avatar">${enc.icon}</div>
        <div class="encounter-npc-info">
          <div class="encounter-npc-name">${enc.npc}</div>
          <div class="encounter-npc-title">江湖奇遇</div>
        </div>
      </div>
      <div class="encounter-body" id="encounter-body">
        <div class="encounter-title">${enc.title}</div>
        <div class="encounter-text">${enc.text}</div>
        <div class="encounter-options" id="encounter-options">
          ${optionsHTML}
        </div>
      </div>
      <button class="encounter-close" onclick="document.getElementById('encounter-overlay').remove()">关闭</button>
    </div>
  `;

  overlay.addEventListener('click', function(e) {
    if (e.target === overlay) overlay.remove();
  });

  document.body.appendChild(overlay);

  // 绑定选项点击
  var optsContainer = overlay.querySelector('#encounter-options');
  optsContainer.querySelectorAll('.encounter-option').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var idx = parseInt(this.getAttribute('data-idx'), 10);
      var chosen = enc.options[idx];
      // 禁用所有选项
      optsContainer.querySelectorAll('.encounter-option').forEach(function(b) { b.disabled = true; b.style.opacity = '0.5'; b.style.pointerEvents = 'none'; });

      // 显示结果
      var body = overlay.querySelector('#encounter-body');
      var resultDiv = document.createElement('div');
      resultDiv.className = 'encounter-result';
      resultDiv.textContent = chosen.result;
      body.appendChild(resultDiv);

      // 应用效果
      var d = typeof getData === 'function' ? getData() : {};
      d.hero = d.hero || {};
      d.stats = d.stats || {};
      var eff = chosen.effect || {};
      if (eff.coins) d.hero.coins = (d.hero.coins || 0) + eff.coins;
      if (eff.wisdom) d.hero.wisdom = (d.hero.wisdom || 10) + eff.wisdom;
      if (eff.courage) d.hero.courage = (d.hero.courage || 10) + eff.courage;
      if (eff.luck) d.hero.luck = (d.hero.luck || 10) + eff.luck;
      d.stats.totalEncounters = (d.stats.totalEncounters || 0) + 1;

      if (typeof saveData === 'function') saveData(d);

      // 推送事件
      if (typeof pushEvent === 'function') {
        pushEvent(enc.npc, enc.icon, enc.title + '：' + chosen.result.slice(0, 40) + '...', 'good');
      } else {
        try {
          var raw = localStorage.getItem('wealth_jianghu_events');
          var events = raw ? JSON.parse(raw) : [];
          events.unshift({ id: Date.now().toString(36), npc: enc.npc, icon: enc.icon, message: enc.title + '：' + chosen.result.slice(0, 40) + '...', style: 'good', time: new Date().toISOString() });
          if (events.length > 30) events.length = 30;
          localStorage.setItem('wealth_jianghu_events', JSON.stringify(events));
        } catch(e2) {}
      }

      localStorage.setItem(lastKey, String(now));

      // 刷新主界面
      if (typeof renderHome === 'function') {
        setTimeout(function() { renderHome(); }, 500);
      }

      // 2秒后自动关闭
      setTimeout(function() {
        var ov = document.getElementById('encounter-overlay');
        if (ov) ov.remove();
      }, 2500);

      // 更换关闭按钮文字
      var closeBtn = overlay.querySelector('.encounter-close');
      if (closeBtn) closeBtn.textContent = '继续闯荡江湖';
    });
  });

  localStorage.setItem(lastKey, String(now));
};

window.initEncounterSystem = function() {
  // 随机延迟15-45秒后触发
  var delay = 15000 + Math.floor(Math.random() * 30000);
  setTimeout(function() {
    window.triggerEncounter();
    // 之后每60秒检查一次
    setInterval(function() {
      window.triggerEncounter();
    }, 60000);
  }, delay);
  
  // 初始化手动按钮状态
  setTimeout(function() { updateEncounterBtn(); }, 100);
};

// 手动触发奇遇（绕过概率与30分钟冷却，但有独立2分钟冷却）
window.showEncounter = function() {
  var now = Date.now();
  var manualKey = 'wealth_jianghu_manual_encounter';
  var lastManual = parseInt(localStorage.getItem(manualKey) || '0', 10);
  var btn = document.getElementById('btn-encounter');
  
  if (now - lastManual < 2 * 60 * 1000) {
    updateEncounterBtn();
    return;
  }
  
  // 强制触发奇遇
  window.triggerEncounter(true);
  
  // 设置手动冷却
  localStorage.setItem(manualKey, String(now));
  updateEncounterBtn();
};

// 更新奇遇按钮冷却状态
window.updateEncounterBtn = function() {
  var btn = document.getElementById('btn-encounter');
  if (!btn) return;
  
  var now = Date.now();
  var manualKey = 'wealth_jianghu_manual_encounter';
  var lastManual = parseInt(localStorage.getItem(manualKey) || '0', 10);
  var cooldown = 2 * 60 * 1000;
  var remaining = cooldown - (now - lastManual);
  
  if (remaining > 0) {
    var sec = Math.ceil(remaining / 1000);
    btn.textContent = '⏳ 奇遇冷却中（' + sec + 's）';
    btn.classList.add('cooldown');
    btn.onclick = function() { showEncounter(); };
    setTimeout(function() { updateEncounterBtn(); }, 1000);
  } else {
    btn.textContent = '🌫️ 江湖奇遇';
    btn.classList.remove('cooldown');
    btn.onclick = function() { showEncounter(); };
  }
};

// ============================================
// 新增功能一：铜钱经济系统
// ============================================
var CHINESE_NUMS = ['零', '壹', '贰', '叁', '肆', '伍', '陆', '柒', '捌', '玖', '拾'];

function ensureCoinsInitialized(d) {
  d.hero = d.hero || {};
  if (typeof d.hero.coins !== 'number') {
    d.hero.coins = 50;
  }
  return d;
}

window.addCoins = function(amount, sourceEl) {
  var d = typeof getData === 'function' ? getData() : {};
  d = ensureCoinsInitialized(d);
  d.hero.coins = Math.max(0, (d.hero.coins || 0) + amount);
  if (typeof saveData === 'function') saveData(d);
  updateCoinsDisplay(d);
  if (typeof renderAssetsDashboard === 'function') renderAssetsDashboard(d);
  if (typeof renderLeaderboard === 'function') renderLeaderboard();

  if (typeof playCoinSFX === 'function') playCoinSFX(amount >= 0);

  if (amount !== 0) {
    var x = 0, y = 0;
    if (sourceEl) {
      var rect = sourceEl.getBoundingClientRect();
      x = rect.left + rect.width / 2;
      y = rect.top;
    } else {
      var coinsEl = document.getElementById('coins-display');
      if (coinsEl) {
        var cr = coinsEl.getBoundingClientRect();
        x = cr.left + cr.width / 2;
        y = cr.top;
      }
    }
    floatCoinAnimation(x, y, amount);
  }

  if (typeof checkDailyQuestProgress === 'function') checkDailyQuestProgress('earn_coins', Math.abs(amount));
};

function floatCoinAnimation(x, y, amount) {
  var el = document.createElement('div');
  el.className = 'coin-float ' + (amount >= 0 ? 'positive' : 'negative');
  el.textContent = '铜钱 ' + (amount >= 0 ? '+' : '') + amount;
  el.style.left = x + 'px';
  el.style.top = y + 'px';
  el.style.transform = 'translateX(-50%)';
  document.body.appendChild(el);
  setTimeout(function() {
    if (el.parentNode) el.parentNode.removeChild(el);
  }, 1500);
}

function updateCoinsDisplay(d) {
  if (!d) d = typeof getData === 'function' ? getData() : {};
  d = ensureCoinsInitialized(d);
  var el = document.getElementById('coins-amount');
  if (el) el.textContent = d.hero.coins || 0;
  var mpEl = document.getElementById('mp-coins');
  if (mpEl) mpEl.textContent = d.hero.coins || 0;
}

// ============================================
// 江湖集市
// ============================================
var MARKETPLACE_ITEM_POOL = [
  { id: 'wisdom_pill', name: '修为丹', icon: '💊', desc: '静心修炼，修为+3', effect: { wisdom: 3 }, cost: 8, category: 'wisdom' },
  { id: 'courage_wine', name: '胆识酒', icon: '🍶', desc: '壮胆烈酒，胆识+3', effect: { courage: 3 }, cost: 8, category: 'courage' },
  { id: 'luck_charm', name: '幸运符', icon: '🧧', desc: '祈福护身，财运+3', effect: { luck: 3 }, cost: 8, category: 'luck' },
  { id: 'gold_abacus', name: '金算盘', icon: '🧮', desc: '修为+5，财运+2', effect: { wisdom: 5, luck: 2 }, cost: 15, category: 'wisdom' },
  { id: 'sage_scroll', name: '贤者卷', icon: '📜', desc: '修为+4，胆识+2', effect: { wisdom: 4, courage: 2 }, cost: 12, category: 'wisdom' },
  { id: 'hero_manual', name: '侠客行', icon: '⚔️', desc: '胆识+4，财运+2', effect: { courage: 4, luck: 2 }, cost: 12, category: 'courage' },
  { id: 'jade_pendant', name: '翡翠佩', icon: '💎', desc: '全属性+2', effect: { wisdom: 2, courage: 2, luck: 2 }, cost: 15, category: 'all' },
  { id: 'tea_brick', name: '老茶砖', icon: '🍵', desc: '修为+2，财运+2', effect: { wisdom: 2, luck: 2 }, cost: 6, category: 'luck' },
  { id: 'coin_pouch', name: '聚宝袋', icon: '💰', desc: '财运+5', effect: { luck: 5 }, cost: 10, category: 'luck' },
  { id: 'iron_will', name: '铁骨丹', icon: '🛡️', desc: '胆识+5', effect: { courage: 5 }, cost: 10, category: 'courage' }
];

function getDailyMarketplaceSeed() {
  var today = new Date();
  return today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate();
}

function generateMarketplaceItems() {
  var seed = getDailyMarketplaceSeed();
  var saved = localStorage.getItem('wealth_jianghu_marketplace');
  var soldItems = [];
  var savedSeed = '';
  if (saved) {
    try { var p = JSON.parse(saved); savedSeed = p.seed || ''; soldItems = p.sold || []; } catch(e) {}
  }
  if (savedSeed !== seed) soldItems = [];

  var pool = MARKETPLACE_ITEM_POOL.slice();
  var seedNum = 0;
  for (var i = 0; i < seed.length; i++) seedNum += seed.charCodeAt(i);
  for (var i = pool.length - 1; i > 0; i--) {
    seedNum = (seedNum * 1103515245 + 12345) & 0x7fffffff;
    var j = seedNum % (i + 1);
    var tmp = pool[i]; pool[i] = pool[j]; pool[j] = tmp;
  }

  var items = pool.slice(0, 3);
  var result = { seed: seed, items: items, sold: soldItems };
  localStorage.setItem('wealth_jianghu_marketplace', JSON.stringify(result));
  return result;
}

window.toggleMarketplace = function() {
  var overlay = document.getElementById('marketplace-overlay');
  if (!overlay) return;
  if (overlay.classList.contains('active')) { closeMarketplace(); return; }
  var d = typeof getData === 'function' ? getData() : {};
  d = ensureCoinsInitialized(d);
  var mpData = generateMarketplaceItems();
  var itemsHTML = mpData.items.map(function(item) {
    var sold = mpData.sold.indexOf(item.id) >= 0;
    return '<div class="marketplace-item' + (sold ? ' sold' : '') + '" ' +
      (!sold ? 'onclick="buyMarketplaceItem(\'' + item.id + '\')"' : '') + '>' +
      '<span class="mp-icon">' + item.icon + '</span>' +
      '<div class="mp-info"><div class="mp-name">' + item.name + '</div>' +
      '<div class="mp-desc">' + item.desc + '</div></div>' +
      '<span class="mp-cost">' + (sold ? '已售罄' : item.cost + ' 铜钱') + '</span></div>';
  }).join('');
  document.getElementById('marketplace-items').innerHTML = itemsHTML;
  document.getElementById('mp-coins').textContent = d.hero.coins || 0;
  overlay.classList.add('active');
  if (typeof checkDailyQuestProgress === 'function') checkDailyQuestProgress('marketplace', 1);
};

window.closeMarketplace = function() {
  var overlay = document.getElementById('marketplace-overlay');
  if (overlay) overlay.classList.remove('active');
};

window.buyMarketplaceItem = function(itemId) {
  var d = typeof getData === 'function' ? getData() : {};
  d = ensureCoinsInitialized(d);
  var mpData = generateMarketplaceItems();
  var item = mpData.items.find(function(x) { return x.id === itemId; });
  if (!item) return;
  if (mpData.sold.indexOf(itemId) >= 0) return;
  if ((d.hero.coins || 0) < item.cost) {
    alert('铜钱不足！需要 ' + item.cost + ' 铜钱，当前仅有 ' + (d.hero.coins || 0) + ' 铜钱。');
    return;
  }
  d.hero.coins -= item.cost;
  if (item.effect.wisdom) d.hero.wisdom = (d.hero.wisdom || 10) + item.effect.wisdom;
  if (item.effect.courage) d.hero.courage = (d.hero.courage || 10) + item.effect.courage;
  if (item.effect.luck) d.hero.luck = (d.hero.luck || 10) + item.effect.luck;
  mpData.sold.push(itemId);
  localStorage.setItem('wealth_jianghu_marketplace', JSON.stringify(mpData));
  if (typeof saveData === 'function') saveData(d);
  if (typeof playCoinSFX === 'function') playCoinSFX(false);
  var itemEl = document.querySelector('.marketplace-item:not(.sold)');
  if (itemEl) { var rect = itemEl.getBoundingClientRect(); floatCoinAnimation(rect.left + rect.width / 2, rect.top, -item.cost); }
  updateCoinsDisplay(d);
  var itemsEl = document.getElementById('marketplace-items');
  var newMpData = generateMarketplaceItems();
  itemsEl.innerHTML = newMpData.items.map(function(it) {
    var s = newMpData.sold.indexOf(it.id) >= 0;
    return '<div class="marketplace-item' + (s ? ' sold' : '') + '" ' +
      (!s ? 'onclick="buyMarketplaceItem(\'' + it.id + '\')"' : '') + '>' +
      '<span class="mp-icon">' + it.icon + '</span>' +
      '<div class="mp-info"><div class="mp-name">' + it.name + '</div>' +
      '<div class="mp-desc">' + it.desc + '</div></div>' +
      '<span class="mp-cost">' + (s ? '已售罄' : it.cost + ' 铜钱') + '</span></div>';
  }).join('');
  document.getElementById('mp-coins').textContent = d.hero.coins || 0;
  if (typeof renderHome === 'function') renderHome();
  if (typeof renderAssetsDashboard === 'function') renderAssetsDashboard(d);
  if (typeof checkAchievements === 'function') {
    setTimeout(function() {
      var newAch = checkAchievements();
      if (newAch && newAch.length > 0 && typeof playAchievementSFX === 'function') playAchievementSFX();
    }, 300);
  }
};

// ============================================
// 江湖资产仪表盘
// ============================================
window.renderAssetsDashboard = function(d) {
  if (!d) d = typeof getData === 'function' ? getData() : {};
  var u = d.user || {};
  var income = Number(u.income) || 0;
  var savings = Number(u.savings) || 0;
  var debt = Number(u.debt) || 0;
  var monthlyFixed = Number(u.monthlyFixed) || 0;
  var hasData = income > 0 || savings > 0 || debt > 0;

  if (!hasData) {
    document.getElementById('ring-center').textContent = '未诊';
    document.getElementById('dash-income').textContent = '--';
    document.getElementById('dash-expense').textContent = '--';
    document.getElementById('dash-balance').textContent = '--';
    document.getElementById('bar-savings').style.width = '0%';
    document.getElementById('bar-debt').style.width = '0%';
    document.getElementById('bar-networth').style.width = '0%';
    document.getElementById('val-savings').textContent = '--';
    document.getElementById('val-debt').textContent = '--';
    document.getElementById('val-networth').textContent = '--';
    var fb = document.getElementById('finance-badge');
    fb.className = 'finance-badge';
    fb.querySelector('.badge-inner').textContent = '去医馆体检';
    ['surplus','debtratio','saverate'].forEach(function(k) {
      document.getElementById('card-' + k).className = 'metric-card guide';
      document.getElementById('metric-' + k).textContent = '去医馆体检';
    });
    updateRingChart(0, 0);
    return;
  }

  var balance = income - monthlyFixed;
  var netWorth = savings - debt;
  function fmtK(v) { return v >= 10000 ? (v / 10000).toFixed(1) + '万' : v.toLocaleString(); }

  document.getElementById('dash-income').textContent = fmtK(income);
  document.getElementById('dash-expense').textContent = fmtK(monthlyFixed);
  document.getElementById('dash-balance').textContent = fmtK(balance);
  updateRingChart(monthlyFixed, income);

  var maxAsset = Math.max(savings, debt, Math.max(0, netWorth), 10000);
  setTimeout(function() {
    document.getElementById('bar-savings').style.width = Math.min(100, (savings / maxAsset) * 100) + '%';
    document.getElementById('bar-debt').style.width = Math.min(100, (debt / maxAsset) * 100) + '%';
    document.getElementById('bar-networth').style.width = Math.min(100, (Math.max(0, netWorth) / maxAsset) * 100) + '%';
  }, 200);
  document.getElementById('val-savings').textContent = fmtK(savings);
  document.getElementById('val-debt').textContent = fmtK(debt);
  document.getElementById('val-networth').textContent = fmtK(netWorth);

  var fb = document.getElementById('finance-badge');
  var bc = '', bt = '';
  if (netWorth < 50000) { bc = 'bronze'; bt = '青铜'; }
  else if (netWorth < 200000) { bc = 'silver'; bt = '白银'; }
  else if (netWorth < 500000) { bc = 'gold'; bt = '黄金'; }
  else if (netWorth < 1000000) { bc = 'jade'; bt = '翡翠'; }
  else { bc = 'master'; bt = '宗师'; }
  fb.className = 'finance-badge ' + bc;
  fb.querySelector('.badge-inner').textContent = bt;

  var sr = income > 0 ? ((balance / income) * 100).toFixed(0) : 0;
  var dr = (savings + income) > 0 ? ((debt / (savings + income + 0.01)) * 100).toFixed(0) : 0;
  var sv = income > 0 ? (((income - monthlyFixed) / income) * 100).toFixed(0) : 0;

  updateMetricCard('surplus', sr + '%', sr >= 30 ? 'good' : sr >= 10 ? 'warn' : 'bad');
  updateMetricCard('debtratio', dr + '%', dr <= 20 ? 'good' : dr <= 50 ? 'warn' : 'bad');
  updateMetricCard('saverate', sv + '%', sv >= 30 ? 'good' : sv >= 10 ? 'warn' : 'bad');
};

function updateMetricCard(key, val, cls) {
  document.getElementById('card-' + key).className = 'metric-card ' + cls;
  document.getElementById('metric-' + key).textContent = val;
}

function updateRingChart(expense, income) {
  var ringEl = document.getElementById('ring-chart');
  var centerEl = document.getElementById('ring-center');
  if (!ringEl || !centerEl) return;
  if (income <= 0) {
    ringEl.style.background = 'conic-gradient(rgba(192,57,43,0.6) 0deg 360deg)';
    centerEl.textContent = '--';
    return;
  }
  var ep = (expense / income) * 100;
  var bp = 100 - ep;
  var ed = (ep / 100) * 360;
  ringEl.style.background = 'conic-gradient(rgba(192,57,43,0.5) 0deg ' + ed + 'deg, rgba(74,124,89,0.5) ' + ed + 'deg 360deg)';
  centerEl.textContent = bp.toFixed(0) + '%';
}

window.toggleDashboard = function() {
  var body = document.getElementById('dashboard-body');
  var toggle = document.querySelector('.dashboard-toggle');
  if (!body || !toggle) return;
  var c = body.classList.toggle('collapsed');
  toggle.textContent = c ? '展开 ▼' : '收起 ▲';
};

// ============================================
// 每日江湖历练
// ============================================
var DAILY_QUEST_POOL = [
  { id: 'yiguan_check', name: '医馆体检', desc: '去医馆体检1次', icon: '🏥', target: 1, category: 'yiguan', reward: { coins: 5, exp: 30 } },
  { id: 'chatting_compare', name: '茶亭比价', desc: '在茶亭比价3次', icon: '⚖️', target: 3, category: 'chatting', reward: { coins: 8, exp: 50 } },
  { id: 'zhulin_train', name: '竹林修炼', desc: '竹林修炼1次', icon: '🌳', target: 1, category: 'zhulin', reward: { coins: 3, exp: 20 } },
  { id: 'encounter_trigger', name: '江湖奇遇', desc: '触发奇遇1次', icon: '🌫️', target: 1, category: 'encounter', reward: { coins: 10, exp: 60 } },
  { id: 'earn_coins_10', name: '积攒铜钱', desc: '赚取10铜钱', icon: '🪙', target: 10, category: 'earn_coins', reward: { coins: 3, exp: 25 } },
  { id: 'guanxing_predict', name: '夜观天象', desc: '去观星台推演1次', icon: '🔮', target: 1, category: 'guanxing', reward: { coins: 6, exp: 40 } }
];

function getTodayKey() {
  var d = new Date();
  return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
}

function loadDailyQuests() {
  var key = 'wealth_jianghu_daily_quests';
  var raw = localStorage.getItem(key);
  var today = getTodayKey();
  if (raw) {
    try { var data = JSON.parse(raw); if (data.date === today) return data; } catch(e) {}
  }
  var pool = DAILY_QUEST_POOL.slice();
  for (var i = pool.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var t = pool[i]; pool[i] = pool[j]; pool[j] = t;
  }
  var count = 3 + Math.floor(Math.random() * 3);
  var quests = pool.slice(0, count).map(function(q) {
    return { id: q.id, name: q.name, desc: q.desc, icon: q.icon, target: q.target, category: q.category,
      reward: { coins: q.reward.coins, exp: q.reward.exp }, progress: 0, completed: false };
  });
  var data = { date: today, quests: quests };
  localStorage.setItem(key, JSON.stringify(data));
  return data;
}

window.renderDailyQuests = function() {
  var data = loadDailyQuests();
  var listEl = document.getElementById('daily-list');
  if (!listEl) return;
  var html = data.quests.map(function(q) {
    var done = q.completed;
    return '<div class="daily-item' + (done ? ' completed' : '') + '">' +
      '<span class="dq-icon">' + q.icon + '</span>' +
      '<div class="dq-info"><div class="dq-name">' + q.name + '</div>' +
      '<div class="dq-progress">' + (done ? '已完成' : q.progress + '/' + q.target) + '</div></div>' +
      '<span class="dq-reward">' + (done ? '✅' : '🪙' + q.reward.coins + ' +' + q.reward.exp + 'EXP') + '</span></div>';
  }).join('');
  listEl.innerHTML = html || '<p class="text-stone text-center" style="padding:8px 0;font-size:11px">今日无修行任务</p>';
  updateDailyCountdown();
};

window.updateDailyCountdown = function() {
  var el = document.getElementById('daily-countdown');
  if (!el) return;
  var now = new Date();
  var midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  var diff = midnight - now;
  el.textContent = Math.floor(diff / 3600000) + '时' + Math.floor((diff % 3600000) / 60000) + '分后刷新';
  setTimeout(function() { updateDailyCountdown(); }, 60000);
};

window.checkDailyQuestProgress = function(category, amount) {
  var data = loadDailyQuests();
  var changed = false;
  var completedRewards = [];
  data.quests.forEach(function(q) {
    if (q.completed) return;
    if (q.category === category) {
      q.progress = Math.min(q.target, q.progress + (amount || 1));
      if (q.progress >= q.target) { q.completed = true; completedRewards.push(q); changed = true; }
    }
  });
  if (changed) localStorage.setItem('wealth_jianghu_daily_quests', JSON.stringify(data));
  if (completedRewards.length > 0) {
    var d = typeof getData === 'function' ? getData() : {};
    d = ensureCoinsInitialized(d);
    completedRewards.forEach(function(q) { d.hero.coins = (d.hero.coins || 0) + q.reward.coins; d.hero.exp = (d.hero.exp || 0) + q.reward.exp; });
    if (typeof saveData === 'function') saveData(d);
    updateCoinsDisplay(d);
    if (typeof renderHome === 'function') renderHome();
    if (typeof renderAssetsDashboard === 'function') renderAssetsDashboard(d);
    if (typeof playAchievementSFX === 'function') setTimeout(function() { playAchievementSFX(); }, 200);
  }
  renderDailyQuests();
  return completedRewards;
};

// ============================================
// 江湖画卷
// ============================================
window.generateScrollPainting = function() {
  var d = typeof getData === 'function' ? getData() : {};
  d = ensureCoinsInitialized(d);
  var hero = d.hero || {};
  var user = d.user || {};
  var lvInfo = typeof calcLevel === 'function' ? calcLevel(hero.exp || 0) : { level: 1 };
  var ach = d.achievements || [];
  var W = 420;
  var H = 820;

  var canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  canvas.id = 'scrollpainting-canvas';
  var ctx = canvas.getContext('2d');

  var bgGrad = ctx.createLinearGradient(0, 0, 0, H);
  bgGrad.addColorStop(0, '#FDF8F0'); bgGrad.addColorStop(0.3, '#F5ECD7');
  bgGrad.addColorStop(0.6, '#F0E4CC'); bgGrad.addColorStop(1, '#EDDEC0');
  ctx.fillStyle = bgGrad; ctx.fillRect(0, 0, W, H);

  ctx.globalAlpha = 0.025;
  for (var i = 0; i < 25; i++) {
    ctx.beginPath();
    ctx.arc(Math.random() * W, Math.random() * H, Math.random() * 40 + 10, 0, Math.PI * 2);
    ctx.fillStyle = '#3A3028'; ctx.fill();
  }
  ctx.globalAlpha = 1;

  ctx.strokeStyle = '#8B7D6B'; ctx.lineWidth = 5;
  ctx.strokeRect(16, 16, W - 32, H - 32);
  ctx.strokeStyle = 'rgba(139,125,107,0.4)'; ctx.lineWidth = 1;
  ctx.strokeRect(22, 22, W - 44, H - 44);
  ctx.strokeStyle = 'rgba(139,125,107,0.12)'; ctx.lineWidth = 0.5;
  for (var sy = 36; sy < H - 36; sy += 24) {
    ctx.beginPath(); ctx.moveTo(28, sy); ctx.lineTo(W - 28, sy); ctx.stroke();
  }

  var curY = 50;
  ctx.fillStyle = '#5B3A1A'; ctx.font = 'bold 26px "Noto Serif SC", "STKaiti", serif'; ctx.textAlign = 'center';
  ctx.fillText(user.name || '少侠', W / 2, curY); curY += 32;

  ctx.fillStyle = '#8D8468'; ctx.font = '16px "Noto Serif SC", serif';
  ctx.fillText((hero.title || '初入江湖') + ' · Lv.' + lvInfo.level, W / 2, curY); curY += 28;

  ctx.strokeStyle = 'rgba(192,57,43,0.25)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(60, curY); ctx.lineTo(W - 60, curY); ctx.stroke(); curY += 20;

  ctx.fillStyle = '#D4A843'; ctx.font = 'bold 16px "Noto Serif SC", serif';
  ctx.fillText('—— 江湖四维 ——', W / 2, curY); curY += 28;

  var attrs = [
    { label: '修为', value: hero.wisdom || 10, color: '#4A7C59' },
    { label: '胆识', value: hero.courage || 10, color: '#C0392B' },
    { label: '财运', value: hero.luck || 10, color: '#D4A843' },
    { label: '铜钱', value: hero.coins || 0, color: '#B8902F' }
  ];
  attrs.forEach(function(a, ai) {
    var ax = 36 + (ai % 2) * 180, ay = curY + Math.floor(ai / 2) * 56;
    ctx.fillStyle = a.color; ctx.fillRect(ax, ay, 158, 46);
    ctx.fillStyle = '#FFF'; ctx.font = '12px "Noto Serif SC", serif'; ctx.textAlign = 'center';
    ctx.fillText(a.label, ax + 79, ay + 20);
    ctx.font = 'bold 18px "Noto Serif SC", serif';
    ctx.fillText(String(a.value), ax + 79, ay + 38);
  });
  curY += 130;

  ctx.fillStyle = '#5B3A1A'; ctx.font = 'bold 16px "Noto Serif SC", serif'; ctx.textAlign = 'center';
  ctx.fillText('—— 竹林修行 ——', W / 2, curY); curY += 24;
  ctx.fillStyle = '#4A7C59'; ctx.font = '14px "Noto Serif SC", serif';
  ctx.fillText('已修炼至第 ' + (hero.forestStage || 0) + ' 阶', W / 2, curY); curY += 34;

  ctx.fillStyle = '#5B3A1A'; ctx.font = 'bold 16px "Noto Serif SC", serif';
  ctx.fillText('—— 资产概要 ——', W / 2, curY); curY += 26;
  var savings = Number(user.savings) || 0, debtAmt = Number(user.debt) || 0, netWorth = savings - debtAmt;
  function fmtKC(v) { return v >= 10000 ? (v / 10000).toFixed(1) + '万' : v.toLocaleString(); }
  ctx.fillStyle = '#3A3028'; ctx.font = '13px "Noto Serif SC", serif'; ctx.textAlign = 'left';
  ctx.fillText('储蓄：' + fmtKC(savings) + '  负债：' + fmtKC(debtAmt) + '  净资产：' + fmtKC(netWorth), 40, curY); curY += 34;

  ctx.fillStyle = '#5B3A1A'; ctx.font = 'bold 16px "Noto Serif SC", serif'; ctx.textAlign = 'center';
  ctx.fillText('—— 徽章成就 ——', W / 2, curY); curY += 24;
  ctx.fillStyle = '#D4A843'; ctx.font = '22px serif';
  ctx.fillText('已解锁 ' + ach.length + ' 枚徽章', W / 2, curY); curY += 34;

  var quotes = ['财脉康健，根基扎实。', '江湖路远，稳字当先。', '以武会财，以理服人。', '一分耕耘，一分铜钱。', '莫道财帛轻如纸，且看江湖万丈深。'];
  ctx.fillStyle = '#8D8468'; ctx.font = 'italic 16px "Noto Serif SC", "STKaiti", serif'; ctx.textAlign = 'center';
  ctx.fillText('「' + quotes[Math.floor(Math.random() * quotes.length)] + '」', W / 2, curY + 10);

  var sealX = W - 80, sealY = H - 100;
  ctx.fillStyle = '#C0392B'; ctx.fillRect(sealX, sealY, 50, 50);
  ctx.fillStyle = '#FFF'; ctx.font = 'bold 18px "STKaiti", serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('江湖', sealX + 25, sealY + 25);

  ctx.fillStyle = '#8D8468'; ctx.font = '11px "Noto Serif SC", serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'bottom';
  var now = new Date();
  ctx.fillText('财富江湖 · 岁次 ' + now.getFullYear() + '年' + (now.getMonth() + 1) + '月' + now.getDate() + '日', 36, H - 40);

  var overlay = document.getElementById('scrollpainting-overlay');
  var bodyEl = document.getElementById('scrollpainting-body');
  if (bodyEl) { bodyEl.innerHTML = ''; bodyEl.appendChild(canvas); }
  if (overlay) overlay.classList.add('active');
  window._scrollPaintingCanvas = canvas;
  if (typeof checkDailyQuestProgress === 'function') checkDailyQuestProgress('scroll_painting', 1);
};

window.closeScrollPainting = function() {
  var overlay = document.getElementById('scrollpainting-overlay');
  if (overlay) overlay.classList.remove('active');
};

window.downloadScrollPainting = function() {
  var canvas = window._scrollPaintingCanvas || document.getElementById('scrollpainting-canvas');
  if (!canvas) return;
  canvas.toBlob(function(blob) {
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    var now = new Date();
    a.download = '江湖画卷_' + now.getFullYear() + ('0' + (now.getMonth() + 1)).slice(-2) + ('0' + now.getDate()).slice(-2) + '_' +
      ('0' + now.getHours()).slice(-2) + ('0' + now.getMinutes()).slice(-2) + '.png';
    a.href = url; a.click(); URL.revokeObjectURL(url);
  }, 'image/png');
};

// ============================================
// 本地江湖榜
// ============================================
var NPC_PRESETS = [
  { name: '李逍遥', title: '酒剑仙', level: 8, exp: 1200, coins: 85, achievements: 6, wisdom: 35, courage: 40, luck: 30 },
  { name: '赵灵儿', title: '仙灵岛主', level: 6, exp: 850, coins: 120, achievements: 5, wisdom: 30, courage: 25, luck: 45 },
  { name: '林月如', title: '林家堡主', level: 5, exp: 720, coins: 60, achievements: 4, wisdom: 25, courage: 35, luck: 20 },
  { name: '酒剑仙', title: '蜀山掌门', level: 9, exp: 1800, coins: 200, achievements: 7, wisdom: 45, courage: 50, luck: 35 },
  { name: '景天', title: '永安当铺主', level: 4, exp: 450, coins: 250, achievements: 3, wisdom: 20, courage: 20, luck: 55 }
];

window.initNPCData = function() {
  var key = 'wealth_jianghu_npc_ranking';
  if (!localStorage.getItem(key)) localStorage.setItem(key, JSON.stringify(NPC_PRESETS));
};

window.switchLeaderboardTab = function(tab) {
  document.querySelectorAll('.lb-tab').forEach(function(t) { t.classList.remove('active'); });
  if (event && event.target) event.target.classList.add('active');
  window._leaderboardTab = tab;
  renderLeaderboard();
};

window.renderLeaderboard = function() {
  var tab = window._leaderboardTab || 'level';
  var d = typeof getData === 'function' ? getData() : {};
  d = ensureCoinsInitialized(d);
  var hero = d.hero || {};
  var user = d.user || {};
  var ach = d.achievements || [];
  var lvInfo = typeof calcLevel === 'function' ? calcLevel(hero.exp || 0) : { level: 1 };

  var npcs = [];
  var raw = localStorage.getItem('wealth_jianghu_npc_ranking');
  if (raw) { try { npcs = JSON.parse(raw); } catch(e) {} }
  if (npcs.length === 0) { npcs = NPC_PRESETS.slice(); localStorage.setItem('wealth_jianghu_npc_ranking', JSON.stringify(npcs)); }

  var player = { name: user.name || '少侠', title: hero.title || '初入江湖', level: lvInfo.level, exp: hero.exp || 0, coins: hero.coins || 0, achievements: ach.length, isPlayer: true };
  var allEntries = [];
  npcs.forEach(function(n) { allEntries.push({ name: n.name, title: n.title, level: n.level, exp: n.exp, coins: n.coins, achievements: n.achievements, isPlayer: false }); });
  allEntries.push(player);

  if (tab === 'level') allEntries.sort(function(a, b) { return b.exp - a.exp; });
  else if (tab === 'coins') allEntries.sort(function(a, b) { return b.coins - a.coins; });
  else allEntries.sort(function(a, b) { return b.achievements - a.achievements; });

  var listEl = document.getElementById('lb-list');
  if (!listEl) return;
  if (allEntries.length <= 1) { listEl.innerHTML = '<div class="lb-solo">江湖独行，唯你一人</div>'; return; }

  listEl.innerHTML = allEntries.map(function(e, i) {
    var r = i + 1, rc = '', ic = '';
    if (r === 1) { rc = 'gold'; ic = 'top1'; }
    else if (r === 2) { rc = 'silver'; ic = 'top2'; }
    else if (r === 3) { rc = 'bronze'; ic = 'top3'; }
    var rt = r <= 10 ? CHINESE_NUMS[r] : String(r);
    var det = tab === 'level' ? 'Lv.' + e.level + ' · ' + e.exp + 'EXP' : tab === 'coins' ? '🪙' + e.coins : '🏅' + e.achievements + '枚';
    return '<div class="lb-item ' + ic + '">' +
      '<span class="lb-rank ' + rc + '">' + rt + '</span>' +
      '<span class="lb-name">' + (e.isPlayer ? '● ' : '') + e.name + '<span style="font-size:10px;color:#8D8468;margin-left:4px;">' + e.title + '</span></span>' +
      '<span class="lb-detail">' + det + '</span></div>';
  }).join('');
};

// ============================================
// renderHome 集成
// ============================================
(function() {
  var orig = window.renderHome;
  window.renderHome = function() {
    if (orig) orig();
    var d = typeof getData === 'function' ? getData() : {};
    ensureCoinsInitialized(d);
    updateCoinsDisplay(d);
    if (typeof renderAssetsDashboard === 'function') renderAssetsDashboard(d);
    if (typeof renderDailyQuests === 'function') renderDailyQuests();
    initNPCData();
    if (typeof renderLeaderboard === 'function') renderLeaderboard();
  };
})();

// ============================================
// 音效集成
// ============================================
(function() {
  var origGoTo = window.goTo;
  window.goTo = function(url) {
    if (typeof playSwitchSFX === 'function') playSwitchSFX();
    if (origGoTo) origGoTo(url);
  };
})();

(function() {
  var origTrig = window.triggerEncounter;
  window.triggerEncounter = function(force) {
    if (typeof playEncounterOpenSFX === 'function') playEncounterOpenSFX();
    if (origTrig) origTrig(force);
  };
})();

(function() {
  var origChk = window.checkAchievements;
  window.checkAchievements = function() {
    var result = origChk ? origChk() : [];
    if (result && result.length > 0 && typeof playAchievementSFX === 'function') playAchievementSFX();
    return result;
  };
})();
