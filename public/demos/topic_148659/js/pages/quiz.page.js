window.QuizPage = function(container) {
  const game = window.GameSystem;
  const cards = window.DemoData ? window.DemoData.cards || [] : [];
  const state = game.state;
  const QUESTIONS_PER_ROUND = 10;
  const API_URL = 'https://voice.yixian.fun/api/voice-eval';

  let currentQuestionIndex = 0;
  const esc = window.escapeHtml;
  let score = { correct: 0, wrong: 0, xp: 0, coins: 0 };
  let questions = [];
  let wrongQuestions = [];
  let maxCombo = 0;
  let destroyed = false;
  let pendingTimers = [];
  let currentAudio = null;
  let isRecording = false;
  let mediaRecorder = null;
  let audioChunks = [];
  let audioContext = null;
  let analyser = null;
  let dataArray = null;
  let animationId = null;
  let recordStartTime = 0;
  let recordDuration = 0;

  function safeSetTimeout(fn, delay) {
    const timer = setTimeout(function() {
      pendingTimers = pendingTimers.filter(t => t !== timer);
      if (!destroyed && window.currentPage === 'quiz') {
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
    stopCurrentAudio();
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
    if (e.detail.page !== 'quiz') {
      cleanup();
    }
  }
  window.addEventListener('pageChanged', onPageChange);

  function stopCurrentAudio() {
    if (currentAudio) {
      currentAudio.pause();
      currentAudio = null;
    }
  }

  function playAudio(url) {
    stopCurrentAudio();
    currentAudio = new Audio(url);
    currentAudio.play().catch(err => {
      console.warn('音频播放失败:', err);
    });
  }

  function playCharAudio(char) {
    let audioUrl;
    if (window.cosData && typeof window.cosData.getAudioUrl === 'function') {
      audioUrl = window.cosData.getAudioUrl(char);
    } else {
      audioUrl = 'https://dict.youdao.com/dictvoice?audio=' + encodeURIComponent(char) + '&type=1';
    }
    playAudio(audioUrl);
  }

  function getRandomCards(count, excludeId) {
    const available = cards.filter(c => c.id !== excludeId);
    const shuffled = [...available].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  }

  function generateQuestions() {
    const questionTypes = ['pinyin', 'audio', 'speak'];
    const result = [];
    const shuffledCards = [...cards].sort(() => Math.random() - 0.5);
    const selectedCards = shuffledCards.slice(0, QUESTIONS_PER_ROUND);

    for (let i = 0; i < QUESTIONS_PER_ROUND; i++) {
      const typeIndex = i % questionTypes.length;
      const type = questionTypes[typeIndex];
      const card = selectedCards[i];
      const wrongCards = getRandomCards(3, card.id);
      const options = [...wrongCards.map(c => c.char), card.char].sort(() => Math.random() - 0.5);

      result.push({
        type: type,
        card: card,
        correctChar: card.char,
        pinyin: card.pinyin,
        options: options
      });
    }

    return result;
  }

  function getTypeLabel(type) {
    const labels = {
      pinyin: '拼音题',
      audio: '听选题',
      speak: '跟读题'
    };
    return labels[type] || '练习题';
  }

  function renderQuestion(index) {
    if (destroyed || window.currentPage !== 'quiz') return;
    if (index >= questions.length) {
      renderResult();
      return;
    }

    stopCurrentAudio();
    stopWaveAnimation();

    const question = questions[index];
    const progress = ((index) / questions.length) * 100;
    const typeLabel = getTypeLabel(question.type);

    let questionContent = '';
    let optionsContent = '';

    if (question.type === 'pinyin') {
      questionContent = `
        <div class="quiz-q-pinyin">${esc(question.pinyin)}</div>
        <div class="quiz-q-instruction">选择正确的汉字</div>
      `;
      optionsContent = question.options.map(opt => `
        <div class="quiz-option" onclick="quizSelectAnswer('${esc(opt)}', this)">
          <div class="quiz-option-char">${esc(opt)}</div>
        </div>
      `).join('');
    } else if (question.type === 'audio') {
      questionContent = `
        <button class="quiz-q-audio-btn" onclick="quizPlayQuestionAudio()">
          <span class="quiz-q-audio-icon">🔊</span>
          <span class="quiz-q-audio-text">播放发音</span>
        </button>
        <div class="quiz-q-instruction">听发音，选汉字</div>
      `;
      optionsContent = question.options.map(opt => `
        <div class="quiz-option" onclick="quizSelectAnswer('${esc(opt)}', this)">
          <div class="quiz-option-char">${esc(opt)}</div>
        </div>
      `).join('');
    } else if (question.type === 'speak') {
      questionContent = `
        <div class="quiz-q-speak-char">${esc(question.correctChar)}</div>
        <div class="quiz-q-speak-pinyin">${esc(question.pinyin)}</div>
        <button class="quiz-q-play-btn" onclick="quizPlayQuestionAudio()">
          <span>🔊</span>
          <span>听标准发音</span>
        </button>
        <div class="quiz-q-instruction">跟读发音，系统评分</div>
      `;
      optionsContent = `
        <div class="quiz-speak-section">
          <div class="quiz-speak-wave-container" id="quizSpeakWave">
            <div class="quiz-speak-wave-placeholder">🎤 点击下方麦克风开始录音</div>
          </div>
          <div class="quiz-speak-mic-area">
            <button class="quiz-speak-mic-btn" id="quizMicBtn" onclick="quizToggleRecording()">
              <span class="quiz-speak-mic-icon">🎤</span>
            </button>
            <div class="quiz-speak-mic-hint">点击麦克风开始跟读</div>
          </div>
          <div class="quiz-speak-result" id="quizSpeakResult" style="display:none;">
            <div class="quiz-speak-score" id="quizSpeakScore">--</div>
            <div class="quiz-speak-score-text" id="quizSpeakScoreText">评分中...</div>
          </div>
        </div>
      `;
    }

    container.innerHTML = `
      <div class="quiz-page">
        <div class="quiz-header">
          <button class="quiz-back-btn" onclick="navigateTo('exercise')">←</button>
          <div class="quiz-type-badge">${typeLabel}</div>
          <div class="quiz-progress-info">${index + 1}/${questions.length}</div>
        </div>

        <div class="quiz-progress-bar-wrap">
          <div class="quiz-progress-bar" style="width: ${progress}%;"></div>
        </div>

        <div class="quiz-hearts-row">
          ${Array(5).fill(0).map((_, i) => `<span class="quiz-heart ${i < state.hearts ? '' : 'empty'}">❤️</span>`).join('')}
          ${state.consecutiveCorrect > 0 ? `
            <div class="quiz-combo-badge">
              <span class="quiz-combo-icon">🔥</span>
              <span class="quiz-combo-num">${state.consecutiveCorrect}</span>
            </div>
          ` : ''}
        </div>

        <div class="quiz-question-card">
          ${questionContent}
        </div>

        <div class="quiz-options-grid">
          ${optionsContent}
        </div>
      </div>
    `;

    if (question.type === 'audio') {
      safeSetTimeout(() => {
        playCharAudio(question.correctChar);
      }, 500);
    }
  }

  window.quizPlayQuestionAudio = function() {
    const question = questions[currentQuestionIndex];
    if (question) {
      playCharAudio(question.correctChar);
    }
  };

  window.quizSelectAnswer = function(selectedChar, element) {
    const question = questions[currentQuestionIndex];
    if (!question || question.type === 'speak') return;

    const options = document.querySelectorAll('.quiz-option');
    options.forEach(opt => opt.style.pointerEvents = 'none');

    const isCorrect = selectedChar === question.correctChar;
    handleAnswer(isCorrect, element, question);
  };

  function handleAnswer(isCorrect, element, question) {
    const options = document.querySelectorAll('.quiz-option');

    if (isCorrect) {
      if (element) element.classList.add('correct');
      const result = game.onCorrectAnswer();
      score.correct++;
      score.xp += result.xp;
      score.coins += game.config.coinsPerCorrect;
      maxCombo = Math.max(maxCombo, state.consecutiveCorrect);

      if (element) {
        const rect = element.getBoundingClientRect();
        game.showFloatingXP(result.xp, rect.left + rect.width / 2, rect.top);
      }
    } else {
      if (element) element.classList.add('wrong');
      options.forEach(opt => {
        if (opt.querySelector('.quiz-option-char') && opt.querySelector('.quiz-option-char').textContent === question.correctChar) {
          opt.classList.add('correct');
        }
      });

      game.onWrongAnswer();
      score.wrong++;
      wrongQuestions.push(question);

      if (window.StorageManager) {
        window.StorageManager.addWrongCard({
          char: question.correctChar,
          pinyin: question.pinyin
        });
      }
    }

    safeSetTimeout(() => {
      if (state.hearts <= 0) {
        renderResult();
      } else {
        currentQuestionIndex++;
        renderQuestion(currentQuestionIndex);
      }
    }, 1200);
  }

  window.quizToggleRecording = function() {
    if (isRecording) {
      stopSpeakRecording();
    } else {
      startSpeakRecording();
    }
  };

  function startSpeakRecording() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia || !window.MediaRecorder) {
      showMicPermissionDenied();
      return;
    }

    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(function(stream) {
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
          stream.getTracks().forEach(track => track.stop());
          processSpeakRecording(audioBlob);
        };

        isRecording = true;
        recordStartTime = Date.now();
        mediaRecorder.start();
        startWaveAnimation();
        updateSpeakUI();
      })
      .catch(function(err) {
        console.error('麦克风权限获取失败:', err);
        showMicPermissionDenied();
      });
  }

  function showMicPermissionDenied() {
    const question = questions[currentQuestionIndex];
    game.showToast('需要麦克风权限才能进行跟读练习，跳过本题');
    safeSetTimeout(() => {
      currentQuestionIndex++;
      renderQuestion(currentQuestionIndex);
    }, 1500);
  }

  function stopSpeakRecording() {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.stop();
      isRecording = false;
      stopWaveAnimation();
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
    const waveContainer = document.getElementById('quizSpeakWave');
    if (!waveContainer) return;

    let barsHtml = '';
    const barCount = 24;
    for (let i = 0; i < barCount; i++) {
      const dataIndex = Math.floor(i * waveData.length / barCount);
      const height = (waveData[dataIndex] / 255) * 100;
      barsHtml += `<div class="quiz-wave-bar" style="height: ${Math.max(10, height)}%;"></div>`;
    }
    waveContainer.innerHTML = barsHtml;
  }

  function updateSpeakUI() {
    const micBtn = document.getElementById('quizMicBtn');
    const micHint = document.querySelector('.quiz-speak-mic-hint');
    if (micBtn) {
      micBtn.classList.toggle('recording', isRecording);
      const icon = micBtn.querySelector('.quiz-speak-mic-icon');
      if (icon) icon.textContent = isRecording ? '⏹' : '🎤';
    }
    if (micHint) {
      micHint.textContent = isRecording ? '再次点击停止录音' : '点击麦克风开始跟读';
    }
  }

  function calcMockScore(duration) {
    let min, max;
    if (duration < 1) {
      min = 40;
      max = 60;
    } else if (duration <= 3) {
      min = 60;
      max = 85;
    } else {
      min = 70;
      max = 95;
    }
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  async function processSpeakRecording(audioBlob) {
    const question = questions[currentQuestionIndex];
    const resultEl = document.getElementById('quizSpeakResult');
    const scoreEl = document.getElementById('quizSpeakScore');
    const scoreTextEl = document.getElementById('quizSpeakScoreText');
    const micBtn = document.getElementById('quizMicBtn');

    if (resultEl) {
      resultEl.style.display = 'block';
      scoreEl.textContent = '...';
      scoreTextEl.textContent = '评分中...';
    }
    if (micBtn) {
      micBtn.style.pointerEvents = 'none';
      micBtn.style.opacity = '0.6';
    }

    let finalScore = 0;
    let isMock = false;

    try {
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      
      await new Promise((resolve, reject) => {
        reader.onloadend = resolve;
        reader.onerror = reject;
      });

      const base64Data = reader.result.split(',')[1];

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
          ref_text: question.correctChar
        })
      });

      if (!response.ok) {
        throw new Error('API请求失败');
      }

      const data = await response.json();
      finalScore = data.score || data.total_score || calcMockScore(recordDuration);
    } catch (err) {
      console.warn('语音评测API失败，使用模拟评分:', err);
      finalScore = calcMockScore(recordDuration);
      isMock = true;
    }

    if (scoreEl) scoreEl.textContent = finalScore + '分';
    if (scoreTextEl) {
      if (finalScore >= 80) {
        scoreTextEl.textContent = '太棒了！发音很标准';
        scoreTextEl.style.color = '#58CC02';
      } else if (finalScore >= 60) {
        scoreTextEl.textContent = '不错哦！继续加油';
        scoreTextEl.style.color = '#F59E0B';
      } else {
        scoreTextEl.textContent = '还需要练习，再试一次';
        scoreTextEl.style.color = '#EF4444';
      }
      if (isMock) {
        scoreTextEl.textContent += '（演示）';
      }
    }

    const isCorrect = finalScore >= 60;
    
    safeSetTimeout(() => {
      handleSpeakAnswer(isCorrect, finalScore, question);
    }, 1500);
  }

  function handleSpeakAnswer(isCorrect, scoreValue, question) {
    if (isCorrect) {
      const result = game.onSpeakPractice(scoreValue);
      score.correct++;
      score.xp += result.xp;
      score.coins += result.coins;
      maxCombo = Math.max(maxCombo, state.consecutiveCorrect);
      game.showToast(`🎉 发音评分 ${scoreValue} 分，太棒了！`);
    } else {
      game.onWrongAnswer();
      score.wrong++;
      wrongQuestions.push(question);
      game.showToast(`发音评分 ${scoreValue} 分，继续加油！`);
      
      if (window.StorageManager) {
        window.StorageManager.addWrongCard({
          char: question.correctChar,
          pinyin: question.pinyin
        });
      }
    }

    safeSetTimeout(() => {
      if (state.hearts <= 0) {
        renderResult();
      } else {
        currentQuestionIndex++;
        renderQuestion(currentQuestionIndex);
      }
    }, 1500);
  }

  function renderResult() {
    if (destroyed || window.currentPage !== 'quiz') return;
    
    const total = questions.length;
    const accuracy = total > 0 ? Math.round((score.correct / total) * 100) : 0;
    const resultEmoji = accuracy >= 80 ? '🎉' : accuracy >= 60 ? '👍' : '💪';
    const resultText = accuracy >= 80 ? '太棒了！' : accuracy >= 60 ? '不错哦！' : '继续加油！';

    if (window.StorageManager) {
      window.StorageManager.addDailyExercised(total);
    }

    container.innerHTML = `
      <div class="quiz-page">
        <div class="quiz-result-container">
          <div class="quiz-result-emoji">${resultEmoji}</div>
          <div class="quiz-result-title">${resultText}</div>
          <div class="quiz-result-subtitle">练习完成</div>

          <div class="quiz-stats-grid">
            <div class="quiz-stat-card">
              <div class="quiz-stat-value correct">${score.correct}</div>
              <div class="quiz-stat-label">答对</div>
            </div>
            <div class="quiz-stat-card">
              <div class="quiz-stat-value wrong">${score.wrong}</div>
              <div class="quiz-stat-label">答错</div>
            </div>
            <div class="quiz-stat-card">
              <div class="quiz-stat-value accuracy">${accuracy}%</div>
              <div class="quiz-stat-label">正确率</div>
            </div>
          </div>

          <div class="quiz-rewards-section">
            <div class="quiz-rewards-title">获得奖励</div>
            <div class="quiz-rewards-row">
              <div class="quiz-reward-item">
                <span class="quiz-reward-icon">⭐</span>
                <span class="quiz-reward-text">+${score.xp} XP</span>
              </div>
              <div class="quiz-reward-item">
                <span class="quiz-reward-icon">💰</span>
                <span class="quiz-reward-text">+${score.coins} 识字币</span>
              </div>
              <div class="quiz-reward-item">
                <span class="quiz-reward-icon">🔥</span>
                <span class="quiz-reward-text">最高 ${maxCombo} 连击</span>
              </div>
            </div>
          </div>

          ${wrongQuestions.length > 0 ? `
            <div class="quiz-wrong-review">
              <div class="quiz-wrong-title">错题回顾</div>
              <div class="quiz-wrong-list">
                ${wrongQuestions.map(q => `
                  <div class="quiz-wrong-item" onclick="navigateToChar('${esc(q.correctChar)}')">
                    <div class="quiz-wrong-char">${esc(q.correctChar)}</div>
                    <div class="quiz-wrong-pinyin">${esc(q.pinyin)}</div>
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}

          <div class="quiz-result-actions">
            <button class="quiz-btn-primary" onclick="startQuiz()">
              🔄 再来一组
            </button>
            <button class="quiz-btn-secondary" onclick="navigateTo('exercise')">
              返回练习
            </button>
          </div>
        </div>
      </div>
    `;
  }

  window.startQuiz = function() {
    if (destroyed) return;
    questions = generateQuestions();
    currentQuestionIndex = 0;
    score = { correct: 0, wrong: 0, xp: 0, coins: 0 };
    wrongQuestions = [];
    maxCombo = 0;
    renderQuestion(currentQuestionIndex);
  };

  startQuiz();
};
