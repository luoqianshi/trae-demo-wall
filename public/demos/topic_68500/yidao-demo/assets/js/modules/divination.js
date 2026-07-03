/**
 * 易道 App - 龟卜模拟模块
 * 核心亮点功能：沉浸式龟卜体验
 */

const DivinationModule = {
  // 状态
  state: {
    currentStep: 1,
    turtleType: null,
    question: '',
    hexagram: null,
    burning: false,
    crackPaths: []
  },
  
  // 渲染页面
  render() {
    const container = document.getElementById('page-divination');
    if (!container) return;
    
    container.innerHTML = `
      <div class="divination-container">
        <!-- 步骤指示器 -->
        <div class="steps">
          <div class="step active" data-step="1">准备</div>
          <div class="step" data-step="2">灼烧</div>
          <div class="step" data-step="3">观兆</div>
          <div class="step" data-step="4">得卦</div>
          <div class="step" data-step="5">解读</div>
          <div class="step" data-step="6">保存</div>
        </div>
        
        <!-- 主内容区 -->
        <div class="divination-layout">
          <!-- 左侧：龟卜区 -->
          <div class="divination-main">
            <!-- 步骤1：选择龟甲 -->
            <div class="step-content" id="step1-content">
              <h2 style="text-align:center; margin-bottom:32px;">选择龟甲，开始龟卜仪式</h2>
              
              <div class="turtle-options-single">
                <div class="turtle-option selected" data-type="bronze" onclick="DivinationModule.selectTurtle('bronze')">
                  <img src="assets/images/turtle-shell-base.jpg" alt="龟甲" class="turtle-img" />
                  <h4>青铜龟甲</h4>
                  <p>商周时期正统龟卜之法，灼龟甲观裂纹以定吉凶</p>
                </div>
              </div>
              
              <div class="question-input">
                <label>您想卜问什么？（可选）</label>
                <textarea id="divinationQuestion" placeholder="输入您的问题或心中所想..." rows="3"></textarea>
              </div>
              
              <div class="action-center">
                <button class="btn btn-primary btn-lg" id="startBurningBtn" onclick="DivinationModule.startBurning()">
                  <i class="fas fa-fire"></i> 开始灼龟
                </button>
              </div>
            </div>
            
            <!-- 步骤2：灼烧动画 -->
            <div class="step-content hidden" id="step2-content">
              <h2 style="text-align:center; margin-bottom:24px;">灼烧龟甲</h2>
              <div class="turtle-shell-wrapper">
                <img id="burnShellImg" src="assets/images/turtle-shell-base.jpg" alt="龟甲" class="shell-image" />
                <canvas id="burnCanvas" width="600" height="400"></canvas>
                <div class="burn-fire-effect" id="burnFireEffect"></div>
              </div>
              <p class="status-text" id="burnStatus">正在点燃火种...</p>
            </div>
            
            <!-- 步骤3：观兆 -->
            <div class="step-content hidden" id="step3-content">
              <h2 style="text-align:center; margin-bottom:24px;">观察裂纹走向</h2>
              <div class="turtle-shell-wrapper">
                <img src="assets/images/turtle-shell-base.jpg" alt="龟甲" class="shell-image" />
                <canvas id="crackCanvas" width="600" height="400"></canvas>
              </div>
              <p class="status-text" id="crackStatus">裂纹正在显现，静观天机...</p>
            </div>
            
            <!-- 步骤4：得卦 -->
            <div class="step-content hidden" id="step4-content">
              <h2 style="text-align:center;">卦象显现</h2>
              
              <div class="hexagram-display">
                <div class="hexagram-symbol-box">
                  <span class="hexagram-symbol" id="resultSymbol"></span>
                </div>
                <div class="hexagram-info-box">
                  <h3 id="resultName"></h3>
                  <p class="hexagram-type" id="resultType"></p>
                </div>
              </div>
              
              <div class="hexagram-lines-box" id="resultLines"></div>
              
              <div class="action-center">
                <button class="btn btn-primary" onclick="DivinationModule.showInterpretation()">
                  查看完整解读
                </button>
              </div>
            </div>
            
            <!-- 步骤5：解读 -->
            <div class="step-content hidden" id="step5-content">
              <h2 style="text-align:center;">卦象解读</h2>
              
              <div class="interpretation-tabs">
                <button class="tab active" data-tab="gua" onclick="DivinationModule.showTab('gua')">卦辞</button>
                <button class="tab" data-tab="xiang" onclick="DivinationModule.showTab('xiang')">象传</button>
                <button class="tab" data-tab="story" onclick="DivinationModule.showTab('story')">历史典故</button>
                <button class="tab" data-tab="apply" onclick="DivinationModule.showTab('apply')">现代启示</button>
              </div>
              
              <div class="interpretation-content" id="interpretationContent"></div>
              
              <div class="action-center">
                <button class="btn btn-primary" onclick="DivinationModule.saveRecord()">
                  保存卜卦记录
                </button>
              </div>
            </div>
            
            <!-- 步骤6：保存 -->
            <div class="step-content hidden" id="step6-content">
              <div class="save-success">
                <div class="success-icon">✓</div>
                <h2>已保存到卜卦记录</h2>
                <p>您可以在历史记录中查看本次卜卦详情</p>
                <div class="action-center">
                  <button class="btn btn-secondary" onclick="DivinationModule.restart()">
                    再卜一卦
                  </button>
                  <button class="btn btn-ghost" onclick="gotoPage('home')">
                    返回首页
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          <!-- 右侧：历史记录 -->
          <div class="divination-sidebar">
            <div class="sidebar-card">
              <h4><i class="fas fa-history"></i> 卜卦记录</h4>
              <div class="history-list" id="historyList">
                ${this.renderHistory()}
              </div>
            </div>
            
            <div class="sidebar-card">
              <h4><i class="fas fa-lightbulb"></i> 龟卜简介</h4>
              <p style="color: var(--color-text-light); font-size: 0.9rem; line-height: 1.8;">
                龟卜是商周时期重要的占卜方式。古人通过灼烧龟甲或兽骨，观察裂纹走向来预测吉凶，决策国家大事。每一道裂纹都蕴含着天地的启示。
              </p>
            </div>
          </div>
        </div>
      </div>
    `;
    
    // 默认选中龟甲
    this.state.turtleType = 'bronze';
    
    // 添加专属样式
    this.addStyles();
  },
  
  // 选择龟甲
  selectTurtle(type) {
    this.state.turtleType = type;
    document.querySelectorAll('.turtle-option').forEach(opt => opt.classList.add('selected'));
  },
  
  // 开始灼烧
  startBurning() {
    const questionInput = document.getElementById('divinationQuestion');
    this.state.question = questionInput ? questionInput.value : '';
    this.goToStep(2);
    this.performBurning();
  },
  
  // 执行灼烧动画 - 使用真实图片 + 火焰粒子特效
  performBurning() {
    const canvas = document.getElementById('burnCanvas');
    const ctx = canvas.getContext('2d');
    const statusEl = document.getElementById('burnStatus');
    const fireEffect = document.getElementById('burnFireEffect');
    
    // 火焰粒子数据
    const particles = [];
    const maxParticles = 80;
    let time = 0;
    
    // 创建粒子
    function createParticle() {
      const centerX = 300;
      const centerY = 200;
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 3;
      return {
        x: centerX + (Math.random() - 0.5) * 120,
        y: centerY + (Math.random() - 0.5) * 80,
        vx: Math.cos(angle) * speed * 0.3,
        vy: -Math.random() * 3 - 1,
        life: 1.0,
        decay: 0.01 + Math.random() * 0.03,
        size: 3 + Math.random() * 8,
        hue: Math.random() > 0.5 ? 30 + Math.random() * 30 : 10 + Math.random() * 20
      };
    }
    
    // 灼烧阶段文字
    const phases = [
      '正在点燃火种...',
      '火焰开始燃烧龟甲...',
      '龟甲逐渐升温，发出噼啪声...',
      '灼烧痕迹逐渐显现...',
      '灼烧完成，裂纹即将生成！'
    ];
    let phaseIndex = 0;
    
    const phaseTimer = setInterval(() => {
      phaseIndex++;
      if (phaseIndex < phases.length) {
        statusEl.textContent = phases[phaseIndex];
      }
      if (phaseIndex >= phases.length - 1) {
        clearInterval(phaseTimer);
      }
    }, 1000);
    
    // 动画循环
    const animate = () => {
      ctx.clearRect(0, 0, 600, 400);
      
      // 生成新粒子
      while (particles.length < maxParticles) {
        particles.push(createParticle());
      }
      
      // 更新和绘制粒子
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy -= 0.02; // 向上飘
        p.life -= p.decay;
        p.size *= 0.99;
        
        if (p.life <= 0) {
          particles.splice(i, 1);
          continue;
        }
        
        // 绘制火焰粒子
        const alpha = p.life * 0.8;
        const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
        
        if (p.hue > 20) {
          // 金黄色火焰
          gradient.addColorStop(0, `rgba(255, 220, 80, ${alpha})`);
          gradient.addColorStop(0.4, `rgba(255, 160, 20, ${alpha * 0.6})`);
          gradient.addColorStop(1, `rgba(200, 80, 0, 0)`);
        } else {
          // 红橙色火焰
          gradient.addColorStop(0, `rgba(255, 100, 20, ${alpha})`);
          gradient.addColorStop(0.4, `rgba(200, 50, 0, ${alpha * 0.5})`);
          gradient.addColorStop(1, `rgba(100, 20, 0, 0)`);
        }
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      
      // 绘制中心灼烧光晕
      const glowIntensity = Math.min(time / 100, 1);
      const glow = ctx.createRadialGradient(300, 200, 0, 300, 200, 150);
      glow.addColorStop(0, `rgba(255, 200, 50, ${0.15 * glowIntensity})`);
      glow.addColorStop(0.5, `rgba(200, 100, 0, ${0.08 * glowIntensity})`);
      glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, 600, 400);
      
      // 绘制灼烧焦痕（逐渐加深）
      if (time > 80) {
        const burnAlpha = Math.min((time - 80) / 120, 0.4);
        const burn = ctx.createRadialGradient(300, 200, 20, 300, 200, 130);
        burn.addColorStop(0, `rgba(40, 20, 5, ${burnAlpha})`);
        burn.addColorStop(0.6, `rgba(60, 30, 10, ${burnAlpha * 0.5})`);
        burn.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = burn;
        ctx.fillRect(0, 0, 600, 400);
      }
      
      // 添加火星飞溅效果
      if (time % 5 === 0) {
        for (let j = 0; j < 3; j++) {
          const sparkX = 300 + (Math.random() - 0.5) * 100;
          const sparkY = 200 + (Math.random() - 0.5) * 60;
          ctx.fillStyle = `rgba(255, 230, 100, ${0.8 + Math.random() * 0.2})`;
          ctx.beginPath();
          ctx.arc(sparkX, sparkY, 1 + Math.random() * 2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      
      time++;
      
      if (time < 200) {
        requestAnimationFrame(animate);
      } else {
        clearInterval(phaseTimer);
        statusEl.textContent = '灼烧完成！观察裂纹...';
        // 火焰逐渐熄灭
        let fadeTime = 0;
        const fadeAnim = setInterval(() => {
          ctx.clearRect(0, 0, 600, 400);
          // 残余焦痕
          const burn = ctx.createRadialGradient(300, 200, 20, 300, 200, 130);
          const fadeAlpha = Math.max(0.3 - fadeTime * 0.01, 0);
          burn.addColorStop(0, `rgba(40, 20, 5, ${fadeAlpha})`);
          burn.addColorStop(1, 'rgba(0, 0, 0, 0)');
          ctx.fillStyle = burn;
          ctx.fillRect(0, 0, 600, 400);
          fadeTime++;
          if (fadeTime > 30) clearInterval(fadeAnim);
        }, 50);
        setTimeout(() => this.goToStep(3), 800);
        setTimeout(() => this.generateCracks(), 900);
      }
    };
    
    animate();
  },
  
  // 生成裂纹
  generateCracks() {
    const canvas = document.getElementById('crackCanvas');
    const ctx = canvas.getContext('2d');
    const statusEl = document.getElementById('crackStatus');
    
    // 生成裂纹路径
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    this.state.crackPaths = Anim.generateCrackPaths(centerX, centerY, 5);
    
    // 清空画布
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 动画绘制裂纹
    const totalPaths = this.state.crackPaths.length;
    let currentPath = 0;
    let currentPoint = 0;
    const speed = 3; // 每帧绘制几个点
    
    const statusTexts = ['裂纹正在显现...', '纹路逐渐清晰...', '天机已现...'];
    let statusIdx = 0;
    
    const drawFrame = () => {
      // 半透明覆盖制造残影效果
      ctx.fillStyle = 'rgba(0, 0, 0, 0.02)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // 重绘所有已完成的路径（发光效果）
      for (let i = 0; i < currentPath; i++) {
        this.drawGlowPath(ctx, this.state.crackPaths[i]);
      }
      
      // 绘制当前路径
      if (currentPath < totalPaths) {
        const path = this.state.crackPaths[currentPath];
        const pointsToDraw = Math.min(currentPoint, path.points.length - 1);
        
        // 发光底层
        ctx.shadowColor = '#C9A227';
        ctx.shadowBlur = 15;
        ctx.strokeStyle = 'rgba(201, 162, 39, 0.4)';
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        ctx.beginPath();
        ctx.moveTo(path.points[0].x, path.points[0].y);
        for (let i = 1; i <= pointsToDraw; i++) {
          if (!path.points[i].branch) {
            ctx.lineTo(path.points[i].x, path.points[i].y);
          } else {
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(path.points[i-1].x, path.points[i-1].y);
            ctx.lineTo(path.points[i].x, path.points[i].y);
          }
        }
        ctx.stroke();
        
        // 明亮上层
        ctx.shadowBlur = 8;
        ctx.strokeStyle = '#E8D078';
        ctx.lineWidth = 2;
        
        ctx.beginPath();
        ctx.moveTo(path.points[0].x, path.points[0].y);
        for (let i = 1; i <= pointsToDraw; i++) {
          if (!path.points[i].branch) {
            ctx.lineTo(path.points[i].x, path.points[i].y);
          } else {
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(path.points[i-1].x, path.points[i-1].y);
            ctx.lineTo(path.points[i].x, path.points[i].y);
          }
        }
        ctx.stroke();
        ctx.shadowBlur = 0;
        
        currentPoint += speed;
        
        if (currentPoint >= path.points.length) {
          currentPath++;
          currentPoint = 0;
          // 更新状态文字
          if (statusIdx < statusTexts.length - 1) {
            statusIdx++;
            statusEl.textContent = statusTexts[statusIdx];
          }
        }
        
        requestAnimationFrame(drawFrame);
      } else {
        // 所有裂纹绘制完成 - 最终发光
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        this.state.crackPaths.forEach(path => this.drawGlowPath(ctx, path));
        
        // 中心光晕
        const glow = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 60);
        glow.addColorStop(0, 'rgba(201, 162, 39, 0.3)');
        glow.addColorStop(1, 'rgba(201, 162, 39, 0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(centerX, centerY, 60, 0, Math.PI * 2);
        ctx.fill();
        
        statusEl.textContent = '裂纹已定，卦象将现...';
        setTimeout(() => {
          this.getHexagram();
          this.goToStep(4);
        }, 1500);
      }
    };
    
    drawFrame();
  },
  
  // 绘制发光裂纹路径
  drawGlowPath(ctx, path) {
    // 外发光
    ctx.shadowColor = '#C9A227';
    ctx.shadowBlur = 20;
    ctx.strokeStyle = 'rgba(201, 162, 39, 0.5)';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    ctx.beginPath();
    ctx.moveTo(path.points[0].x, path.points[0].y);
    for (let i = 1; i < path.points.length; i++) {
      if (path.points[i].branch) {
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(path.points[i-1].x, path.points[i-1].y);
      }
      ctx.lineTo(path.points[i].x, path.points[i].y);
    }
    ctx.stroke();
    
    // 内发光
    ctx.shadowBlur = 8;
    ctx.strokeStyle = '#E8D078';
    ctx.lineWidth = 2;
    
    ctx.beginPath();
    ctx.moveTo(path.points[0].x, path.points[0].y);
    for (let i = 1; i < path.points.length; i++) {
      if (path.points[i].branch) {
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(path.points[i-1].x, path.points[i-1].y);
      }
      ctx.lineTo(path.points[i].x, path.points[i].y);
    }
    ctx.stroke();
    
    ctx.shadowBlur = 0;
  },
  
  // 得卦（随机匹配）
  getHexagram() {
    const randomIndex = Math.floor(Math.random() * 8);
    this.state.hexagram = HEXAGRAMS[randomIndex];
    this.displayHexagram();
  },
  
  // 显示卦象
  displayHexagram() {
    const hex = this.state.hexagram;
    
    document.getElementById('resultSymbol').textContent = hex.symbol;
    document.getElementById('resultName').textContent = hex.name + '卦';
    document.getElementById('resultType').textContent = hex.fullName + ' · ' + hex.nature;
    
    const linesContainer = document.getElementById('resultLines');
    Anim.revealLines(linesContainer, hex.lines, 300);
  },
  
  // 显示解读
  showInterpretation() {
    this.goToStep(5);
    this.showTab('gua');
  },
  
  // 切换Tab
  showTab(tabName) {
    const hex = this.state.hexagram;
    if (!hex) return;
    
    document.querySelectorAll('.interpretation-tabs .tab').forEach(tab => {
      tab.classList.remove('active');
    });
    document.querySelector(`.tab[data-tab="${tabName}"]`).classList.add('active');
    
    const contentEl = document.getElementById('interpretationContent');
    
    switch(tabName) {
      case 'gua':
        contentEl.innerHTML = `
          <div class="interp-section">
            <h4>卦辞原文</h4>
            <p class="original-text">${hex.text.gua}</p>
          </div>
          <div class="interp-section">
            <h4>白话译文</h4>
            <p class="translation">${hex.text.guaTranslation}</p>
          </div>
        `;
        break;
        
      case 'xiang':
        contentEl.innerHTML = `
          <div class="interp-section">
            <h4>象传原文</h4>
            <p class="original-text">${hex.text.xiang}</p>
          </div>
          <div class="interp-section">
            <h4>象传译文</h4>
            <p class="translation">${hex.text.xiangTranslation}</p>
          </div>
        `;
        break;
        
      case 'story':
        contentEl.innerHTML = `
          <div class="interp-section">
            <h4>历史典故</h4>
            <p>${hex.story}</p>
          </div>
        `;
        break;
        
      case 'apply':
        contentEl.innerHTML = `
          <div class="interp-section">
            <h4>现代启示</h4>
            <p>${hex.application}</p>
          </div>
          ${this.state.question ? `
          <div class="interp-section">
            <h4>针对您的问题</h4>
            <p>您卜问的是："${this.state.question}"。${hex.application}</p>
          </div>
          ` : ''}
        `;
        break;
    }
  },
  
  // 保存记录
  saveRecord() {
    const record = {
      id: Date.now(),
      date: new Date().toLocaleString('zh-CN'),
      turtleType: this.state.turtleType,
      question: this.state.question,
      hexagram: {
        name: this.state.hexagram.name,
        symbol: this.state.hexagram.symbol,
        fullName: this.state.hexagram.fullName
      }
    };
    
    Storage.saveDivinationRecord(record);
    this.updateHistory();
    this.goToStep(6);
  },
  
  // 更新历史列表
  updateHistory() {
    const historyList = document.getElementById('historyList');
    if (historyList) {
      historyList.innerHTML = this.renderHistory();
    }
  },
  
  // 渲染历史记录
  renderHistory() {
    const history = Storage.getDivinationHistory();
    
    if (history.length === 0) {
      return '<div class="empty-state"><p>暂无卜卦记录</p></div>';
    }
    
    return history.slice(0, 10).map(record => `
      <div class="history-item">
        <strong>${record.hexagram.name}卦</strong>
        <div class="history-meta">
          <span>${record.date}</span>
          ${record.question ? `<span style="color:var(--color-text-muted)">${record.question.substring(0,20)}...</span>` : ''}
        </div>
      </div>
    `).join('');
  },
  
  // 切换步骤
  goToStep(step) {
    this.state.currentStep = step;
    
    document.querySelectorAll('.steps .step').forEach(s => {
      s.classList.remove('active', 'completed');
      const stepNum = parseInt(s.dataset.step);
      if (stepNum < step) s.classList.add('completed');
      if (stepNum === step) s.classList.add('active');
    });
    
    document.querySelectorAll('.step-content').forEach(content => {
      content.classList.add('hidden');
    });
    document.getElementById(`step${step}-content`).classList.remove('hidden');
  },
  
  // 重新开始
  restart() {
    this.state = {
      currentStep: 1,
      turtleType: null,
      question: '',
      hexagram: null,
      burning: false,
      crackPaths: []
    };
    this.render();
  },
  
  // 添加专属样式
  addStyles() {
    const styles = `
      .divination-container {
        max-width: 1000px;
        margin: 0 auto;
      }
      
      .divination-layout {
        display: flex;
        gap: 32px;
        margin-top: 24px;
      }
      
      .divination-main {
        flex: 1;
        min-width: 0;
      }
      
      .divination-sidebar {
        width: 280px;
        flex-shrink: 0;
      }
      
      .sidebar-card {
        background: var(--color-bg-card);
        border-radius: var(--radius-lg);
        padding: 20px;
        margin-bottom: 20px;
      }
      
      .sidebar-card h4 {
        color: var(--color-secondary);
        margin-bottom: 12px;
        font-size: 0.95rem;
      }
      
      .history-item {
        padding: 10px 0;
        border-bottom: 1px solid var(--color-border-light);
      }
      
      .history-item:last-child {
        border-bottom: none;
      }
      
      .history-meta {
        display: flex;
        gap: 12px;
        margin-top: 4px;
        font-size: 0.8rem;
        color: var(--color-text-muted);
      }
      
      .empty-state {
        text-align: center;
        padding: 20px;
        color: var(--color-text-muted);
      }
      
      /* 龟甲选项 - 单选 */
      .turtle-options-single {
        display: flex;
        justify-content: center;
        margin-bottom: 32px;
      }
      
      .turtle-option {
        width: 320px;
        padding: 24px;
        background: var(--color-bg-card);
        border: 2px solid var(--color-primary);
        border-radius: var(--radius-lg);
        text-align: center;
        cursor: pointer;
        transition: all 0.3s;
      }
      
      .turtle-option:hover {
        transform: translateY(-4px);
        box-shadow: var(--shadow-glow);
      }
      
      .turtle-option.selected {
        border-color: var(--color-primary);
        background: rgba(201, 162, 39, 0.08);
        box-shadow: var(--shadow-glow);
      }
      
      .turtle-img {
        width: 200px;
        height: 200px;
        object-fit: cover;
        border-radius: var(--radius-md);
        margin-bottom: 16px;
        border: 2px solid var(--color-primary-dark);
      }
      
      .question-input {
        max-width: 500px;
        margin: 0 auto 32px;
      }
      
      .question-input label {
        display: block;
        margin-bottom: 8px;
        font-weight: 600;
      }
      
      .question-input textarea {
        width: 100%;
        padding: 12px;
        border: 1px solid var(--color-border);
        border-radius: var(--radius-md);
        background: var(--color-bg);
        font-size: 1rem;
        resize: vertical;
      }
      
      .action-center {
        text-align: center;
        margin: 24px 0;
      }
      
      /* 龟甲图片 + Canvas 叠加 */
      .turtle-shell-wrapper {
        position: relative;
        width: 600px;
        max-width: 100%;
        margin: 0 auto;
        border-radius: var(--radius-lg);
        overflow: hidden;
        background: #1A1510;
      }
      
      .shell-image {
        width: 100%;
        height: auto;
        display: block;
        opacity: 0.85;
      }
      
      .turtle-shell-wrapper canvas {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
      }
      
      .burn-fire-effect {
        position: absolute;
        inset: 0;
        pointer-events: none;
      }
      
      .status-text {
        text-align: center;
        color: var(--color-primary);
        font-size: 1.1rem;
        margin: 16px 0;
        letter-spacing: 0.05em;
      }
      
      /* 卦象展示 */
      .hexagram-display {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 24px;
        margin: 32px 0;
      }
      
      .hexagram-symbol-box {
        width: 120px;
        height: 120px;
        background: var(--color-bg-dark);
        border-radius: var(--radius-lg);
        display: flex;
        align-items: center;
        justify-content: center;
        border: 2px solid var(--color-primary);
        box-shadow: var(--shadow-glow);
      }
      
      .hexagram-symbol {
        font-size: 3.5rem;
        color: var(--color-primary);
      }
      
      .hexagram-lines-box {
        max-width: 300px;
        margin: 24px auto;
        padding: 24px;
        background: var(--color-bg-card);
        border-radius: var(--radius-lg);
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8px;
      }
      
      .hexagram-lines-box .hexagram-line {
        width: 160px;
        height: 12px;
        border-radius: 3px;
      }
      
      .hexagram-lines-box .hexagram-line.yang {
        background: var(--color-primary);
        box-shadow: 0 0 8px rgba(201, 162, 39, 0.3);
      }
      
      .hexagram-lines-box .hexagram-line.yin {
        background: transparent;
        position: relative;
      }
      
      .hexagram-lines-box .hexagram-line.yin::before,
      .hexagram-lines-box .hexagram-line.yin::after {
        content: '';
        position: absolute;
        width: 42%;
        height: 100%;
        background: var(--color-primary);
        border-radius: 3px;
        box-shadow: 0 0 8px rgba(201, 162, 39, 0.3);
      }
      
      .hexagram-lines-box .hexagram-line.yin::before { left: 0; }
      .hexagram-lines-box .hexagram-line.yin::after { right: 0; }
      
      /* 解读 */
      .interpretation-tabs {
        display: flex;
        gap: 8px;
        justify-content: center;
        margin-bottom: 24px;
        flex-wrap: wrap;
      }
      
      .interpretation-content {
        max-width: 700px;
        margin: 0 auto;
        padding: 24px;
        background: var(--color-bg-card);
        border-radius: var(--radius-lg);
        text-align: left;
      }
      
      .interp-section {
        margin-bottom: 24px;
      }
      
      .interp-section:last-child {
        margin-bottom: 0;
      }
      
      .interp-section h4 {
        color: var(--color-secondary);
        margin-bottom: 12px;
        font-size: 1.05rem;
      }
      
      .original-text {
        font-family: var(--font-title);
        color: var(--color-text);
        font-size: 1.1rem;
        line-height: 2;
      }
      
      .translation {
        color: var(--color-text-light);
        line-height: 2;
      }
      
      /* 保存成功 */
      .save-success {
        text-align: center;
        padding: 48px;
      }
      
      .success-icon {
        width: 80px;
        height: 80px;
        background: var(--color-success);
        color: white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 2.5rem;
        margin: 0 auto 24px;
      }
      
      .step-content.hidden {
        display: none;
      }
      
      /* 响应式 */
      @media (max-width: 768px) {
        .divination-layout {
          flex-direction: column;
        }
        
        .divination-sidebar {
          width: 100%;
        }
        
        .turtle-option {
          width: 100%;
          max-width: 320px;
        }
        
        .turtle-img {
          width: 160px;
          height: 160px;
        }
      }
    `;
    
    if (!document.getElementById('divination-styles')) {
      const styleSheet = document.createElement('style');
      styleSheet.id = 'divination-styles';
      styleSheet.textContent = styles;
      document.head.appendChild(styleSheet);
    }
  }
};
