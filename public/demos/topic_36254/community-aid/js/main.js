// 主入口模块
window.CommunityAidMain = (function() {
  // 初始化：加载数据、初始化各模块、渲染首页、绑定事件
  async function init() {
    try {
      // 初始化数据
      await CommunityAidData.initData();

      // 初始化各功能模块
      CommunityAidAuth.init();
      CommunityAidVolunteer.init();
      CommunityAidHelp.init();
      CommunityAidDashboard.init();

      // 渲染首页内容
      renderVolunteers();
      renderStories();
      renderSmiles();
      initSmileStoryModal();

      // Hero 首屏动效：漂浮人脸 + 数字滚动 + 鼠标视差
      initHeroFaces();
      initHeroStats();
      initHeroParallax();

      // 回到顶部按钮 + 图片兜底 + 主题切换
      initBackToTop();
      initImageFallback();
      initThemeToggle();

      // 监听数据变更事件，刷新首页志愿者列表
      document.addEventListener('volunteer:registered', function() {
        renderVolunteers();
      });

      // help:published 事件：首页不显示需求列表，无需操作

      // 设置滚动动画
      setupScrollAnimation();

      console.log('邻里帮帮团初始化完成');
    } catch (e) {
      console.error('初始化失败:', e);
      CommunityAidUI.showToast('页面加载失败，请刷新重试');
    }
  }

  // 渲染志愿者风采（取前8个）
  function renderVolunteers() {
    const container = document.getElementById('volunteers-list');
    if (!container) return;

    const volunteers = CommunityAidData.getVolunteers();

    if (!volunteers || volunteers.length === 0) {
      container.innerHTML = '<div class="no-data">暂无志愿者数据</div>';
      return;
    }

    // 取前8个展示
    const displayVolunteers = volunteers.slice(0, 8);

    container.innerHTML = '';
    displayVolunteers.forEach(function(v) {
      const hours = v.hours || 0;
      const stars = CommunityAidUI.getStarRating(hours);
      const starStr = '★'.repeat(stars) + '☆'.repeat(5 - stars);
      const colors = CommunityAidUI.generateAvatarColor(v.name);
      const firstChar = v.name ? v.name.charAt(0) : '?';

      // 头像：优先使用真实头像图片，无图时用渐变圆+首字
      var avatarHtml;
      if (v.imageUrl) {
        avatarHtml = '<div class="volunteer-avatar volunteer-avatar-img">' +
          '<img src="' + v.imageUrl + '" alt="' + CommunityAidUI.escapeHtml(v.name) + '" loading="lazy">' +
          '</div>';
      } else {
        avatarHtml = '<div class="volunteer-avatar" style="background: linear-gradient(135deg, ' + colors[0] + ', ' + colors[1] + ')">' + CommunityAidUI.escapeHtml(firstChar) + '</div>';
      }

      const card = document.createElement('div');
      card.className = 'volunteer-showcase-card';
      card.innerHTML =
        avatarHtml +
        '<div class="volunteer-name">' + CommunityAidUI.escapeHtml(v.name) + '</div>' +
        '<div class="volunteer-skill">' + CommunityAidUI.escapeHtml(v.skill) + '</div>' +
        '<div class="volunteer-hours">服务时长: ' + hours + '小时</div>' +
        '<div class="volunteer-stars">' + starStr + '</div>';
      container.appendChild(card);
    });
  }

  // 渲染社区故事
  function renderStories() {
    const container = document.getElementById('stories-list');
    if (!container) return;

    const stories = CommunityAidData.getStories();

    if (!stories || stories.length === 0) {
      container.innerHTML = '<div class="no-data">暂无故事内容</div>';
      return;
    }

    container.innerHTML = '';
    stories.forEach(function(s) {
      const card = document.createElement('div');
      card.className = 'story-card';
      card.innerHTML =
        '<h4 class="story-title">' + CommunityAidUI.escapeHtml(s.title) + '</h4>' +
        '<p class="story-content">' + CommunityAidUI.escapeHtml(s.content) + '</p>' +
        '<div class="story-meta">' +
          '<span class="story-author">作者: ' + CommunityAidUI.escapeHtml(s.author) + '</span>' +
          '<span class="story-date">' + CommunityAidUI.escapeHtml(s.date) + '</span>' +
        '</div>';
      container.appendChild(card);
    });
  }

  // 渲染劳动者笑脸气泡墙
  function renderSmiles() {
    const wall = document.getElementById('smiles-wall');
    const countEl = document.getElementById('smiles-count');
    if (!wall) return;

    const smiles = CommunityAidData.getSmiles();
    if (!smiles || smiles.length === 0) {
      wall.innerHTML = '<div class="no-data">暂无笑脸数据</div>';
      if (countEl) countEl.textContent = '0';
      return;
    }

    // 更新统计
    if (countEl) countEl.textContent = smiles.length;

    wall.innerHTML = '';
    // 根据size确定气泡直径，用于位置计算
    const sizeMap = { large: 120, medium: 90, small: 70 };
    // 预定义位置百分比（相对容器），错落分布
    const positions = [
      { top: 8, left: 8 }, { top: 5, left: 38 }, { top: 12, left: 68 },
      { top: 30, left: 22 }, { top: 25, left: 55 }, { top: 35, left: 82 },
      { top: 55, left: 5 }, { top: 50, left: 35 }, { top: 58, left: 65 },
      { top: 75, left: 18 }, { top: 72, left: 48 }, { top: 80, left: 78 },
      { top: 18, left: 88 }, { top: 45, left: 75 }, { top: 65, left: 30 },
      { top: 88, left: 55 }, { top: 22, left: 15 }, { top: 42, left: 50 }
    ];

    smiles.forEach(function(s, index) {
      const bubble = document.createElement('div');
      const sizeClass = 'size-' + (s.size || 'medium');
      bubble.className = 'smile-bubble ' + sizeClass;
      bubble.setAttribute('data-id', s.id);

      var pos = positions[index % positions.length];
      bubble.style.top = pos.top + '%';
      bubble.style.left = pos.left + '%';
      bubble.style.animationDelay = (index * 0.15) + 's, ' + (index * 0.15) + 's';
      bubble.style.animationDuration = (7 + (index % 5)) + 's, 0.8s';

      if (s.imageUrl) {
        // 深色半透明背景衬托人脸图片，白色文字清晰可读
        bubble.style.background = 'rgba(26, 20, 40, 0.85)';
        bubble.innerHTML =
          '<img class="smile-face" src="' + s.imageUrl + '" alt="' + CommunityAidUI.escapeHtml(s.name) + '" loading="lazy">' +
          '<div class="smile-name">' + CommunityAidUI.escapeHtml(s.name) + '</div>' +
          '<div class="smile-occupation">' + CommunityAidUI.escapeHtml(s.occupation) + '</div>' +
          '<div class="smile-tooltip">' + CommunityAidUI.escapeHtml(s.occupation) + ' · ' + CommunityAidUI.escapeHtml(s.quote) + '</div>';
      } else {
        // fallback: 渐变圆形+姓名首字
        var firstChar = s.name ? s.name.charAt(0) : '?';
        bubble.style.background = 'radial-gradient(circle at 30% 30%, ' + (s.color || '#FF6B35') + ', ' + darkenColor(s.color || '#FF6B35', 20) + ')';
        bubble.innerHTML =
          '<div class="smile-emoji">' + CommunityAidUI.escapeHtml(firstChar) + '</div>' +
          '<div class="smile-name">' + CommunityAidUI.escapeHtml(s.name) + '</div>' +
          '<div class="smile-occupation">' + CommunityAidUI.escapeHtml(s.occupation) + '</div>' +
          '<div class="smile-tooltip">' + CommunityAidUI.escapeHtml(s.occupation) + ' · ' + CommunityAidUI.escapeHtml(s.quote) + '</div>';
      }

      // 点击弹出故事
      bubble.addEventListener('click', function() {
        showSmileStory(s);
      });

      wall.appendChild(bubble);
    });
  }

  // 简单颜色加深工具（用于渐变背景深色端）
  function darkenColor(hex, percent) {
    if (!hex || hex.charAt(0) !== '#') return hex;
    const num = parseInt(hex.slice(1), 16);
    let r = (num >> 16) & 0xff;
    let g = (num >> 8) & 0xff;
    let b = num & 0xff;
    r = Math.max(0, Math.floor(r * (1 - percent / 100)));
    g = Math.max(0, Math.floor(g * (1 - percent / 100)));
    b = Math.max(0, Math.floor(b * (1 - percent / 100)));
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }

  // 初始化笑脸故事弹窗关闭逻辑
  function initSmileStoryModal() {
    const modal = document.getElementById('smile-story-modal');
    if (!modal) return;
    const closeBtn = modal.querySelector('.modal-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', function() {
        CommunityAidUI.closeModal('smile-story-modal');
      });
    }
    modal.addEventListener('click', function(e) {
      if (e.target === modal) {
        CommunityAidUI.closeModal('smile-story-modal');
      }
    });
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && modal.classList.contains('show')) {
        CommunityAidUI.closeModal('smile-story-modal');
      }
    });
  }

  // 显示劳动者故事
  function showSmileStory(smile) {
    const body = document.getElementById('smile-story-body');
    if (!body) return;

    if (smile.imageUrl) {
      body.innerHTML =
        '<img class="smile-story-face" src="' + smile.imageUrl + '" alt="' + CommunityAidUI.escapeHtml(smile.name) + '">' +
        '<div class="smile-story-name">' + CommunityAidUI.escapeHtml(smile.name) + ' · ' + smile.age + '岁</div>' +
        '<div class="smile-story-occupation">' + CommunityAidUI.escapeHtml(smile.occupation) + '</div>' +
        '<div class="smile-story-quote">"' + CommunityAidUI.escapeHtml(smile.quote) + '"</div>' +
        '<p class="smile-story-text">' + CommunityAidUI.escapeHtml(smile.story) + '</p>';
    } else {
      var firstChar = smile.name ? smile.name.charAt(0) : '?';
      body.innerHTML =
        '<div class="smile-story-avatar" style="background: radial-gradient(circle at 30% 30%, ' + smile.color + ', ' + darkenColor(smile.color, 25) + ')">' + CommunityAidUI.escapeHtml(firstChar) + '</div>' +
        '<div class="smile-story-name">' + CommunityAidUI.escapeHtml(smile.name) + ' · ' + smile.age + '岁</div>' +
        '<div class="smile-story-occupation">' + CommunityAidUI.escapeHtml(smile.occupation) + '</div>' +
        '<div class="smile-story-quote">"' + CommunityAidUI.escapeHtml(smile.quote) + '"</div>' +
        '<p class="smile-story-text">' + CommunityAidUI.escapeHtml(smile.story) + '</p>';
    }
    CommunityAidUI.openModal('smile-story-modal');
  }

  // 回到顶部按钮
  function initBackToTop() {
    const btn = document.getElementById('back-to-top');
    if (!btn) return;
    let ticking = false;
    window.addEventListener('scroll', function() {
      if (!ticking) {
        window.requestAnimationFrame(function() {
          if (window.scrollY > 300) {
            btn.classList.add('show');
          } else {
            btn.classList.remove('show');
          }
          ticking = false;
        });
        ticking = true;
      }
    });
    btn.addEventListener('click', function() {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // 主题切换
  function initThemeToggle() {
    const btn = document.getElementById('theme-toggle');
    if (!btn) return;
    const saved = localStorage.getItem('theme');
    if (saved === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
      btn.textContent = '☀️';
    }
    btn.addEventListener('click', function() {
      const current = document.documentElement.getAttribute('data-theme');
      if (current === 'dark') {
        document.documentElement.removeAttribute('data-theme');
        btn.textContent = '🌙';
        localStorage.setItem('theme', 'light');
        CommunityAidUI.showToast('已切换至浅色模式');
      } else {
        document.documentElement.setAttribute('data-theme', 'dark');
        btn.textContent = '☀️';
        localStorage.setItem('theme', 'dark');
        CommunityAidUI.showToast('已切换至深色模式');
      }
    });
  }

  // 图片加载错误处理：兜底显示默认头像
  function initImageFallback() {
    const fallbackAvatar = 'data:image/svg+xml;utf8,' + encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">' +
      '<rect width="200" height="200" fill="#FFE5D9"/>' +
      '<circle cx="100" cy="80" r="40" fill="#FFB89A"/>' +
      '<circle cx="100" cy="160" r="60" fill="#FFB89A"/>' +
      '<text x="100" y="190" text-anchor="middle" font-size="14" fill="#FF6B35">笑容</text>' +
      '</svg>'
    );
    document.addEventListener('error', function(e) {
      if (e.target && e.target.tagName === 'IMG' && !e.target.dataset.fallback) {
        e.target.dataset.fallback = '1';
        e.target.src = fallbackAvatar;
      }
    }, true);
  }

  // 滚动动画：使用 IntersectionObserver 监听元素进入视口
  function setupScrollAnimation() {
    // 为主要 section 添加动画类
    const sections = document.querySelectorAll('section');
    sections.forEach(function(section) {
      section.classList.add('animate-on-scroll');
    });

    // 浏览器不支持 IntersectionObserver 时静默降级
    if (!('IntersectionObserver' in window)) return;

    const observer = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    }, { threshold: 0.1 });

    const animateElements = document.querySelectorAll('.animate-on-scroll');
    animateElements.forEach(function(el) {
      observer.observe(el);
    });
  }

  // Hero 漂浮人脸气泡：从 smiles 数据取前 8 张注入 #hero-faces
  function initHeroFaces() {
    const container = document.getElementById('hero-faces');
    if (!container) return;
    const smiles = CommunityAidData.getSmiles();
    if (!smiles || smiles.length === 0) return;
    smiles.slice(0, 8).forEach(function(s, i) {
      const img = document.createElement('img');
      img.src = s.imageUrl;
      img.className = 'hero-face';
      img.alt = '';
      img.style.left = (10 + Math.random() * 80) + '%';
      img.style.animationDuration = (12 + Math.random() * 8) + 's';
      img.style.animationDelay = (i * 1.5) + 's';
      const size = 80 + Math.random() * 50;
      img.style.width = img.style.height = size + 'px';
      container.appendChild(img);
    });
  }

  // Hero 统计数字滚动计数动画
  function initHeroStats() {
    const nums = document.querySelectorAll('.hero-stat-num');
    nums.forEach(function(el) {
      const target = parseInt(el.getAttribute('data-target'), 10);
      if (isNaN(target)) return;
      let current = 0;
      const step = Math.max(1, Math.ceil(target / 40));
      const timer = setInterval(function() {
        current += step;
        if (current >= target) { current = target; clearInterval(timer); }
        el.textContent = current;
      }, 30);
    });
  }

  // Hero 鼠标视差：光晕球随鼠标移动产生不同幅度位移
  function initHeroParallax() {
    const hero = document.getElementById('hero');
    if (!hero) return;
    const orbs = hero.querySelectorAll('.hero-orb');
    if (!orbs.length) return;
    let raf = null;
    hero.addEventListener('mousemove', function(e) {
      if (raf) return;
      raf = requestAnimationFrame(function() {
        const rect = hero.getBoundingClientRect();
        const mx = (e.clientX - rect.left) / rect.width - 0.5;
        const my = (e.clientY - rect.top) / rect.height - 0.5;
        orbs.forEach(function(orb, i) {
          const depth = (i + 1) * 20;
          orb.style.transform = 'translate(' + (mx * depth) + 'px, ' + (my * depth) + 'px)';
        });
        raf = null;
      });
    });
    hero.addEventListener('mouseleave', function() {
      orbs.forEach(function(orb) { orb.style.transform = ''; });
    });
  }

  return {
    init: init,
    renderVolunteers: renderVolunteers,
    renderStories: renderStories,
    renderSmiles: renderSmiles
  };
})();

// DOMContentLoaded 时启动应用
document.addEventListener('DOMContentLoaded', function() {
  CommunityAidMain.init();
});
