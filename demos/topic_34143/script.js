// ============== 全局状态 ==============
let userBalance = 0;
let currentModel = 'GPT-3.5';
let callCount = 0;
let callTotalCost = 0;
let isAuthorized = false;
let callHistory = [];
let selectedPackage = 29;
let selectedPayment = 'wechat';

// 模型定价
const MODEL_PRICES = {
  'GPT-3.5': 0.01,
  'GPT-4o': 0.05,
  'Claude Sonnet': 0.03
};

// 模拟回复库
const MOCK_REPLIES = {
  '写': '好的！以下是一段示例写作：\n\n"在这个充满机遇与挑战的时代，每个人都在寻找属于自己的方向。无论是技术创新还是个人成长，持续学习都是最重要的能力。"\n\n你希望我继续展开这个主题，还是换一个方向？',
  '代码': '这里是一个示例：\n\n```python\ndef main():\n    print("Hello, AI World!")\n    # 使用 SDK 调用大模型\n    response = client.chat(model="gpt-4o", messages=[...])\n```\n需要我解释这段代码，或针对具体问题提供代码示例吗？',
  '翻译': '"Translation" —— 让我来帮你翻译。请提供需要翻译的具体文本，我可以支持中英文互译，以及其他主流语言的互译。',
  '你好': '你好！👋 很高兴见到你。我是接入了 LLM-C SDK 的 AI 助手。你可以：\n\n• 问我任何问题（每次调用会从你的账户余额扣费）\n• 让我帮你写作、翻译、生成代码\n• 切换不同模型来体验\n\n试试看吧！',
  '介绍': 'LLM-C SDK 是一款把「大模型调用 + 浏览器自动授权 + 微信充值 + 余额计费 + 开发者分润」一体化的 Python SDK。\n\n对开发者来说：只需 2 行配置即可接入付费能力\n对用户来说：浏览器授权 + 扫码充值 = 直接使用\n\n你正在体验的这个 Demo 就是用它搭建的！',
  '价格': `当前模型定价（演示用）：\n\n• GPT-3.5: ¥ 0.01 / 次\n• GPT-4o: ¥ 0.05 / 次\n• Claude Sonnet: ¥ 0.03 / 次\n\n真实 SDK 中价格会根据实际 Token 数计费。你现在可以充个 ¥9 体验包试试看～`,
  'default': '这是一个很好的问题！让我从几个角度来回答：\n\n1. 首先，这个问题的核心是理解需求本身\n2. 其次，需要考虑实际落地场景\n3. 最后，给出可执行的方案\n\n💡 小贴士：你正在使用的是 LLM-C SDK 演示版 —— 真实部署时，每次调用都会从你的账户余额中扣费。余额不足时 SDK 会自动跳转到充值页面。'
};

// ============== 角色 Tab 切换 ==============
document.querySelectorAll('.role-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.role-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.role-panel').forEach(p => p.classList.remove('active'));
    tab.classList.add('active');
    const role = tab.dataset.role;
    document.getElementById('panel-' + role).classList.add('active');
  });
});

// ============== Toast 通知 ==============
function showToast(msg, type = 'success') {
  const toast = document.getElementById('toast');
  toast.className = 'toast ' + (type !== 'success' ? type : '');
  toast.textContent = msg;
  toast.classList.add('active');
  setTimeout(() => toast.classList.remove('active'), 2500);
}

// ============== Modal 控制 ==============
function closeModal(modalId) {
  document.getElementById(modalId).classList.remove('active');
}
document.querySelectorAll('.modal').forEach(m => {
  m.addEventListener('click', (e) => {
    if (e.target === m) m.classList.remove('active');
  });
});

// ============== 开发者视角 ==============
function copyCode() {
  const code = document.querySelector('#sdk-code pre').innerText;
  navigator.clipboard?.writeText(code);
  showToast('✅ 配置代码已复制到剪贴板');
}

function updateRevenue() {
  const v = document.getElementById('revenue-slider').value;
  document.getElementById('revenue-value').textContent = v + '%';
}

function publishApp() {
  const name = document.getElementById('app-name').value || '我的 AI 应用';
  const revenue = document.getElementById('revenue-slider').value;
  const appId = 'app_' + Math.random().toString(36).substr(2, 6);

  document.getElementById('app-id-display').textContent = appId;
  showToast(`🚀 应用「${name}」已发布，分润比例 ${revenue}%`);
}

// 绘制分润图表
function renderRevenueChart() {
  const data = [85.4, 112.3, 156.8, 142.5, 198.6, 224.8, 248.3];
  const labels = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
  const max = Math.max(...data);
  const chart = document.getElementById('revenue-chart');
  chart.innerHTML = data.map((v, i) => `
    <div class="chart-bar">
      <div class="bar-value">¥${v}</div>
      <div class="bar" style="height:${(v / max * 140).toFixed(0)}px"></div>
      <div class="bar-label">${labels[i]}</div>
    </div>
  `).join('');
}
renderRevenueChart();

// ============== C端用户视角 ==============
function showAuthModal() {
  document.getElementById('auth-modal').classList.add('active');
}

function authSuccess() {
  isAuthorized = true;
  closeModal('auth-modal');
  showToast('✅ 授权成功，你已登录到 LLM-C SDK 账户');
}

function showRechargeModal() {
  document.getElementById('recharge-modal').classList.add('active');
  document.querySelectorAll('.package').forEach((p, i) => {
    p.classList.remove('selected');
    if (i === 1) p.classList.add('selected');
  });
  selectedPackage = 29;
  updatePaymentDisplay();
}

function selectPackage(el, amount) {
  document.querySelectorAll('.package').forEach(p => p.classList.remove('selected'));
  el.classList.add('selected');
  selectedPackage = amount;
  updatePaymentDisplay();
}

function selectPayment(el, type) {
  document.querySelectorAll('.payment-chips .chip').forEach(c => c.classList.remove('selected'));
  el.classList.add('selected');
  selectedPayment = type;
  updatePaymentDisplay();
}

function updatePaymentDisplay() {
  document.getElementById('payment-amount').textContent = '¥ ' + selectedPackage;
  document.getElementById('payment-name').textContent = selectedPayment === 'wechat' ? '微信' : '支付宝';
}

function paymentSuccess() {
  closeModal('recharge-modal');
  userBalance += selectedPackage;
  updateBalance();
  showToast(`💳 充值成功 ¥${selectedPackage}，余额 ¥${userBalance.toFixed(2)}`);
}

function updateBalance() {
  document.getElementById('user-balance').textContent = '¥ ' + userBalance.toFixed(2);
}

function selectModel(el, model) {
  document.querySelectorAll('.panel-card .chip-group .chip').forEach(c => {
    if (c.textContent.includes('GPT-3.5') || c.textContent.includes('GPT-4o') || c.textContent.includes('Claude')) {
      c.classList.remove('selected');
    }
  });
  el.classList.add('selected');
  currentModel = model;
  showToast(`💡 已切换到 ${model}`, 'info');
}

// 发送消息
function sendChat() {
  const input = document.getElementById('chat-input');
  const msg = input.value.trim();
  if (!msg) return;

  // 检查授权
  if (!isAuthorized) {
    showToast('⚠️ 请先完成浏览器授权', 'info');
    showAuthModal();
    return;
  }

  const cost = MODEL_PRICES[currentModel];

  // 检查余额
  if (userBalance < cost) {
    document.getElementById('need-amount').textContent = '¥ ' + cost.toFixed(2);
    document.getElementById('low-balance-modal').classList.add('active');
    return;
  }

  // 扣费
  userBalance -= cost;
  callCount++;
  callTotalCost += cost;
  updateBalance();

  document.getElementById('call-count').textContent = callCount;
  document.getElementById('call-cost').textContent = '¥ ' + callTotalCost.toFixed(2);

  // 显示用户消息
  const chatWindow = document.getElementById('chat-window');
  const userMsg = document.createElement('div');
  userMsg.className = 'chat-msg user';
  userMsg.textContent = msg;
  chatWindow.appendChild(userMsg);

  input.value = '';

  // 模拟AI思考
  const thinking = document.createElement('div');
  thinking.className = 'chat-msg assistant';
  thinking.innerHTML = '🤔 正在思考... <span style="font-size:11px;color:var(--text-muted)">(调用 ' + currentModel + ')</span>';
  chatWindow.appendChild(thinking);
  chatWindow.scrollTop = chatWindow.scrollHeight;

  setTimeout(() => {
    let reply = MOCK_REPLIES.default;
    for (const key in MOCK_REPLIES) {
      if (key !== 'default' && msg.includes(key)) {
        reply = MOCK_REPLIES[key];
        break;
      }
    }
    thinking.innerHTML = reply + `<div class="call-cost">${currentModel} · 扣费 ¥${cost.toFixed(2)} · 剩余余额 ¥${userBalance.toFixed(2)}</div>`;
    chatWindow.scrollTop = chatWindow.scrollHeight;

    // 添加到历史
    callHistory.unshift({
      time: new Date().toLocaleTimeString('zh-CN', { hour12: false }),
      model: currentModel,
      msg: msg,
      cost: cost
    });
  }, 900 + Math.random() * 800);
}

// 历史记录
function showHistory() {
  document.getElementById('history-modal').classList.add('active');
  const list = document.getElementById('history-list');
  if (callHistory.length === 0) {
    list.innerHTML = '<p class="empty">暂无调用记录 · 去和 AI 聊两句吧！</p>';
    return;
  }
  list.innerHTML = callHistory.map(h => `
    <div class="history-item">
      <div>
        <span class="model">${h.model}</span>
        <span class="preview">${h.msg}</span>
      </div>
      <div>
        <span class="cost">-¥${h.cost.toFixed(2)}</span>
        <span class="time"> · ${h.time}</span>
      </div>
    </div>
  `).join('');
}

// ============== ESC 关闭弹窗 ==============
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal.active').forEach(m => m.classList.remove('active'));
  }
});

// 初始欢迎
setTimeout(() => {
  showToast('👋 欢迎体验 LLM-C SDK Demo！点击顶部切换三种角色视角', 'info');
}, 500);
