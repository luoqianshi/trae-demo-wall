/* ============================================
   app.js — 主应用逻辑
   状态管理、视图切换、GSAP 动画集成
   无 Demo 模式，始终调用真实 Agnes API
   ============================================ */

(function () {
  'use strict';

  const __timelines = {};

  // ============================================
  // Store — 应用状态管理中心
  // ============================================
  const Store = {
    state: {
      curioList: [],
      currentView: 'hall',
      currentCurio: null,
      currentStyleIndex: 0,
      isGenerating: false,
      searchQuery: '',
      filterStyle: '',
      filterTag: '',
      favOnly: false,
    },

    init() {
      this.state.curioList = Storage.getAll();
    },

    getCurioList() {
      return this.state.curioList;
    },

    getCurio(id) {
      return Storage.getById(id);
    },

    addCurio(curio) {
      const saved = Storage.add(curio);
      this.state.curioList = Storage.getAll();
      return saved;
    },

    deleteCurio(id) {
      Storage.remove(id);
      this.state.curioList = Storage.getAll();
    },

    removeStoryFromCurio(id, style) {
      const result = Storage.removeStory(id, style);
      this.state.curioList = Storage.getAll();
      const updated = Storage.getById(id);
      if (updated) this.state.currentCurio = updated;
      return result;
    },
  };

  // ============================================
  // DOM References
  // ============================================
  const dom = {
    views: {
      hall: document.getElementById('view-hall'),
      submit: document.getElementById('view-submit'),
      story: document.getElementById('view-story'),
      detail: document.getElementById('view-detail'),
      timeline: document.getElementById('view-timeline'),
    },
    hallEmpty: document.getElementById('hall-empty'),
    hallGallery: document.getElementById('hall-gallery'),
    galleryGrid: document.getElementById('gallery-grid'),
    submitForm: document.getElementById('submit-form'),
    itemName: document.getElementById('item-name'),
    itemDesc: document.getElementById('item-desc'),
    itemTags: document.getElementById('item-tags'),
    customStyleInput: document.getElementById('custom-style-input'),
    btnCustomStyle: document.getElementById('btn-custom-style'),
    styleGrid: document.getElementById('style-grid'),
    styleCount: document.getElementById('style-count'),
    storageBar: document.getElementById('storage-bar'),
    btnSurprise: document.getElementById('btn-surprise'),
    btnGenerate: document.getElementById('btn-generate'),
    loadingOverlay: document.getElementById('loading-overlay'),
    progressFill: document.getElementById('progress-fill'),
    loadingText: document.getElementById('loading-text'),
    btnLoadingCancel: document.getElementById('btn-loading-cancel'),
    toast: document.getElementById('toast'),
    storyCardWrapper: document.getElementById('story-card-wrapper'),
    storyCard: document.getElementById('story-card'),
    cardExhibit: document.getElementById('card-exhibit'),
    cardSeal: document.getElementById('card-seal'),
    cardImage: document.getElementById('card-image'),
    cardItemName: document.getElementById('card-item-name'),
    cardStyleTag: document.getElementById('card-style-tag'),
    cardText: document.getElementById('card-text'),
    cardDate: document.getElementById('card-date'),
    switcherStrip: document.getElementById('switcher-strip'),
    switcherPrev: document.getElementById('switcher-prev'),
    switcherNext: document.getElementById('switcher-next'),
    btnDownload: document.getElementById('btn-download'),
    btnDeleteStory: document.getElementById('btn-delete-story'),
    btnDeleteDetail: document.getElementById('btn-delete-detail'),
    confirmDialog: document.getElementById('confirm-dialog'),
    confirmText: document.getElementById('confirm-text'),
    btnConfirmCancel: document.getElementById('btn-confirm-cancel'),
    btnConfirmDelete: document.getElementById('btn-confirm-delete'),
    detailTitle: document.getElementById('detail-title'),
    detailGallery: document.getElementById('detail-gallery'),
    btnExport: document.getElementById('btn-export'),
    searchInput: document.getElementById('search-input'),
    filterStyle: document.getElementById('filter-style'),
    tagFilter: document.getElementById('tag-filter'),
    btnFavFilter: document.getElementById('btn-fav-filter'),
    editOverlay: document.getElementById('edit-overlay'),
    editName: document.getElementById('edit-name'),
    editDesc: document.getElementById('edit-desc'),
    btnEditCancel: document.getElementById('btn-edit-cancel'),
    btnEditSave: document.getElementById('btn-edit-save'),
    btnEditDetail: document.getElementById('btn-edit-detail'),
    btnFavDetail: document.getElementById('btn-fav-detail'),
    btnRegenerate: document.getElementById('btn-regenerate'),
    btnContinue: document.getElementById('btn-continue'),
    btnThemeToggle: document.getElementById('btn-theme-toggle'),
    batchBar: document.getElementById('batch-bar'),
    batchSelectAll: document.getElementById('batch-select-all'),
    batchCount: document.getElementById('batch-count'),
    btnBatchDelete: document.getElementById('btn-batch-delete'),
    btnBatchCancel: document.getElementById('btn-batch-cancel'),
    timelineContent: document.getElementById('timeline-content'),
    onboardingOverlay: document.getElementById('onboarding-overlay'),
    onboardingContent: document.getElementById('onboarding-content'),
    btnOnboardingPrev: document.getElementById('btn-onboarding-prev'),
    btnOnboardingNext: document.getElementById('btn-onboarding-next'),
    btnOnboardingSkip: document.getElementById('btn-onboarding-skip'),
    onboardingStepIndicator: document.getElementById('onboarding-step-indicator'),
    exportModal: document.getElementById('export-modal'),
    btnExportConfirm: document.getElementById('btn-export-confirm'),
    btnExportCancel: document.getElementById('btn-export-cancel'),
    btnExportOpen: document.getElementById('btn-export-open'),
    lightbox: document.getElementById('lightbox'),
    lightboxImage: document.getElementById('lightbox-image'),
    btnLightboxClose: document.getElementById('btn-lightbox-close'),
  };

  // ============================================
  // Toast
  // ============================================
  let _toastTimer = null;

  function showToast(message, isError) {
    clearTimeout(_toastTimer);
    dom.toast.textContent = message;
    dom.toast.className = 'toast' + (isError ? ' error' : '');
    requestAnimationFrame(() => {
      dom.toast.classList.add('show');
    });
    _toastTimer = setTimeout(() => {
      dom.toast.classList.remove('show');
    }, 3500);
  }

  // ============================================
  // Loading
  // ============================================
  let loadingAnimTl = null;

  function showLoading(text) {
    dom.loadingText.textContent = text || '正在翻阅古籍...';
    dom.progressFill.style.width = '0%';
    dom.loadingOverlay.classList.add('active');

    if (loadingAnimTl) loadingAnimTl.kill();

    loadingAnimTl = gsap.timeline({ paused: true });
    loadingAnimTl.to(dom.progressFill, {
      width: '100%',
      duration: 60,
      ease: 'none',
    });
    loadingAnimTl.play();
  }

  function updateLoadingProgress(percent) {
    if (loadingAnimTl) {
      loadingAnimTl.progress(percent / 100);
    }
    dom.progressFill.style.width = percent + '%';
  }

  function hideLoading() {
    if (loadingAnimTl) {
      loadingAnimTl.kill();
      loadingAnimTl = null;
    }
    dom.loadingOverlay.classList.remove('active');
    dom.progressFill.style.width = '0%';
  }

  function updateLoadingText(style) {
    const texts = {
      '武侠': '剑影刀光中，旧物悄然苏醒...',
      '科幻': '穿越时空隧道，窥见未来碎片...',
      '治愈': '温暖的光晕中，记忆缓缓浮现...',
      '悬疑': '迷雾重重，暗藏玄机...',
      '王家卫风': '暧昧的灯光下，故事刚刚开场...',
      '童话': '翻开泛黄的童话书页...',
      '古风': '墨香氤氲，画卷徐徐展开...',
      '热血动漫': '燃烧吧！命运的齿轮开始转动！',
    };
    dom.loadingText.textContent = texts[style] || `「${style}」风格故事正在生成...`;
  }

  // ============================================
  // View Switching (GSAP transitions)
  // ============================================
  let viewTl = null;

  function switchView(viewName) {
    if (Store.state.currentView === viewName) return;
    if (Store.state.isGenerating) return;

    const nextEl = dom.views[viewName];
    if (!nextEl) return;

    if (viewTl) viewTl.kill();

    Object.values(dom.views).forEach((el) => {
      el.classList.remove('active');
      gsap.set(el, { clearProps: 'all' });
    });

    if (viewName === 'hall') {
      renderHall();
    } else if (viewName === 'timeline') {
      renderTimeline();
    }

    Store.state.currentView = viewName;
    nextEl.classList.add('active');

    viewTl = gsap.timeline();
    viewTl.fromTo(nextEl, { autoAlpha: 0, y: 12 }, {
      autoAlpha: 1,
      y: 0,
      duration: 0.35,
      ease: 'power2.out',
    });

    if (viewName === 'hall') {
      viewTl.call(() => animateHallGallery(), '>-0.1');
    }
  }

  // ============================================
  // Hall View
  // ============================================
  function getFilteredList() {
    let list = Store.getCurioList();
    const query = Store.state.searchQuery.trim().toLowerCase();
    const style = Store.state.filterStyle;
    const favOnly = Store.state.favOnly;

    if (query) {
      list = list.filter((c) => c.itemName.toLowerCase().includes(query));
    }
    if (style) {
      list = list.filter((c) => {
        const styles = c.selectedStyles || Object.keys(c.stories || {});
        return styles.includes(style);
      });
    }
    if (favOnly) {
      list = list.filter((c) => c.favorited);
    }
    if (Store.state.filterTag) {
      const tag = Store.state.filterTag.trim().toLowerCase();
      list = list.filter((c) => {
        const tags = c.tags || [];
        return tags.some(t => t.toLowerCase().includes(tag));
      });
    }
    return list;
  }

  function renderHall() {
    const list = getFilteredList();

    const info = Storage.getUsageInfo();
    const storageBar = dom.storageBar;
    if (storageBar) {
      const pct = Math.min(100, Math.round((info.usedBytes / (5 * 1024 * 1024)) * 100));
      const isFull = pct > 85;
      storageBar.innerHTML = `
        <div class="storage-bar-inner">
          <div class="storage-bar-track">
            <div class="storage-bar-fill" style="width:${pct}%"></div>
          </div>
          <span class="storage-bar-label">已用 ${info.usedMB} MB / 约 5 MB</span>
          <button class="storage-bar-clear" data-clear-all title="清空所有数据">清空</button>
        </div>
      `;
    }

    if (list.length === 0) {
      dom.hallEmpty.hidden = false;
      dom.hallGallery.hidden = true;
      return;
    }

    dom.hallEmpty.hidden = true;
    dom.hallGallery.hidden = false;

    dom.galleryGrid.innerHTML = '';

    list.forEach((curio, index) => {
      const styles = curio.selectedStyles || Object.keys(curio.stories || {});
      const firstStyle = styles[0] || '武侠';
      const firstStory = curio.stories?.[firstStyle];
      const imageUrl = firstStory?.imageUrl || '';
      const exhibitNum = String(index + 1).padStart(3, '0');
      const isFav = curio.favorited;
      const tags = curio.tags || [];
      const tagsHtml = tags.length > 0 ? `<div class="gallery-item-tags">${tags.map(t => `<span class="tag">${t}</span>`).join('')}</div>` : '';

      const item = document.createElement('div');
      item.className = 'gallery-item' + (isFav ? ' favorited' : '');
      item.dataset.id = curio.id;

      item.innerHTML = `
        <img class="gallery-item-thumb" src="${imageUrl || 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22400%22 height=%22300%22 fill=%22%23e8e0d0%22/%3E'}" alt="${curio.itemName}" loading="lazy" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22400%22 height=%22300%22 fill=%22%23e8e0d0%22/%3E'">
        <button class="gallery-item-delete" data-delete="${curio.id}" title="删除藏品">&#10007;</button>
        <button class="gallery-item-fav" data-fav="${curio.id}" title="${isFav ? '取消收藏' : '收藏'}">${isFav ? '★' : '♡'}</button>
        <div class="gallery-item-info">
          <div class="gallery-item-name">${curio.itemName}</div>
          <div class="gallery-item-number">藏品 No.${exhibitNum}</div>
          <span class="gallery-item-style">${firstStyle}</span>
          ${tagsHtml}
        </div>
      `;

      item.addEventListener('click', (e) => {
        if (e.target.closest('[data-delete]')) return;
        if (e.target.closest('[data-fav]')) return;
        openCurioDetail(curio.id);
      });

      dom.galleryGrid.appendChild(item);
    });
  }

  function animateHallGallery() {
    const items = dom.galleryGrid.querySelectorAll('.gallery-item');
    if (items.length === 0) return;

    gsap.fromTo(items, {
      y: 32,
      opacity: 0,
    }, {
      y: 0,
      opacity: 1,
      duration: 0.5,
      ease: 'power2.out',
      stagger: { each: 0.06, from: 'start' },
      overwrite: 'auto',
    });
  }

  // ============================================
  // Submit Form
  // ============================================

  function initSubmitForm() {
    const chips = dom.styleGrid.querySelectorAll('.style-chip input');
    chips.forEach((chip) => {
      chip.addEventListener('change', updateStyleCount);
    });

    updateStyleCount();

    dom.btnSurprise.addEventListener('click', handleSurprise);
    dom.btnCustomStyle.addEventListener('click', handleAddCustomStyle);
    dom.customStyleInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleAddCustomStyle();
      }
    });
    dom.styleGrid.addEventListener('click', (e) => {
      const removeBtn = e.target.closest('.chip-remove');
      if (removeBtn) {
        e.preventDefault();
        const chip = removeBtn.closest('.style-chip');
        if (chip && chip.classList.contains('custom-style')) {
          chip.remove();
          updateStyleCount();
        }
      }
    });

    dom.submitForm.addEventListener('submit', handleSubmit);
  }

  function updateStyleCount() {
    const checked = dom.styleGrid.querySelector('.style-chip input:checked');
    const name = checked ? checked.value : '';
    dom.styleCount.textContent = name ? `已选：${name}` : '请选择一种风格';
    dom.btnGenerate.disabled = !checked;
  }

  function handleSurprise() {
    // Only pick from predefined styles, excluding custom styles
    const predefinedChips = dom.styleGrid.querySelectorAll('.style-chip:not(.custom-style) input');
    if (predefinedChips.length === 0) return;
    const allStyles = Array.from(predefinedChips).map(c => c.value);
    const pick = allStyles[Math.floor(Math.random() * allStyles.length)];
    // Find the chip by iterating instead of CSS selector to avoid escaping issues
    const chip = Array.from(predefinedChips).find(c => c.value === pick);
    if (chip) {
      chip.checked = true;
      chip.dispatchEvent(new Event('change'));
    }

    gsap.fromTo(dom.btnSurprise, {
      scale: 1,
    }, {
      scale: 1.08,
      duration: 0.15,
      ease: 'power1.out',
      yoyo: true,
      repeat: 1,
    });
  }

  function handleAddCustomStyle() {
    const val = dom.customStyleInput.value.trim();
    if (!val) return;
    const existing = dom.styleGrid.querySelector(`.style-chip[data-style="${val}"]`);
    if (existing) {
      showToast('此风格已存在', true);
      return;
    }
    const label = document.createElement('label');
    label.className = 'style-chip custom-style';
    label.dataset.style = val;
    label.innerHTML = `
      <input type="radio" name="style" value="${val}" checked>
      <span class="chip-label">${val} <span class="chip-remove" title="移除">×</span></span>
    `;
    dom.styleGrid.appendChild(label);
    dom.customStyleInput.value = '';
    updateStyleCount();
  }

  async function handleSubmit(e) {
    e.preventDefault();

    const name = dom.itemName.value.trim();
    if (!name) {
      showToast('请输入物品名称', true);
      dom.itemName.focus();
      return;
    }

    const checkedStyles = dom.styleGrid.querySelectorAll('.style-chip input:checked');
    if (checkedStyles.length === 0) {
      showToast('请至少选择一种故事风格', true);
      return;
    }

    const styles = Array.from(checkedStyles).map((c) => c.value);
    const description = dom.itemDesc.value.trim();
    const tagsRaw = dom.itemTags.value.trim();
    const tags = tagsRaw ? tagsRaw.split(/[,，]/).map(t => t.trim()).filter(Boolean) : [];

    const info = Storage.getUsageInfo();
    const remainingMB = parseFloat(info.remainingMB);
    if (remainingMB < 0.3) {
      showToast('存储空间不足，请点击底部存储条「清空」按钮释放空间', true);
      return;
    }

    const abortController = new AbortController();
    const signal = abortController.signal;

    const onCancel = () => {
      abortController.abort();
    };
    if (dom.btnLoadingCancel) {
      dom.btnLoadingCancel.addEventListener('click', onCancel, { once: true });
      dom.btnLoadingCancel.style.display = '';
    }

    Store.state.isGenerating = true;
    dom.btnGenerate.disabled = true;
    dom.btnGenerate.querySelector('.btn-generate-text').textContent = 'AI 正在创作...';

    showLoading('正在翻阅古籍，寻找物品的前世...');

    let cancelled = false;

    try {
      const stories = {};
      let completedCount = 0;
      let failedCount = 0;
      const totalStyles = styles.length;

      for (const style of styles) {
        if (cancelled) break;

        updateLoadingText(style);
        const progress = Math.round((completedCount / totalStyles) * 100);
        updateLoadingProgress(progress);

        try {
          const result = await API.generateAll(style, name, description, signal);
          stories[style] = {
            text: result.text || '',
            imageUrl: result.imageUrl || '',
          };
          if (!result.text) {
            failedCount++;
            console.warn(`[handleSubmit] ${style} 风格返回空文本`);
          }
        } catch (err) {
          console.error(`[handleSubmit] ${style} 风格生成失败:`, err.message || err);
          if (err.name === 'AbortError' || String(err.message).includes('abort')) {
            cancelled = true;
            break;
          }
          stories[style] = {
            text: '',
            imageUrl: '',
          };
          failedCount++;
          showToast(`${style} 风格生成失败: ${err.message}`, true);
        }

        completedCount++;
        updateLoadingProgress(Math.round((completedCount / totalStyles) * 100));
      }

      updateLoadingProgress(100);

      if (cancelled) {
        hideLoading();
        showToast('已取消生成', true);
        return;
      }

      if (failedCount >= totalStyles) {
        hideLoading();
        showToast('所有风格均生成失败，请检查网络后重试', true);
        return;
      }

      const savedStyles = [];
      const savedStories = {};
      for (const [style, story] of Object.entries(stories)) {
        if (story.text) {
          savedStories[style] = story;
          savedStyles.push(style);
        }
      }

      const curio = {
        id: Storage.generateId(),
        itemName: name,
        itemDescription: description,
        tags: tags,
        createdAt: new Date().toISOString(),
        stories: savedStories,
        selectedStyles: savedStyles,
        favorited: false,
      };

      const saved = Store.addCurio(curio);

      await new Promise((r) => setTimeout(r, 500));

      hideLoading();

      if (!saved) {
        showToast('存储空间不足，请清理一些旧藏品后再试', true);
        return;
      }

      const successCount = savedStyles.length;
      const failMsg = failedCount > 0 ? `（${failedCount} 种风格失败）` : '';
      showToast(`「${name}」已归档 ${successCount} 种风格 ${failMsg}`);

      Store.state.isGenerating = false;

      dom.submitForm.reset();
      dom.itemTags.value = '';
      dom.customStyleInput.value = '';
      // Clean up custom style chips
      dom.styleGrid.querySelectorAll('.style-chip.custom-style').forEach(chip => chip.remove());
      updateStyleCount();

      switchView('hall');

    } catch (err) {
      hideLoading();
      showToast(`生成中断: ${err.message || '未知错误'}，请重试`, true);
    } finally {
      if (dom.btnLoadingCancel) {
        dom.btnLoadingCancel.removeEventListener('click', onCancel);
        dom.btnLoadingCancel.style.display = 'none';
      }
      Store.state.isGenerating = false;
      dom.btnGenerate.disabled = false;
      dom.btnGenerate.querySelector('.btn-generate-text').textContent = '★ 生成故事';
    }
  }

  // ============================================
  // Story View
  // ============================================
  function openStoryView(curioId, styleIndex) {
    const curio = Store.getCurio(curioId);
    if (!curio) {
      showToast('藏品未找到', true);
      return;
    }

    Store.state.currentCurio = curio;
    Store.state.currentStyleIndex = styleIndex || 0;

    renderStoryCard(curio, styleIndex || 0);
    switchView('story');
  }

  function renderStoryCard(curio, styleIndex) {
    const styles = curio.selectedStyles || Object.keys(curio.stories || {});
    if (styles.length === 0) return;

    const style = styles[styleIndex] || styles[0];
    const story = curio.stories?.[style];
    if (!story) return;

    const idx = Store.getCurioList().findIndex((c) => c.id === curio.id);
    const exhibitNum = String(idx + 1).padStart(3, '0');

    dom.cardExhibit.textContent = `藏品 No.${exhibitNum}`;

    const seals = ['鉴定', '存档', '考据', '认证', '归档', '品鉴'];
    const sealHash = curio.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    dom.cardSeal.textContent = `★ ${seals[sealHash % seals.length]}`;

    dom.cardImage.src = story.imageUrl || 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22680%22 height=%22320%22 fill=%22%23e8e0d0%22/%3E';
    dom.cardImage.alt = `${curio.itemName} · ${style}`;

    dom.cardImage.onerror = function () {
      this.src = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22680%22 height=%22320%22 fill=%22%23e8e0d0%22/%3E';
    };

    dom.cardItemName.textContent = curio.itemName;
    dom.cardStyleTag.textContent = style;

    const text = story.text || '（故事生成中...）';
    dom.cardText.innerHTML = text.split('\n').filter((l) => l.trim()).map((p) => `<p>${p}</p>`).join('');

    const date = new Date(curio.createdAt);
    dom.cardDate.textContent = date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    renderSwitcher(styles, styleIndex);
    animateCardIn();
  }

  function renderSwitcher(styles, activeIndex) {
    dom.switcherStrip.innerHTML = '';

    styles.forEach((s, i) => {
      const btn = document.createElement('button');
      btn.className = 'switcher-item' + (i === activeIndex ? ' active' : '');
      btn.textContent = s;
      btn.addEventListener('click', () => {
        if (i === activeIndex) return;
        switchStoryStyle(i);
      });
      dom.switcherStrip.appendChild(btn);
    });

    const activeBtn = dom.switcherStrip.querySelector('.switcher-item.active');
    if (activeBtn) {
      activeBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }

  // ============================================
  // GSAP Card Animations
  // ============================================
  let cardTl = null;

  function animateCardIn() {
    if (cardTl) cardTl.kill();

    const card = dom.storyCard;
    gsap.set(card, { clearProps: 'all' });

    cardTl = gsap.timeline({ paused: true });

    cardTl.from(card, {
      autoAlpha: 0,
      y: 24,
      duration: 0.5,
      ease: 'power2.out',
    }, 0);

    cardTl.from('#card-exhibit', {
      autoAlpha: 0,
      x: -16,
      duration: 0.35,
      ease: 'power2.out',
    }, 0.1);

    cardTl.from('#card-seal', {
      autoAlpha: 0,
      x: 16,
      duration: 0.35,
      ease: 'power2.out',
    }, 0.1);

    cardTl.from(dom.cardImage, {
      autoAlpha: 0,
      scale: 0.95,
      duration: 0.45,
      ease: 'power2.out',
    }, 0.2);

    cardTl.from('#card-item-name', {
      autoAlpha: 0,
      y: 12,
      duration: 0.35,
      ease: 'power2.out',
    }, 0.35);

    cardTl.from('#card-style-tag', {
      autoAlpha: 0,
      scaleX: 0,
      transformOrigin: 'left center',
      duration: 0.3,
      ease: 'power2.out',
    }, 0.45);

    cardTl.from('#card-text', {
      autoAlpha: 0,
      y: 16,
      duration: 0.4,
      ease: 'power2.out',
    }, 0.55);

    cardTl.from('.card-footer', {
      autoAlpha: 0,
      duration: 0.3,
      ease: 'power2.out',
    }, 0.75);

    cardTl.play();
    __timelines['card_enter'] = cardTl;
  }

  function switchStoryStyle(newIndex) {
    const curio = Store.state.currentCurio;
    if (!curio) return;

    const styles = curio.selectedStyles || Object.keys(curio.stories || {});
    if (newIndex < 0 || newIndex >= styles.length) return;
    if (newIndex === Store.state.currentStyleIndex) return;

    const direction = newIndex > Store.state.currentStyleIndex ? 1 : -1;

    gsap.to(dom.storyCard, {
      x: -direction * 40,
      autoAlpha: 0,
      rotationY: direction * 5,
      duration: 0.3,
      ease: 'power2.in',
      transformOrigin: '50% 50%',
      overwrite: 'auto',
      onComplete: () => {
        Store.state.currentStyleIndex = newIndex;
        renderStoryCard(curio, newIndex);

        gsap.fromTo(dom.storyCard, {
          x: direction * 40,
          autoAlpha: 0,
          rotationY: -direction * 5,
          transformOrigin: '50% 50%',
        }, {
          x: 0,
          autoAlpha: 1,
          rotationY: 0,
          duration: 0.35,
          ease: 'power2.out',
          overwrite: 'auto',
        });
      },
    });
  }

  // ============================================
  // Style Switcher Navigation
  // ============================================
  dom.switcherPrev.addEventListener('click', () => {
    const curio = Store.state.currentCurio;
    if (!curio) return;
    const styles = curio.selectedStyles || Object.keys(curio.stories || {});
    const newIndex = Store.state.currentStyleIndex - 1;
    if (newIndex >= 0) {
      switchStoryStyle(newIndex);
    }
  });

  dom.switcherNext.addEventListener('click', () => {
    const curio = Store.state.currentCurio;
    if (!curio) return;
    const styles = curio.selectedStyles || Object.keys(curio.stories || {});
    const newIndex = Store.state.currentStyleIndex + 1;
    if (newIndex < styles.length) {
      switchStoryStyle(newIndex);
    }
  });

  // ============================================
  // Story Regeneration
  // ============================================
  dom.btnRegenerate.addEventListener('click', async () => {
    const curio = Store.state.currentCurio;
    if (!curio) return;
    const style = (curio.selectedStyles || Object.keys(curio.stories || {}))[Store.state.currentStyleIndex];
    if (!style) return;

    const abortController = new AbortController();
    const onCancel = () => abortController.abort();

    if (dom.btnLoadingCancel) {
      dom.btnLoadingCancel.addEventListener('click', onCancel, { once: true });
      dom.btnLoadingCancel.style.display = '';
    }

    Store.state.isGenerating = true;
    showLoading(`重新生成「${style}」风格故事...`);

    try {
      const result = await API.generateAll(style, curio.itemName, curio.itemDescription || '', abortController.signal);

      hideLoading();

      if (!result.text) {
        showToast(`${style} 风格生成失败`, true);
        return;
      }

      curio.stories[style] = {
        text: result.text,
        imageUrl: result.imageUrl || (curio.stories[style]?.imageUrl || ''),
      };

      Storage.update(curio.id, {
        stories: { ...curio.stories },
      });

      Store.state.currentCurio = Storage.getById(curio.id);
      renderStoryCard(Store.state.currentCurio, Store.state.currentStyleIndex);
      showToast(`「${style}」风格故事已重新生成`);
    } catch (err) {
      hideLoading();
      if (String(err.message).includes('abort')) {
        showToast('已取消重新生成', true);
      } else {
        showToast(`重新生成失败: ${err.message}`, true);
      }
    } finally {
      if (dom.btnLoadingCancel) {
        dom.btnLoadingCancel.removeEventListener('click', onCancel);
        dom.btnLoadingCancel.style.display = 'none';
      }
      Store.state.isGenerating = false;
    }
  });

  // ============================================
  // Story Continuation
  // ============================================
  dom.btnContinue.addEventListener('click', async () => {
    const curio = Store.state.currentCurio;
    if (!curio) return;
    const style = (curio.selectedStyles || Object.keys(curio.stories || {}))[Store.state.currentStyleIndex];
    if (!style) return;
    const existingStory = curio.stories?.[style];
    if (!existingStory || !existingStory.text) {
      showToast('没有可续写的故事', true);
      return;
    }

    const abortController = new AbortController();
    const onCancel = () => abortController.abort();

    if (dom.btnLoadingCancel) {
      dom.btnLoadingCancel.addEventListener('click', onCancel, { once: true });
      dom.btnLoadingCancel.style.display = '';
    }

    Store.state.isGenerating = true;
    showLoading(`正在续写「${style}」风格故事...`);

    try {
      const continuation = await API.continueStory(style, existingStory.text, abortController.signal);

      hideLoading();

      if (!continuation) {
        showToast('续写失败，请重试', true);
        return;
      }

      const newText = existingStory.text + '\n\n' + continuation;
      curio.stories[style] = {
        ...existingStory,
        text: newText,
      };

      Storage.update(curio.id, {
        stories: { ...curio.stories },
      });

      Store.state.currentCurio = Storage.getById(curio.id);
      renderStoryCard(Store.state.currentCurio, Store.state.currentStyleIndex);
      showToast(`「${style}」风格故事已续写`);
    } catch (err) {
      hideLoading();
      if (String(err.message).includes('abort')) {
        showToast('已取消续写', true);
      } else {
        showToast(`续写失败: ${err.message}`, true);
      }
    } finally {
      if (dom.btnLoadingCancel) {
        dom.btnLoadingCancel.removeEventListener('click', onCancel);
        dom.btnLoadingCancel.style.display = 'none';
      }
      Store.state.isGenerating = false;
    }
  });

  // ============================================
  // Image to Data URL (通过本地代理绕过 CORS 限制)
  // ============================================
  async function imageToDataURL(url) {
    if (!url || url.startsWith('data:')) return url;
    try {
      const resp = await fetch(`/proxy-image?url=${encodeURIComponent(url)}`);
      if (resp.ok) {
        const blob = await resp.blob();
        return await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      }
    } catch (e) {
      console.warn('[imageToDataURL] proxy failed:', e.message || e);
    }
    return url;
  }

  // ============================================
  // Download Card
  // ============================================
  dom.btnDownload.addEventListener('click', async () => {
    const card = dom.storyCard;
    if (!card) return;

    try {
      showToast('正在生成卡片图片...');

      if (typeof html2canvas !== 'undefined') {
        const cardImage = dom.cardImage;
        const originalSrc = cardImage.src;
        const isExternal = originalSrc && !originalSrc.startsWith('data:');

        if (isExternal) {
          const dataUrl = await imageToDataURL(originalSrc);
          if (dataUrl !== originalSrc) {
            cardImage.src = dataUrl;
            await new Promise((resolve) => {
              cardImage.onload = resolve;
              cardImage.onerror = resolve;
            });
          }
        }

        const canvas = await html2canvas(card, {
          scale: 2,
          backgroundColor: '#e8e0d0',
          useCORS: true,
          allowTaint: true,
          logging: false,
        });

        if (isExternal) {
          cardImage.src = originalSrc;
        }

        const link = document.createElement('a');
        link.download = `curio-${Store.state.currentCurio?.itemName || 'card'}-${Date.now()}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
        showToast('卡片已下载');
      } else {
        showToast('请使用截图或浏览器打印功能保存卡片');
      }
    } catch (err) {
      showToast('下载失败，可尝试截图保存', true);
    }
  });

  // ============================================
  // Confirm Dialog
  // ============================================
  let pendingDeleteId = null;
  let pendingDeleteStyle = null;

  function showConfirmDialog(curioName, isStyleDelete, styleName) {
    pendingDeleteId = Store.state.currentCurio?.id || null;
    pendingDeleteStyle = isStyleDelete ? (styleName || null) : null;

    const curio = Store.state.currentCurio;
    const singleStyle = curio && (curio.selectedStyles || Object.keys(curio.stories || {})).length <= 1;

    if (isStyleDelete) {
      dom.confirmText.innerHTML = `确认删除藏品 <span class="item-name">「${curioName}」</span> 的 <span class="item-name">「${styleName}」</span> 风格吗？此操作不可恢复。`;
    } else if (singleStyle) {
      dom.confirmText.innerHTML = `确认删除藏品 <span class="item-name">「${curioName}」</span> 吗？此操作不可恢复。`;
    } else {
      dom.confirmText.innerHTML = `确认删除藏品 <span class="item-name">「${curioName}」</span> 的<strong>全部风格</strong>吗？此操作不可恢复。<br><small style="color:var(--ink-faint);font-size:14px">如需删除单个风格，请在下方卡片中操作</small>`;
    }

    dom.confirmDialog.classList.add('active');
    dom.btnConfirmDelete.focus();
  }

  function hideConfirmDialog() {
    dom.confirmDialog.classList.remove('active');
    pendingDeleteId = null;
    pendingDeleteStyle = null;
  }

  dom.btnConfirmCancel.addEventListener('click', hideConfirmDialog);

  dom.btnConfirmDelete.addEventListener('click', () => {
    if (!pendingDeleteId) return;
    const fromView = Store.state.currentView;
    const curioName = Store.state.currentCurio?.itemName || '';

    if (pendingDeleteStyle) {
      Store.removeStoryFromCurio(pendingDeleteId, pendingDeleteStyle);
      hideConfirmDialog();

      if (fromView === 'detail') {
        const updated = Storage.getById(pendingDeleteId);
        if (updated) {
          openCurioDetail(updated.id);
        } else {
          Store.state.currentCurio = null;
          switchView('hall');
        }
      } else if (fromView === 'story' || fromView === 'hall') {
        const updated = Storage.getById(pendingDeleteId);
        if (!updated) {
          Store.state.currentCurio = null;
          switchView('hall');
        } else {
          if (fromView === 'story') openStoryView(updated.id, 0);
          if (fromView === 'hall') { renderHall(); animateHallGallery(); }
        }
      }

      showToast(`「${curioName}」的「${pendingDeleteStyle}」风格已移除`);
      return;
    }

    Store.deleteCurio(pendingDeleteId);

    if (fromView === 'story' || fromView === 'detail') {
      Store.state.currentCurio = null;
      switchView('hall');
    } else if (fromView === 'hall') {
      renderHall();
      animateHallGallery();
    }

    hideConfirmDialog();
    showToast(`「${curioName}」已从档案馆中移除`);
  });

  // ============================================
  // Delete from Story View
  // ============================================
  dom.btnDeleteStory.addEventListener('click', () => {
    const curio = Store.state.currentCurio;
    if (!curio) return;
    showConfirmDialog(curio.itemName, false);
  });

  // ============================================
  // Delete from Detail View
  // ============================================
  dom.btnDeleteDetail.addEventListener('click', () => {
    const curio = Store.state.currentCurio;
    if (!curio) return;
    showConfirmDialog(curio.itemName, false);
  });

  // ============================================
  // Detail View
  // ============================================
  function openCurioDetail(curioId) {
    const curio = Store.getCurio(curioId);
    if (!curio) {
      showToast('藏品未找到', true);
      return;
    }

    Store.state.currentCurio = curio;
    dom.detailTitle.textContent = `${curio.itemName} · 全风格一览`;

    // Show description and tags
    const tags = curio.tags || [];
    const tagsHtml = tags.length > 0
      ? `<div class="gallery-item-tags" style="margin-top:8px">${tags.map(t => `<span class="tag">${t}</span>`).join('')}</div>`
      : '';
    const descHtml = curio.itemDescription
      ? `<p class="detail-desc">${curio.itemDescription}</p>`
      : '';
    const metaEl = document.getElementById('detail-meta');
    if (metaEl) {
      metaEl.innerHTML = descHtml + tagsHtml;
    }

    const favBtn = dom.btnFavDetail;
    favBtn.textContent = curio.favorited ? '★ 已收藏' : '♡ 收藏';

    dom.detailGallery.innerHTML = '';

    const styles = curio.selectedStyles || Object.keys(curio.stories || {});
    const multipleStyles = styles.length > 1;
    styles.forEach((style) => {
      const story = curio.stories?.[style];
      if (!story) return;

      const card = document.createElement('div');
      card.className = 'detail-card';
      card.innerHTML = `
        <img class="detail-card-thumb" src="${story.imageUrl || 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22400%22 height=%22300%22 fill=%22%23e8e0d0%22/%3E'}" alt="${style}" loading="lazy" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22400%22 height=%22300%22 fill=%22%23e8e0d0%22/%3E'">
        <span class="detail-card-style">${style}</span>
        <div class="detail-card-excerpt">${(story.text || '').slice(0, 100)}...</div>
        ${multipleStyles ? `<button class="detail-card-delete" data-delete-style="${style}" title="删除此风格">&#10007;</button>` : ''}
      `;

      card.addEventListener('click', (e) => {
        if (e.target.closest('[data-delete-style]')) return;
        const styleIdx = styles.indexOf(style);
        openStoryView(curio.id, styleIdx);
      });

      dom.detailGallery.appendChild(card);
    });

    gsap.fromTo(dom.detailGallery.children, {
      y: 24,
      opacity: 0,
    }, {
      y: 0,
      opacity: 1,
      duration: 0.4,
      ease: 'power2.out',
      stagger: 0.06,
      overwrite: 'auto',
    });

    switchView('detail');
  }

  // ============================================
  // Edit Curio
  // ============================================
  function openEditOverlay() {
    const curio = Store.state.currentCurio;
    if (!curio) return;
    dom.editName.value = curio.itemName || '';
    dom.editDesc.value = curio.itemDescription || '';
    dom.editOverlay.classList.add('active');
    dom.editName.focus();
  }

  function closeEditOverlay() {
    dom.editOverlay.classList.remove('active');
  }

  dom.btnEditDetail.addEventListener('click', openEditOverlay);
  dom.btnEditCancel.addEventListener('click', closeEditOverlay);

  dom.btnEditSave.addEventListener('click', () => {
    const curio = Store.state.currentCurio;
    if (!curio) return;

    const newName = dom.editName.value.trim();
    if (!newName) {
      showToast('物品名称不能为空', true);
      return;
    }

    const newDesc = dom.editDesc.value.trim();

    Storage.update(curio.id, {
      itemName: newName,
      itemDescription: newDesc,
    });

    Store.state.currentCurio = Storage.getById(curio.id);
    closeEditOverlay();
    openCurioDetail(curio.id);
    showToast('藏品信息已更新');
  });

  dom.editOverlay.addEventListener('click', (e) => {
    if (e.target === dom.editOverlay) closeEditOverlay();
  });

  // ============================================
  // Favorite Toggle
  // ============================================
  function toggleFavorite(curioId) {
    const curio = Storage.getById(curioId);
    if (!curio) return;
    const newVal = !curio.favorited;
    Storage.update(curioId, { favorited: newVal });
    Store.state.curioList = Storage.getAll();

    const current = Store.state.currentCurio;
    if (current && current.id === curioId) {
      Store.state.currentCurio = Storage.getById(curioId);
    }
  }

  dom.btnFavDetail.addEventListener('click', () => {
    const curio = Store.state.currentCurio;
    if (!curio) return;
    toggleFavorite(curio.id);
    openCurioDetail(curio.id);
    showToast(curio.favorited ? '已取消收藏' : '已收藏');
  });

  // ============================================
  // Export Modal
  // ============================================
  dom.btnExportOpen.addEventListener('click', () => {
    dom.exportModal.classList.add('active');
  });

  dom.btnExportCancel.addEventListener('click', () => {
    dom.exportModal.classList.remove('active');
  });

  dom.exportModal.addEventListener('click', (e) => {
    if (e.target === dom.exportModal) dom.exportModal.classList.remove('active');
  });

  dom.btnExportConfirm.addEventListener('click', () => {
    const format = document.querySelector('input[name="export-format"]:checked')?.value;
    if (format === 'readable') {
      const md = Storage.exportReadable();
      const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `curio-archive-${new Date().toISOString().slice(0, 10)}.md`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('Markdown 可读格式已导出');
    } else if (format === 'pdf') {
      renderPrintArchive();
    } else {
      const metaOnly = format === 'meta';
      Storage.exportJSON(metaOnly);
      showToast(metaOnly ? '元数据已导出（不含图片）' : '完整数据已导出');
    }
    dom.exportModal.classList.remove('active');
  });

  // ============================================
  // Theme (Dark Mode)
  // ============================================
  function initTheme() {
    const saved = localStorage.getItem('curio-theme');
    if (saved === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  }

  dom.btnThemeToggle.addEventListener('click', () => {
    const html = document.documentElement;
    const isDark = html.getAttribute('data-theme') === 'dark';
    if (isDark) {
      html.removeAttribute('data-theme');
      localStorage.setItem('curio-theme', 'light');
    } else {
      html.setAttribute('data-theme', 'dark');
      localStorage.setItem('curio-theme', 'dark');
    }
  });

  // ============================================
  // Batch Operations
  // ============================================
  let batchMode = false;
  let selectedIds = new Set();

  function enterBatchMode() {
    batchMode = true;
    dom.batchBar.classList.remove('hidden');
    dom.batchBar.querySelector('#batch-select-all').checked = false;
    selectedIds.clear();
    dom.batchCount.textContent = '已选 0 项';
    dom.btnBatchDelete.disabled = true;
    document.querySelectorAll('.gallery-item').forEach(item => {
      item.classList.add('batch-selectable');
      const cb = document.createElement('div');
      cb.className = 'batch-checkbox';
      cb.innerHTML = '<input type="checkbox">';
      cb.dataset.batchId = item.dataset.id;
      item.prepend(cb);
    });
  }

  function exitBatchMode() {
    batchMode = false;
    dom.batchBar.classList.add('hidden');
    selectedIds.clear();
    document.querySelectorAll('.gallery-item').forEach(item => {
      item.classList.remove('batch-selectable');
      const cb = item.querySelector('.batch-checkbox');
      if (cb) cb.remove();
    });
  }

  dom.btnBatchCancel.addEventListener('click', exitBatchMode);

  dom.batchSelectAll.addEventListener('change', (e) => {
    const checked = e.target.checked;
    document.querySelectorAll('.batch-checkbox input[type="checkbox"]').forEach(cb => {
      cb.checked = checked;
      const id = cb.closest('.batch-checkbox')?.dataset.batchId;
      if (id) {
        if (checked) selectedIds.add(id);
        else selectedIds.delete(id);
      }
    });
    dom.batchCount.textContent = `已选 ${selectedIds.size} 项`;
    dom.btnBatchDelete.disabled = selectedIds.size === 0;
  });

  dom.btnBatchDelete.addEventListener('click', () => {
    if (selectedIds.size === 0) return;
    if (confirm(`确定批量删除 ${selectedIds.size} 件藏品吗？此操作不可恢复！`)) {
      selectedIds.forEach(id => {
        Storage.remove(id);
      });
      Store.state.curioList = Storage.getAll();
      Store.state.currentCurio = null;
      exitBatchMode();
      renderHall();
      animateHallGallery();
      showToast(`已删除 ${selectedIds.size} 件藏品`);
    }
  });

  // ============================================
  // Timeline View
  // ============================================
  function renderTimeline() {
    const list = Store.getCurioList();
    if (list.length === 0) {
      dom.timelineContent.innerHTML = '<p style="text-align:center;padding:60px 20px;color:var(--ink-faint);font-size:18px;font-style:italic;">暂无藏品记录</p>';
      return;
    }

    const groups = {};
    list.forEach(curio => {
      const date = curio.createdAt ? curio.createdAt.slice(0, 10) : '未知日期';
      if (!groups[date]) groups[date] = [];
      groups[date].push(curio);
    });

    const sortedDates = Object.keys(groups).sort((a, b) => b.localeCompare(a));

    dom.timelineContent.innerHTML = '';
    sortedDates.forEach(date => {
      const group = document.createElement('div');
      group.className = 'timeline-group';

      const header = document.createElement('div');
      header.className = 'timeline-date-header';
      header.textContent = date;
      group.appendChild(header);

      groups[date].forEach(curio => {
        const styles = curio.selectedStyles || Object.keys(curio.stories || {});
        const firstStyle = styles[0] || '';
        const firstStory = curio.stories?.[firstStyle];
        const imageUrl = firstStory?.imageUrl || '';

        const item = document.createElement('div');
        item.className = 'timeline-item';
        item.dataset.id = curio.id;
        item.innerHTML = `
          <img class="timeline-item-thumb" src="${imageUrl || 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2250%22 height=%2250%22 fill=%22%23e8e0d0%22/%3E'}" alt="" loading="lazy" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2250%22 height=%2250%22 fill=%22%23e8e0d0%22/%3E'">
          <div class="timeline-item-info">
            <div class="timeline-item-name">${curio.itemName}</div>
            <div class="timeline-item-meta">${firstStyle} ${curio.favorited ? '⭐' : ''}</div>
          </div>
        `;

        item.addEventListener('click', () => {
          openCurioDetail(curio.id);
        });

        group.appendChild(item);
      });

      dom.timelineContent.appendChild(group);
    });
  }

  // ============================================
  // Onboarding
  // ============================================
  const ONBOARDING_STEPS = [
    { icon: '👋', title: '欢迎来到奇物档案馆', text: '每一件旧物都藏着一个被遗忘的故事。提交一件物品，AI 将用多种风格为它书写前世传奇。' },
    { icon: '📝', title: '提交藏品', text: '点击导航栏的「+」按钮，输入物品名称和描述，选择故事风格，AI 将为你生成精彩故事和配图。' },
    { icon: '🏠', title: '浏览藏品大厅', text: '所有藏品在档案馆大厅展示。你可以搜索、按风格筛选、标记收藏，或点击卡片查看详情。' },
    { icon: '📖', title: '阅读与切换', text: '在故事页，你可以切换不同风格阅读同一件物品的故事，下载故事卡片，或重新生成某个风格的故事。' },
    { icon: '⏳', title: '探索更多', text: '试试底部存储条的「清空」功能和导航栏的「时间线」视图，发掘更多玩法！' },
  ];

  let onboardingStep = 0;

  function startOnboarding() {
    const seen = localStorage.getItem('curio-onboarding-seen');
    if (seen) return;
    onboardingStep = 0;
    dom.onboardingOverlay.classList.add('active');
    renderOnboardingStep();
  }

  function renderOnboardingStep() {
    const step = ONBOARDING_STEPS[onboardingStep];
    dom.onboardingContent.innerHTML = `
      <div class="onboarding-step-icon">${step.icon}</div>
      <h3 class="onboarding-step-title">${step.title}</h3>
      <p class="onboarding-step-text">${step.text}</p>
    `;

    dom.btnOnboardingPrev.classList.toggle('hidden', onboardingStep === 0);
    dom.btnOnboardingNext.textContent = onboardingStep === ONBOARDING_STEPS.length - 1 ? '完成' : '下一步';

    dom.onboardingStepIndicator.innerHTML = ONBOARDING_STEPS.map((_, i) =>
      `<span class="${i === onboardingStep ? 'active' : ''}"></span>`
    ).join('');
  }

  dom.btnOnboardingNext.addEventListener('click', () => {
    if (onboardingStep < ONBOARDING_STEPS.length - 1) {
      onboardingStep++;
      renderOnboardingStep();
    } else {
      finishOnboarding();
    }
  });

  dom.btnOnboardingPrev.addEventListener('click', () => {
    if (onboardingStep > 0) {
      onboardingStep--;
      renderOnboardingStep();
    }
  });

  function finishOnboarding() {
    dom.onboardingOverlay.classList.remove('active');
    localStorage.setItem('curio-onboarding-seen', 'true');
  }

  dom.btnOnboardingSkip.addEventListener('click', finishOnboarding);

  dom.onboardingOverlay.addEventListener('click', (e) => {
    if (e.target === dom.onboardingOverlay) finishOnboarding();
  });

  // ============================================
  // Lightbox (Image Preview)
  // ============================================
  function openLightbox(src, alt) {
    dom.lightboxImage.src = src || '';
    dom.lightboxImage.alt = alt || '';
    dom.lightbox.classList.add('active');
  }

  function closeLightbox() {
    dom.lightbox.classList.remove('active');
    dom.lightboxImage.src = '';
  }

  dom.btnLightboxClose.addEventListener('click', closeLightbox);
  dom.lightbox.addEventListener('click', (e) => {
    if (e.target === dom.lightbox) closeLightbox();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (dom.lightbox.classList.contains('active')) closeLightbox();
    }
  });

  // Wire lightbox to card image and detail images
  dom.cardImage.addEventListener('click', () => {
    if (dom.cardImage.src && !dom.cardImage.src.includes('svg')) {
      openLightbox(dom.cardImage.src, dom.cardImage.alt);
    }
  });
  dom.cardImage.style.cursor = dom.cardImage.src && !dom.cardImage.src.includes('svg') ? 'pointer' : 'default';

  // ============================================
  // Unified Event Dispatcher
  // ============================================
  document.addEventListener('click', (e) => {
    const styleBtn = e.target.closest('[data-delete-style]');
    if (styleBtn) {
      e.preventDefault();
      e.stopPropagation();
      const styleName = styleBtn.dataset.deleteStyle;
      const curio = Store.state.currentCurio;
      if (!curio) return;
      pendingDeleteId = curio.id;
      pendingDeleteStyle = styleName;
      showConfirmDialog(curio.itemName, true, styleName);
      return;
    }

    const deleteBtn = e.target.closest('[data-delete]');
    if (deleteBtn) {
      e.preventDefault();
      e.stopPropagation();
      const id = deleteBtn.dataset.delete;
      const curio = Store.state.curioList.find((c) => c.id === id);
      if (!curio) return;
      Store.state.currentCurio = curio;
      pendingDeleteId = id;
      showConfirmDialog(curio.itemName, false);
      return;
    }

    const favBtn = e.target.closest('[data-fav]');
    if (favBtn) {
      e.preventDefault();
      e.stopPropagation();
      toggleFavorite(favBtn.dataset.fav);
      renderHall();
      return;
    }

    const clearBtn = e.target.closest('[data-clear-all]');
    if (clearBtn) {
      e.preventDefault();
      const count = Store.state.curioList.length;
      if (count === 0) {
        showToast('暂无数据可清理');
        return;
      }
      if (confirm(`确定清空全部 ${count} 件藏品吗？\\n\\n此操作不可恢复！`)) {
        Storage.clearAll();
        Store.state.curioList = Storage.getAll();
        Store.state.currentCurio = null;
        renderHall();
        animateHallGallery();
        showToast(`已清空 ${count} 件藏品`);
      }
      return;
    }

    if (e.target.closest('[data-view]')) {
      const view = e.target.closest('[data-view]').dataset.view;
      switchView(view);
      return;
    }

    if (e.target === dom.confirmDialog) {
      hideConfirmDialog();
      return;
    }
  });

  document.addEventListener('keydown', (e) => {
    if (Store.state.currentView === 'story') {
      if (e.key === 'ArrowLeft') dom.switcherPrev.click();
      if (e.key === 'ArrowRight') dom.switcherNext.click();
    }
    if (dom.confirmDialog.classList.contains('active')) {
      if (e.key === 'Escape') hideConfirmDialog();
    }
    if (dom.editOverlay.classList.contains('active')) {
      if (e.key === 'Escape') closeEditOverlay();
    }
  });

  // ============================================
  // Search & Filter
  // ============================================
  dom.searchInput.addEventListener('input', (e) => {
    Store.state.searchQuery = e.target.value;
    if (Store.state.currentView === 'hall') renderHall();
  });

  dom.filterStyle.addEventListener('change', (e) => {
    Store.state.filterStyle = e.target.value;
    if (Store.state.currentView === 'hall') renderHall();
  });

  dom.btnFavFilter.addEventListener('click', () => {
    Store.state.favOnly = !Store.state.favOnly;
    dom.btnFavFilter.textContent = Store.state.favOnly ? '★ 仅收藏' : '♡ 仅收藏';
    dom.btnFavFilter.classList.toggle('active', Store.state.favOnly);
    if (Store.state.currentView === 'hall') renderHall();
  });

  dom.tagFilter.addEventListener('input', (e) => {
    Store.state.filterTag = e.target.value;
    if (Store.state.currentView === 'hall') renderHall();
  });

  // ============================================
  // Print Archive (PDF Export)
  // ============================================
  function renderPrintArchive() {
    const list = Store.getCurioList();
    if (list.length === 0) {
      showToast('暂无藏品可导出', true);
      return;
    }

    // Remove existing print archive if any
    const existing = document.querySelector('.print-archive');
    if (existing) existing.remove();

    const archive = document.createElement('div');
    archive.className = 'print-archive';

    list.forEach((curio, index) => {
      const styles = curio.selectedStyles || Object.keys(curio.stories || {});
      styles.forEach((style) => {
        const story = curio.stories?.[style];
        if (!story || !story.text) return;

        const exhibitNum = String(index + 1).padStart(3, '0');
        const date = new Date(curio.createdAt);
        const dateStr = date.toLocaleDateString('zh-CN', {
          year: 'numeric', month: 'long', day: 'numeric',
        });

        const card = document.createElement('div');
        card.className = 'story-card';
        card.innerHTML = `
          <div class="card-border">
            <div class="card-inner">
              <div class="card-header">
                <span class="card-exhibit-number">藏品 No.${exhibitNum}</span>
                <span class="card-seal">★ 存档</span>
              </div>
              <div class="card-image-frame">
                <img src="${story.imageUrl || ''}" alt="${curio.itemName}" style="width:100%;height:240px;object-fit:cover;display:block;">
              </div>
              <div class="card-body">
                <h2 class="card-item-name">${curio.itemName}</h2>
                <div class="card-style-tag">${style}</div>
                <div class="card-text">${story.text.split('\n').filter(l => l.trim()).map(p => `<p>${p}</p>`).join('')}</div>
                <div class="card-footer">
                  <span class="card-date">${dateStr}</span>
                  <span class="card-archive-mark">AI 奇物档案馆</span>
                </div>
              </div>
            </div>
          </div>
        `;
        archive.appendChild(card);
      });
    });

    document.body.appendChild(archive);

    // Trigger print after a short delay to allow rendering
    setTimeout(() => {
      window.print();
      // Clean up after print dialog closes
      setTimeout(() => {
        if (archive.parentNode) archive.remove();
      }, 500);
    }, 300);
  }

  // ============================================
  // Hover Effects (GSAP)
  // ============================================
  function initHoverEffects() {
    document.addEventListener('mouseover', (e) => {
      const item = e.target.closest('.gallery-item');
      if (!item) return;

      gsap.to(item, {
        scale: 1.02,
        duration: 0.2,
        ease: 'power1.out',
        overwrite: 'auto',
      });
    });

    document.addEventListener('mouseout', (e) => {
      const item = e.target.closest('.gallery-item');
      if (!item) return;

      gsap.to(item, {
        scale: 1,
        duration: 0.2,
        ease: 'power1.out',
        overwrite: 'auto',
      });
    });
  }

  // ============================================
  // GSAP Timeline Registration
  // ============================================
  function registerTimelines() {
    const mainTl = gsap.timeline({ paused: true });

    mainTl.from('.hall-title', {
      y: 36,
      opacity: 0,
      duration: 0.6,
      ease: 'power3.out',
    }, 0);

    mainTl.from('.hall-subtitle', {
      y: 20,
      opacity: 0,
      duration: 0.5,
      ease: 'power2.out',
    }, 0.25);

    __timelines['main'] = mainTl;
  }

  // ============================================
  // Init
  // ============================================
  function init() {
    Store.init();

    initSubmitForm();
    initHoverEffects();
    initTheme();

    renderHall();

    registerTimelines();

    const mainTl = __timelines['main'];
    if (mainTl) {
      mainTl.play();
    }

    // Onboarding after a short delay
    setTimeout(startOnboarding, 800);
  }

  // Start
  document.addEventListener('DOMContentLoaded', init);
})();