// ============ 宝贝档案渲染 ============
let aiPersonaLoading = false;

function renderProfile() {
  const profile = Storage.get('childProfile', {});
  const persona = Storage.get('userPersona', {});

  // 头像和昵称
  document.getElementById('profile-avatar').textContent = profile.avatar || '🧒';
  document.getElementById('profile-nickname').textContent = profile.nickname || '宝贝';
  document.getElementById('profile-age-tag').textContent = (profile.ageRange || '3-4') + '岁';
  document.getElementById('profile-gender-tag').textContent = profile.gender === 'girl' ? '女孩' : '男孩';

  // 年龄段选择
  document.querySelectorAll('#age-select .tag-select').forEach(tag => {
    tag.classList.toggle('selected', tag.dataset.age === profile.ageRange);
    tag.onclick = () => updateAge(tag.dataset.age);
  });

  // 性别选择
  document.querySelectorAll('#gender-select .tag-select').forEach(tag => {
    tag.classList.toggle('selected', tag.dataset.gender === profile.gender);
    tag.onclick = () => updateGender(tag.dataset.gender);
  });

  // 兴趣标签
  const interests = profile.interests || [];
  const interestContainer = document.getElementById('interest-tags');
  interestContainer.innerHTML = interestTags.map(tag => `
    <span class="tag-select ${interests.includes(tag) ? 'selected' : ''}" onclick="toggleInterest('${tag}')">${tag}</span>
  `).join('');

  // AI 推断标签
  const aiContainer = document.getElementById('ai-tags');
  const aiTags = [];
  const interestProfile = persona.interestProfile || {};
  const sortedInterests = Object.entries(interestProfile).sort((a, b) => b[1] - a[1]);
  if (sortedInterests.length > 0) {
    aiTags.push(`${sortedInterests[0][0]}爱好者`);
  }
  if (persona.totalBooks >= 20) aiTags.push('小书虫');
  if (persona.streakDays >= 7) aiTags.push('阅读小达人');
  if ((persona.strongAbilities || []).length > 0) aiTags.push(`${persona.strongAbilities[0]}小能手`);

  aiContainer.innerHTML = aiTags.map(tag => `
    <span class="tag-select ai-tag">${tag}</span>
  `).join('') || '<span style="font-size:12px;color:var(--text-light);">暂无推断标签，多读绘本后更新</span>';

  // AI 画像智能分析（延迟加载）
  setTimeout(() => {
    loadAIPersonaAnalysis(profile, persona);
  }, 1500);

  // 阅读水平
  const level = persona.readingLevel || 'beginner';
  const levelMap = { beginner: 0, growing: 1, advanced: 2 };
  const levelIndex = levelMap[level];
  const progress = persona.levelProgress || 30;

  document.querySelectorAll('.level-stage').forEach((el, i) => {
    el.classList.toggle('active', i <= levelIndex);
  });

  const fill = document.getElementById('level-progress-fill');
  const marker = document.getElementById('level-progress-marker');
  fill.style.width = progress + '%';
  marker.style.left = progress + '%';

  const levelDescs = {
    beginner: '宝贝正处于入门期，适合图多字少的认知类绘本',
    growing: '宝贝正处于成长期，图文并重的故事绘本最适合啦',
    advanced: '宝贝已经进入进阶期，可以尝试有情节的短篇故事'
  };
  document.getElementById('level-desc').textContent = levelDescs[level] || levelDescs.beginner;

  // 薄弱能力识别
  renderWeakAbilities();

  // 宝贝阅读名片
  renderPersonaCard();

  // 积分和徽章
  renderPointsBadges();

  // 阅读目标
  updateReadingGoalDisplay();

  // 每周挑战
  updateWeeklyChallengeDisplay();
  
  // API Key 状态
  const kimiKey = localStorage.getItem('kimi_api_key');
  document.getElementById('api-key-status').textContent = kimiKey ? '✓ 已配置 Kimi API Key' : '点击配置 Kimi AI API Key';
  
  // 讯飞语音识别状态
  const xunfeiAppId = localStorage.getItem('xunfei_app_id');
  document.getElementById('xunfei-status').textContent = xunfeiAppId ? '✓ 已配置讯飞语音识别' : '点击配置讯飞语音识别 API';
}

// AI 画像智能分析
async function loadAIPersonaAnalysis(profile, persona) {
  if (aiPersonaLoading) return;
  aiPersonaLoading = true;
  
  const records = Storage.get('readingRecords', []);
  
  // 只在有足够阅读记录时才调用AI
  if (records.length < 10) {
    aiPersonaLoading = false;
    return;
  }
  
  const todayKey = getTodayKey();
  const cacheKey = 'ai_persona_cache';
  const cache = Storage.get(cacheKey, null);
  
  if (cache && cache.date === todayKey && cache.analysis) {
    renderAIPersonaAnalysis(cache.analysis);
    aiPersonaLoading = false;
    return;
  }
  
  const recentBooks = records.slice(0, 10).map(r => r.bookTitle).join('、');
  const ageInfo = profile.ageRange || '3-4岁';
  const interests = persona.interests?.slice(0, 3).join('、') || '阅读';
  const strongAbilities = persona.strongAbilities?.slice(0, 2).join('、') || '综合能力';
  const weakAbilities = persona.weakAbilities?.slice(0, 2).join('、') || '需全面发展';
  
  const messages = [
    {
      role: 'system',
      content: `你是"童书伴读"的儿童阅读专家，根据孩子的阅读数据生成个性化画像分析。
要求：
1. 返回严格的JSON格式，不要包含任何其他文字
2. JSON包含5个字段：
   - readerType: 孩子是什么类型的读者（一句话描述，如"充满好奇心的小探险家"）
   - readingFeatures: 阅读特点分析（1-2句话，用温暖的语言描述孩子的阅读特点）
   - growthSuggestions: 成长建议（1-2句话，给出具体的成长建议）
   - recommendedDirections: 推荐阅读方向数组，每个元素包含：
     * category: 类别名称（如"科学思维"、"社交能力"）
     * reason: 推荐理由（1句话，说明为什么推荐这个方向）
     * icon: emoji图标（选择一个合适的图标）
3. 推荐方向至少返回2个，最多3个
4. 类别名称优先使用这些：语言表达、情绪认知、科学思维、社交能力、艺术美育、自然认知
5. 语言温暖有洞察力，像教育顾问一样`
    },
    {
      role: 'user',
      content: `孩子信息：
- 年龄：${ageInfo}
- 已读书数：${persona.totalBooks || 0}本
- 总阅读时长：${persona.totalMinutes || 0}分钟
- 连续阅读天数：${persona.streakDays || 0}天
- 兴趣偏好：${interests}
- 能力优势：${strongAbilities}
- 需要加强：${weakAbilities}
- 最近阅读：${recentBooks}

请生成个性化的阅读画像分析，返回JSON格式。`
    }
  ];
  
  const analysis = await callKimiAPI(messages, 0.5);
  
  let parsedData = null;
  if (analysis) {
    try {
      const jsonStr = analysis.replace(/```json/g, '').replace(/```/g, '').trim();
      parsedData = JSON.parse(jsonStr);
    } catch (e) {
      parsedData = null;
    }
  }
  
  if (!parsedData) {
    parsedData = {
      readerType: '正在成长的小读者',
      readingFeatures: '孩子展现出良好的阅读兴趣和热情，随着阅读量的增加，阅读能力会不断提升。',
      growthSuggestions: '建议继续保持阅读习惯，选择适合年龄的绘本，逐步拓展阅读广度。',
      recommendedDirections: [
        { category: '综合发展', reason: '根据当前阅读数据，建议均衡发展各项能力', icon: '🌟' }
      ]
    };
  }
  
  if (analysis) {
    Storage.set(cacheKey, { date: todayKey, analysis: parsedData });
  }
  
  renderAIPersonaAnalysis(parsedData);
  
  aiPersonaLoading = false;
}

function renderAIPersonaAnalysis(parsedData) {
  const pointsCard = document.querySelector('#page-profile .card:nth-child(4)');
  if (pointsCard && !document.querySelector('.ai-persona-card')) {
    const analysisHTML = `
        <div class="card ai-persona-card" style="background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);">
          <div style="color: var(--primary); font-weight: 600; margin-bottom: 12px; font-size: 14px;">
            📊 AI画像智能分析
          </div>
          
          <!-- 读者类型 -->
          <div style="background: linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%); padding: 10px 12px; border-radius: 8px; margin-bottom: 10px;">
            <div style="font-size: 11px; color: var(--text-light); margin-bottom: 4px;">小读者画像</div>
            <div style="font-size: 15px; font-weight: 600; color: var(--primary);">${parsedData.readerType || '阅读小萌芽'}</div>
          </div>
          
          <!-- 阅读特点 -->
          <div style="margin-bottom: 10px;">
            <div style="font-size: 11px; color: var(--text-light); margin-bottom: 4px;">阅读特点</div>
            <div style="font-size: 13px; color: var(--text-primary); line-height: 1.6;">${parsedData.readingFeatures || '正在培养阅读兴趣'}</div>
          </div>
          
          <!-- 成长建议 -->
          <div style="background: #e8f5e9; padding: 10px 12px; border-radius: 8px; margin-bottom: 10px;">
            <div style="font-size: 11px; color: var(--text-light); margin-bottom: 4px;">💡 成长建议</div>
            <div style="font-size: 13px; color: var(--text-primary); line-height: 1.6;">${parsedData.growthSuggestions || '建议继续培养阅读习惯'}</div>
          </div>
          
          <!-- 推荐方向 -->
          ${parsedData.recommendedDirections && parsedData.recommendedDirections.length > 0 ? `
          <div style="font-size: 11px; color: var(--text-light); margin-bottom: 8px;">📚 推荐阅读方向</div>
          <div style="display: grid; grid-template-columns: repeat(${Math.min(parsedData.recommendedDirections.length, 3)}, 1fr); gap: 8px;">
            ${parsedData.recommendedDirections.slice(0, 3).map(dir => `
              <div style="background: linear-gradient(135deg, #f3e5f5 0%, #e1bee7 100%); padding: 10px; border-radius: 8px; text-align: center;">
                <div style="font-size: 18px; margin-bottom: 4px;">${dir.icon || '📚'}</div>
                <div style="font-size: 12px; font-weight: 600; color: var(--text-primary); margin-bottom: 4px;">${dir.category || '阅读'}</div>
                <div style="font-size: 10px; color: var(--text-secondary); line-height: 1.4;">${dir.reason || '拓展阅读'}</div>
              </div>
            `).join('')}
          </div>
          ` : ''}
        </div>
      `;
    
    pointsCard.insertAdjacentHTML('afterend', analysisHTML);
  }
}

function renderPersonaCard() {
  const persona = Storage.get('userPersona', {});
  const records = Storage.get('readingRecords', []);
  const profile = Storage.get('childProfile', {});

  document.getElementById('persona-total-books').textContent = persona.totalBooks || 0;
  document.getElementById('persona-total-minutes').textContent = persona.totalMinutes || 0;
  document.getElementById('persona-streak').textContent = persona.streakDays || 0;

  const level = persona.readingLevel || 'beginner';
  const badgeEl = document.getElementById('persona-badge');
  const levelMap = {
    beginner: { icon: '🌱', name: '阅读小萌芽' },
    growing: { icon: '🌿', name: '阅读小达人' },
    advanced: { icon: '🌳', name: '阅读小博士' }
  };
  const levelInfo = levelMap[level] || levelMap.beginner;
  badgeEl.querySelector('.badge-icon').textContent = levelInfo.icon;
  badgeEl.querySelector('.badge-level').textContent = levelInfo.name;

  const interestProfile = persona.interestProfile || {};
  const interests = Object.entries(interestProfile)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  const interestsContainer = document.getElementById('persona-top-interests');
  if (interests.length === 0) {
    interestsContainer.innerHTML = '<div style="font-size:12px;color:var(--text-light);">多读几本就能发现兴趣啦~</div>';
  } else {
    interestsContainer.innerHTML = interests.map((item, index) => `
      <div class="top-interest-item rank-${index + 1}">
        <span class="interest-rank">${index + 1}</span>
        <span>${item[0]}</span>
      </div>
    `).join('');
  }

  const abilityCounts = persona.abilityCounts || {};
  const strongAbilities = persona.strongAbilities || [];
  const abilityIcons = {
    '语言表达': '🗣️',
    '自然认知': '🌿',
    '科学思维': '🔬',
    '艺术创造': '🎨',
    '精细动作': '✋',
    '情绪认知': '😊',
    '社交能力': '🤝'
  };

  const abilitiesContainer = document.getElementById('persona-ability-badges');
  const sortedAbilities = Object.entries(abilityCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  if (sortedAbilities.length === 0) {
    abilitiesContainer.innerHTML = '<div style="font-size:12px;color:var(--text-light);">继续阅读解锁能力徽章~</div>';
  } else {
    abilitiesContainer.innerHTML = sortedAbilities.map(item => {
      const isStrong = strongAbilities.includes(item[0]);
      return `
        <div class="ability-badge-item ${isStrong ? 'strong' : ''}">
          <div class="ability-badge-icon">${abilityIcons[item[0]] || '⭐'}</div>
          <div class="ability-badge-name">${item[0]}</div>
        </div>
      `;
    }).join('');
  }

  const traits = generatePersonaTraits(persona, records, profile);
  document.getElementById('trait-1').querySelector('.trait-text').textContent = traits[0] || '继续阅读发现更多特质~';
  document.getElementById('trait-2').querySelector('.trait-text').textContent = traits[1] || '多读几本解锁更多洞察~';
  document.getElementById('trait-3').querySelector('.trait-text').textContent = traits[2] || '每一次共读都是成长的印记~';
}

function generatePersonaTraits(persona, records, profile) {
  const traits = [];
  const interestProfile = persona.interestProfile || {};
  const emotionCounts = persona.emotionCounts || {};
  const strongAbilities = persona.strongAbilities || [];
  const weakAbilities = persona.weakAbilities || [];
  const totalRecords = persona.recordCount || 0;

  if (totalRecords === 0) {
    return [];
  }

  const topInterest = Object.entries(interestProfile).sort((a, b) => b[1] - a[1])[0];
  if (topInterest) {
    traits.push(`对「${topInterest[0]}」主题特别感兴趣，是个小专家哦~`);
  }

  const likeCount = emotionCounts['很喜欢'] || emotionCounts['要求再读'] || 0;
  if (likeCount > totalRecords * 0.5) {
    traits.push('是个热情的小书虫，大部分绘本都超喜欢！');
  }

  if ((emotionCounts['主动提问'] || 0) > totalRecords * 0.3) {
    traits.push('好奇心旺盛，经常主动提问，是个爱思考的宝贝~');
  }

  if (strongAbilities.length > 0) {
    traits.push(`在${strongAbilities.slice(0, 2).join('、')}方面表现突出，继续保持！`);
  }

  if (persona.streakDays >= 7) {
    traits.push(`已经连续阅读${persona.streakDays}天啦，坚持力棒棒的！`);
  }

  if ((emotionCounts['读到一半分心'] || 0) > totalRecords * 0.4) {
    traits.push('注意力正在发展中，可以试试分段阅读，每次短一点~');
  }

  if (weakAbilities.length > 0) {
    traits.push(`在${weakAbilities[0]}方面可以多练习，选对应的绘本玩着学~`);
  }

  if (persona.totalBooks >= 10) {
    traits.push(`已经读过${persona.totalBooks}本书啦，阅读量超赞！`);
  }

  while (traits.length < 3) {
    traits.push('每一次共读都在帮助宝贝成长~');
  }

  return traits.slice(0, 3);
}


// ============ AI互动讲绘本 ============
let aiCameraStream = null;
let aiCurrentBook = null;
let aiReadStartTime = null;
let aiReadTimerInterval = null;
let aiChatHistory = [];  // 互动对话历史
let aiQACount = 0;  // 问答次数
let aiIsRecording = false;

// 打开AI互动弹窗
function openAIVideoModal() {
  document.getElementById('ai-video-modal').classList.add('show');
  resetAIVideo();
}

// 关闭AI互动弹窗
function closeAIVideoModal() {
  document.getElementById('ai-video-modal').classList.remove('show');
  stopAICamera();
  stopAISpeaking();
  if (aiReadTimerInterval) {
    clearInterval(aiReadTimerInterval);
    aiReadTimerInterval = null;
  }
}

// 重置AI互动状态
function resetAIVideo() {
  stopAISpeaking();
  // 隐藏其他阶段，显示扫描阶段
  document.getElementById('ai-step-scan').style.display = 'block';
  document.getElementById('ai-step-reading').style.display = 'none';
  document.getElementById('ai-step-summary').style.display = 'none';
  
  // 重置摄像头按钮
  document.getElementById('btn-open-camera').style.display = 'flex';
  document.getElementById('btn-capture-book').style.display = 'none';
  document.getElementById('btn-capture-book').disabled = true;
  
  // 重置摄像头预览
  const video = document.getElementById('ai-camera-video');
  video.style.display = 'none';
  video.srcObject = null;
  document.getElementById('camera-placeholder').style.display = 'flex';
  document.getElementById('scan-line').style.display = 'none';
  document.getElementById('book-detected-box').style.display = 'none';
  
  // 重置状态变量
  aiCurrentBook = null;
  aiReadStartTime = null;
  aiChatHistory = [];
  aiQACount = 0;
}

// 打开摄像头
function startAICamera() {
  if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      .then(stream => {
        aiCameraStream = stream;
        const video = document.getElementById('ai-camera-video');
        video.srcObject = stream;
        video.style.display = 'block';
        document.getElementById('camera-placeholder').style.display = 'none';
        document.getElementById('btn-open-camera').style.display = 'none';
        document.getElementById('btn-capture-book').style.display = 'flex';
        document.getElementById('btn-capture-book').disabled = false;
        document.getElementById('scan-line').style.display = 'block';
      })
      .catch(err => {
        console.error('摄像头打开失败:', err);
        showToast('摄像头打开失败，请直接选择绘本');
        // 自动选择绘本
        selectBookForAI('random');
      });
  } else {
    showToast('您的浏览器不支持摄像头');
    selectBookForAI('random');
  }
}

// 停止摄像头
function stopAICamera() {
  if (aiCameraStream) {
    aiCameraStream.getTracks().forEach(track => track.stop());
    aiCameraStream = null;
  }
}

// 拍照并识别绘本
function captureAndRecognizeBook() {
  const video = document.getElementById('ai-camera-video');
  const canvas = document.getElementById('ai-camera-canvas');
  const ctx = canvas.getContext('2d');
  
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  ctx.drawImage(video, 0, 0);
  
  // 显示识别中
  document.getElementById('detected-book-name').textContent = '正在识别...';
  document.getElementById('book-detected-box').style.display = 'block';
  
  // 模拟AI识别（实际项目中可以调用图像识别API）
  setTimeout(() => {
    // 从绘本库中随机选择一个适合年龄的绘本
    const suitableBooks = bookDatabase.filter(b => 
      b.ageRange.includes('4') || b.ageRange.includes('5') || b.ageRange.includes('3')
    );
    aiCurrentBook = suitableBooks[Math.floor(Math.random() * suitableBooks.length)];
    
    document.getElementById('detected-book-name').textContent = aiCurrentBook.title;
    
    // 自动开始阅读
    setTimeout(() => {
      startAIReading();
    }, 1000);
  }, 1500);
}

// 选择绘本（type: 'recent', 'recommended', 'random'）
function selectBookForAI(type) {
  let books = [];
  
  switch(type) {
    case 'recent':
      // 获取最近阅读的绘本
      const recentRecords = Storage.get('readingRecords', []);
      const recentBookIds = [...new Set(recentRecords.map(r => r.bookId))].slice(0, 5);
      books = recentBookIds.map(id => bookDatabase.find(b => b.id === id)).filter(Boolean);
      if (books.length === 0) {
        showToast('暂无最近阅读记录，将随机选择');
        selectBookForAI('random');
        return;
      }
      break;
    case 'recommended':
      // 获取推荐绘本（根据孩子年龄和兴趣）
      books = bookDatabase.filter(b => 
        b.ageRange.includes('4') || b.ageRange.includes('5')
      ).slice(0, 10);
      break;
    case 'random':
    default:
      // 随机选择
      books = bookDatabase.filter(b => 
        b.ageRange.includes('4') || b.ageRange.includes('5') || b.ageRange.includes('3')
      );
      aiCurrentBook = books[Math.floor(Math.random() * books.length)];
      startAIReading();
      return;
  }
  
  // 如果有多个选项，显示选择器
  if (books.length > 1) {
    showBookSelector(books);
  } else if (books.length === 1) {
    aiCurrentBook = books[0];
    startAIReading();
  }
}

// 显示绘本选择器
function showBookSelector(books) {
  const bookListHTML = books.map(book => `
    <div onclick="selectAndStartReading('${book.id}')" style="display:flex;align-items:center;gap:10px;padding:10px;border-radius:8px;cursor:pointer;margin-bottom:6px;background:#fff;" onmouseover="this.style.background='#f0f0f0'" onmouseout="this.style.background='#fff'">
      <div style="font-size:28px;">${book.emoji}</div>
      <div style="flex:1;">
        <div style="font-size:13px;font-weight:600;color:#333;">${book.title}</div>
        <div style="font-size:11px;color:#888;">${book.author}</div>
      </div>
    </div>
  `).join('');
  
  const modalHTML = `
    <div class="modal-overlay" id="ai-book-selector" style="z-index:3100;" onclick="closeBookSelector(event)">
      <div class="modal" style="width:90%;max-width:400px;max-height:80vh;overflow-y:auto;background:#fff;border-radius:16px;">
        <div style="background:linear-gradient(135deg,#667eea,#764ba2);color:#fff;padding:12px 16px;border-radius:16px 16px 0 0;font-size:15px;font-weight:600;">📚 选择绘本</div>
        <div style="padding:12px;">
          ${bookListHTML}
        </div>
        <div style="padding:12px;text-align:center;">
          <button onclick="closeBookSelector()" style="background:#f0f0f0;color:#666;border:none;padding:10px 20px;border-radius:20px;font-size:13px;cursor:pointer;">取消</button>
        </div>
      </div>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', modalHTML);
  document.getElementById('ai-book-selector').classList.add('show');
}

function closeBookSelector(event) {
  if (!event || event.target.id === 'ai-book-selector') {
    const modal = document.getElementById('ai-book-selector');
    if (modal) {
      modal.classList.remove('show');
      setTimeout(() => modal.remove(), 300);
    }
  }
}

function selectAndStartReading(bookId) {
  aiCurrentBook = bookDatabase.find(b => b.id == bookId);
  closeBookSelector();
  if (aiCurrentBook) {
    startAIReading();
  }
}

// 开始AI阅读
function startAIReading() {
  if (!aiCurrentBook) return;
  
  stopAICamera();
  
  // 切换到阅读阶段
  document.getElementById('ai-step-scan').style.display = 'none';
  document.getElementById('ai-step-reading').style.display = 'block';
  document.getElementById('ai-step-summary').style.display = 'none';
  
  // 设置绘本信息
  document.getElementById('ai-book-emoji').textContent = aiCurrentBook.emoji;
  document.getElementById('ai-book-title').textContent = aiCurrentBook.title;
  document.getElementById('ai-book-author').textContent = aiCurrentBook.author || '佚名';
  document.getElementById('ai-book-name-in-chat').textContent = aiCurrentBook.title;
  
  // 清空对话历史
  aiChatHistory = [];
  aiQACount = 0;
  
  // 开始计时
  aiReadStartTime = Date.now();
  aiReadTimerInterval = setInterval(updateReadTime, 1000);
  
  // 清空对话区域，添加开场白
  const chatContainer = document.getElementById('ai-chat-container');
  chatContainer.innerHTML = `
    <div class="ai-chat-item" style="display:flex;gap:8px;margin-bottom:10px;animation:fadeInUp 0.3s ease;">
      <div style="width:28px;height:28px;background:linear-gradient(135deg,#667eea,#764ba2);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:14px;flex-shrink:0;">🤖</div>
      <div style="background:#fff;padding:8px 12px;border-radius:12px 12px 12px 4px;max-width:85%;font-size:13px;color:#333;line-height:1.5;box-shadow:0 1px 3px rgba(0,0,0,0.05);">
        <div id="ai-opening-message">小朋友你好呀！我是你的AI绘本老师👋<br><br>今天我们要读《<span id="ai-book-name-in-chat">${aiCurrentBook.title}</span>》这本书～准备好了吗？</div>
        <button onclick="speakText('ai-opening-message')" style="margin-top:6px;background:#f0f0f0;border:none;border-radius:4px;padding:2px 6px;font-size:10px;color:#666;cursor:pointer;">🔊 朗读</button>
      </div>
    </div>
  `;
  
  // 记录AI开场
  aiChatHistory.push({ role: 'ai', message: '小朋友你好呀！我是你的AI绘本老师。今天我们要读《' + aiCurrentBook.title + '》这本书～准备好了吗？' });
  
  // 生成故事内容并添加
  setTimeout(() => {
    generateStoryAndQuestions();
  }, 500);
}

// 生成故事和提问
async function generateStoryAndQuestions() {
  const chatContainer = document.getElementById('ai-chat-container');
  
  // 添加加载指示器
  const loadingDiv = document.createElement('div');
  loadingDiv.className = 'ai-chat-item';
  loadingDiv.innerHTML = `
    <div style="width:28px;height:28px;background:linear-gradient(135deg,#667eea,#764ba2);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:14px;flex-shrink:0;">🤖</div>
    <div style="background:#fff;padding:8px 12px;border-radius:12px 12px 12px 4px;max-width:85%;font-size:13px;color:#666;box-shadow:0 1px 3px rgba(0,0,0,0.05);">
      <span>🤔 AI正在组织故事内容...</span>
    </div>
  `;
  chatContainer.appendChild(loadingDiv);
  chatContainer.scrollTop = chatContainer.scrollHeight;
  
  // 生成本地故事内容
  const story = generateLocalStory(aiCurrentBook);
  const questions = generateQuestions(aiCurrentBook);
  
  // 移除加载指示器
  loadingDiv.remove();
  
  // 添加故事
  addAIChatMessage(story);
  aiChatHistory.push({ role: 'ai', message: story });
  
  // 等待一下，然后添加提问
  setTimeout(() => {
    const questionsText = `故事讲完啦！现在让我来考考你吧～\n\n${questions.map((q, i) => `${i+1}. ${q}`).join('\n')}\n\n你可以点击上方按钮回答，或者直接告诉我你的答案哦！`;
    
    addAIChatMessage(questionsText);
    aiChatHistory.push({ role: 'ai', message: questionsText, isQuestion: true });
    aiQACount += questions.length;
  }, 1000);
}

// 生成本地故事内容
function generateLocalStory(book) {
  const tips = book.readingTips || '这是一个很有趣的故事，让我们一起看看吧！';
  return `《${book.title}》\n\n${book.description || ''}\n\n${tips}`;
}

// 生成适合孩子的问题
function generateQuestions(book) {
  const baseQuestions = [
    `故事里的主人公是谁呀？`,
    `你觉得故事里发生了什么有趣的事？`,
    `如果你是故事里的小动物，你会怎么做呢？`,
    `这个故事告诉了我们什么道理？`
  ];
  
  // 根据绘本类型添加特定问题
  if (book.tags && book.tags.includes('情绪成长')) {
    baseQuestions.push(`你有没有像故事里的小朋友一样有过这种感觉？`);
  } else if (book.tags && book.tags.includes('科普百科')) {
    baseQuestions.push(`你最喜欢故事里提到的哪个知识点？`);
  } else if (book.tags && book.tags.includes('益智思维')) {
    baseQuestions.push(`你能帮故事里的小朋友想想办法吗？`);
  }
  
  return baseQuestions.slice(0, 3);
}

// 添加AI对话消息
function addAIChatMessage(message, isQuestion = false) {
  const chatContainer = document.getElementById('ai-chat-container');
  const msgDiv = document.createElement('div');
  msgDiv.className = 'ai-chat-item';
  msgDiv.innerHTML = `
    <div style="width:28px;height:28px;background:linear-gradient(135deg,#667eea,#764ba2);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:14px;flex-shrink:0;">🤖</div>
    <div style="background:#fff;padding:8px 12px;border-radius:12px 12px 12px 4px;max-width:85%;font-size:13px;color:#333;line-height:1.6;box-shadow:0 1px 3px rgba(0,0,0,0.05);white-space:pre-wrap;">
      ${message.replace(/\n/g, '<br>')}
      ${isQuestion ? '<button onclick="speakText(this.parentElement)" style="margin-top:6px;background:#f0f0f0;border:none;border-radius:4px;padding:2px 6px;font-size:10px;color:#666;cursor:pointer;">🔊 朗读</button>' : ''}
    </div>
  `;
  chatContainer.appendChild(msgDiv);
  chatContainer.scrollTop = chatContainer.scrollHeight;
}

// 添加孩子消息
function addChildChatMessage(message) {
  const chatContainer = document.getElementById('ai-chat-container');
  const msgDiv = document.createElement('div');
  msgDiv.className = 'ai-chat-item';
  msgDiv.style.cssText = 'display:flex;gap:8px;margin-bottom:10px;justify-content:flex-end;animation:fadeInUp 0.3s ease;';
  msgDiv.innerHTML = `
    <div style="background:linear-gradient(135deg,#667eea,#764ba2);color:#fff;padding:8px 12px;border-radius:12px 12px 4px 12px;max-width:85%;font-size:13px;line-height:1.5;">
      ${message}
    </div>
    <div style="width:28px;height:28px;background:#4CAF50;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:14px;flex-shrink:0;">👶</div>
  `;
  chatContainer.appendChild(msgDiv);
  chatContainer.scrollTop = chatContainer.scrollHeight;
}

// 快捷回应
function sendChildResponse(response) {
  addChildChatMessage(response);
  aiChatHistory.push({ role: 'child', message: response });
  aiQACount++;
  
  // AI回应
  setTimeout(() => {
    let aiResponse = '';
    switch(response) {
      case '听懂了':
        aiResponse = '太棒了！👍 你真是个爱学习的好孩子！还有其他问题想问的吗？';
        break;
      case '不懂':
        aiResponse = '没关系的～让我们再读一遍，我来给你解释得更清楚一些。你觉得哪里不明白呢？';
        break;
      default:
        aiResponse = '谢谢你告诉我！😊 继续加油哦！还有其他想了解的吗？';
    }
    addAIChatMessage(aiResponse);
    aiChatHistory.push({ role: 'ai', message: aiResponse });
  }, 800);
}

// 快捷提问
function askAIQuestion(type) {
  let question = '';
  switch(type) {
    case '再讲一遍':
      question = '可以再讲一遍吗？';
      break;
    case '为什么':
      question = '为什么故事会这样发展呢？';
      break;
    default:
      question = type;
  }
  
  addChildChatMessage(question);
  aiChatHistory.push({ role: 'child', message: question });
  aiQACount++;
  
  // AI回应
  setTimeout(() => {
    let response = '';
    switch(type) {
      case '再讲一遍':
        response = `好的！让我再给你讲一遍这个故事吧～\n\n${generateLocalStory(aiCurrentBook)}\n\n讲完了！你现在理解了吗？`;
        break;
      case '为什么':
        response = `这是一个很好的问题！🤔\n\n因为故事想要告诉我们，通过努力和勇气，我们可以克服困难，实现自己的梦想。就像你一样，只要认真学习，也能学会很多本领呢！`;
        break;
      default:
        response = `你问得很好！😊 ${generateLocalStory(aiCurrentBook)}`;
    }
    addAIChatMessage(response);
    aiChatHistory.push({ role: 'ai', message: response });
  }, 1000);
}

// 处理输入框回车
function handleAIInput(event) {
  if (event.key === 'Enter') {
    sendChildMessage();
  }
}

// 发送孩子消息
function sendChildMessage() {
  const input = document.getElementById('ai-child-input');
  const message = input.value.trim();
  
  if (!message) return;
  
  addChildChatMessage(message);
  aiChatHistory.push({ role: 'child', message: message });
  aiQACount++;
  input.value = '';
  
  // AI智能回应
  setTimeout(() => {
    const response = generateAIResponse(message);
    addAIChatMessage(response);
    aiChatHistory.push({ role: 'ai', message: response });
  }, 800);
}

// 生成AI回应
function generateAIResponse(childMessage) {
  const responses = [
    '你回答得真好！🌟 继续加油！',
    '哇，你的想法真棒！👍',
    '说得不错！😊 还有其他问题吗？',
    '你真会思考！💪 我们继续吧～',
    '很好的回答！📚 你学到了很多呢！'
  ];
  
  // 根据孩子输入的关键词生成更具体的回应
  if (childMessage.includes('喜欢')) {
    return '我也觉得这个很有趣呢！😊 喜欢阅读是很棒的习惯，继续保持哦！';
  } else if (childMessage.includes('不懂') || childMessage.includes('不知道')) {
    return '没关系的，不懂就问是很好的学习态度！让我再解释一下...';
  } else if (childMessage.includes('为什么')) {
    return '你问了一个很有深度的问题呢！因为...这就是故事的精彩之处！';
  }
  
  return responses[Math.floor(Math.random() * responses.length)];
}

// 语音合成朗读
function speakText(elementOrId) {
  let text = '';
  if (typeof elementOrId === 'string') {
    const el = document.getElementById(elementOrId);
    text = el ? el.textContent : '';
  } else {
    text = elementOrId.textContent;
  }
  
  // 移除HTML标签
  text = text.replace(/<[^>]*>/g, '');
  
  if ('speechSynthesis' in window) {
    speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'zh-CN';
    utterance.rate = 0.9;
    utterance.pitch = 1.1;
    speechSynthesis.speak(utterance);
  }
}

// 停止朗读
function stopAISpeaking() {
  if ('speechSynthesis' in window) {
    speechSynthesis.cancel();
  }
}

// 切换语音录制
function toggleVoiceRecord() {
  if (aiIsRecording) {
    aiIsRecording = false;
    document.getElementById('btn-voice-record').innerHTML = '🎤';
    // 停止语音识别
  } else {
    aiIsRecording = true;
    document.getElementById('btn-voice-record').innerHTML = '⏹️';
    showToast('语音录制功能开发中，请手动输入');
    // 实际项目中可以集成讯飞语音识别
  }
}

// 更新阅读时间显示
function updateReadTime() {
  if (!aiReadStartTime) return;
  
  const elapsed = Math.floor((Date.now() - aiReadStartTime) / 1000);
  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;
  const timeStr = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  
  document.getElementById('ai-read-time').textContent = timeStr;
}

// 结束AI阅读
function finishAIReading() {
  if (aiReadTimerInterval) {
    clearInterval(aiReadTimerInterval);
    aiReadTimerInterval = null;
  }
  
  stopAISpeaking();
  
  // 计算阅读时长
  const duration = aiReadStartTime ? Math.floor((Date.now() - aiReadStartTime) / 60000) : 5;
  
  // 切换到总结阶段
  document.getElementById('ai-step-scan').style.display = 'none';
  document.getElementById('ai-step-reading').style.display = 'none';
  document.getElementById('ai-step-summary').style.display = 'block';
  
  // 显示统计
  document.getElementById('summary-time').textContent = `${duration}分钟`;
  document.getElementById('summary-qa').textContent = `${aiQACount}次`;
  
  // 生成AI点评
  generateAIReview(duration);
}

// 生成AI阅读点评
function generateAIReview(duration) {
  const reviewContent = document.getElementById('ai-review-content');
  
  // 基于对话历史生成点评
  const childResponses = aiChatHistory.filter(h => h.role === 'child');
  const questionCount = aiChatHistory.filter(h => h.isQuestion).length;
  
  let review = '';
  
  // 基础评价
  if (aiQACount >= 5) {
    review = `🌟 阅读小明星！\n\n这次阅读中，你和AI老师进行了${aiQACount}次互动问答，表现非常积极！`;
  } else if (aiQACount >= 3) {
    review = `👍 积极参与者\n\n这次阅读你参与了${aiQACount}次互动，继续保持这种好奇心和探索精神！`;
  } else {
    review = `💪 初次尝试\n\n这是你第一次和AI老师一起阅读，完成得很棒！下次可以多提一些问题哦～`;
  }
  
  // 添加绘本相关评价
  if (aiCurrentBook) {
    review += `\n\n📚 关于《${aiCurrentBook.title}》\n`;
    if (aiCurrentBook.tags && aiCurrentBook.tags.includes('科普百科')) {
      review += `这是一本有趣的科普书，你在阅读中学到了很多新知识！`;
    } else if (aiCurrentBook.tags && aiCurrentBook.tags.includes('情绪成长')) {
      review += `这本书帮助你认识了不同的情绪，继续加油！`;
    } else {
      review += `这本书的故事情节很精彩，你有什么最喜欢的部分吗？`;
    }
  }
  
  // 家长建议
  review += `\n\n👨‍👩‍👧 给家长的小贴士：\n`;
  if (duration < 10) {
    review += `这次阅读时间较短，建议每天固定10-15分钟的亲子阅读时间。`;
  } else if (duration >= 20) {
    review += `阅读时间很充足！孩子的专注力很棒，继续保持。`;
  } else {
    review += `良好的阅读习惯是学习的基础，建议每天坚持阅读。`;
  }
  
  // 显示点评（带打字机效果）
  let charIndex = 0;
  reviewContent.innerHTML = '';
  
  const typeInterval = setInterval(() => {
    if (charIndex < review.length) {
      reviewContent.innerHTML = review.substring(0, charIndex + 1).replace(/\n/g, '<br>');
      charIndex++;
    } else {
      clearInterval(typeInterval);
      // 添加保存按钮
      document.getElementById('btn-save-record').style.display = 'block';
    }
  }, 30);
}

// 保存AI阅读记录
function saveAIReadingRecord() {
  if (!aiCurrentBook) {
    showToast('没有可保存的阅读记录');
    return;
  }
  
  const duration = aiReadStartTime ? Math.floor((Date.now() - aiReadStartTime) / 60000) : 5;
  
  // 准备记录数据
  const record = {
    bookId: aiCurrentBook.id,
    title: aiCurrentBook.title,
    date: new Date().toISOString().split('T')[0],
    duration: duration,
    rating: 5,  // AI互动默认为好评
    emotion: ['AI互动'],
    ability: ['专注力', '语言表达'],
    highlight: `【AI互动讲绘本】${aiQACount}次问答互动。\n\n孩子反馈：${aiChatHistory.filter(h => h.role === 'child').map(h => h.message).join('；')}。\n\n阅读感受：${aiChatHistory.filter(h => h.role === 'ai').slice(-1)[0]?.message || ''}`,
    isAIInteractive: true  // 标记为AI互动
  };
  
  // 保存记录
  const records = Storage.get('readingRecords', []);
  records.unshift(record);
  Storage.set('readingRecords', records);
  
  showToast('AI阅读记录已保存！');
  
  // 刷新页面显示新记录
  setTimeout(() => {
    closeAIVideoModal();
    location.reload();
  }, 1000);
}

function renderPointsBadges() {
  const pointsData = getPointsData();
  const persona = Storage.get('userPersona', {});
  const records = Storage.get('readingRecords', []);

  document.getElementById('total-points').textContent = pointsData.totalPoints;

  const previewContainer = document.getElementById('badges-preview');
  const unlockedBadges = pointsData.unlockedBadges || [];
  const previewBadges = badgeDefinitions.slice(0, 6);

  previewContainer.innerHTML = previewBadges.map(badge => {
    const isUnlocked = unlockedBadges.includes(badge.id);
    return `<div class="badge-mini ${isUnlocked ? '' : 'locked'}" title="${badge.name}">${badge.icon}</div>`;
  }).join('');
}

function openPointsModal() {
  document.getElementById('points-modal').classList.add('show');
  renderBadgeGrid();
  renderPointsRecordList();
  updatePointsSummary();
}

function closePointsModal() {
  document.getElementById('points-modal').classList.remove('show');
}

function switchPointsTab(tab) {
  document.querySelectorAll('.points-modal-tab').forEach(t => {
    t.classList.toggle('active', t.dataset.tab === tab);
  });
  document.getElementById('points-tab-badges').style.display = tab === 'badges' ? 'block' : 'none';
  document.getElementById('points-tab-points').style.display = tab === 'points' ? 'block' : 'none';
  document.getElementById('points-tab-exchange').style.display = tab === 'exchange' ? 'block' : 'none';
  
  if (tab === 'exchange') {
    renderExchangeList();
  }
}

function updatePointsSummary() {
  const pointsData = getPointsData();
  const unlockedCount = (pointsData.unlockedBadges || []).length;
  const totalBadges = badgeDefinitions.length;

  document.getElementById('modal-total-points').textContent = pointsData.totalPoints;
  document.getElementById('modal-total-points-2').textContent = pointsData.totalPoints;
  document.getElementById('modal-unlocked-badges').textContent = unlockedCount;
  document.getElementById('modal-total-badges').textContent = totalBadges;
  document.getElementById('modal-exchange-points').textContent = pointsData.totalPoints;

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthPoints = (pointsData.records || []).filter(r => new Date(r.timestamp) >= monthStart)
    .reduce((sum, r) => sum + r.points, 0);
  document.getElementById('modal-month-points').textContent = monthPoints;
}


// ============ 阅读目标系统 ============
const defaultReadingGoal = { month: { books: 10, minutes: 120, days: 15 }, quarter: { books: 30, minutes: 360, days: 40 } };
let currentGoalPeriod = 'month';

function getReadingGoal() {
  const profile = Storage.get('childProfile', {});
  const saved = profile.readingGoal || { ...defaultReadingGoal };
  return saved[currentGoalPeriod] || defaultReadingGoal[currentGoalPeriod];
}

function getGoalPeriodLabel() {
  return currentGoalPeriod === 'month' ? '本月' : '本季度';
}

function calculateGoalProgress() {
  const goal = getReadingGoal();
  const records = Storage.get('readingRecords', []);
  const now = new Date();
  
  let periodStart;
  if (currentGoalPeriod === 'month') {
    periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
  } else {
    const quarter = Math.floor(now.getMonth() / 3);
    periodStart = new Date(now.getFullYear(), quarter * 3, 1);
  }
  
  const periodRecords = records.filter(r => {
    const recordDate = new Date(r.date);
    return recordDate >= periodStart && recordDate <= now;
  });

  const actualBooks = new Set(periodRecords.map(r => r.bookTitle)).size;
  const actualMinutes = periodRecords.reduce((sum, r) => sum + (r.duration || 0), 0);
  const daysWithReading = new Set(periodRecords.map(r => r.date)).size;

  const booksProgress = Math.min(100, Math.round((actualBooks / goal.books) * 100));
  const minutesProgress = Math.min(100, Math.round((actualMinutes / goal.minutes) * 100));
  const daysProgress = Math.min(100, Math.round((daysWithReading / goal.days) * 100));

  const overallProgress = Math.round(booksProgress * 0.4 + minutesProgress * 0.3 + daysProgress * 0.3);

  return {
    books: { current: actualBooks, target: goal.books, progress: booksProgress },
    minutes: { current: actualMinutes, target: goal.minutes, progress: minutesProgress },
    days: { current: daysWithReading, target: goal.days, progress: daysProgress },
    overall: overallProgress
  };
}

function updateReadingGoalDisplay() {
  const progress = calculateGoalProgress();
  document.getElementById('goal-period-label').textContent = getGoalPeriodLabel();
  document.getElementById('goal-completion-rate').textContent = progress.overall + '%';
  document.getElementById('goal-progress-fill').style.width = progress.overall + '%';
  document.getElementById('goal-books-stat').textContent = `📚 ${progress.books.current}/${progress.books.target}`;
  document.getElementById('goal-minutes-stat').textContent = `⏱️ ${progress.minutes.current}分`;
  document.getElementById('goal-days-stat').textContent = `📅 ${progress.days.current}天`;
}

function switchGoalPeriod(period) {
  currentGoalPeriod = period;
  
  document.querySelectorAll('.goal-period-tab').forEach(tab => {
    tab.classList.toggle('active', tab.textContent.includes(period === 'month' ? '月度' : '季度'));
    if (tab.classList.contains('active')) {
      tab.style.background = 'var(--primary)';
      tab.style.color = 'white';
    } else {
      tab.style.background = 'var(--secondary-bg)';
      tab.style.color = 'var(--text-secondary)';
    }
  });
  
  updateReadingGoalDisplay();
}

function openReadingGoalModal() {
  const goal = getReadingGoal();
  
  // 设置选中状态
  document.querySelectorAll('.goal-tag').forEach(tag => {
    const type = tag.dataset.type;
    const value = parseInt(tag.dataset.value);
    tag.classList.toggle('selected', value === goal[type]);
  });
  
  document.getElementById('reading-goal-modal').classList.add('show');
}

function closeReadingGoalModal() {
  document.getElementById('reading-goal-modal').classList.remove('show');
}

function saveReadingGoal() {
  const selectedTags = document.querySelectorAll('.goal-tag.selected');
  const goal = { books: 10, minutes: 120, days: 15 };
  
  selectedTags.forEach(tag => {
    const type = tag.dataset.type;
    const value = parseInt(tag.dataset.value);
    goal[type] = value;
  });

  const profile = Storage.get('childProfile', {});
  profile.readingGoal = profile.readingGoal || { month: { ...defaultReadingGoal.month }, quarter: { ...defaultReadingGoal.quarter } };
  profile.readingGoal[currentGoalPeriod] = goal;
  Storage.set('childProfile', profile);
  
  updateReadingGoalDisplay();
  closeReadingGoalModal();
  showToast('阅读目标已设置！');
}

// 点击目标标签切换选中
document.addEventListener('click', function(e) {
  if (e.target.classList.contains('goal-tag')) {
    const type = e.target.dataset.type;
    document.querySelectorAll(`.goal-tag[data-type="${type}"]`).forEach(t => t.classList.remove('selected'));
    e.target.classList.add('selected');
  }
});

// ============ 每周挑战系统 ============
const defaultWeeklyChallenge = { books: 5, minutes: 120, categories: 3, records: 3 };

function getWeeklyChallenge() {
  const profile = Storage.get('childProfile', {});
  return profile.weeklyChallenge || { ...defaultWeeklyChallenge };
}

function calculateWeeklyProgress() {
  const challenge = getWeeklyChallenge();
  const records = Storage.get('readingRecords', []);
  const now = new Date();
  const dayOfWeek = now.getDay() || 7;
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - dayOfWeek + 1);
  weekStart.setHours(0, 0, 0, 0);
  
  const weekRecords = records.filter(r => new Date(r.date) >= weekStart);
  
  const actualBooks = new Set(weekRecords.map(r => r.bookTitle)).size;
  const actualMinutes = weekRecords.reduce((sum, r) => sum + (r.duration || 0), 0);
  
  const categories = new Set();
  weekRecords.forEach(r => {
    const book = bookDatabase.find(b => b.title === r.bookTitle);
    if (book) categories.add(book.tags[0]);
  });
  const actualCategories = categories.size;
  
  const actualRecords = weekRecords.filter(r => r.interactionHighlights && r.interactionHighlights.length > 10).length;
  
  const booksProgress = Math.min(100, Math.round((actualBooks / challenge.books) * 100));
  const minutesProgress = Math.min(100, Math.round((actualMinutes / challenge.minutes) * 100));
  const categoriesProgress = Math.min(100, Math.round((actualCategories / challenge.categories) * 100));
  const recordsProgress = Math.min(100, Math.round((actualRecords / challenge.records) * 100));
  
  const overallProgress = Math.round((booksProgress + minutesProgress + categoriesProgress + recordsProgress) / 4);
  
  return {
    books: { current: actualBooks, target: challenge.books, progress: booksProgress },
    minutes: { current: actualMinutes, target: challenge.minutes, progress: minutesProgress },
    categories: { current: actualCategories, target: challenge.categories, progress: categoriesProgress },
    records: { current: actualRecords, target: challenge.records, progress: recordsProgress },
    overall: overallProgress
  };
}

function updateWeeklyChallengeDisplay() {
  const progress = calculateWeeklyProgress();
  document.getElementById('weekly-progress-fill').style.width = progress.overall + '%';
  document.getElementById('weekly-progress-text').textContent = `${progress.overall}%`;
  document.getElementById('weekly-reward').textContent = '+50积分';
  
  const status = progress.overall >= 100 ? '✅ 已完成' : '进行中';
  document.getElementById('weekly-challenge-status').textContent = status;
}

function openWeeklyChallengeModal() {
  const challenge = getWeeklyChallenge();
  
  document.querySelectorAll('.week-tag').forEach(tag => {
    const type = tag.dataset.type;
    const value = parseInt(tag.dataset.value);
    tag.classList.toggle('selected', value === challenge[type]);
  });
  
  document.getElementById('weekly-challenge-modal').classList.add('show');
}

function closeWeeklyChallengeModal() {
  document.getElementById('weekly-challenge-modal').classList.remove('show');
}

function saveWeeklyChallenge() {
  const selectedTags = document.querySelectorAll('.week-tag.selected');
  const challenge = { books: 5, minutes: 120, categories: 3, records: 3 };
  
  selectedTags.forEach(tag => {
    const type = tag.dataset.type;
    const value = parseInt(tag.dataset.value);
    challenge[type] = value;
  });

  const profile = Storage.get('childProfile', {});
  profile.weeklyChallenge = challenge;
  Storage.set('childProfile', profile);
  
  updateWeeklyChallengeDisplay();
  closeWeeklyChallengeModal();
  showToast('每周挑战已设置！');
}

// 点击挑战标签切换选中
document.addEventListener('click', function(e) {
  if (e.target.classList.contains('week-tag')) {
    const type = e.target.dataset.type;
    document.querySelectorAll(`.week-tag[data-type="${type}"]`).forEach(t => t.classList.remove('selected'));
    e.target.classList.add('selected');
  }
});

// 每周挑战完成奖励检查
function checkWeeklyChallengeReward() {
  const pointsData = getPointsData();
  const now = new Date();
  const weekKey = `${now.getFullYear()}-W${Math.ceil((now.getDate() - now.getDay() + 1) / 7)}`;
  
  if (pointsData.weeklyRewards && pointsData.weeklyRewards[weekKey]) {
    return;
  }
  
  const progress = calculateWeeklyProgress();
  if (progress.overall >= 100) {
    pointsData.totalPoints += 50;
    pointsData.records.push({
      timestamp: Date.now(),
      points: 50,
      reason: '🔥 完成本周挑战'
    });
    pointsData.weeklyRewards = pointsData.weeklyRewards || {};
    pointsData.weeklyRewards[weekKey] = true;
    savePointsData(pointsData);
  }
}

// ============ 积分兑换系统 ============
const exchangeItems = [
  { id: 'recognition', name: '专属称号', desc: '解锁"阅读小达人"称号', icon: '🎖️', cost: 100, type: 'title' },
  { id: 'theme1', name: '主题皮肤', desc: '海洋探险主题背景', icon: '🌊', cost: 200, type: 'theme' },
  { id: 'theme2', name: '主题皮肤', desc: '森林冒险主题背景', icon: '🌲', cost: 200, type: 'theme' },
  { id: 'report', name: '深度报告', desc: '解锁月度深度分析报告', icon: '📊', cost: 150, type: 'report' },
  { id: 'category', name: '扩展分类', desc: '解锁2个新绘本分类', icon: '📚', cost: 300, type: 'category' },
  { id: 'badge1', name: '专属徽章', desc: '解锁"知识探险家"徽章', icon: '🧭', cost: 500, type: 'badge' }
];

function renderExchangeList() {
  const pointsData = getPointsData();
  const owned = pointsData.exchangedItems || [];
  const container = document.getElementById('exchange-list');
  
  container.innerHTML = exchangeItems.map(item => {
    const isOwned = owned.includes(item.id);
    const canAfford = pointsData.totalPoints >= item.cost;
    
    return `
      <div style="display:flex;align-items:center;gap:12px;padding:12px;background:var(--secondary-bg);border-radius:10px;margin-bottom:8px;">
        <div style="font-size:32px;">${item.icon}</div>
        <div style="flex:1;">
          <div style="font-size:14px;font-weight:600;">${item.name}</div>
          <div style="font-size:12px;color:var(--text-light);">${item.desc}</div>
        </div>
        <div>
          ${isOwned 
            ? '<span style="font-size:12px;color:#4CAF50;">已拥有</span>'
            : `<button class="btn btn-outline btn-sm" onclick="exchangeItem('${item.id}')" ${!canAfford ? 'disabled style="opacity:0.5;"' : ''}>${item.cost}积分</button>`
          }
        </div>
      </div>
    `;
  }).join('');
}

function exchangeItem(itemId) {
  const item = exchangeItems.find(i => i.id === itemId);
  if (!item) return;
  
  const pointsData = getPointsData();
  const owned = pointsData.exchangedItems || [];
  
  if (owned.includes(itemId)) {
    showToast('已拥有该权益');
    return;
  }
  
  if (pointsData.totalPoints < item.cost) {
    showToast('积分不足');
    return;
  }
  
  pointsData.totalPoints -= item.cost;
  owned.push(itemId);
  pointsData.exchangedItems = owned;
  savePointsData(pointsData);
  
  showBadgeCelebration({ icon: item.icon, name: item.name, desc: item.desc + ' - 已兑换' });
  updatePointsSummary();
  renderExchangeList();
}

function renderBadgeGrid() {
  const persona = Storage.get('userPersona', {});
  const records = Storage.get('readingRecords', []);
  const pointsData = getPointsData();
  const container = document.getElementById('badge-grid');

  container.innerHTML = badgeDefinitions.map(badge => {
    const isUnlocked = pointsData.unlockedBadges.includes(badge.id);
    const progress = calculateBadgeProgress(badge, persona, records);
    const progressBar = isUnlocked ? '' : `
      <div class="badge-card-progress">
        <div class="badge-card-progress-fill" style="width: ${progress.percent}%"></div>
      </div>
    `;
    const progressText = isUnlocked ? '已解锁' : `${progress.current}/${progress.target}`;

    return `
      <div class="badge-card ${isUnlocked ? 'unlocked' : 'locked'}">
        <div class="badge-card-icon">${badge.icon}</div>
        <div class="badge-card-name">${badge.name}</div>
        <div class="badge-card-desc">${badge.desc}</div>
        ${progressBar}
        <div style="font-size:10px;color:var(--text-light);margin-top:4px;">${progressText}</div>
      </div>
    `;
  }).join('');
}

function renderPointsRecordList() {
  const pointsData = getPointsData();
  const container = document.getElementById('points-record-list');
  const records = pointsData.records || [];

  if (records.length === 0) {
    container.innerHTML = '<div style="text-align:center;padding:30px;color:var(--text-light);font-size:13px;">暂无积分记录，开始阅读吧！</div>';
    return;
  }

  container.innerHTML = records.map(r => `
    <div class="points-record-item">
      <div class="points-record-info">
        <div class="points-record-title">${r.reason}</div>
        <div class="points-record-time">${r.time}</div>
      </div>
      <div class="points-record-value ${r.points < 0 ? 'minus' : ''}">
        ${r.points > 0 ? '+' : ''}${r.points}
      </div>
    </div>
  `).join('');
}

function renderWeakAbilities() {
  const persona = Storage.get('userPersona', {});
  const weakAbilities = persona.weakAbilities || [];
  const container = document.getElementById('weak-ability-list');

  if (weakAbilities.length === 0) {
    container.innerHTML = '<div style="text-align:center;padding:20px;color:var(--text-light);font-size:13px;">🎉 暂无明显薄弱项，继续保持！</div>';
    return;
  }

  container.innerHTML = weakAbilities.map(weak => {
    let reason = '';
    let cat = 'emotion';
    if (weak.includes('情绪')) { reason = '最近阅读中情绪类绘本占比较少'; cat = 'emotion'; }
    if (weak.includes('社交')) { reason = '社交主题绘本阅读量偏低'; cat = 'social'; }
    if (weak.includes('科学')) { reason = '科学探索类内容接触较少'; cat = 'science'; }
    if (weak.includes('语言')) { reason = '语言表达类绘本还可以加强'; cat = 'language'; }

    return `
      <div style="padding:12px;background:var(--primary-bg);border-radius:var(--radius-sm);margin-bottom:10px;">
        <div style="font-size:14px;font-weight:600;margin-bottom:4px;">${weak}</div>
        <div style="font-size:12px;color:var(--text-secondary);margin-bottom:8px;">${reason}</div>
        <button class="btn btn-primary btn-sm" onclick="goToCategory('${cat}')">查看推荐</button>
      </div>
    `;
  }).join('');
}


// ============ 档案编辑功能 ============
function updateAge(age) {
  let profile = Storage.get('childProfile', {});
  profile.ageRange = age;
  Storage.set('childProfile', profile);
  renderProfile();
  showToast('年龄段已更新');
}

function updateGender(gender) {
  let profile = Storage.get('childProfile', {});
  profile.gender = gender;
  Storage.set('childProfile', profile);
  renderProfile();
  showToast('性别已更新');
}

function toggleInterest(tag) {
  let profile = Storage.get('childProfile', {});
  let interests = profile.interests || [];
  const idx = interests.indexOf(tag);
  if (idx > -1) {
    interests.splice(idx, 1);
  } else {
    interests.push(tag);
  }
  profile.interests = interests;
  Storage.set('childProfile', profile);
  updateUserPersona();
  renderProfile();
}

function editNickname() {
  const profile = Storage.get('childProfile', {});
  const newName = prompt('请输入宝贝昵称', profile.nickname || '');
  if (newName && newName.trim()) {
    profile.nickname = newName.trim();
    Storage.set('childProfile', profile);
    renderProfile();
    renderHome();
    showToast('昵称已更新');
  }
}

// 头像选择
let selectedAvatar = null;

function openAvatarSelector() {
  const profile = Storage.get('childProfile', {});
  selectedAvatar = profile.avatar || '🧒';
  const grid = document.getElementById('avatar-grid');
  grid.innerHTML = avatarOptions.map(av => `
    <div class="avatar-option ${av === selectedAvatar ? 'selected' : ''}" onclick="selectAvatar('${av}')">${av}</div>
  `).join('');
  document.getElementById('avatar-modal').classList.add('show');
}

function selectAvatar(av) {
  selectedAvatar = av;
  document.querySelectorAll('.avatar-option').forEach(el => {
    el.classList.toggle('selected', el.textContent === av);
  });
}

function closeAvatarModal() {
  document.getElementById('avatar-modal').classList.remove('show');
}

function saveAvatar() {
  let profile = Storage.get('childProfile', {});
  profile.avatar = selectedAvatar;
  Storage.set('childProfile', profile);
  closeAvatarModal();
  renderProfile();
  renderHome();
  showToast('头像已更新');
}

