/* ============================================================
   app.js · 主控制器
   事件绑定 / 预览渲染 / 生成动画 / 下载 / 历史
   ============================================================ */

(function () {
  'use strict';

  // ===== DOM 引用 =====
  const $ = (id) => document.getElementById(id);
  const sceneTagsEl = $('sceneTags');
  const exampleChipsEl = $('exampleChips');
  const quickModifyEl = $('quickModify');
  const promptInput = $('promptInput');
  const generateBtn = $('generateBtn');
  const modifyInput = $('modifyInput');
  const modifyBtn = $('modifyBtn');
  const downloadBtn = $('downloadBtn');
  const newWindowBtn = $('newWindowBtn');
  const copyBtn = $('copyBtn');
  const clearBtn = $('clearBtn');
  const historyBlock = $('historyBlock');
  const historyList = $('historyList');
  const previewStatus = $('previewStatus');
  const previewStage = $('previewStage');
  const emptyState = $('emptyState');
  const previewFrame = $('previewFrame');
  const magicOverlay = $('magicOverlay');
  const magicText = $('magicText');
  const magicParticles = $('magicParticles');
  const toast = $('toast');

  // ===== 状态 =====
  const state = {
    selectedScene: null,   // 用户手动选的场景
    currentScene: null,
    currentOpts: null,
    currentHtml: null,
    history: []
  };

  const QUICK_MODIFY = [
    '换成粉色',
    '改成暖橘色',
    '标题改成「夏日狂欢」',
    '加个报名表单',
    '换成黑金酷炫风',
    '副标题换成「Magic Night」'
  ];

  const MAGIC_PHRASES = [
    '正在施展魔法…',
    '调配配色中…',
    '编织 HTML 咒语…',
    '召唤交互元素…',
    '即将完成…'
  ];

  // ===== 初始化场景标签 =====
  function renderSceneTags() {
    sceneTagsEl.innerHTML = '';
    window.Templates.SCENES.forEach(sc => {
      const tag = document.createElement('button');
      tag.type = 'button';
      tag.className = 'scene-tag';
      tag.dataset.scene = sc.key;
      tag.innerHTML = `<span class="tag-emoji">${sc.emoji}</span>${sc.label}`;
      tag.addEventListener('click', () => {
        if (state.selectedScene === sc.key) {
          state.selectedScene = null;
          tag.classList.remove('active');
        } else {
          state.selectedScene = sc.key;
          sceneTagsEl.querySelectorAll('.scene-tag').forEach(t => t.classList.remove('active'));
          tag.classList.add('active');
        }
      });
      sceneTagsEl.appendChild(tag);
    });
  }

  // ===== 示例 chips =====
  function renderExamples() {
    exampleChipsEl.innerHTML = '';
    window.Templates.SCENES.forEach(sc => {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'example-chip';
      chip.textContent = sc.emoji + ' ' + sc.label;
      chip.title = sc.example;
      chip.addEventListener('click', () => {
        promptInput.value = sc.example;
        promptInput.focus();
        state.selectedScene = sc.key;
        sceneTagsEl.querySelectorAll('.scene-tag').forEach(t => {
          t.classList.toggle('active', t.dataset.scene === sc.key);
        });
      });
      exampleChipsEl.appendChild(chip);
    });
  }

  // ===== 快捷修改 =====
  function renderQuickModify() {
    quickModifyEl.innerHTML = '';
    QUICK_MODIFY.forEach(q => {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'quick-chip';
      chip.textContent = q;
      chip.addEventListener('click', () => {
        modifyInput.value = q;
        applyModify();
      });
      quickModifyEl.appendChild(chip);
    });
  }

  // ===== Toast =====
  let toastTimer = null;
  function showToast(msg, type) {
    toast.textContent = msg;
    toast.className = 'toast show' + (type ? ' ' + type : '');
    toast.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => { toast.hidden = true; }, 300);
    }, 2600);
  }

  // ===== 魔法粒子 =====
  function spawnParticles() {
    magicParticles.innerHTML = '';
    const count = 22;
    for (let i = 0; i < count; i++) {
      const p = document.createElement('span');
      p.className = 'particle';
      const angle = (i / count) * Math.PI * 2;
      const dist = 140 + Math.random() * 80;
      const sx = Math.cos(angle) * dist;
      const sy = Math.sin(angle) * dist;
      p.style.left = '50%';
      p.style.top = '50%';
      const size = 3 + Math.random() * 4;
      p.style.width = size + 'px';
      p.style.height = size + 'px';
      const colors = ['#ffd166', '#f5b942', '#4fd1c5', '#c44569'];
      p.style.background = colors[i % colors.length];
      p.style.boxShadow = '0 0 8px ' + p.style.background;
      const delay = Math.random() * 0.6;
      const dur = 1.2 + Math.random() * 0.8;
      p.animate([
        { transform: `translate(${sx}px, ${sy}px) scale(0)`, opacity: 0 },
        { transform: `translate(${sx * 0.5}px, ${sy * 0.5}px) scale(1)`, opacity: 1, offset: 0.4 },
        { transform: 'translate(0,0) scale(0.3)', opacity: 0 }
      ], { duration: dur * 1000, delay: delay * 1000, iterations: Infinity, easing: 'ease-in-out' });
      magicParticles.appendChild(p);
    }
  }

  function showMagic(text) {
    magicText.textContent = text;
    magicOverlay.hidden = false;
    spawnParticles();
  }
  function hideMagic() {
    magicOverlay.hidden = true;
    magicParticles.innerHTML = '';
  }

  // 旋转文案
  let phraseTimer = null;
  function rotatePhrases() {
    let i = 0;
    magicText.textContent = MAGIC_PHRASES[0];
    phraseTimer = setInterval(() => {
      i = (i + 1) % MAGIC_PHRASES.length;
      magicText.textContent = MAGIC_PHRASES[i];
    }, 700);
  }
  function stopPhrases() {
    clearInterval(phraseTimer);
    phraseTimer = null;
  }

  // ===== 渲染预览 =====
  function renderPreview(html, statusText) {
    emptyState.hidden = true;
    previewFrame.hidden = false;
    previewFrame.srcdoc = html;
    previewStatus.textContent = statusText || '🪄 魔法已生效';
  }

  // ===== 生成 =====
  function generate() {
    const text = promptInput.value.trim();
    if (!text) {
      showToast('先描述一下你想要的页面吧 ✍️', 'error');
      promptInput.focus();
      return;
    }
    generateBtn.disabled = true;
    showMagic('正在施展魔法…');
    rotatePhrases();

    // 模拟思考时长
    setTimeout(() => {
      try {
        const result = window.Generator.generate(text, state.selectedScene);
        state.currentScene = result.scene;
        state.currentOpts = result.opts;
        state.currentHtml = result.html;

        const sceneMeta = window.Templates.SCENES.find(s => s.key === result.scene);
        renderPreview(result.html, `✨ ${sceneMeta ? sceneMeta.emoji + ' ' + sceneMeta.label : '已生成'} · ${result.paletteName}配色`);

        saveHistory({
          scene: result.scene,
          sceneLabel: sceneMeta ? sceneMeta.label : '页面',
          sceneEmoji: sceneMeta ? sceneMeta.emoji : '✨',
          prompt: text,
          html: result.html,
          opts: result.opts,
          time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
        });

        stopPhrases();
        hideMagic();
        showToast('页面变出来啦！🎉', 'success');
      } catch (e) {
        stopPhrases();
        hideMagic();
        showToast('施法失败：' + e.message, 'error');
        console.error(e);
      } finally {
        generateBtn.disabled = false;
      }
    }, 1900);
  }

  // ===== 修改 =====
  function applyModify() {
    const text = modifyInput.value.trim();
    if (!text) {
      showToast('告诉魔术师想改什么', 'error');
      modifyInput.focus();
      return;
    }
    if (!state.currentHtml) {
      showToast('得先施展一次魔法生成页面哦', 'error');
      return;
    }
    try {
      const result = window.Modifier.apply(state.currentHtml, state.currentOpts, state.currentScene, text);
      if (result.changed) {
        state.currentHtml = result.html;
        state.currentOpts = result.opts;
        renderPreview(result.html);
        // 更新历史中最新一项的 html/opts
        if (state.history.length) {
          state.history[0].html = result.html;
          state.history[0].opts = result.opts;
          persistHistory();
        }
      }
      showToast(result.message, result.changed ? 'success' : 'error');
      modifyInput.value = '';
    } catch (e) {
      showToast('修改失败：' + e.message, 'error');
      console.error(e);
    }
  }

  // ===== 下载 =====
  function download() {
    if (!state.currentHtml) { showToast('先施法生成一个页面', 'error'); return; }
    const blob = new Blob([state.currentHtml], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const title = (state.currentOpts && state.currentOpts.title) || 'html-magician';
    a.href = url;
    a.download = title.replace(/[\\/:*?"<>|]/g, '_') + '.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('HTML 已下载 💾', 'success');
  }

  // ===== 新窗口打开 =====
  function openNewWindow() {
    if (!state.currentHtml) { showToast('先施法生成一个页面', 'error'); return; }
    const w = window.open('', '_blank');
    if (!w) { showToast('浏览器拦截了弹窗，请允许', 'error'); return; }
    w.document.open();
    w.document.write(state.currentHtml);
    w.document.close();
  }

  // ===== 复制源码 =====
  function copySource() {
    if (!state.currentHtml) { showToast('先施法生成一个页面', 'error'); return; }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(state.currentHtml).then(
        () => showToast('源码已复制 📋', 'success'),
        () => fallbackCopy(state.currentHtml)
      );
    } else {
      fallbackCopy(state.currentHtml);
    }
  }
  function fallbackCopy(text) {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); showToast('源码已复制 📋', 'success'); }
    catch (e) { showToast('复制失败，请手动复制', 'error'); }
    document.body.removeChild(ta);
  }

  // ===== 清空 =====
  function clearAll() {
    if (!state.currentHtml && !promptInput.value) return;
    if (!confirm('确定清空当前页面和输入吗？')) return;
    promptInput.value = '';
    modifyInput.value = '';
    state.currentScene = null;
    state.currentOpts = null;
    state.currentHtml = null;
    state.selectedScene = null;
    sceneTagsEl.querySelectorAll('.scene-tag').forEach(t => t.classList.remove('active'));
    previewFrame.hidden = true;
    previewFrame.srcdoc = '';
    emptyState.hidden = false;
    previewStatus.textContent = '🪄 等待你施展第一个魔法';
    showToast('已清空，重新开始 ✨');
  }

  // ===== 历史 =====
  function loadHistory() {
    try {
      const raw = localStorage.getItem('htmlMagician.history');
      state.history = raw ? JSON.parse(raw) : [];
    } catch (e) { state.history = []; }
    renderHistory();
  }
  function persistHistory() {
    try { localStorage.setItem('htmlMagician.history', JSON.stringify(state.history)); } catch (e) {}
  }
  function saveHistory(item) {
    state.history.unshift(item);
    if (state.history.length > 5) state.history = state.history.slice(0, 5);
    persistHistory();
    renderHistory();
  }
  function renderHistory() {
    if (!state.history.length) { historyBlock.hidden = true; return; }
    historyBlock.hidden = false;
    historyList.innerHTML = '';
    state.history.forEach((h, idx) => {
      const item = document.createElement('div');
      item.className = 'history-item';
      item.innerHTML = `<span class="h-emoji">${h.sceneEmoji || '✨'}</span><span class="h-text">${escapeHtml(h.prompt)}</span><span class="h-time">${h.time || ''}</span>`;
      item.addEventListener('click', () => {
        state.currentScene = h.scene;
        state.currentOpts = h.opts;
        state.currentHtml = h.html;
        promptInput.value = h.prompt;
        renderPreview(h.html, '↩ 已回看历史记录');
        showToast('已回看这条魔法记录', 'success');
      });
      historyList.appendChild(item);
    });
  }

  function escapeHtml(s) {
    return String(s || '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  // ===== 视图切换 =====
  function bindViewToggle() {
    document.querySelectorAll('.view-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        if (btn.dataset.view === 'mobile') {
          previewFrame.classList.add('mobile-view');
        } else {
          previewFrame.classList.remove('mobile-view');
        }
      });
    });
  }

  // ===== 事件绑定 =====
  function bindEvents() {
    generateBtn.addEventListener('click', generate);
    modifyBtn.addEventListener('click', applyModify);
    downloadBtn.addEventListener('click', download);
    newWindowBtn.addEventListener('click', openNewWindow);
    copyBtn.addEventListener('click', copySource);
    clearBtn.addEventListener('click', clearAll);

    promptInput.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') generate();
    });
    modifyInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') applyModify();
    });
  }

  // ===== 启动 =====
  function init() {
    renderSceneTags();
    renderExamples();
    renderQuickModify();
    bindViewToggle();
    bindEvents();
    loadHistory();

    // 从介绍页带过来的 prompt（自动填充并施法）
    try {
      const params = new URLSearchParams(window.location.search);
      const p = params.get('prompt');
      if (p) {
        promptInput.value = p;
        generate();
      }
    } catch (e) { /* ignore */ }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
