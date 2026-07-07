/**
 * 食光机 - 时光轴页逻辑
 * 记录的增删改查、搜索筛选、AI识别、图片上传
 */

// ===== 状态管理 =====
let allRecords = [];
let currentFilter = { keyword: '', tag: '', mealType: '' };
let editingRecordId = null;
let currentImageFile = null;    // 当前选择的图片文件
let currentImagePath = null;    // 当前图片的服务器路径（AI识别后获得）
let currentEmoji = '🍽️';        // 当前emoji
let allTags = [];

// ===== 初始化 =====
(async function () {
  // 检查登录
  const user = await checkAuth();
  if (!user) return;

  // 渲染导航栏
  await renderNav('timeline');

  // 绑定事件
  bindEvents();

  // 加载标签
  await loadTags();

  // 加载记录
  await loadRecords();

  // 检查URL参数：是否需要自动打开添加模态框
  const action = getQueryParam('action');
  if (action === 'add') {
    openAddModal();

    // 检查是否有来自推荐页的待添加数据
    const pendingRecommend = sessionStorage.getItem('pendingRecommend');
    if (pendingRecommend) {
      try {
        const rec = JSON.parse(pendingRecommend);
        fillFormWithRecommendation(rec);
        showToast('已填入「' + rec.name + '」的信息，完善后即可保存', 'info');
      } catch (e) { /* ignore */ }
      sessionStorage.removeItem('pendingRecommend');
    }
  }
})();

/**
 * 绑定所有事件
 */
function bindEvents() {
  // 添加记录按钮
  document.getElementById('addRecordBtn').addEventListener('click', openAddModal);

  // 模态框关闭
  document.querySelectorAll('.modal-close').forEach(function (el) {
    el.addEventListener('click', closeAllModals);
  });

  // 图片上传
  document.getElementById('imageInput').addEventListener('change', handleImageSelect);
  document.getElementById('uploadArea').addEventListener('click', function () {
    document.getElementById('imageInput').click();
  });
  document.getElementById('uploadArea').addEventListener('dragover', function (e) {
    e.preventDefault();
    e.currentTarget.classList.add('drag-over');
  });
  document.getElementById('uploadArea').addEventListener('dragleave', function (e) {
    e.currentTarget.classList.remove('drag-over');
  });
  document.getElementById('uploadArea').addEventListener('drop', function (e) {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over');
    if (e.dataTransfer.files.length > 0) {
      handleImageFile(e.dataTransfer.files[0]);
    }
  });

  // AI识别
  document.getElementById('recognizeBtn').addEventListener('click', startRecognition);

  // 保存记录
  document.getElementById('saveRecordBtn').addEventListener('click', saveRecord);

  // 搜索
  document.getElementById('searchInput').addEventListener('input', debounce(function (e) {
    currentFilter.keyword = e.target.value.trim();
    renderTimeline();
  }, 300));

  // 餐次筛选
  document.getElementById('mealTypeFilter').addEventListener('change', function (e) {
    currentFilter.mealType = e.target.value;
    renderTimeline();
  });

  // 标签筛选（事件委托）
  document.getElementById('tagFilterBar').addEventListener('click', function (e) {
    if (e.target.classList.contains('tag-filter-btn')) {
      document.querySelectorAll('.tag-filter-btn').forEach(function (btn) {
        btn.classList.remove('active');
      });
      e.target.classList.add('active');
      currentFilter.tag = e.target.dataset.tag;
      renderTimeline();
    }
  });

  // 标签输入
  document.getElementById('tagInput').addEventListener('keydown', function (e) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTagFromInput();
    }
  });
  document.getElementById('addTagBtn').addEventListener('click', addTagFromInput);

  // 评分
  document.querySelectorAll('#starRating .star').forEach(function (star) {
    star.addEventListener('click', function () {
      const value = parseInt(star.dataset.value);
      document.getElementById('ratingInput').value = value;
      updateStarDisplay(value);
    });
  });
}

// ===== 数据加载 =====

/**
 * 加载所有标签
 */
async function loadTags() {
  try {
    const res = await API.getTags();
    if (res.success && res.data) {
      allTags = res.data;
    }
  } catch (err) {
    console.error('获取标签失败:', err);
  }
  renderTagFilter();
}

/**
 * 加载记录
 */
async function loadRecords() {
  const container = document.getElementById('timelineContainer');
  container.innerHTML = createLoadingState('正在加载美食记录...');

  try {
    const res = await API.getRecords();
    if (res.success && res.data) {
      allRecords = res.data;
      renderTimeline();
    }
  } catch (err) {
    container.innerHTML = '<div class="empty-state"><div class="empty-icon">⚠️</div><h3>加载失败</h3><p>' + escapeHtml(err.message) + '</p></div>';
  }
}

// ===== 渲染 =====

/**
 * 渲染标签筛选器
 */
function renderTagFilter() {
  const container = document.getElementById('tagFilterBar');
  let html = '<button class="tag-filter-btn active" data-tag="">全部</button>';
  allTags.forEach(function (tag) {
    html += '<button class="tag-filter-btn" data-tag="' + escapeHtml(tag) + '">' + escapeHtml(tag) + '</button>';
  });
  container.innerHTML = html;
}

/**
 * 筛选记录
 */
function getFilteredRecords() {
  return allRecords.filter(function (record) {
    // 关键词搜索
    if (currentFilter.keyword) {
      const kw = currentFilter.keyword.toLowerCase();
      const inName = record.dishName && record.dishName.toLowerCase().includes(kw);
      const inNotes = record.notes && record.notes.toLowerCase().includes(kw);
      if (!inName && !inNotes) return false;
    }
    // 标签筛选
    if (currentFilter.tag) {
      if (!record.tags || record.tags.indexOf(currentFilter.tag) === -1) return false;
    }
    // 餐次筛选
    if (currentFilter.mealType) {
      if (record.mealType !== currentFilter.mealType) return false;
    }
    return true;
  });
}

/**
 * 渲染时光轴
 */
function renderTimeline() {
  const container = document.getElementById('timelineContainer');
  const records = getFilteredRecords();

  if (records.length === 0) {
    container.innerHTML = createEmptyState('还没有美食记录', '点击"添加记录"开始你的第一道菜', '🍳');
    return;
  }

  // 按日期降序排列
  records.sort(function (a, b) { return new Date(b.date) - new Date(a.date); });

  let html = '<div class="timeline-line"></div>';

  records.forEach(function (record, index) {
    const isOdd = index % 2 === 0;
    const mealInfo = MEAL_TYPE_MAP[record.mealType] || MEAL_TYPE_MAP.dinner;
    const diffInfo = DIFFICULTY_MAP[record.difficulty] || DIFFICULTY_MAP.easy;
    const imgUrl = getRecordImageUrl(record);

    const imageContent = imgUrl
      ? '<img src="' + imgUrl + '" alt="' + escapeHtml(record.dishName) + '" loading="lazy" onclick="viewRecord(' + record.id + ')">'
      : '<div class="timeline-emoji" style="background:linear-gradient(135deg, var(--accent), var(--accent-light));" onclick="viewRecord(' + record.id + ')">' + (record.emoji || '🍽️') + '</div>';

    const tagsHtml = (record.tags && record.tags.length > 0)
      ? '<div class="timeline-tags">' + record.tags.slice(0, 4).map(function (t) { return '<span class="tag-chip">' + escapeHtml(t) + '</span>'; }).join('') + '</div>'
      : '';

    const starsHtml = record.rating
      ? '<span class="timeline-rating">' + '★'.repeat(record.rating) + '☆'.repeat(5 - record.rating) + '</span>'
      : '';

    html +=
      '<div class="timeline-item">' +
      '<div class="timeline-content">' +
      '<div class="timeline-date">' + formatDate(record.date) + ' ' + mealInfo.icon + ' ' + mealInfo.label + '</div>' +
      '<div class="timeline-title" onclick="viewRecord(' + record.id + ')">' + escapeHtml(record.dishName) + '</div>' +
      tagsHtml +
      (record.notes ? '<div class="timeline-desc">' + escapeHtml(record.notes) + '</div>' : '') +
      '<div class="timeline-meta">' +
      '<span class="difficulty-badge" style="color:' + diffInfo.color + ';border-color:' + diffInfo.color + '">' + diffInfo.label + '</span>' +
      starsHtml +
      '</div>' +
      '<div class="timeline-actions">' +
      '<button class="btn-icon" onclick="viewRecord(' + record.id + ')" title="查看详情">👁️</button>' +
      '<button class="btn-icon" onclick="editRecord(' + record.id + ')" title="编辑">✏️</button>' +
      '<button class="btn-icon" onclick="confirmDeleteRecord(' + record.id + ')" title="删除">🗑️</button>' +
      '</div>' +
      '</div>' +
      '<div class="timeline-dot"></div>' +
      '<div class="timeline-img">' + imageContent + '</div>' +
      '</div>';
  });

  container.innerHTML = html;
}

// ===== 模态框管理 =====

/**
 * 打开添加记录模态框
 */
function openAddModal() {
  editingRecordId = null;
  currentImageFile = null;
  currentImagePath = null;
  currentEmoji = '🍽️';

  // 重置表单
  document.getElementById('recordForm').reset();
  document.getElementById('tagList').innerHTML = '';
  document.getElementById('dateInput').value = new Date().toISOString().split('T')[0];
  document.getElementById('ratingInput').value = 0;
  updateStarDisplay(0);

  // 重置图片区域
  resetImageArea();

  // 隐藏营养分析面板
  hideNutritionPanel();

  // 更新标题
  document.getElementById('modalTitle').textContent = '记录新美食';
  document.getElementById('saveRecordBtn').textContent = '保存记录';

  document.getElementById('recordModal').classList.add('show');
}

/**
 * 编辑记录
 */
async function editRecord(id) {
  const record = allRecords.find(function (r) { return r.id == id; });
  if (!record) return;

  editingRecordId = id;
  currentImageFile = null;
  currentImagePath = record.imagePath || null;
  currentEmoji = record.emoji || '🍽️';

  // 关闭详情模态框
  document.getElementById('detailModal').classList.remove('show');

  // 编辑模式下隐藏营养分析面板（无新的识别数据）
  hideNutritionPanel();

  // 填充表单
  document.getElementById('dishNameInput').value = record.dishName || '';
  document.getElementById('dateInput').value = record.date || '';
  document.getElementById('mealTypeInput').value = record.mealType || 'dinner';
  document.getElementById('difficultyInput').value = record.difficulty || 'easy';
  document.getElementById('cookTimeInput').value = record.cookTime || '';
  document.getElementById('caloriesInput').value = record.calories || '';
  document.getElementById('notesInput').value = record.notes || '';
  document.getElementById('ratingInput').value = record.rating || 0;
  updateStarDisplay(record.rating || 0);

  // 填充标签
  document.getElementById('tagList').innerHTML = '';
  if (record.tags) {
    record.tags.forEach(function (tag) { addTagToForm(tag); });
  }

  // 显示已有图片
  const imgUrl = getRecordImageUrl(record);
  if (imgUrl) {
    const preview = document.getElementById('imagePreview');
    const uploadArea = document.getElementById('uploadArea');
    preview.innerHTML = '<img src="' + imgUrl + '" alt="预览"><button class="preview-remove" onclick="removeImage()">✕</button>';
    preview.style.display = 'block';
    uploadArea.style.display = 'none';
    // 编辑模式下不显示识别按钮（无本地文件可上传），用户可删除后重新上传
    document.getElementById('recognizeBtn').style.display = 'none';
  } else {
    resetImageArea();
  }

  // 更新标题
  document.getElementById('modalTitle').textContent = '编辑美食记录';
  document.getElementById('saveRecordBtn').textContent = '更新记录';

  document.getElementById('recordModal').classList.add('show');
}

/**
 * 查看记录详情
 */
function viewRecord(id) {
  const record = allRecords.find(function (r) { return r.id == id; });
  if (!record) return;

  const content = document.getElementById('detailContent');
  content.innerHTML = renderRecordDetail(record, true, true);

  document.getElementById('detailModal').classList.add('show');

  // 绑定详情中的编辑和删除按钮
  const editBtn = document.getElementById('detailEditBtn');
  const deleteBtn = document.getElementById('detailDeleteBtn');
  if (editBtn) editBtn.addEventListener('click', function () { editRecord(id); });
  if (deleteBtn) deleteBtn.addEventListener('click', function () { confirmDeleteRecord(id); });
}

/**
 * 确认删除记录
 */
function confirmDeleteRecord(id) {
  const record = allRecords.find(function (r) { return r.id == id; });
  if (!record) return;

  showConfirm('确定要删除「' + record.dishName + '」的记录吗？此操作不可撤销。', async function () {
    try {
      const res = await API.deleteRecord(id);
      if (res.success) {
        showToast('记录已删除', 'success');
        closeAllModals();
        await loadRecords();
      } else {
        showToast(res.message || '删除失败', 'error');
      }
    } catch (err) {
      showToast(err.message || '删除失败', 'error');
    }
  });
}

// ===== 图片上传 =====

function handleImageSelect(e) {
  if (e.target.files.length > 0) {
    handleImageFile(e.target.files[0]);
  }
}

function handleImageFile(file) {
  if (!file.type.startsWith('image/')) {
    showToast('请上传图片文件', 'error');
    return;
  }
  if (file.size > 5 * 1024 * 1024) {
    showToast('图片大小不能超过5MB', 'warning');
    return;
  }

  currentImageFile = file;
  currentImagePath = null; // 重置服务器路径，需要重新识别

  const reader = new FileReader();
  reader.onload = function (e) {
    const preview = document.getElementById('imagePreview');
    const uploadArea = document.getElementById('uploadArea');
    preview.innerHTML = '<img src="' + e.target.result + '" alt="预览"><button class="preview-remove" onclick="removeImage()">✕</button>';
    preview.style.display = 'block';
    uploadArea.style.display = 'none';
    document.getElementById('recognizeBtn').style.display = 'flex';
  };
  reader.readAsDataURL(file);
}

function removeImage() {
  currentImageFile = null;
  currentImagePath = null;
  resetImageArea();
  // 移除图片时隐藏营养分析面板
  hideNutritionPanel();
  document.getElementById('imageInput').value = '';
}

function resetImageArea() {
  const preview = document.getElementById('imagePreview');
  const uploadArea = document.getElementById('uploadArea');
  const recognizeBtn = document.getElementById('recognizeBtn');
  const progressEl = document.getElementById('recognizeProgress');

  if (preview) { preview.innerHTML = ''; preview.style.display = 'none'; }
  if (uploadArea) uploadArea.style.display = 'flex';
  if (recognizeBtn) recognizeBtn.style.display = 'none';
  if (progressEl) progressEl.style.display = 'none';
}

// ===== AI 识别 =====

async function startRecognition() {
  if (!currentImageFile) {
    showToast('请先上传图片', 'warning');
    return;
  }

  const btn = document.getElementById('recognizeBtn');
  const progressEl = document.getElementById('recognizeProgress');
  const progressText = progressEl.querySelector('.progress-text');

  btn.style.display = 'none';
  progressEl.style.display = 'block';

  const steps = ['正在上传图片...', '分析图像特征...', '匹配菜品数据库...', '生成识别结果...'];
  let stepIndex = 0;
  const stepInterval = setInterval(function () {
    if (stepIndex < steps.length) {
      progressText.textContent = steps[stepIndex];
      stepIndex++;
    }
  }, 500);

  try {
    const formData = new FormData();
    formData.append('image', currentImageFile);

    const res = await API.recognizeImage(formData);

    clearInterval(stepInterval);
    progressEl.style.display = 'none';
    btn.style.display = 'flex';

    if (res.success && res.data) {
      const data = res.data;
      // 保存服务器图片路径
      if (data.imagePath) {
        currentImagePath = data.imagePath;
      }

      // 填充表单
      if (data.dish) {
        fillFormWithDish(data.dish);
      }

      // 显示 AI 营养分析面板
      showNutritionPanel(data);

      const confidence = data.confidence ? Math.round(data.confidence * 100) : 0;
      const dishName = data.dish ? data.dish.name : '未知菜品';
      showToast('识别成功！可能是「' + dishName + '」，置信度' + confidence + '%', 'success');
    } else {
      showToast(res.message || '识别失败，请重试', 'error');
    }
  } catch (err) {
    clearInterval(stepInterval);
    progressEl.style.display = 'none';
    btn.style.display = 'flex';
    showToast(err.message || '识别失败，请检查网络后重试', 'error');
  }
}

/**
 * 用识别结果填充表单
 */
function fillFormWithDish(dish) {
  if (dish.name) document.getElementById('dishNameInput').value = dish.name;
  if (dish.difficulty) document.getElementById('difficultyInput').value = dish.difficulty;
  if (dish.cookTime) document.getElementById('cookTimeInput').value = dish.cookTime;
  if (dish.calories) document.getElementById('caloriesInput').value = dish.calories;
  if (dish.emoji) currentEmoji = dish.emoji;

  // 清空已有标签并添加识别的标签
  document.getElementById('tagList').innerHTML = '';
  if (dish.tags) {
    dish.tags.forEach(function (tag) { addTagToForm(tag); });
  }
}

/**
 * 用推荐结果填充表单
 */
function fillFormWithRecommendation(rec) {
  if (rec.name) document.getElementById('dishNameInput').value = rec.name;
  if (rec.difficulty) document.getElementById('difficultyInput').value = rec.difficulty;
  if (rec.cookTime) document.getElementById('cookTimeInput').value = rec.cookTime;
  if (rec.calories) document.getElementById('caloriesInput').value = rec.calories;
  if (rec.emoji) currentEmoji = rec.emoji;

  document.getElementById('tagList').innerHTML = '';
  if (rec.tags) {
    rec.tags.forEach(function (tag) { addTagToForm(tag); });
  }
}

// ===== AI 营养分析面板 =====

/**
 * 显示 AI 营养分析面板
 * 兼容营养数据在 data 或 data.dish 上的情况
 * @param {object} data - 识别返回数据
 */
function showNutritionPanel(data) {
  const panel = document.getElementById('nutritionPanel');
  if (!panel) return;

  // 营养数据可能在 data 或 data.dish 上
  const dish = data.dish || {};
  const nutrition = data.nutrition || dish.nutrition || null;
  const ingredients = data.ingredients || dish.ingredients || null;
  const healthTags = data.healthTags || dish.healthTags || null;
  const healthScore = data.healthScore != null ? data.healthScore : (dish.healthScore != null ? dish.healthScore : null);
  const cookingTips = data.cookingTips || dish.cookingTips || null;

  // 健康评分
  const scoreEl = document.getElementById('healthScore');
  const scoreBarEl = document.getElementById('healthScoreBar');
  if (healthScore != null) {
    const score = Number(healthScore);
    if (scoreEl) scoreEl.textContent = score;
    if (scoreBarEl) {
      // 评分进度条（假设满分 100）
      const percent = Math.max(0, Math.min(100, score));
      // 延迟设置宽度以触发过渡动画
      scoreBarEl.style.width = '0';
      setTimeout(function () { scoreBarEl.style.width = percent + '%'; }, 50);
    }
  } else {
    if (scoreEl) scoreEl.textContent = '-';
    if (scoreBarEl) scoreBarEl.style.width = '0';
  }

  // 营养成分
  setNutritionText('nutritionProtein', nutrition ? nutrition.protein : null, 'g');
  setNutritionText('nutritionCarbs', nutrition ? nutrition.carbs : null, 'g');
  setNutritionText('nutritionFat', nutrition ? nutrition.fat : null, 'g');
  setNutritionText('nutritionFiber', nutrition ? nutrition.fiber : null, 'g');
  setNutritionText('nutritionSodium', nutrition ? nutrition.sodium : null, 'mg');

  // 食材列表
  renderIngredients(ingredients);

  // 健康标签
  renderHealthTags(healthTags);

  // 烹饪小贴士
  renderCookingTips(cookingTips);

  panel.style.display = 'block';
}

/**
 * 设置营养成分文本
 */
function setNutritionText(id, value, unit) {
  const el = document.getElementById(id);
  if (!el) return;
  if (value != null && value !== '') {
    el.textContent = value + ' ' + unit;
  } else {
    el.textContent = '- ' + unit;
  }
}

/**
 * 渲染食材列表
 */
function renderIngredients(ingredients) {
  const container = document.getElementById('ingredientsList');
  if (!container) return;

  if (!ingredients || (Array.isArray(ingredients) && ingredients.length === 0)) {
    container.innerHTML = '';
    return;
  }

  // 兼容数组或字符串
  let list = ingredients;
  if (typeof ingredients === 'string') {
    list = ingredients.split(/[,，、\n]/).map(function (s) { return s.trim(); }).filter(Boolean);
  }

  let html = '<div class="il-title">🥘 食材列表</div><div class="ingredients-chips">';
  list.forEach(function (item) {
    // 兼容对象格式 {name, amount} 和字符串格式
    var text;
    if (typeof item === 'object' && item !== null) {
      text = item.name + (item.amount ? ' ' + item.amount : '');
    } else {
      text = String(item);
    }
    html += '<span class="ingredient-chip">' + escapeHtml(text) + '</span>';
  });
  html += '</div>';
  container.innerHTML = html;
}

/**
 * 渲染健康标签
 */
function renderHealthTags(tags) {
  const container = document.getElementById('healthTags');
  if (!container) return;

  if (!tags || (Array.isArray(tags) && tags.length === 0)) {
    container.innerHTML = '';
    return;
  }

  let list = tags;
  if (typeof tags === 'string') {
    list = tags.split(/[,，、\n]/).map(function (s) { return s.trim(); }).filter(Boolean);
  }

  let html = '<div class="ht-title">🏷️ 健康标签</div><div class="health-tags-list">';
  list.forEach(function (tag) {
    html += '<span class="health-tag">' + escapeHtml(String(tag)) + '</span>';
  });
  html += '</div>';
  container.innerHTML = html;
}

/**
 * 渲染烹饪小贴士
 */
function renderCookingTips(tips) {
  const container = document.getElementById('cookingTips');
  if (!container) return;

  if (!tips || (Array.isArray(tips) && tips.length === 0)) {
    container.innerHTML = '';
    return;
  }

  let content = tips;
  if (Array.isArray(tips)) {
    content = tips.map(function (t) { return '· ' + t; }).join('\n');
  }

  container.innerHTML =
    '<div class="ct-title">💡 烹饪小贴士</div>' +
    '<div class="ct-content">' + escapeHtml(String(content)) + '</div>';
}

/**
 * 隐藏并重置营养分析面板
 */
function hideNutritionPanel() {
  const panel = document.getElementById('nutritionPanel');
  if (!panel) return;
  panel.style.display = 'none';

  // 重置各字段
  const scoreEl = document.getElementById('healthScore');
  const scoreBarEl = document.getElementById('healthScoreBar');
  if (scoreEl) scoreEl.textContent = '-';
  if (scoreBarEl) scoreBarEl.style.width = '0';

  setNutritionText('nutritionProtein', null, 'g');
  setNutritionText('nutritionCarbs', null, 'g');
  setNutritionText('nutritionFat', null, 'g');
  setNutritionText('nutritionFiber', null, 'g');
  setNutritionText('nutritionSodium', null, 'mg');

  const ingredientsEl = document.getElementById('ingredientsList');
  const healthTagsEl = document.getElementById('healthTags');
  const cookingTipsEl = document.getElementById('cookingTips');
  if (ingredientsEl) ingredientsEl.innerHTML = '';
  if (healthTagsEl) healthTagsEl.innerHTML = '';
  if (cookingTipsEl) cookingTipsEl.innerHTML = '';
}

// ===== 标签管理 =====

function addTagFromInput() {
  const input = document.getElementById('tagInput');
  const value = input.value.trim();
  if (value) {
    addTagToForm(value);
    input.value = '';
  }
}

function addTagToForm(tag) {
  const list = document.getElementById('tagList');
  const existing = list.querySelectorAll('.form-tag');
  for (let i = 0; i < existing.length; i++) {
    if (existing[i].dataset.tag === tag) return;
  }

  const tagEl = document.createElement('span');
  tagEl.className = 'form-tag';
  tagEl.dataset.tag = tag;
  tagEl.innerHTML = escapeHtml(tag) + ' <button type="button" onclick="this.parentElement.remove()">✕</button>';
  list.appendChild(tagEl);
}

function getFormTags() {
  const tags = [];
  document.querySelectorAll('#tagList .form-tag').forEach(function (el) {
    tags.push(el.dataset.tag);
  });
  return tags;
}

// ===== 评分 =====

function updateStarDisplay(value) {
  document.querySelectorAll('#starRating .star').forEach(function (star) {
    const starValue = parseInt(star.dataset.value);
    star.classList.toggle('active', starValue <= value);
  });
}

// ===== 保存记录 =====

async function saveRecord() {
  const dishName = document.getElementById('dishNameInput').value.trim();
  if (!dishName) {
    showToast('请输入菜品名称', 'warning');
    return;
  }

  const recordData = {
    dishName: dishName,
    imagePath: currentImagePath || '',
    emoji: currentEmoji,
    date: document.getElementById('dateInput').value || new Date().toISOString().split('T')[0],
    mealType: document.getElementById('mealTypeInput').value,
    tags: getFormTags(),
    difficulty: document.getElementById('difficultyInput').value,
    cookTime: parseInt(document.getElementById('cookTimeInput').value) || 0,
    calories: parseInt(document.getElementById('caloriesInput').value) || 0,
    notes: document.getElementById('notesInput').value.trim(),
    rating: parseInt(document.getElementById('ratingInput').value) || 0
  };

  const btn = document.getElementById('saveRecordBtn');
  const originalText = btn.textContent;
  btn.textContent = '保存中...';
  btn.disabled = true;

  try {
    let res;
    if (editingRecordId) {
      res = await API.updateRecord(editingRecordId, recordData);
    } else {
      res = await API.createRecord(recordData);
    }

    if (res.success) {
      showToast(editingRecordId ? '记录已更新' : '美食记录已保存', 'success');
      closeAllModals();
      await loadRecords();
      // 重新加载标签（可能有新标签）
      await loadTags();
    } else {
      showToast(res.message || '保存失败', 'error');
    }
  } catch (err) {
    showToast(err.message || '保存失败', 'error');
  } finally {
    btn.textContent = originalText;
    btn.disabled = false;
  }
}
