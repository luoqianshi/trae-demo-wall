/**
 * WordSoul - 应用主模块
 * 路由管理、视图渲染、全局状态
 */

var App = {
  // 当前视图
  currentView: 'iter',

  // 初始化
  init() {
    this.setupRouter();
    this.navigate('iter');
  },

  // 设置路由
  setupRouter() {
    // 监听浏览器后退/前进
    window.addEventListener('popstate', () => {
      const path = window.location.hash.replace('#/', '') || 'iter';
      this.navigate(path, false);
    });
  },

  // 导航到指定视图
  navigate(view, pushState = true) {
    this.currentView = view;

    // 更新导航按钮状态
    document.querySelectorAll('.nav-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    const activeBtn = document.getElementById(`nav-${view}`);
    if (activeBtn) activeBtn.classList.add('active');

    // 更新 URL
    if (pushState) {
      window.history.pushState(null, '', `#/${view}`);
    }

    // 渲染视图
    this.render(view);
  },

  // 渲染视图
  render(view) {
    const container = document.getElementById('app');

    switch (view) {
      case 'iter':
        container.innerHTML = this.renderIterView();
        if (Game) Game.init();
        break;
      case 'battle':
        container.innerHTML = this.renderBattleView();
        if (AIBattle) AIBattle.init();
        break;
      case 'profile':
        container.innerHTML = this.renderProfileView();
        if (Profile) Profile.init();
        break;
      case 'settings':
        container.innerHTML = this.renderSettingsView();
        this.initSettings();
        break;
      default:
        container.innerHTML = this.renderIterView();
    }
  },

  // 自我迭代模式视图
  renderIterView() {
    return `
      <div class="animate-fade-in">
        <div class="text-center mb-8">
          <h2 class="text-2xl font-bold text-white mb-2">自我迭代模式</h2>
          <p class="text-soul-muted">录入内心词语，让它们互相吞噬，找出你的灵魂关键词</p>
        </div>
        <div id="game-container">
          <!-- 游戏内容将由 game.js 动态渲染 -->
          <div class="text-center py-12">
            <div class="w-16 h-16 border-4 border-soul-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p class="text-soul-muted">正在加载游戏模块...</p>
          </div>
        </div>
      </div>
    `;
  },

  // AI 对战模式视图
  renderBattleView() {
    return `
      <div class="animate-fade-in">
        <div class="text-center mb-8">
          <h2 class="text-2xl font-bold text-white mb-2">AI 对战模式</h2>
          <p class="text-soul-muted">与 AI 轮流出词对决，在对抗中激发深层思考</p>
        </div>
        <div id="battle-container">
          <div class="text-center py-12">
            <div class="w-16 h-16 border-4 border-soul-secondary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p class="text-soul-muted">正在加载对战模块...</p>
          </div>
        </div>
      </div>
    `;
  },

  // 个人资料视图
  renderProfileView() {
    return `
      <div class="animate-fade-in">
        <div class="text-center mb-8">
          <h2 class="text-2xl font-bold text-white mb-2">个人资料</h2>
          <p class="text-soul-muted">查看你的词库、战绩和思维成长轨迹</p>
        </div>
        <div id="profile-container">
          <div class="text-center py-12">
            <div class="w-16 h-16 border-4 border-soul-accent border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p class="text-soul-muted">正在加载资料模块...</p>
          </div>
        </div>
      </div>
    `;
  },

  // AI 裁判配置视图
  renderSettingsView() {
    const config = Storage.getAIConfig();
    return `
      <div class="animate-fade-in max-w-2xl mx-auto">
        <div class="text-center mb-8">
          <h2 class="text-2xl font-bold text-white mb-2">AI 裁判配置</h2>
          <p class="text-soul-muted">配置你的大模型 API，让 AI 为你的词语对战做裁判</p>
        </div>

        <div class="settings-panel">
          <!-- 启用开关 -->
          <div class="settings-section">
            <label class="flex items-center justify-between cursor-pointer">
              <span class="settings-label">启用 AI 裁判</span>
              <input type="checkbox" id="ai-enabled" ${config.enabled ? 'checked' : ''}
                class="w-5 h-5 rounded border-soul-border bg-soul-surface text-soul-primary focus:ring-soul-primary">
            </label>
            <p class="settings-hint">开启后，对战将调用外部 AI 进行分析；关闭则使用本地规则裁判</p>
          </div>

          <!-- API URL -->
          <div class="settings-section">
            <label class="settings-label">API 地址</label>
            <input type="text" id="ai-url" value="${config.apiUrl || ''}"
              placeholder="https://api.openai.com/v1/chat/completions"
              class="soul-input">
            <p class="settings-hint">支持 OpenAI 格式的大模型 API 地址</p>
          </div>

          <!-- API Key -->
          <div class="settings-section">
            <label class="settings-label">API Key</label>
            <input type="password" id="ai-key" value="${config.apiKey || ''}"
              placeholder="sk-..."
              class="soul-input">
            <p class="settings-hint">你的 API 密钥，仅存储在本地浏览器中</p>
          </div>

          <!-- 模型名称 -->
          <div class="settings-section">
            <label class="settings-label">模型名称</label>
            <input type="text" id="ai-model" value="${config.model || 'gpt-3.5-turbo'}"
              placeholder="gpt-3.5-turbo"
              class="soul-input">
            <p class="settings-hint">例如：gpt-3.5-turbo、gpt-4、claude-3-sonnet 等</p>
          </div>

          <!-- Temperature -->
          <div class="settings-section">
            <label class="settings-label">Temperature（创造性）</label>
            <div class="flex items-center gap-4">
              <input type="range" id="ai-temp" min="0" max="20" value="${(config.temperature || 0.7) * 10}"
                class="flex-1 h-2 bg-soul-surface rounded-lg appearance-none cursor-pointer">
              <span id="ai-temp-value" class="text-soul-text font-mono w-12 text-right">${config.temperature || 0.7}</span>
            </div>
            <p class="settings-hint">值越低越保守，越高越创造性（0-2）</p>
          </div>

          <!-- Max Tokens -->
          <div class="settings-section">
            <label class="settings-label">最大回复长度（Tokens）</label>
            <input type="number" id="ai-tokens" value="${config.maxTokens || 500}"
              min="100" max="2000" step="100"
              class="soul-input">
            <p class="settings-hint">控制 AI 回复的最大长度</p>
          </div>

          <!-- 操作按钮 -->
          <div class="flex gap-3 mt-6">
            <button onclick="App.saveSettings()" class="soul-btn flex-1">
              保存配置
            </button>
            <button onclick="App.testAIConnection()" class="soul-btn soul-btn-secondary flex-1">
              测试连接
            </button>
          </div>

          <!-- 测试结果 -->
          <div id="test-result" class="mt-4 hidden"></div>
        </div>

        <!-- 使用说明 -->
        <div class="mt-6 bg-soul-surface border border-soul-border rounded-2xl p-6">
          <h3 class="text-lg font-bold text-white mb-3">使用说明</h3>
          <ul class="space-y-2 text-sm text-soul-muted">
            <li>1. 支持任何兼容 OpenAI API 格式的大模型服务</li>
            <li>2. API Key 仅存储在浏览器本地，不会上传到任何服务器</li>
            <li>3. 如果未配置或配置错误，将自动使用本地规则裁判</li>
            <li>4. 推荐使用：OpenAI、Azure OpenAI、Groq、Cloudflare Workers AI 等</li>
          </ul>
        </div>
      </div>
    `;
  },

  // 初始化设置页面
  initSettings() {
    // Temperature 滑块实时更新
    const tempSlider = document.getElementById('ai-temp');
    const tempValue = document.getElementById('ai-temp-value');
    if (tempSlider && tempValue) {
      tempSlider.addEventListener('input', () => {
        tempValue.textContent = (tempSlider.value / 10).toFixed(1);
      });
    }
  },

  // 保存配置
  saveSettings() {
    const config = {
      enabled: document.getElementById('ai-enabled').checked,
      apiUrl: document.getElementById('ai-url').value.trim(),
      apiKey: document.getElementById('ai-key').value.trim(),
      model: document.getElementById('ai-model').value.trim() || 'gpt-3.5-turbo',
      temperature: parseFloat(document.getElementById('ai-temp-value').textContent),
      maxTokens: parseInt(document.getElementById('ai-tokens').value) || 500
    };

    Storage.saveAIConfig(config);

    // 显示保存成功提示
    this.showToast('配置已保存');
  },

  // 测试 AI 连接
  async testAIConnection() {
    var resultDiv = document.getElementById('test-result');
    if (!resultDiv) return;
    resultDiv.classList.remove('hidden');
    resultDiv.innerHTML = '<p class="text-soul-muted">正在测试连接...</p>';

    try {
      // 先自动保存当前页面配置，确保用的是最新值
      this.saveSettings();

      var result = await AIJudge.testConnection();

      if (result.ok) {
        resultDiv.innerHTML = '<div class="bg-green-500/10 border border-green-500/30 rounded-lg p-4"><p class="text-green-400 font-medium">连接成功！AI 裁判已就绪</p></div>';
      } else {
        resultDiv.innerHTML = '<div class="bg-red-500/10 border border-red-500/30 rounded-lg p-4"><p class="text-red-400 font-medium">连接失败</p><p class="text-soul-muted text-sm mt-1">' + result.error + '</p></div>';
      }
    } catch (e) {
      resultDiv.innerHTML = '<div class="bg-red-500/10 border border-red-500/30 rounded-lg p-4"><p class="text-red-400 font-medium">测试出错</p><p class="text-soul-muted text-sm mt-1">' + e.message + '</p></div>';
    }
  },

  // 显示提示
  showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'fixed bottom-8 left-1/2 transform -translate-x-1/2 bg-soul-primary text-white px-6 py-3 rounded-xl shadow-lg z-50 animate-fade-in';
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.remove();
    }, 2000);
  }
};

// 路由快捷方式
const router = {
  navigate: (view) => App.navigate(view)
};

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
  // 确保所有模块加载完成后再初始化
  const checkModules = () => {
    if (typeof Storage !== 'undefined' &&
        typeof AIJudge !== 'undefined' &&
        typeof Game !== 'undefined' &&
        typeof AIBattle !== 'undefined' &&
        typeof Profile !== 'undefined') {
      App.init();
    } else {
      setTimeout(checkModules, 50);
    }
  };
  checkModules();
});
