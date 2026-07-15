// timeline.js - 帝王一日时间轴
// 十二时辰 + 初正细分,覆盖完整 24 小时
// 配色:寅/卯/辰/巳/午/未/申/酉/戌/亥 12 段,每段 2h,初/正各 1h
// v1.3 build 2026-07-14T07-06-50Z

const Timeline = (() => {
  // 24 段,每段 1 小时,初/正细分
  // 时间区间 [start, end),end 可为 24(代表次日 0 点)
  const STAGES = [
    // 子(23:00-01:00)
    { id: 'zi-chu', shichen: '子', part: '初', label: '夜半安寝', icon: '🌙', range: [23, 24], color: '#1A1A1A', type: 'rest' },
    { id: 'zi-zheng', shichen: '子', part: '正', label: '夜半安寝', icon: '🌙', range: [0, 1], color: '#1A1A1A', type: 'rest' },
    // 丑(01:00-03:00)
    { id: 'chou-chu', shichen: '丑', part: '初', label: '鸡鸣深眠', icon: '🛌', range: [1, 2], color: '#2A2A3A', type: 'rest' },
    { id: 'chou-zheng', shichen: '丑', part: '正', label: '鸡鸣深眠', icon: '🛌', range: [2, 3], color: '#2A2A3A', type: 'rest' },
    // 寅(03:00-05:00)
    { id: 'yin-chu', shichen: '寅', part: '初', label: '内侍备驾', icon: '🕯️', range: [3, 4], color: '#7B4A3A', type: 'prepare' },
    { id: 'yin-zheng', shichen: '寅', part: '正', label: '御驾起身', icon: '🌅', range: [4, 5], color: '#A4243B', type: 'wake' },
    // 卯(05:00-07:00)
    { id: 'mao-chu', shichen: '卯', part: '初', label: '御书房早读', icon: '📖', range: [5, 6], color: '#7BA67D', type: 'study' },
    { id: 'mao-zheng', shichen: '卯', part: '正', label: '御书房早读', icon: '📖', range: [6, 7], color: '#7BA67D', type: 'study' },
    // 辰(07:00-09:00)
    { id: 'chen-chu', shichen: '辰', part: '初', label: '御膳早膳', icon: '🍵', range: [7, 8], color: '#D4A24C', type: 'life' },
    { id: 'chen-zheng', shichen: '辰', part: '正', label: '御膳早膳', icon: '🍵', range: [8, 9], color: '#D4A24C', type: 'life' },
    // 巳(09:00-11:00)
    { id: 'si-chu', shichen: '巳', part: '初', label: '御门听政', icon: '📜', range: [9, 10], color: '#A4243B', type: 'work' },
    { id: 'si-zheng', shichen: '巳', part: '正', label: '御门听政', icon: '📜', range: [10, 11], color: '#A4243B', type: 'work' },
    // 午(11:00-13:00)
    { id: 'wu-chu', shichen: '午', part: '初', label: '午朝议事', icon: '⛩️', range: [11, 12], color: '#C8A45C', type: 'work' },
    { id: 'wu-zheng', shichen: '午', part: '正', label: '午膳休憩', icon: '🍱', range: [12, 13], color: '#C8A45C', type: 'rest' },
    // 未(13:00-15:00)
    { id: 'wei-chu', shichen: '未', part: '初', label: '书房理政', icon: '🖌️', range: [13, 14], color: '#5C6E7A', type: 'work' },
    { id: 'wei-zheng', shichen: '未', part: '正', label: '书房理政', icon: '🖌️', range: [14, 15], color: '#5C6E7A', type: 'work' },
    // 申(15:00-17:00)
    { id: 'shen-chu', shichen: '申', part: '初', label: '御批奏章', icon: '✍️', range: [15, 16], color: '#7B5A3A', type: 'todo' },
    { id: 'shen-zheng', shichen: '申', part: '正', label: '御批奏章', icon: '✍️', range: [16, 17], color: '#7B5A3A', type: 'todo' },
    // 酉(17:00-19:00)
    { id: 'you-chu', shichen: '酉', part: '初', label: '晚课静修', icon: '🧘', range: [17, 18], color: '#8B6F47', type: 'review' },
    { id: 'you-zheng', shichen: '酉', part: '正', label: '晚课静修', icon: '🧘', range: [18, 19], color: '#8B6F47', type: 'review' },
    // 戌(19:00-21:00)
    { id: 'xu-chu', shichen: '戌', part: '初', label: '宫闱休闲', icon: '🎭', range: [19, 20], color: '#C8A45C', type: 'leisure' },
    { id: 'xu-zheng', shichen: '戌', part: '正', label: '宫闱休闲', icon: '🎭', range: [20, 21], color: '#C8A45C', type: 'leisure' },
    // 亥(21:00-23:00)
    { id: 'hai-chu', shichen: '亥', part: '初', label: '安寝就寝', icon: '🛏️', range: [21, 22], color: '#2A2A3A', type: 'rest' },
    { id: 'hai-zheng', shichen: '亥', part: '正', label: '安寝就寝', icon: '🛏️', range: [22, 23], color: '#1A1A1A', type: 'rest' }
  ];

  let lastShichenNotified = null;
  let onStageChangeCallbacks = [];

  // 给定小时数,找当前阶段
  function getCurrentStage(date) {
    const h = date.getHours();
    const m = date.getMinutes();
    // 23:00-24:00 是子初,0:00-1:00 是子正
    return STAGES.find(s => {
      if (s.range[0] === 23) {
        return h === 23;
      }
      return h >= s.range[0] && h < s.range[1];
    }) || STAGES[0];
  }

  function getStageProgress(date) {
    const stage = getCurrentStage(date);
    if (!stage) return { stage: null, progress: 0, percent: 0 };
    const h = date.getHours();
    const m = date.getMinutes();
    // 子初 [23, 24): 已过分钟 = (h-23)*60 + m
    let elapsed;
    if (stage.range[0] === 23) {
      elapsed = (h - 23) * 60 + m;
    } else {
      elapsed = (h - stage.range[0]) * 60 + m;
    }
    const total = 60; // 每段 60 分钟
    return { stage, progress: elapsed, percent: (elapsed / total) * 100 };
  }

  // 获取当前 shichen(子丑寅...),用于变化通知
  function getCurrentShichen(date) {
    return getCurrentStage(date).shichen;
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  // 缓存 DOM 节点,首次构建后只更新文本和宽度
  let _stageNodes = null;
  function _buildOnce() {
    const wrap = document.getElementById('timeline-stages');
    if (!wrap) return null;
    if (_stageNodes && _stageNodes.wrap === wrap && _stageNodes.nodes.length === STAGES.length) {
      return _stageNodes;
    }
    wrap.innerHTML = '';
    const nodes = STAGES.map((s, i) => {
      const div = document.createElement('div');
      div.className = 'relative flex-1 min-w-0 group';
      const inner = document.createElement('div');
      inner.className = 'flex flex-col items-center h-full';

      const bar = document.createElement('div');
      bar.className = 'w-full h-1 bg-gradient-to-r from-amber-700/40 via-amber-500/60 to-amber-700/40 rounded-t mb-1';
      inner.appendChild(bar);

      const shichenEl = document.createElement('div');
      shichenEl.className = 'font-kai text-sm text-amber-100/40';
      shichenEl.textContent = s.shichen + s.part;
      inner.appendChild(shichenEl);

      const iconEl = document.createElement('div');
      iconEl.className = 'text-xl my-1 transition-transform';
      iconEl.textContent = s.icon;
      inner.appendChild(iconEl);

      const labelEl = document.createElement('div');
      labelEl.className = 'font-kai text-[10px] text-center leading-tight text-amber-100/70 px-1';
      labelEl.style.minHeight = '2.5em';
      labelEl.textContent = (s.type === 'rest' && s.part === '初') ? '' : s.label;
      inner.appendChild(labelEl);

      // 今日剧本行:用户自填 > 默认值
      const scriptLineEl = document.createElement('div');
      scriptLineEl.className = 'script-line font-kai text-[10px] text-center text-amber-200/50 mt-0.5 px-1 truncate w-full';
      scriptLineEl.title = '';
      const scriptTextEl = document.createElement('span');
      scriptTextEl.className = 'script-text cursor-pointer hover:text-amber-100';
      const scriptEditBtn = document.createElement('span');
      scriptEditBtn.className = 'script-edit-btn text-amber-200/40 hover:text-amber-100 ml-0.5 cursor-pointer';
      scriptEditBtn.textContent = '✎';
      scriptEditBtn.title = '编辑剧本';
      scriptLineEl.appendChild(scriptTextEl);
      scriptLineEl.appendChild(scriptEditBtn);
      inner.appendChild(scriptLineEl);

      const progressWrap = document.createElement('div');
      progressWrap.className = 'w-full h-2 bg-amber-900/40 rounded-full overflow-hidden mt-2 border border-amber-700/40';
      const progressBar = document.createElement('div');
      progressBar.className = 'h-full rounded-full transition-all duration-700 bg-transparent';
      progressBar.style.width = '0%';
      progressWrap.appendChild(progressBar);
      inner.appendChild(progressWrap);

      const rangeEl = document.createElement('div');
      rangeEl.className = 'text-[9px] text-amber-200/40 mt-1 font-mono';
      rangeEl.textContent = String(s.range[0]).padStart(2, '0') + ':00-' + (s.range[1] === 24 ? '24:00' : String(s.range[1]).padStart(2, '0') + ':00');
      inner.appendChild(rangeEl);

      div.appendChild(inner);
      wrap.appendChild(div);

      return { div, shichenEl, iconEl, labelEl, progressBar, scriptLineEl, scriptTextEl, scriptEditBtn, current: -1, past: -1, s };
    });
    _stageNodes = { wrap, nodes };
    _renderScripts();
    _bindScriptEdit();
    return _stageNodes;
  }

  // 增量更新:只改当前段与已过段的 className/width
  function render() {
    const built = _buildOnce();
    if (!built) return;
    const now = new Date();
    const { stage: current, percent } = getStageProgress(now);
    const curId = current ? current.id : '';
    // 合并组信息
    const groups = Script.getMergedGroups ? Script.getMergedGroups() : {};
    // 算出"代表节点":主节点代表整组;非主节点被合并
    // 如果当前段在某个合并组里,主节点应该高亮
    const currentGroupPrimary = (() => {
      for (const p in groups) {
        if (p === current.id) return p;
        if ((groups[p] || []).indexOf(current.id) >= 0) return p;
      }
      return current.id;
    })();
    STAGES.forEach((s, i) => {
      const n = built.nodes[i];
      // 被合并隐藏的节点:跳过视觉更新
      if (n.div.style.display === 'none') return;
      // 主节点若整组都被合并(本节点为 primary)
      // 整组是否"经过"取决于最早 start 是否在过去
      const groupMembers = [s.id, ...((groups[s.id]) || [])];
      // 找出"代表当前"
      const isCurrentRep = currentGroupPrimary === s.id;
      // 是否已过
      const isPast = groupMembers.some(mid => {
        const ms = STAGES.find(x => x.id === mid);
        return ms ? isStagePast(ms, current) : false;
      });
      const isCurrent = isCurrentRep;
      const stagePercent = isCurrent ? percent : (isPast ? 100 : 0);
      // 仅在状态变化时改 className,避免每次都重设 class
      if (n.current !== (isCurrent ? 1 : 0) || n.past !== (isPast ? 1 : 0)) {
        n.current = isCurrent ? 1 : 0;
        n.past = isPast ? 1 : 0;
        n.div.className = 'relative flex-1 min-w-0 group ' + (isCurrent ? 'z-10' : '');
        n.shichenEl.className = 'font-kai text-sm ' + (isCurrent ? 'text-yellow-200 text-xl' : isPast ? 'text-amber-200/60' : 'text-amber-100/40');
        n.iconEl.className = 'text-xl my-1 ' + (isCurrent ? 'scale-125' : '') + ' transition-transform';
        n.labelEl.className = 'font-kai text-[10px] text-center leading-tight ' + (isCurrent ? 'text-yellow-100 font-bold' : 'text-amber-100/70') + ' px-1';
        n.progressBar.className = 'h-full rounded-full transition-all duration-700 ' +
          (isCurrent ? 'bg-gradient-to-r from-yellow-300 via-amber-400 to-yellow-300 shadow-lg' : isPast ? 'bg-amber-600/80' : 'bg-transparent');
        if (isCurrent) {
          n.progressBar.style.backgroundSize = '200% 100%';
          n.progressBar.style.animation = 'shimmer 2s linear infinite';
        } else {
          n.progressBar.style.backgroundSize = '';
          n.progressBar.style.animation = '';
        }
      }
      // 宽度变化就更新
      const w = stagePercent + '%';
      if (n.progressBar.style.width !== w) n.progressBar.style.width = w;
    });
  }

  // 判断 s 是否在 current 之前(已过)
  function isStagePast(s, current) {
    // 把 24 当作 0 处理:子初 [23, 24) 是昨日末尾
    const sStart = s.range[0] === 23 ? -1 : s.range[0];
    const cStart = current.range[0] === 23 ? -1 : current.range[0];
    return sStart < cStart;
  }

  function checkShichenChange(date) {
    const shichen = getCurrentShichen(date);
    if (!shichen) return;
    if (lastShichenNotified === shichen) return;
    const last = lastShichenNotified;
    lastShichenNotified = shichen;
    if (last !== null) {
      Audio.chuanzhi();
      const stage = getCurrentStage(date);
      onStageChangeCallbacks.forEach(cb => cb(stage, last));
    }
  }

  // 渲染 24 段剧本(读 Script 模块)
  function _renderScripts() {
    if (!_stageNodes) return;
    _renderMerged();
    _stageNodes.nodes.forEach(n => {
      // 如果本节点被合并隐藏,直接返回(避免覆盖 hidden)
      if (n.div.style.display === 'none') return;
      const text = Script.getStageText(n.s.id);
      n.scriptTextEl.textContent = text;
      n.scriptLineEl.title = text;
      const isUser = Script.getToday().find(x => x.id === n.s.id && x.source === 'user');
      if (isUser) {
        n.scriptTextEl.className = 'script-text cursor-pointer hover:text-amber-200 text-amber-300';
      } else {
        n.scriptTextEl.className = 'script-text cursor-pointer hover:text-amber-100 text-amber-200/50';
      }
    });
  }

  // 处理合并态:隐藏 secondary,primary 显示合并后的标签/时间
  function _renderMerged() {
    if (!_stageNodes) return;
    const groups = Script.getMergedGroups ? Script.getMergedGroups() : {};
    // 先全部恢复显示
    _stageNodes.nodes.forEach(n => { n.div.style.display = ''; });
    // 主节点(被合并组里非 primary 的): 隐藏
    // 同时把主节点的内容更新为合并后的标签/时间/默认文案
    const stagesById = {};
    STAGES.forEach(s => { stagesById[s.id] = s; });
    Object.keys(groups || {}).forEach(primaryId => {
      const members = groups[primaryId] || [];
      const primaryNode = _stageNodes.nodes.find(n => n.s.id === primaryId);
      if (!primaryNode) return;
      // 隐藏 members
      members.forEach(mid => {
        const mn = _stageNodes.nodes.find(n => n.s.id === mid);
        if (mn) mn.div.style.display = 'none';
      });
      // 计算合并后的时间范围
      const all = [primaryId, ...members].map(id => stagesById[id]).filter(Boolean);
      if (all.length === 0) return;
      // 按 range[0] 排序(子初 23 排第一)
      all.sort((a, b) => {
        const a0 = a.range[0] === 23 ? -1 : a.range[0];
        const b0 = b.range[0] === 23 ? -1 : b.range[0];
        return a0 - b0;
      });
      const start = all[0].range[0];
      const end = all[all.length - 1].range[1];
      // 更新主节点的范围显示
      primaryNode.rangeEl.textContent = String(start).padStart(2, '0') + ':00-' + (end === 24 ? '24:00' : String(end).padStart(2, '0') + ':00');
      // 更新主节点的标签:合并所有默认 label
      const labels = all.map(s => s.label);
      const uniqueLabels = labels.filter((v, i) => labels.indexOf(v) === i);
      primaryNode.labelEl.textContent = uniqueLabels.join('·');
      // 主节点的默认脚本:取第一个
      primaryNode.scriptTextEl.textContent = Script.getDefault(primaryId);
      primaryNode.scriptLineEl.title = primaryNode.scriptTextEl.textContent;
      // 视觉增强:合并的主节点加个合并标识
      if (members.length > 0) {
        primaryNode.div.classList.add('merged-primary');
      } else {
        primaryNode.div.classList.remove('merged-primary');
      }
    });
    // 清除非 primary 节点的 merged-primary 标记
    _stageNodes.nodes.forEach(n => {
      const inGroup = Object.values(groups || {}).some(m => m.indexOf(n.s.id) >= 0);
      if (!inGroup) n.div.classList.remove('merged-primary');
    });
  }

  // 绑定编辑交互:点 ✎ 或点文字 → 进入行内编辑
  function _bindScriptEdit() {
    if (!_stageNodes) return;
    _stageNodes.nodes.forEach(n => {
      const handleEdit = (ev) => {
        ev.stopPropagation();
        _enterEdit(n);
      };
      n.scriptTextEl.addEventListener('click', handleEdit);
      n.scriptEditBtn.addEventListener('click', handleEdit);
    });
  }

  function _enterEdit(n) {
    if (n.scriptLineEl.querySelector('input')) return;
    const current = Script.getStageText(n.s.id);
    const input = document.createElement('input');
    input.type = 'text';
    input.maxLength = 12;
    input.value = current;
    input.className = 'script-edit-input w-full text-center text-[10px] font-kai bg-amber-900/40 border border-amber-700/60 rounded text-amber-100 px-1 outline-none';
    n.scriptTextEl.style.display = 'none';
    n.scriptEditBtn.style.display = 'none';
    n.scriptLineEl.insertBefore(input, n.scriptLineEl.firstChild);
    input.focus();
    input.select();
    const save = () => {
      const v = input.value;
      Script.setStageText(n.s.id, v);
      n.scriptTextEl.style.display = '';
      n.scriptEditBtn.style.display = '';
      if (input.parentNode) input.parentNode.removeChild(input);
      _renderScripts();
      Audio.click();
    };
    const cancel = () => {
      n.scriptTextEl.style.display = '';
      n.scriptEditBtn.style.display = '';
      if (input.parentNode) input.parentNode.removeChild(input);
    };
    input.addEventListener('blur', save);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); save(); }
      else if (e.key === 'Escape') { e.preventDefault(); cancel(); }
    });
  }

  // 对外:刷新全部 24 段剧本文本(给 Script 改动后调用)
  function refreshScripts() { _renderScripts(); }

  function tick() {
    render();
    checkShichenChange(new Date());
  }

  function onStageChange(cb) { onStageChangeCallbacks.push(cb); }

  function start() {
    lastShichenNotified = null;
    tick();
    if (window.__timelineTimer) clearInterval(window.__timelineTimer);
    window.__timelineTimer = setInterval(tick, 30000);
  }

  return { STAGES, getCurrentStage, getStageProgress, getCurrentShichen, render, start, onStageChange, refreshScripts };
})();
