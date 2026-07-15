/* ============================================================
   script-input.js — 文稿输入区模块
   负责：文本输入、示例加载、字数统计、AI 识别触发
   ============================================================ */

const ScriptInput = (() => {
  let el = null;

  function init() {
    el = document.getElementById('script-input-panel');
    if (!el) return;

    bindEvents();
    renderSampleButtons();
    updateWordCount();
  }

  function bindEvents() {
    // 文本输入
    const textarea = el.querySelector('.js-script-textarea');
    textarea.addEventListener('input', () => {
      const text = textarea.value;
      AppState.set('scriptText', text);
      updateWordCount();
    });

    // 一键加载示例文稿
    el.querySelectorAll('.js-load-sample').forEach(btn => {
      btn.addEventListener('click', () => {
        const sampleId = btn.dataset.sampleId;
        loadSample(sampleId);
      });
    });

    // AI 识别按钮
    el.querySelector('.js-analyze-btn').addEventListener('click', () => {
      triggerAnalysis();
    });

    // 清空按钮
    el.querySelector('.js-clear-btn').addEventListener('click', () => {
      clearScript();
    });
  }

  function renderSampleButtons() {
    const container = el.querySelector('.js-sample-buttons');
    if (!container) return;

    container.innerHTML = MockData.sampleScripts.map((sample, idx) => `
      <button class="btn btn--sm js-load-sample" data-sample-id="${sample.id}">
        ${idx + 1}. ${sample.title}
      </button>
    `).join('');

    // 重新绑定
    container.querySelectorAll('.js-load-sample').forEach(btn => {
      btn.addEventListener('click', () => {
        loadSample(btn.dataset.sampleId);
      });
    });
  }

  function loadSample(sampleId) {
    const sample = MockData.sampleScripts.find(s => s.id === sampleId);
    if (!sample) return;

    const textarea = el.querySelector('.js-script-textarea');
    textarea.value = sample.text;
    AppState.set('scriptText', sample.text);
    updateWordCount();
    Toast.info('已加载', `示例文稿：${sample.title}`);
  }

  function clearScript() {
    const textarea = el.querySelector('.js-script-textarea');
    textarea.value = '';
    AppState.set('scriptText', '');
    updateWordCount();
    Toast.info('已清空', '文稿内容已清空');
  }

  function updateWordCount() {
    const countEl = el.querySelector('.js-word-count');
    const text = AppState.get('scriptText');
    const count = text.replace(/\s/g, '').length;
    if (countEl) {
      countEl.innerHTML = `字数：<span>${count}</span>`;
    }

    // 更新分析按钮状态
    const btn = el.querySelector('.js-analyze-btn');
    if (btn) {
      btn.disabled = count < 10;
    }
  }

  async function triggerAnalysis() {
    const text = AppState.get('scriptText');
    if (!text || text.trim().length < 10) {
      Toast.warning('提示', '请先输入至少 10 个字符的文稿内容');
      return;
    }

    const btn = el.querySelector('.js-analyze-btn');
    btn.classList.add('btn--loading');
    btn.disabled = true;
    AppState.set('isAnalyzing', true);

    try {
      const results = await window.analyzeText(text);
      AppState.set('analysisResults', results);
      AppState.set('selectedResultId', null);
      Toast.success('识别完成', `共识别到 ${results.length} 个包装点`);
    } catch (err) {
      Toast.error('识别失败', err.message);
      AppState.set('analysisResults', []);
    } finally {
      btn.classList.remove('btn--loading');
      btn.disabled = false;
      AppState.set('isAnalyzing', false);
    }
  }

  return { init, updateWordCount };
})();

window.ScriptInput = ScriptInput;