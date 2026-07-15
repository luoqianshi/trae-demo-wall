window.DemoApp = (function () {
  const poems = window.DEMO_POEMS || [];
  const feihualing = window.DEMO_FEIHLING || [];
  const collections = window.DEMO_COLLECTIONS || [];

  function getTodayString() {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  }

  function getRandomPoem(withImage = true) {
    const list = withImage ? poems.filter(p => p.image && p.image.startsWith('images/')) : poems;
    if (list.length === 0) return poems[0] || null;
    const idx = Math.floor(Math.random() * list.length);
    return list[idx];
  }

  function getRandomPoems(count, withImage = true) {
    const list = withImage ? poems.filter(p => p.image && p.image.startsWith('images/')) : poems;
    const result = [];
    const used = new Set();
    const max = Math.min(count, list.length);
    while (result.length < max) {
      const idx = Math.floor(Math.random() * list.length);
      if (!used.has(idx)) {
        used.add(idx);
        result.push(list[idx]);
      }
    }
    return result;
  }

  function getPoemById(id) {
    return poems.find(p => p.id === Number(id)) || poems[0];
  }

  function searchPoems(keyword) {
    if (!keyword || !keyword.trim()) return poems;
    const kw = keyword.trim().toLowerCase();
    return poems.filter(p => {
      return (
        p.title.toLowerCase().includes(kw) ||
        p.author.toLowerCase().includes(kw) ||
        (p.dynasty && p.dynasty.toLowerCase().includes(kw)) ||
        (p.content && p.content.join('').toLowerCase().includes(kw))
      );
    });
  }

  function getFeihualingKeywords() {
    const map = {};
    feihualing.forEach(item => {
      if (!map[item.keyword]) map[item.keyword] = [];
      map[item.keyword].push(item);
    });
    return Object.keys(map);
  }

  function getFeihualingByKeyword(keyword) {
    return feihualing.filter(item => item.keyword === keyword);
  }

  function getRandomFeihualing(keyword) {
    const list = getFeihualingByKeyword(keyword);
    if (list.length === 0) return null;
    return list[Math.floor(Math.random() * list.length)];
  }

  function getPoets() {
    const map = {};
    poems.forEach(p => {
      if (!map[p.author]) {
        map[p.author] = { name: p.author, dynasty: p.dynasty, count: 0 };
      }
      map[p.author].count++;
    });
    return Object.values(map).sort((a, b) => b.count - a.count);
  }

  function getPoemsByAuthor(author) {
    return poems.filter(p => p.author === author);
  }

  function handleSearch(event) {
    if (event.key === 'Enter') {
      const input = event.target;
      const keyword = input.value.trim();
      if (keyword) {
        window.location.href = `search.html?q=${encodeURIComponent(keyword)}`;
      }
    }
  }

  function getNavHTML(activePage) {
    const pages = [
      { id: 'index', label: '学诗', icon: 'icon-book', href: 'index.html' },
      { id: 'search', label: '搜索', icon: 'icon-search', href: 'search.html' },
      { id: 'ai-vision', label: 'AI识图', icon: 'icon-image', href: 'ai-vision.html' },
      { id: 'feihualing', label: '飞花令', icon: 'icon-game', href: 'feihualing.html' },
      { id: 'poet', label: '诗人', icon: 'icon-user', href: 'poet.html' }
    ];
    return `
      <nav class="top-nav" id="top-nav">
        <div class="nav-inner">
          <div class="nav-brand" onclick="location.href='index.html'">
            <span class="brand-icon"><svg class="svg-icon svg-icon-brand"><use xlink:href="svg/icons.svg#icon-flower"/></svg></span>
            <span class="brand-text">轻诗阁</span>
            <span class="demo-badge">Demo</span>
          </div>
          <div class="nav-menu">
            ${pages.map(p => `
              <a class="nav-link ${activePage === p.id ? 'active' : ''}" href="${p.href}">
                <span class="nav-icon"><svg class="svg-icon svg-icon-nav"><use xlink:href="svg/icons.svg#${p.icon}"/></svg></span>
                <span>${p.label}</span>
              </a>
            `).join('')}
          </div>
          <div class="nav-search">
            <span class="search-icon"><svg class="svg-icon svg-icon-sm"><use xlink:href="svg/icons.svg#icon-search"/></svg></span>
            <input type="text" class="search-input" placeholder="搜索诗词/诗人..." onkeydown="DemoApp.handleSearch(event)">
          </div>
        </div>
      </nav>
    `;
  }

  function initNav(activePage) {
    const navPlaceholder = document.getElementById('nav-placeholder');
    if (navPlaceholder) {
      navPlaceholder.outerHTML = getNavHTML(activePage);
    }
  }

  return {
    poems,
    feihualing,
    collections,
    getTodayString,
    getRandomPoem,
    getRandomPoems,
    getPoemById,
    searchPoems,
    getFeihualingKeywords,
    getFeihualingByKeyword,
    getRandomFeihualing,
    getPoets,
    getPoemsByAuthor,
    handleSearch,
    getNavHTML,
    initNav
  };
})();
