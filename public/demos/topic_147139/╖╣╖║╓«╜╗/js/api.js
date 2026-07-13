/**
 * 饭泛之交 - Mock API
 * 模拟后端响应：延迟、错误率、重试、限频
 */

// ==================== MOCK API ====================
const MockAPI = {
  // 模拟网络延迟
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  },

  // 随机延迟
  randomDelay(min = 300, max = 1200) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  },

  // 模拟请求（带延迟和可选错误率）
  async request(data, options = {}) {
    const { delayMs, errorRate = 0, retries = 0 } = options;
    const waitTime = delayMs || this.randomDelay();
    
    for (let attempt = 0; attempt <= retries; attempt++) {
      await this.delay(waitTime);
      
      // 模拟随机错误
      if (Math.random() < errorRate && attempt < retries) {
        continue; // 重试
      }
      
      if (Math.random() < errorRate && attempt === retries) {
        throw new Error('网络请求失败，请稍后重试');
      }
      
      return data;
    }
    
    return data;
  },

  // 发送验证码（限频60秒）
  _lastSmsTime: 0,
  _smsCooldown: 60,

  async sendSmsCode(phone) {
    // 校验手机号
    if (!phone || !/^1[3-9]\d{9}$/.test(phone)) {
      throw new Error('请输入正确的手机号');
    }
    
    // 限频检查
    const now = Math.floor(Date.now() / 1000);
    const elapsed = now - this._lastSmsTime;
    if (this._lastSmsTime > 0 && elapsed < this._smsCooldown) {
      const remaining = this._smsCooldown - elapsed;
      throw new Error(`发送太频繁，请${remaining}秒后重试`);
    }
    
    this._lastSmsTime = now;
    await this.delay(this.randomDelay(500, 1500));
    return { success: true, code: '123456' };
  },

  getSmsCooldown() {
    if (this._lastSmsTime === 0) return 0;
    const elapsed = Math.floor(Date.now() / 1000) - this._lastSmsTime;
    return Math.max(0, this._smsCooldown - elapsed);
  },

  // 验证邀请码
  async validateInviteCode(code) {
    if (!code || code.length < 4) {
      throw new Error('邀请码格式不正确');
    }
    await this.delay(this.randomDelay(400, 800));
    // 演示用：FFZJ2026 或任意6位以上码都有效
    if (code === 'FFZJ2026' || code.length >= 6) {
      return { valid: true };
    }
    throw new Error('邀请码无效或已过期');
  },

  // 注册
  async register(userData) {
    await this.delay(this.randomDelay(800, 1800));
    return { success: true, userId: Date.now(), ...userData };
  },

  // 获取首页推荐
  async getHomeFeed() {
    await this.delay(this.randomDelay(600, 1200));
    return mockPosts;
  },

  // 获取榜单
  async getRankList(type) {
    await this.delay(this.randomDelay(500, 1000));
    return rankData[type] || rankData.recommend;
  },

  // 获取活动列表
  async getEvents() {
    await this.delay(this.randomDelay(400, 900));
    return mockEvents;
  },

  // 获取聊天列表
  async getChatList() {
    await this.delay(this.randomDelay(300, 800));
    return mockChats;
  },

  // AI匹配
  async runMatch(filters) {
    await this.delay(this.randomDelay(2000, 3500));
    // 模拟偶尔无匹配结果
    if (Math.random() < 0.05) {
      return { noMatch: true, reason: '当前条件下候选用户不足，试试扩大筛选范围？' };
    }
    return {
      noMatch: false,
      match: {
        name: ['辣妹子', '文艺青年', '火锅侠', '吃货小当家', '甜筒小姐'][Math.floor(Math.random() * 5)],
        avatar: ['👩', '👨‍🎨', '🧑', '👩‍🦰', '🧑‍🍳'][Math.floor(Math.random() * 5)],
        score: 90 + Math.floor(Math.random() * 9),
        reason: ['你们都爱火锅，口味高度一致', 'MBTI完美互补，聊天不冷场', '同区域+同偏好，约饭超方便', '美食探店达人，带你发现隐藏好店'][Math.floor(Math.random() * 4)],
        tags: [['无辣不欢', 'ENFP', '朝阳区'], ['火锅控', 'INTJ', '海淀区'], ['甜品爱好者', 'ESFP', '望京']][Math.floor(Math.random() * 3)]
      }
    };
  },

  // 获取约饭历史
  async getMealHistory() {
    await this.delay(this.randomDelay(300, 600));
    return Store.data.mealHistory;
  },

  // 提交评价
  async submitReview(reviewData) {
    await this.delay(this.randomDelay(800, 1500));
    return { success: true };
  },

  // 发帖
  async publishPost(postData) {
    await this.delay(this.randomDelay(600, 1200));
    return { success: true, postId: Date.now() };
  },

  // 获取报名列表
  async getApplications(postId) {
    await this.delay(this.randomDelay(400, 800));
    return Store.postApplications[postId] || [];
  },

  // 担保支付预授权
  async escrowPay(amount) {
    await this.delay(this.randomDelay(1000, 2000));
    return { success: true, transactionId: 'PAY' + Date.now(), frozenAmount: amount };
  },

  // 签到
  async checkIn(mealId) {
    await this.delay(this.randomDelay(800, 1500));
    return { success: true, checkInTime: new Date().toLocaleString() };
  },

  // 人脸核验
  async faceVerify() {
    await this.delay(this.randomDelay(1500, 2500));
    return { success: true, confidence: 0.98 };
  }
};

// ==================== LOADING MANAGER ====================
const LoadingManager = {
  // 显示骨架屏
  showSkeleton(containerId, type = 'list', count = 4) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    let html = '';
    for (let i = 0; i < count; i++) {
      if (type === 'list') {
        html += `
          <div class="skeleton-card">
            <div style="display:flex;gap:12px;align-items:center;">
              <div class="skeleton skeleton-avatar"></div>
              <div style="flex:1;">
                <div class="skeleton skeleton-line short"></div>
                <div class="skeleton skeleton-line long" style="height:10px;"></div>
              </div>
            </div>
          </div>
        `;
      } else if (type === 'cards') {
        html += `
          <div class="skeleton-card">
            <div style="display:flex;gap:12px;align-items:center;margin-bottom:12px;">
              <div class="skeleton skeleton-avatar"></div>
              <div style="flex:1;">
                <div class="skeleton skeleton-line short"></div>
                <div class="skeleton skeleton-line" style="height:10px;width:40%;"></div>
              </div>
            </div>
            <div class="skeleton skeleton-line long"></div>
            <div class="skeleton skeleton-line long" style="height:60px;border-radius:12px;"></div>
          </div>
        `;
      } else if (type === 'rank') {
        html += `
          <div class="skeleton-card" style="display:flex;gap:12px;align-items:center;">
            <div class="skeleton" style="width:24px;height:24px;border-radius:50%;flex-shrink:0;"></div>
            <div class="skeleton" style="width:48px;height:48px;border-radius:12px;flex-shrink:0;"></div>
            <div style="flex:1;">
              <div class="skeleton skeleton-line short"></div>
              <div class="skeleton skeleton-line" style="height:10px;width:70%;"></div>
            </div>
          </div>
        `;
      }
    }
    container.innerHTML = html;
  },

  // 显示全局loading
  showLoading(text = '加载中...') {
    let overlay = document.getElementById('loading-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'loading-overlay';
      overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(255,248,240,0.8);backdrop-filter:blur(4px);z-index:9998;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;';
      document.body.appendChild(overlay);
    }
    overlay.innerHTML = `<div class="spinner" style="width:36px;height:36px;border-width:4px;"></div><p style="font-size:14px;color:var(--text-muted);font-weight:600;">${text}</p>`;
    overlay.style.display = 'flex';
  },

  hideLoading() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) overlay.style.display = 'none';
  },

  // 显示错误重试
  showErrorRetry(containerId, message, retryFn) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">😵</div>
        <div class="empty-state-text">${message}</div>
        <button class="btn btn-secondary btn-sm mt-3" onclick="(${retryFn})()">🔄 重试</button>
      </div>
    `;
  }
};
