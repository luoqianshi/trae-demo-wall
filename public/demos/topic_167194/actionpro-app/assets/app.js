const App = {
  data: null,
  selectedPrimaryTags: [],
  selectedSecondaryTag: null,
  selectedExercises: [],
  currentCombo: null,

  async init() {
    await this.loadData();
    this.renderNavbar();
    this.initPage();
  },

  async loadData() {
    try {
      const response = await fetch('data/exercises.json');
      if (!response.ok) throw new Error('Failed to load');
      this.data = await response.json();
    } catch (e) {
      const main = document.querySelector('.main-content');
      if (main) {
        main.innerHTML = '<div class="empty-state"><h3>数据加载失败</h3><p>请刷新页面重试</p></div>';
      }
    }
  },

  getExerciseById(id) {
    return this.data?.exercises.find(e => e.id === id);
  },

  getExercisesByTag(primaryTag, secondaryTag = null) {
    if (!this.data) return [];
    if (primaryTag === 'random') return this.data.exercises;
    return this.data.exercises.filter(e => {
      if (e.primaryTag !== primaryTag) return false;
      if (secondaryTag && e.secondaryTag !== secondaryTag) return false;
      return true;
    });
  },

  getSecondaryTagName(id) {
    const tag = this.data?.tags.secondary.find(t => t.id === id);
    return tag ? tag.name : id;
  },

  getPrimaryTagName(id) {
    const tag = this.data?.tags.primary.find(t => t.id === id);
    return tag ? tag.name : id;
  },

  shuffleArray(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  },

  saveGeneratedExercises(exerciseIds) {
    sessionStorage.setItem('actionpro_generated', JSON.stringify(exerciseIds));
  },

  getGeneratedExercises() {
    const data = sessionStorage.getItem('actionpro_generated');
    return data ? JSON.parse(data) : null;
  },

  clearGeneratedExercises() {
    sessionStorage.removeItem('actionpro_generated');
  },

  showConfirm(message) {
    return new Promise((resolve) => {
      const overlay = document.createElement('div');
      overlay.className = 'confirm-overlay';
      overlay.innerHTML = `
        <div class="confirm-dialog">
          <p class="confirm-message">${message}</p>
          <div class="confirm-buttons">
            <button class="btn btn-secondary" id="confirm-cancel">取消</button>
            <button class="btn btn-danger" id="confirm-ok">确定</button>
          </div>
        </div>
      `;
      document.body.appendChild(overlay);

      const cleanup = (result) => {
        overlay.remove();
        resolve(result);
      };

      overlay.querySelector('#confirm-ok').addEventListener('click', () => cleanup(true));
      overlay.querySelector('#confirm-cancel').addEventListener('click', () => cleanup(false));
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) cleanup(false);
      });
    });
  },

  showAlert(message, onOk) {
    const overlay = document.createElement('div');
    overlay.className = 'confirm-overlay';
    overlay.innerHTML = `
      <div class="confirm-dialog">
        <p class="confirm-message">${message}</p>
        <div class="confirm-buttons">
          <button class="btn btn-primary" id="alert-ok">好的</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    overlay.querySelector('#alert-ok').addEventListener('click', () => {
      overlay.remove();
      if (onOk) onOk();
    });
  },

  renderNavbar() {
    const nav = document.querySelector('.navbar');
    if (!nav) return;

    const currentPage = Router.getCurrentPage();
    const navItems = [
      { id: 'index', label: '首页', href: 'index.html' },
      { id: 'library', label: '动作库', href: 'library.html' },
      { id: 'combos', label: '组合', href: 'combos.html' },
      { id: 'upload', label: '上传动作', href: 'upload.html' }
    ];

    nav.innerHTML = `
      <div class="navbar-brand">
        <a href="index.html">ActionPro</a>
      </div>
      <button class="navbar-toggle" id="nav-toggle">☰</button>
      <div class="navbar-links" id="navbar-links">
        ${navItems.map(item => `
          <a href="${item.href}" class="nav-link ${currentPage === item.id ? 'active' : ''}">
            ${item.label}
          </a>
        `).join('')}
      </div>
    `;

    const toggle = document.getElementById('nav-toggle');
    const links = document.getElementById('navbar-links');
    if (toggle) {
      toggle.addEventListener('click', () => {
        links.classList.toggle('show');
      });
    }
  },

  initPage() {
    const page = Router.getCurrentPage();
    const handlers = {
      index: () => this.initIndex(),
      generate: () => this.initGenerate(),
      detail: () => this.initDetail(),
      library: () => this.initLibrary(),
      combos: () => this.initCombos(),
      'combo-detail': () => this.initComboDetail(),
      upload: () => this.initUpload()
    };

    if (handlers[page]) {
      handlers[page]();
    }
  },

  initIndex() {
    this.clearGeneratedExercises();
    const main = document.querySelector('.main-content');
    if (!main || !this.data) return;

    const primaryTags = this.data.tags.primary;
    const secondaryTags = this.data.tags.secondary;

    main.innerHTML = `
      <section class="hero-section">
        <div class="hero-content">
          <h1>ActionPro</h1>
          <p>AI 智能健身动作库</p>
        </div>
      </section>

      <section class="tag-section">
        <h2 class="section-title">选择训练部位</h2>
        <div class="grid grid-auto tag-grid">
          ${primaryTags.map(tag => `
            <div class="tag-card" data-tag="${tag.id}">
              <div class="tag-icon">${this.getTagIcon(tag.id)}</div>
              <h3>${tag.name}</h3>
              <span class="tag-count">${tag.count > 0 ? tag.count + ' 个动作' : '随机推荐'}</span>
            </div>
          `).join('')}
        </div>
      </section>

      <section class="secondary-tag-section">
        <h2 class="section-title">选择训练目标（可选）</h2>
        <div class="secondary-tags">
          <button class="secondary-tag-btn active" data-tag="">全部</button>
          ${secondaryTags.map(tag => `
            <button class="secondary-tag-btn" data-tag="${tag.id}">${tag.name}</button>
          `).join('')}
        </div>
      </section>

      <div class="safety-note">
        <strong>安全提示：</strong>尝试新动作时，请从小重量慢慢开始，确保动作标准。如果感到疼痛，请立即停止。
      </div>

      <div class="action-section">
        <button class="btn btn-primary btn-generate" disabled>生成动作</button>
      </div>

      <section class="quick-links">
        <h3>快速入口</h3>
        <div class="grid grid-2">
          <a href="library.html" class="quick-link-card">
            <div class="quick-link-icon">📚</div>
            <span>我的动作库</span>
          </a>
          <a href="combos.html" class="quick-link-card">
            <div class="quick-link-icon">📋</div>
            <span>我的组合</span>
          </a>
        </div>
      </section>

      <section class="featured-exercises">
        <h2 class="section-title">精选动作</h2>
        <div class="grid grid-auto featured-grid">
          ${this.getFeaturedExercises().map(exercise => `
            <div class="featured-card" data-id="${exercise.id}">
              ${exercise.images ? `
                <img src="${exercise.images.start}" alt="${exercise.name}" loading="lazy">
              ` : `
                <div class="placeholder-image"><div class="placeholder-icon">🏋️</div></div>
              `}
              <div class="featured-info">
                <h4>${exercise.name}</h4>
                <span class="tag tag-primary">${exercise.movementPattern}</span>
              </div>
            </div>
          `).join('')}
        </div>
      </section>

      <section class="tutorial-section">
        <h2 class="section-title">使用教程</h2>
        <div class="tutorial-steps">
          <div class="tutorial-step">
            <div class="step-number">1</div>
            <div class="step-content">
              <h4>选择训练部位</h4>
              <p>在首页选择你想训练的部位，如腿部、上半身或全身核心。</p>
            </div>
          </div>
          <div class="tutorial-step">
            <div class="step-number">2</div>
            <div class="step-content">
              <h4>生成动作</h4>
              <p>点击"生成动作"按钮，系统会为你推荐适合的健身动作。</p>
            </div>
          </div>
          <div class="tutorial-step">
            <div class="step-number">3</div>
            <div class="step-content">
              <h4>查看详情</h4>
              <p>点击任意动作卡片查看详细说明、肌肉目标和示范图片。</p>
            </div>
          </div>
          <div class="tutorial-step">
            <div class="step-number">4</div>
            <div class="step-content">
              <h4>保存与组合</h4>
              <p>喜欢的动作可以保存到动作库，并创建属于自己的训练组合。</p>
            </div>
          </div>
        </div>
      </section>
    `;

    this.bindIndexEvents();
    this.bindFeaturedEvents();
  },

  getFeaturedExercises() {
    if (!this.data) return [];
    const withImages = this.data.exercises.filter(e => e.images !== null);
    const shuffled = this.shuffleArray(withImages);
    return shuffled.slice(0, 6);
  },

  bindFeaturedEvents() {
    const cards = document.querySelectorAll('.featured-card');
    cards.forEach(card => {
      card.addEventListener('click', () => {
        Router.navigate('detail', { id: card.dataset.id });
      });
    });
  },

  getTagIcon(tagId) {
    const icons = {
      legs: '🦵',
      upper: '💪',
      fullbody: '🏋️',
      bodyweight: '🧘',
      crossfit: '🔥',
      landmine: '⚡',
      random: '🎲'
    };
    return icons[tagId] || '🏃';
  },

  bindIndexEvents() {
    const tagCards = document.querySelectorAll('.tag-card');
    const secondaryBtns = document.querySelectorAll('.secondary-tag-btn');
    const generateBtn = document.querySelector('.btn-generate');

    tagCards.forEach(card => {
      card.addEventListener('click', () => {
        const tagId = card.dataset.tag;

        if (tagId === 'random') {
          tagCards.forEach(c => c.classList.remove('selected'));
          card.classList.add('selected');
          this.selectedPrimaryTags = ['random'];
        } else {
          card.classList.toggle('selected');
          const randomIndex = this.selectedPrimaryTags.indexOf('random');
          if (randomIndex >= 0) {
            this.selectedPrimaryTags.splice(randomIndex, 1);
          }

          const tagIndex = this.selectedPrimaryTags.indexOf(tagId);
          if (tagIndex >= 0) {
            this.selectedPrimaryTags.splice(tagIndex, 1);
          } else {
            this.selectedPrimaryTags.push(tagId);
          }
        }

        generateBtn.disabled = this.selectedPrimaryTags.length === 0;
      });
    });

    secondaryBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        secondaryBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.selectedSecondaryTag = btn.dataset.tag || null;
      });
    });

    generateBtn.addEventListener('click', () => {
      if (this.selectedPrimaryTags.length === 0) return;
      const primary = this.selectedPrimaryTags[0];
      const params = { primary };
      if (this.selectedSecondaryTag) {
        params.secondary = this.selectedSecondaryTag;
      }
      Router.navigate('generate', params);
    });
  },

  initGenerate() {
    const main = document.querySelector('.main-content');
    if (!main || !this.data) return;

    this.selectedExercises = [];

    const primaryTag = Router.getParam('primary');
    const secondaryTag = Router.getParam('secondary');

    if (!primaryTag) {
      main.innerHTML = '<div class="empty-state"><h3>请选择训练部位</h3><a href="index.html" class="btn btn-primary">返回首页</a></div>';
      return;
    }

    let exercises = [];
    const savedIds = this.getGeneratedExercises();

    if (savedIds && savedIds.length > 0) {
      exercises = savedIds.map(id => this.getExerciseById(id)).filter(Boolean);
    } else {
      if (primaryTag === 'random') {
        exercises = this.data.exercises;
      } else {
        exercises = this.data.exercises.filter(e => {
          if (e.primaryTag !== primaryTag) return false;
          if (secondaryTag && e.secondaryTag !== secondaryTag) return false;
          return true;
        });
      }

      const shuffled = this.shuffleArray(exercises);
      const count = Math.min(Math.floor(Math.random() * 3) + 6, shuffled.length);
      exercises = shuffled.slice(0, count);

      this.saveGeneratedExercises(exercises.map(e => e.id));
    }

    const grouped = this.groupBySecondaryTag(exercises);

    main.innerHTML = `
      <div class="generate-header">
        <h1 class="section-title">推荐动作</h1>
        <p class="section-subtitle">${this.getPrimaryTagName(primaryTag)}${secondaryTag ? ' · ' + this.getSecondaryTagName(secondaryTag) : ''} - 共 ${exercises.length} 个动作</p>
        <a href="index.html" class="btn btn-secondary">重新选择</a>
      </div>

      ${exercises.length === 0 ? `
        <div class="empty-state">
          <h3>没有匹配的动作</h3>
          <p>请尝试其他标签组合</p>
          <a href="index.html" class="btn btn-primary">返回首页</a>
        </div>
      ` : Object.keys(grouped).map(tag => `
        <section class="exercise-group">
          <h3 class="group-title">${tag ? this.getSecondaryTagName(tag) : '综合训练'}</h3>
          <div class="grid grid-auto">
            ${grouped[tag].map(exercise => this.renderExerciseCard(exercise)).join('')}
          </div>
        </section>
      `).join('')}

      <div class="floating-bar" id="floating-bar">
        <div class="floating-info">
          <span>已选择 <strong id="selected-count">0</strong> 个动作</span>
        </div>
        <button class="btn btn-primary" id="btn-complete-selection">完成选择</button>
      </div>

      <div class="modal-overlay" id="modal-overlay">
        <div class="modal">
          <h3 class="modal-title">保存组合</h3>
          <div class="modal-body">
            <div class="form-group">
              <label>组合名称</label>
              <input type="text" id="combo-name" placeholder="输入组合名称">
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" id="btn-cancel">取消</button>
            <button class="btn btn-primary" id="btn-save-combo">保存</button>
          </div>
        </div>
      </div>
    `;

    if (exercises.length > 0) {
      this.bindGenerateEvents(primaryTag);
      this.initCarousels();
    }
  },

  groupBySecondaryTag(exercises) {
    return exercises.reduce((acc, exercise) => {
      const tag = exercise.secondaryTag || '';
      if (!acc[tag]) acc[tag] = [];
      acc[tag].push(exercise);
      return acc;
    }, {});
  },

  renderExerciseCard(exercise) {
    const hasImages = exercise.images !== null;
    return `
      <div class="card exercise-card" data-id="${exercise.id}">
        ${hasImages ? `
          <div class="exercise-image">
            <div class="carousel">
              <img src="${exercise.images.start}" alt="${exercise.name}" style="display:block;">
              <img src="${exercise.images.end}" alt="${exercise.name}" style="display:none;">
              <div class="carousel-nav">
                <button class="active" data-index="0"></button>
                <button data-index="1"></button>
              </div>
            </div>
          </div>
        ` : `
          <div class="placeholder-image">
            <div class="placeholder-icon">🏋️</div>
            <div class="placeholder-text">示范图示意</div>
            <div class="placeholder-name">${exercise.name}</div>
          </div>
        `}
        <div class="exercise-info">
          <div class="exercise-header">
            <h3>${exercise.name}</h3>
            <span class="tag tag-primary">${exercise.movementPattern}</span>
          </div>
          <div class="exercise-muscles">
            ${exercise.muscles.slice(0, 2).map(m => `<span class="tag tag-secondary">${m}</span>`).join('')}
          </div>
          <div class="exercise-actions">
            <button class="checkbox-btn" data-id="${exercise.id}"></button>
          </div>
        </div>
      </div>
    `;
  },

  bindGenerateEvents(primaryTag) {
    const cards = document.querySelectorAll('.exercise-card');
    const floatingBar = document.getElementById('floating-bar');
    const selectedCount = document.getElementById('selected-count');
    const btnComplete = document.getElementById('btn-complete-selection');
    const modalOverlay = document.getElementById('modal-overlay');
    const btnCancel = document.getElementById('btn-cancel');
    const btnSave = document.getElementById('btn-save-combo');
    const comboNameInput = document.getElementById('combo-name');

    cards.forEach(card => {
      const checkbox = card.querySelector('.checkbox-btn');

      checkbox.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = card.dataset.id;
        if (this.selectedExercises.includes(id)) {
          this.selectedExercises = this.selectedExercises.filter(e => e !== id);
          checkbox.classList.remove('checked');
        } else {
          this.selectedExercises.push(id);
          checkbox.classList.add('checked');
        }

        selectedCount.textContent = this.selectedExercises.length;
        floatingBar.classList.toggle('show', this.selectedExercises.length > 0);
      });

      card.addEventListener('click', () => {
        Router.navigate('detail', { id: card.dataset.id });
      });
    });

    btnComplete.addEventListener('click', () => {
      if (this.selectedExercises.length === 0) return;
      modalOverlay.classList.add('show');
      comboNameInput.focus();
    });

    btnCancel.addEventListener('click', () => {
      modalOverlay.classList.remove('show');
    });

    btnSave.addEventListener('click', () => {
      const name = comboNameInput.value.trim();
      if (!name) {
        comboNameInput.style.borderColor = 'var(--danger-color)';
        comboNameInput.placeholder = '请输入组合名称';
        return;
      }

      this.selectedExercises.forEach(id => {
        Storage.saveExercise(id);
      });

      const combo = Storage.saveCombo(name, primaryTag, this.selectedExercises);
      modalOverlay.classList.remove('show');
      this.showAlert(`组合已保存！\n\n同时已将 ${this.selectedExercises.length} 个动作添加到动作库。`, () => {
        Router.navigate('combo-detail', { id: combo.id });
      });
    });
  },

  initCarousels() {
    const carousels = document.querySelectorAll('.carousel');
    carousels.forEach(carousel => {
      const images = carousel.querySelectorAll('img');
      const navButtons = carousel.querySelectorAll('.carousel-nav button');
      if (images.length === 0) return;
      let currentIndex = 0;

      navButtons.forEach((btn, index) => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          currentIndex = index;
          images.forEach((img, i) => {
            img.style.display = i === index ? 'block' : 'none';
          });
          navButtons.forEach((b, i) => {
            b.classList.toggle('active', i === index);
          });
        });
      });

      setInterval(() => {
        currentIndex = (currentIndex + 1) % images.length;
        images.forEach((img, i) => {
          img.style.display = i === currentIndex ? 'block' : 'none';
        });
        navButtons.forEach((b, i) => {
          b.classList.toggle('active', i === currentIndex);
        });
      }, 3000);
    });
  },

  initDetail() {
    const main = document.querySelector('.main-content');
    if (!main) return;

    if (!this.data) {
      this._retryCount = (this._retryCount || 0) + 1;
      if (this._retryCount > 20) {
        main.innerHTML = '<div class="empty-state"><h3>数据加载失败</h3><p>请刷新页面重试</p></div>';
        return;
      }
      main.innerHTML = '<div class="empty-state"><h3>数据加载中...</h3></div>';
      setTimeout(() => this.initDetail(), 200);
      return;
    }
    this._retryCount = 0;

    const id = Router.getParam('id');
    const exercise = this.getExerciseById(id);

    if (!exercise) {
      main.innerHTML = '<div class="empty-state"><h3>动作不存在</h3><a href="index.html" class="btn btn-primary">返回首页</a></div>';
      return;
    }

    const isSaved = Storage.isExerciseSaved(id);
    const hasImages = exercise.images !== null;

    main.innerHTML = `
      <div class="detail-header">
        <a href="javascript:history.back()" class="btn btn-secondary">← 返回</a>
      </div>

      <section class="detail-image">
        ${hasImages ? `
          <div class="carousel">
            <img src="${exercise.images.start}" alt="${exercise.name} 起始" style="display:block;">
            <img src="${exercise.images.end}" alt="${exercise.name} 结束" style="display:none;">
            <div class="carousel-nav">
              <button class="active" data-index="0"></button>
              <button data-index="1"></button>
            </div>
          </div>
        ` : `
          <div class="placeholder-image" style="height:300px;">
            <div class="placeholder-icon">🏋️</div>
            <div class="placeholder-text">示范图示意</div>
            <div class="placeholder-name">${exercise.name}</div>
          </div>
        `}
      </section>

      <section class="detail-info">
        <h1 class="detail-title">${exercise.name}</h1>
        <p class="detail-subtitle">${exercise.nameEn}</p>

        <div class="detail-tags">
          <span class="tag tag-primary">${this.getPrimaryTagName(exercise.primaryTag)}</span>
          <span class="tag tag-secondary">${this.getSecondaryTagName(exercise.secondaryTag)}</span>
          <span class="tag tag-accent">${exercise.movementPattern}</span>
          <span class="tag tag-success">${exercise.difficulty}</span>
        </div>

        <div class="detail-section">
          <h3>目标肌肉</h3>
          <div class="muscle-list">
            ${exercise.muscles.map(m => `<span class="tag tag-secondary">${m}</span>`).join('')}
          </div>
        </div>

        <div class="detail-section">
          <h3>动作模式</h3>
          <p>${exercise.movementPattern}</p>
        </div>

        <div class="detail-section">
          <h3>动作描述</h3>
          <p>${exercise.description}</p>
        </div>

        <div class="detail-actions">
          <button class="btn btn-primary btn-save-exercise">${isSaved ? '✓ 已保存' : '保存到动作库'}</button>
        </div>
      </section>
    `;

    this.bindDetailEvents(id);
    this.initCarousels();
  },

  bindDetailEvents(id) {
    const btnSave = document.querySelector('.btn-save-exercise');
    btnSave.addEventListener('click', () => {
      if (Storage.isExerciseSaved(id)) {
        Storage.removeExercise(id);
        btnSave.textContent = '保存到动作库';
      } else {
        Storage.saveExercise(id);
        btnSave.textContent = '✓ 已保存';
      }
    });
  },

  initLibrary() {
    const main = document.querySelector('.main-content');
    if (!main || !this.data) return;

    const savedExercises = Storage.getSavedExercises();
    const exercises = savedExercises.map(e => this.getExerciseById(e.id)).filter(Boolean);

    main.innerHTML = `
      <h1 class="section-title">我的动作库</h1>

      ${exercises.length === 0 ? `
        <div class="empty-state">
          <h3>还没有保存任何动作</h3>
          <p>从动作详情页点击"保存到动作库"来添加</p>
          <a href="index.html" class="btn btn-primary">去浏览动作</a>
        </div>
      ` : `
        <div class="grid grid-auto">
          ${exercises.map(exercise => this.renderLibraryCard(exercise)).join('')}
        </div>
      `}
    `;

    if (exercises.length > 0) {
      this.bindLibraryEvents();
    }
  },

  renderLibraryCard(exercise) {
    const hasImages = exercise.images !== null;
    return `
      <div class="card exercise-card" data-id="${exercise.id}">
        ${hasImages ? `
          <div class="exercise-image">
            <img src="${exercise.images.start}" alt="${exercise.name}">
          </div>
        ` : `
          <div class="placeholder-image">
            <div class="placeholder-icon">🏋️</div>
            <div class="placeholder-text">示范图示意</div>
            <div class="placeholder-name">${exercise.name}</div>
          </div>
        `}
        <div class="exercise-info">
          <h3>${exercise.name}</h3>
          <div class="exercise-muscles">
            ${exercise.muscles.slice(0, 2).map(m => `<span class="tag tag-secondary">${m}</span>`).join('')}
          </div>
          <div class="exercise-actions">
            <a href="detail.html?id=${exercise.id}" class="btn btn-secondary">详情</a>
            <button class="btn btn-danger btn-remove">删除</button>
          </div>
        </div>
      </div>
    `;
  },

  bindLibraryEvents() {
    const cards = document.querySelectorAll('.exercise-card');
    cards.forEach(card => {
      const btnRemove = card.querySelector('.btn-remove');

      btnRemove.addEventListener('click', async (e) => {
        e.stopPropagation();
        e.preventDefault();
        const id = card.dataset.id;
        const confirmed = await this.showConfirm('确定要从动作库中删除这个动作吗？');
        if (!confirmed) return;
        Storage.removeExercise(id);
        card.remove();

        if (document.querySelectorAll('.exercise-card').length === 0) {
          document.querySelector('.main-content').innerHTML = `
            <h1 class="section-title">我的动作库</h1>
            <div class="empty-state">
              <h3>还没有保存任何动作</h3>
              <p>从动作详情页点击"保存到动作库"来添加</p>
              <a href="index.html" class="btn btn-primary">去浏览动作</a>
            </div>
          `;
        }
      });

      card.addEventListener('click', () => {
        const id = card.dataset.id;
        Router.navigate('detail', { id });
      });
    });
  },

  initCombos() {
    const main = document.querySelector('.main-content');
    if (!main || !this.data) return;

    const combos = Storage.getCombos();

    main.innerHTML = `
      <div class="combos-header">
        <h1 class="section-title">我的组合</h1>
        <a href="index.html" class="btn btn-primary">创建新组合</a>
      </div>

      ${combos.length === 0 ? `
        <div class="empty-state">
          <h3>还没有创建任何组合</h3>
          <p>从首页选择动作后保存为组合</p>
          <a href="index.html" class="btn btn-primary">去创建</a>
        </div>
      ` : `
        <div class="grid grid-auto">
          ${combos.map(combo => {
            const exerciseCount = combo.exerciseIds?.length || 0;
            return `
              <div class="card combo-card" data-id="${combo.id}">
                <h3>${combo.name}</h3>
                <div class="combo-info">
                  <span class="tag tag-primary">${this.getPrimaryTagName(combo.primaryTag)}</span>
                  <span class="tag tag-secondary">${exerciseCount} 个动作</span>
                </div>
                <div class="combo-date">
                  创建于 ${new Date(combo.createdAt).toLocaleDateString()}
                </div>
                <div class="combo-actions">
                  <a href="combo-detail.html?id=${combo.id}" class="btn btn-primary">查看</a>
                  <button class="btn btn-danger btn-delete-combo">删除</button>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      `}
    `;

    if (combos.length > 0) {
      this.bindCombosEvents();
    }
  },

  bindCombosEvents() {
    const cards = document.querySelectorAll('.combo-card');
    cards.forEach(card => {
      const btnDelete = card.querySelector('.btn-delete-combo');
      btnDelete.addEventListener('click', async (e) => {
        e.stopPropagation();
        e.preventDefault();
        const id = card.dataset.id;
        const confirmed = await this.showConfirm('确定要删除这个组合吗？');
        if (!confirmed) return;
        Storage.removeCombo(id);
        card.remove();

        if (document.querySelectorAll('.combo-card').length === 0) {
          document.querySelector('.main-content').innerHTML = `
            <div class="combos-header">
              <h1 class="section-title">我的组合</h1>
              <a href="index.html" class="btn btn-primary">创建新组合</a>
            </div>
            <div class="empty-state">
              <h3>还没有创建任何组合</h3>
              <p>从首页选择动作后保存为组合</p>
              <a href="index.html" class="btn btn-primary">去创建</a>
            </div>
          `;
        }
      });
    });
  },

  initComboDetail() {
    const main = document.querySelector('.main-content');
    if (!main) return;

    if (!this.data) {
      this._retryCount = (this._retryCount || 0) + 1;
      if (this._retryCount > 20) {
        main.innerHTML = '<div class="empty-state"><h3>数据加载失败</h3><p>请刷新页面重试</p></div>';
        return;
      }
      main.innerHTML = '<div class="empty-state"><h3>数据加载中...</h3></div>';
      setTimeout(() => this.initComboDetail(), 200);
      return;
    }
    this._retryCount = 0;

    const id = Router.getParam('id');
    const combo = Storage.getCombo(id);

    if (!combo) {
      main.innerHTML = '<div class="empty-state"><h3>组合不存在</h3><a href="combos.html" class="btn btn-primary">返回组合列表</a></div>';
      return;
    }

    this.currentCombo = { ...combo, exerciseIds: [...combo.exerciseIds] };
    this.renderComboDetail();
  },

  renderComboDetail() {
    const main = document.querySelector('.main-content');
    const combo = this.currentCombo;
    const exercises = combo.exerciseIds.map(eid => this.getExerciseById(eid)).filter(Boolean);

    main.innerHTML = `
      <div class="combo-detail-header">
        <a href="combos.html" class="btn btn-secondary">← 返回列表</a>
        <button class="btn btn-primary" id="btn-save-combo-detail">保存修改</button>
      </div>

      <section class="combo-info-section">
        <h1 class="section-title">${combo.name}</h1>
        <div class="combo-meta">
          <span class="tag tag-primary">${this.getPrimaryTagName(combo.primaryTag)}</span>
          <span class="tag tag-secondary">${exercises.length} 个动作</span>
        </div>
      </section>

      <section class="combo-exercises">
        <h2 class="section-title">组合动作</h2>
        ${exercises.length === 0 ? `
          <div class="empty-state">
            <p>组合中暂无动作，请从下方添加</p>
          </div>
        ` : `
          <div class="grid grid-auto" id="combo-exercises-grid">
            ${exercises.map((exercise, index) => this.renderComboExerciseCard(exercise, index)).join('')}
          </div>
        `}
      </section>

      <section class="add-more-section">
        <h2 class="section-title">从动作库添加更多动作</h2>
        <div class="add-more-filters" id="add-more-filters">
          <button class="secondary-tag-btn active" data-tag="">全部</button>
          ${this.data.tags.primary.map(tag => `
            <button class="secondary-tag-btn" data-tag="${tag.id}">${tag.name}</button>
          `).join('')}
        </div>
        <div class="grid grid-auto" id="add-more-list">
          ${this.renderAddMoreList('')}
        </div>
      </section>

      <section class="combo-save-section">
        <div class="form-group">
          <label>组合名称</label>
          <input type="text" id="combo-name-input" value="${combo.name}">
        </div>
        <div class="combo-save-buttons">
          <button class="btn btn-secondary" id="btn-save-new-version">另存为新版本</button>
        </div>
      </section>

      <div class="modal-overlay" id="clone-modal">
        <div class="modal">
          <h3 class="modal-title">另存为新版本</h3>
          <div class="modal-body">
            <div class="form-group">
              <label>新组合名称</label>
              <input type="text" id="clone-name" placeholder="输入新组合名称">
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" id="btn-clone-cancel">取消</button>
            <button class="btn btn-primary" id="btn-clone-confirm">保存</button>
          </div>
        </div>
      </div>
    `;

    this.bindComboDetailEvents();
  },

  renderComboExerciseCard(exercise, index) {
    const hasImages = exercise.images !== null;
    return `
      <div class="card exercise-card" data-id="${exercise.id}" style="position:relative;">
        <div class="exercise-index">${index + 1}</div>
        ${hasImages ? `
          <div class="exercise-image">
            <img src="${exercise.images.start}" alt="${exercise.name}">
          </div>
        ` : `
          <div class="placeholder-image">
            <div class="placeholder-icon">🏋️</div>
            <div class="placeholder-text">示范图示意</div>
            <div class="placeholder-name">${exercise.name}</div>
          </div>
        `}
        <div class="exercise-info">
          <h3>${exercise.name}</h3>
          <div class="exercise-muscles">
            ${exercise.muscles.slice(0, 2).map(m => `<span class="tag tag-secondary">${m}</span>`).join('')}
          </div>
          <div class="exercise-actions">
            <a href="detail.html?id=${exercise.id}" class="btn btn-secondary">详情</a>
            <button class="btn btn-danger btn-remove-from-combo">移除</button>
          </div>
        </div>
      </div>
    `;
  },

  renderAddMoreList(filterTag) {
    const savedIds = Storage.getSavedExercises().map(e => e.id);
    const available = this.data.exercises.filter(e => {
      if (!savedIds.includes(e.id)) return false;
      if (this.currentCombo.exerciseIds.includes(e.id)) return false;
      if (filterTag && filterTag !== '' && e.primaryTag !== filterTag) return false;
      return true;
    }).slice(0, 12);

    if (available.length === 0) {
      return '<div class="empty-state"><p>动作库中没有可添加的动作</p><p>请先从动作详情页保存动作</p></div>';
    }

    return available.map(exercise => {
      const hasImages = exercise.images !== null;
      return `
        <div class="card exercise-card" data-id="${exercise.id}">
          ${hasImages ? `
            <div class="exercise-image">
              <img src="${exercise.images.start}" alt="${exercise.name}">
            </div>
          ` : `
            <div class="placeholder-image">
              <div class="placeholder-icon">🏋️</div>
              <div class="placeholder-text">示范图示意</div>
              <div class="placeholder-name">${exercise.name}</div>
            </div>
          `}
          <div class="exercise-info">
            <h3>${exercise.name}</h3>
            <div class="exercise-muscles">
              ${exercise.muscles.slice(0, 2).map(m => `<span class="tag tag-secondary">${m}</span>`).join('')}
            </div>
            <div class="exercise-actions">
              <button class="btn btn-primary btn-add-to-combo">添加</button>
            </div>
          </div>
        </div>
      `;
    }).join('');
  },

  bindComboDetailEvents() {
    const btnSaveDetail = document.getElementById('btn-save-combo-detail');
    const btnSaveNew = document.getElementById('btn-save-new-version');
    const nameInput = document.getElementById('combo-name-input');
    const cloneModal = document.getElementById('clone-modal');
    const cloneName = document.getElementById('clone-name');
    const btnCloneCancel = document.getElementById('btn-clone-cancel');
    const btnCloneConfirm = document.getElementById('btn-clone-confirm');

    document.querySelectorAll('.btn-remove-from-combo').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        e.preventDefault();
        const card = btn.closest('.exercise-card');
        const id = card.dataset.id;
        const confirmed = await this.showConfirm('确定要从组合中移除这个动作吗？');
        if (!confirmed) return;
        this.currentCombo.exerciseIds = this.currentCombo.exerciseIds.filter(eid => eid !== id);
        this.renderComboDetail();
      });
    });

    document.querySelectorAll('.btn-add-to-combo').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const card = btn.closest('.exercise-card');
        const id = card.dataset.id;
        if (!this.currentCombo.exerciseIds.includes(id)) {
          this.currentCombo.exerciseIds.push(id);
          this.renderComboDetail();
        }
      });
    });

    const filterBtns = document.querySelectorAll('#add-more-filters .secondary-tag-btn');
    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const tag = btn.dataset.tag || '';
        document.getElementById('add-more-list').innerHTML = this.renderAddMoreList(tag);
        document.querySelectorAll('.btn-add-to-combo').forEach(addBtn => {
          addBtn.addEventListener('click', (ev) => {
            ev.stopPropagation();
            const card = addBtn.closest('.exercise-card');
            const id = card.dataset.id;
            if (!this.currentCombo.exerciseIds.includes(id)) {
              this.currentCombo.exerciseIds.push(id);
              this.renderComboDetail();
            }
          });
        });
      });
    });

    btnSaveDetail.addEventListener('click', () => {
      const name = nameInput.value.trim() || this.currentCombo.name;
      Storage.updateCombo(this.currentCombo.id, this.currentCombo.exerciseIds, name);
      this.currentCombo.name = name;
      this.showAlert('组合已更新保存');
      this.renderComboDetail();
    });

    btnSaveNew.addEventListener('click', () => {
      cloneName.value = this.currentCombo.name + ' (副本)';
      cloneModal.classList.add('show');
      cloneName.focus();
    });

    btnCloneCancel.addEventListener('click', () => {
      cloneModal.classList.remove('show');
    });

    btnCloneConfirm.addEventListener('click', () => {
      const newName = cloneName.value.trim();
      if (!newName) {
        cloneName.style.borderColor = 'var(--danger-color)';
        cloneName.placeholder = '请输入名称';
        return;
      }
      const newCombo = Storage.cloneCombo(this.currentCombo.id, newName);
      if (newCombo) {
        Storage.updateCombo(newCombo.id, this.currentCombo.exerciseIds, newName);
        cloneModal.classList.remove('show');
        Router.navigate('combo-detail', { id: newCombo.id });
      }
    });
  },

  initUpload() {
    const main = document.querySelector('.main-content');
    if (!main) return;

    main.innerHTML = `
      <div class="upload-page">
        <div class="upload-icon">📷</div>
        <h1 class="section-title">AI 动作识别</h1>
        <p class="upload-desc">拍摄你的动作视频，AI 将自动识别动作名称、目标肌肉和动作模式</p>
        <div class="upload-placeholder">
          <div class="upload-icon-large">➕</div>
          <p>功能开发中</p>
          <p class="upload-subtext">暂未完成，敬请期待</p>
        </div>
        <button class="btn btn-primary" id="btn-upload">选择视频上传</button>
        <div class="upload-info">
          <h3>即将支持</h3>
          <ul>
            <li>图片动作识别</li>
            <li>视频动作分析</li>
            <li>动作标准度评分</li>
          </ul>
        </div>
      </div>
    `;

    const btnUpload = document.getElementById('btn-upload');
    if (btnUpload) {
      btnUpload.addEventListener('click', () => {
        this.showAlert('功能开发中，敬请期待');
      });
    }
  }
};

document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
