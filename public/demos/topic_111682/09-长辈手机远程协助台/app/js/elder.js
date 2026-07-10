/* ========================================
   长辈端视图渲染
   ======================================== */
function renderElderView() {
  const helpBtn = document.getElementById('helpBtn');
  const replyView = document.getElementById('replyView');
  if (!helpBtn || !replyView) return;
  const appState = getAppState();

  if (appState === STATE.HELP_SENT) {
    helpBtn.classList.add('sent');
    helpBtn.innerHTML = '<div class="eb-icon">⏳</div><div class="eb-title">已发送，等待回复</div><div class="eb-sub">女儿正在查看</div>';
    helpBtn.disabled = true;
    replyView.classList.remove('show');
  } else if (appState === STATE.REPLY_SENT) {
    helpBtn.classList.remove('sent');
    helpBtn.innerHTML = '<div class="eb-icon">📸</div><div class="eb-title">选择求助方式</div><div class="eb-sub">点击选择截图或共享屏幕</div>';
    helpBtn.disabled = false;
    replyView.classList.add('show');
    showReply();
  } else {
    helpBtn.classList.remove('sent');
    helpBtn.innerHTML = '<div class="eb-icon">📸</div><div class="eb-title">选择求助方式</div><div class="eb-sub">点击选择截图或共享屏幕</div>';
    helpBtn.disabled = false;
    replyView.classList.remove('show');
  }
  renderHistory();
}

/* ========================================
   显示子女回复
   ======================================== */
let replyAudio = null;

function showReply() {
  const replyData = getReplyData();
  if (!replyData) return;
  const img = document.getElementById('replyScreenshot');
  if (img) img.src = replyData.screenshot;
  const voiceWrap = document.getElementById('replyVoice');
  if (!voiceWrap) return;
  if (replyData.audioUrl) {
    voiceWrap.innerHTML = `
      <div class="voice-player" onclick="toggleReplyVoice(event)">
        <div class="voice-play-btn" id="replyPlayBtn">▶</div>
        <div class="voice-wave">
          <div class="wave-bar" style="height:40%"></div><div class="wave-bar" style="height:70%"></div><div class="wave-bar" style="height:50%"></div><div class="wave-bar" style="height:90%"></div><div class="wave-bar" style="height:35%"></div><div class="wave-bar" style="height:65%"></div>
        </div>
        <div class="voice-duration">${formatTime(replyData.duration)}</div>
      </div>
      <div class="voice-text">女儿录了一段语音指引，点击播放</div>
    `;
  } else {
    voiceWrap.innerHTML = '<div class="voice-empty">女儿没有录制语音，请看截图标注操作</div>';
  }
}

function toggleReplyVoice(e) {
  if (e) e.stopPropagation();
  const replyData = getReplyData();
  if (!replyData || !replyData.audioUrl) return;
  const btn = document.getElementById('replyPlayBtn');
  const player = btn ? btn.parentElement : null;
  if (!btn || !player) return;

  if (!replyAudio) {
    replyAudio = new Audio(replyData.audioUrl);
    replyAudio.play();
    btn.textContent = '⏸';
    btn.classList.add('playing');
    player.classList.add('playing');
    replyAudio.onended = () => {
      btn.textContent = '▶';
      btn.classList.remove('playing');
      player.classList.remove('playing');
    };
  } else {
    if (replyAudio.paused) {
      replyAudio.play();
      btn.textContent = '⏸';
      player.classList.add('playing');
    } else {
      replyAudio.pause();
      btn.textContent = '▶';
      player.classList.remove('playing');
    }
  }
}

/* ========================================
   发送求助
   ======================================== */
function sendHelp(type) {
  const appState = getAppState();
  if (appState !== STATE.IDLE && appState !== STATE.RESOLVED) return;
  const btn = document.getElementById('helpBtn');
  if (!btn) return;

  if (type === 'share') {
    btn.innerHTML = '<div class="eb-icon">📺</div><div class="eb-title">正在开启共享...</div><div class="eb-sub">请稍候</div>';
    setTimeout(() => {
      toggleScreenShare();
      setAppState(STATE.HELP_SENT);
      setHasNewForChild(true);
      addHistoryItem({icon: '💊', title: '医保电子凭证问题', time: '刚刚', resolved: false});
      renderElderView();
      renderBanner();
      showToast('📺 屏幕共享已开启，女儿正在查看', 'success');
    }, 1500);
  } else {
    btn.innerHTML = '<div class="eb-icon">⏳</div><div class="eb-title">正在发送截图...</div><div class="eb-sub">请稍候</div>';
    setTimeout(() => {
      setAppState(STATE.HELP_SENT);
      setHasNewForChild(true);
      addHistoryItem({icon: '💊', title: '医保电子凭证问题', time: '刚刚', resolved: false});
      renderElderView();
      renderBanner();
      showToast('📸 截图已发送给女儿', 'success');
    }, 1200);
  }
}

/* ========================================
   求助方式选择菜单
   ======================================== */
function showHelpMenu() {
  const modal = document.getElementById('helpMenuModal');
  if (modal) modal.classList.add('show');
}

function hideHelpMenu() {
  const modal = document.getElementById('helpMenuModal');
  if (modal) modal.classList.remove('show');
}

/* ========================================
   标记已解决
   ======================================== */
function resolveHelp() {
  setAppState(STATE.RESOLVED);
  clearReplyData();
  if (replyAudio) { replyAudio.pause(); replyAudio = null; }
  renderElderView();
  renderBanner();
  showToast('🎉 问题已解决！', 'success');
}

/* ========================================
   通话弹层
   ======================================== */
function startCall() {
  const overlay = document.getElementById('callOverlay');
  const statusEl = document.getElementById('callStatus');
  if (!overlay) return;
  overlay.classList.add('show');
  if (statusEl) {
    statusEl.textContent = '正在呼叫...';
    statusEl.style.color = 'var(--muted)';
  }
  setTimeout(() => {
    if (overlay.classList.contains('show') && statusEl) {
      statusEl.textContent = '通话中...';
      statusEl.style.color = 'var(--green)';
    }
  }, 2000);
}

function hangupCall() {
  const overlay = document.getElementById('callOverlay');
  if (overlay) overlay.classList.remove('show');
  showToast('📞 通话已结束', 'warn');
}

/* ========================================
   长辈端初始化
   ======================================== */
function initElderPage() {
  initClock();
  renderElderView();
  renderBanner();

  const navRoleText = document.getElementById('navRoleText');
  if (navRoleText) navRoleText.textContent = '长辈';
  const navTitle = document.getElementById('navTitle');
  if (navTitle) navTitle.textContent = '长辈端 · 求助中心';
}
