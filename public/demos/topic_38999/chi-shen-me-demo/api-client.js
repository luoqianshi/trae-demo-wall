/**
 * 「吃什么」API 客户端
 *
 * 功能：
 * 1. 连接后端 API 服务，获取真实 AI 回复
 * 2. 保留离线演示模式作为 fallback
 * 3. 统一管理会话状态
 *
 * 使用方法：
 * 1. 确保后端服务已启动（api/server.js）
 * 2. 在 HTML 中引入此文件：<script src="api-client.js"></script>
 * 3. 调用 apiClient.sendMessage(message, context) 发送消息
 *
 * 配置：
 *   API_BASE_URL - API 服务地址，默认 http://localhost:3000
 *   USE_API - 是否启用 API 模式，默认 true（API 不可用时自动 fallback）
 */

(function() {
  'use strict';

  // ============ 配置 ============
  const CONFIG = {
    API_BASE_URL: window.CHI_SHEN_ME_API_URL || 'http://localhost:3000',
    USE_API: window.CHI_SHEN_ME_USE_API !== false, // 默认启用
    SESSION_ID: 'demo-' + Date.now(),
    TIMEOUT: 8000, // 8秒超时 fallback
  };

  // ============ API 客户端 ============
  const apiClient = {
    isOnline: false,
    sessionProfile: null,

    // 检查 API 服务是否可用
    async checkHealth() {
      try {
        const res = await fetch(`${CONFIG.API_BASE_URL}/health`, { method: 'GET' });
        const data = await res.json();
        this.isOnline = data.status === 'ok';
        return this.isOnline;
      } catch (e) {
        this.isOnline = false;
        return false;
      }
    },

    // 获取会话状态
    async getSession() {
      try {
        const res = await fetch(`${CONFIG.API_BASE_URL}/api/session?id=${CONFIG.SESSION_ID}`);
        const data = await res.json();
        this.sessionProfile = data.profile;
        return data;
      } catch (e) {
        return null;
      }
    },

    // 发送消息
    async sendMessage(message, context = {}) {
      if (!CONFIG.USE_API) {
        return { mode: 'offline', reason: 'API 模式已禁用' };
      }

      // 先检查健康状态
      const healthy = await this.checkHealth();
      if (!healthy) {
        console.log('[API] 服务不可用，使用离线模式');
        return { mode: 'offline', reason: 'API 服务未连接' };
      }

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), CONFIG.TIMEOUT);

        const res = await fetch(`${CONFIG.API_BASE_URL}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId: CONFIG.SESSION_ID,
            message: message,
            context: context
          }),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        const data = await res.json();

        if (!data.success) {
          console.warn('[API] 请求失败:', data.error);
          return { mode: 'offline', reason: data.error, fallback: data.fallback };
        }

        this.sessionProfile = data.session.profile;
        return { mode: 'api', data: data.data, profile: data.session.profile };

      } catch (error) {
        console.warn('[API] 请求异常:', error.message);
        return { mode: 'offline', reason: error.message };
      }
    },

    // 更新画像
    async updateProfile(updates) {
      try {
        const res = await fetch(`${CONFIG.API_BASE_URL}/api/profile`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId: CONFIG.SESSION_ID,
            updates: updates
          })
        });
        return await res.json();
      } catch (e) {
        return { success: false };
      }
    }
  };

  // ============ 与现有 Demo 集成 ============

  // 将 API 响应转换为 Demo 的 flow 格式
  function apiResponseToFlow(apiData) {
    const flow = [];

    // AI 主回复
    if (apiData.text) {
      flow.push({ type: 'ai', text: apiData.text });
    }

    // 记忆芯片
    if (apiData.memoryChip) {
      flow.push({ type: 'memoryChip', text: apiData.memoryChip });
    }

    // 推荐卡片
    if (apiData.recommendations && apiData.recommendations.length > 0) {
      // 映射到本地 FOOD 数据
      const cards = apiData.recommendations.map(r => {
        // 尝试匹配本地 imgKey
        const key = r.imgKey || Object.keys(window.FOOD || {}).find(k =>
          window.FOOD[k].name === r.name
        );
        return key || 'noodle'; // fallback
      }).filter(Boolean);

      if (cards.length > 0) {
        flow.push({
          type: 'recs',
          section: 'AI 为你推荐的选项',
          cards: cards.slice(0, 3)
        });
      }
    }

    // 第四个选择
    if (apiData.showEighth) {
      flow.push({ type: 'eighth' });
    }

    // 画像更新（触发信息页同步）
    if (apiData.profileUpdate) {
      flow.push({ type: 'profileUpdate', hint: apiData.profileUpdate });
    }

    // 操作按钮（抽签/对比）
    if (apiData.actions) {
      apiData.actions.forEach(action => {
        if (action.action === 'draw') {
          flow.push({ type: 'ai', text: '或者，让运气帮你决定？' });
          flow.push({ type: 'draw', options: ['budae', 'noodle', 'ramen'] }); // 简化版
        }
      });
    }

    return flow;
  }

  // 暴露到全局
  window.apiClient = apiClient;
  window.apiResponseToFlow = apiResponseToFlow;

  // 自动检测 API 状态
  apiClient.checkHealth().then(ok => {
    if (ok) {
      console.log('[吃什么] API 模式已就绪 🧠');
    } else {
      console.log('[吃什么] API 服务未连接，使用离线演示模式 📴');
    }
  });

})();
