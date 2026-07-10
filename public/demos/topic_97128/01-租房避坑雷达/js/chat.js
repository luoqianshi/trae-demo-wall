/* ========================================
   话术页脚本 - chat.html 专属
   ======================================== */

/* 复制话术内容 */
function copyText(btn) {
  const bubble = btn.parentElement;
  const content = bubble.querySelector('.chat-content').textContent;
  navigator.clipboard.writeText(content).then(() => {
    showToast('已复制到剪贴板');
  }).catch(() => {
    showToast('复制失败');
  });
}

/* 分类筛选 */
function filterCategory(category) {
  document.querySelectorAll('.category-tab').forEach(tab => {
    tab.classList.toggle('active', tab.textContent === (category === 'all' ? '全部' : getCategoryName(category)));
  });

  document.querySelectorAll('.chat-bubble').forEach(bubble => {
    if (category === 'all') {
      bubble.style.display = 'block';
    } else {
      bubble.style.display = bubble.dataset.category === category ? 'block' : 'none';
    }
  });
}

/* 获取分类名称 */
function getCategoryName(category) {
  const names = { price: '砍价', repair: '维修', contract: '合同', deposit: '押金' };
  return names[category] || '全部';
}

/* 打开弹窗 */
function openModal() {
  document.getElementById('modalOverlay').classList.add('show');
}

/* 关闭弹窗 */
function closeModal() {
  document.getElementById('modalOverlay').classList.remove('show');
  document.getElementById('chatTitle').value = '';
  document.getElementById('chatContent').value = '';
}

/* 保存话术 */
function saveChatItem() {
  const title = document.getElementById('chatTitle').value.trim();
  const content = document.getElementById('chatContent').value.trim();
  const category = document.getElementById('chatCategory').value;
  if (!title || !content) { showToast('请填写完整信息'); return; }
  const catNames = { price: '砍价', repair: '维修', contract: '合同', deposit: '押金' };
  const items = JSON.parse(localStorage.getItem('customChatItems') || '[]');
  items.push({ title, content, category, catName: catNames[category], id: Date.now() });
  localStorage.setItem('customChatItems', JSON.stringify(items));
  closeModal();
  renderChatItems();
  showToast('话术已添加');
}

/* 渲染自定义话术 */
function renderChatItems() {
  const existing = document.getElementById('customChatItems');
  if (existing) existing.remove();
  const items = JSON.parse(localStorage.getItem('customChatItems') || '[]');
  if (items.length === 0) return;
  const container = document.createElement('div');
  container.id = 'customChatItems';
  container.innerHTML = '<div class="section-title">我的话术</div>';
  items.forEach(item => {
    const el = document.createElement('div');
    el.className = 'chat-bubble';
    el.dataset.category = item.category;
    el.innerHTML = '<button class="btn-copy" onclick="copyText(this)">📋</button><div class="chat-title">' + item.title + '</div><div class="chat-content">' + item.content + '</div><div class="chat-tags"><span class="chat-tag">' + item.catName + '</span><span class="chat-tag">自定义</span></div>';
    container.appendChild(el);
  });
  const btn = document.querySelector('.btn-primary');
  btn.parentNode.insertBefore(container, btn);
}

/* 初始化 */
document.addEventListener('DOMContentLoaded', () => {
  checkLogin();
  bindRipple('.btn-primary, .btn-copy, .category-tab, .tab-item, .nav-back, .fab-btn, .modal-btn');
  renderChatItems();
  document.getElementById('modalOverlay').addEventListener('click', function(e) { if (e.target === this) closeModal(); });
});
