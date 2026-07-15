const app = {
  currentPage: 'explore',
  currentExploreTab: 'hot',
  currentFollowingTab: 'following',
  currentSort: 'recommend',
  interestExpanded: false,
  selectedDate: null,
  selectedInterestTags: [],
  isVerified: false,
  pageHistory: [],
  trackedSchedules: {}, // { friendId: Set(scheduleIdx) }

  showToast(text) {
    const old = document.getElementById('appToast');
    if (old) old.remove();
    const toast = document.createElement('div');
    toast.id = 'appToast';
    toast.className = 'app-toast';
    toast.textContent = text;
    document.body.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('show'));
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 1800);
  },

  init() {
    this.bindNavEvents();
    this.renderPage('explore');
    this.bindModalEvents();
  },

  bindNavEvents() {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
      item.addEventListener('click', () => {
        const page = item.dataset.page;
        if (page) {
          this.navigateTo(page);
        }
      });
    });
  },

  navigateTo(page) {
    this.pageHistory = [];
    this.currentPage = page;
    if (page === 'schedule') {
      const today = new Date();
      this.selectedDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    }
    this.renderPage(page);

    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
      item.classList.toggle('active', item.dataset.page === page);
    });
  },

  renderPage(page) {
    const container = document.getElementById('appContent');
    container.innerHTML = '';

    switch (page) {
      case 'explore':
        container.innerHTML = this.renderExplorePage();
        this.bindExploreEvents();
        break;
      case 'messages':
        container.innerHTML = this.renderMessagesPage();
        this.bindMessagesEvents();
        break;
      case 'schedule':
        container.innerHTML = this.renderSchedulePage();
        this.bindScheduleEvents();
        break;
      case 'space':
        container.innerHTML = this.renderSpacePage();
        this.bindSpaceEvents();
        break;
      case 'profile':
        container.innerHTML = this.renderProfilePage();
        this.bindProfileEvents();
        break;
      case 'activityDetail':
        break;
      case 'diaryDetail':
        break;
      default:
        container.innerHTML = this.renderExplorePage();
        this.bindExploreEvents();
    }
  },

  bindPageEvents(page) {
    // Page-specific events are bound in individual render functions
  },

  // ===== EXPLORE PAGE =====
  renderExplorePage() {
    return `
      <div class="explore-page">
        <div class="explore-header">
          <div class="explore-search">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input type="text" placeholder="搜索活动、话题、用户...">
            <div class="explore-tab-icon" id="interestSettingsBtn">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="3"/>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
              </svg>
            </div>
          </div>
          <div class="explore-tabs">
            <div class="explore-tab ${this.currentExploreTab === 'hot' ? 'active' : ''}" data-tab="hot">热门</div>
            <div class="explore-tab ${this.currentExploreTab === 'recommend' ? 'active' : ''}" data-tab="recommend">推荐</div>
            <div class="explore-tab ${this.currentExploreTab === 'following' ? 'active' : ''}" data-tab="following">关注</div>
          </div>
        </div>
        <div class="explore-content" id="exploreContent">
          ${this.getExploreTabContent()}
        </div>
      </div>
    `;
  },

  getExploreTabContent() {
    switch (this.currentExploreTab) {
      case 'hot':
        return this.renderHotTab();
      case 'recommend':
        return this.renderRecommendTab();
      case 'following':
        return this.renderFollowingTab();
      default:
        return this.renderHotTab();
    }
  },

  renderHotTab() {
    const rankings = mockData.hotRankings;
    let listHtml = rankings.map((item, index) => {
      const tagHtml = item.tag ? `<span class="hot-tag ${item.tag}">${item.tag === 'hot' ? '热' : item.tag === 'fire' ? '爆' : item.tag === 'new' ? '新' : ''}</span>` : '';
      const changeHtml = item.change === 'up'
        ? '<span class="hot-change up">▲</span>'
        : item.change === 'down'
          ? '<span class="hot-change down">▼</span>'
          : item.change === 'new'
            ? '<span class="hot-change new">新</span>'
            : '';
      return `
        <div class="hot-carousel-item" data-rank="${item.rank}" data-index="${index}" data-hot-id="${item.rank}">
          <div class="hot-carousel-rank">${item.rank}</div>
          <div class="hot-carousel-card">
            <div class="hot-carousel-cover" style="background: ${item.gradient}">
              <span class="hot-carousel-emoji">${item.emoji}</span>
            </div>
            <div class="hot-carousel-info">
              <div class="hot-carousel-title">${item.title}${tagHtml}</div>
              <div class="hot-carousel-meta">
                <span>${item.isOnline ? '🔗 ' + item.website : '📍 ' + item.location}</span>
                <span class="hot-carousel-heat">${item.heat} 人关注${changeHtml}</span>
              </div>
            </div>
          </div>
        </div>
      `;
    }).join('');

    const banners = [
      { label: '热门推荐', title: '全世界最有趣的活动在这里', desc: '每日精选热门内容，发现身边好玩法', emoji: '🌍', gradient: 'linear-gradient(135deg, #FF8C42, #FF6B6B)' },
      { label: '重要资讯', title: '北京周末暴雨预警', desc: '本周末有大到暴雨，户外活动请注意安全', emoji: '🌧️', gradient: 'linear-gradient(135deg, #4A90D9, #357ABD)' },
      { label: '奖金招募', title: '牙周炎治疗招募受试者', desc: '三甲医院临床研究，补贴3000元', emoji: '🦷', gradient: 'linear-gradient(135deg, #E8556B, #D63852)' },
      { label: '重要资讯', title: '798艺术区免费开放日', desc: '本月20号免门票，限量预约先到先得', emoji: '🖼️', gradient: 'linear-gradient(135deg, #9B59B6, #7D3C98)' },
      { label: '奖金招募', title: '睡眠质量研究志愿者', desc: '北大心理学系实验，参与奖励800元', emoji: '😴', gradient: 'linear-gradient(135deg, #2ECC71, #27AE60)' }
    ];
    const bannerIdx = this.hotBannerIdx || 0;
    const current = banners[bannerIdx];

    return `
      <div class="hot-section">
        <div class="hot-banner hot-banner-carousel" id="hotBannerCarousel" style="background: ${current.gradient}">
          <div class="hot-banner-content">
            <span class="hot-banner-emoji">${current.emoji}</span>
            <div class="hot-banner-text">
              <span class="hot-banner-label">${current.label}</span>
              <div class="hot-banner-title">${current.title}</div>
              <div class="hot-banner-desc">${current.desc}</div>
            </div>
          </div>
          <div class="hot-banner-dots">
            ${banners.map((_, i) => `<span class="hot-banner-dot ${i === bannerIdx ? 'active' : ''}" data-banner-idx="${i}"></span>`).join('')}
          </div>
        </div>
        <div class="hot-carousel" id="hotCarousel">
          ${listHtml}
          <div class="hot-carousel-footer">推荐有更多精彩活动</div>
        </div>
      </div>
    `;
  },

  renderRecommendTab() {
    let activities = [...mockData.activities];

    if (this.currentSort === 'distance') {
      activities.sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance));
    } else if (this.currentSort === 'popular') {
      activities.sort((a, b) => b.currentParticipants - a.currentParticipants);
    } else if (this.currentSort === 'fun') {
      activities.sort((a, b) => b.fee - a.fee);
    }

    if (this.selectedInterestTags.length > 0) {
      activities = activities.filter(a =>
        a.tags.some(t => this.selectedInterestTags.includes(t)) ||
        this.selectedInterestTags.includes(a.category)
      );
    }

    const leftCol = [];
    const rightCol = [];
    activities.forEach((activity, index) => {
      const card = this.renderActivityCard(activity);
      if (index % 2 === 0) {
        leftCol.push(card);
      } else {
        rightCol.push(card);
      }
    });

    const interestExpandedHtml = this.interestExpanded ? `
      <div class="interest-expand-panel">
        <div class="interest-tags">
          <button class="interest-tag-chip ${this.selectedInterestTags.length === 0 ? 'active' : ''}" data-tag="全部">全部</button>
          ${['运动', '科普', 'AI', '美食', '探店', '旅行', '拼团', '竞赛', '展览', '社交'].map(tag => `
            <button class="interest-tag-chip ${this.selectedInterestTags.includes(tag) ? 'active' : ''}" data-tag="${tag}">${tag}</button>
          `).join('')}
        </div>
        <button class="interest-confirm-btn" id="interestConfirmBtn">确认</button>
      </div>
    ` : '';

    const interestActive = this.selectedInterestTags.length > 0;

    return `
      <div class="sort-bar">
        <button class="sort-btn ${this.currentSort === 'distance' ? 'active' : ''}" data-sort="distance">距离最近</button>
        <button class="sort-btn ${this.currentSort === 'popular' ? 'active' : ''}" data-sort="popular">人气最高</button>
        <button class="sort-btn ${this.currentSort === 'fun' ? 'active' : ''}" data-sort="fun">有奖金</button>
        <button class="sort-btn ${interestActive ? 'active' : ''}" data-sort="interest">兴趣${interestActive ? ` (${this.selectedInterestTags.length})` : ''}</button>
      </div>
      ${interestExpandedHtml}
      <div class="waterfall">
        <div class="waterfall-column">${leftCol.join('')}</div>
        <div class="waterfall-column">${rightCol.join('')}</div>
      </div>
    `;
  },

  renderActivityCard(activity) {
    const percent = Math.round((activity.currentParticipants / activity.maxParticipants) * 100);
    const weekday = this.getWeekday(activity.date);
    const dateStr = `${weekday} ${activity.date.slice(5).replace('-', '/')}`;
    const joined = activity.isJoined;

    return `
      <div class="activity-card" data-activity-id="${activity.id}">
        <div class="activity-card-cover">
          <span>${activity.coverEmoji}</span>
          <div class="activity-card-cover-category">${activity.category}</div>
          <div class="activity-card-cover-anim">${activity.host.avatarEmoji}</div>
        </div>
        <div class="activity-card-content">
          <div class="activity-card-title">${activity.title}</div>
          <div class="activity-card-host">
            <div class="activity-card-host-avatar">${activity.host.avatarEmoji}</div>
            <div class="activity-card-host-name">${activity.host.name}</div>
            ${activity.host.isVerified ? `<div class="activity-card-badge">✓ 认证</div>` : ''}
          </div>
          <div class="activity-card-meta">
            <div class="activity-card-meta-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
              ${activity.location}
            </div>
            <div class="activity-card-meta-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              ${dateStr}
            </div>
          </div>
          <div class="activity-card-progress">
            <div class="activity-card-progress-bar">
              <div class="activity-card-progress-fill" style="width: ${percent}%"></div>
            </div>
            <div class="activity-card-progress-text">${activity.currentParticipants}/${activity.maxParticipants} 已报名</div>
          </div>
          <div class="activity-card-actions">
            <div class="activity-action-btn join ${joined ? 'active' : ''}" data-action="join" data-activity-id="${activity.id}" title="${joined ? '已加入' : '加入'}">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${joined ? '<polyline points="20 6 9 17 4 12"/>' : '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>'}</svg>
            </div>
            <div class="activity-action-btn follow" data-action="follow" data-activity-id="${activity.id}" title="关注">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
            </div>
            <div class="activity-action-btn dislike" data-action="dislike" data-activity-id="${activity.id}" title="不感兴趣">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  renderFollowingTab() {
    const items = mockData.followingItems;
    const followingItems = items.filter(item => item.name !== '我');
    const myItems = items.filter(item => item.name === '我');

    const displayItems = this.currentFollowingTab === 'following' ? followingItems : myItems;

    const listHtml = displayItems.map(item => `
      <div class="following-item" data-friend-id="${item.id}">
        <div class="following-avatar">${item.avatarEmoji}</div>
        <div class="following-info">
          <div class="following-name">${item.name}</div>
          <div class="following-desc">${item.action}: ${item.activityTitle}</div>
        </div>
        <div class="following-time">${item.time}</div>
      </div>
    `).join('');

    return `
      <div>
        <div class="following-tabs">
          <button class="following-tab ${this.currentFollowingTab === 'following' ? 'active' : ''}" data-following-tab="following">关注的人</button>
          <button class="following-tab ${this.currentFollowingTab === 'published' ? 'active' : ''}" data-following-tab="published">我发布的</button>
        </div>
        ${listHtml}
      </div>
    `;
  },

  bindExploreEvents() {
    const tabs = document.querySelectorAll('.explore-tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        this.currentExploreTab = tab.dataset.tab;
        this.renderPage('explore');
      });
    });

    const sortBtns = document.querySelectorAll('.sort-btn');
    sortBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const sort = btn.dataset.sort;
        if (sort === 'interest') {
          this.interestExpanded = !this.interestExpanded;
        } else {
          this.interestExpanded = false;
          this.currentSort = sort;
        }
        this.renderPage('explore');
      });
    });

    const cards = document.querySelectorAll('.activity-card');
    cards.forEach(card => {
      card.addEventListener('click', (e) => {
        if (e.target.closest('.activity-action-btn')) return;
        const id = card.dataset.activityId;
        this.activityDetailReturn = null;
        this.openActivityDetail(id);
      });
    });

    const actionBtns = document.querySelectorAll('.activity-action-btn');
    actionBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const action = btn.dataset.action;
        const id = btn.dataset.activityId;
        this.handleActivityAction(action, id, btn);
      });
    });

    const followingTabs = document.querySelectorAll('[data-following-tab]');
    followingTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        this.currentFollowingTab = tab.dataset.followingTab;
        this.renderPage('explore');
      });
    });

    const interestTags = document.querySelectorAll('.interest-tag-chip');
    interestTags.forEach(tag => {
      tag.addEventListener('click', () => {
        const tagName = tag.dataset.tag;
        if (tagName === '全部') {
          this.selectedInterestTags = [];
        } else {
          if (this.selectedInterestTags.includes(tagName)) {
            this.selectedInterestTags = this.selectedInterestTags.filter(t => t !== tagName);
          } else {
            this.selectedInterestTags.push(tagName);
          }
        }
        tag.classList.toggle('active');
      });
    });

    const confirmBtn = document.getElementById('interestConfirmBtn');
    if (confirmBtn) {
      confirmBtn.addEventListener('click', () => {
        this.interestExpanded = false;
        this.renderPage('explore');
      });
    }

    const settingsBtn = document.getElementById('interestSettingsBtn');
    if (settingsBtn) {
      settingsBtn.addEventListener('click', () => {
        this.showInterestSettings();
      });
    }

    const bannerDots = document.querySelectorAll('.hot-banner-dot');
    bannerDots.forEach(dot => {
      dot.addEventListener('click', () => {
        this.hotBannerIdx = parseInt(dot.dataset.bannerIdx);
        const banners = [
          { label: '热门推荐', title: '全世界最有趣的活动在这里', desc: '每日精选热门内容，发现身边好玩法', emoji: '🌍', gradient: 'linear-gradient(135deg, #D4956B, #C5855B)' },
          { label: '重要资讯', title: '北京周末暴雨预警', desc: '本周末有大到暴雨，户外活动请注意安全', emoji: '🌧️', gradient: 'linear-gradient(135deg, #6B7BA8, #5A6A9E)' },
          { label: '奖金招募', title: '牙周炎治疗招募受试者', desc: '三甲医院临床研究，补贴3000元', emoji: '🦷', gradient: 'linear-gradient(135deg, #C08A9E, #B07A8E)' },
          { label: '重要资讯', title: '798艺术区免费开放日', desc: '本月20号免门票，限量预约先到先得', emoji: '🖼️', gradient: 'linear-gradient(135deg, #7A93B0, #6A83A0)' },
          { label: '奖金招募', title: '睡眠质量研究志愿者', desc: '北大心理学系实验，参与奖励800元', emoji: '😴', gradient: 'linear-gradient(135deg, #8AAA92, #7A9A82)' }
        ];
        const b = banners[this.hotBannerIdx];
        const carousel = document.getElementById('hotBannerCarousel');
        if (carousel) {
          carousel.style.background = b.gradient;
          carousel.querySelector('.hot-banner-emoji').textContent = b.emoji;
          carousel.querySelector('.hot-banner-label').textContent = b.label;
          carousel.querySelector('.hot-banner-title').textContent = b.title;
          carousel.querySelector('.hot-banner-desc').textContent = b.desc;
        }
        document.querySelectorAll('.hot-banner-dot').forEach((d, i) => {
          d.classList.toggle('active', i === this.hotBannerIdx);
        });
      });
    });

    this.bindHotCarouselEvents();
  },

  bindHotCarouselEvents() {
    const carousel = document.getElementById('hotCarousel');
    if (!carousel) return;

    const updateCenterItem = () => {
      const items = carousel.querySelectorAll('.hot-carousel-item');
      const containerRect = carousel.getBoundingClientRect();
      const containerCenter = containerRect.top + containerRect.height / 2;

      items.forEach(item => {
        const rect = item.getBoundingClientRect();
        const itemCenter = rect.top + rect.height / 2;
        const distance = Math.abs(itemCenter - containerCenter);
        const maxDistance = containerRect.height / 2;

        const ratio = Math.max(0, 1 - distance / maxDistance);
        const scale = 0.85 + ratio * 0.15;
        const opacity = 0.5 + ratio * 0.5;

        item.style.transform = `scale(${scale})`;
        item.style.opacity = opacity;

        if (ratio > 0.6) {
          item.classList.add('center');
        } else {
          item.classList.remove('center');
        }
      });
    };

    carousel.addEventListener('scroll', updateCenterItem);
    setTimeout(updateCenterItem, 50);

    const hotItems = document.querySelectorAll('.hot-carousel-item[data-hot-id]');
    hotItems.forEach(item => {
      item.addEventListener('click', () => {
        const id = item.dataset.hotId;
        this.openHotDetail(id);
      });
    });
  },

  // ===== 热门帖子详情页 =====
  openHotDetail(rankId) {
    const container = document.getElementById('appContent');
    container.innerHTML = this.renderHotDetailPage(rankId);
    this.bindHotDetailEvents();
    container.scrollTop = 0;
  },

  renderHotDetailPage(rankId) {
    const item = mockData.hotRankings.find(h => String(h.rank) === String(rankId));
    if (!item) return '';
    const tagsHtml = (item.tags || []).map(t => `<span class="hot-detail-tag">#${t}</span>`).join('');
    const imagesHtml = (item.images || []).map(img => `<div class="hot-detail-image">${img}</div>`).join('');
    const commentsHtml = (item.comments || []).map(c => `
      <div class="hot-detail-comment">
        <div class="hot-detail-comment-avatar">${c.avatar}</div>
        <div class="hot-detail-comment-body">
          <div class="hot-detail-comment-name">${c.name}</div>
          <div class="hot-detail-comment-text">${c.text}</div>
          <div class="hot-detail-comment-time">${c.time}</div>
        </div>
      </div>
    `).join('');

    return `
      <div class="hot-detail-page">
        <div class="hot-detail-header">
          <div class="hot-detail-back" id="hotDetailBack">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
          </div>
          <div class="hot-detail-header-title">帖子详情</div>
          <div class="hot-detail-more">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>
          </div>
        </div>
        <div class="hot-detail-body">
          <div class="hot-detail-author">
            <div class="hot-detail-author-avatar">${item.author.avatar}</div>
            <div class="hot-detail-author-info">
              <div class="hot-detail-author-name">${item.author.name}</div>
              <div class="hot-detail-author-meta">${item.isOnline ? '🔗 ' + item.website : '📍 ' + item.location}</div>
            </div>
            <button class="hot-detail-follow-btn">关注</button>
          </div>
          <div class="hot-detail-title">${item.title}</div>
          <div class="hot-detail-content">${item.content}</div>
          ${imagesHtml ? `<div class="hot-detail-images">${imagesHtml}</div>` : ''}
          ${tagsHtml ? `<div class="hot-detail-tags">${tagsHtml}</div>` : ''}
          <div class="hot-detail-stats">
            <span>🔥 ${item.heat} 人关注</span>
            <span>💬 ${item.comments.length} 条评论</span>
          </div>
          <div class="hot-detail-section-title">评论</div>
          <div class="hot-detail-comments">${commentsHtml}</div>
        </div>
        <div class="hot-detail-bottom-bar">
          <div class="hot-detail-input-wrap">
            <input type="text" placeholder="写评论..." id="hotDetailInput" />
          </div>
          <div class="hot-detail-actions">
            <div class="activity-action-btn join" data-action="join" data-hot-id="${item.rank}" title="加入">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            </div>
            <div class="activity-action-btn follow" data-action="follow" data-hot-id="${item.rank}" title="关注">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
            </div>
            <div class="activity-action-btn dislike" data-action="dislike" data-hot-id="${item.rank}" title="不感兴趣">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  bindHotDetailEvents() {
    const backBtn = document.getElementById('hotDetailBack');
    if (backBtn) {
      backBtn.addEventListener('click', () => {
        this.renderPage('explore');
      });
    }
    const actionBtns = document.querySelectorAll('.hot-detail-actions .activity-action-btn');
    actionBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const action = btn.dataset.action;
        if (action === 'join') {
          const active = btn.classList.toggle('active');
          const svg = btn.querySelector('svg');
          svg.innerHTML = active ? '<polyline points="20 6 9 17 4 12"/>' : '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>';
          this.showToast(active ? '已加入' : '已取消加入');
        } else if (action === 'follow') {
          const active = btn.classList.toggle('active');
          this.showToast(active ? '已关注' : '已取消关注');
        } else if (action === 'dislike') {
          this.showToast('已减少此类推荐');
        }
      });
    });
    const input = document.getElementById('hotDetailInput');
    if (input) {
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && input.value.trim()) {
          this.showToast('评论已发送');
          input.value = '';
        }
      });
    }
  },

  // ===== 聊天页 & 朋友主页 =====
  // 导航栈：用于聊天页→朋友主页的层级返回
  viewStack: [],

  openChat(friendId) {
    this.viewStack = [{ type: 'chat', friendId }];
    const container = document.getElementById('appContent');
    container.innerHTML = this.renderChatPage(friendId);
    this.bindChatEvents(friendId);
    const chatScroll = document.getElementById('chatMessages');
    if (chatScroll) chatScroll.scrollTop = chatScroll.scrollHeight;
  },

  renderChatPage(friendId) {
    const friend = mockData.friendProfiles[friendId];
    const messages = mockData.chatMessages[friendId] || [];
    const isGroup = !!friend.isGroup;
    const subtitle = isGroup ? `${friend.members.length}人` : `信用 ${friend.creditScore}`;
    const msgHtml = messages.map(m => {
      const isMe = m.from === 'me';
      const avatar = isGroup ? (m.sender.avatar) : (isMe ? mockData.user.avatarEmoji : friend.avatarEmoji);
      const senderNameHtml = (isGroup && !isMe && m.sender) ? `<div class="chat-msg-sender">${m.sender.name}</div>` : '';
      return `
        <div class="chat-msg ${isMe ? 'me' : 'them'}">
          ${isMe ? '' : `<div class="chat-msg-avatar">${avatar}</div>`}
          <div class="chat-msg-content">
            ${senderNameHtml}
            <div class="chat-msg-bubble">${m.text}</div>
          </div>
          ${isMe ? `<div class="chat-msg-avatar me-avatar">${avatar}</div>` : ''}
        </div>
      `;
    }).join('');

    return `
      <div class="chat-page">
        <div class="chat-header">
          <div class="chat-back" id="chatBack">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
          </div>
          <div class="chat-friend" id="chatFriendAvatar">
            <div class="chat-friend-avatar">${friend.avatarEmoji}</div>
            <div class="chat-friend-info">
              <div class="chat-friend-name">${friend.name}</div>
              <div class="chat-friend-sub">${subtitle}</div>
            </div>
          </div>
          <div class="chat-more">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>
          </div>
        </div>
        <div class="chat-messages" id="chatMessages">${msgHtml}</div>
        <div class="chat-input-bar">
          <div class="chat-input-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>
          </div>
          <div class="chat-input-box">说点什么...</div>
          <div class="chat-input-send">发送</div>
        </div>
      </div>
    `;
  },

  bindChatEvents(friendId) {
    const backBtn = document.getElementById('chatBack');
    if (backBtn) {
      backBtn.addEventListener('click', () => {
        this.viewStack = [];
        this.renderPage(this.currentPage);
      });
    }
    const friendAvatar = document.getElementById('chatFriendAvatar');
    if (friendAvatar) {
      friendAvatar.addEventListener('click', () => {
        this.openFriendProfile(friendId);
      });
    }
  },

  openFriendProfile(friendId) {
    this.viewStack.push({ type: 'profile', friendId });
    const container = document.getElementById('appContent');
    container.innerHTML = this.renderFriendProfilePage(friendId);
    this.bindFriendProfileEvents(friendId);
  },

  renderFriendProfilePage(friendId) {
    const f = mockData.friendProfiles[friendId];
    if (!f) return '';
    const isGroup = !!f.isGroup;
    const tagsHtml = f.tags.map(t => `<span class="friend-tag">${t}</span>`).join('');
    const achievementsHtml = f.achievements.map(a => `
      <div class="friend-achievement">
        <div class="friend-achievement-icon" style="opacity:${a.unlocked ? 1 : 0.35};">${a.emoji}</div>
        <div class="friend-achievement-name">${a.name}</div>
      </div>
    `).join('');
    const trackedSet = this.trackedSchedules[friendId] || new Set();
    const scheduleHtml = f.schedule.map((s, i) => `
      <div class="friend-schedule-item">
        <div class="friend-schedule-date">
          <div class="friend-schedule-day">${s.date}</div>
          <div class="friend-schedule-week">${s.weekday}</div>
        </div>
        <div class="friend-schedule-info">
          <div class="friend-schedule-title">${s.title}</div>
          <div class="friend-schedule-meta">${s.time} · ${s.location}</div>
        </div>
        <div class="friend-schedule-track ${trackedSet.has(i) ? 'tracked' : ''}" data-schedule-idx="${i}" data-friend-id="${friendId}">
          ${trackedSet.has(i) ? '已追踪' : '追踪'}
        </div>
      </div>
    `).join('');

    // 活动记录：群聊用 activityRecords，个人用 activityIds
    let activities;
    if (isGroup) {
      activities = f.activityRecords || [];
    } else {
      activities = (f.activityIds || []).map(id => mockData.activities.find(a => a.id === id)).filter(Boolean);
    }
    const leftCol = [];
    const rightCol = [];
    activities.forEach((a, i) => {
      const card = this.renderActivityCard(a);
      (i % 2 === 0 ? leftCol : rightCol).push(card);
    });

    const actionsHtml = isGroup
      ? `<button class="friend-profile-btn primary" id="friendJoinGroupBtn">申请入群</button>
         <button class="friend-profile-btn" id="friendFollowBtn">关注</button>`
      : `<button class="friend-profile-btn primary" id="friendChatBtn">发消息</button>
         <button class="friend-profile-btn" id="friendFollowBtn">关注</button>`;

    const creditHtml = isGroup
      ? `<span class="friend-profile-credit">${f.members.length} 人</span>`
      : `<span class="friend-profile-credit">信用 ${f.creditScore}</span>`;

    return `
      <div class="friend-profile-page">
        <div class="friend-profile-header">
          <div class="friend-profile-back" id="friendProfileBack">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
          </div>
          <div class="friend-profile-header-title">${isGroup ? '群主页' : '主页'}</div>
          <div class="friend-profile-more">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>
          </div>
        </div>
        <div class="friend-profile-cover">
          <div class="friend-profile-avatar">${f.avatarEmoji}</div>
          <div class="friend-profile-name">${f.name} ${creditHtml}</div>
          <div class="friend-profile-bio">${f.bio}</div>
          <div class="friend-profile-tags">${tagsHtml}</div>
          <div class="friend-profile-actions">${actionsHtml}</div>
        </div>
        <div class="friend-profile-stats">
          <div class="friend-profile-stat"><div class="friend-profile-stat-value">${f.stats.joinedCount}</div><div class="friend-profile-stat-label">${isGroup ? '举办活动' : '参加活动'}</div></div>
          <div class="friend-profile-stat"><div class="friend-profile-stat-value">${f.stats.hostedCount}</div><div class="friend-profile-stat-label">${isGroup ? '成员活动' : '发起活动'}</div></div>
          <div class="friend-profile-stat"><div class="friend-profile-stat-value">${isGroup ? f.members.length : f.stats.friendsCount}</div><div class="friend-profile-stat-label">${isGroup ? '群成员' : '好友'}</div></div>
          <div class="friend-profile-stat"><div class="friend-profile-stat-value">${f.stats.maxStreak}</div><div class="friend-profile-stat-label">连续打卡</div></div>
        </div>
        <div class="friend-profile-section">
          <div class="friend-profile-section-title">${isGroup ? '群成就' : '成就徽章'}</div>
          <div class="friend-achievements">${achievementsHtml}</div>
        </div>
        <div class="friend-profile-section">
          <div class="friend-profile-section-title">${isGroup ? '群日程' : '日程安排'}</div>
          <div class="friend-schedule">${scheduleHtml}</div>
        </div>
        <div class="friend-profile-section">
          <div class="friend-profile-section-title">${isGroup ? '活动记录' : '活动记录'}</div>
          <div class="waterfall">
            <div class="waterfall-column">${leftCol.join('')}</div>
            <div class="waterfall-column">${rightCol.join('')}</div>
          </div>
        </div>
      </div>
    `;
  },

  bindFriendProfileEvents(friendId) {
    const backBtn = document.getElementById('friendProfileBack');
    if (backBtn) {
      backBtn.addEventListener('click', () => {
        this.viewStack.pop();
        const prev = this.viewStack[this.viewStack.length - 1];
        if (prev && prev.type === 'chat') {
          const container = document.getElementById('appContent');
          container.innerHTML = this.renderChatPage(prev.friendId);
          this.bindChatEvents(prev.friendId);
          const chatScroll = document.getElementById('chatMessages');
          if (chatScroll) chatScroll.scrollTop = chatScroll.scrollHeight;
        } else {
          this.viewStack = [];
          this.renderPage(this.currentPage);
        }
      });
    }
    const chatBtn = document.getElementById('friendChatBtn');
    if (chatBtn) {
      chatBtn.addEventListener('click', () => {
        this.viewStack = [{ type: 'chat', friendId }];
        const container = document.getElementById('appContent');
        container.innerHTML = this.renderChatPage(friendId);
        this.bindChatEvents(friendId);
        const chatScroll = document.getElementById('chatMessages');
        if (chatScroll) chatScroll.scrollTop = chatScroll.scrollHeight;
      });
    }
    const joinGroupBtn = document.getElementById('friendJoinGroupBtn');
    if (joinGroupBtn) {
      joinGroupBtn.addEventListener('click', () => {
        if (joinGroupBtn.classList.contains('applied')) return;
        joinGroupBtn.classList.add('applied');
        joinGroupBtn.textContent = '已申请';
        this.showToast('入群申请已提交，等待群主审核');
      });
    }
    const trackBtns = document.querySelectorAll('.friend-schedule-track');
    trackBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const fid = btn.dataset.friendId;
        const idx = parseInt(btn.dataset.scheduleIdx);
        if (!this.trackedSchedules[fid]) this.trackedSchedules[fid] = new Set();
        const set = this.trackedSchedules[fid];
        if (set.has(idx)) {
          set.delete(idx);
          btn.classList.remove('tracked');
          btn.textContent = '追踪';
          this.showToast('已取消追踪该日程');
        } else {
          set.add(idx);
          btn.classList.add('tracked');
          btn.textContent = '已追踪';
          this.showToast('日程已加入我的追踪');
        }
      });
    });
    const cards = document.querySelectorAll('.activity-card');
    cards.forEach(card => {
      card.addEventListener('click', (e) => {
        if (e.target.closest('.activity-action-btn')) return;
        const id = card.dataset.activityId;
        this.activityDetailReturn = { type: 'friendProfile', friendId };
        this.openActivityDetail(id);
      });
    });
    const actionBtns = document.querySelectorAll('.activity-action-btn');
    actionBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.handleActivityAction(btn.dataset.action, btn.dataset.activityId, btn);
      });
    });
  },

  // ===== MESSAGES PAGE =====
  renderMessagesPage() {
    const avatarColors = {
      friend: 'linear-gradient(135deg, #3B82F6, #60A5FA)',
      group: 'linear-gradient(135deg, #10B981, #34D399)',
      activity: 'linear-gradient(135deg, #F97316, #FB923C)',
      achievement: 'linear-gradient(135deg, #F59E0B, #FBBF24)',
      system: 'linear-gradient(135deg, #8B5CF6, #A78BFA)'
    };

    const messagesHtml = mockData.messages.map(msg => {
      const avatarStyle = `background: ${avatarColors[msg.type] || avatarColors.friend};`;
      const avatarContent = msg.type === 'achievement' ? (msg.badge || '🏆') : (msg.avatar || msg.coverEmoji || '👤');
      const unreadBadge = msg.unreadCount > 0 ? `<div class="message-badge">${msg.unreadCount}</div>` : '';
      const previewText = msg.preview || msg.content;

      let scheduleHtml = '';
      if (msg.type === 'group' && msg.sharedSchedule) {
        const todosHtml = msg.todos ? msg.todos.map(todo => `
          <div class="todo-item">
            <div class="todo-checkbox ${todo.done ? 'checked' : ''}"></div>
            <span>${todo.text}</span>
          </div>
        `).join('') : '';

        scheduleHtml = `
          <div class="shared-schedule-card" style="margin-top: 10px;">
            <div style="font-size: 14px; font-weight: 600; color: var(--text-primary); margin-bottom: 4px;">${msg.sharedSchedule.title}</div>
            <div style="font-size: 12px; color: var(--text-secondary); margin-bottom: 2px;">${msg.sharedSchedule.time} · ${msg.sharedSchedule.location}</div>
            <div class="shared-todo-list">${todosHtml}</div>
          </div>
        `;
      }

      return `
        <div class="message-item" data-message-id="${msg.id}">
          <div class="message-avatar ${msg.type === 'group' ? 'group' : ''}" style="${avatarStyle}">${avatarContent}</div>
          <div class="message-content">
            <div class="message-top">
              <div class="message-title">${msg.title}</div>
              <div class="message-time">${msg.time}</div>
            </div>
            <div class="message-desc">${previewText}</div>
          </div>
          ${unreadBadge}
        </div>
        ${scheduleHtml}
      `;
    }).join('');

    return `
      <div class="messages-page" style="min-height: 100%;">
        <div class="messages-header">
          <div class="messages-title">消息</div>
          <div class="messages-search">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input type="text" placeholder="搜索消息...">
          </div>
        </div>
        <div class="messages-list">
          ${messagesHtml}
        </div>
      </div>
    `;
  },

  bindMessagesEvents() {
    const items = document.querySelectorAll('.message-item');
    items.forEach(item => {
      item.addEventListener('click', () => {
        const id = item.dataset.messageId;
        const msg = mockData.messages.find(m => m.id === id);
        if (!msg) return;
        if (msg.friendId) {
          msg.isRead = true;
          msg.unreadCount = 0;
          this.openChat(msg.friendId);
        } else {
          msg.isRead = true;
          msg.unreadCount = 0;
          this.showToast('已标记为已读');
          this.renderPage('messages');
        }
      });
    });
  },

  // ===== SCHEDULE PAGE =====
  renderSchedulePage() {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const currentMonthStr = `${year}年${month + 1}月`;

    if (!this.selectedDate) {
      this.selectedDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    }

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay();

    const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
    const weekdayHeaders = weekdays.map(d => `<div>${d}</div>`).join('');

    let daysHtml = '';
    for (let i = 0; i < startDayOfWeek; i++) {
      daysHtml += `<div class="calendar-day other-month"></div>`;
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const isToday = dateStr === `${year}-${String(month + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      const isSelected = dateStr === this.selectedDate;
      const dayActivities = mockData.scheduleActivities.filter(a => a.date === dateStr);
      const hasNewActivity = this.highlightedScheduleId && dayActivities.some(a => a.id === this.highlightedScheduleId);
      const dotsHtml = dayActivities.map((a, idx) => {
        const isNew = a.id === this.highlightedScheduleId;
        const colors = ['orange', 'blue', 'pink'];
        const color = colors[idx % colors.length];
        return `<div class="calendar-day-dot ${color} ${isNew ? 'new-activity' : ''}"></div>`;
      }).join('');

      daysHtml += `
        <div class="calendar-day ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''} ${hasNewActivity ? 'has-new' : ''}" data-date="${dateStr}">
          <span>${day}</span>
          <div class="calendar-day-dots">${dotsHtml}</div>
        </div>
      `;
    }

    const selectedActivities = mockData.scheduleActivities.filter(a => a.date === this.selectedDate);
    const activityList = selectedActivities.filter(a => a.type === 'activity');
    const personalList = selectedActivities.filter(a => a.type === 'personal');

    const renderScheduleItem = (a) => {
      const shareIcon = a.shareStatus === 'public' ? '🌐' : a.shareStatus === 'friends' ? '👥' : '🔒';
      const shareText = a.shareStatus === 'public' ? '公开' : a.shareStatus === 'friends' ? '好友可见' : '私密';
      const isPersonal = a.type === 'personal';
      const actTodos = mockData.todos.filter(t => t.date === a.date && t.scheduleId === a.id);
      const todosHtml = actTodos.map(todo => `
        <div class="todo-item">
          <div class="todo-checkbox ${todo.done ? 'checked' : ''}" data-todo-id="${todo.id}"></div>
          <span class="${todo.done ? 'todo-done' : ''}">${todo.text}</span>
        </div>
      `).join('');
      const locationHtml = a.location ? `
        <div class="schedule-activity-location">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
          ${a.location}
        </div>
      ` : '';
      const typeBadge = isPersonal
        ? `<span class="schedule-type-badge personal">个人</span>`
        : `<span class="schedule-type-badge activity">活动</span>`;
      return `
        <div class="schedule-activity ${isPersonal ? 'personal' : ''} ${this.highlightedScheduleId === a.id ? 'highlight' : ''}" data-schedule-id="${a.id}">
          <div class="schedule-activity-time">${a.time}</div>
          <div class="schedule-activity-content">
            <div class="schedule-activity-title">${a.title} ${typeBadge}</div>
            ${locationHtml}
            ${a.notes ? `<div class="schedule-activity-notes">${a.notes}</div>` : ''}
            <div class="schedule-activity-share">${shareIcon} ${shareText}</div>
            ${todosHtml ? `<div class="schedule-todos"><div class="schedule-todos-title">待办事项</div>${todosHtml}</div>` : ''}
          </div>
        </div>
      `;
    };

    const activityHtml = activityList.map(renderScheduleItem).join('');
    const personalHtml = personalList.map(renderScheduleItem).join('');

    const activitySectionHtml = activityList.length > 0
      ? `<div class="schedule-section-label">参加的活动</div>${activityHtml}`
      : '';
    const personalSectionHtml = personalList.length > 0
      ? `<div class="schedule-section-label">个人安排</div>${personalHtml}`
      : '';

    const emptyHtml = (activityList.length === 0 && personalList.length === 0)
      ? '<div style="text-align: center; padding: 40px 0; color: var(--text-tertiary); font-size: 14px;">这天还没有日程安排</div>'
      : '';

    const dateTitle = this.selectedDate ? `${this.selectedDate} 日程` : '今日日程';

    return `
      <div class="schedule-page" style="min-height: 100%; position: relative;">
        <div class="schedule-header">
          <div class="schedule-title-row">
            <div class="schedule-title">日程</div>
            <div class="schedule-view-toggle">
              <button class="schedule-view-btn active">月</button>
              <button class="schedule-view-btn">周</button>
            </div>
          </div>
          <div class="calendar-month-nav">
            <button class="calendar-nav-btn" id="prevMonth">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            <div class="calendar-month-title">${currentMonthStr}</div>
            <button class="calendar-nav-btn" id="nextMonth">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          </div>
          <div class="calendar-weekdays">${weekdayHeaders}</div>
          <div class="calendar-days">${daysHtml}</div>
        </div>
        <div class="schedule-activities">
          <div class="schedule-date-title">${dateTitle}</div>
          ${personalSectionHtml}
          ${activitySectionHtml}
          ${emptyHtml}
        </div>
        <button class="schedule-add-btn" id="scheduleAddBtn">+</button>
      </div>
    `;
  },

  bindScheduleEvents() {
    const days = document.querySelectorAll('.calendar-day[data-date]');
    days.forEach(day => {
      day.addEventListener('click', () => {
        this.selectedDate = day.dataset.date;
        this.renderPage('schedule');
      });
    });

    const scheduleItems = document.querySelectorAll('.schedule-activity');
    scheduleItems.forEach(item => {
      item.addEventListener('click', (e) => {
        if (e.target.closest('.todo-checkbox') || e.target.closest('.todo-item')) return;
        const id = item.dataset.scheduleId;
        if (this.highlightedScheduleId === id) {
          this.highlightedScheduleId = null;
          item.classList.remove('highlight');
        }
        this.openScheduleDetail(id);
      });
    });

    const todoCheckboxes = document.querySelectorAll('.todo-checkbox[data-todo-id]');
    todoCheckboxes.forEach(cb => {
      cb.addEventListener('click', () => {
        const id = cb.dataset.todoId;
        const todo = mockData.todos.find(t => t.id === id);
        if (todo) {
          todo.done = !todo.done;
          this.renderPage('schedule');
        }
      });
    });

    const addBtn = document.getElementById('scheduleAddBtn');
    if (addBtn) {
      addBtn.addEventListener('click', () => {
        this.showSuccessToast();
      });
    }
  },

  // ===== SCHEDULE DETAIL =====
  openScheduleDetail(scheduleId) {
    const container = document.getElementById('appContent');
    container.innerHTML = this.renderScheduleDetailPage(scheduleId);
    this.bindScheduleDetailEvents(scheduleId);
    container.scrollTop = 0;
  },

  renderScheduleDetailPage(scheduleId) {
    const s = mockData.scheduleActivities.find(a => a.id === scheduleId);
    if (!s) return '';
    const isPersonal = s.type === 'personal';
    const shareIcon = s.shareStatus === 'public' ? '🌐' : s.shareStatus === 'friends' ? '👥' : '🔒';
    const shareText = s.shareStatus === 'public' ? '公开' : s.shareStatus === 'friends' ? '好友可见' : '私密';
    const weekdayMap = ['日','一','二','三','四','五','六'];
    const weekday = '周' + weekdayMap[new Date(s.date).getDay()];
    const tagsHtml = (s.tags || []).map(t => `<span class="sched-detail-tag">${t}</span>`).join('');
    const companionsHtml = (s.companions && s.companions.length)
      ? s.companions.map(c => `<div class="sched-detail-companion">${c}</div>`).join('')
      : '';
    const actTodos = mockData.todos.filter(t => t.date === s.date && t.scheduleId === s.id);
    const todosHtml = actTodos.length
      ? actTodos.map(todo => `
          <div class="todo-item">
            <div class="todo-checkbox ${todo.done ? 'checked' : ''}" data-todo-id="${todo.id}"></div>
            <span class="${todo.done ? 'todo-done' : ''}">${todo.text}</span>
          </div>
        `).join('')
      : '<div class="sched-detail-empty">暂无待办事项</div>';

    return `
      <div class="sched-detail-page">
        <div class="sched-detail-header">
          <div class="sched-detail-back" id="schedDetailBack">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
          </div>
          <div class="sched-detail-header-title">日程详情</div>
          <div class="sched-detail-more">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>
          </div>
        </div>
        <div class="sched-detail-body">
          <div class="sched-detail-type-badge">
            <span class="schedule-type-badge ${isPersonal ? 'personal' : 'activity'}">${isPersonal ? '个人安排' : '参加的活动'}</span>
          </div>
          <div class="sched-detail-title">${s.title}</div>
          <div class="sched-detail-time">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            ${s.date} ${weekday} ${s.time}
          </div>
          ${s.location ? `
            <div class="sched-detail-location">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
              ${s.location}
            </div>
          ` : ''}
          ${s.notes ? `
            <div class="sched-detail-section">
              <div class="sched-detail-section-title">备注</div>
              <div class="sched-detail-notes">${s.notes}</div>
            </div>
          ` : ''}
          ${tagsHtml ? `
            <div class="sched-detail-section">
              <div class="sched-detail-section-title">标签</div>
              <div class="sched-detail-tags">${tagsHtml}</div>
            </div>
          ` : ''}
          ${companionsHtml ? `
            <div class="sched-detail-section">
              <div class="sched-detail-section-title">同伴</div>
              <div class="sched-detail-companions">${companionsHtml}</div>
            </div>
          ` : ''}
          <div class="sched-detail-section">
            <div class="sched-detail-section-title">待办事项</div>
            <div class="sched-detail-todos">${todosHtml}</div>
          </div>
          ${s.music ? `
            <div class="sched-detail-section">
              <div class="sched-detail-section-title">背景音乐</div>
              <div class="sched-detail-music">🎵 ${s.music}</div>
            </div>
          ` : ''}
          <div class="sched-detail-share">
            ${shareIcon} 可见范围：${shareText}
          </div>
        </div>
      </div>
    `;
  },

  bindScheduleDetailEvents(scheduleId) {
    const backBtn = document.getElementById('schedDetailBack');
    if (backBtn) {
      backBtn.addEventListener('click', () => {
        this.renderPage('schedule');
      });
    }
    const todoCheckboxes = document.querySelectorAll('.todo-checkbox[data-todo-id]');
    todoCheckboxes.forEach(cb => {
      cb.addEventListener('click', () => {
        const id = cb.dataset.todoId;
        const todo = mockData.todos.find(t => t.id === id);
        if (todo) {
          todo.done = !todo.done;
          cb.classList.toggle('checked');
          const span = cb.nextElementSibling;
          if (span) span.classList.toggle('todo-done');
        }
      });
    });
  },

  // ===== SPACE PAGE (我的公开主页) =====
  renderSpacePage() {
    const u = mockData.user;
    const tagsHtml = u.interests.map(t => `<span class="friend-tag">${t}</span>`).join('');
    const achievementsHtml = u.achievements.map(a => `
      <div class="friend-achievement">
        <div class="friend-achievement-icon" style="opacity:${a.unlocked ? 1 : 0.35};">${a.emoji}</div>
        <div class="friend-achievement-name">${a.name}</div>
      </div>
    `).join('');

    // 我的日程：取今天及之后的几条
    const today = this.selectedDate || `${new Date().getFullYear()}-${String(new Date().getMonth()+1).padStart(2,'0')}-${String(new Date().getDate()).padStart(2,'0')}`;
    const mySchedule = mockData.scheduleActivities
      .filter(s => s.date >= '2026-07-15')
      .sort((a,b) => (a.date+a.time).localeCompare(b.date+b.time))
      .slice(0, 4);
    const weekdayMap = ['日','一','二','三','四','五','六'];
    const scheduleHtml = mySchedule.map(s => {
      const d = new Date(s.date);
      const weekday = '周' + weekdayMap[d.getDay()];
      const typeBadge = s.type === 'personal'
        ? `<span class="schedule-type-badge personal">个人</span>`
        : `<span class="schedule-type-badge activity">活动</span>`;
      return `
        <div class="friend-schedule-item">
          <div class="friend-schedule-date">
            <div class="friend-schedule-day">${s.date.slice(5)}</div>
            <div class="friend-schedule-week">${weekday}</div>
          </div>
          <div class="friend-schedule-info">
            <div class="friend-schedule-title">${s.title} ${typeBadge}</div>
            <div class="friend-schedule-meta">${s.time}${s.location ? ' · ' + s.location : ''}</div>
          </div>
        </div>
      `;
    }).join('');

    // 活动记录：我参加/发起的活动
    const myActivityIds = ['6', '2', '4', '1'];
    const myActivities = myActivityIds.map(id => mockData.activities.find(a => a.id === id)).filter(Boolean);
    const leftCol = [];
    const rightCol = [];
    myActivities.forEach((a, i) => {
      const card = this.renderActivityCard(a);
      (i % 2 === 0 ? leftCol : rightCol).push(card);
    });

    return `
      <div class="friend-profile-page">
        <div class="friend-profile-header">
          <div class="friend-profile-back" style="visibility:hidden;">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
          </div>
          <div class="friend-profile-header-title">我的空间</div>
          <div class="friend-profile-more" id="spaceEditBtn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </div>
        </div>
        <div class="friend-profile-cover">
          <div class="friend-profile-avatar">${u.avatarEmoji}</div>
          <div class="friend-profile-name">${u.name} <span class="friend-profile-credit">信用 ${u.creditScore}</span></div>
          <div class="friend-profile-bio">${u.bio}</div>
          <div class="space-meta">
            <span class="space-meta-item">📍 ${u.region}</span>
            <span class="space-meta-item">🎂 ${u.age}岁</span>
          </div>
          <div class="friend-profile-tags">${tagsHtml}</div>
        </div>
        <div class="friend-profile-stats">
          <div class="friend-profile-stat"><div class="friend-profile-stat-value">${u.stats.joinedCount}</div><div class="friend-profile-stat-label">参加活动</div></div>
          <div class="friend-profile-stat"><div class="friend-profile-stat-value">${u.stats.hostedCount}</div><div class="friend-profile-stat-label">发起活动</div></div>
          <div class="friend-profile-stat"><div class="friend-profile-stat-value">${u.stats.friendsCount}</div><div class="friend-profile-stat-label">好友</div></div>
          <div class="friend-profile-stat"><div class="friend-profile-stat-value">${u.stats.maxStreak}</div><div class="friend-profile-stat-label">连续打卡</div></div>
        </div>
        <div class="friend-profile-section">
          <div class="friend-profile-section-title">成就徽章</div>
          <div class="friend-achievements">${achievementsHtml}</div>
        </div>
        <div class="friend-profile-section">
          <div class="friend-profile-section-title">我的日程</div>
          <div class="friend-schedule">${scheduleHtml}</div>
        </div>
        <div class="friend-profile-section">
          <div class="friend-profile-section-title">活动记录</div>
          <div class="waterfall">
            <div class="waterfall-column">${leftCol.join('')}</div>
            <div class="waterfall-column">${rightCol.join('')}</div>
          </div>
        </div>
      </div>
    `;
  },

  bindSpaceEvents() {
    const editBtn = document.getElementById('spaceEditBtn');
    if (editBtn) {
      editBtn.addEventListener('click', () => {
        this.showToast('编辑资料功能开发中');
      });
    }
    const cards = document.querySelectorAll('.activity-card');
    cards.forEach(card => {
      card.addEventListener('click', (e) => {
        if (e.target.closest('.activity-action-btn')) return;
        const id = card.dataset.activityId;
        this.activityDetailReturn = { type: 'space' };
        this.openActivityDetail(id);
      });
    });
    const actionBtns = document.querySelectorAll('.activity-action-btn');
    actionBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.handleActivityAction(btn.dataset.action, btn.dataset.activityId, btn);
      });
    });
  },

  renderProfilePage() {
    const user = mockData.user;
    return `
      <div class="profile-page" style="min-height: 100%;">
        <div class="profile-header">
          <div class="profile-header-row">
            <div class="profile-header-title">我的</div>
            <div class="profile-header-actions">
              <div class="profile-header-action">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
              </div>
            </div>
          </div>
          <div class="profile-user" id="profileUserEntry">
            <div class="profile-avatar">${user.avatarEmoji}</div>
            <div class="profile-user-info">
              <div class="profile-user-name">${user.name} ${user.isVerified ? '<span class="profile-verified">✓</span>' : ''}</div>
              <div class="profile-credit">点击查看我的空间 ›</div>
            </div>
          </div>
        </div>
        <div class="profile-menu">
          <div class="profile-menu-item" id="menuVerify">
            <div class="profile-menu-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            </div>
            <div class="profile-menu-text">实名认证</div>
            <div class="profile-menu-status">${user.isVerified ? '已认证' : '未认证'}</div>
            <div class="profile-menu-arrow">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
            </div>
          </div>
          <div class="profile-menu-item">
            <div class="profile-menu-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            </div>
            <div class="profile-menu-text">我的活动</div>
            <div class="profile-menu-arrow">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
            </div>
          </div>
          <div class="profile-menu-item">
            <div class="profile-menu-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
            </div>
            <div class="profile-menu-text">我的收藏</div>
            <div class="profile-menu-arrow">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
            </div>
          </div>
          <div class="profile-menu-item">
            <div class="profile-menu-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 12l2 2 4-4"/><path d="M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z"/></svg>
            </div>
            <div class="profile-menu-text">隐私设置</div>
            <div class="profile-menu-arrow">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
            </div>
          </div>
          <div class="profile-menu-item">
            <div class="profile-menu-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
            </div>
            <div class="profile-menu-text">帮助与反馈</div>
            <div class="profile-menu-arrow">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
            </div>
          </div>
          <div class="profile-menu-item">
            <div class="profile-menu-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            </div>
            <div class="profile-menu-text">退出登录</div>
            <div class="profile-menu-arrow">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  bindProfileEvents() {
    const userEntry = document.getElementById('profileUserEntry');
    if (userEntry) {
      userEntry.addEventListener('click', () => {
        this.navigateTo('space');
      });
    }
    const menuItems = document.querySelectorAll('.profile-menu-item');
    menuItems.forEach(item => {
      item.addEventListener('click', () => {
        const text = item.querySelector('.profile-menu-text').textContent;
        this.showToast(text + ' 功能开发中');
      });
    });
  },

  // ===== ACTIVITY DETAIL =====
  openActivityDetail(activityId) {
    const container = document.getElementById('appContent');
    container.innerHTML = this.renderActivityDetailPage(activityId);
    this.bindActivityDetailEvents(activityId);
  },

  renderActivityDetailPage(activityId) {
    const activity = mockData.activities.find(a => a.id === activityId);
    if (!activity) return '';

    const percent = Math.round((activity.currentParticipants / activity.maxParticipants) * 100);
    const participantsHtml = activity.participants.map(p => `
      <div class="detail-participant">
        <div class="avatar">${p.emoji}</div>
        <span>${p.name}</span>
      </div>
    `).join('');

    const imagesHtml = activity.images.map((img, idx) => `
      <div class="detail-image" style="background: linear-gradient(135deg, var(--primary-light), var(--primary));">${img}</div>
    `).join('');

    return `
      <div class="detail-page page active">
        <div class="detail-header">
          <div class="detail-back" id="detailBack">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
          </div>
          <div class="detail-header-actions">
            <div class="detail-header-action">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
            </div>
            <div class="detail-header-action">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
            </div>
          </div>
        </div>
        <div class="detail-images">${imagesHtml}</div>
        <div class="detail-body">
          <div class="detail-title">${activity.title}</div>
          <div class="detail-host">
            <div class="detail-host-avatar">${activity.host.avatarEmoji}</div>
            <div class="detail-host-info">
              <div class="detail-host-name">${activity.host.name} ${activity.host.isVerified ? '<span class="detail-host-badge">✓ 认证</span>' : ''}</div>
              <div class="detail-host-desc">活动发起人</div>
            </div>
          </div>
          <div class="detail-info">
            <div class="detail-info-item">
              <div class="detail-info-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              </div>
              <div class="detail-info-content">
                <div class="detail-info-label">时间</div>
                <div class="detail-info-value">${activity.date} ${activity.startTime} - ${activity.endTime}</div>
              </div>
            </div>
            <div class="detail-info-item">
              <div class="detail-info-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
              </div>
              <div class="detail-info-content">
                <div class="detail-info-label">地点</div>
                <div class="detail-info-value">${activity.location}</div>
              </div>
            </div>
            <div class="detail-info-item">
              <div class="detail-info-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
              </div>
              <div class="detail-info-content">
                <div class="detail-info-label">费用</div>
                <div class="detail-fee"><div class="detail-fee-amount">${activity.fee}</div><div class="detail-fee-unit">元/人</div></div>
              </div>
            </div>
          </div>
          <div class="detail-section">
            <div class="detail-section-title">活动详情</div>
            <div class="detail-description">${activity.description}</div>
          </div>
          <div class="detail-section">
            <div class="detail-section-title">已报名 (${activity.currentParticipants}/${activity.maxParticipants})</div>
            <div class="detail-participants">${participantsHtml}</div>
          </div>
        </div>
        <div class="detail-bottom-bar">
          <div class="detail-bottom-info">
            <div class="detail-bottom-price">${activity.fee === 0 ? '免费' : '¥' + activity.fee}</div>
          </div>
          <div class="detail-actions">
            <div class="activity-action-btn join ${activity.isJoined ? 'active' : ''}" data-action="join" data-activity-id="${activity.id}" title="${activity.isJoined ? '已加入' : '加入'}">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${activity.isJoined ? '<polyline points="20 6 9 17 4 12"/>' : '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>'}</svg>
            </div>
            <div class="activity-action-btn follow" data-action="follow" data-activity-id="${activity.id}" title="关注">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
            </div>
            <div class="activity-action-btn dislike" data-action="dislike" data-activity-id="${activity.id}" title="不感兴趣">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  bindActivityDetailEvents(activityId) {
    const backBtn = document.getElementById('detailBack');
    if (backBtn) {
      backBtn.addEventListener('click', () => {
        const ret = this.activityDetailReturn;
        this.activityDetailReturn = null;
        if (ret && ret.type === 'friendProfile') {
          const container = document.getElementById('appContent');
          container.innerHTML = this.renderFriendProfilePage(ret.friendId);
          this.bindFriendProfileEvents(ret.friendId);
        } else if (ret && ret.type === 'space') {
          const container = document.getElementById('appContent');
          container.innerHTML = this.renderSpacePage();
          this.bindSpaceEvents();
        } else {
          this.renderPage(this.currentPage);
        }
      });
    }

    const actionBtns = document.querySelectorAll('.detail-actions .activity-action-btn');
    actionBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.handleActivityAction(btn.dataset.action, btn.dataset.activityId, btn);
      });
    });
  },

  // ===== DIARY DETAIL =====
  openDiaryDetail() {
    const container = document.getElementById('appContent');
    container.innerHTML = this.renderDiaryDetailPage();
    this.bindDiaryDetailEvents();
  },

  renderDiaryDetailPage() {
    return `
      <div class="diary-page page active">
        <div class="diary-header">
          <div class="diary-back" id="diaryBack">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
          </div>
          <div class="diary-share-btn" id="diaryShareBtn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
          </div>
        </div>
        <div class="diary-content">
          <div class="diary-date">2026-07-15</div>
          <div class="diary-headline">今天参加了超棒的活动！🎉</div>
          <div class="diary-photo-grid">
            <div class="diary-photo" style="background: linear-gradient(135deg, var(--primary-light), var(--primary));">🏸</div>
            <div class="diary-photo" style="background: linear-gradient(135deg, #3B82F6, #60A5FA);">🏃</div>
            <div class="diary-photo" style="background: linear-gradient(135deg, #10B981, #34D399);">🤝</div>
          </div>
          <div class="diary-info-card">
            <div class="diary-info-row">
              <div class="diary-info-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
              </div>
              <div class="diary-info-text">朝阳体育中心羽毛球馆</div>
            </div>
            <div class="diary-info-row">
              <div class="diary-info-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              </div>
              <div class="diary-info-text">2026-07-15 14:00 - 16:00</div>
            </div>
          </div>
          <div class="diary-message">
            今天和小伙伴们一起打了羽毛球，大家都超厉害！虽然出了很多汗，但是超级开心~ 下次还要一起！
          </div>
          <div class="diary-stats">
            <div class="diary-stat">
              <div class="diary-stat-value">128</div>
              <div class="diary-stat-label">浏览</div>
            </div>
            <div class="diary-stat">
              <div class="diary-stat-value">32</div>
              <div class="diary-stat-label">点赞</div>
            </div>
            <div class="diary-stat">
              <div class="diary-stat-value">8</div>
              <div class="diary-stat-label">评论</div>
            </div>
          </div>
          <div class="diary-mood-input">
            <label class="diary-mood-label">记录心情</label>
            <textarea class="diary-mood-field" placeholder="写下今天的感受..."></textarea>
          </div>
        </div>
        <div class="diary-bottom-actions">
          <button class="diary-btn-secondary" id="diaryBackBtn">返回</button>
          <button class="diary-btn-primary" id="diarySaveBtn">保存</button>
        </div>
      </div>
    `;
  },

  bindDiaryDetailEvents() {
    const backBtn = document.getElementById('diaryBack');
    if (backBtn) {
      backBtn.addEventListener('click', () => {
        this.renderPage('profile');
      });
    }

    const diaryBackBtn = document.getElementById('diaryBackBtn');
    if (diaryBackBtn) {
      diaryBackBtn.addEventListener('click', () => {
        this.renderPage('profile');
      });
    }

    const saveBtn = document.getElementById('diarySaveBtn');
    if (saveBtn) {
      saveBtn.addEventListener('click', () => {
        this.showSuccessToast();
      });
    }

    const shareBtn = document.getElementById('diaryShareBtn');
    if (shareBtn) {
      shareBtn.addEventListener('click', () => {
        this.showShareModal('s1');
      });
    }
  },

  // ===== MODALS =====
  handleJoinActivity(activityId) {
    const activity = mockData.activities.find(a => a.id === activityId);
    if (!activity) return;

    if (activity.isJoined) {
      this.showSuccessToast();
      return;
    }

    if (!this.isVerified) {
      this.showVerifyModal(activityId);
      return;
    }

    this.showJoinConfirmModal(activityId);
  },

  // 根据活动生成默认待办事项
  getActivityTodos(activity) {
    const todoMap = {
      '竞赛': ['准备参赛作品', '检查设备/网络', '提前签到打卡'],
      '社交': ['确认出行时间', '准备拍照道具', '查看天气预报'],
      '运动': ['准备运动装备', '提前热身拉伸', '带水/电解质饮料'],
      'AI': ['注册相关账号', '自带笔记本电脑', '提前了解工具基础'],
      '科普': ['预习讲座主题', '准备提问问题', '带笔记本记录'],
      '展览': ['预约/购票', '检查开放时间', '带相机/充电宝'],
      '探店': ['查看店铺营业时间', '预约座位', '带现金备用']
    };
    const todos = todoMap[activity.category] || ['确认活动时间地点', '提前到达签到', '准备所需物品'];
    return todos;
  },

  syncActivityToSchedule(activity) {
    // 避免重复添加
    const existing = mockData.scheduleActivities.find(s => s.activityId === activity.id);
    if (existing) {
      this.highlightedScheduleId = existing.id;
      return;
    }
    const scheduleId = 'sa_' + activity.id;
    this.highlightedScheduleId = scheduleId;
    mockData.scheduleActivities.push({
      id: scheduleId,
      type: 'activity',
      activityId: activity.id,
      title: activity.title.replace(/\s*[#🔥🚀🏰⚡🎨⚛️🏸🏆🤩🐺🗾🎭]+\s*/g, '').trim(),
      date: activity.date,
      time: activity.startTime,
      location: activity.location,
      shareStatus: 'friends',
      notes: activity.description.slice(0, 50) + '...',
      tags: activity.tags,
      companions: activity.participants.map(p => p.name),
      status: 'upcoming'
    });
    // 同步待办事项
    const todos = this.getActivityTodos(activity);
    todos.forEach((text, i) => {
      mockData.todos.push({
        id: 'td_' + activity.id + '_' + i,
        text: text,
        done: false,
        date: activity.date,
        scheduleId: scheduleId
      });
    });
  },

  removeActivityFromSchedule(activity) {
    const idx = mockData.scheduleActivities.findIndex(s => s.activityId === activity.id);
    if (idx === -1) return;
    const scheduleId = mockData.scheduleActivities[idx].id;
    mockData.scheduleActivities.splice(idx, 1);
    // 移除关联的待办
    for (let i = mockData.todos.length - 1; i >= 0; i--) {
      if (mockData.todos[i].scheduleId === scheduleId) {
        mockData.todos.splice(i, 1);
      }
    }
  },

  handleActivityAction(action, activityId, btn) {
    const activity = mockData.activities.find(a => a.id === activityId);
    if (!activity) return;
    if (action === 'join') {
      activity.isJoined = !activity.isJoined;
      const svg = btn.querySelector('svg');
      if (activity.isJoined) {
        btn.classList.add('active');
        svg.innerHTML = '<polyline points="20 6 9 17 4 12"/>';
        activity.currentParticipants = Math.min(activity.currentParticipants + 1, activity.maxParticipants);
        this.syncActivityToSchedule(activity);
        this.showToast('已加入并自动添加到日程 ✓');
      } else {
        btn.classList.remove('active');
        svg.innerHTML = '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>';
        activity.currentParticipants = Math.max(activity.currentParticipants - 1, 0);
        this.removeActivityFromSchedule(activity);
        this.showToast('已取消加入，日程已移除');
      }
      const card = btn.closest('.activity-card');
      if (card) {
        const fill = card.querySelector('.activity-card-progress-fill');
        const text = card.querySelector('.activity-card-progress-text');
        const percent = Math.round((activity.currentParticipants / activity.maxParticipants) * 100);
        if (fill) fill.style.width = percent + '%';
        if (text) text.textContent = activity.currentParticipants + '/' + activity.maxParticipants + ' 已报名';
      }
      // 同步详情页底部按钮状态
      const detailJoinBtn = document.querySelector('.detail-actions .activity-action-btn.join[data-activity-id="' + activityId + '"]');
      if (detailJoinBtn && detailJoinBtn !== btn) {
        detailJoinBtn.classList.toggle('active', activity.isJoined);
        const dSvg = detailJoinBtn.querySelector('svg');
        if (dSvg) {
          dSvg.innerHTML = activity.isJoined ? '<polyline points="20 6 9 17 4 12"/>' : '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>';
        }
      }
    } else if (action === 'follow') {
      const active = btn.classList.toggle('active');
      this.showToast(active ? '已关注该活动' : '已取消关注');
    } else if (action === 'dislike') {
      const card = btn.closest('.activity-card');
      if (card) {
        card.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
        card.style.opacity = '0';
        card.style.transform = 'scale(0.9)';
        setTimeout(() => { card.style.display = 'none'; }, 300);
      }
      this.showToast('已减少此类推荐');
    }
  },

  showVerifyModal(activityId) {
    const content = `
      <div class="modal-header">
        <div class="modal-title">实名认证</div>
        <button class="modal-close" id="modalClose">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
      <div class="modal-body">
        <div class="verify-steps">
          <div class="verify-step active">
            <div class="verify-step-num">1</div>
            <div class="verify-step-text">上传证件</div>
          </div>
          <div class="verify-step">
            <div class="verify-step-num">2</div>
            <div class="verify-step-text">人脸识别</div>
          </div>
          <div class="verify-step">
            <div class="verify-step-num">3</div>
            <div class="verify-step-text">完成认证</div>
          </div>
        </div>
        <div class="ocr-area">
          <div class="ocr-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
          </div>
          <div class="ocr-text">上传身份证正面</div>
          <div class="ocr-hint">支持自动识别，信息仅用于实名认证</div>
        </div>
      </div>
      <div class="modal-footer">
        <button class="modal-btn secondary" id="verifyCancel">稍后再说</button>
        <button class="modal-btn primary" id="verifyConfirm">立即认证</button>
      </div>
    `;
    this.openModal(content);

    document.getElementById('verifyCancel').addEventListener('click', () => this.closeModal());
    document.getElementById('verifyConfirm').addEventListener('click', () => {
      this.isVerified = true;
      this.closeModal();
      this.showJoinConfirmModal(activityId);
    });
  },

  showJoinConfirmModal(activityId) {
    const activity = mockData.activities.find(a => a.id === activityId);
    if (!activity) return;

    const content = `
      <div class="modal-header">
        <div class="modal-title">确认报名</div>
        <button class="modal-close" id="modalClose">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
      <div class="modal-body">
        <div style="text-align: center; margin-bottom: 20px;">
          <div style="font-size: 48px; margin-bottom: 12px;">${activity.coverEmoji}</div>
          <div style="font-size: 18px; font-weight: 700; color: var(--text-primary); margin-bottom: 8px;">${activity.title}</div>
          <div style="font-size: 14px; color: var(--text-secondary);">${activity.date} ${activity.startTime}</div>
        </div>
        <div class="form-group">
          <label class="form-label">联系电话</label>
          <input class="form-input" type="tel" placeholder="请输入手机号码">
        </div>
        <div class="form-group">
          <label class="form-label">备注留言</label>
          <input class="form-input" type="text" placeholder="给发起人留言（可选）">
        </div>
        <label class="form-checkbox">
          <div class="checkbox-box checked"></div>
          <span class="checkbox-text">我同意活动规则和安全须知</span>
        </label>
      </div>
      <div class="modal-footer">
        <button class="modal-btn secondary" id="joinCancel">取消</button>
        <button class="modal-btn primary" id="joinConfirm">确认报名</button>
      </div>
    `;
    this.openModal(content);

    document.getElementById('joinCancel').addEventListener('click', () => this.closeModal());
    document.getElementById('joinConfirm').addEventListener('click', () => {
      activity.isJoined = true;
      activity.currentParticipants += 1;
      this.closeModal();
      this.showSuccessToast();
      this.renderPage(this.currentPage);
    });
  },

  showInterestSettings() {
    const allTags = ['运动', '美食', '娱乐', '展览', 'AI', '科普', '竞赛', '社交'];
    const tagItems = allTags.map(tag => `
      <label class="form-checkbox" style="margin-bottom: 12px;">
        <div class="checkbox-box ${this.selectedInterestTags.includes(tag) ? 'checked' : ''}"></div>
        <span class="checkbox-text">${tag}</span>
      </label>
    `).join('');

    const content = `
      <div class="modal-header">
        <div class="modal-title">兴趣设置</div>
        <button class="modal-close" id="modalClose">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
      <div class="modal-body">
        <div style="font-size: 14px; color: var(--text-secondary); margin-bottom: 16px;">选择你感兴趣的活动类型，我们将为你精准推荐</div>
        ${tagItems}
      </div>
      <div class="modal-footer">
        <button class="modal-btn secondary" id="settingsCancel">取消</button>
        <button class="modal-btn primary" id="settingsSave">保存</button>
      </div>
    `;
    this.openModal(content);

    document.getElementById('settingsCancel').addEventListener('click', () => this.closeModal());
    document.getElementById('settingsSave').addEventListener('click', () => {
      this.closeModal();
      this.showSuccessToast();
    });
  },

  showShareModal(scheduleId) {
    const schedule = mockData.scheduleActivities.find(s => s.id === scheduleId);
    const content = `
      <div class="modal-header">
        <div class="modal-title">分享日程</div>
        <button class="modal-close" id="modalClose">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
      <div class="modal-body">
        <div class="share-options">
          <div class="share-option">
            <div class="share-option-icon">🌐</div>
            <div class="share-option-content">
              <div class="share-option-title">公开分享</div>
              <div class="share-option-desc">所有人可见</div>
            </div>
            <div class="share-option-check ${schedule && schedule.shareStatus === 'public' ? 'checked' : ''}"></div>
          </div>
          <div class="share-option">
            <div class="share-option-icon">👥</div>
            <div class="share-option-content">
              <div class="share-option-title">好友可见</div>
              <div class="share-option-desc">仅好友可见</div>
            </div>
            <div class="share-option-check ${schedule && schedule.shareStatus === 'friends' ? 'checked' : ''}"></div>
          </div>
          <div class="share-option">
            <div class="share-option-icon">🔒</div>
            <div class="share-option-content">
              <div class="share-option-title">私密</div>
              <div class="share-option-desc">仅自己可见</div>
            </div>
            <div class="share-option-check ${schedule && schedule.shareStatus === 'private' ? 'checked' : ''}"></div>
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button class="modal-btn primary" id="shareClose">确定</button>
      </div>
    `;
    this.openModal(content);

    document.getElementById('shareClose').addEventListener('click', () => this.closeModal());
  },

  showSuccessToast() {
    const toast = document.createElement('div');
    toast.style.cssText = 'position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: rgba(0,0,0,0.75); color: white; padding: 12px 24px; border-radius: 24px; font-size: 14px; font-weight: 500; z-index: 200; pointer-events: none; animation: fadeIn 0.2s ease;';
    toast.textContent = '操作成功';
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 1500);
  },

  // ===== HELPERS =====
  openModal(content) {
    const overlay = document.getElementById('modalOverlay');
    const container = document.getElementById('modalContainer');
    container.innerHTML = content;
    overlay.classList.add('active');

    const closeBtn = document.getElementById('modalClose');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.closeModal());
    }
  },

  closeModal() {
    const overlay = document.getElementById('modalOverlay');
    overlay.classList.remove('active');
  },

  bindModalEvents() {
    const overlay = document.getElementById('modalOverlay');
    if (overlay) {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          this.closeModal();
        }
      });
    }
  },

  getWeekday(dateStr) {
    const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    return days[new Date(dateStr).getDay()];
  }
};

document.addEventListener('DOMContentLoaded', () => {
  app.init();
});
