/**
 * 易道 App - 八卦研习模块
 * 美化版本 - 增强视觉效果与图片元素
 */

const BaguaModule = {
  state: {
    selectedTrigram: null,
    currentLevel: 1
  },
  
  render() {
    const container = document.getElementById('page-bagua');
    if (!container) return;
    
    container.innerHTML = `
      <div class="bagua-page-wrapper">
        <!-- 页面标题区 -->
        <div class="bagua-header-section">
          <div class="bagua-header-decoration">
            <img src="assets/images/features-bg.jpg" alt="" class="header-bg-img">
            <div class="header-overlay"></div>
          </div>
          <div class="bagua-header-content">
            <h2 class="bagua-main-title">八卦研习</h2>
            <p class="bagua-subtitle">探索天地八种基本力量，领悟自然之道</p>
          </div>
        </div>
        
        <!-- 八卦图核心区域 -->
        <div class="bagua-core-section">
          <div class="bagua-diagram-container">
            <div class="bagua-image-wrapper">
              <img src="assets/images/bagua-diagram.jpg" alt="八卦图" class="bagua-main-image">
              <div class="bagua-glow-ring"></div>
              <div class="bagua-diagram-overlay" id="baguaDiagram">
                <div class="bagua-center-taiji">
                  <div class="taiji-symbol">☯</div>
                </div>
                ${this.renderTrigramButtons()}
              </div>
            </div>
            
            <!-- 右侧信息卡片 -->
            <div class="bagua-side-info">
              <div class="bagua-intro-card">
                <div class="card-icon">
                  <i class="fas fa-book-open"></i>
                </div>
                <h4>八卦起源</h4>
                <p>八卦是中国古代哲学的核心符号体系，相传由伏羲氏观察天地万物后所创。每一卦由三爻组成，代表天地间八种基本自然现象与力量。</p>
              </div>
              
              <div class="bagua-quick-ref">
                <h5>八卦速查</h5>
                <div class="quick-ref-grid">
                  <div class="ref-item" onclick="BaguaModule.selectTrigram('乾')">
                    <span class="ref-symbol">☰</span>
                    <span class="ref-name">乾·天</span>
                  </div>
                  <div class="ref-item" onclick="BaguaModule.selectTrigram('坤')">
                    <span class="ref-symbol">☷</span>
                    <span class="ref-name">坤·地</span>
                  </div>
                  <div class="ref-item" onclick="BaguaModule.selectTrigram('震')">
                    <span class="ref-symbol">☳</span>
                    <span class="ref-name">震·雷</span>
                  </div>
                  <div class="ref-item" onclick="BaguaModule.selectTrigram('巽')">
                    <span class="ref-symbol">☴</span>
                    <span class="ref-name">巽·风</span>
                  </div>
                  <div class="ref-item" onclick="BaguaModule.selectTrigram('坎')">
                    <span class="ref-symbol">☵</span>
                    <span class="ref-name">坎·水</span>
                  </div>
                  <div class="ref-item" onclick="BaguaModule.selectTrigram('离')">
                    <span class="ref-symbol">☲</span>
                    <span class="ref-name">离·火</span>
                  </div>
                  <div class="ref-item" onclick="BaguaModule.selectTrigram('艮')">
                    <span class="ref-symbol">☶</span>
                    <span class="ref-name">艮·山</span>
                  </div>
                  <div class="ref-item" onclick="BaguaModule.selectTrigram('兑')">
                    <span class="ref-symbol">☱</span>
                    <span class="ref-name">兑·泽</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 详细信息展示区 -->
        <div class="trigram-detail hidden" id="trigramDetail">
          ${this.renderDetailTemplate()}
        </div>
        
        <!-- 底部装饰 -->
        <div class="bagua-footer-decoration">
          <div class="decoration-line"></div>
          <span class="decoration-text">天地之道，阴阳之理</span>
          <div class="decoration-line"></div>
        </div>
      </div>
    `;
    
    this.addStyles();
  },
  
  renderTrigramButtons() {
    const positions = [
      { name: '乾', angle: 315 },
      { name: '坎', angle: 0 },
      { name: '艮', angle: 45 },
      { name: '震', angle: 90 },
      { name: '巽', angle: 135 },
      { name: '离', angle: 180 },
      { name: '坤', angle: 225 },
      { name: '兑', angle: 270 }
    ];
    
    return positions.map(p => {
      const tri = TRIGRAMS[p.name];
      return `
        <div class="trigram-btn" 
             data-name="${p.name}" 
             style="--angle: ${p.angle}deg"
             onclick="BaguaModule.selectTrigram('${p.name}')">
          <span class="tri-symbol">${tri.symbol}</span>
          <span class="tri-name">${tri.name}</span>
        </div>
      `;
    }).join('');
  },
  
  renderDetailTemplate() {
    return `
      <div class="detail-card-wrapper">
        <div class="detail-visual-side">
          <div class="trigram-lines-visual" id="triLines"></div>
          <div class="trigram-large-symbol" id="triLargeSymbol"></div>
        </div>
        
        <div class="detail-info-side">
          <div class="trigram-basic-info">
            <h3 id="triName"></h3>
            <p class="tri-nature" id="triNature"></p>
            <p class="tri-element" id="triElement"></p>
          </div>
          
          <div class="detail-level2 hidden" id="detailLevel2">
            <div class="detail-grid">
              <div class="detail-item">
                <i class="fas fa-mountain"></i>
                <h5>自然象征</h5>
                <p id="triNatureSymbol"></p>
              </div>
              <div class="detail-item">
                <i class="fas fa-user"></i>
                <h5>人物象征</h5>
                <p id="triPerson"></p>
              </div>
              <div class="detail-item">
                <i class="fas fa-compass"></i>
                <h5>方位</h5>
                <p id="triDirection"></p>
              </div>
              <div class="detail-item">
                <i class="fas fa-leaf"></i>
                <h5>季节</h5>
                <p id="triSeason"></p>
              </div>
              <div class="detail-item">
                <i class="fas fa-star"></i>
                <h5>特性</h5>
                <p id="triTrait"></p>
              </div>
              <div class="detail-item">
                <i class="fas fa-yin-yang"></i>
                <h5>五行</h5>
                <p id="triElement2"></p>
              </div>
            </div>
          </div>
          
          <div class="detail-level3 hidden" id="detailLevel3">
            <div class="virtue-section">
              <div class="virtue-icon">
                <i class="fas fa-lightbulb"></i>
              </div>
              <h4>卦德与启示</h4>
              <p id="triVirtue"></p>
            </div>
          </div>
          
          <div class="detail-actions">
            <button class="btn btn-secondary" onclick="BaguaModule.toggleLevel(2)">
              <i class="fas fa-plus-circle"></i> 查看更多信息
            </button>
          </div>
        </div>
      </div>
    `;
  },
  
  selectTrigram(name) {
    const tri = TRIGRAMS[name];
    if (!tri) return;
    
    this.state.selectedTrigram = name;
    this.state.currentLevel = 1;
    
    document.querySelectorAll('.trigram-btn').forEach(btn => btn.classList.remove('selected'));
    document.querySelector(`.trigram-btn[data-name="${name}"]`)?.classList.add('selected');
    
    document.querySelectorAll('.ref-item').forEach(item => item.classList.remove('active'));
    
    const detail = document.getElementById('trigramDetail');
    detail.classList.remove('hidden');
    
    document.getElementById('triName').textContent = tri.name + '卦';
    document.getElementById('triNature').textContent = tri.nature;
    document.getElementById('triElement').textContent = '五行：' + tri.element;
    document.getElementById('triLargeSymbol').textContent = tri.symbol;
    
    this.renderLines(tri.lines);
    
    document.getElementById('detailLevel2').classList.add('hidden');
    document.getElementById('detailLevel3').classList.add('hidden');
    
    detail.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  },
  
  renderLines(lines) {
    const container = document.getElementById('triLines');
    container.innerHTML = '';
    lines.forEach(line => {
      const lineEl = document.createElement('div');
      lineEl.className = `trigram-line ${line}`;
      container.appendChild(lineEl);
    });
  },
  
  toggleLevel(level) {
    const tri = TRIGRAMS[this.state.selectedTrigram];
    if (!tri) return;
    
    if (level === 2) {
      document.getElementById('detailLevel2').classList.remove('hidden');
      document.getElementById('triNatureSymbol').textContent = tri.natureSymbol;
      document.getElementById('triPerson').textContent = tri.person;
      document.getElementById('triDirection').textContent = tri.direction;
      document.getElementById('triSeason').textContent = tri.season;
      document.getElementById('triTrait').textContent = tri.trait;
      document.getElementById('triElement2').textContent = tri.element;
      
      const btn = document.querySelector('.detail-actions .btn');
      btn.innerHTML = '<i class="fas fa-book"></i> 查看卦德启示';
      btn.onclick = () => this.toggleLevel(3);
    } else if (level === 3) {
      document.getElementById('detailLevel3').classList.remove('hidden');
      document.getElementById('triVirtue').textContent = tri.virtue;
      
      const btn = document.querySelector('.detail-actions .btn');
      btn.innerHTML = '<i class="fas fa-minus-circle"></i> 收起详情';
      btn.onclick = () => this.hideLevels();
    }
  },
  
  hideLevels() {
    document.getElementById('detailLevel2').classList.add('hidden');
    document.getElementById('detailLevel3').classList.add('hidden');
    
    const btn = document.querySelector('.detail-actions .btn');
    btn.innerHTML = '<i class="fas fa-plus-circle"></i> 查看更多信息';
    btn.onclick = () => this.toggleLevel(2);
  },
  
  addStyles() {
    const styles = `
      /* === 八卦页面整体布局 === */
      .bagua-page-wrapper {
        max-width: 1000px;
        margin: 0 auto;
        padding-bottom: 40px;
      }
      
      /* === 标题区域 === */
      .bagua-header-section {
        position: relative;
        height: 180px;
        margin-bottom: 40px;
        border-radius: var(--radius-xl);
        overflow: hidden;
      }
      
      .bagua-header-decoration {
        position: absolute;
        inset: 0;
      }
      
      .header-bg-img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        opacity: 0.3;
        filter: blur(2px);
      }
      
      .header-overlay {
        position: absolute;
        inset: 0;
        background: linear-gradient(135deg, rgba(26, 21, 16, 0.85) 0%, rgba(107, 68, 35, 0.7) 100%);
      }
      
      .bagua-header-content {
        position: relative;
        z-index: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 100%;
        text-align: center;
      }
      
      .bagua-main-title {
        font-family: var(--font-title);
        font-size: 2.5rem;
        color: var(--color-primary);
        letter-spacing: 0.3em;
        margin-bottom: 12px;
        text-shadow: 0 2px 20px rgba(201, 162, 39, 0.3);
      }
      
      .bagua-subtitle {
        font-size: 1rem;
        color: var(--color-text-light);
        opacity: 0.85;
      }
      
      /* === 八卦图核心区域 === */
      .bagua-core-section {
        margin-bottom: 32px;
      }
      
      .bagua-diagram-container {
        display: flex;
        gap: 32px;
        align-items: flex-start;
        justify-content: center;
        flex-wrap: wrap;
      }
      
      .bagua-image-wrapper {
        position: relative;
        width: 340px;
        height: 340px;
        border-radius: 50%;
        overflow: hidden;
        border: 4px solid var(--color-primary);
        box-shadow: 
          0 0 40px rgba(201, 162, 39, 0.35),
          0 0 80px rgba(201, 162, 39, 0.15),
          inset 0 0 30px rgba(0, 0, 0, 0.3);
        animation: gentleGlow 4s ease-in-out infinite;
      }
      
      @keyframes gentleGlow {
        0%, 100% { box-shadow: 0 0 40px rgba(201, 162, 39, 0.35), 0 0 80px rgba(201, 162, 39, 0.15); }
        50% { box-shadow: 0 0 50px rgba(201, 162, 39, 0.45), 0 0 100px rgba(201, 162, 39, 0.2); }
      }
      
      .bagua-main-image {
        width: 100%;
        height: 100%;
        object-fit: cover;
        opacity: 0.55;
        filter: contrast(1.1);
      }
      
      .bagua-glow-ring {
        position: absolute;
        inset: -10px;
        border-radius: 50%;
        border: 2px solid transparent;
        background: linear-gradient(45deg, transparent 40%, rgba(201, 162, 39, 0.3) 50%, transparent 60%);
        animation: rotateRing 8s linear infinite;
        pointer-events: none;
      }
      
      @keyframes rotateRing {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
      
      .bagua-diagram-overlay {
        position: absolute;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        pointer-events: none;
      }
      
      .bagua-diagram-overlay > * {
        pointer-events: auto;
      }
      
      .bagua-center-taiji {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        z-index: 5;
      }
      
      .taiji-symbol {
        font-size: 3.5rem;
        color: var(--color-primary);
        text-shadow: 0 0 30px rgba(201, 162, 39, 0.6);
        animation: pulseTaiji 3s ease-in-out infinite;
      }
      
      @keyframes pulseTaiji {
        0%, 100% { transform: scale(1); opacity: 1; }
        50% { transform: scale(1.08); opacity: 0.9; }
      }
      
      /* === 八卦按钮 === */
      .trigram-btn {
        position: absolute;
        width: 60px;
        height: 60px;
        background: rgba(26, 21, 16, 0.92);
        border: 2px solid var(--color-primary);
        border-radius: var(--radius-md);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        z-index: 10;
        
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%) rotate(var(--angle)) translateX(125px) rotate(calc(-1 * var(--angle)));
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
      }
      
      .trigram-btn:hover {
        background: var(--color-primary);
        transform: translate(-50%, -50%) rotate(var(--angle)) translateX(125px) rotate(calc(-1 * var(--angle))) scale(1.2);
        box-shadow: 0 0 25px rgba(201, 162, 39, 0.6), 0 8px 25px rgba(0, 0, 0, 0.4);
      }
      
      .trigram-btn.selected {
        background: var(--color-primary);
        box-shadow: 0 0 30px rgba(201, 162, 39, 0.7);
        transform: translate(-50%, -50%) rotate(var(--angle)) translateX(125px) rotate(calc(-1 * var(--angle))) scale(1.15);
      }
      
      .tri-symbol {
        font-size: 1.4rem;
        color: var(--color-primary);
        line-height: 1;
        transition: color 0.3s;
        font-family: "Noto Sans Symbols2", "Segoe UI Symbol", "Symbola", "DejaVu Sans", sans-serif;
      }
      
      .tri-name {
        font-size: 0.85rem;
        color: var(--color-text-muted);
        font-weight: 600;
        transition: color 0.3s;
      }
      
      .trigram-btn:hover .tri-symbol,
      .trigram-btn:hover .tri-name,
      .trigram-btn.selected .tri-symbol,
      .trigram-btn.selected .tri-name {
        color: var(--color-bg-dark);
      }
      
      /* === 右侧信息区 === */
      .bagua-side-info {
        display: flex;
        flex-direction: column;
        gap: 20px;
        max-width: 320px;
      }
      
      .bagua-intro-card {
        background: var(--color-bg-card);
        border: 1px solid var(--color-border);
        border-radius: var(--radius-lg);
        padding: 24px;
        position: relative;
        overflow: hidden;
      }
      
      .bagua-intro-card::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 3px;
        background: linear-gradient(90deg, var(--color-primary), var(--color-secondary));
      }
      
      .card-icon {
        width: 48px;
        height: 48px;
        background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
        border-radius: var(--radius-md);
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 16px;
        color: var(--color-bg-dark);
        font-size: 1.2rem;
      }
      
      .bagua-intro-card h4 {
        color: var(--color-secondary);
        margin-bottom: 12px;
        font-size: 1.1rem;
        font-family: var(--font-title);
      }
      
      .bagua-intro-card p {
        color: var(--color-text-light);
        font-size: 0.9rem;
        line-height: 1.7;
      }
      
      /* === 八卦速查 === */
      .bagua-quick-ref {
        background: var(--color-bg-card);
        border: 1px solid var(--color-border);
        border-radius: var(--radius-lg);
        padding: 20px;
      }
      
      .bagua-quick-ref h5 {
        color: var(--color-secondary);
        font-size: 0.95rem;
        margin-bottom: 16px;
        text-align: center;
      }
      
      .quick-ref-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 10px;
      }
      
      .ref-item {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 10px 12px;
        background: var(--color-bg);
        border-radius: var(--radius-md);
        cursor: pointer;
        transition: all 0.3s;
        border: 1px solid transparent;
      }
      
      .ref-item:hover {
        border-color: var(--color-primary);
        background: rgba(201, 162, 39, 0.1);
      }
      
      .ref-item.active {
        border-color: var(--color-primary);
        background: rgba(201, 162, 39, 0.15);
      }
      
      .ref-symbol {
        font-size: 1.3rem;
        color: var(--color-primary);
        font-family: "Noto Sans Symbols2", "Segoe UI Symbol", "Symbola", "DejaVu Sans", sans-serif;
      }
      
      .ref-name {
        font-size: 0.85rem;
        color: var(--color-text-light);
        font-weight: 500;
      }
      
      /* === 详细信息展示 === */
      .trigram-detail {
        background: var(--color-bg-card);
        border: 2px solid var(--color-primary);
        border-radius: var(--radius-xl);
        padding: 0;
        max-width: 700px;
        margin: 0 auto;
        overflow: hidden;
        box-shadow: 0 10px 40px rgba(201, 162, 39, 0.2);
      }
      
      .trigram-detail.hidden {
        display: none;
      }
      
      .detail-card-wrapper {
        display: flex;
        gap: 0;
      }
      
      .detail-visual-side {
        width: 180px;
        background: linear-gradient(180deg, var(--color-bg-dark) 0%, rgba(26, 21, 16, 0.8) 100%);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 32px 20px;
        border-right: 1px solid var(--color-border);
      }
      
      .trigram-lines-visual {
        width: 80px;
        height: 70px;
        background: transparent;
        padding: 8px;
        display: flex;
        flex-direction: column;
        justify-content: space-around;
        margin-bottom: 16px;
      }
      
      .trigram-line {
        height: 12px;
        background: var(--color-primary);
        border-radius: 2px;
        box-shadow: 0 0 10px rgba(201, 162, 39, 0.3);
      }
      
      .trigram-line.yin {
        background: transparent;
        position: relative;
      }
      
      .trigram-line.yin::before,
      .trigram-line.yin::after {
        content: '';
        position: absolute;
        width: 36%;
        height: 100%;
        background: var(--color-primary);
        border-radius: 2px;
        box-shadow: 0 0 10px rgba(201, 162, 39, 0.3);
      }
      
      .trigram-line.yin::before { left: 0; }
      .trigram-line.yin::after { right: 0; }
      
      .trigram-large-symbol {
        font-size: 2.5rem;
        color: var(--color-primary);
        text-shadow: 0 0 20px rgba(201, 162, 39, 0.5);
        font-family: "Noto Sans Symbols2", "Segoe UI Symbol", "Symbola", "DejaVu Sans", sans-serif;
      }
      
      .detail-info-side {
        flex: 1;
        padding: 28px 32px;
      }
      
      .trigram-basic-info {
        margin-bottom: 20px;
        padding-bottom: 20px;
        border-bottom: 1px solid var(--color-border);
      }
      
      .trigram-basic-info h3 {
        color: var(--color-secondary);
        font-size: 1.5rem;
        margin-bottom: 8px;
        font-family: var(--font-title);
      }
      
      .tri-nature {
        color: var(--color-text);
        font-size: 1.1rem;
        margin-bottom: 6px;
      }
      
      .tri-element {
        color: var(--color-text-muted);
        font-size: 0.95rem;
      }
      
      .detail-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 14px;
        margin-top: 16px;
      }
      
      .detail-item {
        background: var(--color-bg);
        padding: 14px;
        border-radius: var(--radius-md);
        text-align: center;
        border: 1px solid var(--color-border-light);
        transition: all 0.3s;
      }
      
      .detail-item:hover {
        border-color: var(--color-primary);
        box-shadow: 0 4px 12px rgba(201, 162, 39, 0.1);
      }
      
      .detail-item i {
        display: block;
        font-size: 1rem;
        color: var(--color-primary);
        margin-bottom: 8px;
      }
      
      .detail-item h5 {
        color: var(--color-secondary);
        font-size: 0.85rem;
        margin-bottom: 6px;
      }
      
      .detail-item p {
        color: var(--color-text-light);
        font-size: 0.9rem;
        margin: 0;
      }
      
      .virtue-section {
        background: linear-gradient(135deg, var(--color-bg) 0%, rgba(201, 162, 39, 0.05) 100%);
        padding: 24px;
        border-radius: var(--radius-md);
        margin-top: 20px;
        border: 1px solid rgba(201, 162, 39, 0.2);
      }
      
      .virtue-icon {
        width: 40px;
        height: 40px;
        background: var(--color-primary);
        border-radius: var(--radius-md);
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 12px;
        color: var(--color-bg-dark);
        font-size: 1rem;
      }
      
      .virtue-section h4 {
        color: var(--color-secondary);
        margin-bottom: 12px;
        font-size: 1rem;
      }
      
      .virtue-section p {
        color: var(--color-text-light);
        line-height: 1.8;
        font-size: 0.95rem;
      }
      
      .detail-level2.hidden,
      .detail-level3.hidden {
        display: none;
      }
      
      .detail-actions {
        text-align: center;
        margin-top: 24px;
        padding-top: 20px;
        border-top: 1px solid var(--color-border-light);
      }
      
      .detail-actions .btn {
        padding: 12px 28px;
      }
      
      /* === 底部装饰 === */
      .bagua-footer-decoration {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 20px;
        margin-top: 40px;
        padding-top: 20px;
      }
      
      .decoration-line {
        width: 80px;
        height: 1px;
        background: linear-gradient(90deg, transparent, var(--color-primary), transparent);
      }
      
      .decoration-text {
        font-size: 0.85rem;
        color: var(--color-text-muted);
        letter-spacing: 0.1em;
      }
      
      /* === 响应式 === */
      @media (max-width: 900px) {
        .bagua-diagram-container {
          flex-direction: column;
          align-items: center;
        }
        
        .bagua-side-info {
          max-width: 100%;
          width: 340px;
        }
        
        .detail-card-wrapper {
          flex-direction: column;
        }
        
        .detail-visual-side {
          width: 100%;
          border-right: none;
          border-bottom: 1px solid var(--color-border);
          padding: 24px;
        }
        
        .detail-grid {
          grid-template-columns: repeat(2, 1fr);
        }
      }
      
      @media (max-width: 768px) {
        .bagua-header-section {
          height: 140px;
        }
        
        .bagua-main-title {
          font-size: 2rem;
        }
        
        .bagua-image-wrapper {
          width: 280px;
          height: 280px;
        }
        
        .trigram-btn {
          width: 50px;
          height: 50px;
          transform: translate(-50%, -50%) rotate(var(--angle)) translateX(105px) rotate(calc(-1 * var(--angle)));
        }
        
        .tri-symbol { font-size: 1.2rem; }
        .tri-name { font-size: 0.75rem; }
        
        .bagua-side-info {
          width: 100%;
        }
        
        .quick-ref-grid {
          grid-template-columns: repeat(4, 1fr);
        }
        
        .ref-symbol { font-size: 1.1rem; }
        .ref-name { display: none; }
      }
    `;
    
    if (!document.getElementById('bagua-styles')) {
      const styleSheet = document.createElement('style');
      styleSheet.id = 'bagua-styles';
      styleSheet.textContent = styles;
      document.head.appendChild(styleSheet);
    }
  }
};