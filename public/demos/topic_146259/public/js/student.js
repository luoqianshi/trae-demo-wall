const API_BASE = 'http://localhost:3000/api';

// ================= 认证模块 =================
let currentUser = null;

async function api(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      ...(options.headers || {}),
      'Content-Type': 'application/json'
    }
  });
  if (res.status === 401) {
    currentUser = null;
    localStorage.removeItem('cuoti_current_user');
    updateUserInfoUI();
    openLoginModal('登录已过期，请重新登录');
  }
  return res;
}

function updateRoleSwitchUI() {
  const studentLink = document.querySelector('.role-switch a[href="student.html"]');
  const teacherLink = document.querySelector('.role-switch a[href="teacher.html"]');
  if (!studentLink || !teacherLink) return;

  // 未登录时显示两端入口；学生登录仅显示学生端；教师登录显示两端
  studentLink.style.display = 'inline-block';
  teacherLink.style.display = (!currentUser || currentUser.role === 'teacher') ? 'inline-block' : 'none';
}

function updateUserInfoUI() {
  const avatarEl = document.getElementById('user-avatar');
  const nameEl = document.getElementById('user-name');
  const btnAuth = document.getElementById('btn-auth');
  if (!avatarEl || !nameEl || !btnAuth) return;

  if (currentUser) {
    avatarEl.textContent = currentUser.name ? currentUser.name.charAt(0) : '?';
    nameEl.textContent = `${currentUser.name} · ${currentUser.classId === 'teacher' ? '教师' : currentUser.classId + '班'}`;
    btnAuth.textContent = '退出';
  } else {
    avatarEl.textContent = '?';
    nameEl.textContent = '未登录';
    btnAuth.textContent = '登录';
  }
  updateRoleSwitchUI();
}

function openLoginModal(message = '请先登录后再使用错题小助手') {
  const modal = document.getElementById('login-modal');
  const hint = modal.querySelector('.hint');
  if (hint) hint.textContent = message;
  document.getElementById('login-username').value = '';
  document.getElementById('login-password').value = '';
  modal.classList.remove('hidden');
}

function closeLoginModal() {
  document.getElementById('login-modal').classList.add('hidden');
}

async function login(username, password) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    const hint = document.querySelector('#login-modal .hint');
    if (hint) hint.textContent = data.error || '登录失败，请检查用户名和密码';
    return false;
  }
  currentUser = data.user;
  localStorage.setItem('cuoti_current_user', JSON.stringify(currentUser));
  updateUserInfoUI();
  closeLoginModal();
  showToast(`欢迎，${currentUser.name}`);
  return true;
}

async function logout(silent = false) {
  await api('/auth/logout', { method: 'POST' });
  currentUser = null;
  localStorage.removeItem('cuoti_current_user');
  updateUserInfoUI();
  if (!silent) showToast('已退出登录');
}

async function checkAuth() {
  const cached = localStorage.getItem('cuoti_current_user');
  if (cached) {
    try {
      currentUser = JSON.parse(cached);
      updateUserInfoUI();
    } catch (e) {
      currentUser = null;
    }
  }

  const res = await api('/auth/me');
  const data = await res.json();
  if (data.loggedIn) {
    currentUser = data.user;
    localStorage.setItem('cuoti_current_user', JSON.stringify(currentUser));
    updateUserInfoUI();
  } else {
    currentUser = null;
    localStorage.removeItem('cuoti_current_user');
    updateUserInfoUI();
    openLoginModal('请先登录后再使用学生端');
  }
}

function requireAuth(message) {
  if (currentUser) return true;
  openLoginModal(message || '请先登录后再进行操作');
  return false;
}

// 登录/退出按钮
document.getElementById('btn-auth').addEventListener('click', () => {
  if (currentUser) {
    logout();
  } else {
    openLoginModal();
  }
});

// 登录弹窗按钮
document.getElementById('btn-login-submit').addEventListener('click', async () => {
  const username = document.getElementById('login-username').value.trim();
  const password = document.getElementById('login-password').value;
  if (!username || !password) {
    showToast('请输入用户名和密码', 'error');
    return;
  }
  await login(username, password);
});

document.getElementById('btn-login-cancel').addEventListener('click', closeLoginModal);
document.getElementById('login-modal').addEventListener('click', e => {
  if (e.target.id === 'login-modal') closeLoginModal();
});
document.getElementById('login-password').addEventListener('keypress', e => {
  if (e.key === 'Enter') document.getElementById('btn-login-submit').click();
});


// 页面切换
const navItems = document.querySelectorAll('.nav-item');
const pages = document.querySelectorAll('.page');
navItems.forEach(item => {
  item.addEventListener('click', () => {
    const page = item.dataset.page;
    if (!requireAuth(`请先登录后再使用${item.querySelector('span:last-child').textContent}`)) {
      return;
    }
    navItems.forEach(n => n.classList.remove('active'));
    item.classList.add('active');
    pages.forEach(p => p.classList.add('hidden'));
    document.getElementById(`page-${page}`).classList.remove('hidden');

    if (page === 'review') renderReviewPageState();
    if (page === 'mistakes') loadMistakes();
    if (page === 'report') loadReport();
  });
});

function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className = `toast ${type} show`;
  setTimeout(() => toast.classList.remove('show'), 2500);
}

// ================= 每日复习 =================
let reviewList = [];
let currentReviewIndex = 0;
let reviewLoaded = false;
let recommendQuestions = [];

function showReviewHome() {
  document.getElementById('review-home').classList.remove('hidden');
  document.getElementById('manual-select-page').classList.add('hidden');
  document.getElementById('review-empty').classList.add('hidden');
  document.getElementById('recommend-result').classList.add('hidden');
  document.getElementById('review-container').classList.add('hidden');
}

function showManualSelectPage() {
  document.getElementById('review-home').classList.add('hidden');
  document.getElementById('manual-select-page').classList.remove('hidden');
  document.getElementById('review-empty').classList.add('hidden');
  document.getElementById('recommend-result').classList.add('hidden');
  document.getElementById('review-container').classList.add('hidden');
  loadRecommendTags();
}

function showReviewContainer() {
  document.getElementById('review-home').classList.add('hidden');
  document.getElementById('manual-select-page').classList.add('hidden');
  document.getElementById('review-empty').classList.add('hidden');
  document.getElementById('recommend-result').classList.add('hidden');
  document.getElementById('review-container').classList.remove('hidden');
}

function renderReviewPageState() {
  document.getElementById('recommend-result').classList.add('hidden');

  if (!reviewLoaded || reviewList.length === 0 || currentReviewIndex >= reviewList.length) {
    if (reviewLoaded && reviewList.length > 0 && currentReviewIndex >= reviewList.length) {
      document.getElementById('review-home').classList.add('hidden');
      document.getElementById('manual-select-page').classList.add('hidden');
      document.getElementById('review-empty').classList.remove('hidden');
      document.getElementById('recommend-result').classList.add('hidden');
      document.getElementById('review-container').classList.add('hidden');
    } else {
      showReviewHome();
    }
    return;
  }

  showReviewContainer();
  renderReviewQuestion();
}

async function startManualPractice() {
  if (!requireAuth('请先登录后再开始练习')) return;
  const knowledge = document.getElementById('manual-knowledge').value;
  const reason = document.getElementById('manual-reason').value;
  if (!knowledge && !reason) {
    return showToast('手动选择时至少需要选择知识点或错因之一', 'error');
  }
  const difficulty = parseInt(document.getElementById('manual-difficulty').value) || 0;
  let count = parseInt(document.getElementById('manual-count').value) || 10;
  count = Math.max(1, Math.min(50, count));

  const params = new URLSearchParams({ mode: 'manual', count: count.toString() });
  if (knowledge) params.append('knowledge', knowledge);
  if (reason) params.append('reason', reason);
  if (difficulty) params.append('difficulty', difficulty.toString());

  const res = await api(`/student/recommend?${params.toString()}`);
  const data = await res.json();
  if (!data.success) return showToast(data.error || '推荐失败', 'error');

  reviewList = data.questions || [];
  currentReviewIndex = 0;
  reviewLoaded = true;

  if (reviewList.length === 0) {
    return showToast('没有符合条件的题目', 'error');
  }

  document.getElementById('progress-text').textContent = `已完成 0/${reviewList.length}`;
  document.getElementById('progress-fill').style.width = '0%';
  showReviewContainer();
  renderReviewQuestion();
}

async function startSmartRecommend() {
  if (!requireAuth('请先登录后再使用智能推荐')) return;
  try {
    const count = 5;
    console.log('[智能推荐] 开始请求 /api/student/recommend，mode=auto，count=' + count);
    const res = await api(`/student/recommend?mode=auto&count=${count}`);
    const data = await res.json();
    console.log('[智能推荐] 接口返回：', data);

    if (!data.success) return showToast(data.error || '智能推荐失败', 'error');

    if (data.debug) {
      console.log('[智能推荐] 推荐过程日志：');
      data.debug.forEach((step, idx) => {
        console.log(`[智能推荐] 第 ${idx + 1} 组概览：`, {
          seedId: step.seedId,
          seedTitle: step.seedTitle,
          need: step.need,
          graphragAvailable: step.graphragAvailable,
          graphragUsed: step.graphragUsed,
          vectorUsed: step.vectorUsed,
          similarIds: step.similarIds
        });
        console.log(`[智能推荐] 第 ${idx + 1} 组输入给向量数据库的文本（seedDoc）：\n`, step.seedDoc);
        if (step.vectorDebug) {
          console.log(`[智能推荐] 第 ${idx + 1} 组向量数据库调试信息：`, step.vectorDebug);
        }
      });
    }

    recommendQuestions = data.questions || [];
    renderRecommendResult(data, '智能推荐');
  } catch (e) {
    console.error('[智能推荐] 处理出错：', e);
    showToast('智能推荐处理失败：' + e.message, 'error');
  }
}

function startRecommendPractice() {
  if (recommendQuestions.length === 0) return;
  reviewList = recommendQuestions;
  currentReviewIndex = 0;
  reviewLoaded = true;
  document.getElementById('progress-text').textContent = `已完成 0/${reviewList.length}`;
  document.getElementById('progress-fill').style.width = '0%';
  showReviewContainer();
  renderReviewQuestion();
}

function renderReviewQuestion() {
  const q = reviewList[currentReviewIndex];
  if (!q) {
    renderReviewPageState();
    return;
  }

  document.getElementById('review-progress-text').textContent =
    `题目 ${currentReviewIndex + 1} / ${reviewList.length}`;

  const titleEl = document.getElementById('review-title');
  if (q.image) {
    titleEl.innerHTML = `<img src="${q.image}" alt="错题图片" class="review-image" style="max-width:100%;border-radius:8px;border:1px solid var(--rule);display:block;cursor:zoom-in">`;
    titleEl.querySelector('img').addEventListener('click', () => openImageModal(q.image));
  } else {
    titleEl.textContent = q.title;
  }

  document.getElementById('review-knowledge').textContent = q.knowledge;
  document.getElementById('review-reason').textContent = `错因：${q.reason}`;
  document.getElementById('review-difficulty').textContent = `难度：${'★'.repeat(q.difficulty)}`;

  document.getElementById('hint-box').classList.add('hidden');
  document.getElementById('feedback-box').classList.add('hidden');
  document.getElementById('similar-box').classList.add('hidden');

  const pct = Math.round((currentReviewIndex / reviewList.length) * 100);
  document.getElementById('progress-fill').style.width = `${pct}%`;
  document.getElementById('progress-text').textContent =
    `已完成 ${currentReviewIndex}/${reviewList.length}`;
}

document.getElementById('btn-hint').addEventListener('click', () => {
  const q = reviewList[currentReviewIndex];
  const hintBox = document.getElementById('hint-box');
  const hintText = document.getElementById('hint-text');

  if (q.answerImage) {
    hintText.innerHTML = `<img src="${q.answerImage}" alt="答案截图" style="max-width:100%;border-radius:8px;border:1px solid var(--rule);display:block">`;
  } else {
    const hints = {
      '二次函数': '先根据对称轴求出 b，再代入已知点求 c，最后用顶点式求顶点。',
      '勾股定理': '直角三角形中，a² + b² = c²，这里 AB 是斜边。',
      '一元二次方程': '尝试因式分解，找两个数乘积为 6、和为 -5。',
      '相似三角形': '利用平行线分线段成比例定理，AD/DB = AE/EC。',
      '一次函数': '将两个点坐标代入 y = kx + b，解二元一次方程组。',
      '反比例函数': '图像上任意一点横纵坐标乘积等于 k。',
      '圆的性质': '半径、弦心距、半弦长构成直角三角形，用勾股定理。'
    };
    hintText.textContent = hints[q.knowledge] || '仔细审题，回忆相关公式和定理。';
  }
  hintBox.classList.remove('hidden');
});

let currentModalImageSrc = '';

function openImageModal(src) {
  if (!src) return;
  console.log('[图片点击] 打开大图', src.substring(0, 80) + '...');
  currentModalImageSrc = src;
  const img = document.getElementById('image-modal-img');
  img.src = src;
  document.getElementById('image-modal').classList.remove('hidden');
}

function closeImageModal() {
  document.getElementById('image-modal').classList.add('hidden');
  currentModalImageSrc = '';
}

async function copyCurrentImage() {
  if (!currentModalImageSrc) return;
  try {
    const res = await fetch(currentModalImageSrc);
    const blob = await res.blob();
    await navigator.clipboard.write([
      new ClipboardItem({ [blob.type]: blob })
    ]);
    showToast('图片已复制到剪贴板');
  } catch (e) {
    console.error('复制图片失败', e);
    showToast('复制失败，请右键图片手动保存', 'error');
  }
}

document.getElementById('btn-image-modal-close').addEventListener('click', closeImageModal);
document.getElementById('image-modal').addEventListener('click', e => {
  if (e.target.id === 'image-modal') closeImageModal();
});
document.getElementById('btn-copy-image').addEventListener('click', copyCurrentImage);

// 使用事件委托，确保复习题目图片点击能打开大图
document.addEventListener('click', e => {
  const img = e.target.closest('.review-image');
  if (img && img.src) {
    openImageModal(img.src);
  }
});

async function submitReview(isCorrect) {
  const q = reviewList[currentReviewIndex];
  const res = await api(`/student/review/${q.id}/result`, {
    method: 'POST',
    body: JSON.stringify({ isCorrect })
  });
  const data = await res.json();

  const fb = document.getElementById('feedback-box');
  fb.classList.remove('hidden');

  if (isCorrect) {
    fb.innerHTML = `
      <div class="knowledge-card" style="background:#e8f2ef;border-color:var(--accent2)">
        <h4>✅ 太棒了！</h4>
        <p>你已掌握该题，系统将在 ${data.mistake.nextReviewAt} 再次安排复习。</p>
      </div>`;
    showToast('答题正确，掌握度提升！');
  } else {
    fb.innerHTML = `
      <div class="knowledge-card" style="background:#fdecea;border-color:var(--danger)">
        <h4>❌ 没关系，再来一次</h4>
        <p>系统已为你推送知识点卡片和相似题，完成补弱训练。</p>
      </div>`;

    const card = data.knowledgeCard;
    if (card) {
      fb.innerHTML += `
        <div class="knowledge-card">
          <h4>📖 ${q.knowledge} · 知识点卡片</h4>
          <p><strong>定义：</strong>${card.definition}</p>
          <p><strong>常见误区：</strong>${card.pitfalls}</p>
          <p><strong>典型例题：</strong>${card.example}</p>
        </div>`;
    }

    const simBox = document.getElementById('similar-box');
    const simList = document.getElementById('similar-list');
    simList.innerHTML = '';
    if (data.similarQuestions && data.similarQuestions.length > 0) {
      data.similarQuestions.forEach((sq, idx) => {
        simList.innerHTML += `
          <div class="similar-item">
            <div class="title">变式 ${idx + 1}（难度 ${'★'.repeat(sq.difficulty)}）</div>
            <div>${sq.title}</div>
            <div style="margin-top:0.5rem;color:var(--accent);font-size:0.85rem;cursor:pointer" onclick="this.nextElementSibling.classList.toggle('hidden')">查看答案</div>
            <div class="hidden" style="margin-top:0.4rem;color:var(--success);font-weight:600">答案：${sq.answer}</div>
          </div>`;
      });
      simBox.classList.remove('hidden');
    }
    showToast('已记录错题，请完成补弱训练', 'error');
  }

  currentReviewIndex += 1;
  setTimeout(() => {
    renderReviewQuestion();
  }, 1500);
}

document.getElementById('btn-correct').addEventListener('click', () => submitReview(true));
document.getElementById('btn-wrong').addEventListener('click', () => submitReview(false));

// ================= 推荐标签与结果展示 =================
async function loadRecommendTags() {
  if (!currentUser) return;
  try {
    const res = await api('/teacher/tags');
    if (!res.ok) return;
    const data = await res.json();
    const fill = (id, items, placeholder) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.innerHTML = `<option value="">${placeholder}</option>` +
        items.map(item => `<option value="${item}">${item}</option>`).join('');
    };
    fill('manual-knowledge', data.knowledge, '全部知识点');
    fill('manual-reason', data.reasons, '全部错因');
  } catch (e) {
    console.error('加载推荐标签失败', e);
  }
}

function renderRecommendResult(data, title) {
  const notice = document.getElementById('recommend-notice');
  if (data.mode === 'auto') {
    let noticeText = '';
    if (data.graphragUsed && data.vectorUsed) {
      noticeText = '当前使用 GraphRAG + ChromaDB 本地向量混合推荐。';
    } else if (data.graphragUsed) {
      noticeText = '当前使用 GraphRAG 推荐。';
    } else if (data.vectorUsed) {
      noticeText = '当前使用 ChromaDB 本地向量推荐。';
    } else {
      noticeText = '当前未配置 OpenAI API Key，使用本地规则推荐。';
    }
    notice.textContent = noticeText;
    notice.classList.remove('hidden');
  } else {
    notice.classList.add('hidden');
  }

  document.getElementById('recommend-title').textContent = title;
  document.getElementById('recommend-knowledge-card').innerHTML = '';

  const list = document.getElementById('recommend-list');
  if (data.questions.length === 0) {
    list.innerHTML = '<p style="text-align:center;color:var(--muted);padding:1rem 0">暂无符合条件的推荐题目</p>';
  } else {
    list.innerHTML = data.questions.map((sq, idx) => {
      let tag = '';
      if (data.mode === 'auto') {
        tag = sq.recommendType === 'seed'
          ? '<span class="tag tag-primary" style="margin-left:0.5rem">种子题</span>'
          : '<span class="tag" style="margin-left:0.5rem">相似题</span>';
      }
      return `
        <div class="similar-item" data-id="${sq.id}">
          <div class="title">推荐 ${idx + 1}${tag}（难度 ${'★'.repeat(sq.difficulty)} · ${sq.knowledge} · ${sq.reason}）</div>
          <div>${sq.title}</div>
          ${sq.image ? `<div style="margin:0.5rem 0"><img src="${sq.image}" style="max-width:100%;max-height:180px;border-radius:8px;border:1px solid var(--rule)"></div>` : ''}
          <div style="margin-top:0.5rem;color:var(--accent);font-size:0.85rem;cursor:pointer" onclick="this.nextElementSibling.classList.toggle('hidden')">查看答案</div>
          <div class="hidden" style="margin-top:0.4rem;color:var(--success);font-weight:600">答案：${sq.answer || '暂无'}</div>
        </div>
      `;
    }).join('');
  }

  document.getElementById('recommend-result').classList.remove('hidden');
  document.getElementById('recommend-result').scrollIntoView({ behavior: 'smooth' });
}

function safeAddListener(id, event, handler) {
  const el = document.getElementById(id);
  if (el) el.addEventListener(event, handler);
  else console.warn(`[student.js] element not found: ${id}`);
}

safeAddListener('btn-manual-select', 'click', showManualSelectPage);
safeAddListener('btn-smart-recommend', 'click', startSmartRecommend);
safeAddListener('btn-back-to-home', 'click', showReviewHome);
safeAddListener('btn-start-manual', 'click', startManualPractice);
safeAddListener('btn-empty-to-home', 'click', showReviewHome);
safeAddListener('btn-close-recommend', 'click', () => {
  document.getElementById('recommend-result').classList.add('hidden');
});
safeAddListener('btn-start-recommend-practice', 'click', startRecommendPractice);

// ================= 拍照录入 =================
const uploadZone = document.getElementById('upload-zone');
const fileInput = document.getElementById('file-input');
uploadZone.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', () => {
  const file = fileInput.files[0];
  if (file) handleFile(file);
});
uploadZone.addEventListener('dragover', e => { e.preventDefault(); uploadZone.style.borderColor = 'var(--accent)'; });
uploadZone.addEventListener('dragleave', () => { uploadZone.style.borderColor = 'var(--rule)'; });
uploadZone.addEventListener('drop', e => {
  e.preventDefault();
  uploadZone.style.borderColor = 'var(--rule)';
  const file = e.dataTransfer.files[0];
  if (file) handleFile(file);
});

let cleanedImageData = null; // 保存去手写后的 ImageData，用于重处理
let cleanedCanvasSize = { w: 0, h: 0 };
let answerImageData = null; // 答案截图 base64

function handleFile(file) {
  if (!requireAuth('请先登录后再上传错题')) return;
  const reader = new FileReader();
  reader.onload = e => {
    const dataUrl = e.target.result;

    // 显示原图
    const imgOriginal = document.getElementById('img-original');
    imgOriginal.src = dataUrl;
    imgOriginal.style.display = 'block';

    document.getElementById('preview-box').classList.remove('hidden');
    document.getElementById('upload-zone').style.display = 'none';
    document.getElementById('erase-toolbar').classList.add('hidden');

    // 显示处理中状态
    const spinner = document.getElementById('cleaning-spinner');
    const canvasCleaned = document.getElementById('canvas-cleaned');
    const status = document.getElementById('cleaning-status');
    spinner.classList.remove('hidden');
    canvasCleaned.style.display = 'none';
    status.classList.add('hidden');
    document.getElementById('ocr-box').classList.add('hidden');
    document.getElementById('ocr-text').value = '';
    document.getElementById('ocr-trigger-box').classList.add('hidden');

    // 模拟 AI 去手写处理（约 1.2 秒）
    setTimeout(() => {
      simulateCleanHandwriting(dataUrl, (cleanedCanvas, imageData) => {
        cleanedImageData = imageData;
        cleanedCanvasSize = { w: cleanedCanvas.width, h: cleanedCanvas.height };

        // 将处理结果绘制到可见 canvas
        const displayCanvas = document.getElementById('canvas-cleaned');
        displayCanvas.width = cleanedCanvas.width;
        displayCanvas.height = cleanedCanvas.height;
        const ctx = displayCanvas.getContext('2d', { willReadFrequently: true });
        ctx.drawImage(cleanedCanvas, 0, 0);

        spinner.classList.add('hidden');
        displayCanvas.style.display = 'block';
        status.classList.remove('hidden');
        document.getElementById('erase-toolbar').classList.remove('hidden');
        document.getElementById('classification-form').classList.remove('hidden');
        document.getElementById('answer-image-box').classList.remove('hidden');
        initAnswerImageUpload();
        resetAnswerImage();

        // 小图仅作预览，点击后进入模态框进行精细擦除
        displayCanvas.title = '点击放大编辑';

        loadClassificationTags();
        setDifficulty(3);
        showToast('去手写完成，确认效果后可识别文字');

        // 显示手动 OCR 触发按钮，等待用户确认后再识别
        document.getElementById('ocr-trigger-box').classList.remove('hidden');
      });
    }, 1200);
  };
  reader.readAsDataURL(file);
}

// 答案截图上传初始化（只绑定一次）
let answerUploadInited = false;
function initAnswerImageUpload() {
  if (answerUploadInited) return;
  answerUploadInited = true;

  const zone = document.getElementById('answer-upload-zone');
  const input = document.getElementById('answer-file-input');

  zone.addEventListener('click', () => input.click());
  input.addEventListener('change', () => {
    const file = input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
      answerImageData = e.target.result;
      showAnswerImagePreview();
    };
    reader.readAsDataURL(file);
  });

  document.getElementById('btn-remove-answer').addEventListener('click', () => {
    resetAnswerImage();
  });
}

function showAnswerImagePreview() {
  const img = document.getElementById('img-answer');
  img.src = answerImageData;
  document.getElementById('answer-preview').classList.remove('hidden');
  document.getElementById('answer-upload-zone').style.display = 'none';
}

function resetAnswerImage() {
  answerImageData = null;
  document.getElementById('answer-file-input').value = '';
  document.getElementById('img-answer').src = '';
  document.getElementById('answer-preview').classList.add('hidden');
  document.getElementById('answer-upload-zone').style.display = 'block';
}

// OCR 识别
async function runOCR(canvas) {
  const ocrBox = document.getElementById('ocr-box');
  const ocrSpinner = document.getElementById('ocr-spinner');
  const ocrText = document.getElementById('ocr-text');

  ocrBox.classList.remove('hidden');
  ocrSpinner.textContent = '识别中...';
  ocrText.value = '';

  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = canvas.width;
  tempCanvas.height = canvas.height;
  const ctx = tempCanvas.getContext('2d', { willReadFrequently: true });
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
  ctx.drawImage(canvas, 0, 0);
  const image = tempCanvas.toDataURL('image/jpeg', 0.85);

  try {
    const res = await api('/ocr', {
      method: 'POST',
      body: JSON.stringify({ image })
    });
    const data = await res.json();
    ocrText.value = data.text || '';
    ocrSpinner.textContent = data.error ? '识别失败' : '识别完成';
    if (data.error) {
      showToast(data.error, 'error');
    }
  } catch (e) {
    console.error('OCR 请求失败', e);
    ocrSpinner.textContent = '识别失败';
    showToast('OCR 识别请求失败', 'error');
  }
}

// 手动触发 OCR 识别
document.getElementById('btn-run-ocr').addEventListener('click', () => {
  const displayCanvas = document.getElementById('canvas-cleaned');
  if (displayCanvas.style.display === 'none' || displayCanvas.width === 0) {
    showToast('请先上传并处理图片', 'error');
    return;
  }
  document.getElementById('ocr-trigger-box').classList.add('hidden');
  runOCR(displayCanvas);
});

// 使用 Canvas 模拟手写痕迹抹除
function simulateCleanHandwriting(dataUrl, callback) {
  const img = new Image();
  img.onload = () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    // 限制处理尺寸，提升速度
    const maxSize = 1200;
    let w = img.width, h = img.height;
    if (w > maxSize || h > maxSize) {
      const scale = Math.min(maxSize / w, maxSize / h);
      w = Math.round(w * scale);
      h = Math.round(h * scale);
    }
    canvas.width = w;
    canvas.height = h;
    ctx.drawImage(img, 0, 0, w, h);

    const mode = document.querySelector('input[name="clean-mode"]:checked').value;
    const imageData = ctx.getImageData(0, 0, w, h);

    if (mode === 'strong') {
      applyStrongCleaning(imageData);
    } else {
      applyNormalCleaning(imageData);
    }

    ctx.putImageData(imageData, 0, 0);
    callback(canvas, imageData);
  };
  img.src = dataUrl;
}

// 标准模式：提亮 + 对比度，淡化手写痕迹
function applyNormalCleaning(imageData) {
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    let gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    gray = gray * 1.25 + 35;
    gray = ((gray - 128) * 1.4) + 128;
    if (gray > 210) gray = 255;
    else if (gray > 180) gray = 230;
    gray = Math.max(0, Math.min(255, gray));
    data[i] = gray;
    data[i + 1] = gray;
    data[i + 2] = gray;
  }
}

// 强力模式：仅保留印刷体
// 策略：先提亮淡化手写，再用较高阈值二值化保留深色印刷文字，最后膨胀恢复笔画
function applyStrongCleaning(imageData) {
  const w = imageData.width, h = imageData.height;
  const data = imageData.data;
  const gray = new Uint8Array(w * h);

  // 1. 灰度化并提亮，让手写痕迹比印刷文字更淡
  for (let i = 0; i < w * h; i++) {
    let g = 0.299 * data[i * 4] + 0.587 * data[i * 4 + 1] + 0.114 * data[i * 4 + 2];
    g = g * 1.15 + 25;
    gray[i] = Math.min(255, g);
  }

  // 2. 二值化：仅保留最黑的像素（印刷文字）
  const binary = new Uint8Array(w * h);
  const threshold = 185;
  for (let i = 0; i < w * h; i++) {
    binary[i] = gray[i] < threshold ? 1 : 0;
  }

  // 3. 膨胀恢复印刷文字笔画
  const dilated = dilate(binary, w, h, 2);

  // 4. 轻微腐蚀去除细小噪声
  const opened = erode(dilated, w, h, 1);

  // 5. 输出
  for (let i = 0; i < w * h; i++) {
    const val = opened[i] ? 25 : 255;
    data[i * 4] = val;
    data[i * 4 + 1] = val;
    data[i * 4 + 2] = val;
  }
}

function erode(src, w, h, iterations) {
  let dst = new Uint8Array(src);
  for (let iter = 0; iter < iterations; iter++) {
    const temp = new Uint8Array(dst);
    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        let min = 1;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (temp[(y + dy) * w + (x + dx)] === 0) { min = 0; break; }
          }
          if (min === 0) break;
        }
        dst[y * w + x] = min;
      }
    }
  }
  return dst;
}

function dilate(src, w, h, iterations) {
  let dst = new Uint8Array(src);
  for (let iter = 0; iter < iterations; iter++) {
    const temp = new Uint8Array(dst);
    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        let max = 0;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (temp[(y + dy) * w + (x + dx)] === 1) { max = 1; break; }
          }
          if (max === 1) break;
        }
        dst[y * w + x] = max;
      }
    }
  }
  return dst;
}

// ================= 放大编辑模态框 =================
const modal = document.getElementById('image-modal');
const canvasModal = document.getElementById('canvas-modal');
const canvasCleaned = document.getElementById('canvas-cleaned');
const modalWrapper = document.getElementById('modal-canvas-wrapper');
const eraseCursor = document.getElementById('erase-cursor');
const ctxModal = canvasModal.getContext('2d', { willReadFrequently: true });

let modalScale = 1;
let modalHistory = [];
let modalOriginalImageData = null;
let isModalDrawing = false;

// 打开模态框
canvasCleaned.addEventListener('click', () => {
  if (canvasCleaned.style.display === 'none') return;
  openImageModal();
});

function openImageModal() {
  canvasModal.width = canvasCleaned.width;
  canvasModal.height = canvasCleaned.height;
  ctxModal.clearRect(0, 0, canvasModal.width, canvasModal.height);
  ctxModal.drawImage(canvasCleaned, 0, 0);

  modalOriginalImageData = ctxModal.getImageData(0, 0, canvasModal.width, canvasModal.height);
  modalHistory = [];
  modalScale = 1;
  updateModalZoom();

  modal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closeImageModal() {
  modal.classList.add('hidden');
  document.body.style.overflow = '';
  eraseCursor.style.display = 'none';
}

function applyModalToCleaned() {
  canvasCleaned.width = canvasModal.width;
  canvasCleaned.height = canvasModal.height;
  const ctx = canvasCleaned.getContext('2d', { willReadFrequently: true });
  ctx.clearRect(0, 0, canvasCleaned.width, canvasCleaned.height);
  ctx.drawImage(canvasModal, 0, 0);
}

// 缩放控制
function updateModalZoom() {
  modalScale = Math.max(0.3, Math.min(5, modalScale));
  canvasModal.style.transform = `scale(${modalScale})`;
  document.getElementById('zoom-level').textContent = Math.round(modalScale * 100) + '%';
  updateEraseCursorSize();
}

function setModalZoom(scale) {
  modalScale = scale;
  updateModalZoom();
}

function fitModalZoom() {
  const wrapperRect = modalWrapper.getBoundingClientRect();
  const padding = 48;
  const availableW = wrapperRect.width - padding;
  const availableH = wrapperRect.height - padding;
  modalScale = Math.min(1, availableW / canvasModal.width, availableH / canvasModal.height);
  updateModalZoom();
}

document.getElementById('btn-zoom-in').addEventListener('click', () => setModalZoom(modalScale * 1.2));
document.getElementById('btn-zoom-out').addEventListener('click', () => setModalZoom(modalScale / 1.2));
document.getElementById('btn-zoom-fit').addEventListener('click', fitModalZoom);

modalWrapper.addEventListener('wheel', e => {
  e.preventDefault();
  const delta = e.deltaY > 0 ? 0.9 : 1.1;
  setModalZoom(modalScale * delta);
}, { passive: false });

// 将鼠标在 wrapper 中的坐标转换为 canvas 内部坐标
function getCanvasPosFromEvent(e) {
  const clientX = e.touches ? e.touches[0].clientX : e.clientX;
  const clientY = e.touches ? e.touches[0].clientY : e.clientY;
  const canvasRect = canvasModal.getBoundingClientRect();
  return {
    x: (clientX - canvasRect.left) / modalScale,
    y: (clientY - canvasRect.top) / modalScale
  };
}

// 更新圈圈光标位置和大小
function updateEraseCursor(e) {
  if (e) {
    const wrapperRect = modalWrapper.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    eraseCursor.style.left = (clientX - wrapperRect.left) + 'px';
    eraseCursor.style.top = (clientY - wrapperRect.top) + 'px';
  }
  updateEraseCursorSize();
}

function updateEraseCursorSize() {
  const size = parseInt(document.getElementById('modal-erase-size').value);
  eraseCursor.style.width = (size * modalScale) + 'px';
  eraseCursor.style.height = (size * modalScale) + 'px';
}

modalWrapper.addEventListener('mouseenter', () => eraseCursor.style.display = 'block');
modalWrapper.addEventListener('mouseleave', () => eraseCursor.style.display = 'none');
modalWrapper.addEventListener('mousemove', updateEraseCursor);
modalWrapper.addEventListener('touchmove', updateEraseCursor, { passive: false });

// 历史记录：每次开始绘制前保存状态
function pushModalHistory() {
  modalHistory.push(ctxModal.getImageData(0, 0, canvasModal.width, canvasModal.height));
  if (modalHistory.length > 20) modalHistory.shift();
}

function undoModal() {
  if (modalHistory.length === 0) return;
  const prev = modalHistory.pop();
  ctxModal.putImageData(prev, 0, 0);
  showToast('已撤回上一步');
}

function resetModal() {
  if (!cleanedImageData) return;
  pushModalHistory();
  canvasModal.width = cleanedImageData.width;
  canvasModal.height = cleanedImageData.height;
  ctxModal.putImageData(cleanedImageData, 0, 0);
  modalOriginalImageData = cleanedImageData;
  showToast('已恢复自动处理结果');
}

// 绘制/擦除
function modalDrawStart(e) {
  if (e.target !== canvasModal && e.target !== eraseCursor) return;
  e.preventDefault();
  isModalDrawing = true;
  pushModalHistory();
  modalDraw(e);
}

function modalDrawEnd() {
  isModalDrawing = false;
}

function modalDraw(e) {
  if (!isModalDrawing) return;
  e.preventDefault();
  const pos = getCanvasPosFromEvent(e);
  const size = parseInt(document.getElementById('modal-erase-size').value);
  ctxModal.globalCompositeOperation = 'destination-out';
  ctxModal.beginPath();
  ctxModal.arc(pos.x, pos.y, size / 2, 0, Math.PI * 2);
  ctxModal.fill();
  ctxModal.globalCompositeOperation = 'source-over';
}

modalWrapper.addEventListener('mousedown', modalDrawStart);
modalWrapper.addEventListener('mousemove', modalDraw);
modalWrapper.addEventListener('mouseup', modalDrawEnd);
modalWrapper.addEventListener('mouseleave', modalDrawEnd);
modalWrapper.addEventListener('touchstart', modalDrawStart, { passive: false });
modalWrapper.addEventListener('touchmove', modalDraw, { passive: false });
modalWrapper.addEventListener('touchend', modalDrawEnd);

// 模态框事件绑定
document.getElementById('btn-modal-close').addEventListener('click', closeImageModal);
modal.addEventListener('click', e => {
  if (e.target === modal) closeImageModal();
});

document.getElementById('btn-modal-confirm').addEventListener('click', () => {
  applyModalToCleaned();
  closeImageModal();
  document.getElementById('ocr-box').classList.add('hidden');
  document.getElementById('ocr-text').value = '';
  document.getElementById('ocr-trigger-box').classList.remove('hidden');
  showToast('已确认编辑结果，可重新识别文字');
});

document.getElementById('btn-modal-reset').addEventListener('click', resetModal);
document.getElementById('btn-modal-undo').addEventListener('click', undoModal);

// 模态框画笔大小
document.getElementById('modal-erase-size').addEventListener('input', e => {
  document.getElementById('modal-erase-size-val').textContent = e.target.value + 'px';
  updateEraseCursorSize();
});

// 分类标签加载与难度选择
async function loadClassificationTags() {
  try {
    const res = await api('/teacher/tags');
    const data = await res.json();

    const kSelect = document.getElementById('select-knowledge');
    const rSelect = document.getElementById('select-reason');

    kSelect.innerHTML = '<option value="">请选择知识点</option>' +
      data.knowledge.map(k => `<option value="${k}">${k}</option>`).join('');
    rSelect.innerHTML = '<option value="">请选择错因</option>' +
      data.reasons.map(r => `<option value="${r}">${r}</option>`).join('');
  } catch (e) {
    console.error('加载分类标签失败', e);
  }
}

function setDifficulty(value) {
  value = Math.max(1, Math.min(5, value));
  document.getElementById('input-difficulty').value = value;
  document.querySelectorAll('#difficulty-stars span').forEach(span => {
    span.classList.toggle('active', parseInt(span.dataset.value) <= value);
  });
}

document.querySelectorAll('#difficulty-stars span').forEach(span => {
  span.addEventListener('click', () => setDifficulty(parseInt(span.dataset.value)));
  span.addEventListener('mouseenter', () => {
    const hoverValue = parseInt(span.dataset.value);
    document.querySelectorAll('#difficulty-stars span').forEach(s => {
      s.classList.toggle('active', parseInt(s.dataset.value) <= hoverValue);
    });
  });
});

document.getElementById('difficulty-stars').addEventListener('mouseleave', () => {
  setDifficulty(parseInt(document.getElementById('input-difficulty').value));
});

// 模式切换：重新处理已上传图片
document.querySelectorAll('input[name="clean-mode"]').forEach(radio => {
  radio.addEventListener('change', () => {
    const dataUrl = document.getElementById('img-original').src;
    if (!dataUrl || !document.getElementById('preview-box').classList.contains('hidden')) {
      const spinner = document.getElementById('cleaning-spinner');
      const canvasCleaned = document.getElementById('canvas-cleaned');
      spinner.classList.remove('hidden');
      canvasCleaned.style.display = 'none';
      document.getElementById('ocr-box').classList.add('hidden');
      document.getElementById('ocr-text').value = '';
      document.getElementById('ocr-trigger-box').classList.add('hidden');
      setTimeout(() => {
        simulateCleanHandwriting(dataUrl, (cleanedCanvas, imageData) => {
          cleanedImageData = imageData;
          cleanedCanvasSize = { w: cleanedCanvas.width, h: cleanedCanvas.height };
          canvasCleaned.width = cleanedCanvas.width;
          canvasCleaned.height = cleanedCanvas.height;
          const ctx = canvasCleaned.getContext('2d', { willReadFrequently: true });
          ctx.drawImage(cleanedCanvas, 0, 0);
          spinner.classList.add('hidden');
          canvasCleaned.style.display = 'block';
          showToast(`已切换为${radio.parentElement.textContent.trim()}模式，确认效果后可识别文字`);
          document.getElementById('ocr-trigger-box').classList.remove('hidden');
        });
      }, 400);
    }
  });
});

// 小图画笔大小显示，并同步到模态框画笔
document.getElementById('erase-size').addEventListener('input', e => {
  document.getElementById('erase-size-val').textContent = e.target.value + 'px';
  const modalInput = document.getElementById('modal-erase-size');
  modalInput.value = e.target.value;
  modalInput.dispatchEvent(new Event('input'));
});

// 重新上传
document.getElementById('btn-reupload').addEventListener('click', () => {
  document.getElementById('preview-box').classList.add('hidden');
  document.getElementById('upload-zone').style.display = 'block';
  document.getElementById('erase-toolbar').classList.add('hidden');
  document.getElementById('classification-form').classList.add('hidden');
  document.getElementById('answer-image-box').classList.add('hidden');
  document.getElementById('ocr-box').classList.add('hidden');
  document.getElementById('ocr-text').value = '';
  document.getElementById('select-knowledge').value = '';
  document.getElementById('select-reason').value = '';
  document.getElementById('img-original').src = '';
  const canvasCleaned = document.getElementById('canvas-cleaned');
  const ctx = canvasCleaned.getContext('2d', { willReadFrequently: true });
  ctx.clearRect(0, 0, canvasCleaned.width, canvasCleaned.height);
  canvasCleaned.style.display = 'none';
  fileInput.value = '';
  cleanedImageData = null;
  resetAnswerImage();
  closeImageModal();
});

// 获取最终处理后的图片（JPEG base64，限制尺寸）
function getFinalImageBase64() {
  const source = document.getElementById('canvas-cleaned');
  if (source.style.display === 'none' || source.width === 0) return '';

  const maxWidth = 800;
  let w = source.width, h = source.height;
  if (w > maxWidth) {
    const scale = maxWidth / w;
    w = maxWidth;
    h = Math.round(source.height * scale);
  }

  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = w;
  tempCanvas.height = h;
  const ctx = tempCanvas.getContext('2d', { willReadFrequently: true });
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(source, 0, 0, w, h);
  return tempCanvas.toDataURL('image/jpeg', 0.85);
}

document.getElementById('btn-save-mistake').addEventListener('click', async () => {
  if (!requireAuth('请先登录后再保存错题')) return;
  const image = getFinalImageBase64();
  if (!image) return showToast('请先上传题目图片', 'error');

  const knowledge = document.getElementById('select-knowledge').value;
  const reason = document.getElementById('select-reason').value;
  const difficulty = parseInt(document.getElementById('input-difficulty').value) || 3;

  if (!knowledge) return showToast('请选择知识点', 'error');
  if (!reason) return showToast('请选择错因', 'error');

  const ocrText = document.getElementById('ocr-text').value.trim();
  const res = await api('/student/mistakes', {
    method: 'POST',
    body: JSON.stringify({ image, knowledge, reason, difficulty, ocrText, answerImage: answerImageData || '' })
  });
  const data = await res.json();
  if (data.success) {
    showToast('错题已保存到错题本');
    document.getElementById('preview-box').classList.add('hidden');
    document.getElementById('upload-zone').style.display = 'block';
    document.getElementById('erase-toolbar').classList.add('hidden');
    document.getElementById('classification-form').classList.add('hidden');
    document.getElementById('answer-image-box').classList.add('hidden');
    document.getElementById('ocr-box').classList.add('hidden');
    document.getElementById('ocr-text').value = '';
    document.getElementById('select-knowledge').value = '';
    document.getElementById('select-reason').value = '';
    document.getElementById('img-original').src = '';
    const canvasCleaned = document.getElementById('canvas-cleaned');
    const ctx = canvasCleaned.getContext('2d', { willReadFrequently: true });
    ctx.clearRect(0, 0, canvasCleaned.width, canvasCleaned.height);
    canvasCleaned.style.display = 'none';
    fileInput.value = '';
    cleanedImageData = null;
    resetAnswerImage();
  }
});

// ================= 错题本 =================
let allMistakes = [];
let selectedMistakeIds = new Set();

async function loadMistakes() {
  const res = await api('/student/mistakes');
  const data = await res.json();
  allMistakes = data.list;
  selectedMistakeIds.clear();
  updateSelectAllCheckbox();

  const knowledgeSet = new Set(allMistakes.map(m => m.knowledge));
  const reasonSet = new Set(allMistakes.map(m => m.reason));

  const kSelect = document.getElementById('filter-knowledge');
  const rSelect = document.getElementById('filter-reason');

  // 保留"全部"选项，重新填充
  kSelect.innerHTML = '<option value="">全部知识点</option>';
  rSelect.innerHTML = '<option value="">全部错因</option>';
  knowledgeSet.forEach(k => kSelect.innerHTML += `<option value="${k}">${k}</option>`);
  reasonSet.forEach(r => rSelect.innerHTML += `<option value="${r}">${r}</option>`);

  renderMistakes(allMistakes);

  function filter() {
    const kk = kSelect.value;
    const rr = rSelect.value;
    renderMistakes(allMistakes.filter(m => (!kk || m.knowledge === kk) && (!rr || m.reason === rr)));
  }
  kSelect.onchange = filter;
  rSelect.onchange = filter;
  document.getElementById('btn-reset-filter').onclick = () => {
    kSelect.value = '';
    rSelect.value = '';
    renderMistakes(allMistakes);
  };
}

function renderMistakes(list) {
  const container = document.getElementById('mistakes-list');
  if (list.length === 0) {
    container.innerHTML = '<p style="text-align:center;color:var(--muted);padding:2rem 0">暂无错题</p>';
    return;
  }
  container.innerHTML = list.map(m => `
    <div class="mistake-item" data-id="${m.id}">
      <div class="mistake-header" style="align-items:center">
        <label style="display:flex;align-items:center;gap:0.5rem;cursor:pointer;margin-right:0.5rem">
          <input type="checkbox" class="mistake-checkbox" data-id="${m.id}" ${selectedMistakeIds.has(m.id) ? 'checked' : ''}>
        </label>
        <div class="mistake-title" style="flex:1">${m.title}</div>
        <button class="btn btn-danger btn-sm btn-delete-single" data-id="${m.id}">删除</button>
      </div>
      ${m.image ? `<div style="margin:0.6rem 0"><img src="${m.image}" style="max-width:100%;max-height:200px;border-radius:8px;border:1px solid var(--rule);cursor:pointer" onclick="window.open('${m.image}', '_blank')" title="点击查看大图"></div>` : ''}
      <div class="mistake-meta">
        <span class="tag tag-primary">${m.knowledge}</span>
        <span class="tag tag-danger">${m.reason}</span>
        <span class="tag">难度 ${'★'.repeat(m.difficulty)}</span>
        <span class="tag tag-success">掌握度 ${m.mastery}%</span>
        <span class="tag">下次复习：${m.nextReviewAt}</span>
      </div>
    </div>
  `).join('');

  container.querySelectorAll('.mistake-checkbox').forEach(cb => {
    cb.addEventListener('change', () => {
      const id = parseInt(cb.dataset.id);
      if (cb.checked) selectedMistakeIds.add(id);
      else selectedMistakeIds.delete(id);
      updateSelectAllCheckbox();
    });
  });

  container.querySelectorAll('.btn-delete-single').forEach(btn => {
    btn.addEventListener('click', () => deleteMistake(parseInt(btn.dataset.id)));
  });
}

function updateSelectAllCheckbox() {
  const checkAll = document.getElementById('check-all');
  const visibleIds = Array.from(document.querySelectorAll('.mistake-checkbox')).map(cb => parseInt(cb.dataset.id));
  if (visibleIds.length === 0) {
    checkAll.checked = false;
    checkAll.indeterminate = false;
    return;
  }
  const allSelected = visibleIds.every(id => selectedMistakeIds.has(id));
  const someSelected = visibleIds.some(id => selectedMistakeIds.has(id));
  checkAll.checked = allSelected;
  checkAll.indeterminate = someSelected && !allSelected;
}

async function deleteMistake(id) {
  if (!requireAuth('请先登录后再删除错题')) return;
  if (!confirm('确定删除这道错题吗？')) return;
  await doDeleteMistakes([id]);
}

async function deleteSelectedMistakes() {
  if (!requireAuth('请先登录后再删除错题')) return;
  if (selectedMistakeIds.size === 0) return showToast('请先选择要删除的错题', 'error');
  if (!confirm(`确定删除选中的 ${selectedMistakeIds.size} 道错题吗？`)) return;
  await doDeleteMistakes(Array.from(selectedMistakeIds));
}

async function doDeleteMistakes(ids) {
  let successCount = 0;
  for (const id of ids) {
    const res = await api(`/student/mistakes/${id}`, { method: 'DELETE' });
    if (res.ok) successCount++;
  }
  if (successCount > 0) {
    showToast(`已删除 ${successCount} 道错题`);
    selectedMistakeIds = new Set(Array.from(selectedMistakeIds).filter(id => !ids.includes(id)));
    loadMistakes();
  }
}

document.getElementById('check-all').addEventListener('change', e => {
  const visibleIds = Array.from(document.querySelectorAll('.mistake-checkbox')).map(cb => parseInt(cb.dataset.id));
  visibleIds.forEach(id => {
    if (e.target.checked) selectedMistakeIds.add(id);
    else selectedMistakeIds.delete(id);
  });
  renderMistakes(getFilteredMistakes());
});

document.getElementById('btn-batch-delete').addEventListener('click', deleteSelectedMistakes);

function getFilteredMistakes() {
  const kk = document.getElementById('filter-knowledge').value;
  const rr = document.getElementById('filter-reason').value;
  return allMistakes.filter(m => (!kk || m.knowledge === kk) && (!rr || m.reason === rr));
}

// ================= 学习报告 =================
let radarChart = null;

async function loadReport() {
  const res = await api('/student/report');
  const data = await res.json();

  document.getElementById('report-total').textContent = data.totalMistakes;
  document.getElementById('report-today').textContent = data.reviewedToday;
  document.getElementById('report-mastery').textContent = data.averageMastery + '%';

  const weak = data.radar.filter(r => r.value < 60).sort((a, b) => a.value - b.value).slice(0, 5);
  document.getElementById('weak-list').innerHTML = weak.map((w, idx) => `
    <div class="mistake-item" style="display:flex;justify-content:space-between;align-items:center">
      <div>
        <strong>${idx + 1}. ${w.name}</strong>
        <div style="font-size:0.85rem;color:var(--muted)">建议加强复习</div>
      </div>
      <div style="font-size:1.3rem;font-weight:700;color:${w.value < 40 ? 'var(--danger)' : 'var(--accent)'}">${w.value}%</div>
    </div>
  `).join('');

  renderRadar(data.radar);
}

function renderRadar(radarData) {
  const chartDom = document.getElementById('radar-chart');
  if (radarChart) radarChart.dispose();
  radarChart = echarts.init(chartDom);

  const option = {
    tooltip: {},
    radar: {
      indicator: radarData.map(r => ({ name: r.name, max: 100 })),
      radius: '65%',
      splitNumber: 4,
      axisName: { color: 'var(--muted)' }
    },
    series: [{
      type: 'radar',
      data: [{
        value: radarData.map(r => r.value),
        name: '掌握度',
        areaStyle: { color: 'rgba(232, 106, 51, 0.2)' },
        lineStyle: { color: 'var(--accent)', width: 2 },
        itemStyle: { color: 'var(--accent)' }
      }]
    }]
  };
  radarChart.setOption(option);
}

window.addEventListener('resize', () => {
  if (radarChart) radarChart.resize();
});

// 初始显示每日复习开始页，并加载推荐标签
checkAuth().then(() => {
  renderReviewPageState();
});
