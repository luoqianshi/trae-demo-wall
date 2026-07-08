// 爪印城市 - 设置页面
Router.register('settings', () => {
  const auth = getAuth();
  const isLoggedIn = auth != null;

  return `
    <div class="settings-page">
      <div class="nav-header" style="display:flex;align-items:center;gap:8px;">
        <span class="back-btn" onclick="Router.back()">← 返回</span>
        <span class="page-title" style="flex:1;text-align:left;">设置</span>
      </div>

      <!-- 账号设置 -->
      <div class="settings-section">
        <div class="settings-section-title">账号设置</div>
        <div class="settings-group">
          <div class="settings-item" onclick="openEditProfileModal()">
            <div class="settings-left">
              <span class="settings-icon">👤</span>
              <span>个人资料</span>
            </div>
            <div class="settings-right">
              <span class="settings-value">${auth ? auth.username : '未登录'}</span>
              <span class="settings-arrow">›</span>
            </div>
          </div>
          <div class="settings-item" onclick="openAvatarModal()">
            <div class="settings-left">
              <span class="settings-icon">🎨</span>
              <span>头像设置</span>
            </div>
            <div class="settings-right">
              <span class="settings-avatar-preview">${auth && auth.avatar && auth.avatar.startsWith('data:image') ? `<img src="${auth.avatar}" alt="头像" class="settings-avatar-img" />` : (auth ? auth.avatar : '🐾')}</span>
              <span class="settings-arrow">›</span>
            </div>
          </div>
          <div class="settings-item" onclick="openChangePasswordModal()">
            <div class="settings-left">
              <span class="settings-icon">🔐</span>
              <span>修改密码</span>
            </div>
            <div class="settings-right">
              <span class="settings-arrow">›</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 隐私设置 -->
      <div class="settings-section">
        <div class="settings-section-title">隐私设置</div>
        <div class="settings-group">
          <div class="settings-item">
            <div class="settings-left">
              <span class="settings-icon">📍</span>
              <span>位置权限</span>
            </div>
            <div class="settings-right">
              <label class="settings-switch">
                <input type="checkbox" id="privacy-location" checked />
                <span class="settings-switch-slider"></span>
              </label>
            </div>
          </div>
          <div class="settings-item">
            <div class="settings-left">
              <span class="settings-icon">👁️</span>
              <span>公开收藏</span>
            </div>
            <div class="settings-right">
              <label class="settings-switch">
                <input type="checkbox" id="privacy-public" />
                <span class="settings-switch-slider"></span>
              </label>
            </div>
          </div>
          <div class="settings-item">
            <div class="settings-left">
              <span class="settings-icon">🚫</span>
              <span>隐藏宠物档案</span>
            </div>
            <div class="settings-right">
              <label class="settings-switch">
                <input type="checkbox" id="privacy-pet" />
                <span class="settings-switch-slider"></span>
              </label>
            </div>
          </div>
        </div>
      </div>

      <!-- 消息通知 -->
      <div class="settings-section">
        <div class="settings-section-title">消息通知</div>
        <div class="settings-group">
          <div class="settings-item">
            <div class="settings-left">
              <span class="settings-icon">🔔</span>
              <span>推送通知</span>
            </div>
            <div class="settings-right">
              <label class="settings-switch">
                <input type="checkbox" id="notify-push" checked />
                <span class="settings-switch-slider"></span>
              </label>
            </div>
          </div>
          <div class="settings-item">
            <div class="settings-left">
              <span class="settings-icon">💬</span>
              <span>评论提醒</span>
            </div>
            <div class="settings-right">
              <label class="settings-switch">
                <input type="checkbox" id="notify-comment" checked />
                <span class="settings-switch-slider"></span>
              </label>
            </div>
          </div>
          <div class="settings-item">
            <div class="settings-left">
              <span class="settings-icon">📢</span>
              <span>活动通知</span>
            </div>
            <div class="settings-right">
              <label class="settings-switch">
                <input type="checkbox" id="notify-activity" />
                <span class="settings-switch-slider"></span>
              </label>
            </div>
          </div>
        </div>
      </div>

      <!-- 其他 -->
      <div class="settings-section">
        <div class="settings-section-title">其他</div>
        <div class="settings-group">
          <div class="settings-item" onclick="clearCache()">
            <div class="settings-left">
              <span class="settings-icon">🗑️</span>
              <span>清除缓存</span>
            </div>
            <div class="settings-right">
              <span class="settings-value" id="cache-size">2.3 MB</span>
              <span class="settings-arrow">›</span>
            </div>
          </div>
          <div class="settings-item" onclick="showAbout()">
            <div class="settings-left">
              <span class="settings-icon">ℹ️</span>
              <span>关于爪印城市</span>
            </div>
            <div class="settings-right">
              <span class="settings-value">v1.0.0</span>
              <span class="settings-arrow">›</span>
            </div>
          </div>
          <div class="settings-item" onclick="showFeedback()">
            <div class="settings-left">
              <span class="settings-icon">📧</span>
              <span>意见反馈</span>
            </div>
            <div class="settings-right">
              <span class="settings-arrow">›</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 退出登录 -->
      ${isLoggedIn ? `
      <div class="settings-section" style="margin-top:20px;">
        <button class="btn btn-outline btn-block logout-btn" onclick="handleLogout()">退出登录</button>
      </div>` : ''}
    </div>
  `;
});

function init_settings() {
  // 加载用户设置
  loadUserSettings();
}

function loadUserSettings() {
  const settings = localStorage.getItem('pawprint_settings');
  if (settings) {
    const data = JSON.parse(settings);
    const locEl = document.getElementById('privacy-location');
    const pubEl = document.getElementById('privacy-public');
    const petEl = document.getElementById('privacy-pet');
    const pushEl = document.getElementById('notify-push');
    const commEl = document.getElementById('notify-comment');
    const actEl = document.getElementById('notify-activity');
    
    if (locEl) locEl.checked = data.location !== undefined ? data.location : true;
    if (pubEl) pubEl.checked = data.publicFavorites !== undefined ? data.publicFavorites : false;
    if (petEl) petEl.checked = data.hidePetProfile !== undefined ? data.hidePetProfile : false;
    if (pushEl) pushEl.checked = data.pushNotify !== undefined ? data.pushNotify : true;
    if (commEl) commEl.checked = data.commentNotify !== undefined ? data.commentNotify : true;
    if (actEl) actEl.checked = data.activityNotify !== undefined ? data.activityNotify : false;
  }

  // 监听开关变化
  document.querySelectorAll('.settings-switch input').forEach(input => {
    input.addEventListener('change', saveUserSettings);
  });
}

function saveUserSettings() {
  const settings = {
    location: document.getElementById('privacy-location')?.checked,
    publicFavorites: document.getElementById('privacy-public')?.checked,
    hidePetProfile: document.getElementById('privacy-pet')?.checked,
    pushNotify: document.getElementById('notify-push')?.checked,
    commentNotify: document.getElementById('notify-comment')?.checked,
    activityNotify: document.getElementById('notify-activity')?.checked
  };
  localStorage.setItem('pawprint_settings', JSON.stringify(settings));
  showToast('设置已保存');
}

function openEditProfileModal() {
  const auth = getAuth();
  Modal.show('编辑个人资料', `
    <div class="form-group">
      <label>昵称</label>
      <input class="form-input" id="edit-username" value="${auth ? auth.username : ''}" placeholder="输入新昵称" />
    </div>
    <div class="form-group">
      <label>手机号</label>
      <input class="form-input" id="edit-phone" value="${auth ? auth.phone : ''}" placeholder="绑定手机号" disabled />
    </div>
    <button class="btn btn-primary btn-block mt-12" onclick="saveProfile()">保存修改</button>
  `);
}

function saveProfile() {
  const auth = getAuth();
  if (!auth) {
    showToast('请先登录');
    return;
  }
  const username = document.getElementById('edit-username').value.trim();
  if (!username) {
    showToast('昵称不能为空');
    return;
  }
  auth.username = username;
  storeAuth(auth);
  Modal.close();
  showToast('资料已更新');
  Router.navigate('settings');
}

function openAvatarModal() {
  const avatars = ['🐾', '🐕', '🐱', '🦮', '🐈', '🐰', '🦊', '🐻', '🐼', '🦁', '🐯', '🐨', '🐮', '🐷', '🐸', '🦄'];
  const auth = getAuth();
  const currentAvatar = auth ? auth.avatar : '';

  Modal.show('设置头像', `
    <div style="margin-bottom:16px;">
      <div style="font-size:14px;font-weight:500;margin-bottom:12px;">上传自定义图片</div>
      <div class="avatar-upload-area" onclick="document.getElementById('avatar-file-input').click()">
        <input type="file" id="avatar-file-input" accept="image/*" style="display:none" onchange="handleAvatarUpload(event)" />
        <div class="avatar-upload-icon">📷</div>
        <div class="avatar-upload-text">点击上传图片</div>
        <div class="avatar-upload-hint">支持 JPG、PNG 格式，建议正方形图片</div>
      </div>
      ${currentAvatar && currentAvatar.startsWith('data:image') ? `
      <div class="current-custom-avatar">
        <div class="custom-avatar-preview">
          <img src="${currentAvatar}" alt="当前头像" />
        </div>
        <span>当前使用自定义头像</span>
      </div>
      ` : ''}
    </div>
    <div style="border-top:1px solid var(--border);padding-top:16px;">
      <div style="font-size:14px;font-weight:500;margin-bottom:12px;">选择预设头像</div>
      <div class="avatar-grid">
        ${avatars.map(a => `
          <div class="avatar-option ${currentAvatar === a ? 'selected' : ''}" onclick="selectAvatar('${a}')">${a}</div>
        `).join('')}
      </div>
    </div>
    <button class="btn btn-primary btn-block mt-12" onclick="saveAvatar()">确认选择</button>
  `);
}

let selectedAvatar = null;
let uploadedAvatarUrl = null;

function handleAvatarUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  // 检查文件类型
  if (!file.type.startsWith('image/')) {
    showToast('请选择图片文件');
    return;
  }

  // 检查文件大小（最大2MB）
  if (file.size > 2 * 1024 * 1024) {
    showToast('图片大小不能超过2MB');
    return;
  }

  const reader = new FileReader();
  reader.onload = function(e) {
    uploadedAvatarUrl = e.target.result;
    selectedAvatar = null;

    // 清除所有头像选中状态
    document.querySelectorAll('.avatar-option').forEach(el => {
      el.classList.remove('selected');
    });

    // 更新上传区域显示预览
    const uploadArea = document.querySelector('.avatar-upload-area');
    if (uploadArea) {
      uploadArea.innerHTML = `
        <div class="avatar-upload-preview">
          <img src="${uploadedAvatarUrl}" alt="预览" />
        </div>
        <div class="avatar-upload-success">图片已选择，点击确认保存</div>
      `;
    }

    showToast('图片已加载');
  };
  reader.readAsDataURL(file);
}

function selectAvatar(avatar) {
  selectedAvatar = avatar;
  uploadedAvatarUrl = null;
  document.querySelectorAll('.avatar-option').forEach(el => {
    el.classList.toggle('selected', el.textContent === avatar);
  });
}

function saveAvatar() {
  const auth = getAuth();
  if (!auth) {
    showToast('请先登录');
    return;
  }

  if (uploadedAvatarUrl) {
    auth.avatar = uploadedAvatarUrl;
    storeAuth(auth);
    Modal.close();
    showToast('头像已更新');
    Router.navigate('settings');
    return;
  }

  if (!selectedAvatar) {
    showToast('请选择或上传头像');
    return;
  }

  auth.avatar = selectedAvatar;
  storeAuth(auth);
  Modal.close();
  showToast('头像已更新');
  Router.navigate('settings');
}

function openChangePasswordModal() {
  Modal.show('修改密码', `
    <div class="form-group">
      <label>原密码</label>
      <input class="form-input" type="password" id="old-password" placeholder="输入原密码" />
    </div>
    <div class="form-group">
      <label>新密码</label>
      <input class="form-input" type="password" id="new-password" placeholder="输入新密码" />
    </div>
    <div class="form-group">
      <label>确认密码</label>
      <input class="form-input" type="password" id="confirm-password" placeholder="再次输入新密码" />
    </div>
    <button class="btn btn-primary btn-block mt-12" onclick="changePassword()">确认修改</button>
  `);
}

async function changePassword() {
  const oldPwd = document.getElementById('old-password').value;
  const newPwd = document.getElementById('new-password').value;
  const confirmPwd = document.getElementById('confirm-password').value;

  if (!oldPwd || !newPwd || !confirmPwd) {
    showToast('请填写完整信息');
    return;
  }
  if (newPwd !== confirmPwd) {
    showToast('两次密码不一致');
    return;
  }
  if (newPwd.length < 6) {
    showToast('密码至少6位');
    return;
  }

  showToast('密码修改成功');
  Modal.close();
}

function clearCache() {
  localStorage.removeItem('pawprint_history');
  localStorage.removeItem('pawprint_settings');
  document.getElementById('cache-size').textContent = '0 MB';
  showToast('缓存已清除');
}

function showAbout() {
  Modal.show('关于爪印城市', `
    <div class="about-content">
      <div class="about-logo">🐾</div>
      <div class="about-title">爪印城市</div>
      <div class="about-version">版本 1.0.0</div>
      <div class="about-desc">
        基于LBS的城市宠物友好场所聚合服务平台，解决养宠人群带宠出行信息不对称、商家获客不精准的痛点，推动人宠和谐城市建设。
      </div>
      <div class="about-copyright">© 2026 爪印城市团队</div>
    </div>
  `);
}

function showFeedback() {
  Modal.show('意见反馈', `
    <div class="form-group">
      <label>反馈类型</label>
      <select class="form-select" id="feedback-type">
        <option value="功能建议">功能建议</option>
        <option value="Bug反馈">Bug反馈</option>
        <option value="内容纠错">内容纠错</option>
        <option value="其他">其他</option>
      </select>
    </div>
    <div class="form-group">
      <label>反馈内容</label>
      <textarea class="form-textarea" id="feedback-content" placeholder="请描述您的反馈..." style="min-height:100px;"></textarea>
    </div>
    <button class="btn btn-primary btn-block mt-12" onclick="submitFeedback()">提交反馈</button>
  `);
}

function submitFeedback() {
  const content = document.getElementById('feedback-content').value.trim();
  if (!content) {
    showToast('请填写反馈内容');
    return;
  }
  Modal.close();
  showToast('感谢您的反馈！');
}