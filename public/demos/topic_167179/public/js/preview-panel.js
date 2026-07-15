/* ============================================================
   preview-panel.js — 模板预览区模块
   负责：模板预览渲染、播放/暂停、进度条、预设切换
   ============================================================ */

const PreviewPanel = (() => {
  let el = null;
  let animFrame = null;
  let playStartTime = 0;
  let duration = 3000; // 3秒

  const typeLabels = {
    data_card: '数据卡片',
    quote_highlight: '观点花字',
    timeline_node: '时间轴',
    title_card: '标题卡片',
  };

  function init() {
    el = document.getElementById('preview-panel');
    if (!el) return;

    AppState.on('selectedResultId', updatePreview);
    AppState.on('accent', () => {
      if (AppState.get('selectedResultId')) updatePreview();
    });
    bindEvents();
    renderPlaceholder();
  }

  function bindEvents() {
    // 播放/暂停
    el.querySelector('.js-preview-play').addEventListener('click', togglePlay);

    // 进度条点击
    const progressBar = el.querySelector('.js-preview-progress');
    progressBar.addEventListener('click', (e) => {
      const rect = progressBar.getBoundingClientRect();
      const ratio = (e.clientX - rect.left) / rect.width;
      AppState.set('previewProgress', ratio);
      updateProgressUI();
    });

    // 模板/预设选择（动态生成）
    const selector = el.querySelector('.js-template-selector');
    selector.addEventListener('click', (e) => {
      const option = e.target.closest('.js-template-option');
      if (!option) return;
      selectPreset(option.dataset.templateId);
    });

    // 显示文案编辑（动态生成）
    const infoEl = el.querySelector('.js-preview-info');
    infoEl.addEventListener('change', (e) => {
      if (e.target.classList.contains('js-display-text')) {
        updateDisplayText(e.target.value);
      }
    });

    // 推荐模板选择（动态生成）
    infoEl.addEventListener('change', (e) => {
      if (e.target.classList.contains('js-template-select')) {
        selectPreset(e.target.value);
      }
    });

    // 画面合成预览切换
    el.addEventListener('change', (e) => {
      if (e.target.classList.contains('js-composite-toggle')) {
        toggleCompositePreview(e.target.checked);
      }
    });

    // 上传背景图
    el.addEventListener('change', (e) => {
      if (e.target.classList.contains('js-bg-upload')) {
        loadBgImage(e.target.files[0]);
      }
    });
  }

  function updatePreview() {
    const result = AppState.getSelectedResult();
    if (!result) {
      renderPlaceholder();
      return;
    }

    const type = result.type;
    const presetId = result.suggestedTemplate;
    const preset = PresetLibrary.getPreset(type, presetId);

    AppState.set('previewTemplateId', presetId);

    // 渲染动态预设选择器
    renderPresetSelector(type, presetId);

    // 渲染预览
    const theme = AppState.get('accent');
    const frame = el.querySelector('.js-preview-frame');
    const infoEl = el.querySelector('.js-preview-info');

    if (frame) {
      frame.innerHTML = PresetLibrary.renderPreview(type, presetId, result.extractedData || {}, theme);
    }

    if (infoEl) {
      const data = result.extractedData || {};
      infoEl.innerHTML = `
        <div class="preview-info__item">
          <span class="preview-info__label">类型</span>
          <span class="preview-info__value">${typeLabels[type] || type}</span>
        </div>
        <div class="preview-info__item">
          <span class="preview-info__label">预设</span>
          <span class="preview-info__value">${preset ? preset.name : presetId}</span>
        </div>
        <div class="preview-info__item">
          <span class="preview-info__label">置信度</span>
          <span class="preview-info__value">${Math.round(result.confidence * 100)}%</span>
        </div>
        <div class="preview-info__item" style="flex-direction:column;align-items:flex-start;gap:4px;">
          <span class="preview-info__label">原文</span>
          <span class="preview-info__value" style="white-space:normal;font-weight:400;color:var(--color-ink-muted);">${escapeHtml(result.text)}</span>
        </div>
        <div class="preview-info__item" style="flex-direction:column;align-items:flex-start;gap:4px;">
          <span class="preview-info__label">包装显示文案</span>
          <input type="text" class="input js-display-text" value="${escapeHtml(data.displayText || '')}" maxlength="30" placeholder="输入包装上要显示的短文案">
          <span class="text-xs text-muted" style="color:var(--color-ink-muted);">修改后会同步到导出与时间轴</span>
        </div>
        <div class="preview-info__item" style="flex-direction:column;align-items:flex-start;gap:4px;">
          <span class="preview-info__label">推荐模板</span>
          <div style="display:flex;align-items:center;gap:8px;width:100%;">
            <select class="js-template-select" style="flex:1;padding:4px 8px;border:1px solid var(--color-border);border-radius:6px;font-size:13px;background:var(--color-surface);">
            </select>
          </div>
        </div>
        <div class="preview-info__item" style="flex-direction:column;align-items:flex-start;gap:4px;">
          <span class="preview-info__label">推荐理由</span>
          <span class="js-recommend-reason text-xs" style="color:var(--color-ink-muted);">--</span>
        </div>
        <div class="preview-info__item" style="flex-direction:column;align-items:flex-start;gap:4px;">
          <span class="preview-info__label">置信度</span>
          <div style="display:flex;align-items:center;gap:8px;width:100%;">
            <div style="flex:1;height:6px;background:var(--color-border);border-radius:3px;overflow:hidden;">
              <div class="js-confidence-bar" style="height:100%;width:0%;background:var(--color-primary);border-radius:3px;transition:width 0.3s;"></div>
            </div>
            <span class="js-confidence-text text-xs" style="color:var(--color-ink-muted);">0%</span>
          </div>
        </div>`;
    }

    // 重置播放
    stopPlay();
    AppState.set('previewProgress', 0);
    updateProgressUI();

    // 填充推荐模板选择列表
    populateTemplateSelect(type, presetId);

    // 更新推荐理由
    const reasonEl = el.querySelector('.js-recommend-reason');
    if (reasonEl) {
      const reason = result.recommendReason || generateRecommendReason(result);
      reasonEl.textContent = reason;
    }

    // 更新置信度条
    const confidenceBar = el.querySelector('.js-confidence-bar');
    const confidenceText = el.querySelector('.js-confidence-text');
    const confValue = Math.round((result.confidence || 0) * 100);
    if (confidenceBar) confidenceBar.style.width = confValue + '%';
    if (confidenceText) confidenceText.textContent = confValue + '%';
  }

  function renderPresetSelector(type, selectedId) {
    const selector = el.querySelector('.js-template-selector');
    const presets = PresetLibrary.getPresetsByType(type);
    selector.innerHTML = presets.map((p) => `
      <div class="template-option js-template-option ${p.id === selectedId ? 'template-option--selected' : ''}"
           data-template-id="${p.id}" title="${p.scene}">
        <div class="template-option__name">${p.name}</div>
      </div>
    `).join('');
  }

  function renderPlaceholder() {
    const frame = el.querySelector('.js-preview-frame');
    const infoEl = el.querySelector('.js-preview-info');
    const selector = el.querySelector('.js-template-selector');

    if (frame) {
      frame.innerHTML = `
        <div class="preview-placeholder">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <rect x="2" y="3" width="20" height="14" rx="2"/>
            <path d="M8 21h8M12 17v4"/>
          </svg>
          <p>选择左侧包装点卡片以预览模板</p>
        </div>`;
    }

    if (infoEl) {
      infoEl.innerHTML = `
        <div class="empty-state">
          <p>暂无选中包装点</p>
        </div>`;
    }

    if (selector) selector.innerHTML = '';

    stopPlay();
    AppState.set('previewProgress', 0);
    updateProgressUI();
  }

  function selectPreset(presetId) {
    const currentResult = AppState.getSelectedResult();
    if (!currentResult) return;

    const updated = AppState.get('analysisResults').map((r) =>
      r.id === currentResult.id ? { ...r, suggestedTemplate: presetId } : r
    );
    AppState.set('analysisResults', updated);
    AppState.set('selectedResultId', currentResult.id);
  }

  function updateDisplayText(value) {
    const currentResult = AppState.getSelectedResult();
    if (!currentResult) return;

    const trimmed = value.trim();
    const updated = AppState.get('analysisResults').map((r) => {
      if (r.id !== currentResult.id) return r;
      return {
        ...r,
        extractedData: {
          ...(r.extractedData || {}),
          displayText: trimmed,
        },
      };
    });
    AppState.set('analysisResults', updated);
  }

  function togglePlay() {
    const isPlaying = AppState.get('previewPlaying');
    if (isPlaying) {
      stopPlay();
    } else {
      startPlay();
    }
  }

  function startPlay() {
    const progress = AppState.get('previewProgress');
    playStartTime = performance.now() - progress * duration;
    AppState.set('previewPlaying', true);
    updatePlayButton();
    animatePlay();
  }

  function stopPlay() {
    if (animFrame) {
      cancelAnimationFrame(animFrame);
      animFrame = null;
    }
    AppState.set('previewPlaying', false);
    updatePlayButton();
  }

  function animatePlay() {
    const now = performance.now();
    const elapsed = now - playStartTime;
    const progress = Math.min(1, elapsed / duration);

    AppState.set('previewProgress', progress);
    updateProgressUI();

    if (progress >= 1) {
      stopPlay();
      AppState.set('previewProgress', 0);
      updateProgressUI();
    } else {
      animFrame = requestAnimationFrame(animatePlay);
    }
  }

  function updatePlayButton() {
    const btn = el.querySelector('.js-preview-play');
    if (btn) {
      btn.innerHTML = AppState.get('previewPlaying') ? '&#10074;&#10074;' : '&#9654;';
    }
  }

  function updateProgressUI() {
    const fill = el.querySelector('.js-preview-progress-fill');
    if (fill) {
      fill.style.width = (AppState.get('previewProgress') * 100) + '%';
    }
  }

  function populateTemplateSelect(type, selectedId) {
    const select = el.querySelector('.js-template-select');
    if (!select) return;
    const presets = PresetLibrary.getPresetsByType(type);
    select.innerHTML = presets.map(p =>
      `<option value="${p.id}" ${p.id === selectedId ? 'selected' : ''}>${p.name}</option>`
    ).join('');
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

  let compositeMode = false;
  let bgImage = null;

  function toggleCompositePreview(enabled) {
    compositeMode = enabled;
    // 如果开启了合成模式，重新渲染预览
    if (enabled && bgImage) {
      renderCompositePreview();
    } else if (!enabled) {
      // 恢复普通预览
      updatePreview();
    }
  }

  function loadBgImage(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
      const img = new Image();
      img.onload = function() {
        bgImage = img;
        if (compositeMode) {
          renderCompositePreview();
        }
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  function renderCompositePreview() {
    const result = AppState.getSelectedResult();
    if (!result || !bgImage) return;

    const frame = el.querySelector('.js-preview-frame');
    if (!frame) return;

    // 在 frame 中用 canvas 绘制合成预览
    let canvas = frame.querySelector('.js-composite-canvas');
    if (!canvas) {
      canvas = document.createElement('canvas');
      canvas.className = 'js-composite-canvas';
      canvas.style.width = '100%';
      canvas.style.height = '100%';
      canvas.style.borderRadius = 'var(--radius-md)';
    }

    const w = 1080;
    const h = 1700;
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');

    // 绘制背景图
    ctx.drawImage(bgImage, 0, 0, w, h);

    // 使用 html2canvas 或直接叠加 HTML 预览（简易实现：半透明覆盖提示）
    // 由于纯前端无法将 HTML 渲染到 canvas，这里使用简易叠加方式
    const theme = AppState.get('accent');
    const htmlPreview = PresetLibrary.renderPreview(result.type, result.suggestedTemplate, result.extractedData || {}, theme);

    frame.innerHTML = '';
    const wrapper = document.createElement('div');
    wrapper.style.cssText = 'position:relative;width:100%;height:100%;';

    const bgLayer = document.createElement('div');
    bgLayer.style.cssText = 'position:absolute;inset:0;background-size:cover;background-position:center;border-radius:var(--radius-md);';
    bgLayer.style.backgroundImage = `url(${bgImage.src})`;

    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:absolute;inset:0;display:flex;align-items:center;justify-content:center;';
    overlay.innerHTML = htmlPreview;

    wrapper.appendChild(bgLayer);
    wrapper.appendChild(overlay);
    frame.innerHTML = '';
    frame.appendChild(wrapper);
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
  }

  return { init };
})();

window.PreviewPanel = PreviewPanel;
