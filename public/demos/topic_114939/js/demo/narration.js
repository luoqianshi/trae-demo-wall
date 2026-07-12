const esc = window.escapeHtml;
window.narrationQueue = [];
window.narrationIndex = 0;

window.updateNarration = function(text) {
  const narrationContent = document.getElementById('narrationContent');
  
  if (!narrationContent) return;

  if (text) {
    narrationContent.innerHTML = `
      <div class="narration-text animate-fade-in">${esc(text)}</div>
      ${window.autoDemoRunning ? '<div class="narration-indicator">🔊 演示中...</div>' : ''}
    `;
  } else {
    narrationContent.innerHTML = `
      <div class="narration-text">点击顶部「▶ 完整演示」开始自动演示，旁白将同步讲解每个页面的核心功能。</div>
      <div class="narration-hint">💡 您也可以手动点击左侧菜单探索各个页面</div>
    `;
  }
};

window.clearNarration = function() {
  updateNarration('');
};

window.showNarration = function(text, autoClear = true, clearDelay = 5000) {
  updateNarration(text);
  
  if (autoClear) {
    setTimeout(function() {
      if (!window.autoDemoRunning) {
        clearNarration();
      }
    }, clearDelay);
  }
};