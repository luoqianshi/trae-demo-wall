// scriptModal.js - 行程修改弹窗 v1.5
// 重大调整:
// 1. 合并相邻时段后,展示为「1 个新节点」,不可编辑,只显示默认文案
// 2. 修改行程后,必须点「保存修改」才生效
// 3. 编辑时输入框有 dirty 提示,合并状态实时显示在时间轴
// 4. 合并组用 Script.getMergedGroups 持久化,跨刷新/重开保留

const ScriptModal = (() => {
  // ---- 内部状态 ----
  // _pendingTexts: { stageId: '编辑后的文本' } 仅在弹窗内有效,save 时才写 storage
  let _pendingTexts = {};
  // _pendingMergedGroups: { 'primaryId': ['memberId', ...] } 仅在弹窗内有效
  let _pendingMergedGroups = {};
  // _dirty: 是否有未保存修改
  let _dirty = false;

  // ---- 工具函数 ----
  function formatHour(h) {
    return String(h).padStart(2, '0') + ':00';
  }
  function rangeText(s) {
    if (s.range[0] === 23) return '23:00 - 24:00';
    if (s.range[1] === 24) return formatHour(s.range[0]) + ' - 24:00';
    return formatHour(s.range[0]) + ' - ' + formatHour(s.range[1]);
  }
  function _enrich(items) {
    const stages = (typeof Timeline !== 'undefined' && Timeline.STAGES) || [];
    const byId = {};
    stages.forEach(s => { byId[s.id] = s; });
    return items.map(it => {
      const s = byId[it.id];
      return Object.assign({}, it, {
        shichen: s ? s.shichen : '',
        part: s ? s.part : '',
        range: s ? s.range : [0, 1]
      });
    });
  }

  // 给定主节点 id,获取合并组中所有 id(含自己)
  function _groupIds(primaryId) {
    const members = _pendingMergedGroups[primaryId] || [];
    return [primaryId, ...members];
  }

  // 给定 id,找出所在合并组的 primary(若未被合并则返回自身)
  function _findPrimary(stageId) {
    if (_pendingMergedGroups[stageId]) return stageId;
    for (const p in _pendingMergedGroups) {
      if ((_pendingMergedGroups[p] || []).indexOf(stageId) >= 0) return p;
    }
    return stageId;
  }

  // 标记 dirty
  function _markDirty() {
    _dirty = true;
    _updateSaveButton();
    _updateStats();
  }

  // 更新保存按钮的"待保存"高亮
  function _updateSaveButton() {
    const btn = document.getElementById('script-save');
    if (!btn) return;
    if (_dirty) {
      btn.classList.add('save-dirty');
      btn.style.background = 'linear-gradient(135deg, #fcd34d 0%, #d4a24c 100%)';
      btn.style.color = '#1a1a1a';
      btn.style.border = '1px solid #fcd34d';
    } else {
      btn.classList.remove('save-dirty');
      btn.style.background = '';
      btn.style.color = '';
      btn.style.border = '';
    }
  }

  function _countDirty() {
    // 与 storage 中"已保存文本"不一致的数量
    const saved = Script.getToday();
    const savedMap = {};
    saved.forEach(s => { savedMap[s.id] = s; });
    let count = 0;
    Object.keys(_pendingTexts).forEach(id => {
      if (savedMap[id] && savedMap[id].text !== _pendingTexts[id]) count++;
    });
    return count;
  }

  function _updateStats() {
    const statsText = document.getElementById('script-stats-text');
    if (!statsText) return;
    const saved = Script.getStats();
    const mergedCount = Object.keys(_pendingMergedGroups).filter(p => (_pendingMergedGroups[p] || []).length > 0).length;
    const dirtyCount = _countDirty();
    const dirtyHtml = dirtyCount > 0 ? ` <span class="dirty-count">· ${dirtyCount} 项待保存</span>` : '';
    statsText.innerHTML = `${saved.userCount}/24 已保存 · ${mergedCount} 段已合并${dirtyHtml}`;
  }

  // ---- 渲染 ----
  // 数据源:24 个 STAGES(顺序)
  // 显示逻辑:
  //   - 合并组中的 secondary: 完全跳过
  //   - 合并组中的 primary(且有 member): 1 个新节点,不可编辑
  //   - 其它: 可编辑输入框
  function render() {
    const wrap = document.getElementById('script-rows');
    if (!wrap) return;
    const stages = (typeof Timeline !== 'undefined' && Timeline.STAGES) || [];
    if (stages.length === 0) return;
    const allToday = _enrich(Script.getToday());
    const stagesById = {};
    stages.forEach(s => { stagesById[s.id] = s; });
    allToday.forEach(s => { stagesById[s.id] = Object.assign({}, stagesById[s.id], s); });

    _updateStats();

    wrap.innerHTML = '';
    const renderedIds = new Set();

    stages.forEach((s, idx) => {
      const stageId = s.id;
      // 如果在合并组且不是 primary,跳过
      const primary = _findPrimary(stageId);
      if (primary !== stageId) {
        renderedIds.add(stageId);
        return;
      }
      // 如果已经被前面的 primary 渲染过了,跳过
      if (renderedIds.has(stageId)) return;
      const members = _pendingMergedGroups[stageId] || [];
      const isMergedPrimary = members.length > 0;

      // 计算合并后的时间范围和默认 label
      const groupAll = [stageId, ...members].map(id => stagesById[id]).filter(Boolean);
      // 排序(子初 23 排第一)
      groupAll.sort((a, b) => {
        const a0 = a.range[0] === 23 ? -1 : a.range[0];
        const b0 = b.range[0] === 23 ? -1 : b.range[0];
        return a0 - b0;
      });
      const mergedStart = groupAll[0].range[0];
      const mergedEnd = groupAll[groupAll.length - 1].range[1];
      const uniqueLabels = groupAll.map(x => x.label).filter((v, i, a) => a.indexOf(v) === i);
      const mergedLabel = uniqueLabels.join('·');
      const mergedRangeText = formatHour(mergedStart) + ' - ' + (mergedEnd === 24 ? '24:00' : formatHour(mergedEnd));
      const defaultText = groupAll.map(x => x.text).filter((v, i, a) => a.indexOf(v) === i).join(' / ');

      const row = document.createElement('div');
      row.className = 'script-row' + (isMergedPrimary ? ' is-merged-primary' : '');
      row.dataset.stageId = stageId;
      if (isMergedPrimary) row.dataset.members = JSON.stringify(members);

      // 时间列
      const timeEl = document.createElement('div');
      timeEl.className = 'script-time';
      timeEl.textContent = isMergedPrimary ? mergedRangeText : rangeText(s);
      row.appendChild(timeEl);

      // 标签列
      const labelEl = document.createElement('div');
      labelEl.className = 'script-label';
      labelEl.textContent = isMergedPrimary ? mergedLabel : s.label;
      labelEl.title = labelEl.textContent;
      row.appendChild(labelEl);

      // 主体列:合并显示"默认文案",可编辑显示输入框
      if (isMergedPrimary) {
        // 合并节点:不可编辑,展示默认文案
        const wrap2 = document.createElement('div');
        wrap2.style.display = 'flex';
        wrap2.style.flexDirection = 'column';
        wrap2.style.gap = '0.2rem';
        const textEl = document.createElement('div');
        textEl.className = 'script-merged-label';
        textEl.textContent = defaultText;
        textEl.title = '合并后展示默认行程,无法编辑。点击右侧"拆"取消合并';
        wrap2.appendChild(textEl);
        const meta = document.createElement('div');
        meta.className = 'script-merged-meta';
        meta.textContent = `合并 ${members.length} 段 · 共 ${(mergedEnd - mergedStart)} 小时`;
        wrap2.appendChild(meta);
        row.appendChild(wrap2);
      } else {
        // 普通节点:可编辑输入框
        const savedItem = allToday.find(x => x.id === stageId);
        const savedText = savedItem && savedItem.source === 'user' ? savedItem.text : '';
        const displayText = (_pendingTexts[stageId] !== undefined) ? _pendingTexts[stageId] : savedText;
        const inputEl = document.createElement('input');
        inputEl.className = 'script-input';
        inputEl.type = 'text';
        inputEl.value = displayText;
        inputEl.maxLength = 12;
        inputEl.placeholder = Script.getDefault(stageId);
        // dirty 检测
        if (savedText !== displayText) inputEl.classList.add('dirty');
        inputEl.addEventListener('input', (e) => {
          const v = e.target.value;
          _pendingTexts[stageId] = v;
          const item = allToday.find(x => x.id === stageId);
          const savedT = item && item.source === 'user' ? item.text : '';
          if (v === savedT) {
            // 与已保存一致,清掉 dirty
            inputEl.classList.remove('dirty');
            delete _pendingTexts[stageId];
          } else {
            inputEl.classList.add('dirty');
            _markDirty();
          }
          _updateStats();
        });
        row.appendChild(inputEl);
      }

      // 操作列(合并按钮)
      if (isMergedPrimary) {
        // 显示"拆"按钮(取消合并)
        const unmergeBtn = document.createElement('button');
        unmergeBtn.className = 'merge-toggle active';
        unmergeBtn.textContent = '拆';
        unmergeBtn.title = '取消合并,恢复为单独时段';
        unmergeBtn.addEventListener('click', () => {
          _unmergeGroup(stageId);
          render();
          Audio.click();
        });
        row.appendChild(unmergeBtn);
      } else {
        // 显示"合"按钮(与下一未合并段合并)
        const next = stages[idx + 1];
        const nextPrimary = next ? _findPrimary(next.id) : null;
        // 下一段必须是"独立"(没在任何合并组中,或与本节点同一组)
        const canMerge = next && (nextPrimary === next.id);
        const mergeBtn = document.createElement('button');
        mergeBtn.className = 'merge-toggle' + (canMerge ? '' : ' disabled');
        mergeBtn.textContent = '合';
        mergeBtn.title = canMerge ? '把下一段并入此段' : '下一段不可合并';
        mergeBtn.addEventListener('click', () => {
          if (!canMerge || !next) return;
          _addToGroup(stageId, next.id);
          render();
          Audio.click();
        });
        row.appendChild(mergeBtn);
      }

      // 标记已渲染
      groupAll.forEach(x => renderedIds.add(x.id));
      wrap.appendChild(row);
    });
  }

  // 合并操作:把 mergedId 并入 primaryId 的组
  function _addToGroup(primaryId, mergedId) {
    if (!_pendingMergedGroups[primaryId]) _pendingMergedGroups[primaryId] = [];
    if (_pendingMergedGroups[primaryId].indexOf(mergedId) === -1) {
      _pendingMergedGroups[primaryId].push(mergedId);
    }
    _markDirty();
  }

  // 取消合并组
  function _unmergeGroup(primaryId) {
    delete _pendingMergedGroups[primaryId];
    _markDirty();
  }

  // 清空 pending
  function _resetPending() {
    _pendingTexts = {};
    _pendingMergedGroups = {};
    _dirty = false;
  }

  // 从 storage 加载已保存的 merged groups 到 _pendingMergedGroups(打开弹窗时)
  function _loadFromStorage() {
    const saved = Script.getMergedGroups ? Script.getMergedGroups() : {};
    _pendingMergedGroups = JSON.parse(JSON.stringify(saved || {}));
    _pendingTexts = {};
    _dirty = false;
  }

  // ---- 保存/恢复 ----
  function save() {
    // 1. 写入 pendingTexts(只对非合并 primary)
    Object.keys(_pendingTexts).forEach(id => {
      // 如果该 id 是某个合并组的 secondary,跳过(它会被 primary 替代)
      const primary = _findPrimary(id);
      if (primary !== id) return;
      Script.setStageText(id, _pendingTexts[id]);
    });
    // 2. 合并组中的 secondary 节点,清空 storage(确保回退到默认)
    Object.keys(_pendingMergedGroups).forEach(primaryId => {
      const members = _pendingMergedGroups[primaryId] || [];
      members.forEach(mid => Script.setStageText(mid, ''));  // '' = 删除
    });
    // 3. 写入合并组
    if (Script.setMergedGroups) Script.setMergedGroups(_pendingMergedGroups);
    // 4. 重置 pending,刷新时间轴
    _pendingTexts = {};
    _dirty = false;
    _updateSaveButton();
    if (window.Timeline) {
      if (Timeline.refreshScripts) Timeline.refreshScripts();
      if (Timeline.render) Timeline.render();
    }
    if (Tribute && Tribute.showToast) Tribute.showToast('✓ 行程修改已保存');
    Audio.bell && Audio.bell();
  }

  function restore() {
    if (!confirm('陛下当真要放弃今日所有自定义行程(文本+合并),恢复为朝廷建议的版本?')) return;
    Script.restoreDefaults();
    _resetPending();
    render();
    if (window.Timeline) {
      if (Timeline.refreshScripts) Timeline.refreshScripts();
      if (Timeline.render) Timeline.render();
    }
    Audio.bell && Audio.bell();
    if (Tribute && Tribute.showToast) Tribute.showToast('✓ 今日行程已恢复默认');
  }

  // 趣味合并:朝九晚五
  function mergeFun() {
    if (!confirm('执行"朝九晚五"模式?\n将自动合并作息段(夜寝/早备/午休/晚寝),生成简洁版行程。\n\n陛下当前自定义的合并会被覆盖。')) return;
    _pendingMergedGroups = {};
    const stages = (typeof Timeline !== 'undefined' && Timeline.STAGES) || [];
    const byId = {};
    stages.forEach(s => { byId[s.id] = s; });
    const mergePlan = [
      ['zi-chu', 'zi-zheng', 'chou-chu', 'chou-zheng'],  // 深夜补眠
      ['yin-chu', 'yin-zheng'],                            // 寅初+寅正 备驾+起身
      ['chen-chu', 'chen-zheng'],                          // 辰初+辰正 早膳
      ['xu-chu', 'xu-zheng'],                              // 戌初+戌正 宫闱
      ['hai-chu', 'hai-zheng']                             // 亥初+亥正 安寝
    ];
    mergePlan.forEach(group => {
      if (group.every(id => byId[id])) {
        const [primary, ...rest] = group;
        _pendingMergedGroups[primary] = rest;
      }
    });
    _markDirty();
    render();
    if (Tribute && Tribute.showToast) Tribute.showToast('🧩 已按"朝九晚五"合并(待保存)');
  }

  // ---- 弹窗显隐 ----
  function open() {
    const modal = document.getElementById('script-modal');
    if (!modal) return;
    _loadFromStorage();
    render();
    modal.classList.remove('hidden');
    Audio.click && Audio.click();
  }

  function close() {
    if (_dirty) {
      if (!confirm('有未保存的修改,确定要关闭吗?未保存的内容会丢失。')) return;
    }
    const modal = document.getElementById('script-modal');
    if (!modal) return;
    modal.classList.add('hidden');
    _resetPending();
    Audio.click && Audio.click();
  }

  function bind() {
    const openBtn = document.getElementById('open-script-modal');
    if (openBtn) openBtn.addEventListener('click', open);
    const closeBtn = document.getElementById('script-close');
    if (closeBtn) closeBtn.addEventListener('click', close);
    const restoreBtn = document.getElementById('script-restore');
    if (restoreBtn) restoreBtn.addEventListener('click', restore);
    const mergeBtn = document.getElementById('script-merge-all');
    if (mergeBtn) mergeBtn.addEventListener('click', mergeFun);
    const saveBtn = document.getElementById('script-save');
    if (saveBtn) saveBtn.addEventListener('click', () => { save(); render(); });
    // 点遮罩关闭
    const modal = document.getElementById('script-modal');
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) close();
      });
    }
  }

  return { open, close, render, bind, save, restore, mergeFun };
})();
