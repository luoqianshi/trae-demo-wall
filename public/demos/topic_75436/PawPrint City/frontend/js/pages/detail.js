// 爪印城市 - 场所详情页
Router.register('detail', (params) => {
  return `
    <div class="detail-page">
      <div class="nav-header" style="display:flex;align-items:center;gap:8px;">
        <span class="back-btn" onclick="Router.back()">← 返回</span>
        <span class="page-title" style="flex:1;text-align:left;">场所详情</span>
      </div>
      <div class="carousel-container" id="detail-carousel"></div>
      <div id="detail-content">
        <div style="text-align:center;padding:40px;color:var(--text-light);">加载中...</div>
      </div>
      <div class="detail-actions" id="detail-actions" style="display:none;">
        <div class="action-btn" onclick="navigateToPlace()">
          <span class="action-icon">🧭</span>
          <span>导航前往</span>
        </div>
        <div class="action-btn" id="fav-btn" onclick="toggleFavorite()">
          <span class="action-icon">🤍</span>
          <span>收藏</span>
        </div>
        <div class="action-btn" onclick="sharePlace()">
          <span class="action-icon">📤</span>
          <span>分享</span>
        </div>
      </div>
    </div>
  `;
});

async function init_detail(params) {
  const id = params.id;
  if (!id) return;

  // 保存浏览历史
  saveBrowseHistory(parseInt(id));

  const res = await api.getPlaceDetail(id);
  const place = res.data;
  if (!place) {
    document.getElementById('detail-content').innerHTML = '<div style="text-align:center;padding:40px;">场所不存在</div>';
    return;
  }

  // 初始化轮播
  Carousel.init('detail-carousel', place.images || ['default']);

  // 类型标签颜色
  const typeClass = { '餐饮': 'tag-dining', '住宿': 'tag-hotel', '公共空间': 'tag-park', '商业': 'tag-shop' };

  // 设施标签
  const facilityTags = place.petPolicy.facilities.map(f =>
    `<span class="tag tag-facility">${f}</span>`
  ).join('');

  // 宠物类型标签
  const petTypeTags = place.petPolicy.petTypes.map(t =>
    `<span class="policy-tag">${t === '犬类' ? '🐕' : '🐱'} ${t}</span>`
  ).join('');

  // 体型标签
  const sizeTags = place.petPolicy.sizeLimit.map(s =>
    `<span class="policy-tag">📏 ${s}犬</span>`
  ).join('');

  // 验证记录
  const verifies = (place.verifies || []).slice(0, 3).map(v => `
    <div class="verify-item">
      <div class="verify-user">
        <span>${v.avatar}</span>
        <span>${v.user}</span>
      </div>
      <div class="verify-content">${v.content}</div>
      <div class="verify-time">${v.time}</div>
    </div>
  `).join('');

  // 计算宠物友好指数（满分100）
  const petIndex = calculatePetFriendlyIndex(place);
  const indexLevel = petIndex >= 80 ? '超友好' : petIndex >= 60 ? '很友好' : petIndex >= 40 ? '较友好' : '一般';

  // 构建详情HTML
  document.getElementById('detail-content').innerHTML = `
    <div class="detail-section">
      <div class="detail-name">${place.name}</div>
      <div class="detail-rating">★ ${place.rating} <span style="color:var(--text-light);font-weight:400;">(${place.reviewCount}条评价)</span></div>
      <span class="tag ${typeClass[place.type] || 'tag-dining'}">${place.type}</span>
    </div>
    <div class="detail-section">
      <div class="pet-index-card">
        <div class="pet-index-left">
          <div class="pet-index-value">${petIndex}</div>
          <div class="pet-index-label">宠物友好指数</div>
          <div class="pet-index-level">${indexLevel}</div>
        </div>
        <div class="pet-index-bars">
          <div class="pet-index-bar-item">
            <span>评分</span>
            <div class="pet-index-bar"><div class="pet-index-fill" style="width:${Math.min(100, place.rating * 20)}%"></div></div>
          </div>
          <div class="pet-index-bar-item">
            <span>设施</span>
            <div class="pet-index-bar"><div class="pet-index-fill" style="width:${Math.min(100, place.petPolicy.facilities.length * 25)}%"></div></div>
          </div>
          <div class="pet-index-bar-item">
            <span>验证</span>
            <div class="pet-index-bar"><div class="pet-index-fill" style="width:${Math.min(100, place.verifyCount * 2)}%"></div></div>
          </div>
        </div>
      </div>
    </div>
    <div class="detail-section">
      <div class="detail-info-row"><span class="info-icon">📍</span> ${place.address}</div>
      <div class="detail-info-row"><span class="info-icon">🕐</span> ${place.hours}</div>
      <div class="detail-info-row"><span class="info-icon">📞</span> ${place.phone}</div>
    </div>
    <div class="detail-section">
      <div style="font-size:15px;font-weight:600;margin-bottom:8px;">宠物友好政策</div>
      <div class="policy-card">
        <div class="allow-badge">✅ 允许宠物入内</div>
        <div class="policy-tags">${petTypeTags}${sizeTags}</div>
        <div class="requirements-text">📋 ${place.petPolicy.requirements || '无特殊要求'}</div>
        <div style="margin-top:8px;display:flex;flex-wrap:wrap;gap:6px;">${facilityTags}</div>
      </div>
    </div>
    <div class="detail-section">
      <div style="font-size:13px;color:var(--text-secondary);line-height:1.6;">${place.description || ''}</div>
    </div>
    <div class="detail-section verify-section">
      <div class="verify-badge">✅ ${place.verifyCount}位宠主实地验证</div>
      <div class="verify-actions">
        <button class="btn btn-primary btn-sm" onclick="openVerifyModal(${place.id})">✍️ 我要验证</button>
        <button class="btn btn-outline btn-sm" onclick="openReportModal(${place.id})">⚠️ 信息报错</button>
      </div>
      <div class="verify-list">${verifies || '<div style="color:var(--text-light);font-size:12px;">暂无验证记录</div>'}</div>
    </div>
    <!-- 评论评分区 -->
    <div class="detail-section comments-section">
      <div class="comments-header">
        <span class="comments-title">用户评价</span>
        <button class="btn btn-primary btn-sm" onclick="openCommentModal(${place.id})">✍️ 写评价</button>
      </div>
      <div id="comments-list">
        <div style="text-align:center;color:var(--text-light);padding:20px;font-size:12px;">加载中...</div>
      </div>
    </div>
  `;

  // 显示底部操作栏
  document.getElementById('detail-actions').style.display = 'flex';

  // 检查收藏状态
  checkFavStatus(place.id);

  // 加载评论
  loadComments(place.id);
}

// 检查收藏状态
async function checkFavStatus(placeId) {
  const res = await api.getFavorites();
  const favs = res.data || [];
  const isFav = favs.some(f => f.id === placeId);
  const favBtn = document.getElementById('fav-btn');
  if (favBtn) {
    if (isFav) {
      favBtn.classList.add('favorited');
      favBtn.querySelector('.action-icon').textContent = '🧡';
      favBtn.querySelector('span:last-child').textContent = '已收藏';
    }
  }
}

// 切换收藏
async function toggleFavorite() {
  const placeId = Router.currentParams.id;
  const favBtn = document.getElementById('fav-btn');
  const isFav = favBtn.classList.contains('favorited');

  const action = isFav ? 'remove' : 'add';
  const res = await api.toggleFavorite(parseInt(placeId), action);

  if (res.code === 200) {
    if (action === 'add') {
      favBtn.classList.add('favorited');
      favBtn.querySelector('.action-icon').textContent = '🧡';
      favBtn.querySelector('span:last-child').textContent = '已收藏';
    } else {
      favBtn.classList.remove('favorited');
      favBtn.querySelector('.action-icon').textContent = '🤍';
      favBtn.querySelector('span:last-child').textContent = '收藏';
    }
    showToast(res.msg);
  }
}

// 打开验证弹窗
function openVerifyModal(placeId) {
  Modal.show('实地验证', `
    <div class="form-group">
      <label>昵称 <span class="required">*</span></label>
      <input class="form-input" id="verify-user" placeholder="输入您的昵称" />
    </div>
    <div class="form-group">
      <label>验证内容 <span class="required">*</span></label>
      <textarea class="form-textarea" id="verify-content" placeholder="分享您的实地体验..."></textarea>
    </div>
    <button class="btn btn-primary btn-block mt-12" onclick="submitVerify(${placeId})">提交验证</button>
  `);
}

async function submitVerify(placeId) {
  const user = document.getElementById('verify-user').value.trim();
  const content = document.getElementById('verify-content').value.trim();
  if (!user || !content) {
    showToast('请填写完整信息');
    return;
  }
  const res = await api.verifyPlace(placeId, { user, content });
  if (res.code === 200) {
    Modal.close();
    showToast('验证提交成功！');
    setTimeout(() => Router.navigate('detail', { id: placeId }), 500);
  }
}

// 打开纠错弹窗
function openReportModal(placeId) {
  Modal.show('信息纠错', `
    <div class="form-group">
      <label>纠错字段</label>
      <select class="form-select" id="report-field">
        <option value="地址">地址信息</option>
        <option value="电话">联系电话</option>
        <option value="营业时间">营业时间</option>
        <option value="宠物政策">宠物政策</option>
        <option value="其他">其他</option>
      </select>
    </div>
    <div class="form-group">
      <label>昵称 <span class="required">*</span></label>
      <input class="form-input" id="report-user" placeholder="输入您的昵称" />
    </div>
    <div class="form-group">
      <label>纠错内容 <span class="required">*</span></label>
      <textarea class="form-textarea" id="report-content" placeholder="请描述需要纠正的信息..."></textarea>
    </div>
    <button class="btn btn-primary btn-block mt-12" onclick="submitReport(${placeId})">提交纠错</button>
  `);
}

async function submitReport(placeId) {
  const user = document.getElementById('report-user').value.trim();
  const content = document.getElementById('report-content').value.trim();
  const field = document.getElementById('report-field').value;
  if (!user || !content) {
    showToast('请填写完整信息');
    return;
  }
  const res = await api.reportPlace(placeId, { user, content, field });
  if (res.code === 200) {
    Modal.close();
    showToast('纠错申请已提交，感谢反馈！');
  }
}

function navigateToPlace() {
  const placeId = Router.currentParams.id;
  if (!placeId) return;

  api.getPlaceDetail(placeId).then(res => {
    const place = res.data;
    if (!place || !place.coordinate) {
      showToast('暂无该场所位置信息');
      return;
    }

    // 使用高德地图路线规划/导航
    if (MapManager.isAMap && MapManager.currentMap && window.AMap) {
      AMap.plugin('AMap.Driving', () => {
        const driving = new AMap.Driving({
          map: MapManager.currentMap.map,
          panel: 'driving-panel',
          policy: AMap.DrivingPolicy.LEAST_TIME
        });

        // 调用 Geolocation 获取当前位置
        const geolocation = new AMap.Geolocation({
          enableHighAccuracy: true,
          timeout: 10000
        });

        geolocation.getCurrentPosition((status, result) => {
          let startPoint;
          if (status === 'complete') {
            startPoint = [result.position.lng, result.position.lat];
          } else {
            // 默认从当前城市中心出发
            startPoint = window.APP_CONFIG.DEFAULT_CENTER[place.city || window.APP_CONFIG.DEFAULT_CITY];
          }

          const endPoint = place.location
            ? [place.location.lng, place.location.lat]
            : convertCoordinateToLngLat(place.coordinate, place.city || window.APP_CONFIG.DEFAULT_CITY);

          driving.search(startPoint, endPoint, (searchStatus, searchResult) => {
            if (searchStatus === 'complete') {
              showToast('路线规划成功');
            } else {
              showToast('路线规划失败，尝试外部导航');
              openExternalMap(place);
            }
          });
        });
      });
    } else {
      openExternalMap(place);
    }
  });
}

// 打开外部地图导航
function openExternalMap(place) {
  const address = encodeURIComponent(`${place.city || ''}${place.address}`);
  const name = encodeURIComponent(place.name);
  // 高德地图 web 导航
  const url = `https://uri.amap.com/navigation?to=${address}&mode=car&policy=1`;
  window.open(url, '_blank');
}

// 坐标转换辅助函数
function convertCoordinateToLngLat(coordinate, city) {
  const centers = window.APP_CONFIG.DEFAULT_CENTER;
  const center = centers[city] || centers['北京'];
  const offsetLng = 0.08;
  const offsetLat = 0.04;
  const lng = center[0] - offsetLng / 2 + (coordinate.x / 1200) * offsetLng;
  const lat = center[1] + offsetLat / 2 - (coordinate.y / 900) * offsetLat;
  return [lng, lat];
}

// 计算宠物友好指数
function calculatePetFriendlyIndex(place) {
  let score = 0;
  // 评分占比40%（满分5分）
  score += Math.min(40, place.rating * 8);
  // 设施占比30%（每项7.5分，最多4项）
  score += Math.min(30, (place.petPolicy.facilities || []).length * 7.5);
  // 验证占比20%（每次验证2分，最多10次）
  score += Math.min(20, (place.verifyCount || 0) * 2);
  // 宠物类型支持占比10%
  const petTypes = place.petPolicy.petTypes || [];
  if (petTypes.includes('犬类') && petTypes.includes('猫类')) score += 10;
  else if (petTypes.length > 0) score += 5;
  return Math.round(score);
}

function sharePlace() {
  const placeId = Router.currentParams.id;
  const shareUrl = `${window.location.origin}${window.location.pathname}#detail/${placeId}`;

  if (navigator.clipboard) {
    navigator.clipboard.writeText(shareUrl).then(() => {
      showToast('链接已复制，分享给朋友吧');
    }).catch(() => {
      showToast('复制失败');
    });
  } else {
    // 降级方案
    const input = document.createElement('input');
    input.value = shareUrl;
    document.body.appendChild(input);
    input.select();
    document.execCommand('copy');
    document.body.removeChild(input);
    showToast('链接已复制，分享给朋友吧');
  }
}

function showToast(msg) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.style.display = 'block';
  setTimeout(() => { toast.style.display = 'none'; }, 2000);
}

// ========== 评论评分系统 ==========

async function loadComments(placeId) {
  const res = await api.getComments(placeId);
  const comments = res.data || [];
  const list = document.getElementById('comments-list');

  if (comments.length === 0) {
    list.innerHTML = '<div style="text-align:center;color:var(--text-light);padding:20px;font-size:12px;">暂无评价，快来写第一条评价吧</div>';
    return;
  }

  list.innerHTML = comments.map(c => `
    <div class="comment-item">
      <div class="comment-header">
        <span class="comment-avatar">${c.avatar || '🐾'}</span>
        <span class="comment-user">${c.username}</span>
        <span class="comment-stars">${'★'.repeat(c.rating)}${'☆'.repeat(5 - c.rating)}</span>
        <span class="comment-time">${c.time}</span>
      </div>
      <div class="comment-body">${c.content}</div>
    </div>
  `).join('');
}

function openCommentModal(placeId) {
  Modal.show('写评价', `
    <div class="form-group">
      <label>评分 <span class="required">*</span></label>
      <div class="star-rating" id="star-rating">
        ${[1,2,3,4,5].map(i => `<span class="star" data-rating="${i}">☆</span>`).join('')}
      </div>
      <input type="hidden" id="comment-rating" value="0" />
    </div>
    <div class="form-group">
      <label>评价内容 <span class="required">*</span></label>
      <textarea class="form-textarea" id="comment-content" placeholder="分享您的体验..."></textarea>
    </div>
    <button class="btn btn-primary btn-block mt-12" onclick="submitComment(${placeId})">提交评价</button>
  `);

  // 绑定星级评分点击
  const stars = document.querySelectorAll('#star-rating .star');
  let currentRating = 0;
  stars.forEach((star, i) => {
    star.addEventListener('click', () => {
      currentRating = i + 1;
      document.getElementById('comment-rating').value = currentRating;
      stars.forEach((s, j) => {
        s.textContent = j < currentRating ? '★' : '☆';
        s.classList.toggle('active', j < currentRating);
      });
    });
  });
}

async function submitComment(placeId) {
  const auth = getAuth();
  const userId = auth ? auth.userId : 'user_demo_001';
  const rating = parseInt(document.getElementById('comment-rating').value);
  const content = document.getElementById('comment-content').value.trim();

  if (!rating || rating < 1) {
    showToast('请选择评分');
    return;
  }
  if (!content) {
    showToast('请填写评价内容');
    return;
  }

  const res = await api.submitComment(placeId, { userId, content, rating });
  if (res.code === 200) {
    Modal.close();
    showToast('评价提交成功！');
    loadComments(placeId);
    // 刷新评分
    const placeRes = await api.getPlaceDetail(placeId);
    const ratingEl = document.querySelector('.detail-rating');
    if (ratingEl && placeRes.data) {
      ratingEl.innerHTML = `★ ${placeRes.data.rating} <span style="color:var(--text-light);font-weight:400;">(${placeRes.data.reviewCount}条评价)</span>`;
    }
  }
}