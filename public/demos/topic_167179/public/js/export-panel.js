/* ============================================================
   export-panel.js — 导出控制台模块
   负责：格式选择、导出触发、进度条、任务列表、真实下载
   ============================================================ */

const ExportPanel = (() => {
  let el = null;
  let lastDownloadUrl = null;

  function init() {
    el = document.getElementById('export-panel');
    if (!el) return;

    bindEvents();
    AppState.on('exportJobs', renderJobs);
  }

  function bindEvents() {
    // 格式选择
    el.querySelectorAll('.js-format-radio').forEach(radio => {
      radio.addEventListener('change', () => {
        if (radio.checked) {
          AppState.set('exportFormat', radio.value);
        }
      });
    });

    // 导出按钮
    el.querySelector('.js-export-btn').addEventListener('click', () => {
      triggerExport();
    });
  }

  async function triggerExport() {
    const selectedResult = AppState.getSelectedResult();

    if (!selectedResult) {
      Toast.warning('提示', '请先选择一个包装点，再点击导出');
      return;
    }

    const format = AppState.get('exportFormat');
    const theme = AppState.get('accent');
    const data = selectedResult.extractedData || {};

    // 根据类型构造渲染参数，优先使用 displayText 与当前选中的预设
    const displayText = data.displayText || '';
    const presetKey = PresetLibrary.getPresetKey(selectedResult.type, selectedResult.suggestedTemplate);

    const params = {
      mainText: displayText || data.mainText || selectedResult.text,
      subText: data.subText || '',
      displayText,
      preset: presetKey,
      theme,
    };

    if (selectedResult.type === 'data_card') {
      params.number = data.number || displayText || '';
      params.unit = data.unit || '';
      params.source = data.source || '';
    } else if (selectedResult.type === 'quote_highlight') {
      params.quoteText = displayText || data.quoteText || selectedResult.text;
      params.source = data.source || '';
    } else if (selectedResult.type === 'timeline_node') {
      params.timeText = displayText || data.timeText || selectedResult.text;
      params.items = data.items || [{ time: params.timeText, text: displayText || selectedResult.text }];
    } else if (selectedResult.type === 'title_card' || selectedResult.type === 'conclusion_box') {
      params.source = data.source || '';
      if (presetKey === 'chapter') {
        params.chapterNumber = data.chapterNumber || '1';
      }
    }

    const payload = {
      templateId: selectedResult.suggestedTemplate,
      params,
      settings: {
        resolution: [1080, 1700],
        fps: 25,
        duration: 3,
        format,
      },
    };

    const btn = el.querySelector('.js-export-btn');
    btn.classList.add('btn--loading');
    btn.disabled = true;
    AppState.set('isExporting', true);
    lastDownloadUrl = null;

    // 重置进度
    updateProgress(0, 'queued', '');

    try {
      const renderTask = await window.renderTemplate(payload);

      // 添加任务到列表
      const jobId = renderTask.jobId || `render-${Date.now()}`;
      const jobs = [...AppState.get('exportJobs'), {
        id: jobId,
        name: `${selectedResult.suggestedTemplate} - ${format}`,
        status: 'queued',
        progress: 0,
      }];
      AppState.set('exportJobs', jobs);

      await renderTask.onProgress(({ jobId: progressJobId, status, progress, error, downloadUrl }) => {
        const realJobId = progressJobId || jobId;
        updateProgress(progress, status, realJobId, downloadUrl);

        // 更新任务列表
        const updatedJobs = AppState.get('exportJobs').map(j =>
          j.id === realJobId ? { ...j, status, progress, error, downloadUrl } : j
        );
        AppState.set('exportJobs', updatedJobs);

        if (status === 'done') {
          lastDownloadUrl = downloadUrl || lastDownloadUrl;
          Toast.success('导出完成', `任务 ${realJobId.slice(0, 12)}... 已完成渲染`);
        } else if (status === 'failed') {
          Toast.error('导出失败', error?.message || '未知错误');
        }
      });
    } catch (err) {
      Toast.error('导出失败', err.message);
      updateProgress(0, 'failed', '');
    } finally {
      btn.classList.remove('btn--loading');
      btn.disabled = false;
      AppState.set('isExporting', false);
    }
  }

  function updateProgress(progress, status, jobId, downloadUrl = null) {
    const fillEl = el.querySelector('.js-export-progress-fill');
    const textEl = el.querySelector('.js-export-progress-text');

    if (fillEl) {
      fillEl.style.width = (progress * 100) + '%';
    }

    if (textEl) {
      const statusLabels = { queued: '排队中', processing: '渲染中', done: '已完成', failed: '失败' };
      textEl.innerHTML = `
        <span>${statusLabels[status] || status}</span>
        <span>${Math.round(progress * 100)}%</span>`;
    }

    // 下载按钮
    const downloadBtn = el.querySelector('.js-download-btn');
    if (downloadBtn) {
      if (status === 'done' && (downloadUrl || lastDownloadUrl)) {
        const url = downloadUrl || lastDownloadUrl;
        downloadBtn.disabled = false;
        downloadBtn.classList.remove('btn--secondary');
        downloadBtn.classList.add('btn--primary');
        downloadBtn.onclick = () => {
          const a = document.createElement('a');
          a.href = url;
          a.download = url.split('/').pop() || 'output.mov';
          document.body.appendChild(a);
          a.click();
          a.remove();
          Toast.success('开始下载', a.download);
        };
      } else {
        downloadBtn.disabled = true;
        downloadBtn.classList.add('btn--secondary');
        downloadBtn.classList.remove('btn--primary');
        downloadBtn.onclick = null;
      }
    }
  }

  function renderJobs(jobs) {
    const container = el.querySelector('.js-export-tasks');
    const emptyEl = el.querySelector('.js-export-tasks-empty');
    if (!container) return;

    if (!jobs || jobs.length === 0) {
      if (emptyEl) emptyEl.style.display = 'block';
      container.innerHTML = '';
      return;
    }

    if (emptyEl) emptyEl.style.display = 'none';

    container.innerHTML = jobs.map(j => {
      const statusLabels = { queued: '排队中', processing: '渲染中', done: '已完成', failed: '失败' };
      return `
        <div class="export-task">
          <div class="export-task__info">
            <div class="export-task__id">${j.id.slice(0, 12)}...</div>
            <div class="export-task__name">${j.name}</div>
          </div>
          <span class="export-task__status export-task__status--${j.status}">
            ${statusLabels[j.status]}
          </span>
        </div>`;
    }).join('');
  }

  return { init };
})();

window.ExportPanel = ExportPanel;
