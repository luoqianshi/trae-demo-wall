/* ========================================
   你好，我的小孩 - 场景列表页脚本
   功能：分类筛选、搜索、卡片渲染、URL参数
   ======================================== */

(function () {
  'use strict';

  /* ========================================
     状态管理
     ======================================== */
  const state = {
    currentCategory: 'all',
    searchKeyword: '',
    debounceTimer: null
  };

  /* ========================================
     DOM 元素
     ======================================== */
  const elements = {
    categoryTabs: document.getElementById('categoryTabs'),
    scenesGrid: document.getElementById('scenesGrid'),
    searchInput: document.getElementById('searchInput'),
    currentCategoryName: document.getElementById('currentCategoryName'),
    scenesCount: document.getElementById('scenesCount'),
    emptyState: document.getElementById('emptyState'),
    viewAllBtn: document.getElementById('viewAllBtn'),
    siteHeader: document.getElementById('siteHeader'),
    customSceneBtn: document.getElementById('customSceneBtn'),
    customScenePanel: document.getElementById('customScenePanel'),
    customSceneInput: document.getElementById('customSceneInput'),
    cancelCustomBtn: document.getElementById('cancelCustomBtn'),
    generateCustomBtn: document.getElementById('generateCustomBtn'),
    exampleTags: document.querySelectorAll('.example-tag')
  };

  /* ========================================
     工具函数
     ======================================== */

  /**
   * 防抖函数
   * @param {Function} func - 要执行的函数
   * @param {number} delay - 延迟时间（毫秒）
   * @returns {Function} 防抖后的函数
   */
  function debounce(func, delay) {
    return function (...args) {
      clearTimeout(state.debounceTimer);
      state.debounceTimer = setTimeout(() => func.apply(this, args), delay);
    };
  }

  /**
   * 获取 URL 参数
   * @param {string} name - 参数名
   * @returns {string|null} 参数值
   */
  function getUrlParam(name) {
    const params = new URLSearchParams(window.location.search);
    return params.get(name);
  }

  /**
   * 更新 URL 参数（不刷新页面）
   * @param {string} name - 参数名
   * @param {string} value - 参数值
   */
  function updateUrlParam(name, value) {
    const url = new URL(window.location);
    if (value && value !== 'all') {
      url.searchParams.set(name, value);
    } else {
      url.searchParams.delete(name);
    }
    window.history.replaceState({}, '', url);
  }

  /**
   * 生成星星 HTML
   * @param {number} difficulty - 难度等级（1-3）
   * @returns {string} HTML 字符串
   */
  function renderStars(difficulty) {
    let stars = '';
    for (let i = 1; i <= 3; i++) {
      const filled = i <= difficulty ? 'filled' : '';
      stars += `
        <svg class="star ${filled}" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
      `;
    }
    return stars;
  }

  /* ========================================
     渲染函数
     ======================================== */

  /**
   * 渲染分类标签
   */
  function renderCategories() {
    const categories = window.MockData.categories;
    elements.categoryTabs.innerHTML = categories.map(cat => `
      <button
        class="category-tab ${state.currentCategory === cat.id ? 'active' : ''}"
        data-category="${cat.id}">
        <span class="category-tab-icon">${cat.icon}</span>
        <span>${cat.name}</span>
      </button>
    `).join('');
  }

  /**
   * 渲染场景卡片
   * @param {Array} scenes - 场景数据数组
   */
  function renderScenes(scenes) {
    if (scenes.length === 0) {
      elements.scenesGrid.innerHTML = '';
      elements.scenesGrid.classList.add('hidden');
      elements.emptyState.classList.remove('hidden');
      return;
    }

    elements.scenesGrid.classList.remove('hidden');
    elements.emptyState.classList.add('hidden');

    elements.scenesGrid.innerHTML = scenes.map((scene, index) => `
      <article
        class="scene-card"
        data-id="${scene.id}"
        style="animation-delay: ${index * 0.05}s;">
        <div class="scene-card-icon" style="background: ${scene.coverGradient};">
          <span>${scene.icon}</span>
        </div>
        <div class="scene-card-body">
          <div class="scene-card-title-row">
            <h3 class="scene-card-title">${scene.title}</h3>
            <div class="scene-card-difficulty">
              ${renderStars(scene.difficulty)}
            </div>
          </div>
          <p class="scene-card-desc">${scene.description}</p>
          <div class="scene-card-footer">
            <div class="scene-card-time">
              <span class="scene-card-time-icon">⏱️</span>
              <span>${scene.estimatedTime}</span>
            </div>
            <div class="scene-card-btn">
              <span>开始对话</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </div>
          </div>
        </div>
      </article>
    `).join('');
  }

  /**
   * 更新计数和标题
   * @param {number} count - 场景数量
   */
  function updateCountAndTitle(count) {
    elements.scenesCount.textContent = count;

    if (state.searchKeyword) {
      elements.currentCategoryName.textContent = `搜索 "${state.searchKeyword}"`;
    } else {
      const category = window.MockData.categories.find(c => c.id === state.currentCategory);
      elements.currentCategoryName.textContent = category ? category.name : '全部场景';
    }
  }

  /* ========================================
     数据过滤
     ======================================== */

  /**
   * 过滤场景数据
   * @returns {Array} 过滤后的场景数组
   */
  function filterScenes() {
    let scenes = window.MockData.scenes;

    // 按分类过滤
    if (state.currentCategory !== 'all') {
      scenes = scenes.filter(s => s.category === state.currentCategory);
    }

    // 按关键词搜索
    if (state.searchKeyword.trim()) {
      const keyword = state.searchKeyword.trim().toLowerCase();
      scenes = scenes.filter(s =>
        s.title.toLowerCase().includes(keyword) ||
        s.description.toLowerCase().includes(keyword)
      );
    }

    return scenes;
  }

  /**
   * 更新视图（过滤 + 渲染）
   */
  function updateView() {
    const filteredScenes = filterScenes();
    renderScenes(filteredScenes);
    updateCountAndTitle(filteredScenes.length);
  }

  /* ========================================
     事件处理
     ======================================== */

  /**
   * 处理分类切换
   * @param {string} categoryId - 分类ID
   */
  function handleCategoryChange(categoryId) {
    state.currentCategory = categoryId;

    // 更新分类标签的激活状态
    const tabs = elements.categoryTabs.querySelectorAll('.category-tab');
    tabs.forEach(tab => {
      if (tab.dataset.category === categoryId) {
        tab.classList.add('active');
      } else {
        tab.classList.remove('active');
      }
    });

    // 更新 URL
    updateUrlParam('category', categoryId);

    // 更新视图
    updateView();
  }

  /**
   * 处理搜索输入
   * @param {string} keyword - 搜索关键词
   */
  const handleSearch = debounce(function (keyword) {
    state.searchKeyword = keyword;

    // 搜索时自动切换到"全部场景"
    if (keyword.trim() && state.currentCategory !== 'all') {
      state.currentCategory = 'all';
      const tabs = elements.categoryTabs.querySelectorAll('.category-tab');
      tabs.forEach(tab => {
        if (tab.dataset.category === 'all') {
          tab.classList.add('active');
        } else {
          tab.classList.remove('active');
        }
      });
      updateUrlParam('category', 'all');
    }

    updateView();
  }, 300);

  /**
   * 处理卡片点击
   * @param {string} sceneId - 场景ID
   */
  function handleCardClick(sceneId) {
    window.location.href = `scene-detail.html?id=${sceneId}`;
  }

  /**
   * 绑定事件
   */
  function bindEvents() {
    // 分类标签点击事件（事件委托）
    elements.categoryTabs.addEventListener('click', function (e) {
      const tab = e.target.closest('.category-tab');
      if (tab) {
        const categoryId = tab.dataset.category;
        if (categoryId !== state.currentCategory) {
          handleCategoryChange(categoryId);
        }
      }
    });

    // 搜索框输入事件
    elements.searchInput.addEventListener('input', function (e) {
      handleSearch(e.target.value);
    });

    // 场景卡片点击事件（事件委托）
    elements.scenesGrid.addEventListener('click', function (e) {
      const card = e.target.closest('.scene-card');
      if (card) {
        const sceneId = card.dataset.id;
        handleCardClick(sceneId);
      }
    });

    // 空状态 - 查看全部按钮
    elements.viewAllBtn.addEventListener('click', function () {
      state.currentCategory = 'all';
      state.searchKeyword = '';
      elements.searchInput.value = '';

      // 更新分类标签
      const tabs = elements.categoryTabs.querySelectorAll('.category-tab');
      tabs.forEach(tab => {
        if (tab.dataset.category === 'all') {
          tab.classList.add('active');
        } else {
          tab.classList.remove('active');
        }
      });

      updateUrlParam('category', 'all');
      updateView();
    });

    // 页面滚动效果
    let lastScrollY = 0;
    window.addEventListener('scroll', function () {
      const currentScrollY = window.scrollY;
      if (currentScrollY > 10) {
        elements.siteHeader.classList.add('scrolled');
      } else {
        elements.siteHeader.classList.remove('scrolled');
      }
      lastScrollY = currentScrollY;
    });

    // 自定义场景按钮 - 展开/收起输入面板
    elements.customSceneBtn.addEventListener('click', function () {
      if (elements.customScenePanel.style.display === 'none') {
        elements.customScenePanel.style.display = 'block';
        elements.customScenePanel.classList.add('open');
        elements.customSceneInput.focus();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        elements.customScenePanel.style.display = 'none';
        elements.customScenePanel.classList.remove('open');
      }
    });

    // 取消按钮
    elements.cancelCustomBtn.addEventListener('click', function () {
      elements.customScenePanel.style.display = 'none';
      elements.customScenePanel.classList.remove('open');
      elements.customSceneInput.value = '';
      elements.generateCustomBtn.disabled = true;
    });

    // 输入框内容变化 - 启用/禁用生成按钮
    elements.customSceneInput.addEventListener('input', function () {
      const text = elements.customSceneInput.value.trim();
      elements.generateCustomBtn.disabled = text.length < 5;
    });

    // 示例标签点击
    elements.exampleTags.forEach(function (tag) {
      tag.addEventListener('click', function () {
        const text = tag.dataset.text;
        elements.customSceneInput.value = text;
        elements.generateCustomBtn.disabled = false;
        elements.customSceneInput.focus();
      });
    });

    // 生成按钮点击
    elements.generateCustomBtn.addEventListener('click', function () {
      const text = elements.customSceneInput.value.trim();
      if (text.length < 5) return;

      var btnText = elements.generateCustomBtn.querySelector('.btn-text');
      var btnLoading = elements.generateCustomBtn.querySelector('.btn-loading');

      elements.generateCustomBtn.disabled = true;
      btnText.style.display = 'none';
      btnLoading.style.display = 'inline-flex';

      var sceneData = window.MockData.generateCustomScene(text);

      var savedScenes = JSON.parse(localStorage.getItem('customScenes') || '{}');
      savedScenes[sceneData.id] = sceneData;
      localStorage.setItem('customScenes', JSON.stringify(savedScenes));

      setTimeout(function () {
        window.location.href = 'scene-detail.html?id=' + sceneData.id + '&custom=1';
      }, 1500);
    });
  }

  /* ========================================
     初始化
     ======================================== */

  /**
   * 初始化页面
   */
  function init() {
    // 从 URL 获取分类参数
    const urlCategory = getUrlParam('category');
    if (urlCategory) {
      // 验证分类是否存在
      const validCategory = window.MockData.categories.find(c => c.id === urlCategory);
      if (validCategory) {
        state.currentCategory = urlCategory;
      }
    }

    // 渲染分类标签
    renderCategories();

    // 渲染场景列表
    updateView();

    // 绑定事件
    bindEvents();
  }

  // 页面加载完成后初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
