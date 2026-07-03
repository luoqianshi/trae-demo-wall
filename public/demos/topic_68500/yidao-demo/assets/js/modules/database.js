/**
 * 易道 App - 卦象数据库模块
 */

const DatabaseModule = {
  state: {
    searchTerm: '',
    filterElement: '',
    selectedHexagram: null
  },
  
  render() {
    const container = document.getElementById('page-database');
    if (!container) return;
    
    container.innerHTML = `
      <div class="database-container">
        <h2 style="text-align:center;">卦象数据库</h2>
        <p style="text-align:center; color:var(--color-text-muted); margin-bottom:24px;">六十四卦完整收录，支持搜索与筛选</p>
        
        <div class="db-toolbar">
          <div class="search-box">
            <input type="text" id="dbSearch" placeholder="搜索卦名..." onkeyup="DatabaseModule.search()">
          </div>
          <div class="filter-group">
            <select id="filterElement" onchange="DatabaseModule.filter()">
              <option value="">全部五行</option>
              <option value="金">金</option>
              <option value="木">木</option>
              <option value="水">水</option>
              <option value="火">火</option>
              <option value="土">土</option>
            </select>
          </div>
        </div>
        
        <div class="db-grid" id="dbGrid">
          ${this.renderGrid()}
        </div>
        
        <div class="db-detail hidden" id="dbDetail">
          <div class="detail-header">
            <span class="close-btn" onclick="DatabaseModule.closeDetail()">×</span>
            <div class="detail-symbol" id="detailSymbol"></div>
            <h2 id="detailName"></h2>
          </div>
          <div class="detail-body">
            <div class="detail-section">
              <h4>卦辞原文</h4>
              <p class="original-text" id="detailGua"></p>
            </div>
            <div class="detail-section">
              <h4>白话译文</h4>
              <p class="translation" id="detailGuaTrans"></p>
            </div>
            <div class="detail-section">
              <h4>象传</h4>
              <p id="detailXiang"></p>
            </div>
            <div class="detail-section">
              <h4>爻线图</h4>
              <div class="detail-lines" id="detailLines"></div>
            </div>
            <div class="detail-section">
              <h4>现代应用</h4>
              <p id="detailApply"></p>
            </div>
          </div>
        </div>
      </div>
    `;
    
    this.addStyles();
  },
  
  renderGrid(data = null) {
    const hexagrams = data || HEXAGRAMS;
    
    return hexagrams.map(hex => `
      <div class="db-card" onclick="DatabaseModule.openDetail(${hex.id})">
        <div class="db-symbol">${hex.symbol}</div>
        <div class="db-name">${hex.name}</div>
        <div class="db-fullname">${hex.fullName}</div>
      </div>
    `).join('');
  },
  
  search() {
    const term = document.getElementById('dbSearch').value.toLowerCase();
    this.state.searchTerm = term;
    
    const filtered = HEXAGRAMS.filter(h => 
      h.name.toLowerCase().includes(term) || 
      h.fullName.toLowerCase().includes(term)
    );
    
    document.getElementById('dbGrid').innerHTML = this.renderGrid(filtered);
  },
  
  filter() {
    const element = document.getElementById('filterElement').value;
    this.state.filterElement = element;
    
    const filtered = HEXAGRAMS.filter(h => {
      if (!element) return true;
      return h.element === element;
    });
    
    document.getElementById('dbGrid').innerHTML = this.renderGrid(filtered);
  },
  
  openDetail(id) {
    const hex = HEXAGRAMS.find(h => h.id === id);
    if (!hex) return;
    
    this.state.selectedHexagram = hex;
    
    const detail = document.getElementById('dbDetail');
    detail.classList.remove('hidden');
    
    document.getElementById('detailSymbol').textContent = hex.symbol;
    document.getElementById('detailName').textContent = hex.name + '卦';
    
    if (hex.text) {
      document.getElementById('detailGua').textContent = hex.text.gua || '';
      document.getElementById('detailGuaTrans').textContent = hex.text.guaTranslation || '';
      document.getElementById('detailXiang').textContent = (hex.text.xiang || '') + (hex.text.xiangTranslation ? '\n' + hex.text.xiangTranslation : '');
    } else {
      document.getElementById('detailGua').textContent = '暂无卦辞';
      document.getElementById('detailGuaTrans').textContent = hex.description || '';
      document.getElementById('detailXiang').textContent = '暂无象传';
    }
    
    document.getElementById('detailApply').textContent = hex.application || hex.description || '';
    
    // 绘制爻线
    const linesEl = document.getElementById('detailLines');
    linesEl.innerHTML = '';
    hex.lines.forEach(line => {
      const lineEl = document.createElement('div');
      lineEl.className = `hexagram-line ${line}`;
      linesEl.appendChild(lineEl);
    });
  },
  
  closeDetail() {
    document.getElementById('dbDetail').classList.add('hidden');
  },
  
  addStyles() {
    const styles = `
      .database-container {
        max-width: 1000px;
        margin: 0 auto;
      }
      
      .db-toolbar {
        display: flex;
        gap: 16px;
        justify-content: center;
        margin-bottom: 24px;
      }
      
      .search-box input {
        width: 250px;
        padding: 12px;
        border: 1px solid var(--color-border);
        border-radius: var(--radius-md);
        font-size: 1rem;
      }
      
      .filter-group select {
        padding: 12px;
        border: 1px solid var(--color-border);
        border-radius: var(--radius-md);
        background: var(--color-bg);
      }
      
      .db-grid {
        display: grid;
        grid-template-columns: repeat(8, 1fr);
        gap: 12px;
      }
      
      .db-card {
        background: var(--color-bg-card);
        border: 1px solid var(--color-border);
        border-radius: var(--radius-md);
        padding: 12px;
        text-align: center;
        cursor: pointer;
        transition: all 0.3s;
      }
      
      .db-card:hover {
        border-color: var(--color-primary);
        transform: translateY(-2px);
      }
      
      .db-symbol {
        font-size: 1.5rem;
        color: var(--color-primary);
        margin-bottom: 4px;
      }
      
      .db-name {
        font-weight: 600;
        color: var(--color-secondary);
      }
      
      .db-fullname {
        font-size: 0.8rem;
        color: var(--color-text-muted);
      }
      
      .db-detail {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 500px;
        max-height: 80vh;
        background: var(--color-bg);
        border: 2px solid var(--color-primary);
        border-radius: var(--radius-lg);
        box-shadow: var(--shadow-xl);
        z-index: 100;
        overflow-y: auto;
      }
      
      .db-detail.hidden {
        display: none;
      }
      
      .db-detail .detail-header {
        display: flex;
        align-items: center;
        gap: 16px;
        padding: 24px;
        background: var(--color-bg-card);
        border-bottom: 1px solid var(--color-border);
      }
      
      .db-detail .close-btn {
        width: 32px;
        height: 32px;
        background: var(--color-bg);
        border-radius: var(--radius-md);
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
      }
      
      .db-detail .detail-symbol {
        font-size: 2rem;
        color: var(--color-primary);
      }
      
      .db-detail .detail-body {
        padding: 24px;
      }
      
      .db-detail .detail-section {
        margin-bottom: 20px;
      }
      
      .db-detail .detail-section h4 {
        color: var(--color-secondary);
        margin-bottom: 12px;
      }
      
      .db-detail .detail-lines {
        display: flex;
        flex-direction: column;
        gap: 6px;
        background: var(--color-bg-card);
        padding: 16px;
        border-radius: var(--radius-md);
      }
      
      @media (max-width: 768px) {
        .db-grid {
          grid-template-columns: repeat(4, 1fr);
        }
        
        .db-detail {
          width: 90%;
        }
      }
      
      @media (max-width: 480px) {
        .db-grid {
          grid-template-columns: repeat(2, 1fr);
        }
      }
    `;
    
    if (!document.getElementById('database-styles')) {
      const styleSheet = document.createElement('style');
      styleSheet.id = 'database-styles';
      styleSheet.textContent = styles;
      document.head.appendChild(styleSheet);
    }
  }
};