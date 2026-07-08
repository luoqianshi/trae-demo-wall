// ========== 寻亲信息详情页模块 ==========

function renderDetailPage(personId) {
  const container = document.getElementById('detail-container');
  if (!container) return;

  const person = getPersonById(personId);
  if (!person) {
    container.innerHTML = `
      <div class="text-center py-16">
        <div class="text-6xl text-gray-300 mb-4"><i class="fa-solid fa-triangle-exclamation"></i></div>
        <h2 class="text-2xl font-bold text-gray-700 mb-2">未找到该寻亲信息</h2>
        <p class="text-gray-500 mb-6">信息可能已被删除</p>
        <button onclick="navigateTo('home')" class="bg-reunion hover:bg-reunion-dark text-white px-6 py-3 rounded-lg font-semibold transition">
          <i class="fa-solid fa-house mr-2"></i>返回首页
        </button>
      </div>
    `;
    return;
  }

  const isReunited = person.status === 'reunited';

  container.innerHTML = `
    <!-- 状态横幅 -->
    ${isReunited
      ? `<div class="detail-status-banner" style="background: linear-gradient(to right, #dcfce7, #bbf7d0); color: #166534; padding: 16px 24px; border-radius: 12px; margin-bottom: 24px; display: flex; align-items: center; gap: 12px;">
        <i class="fa-solid fa-house-heart text-4xl"></i>
        <div>
          <h2 class="text-xl font-bold">太好了！${person.name} 已与家人团聚</h2>
          <p class="text-sm opacity-90">失踪 ${person.reunion.missingDuration} 天后，于 ${person.reunion.date} 在 ${person.reunion.location} 团聚</p>
        </div>
      </div>`
      : `<div class="detail-status-banner" style="background: linear-gradient(to right, #fee2e2, #fecaca); color: #991b1b; padding: 16px 24px; border-radius: 12px; margin-bottom: 24px; display: flex; align-items: center; gap: 12px;">
        <i class="fa-solid fa-person-circle-question text-4xl"></i>
        <div>
          <h2 class="text-xl font-bold">正在寻找 ${person.name}</h2>
          <p class="text-sm opacity-90">失踪日期：${person.missingDate} · 请帮助提供线索</p>
        </div>
      </div>`
    }

    <!-- 主内容区 -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      <!-- 左侧：照片轮播 -->
      <div class="lg:col-span-1">
        <div class="bg-white rounded-xl shadow-lg overflow-hidden">
          <div class="relative">
            ${person.photos.length > 1
              ? `<div class="absolute top-3 right-3 bg-black/50 text-white text-xs px-2 py-1 rounded-full z-10">1 / ${person.photos.length}</div>`
              : ''
            }
            <img id="main-photo" src="${person.photos[0] || ''}" alt="${person.name}" class="w-full h-80 object-cover" />
          </div>
          ${person.photos.length > 1
            ? `<div class="flex gap-2 p-3 overflow-x-auto">
                ${person.photos.map((photo, i) => `
                  <img src="${photo}" alt="${person.name} ${i+1}" class="w-16 h-16 object-cover rounded cursor-pointer border-2 ${i === 0 ? 'border-reunion' : 'border-transparent hover:border-gray-300'}" onclick="swapPhoto('${photo}')" />
                `).join('')}
              </div>`
            : ''
          }
        </div>

        <!-- 操作按钮 -->
        <div class="mt-6 space-y-3">
          ${!isReunited
            ? `<button onclick="openReuniteForm('${person.id}')" class="w-full bg-reunion hover:bg-reunion-dark text-white font-bold py-3 px-6 rounded-lg transition shadow-lg">
                <i class="fa-solid fa-heart mr-2"></i>标记为"已团聚"
              </button>`
            : `<div class="bg-green-50 border border-reunion rounded-lg p-4 text-center">
                <i class="fa-solid fa-circle-check text-reunion text-2xl mb-2"></i>
                <p class="text-reunion-dark font-semibold">已团聚 · 感谢所有帮助的人</p>
              </div>`
          }
          <button onclick="toggleFavorite('${person.id}')" class="w-full border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold py-3 px-6 rounded-lg transition">
            <i class="fa-${isFavoriteStored(person.id) ? 'solid' : 'regular'} fa-heart mr-2 ${isFavoriteStored(person.id) ? 'text-red-500' : ''}"></i>
            ${isFavoriteStored(person.id) ? '已收藏' : '收藏'}
          </button>
          <button onclick="copyContact('${person.contactPhone}')" class="w-full border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold py-3 px-6 rounded-lg transition">
            <i class="fa-solid fa-copy mr-2"></i>复制联系方式
          </button>
        </div>
      </div>

      <!-- 右侧：基本信息 -->
      <div class="lg:col-span-2">
        <div class="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h3 class="text-lg font-bold text-gray-800 mb-4">
            <i class="fa-solid fa-user text-reunion mr-2"></i>基本信息
          </h3>
          <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <div class="text-xs text-gray-500 mb-1">姓名</div>
              <div class="font-semibold text-gray-800">${person.name}</div>
            </div>
            <div>
              <div class="text-xs text-gray-500 mb-1">性别</div>
              <div class="font-semibold text-gray-800">${person.gender || '-'}</div>
            </div>
            <div>
              <div class="text-xs text-gray-500 mb-1">出生日期</div>
              <div class="font-semibold text-gray-800">${person.birthDate || '-'}</div>
            </div>
            <div>
              <div class="text-xs text-gray-500 mb-1">失踪日期</div>
              <div class="font-semibold text-missing">${person.missingDate}</div>
            </div>
            <div>
              <div class="text-xs text-gray-500 mb-1">失踪地点</div>
              <div class="font-semibold text-gray-800">${person.missingLocation}</div>
            </div>
            <div>
              <div class="text-xs text-gray-500 mb-1">状态</div>
              <div>
                <span class="inline-block text-xs font-semibold px-2 py-1 rounded-full ${isReunited ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}">
                  ${isReunited ? '已团聚' : '寻找中'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- 详细描述 -->
        <div class="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h3 class="text-lg font-bold text-gray-800 mb-4">
            <i class="fa-solid fa-file-lines text-reunion mr-2"></i>详细描述
          </h3>
          <p class="text-gray-700 leading-relaxed whitespace-pre-wrap">${person.description}</p>
          ${person.features
            ? `<div class="mt-4 p-4 bg-yellow-50 border-l-4 border-warm-gold rounded">
                <div class="text-sm font-semibold text-warm-gold mb-1"><i class="fa-solid fa-eye mr-2"></i>外貌特征</div>
                <div class="text-gray-700">${person.features}</div>
              </div>`
            : ''
          }
        </div>

        <!-- 联系方式 -->
        <div class="bg-white rounded-xl shadow-lg p-6">
          <h3 class="text-lg font-bold text-gray-800 mb-4">
            <i class="fa-solid fa-address-card text-reunion mr-2"></i>联系方式
          </h3>
          <div class="space-y-3">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <i class="fa-solid fa-user text-blue-600"></i>
              </div>
              <div>
                <div class="text-xs text-gray-500">联系人</div>
                <div class="font-semibold text-gray-800">${person.contactName}</div>
              </div>
            </div>
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <i class="fa-solid fa-phone text-green-600"></i>
              </div>
              <div>
                <div class="text-xs text-gray-500">联系电话</div>
                <div class="font-semibold text-gray-800">${maskPhone(person.contactPhone)}
                  <button onclick="copyContact('${person.contactPhone}')" class="text-xs text-blue-600 ml-2 hover:underline">
                    <i class="fa-solid fa-copy"></i> 复制
                  </button>
                </div>
              </div>
            </div>
            ${person.contactEmail ? `
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                  <i class="fa-solid fa-envelope text-purple-600"></i>
                </div>
                <div>
                  <div class="text-xs text-gray-500">电子邮箱</div>
                  <div class="font-semibold text-gray-800">${maskEmail(person.contactEmail)}</div>
                </div>
              </div>
            ` : ''}
          </div>
        </div>
      </div>
    </div>

    <!-- 团聚故事区块（仅已团聚显示） -->
    ${isReunited && person.reunion ? `
      <div class="bg-gradient-to-br from-green-50 to-white rounded-xl shadow-lg p-6 mb-8 border-2 border-reunion">
        <div class="flex items-center mb-6">
          <div class="w-14 h-14 bg-reunion text-white rounded-full flex items-center justify-center mr-4">
            <i class="fa-solid fa-house-heart text-2xl"></i>
          </div>
          <div>
            <h3 class="text-2xl font-bold text-reunion-dark">团聚故事</h3>
            <p class="text-gray-600">失踪 ${person.reunion.missingDuration} 天后，${person.name} 终于回家了</p>
          </div>
        </div>

        ${person.reunion.reunitedPhotos && person.reunion.reunitedPhotos.length > 0 ? `
          <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            ${person.reunion.reunitedPhotos.map(photo => `
              <img src="${photo}" alt="团聚照片" class="w-full h-40 object-cover rounded-lg" />
            `).join('')}
          </div>
        ` : ''}

        <div class="bg-white rounded-lg p-6 mb-4">
          <h4 class="font-semibold text-gray-800 mb-3">
            <i class="fa-solid fa-book-open text-reunion mr-2"></i>团聚经过
          </h4>
          <p class="text-gray-700 leading-relaxed">${person.reunion.story}</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div class="bg-white rounded-lg p-4">
            <div class="text-sm text-gray-500 mb-1"><i class="fa-solid fa-flag-checkered text-reunion mr-2"></i>团聚地点</div>
            <div class="font-semibold text-gray-800">${person.reunion.location}</div>
          </div>
          <div class="bg-white rounded-lg p-4">
            <div class="text-sm text-gray-500 mb-1"><i class="fa-solid fa-calendar-check text-reunion mr-2"></i>团聚日期</div>
            <div class="font-semibold text-gray-800">${person.reunion.date}</div>
          </div>
        </div>

        ${person.reunion.familyMessage ? `
          <div class="bg-gradient-to-r from-yellow-50 to-white border-l-4 border-warm-gold p-4 rounded-lg">
            <div class="text-sm font-semibold text-warm-gold mb-2">
              <i class="fa-solid fa-quote-left mr-2"></i>家庭留言
            </div>
            <p class="text-gray-700 italic">"${person.reunion.familyMessage}"</p>
          </div>
        ` : ''}

        ${person.reunion.keyCommentId ? `
          <div class="mt-4 bg-blue-50 rounded-lg p-4">
            <div class="text-sm font-semibold text-blue-700 mb-2">
              <i class="fa-solid fa-lightbulb mr-2"></i>关键线索
            </div>
            <p class="text-gray-700 italic">${getCommentContent(person, person.reunion.keyCommentId)}</p>
          </div>
        ` : ''}
      </div>
    ` : ''}

    <!-- 评论与线索区 -->
    <div class="bg-white rounded-xl shadow-lg p-6">
      <h3 class="text-lg font-bold text-gray-800 mb-6">
        <i class="fa-solid fa-comments text-reunion mr-2"></i>留言与线索
        <span class="text-sm text-gray-500 font-normal ml-2">(${ (person.comments || []).length } 条)</span>
      </h3>

      <!-- 发表评论 -->
      <div class="bg-gray-50 rounded-lg p-4 mb-6">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
          <input type="text" id="comment-nickname" placeholder="您的昵称" class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-reunion focus:border-transparent" />
          <select id="comment-type" class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-reunion focus:border-transparent">
            <option value="normal">普通留言</option>
            <option value="clue">疑似线索</option>
            <option value="confirm">确认线索</option>
          </select>
        </div>
        <textarea id="comment-content" rows="3" placeholder="请输入您的留言或线索信息..." class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-reunion focus:border-transparent mb-3"></textarea>
        <button onclick="submitComment('${person.id}')" class="bg-reunion hover:bg-reunion-dark text-white font-semibold px-6 py-2 rounded-lg transition">
          <i class="fa-solid fa-paper-plane mr-2"></i>发表留言
        </button>
      </div>

      <!-- 评论列表 -->
      <div id="comments-list" class="space-y-4">
        ${renderCommentsList(person.comments || [], person.reunion && person.reunion.keyCommentId)}
      </div>
    </div>
  `;
}

function renderCommentsList(comments, keyCommentId) {
  if (comments.length === 0) {
    return `
      <div class="text-center py-8 text-gray-400">
        <i class="fa-solid fa-comment-slash text-4xl mb-3"></i>
        <p>暂无留言，成为第一个留言的人吧</p>
      </div>
    `;
  }

  const sorted = [...comments].sort((a, b) => b.createdAt - a.createdAt);

  return sorted.map(comment => {
    const isKey = keyCommentId === comment.id;
    const typeStyles = {
      normal: { bg: 'bg-gray-100', label: '留言', icon: 'fa-comment' },
      clue: { bg: 'bg-yellow-100', label: '疑似线索', icon: 'fa-lightbulb' },
      confirm: { bg: 'bg-green-100', label: '确认线索', icon: 'fa-circle-check' }
    };
    const style = typeStyles[comment.type] || typeStyles.normal;

    return `
      <div class="p-4 rounded-lg ${isKey ? 'bg-blue-50 border-2 border-blue-300' : 'bg-gray-50'}">
        ${isKey ? '<div class="inline-block text-xs font-bold text-blue-700 bg-blue-200 px-2 py-1 rounded-full mb-2"><i class="fa-solid fa-star mr-1"></i>关键线索</div>' : ''}
        <div class="flex items-center justify-between mb-2">
          <div class="flex items-center gap-2">
            <span class="font-semibold text-gray-800">${escapeHtml(comment.nickname)}</span>
            <span class="inline-block text-xs px-2 py-0.5 rounded-full ${style.bg} text-gray-700">
              <i class="fa-solid ${style.icon} mr-1"></i>${style.label}
            </span>
          </div>
          <span class="text-xs text-gray-500">${formatRelativeTime(comment.createdAt)}</span>
        </div>
        <p class="text-gray-700 leading-relaxed">${escapeHtml(comment.content)}</p>
      </div>
    `;
  }).join('');
}

function submitComment(personId) {
  const nickname = document.getElementById('comment-nickname').value.trim() || '匿名用户';
  const content = document.getElementById('comment-content').value.trim();
  const type = document.getElementById('comment-type').value;

  if (!content) {
    showToast('请输入留言内容', 'error');
    return;
  }

  const person = getPersonById(personId);
  if (!person) return;

  const comment = {
    id: generateUUID(),
    nickname: nickname,
    content: content,
    type: type,
    createdAt: Date.now()
  };

  if (!person.comments) person.comments = [];
  person.comments.unshift(comment);

  updatePerson(personId, { comments: person.comments });

  document.getElementById('comment-content').value = '';
  document.getElementById('comment-nickname').value = '';

  showToast('留言发布成功！', 'success');

  // 重新渲染评论列表
  renderDetailPage(personId);
}

function swapPhoto(src) {
  const mainPhoto = document.getElementById('main-photo');
  if (mainPhoto) {
    mainPhoto.src = src;
  }
}

function copyContact(text) {
  const textarea = document.createElement('textarea');
  textarea.value = text;
  document.body.appendChild(textarea);
  textarea.select();
  try {
    document.execCommand('copy');
    showToast('已复制到剪贴板', 'success');
  } catch (e) {
    showToast('复制失败，请手动复制', 'error');
  }
  document.body.removeChild(textarea);
}

function getCommentContent(person, commentId) {
  const comment = (person.comments || []).find(c => c.id === commentId);
  return comment ? `${comment.nickname}: ${comment.content}` : '';
}

function isFavoriteStored(personId) {
  try {
    const favs = JSON.parse(localStorage.getItem('missing_persons_favorites_v1') || '[]');
    return favs.includes(personId);
  } catch (e) {
    return false;
  }
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
