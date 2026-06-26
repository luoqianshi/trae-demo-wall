/**
 * 食光机 - 主控制器
 * 负责事件绑定、模态框管理、应用初始化、全局协调
 */
const App = (function () {

  let currentImage = null; // 当前上传的图片base64
  let currentRecognizedDish = null; // 当前AI识别结果
  let editingRecordId = null; // 当前编辑的记录ID
  let currentFilter = { keyword: '', tags: [], mealType: 'all' };

  /**
   * 应用初始化
   */
  function init() {
    // 首次使用时插入示例数据
    const settings = Storage.getSettings();
    if (!settings.initialized) {
      Storage.seedSampleData();
      Storage.saveSettings({ initialized: true });
    }

    bindEvents();
    UI.renderTagFilter([]);
    renderAll();
    updateHeroStats();
  }

  /**
   * 绑定所有事件
   */
  function bindEvents() {
    // 导航栏按钮
    document.getElementById('navAddBtn')?.addEventListener('click', openAddModal);
    document.getElementById('heroAddBtn')?.addEventListener('click', openAddModal);
    document.getElementById('ctaAddBtn')?.addEventListener('click', openAddModal);

    // 模态框关闭
    document.querySelectorAll('.modal-close, .modal-overlay').forEach(el => {
      el.addEventListener('click', closeAllModals);
    });

    // 阻止模态框内容点击时关闭
    document.querySelectorAll('.modal-content').forEach(el => {
      el.addEventListener('click', e => e.stopPropagation());
    });

    // 图片上传
    document.getElementById('imageInput')?.addEventListener('change', handleImageUpload);
    document.getElementById('uploadArea')?.addEventListener('click', () => {
      document.getElementById('imageInput').click();
    });
    document.getElementById('uploadArea')?.addEventListener('dragover', e => {
      e.preventDefault();
      e.currentTarget.classList.add('drag-over');
    });
    document.getElementById('uploadArea')?.addEventListener('dragleave', e => {
      e.currentTarget.classList.remove('drag-over');
    });
    document.getElementById('uploadArea')?.addEventListener('drop', e => {
      e.preventDefault();
      e.currentTarget.classList.remove('drag-over');
      if (e.dataTransfer.files.length > 0) {
        handleImageFile(e.dataTransfer.files[0]);
      }
    });

    // AI识别按钮
    document.getElementById('recognizeBtn')?.addEventListener('click', startRecognition);

    // 保存记录
    document.getElementById('saveRecordBtn')?.addEventListener('click', saveRecord);

    // 搜索
    document.getElementById('searchInput')?.addEventListener('input', debounce(handleSearch, 300));

    // 餐次筛选
    document.getElementById('mealTypeFilter')?.addEventListener('change', e => {
      currentFilter.mealType = e.target.value;
      renderTimelineAndGallery();
    });

    // 标签筛选（事件委托）
    document.getElementById('tagFilter')?.addEventListener('click', e => {
      if (e.target.classList.contains('tag-filter-btn')) {
        const tag = e.target.dataset.tag;
        document.querySelectorAll('.tag-filter-btn').forEach(btn => btn.classList.remove('active'));
        e.target.classList.add('active');

        if (tag === '') {
          currentFilter.tags = [];
        } else {
          currentFilter.tags = [tag];
        }
        renderTimelineAndGallery();
      }
    });

    // 导出数据
    document.getElementById('exportBtn')?.addEventListener('click', exportData);
    document.getElementById('importBtn')?.addEventListener('click', () => {
      document.getElementById('importInput').click();
    });
    document.getElementById('importInput')?.addEventListener('change', handleImport);

    // ESC关闭模态框
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') closeAllModals();
    });

    // 标签输入
    document.getElementById('tagInput')?.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ',') {
        e.preventDefault();
        addTagFromInput();
      }
    });

    document.getElementById('addTagBtn')?.addEventListener('click', addTagFromInput);

    // 评分
    document.querySelectorAll('.star-rating .star').forEach(star => {
      star.addEventListener('click', () => {
        const value = parseInt(star.dataset.value);
        document.getElementById('ratingInput').value = value;
        updateStarDisplay(value);
      });
    });
  }

  /**
   * 渲染所有内容
   */
  function renderAll() {
    renderTimelineAndGallery();
    renderRecommendations();
    renderStats();
  }

  /**
   * 渲染时光轴和相册
   */
  function renderTimelineAndGallery() {
    const records = Storage.searchRecords(currentFilter);
    UI.renderTimeline(records);
    UI.renderGallery(records);
  }

  /**
   * 渲染推荐
   */
  function renderRecommendations() {
    const history = Storage.getAllRecords();
    const recommendations = AIEngine.getRecommendations(history, 5);
    UI.renderRecommendations(recommendations);
  }

  /**
   * 渲染统计
   */
  function renderStats() {
    const stats = Storage.getStats();
    UI.renderStatsBar(stats);
    Charts.renderAllCharts(stats);
  }

  /**
   * 更新Hero区域统计
   */
  function updateHeroStats() {
    const stats = Storage.getStats();
    const el1 = document.getElementById('heroStatRecords');
    const el2 = document.getElementById('heroStatTags');
    const el3 = document.getElementById('heroStatRating');

    if (el1) el1.textContent = stats.total + '+';
    if (el2) el2.textContent = Object.keys(stats.tagCount).length + '+';
    if (el3) el3.textContent = stats.avgRating;

    // 更新浮动卡片
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const records = Storage.getAllRecords();
    const weekCount = records.filter(r => new Date(r.date) >= weekAgo).length;
    const weekEl = document.getElementById('floatingWeek');
    if (weekEl) weekEl.textContent = weekCount + ' 道菜';

    // 最常用标签
    const tagEntries = Object.entries(stats.tagCount).sort((a, b) => b[1] - a[1]);
    const tagEl = document.getElementById('floatingTag');
    const tagSubEl = document.querySelector('.floating-card.card-2 .card-sub');
    if (tagEl && tagEntries.length > 0) {
      tagEl.textContent = tagEntries[0][0];
      if (tagSubEl) tagSubEl.textContent = '累计 ' + tagEntries[0][1] + ' 次';
    }
  }

  // ==================== 图片上传 ====================

  function handleImageUpload(e) {
    if (e.target.files.length > 0) {
      handleImageFile(e.target.files[0]);
    }
  }

  function handleImageFile(file) {
    if (!file.type.startsWith('image/')) {
      UI.showToast('请上传图片文件', 'error');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      UI.showToast('图片大小不能超过5MB', 'warning');
      return;
    }

    const reader = new FileReader();
    reader.onload = e => {
      currentImage = e.target.result;
      const preview = document.getElementById('imagePreview');
      const uploadArea = document.getElementById('uploadArea');

      if (preview && uploadArea) {
        preview.innerHTML = `<img src="${currentImage}" alt="预览"><button class="preview-remove" onclick="App.removeImage()">✕</button>`;
        preview.style.display = 'block';
        uploadArea.style.display = 'none';

        // 显示识别按钮
        document.getElementById('recognizeBtn').style.display = 'flex';
      }
    };
    reader.readAsDataURL(file);
  }

  function removeImage() {
    currentImage = null;
    currentRecognizedDish = null;
    const preview = document.getElementById('imagePreview');
    const uploadArea = document.getElementById('uploadArea');
    const recognizeBtn = document.getElementById('recognizeBtn');

    if (preview) { preview.innerHTML = ''; preview.style.display = 'none'; }
    if (uploadArea) uploadArea.style.display = 'flex';
    if (recognizeBtn) recognizeBtn.style.display = 'none';

    document.getElementById('imageInput').value = '';
  }

  // ==================== AI识别 ====================

  function startRecognition() {
    if (!currentImage) {
      UI.showToast('请先上传图片', 'warning');
      return;
    }

    const btn = document.getElementById('recognizeBtn');
    const progressEl = document.getElementById('recognizeProgress');

    btn.style.display = 'none';
    progressEl.style.display = 'block';

    AIEngine.recognizeDish(currentImage, (step) => {
      progressEl.querySelector('.progress-text').textContent = step;
    }).then(result => {
      progressEl.style.display = 'none';
      btn.style.display = 'flex';

      if (result.success) {
        currentRecognizedDish = result.dish;
        fillFormWithDish(result.dish);
        UI.showToast(`识别成功！可能是「${result.dish.name}」，置信度${Math.round(result.confidence * 100)}%`, 'success');
      }
    });
  }

  function fillFormWithDish(dish) {
    document.getElementById('dishNameInput').value = dish.name;
    document.getElementById('difficultyInput').value = dish.difficulty;
    document.getElementById('cookTimeInput').value = dish.cookTime;
    document.getElementById('caloriesInput').value = dish.calories;

    // 清空已有标签并添加识别的标签
    document.getElementById('tagList').innerHTML = '';
    dish.tags.forEach(tag => addTagToForm(tag));
  }

  // ==================== 标签管理 ====================

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
    // 检查是否已存在
    const existing = list.querySelectorAll('.form-tag');
    for (let el of existing) {
      if (el.dataset.tag === tag) return;
    }

    const tagEl = document.createElement('span');
    tagEl.className = 'form-tag';
    tagEl.dataset.tag = tag;
    tagEl.innerHTML = `${tag} <button type="button" onclick="this.parentElement.remove()">✕</button>`;
    list.appendChild(tagEl);
  }

  function getFormTags() {
    const tags = [];
    document.querySelectorAll('#tagList .form-tag').forEach(el => {
      tags.push(el.dataset.tag);
    });
    return tags;
  }

  // ==================== 评分 ====================

  function updateStarDisplay(value) {
    document.querySelectorAll('.star-rating .star').forEach(star => {
      const starValue = parseInt(star.dataset.value);
      star.classList.toggle('active', starValue <= value);
    });
  }

  // ==================== 保存记录 ====================

  function saveRecord() {
    const dishName = document.getElementById('dishNameInput').value.trim();
    if (!dishName) {
      UI.showToast('请输入菜品名称', 'warning');
      return;
    }

    const record = {
      dishName: dishName,
      image: currentImage,
      emoji: currentRecognizedDish ? currentRecognizedDish.emoji : '🍽️',
      date: document.getElementById('dateInput').value || new Date().toISOString().split('T')[0],
      mealType: document.getElementById('mealTypeInput').value,
      tags: getFormTags(),
      difficulty: document.getElementById('difficultyInput').value,
      cookTime: parseInt(document.getElementById('cookTimeInput').value) || 0,
      calories: parseInt(document.getElementById('caloriesInput').value) || 0,
      notes: document.getElementById('notesInput').value.trim(),
      rating: parseInt(document.getElementById('ratingInput').value) || 0
    };

    if (editingRecordId) {
      Storage.updateRecord(editingRecordId, record);
      UI.showToast('记录已更新', 'success');
    } else {
      Storage.addRecord(record);
      UI.showToast('美食记录已保存', 'success');
    }

    closeAllModals();
    renderAll();
    updateHeroStats();
  }

  // ==================== 模态框管理 ====================

  function openAddModal() {
    editingRecordId = null;
    currentImage = null;
    currentRecognizedDish = null;

    // 重置表单
    document.getElementById('recordForm').reset();
    document.getElementById('tagList').innerHTML = '';
    document.getElementById('dateInput').value = new Date().toISOString().split('T')[0];
    document.getElementById('ratingInput').value = 0;
    updateStarDisplay(0);

    // 重置图片区域
    removeImage();

    // 更新标题
    document.getElementById('modalTitle').textContent = '记录新美食';
    document.getElementById('saveRecordBtn').textContent = '保存记录';

    // 显示模态框
    document.getElementById('recordModal').classList.add('show');
  }

  function editRecord(id) {
    const record = Storage.getRecord(id);
    if (!record) return;

    editingRecordId = id;
    currentImage = record.image;
    currentRecognizedDish = null;

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
      record.tags.forEach(tag => addTagToForm(tag));
    }

    // 显示图片
    if (record.image) {
      const preview = document.getElementById('imagePreview');
      const uploadArea = document.getElementById('uploadArea');
      preview.innerHTML = `<img src="${record.image}" alt="预览"><button class="preview-remove" onclick="App.removeImage()">✕</button>`;
      preview.style.display = 'block';
      uploadArea.style.display = 'none';
    } else {
      removeImage();
    }

    // 更新标题
    document.getElementById('modalTitle').textContent = '编辑美食记录';
    document.getElementById('saveRecordBtn').textContent = '更新记录';

    // 关闭详情模态框，打开编辑模态框
    document.getElementById('detailModal').classList.remove('show');
    document.getElementById('recordModal').classList.add('show');
  }

  function viewRecord(id) {
    const record = Storage.getRecord(id);
    if (!record) return;

    const modal = document.getElementById('detailModal');
    const content = document.getElementById('detailContent');
    content.innerHTML = UI.renderRecordDetail(record);
    modal.classList.add('show');
  }

  function confirmDelete(id) {
    const record = Storage.getRecord(id);
    if (!record) return;

    UI.showConfirm(`确定要删除「${record.dishName}」的记录吗？此操作不可撤销。`, () => {
      Storage.deleteRecord(id);
      UI.showToast('记录已删除', 'success');
      closeAllModals();
      renderAll();
      updateHeroStats();
    });
  }

  function closeAllModals() {
    document.querySelectorAll('.modal').forEach(m => m.classList.remove('show'));
  }

  // ==================== 搜索与筛选 ====================

  function handleSearch(e) {
    currentFilter.keyword = e.target.value.trim();
    renderTimelineAndGallery();
  }

  // ==================== 数据导入导出 ====================

  function exportData() {
    const data = Storage.exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `shiguangji_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    UI.showToast('数据已导出', 'success');
  }

  function handleImport(e) {
    if (e.target.files.length === 0) return;
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = ev => {
      if (Storage.importData(ev.target.result)) {
        UI.showToast('数据导入成功', 'success');
        renderAll();
        updateHeroStats();
      } else {
        UI.showToast('数据导入失败，请检查文件格式', 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  // ==================== 推荐添加 ====================

  function addRecommendToRecord(dishName) {
    const dish = AIEngine.getDishDatabase().find(d => d.name === dishName);
    if (!dish) return;

    // 打开添加模态框并预填
    openAddModal();

    // 填充推荐菜品信息
    currentRecognizedDish = dish;
    setTimeout(() => {
      fillFormWithDish(dish);
      UI.showToast(`已填入「${dish.name}」的信息，完善后即可保存`, 'info');
    }, 100);
  }

  // ==================== 工具函数 ====================

  function debounce(fn, delay) {
    let timer;
    return function (...args) {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), delay);
    };
  }

  // 暴露公共方法
  return {
    init,
    openAddModal,
    editRecord,
    viewRecord,
    confirmDelete,
    removeImage,
    addRecommendToRecord,
    closeAllModals
  };
})();

// DOM 加载完成后初始化
document.addEventListener('DOMContentLoaded', App.init);
