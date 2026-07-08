// ========== localStorage 数据存取封装 ==========

const STORAGE_KEY = 'missing_persons_data_v1';
const FAVORITES_KEY = 'missing_persons_favorites_v1';
const DATA_VERSION_KEY = 'missing_persons_version_v1';
const DATA_VERSION = '1.1';

/**
 * 生成 UUID
 */
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * 获取所有寻亲信息
 */
function getAllPersons() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error('读取数据失败:', e);
    return [];
  }
}

/**
 * 保存所有寻亲信息
 */
function saveAllPersons(persons) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(persons));
    return true;
  } catch (e) {
    console.error('保存数据失败:', e);
    showToast('存储空间不足，请导出数据后清理', 'error');
    return false;
  }
}

/**
 * 获取单条寻亲信息
 */
function getPersonById(id) {
  const persons = getAllPersons();
  return persons.find(p => p.id === id);
}

/**
 * 添加新的寻亲信息
 */
function addPerson(person) {
  const persons = getAllPersons();
  const newPerson = {
    id: generateUUID(),
    ...person,
    status: person.status || 'missing',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    comments: person.comments || []
  };
  persons.unshift(newPerson);
  saveAllPersons(persons);
  return newPerson;
}

/**
 * 更新寻亲信息
 */
function updatePerson(id, updates) {
  const persons = getAllPersons();
  const index = persons.findIndex(p => p.id === id);
  if (index === -1) return null;
  persons[index] = {
    ...persons[index],
    ...updates,
    updatedAt: Date.now()
  };
  saveAllPersons(persons);
  return persons[index];
}

/**
 * 删除寻亲信息
 */
function deletePerson(id) {
  const persons = getAllPersons();
  const filtered = persons.filter(p => p.id !== id);
  saveAllPersons(filtered);
  return filtered.length !== persons.length;
}

/**
 * 添加评论
 */
function addComment(personId, nickname, content, type = 'normal') {
  const persons = getAllPersons();
  const person = persons.find(p => p.id === personId);
  if (!person) return null;
  if (!person.comments) person.comments = [];
  const comment = {
    id: generateUUID(),
    nickname: nickname || '匿名用户',
    content,
    type,
    createdAt: Date.now()
  };
  person.comments.unshift(comment);
  person.updatedAt = Date.now();
  saveAllPersons(persons);
  return comment;
}

/**
 * 标记为已团聚
 */
function markAsReunited(personId, reunionData) {
  const person = getPersonById(personId);
  if (!person) return null;
  return updatePerson(personId, {
    status: 'reunited',
    reunion: {
      date: reunionData.date,
      location: reunionData.location,
      latitude: reunionData.latitude,
      longitude: reunionData.longitude,
      reunitedPhotos: reunionData.reunitedPhotos || [],
      story: reunionData.story,
      missingDuration: reunionData.missingDuration || calculateMissingDays(person.missingDate, reunionData.date),
      keyCommentId: reunionData.keyCommentId || null,
      familyMessage: reunionData.familyMessage || ''
    }
  });
}

/**
 * 计算失踪天数
 */
function calculateMissingDays(missingDateStr, reunionDateStr) {
  const missingDate = new Date(missingDateStr);
  const reunionDate = reunionDateStr ? new Date(reunionDateStr) : new Date();
  const diff = Math.abs(reunionDate - missingDate);
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

/**
 * 获取收藏列表
 */
function getFavorites() {
  try {
    const data = localStorage.getItem(FAVORITES_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
}

/**
 * 添加/移除收藏
 */
function toggleFavorite(personId) {
  const favs = getFavorites();
  const index = favs.indexOf(personId);
  if (index === -1) {
    favs.push(personId);
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favs));
    return true; // 已添加收藏
  } else {
    favs.splice(index, 1);
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favs));
    return false; // 已移除收藏
  }
}

/**
 * 检查是否已收藏
 */
function isFavorite(personId) {
  return getFavorites().includes(personId);
}

/**
 * 获取统计数据
 */
function getStats() {
  const persons = getAllPersons();
  const total = persons.length;
  const reunited = persons.filter(p => p.status === 'reunited').length;
  const missing = total - reunited;
  const now = new Date();
  const thisMonth = persons.filter(p => {
    const d = new Date(p.createdAt);
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  }).length;
  let commentCount = 0;
  persons.forEach(p => {
    if (p.comments) commentCount += p.comments.length;
  });
  return { total, reunited, missing, thisMonth, comments: commentCount };
}

/**
 * 获取存储大小
 */
function getStorageSize() {
  let total = 0;
  for (let key in localStorage) {
    if (localStorage.hasOwnProperty(key)) {
      total += (localStorage[key].length + key.length) * 2; // UTF-16 每字符2字节
    }
  }
  return total; // 字节
}

/**
 * 导出数据
 */
function exportData() {
  const data = {
    persons: getAllPersons(),
    favorites: getFavorites(),
    exportedAt: new Date().toISOString(),
    version: '1.0'
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `宝贝回家数据_${formatDate(new Date())}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast('数据导出成功', 'success');
}

/**
 * 导入数据
 */
function importData(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const data = JSON.parse(e.target.result);
      if (!data.persons || !Array.isArray(data.persons)) {
        showToast('数据格式不正确', 'error');
        return;
      }
      const existing = getAllPersons();
      const existingIds = new Set(existing.map(p => p.id));
      // 合并，跳过已存在的
      let added = 0;
      data.persons.forEach(p => {
        if (!existingIds.has(p.id)) {
          existing.unshift(p);
          added++;
        }
      });
      saveAllPersons(existing);
      // 合并收藏
      if (data.favorites && Array.isArray(data.favorites)) {
        const existingFavs = getFavorites();
        const favSet = new Set([...existingFavs, ...data.favorites]);
        localStorage.setItem(FAVORITES_KEY, JSON.stringify([...favSet]));
      }
      showToast(`导入成功！新增 ${added} 条信息`, 'success');
      setTimeout(() => location.reload(), 1000);
    } catch (e) {
      showToast('文件解析失败: ' + e.message, 'error');
    }
  };
  reader.readAsText(file);
}

/**
 * 清空所有数据
 */
function clearAllData() {
  if (!confirm('确定要清空所有数据吗？此操作不可恢复！')) return;
  if (!confirm('再次确认：真的要删除所有寻亲信息吗？')) return;
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(FAVORITES_KEY);
  showToast('数据已清空', 'success');
  setTimeout(() => location.reload(), 800);
}

/**
 * 加载示例数据
 */
function loadMockDataToStorage() {
  const existing = getAllPersons();
  if (existing.length > 0) {
    if (!confirm('当前已有数据，确定要追加加载示例数据吗？')) return;
  }
  const mockData = getMockData();
  const existingIds = new Set(existing.map(p => p.id));
  mockData.forEach(p => {
    if (!existingIds.has(p.id)) {
      existing.unshift(p);
    }
  });
  saveAllPersons(existing);
  showToast(`已加载 ${mockData.length} 条示例数据`, 'success');
  setTimeout(() => location.reload(), 800);
}

/**
 * 显示 Toast 提示
 */
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) {
    alert(message);
    return;
  }
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  const icon = type === 'success' ? 'fa-circle-check' : type === 'error' ? 'fa-circle-xmark' : 'fa-circle-info';
  toast.innerHTML = `
    <i class="fa-solid ${icon} toast-icon"></i>
    <span class="toast-message">${message}</span>
  `;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

/**
 * 格式化日期
 */
function formatDate(date) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * 格式化相对时间
 */
function formatRelativeTime(date) {
  const now = new Date();
  const d = new Date(date);
  const diff = now - d;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  if (days < 30) return `${days}天前`;
  return formatDate(d);
}

/**
 * 脱敏手机号
 */
function maskPhone(phone) {
  if (!phone) return '';
  if (phone.length <= 7) return phone;
  return phone.substring(0, 3) + '****' + phone.substring(phone.length - 4);
}

/**
 * 脱敏邮箱
 */
function maskEmail(email) {
  if (!email) return '';
  const parts = email.split('@');
  if (parts.length !== 2) return email;
  const name = parts[0];
  if (name.length <= 2) return name + '***@' + parts[1];
  return name.substring(0, 2) + '***@' + parts[1];
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
