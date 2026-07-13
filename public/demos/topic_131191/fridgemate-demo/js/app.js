/**
 * FridgeMate 主入口
 * 初始化数据库、绑定事件、启动应用
 */

const App = (() => {
  async function init() {
    // 初始化数据库
    await FridgeDB.init();
    console.log('FridgeMate DB initialized');

    // 请求通知权限
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    // 渲染库存
    Inventory.render();

    // 初始化对话上下文
    Chat.refreshContext();

    // 绑定事件
    Inventory.initEvents();
    Chat.initEvents();
    bindTabEvents();
    bindSettingsEvents();

    // 欢迎消息
    setTimeout(() => {
      Chat.addMessage('你好！我是冰箱精灵🧚 试试说"有什么肉"或"推荐菜谱"吧～', 'spirit');
    }, 600);

    // 定时刷新过期状态
    setInterval(() => {
      FridgeDB.refreshStatus();
    }, 60000);
  }

  function bindTabEvents() {
    const tabs = document.querySelectorAll('.tab-btn');
    const panels = document.querySelectorAll('.tab-panel');

    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const target = tab.dataset.tab;
        tabs.forEach(t => t.classList.remove('active'));
        panels.forEach(p => p.classList.remove('active'));
        tab.classList.add('active');
        document.getElementById(`panel-${target}`).classList.add('active');

        if (target === 'inventory') Inventory.render();
        if (target === 'chat') Chat.refreshContext();
      });
    });
  }

  function bindSettingsEvents() {
    document.getElementById('btn-fridge-type').addEventListener('click', showFridgeTypeSelector);
    document.getElementById('btn-reset').addEventListener('click', () => {
      if (confirm('确定要重置所有数据吗？此操作不可恢复！')) {
        FridgeDB.reset();
        Inventory.render();
        Chat.refreshContext();
        document.getElementById('chat-messages').innerHTML = '';
        Chat.addMessage('数据已重置，冰箱空空如也～试试说"冰箱加鸡蛋1盒"吧！', 'spirit');
      }
    });

    document.getElementById('btn-export').addEventListener('click', () => {
      const data = localStorage.getItem('fridgemate_db');
      if (!data) return alert('没有数据可导出');
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `fridgemate-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  function showFridgeTypeSelector() {
    const types = FridgeDB.getFridgeTypes();
    const current = FridgeDB.getFridgeConfig().type;
    const modal = document.getElementById('modal');
    const title = document.getElementById('modal-title');
    const form = document.getElementById('food-form');

    title.textContent = '选择冰箱类型';
    let html = '';
    for (const t of types) {
      const locs = t.zones.map(z => `${z.zone}：${z.locations.join('、')}`).join('<br>');
      html += `
        <div class="fridge-type-card ${t.name === current ? 'selected' : ''}" data-type="${t.name}">
          <span class="ftc-icon">${t.icon}</span>
          <div class="ftc-info">
            <div class="ftc-name">${t.name}</div>
            <div class="ftc-locs">${locs}</div>
          </div>
          ${t.name === current ? '<span class="ftc-check">✓</span>' : ''}
        </div>`;
    }
    html += `<div class="form-actions">
      <button type="button" class="btn btn-cancel" onclick="Inventory.closeModal()">取消</button>
    </div>`;

    form.innerHTML = html;
    form.dataset.mode = 'fridge';
    modal.classList.add('show');

    form.querySelectorAll('.fridge-type-card').forEach(card => {
      card.addEventListener('click', () => {
        const type = card.dataset.type;
        FridgeDB.setFridgeType(type);
        document.getElementById('fridge-type-label').textContent = type + ' ›';
        Inventory.render();
        Chat.refreshContext();
        Inventory.closeModal();
      });
    });
  }

  return { init };
})();

// 启动
document.addEventListener('DOMContentLoaded', () => App.init());