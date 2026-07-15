// stats.js - 勤政/仁德/享乐 三轴属性 + 勋章/皮肤
// 累计属性、勋章解锁、皮肤切换

const Stats = (() => {
  const MEDALS = [
    { id: 'first-day', name: '登基首日', icon: '👑', desc: '完成首次登基', check: (p) => p.createdAt ? true : false },
    { id: 'diligent-10', name: '勤政爱民', icon: '📜', desc: '勤政值达 10', check: (p) => p.stats.diligence >= 10 },
    { id: 'benevolent-10', name: '仁德布施', icon: '🪷', desc: '仁德值达 10', check: (p) => p.stats.benevolence >= 10 },
    { id: 'indulgent-10', name: '享乐天子', icon: '🎭', desc: '享乐值达 10', check: (p) => p.stats.indulgence >= 10 },
    { id: 'todo-3', name: '勤勉御批', icon: '✍️', desc: '累计完成 3 件奏折', check: (p) => (p.completedTodos || 0) >= 3 },
    { id: 'week-1', name: '一朝天子', icon: '🏯', desc: '使用满 7 天', check: (p) => (p.daysActive || 0) >= 7 },
    { id: 'all-3', name: '三德兼备', icon: '🐉', desc: '三轴属性均达 5', check: (p) => p.stats.diligence >= 5 && p.stats.benevolence >= 5 && p.stats.indulgence >= 5 }
  ];

  const SKINS = [
    { id: 'default', name: '紫禁城', unlock: (p) => true },
    { id: 'dragon', name: '龙袍加身', unlock: (p) => p.stats.diligence >= 15 },
    { id: 'garden', name: '戏台', unlock: (p) => p.stats.indulgence >= 15 },
    { id: 'lotus', name: '莲花宝座', unlock: (p) => p.stats.benevolence >= 15 }
  ];

  function getProfile() {
    return Storage.get(Storage.KEYS.PROFILE) || {
      version: 2,
      title: '未登基',
      cityKey: Intl.DateTimeFormat().resolvedOptions().timeZone,
      wakeTime: '07:00',
      gender: 'male',
      imperialAnchor: {
        timezone: 'Asia/Shanghai',
        time: '04:00',
        label: '寅正初刻'
      },
      wakeOffsetMinutes: 0,
      createdAt: null,
      pomodoro: { focus: 25, shortBreak: 5, longBreak: 15, longEvery: 4 },
      stats: { diligence: 0, benevolence: 0, indulgence: 0 },
      medals: [],
      completedTodos: 0,
      daysActive: 0
    };
  }

  function saveProfile(p) {
    // 原地计算并写入最新勋章,避免与 refreshMedals 互相调用导致栈溢出
    const earned = MEDALS.filter(m => m.check(p)).map(m => m.id);
    p.medals = earned;
    Storage.set(Storage.KEYS.PROFILE, p);
  }

  function addStat(updates) {
    const p = getProfile();
    p.stats.diligence = (p.stats.diligence || 0) + (updates.diligence || 0);
    p.stats.benevolence = (p.stats.benevolence || 0) + (updates.benevolence || 0);
    p.stats.indulgence = (p.stats.indulgence || 0) + (updates.indulgence || 0);
    p.stats.diligence = Math.max(0, p.stats.diligence);
    p.stats.benevolence = Math.max(0, p.stats.benevolence);
    p.stats.indulgence = Math.max(0, p.stats.indulgence);
    saveProfile(p);
    return p.stats;
  }

  function incTodo() {
    const p = getProfile();
    p.completedTodos = (p.completedTodos || 0) + 1;
    saveProfile(p);
  }

  function refreshMedals() {
    // 独立方法:仅刷新勋章并持久化,不再调用 saveProfile 避免循环
    const p = getProfile();
    const earned = MEDALS.filter(m => m.check(p)).map(m => m.id);
    p.medals = earned;
    Storage.set(Storage.KEYS.PROFILE, p);
  }

  function getMedals() { return MEDALS; }
  function getSkins() { return SKINS; }

  function getEarnedMedals() {
    return MEDALS.filter(m => m.check(getProfile()));
  }

  function getUnlockedSkins() {
    return SKINS.filter(s => s.unlock(getProfile()));
  }

  // 缓存 DOM 节点,避免每次都重建
  let _panelNodes = null;
  function _buildPanelOnce() {
    if (_panelNodes) return _panelNodes;
    const panel = document.getElementById('stats-panel');
    if (!panel) return null;
    panel.innerHTML = '';
    const titleDiv = document.createElement('div');
    titleDiv.className = 'text-center font-kai text-amber-100 mb-3 text-lg';
    titleDiv.textContent = '';
    panel.appendChild(titleDiv);

    const container = document.createElement('div');
    container.className = 'space-y-3';
    panel.appendChild(container);

    function makeBar(label, icon, key, gradientFrom, gradientTo) {
      const row = document.createElement('div');
      const head = document.createElement('div');
      head.className = 'flex justify-between text-xs text-amber-200/80 mb-1';
      const nameSpan = document.createElement('span');
      nameSpan.className = 'font-kai';
      nameSpan.textContent = icon + ' ' + label;
      const valSpan = document.createElement('span');
      valSpan.className = 'font-mono';
      valSpan.textContent = '0';
      head.appendChild(nameSpan);
      head.appendChild(valSpan);
      row.appendChild(head);

      const track = document.createElement('div');
      track.className = 'h-3 bg-amber-900/50 rounded-full overflow-hidden border border-amber-700/40';
      const fill = document.createElement('div');
      fill.className = 'h-full transition-all duration-700';
      fill.style.width = '0%';
      fill.style.backgroundImage = 'linear-gradient(to right, ' + gradientFrom + ', ' + gradientTo + ')';
      track.appendChild(fill);
      row.appendChild(track);
      return { row, valSpan, fill };
    }
    const diligence = makeBar('勤政值', '📜', 'diligence', '#b91c1c', '#f59e0b');
    const benevolence = makeBar('仁德值', '🪷', 'benevolence', '#047857', '#fde047');
    const indulgence = makeBar('享乐值', '🎭', 'indulgence', '#7e22ce', '#f472b6');
    container.appendChild(diligence.row);
    container.appendChild(benevolence.row);
    container.appendChild(indulgence.row);
    _panelNodes = { panel, titleDiv, diligence, benevolence, indulgence };
    return _panelNodes;
  }
  function renderPanel() {
    const p = getProfile();
    const stats = p.stats || { diligence: 0, benevolence: 0, indulgence: 0 };
    const max = 30;
    const ratio = (k) => Math.min(100, (stats[k] / max) * 100);
    const nodes = _buildPanelOnce();
    if (!nodes) return;
    // 仅更新文本与宽度,不动 className
    nodes.titleDiv.textContent = p.title || '未登基';
    nodes.diligence.valSpan.textContent = String(stats.diligence || 0);
    nodes.diligence.fill.style.width = ratio('diligence') + '%';
    nodes.benevolence.valSpan.textContent = String(stats.benevolence || 0);
    nodes.benevolence.fill.style.width = ratio('benevolence') + '%';
    nodes.indulgence.valSpan.textContent = String(stats.indulgence || 0);
    nodes.indulgence.fill.style.width = ratio('indulgence') + '%';
  }

  // 勋章网格缓存
  let _medalNodes = null;
  function _buildMedalsOnce() {
    if (_medalNodes) return _medalNodes;
    const container = document.getElementById('medals-grid');
    if (!container) return null;
    container.innerHTML = '';
    const nodes = [];
    MEDALS.forEach(m => {
      const div = document.createElement('div');
      div.className = 'text-center p-3 rounded-lg border border-amber-900/30 bg-amber-900/20 grayscale opacity-50 cursor-help';
      div.title = m.desc;
      const iconDiv = document.createElement('div');
      iconDiv.className = 'text-3xl mb-1';
      iconDiv.textContent = m.icon;
      const nameDiv = document.createElement('div');
      nameDiv.className = 'text-xs font-kai text-amber-200/40';
      nameDiv.textContent = m.name;
      const descDiv = document.createElement('div');
      descDiv.className = 'text-[10px] text-amber-200/30 mt-1';
      descDiv.textContent = m.desc;
      div.appendChild(iconDiv);
      div.appendChild(nameDiv);
      div.appendChild(descDiv);
      container.appendChild(div);
      nodes.push({ div, nameDiv });
    });
    _medalNodes = nodes;
    return nodes;
  }
  function renderMedals() {
    const nodes = _buildMedalsOnce();
    if (!nodes) return;
    const p = getProfile();
    const earned = new Set(p.medals || []);
    for (let i = 0; i < nodes.length && i < MEDALS.length; i++) {
      const ok = earned.has(MEDALS[i].id);
      const n = nodes[i];
      n.div.className = 'text-center p-3 rounded-lg border cursor-help ' +
        (ok ? 'border-amber-400/60 bg-amber-100/10' : 'border-amber-900/30 bg-amber-900/20 grayscale opacity-50');
      n.nameDiv.className = 'text-xs font-kai ' + (ok ? 'text-amber-100' : 'text-amber-200/40');
    }
  }

  return {
    getProfile, saveProfile, addStat, incTodo, refreshMedals,
    getMedals, getSkins, getEarnedMedals, getUnlockedSkins,
    renderPanel, renderMedals
  };
})();
