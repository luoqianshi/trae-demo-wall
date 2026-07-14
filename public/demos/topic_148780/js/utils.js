// ============================================
// 工具函数
// ============================================
function escapeHtml(str) {
  if (str == null) return '';
  const div = document.createElement('div');
  div.textContent = String(str);
  return div.innerHTML;
}

function refreshIcons(container) {
  if (window.lucide && lucide.createIcons) {
    try {
      lucide.createIcons(container ? { root: container } : {});
    } catch (err) {
      console.error('refreshIcons error:', err);
    }
  }
}

// 备用图标刷新：手动替换，避免 createIcons 在动态 DOM 上出错
function refreshIconsSafe(container) {
  if (!window.lucide || !window.lucide.icons) return;

  const root = container || document.body;
  const elements = Array.from(root.querySelectorAll('[data-lucide]'));

  elements.forEach(el => {
    const name = el.getAttribute('data-lucide');
    if (!name) return;

    // 尝试原始名称（如 waves-ladder）和 PascalCase（如 WavesLadder）
    let iconFn = lucide.icons[name];
    if (!iconFn && name.includes('-')) {
      const pascalName = name.replace(/(^|-)([a-z])/g, (_, __, letter) => letter.toUpperCase());
      iconFn = lucide.icons[pascalName];
    }

    if (typeof iconFn !== 'function') {
      console.warn('Icon not found:', name);
      return;
    }

    try {
      const svg = iconFn({
        class: el.getAttribute('class') || '',
        width: 24,
        height: 24
      });

      if (svg && el.parentNode && el.parentNode.contains(el)) {
        const svgEl = typeof svg === 'string' ? createSvgFromString(svg) : svg;
        if (svgEl && svgEl.tagName.toLowerCase() === 'svg') {
          el.parentNode.replaceChild(svgEl, el);
        }
      }
    } catch (err) {
      console.error('refreshIconsSafe error for', name, err);
    }
  });
}

function createSvgFromString(str) {
  const div = document.createElement('div');
  div.innerHTML = str.trim();
  return div.firstChild;
}

// ============================================
// 工具函数
// ============================================

// ============================================
// Toast 提示
// ============================================

const TOAST_ICONS = {
  success: 'check-circle-2',
  error: 'alert-circle',
  warning: 'alert-triangle',
  info: 'info'
};

const TOAST_DURATION = {
  success: 1800,
  error: 2800,
  warning: 2500,
  info: 2200
};

function showToast(msg, type) {
  const toast = document.getElementById('kidgo-toast');
  if (!toast) return;
  const inner = toast.querySelector('.toast-inner');
  const icon = toast.querySelector('.toast-icon');
  const toastText = document.getElementById('toast-text');

  // 兼容旧调用（直接传入 type）以及新调用（带类型）
  const toastType = type || 'info';
  const iconName = TOAST_ICONS[toastType] || TOAST_ICONS.info;

  toastText.textContent = msg;

  // 重置类型 class
  inner.classList.remove('toast-success', 'toast-error', 'toast-warning', 'toast-info', 'toast-default');
  inner.classList.add('toast-' + toastType);

  // 替换图标
  if (icon) {
    icon.setAttribute('data-lucide', iconName);
  }

  // 触发出现动画
  toast.classList.remove('hiding');
  // 强制重排以重启动画
  void toast.offsetWidth;
  toast.classList.add('show');

  // 图标刷新（动态更新）
  try {
    if (window.lucide && lucide.createIcons) {
      lucide.createIcons({ root: inner });
    }
  } catch (err) {
    console.error('toast refreshIcons error:', err);
  }

  clearTimeout(window._toastTimer);
  const duration = TOAST_DURATION[toastType] || 2200;
  window._toastTimer = setTimeout(() => {
    toast.classList.add('hiding');
    setTimeout(() => {
      toast.classList.remove('show');
      toast.classList.remove('hiding');
    }, 200);
  }, duration);
}

// 通过消息 key 智能显示 Toast（自动匹配类型）
function showMessage(key, fallbackType) {
  const msg = (typeof TOAST_MESSAGES !== 'undefined' && TOAST_MESSAGES[key]) || key;
  const type = (typeof TOAST_TYPES !== 'undefined' && TOAST_TYPES[key]) || fallbackType || 'info';
  showToast(msg, type);
}

// 数字滚动动画
// el: 目标元素
// from: 起始值
// to: 结束值
// duration: 动画时长（默认 500ms）
// suffix: 后缀（如 '%'）
function animateNumber(el, from, to, duration, suffix) {
  if (!el) return;
  duration = duration || 500;
  suffix = suffix || '';

  const start = performance.now();
  const delta = to - from;

  function step(now) {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    // ease-out 缓动
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = Math.round(from + delta * eased);
    el.textContent = current + suffix;
    if (progress < 1) {
      requestAnimationFrame(step);
    } else {
      el.textContent = to + suffix;
    }
  }

  requestAnimationFrame(step);
}

function switchTab(tab) {
  currentTab = tab;

  // 切换页面视图
  const pageMap = {
    'home': 'page-home',
    'recommend': 'page-recommend',
    'share': 'page-share',
    'collection': 'page-collection',
    'archive': 'page-archive',
    'detail': 'page-detail'
  };

  const prevActive = document.querySelector('.page-view.active');
  const targetPage = pageMap[tab];
  const targetEl = targetPage ? document.getElementById(targetPage) : null;

  // 移除所有 active
  document.querySelectorAll('.page-view').forEach(v => {
    v.classList.remove('active');
    v.classList.remove('fade-in-stagger');
  });

  if (targetEl) {
    // 重置目标页面的进入动画（强制重排以重启动画）
    targetEl.classList.remove('page-enter');
    void targetEl.offsetWidth;
    targetEl.classList.add('active');
    targetEl.classList.add('page-enter');

    // 内容子元素依次淡入（仅在首次进入时启用，避免每次切换都重新跑动画）
    if (tab === 'home' || tab === 'collection' || tab === 'archive') {
      targetEl.classList.add('fade-in-stagger');
    }
  }

  // 更新底部 Tab 状态
  document.querySelectorAll('.tab-item').forEach(item => {
    item.classList.remove('active');
    if (item.dataset.tab === tab) {
      item.classList.add('active');
    }
  });

  // 切换到档案页时刷新数据
  if (tab === 'archive' && typeof renderArchivePage === 'function') {
    renderArchivePage();
  }
  
  // 切换到收藏页时刷新数据
  if (tab === 'collection') {
    if (typeof loadCollections === 'function') loadCollections();
    if (typeof renderCollectionList === 'function') renderCollectionList();
    if (typeof updateCollectionCount === 'function') updateCollectionCount();
  }
  
  // 切换到分享页时更新地点信息（调用updateSharePage而非goToShare，避免递归）
  if (tab === 'share') {
    if (typeof updateSharePage === 'function') updateSharePage();
  }
  
  // 切换到推荐页时的处理
  if (tab === 'recommend') {
    if (window.isLoadingRecommendations) {
      // 正在加载中，不干预loading/result状态，交给runLoadingAnimation控制
    } else if (currentRecommendations && currentRecommendations.length > 0) {
      // 有结果，直接渲染（用户手动切换Tab的情况）
      if (typeof renderRecommendations === 'function') {
        renderRecommendations();
      }
      document.getElementById('p2-loading').style.display = 'none';
      document.getElementById('p2-result').style.display = 'block';
    } else {
      // 空状态（用户直接切换Tab且没有推荐结果）
      const listEl = document.getElementById('recommendations-list');
      if (listEl) {
        listEl.innerHTML = '<div class="p2-empty-state" style="text-align:center;padding:40px 20px;"><div style="font-size:48px;margin-bottom:12px;">🌿</div><div style="font-size:16px;font-weight:600;margin-bottom:8px;">还没有推荐结果</div><div style="font-size:14px;color:var(--color-text-secondary);">回到首页说说你的想法，搭子帮你找好去处~</div></div>';
      }
      document.getElementById('p2-loading').style.display = 'none';
      document.getElementById('p2-result').style.display = 'block';
    }
  }

  // 特殊处理：分享页不显示在底部 tab，但要保证 tab 状态正确
  const mainTabs = ['home', 'recommend', 'collection', 'archive'];
  if (!mainTabs.includes(tab)) {
    // 保持之前的 tab 高亮
    document.querySelectorAll('.tab-item').forEach(item => {
      item.classList.remove('active');
    });
  }

  window.scrollTo(0, 0);

  // 进入档案页时触发进度条动画
  if (tab === 'archive') {
    setTimeout(animateProgressBars, 300);
  }

  // 切换页面后重新初始化图标（仅刷新当前页容器，避免全局 DOM 遍历）
  if (typeof lucide !== 'undefined' && lucide.createIcons && targetEl) {
    setTimeout(() => {
      lucide.createIcons({ root: targetEl });
    }, 100);
  }

  // 切换页面时重置首页快捷指令按钮选中态
  document.querySelectorAll('.quick-cmd-btn').forEach(b => b.classList.remove('is-active'));
}
