/**
 * 模块5：语音故事录制
 */

(function() {
  'use strict';

  // DOM 元素
  const els = {
    recorderIcon: document.getElementById('recorderIcon'),
    recorderStatus: document.getElementById('recorderStatus'),
    recorderTimer: document.getElementById('recorderTimer'),
    recordBtn: document.getElementById('recordBtn'),
    stopBtn: document.getElementById('stopBtn'),
    storiesList: document.getElementById('storiesList'),
    saveModal: document.getElementById('saveModal'),
    saveForm: document.getElementById('saveForm'),
    storyTitle: document.getElementById('storyTitle'),
    storyCategory: document.getElementById('storyCategory'),
    storyTranscript: document.getElementById('storyTranscript'),
    modalClose: document.getElementById('modalClose'),
    cancelBtn: document.getElementById('cancelBtn')
  };

  let mediaRecorder = null;
  let audioChunks = [];
  let audioBlob = null;
  let audioUrl = null;
  let recordingStartTime = null;
  let timerInterval = null;
  let stories = [];
  let currentAudio = null;
  let recognition = null;
  let transcriptText = '';

  /**
   * 初始化
   */
  function init() {
    loadStories();
    bindEvents();
    initSpeechRecognition();
  }

  /**
   * 加载故事列表
   */
  function loadStories() {
    stories = Storage.get(StorageKeys.VOICE_STORIES, []);
    renderStories();
  }

  /**
   * 渲染故事列表
   */
  function renderStories() {
    if (!els.storiesList) return;

    if (stories.length === 0) {
      els.storiesList.innerHTML = `
        <div class="empty-state-small">
          <p>还没有录制的故事</p>
        </div>
      `;
      return;
    }

    els.storiesList.innerHTML = stories.map((story, index) => `
      <div class="story-card" data-index="${index}">
        <button class="story-play-btn" data-index="${index}">
          ${story.isPlaying ? '&#9632;' : '&#9654;'}
        </button>
        <div class="story-info">
          <div class="story-title">${escapeHtml(story.title)}</div>
          <div class="story-meta">
            <span>${getCategoryName(story.category)}</span>
            <span>${formatDuration(story.duration)}</span>
            <span>${formatDate(story.createdAt)}</span>
          </div>
          ${story.isPlaying ? `
            <div class="story-progress">
              <div class="story-progress-bar" style="width:${story.progress || 0}%"></div>
            </div>
          ` : ''}
        </div>
        <button class="story-delete" data-index="${index}">&#10005;</button>
      </div>
    `).join('');
  }

  /**
   * 初始化语音识别
   */
  function initSpeechRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn('[VoiceStory] 浏览器不支持语音识别');
      return;
    }

    recognition = new SpeechRecognition();
    recognition.lang = 'zh-CN';
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event) => {
      let final = '';
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          final += event.results[i][0].transcript;
        } else {
          interim += event.results[i][0].transcript;
        }
      }
      transcriptText += final;
      if (els.storyTranscript) {
        els.storyTranscript.value = transcriptText + interim;
      }
    };

    recognition.onerror = (event) => {
      console.error('[VoiceStory] 语音识别错误:', event.error);
    };
  }

  /**
   * 显示友好提示
   */
  function showFriendlyTip(message, type = 'info') {
    // 移除已有提示
    const existing = document.querySelector('.voice-tip');
    if (existing) existing.remove();

    const tip = document.createElement('div');
    tip.className = `voice-tip voice-tip--${type}`;
    tip.innerHTML = `
      <span class="voice-tip__icon">${type === 'error' ? '&#9888;' : '&#128161;'}</span>
      <span class="voice-tip__text">${message}</span>
      <button class="voice-tip__close" onclick="this.parentElement.remove()">&#10005;</button>
    `;

    const recorderSection = document.querySelector('.recorder-section');
    if (recorderSection) {
      recorderSection.insertBefore(tip, recorderSection.firstChild);
    } else {
      document.body.appendChild(tip);
    }

    // 3秒后自动消失
    setTimeout(() => {
      if (tip.parentElement) tip.remove();
    }, 6000);
  }

  /**
   * 开始录音
   */
  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder = new MediaRecorder(stream);
      audioChunks = [];
      transcriptText = '';

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        audioUrl = URL.createObjectURL(audioBlob);
        openSaveModal();
      };

      mediaRecorder.start();
      recordingStartTime = Date.now();

      // 开始语音识别
      if (recognition) {
        try {
          recognition.start();
        } catch (e) {
          console.warn('[VoiceStory] 语音识别启动失败:', e);
        }
      }

      // 更新UI
      els.recorderIcon.classList.add('recording');
      els.recorderStatus.textContent = '正在录音...';
      els.recordBtn.classList.add('hidden');
      els.stopBtn.classList.remove('hidden');

      // 启动计时器
      timerInterval = setInterval(updateTimer, 1000);

      // 清除之前的错误提示
      const existingTip = document.querySelector('.voice-tip--error');
      if (existingTip) existingTip.remove();

    } catch (error) {
      console.error('[VoiceStory] 无法访问麦克风:', error);

      let errorMessage = '无法访问麦克风';
      let helpText = '';

      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        errorMessage = '麦克风权限被拒绝';
        helpText = '请在浏览器地址栏点击锁形图标，允许麦克风访问后重试。';
      } else if (error.name === 'NotFoundError') {
        errorMessage = '未找到麦克风设备';
        helpText = '请检查您的设备是否连接了麦克风。';
      } else if (error.name === 'NotReadableError') {
        errorMessage = '麦克风被其他应用占用';
        helpText = '请关闭其他可能使用麦克风的应用后重试。';
      } else {
        helpText = '请检查浏览器权限设置，确保允许访问麦克风。';
      }

      showFriendlyTip(`<strong>${errorMessage}</strong><br><small>${helpText}</small>`, 'error');

      // 恢复UI状态
      els.recorderIcon.classList.remove('recording');
      els.recorderStatus.textContent = '点击开始录音';
      els.recordBtn.classList.remove('hidden');
      els.stopBtn.classList.add('hidden');
    }
  }

  /**
   * 停止录音
   */
  function stopRecording() {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
      mediaRecorder.stream.getTracks().forEach(track => track.stop());
    }

    // 停止语音识别
    if (recognition) {
      try {
        recognition.stop();
      } catch (e) {}
    }

    // 停止计时器
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }

    // 更新UI
    els.recorderIcon.classList.remove('recording');
    els.recorderStatus.textContent = '点击开始录音';
    els.recordBtn.classList.remove('hidden');
    els.stopBtn.classList.add('hidden');
  }

  /**
   * 更新计时器
   */
  function updateTimer() {
    const elapsed = Math.floor((Date.now() - recordingStartTime) / 1000);
    const minutes = Math.floor(elapsed / 60).toString().padStart(2, '0');
    const seconds = (elapsed % 60).toString().padStart(2, '0');
    if (els.recorderTimer) {
      els.recorderTimer.textContent = `${minutes}:${seconds}`;
    }
  }

  /**
   * 打开保存弹窗
   */
  function openSaveModal() {
    if (els.saveModal) {
      els.saveModal.classList.remove('hidden');
      document.body.style.overflow = 'hidden';
    }
  }

  /**
   * 关闭保存弹窗
   */
  function closeSaveModal() {
    if (els.saveModal) {
      els.saveModal.classList.add('hidden');
      document.body.style.overflow = '';
    }
    // 重置计时器显示
    if (els.recorderTimer) els.recorderTimer.textContent = '00:00';
  }

  /**
   * 保存故事
   */
  function saveStory(e) {
    e.preventDefault();

    if (!audioBlob) return;

    // 将音频转为 base64
    const reader = new FileReader();
    reader.onload = (event) => {
      const duration = Math.floor((Date.now() - recordingStartTime) / 1000);

      const story = {
        id: 'story_' + Date.now(),
        title: els.storyTitle.value.trim() || '未命名故事',
        category: els.storyCategory.value,
        transcript: els.storyTranscript.value.trim(),
        audioData: event.target.result,
        duration: duration,
        createdAt: new Date().toISOString()
      };

      stories.unshift(story);
      Storage.set(StorageKeys.VOICE_STORIES, stories);

      EventBus.emit(EVENTS.VOICE_RECORDED, story);

      renderStories();
      closeSaveModal();
      resetForm();
    };
    reader.readAsDataURL(audioBlob);
  }

  /**
   * 播放故事
   */
  function playStory(index) {
    const story = stories[index];
    if (!story || !story.audioData) return;

    // 停止当前播放
    if (currentAudio) {
      currentAudio.pause();
      currentAudio = null;
    }

    // 重置所有播放状态
    stories.forEach(s => {
      s.isPlaying = false;
      s.progress = 0;
    });

    // 创建音频对象
    currentAudio = new Audio(story.audioData);

    currentAudio.onplay = () => {
      story.isPlaying = true;
      renderStories();
      EventBus.emit(EVENTS.VOICE_PLAYED, story);
    };

    currentAudio.onended = () => {
      story.isPlaying = false;
      story.progress = 0;
      currentAudio = null;
      renderStories();
    };

    currentAudio.ontimeupdate = () => {
      if (currentAudio.duration) {
        story.progress = (currentAudio.currentTime / currentAudio.duration) * 100;
        // 节流渲染
        if (Math.floor(currentAudio.currentTime) % 1 === 0) {
          renderStories();
        }
      }
    };

    currentAudio.play();
  }

  /**
   * 删除故事
   */
  function deleteStory(index) {
    if (confirm('确定要删除这个故事吗？')) {
      stories.splice(index, 1);
      Storage.set(StorageKeys.VOICE_STORIES, stories);
      renderStories();
    }
  }

  /**
   * 重置表单
   */
  function resetForm() {
    if (els.saveForm) els.saveForm.reset();
    audioBlob = null;
    audioUrl = null;
    transcriptText = '';
    recordingStartTime = null;
  }

  /**
   * 获取分类名称
   */
  function getCategoryName(category) {
    const names = {
      childhood: '童年',
      youth: '青年',
      work: '工作',
      family: '家庭',
      other: '其他'
    };
    return names[category] || '其他';
  }

  /**
   * 格式化时长
   */
  function formatDuration(seconds) {
    if (!seconds) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  /**
   * 格式化日期
   */
  function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return `${date.getMonth() + 1}月${date.getDate()}日`;
  }

  /**
   * HTML 转义
   */
  function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * 绑定事件
   */
  function bindEvents() {
    if (els.recordBtn) els.recordBtn.addEventListener('click', startRecording);
    if (els.stopBtn) els.stopBtn.addEventListener('click', stopRecording);

    if (els.saveForm) els.saveForm.addEventListener('submit', saveStory);
    if (els.modalClose) els.modalClose.addEventListener('click', closeSaveModal);
    if (els.cancelBtn) els.cancelBtn.addEventListener('click', closeSaveModal);

    // 故事列表操作
    if (els.storiesList) {
      els.storiesList.addEventListener('click', (e) => {
        const playBtn = e.target.closest('.story-play-btn');
        const deleteBtn = e.target.closest('.story-delete');

        if (playBtn) {
          const index = parseInt(playBtn.dataset.index);
          const story = stories[index];
          if (story.isPlaying) {
            if (currentAudio) currentAudio.pause();
            story.isPlaying = false;
            renderStories();
          } else {
            playStory(index);
          }
        }

        if (deleteBtn) {
          deleteStory(parseInt(deleteBtn.dataset.index));
        }
      });
    }

    // 点击遮罩关闭
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
      overlay.addEventListener('click', closeSaveModal);
    });
  }

  // 启动
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
