const App = {
  currentPage: 'home',
  currentCategory: 'student',
  currentLevel: 'cet4',
  currentNovel: null,
  readingProgress: {},
  wordBank: {},
  customNovels: [],

  init() {
    this.loadData();
    this.bindEvents();
    this.renderHome();
    this.updateNav();
  },

  loadData() {
    const progress = localStorage.getItem('readingProgress');
    if (progress) this.readingProgress = JSON.parse(progress);
    
    const custom = localStorage.getItem('customNovels');
    if (custom) this.customNovels = JSON.parse(custom);
    
    const savedLevel = localStorage.getItem('currentLevel');
    if (savedLevel) this.currentLevel = savedLevel;
  },

  saveData() {
    localStorage.setItem('readingProgress', JSON.stringify(this.readingProgress));
    localStorage.setItem('customNovels', JSON.stringify(this.customNovels));
    localStorage.setItem('currentLevel', this.currentLevel);
  },

  bindEvents() {
    document.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', (e) => {
        const page = e.currentTarget.dataset.page;
        this.navigateTo(page);
      });
    });

    document.addEventListener('click', (e) => {
      const enWord = e.target.closest('.en-word');
      if (enWord) {
        this.showWordDetail(enWord.dataset.en, enWord.dataset.cn);
        return;
      }
      
      const novelCard = e.target.closest('.novel-card');
      if (novelCard) {
        const novelId = novelCard.dataset.id;
        const catId = novelCard.dataset.cat;
        this.readNovel(novelId, catId);
        return;
      }
      
      const backBtn = e.target.closest('.back-btn');
      if (backBtn) {
        this.goBack();
        return;
      }
      
      const categoryChip = e.target.closest('.category-chip');
      if (categoryChip) {
        this.selectCategory(categoryChip.dataset.cat);
        return;
      }
      
      const levelChip = e.target.closest('.level-chip');
      if (levelChip) {
        this.selectLevel(levelChip.dataset.level);
        return;
      }
      
      const closeModal = e.target.closest('.close-modal');
      if (closeModal) {
        this.closeModal();
        return;
      }
      
      const addWordBtn = e.target.closest('.add-word-btn');
      if (addWordBtn) {
        this.addToWordBank(addWordBtn.dataset.en, addWordBtn.dataset.cn);
        return;
      }
      
      if (e.target.closest('#word-modal') && !e.target.closest('.modal-content')) {
        this.closeModal();
      }
    });
  },

  navigateTo(page) {
    this.currentPage = page;
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    
    document.getElementById(`page-${page}`)?.classList.add('active');
    document.querySelector(`.nav-item[data-page="${page}"]`)?.classList.add('active');
    
    if (page === 'home') this.renderHome();
    if (page === 'words') this.renderWordBank();
    if (page === 'profile') this.renderProfile();
    
    window.scrollTo(0, 0);
  },

  updateNav() {
    document.querySelectorAll('.nav-item').forEach(n => {
      n.classList.toggle('active', n.dataset.page === this.currentPage);
    });
  },

  renderHome() {
    const homePage = document.getElementById('page-home');
    if (!homePage) return;
    
    homePage.innerHTML = `
      <div class="header">
        <h1 class="app-title">📖 爽文英语</h1>
        <p class="app-subtitle">在爽文中轻松学英语</p>
      </div>
      
      <div class="section">
        <h2 class="section-title">选择类目</h2>
        <div class="category-grid">
          ${NOVEL_DATA.categories.map(cat => `
            <div class="category-card ${cat.id === 'custom' && this.customNovels.length === 0 ? 'empty' : ''}" 
                 data-cat="${cat.id}" onclick="App.selectCategory('${cat.id}')">
              <span class="category-icon">${cat.icon}</span>
              <span class="category-name">${cat.name}</span>
            </div>
          `).join('')}
        </div>
      </div>
      
      <div class="section">
        <h2 class="section-title">英语等级</h2>
        <div class="level-chips">
          ${NOVEL_DATA.levels.map(lvl => `
            <span class="level-chip ${lvl.id === this.currentLevel ? 'active' : ''}" data-level="${lvl.id}">
              ${lvl.name}
            </span>
          `).join('')}
        </div>
      </div>
      
      <div class="section">
        <h2 class="section-title">热门爽文</h2>
        <div class="novel-list">
          ${this.getHotNovels().map(n => this.renderNovelCard(n, n._cat)).join('')}
        </div>
      </div>
    `;
  },

  getHotNovels() {
    const novels = [];
    Object.keys(NOVEL_DATA.novels).forEach(cat => {
      NOVEL_DATA.novels[cat].forEach(n => {
        novels.push({...n, _cat: cat});
      });
    });
    this.customNovels.forEach((n, i) => {
      novels.push({...n, _cat: 'custom', id: `custom_${i}`});
    });
    return novels.slice(0, 6);
  },

  renderNovelCard(novel, catId) {
    const progress = this.readingProgress[novel.id] || 0;
    return `
      <div class="novel-card" data-id="${novel.id}" data-cat="${catId}">
        <div class="novel-info">
          <h3 class="novel-title">${novel.title}</h3>
          <p class="novel-author">${novel.author}</p>
          <p class="novel-summary">${novel.summary}</p>
          <div class="novel-tags">
            ${novel.tags.map(t => `<span class="tag">${t}</span>`).join('')}
          </div>
          ${progress > 0 ? `<div class="progress-bar"><div class="progress-fill" style="width:${progress}%"></div></div>` : ''}
        </div>
      </div>
    `;
  },

  selectCategory(catId) {
    this.currentCategory = catId;
    if (catId === 'custom') {
      this.renderCustomPage();
      return;
    }
    this.renderNovelList(catId);
  },

  renderNovelList(catId) {
    const homePage = document.getElementById('page-home');
    const novels = NOVEL_DATA.novels[catId] || [];
    const catInfo = NOVEL_DATA.categories.find(c => c.id === catId);
    
    homePage.innerHTML = `
      <div class="page-header">
        <button class="back-btn">← 返回</button>
        <h2>${catInfo?.icon || ''} ${catInfo?.name || ''}爽文</h2>
      </div>
      <div class="novel-list-full">
        ${novels.map(n => this.renderNovelCard(n, catId)).join('')}
      </div>
    `;
  },

  renderCustomPage() {
    const homePage = document.getElementById('page-home');
    homePage.innerHTML = `
      <div class="page-header">
        <button class="back-btn">← 返回</button>
        <h2>✨ 自定义爽文</h2>
      </div>
      <div class="custom-upload">
        <div class="upload-area" onclick="document.getElementById('fileInput').click()">
          <div class="upload-icon">📤</div>
          <p>点击上传.txt文件</p>
          <p class="upload-hint">支持纯文本格式，自动识别内容</p>
        </div>
        <input type="file" id="fileInput" accept=".txt" style="display:none">
        <div class="manual-input">
          <h3>或手动输入</h3>
          <input type="text" id="customTitle" placeholder="输入标题" class="input-field">
          <input type="text" id="customAuthor" placeholder="输入作者" class="input-field">
          <textarea id="customContent" placeholder="粘贴文章内容..." class="textarea-field"></textarea>
          <button class="btn-primary" onclick="App.saveCustomNovel()">保存并阅读</button>
        </div>
      </div>
      ${this.customNovels.length > 0 ? `
        <div class="section">
          <h3 class="section-title">我的上传</h3>
          <div class="novel-list">
            ${this.customNovels.map((n, i) => this.renderNovelCard({...n, id: `custom_${i}`}, 'custom')).join('')}
          </div>
        </div>
      ` : ''}
    `;
    
    const fileInput = document.getElementById('fileInput');
    if (fileInput) {
      fileInput.addEventListener('change', (e) => this.handleFileUpload(e));
    }
  },

  handleFileUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target.result;
      const novel = {
        title: file.name.replace('.txt', ''),
        author: '未知',
        summary: content.substring(0, 50) + '...',
        content: content,
        tags: ['自定义']
      };
      this.customNovels.unshift(novel);
      this.saveData();
      this.renderCustomPage();
    };
    reader.readAsText(file);
  },

  saveCustomNovel() {
    const title = document.getElementById('customTitle').value.trim();
    const author = document.getElementById('customAuthor').value.trim();
    const content = document.getElementById('customContent').value.trim();
    
    if (!title || !content) {
      alert('请填写标题和内容');
      return;
    }
    
    const novel = {
      title,
      author: author || '匿名',
      summary: content.substring(0, 50) + '...',
      content,
      tags: ['自定义']
    };
    this.customNovels.unshift(novel);
    this.saveData();
    this.renderCustomPage();
  },

  selectLevel(levelId) {
    this.currentLevel = levelId;
    this.saveData();
    document.querySelectorAll('.level-chip').forEach(chip => {
      chip.classList.toggle('active', chip.dataset.level === levelId);
    });
  },

  readNovel(novelId, catId) {
    let novel;
    if (catId === 'custom' || novelId.startsWith('custom_')) {
      const idx = parseInt(novelId.replace('custom_', ''));
      novel = this.customNovels[idx];
    } else {
      novel = NOVEL_DATA.novels[catId]?.find(n => n.id === novelId);
    }
    
    if (!novel) return;
    this.currentNovel = novel;
    this.renderReader(novel);
  },

  renderReader(novel) {
    const homePage = document.getElementById('page-home');
    const processed = this.processContent(novel.content);
    
    homePage.innerHTML = `
      <div class="reader-header">
        <button class="back-btn">← 返回</button>
        <div class="reader-title">${novel.title}</div>
        <div class="reader-level">${NOVEL_DATA.levels.find(l => l.id === this.currentLevel)?.name}</div>
      </div>
      <div class="reader-content">
        ${processed}
      </div>
      <div class="reader-footer">
        <p>点击高亮英文查看详解，点击⭐收藏生词</p>
      </div>
    `;
    
    window.scrollTo(0, 0);
  },

  processContent(content) {
    const words = WORD_BANK[this.currentLevel] || WORD_BANK.cet4;
    const sentences = content.split(/([。！？\n]+)/);
    let result = '';
    
    for (let i = 0; i < sentences.length; i += 2) {
      let sentence = sentences[i];
      const punct = sentences[i + 1] || '';
      if (!sentence.trim()) continue;
      
      const availableWords = Object.keys(words).filter(w => sentence.includes(w));
      const replaceCount = Math.min(availableWords.length, Math.random() > 0.5 ? 2 : 1);
      const shuffled = availableWords.sort(() => Math.random() - 0.5).slice(0, replaceCount);
      
      shuffled.forEach(cnWord => {
        const wordData = words[cnWord];
        const replacement = `<span class="en-word" data-en="${wordData.en}" data-cn="${cnWord}">${wordData.en}</span><span class="cn-hint">(${cnWord})</span>`;
        sentence = sentence.replace(cnWord, replacement);
      });
      
      result += `<p class="reader-para">${sentence}${punct}</p>`;
    }
    
    return result;
  },

  showWordDetail(en, cn) {
    const data = DERIVATIVE_DATA[en] || { derivatives: [], phrases: [] };
    const modal = document.getElementById('word-modal');
    const modalBody = document.getElementById('modal-body');
    
    const isSaved = (this.wordBank[en] !== undefined);
    
    modalBody.innerHTML = `
      <div class="word-detail">
        <div class="word-header">
          <h2 class="word-en">${en}</h2>
          <span class="word-cn">${cn}</span>
          <button class="add-word-btn ${isSaved ? 'saved' : ''}" data-en="${en}" data-cn="${cn}">
            ${isSaved ? '⭐ 已收藏' : '☆ 收藏'}
          </button>
        </div>
        
        ${data.derivatives.length > 0 ? `
          <div class="word-section">
            <h3>派生词</h3>
            <div class="derivatives-list">
              ${data.derivatives.map(d => `<span class="deriv-tag">${d}</span>`).join('')}
            </div>
          </div>
        ` : ''}
        
        ${data.phrases.length > 0 ? `
          <div class="word-section">
            <h3>常用短语</h3>
            <ul class="phrases-list">
              ${data.phrases.map(p => `<li>${p}</li>`).join('')}
            </ul>
          </div>
        ` : ''}
      </div>
    `;
    
    modal.classList.add('active');
  },

  closeModal() {
    document.getElementById('word-modal')?.classList.remove('active');
  },

  addToWordBank(en, cn) {
    if (this.wordBank[en]) {
      delete this.wordBank[en];
    } else {
      this.wordBank[en] = { en, cn, addedAt: Date.now() };
    }
    this.saveWordBank();
    this.showWordDetail(en, cn);
  },

  saveWordBank() {
    localStorage.setItem('wordBank', JSON.stringify(this.wordBank));
  },

  loadWordBank() {
    const saved = localStorage.getItem('wordBank');
    if (saved) this.wordBank = JSON.parse(saved);
  },

  renderWordBank() {
    this.loadWordBank();
    const words = Object.values(this.wordBank);
    const page = document.getElementById('page-words');
    
    page.innerHTML = `
      <div class="header">
        <h1 class="app-title">📚 生词本</h1>
        <p class="app-subtitle">共收藏 ${words.length} 个单词</p>
      </div>
      
      <div class="word-bank-list">
        ${words.length === 0 ? `
          <div class="empty-state">
            <div class="empty-icon">📝</div>
            <p>还没有收藏生词</p>
            <p class="empty-hint">阅读时点击英文单词即可收藏</p>
          </div>
        ` : words.map(w => `
          <div class="word-bank-item" onclick="App.showWordDetail('${w.en}', '${w.cn}')">
            <div class="word-bank-en">${w.en}</div>
            <div class="word-bank-cn">${w.cn}</div>
            <button class="word-delete" onclick="event.stopPropagation(); App.removeWord('${w.en}')">🗑️</button>
          </div>
        `).join('')}
      </div>
    `;
  },

  removeWord(en) {
    delete this.wordBank[en];
    this.saveWordBank();
    this.renderWordBank();
  },

  renderProfile() {
    const readCount = Object.keys(this.readingProgress).length;
    const wordCount = Object.keys(this.wordBank).length;
    const page = document.getElementById('page-profile');
    
    page.innerHTML = `
      <div class="header">
        <h1 class="app-title">👤 个人中心</h1>
      </div>
      
      <div class="profile-card">
        <div class="profile-avatar">👤</div>
        <div class="profile-name">英语学习者</div>
        <div class="profile-stats">
          <div class="stat-item">
            <div class="stat-value">${readCount}</div>
            <div class="stat-label">已读</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">${wordCount}</div>
            <div class="stat-label">生词</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">${this.customNovels.length}</div>
            <div class="stat-label">上传</div>
          </div>
        </div>
      </div>
      
      <div class="settings-section">
        <h3 class="section-title">设置</h3>
        <div class="setting-item">
          <span>默认英语等级</span>
          <select class="level-select" onchange="App.setDefaultLevel(this.value)">
            ${NOVEL_DATA.levels.map(l => `<option value="${l.id}" ${l.id === this.currentLevel ? 'selected' : ''}>${l.name}</option>`).join('')}
          </select>
        </div>
        <div class="setting-item">
          <span>清除所有数据</span>
          <button class="btn-danger" onclick="App.clearAllData()">清除</button>
        </div>
      </div>
    `;
  },

  setDefaultLevel(level) {
    this.currentLevel = level;
    this.saveData();
  },

  clearAllData() {
    if (confirm('确定要清除所有数据吗？此操作不可恢复。')) {
      localStorage.removeItem('readingProgress');
      localStorage.removeItem('wordBank');
      localStorage.removeItem('customNovels');
      localStorage.removeItem('currentLevel');
      this.readingProgress = {};
      this.wordBank = {};
      this.customNovels = [];
      this.currentLevel = 'cet4';
      this.renderProfile();
    }
  },

  goBack() {
    this.renderHome();
  }
};

document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
