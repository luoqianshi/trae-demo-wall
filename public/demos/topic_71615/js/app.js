/* ==========================================
   App 主入口 - 初始化 + 事件绑定 + 全局协调
   ========================================== */

(function () {
  'use strict';

  // ========== 全局 Toast ==========
  window.showToast = function (message, type = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const icons = {
      success: 'fa-check-circle',
      warning: 'fa-exclamation-triangle',
      error: 'fa-times-circle',
      info: 'fa-info-circle'
    };

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<i class="fas ${icons[type] || icons.info}"></i><span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.animation = 'toastOut 0.3s ease forwards';
      setTimeout(() => toast.remove(), 300);
    }, 2500);
  };

  // ========== DOM 元素引用 ==========
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  const els = {
    fileInput: $('#file-input'),
    btnUpload: $('#btn-upload'),
    btnResetAtmosphere: $('#btn-reset-atmosphere'),
    btnSaveConfig: $('#btn-save-config'),
    novelInput: $('#novel-input'),
    btnParse: $('#btn-parse'),
    emptyState: $('#empty-state'),
    textInputArea: $('#text-input-area'),
    readerArea: $('#reader-area'),
    novelContent: $('#novel-content'),
    currentMood: $('#current-mood'),
    selectionPopup: $('#selection-popup'),
    btnAddCharacter: $('#btn-add-character'),
    chatArea: $('#chat-area'),
    chatInput: $('#chat-input'),
    btnSendChat: $('#btn-send-chat'),
    btnCloseChat: $('#btn-close-chat'),
    btnExportChat: $('#btn-export-chat'),
    btnClearChat: $('#btn-clear-chat'),
    filterWarmth: $('#filter-warmth'),
    filterVignette: $('#filter-vignette'),
    filterBrightness: $('#filter-brightness'),
    musicVolume: $('#music-volume'),
    fontSizeSlider: $('#font-size-slider'),
    fontSizeVal: $('#font-size-val'),
    lineHeightSlider: $('#line-height-slider'),
    lineHeightVal: $('#line-height-val'),
    reducedMotionToggle: $('#reduced-motion-toggle')
  };

  // ========== 状态 ==========
  let parsedParagraphs = [];
  let selectedText = '';
  let selectionRect = null;

  // ========== 初始化 ==========
  function init() {
    bindThemeSwitcher();
    bindFileUpload();
    bindParseButton();
    bindSelectionPopup();
    bindChatControls();
    bindFilterControls();
    bindMusicControls();
    bindBackgroundControls();
    bindReadingSliders();
    bindPerformanceToggle();
    bindAtmosphereActions();
    bindKeyboardShortcuts();

    // 初始化主题粒子
    ThemeManager.startParticles();

    // 初始化滤镜
    ThemeManager.updateFilter(
      els.filterWarmth?.value || 50,
      els.filterVignette?.value || 30,
      els.filterBrightness?.value || 90
    );

    // 从localStorage恢复阅读设置和主题配置
    restoreReadingSettings();
    restoreThemeConfig();

    showToast('AI剧情沉浸阅读器已就绪', 'info');
  }

  // ========== 主题切换 ==========
  function bindThemeSwitcher() {
    $$('.theme-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        ThemeManager.switchTheme(btn.dataset.theme);
      });
    });
  }

  // ========== 文件上传 ==========
  function bindFileUpload() {
    if (els.btnUpload) {
      els.btnUpload.addEventListener('click', () => {
        els.fileInput.click();
      });
    }

    if (els.fileInput) {
      els.fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (ev) => {
          const text = ev.target.result;
          if (els.novelInput) {
            els.novelInput.value = text;
          }
          if (!els.textInputArea.classList.contains('hidden')) {
            els.emptyState.classList.add('hidden');
            els.textInputArea.classList.remove('hidden');
          }
          showToast(`已加载文件「${file.name}」`, 'success');
        };
        reader.readAsText(file, 'UTF-8');
        e.target.value = '';
      });
    }
  }

  // ========== 解析并展示小说 ==========
  function bindParseButton() {
    if (els.btnParse) {
      els.btnParse.addEventListener('click', () => {
        const text = els.novelInput.value.trim();
        if (!text) {
          showToast('请先输入或上传小说文本', 'warning');
          return;
        }
        parseAndRender(text);
      });
    }
  }

  function parseAndRender(text) {
    // 显示加载提示
    showToast('正在分析情绪...', 'info');

    // 使用 requestAnimationFrame 让UI先更新
    requestAnimationFrame(() => {
      // 1. 情绪分析（多维度评分）
      parsedParagraphs = EmotionEngine.analyzeFullText(text);
      const distribution = EmotionEngine.getOverallEmotionDistribution(parsedParagraphs);

      // 2. 提取角色
      const extractedChars = EmotionEngine.extractCharacters(text);
      CharacterChat.setCharacters(extractedChars);
      CharacterChat.setNovelContext(text);

      // 3. 渲染阅读区
      els.emptyState.classList.add('hidden');
      els.textInputArea.classList.add('hidden');
      els.readerArea.classList.remove('hidden');

      renderNovelContent(parsedParagraphs);

      // 4. 更新情绪面板
      updateEmotionPanel(distribution);

      // 5. 设置主情绪 → 自动联动：背景 + 滤镜预设 + BGM
      const dominantEmotion = getDominantEmotion(distribution);
      if (dominantEmotion) {
        // 背景自动匹配
        ThemeManager.setEmotion(dominantEmotion);

        // 滤镜预设自动应用
        const emotionData = EmotionEngine.EMOTION_KEYWORDS[dominantEmotion];
        if (emotionData && emotionData.atmosphere) {
          ThemeManager.applyFilterPreset(emotionData.atmosphere.filterPreset);
        }

        // BGM自动播放
        MusicPlayer.autoPlay(dominantEmotion);
      }

      showToast(`已分析 ${parsedParagraphs.length} 个段落，识别 ${extractedChars.length} 个角色`, 'success');
    });
  }

  function renderNovelContent(paragraphs) {
    if (!els.novelContent) return;

    // 使用 DocumentFragment 减少DOM重排
    const fragment = document.createDocumentFragment();
    const chars = CharacterChat.getCharacters();

    paragraphs.forEach((p, i) => {
      const div = document.createElement('div');
      div.className = 'paragraph';
      div.dataset.index = i;
      div.dataset.emotion = p.emotion || '';

      // 高亮角色名
      let displayText = escapeHtml(p.text);
      for (const char of chars) {
        const regex = new RegExp(`(?<![\\s])${escapeRegex(char.name)}(?![\\s])`, 'g');
        displayText = displayText.replace(regex, `<span class="char-name" data-name="${escapeHtml(char.name)}">${escapeHtml(char.name)}</span>`);
      }

      const emotionTag = p.emotion
        ? `<span class="emotion-label ${p.emotion}">${p.emotionLabel}</span>`
        : '';

      div.innerHTML = displayText + emotionTag;
      fragment.appendChild(div);
    });

    els.novelContent.innerHTML = '';
    els.novelContent.appendChild(fragment);

    // 绑定段落点击事件
    els.novelContent.querySelectorAll('.paragraph').forEach(pEl => {
      pEl.addEventListener('click', () => {
        els.novelContent.querySelectorAll('.paragraph').forEach(el => el.classList.remove('highlighted'));
        pEl.classList.add('highlighted');

        const emotion = pEl.dataset.emotion;
        if (emotion && els.currentMood) {
          els.currentMood.textContent = EmotionEngine.EMOTION_KEYWORDS[emotion]?.label || '--';
          els.currentMood.className = `mood-tag ${emotion}`;
          ThemeManager.setEmotion(emotion);

          // 应用该段落的滤镜预设
          const p = parsedParagraphs[parseInt(pEl.dataset.index)];
          if (p && p.atmosphere) {
            ThemeManager.applyFilterPreset(p.atmosphere.filterPreset);
          }
          if (emotion) {
            MusicPlayer.autoPlay(emotion);
          }
        }

        // 更新情绪条
        const p = parsedParagraphs[parseInt(pEl.dataset.index)];
        if (p) {
          updateEmotionBars(p.scores);
        }
      });

      // 角色名点击
      pEl.querySelectorAll('.char-name').forEach(nameEl => {
        nameEl.addEventListener('click', (e) => {
          e.stopPropagation();
          CharacterChat.openChat(nameEl.dataset.name);
        });
      });
    });
  }

  function updateEmotionPanel(distribution) {
    for (const [emotion, pct] of Object.entries(distribution)) {
      const fill = $(`.emotion-fill[data-emotion="${emotion}"]`);
      if (fill) {
        fill.style.width = `${pct}%`;
      }
    }

    const dominant = getDominantEmotion(distribution);
    $$('.emotion-card').forEach(card => {
      card.classList.toggle('active', card.dataset.emotion === dominant);
    });
  }

  function updateEmotionBars(scores) {
    for (const [emotion, score] of Object.entries(scores)) {
      const fill = $(`.emotion-fill[data-emotion="${emotion}"]`);
      if (fill) {
        fill.style.width = `${Math.min(100, score)}%`;
      }
    }
  }

  function getDominantEmotion(distribution) {
    let max = 0, dominant = null;
    for (const [emotion, pct] of Object.entries(distribution)) {
      if (pct > max) { max = pct; dominant = emotion; }
    }
    return dominant;
  }

  // ========== 文本选中文本气泡 ==========
  function bindSelectionPopup() {
    const novelContent = $('#novel-content');
    if (!novelContent) return;

    novelContent.addEventListener('mouseup', (e) => {
      setTimeout(() => {
        const selection = window.getSelection();
        const text = selection.toString().trim();

        if (text && text.length <= 10 && !e.target.closest('.char-name')) {
          selectedText = text;
          const range = selection.getRangeAt(0);
          selectionRect = range.getBoundingClientRect();
          showSelectionPopup(selectionRect);
        } else {
          hideSelectionPopup();
        }
      }, 10);
    });

    document.addEventListener('mousedown', (e) => {
      if (!e.target.closest('.selection-popup') && !e.target.closest('#novel-content')) {
        hideSelectionPopup();
      }
    });

    if (els.btnAddCharacter) {
      els.btnAddCharacter.addEventListener('click', () => {
        if (selectedText) {
          CharacterChat.addCharacter(selectedText);
          CharacterChat.openChat(selectedText);
          hideSelectionPopup();
          window.getSelection().removeAllRanges();
          selectedText = '';
        }
      });
    }
  }

  function showSelectionPopup(rect) {
    const popup = els.selectionPopup;
    if (!popup) return;

    popup.classList.remove('hidden');

    // 使用视口坐标（clientX/Y），不受面板overflow:hidden裁切
    const popupWidth = 160;
    const popupHeight = 40;
    let left = rect.left + rect.width / 2 - popupWidth / 2;
    let top = rect.top - popupHeight - 8;

    // 边界修正：不超出视口
    const viewW = window.innerWidth;
    const viewH = window.innerHeight;
    if (left < 8) left = 8;
    if (left + popupWidth > viewW - 8) left = viewW - popupWidth - 8;
    if (top < 8) {
      // 如果上方空间不够，显示在选区下方
      top = rect.bottom + 8;
    }
    if (top + popupHeight > viewH - 8) {
      top = viewH - popupHeight - 8;
    }

    popup.style.left = `${left}px`;
    popup.style.top = `${top}px`;
  }

  function hideSelectionPopup() {
    if (els.selectionPopup) {
      els.selectionPopup.classList.add('hidden');
    }
  }

  // ========== 对话控制 ==========
  function bindChatControls() {
    if (els.btnSendChat) {
      els.btnSendChat.addEventListener('click', () => {
        if (els.chatInput) {
          CharacterChat.sendMessage(els.chatInput.value);
        }
      });
    }

    if (els.chatInput) {
      els.chatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          CharacterChat.sendMessage(els.chatInput.value);
        }
      });
    }

    if (els.btnCloseChat) {
      els.btnCloseChat.addEventListener('click', () => {
        CharacterChat.closeChat();
      });
    }

    // 导出对话
    if (els.btnExportChat) {
      els.btnExportChat.addEventListener('click', () => {
        const activeName = CharacterChat.getActiveCharacter();
        if (!activeName) return;

        const text = CharacterChat.exportChat(activeName);
        if (!text) {
          showToast('暂无对话记录', 'warning');
          return;
        }

        // 下载为文本文件
        const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `对话记录_${activeName}.txt`;
        a.click();
        URL.revokeObjectURL(url);

        showToast(`已导出「${activeName}」的对话记录`, 'success');
      });
    }

    // 清除对话
    if (els.btnClearChat) {
      els.btnClearChat.addEventListener('click', () => {
        const activeName = CharacterChat.getActiveCharacter();
        if (!activeName) return;

        if (CharacterChat.clearChat(activeName)) {
          showToast(`已清除「${activeName}」的对话记录`, 'warning');
        }
      });
    }

    // 聊天模式切换
    $$('.chat-mode').forEach(btn => {
      btn.addEventListener('click', () => {
        $$('.chat-mode').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        CharacterChat.setChatMode(btn.dataset.mode);
      });
    });
  }

  // ========== 滤镜控制 ==========
  function bindFilterControls() {
    const update = () => {
      ThemeManager.updateFilter(
        els.filterWarmth?.value || 50,
        els.filterVignette?.value || 30,
        els.filterBrightness?.value || 90
      );
    };

    [els.filterWarmth, els.filterVignette, els.filterBrightness].forEach(el => {
      if (el) el.addEventListener('input', update);
    });
  }

  // ========== 音乐控制 ==========
  function bindMusicControls() {
    $$('.music-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        MusicPlayer.toggle(btn.dataset.music);
      });
    });

    if (els.musicVolume) {
      els.musicVolume.addEventListener('input', () => {
        MusicPlayer.setVolume(els.musicVolume.value / 100);
      });
    }
  }

  // ========== 背景选择 ==========
  function bindBackgroundControls() {
    $$('.bg-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        $$('.bg-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        if (btn.dataset.bg === 'auto') {
          ThemeManager.setBackground('auto', null);
        } else {
          ThemeManager.setBackground(btn.dataset.bg, null);
        }
      });
    });
  }

  // ========== 阅读排版滑块 ==========
  function bindReadingSliders() {
    if (els.fontSizeSlider) {
      els.fontSizeSlider.addEventListener('input', () => {
        const val = els.fontSizeSlider.value;
        const content = $('#novel-content');
        if (content) content.style.fontSize = `${val}px`;
        if (els.fontSizeVal) els.fontSizeVal.textContent = `${val}px`;
        // 保存设置
        try { localStorage.setItem('novel_reader_fontSize', val); } catch (e) {}
      });
    }

    if (els.lineHeightSlider) {
      els.lineHeightSlider.addEventListener('input', () => {
        const val = els.lineHeightSlider.value;
        const content = $('#novel-content');
        if (content) content.style.lineHeight = val;
        if (els.lineHeightVal) els.lineHeightVal.textContent = val;
        // 保存设置
        try { localStorage.setItem('novel_reader_lineHeight', val); } catch (e) {}
      });
    }
  }

  function restoreReadingSettings() {
    try {
      const savedSize = localStorage.getItem('novel_reader_fontSize');
      const savedLineHeight = localStorage.getItem('novel_reader_lineHeight');

      if (savedSize && els.fontSizeSlider) {
        els.fontSizeSlider.value = savedSize;
        els.fontSizeVal.textContent = `${savedSize}px`;
        const content = $('#novel-content');
        if (content) content.style.fontSize = `${savedSize}px`;
      }

      if (savedLineHeight && els.lineHeightSlider) {
        els.lineHeightSlider.value = savedLineHeight;
        els.lineHeightVal.textContent = savedLineHeight;
        const content = $('#novel-content');
        if (content) content.style.lineHeight = savedLineHeight;
      }
    } catch (e) {}
  }

  // ========== 性能模式 ==========
  function bindPerformanceToggle() {
    if (els.reducedMotionToggle) {
      els.reducedMotionToggle.addEventListener('change', () => {
        const enabled = els.reducedMotionToggle.checked;
        ThemeManager.setReducedMotion(enabled);
        document.body.classList.toggle('reduced-motion', enabled);
        showToast(enabled ? '已开启性能模式，动画已简化' : '已关闭性能模式，动画已恢复', 'info');
      });
    }
  }

  // ========== 一键重置氛围 + 保存配置 ==========
  function bindAtmosphereActions() {
    // 重置氛围：恢复默认滤镜、背景自动匹配、停止音乐
    if (els.btnResetAtmosphere) {
      els.btnResetAtmosphere.addEventListener('click', () => {
        // 重置滤镜滑块到默认值
        ThemeManager.applyFilterPreset({ warmth: 50, vignette: 30, brightness: 90 });

        // 背景恢复自动匹配
        $$('.bg-btn').forEach(b => b.classList.remove('active'));
        const autoBtn = $('.bg-btn[data-bg="auto"]');
        if (autoBtn) autoBtn.classList.add('active');
        ThemeManager.setBackground('auto', null);

        // 停止音乐
        MusicPlayer.stop();

        // 重置情绪条
        $$('.emotion-fill').forEach(fill => { fill.style.width = '0%'; });
        $$('.emotion-card').forEach(card => card.classList.remove('active'));

        // 重置情绪标签
        if (els.currentMood) {
          els.currentMood.textContent = '--';
          els.currentMood.className = 'mood-tag';
        }

        showToast('氛围已重置为默认状态', 'info');
      });
    }

    // 保存当前主题配置
    if (els.btnSaveConfig) {
      els.btnSaveConfig.addEventListener('click', () => {
        saveThemeConfig();
        showToast('主题配置已保存', 'success');
      });
    }
  }

  function saveThemeConfig() {
    const config = {
      theme: ThemeManager.getCurrentTheme(),
      warmth: els.filterWarmth?.value || 50,
      vignette: els.filterVignette?.value || 30,
      brightness: els.filterBrightness?.value || 90,
      fontSize: els.fontSizeSlider?.value || 16,
      lineHeight: els.lineHeightSlider?.value || 1.8,
      volume: els.musicVolume?.value || 40,
      reducedMotion: els.reducedMotionToggle?.checked || false,
      timestamp: Date.now()
    };
    try {
      localStorage.setItem('novel_reader_themeConfig', JSON.stringify(config));
    } catch (e) {}
  }

  function restoreThemeConfig() {
    try {
      const saved = localStorage.getItem('novel_reader_themeConfig');
      if (!saved) return;

      const config = JSON.parse(saved);

      // 恢复主题
      if (config.theme && config.theme !== ThemeManager.getCurrentTheme()) {
        ThemeManager.switchTheme(config.theme);
      }

      // 恢复滤镜
      ThemeManager.applyFilterPreset({
        warmth: config.warmth || 50,
        vignette: config.vignette || 30,
        brightness: config.brightness || 90
      });

      // 恢复音量
      if (config.volume != null) {
        MusicPlayer.setVolume(config.volume / 100);
        if (els.musicVolume) els.musicVolume.value = config.volume;
      }

      // 恢复减少动画
      if (config.reducedMotion && els.reducedMotionToggle) {
        els.reducedMotionToggle.checked = true;
        ThemeManager.setReducedMotion(true);
        document.body.classList.add('reduced-motion');
      }
    } catch (e) {}
  }

  // ========== 快捷键 ==========
  function bindKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.key === 'Enter') {
        const text = els.novelInput?.value.trim();
        if (text) parseAndRender(text);
      }

      if (e.key === 'Escape') {
        hideSelectionPopup();
        CharacterChat.closeChat();
      }
    });
  }

  // ========== 工具函数 ==========
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  // ========== 启动 ==========
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
