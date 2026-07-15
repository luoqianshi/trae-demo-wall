/* ============================================================
   timeline-panel.js — 时间轴 / 包装点队列模块
   负责：展示包装点时间轴队列
   ============================================================ */

const TimelinePanel = (() => {
  let el = null;

  const typeLabels = {
    data_card: '数据',
    quote_highlight: '观点',
    timeline_node: '时间轴',
    title_card: '标题',
  };

  function init() {
    el = document.getElementById('timeline-panel');
    if (!el) return;

    AppState.on('analysisResults', render);
  }

  function render(results) {
    const container = el.querySelector('.js-timeline-list');
    const emptyEl = el.querySelector('.js-timeline-empty');
    if (!container) return;

    if (!results || results.length === 0) {
      container.innerHTML = '';
      if (emptyEl) emptyEl.style.display = 'block';
      return;
    }

    if (emptyEl) emptyEl.style.display = 'none';

    const totalDuration = results.length * 3; // 每个 3 秒

    container.innerHTML = `
      <div class="timeline-list">
        ${results.map((r, idx) => {
          const typeLabel = typeLabels[r.type] || r.type;
          const timeStr = formatTime(idx * 3);
          const displayText = r.extractedData && r.extractedData.displayText ? r.extractedData.displayText : r.text;
          return `
            <div class="timeline-item js-timeline-item" data-result-id="${r.id}">
              <span class="timeline-item__index">${idx + 1}</span>
              <span class="timeline-item__text" title="${r.text}">${displayText.slice(0, 24)}</span>
              <span class="timeline-item__type">${typeLabel}</span>
              <span class="text-xs text-muted">${timeStr}</span>
            </div>`;
        }).join('')}
      </div>
      <div style="padding: var(--space-3); background: var(--color-bg-surface); border-radius: var(--radius-md); border: 1px solid var(--color-border);">
        <div style="display:flex;justify-content:space-between;font-size:var(--font-size-xs);color:var(--color-ink-muted);">
          <span>总时长：${totalDuration}s</span>
          <span>包装点数：${results.length}</span>
        </div>
      </div>`;

    // 绑定点击事件
    container.querySelectorAll('.js-timeline-item').forEach(item => {
      item.addEventListener('click', () => {
        AppState.set('selectedResultId', item.dataset.resultId);
      });
      item.style.cursor = 'pointer';
    });
  }

  function formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  return { init };
})();

window.TimelinePanel = TimelinePanel;