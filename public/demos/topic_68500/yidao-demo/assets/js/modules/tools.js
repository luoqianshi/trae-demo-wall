/**
 * 易道 App - 起卦工具模块
 * 美化版本 - 增强铜钱起卦视觉效果
 */

const ToolsModule = {
  state: {
    rounds: 0,
    results: [],
    hexagram: null,
    shaking: false
  },
  
  render() {
    const container = document.getElementById('page-tools');
    if (!container) return;
    
    // 重置状态
    this.state = { rounds: 0, results: [], hexagram: null, shaking: false };
    
    container.innerHTML = `
      <div class="tools-page-wrapper">
        <!-- 页面标题区 -->
        <div class="tools-header-section">
          <div class="tools-header-decoration">
            <img src="assets/images/copper-coins.jpg" alt="" class="tools-header-bg">
            <div class="tools-header-overlay"></div>
          </div>
          <div class="tools-header-content">
            <h2 class="tools-main-title">起卦工具</h2>
            <p class="tools-subtitle">多种方式，即刻与古人智慧对话</p>
          </div>
        </div>
        
        <!-- 标签切换 -->
        <div class="tools-tabs-container">
          <div class="tools-tabs">
            <button class="tab active" data-tab="coin" onclick="ToolsModule.switchTab('coin')">
              <i class="fas fa-coins"></i>
              <span>铜钱摇卦</span>
            </button>
            <button class="tab" data-tab="number" onclick="ToolsModule.switchTab('number')">
              <i class="fas fa-hashtag"></i>
              <span>数字起卦</span>
            </button>
            <button class="tab" data-tab="time" onclick="ToolsModule.switchTab('time')">
              <i class="fas fa-clock"></i>
              <span>时间起卦</span>
            </button>
          </div>
        </div>
        
        <!-- 铜钱摇卦 -->
        <div class="tool-panel" id="panel-coin">
          <div class="coin-divination-area">
            <!-- 背景装饰 -->
            <div class="coin-bg-wrapper">
              <img src="assets/images/coins-animation.jpg" alt="铜钱起卦背景" class="coin-bg-image">
              <div class="coin-bg-overlay"></div>
              <div class="coin-pattern-overlay"></div>
            </div>
            
            <!-- 铜钱显示区 -->
            <div class="coin-stage">
              <div class="coin-table">
                <div class="table-decoration">
                  <div class="decoration-circle outer"></div>
                  <div class="decoration-circle inner"></div>
                  <div class="decoration-lines"></div>
                </div>
                
                <div class="coins-display" id="coinsDisplay">
                  <div class="coin-slot">
                    <div class="coin-3d" id="coin1">
                      <div class="coin-face coin-front">
                        <span class="coin-text">開元</span>
                        <span class="coin-text-small">通寶</span>
                      </div>
                      <div class="coin-face coin-back">
                        <div class="coin-square-hole"></div>
                        <div class="coin-back-pattern"></div>
                      </div>
                    </div>
                  </div>
                  <div class="coin-slot">
                    <div class="coin-3d" id="coin2">
                      <div class="coin-face coin-front">
                        <span class="coin-text">開元</span>
                        <span class="coin-text-small">通寶</span>
                      </div>
                      <div class="coin-face coin-back">
                        <div class="coin-square-hole"></div>
                        <div class="coin-back-pattern"></div>
                      </div>
                    </div>
                  </div>
                  <div class="coin-slot">
                    <div class="coin-3d" id="coin3">
                      <div class="coin-face coin-front">
                        <span class="coin-text">開元</span>
                        <span class="coin-text-small">通寶</span>
                      </div>
                      <div class="coin-face coin-back">
                        <div class="coin-square-hole"></div>
                        <div class="coin-back-pattern"></div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div class="coin-result-text" id="coinResultText"></div>
              </div>
              
              <!-- 操作按钮 -->
              <div class="coin-action-area">
                <button class="btn btn-primary btn-lg coin-shake-btn" id="shakeBtn" onclick="ToolsModule.shakeCoins()">
                  <i class="fas fa-hand-sparkles"></i>
                  <span>摇动铜钱</span>
                  <span class="round-indicator">第 <span id="roundNum">0</span>/6 次</span>
                </button>
              </div>
            </div>
            
            <!-- 进度显示 -->
            <div class="coin-progress-area">
              <div class="progress-container">
                <div class="progress-label">起卦进度</div>
                <div class="progress-bar">
                  <div class="progress-fill" id="coinProgressBar" style="width:0%"></div>
                  <div class="progress-glow"></div>
                </div>
              </div>
              <div class="accumulated-lines" id="accumulatedLines"></div>
            </div>
            
            <!-- 结果展示 -->
            <div class="tool-result hidden" id="coinResult">
              <div class="hexagram-result-card">
                <div class="result-header">
                  <div class="result-symbol-container">
                    <span class="hexagram-symbol" id="toolSymbol"></span>
                  </div>
                  <div class="result-info">
                    <h3 id="toolName"></h3>
                    <p id="toolType"></p>
                  </div>
                </div>
                <div class="result-lines-container">
                  <div class="hexagram-lines-box" id="toolLines"></div>
                </div>
                <div class="result-text-container">
                  <div class="hexagram-text" id="toolText"></div>
                </div>
                <div class="result-actions">
                  <button class="btn btn-secondary" onclick="ToolsModule.resetCoinDivination()">
                    <i class="fas fa-redo"></i> 重新起卦
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          <!-- 铜钱起卦说明 -->
          <div class="coin-info-section">
            <div class="info-card">
              <div class="info-icon">
                <i class="fas fa-history"></i>
              </div>
              <h4>铜钱起卦法</h4>
              <p>源于西汉，以三枚铜钱摇掷六次，观其正反组合而定卦象。正面为阳，反面为阴，三钱同面为老阴老阳，混合为少阴少阳。</p>
            </div>
            <div class="info-legend">
              <div class="legend-item">
                <span class="legend-sign">☰</span>
                <span class="legend-text">三正 - 老阳（变爻）</span>
              </div>
              <div class="legend-item">
                <span class="legend-sign">☰</span>
                <span class="legend-text">二正一反 - 少阳</span>
              </div>
              <div class="legend-item">
                <span class="legend-sign">☷</span>
                <span class="legend-text">一正二反 - 少阴</span>
              </div>
              <div class="legend-item">
                <span class="legend-sign">☷</span>
                <span class="legend-text">三反 - 老阴（变爻）</span>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 数字起卦 -->
        <div class="tool-panel hidden" id="panel-number">
          <div class="number-divination-area">
            <div class="number-input-wrapper">
              <div class="number-header">
                <i class="fas fa-calculator"></i>
                <h3>梅花易数 · 数字起卦</h3>
                <p>输入任意两个数字，按梅花易数之法起卦</p>
              </div>
              <div class="number-inputs">
                <div class="input-group">
                  <label>上卦之数</label>
                  <input type="number" id="numInput1" min="1" max="999" placeholder="第一数" class="num-input">
                </div>
                <span class="num-divider">⊕</span>
                <div class="input-group">
                  <label>下卦之数</label>
                  <input type="number" id="numInput2" min="1" max="999" placeholder="第二数" class="num-input">
                </div>
              </div>
              <div class="number-hint">留空则随机生成，数字除以8余数定卦</div>
            </div>
            
            <button class="btn btn-primary btn-lg" onclick="ToolsModule.divineByNumber()">
              <i class="fas fa-magic"></i> 开始起卦
            </button>
          </div>
          
          <div class="tool-result hidden" id="numberResult">
            <div class="hexagram-result-card">
              <div class="result-header">
                <div class="result-symbol-container">
                  <span class="hexagram-symbol" id="numSymbol"></span>
                </div>
                <div class="result-info">
                  <h3 id="numName"></h3>
                  <p id="numType"></p>
                </div>
              </div>
              <div class="result-lines-container">
                <div class="hexagram-lines-box" id="numLines"></div>
              </div>
              <div class="result-text-container">
                <div class="hexagram-text" id="numText"></div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 时间起卦 -->
        <div class="tool-panel hidden" id="panel-time">
          <div class="time-divination-area">
            <div class="time-display-wrapper">
              <div class="time-header">
                <i class="fas fa-clock"></i>
                <h3>梅花易数 · 时间起卦</h3>
              </div>
              <div class="time-current-box">
                <div class="time-label">当前时间</div>
                <div class="current-time" id="currentTime">${new Date().toLocaleString('zh-CN')}</div>
              </div>
              <div class="time-formula">
                <div class="formula-item">
                  <span class="formula-label">月</span>
                  <span class="formula-value">${new Date().getMonth() + 1}</span>
                </div>
                <span class="formula-op">+</span>
                <div class="formula-item">
                  <span class="formula-label">日</span>
                  <span class="formula-value">${new Date().getDate()}</span>
                </div>
                <span class="formula-op">= 上卦</span>
              </div>
            </div>
            
            <button class="btn btn-primary btn-lg" onclick="ToolsModule.divineByTime()">
              <i class="fas fa-magic"></i> 以此时间起卦
            </button>
          </div>
          
          <div class="tool-result hidden" id="timeResult">
            <div class="hexagram-result-card">
              <div class="result-header">
                <div class="result-symbol-container">
                  <span class="hexagram-symbol" id="timeSymbol"></span>
                </div>
                <div class="result-info">
                  <h3 id="timeName"></h3>
                  <p id="timeType"></p>
                </div>
              </div>
              <div class="result-lines-container">
                <div class="hexagram-lines-box" id="timeLines"></div>
              </div>
              <div class="result-text-container">
                <div class="hexagram-text" id="timeText"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
    
    this.addStyles();
  },
  
  switchTab(tab) {
    document.querySelectorAll('.tools-tabs .tab').forEach(t => t.classList.remove('active'));
    document.querySelector(`.tab[data-tab="${tab}"]`).classList.add('active');
    
    document.querySelectorAll('.tool-panel').forEach(p => p.classList.add('hidden'));
    document.getElementById(`panel-${tab}`).classList.remove('hidden');
  },
  
  resetCoinDivination() {
    this.state = { rounds: 0, results: [], hexagram: null, shaking: false };
    document.getElementById('coinResult').classList.add('hidden');
    document.getElementById('roundNum').textContent = '0';
    document.getElementById('coinProgressBar').style.width = '0%';
    document.getElementById('accumulatedLines').innerHTML = '';
    document.getElementById('coinResultText').textContent = '';
    document.getElementById('shakeBtn').disabled = false;
    document.getElementById('shakeBtn').innerHTML = '<i class="fas fa-hand-sparkles"></i><span>摇动铜钱</span><span class="round-indicator">第 <span id="roundNum">0</span>/6 次</span>';
    
    document.querySelectorAll('.coin-3d').forEach(coin => {
      coin.classList.remove('flipped', 'shaking');
      coin.style.transform = '';
    });
  },
  
  shakeCoins() {
    if (this.state.shaking || this.state.rounds >= 6) return;
    
    this.state.shaking = true;
    const shakeBtn = document.getElementById('shakeBtn');
    shakeBtn.disabled = true;
    
    // 铜钱摇晃动画
    const coins = document.querySelectorAll('.coin-3d');
    coins.forEach(coin => {
      coin.classList.remove('flipped');
      coin.classList.add('shaking');
    });
    
    // 1秒后停止摇晃，显示结果
    setTimeout(() => {
      coins.forEach(coin => {
        coin.classList.remove('shaking');
      });
      
      // 随机结果
      const coinResults = [];
      coins.forEach(coin => {
        const isFront = Math.random() > 0.5;
        if (!isFront) {
          coin.classList.add('flipped');
        }
        coinResults.push(isFront);
      });
      
      // 计算爻
      const frontCount = coinResults.filter(r => r).length;
      let lineType, lineName;
      
      if (frontCount === 3) {
        lineType = 'yang'; lineName = '老阳（三正面）';
      } else if (frontCount === 2) {
        lineType = 'yang'; lineName = '少阳（二正一反）';
      } else if (frontCount === 1) {
        lineType = 'yin'; lineName = '少阴（一正二反）';
      } else {
        lineType = 'yin'; lineName = '老阴（三反面）';
      }
      
      this.state.results.push(lineType);
      this.state.rounds++;
      
      // 更新UI
      document.getElementById('roundNum').textContent = this.state.rounds;
      document.getElementById('coinProgressBar').style.width = `${(this.state.rounds / 6) * 100}%`;
      
      document.getElementById('coinResultText').innerHTML = 
        `<span class="round-result-label">第${this.state.rounds}次：</span><span class="round-result-value">${lineName}</span>`;
      
      // 显示累积爻线（从下到上）
      this.showAccumulatedLines();
      
      // 6次后得卦
      if (this.state.rounds >= 6) {
        shakeBtn.disabled = true;
        shakeBtn.innerHTML = '<i class="fas fa-check"></i><span>起卦完成</span>';
        setTimeout(() => this.getHexagramFromLines(), 800);
      } else {
        shakeBtn.disabled = false;
      }
      
      this.state.shaking = false;
    }, 1000);
  },
  
  showAccumulatedLines() {
    const container = document.getElementById('accumulatedLines');
    const reversed = [...this.state.results].reverse(); // 从上到下显示
    container.innerHTML = reversed.map((line, i) => {
      const fromBottom = this.state.rounds - i;
      return `<div class="mini-line-row">
        <span class="line-label">${fromBottom}</span>
        <div class="mini-line ${line}"></div>
      </div>`;
    }).join('');
  },
  
  getHexagramFromLines() {
    const lines = this.state.results;
    
    // 精确匹配全部64卦
    let matched = HEXAGRAMS.find(h => {
      return h.lines.every((l, i) => l === lines[i]);
    });
    
    // 未精确匹配则随机取一个
    if (!matched) {
      matched = HEXAGRAMS[Math.floor(Math.random() * HEXAGRAMS.length)];
    }
    
    this.state.hexagram = matched;
    this.showResult('coin', matched);
  },
  
  divineByNumber() {
    const num1 = parseInt(document.getElementById('numInput1').value) || Math.floor(Math.random() * 999) + 1;
    const num2 = parseInt(document.getElementById('numInput2').value) || Math.floor(Math.random() * 999) + 1;
    
    // 梅花易数起卦法：上卦 = num1 % 8, 下卦 = num2 % 8
    const upperIdx = (num1 - 1) % 8;
    const lowerIdx = (num2 - 1) % 8;
    
    const trigramNames = ['乾', '兑', '离', '震', '巽', '坎', '艮', '坤'];
    const upperName = trigramNames[upperIdx];
    const lowerName = trigramNames[lowerIdx];
    
    // 匹配卦象
    let matched = HEXAGRAMS.find(h => 
      h.upperTrigram === upperName && h.lowerTrigram === lowerName
    );
    
    // 未匹配到则随机取一个
    if (!matched) {
      matched = HEXAGRAMS[Math.floor(Math.random() * HEXAGRAMS.length)];
    }
    
    this.showResult('number', matched);
  },
  
  divineByTime() {
    const now = new Date();
    const month = now.getMonth() + 1;
    const day = now.getDate();
    const hour = now.getHours();
    
    // 梅花易数时间起卦法
    const upperIdx = (month + day) % 8;
    const lowerIdx = (month + day + hour) % 8;
    
    const trigramNames = ['乾', '兑', '离', '震', '巽', '坎', '艮', '坤'];
    const upperName = trigramNames[upperIdx];
    const lowerName = trigramNames[lowerIdx];
    
    let matched = HEXAGRAMS.find(h => 
      h.upperTrigram === upperName && h.lowerTrigram === lowerName
    );
    
    if (!matched) {
      matched = HEXAGRAMS[Math.floor(Math.random() * HEXAGRAMS.length)];
    }
    
    this.showResult('time', matched);
  },
  
  showResult(type, hex) {
    // ID映射：type前缀 -> HTML中的实际ID前缀
    const idMap = { coin: 'tool', number: 'num', time: 'time' };
    const prefix = idMap[type] || type;
    
    const resultEl = document.getElementById(`${type}Result`);
    if (!resultEl) return;
    resultEl.classList.remove('hidden');
    
    document.getElementById(`${prefix}Symbol`).textContent = hex.symbol;
    document.getElementById(`${prefix}Name`).textContent = hex.name + '卦';
    document.getElementById(`${prefix}Type`).textContent = hex.fullName + ' · ' + hex.nature;
    
    // 安全获取卦辞翻译
    const translation = (hex.text && hex.text.guaTranslation) 
      ? hex.text.guaTranslation 
      : hex.description;
    document.getElementById(`${prefix}Text`).textContent = translation;
    
    // 绘制爻线
    const linesEl = document.getElementById(`${prefix}Lines`);
    linesEl.innerHTML = '';
    hex.lines.forEach(line => {
      const lineEl = document.createElement('div');
      lineEl.className = `hexagram-line ${line}`;
      linesEl.appendChild(lineEl);
    });
    
    // 滚动到结果
    resultEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  },
  
  addStyles() {
    const styles = `
      /* === 起卦工具页面整体布局 === */
      .tools-page-wrapper {
        max-width: 900px;
        margin: 0 auto;
        padding-bottom: 40px;
      }
      
      /* === 标题区域 === */
      .tools-header-section {
        position: relative;
        height: 160px;
        margin-bottom: 32px;
        border-radius: var(--radius-xl);
        overflow: hidden;
      }
      
      .tools-header-decoration {
        position: absolute;
        inset: 0;
      }
      
      .tools-header-bg {
        width: 100%;
        height: 100%;
        object-fit: cover;
        opacity: 0.25;
        filter: blur(2px);
      }
      
      .tools-header-overlay {
        position: absolute;
        inset: 0;
        background: linear-gradient(135deg, rgba(26, 21, 16, 0.9) 0%, rgba(107, 68, 35, 0.75) 100%);
      }
      
      .tools-header-content {
        position: relative;
        z-index: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 100%;
        text-align: center;
      }
      
      .tools-main-title {
        font-family: var(--font-title);
        font-size: 2.2rem;
        color: var(--color-primary);
        letter-spacing: 0.25em;
        margin-bottom: 10px;
        text-shadow: 0 2px 20px rgba(201, 162, 39, 0.3);
      }
      
      .tools-subtitle {
        font-size: 0.95rem;
        color: var(--color-text-light);
        opacity: 0.8;
      }
      
      /* === 标签栏 === */
      .tools-tabs-container {
        margin-bottom: 32px;
      }
      
      .tools-tabs {
        display: flex;
        gap: 12px;
        justify-content: center;
        flex-wrap: wrap;
      }
      
      .tools-tabs .tab {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 14px 24px;
        background: var(--color-bg-card);
        border: 2px solid var(--color-border);
        border-radius: var(--radius-lg);
        color: var(--color-text);
        font-size: 0.95rem;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.35s;
      }
      
      .tools-tabs .tab i {
        color: var(--color-primary);
        opacity: 0.7;
        transition: opacity 0.3s;
      }
      
      .tools-tabs .tab:hover {
        border-color: var(--color-primary);
        box-shadow: 0 4px 15px rgba(201, 162, 39, 0.15);
      }
      
      .tools-tabs .tab:hover i {
        opacity: 1;
      }
      
      .tools-tabs .tab.active {
        background: linear-gradient(135deg, rgba(201, 162, 39, 0.15) 0%, rgba(201, 162, 39, 0.05) 100%);
        border-color: var(--color-primary);
        color: var(--color-primary);
      }
      
      .tools-tabs .tab.active i {
        opacity: 1;
      }
      
      /* === 铜钱起卦区域 === */
      .coin-divination-area {
        position: relative;
        margin-bottom: 32px;
        border-radius: var(--radius-xl);
        overflow: hidden;
      }
      
      .coin-bg-wrapper {
        position: relative;
        height: 400px;
      }
      
      .coin-bg-image {
        width: 100%;
        height: 100%;
        object-fit: cover;
        opacity: 0.2;
        filter: blur(3px) contrast(1.1);
      }
      
      .coin-bg-overlay {
        position: absolute;
        inset: 0;
        background: linear-gradient(180deg, 
          rgba(26, 21, 16, 0.75) 0%, 
          rgba(26, 21, 16, 0.6) 50%, 
          rgba(26, 21, 16, 0.85) 100%);
      }
      
      .coin-pattern-overlay {
        position: absolute;
        inset: 0;
        background: radial-gradient(circle at center, transparent 30%, rgba(201, 162, 39, 0.08) 70%);
        pointer-events: none;
      }
      
      /* === 铜钱舞台 === */
      .coin-stage {
        position: absolute;
        inset: 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        z-index: 1;
      }
      
      .coin-table {
        position: relative;
        width: 280px;
        height: 180px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
      }
      
      /* 桌面装饰 */
      .table-decoration {
        position: absolute;
        inset: -20px;
        pointer-events: none;
      }
      
      .decoration-circle.outer {
        position: absolute;
        inset: 0;
        border: 1px solid rgba(201, 162, 39, 0.3);
        border-radius: 50%;
        animation: rotateCircle 20s linear infinite;
      }
      
      .decoration-circle.inner {
        position: absolute;
        inset: 30px;
        border: 1px solid rgba(201, 162, 39, 0.2);
        border-radius: 50%;
        animation: rotateCircle 15s linear infinite reverse;
      }
      
      @keyframes rotateCircle {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
      
      .decoration-lines {
        position: absolute;
        inset: 0;
        background: repeating-conic-gradient(
          from 0deg,
          transparent 0deg 22.5deg,
          rgba(201, 162, 39, 0.1) 22.5deg 45deg
        );
        border-radius: 50%;
      }
      
      /* === 铜钱显示 === */
      .coins-display {
        display: flex;
        gap: 24px;
        justify-content: center;
        perspective: 800px;
      }
      
      .coin-slot {
        width: 70px;
        height: 70px;
      }
      
      .coin-3d {
        width: 100%;
        height: 100%;
        position: relative;
        transform-style: preserve-3d;
        transition: transform 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        border-radius: 50%;
      }
      
      .coin-3d.flipped {
        transform: rotateY(180deg);
      }
      
      .coin-3d.shaking {
        animation: coinShake 0.5s ease-in-out infinite;
      }
      
      @keyframes coinShake {
        0%, 100% { transform: rotateY(0deg) rotateZ(-5deg) translateY(-5px); }
        25% { transform: rotateY(10deg) rotateZ(5deg) translateY(-15px); }
        50% { transform: rotateY(20deg) rotateZ(-3deg) translateY(-20px); }
        75% { transform: rotateY(-10deg) rotateZ(3deg) translateY(-10px); }
      }
      
      .coin-face {
        position: absolute;
        width: 100%;
        height: 100%;
        border-radius: 50%;
        backface-visibility: hidden;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        border: 3px solid var(--color-primary);
        box-shadow: 
          0 4px 20px rgba(201, 162, 39, 0.3),
          inset 0 0 15px rgba(201, 162, 39, 0.2);
      }
      
      .coin-front {
        background: linear-gradient(135deg, #D4A84B 0%, #B8860B 50%, #8B6914 100%);
        color: #1A1510;
      }
      
      .coin-text {
        font-family: var(--font-title);
        font-size: 0.85rem;
        font-weight: 700;
        letter-spacing: 0.05em;
      }
      
      .coin-text-small {
        font-family: var(--font-title);
        font-size: 0.65rem;
        font-weight: 600;
      }
      
      .coin-back {
        background: linear-gradient(135deg, #2A2015 0%, #1A1510 50%, #2A2015 100%);
        transform: rotateY(180deg);
        border-color: rgba(201, 162, 39, 0.5);
      }
      
      .coin-square-hole {
        width: 18px;
        height: 18px;
        background: transparent;
        border: 2px solid var(--color-primary);
        transform: rotate(45deg);
      }
      
      .coin-back-pattern {
        position: absolute;
        inset: 8px;
        border: 1px solid rgba(201, 162, 39, 0.3);
        border-radius: 50%;
      }
      
      .coin-result-text {
        margin-top: 20px;
        padding: 8px 16px;
        background: rgba(26, 21, 16, 0.8);
        border-radius: var(--radius-md);
        border: 1px solid var(--color-primary);
        font-size: 0.9rem;
        color: var(--color-text);
      }
      
      .round-result-label {
        color: var(--color-primary);
        font-weight: 600;
      }
      
      .round-result-value {
        color: var(--color-text-light);
      }
      
      /* === 操作按钮 === */
      .coin-action-area {
        margin-top: 24px;
      }
      
      .coin-shake-btn {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 16px 32px;
        font-size: 1rem;
      }
      
      .coin-shake-btn i {
        animation: sparkle 1.5s ease-in-out infinite;
      }
      
      @keyframes sparkle {
        0%, 100% { transform: scale(1); opacity: 1; }
        50% { transform: scale(1.2); opacity: 0.8; }
      }
      
      .round-indicator {
        font-size: 0.85rem;
        opacity: 0.9;
      }
      
      /* === 进度区域 === */
      .coin-progress-area {
        padding: 20px;
        background: var(--color-bg-card);
        border-radius: var(--radius-lg);
        margin: 0 20px;
        border: 1px solid var(--color-border);
      }
      
      .progress-container {
        margin-bottom: 16px;
      }
      
      .progress-label {
        font-size: 0.85rem;
        color: var(--color-text-muted);
        margin-bottom: 8px;
      }
      
      .progress-bar {
        height: 10px;
        background: var(--color-bg);
        border-radius: 5px;
        overflow: hidden;
        position: relative;
      }
      
      .progress-fill {
        height: 100%;
        background: linear-gradient(90deg, var(--color-primary), var(--color-secondary));
        border-radius: 5px;
        transition: width 0.5s ease;
        position: relative;
      }
      
      .progress-glow {
        position: absolute;
        right: 0;
        top: 50%;
        transform: translateY(-50%);
        width: 20px;
        height: 20px;
        background: var(--color-primary);
        border-radius: 50%;
        filter: blur(8px);
        opacity: 0.6;
      }
      
      .accumulated-lines {
        display: flex;
        flex-direction: column;
        gap: 6px;
        align-items: center;
      }
      
      .mini-line-row {
        display: flex;
        align-items: center;
        gap: 12px;
      }
      
      .line-label {
        font-size: 0.75rem;
        color: var(--color-primary);
        width: 20px;
        text-align: center;
        font-weight: 600;
      }
      
      .mini-line {
        width: 60px;
        height: 6px;
        background: var(--color-primary);
        border-radius: 2px;
      }
      
      .mini-line.yin {
        background: transparent;
        position: relative;
      }
      
      .mini-line.yin::before,
      .mini-line.yin::after {
        content: '';
        position: absolute;
        width: 26px;
        height: 100%;
        background: var(--color-primary);
        border-radius: 2px;
      }
      
      .mini-line.yin::before { left: 0; }
      .mini-line.yin::after { right: 0; }
      
      /* === 结果卡片 === */
      .hexagram-result-card {
        background: var(--color-bg-card);
        border: 2px solid var(--color-primary);
        border-radius: var(--radius-xl);
        padding: 28px;
        margin: 20px;
        box-shadow: 0 10px 40px rgba(201, 162, 39, 0.2);
      }
      
      .result-header {
        display: flex;
        align-items: center;
        gap: 24px;
        margin-bottom: 20px;
      }
      
      .result-symbol-container {
        width: 80px;
        height: 80px;
        background: linear-gradient(135deg, var(--color-bg-dark) 0%, rgba(26, 21, 16, 0.8) 100%);
        border-radius: var(--radius-lg);
        display: flex;
        align-items: center;
        justify-content: center;
        border: 2px solid var(--color-primary);
      }
      
      .result-symbol-container .hexagram-symbol {
        font-size: 2.5rem;
        color: var(--color-primary);
        text-shadow: 0 0 20px rgba(201, 162, 39, 0.5);
      }
      
      .result-info h3 {
        color: var(--color-secondary);
        font-size: 1.4rem;
        font-family: var(--font-title);
        margin-bottom: 6px;
      }
      
      .result-info p {
        color: var(--color-text-muted);
        font-size: 0.95rem;
      }
      
      .result-lines-container {
        margin-bottom: 20px;
      }
      
      .hexagram-lines-box {
        display: flex;
        flex-direction: column;
        gap: 8px;
        max-width: 120px;
        margin: 0 auto;
        padding: 16px;
        background: var(--color-bg-dark);
        border-radius: var(--radius-md);
        border: 1px solid var(--color-primary);
      }
      
      .hexagram-lines-box .hexagram-line {
        height: 12px;
        background: var(--color-primary);
        border-radius: 3px;
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
        width: 45px;
        height: 100%;
        background: var(--color-primary);
        border-radius: 3px;
        box-shadow: 0 0 8px rgba(201, 162, 39, 0.3);
      }
      
      .hexagram-lines-box .hexagram-line.yin::before { left: 0; }
      .hexagram-lines-box .hexagram-line.yin::after { right: 0; }
      
      .result-text-container {
        padding: 16px;
        background: var(--color-bg);
        border-radius: var(--radius-md);
        margin-bottom: 20px;
      }
      
      .hexagram-text {
        color: var(--color-text-light);
        font-size: 0.95rem;
        line-height: 1.8;
      }
      
      .result-actions {
        text-align: center;
      }
      
      /* === 铜钱说明区域 === */
      .coin-info-section {
        display: flex;
        gap: 20px;
        margin: 32px 20px;
        flex-wrap: wrap;
      }
      
      .info-card {
        flex: 1;
        min-width: 280px;
        background: var(--color-bg-card);
        border-radius: var(--radius-lg);
        padding: 24px;
        border: 1px solid var(--color-border);
      }
      
      .info-icon {
        width: 44px;
        height: 44px;
        background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
        border-radius: var(--radius-md);
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--color-bg-dark);
        font-size: 1.1rem;
        margin-bottom: 16px;
      }
      
      .info-card h4 {
        color: var(--color-secondary);
        font-size: 1.05rem;
        margin-bottom: 12px;
        font-family: var(--font-title);
      }
      
      .info-card p {
        color: var(--color-text-light);
        font-size: 0.9rem;
        line-height: 1.7;
      }
      
      .info-legend {
        flex: 1;
        min-width: 200px;
        background: var(--color-bg-card);
        border-radius: var(--radius-lg);
        padding: 24px;
        border: 1px solid var(--color-border);
      }
      
      .legend-item {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 10px;
        margin-bottom: 8px;
        background: var(--color-bg);
        border-radius: var(--radius-md);
      }
      
      .legend-sign {
        font-size: 1.2rem;
        color: var(--color-primary);
        width: 30px;
        text-align: center;
      }
      
      .legend-text {
        font-size: 0.85rem;
        color: var(--color-text-light);
      }
      
      /* === 数字起卦区域 === */
      .number-divination-area {
        text-align: center;
        padding: 32px;
      }
      
      .number-input-wrapper {
        background: var(--color-bg-card);
        border-radius: var(--radius-xl);
        padding: 32px;
        margin-bottom: 24px;
        border: 1px solid var(--color-border);
      }
      
      .number-header {
        margin-bottom: 24px;
      }
      
      .number-header i {
        color: var(--color-primary);
        font-size: 1.5rem;
        margin-bottom: 12px;
      }
      
      .number-header h3 {
        color: var(--color-secondary);
        font-size: 1.3rem;
        margin-bottom: 8px;
        font-family: var(--font-title);
      }
      
      .number-header p {
        color: var(--color-text-muted);
        font-size: 0.9rem;
      }
      
      .number-inputs {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 16px;
        flex-wrap: wrap;
      }
      
      .input-group {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      
      .input-group label {
        font-size: 0.85rem;
        color: var(--color-text-muted);
      }
      
      .num-input {
        width: 120px;
        padding: 14px 16px;
        border: 2px solid var(--color-border);
        border-radius: var(--radius-md);
        font-size: 1.1rem;
        text-align: center;
        background: var(--color-bg);
        color: var(--color-text);
        transition: all 0.3s;
      }
      
      .num-input:focus {
        outline: none;
        border-color: var(--color-primary);
        box-shadow: 0 0 15px rgba(201, 162, 39, 0.2);
      }
      
      .num-divider {
        font-size: 1.5rem;
        color: var(--color-primary);
        font-weight: 600;
      }
      
      .number-hint {
        margin-top: 16px;
        font-size: 0.8rem;
        color: var(--color-text-muted);
      }
      
      /* === 时间起卦区域 === */
      .time-divination-area {
        text-align: center;
        padding: 32px;
      }
      
      .time-display-wrapper {
        background: var(--color-bg-card);
        border-radius: var(--radius-xl);
        padding: 32px;
        margin-bottom: 24px;
        border: 1px solid var(--color-border);
      }
      
      .time-header {
        margin-bottom: 24px;
      }
      
      .time-header i {
        color: var(--color-primary);
        font-size: 1.5rem;
        margin-bottom: 12px;
      }
      
      .time-header h3 {
        color: var(--color-secondary);
        font-size: 1.3rem;
        font-family: var(--font-title);
      }
      
      .time-current-box {
        padding: 20px;
        background: linear-gradient(135deg, var(--color-bg) 0%, rgba(201, 162, 39, 0.05) 100%);
        border-radius: var(--radius-lg);
        margin-bottom: 20px;
        border: 1px solid rgba(201, 162, 39, 0.2);
      }
      
      .time-label {
        font-size: 0.85rem;
        color: var(--color-text-muted);
        margin-bottom: 8px;
      }
      
      .current-time {
        font-size: 1.1rem;
        color: var(--color-text);
        font-weight: 500;
      }
      
      .time-formula {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 12px;
        flex-wrap: wrap;
      }
      
      .formula-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 12px 16px;
        background: var(--color-bg);
        border-radius: var(--radius-md);
        min-width: 50px;
      }
      
      .formula-label {
        font-size: 0.75rem;
        color: var(--color-text-muted);
      }
      
      .formula-value {
        font-size: 1.1rem;
        color: var(--color-primary);
        font-weight: 600;
      }
      
      .formula-op {
        font-size: 0.9rem;
        color: var(--color-text-muted);
      }
      
      /* === 响应式 === */
      @media (max-width: 768px) {
        .tools-header-section {
          height: 120px;
        }
        
        .tools-main-title {
          font-size: 1.8rem;
        }
        
        .tools-tabs .tab {
          padding: 12px 18px;
          font-size: 0.85rem;
        }
        
        .coin-bg-wrapper {
          height: 350px;
        }
        
        .coins-display {
          gap: 16px;
        }
        
        .coin-slot {
          width: 55px;
          height: 55px;
        }
        
        .coin-text {
          font-size: 0.7rem;
        }
        
        .coin-text-small {
          font-size: 0.55rem;
        }
        
        .coin-square-hole {
          width: 14px;
          height: 14px;
        }
        
        .coin-info-section {
          flex-direction: column;
        }
        
        .info-card, .info-legend {
          min-width: 100%;
        }
        
        .number-inputs {
          flex-direction: column;
        }
        
        .num-divider {
          transform: rotate(90deg);
        }
      }
    `;
    
    if (!document.getElementById('tools-styles')) {
      const styleSheet = document.createElement('style');
      styleSheet.id = 'tools-styles';
      styleSheet.textContent = styles;
      document.head.appendChild(styleSheet);
    }
  }
};