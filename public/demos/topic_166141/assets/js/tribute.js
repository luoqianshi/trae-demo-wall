// tribute.js - 奏折 ToDo 模块
// 增删改查、打卡、与"御批奏折"联动累计勤政值

const Tribute = (() => {
  const TYPES = [
    { id: 'politics', name: '政务', icon: '📜', stat: { diligence: 1 } },
    { id: 'study', name: '学问', icon: '📖', stat: { diligence: 1, benevolence: 0 } },
    { id: 'life', name: '起居', icon: '🍵', stat: { benevolence: 1 } },
    { id: 'leisure', name: '休闲', icon: '🎭', stat: { indulgence: 1 } }
  ];

  function list() {
    return Storage.get(Storage.KEYS.TODOS, []);
  }

  function save(list) {
    Storage.set(Storage.KEYS.TODOS, list);
  }

  function add({ title, type = 'politics' }) {
    if (!title || !title.trim()) return;
    const todos = list();
    todos.unshift({
      id: 't-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8),
      title: title.trim(),
      type,
      done: false,
      rewardClaimed: false,
      createdAt: new Date().toISOString(),
      completedAt: null
    });
    save(todos);
    Audio.click();
    render();
  }

  function toggle(id) {
    const todos = list();
    const t = todos.find(x => x.id === id);
    if (!t) return;
    const wasDone = t.done;
    t.done = !t.done;
    t.completedAt = t.done ? new Date().toISOString() : null;
    // PRD 5.4 验收 1: 同一任务反复勾选不重复计分
    // rewardClaimed 一旦置 true 就不再重置,即"该任务实例只奖励一次"
    save(todos);
    if (t.done) {
      if (!t.rewardClaimed) {
        const typeMeta = TYPES.find(tp => tp.id === t.type) || TYPES[0];
        Stats.addStat(typeMeta.stat);
        Stats.incTodo();
        t.rewardClaimed = true;
        save(todos);
        Audio.bell();
        const rewardVal = Object.values(typeMeta.stat)[0] || 0;
        showToast(`✓ 御批「${t.title}」完成,${typeMeta.name}属性 +${rewardVal}`);
      } else {
        // 已领过奖励,只切状态不再计分
        Audio.click();
      }
    } else {
      Audio.click();
    }
    render();
    Stats.renderPanel();
  }

  function remove(id) {
    let todos = list();
    todos = todos.filter(t => t.id !== id);
    save(todos);
    Audio.click();
    render();
  }

  function clearDone() {
    let todos = list();
    todos = todos.filter(t => !t.done);
    save(todos);
    render();
  }

  function render() {
    const list_el = document.getElementById('tribute-list');
    const count_el = document.getElementById('tribute-count');
    if (!list_el) return;
    const todos = list();
    if (count_el) {
      const done = todos.filter(t => t.done).length;
      count_el.textContent = `${done}/${todos.length}`;
    }
    list_el.innerHTML = '';
    if (todos.length === 0) {
      list_el.innerHTML = '<div class="text-xs text-amber-200/40 italic text-center py-6">尚无奏折,陛下请下旨</div>';
      return;
    }
    todos.forEach(t => {
      const typeMeta = TYPES.find(tp => tp.id === t.type) || TYPES[0];
      const div = document.createElement('div');
      div.className = `group flex items-center gap-2 p-3 mb-2 rounded border ${t.done ? 'border-amber-700/30 bg-amber-900/20' : 'border-amber-300/40 bg-amber-50/10 hover:bg-amber-50/20'} transition-all`;
      div.innerHTML = `
        <input type="checkbox" ${t.done ? 'checked' : ''} class="w-4 h-4 accent-red-700 cursor-pointer" data-id="${t.id}" data-action="toggle">
        <span class="tribute-status text-[10px] ml-1 font-kai ${t.done ? 'tribute-status-done' : 'tribute-status-pending'}">${t.done ? '✓ 御批 👑' : '待批'}</span>
        <div class="flex-1 min-w-0">
          <div class="font-kai text-sm ${t.done ? 'line-through text-amber-200/40' : 'text-amber-50'}">${escapeHtml(t.title)}</div>
          <div class="text-[10px] text-amber-200/50 flex gap-2 mt-0.5">
            <span>${typeMeta.icon} ${typeMeta.name}</span>
            <span>${new Date(t.createdAt).toLocaleString('zh-CN', { hour12: false })}</span>
          </div>
        </div>
        <button data-id="${t.id}" data-action="remove" class="opacity-0 group-hover:opacity-100 transition-opacity text-red-300 hover:text-red-100 text-xs">×</button>
      `;
      list_el.appendChild(div);
    });
    // 绑定事件
    list_el.querySelectorAll('[data-action="toggle"]').forEach(el => {
      el.addEventListener('change', (e) => toggle(e.target.dataset.id));
    });
    list_el.querySelectorAll('[data-action="remove"]').forEach(el => {
      el.addEventListener('click', (e) => remove(e.target.dataset.id));
    });
  }

  function escapeHtml(s) {
    return s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  function showToast(text) {
    const el = document.getElementById('toast');
    if (!el) return;
    el.textContent = text;
    // toast CSS 默认 pointer-events: none,显示时强制 auto 让其可读/可点
    el.classList.remove('opacity-0');
    el.classList.add('opacity-100', 'pointer-events-auto');
    setTimeout(() => {
      el.classList.add('opacity-0');
      el.classList.remove('opacity-100', 'pointer-events-auto');
    }, 2500);
  }

  function getTypes() { return TYPES; }

  return { list, add, toggle, remove, clearDone, render, getTypes, showToast };
})();
