/* ============================================================
   result-cards.js — AI 识别结果卡片列表模块
   负责：卡片列表渲染、选中、编辑、删除、排序
   ============================================================ */

const ResultCards = (() => {
  let el = null;

  const typeLabels = {
    data_card: '数据卡片',
    quote_highlight: '观点花字',
    timeline_node: '时间轴',
    title_card: '标题卡片',
  };

  function init() {
    // index.html 中结果卡片位于 script-input-panel 内，没有独立的 result-cards-panel
    el = document.getElementById('script-input-panel');
    if (!el) return;

    // 监听状态变化
    AppState.on('analysisResults', render);
    AppState.on('selectedResultId', highlightSelected);
  }

  function render(results) {
    const container = el.querySelector('.js-result-cards-list');
    if (!container) return;

    if (!results || results.length === 0) {
      container.innerHTML = `
        <div class="result-cards__empty">
          暂无识别结果<br>
          <span class="text-sm text-muted">粘贴文稿后点击"AI 识别"按钮</span>
        </div>`;
      return;
    }

    container.innerHTML = results.map((r, idx) => {
      const isSelected = r.id === AppState.get('selectedResultId');
      const typeLabel = typeLabels[r.type] || r.type;
      const confidence = Math.round(r.confidence * 100);

      const displayText = r.extractedData && r.extractedData.displayText ? r.extractedData.displayText : r.text;

      // 生成推荐理由
      const recommendReason = r.recommendReason || generateRecommendReason(r);
      // 判断是否金标准
      const isGoldStandard = isResultGoldStandard(r);

      return `
        <div class="result-card ${isSelected ? 'result-card--selected' : ''} js-result-card"
             data-result-id="${r.id}" data-index="${idx}">
          <div class="result-card__header">
            <span class="result-card__type">${typeLabel}${isGoldStandard ? '<span style="font-size:10px;background:var(--color-primary);color:#fff;padding:1px 6px;border-radius:4px;margin-left:4px;">金标准</span>' : ''}</span>
            <span class="result-card__confidence">
              置信度 <span>${confidence}%</span>
            </span>
          </div>
          <div class="result-card__text">${escapeHtml(displayText)}</div>
          <div class="result-card__text" style="font-size:var(--font-size-sm);color:var(--color-ink-muted);margin-top:var(--space-1);">${escapeHtml(r.text)}</div>
          <div style="font-size:11px;color:var(--color-ink-muted);margin-top:2px;">
            ${recommendReason ? '💡 ' + recommendReason : ''}
            ${confidence ? ' (' + confidence + '%)' : ''}
          </div>
          <div class="result-card__footer">
            <span class="result-card__template">${r.suggestedTemplate}</span>
            <button class="btn btn--sm btn-icon js-result-edit" data-id="${r.id}" title="编辑">
              &#9998;
            </button>
            <button class="btn btn--sm btn-icon js-result-move-up" data-id="${r.id}" title="上移" ${idx === 0 ? 'disabled' : ''}>
              &#8593;
            </button>
            <button class="btn btn--sm btn-icon js-result-move-down" data-id="${r.id}" title="下移" ${idx === results.length - 1 ? 'disabled' : ''}>
              &#8595;
            </button>
            <button class="btn btn--sm btn-icon js-result-delete" data-id="${r.id}" title="删除">
              &#10005;
            </button>
          </div>
        </div>`;
    }).join('');

    bindCardEvents();
    updateCount(results);
  }

  function bindCardEvents() {
    const container = el.querySelector('.js-result-cards-list');

    // 点击卡片选中
    container.querySelectorAll('.js-result-card').forEach(card => {
      card.addEventListener('click', (e) => {
        // 如果点击的是按钮，不触发选中
        if (e.target.closest('button')) return;
        const id = card.dataset.resultId;
        AppState.set('selectedResultId', id === AppState.get('selectedResultId') ? null : id);
      });
    });

    // 删除
    container.querySelectorAll('.js-result-delete').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        deleteResult(btn.dataset.id);
      });
    });

    // 上移
    container.querySelectorAll('.js-result-move-up').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        moveResult(btn.dataset.id, -1);
      });
    });

    // 下移
    container.querySelectorAll('.js-result-move-down').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        moveResult(btn.dataset.id, 1);
      });
    });

    // 编辑
    container.querySelectorAll('.js-result-edit').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        editResult(btn.dataset.id);
      });
    });
  }

  function highlightSelected(selectedId) {
    const cards = el.querySelectorAll('.js-result-card');
    cards.forEach(card => {
      const isSelected = card.dataset.resultId === selectedId;
      card.classList.toggle('result-card--selected', isSelected);
    });
  }

  function deleteResult(id) {
    const results = [...AppState.get('analysisResults')];
    const idx = results.findIndex(r => r.id === id);
    if (idx === -1) return;

    const removed = results.splice(idx, 1)[0];
    AppState.set('analysisResults', results);

    if (AppState.get('selectedResultId') === id) {
      AppState.set('selectedResultId', null);
    }

    Toast.info('已删除', `包装点"${removed.text.slice(0, 20)}..."已移除`);
  }

  function moveResult(id, delta) {
    const results = [...AppState.get('analysisResults')];
    const idx = results.findIndex(r => r.id === id);
    if (idx === -1) return;

    const newIdx = idx + delta;
    if (newIdx < 0 || newIdx >= results.length) return;

    [results[idx], results[newIdx]] = [results[newIdx], results[idx]];
    AppState.set('analysisResults', results);
  }

  function editResult(id) {
    const results = AppState.get('analysisResults');
    const result = results.find(r => r.id === id);
    if (!result) return;

    const newText = prompt('编辑包装点文本：', result.text);
    if (newText !== null && newText.trim() !== '') {
      const updated = results.map(r =>
        r.id === id ? { ...r, text: newText.trim() } : r
      );
      AppState.set('analysisResults', updated);
      Toast.success('已更新', '包装点文本已修改');
    }
  }

  function updateCount(results) {
    const countEl = el.querySelector('.js-result-count');
    if (countEl) {
      countEl.textContent = `共 ${results.length} 个包装点`;
    }
  }

  function generateRecommendReason(result) {
    const type = result.type;
    const template = result.suggestedTemplate || '';
    const text = result.text || '';

    if (template === 'single-stat') return '检测到核心数据指标，适合单一数字突出展示';
    if (template === 'data-compare') return '检测到可对比的数据，适合左右并列展示';
    if (template === 'trend-ratio') return '检测到趋势/比例数据，适合带方向指示展示';
    if (template === 'data-to-conclusion') return '检测到数据支撑的结论，适合三段式推导展示';
    if (template === 'quote-callout') return '检测到观点/引语，适合花字高亮展示';

    if (type === 'data_card') return '检测到数据信息，适合数据卡展示';
    if (type === 'quote_highlight') return '检测到引语/观点，适合花字高亮';
    if (type === 'timeline_node') return '检测到时间表述，适合时间轴展示';
    if (type === 'title_card' || type === 'conclusion_box') return '检测到标题/结论，适合标题卡展示';

    return '基于文本内容分析推荐';
  }

  function isResultGoldStandard(result) {
    const type = result.type;
    const template = result.suggestedTemplate || '';
    const presets = PresetLibrary.getPresetsByType(type);
    const preset = presets.find(p => p.id === template);
    return preset ? !!preset.isGoldStandard : false;
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  return { init };
})();

window.ResultCards = ResultCards;