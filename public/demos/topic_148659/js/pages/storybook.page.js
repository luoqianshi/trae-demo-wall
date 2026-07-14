window.StorybookPage = function(container) {
  const esc = window.escapeHtml;
  const data = window.DemoData || {};
  const storybooks = (data.storybooks && data.storybooks.length) ? data.storybooks : [];

  if (storybooks.length === 0) {
    container.innerHTML = `
      <div class="storybook-page page-transition">
        <div class="page-header">
          <div class="page-title">课本绘本</div>
          <div class="page-subtitle">从故事中学习汉字</div>
        </div>
        <div style="text-align:center; padding:60px 20px; color:#999;">暂无绘本数据</div>
      </div>
    `;
    return;
  }

  let activeBookId = storybooks[0]._id || storybooks[0].id;
  let currentPageIdx = 0;
  let isPlaying = false;
  let currentAudio = null;

  function stopAudio() {
    if (currentAudio) {
      currentAudio.pause();
      currentAudio = null;
    }
    isPlaying = false;
  }

  function playPageAudio(page) {
    stopAudio();
    const audioUrl = page.audio_url;
    if (!audioUrl) return;
    const audio = new Audio(audioUrl);
    audio.playbackRate = 0.7;
    currentAudio = audio;
    isPlaying = true;
    audio.play().catch(e => console.warn('音频播放失败:', e));
    audio.onended = () => { isPlaying = false; render(); };
    render();
  }

  function getCurrentBook() {
    return storybooks.find(b => (b._id || b.id) === activeBookId) || storybooks[0];
  }

  function render() {
    const book = getCurrentBook();
    const pages = book.pages || [];
    const safeIdx = Math.min(currentPageIdx, pages.length - 1);
    const page = pages[safeIdx] || {};

    container.innerHTML = `
      <div class="storybook-page page-transition">
        <div class="page-header">
          <div class="page-title">课本绘本</div>
          <div class="page-subtitle">${esc(book.title)} · 部编版${esc(book.grade || '')} · ${esc(book.source || '')}</div>
        </div>



        ${pages.length > 0 ? `
          <div class="storybook-reader">
            <div class="reader-image-wrap">
              <img class="reader-image" src="${esc(page.image_url || '')}" alt="${esc(book.title)} 第${safeIdx+1}页" onerror="this.style.display='none'" />
            </div>
            <div class="reader-text">${esc(page.text || '')}</div>
            <div class="reader-controls">
              <button class="ctrl-btn primary" onclick="playCurrentPageAudio()">${isPlaying ? '⏸ 停止' : '🔊 朗读'}</button>
            </div>
          </div>

          <div class="chars-section">
            <div class="chars-title">本课生字</div>
            <div class="chars-list">
              ${(page.characters || []).map(ch => `<div class="char-chip">${esc(ch)}</div>`).join('')}
            </div>
          </div>
        ` : `
          <div style="text-align:center; padding:60px 20px; color:#999;">这本绘本暂无内容</div>
        `}
      </div>
    `;
  }

  window.switchBookTab = function(bookId) {
    stopAudio();
    activeBookId = bookId;
    currentPageIdx = 0;
    render();
  };

  window.prevStoryPage = function() {
    if (currentPageIdx > 0) {
      stopAudio();
      currentPageIdx--;
      render();
    }
  };

  window.nextStoryPage = function() {
    const book = getCurrentBook();
    if (currentPageIdx < (book.pages || []).length - 1) {
      stopAudio();
      currentPageIdx++;
      render();
    }
  };

  window.playCurrentPageAudio = function() {
    const book = getCurrentBook();
    const pages = book.pages || [];
    const page = pages[currentPageIdx];
    if (!page) return;
    if (isPlaying) {
      stopAudio();
      render();
    } else {
      playPageAudio(page);
    }
  };

  render();
};
