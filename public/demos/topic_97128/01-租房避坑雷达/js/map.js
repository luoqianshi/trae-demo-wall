/* ========================================
   踩坑地图脚本 - map.html 专属
   ======================================== */

/* 按区域筛选 */
function filterArea(area) {
  document.querySelectorAll('.filter-chip').forEach(chip => {
    chip.classList.toggle('active', chip.textContent === getAreaName(area));
  });
  document.querySelectorAll('.pit-card').forEach(card => {
    if (area === 'all') {
      card.style.display = 'block';
    } else {
      card.style.display = card.dataset.area === area ? 'block' : 'none';
    }
  });
}

/* 获取区域名称 */
function getAreaName(area) {
  const names = { all: '全部区域', haidian: '海淀', chaoyang: '朝阳', dongcheng: '东城', xicheng: '西城', fengtai: '丰台' };
  return names[area] || '全部区域';
}

/* 点赞切换 */
function toggleLike(el) {
  event.stopPropagation();
  el.classList.toggle('liked');
  const text = el.textContent;
  const num = parseInt(text.match(/\d+/)[0]);
  if (el.classList.contains('liked')) {
    el.textContent = '👍 ' + (num + 1);
  } else {
    el.textContent = '👍 ' + (num - 1);
  }
}

/* 打开弹窗 */
function openModal() {
  document.getElementById('modalOverlay').classList.add('show');
}

/* 关闭弹窗 */
function closeModal() {
  document.getElementById('modalOverlay').classList.remove('show');
  document.getElementById('pitLocation').value = '';
  document.getElementById('pitDesc').value = '';
}

/* 保存踩坑记录 */
function savePitItem() {
  const area = document.getElementById('pitArea').value;
  const location = document.getElementById('pitLocation').value.trim();
  const tag = document.getElementById('pitTag').value;
  const desc = document.getElementById('pitDesc').value.trim();
  if (!location || !desc) { showToast('请填写完整信息'); return; }
  const areaNames = { haidian: '海淀', chaoyang: '朝阳', dongcheng: '东城', xicheng: '西城', fengtai: '丰台' };
  const tagNames = { 'tag-danger': '踩坑', 'tag-warn': '注意', 'tag-safe': '已改善' };
  const items = JSON.parse(localStorage.getItem('customPitItems') || '[]');
  items.push({ area, location, tag, desc, areaName: areaNames[area], tagName: tagNames[tag], id: Date.now() });
  localStorage.setItem('customPitItems', JSON.stringify(items));
  closeModal();
  renderPitItems();
  showToast('踩坑经历已发布');
}

/* 渲染自定义踩坑记录 */
function renderPitItems() {
  const existing = document.getElementById('customPitItems');
  if (existing) existing.remove();
  const items = JSON.parse(localStorage.getItem('customPitItems') || '[]');
  if (items.length === 0) return;
  const container = document.createElement('div');
  container.id = 'customPitItems';
  container.innerHTML = '<div class="section-title">我的踩坑分享</div>';
  items.forEach(item => {
    const el = document.createElement('div');
    el.className = 'pit-card';
    el.dataset.area = item.area;
    el.innerHTML = '<div class="pit-header"><div class="pit-area">📍 ' + item.areaName + ' · ' + item.location + '</div><span class="pit-tag ' + item.tag + '">' + item.tagName + '</span></div><div class="pit-desc">' + item.desc + '</div><div class="pit-footer"><div class="pit-author">👤 我 · 刚刚</div><div class="pit-likes" onclick="toggleLike(this)">👍 0</div></div>';
    container.appendChild(el);
  });
  const btn = document.querySelector('.btn-primary');
  btn.parentNode.insertBefore(container, btn);
}

/* 初始化 */
document.addEventListener('DOMContentLoaded', () => {
  checkLogin();
  bindRipple('.btn-primary, .filter-chip, .tab-item, .nav-back, .pit-card, .map-pin');
  renderPitItems();
  document.getElementById('modalOverlay').addEventListener('click', function(e) { if (e.target === this) closeModal(); });
});
