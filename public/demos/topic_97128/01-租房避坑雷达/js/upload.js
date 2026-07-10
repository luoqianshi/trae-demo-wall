/* ========================================
   上传照片页 - 页面专属脚本
   ======================================== */

/* 切换照片选中状态 */
function togglePhoto(el) {
  el.classList.toggle('has-photo');
  const label = el.querySelector('.photo-label');
  if (el.classList.contains('has-photo')) {
    label.textContent = label.textContent.replace(/(.*?)( ✓)?$/, '$1 ✓');
  } else {
    label.textContent = label.textContent.replace(/(.*?) ✓$/, '$1');
  }
}

/* ==== 真实拍照上传 ==== */
let currentCell = null;
const photoData = {};

function uploadPhoto(cell) {
  if (cell.classList.contains('has-photo')) return;
  currentCell = cell;
  const fileInput = document.getElementById('fileInput');
  fileInput.value = '';
  fileInput.click();
}

function onFileSelected(event) {
  const file = event.target.files[0];
  if (!file || !currentCell) return;
  const reader = new FileReader();
  reader.onload = function(e) {
    const cellId = currentCell.dataset.area + '_' + currentCell.dataset.item;
    photoData[cellId] = e.target.result;
    currentCell.style.backgroundImage = 'url(' + e.target.result + ')';
    currentCell.classList.add('has-photo');
    showToast(currentCell.dataset.area + '·' + currentCell.dataset.item + ' 已上传');
    currentCell = null;
  };
  reader.readAsDataURL(file);
}

function deletePhoto(event, deleteBtn) {
  event.stopPropagation();
  const cell = deleteBtn.parentElement;
  const cellId = cell.dataset.area + '_' + cell.dataset.item;
  delete photoData[cellId];
  cell.style.backgroundImage = '';
  cell.classList.remove('has-photo');
  showToast('已删除照片');
}

/* ==== AI 分析 ==== */
function startAnalysis(e) {
  if (e) createRipple(e);
  const selected = document.querySelectorAll('.photo-cell.has-photo');
  if (selected.length === 0) {
    showToast('请至少选择一个房间区域');
    return;
  }

  const frame = document.querySelector('.app-frame');
  frame.innerHTML = `
    <div class="status-bar"><span>9:41</span><span>5G 🔋</span></div>
    <div class="nav-bar"><span class="nav-back" onclick="goPage('upload.html')">←</span><span class="nav-title">AI分析中</span></div>
    <div class="scan-status">
      <div class="scan-icon">🔍</div>
      <div>正在分析房间照片...</div>
      <div class="scan-progress"><div class="progress-fill"></div></div>
      <div style="font-size:0.8rem">已分析 ${selected.length} 个区域</div>
    </div>
    <div class="photo-grid scanning">
      ${Array.from(selected).map(el => el.outerHTML).join('')}
      <div class="scan-line"></div>
    </div>
  `;

  const fill = document.querySelector('.progress-fill');
  let progress = 0;
  const interval = setInterval(() => {
    progress += Math.random() * 15;
    if (progress >= 100) {
      progress = 100;
      clearInterval(interval);
      setTimeout(() => {
        window.location.href = 'report.html';
      }, 500);
    }
    fill.style.width = progress + '%';
  }, 300);
}

/* ==== 拍照备注弹窗 ==== */
function openModal() {
  document.getElementById('modalOverlay').classList.add('show');
}
function closeModal() {
  document.getElementById('modalOverlay').classList.remove('show');
  document.getElementById('noteDesc').value = '';
}
function saveNote() {
  const area = document.getElementById('noteArea').value;
  const desc = document.getElementById('noteDesc').value.trim();
  if (!desc) { showToast('请输入备注内容'); return; }
  const notes = JSON.parse(localStorage.getItem('customPhotoNotes') || '[]');
  notes.push({ area, desc, id: Date.now() });
  localStorage.setItem('customPhotoNotes', JSON.stringify(notes));
  closeModal();
  renderNotes();
  showToast('备注已添加');
}
function renderNotes() {
  const existing = document.getElementById('customNotes');
  if (existing) existing.remove();
  const notes = JSON.parse(localStorage.getItem('customPhotoNotes') || '[]');
  if (notes.length === 0) return;
  const container = document.createElement('div');
  container.id = 'customNotes';
  container.innerHTML = '<div class="section-title">我的拍照备注</div>';
  notes.forEach(note => {
    const el = document.createElement('div');
    el.className = 'note-item';
    el.innerHTML = '<div class="note-area">📍 ' + note.area + '</div><div class="note-desc">' + note.desc + '</div>';
    container.appendChild(el);
  });
  const btn = document.querySelector('.btn-primary');
  btn.parentNode.insertBefore(container, btn);
}

/* ==== 初始化 ==== */
document.addEventListener('DOMContentLoaded', () => {
  checkLogin();

  renderNotes();
  document.getElementById('modalOverlay').addEventListener('click', function(e) { if (e.target === this) closeModal(); });
  document.getElementById('fileInput').addEventListener('change', onFileSelected);

  bindRipple('.photo-cell, .btn-primary, .btn-secondary, .tab-item, .nav-back, .fab-btn');
});
