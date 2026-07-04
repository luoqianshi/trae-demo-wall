// ============ 首页渲染 ============
let aiSummaryLoading = false;

function renderHome() {
  const profile = Storage.get('childProfile', {});
  document.getElementById('home-nickname').textContent = profile.nickname || '宝贝';
  document.getElementById('home-avatar').textContent = profile.avatar || '🧒';

  // 渲染分类 Tab
  const tabsContainer = document.getElementById('category-tabs');
  tabsContainer.innerHTML = categories.map(cat => `
    <span class="category-tab ${cat.id === currentCategory ? 'active' : ''}" onclick="switchCategory('${cat.id}')">
      ${cat.emoji} ${cat.name}
    </span>
  `).join('');

  // 渲染推荐列表
  renderBookList();
  
  // 添加 AI 推荐摘要（延迟加载避免频繁调用API）
  setTimeout(() => {
    loadAISummary();
  }, 2000);
}

function getTodayKey() {
  const now = new Date();
  return `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
}

async function loadAISummary() {
  if (aiSummaryLoading) return;
  aiSummaryLoading = true;
  
  const records = Storage.get('readingRecords', []);
  const profile = Storage.get('childProfile', {});
  const persona = Storage.get('userPersona', {});
  
  // 只在有阅读记录时才调用AI
  if (records.length < 5) {
    aiSummaryLoading = false;
    return;
  }
  
  const todayKey = getTodayKey();
  const cacheKey = 'ai_summary_cache';
  const cache = Storage.get(cacheKey, null);
  
  if (cache && cache.date === todayKey && cache.summary) {
    renderAISummary(cache.summary);
    aiSummaryLoading = false;
    return;
  }
  
  const recentBooks = records.slice(0, 5).map(r => r.bookTitle).join('、');
  const ageInfo = profile.ageRange || '3-4岁';
  const interests = persona.interests?.slice(0, 3).join('、') || '阅读';
  
  const messages = [
    {
      role: 'system',
      content: `你是"童书伴读"的智能推荐助手，为家长生成简洁的今日推荐摘要。要求：
1. 根据孩子阅读历史和兴趣，生成个性化推荐引导语
2. 语言温暖简洁，控制在50字以内
3. 要有引导性，让人想去看推荐的书`
    },
    {
      role: 'user',
      content: `孩子信息：${ageInfo}，兴趣：${interests}
最近读的书：${recentBooks}

请生成一句引导语，告诉家长今天推荐的书有什么特别之处。`
    }
  ];
  
  const summary = await callKimiAPI(messages, 0.6);
  
  if (summary) {
    Storage.set(cacheKey, { date: todayKey, summary: summary });
    renderAISummary(summary);
  } else {
    const fallbackSummary = `根据宝贝最近的阅读兴趣，今天为您精选了几本好书，希望宝贝喜欢！`;
    renderAISummary(fallbackSummary);
  }
  
  aiSummaryLoading = false;
}

function renderAISummary(summary) {
  const bookList = document.getElementById('book-list');
  if (bookList && !bookList.querySelector('.ai-summary')) {
    const summaryDiv = document.createElement('div');
    summaryDiv.className = 'ai-summary';
    summaryDiv.style.cssText = 'background: linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%); padding: 10px 12px; border-radius: 10px; margin-bottom: 12px; font-size: 13px; line-height: 1.6;';
    summaryDiv.innerHTML = `<span style="color: var(--primary);">✨ AI推荐：</span>${summary}`;
    bookList.insertBefore(summaryDiv, bookList.firstChild);
  }
}

function switchCategory(categoryId) {
  currentCategory = categoryId;
  isSearchMode = false;
  document.getElementById('search-input').value = '';
  document.querySelectorAll('.category-tab').forEach(tab => {
    tab.classList.toggle('active', tab.textContent.includes(categories.find(c => c.id === categoryId)?.name));
  });
  renderBookList();
}

function renderBookList() {
  const books = getRecommendedBooks(currentCategory, currentCategory === 'today' ? 5 : 4);
  const container = document.getElementById('book-list');
  const favorites = Storage.get('favoriteBooks', []);

  if (books.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="emoji">📚</div>
        <div class="text">这个分类下暂无绘本<br>快去看看其他分类吧~</div>
      </div>
    `;
    return;
  }

  container.innerHTML = books.map(book => {
    const isFav = favorites.includes(book.id);
    const records = Storage.get('readingRecords', []);
    const readCount = records.filter(r => r.bookTitle === book.title).length;
    const hasRead = readCount > 0;
    return `
    <div class="book-card">
      ${hasRead ? '<div class="book-read-badge">已读' + readCount + '次</div>' : ''}
      <div class="book-card-main" onclick="showBookDetail(${book.id})">
        <div class="book-cover">${book.emoji}</div>
        <div class="book-info">
          <div class="book-title">${book.title}</div>
          <div class="book-author">${book.author}</div>
          <div class="book-tags">
            <span class="tag tag-age">${book.ageRange}岁</span>
            ${book.tags.slice(0, 2).map(t => `<span class="tag tag-theme">${t}</span>`).join('')}
          </div>
          <div class="book-reason">${book.recommendationReason}</div>
          <div class="book-abilities">
            ${Object.entries(book.abilities).slice(0, 3).map(([key, val]) => {
              const nameMap = { language: '语言', science: '科学', art: '艺术', social: '社交', emotion: '情绪' };
              return `<span class="ability-item">${nameMap[key]}<span class="ability-stars">${'★'.repeat(Math.ceil(val/2))}</span></span>`;
            }).join('')}
          </div>
        </div>
      </div>
      <div class="book-card-actions">
        <button class="action-btn favorite ${isFav ? 'active' : ''}" onclick="event.stopPropagation(); toggleFavorite(${book.id})" title="收藏">
          ${isFav ? '⭐' : '☆'}
        </button>
        <button class="action-btn get" onclick="event.stopPropagation(); openGetBookModal(${book.id})" title="获取">
          📥
        </button>
      </div>
    </div>
  `}).join('');
}

// ============ 搜索功能 ============
let isSearchMode = false;

function handleSearch(event) {
  if (event.key === 'Enter') {
    performSearch();
  }
}

function performSearch() {
  const query = document.getElementById('search-input').value.trim();
  if (!query) {
    isSearchMode = false;
    renderBookList();
    return;
  }

  isSearchMode = true;
  const container = document.getElementById('book-list');
  const records = Storage.get('readingRecords', []);

  const results = bookDatabase.filter(book => {
    const searchText = query.toLowerCase();
    return book.title.toLowerCase().includes(searchText) ||
           book.author.toLowerCase().includes(searchText) ||
           book.tags.some(tag => tag.toLowerCase().includes(searchText));
  });

  if (results.length > 0) {
    container.innerHTML = results.map(book => {
      const favorites = Storage.get('favoriteBooks', []);
      const isFav = favorites.includes(book.id);

      const bookRecords = records.filter(r => r.bookTitle === book.title);
      const readCount = bookRecords.length;
      const avgRating = readCount > 0 
        ? Math.round(bookRecords.reduce((sum, r) => sum + (parseInt(r.rating) || 0), 0) / readCount) 
        : 0;
      const hasRead = readCount > 0;

      return `
        <div class="book-card">
          ${hasRead ? '<div class="book-read-badge">已读' + readCount + '次</div>' : ''}
          <div class="book-card-main" onclick="showBookDetail(${book.id})">
            <div class="book-cover">${book.emoji}</div>
            <div class="book-info">
              <div class="book-title">${book.title}</div>
              <div class="book-author">${book.author}</div>
              <div class="book-tags">
                <span class="tag tag-age">${book.ageRange}岁</span>
                ${book.tags.slice(0, 2).map(t => `<span class="tag tag-theme">${t}</span>`).join('')}
              </div>
              <div class="book-reason">${book.description}</div>
              <div class="book-abilities">
                ${Object.entries(book.abilities).slice(0, 3).map(([key, val]) => {
                  const nameMap = { language: '语言', science: '科学', art: '艺术', social: '社交', emotion: '情绪' };
                  return `<span class="ability-item">${nameMap[key]}<span class="ability-stars">${'★'.repeat(Math.ceil(val/2))}</span></span>`;
                }).join('')}
              </div>
              <div class="search-stats">
                <span class="search-stat-item">📖 阅读 ${readCount} 次</span>
                <span class="search-stat-item">📝 记录 ${readCount} 条</span>
                ${avgRating > 0 ? `<span class="search-stat-item">⭐ 评分 ${avgRating}分</span>` : ''}
              </div>
            </div>
          </div>
          <div class="book-card-actions">
            <button class="action-btn favorite ${isFav ? 'active' : ''}" onclick="event.stopPropagation(); toggleFavorite(${book.id})" title="收藏">${isFav ? '⭐' : '☆'}</button>
            <button class="action-btn get" onclick="event.stopPropagation(); openGetBookModal(${book.id})" title="获取">📥</button>
          </div>
        </div>
      `;
    }).join('');
  } else {
    saveBookRequest(query);
    
    container.innerHTML = `
      <div class="empty-state" style="padding: 30px 20px;">
        <div class="emoji" style="font-size: 48px; margin-bottom: 12px;">📭</div>
        <div class="text" style="font-size: 15px;">抱歉，我们还未收录《${query}》这本绘本</div>
        <div class="text" style="font-size: 13px; color: var(--text-secondary); margin-top: 8px;">我们会记录您的需求，尽快补充到绘本库中</div>
        <div style="margin-top: 16px;">
          <button class="btn btn-primary btn-block" onclick="document.getElementById('search-input').value=''; isSearchMode=false; renderBookList();">返回推荐</button>
        </div>
      </div>
    `;
  }
}

function saveBookRequest(bookName) {
  let requests = Storage.get('bookRequests', []);
  
  const existing = requests.find(r => r.name === bookName);
  if (existing) {
    existing.count = (existing.count || 1) + 1;
    existing.lastRequest = new Date().toISOString();
  } else {
    requests.push({
      name: bookName,
      count: 1,
      firstRequest: new Date().toISOString(),
      lastRequest: new Date().toISOString()
    });
  }
  
  Storage.set('bookRequests', requests);
}

let currentDetailBookId = null;
let aiRecommendationLoading = false;
let aiQuestionsLoading = false;
let aiTipsLoading = false;

async function showBookDetail(bookId, defaultTab = 'tips') {
  const book = bookDatabase.find(b => b.id === bookId);
  if (!book) return;

  currentDetailBookId = bookId;
  const profile = Storage.get('childProfile', {});
  const persona = Storage.get('userPersona', {});

  document.getElementById('detail-cover').textContent = book.emoji;
  document.getElementById('detail-title').textContent = book.title;
  document.getElementById('detail-author').textContent = book.author;
  document.getElementById('detail-record-book-title').value = book.title;
  document.getElementById('detail-record-date').value = formatDate(new Date());
  document.getElementById('detail-record-duration').value = '5';
  document.getElementById('detail-record-highlights').value = '';
  setDetailRecordRating(3);
  document.querySelectorAll('#detail-record-emotion-tags .tag-select').forEach(tag => tag.classList.remove('selected'));
  
  // 默认选中"一般投入"
  const defaultDetailEngagement = document.querySelector('#detail-record-emotion-tags .tag-select[data-tag="一般投入"]');
  if (defaultDetailEngagement) defaultDetailEngagement.classList.add('selected');
  
  clearDetailRecordTimer();
  detailRecordUploadedImage = null;
  document.getElementById('detail-record-image-preview').style.display = 'none';
  document.getElementById('detail-record-image-preview').innerHTML = '';
  document.getElementById('detail-record-image-upload').value = '';

  document.getElementById('detail-tags').innerHTML = `
    <span class="tag tag-age">${book.ageRange}岁</span>
    ${book.tags.map(t => `<span class="tag tag-theme">${t}</span>`).join('')}
  `;

  const basicReason = generateRecommendationReason(book, profile, persona, []);
  document.getElementById('detail-reason').textContent = basicReason;

  document.getElementById('detail-abilities').innerHTML = Object.entries(book.abilities).map(([key, val]) => {
    const nameMap = { language: '语言表达', science: '科学思维', art: '艺术创造', social: '社交能力', emotion: '情绪认知' };
    return `<div style="display:flex;justify-content:space-between;margin-bottom:4px;">
      <span>${nameMap[key]}</span>
      <span style="color: var(--warm-yellow);">${'★'.repeat(val)}</span>
    </div>`;
  }).join('');

  const tips = generateReadingTips(book);
  document.getElementById('detail-tips').innerHTML = tips.map((tip, i) => `
    <div style="margin-bottom:8px;${i === tips.length - 1 ? 'margin-bottom:0;' : ''}">
      <span style="color: var(--primary); font-weight: 600;">${i + 1}.</span> ${tip}
    </div>
  `).join('');

  const childAge = profile.ageRange || '3-4';
  const basicQuestions = generateQuestions(book, childAge);
  document.getElementById('detail-questions').innerHTML = basicQuestions.map((q, i) => `
    <div style="margin-bottom:6px;${i === basicQuestions.length - 1 ? 'margin-bottom:0;' : ''}">
      <span style="color: var(--primary); font-weight: 600; margin-right:6px;">${i + 1}.</span>
      <span style="font-size:13px;line-height:1.5;">${q.text}</span>
    </div>
  `).join('');

  const extension = generateExtension(book);
  document.getElementById('detail-extension').innerHTML = `
    <div style="background: var(--secondary-bg);padding:10px 12px;border-radius:8px;">
      <div style="font-size:13px;line-height:1.6;">${extension}</div>
    </div>
  `;

  updateDetailFavBtn();

  document.getElementById('book-detail-modal').classList.add('show');
  
  // 切换到指定的默认标签
  if (defaultTab === 'record') {
    switchDetailTab('record');
  } else {
    switchDetailTab('tips');
  }

  setTimeout(async () => {
    const cacheKey = `ai_reason_${bookId}`;
    const cache = Storage.get(cacheKey, null);
    
    if (cache && cache.reason) {
      document.getElementById('detail-reason').innerHTML = `<span style="color: var(--primary);">✨ AI推荐：</span>${cache.reason}`;
      return;
    }
    
    aiRecommendationLoading = true;
    const aiReason = await kimiGenerateReason(book, persona);
    if (aiReason && aiRecommendationLoading && currentDetailBookId === bookId) {
      Storage.set(cacheKey, { reason: aiReason });
      document.getElementById('detail-reason').innerHTML = `<span style="color: var(--primary);">✨ AI推荐：</span>${aiReason}`;
    }
    aiRecommendationLoading = false;
  }, 500);

  setTimeout(async () => {
    const cacheKey = `ai_tips_${bookId}`;
    const cache = Storage.get(cacheKey, null);
    
    if (cache && cache.tips) {
      renderDetailTips(cache.tips);
      return;
    }
    
    aiTipsLoading = true;
    const aiTipsMessages = [
      {
        role: 'system',
        content: `你是"童书伴读"的亲子共读专家，为家长生成实用的阅读指导小贴士。要求：
1. 生成3条简洁的小贴士
2. 内容要具体、可操作
3. 结合绘本特点和孩子年龄
4. 每条控制在30字以内`
      },
      {
        role: 'user',
        content: `绘本：《${book.title}》
特点：${book.description || '有趣的故事'}
适读年龄：${book.ageRange}岁
请生成3条亲子共读小贴士，帮助家长更好地和孩子一起读这本书。`
      }
    ];
    const aiTipsText = await callKimiAPI(aiTipsMessages, 0.6);
    if (aiTipsText && aiTipsLoading && currentDetailBookId === bookId) {
      const aiTipsList = aiTipsText.split('\n').filter(t => t.trim()).slice(0, 3);
      if (aiTipsList.length >= 2) {
        Storage.set(cacheKey, { tips: aiTipsList });
        renderDetailTips(aiTipsList);
      }
    }
    aiTipsLoading = false;
  }, 800);

  setTimeout(async () => {
    const cacheKey = `ai_questions_${bookId}`;
    const cache = Storage.get(cacheKey, null);
    
    if (cache && cache.questions) {
      renderDetailQuestions(cache.questions);
      return;
    }
    
    aiQuestionsLoading = true;
    const aiQuestionsText = await kimiGenerateQuestions(book, childAge);
    if (aiQuestionsText && aiQuestionsLoading && currentDetailBookId === bookId) {
      const aiQuestionsList = aiQuestionsText.split('\n').filter(q => q.trim());
      if (aiQuestionsList.length >= 2) {
        Storage.set(cacheKey, { questions: aiQuestionsList });
        renderDetailQuestions(aiQuestionsList);
      }
    }
    aiQuestionsLoading = false;
  }, 1200);
}

function renderDetailTips(tipsList) {
  document.getElementById('detail-tips').innerHTML = `
    ${tipsList.map((t, i) => `
        <div style="margin-bottom:8px;${i === tipsList.length - 1 ? 'margin-bottom:0;' : ''}">
          <span style="color: var(--primary); font-weight: 600;">${i + 1}.</span> ${t.trim()}
        </div>
      `).join('')}
  `;
}

function renderDetailQuestions(questionsList) {
  document.getElementById('detail-questions').innerHTML = `
    ${questionsList.map((q, i) => `
        <div style="margin-bottom:6px;${i === questionsList.length - 1 ? 'margin-bottom:0;' : ''}">
          <span style="color: var(--primary); font-weight: 600; margin-right:6px;">${i + 1}.</span>
          <span style="font-size:13px;line-height:1.5;">${q.trim()}</span>
        </div>
      `).join('')}
  `;
}

// ============ 获取途径功能 ============
let currentGetBookId = null;

function openGetBookModal(bookId) {
  const book = bookDatabase.find(b => b.id === bookId);
  if (!book) return;
  currentGetBookId = bookId;

  document.getElementById('get-book-cover').textContent = book.emoji;
  document.getElementById('get-book-title').textContent = book.title;
  document.getElementById('get-book-author').textContent = book.author;
  document.getElementById('get-isbn-title').textContent = book.title;

  // 生成模拟 ISBN
  const isbn = '978-7-' + String(1000 + bookId * 137).slice(0, 4) + '-' + String(10000 + bookId * 97).slice(0, 5) + '-' + (bookId % 10);
  document.getElementById('get-isbn-code').textContent = isbn;

  // 生成模拟索书号
  const categoryMap = {
    '认知启蒙': 'G613.3', '互动书': 'G613.3', '情绪成长': 'I287.8',
    '行为习惯': 'I287.8', '亲情家庭': 'I287.8', '入园校园': 'I287.8',
    '生命与爱': 'I287.8', '科普百科': 'Z228.1', '国学传统': 'G611',
    '语言文学': 'I287.8', '益智思维': 'G613.4', '艺术美育': 'J228',
    '幼小衔接': 'G613'
  };
  let callNumber = 'I287.8';
  for (const tag of book.tags) {
    if (categoryMap[tag]) {
      callNumber = categoryMap[tag];
      break;
    }
  }
  document.getElementById('get-call-number').textContent = callNumber;

  // 生成漂流书单（同主题5本）
  renderFloatBookList(book);

  document.getElementById('get-book-modal').classList.add('show');
}

function closeGetBookModal() {
  document.getElementById('get-book-modal').classList.remove('show');
}

function renderFloatBookList(book) {
  // 找到同分类的书，排除当前这本
  const sameCategory = bookDatabase.filter(b => {
    if (b.id === book.id) return false;
    return b.tags.some(t => book.tags.includes(t));
  });

  // 随机选4本，加上当前这本共5本
  const shuffled = sameCategory.sort(() => Math.random() - 0.5).slice(0, 4);
  const list = [book, ...shuffled];

  const container = document.getElementById('book-float-list');
  container.innerHTML = list.map((b, i) => `
    <div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid #F0E6D8;${i === list.length - 1 ? 'border-bottom:none;' : ''}">
      <div style="width:24px;height:24px;border-radius:4px;background:var(--primary-bg);display:flex;align-items:center;justify-content:center;font-size:14px;flex-shrink:0;">${b.emoji}</div>
      <div style="flex:1;min-width:0;font-size:13px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${b.title}</div>
      ${i === 0 ? '<span style="font-size:10px;color:var(--primary);background:var(--primary-bg);padding:2px 6px;border-radius:8px;flex-shrink:0;">选中</span>' : ''}
    </div>
  `).join('');
}

function openShop(platform) {
  const book = bookDatabase.find(b => b.id === currentGetBookId);
  if (!book) return;

  const searchUrl = {
    douyin: `https://www.douyin.com/search/${encodeURIComponent(book.title + ' 绘本')}`,
    tmall: `https://list.tmall.com/search_product.htm?q=${encodeURIComponent(book.title + ' 绘本')}`,
    jd: `https://search.jd.com/Search?keyword=${encodeURIComponent(book.title + ' 绘本')}`
  };

  if (searchUrl[platform]) {
    window.open(searchUrl[platform], '_blank');
    showToast('正在跳转到对应平台...');
  }
}

function floatBookRequest() {
  showToast('🎁 漂流绘本申请已提交，等待确认中~');
  closeGetBookModal();
}

// ============ 收藏功能 ============
function toggleFavorite(bookId) {
  let favorites = Storage.get('favoriteBooks', []);
  const idx = favorites.indexOf(bookId);
  if (idx > -1) {
    favorites.splice(idx, 1);
    showToast('已取消收藏');
  } else {
    favorites.push(bookId);
    showToast('⭐ 收藏成功');
  }
  Storage.set('favoriteBooks', favorites);
  renderBookList();
}

function openFavoriteModal() {
  const favorites = Storage.get('favoriteBooks', []);
  const container = document.getElementById('favorite-list');

  if (favorites.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="emoji">⭐</div>
        <div class="text">还没有收藏绘本哦<br>快去首页找找喜欢的绘本吧~</div>
      </div>
    `;
  } else {
    const favBooks = favorites.map(id => bookDatabase.find(b => b.id === id)).filter(Boolean);
    container.innerHTML = favBooks.map(book => `
      <div style="display:flex;gap:10px;padding:10px 0;border-bottom:1px solid var(--border);">
        <div style="width:48px;height:67px;border-radius:6px;background:var(--primary-bg);display:flex;align-items:center;justify-content:center;font-size:24px;flex-shrink:0;">${book.emoji}</div>
        <div style="flex:1;min-width:0;">
          <div style="font-size:14px;font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${book.title}</div>
          <div style="font-size:11px;color:var(--text-light);margin:2px 0;">${book.author}</div>
          <div style="display:flex;gap:6px;margin-top:4px;">
            <button class="btn btn-primary btn-sm" style="padding:2px 8px;font-size:10px;" onclick="closeFavoriteModal();quickRecordBook(${book.id})">记录</button>
            <button class="btn btn-outline btn-sm" style="padding:2px 8px;font-size:10px;" onclick="removeFavorite(${book.id})">取消收藏</button>
          </div>
        </div>
      </div>
    `).join('');
  }

  document.getElementById('favorite-modal').classList.add('show');
}

function closeFavoriteModal() {
  document.getElementById('favorite-modal').classList.remove('show');
}

function removeFavorite(bookId) {
  let favorites = Storage.get('favoriteBooks', []);
  favorites = favorites.filter(id => id !== bookId);
  Storage.set('favoriteBooks', favorites);
  openFavoriteModal();
  showToast('已取消收藏');
}
