/**
 * 模块4：照片回忆训练（含语音故事功能）
 */

(function() {
  'use strict';

  // DOM 元素
  const els = {
    photoDisplay: document.getElementById('photoDisplay'),
    photoInfo: document.getElementById('photoInfo'),
    photoTitle: document.getElementById('photoTitle'),
    photoDesc: document.getElementById('photoDesc'),
    photoSpeak: document.getElementById('photoSpeak'),
    photoLike: document.getElementById('photoLike'),
    likeIcon: document.getElementById('likeIcon'),
    carouselControls: document.getElementById('carouselControls'),
    carouselDots: document.getElementById('carouselDots'),
    prevBtn: document.getElementById('prevBtn'),
    nextBtn: document.getElementById('nextBtn'),
    photoGrid: document.getElementById('photoGrid'),
    uploadBtn: document.getElementById('uploadBtn'),
    uploadModal: document.getElementById('uploadModal'),
    uploadForm: document.getElementById('uploadForm'),
    photoFile: document.getElementById('photoFile'),
    photoTitleInput: document.getElementById('photoTitleInput'),
    photoDescInput: document.getElementById('photoDescInput'),
    photoYear: document.getElementById('photoYear'),
    uploadPreview: document.getElementById('uploadPreview'),
    modalClose: document.getElementById('modalClose'),
    cancelBtn: document.getElementById('cancelBtn'),

    // 语音故事相关
    voiceStorySection: document.getElementById('voiceStorySection'),
    voiceStoryEmpty: document.getElementById('voiceStoryEmpty'),
    voiceStoryPlayer: document.getElementById('voiceStoryPlayer'),
    recordStoryBtn: document.getElementById('recordStoryBtn'),
    voicePlayBtn: document.getElementById('voicePlayBtn'),
    voiceStoryDuration: document.getElementById('voiceStoryDuration'),
    voiceStoryDate: document.getElementById('voiceStoryDate'),
    voiceReRecordBtn: document.getElementById('voiceReRecordBtn'),
    voiceDeleteBtn: document.getElementById('voiceDeleteBtn'),
    voiceProgressFill: document.getElementById('voiceProgressFill'),

    // 录音弹窗
    voiceRecordModal: document.getElementById('voiceRecordModal'),
    voiceModalClose: document.getElementById('voiceModalClose'),
    voiceRecorderCircle: document.getElementById('voiceRecorderCircle'),
    voiceRecorderStatus: document.getElementById('voiceRecorderStatus'),
    voiceRecorderTimer: document.getElementById('voiceRecorderTimer'),
    voiceStartBtn: document.getElementById('voiceStartBtn'),
    voiceStopBtn: document.getElementById('voiceStopBtn')
  };

  let photos = [];
  let currentIndex = 0;
  let uploadPhotoBase64 = '';

  // 语音故事录制状态
  let voiceMediaRecorder = null;
  let voiceAudioChunks = [];
  let voiceRecordingStartTime = null;
  let voiceTimerInterval = null;
  let voiceAudio = null; // 当前播放的音频对象

  /**
   * 初始化
   */
  function init() {
    loadPhotos();
    bindEvents();
  }

  /**
   * 加载照片
   */
  function loadPhotos() {
    photos = Storage.get(StorageKeys.PHOTOS, []);
    if (photos.length > 0) {
      renderPhoto(0);
      renderDots();
      renderThumbs();
      els.photoInfo.classList.remove('hidden');
      els.carouselControls.classList.remove('hidden');
      els.photoGrid.classList.remove('hidden');
    }
  }

  /**
   * 渲染照片
   */
  function renderPhoto(index) {
    if (photos.length === 0) return;

    currentIndex = index;
    const photo = photos[index];

    // 停止正在播放的语音
    stopVoicePlayback();

    // 显示照片
    els.photoDisplay.innerHTML = `<img src="${photo.src}" alt="${escapeHtml(photo.title || '照片')}">`;

    // 更新信息
    if (els.photoTitle) els.photoTitle.textContent = photo.title || '未命名照片';
    if (els.photoDesc) els.photoDesc.textContent = photo.desc || '';

    // 更新喜欢状态
    updateLikeButton(photo.liked);

    // 更新圆点
    updateDots();

    // 更新缩略图高亮
    updateThumbHighlight();

    // 更新语音故事区域
    updateVoiceStoryUI(photo);

    // 发布事件
    EventBus.emit(EVENTS.PHOTO_VIEWED, photo);
  }

  /**
   * 更新语音故事 UI
   */
  function updateVoiceStoryUI(photo) {
    if (!els.voiceStorySection) return;

    if (photo.voiceStory) {
      // 有语音故事，显示播放器
      els.voiceStoryEmpty.classList.add('hidden');
      els.voiceStoryPlayer.classList.remove('hidden');

      // 更新播放信息
      els.voiceStoryDuration.textContent = formatDuration(photo.voiceStory.duration);
      els.voiceStoryDate.textContent = formatDate(photo.voiceStory.recordedAt);

      // 重置播放按钮状态
      els.voicePlayBtn.innerHTML = '&#9654;';
      els.voicePlayBtn.classList.remove('playing');

      // 重置进度条
      els.voiceProgressFill.style.width = '0%';
    } else {
      // 无语音故事，显示录制提示
      els.voiceStoryEmpty.classList.remove('hidden');
      els.voiceStoryPlayer.classList.add('hidden');
    }
  }

  /**
   * 播放/暂停语音故事
   */
  function toggleVoicePlayback() {
    const photo = photos[currentIndex];
    if (!photo || !photo.voiceStory) return;

    if (voiceAudio && !voiceAudio.paused) {
      // 正在播放，暂停
      voiceAudio.pause();
      els.voicePlayBtn.innerHTML = '&#9654;';
      els.voicePlayBtn.classList.remove('playing');
    } else {
      // 开始播放
      if (voiceAudio) {
        voiceAudio = null;
      }

      voiceAudio = new Audio(photo.voiceStory.audioData);

      voiceAudio.onplay = function() {
        els.voicePlayBtn.innerHTML = '&#9632;';
        els.voicePlayBtn.classList.add('playing');
        EventBus.emit(EVENTS.VOICE_PLAYED, { photoId: photo.id, source: 'photo' });
      };

      voiceAudio.onended = function() {
        els.voicePlayBtn.innerHTML = '&#9654;';
        els.voicePlayBtn.classList.remove('playing');
        els.voiceProgressFill.style.width = '0%';
        voiceAudio = null;
      };

      voiceAudio.ontimeupdate = function() {
        if (voiceAudio.duration) {
          const percent = (voiceAudio.currentTime / voiceAudio.duration) * 100;
          els.voiceProgressFill.style.width = percent + '%';
        }
      };

      voiceAudio.play().catch(function(err) {
        console.error('[PhotoMemory] 语音播放失败:', err);
      });
    }
  }

  /**
   * 停止语音播放
   */
  function stopVoicePlayback() {
    if (voiceAudio) {
      voiceAudio.pause();
      voiceAudio = null;
    }
    if (els.voicePlayBtn) {
      els.voicePlayBtn.innerHTML = '&#9654;';
      els.voicePlayBtn.classList.remove('playing');
    }
    if (els.voiceProgressFill) {
      els.voiceProgressFill.style.width = '0%';
    }
  }

  /**
   * 打开录音弹窗
   */
  function openVoiceRecordModal() {
    if (els.voiceRecordModal) {
      els.voiceRecordModal.classList.remove('hidden');
      document.body.style.overflow = 'hidden';
      // 重置录音状态
      resetVoiceRecordUI();
    }
  }

  /**
   * 关闭录音弹窗
   */
  function closeVoiceRecordModal() {
    // 如果正在录音，先停止
    if (voiceMediaRecorder && voiceMediaRecorder.state !== 'inactive') {
      stopVoiceRecording(true);
    }
    if (els.voiceRecordModal) {
      els.voiceRecordModal.classList.add('hidden');
      document.body.style.overflow = '';
    }
  }

  /**
   * 重置录音 UI
   */
  function resetVoiceRecordUI() {
    if (els.voiceRecorderCircle) els.voiceRecorderCircle.classList.remove('recording');
    if (els.voiceRecorderStatus) els.voiceRecorderStatus.textContent = '点击开始录制';
    if (els.voiceRecorderTimer) els.voiceRecorderTimer.textContent = '00:00';
    if (els.voiceStartBtn) els.voiceStartBtn.classList.remove('hidden');
    if (els.voiceStopBtn) els.voiceStopBtn.classList.add('hidden');
  }

  /**
   * 开始录制语音故事
   */
  async function startVoiceRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      voiceMediaRecorder = new MediaRecorder(stream);
      voiceAudioChunks = [];
      voiceRecordingStartTime = Date.now();

      voiceMediaRecorder.ondataavailable = function(event) {
        if (event.data.size > 0) {
          voiceAudioChunks.push(event.data);
        }
      };

      voiceMediaRecorder.onstop = function() {
        const audioBlob = new Blob(voiceAudioChunks, { type: 'audio/webm' });
        const duration = Math.floor((Date.now() - voiceRecordingStartTime) / 1000);

        // 如果时长太短（小于1秒），忽略
        if (duration < 1) {
          console.warn('[PhotoMemory] 录音时长过短，已忽略');
          resetVoiceRecordUI();
          return;
        }

        // 将音频转为 base64 保存到当前照片
        const reader = new FileReader();
        reader.onload = function(event) {
          const photo = photos[currentIndex];
          if (photo) {
            photo.voiceStory = {
              audioData: event.target.result,
              duration: duration,
              recordedAt: new Date().toISOString()
            };

            // 保存到 localStorage
            Storage.set(StorageKeys.PHOTOS, photos);

            // 发布事件
            EventBus.emit(EVENTS.VOICE_RECORDED, {
              photoId: photo.id,
              duration: duration,
              source: 'photo_story'
            });

            // 更新 UI
            updateVoiceStoryUI(photo);

            // 关闭弹窗
            closeVoiceRecordModal();
          }
        };
        reader.readAsDataURL(audioBlob);
      };

      voiceMediaRecorder.start();

      // 更新 UI
      els.voiceRecorderCircle.classList.add('recording');
      els.voiceRecorderStatus.textContent = '正在录制...';
      els.voiceStartBtn.classList.add('hidden');
      els.voiceStopBtn.classList.remove('hidden');

      // 启动计时器
      voiceTimerInterval = setInterval(function() {
        const elapsed = Math.floor((Date.now() - voiceRecordingStartTime) / 1000);
        const minutes = Math.floor(elapsed / 60).toString().padStart(2, '0');
        const seconds = (elapsed % 60).toString().padStart(2, '0');
        if (els.voiceRecorderTimer) {
          els.voiceRecorderTimer.textContent = minutes + ':' + seconds;
        }
      }, 1000);

    } catch (error) {
      console.error('[PhotoMemory] 无法访问麦克风:', error);

      let message = '无法访问麦克风';
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        message = '麦克风权限被拒绝，请在浏览器设置中允许访问后重试';
      } else if (error.name === 'NotFoundError') {
        message = '未找到麦克风设备，请连接麦克风后重试';
      }
      alert(message);
      resetVoiceRecordUI();
    }
  }

  /**
   * 停止录制语音故事
   */
  function stopVoiceRecording(silent) {
    if (voiceMediaRecorder && voiceMediaRecorder.state !== 'inactive') {
      voiceMediaRecorder.stop();
      voiceMediaRecorder.stream.getTracks().forEach(function(track) { track.stop(); });
    }

    // 停止计时器
    if (voiceTimerInterval) {
      clearInterval(voiceTimerInterval);
      voiceTimerInterval = null;
    }

    // 更新 UI
    resetVoiceRecordUI();
  }

  /**
   * 删除语音故事
   */
  function deleteVoiceStory() {
    const photo = photos[currentIndex];
    if (!photo || !photo.voiceStory) return;

    if (confirm('确定要删除这张照片的语音故事吗？')) {
      stopVoicePlayback();
      photo.voiceStory = null;
      Storage.set(StorageKeys.PHOTOS, photos);
      updateVoiceStoryUI(photo);
    }
  }

  /**
   * 渲染轮播圆点
   */
  function renderDots() {
    if (!els.carouselDots) return;
    els.carouselDots.innerHTML = photos.map(function(_, i) {
      return '<button class="carousel-dot ' + (i === 0 ? 'active' : '') + '" data-index="' + i + '"></button>';
    }).join('');
  }

  /**
   * 更新圆点状态
   */
  function updateDots() {
    document.querySelectorAll('.carousel-dot').forEach(function(dot, i) {
      dot.classList.toggle('active', i === currentIndex);
    });
  }

  /**
   * 渲染缩略图
   */
  function renderThumbs() {
    if (!els.photoGrid) return;
    els.photoGrid.innerHTML = photos.map(function(photo, i) {
      return '<div class="photo-thumb ' + (i === 0 ? 'active' : '') + '" data-index="' + i + '">' +
        '<img src="' + photo.src + '" alt="' + escapeHtml(photo.title || '') + '">' +
        '</div>';
    }).join('');
  }

  /**
   * 更新缩略图高亮
   */
  function updateThumbHighlight() {
    document.querySelectorAll('.photo-thumb').forEach(function(thumb, i) {
      thumb.classList.toggle('active', i === currentIndex);
    });
  }

  /**
   * 上一张
   */
  function prevPhoto() {
    const newIndex = currentIndex > 0 ? currentIndex - 1 : photos.length - 1;
    renderPhoto(newIndex);
  }

  /**
   * 下一张
   */
  function nextPhoto() {
    const newIndex = currentIndex < photos.length - 1 ? currentIndex + 1 : 0;
    renderPhoto(newIndex);
  }

  /**
   * 切换喜欢状态
   */
  function toggleLike() {
    const photo = photos[currentIndex];
    if (!photo) return;

    photo.liked = !photo.liked;
    Storage.set(StorageKeys.PHOTOS, photos);
    updateLikeButton(photo.liked);

    EventBus.emit(EVENTS.MOOD_RECORDED, {
      type: 'photo_like',
      photoId: photo.id,
      liked: photo.liked,
      date: new Date().toISOString()
    });
  }

  /**
   * 更新喜欢按钮
   */
  function updateLikeButton(liked) {
    if (els.likeIcon) {
      els.likeIcon.innerHTML = liked ? '&#9829;' : '&#9825;';
    }
    if (els.photoLike) {
      els.photoLike.style.color = liked ? '#E57373' : '';
    }
  }

  /**
   * 语音播报照片描述
   */
  function speakPhoto() {
    const photo = photos[currentIndex];
    if (!photo) return;

    let text = (photo.title || '这张照片') + '。' + (photo.desc || '');

    // 如果有语音故事，提示用户可以播放
    if (photo.voiceStory) {
      text += '。这张照片还有语音故事，可以点击播放收听。';
    }

    speakText(text);
  }

  /**
   * 语音播报
   */
  function speakText(text) {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'zh-CN';
    utterance.rate = 0.85;
    window.speechSynthesis.speak(utterance);
  }

  /**
   * 处理照片上传
   */
  function handlePhotoUpload(file) {
    if (!file || !file.type.startsWith('image/')) {
      alert('请选择图片文件');
      return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
      uploadPhotoBase64 = e.target.result;
      if (els.uploadPreview) {
        els.uploadPreview.innerHTML = '<img src="' + uploadPhotoBase64 + '" alt="预览">';
        els.uploadPreview.classList.remove('hidden');
      }
    };
    reader.readAsDataURL(file);
  }

  /**
   * 保存照片
   */
  function savePhoto(e) {
    e.preventDefault();

    if (!uploadPhotoBase64) {
      alert('请先选择照片');
      return;
    }

    const photo = {
      id: 'photo_' + Date.now(),
      src: uploadPhotoBase64,
      title: els.photoTitleInput.value.trim(),
      desc: els.photoDescInput.value.trim(),
      year: parseInt(els.photoYear.value) || null,
      voiceStory: null,
      liked: false,
      createdAt: new Date().toISOString()
    };

    photos.push(photo);
    Storage.set(StorageKeys.PHOTOS, photos);

    EventBus.emit(EVENTS.PHOTO_UPLOADED, photo);

    // 重新渲染
    renderPhoto(photos.length - 1);
    renderDots();
    renderThumbs();
    els.photoInfo.classList.remove('hidden');
    els.carouselControls.classList.remove('hidden');
    els.photoGrid.classList.remove('hidden');

    closeModal();
    resetForm();
  }

  /**
   * 打开弹窗
   */
  function openModal() {
    if (els.uploadModal) {
      els.uploadModal.classList.remove('hidden');
      document.body.style.overflow = 'hidden';
    }
  }

  /**
   * 关闭弹窗
   */
  function closeModal() {
    if (els.uploadModal) {
      els.uploadModal.classList.add('hidden');
      document.body.style.overflow = '';
    }
  }

  /**
   * 重置表单
   */
  function resetForm() {
    if (els.uploadForm) els.uploadForm.reset();
    uploadPhotoBase64 = '';
    if (els.uploadPreview) {
      els.uploadPreview.innerHTML = '';
      els.uploadPreview.classList.add('hidden');
    }
  }

  /**
   * 格式化时长
   */
  function formatDuration(seconds) {
    if (!seconds) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = (seconds % 60).toString().padStart(2, '0');
    return m + ':' + s;
  }

  /**
   * 格式化日期
   */
  function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return (date.getMonth() + 1) + '月' + date.getDate() + '日';
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
    // 轮播控制
    if (els.prevBtn) els.prevBtn.addEventListener('click', prevPhoto);
    if (els.nextBtn) els.nextBtn.addEventListener('click', nextPhoto);

    // 圆点点击
    if (els.carouselDots) {
      els.carouselDots.addEventListener('click', function(e) {
        if (e.target.classList.contains('carousel-dot')) {
          renderPhoto(parseInt(e.target.dataset.index));
        }
      });
    }

    // 缩略图点击
    if (els.photoGrid) {
      els.photoGrid.addEventListener('click', function(e) {
        const thumb = e.target.closest('.photo-thumb');
        if (thumb) {
          renderPhoto(parseInt(thumb.dataset.index));
        }
      });
    }

    // 喜欢按钮
    if (els.photoLike) els.photoLike.addEventListener('click', toggleLike);

    // 语音播报
    if (els.photoSpeak) els.photoSpeak.addEventListener('click', speakPhoto);

    // 上传
    if (els.uploadBtn) els.uploadBtn.addEventListener('click', openModal);
    if (els.modalClose) els.modalClose.addEventListener('click', closeModal);
    if (els.cancelBtn) els.cancelBtn.addEventListener('click', closeModal);

    // 文件选择
    if (els.photoFile) {
      els.photoFile.addEventListener('change', function(e) {
        if (e.target.files[0]) handlePhotoUpload(e.target.files[0]);
      });
    }

    // 表单提交
    if (els.uploadForm) els.uploadForm.addEventListener('submit', savePhoto);

    // 点击遮罩关闭
    document.querySelectorAll('.modal-overlay').forEach(function(overlay) {
      overlay.addEventListener('click', function() {
        closeModal();
        closeVoiceRecordModal();
      });
    });

    // ===== 语音故事事件绑定 =====

    // 录制语音故事按钮
    if (els.recordStoryBtn) {
      els.recordStoryBtn.addEventListener('click', openVoiceRecordModal);
    }

    // 播放语音故事
    if (els.voicePlayBtn) {
      els.voicePlayBtn.addEventListener('click', toggleVoicePlayback);
    }

    // 重新录制
    if (els.voiceReRecordBtn) {
      els.voiceReRecordBtn.addEventListener('click', openVoiceRecordModal);
    }

    // 删除语音故事
    if (els.voiceDeleteBtn) {
      els.voiceDeleteBtn.addEventListener('click', deleteVoiceStory);
    }

    // 录音弹窗关闭
    if (els.voiceModalClose) {
      els.voiceModalClose.addEventListener('click', closeVoiceRecordModal);
    }

    // 开始录音
    if (els.voiceStartBtn) {
      els.voiceStartBtn.addEventListener('click', startVoiceRecording);
    }

    // 停止录音
    if (els.voiceStopBtn) {
      els.voiceStopBtn.addEventListener('click', function() {
        stopVoiceRecording(false);
      });
    }
  }

  // 启动
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
