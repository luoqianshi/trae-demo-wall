// ========== 团聚故事模块 ==========

let currentReunionSort = 'reunion-date';

function renderReunionPage(sortType) {
  currentReunionSort = sortType || 'reunion-date';

  // 更新排序按钮状态
  document.querySelectorAll('.sort-btn-reunion').forEach(btn => {
    if (btn.dataset.sort === currentReunionSort) {
      btn.classList.add('bg-reunion', 'text-white', 'border-reunion');
      btn.classList.remove('bg-white', 'border-gray-300');
    } else {
      btn.classList.remove('bg-reunion', 'text-white', 'border-reunion');
      btn.classList.add('bg-white', 'border-gray-300');
    }
  });

  const allPersons = getAllPersons();
  const reunited = allPersons.filter(p => p.status === 'reunited');

  // 排序
  if (currentReunionSort === 'reunion-date') {
    reunited.sort((a, b) => new Date(b.reunion.date) - new Date(a.reunion.date));
  } else if (currentReunionSort === 'missing-duration') {
    reunited.sort((a, b) => b.reunion.missingDuration - a.reunion.missingDuration);
  }

  // 更新总数
  const countEl = document.getElementById('reunion-count');
  if (countEl) countEl.textContent = reunited.length;

  // 渲染卡片
  const gridEl = document.getElementById('reunion-grid');
  if (gridEl) {
    if (reunited.length === 0) {
      gridEl.innerHTML = `
        <div class="col-span-full text-center py-12">
          <div class="text-6xl text-gray-300 mb-4"><i class="fa-solid fa-heart-crack"></i></div>
          <h3 class="text-xl font-bold text-gray-700 mb-2">暂无团聚故事</h3>
          <p class="text-gray-500">希望所有失踪的人都能早日回家</p>
        </div>
      `;
    } else {
      gridEl.innerHTML = reunited.map(p => `
        <div class="reunion-card" onclick="showReunionDetail('${p.id}')">
          <!-- 照片对比 -->
          <div class="grid grid-cols-2 gap-2 mb-4">
            <div class="relative">
              <img src="${p.photos[0] || ''}" alt="${p.name} - 失踪时" class="w-full h-40 object-cover rounded-lg" />
              <span class="absolute top-2 left-2 bg-missing text-white text-xs px-2 py-1 rounded-full">失踪时</span>
            </div>
            <div class="relative">
              <img src="${p.reunion.reunitedPhotos[0] || p.photos[0]}" alt="${p.name} - 团聚后" class="w-full h-40 object-cover rounded-lg" />
              <span class="absolute top-2 left-2 bg-reunion text-white text-xs px-2 py-1 rounded-full">团聚后</span>
            </div>
          </div>

          <div class="reunion-badge mb-2">
            <i class="fa-solid fa-heart mr-1"></i> 已团聚
          </div>
          <h3 class="text-xl font-bold text-gray-800 mb-2">${p.name}</h3>

          <div class="space-y-1 text-sm text-gray-600 mb-3">
            <p><i class="fa-solid fa-location-dot mr-1 text-gray-400"></i> 失踪: ${p.missingLocation}</p>
            <p><i class="fa-solid fa-flag-checkered mr-1 text-reunion"></i> 团聚: ${p.reunion.location}</p>
            <p class="text-reunion-dark font-semibold">
              <i class="fa-solid fa-hourglass-half mr-1"></i> 失踪 ${p.reunion.missingDuration} 天后回家
            </p>
          </div>

          <p class="text-sm text-gray-700 line-clamp-3 mb-3">${p.reunion.story.substring(0, 100)}...</p>

          <button class="w-full bg-reunion hover:bg-reunion-dark text-white font-semibold py-2 px-4 rounded-lg transition" onclick="event.stopPropagation(); showReunionDetail('${p.id}')">
            <i class="fa-solid fa-book-open mr-2"></i> 查看完整故事
          </button>
        </div>
      `).join('');
    }
  }

  // 渲染统计图表
  renderStatsChart();
}

function renderStatsChart() {
  const chartEl = document.getElementById('stats-chart');
  if (!chartEl) return;

  const stats = getStats();
  const total = stats.total;
  const reunited = stats.reunited;
  const missing = stats.missing;

  const reunitedPercent = total > 0 ? (reunited / total * 100).toFixed(1) : 0;
  const missingPercent = total > 0 ? (missing / total * 100).toFixed(1) : 0;

  chartEl.innerHTML = `
    <!-- 已团聚圆形进度 -->
    <div class="text-center">
      <svg width="180" height="180" viewBox="0 0 180 180">
        <circle cx="90" cy="90" r="75" fill="none" stroke="#e5e7eb" stroke-width="14" />
        <circle cx="90" cy="90" r="75" fill="none" stroke="#22c55e" stroke-width="14"
          stroke-dasharray="${471.2}" stroke-dashoffset="${471.2 * (1 - reunitedPercent / 100)}"
          stroke-linecap="round" transform="rotate(-90 90 90)"
          style="transition: stroke-dashoffset 1.5s ease-out" />
      </svg>
      <div style="margin-top: -110px; position: relative; z-index: 1;">
        <div class="text-4xl font-bold text-reunion-dark">${reunited}</div>
        <div class="text-sm text-gray-500">已团聚</div>
        <div class="text-xs text-reunion mt-1">${reunitedPercent}%</div>
      </div>
      <div style="height: 50px;"></div>
    </div>

    <!-- 失踪中圆形进度 -->
    <div class="text-center">
      <svg width="180" height="180" viewBox="0 0 180 180">
        <circle cx="90" cy="90" r="75" fill="none" stroke="#e5e7eb" stroke-width="14" />
        <circle cx="90" cy="90" r="75" fill="none" stroke="#ef4444" stroke-width="14"
          stroke-dasharray="${471.2}" stroke-dashoffset="${471.2 * (1 - missingPercent / 100)}"
          stroke-linecap="round" transform="rotate(-90 90 90)"
          style="transition: stroke-dashoffset 1.5s ease-out" />
      </svg>
      <div style="margin-top: -110px; position: relative; z-index: 1;">
        <div class="text-4xl font-bold text-missing">${missing}</div>
        <div class="text-sm text-gray-500">寻找中</div>
        <div class="text-xs text-missing mt-1">${missingPercent}%</div>
      </div>
      <div style="height: 50px;"></div>
    </div>

    <!-- 总计 -->
    <div class="text-center">
      <svg width="180" height="180" viewBox="0 0 180 180">
        <circle cx="90" cy="90" r="75" fill="none" stroke="#e5e7eb" stroke-width="14" />
        <circle cx="90" cy="90" r="75" fill="none" stroke="#6b7280" stroke-width="14"
          stroke-dasharray="${471.2}" stroke-dashoffset="0"
          stroke-linecap="round" transform="rotate(-90 90 90)" />
      </svg>
      <div style="margin-top: -110px; position: relative; z-index: 1;">
        <div class="text-4xl font-bold text-gray-700">${total}</div>
        <div class="text-sm text-gray-500">总计信息</div>
      </div>
      <div style="height: 50px;"></div>
    </div>
  `;
}

function showReunionDetail(personId) {
  const person = getPersonById(personId);
  if (!person || person.status !== 'reunited') return;

  const modalEl = document.getElementById('reunion-modal');
  const contentEl = document.getElementById('reunion-modal-content');
  if (!modalEl || !contentEl) {
    navigateTo('detail', personId);
    return;
  }

  // 获取关键线索评论
  const keyComment = person.reunion.keyCommentId
    ? (person.comments || []).find(c => c.id === person.reunion.keyCommentId)
    : null;

  contentEl.innerHTML = `
    <div class="bg-gradient-to-br from-green-50 to-white rounded-2xl overflow-hidden">
      <!-- 顶部照片区域 -->
      <div class="relative">
        <div class="grid grid-cols-2">
          <div class="relative h-64">
            <img src="${person.photos[0] || ''}" alt="${person.name}" class="w-full h-full object-cover" />
            <div class="absolute top-4 left-4 bg-missing text-white text-sm font-semibold px-3 py-1 rounded-full">
              失踪时
            </div>
          </div>
          <div class="relative h-64">
            <img src="${person.reunion.reunitedPhotos[0] || person.photos[0]}" alt="${person.name} 团聚" class="w-full h-full object-cover" />
            <div class="absolute top-4 left-4 bg-reunion text-white text-sm font-semibold px-3 py-1 rounded-full">
              团聚后
            </div>
          </div>
        </div>
        <div class="absolute top-4 right-4">
          <button onclick="closeReunionModal()" class="bg-white/90 hover:bg-white w-10 h-10 rounded-full flex items-center justify-center shadow-lg">
            <i class="fa-solid fa-xmark text-gray-700 text-lg"></i>
          </button>
        </div>
      </div>

      <!-- 标题区 -->
      <div class="px-8 py-6 border-b border-gray-200 text-center">
        <div class="inline-flex items-center justify-center bg-reunion text-white px-4 py-2 rounded-full text-sm font-bold mb-3">
          <i class="fa-solid fa-heart mr-2"></i> 已团聚
        </div>
        <h2 class="text-3xl font-bold text-gray-800 mb-2">${person.name} 回家了</h2>
        <p class="text-xl text-reunion-dark font-bold">
          失踪 ${person.reunion.missingDuration} 天后，与家人重聚
        </p>
      </div>

      <!-- 时间线 -->
      <div class="px-8 py-6 bg-gray-50 border-b border-gray-200">
        <h3 class="text-lg font-bold text-gray-800 mb-4">
          <i class="fa-solid fa-timeline text-reunion mr-2"></i> 事件时间线
        </h3>
        <div class="space-y-4">
          <div class="flex gap-4">
            <div class="flex-shrink-0 w-10 h-10 bg-missing text-white rounded-full flex items-center justify-center font-bold">
              <i class="fa-solid fa-person-circle-question"></i>
            </div>
            <div class="flex-1">
              <div class="font-semibold text-gray-800">失踪</div>
              <div class="text-sm text-gray-500 mb-1">${person.missingDate}</div>
              <div class="text-sm text-gray-600">${person.missingLocation}</div>
            </div>
          </div>
          <div class="flex gap-4">
            <div class="flex-shrink-0 w-10 h-10 bg-warm-gold text-white rounded-full flex items-center justify-center font-bold">
              <i class="fa-solid fa-magnifying-glass"></i>
            </div>
            <div class="flex-1">
              <div class="font-semibold text-gray-800">发布寻亲信息</div>
              <div class="text-sm text-gray-500 mb-1">${formatDate(person.createdAt)}</div>
              <div class="text-sm text-gray-600">通过本平台发布，开始广泛传播</div>
            </div>
          </div>
          ${keyComment ? `
          <div class="flex gap-4">
            <div class="flex-shrink-0 w-10 h-10 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold">
              <i class="fa-solid fa-lightbulb"></i>
            </div>
            <div class="flex-1 bg-blue-50 p-3 rounded-lg">
              <div class="font-semibold text-gray-800">关键线索</div>
              <div class="text-sm text-gray-500 mb-1">由 ${keyComment.nickname} 提供</div>
              <div class="text-sm text-gray-700 italic">"${keyComment.content}"</div>
            </div>
          </div>
          ` : ''}
          <div class="flex gap-4">
            <div class="flex-shrink-0 w-10 h-10 bg-reunion text-white rounded-full flex items-center justify-center font-bold">
              <i class="fa-solid fa-house-heart"></i>
            </div>
            <div class="flex-1">
              <div class="font-semibold text-gray-800 text-reunion-dark">家人团聚</div>
              <div class="text-sm text-gray-500 mb-1">${person.reunion.date}</div>
              <div class="text-sm text-gray-600">${person.reunion.location}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 团聚故事详情 -->
      <div class="px-8 py-6 border-b border-gray-200">
        <h3 class="text-lg font-bold text-gray-800 mb-4">
          <i class="fa-solid fa-book-open text-reunion mr-2"></i> 团聚故事
        </h3>
        <p class="text-gray-700 leading-relaxed text-base">${person.reunion.story}</p>
      </div>

      <!-- 家庭留言 -->
      ${person.reunion.familyMessage ? `
      <div class="px-8 py-6 border-b border-gray-200 bg-gradient-to-r from-yellow-50 to-white">
        <h3 class="text-lg font-bold text-gray-800 mb-3">
          <i class="fa-solid fa-quote-left text-warm-gold mr-2"></i> 家庭留言
        </h3>
        <div class="bg-white border-l-4 border-warm-gold p-4 rounded-lg shadow-sm">
          <p class="text-gray-700 italic leading-relaxed">"${person.reunion.familyMessage}"</p>
          <div class="text-right text-sm text-gray-500 mt-3">— ${person.contactName}</div>
        </div>
      </div>
      ` : ''}

      <!-- 查看详情按钮 -->
      <div class="px-8 py-6 flex gap-4 justify-center bg-gray-50">
        <button onclick="closeReunionModal()" class="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition">
          <i class="fa-solid fa-xmark mr-2"></i> 关闭
        </button>
        <button onclick="navigateTo('detail', '${person.id}')" class="px-6 py-3 bg-reunion hover:bg-reunion-dark text-white rounded-lg font-semibold transition">
          <i class="fa-solid fa-circle-info mr-2"></i> 查看完整信息
        </button>
      </div>
    </div>
  `;

  modalEl.classList.remove('hidden');
  modalEl.classList.add('flex');
  modalEl.scrollTop = 0;
  document.body.style.overflow = 'hidden';
}

function closeReunionModal() {
  const modalEl = document.getElementById('reunion-modal');
  if (modalEl) {
    modalEl.classList.add('hidden');
    modalEl.classList.remove('flex');
  }
  document.body.style.overflow = '';
}

// 点击弹窗背景关闭
document.addEventListener('click', function(e) {
  const modalEl = document.getElementById('reunion-modal');
  if (modalEl && e.target.id === 'reunion-modal') {
    closeReunionModal();
  }
});

// ESC 键关闭
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    closeReunionModal();
    closeReuniteModal();
  }
});
