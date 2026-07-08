/**
 * 鼓韵声纹 - 应用主逻辑
 * 页面导航、状态管理、事件处理
 */

(function() {
  'use strict';

  // ===== 应用状态 =====
  const AppState = {
    currentPage: 'home',
    userImage: null,
    selectedTrackId: null,
    selectedQuote: '',
    customQuote: '',
    generatedPoster: null
  };

  // 曲牌数据
  const Tracks = [
    { id: 'nian', name: '闹年夜', scene: '过年', desc: '喜庆热烈，打出年味' },
    { id: 'yingqin', name: '迎亲调', scene: '婚礼', desc: '欢快热闹，送祝福' },
    { id: 'haocao', name: '薅草歌', scene: '劳动', desc: '节奏明快，丰收喜悦' },
    { id: 'chongtian', name: '冲天炮', scene: '节日', desc: '激情昂扬，锣鼓喧天' }
  ];

  // ===== DOM 元素缓存 =====
  const DOM = {};

  function cacheElements() {
    // 页面
    DOM.pages = {
      home: document.getElementById('page-home'),
      select: document.getElementById('page-select'),
      preview: document.getElementById('page-preview')
    };

    // 首页元素
    DOM.btnStart = document.getElementById('btn-start');

    // 曲牌选择页元素
    DOM.btnBackHome = document.getElementById('btn-back-home');
    DOM.uploadArea = document.getElementById('upload-area');
    DOM.uploadPlaceholder = document.getElementById('upload-placeholder');
    DOM.previewImage = document.getElementById('preview-image');
    DOM.btnChangePhoto = document.getElementById('btn-change-photo');
    DOM.fileInput = document.getElementById('file-input');
    DOM.trackItems = document.querySelectorAll('.track-item');
    DOM.btnGenerate = document.getElementById('btn-generate');

    // 预览页元素
    DOM.btnBackSelect = document.getElementById('btn-back-select');
    DOM.posterCanvas = document.getElementById('poster-canvas');
    DOM.posterResult = document.getElementById('poster-result');
    DOM.posterImage = document.getElementById('poster-image');
    DOM.quoteSelect = document.getElementById('quote-select');
    DOM.quoteCustom = document.getElementById('quote-custom');
    DOM.btnRegenerate = document.getElementById('btn-regenerate');
    DOM.btnDownload = document.getElementById('btn-download');
    DOM.btnRestart = document.getElementById('btn-restart');
  }

  // ===== 页面导航 =====
  function navigateTo(pageName) {
    // 隐藏所有页面
    Object.values(DOM.pages).forEach(page => {
      page.classList.remove('active');
    });

    // 显示目标页面
    if (DOM.pages[pageName]) {
      DOM.pages[pageName].classList.add('active');
      AppState.currentPage = pageName;

      // 如果进入预览页，生成海报
      if (pageName === 'preview') {
        generatePoster();
      }
    }
  }

  // ===== 图片上传处理 =====
  function handleImageUpload(file) {
    if (!file) return;

    // 验证文件类型
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      alert('请上传 JPG 或 PNG 格式的图片');
      return;
    }

    // 验证文件大小（5MB）
    if (file.size > 5 * 1024 * 1024) {
      alert('图片大小不能超过 5MB');
      return;
    }

    // 读取文件为 Base64
    const reader = new FileReader();
    reader.onload = function(e) {
      AppState.userImage = e.target.result;
      updateUploadPreview();
      updateGenerateButton();
    };
    reader.readAsDataURL(file);
  }

  function updateUploadPreview() {
    if (AppState.userImage) {
      DOM.previewImage.src = AppState.userImage;
      DOM.previewImage.classList.remove('hidden');
      DOM.uploadPlaceholder.classList.add('hidden');
      DOM.btnChangePhoto.classList.remove('hidden');
    } else {
      DOM.previewImage.classList.add('hidden');
      DOM.uploadPlaceholder.classList.remove('hidden');
      DOM.btnChangePhoto.classList.add('hidden');
    }
  }

  // ===== 曲牌选择 =====
  function selectTrack(trackId) {
    AppState.selectedTrackId = trackId;

    // 更新 UI
    DOM.trackItems.forEach(item => {
      if (item.dataset.trackId === trackId) {
        item.classList.add('selected');
      } else {
        item.classList.remove('selected');
      }
    });

    updateGenerateButton();
  }

  function updateGenerateButton() {
    const canGenerate = AppState.userImage && AppState.selectedTrackId;
    DOM.btnGenerate.disabled = !canGenerate;
  }

  // ===== 海报生成 =====
  function generatePoster() {
    const track = Tracks.find(t => t.id === AppState.selectedTrackId);
    const quote = AppState.customQuote || AppState.selectedQuote || '锣鼓一响，黄金万两';

    // 显示加载状态
    DOM.posterCanvas.style.display = 'none';
    DOM.posterResult.classList.add('hidden');

    // 使用 PosterGenerator 生成海报
    // 注意：需要在图片加载完成后生成
    if (AppState.userImage) {
      const img = new Image();
      img.onload = function() {
        const posterDataUrl = PosterGenerator.generate({
          userImage: AppState.userImage,
          trackId: AppState.selectedTrackId,
          trackName: track ? track.name : '闹年夜',
          quote: quote
        });

        AppState.generatedPoster = posterDataUrl;
        showPosterResult(posterDataUrl);
      };
      img.onerror = function() {
        // 如果图片加载失败，使用纯色背景生成
        const posterDataUrl = PosterGenerator.generate({
          userImage: null,
          trackId: AppState.selectedTrackId,
          trackName: track ? track.name : '闹年夜',
          quote: quote
        });

        AppState.generatedPoster = posterDataUrl;
        showPosterResult(posterDataUrl);
      };
      img.src = AppState.userImage;
    } else {
      const posterDataUrl = PosterGenerator.generate({
        userImage: null,
        trackId: AppState.selectedTrackId,
        trackName: track ? track.name : '闹年夜',
        quote: quote
      });

      AppState.generatedPoster = posterDataUrl;
      showPosterResult(posterDataUrl);
    }
  }

  function showPosterResult(dataUrl) {
    DOM.posterCanvas.style.display = 'none';
    DOM.posterResult.classList.remove('hidden');
    DOM.posterImage.src = dataUrl;
  }

  // ===== 海报下载 =====
  function downloadPoster() {
    if (!AppState.generatedPoster) return;

    const link = document.createElement('a');
    link.download = `鼓韵声纹_${Date.now()}.jpg`;
    link.href = AppState.generatedPoster;
    link.click();
  }

  // ===== 重置状态 =====
  function resetState() {
    AppState.userImage = null;
    AppState.selectedTrackId = null;
    AppState.selectedQuote = '';
    AppState.customQuote = '';
    AppState.generatedPoster = null;

    // 重置 UI
    updateUploadPreview();
    DOM.trackItems.forEach(item => item.classList.remove('selected'));
    DOM.quoteSelect.value = '';
    DOM.quoteCustom.value = '';
    DOM.quoteCustom.classList.add('hidden');
    updateGenerateButton();
  }

  // ===== 金句选择处理 =====
  function handleQuoteChange(value) {
    if (value === 'custom') {
      DOM.quoteCustom.classList.remove('hidden');
      DOM.quoteCustom.focus();
    } else {
      DOM.quoteCustom.classList.add('hidden');
      AppState.selectedQuote = value;
      AppState.customQuote = '';
    }
  }

  function handleCustomQuoteInput(value) {
    AppState.customQuote = value;
  }

  // ===== 事件绑定 =====
  function bindEvents() {
    // 首页 - 开始按钮
    DOM.btnStart.addEventListener('click', function() {
      navigateTo('select');
    });

    // 曲牌选择页 - 返回
    DOM.btnBackHome.addEventListener('click', function() {
      navigateTo('home');
    });

    // 图片上传
    DOM.uploadArea.addEventListener('click', function(e) {
      if (e.target !== DOM.btnChangePhoto) {
        DOM.fileInput.click();
      }
    });

    DOM.btnChangePhoto.addEventListener('click', function(e) {
      e.stopPropagation();
      DOM.fileInput.click();
    });

    DOM.fileInput.addEventListener('change', function(e) {
      const file = e.target.files[0];
      handleImageUpload(file);
    });

    // 拖拽上传
    DOM.uploadArea.addEventListener('dragover', function(e) {
      e.preventDefault();
      this.style.borderColor = '#C41E3A';
    });

    DOM.uploadArea.addEventListener('dragleave', function(e) {
      e.preventDefault();
      this.style.borderColor = '#D4A84B';
    });

    DOM.uploadArea.addEventListener('drop', function(e) {
      e.preventDefault();
      this.style.borderColor = '#D4A84B';
      const file = e.dataTransfer.files[0];
      handleImageUpload(file);
    });

    // 曲牌选择
    DOM.trackItems.forEach(item => {
      item.addEventListener('click', function() {
        selectTrack(this.dataset.trackId);
      });
    });

    // 生成海报
    DOM.btnGenerate.addEventListener('click', function() {
      if (!AppState.disabled) {
        navigateTo('preview');
      }
    });

    // 预览页 - 返回
    DOM.btnBackSelect.addEventListener('click', function() {
      navigateTo('select');
    });

    // 金句选择
    DOM.quoteSelect.addEventListener('change', function() {
      handleQuoteChange(this.value);
    });

    DOM.quoteCustom.addEventListener('input', function() {
      handleCustomQuoteInput(this.value);
    });

    DOM.quoteCustom.addEventListener('blur', function() {
      // 失焦时如果有自定义内容，更新海报
      if (AppState.customQuote && AppState.currentPage === 'preview') {
        generatePoster();
      }
    });

    // 重新生成
    DOM.btnRegenerate.addEventListener('click', function() {
      generatePoster();
    });

    // 下载
    DOM.btnDownload.addEventListener('click', downloadPoster);

    // 重新开始
    DOM.btnRestart.addEventListener('click', function() {
      resetState();
      navigateTo('home');
    });

    // 首页曲牌卡片点击（快速选择曲牌并跳转）
    const trackCards = document.querySelectorAll('.track-card');
    trackCards.forEach(card => {
      card.addEventListener('click', function() {
        const trackId = this.dataset.track;
        AppState.selectedTrackId = trackId;
        navigateTo('select');

        // 延迟更新选择状态，等页面切换完成
        setTimeout(() => {
          selectTrack(trackId);
          updateGenerateButton();
        }, 100);
      });
    });
  }

  // ===== 初始化 =====
  function init() {
    cacheElements();
    bindEvents();

    // 默认选中第一个曲牌（供预览）
    selectTrack('nian');
  }

  // DOM 加载完成后初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
