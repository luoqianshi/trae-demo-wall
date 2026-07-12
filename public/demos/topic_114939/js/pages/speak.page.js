window.SpeakPage = function(container) {
  const game = window.GameSystem;
  const cards = window.DemoData ? window.DemoData.cards || [] : [];
  const API_URL = 'https://voice.yixian.fun/api/voice-eval';

  let currentCard = null;
  let isRecording = false;
  let mediaRecorder = null;
  let audioChunks = [];
  let audioContext = null;
  let analyser = null;
  let dataArray = null;
  let animationId = null;
  let recordStartTime = 0;
  let recordDuration = 0;
  let maxRecordDuration = 10;
  let recordTimer = null;
  let scoreResult = null;
  let destroyed = false;
  let pendingTimers = [];

  function safeSetTimeout(fn, delay) {
    const timer = setTimeout(function() {
      pendingTimers = pendingTimers.filter(t => t !== timer);
      if (!destroyed && window.currentPage === 'speak') {
        fn();
      }
    }, delay);
    pendingTimers.push(timer);
    return timer;
  }

  function cleanup() {
    destroyed = true;
    pendingTimers.forEach(t => clearTimeout(t));
    pendingTimers = [];
    if (recordTimer) {
      clearTimeout(recordTimer);
      recordTimer = null;
    }
    stopWaveAnimation();
    if (mediaRecorder) {
      if (mediaRecorder.state === 'recording') {
        mediaRecorder.stop();
      }
      if (mediaRecorder.stream && mediaRecorder.stream.getTracks) {
        mediaRecorder.stream.getTracks().forEach(track => track.stop());
      }
      mediaRecorder = null;
    }
    if (audioContext && audioContext.state !== 'closed') {
      audioContext.close().catch(() => {});
      audioContext = null;
    }
    window.removeEventListener('pageChanged', onPageChange);
    audioChunks = [];
  }

  function onPageChange(e) {
    if (e.detail.page !== 'speak') {
      cleanup();
    }
  }
  window.addEventListener('pageChanged', onPageChange);

  function isMediaRecorderSupported() {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && window.MediaRecorder);
  }

  function getRandomCard() {
    if (cards.length === 0) return null;
    const randomIndex = Math.floor(Math.random() * cards.length);
    return cards[randomIndex];
  }

  function calcMock(duration) {
    let min, max;
    if (duration < 1) {
      min = 40;
      max = 60;
    } else if (duration <= 3) {
      min = 60;
      max = 80;
    } else {
      min = 70;
      max = 90;
    }
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function getStars(score) {
    if (score >= 90) return 3;
    if (score >= 80) return 2;
    if (score >= 60) return 1;
    return 0;
  }

  function getStarHtml(stars) {
    let html = '';
    for (let i = 0; i < 3; i++) {
      html += `<span class="speak-star ${i < stars ? 'filled' : ''}">★</span>`;
    }
    return html;
  }

  function playStandardAudio() {
    if (!currentCard) return;
    let audioUrl;
    if (window.cosData && typeof window.cosData.getAudioUrl === 'function') {
      audioUrl = window.cosData.getAudioUrl(currentCard.char);
    } else {
      audioUrl = 'https://dict.youdao.com/dictvoice?audio=' + encodeURIComponent(currentCard.char) + '&type=1';
    }
    const audio = new Audio(audioUrl);
    audio.play().catch(err => {
      console.warn('播放标准发音失败:', err);
    });
  }

  async function startRecording() {
    if (!isMediaRecorderSupported()) {
      renderNotSupported();
      return;
    }

    let stream = null;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
      analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);
      dataArray = new Uint8Array(analyser.frequencyBinCount);

      mediaRecorder = new MediaRecorder(stream);
      audioChunks = [];

      mediaRecorder.ondataavailable = function(e) {
        if (e.data.size > 0) {
          audioChunks.push(e.data);
        }
      };

      mediaRecorder.onstop = function() {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        recordDuration = (Date.now() - recordStartTime) / 1000;
        processRecording(audioBlob);
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
        }
      };

      isRecording = true;
      recordStartTime = Date.now();
      scoreResult = null;
      mediaRecorder.start();
      startWaveAnimation();
      render();

      recordTimer = setTimeout(function() {
        if (isRecording) {
          stopRecording();
          alert('录音时间已达上限（' + maxRecordDuration + '秒），已自动停止');
        }
      }, maxRecordDuration * 1000);
    } catch (err) {
      console.error('录音启动失败:', err);
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (audioContext && audioContext.state !== 'closed') {
        audioContext.close().catch(() => {});
        audioContext = null;
      }
      alert('无法访问麦克风，请检查浏览器权限设置');
    }
  }

  function stopRecording() {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.stop();
      isRecording = false;
      stopWaveAnimation();
    }
    if (recordTimer) {
      clearTimeout(recordTimer);
      recordTimer = null;
    }
  }

  function startWaveAnimation() {
    function animate() {
      if (!analyser || !dataArray) return;
      analyser.getByteFrequencyData(dataArray);
      updateWaveDisplay(dataArray);
      animationId = requestAnimationFrame(animate);
    }
    animate();
  }

  function stopWaveAnimation() {
    if (animationId) {
      cancelAnimationFrame(animationId);
      animationId = null;
    }
  }

  function updateWaveDisplay(waveData) {
    const waveContainer = document.getElementById('speak-wave-container');
    if (!waveContainer) return;

    const bars = waveContainer.querySelectorAll('.speak-wave-bar');
    const barCount = Math.min(waveData.length, bars.length);
    
    for (let i = 0; i < barCount; i++) {
      const height = (waveData[i] / 255) * 100;
      if (bars[i]) {
        bars[i].style.height = Math.max(5, height) + '%';
        bars[i].style.opacity = 0.5 + (waveData[i] / 510);
      }
    }
  }

  function renderWavePlaceholder() {
    let barsHtml = '';
    for (let i = 0; i < 32; i++) {
      barsHtml += '<div class="speak-wave-bar" style="height: ' + (Math.random() * 30 + 10) + '%;"></div>';
    }
    return barsHtml;
  }

  async function processRecording(audioBlob) {
    renderProcessing();

    const reader = new FileReader();
    reader.readAsDataURL(audioBlob);
    reader.onloadend = async function() {
      const base64Data = reader.result.split(',')[1];
      
      try {
        let token = '';
        if (window.VoiceToken && typeof window.VoiceToken.get === 'function') {
          token = await window.VoiceToken.get();
        }
        const headers = { 'Content-Type': 'application/json' };
        if (token) {
          headers['X-Token'] = token;
        }
        const response = await fetch(API_URL, {
          method: 'POST',
          headers: headers,
          body: JSON.stringify({
            audio: base64Data,
            ref_text: currentCard.char
          })
        });

        if (!response.ok) {
          throw new Error('API请求失败');
        }

        const data = await response.json();
        scoreResult = {
          score: data.score || data.total_score || calcMock(recordDuration),
          recognizedText: data.recognized_text || data.text || currentCard.char,
          accuracy: data.accuracy || '发音准确度：' + (data.score || 75) + '%',
          isMock: false
        };
      } catch (err) {
        console.warn('语音评测API失败，使用模拟评分:', err);
        const mockScore = calcMock(recordDuration);
        scoreResult = {
          score: mockScore,
          recognizedText: currentCard.char,
          accuracy: '发音准确度：' + mockScore + '%',
          isMock: true
        };
      }

      if (scoreResult.score >= 60) {
        game.onSpeakPractice(scoreResult.score);
      }

      render();
    };
  }

  function nextCard() {
    currentCard = getRandomCard();
    scoreResult = null;
    isRecording = false;
    render();
  }

  function goBack() {
    navigateTo('home');
  }

  function renderNotSupported() {
    container.innerHTML = `
      <div class="speak-page">
        <div class="speak-status-bar">
          <button class="speak-back-btn" onclick="speakGoBack()">←</button>
          <div class="speak-title">发音练习</div>
          <div class="speak-placeholder"></div>
        </div>
        <div class="speak-not-supported">
          <div class="speak-not-supported-icon">🎤</div>
          <div class="speak-not-supported-title">当前浏览器不支持录音</div>
          <div class="speak-not-supported-desc">请使用 Chrome / Edge / Safari 浏览器体验发音练习功能</div>
        </div>
      </div>
    `;
  }

  function renderProcessing() {
    const waveContainer = document.getElementById('speak-wave-container');
    const resultArea = document.getElementById('speak-result-area');
    const micBtn = document.getElementById('speak-mic-btn');
    
    if (waveContainer) {
      waveContainer.innerHTML = '<div class="speak-processing-text">分析中...</div>';
    }
    if (micBtn) {
      micBtn.style.pointerEvents = 'none';
      micBtn.style.opacity = '0.6';
    }
  }

  function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    const div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
  }

  function render() {
    if (!currentCard) {
      currentCard = getRandomCard();
    }

    if (!currentCard) {
      container.innerHTML = '<div style="text-align:center;padding:80px 20px;color:#999;">加载中...</div>';
      return;
    }

    const stars = scoreResult ? getStars(scoreResult.score) : 0;
    const esc = escapeHtml;

    container.innerHTML = `
      <div class="speak-page">
        <div class="speak-status-bar">
          <button class="speak-back-btn" onclick="speakGoBack()">←</button>
          <div class="speak-title">发音练习</div>
          <div class="speak-placeholder"></div>
        </div>

        <div class="speak-content">
          <div class="speak-char-card">
            <div class="speak-char">${esc(currentCard.char)}</div>
            <div class="speak-pinyin">${esc(currentCard.pinyin)}</div>
            <button class="speak-play-btn" onclick="speakPlayAudio()">
              <span class="speak-play-icon">🔊</span>
              <span>播放标准发音</span>
            </button>
          </div>

          <div class="speak-wave-section">
            <div class="speak-wave-label">
              ${isRecording ? '🎙️ 正在录音...' : scoreResult ? '✓ 录音完成' : '点击下方麦克风开始录音'}
            </div>
            <div class="speak-wave-container" id="speak-wave-container">
              ${isRecording ? renderWavePlaceholder() : '<div class="speak-wave-placeholder">🎵</div>'}
            </div>
          </div>

          <div class="speak-mic-section">
            <button class="speak-mic-btn ${isRecording ? 'recording' : ''}" id="speak-mic-btn" onclick="${isRecording ? 'speakStopRecording()' : 'speakStartRecording()'}">
              <span class="speak-mic-icon">${isRecording ? '⏹' : '🎤'}</span>
            </button>
            <div class="speak-mic-hint">
              ${isRecording ? '再次点击停止录音' : '点击麦克风开始朗读'}
            </div>
          </div>

          <div class="speak-result-area" id="speak-result-area">
            ${scoreResult ? `
              <div class="speak-result-card">
                <div class="speak-score-section">
                  <div class="speak-score-value" style="color: ${scoreResult.score >= 80 ? '#58CC02' : scoreResult.score >= 60 ? '#F59E0B' : '#EF4444'};">
                    ${scoreResult.score}分
                  </div>
                  <div class="speak-stars">
                    ${getStarHtml(stars)}
                  </div>
                </div>
                <div class="speak-result-divider"></div>
                <div class="speak-recognized">
                  <div class="speak-recognized-label">系统听到的文字</div>
                  <div class="speak-recognized-text">${esc(scoreResult.recognizedText)}</div>
                </div>
                <div class="speak-accuracy">
                  ${esc(scoreResult.accuracy)}
                </div>
                ${scoreResult.isMock ? '<div class="speak-mock-hint">（演示模式：模拟评分）</div>' : ''}
                <button class="speak-next-btn" onclick="speakNextCard()">
                  下一题 →
                </button>
              </div>
            ` : ''}
          </div>
        </div>
      </div>
    `;
  }

  window.speakGoBack = goBack;
  window.speakPlayAudio = playStandardAudio;
  window.speakStartRecording = startRecording;
  window.speakStopRecording = stopRecording;
  window.speakNextCard = nextCard;

  if (!isMediaRecorderSupported()) {
    renderNotSupported();
  } else {
    render();
  }
};
